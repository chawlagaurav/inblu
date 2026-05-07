// ============================================================
// SEO CONFIGURATION & KEYWORDS FOR INBLU FILTERS
// ============================================================

export const SEO_CONFIG = {
  siteName: 'Inblu Filters',
  siteUrl: 'https://inblu.com.au',
  defaultTitle: 'Inblu Filters | Premium Water Filtration Systems Australia',
  defaultDescription: 'Australia\'s leading water filtration specialists. Shop RO water purifiers, countertop filters, undersink systems & water ionisers. Free installation & shipping Australia-wide.',
  businessInfo: {
    name: 'Inblu Filters',
    legalName: 'Inblu Filters Pty Ltd',
    phone: '+61 431 318 665',
    email: 'info@inblu.com.au',
    address: {
      street: '22 Wentworth Street',
      city: 'The Ponds',
      state: 'NSW',
      postalCode: '2769',
      country: 'Australia',
    },
    geo: {
      latitude: -33.7010,
      longitude: 150.9074,
    },
    openingHours: [
      { days: 'Monday-Friday', hours: '09:00-18:00' },
      { days: 'Saturday', hours: '10:00-16:00' },
    ],
    socialMedia: {
      facebook: 'https://facebook.com/inblufilters',
      instagram: 'https://instagram.com/inblufilters',
    },
  },
}

// ============================================================
// PRIMARY KEYWORDS (High-Intent, Transactional)
// ============================================================
export const PRIMARY_KEYWORDS = [
  'RO water filter Australia',
  'reverse osmosis filter Australia',
  'water purifier Australia',
  'best water filter Australia',
  'buy water filter Australia',
  'home water filtration system Australia',
]

// ============================================================
// SECONDARY KEYWORDS (Category-Specific)
// ============================================================
export const SECONDARY_KEYWORDS = {
  countertop: [
    'countertop water filter Australia',
    'benchtop water filter',
    'countertop RO system',
    'portable water filter Australia',
    'no installation water filter',
  ],
  undersink: [
    'undersink water filter Australia',
    'under sink RO system',
    'undersink reverse osmosis',
    'kitchen water filter installation',
    'under counter water purifier',
  ],
  ro: [
    'RO purifier Australia',
    'reverse osmosis system Australia',
    'tankless RO filter',
    'best RO water purifier',
    'RO water filter price Australia',
  ],
  ioniser: [
    'water ioniser Australia',
    'alkaline water filter',
    'hydrogen water maker',
    'ionised water system',
  ],
}

// ============================================================
// LONG-TAIL KEYWORDS (Buyer Intent + Informational)
// ============================================================
export const LONGTAIL_KEYWORDS = [
  'best RO water filter for home Australia 2026',
  'buy reverse osmosis filter online Australia',
  'water filter free installation Sydney',
  'undersink water filter Sydney Melbourne',
  'countertop RO filter no installation',
  'remove fluoride from tap water Australia',
  'best water purifier for Australian tap water',
  'water filter for hard water Australia',
  'affordable home water filtration system',
  'water filter delivery Australia wide',
]

// ============================================================
// LOCAL SEO KEYWORDS (Australian Cities)
// ============================================================
export const LOCAL_KEYWORDS = [
  'water filter Sydney',
  'water filter Melbourne',
  'water filter Brisbane',
  'water filter Perth',
  'water filter Adelaide',
  'water filter Gold Coast',
  'water filter Canberra',
  'RO filter installation NSW',
]

