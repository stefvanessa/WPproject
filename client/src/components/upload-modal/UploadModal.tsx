import "./UploadModal.scss";
import Modal from "../modal/Modal";
import { FiUpload, FiChevronDown, FiX } from "react-icons/fi";
import { useEffect, useMemo, useRef, useState } from "react";
import { createProduct, type Product, type ProductMeta } from "../../api/products";
import { API_BASE_URL } from "../../api/client";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
  meta: ProductMeta | null;
}

const PRESET_STYLES = ["casual", "formal", "sporty", "streetwear", "elegant", "vintage"];

const fmt = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function UploadModal({ open, onClose, onCreated, meta }: UploadModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [fit, setFit] = useState("");
  const [style, setStyle] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<string[]>([]);
  const [customStyleInput, setCustomStyleInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const typeOptions = useMemo(() => {
    if (!category || !meta?.clothingCategories) return [];
    return meta.clothingCategories[category] ?? [];
  }, [category, meta]);

  const customStyleTags = style.filter((s) => !PRESET_STYLES.includes(s));

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const resetForm = () => {
    setName(""); setCategory(""); setType(""); setColor("");
    setPattern(""); setFit(""); setStyle([]); setTemperature([]);
    setCustomStyleInput(""); setSelectedFile(null);
    setImagePreview(null); setError(null); setSubmitting(false); setRemovingBg(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemovingBg(true);

    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE_URL}/api/remove-bg`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const contentType = res.headers.get("content-type") ?? "image/png";
        const blob = new Blob([arrayBuffer], { type: contentType });
        const cleanedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".png"), { type: contentType });
        setSelectedFile(cleanedFile);
        setImagePreview(URL.createObjectURL(blob));
      }
    } catch {
      // keep original on network error
    } finally {
      setRemovingBg(false);
    }
  };

  const toggleTag = (value: string, list: string[], setter: (a: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const addCustomStyle = () => {
    const trimmed = customStyleInput.trim().toLowerCase();
    if (trimmed && !style.includes(trimmed)) {
      setStyle((prev) => [...prev, trimmed]);
    }
    setCustomStyleInput("");
  };

  const handleSave = async () => {
    if (!meta) { setError("Options still loading. Try again."); return; }
    if (!selectedFile) { setError("Please select a photo."); return; }
    if (!name || !category || !type || !color || !pattern || !fit || style.length === 0 || temperature.length === 0) {
      setError("Please fill in all fields."); return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", selectedFile);
      fd.append("name", name); fd.append("category", category);
      fd.append("type", type); fd.append("color", color);
      fd.append("pattern", pattern); fd.append("fit", fit);
      style.forEach((s) => fd.append("style", s));
      temperature.forEach((t) => fd.append("temperature", t));
      const product = await createProduct(fd);
      onCreated(product);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Item">
      <div className="upload-form">

        {/* ── TOP: image + name / category / type ── */}
        <div className="upload-top-row">
          {/* Image column */}
          <div className="image-col">
            {imagePreview ? (
              <div className="image-preview-compact">
                <img src={imagePreview} alt="Preview" />
                {removingBg && (
                  <div className="removing-bg-overlay">Removing bg…</div>
                )}
                {!removingBg && (
                  <button
                    className="change-photo-btn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div
                className="upload-area-compact"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUpload size={22} color="#999" />
                <span className="upload-label">Upload photo</span>
                <span className="upload-hint">PNG or JPG</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={submitting}
            />
          </div>

          {/* Name + Category + Type */}
          <div className="right-col">
            <div className="form-field">
              <label>Item name</label>
              <input
                placeholder="e.g. Beige Trench Coat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="two-col">
              <div className="form-field">
                <label>Category</label>
                <div className="select-wrapper">
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setType(""); }}
                    disabled={submitting}
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
                    disabled={submitting || !category}
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

        {/* ── MIDDLE: color / pattern / fit ── */}
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
                  disabled={submitting}
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

        {/* ── STYLE TAGS ── */}
        <div className="tag-section">
          <span className="section-label">Style</span>
          <div className="tag-pills-row">
            {PRESET_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                className={`tag-pill${style.includes(s) ? " active" : ""}`}
                onClick={() => toggleTag(s, style, setStyle)}
                disabled={submitting}
              >
                {fmt(s)}
              </button>
            ))}
          </div>

          {customStyleTags.length > 0 && (
            <div className="tag-pills-row">
              {customStyleTags.map((s) => (
                <span key={s} className="tag-pill active removable">
                  {fmt(s)}
                  <button
                    type="button"
                    className="remove-tag-btn"
                    onClick={() => toggleTag(s, style, setStyle)}
                  >
                    <FiX size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="custom-tag-row">
            <input
              placeholder="Add custom style…"
              value={customStyleInput}
              onChange={(e) => setCustomStyleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomStyle(); } }}
              disabled={submitting}
            />
            <button
              type="button"
              className="add-tag-btn"
              onClick={addCustomStyle}
              disabled={submitting || !customStyleInput.trim()}
            >
              + Add
            </button>
          </div>
        </div>

        {/* ── SEASON / WEATHER TAGS ── */}
        <div className="tag-section">
          <span className="section-label">Season</span>
          <div className="tag-pills-row">
            {meta?.clothingWeather?.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag-pill${temperature.includes(t) ? " active" : ""}`}
                onClick={() => toggleTag(t, temperature, setTemperature)}
                disabled={submitting}
              >
                {fmt(t)}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button
            className="cancel"
            onClick={() => { onClose(); resetForm(); }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button className="save" onClick={handleSave} disabled={submitting || removingBg}>
            {submitting ? "Saving…" : "Save Item"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
