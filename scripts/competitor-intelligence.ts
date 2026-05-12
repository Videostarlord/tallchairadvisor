/**
 * competitor-intelligence.ts — v2.3
 * Strategic competitor gap analysis with four layers:
 *   Layer 1: Page-role-aware query cluster selection (primary + supporting + strategic)
 *   Layer 2: SERP lane classification (editorial / retailer / brand / community / video)
 *   Layer 3: Persistent crawl cache with lane-aware freshness windows
 *   Layer 4: Role-specific gap analysis against real TCA page content, multi-query synthesis
 *
 * Reads:  data/gsc/analysis.json (opportunities + opportunityType)
 *         data/gsc/latest.json (full pageQueries pool)
 *         data/competitors/config.json (targetQueries)
 *         data/competitors/crawl-cache.json (persistent crawl cache)
 *         data/competitors/serp-cache.json (persistent SERP/AIO cache, 72h TTL)
 *         src/pages/**\/*.astro (real TCA page content)
 * Writes: data/competitors/intelligence.json
 *         data/competitors/crawl-cache.json
 *         data/competitors/serp-cache.json
 *         wiki/pages/concepts/competitor-landscape.md
 *         raw/competitors/YYYY-MM-DD-intelligence.json
 *
 * Usage: npm run competitor:intelligence
 * Cadence: monthly (~$1–5/month at 8 pages × 3 queries each)
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { archiveJsonToRaw, appendWikiLog, readWikiPage, writeWikiPage, today } from './agents/wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TCA_DOMAIN = 'tallchairadvisor.com';

const MAX_PAGES = 8;
const MAX_CRAWLS_PER_RUN = 100; // uncapped for full 8-page coverage
const SERP_RESULTS = 10;
const MIN_EDITORIAL_FOR_ANALYSIS = 1; // minimum editorial results to proceed with gap analysis

// ─── Types ────────────────────────────────────────────────────────────────────

type PageRole = 'review' | 'comparison' | 'best-page' | 'pain-problem' | 'fit-spec' | 'cornerstone' | 'height-bracket' | 'general';
type SerpLane = 'editorial' | 'retailer' | 'brand' | 'community' | 'video' | 'unknown-editorial';
type QueryType = 'primary' | 'supporting' | 'strategic';

interface PageQueryRow {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Opportunity {
  page: string;
  impressions: number;
  position: number;
  opportunityType: string;
  topQueries: string[];
}

interface QueryCandidate {
  query: string;
  impressions: number;
  position: number;
  benchmarkabilityScore: number;
  strategicValueScore: number;
  roleFitScore: number;
  totalScore: number;
  isStrategicInjection: boolean; // true if not from GSC data
}

interface QueryCluster {
  representative: QueryCandidate;
  members: QueryCandidate[];
  intentLabel: string; // e.g. "dimension-fit", "review", "pain-solution"
}

interface SerpResult {
  position: number;
  link: string;
  title: string;
  snippet: string;
  lane: SerpLane;
  domain: string;
}

interface CacheEntry {
  url: string;
  domain: string;
  title: string;
  markdown: string;
  wordCount: number;
  fetchedAt: string;
  lane: SerpLane;
}

interface CompetitorContent extends CacheEntry {
  fromCache: boolean;
  error?: string;
}

// Formal taxonomy for gap findings. Used by confidence filter to avoid regex detection.
// absence_claim: "X is missing / not present / lacks section Y" — invalid under low coverage
// spec_gap: missing spec table, measurement values, height-range data — also absence-adjacent
// depth_claim: shallow coverage, needs more detail — valid from partial excerpt
// structure_claim: CTA placement, heading order, formatting pattern — valid from partial excerpt
type FindingType = 'absence_claim' | 'structure_claim' | 'depth_claim' | 'spec_gap';

interface RawGapFinding {
  gap: string;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  competitor?: string;
  sourceQuery: string;
  findingType: FindingType;
}

interface GapFinding {
  gap: string;
  priority: 'high' | 'medium' | 'low';
  rawPriority: 'high' | 'medium' | 'low'; // priority before confidence filter
  recommendation: string;
  competitor?: string;
  appearsInQueries: number; // cross-query promotion signal
  trusted: boolean;
  coverageAtAnalysis: number; // 0–1: fraction of TCA page visible to the model
  findingType: FindingType;
  downgradedReason?: string;
}

interface QueryAnalysis {
  query: string;
  queryType: QueryType;
  editorialTargets: SerpResult[];
  brandTargets: SerpResult[];
  crawledContent: CompetitorContent[];
  gateStatus: 'passed' | 'no-editorial-results' | 'skipped-crawl-budget';
  rawGaps: RawGapFinding[];
}

interface PageAnalysis {
  tcaPage: string;
  pageRole: PageRole;
  tcaCoverage: number; // 0–1: fraction of TCA page visible to the model
  selectedQueries: { primary: string; supporting: string; strategic: string };
  queryAnalyses: QueryAnalysis[];
  synthesizedGaps: GapFinding[];       // trusted findings only (for downstream agents)
  allSynthesizedGaps: GapFinding[];    // all findings before confidence filter (for audit)
  tcaContentSample: string; // first 300 chars of extracted content (for audit trail)
}

interface AIOData {
  hasAIO: boolean;
  citedUrls: string[];
  passageText: string;
  passageFormat: 'list' | 'prose' | 'table';
  wordCount: number;
}

interface AIOTask {
  page: string;
  query: string;
  aioFormat: string;
  aioPassage: string;
  aioCitedUrls: string[];
  citedUrlsReliable: boolean;
  citationCapsule: string | null;
  insertAfterHeading: string;
  status: 'generated' | 'applied' | 'already-applied' | 'heading-not-found' | 'pending-passage-text';
}

interface IntelligenceOutput {
  generatedAt: string;
  pagesAnalyzed: number;
  queriesRun: number;
  urlsCrawled: number;
  cacheHits: number;
  pages: PageAnalysis[];
  topGaps: GapFinding[];
  editorialOutrankers: Record<string, number>; // domain → count of pages they outrank TCA on
  aioTasks: AIOTask[];
  aioTasksRejected: (AIOTask & { rejectionReason: string })[];
  summary: string;
}

// ─── Domain Lane Tables ───────────────────────────────────────────────────────

const RETAILER_DOMAINS = new Set([
  'amazon.com', 'us.amazon.com', 'wayfair.com', 'target.com', 'walmart.com', 'houzz.com',
  'overstock.com', 'birchlane.com', 'allmodern.com', 'perigold.com', 'lowes.com',
  'officedepot.com', 'staples.com', 'ebay.com', 'flexispot.com', 'stackchairs4less.com',
  'costco.com', 'samsclub.com', 'market.com',
]);

const COMMUNITY_DOMAINS = new Set([
  'reddit.com', 'quora.com', 'bogleheads.org', 'facebook.com', 'twitter.com', 'x.com',
]);

const VIDEO_DOMAINS = new Set(['youtube.com', 'vimeo.com', 'tiktok.com']);

const BRAND_DOMAINS = new Set([
  'steelcase.com', 'store.steelcase.com', 'hermanmiller.com', 'okamura.com',
  'haworth.com', 'humanscale.com', 'aeronchairparts.com', 'support.atlasheadrest.com',
  'instagram.com', 'designcabinet.biz',
]);

const KNOWN_EDITORIAL = new Set([
  'btod.com', 'rtings.com', 'nytimes.com', 'chairsfx.com', 'thehumansolution.com',
  'tall.life', 'crandalloffice.com', 'creativebloq.com', 'forbes.com', 'thebackstore.com',
  'huskyoffice.com', 'spinemd.com', 'blog.szynalski.com', 'augustf.medium.com',
  'ign.com', 'ofcdallas.com', 'boulies.com', 'theguardian.com', 'wirecutter.com',
]);

// Freshness windows in days by lane
const CACHE_FRESHNESS_DAYS: Partial<Record<SerpLane, number>> = {
  editorial: 30,
  'unknown-editorial': 30,
  brand: 14,
  community: 7,
};

// Queries to exclude regardless of page
const JUNK_PATTERNS = [
  /knee brace/i, /wheelchair/i, /standing desk mat/i, /neck brace/i,
  /blood pressure/i, /knee pad/i, /wrist brace/i, /noise machine/i,
  /white noise/i, /sound machine/i,
];

// Domains that consistently block crawlers — skip to preserve crawl budget
const UNCRAWLABLE_DOMAINS = new Set([
  'ign.com', 'nytimes.com', 'wirecutter.com', 'trustpilot.com', 'tomsguide.com',
]);

// Role-specific gap analysis focus instructions for Claude
const ROLE_PROMPTS: Record<PageRole, string> = {
  review: `Focus specifically on:
- Tall-user specs table: seat height range, seat depth range, back height, armrest height annotated by user height (6'0"–6'6")
- Explicit fit-range verdict ("Best fit: 6'0"–6'3", Marginal: 6'4"–6'6", Not recommended: 6'7"+") backed by the measurements
- Head-to-head comparison section vs a direct alternative chair
- Schema: Review + Product schema for star-rating rich snippet eligibility
- Warranty/return policy content (purchase anxiety reducer at $1,000+ price point)
- Purchase-intent signals and CTA placement relative to the verdict`,

  comparison: `Focus specifically on:
- Decision framework: which user profile (height, budget, use case) should pick which chair
- Side-by-side spec table with tall-user-relevant measurements only
- Scoring criteria with explicit rationale for each dimension
- Clear "bottom line" verdict box for the target user height range`,

  'best-page': `Focus specifically on:
- Per-chair dimension tables with height-range callouts (min/max seat height, seat depth, back height)
- Audience segmentation: height brackets AND weight capacity (tall vs big vs both — many searchers need both axes)
- Author byline and methodology credentialing visible near the top
- Schema: ItemList + AggregateRating for rich results eligibility
- Use-case segmentation (home office, corporate/executive, all-day/heavy-use)`,

  'pain-problem': `Focus specifically on:
- Clinical/authoritative source citations with named rule (Cornell Ergonomics Rule, OSHA guidelines) stated explicitly
- Problem-to-solution structure: symptom → root cause → measurement → specific fix → recommended products
- Measurement specificity (exact inch measurements or finger-clearance rules, not generic "adjust your chair")
- FAQ section covering common pain-specific sub-questions
- CTA placement relative to solution content (affiliate link after the fix is explained, not before)`,

  'fit-spec': `Focus specifically on:
- Complete spec table: every adjustable dimension with min/max values
- AIO-citation formatting: explicit passage-level answer box stating the measurement directly (e.g., "The Steelcase Gesture seat height adjusts from 15.5 to 20.5 inches")
- User-height-to-setting mapping (at 6'2" set lumbar to X, seat depth to Y)
- Side-by-side spec comparison vs competing products on the same dimension`,

  cornerstone: `Focus specifically on:
- Sub-topic comprehensiveness: how many chair categories, height brackets, and use cases addressed
- Height-bracket verdict table structure (this is the page's primary differentiator opportunity)
- Internal linking hub structure: does competitor page link out to sub-pages covering each sub-topic
- Authority signals: methodology section, author credentials, data sources cited
- AI Overview citation formatting: answer-first with named rules and numbered measurement criteria`,

  'height-bracket': `Focus specifically on:
- Height-specific verdict clarity: chair recommendations with exact spec justification for this height
- Measurement tables validated against this specific height's biomechanics (thigh length, torso height)
- Comparison depth across recommended chairs at this height bracket`,

  general: `Focus specifically on:
- Content sections present on competitor pages but absent from TCA
- Heading structures that better match the exact searcher intent
- Specific data, tables, or measurement tools competitors provide that TCA lacks
- Schema markup or structured data competitors use`,
};

// Product map used for both strategic injections and primary query gating
const REVIEW_PRODUCT_MAP: Record<string, string> = {
  'review/gesture': 'steelcase gesture',
  'review/leap-plus': 'steelcase leap plus',
  'review/aeron-size-c': 'herman miller aeron size c',
  'review/sihoo-doro-s300': 'sihoo doro s300',
};

// Brand-only words that don't uniquely identify a product
const BRAND_GENERIC = new Set(['steelcase', 'herman', 'miller', 'sihoo', 'size']);

// ─── Layer 1: Page Role Detection ─────────────────────────────────────────────

function detectPageRole(page: string): PageRole {
  if (/^\/review\//.test(page)) return 'review';
  if (/-vs-|-comparison/.test(page)) return 'comparison';
  if (/best-office-chairs|best-ergonomic/.test(page)) return 'best-page';
  if (/knee-pain|shoulder-pain|back-pain|wrist-pain|neck-pain/.test(page)) return 'pain-problem';
  if (/\/(seat-depth|seat-height|tall-people|weight-limit|armrest)\/?$/.test(page)) return 'fit-spec';
  if (/office-chairs-for-6-foot/.test(page)) return 'height-bracket';
  if (/office-chairs-for-tall-people|correct-chair-dimensions/.test(page)) return 'cornerstone';
  return 'general';
}

// ─── Layer 1: SERP Lane Classification ────────────────────────────────────────

function classifyDomain(url: string): SerpLane {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown-editorial';
  }

  if (RETAILER_DOMAINS.has(domain)) return 'retailer';
  if (COMMUNITY_DOMAINS.has(domain)) return 'community';
  if (VIDEO_DOMAINS.has(domain)) return 'video';
  if (BRAND_DOMAINS.has(domain)) return 'brand';
  if (KNOWN_EDITORIAL.has(domain)) return 'editorial';

  // Heuristics for unknown domains
  const path = new URL(url).pathname;
  if (/\/(blog|review|guide|best-|comparison|versus|vs)\//i.test(path)) return 'unknown-editorial';
  if (/\/(s\?|search\?|category\/|products\/|shop\/)/i.test(path)) return 'retailer';

  return 'unknown-editorial'; // default: treat as potential editorial, validate post-crawl
}

// ─── Layer 1: Query Selection ─────────────────────────────────────────────────

function isJunkQuery(query: string): boolean {
  return JUNK_PATTERNS.some(p => p.test(query));
}

const EDITORIAL_SIGNALS = ['review', 'best', 'vs', 'guide', 'how', 'ergonomic', 'comparison', 'for tall', 'tall people', 'for 6', 'recommended', 'worth it', 'pros', 'cons', 'alternative'];
const COMMERCIAL_SIGNALS = ['buy', 'price', 'cheap', 'discount', 'sale', 'deal', 'coupon', 'clearance', 'near me'];
const STOPWORDS = new Set(['a', 'an', 'the', 'for', 'of', 'in', 'is', 'to', 'and', 'or', 'with', 'on', 'at', 'by', 'from', 'how', 'what', 'why', 'are', 'do', 'does', 'my', 'i', 'me', 'it', 'this', 'that']);

function benchmarkabilityScore(query: string, role: PageRole): number {
  const q = query.toLowerCase();
  if (isJunkQuery(q)) return 0;
  if (COMMERCIAL_SIGNALS.some(s => q.includes(s))) return 0;

  let score = 0.3; // baseline: unknown but not commercial

  // Editorial signals
  if (EDITORIAL_SIGNALS.some(s => q.includes(s))) score += 0.4;

  // Role-specific boosts — these queries are benchmarkable for this page type even without obvious editorial words
  if (role === 'fit-spec' && /\d+[\s"']|height range|seat depth|lumbar|armrest|adjustment/.test(q)) score += 0.3;
  if (role === 'pain-problem' && /cornell|ergonomic|pain|posture|behind knee|seat depth/.test(q)) score += 0.4;
  if (role === 'review' && /review|tall|height|for 6|adjustment|range/.test(q)) score += 0.3;
  if (role === 'best-page' && /best|top|recommended|rating/.test(q)) score += 0.4;
  if (role === 'cornerstone' && /office chair|ergonomic chair|tall people|for tall/.test(q)) score += 0.3;

  return Math.min(score, 1.0);
}

function roleFitScore(query: string, role: PageRole): number {
  const q = query.toLowerCase();
  const fits: Record<PageRole, RegExp[]> = {
    review:       [/review/, /for tall/, /tall (people|person|user)/, /height range/, /adjustment/],
    comparison:   [/vs/, /versus/, /compared/, /difference/, /or the/],
    'best-page':  [/best/, /top (rated|picks)/, /recommended/, /ranking/],
    'pain-problem': [/cornell/, /pain/, /knee/, /posture/, /seat depth.*behind/, /ergonomic rule/],
    'fit-spec':   [/height range/, /seat depth/, /dimensions/, /inches/, /adjustment guide/, /settings/],
    cornerstone:  [/for tall people/, /office chair/, /ergonomic chair/, /tall person/],
    'height-bracket': [/6.foot|6'[3-7]/, /tall/, /height/],
    general:      [],
  };
  const patterns = fits[role] ?? [];
  const matches = patterns.filter(p => p.test(q)).length;
  return Math.min(matches * 0.33, 1.0);
}

function strategicValueScore(query: string, impressions: number, position: number, isInjection: boolean): number {
  if (isInjection) return 0.7; // strategic injections have fixed high value
  // Impressions × inverse position (capped so pos 80 still has some value for strategic terms)
  const posScore = Math.max(1 / Math.max(position, 5), 0.01);
  const imprScore = Math.min(impressions / 100, 1.0);
  return Math.min(posScore * 5 + imprScore * 0.5, 1.0);
}

function scoreCandidate(c: QueryCandidate): number {
  // Weighted combination: benchmarkability matters most, then strategic value, then role fit
  return c.benchmarkabilityScore * 0.5 + c.strategicValueScore * 0.3 + c.roleFitScore * 0.2;
}

// Cluster queries by shared significant words (≥2 non-stopword tokens in common)
function clusterQueries(candidates: QueryCandidate[]): QueryCluster[] {
  const tokenize = (q: string) => q.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));

  const clusters: QueryCluster[] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < candidates.length; i++) {
    if (assigned.has(i)) continue;
    const tokensI = new Set(tokenize(candidates[i].query));
    const cluster: QueryCandidate[] = [candidates[i]];
    assigned.add(i);

    for (let j = i + 1; j < candidates.length; j++) {
      if (assigned.has(j)) continue;
      const tokensJ = tokenize(candidates[j].query);
      const shared = tokensJ.filter(t => tokensI.has(t)).length;
      if (shared >= 2) {
        cluster.push(candidates[j]);
        assigned.add(j);
      }
    }

    // Representative = highest totalScore in cluster
    const rep = cluster.reduce((a, b) => (a.totalScore >= b.totalScore ? a : b));
    // Infer intent label from representative query
    const q = rep.query.toLowerCase();
    const label = /review/.test(q) ? 'review'
      : /cornell|seat depth|pain/.test(q) ? 'pain-solution'
      : /best|top/.test(q) ? 'best-list'
      : /vs|compared/.test(q) ? 'comparison'
      : /height range|dimensions|adjustment|inches/.test(q) ? 'dimension-fit'
      : 'general-informational';

    clusters.push({ representative: rep, members: cluster, intentLabel: label });
  }

  return clusters.sort((a, b) => b.representative.totalScore - a.representative.totalScore);
}

// Inject strategic must-win queries based on page role and slug
function buildStrategicInjections(page: string, role: PageRole, configTargetQueries: string[]): QueryCandidate[] {
  // Build discriminating-term → product name map for all known review products
  const productTermMap = new Map<string, string>(); // term → canonical product name
  for (const productName of Object.values(REVIEW_PRODUCT_MAP)) {
    for (const term of productName.split(' ').filter(t => t.length > 3 && !BRAND_GENERIC.has(t))) {
      productTermMap.set(term.toLowerCase(), productName);
    }
  }

  const slug = page.replace(/^\//, '').replace(/\/$/, '');
  const thisProduct = Object.entries(REVIEW_PRODUCT_MAP).find(([k]) => slug.includes(k))?.[1];

  // Exclude config queries that are specific to a DIFFERENT product — they pollute every page's candidate pool
  const filteredConfigQueries = configTargetQueries.filter(q => {
    const ql = q.toLowerCase();
    const matchedProduct = [...productTermMap.entries()].find(([term]) => ql.includes(term))?.[1];
    if (!matchedProduct) return true; // generic query — safe for all pages
    return thisProduct ? matchedProduct === thisProduct : false;
  });
  const injections: string[] = [...filteredConfigQueries];

  if (role === 'review' && thisProduct) {
    injections.push(`${thisProduct} review`, `${thisProduct} for tall people`);
  }
  if (role === 'best-page') {
    injections.push('best office chairs for tall people', 'best ergonomic chair tall person');
  }
  if (role === 'cornerstone') {
    injections.push('office chairs for tall people', 'ergonomic office chair for tall people');
  }
  if (role === 'pain-problem' && /knee-pain|seat-depth/.test(page)) {
    injections.push('cornell ergonomics seat depth rule', 'seat depth knee pain office chair');
  }
  if (role === 'fit-spec' && thisProduct) {
    injections.push(`${thisProduct} dimensions tall people`, `${thisProduct} seat height range`);
  }

  return [...new Set(injections)]
    .filter(q => !isJunkQuery(q))
    .map(q => {
      const bench = benchmarkabilityScore(q, role);
      const roleF = roleFitScore(q, role);
      const stratV = strategicValueScore(q, 0, 50, true);
      const total = scoreCandidate({ query: q, impressions: 0, position: 50, benchmarkabilityScore: bench, strategicValueScore: stratV, roleFitScore: roleF, totalScore: 0, isStrategicInjection: true });
      return { query: q, impressions: 0, position: 50, benchmarkabilityScore: bench, strategicValueScore: stratV, roleFitScore: roleF, totalScore: total, isStrategicInjection: true };
    });
}

function selectQueryTriple(
  page: string,
  role: PageRole,
  allPageQueries: PageQueryRow[],
  configTargetQueries: string[],
): { primary: string; supporting: string; strategic: string } {
  // Build candidate pool from GSC
  const gscCandidates: QueryCandidate[] = allPageQueries
    .filter(pq => pq.page === page && !isJunkQuery(pq.query))
    .map(pq => {
      const bench = benchmarkabilityScore(pq.query, role);
      const roleF = roleFitScore(pq.query, role);
      const stratV = strategicValueScore(pq.query, pq.impressions, pq.position, false);
      const total = bench * 0.5 + stratV * 0.3 + roleF * 0.2;
      return { query: pq.query, impressions: pq.impressions, position: pq.position, benchmarkabilityScore: bench, strategicValueScore: stratV, roleFitScore: roleF, totalScore: total, isStrategicInjection: false };
    })
    .filter(c => c.benchmarkabilityScore > 0); // drop commercial/junk

  // Add strategic injections
  const injected = buildStrategicInjections(page, role, configTargetQueries);
  const allCandidates = [...gscCandidates, ...injected];

  if (allCandidates.length === 0) {
    const fallback = `office chair for tall people`;
    return { primary: fallback, supporting: fallback, strategic: fallback };
  }

  // Cluster
  const clusters = clusterQueries(allCandidates);

  // Primary: for review pages with a known product, gate on product-discriminating terms to prevent
  // stray "steelcase [other product] review" GSC queries from winning the primary slot
  let primary: string;
  const reviewSlug = page.replace(/^\//, '').replace(/\/$/, '');
  const reviewProduct = role === 'review'
    ? Object.entries(REVIEW_PRODUCT_MAP).find(([k]) => reviewSlug.includes(k))?.[1]
    : undefined;
  const discriminating = reviewProduct
    ? reviewProduct.split(' ').filter(t => t.length > 3 && !BRAND_GENERIC.has(t))
    : [];
  if (reviewProduct) {
    // For review pages: pin primary to the "${product} review" injection when available — cluster
    // representatives are unreliable here because GSC queries like "steelcase trumpet review" can
    // co-cluster with "steelcase gesture review" (sharing brand + "review") and steal the representative
    // slot, causing both directReview and productAware to miss the correct query entirely.
    const reviewInjection = injected.find(c => {
      const q = c.query.toLowerCase();
      return discriminating.some(t => q.includes(t)) && q.includes('review');
    });
    if (reviewInjection) {
      primary = reviewInjection.query;
    } else {
      const productAware = clusters.find(c =>
        discriminating.some(t => c.representative.query.toLowerCase().includes(t))
      );
      primary = productAware?.representative.query ?? clusters[0]?.representative.query ?? allCandidates[0].query;
    }
  } else {
    primary = clusters[0]?.representative.query ?? allCandidates[0].query;
  }

  // Supporting: for review pages, prefer a product-specific query over a generic one before
  // falling back to the standard different-intent chain
  const supportingCluster =
    (discriminating.length > 0
      ? clusters.find(c => c.representative.query !== primary && discriminating.some(t => c.representative.query.toLowerCase().includes(t)))
      : undefined) ??
    clusters.find(c => c.representative.query !== primary && c.intentLabel !== clusters[0].intentLabel && c.representative.roleFitScore > 0) ??
    clusters.find(c => c.representative.query !== primary && c.intentLabel !== clusters[0].intentLabel) ??
    clusters.find(c => c.representative.query !== primary && c.representative.roleFitScore > 0) ??
    clusters.find(c => c.representative.query !== primary);
  const supporting = supportingCluster?.representative.query ?? primary;

  // Strategic: for review pages prefer product-discriminating injections; then fall back by totalScore
  const strategicCandidate = injected
    .filter(c => c.query !== primary && c.query !== supporting)
    .sort((a, b) => {
      if (discriminating.length > 0) {
        const aHit = discriminating.some(t => a.query.toLowerCase().includes(t));
        const bHit = discriminating.some(t => b.query.toLowerCase().includes(t));
        if (aHit !== bHit) return aHit ? -1 : 1;
      }
      return b.totalScore - a.totalScore;
    })[0];
  const strategicFallback = clusters
    .find(c => c.representative.query !== primary && c.representative.query !== supporting && c.representative.roleFitScore > 0);
  const strategic = strategicCandidate?.query ?? strategicFallback?.representative.query ?? supporting;

  return { primary, supporting, strategic };
}

// ─── AIO Utilities ────────────────────────────────────────────────────────────

// SerpAPI ai_overview schema varies by query type:
// - text_blocks + references: content in response (most common — fix was: we were checking 'blocks' not 'text_blocks')
// - blocks + references: alternate field name, same structure
// - page_token: secondary fetch to engine=google_ai_overview resolves text_blocks[].snippet
// Recursively finds the first string value ≥ minLen chars — used as last-resort AIO text extraction.
// Skips URL-like strings and very short values. Breadth-first so top-level fields win.
function findFirstLongString(obj: any, minLen = 40, _depth = 0): string {
  if (_depth > 5) return '';
  if (typeof obj === 'string') {
    const t = obj.trim();
    return (t.length >= minLen && !t.startsWith('http')) ? t : '';
  }
  if (Array.isArray(obj)) {
    for (const item of obj) { const r = findFirstLongString(item, minLen, _depth + 1); if (r) return r; }
  } else if (obj && typeof obj === 'object') {
    // Try known text-bearing keys first
    for (const key of ['snippet', 'text', 'body', 'content', 'answer', 'description']) {
      if (typeof obj[key] === 'string') { const r = findFirstLongString(obj[key], minLen, _depth + 1); if (r) return r; }
    }
    for (const val of Object.values(obj)) { const r = findFirstLongString(val, minLen, _depth + 1); if (r) return r; }
  }
  return '';
}

function extractAioText(ov: any): string {
  if (ov.answer && typeof ov.answer === 'string' && ov.answer.trim()) return ov.answer.trim();
  if (ov.snippet && typeof ov.snippet === 'string' && ov.snippet.trim()) return ov.snippet.trim();
  if (ov.text && typeof ov.text === 'string' && ov.text.trim()) return ov.text.trim();
  // SerpAPI uses 'text_blocks' OR 'blocks' depending on query — check text_blocks first
  const blocks: any[] = ov.text_blocks ?? ov.blocks ?? [];
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'paragraph' && block.body) parts.push(String(block.body));
    else if (block.type === 'list' && Array.isArray(block.list?.items)) {
      parts.push(block.list.items.map((i: any) => String(i.text ?? i.snippet ?? i.body ?? '')).filter(Boolean).join(' '));
    } else if (block.snippet) parts.push(String(block.snippet));
    else if (block.text) parts.push(String(block.text));
    else if (block.body) parts.push(String(block.body));
    else if (block.content) parts.push(String(block.content));
    else {
      // Unknown block structure — try recursive search
      const found = findFirstLongString(block, 30);
      if (found) parts.push(found);
    }
  }
  const result = parts.filter(Boolean).join(' ').trim();
  // Last resort: recursive search of the whole ov object
  if (!result && blocks.length > 0) {
    if (process.env.AIO_DEBUG) console.log('  [AIO_DEBUG] block extraction failed — falling back to recursive search');
    return findFirstLongString(ov, 40);
  }
  return result;
}

// After capsule generation: verify every measurement in the capsule exists in the raw .astro source.
// Prevents fabricated or hallucinated specs from being published.
function validateCapsuleSpecs(capsule: string, rawAstroSource: string): { valid: boolean; mismatches: string[] } {
  const nums = [...capsule.matchAll(/(\d+(?:\.\d+)?)\s*(?:inch(?:es)?|in\b|")/gi)].map(m => m[1]);
  const mismatches = nums.filter(n => !rawAstroSource.includes(n));
  return { valid: mismatches.length === 0, mismatches };
}

// Insert capsule paragraph immediately after a heading in a .astro page.
function applyCapsuleToPage(root: string, page: string, insertAfterHeading: string, capsule: string): AIOTask['status'] {
  const slug = page.replace(/^\//, '').replace(/\/$/, '');
  const candidates = [
    resolve(root, `src/pages/${slug}.astro`),
    resolve(root, `src/pages/${slug}/index.astro`),
  ];
  let filePath = '';
  let source = '';
  for (const c of candidates) {
    if (existsSync(c)) { filePath = c; source = readFileSync(c, 'utf-8'); break; }
  }
  if (!filePath) return 'heading-not-found';
  // Sentinel detects any prior capsule insertion regardless of text content
  if (source.includes('<!-- tca-aio-capsule -->')) return 'already-applied';

  // Strip ## markers and normalize
  const headingText = insertAfterHeading.replace(/^#+\s*/, '').trim();
  const lines = source.split('\n');

  let headingLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!/<h[1-6]/i.test(lines[i])) continue;
    const stripped = lines[i].replace(/<[^>]+>/g, '').trim();
    if (stripped === headingText || stripped.includes(headingText) || headingText.includes(stripped) && stripped.length > 10) {
      headingLineIdx = i;
      break;
    }
  }
  if (headingLineIdx === -1) return 'heading-not-found';

  const indent = lines[headingLineIdx].match(/^(\s*)/)?.[1] ?? '        ';
  lines.splice(headingLineIdx + 1, 0, `${indent}<!-- tca-aio-capsule -->\n${indent}<p>${capsule}</p>`);
  writeFileSync(filePath, lines.join('\n'));
  return 'applied';
}