// ============================================================
// PAGE-SPECIFIC SEO METADATA
// ============================================================
export const PAGE_SEO = {
  home: {
    title: 'Water Filters Australia | RO Purifiers & Filtration Systems | Inblu',
    description: 'Shop premium RO water purifiers, countertop filters & undersink systems. Free installation Australia-wide. Pure, clean drinking water for your home. Shop now!',
    keywords: PRIMARY_KEYWORDS.slice(0, 5),
    h1: 'Premium Water Filtration Systems for Australian Homes',
  },
  products: {
    title: 'Water Filters & Purifiers | Shop RO Systems | Inblu Australia',
    description: 'Browse our range of RO water purifiers, countertop filters, undersink systems & water ionisers. Free shipping & installation. Best prices in Australia.',
    keywords: [...PRIMARY_KEYWORDS, ...SECONDARY_KEYWORDS.ro],
    h1: 'Water Filters & Purification Systems',
  },
  about: {
    title: 'About Us | Australia\'s Trusted Water Filter Experts | Inblu',
    description: 'Learn about Inblu Filters - Australia\'s premium water filtration specialists. 5K+ installations, certified quality, and expert support nationwide.',
    keywords: ['water filter company Australia', 'water purification experts', 'trusted water filter brand'],
    h1: 'About Inblu Filters',
  },
  contact: {
    title: 'Contact Us | Get Expert Water Filter Advice | Inblu Australia',
    description: 'Contact Inblu Filters for expert water filtration advice. Call +61 431 318 665 or visit us at The Ponds, NSW. Free consultation available.',
    keywords: ['water filter consultation Australia', 'contact water filter experts'],
    h1: 'Contact Our Water Filtration Experts',
  },
  category: {
    countertop: {
      title: 'Countertop Water Filters Australia | No Installation | Inblu',
      description: 'Shop countertop & benchtop water filters. No installation required - plug and play RO purifiers. Compact design for apartments & rentals. Free shipping.',
      keywords: SECONDARY_KEYWORDS.countertop,
      h1: 'Countertop Water Filters',
    },
    undersink: {
      title: 'Undersink Water Filters Australia | Professional Install | Inblu',
      description: 'Premium undersink water filtration systems with free professional installation. RO purifiers, carbon filters & more. Space-saving kitchen water solutions.',
      keywords: SECONDARY_KEYWORDS.undersink,
      h1: 'Undersink Water Filtration Systems',
    },
    ro: {
      title: 'RO Water Purifiers Australia | Reverse Osmosis Systems | Inblu',
      description: 'Advanced reverse osmosis water purifiers for Australian homes. Remove 99% of contaminants. Tankless, high-flow RO systems with free installation.',
      keywords: SECONDARY_KEYWORDS.ro,
      h1: 'RO Water Purification Systems',
    },
    ioniser: {
      title: 'Water Ionisers Australia | Alkaline Water Systems | Inblu',
      description: 'Premium water ionisers for alkaline, hydrogen-rich drinking water. Australian certified. Improve water quality and taste with our ionisation systems.',
      keywords: SECONDARY_KEYWORDS.ioniser,
      h1: 'Water Ionisers & Alkaline Systems',
    },
  },
}

// ============================================================
// FAQ DATA FOR SCHEMA (Helps with Featured Snippets)
// ============================================================
export const FAQ_DATA = [
  {
    question: 'What is the best water filter for Australian homes?',
    answer: 'For Australian homes, reverse osmosis (RO) water filters are considered the best choice as they remove up to 99% of contaminants including chlorine, fluoride, heavy metals, and bacteria. Inblu offers both countertop and undersink RO systems suitable for different household needs.',
  },
  {
    question: 'Do I need a water filter in Australia?',
    answer: 'While Australian tap water meets safety standards, it can still contain chlorine, fluoride, and trace contaminants. A water filter improves taste, removes unwanted chemicals, and provides extra protection for your family\'s health. Many Australians choose RO filters for the purest drinking water.',
  },
  {
    question: 'How much does a water filter cost in Australia?',
    answer: 'Water filter prices in Australia range from $200 for basic countertop filters to $2,000+ for premium undersink RO systems. Inblu offers competitive pricing with free installation and shipping, making quality water filtration accessible for every budget.',
  },
  {
    question: 'Is RO water safe to drink?',
    answer: 'Yes, RO (reverse osmosis) water is safe and healthy to drink. RO filtration removes harmful contaminants while retaining essential minerals. Many premium RO systems, including Inblu\'s, include mineralisation stages that add beneficial minerals back into the purified water.',
  },
  {
    question: 'How often should I change my water filter?',
    answer: 'Filter replacement frequency depends on the type: sediment filters every 6-12 months, carbon filters every 6-12 months, and RO membranes every 2-3 years. Inblu provides service reminders and replacement filter subscriptions to ensure optimal water quality.',
  },
  {
    question: 'Does Inblu offer free installation?',
    answer: 'Yes, Inblu offers free professional installation for all undersink water filtration systems across major Australian cities. Our certified technicians ensure proper setup and provide guidance on system maintenance.',
  },
  {
    question: 'What contaminants do RO filters remove?',
    answer: 'RO filters remove up to 99% of contaminants including chlorine, fluoride, lead, arsenic, bacteria, viruses, pesticides, pharmaceuticals, and microplastics. They provide the most comprehensive water purification available for home use.',
  },
  {
    question: 'Can I install a water filter in a rental property?',
    answer: 'Yes! Countertop water filters like Inblu\'s benchtop RO systems require no permanent installation and are perfect for renters. Simply connect to your tap, and take it with you when you move.',
  },
]

