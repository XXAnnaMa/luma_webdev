import { extractEventDateKey } from './eventDate';
import { getUserCheckinHistory } from './eventCheckin';

export type BadgeCategory = 'streak' | 'category' | 'neighborhood' | 'participation';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  category: BadgeCategory;
  threshold: number;
}

export interface UserBadge extends BadgeDefinition {
  earnedAt: string;
}

export interface BadgeStats {
  longestStreakDays: number;
  categoriesExplored: number;
  neighborhoodsVisited: number;
  checkinsCompleted: number;
  dailySigninsCompleted: number;
  totalPoints: number;
}

export interface LocalUserProfileBadgeData {
  userId: number;
  badges: UserBadge[];
  stats: BadgeStats;
  updatedAt: string;
}

interface StoredBadgeState {
  [userId: string]: Record<string, string>;
}

export interface DailySigninRecord {
  dateKey: string;
  signedInAt: string;
  pointsAwarded: number;
}

interface StoredDailySigninState {
  [userId: string]: DailySigninRecord[];
}

const BADGE_STORAGE_KEY = 'luma_profile_badges_v1';
const USER_PROFILE_BADGE_STORAGE_KEY = 'luma_user_profile_badges_v1';
const DAILY_SIGNIN_STORAGE_KEY = 'luma_daily_signin_history_v1';
export const CHECKIN_POINTS_PER_EVENT = 10;
export const DAILY_SIGNIN_POINTS = 20;

function normalizeBadgeStats(stats: Partial<BadgeStats> | null | undefined): BadgeStats {
  const checkinsCompleted = stats?.checkinsCompleted ?? 0;
  const dailySigninsCompleted = stats?.dailySigninsCompleted ?? 0;
  return {
    longestStreakDays: stats?.longestStreakDays ?? 0,
    categoriesExplored: stats?.categoriesExplored ?? 0,
    neighborhoodsVisited: stats?.neighborhoodsVisited ?? 0,
    checkinsCompleted,
    dailySigninsCompleted,
    totalPoints:
      stats?.totalPoints ??
      checkinsCompleted * CHECKIN_POINTS_PER_EVENT +
        dailySigninsCompleted * DAILY_SIGNIN_POINTS,
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'streak_2',
    name: 'Momentum Starter',
    description: 'Join events on 2 consecutive days.',
    category: 'streak',
    threshold: 2,
  },
  {
    key: 'streak_5',
    name: 'Consistency Pro',
    description: 'Join events on 5 consecutive days.',
    category: 'streak',
    threshold: 5,
  },
  {
    key: 'categories_3',
    name: 'Category Explorer',
    description: 'Check in to 3 different event categories.',
    category: 'category',
    threshold: 3,
  },
  {
    key: 'categories_5',
    name: 'Genre Collector',
    description: 'Check in to 5 different event categories.',
    category: 'category',
    threshold: 5,
  },
  {
    key: 'neighborhoods_3',
    name: 'City Walker',
    description: 'Visit events in 3 different neighborhoods.',
    category: 'neighborhood',
    threshold: 3,
  },
  {
    key: 'neighborhoods_5',
    name: 'City Navigator',
    description: 'Visit events in 5 different neighborhoods.',
    category: 'neighborhood',
    threshold: 5,
  },
  {
    key: 'checkins_5',
    name: 'Active Participant',
    description: 'Complete 5 confirmed event check-ins.',
    category: 'participation',
    threshold: 5,
  },
  {
    key: 'checkins_15',
    name: 'Community Pillar',
    description: 'Complete 15 confirmed event check-ins.',
    category: 'participation',
    threshold: 15,
  },
];

