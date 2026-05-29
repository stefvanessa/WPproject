import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { connectWithCode } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ConnectScreen() {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const { login } = useAuth();

  async function handleConnect(rawCode: string) {
    const trimmed = rawCode.trim().replace(/\s/g, "");
    if (trimmed.length !== 6) {
      Alert.alert("Invalid code", "Please enter the 6-digit code from the web app.");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await connectWithCode(trimmed);
      await login(token, user);
    } catch (err: any) {
      Alert.alert("Connection failed", err.message ?? "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleScanPress() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Camera permission required", "Allow camera access to scan the QR code.");
        return;
      }
    }
    scannedRef.current = false;
    setScanning(true);
  }

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanning(false);
    handleConnect(data);
  }

  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerHint}>Point at the QR code</Text>
        </View>
        <TouchableOpacity style={styles.cancelScan} onPress={() => setScanning(false)}>
          <Text style={styles.cancelScanText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.brand}>SnapFit</Text>
        <Text style={styles.title}>Connect your wardrobe</Text>
        <Text style={styles.subtitle}>
          Open the web app, click the phone icon in the navbar, and enter the
          code shown there.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="123 456"
          placeholderTextColor="#bbb"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={7}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={() => handleConnect(code)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Connect</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={handleScanPress}>
          <Text style={styles.btnOutlineText}>Scan QR code</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PINK = "#7fa6d9";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f3ee" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  brand: {
    fontSize: 36,
    fontWeight: "700",
    color: PINK,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#3e4246",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#dddbd8",
    backgroundColor: "#fff",
    fontSize: 28,
    fontWeight: "700",
    color: "#3e4246",
    letterSpacing: 8,
    paddingHorizontal: 16,
  },
  btn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: PINK },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnOutline: { borderWidth: 1.5, borderColor: "#dddbd8", backgroundColor: "#fff" },
  btnOutlineText: { color: "#3e4246", fontSize: 16, fontWeight: "500" },
  btnDisabled: { opacity: 0.6 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#dddbd8" },
  dividerText: { color: "#aaa", fontSize: 13 },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: "#000" },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  scannerFrame: {
    width: 220,
    height: 220,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: PINK,
  },
  scannerHint: { color: "#fff", fontSize: 15, fontWeight: "500" },
  cancelScan: {
    position: "absolute",
    bottom: 52,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cancelScanText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
