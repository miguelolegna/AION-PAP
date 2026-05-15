import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome6, Ionicons } from '@expo/vector-icons';
import { MyChargersStyles as styles } from '../styles/Screens/MyChargersStyles';
import { Colors } from '../styles/GlobalStyles';
import { getConnectorIcon } from '../utils/IconMapper';
import { usePricingConfig } from '../context/ConfigContext';

interface ChargerListItemProps {
  charger: any;
  onDelete: () => void;
  onEdit: () => void;
}

const ChargerListItem = ({ charger, onDelete, onEdit }: ChargerListItemProps) => {
  const { pricing } = usePricingConfig();
  const isActive = charger.is_active !== false;

  // ==========================================
  // LÓGICA DE PREÇAGEM ALGORÍTMICA EM TEMPO REAL
  // ==========================================
  const p_base = charger.p_base || 0;
  const power = charger.potencia_kw || 0;
  const city = charger.address_city || "Default";
  let p_final = p_base;

  if (pricing?.deltas) {
    const deltas = pricing.deltas;
    
    // 1. Tier
    let tier = deltas.tier.nivel_3;
    if (power <= deltas.tier.nivel_1.max_kw) tier = deltas.tier.nivel_1;
    else if (power <= deltas.tier.nivel_2.max_kw) tier = deltas.tier.nivel_2;

    // 2. Tempo
    const isVazio = new Date().getHours() >= 0 && new Date().getHours() < 7;
    const d_tempo = isVazio ? deltas.tempo.vazio : deltas.tempo.fora_vazio;

    // 3. Macro (Geolocalização)
    let d_macro = deltas.macro.valores.default;
    const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    
    if (deltas.macro.zonas.alta_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.alta_densidade;
    else if (deltas.macro.zonas.media_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.media_densidade;
    else if (deltas.macro.zonas.baixa_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.baixa_densidade;

    // 4. Cálculo
    const somatorioDeltas = d_tempo + d_macro + tier.multiplicador; // d_micro omitido na listagem estática
    const p_calc = p_base * (1 + somatorioDeltas);
    
    // 5. Arredondamento e Clamp
    p_final = Math.round(p_calc);
    p_final = Math.min(Math.max(p_final, tier.floor), tier.ceil);
  }

  return (
    <View style={styles.card}>
      {/* Badge de Estado */}
      <View style={[
        styles.statusBadge, 
        { backgroundColor: isActive ? Colors.success : Colors.gray }
      ]}>
        <Text style={styles.statusText}>{isActive ? 'Ativo' : 'Pausado'}</Text>
      </View>

      {/* Miniatura da Imagem */}
      <Image 
        source={{ uri: charger.image_url || 'https://via.placeholder.com/150' }} 
        style={styles.imagePreview} 
      />

      {/* Informação Centralizada */}
      <View style={styles.infoContainer}>
        <Text style={styles.address} numberOfLines={1}>{charger.morada}</Text>
        
        <View style={styles.specRow}>
          <FontAwesome6 name="bolt" size={10} color={Colors.primary} />
          <Text style={styles.specText}>{charger.potencia_kw} kW</Text>
        </View>

        <View style={styles.specRow}>
          <FontAwesome6 name="coins" size={10} color={Colors.primary} />
          <Text style={styles.specText}>Base: {p_base} | Atual: {p_final} IONS</Text>
        </View>

        <View style={styles.specRow}>
          <View style={{ width: 12, alignItems: 'center' }}>
            {getConnectorIcon(charger.tipo_tomada, 12, Colors.gray)}
          </View>
          <Text style={styles.specText}>{charger.tipo_tomada}</Text>
        </View>
      </View>

      {/* Coluna de Ações */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={22} color={Colors.danger} />
        </TouchableOpacity>
      </View> 
    </View>
  );
};

export default ChargerListItem;