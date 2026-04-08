export interface EventCheckinRecord {
  userId: number;
  checkedInAt: string;
  eventSnapshot?: EventSnapshot;
}

export interface EventSnapshot {
  title: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface UserCheckinHistoryItem {
  eventId: string;
  userId: number;
  checkedInAt: string;
  eventSnapshot?: EventSnapshot;
}

const CHECKIN_CODES_STORAGE_KEY = 'luma_event_checkin_codes';
const CHECKIN_RECORDS_STORAGE_KEY = 'luma_event_checkin_records';

type CheckinCodeStore = Record<string, string>;
type CheckinRecordsStore = Record<string, EventCheckinRecord[]>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function randomCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function getOrCreateEventCheckinCode(eventId: string): string {
  const store = readJson<CheckinCodeStore>(CHECKIN_CODES_STORAGE_KEY, {});
  const existing = store[eventId];
  if (existing) return existing;

  const usedCodes = new Set(Object.values(store));
  let code = randomCode();
  while (usedCodes.has(code)) {
    code = randomCode();
  }

  store[eventId] = code;
  writeJson(CHECKIN_CODES_STORAGE_KEY, store);
  return code;
}

export function verifyEventCheckinCode(eventId: string, inputCode: string): boolean {
  const expected = getOrCreateEventCheckinCode(eventId);
  return inputCode.trim().toUpperCase() === expected.toUpperCase();
}

export function getEventCheckins(eventId: string): EventCheckinRecord[] {
  const recordsStore = readJson<CheckinRecordsStore>(CHECKIN_RECORDS_STORAGE_KEY, {});
  const records = recordsStore[eventId] ?? [];
  return [...records].sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
}

export function hasUserCheckedIn(eventId: string, userId: number): boolean {
  return getEventCheckins(eventId).some((record) => record.userId === userId);
}

export function recordEventCheckin(
  eventId: string,
  userId: number,
  eventSnapshot?: EventSnapshot
): EventCheckinRecord {
  const recordsStore = readJson<CheckinRecordsStore>(CHECKIN_RECORDS_STORAGE_KEY, {});
  const current = recordsStore[eventId] ?? [];
  const alreadyCheckedIn = current.some((record) => record.userId === userId);
  if (alreadyCheckedIn) {
    throw new Error('You have already checked in to this event.');
  }

  const newRecord: EventCheckinRecord = {
    userId,
    checkedInAt: new Date().toISOString(),
    ...(eventSnapshot ? { eventSnapshot } : {}),
  };

  recordsStore[eventId] = [newRecord, ...current];
  writeJson(CHECKIN_RECORDS_STORAGE_KEY, recordsStore);
  return newRecord;
}

export function getUserCheckinHistory(userId: number): UserCheckinHistoryItem[] {
  const recordsStore = readJson<CheckinRecordsStore>(CHECKIN_RECORDS_STORAGE_KEY, {});
  const entries = Object.entries(recordsStore).flatMap(([eventId, records]) =>
    (records ?? [])
      .filter((record) => record.userId === userId)
      .map((record) => ({
        eventId,
        userId: record.userId,
        checkedInAt: record.checkedInAt,
        eventSnapshot: record.eventSnapshot,
      }))
  );
  return entries.sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
}
