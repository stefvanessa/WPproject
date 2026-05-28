import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import ConnectScreen from "./src/screens/ConnectScreen";
import WardrobeScreen from "./src/screens/WardrobeScreen";
import CameraScreen from "./src/screens/CameraScreen";
import AddItemScreen from "./src/screens/AddItemScreen";
import TryOnScreen from "./src/screens/TryOnScreen";
import type { Product } from "./src/api";

export type RootStackParamList = {
  Wardrobe: undefined;
  Camera: undefined;
  AddItem: { photoUri: string };
  TryOn: { item: Product };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#ff00a2" />
      </View>
    );
  }

  if (!token) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Wardrobe" component={ConnectScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Wardrobe" component={WardrobeScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="AddItem" component={AddItemScreen} />
      <Stack.Screen name="TryOn" component={TryOnScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}
