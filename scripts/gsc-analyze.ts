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

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendWikiLog, writeWikiPage, today } from './agents/wiki-utils.js';

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

type IntentType = 'buyer' | 'brand' | 'spec' | 'informational';

function classifyIntent(query: string): { type: IntentType; value: number } {
  const q = query.toLowerCase();
  if (BUYER_INTENT_TERMS.some(t => q.includes(t))) return { type: 'buyer', value: 3.0 };
  if (BRAND_TERMS.some(t => q.includes(t))) return { type: 'brand', value: 2.0 };
  if (SPEC_TERMS.some(t => q.includes(t))) return { type: 'spec', value: 1.5 };
  return { type: 'informational', value: 1.0 };
}

function normalizeQuery(query: string): string {
  return query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .join(' ');
}

// ─── URL Normalization ────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  // Enforce trailing slash unless URL has a file extension
  return /\.[a-z]{2,4}$/.test(path) ? path : path.endsWith('/') ? path : path + '/';
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
  opportunityType: 'near-p1' | 'ctr-leak' | 'content-depth' | 'affiliate-capture' | 'low-signal';
  topQueries: string[];
  buyerIntentImpressions: number;
  recommendation: string;
}

function scoreOpportunities(pages: PageRow[], pageQueries: PageQueryRow[], ctrLeaks: CTRLeak[]): PageOpportunity[] {
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

      let opportunityType: PageOpportunity['opportunityType'];
      let opportunityScore: number;
      let recommendation: string;

      if (pos >= 5 && pos <= 15 && p.impressions >= 100) {
        opportunityType = 'near-p1';
        opportunityScore = (p.impressions / pos) * 2;
        recommendation = `pos ${pos.toFixed(1)} with ${p.impressions} impr — expand content depth + internal links to push into top 5`;
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
      return (data.opportunities ?? []) as PageEntry[];
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

// ─── Phase 2 Module 6: Content Gap vs Competitors ────────────────────────────
// NOTE: data/competitors/latest.json contains page-level metadata only (title, h2s, wordCount,
// schemaTypes) — not keyword rankings or topic keyword lists. There is no structured keyword
// array to cross-reference against GSC clusters. To enable this module, competitor data would
// need a `keywords: string[]` or `rankingKeywords: { keyword: string; position: number }[]`
// field per competitor, populated by a keyword-ranking API (e.g. Ahrefs, SEMrush, DataForSEO).
// This module is intentionally omitted from output.

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
    aioRecommendations, pageVelocity,
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
  const opportunities = scoreOpportunities(gsc.pages, gsc.pageQueries, ctrLeaks);
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

  // Append to wiki log
  appendWikiLog(ROOT, `## [${today()}] gsc-analyze | GSC Intelligence Analysis\n\n- CTR leaks: ${analysis.ctrLeaks.length} (top leak: ${analysis.ctrLeaks[0]?.page ?? 'none'} — "${analysis.ctrLeaks[0]?.query ?? ''}")\n- Opportunities: ${analysis.opportunities.filter(o => o.opportunityType !== 'low-signal').length} actionable\n- AIO suspects: ${analysis.executiveSummary.aioSuspects}\n- Affiliate alerts: ${analysis.affiliateOpportunities.filter(a => a.affiliateUrgency === 'high').length} high-urgency\n- Site momentum: ${analysis.siteTrend?.summaryLine ?? 'n/a'}\n- Query entropy: ${analysis.queryEntropy.filter(e => e.regime === 'fragmented').length} fragmented pages\n- Hub candidates: ${analysis.impressionGravity.filter(g => g.hubCandidate).length}\n- Transition opportunities: ${analysis.intentTransitions.filter(t => t.transitionOpportunity).length}\n- AIO recommendations: ${analysis.aioRecommendations.length}\n- Page velocity: ${analysis.pageVelocity === null ? 'n/a (insufficient history)' : `${analysis.pageVelocity.length} pages`}\n`);

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
