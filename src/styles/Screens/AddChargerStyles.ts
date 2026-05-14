import { StyleSheet, Platform } from "react-native";
import { Colors, Metrics } from "../GlobalStyles";

export const AddChargerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.dark,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark,
    marginTop: 15,
    marginBottom: 10,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  suggestionText: { fontSize: 14, color: Colors.dark },
  mapTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  mapTriggerText: { color: Colors.primary, fontWeight: "bold", marginLeft: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: Colors.dark,
  },

  // Seletor Grid 2x2
  typeSelectorContainer: { 
    backgroundColor: '#F0F2F5', 
    borderRadius: 12, 
    padding: 8, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    position: 'relative', 
    height: 196, // Mantém a altura fixa para acomodar as duas linhas de 90px + padding
    overflow: 'hidden' 
  },
  typeOverlay: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    width: '100%', // Força o preenchimento total para o wrap funcionar
    zIndex: 2 
  },
  typeOption: { 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  typeOptionSelected: { 
    backgroundColor: Colors.white, 
    borderRadius: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 4, 
    zIndex: 1 
  },
  typeIconContainer: { 
    marginBottom: 4 
  },  
  typeOptionText: { 
    fontSize: 13, 
    color: Colors.gray, 
    fontWeight: '700' 
  },  
  typeOptionTextSelected: { 
    color: Colors.primary 
  },

  // Seletores Deslizantes
  slidingContainer: {
    flexDirection: "row",
    backgroundColor: "#E9EDF1",
    borderRadius: 12,
    padding: 4,
    position: "relative",
    height: 60,
  },
  sliderActiveBg: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 52,
  },
  slidingOption: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  optionText: { fontSize: 14, color: Colors.gray, fontWeight: "700" },
  optionTextSelected: { color: Colors.white },
  subLabelText: { fontSize: 10, color: Colors.gray },

  submitButton: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: "bold" },
});
