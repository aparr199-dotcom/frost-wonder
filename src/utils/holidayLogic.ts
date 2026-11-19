import {
  ChildBudgetMetrics,
  ChildProfile,
  CountdownState,
  FamilyBudgetSummary,
  GIFT_STAGES,
  GiftItem,
  GiftStage,
  HolidayMilestone,
} from '../types/holiday';

export const CONFIRMED_SPEND_STAGES: GiftStage[] = [
  'PURCHASED',
  'SHIPPED',
  'DELIVERED',
  'WRAPPED',
  'READY FOR CHRISTMAS',
];

export const WRAPPED_OR_READY_STAGES: GiftStage[] = [
  'WRAPPED',
  'READY FOR CHRISTMAS',
];

export const FESTIVE_MESSAGES: string[] = [
  'Snowflakes are whispering across the northern peaks as the candlemakers light the Great Ice Hall.',
  'Every wrapped ribbon and thoughtful wish weaves a little more warmth into the winter solstice.',
  'In the quiet hush of December twilight, kindness shines brighter than champagne starlight.',
  'The sleigh bells of the Frost Kingdom are polished in silver, awaiting Christmas Eve’s first star.',
  'Hot cocoa steams by the hearth while crystalline frost paints delicate ferns across the windowpane.',
  'May your home be filled with wonder, laughter, and the quiet magic of a snowy Christmas morning.',
];

/**
 * Calculates the mathematically accurate countdown to December 25 in the user's local timezone.
 */
export function calculateChristmasCountdown(
  now: Date,
  options?: {
    targetYearOverride?: number | null;
    simulateChristmasMorning?: boolean;
  }
): CountdownState {
  const currentYear = now.getFullYear();
  const isActualChristmasDay =
    now.getMonth() === 11 && now.getDate() === 25;

  if (options?.simulateChristmasMorning) {
    const targetDate = new Date(currentYear, 11, 25, 0, 0, 0, 0);
    return {
      targetDate,
      targetYear: currentYear,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: 0,
      isChristmasMorning: true,
      magicIntensity: 5,
      magicStageLabel: 'Christmas Morning Enchantment',
      seasonProgressPercent: 100,
    };
  }

  let targetYear = currentYear;
  if (options?.targetYearOverride && options.targetYearOverride >= currentYear) {
    targetYear = options.targetYearOverride;
  } else {
    const endOfChristmasDay = new Date(currentYear, 11, 25, 23, 59, 59, 999);
    if (now.getTime() > endOfChristmasDay.getTime()) {
      targetYear = currentYear + 1;
    }
  }

  const targetDate = new Date(targetYear, 11, 25, 0, 0, 0, 0);

  // If today is Dec 25 and user hasn't explicitly advanced to next year's season
  if (isActualChristmasDay && targetYear === currentYear) {
    return {
      targetDate,
      targetYear,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: 0,
      isChristmasMorning: true,
      magicIntensity: 5,
      magicStageLabel: 'Christmas Morning Enchantment',
      seasonProgressPercent: 100,
    };
  }

  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let magicIntensity: 1 | 2 | 3 | 4 | 5 = 1;
  let magicStageLabel = 'Early Winter Whisper';

  if (days <= 3) {
    magicIntensity = 5;
    magicStageLabel = 'Solstice Aurora Peak';
  } else if (days <= 14) {
    magicIntensity = 4;
    magicStageLabel = 'Starlight Palace Glow';
  } else if (days <= 30) {
    magicIntensity = 3;
    magicStageLabel = 'Enchanted Advent Frost';
  } else if (days <= 60) {
    magicIntensity = 2;
    magicStageLabel = 'First Snowfall Shimmer';
  }

  // Season progress from October 1 to December 25 (85 days window, or 365 day fallback)
  const seasonStart = new Date(targetYear, 9, 1, 0, 0, 0, 0);
  const windowTotal = targetDate.getTime() - seasonStart.getTime();
  const elapsed = now.getTime() - seasonStart.getTime();
  const seasonProgressPercent = Math.min(
    99.5,
    Math.max(5, Number(((elapsed / windowTotal) * 100).toFixed(1)))
  );

  return {
    targetDate,
    targetYear,
    days,
    hours,
    minutes,
    seconds,
    totalMilliseconds: diffMs,
    isChristmasMorning: false,
    magicIntensity,
    magicStageLabel,
    seasonProgressPercent,
  };
}

/**
 * Calculates time remaining for a mini countdown milestone.
 */
