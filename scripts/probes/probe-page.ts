/**
 * probes/probe-page.ts — one real browser visit, six assertions (PRD §7.5).
 *
 * WHY A BROWSER AT ALL. Two of the six assertions are unobservable from served HTML:
 *   - Does the tag FIRE? A <script> tag that CSP blocks still appears in the DOM. On
 *     June 16 a CSP rule blocked GA4 collect for a month while every dashboard looked
 *     healthy and every markup check passed. So `gtagFired` is true only when a
 *     /g/collect request COMPLETED with a <400 response — never when a tag exists.
 *   - Do console errors / unhandled rejections occur? Runtime events, by definition.
 * The other four (head truth, CWV, GEO, status) also benefit: CLAUDE.md records that
 * WebFetch strips <head> entirely, which is why audits kept reporting false "missing
 * meta description" flags.
 *
 * ANALYTICS SIDE EFFECTS, STATED PLAINLY. Loading a page fires a real GA4 page_view
 * from CI. That is unavoidable — it is the assertion. The affiliate check does NOT
 * add to that: it swaps `window.gtag` for a recorder for the duration of one
 * synthetic click, so the affiliate_click event is observed and never transmitted.
 * A probe that posted 50 fake affiliate clicks a night would corrupt the very data
 * the rest of the system reasons about.
 */

import type { Browser, BrowserContext, Page, Request, Response } from 'playwright';
import { toVitals, INSTRUMENT_SOURCE, type RawVitals } from './instrument.js';
import { faqPageValidity } from './assertions.js';
import { normalizePath } from './inventory.js';
import type { ProbeGeo, ProbeHead, ProbeRequest, ProbeResult } from './types.js';

export const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 TCA-godseye-probe/1.0';

export interface ProbeOptions {
  baseOrigin: string;
  /** Hard cap on one page's total budget. One slow page must never stall the run. */
  navTimeoutMs: number;
  /** How long to wait for analytics beacons after load before declaring them absent. */
  tagWaitMs: number;
  /** Replaces the document's Content-Security-Policy header. Acceptance-test only. */
  cspOverride: string | null;
  /** URL substrings to abort at the network layer. Acceptance-test only. */
  blockPatterns: string[];
}

// ─── Network classification ────────────────────────────────────────────────────

