import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBooking } from '../services/ChargerService';
import { useAuth } from '../context/AuthContext';
import { BookingsStyles as styles } from '../styles/Screens/BookingsStyles';
import { Colors } from '../styles/GlobalStyles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const CreateBookingScreen = ({ route, navigation }: any) => {
  const { charger } = route.params; 
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [duration, setDuration] = useState(60);

  const estimatedKwh = (charger.potencia_kw * (duration / 60)).toFixed(2);
  const estimatedPrice = (parseFloat(estimatedKwh) * charger.preco_kwh).toFixed(2);

  const handleConfirmBooking = async () => {
    if (!user) return Alert.alert("Erro", "Sessão expirada.");
    setLoading(true);
    const result = await createBooking({
      charger_id: charger.id,
      charger_address: charger.morada,
      user_uid: user.uid,
      owner_uid: charger.owner_uid,
      start_time: date,
      end_time: new Date(date.getTime() + duration * 60000),
      estimated_kwh: parseFloat(estimatedKwh),
      total_price: parseFloat(estimatedPrice),
    });
    setLoading(false);
    if (result.success) {
      Alert.alert("Sucesso", "Reserva enviada para aprovação!", [
        { text: "OK", onPress: () => navigation.navigate('MainTabs', { screen: 'Reservas' }) }
      ]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.stationCard}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="ev-station" size={30} color={Colors.primary} />
          </View>
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{charger.morada}</Text>
            <Text style={styles.stationSub}>{charger.potencia_kw} kW • {charger.tipo_tomada}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>1. Quando quer carregar?</Text>
        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={date}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour={true}
            minimumDate={new Date()}
            onChange={(event, selectedDate) => setDate(selectedDate || date)}
          />
        </View>

        <Text style={styles.sectionLabel}>2. Durante quanto tempo?</Text>
        <View style={styles.durationRow}>
          {[30, 60, 120, 180].map((mins) => (
            <TouchableOpacity 
              key={mins}
              onPress={() => setDuration(mins)}
              style={[
                styles.durationBtn,
                { backgroundColor: duration === mins ? Colors.primary : '#F1F3F5' }
              ]}
            >
              <Text style={[styles.durationText, { color: duration === mins ? '#FFF' : Colors.dark }]}>
                {mins >= 60 ? `${mins/60}h` : `${mins}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Resumo Estimado</Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryText}>Consumo: {estimatedKwh} kWh</Text>
              <Text style={styles.summaryText}>Duração: {duration} min</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalPrice}>{estimatedPrice} €</Text>
              <Text style={styles.moduleBadge}>Módulo D: Pagamento via App</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmBooking} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Text style={styles.confirmBtnText}>SOLICITAR RESERVA</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CreateBookingScreen;