export function calculateMilestoneTimeRemaining(
  targetDateStr: string,
  now: Date
): {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
  isPast: boolean;
  formattedLabel: string;
} {
  const parsed = new Date(targetDateStr);
  if (Number.isNaN(parsed.getTime())) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      totalMs: 0,
      isPast: false,
      formattedLabel: 'Date pending',
    };
  }

  const diffMs = parsed.getTime() - now.getTime();
  if (diffMs <= 0) {
    const daysAgo = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      totalMs: 0,
      isPast: true,
      formattedLabel: daysAgo === 0 ? 'Today!' : `${daysAgo}d ago`,
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  let formattedLabel = '';
  if (days > 0) {
    formattedLabel = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    formattedLabel = `${hours}h ${minutes}m left`;
  } else {
    formattedLabel = `${minutes}m left`;
  }

  return {
    days,
    hours,
    minutes,
    totalMs: diffMs,
    isPast: false,
    formattedLabel,
  };
}

/**
 * Reorders milestones up or down cleanly.
 */
export function reorderMilestones(
  milestones: HolidayMilestone[],
  id: string,
  direction: 'up' | 'down'
): HolidayMilestone[] {
  const sorted = [...milestones].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((m) => m.id === id);
  if (idx === -1) return sorted;

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return sorted;

  const temp = sorted[idx];
  sorted[idx] = sorted[swapIdx];
  sorted[swapIdx] = temp;

  return sorted.map((item, i) => ({
    ...item,
    order: i,
  }));
}

/**
 * Transitions a gift status forward or backward along the 7-stage pipeline.
 */
export function getAdjacentGiftStage(
  current: GiftStage,
  direction: 'next' | 'prev'
): GiftStage {
  const index = GIFT_STAGES.indexOf(current);
  if (index === -1) return 'WISH LIST';
  if (direction === 'next') {
    return GIFT_STAGES[Math.min(GIFT_STAGES.length - 1, index + 1)];
  }
  return GIFT_STAGES[Math.max(0, index - 1)];
}

/**
 * Determines whether a gift counts as confirmed spending vs estimated remaining spending.
 * Guarantees zero double-counting when status changes from PLANNED/WISH LIST to PURCHASED+.
 */
export function classifyGiftCost(gift: GiftItem): {
  isConfirmed: boolean;
  confirmedAmount: number;
  estimatedRemainingAmount: number;
} {
  const isConfirmed = CONFIRMED_SPEND_STAGES.includes(gift.status);
  if (isConfirmed) {
    const confirmedAmount =
      gift.actualSpent > 0 ? gift.actualSpent : gift.estimatedPrice;
    return {
      isConfirmed: true,
      confirmedAmount: Math.max(0, Number(confirmedAmount.toFixed(2))),
      estimatedRemainingAmount: 0,
    };
  }
  return {
    isConfirmed: false,
    confirmedAmount: 0,
    estimatedRemainingAmount: Math.max(0, Number(gift.estimatedPrice.toFixed(2))),
  };
}

/**
 * Calculates per-child gift and budget metrics.
 */
export function calculateChildGiftStats(
  child: ChildProfile,
  gifts: GiftItem[]
): ChildBudgetMetrics {
  const childGifts = gifts.filter((g) => g.childId === child.id);

  let confirmedSpent = 0;
  let estimatedRemaining = 0;
  let wishlistCount = 0;
  let plannedCount = 0;
  let purchasedOrBeyondCount = 0;
  let wrappedOrReadyCount = 0;
  let readyCount = 0;
  let stockingStufferCount = 0;

  for (const gift of childGifts) {
    const cost = classifyGiftCost(gift);
    confirmedSpent += cost.confirmedAmount;
    estimatedRemaining += cost.estimatedRemainingAmount;

    if (gift.status === 'WISH LIST') wishlistCount++;
    if (gift.status !== 'WISH LIST') plannedCount++;
    if (CONFIRMED_SPEND_STAGES.includes(gift.status)) purchasedOrBeyondCount++;
    if (WRAPPED_OR_READY_STAGES.includes(gift.status)) wrappedOrReadyCount++;
    if (gift.status === 'READY FOR CHRISTMAS') readyCount++;
    if (gift.isStockingStuffer) stockingStufferCount++;
  }

  confirmedSpent = Number(confirmedSpent.toFixed(2));
  estimatedRemaining = Number(estimatedRemaining.toFixed(2));
  const totalProjected = Number((confirmedSpent + estimatedRemaining).toFixed(2));
  const availableBudget = Number((child.budget - confirmedSpent).toFixed(2));
  const projectedRemainingBudget = Number(
    (child.budget - totalProjected).toFixed(2)
  );

  const safeBudget = child.budget > 0 ? child.budget : 1;
  const percentConfirmedUsed = Number(
    ((confirmedSpent / safeBudget) * 100).toFixed(1)
  );
  const percentProjectedUsed = Number(
    ((totalProjected / safeBudget) * 100).toFixed(1)
  );

  // Readiness percent based on stage progression across all gifts for this child
  let readinessPercent = 0;
  if (childGifts.length > 0) {
    const maxScorePerGift = GIFT_STAGES.length - 1; // 6
    const currentScore = childGifts.reduce(
      (acc, g) => acc + GIFT_STAGES.indexOf(g.status),
      0
    );
    readinessPercent = Math.round(
      (currentScore / (childGifts.length * maxScorePerGift)) * 100
    );
  }

  return {
    childId: child.id,
    childName: child.name,
    budget: child.budget,
    confirmedSpent,
    estimatedRemaining,
    totalProjected,
    availableBudget,
    projectedRemainingBudget,
    percentConfirmedUsed,
    percentProjectedUsed,
    isConfirmedOverBudget: confirmedSpent > child.budget,
    isProjectedOverBudget: totalProjected > child.budget,
    isNearLimit:
      totalProjected >= child.budget * 0.9 && totalProjected <= child.budget,
    totalGiftsCount: childGifts.length,
    wishlistCount,
    plannedCount,
    purchasedOrBeyondCount,
    wrappedOrReadyCount,
    readyCount,
    stockingStufferCount,
    readinessPercent,
  };
}

