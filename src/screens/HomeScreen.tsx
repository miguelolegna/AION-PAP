// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Alert
} from 'react-native';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Colors, GlobalStyles } from '../styles/GlobalStyles';
import { HomeStyles as styles } from '../styles/Screens/HomeStyles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const HomeScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chargers, setChargers] = useState<any[]>([]);
  const [pendingReservations, setPendingReservations] = useState<any[]>([]); // Novo estado para reservas
  
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  useEffect(() => {
    // 1. Escuta de Carregadores (Público)
    const qChargers = query(collection(db, "chargers"));
    const unsubChargers = onSnapshot(qChargers, (snapshot) => {
      setChargers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // 2. Escuta de Reservas Pendentes (Apenas se o utilizador estiver autenticado)
    let unsubReservations = () => {};
    if (user) {
      const qReservations = query(
        collection(db, "bookings"),
        where("owner_uid", "==", user.uid),
        where("status", "==", "pending")
      );
      unsubReservations = onSnapshot(qReservations, (snapshot) => {
        setPendingReservations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    return () => {
      unsubChargers();
      unsubReservations();
    };
  }, [user]);

  const handleLoginPress = () => navigation.navigate('Auth');

  // Lógica de Atualização da Reserva
  const handleReservationAction = async (reservaId: string, action: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, "bookings", reservaId), {
        status: action
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar a reserva.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Componente injetado no topo da lista principal
  const renderPendingReservations = () => {
    if (pendingReservations.length === 0) return null;

    return (
      <View style={styles.pendingSection}>
        <Text style={styles.pendingSectionTitle}>Pedidos Pendentes</Text>
        {pendingReservations.map((reserva) => (
          <View key={reserva.id} style={styles.pendingCard}>
            <View style={styles.pendingInfo}>
              <Ionicons name="time-outline" size={24} color={Colors.warning} />
              <View style={styles.pendingTextContainer}>
                <Text style={styles.pendingTextLabel}>Nova Reserva</Text>
                <Text style={styles.pendingTextSub}>ID: {reserva.id.slice(0, 8)}...</Text>
              </View>
            </View>
            <View style={styles.pendingActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]} 
                onPress={() => handleReservationAction(reserva.id, 'rejected')}
              >
                <Ionicons name="close" size={20} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.acceptButton]} 
                onPress={() => handleReservationAction(reserva.id, 'accepted')}
              >
                <Ionicons name="checkmark" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <View style={GlobalStyles.headerCard}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="flash" size={40} color={Colors.primary} />
        </View>
        
        <Text style={styles.headerTitle}>
          {user ? `Olá, Condutor` : "Explorar Rede"}
        </Text>
        
        <Text style={styles.headerSubtitle}>
          {chargers.length} postos disponíveis na Aktie
        </Text>
        
        {!user && (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLoginPress}
          >
            <Text style={styles.loginButtonText}>ENTRAR NA CONTA</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={chargers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderPendingReservations} // Injeção do bloco de reservas
        renderItem={({ item }) => {
          const badgeBgColor = item.is_active ? Colors.success + '20' : Colors.danger + '20';
          const badgeTextColor = item.is_active ? Colors.success : Colors.danger;

          return (
            <TouchableOpacity 
              style={GlobalStyles.cardItem}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ChargerDetails', { charger: item })}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardAddress} numberOfLines={1}>
                  {item.morada || "Sem morada"}
                </Text>
                
                <View style={[styles.badgeBase, { backgroundColor: badgeBgColor }]}>
                   <Text style={[styles.badgeTextBase, { color: badgeTextColor }]}>
                      {item.is_active ? 'ATIVO' : 'INATIVO'}
                   </Text>
                </View>
              </View>
              
              <View style={styles.cardDetailsRow}>
                <MaterialCommunityIcons name="ev-plug-type2" size={16} color={Colors.gray} />
                <Text style={styles.cardDetailsText}>
                  {item.potencia_kw} kW • {item.tipo_tomada}
                </Text>
              </View>

              <View style={styles.cardFooterRow}>
                <Text style={styles.cardPriceText}>
                  {item.preco_kwh} €<Text style={styles.cardPriceUnit}>/kWh</Text>
                </Text>
                
                {!user && (
                  <Text style={styles.loginRequiredBadge}>
                    Login Necessário
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;