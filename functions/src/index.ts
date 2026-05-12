import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// AUXILIARES E CONFIGURAÇÃO
// ============================================================================

let stripeInstance: any = null;

const getStripe = (): any => {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) return null;
        stripeInstance = new Stripe(key, {
            apiVersion: "2026-04-22.dahlia", // Mantém uma versão estável oficial
        });
    }
    return stripeInstance;
};

// Cálculo processado na moeda virtual (IONS)
const calcularTarifas = (potenciaKw: number, duracaoHoras: number, precoBaseHostEuros: number) => {
    let margemEuros = potenciaKw <= 3.7 ? 0.05 : potenciaKw <= 22 ? 0.12 : 0.25;
    const tarifaKwhEuros = precoBaseHostEuros + margemEuros;
    
    // Converte para IONS e força Inteiro (Ex: 0.35€ = 35 IONS)
    const tarifaKwhIons = Math.round(tarifaKwhEuros * 100);
    // Custo Máximo forçado a Inteiro
    const custoMaximoIons = Math.round(tarifaKwhIons * potenciaKw * duracaoHoras);

    return {
        tarifaKwh: tarifaKwhIons,
        custoMaximo: custoMaximoIons
    };
};

// ============================================================================
// 1. GESTÃO DE RESERVAS E MODERAÇÃO
// ============================================================================

export const handleBookingAccepted = onDocumentUpdated("bookings/{bookingId}", async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();

    if (!newData || !oldData) return;

    if (oldData.status === "pending" && newData.status === "accepted") {
        const { user_uid, start_time, end_time } = newData;

        const overlappingQuery = db.collection("bookings")
            .where("user_uid", "==", user_uid)
            .where("status", "==", "pending")
            .where("start_time", "<", end_time);

        const snapshot = await overlappingQuery.get();
        const batch = db.batch();

        snapshot.forEach(doc => {
            if (doc.id !== event.params.bookingId) {
                const data = doc.data();
                if (data.end_time > start_time) {
                    batch.update(doc.ref, { 
                        status: "cancelled_conflict",
                        system_note: "Conflito de horário processado."
                    });
                }
            }
        });
        await batch.commit();
    }
});

export const autoCancelExpiredBookings = onSchedule("every 15 minutes", async () => {
    const now = admin.firestore.Timestamp.now().toMillis();
    const snapshot = await db.collection("bookings").where("status", "==", "pending").get();
    const batch = db.batch();
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const start = data.start_time.toMillis();
        const created = data.created_at.toMillis();
        
        const gracePeriod = Math.max(2 * 3600000, (start - created) / 2);
        
        if (now > (created + gracePeriod)) {
            batch.update(doc.ref, { status: "expired" });
        }
    });
    await batch.commit();
});

export const monitorUserBehavior = onDocumentUpdated("bookings/{bookingId}", async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();

    if (newData?.status === "cancelled" && oldData?.status !== "cancelled") {
        const uid = newData.user_uid;
        const userRef = db.collection("users").doc(uid);
        
        // Pré-carrega reservas ativas para evitar leituras de coleção dentro da transação ACID
        const activeBookingsSnap = await db.collection("bookings")
            .where("user_uid", "==", uid)
            .where("status", "==", "active")
            .get();

        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) return;

            const strikes = (userDoc.data()?.strikes || 0) + 1;
            const isBanned = strikes >= 5;
            let lockedToRelease = 0;

            // Se o utilizador for banido, cancela sessões ativas e liberta o cativo em deadlock
            if (isBanned) {
                activeBookingsSnap.docs.forEach(doc => {
                    const bData = doc.data();
                    lockedToRelease += (bData.custo_maximo_cativo || 0);
                    t.update(doc.ref, { 
                        status: "cancelled_banned", 
                        system_note: "Cancelamento administrativo automático." 
                    });
                });
            }

            t.update(userRef, { 
                strikes,
                is_banned: isBanned,
                locked_balance: admin.firestore.FieldValue.increment(-lockedToRelease)
            });
        });
    }
});

// ============================================================================
// 2. INTEGRAÇÃO STRIPE: TOP-UP DE CARTEIRA (AQUISIÇÃO DE IONS)
// ============================================================================

export const createTopUpIntent = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
    const stripe = getStripe();
    if (!stripe) throw new HttpsError("internal", "Configuração da Stripe ausente.");

    const { amountEuros } = request.data;
    const uid = request.auth?.uid;
    
    if (!uid) throw new HttpsError("unauthenticated", "Não autenticado.");
    if (!amountEuros || amountEuros < 5) throw new HttpsError("invalid-argument", "Montante mínimo de Top-Up é 5€.");

    const amountCents = Math.round(amountEuros * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        // Substitui os metadados atuais por isto:
        metadata: { 
            transactionType: "topup",
            userUid: uid,
            amountIons: amountCents
        }
    });

    return {
        clientSecret: paymentIntent.client_secret
    };
});

