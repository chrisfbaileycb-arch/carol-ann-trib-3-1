import type { ErrandAction } from '@/data/schemas';

export interface DispatchChainMeta {
  key: string;
  title: string;
  url: string;
  provider: string;
  actions: Omit<ErrandAction, 'status'>[];
}

export const DISPATCH_CHAINS: Record<string, DispatchChainMeta> = {
  'whole-foods': {
    key: 'whole-foods',
    title: 'Order Whole Foods Delivery',
    url: 'https://www.wholefoodsmarket.com/cart',
    provider: 'Whole Foods',
    actions: [
      { id: 'wf-1', command: 'browser.open("https://wholefoods.com/cart")', step: 'Connecting to Whole Foods account', output: 'Session authenticated via saved credential vault.' },
      { id: 'wf-2', command: 'dom.query("input[name=search]")', step: 'Locating catalog search field', output: 'Search node resolved at #search-input.' },
      { id: 'wf-3', command: 'cart.matchItems(["Organic Eggs","Almond Milk","Grass-Fed Beef","Spinach"])', step: 'Populating cart items', output: '4 of 4 items matched to prior purchase SKUs.' },
      { id: 'wf-4', command: 'cart.validateTotals()', step: 'Validating subtotal against budget rule', output: 'Subtotal $86.42 — under $120 weekly cap.' },
      { id: 'wf-5', command: 'checkout.selectWindow("Tomorrow 8:00 AM - 10:00 AM")', step: 'Selecting delivery window', output: 'Window reserved. Ready for one-tap confirm.' },
    ],
  },
  'dry-cleaning': {
    key: 'dry-cleaning',
    title: 'Dispatch Dry Cleaning Pickup',
    url: 'https://greencleaners.local/schedule',
    provider: 'Local Green Cleaners',
    actions: [
      { id: 'dc-1', command: 'dispatch.locateProvider("Local Green Cleaners")', step: 'Connecting to dry cleaning route', output: 'Pickup route verified for 80209.' },
      { id: 'dc-2', command: 'form.fill({ address: "Home — front porch bin" })', step: 'Filling pickup address + access notes', output: 'Address and gate code applied.' },
      { id: 'dc-3', command: 'dispatch.schedule({ date: "Monday", items: "3 Blouses, 2 Slacks" })', step: 'Booking courier dispatch', output: 'Pickup booked for Monday 7–9 AM.' },
    ],
  },
  'amazon-reorder': {
    key: 'amazon-reorder',
    title: 'Amazon Reorder',
    url: 'https://www.amazon.com/gp/css/order-history',
    provider: 'Amazon',
    actions: [
      { id: 'amz-1', command: 'amazon.queryOrderHistory("Whey Isolate Vanilla")', step: 'Locating exact item SKU', output: 'SKU B091X4G match confirmed (last ordered 41 days ago).' },
      { id: 'amz-2', command: 'price.compare({ window: "90d" })', step: 'Comparing price history', output: 'Current $44.99 — 6% below 90-day median.' },
      { id: 'amz-3', command: 'amazon.stageBuyNow()', step: 'Staging one-click reorder', output: 'Staged at $44.99. Awaiting final user tap.' },
    ],
  },
  'school-sync': {
    key: 'school-sync',
    title: 'Sync School Calendar',
    url: 'https://portal.district.org/calendar',
    provider: 'District Parent Portal',
    actions: [
      { id: 'sc-1', command: 'portal.authenticate()', step: 'Signing into parent portal', output: 'Two-factor satisfied via passkey.' },
      { id: 'sc-2', command: 'calendar.pullICS("2026-fall")', step: 'Pulling fall term calendar', output: '38 events imported, 4 early releases flagged.' },
      { id: 'sc-3', command: 'conflicts.detect(["work","household"])', step: 'Scanning for conflicts', output: '1 conflict: Thu 1:15pm early release vs architecture review.' },
    ],
  },
  'appointment-book': {
    key: 'appointment-book',
    title: 'Book Pediatric Appointment',
    url: 'https://booking.pediatrics.health/slots',
    provider: 'Pediatrics Group',
    actions: [
      { id: 'ap-1', command: 'booking.open("Dr. Nguyen — Pediatrics")', step: 'Opening provider booking portal', output: 'Provider page loaded.' },
      { id: 'ap-2', command: 'forms.autofill(family.records["Ava"])', step: 'Auto-filling patient intake form', output: 'Insurance + history fields populated.' },
      { id: 'ap-3', command: 'slots.hold(["Tue 9:20 AM","Wed 10:00 AM"])', step: 'Holding two candidate slots', output: 'Both slots held for 15 minutes.' },
    ],
  },
};

export const CHAIN_LIST = Object.values(DISPATCH_CHAINS);

export const chainForTarget = (target: string): DispatchChainMeta => {
  if (target === 'amazon') return DISPATCH_CHAINS['amazon-reorder'];
  return DISPATCH_CHAINS[target] ?? DISPATCH_CHAINS['whole-foods'];
};

/** Naive intent parser — maps a spoken/typed command to a dispatch chain. */
export const parseIntent = (text: string): DispatchChainMeta | null => {
  const t = text.toLowerCase();
  if (t.includes('whole foods') || t.includes('grocer') || t.includes('delivery')) return DISPATCH_CHAINS['whole-foods'];
  if (t.includes('dry clean') || t.includes('laundry')) return DISPATCH_CHAINS['dry-cleaning'];
  if (t.includes('amazon') || t.includes('reorder') || t.includes('protein')) return DISPATCH_CHAINS['amazon-reorder'];
  if (t.includes('school') || t.includes('calendar') || t.includes('portal')) return DISPATCH_CHAINS['school-sync'];
  if (t.includes('doctor') || t.includes('appointment') || t.includes('dentist') || t.includes('pediatric'))
    return DISPATCH_CHAINS['appointment-book'];
  return null;
};
