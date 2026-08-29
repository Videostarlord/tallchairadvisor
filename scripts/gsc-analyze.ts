/**
 * gsc-analyze.ts
 * GSC Intelligence Engine — transforms raw GSC data into structured, ranked intelligence.
 *
 * Reads:  data/gsc/latest.json
 * Writes: data/gsc/analysis.json
 *         data/gsc/history/YYYY-MM-DD.json
 *         wiki/pages/concepts/gsc-intelligence.md
 *
 * Usage: npm run gsc:analyze
 * Runs Monday after gsc-pull.ts in the weekly workflow.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { appendWikiLog, writeWikiPage, today, computeIntentWeightAdjustments } from './agents/wiki-utils.js';
import type { IntentType } from './agents/wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageRow {
  page: string;
  clicks: number | null;
  impressions: number;
  ctr: number;
  position: number | null;
}

interface QueryRow {
  query: string;
  clicks: number | null;
  impressions: number;
  ctr: number;
  position: number | null;
}

interface PageQueryRow {
  page: string;
  query: string;
  clicks: number | null;
  impressions: number;
  ctr: number;
  position: number | null;
}

interface DeviceRow {
  device: string;
  page: string;
  clicks: number | null;
  impressions: number;
  ctr: number;
  position: number | null;
}

interface DailyRow {
  date: string;
  clicks: number | null;
  impressions: number;
  ctr: number;
  position: number | null;
}

interface GSCData {
  pulledAt: string;
  dateRange: { start: string; end: string; days: number };
  totals: { clicks: number; impressions: number; ctr: number; avgPosition: number | null } | null;
  pages: PageRow[];
  queries: QueryRow[];
  pageQueries: PageQueryRow[];
  deviceSplit?: DeviceRow[];
  dailyTrend?: DailyRow[];
}

// ─── Scoring Constants ────────────────────────────────────────────────────────

// Industry CTR benchmarks by position (organic, desktop baseline)
const EXPECTED_CTR_BY_POS: Record<number, number> = {
  1: 0.35, 2: 0.18, 3: 0.12, 4: 0.08, 5: 0.06,
  6: 0.04, 7: 0.03, 8: 0.025, 9: 0.022, 10: 0.02,
};

function expectedCTR(pos: number): number {
  const p = Math.min(Math.max(Math.floor(pos), 1), 10);
  return EXPECTED_CTR_BY_POS[p] ?? 0.015;
}

const BUYER_INTENT_TERMS = ['best', 'buy', 'vs', 'review', 'alternative', 'worth', 'price', 'cheap', 'under $', 'affordable', 'budget', 'top'];
const SPEC_TERMS = ['height', 'seat', 'depth', 'width', 'weight limit', 'dimensions', 'inches', 'cm', 'lbs', 'adjustable', 'recline', 'lumbar'];
const BRAND_TERMS = ['steelcase', 'herman miller', 'gesture', 'aeron', 'leap', 'sihoo', 'doro', 'haworth', 'humanscale'];
const AIO_INDICATOR_TERMS = [...SPEC_TERMS, 'how to', 'what is', 'definition', 'rule', 'formula', 'standard'];
const INFO_TERMS = ['how', 'why', 'what', 'guide', 'does', 'difference', 'explain'];
const STOPWORDS = new Set(['for', 'the', 'a', 'an', 'to', 'of', 'in', 'is', 'are', 'with', 'and', 'or', 'on', 'at', 'my', 'me', 'i', 'do', 'does', 'can', 'will', 'how', 'what', 'why', 'when', 'which']);

// Loaded once at startup — adjusts base weights from observed intervention outcomes
let _intentWeightAdjustments: Record<IntentType, number> = { buyer: 1.0, brand: 1.0, spec: 1.0, informational: 1.0 };

function classifyIntent(query: string): { type: IntentType; value: number } {
  const q = query.toLowerCase();
  const a = _intentWeightAdjustments;
  if (BUYER_INTENT_TERMS.some(t => q.includes(t))) return { type: 'buyer', value: 3.0 * a.buyer };
  if (BRAND_TERMS.some(t => q.includes(t))) return { type: 'brand', value: 2.0 * a.brand };
  if (SPEC_TERMS.some(t => q.includes(t))) return { type: 'spec', value: 1.5 * a.spec };
  return { type: 'informational', value: 1.0 * a.informational };
}

function normalizeQuery(query: string): string {
  return query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .join(' ');
}

// ─── URL Normalization ────────────────────────────────────────────────────────

function withTrailingSlash(path: string): string {
  // Enforce trailing slash unless the path has a file extension
  return /\.[a-z]{2,4}$/.test(path) ? path : path.endsWith('/') ? path : path + '/';
}

// Redirect map parsed from public/_redirects. Folds impressions on redirected
// (merged/deleted) URLs into their live target so scored opportunities never
// point at a 301'd page. Historical GSC impressions persist ~90 days after a
// redirect goes live, so without this the analyzer keeps scoring phantom URLs
// (and can hand execute-fixes a task whose .astro file no longer exists).
function loadRedirectMap(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const raw = readFileSync(resolve(ROOT, 'public/_redirects'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [source, target] = trimmed.split(/\s+/);
      if (!source || !target) continue;
      // Only simple path→path rules — skip domain-level, splat, placeholder redirects
      if (/[*:]/.test(source) || /[*:]/.test(target)) continue;
      if (/^https?:/i.test(source) || /^https?:/i.test(target)) continue;
      if (!source.startsWith('/') || !target.startsWith('/')) continue;
      const s = withTrailingSlash(source);
      const t = withTrailingSlash(target);
      if (s === t) continue; // trailing-slash normalizer — no-op for scoring
      map.set(s, t);
    }
  } catch {
    // No _redirects file (or unreadable) — leave map empty, normalize as before
  }
  return map;
}

const REDIRECT_MAP = loadRedirectMap();

// Follow a redirect chain to its final live target (guards against loops).
function resolveRedirect(path: string): string {
  let current = path;
  const seen = new Set<string>();
  while (REDIRECT_MAP.has(current) && !seen.has(current)) {
    seen.add(current);
    current = REDIRECT_MAP.get(current)!;
  }
  return current;
}

function normalizeUrl(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  return resolveRedirect(withTrailingSlash(path));
}

function mergeCanonicalDuplicates<T extends { page: string; clicks: number | null; impressions: number; position: number | null }>(rows: T[], keyFn?: (row: T) => string): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = keyFn ? keyFn(row) : normalizeUrl(row.page);
    const existing = map.get(key);
    if (existing) {
      existing.clicks = (existing.clicks ?? 0) + (row.clicks ?? 0);
      existing.impressions += row.impressions;
      if (row.position !== null && existing.position !== null) {
        existing.position = Math.min(existing.position, row.position);
      }
    } else {
      map.set(key, { ...row, page: normalizeUrl(row.page) });
    }
  }
  return Array.from(map.values());
}

// ─── Junk Query Filter ────────────────────────────────────────────────────────

const JUNK_PATTERNS = [/knee brace/i, /wheelchair/i, /standing desk mat/i, /neck brace/i];
const isJunkQuery = (query: string) => JUNK_PATTERNS.some(p => p.test(query));

// ─── Module 1: CTR Leak Detector ─────────────────────────────────────────────

export interface CTRLeak {
  page: string;
  query: string;
  impressions: number;
  position: number;
  actualCTR: number;
  expectedCTR: number;
  ctrGap: number;
  lostClicksPerWeek: number;
  leakScore: number;
  aioSuspect: boolean;
  intentType: IntentType;
}

function detectCTRLeaks(pageQueries: PageQueryRow[], days: number): CTRLeak[] {
  return pageQueries
    .filter(pq => pq.impressions >= 15 && pq.position !== null && pq.position <= 20 && !isJunkQuery(pq.query))
    .map(pq => {
      const pos = pq.position!;
      const eCTR = expectedCTR(pos);
      const aCTR = (pq.ctr ?? 0) / 100;
      const ctrGap = Math.max(0, eCTR - aCTR);
      const intent = classifyIntent(pq.query);
      const lostClicksPerWeek = (ctrGap * pq.impressions / days) * 7;
      const q = pq.query.toLowerCase();
      const aioSuspect = pos <= 6 && aCTR < 0.005 && AIO_INDICATOR_TERMS.some(t => q.includes(t));
      return {
        page: pq.page,
        query: pq.query,
        impressions: pq.impressions,
        position: pos,
        actualCTR: parseFloat((aCTR * 100).toFixed(2)),
        expectedCTR: parseFloat((eCTR * 100).toFixed(2)),
        ctrGap: parseFloat((ctrGap * 100).toFixed(2)),
        lostClicksPerWeek: parseFloat(lostClicksPerWeek.toFixed(2)),
        leakScore: parseFloat((ctrGap * pq.impressions * intent.value).toFixed(1)),
        aioSuspect,
        intentType: intent.type,
      };
    })
    .filter(l => l.leakScore > 0)
    .sort((a, b) => b.leakScore - a.leakScore)
    .slice(0, 30);
}

// ─── Module 2: Query Intent Clusterer ────────────────────────────────────────

export interface QueryCluster {
  fingerprint: string;
  representativeQuery: string;
  queries: string[];
  pages: string[];
  totalImpressions: number;
  totalClicks: number;
  avgPosition: number;
  clusterCTR: number;
  intentType: IntentType;
  cannibalized: boolean;
  opportunityScore: number;
}

function clusterQueries(pageQueries: PageQueryRow[]): QueryCluster[] {
  const buckets = new Map<string, PageQueryRow[]>();

  for (const pq of pageQueries) {
    const normalized = normalizeQuery(pq.query);
    const words = normalized.split(' ').slice(0, 3).sort();
    const fingerprint = words.join('-');
    if (!fingerprint) continue;
    const existing = buckets.get(fingerprint) ?? [];
    existing.push(pq);
    buckets.set(fingerprint, existing);
  }

  return Array.from(buckets.entries())
    .filter(([, rows]) => rows.length >= 2 || rows[0].impressions >= 30)
    .map(([fingerprint, rows]) => {
      const totalImpr = rows.reduce((s, r) => s + r.impressions, 0);
      const totalClicks = rows.reduce((s, r) => s + (r.clicks ?? 0), 0);
      const pages = [...new Set(rows.map(r => r.page))];
      const validPositions = rows.filter(r => r.position !== null);
      const avgPos = validPositions.length > 0
        ? validPositions.reduce((s, r) => s + r.position!, 0) / validPositions.length
        : 99;
      const sorted = [...rows].sort((a, b) => b.impressions - a.impressions);
      const intent = classifyIntent(sorted[0].query);
      return {
        fingerprint,
        representativeQuery: sorted[0].query,
        queries: [...new Set(rows.map(r => r.query))],
        pages,
        totalImpressions: totalImpr,
        totalClicks,
        avgPosition: parseFloat(avgPos.toFixed(1)),
        clusterCTR: totalImpr > 0 ? parseFloat(((totalClicks / totalImpr) * 100).toFixed(2)) : 0,
        intentType: intent.type,
        cannibalized: pages.length > 1,
        opportunityScore: parseFloat(((1 / Math.max(avgPos, 1)) * totalImpr * intent.value).toFixed(1)),
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// ─── Module 3: Opportunity Scorer ────────────────────────────────────────────

export interface PageOpportunity {
  page: string;
  impressions: number;
  position: number;
  clicks: number;
  ctr: number;
  opportunityScore: number;
  opportunityType: 'near-p1' | 'ctr-leak' | 'content-depth' | 'affiliate-capture' | 'machine-retrieval' | 'low-signal';
  topQueries: string[];
  buyerIntentImpressions: number;
  recommendation: string;
  /** Share of this page's impressions GSC will name a query for. null = not probed. */
  attributionRatio: number | null;
  /** Impressions a human could plausibly click. Falls back to raw when unprobed. */
  addressableImpressions: number;
}