// ─── Layer 2: SERP Fetching + Lane Classification ─────────────────────────────

function parseAioFromRaw(ov: any): AIOData | null {
  if (!ov) return null;
  const topRefs: any[] = ov.references ?? ov.sources ?? [];
  const blockRefs: any[] = (ov.blocks ?? ov.text_blocks ?? []).flatMap((b: any) => b.references ?? b.sources ?? []);
  const allRefs = [...topRefs, ...blockRefs];
  const citedUrls: string[] = [...new Set(allRefs.map((r: any) => r.link ?? r.url ?? '').filter(Boolean))];
  const passageText: string = extractAioText(ov);
  const passageFormat: 'list' | 'prose' | 'table' =
    /^\s*[-*•]|\n[-*•]/m.test(passageText) ? 'list'
    : /\|\s/.test(passageText) ? 'table'
    : 'prose';
  return { hasAIO: true, citedUrls, passageText, passageFormat, wordCount: passageText.split(/\s+/).filter(Boolean).length };
}

async function fetchSerp(keyword: string, apiKey: string, serpCache?: Map<string, SerpCacheEntry>): Promise<{ results: SerpResult[]; aio: AIOData | null }> {
  // Return from SERP cache if fresh (saves API credits on debug reruns)
  if (serpCache) {
    const cached = serpCache.get(keyword);
    if (cached && isSerpCacheFresh(cached)) {
      console.log(`    [serp-cache] hit for "${keyword}"`);
      return { results: cached.results, aio: parseAioFromRaw(cached.aiOverview) };
    }
  }

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('q', keyword);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('num', String(SERP_RESULTS));
  url.searchParams.set('hl', 'en');
  url.searchParams.set('gl', 'us');

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.warn(`  SerpAPI ${res.status} for "${keyword}"`); return { results: [], aio: null }; }
    const data = await res.json() as any;
    const results: SerpResult[] = (data.organic_results ?? []).map((r: any) => {
      const link = r.link ?? '';
      return {
        position: r.position ?? 0,
        link,
        title: r.title ?? '',
        snippet: r.snippet ?? '',
        lane: classifyDomain(link),
        domain: (() => { try { return new URL(link).hostname.replace('www.', ''); } catch { return ''; } })(),
      };
    }).filter((r: SerpResult) => !r.link.includes(TCA_DOMAIN));

    // Parse AIO block — already in the response, no extra credits consumed.
    // SerpAPI schema varies: text may be in answer, snippet, text, or nested blocks[].
    // Citations may be in references, sources, or blocks[].references.
    let aio: AIOData | null = null;
    let resolvedAiOverview: any = data.ai_overview ?? null;
    if (data.ai_overview) {
      const ov = data.ai_overview;
      if (process.env.AIO_DEBUG) {
        console.log('  [AIO_DEBUG] ai_overview keys:', JSON.stringify(Object.keys(ov)));
        if (ov.text_blocks?.length) {
          console.log('  [AIO_DEBUG] text_blocks[0]:', JSON.stringify(ov.text_blocks[0]));
        }
        if (ov.blocks?.length) {
          console.log('  [AIO_DEBUG] blocks[0]:', JSON.stringify(ov.blocks[0]));
        }
        if (!ov.text_blocks?.length && !ov.blocks?.length) {
          console.log('  [AIO_DEBUG] no blocks found — full ai_overview:', JSON.stringify(ov).slice(0, 500));
        }
      }
      aio = parseAioFromRaw(ov);

      // page_token case: SerpAPI deferred the AIO text — make secondary fetch to resolve it.
      // The google_ai_overview engine returns text_blocks[].snippet with the actual content.
      if (ov.page_token && (!aio || aio.passageText.length < 50)) {
        console.log(`  [AIO] page_token detected — fetching secondary response`);
        const tokenUrl = new URL('https://serpapi.com/search.json');
        tokenUrl.searchParams.set('engine', 'google_ai_overview');
        tokenUrl.searchParams.set('page_token', ov.page_token);
        tokenUrl.searchParams.set('api_key', apiKey);
        try {
          const tokenRes = await fetch(tokenUrl.toString(), { signal: AbortSignal.timeout(15000) });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json() as any;
            const secondary = tokenData.google_ai_overview ?? tokenData.ai_overview;
            if (secondary) {
              aio = parseAioFromRaw(secondary);
              resolvedAiOverview = secondary;
              if (process.env.AIO_DEBUG) console.log(`  [AIO_DEBUG] page_token resolved: ${aio?.passageText?.length ?? 0} chars`);
            }
          } else {
            console.warn(`  SerpAPI page_token fetch: ${tokenRes.status}`);
          }
        } catch (e: any) {
          console.warn(`  SerpAPI page_token fetch error: ${e.message}`);
        }
      }
    }

    // Save resolved content to SERP cache — stores secondary-fetch result so reruns don't re-fetch
    if (serpCache) serpCache.set(keyword, { aiOverview: resolvedAiOverview, results, timestamp: Date.now() });

    return { results, aio };
  } catch (e: any) {
    console.warn(`  SerpAPI error: ${e.message}`);
    return { results: [], aio: null };
  }
}