/**
 * Calculates the complete Family Christmas Budget Command Center summary.
 */
export function calculateFamilyBudgetSummary(
  children: ChildProfile[],
  gifts: GiftItem[],
  householdBudgetAllocation: number,
  totalFamilyBudgetOverride?: number | null
): FamilyBudgetSummary {
  const childMetrics = children.map((child) =>
    calculateChildGiftStats(child, gifts)
  );

  const allocatedChildrenBudget = children.reduce((acc, c) => acc + c.budget, 0);
  const computedTotalBudget =
    totalFamilyBudgetOverride && totalFamilyBudgetOverride > 0
      ? totalFamilyBudgetOverride
      : allocatedChildrenBudget + householdBudgetAllocation;

  const householdGifts = gifts.filter((g) => g.childId === 'household');
  let householdConfirmedSpent = 0;
  let householdEstimatedRemaining = 0;

  for (const hGift of householdGifts) {
    const cost = classifyGiftCost(hGift);
    householdConfirmedSpent += cost.confirmedAmount;
    householdEstimatedRemaining += cost.estimatedRemainingAmount;
  }

  householdConfirmedSpent = Number(householdConfirmedSpent.toFixed(2));
  householdEstimatedRemaining = Number(householdEstimatedRemaining.toFixed(2));

  const childrenConfirmedSpent = childMetrics.reduce(
    (acc, m) => acc + m.confirmedSpent,
    0
  );
  const childrenEstimatedRemaining = childMetrics.reduce(
    (acc, m) => acc + m.estimatedRemaining,
    0
  );

  const confirmedSpentTotal = Number(
    (childrenConfirmedSpent + householdConfirmedSpent).toFixed(2)
  );
  const estimatedRemainingTotal = Number(
    (childrenEstimatedRemaining + householdEstimatedRemaining).toFixed(2)
  );
  const totalProjectedSpend = Number(
    (confirmedSpentTotal + estimatedRemainingTotal).toFixed(2)
  );

  const availableBudget = Number(
    (computedTotalBudget - confirmedSpentTotal).toFixed(2)
  );
  const projectedAvailableBudget = Number(
    (computedTotalBudget - totalProjectedSpend).toFixed(2)
  );

  const safeTotalBudget = computedTotalBudget > 0 ? computedTotalBudget : 1;
  const percentConfirmedUsed = Number(
    ((confirmedSpentTotal / safeTotalBudget) * 100).toFixed(1)
  );
  const percentProjectedUsed = Number(
    ((totalProjectedSpend / safeTotalBudget) * 100).toFixed(1)
  );

  const totalPurchasedOrBeyondCount = gifts.filter((g) =>
    CONFIRMED_SPEND_STAGES.includes(g.status)
  ).length;
  const totalWrappedOrReadyCount = gifts.filter((g) =>
    WRAPPED_OR_READY_STAGES.includes(g.status)
  ).length;

  return {
    totalFamilyBudget: computedTotalBudget,
    householdBudgetAllocation,
    allocatedChildrenBudget,
    confirmedSpentTotal,
    estimatedRemainingTotal,
    totalProjectedSpend,
    availableBudget,
    projectedAvailableBudget,
    percentConfirmedUsed,
    percentProjectedUsed,
    isOverBudgetConfirmed: confirmedSpentTotal > computedTotalBudget,
    isOverBudgetProjected: totalProjectedSpend > computedTotalBudget,
    isNearBudgetWarning:
      totalProjectedSpend >= computedTotalBudget * 0.9 &&
      totalProjectedSpend <= computedTotalBudget,
    householdConfirmedSpent,
    householdEstimatedRemaining,
    householdGiftCount: householdGifts.length,
    totalGiftsCount: gifts.length,
    totalPurchasedOrBeyondCount,
    totalWrappedOrReadyCount,
    childMetrics,
  };
}