/**
 * Pages whose impressions are overwhelmingly machine retrieval are excluded from
 * opportunity scoring rather than ranked by it.
 *
 * THE BUG THIS FIXES. Scoring used RAW impressions, so /knee-pain-seat-depth/ —
 * 39,186 impressions at position 5.6 — scored 13,995 and was the site's #1
 * recommendation every single week. Probing GSC for that page's own queries
 * returns 133 rows totalling 1,635 impressions: **4.2%**. The remaining 95.8%
 * carry no query, no country and no device, and the named ones are machine-shaped
 * ("cornell ergonomics office chair seat pan depth 2 inches behind knees",
 * "...ergonomics source", and literal prompt fragments like "context: location:
 * united kingdom"). They rank 1.5-2.5 and take ZERO clicks across hundreds of
 * impressions, because there is no human on the other end to click.
 *
 * The site-wide unattributable CTR is 0.275%; this page's is 0.035% — 8x worse
 * than its own site's baseline. It is not a CTR failure to be fixed. No title,
 * meta or content change converts a retrieval bot.
 *
 * WHY A THRESHOLD AND NOT A MULTIPLIER. Discounting the score by the ratio would
 * still leave this page ranked (13,995 x 0.042 = 588, mid-table) and would still
 * invite work on it. The honest output is not "smaller opportunity" — it is "not
 * an opportunity", with the reason attached.
 *
 * 15% and 1000 impressions: every genuinely human page in the 2026-08-28 pull
 * sits at 17-28% attribution, and the machine-dominated ones at 2-10%. The gap
 * is wide, so the exact cut is not load-bearing; the impression floor keeps
 * low-volume pages, where the ratio is noise, out of the classification.
 */
const MACHINE_RETRIEVAL_MAX_ATTRIBUTION = 0.15;
const MACHINE_RETRIEVAL_MIN_IMPRESSIONS = 1000;