// ─── Layer 3: Crawl Cache ──────────────────────────────────────────────────────

const CACHE_PATH = 'data/competitors/crawl-cache.json';

function loadCrawlCache(root: string): Map<string, CacheEntry> {
  const path = resolve(root, CACHE_PATH);
  if (!existsSync(path)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    return new Map(Object.entries(raw));
  } catch { return new Map(); }
}

function saveCrawlCache(root: string, cache: Map<string, CacheEntry>): void {
  mkdirSync(resolve(root, 'data/competitors'), { recursive: true });
  const obj: Record<string, CacheEntry> = {};
  for (const [k, v] of cache) obj[k] = v;
  writeFileSync(resolve(root, CACHE_PATH), JSON.stringify(obj, null, 2));
}

function isCacheFresh(entry: CacheEntry): boolean {
  const days = CACHE_FRESHNESS_DAYS[entry.lane] ?? 30;
  const ageMs = Date.now() - new Date(entry.fetchedAt).getTime();
  return ageMs < days * 24 * 60 * 60 * 1000;
}

// ─── SERP Cache ────────────────────────────────────────────────────────────────
// Caches raw ai_overview objects keyed by query string (72h TTL).
// Allows AIO_DEBUG runs without spending API credits.

const SERP_CACHE_PATH = 'data/competitors/serp-cache.json';
const SERP_CACHE_TTL_MS = 72 * 60 * 60 * 1000;

