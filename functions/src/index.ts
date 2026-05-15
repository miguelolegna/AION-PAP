// functions/src/index.ts
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// AUXILIARES E CONFIGURAÇÃO GLOBAL
// ============================================================================

let stripeInstance: any = null;
const getStripe = (): any => {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) return null;
        stripeInstance = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
    }
    return stripeInstance;
};

// Cache global para otimização de custos de leitura (Read Operations)
let cachedPricingConfig: any = null;
let lastCacheUpdate = 0;

const getPricingConfig = async () => {
    const now = Date.now();
    if (cachedPricingConfig && (now - lastCacheUpdate < 3600000)) return cachedPricingConfig;
    const doc = await db.collection("system_configs").doc("pricing_algorithm").get();
    if (!doc.exists) throw new HttpsError("internal", "Configuração económica ausente no Firestore.");
    cachedPricingConfig = doc.data();
    lastCacheUpdate = now;
    return cachedPricingConfig;
};

const calcularTarifaDinamica = (config: any, p_base: number, potencia: number, city: string, isVazio: boolean, ocupacaoAlta: boolean) => {
    const deltas = config.deltas;
    let tier = deltas.tier.nivel_3;
    if (potencia <= deltas.tier.nivel_1.max_kw) tier = deltas.tier.nivel_1;
    else if (potencia <= deltas.tier.nivel_2.max_kw) tier = deltas.tier.nivel_2;

    const d_tempo = isVazio ? deltas.tempo.vazio : deltas.tempo.fora_vazio;
    const d_micro = ocupacaoAlta ? deltas.micro.alta_ocupacao : deltas.micro.baixa_ocupacao;
    
    let d_macro = deltas.macro.valores.default;
    const cityFormatted = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "Default";
    
    if (deltas.macro.zonas.alta_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.alta_densidade;
    else if (deltas.macro.zonas.media_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.media_densidade;
    else if (deltas.macro.zonas.baixa_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.baixa_densidade;

    const somatorioDeltas = d_tempo + d_macro + d_micro + tier.multiplicador;
    const p_final_calc = p_base * (1 + somatorioDeltas);

    let p_final = Math.round(p_final_calc);
    p_final = Math.min(Math.max(p_final, tier.floor), tier.ceil);

    return { tarifaKwh: p_final, cativoHora: tier.ceil };
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
                    batch.update(doc.ref, { status: "cancelled_conflict", system_note: "Conflito de horário processado." });
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
        if (now > (created + gracePeriod)) batch.update(doc.ref, { status: "expired" });
    });
    await batch.commit();
});

export const monitorUserBehavior = onDocumentUpdated("bookings/{bookingId}", async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();
    if (newData?.status === "cancelled" && oldData?.status !== "cancelled") {
        const uid = newData.user_uid;
        const userRef = db.collection("users").doc(uid);
        const activeBookingsSnap = await db.collection("bookings").where("user_uid", "==", uid).where("status", "==", "active").get();

        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) return;
            const strikes = (userDoc.data()?.strikes || 0) + 1;
            const isBanned = strikes >= 5;
            let lockedToRelease = 0;

            if (isBanned) {
                activeBookingsSnap.docs.forEach(doc => {
                    const bData = doc.data();
                    lockedToRelease += (bData.custo_maximo_cativo || 0);
                    t.update(doc.ref, { status: "cancelled_banned", system_note: "Cancelamento administrativo." });
                });
            }
            t.update(userRef, { strikes, is_banned: isBanned, locked_balance: admin.firestore.FieldValue.increment(-lockedToRelease) });
        });
    }
});

// ============================================================================
// 2. INTEGRAÇÃO STRIPE
// ============================================================================

export const createTopUpIntent = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
    const stripe = getStripe();
    if (!stripe) throw new HttpsError("internal", "Configuração Stripe ausente.");
    const { amountEuros } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Não autenticado.");
    if (!amountEuros || amountEuros < 5) throw new HttpsError("invalid-argument", "Mínimo 5€.");

    const amountCents = Math.round(amountEuros * 100);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        metadata: { transactionType: "topup", userUid: uid, amountIons: amountCents }
    });
    return { clientSecret: paymentIntent.client_secret };
});

