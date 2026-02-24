import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Metrics, GlobalStyles } from '../GlobalStyles';

const { width } = Dimensions.get('window');

export const MyChargersStyles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
  },
  listContent: {
    padding: Metrics.padding,
    paddingBottom: 60, // Espaço extra para não bater na tab bar
  },
  // Cartão com design de dashboard
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24, // Bordas mais arredondadas para um look moderno
    marginBottom: 20,
    flexDirection: 'row',
    height: 120, // Altura fixa para consistência
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...GlobalStyles.shadow,
    elevation: 4,
  },
  imagePreview: {
    width: 110,
    height: '100%',
    backgroundColor: Colors.primaryLight,
  },
  // Badge estilo "Pill"
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 10,
    ...GlobalStyles.shadow,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  infoContainer: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  address: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specText: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Coluna de ações com fundo subtil para separação
  actionsContainer: {
    flexDirection: 'column',
    backgroundColor: '#F8F9FA',
    width: 60,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  // Empty State visualmente apelativo
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
});