// src/screens/MyChargersScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/GlobalStyles'; // ADICIONA ISTO
import { MyChargersStyles as styles } from '../styles/Screens/MyChargersStyles';
import ChargerListItem from '../components/ChargerListItem';

const MyChargersScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [myChargers, setMyChargers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Lógica Lógica: Filtra apenas postos onde o utilizador é dono
    const q = query(collection(db, "chargers"), where("owner_uid", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyChargers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = (id: string) => {
    Alert.alert("Aviso", "Eliminar este posto permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "chargers", id));
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
            <Text style={styles.emptyText}>Ainda não tens postos registados.</Text>
          </View>
        }
      />
    </View>
  );
};

export default MyChargersScreen;