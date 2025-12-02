import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.marcocrispo.whereismycar",
  appName: "whereismycar",
  webDir: "dist",
  server: {
    // per sviluppo su rete locale (opzionale)
    // url: 'http://192.168.0.1:5173',
    // cleartext: true
    androidScheme: "https",
  },
  android: {
    path: "android", // dove viene generato il progetto Android
  },
  ios: {
    path: "ios", // dove viene generato il progetto iOS
  },
  plugins: {
    Geolocation: {
      permissions: ["location", "background"],
    },
  },
};

export default config;