function scoreOpportunities(
  pages: PageRow[],
  pageQueries: PageQueryRow[],
  ctrLeaks: CTRLeak[],
  pageAttribution: { page: string; attributionRatio: number; attributableImpressions: number }[] = []
): PageOpportunity[] {
  const attrByPage = new Map(pageAttribution.map(a => [a.page, a]));
  return pages
    .filter(p => p.impressions >= 30 && p.position !== null)
    .map(p => {
      const pos = p.position!;
      const myPQ = pageQueries.filter(pq => pq.page === p.page);
      const myLeaks = ctrLeaks.filter(l => l.page === p.page);
      const topQueries = [...myPQ].sort((a, b) => b.impressions - a.impressions).slice(0, 3).map(pq => pq.query);
      const buyerImpr = myPQ
        .filter(pq => classifyIntent(pq.query).type === 'buyer')
        .reduce((s, pq) => s + pq.impressions, 0);

      const attr = attrByPage.get(p.page) ?? null;
      const attributionRatio = attr === null ? null : attr.attributionRatio;
      const addressableImpressions = attr === null ? p.impressions : attr.attributableImpressions;

      let opportunityType: PageOpportunity['opportunityType'];
      let opportunityScore: number;
      let recommendation: string;

      if (
        attributionRatio !== null &&
        attributionRatio < MACHINE_RETRIEVAL_MAX_ATTRIBUTION &&
        p.impressions >= MACHINE_RETRIEVAL_MIN_IMPRESSIONS
      ) {
        // Checked FIRST, ahead of near-p1, because this page would otherwise
        // match near-p1 on exactly the numbers that make it a phantom: a good
        // position and a huge impression count.
        opportunityType = 'machine-retrieval';
        opportunityScore = 0;
        recommendation =
          `${p.impressions} impressions but only ${(attributionRatio * 100).toFixed(1)}% carry a named query ` +
          `(${addressableImpressions} addressable) — this is AI/agent retrieval, not human demand. ` +
          `NOT a CTR problem and no title/meta/content change will convert it. ` +
          `Treat as a GEO asset: the page owns a fact cluster assistants cite. Judge it on AI-assistant ` +
          `referral sessions in GA4, never on CTR.`;
      } else if (pos >= 5 && pos <= 15 && p.impressions >= 100) {
        opportunityType = 'near-p1';
        // ADDRESSABLE, not raw. Raw impressions rank pages by how much machine
        // retrieval they attract, which is the opposite of what this list is for.
        opportunityScore = (addressableImpressions / pos) * 2;
        recommendation =
          `pos ${pos.toFixed(1)} with ${addressableImpressions} addressable impr` +
          `${attributionRatio !== null && attributionRatio < 0.5 ? ` (of ${p.impressions} total — ${(attributionRatio * 100).toFixed(0)}% named)` : ''}` +
          ` — expand content depth + internal links to push into top 5`;
      } else if (myLeaks.length > 0 && pos <= 10) {
        opportunityType = 'ctr-leak';
        opportunityScore = myLeaks.reduce((s, l) => s + l.leakScore, 0);
        const topLeak = myLeaks[0];
        recommendation = `CTR ${p.ctr}% far below expected — rewrite title/meta to match "${topLeak.query}" intent${topLeak.aioSuspect ? ' (AIO suppression suspected)' : ''}`;
      } else if (pos >= 15 && p.impressions >= 200) {
        opportunityType = 'content-depth';
        opportunityScore = p.impressions * 0.5;
        recommendation = `pos ${pos.toFixed(1)} with ${p.impressions} impr — content too thin or lacks E-E-A-T signals, needs depth upgrade`;
      } else if (buyerImpr >= 50 && p.ctr < 2) {
        opportunityType = 'affiliate-capture';
        opportunityScore = buyerImpr * 1.5;
        recommendation = `${buyerImpr} buyer-intent impressions at low CTR — add comparison table + affiliate CTAs`;
      } else {
        opportunityType = 'low-signal';
        opportunityScore = 0;
        recommendation = 'insufficient signal — monitor for 2+ weeks before acting';
      }

      return {
        page: p.page, impressions: p.impressions, position: pos,
        clicks: p.clicks ?? 0, ctr: p.ctr,
        opportunityScore: parseFloat(opportunityScore.toFixed(1)),
        opportunityType, topQueries, buyerIntentImpressions: buyerImpr, recommendation,
        attributionRatio, addressableImpressions,
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// ─── Module 4: Cannibalization Detector ──────────────────────────────────────

export interface Cannibalization {
  query: string;
  pages: string[];
  positions: number[];
  impressions: number;
  risk: 'high' | 'medium';
}

function detectCannibalization(pageQueries: PageQueryRow[]): Cannibalization[] {
  const byNormalized = new Map<string, PageQueryRow[]>();
  for (const pq of pageQueries) {
    const key = normalizeQuery(pq.query);
    if (!key) continue;
    const existing = byNormalized.get(key) ?? [];
    existing.push(pq);
    byNormalized.set(key, existing);
  }

  const results: Cannibalization[] = [];
  for (const [, rows] of byNormalized.entries()) {
    const uniquePages = [...new Set(rows.map(r => r.page))];
    if (uniquePages.length < 2) continue;
    const totalImpr = rows.reduce((s, r) => s + r.impressions, 0);
    if (totalImpr < 15) continue;
    const positions = uniquePages
      .map(pg => rows.find(r => r.page === pg)?.position ?? 99)
      .filter(p => p !== 99);
    if (positions.length < 2) continue;
    const posSpread = Math.max(...positions) - Math.min(...positions);
    const sorted = [...rows].sort((a, b) => b.impressions - a.impressions);
    results.push({
      query: sorted[0].query,
      pages: uniquePages,
      positions,
      impressions: totalImpr,
      risk: posSpread < 5 ? 'high' : 'medium',
    });
  }

  return results.sort((a, b) => b.impressions - a.impressions);
}

// ─── Module 5: Affiliate Opportunity Detector ─────────────────────────────────

export interface AffiliateOpportunity {
  page: string;
  buyerIntentImpressions: number;
  topBuyerQueries: string[];
  affiliateUrgency: 'high' | 'medium' | 'low';
}

function detectAffiliateOpportunities(pages: PageRow[], pageQueries: PageQueryRow[]): AffiliateOpportunity[] {
  return pages
    .map(p => {
      const myPQ = pageQueries.filter(pq => pq.page === p.page);
      const buyerPQ = myPQ.filter(pq => classifyIntent(pq.query).type === 'buyer');
      const buyerImpr = buyerPQ.reduce((s, pq) => s + pq.impressions, 0);
      const topBuyerQueries = [...buyerPQ].sort((a, b) => b.impressions - a.impressions).slice(0, 3).map(pq => pq.query);
      const urgency: AffiliateOpportunity['affiliateUrgency'] = buyerImpr >= 200 ? 'high' : buyerImpr >= 50 ? 'medium' : 'low';
      return { page: p.page, buyerIntentImpressions: buyerImpr, topBuyerQueries, affiliateUrgency: urgency };
    })
    .filter(a => a.buyerIntentImpressions >= 20)
    .sort((a, b) => b.buyerIntentImpressions - a.buyerIntentImpressions);
}

// ─── Module 6: Site Trend / Velocity ─────────────────────────────────────────

export interface SiteTrend {
  currentWeekImpressions: number;
  previousWeekImpressions: number;
  impressionVelocity: number;
  currentWeekClicks: number;
  previousWeekClicks: number;
  clickVelocity: number;
  positionTrend: 'improving' | 'stable' | 'declining';
  currentAvgPosition: number;
  previousAvgPosition: number;
  positionDelta: number;
  summaryLine: string;
}

function computeTrend(dailyTrend: DailyRow[]): SiteTrend | null {
  if (!dailyTrend || dailyTrend.length < 7) return null;

  const sorted = [...dailyTrend].sort((a, b) => a.date.localeCompare(b.date));
  const recent7 = sorted.slice(-7);
  const previous7 = sorted.slice(-14, -7);

  const sumImpr = (rows: DailyRow[]) => rows.reduce((s, r) => s + r.impressions, 0);
  const sumClicks = (rows: DailyRow[]) => rows.reduce((s, r) => s + (r.clicks ?? 0), 0);
  const avgPos = (rows: DailyRow[]) => {
    const valid = rows.filter(r => r.position !== null);
    return valid.length > 0 ? valid.reduce((s, r) => s + r.position!, 0) / valid.length : 0;
  };

  const cImpr = sumImpr(recent7);
  const pImpr = sumImpr(previous7);
  const cClicks = sumClicks(recent7);
  const pClicks = sumClicks(previous7);
  const cPos = avgPos(recent7);
  const pPos = avgPos(previous7);
  const imprVel = pImpr > 0 ? parseFloat(((cImpr - pImpr) / pImpr * 100).toFixed(1)) : 0;
  const clickVel = pClicks > 0 ? parseFloat(((cClicks - pClicks) / pClicks * 100).toFixed(1)) : 0;
  const posDelta = parseFloat((cPos - pPos).toFixed(1));
  const positionTrend = posDelta < -0.5 ? 'improving' : posDelta > 0.5 ? 'declining' : 'stable';

  const imprDir = imprVel > 0 ? `up ${imprVel}%` : imprVel < 0 ? `down ${Math.abs(imprVel)}%` : 'flat';
  const clickDir = clickVel > 0 ? `up ${clickVel}%` : clickVel < 0 ? `down ${Math.abs(clickVel)}%` : 'flat';
  const posDir = positionTrend === 'improving' ? `improving (${Math.abs(posDelta)} spots)` : positionTrend === 'declining' ? `declining (${Math.abs(posDelta)} spots)` : 'stable';

  return {
    currentWeekImpressions: cImpr,
    previousWeekImpressions: pImpr,
    impressionVelocity: imprVel,
    currentWeekClicks: cClicks,
    previousWeekClicks: pClicks,
    clickVelocity: clickVel,
    positionTrend,
    currentAvgPosition: parseFloat(cPos.toFixed(1)),
    previousAvgPosition: parseFloat(pPos.toFixed(1)),
    positionDelta: posDelta,
    summaryLine: `Impressions ${imprDir} WoW (${cImpr} vs ${pImpr}), clicks ${clickDir} (${cClicks} vs ${pClicks}), avg position ${posDir}`,
  };
}

// ─── Module 7: Device Intelligence ───────────────────────────────────────────

export interface DeviceIntelligence {
  mobileImpressions: number;
  desktopImpressions: number;
  tabletImpressions: number;
  mobileShare: number;
  mobileCTR: number;
  desktopCTR: number;
  ctrGap: number;
  mobileUnderperformingPages: string[];
  summaryLine: string;
}

function analyzeDeviceSplit(deviceSplit: DeviceRow[]): DeviceIntelligence | null {
  if (!deviceSplit || deviceSplit.length === 0) return null;

  const byDevice = new Map<string, DeviceRow[]>();
  for (const row of deviceSplit) {
    const d = row.device.toUpperCase();
    const existing = byDevice.get(d) ?? [];
    existing.push(row);
    byDevice.set(d, existing);
  }

  const aggregate = (rows: DeviceRow[]) => ({
    impressions: rows.reduce((s, r) => s + r.impressions, 0),
    clicks: rows.reduce((s, r) => s + (r.clicks ?? 0), 0),
  });

  const mobile = aggregate(byDevice.get('MOBILE') ?? []);
  const desktop = aggregate(byDevice.get('DESKTOP') ?? []);
  const tablet = aggregate(byDevice.get('TABLET') ?? []);
  const totalImpr = mobile.impressions + desktop.impressions + tablet.impressions;

  const mobileCTR = mobile.impressions > 0 ? parseFloat(((mobile.clicks / mobile.impressions) * 100).toFixed(2)) : 0;
  const desktopCTR = desktop.impressions > 0 ? parseFloat(((desktop.clicks / desktop.impressions) * 100).toFixed(2)) : 0;
  const ctrGap = parseFloat((desktopCTR - mobileCTR).toFixed(2));

  // Pages where mobile CTR is less than half of desktop CTR
  const mobileByPage = new Map<string, DeviceRow>();
  const desktopByPage = new Map<string, DeviceRow>();
  for (const row of byDevice.get('MOBILE') ?? []) mobileByPage.set(row.page, row);
  for (const row of byDevice.get('DESKTOP') ?? []) desktopByPage.set(row.page, row);

  const mobileUnderperformingPages: string[] = [];
  for (const [page, dRow] of desktopByPage.entries()) {
    const mRow = mobileByPage.get(page);
    if (!mRow || dRow.impressions < 30) continue;
    const mCTR = mRow.impressions > 0 ? mRow.clicks! / mRow.impressions : 0;
    const dCTR = dRow.impressions > 0 ? dRow.clicks! / dRow.impressions : 0;
    if (mCTR < dCTR * 0.5) mobileUnderperformingPages.push(page);
  }

  return {
    mobileImpressions: mobile.impressions,
    desktopImpressions: desktop.impressions,
    tabletImpressions: tablet.impressions,
    mobileShare: totalImpr > 0 ? parseFloat(((mobile.impressions / totalImpr) * 100).toFixed(1)) : 0,
    mobileCTR, desktopCTR, ctrGap,
    mobileUnderperformingPages,
    summaryLine: `Mobile: ${totalImpr > 0 ? ((mobile.impressions / totalImpr) * 100).toFixed(0) : 0}% of impressions | Mobile CTR ${mobileCTR}% vs Desktop ${desktopCTR}% (gap: ${ctrGap > 0 ? '+' : ''}${ctrGap}pp)`,
  };
}

// ─── Phase 2 Module 1: Query Entropy Analysis ─────────────────────────────────

export interface QueryEntropyEntry {
  page: string;
  entropy: number;
  queryCount: number;
  regime: 'concentrated' | 'balanced' | 'fragmented';
}

function computeQueryEntropy(pageQueries: PageQueryRow[]): QueryEntropyEntry[] {
  const byPage = new Map<string, PageQueryRow[]>();
  for (const pq of pageQueries) {
    const existing = byPage.get(pq.page) ?? [];
    existing.push(pq);
    byPage.set(pq.page, existing);
  }

  const results: QueryEntropyEntry[] = [];
  for (const [page, rows] of byPage.entries()) {
    if (rows.length < 2) continue;

    const clusterImpressions = new Map<string, number>();
    let totalImpressions = 0;
    for (const pq of rows) {
      const normalized = normalizeQuery(pq.query);
      const words = normalized.split(' ').filter(w => w).slice(0, 3).sort();
      const fingerprint = words.join('-');
      if (!fingerprint) continue;
      clusterImpressions.set(fingerprint, (clusterImpressions.get(fingerprint) ?? 0) + pq.impressions);
      totalImpressions += pq.impressions;
    }

    if (totalImpressions === 0 || clusterImpressions.size < 2) continue;

    let entropy = 0;
    for (const impr of clusterImpressions.values()) {
      const p = impr / totalImpressions;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    const regime: QueryEntropyEntry['regime'] = entropy > 3.5 ? 'fragmented' : entropy < 1.5 ? 'concentrated' : 'balanced';
    results.push({
      page,
      entropy: parseFloat(entropy.toFixed(3)),
      queryCount: clusterImpressions.size,
      regime,
    });
  }

  return results.sort((a, b) => b.entropy - a.entropy);
}

// ─── Phase 2 Module 2: Impression Gravity Scoring ────────────────────────────

export interface ImpressionGravityEntry {
  page: string;
  clusterCount: number;
  totalImpressions: number;
  gravityScore: number;
  hubCandidate: boolean;
}

function computeImpressionGravity(clusters: QueryCluster[], pages: PageRow[]): ImpressionGravityEntry[] {
  const pageClusterCount = new Map<string, number>();
  for (const cluster of clusters) {
    for (const page of cluster.pages) {
      pageClusterCount.set(page, (pageClusterCount.get(page) ?? 0) + 1);
    }
  }

  return pages
    .filter(p => p.impressions > 0)
    .map(p => {
      const clusterCount = pageClusterCount.get(p.page) ?? 0;
      const gravityScore = parseFloat((clusterCount * Math.log(Math.max(p.impressions, 1))).toFixed(2));
      return {
        page: p.page,
        clusterCount,
        totalImpressions: p.impressions,
        gravityScore,
        hubCandidate: clusterCount >= 8,
      };
    })
    .sort((a, b) => b.gravityScore - a.gravityScore);
}

// ─── Phase 2 Module 3: Informational → Commercial Progression Mapper ──────────

export interface IntentTransition {
  page: string;
  infoImpressions: number;
  commercialImpressions: number;
  transitionOpportunity: boolean;
  recommendation: string;
}

function detectIntentTransitions(pageQueries: PageQueryRow[]): IntentTransition[] {
  const byPage = new Map<string, PageQueryRow[]>();
  for (const pq of pageQueries) {
    const existing = byPage.get(pq.page) ?? [];
    existing.push(pq);
    byPage.set(pq.page, existing);
  }

  const results: IntentTransition[] = [];
  for (const [page, rows] of byPage.entries()) {
    const totalImpr = rows.reduce((s, r) => s + r.impressions, 0);
    if (totalImpr < 30) continue;

    const infoRows = rows.filter(r => INFO_TERMS.some(t => r.query.toLowerCase().includes(t)));
    const infoImpr = infoRows.reduce((s, r) => s + r.impressions, 0);

    const commercialRows = rows.filter(r => classifyIntent(r.query).type === 'buyer');
    const commercialImpr = commercialRows.reduce((s, r) => s + r.impressions, 0);
    const commercialClicks = commercialRows.reduce((s, r) => s + (r.clicks ?? 0), 0);

    const infoShare = totalImpr > 0 ? infoImpr / totalImpr : 0;
    const transitionOpportunity = infoShare > 0.6 && commercialImpr >= 20 && commercialClicks === 0;

    const topCommercialQueries = [...commercialRows]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 2)
      .map(r => r.query);

    const recommendation = transitionOpportunity
      ? `Add verdict/recommendation section — this page attracts researchers who are ready to evaluate. Target commercial queries: ${topCommercialQueries.join(', ')}`
      : 'No conversion gap detected';

    if (commercialImpr > 0) {
      results.push({ page, infoImpressions: infoImpr, commercialImpressions: commercialImpr, transitionOpportunity, recommendation });
    }
  }

  return results.sort((a, b) => b.commercialImpressions - a.commercialImpressions);
}

// ─── Phase 2 Module 4: AIO Content Recommendations ────────────────────────────

export interface AIORecommendation {
  page: string;
  query: string;
  impressions: number;
  position: number;
  recommendedStructure: string[];
  priority: 'high' | 'medium';
}

function buildAIORecommendations(ctrLeaks: CTRLeak[]): AIORecommendation[] {
  return ctrLeaks
    .filter(l => l.aioSuspect)
    .map(l => {
      const q = l.query.toLowerCase();
      let recommendedStructure: string[];

      if (SPEC_TERMS.some(t => q.includes(t))) {
        recommendedStructure = [
          'Put the specific number/spec at the top of the page in a prominent answer box',
          'Add a definition callout box answering the spec directly',
          'Add a citation capsule: 3 sentences, no pronouns, standalone',
        ];
      } else if (q.includes('how') || q.includes('step') || q.includes('adjust')) {
        recommendedStructure = [
          'Add a numbered step answer immediately below the H1',
          'Add FAQ entry with direct answer',
          'Add citation capsule',
        ];
      } else {
        recommendedStructure = [
          'Add a direct definition in the opening paragraph',
          'Add FAQ entry',
          'Add citation capsule',
        ];
      }

      return {
        page: l.page,
        query: l.query,
        impressions: l.impressions,
        position: l.position,
        recommendedStructure,
        priority: l.impressions >= 100 ? 'high' : 'medium',
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

// ─── Phase 2 Module 5: History-Based Page Velocity ───────────────────────────

export interface PageVelocityEntry {
  page: string;
  currentPosition: number;
  previousPosition: number;
  positionDelta: number;
  currentImpressions: number;
  previousImpressions: number;
  impressionDelta: number;
  trend: 'rising' | 'stable' | 'falling';
}

function computePageVelocity(): PageVelocityEntry[] | null {
  const histDir = resolve(ROOT, 'data/gsc/history');
  if (!existsSync(histDir)) return null;

  const files = readdirSync(histDir).filter(f => f.endsWith('.json')).sort();
  // Need at least 2 snapshots to compare; current run's file is written after buildAnalysis()
  if (files.length < 2) return null;

  type PageEntry = { page: string; position: number; impressions: number };
  const loadPages = (filename: string): PageEntry[] => {
    try {
      const data = JSON.parse(readFileSync(resolve(histDir, filename), 'utf-8'));
      // Normalize on load so redirects added after a snapshot was written fold
      // old URLs into their live target (keeps velocity matching consistent).
      return ((data.opportunities ?? []) as PageEntry[]).map(p => ({ ...p, page: normalizeUrl(p.page) }));
    } catch {
      return [];
    }
  };

  const currentPages = loadPages(files[files.length - 1]);
  const previousPages = loadPages(files[files.length - 2]);

  if (currentPages.length === 0 || previousPages.length === 0) return null;

  const previousMap = new Map(previousPages.map(p => [p.page, p]));

  const results: PageVelocityEntry[] = [];
  for (const curr of currentPages) {
    const prev = previousMap.get(curr.page);
    if (!prev) continue;

    const positionDelta = parseFloat((curr.position - prev.position).toFixed(1));
    const impressionDelta = curr.impressions - prev.impressions;
    const impressionPct = prev.impressions > 0 ? impressionDelta / prev.impressions : 0;

    let trend: PageVelocityEntry['trend'];
    if (impressionPct > 0.1 && positionDelta < 0) {
      trend = 'rising';
    } else if (impressionPct < -0.1 || positionDelta > 2) {
      trend = 'falling';
    } else {
      trend = 'stable';
    }

    results.push({
      page: curr.page,
      currentPosition: curr.position,
      previousPosition: prev.position,
      positionDelta,
      currentImpressions: curr.impressions,
      previousImpressions: prev.impressions,
      impressionDelta,
      trend,
    });
  }

  return results.length > 0
    ? results.sort((a, b) => Math.abs(b.positionDelta) - Math.abs(a.positionDelta))
    : null;
}

// ─── Module 6: Content Gap vs Competitors ────────────────────────────────────

export interface ContentGap {
  query: string;
  tcaPage: string;
  tcaPosition: number;
  competitorDomain: string;
  competitorPosition: number;
  impressions: number;
  gapSeverity: 'high' | 'medium' | 'low';
}

export function detectContentGaps(
  pageQueries: PageQueryRow[],
  intelligencePath: string
): ContentGap[] {
  if (!existsSync(intelligencePath)) return [];
  let competitorKeywords: { query: string; competitorDomain: string; competitorPosition: number }[];
  try {
    const intel = JSON.parse(readFileSync(intelligencePath, 'utf-8'));
    competitorKeywords = intel.competitorKeywords ?? [];
  } catch { return []; }
  if (competitorKeywords.length === 0) return [];

  const gscByQuery = new Map<string, PageQueryRow[]>();
  for (const pq of pageQueries) {
    const key = pq.query.toLowerCase();
    const existing = gscByQuery.get(key) ?? [];
    existing.push(pq);
    gscByQuery.set(key, existing);
  }

  const gaps: ContentGap[] = [];
  for (const ck of competitorKeywords) {
    const rows = gscByQuery.get(ck.query.toLowerCase()) ?? [];
    for (const row of rows) {
      if (row.position === null || row.position < 10 || row.position > 50) continue;
      if (row.impressions < 10) continue;
      const severity: ContentGap['gapSeverity'] =
        row.position >= 20 ? 'high' : row.position >= 15 ? 'medium' : 'low';
      gaps.push({
        query: ck.query,
        tcaPage: row.page,
        tcaPosition: parseFloat(row.position.toFixed(1)),
        competitorDomain: ck.competitorDomain,
        competitorPosition: ck.competitorPosition,
        impressions: row.impressions,
        gapSeverity: severity,
      });
    }
  }
  return gaps.sort((a, b) => b.impressions - a.impressions);
}

// ─── Module 7: Decay Detection ────────────────────────────────────────────────

export interface DecayAlert {
  page: string;
  consecutiveWeeksDeclined: number;    // 8+ to qualify
  positionAtStart: number;             // position N weeks ago (start of declining run)
  positionNow: number;                 // current position
  totalPositionLoss: number;           // positionNow - positionAtStart (positive = worse ranking)
  impressions: number;                 // current week impressions from latest snapshot
  cooldownBypass: true;                // always true — signals enforcePlanConstraints bypass
}

/** Detect pages whose ranking has declined for 8+ consecutive weeks.
 *
 *  NOTE: GSC positions are 90-day rolling averages, so weekly position deltas
 *  are naturally dampened. A per-week delta > 3 positions over 8 consecutive
 *  weeks represents a significant structural decline even accounting for this lag.
 *
 *  Guard: requires 9+ history snapshots (8 adjacent pairs). Returns [] until
 *  ~July 2026 when enough weekly snapshots have accumulated.
 */
export function detectDecayingPages(): DecayAlert[] {
  const histDir = resolve(ROOT, 'data/gsc/history');
  if (!existsSync(histDir)) return [];

  const files = readdirSync(histDir).filter(f => f.endsWith('.json')).sort();
  // Need 9 snapshots to detect 8 consecutive weekly declines (8 pairs of adjacent weeks)
  // Until ~July 2026 (only 4 history files exist), this function always returns [].
  if (files.length < 9) return [];

  type PageEntry = { page: string; position: number; impressions: number };
  const loadPages = (f: string): PageEntry[] => {
    try {
      // Normalize on load so post-snapshot redirects fold old URLs into their target.
      return ((JSON.parse(readFileSync(resolve(histDir, f), 'utf-8')).opportunities ?? []) as PageEntry[])
        .map(p => ({ ...p, page: normalizeUrl(p.page) }));
    } catch { return []; }
  };

  // Build per-page position series across all history files (index = file order = week order)
  const pagePositions = new Map<string, (number | null)[]>();
  for (let i = 0; i < files.length; i++) {
    const pages = loadPages(files[i]);
    for (const p of pages) {
      if (!pagePositions.has(p.page)) {
        // Fill prior weeks with null if page didn't appear in earlier snapshots
        pagePositions.set(p.page, new Array(i).fill(null));
      }
      pagePositions.get(p.page)!.push(p.position);
    }
    // Pages not seen in this week get null appended
    for (const [, series] of pagePositions) {
      if (series.length === i) series.push(null);
    }
  }

  const latestPages = loadPages(files[files.length - 1]);
  const latestMap = new Map(latestPages.map(p => [p.page, p]));

  const alerts: DecayAlert[] = [];
  for (const [page, positions] of pagePositions.entries()) {
    if (positions.length < 9) continue;

    // Count trailing consecutive weeks where position worsened by more than 3 vs prior week
    // "more than 3 positions" = per-week delta > 3 (higher number = worse ranking)
    let consecutive = 0;
    for (let i = positions.length - 1; i > 0; i--) {
      const curr = positions[i];
      const prev = positions[i - 1];
      if (curr === null || prev === null) break;
      if (curr - prev > 3) {
        consecutive++;
      } else {
        break;
      }
    }
    if (consecutive < 8) continue;

    const latest = latestMap.get(page);
    if (!latest) continue;

    const startIdx = positions.length - 1 - consecutive;
    const positionAtStart = positions[startIdx] ?? latest.position;

    alerts.push({
      page,
      consecutiveWeeksDeclined: consecutive,
      positionAtStart,
      positionNow: positions[positions.length - 1] ?? latest.position,
      totalPositionLoss: (positions[positions.length - 1] ?? latest.position) - positionAtStart,
      impressions: latest.impressions,
      cooldownBypass: true,
    });
  }
  return alerts.sort((a, b) => b.consecutiveWeeksDeclined - a.consecutiveWeeksDeclined);
}

// ─── Module 8: Internal Link Rebalancing ─────────────────────────────────────

export interface InternalLinkGap {
  page: string;            // URL slug e.g. "/review/gesture/"
  impressions: number;     // 90-day GSC impressions — why this page needs links
  inboundLinkCount: number; // current count from source file scan
  threshold: number;       // 3 (site policy from wiki/pages/concepts/internal-linking.md)
}

/** Scan all .astro source files and count inbound links to each slug.
 *  Adapted from verify-deploy.ts href scanning pattern (lines 167-181).
 *  Uses synchronous readdirSync walk — gsc-analyze.ts has no async context here.
 *
 *  Self-link guard: hrefs in file X that point to X's own slug are excluded.
 *  This prevents breadcrumbs/canonicals in a page from inflating its own inbound count.
 */
export function computeInboundLinkMap(root: string): Map<string, number> {
  const pagesDir = resolve(root, 'src/pages');
  if (!existsSync(pagesDir)) return new Map();

  const inboundCount = new Map<string, number>();

  function walk(dir: string): string[] {
    const entries: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        entries.push(...walk(full));
      } else if (entry.endsWith('.astro')) {
        entries.push(full);
      }
    }
    return entries;
  }

  const files = walk(pagesDir);

  for (const file of files) {
    // Derive this file's own slug for self-link exclusion
    const rel = file.slice(pagesDir.length + 1); // e.g. "review/gesture.astro"
    const ownSlug = '/' + rel
      .replace(/\.astro$/, '')
      .replace(/\/index$/, '')
      .replace(/^index$/, '') + '/';

    const content = readFileSync(file, 'utf-8');
    const hrefs = [...content.matchAll(/href="(\/[^"#?]+)"/g)];
    for (const [, href] of hrefs) {
      // Skip asset hrefs
      if (href.startsWith('/images/') || href.startsWith('/assets/')) continue;
      if (/\.(png|ico|svg|jpg|jpeg|webp|gif|css|js|xml|txt|json|pdf)$/i.test(href)) continue;
      // Normalize to trailing slash
      const normalized = href.endsWith('/') ? href : href + '/';
      // Self-link guard: skip if this href points to this file's own slug
      if (normalized === ownSlug) continue;
      inboundCount.set(normalized, (inboundCount.get(normalized) ?? 0) + 1);
    }
  }

  return inboundCount;
}

// ─── Executive Summary Builder ────────────────────────────────────────────────

function buildExecutiveSummary(params: {
  siteTrend: SiteTrend | null;
  opportunities: PageOpportunity[];
  ctrLeaks: CTRLeak[];
  affiliateOpportunities: AffiliateOpportunity[];
  cannibalization: Cannibalization[];
  clusters: QueryCluster[];
}) {
  const { siteTrend, opportunities, ctrLeaks, affiliateOpportunities, cannibalization } = params;

  const topOpp = opportunities.find(o => o.opportunityType !== 'low-signal');
  const topLeak = ctrLeaks[0];
  const highAffiliate = affiliateOpportunities.find(a => a.affiliateUrgency === 'high');
  const highCannibal = cannibalization.find(c => c.risk === 'high');
  const aioSuspects = ctrLeaks.filter(l => l.aioSuspect).length;

  return {
    weeklyMomentum: siteTrend?.summaryLine ?? 'Trend data unavailable (requires 14+ daily data points)',
    topOpportunity: topOpp
      ? `${topOpp.page}: ${topOpp.opportunityType} (score ${topOpp.opportunityScore}) — ${topOpp.recommendation}`
      : 'No high-signal opportunities detected this week',
    biggestLeak: topLeak
      ? `${topLeak.page} | "${topLeak.query}" | ${topLeak.impressions} impr, pos ${topLeak.position}, ${topLeak.actualCTR}% CTR (expected ${topLeak.expectedCTR}%) | ~${topLeak.lostClicksPerWeek} clicks/wk lost${topLeak.aioSuspect ? ' | AIO SUSPECT' : ''}`
      : 'No CTR leaks detected above threshold',
    affiliateAlert: highAffiliate
      ? `${highAffiliate.page}: ${highAffiliate.buyerIntentImpressions} buyer-intent impr | queries: ${highAffiliate.topBuyerQueries.slice(0, 2).join(', ')}`
      : null,
    cannibalizationAlert: highCannibal
      ? `"${highCannibal.query}" ranking from ${highCannibal.pages.length} pages: ${highCannibal.pages.join(', ')}`
      : null,
    aioSuspects,
  };
}

// ─── Wiki Intelligence Digest Writer ─────────────────────────────────────────

function writeIntelligenceDigest(ROOT: string, analysis: ReturnType<typeof buildAnalysis>) {
  const {
    executiveSummary, ctrLeaks, opportunities, affiliateOpportunities, cannibalization,
    deviceIntelligence, queryEntropy, impressionGravity, intentTransitions,
    aioRecommendations, pageVelocity, contentGap,
  } = analysis;

  const leakRows = ctrLeaks.slice(0, 5).map(l =>
    `| ${l.page} | "${l.query}" | ${l.impressions} impr | pos ${l.position} | ${l.actualCTR}% (exp ${l.expectedCTR}%) | ~${l.lostClicksPerWeek}/wk${l.aioSuspect ? ' ⚠ AIO' : ''} |`
  ).join('\n');

  const oppRows = opportunities.filter(o => o.opportunityType !== 'low-signal').slice(0, 5).map(o =>
    `| ${o.page} | ${o.opportunityType} | ${o.impressions} impr | pos ${o.position} | ${o.recommendation} |`
  ).join('\n');

  const affiliateRows = affiliateOpportunities.slice(0, 3).map(a =>
    `- **${a.page}** [${a.affiliateUrgency}]: ${a.buyerIntentImpressions} buyer-intent impr | queries: ${a.topBuyerQueries.slice(0, 2).join(', ')}`
  ).join('\n') || '_None above threshold_';

  const cannibRows = cannibalization.slice(0, 3).map(c =>
    `- **"${c.query}"** [${c.risk} risk]: ${c.pages.join(' vs ')} (${c.impressions} impr)`
  ).join('\n') || '_No conflicts detected_';

  const deviceSection = deviceIntelligence
    ? deviceIntelligence.summaryLine + (deviceIntelligence.mobileUnderperformingPages.length > 0
        ? `\n\nMobile underperforming pages: ${deviceIntelligence.mobileUnderperformingPages.join(', ')}`
        : '')
    : '_Device data unavailable — requires new gsc-pull run_';

  // Query Entropy section
  const fragmented = queryEntropy.filter(e => e.regime === 'fragmented').slice(0, 5);
  const concentrated = [...queryEntropy].sort((a, b) => a.entropy - b.entropy).filter(e => e.regime === 'concentrated').slice(0, 3);
  const entropySection = queryEntropy.length === 0
    ? '_Insufficient query data_'
    : [
        '**Most fragmented pages** (topic generalists, low per-cluster authority):',
        '| Page | Entropy | Clusters | Regime |',
        '|------|---------|----------|--------|',
        ...fragmented.map(e => `| ${e.page} | ${e.entropy} | ${e.queryCount} | ${e.regime} |`),
        fragmented.length === 0 ? '| _None above fragmentation threshold_ | | | |' : '',
        '',
        '**Most concentrated pages** (single-keyword risk):',
        '| Page | Entropy | Clusters | Regime |',
        '|------|---------|----------|--------|',
        ...concentrated.map(e => `| ${e.page} | ${e.entropy} | ${e.queryCount} | ${e.regime} |`),
        concentrated.length === 0 ? '| _None below concentration threshold_ | | | |' : '',
      ].filter(l => l !== undefined).join('\n');

  // Impression Gravity section
  const hubs = impressionGravity.filter(g => g.hubCandidate);
  const gravitySection = impressionGravity.length === 0
    ? '_No pages with sufficient cluster coverage_'
    : hubs.length > 0
      ? hubs.map(g => `- **${g.page}**: ${g.clusterCount} clusters, gravity score ${g.gravityScore}`).join('\n')
      : '_No hub candidates (none with ≥8 distinct clusters)_';

  // Intent Transitions section
  const transitionPages = intentTransitions.filter(t => t.transitionOpportunity);
  const transitionSection = intentTransitions.length === 0
    ? '_Insufficient data_'
    : transitionPages.length > 0
      ? transitionPages.map(t =>
          `- **${t.page}**: ${t.infoImpressions} info impr / ${t.commercialImpressions} commercial impr | ${t.recommendation}`
        ).join('\n')
      : '_No transition opportunities detected_';

  // AIO Recommendations section
  const aioSection = aioRecommendations.length === 0
    ? '_No AIO suspects in current CTR leak set_'
    : aioRecommendations.map(r =>
        [
          `**${r.page}** — "${r.query}" [${r.priority}] (${r.impressions} impr, pos ${r.position})`,
          ...r.recommendedStructure.map(s => `  - ${s}`),
        ].join('\n')
      ).join('\n\n');

  // Page Velocity section
  const velocitySection = pageVelocity === null
    ? '_Insufficient history — activates after 2+ Monday runs_'
    : pageVelocity.slice(0, 5).map(v =>
        `| ${v.page} | ${v.currentPosition} | ${v.previousPosition} | ${v.positionDelta > 0 ? '+' : ''}${v.positionDelta} | ${v.impressionDelta > 0 ? '+' : ''}${v.impressionDelta} | ${v.trend} |`
      ).join('\n');

  const velocityTable = pageVelocity !== null
    ? `| Page | Cur Pos | Prev Pos | Pos Δ | Impr Δ | Trend |\n|------|---------|----------|-------|--------|-------|\n${velocitySection}`
    : velocitySection;

  // Content Gap vs Competitors section
  const gapSection = !contentGap || contentGap.length === 0
    ? '_No content gaps detected — either intelligence.json has no competitorKeywords yet, or all competitor top-3 queries are ranked outside TCA position 10-50_'
    : contentGap.slice(0, 8).map(g =>
        `| ${g.tcaPage} | "${g.query}" | pos ${g.tcaPosition} | ${g.competitorDomain} pos ${g.competitorPosition} | ${g.impressions} impr | ${g.gapSeverity} |`
      ).join('\n');

  const gapTable = contentGap && contentGap.length > 0
    ? `| TCA Page | Query | TCA Position | Competitor | Impressions | Severity |\n|----------|-------|-------------|------------|-------------|----------|\n${gapSection}`
    : gapSection;

  const digest = `---
type: concept
last_updated: ${today()}
sources: [data/gsc/analysis.json]
tags: [gsc, intelligence, opportunities, ctr, weekly]
---

# GSC Weekly Intelligence Digest

**Generated ${today()} by gsc-analyze.ts** | Read this before writing strategy.ts prompt.

---

## Momentum

${executiveSummary.weeklyMomentum}

---

## Top Opportunities

| Page | Type | Impressions | Position | Action |
|------|------|-------------|----------|--------|
${oppRows || '_No high-signal opportunities above threshold_'}

---

## Critical CTR Leaks (query-level)

| Page | Query | Impr | Position | CTR (exp) | Lost clicks/wk |
|------|-------|------|----------|-----------|----------------|
${leakRows || '_No CTR leaks above threshold_'}

${executiveSummary.aioSuspects > 0 ? `**${executiveSummary.aioSuspects} AIO suspects detected** — these positions rank well but earn zero clicks, likely due to AI Overviews capturing the SERP.` : ''}

---

## Affiliate Alerts

${affiliateRows}

---

## Cannibalization Risks

${cannibRows}

---

## Device Split

${deviceSection}

---

## Query Entropy

${entropySection}

---

## Impression Gravity (Hub Candidates)

${gravitySection}

---

## Informational → Commercial Transition Gaps

${transitionSection}

---

## AIO Action Items

${aioSection}

---

## Page Velocity

${velocityTable}

---

## Content Gap vs Competitors

${gapTable}

---

## Raw Intelligence File

Full structured data (ranked queues, all clusters): \`data/gsc/analysis.json\`
`;

  writeWikiPage(ROOT, 'pages/concepts/gsc-intelligence.md', digest);
  console.log('  Wiki updated → wiki/pages/concepts/gsc-intelligence.md');
}

// ─── Main Analysis Builder ────────────────────────────────────────────────────

function buildAnalysis(gsc: GSCData) {
  const days = gsc.dateRange.days;
  const ctrLeaks = detectCTRLeaks(gsc.pageQueries, days);
  const clusters = clusterQueries(gsc.pageQueries);
  // pageAttribution is optional on the schema: snapshots archived before
  // 2026-08-28 predate it. Absent is passed through as an EMPTY probe set, which
  // scoreOpportunities reads as `attributionRatio: null` and falls back to raw
  // impressions — the old behaviour, explicitly, rather than treating an old
  // snapshot as though every page were 0% attributable.
  const probed = (gsc as { pageAttribution?: { page: string; attributionRatio: number; attributableImpressions: number }[] }).pageAttribution;
  const opportunities = scoreOpportunities(gsc.pages, gsc.pageQueries, ctrLeaks, probed === undefined ? [] : probed);
  const cannibalization = detectCannibalization(gsc.pageQueries);
  const affiliateOpportunities = detectAffiliateOpportunities(gsc.pages, gsc.pageQueries);
  const siteTrend = gsc.dailyTrend ? computeTrend(gsc.dailyTrend) : null;
  const deviceIntelligence = gsc.deviceSplit ? analyzeDeviceSplit(gsc.deviceSplit) : null;
  const executiveSummary = buildExecutiveSummary({ siteTrend, opportunities, ctrLeaks, affiliateOpportunities, cannibalization, clusters });

  // Phase 2 modules
  const queryEntropy = computeQueryEntropy(gsc.pageQueries);
  const impressionGravity = computeImpressionGravity(clusters, gsc.pages);
  const intentTransitions = detectIntentTransitions(gsc.pageQueries);
  const aioRecommendations = buildAIORecommendations(ctrLeaks);
  const pageVelocity = computePageVelocity();

  // Module 6: Content Gap vs Competitors
  const intelligencePath = resolve(ROOT, 'data/competitors/intelligence.json');
  const contentGap = detectContentGaps(gsc.pageQueries, intelligencePath);

  // Module 7: Decay Detection (CONT-02)
  const decayAlerts = detectDecayingPages();

  return {
    generatedAt: new Date().toISOString(),
    dateRange: gsc.dateRange,
    siteTrend,
    deviceIntelligence,
    ctrLeaks,
    opportunities,
    clusters,
    cannibalization,
    affiliateOpportunities,
    executiveSummary,
    queryEntropy,
    impressionGravity,
    intentTransitions,
    aioRecommendations,
    pageVelocity,
    contentGap,
    decayAlerts,  // CONT-02: empty array until 9+ history snapshots exist (~July 2026)
  };
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  const latestPath = resolve(ROOT, 'data/gsc/latest.json');
  if (!existsSync(latestPath)) {
    console.error('data/gsc/latest.json not found — run gsc:pull first');
    process.exit(1);
  }

  console.log('Reading data/gsc/latest.json...');
  const gsc: GSCData = JSON.parse(readFileSync(latestPath, 'utf-8'));

  // Warn if input data is stale
  const pulledAt = new Date(gsc.pulledAt ?? 0);
  const ageHours = (Date.now() - pulledAt.getTime()) / 3600000;
  if (ageHours > 72) {
    console.warn(`[gsc-analyze] WARNING: latest.json is ${ageHours.toFixed(0)}h old — run gsc:pull for fresh data`);
  }

  // Load intent weight adjustments from reconciled intervention outcomes (no-op if no data yet)
  _intentWeightAdjustments = computeIntentWeightAdjustments(ROOT);
  const adjustedTypes = Object.entries(_intentWeightAdjustments).filter(([, v]) => v !== 1.0).map(([k, v]) => `${k}:${v}x`);
  if (adjustedTypes.length > 0) console.log(`[gsc-analyze] Intent weight adjustments from outcomes: ${adjustedTypes.join(', ')}`);

  // Normalize URLs to enforce trailing slash and merge canonical duplicates
  gsc.pages = mergeCanonicalDuplicates(gsc.pages);
  gsc.pageQueries = mergeCanonicalDuplicates(gsc.pageQueries, pq => `${normalizeUrl(pq.page)}|${pq.query}`);
  if (gsc.deviceSplit) gsc.deviceSplit = mergeCanonicalDuplicates(gsc.deviceSplit);

  console.log(`  ${gsc.pages.length} pages | ${gsc.queries.length} queries | ${gsc.pageQueries.length} page-query pairs`);
  console.log(`  Device rows: ${gsc.deviceSplit?.length ?? 0} | Daily trend rows: ${gsc.dailyTrend?.length ?? 0}`);

  console.log('\nRunning intelligence modules...');
  const analysis = buildAnalysis(gsc);

  console.log(`  CTR leaks detected: ${analysis.ctrLeaks.length}`);
  console.log(`  Query clusters: ${analysis.clusters.length}`);
  console.log(`  Opportunities scored: ${analysis.opportunities.filter(o => o.opportunityType !== 'low-signal').length} actionable`);
  console.log(`  Cannibalization conflicts: ${analysis.cannibalization.length}`);
  console.log(`  Affiliate opportunities: ${analysis.affiliateOpportunities.length}`);
  console.log(`  AIO suspects: ${analysis.executiveSummary.aioSuspects}`);
  console.log(`  Query entropy pages: ${analysis.queryEntropy.length}`);
  console.log(`  Impression gravity hub candidates: ${analysis.impressionGravity.filter(g => g.hubCandidate).length}`);
  console.log(`  Intent transition opportunities: ${analysis.intentTransitions.filter(t => t.transitionOpportunity).length}`);
  console.log(`  AIO recommendations: ${analysis.aioRecommendations.length}`);
  console.log(`  Page velocity: ${analysis.pageVelocity === null ? 'null (insufficient history)' : `${analysis.pageVelocity.length} pages tracked`}`);
  console.log(`  Content gaps: ${analysis.contentGap.length} (${analysis.contentGap.filter(g => g.gapSeverity === 'high').length} high severity)`);
  console.log(`  Decay alerts: ${analysis.decayAlerts.length} (requires 9+ snapshots — ${analysis.decayAlerts.length === 0 ? 'none detected' : 'BYPASS COOLDOWN'})`);

  // Write analysis.json
  const analysisDir = resolve(ROOT, 'data/gsc');
  mkdirSync(analysisDir, { recursive: true });
  const analysisPath = resolve(analysisDir, 'analysis.json');
  writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  console.log('\nWritten → data/gsc/analysis.json');

  // Archive to history/ (keep last 16 weeks)
  const histDir = resolve(analysisDir, 'history');
  mkdirSync(histDir, { recursive: true });
  writeFileSync(resolve(histDir, `${today()}.json`), JSON.stringify(analysis, null, 2));
  const histFiles = readdirSync(histDir).filter(f => f.endsWith('.json')).sort();
  if (histFiles.length > 16) {
    for (const old of histFiles.slice(0, histFiles.length - 16)) {
      unlinkSync(resolve(histDir, old));
    }
  }
  console.log(`  Archived → data/gsc/history/${today()}.json (${Math.min(histFiles.length, 16)} snapshots retained)`);

  // Write wiki intelligence digest
  writeIntelligenceDigest(ROOT, analysis);

  // CONT-03: Internal link gap audit — write data/gsc/link-audit.json
  const IMPRESSIONS_THRESHOLD = 500;  // 90-day impressions to qualify as "high-impression"
  const LINK_THRESHOLD = 3;           // min inbound links per wiki/pages/concepts/internal-linking.md
  const inboundMap = computeInboundLinkMap(ROOT);
  const linkGaps: InternalLinkGap[] = (gsc.pages ?? [])
    .filter((p: any) => (p.impressions ?? 0) >= IMPRESSIONS_THRESHOLD)
    .map((p: any) => {
      const slug = p.page.replace(/^https?:\/\/[^/]+/, ''); // "/review/gesture/"
      return {
        page: p.page,
        impressions: p.impressions ?? 0,
        inboundLinkCount: inboundMap.get(slug) ?? 0,
        threshold: LINK_THRESHOLD,
      };
    })
    .filter((g: InternalLinkGap) => g.inboundLinkCount < g.threshold)
    .sort((a: InternalLinkGap, b: InternalLinkGap) => b.impressions - a.impressions);

  const linkAuditPath = resolve(ROOT, 'data/gsc/link-audit.json');
  writeFileSync(linkAuditPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    impressionsThreshold: IMPRESSIONS_THRESHOLD,
    linkThreshold: LINK_THRESHOLD,
    gaps: linkGaps,
  }, null, 2));
  console.log(`  Link audit → data/gsc/link-audit.json (${linkGaps.length} high-impression underlinked pages)`);

  // Append to wiki log
  appendWikiLog(ROOT, `## [${today()}] gsc-analyze | GSC Intelligence Analysis\n\n- CTR leaks: ${analysis.ctrLeaks.length} (top leak: ${analysis.ctrLeaks[0]?.page ?? 'none'} — "${analysis.ctrLeaks[0]?.query ?? ''}")\n- Opportunities: ${analysis.opportunities.filter(o => o.opportunityType !== 'low-signal').length} actionable\n- AIO suspects: ${analysis.executiveSummary.aioSuspects}\n- Affiliate alerts: ${analysis.affiliateOpportunities.filter(a => a.affiliateUrgency === 'high').length} high-urgency\n- Site momentum: ${analysis.siteTrend?.summaryLine ?? 'n/a'}\n- Query entropy: ${analysis.queryEntropy.filter(e => e.regime === 'fragmented').length} fragmented pages\n- Hub candidates: ${analysis.impressionGravity.filter(g => g.hubCandidate).length}\n- Transition opportunities: ${analysis.intentTransitions.filter(t => t.transitionOpportunity).length}\n- AIO recommendations: ${analysis.aioRecommendations.length}\n- Page velocity: ${analysis.pageVelocity === null ? 'n/a (insufficient history)' : `${analysis.pageVelocity.length} pages`}\n- Link audit: ${linkGaps.length} high-impression pages with < ${LINK_THRESHOLD} inbound links\n`);

  console.log('\nExecutive Summary:');
  console.log(`  Momentum: ${analysis.executiveSummary.weeklyMomentum}`);
  console.log(`  Top opportunity: ${analysis.executiveSummary.topOpportunity}`);
  console.log(`  Biggest leak: ${analysis.executiveSummary.biggestLeak}`);
  if (analysis.executiveSummary.affiliateAlert) console.log(`  Affiliate alert: ${analysis.executiveSummary.affiliateAlert}`);
  if (analysis.executiveSummary.cannibalizationAlert) console.log(`  Cannibalization: ${analysis.executiveSummary.cannibalizationAlert}`);

  console.log('\ngsc-analyze complete.');
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