const ANALYTICS_HOSTS = [
  'google-analytics.com',
  'analytics.google.com',
  'googletagmanager.com',
  'stats.g.doubleclick.net',
  'clarity.ms',
  'impactcdn.com',
  'cloudflareinsights.com',
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function hostMatches(host: string, suffix: string): boolean {
  return host === suffix || host.endsWith(`.${suffix}`);
}

export function isInterestingRequest(url: string): boolean {
  const host = hostOf(url);
  return ANALYTICS_HOSTS.some((h) => hostMatches(host, h));
}

/** A GA4 measurement hit. `/g/collect` (GA4) and `/collect` (legacy) both count. */
export function isGtagCollect(url: string): boolean {
  const host = hostOf(url);
  if (!['google-analytics.com', 'analytics.google.com', 'stats.g.doubleclick.net'].some((h) => hostMatches(host, h))) {
    return false;
  }
  try {
    return new URL(url).pathname.includes('/collect');
  } catch {
    return false;
  }
}

export function isClarity(url: string): boolean {
  return hostMatches(hostOf(url), 'clarity.ms');
}

/** Fired = a request that COMPLETED with a usable response. Blocked/aborted → false. */
export function tagFiredFrom(requests: ProbeRequest[], match: (url: string) => boolean): boolean {
  return requests.some((r) => match(r.url) && r.status !== null && r.status < 400);
}

// ─── In-page extraction ────────────────────────────────────────────────────────

interface RawExtract {
  head: ProbeHead;
  robots: string | null;
  geo: Omit<ProbeGeo, 'faqPageSchemaValid'>;
  finalUrl: string;
}

/**
 * GEO MARKUP CONVENTION — read off the live pages, not invented:
 *   - Direct Answer: `<p class="text-xs …">Direct Answer</p>` label inside a bordered
 *     div, immediately followed by the answer paragraph
 *     (src/pages/review/gesture.astro:180, review/leap-plus.astro:165).
 *   - Citation capsule: the HTML comment `<!-- tca-aio-capsule -->` written by
 *     competitor-intelligence.ts, immediately preceding the capsule paragraph
 *     (review/gesture.astro:371, review/leap-plus.astro:189,
 *     office-chairs-for-tall-people.astro:209). It survives the Astro build and is
 *     present as a comment node in the live DOM.
 *   - Answer-first ordering: the Direct Answer block precedes the article's first <h2>.
 * Both markers require substantive following text (≥80 chars) so an empty label or a
 * stranded sentinel cannot pass.
 */
async function extract(page: Page): Promise<RawExtract> {
  return page.evaluate(() => {
    const clean = (node: Node | null): string =>
      ((node && node.textContent) || '').replace(/\s+/g, ' ').trim();

    const attrMap = (selector: string, key: 'property' | 'name'): Record<string, string> => {
      const out: Record<string, string> = {};
      document.querySelectorAll(selector).forEach((el) => {
        const k = el.getAttribute(key);
        if (k !== null) out[k] = el.getAttribute('content') ?? '';
      });
      return out;
    };

    const jsonLd: { type: string; valid: boolean; raw: string }[] = [];
    const jsonLdParseErrors: string[] = [];
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    scripts.forEach((script, i) => {
      const raw = (script.textContent ?? '').trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        // The raw snippet rides along so a predicate can still be named for the block.
        jsonLdParseErrors.push(`block ${i}: ${(err as Error).message} :: ${raw.slice(0, 300)}`);
        jsonLd.push({ type: '(unparseable)', valid: false, raw });
        return;
      }
      const flatten = (value: unknown): Record<string, unknown>[] => {
        if (Array.isArray(value)) return value.flatMap(flatten);
        if (value === null || typeof value !== 'object') return [];
        const obj = value as Record<string, unknown>;
        if (Array.isArray(obj['@graph'])) return (obj['@graph'] as unknown[]).flatMap(flatten);
        return [obj];
      };
      const nodes = flatten(parsed);
      const single = nodes.length === 1;
      for (const node of nodes) {
        const t = node['@type'];
        const type = typeof t === 'string' ? t : Array.isArray(t) ? t.join('+') : '(untyped)';
        jsonLd.push({ type, valid: type !== '(untyped)', raw: single ? raw : JSON.stringify(node) });
      }
    });

    const article = document.querySelector('article') ?? document.body;

    // Direct Answer
    let daEl: Element | null = null;
    for (const el of Array.from(article.querySelectorAll('p, h2, h3, h4, strong, span, div'))) {
      if (/^direct answer:?$/i.test(clean(el))) { daEl = el; break; }
    }
    let directAnswerPresent = false;
    if (daEl !== null) {
      const container = daEl.parentElement ?? article;
      const body = Array.from(container.querySelectorAll('p'))
        .filter((p) => p !== daEl)
        .map(clean)
        .find((t) => t.length >= 80);
      directAnswerPresent = body !== undefined;
    }

    // Citation capsule sentinel (comment node) + its substantive paragraph
    let citationCapsulePresent = false;
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_COMMENT);
    while (walker.nextNode()) {
      const comment = walker.currentNode;
      if (!/tca-aio-capsule/i.test(comment.nodeValue ?? '')) continue;
      let sibling: ChildNode | null = comment.nextSibling;
      while (sibling !== null && sibling.nodeType !== 1) sibling = sibling.nextSibling;
      if (sibling !== null && clean(sibling).length >= 80) { citationCapsulePresent = true; break; }
    }

    // Answer-first ordering
    const firstH2 = article.querySelector('h2');
    const answerFirstOrdering =
      daEl !== null &&
      (firstH2 === null ||
        (daEl.compareDocumentPosition(firstH2) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);

    const descEl = document.querySelector('meta[name="description"]');
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const robotsEl = document.querySelector('meta[name="robots"]');

    return {
      head: {
        title: document.title.trim() === '' ? null : document.title.trim(),
        metaDescription: descEl === null ? null : descEl.getAttribute('content'),
        canonical: canonicalEl === null ? null : canonicalEl.getAttribute('href'),
        og: attrMap('meta[property^="og:"]', 'property'),
        twitter: attrMap('meta[name^="twitter:"]', 'name'),
        jsonLd,
        jsonLdParseErrors,
      },
      robots: robotsEl === null ? null : robotsEl.getAttribute('content'),
      geo: { directAnswerPresent, citationCapsulePresent, answerFirstOrdering },
      finalUrl: location.href,
    };
  });
}

