// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Colors, GlobalStyles } from '../styles/GlobalStyles';
import { HomeStyles as styles } from '../styles/Screens/HomeStyles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const HomeScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chargers, setChargers] = useState<any[]>([]);
  
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "chargers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChargers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginPress = () => navigation.navigate('Auth');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* HEADER PADRONIZADO (Wrapper do GlobalStyles + Internos do HomeStyles) */}
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

      {/* LISTA DE POSTOS */}
      <FlatList
        data={chargers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          // Lógica de cores dinâmicas para o estado do posto
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