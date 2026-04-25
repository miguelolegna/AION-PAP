// src/styles/GlobalStyles.ts
import { StyleSheet, Platform } from 'react-native';

export const Colors = {
  primary: '#00BFA5',
  primaryDark: '#008F7A',
  primaryLight: '#E0F2F1',
  dark: '#263238',
  gray: '#5f7784',
  border: '#CFD8DC',
  white: '#FFFFFF',
  background: '#F5F7FA',
  success: '#00BFA5',
  danger: '#FF5252',
  dangerLight: '#FFEBEE',
  warning: '#FFAB40',
  shadow: '#000000',
};

export const Metrics = {
  radius: 12,
  padding: 20,
  spacing: 10,
  margintop: 0,
};

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: Metrics.spacing,
  },
  shadow: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerCard: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Reduzido de 60/50
    paddingBottom: 20, // Reduzido de 30
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 30, // Reduzido de 40 para acompanhar a altura menor
    borderBottomRightRadius: 30,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 15,
  },
  cardItem: {
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  }
});