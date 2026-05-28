import { useEffect, useState } from 'react';
import './CreateOutfitModal.scss';
import Modal from '../modal/Modal';
import { fetchProducts, type Product } from '../../api/products';
import { saveOutfit, updateOutfit } from '../../api/outfits';
import { FiPlus, FiX } from 'react-icons/fi';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (outfit: any) => void;
  outfit?: any; // pre-populated outfit for edit mode
}

const SLOTS = [
  { key: 'top',       label: 'Top',       category: 'tops'      },
  { key: 'bottom',    label: 'Bottom',    category: 'bottoms'   },
  { key: 'dress',     label: 'Dress',     category: 'dresses'   },
  { key: 'outerwear', label: 'Outerwear', category: 'outerwear' },
  { key: 'shoes',     label: 'Shoes',     category: 'footwear'  },
] as const;

type SlotKey = typeof SLOTS[number]['key'];
type SlotMap = Record<SlotKey, Product | null>;

const emptySlots = (): SlotMap => ({
  top: null, bottom: null, dress: null, outerwear: null, shoes: null,
});

function isDisabled(key: SlotKey, selected: SlotMap): boolean {
  if (key === 'dress')   return !!(selected.top || selected.bottom);
  if (key === 'top' || key === 'bottom') return !!selected.dress;
  return false;
}

export default function CreateOutfitModal({ open, onClose, onCreated, outfit }: Props) {
  const isEdit = !!outfit;

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<SlotMap>(emptySlots());
  const [activeSlot, setActiveSlot] = useState<SlotKey | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setActiveSlot(null);
    setError(null);

    // Pre-fill from outfit when editing
    if (outfit) {
      setName(outfit.name ?? '');
      setSelected({
        top:       outfit.top       ?? null,
        bottom:    outfit.bottom    ?? null,
        dress:     outfit.dress     ?? null,
        outerwear: outfit.outerwear ?? null,
        shoes:     outfit.shoes     ?? null,
      });
    } else {
      setName('');
      setSelected(emptySlots());
    }

    setLoadingProducts(true);
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [open, outfit]);

  const pickItem = (item: Product) => {
    if (!activeSlot) return;
    setSelected((prev) => {
      const next = { ...prev, [activeSlot]: item };
      // mutual exclusion
      if (activeSlot === 'dress') { next.top = null; next.bottom = null; }
      if (activeSlot === 'top' || activeSlot === 'bottom') next.dress = null;
      return next;
    });
    setActiveSlot(null);
  };

  const clearSlot = (key: SlotKey, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => ({ ...prev, [key]: null }));
    if (activeSlot === key) setActiveSlot(null);
  };

  const handleSlotClick = (key: SlotKey) => {
    if (isDisabled(key, selected)) return;
    setActiveSlot((prev) => (prev === key ? null : key));
    setError(null);
  };

  const activeCategory = SLOTS.find((s) => s.key === activeSlot)?.category;
  const pickerItems = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : [];

  const handleSave = async () => {
    const hasItem = Object.values(selected).some(Boolean);
    if (!hasItem) { setError('Add at least one item.'); return; }

    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string | undefined> = { name: name.trim() || undefined };
      for (const { key } of SLOTS) {
        if (selected[key]) payload[key] = selected[key]!._id;
      }

      const result = isEdit
        ? await updateOutfit(outfit._id, payload as any)
        : await saveOutfit(payload as any);

      onCreated(result);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save outfit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Outfit' : 'Create Outfit'}>
      <div className="co-form">

        <div className="co-name-row">
          <input
            className="co-name-input"
            placeholder="Outfit name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="co-slots">
          {SLOTS.map(({ key, label }) => {
            const item = selected[key];
            const isActive = activeSlot === key;
            const disabled = isDisabled(key, selected);
            return (
              <div
                key={key}
                className={`co-slot${isActive ? ' active' : ''}${item ? ' filled' : ''}${disabled ? ' disabled' : ''}`}
                onClick={() => handleSlotClick(key)}
                title={disabled ? (key === 'dress' ? 'Remove top/bottom first' : 'Remove dress first') : undefined}
              >
                {item ? (
                  <>
                    <img src={item.imageUrl} alt={item.name} className="co-slot-img" />
                    <button className="co-slot-clear" onClick={(e) => clearSlot(key, e)}>
                      <FiX size={10} />
                    </button>
                  </>
                ) : (
                  <FiPlus size={20} className="co-slot-plus" />
                )}
                <span className="co-slot-label">{label}</span>
              </div>
            );
          })}
        </div>

        {activeSlot && (
          <div className="co-picker">
            <span className="co-picker-label">
              Pick a {SLOTS.find((s) => s.key === activeSlot)?.label.toLowerCase()}
            </span>
            {loadingProducts ? (
              <p className="co-picker-empty">Loading…</p>
            ) : pickerItems.length === 0 ? (
              <p className="co-picker-empty">No items in this category yet.</p>
            ) : (
              <div className="co-picker-grid">
                {pickerItems.map((item) => {
                  const isChosen = selected[activeSlot]?._id === item._id;
                  return (
                    <div
                      key={item._id}
                      className={`co-picker-item${isChosen ? ' chosen' : ''}`}
                      onClick={() => pickItem(item)}
                    >
                      <img src={item.imageUrl} alt={item.name} />
                      <span>{item.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && <p className="co-error">{error}</p>}

        <div className="co-actions">
          <button className="co-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="co-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Outfit'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