/**
 * Masks sensitive gift details when Secret Santa Mode is active.
 */
export function formatSecretSantaGift(
  gift: GiftItem,
  isSecretSantaActive: boolean
): {
  displayName: string;
  displayStore: string;
  displayNotes: string;
  displayPriceLabel: string;
} {
  if (!isSecretSantaActive) {
    const effectiveCost =
      CONFIRMED_SPEND_STAGES.includes(gift.status) && gift.actualSpent > 0
        ? gift.actualSpent
        : gift.estimatedPrice;
    return {
      displayName: gift.name,
      displayStore: gift.storeOrLink || 'North Pole Atelier',
      displayNotes: gift.notes || 'No workshop notes',
      displayPriceLabel: `$${effectiveCost.toFixed(2)}`,
    };
  }

  const codeSuffix = gift.id.slice(-4).toUpperCase();
  return {
    displayName: `Encrypted North Pole Parcel #${codeSuffix}`,
    displayStore: 'Classified Royal Vault',
    displayNotes: '••••••• Hidden by Secret Santa Cloak •••••••',
    displayPriceLabel: '$•••.••',
  };
}

const VALID_AVATARS = new Set(['owl', 'fox', 'stag', 'penguin']);
const VALID_PRIORITIES = new Set(['High', 'Medium', 'Low']);
const VALID_CATEGORIES = new Set([
  'Toys & Games',
  'Books & Learning',
  'Tech & Electronics',
  'Winter Apparel',
  'Creative & Arts',
  'Outdoor & Sports',
  'Keepsake & Magic',
  'Family Shared',
]);
const VALID_MILESTONE_ICONS = new Set([
  'turkey',
  'tree',
  'shopping',
  'cookie',
  'gift',
  'sleigh',
  'star',
  'snowflake',
  'bell',
]);

/**
 * Creates a portable, versioned JSON backup object of the user's private family vault.
 */
export function createVaultBackupPayload(params: {
  children: ChildProfile[];
  gifts: GiftItem[];
  milestones: HolidayMilestone[];
  householdBudget: number;
  targetYearOverride: number | null;
  exportedAt?: string;
}): {
  schemaVersion: 1;
  app: 'Frost & Wonder';
  exportedAt: string;
  children: ChildProfile[];
  gifts: GiftItem[];
  milestones: HolidayMilestone[];
  householdBudget: number;
  targetYearOverride: number | null;
} {
  return {
    schemaVersion: 1,
    app: 'Frost & Wonder',
    exportedAt: params.exportedAt || new Date().toISOString(),
    children: params.children,
    gifts: params.gifts,
    milestones: params.milestones,
    householdBudget: Math.max(0, Number(params.householdBudget) || 0),
    targetYearOverride: params.targetYearOverride,
  };
}

/**
 * Strictly validates and parses a restored JSON backup string before applying it to the private vault.
 */
