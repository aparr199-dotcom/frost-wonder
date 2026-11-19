export type GiftStage =
  | 'WISH LIST'
  | 'PLANNED'
  | 'PURCHASED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'WRAPPED'
  | 'READY FOR CHRISTMAS';

export const GIFT_STAGES: GiftStage[] = [
  'WISH LIST',
  'PLANNED',
  'PURCHASED',
  'SHIPPED',
  'DELIVERED',
  'WRAPPED',
  'READY FOR CHRISTMAS',
];

export type GiftPriority = 'High' | 'Medium' | 'Low';

export type GiftCategory =
  | 'Toys & Games'
  | 'Books & Learning'
  | 'Tech & Electronics'
  | 'Winter Apparel'
  | 'Creative & Arts'
  | 'Outdoor & Sports'
  | 'Keepsake & Magic'
  | 'Family Shared';

export interface GiftItem {
  id: string;
  childId: string; // matches ChildProfile.id or 'household' for shared household gifts
  name: string;
  category: GiftCategory;
  storeOrLink: string;
  estimatedPrice: number;
  actualSpent: number;
  priority: GiftPriority;
  purchaseDate: string;
  expectedDeliveryDate: string;
  notes: string;
  status: GiftStage;
  isStockingStuffer: boolean;
  photoUrl?: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  nickname: string;
  avatarId: 'owl' | 'fox' | 'stag' | 'penguin';
  budget: number;
  wishlistNotes: string[];
  ageOrRole?: string;
}

export type MilestoneIconType =
  | 'turkey'
  | 'tree'
  | 'shopping'
  | 'cookie'
  | 'gift'
  | 'sleigh'
  | 'star'
  | 'snowflake'
  | 'bell';

export interface HolidayMilestone {
  id: string;
  title: string;
  targetDate: string; // ISO string or YYYY-MM-DDTHH:mm
  icon: MilestoneIconType;
  category: string;
  completed: boolean;
  notes?: string;
  order: number;
}

export interface CountdownState {
  targetDate: Date;
  targetYear: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMilliseconds: number;
  isChristmasMorning: boolean;
  magicIntensity: 1 | 2 | 3 | 4 | 5;
  magicStageLabel: string;
  seasonProgressPercent: number;
}

export interface ChildBudgetMetrics {
  childId: string;
  childName: string;
  budget: number;
  confirmedSpent: number;
  estimatedRemaining: number;
  totalProjected: number;
  availableBudget: number;
  projectedRemainingBudget: number;
  percentConfirmedUsed: number;
  percentProjectedUsed: number;
  isConfirmedOverBudget: boolean;
  isProjectedOverBudget: boolean;
  isNearLimit: boolean;
  totalGiftsCount: number;
  wishlistCount: number;
  plannedCount: number;
  purchasedOrBeyondCount: number;
  wrappedOrReadyCount: number;
  readyCount: number;
  stockingStufferCount: number;
  readinessPercent: number;
}

export interface FamilyBudgetSummary {
  totalFamilyBudget: number;
  householdBudgetAllocation: number;
  allocatedChildrenBudget: number;
  confirmedSpentTotal: number;
  estimatedRemainingTotal: number;
  totalProjectedSpend: number;
  availableBudget: number;
  projectedAvailableBudget: number;
  percentConfirmedUsed: number;
  percentProjectedUsed: number;
  isOverBudgetConfirmed: boolean;
  isOverBudgetProjected: boolean;
  isNearBudgetWarning: boolean;
  householdConfirmedSpent: number;
  householdEstimatedRemaining: number;
  householdGiftCount: number;
  totalGiftsCount: number;
  totalPurchasedOrBeyondCount: number;
  totalWrappedOrReadyCount: number;
  childMetrics: ChildBudgetMetrics[];
}

export interface VaultBackupPayload {
  schemaVersion: 1;
  app: 'Frost & Wonder';
  exportedAt: string;
  children: ChildProfile[];
  gifts: GiftItem[];
  milestones: HolidayMilestone[];
  householdBudget: number;
  targetYearOverride: number | null;
}

export type BackwardPlanStageKey =
  | 'budgeting'
  | 'selection'
  | 'purchasing'
  | 'delivery'
  | 'wrapping'
  | 'final_prep';

export interface BackwardPlanPhase {
  id: string;
  stageKey: BackwardPlanStageKey;
  phaseNumber: number;
  title: string;
  dateWindowLabel: string;
  targetDate: string; // YYYY-MM-DDTHH:mm
  daysBeforeChristmas: number;
  objective: string;
  actionChecklist: string[];
  linkedMilestoneTitle: string;
  icon: MilestoneIconType;
  category: string;
}

export interface MilestoneReminderRecord {
  milestoneId: string;
  milestoneTitle: string;
  targetDate: string;
  leadTimeHours: number;
  channel: 'ics_calendar' | 'browser_notification';
  verifiedAt: string;
}

export type WallpaperResolutionId = 'qhd_2560x1440' | 'uhd_3840x2160';

export interface WallpaperResolutionSpec {
  id: WallpaperResolutionId;
  width: number;
  height: number;
  shortLabel: string;
  technicalLabel: string;
  aspectRatio: '16:9';
}


