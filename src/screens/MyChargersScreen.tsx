// src/screens/MyChargersScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
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
      setMyChargers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Erro MyChargers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = (id: string) => {
    Alert.alert("ATENÇÃO", "ELIMINAR ESTE POSTO PERMANENTEMENTE?", [
      { text: "CANCELAR", style: "cancel" },
      { text: "ELIMINAR", style: "destructive", onPress: async () => {
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
            <Ionicons name="flash-off" size={50} color={Colors.gray} />
            <Text style={styles.emptyText}>Não tens postos registados na tua rede.</Text>
            {/* O botão aqui foi removido pois agora existe o FAB global */}
          </View>
        }
      />

      {/* FAB - Floating Action Button (Sempre Visível) */}
      <TouchableOpacity 
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          backgroundColor: Colors.primary,
          width: 60,
          height: 60,
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
        onPress={() => navigation.navigate('AddCharger')}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default MyChargersScreen;