// src/screens/ActiveSessionScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StatusBar, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebaseConfig';
import { ActiveSessionStyles as styles } from '../styles/Screens/ActiveSessionStyles';
import { Colors, GlobalStyles } from '../styles/GlobalStyles';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const ActiveSessionScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params;
  
  const [booking, setBooking] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [kwhInput, setKwhInput] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "bookings", bookingId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBooking({ id: snap.id, ...data });
        
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (booking?.status === 'active') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [booking?.status]);

  const handleEndSession = async () => {
    const kwh = parseFloat(kwhInput.replace(',', '.'));
    
    if (isNaN(kwh) || kwh <= 0) {
      return Alert.alert("Aviso", "Insere a quantidade de kWh consumida registada no posto ou no carro.");
    }

    Alert.alert(
      "Confirmar Liquidação",
      `Declaras que consumiste ${kwh} kWh? O capital correspondente será liquidado e a caução sobrante devolvida.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          style: "destructive", 
          onPress: async () => {
            setCompleting(true);
            try {
              const finalizarSessao = httpsCallable(functions, 'finalizarSessaoCarregamento');
              await finalizarSessao({
                bookingId: bookingId,
                kwhConsumidos: kwh
              });
            } catch (e: any) {
              console.error("Erro Técnico EndSession:", e);
              Alert.alert("Erro de Transação", e.message || "Falha crítica ao comunicar com a Cloud Function de liquidação.");
              setCompleting(false);
            }
          } 
        }
      ]
    );
  };

  if (!booking || completing) return (
    <View style={[GlobalStyles.container, styles.loadingContainer]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {completing && <Text style={styles.loadingText}>A processar liquidação interna...</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={GlobalStyles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[GlobalStyles.container, styles.innerContainer]}>
          <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
          
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={32} color={Colors.primary} />
            <Text style={styles.headerTitle}>Sessão Ativa</Text>
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:
              {Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
              {(elapsedSeconds % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.timerLabel}>Tempo de ligação</Text>
          </View>

          <View style={[GlobalStyles.cardItem, styles.cardItemMargin]}>
            <View style={styles.cardRow}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.warning} />
              <Text style={styles.cardLabel}>Capital Cativo (Segurança)</Text>
            </View>
            <Text style={styles.cardValueDark}>{booking.custo_maximo_cativo} IONS</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.cardRow}>
              <Ionicons name="flash-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardLabel}>Tarifa Congelada</Text>
            </View>
            <Text style={styles.cardValuePrimary}>{booking.preco_kwh_congelado} IONS/kWh</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputTitle}>Consumo Declarado</Text>
            <Text style={styles.inputDescription}>
              Para finalizar, verifica o contador do carro ou do posto e insere os kWh consumidos.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 15.2"
              keyboardType="numeric"
              value={kwhInput}
              onChangeText={setKwhInput}
              editable={!completing}
            />
          </View>

          <TouchableOpacity 
            onPress={handleEndSession}
            style={styles.endButton}
            disabled={completing}
          >
            <Text style={styles.endButtonText}>
              LIQUIDAR SESSÃO P2P
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ActiveSessionScreen;