/**
 * Trusted input, so INP has something real to measure. A programmatic
 * `dispatchEvent` carries no interactionId and would leave INP at null forever —
 * which is why the probe uses Playwright's real keyboard and mouse.
 * The click point is verified in-page to sit on nothing clickable, so the probe
 * cannot navigate itself off the page under test.
 */
async function generateInteractions(page: Page): Promise<{ notes: string[]; dispatched: number }> {
  const notes: string[] = [];
  let dispatched = 0;
  try {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    dispatched += 2;
  } catch (error) {
    notes.push(`keyboard interaction failed: ${(error as Error).message}`);
  }

  try {
    const point = await page.evaluate(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let y = Math.round(h * 0.35); y < h - 10; y += 25) {
        for (let x = Math.round(w * 0.5); x < w - 10; x += 40) {
          const el = document.elementFromPoint(x, y);
          if (el === null) continue;
          if (el.closest('a, button, input, select, textarea, [role="button"], [onclick]')) continue;
          return { x, y };
        }
      }
      return null;
    });
    if (point === null) {
      notes.push('no click-safe point found — INP measured from keyboard interactions only');
    } else {
      await page.mouse.click(point.x, point.y);
      dispatched += 1;
    }
  } catch (error) {
    notes.push(`mouse interaction failed: ${(error as Error).message}`);
  }

  // Event-timing entries are delivered asynchronously after the interaction settles.
  await page.waitForTimeout(600);
  return { notes, dispatched };
}

/**
 * Does the document-level affiliate click listener attach AND emit?
 * `window.gtag` is swapped for a recorder that does NOT forward, so the synthetic
 * affiliate_click is observed and never reaches GA4. The anchor cancels its own
 * default in the target phase — after the page's capture-phase listener has run —
 * so nothing navigates to Amazon.
 */
async function checkAffiliateHandler(
  page: Page,
): Promise<{ measurable: boolean; emitted: boolean; reason: string | null; program: string | null }> {
  return page.evaluate(() => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag !== 'function') {
      return {
        measurable: false,
        emitted: false,
        reason: 'window.gtag is not a function — the affiliate handler cannot emit and the assertion is unmeasurable',
        program: null,
      };
    }
    const original = w.gtag;
    const calls: unknown[][] = [];
    w.gtag = (...args: unknown[]) => { calls.push(args); };   // recorder only: no transmission

    const a = document.createElement('a');
    a.href = 'https://www.amazon.com/dp/B0PROBE000?tag=tallchairadvi-20';
    a.dataset.affiliateCta = 'true';
    a.dataset.affiliateProgram = 'tca-probe-synthetic';
    a.dataset.ctaLabel = 'tca-probe synthetic click';
    a.dataset.ctaPosition = 'probe';
    a.textContent = 'tca-probe';
    a.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;';
    a.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    document.body.appendChild(a);
    try {
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } finally {
      a.remove();
      w.gtag = original;
    }

    const hit = calls.find((c) => c[0] === 'event' && c[1] === 'affiliate_click');
    const params = hit === undefined ? null : (hit[2] as Record<string, unknown> | undefined);
    return {
      measurable: true,
      emitted: hit !== undefined,
      reason: null,
      program: params !== undefined && params !== null && typeof params.affiliate_program === 'string'
        ? params.affiliate_program
        : null,
    };
  });
}

// ─── Status, without following anything ────────────────────────────────────────

export interface StatusCheck {
  status: number;
  location: string | null;
  error: string | null;
}

/**
 * `redirect: 'manual'` — the whole point. Default fetch() follows 301s silently, which
 * is how the C-1 false positive compared a redirect target to itself (see
 * scripts/redirect-map.ts and scripts/agents/audit.ts:36).
 */
