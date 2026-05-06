// src/services/ChargerService.ts
import { addDoc, collection, Timestamp, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebaseConfig';

// ==========================================
// 1. INTERFACES DE DADOS
// ==========================================
export interface ChargerFormData {
  morada: string;
  potencia_kw: string;
  preco_kwh: string;
  tipo_tomada: string;
  location_type: "Indoor" | "Outdoor";
  connection_type: "Socket" | "Tethered";
  access_info: string;
  owner_uid: string;
  imageUri?: string;
  manualLat?: number;
  manualLng?: number;
}

export interface BookingData {
  charger_id: string;
  charger_address: string;
  user_uid: string;
  owner_uid: string;
  start_time: Date;
  end_time: Date;
  estimated_kwh: number;
  total_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  payment_status: string;
  charger_is_deleted: boolean;
}

// ==========================================
// 2. FUNÇÕES AUXILIARES (STORAGE)
// ==========================================
const uploadChargerImage = async (uri: string, ownerUid: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `chargers/${ownerUid}_${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

// ==========================================
// 3. GEOCODIFICAÇÃO (CUSTO-ZERO VIA NOMINATIM)
// ==========================================

// Geocodificação Direta: Morada -> Coordenadas
export const fetchAddressSuggestions = async (query: string) => {
  if (query.length < 5) return [];
  try {
    const baseUrl = "https://nominatim.openstreetmap.org/search";
    const params = new URLSearchParams({
      q: query, format: "json", countrycodes: "pt", addressdetails: "1", limit: "5"
    });
    const response = await fetch(`${baseUrl}?${params.toString()}`, { 
      headers: { 'User-Agent': 'Aktie-Production-v1' } 
    });
    const data = await response.json();
    return data.map((item: any) => ({
      label: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error("Geocoding failed:", error);
    return [];
  }
};

// Geocodificação Inversa: Coordenadas -> Morada
export const getAddressFromCoords = async (latitude: number, longitude: number) => {
  try {
    const baseUrl = "https://nominatim.openstreetmap.org/reverse";
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: "json",
      addressdetails: "1"
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`, { 
      headers: { 'User-Agent': 'Aktie-Production-v1' } 
    });
    
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      const road = addr.road || addr.pedestrian || "";
      const houseNumber = addr.house_number ? ` ${addr.house_number}` : "";
      const city = addr.city || addr.town || addr.village || "";
      
      return `${road}${houseNumber}${city ? `, ${city}` : ""}`.trim() || "Morada não detetada";
    }
    return "Morada selecionada";
  } catch (error) {
    console.error("Reverse Geocoding failed:", error);
    return "Coordenadas manuais";
  }
};

// ==========================================
// 4. GESTÃO DE CARREGADORES E RESERVAS
// ==========================================

export const createCharger = async (data: ChargerFormData) => {
  try {
    let firebaseUrl = "";
    if (data.imageUri) {
      firebaseUrl = await uploadChargerImage(data.imageUri, data.owner_uid);
    }

    const potencia = parseFloat(String(data.potencia_kw).replace(',', '.'));
    const preco = parseFloat(String(data.preco_kwh).replace(',', '.'));

    const docRef = await addDoc(collection(db, "chargers"), {
      morada: data.morada,
      potencia_kw: potencia,
      preco_kwh: preco,
      tipo_tomada: data.tipo_tomada,
      location_type: data.location_type,
      connection_type: data.connection_type,
      access_info: data.access_info,
      owner_uid: data.owner_uid,
      image_url: firebaseUrl, 
      is_active: true,
      rating_medio: 0,
      num_reviews: 0,
      created_at: serverTimestamp(),
      localizacao: { 
        latitude: data.manualLat || 38.7369, 
        longitude: data.manualLng || -9.1427 
      }
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Erro ao criar carregador:", error);
    return { success: false, error };
  }
};

export const createBooking = async (data: BookingData) => {
  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      charger_id: data.charger_id,
      charger_address: data.charger_address,
      user_uid: data.user_uid,
      owner_uid: data.owner_uid,
      start_time: Timestamp.fromDate(data.start_time),
      end_time: Timestamp.fromDate(data.end_time),
      estimated_kwh: data.estimated_kwh,
      total_price: data.total_price,
      status: data.status, 
      payment_status: data.payment_status,
      charger_is_deleted: data.charger_is_deleted,
      created_at: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Erro ao processar reserva:", error);
    return { success: false, error };
  }
};

export const updateBookingStatus = async (bookingId: string, newStatus: string) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { 
      status: newStatus,
      updated_at: serverTimestamp() 
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar reserva:", error);
    return { success: false, error };
  }
};

export const cancelBooking = async (bookingId: string) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { 
      status: 'cancelled',
      updated_at: serverTimestamp() 
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao cancelar reserva:", error);
    return { success: false, error };
  }
};