import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { fetchMeta, createProduct, type ProductMeta } from "../api";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "AddItem">;

const fmt = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── Inline picker sheet ───────────────────────────────────────────────────────
function PickerSheet({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onClose} />
      <View style={sheet.container}>
        <SafeAreaView>
          <View style={sheet.handle} />
          <Text style={sheet.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={sheet.option}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={sheet.optionText}>{fmt(item)}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddItemScreen({ route, navigation }: Props) {
  const { photoUri } = route.params;
  const { token } = useAuth();

  const [meta, setMeta] = useState<ProductMeta | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [fit, setFit] = useState("");
  const [style, setStyle] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<string[]>([]);

  const [picker, setPicker] = useState<{ field: string; options: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) fetchMeta(token).then(setMeta).catch(() => {});
  }, [token]);

  function openPicker(field: string, options: string[]) {
    setPicker({ field, options });
  }

  function handleSelect(value: string) {
    if (!picker) return;
    if (picker.field === "category") { setCategory(value); setType(""); }
    else if (picker.field === "type") setType(value);
    else if (picker.field === "color") setColor(value);
    else if (picker.field === "pattern") setPattern(value);
    else if (picker.field === "fit") setFit(value);
  }

  function toggleMulti(value: string, list: string[], setter: (a: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSave() {
    if (!name.trim()) return Alert.alert("Missing", "Please enter an item name.");
    if (!category || !type || !color || !pattern || !fit)
      return Alert.alert("Missing", "Please fill in all fields.");
    if (style.length === 0) return Alert.alert("Missing", "Select at least one style.");
    if (temperature.length === 0) return Alert.alert("Missing", "Select at least one season.");

    setSaving(true);
    try {
      await createProduct(token!, photoUri, {
        name: name.trim(),
        category,
        type,
        color,
        pattern,
        fit,
        style,
        temperature,
      });
      navigation.popToTop(); // back to wardrobe
    } catch (err: any) {
      Alert.alert("Upload failed", err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = category && meta ? (meta.clothingCategories[category] ?? []) : [];

  function SelectField({
    label,
    value,
    field,
    options,
    disabled,
  }: {
    label: string;
    value: string;
    field: string;
    options: string[];
    disabled?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[styles.selectField, disabled && styles.selectFieldDisabled]}
        onPress={() => !disabled && openPicker(field, options)}
        disabled={disabled}
      >
        <Text style={styles.selectLabel}>{label}</Text>
        <Text style={[styles.selectValue, !value && styles.selectPlaceholder]}>
          {value ? fmt(value) : `Select ${label.toLowerCase()}`}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Item</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={PINK} />
          ) : (
            <Text style={styles.saveBtn}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Photo */}
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ITEM NAME</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Beige Trench Coat"
            placeholderTextColor="#bbb"
            value={name}
            onChangeText={setName}
            editable={!saving}
          />
        </View>

        {/* Selects */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETAILS</Text>
          <SelectField label="Category" value={category} field="category"
            options={meta ? Object.keys(meta.clothingCategories) : []} />
          <SelectField label="Type" value={type} field="type"
            options={typeOptions} disabled={!category} />
          <SelectField label="Color" value={color} field="color"
            options={meta?.clothingColors ?? []} />
          <SelectField label="Pattern" value={pattern} field="pattern"
            options={meta?.clothingPatterns ?? []} />
          <SelectField label="Fit" value={fit} field="fit"
            options={meta?.clothingFits ?? []} />
        </View>

        {/* Style pills */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STYLE</Text>
          <View style={styles.pills}>
            {(meta?.clothingStyles ?? []).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.pill, style.includes(s) && styles.pillActive]}
                onPress={() => toggleMulti(s, style, setStyle)}
              >
                <Text style={[styles.pillText, style.includes(s) && styles.pillTextActive]}>
                  {fmt(s)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Season pills */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SEASON</Text>
          <View style={styles.pills}>
            {(meta?.clothingWeather ?? []).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, temperature.includes(t) && styles.pillActive]}
                onPress={() => toggleMulti(t, temperature, setTemperature)}
              >
                <Text style={[styles.pillText, temperature.includes(t) && styles.pillTextActive]}>
                  {fmt(t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Picker bottom sheet */}
      <PickerSheet
        visible={!!picker}
        title={picker?.field ?? ""}
        options={picker?.options ?? []}
        onSelect={handleSelect}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
  );
}

const PINK = "#7fa6d9";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f3ee" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ecf7",
    backgroundColor: "#e4e0da",
  },
  backBtn: { fontSize: 17, color: PINK, fontWeight: "500" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#3e4246" },
  saveBtn: { fontSize: 17, color: PINK, fontWeight: "600" },
  scroll: { paddingBottom: 40 },
  photo: { width: "100%", height: 280, backgroundColor: "#eee" },
  section: { padding: 16, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  nameInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#dddbd8",
    padding: 13,
    fontSize: 15,
    color: "#3e4246",
  },
  selectField: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#dddbd8",
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectFieldDisabled: { opacity: 0.45 },
  selectLabel: { fontSize: 13, color: "#888", fontWeight: "500" },
  selectValue: { fontSize: 14, color: "#3e4246", fontWeight: "500" },
  selectPlaceholder: { color: "#bbb" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#dddbd8",
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: "#eef4fb", borderColor: PINK },
  pillText: { fontSize: 13, color: "#666", fontWeight: "500" },
  pillTextActive: { color: PINK },
});

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#c8c5c0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3e4246",
    textAlign: "center",
    paddingVertical: 12,
    textTransform: "capitalize",
  },
  option: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f7f3ee",
  },
  optionText: { fontSize: 15, color: "#3e4246" },
});
