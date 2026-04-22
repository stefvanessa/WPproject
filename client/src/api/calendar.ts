import { apiFetch } from './client';

export interface CalendarEntry {
  _id: string;
  date: string;
  outfit?: any;
}

export async function fetchMonthEntries(year: number, month: number): Promise<CalendarEntry[]> {
  return apiFetch<CalendarEntry[]>(`/api/calendar?year=${year}&month=${month}`);
}

export async function upsertCalendarEntry(date: string, outfitId: string): Promise<CalendarEntry> {
  return apiFetch<CalendarEntry>('/api/calendar', {
    method: 'POST',
    body: JSON.stringify({ date, outfitId }),
  });
}

export async function deleteCalendarEntry(id: string): Promise<void> {
  await apiFetch(`/api/calendar/${id}`, { method: 'DELETE' });
}
