// src/screens/AddChargerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, 
  Modal, Image, Animated, Easing, Dimensions
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { createCharger, fetchAddressSuggestions, getAddressFromCoords } from '../services/ChargerService';
import { AddChargerStyles as styles } from '../styles/Screens/AddChargerStyles';
import { Colors } from '../styles/GlobalStyles';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getConnectorIcon } from '../utils/IconMapper';

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 20;
const SELECTOR_WIDTH = width - (CONTAINER_PADDING * 2);
const ITEM_HEIGHT = 75;

// ==========================================
// 1. COMPONENTES DE ANIMAÇÃO (FORA DA CLASSE)
// ==========================================

const ConnectorGridSelector = ({ current, onSelect }: any) => {
  const options = [
    { id: 'Tipo 2', x: 0, y: 0 }, { id: 'CCS', x: 1, y: 0 },
    { id: 'Schuko', x: 0, y: 1 }, { id: 'CHAdeMO', x: 1, y: 1 },
  ];
  const itemWidth = SELECTOR_WIDTH / 2;
  const target = options.find(o => o.id === current) || options[0];

  const transX = useRef(new Animated.Value(target.x * itemWidth)).current;
  const transY = useRef(new Animated.Value(target.y * ITEM_HEIGHT)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(transX, { toValue: target.x * itemWidth, duration: 350, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
      Animated.timing(transY, { toValue: target.y * ITEM_HEIGHT, duration: 350, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true })
    ]).start();
  }, [current]);

  return (
    <View style={[styles.gridContainer, { height: ITEM_HEIGHT * 2 }]}>
      <Animated.View style={[styles.sliderActiveBg, { width: itemWidth - 8, height: ITEM_HEIGHT - 8, transform: [{ translateX: transX }, { translateY: transY }] }]} />
      <View style={styles.gridOverlay}>
        {options.map((opt) => (
          <TouchableOpacity key={opt.id} style={[styles.gridOption, { width: itemWidth, height: ITEM_HEIGHT }]} onPress={() => onSelect(opt.id)} activeOpacity={1}>
            <View style={{ marginBottom: 4 }}>{getConnectorIcon(opt.id, 28, current === opt.id ? Colors.primary : Colors.gray)}</View>
            <Text style={[styles.optionText, current === opt.id && styles.optionTextSelected]}>{opt.id}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const SlidingRowSelector = ({ options, current, onSelect }: any) => {
  const itemWidth = SELECTOR_WIDTH / options.length;
  const index = options.findIndex((o: any) => o.value === current);
  const transX = useRef(new Animated.Value(index !== -1 ? index * itemWidth : 0)).current;

  useEffect(() => {
    if (index !== -1) {
      Animated.timing(transX, { toValue: index * itemWidth, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
  }, [current]);

  return (
    <View style={[styles.slidingContainer, { height: 60 }]}>
      <Animated.View style={[styles.sliderActiveBg, { width: itemWidth - 8, height: 52, transform: [{ translateX: transX }] }]} />
      {options.map((opt: any) => (
        <TouchableOpacity key={opt.value} style={[styles.slidingOption, { width: itemWidth }]} onPress={() => onSelect(opt.value)} activeOpacity={1}>
          <Text style={[styles.optionText, current === opt.value && styles.optionTextSelected]}>{opt.label || opt.value}</Text>
          {opt.subLabel && <Text style={[styles.subLabelText, current === opt.value && styles.subLabelSelected]}>{opt.subLabel}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ==========================================
// 2. ECRÃ PRINCIPAL COM LÓGICA DE LOCALIZAÇÃO
// ==========================================

const AddChargerScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  
  // Estados de Localização
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [confirmedCoords, setConfirmedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [tempRegion, setTempRegion] = useState({
    latitude: 38.7369, longitude: -9.1427, latitudeDelta: 0.002, longitudeDelta: 0.002,
  });

  const [form, setForm] = useState({
    morada: '', potencia: '', preco: '',
    tipoTomada: 'Tipo 2', local: 'Indoor', cabo: 'Socket', info: ''
  });

  // Gatilho de GPS Inicial
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      const currentPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
      setTempRegion(currentPos);
      setConfirmedCoords({ lat: currentPos.latitude, lng: currentPos.longitude });
    })();
  }, []);

  const handleSearchAddress = async (text: string) => {
    setForm({ ...form, morada: text });
    if (text.length > 4) {
      const res = await fetchAddressSuggestions(text);
      setSuggestions(res);
    } else { setSuggestions([]); }
  };

  const selectSuggestion = (item: any) => {
    const coords = { lat: Number(item.lat), lng: Number(item.lng) };
    setForm({ ...form, morada: item.label });
    setConfirmedCoords(coords);
    setTempRegion({ ...tempRegion, latitude: coords.lat, longitude: coords.lng });
    setSuggestions([]);
  };

  const handleConfirmMapLocation = async () => {
    setLoading(true);
    const address = await getAddressFromCoords(tempRegion.latitude, tempRegion.longitude);
    setForm({ ...form, morada: address });
    setConfirmedCoords({ lat: tempRegion.latitude, lng: tempRegion.longitude });
    setIsMapPickerVisible(false);
    setLoading(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!confirmedCoords || !form.morada || !form.potencia || !form.preco || !image) {
      Alert.alert("Erro", "Preencha os campos e confirme a localização/foto.");
      return;
    }
    setLoading(true);
    const result = await createCharger({
      ...form,
      potencia_kw: form.potencia, preco_kwh: form.preco,
      tipo_tomada: form.tipoTomada,
      location_type: form.local as "Indoor" | "Outdoor",
      connection_type: form.cabo as "Socket" | "Tethered",
      owner_uid: user?.uid || "anonimo", imageUri: image,
      manualLat: confirmedCoords.lat, manualLng: confirmedCoords.lng,
      access_info: ''
    });
    setLoading(false);
    if (result.success) { navigation.goBack(); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Novo Carregador</Text>

          {/* FOTO */}
          <Text style={styles.label}>Foto do Carregador *</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : 
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="add-a-photo" size={40} color={Colors.primary} />
              <Text style={{ color: Colors.primary, marginTop: 8 }}>Anexar Foto</Text>
            </View>}
          </TouchableOpacity>

          {/* LOCALIZAÇÃO (O SEU TRABALHO ESTÁ AQUI) */}
          <Text style={styles.label}>Onde está localizado? *</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="location" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, height: 50, fontSize: 16 }} placeholder="Pesquisar morada..." value={form.morada} onChangeText={handleSearchAddress} />
          </View>

          {suggestions.map((item, index) => (
            <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
              <Ionicons name="pin" size={18} color="#999" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}><Text style={styles.suggestionText} numberOfLines={1}>{item.label}</Text></View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.mapTrigger} onPress={() => setIsMapPickerVisible(true)}>
            <MaterialIcons name="map" size={20} color={Colors.primary} />
            <Text style={styles.mapTriggerText}>{confirmedCoords ? "✓ Localização definida" : "Definir no mapa"}</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Potência (kW) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.potencia} onChangeText={(t) => setForm({...form, potencia: t})} placeholder="Ex: 22" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Preço (€/kWh) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.preco} onChangeText={(t)=> setForm({...form, preco: t})} placeholder="Ex: 0.45" />
            </View>
          </View>

          <Text style={styles.label}>Tipo de Conetor *</Text>
          <ConnectorGridSelector current={form.tipoTomada} onSelect={(val: string) => setForm({...form, tipoTomada: val})} />

          <Text style={styles.label}>Ambiente</Text>
          <SlidingRowSelector current={form.local} onSelect={(val: string) => setForm({...form, local: val})} options={[{label:'Interior', value:'Indoor'}, {label:'Exterior', value:'Outdoor'}]} />

          <Text style={styles.label}>Configuração do Cabo</Text>
          <SlidingRowSelector current={form.cabo} onSelect={(val: string) => setForm({...form, cabo: val})} options={[{label:'Só Tomada', subLabel:'Socket', value:'Socket'}, {label:'Cabo Preso', subLabel:'Tethered', value:'Tethered'}]} />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>PUBLICAR CARREGADOR</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DO MAPA */}
      <Modal visible={isMapPickerVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} region={tempRegion} onRegionChangeComplete={(r) => setTempRegion(r)} toolbarEnabled={false} />
          <View style={styles.fixedPinContainer} pointerEvents="none">
            <Ionicons name="location" size={48} color={Colors.primary} />
            <View style={styles.pinShadow} />
          </View>
          <View style={styles.mapFooter}>
            <TouchableOpacity style={styles.confirmMapButton} onPress={handleConfirmMapLocation}>
              <Text style={styles.confirmMapText}>Confirmar este local</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setIsMapPickerVisible(false)}>
              <Text style={{ color: '#ff5252', fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddChargerScreen;