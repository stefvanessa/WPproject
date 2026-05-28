export interface WeatherDay {
  date: string;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  precipitationProbability: number;
}

export const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Moderate showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ hail',
  99: 'Thunderstorm w/ heavy hail',
};

export function getWeatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Unknown';
}

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<Record<string, WeatherDay>> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '16',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Weather fetch failed');

  const data = await res.json();
  const result: Record<string, WeatherDay> = {};

  (data.daily.time as string[]).forEach((date, i) => {
    result[date] = {
      date,
      weatherCode: data.daily.weathercode[i],
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      precipitationProbability: data.daily.precipitation_probability_max[i] ?? 0,
    };
  });

  return result;
}

export async function geocodeCity(
  name: string
): Promise<{ lat: number; lon: number; label: string }> {
  const results = await searchLocations(name, 1);
  if (!results.length) throw new Error('City not found');
  return results[0];
}

export async function searchLocations(
  name: string,
  count = 5
): Promise<{ lat: number; lon: number; label: string }[]> {
  const params = new URLSearchParams({ name, count: String(count), language: 'en', format: 'json' });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data.results?.length) return [];
  return data.results.map((r: any) => ({
    lat: r.latitude,
    lon: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }));
}

export function getUserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { timeout: 8000 }
    );
  });
}
