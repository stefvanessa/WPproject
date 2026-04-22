import { useEffect, useMemo, useState } from 'react';
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
import { fetchWeather, getUserLocation, type WeatherDay } from '../../api/weather';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function CalendarPage() {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherDay>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const year = current.getFullYear();
  const month = current.getMonth() + 1;
  const monthName = current.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    fetchOutfits().then(setOutfits).catch(console.error);

    getUserLocation()
      .then(({ lat, lon }) => fetchWeather(lat, lon))
      .then(setWeatherMap)
      .catch(() => { /* weather is optional — silently skip if denied */ });
  }, []);

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
          <button className="today-btn" onClick={goToday}>
            Today
          </button>
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
        currentEntry={selectedDate ? entryMap[selectedDate] : undefined}
        outfits={outfits}
        onSave={handleSave}
        onRemove={handleRemove}
      />
    </div>
  );
}
