/**
 * lib/asin-liveness.ts — deciding whether an Amazon listing is actually dead.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE RULE: A FAILED FETCH IS NOT A DEAD PRODUCT
 *
 * Amazon serves bot walls, CAPTCHAs, 503s and empty shells to anything
 * automated, and it does so intermittently. If a fetch failure counted as
 * "dead", this detector would file findings against healthy money pages on any
 * bad night, someone would rip out the affiliate link that was earning, and the
 * detector would have cost real revenue.
 *
 * So `dead` requires a POSITIVE signal of unavailability. Everything else —
 * timeouts, bot walls, HTTP errors, unrecognisable pages — is `unknown`, and
 * `unknown` never files a finding. Same doctrine as `unevaluable` in the
 * predicate layer, `healthy:false` in the probe, and `diffPct: null` in P1.
 *
 * The registry states the same principle from the other direction:
 * verified-asins.json's `_NOT_AN_HTTP_CHECK` note explains it is deliberately an
 * offline allowlist because "a network check would fail randomly in CI and get
 * ignored". This does not replace that allowlist. The allowlist catches
 * invented ASINs at build time; this catches ones that were real and later died.
 *
 * Pure functions, so the judgement is testable without spending Firecrawl quota.
 */

export type Liveness =
  | { kind: 'alive'; title: string | null }
  | { kind: 'dead'; reason: string }
  | { kind: 'unknown'; reason: string };

/**
 * HARD dead markers — no product page rendered at all.
 *
 * These describe the whole document, so they cannot be contributed by a widget
 * somewhere down the page. Safe to trust on their own.
 */
const HARD_DEAD_MARKERS: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /page\s+not\s+found/i, reason: 'Amazon returned its "Page Not Found" page' },
  { pattern: /we\s*(couldn't|could\s+not|cannot)\s+find\s+that\s+page/i, reason: 'Amazon could not find the listing' },
  { pattern: /looking\s+for\s+something\?/i, reason: 'Amazon\'s dog "Page Not Found" page' },
];

/**
 * SOFT dead markers — a product page rendered, and something on it is unbuyable.
 *
 * THESE ARE NOT CONCLUSIVE ON THEIR OWN, and finding that out cost a false
 * positive on the very first live run.
 *
 * B0CQ4K1KXT (Hbada E3 Pro, linked from /best-office-chairs-under-500/) was
 * reported DEAD on "Currently unavailable". The phrase was real — but it
 * belonged to the "Newer Version Available" cross-sell block advertising the E3
 * Ultra. The E3 Pro itself rendered "Add to Cart", "Buy Now" and "In Stock" and
 * was perfectly purchasable. Acting on that finding would have removed a working
 * affiliate link from a money page: the detector destroying the revenue it
 * exists to protect.
 *
 * An Amazon page is a page about MANY products. Any unavailability phrase can
 * belong to a recommendation, a variant, a bundle or a newer model. So a soft
 * marker only counts when the page ALSO shows no way to buy anything — see
 * classifyListing.
 */
const SOFT_DEAD_MARKERS: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /currently\s+unavailable/i, reason: 'listing resolves but the product is currently unavailable' },
  { pattern: /this\s+item\s+is\s+no\s+longer\s+available/i, reason: 'listing explicitly retired' },
  { pattern: /is\s+not\s+available\s+in\s+your\s+(location|country)/i, reason: 'listing is region-restricted' },
  { pattern: /discontinued\s+by\s+(the\s+)?manufacturer/i, reason: 'discontinued by the manufacturer' },
];

/**
 * Proof the product can be bought right now.
 *
 * Deliberately separate from the softer ALIVE_MARKERS below: "customer reviews"
 * appears on a dead listing too, but a buy button does not. This is the set that
 * overrides a soft dead marker.
 */
const PURCHASABLE_MARKERS: readonly RegExp[] = [
  /add\s+to\s+cart/i,
  /buy\s+now/i,
  /add\s+to\s+basket/i,
  /\bin\s+stock\b/i,
];

/**
 * Weaker evidence that a real product page rendered.
 *
 * These appear on dead listings too, so they only make an `alive` verdict once
 * no dead marker of either strength has matched. They exist so a page that is
 * plainly a product page is not reported as `unknown` merely for lacking a buy
 * button (variant pages, for instance).
 */
