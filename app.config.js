// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: "AION",
    slug: "Aktie",
    version: "1.0.0",
    icon: "./assets/icon.png", 
    userInterfaceStyle: "light",
    newArchEnabled: true,
    
    splash: {
      image: "./assets/logos/adaptive-icon.png", 
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    android: {
      package: "com.miguell.aktie",
      largeHeap: true,
      adaptiveIcon: {
        foregroundImage: "./assets/logos/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },

    web: {
      favicon: "./assets/logos/adaptive-icon.png"
    },

    plugins: [
      "expo-video",
      "expo-asset",
      "expo-font",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Permite que a Aktie aceda à tua localização para encontrar postos próximos."
        }
      ],
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.miguell.aktie",
          "enableGooglePay": true
        }
      ]
    ],

    extra: {
      eas: {
        projectId: "7896334b-67ff-4283-a517-e1dda62e27bd"
      }
    }
  }
};