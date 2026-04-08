import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  awardBadgesForUser,
  CHECKIN_POINTS_PER_EVENT,
  DAILY_SIGNIN_POINTS,
  getUserProfileBadgeData,
  hasUserSignedInToday,
  recordDailySignin,
  type BadgeStats,
  type UserBadge,
} from '../lib/badges';

const EMPTY_STATS: BadgeStats = {
  longestStreakDays: 0,
  categoriesExplored: 0,
  neighborhoodsVisited: 0,
  checkinsCompleted: 0,
  dailySigninsCompleted: 0,
  totalPoints: 0,
};

function categoryLabel(category: UserBadge['category']): string {
  if (category === 'streak') return 'Streak';
  if (category === 'category') return 'Category';
  if (category === 'neighborhood') return 'Neighborhood';
  return 'Participation';
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [stats, setStats] = useState<BadgeStats>(EMPTY_STATS);
  const [hasSignedInToday, setHasSignedInToday] = useState(false);
  const [isClaimingDailyReward, setIsClaimingDailyReward] = useState(false);
  const [dailyRewardNotice, setDailyRewardNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const cached = getUserProfileBadgeData(user.id);
    if (cached) {
      setBadges(cached.badges);
      setStats(cached.stats);
    }

    const refreshed = awardBadgesForUser(user.id);
    setBadges(refreshed.badges);
    setStats(refreshed.stats);
    setHasSignedInToday(hasUserSignedInToday(user.id));
    setDailyRewardNotice(null);
  }, [user?.id]);

  const handleDailySignin = () => {
    if (!user || isClaimingDailyReward) return;

    setIsClaimingDailyReward(true);
    setDailyRewardNotice(null);

    try {
      const result = recordDailySignin(user.id);
      const refreshed = awardBadgesForUser(user.id);

      setBadges(refreshed.badges);
      setStats(refreshed.stats);
      setHasSignedInToday(hasUserSignedInToday(user.id));

      if (!result.created) {
        setDailyRewardNotice(`Today's ${DAILY_SIGNIN_POINTS} pts have already been claimed.`);
        return;
      }

      setDailyRewardNotice(
        `Daily sign-in completed for ${new Date(result.record.signedInAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}. +${DAILY_SIGNIN_POINTS} pts added.`
      );
    } catch {
      setDailyRewardNotice('Unable to claim daily points right now.');
    } finally {
      setIsClaimingDailyReward(false);
    }
  };

  const completion = useMemo(() => {
    const target = 8;
    return Math.min(100, Math.round((badges.length / target) * 100));
  }, [badges.length]);

  const nextPointsMilestone = useMemo(() => {
    const milestoneStep = 50;
    if (stats.totalPoints <= 0) return milestoneStep;
    return Math.ceil((stats.totalPoints + 1) / milestoneStep) * milestoneStep;
  }, [stats.totalPoints]);

  const pointsToNextMilestone = Math.max(0, nextPointsMilestone - stats.totalPoints);
  const pointsProgress = Math.min(
    100,
    Math.round((stats.totalPoints / nextPointsMilestone) * 100)
  );

  if (!user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F7F5F0' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)' }}
          >
            <h1 style={{ fontSize: '32px', color: '#2E1A1A', fontWeight: 600, marginBottom: '12px' }}>
              Profile
            </h1>
            <p style={{ fontSize: '16px', color: '#6B6B6B', marginBottom: '20px' }}>
              Sign in to view your badges and activity progress.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-full"
              style={{ backgroundColor: '#2E1A1A', color: '#FFFFFF', border: 'none' }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5F0' }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section
            className="lg:col-span-1 rounded-xl p-6"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)' }}
          >
            <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '8px' }}>User Profile</p>
            <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#2E1A1A', marginBottom: '8px' }}>
              {user.full_name}
            </h1>
            <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '20px' }}>{user.email}</p>

            <div
              className="rounded-xl p-4 mb-5"
              style={{
                background:
                  'linear-gradient(135deg, rgba(194, 178, 128, 0.18), rgba(46, 26, 26, 0.05))',
                border: '1px solid rgba(194, 178, 128, 0.35)',
              }}
            >
              <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '6px' }}>Check-in Points</p>
              <div className="flex items-end gap-2 mb-2">
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#2E1A1A', lineHeight: 1 }}>
                  {stats.totalPoints}
                </span>
                <span style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '4px' }}>pts</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '10px' }}>
                {CHECKIN_POINTS_PER_EVENT} pts per event check-in • {DAILY_SIGNIN_POINTS} pts per daily sign-in
              </p>
              <div
                style={{
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pointsProgress}%`,
                    height: '100%',
                    backgroundColor: '#2E1A1A',
                  }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '8px' }}>
                {pointsToNextMilestone} pts to {nextPointsMilestone} pts
              </p>
            </div>

            <div
              className="rounded-xl p-4 mb-5"
              style={{
                backgroundColor: '#F9F7F2',
                border: '1px solid #E5E2DA',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '6px' }}>Daily Sign-in</p>
                  <h2 style={{ fontSize: '18px', color: '#2E1A1A', fontWeight: 600, marginBottom: '6px' }}>
                    Claim today&apos;s {DAILY_SIGNIN_POINTS} pts
                  </h2>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6 }}>
                    Sign in once per day to keep building your points total.
                  </p>
                </div>

                <button
                  onClick={handleDailySignin}
                  disabled={hasSignedInToday || isClaimingDailyReward}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: hasSignedInToday ? '#EDE7D6' : '#2E1A1A',
                    color: hasSignedInToday ? '#6B6B6B' : '#FFFFFF',
                    border: 'none',
                    minWidth: '132px',
                    cursor: hasSignedInToday ? 'default' : 'pointer',
                  }}
                >
                  {hasSignedInToday ? 'Signed Today' : isClaimingDailyReward ? 'Claiming...' : 'Daily Check-in'}
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#2E1A1A', marginBottom: '6px' }}>
                Daily sign-ins: <strong>{stats.dailySigninsCompleted}</strong>
              </p>
              <p style={{ fontSize: '12px', color: '#6B6B6B' }}>
                {hasSignedInToday
                  ? 'Today’s reward has been added to your total points.'
                  : `You can claim ${DAILY_SIGNIN_POINTS} pts once each day.`}
              </p>
              {dailyRewardNotice && (
                <p style={{ fontSize: '12px', color: '#2E1A1A', marginTop: '10px' }}>{dailyRewardNotice}</p>
              )}
            </div>

            <div className="mb-4">
              <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '8px' }}>
                Badge progress ({badges.length}/8)
              </p>
              <div
                style={{
                  height: '10px',
                  borderRadius: '9999px',
                  backgroundColor: '#F5F3EE',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${completion}%`,
                    height: '100%',
                    backgroundColor: '#C2B280',
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p style={{ fontSize: '14px', color: '#2E1A1A' }}>
                Check-ins: <strong>{stats.checkinsCompleted}</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#2E1A1A' }}>
                Daily sign-ins: <strong>{stats.dailySigninsCompleted}</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#2E1A1A' }}>
                Longest streak: <strong>{stats.longestStreakDays} day(s)</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#2E1A1A' }}>
                Categories explored: <strong>{stats.categoriesExplored}</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#2E1A1A' }}>
                Neighborhoods visited: <strong>{stats.neighborhoodsVisited}</strong>
              </p>
            </div>
          </section>

          <section className="lg:col-span-2">
            <div
              className="rounded-xl p-6 mb-6"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)' }}
            >
              <h2 style={{ fontSize: '22px', color: '#2E1A1A', fontWeight: 600, marginBottom: '8px' }}>
                Earned Badges
              </h2>
              <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
                Badges are awarded automatically based on your participation and exploration history.
              </p>
            </div>

            {badges.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)' }}
              >
                <p style={{ fontSize: '16px', color: '#6B6B6B' }}>
                  No badges yet. Start checking in to events to unlock badges.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {badges.map((badge) => (
                  <article
                    key={badge.key}
                    className="rounded-xl p-5"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E2DA',
                      boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#2E1A1A',
                          backgroundColor: 'rgba(194, 178, 128, 0.15)',
                          borderRadius: '9999px',
                          padding: '4px 10px',
                        }}
                      >
                        {categoryLabel(badge.category)}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6B6B6B' }}>
                        {new Date(badge.earnedAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', color: '#2E1A1A', fontWeight: 600, marginBottom: '8px' }}>
                      {badge.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.6 }}>{badge.description}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
