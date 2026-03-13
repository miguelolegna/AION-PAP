// src/styles/Screens/ChargerDetailsStyles.ts
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors, Metrics, GlobalStyles } from '../GlobalStyles';

const { width } = Dimensions.get('window');

export const chargerDetailsStyles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 120, // Espaço para o footer fixo
  },
  imageContainer: {
    width: width,
    height: 280,
    backgroundColor: '#F1F3F5',
  },
  chargerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    padding: Metrics.padding,
    marginTop: -20,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  header: {
    marginBottom: 25,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark,
    flex: 1,
    marginRight: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: '#FBC02D',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 15,
    marginTop: 10,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  specCard: {
    width: '48%',
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 18,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  specLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 8,
  },
  specValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark,
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: Colors.primaryLight,
    padding: 15,
    borderRadius: 15,
  },
  infoText: {
    color: Colors.primaryDark,
    lineHeight: 20,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Metrics.padding,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
  },
  priceContainer: {
    marginRight: 20,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: Colors.gray,
  },
  reserveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...GlobalStyles.shadow,
  },
  reserveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
});