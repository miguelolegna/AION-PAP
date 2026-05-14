import { StyleSheet } from 'react-native';
import { Colors, Metrics, GlobalStyles } from '../GlobalStyles';

export const CreateBookingScreenStyles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
    backgroundColor: Colors.white,
  },
  content: {
    padding: Metrics.padding,
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
    backgroundColor: '#EEE',
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
    ...GlobalStyles.shadow,
  },
  summaryLabel: {
    color: '#AAA',
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
    backgroundColor: 'rgba(245, 124, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 124, 0, 0.3)',
  },
  smartLockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  smartLockTitle: {
    color: '#E65100',
    fontWeight: 'bold',
    fontSize: 14,
  },
  smartLockValue: {
    color: '#E65100',
    fontWeight: '900',
    fontSize: 16,
  },
  smartLockDesc: {
    color: '#E65100',
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
    ...GlobalStyles.shadow,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});