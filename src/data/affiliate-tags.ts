/**
 * affiliate-tags.ts — which Amazon tracking ID each product is sold under.
 *
 * ─── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * Every affiliate link on the site used ONE tracking ID, `tallchairadvi-20`, so
 * all revenue arrived as a single undifferentiated number. That was survivable
 * until it wasn't: 89 clicks went to chairs in one period and produced ZERO
 * orders, while $100.40 arrived from products the site never linked to — and
 * with one tag there was no way to tell those two facts apart in the reports.
 *
 * Amazon no longer discloses WHAT an indirect purchase was. It does disclose
 * WHICH TRACKING ID referred it, and it attributes every purchase in the
 * 24-hour session to the tag on the link the visitor clicked. So the tag is the
 * only per-product-class revenue signal that still exists, and this file is the
 * map that makes it mean something.
 *
 * ─── WHY THREE CLASSES AND NOT THIRTY ────────────────────────────────────────
 *
 * ~7 orders a quarter. Split that thirty ways and every bucket reads zero, which
 * teaches nothing slowly. Three buckets plus a catch-all is the most this order
 * volume can actually resolve, and each one answers a question that changes what
 * gets written next:
 *
 *   chair      does a $500+ chair click EVER convert on Amazon? (89 → 0 so far)
 *   accessory  do sub-$300 items convert where chairs do not?
 *   desk       is the standing-desk category worth real effort?
 *
 * ─── WHY THE PAGE IS NOT THE UNIT ────────────────────────────────────────────
 *
 * Layout.astro already fires a GA4 `affiliate_click` carrying `page_path` and
 * `link_url` on every outbound click, so page-level click data is already
 * recoverable. Product class is the half that no other instrument can see.
 *
 * ─── ADDING A PRODUCT ────────────────────────────────────────────────────────
 *
 * Add the ASIN here. `npm run lint:affiliate` fails on any Amazon link whose
 * ASIN is not in this map, so a new page cannot ship untagged or mistagged —
 * the same reason strategy-rules.json exists rather than a paragraph asking
 * agents to behave.
 */

export type AffiliateClass = 'chair' | 'accessory' | 'desk';

/** Amazon tracking IDs, created 2026-08-13. */
export const AFFILIATE_TAGS: Record<AffiliateClass, string> = {
  chair: 'tcachair-20',
  accessory: 'tcaaccessory-20',
  desk: 'tcadesk-20',
};

/**
 * The original site-wide ID. NOT deleted and NOT retired: every order before
 * 2026-08-13 is attributed to it, and deleting it would orphan that history.
 * It stays as the catch-all for any Amazon link that is not a product link.
 */
export const LEGACY_TAG = 'tallchairadvi-20';

/**
 * ASIN → class. The full inventory as of 2026-08-13; 111 links, 24 products.
 *
 * `chair` means a complete office chair someone sits in. A headrest or a lumbar
 * cushion FOR a chair is an `accessory` — the distinction that matters is the
 * price band and the buying decision, not the room it ends up in.
 */
export const ASIN_CLASS: Record<string, AffiliateClass> = {
  // ── Chairs — $500+, considered purchase, the ones that are not converting ──
  B00TYE4QXU: 'chair', // Steelcase Leap Plus
  B016OIF2JU: 'chair', // Steelcase Gesture
  B01N32UFNT: 'chair', // Herman Miller Aeron Size C
  B0DQTRVSHS: 'chair', // Sihoo Doro S300
  B08PPVCCST: 'chair', // Crandall Remanufactured Leap V2
  B0116W5BG8: 'chair', // La-Z-Boy Trafford
  B0CQ4K1KXT: 'chair', // Hbada E3 Pro

  // ── Accessories — sub-$300, bought online without sitting in them first ──
  B0CYWXYZKF: 'accessory', // MABOZOO Extra Thick Chair Cushion
  B0CYF58KZQ: 'accessory', // McCarty's SacroEase MSE1
  B0001X22QG: 'accessory', // DMI Extra-Tall Lumbar Cushion
  B07VTQTTDG: 'accessory', // Booster seat cushion
  B0B86SYST5: 'accessory', // Engineered Now HW Aeron Headrest
  B00MV8C8TA: 'accessory', // Engineered Now H4 Aeron Classic Headrest
  B00L2IJNMK: 'accessory', // Atlas Aeron Headrest
  B09T78LQYQ: 'accessory', // Ergotron LX Vertical Stacking Dual Monitor Arm
  B01MXYN33U: 'accessory', // Ergotron HX Monitor Arm
  B00DB42YIS: 'accessory', // Ergotron LX Tall Pole Monitor Arm
  B01BO42XK0: 'accessory', // VIVO Extra Tall 39" Pole Monitor Mount
  B07B42X78Q: 'accessory', // UPLIFT Desk Large Keyboard Tray
  B01BRLJPZQ: 'accessory', // Uncaged Ergonomics KT2-b keyboard tray
  B0051MOFP8: 'accessory', // Fellowes Professional Series Sit/Stand keyboard tray

  // ── Desks — the expansion hypothesis, currently 491 impressions a quarter ──
  B076HB7NZS: 'desk', // Vari Tall 40 Standing Desk Converter
  B07322VF6S: 'desk', // CHANGEdesk Tall manual converter
  B01BT3DK12: 'desk', // Electric CHANGEdesk Tall converter
};

/**
 * The tracking ID a given Amazon URL must carry.
 *
 * Non-product links (`/s?k=...` searches) have no ASIN to look up, so they are
 * classified by what they search FOR — all three on the site today are chairs.
 * Returns null when the URL is an Amazon link this map does not know about,
 * which is the case `lint:affiliate` turns into a build-blocking error rather
 * than silently defaulting to the catch-all.
 */
export function classForUrl(url: string): AffiliateClass | null {
  const dp = /amazon\.com\/dp\/([A-Z0-9]{10})/.exec(url);
  if (dp !== null) return ASIN_CLASS[dp[1]] ?? null;
  if (/amazon\.com\/s\?/.test(url)) return SEARCH_CLASS[searchKey(url)] ?? null;
  return null;
}

/** `k=` parameter of an Amazon search URL, decoded. */
export function searchKey(url: string): string {
  const k = /[?&]k=([^&"']+)/.exec(url);
  return k === null ? '' : decodeURIComponent(k[1].replace(/\+/g, ' '));
}

/** The three search links on the site. All chairs; listed so none is implicit. */
export const SEARCH_CLASS: Record<string, AffiliateClass> = {
  'ofm essentials 200 big tall office chair': 'chair',
  'branch ergonomic office chair': 'chair',
  'flexispot bs14 ergonomic chair': 'chair',
};
