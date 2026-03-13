import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../styles/GlobalStyles';
import { HomeStyles } from '../styles/Screens/HomeStyles'; 

const HomeScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chargers, setChargers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  // 1. Monitorizar todos os carregadores (Tempo Real)
  useEffect(() => {
    const q = query(collection(db, "chargers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChargers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Monitorizar pedidos pendentes para o DONO (Tempo Real)
  useEffect(() => {
    if (!user) {
      setPendingRequests([]);
      return;
    }
    const q = query(
      collection(db, "bookings"),
      where("owner_uid", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAction = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, "bookings", id), { 
        status, 
        updated_at: new Date() 
      });
      Alert.alert("SISTEMA", `Reserva ${status === 'accepted' ? 'ACEITE' : 'RECUSADA'}.`);
    } catch (e) {
      Alert.alert("ERRO", "Falha crítica ao processar decisão.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Encerrar sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout }
    ]);
  };

  if (loading) return <View style={HomeStyles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={HomeStyles.container}>
      {/* HEADER */}
      <View style={HomeStyles.header}>
        <View>
          <Text style={HomeStyles.title}>{user ? `Olá, Condutor` : "Olá, Visitante"}</Text>
          <Text style={HomeStyles.subtitle}>{chargers.length} postos na rede Aktie</Text>
        </View>
        {user && (
          <TouchableOpacity style={HomeStyles.logoutButton} onPress={handleLogout}>
            <Text style={HomeStyles.logoutText}>Sair</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* DASHBOARD DE GESTÃO (Aparece apenas se houver pedidos) */}
        {pendingRequests.length > 0 && (
          <View style={{ backgroundColor: Colors.primary, padding: 15, borderRadius: 20, margin: 15, elevation: 5 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 12, fontSize: 16 }}>
              ⚠️ TENS {pendingRequests.length} PEDIDOS PENDENTES!
            </Text>
            <FlatList 
              data={pendingRequests}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 15, marginRight: 12, width: 260 }}>
                  <Text style={{ fontWeight: 'bold', color: Colors.dark }} numberOfLines={1}>{item.charger_address}</Text>
                  <Text style={{ fontSize: 12, color: Colors.gray, marginTop: 4 }}>Total: {item.total_price}€</Text>
                  
                  <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <TouchableOpacity 
                      onPress={() => handleAction(item.id, 'accepted')}
                      style={{ backgroundColor: Colors.success, padding: 8, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 8 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>ACEITAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleAction(item.id, 'rejected')}
                      style={{ backgroundColor: Colors.danger, padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>RECUSAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* LISTA DE POSTOS DISPONÍVEIS */}
        <View style={{ paddingHorizontal: 15 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: Colors.dark }}>Explorar Rede</Text>
          {chargers.map((item) => (
            <View key={item.id} style={HomeStyles.card}>
              <View style={HomeStyles.cardHeader}>
                <Text style={HomeStyles.cardTitle}>{item.morada || "Sem morada"}</Text>
                <View style={item.is_active ? HomeStyles.badgeActive : HomeStyles.badgeInactive} />
              </View>
              <Text style={HomeStyles.cardInfo}>Potência: {item.potencia_kw} kW • {item.tipo_tomada}</Text>
              <Text style={HomeStyles.cardPrice}>{item.preco_kwh} €/kWh</Text>
              {!user && (
                <Text style={{fontSize: 10, color: Colors.primary, marginTop: 5}}>Faz login para reservar</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;