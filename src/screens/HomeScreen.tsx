import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import * as Location from 'expo-location';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { usePricingConfig } from '../context/ConfigContext';
import { useNavigation } from '@react-navigation/native';
import { Colors, GlobalStyles } from '../styles/GlobalStyles';
import { HomeStyles as styles } from '../styles/Screens/HomeStyles';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';

const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
};

const HomeScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chargers, setChargers] = useState<any[]>([]);
  const [pendingReservations, setPendingReservations] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { pricing } = usePricingConfig();

  useEffect(() => {
    // CORREÇÃO: Remoção da cláusula where para evitar que documentos de legado sejam ignorados
    const qChargers = collection(db, "chargers");
    const unsubChargers = onSnapshot(qChargers, (snapshot) => {
      const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtragem em memória para lidar com documentos sem o campo is_deleted
      const activeDocs = allDocs.filter((d: any) => d.is_deleted !== true);
      setChargers(activeDocs);
      setLoading(false);
    });

    let unsubReservations = () => {};
    if (user) {
      const qReservations = query(
        collection(db, "bookings"),
        where("owner_uid", "==", user.uid),
        where("status", "==", "pending")
      );
      unsubReservations = onSnapshot(qReservations, (snapshot) => {
        setPendingReservations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    return () => {
      unsubChargers();
      unsubReservations();
    };
  }, [user]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
    })();
  }, []);

  const getIonsPrice = (item: any) => {
    const p_base = item.p_base ?? item.preco_kwh ?? 0;
    if (!pricing?.deltas) return p_base;

    const power = item.potencia_kw ?? item.potencia ?? 0;
    
    // CORREÇÃO: Mapeamento seguro para documentos antigos com objeto "localizacao"
    const rawMorada = item.morada ?? item.localizacao?.morada;
    const morada = typeof rawMorada === 'string' ? rawMorada : "";
    
    let city = item.address_city;
    if (!city && morada.includes(',')) {
      const parts = morada.split(',');
      city = parts[parts.length - 1]?.trim();
    }
    const cityFormatted = city ? (String(city).charAt(0).toUpperCase() + String(city).slice(1).toLowerCase()) : "Default";

    const deltas = pricing.deltas;
    let tier = deltas.tier.nivel_3;
    if (power <= deltas.tier.nivel_1.max_kw) tier = deltas.tier.nivel_1;
    else if (power <= deltas.tier.nivel_2.max_kw) tier = deltas.tier.nivel_2;

    const isVazio = new Date().getHours() >= 0 && new Date().getHours() < 7;
    const d_tempo = isVazio ? deltas.tempo.vazio : deltas.tempo.fora_vazio;
    let d_macro = deltas.macro.valores.default;

    if (deltas.macro?.zonas) {
      const zonas = deltas.macro.zonas;
      if (Array.isArray(zonas.alta_densidade) && zonas.alta_densidade.includes(cityFormatted)) {
        d_macro = deltas.macro.valores.alta_densidade;
      } else if (Array.isArray(zonas.media_densidade) && zonas.media_densidade.includes(cityFormatted)) {
        d_macro = deltas.macro.valores.media_densidade;
      }
    }

    const p_calc = p_base * (1 + d_tempo + d_macro + tier.multiplicador);
    return Math.min(Math.max(Math.round(p_calc), tier.floor), tier.ceil);
  };

  const sortedChargers = useMemo(() => {
    return chargers.map(c => {
      const price = getIonsPrice(c);
      let dist = null;
      
      // CORREÇÃO: Extração de coordenadas retrocompatível com o objeto "localizacao"
      const cLat = c.manualLat ?? c.lat ?? c.localizacao?.latitude;
      const cLng = c.manualLng ?? c.lng ?? c.localizacao?.longitude;

      if (userLocation && typeof cLat === 'number' && typeof cLng === 'number') {
        dist = getDistanceInKm(userLocation.lat, userLocation.lng, cLat, cLng);
      }
      return { ...c, calculatedPrice: price, distance: dist };
    }).sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      if (a.calculatedPrice !== b.calculatedPrice) return a.calculatedPrice - b.calculatedPrice;
      const pA = a.potencia_kw ?? a.potencia ?? 0;
      const pB = b.potencia_kw ?? b.potencia ?? 0;
      return pB - pA;
    });
  }, [chargers, userLocation, pricing]);

  const handleChargerPress = (item: any) => {
    if (!user) {
      Alert.alert(
        "Acesso Restrito",
        "Precisas de estar logado para ver detalhes e reservar.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate('Auth') }
        ]
      );
      return;
    }
    navigation.navigate('ChargerDetails', { chargerId: String(item.id) });
  };

  const handleReservationAction = async (reservaId: string, action: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, "bookings", reservaId), { status: action });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar a reserva.");
    }
  };

  const renderPendingReservations = () => {
    if (pendingReservations.length === 0) return null;
    return (
      <View style={styles.pendingSection}>
        <Text style={styles.pendingSectionTitle}>Notificações de Reserva</Text>
        {pendingReservations.map((reserva) => (
          <View key={reserva.id} style={styles.pendingCard}>
             <View style={styles.pendingInfo}>
                <View style={styles.statusDot} />
                <View>
                  <Text style={styles.pendingTextLabel}>Novo Pedido de Carga</Text>
                  <Text style={styles.pendingTextSub}>ID: {reserva.id.slice(0, 8).toUpperCase()}</Text>
                </View>
             </View>
             <View style={styles.pendingActions}>
                <TouchableOpacity style={styles.rejectCircle} onPress={() => handleReservationAction(reserva.id, 'rejected')}>
                  <Ionicons name="close" size={20} color={Colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptCircle} onPress={() => handleReservationAction(reserva.id, 'accepted')}>
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                </TouchableOpacity>
             </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <View style={GlobalStyles.headerCard}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="flash" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.headerTitle}>
          {user ? `Olá, Condutor` : "Explorar Rede"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {chargers.length} postos disponíveis na AION
        </Text>
      </View>

      <FlatList
        data={sortedChargers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderPendingReservations}
        renderItem={({ item }) => {
          // CORREÇÃO: Fallbacks visuais para documentos legados
          const displayMorada = item.morada ?? item.localizacao?.morada ?? "Sem morada";
          const displayPower = item.potencia_kw ?? item.potencia ?? "?";
          const displayType = item.tipo_tomada ?? item.connection_type ?? "Desconhecido";

          return (
            <TouchableOpacity 
              style={GlobalStyles.cardItem}
              activeOpacity={0.8}
              onPress={() => handleChargerPress(item)}
            >
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.cardAddress} numberOfLines={1}>
                    {displayMorada}
                  </Text>
                  {item.distance !== null && (
                    <Text style={{ fontSize: 12, color: Colors.gray, marginTop: 2 }}>
                      <Ionicons name="navigate-outline" size={12} /> {item.distance.toFixed(1)} km de distância
                    </Text>
                  )}
                </View>
                <View style={[styles.badgeBase, { backgroundColor: item.is_active ? '#E8F5E9' : '#FFEBEE' }]}>
                   <Text style={[styles.badgeTextBase, { color: item.is_active ? Colors.success : Colors.danger }]}>
                      {item.is_active ? 'DISPONÍVEL' : 'OCUPADO'}
                   </Text>
                </View>
              </View>
              
              <View style={styles.cardDetailsRow}>
                <MaterialCommunityIcons name="ev-plug-type2" size={16} color={Colors.gray} />
                <Text style={styles.cardDetailsText}>
                  {displayPower} kW • {displayType}
                </Text>
              </View>

              <View style={styles.cardFooterRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome6 name="coins" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.cardPriceText}>
                    {item.calculatedPrice} <Text style={styles.cardPriceUnit}>IONS/kWh</Text>
                  </Text>
                </View>
                
                {!user && (
                  <Ionicons name="lock-closed" size={14} color={Colors.gray} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;