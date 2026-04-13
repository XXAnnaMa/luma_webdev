export interface RewardCouponDefinition {
  id: string;
  brand: string;
  title: string;
  description: string;
  pointsCost: number;
  rewardValueLabel: string;
  accentColor: string;
  backgroundColor: string;
  defaultImage: string;
  uploadedImage?: string;
  uploadedFileName?: string;
  createdByUserId?: number;
  createdByName?: string;
  isBuiltIn: boolean;
  publishedAt?: string;
}

export interface RewardRedemptionRecord {
  id: string;
  userId: number;
  couponId: string;
  couponTitle: string;
  brand: string;
  rewardValueLabel: string;
  pointsSpent: number;
  voucherCode: string;
  redeemedAt: string;
}

interface StoredCouponAsset {
  imageDataUrl: string;
  fileName: string;
  uploadedAt: string;
}

interface StoredCouponAssetState {
  [couponId: string]: StoredCouponAsset;
}

interface StoredRewardRedemptionState {
  [userId: string]: RewardRedemptionRecord[];
}

const COUPON_ASSET_STORAGE_KEY = 'luma_reward_coupon_assets_v1';
const REWARD_REDEMPTION_STORAGE_KEY = 'luma_reward_redemptions_v1';
const CUSTOM_REWARD_COUPON_STORAGE_KEY = 'luma_custom_reward_coupons_v1';
export const REWARD_COUPON_POINTS_COST = 20;

type RewardColorway = {
  accentColor: string;
  backgroundColor: string;
  textColor: string;
};