export function validateAndParseVaultBackup(rawJson: string):
  | {
      valid: true;
      data: {
        children: ChildProfile[];
        gifts: GiftItem[];
        milestones: HolidayMilestone[];
        householdBudget: number;
        targetYearOverride: number | null;
      };
    }
  | { valid: false; error: string } {
  if (!rawJson || !rawJson.trim()) {
    return { valid: false, error: 'Backup file or input is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      valid: false,
      error: 'Invalid JSON format. Please select a valid Frost & Wonder .json backup file.',
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: 'Backup root must be a JSON object.' };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.schemaVersion !== 1 || obj.app !== 'Frost & Wonder') {
    return {
      valid: false,
      error: 'Unrecognized backup header: expected schemaVersion 1 for Frost & Wonder.',
    };
  }

  if (!Array.isArray(obj.children)) {
    return { valid: false, error: 'Backup is missing a valid children array.' };
  }
  if (!Array.isArray(obj.gifts)) {
    return { valid: false, error: 'Backup is missing a valid gifts array.' };
  }
  if (!Array.isArray(obj.milestones)) {
    return { valid: false, error: 'Backup is missing a valid milestones array.' };
  }
  if (
    typeof obj.householdBudget !== 'number' ||
    Number.isNaN(obj.householdBudget) ||
    obj.householdBudget < 0
  ) {
    return {
      valid: false,
      error: 'Backup contains an invalid or negative householdBudget.',
    };
  }

  const validatedChildren: ChildProfile[] = [];
  for (const c of obj.children) {
    if (!c || typeof c !== 'object') {
      return { valid: false, error: 'Invalid child profile entry in backup.' };
    }
    const item = c as Record<string, unknown>;
    if (typeof item.id !== 'string' || !item.id.trim()) {
      return { valid: false, error: 'Child profile is missing a valid id.' };
    }
    if (typeof item.name !== 'string' || !item.name.trim()) {
      return { valid: false, error: 'Child profile is missing a valid name.' };
    }
    if (
      typeof item.budget !== 'number' ||
      Number.isNaN(item.budget) ||
      item.budget < 0
    ) {
      return {
        valid: false,
        error: `Child profile "${item.name}" has an invalid budget.`,
      };
    }
    const avatarId =
      typeof item.avatarId === 'string' && VALID_AVATARS.has(item.avatarId)
        ? (item.avatarId as ChildProfile['avatarId'])
        : 'owl';
    const wishlistNotes = Array.isArray(item.wishlistNotes)
      ? item.wishlistNotes.filter((w): w is string => typeof w === 'string')
      : [];
    validatedChildren.push({
      id: item.id,
      name: item.name.trim(),
      nickname:
        typeof item.nickname === 'string' && item.nickname.trim()
          ? item.nickname.trim()
          : 'Winter Explorer',
      avatarId,
      budget: item.budget,
      wishlistNotes,
    });
  }

  const validatedGifts: GiftItem[] = [];
  for (const g of obj.gifts) {
    if (!g || typeof g !== 'object') {
      return { valid: false, error: 'Invalid gift item in backup.' };
    }
    const item = g as Record<string, unknown>;
    if (typeof item.id !== 'string' || !item.id.trim()) {
      return { valid: false, error: 'Gift entry is missing a valid id.' };
    }
    if (typeof item.name !== 'string' || !item.name.trim()) {
      return { valid: false, error: 'Gift entry is missing a valid name.' };
    }
    if (typeof item.childId !== 'string' || !item.childId.trim()) {
      return { valid: false, error: `Gift "${item.name}" is missing childId.` };
    }
    if (
      typeof item.status !== 'string' ||
      !GIFT_STAGES.includes(item.status as GiftStage)
    ) {
      return {
        valid: false,
        error: `Gift "${item.name}" has an unrecognized status "${String(
          item.status
        )}".`,
      };
    }
    if (
      typeof item.estimatedPrice !== 'number' ||
      Number.isNaN(item.estimatedPrice) ||
      item.estimatedPrice < 0 ||
      typeof item.actualSpent !== 'number' ||
      Number.isNaN(item.actualSpent) ||
      item.actualSpent < 0
    ) {
      return {
        valid: false,
        error: `Gift "${item.name}" has invalid price fields.`,
      };
    }

    validatedGifts.push({
      id: item.id,
      childId: item.childId,
      name: item.name.trim(),
      category:
        typeof item.category === 'string' && VALID_CATEGORIES.has(item.category)
          ? (item.category as GiftItem['category'])
          : 'Keepsake & Magic',
      storeOrLink:
        typeof item.storeOrLink === 'string' ? item.storeOrLink : '',
      estimatedPrice: item.estimatedPrice,
      actualSpent: item.actualSpent,
      priority:
        typeof item.priority === 'string' && VALID_PRIORITIES.has(item.priority)
          ? (item.priority as GiftItem['priority'])
          : 'Medium',
      purchaseDate:
        typeof item.purchaseDate === 'string' ? item.purchaseDate : '',
      expectedDeliveryDate:
        typeof item.expectedDeliveryDate === 'string'
          ? item.expectedDeliveryDate
          : '',
      notes: typeof item.notes === 'string' ? item.notes : '',
      status: item.status as GiftStage,
      isStockingStuffer: Boolean(item.isStockingStuffer),
      photoUrl:
        typeof item.photoUrl === 'string' && item.photoUrl.trim()
          ? item.photoUrl.trim()
          : undefined,
    });
  }

  const validatedMilestones: HolidayMilestone[] = [];
  for (let i = 0; i < obj.milestones.length; i++) {
    const m = obj.milestones[i];
    if (!m || typeof m !== 'object') {
      return { valid: false, error: 'Invalid milestone entry in backup.' };
    }
    const item = m as Record<string, unknown>;
    if (typeof item.id !== 'string' || typeof item.title !== 'string' || !item.title.trim()) {
      return { valid: false, error: 'Milestone is missing id or title.' };
    }
    if (typeof item.targetDate !== 'string' || Number.isNaN(new Date(item.targetDate).getTime())) {
      return {
        valid: false,
        error: `Milestone "${item.title}" has an invalid targetDate.`,
      };
    }
    validatedMilestones.push({
      id: item.id,
      title: item.title.trim(),
      targetDate: item.targetDate,
      icon:
        typeof item.icon === 'string' && VALID_MILESTONE_ICONS.has(item.icon)
          ? (item.icon as HolidayMilestone['icon'])
          : 'snowflake',
      category:
        typeof item.category === 'string' && item.category.trim()
          ? item.category.trim()
          : 'Family Tradition',
      completed: Boolean(item.completed),
      notes: typeof item.notes === 'string' ? item.notes : '',
      order: typeof item.order === 'number' ? item.order : i,
    });
  }

  const targetYearOverride =
    typeof obj.targetYearOverride === 'number' ? obj.targetYearOverride : null;

  return {
    valid: true,
    data: {
      children: validatedChildren,
      gifts: validatedGifts,
      milestones: validatedMilestones,
      householdBudget: obj.householdBudget,
      targetYearOverride,
    },
  };
}

