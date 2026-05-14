// src/screens/ChargerDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Colors } from '../styles/GlobalStyles';
import { chargerDetailsStyles as styles } from '../styles/Screens/ChargerDetailsStyles';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { usePricingConfig } from '../context/ConfigContext';

const ChargerDetailsScreen = ({ route, navigation }: any) => {
  const { chargerId } = route.params;
  const { pricing } = usePricingConfig();
  const [charger, setCharger] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChargerDetails = async () => {
      try {
        const docRef = doc(db, "chargers", chargerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCharger({ id: docSnap.id, ...docSnap.data() });
        } else {
          Alert.alert("Erro", "Este posto já não está disponível.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Erro Firestore:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChargerDetails();
  }, [chargerId]);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
  
  if (!charger) return null;

  // ==========================================
  // LÓGICA DE PREÇAGEM ALGORÍTMICA E DECOMPOSIÇÃO
  // ==========================================
  const p_base = charger.p_base || 0;
  const power = charger.potencia_kw || 0;
  const city = charger.address_city || "Default";
  let p_final = p_base;
  let breakdown = { tier: 0, tempo: 0, macro: 0, limitApplied: "" };

  if (pricing?.deltas) {
    const deltas = pricing.deltas;
    
    // 1. Tier
    let tier = deltas.tier.nivel_3;
    if (power <= deltas.tier.nivel_1.max_kw) tier = deltas.tier.nivel_1;
    else if (power <= deltas.tier.nivel_2.max_kw) tier = deltas.tier.nivel_2;
    breakdown.tier = tier.multiplicador;

    // 2. Tempo
    const isVazio = new Date().getHours() >= 0 && new Date().getHours() < 7;
    const d_tempo = isVazio ? deltas.tempo.vazio : deltas.tempo.fora_vazio;
    breakdown.tempo = d_tempo;

    // 3. Macro (Geolocalização)
    let d_macro = deltas.macro.valores.default;
    const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    
    if (deltas.macro.zonas.alta_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.alta_densidade;
    else if (deltas.macro.zonas.media_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.media_densidade;
    else if (deltas.macro.zonas.baixa_densidade.includes(cityFormatted)) d_macro = deltas.macro.valores.baixa_densidade;
    breakdown.macro = d_macro;

    // 4. Cálculo
    const somatorioDeltas = d_tempo + d_macro + tier.multiplicador;
    const p_calc = p_base * (1 + somatorioDeltas);
    
    // 5. Arredondamento e Clamp
    p_final = Math.round(p_calc);
    
    if (p_final < tier.floor) {
      p_final = tier.floor;
      breakdown.limitApplied = "Proteção Anti-Dumping (Floor Price)";
    } else if (p_final > tier.ceil) {
      p_final = tier.ceil;
      breakdown.limitApplied = "Teto de Mercado (Ceiling Price)";
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* IMAGEM NO TOPO */}
        <View style={styles.imageContainer}>
          {charger.image_url ? (
            <Image source={{ uri: charger.image_url }} style={styles.chargerImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={60} color="#DEE2E6" />
              <Text style={{ color: '#ADB5BD', marginTop: 10 }}>Sem imagem oficial</Text>
            </View>
          )}
        </View>

        {/* CONTEÚDO */}
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.addressTitle} numberOfLines={2}>{charger.morada}</Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FBC02D" />
                <Text style={styles.ratingText}>{charger.rating_medio?.toFixed(1) || "Novo"}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Especificações Técnicas</Text>
          <View style={styles.specsGrid}>
            <SpecCard icon="flash" label="Potência" value={`${charger.potencia_kw} kW`} />
            <SpecCard icon="ev-plug-type2" label="Conector" value={charger.tipo_tomada} />
            <SpecCard 
              icon={charger.connection_type === 'Tethered' ? "power-plug" : "power-socket-eu"} 
              label="Cabo" 
              value={charger.connection_type === 'Tethered' ? "Preso" : "Tomada"} 
            />
            <SpecCard 
              icon={charger.location_type === 'Indoor' ? "garage" : "weather-sunny"} 
              label="Ambiente" 
              value={charger.location_type === 'Indoor' ? "Interior" : "Exterior"} 
            />
          </View>

          {/* SECÇÃO OBRIGATÓRIA: TRANSPARÊNCIA DE PREÇO */}
          <Text style={styles.sectionTitle}>Transparência de Tarifa</Text>
          <View style={{ backgroundColor: Colors.primaryLight, padding: 15, borderRadius: 10, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: Colors.dark, fontSize: 14 }}>Preço Base do Anfitrião</Text>
              <Text style={{ fontWeight: 'bold' }}>{p_base} IONS</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: Colors.gray, fontSize: 13 }}>Ajuste de Categoria ({power} kW)</Text>
              <Text style={{ color: breakdown.tier >= 0 ? Colors.danger : Colors.success }}>{breakdown.tier > 0 ? '+' : ''}{(breakdown.tier * 100).toFixed(0)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: Colors.gray, fontSize: 13 }}>Ajuste Horário (Dinâmico)</Text>
              <Text style={{ color: breakdown.tempo >= 0 ? Colors.danger : Colors.success }}>{breakdown.tempo > 0 ? '+' : ''}{(breakdown.tempo * 100).toFixed(0)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: Colors.gray, fontSize: 13 }}>Custo Regional ({city})</Text>
              <Text style={{ color: breakdown.macro >= 0 ? Colors.danger : Colors.success }}>{breakdown.macro > 0 ? '+' : ''}{(breakdown.macro * 100).toFixed(0)}%</Text>
            </View>

            {breakdown.limitApplied !== "" && (
              <View style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', padding: 8, borderRadius: 6, marginVertical: 8 }}>
                <Text style={{ fontSize: 12, color: '#F57C00', fontWeight: 'bold', textAlign: 'center' }}>
                  Aviso: {breakdown.limitApplied}
                </Text>
              </View>
            )}

            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>Tarifa Final Atual</Text>
              <Text style={{ color: Colors.primary, fontWeight: '900', fontSize: 20 }}>{p_final} IONS</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Instruções de Acesso</Text>
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              {charger.access_info || "As instruções detalhadas serão fornecidas após a confirmação da reserva pelo anfitrião."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER FIXO */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>{p_final} IONS</Text>
          <Text style={styles.priceUnit}>/kWh</Text>
        </View>

        <TouchableOpacity 
          style={styles.reserveButton}
          onPress={() => navigation.navigate('CreateBooking', { charger, p_final_simulated: p_final })}
        >
          <Text style={styles.reserveButtonText}>RESERVAR AGORA</Text>
          <Ionicons name="flash" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SpecCard = ({ icon, label, value }: any) => (
  <View style={styles.specCard}>
    <MaterialCommunityIcons name={icon} size={28} color={Colors.primary} />
    <Text style={styles.specLabel}>{label}</Text>
    <Text style={styles.specValue}>{value}</Text>
  </View>
);

export default ChargerDetailsScreen;