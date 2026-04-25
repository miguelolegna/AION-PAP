import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, onRequest } from "firebase-functions/v2/https";
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
            apiVersion: "2026-04-22.dahlia",
        });
    }
    return stripeInstance;
};

const calcularPrecoFinal = (potenciaKw: number, duracaoHoras: number): number => {
    const custoEnergiaMercado = 0.15; 
    let margemEscalao = 0;

    if (potenciaKw <= 3.7) margemEscalao = 0.05;      
    else if (potenciaKw <= 22) margemEscalao = 0.12;  
    else margemEscalao = 0.25;                        

    const precoKwh = custoEnergiaMercado + margemEscalao;
    const custoTotal = precoKwh * potenciaKw * duracaoHoras;
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
        
        // Limite de expiração: $$L = T_{criacao} + \max(2h, \frac{T_{inicio} - T_{criacao}}{2})$$
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
// 2. PAGAMENTOS (STRIPE INTEGRATION)
// ============================================================================

export const createStripePaymentIntent = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
    const stripe = getStripe();
    if (!stripe) throw new Error("Configuração da Stripe ausente.");

    const { bookingId, duracaoHoras } = request.data;
    const uid = request.auth?.uid;
    
    if (!uid) throw new Error("Não autenticado.");
    if (!bookingId || !duracaoHoras) throw new Error("Parâmetros inválidos.");

    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();
    
    if (!bookingSnap.exists) throw new Error("Reserva inexistente.");
    const bookingData = bookingSnap.data();

    const chargerSnap = await db.collection("chargers").doc(bookingData?.charger_id).get();
    const potenciaKw = chargerSnap.data()?.potencia_kw || 3.7;

    const finalAmountEuros = calcularPrecoFinal(potenciaKw, duracaoHoras);
    const amountCents = Math.round(finalAmountEuros * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "eur",
        metadata: { bookingId, userUid: uid }
    });

    await bookingRef.update({
        custo_total: finalAmountEuros,
        status: "aguarda_pagamento",
        stripe_payment_intent_id: paymentIntent.id
    });

    return {
        clientSecret: paymentIntent.client_secret,
        custoTotal: finalAmountEuros
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
        const bookingId = paymentIntent.metadata?.bookingId;

        if (bookingId) {
            await db.collection("bookings").doc(bookingId).update({
                status: "paga",
                pago_em: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    res.json({ received: true });
});