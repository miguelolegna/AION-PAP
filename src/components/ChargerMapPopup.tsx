import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import { Colors } from '../styles/GlobalStyles';
import { MapScreenStyles as styles } from '../styles/Screens/MapScreenStyles';
import { getConnectorIcon } from '../utils/IconMapper';
import { usePricingConfig } from '../context/ConfigContext';

interface ChargerMapPopupProps {
  charger: any;
  onDetailsPress: () => void;
  onDirectionsPress?: () => void; // Mantido por compatibilidade, mas a lógica interna foi adicionada
}

const ChargerMapPopup = ({ charger, onDetailsPress }: ChargerMapPopupProps) => {
  const { pricing } = usePricingConfig();

  // ==========================================
  // LÓGICA DE NAVEGAÇÃO EXTERNA (GOOGLE MAPS)
  // ==========================================
  const handleOpenDirections = () => {
    const lat = charger.localizacao?.latitude;
    const lng = charger.localizacao?.longitude;

    if (!lat || !lng) {
      Alert.alert("Erro", "Coordenadas do carregador não encontradas.");
      return;
    }

    // Esquema de URL para Google Maps com suporte a iOS e Android
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = charger.morada;
    
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latLng}`
    });

    Linking.canOpenURL(url!).then((supported) => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        // Fallback para URL de browser se a app não estiver instalada
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latLng}`);
      }
    });
  };

  // ==========================================
  // LÓGICA DE PREÇAGEM ALGORÍTMICA
  // ==========================================
  const p_base = charger.p_base || 0;
  const power = charger.potencia_kw || 0;
  const city = charger.address_city || "Default";
  let p_final = p_base;

  if (pricing?.deltas) {
    const deltas = pricing.deltas;
    
    let tier = deltas.tier.nivel_3;
    if (power <= deltas.tier.nivel_1.max_kw) tier = deltas.tier.nivel_1;
    else if (power <= deltas.tier.nivel_2.max_kw) tier = deltas.tier.nivel_2;

    const isVazio = new Date().getHours() >= 0 && new Date().getHours() < 7;
    const d_tempo = isVazio ? deltas.tempo.vazio : deltas.tempo.fora_vazio;

    let d_macro = deltas.macro.valores.default;
    const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    
    if (deltas.macro.zonas.alta_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.alta_densidade;
    else if (deltas.macro.zonas.media_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.media_densidade;
    else if (deltas.macro.zonas.baixa_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.baixa_densidade;

    const somatorioDeltas = d_tempo + d_macro + tier.multiplicador;
    const p_calc = p_base * (1 + somatorioDeltas);
    
    p_final = Math.round(p_calc);
    p_final = Math.min(Math.max(p_final, tier.floor), tier.ceil);
  }

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.calloutContainer}>
        {/* Cabeçalho do Card */}
        <View style={styles.calloutHeader}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {charger.morada}
          </Text>
          <TouchableOpacity onPress={handleOpenDirections}>
            <MaterialIcons name="directions" size={26} color="white" />
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
              <FontAwesome6 name="coins" size={12} color="#888" />
              <Text style={styles.infoText}>{p_final} IONS/kWh</Text>
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