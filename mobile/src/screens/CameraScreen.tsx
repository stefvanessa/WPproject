import { useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Svg, { Path, Defs, ClipPath, Image as SvgImage } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Camera">;

const SW = Dimensions.get("window").width;
const SH = Dimensions.get("window").height;
const GUIDE_W = SW * 0.72;

const GUIDES = {
  top: {
    label: "Top",
    normH: 100,
    path: "M 36,0 L 16,3 L 0,18 L 0,35 L 17,35 L 17,100 L 83,100 L 83,35 L 100,35 L 100,18 L 84,3 L 64,0 Q 50,13 36,0 Z",
  },
  bottom: {
    label: "Bottom",
    normH: 155,
    path: "M 8,0 L 92,0 L 97,50 L 97,155 L 58,155 L 56,50 Q 50,68 44,50 L 44,155 L 3,155 L 3,50 Z",
  },
} as const;
type GuideKey = keyof typeof GUIDES;

function scalePath(path: string, scale: number, dx: number, dy: number): string {
  return path.replace(
    /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
    (_, x, y) =>
      `${(parseFloat(x) * scale + dx).toFixed(2)},${(parseFloat(y) * scale + dy).toFixed(2)}`
  );
}

export default function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [guideKey, setGuideKey] = useState<GuideKey>("top");
  const cameraRef = useRef<CameraView>(null);
  const maskViewRef = useRef<View>(null);

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
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } finally {
      setCapturing(false);
    }
  }

  async function handleUsePhoto() {
    if (!maskViewRef.current || saving) return;
    setSaving(true);
    try {
      const uri = await captureRef(maskViewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      navigation.replace("AddItem", { photoUri: uri });
    } catch {
      // fallback: use original photo if capture fails
      if (photoUri) navigation.replace("AddItem", { photoUri });
    } finally {
      setSaving(false);
    }
  }

  if (photoUri) {
    const guide = GUIDES[guideKey];
    const guideH = (GUIDE_W * guide.normH) / 100;
    const offsetX = (SW - GUIDE_W) / 2;
    const offsetY = (SH - guideH) / 2;

    // Position the full photo in SVG-space so the guide area fills viewBox (0,0 → 100,normH).
    // preserveAspectRatio="xMidYMid slice" mirrors the camera's cover-mode display.
    const imgX = (-offsetX * 100) / GUIDE_W;
    const imgY = (-offsetY * 100) / GUIDE_W;
    const imgW = (SW * 100) / GUIDE_W;
    const imgH = (SH * 100) / GUIDE_W;

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewCenter}>
          {/* This View is what gets captured as a PNG */}
          <View
            ref={maskViewRef}
            collapsable={false}
            style={{ width: GUIDE_W, height: guideH, backgroundColor: "transparent" }}
          >
            <Svg width={GUIDE_W} height={guideH} viewBox={`0 0 100 ${guide.normH}`}>
              <Defs>
                <ClipPath id="clothingMask">
                  <Path d={guide.path} />
                </ClipPath>
              </Defs>
              <SvgImage
                href={{ uri: photoUri }}
                x={imgX}
                y={imgY}
                width={imgW}
                height={imgH}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#clothingMask)"
              />
            </Svg>
          </View>
        </View>

        <SafeAreaView style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.retakeBtn]}
            onPress={() => { setPhotoUri(null); setSaving(false); }}
            disabled={saving}
          >
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.useBtn]}
            onPress={handleUsePhoto}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.useBtnText}>Use photo</Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ── Live camera view ─────────────────────────────────────────────────────────
  const guide = GUIDES[guideKey];
  const scale = GUIDE_W / 100;
  const guideH = (GUIDE_W * guide.normH) / 100;
  const offsetX = (SW - GUIDE_W) / 2;
  const offsetY = (SH - guideH) / 2;

  const scaledShape = scalePath(guide.path, scale, offsetX, offsetY);
  const overlayPath = `M 0,0 L ${SW},0 L ${SW},${SH} L 0,${SH} Z ${scaledShape}`;

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      {/* Dark overlay with clothing-shape cutout */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={SW} height={SH}>
          <Path fillRule="evenodd" fill="rgba(0,0,0,0.58)" d={overlayPath} />
        </Svg>
      </View>

      {/* Dashed white outline */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: offsetY, left: offsetX, width: GUIDE_W, height: guideH }}
      >
        <Svg width={GUIDE_W} height={guideH} viewBox={`0 0 100 ${guide.normH}`}>
          <Path
            d={guide.path}
            fill="none"
            stroke="white"
            strokeWidth={2.5}
            strokeDasharray="10 5"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      {/* Hint text */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Text style={[styles.guideHint, { top: offsetY + guideH + 12 }]}>
          Place item inside the frame
        </Text>
      </View>

      {/* Top / Bottom tabs */}
      <View style={styles.tabs}>
        {(Object.keys(GUIDES) as GuideKey[]).map((k) => (
          <TouchableOpacity
            key={k}
            style={[styles.tab, guideKey === k && styles.tabActive]}
            onPress={() => setGuideKey(k)}
          >
            <Text style={[styles.tabText, guideKey === k && styles.tabTextActive]}>
              {GUIDES[k].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Controls */}
      <SafeAreaView style={styles.controls}>
        <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.sideBtnText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shutter} onPress={handleCapture} disabled={capturing}>
          {capturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>
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
  container:    { flex: 1, backgroundColor: "#000" },
  camera:       { flex: 1 },
  guideHint: {
    position: "absolute",
    left: 0, right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  tabs: {
    position: "absolute",
    top: 56, left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  tab: {
    paddingHorizontal: 24, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  tabActive:     { backgroundColor: PINK, borderColor: PINK },
  tabText:       { color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  centered: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 32, backgroundColor: "#fafafa",
  },
  permText:     { fontSize: 15, color: "#444", textAlign: "center", marginBottom: 20 },
  permBtn:      { backgroundColor: PINK, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  permBtnText:  { color: "#fff", fontWeight: "600", fontSize: 15 },
  backLink:     { marginTop: 16 },
  backLinkText: { color: "#aaa", fontSize: 14 },
  controls: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 36,
    paddingBottom: 36,
    paddingTop: 16,
  },
  shutter: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  sideBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  sideBtnText: { color: "#fff", fontSize: 18 },
  // Preview
  previewContainer: {
    flex: 1,
    backgroundColor: "#111",
  },
  previewCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingBottom: 40,
  },
  actionBtn: {
    flex: 1, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  retakeBtn:     { backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  retakeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  useBtn:        { backgroundColor: PINK },
  useBtnText:    { color: "#fff", fontSize: 16, fontWeight: "600" },
});
