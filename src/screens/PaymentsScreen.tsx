// src/screens/PaymentsScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebaseConfig';
import { PaymentsStyles as styles } from '../styles/Screens/PaymentsStyles';

export default function PaymentsScreen({ route, navigation }: any) {
  const { bookingId, duracao } = route.params;
  
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const createIntent = httpsCallable(functions, 'createStripePaymentIntent');
      const { data }: any = await createIntent({ bookingId, duracaoHoras: duracao });

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'AION Charging',
        applePay: {
          merchantCountryCode: 'PT',
        },
        googlePay: {
          merchantCountryCode: 'PT',
          testEnv: true, // Mandatório em modo de testes
          currencyCode: 'EUR',
        },
        allowsDelayedPaymentMethods: false,
      });

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        setLoading(false);
        // O utilizador fechou a folha de pagamento
        Alert.alert('Transação Cancelada', 'O pagamento não foi processado.');
      } else {
        setLoading(false);
        Alert.alert('Sucesso', 'Caução retida com sucesso. A sessão está ativa.');
        navigation.goBack(); 
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert(`Erro Técnico`, e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Autorizar Retenção</Text>
      <Text style={styles.subtitle}>
        Será retido o valor máximo estimado para a reserva. O ajuste final ocorrerá no término do carregamento.
      </Text>
      
      <TouchableOpacity 
        onPress={handlePayment} 
        style={styles.button}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>INSERIR DADOS</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.cancelButton}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>CANCELAR E VOLTAR</Text>
      </TouchableOpacity>
    </View>
  );
}