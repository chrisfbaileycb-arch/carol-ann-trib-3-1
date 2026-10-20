export type FederatedFeedSource =
  | 'Shopify Independent Index'
  | 'Etsy Artisan Export'
  | 'Chamber / BiteLocal Registry'
  | 'Global Craft Guild';

export type MerchantIngestionProtocol =
  | 'Schema.org Micro-Schema'
  | 'RSS / Atom Product Feed'
  | 'Shopify Open Index'
  | 'BiteLocal Chamber Sync';

export type PlaceCardTier =
  | 'Phase 1: Free Open Index ($0/mo)'
  | 'Phase 2: Local Place Card ($10/mo)'
  | 'Phase 2: Workshop Place Card ($15/mo)'
  | 'Phase 2: Featured Creator ($25/mo)';

export interface DirectUtilityMatch {
  id: string;
  rank: 1 | 2 | 3;
  name: string;
  merchant: 'Home Depot' | 'Target' | 'Whole Foods' | 'Amazon' | 'B&H Photo';
  merchantUrl: string;
  price: string;
  numericPrice: number;
  unitSpec: string;
  rating: number;
  verifiedReviews: number;
  discardedJunkReviews: number;
  junkFilterReason: string;
  specs: {
    label: string;
    value: string;
  }[];
  fulfillment: string;
  inStock: boolean;
  selected?: boolean;
}

export interface SovereignDiscoveryMatch {
  id: string;
  rank: number;
  name: string;
  makerName: string;
  originCity: string;
  federatedSource: FederatedFeedSource;
  directUrl: string;
  price: string;
  numericPrice: number;
  leadTime: string;
  craftsmanshipNotes: string;
  materials: string;
  guildVerification: string;
  directMarginRetained: string;
  ingestionProtocol: MerchantIngestionProtocol;
  placeCardTier: PlaceCardTier;
  placeCardVerified: boolean;
  craftMeritScore: number; // 0-100 merit score (No Pay-to-Rank CPC Auction)
  workshopProfileBio: string;
  selected?: boolean;
}

export interface DualViewComparisonSummary {
  commercialOption: {
    merchant: string;
    name: string;
    price: string;
    summary: string;
    url: string;
  };
  independentArtisanPick: {
    makerName: string;
    originRegion: string;
    name: string;
    price: string;
    summary: string;
    placeCardTier: PlaceCardTier;
    url: string;
    matchId: string;
  };
  secondaryArtisanPick?: {
    makerName: string;
    originRegion: string;
    name: string;
    price: string;
    summary: string;
  };
  voiceRecitationScript: string;
}

export interface SplitPipelineRun {
  query: string;
  runId: string;
  runtimeEngine: 'Playwright Sandboxed Stream' | 'CEF Chromium Stream' | 'Tauri System Webview';
  startedAt: string;
  completedAt?: string;
  status: 'idle' | 'intercepting' | 'synthesizing' | 'completed';
  thread1Status: {
    state: 'idle' | 'running' | 'completed';
    endpointsQueried: string[];
    domNodesScanned: number;
    junkReviewsDiscarded: number;
    latencyMs: number;
    stepText: string;
  };
  thread2Status: {
    state: 'idle' | 'running' | 'completed';
    feedsQueried: FederatedFeedSource[];
    independentIndexesScanned: number;
    verifiedArtisansFound: number;
    latencyMs: number;
    stepText: string;
  };
  dualViewSummary: DualViewComparisonSummary;
  directUtilityMatches: DirectUtilityMatch[];
  sovereignDiscoveryMatches: SovereignDiscoveryMatch[];
}

export interface CustomIndexedMerchant {
  id: string;
  makerName: string;
  originCity: string;
  productName: string;
  categoryKeyword: string;
  price: string;
  numericPrice: number;
  directUrl: string;
  feedUrl: string;
  ingestionProtocol: MerchantIngestionProtocol;
  placeCardTier: PlaceCardTier;
  federatedSource: FederatedFeedSource;
  materials: string;
  craftsmanshipNotes: string;
  guildVerification: string;
  workshopProfileBio: string;
  indexedAt: string;
}

