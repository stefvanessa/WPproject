import './CalendarGrid.scss';
import CalendarDay from './CalendarDay';
import type { CalendarEntry } from '../../api/calendar';
import type { WeatherDay } from '../../api/weather';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

function todayStr(): string {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

interface Props {
  year: number;
  month: number;
  entryMap: Record<string, CalendarEntry>;
  weatherMap: Record<string, WeatherDay>;
  onDayClick: (dateStr: string) => void;
}

export default function CalendarGrid({ year, month, entryMap, weatherMap, onDayClick }: Props) {
  const today = todayStr();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="calendar-grid">
      {DAY_LABELS.map((label) => (
        <div key={label} className="day-header">
          {label}
        </div>
      ))}
      {cells.map((day, idx) => {
        const dateStr = day ? `${year}-${pad(month)}-${pad(day)}` : null;
        return (
          <CalendarDay
            key={idx}
            day={day}
            dateStr={dateStr}
            entry={dateStr ? entryMap[dateStr] : undefined}
            weather={dateStr ? weatherMap[dateStr] : undefined}
            isToday={dateStr === today}
            isPast={!!dateStr && dateStr < today}
            onClick={dateStr ? () => onDayClick(dateStr) : undefined}
          />
        );
      })}
    </div>
  );
}
