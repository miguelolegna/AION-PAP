import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// 1. CANCELAMENTO EM CASCATA
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

// 2. AUTO-CANCELAMENTO (50% do tempo)
export const autoCancelExpiredBookings = onSchedule("every 15 minutes", async () => {
    const now = admin.firestore.Timestamp.now().toMillis();
    const snapshot = await db.collection("bookings").where("status", "==", "pending").get();
    const batch = db.batch();
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const start = data.start_time.toMillis();
        const created = data.created_at.toMillis();
        
        // $$L = T_{criacao} + \max(2h, \frac{T_{inicio} - T_{criacao}}{2})$$
        const gracePeriod = Math.max(2 * 3600000, (start - created) / 2);
        
        if (now > (created + gracePeriod)) {
            batch.update(doc.ref, { status: "expired" });
        }
    });
    await batch.commit();
});

// 3. MONITORIZAÇÃO DE COMPORTAMENTO
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