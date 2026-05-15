import { StyleSheet, Dimensions } from "react-native";
import { Colors, Metrics } from "../GlobalStyles";

const { width } = Dimensions.get("window");

export const LocationPickerStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // Pino Fixo no Centro do Mapa
  fixedPinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -24,
    marginTop: -48, // Ajuste para a ponta do ícone ficar no centro exato
    alignItems: "center",
    justifyContent: "center",
  },
  pinShadow: {
    width: 10,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 5,
    marginTop: -2,
  },
  // Barra de Pesquisa Flutuante (Topo)
  searchOverlay: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionItem: {
    backgroundColor: Colors.white,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.dark,
  },
  // Card de Endereço e Confirmação (Rodapé)
  footerOverlay: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.dark,
    marginLeft: 10,
  },
  confirmMapButton: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  confirmMapText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});