// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { AuthStyles as styles } from '../styles/Screens/AuthStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AuthScreen = ({ navigation }: any) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const toggleMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLogin(!isLogin);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preenche todos os campos obrigatórios.');
      return;
    }

    if (!isLogin) {
      if (!nome) {
        Alert.alert('Erro', 'O teu nome é obrigatório para o registo.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Erro', 'As tuas passwords não coincidem.');
        return;
      }
    }

    setLocalLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, nome);
        Alert.alert('Sucesso', 'A tua conta foi criada!');
      }
      navigation.goBack(); 
    } catch (error: any) {
      Alert.alert('Erro de Autenticação', error.message);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.headerTitle}>AION</Text>
          <Text style={styles.subTitle}>
            {isLogin ? 'Bem-vindo de volta' : 'Cria a tua conta'}
          </Text>

          <View style={styles.formContainer}>
            {!isLogin && (
              <>
                <Text style={styles.inputLabel}>Nome Completo</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Como te chamas?" 
                  value={nome} 
                  onChangeText={setNome} 
                  placeholderTextColor="#999" 
                />
              </>
            )}

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="exemplo@AION.com" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address" 
              placeholderTextColor="#999" 
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="********" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
              placeholderTextColor="#999" 
            />

            {!isLogin && (
              <>
                <Text style={styles.inputLabel}>Confirmar Password</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="********" 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword} 
                  secureTextEntry 
                  placeholderTextColor="#999" 
                />
              </>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={localLoading}>
              {localLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>{isLogin ? 'ENTRAR' : 'REGISTAR'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleContainer} onPress={toggleMode}>
              <Text style={styles.toggleText}>
                {isLogin ? 'Não tens conta? ' : 'Já tens conta? '}
                <Text style={styles.toggleTextBold}>
                  {isLogin ? 'Cria uma gratuita' : 'Entra aqui'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;