import { useEffect, useRef } from 'react';
import './WeatherPopup.scss';
import WeatherIcon from './WeatherIcon';
import { getWeatherDescription, type WeatherDay } from '../../api/weather';

interface Props {
  weather: WeatherDay;
  onClose: () => void;
}

export default function WeatherPopup({ weather, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="weather-popup" ref={ref} onClick={(e) => e.stopPropagation()}>
      <div className="wp-header">
        <WeatherIcon code={weather.weatherCode} size={22} />
        <span className="wp-description">{getWeatherDescription(weather.weatherCode)}</span>
      </div>
      <div className="wp-divider" />
      <div className="wp-row">
        <span className="wp-label">High / Low</span>
        <span className="wp-value">{weather.maxTemp}° / {weather.minTemp}°</span>
      </div>
      <div className="wp-row">
        <span className="wp-label">Precipitation</span>
        <span className="wp-value">{weather.precipitationProbability}%</span>
      </div>
    </div>
  );
}
