// src/styles/Screens/HomeStyles.ts
import { StyleSheet } from 'react-native';
import { Colors } from '../GlobalStyles';

export const HomeStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: Colors.background 
  },
  // Elementos do Header
  headerIconContainer: {
    backgroundColor: Colors.primaryLight, 
    padding: 15, 
    borderRadius: 40, 
    marginBottom: 15 
  },
  headerTitle: {
    fontSize: 22, 
    fontWeight: '800', 
    color: Colors.dark 
  },
  headerSubtitle: {
    fontSize: 14, 
    color: Colors.gray, 
    fontWeight: '500', 
    marginTop: 5 
  },
  loginButton: {
    marginTop: 20, 
    backgroundColor: Colors.primary, 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 25, 
    elevation: 3 
  },
  loginButtonText: {
    color: Colors.white, 
    fontWeight: 'bold', 
    letterSpacing: 0.5 
  },
  // Elementos da Lista e Cartões
  listContent: {
    paddingHorizontal: 20, 
    paddingBottom: 100 
  },
  cardHeaderRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  cardAddress: {
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.dark, 
    flex: 1 
  },
  badgeBase: {
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  badgeTextBase: {
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  cardDetailsRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 5 
  },
  cardDetailsText: {
    fontSize: 14, 
    color: Colors.gray, 
    marginLeft: 8 
  },
  cardFooterRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    marginTop: 15 
  },
  cardPriceText: {
    fontSize: 20, 
    fontWeight: 'bold', 
    color: Colors.primary 
  },
  cardPriceUnit: {
    fontSize: 14, 
    color: Colors.gray, 
    fontWeight: '500' 
  },
  loginRequiredBadge: {
    fontSize: 11, 
    color: Colors.danger, 
    fontWeight: 'bold', 
    backgroundColor: Colors.dangerLight, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  }
});