function escapeSvgText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createCouponSvg(params: {
  brand: string;
  heroText: string;
  headline: string;
  pointsCost: number;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" fill="none">
      <rect width="1200" height="760" rx="48" fill="${params.backgroundColor}"/>
      <circle cx="1038" cy="148" r="126" fill="${params.accentColor}" fill-opacity="0.18"/>
      <circle cx="180" cy="620" r="150" fill="${params.accentColor}" fill-opacity="0.12"/>
      <rect x="70" y="82" width="190" height="56" rx="28" fill="${params.accentColor}"/>
      <text x="165" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#FFFFFF">${escapeSvgText(params.brand)}</text>
      <text x="70" y="258" font-family="Arial, sans-serif" font-size="88" font-weight="700" fill="${params.textColor}">${escapeSvgText(params.heroText)}</text>
      <text x="70" y="334" font-family="Arial, sans-serif" font-size="34" font-weight="600" fill="${params.textColor}">${escapeSvgText(params.headline)}</text>
      <text x="70" y="394" font-family="Arial, sans-serif" font-size="28" fill="${params.textColor}" fill-opacity="0.72">Redeem for ${params.pointsCost} points inside the LUMA profile rewards area.</text>
      <rect x="70" y="476" width="430" height="140" rx="28" fill="#FFFFFF" fill-opacity="0.88"/>
      <text x="110" y="536" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${params.textColor}">Instant digital voucher</text>
      <text x="110" y="584" font-family="Arial, sans-serif" font-size="24" fill="${params.textColor}" fill-opacity="0.72">Upload your preferred coupon art or use this built-in card.</text>
      <rect x="840" y="470" width="248" height="148" rx="30" fill="${params.accentColor}"/>
      <text x="964" y="552" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#FFFFFF">${params.pointsCost} pts</text>
    </svg>
  `.trim();
}

const REWARD_COLORWAYS: RewardColorway[] = [
  { accentColor: '#0F7A5A', backgroundColor: '#E7F4EE', textColor: '#12352A' },
  { accentColor: '#D3193C', backgroundColor: '#FFF0F3', textColor: '#4A1824' },
  { accentColor: '#1266B3', backgroundColor: '#EBF5FF', textColor: '#163A5A' },
  { accentColor: '#A2591C', backgroundColor: '#FFF2E8', textColor: '#56351B' },
  { accentColor: '#6650D3', backgroundColor: '#F2EEFF', textColor: '#31255D' },
];

function hashValue(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getRewardColorway(seed: string): RewardColorway {
  return REWARD_COLORWAYS[hashValue(seed) % REWARD_COLORWAYS.length];
}

function buildRewardPreviewImage(params: {
  brand: string;
  title: string;
  rewardValueLabel: string;
  pointsCost: number;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}): string {
  const heroText =
    params.rewardValueLabel.trim().length > 16 ? `${params.pointsCost} pts reward` : params.rewardValueLabel;
  const headline =
    params.title.trim().length > 28 ? `${params.title.trim().slice(0, 28)}...` : params.title.trim();

  return svgToDataUrl(
    createCouponSvg({
      brand: params.brand,
      heroText,
      headline,
      pointsCost: params.pointsCost,
      accentColor: params.accentColor,
      backgroundColor: params.backgroundColor,
      textColor: params.textColor,
    })
  );
}

const DEFAULT_COUPONS: RewardCouponDefinition[] = [
  {
    id: 'starbucks_1usd',
    brand: 'Starbucks',
    title: '$1 Starbucks Coupon',
    description: 'Redeem 20 points for a $1 Starbucks reward voucher.',
    pointsCost: REWARD_COUPON_POINTS_COST,
    rewardValueLabel: '$1 Coupon',
    accentColor: '#0F7A5A',
    backgroundColor: '#E7F4EE',
    defaultImage: buildRewardPreviewImage({
      brand: 'Starbucks',
      title: 'Coffee break reward',
      rewardValueLabel: '$1 Coupon',
      pointsCost: REWARD_COUPON_POINTS_COST,
      accentColor: '#0F7A5A',
      backgroundColor: '#E7F4EE',
      textColor: '#12352A',
    }),
    isBuiltIn: true,
  },
  {
    id: 'chickfila_1usd',
    brand: 'Chick-fil-A',
    title: '$1 Chick-fil-A Coupon',
    description: 'Redeem 20 points for a $1 Chick-fil-A reward voucher.',
    pointsCost: REWARD_COUPON_POINTS_COST,
    rewardValueLabel: '$1 Coupon',
    accentColor: '#D3193C',
    backgroundColor: '#FFF0F3',
    defaultImage: buildRewardPreviewImage({
      brand: 'Chick-fil-A',
      title: 'Quick bite reward',
      rewardValueLabel: '$1 Coupon',
      pointsCost: REWARD_COUPON_POINTS_COST,
      accentColor: '#D3193C',
      backgroundColor: '#FFF0F3',
      textColor: '#4A1824',
    }),
    isBuiltIn: true,
  },
];

function readCouponAssetState(): StoredCouponAssetState {
  try {
    const raw = localStorage.getItem(COUPON_ASSET_STORAGE_KEY);
    if (!raw) return {};
    return (JSON.parse(raw) as StoredCouponAssetState) ?? {};
  } catch {
    return {};
  }
}

function writeCouponAssetState(state: StoredCouponAssetState) {
  localStorage.setItem(COUPON_ASSET_STORAGE_KEY, JSON.stringify(state));
}

function readRewardRedemptionState(): StoredRewardRedemptionState {
  try {
    const raw = localStorage.getItem(REWARD_REDEMPTION_STORAGE_KEY);
    if (!raw) return {};
    return (JSON.parse(raw) as StoredRewardRedemptionState) ?? {};
  } catch {
    return {};
  }
}

function writeRewardRedemptionState(state: StoredRewardRedemptionState) {
  localStorage.setItem(REWARD_REDEMPTION_STORAGE_KEY, JSON.stringify(state));
}

function readCustomRewardCoupons(): RewardCouponDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_REWARD_COUPON_STORAGE_KEY);
    if (!raw) return [];
    const coupons = (JSON.parse(raw) as RewardCouponDefinition[]) ?? [];
    return coupons.filter((coupon) => !coupon.isBuiltIn);
  } catch {
    return [];
  }
}

function writeCustomRewardCoupons(coupons: RewardCouponDefinition[]) {
  localStorage.setItem(CUSTOM_REWARD_COUPON_STORAGE_KEY, JSON.stringify(coupons));
}

function createCouponId(brand: string): string {
  const slug = brand
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18);
  return `reward_${slug || 'offer'}_${Date.now()}`;
}

function createVoucherCode(coupon: Pick<RewardCouponDefinition, 'brand'>): string {
  const prefix = coupon.brand.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

export function getRewardCouponCatalog(): RewardCouponDefinition[] {
  const assetState = readCouponAssetState();
  const customCoupons = readCustomRewardCoupons().sort((a, b) =>
    (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
  );
  const catalog = [...customCoupons, ...DEFAULT_COUPONS];

  return catalog.map((coupon) => {
    const uploaded = assetState[coupon.id];
    return {
      ...coupon,
      uploadedImage: uploaded?.imageDataUrl,
      uploadedFileName: uploaded?.fileName,
    };
  });
}

export function saveRewardCouponAsset(couponId: string, imageDataUrl: string, fileName: string) {
  const state = readCouponAssetState();
  state[couponId] = {
    imageDataUrl,
    fileName,
    uploadedAt: new Date().toISOString(),
  };
  writeCouponAssetState(state);
}

export function removeRewardCouponAsset(couponId: string) {
  const state = readCouponAssetState();
  if (!(couponId in state)) return;
  delete state[couponId];
  writeCouponAssetState(state);
}

export function publishRewardCoupon(params: {
  userId: number;
  creatorName: string;
  brand: string;
  title: string;
  description: string;
  rewardValueLabel: string;
  pointsCost: number;
  uploadedImageDataUrl?: string;
  uploadedFileName?: string;
}): RewardCouponDefinition {
  const brand = params.brand.trim();
  const title = params.title.trim();
  const description = params.description.trim();
  const rewardValueLabel = params.rewardValueLabel.trim();
  const creatorName = params.creatorName.trim() || 'LUMA Member';
  const pointsCost = Math.max(1, Math.round(params.pointsCost));

  if (!brand) throw new Error('Brand or merchant is required.');
  if (!title) throw new Error('Reward title is required.');
  if (!description) throw new Error('Description is required.');
  if (!rewardValueLabel) throw new Error('Reward value label is required.');

  const colorway = getRewardColorway(`${brand}:${title}:${creatorName}`);
  const coupon: RewardCouponDefinition = {
    id: createCouponId(brand),
    brand,
    title,
    description,
    pointsCost,
    rewardValueLabel,
    accentColor: colorway.accentColor,
    backgroundColor: colorway.backgroundColor,
    defaultImage: buildRewardPreviewImage({
      brand,
      title,
      rewardValueLabel,
      pointsCost,
      accentColor: colorway.accentColor,
      backgroundColor: colorway.backgroundColor,
      textColor: colorway.textColor,
    }),
    createdByUserId: params.userId,
    createdByName: creatorName,
    isBuiltIn: false,
    publishedAt: new Date().toISOString(),
  };

  const coupons = readCustomRewardCoupons();
  writeCustomRewardCoupons([coupon, ...coupons]);

  if (params.uploadedImageDataUrl && params.uploadedFileName) {
    saveRewardCouponAsset(coupon.id, params.uploadedImageDataUrl, params.uploadedFileName);
  }

  const createdCoupon = getRewardCouponCatalog().find((item) => item.id === coupon.id);
  return createdCoupon ?? coupon;
}

export function deleteRewardCoupon(params: { couponId: string; userId: number }) {
  const coupons = readCustomRewardCoupons();
  const couponToDelete = coupons.find((coupon) => coupon.id === params.couponId);

  if (!couponToDelete) {
    throw new Error('Reward offer not found.');
  }

  if (couponToDelete.createdByUserId !== params.userId) {
    throw new Error('You can only delete reward offers that you published.');
  }

  writeCustomRewardCoupons(coupons.filter((coupon) => coupon.id !== params.couponId));
  removeRewardCouponAsset(params.couponId);
}

export function getUserRewardRedemptions(userId: number): RewardRedemptionRecord[] {
  const state = readRewardRedemptionState();
  const records = state[String(userId)] ?? [];
  return [...records].sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt));
}

export function getUserRedeemedPoints(userId: number): number {
  return getUserRewardRedemptions(userId).reduce((sum, record) => sum + record.pointsSpent, 0);
}

export function redeemRewardCoupon(params: {
  userId: number;
  couponId: string;
  availablePoints: number;
}): RewardRedemptionRecord {
  const coupon = getRewardCouponCatalog().find((item) => item.id === params.couponId);
  if (!coupon) {
    throw new Error('Reward coupon not found.');
  }

  if (params.availablePoints < coupon.pointsCost) {
    throw new Error(`You need ${coupon.pointsCost} pts to redeem this coupon.`);
  }

  const state = readRewardRedemptionState();
  const userKey = String(params.userId);
  const nextRecord: RewardRedemptionRecord = {
    id: `${coupon.id}:${Date.now()}`,
    userId: params.userId,
    couponId: coupon.id,
    couponTitle: coupon.title,
    brand: coupon.brand,
    rewardValueLabel: coupon.rewardValueLabel,
    pointsSpent: coupon.pointsCost,
    voucherCode: createVoucherCode(coupon),
    redeemedAt: new Date().toISOString(),
  };

  state[userKey] = [nextRecord, ...(state[userKey] ?? [])];
  writeRewardRedemptionState(state);
  return nextRecord;
}
