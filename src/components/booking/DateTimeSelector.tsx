// src/components/Booking/DateTimeSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/GlobalStyles';
import { CreateBookingScreenStyles as styles } from '../../styles/Screens/CreateBookingScreenStyles';

interface Props {
  date: Date;
  onOpenDate: () => void;
  onOpenTime: () => void;
}

export const DateTimeSelector = ({ date, onOpenDate, onOpenTime }: Props) => (
  <View style={styles.rowBetween}>
    <TouchableOpacity style={[styles.pickerWrapper, { flex: 0.56 }]} onPress={onOpenDate}>
      <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
      <Text style={styles.pickerText}>{date.toLocaleDateString('pt-PT')}</Text>
    </TouchableOpacity>

    <TouchableOpacity style={[styles.pickerWrapper, { flex: 0.4 }]} onPress={onOpenTime}>
      <Ionicons name="time-outline" size={20} color={Colors.primary} />
      <Text style={styles.pickerText}>
        {date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </TouchableOpacity>
  </View>
);