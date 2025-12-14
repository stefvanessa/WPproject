import { useEffect, useMemo, useState } from "react";
import { FiEdit } from "react-icons/fi";
import EditModal from "../modal/Modal";
import "./WardrobeCard.scss";
import type { Product, ProductMeta } from "../../api/products";
import { updateProduct, deleteProduct } from "../../api/products";
import placeholderImg from "../../assets/hoodie.png";

interface WardrobeCardProps {
  item: Product;
  meta: ProductMeta | null;
  onUpdated: (product: Product) => void;
  onDeleted?: (id: string) => void;
}

export default function WardrobeCard({ item, meta, onUpdated, onDeleted }: WardrobeCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [type, setType] = useState(item.type);
  const [color, setColor] = useState(item.color);
  const [pattern, setPattern] = useState(item.pattern);
  const [fit, setFit] = useState(item.fit);
  const [style, setStyle] = useState<string[]>(item.style ?? []);
  const [temperature, setTemperature] = useState<string[]>(item.temperature ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(item.name);
      setCategory(item.category);
      setType(item.type);
      setColor(item.color);
      setPattern(item.pattern);
      setFit(item.fit);
      setStyle(item.style ?? []);
      setTemperature(item.temperature ?? []);
      setError(null);
    }
  }, [open, item]);

  const imageSrc = item.imageUrl ?? placeholderImg;

  const typeOptions = useMemo(() => {
    if (!category || !meta?.clothingCategories) return [];
    return meta.clothingCategories[category] ?? [];
  }, [category, meta]);

  const toggleMultiValue = (value: string, list: string[], setter: (arr: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  const renderOptions = (options: string[]) =>
    options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ));

  const handleSave = async () => {
    if (!meta) {
      setError("Options are still loading. Please try again.");
      return;
    }
    if (!name || !category || !type || !color || !pattern || !fit || style.length === 0 || temperature.length === 0) {
      setError("Please fill all required fields.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateProduct(item._id, {
        name,
        category,
        type,
        color,
        pattern,
        fit,
        style,
        temperature,
      });
      // Preserve existing imageUrl if backend did not include one
      const merged = { ...updated, imageUrl: updated.imageUrl ?? item.imageUrl };
      onUpdated(merged);
      setOpen(false);
    } catch (err: any) {
      setError(err.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="wardrobe-item-card">
        <div className="edit-btn" onClick={() => setOpen(true)}>
          <FiEdit />
        </div>

        <img src={imageSrc} alt={item.name} />
        <h4>{item.name}</h4>
      </div>

      <EditModal open={open} title="Edit Item" onClose={() => setOpen(false)}>
        <div className="form-field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setType("");
              }}
              disabled={saving}
            >
              <option value="">Select category</option>
              {meta?.clothingCategories &&
                Object.keys(meta.clothingCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} disabled={saving || !category}>
              <option value="">Select type</option>
              {renderOptions(typeOptions)}
            </select>
          </div>

          <div className="form-field">
            <label>Color</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} disabled={saving}>
              <option value="">Select color</option>
              {meta?.clothingColors && renderOptions(meta.clothingColors)}
            </select>
          </div>

          <div className="form-field">
            <label>Pattern</label>
            <select value={pattern} onChange={(e) => setPattern(e.target.value)} disabled={saving}>
              <option value="">Select pattern</option>
              {meta?.clothingPatterns && renderOptions(meta.clothingPatterns)}
            </select>
          </div>

          <div className="form-field">
            <label>Fit</label>
            <select value={fit} onChange={(e) => setFit(e.target.value)} disabled={saving}>
              <option value="">Select fit</option>
              {meta?.clothingFits && renderOptions(meta.clothingFits)}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label>Style</label>
          <div className="multiselect">
            {meta?.clothingStyles?.map((s) => (
              <label key={s} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={style.includes(s)}
                  onChange={() => toggleMultiValue(s, style, setStyle)}
                  disabled={saving}
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Temperature</label>
          <div className="multiselect">
            {meta?.clothingWeather?.map((t) => (
              <label key={t} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={temperature.includes(t)}
                  onChange={() => toggleMultiValue(t, temperature, setTemperature)}
                  disabled={saving}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        {confirmingDelete && (
          <div className="confirm-delete">
            <p>Are you sure you want to delete this item?</p>
            <div className="confirm-actions">
              <button className="cancel" onClick={() => setConfirmingDelete(false)} disabled={saving}>
                Cancel
              </button>
              <button
                className="delete"
                onClick={async () => {
                  if (!onDeleted) {
                    setConfirmingDelete(false);
                    return;
                  }
                  setSaving(true);
                  setError(null);
                  try {
                    await deleteProduct(item._id);
                    onDeleted(item._id);
                    setOpen(false);
                  } catch (err: any) {
                    setError(err.message ?? "Failed to delete");
                  } finally {
                    setSaving(false);
                    setConfirmingDelete(false);
                  }
                }}
                disabled={saving}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="cancel" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </button>
          <button className="cancel" onClick={() => setConfirmingDelete(true)} disabled={saving}>
            Delete
          </button>
          <button className="save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </EditModal>
    </>
  );
}