export async function checkStatus(url: string, timeoutMs: number): Promise<StatusCheck> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { status: res.status, location: res.headers.get('location'), error: null };
  } catch (error) {
    return { status: 0, location: null, error: `status check failed: ${(error as Error).message}` };
  }
}

// ─── Result skeleton ───────────────────────────────────────────────────────────

export function emptyResult(path: string): ProbeResult {
  return {
    url: path,
    status: 0,
    redirectedTo: null,
    skipped: null,
    consoleErrors: [],
    unhandledRejections: [],
    network: { gtagFired: false, clarityLoaded: false, affiliateHandlerAttached: false, requests: [] },
    head: { title: null, metaDescription: null, canonical: null, og: {}, twitter: {}, jsonLd: [], jsonLdParseErrors: [] },
    vitals: { lcp: null, cls: null, inp: null },
    geo: { directAnswerPresent: false, citationCapsulePresent: false, faqPageSchemaValid: false, answerFirstOrdering: false },
    errors: [],
    healthy: true,
    observedAt: new Date().toISOString(),
    tags: { gtag: null, clarity: null, affiliate: null },
  };
}

/** A record that measured nothing. healthy:false, and every boolean explicitly unmeasured. */
export function unhealthyResult(path: string, status: number, reason: string, redirectedTo: string | null = null): ProbeResult {
  const r = emptyResult(path);
  r.status = status;
  r.redirectedTo = redirectedTo;
  r.errors.push(reason);
  r.healthy = false;
  return r;
}

// ─── The probe ─────────────────────────────────────────────────────────────────