export const PLACE_CARD_TIERS: {
  id: PlaceCardTier;
  name: string;
  monthlyRate: string;
  phase: 'Phase 1' | 'Phase 2';
  description: string;
  features: string[];
}[] = [
  {
    id: 'Phase 1: Free Open Index ($0/mo)',
    name: 'Free Open Ingestion',
    monthlyRate: '$0 / mo',
    phase: 'Phase 1',
    description: 'Open indexing via Schema.org micro-schema or RSS/Atom product feeds to build independent merchant density.',
    features: [
      'Automatic RSS & JSON-LD micro-schema ingestion',
      'Ranked strictly by Craft Merit Score ($0 CPC bidding)',
      'Direct-to-workshop checkout links with 0% commission',
    ],
  },
  {
    id: 'Phase 2: Local Place Card ($10/mo)',
    name: 'Local Maker Place Card',
    monthlyRate: '$10 / mo',
    phase: 'Phase 2',
    description: 'Flat, accessible membership for neighborhood makers and regional Chamber/BiteLocal provisioners.',
    features: [
      'Verified Local Maker Place Card in Dual-View answers',
      'Regional proximity boost in voice recitations',
      'No pay-to-rank auction — flat predictable monthly fee',
    ],
  },
  {
    id: 'Phase 2: Workshop Place Card ($15/mo)',
    name: 'Direct Workshop Place Card',
    monthlyRate: '$15 / mo',
    phase: 'Phase 2',
    description: 'Verified workshop profile card highlighting family studios, craft guilds, and direct international shipping.',
    features: [
      'Full Interactive Workshop Profile Drawer & Provenance Audit',
      'Voice Recitation priority introduction by Carol Ann',
      'Live inventory sync via Shopify Independent or Etsy Export',
    ],
  },
  {
    id: 'Phase 2: Featured Creator ($25/mo)',
    name: 'Global Featured Creator Card',
    monthlyRate: '$25 / mo',
    phase: 'Phase 2',
    description: 'Comprehensive artisan showcase for heritage guilds and bespoke benchmakers across desktop & mobile co-pilot.',
    features: [
      'Featured Local/Global Creator highlight badge & bio story',
      'Multi-region federated guild verification',
      'Protected from enterprise ad-budget bidding wars',
    ],
  },
];

export const PRESET_PIPELINE_QUERIES = [
  {
    label: 'Hand-Stitched Leather Belt',
    query: 'hand-stitched leather belt',
    category: 'Apparel & Craft',
  },
  {
    label: 'Cordless Brushless Drill',
    query: 'cordless drill',
    category: 'Hardware & Tools',
  },
  {
    label: 'Hammered Copper Kettle',
    query: 'hammered copper gooseneck kettle',
    category: 'Kitchen & Home',
  },
  {
    label: 'Organic Raw Wildflower Honey',
    query: 'organic raw wildflower honey',
    category: 'Pantry & Local Food',
  },
];

