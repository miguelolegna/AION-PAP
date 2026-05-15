import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/GlobalStyles';

export const DurationSelector = ({ duration, onSelectShortcut, onOpenPicker }: any) => {
  const shortcuts = [
    { label: '30m', value: 30 },
    { label: '1h', value: 60 },
    { label: '2h', value: 120 },
    { label: '3h', value: 180 },
  ];

  return (
    <View style={styles.container}>
      {/* Atalhos Rápidos */}
      <View style={styles.pillContainer}>
        {shortcuts.map(s => {
          const isActive = duration === s.value;
          return (
            <TouchableOpacity
              key={s.value}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onSelectShortcut(s.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botão para Tempo Personalizado */}
      <TouchableOpacity style={styles.customSelector} onPress={onOpenPicker} activeOpacity={0.7}>
        <Ionicons name="timer-outline" size={22} color={Colors.primary} />
        <Text style={styles.customText}>
          Duração Personalizada: {Math.floor(duration / 60)}h {duration % 60}m
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: 25 
  },
  pillContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15 
  },
  pill: {
    flex: 1, 
    marginHorizontal: 4, 
    paddingVertical: 12, 
    alignItems: 'center',
    backgroundColor: Colors.white, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderRadius: 12,
  },
  pillActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  pillText: { 
    fontSize: 14, 
    color: Colors.gray, 
    fontWeight: 'bold' 
  },
  pillTextActive: { 
    color: Colors.white 
  },
  customSelector: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight, 
    padding: 15, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  customText: { 
    marginLeft: 10, 
    fontSize: 15, 
    color: Colors.primary, 
    fontWeight: 'bold' 
  }
});