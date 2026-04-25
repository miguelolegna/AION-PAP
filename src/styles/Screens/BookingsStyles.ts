import { StyleSheet } from 'react-native';
import { Colors, GlobalStyles } from '../GlobalStyles';

export const BookingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  // Estilos das Tabs (Novo)
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.gray,
  },
  // Estilos do Cartão
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  address: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailsText: {
    fontSize: 14,
    color: Colors.gray,
    marginLeft: 8,
  },
  // Botões de Ação (Novo)
  primaryButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 15,
    textAlign: 'center',
  },
});