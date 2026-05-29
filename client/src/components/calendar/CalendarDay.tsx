import { useState } from 'react';
import './CalendarDay.scss';
import MiniOutfitPreview from './MiniOutfitPreview';
import WeatherIcon from './WeatherIcon';
import WeatherPopup from './WeatherPopup';
import type { WeatherDay } from '../../api/weather';
import type { CalendarEntry } from '../../api/calendar';

interface Props {
  day: number | null;
  dateStr: string | null;
  entry?: CalendarEntry;
  weather?: WeatherDay;
  isToday: boolean;
  isPast: boolean;
  onClick?: () => void;
}

export default function CalendarDay({ day, entry, weather, isToday, isPast, onClick }: Props) {
  const [popupOpen, setPopupOpen] = useState(false);
  const outfit = entry?.outfit;

  const classes = [
    'calendar-day',
    !day ? 'empty' : '',
    isToday ? 'today' : '',
    isPast && !isToday ? 'past' : '',
    outfit ? 'has-outfit' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={day ? onClick : undefined}>
      {day && (
        <>
          <div className="day-top-row">
            <div className="weather-slot">
              {weather && (
                <button
                  className="weather-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupOpen((v) => !v);
                  }}
                  aria-label="Weather details"
                >
                  <WeatherIcon code={weather.weatherCode} size={13} />
                  <span className="day-temp">
                    {Math.round((weather.maxTemp + weather.minTemp) / 2)}°
                  </span>
                  {popupOpen && (
                    <WeatherPopup
                      weather={weather}
                      onClose={() => setPopupOpen(false)}
                    />
                  )}
                </button>
              )}
            </div>
            <span className="day-number">{day}</span>
          </div>

          {outfit && (
            <div className="day-preview">
              <MiniOutfitPreview outfit={outfit} compact horizontal />
              <span className="day-outfit-name">{outfit.name || 'Outfit'}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
