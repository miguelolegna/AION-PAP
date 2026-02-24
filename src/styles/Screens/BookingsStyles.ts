import { StyleSheet } from 'react-native';
import { Colors, Metrics, GlobalStyles } from '../GlobalStyles';

export const BookingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: Metrics.padding,
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
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
  pickerWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 10,
    marginBottom: 25,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  durationBtn: {
    paddingVertical: 12,
    borderRadius: 15,
    width: '22%',
    alignItems: 'center',
  },
  durationText: {
    fontWeight: 'bold',
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  summaryText: {
    color: Colors.white,
    fontSize: 14,
    marginBottom: 2,
  },
  totalPrice: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  moduleBadge: {
    color: '#AAA',
    fontSize: 10,
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
  confirmBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
});
