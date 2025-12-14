import Modal from "../modal/Modal";
import "./FilterModal.scss";
import type { ProductMeta } from "../../api/products";
import { useState, useEffect } from "react";

export interface AdvancedFilters {
  color?: string;
  temperature?: string;
  pattern?: string;
  style?: string;
  fit?: string;
  category?: string;
  type?: string;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  meta: ProductMeta | null;
  initial: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
}

export default function FilterModal({ open, onClose, meta, initial, onApply }: FilterModalProps) {
  const [local, setLocal] = useState<AdvancedFilters>(initial);

  useEffect(() => {
    if (open) {
      setLocal(initial);
    }
  }, [open, initial]);

  const update = (patch: Partial<AdvancedFilters>) => setLocal((prev) => ({ ...prev, ...patch }));

  const typeOptions = local.category && meta?.clothingCategories
    ? meta.clothingCategories[local.category] ?? []
    : [];

  return (
    <Modal open={open} onClose={onClose} title="Filters">
      <div className="filter-form">
        <div className="form-grid">
          <div className="form-field">
            <label>Category</label>
            <select
              value={local.category ?? ""}
              onChange={(e) => update({ category: e.target.value || undefined, type: undefined })}
            >
              <option value="">Any</option>
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
            <select
              value={local.type ?? ""}
              onChange={(e) => update({ type: e.target.value || undefined })}
              disabled={!local.category}
            >
              <option value="">Any</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Color</label>
            <select value={local.color ?? ""} onChange={(e) => update({ color: e.target.value || undefined })}>
              <option value="">Any</option>
              {meta?.clothingColors?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Pattern</label>
            <select value={local.pattern ?? ""} onChange={(e) => update({ pattern: e.target.value || undefined })}>
              <option value="">Any</option>
              {meta?.clothingPatterns?.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Fit</label>
            <select value={local.fit ?? ""} onChange={(e) => update({ fit: e.target.value || undefined })}>
              <option value="">Any</option>
              {meta?.clothingFits?.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Season</label>
            <select
              value={local.temperature ?? ""}
              onChange={(e) => update({ temperature: e.target.value || undefined })}
            >
              <option value="">Any</option>
              {meta?.clothingWeather?.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Style</label>
            <select value={local.style ?? ""} onChange={(e) => update({ style: e.target.value || undefined })}>
              <option value="">Any</option>
              {meta?.clothingStyles?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions spaced">
          <button
            className="cancel"
            onClick={() => {
              setLocal(initial);
              onClose();
            }}
          >
            Cancel
          </button>
          <div className="actions-right">
            <button
              className="cancel"
              onClick={() => {
                const cleared: AdvancedFilters = {};
                setLocal(cleared);
                onApply(cleared);
                onClose();
              }}
            >
              Clear
            </button>
            <button
              className="save"
              onClick={() => {
                onApply(local);
                onClose();
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
