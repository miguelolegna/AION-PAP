import { StyleSheet, Platform } from 'react-native';
import { Colors, Metrics, GlobalStyles } from '../GlobalStyles';

export const ProfileStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
    marginBottom: 100
  },
  // Header mais robusto e com profundidade real
  header: { 
    alignItems: 'center', 
    paddingTop: 50,
    paddingBottom: 30, 
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...GlobalStyles.shadow,
    elevation: 8,
  },
  avatarContainer: { 
    position: 'relative',
    ...GlobalStyles.shadow,
  },
  avatar: { 
    width: 110, 
    height: 110, 
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.primaryLight,
  },
  editAvatarButton: {
    position: 'absolute', 
    bottom: 2, 
    right: 2,
    backgroundColor: Colors.primary, 
    padding: 10, 
    borderRadius: 25,
    borderWidth: 4, 
    borderColor: Colors.white,
  },
  userName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: Colors.dark, 
    marginTop: 15 
  },
  userEmail: { 
    fontSize: 14, 
    color: Colors.gray,
    fontWeight: '500'
  },
  // Secções com títulos mais elegantes
  section: { 
    marginTop: 30, 
    paddingHorizontal: 20 
  },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '900', 
    color: Colors.gray, 
    textTransform: 'uppercase', 
    marginBottom: 12, 
    letterSpacing: 1.5,
    paddingLeft: 5,
  },
  // Menu Item estilo Apple/Moderno
  menuItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: Colors.white, 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 12,
    ...GlobalStyles.shadow,
    elevation: 2,
  },
  menuItemLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconContainer: { 
    padding: 10, 
    borderRadius: 14, 
    marginRight: 16,
    // O background color é injetado dinamicamente no componente (ex: color + '15')
  },
  menuLabel: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: Colors.dark 
  },
});