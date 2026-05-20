import { useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Camera">;

export default function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={PINK} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permText}>Camera access is needed to photograph items.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.75 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } finally {
      setCapturing(false);
    }
  }

  if (photoUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        <SafeAreaView style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.retakeBtn]}
            onPress={() => setPhotoUri(null)}
          >
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.useBtn]}
            onPress={() => navigation.replace("AddItem", { photoUri })}
          >
            <Text style={styles.useBtnText}>Use photo</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      <SafeAreaView style={styles.controls}>
        {/* Back */}
        <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.sideBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Shutter */}
        <TouchableOpacity
          style={styles.shutter}
          onPress={handleCapture}
          disabled={capturing}
        >
          {capturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>

        {/* Flip */}
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
        >
          <Text style={styles.sideBtnText}>⇄</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const PINK = "#ff00a2";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#fafafa" },
  permText: { fontSize: 15, color: "#444", textAlign: "center", marginBottom: 20 },
  permBtn: { backgroundColor: PINK, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  backLink: { marginTop: 16 },
  backLinkText: { color: "#aaa", fontSize: 14 },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 36,
    paddingBottom: 36,
    paddingTop: 16,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  sideBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnText: { color: "#fff", fontSize: 18 },
  // Preview
  previewContainer: { flex: 1, backgroundColor: "#000" },
  preview: { flex: 1 },
  previewActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingBottom: 40,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  retakeBtn: { backgroundColor: "rgba(0,0,0,0.55)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  retakeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  useBtn: { backgroundColor: PINK },
  useBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