type SerpCacheEntry = { aiOverview: any | null; results: SerpResult[]; timestamp: number };

function loadSerpCache(root: string): Map<string, SerpCacheEntry> {
  const path = resolve(root, SERP_CACHE_PATH);
  if (!existsSync(path)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    return new Map(Object.entries(raw) as [string, SerpCacheEntry][]);
  } catch { return new Map(); }
}

function saveSerpCache(root: string, cache: Map<string, SerpCacheEntry>): void {
  mkdirSync(resolve(root, 'data/competitors'), { recursive: true });
  const obj: Record<string, SerpCacheEntry> = {};
  for (const [k, v] of cache) obj[k] = v;
  writeFileSync(resolve(root, SERP_CACHE_PATH), JSON.stringify(obj, null, 2));
}

function isSerpCacheFresh(entry: SerpCacheEntry): boolean {
  return (Date.now() - entry.timestamp) < SERP_CACHE_TTL_MS;
}

// ─── Layer 3: Firecrawl ────────────────────────────────────────────────────────

async function crawlUrl(url: string, apiKey: string, lane: SerpLane): Promise<CompetitorContent> {
  let domain: string;
  try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = url; }
  const fetchedAt = new Date().toISOString();

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, timeout: 90000 }),
      signal: AbortSignal.timeout(95000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { url, domain, title: '', markdown: '', wordCount: 0, fetchedAt, lane, fromCache: false, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
    }

    const data = await res.json() as any;
    if (!data.success) {
      return { url, domain, title: '', markdown: '', wordCount: 0, fetchedAt, lane, fromCache: false, error: data.error ?? 'success:false' };
    }

    const markdown: string = (data.data?.markdown ?? '').slice(0, 8000);
    const title = markdown.match(/^#\s+(.+)/m)?.[1]?.trim() ?? domain;
    const wordCount = markdown.split(/\s+/).filter(w => w.length > 2).length;

    return { url, domain, title, markdown, wordCount, fetchedAt, lane, fromCache: false };
  } catch (e: any) {
    return { url, domain, title: '', markdown: '', wordCount: 0, fetchedAt, lane, fromCache: false, error: e.message };
  }
}