export const stripeWebhookHandler = onRequest({ secrets: ["STRIPE_WEBHOOK_SECRET", "STRIPE_SECRET_KEY"] }, async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
        res.status(500).send("Erro interno.");
        return;
    }

    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            (req as any).rawBody, 
            sig as string, 
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        res.status(400).send(`Erro: ${err.message}`);
        return;
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as any;
        
        if (paymentIntent.metadata?.transactionType === "topup") {
            const uid = paymentIntent.metadata.userUid;
            const amountIons = parseInt(paymentIntent.metadata.amountIons, 10);           
            const paymentId = paymentIntent.id;
            const paymentRef = db.collection("processed_payments").doc(paymentId);
            const userRef = db.collection("users").doc(uid);
            
            // Garantia de Idempotência: Impede que a Stripe duplique saldo no caso de reenvio do Webhook
            await db.runTransaction(async (t) => {
                const paymentSnap = await t.get(paymentRef);
                if (paymentSnap.exists) {
                    console.log(`Webhook: Pagamento ${paymentId} já processado. Execução abortada para prevenir duplo incremento.`);
                    return;
                }
                
                t.set(paymentRef, {
                    processed_at: admin.firestore.FieldValue.serverTimestamp(),
                    amount: amountIons,
                    user_uid: uid
                });
                
                t.update(userRef, {
                    wallet_balance: admin.firestore.FieldValue.increment(amountIons)
                });
            });
        }
    }

    res.json({ received: true });
});

// ============================================================================
// 3. TRIPLE LEDGER: RESERVAS E LIQUIDAÇÃO P2P (ACID TRANSACTIONS)
// ============================================================================

export const iniciarSessaoCarregamento = onCall(async (request) => {
    const { bookingId, duracaoHoras } = request.data;
    const uid = request.auth?.uid;

    if (!uid) throw new HttpsError("unauthenticated", "Acesso negado.");
    if (!bookingId || !duracaoHoras) throw new HttpsError("invalid-argument", "Dados incompletos.");

    const bookingRef = db.collection("bookings").doc(bookingId);
    const userRef = db.collection("users").doc(uid);

    await db.runTransaction(async (t) => {
        const bookingSnap = await t.get(bookingRef);
        if (!bookingSnap.exists) throw new HttpsError("not-found", "Reserva inexistente.");
        
        const bookingData = bookingSnap.data()!;
        if (bookingData.user_uid !== uid) throw new HttpsError("permission-denied", "Reserva alheia.");
        
        // Permite início direto em reservas pendentes para fluxos instantâneos (ou accepted para aprovação manual)
        if (bookingData.status !== "accepted" && bookingData.status !== "pending") {
            throw new HttpsError("failed-precondition", "Estado inválido para início.");
        }

        const chargerSnap = await t.get(db.collection("chargers").doc(bookingData.charger_id));
        const chargerData = chargerSnap.data()!;
        
        // CORREÇÃO CRÍTICA: Leitura exata da chave guardada no Firestore (preco_kwh) com fallback para 0
        const precoHostEuros = chargerData.preco_kwh || 0;

        const { tarifaKwh, custoMaximo } = calcularTarifas(chargerData.potencia_kw, duracaoHoras, precoHostEuros);

        const userSnap = await t.get(userRef);
        const userData = userSnap.data()!;
        
        const walletBalance = userData.wallet_balance || 0;
        const lockedBalance = userData.locked_balance || 0;
        const availableBalance = walletBalance - lockedBalance;

        // Regra de Falha (Fail-Fast)
        if (availableBalance < custoMaximo) {
            throw new HttpsError("resource-exhausted", `Saldo insuficiente. Necessários: ${custoMaximo} IONS.`);
        }

        // FASE 1: Caução Atómica (Smart Lock) com Inteiros absolutos
        t.update(userRef, {
            locked_balance: admin.firestore.FieldValue.increment(custoMaximo)
        });

        t.update(bookingRef, {
            status: "active",
            custo_maximo_cativo: custoMaximo,
            preco_kwh_congelado: tarifaKwh,
            session_start: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    return { success: true };
});

export const finalizarSessaoCarregamento = onCall(async (request) => {
    const { bookingId, kwhConsumidos } = request.data;
    const uid = request.auth?.uid;

    if (!uid) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    const bookingRef = db.collection("bookings").doc(bookingId);

    await db.runTransaction(async (t) => {
        const bookingSnap = await t.get(bookingRef);
        if (!bookingSnap.exists) throw new HttpsError("not-found", "Reserva inexistente.");
        
        const bookingData = bookingSnap.data()!;
        if (bookingData.status !== "active") throw new HttpsError("failed-precondition", "A reserva não está ativa.");

        if (bookingData.user_uid !== uid && bookingData.owner_uid !== uid) {
            throw new HttpsError("permission-denied", "Acesso não autorizado.");
        }

        const driverRef = db.collection("users").doc(bookingData.user_uid);
        const hostRef = db.collection("users").doc(bookingData.owner_uid);

        const custoFinalIons = Math.round(kwhConsumidos * bookingData.preco_kwh_congelado);
        const cativoOriginal = bookingData.custo_maximo_cativo;
        
        // FASE 3: Liquidação Interna (Barter)
        const lucroAnfitriao = Math.round(custoFinalIons * 0.80);

        t.update(driverRef, {
            wallet_balance: admin.firestore.FieldValue.increment(-custoFinalIons),
            locked_balance: admin.firestore.FieldValue.increment(-cativoOriginal)
        });

        t.update(hostRef, {
            wallet_balance: admin.firestore.FieldValue.increment(lucroAnfitriao)
        });

        t.update(bookingRef, {
            status: "completed",
            kwh_declarados: kwhConsumidos,
            custo_final: custoFinalIons,
            session_end: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    return { success: true };
});