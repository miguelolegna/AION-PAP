import * as admin from 'firebase-admin';
import pricingData from '../src/config/pricing_algorithm.json';

const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seedPricing() {
  try {
    // Adiciona o timestamp do servidor aos metadados antes de injetar
    const dataToSeed = {
      ...pricingData,
      metadata: {
        ...pricingData.metadata,
        last_update: admin.firestore.FieldValue.serverTimestamp()
      }
    };

    await db.collection('system_configs').doc('pricing_algorithm').set(dataToSeed);
    console.log("✔️ Sucesso: Configuração de tarifação injetada em system_configs/pricing_algorithm");
  } catch (e) {
    console.error("❌ Falha crítica no seed de preços:", e);
  }
}

seedPricing();