// ─── Layer 4: TCA Content Extraction ──────────────────────────────────────────

interface SectionInfo {
  level: number;
  heading: string;
  body: string;
  hasTable: boolean;
  hasFaq: boolean;
  hasCta: boolean;
}

function parseSections(lines: string[]): SectionInfo[] {
  const sections: SectionInfo[] = [];
  let current: SectionInfo | null = null;

  for (const line of lines) {
    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      if (current) sections.push(current);
      current = { level: hm[1].length, heading: hm[2].trim(), body: '', hasTable: false, hasFaq: false, hasCta: false };
    } else if (current) {
      current.body += line + '\n';
      if (line.includes('|')) current.hasTable = true;
      if (/tallchairadvi-20|amazon\.com\/(dp|gp)/.test(line)) current.hasCta = true;
    }
  }
  if (current) sections.push(current);

  for (const s of sections) {
    if (/faq|frequently asked|question/i.test(s.heading)) s.hasFaq = true;
  }
  return sections;
}

function buildSectionManifest(sections: SectionInfo[], totalChars: number, cap: number): string {
  if (sections.length === 0) return '';
  const coveragePct = Math.round(Math.min(1, cap / Math.max(totalChars, 1)) * 100);
  const rows = sections.map(s => {
    const attrs = [s.hasTable && 'table', s.hasFaq && 'faq', s.hasCta && 'cta'].filter(Boolean);
    const attrStr = attrs.length ? `, ${attrs.join(', ')}` : '';
    return `${'#'.repeat(s.level)} ${s.heading} (${s.body.length} chars${attrStr})`;
  }).join('\n');
  return `[SECTION MANIFEST — ${sections.length} sections found, ~${coveragePct}% content visible below]\n${rows}\n[END MANIFEST — every section above exists in the page; do not flag absence for unlisted sections]\n\n`;
}