export const stripeWebhookHandler = onRequest({ secrets: ["STRIPE_WEBHOOK_SECRET", "STRIPE_SECRET_KEY"] }, async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
        res.status(500).send("Erro.");
        return; // Interrompe a execução sem retornar o objeto Response
    }

    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent((req as any).rawBody, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        res.status(400).send(`Erro: ${err.message}`);
        return; // Interrompe a execução
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as any;
        if (paymentIntent.metadata?.transactionType === "topup") {
            const uid = paymentIntent.metadata.userUid;
            const amountIons = parseInt(paymentIntent.metadata.amountIons, 10);
            const paymentRef = db.collection("processed_payments").doc(paymentIntent.id);
            const userRef = db.collection("users").doc(uid);

            await db.runTransaction(async (t) => {
                const paymentSnap = await t.get(paymentRef);
                if (paymentSnap.exists) return;
                t.set(paymentRef, { processed_at: admin.firestore.FieldValue.serverTimestamp(), amount: amountIons, user_uid: uid });
                t.update(userRef, { wallet_balance: admin.firestore.FieldValue.increment(amountIons) });
            });
        }
    }
    res.json({ received: true });
});

// ============================================================================
// 3. TRIPLE LEDGER (ACID TRANSACTIONS)
// ============================================================================

export const iniciarSessaoCarregamento = onCall(async (request) => {
    const { bookingId, duracaoHoras } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Acesso negado.");
    const bookingRef = db.collection("bookings").doc(bookingId);
    const userRef = db.collection("users").doc(uid);

    await db.runTransaction(async (t) => {
        const bookingSnap = await t.get(bookingRef);
        if (!bookingSnap.exists) throw new HttpsError("not-found", "Reserva inexistente.");
        const bookingData = bookingSnap.data()!;
        if (bookingData.user_uid !== uid) throw new HttpsError("permission-denied", "Acesso negado.");
        if (bookingData.status !== "accepted" && bookingData.status !== "pending") throw new HttpsError("failed-precondition", "Estado inválido.");

        const chargerSnap = await t.get(db.collection("chargers").doc(bookingData.charger_id));
        const chargerData = chargerSnap.data()!;
        const config = await getPricingConfig();
        const agora = new Date();
        const isVazio = agora.getHours() >= 0 && agora.getHours() < 7;

        const { tarifaKwh, cativoHora } = calcularTarifaDinamica(
            config, 
            chargerData.p_base || 0, 
            chargerData.potencia_kw || 0, 
            chargerData.address_city || "Default", 
            isVazio, 
            false
        );

        const custoMaximoCativo = Math.round(cativoHora * chargerData.potencia_kw * duracaoHoras);
        const userSnap = await t.get(userRef);
        const available = (userSnap.data()?.wallet_balance || 0) - (userSnap.data()?.locked_balance || 0);

        if (available < custoMaximoCativo) throw new HttpsError("resource-exhausted", "Saldo insuficiente.");

        t.update(userRef, { locked_balance: admin.firestore.FieldValue.increment(custoMaximoCativo) });
        t.update(bookingRef, { status: "active", custo_maximo_cativo: custoMaximoCativo, preco_kwh_congelado: tarifaKwh, session_start: admin.firestore.FieldValue.serverTimestamp() });
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
        const bookingData = bookingSnap.data()!;
        if (bookingData.status !== "active") throw new HttpsError("failed-precondition", "Sessão inativa.");
        if (bookingData.user_uid !== uid && bookingData.owner_uid !== uid) throw new HttpsError("permission-denied", "Acesso negado.");

        const driverRef = db.collection("users").doc(bookingData.user_uid);
        const hostRef = db.collection("users").doc(bookingData.owner_uid);
        const custoFinal = Math.round(kwhConsumidos * (bookingData.preco_kwh_congelado || 0));
        const lucroHost = Math.round(custoFinal * 0.80);

        t.update(driverRef, { wallet_balance: admin.firestore.FieldValue.increment(-custoFinal), locked_balance: admin.firestore.FieldValue.increment(-(bookingData.custo_maximo_cativo || 0)) });
        t.update(hostRef, { wallet_balance: admin.firestore.FieldValue.increment(lucroHost) });
        t.update(bookingRef, { status: "completed", kwh_declarados: kwhConsumidos, custo_final: custoFinal, session_end: admin.firestore.FieldValue.serverTimestamp() });
    });
    return { success: true };
});