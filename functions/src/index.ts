// functions/src/index.ts
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
            apiVersion: "2026-04-22.dahlia", // Atualizado para a versão correta da API
        });
    }
    return stripeInstance;
};

// Cálculo processado na moeda virtual (IONS)
const calcularTarifaIons = (potenciaKw: number, duracaoHoras: number, precoBaseHost: number): number => {
    let margemPlataforma = 0;

    // A plataforma extrai a sua margem com base no desgaste/nível do posto
    if (potenciaKw <= 3.7) margemPlataforma = 0.05;      
    else if (potenciaKw <= 22) margemPlataforma = 0.12;  
    else margemPlataforma = 0.25;                        

    const precoFinalKwh = precoBaseHost + margemPlataforma;
    const custoTotal = precoFinalKwh * potenciaKw * duracaoHoras;
    
    return parseFloat(custoTotal.toFixed(2));
};

// ============================================================================
// 1. GESTÃO DE RESERVAS (LÓGICA ORIGINAL)
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
                        system_note: "Conflito de horário."
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
        const userRef = db.collection("users").doc(newData.user_uid);
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            const strikes = (userDoc.data()?.strikes || 0) + 1;
            t.update(userRef, { 
                strikes,
                is_banned: strikes >= 5 
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

    // Conversão 1:1 (Ex: 10 Euros = 10 IONS)
    const amountCents = Math.round(amountEuros * 100);

    // Débito imediato. Não há retenção (capture_method: "automatic"). Suporta MBWay.
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        metadata: { 
            transactionType: "topup",
            userUid: uid,
            amountIons: amountEuros 
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
        
        // Verifica se é uma transação de Top-Up
        if (paymentIntent.metadata?.transactionType === "topup") {
            const uid = paymentIntent.metadata.userUid;
            const amountIons = parseFloat(paymentIntent.metadata.amountIons);

            const userRef = db.collection("users").doc(uid);
            
            // Injeção de capital no Ledger
            await userRef.update({
                wallet_balance: admin.firestore.FieldValue.increment(amountIons)
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
        if (bookingData.status !== "accepted") throw new HttpsError("failed-precondition", "Estado inválido para início.");

        const chargerSnap = await t.get(db.collection("chargers").doc(bookingData.charger_id));
        const chargerData = chargerSnap.data()!;
        
        const custoMaximoIons = calcularTarifaIons(chargerData.potencia_kw, duracaoHoras, chargerData.p_base);

        const userSnap = await t.get(userRef);
        const userData = userSnap.data()!;
        
        const walletBalance = userData.wallet_balance || 0;
        const lockedBalance = userData.locked_balance || 0;
        const availableBalance = walletBalance - lockedBalance;

        // Regra de Falha (Fail-Fast)
        if (availableBalance < custoMaximoIons) {
            throw new HttpsError("resource-exhausted", `Saldo insuficiente. Necessários: ${custoMaximoIons} IONS.`);
        }

        // FASE 1: Caução Atómica (Smart Lock)
        t.update(userRef, {
            locked_balance: admin.firestore.FieldValue.increment(custoMaximoIons)
        });

        t.update(bookingRef, {
            status: "active",
            custo_maximo_cativo: custoMaximoIons,
            preco_kwh_congelado: chargerData.p_base + (chargerData.potencia_kw > 22 ? 0.25 : chargerData.potencia_kw > 3.7 ? 0.12 : 0.05),
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

        // Pode ser finalizado pelo condutor ou pelo anfitrião
        if (bookingData.user_uid !== uid && bookingData.owner_uid !== uid) {
            throw new HttpsError("permission-denied", "Acesso não autorizado.");
        }

        const driverRef = db.collection("users").doc(bookingData.user_uid);
        const hostRef = db.collection("users").doc(bookingData.owner_uid);

        // Cálculo Exato
        const custoFinalIons = parseFloat((kwhConsumidos * bookingData.preco_kwh_congelado).toFixed(2));
        const cativoOriginal = bookingData.custo_maximo_cativo;
        
        // FASE 3: Liquidação Interna (Barter)
        const lucroAnfitriao = parseFloat((custoFinalIons * 0.80).toFixed(2)); // 80% Líquido para o Host

        // Operações no Condutor (Debita o real, devolve a sobra libertando o cativo)
        t.update(driverRef, {
            wallet_balance: admin.firestore.FieldValue.increment(-custoFinalIons),
            locked_balance: admin.firestore.FieldValue.increment(-cativoOriginal)
        });

        // Operações no Anfitrião (Credita lucro)
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