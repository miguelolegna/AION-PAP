import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import { Colors } from '../styles/GlobalStyles';
import { MapScreenStyles as styles } from '../styles/Screens/MapScreenStyles';
import { getConnectorIcon } from '../utils/IconMapper';

interface ChargerMapPopupProps {
  charger: any;
  onClose: () => void;
  onDetailsPress: () => void;
  onDirectionsPress: () => void;
}

const ChargerMapPopup = ({ charger, onDetailsPress, onDirectionsPress }: ChargerMapPopupProps) => {
  return (
    <View style={styles.overlayContainer}>
      <View style={styles.calloutContainer}>
        {/* Cabeçalho do Card */}
        <View style={styles.calloutHeader}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {charger.morada}
          </Text>
          <TouchableOpacity onPress={onDirectionsPress}>
            <MaterialIcons name="directions" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Corpo do Card */}
        <View style={styles.calloutBody}>
          <View style={styles.connectorIconContainer}>
            {getConnectorIcon(charger.tipo_tomada, 36, Colors.primary)}
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <FontAwesome6 name="bolt" size={12} color="#888" />
              <Text style={styles.infoText}>{charger.potencia_kw} kW</Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome6 name="euro-sign" size={12} color="#888" />
              <Text style={styles.infoText}>{charger.preco_kwh} €/kWh</Text>
            </View>
          </View>

          {/* Botão de Detalhes */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onDetailsPress}
          >
            <Text style={styles.actionButtonText}>DETALHES</Text>
            <Ionicons name="chevron-forward" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ChargerMapPopup;