import React, { useState, useEffect } from 'react';
import { View, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { FontAwesome6, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';

import AppTabs from './src/navigation/AppTabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConfigProvider, usePricingConfig } from './src/context/ConfigContext';
import AuthScreen from './src/screens/AuthScreen';
import SmartSplashScreen from './src/screens/SplashScreen';
import AddChargerScreen from './src/screens/AddChargerScreen'; 
import ChargerDetailsScreen from './src/screens/ChargerDetailsScreen';
import MyChargersScreen from './src/screens/MyChargersScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ActiveSessionScreen from './src/screens/ActiveSessionScreen'; 
import CreateBookingScreen from './src/screens/CreateBookingScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import LocationPicker from './src/screens/LocationPickerScreen'; // Importação adicionada
import { Colors } from './src/styles/GlobalStyles';
import { enableScreens } from 'react-native-screens';
import LocationPickerScreen from './src/screens/LocationPickerScreen';

enableScreens(); 

LogBox.ignoreLogs(['Setting a timer', 'The action \'GO_BACK\' was not handled by any navigator']);

const Stack = createNativeStackNavigator();

// ============================================================================
// NAVEGAÇÃO PRINCIPAL
// ============================================================================

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="ChargerDetails" component={ChargerDetailsScreen} options={{ headerShown: true, title: 'Detalhes', headerTintColor: Colors.primary }} />
      <Stack.Screen name="AddCharger" component={AddChargerScreen} options={{ headerShown: true, title: 'Registar Posto', headerTintColor: Colors.primary }} />
      <Stack.Screen name="CreateBooking" component={CreateBookingScreen} options={{ headerShown: true, title: 'Agendar Carregamento', headerTintColor: Colors.primary }} />
      <Stack.Screen name="MyChargers" component={MyChargersScreen} options={{ headerShown: true, title: 'Os Meus Postos', headerTintColor: Colors.primary }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true, title: 'Histórico', headerTintColor: Colors.primary }} />
      <Stack.Screen name="Payments" component={PaymentsScreen} options={{ headerShown: true, title: 'Carteira de IONS', headerTintColor: Colors.primary }} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ headerShown: true, title: 'Selecionar Localização' }} />
    </Stack.Navigator>
  </NavigationContainer>
);

// ============================================================================
// ROOT LAYOUT (GESTÃO DE SPLASH E FONTES)
// ============================================================================

const RootLayout = () => {
  const { loading: authLoading } = useAuth();
  const { loading: configLoading } = usePricingConfig();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isSplashVisible, setSplashVisible] = useState(true);
  const [mountNavigator, setMountNavigator] = useState(false);

  const handlePrepareExit = () => {
    setTimeout(() => {
      setMountNavigator(true);
    }, 300); 
  };

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({ 
          ...FontAwesome6.font, 
          ...MaterialIcons.font, 
          ...Ionicons.font 
        });
        setFontsLoaded(true);
      } catch (e) { 
        setFontsLoaded(true); 
      }
    }
    prepare();
  }, []);

  const isAppReady = fontsLoaded && !authLoading && !configLoading;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      {mountNavigator && <AppNavigator />}
      
      {isSplashVisible && (
        <SmartSplashScreen 
          isLoading={!isAppReady} 
          onPrepareExit={handlePrepareExit} 
          onFinish={() => setSplashVisible(false)} 
        />
      )}
    </View> 
  );
};

// ============================================================================
// APP ENTRY POINT (PROVIDERS)
// ============================================================================

const stripeKey = process.env.EXPO_PUBLIC_STRIPE_API_KEY;

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <StripeProvider
          publishableKey={stripeKey || "CHAVE_AUSENTE"}
          merchantIdentifier="merchant.com.aktie.pap"
        >
          <RootLayout />
        </StripeProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}