import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateChristmasCountdown,
  calculateMilestoneTimeRemaining,
  classifyGiftCost,
  calculateChildGiftStats,
  calculateFamilyBudgetSummary,
  getAdjacentGiftStage,
  reorderMilestones,
  formatSecretSantaGift,
  createVaultBackupPayload,
  validateAndParseVaultBackup,
  WALLPAPER_RESOLUTIONS,
  getChronologicalLockScreenMilestones,
  getDefaultBackwardPlanPhases,
  syncBackwardPlanToMilestones,
  generateMilestoneIcsContent,
} from './holidayLogic';
import { ChildProfile, GiftItem, HolidayMilestone } from '../types/holiday';

test('calculateChristmasCountdown computes accurate days, hours, minutes, seconds before Dec 25', () => {
  const sampleNow = new Date(2026, 10, 12, 6, 0, 0, 0); // Nov 12, 2026 06:00:00
  const result = calculateChristmasCountdown(sampleNow);
  assert.equal(result.targetYear, 2026);
  assert.equal(result.isChristmasMorning, false);
  assert.equal(result.days, 42);
  assert.equal(result.hours, 18);
  assert.equal(result.minutes, 0);
  assert.equal(result.seconds, 0);
  assert.equal(result.magicIntensity, 2);
});

test('calculateChristmasCountdown detects Christmas Morning on Dec 25 and supports advancing to next season', () => {
  const christmasMorning = new Date(2026, 11, 25, 8, 30, 0, 0);
  const morningState = calculateChristmasCountdown(christmasMorning);
  assert.equal(morningState.isChristmasMorning, true);
  assert.equal(morningState.days, 0);
  assert.equal(morningState.magicIntensity, 5);

  // Advancing to following Christmas season (2027) from Dec 25, 2026
  const nextSeasonState = calculateChristmasCountdown(christmasMorning, {
    targetYearOverride: 2027,
  });
  assert.equal(nextSeasonState.isChristmasMorning, false);
  assert.equal(nextSeasonState.targetYear, 2027);
  assert.ok(nextSeasonState.days >= 364);
});

test('classifyGiftCost prevents double-counting when status transitions from PLANNED to PURCHASED', () => {
  const plannedGift: GiftItem = {
    id: 'g-1',
    childId: 'c-1',
    name: 'Crystal Telescope',
    category: 'Toys & Games',
    storeOrLink: 'Astronomy Shop',
    estimatedPrice: 120,
    actualSpent: 0,
    priority: 'High',
    purchaseDate: '',
    expectedDeliveryDate: '2026-12-10',
    notes: 'Fragile lens',
    status: 'PLANNED',
    isStockingStuffer: false,
  };

  const beforePurchase = classifyGiftCost(plannedGift);
  assert.equal(beforePurchase.isConfirmed, false);
  assert.equal(beforePurchase.confirmedAmount, 0);
  assert.equal(beforePurchase.estimatedRemainingAmount, 120);

  const purchasedGift: GiftItem = {
    ...plannedGift,
    status: 'PURCHASED',
    actualSpent: 110,
  };
  const afterPurchase = classifyGiftCost(purchasedGift);
  assert.equal(afterPurchase.isConfirmed, true);
  assert.equal(afterPurchase.confirmedAmount, 110);
  assert.equal(afterPurchase.estimatedRemainingAmount, 0);
});

