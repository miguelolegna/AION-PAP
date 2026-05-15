import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Image
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

// Contextos e Serviços
import { useAuth } from "../context/AuthContext";
import { usePricingConfig } from "../context/ConfigContext";
import { createCharger, fetchAddressSuggestions } from "../services/ChargerService";

// Componentes Externos
import ConnectorGridSelector from "../components/ConnectorGridSelector";
import SlidingRowSelector from "../components/SlidingRowSelector";

// Estilos
import { AddChargerStyles as styles } from "../styles/Screens/AddChargerStyles";
import { Colors } from "../styles/GlobalStyles";

const AddChargerScreen = ({ navigation, route }: any) => {
  const { pricing } = usePricingConfig();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [confirmedCoords, setConfirmedCoords] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [form, setForm] = useState({
    morada: "", potencia: "", preco: "",
    tipoTomada: "Tipo 2", local: "Indoor", cabo: "Socket",
  });

  // Estado obrigatório para o mapa não falhar
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 38.7369,
    longitude: -9.1427,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  // Obter localização real do dispositivo
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let location = await Location.getCurrentPositionAsync({});
      setCurrentRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  // Lógica de receção da morada via mapa
  useEffect(() => {
    if (route.params?.pickedLocation) {
      const { address, coords } = route.params.pickedLocation;
      setForm(f => ({ ...f, morada: address }));
      setConfirmedCoords(coords);
      navigation.setParams({ pickedLocation: undefined });
    }
  }, [route.params?.pickedLocation]);

  // Cálculo de Preço
  const power = parseFloat(form.potencia) || 0;
  const deltas = pricing?.deltas || null;
  let estimatedFinalPrice = 0;
  let tier: any = null;

  if (deltas) {
    tier = deltas.tier.nivel_3;
    if (power <= deltas.tier.nivel_1.max_kw) tier = deltas.tier.nivel_1;
    else if (power <= deltas.tier.nivel_2.max_kw) tier = deltas.tier.nivel_2;
    const isVazio = new Date().getHours() >= 0 && new Date().getHours() < 7;
    const d_tempo = isVazio ? deltas.tempo.vazio : deltas.tempo.fora_vazio;
    const effectiveBase = form.preco === "" ? tier.floor : parseFloat(form.preco) || 0;
    const p_calc = effectiveBase * (1 + d_tempo + tier.multiplicador);
    estimatedFinalPrice = Math.min(Math.max(Math.round(p_calc), tier.floor), tier.ceil);
  }

  const handleSearch = async (text: string) => {
    setForm({ ...form, morada: text });
    if (text.length > 3) {
      setSearchLoading(true);
      try {
        const res = await fetchAddressSuggestions(text);
        setSuggestions(Array.isArray(res) ? res : []);
      } catch (error) { setSuggestions([]); }
      finally { setSearchLoading(false); }
    } else { setSuggestions([]); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    const finalPrice = form.preco === "" ? (tier?.floor || 0) : parseFloat(form.preco);
    
    if (!confirmedCoords || !form.morada || !form.potencia || !image) {
      Alert.alert("Erro", "Campos obrigatórios em falta.");
      return;
    }
    
    setLoading(true);
    const cityParts = form.morada.split(',');
    const city = cityParts.length > 1 ? cityParts[cityParts.length - 2].trim() : "Desconhecido";
    
    const result = await createCharger({
      ...form, 
      potencia_kw: power, 
      p_base: finalPrice, 
      address_city: city,
      tipo_tomada: form.tipoTomada,
      location_type: form.local as "Indoor" | "Outdoor",      
      connection_type: form.cabo as "Socket" | "Tethered",    
      owner_uid: user?.uid || "anonimo", 
      imageUri: image,
      manualLat: confirmedCoords.lat, 
      manualLng: confirmedCoords.lng,
      access_info: "", // <-- Propriedade em falta reposta
    });
    
    setLoading(false);
    if (result.success) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Registar Posto</Text>

          {/* Foto */}
          <Text style={styles.label}>Foto *</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color={Colors.primary} />
                <Text style={{ color: Colors.primary, marginTop: 8 }}>Anexar Foto</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Localização */}
          <Text style={styles.label}>Localização *</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="location" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, height: 50 }} placeholder="Morada..." value={form.morada} onChangeText={handleSearch} />
            {searchLoading && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>
          
          {suggestions.map((item, i) => (
            <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => { setForm({...form, morada: item.label}); setConfirmedCoords({lat: Number(item.lat), lng: Number(item.lng)}); setSuggestions([]); }}>
              <Ionicons name="pin" size={18} color={Colors.gray} style={{ marginRight: 12 }} />
              <Text style={styles.suggestionText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.mapTrigger} onPress={() => navigation.navigate("LocationPicker", { initialRegion: currentRegion })}>
            <MaterialIcons name="map" size={20} color={Colors.primary} />
            <Text style={styles.mapTriggerText}>{confirmedCoords ? "✓ Confirmado" : "Definir no mapa"}</Text>
          </TouchableOpacity>

          {/* Dados Técnicos */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Potência (kW) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.potencia} onChangeText={(t) => setForm({ ...form, potencia: t })} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Preço (IONS)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.preco} onChangeText={(t) => setForm({ ...form, preco: t })} placeholder="Auto" />
            </View>
          </View>

          <View style={{ backgroundColor: Colors.primaryLight, padding: 15, borderRadius: 12, marginTop: 15 }}>
            <Text style={{ fontWeight: 'bold' }}>Tarifa: {estimatedFinalPrice} IONS/kWh</Text>
          </View>

          {/* Seletores */}
          <Text style={styles.label}>Tipo de Conetor</Text>
          <ConnectorGridSelector current={form.tipoTomada} onSelect={(v: string) => setForm({ ...form, tipoTomada: v })} />

          <Text style={styles.label}>Ambiente</Text>
          <SlidingRowSelector current={form.local} onSelect={(v: string) => setForm({ ...form, local: v })} options={[{ label: "Interior", value: "Indoor" }, { label: "Exterior", value: "Outdoor" }]} />

          <Text style={styles.label}>Cabo</Text>
          <SlidingRowSelector current={form.cabo} onSelect={(v: string) => setForm({ ...form, cabo: v })} options={[{ label: "Só Tomada", value: "Socket" }, { label: "Cabo Preso", value: "Tethered" }]} />

          {/* Submit */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>PUBLICAR</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddChargerScreen;