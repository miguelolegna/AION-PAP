import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/GlobalStyles';

export const DateTimeSelector = ({ date, onOpenDate, onOpenTime }: any) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.selector} onPress={onOpenDate} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
        <Text style={styles.text}>
          {date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.selector} onPress={onOpenTime} activeOpacity={0.7}>
        <Ionicons name="time-outline" size={22} color={Colors.primary} />
        <Text style={styles.text}>
          {date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 25 
  },
  selector: {
    flex: 0.48, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.white,
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderRadius: 12, 
    padding: 15,
  },
  text: { 
    marginLeft: 10, 
    fontSize: 15, 
    color: Colors.dark, 
    fontWeight: '600' 
  }
});