const ALIVE_MARKERS: readonly RegExp[] = [
  /\bship(s|ping)\s+(to|from)\b/i,
  /roll\s+over\s+image\s+to\s+zoom/i,
  /customer\s+reviews?/i,
  /product\s+description/i,
];

/** Signals the fetch was intercepted rather than served. These are never `dead`. */
const BLOCKED_MARKERS: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /enter\s+the\s+characters\s+you\s+see/i, reason: 'CAPTCHA / bot wall' },
  { pattern: /not\s+a\s+robot/i, reason: 'bot wall' },
  { pattern: /automated\s+access/i, reason: 'automated-access block' },
  { pattern: /sorry,?\s+we\s+just\s+need\s+to\s+make\s+sure/i, reason: 'Amazon bot check' },
  { pattern: /to\s+discuss\s+automated\s+access/i, reason: 'Amazon automated-access notice' },
  { pattern: /service\s+unavailable/i, reason: 'upstream 503' },
];

/**
 * Classify one scraped listing.
 *
 * ORDER IS THE WHOLE DESIGN:
 *
 *   1. BLOCKED first. A bot wall can contain phrases from the dead list, and
 *      calling a bot wall "dead" is the expensive mistake.
 *   2. HARD dead next. These describe the whole document and cannot be
 *      contributed by a widget.
 *   3. PURCHASABLE next. If the page offers a way to buy, the product is alive
 *      no matter what an unavailability notice elsewhere on the page says. This
 *      step is what the B0CQ4K1KXT false positive taught.
 *   4. SOFT dead only now — an unavailability phrase AND no way to buy anything.
 *   5. Weak alive signals last, and anything else is `unknown`.
 */
export function classifyListing(markdown: string, opts: { httpOk: boolean; status?: number } = { httpOk: true }): Liveness {
  if (!opts.httpOk) {
    // Even a 404 from the scraper is NOT proof: Firecrawl surfaces its own errors
    // this way too. Only page CONTENT is trusted to declare a product dead.
    return {
      kind: 'unknown',
      reason: `fetch did not succeed${opts.status === undefined ? '' : ` (HTTP ${opts.status})`} — a failed fetch is not a dead product`,
    };
  }

  const text = markdown.trim();
  if (text === '') return { kind: 'unknown', reason: 'scraper returned an empty document' };

  const blocked = BLOCKED_MARKERS.find((m) => m.pattern.test(text));
  if (blocked !== undefined) {
    return { kind: 'unknown', reason: `${blocked.reason} — Amazon intercepted the request, so the listing was never seen` };
  }

  // DELIBERATELY NOT EXTRACTED FROM THE PAGE.
  //
  // Amazon's markdown does not put the product name in a predictable heading —
  // successive attempts returned "Product summary presents key product
  // information", "Customers who viewed this item also viewed" and "3-Year
  // Furniture Protection Plan", none of which is the product.
  //
  // data/verified-asins.json already carries the product name, put there by a
  // human who loaded the listing. Guessing a worse answer next to a verified one
  // is how a plausible-looking wrong label ends up in a finding, so this returns
  // null and asin-check.ts uses the registry name.
  const title = (): string | null => null;

  const hardDead = HARD_DEAD_MARKERS.find((m) => m.pattern.test(text));
  if (hardDead !== undefined) return { kind: 'dead', reason: hardDead.reason };

  // The override. A page that offers a way to buy is alive, whatever a
  // cross-sell block further down happens to say about a different product.
  if (PURCHASABLE_MARKERS.some((p) => p.test(text))) return { kind: 'alive', title: title() };

  const softDead = SOFT_DEAD_MARKERS.find((m) => m.pattern.test(text));
  if (softDead !== undefined) {
    return { kind: 'dead', reason: `${softDead.reason}, and the page offers no way to buy it` };
  }

  if (ALIVE_MARKERS.some((p) => p.test(text))) return { kind: 'alive', title: title() };

  return {
    kind: 'unknown',
    reason: 'page matched neither an unavailability notice nor ordinary product chrome — refusing to guess',
  };
}

/** Every distinct `/dp/<ASIN>` in a page's source. */
export function extractAsins(source: string): string[] {
  const found = new Set<string>();
  for (const m of source.matchAll(/\/dp\/([A-Z0-9]{10})/g)) found.add(m[1]);
  return [...found];
}
