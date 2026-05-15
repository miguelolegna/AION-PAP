import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../styles/GlobalStyles';
import { getConnectorIcon } from '../utils/IconMapper';
import { AddChargerStyles as styles } from '../styles/Screens/AddChargerStyles';

const ConnectorGridSelector = ({ current, onSelect }: any) => {
  const options = [
    { id: 'Tipo 2', name: 'Tipo 2' },
    { id: 'CCS', name: 'CCS' },
    { id: 'Schuko', name: 'Schuko' },
    { id: 'CHAdeMO', name: 'CHAdeMO' }
  ];

  return (
    <View style={styles.typeSelectorContainer}>
      {options.map((opt) => {
        const isSelected = current === opt.id;
        // Identifica se o item está na primeira linha para aplicar margem inferior
        const isTopRow = opt.id === 'Tipo 2' || opt.id === 'CCS';

        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            activeOpacity={1}
            style={[
              styles.typeOption,
              isTopRow && { marginBottom: 8 }, // Lógica dinâmica injetada inline
              isSelected && styles.typeOptionSelected
            ]}
          >
            <View style={styles.typeIconContainer}>
              {getConnectorIcon(opt.id, 32, isSelected ? Colors.primary : Colors.gray)}
            </View>
            <Text style={[styles.typeOptionText, isSelected && styles.typeOptionTextSelected]}>
              {opt.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ConnectorGridSelector;