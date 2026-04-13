import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  deleteRewardCoupon,
  getRewardCouponCatalog,
  getUserRedeemedPoints,
  getUserRewardRedemptions,
  publishRewardCoupon,
  redeemRewardCoupon,
  saveRewardCouponAsset,
  type RewardCouponDefinition,
  type RewardRedemptionRecord,
} from '../lib/rewards';

const EMPTY_STATS: BadgeStats = {
  longestStreakDays: 0,
  categoriesExplored: 0,
  neighborhoodsVisited: 0,
  checkinsCompleted: 0,
  dailySigninsCompleted: 0,
  totalPoints: 0,
};

const EMPTY_PUBLISH_REWARD_FORM = {
  brand: '',
  title: '',
  description: '',
  rewardValueLabel: '',
  pointsCost: '20',
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
  const [rewardCoupons, setRewardCoupons] = useState<RewardCouponDefinition[]>([]);
  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemptionRecord[]>([]);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [redeemingCouponId, setRedeemingCouponId] = useState<string | null>(null);
  const [uploadingCouponId, setUploadingCouponId] = useState<string | null>(null);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
  const [publishRewardForm, setPublishRewardForm] = useState(EMPTY_PUBLISH_REWARD_FORM);
  const [publishRewardArtPreview, setPublishRewardArtPreview] = useState<string | null>(null);
  const [publishRewardArtName, setPublishRewardArtName] = useState<string | null>(null);
  const [isPublishingReward, setIsPublishingReward] = useState(false);
  const couponInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const publishRewardArtInputRef = useRef<HTMLInputElement | null>(null);

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
    setRewardCoupons(getRewardCouponCatalog());
    setRewardRedemptions(getUserRewardRedemptions(user.id));
    setRewardNotice(null);
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

  const redeemedPoints = useMemo(() => {
    if (!user) return 0;
    return getUserRedeemedPoints(user.id);
  }, [rewardRedemptions, user?.id]);

  const availablePoints = Math.max(0, stats.totalPoints - redeemedPoints);

  const nextPointsMilestone = useMemo(() => {
    const milestoneStep = 50;
    if (availablePoints <= 0) return milestoneStep;
    return Math.ceil((availablePoints + 1) / milestoneStep) * milestoneStep;
  }, [availablePoints]);

  const pointsToNextMilestone = Math.max(0, nextPointsMilestone - availablePoints);
  const pointsProgress = Math.min(
    100,
    Math.round((availablePoints / nextPointsMilestone) * 100)
  );

  const publishedRewardCoupons = useMemo(
    () => rewardCoupons.filter((coupon) => !coupon.isBuiltIn),
    [rewardCoupons]
  );

  const featuredRewardCoupons = useMemo(
    () => rewardCoupons.filter((coupon) => coupon.isBuiltIn),
    [rewardCoupons]
  );

  const handleRewardRedeem = (coupon: RewardCouponDefinition) => {
    if (!user || redeemingCouponId) return;

    setRedeemingCouponId(coupon.id);
    setRewardNotice(null);

    try {
      const record = redeemRewardCoupon({
        userId: user.id,
        couponId: coupon.id,
        availablePoints,
      });
      setRewardRedemptions(getUserRewardRedemptions(user.id));
      setRewardNotice(
        `${coupon.title} redeemed successfully. Voucher code: ${record.voucherCode}.`
      );
    } catch (error) {
      setRewardNotice(error instanceof Error ? error.message : 'Unable to redeem this reward.');
    } finally {
      setRedeemingCouponId(null);
    }
  };

  const handleCouponUpload = (coupon: RewardCouponDefinition, file: File | null) => {
    if (!user || !file) return;

    setUploadingCouponId(coupon.id);
    setRewardNotice(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result;
        if (typeof result !== 'string' || !result.startsWith('data:')) {
          throw new Error('Unsupported file preview.');
        }
        saveRewardCouponAsset(coupon.id, result, file.name);
        setRewardCoupons(getRewardCouponCatalog());
        setRewardNotice(`${coupon.brand} coupon art imported from ${file.name}.`);
      } catch (error) {
        setRewardNotice(error instanceof Error ? error.message : 'Unable to import coupon art.');
      } finally {
        setUploadingCouponId(null);
      }
    };
    reader.onerror = () => {
      setUploadingCouponId(null);
      setRewardNotice('Unable to read that file right now.');
    };
    reader.readAsDataURL(file);
  };

  const handlePublishRewardArtSelect = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.startsWith('data:')) {
        setRewardNotice('Unable to preview that cover art.');
        return;
      }

      setPublishRewardArtPreview(result);
      setPublishRewardArtName(file.name);
      setRewardNotice(`Reward cover art selected: ${file.name}.`);
    };
    reader.onerror = () => {
      setRewardNotice('Unable to read that cover art right now.');
    };
    reader.readAsDataURL(file);
  };

  const handlePublishReward = () => {
    if (!user || isPublishingReward) return;

    setIsPublishingReward(true);
    setRewardNotice(null);

    try {
      const createdCoupon = publishRewardCoupon({
        userId: user.id,
        creatorName: user.full_name,
        brand: publishRewardForm.brand,
        title: publishRewardForm.title,
        description: publishRewardForm.description,
        rewardValueLabel: publishRewardForm.rewardValueLabel,
        pointsCost: Number.parseInt(publishRewardForm.pointsCost, 10),
        uploadedImageDataUrl: publishRewardArtPreview ?? undefined,
        uploadedFileName: publishRewardArtName ?? undefined,
      });

      setRewardCoupons(getRewardCouponCatalog());
      setPublishRewardForm(EMPTY_PUBLISH_REWARD_FORM);
      setPublishRewardArtPreview(null);
      setPublishRewardArtName(null);
      setRewardNotice(`${createdCoupon.title} was published to the rewards marketplace.`);
    } catch (error) {
      setRewardNotice(error instanceof Error ? error.message : 'Unable to publish this reward offer.');
    } finally {
      setIsPublishingReward(false);
    }
  };

  const handleDeleteRewardOffer = (coupon: RewardCouponDefinition) => {
    if (!user || deletingCouponId || coupon.isBuiltIn) return;

    setDeletingCouponId(coupon.id);
    setRewardNotice(null);

    try {
      deleteRewardCoupon({
        couponId: coupon.id,
        userId: user.id,
      });
      setRewardCoupons(getRewardCouponCatalog());
      setRewardNotice(`${coupon.title} was deleted from Published Reward Offers.`);
    } catch (error) {
      setRewardNotice(error instanceof Error ? error.message : 'Unable to delete this reward offer.');
    } finally {
      setDeletingCouponId(null);
    }
  };

  const renderRewardCouponCard = (coupon: RewardCouponDefinition) => {
    const isRedeeming = redeemingCouponId === coupon.id;
    const isUploading = uploadingCouponId === coupon.id;
    const isDeleting = deletingCouponId === coupon.id;
    const previewImage = coupon.uploadedImage || coupon.defaultImage;
    const isCompactTitle = coupon.title.length > 21;
    const publisherLabel = coupon.isBuiltIn
      ? coupon.brand
      : `Published by ${coupon.createdByUserId === user.id ? 'you' : coupon.createdByName ?? 'a member'}`;
    const canDeleteOffer = !coupon.isBuiltIn && coupon.createdByUserId === user.id;

    return (
      <article
        key={coupon.id}
        className="rounded-xl overflow-hidden h-full flex flex-col"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E2DA',
          boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
        }}
      >
        <img
          src={previewImage}
          alt={coupon.title}
          style={{
            width: '100%',
            height: '180px',
            objectFit: 'cover',
            backgroundColor: coupon.backgroundColor,
          }}
        />

        <div className="p-5 flex flex-col flex-1">
          <div
            className="flex items-start justify-between gap-4 mb-3"
            style={{ minHeight: '116px' }}
          >
            <div style={{ minHeight: '116px' }}>
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}>{coupon.brand}</p>
              {!coupon.isBuiltIn && (
                <p style={{ fontSize: '11px', color: '#8A7460', marginBottom: '6px' }}>{publisherLabel}</p>
              )}
              <h3
                style={{
                  fontSize: isCompactTitle ? '17px' : '19px',
                  color: '#2E1A1A',
                  fontWeight: 600,
                  lineHeight: 1.25,
                  maxWidth: isCompactTitle ? '220px' : '240px',
                }}
              >
                {coupon.title}
              </h3>
            </div>
            <span
              style={{
                fontSize: '12px',
                color: '#FFFFFF',
                backgroundColor: coupon.accentColor,
                borderRadius: '9999px',
                padding: '6px 14px',
                fontWeight: 600,
                minWidth: '96px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {coupon.pointsCost} pts
            </span>
          </div>

          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.6, marginBottom: '12px' }}>
            {coupon.description}
          </p>

          <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '14px', minHeight: '36px' }}>
            {coupon.uploadedFileName
              ? `Imported art: ${coupon.uploadedFileName}`
              : coupon.isBuiltIn
                ? 'Built-in coupon art imported by default.'
                : 'Offer published locally for demo testing in this browser.'}
          </p>

          <input
            ref={(node) => {
              couponInputRefs.current[coupon.id] = node;
            }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handleCouponUpload(coupon, event.target.files?.[0] ?? null);
              event.currentTarget.value = '';
            }}
          />

          <div className="flex items-center gap-3 mt-auto flex-wrap">
            <button
              onClick={() => handleRewardRedeem(coupon)}
              disabled={isRedeeming || isDeleting || availablePoints < coupon.pointsCost}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  isRedeeming || isDeleting || availablePoints < coupon.pointsCost ? '#EDE7D6' : '#2E1A1A',
                color:
                  isRedeeming || isDeleting || availablePoints < coupon.pointsCost ? '#6B6B6B' : '#FFFFFF',
                border: 'none',
                cursor:
                  isRedeeming || isDeleting || availablePoints < coupon.pointsCost ? 'default' : 'pointer',
              }}
            >
              {isRedeeming ? 'Redeeming...' : `Redeem ${coupon.pointsCost} pts`}
            </button>

            <button
              onClick={() => {
                couponInputRefs.current[coupon.id]?.click();
              }}
              disabled={isUploading || isDeleting}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#2E1A1A',
                border: '1px solid #E5E2DA',
                cursor: isUploading || isDeleting ? 'default' : 'pointer',
                opacity: isUploading || isDeleting ? 0.7 : 1,
              }}
            >
              {isUploading ? 'Importing...' : 'Upload Coupon Art'}
            </button>

            {canDeleteOffer && (
              <button
                onClick={() => handleDeleteRewardOffer(coupon)}
                disabled={isDeleting || isUploading || isRedeeming}
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#A23B2A',
                  border: '1px solid rgba(162, 59, 42, 0.22)',
                  cursor: isDeleting || isUploading || isRedeeming ? 'default' : 'pointer',
                  opacity: isDeleting || isUploading || isRedeeming ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Offer'}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

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
                  {availablePoints}
                </span>
                <span style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '4px' }}>pts</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '10px' }}>
                {CHECKIN_POINTS_PER_EVENT} pts per event check-in • {DAILY_SIGNIN_POINTS} pts per daily sign-in
              </p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '10px' }}>
                Earned: {stats.totalPoints} pts • Redeemed: {redeemedPoints} pts
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
              <div className="flex items-start justify-between gap-6 mb-5">
                <div>
                  <h2 style={{ fontSize: '22px', color: '#2E1A1A', fontWeight: 600, marginBottom: '8px' }}>
                    Rewards Marketplace
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.6 }}>
                    Redeem 20 points for a $1 Starbucks coupon or a $1 Chick-fil-A coupon. Upload
                    your own coupon art at any time and the card preview updates instantly.
                  </p>
                </div>

                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: '#F9F7F2',
                    border: '1px solid #E5E2DA',
                    minWidth: '180px',
                  }}
                >
                  <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}>Available balance</p>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#2E1A1A' }}>{availablePoints} pts</p>
                </div>
              </div>

              <div
                className="rounded-xl p-5 mb-6"
                style={{
                  backgroundColor: '#F9F7F2',
                  border: '1px solid #E5E2DA',
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '6px' }}>Publish Reward Offer</p>
                    <h3 style={{ fontSize: '20px', color: '#2E1A1A', fontWeight: 600, marginBottom: '8px' }}>
                      Create your own points redemption coupon
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6 }}>
                      Example: publish an offer such as 20 pts for a free coffee, snack discount, or
                      event perk.
                    </p>
                  </div>

                  <button
                    onClick={handlePublishReward}
                    disabled={isPublishingReward}
                    className="px-5 py-3 rounded-full"
                    style={{
                      backgroundColor: isPublishingReward ? '#EDE7D6' : '#2E1A1A',
                      color: isPublishingReward ? '#6B6B6B' : '#FFFFFF',
                      border: 'none',
                      minWidth: '160px',
                      cursor: isPublishingReward ? 'default' : 'pointer',
                    }}
                  >
                    {isPublishingReward ? 'Publishing...' : 'Publish Offer'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px' }}>
                      Brand or merchant
                    </span>
                    <input
                      value={publishRewardForm.brand}
                      onChange={(event) =>
                        setPublishRewardForm((current) => ({ ...current, brand: event.target.value }))
                      }
                      placeholder="Starbucks, AMC, Campus Club..."
                      style={{
                        width: '100%',
                        borderRadius: '16px',
                        border: '1px solid #E5E2DA',
                        backgroundColor: '#FFFFFF',
                        padding: '14px 16px',
                        color: '#2E1A1A',
                      }}
                    />
                  </label>

                  <label className="block">
                    <span style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px' }}>
                      Reward title
                    </span>
                    <input
                      value={publishRewardForm.title}
                      onChange={(event) =>
                        setPublishRewardForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Free Latte Coupon"
                      style={{
                        width: '100%',
                        borderRadius: '16px',
                        border: '1px solid #E5E2DA',
                        backgroundColor: '#FFFFFF',
                        padding: '14px 16px',
                        color: '#2E1A1A',
                      }}
                    />
                  </label>

                  <label className="block">
                    <span style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px' }}>
                      Reward value label
                    </span>
                    <input
                      value={publishRewardForm.rewardValueLabel}
                      onChange={(event) =>
                        setPublishRewardForm((current) => ({
                          ...current,
                          rewardValueLabel: event.target.value,
                        }))
                      }
                      placeholder="$1 Coupon or Free Drink"
                      style={{
                        width: '100%',
                        borderRadius: '16px',
                        border: '1px solid #E5E2DA',
                        backgroundColor: '#FFFFFF',
                        padding: '14px 16px',
                        color: '#2E1A1A',
                      }}
                    />
                  </label>

                  <label className="block">
                    <span style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px' }}>
                      Points required
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={publishRewardForm.pointsCost}
                      onChange={(event) =>
                        setPublishRewardForm((current) => ({ ...current, pointsCost: event.target.value }))
                      }
                      placeholder="20"
                      style={{
                        width: '100%',
                        borderRadius: '16px',
                        border: '1px solid #E5E2DA',
                        backgroundColor: '#FFFFFF',
                        padding: '14px 16px',
                        color: '#2E1A1A',
                      }}
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px' }}>
                      Description
                    </span>
                    <textarea
                      value={publishRewardForm.description}
                      onChange={(event) =>
                        setPublishRewardForm((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="Describe what users get when they redeem this offer."
                      rows={4}
                      style={{
                        width: '100%',
                        borderRadius: '16px',
                        border: '1px solid #E5E2DA',
                        backgroundColor: '#FFFFFF',
                        padding: '14px 16px',
                        color: '#2E1A1A',
                        resize: 'vertical',
                      }}
                    />
                  </label>

                  <div className="md:col-span-2">
                    <input
                      ref={publishRewardArtInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        handlePublishRewardArtSelect(event.target.files?.[0] ?? null);
                        event.currentTarget.value = '';
                      }}
                    />

                    <div
                      className="rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E2DA',
                      }}
                    >
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{
                          width: '160px',
                          minWidth: '160px',
                          height: '96px',
                          backgroundColor: '#F3EFE6',
                        }}
                      >
                        {publishRewardArtPreview ? (
                          <img
                            src={publishRewardArtPreview}
                            alt="Reward cover art preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ fontSize: '12px', color: '#8A7460', textAlign: 'center', padding: '0 12px' }}
                          >
                            Optional custom cover art
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p style={{ fontSize: '14px', color: '#2E1A1A', fontWeight: 600, marginBottom: '6px' }}>
                          Cover art
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '10px', lineHeight: 1.6 }}>
                          Upload an image for your reward card, or publish now and update the card art later.
                        </p>
                        <p style={{ fontSize: '12px', color: '#8A7460' }}>
                          {publishRewardArtName ? `Selected: ${publishRewardArtName}` : 'No image selected yet.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => publishRewardArtInputRef.current?.click()}
                          className="px-4 py-2 rounded-full"
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#2E1A1A',
                            border: '1px solid #E5E2DA',
                          }}
                        >
                          Upload Art
                        </button>

                        {publishRewardArtPreview && (
                          <button
                            onClick={() => {
                              setPublishRewardArtPreview(null);
                              setPublishRewardArtName(null);
                            }}
                            className="px-4 py-2 rounded-full"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#6B6B6B',
                              border: '1px solid #E5E2DA',
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {publishedRewardCoupons.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 style={{ fontSize: '18px', color: '#2E1A1A', fontWeight: 600, marginBottom: '6px' }}>
                        Published Reward Offers
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6B6B6B' }}>
                        Community and self-published coupons available for points redemption.
                      </p>
                    </div>

                    <span style={{ fontSize: '12px', color: '#6B6B6B' }}>
                      {publishedRewardCoupons.length} live offer{publishedRewardCoupons.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publishedRewardCoupons.map(renderRewardCouponCard)}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 style={{ fontSize: '18px', color: '#2E1A1A', fontWeight: 600, marginBottom: '6px' }}>
                      Featured Rewards
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B6B6B' }}>
                      Built-in demo coupons ready for redemption and UI testing.
                    </p>
                  </div>

                  <span style={{ fontSize: '12px', color: '#6B6B6B' }}>
                    {featuredRewardCoupons.length} featured coupon{featuredRewardCoupons.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredRewardCoupons.map(renderRewardCouponCard)}
                </div>
              </div>

              {rewardNotice && (
                <p style={{ fontSize: '13px', color: '#2E1A1A', marginBottom: '16px' }}>{rewardNotice}</p>
              )}

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: '#F9F7F2',
                  border: '1px solid #E5E2DA',
                }}
              >
                <h3 style={{ fontSize: '16px', color: '#2E1A1A', fontWeight: 600, marginBottom: '10px' }}>
                  My Redeemed Coupons
                </h3>

                {rewardRedemptions.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#6B6B6B' }}>
                    No coupons redeemed yet. Use 20 points to unlock your first $1 reward.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rewardRedemptions.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-xl p-4 flex items-center justify-between gap-4"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E2DA',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '15px', color: '#2E1A1A', fontWeight: 600, marginBottom: '4px' }}>
                            {record.couponTitle}
                          </p>
                          <p style={{ fontSize: '12px', color: '#6B6B6B' }}>
                            Redeemed {new Date(record.redeemedAt).toLocaleString('en-US')}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}>Voucher code</p>
                          <p style={{ fontSize: '15px', color: '#2E1A1A', fontWeight: 700 }}>
                            {record.voucherCode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
