// src/styles/Screens/PaymentsStyles.ts
import { StyleSheet } from 'react-native';
import { Colors } from '../GlobalStyles';

export const PaymentsStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    color: Colors.gray,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.danger, // Utiliza a tua variável de erro/cancelamento
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  }
});