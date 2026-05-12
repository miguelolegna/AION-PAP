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

import { DateTimeSelector } from '../components/booking/DateTimeSelector';
import { DurationSelector } from '../components/booking/DurationSelector';

const CreateBookingScreen = ({ route, navigation }: any) => {
  const { charger } = route.params; 
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [duration, setDuration] = useState(60); 
  const [showIosPicker, setShowIosPicker] = useState<'date' | 'time' | 'duration' | null>(null);

  // Estimativa puramente visual para UI (UX). 1 Euro = 100 IONS.
  const rawPriceFiat = charger.preco_kwh || charger.p_base || 0;
  const priceIonsPerKwh = rawPriceFiat * 100;
  const estimatedKwh = charger.potencia_kw * (duration / 60);
  const estimatedPriceIons = (estimatedKwh * priceIonsPerKwh).toFixed(2);

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
      if (userDoc.exists() && userDoc.data()?.is_banned) {
        setLoading(false);
        return Alert.alert(
          "ACESSO NEGADO", 
          "Conta suspensa por violação das normas do sistema. Operação abortada."
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

      // SUBMISSÃO ESTRITA (Infallibility Logic):
      // Apenas identidade e tempo. Sem anulação de tipos ou variáveis espúrias.
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
          <Text style={styles.summaryLabel}>Resumo Estimado</Text>
          <View style={[styles.summaryRow, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flex: 0.8 }}>
              <Text style={styles.summaryText}>Consumo: {estimatedKwh.toFixed(2)} kWh</Text>
              <Text style={styles.summaryText}>Duração: {duration} min</Text>
            </View>
            <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
              <Text 
                style={[styles.totalPrice, { fontSize: 26, textAlign: 'right' }]} 
                numberOfLines={1} 
                adjustsFontSizeToFit
              >
                {estimatedPriceIons} IONS
              </Text>
              <Text style={[styles.moduleBadge, { textAlign: 'right', marginTop: 4 }]}>Tarifa Dinâmica no Check-in</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]} 
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