test('calculateFamilyBudgetSummary aggregates children and household budgets without double counting', () => {
  const children: ChildProfile[] = [
    {
      id: 'child-1',
      name: 'Clara',
      nickname: 'Starlight Explorer',
      avatarId: 'owl',
      budget: 300,
      wishlistNotes: ['Snow globe'],
    },
  ];

  const gifts: GiftItem[] = [
    {
      id: 'gift-1',
      childId: 'child-1',
      name: 'Wooden Nutcracker Set',
      category: 'Keepsake & Magic',
      storeOrLink: 'Alpine Crafts',
      estimatedPrice: 80,
      actualSpent: 75,
      priority: 'High',
      purchaseDate: '2026-11-05',
      expectedDeliveryDate: '2026-11-15',
      notes: '',
      status: 'WRAPPED',
      isStockingStuffer: false,
    },
    {
      id: 'gift-2',
      childId: 'child-1',
      name: 'Watercolor Sketchbook',
      category: 'Creative & Arts',
      storeOrLink: 'Art Supply',
      estimatedPrice: 45,
      actualSpent: 0,
      priority: 'Medium',
      purchaseDate: '',
      expectedDeliveryDate: '',
      notes: '',
      status: 'PLANNED',
      isStockingStuffer: true,
    },
    {
      id: 'gift-3',
      childId: 'household',
      name: 'Family Fondue Set',
      category: 'Family Shared',
      storeOrLink: 'Kitchen Haus',
      estimatedPrice: 100,
      actualSpent: 95,
      priority: 'Medium',
      purchaseDate: '2026-11-10',
      expectedDeliveryDate: '2026-11-18',
      notes: '',
      status: 'DELIVERED',
      isStockingStuffer: false,
    },
  ];

  const summary = calculateFamilyBudgetSummary(children, gifts, 150);
  assert.equal(summary.totalFamilyBudget, 450);
  assert.equal(summary.confirmedSpentTotal, 170); // 75 + 95
  assert.equal(summary.estimatedRemainingTotal, 45); // only the PLANNED gift
  assert.equal(summary.totalProjectedSpend, 215); // 170 + 45
  assert.equal(summary.availableBudget, 280); // 450 - 170
  assert.equal(summary.projectedAvailableBudget, 235); // 450 - 215
});

test('getAdjacentGiftStage steps through all 7 required stages and reorderMilestones swaps order', () => {
  assert.equal(getAdjacentGiftStage('WISH LIST', 'next'), 'PLANNED');
  assert.equal(getAdjacentGiftStage('PLANNED', 'next'), 'PURCHASED');
  assert.equal(getAdjacentGiftStage('WRAPPED', 'next'), 'READY FOR CHRISTMAS');
  assert.equal(getAdjacentGiftStage('READY FOR CHRISTMAS', 'prev'), 'WRAPPED');

  const ms: HolidayMilestone[] = [
    { id: 'm1', title: 'First', targetDate: '2026-11-26', icon: 'turkey', category: 'Feast', completed: false, order: 0 },
    { id: 'm2', title: 'Second', targetDate: '2026-12-01', icon: 'tree', category: 'Decor', completed: false, order: 1 },
  ];
  const reordered = reorderMilestones(ms, 'm2', 'up');
  assert.equal(reordered[0].id, 'm2');
  assert.equal(reordered[1].id, 'm1');
});

test('formatSecretSantaGift masks gift name, notes, and price when enabled', () => {
  const gift: GiftItem = {
    id: 'gift-9988',
    childId: 'child-1',
    name: 'Limited Edition Train Set',
    category: 'Toys & Games',
    storeOrLink: 'Toy Emporium',
    estimatedPrice: 150,
    actualSpent: 149,
    priority: 'High',
    purchaseDate: '2026-11-10',
    expectedDeliveryDate: '2026-11-20',
    notes: 'Hidden in top closet',
    status: 'PURCHASED',
    isStockingStuffer: false,
  };

  const masked = formatSecretSantaGift(gift, true);
  assert.ok(!masked.displayName.includes('Train Set'));
  assert.equal(masked.displayPriceLabel, '$•••.••');
  assert.ok(masked.displayNotes.includes('Hidden by Secret Santa'));

  const unmasked = formatSecretSantaGift(gift, false);
  assert.equal(unmasked.displayName, 'Limited Edition Train Set');
  assert.equal(unmasked.displayPriceLabel, '$149.00');
});

