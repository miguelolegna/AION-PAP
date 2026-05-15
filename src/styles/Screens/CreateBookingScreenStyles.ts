import { StyleSheet } from 'react-native';
import { Colors, Metrics, GlobalStyles } from '../GlobalStyles';

export const CreateBookingScreenStyles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
    backgroundColor: Colors.white,
  },
  content: {
    padding: Metrics.padding || 20,
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  iconWrapper: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 15,
  },
  stationInfo: {
    marginLeft: 15,
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  stationSub: {
    color: Colors.gray,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: Colors.dark,
    padding: 25,
    borderRadius: 25,
    marginTop: 10,
    elevation: 5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  summaryLabel: {
    color: Colors.border,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
  },
  summaryColumnLeft: {
    flex: 1,
  },
  summaryColumnRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryText: {
    color: Colors.white,
    fontSize: 14,
    marginBottom: 2,
  },
  summaryBasePriceLabel: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 2,
  },
  totalPrice: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  smartLockContainer: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  smartLockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  smartLockTitle: {
    color: Colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  smartLockValue: {
    color: Colors.danger,
    fontWeight: '900',
    fontSize: 16,
  },
  smartLockDesc: {
    color: Colors.danger,
    fontSize: 11,
    lineHeight: 16,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 20,
    marginTop: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // ==========================================
  // ESTILOS DO MODAL DE AUTENTICAÇÃO
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 50, 56, 0.7)', // Fundo escuro semitransparente usando Colors.dark base
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonPrimaryText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonSecondary: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  modalButtonSecondaryText: {
    color: Colors.gray,
    fontWeight: 'bold',
    fontSize: 16,
  },
});