function readBadgeState(): StoredBadgeState {
  try {
    const raw = localStorage.getItem(BADGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredBadgeState;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeBadgeState(state: StoredBadgeState) {
  localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(state));
}

function readDailySigninState(): StoredDailySigninState {
  try {
    const raw = localStorage.getItem(DAILY_SIGNIN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredDailySigninState;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeDailySigninState(state: StoredDailySigninState) {
  localStorage.setItem(DAILY_SIGNIN_STORAGE_KEY, JSON.stringify(state));
}

function writeUserProfileBadgeData(data: LocalUserProfileBadgeData) {
  try {
    const raw = localStorage.getItem(USER_PROFILE_BADGE_STORAGE_KEY);
    const current = raw ? (JSON.parse(raw) as Record<string, LocalUserProfileBadgeData>) : {};
    current[String(data.userId)] = data;
    localStorage.setItem(USER_PROFILE_BADGE_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore profile persistence failures to avoid blocking primary flow
  }
}

export function getUserProfileBadgeData(userId: number): LocalUserProfileBadgeData | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_BADGE_STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, LocalUserProfileBadgeData>;
    const entry = all[String(userId)];
    if (!entry) return null;
    return {
      ...entry,
      stats: normalizeBadgeStats(entry.stats),
    };
  } catch {
    return null;
  }
}

function toDayStamp(value: string): number | null {
  const key = extractEventDateKey(value);
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  const stamp = new Date(year, month - 1, day, 12, 0, 0).getTime();
  return Number.isNaN(stamp) ? null : stamp;
}

function getLocalDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNeighborhoodKey(address: string | undefined, lat: number | undefined, lng: number | undefined): string {
  if (address) {
    const parts = address.split(',').map((item) => item.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0].toLowerCase()}|${parts[1].toLowerCase()}`;
    if (parts.length === 1) return parts[0].toLowerCase();
  }
  if (lat !== undefined && lng !== undefined) {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }
  return 'unknown';
}

export function getUserDailySigninHistory(userId: number): DailySigninRecord[] {
  const state = readDailySigninState();
  const records = state[String(userId)] ?? [];
  return records
    .filter((record) => Boolean(record?.dateKey) && Boolean(record?.signedInAt))
    .sort((a, b) => b.signedInAt.localeCompare(a.signedInAt));
}

export function hasUserSignedInToday(userId: number, now = new Date()): boolean {
  const todayKey = getLocalDateKey(now);
  return getUserDailySigninHistory(userId).some((record) => record.dateKey === todayKey);
}

export function recordDailySignin(
  userId: number,
  now = new Date()
): { created: boolean; record: DailySigninRecord } {
  const state = readDailySigninState();
  const userKey = String(userId);
  const records = getUserDailySigninHistory(userId);
  const todayKey = getLocalDateKey(now);
  const existing = records.find((record) => record.dateKey === todayKey);

  if (existing) {
    return { created: false, record: existing };
  }

  const record: DailySigninRecord = {
    dateKey: todayKey,
    signedInAt: now.toISOString(),
    pointsAwarded: DAILY_SIGNIN_POINTS,
  };

  state[userKey] = [record, ...records].sort((a, b) => b.signedInAt.localeCompare(a.signedInAt));
  writeDailySigninState(state);

  return { created: true, record };
}

export function computeBadgeStats(userId: number): BadgeStats {
  const history = getUserCheckinHistory(userId);
  const dailySigninHistory = getUserDailySigninHistory(userId);

  const uniqueCategories = new Set<string>();
  const uniqueNeighborhoods = new Set<string>();
  const uniqueDays = new Set<number>();

  for (const record of history) {
    const category = record.eventSnapshot?.category?.trim();
    if (category) uniqueCategories.add(category);

    const neighborhood = getNeighborhoodKey(
      record.eventSnapshot?.address,
      record.eventSnapshot?.latitude,
      record.eventSnapshot?.longitude
    );
    if (neighborhood !== 'unknown') uniqueNeighborhoods.add(neighborhood);

    const dayStamp = toDayStamp(record.checkedInAt);
    if (dayStamp !== null) uniqueDays.add(dayStamp);
  }

  const sortedDays = Array.from(uniqueDays).sort((a, b) => a - b);
  let longestStreak = sortedDays.length > 0 ? 1 : 0;
  let current = sortedDays.length > 0 ? 1 : 0;
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = 1; i < sortedDays.length; i += 1) {
    if (sortedDays[i] - sortedDays[i - 1] === oneDayMs) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > longestStreak) longestStreak = current;
  }

  return {
    longestStreakDays: longestStreak,
    categoriesExplored: uniqueCategories.size,
    neighborhoodsVisited: uniqueNeighborhoods.size,
    checkinsCompleted: history.length,
    dailySigninsCompleted: dailySigninHistory.length,
    totalPoints:
      history.length * CHECKIN_POINTS_PER_EVENT +
      dailySigninHistory.length * DAILY_SIGNIN_POINTS,
  };
}

function meetsThreshold(definition: BadgeDefinition, stats: BadgeStats): boolean {
  if (definition.category === 'streak') return stats.longestStreakDays >= definition.threshold;
  if (definition.category === 'category') return stats.categoriesExplored >= definition.threshold;
  if (definition.category === 'neighborhood') return stats.neighborhoodsVisited >= definition.threshold;
  return stats.checkinsCompleted >= definition.threshold;
}

export function awardBadgesForUser(userId: number): { badges: UserBadge[]; newlyAwarded: UserBadge[]; stats: BadgeStats } {
  const stats = computeBadgeStats(userId);
  const state = readBadgeState();
  const userKey = String(userId);
  const current = state[userKey] ?? {};
  const nowIso = new Date().toISOString();
  const newlyAwarded: UserBadge[] = [];

  for (const definition of BADGE_DEFINITIONS) {
    const qualified = meetsThreshold(definition, stats);
    if (!qualified) continue;
    if (!current[definition.key]) {
      current[definition.key] = nowIso;
      newlyAwarded.push({ ...definition, earnedAt: nowIso });
    }
  }

  state[userKey] = current;
  writeBadgeState(state);

  const badges: UserBadge[] = BADGE_DEFINITIONS
    .filter((definition) => Boolean(current[definition.key]))
    .map((definition) => ({
      ...definition,
      earnedAt: current[definition.key],
    }))
    .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));

  writeUserProfileBadgeData({
    userId,
    badges,
    stats,
    updatedAt: new Date().toISOString(),
  });

  return { badges, newlyAwarded, stats };
}

export function getUserBadges(userId: number): UserBadge[] {
  return awardBadgesForUser(userId).badges;
}
