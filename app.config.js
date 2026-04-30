import 'dotenv/config';

export default ({ config }) => {
  // LOG DE DEBUG - Vai aparecer no terminal ao correr o npx expo config
  console.log("------------------------------------------");
  console.log("DEBUG: A carregar API Key:", process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? "Detectada" : "FALHOU");
  console.log("------------------------------------------");

  return {
    ...config, // Mantém as configurações base do Expo
    name: "AION",
    slug: "Aktie",
    version: "1.0.0",
    newArchEnabled: true,
    sdkVersion: "52.0.0",
    
    android: {
      ...config.android, // Garante que não perdemos nada
      package: "com.miguell.aktie",
      largeHeap: true,
      // AQUI ESTÁ O BLOCO CRÍTICO
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.FOREGROUND_SERVICE"
      ]
    },

    // Garante que os plugins estão incluídos
    plugins: [
      "expo-video",
      "expo-asset",
      "expo-font",
      ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Permite localização." }],
      ["@stripe/stripe-react-native", { "merchantIdentifier": "merchant.com.miguell.aktie", "enableGooglePay": true }]
    ],

    extra: {
      ...config.extra,
      eas: { projectId: "7896334b-67ff-4283-a517-e1dda62e27bd" }
    }
  };
};