export function synthesizeSplitPipeline(
  rawQuery: string,
  runtimeEngine: SplitPipelineRun['runtimeEngine'] = 'Playwright Sandboxed Stream',
  customMerchants: CustomIndexedMerchant[] = []
): SplitPipelineRun {
  const query = rawQuery.trim() || 'hand-stitched leather belt';
  const lower = query.toLowerCase();
  const now = new Date().toISOString();
  const runId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Filter any custom user-ingested merchants that match this query or show at top if recently added
  const matchingCustom: SovereignDiscoveryMatch[] = customMerchants
    .filter(
      (m) =>
        lower.includes(m.categoryKeyword.toLowerCase()) ||
        m.productName.toLowerCase().includes(lower) ||
        lower.includes(m.productName.toLowerCase().split(' ')[0] || '')
    )
    .map((m, idx) => ({
      id: m.id,
      rank: idx + 1,
      name: m.productName,
      makerName: m.makerName,
      originCity: m.originCity,
      federatedSource: m.federatedSource,
      directUrl: m.directUrl,
      price: m.price,
      numericPrice: m.numericPrice,
      leadTime: 'Direct from Workshop · 2–4 business days',
      craftsmanshipNotes: m.craftsmanshipNotes,
      materials: m.materials,
      guildVerification: m.guildVerification,
      directMarginRetained: '100% Direct Independent Revenue (0% Ad Tax)',
      ingestionProtocol: m.ingestionProtocol,
      placeCardTier: m.placeCardTier,
      placeCardVerified: m.placeCardTier !== 'Phase 1: Free Open Index ($0/mo)',
      craftMeritScore: 97,
      workshopProfileBio: m.workshopProfileBio,
      selected: false,
    }));

  // 1. Hand-stitched leather belt (Features Turkey Mountain Family Workshop @ $42 & Colorado Local Leather Worker @ $68 vs Target @ $30)
  if (lower.includes('belt') || lower.includes('leather') || lower.includes('strap')) {
    const baseSovereign: SovereignDiscoveryMatch[] = [
      {
        id: 'sd_belt_turkey',
        rank: 1,
        name: 'Hand-Stitched Anatolian Full-Grain Vegetable-Tanned Bridle Belt',
        makerName: 'Bozdağ Family Saddlery Workshop',
        originCity: 'Bolu Mountains, Turkey',
        federatedSource: 'Global Craft Guild',
        directUrl: 'https://bozdagsaddlery.artisan/products/full-grain-bridle-belt',
        price: '$42.00',
        numericPrice: 42.0,
        leadTime: 'Direct DHL Express from workshop · 4–5 days',
        craftsmanshipNotes:
          'Third-generation mountain family workshop; hand-stitched at 7 SPI with waxed linen cord and hand-rubbed mountain beeswax finish.',
        materials: '12 oz Oak-Pit Tanned Full-Grain Anatolian Bullhide + Solid Sand-Cast Brass Buckle',
        guildVerification: 'Anatolian Master Leatherworkers Guild #118',
        directMarginRetained: '98% Retained by Family Workshop',
        ingestionProtocol: 'RSS / Atom Product Feed',
        placeCardTier: 'Phase 2: Workshop Place Card ($15/mo)',
        placeCardVerified: true,
        craftMeritScore: 99,
        workshopProfileBio:
          'Founded in 1974 in the Bolu Mountains of Turkey, Bozdağ Family Saddlery is a 4-person family bench workshop tanning and hand-stitching full-grain harnesses and belts without middlemen or ad-agency markups.',
        selected: true,
      },
      {
        id: 'sd_belt_colorado',
        rank: 2,
        name: 'Front Range Hand-Burnished Hermann Oak Bridle Belt',
        makerName: 'Clear Creek Benchworks (Local Leather Worker)',
        originCity: 'Golden, Colorado',
        federatedSource: 'Chamber / BiteLocal Registry',
        directUrl: 'https://clearcreekleather.co/products/front-range-bridle-belt',
        price: '$68.00',
        numericPrice: 68.0,
        leadTime: 'Cut to exact waist size in Colorado · Ships in 2 days',
        craftsmanshipNotes:
          'Single-artisan Colorado bench; two-needle traditional saddle stitch along solid brass Chicago screws with lifetime stitch guarantee.',
        materials: '13 oz Hermann Oak Veg-Tan Bridle Leather + Solid US Forged Brass Hardware',
        guildVerification: 'Colorado Independent Artisans & BiteLocal Verified #304',
        directMarginRetained: '100% Independent Local Maker Payout',
        ingestionProtocol: 'Schema.org Micro-Schema',
        placeCardTier: 'Phase 2: Featured Creator ($25/mo)',
        placeCardVerified: true,
        craftMeritScore: 98,
        workshopProfileBio:
          'Operated by master saddler Caleb Vance in Golden, Colorado. Every strap is edged, creased, and hand-burnished using local Rocky Mountain beeswax.',
        selected: false,
      },
      {
        id: 'sd_belt_1',
        rank: 3,
        name: 'Saddle-Stitched English Bridle Garrison Belt',
        makerName: 'Hollows Leather Workshop',
        originCity: 'Minneapolis, MN',
        federatedSource: 'Shopify Independent Index',
        directUrl: 'https://hollowsleather.shop/products/bridle-belt',
        price: '$95.00',
        numericPrice: 95.0,
        leadTime: 'Ships in 4–5 business days',
        craftsmanshipNotes:
          'Hand-stitched using 1.0mm Ritza 25 Tiger wax thread; edges hand-beveled and beeswax burnished.',
        materials: '13 oz Hermann Oak Veg-Tan Bridle + Solid Sand-Cast Japanese Brass Buckle',
        guildVerification: 'North American Saddlery & Leather Guild #409',
        directMarginRetained: '97% goes directly to craftsperson',
        ingestionProtocol: 'Shopify Open Index',
        placeCardTier: 'Phase 2: Local Place Card ($10/mo)',
        placeCardVerified: true,
        craftMeritScore: 96,
        workshopProfileBio:
          'Independent one-man leather studio in Minneapolis specializing in heavy-duty heritage work belts and small-batch leather goods.',
        selected: false,
      },
      {
        id: 'sd_belt_3',
        rank: 4,
        name: 'Hand-Tooled Vegetable-Tanned Ranger Belt',
        makerName: 'Mesa Verde Saddlery Co.',
        originCity: 'Santa Fe, NM',
        federatedSource: 'Etsy Artisan Export',
        directUrl: 'https://santafechamber.local/mesa-verde-saddlery',
        price: '$112.00',
        numericPrice: 112.0,
        leadTime: 'In stock · Local courier or 2-day air',
        craftsmanshipNotes: 'Billet straps hand-sewn with waxed linen cord; vegetable-tanned in oak bark pits.',
        materials: 'Wickett & Craig 12 oz Russet Harness Leather + Sterling-Plated Buckle',
        guildVerification: 'Santa Fe Independent Makers Registry Verified',
        directMarginRetained: '98% Local Economic Retention',
        ingestionProtocol: 'Schema.org Micro-Schema',
        placeCardTier: 'Phase 1: Free Open Index ($0/mo)',
        placeCardVerified: false,
        craftMeritScore: 95,
        workshopProfileBio:
          'Indexed via Phase 1 Free Open Micro-Schema. Traditional Southwestern saddlery and belt workshop in Santa Fe.',
        selected: false,
      },
    ];

    const combinedSovereign = [...matchingCustom, ...baseSovereign].map((m, i) => ({
      ...m,
      rank: i + 1,
    }));

    return {
      query,
      runId,
      runtimeEngine,
      startedAt: now,
      completedAt: now,
      status: 'completed',
      thread1Status: {
        state: 'completed',
        endpointsQueried: ['target.com/s?searchTerm=leather+belt', 'amazon.com/s?k=full+grain+leather+belt'],
        domNodesScanned: 1420,
        junkReviewsDiscarded: 318,
        latencyMs: 420,
        stepText: 'Extracted top 3 verified retail matches · 318 incentivized/bot reviews stripped',
      },
      thread2Status: {
        state: 'completed',
        feedsQueried: [
          'Shopify Independent Index',
          'Etsy Artisan Export',
          'Chamber / BiteLocal Registry',
          'Global Craft Guild',
        ],
        independentIndexesScanned: 84 + matchingCustom.length,
        verifiedArtisansFound: combinedSovereign.length,
        latencyMs: 485,
        stepText: `Matched ${combinedSovereign.length} bench-crafted leather workshops · Ranked by Craft Merit (No Pay-to-Rank Auction)`,
      },
      dualViewSummary: {
        commercialOption: {
          merchant: 'Target',
          name: 'Goodfellow & Co. Men’s Bridle Leather Belt (38mm)',
          price: '$30.00',
          summary: 'Machine lockstitched top-grain cowhide · Same-day retail pickup (Aisle B14)',
          url: 'https://www.target.com/p/full-grain-leather-belt',
        },
        independentArtisanPick: {
          makerName: 'Bozdağ Family Saddlery Workshop',
          originRegion: 'Bolu Mountains, Turkey',
          name: 'Hand-Stitched Full-Grain Vegetable-Tanned Bridle Belt',
          price: '$42.00',
          summary: '12 oz oak-pit tanned full-grain bullhide · Hand-stitched with waxed linen & direct shipping',
          placeCardTier: 'Phase 2: Workshop Place Card ($15/mo)',
          url: 'https://bozdagsaddlery.artisan/products/full-grain-bridle-belt',
          matchId: 'sd_belt_turkey',
        },
        secondaryArtisanPick: {
          makerName: 'Clear Creek Benchworks',
          originRegion: 'Golden, Colorado',
          name: 'Front Range Hand-Burnished Hermann Oak Belt',
          price: '$68.00',
          summary: 'Local Colorado leather worker · 13 oz Hermann Oak bridle leather cut to size',
        },
        voiceRecitationScript:
          "I found the standard option at Target for $30, but there's a family workshop in Turkey crafting full-grain belts for $42 with direct shipping. Would you like to review their profile?",
      },
      directUtilityMatches: [
        {
          id: 'du_belt_1',
          rank: 1,
          name: 'Goodfellow & Co. Men’s Bridle Leather Belt (38mm)',
          merchant: 'Target',
          merchantUrl: 'https://www.target.com/p/full-grain-leather-belt',
          price: '$30.00',
          numericPrice: 30.0,
          unitSpec: '38mm width · Nickel-free brass buckle',
          rating: 4.6,
          verifiedReviews: 412,
          discardedJunkReviews: 94,
          junkFilterReason: 'Filtered 94 syndicated promo-code reviews',
          specs: [
            { label: 'Hide Grade', value: 'Top-Grain Cowhide' },
            { label: 'Stitching', value: 'Machine lockstitch' },
            { label: 'Thickness', value: '9 oz (3.6mm)' },
            { label: 'Buckle', value: 'Cast Zinc / Brass Plate' },
          ],
          fulfillment: 'Same-Day Order Pickup · Aisle B14',
          inStock: true,
          selected: false,
        },
        {
          id: 'du_belt_2',
          rank: 2,
          name: 'Timberland Classic 35mm Pull-Up Leather Jean Belt',
          merchant: 'Amazon',
          merchantUrl: 'https://www.amazon.com/dp/B001belt',
          price: '$29.50',
          numericPrice: 29.5,
          unitSpec: '35mm width · Single-loop harness',
          rating: 4.7,
          verifiedReviews: 1890,
          discardedJunkReviews: 162,
          junkFilterReason: 'Filtered 162 vine/merged SKU variant reviews',
          specs: [
            { label: 'Hide Grade', value: '100% Oiled Full-Grain' },
            { label: 'Stitching', value: 'Double-row edge stitch' },
            { label: 'Thickness', value: '8.5 oz (3.4mm)' },
            { label: 'Buckle', value: 'Antiqued Matte Brass' },
          ],
          fulfillment: 'Prime Overnight Delivery',
          inStock: true,
          selected: false,
        },
        {
          id: 'du_belt_3',
          rank: 3,
          name: 'Carhartt Heavy-Duty Anvil Saddle Leather Work Belt',
          merchant: 'Home Depot',
          merchantUrl: 'https://www.homedepot.com/p/carhartt-leather-belt',
          price: '$39.99',
          numericPrice: 39.99,
          unitSpec: '44mm width · Heavy harness buckle',
          rating: 4.8,
          verifiedReviews: 640,
          discardedJunkReviews: 62,
          junkFilterReason: 'Filtered 62 unverified sweepstakes entries',
          specs: [
            { label: 'Hide Grade', value: 'Heavy Bridle Leather' },
            { label: 'Stitching', value: 'Waxed nylon perimeter' },
            { label: 'Thickness', value: '11 oz (4.4mm)' },
            { label: 'Buckle', value: 'Solid Steel Roller' },
          ],
          fulfillment: 'In-Store Pickup · 14 in stock locally',
          inStock: true,
          selected: false,
        },
      ],
      sovereignDiscoveryMatches: combinedSovereign,
    };
  }

  // 2. Cordless drill / tools / hardware
  if (lower.includes('drill') || lower.includes('driver') || lower.includes('tool') || lower.includes('hardware')) {
    const baseSovereign: SovereignDiscoveryMatch[] = [
      {
        id: 'sd_drill_1',
        rank: 1,
        name: 'Worker-Owned Hardware Co-Op: Milwaukee M18 Pro Kit + Free Local Calibration',
        makerName: 'Pacific Tool & Hardware Collective',
        originCity: 'Seattle, WA',
        federatedSource: 'Chamber / BiteLocal Registry',
        directUrl: 'https://pacifictoolcoop.local/products/m18-pro-bundle',
        price: '$199.00',
        numericPrice: 199.0,
        leadTime: 'Same-day local courier or shop pickup',
        craftsmanshipNotes:
          'Includes lifetime chuck runout inspection & battery cell balancing at our independent repair bench.',
        materials: 'Authorized Independent Dealer · 100% Local Tax & Repair Ecosystem',
        guildVerification: 'BiteLocal Independent Hardware Alliance',
        directMarginRetained: '100% Independent Co-Op Revenue',
        ingestionProtocol: 'BiteLocal Chamber Sync',
        placeCardTier: 'Phase 2: Local Place Card ($10/mo)',
        placeCardVerified: true,
        craftMeritScore: 98,
        workshopProfileBio:
          'Employee-owned neighborhood hardware co-op and tool repair bench serving independent contractors and woodworkers since 1988.',
        selected: true,
      },
      {
        id: 'sd_drill_2',
        rank: 2,
        name: 'Hand-Ground High-Speed Cobalt & Brad-Point Woodworker Bit Roll (15-Piece)',
        makerName: 'Norseman & Sterling Toolworks',
        originCity: 'St. Paul, MN',
        federatedSource: 'Shopify Independent Index',
        directUrl: 'https://sterlingtoolworks.shop/products/m42-cobalt-drill-set',
        price: '$94.00',
        numericPrice: 94.0,
        leadTime: 'Ships in 24 hours from Minnesota',
        craftsmanshipNotes:
          'CNC & hand-relieved 135° split-point geometry ground from solid US M42 cobalt steel rod.',
        materials: '8% Cobalt M42 High-Speed Steel + Waxed Canvas Shop Roll',
        guildVerification: 'American Independent Machinists Guild',
        directMarginRetained: '96% Direct Domestic Manufacturer',
        ingestionProtocol: 'Shopify Open Index',
        placeCardTier: 'Phase 2: Workshop Place Card ($15/mo)',
        placeCardVerified: true,
        craftMeritScore: 97,
        workshopProfileBio:
          'Family-owned precision flute-grinding shop in St. Paul, Minnesota manufacturing solid cobalt drill tooling.',
        selected: false,
      },
      {
        id: 'sd_drill_3',
        rank: 3,
        name: 'Heirloom Bronze & Walnut Millers Falls Style Eggbeater Hand Drill',
        makerName: 'Crucible & Bench Toolmakers',
        originCity: 'Covington, KY',
        federatedSource: 'Global Craft Guild',
        directUrl: 'https://crucibletool.guild/products/heirloom-hand-drill',
        price: '$185.00',
        numericPrice: 185.0,
        leadTime: 'In stock · Ships in 2 days',
        craftsmanshipNotes:
          'Machined silicon-bronze main gear with turned American black walnut handle for silent, cord-free joinery.',
        materials: 'Silicon Bronze, 4140 Hardened Steel Pinion, Kiln-Dried Black Walnut',
        guildVerification: 'Guild of Fine Woodworking Toolmakers',
        directMarginRetained: '98% Direct Workshop Margin',
        ingestionProtocol: 'Schema.org Micro-Schema',
        placeCardTier: 'Phase 1: Free Open Index ($0/mo)',
        placeCardVerified: false,
        craftMeritScore: 95,
        workshopProfileBio:
          'Small Kentucky machine and woodworking studio producing heirloom hand tools indexed via open Schema.org microdata.',
        selected: false,
      },
    ];

    const combinedSovereign = [...matchingCustom, ...baseSovereign].map((m, i) => ({
      ...m,
      rank: i + 1,
    }));

    return {
      query,
      runId,
      runtimeEngine,
      startedAt: now,
      completedAt: now,
      status: 'completed',
      thread1Status: {
        state: 'completed',
        endpointsQueried: ['homedepot.com/b/Tools-Power-Tools-Drills', 'target.com/c/power-tools'],
        domNodesScanned: 1890,
        junkReviewsDiscarded: 445,
        latencyMs: 390,
        stepText: 'Extracted top 3 brushless cordless drills · 445 seeded sweepstakes reviews removed',
      },
      thread2Status: {
        state: 'completed',
        feedsQueried: [
          'Chamber / BiteLocal Registry',
          'Shopify Independent Index',
          'Global Craft Guild',
          'Etsy Artisan Export',
        ],
        independentIndexesScanned: 68 + matchingCustom.length,
        verifiedArtisansFound: combinedSovereign.length,
        latencyMs: 460,
        stepText: 'Located 3 independent toolmakers, regional hardware co-ops & precision bit smiths',
      },
      dualViewSummary: {
        commercialOption: {
          merchant: 'Home Depot',
          name: 'Milwaukee M18 FUEL 18V Brushless Drill/Driver Kit',
          price: '$199.00',
          summary: 'Big-box chain fulfillment · Aisle 12, Bay 004 · 210 raffle reviews removed',
          url: 'https://www.homedepot.com/p/Milwaukee-M18-FUEL-2904-22',
        },
        independentArtisanPick: {
          makerName: 'Pacific Tool & Hardware Collective',
          originRegion: 'Seattle, WA',
          name: 'Worker-Owned Co-Op M18 Pro Kit + Lifetime Bench Calibration',
          price: '$199.00',
          summary: 'Price-matched at $199 · Includes free chuck calibration & battery servicing at local repair bench',
          placeCardTier: 'Phase 2: Local Place Card ($10/mo)',
          url: 'https://pacifictoolcoop.local/products/m18-pro-bundle',
          matchId: 'sd_drill_1',
        },
        secondaryArtisanPick: {
          makerName: 'Norseman & Sterling Toolworks',
          originRegion: 'St. Paul, MN',
          name: 'Hand-Ground US M42 Cobalt Bit Roll (15-Pc)',
          price: '$94.00',
          summary: 'Direct domestic machinist shop · Ships in 24h',
        },
        voiceRecitationScript:
          "I found the standard Milwaukee M18 kit at Home Depot for $199, but Pacific Tool & Hardware Co-Op offers the exact same kit for $199 with lifetime local repair bench calibration, alongside US-ground cobalt bits from St. Paul for $94. Would you like to review their profile?",
      },
      directUtilityMatches: [
        {
          id: 'du_drill_1',
          rank: 1,
          name: 'Milwaukee M18 FUEL 18V Lithium-Ion Brushless 1/2 in. Hammer Drill/Driver Kit',
          merchant: 'Home Depot',
          merchantUrl: 'https://www.homedepot.com/p/Milwaukee-M18-FUEL-2904-22',
          price: '$199.00',
          numericPrice: 199.0,
          unitSpec: '1,400 in-lbs torque · 2,100 RPM · All-metal chuck',
          rating: 4.9,
          verifiedReviews: 2340,
          discardedJunkReviews: 210,
          junkFilterReason: 'Removed 210 non-verified promotional raffle reviews',
          specs: [
            { label: 'Peak Torque', value: '1,400 in-lbs' },
            { label: 'Chuck Size', value: '1/2 in. All-Metal Ratcheting' },
            { label: 'Length', value: '6.9 in. Compact Head' },
            { label: 'Battery Included', value: '2x M18 REDLITHIUM XC5.0' },
          ],
          fulfillment: 'In-Store Pickup · 9 in stock (Aisle 12, Bay 004)',
          inStock: true,
          selected: false,
        },
        {
          id: 'du_drill_2',
          rank: 2,
          name: 'DeWALT 20V MAX XR Brushless 1/2 in. Cordless Compact Drill/Driver (DCD800D2)',
          merchant: 'Home Depot',
          merchantUrl: 'https://www.homedepot.com/p/DEWALT-20V-MAX-XR-DCD800D2',
          price: '$179.00',
          numericPrice: 179.0,
          unitSpec: '900 UWO · 2,000 RPM · 3-Position Pivoting LED',
          rating: 4.8,
          verifiedReviews: 1780,
          discardedJunkReviews: 145,
          junkFilterReason: 'Removed 145 syndicated third-party seller duplicates',
          specs: [
            { label: 'Power Output', value: '900 Unit Watts Out (UWO)' },
            { label: 'Chuck Size', value: '1/2 in. Nitro-Carburized Metal' },
            { label: 'Length', value: '6.37 in. Ultra-Compact' },
            { label: 'Battery Included', value: '2x 20V MAX 2.0Ah + Charger' },
          ],
          fulfillment: 'Same-Day Delivery or Curbside Pickup',
          inStock: true,
          selected: false,
        },
        {
          id: 'du_drill_3',
          rank: 3,
          name: 'Makita 18V LXT Sub-Compact Brushless Cordless 1/2 in. Driver-Drill (XFD15SY)',
          merchant: 'Amazon',
          merchantUrl: 'https://www.amazon.com/dp/B09MAKITA',
          price: '$159.00',
          numericPrice: 159.0,
          unitSpec: '350 in-lbs · 2.9 lbs ultra-lightweight ergonomics',
          rating: 4.8,
          verifiedReviews: 990,
          discardedJunkReviews: 90,
          junkFilterReason: 'Removed 90 merged accessory-only reviews',
          specs: [
            { label: 'Peak Torque', value: '350 in-lbs Dual Ball-Bearing' },
            { label: 'Weight', value: '2.9 lbs (with battery)' },
            { label: 'Length', value: '5.875 in. Sub-Compact' },
            { label: 'Battery Included', value: '2x 18V LXT 1.5Ah' },
          ],
          fulfillment: 'Next-Day Prime Shipping',
          inStock: true,
          selected: false,
        },
      ],
      sovereignDiscoveryMatches: combinedSovereign,
    };
  }

  // 3. Default / Dynamic Synthesis for any user search query (e.g. Kettle, Honey, Coffee, Backpack, etc.)
  const cleanTitle = query
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const baseSovereign: SovereignDiscoveryMatch[] = [
    {
      id: `sd_dyn_1_${Date.now()}`,
      rank: 1,
      name: `Small-Batch Handcrafted ${cleanTitle}`,
      makerName: 'Alder & Forge Independent Studio',
      originCity: 'Asheville, NC',
      federatedSource: 'Shopify Independent Index',
      directUrl: `https://alderandforge.independent/products/${encodeURIComponent(lower.replace(/\s+/g, '-'))}`,
      price: '$58.00',
      numericPrice: 58.0,
      leadTime: 'Ships direct from studio in 2–3 days',
      craftsmanshipNotes: 'Individually finished and inspected by the founding maker; numbered batch card included.',
      materials: 'Regionally Sourced Raw Materials · Zero Mass-Market Plastics',
      guildVerification: 'Southern Highland Craft Guild Member',
      directMarginRetained: '97% Retained by Independent Studio',
      ingestionProtocol: 'Shopify Open Index',
      placeCardTier: 'Phase 2: Workshop Place Card ($15/mo)',
      placeCardVerified: true,
      craftMeritScore: 98,
      workshopProfileBio:
        'Independent Appalachian craft studio in Asheville building heirloom everyday utility goods with full material traceability.',
      selected: true,
    },
    {
      id: `sd_dyn_2_${Date.now()}`,
      rank: 2,
      name: `Heritage Guild ${cleanTitle} (Custom Workshop Edition)`,
      makerName: 'Kestrel & Co. Artisan Cooperative',
      originCity: 'Burlington, VT',
      federatedSource: 'Global Craft Guild',
      directUrl: `https://kestrelguild.org/makers/${encodeURIComponent(lower.replace(/\s+/g, '-'))}`,
      price: '$64.00',
      numericPrice: 64.0,
      leadTime: 'Made to order · 4 days',
      craftsmanshipNotes: 'Built using traditional joinery and heirloom finishing techniques with lifetime repair support.',
      materials: '100% Traceable North American Materials',
      guildVerification: 'Vermont Guild of Master Artisans',
      directMarginRetained: '99% Direct Co-Op Payout',
      ingestionProtocol: 'RSS / Atom Product Feed',
      placeCardTier: 'Phase 2: Featured Creator ($25/mo)',
      placeCardVerified: true,
      craftMeritScore: 96,
      workshopProfileBio:
        'A 6-maker cooperative in Burlington, Vermont sharing kiln, forge, and finishing benches with zero middleman markups.',
      selected: false,
    },
    {
      id: `sd_dyn_3_${Date.now()}`,
      rank: 3,
      name: `Local Main-Street Provisioner: ${cleanTitle}`,
      makerName: 'Mercantile & Sons Regional Provisioners',
      originCity: 'Hudson Valley, NY',
      federatedSource: 'Chamber / BiteLocal Registry',
      directUrl: `https://bitelocal.registry/hudson-valley/${encodeURIComponent(lower.replace(/\s+/g, '-'))}`,
      price: '$54.00',
      numericPrice: 54.0,
      leadTime: 'In stock · Same-day regional dispatch',
      craftsmanshipNotes: 'Curated directly from family-owned regional producers with transparent farm/workshop ledger.',
      materials: 'Small-Lot Regional Production',
      guildVerification: 'BiteLocal & Regional Chamber Certified',
      directMarginRetained: '95% Local Community Retention',
      ingestionProtocol: 'Schema.org Micro-Schema',
      placeCardTier: 'Phase 1: Free Open Index ($0/mo)',
      placeCardVerified: false,
      craftMeritScore: 94,
      workshopProfileBio:
        'Indexed free via Schema.org micro-schema. Family-run Hudson Valley provisioner connecting local makers directly to households.',
      selected: false,
    },
  ];

  const combinedSovereign = [...matchingCustom, ...baseSovereign].map((m, i) => ({
    ...m,
    rank: i + 1,
  }));

  const topArtisan = combinedSovereign[0]!;

  return {
    query,
    runId,
    runtimeEngine,
    startedAt: now,
    completedAt: now,
    status: 'completed',
    thread1Status: {
      state: 'completed',
      endpointsQueried: [
        `target.com/s?searchTerm=${encodeURIComponent(query)}`,
        `wholefoods.amazon.com/s?k=${encodeURIComponent(query)}`,
      ],
      domNodesScanned: 1260,
      junkReviewsDiscarded: 274,
      latencyMs: 405,
      stepText: `Extracted top 3 verified matches for "${cleanTitle}" · 274 synthetic/incentivized reviews discarded`,
    },
    thread2Status: {
      state: 'completed',
      feedsQueried: [
        'Shopify Independent Index',
        'Etsy Artisan Export',
        'Chamber / BiteLocal Registry',
        'Global Craft Guild',
      ],
      independentIndexesScanned: 76 + matchingCustom.length,
      verifiedArtisansFound: combinedSovereign.length,
      latencyMs: 455,
      stepText: `Discovered ${combinedSovereign.length} independent small-business & artisan makers for "${cleanTitle}"`,
    },
    dualViewSummary: {
      commercialOption: {
        merchant: 'Target',
        name: `${cleanTitle} — Standard Commercial Edition`,
        price: '$44.00',
        summary: 'Mass-market retail SKU · Same-day pickup · 112 promo reviews stripped',
        url: `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`,
      },
      independentArtisanPick: {
        makerName: topArtisan.makerName,
        originRegion: topArtisan.originCity,
        name: topArtisan.name,
        price: topArtisan.price,
        summary: `${topArtisan.craftsmanshipNotes}`,
        placeCardTier: topArtisan.placeCardTier,
        url: topArtisan.directUrl,
        matchId: topArtisan.id,
      },
      voiceRecitationScript: `I found the standard option for ${cleanTitle} at Target for $44, but there's an independent studio in ${topArtisan.originCity} (${topArtisan.makerName}) crafting small-batch ${cleanTitle.toLowerCase()} for ${topArtisan.price} with direct studio shipping. Would you like to review their profile?`,
    },
    directUtilityMatches: [
      {
        id: `du_dyn_1_${Date.now()}`,
        rank: 1,
        name: `${cleanTitle} — Reserve Commercial Grade Edition`,
        merchant: 'Target',
        merchantUrl: `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`,
        price: '$44.00',
        numericPrice: 44.0,
        unitSpec: 'Verified Retail Spec · Tier-1 Materials',
        rating: 4.8,
        verifiedReviews: 820,
        discardedJunkReviews: 112,
        junkFilterReason: 'Filtered 112 incentivized sweepstakes reviews',
        specs: [
          { label: 'Build Standard', value: 'Tested Heavy-Use Grade' },
          { label: 'Certification', value: 'UL / NSF Verified' },
          { label: 'Warranty', value: '2-Year Direct Replacement' },
        ],
        fulfillment: 'Same-Day Pickup or 2-Hour Local Delivery',
        inStock: true,
        selected: false,
      },
      {
        id: `du_dyn_2_${Date.now()}`,
        rank: 2,
        name: `365 Select ${cleanTitle} (Organic / Sustainably Sourced)`,
        merchant: 'Whole Foods',
        merchantUrl: `https://wholefoods.amazon.com/s?k=${encodeURIComponent(query)}`,
        price: '$38.50',
        numericPrice: 38.5,
        unitSpec: 'Clean Label · Zero Synthetic Additives',
        rating: 4.7,
        verifiedReviews: 615,
        discardedJunkReviews: 88,
        junkFilterReason: 'Filtered 88 unverified third-party reseller ratings',
        specs: [
          { label: 'Sourcing', value: 'Traceable Single-Origin' },
          { label: 'Quality Audit', value: 'Whole Foods Quality Standards' },
          { label: 'Packaging', value: '100% Recyclable Glass/Paper' },
        ],
        fulfillment: '2-Hour Whole Foods Window',
        inStock: true,
        selected: false,
      },
      {
        id: `du_dyn_3_${Date.now()}`,
        rank: 3,
        name: `Pro-Series Heavy Duty ${cleanTitle}`,
        merchant: 'Home Depot',
        merchantUrl: `https://www.homedepot.com/s/${encodeURIComponent(query)}`,
        price: '$52.00',
        numericPrice: 52.0,
        unitSpec: 'Contractor / Workshop Spec',
        rating: 4.7,
        verifiedReviews: 530,
        discardedJunkReviews: 74,
        junkFilterReason: 'Filtered 74 promotional syndicate posts',
        specs: [
          { label: 'Durability', value: 'Commercial Duty Cycle' },
          { label: 'Material', value: 'Reinforced Alloy / Hardwood' },
          { label: 'Return Policy', value: '90-Day In-Store Counter' },
        ],
        fulfillment: 'In-Store Pickup · Aisle 08',
        inStock: true,
        selected: false,
      },
    ],
    sovereignDiscoveryMatches: combinedSovereign,
  };
}
