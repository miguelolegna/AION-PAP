// src/screens/HostBookingsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';

const HostBookingsScreen = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Escuta em tempo real pedidos PENDENTES para os postos deste utilizador
    const q = query(
      collection(db, "bookings"),
      where("owner_uid", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDecision = async (bookingId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus,
        updated_at: new Date()
      });
      Alert.alert("Sucesso", `Reserva ${newStatus === 'accepted' ? 'aceite' : 'rejeitada'}.`);
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar estado.");
    }
  };

  if (loading) return <ActivityIndicator style={{flex:1}} color={Colors.primary} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF', padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Gestão de Pedidos</Text>
      
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 15, borderRadius: 12, backgroundColor: '#F9F9F9', marginBottom: 15, borderWidth: 1, borderColor: '#EEE' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.charger_address}</Text>
            <Text style={{ color: Colors.gray }}>Valor: {item.total_price}€</Text>
            
            <View style={{ flexDirection: 'row', marginTop: 15 }}>
              <TouchableOpacity 
                onPress={() => handleDecision(item.id, 'accepted')}
                style={{ flex: 1, backgroundColor: Colors.success, padding: 12, borderRadius: 8, marginRight: 10, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ACEITAR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleDecision(item.id, 'rejected')}
                style={{ flex: 1, backgroundColor: Colors.danger, padding: 12, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>REJEITAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: Colors.gray }}>Não existem pedidos pendentes.</Text>}
      />
    </View>
  );
};

export default HostBookingsScreen;