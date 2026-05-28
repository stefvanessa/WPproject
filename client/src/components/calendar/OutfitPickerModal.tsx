import { useEffect, useState } from 'react';
import './OutfitPickerModal.scss';
import Modal from '../modal/Modal';
import MiniOutfitPreview from './MiniOutfitPreview';
import WeatherIcon from './WeatherIcon';
import CreateOutfitModal from '../outfit/CreateOutfitModal';
import type { CalendarEntry } from '../../api/calendar';
import { getWeatherDescription, type WeatherDay } from '../../api/weather';
import { FiDroplet, FiPlus, FiThermometer } from 'react-icons/fi';

interface Props {
  open: boolean;
  onClose: () => void;
  date: string | null;
  weather?: WeatherDay;
  currentEntry?: CalendarEntry;
  outfits: any[];
  onSave: (outfitId: string) => Promise<void>;
  onRemove: () => Promise<void>;
  onOutfitCreated?: (outfit: any) => void;
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
  weather,
  currentEntry,
  outfits,
  onSave,
  onRemove,
  onOutfitCreated,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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

        {weather && (
          <div className="picker-weather">
            <div className="pw-main">
              <WeatherIcon code={weather.weatherCode} size={28} />
              <span className="pw-desc">{getWeatherDescription(weather.weatherCode)}</span>
            </div>
            <div className="pw-stats">
              <span className="pw-stat">
                <FiThermometer size={13} />
                {weather.maxTemp}° / {weather.minTemp}°
              </span>
              <span className="pw-divider" />
              <span className="pw-stat">
                <FiDroplet size={13} />
                {weather.precipitationProbability}%
              </span>
            </div>
          </div>
        )}

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
          <div className="picker-action-left">
            {currentEntry?.outfit && (
              <button className="remove-btn" onClick={handleRemove} disabled={removing}>
                {removing ? 'Removing…' : 'Remove outfit'}
              </button>
            )}
            <button className="create-btn" onClick={() => setCreateOpen(true)}>
              <FiPlus size={14} />
              Create Outfit
            </button>
          </div>
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

      <CreateOutfitModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(outfit) => {
          onOutfitCreated?.(outfit);
          setSelected(outfit._id);
          setCreateOpen(false);
        }}
      />
    </Modal>
  );
}
