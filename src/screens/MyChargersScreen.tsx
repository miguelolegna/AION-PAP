// src/screens/MyChargersScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/GlobalStyles';
import { MyChargersStyles as styles } from '../styles/Screens/MyChargersStyles';
import ChargerListItem from '../components/ChargerListItem';
import { Ionicons } from '@expo/vector-icons';

const MyChargersScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [myChargers, setMyChargers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "chargers"), where("owner_uid", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filtragem em memória para evitar a exigência imediata de um composite index no Firestore
      const chargers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => !c.is_deleted);
      
      setMyChargers(chargers);
      setLoading(false);
    }, (error) => {
      console.error("Erro MyChargers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = (id: string) => {
    Alert.alert("ATENÇÃO", "ELIMINAR ESTE POSTO?", [
      { text: "CANCELAR", style: "cancel" },
      { text: "ELIMINAR", style: "destructive", onPress: async () => {
          // Soft Delete OBRIGATÓRIO: Preserva o histórico de reservas e integridade do Ledger
          await updateDoc(doc(db, "chargers", id), { 
            is_deleted: true,
            is_active: false 
          });
      }}
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={myChargers}
        contentContainerStyle={styles.listContent}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ChargerListItem 
            charger={item} 
            onDelete={() => handleDelete(item.id)}
            onEdit={() => navigation.navigate('AddCharger', { editMode: true, charger: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flash-off" size={50} color={Colors.gray} />
            <Text style={styles.emptyText}>Não tens postos registados na tua rede.</Text>
          </View>
        }
      />

      {/* FAB - Estilos extraídos para o ficheiro correto */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddCharger')}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default MyChargersScreen;