test('Handshake Judge Demo Sandbox isolates fictional family and updates budget without double-counting on purchase', () => {
  const demoChild: ChildProfile = {
    id: 'demo-aria',
    name: 'Aria (Demo)',
    nickname: 'Northern Starlight',
    avatarId: 'owl',
    budget: 500,
    wishlistNotes: ['Crystal Chime'],
  };

  const initialDemoGifts: GiftItem[] = [
    {
      id: 'demo-gift-1',
      childId: 'demo-aria',
      name: 'Aurora Projector',
      category: 'Tech & Electronics',
      storeOrLink: 'Planetarium',
      estimatedPrice: 145,
      actualSpent: 140,
      priority: 'High',
      purchaseDate: '2026-11-04',
      expectedDeliveryDate: '2026-11-12',
      notes: '',
      status: 'READY FOR CHRISTMAS',
      isStockingStuffer: false,
    },
    {
      id: 'demo-gift-2',
      childId: 'demo-aria',
      name: 'Crystal Chime Winter Music Box',
      category: 'Keepsake & Magic',
      storeOrLink: 'Alpine Guild',
      estimatedPrice: 92,
      actualSpent: 0,
      priority: 'High',
      purchaseDate: '',
      expectedDeliveryDate: '2026-12-09',
      notes: '',
      status: 'PLANNED',
      isStockingStuffer: false,
    },
  ];

  const before = calculateFamilyBudgetSummary([demoChild], initialDemoGifts, 150);
  assert.equal(before.confirmedSpentTotal, 140);
  assert.equal(before.estimatedRemainingTotal, 92);
  assert.equal(before.totalProjectedSpend, 232);

  // Simulate Demo Step 4 Purchase
  const afterGifts: GiftItem[] = initialDemoGifts.map((g) =>
    g.id === 'demo-gift-2' ? { ...g, status: 'PURCHASED', actualSpent: 92 } : g
  );
  const after = calculateFamilyBudgetSummary([demoChild], afterGifts, 150);
  assert.equal(after.confirmedSpentTotal, 232);
  assert.equal(after.estimatedRemainingTotal, 0);
  assert.equal(after.totalProjectedSpend, 232); // Zero double-counting!
});

test('calculateChristmasCountdown automatically rolls over after Dec 25 (Dec 26–31) and handles Jan 1 year boundary', () => {
  const dec26 = new Date(2026, 11, 26, 12, 0, 0, 0); // Dec 26, 2026 12:00:00
  const rolloverState = calculateChristmasCountdown(dec26);
  assert.equal(rolloverState.isChristmasMorning, false);
  assert.equal(rolloverState.targetYear, 2027);
  assert.equal(rolloverState.days, 363);
  assert.equal(rolloverState.hours, 12);

  const jan1 = new Date(2027, 0, 1, 0, 0, 0, 0); // Jan 1, 2027 00:00:00
  const newYearState = calculateChristmasCountdown(jan1);
  assert.equal(newYearState.isChristmasMorning, false);
  assert.equal(newYearState.targetYear, 2027);
  assert.equal(newYearState.days, 358);
});

test('createVaultBackupPayload and validateAndParseVaultBackup round-trip valid backups and reject invalid inputs', () => {
  const payload = createVaultBackupPayload({
    children: [
      {
        id: 'c-1',
        name: 'Emma',
        nickname: 'Snow Star',
        avatarId: 'owl',
        budget: 350,
        wishlistNotes: ['Telescope'],
      },
    ],
    gifts: [
      {
        id: 'g-1',
        childId: 'c-1',
        name: 'Telescope',
        category: 'Books & Learning',
        storeOrLink: 'Optics Co',
        estimatedPrice: 120,
        actualSpent: 115,
        priority: 'High',
        purchaseDate: '2026-11-15',
        expectedDeliveryDate: '2026-11-22',
        notes: 'In closet',
        status: 'PURCHASED',
        isStockingStuffer: false,
      },
    ],
    milestones: [
      {
        id: 'm-1',
        title: 'Tree Decorating',
        targetDate: '2026-11-29T17:00',
        icon: 'tree',
        category: 'Tradition',
        completed: false,
        order: 0,
      },
    ],
    householdBudget: 200,
    targetYearOverride: null,
  });

  const validResult = validateAndParseVaultBackup(JSON.stringify(payload));
  assert.equal(validResult.valid, true);
  if (validResult.valid) {
    assert.equal(validResult.data.children.length, 1);
    assert.equal(validResult.data.children[0].name, 'Emma');
    assert.equal(validResult.data.gifts.length, 1);
    assert.equal(validResult.data.householdBudget, 200);
  }

  // Reject malformed JSON
  const badJson = validateAndParseVaultBackup('{not-valid-json');
  assert.equal(badJson.valid, false);

  // Reject invalid schema header
  const wrongSchema = validateAndParseVaultBackup(
    JSON.stringify({ schemaVersion: 99, app: 'Other' })
  );
  assert.equal(wrongSchema.valid, false);

  // Reject invalid gift stage
  const invalidGiftStage = validateAndParseVaultBackup(
    JSON.stringify({
      ...payload,
      gifts: [{ ...payload.gifts[0], status: 'INVALID_STAGE' }],
    })
  );
  assert.equal(invalidGiftStage.valid, false);
});

