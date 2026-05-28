import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './CalendarPage.scss';
import Navbar from '../../components/navbar/Navbar';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import OutfitPickerModal from '../../components/calendar/OutfitPickerModal';
import {
  fetchMonthEntries,
  upsertCalendarEntry,
  deleteCalendarEntry,
  type CalendarEntry,
} from '../../api/calendar';
import { fetchOutfits } from '../../api/outfits';
import { fetchWeather, geocodeCity, searchLocations, getUserLocation, type WeatherDay } from '../../api/weather';
import { FiChevronLeft, FiChevronRight, FiMapPin } from 'react-icons/fi';

const LOCATION_KEY = 'calendar_location';
type SavedLocation = { label: string; lat: number; lon: number };

export default function CalendarPage() {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherDay>>({});
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [locationError, setLocationError] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ lat: number; lon: number; label: string }[]>([]);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const year = current.getFullYear();
  const month = current.getMonth() + 1;
  const monthName = current.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    fetchOutfits().then(setOutfits).catch(console.error);

    const saved = localStorage.getItem(LOCATION_KEY);
    if (saved) {
      try {
        const loc: SavedLocation = JSON.parse(saved);
        setLocation(loc);
        fetchWeather(loc.lat, loc.lon).then(setWeatherMap).catch(() => {});
        return;
      } catch {}
    }

    getUserLocation()
      .then(({ lat, lon }) => {
        const loc: SavedLocation = { label: 'Current location', lat, lon };
        setLocation(loc);
        return fetchWeather(lat, lon);
      })
      .then(setWeatherMap)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (editingLocation) locationInputRef.current?.focus();
  }, [editingLocation]);

  const handleLocationSubmit = async () => {
    const trimmed = locationInput.trim();
    if (!trimmed) { setEditingLocation(false); return; }

    setWeatherLoading(true);
    setLocationError(false);
    setSuggestions([]);
    try {
      const loc = await geocodeCity(trimmed);
      applyLocation(loc);
    } catch {
      setLocationError(true);
    } finally {
      setWeatherLoading(false);
    }
  };

  const applyLocation = useCallback(async (loc: SavedLocation) => {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    setLocation(loc);
    setLocationInput('');
    setEditingLocation(false);
    setSuggestions([]);
    try {
      const weather = await fetchWeather(loc.lat, loc.lon);
      setWeatherMap(weather);
    } catch {}
  }, []);

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    setLocationError(false);

    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);

    if (!value.trim()) { setSuggestions([]); return; }

    suggestDebounce.current = setTimeout(async () => {
      try {
        const results = await searchLocations(value.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  useEffect(() => {
    setLoading(true);
    fetchMonthEntries(year, month)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const entryMap = useMemo(() => {
    const map: Record<string, CalendarEntry> = {};
    entries.forEach((e) => { map[e.date] = e; });
    return map;
  }, [entries]);

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setPickerOpen(true);
  };

  const handleSave = async (outfitId: string) => {
    if (!selectedDate) return;
    const updated = await upsertCalendarEntry(selectedDate, outfitId);
    setEntries((prev) => {
      const exists = prev.some((e) => e.date === selectedDate);
      return exists
        ? prev.map((e) => (e.date === selectedDate ? updated : e))
        : [...prev, updated];
    });
    setPickerOpen(false);
  };

  const handleRemove = async () => {
    if (!selectedDate) return;
    const entry = entryMap[selectedDate];
    if (entry) {
      await deleteCalendarEntry(entry._id);
      setEntries((prev) => prev.filter((e) => e.date !== selectedDate));
    }
    setPickerOpen(false);
  };

  const prevMonth = () =>
    setCurrent((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrent((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCurrent(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div className="calendar-page">
      <Navbar activeTab="calendar" />
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="month-nav">
            <button className="nav-btn" onClick={prevMonth} aria-label="Previous month">
              <FiChevronLeft />
            </button>
            <h2 className="month-title">
              {monthName} {year}
            </h2>
            <button className="nav-btn" onClick={nextMonth} aria-label="Next month">
              <FiChevronRight />
            </button>
          </div>

          <div className="header-right">
            <div className="location-control">
              {editingLocation ? (
                <div className="location-input-wrap">
                  <FiMapPin size={13} className="location-pin" />
                  <input
                    ref={locationInputRef}
                    className={`location-input${locationError ? ' error' : ''}`}
                    placeholder="Enter city…"
                    value={locationInput}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLocationSubmit();
                      if (e.key === 'Escape') {
                        setEditingLocation(false);
                        setLocationError(false);
                        setSuggestions([]);
                      }
                    }}
                    onBlur={() => {
                      if (!locationInput.trim()) {
                        setEditingLocation(false);
                        setLocationError(false);
                        setSuggestions([]);
                      }
                    }}
                    disabled={weatherLoading}
                    autoComplete="off"
                  />
                  {weatherLoading && <span className="location-spinner" />}
                  {locationError && <span className="location-error-tip">Not found</span>}
                  {suggestions.length > 0 && (
                    <ul className="location-suggestions">
                      {suggestions.map((s) => (
                        <li
                          key={`${s.lat},${s.lon}`}
                          onMouseDown={(e) => { e.preventDefault(); applyLocation(s); }}
                        >
                          <FiMapPin size={11} />
                          {s.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <button
                  className="location-btn"
                  onClick={() => setEditingLocation(true)}
                  title="Change location"
                >
                  <FiMapPin size={13} />
                  <span>{location?.label ?? 'Set location'}</span>
                </button>
              )}
            </div>

            <button className="today-btn" onClick={goToday}>
              Today
            </button>
          </div>
        </div>

        {loading ? (
          <p className="loading-text">Loading…</p>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            entryMap={entryMap}
            weatherMap={weatherMap}
            onDayClick={handleDayClick}
          />
        )}
      </div>

      <OutfitPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        date={selectedDate}
        weather={selectedDate ? weatherMap[selectedDate] : undefined}
        currentEntry={selectedDate ? entryMap[selectedDate] : undefined}
        outfits={outfits}
        onSave={handleSave}
        onRemove={handleRemove}
        onOutfitCreated={(outfit) => setOutfits((prev) => [outfit, ...prev])}
      />
    </div>
  );
}
