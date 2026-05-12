// src/screens/BookingsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore'; 
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Colors, GlobalStyles } from '../styles/GlobalStyles';
import { BookingsStyles as styles } from '../styles/Screens/BookingsStyles';
import { Ionicons } from '@expo/vector-icons';

const BookingsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
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
    setProcessingId(bookingId);

    try {
      const concurrencyQuery = query(
        collection(db, "bookings"),
        where("user_uid", "==", user.uid),
        where("status", "==", "active")
      );

      const activeSessionsSnap = await getDocs(concurrencyQuery);

      if (!activeSessionsSnap.empty) {
        setProcessingId(null);
        Alert.alert("AÇÃO BLOQUEADA", "Já tens um carregamento em curso noutro posto.");
        return;
      }

      // CORREÇÃO CRÍTICA: Invocação direta da Cloud Function
      // É o backend que avalia os 5000 IONS vs o custo da reserva.
      const iniciarSessao = httpsCallable(functions, 'iniciarSessaoCarregamento');
      
      // Assumindo a duração original (se houver) ou fallback de 2 horas se os dados estiverem corrompidos
      const duracaoHoras = 2; 

      await iniciarSessao({
        bookingId: bookingId,
        duracaoHoras: duracaoHoras
      });

      // Sucesso Silencioso: A Cloud Function bloqueou os fundos e mudou o status para 'active'.
      // O listener do Firestore fará a UI atualizar o botão para "VER SESSÃO ATIVA".

    } catch (functionError: any) {
      console.error("Erro da Cloud Function:", functionError);
      
      if (functionError?.code === 'functions/resource-exhausted' || functionError?.message?.includes('insuficiente')) {
        Alert.alert(
          "Saldo Insuficiente",
          "Não tens IONS suficientes na carteira para cobrir a caução de segurança.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Carregar IONS", onPress: () => navigation.navigate('Payments') }
          ]
        );
      } else {
        Alert.alert("ERRO TÉCNICO", functionError.message || "Falha ao verificar a integridade da sessão no servidor.");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const renderItem = ({ item }: any) => {
    const isAccepted = item.status === 'accepted';
    const isActive = item.status === 'active';
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.bookingCard}>
        <View style={styles.headerRow}>
          <Text style={styles.address} numberOfLines={1}>
            {/* Fallback de UI visto que a morada foi retirada da reserva */}
            {item.charger_id ? `Posto ${item.charger_id.substring(0, 6)}` : "Posto Desconhecido"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? Colors.primary : Colors.primaryLight }]}>
            <Text style={[styles.statusText, { color: isActive ? Colors.white : Colors.primary }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Ionicons name="time-outline" size={16} color={Colors.gray} />
          <Text style={styles.detailsText}>{item.start_time?.toDate().toLocaleString('pt-PT')}</Text>
        </View>

        {isAccepted && (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
            onPress={() => handleStartCharging(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
               <ActivityIndicator color={Colors.white} />
            ) : (
               <>
                 <Ionicons name="flash" size={18} color={Colors.white} />
                 <Text style={styles.buttonText}>AUTORIZAR E INICIAR</Text>
               </>
            )}
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary }]}
            onPress={() => navigation.navigate('ActiveSession', { bookingId: item.id })}
          >
            <Text style={[styles.buttonText, { color: Colors.primary }]}>VER SESSÃO ATIVA</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
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
        // Correção de UI: Margem inferior aplicada aqui
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} 
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Não tens nenhum carregamento planeado.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default BookingsScreen;