function extractTcaContent(root: string, page: string): { content: string; coverage: number } {
  // Map /review/gesture/ → src/pages/review/gesture.astro
  const slug = page.replace(/^\//, '').replace(/\/$/, '');
  const candidates = [
    resolve(root, `src/pages/${slug}.astro`),
    resolve(root, `src/pages/${slug}/index.astro`),
  ];

  let raw = '';
  for (const path of candidates) {
    if (existsSync(path)) { raw = readFileSync(path, 'utf-8'); break; }
  }
  if (!raw) return { content: '[TCA page source not found]', coverage: 1.0 };

  // Build component + schema inventory from raw source BEFORE stripping.
  // This prevents false "lacks X" gaps when components render content that the extractor can't see.
  const componentNames = [...raw.matchAll(/^import\s+(\w+)\s+from/gm)].map(m => m[1]).filter(Boolean);
  const schemaTypes = [...raw.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map(m => m[1]).filter(Boolean);
  // Detect Amazon affiliate links (signals CTA is present)
  const hasAffiliateCta = /tallchairadvi-20|amazon\.com\/dp|amazon\.com\/gp/.test(raw);
  const inventoryLines: string[] = [];
  if (componentNames.length) inventoryLines.push(`Components in use: ${componentNames.join(', ')}`);
  if (schemaTypes.length) inventoryLines.push(`Schema @types already present: ${[...new Set(schemaTypes)].join(', ')}`);
  if (hasAffiliateCta) inventoryLines.push('Affiliate CTA: present');
  const inventory = inventoryLines.length
    ? `[PAGE INVENTORY — content below is raw source; rendered output may include more]\n${inventoryLines.join('\n')}\n\n`
    : '';

  // Remove frontmatter block (content between first and second ---)
  const fmEnd = raw.indexOf('---', 3);
  const body = fmEnd > 0 ? raw.slice(fmEnd + 3) : raw;

  // Remove import statements and script tags
  let text = body
    .replace(/^import .+$/gm, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // Strip JSX expressions iteratively (handles nested braces)
  let prev = '';
  while (prev !== text) { prev = text; text = text.replace(/\{[^{}]*\}/g, ' '); }

  // Strip HTML/JSX tags but preserve heading markers
  text = text.replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => {
    const level = parseInt(tag[1]);
    const hashes = '#'.repeat(level);
    return `\n${hashes} ${inner.replace(/<[^>]+>/g, '').trim()}\n`;
  });
  text = text.replace(/<[^>]+>/g, ' ');

  // Clean up whitespace, keep non-trivial lines
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 20 || l.startsWith('#'));

  // Parse into sections so the model always sees the full section structure
  const sections = parseSections(lines);
  const bodyText = lines.join('\n').replace(/\s{3,}/g, '\n\n');
  const totalBodyChars = bodyText.length;

  const CAP = 12000;

  // Manifest is always emitted in full (compact — typically <600 chars). The remaining budget
  // goes to the linear content. Because the manifest names every section, the model can't
  // falsely infer "section X is missing" from a truncated content excerpt.
  const manifest = buildSectionManifest(sections, totalBodyChars, CAP);
  const contentBudget = Math.max(0, CAP - manifest.length - inventory.length);
  const bodySlice = bodyText.length > contentBudget
    ? bodyText.slice(0, contentBudget) + `\n\n[CONTENT TRUNCATED — see section manifest above for full section list]`
    : bodyText;

  const fullContent = inventory + manifest + bodySlice;
  const coverage = Math.min(1, CAP / Math.max(totalBodyChars + manifest.length + inventory.length, 1));
  return { content: fullContent, coverage };
}

// ─── Layer 4: Role-Specific Gap Analysis ──────────────────────────────────────

async function analyzeGaps(
  client: Anthropic,
  role: PageRole,
  tcaPage: string,
  query: string,
  queryType: QueryType,
  tcaContent: string,
  editorialContent: CompetitorContent[],
  coverage: number = 1.0,
): Promise<RawGapFinding[]> {
  const usable = editorialContent.filter(c => !c.error && c.markdown && c.wordCount > 150);
  if (usable.length === 0) return [];

  const competitorSection = usable
    .map(c => `### ${c.domain} (${c.wordCount} words)\n${c.markdown.slice(0, 5000)}`)
    .join('\n\n---\n\n');

  const roleInstructions = ROLE_PROMPTS[role];

  const prompt = `You are an SEO strategist for tallchairadvisor.com — a niche affiliate site for ergonomic office chairs for tall people (6'+). The author is Jackson Christopher, 6'4", Mechanical Engineering student at UC Berkeley. All chair reviews are either first-person (Steelcase Gesture only, which he owns) or research-based (all other chairs).

ANALYSIS TASK
Page: ${tcaPage}
Page role: ${role}
Target query: "${query}" (${queryType} benchmark query)

${roleInstructions}

IMPORTANT: Compare the competitor content against TCA's ACTUAL page content below. Only flag gaps that are genuinely absent from TCA's page — do not suggest things that already exist in it.
${coverage < 0.90 ? `\nEXTRACTION COVERAGE: ~${Math.round(coverage * 100)}% of TCA page body is visible below. A SECTION MANIFEST at the top of the TCA content lists every section that exists in the page. Do not flag a section as absent if it appears in the manifest — the manifest is authoritative. For sections shown in detail: flag depth, spec, or structural gaps. For sections in the manifest but not shown in detail: do not comment on content quality.\n` : ''}
TCA'S ACTUAL PAGE CONTENT:
${tcaContent}

COMPETITOR CONTENT TO BENCHMARK AGAINST:
${competitorSection}

Respond with a JSON array of 3–5 gap findings. Be specific — name the missing section, the exact content type, and cite which competitor has it:
[
  {
    "gap": "specific thing missing from TCA's page (be concrete)",
    "priority": "high|medium|low",
    "findingType": "absence_claim|structure_claim|depth_claim|spec_gap",
    "recommendation": "exactly what to add or change, with enough detail to act on",
    "competitor": "domain.com"
  }
]

findingType guide:
- absence_claim: content or section is absent/missing/not present
- spec_gap: missing measurement table, height-range data, numeric specs
- depth_claim: content exists but is shallow, vague, or needs expansion
- structure_claim: content exists but placement, framing, or schema is wrong`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const VALID_TYPES = new Set<FindingType>(['absence_claim', 'structure_claim', 'depth_claim', 'spec_gap']);
    const findings = JSON.parse(match[0]) as { gap: string; priority: string; findingType?: string; recommendation: string; competitor?: string }[];
    return findings.map(f => {
      // Use Claude's classification if valid, otherwise fall back to deterministic classifier
      const claudeType = f.findingType as FindingType | undefined;
      const findingType: FindingType = claudeType && VALID_TYPES.has(claudeType) ? claudeType : classifyFindingType(f.gap);
      return { gap: f.gap, priority: f.priority as 'high' | 'medium' | 'low', recommendation: f.recommendation, competitor: f.competitor, sourceQuery: query, findingType };
    });
  } catch {
    return [];
  }
}

// ─── Finding Type Classification ──────────────────────────────────────────────

// Deterministic fallback classifier — runs after Claude's own classification to validate/correct.
// Precedence: absence_claim > spec_gap > depth_claim > structure_claim (default).
function classifyFindingType(gap: string): FindingType {
  const g = gap.toLowerCase();

  // absence_claim: "is missing", "lacks section", "no X section/table", "not present/found/included"
  if (/\b(is missing|are missing|is absent|not (present|found|visible|included)|lacks?\s+(a\s+)?(section|table|content|information|page)|no\s+.{0,30}\s+(section|table)|does not (exist|include|appear)|empty or missing|not expanded|cuts?\s+off)\b/.test(g)) {
    return 'absence_claim';
  }

  // spec_gap: missing measurements, height-range data, spec tables, numeric values
  if (/\b(spec table|measurement|dimension|height.{0,15}range|seat (height|depth)|back height|armrest|adjustment range|inch(es)?|no data|missing data|specific (number|value|measurement)|weight (capacity|limit)|fit.{0,15}range)\b/.test(g)) {
    return 'spec_gap';
  }

  // depth_claim: shallow coverage, needs more detail — valid under partial visibility
  if (/\b(shallow|not (enough|sufficient)|needs? more|expand|deeper|more detail|lacks? depth|brief|limited|superficial|thin|vague|insufficient)\b/.test(g)) {
    return 'depth_claim';
  }

  // default: structural framing / content arrangement / schema / CTA placement
  return 'structure_claim';
}

// ─── Coverage-Confidence Filter ───────────────────────────────────────────────

// Bands: >90% trust all types; 70–90% soft-downgrade absence+spec high→medium; <70% hard-downgrade both to low.
// depth_claim and structure_claim are always trusted regardless of coverage — they are valid from partial visibility.
// spec_gap is absence-adjacent (missing table/measurement can't be confirmed from truncated excerpt).
function applyConfidenceFilter(findings: GapFinding[], coverage: number): GapFinding[] {
  return findings.map(f => {
    if (coverage > 0.90) return f;

    const isCoverageVulnerable = f.findingType === 'absence_claim' || f.findingType === 'spec_gap';
    if (!isCoverageVulnerable) return f;

    if (coverage < 0.70) {
      return { ...f, priority: 'low' as const, trusted: false, downgradedReason: `hard downgrade: coverage ${Math.round(coverage * 100)}% < 70%, ${f.findingType}` };
    }
    // soft zone 70–90%
    if (f.priority === 'high') {
      return { ...f, priority: 'medium' as const, trusted: false, downgradedReason: `soft downgrade: coverage ${Math.round(coverage * 100)}% in 70–90% range, ${f.findingType}` };
    }
    return f;
  });
}

// ─── Layer 4: Multi-Query Gap Synthesis ───────────────────────────────────────

