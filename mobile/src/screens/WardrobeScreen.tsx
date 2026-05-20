import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { fetchProducts, type Product } from "../api";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Wardrobe">;

export default function WardrobeScreen({ navigation }: Props) {
  const { token, user, logout } = useAuth();
  const isFocused = useIsFocused();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await fetchProducts(token);
        setProducts(data);
      } catch (err: any) {
        setError(err.message ?? "Failed to load wardrobe");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => { if (isFocused) load(); }, [load, isFocused]);

  function handleLogout() {
    Alert.alert("Disconnect", "Disconnect this device from SnapFit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Disconnect", style: "destructive", onPress: logout },
    ]);
  }

  function renderItem({ item }: { item: Product }) {
    return (
      <View style={styles.card}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
        )}
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.cardType}>{item.type}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>SnapFit</Text>
        <View style={styles.headerRight}>
          {user && <Text style={styles.userName}>{user.name.split(" ")[0]}</Text>}
          <TouchableOpacity onPress={handleLogout} style={styles.disconnectBtn}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PINK} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={PINK}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No items in your wardrobe yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating add button */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("Camera")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const PINK = "#ff00a2";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafafa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
    backgroundColor: "#EAE9E9",
  },
  brand: { fontSize: 22, fontWeight: "700", color: PINK },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  userName: { fontSize: 14, color: "#555" },
  disconnectBtn: {
    borderWidth: 1,
    borderColor: "#e0dfdd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  disconnectText: { fontSize: 12, color: "#666" },
  grid: { padding: 10 },
  row: { justifyContent: "space-between" },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 130,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  cardImagePlaceholder: { backgroundColor: "#efefef" },
  cardName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#1c1c1e",
    textAlign: "center",
  },
  cardType: { fontSize: 11, color: "#aaa", marginTop: 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  errorText: { color: "#b3261e", fontSize: 14, textAlign: "center", marginBottom: 16 },
  retryBtn: {
    backgroundColor: PINK,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  emptyText: { color: "#aaa", fontSize: 14 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PINK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PINK,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: "#fff", fontSize: 30, fontWeight: "300", lineHeight: 34 },
});
