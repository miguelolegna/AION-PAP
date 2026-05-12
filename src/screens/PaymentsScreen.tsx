import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/GlobalStyles';
import { PaymentsStyles as styles } from '../styles/Screens/PaymentsStyles';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';

const PaymentsScreen = () => {
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Estados do Ledger (Inteiros Puros)
  const [walletBalance, setWalletBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedAmountEuros, setSelectedAmountEuros] = useState(10); // Opções em Euros

  const topUpOptions = [5, 10, 20, 50];

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Leitura nativa de inteiros
        const wBalance = Math.floor(data.wallet_balance || 0);
        const lBalance = Math.floor(data.locked_balance || 0);
        
        setWalletBalance(wBalance);
        setLockedBalance(lBalance);
        setAvailableBalance(wBalance - lBalance);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao ler ledger:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleTopUp = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      const createIntent = httpsCallable(functions, 'createTopUpIntent');
      const response = await createIntent({ amountEuros: selectedAmountEuros });
      const { clientSecret } = response.data as any;

      if (!clientSecret) throw new Error("Falha ao gerar o token de pagamento.");

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'AION Network',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: { name: user?.email || 'Condutor AION' },
        applePay: { merchantCountryCode: 'PT' },
        googlePay: { merchantCountryCode: 'PT', testEnv: true },
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') throw new Error(presentError.message);
      } else {
        // Conversão visual apenas para o Alerta. 10€ = 1000 IONS.
        Alert.alert("Sucesso", `O teu Top-Up de ${selectedAmountEuros * 100} IONS está a ser processado. O saldo atualizará em breve.`);
      }

    } catch (error: any) {
      Alert.alert("Erro na Transação", error.message || "Ocorreu um erro ao processar o pagamento.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>A Minha Carteira</Text>

      <View style={styles.ledgerCard}>
        <View style={styles.ledgerHeader}>
          <Text style={styles.ledgerTitle}>Saldo Disponível</Text>
          <Ionicons name="information-circle-outline" size={20} color="#FFF" />
        </View>
        
        {/* Remoção do .toFixed(2) - Exibição de Inteiros */}
        <Text style={styles.availableBalance}>{availableBalance} IONS</Text>
        
        <View style={styles.ledgerDivider} />
        
        <View style={styles.ledgerRow}>
          <Text style={styles.ledgerLabel}>Total na Carteira:</Text>
          <Text style={styles.ledgerValue}>{walletBalance} IONS</Text>
        </View>
        <View style={styles.ledgerRow}>
          <Text style={styles.ledgerLabel}>Cativo (Reservas Ativas):</Text>
          <Text style={[styles.ledgerValue, { color: '#FFD54F' }]}>- {lockedBalance} IONS</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Comprar IONS (Top-Up)</Text>
      <Text style={styles.sectionSubtitle}>1 Euro = 100 IONS</Text>

      <View style={styles.optionsGrid}>
        {topUpOptions.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[styles.amountOption, selectedAmountEuros === amount && styles.amountOptionSelected]}
            onPress={() => setSelectedAmountEuros(amount)}
          >
            <FontAwesome6 name="coins" size={18} color={selectedAmountEuros === amount ? "#FFF" : Colors.primary} />
            <Text style={[styles.amountText, selectedAmountEuros === amount && styles.amountTextSelected]}>
              {amount * 100} {/* Exibe 500, 1000, 2000, 5000 */}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.payButton} 
        onPress={handleTopUp} 
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="card" size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.payButtonText}>Pagar {selectedAmountEuros} €</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PaymentsScreen;