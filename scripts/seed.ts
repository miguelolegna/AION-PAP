// scripts/seed.ts
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inicialização
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedDatabase() {
  console.log("--- A INICIAR POVOAMENTO (COMMONJS) ---");

  try {
    const userId = "user_ts_demo";
    const userData = {
      nome: "Tiago AION",
      email: "tiago@AION.com",
      telefone: "+351910000000",
      rating_medio: 5.0,
      fcm_token: "",
      data_registo: admin.firestore.Timestamp.now(),
      is_verified: true
    };

    await db.collection('users').doc(userId).set(userData, { merge: true });
    console.log(`[OK] User: ${userId}`);

    const chargerData = {
      owner_uid: userId,
      localizacao: new admin.firestore.GeoPoint(38.7369, -9.1427),
      morada: "Saldanha, Lisboa",
      preco_kwh: 0.25,
      potencia_kw: 11,
      tipo_tomada: "Type 2",
      is_active: true,
      rating_medio: 4.8,
      num_reviews: 0
    };

    const chargerRef = await db.collection('chargers').add(chargerData);
    console.log(`[OK] Carregador: ${chargerRef.id}`);

    await chargerRef.collection('reviews').add({
      author_uid: "visitor_01",
      author_name: "Miguel",
      rating: 5,
      comentario: "Excelente localização!",
      timestamp: admin.firestore.Timestamp.now()
    });
    console.log(`[OK] Seed concluído com sucesso.`);

  } catch (error) {
    console.error("ERRO NO SEED:", error);
  }
}

seedDatabase();