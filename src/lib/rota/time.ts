/**
 * Dates and times on the rota.
 *
 * A shift is café wall-clock time — "Thursday 09:00 to 15:00" — so it is kept as
 * a calendar date (YYYY-MM-DD, stored as a date with no time zone) plus minutes
 * after midnight. Every function here works on UTC midnights so a server in
 * another time zone never shifts a day.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function isIsoDate(text: string): boolean {
  if (!ISO_DATE.test(text)) return false;
  return toIsoDate(fromIsoDate(text)) === text;
}

export function fromIsoDate(text: string): Date {
  return new Date(`${text}T00:00:00.000Z`);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  return toIsoDate(new Date(fromIsoDate(isoDate).getTime() + days * DAY_MS));
}

/** The Monday of the week holding this date. */
export function mondayOf(isoDate: string): string {
  const weekday = fromIsoDate(isoDate).getUTCDay();
  const sinceMonday = (weekday + 6) % 7;
  return addDays(isoDate, -sinceMonday);
}

/** The seven dates of the week starting on this Monday. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** "Mon 10 Nov" */
export function dayLabel(isoDate: string): string {
  const date = fromIsoDate(isoDate);
  const day = DAY_NAMES[date.getUTCDay()] ?? '';
  const month = MONTH_NAMES[date.getUTCMonth()] ?? '';
  return `${day} ${date.getUTCDate()} ${month}`;
}

/** "09:30" → 570, or null when it is not a time of day. */
export function parseTime(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 570 → "09:30" */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** "09:00–15:00" */
export function timeRange(startMinute: number, endMinute: number): string {
  return `${formatTime(startMinute)}–${formatTime(endMinute)}`;
}
