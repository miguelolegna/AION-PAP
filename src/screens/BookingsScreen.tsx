// src/screens/BookingsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Colors, GlobalStyles } from '../styles/GlobalStyles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const BookingsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    const q = query(
      collection(db, "bookings"),
      where("user_uid", "==", user.uid),
      where("status", "in", ["pending", "accepted", "active"]),
      orderBy("start_time", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStartCharging = async (bookingId: string) => {
    if (!user) return;
    setLoading(true);

    try {
      const concurrencyQuery = query(
        collection(db, "bookings"),
        where("user_uid", "==", user.uid),
        where("status", "==", "active")
      );

      const activeSessionsSnap = await getDocs(concurrencyQuery);

      if (!activeSessionsSnap.empty) {
        setLoading(false);
        Alert.alert("AÇÃO BLOQUEADA", "Já tens um carregamento em curso noutro posto.");
        return;
      }

      Alert.alert(
        "Confirmar Carregamento",
        "Desejas iniciar a sessão agora?",
        [
          { text: "Cancelar", style: "cancel", onPress: () => setLoading(false) },
          { 
            text: "Sim, Iniciar", 
            onPress: async () => {
              try {
                await updateDoc(doc(db, "bookings", bookingId), {
                  status: 'active',
                  session_start: Timestamp.now()
                });
                setLoading(false);
                navigation.navigate('ActiveSession', { bookingId });
              } catch (updateError) {
                setLoading(false);
                Alert.alert("ERRO", "Falha de permissões no Firestore.");
              }
            }
          }
        ]
      );

    } catch (error: any) {
      setLoading(false);
      Alert.alert("ERRO TÉCNICO", "Falha ao verificar a integridade da sessão.");
    }
  };

  const renderItem = ({ item }: any) => {
    const isAccepted = item.status === 'accepted';
    const isActive = item.status === 'active';

    return (
      <View style={GlobalStyles.cardItem}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.dark, flex: 1 }} numberOfLines={1}>{item.charger_address}</Text>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: item.status === 'active' ? Colors.primary : Colors.primaryLight }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: item.status === 'active' ? Colors.white : Colors.primary }}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Ionicons name="time-outline" size={16} color={Colors.gray} />
          <Text style={{ fontSize: 14, color: Colors.gray, marginLeft: 8 }}>{item.start_time?.toDate().toLocaleString('pt-PT')}</Text>
        </View>

        {isAccepted && (
          <TouchableOpacity 
            style={{ backgroundColor: Colors.primary, marginTop: 20, padding: 15, borderRadius: 12, alignItems: 'center' }}
            onPress={() => handleStartCharging(item.id)}
          >
            <Text style={{ color: Colors.white, fontWeight: 'bold' }}>INICIAR CARREGAMENTO</Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity 
            style={{ marginTop: 15, borderWidth: 1.5, borderColor: Colors.primary, padding: 12, borderRadius: 10, alignItems: 'center' }}
            onPress={() => navigation.navigate('ActiveSession', { bookingId: item.id })}
          >
            <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>VER SESSÃO ATIVA</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER PADRONIZADO (Estilo Perfil) */}
      <View style={GlobalStyles.headerCard}>
        <View style={{ backgroundColor: Colors.primaryLight, padding: 15, borderRadius: 40, marginBottom: 15 }}>
          <Ionicons name="calendar" size={40} color={Colors.primary} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.dark }}>
          Minhas Reservas
        </Text>
        <Text style={{ fontSize: 14, color: Colors.gray, fontWeight: '500', marginTop: 5 }}>
          As tuas sessões ativas e agendadas
        </Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: Colors.gray }}>Não tens nenhum carregamento planeado.</Text>}
      />
    </SafeAreaView>
  );
};

export default BookingsScreen;