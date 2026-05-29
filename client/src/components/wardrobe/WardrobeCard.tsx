import { useEffect, useMemo, useState } from "react";
import { FiEdit, FiChevronDown } from "react-icons/fi";
import EditModal from "../modal/Modal";
import "./WardrobeCard.scss";
import "../upload-modal/UploadModal.scss";
import type { Product, ProductMeta } from "../../api/products";
import { updateProduct, deleteProduct } from "../../api/products";
import placeholderImg from "../../assets/hoodie.png";

interface WardrobeCardProps {
  item: Product;
  meta: ProductMeta | null;
  onUpdated: (product: Product) => void;
  onDeleted?: (id: string) => void;
}

const PRESET_STYLES = ["casual", "formal", "sporty", "streetwear", "elegant", "vintage"];

const fmt = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
      setConfirmingDelete(false);
    }
  }, [open, item]);

  const imageSrc = item.imageUrl ?? placeholderImg;

  const typeOptions = useMemo(() => {
    if (!category || !meta?.clothingCategories) return [];
    return meta.clothingCategories[category] ?? [];
  }, [category, meta]);

  const toggleTag = (value: string, list: string[], setter: (arr: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSave = async () => {
    if (!meta) { setError("Options are still loading. Please try again."); return; }
    if (!name || !category || !type || !color || !pattern || !fit || style.length === 0 || temperature.length === 0) {
      setError("Please fill in all fields."); return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateProduct(item._id, { name, category, type, color, pattern, fit, style, temperature });
      onUpdated({ ...updated, imageUrl: updated.imageUrl ?? item.imageUrl });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
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
        <div className="upload-form">

          {/* TOP ROW: image + name / category / type */}
          <div className="upload-top-row">
            <div className="image-col">
              <div className="image-preview-compact">
                <img src={imageSrc} alt={item.name} />
              </div>
            </div>

            <div className="right-col">
              <div className="form-field">
                <label>Item name</label>
                <input
                  placeholder="e.g. Beige Trench Coat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="two-col">
                <div className="form-field">
                  <label>Category</label>
                  <div className="select-wrapper">
                    <select
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); setType(""); }}
                      disabled={saving}
                    >
                      <option value="">Category</option>
                      {meta?.clothingCategories &&
                        Object.keys(meta.clothingCategories).map((c) => (
                          <option key={c} value={c}>{fmt(c)}</option>
                        ))}
                    </select>
                    <FiChevronDown className="select-chevron" size={14} />
                  </div>
                </div>
                <div className="form-field">
                  <label>Type</label>
                  <div className="select-wrapper">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      disabled={saving || !category}
                    >
                      <option value="">Type</option>
                      {typeOptions.map((t) => (
                        <option key={t} value={t}>{fmt(t)}</option>
                      ))}
                    </select>
                    <FiChevronDown className="select-chevron" size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLOR / PATTERN / FIT */}
          <div className="three-col">
            {[
              { label: "Color", value: color, setter: setColor, options: meta?.clothingColors },
              { label: "Pattern", value: pattern, setter: setPattern, options: meta?.clothingPatterns },
              { label: "Fit", value: fit, setter: setFit, options: meta?.clothingFits },
            ].map(({ label, value, setter, options }) => (
              <div className="form-field" key={label}>
                <label>{label}</label>
                <div className="select-wrapper">
                  <select
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    disabled={saving}
                  >
                    <option value="">{label}</option>
                    {options?.map((o) => (
                      <option key={o} value={o}>{fmt(o)}</option>
                    ))}
                  </select>
                  <FiChevronDown className="select-chevron" size={14} />
                </div>
              </div>
            ))}
          </div>

          {/* STYLE TAGS */}
          <div className="tag-section">
            <span className="section-label">Style</span>
            <div className="tag-pills-row">
              {PRESET_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tag-pill${style.includes(s) ? " active" : ""}`}
                  onClick={() => toggleTag(s, style, setStyle)}
                  disabled={saving}
                >
                  {fmt(s)}
                </button>
              ))}
            </div>
          </div>

          {/* SEASON TAGS */}
          <div className="tag-section">
            <span className="section-label">Season</span>
            <div className="tag-pills-row">
              {meta?.clothingWeather?.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tag-pill${temperature.includes(t) ? " active" : ""}`}
                  onClick={() => toggleTag(t, temperature, setTemperature)}
                  disabled={saving}
                >
                  {fmt(t)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

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
                    if (!onDeleted) { setConfirmingDelete(false); return; }
                    setSaving(true);
                    setError(null);
                    try {
                      await deleteProduct(item._id);
                      onDeleted(item._id);
                      setOpen(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to delete");
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
            {!confirmingDelete && (
              <button className="delete-action" onClick={() => setConfirmingDelete(true)} disabled={saving}>
                Delete
              </button>
            )}
            <button className="save" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

        </div>
      </EditModal>
    </>
  );
}
