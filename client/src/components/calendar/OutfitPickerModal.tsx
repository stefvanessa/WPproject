import { useEffect, useState } from 'react';
import './OutfitPickerModal.scss';
import Modal from '../modal/Modal';
import MiniOutfitPreview from './MiniOutfitPreview';
import type { CalendarEntry } from '../../api/calendar';

interface Props {
  open: boolean;
  onClose: () => void;
  date: string | null;
  currentEntry?: CalendarEntry;
  outfits: any[];
  onSave: (outfitId: string) => Promise<void>;
  onRemove: () => Promise<void>;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function OutfitPickerModal({
  open,
  onClose,
  date,
  currentEntry,
  outfits,
  onSave,
  onRemove,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setSelected(currentEntry?.outfit?._id ?? null);
  }, [date, currentEntry]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onSave(selected);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  };

  const title = date ? `Plan outfit — ${formatDate(date)}` : 'Plan outfit';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="picker-content">
        {outfits.length === 0 ? (
          <p className="picker-empty">
            No saved outfits yet. Head to Generate to create some!
          </p>
        ) : (
          <div className="picker-grid">
            {outfits.map((outfit) => (
              <div
                key={outfit._id}
                className={`picker-card ${selected === outfit._id ? 'selected' : ''}`}
                onClick={() => setSelected(outfit._id)}
              >
                <MiniOutfitPreview outfit={outfit} />
                <span className="picker-name">{outfit.name || 'Outfit'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="picker-actions">
          {currentEntry?.outfit && (
            <button className="remove-btn" onClick={handleRemove} disabled={removing}>
              {removing ? 'Removing…' : 'Remove outfit'}
            </button>
          )}
          <div className="picker-action-right">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={!selected || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