function synthesizeGaps(allQueryGaps: { query: string; gaps: RawGapFinding[] }[]): GapFinding[] {
  const allRaw = allQueryGaps.flatMap(q => q.gaps);
  const tokenize = (s: string) => s.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !STOPWORDS.has(w));

  // Group semantically similar gaps
  const groups: RawGapFinding[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < allRaw.length; i++) {
    if (assigned.has(i)) continue;
    const tokensI = new Set(tokenize(allRaw[i].gap));
    const group = [allRaw[i]];
    assigned.add(i);

    for (let j = i + 1; j < allRaw.length; j++) {
      if (assigned.has(j)) continue;
      const tokensJ = tokenize(allRaw[j].gap);
      const shared = tokensJ.filter(t => tokensI.has(t)).length;
      if (shared >= 2) { group.push(allRaw[j]); assigned.add(j); }
    }
    groups.push(group);
  }

  return groups.map(group => {
    // Take the most detailed gap description
    const best = group.reduce((a, b) => (b.recommendation.length > a.recommendation.length ? b : a));
    // Cross-query appearances: count distinct source queries
    const uniqueQueries = new Set(group.map(g => g.sourceQuery)).size;
    // Promote priority if gap appears in 2+ queries
    let priority = best.priority;
    if (uniqueQueries >= 2 && priority === 'medium') priority = 'high';
    return { gap: best.gap, priority, rawPriority: priority, recommendation: best.recommendation, competitor: best.competitor, appearsInQueries: uniqueQueries, trusted: true, coverageAtAnalysis: 1.0, findingType: best.findingType };
  })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return b.appearsInQueries - a.appearsInQueries;
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const serpApiKey = process.env.SERP_API_KEY;
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

  if (!serpApiKey || !firecrawlApiKey) {
    console.error('Missing required env vars:');
    if (!serpApiKey) console.error('  SERP_API_KEY — get from serpapi.com');
    if (!firecrawlApiKey) console.error('  FIRECRAWL_API_KEY — get from firecrawl.dev');
    process.exit(1);
  }

  const analysisPath = resolve(ROOT, 'data/gsc/analysis.json');
  const latestPath = resolve(ROOT, 'data/gsc/latest.json');
  if (!existsSync(analysisPath) || !existsSync(latestPath)) {
    console.error('data/gsc/analysis.json or latest.json not found. Run npm run gsc:full first.');
    process.exit(1);
  }

  const analysis = JSON.parse(readFileSync(analysisPath, 'utf-8'));
  const latest = JSON.parse(readFileSync(latestPath, 'utf-8'));
  const allPageQueries: PageQueryRow[] = latest.pageQueries ?? [];

  const configPath = resolve(ROOT, 'data/competitors/config.json');
  const configTargetQueries: string[] = existsSync(configPath)
    ? (JSON.parse(readFileSync(configPath, 'utf-8')).targetQueries ?? [])
    : [];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Select top pages from opportunities (near-p1 first, then content-depth)
  const opportunities: Opportunity[] = (analysis.opportunities ?? [])
    .filter((o: Opportunity) => ['near-p1', 'content-depth'].includes(o.opportunityType))
    .slice(0, MAX_PAGES);

  if (opportunities.length === 0) {
    console.error('No opportunities in analysis.json. Run npm run gsc:analyze.');
    process.exit(1);
  }

  const crawlCache = loadCrawlCache(ROOT);
  const serpCache = loadSerpCache(ROOT);
  let totalCrawls = 0;
  let cacheHits = 0;
  const editorialOutrankerCounts: Record<string, number> = {};
  const pageAnalyses: PageAnalysis[] = [];
  const aioTasks: AIOTask[] = [];
  const aioTasksRejected: (AIOTask & { rejectionReason: string })[] = [];

  console.log(`\nAnalyzing ${opportunities.length} pages × up to 3 queries each...\n`);

  for (const opp of opportunities) {
    const role = detectPageRole(opp.page);
    const { primary, supporting, strategic } = selectQueryTriple(opp.page, role, allPageQueries, configTargetQueries);

    console.log(`[${role}] ${opp.page}`);
    console.log(`  primary:    "${primary}"`);
    console.log(`  supporting: "${supporting}"`);
    console.log(`  strategic:  "${strategic}"`);

    const tcaExtracted = extractTcaContent(ROOT, opp.page);
    const queryAnalyses: QueryAnalysis[] = [];
    const queryGapsForSynthesis: { query: string; gaps: RawGapFinding[] }[] = [];

    const queryTriple: { query: string; type: QueryType }[] = [
      { query: primary, type: 'primary' },
      ...(supporting !== primary ? [{ query: supporting, type: 'supporting' as QueryType }] : []),
      ...(strategic !== primary && strategic !== supporting ? [{ query: strategic, type: 'strategic' as QueryType }] : []),
    ];

    for (const { query, type } of queryTriple) {
      console.log(`  [${type}] "${query}"`);

      const { results: serpResults, aio } = await fetchSerp(query, serpApiKey, serpCache);
      await new Promise(r => setTimeout(r, 1200));

      // AIO suppression check — only for primary query to control Claude API cost
      if (type === 'primary' && aio?.hasAIO && !aio.citedUrls.some(u => u.includes(TCA_DOMAIN))) {
        const citedUrlsReliable = aio.citedUrls.length > 0;
        console.log(`    AIO detected — TCA not cited. passage: ${aio.passageText.length} chars, citedUrls: ${aio.citedUrls.length} (reliable: ${citedUrlsReliable})`);

        if (aio.passageText.length < 50) {
          // AIO exists but text extraction failed — record suppression, skip capsule generation
          console.log(`    Passage too short for capsule — marking pending-passage-text`);
          aioTasks.push({
            page: opp.page, query, aioFormat: aio.passageFormat,
            aioPassage: '', aioCitedUrls: aio.citedUrls, citedUrlsReliable,
            citationCapsule: null, insertAfterHeading: '',
            status: 'pending-passage-text',
          });
        } else {
          try {
            const capsuleMsg = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 512,
              messages: [{
                role: 'user',
                content: `The Google AI Overview for "${query}" uses ${aio.passageFormat} format (${aio.wordCount} words).\nAIO sample: "${aio.passageText.slice(0, 400)}"\nTCA page content (${opp.page}):\n${tcaExtracted.content.slice(0, 2000)}\n\nWrite a 40-60 word standalone citation capsule in ${aio.passageFormat} format for TCA's page on "${query}".\nRules: include specific measurements in inches, include height context (6ft 3in+ users), be self-contained (readable without surrounding context), match the AIO tone exactly.\nReturn your answer using exactly these XML tags and nothing else:\n<capsule>your 40-60 word capsule here</capsule>\n<heading>closest matching H2 or H3 heading from the page</heading>`,
              }],
            });
            const rawText: string = (capsuleMsg.content[0] as any).text ?? '';
            const capsule = rawText.match(/<capsule>([\s\S]*?)<\/capsule>/)?.[1]?.trim();
            const heading = rawText.match(/<heading>([\s\S]*?)<\/heading>/)?.[1]?.trim();
            if (!capsule) throw new Error('no <capsule> tag in response');

            // Spec validation: all measurements in capsule must exist in raw page source
            const rawPagePath = (() => {
              const slug = opp.page.replace(/^\//, '').replace(/\/$/, '');
              for (const c of [`src/pages/${slug}.astro`, `src/pages/${slug}/index.astro`]) {
                const p = resolve(ROOT, c); if (existsSync(p)) return p;
              }
              return '';
            })();
            const rawPageSource = rawPagePath ? readFileSync(rawPagePath, 'utf-8') : '';
            const specCheck = rawPageSource ? validateCapsuleSpecs(capsule, rawPageSource) : { valid: true, mismatches: [] };

            if (!specCheck.valid) {
              console.warn(`    Capsule rejected — spec mismatch: ${specCheck.mismatches.join(', ')} not in page source`);
              aioTasksRejected.push({
                page: opp.page, query, aioFormat: aio.passageFormat,
                aioPassage: aio.passageText.slice(0, 300), aioCitedUrls: aio.citedUrls, citedUrlsReliable,
                citationCapsule: capsule, insertAfterHeading: heading ?? '',
                status: 'generated', rejectionReason: `spec mismatch: ${specCheck.mismatches.join(', ')}`,
              });
            } else {
              aioTasks.push({
                page: opp.page, query, aioFormat: aio.passageFormat,
                aioPassage: aio.passageText.slice(0, 300), aioCitedUrls: aio.citedUrls, citedUrlsReliable,
                citationCapsule: capsule, insertAfterHeading: heading ?? '',
                status: 'generated',
              });
              console.log(`    AIO capsule written (spec validated)`);
            }
          } catch (e: any) { console.warn(`    AIO capsule parse failed: ${e.message}`); }
        }
      }

      // Use verified editorial first; only backfill with unknown-editorial if short of MIN_EDITORIAL_FOR_ANALYSIS
      const knownEditorial = serpResults.filter(r => r.lane === 'editorial');
      const unknownEditorial = serpResults.filter(r => r.lane === 'unknown-editorial');
      const editorialTargets = [
        ...knownEditorial,
        ...(knownEditorial.length < MIN_EDITORIAL_FOR_ANALYSIS ? unknownEditorial : []),
      ].slice(0, 3);
      const brandTargets = serpResults.filter(r => r.lane === 'brand').slice(0, 2);

      editorialTargets.forEach(r => {
        editorialOutrankerCounts[r.domain] = (editorialOutrankerCounts[r.domain] ?? 0) + 1;
      });

      console.log(`    editorial: [${editorialTargets.map(r => r.domain).join(', ')}]`);
      if (brandTargets.length) console.log(`    brand:     [${brandTargets.map(r => r.domain).join(', ')}]`);

      if (editorialTargets.length < MIN_EDITORIAL_FOR_ANALYSIS) {
        console.log(`    → gate: no editorial results, skipping`);
        queryAnalyses.push({ query, queryType: type, editorialTargets, brandTargets, crawledContent: [], gateStatus: 'no-editorial-results', rawGaps: [] });
        continue;
      }

      // Crawl editorial targets (cache-aware)
      const crawledContent: CompetitorContent[] = [];
      let budgetExhausted = false;
      for (const target of editorialTargets) {
        if (totalCrawls >= MAX_CRAWLS_PER_RUN) {
          budgetExhausted = true;
          break;
        }

        if (UNCRAWLABLE_DOMAINS.has(target.domain)) {
          console.log(`    skipping uncrawlable: ${target.domain}`);
          continue;
        }

        const cached = crawlCache.get(target.link);
        if (cached && isCacheFresh(cached)) {
          console.log(`    cache hit: ${target.domain}`);
          crawledContent.push({ ...cached, fromCache: true });
          cacheHits++;
        } else {
          console.log(`    crawling:  ${target.link.slice(0, 70)}`);
          const content = await crawlUrl(target.link, firecrawlApiKey, target.lane);
          await new Promise(r => setTimeout(r, 2000));
          totalCrawls++;

          if (!content.error) {
            crawlCache.set(target.link, { url: content.url, domain: content.domain, title: content.title, markdown: content.markdown, wordCount: content.wordCount, fetchedAt: content.fetchedAt, lane: target.lane });
            console.log(`    ok — ${content.wordCount} words`);
          } else {
            console.warn(`    error: ${content.error}`);
          }
          crawledContent.push(content);
        }
      }

      if (budgetExhausted) {
        console.log(`    → budget exhausted, skipping`);
        queryAnalyses.push({ query, queryType: type, editorialTargets, brandTargets, crawledContent, gateStatus: 'skipped-crawl-budget', rawGaps: [] });
        continue;
      }

      // Gap analysis
      console.log(`    analyzing gaps...`);
      const rawGaps = await analyzeGaps(client, role, opp.page, query, type, tcaExtracted.content, crawledContent, tcaExtracted.coverage);
      console.log(`    gaps: ${rawGaps.length}`);

      queryAnalyses.push({ query, queryType: type, editorialTargets, brandTargets, crawledContent: crawledContent.map(c => ({ ...c, markdown: c.markdown.slice(0, 400) })), gateStatus: 'passed', rawGaps });
      queryGapsForSynthesis.push({ query, gaps: rawGaps });
    }

    const allSynthesizedGaps = synthesizeGaps(queryGapsForSynthesis)
      .map(g => ({ ...g, coverageAtAnalysis: tcaExtracted.coverage }));
    const synthesizedGaps = applyConfidenceFilter(allSynthesizedGaps, tcaExtracted.coverage);
    const downgraded = synthesizedGaps.filter(g => !g.trusted);
    const trusted = synthesizedGaps.filter(g => g.trusted);
    console.log(`  coverage: ${Math.round(tcaExtracted.coverage * 100)}% | synthesized: ${synthesizedGaps.length} unique gaps (${trusted.filter(g => g.priority === 'high').length} high trusted${downgraded.length ? `, ${downgraded.length} downgraded` : ''})\n`);

    pageAnalyses.push({
      tcaPage: opp.page,
      pageRole: role,
      tcaCoverage: tcaExtracted.coverage,
      selectedQueries: { primary, supporting, strategic },
      queryAnalyses,
      synthesizedGaps,
      allSynthesizedGaps,
      tcaContentSample: tcaExtracted.content.slice(0, 300),
    });
  }

  // Save caches before writing output (even if later steps fail)
  saveCrawlCache(ROOT, crawlCache);
  saveSerpCache(ROOT, serpCache);

  // Write GEO capsule tasks report
  if (aioTasks.length > 0) {
    const taskMd = [
      `## GEO Optimize Tasks — ${today()}\n`,
      ...aioTasks.map(t => [
        `### ${t.page}`,
        `- Query: "${t.query}"`,
        `- AIO format: ${t.aioFormat}, cited: ${t.aioCitedUrls.slice(0, 2).join(', ')}`,
        `- Insert after: "${t.insertAfterHeading}"`,
        `- Citation capsule:\n  > ${t.citationCapsule}`,
        '',
      ].join('\n')),
    ].join('\n');
    mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
    writeFileSync(resolve(ROOT, 'reports/geo-optimize-tasks.md'), taskMd);
    console.log(`  GEO tasks: ${aioTasks.length} → reports/geo-optimize-tasks.md`);
  }

  // Apply validated capsules directly to .astro pages
  const pendingCount = aioTasks.filter(t => t.status === 'pending-passage-text').length;
  const toApply = aioTasks.filter(t => t.status === 'generated' && t.citationCapsule);
  if (toApply.length > 0) {
    console.log(`\nApplying ${toApply.length} capsule(s) to src/pages/...`);
    for (const task of toApply) {
      const result = applyCapsuleToPage(ROOT, task.page, task.insertAfterHeading, task.citationCapsule!);
      task.status = result;
      console.log(`  ${task.page} → ${result}`);
    }
  }
  if (pendingCount > 0) console.log(`  ${pendingCount} task(s) pending passage text — will auto-resolve when SerpAPI returns AIO text`);
  if (aioTasksRejected.length > 0) console.log(`  ${aioTasksRejected.length} capsule(s) rejected (spec mismatch) — see aioTasksRejected in intelligence.json`);

  // Top gaps across all pages, weighted by appearsInQueries
  const topGaps: GapFinding[] = pageAnalyses
    .flatMap(p => p.synthesizedGaps)
    .filter(g => g.trusted && (g.priority === 'high' || g.priority === 'medium'))
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return b.appearsInQueries - a.appearsInQueries;
    })
    .slice(0, 12);

  const highCount = topGaps.filter(g => g.priority === 'high').length;
  const topOutrankers = Object.entries(editorialOutrankerCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([d]) => d);

  const summary = `${pageAnalyses.length} pages analyzed × up to 3 queries each. ${totalCrawls} URLs crawled (${cacheHits} cache hits). ${highCount} high-priority gaps. Top editorial outrankers: ${topOutrankers.join(', ')}.`;

  const appliedCount = aioTasks.filter(t => t.status === 'applied').length;
  const output: IntelligenceOutput = {
    generatedAt: new Date().toISOString(),
    pagesAnalyzed: pageAnalyses.length,
    queriesRun: pageAnalyses.reduce((n, p) => n + p.queryAnalyses.length, 0),
    urlsCrawled: totalCrawls,
    cacheHits,
    pages: pageAnalyses,
    topGaps,
    editorialOutrankers: editorialOutrankerCounts,
    aioTasks,
    aioTasksRejected,
    summary,
  };

  mkdirSync(resolve(ROOT, 'data/competitors'), { recursive: true });
  writeFileSync(resolve(ROOT, 'data/competitors/intelligence.json'), JSON.stringify(output, null, 2));
  archiveJsonToRaw(ROOT, 'competitors', `${today()}-intelligence.json`, output);
  updateCompetitorLandscape(output);
  const pendingPassage = aioTasks.filter(t => t.status === 'pending-passage-text').length;
  appendWikiLog(ROOT, `## [${today()}] competitor-intelligence v2.2 | Strategic Run\n\n- Pages: ${output.pagesAnalyzed} | Queries: ${output.queriesRun} | Crawls: ${output.urlsCrawled} (${output.cacheHits} cached)\n- High-priority gaps: ${highCount}\n- AIO tasks: ${aioTasks.length} generated | ${appliedCount} applied to src/pages/ | ${aioTasksRejected.length} rejected (spec mismatch) | ${pendingPassage} pending passage text\n- ${summary}\n`);

  console.log(`Done.`);
  console.log(`  Pages: ${output.pagesAnalyzed} | Queries run: ${output.queriesRun} | URLs crawled: ${output.urlsCrawled} (${cacheHits} cached)`);
  console.log(`  High-priority gaps: ${highCount}`);
  console.log(`  AIO tasks: ${aioTasks.length} | applied: ${appliedCount} | rejected: ${aioTasksRejected.length} | pending-passage: ${aioTasks.filter(t => t.status === 'pending-passage-text').length}`);
  console.log(`  Output: data/competitors/intelligence.json`);
}

