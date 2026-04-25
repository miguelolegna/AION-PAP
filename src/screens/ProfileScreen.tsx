// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ProfileStyles as styles } from '../styles/Screens/ProfileStyles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../styles/GlobalStyles';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();

  const MenuOption = ({ icon, label, onPress, color = Colors.dark }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
    </TouchableOpacity>
  );

  // VIEW PARA UTILIZADORES NÃO AUTENTICADOS
  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <MaterialCommunityIcons name="account-circle-outline" size={100} color={Colors.gray} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20, color: Colors.dark }}>
          Sessão não iniciada
        </Text>
        <Text style={{ textAlign: 'center', color: Colors.gray, marginTop: 10, marginBottom: 30 }}>
          Inicie sessão para gerir os seus carregadores, ver o seu histórico e fazer reservas.
        </Text>
        
        <TouchableOpacity 
          style={{ backgroundColor: Colors.primary, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' }}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>ENTRAR NA CONTA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ marginTop: 20 }}
          onPress={() => navigation.navigate('Auth', { screen: 'Register' })} // Ajusta se o nome for diferente
        >
          <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Não tem conta? Crie agora</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // VIEW PARA UTILIZADORES LOGADOS
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: user?.photoURL || 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.displayName || 'Utilizador Aktie'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anfitrião</Text>
        <MenuOption 
          icon="ev-station" 
          label="Meus Carregadores" 
          color={Colors.primary}
          onPress={() => navigation.navigate('MyChargers')} 
        />
        <MenuOption 
          icon="calendar-clock" 
          label="Histórico de Ganhos" 
          onPress={() => navigation.navigate('History', { mode: 'host' })} // FIX: Adicionado mode
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Condutor</Text>
        <MenuOption 
          icon="history" 
          label="Histórico de Carregamentos" 
          onPress={() => navigation.navigate('History', { mode: 'driver' })} // FIX: Agora funcional
        />
        <MenuOption 
          icon="credit-card-outline" 
          label="Pagamentos" 
          onPress={() => navigation.navigate('Payments')} // Rota para o novo módulo D4
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apoio</Text>
        <MenuOption icon="cog-outline" label="Configurações" onPress={() => {}} />
        <MenuOption 
          icon="logout" 
          label="Sair da Conta" 
          color={Colors.danger} 
          onPress={logout} 
        />
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;