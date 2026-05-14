// src/screens/LocationPickerScreen.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AddChargerStyles as styles } from '../styles/Screens/AddChargerStyles';
import { Colors } from '../styles/GlobalStyles';
import { fetchAddressSuggestions, getAddressFromCoords } from '../services/ChargerService';

const LocationPickerScreen = ({ route, navigation }: any) => {
  const { initialRegion } = route.params;
  const mapRef = useRef<MapView>(null);
  
  const [region, setRegion] = useState<Region>(initialRegion);
  const [resolvedAddress, setResolvedAddress] = useState("A mover o pino...");
  const [isResolving, setIsResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    setIsResolving(true);
    const addr = await getAddressFromCoords(newRegion.latitude, newRegion.longitude);
    setResolvedAddress(addr);
    setIsResolving(false);
  };

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
    // Devolve os dados para o ecrã que chamou este picker
    route.params.onLocationSelected({
      address: resolvedAddress,
      coords: { lat: region.latitude, lng: region.longitude }
    });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      <View style={styles.fixedPinContainer} pointerEvents="none">
        <Ionicons name="location" size={48} color={Colors.primary} style={{ marginTop: -24 }} />
        <View style={styles.pinShadow} />
      </View>

      <View style={styles.searchOverlay}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.gray} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Procurar local..."
            value={searchQuery}
            onChangeText={handleSearch}
            style={{ flex: 1, height: 50 }}
          />
        </View>
        {suggestions.map((item, index) => (
          <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
            <Text style={styles.suggestionText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footerOverlay}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          {isResolving ? <ActivityIndicator color={Colors.primary} style={{ marginRight: 10 }} /> : <Ionicons name="location" size={24} color={Colors.primary} style={{ marginRight: 10 }} />}
          <Text style={{ flex: 1, fontWeight: 'bold' }}>{resolvedAddress}</Text>
        </View>
        <TouchableOpacity style={styles.confirmMapButton} onPress={confirmLocation}>
          <Text style={styles.confirmMapText}>Confirmar Localização</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LocationPickerScreen;