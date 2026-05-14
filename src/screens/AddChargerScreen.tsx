import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import {
  createCharger,
  fetchAddressSuggestions,
} from "../services/ChargerService";
import { AddChargerStyles as styles } from "../styles/Screens/AddChargerStyles";
import { Colors } from "../styles/GlobalStyles";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { getConnectorIcon } from "../utils/IconMapper";
import { usePricingConfig } from "../context/ConfigContext";

const { width } = Dimensions.get("window");
const CONTAINER_PADDING = 20;
const SELECTOR_WIDTH = width - CONTAINER_PADDING * 2;

// ==========================================
// 1. COMPONENTES AUXILIARES ANIMADOS
// ==========================================

const ConnectorGridSelector = ({ current, onSelect }: any) => {
  const options = [
    { id: 'Tipo 2', x: 0, y: 0 }, { id: 'CCS', x: 1, y: 0 },
    { id: 'Schuko', x: 0, y: 1 }, { id: 'CHAdeMO', x: 1, y: 1 },
  ];

  // Cálculo preciso: largura total menos o padding interno do container (8+8=16)
  const innerWidth = SELECTOR_WIDTH - 16;
  const itemWidth = innerWidth / 2;
  const itemHeight = 90;

  const target = options.find(o => o.id === current) || options[0];
  const transX = useRef(new Animated.Value(target.x * itemWidth)).current;
  const transY = useRef(new Animated.Value(target.y * itemHeight)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(transX, { toValue: target.x * itemWidth, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(transY, { toValue: target.y * itemHeight, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true })
    ]).start();
  }, [current]);

  return (
    <View style={styles.typeSelectorContainer}>
      {/* Background animado (O card branco) */}
      <Animated.View 
        style={[styles.typeOptionSelected, { 
          position: 'absolute', 
          width: itemWidth - 8, 
          height: itemHeight - 8,
          top: 12, 
          left: 12, 
          transform: [{ translateX: transX }, { translateY: transY }] 
        }]} 
      />
      {/* Grid de opções */}
      <View style={styles.typeOverlay}>
        {options.map((opt) => (
          <TouchableOpacity 
            key={opt.id} 
            style={[styles.typeOption, { width: itemWidth, height: itemHeight }]}
            onPress={() => onSelect(opt.id)} 
            activeOpacity={1}
          >
            <View style={styles.typeIconContainer}>
              {getConnectorIcon(opt.id, 28, current === opt.id ? Colors.primary : Colors.gray)}
            </View>
            <Text style={[styles.typeOptionText, current === opt.id && styles.typeOptionTextSelected]}>
              {opt.id}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const SlidingRowSelector = ({ options, current, onSelect }: any) => {
  const innerWidth = SELECTOR_WIDTH - 8;
  const itemWidth = innerWidth / options.length;
  const index = options.findIndex((o: any) => o.value === current);
  const transX = useRef(
    new Animated.Value(index !== -1 ? index * itemWidth : 0),
  ).current;

  useEffect(() => {
    if (index !== -1) {
      Animated.timing(transX, {
        toValue: index * itemWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [current]);

  return (
    <View style={styles.slidingContainer}>
      <Animated.View
        style={[
          styles.sliderActiveBg,
          { width: itemWidth, transform: [{ translateX: transX }] },
        ]}
      />
      {options.map((opt: any) => (
        <TouchableOpacity
          key={opt.value}
          style={styles.slidingOption}
          onPress={() => onSelect(opt.value)}
          activeOpacity={1}
        >
          <Text
            style={[
              styles.optionText,
              current === opt.value && styles.optionTextSelected,
            ]}
          >
            {opt.label || opt.value}
          </Text>
          {opt.subLabel && (
            <Text
              style={[
                styles.subLabelText,
                current === opt.value && { color: Colors.white },
              ]}
            >
              {opt.subLabel}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ==========================================
// 2. ECRÃ PRINCIPAL
// ==========================================

const AddChargerScreen = ({ navigation }: any) => {
  const { pricing } = usePricingConfig();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    morada: "",
    potencia: "",
    preco: "",
    tipoTomada: "Tipo 2",
    local: "Indoor",
    cabo: "Socket",
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [confirmedCoords, setConfirmedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 38.7369,
    longitude: -9.1427,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  // ==========================================
  // LÓGICA DE PREÇAGEM ALGORÍTMICA (SIMULAÇÃO)
  // ==========================================
  const power = parseFloat(form.potencia) || 0;
  const basePrice = parseFloat(form.preco) || 0;

  // 1. Prevenção de falhas (Fallback no carregamento inicial)
  const deltas = pricing?.deltas || null;
  let estimatedFinalPrice = 0;
  let hitsFloor = false;
  let hitsCeil = false;
  let tier: any = null;
  let somatorioDeltas = 0;

  if (deltas) {
    // 2. Determinação do Tier
    tier = deltas.tier.nivel_3;
    if (power <= deltas.tier.nivel_1.max_kw) tier = deltas.tier.nivel_1;
    else if (power <= deltas.tier.nivel_2.max_kw) tier = deltas.tier.nivel_2;

    // 3. Simulação de Variáveis Atuais (Tempo)
    const isVazio = new Date().getHours() >= 0 && new Date().getHours() < 7;
    const d_tempo = isVazio ? deltas.tempo.vazio : deltas.tempo.fora_vazio;

    // 4. Cálculo Multiplicativo Simulado
    somatorioDeltas = d_tempo + tier.multiplicador;
    const p_final_calc = basePrice * (1 + somatorioDeltas);
    const p_final_arredondado = Math.round(p_final_calc);

    // 5. Aplicação do Clamp (Floor/Ceil)
    estimatedFinalPrice = Math.min(Math.max(p_final_arredondado, tier.floor), tier.ceil);
    hitsFloor = p_final_arredondado < tier.floor && basePrice > 0;
    hitsCeil = p_final_arredondado > tier.ceil && basePrice > 0;
  }

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let location = await Location.getCurrentPositionAsync({});
      setCurrentRegion((prev) => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
    })();
  }, []);

  const handleSearch = async (text: string) => {
    setForm({ ...form, morada: text });
    if (text.length > 4) {
      const res = await fetchAddressSuggestions(text);
      setSuggestions(res);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item: any) => {
    setForm({ ...form, morada: item.label });
    setConfirmedCoords({ lat: Number(item.lat), lng: Number(item.lng) });
    setSuggestions([]);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (
      !confirmedCoords ||
      !form.morada ||
      !form.potencia ||
      !form.preco ||
      !image
    ) {
      Alert.alert(
        "Campos Obrigatórios",
        "Preencha todos os campos e confirme a localização/foto."
      );
      return;
    }
    setLoading(true);

    // Extração da cidade a partir da string da morada para o backend (Delta Macro)
    const cityParts = form.morada.split(',');
    const city = cityParts.length > 1 ? cityParts[cityParts.length - 2].trim() : "Desconhecido";

    const result = await createCharger({
      ...form,
      potencia_kw: parseFloat(form.potencia),
      p_base: parseFloat(form.preco),
      address_city: city,
      tipo_tomada: form.tipoTomada,
      location_type: form.local as any,
      connection_type: form.cabo as any,
      owner_uid: user?.uid || "anonimo",
      imageUri: image,
      manualLat: confirmedCoords.lat,
      manualLng: confirmedCoords.lng,
      access_info: "",
    });
    setLoading(false);
    if (result.success) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Registar Posto</Text>

          <Text style={styles.label}>Foto do Carregador *</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons
                  name="add-a-photo"
                  size={40}
                  color={Colors.primary}
                />
                <Text style={{ color: Colors.primary, marginTop: 8 }}>
                  Anexar Foto
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Onde está localizado? *</Text>
          <View style={styles.searchContainer}>
            <Ionicons
              name="location"
              size={20}
              color={Colors.primary}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={{ flex: 1, height: 50, fontSize: 16 }}
              placeholder="Pesquisar morada..."
              value={form.morada}
              onChangeText={handleSearch}
            />
          </View>

          {suggestions.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(item)}
            >
              <Ionicons
                name="pin"
                size={18}
                color={Colors.gray}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.suggestionText} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.mapTrigger}
            onPress={() =>
              navigation.navigate("LocationPicker", {
                initialRegion: currentRegion,
                onLocationSelected: (d: any) => {
                  setForm({ ...form, morada: d.address });
                  setConfirmedCoords(d.coords);
                },
              })
            }
          >
            <MaterialIcons name="map" size={20} color={Colors.primary} />
            <Text style={styles.mapTriggerText}>
              {confirmedCoords
                ? "✓ Alterar localização no mapa"
                : "Definir no mapa"}
            </Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Potência (kW) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={form.potencia}
                onChangeText={(t) => setForm({ ...form, potencia: t })}
                placeholder="Ex: 22"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Preço Base (IONS) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={form.preco}
                onChangeText={(t) => setForm({ ...form, preco: t })}
                placeholder="Ex: 45"
              />
            </View>
          </View>

          {/* PREVIEW DA TARIFAÇÃO DINÂMICA */}
          {deltas && (
            <View style={{ 
              backgroundColor: hitsFloor || hitsCeil ? '#FFF5F5' : Colors.primaryLight, 
              padding: 12, 
              borderRadius: 8, 
              marginTop: 15 
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: Colors.dark, fontWeight: 'bold' }}>
                  Tarifa Final Atual:
                </Text>
                <Text style={{ fontSize: 18, color: hitsFloor || hitsCeil ? '#E53E3E' : Colors.primary, fontWeight: '800' }}>
                  {estimatedFinalPrice} IONS/kWh
                </Text>
              </View>

              {hitsFloor && (
                <Text style={{ fontSize: 11, color: '#E53E3E', marginTop: 4, fontWeight: '600' }}>
                  ⚠️ O Preço Base é demasiado baixo. Proteção Anti-Dumping (Floor Price) aplicada automaticamente: {tier.floor} IONS.
                </Text>
              )}
              
              {hitsCeil && (
                <Text style={{ fontSize: 11, color: '#E53E3E', marginTop: 4, fontWeight: '600' }}>
                  ⚠️ O Preço Base excede os limites de mercado da plataforma. Limite (Ceiling Price) aplicado automaticamente: {tier.ceil} IONS.
                </Text>
              )}

              {!hitsFloor && !hitsCeil && basePrice > 0 && (
                <Text style={{ fontSize: 11, color: Colors.gray, marginTop: 4 }}>
                  Simulação: P_base {basePrice} + Ajustes de Categoria e Horário ({Math.round(somatorioDeltas * 100)}%)
                </Text>
              )}
            </View>
          )}

          <Text style={styles.label}>Tipo de Conetor *</Text>
          <ConnectorGridSelector
            current={form.tipoTomada}
            onSelect={(v: string) => setForm({ ...form, tipoTomada: v })}
          />

          <Text style={styles.label}>Ambiente</Text>
          <SlidingRowSelector
            current={form.local}
            onSelect={(v: string) => setForm({ ...form, local: v })}
            options={[
              { label: "Interior", value: "Indoor" },
              { label: "Exterior", value: "Outdoor" },
            ]}
          />

          <Text style={styles.label}>Configuração do Cabo</Text>
          <SlidingRowSelector
            current={form.cabo}
            onSelect={(v: string) => setForm({ ...form, cabo: v })}
            options={[
              { label: "Só Tomada", subLabel: "Socket", value: "Socket" },
              { label: "Cabo Preso", subLabel: "Tethered", value: "Tethered" },
            ]}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>PUBLICAR CARREGADOR</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddChargerScreen;