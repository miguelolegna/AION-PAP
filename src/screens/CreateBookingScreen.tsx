import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { collection, query, where, getDocs, getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { createBooking } from '../services/ChargerService';
import { useAuth } from '../context/AuthContext';
import { CreateBookingScreenStyles as styles } from '../styles/Screens/CreateBookingScreenStyles';
import { Colors } from '../styles/GlobalStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePricingConfig } from '../context/ConfigContext';

import { DateTimeSelector } from '../components/booking/DateTimeSelector';
import { DurationSelector } from '../components/booking/DurationSelector';

const CreateBookingScreen = ({ route, navigation }: any) => {
  const { charger, p_final_simulated } = route.params; 
  const { user } = useAuth();
  const { pricing } = usePricingConfig();
  
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [duration, setDuration] = useState(60); 
  const [showIosPicker, setShowIosPicker] = useState<'date' | 'time' | 'duration' | null>(null);

  // ==========================================
  // LÓGICA FINANCEIRA DE CHECKOUT (PREVIEW)
  // ==========================================
  const estimatedKwh = charger.potencia_kw * (duration / 60);
  const estimatedPriceIons = Math.round(estimatedKwh * p_final_simulated);
  
  let cativoHora = p_final_simulated;
  if (pricing?.deltas?.tier) {
    const power = charger.potencia_kw || 0;
    const tierConfig = pricing.deltas.tier;
    let tier = tierConfig.nivel_3;
    if (power <= tierConfig.nivel_1.max_kw) tier = tierConfig.nivel_1;
    else if (power <= tierConfig.nivel_2.max_kw) tier = tierConfig.nivel_2;
    cativoHora = tier.ceil;
  }
  
  const custoMaximoCativoSimulado = Math.round(cativoHora * charger.potencia_kw * (duration / 60));

  const checkBookingLimits = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const dailyQuery = query(
      collection(db, "bookings"),
      where("user_uid", "==", user?.uid),
      where("created_at", ">=", Timestamp.fromDate(startOfDay))
    );

    const pendingQuery = query(
      collection(db, "bookings"),
      where("user_uid", "==", user?.uid),
      where("status", "==", "pending")
    );

    const [dailySnap, pendingSnap] = await Promise.all([
      getDocs(dailyQuery),
      getDocs(pendingQuery)
    ]);

    return {
      dailyExceeded: dailySnap.size >= 5,
      pendingExceeded: pendingSnap.size >= 3
    };
  };

  const handleConfirmBooking = async () => {
    if (!user) return Alert.alert("Erro", "Sessão expirada.");
    
    setLoading(true);

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      
      if (userDoc.exists() && userData?.is_banned) {
        setLoading(false);
        return Alert.alert(
          "ACESSO NEGADO", 
          "Conta suspensa por violação das normas do sistema. Operação abortada."
        );
      }

      const availableBalance = (userData?.wallet_balance || 0) - (userData?.locked_balance || 0);
      if (availableBalance < custoMaximoCativoSimulado) {
        setLoading(false);
        return Alert.alert(
          "SALDO INSUFICIENTE", 
          `Tens fundos insuficientes para cobrir a caução de segurança (Smart Lock).\n\nNecessário: ${custoMaximoCativoSimulado} IONS\nDisponível: ${availableBalance} IONS`
        );
      }

      const { dailyExceeded, pendingExceeded } = await checkBookingLimits();

      if (dailyExceeded) {
        setLoading(false);
        return Alert.alert("LIMITE ATINGIDO", "Cota diária de 5 reservas esgotada.");
      }

      if (pendingExceeded) {
        setLoading(false);
        return Alert.alert("LIMITE DE REDE", "Já tens 3 pedidos pendentes. Aguarda resposta.");
      }

      const result = await createBooking({
        charger_id: charger.id,
        user_uid: user.uid,
        owner_uid: charger.owner_uid,
        start_time: date,
        end_time: new Date(date.getTime() + duration * 60000),
        status: 'pending'
      }); 

      if (result.success) {
        Alert.alert("Sucesso", "Pedido enviado! Verifica o estado no separador Reservas.", [
          { text: "OK", onPress: () => navigation.navigate('MainTabs', { screen: 'Reservas' }) }
        ]);
      }
    } catch (error) {
      console.error("Erro na reserva:", error);
      Alert.alert("ERRO CRÍTICO", "Falha técnica ao processar a reserva. Operação interrompida.");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowIosPicker(null);
    if (event.type === 'set' && selectedDate) setDate(selectedDate);
  };

  const onDurationChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowIosPicker(null);
    if (event.type === 'set' && selectedTime) {
      const totalMinutes = selectedTime.getHours() * 60 + selectedTime.getMinutes();
      setDuration(totalMinutes > 0 ? totalMinutes : 1);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        <View style={styles.stationCard}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="ev-station" size={30} color={Colors.primary} />
          </View>
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{charger.morada}</Text>
            <Text style={styles.stationSub}>{charger.potencia_kw} kW • {charger.tipo_tomada || charger.tipo_ficha}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>1. Quando quer carregar?</Text>
        <DateTimeSelector 
          date={date} 
          onOpenDate={() => Platform.OS === 'android' ? 
            DateTimePickerAndroid.open({ value: date, onChange: onDateChange, mode: 'date', display: 'calendar' }) : 
            setShowIosPicker('date')}
          onOpenTime={() => Platform.OS === 'android' ? 
            DateTimePickerAndroid.open({ value: date, onChange: onDateChange, mode: 'time', display: 'spinner', is24Hour: true }) : 
            setShowIosPicker('time')}
        />

        <Text style={styles.sectionLabel}>2. Durante quanto tempo?</Text>
        <DurationSelector 
          duration={duration}
          onSelectShortcut={(mins: number) => setDuration(mins)}
          onOpenPicker={() => {
            const d = new Date(); d.setHours(Math.floor(duration/60), duration%60);
            Platform.OS === 'android' ? 
              DateTimePickerAndroid.open({ value: d, onChange: onDurationChange, mode: 'time', display: 'spinner', is24Hour: true }) : 
              setShowIosPicker('duration');
          }}
        />

        {Platform.OS === 'ios' && showIosPicker && (
          <DateTimePicker
            value={showIosPicker === 'duration' ? (() => { 
              const d = new Date(); d.setHours(Math.floor(duration/60), duration%60); return d; 
            })() : date}
            mode={showIosPicker === 'duration' ? 'time' : showIosPicker}
            display="spinner"
            is24Hour={true}
            onChange={showIosPicker === 'duration' ? onDurationChange : onDateChange}
            textColor={Colors.dark}
            accentColor={Colors.primary}
          />
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Resumo da Transação</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryColumnLeft}>
              <Text style={styles.summaryText}>Duração: {duration} min</Text>
              <Text style={styles.summaryText}>Consumo Estimado: {estimatedKwh.toFixed(2)} kWh</Text>
            </View>
            <View style={styles.summaryColumnRight}>
              <Text style={styles.summaryBasePriceLabel}>Custo Base Simulado</Text>
              <Text style={styles.totalPrice} adjustsFontSizeToFit numberOfLines={1}>
                {estimatedPriceIons} IONS
              </Text>
            </View>
          </View>

          <View style={styles.smartLockContainer}>
            <View style={styles.smartLockHeaderRow}>
              <Text style={styles.smartLockTitle}>Caução de Segurança</Text>
              <Text style={styles.smartLockValue}>{custoMaximoCativoSimulado} IONS</Text>
            </View>
            <Text style={styles.smartLockDesc}>
              A tarifa final será processada dinamicamente pelas Cloud Functions no check-in. Para tua segurança e da plataforma, a caução máxima ({cativoHora} IONS/hora) será congelada. O diferencial não gasto será devolvido automaticamente no fim da sessão.
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]} 
          onPress={handleConfirmBooking} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmBtnText}>SOLICITAR RESERVA</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CreateBookingScreen;