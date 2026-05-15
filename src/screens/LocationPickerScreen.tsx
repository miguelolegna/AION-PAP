import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LocationPickerStyles as styles } from '../styles/Screens/LocationPickerStyles';
import { Colors } from '../styles/GlobalStyles';
import { fetchAddressSuggestions, getAddressFromCoords } from '../services/ChargerService';

const LocationPickerScreen = ({ route, navigation }: any) => {
  const { initialRegion } = route.params;
  const mapRef = useRef<MapView>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null); // Ref já existente

  const [region, setRegion] = useState<Region>(initialRegion);
  const [resolvedAddress, setResolvedAddress] = useState("A aguardar paragem...");
  const [isResolving, setIsResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    
    // Limpa qualquer execução pendente para evitar spam
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setIsResolving(true);
    setResolvedAddress("A processar localização...");

    // Implementação do Debounce: 800ms de imobilidade obrigatória
    debounceTimer.current = setTimeout(async () => {
      const addr = await getAddressFromCoords(newRegion.latitude, newRegion.longitude);
      setResolvedAddress(addr);
      setIsResolving(false);
    }, 800);
  };

  // Restante código (handleSearch, selectSuggestion, confirmLocation, render) permanece igual

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 4) {
      const res = await fetchAddressSuggestions(text);
      setSuggestions(res);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item: any) => {
    const coords = {
      latitude: Number(item.lat),
      longitude: Number(item.lng),
      latitudeDelta: 0.002,
      longitudeDelta: 0.002,
    };
    mapRef.current?.animateToRegion(coords, 500);
    setSuggestions([]);
    setSearchQuery('');
  };

  const confirmLocation = () => {
  // Em vez de tentar chamar route.params.onLocationSelected (que já não existe)
  // Navegamos de volta para o AddCharger passando os dados nos params
  navigation.navigate({
    name: 'AddCharger',
    params: { 
      pickedLocation: {
        address: resolvedAddress,
        coords: { 
          lat: region.latitude, 
          lng: region.longitude 
        }
      }
    },
    merge: true, // Importante para fundir os dados no ecrã de destino
  });
};

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* Pino Central Fixo - pointerEvents="none" é vital para não bloquear o toque no mapa */}
      <View style={styles.fixedPinContainer} pointerEvents="none">
        <Ionicons name="location" size={48} color={Colors.primary} />
        <View style={styles.pinShadow} />
      </View>

      {/* Overlay de Pesquisa */}
      <View style={styles.searchOverlay}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.gray} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Procurar localidade ou rua..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.gray}
            style={{ flex: 1, height: 50, color: Colors.dark }}
          />
        </View>
        {suggestions.map((item, index) => (
          <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
            <Text style={styles.suggestionText} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Painel de Confirmação Inferior */}
      <View style={styles.footerOverlay}>
        <View style={styles.addressRow}>
          {isResolving ? (
            <ActivityIndicator color={Colors.primary} style={{ marginRight: 10 }} />
          ) : (
            <Ionicons name="map" size={24} color={Colors.primary} style={{ marginRight: 10 }} />
          )}
          <Text style={styles.addressText} numberOfLines={2}>
            {resolvedAddress}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.confirmMapButton} onPress={confirmLocation}>
          <Text style={styles.confirmMapText}>Confirmar este local</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LocationPickerScreen;