/**
 * Accurate wallpaper resolution presets (Desktop 16:9 and Mobile 19.5:9, never mislabeling 2560x1440 as 4K).
 */
export const WALLPAPER_RESOLUTIONS = {
  qhd_2560x1440: {
    id: 'qhd_2560x1440' as const,
    width: 2560,
    height: 1440,
    shortLabel: '2560 × 1440 (Desktop QHD)',
    technicalLabel: 'Desktop 16:9 Mac & Windows Standard',
    aspectRatio: '16:9' as const,
  },
  uhd_3840x2160: {
    id: 'uhd_3840x2160' as const,
    width: 3840,
    height: 2160,
    shortLabel: '3840 × 2160 (Desktop True 4K)',
    technicalLabel: 'Desktop 16:9 Retina 4K Export',
    aspectRatio: '16:9' as const,
  },
  mobile_1290x2796: {
    id: 'mobile_1290x2796' as const,
    width: 1290,
    height: 2796,
    shortLabel: '1290 × 2796 (Mobile Portrait)',
    technicalLabel: 'Mobile 19.5:9 iPhone & Android Portrait',
    aspectRatio: '19.5:9' as const,
  },
};

export type MilestoneVisualState =
  | 'upcoming' // Soft icy-blue glow, illuminated border, Next Up badge
  | 'today' // Lavender-and-silver shimmer with Today badge
  | 'future' // Frosted glass styling without glow
  | 'past' // Dimmed, but remains visible
  | 'completed'; // User marked completed with checkmark

export interface MilestoneDisplayStatus {
  state: MilestoneVisualState;
  isGlow: boolean;
  badgeText?: string;
  formattedDate: string;
  tMinusText: string;
  shortTitle: string;
}

/**
 * Automatically computes the visual state for a milestone:
 * - Next upcoming milestone gets soft icy-blue glow and 'Next Up' badge
 * - Milestones reached today get lavender shimmer and 'Today' badge
 * - Completed milestones get checkmark styling
 * - Past milestones are slightly dimmed but visible
 * - Future milestones have elegant frosted-glass styling
 */
export function getMilestoneDisplayStatus(
  milestone: HolidayMilestone,
  now: Date,
  allSortedMilestones: HolidayMilestone[]
): MilestoneDisplayStatus {
  const parsedDate = new Date(milestone.targetDate);
  const isValidDate = !Number.isNaN(parsedDate.getTime());
  const formattedDate = isValidDate
    ? parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Dec 25';

  const tMinusText =
    milestone.tMinusLabel ||
    (isValidDate
      ? `T–${Math.max(
          0,
          Math.ceil((parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        )}`
      : 'T–0');

  const shortTitle = milestone.title
    .replace(/^Time to Decorate the\s+/i, '')
    .trim();

  // 1. Manually completed
  if (milestone.completed) {
    return {
      state: 'completed',
      isGlow: false,
      formattedDate,
      tMinusText,
      shortTitle,
    };
  }

  // Check if today matches calendar day
  const isSameCalendarDay =
    isValidDate &&
    parsedDate.getFullYear() === now.getFullYear() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getDate() === now.getDate();

  if (isSameCalendarDay) {
    return {
      state: 'today',
      isGlow: true,
      badgeText: 'Today',
      formattedDate,
      tMinusText,
      shortTitle,
    };
  }

  // Find next upcoming uncompleted milestone ID
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const nextUpcoming = allSortedMilestones.find((m) => {
    if (m.completed) return false;
    const mDate = new Date(m.targetDate);
    return !Number.isNaN(mDate.getTime()) && mDate.getTime() >= todayStart;
  });

  const isNextUpcoming = nextUpcoming ? nextUpcoming.id === milestone.id : false;

  if (isNextUpcoming) {
    return {
      state: 'upcoming',
      isGlow: true,
      badgeText: 'Next Up',
      formattedDate,
      tMinusText,
      shortTitle,
    };
  }

  // Check if past
  const isPast = isValidDate && parsedDate.getTime() < now.getTime();
  if (isPast) {
    return {
      state: 'past',
      isGlow: false,
      formattedDate,
      tMinusText,
      shortTitle,
    };
  }

  // Otherwise future
  return {
    state: 'future',
    isGlow: false,
    formattedDate,
    tMinusText,
    shortTitle,
  };
}


