// src/screens/ActiveSessionScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Colors } from '../styles/GlobalStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ActiveSessionScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completing, setCompleting] = useState(false);

  // 1. Listener em Tempo Real
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "bookings", bookingId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBooking({ id: snap.id, ...data });
        
        // Se a sessão já foi completada por outra via, sai deste ecrã
        if (data.status === 'completed' || data.status === 'cancelled') {
          navigation.navigate('MainTabs', { screen: 'Reservas' });
        }
      } else {
        Alert.alert("ERRO", "Reserva não encontrada.");
        navigation.navigate('MainTabs', { screen: 'Mapa' });
      }
    });
    return () => unsub();
  }, [bookingId]);

  // 2. Cronómetro de Frontend (Cosmético para a UI)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (booking?.status === 'active') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [booking?.status]);

  // 3. Cálculos Dinâmicos (UI)
  // Nota: Isto é apenas estimativa visual. O cálculo real de cobrança deve ser feito no backend.
  const minutes = elapsedSeconds / 60;
  const currentKwhRaw = booking ? (booking.charger_potencia * (minutes / 60)) : 0;
  const currentCostRaw = booking ? (currentKwhRaw * booking.charger_price) : 0;

  const currentKwhFormatted = currentKwhRaw.toFixed(2);
  const currentCostFormatted = currentCostRaw.toFixed(2);

  const confirmEndSession = () => {
    Alert.alert(
      "Terminar Carregamento",
      `Desejas encerrar a sessão agora?\nConsumo estimado: ${currentKwhFormatted} kWh\nCusto estimado: ${currentCostFormatted}€`,
      [
        { text: "Voltar", style: "cancel" },
        { text: "Sim, Finalizar", style: "destructive", onPress: () => handleEndSession() }
      ]
    );
  };

  const handleEndSession = async () => {
    setCompleting(true);
    try {
      // FIX DO ERRO TÉCNICO: Garante que estamos a enviar NÚMEROS e não Strings para o Firestore.
      // Firestore odeia NaN ou tipos incorretos.
      const finalPrice = parseFloat(parseFloat(currentCostFormatted).toFixed(2));
      const finalKwh = parseFloat(parseFloat(currentKwhFormatted).toFixed(2));

      await updateDoc(doc(db, "bookings", bookingId), {
        status: 'completed',
        end_time: Timestamp.now(),
        final_price: finalPrice, // Número
        final_kwh: finalKwh // Número
      });

      // navigation.navigate é tratado pelo listener do useEffect (1)
    } catch (e) {
      console.error("Erro Técnico EndSession:", e);
      Alert.alert("ERRO TÉCNICO", "Falha crítica ao comunicar com a base de dados ao encerrar.");
      setCompleting(false);
    }
  };

  if (!booking || completing) return (
    <View style={[styles.container, styles.whiteTheme]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {completing && <Text style={{ marginTop: 15, color: Colors.dark }}>A processar pagamento...</Text>}
    </View>
  );

  return (
    <View style={[styles.container, styles.whiteTheme]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        <MaterialCommunityIcons name="lightning-bolt" size={32} color={Colors.primary} />
        <Text style={styles.headerTitle}>Sessão Ativa</Text>
      </View>

      <Text style={styles.timer}>
        {Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:
        {Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
        {(elapsedSeconds % 60).toString().padStart(2, '0')}
      </Text>

      <View style={styles.metricsContainer}>
        <Text style={styles.costText}>{currentCostFormatted} €</Text>
        <Text style={styles.kwhText}>{currentKwhFormatted} kWh consumidos</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoAddress} numberOfLines={1}>{booking.charger_address}</Text>
        <Text style={styles.infoSub}>Potência: {booking.charger_potencia} kW • {booking.charger_price} €/kWh</Text>
      </View>

      <TouchableOpacity 
        onPress={confirmEndSession}
        style={[styles.endButton, { backgroundColor: Colors.danger }]}
      >
        <Text style={styles.endButtonText}>FINALIZAR CARREGAMENTO</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'space-between', alignItems: 'center' },
  whiteTheme: { backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark, marginLeft: 10 },
  timer: { fontSize: 64, fontWeight: 'bold', color: Colors.dark, fontVariant: ['tabular-nums'], marginTop: 30 },
  metricsContainer: { alignItems: 'center', marginVertical: 20 },
  costText: { fontSize: 52, fontWeight: 'bold', color: Colors.primary },
  kwhText: { fontSize: 16, color: Colors.gray, marginTop: 5, fontWeight: '500' },
  infoCard: { width: '100%', backgroundColor: Colors.white, padding: 20, borderRadius: 15, elevation: 2, borderWidth: 1, borderColor: Colors.border },
  infoAddress: { fontSize: 14, fontWeight: 'bold', color: Colors.dark, textAlign: 'center' },
  infoSub: { fontSize: 12, color: Colors.gray, marginTop: 4, textAlign: 'center' },
  endButton: { width: '100%', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 4 },
  endButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.8 }
});

export default ActiveSessionScreen;