test('getChronologicalLockScreenMilestones returns 4 to 5 strictly chronological milestones and WALLPAPER_RESOLUTIONS accurately distinguishes QHD vs 4K', () => {
  const unordered: HolidayMilestone[] = [
    {
      id: 'm-wrap',
      title: 'Wrapping Presents Evening',
      targetDate: '2026-12-22T20:00',
      icon: 'gift',
      category: 'Prep',
      completed: false,
      order: 3,
    },
    {
      id: 'm-thanks',
      title: 'Thanksgiving Family Gathering',
      targetDate: '2026-11-26T16:00',
      icon: 'turkey',
      category: 'Gathering',
      completed: true,
      order: 0,
    },
    {
      id: 'm-eve',
      title: "Santa's Arrival on Christmas Eve",
      targetDate: '2026-12-24T21:00',
      icon: 'sleigh',
      category: 'Eve',
      completed: false,
      order: 4,
    },
    {
      id: 'm-shop',
      title: 'Holiday Shopping Deadline',
      targetDate: '2026-12-14T20:00',
      icon: 'shopping',
      category: 'Shopping',
      completed: false,
      order: 2,
    },
    {
      id: 'm-tree',
      title: 'Time to Decorate the Christmas Tree',
      targetDate: '2026-11-29T17:00',
      icon: 'tree',
      category: 'Decor',
      completed: false,
      order: 1,
    },
    {
      id: 'm-cookie',
      title: 'Christmas Cookie Baking Day',
      targetDate: '2026-12-19T14:00',
      icon: 'cookie',
      category: 'Baking',
      completed: false,
      order: 5,
    },
  ];

  const lockScreenMilestones = getChronologicalLockScreenMilestones(
    unordered,
    2026,
    5
  );
  assert.equal(lockScreenMilestones.length, 5);
  for (let i = 1; i < lockScreenMilestones.length; i++) {
    const prevTime = new Date(lockScreenMilestones[i - 1].targetDate).getTime();
    const currTime = new Date(lockScreenMilestones[i].targetDate).getTime();
    assert.ok(
      prevTime <= currTime,
      `Expected ${lockScreenMilestones[i - 1].targetDate} <= ${lockScreenMilestones[i].targetDate}`
    );
  }

  // Verify 2560x1440 is never mislabeled as 4K
  assert.equal(WALLPAPER_RESOLUTIONS.qhd_2560x1440.width, 2560);
  assert.equal(WALLPAPER_RESOLUTIONS.qhd_2560x1440.height, 1440);
  assert.ok(!WALLPAPER_RESOLUTIONS.qhd_2560x1440.shortLabel.includes('4K'));
  assert.ok(WALLPAPER_RESOLUTIONS.qhd_2560x1440.shortLabel.includes('QHD'));
  assert.equal(WALLPAPER_RESOLUTIONS.uhd_3840x2160.width, 3840);
  assert.equal(WALLPAPER_RESOLUTIONS.uhd_3840x2160.height, 2160);
  assert.ok(WALLPAPER_RESOLUTIONS.uhd_3840x2160.shortLabel.includes('4K'));
});

test('getDefaultBackwardPlanPhases covers all 6 preparation stages and syncBackwardPlanToMilestones links them chronologically', () => {
  const phases = getDefaultBackwardPlanPhases(2026);
  assert.equal(phases.length, 6);
  assert.deepEqual(
    phases.map((p) => p.stageKey),
    ['budgeting', 'selection', 'purchasing', 'delivery', 'wrapping', 'final_prep']
  );

  const synced = syncBackwardPlanToMilestones([], 2026);
  assert.equal(synced.length, 6);
  for (let i = 1; i < synced.length; i++) {
    assert.ok(
      new Date(synced[i - 1].targetDate).getTime() <=
        new Date(synced[i].targetDate).getTime()
    );
  }
});

test('generateMilestoneIcsContent produces valid RFC 5545 VCALENDAR with VALARM reminder trigger', () => {
  const sampleMilestone: HolidayMilestone = {
    id: 'ms-test-1',
    title: 'Holiday Shopping Deadline',
    targetDate: '2026-12-14T20:00',
    icon: 'shopping',
    category: 'Purchasing',
    completed: false,
    notes: 'Complete all shipped orders before cutoff.',
    order: 0,
  };

  const ics = generateMilestoneIcsContent([sampleMilestone], 24);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('SUMMARY:🎄 Holiday Shopping Deadline'));
  assert.ok(ics.includes('BEGIN:VALARM'));
  assert.ok(ics.includes('TRIGGER:-PT24H'));
  assert.ok(ics.includes('END:VCALENDAR'));
});



