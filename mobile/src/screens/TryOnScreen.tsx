import { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  PanResponder,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { CameraView } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

type Props = NativeStackScreenProps<RootStackParamList, "TryOn">;

const ITEM_W = 220;
const ITEM_H = 300;

export default function TryOnScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const { token } = useAuth();
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const prevTouch = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number | null>(null);

  useEffect(() => {
    if (!item.imageUrl) {
      setProcessing(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const imgResp = await fetch(item.imageUrl!);
        const blob = await imgResp.blob();

        const form = new FormData();
        form.append("image", blob as any, "item.jpg");

        const bgResp = await fetch(`${API_URL}/api/remove-bg`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });

        if (!bgResp.ok) {
          const errText = await bgResp.text().catch(() => "");
          console.warn(`[TryOn] remove-bg ${bgResp.status}:`, errText);
          throw new Error(`remove-bg ${bgResp.status}`);
        }

        const pngBlob = await bgResp.blob();
        console.log("[TryOn] got PNG blob, size:", pngBlob.size, "type:", pngBlob.type);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) {
            setDisplayUri(reader.result as string);
            setProcessing(false);
          }
        };
        reader.readAsDataURL(pngBlob);
      } catch (err) {
        console.warn("[TryOn] remove-bg failed, using original:", err);
        if (!cancelled) {
          setDisplayUri(item.imageUrl ?? null);
          setProcessing(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [item.imageUrl, token]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        prevTouch.current = null;
        lastDist.current = null;
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          const t = touches[0];
          if (prevTouch.current) {
            const dx = t.pageX - prevTouch.current.x;
            const dy = t.pageY - prevTouch.current.y;
            setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
          }
          prevTouch.current = { x: t.pageX, y: t.pageY };
          lastDist.current = null;
        } else if (touches.length >= 2) {
          const [t1, t2] = touches;
          const dist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
          if (lastDist.current !== null) {
            const ratio = dist / lastDist.current;
            setScale((s) => Math.max(0.2, Math.min(5, s * ratio)));
          }
          lastDist.current = dist;
          prevTouch.current = null;
        }
      },
      onPanResponderRelease: () => {
        prevTouch.current = null;
        lastDist.current = null;
      },
      onPanResponderTerminate: () => {
        prevTouch.current = null;
        lastDist.current = null;
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" />

      {processing ? (
        <ActivityIndicator
          style={styles.spinner}
          size="large"
          color={PINK}
        />
      ) : displayUri ? (
        <Image
          source={{ uri: displayUri }}
          style={[
            styles.item,
            {
              transform: [
                { translateX: pos.x },
                { translateY: pos.y },
                { scale },
              ],
            },
          ]}
          resizeMode="contain"
        />
      ) : null}

      <SafeAreaView style={styles.hud} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        <View style={styles.badge}>
          <Text style={styles.badgeName}>{item.name}</Text>
          <Text style={styles.badgeType}>{item.type}</Text>
          <Text style={styles.badgeHint}>Drag · Pinch to resize</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const PINK = "#ff00a2";

const styles = StyleSheet.create({
  container: { flex: 1 },
  spinner: { position: "absolute", alignSelf: "center", top: "50%" },
  item: {
    position: "absolute",
    width: ITEM_W,
    height: ITEM_H,
    // centre the item on screen initially
    top: "50%",
    left: "50%",
    marginTop: -(ITEM_H / 2),
    marginLeft: -(ITEM_W / 2),
  },
  hud: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 36,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: { color: "#fff", fontSize: 18 },
  badge: {
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 3,
  },
  badgeName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  badgeType: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  badgeHint: { color: PINK, fontSize: 11, marginTop: 4, fontWeight: "600" },
});
