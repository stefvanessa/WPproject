import "./UploadModal.scss";
import Modal from "../modal/Modal";
import { FiUpload } from "react-icons/fi";
import { useEffect, useMemo, useRef, useState } from "react";
import { createProduct, type Product, type ProductMeta } from "../../api/products";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
  meta: ProductMeta | null;
}

export default function UploadModal({ open, onClose, onCreated, meta }: UploadModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [fit, setFit] = useState("");
  const [style, setStyle] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const typeOptions = useMemo(() => {
    if (!category || !meta?.clothingCategories) return [];
    return meta.clothingCategories[category] ?? [];
  }, [category, meta]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setName("");
    setCategory("");
    setType("");
    setColor("");
    setPattern("");
    setFit("");
    setStyle([]);
    setTemperature([]);
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
    setSubmitting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSave = async () => {
    if (!meta) {
      setError("Options are still loading. Please try again in a moment.");
      return;
    }
    if (!selectedFile) {
      setError("Please select an image.");
      return;
    }
    if (!name || !category || !type || !color || !pattern || !fit || style.length === 0 || temperature.length === 0) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("name", name);
      formData.append("category", category);
      formData.append("type", type);
      formData.append("color", color);
      formData.append("pattern", pattern);
      formData.append("fit", fit);
      style.forEach((s) => formData.append("style", s));
      temperature.forEach((t) => formData.append("temperature", t));

      const product = await createProduct(formData);
      onCreated(product);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <Modal open={open} onClose={onClose} title="Add New Wardrobe Item">
      <div className="upload-form">
        {/* NAME */}
        <div className="form-field">
          <label>Item Name</label>
          <input
            placeholder="Ex: Beige Trench Coat"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="form-grid">
          {/* CATEGORY */}
          <div className="form-field">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setType("");
              }}
              disabled={submitting}
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

          {/* TYPE */}
          <div className="form-field">
            <label>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={submitting || !category}
            >
              <option value="">Select type</option>
              {renderOptions(typeOptions)}
            </select>
          </div>

          {/* COLOR */}
          <div className="form-field">
            <label>Color</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} disabled={submitting}>
              <option value="">Select color</option>
              {meta?.clothingColors && renderOptions(meta.clothingColors)}
            </select>
          </div>

          {/* PATTERN */}
          <div className="form-field">
            <label>Pattern</label>
            <select value={pattern} onChange={(e) => setPattern(e.target.value)} disabled={submitting}>
              <option value="">Select pattern</option>
              {meta?.clothingPatterns && renderOptions(meta.clothingPatterns)}
            </select>
          </div>

          {/* FIT */}
          <div className="form-field">
            <label>Fit</label>
            <select value={fit} onChange={(e) => setFit(e.target.value)} disabled={submitting}>
              <option value="">Select fit</option>
              {meta?.clothingFits && renderOptions(meta.clothingFits)}
            </select>
          </div>
        </div>

        {/* STYLE (multi) */}
        <div className="form-field">
          <label>Style</label>
          <div className="multiselect">
            {meta?.clothingStyles?.map((s) => (
              <label key={s} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={style.includes(s)}
                  onChange={() => toggleMultiValue(s, style, setStyle)}
                  disabled={submitting}
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* TEMPERATURE (multi) */}
        <div className="form-field">
          <label>Temperature</label>
          <div className="multiselect">
            {meta?.clothingWeather?.map((t) => (
              <label key={t} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={temperature.includes(t)}
                  onChange={() => toggleMultiValue(t, temperature, setTemperature)}
                  disabled={submitting}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* UPLOAD PHOTO */}
        <div className="form-field">
          <label>Upload Photo</label>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}

          {!imagePreview && (
            <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
              <FiUpload className="upload-icon" />
              <span className="upload-text">Click to upload or drag & drop</span>
              <span className="upload-hint">PNG or JPG only</span>
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

        {error && <div className="error-text">{error}</div>}

        {/* SAVE / CANCEL */}
        <div className="modal-actions">
          <button
            className="cancel"
            onClick={() => {
              onClose();
              resetForm();
            }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button className="save" onClick={handleSave} disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
