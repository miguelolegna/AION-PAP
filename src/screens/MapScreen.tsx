//src/screens/MapScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, ActivityIndicator, Text, TouchableOpacity, Animated, 
  TextInput, FlatList, Linking, Platform, Easing, Keyboard
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { fetchAddressSuggestions } from '../services/ChargerService';
import { Colors } from '../styles/GlobalStyles';
import { MapScreenStyles as styles } from '../styles/Screens/MapScreenStyles';
import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getConnectorIcon } from '../utils/IconMapper';

const MapScreen = () => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  
  // 1. HOOKS DE ESTADO (Sempre no topo)
  const [loading, setLoading] = useState(true);
  const [chargers, setChargers] = useState<any[]>([]);
  const [selectedCharger, setSelectedCharger] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [shouldTrack, setShouldTrack] = useState(true);

  // 2. HOOKS DE ANIMAÇÃO
  const searchWidth = useRef(new Animated.Value(50)).current;
  const recenterBottom = useRef(new Animated.Value(110)).current; // Base acima da navbar

  // 3. EFEITO: DINÂMICA DO BOTÃO RECENTER
  useEffect(() => {
    Animated.timing(recenterBottom, {
      toValue: selectedCharger ? 280 : 110, // Sobe se o card abrir, desce se fechar
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false, // Propriedade 'bottom' não suporta native driver
    }).start();
  }, [selectedCharger]);

  // 4. EFEITOS DE CARREGAMENTO E PERMISSÕES
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    })();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "chargers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        latitude: Number(doc.data().localizacao?.latitude || 38.7369),
        longitude: Number(doc.data().localizacao?.longitude || -9.1427),
        tipo_tomada: doc.data().tipo_tomada || 'Tipo 2'
      }));
      setChargers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (chargers.length > 0) {
      const timer = setTimeout(() => setShouldTrack(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [chargers]);

  // 5. FUNÇÕES DE INTERAÇÃO
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 3) {
      const res = await fetchAddressSuggestions(text);
      setSuggestions(res);
    } else { setSuggestions([]); }
  };

  const selectPlace = (item: any) => {
    // 1. Move o mapa
    mapRef.current?.animateToRegion({
      latitude: item.lat, longitude: item.lng,
      latitudeDelta: 0.01, longitudeDelta: 0.01,
    }, 1000);

    // 2. Limpa estados e fecha o teclado
    setSuggestions([]);
    setIsSearchExpanded(false);
    setSearchQuery(''); // Opcional: limpar o texto
    Keyboard.dismiss();

    // 3. NOVO: Colapsa a barra de pesquisa de volta ao ícone
    Animated.timing(searchWidth, {
      toValue: 50,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleSearch = () => {
    Animated.timing(searchWidth, {
      toValue: isSearchExpanded ? 50 : 280,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
        Keyboard.dismiss();
    }
  };

  const recenter = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01, longitudeDelta: 0.01,
      }, 800);
    }
  };

  // 6. RENDERIZAÇÃO CONDICIONAL (Depois dos Hooks)
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={true} // Reativa o ponto azul
        showsMyLocationButton={false}
        onPress={() => {
            setSelectedCharger(null);
            Keyboard.dismiss();
            if (isSearchExpanded) toggleSearch(); // Fecha a pesquisa se tocar no mapa
        }}
        toolbarEnabled={false}
      >
        {chargers.map((charger) => {
          if (isNaN(charger.latitude) || isNaN(charger.longitude)) return null;
          return (
            <Marker
              key={charger.id}
              coordinate={{ latitude: charger.latitude, longitude: charger.longitude }}
              onPress={() => setSelectedCharger(charger)}
              tracksViewChanges={shouldTrack} // Previne IllegalStateException
            >
              <View style={styles.markerContainer}>
                <FontAwesome6 name="charging-station" size={16} color={Colors.primary} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* LUPA (PESQUISA) - Agora à esquerda */}
      <View style={styles.searchOverlay}>
        <Animated.View style={[styles.searchBar, { width: searchWidth }]}>
          <TouchableOpacity onPress={toggleSearch} style={styles.searchIcon}>
            <Ionicons name={isSearchExpanded ? "close" : "search"} size={22} color={Colors.primary} />
          </TouchableOpacity>
          {isSearchExpanded && (
            <TextInput
              autoFocus style={styles.searchInput}
              placeholder="Onde carregar?"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          )}
        </Animated.View>
        
        {suggestions.length > 0 && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => selectPlace(item)}>
                  <Text style={{ fontSize: 14 }}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* BOTÃO LOCALIZAÇÃO - Dinâmico */}
      <Animated.View style={[styles.recenterButton, { bottom: recenterBottom }]}>
        <TouchableOpacity onPress={recenter}>
          <MaterialIcons name="my-location" size={26} color={Colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* CARD DE DETALHES - Overlay acima da Navbar */}
      {selectedCharger && (
        <View style={styles.overlayContainer}>
          <View style={styles.calloutContainer}>
            <View style={styles.calloutHeader}>
              <Text style={styles.calloutTitle} numberOfLines={1}>{selectedCharger.morada}</Text>
              <TouchableOpacity onPress={() => {}}>
                <MaterialIcons name="directions" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.calloutBody}>
              <View style={styles.connectorIconContainer}>
                {getConnectorIcon(selectedCharger.tipo_tomada, 36, Colors.primary)}
              </View>

              <View style={styles.infoColumn}>
                <View style={styles.infoRow}>
                  <FontAwesome6 name="bolt" size={12} color="#888" />
                  <Text style={styles.infoText}>{selectedCharger.potencia_kw} kW</Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome6 name="coins" size={12} color="#888" />
                  <Text style={styles.infoText}>{selectedCharger.preco_kwh} IONS/kWh</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('ChargerDetails', { chargerId: selectedCharger.id })}
              >
                <Text style={styles.actionButtonText}>DETALHES</Text>
                <Ionicons name="chevron-forward" size={14} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MapScreen;