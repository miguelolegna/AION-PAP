import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../styles/GlobalStyles';

const HistoryScreen = ({ route }: any) => {
  const { mode } = route.params || { mode: 'driver' };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.dark, marginBottom: 20 }}>
        {mode === 'host' ? 'Histórico de Ganhos' : 'Histórico de Carregamentos'}
      </Text>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.gray, textAlign: 'center' }}>
          O histórico de reservas aparecerá aqui após o lançamento do sistema de agendamento.
        </Text>
      </View>
    </View>
  );
};

export default HistoryScreen;