export async function probeUrl(browser: Browser, path: string, opts: ProbeOptions): Promise<ProbeResult> {
  const target = `${opts.baseOrigin.replace(/\/$/, '')}${path}`;

  const check = await checkStatus(target, Math.min(opts.navTimeoutMs, 20_000));
  if (check.error !== null) return unhealthyResult(path, 0, check.error);
  if (check.status >= 300 && check.status < 400) {
    // Not declared in public/_redirects (those never reach here) — a live redirect the
    // repo does not know about. Recording it as a page would be the C-1 bug again.
    return unhealthyResult(
      path,
      check.status,
      `live ${check.status} redirect to ${check.location ?? '(no Location header)'} that public/_redirects does not declare — not audited as a page`,
      check.location,
    );
  }
  if (check.status >= 400 || check.status === 0) {
    return unhealthyResult(path, check.status, `HTTP ${check.status} — page not served, nothing to measure`);
  }

  const result = emptyResult(path);
  result.status = check.status;

  let context: BrowserContext | null = null;
  try {
    context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1366, height: 900 },
      // Cold context per URL: shared caches would inflate LCP into fiction.
      serviceWorkers: 'block',
    });
    context.setDefaultTimeout(opts.navTimeoutMs);
    await context.addInitScript(INSTRUMENT_SOURCE);

    const page = await context.newPage();
    const requests = new Map<string, ProbeRequest>();
    const keyOf = (r: Request) => `${r.method()} ${r.url()}`;

    page.on('request', (r) => {
      if (!isInterestingRequest(r.url())) return;
      requests.set(keyOf(r), { url: r.url(), status: null, method: r.method() });
    });
    page.on('response', (r: Response) => {
      const key = `${r.request().method()} ${r.url()}`;
      const existing = requests.get(key);
      if (existing !== undefined) existing.status = r.status();
      else if (!isInterestingRequest(r.url()) && r.status() >= 400) {
        requests.set(key, { url: r.url(), status: r.status(), method: r.request().method() });
      }
    });
    page.on('requestfailed', (r) => {
      const key = keyOf(r);
      if (requests.has(key)) return;                       // already recorded, status stays null
      requests.set(key, { url: r.url(), status: null, method: r.method() });
    });
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const loc = msg.location();
      result.consoleErrors.push({
        text: msg.text().slice(0, 1000),
        location: `${loc.url}:${loc.lineNumber}:${loc.columnNumber}`,
      });
    });
    page.on('pageerror', (err) => {
      result.consoleErrors.push({ text: `pageerror: ${err.message}`.slice(0, 1000), location: '(uncaught)' });
    });

    if (opts.blockPatterns.length > 0) {
      await page.route('**/*', async (route) => {
        const url = route.request().url();
        if (opts.blockPatterns.some((p) => url.includes(p))) return route.abort('blockedbyclient');
        return route.fallback();
      });
    }
    if (opts.cspOverride !== null) {
      // Rewrite the DOCUMENT's CSP header only, so the browser enforces the policy for
      // real — the same mechanism that produced the June 16 outage, reproduced on demand.
      await page.route(target, async (route) => {
        if (route.request().resourceType() !== 'document') return route.fallback();
        const response = await route.fetch({ maxRedirects: 0 });
        const headers = { ...response.headers(), 'content-security-policy': opts.cspOverride as string };
        await route.fulfill({ response, headers });
      });
    }

    const response = await page.goto(target, { waitUntil: 'load', timeout: opts.navTimeoutMs });
    if (response !== null) result.status = response.status();

    // Wait for the beacons rather than guessing a fixed sleep, but never past the cap.
    const deadline = Date.now() + opts.tagWaitMs;
    while (Date.now() < deadline) {
      const list = [...requests.values()];
      if (tagFiredFrom(list, isGtagCollect) && tagFiredFrom(list, isClarity)) break;
      await page.waitForTimeout(250);
    }

    const extracted = await extract(page);
    result.head = extracted.head;
    if (extracted.finalUrl !== target && normalizePath(extracted.finalUrl) !== path) {
      result.redirectedTo = extracted.finalUrl;
      result.errors.push(`browser landed on ${extracted.finalUrl}, not ${target}`);
    }

    const interactions = await generateInteractions(page);
    result.errors.push(...interactions.notes);

    const affiliate = await checkAffiliateHandler(page);
    result.network.affiliateHandlerAttached = affiliate.emitted;
    result.tags.affiliate = affiliate.measurable ? affiliate.emitted : null;
    if (!affiliate.measurable) {
      // A boolean cannot express "unmeasured", so say it out loud instead of lying.
      result.errors.push(affiliate.reason ?? 'affiliate handler unmeasurable');
      result.healthy = false;
    }

    const raw = (await page.evaluate(() => {
      const s = (window as unknown as { __tcaProbe?: RawVitals }).__tcaProbe;
      return s ?? null;
    })) as RawVitals | null;

    if (raw === null) {
      result.errors.push('instrumentation state missing — CWV and unhandled rejections were not measured');
      result.healthy = false;
    } else {
      result.vitals = toVitals(raw);
      result.unhandledRejections = raw.rejections;
      for (const note of raw.notes) result.errors.push(note);
      if (result.vitals.inp === null) {
        // Say precisely which of the two failures this is. "Below the threshold" and
        // "we never interacted" are different facts and the second is far worse.
        result.errors.push(
          interactions.dispatched === 0
            ? 'INP: no interaction could be dispatched on this page — not measured, reported as null'
            : `INP: ${interactions.dispatched} trusted interaction(s) dispatched, but no event-timing entry crossed the spec's 16 ms observable threshold — true INP is under 16 ms yet was not measured, so it is reported as null rather than 0`,
        );
      }
    }

    const list = [...requests.values()].slice(0, 80);
    result.network.requests = list;
    result.network.gtagFired = tagFiredFrom(list, isGtagCollect);
    result.network.clarityLoaded = tagFiredFrom(list, isClarity);
    result.tags.gtag = result.network.gtagFired;
    result.tags.clarity = result.network.clarityLoaded;

    const faq = faqPageValidity(result.head.jsonLd.map((b) => b.raw));
    result.geo = {
      ...extracted.geo,
      // null = no FAQPage node at all. Rendered false (the schema is not valid because
      // it is not there); `deriveFindings` only files when a node exists but is malformed.
      faqPageSchemaValid: faq === true,
    };

    if (extracted.robots !== null && /noindex/i.test(extracted.robots)) {
      result.skipped = 'noindex';
      result.errors.push(`meta robots = "${extracted.robots}" — not audited as an indexable page`);
    }

    result.observedAt = new Date().toISOString();
    return result;
  } catch (error) {
    result.errors.push(`probe aborted: ${(error as Error).message}`);
    result.healthy = false;
    return result;
  } finally {
    if (context !== null) await context.close().catch(() => { /* closing must never mask the result */ });
  }
}
