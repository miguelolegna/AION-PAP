import { useStripe } from '@stripe/stripe-react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebaseConfig'; // Teu ficheiro de config
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function PaymentsScreen({ bookingId, duracao }: any) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handlePayment = async () => {
    try {
      // 1. Chamar a Cloud Function que criámos
      const createIntent = httpsCallable(functions, 'createStripePaymentIntent');
      const { data }: any = await createIntent({ bookingId, duracaoHoras: duracao });

      // 2. Inicializar o formulário nativo da Stripe
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'Aktie Charging',
        defaultBillingDetails: { currencyCode: 'EUR' }
      });

      if (initError) throw new Error(initError.message);

      // 3. Abrir o formulário de pagamento
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        console.log('Pagamento cancelado ou falhou');
      } else {
        alert('Pagamento processado! Aguarda confirmação.');
        // Aqui podes navegar para um ecrã de sucesso
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  return (
    <TouchableOpacity onPress={handlePayment} style={styles.button}>
      <Text>Pagar Agora</Text>
    </TouchableOpacity>
  );
}