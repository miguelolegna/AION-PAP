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
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 5,
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  pickerWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  pickerText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  durationMainPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.white,
    marginBottom: 15,
  },
  durationMainText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
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
    backgroundColor: '#F1F3F5',
    ...GlobalStyles.shadow,
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