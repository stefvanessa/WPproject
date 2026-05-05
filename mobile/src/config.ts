import Constants from "expo-constants";

// In Expo Go the manifest carries the Metro bundler address (same machine as the server).
// Try expoConfig.hostUri first, then expoGoConfig.debuggerHost as fallback.
const rawHost: string | undefined =
  (Constants.expoConfig as any)?.hostUri ??
  (Constants.expoGoConfig as any)?.debuggerHost ??
  (Constants as any).manifest?.debuggerHost ??
  (Constants as any).manifest2?.extra?.expoClient?.hostUri;

const host = rawHost?.split(":").shift() ?? "localhost";

export const API_URL = `http://${host}:3000`;