// ============================================================
// PRODUCT CATEGORIES FOR STRUCTURED DATA
// ============================================================
export const PRODUCT_CATEGORIES = [
  {
    name: 'RO Water Purifiers',
    slug: 'ro-purifiers',
    description: 'Advanced reverse osmosis water purification systems',
  },
  {
    name: 'Countertop Filters',
    slug: 'countertop',
    description: 'Portable benchtop water filtration solutions',
  },
  {
    name: 'Undersink Filters',
    slug: 'undersink',
    description: 'Professional undersink water filtration systems',
  },
  {
    name: 'Water Ionisers',
    slug: 'ionisers',
    description: 'Alkaline and hydrogen water ionisation systems',
  },
  {
    name: 'Replacement Filters',
    slug: 'replacement',
    description: 'Replacement cartridges and filter accessories',
  },
]

// ============================================================
// BLOG TOPICS FOR CONTENT STRATEGY
// ============================================================
export const BLOG_TOPICS = [
  {
    title: 'Best RO Water Filters in Australia (2026 Complete Guide)',
    keywords: ['best RO filter Australia', 'RO water purifier review'],
    intent: 'transactional',
    priority: 'high',
  },
  {
    title: 'Do You Really Need a Water Filter in Australia?',
    keywords: ['water filter necessary Australia', 'Australian tap water quality'],
    intent: 'informational',
    priority: 'high',
  },
  {
    title: 'Countertop vs Undersink Water Filters: Which is Right for You?',
    keywords: ['countertop vs undersink filter', 'best water filter type'],
    intent: 'informational',
    priority: 'medium',
  },
  {
    title: 'How to Remove Fluoride from Tap Water in Australia',
    keywords: ['remove fluoride tap water', 'fluoride filter Australia'],
    intent: 'informational',
    priority: 'high',
  },
  {
    title: 'Water Filter Installation Guide: DIY vs Professional',
    keywords: ['water filter installation', 'install RO filter'],
    intent: 'informational',
    priority: 'medium',
  },
  {
    title: 'Understanding TDS in Drinking Water: What Australians Should Know',
    keywords: ['TDS drinking water', 'water quality testing'],
    intent: 'informational',
    priority: 'medium',
  },
  {
    title: 'Best Water Filters for Hard Water in Australia',
    keywords: ['hard water filter', 'water softener Australia'],
    intent: 'transactional',
    priority: 'medium',
  },
  {
    title: 'RO Water Filter Maintenance: Complete Guide',
    keywords: ['RO filter maintenance', 'water filter care'],
    intent: 'informational',
    priority: 'low',
  },
  {
    title: 'Water Filters for Apartments & Renters in Australia',
    keywords: ['apartment water filter', 'renter water filter'],
    intent: 'transactional',
    priority: 'high',
  },
  {
    title: 'Alkaline Water Benefits: Facts vs Myths',
    keywords: ['alkaline water benefits', 'water ioniser benefits'],
    intent: 'informational',
    priority: 'medium',
  },
]
