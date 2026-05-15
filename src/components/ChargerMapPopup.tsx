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
}

const ChargerMapPopup = ({ charger, onDetailsPress }: ChargerMapPopupProps) => {
  const { pricing } = usePricingConfig();

  // 1. EXTRAÇÃO DE DADOS RETROCOMPATÍVEL (Firebase Schema Fix)
  const lat = charger.manualLat ?? charger.lat ?? charger.localizacao?.latitude;
  const lng = charger.manualLng ?? charger.lng ?? charger.localizacao?.longitude;
  const morada = charger.morada ?? charger.localizacao?.morada ?? "Sem morada";
  const power = charger.potencia_kw ?? charger.potencia ?? 0;
  const tipoTomada = charger.tipo_tomada ?? charger.connection_type ?? "Tipo 2";

  // 2. LÓGICA DE NAVEGAÇÃO PARA GOOGLE MAPS
  const handleOpenDirections = () => {
    if (!lat || !lng) {
      Alert.alert("Erro", "Coordenadas do carregador não encontradas.");
      return;
    }

    const destination = `${lat},${lng}`;
    const label = encodeURIComponent(morada);

    // Esquemas para forçar Google Maps em vez de Apple Maps no iOS
    const url = Platform.select({
      ios: `comgooglemaps://?q=${destination}&center=${destination}`,
      android: `google.navigation:q=${destination}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    });

    const browserFallback = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    Linking.canOpenURL(url!).then((supported) => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        // Se a app não estiver instalada, abre no browser com o URL oficial da Google
        Linking.openURL(browserFallback);
      }
    }).catch(() => {
      Linking.openURL(browserFallback);
    });
  };

  // 3. LÓGICA DE PREÇAGEM SEGURA (Fix Erro indexOf/includes)
  const p_base = charger.p_base ?? charger.preco_kwh ?? 0;
  let p_final = p_base;

  if (pricing?.deltas) {
    const deltas = pricing.deltas;
    let tier = deltas.tier.nivel_3;
    if (power <= deltas.tier.nivel_1.max_kw) tier = deltas.tier.nivel_1;
    else if (power <= deltas.tier.nivel_2.max_kw) tier = deltas.tier.nivel_2;

    const isVazio = new Date().getHours() >= 0 && new Date().getHours() < 7;
    const d_tempo = isVazio ? deltas.tempo.vazio : deltas.tempo.fora_vazio;

    let d_macro = deltas.macro.valores.default;
    const city = charger.address_city ?? "Default";
    const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    
    // Verificação de segurança para evitar o crash de "includes of undefined"
    const zonas = deltas.macro?.zonas;
    if (zonas && typeof zonas === 'object') {
      if (Array.isArray(zonas.alta_densidade) && zonas.alta_densidade.includes(cityFormatted)) {
        d_macro = deltas.macro.valores.alta_densidade;
      } else if (Array.isArray(zonas.media_densidade) && zonas.media_densidade.includes(cityFormatted)) {
        d_macro = deltas.macro.valores.media_densidade;
      }
    }

    const somatorioDeltas = d_tempo + d_macro + tier.multiplicador;
    p_final = Math.min(Math.max(Math.round(p_base * (1 + somatorioDeltas)), tier.floor), tier.ceil);
  }

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.calloutContainer}>
        <View style={styles.calloutHeader}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {morada}
          </Text>
          <TouchableOpacity 
            onPress={handleOpenDirections} 
            style={{ padding: 8 }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="directions" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.calloutBody}>
          <View style={styles.connectorIconContainer}>
            {getConnectorIcon(tipoTomada, 36, Colors.primary)}
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <FontAwesome6 name="bolt" size={12} color="#888" />
              <Text style={styles.infoText}>{power} kW</Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome6 name="coins" size={12} color="#888" />
              <Text style={styles.infoText}>{p_final} IONS/kWh</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={onDetailsPress}>
            <Text style={styles.actionButtonText}>DETALHES</Text>
            <Ionicons name="chevron-forward" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ChargerMapPopup;