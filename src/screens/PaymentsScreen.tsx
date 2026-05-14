// src/screens/PaymentsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
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

  const [walletBalance, setWalletBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Custom Input State
  const [selectedAmountEuros, setSelectedAmountEuros] = useState<number>(10);
  const [customInput, setCustomInput] = useState<string>('');

  const topUpOptions = [5, 10, 20, 50];

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
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

  // Deriva o valor final (em euros e em IONS) baseado no facto de o user estar a usar os botões ou o input
  const effectiveEuros = customInput !== '' ? parseFloat(customInput) || 0 : selectedAmountEuros;
  const effectiveIons = Math.floor(effectiveEuros * 100);

  const handleTopUp = async () => {
    if (processing) return;
    if (effectiveEuros < 5) {
        return Alert.alert("Mínimo Inválido", "O valor mínimo de carregamento é 5€.");
    }
    
    setProcessing(true);

    try {
      const createIntent = httpsCallable(functions, 'createTopUpIntent');
      const response = await createIntent({ amountEuros: effectiveEuros });
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
        Alert.alert("Sucesso", `O teu Top-Up de ${effectiveIons} IONS está a ser processado.`);
        setCustomInput(''); // Reset após sucesso
      }

    } catch (error: any) {
      Alert.alert("Erro na Transação", error.message || "Ocorreu um erro ao processar o pagamento.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectPreset = (amount: number) => {
    setCustomInput('');
    setSelectedAmountEuros(amount);
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
            style={[styles.amountOption, (selectedAmountEuros === amount && customInput === '') && styles.amountOptionSelected]}
            onPress={() => handleSelectPreset(amount)}
          >
            <FontAwesome6 name="coins" size={18} color={(selectedAmountEuros === amount && customInput === '') ? "#FFF" : Colors.primary} />
            <Text style={[styles.amountText, (selectedAmountEuros === amount && customInput === '') && styles.amountTextSelected]}>
              {amount * 100} 
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 15, marginBottom: 25 }}>
        <Text style={{ fontSize: 14, color: Colors.dark, fontWeight: 'bold', marginBottom: 8 }}>Valor Personalizado (€)</Text>
        <TextInput
            style={{
                backgroundColor: Colors.white,
                borderWidth: 2,
                borderColor: customInput !== '' ? Colors.primary : Colors.border,
                borderRadius: 12,
                padding: 15,
                fontSize: 18,
                color: Colors.dark,
            }}
            placeholder="Ex: 15"
            keyboardType="numeric"
            value={customInput}
            onChangeText={setCustomInput}
        />
        {effectiveIons > 0 && (
            <Text style={{ textAlign: 'right', marginTop: 8, color: Colors.primary, fontWeight: 'bold' }}>
                Vais receber: {effectiveIons} IONS
            </Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.payButton} 
        onPress={handleTopUp} 
        disabled={processing || effectiveEuros < 5}
      >
        {processing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="card" size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.payButtonText}>Pagar {effectiveEuros > 0 ? effectiveEuros.toFixed(2) : "0.00"} €</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PaymentsScreen;