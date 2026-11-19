import { ChildProfile, GiftItem, HolidayMilestone } from '../types/holiday';

export const GENERATED_ASSETS = {
  heroIcePalace: '/assets/images/hero_ice_palace.jpg',
  avatars: {
    owl: '/assets/images/avatar_snow_owl.jpg',
    fox: '/assets/images/avatar_arctic_fox.jpg',
    stag: '/assets/images/avatar_winter_stag.jpg',
    penguin: '/assets/images/avatar_frost_penguin.jpg',
  },
};

export const AVATAR_METADATA: Record<
  'owl' | 'fox' | 'stag' | 'penguin',
  { label: string; title: string; image: string; accent: string }
> = {
  owl: {
    label: 'Snowy Owl',
    title: 'Keeper of Starlight Scrolls',
    image: GENERATED_ASSETS.avatars.owl,
    accent: 'from-sky-300/30 to-amber-200/20',
  },
  fox: {
    label: 'Arctic Fox',
    title: 'Aurora Trail Pathfinder',
    image: GENERATED_ASSETS.avatars.fox,
    accent: 'from-indigo-300/30 to-sky-300/20',
  },
  stag: {
    label: 'Silver Stag',
    title: 'Guardian of Lantern Pines',
    image: GENERATED_ASSETS.avatars.stag,
    accent: 'from-amber-300/30 to-slate-200/20',
  },
  penguin: {
    label: 'Royal Penguin',
    title: 'Prince of Crystal Glaciers',
    image: GENERATED_ASSETS.avatars.penguin,
    accent: 'from-purple-300/30 to-sky-200/20',
  },
};

export function getInitialMilestones(targetYear: number): HolidayMilestone[] {
  return [
    {
      id: 'ms-tree-lights',
      title: 'Tree & Winter Lights Evening',
      targetDate: `${targetYear}-11-29T17:00`,
      icon: 'tree',
      category: 'Step 01 · Home Tradition',
      completed: false,
      notes: '26 days before Christmas — Hang ornaments, warm lights, and finalize holiday plans.',
      order: 0,
    },
    {
      id: 'ms-shipping-cutoff',
      title: 'Holiday Shipping Cutoff',
      targetDate: `${targetYear}-12-14T20:00`,
      icon: 'shopping',
      category: 'Step 02 · Parcel Deadline',
      completed: false,
      notes: '11 days before Christmas — Final deadline for standard delivery before Christmas Eve.',
      order: 1,
    },
    {
      id: 'ms-wrapping-night',
      title: 'Wrapping & Ribbon Night',
      targetDate: `${targetYear}-12-21T20:00`,
      icon: 'gift',
      category: 'Step 03 · Finishing Touches',
      completed: false,
      notes: '4 days before Christmas — Wrap gifts, tie ribbons, and write holiday cards.',
      order: 2,
    },
    {
      id: 'ms-christmas-eve',
      title: 'Christmas Eve Hearth & Magic',
      targetDate: `${targetYear}-12-24T21:00`,
      icon: 'sleigh',
      category: 'Step 04 · Final Staging',
      completed: false,
      notes: '1 day before Christmas — Stage gifts under the tree and enjoy warm cocoa by the hearth.',
      order: 3,
    },
  ];
}

/**
 * Real family workspace starts completely clean and empty so private users
 * are greeted with a welcoming setup rather than fictional sample children or gifts.
 * Fictional sample records are strictly confined to Judge Demo Mode below.
 */
export const INITIAL_CHILDREN: ChildProfile[] = [];

export const INITIAL_GIFTS: GiftItem[] = [];

/**
 * Isolated Fictional Sandbox Dataset for Handshake Competition Judge Demo Mode.
 * Never overwrites or reads from the user's private local storage vault.
 */
