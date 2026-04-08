const DATE_PREFIX = /^(\d{4})[-/](\d{2})[-/](\d{2})/;
const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function extractEventDateKey(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  const match = trimmed.match(DATE_PREFIX);
  if (!match) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function formatEventDateLabel(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const key = extractEventDateKey(value);
  if (!key) return 'Date TBD';

  const [year, month, day] = key.split('-').map(Number);
  // Use a fixed local date (no timezone offset drift) for display.
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  return localDate.toLocaleDateString('en-US', options);
}

export function isValidEventTime(value: string): boolean {
  return TIME_24H.test(value.trim());
}

export function formatEventTimeLabel(value: string): string {
  return isValidEventTime(value) ? value.trim() : 'Time TBD';
}

export function isValidEventDate(value: string): boolean {
  const key = extractEventDateKey(value);
  if (!key) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;

  const [year, month, day] = key.split('-').map(Number);
  const candidate = new Date(year, month - 1, day);
  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
}
