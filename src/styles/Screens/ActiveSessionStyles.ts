// src/styles/Screens/ActiveSessionStyles.ts
import { StyleSheet } from 'react-native';
import { Colors, Metrics } from '../GlobalStyles';

export const ActiveSessionStyles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Metrics.spacing * 1.5,
    color: Colors.dark,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    padding: Metrics.padding,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrics.spacing * 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: Metrics.spacing,
    color: Colors.dark,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: Metrics.spacing * 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  timerLabel: {
    color: Colors.gray,
    marginTop: Metrics.spacing * 0.5,
  },
  cardItemMargin: {
    marginBottom: Metrics.spacing * 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrics.spacing,
  },
  cardLabel: {
    fontSize: 16,
    color: Colors.gray,
    marginLeft: 8,
  },
  cardValueDark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  cardValuePrimary: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Metrics.spacing * 1.5,
  },
  inputSection: {
    marginBottom: Metrics.spacing * 3,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: Metrics.spacing,
  },
  inputDescription: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: Metrics.spacing * 1.5,
    lineHeight: 20,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Metrics.radius,
    padding: Metrics.padding * 0.75,
    fontSize: 24,
    textAlign: 'center',
    color: Colors.dark,
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: Colors.danger,
    padding: Metrics.padding * 0.9,
    borderRadius: Metrics.radius,
    alignItems: 'center',
  },
  endButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});