/**
 * Returns 4 to 5 concise Christmas preparation milestones sorted in strict chronological order
 * leading up to the December 25 deadline for the Mac Lock Screen Wallpaper.
 */
export function getChronologicalLockScreenMilestones(
  milestones: HolidayMilestone[],
  targetYear: number,
  maxCount = 4
): HolidayMilestone[] {
  const clampedMax = Math.max(3, Math.min(5, maxCount));
  const valid = [...milestones].filter(
    (m) => !Number.isNaN(new Date(m.targetDate).getTime())
  );

  // Sort strictly by chronological targetDate timestamp
  valid.sort(
    (a, b) =>
      new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  // Prefer key preparation milestones leading up to Dec 25 if there are more than 5
  if (valid.length <= clampedMax) {
    return valid;
  }

  // Pick evenly spaced / highest-value preparation checkpoints in chronological order
  const selected = valid.slice(0, clampedMax);
  // Ensure the final milestone before or on Christmas Eve/Morning is included
  const lastInList = valid[valid.length - 1];
  if (
    lastInList &&
    !selected.some((item) => item.id === lastInList.id)
  ) {
    selected[selected.length - 1] = lastInList;
  }

  return selected
    .map((m) => ({
      ...m,
      targetDate: m.targetDate.replace(/^\d{4}/, String(targetYear)),
    }))
    .sort(
      (a, b) =>
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    );
}

/**
 * Returns a realistic 6-stage backward-planned Christmas preparation roadmap working backward from Dec 25.
 */
export function getDefaultBackwardPlanPhases(targetYear: number) {
  return [
    {
      id: 'bp-1-budgeting',
      stageKey: 'budgeting' as const,
      phaseNumber: 1,
      title: 'Budgeting & Family Allocation',
      dateWindowLabel: `Nov 20 – Nov 26, ${targetYear}`,
      targetDate: `${targetYear}-11-26T16:00`,
      daysBeforeChristmas: 29,
      objective:
        'Set overall household and per-child gift caps before Black Friday and holiday sales begin.',
      actionChecklist: [
        'Lock per-child gift budgets and shared household reserve',
        'Review prior holiday spend and set a 10% buffer for wrapping & shipping',
        'Confirm family gathering potluck & travel allocations',
      ],
      linkedMilestoneTitle: 'Thanksgiving Family Gathering',
      icon: 'turkey' as const,
      category: 'Budget & Planning',
    },
    {
      id: 'bp-2-selection',
      stageKey: 'selection' as const,
      phaseNumber: 2,
      title: 'Gift Selection & Wishlist Lock',
      dateWindowLabel: `Nov 27 – Dec 4, ${targetYear}`,
      targetDate: `${targetYear}-11-29T17:00`,
      daysBeforeChristmas: 26,
      objective:
        'Convert raw family wishlists into vetted, prioritized gift entries with store links and price estimates.',
      actionChecklist: [
        'Finalize top 2–3 priority gifts and stocking stuffers per child',
        'Verify sizing, book editions, and retailer availability',
        'Activate Secret Santa Cloak Mode on shared family Macs',
      ],
      linkedMilestoneTitle: 'Time to Decorate the Christmas Tree',
      icon: 'tree' as const,
      category: 'Gift Selection',
    },
    {
      id: 'bp-3-purchasing',
      stageKey: 'purchasing' as const,
      phaseNumber: 3,
      title: 'Purchasing & Shipping Cutoff',
      dateWindowLabel: `Dec 5 – Dec 14, ${targetYear}`,
      targetDate: `${targetYear}-12-14T20:00`,
      daysBeforeChristmas: 11,
      objective:
        'Complete all online orders and retail purchases before standard ground-shipping cutoffs.',
      actionChecklist: [
        'Order all shipped parcels by Dec 14 to avoid expedited air fees',
        'Record actual receipt totals so confirmed vs. remaining budget updates live',
        'Log order tracking numbers and expected delivery dates',
      ],
      linkedMilestoneTitle: 'Holiday Shopping Deadline',
      icon: 'shopping' as const,
      category: 'Purchasing',
    },
    {
      id: 'bp-4-delivery',
      stageKey: 'delivery' as const,
      phaseNumber: 4,
      title: 'Delivery & Quality Verification',
      dateWindowLabel: `Dec 15 – Dec 19, ${targetYear}`,
      targetDate: `${targetYear}-12-19T14:00`,
      daysBeforeChristmas: 6,
      objective:
        'Inspect all delivered parcels, test batteries/accessories, and verify zero missing items.',
      actionChecklist: [
        'Advance arrived gifts to DELIVERED in the 7-stage pipeline',
        'Verify batteries, charging cables, and correct item variants',
        'Pick up local store replacements for any delayed shipments',
      ],
      linkedMilestoneTitle: 'Christmas Cookie Baking Day',
      icon: 'cookie' as const,
      category: 'Delivery Check',
    },
    {
      id: 'bp-5-wrapping',
      stageKey: 'wrapping' as const,
      phaseNumber: 5,
      title: 'Wrapping, Ribbons & Tagging',
      dateWindowLabel: `Dec 20 – Dec 22, ${targetYear}`,
      targetDate: `${targetYear}-12-22T20:00`,
      daysBeforeChristmas: 3,
      objective:
        'Wrap all delivered presents, label recipient tags, and organize stocking stuffers by child.',
      actionChecklist: [
        'Wrap under-tree parcels and advance status to WRAPPED',
        'Sort stocking stuffers into labeled hidden pouches',
        'Cross-check equal gift counts across children profiles',
      ],
      linkedMilestoneTitle: 'Wrapping Presents Evening',
      icon: 'gift' as const,
      category: 'Wrapping Prep',
    },
    {
      id: 'bp-6-final',
      stageKey: 'final_prep' as const,
      phaseNumber: 6,
      title: 'Final Christmas Eve Staging',
      dateWindowLabel: `Dec 23 – Dec 24, ${targetYear}`,
      targetDate: `${targetYear}-12-24T21:00`,
      daysBeforeChristmas: 1,
      objective:
        'Stage all wrapped gifts under the tree, fill stockings, and transition all parcels to READY FOR CHRISTMAS.',
      actionChecklist: [
        'Advance all wrapped gifts to READY FOR CHRISTMAS',
        'Set out Christmas Eve treats and charge cameras',
        'Launch Frost & Wonder Full-Screen Display Mode by the tree',
      ],
      linkedMilestoneTitle: "Santa's Arrival on Christmas Eve",
      icon: 'sleigh' as const,
      category: 'Final Preparation',
    },
  ];
}

/**
 * Synchronizes backward planning phases into the user's HolidayMilestone list without duplicating existing titles.
 */
export function syncBackwardPlanToMilestones(
  existingMilestones: HolidayMilestone[],
  targetYear: number
): HolidayMilestone[] {
  const phases = getDefaultBackwardPlanPhases(targetYear);
  const updated = [...existingMilestones];

  for (const phase of phases) {
    const matchIdx = updated.findIndex(
      (m) =>
        m.title.toLowerCase() === phase.linkedMilestoneTitle.toLowerCase() ||
        m.title.toLowerCase().includes(phase.title.toLowerCase())
    );
    const enrichedNotes = `Backward Plan Phase ${phase.phaseNumber} (${phase.dateWindowLabel}): ${phase.objective}`;
    if (matchIdx >= 0) {
      updated[matchIdx] = {
        ...updated[matchIdx],
        targetDate: phase.targetDate,
        notes: updated[matchIdx].notes || enrichedNotes,
      };
    } else {
      updated.push({
        id: `ms-bp-${phase.phaseNumber}`,
        title: phase.linkedMilestoneTitle,
        targetDate: phase.targetDate,
        icon: phase.icon,
        category: phase.category,
        completed: false,
        notes: enrichedNotes,
        order: updated.length,
      });
    }
  }

  return updated
    .sort(
      (a, b) =>
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    )
    .map((item, idx) => ({ ...item, order: idx }));
}

/**
 * Generates an RFC 5545 compliant .ics iCalendar file with VALARM reminders for macOS Calendar / Reminders.
 */
export function generateMilestoneIcsContent(
  milestones: HolidayMilestone[],
  leadTimeHours = 24
): string {
  const formatIcsDate = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
        date.getUTCDate()
      )}T` +
      `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
        date.getUTCSeconds()
      )}Z`
    );
  };

  const nowUtc = formatIcsDate(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Frost & Wonder//macOS Holiday Countdown & Gift Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Frost & Wonder Christmas Milestones',
  ];

  for (const ms of milestones) {
    const start = new Date(ms.targetDate);
    if (Number.isNaN(start.getTime())) continue;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const safeTitle = ms.title.replace(/[,;\\]/g, ' ');
    const safeDesc = (
      ms.notes || `Frost & Wonder Christmas Milestone (${ms.category})`
    )
      .replace(/\r?\n/g, ' ')
      .replace(/[,;\\]/g, ' ');

    lines.push(
      'BEGIN:VEVENT',
      `UID:frost-wonder-${ms.id}@frostandwonder.app`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:🎄 ${safeTitle}`,
      `DESCRIPTION:${safeDesc}`,
      `CATEGORIES:${ms.category}`,
      'BEGIN:VALARM',
      `TRIGGER:-PT${Math.max(1, leadTimeHours)}H`,
      'ACTION:DISPLAY',
      `DESCRIPTION:Frost & Wonder Reminder: ${safeTitle}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}


