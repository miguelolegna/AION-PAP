// src/components/Booking/DurationSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../styles/GlobalStyles';
import { CreateBookingScreenStyles as styles } from '../../styles/Screens/CreateBookingScreenStyles';

interface Props {
  duration: number;
  onOpenPicker: () => void;
  onSelectShortcut: (mins: number) => void;
}

export const DurationSelector = ({ duration, onOpenPicker, onSelectShortcut }: Props) => (
  <View>
    <TouchableOpacity style={[styles.pickerWrapper, styles.durationMainPicker]} onPress={onOpenPicker}>
      <MaterialCommunityIcons name="timer-outline" size={22} color={Colors.primary} />
      <Text style={styles.durationMainText}>
        {Math.floor(duration / 60)}h {duration % 60}min
      </Text>
      <Ionicons name="chevron-down" size={20} color={Colors.primary} />
    </TouchableOpacity>

    <View style={styles.durationRow}>
      {[30, 60, 120, 180].map((mins) => (
        <TouchableOpacity 
          key={mins}
          onPress={() => onSelectShortcut(mins)}
          style={[styles.durationBtn, duration === mins && { backgroundColor: Colors.primary }]}
        >
          <Text style={[styles.durationText, { color: duration === mins ? '#FFF' : Colors.dark }]}>
            {mins >= 60 ? `${mins/60}h` : `${mins}m`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);