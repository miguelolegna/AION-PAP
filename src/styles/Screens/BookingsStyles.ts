// src/styles/Screens/BookingsStyles.ts
import { StyleSheet } from 'react-native';
import { Colors, Metrics, GlobalStyles } from '../GlobalStyles';

export const BookingsStyles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
    backgroundColor: Colors.background,
  },
  title: {
    ...GlobalStyles.title,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    ...GlobalStyles.shadow,
  },
  activeBorder: {
    borderColor: Colors.primary,
  },
  finishedBorder: {
    borderColor: Colors.border,
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
    fontWeight: '900',
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