export const DEMO_CHILDREN: ChildProfile[] = [
  {
    id: 'demo-aria',
    name: 'Aria (Demo)',
    nickname: 'Northern Starlight',
    avatarId: 'owl',
    budget: 500,
    ageOrRole: 'Fictional Demo Profile · Age 11',
    wishlistNotes: [
      'Aurora Borealis Planetarium Projector',
      'Hand-bound Winter Botanicals Press',
      'Silver Chime Music Box',
    ],
  },
  {
    id: 'demo-theo',
    name: 'Theo (Demo)',
    nickname: 'Glacier Engineer',
    avatarId: 'penguin',
    budget: 450,
    ageOrRole: 'Fictional Demo Profile · Age 9',
    wishlistNotes: [
      'Robotic Snowplow Coding Kit',
      'Wooden Alpine Cable Car Set',
      'Fleece Lined Explorer Boots',
    ],
  },
  {
    id: 'demo-elena',
    name: 'Elena (Demo)',
    nickname: 'Frost Cellist',
    avatarId: 'fox',
    budget: 450,
    ageOrRole: 'Fictional Demo Profile · Age 14',
    wishlistNotes: [
      'Pearl White Bluetooth Turntable',
      'Cashmere Winter Reading Blanket',
      'Botanical Wax Candle Making Kit',
    ],
  },
];

export const DEMO_GIFTS: GiftItem[] = [
  {
    id: 'demo-gift-1',
    childId: 'demo-aria',
    name: 'Aurora Borealis HD Starlight Projector',
    category: 'Tech & Electronics',
    storeOrLink: 'Planetarium Demo Co.',
    estimatedPrice: 145,
    actualSpent: 140,
    priority: 'High',
    purchaseDate: '2026-11-04',
    expectedDeliveryDate: '2026-11-12',
    notes: 'Fictional demo parcel — wrapped in silver foil.',
    status: 'READY FOR CHRISTMAS',
    isStockingStuffer: false,
  },
  {
    id: 'demo-gift-2',
    childId: 'demo-aria',
    name: 'Crystal Chime Winter Music Box',
    category: 'Keepsake & Magic',
    storeOrLink: 'Fictional Alpine Guild',
    estimatedPrice: 92,
    actualSpent: 0,
    priority: 'High',
    purchaseDate: '',
    expectedDeliveryDate: '2026-12-09',
    notes: 'Ready for live purchase demonstration in Step 4!',
    status: 'PLANNED',
    isStockingStuffer: false,
  },
  {
    id: 'demo-gift-3',
    childId: 'demo-theo',
    name: 'Programmable Arctic Rover STEM Kit',
    category: 'Books & Learning',
    storeOrLink: 'Robotics Workshop',
    estimatedPrice: 160,
    actualSpent: 155,
    priority: 'High',
    purchaseDate: '2026-11-08',
    expectedDeliveryDate: '2026-11-16',
    notes: 'Fictional demo parcel — batteries included.',
    status: 'WRAPPED',
    isStockingStuffer: false,
  },
  {
    id: 'demo-gift-4',
    childId: 'demo-elena',
    name: 'Pearl Silver Vinyl Turntable',
    category: 'Tech & Electronics',
    storeOrLink: 'Symphony Demo Audio',
    estimatedPrice: 195,
    actualSpent: 189,
    priority: 'High',
    purchaseDate: '2026-11-09',
    expectedDeliveryDate: '2026-11-18',
    notes: 'Fictional demo parcel — includes Tchaikovsky Nutcracker LP.',
    status: 'DELIVERED',
    isStockingStuffer: false,
  },
  {
    id: 'demo-gift-5',
    childId: 'household',
    name: 'Demo Family Gingerbread Chalet Kit',
    category: 'Family Shared',
    storeOrLink: 'Nordic Bakery Demo',
    estimatedPrice: 65,
    actualSpent: 65,
    priority: 'Medium',
    purchaseDate: '2026-11-10',
    expectedDeliveryDate: '2026-11-15',
    notes: 'Shared fictional household treat.',
    status: 'PURCHASED',
    isStockingStuffer: true,
  },
];
