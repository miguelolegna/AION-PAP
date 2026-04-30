import 'dotenv/config';

export default ({ config }) => {
  console.log("------------------------------------------");
  console.log("DEBUG: A carregar API Key:", process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? "Detectada" : "FALHOU");
  console.log("------------------------------------------");

  return {
    ...config,
    name: "AION",
    slug: "Aktie",
    version: "1.0.0",
    newArchEnabled: true,
    sdkVersion: "52.0.0",
    
    // A CAMADA VISUAL RESTAURADA
    icon: "./assets/icon.png", 
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/logos/adaptive-icon.png", 
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    android: {
      ...config.android,
      package: "com.miguell.aktie", // ATENÇÃO: NÃO alteres isto para aion, ou vais corromper todo o projeto Android.
      largeHeap: true,
      adaptiveIcon: {
        foregroundImage: "./assets/logos/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
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

    web: {
      favicon: "./assets/logos/adaptive-icon.png"
    },

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