function updateCompetitorLandscape(output: IntelligenceOutput): void {
  const existingPage = readWikiPage(ROOT, 'pages/concepts/competitor-landscape.md');
  if (!existingPage) { console.warn('  competitor-landscape.md not found — skipping wiki update'); return; }

  const gapRows = output.topGaps.slice(0, 10)
    .map(g => `| ${today()} | ${g.gap.slice(0, 80)} | ${g.priority} | ${g.appearsInQueries}q | ${g.competitor ?? ''} |`)
    .join('\n');

  const newSection = `## Recent Competitor Gaps\n\n*v2 run ${today()}. ${output.summary}*\n\n| Date | Gap | Priority | Queries | Competitor |\n|------|-----|----------|---------|------------|\n${gapRows}\n`;
  let updatedPage = existingPage.replace(/last_updated: .*/, `last_updated: ${today()}`);

  if (updatedPage.includes('## Recent Competitor Gaps')) {
    const start = updatedPage.indexOf('## Recent Competitor Gaps');
    const before = updatedPage.slice(0, start);
    const afterMatch = updatedPage.slice(start + 26).match(/\n## /);
    const after = afterMatch ? updatedPage.slice(start + 26 + (afterMatch.index ?? 0)) : '';
    writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md', before + newSection + after);
  } else {
    writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md', updatedPage + '\n\n' + newSection);
  }
  console.log('  Updated wiki/pages/concepts/competitor-landscape.md');
}

main().catch(err => { console.error(err.message); process.exit(1); });
