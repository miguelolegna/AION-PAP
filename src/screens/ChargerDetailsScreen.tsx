// src/screens/ChargerDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Colors } from '../styles/GlobalStyles';
import { chargerDetailsStyles as styles } from '../styles/Screens/ChargerDetailsStyles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ChargerDetailsScreen = ({ route, navigation }: any) => {
  const { chargerId } = route.params;
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
          <Text style={styles.priceValue}>{charger.preco_kwh} €</Text>
          <Text style={styles.priceUnit}>/kWh</Text>
        </View>

        <TouchableOpacity 
          style={styles.reserveButton}
          onPress={() => navigation.navigate('CreateBooking', { charger })}
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