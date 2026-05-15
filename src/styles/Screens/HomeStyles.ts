// src/styles/Screens/HomeStyles.ts
import { StyleSheet } from 'react-native';
import { Colors, Metrics } from '../GlobalStyles';

export const HomeStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: Colors.white 
  },
  // Header
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
  // Lista
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
    alignItems: 'center', 
    marginTop: 15 
  },
  cardPriceText: {
    fontSize: 18, 
    fontWeight: '900', 
    color: Colors.primary 
  },
  cardPriceUnit: {
    fontSize: 12, 
    color: Colors.gray, 
    fontWeight: '500' 
  },
  // Pedidos Pendentes (Notificação de Sistema)
  pendingSection: {
    marginBottom: 25,
    marginTop: 10,
  },
  pendingSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 5,
  },
  pendingCard: {
    backgroundColor: '#FFF9F0', // Tom creme muito subtil
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning,
    marginRight: 12,
  },
  pendingTextLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  pendingTextSub: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: '600',
    marginTop: 1,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rejectCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  acceptCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  }
});