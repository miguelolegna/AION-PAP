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
            <TouchableOpacity 
              onPress={() => navigation.navigate('AddCharger')}
              style={{ marginTop: 20, backgroundColor: Colors.primary, padding: 12, borderRadius: 10 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>ADICIONAR PRIMEIRO POSTO</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export default MyChargersScreen;