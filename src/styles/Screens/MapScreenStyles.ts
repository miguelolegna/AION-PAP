import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors, Metrics, GlobalStyles } from '../GlobalStyles';

const { width } = Dimensions.get('window');

export const MapScreenStyles = StyleSheet.create({
  // ==========================================
  // 1. CONTENTORES BASE
  // ==========================================
  container: { 
    ...GlobalStyles.container 
  },
  map: { 
    ...StyleSheet.absoluteFillObject 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // ==========================================
  // 2. PESQUISA (LUPA)
  // ==========================================
  searchOverlay: {
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 60 : 40, 
    right: 20, // Movido para a esquerda para evitar sobreposição com a bússola
    zIndex: 2000, 
    marginTop: 0,
  },
  searchBar: {
    height: 50, 
    width: 50, // Começa como um círculo
    backgroundColor: Colors.white, 
    borderRadius: 25, 
    flexDirection: 'row',
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: Colors.border,
    ...GlobalStyles.shadow,
    overflow: 'hidden', // Crucial para o círculo perfeito
  },
  searchIcon: { 
    width: 50, // Lógica: largura = altura para círculo perfeito
    height: 50,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: Colors.dark,
    paddingRight: 20,
    minWidth: 200,
  },
  resultsContainer: {
    backgroundColor: Colors.white, 
    borderRadius: 15, 
    marginTop: 10, 
    width: 250,
    maxHeight: 200, 
    borderWidth: 1, 
    borderColor: Colors.border,
    ...GlobalStyles.shadow,
  },
  resultItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.background 
  },

  // ==========================================
  // 3. BOTÃO LOCALIZAÇÃO (RECENTER)
  // ==========================================
  recenterButton: {
    position: 'absolute', 
    right: 20, 
    backgroundColor: Colors.white,
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center',
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: Colors.border, 
    zIndex: 1000,
    ...GlobalStyles.shadow,
  },

  // ==========================================
  // 4. CARD DE DETALHES (OVERLAY)
  // ==========================================
  overlayContainer: {
    position: 'absolute', 
    bottom: 100, // Acima da Navbar
    width: width, 
    paddingHorizontal: 20, 
    zIndex: 1500,
  },
  calloutContainer: {
    width: '100%', 
    backgroundColor: Colors.white, 
    borderRadius: 30, 
    overflow: 'hidden',
    ...GlobalStyles.shadow,
    elevation: 10,
  },
  calloutHeader: {
    backgroundColor: Colors.primary, 
    paddingVertical: 12, 
    paddingHorizontal: 15,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  calloutTitle: { 
    color: Colors.white, 
    fontWeight: 'bold', 
    fontSize: 14, 
    flex: 1 
  },
  calloutBody: { 
    padding: 15, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  connectorIconContainer: {
    backgroundColor: '#F1F3F5', 
    padding: 12, 
    borderRadius: 15, 
    marginRight: 15,
  },
  infoColumn: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  infoText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: Colors.dark, 
    marginLeft: 8 
  },
  actionButton: {
    backgroundColor: Colors.primary, 
    borderRadius: 12, 
    paddingVertical: 10, 
    paddingHorizontal: 15,
    flexDirection: 'row', 
    alignItems: 'center',
  },
  actionButtonText: { 
    color: Colors.white, 
    fontWeight: 'bold', 
    fontSize: 12, 
    marginRight: 4 
  },

  // ==========================================
  // 5. MARCADORES (MARKERS)
  // ==========================================
  markerContainer: {
    width: 38, 
    height: 38, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: Colors.white, 
    borderRadius: 19, 
    borderWidth: 2, 
    borderColor: Colors.primary,
    ...GlobalStyles.shadow,
  },
});