import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { cancelBooking } from '../services/ChargerService';
import { BookingsStyles as styles } from '../styles/Screens/BookingsStyles';
import { Colors } from '../styles/GlobalStyles';
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
      orderBy("start_time", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro Bookings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleString('pt-PT', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleCancelReservation = (bookingId: string) => {
    Alert.alert(
      "Cancelar Reserva",
      "Tens a certeza que queres cancelar esta solicitação?",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive",
          onPress: async () => {
            const result = await cancelBooking(bookingId);
            if (!result.success) {
              Alert.alert("Erro", "Não foi possível cancelar a reserva.");
            }
          }
        }
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted': return { label: 'ACEITE', color: Colors.success, bg: Colors.primaryLight };
      case 'rejected': return { label: 'RECUSADA', color: Colors.danger, bg: Colors.dangerLight };
      case 'cancelled': return { label: 'CANCELADA', color: Colors.gray, bg: '#ECEFF1' };
      case 'completed': return { label: 'CONCLUÍDA', color: Colors.dark, bg: Colors.border };
      default: return { label: 'PENDENTE', color: Colors.warning, bg: '#FFF3E0' };
    }
  };

  const renderItem = ({ item }: any) => {
    const statusCfg = getStatusConfig(item.status);
    const isPending = item.status === 'pending';
    const chargerDeleted = item.charger_is_deleted === true;

    return (
      <TouchableOpacity 
        style={[styles.bookingCard, chargerDeleted && { opacity: 0.8 }]}
        onPress={() => navigation.navigate('BookingDetails', { booking: item })}
        activeOpacity={0.7}
      >
        <View style={styles.headerRow}>
          <Text style={styles.address} numberOfLines={1}>{item.charger_address}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {chargerDeleted && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="warning" size={14} color={Colors.danger} />
            <Text style={{ color: Colors.danger, fontSize: 12, marginLeft: 5, fontWeight: 'bold' }}>
              Este posto foi removido pelo dono.
            </Text>
          </View>
        )}

        <View style={styles.detailsRow}>
          <Ionicons name="time-outline" size={16} color={Colors.gray} />
          <Text style={styles.detailsText}>{formatDate(item.start_time)}</Text>
        </View>

        <View style={styles.detailsRow}>
          <MaterialCommunityIcons name="lightning-bolt-outline" size={16} color={Colors.gray} />
          <Text style={styles.detailsText}>
            Estimado: {item.estimated_kwh} kWh • {item.total_price} €
          </Text>
        </View>

        {isPending && !chargerDeleted && (
          <TouchableOpacity 
            style={{ marginTop: 15, padding: 10, borderTopWidth: 1, borderTopColor: '#EEE', alignItems: 'center' }}
            onPress={() => handleCancelReservation(item.id)}
          >
            <Text style={{ color: Colors.danger, fontWeight: 'bold', fontSize: 12 }}>CANCELAR SOLICITAÇÃO</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={styles.title}>As Minhas Reservas</Text>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-remove" size={80} color={Colors.border} />
            <Text style={styles.emptyText}>Ainda não tens reservas feitas.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default BookingsScreen;