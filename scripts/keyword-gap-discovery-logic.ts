export const HEIGHT_MODIFIERS = [
  'tall',
  "6'",
  'big and tall',
  'large frame',
  'long legs',
];

export const DEFAULT_MAX_TARGETS = 25;
export const DEFAULT_LIMIT_PER_TARGET = 200;
export const DEFAULT_MAX_COMPETITOR_RANK = 20;

export interface CompetitorTarget {
  target: string;
  domain: string;
  title: string;
  best_position: number;
  surfaced_count: number;
  surfaced_by_queries: string[];
}

export interface RankedKeywordRow {
  keyword: string;
  normalized_keyword: string;
  core_keyword: string | null;
  search_volume: number;
  cpc: number | null;
  competition_level: string | null;
  keyword_difficulty: number | null;
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null;
  search_volume_trend: {
    monthly: number | null;
    quarterly: number | null;
    yearly: number | null;
  } | null;
  competitor_domain: string;
  competitor_target_url: string;
  competitor_page_title: string;
  competitor_rank_group: number | null;
  competitor_rank_absolute: number | null;
  surfaced_count: number;
  surfaced_by_queries: string[];
}

export interface GapCompetitor {
  domain: string;
  page_url: string;
  page_title: string;
  rank_group: number | null;
  rank_absolute: number | null;
  surfaced_count: number;
  surfaced_by_queries: string[];
}

export interface TrueKeywordGap {
  keyword: string;
  normalized_keyword: string;
  core_keyword: string | null;
  search_volume: number;
  cpc: number | null;
  competition_level: string | null;
  keyword_difficulty: number | null;
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null;
  search_volume_trend: {
    monthly: number | null;
    quarterly: number | null;
    yearly: number | null;
  } | null;
  tca_status: 'not-ranking';
  best_competitor_rank: number | null;
  competitor_count: number;
  score: number;
  competitors: GapCompetitor[];
}

export interface GapBuildStats {
  total_rows: number;
  filtered_already_ranking: number;
  filtered_navigational: number;
  filtered_zero_volume: number;
  grouped_gap_count: number;
}

export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalizeCompetitorUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    url.search = '';
    url.hash = '';
    const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
    return `${url.origin}${pathname}`;
  } catch {
    return null;
  }
}

export function extractCompetitorTargets(
  intelligence: unknown,
  maxTargets = DEFAULT_MAX_TARGETS,
): CompetitorTarget[] {
  const rows = ((intelligence as any)?.pages ?? []) as any[];
  const byTarget = new Map<string, CompetitorTarget>();

  for (const page of rows) {
    for (const queryAnalysis of (page?.queryAnalyses ?? [])) {
      const query = String(queryAnalysis?.query ?? '').trim();
      for (const target of (queryAnalysis?.editorialTargets ?? [])) {
        const canonicalTarget = canonicalizeCompetitorUrl(String(target?.link ?? ''));
        if (!canonicalTarget) continue;

        const current = byTarget.get(canonicalTarget);
        const domain = String(target?.domain ?? '');
        const title = String(target?.title ?? '').trim();
        const position = Number(target?.position ?? 999);

        if (!current) {
          byTarget.set(canonicalTarget, {
            target: canonicalTarget,
            domain,
            title,
            best_position: position,
            surfaced_count: 1,
            surfaced_by_queries: query ? [query] : [],
          });
          continue;
        }

        current.best_position = Math.min(current.best_position, position);
        current.surfaced_count += 1;
        if (query && !current.surfaced_by_queries.includes(query)) {
          current.surfaced_by_queries.push(query);
        }
        if (!current.title && title) current.title = title;
      }
    }
  }

  return [...byTarget.values()]
    .sort((a, b) => {
      if (b.surfaced_count !== a.surfaced_count) return b.surfaced_count - a.surfaced_count;
      if (a.best_position !== b.best_position) return a.best_position - b.best_position;
      return a.target.localeCompare(b.target);
    })
    .slice(0, maxTargets);
}

export function buildGscRankingSet(gscData: unknown): Set<string> {
  const set = new Set<string>();

  for (const collection of ['queries', 'pageQueries'] as const) {
    for (const queryRow of ((gscData as any)?.[collection] ?? [])) {
      const query = String(queryRow?.query ?? '').trim();
      if (!query) continue;
      set.add(normalizeKeyword(query));
    }
  }

  return set;
}

export function buildRankedKeywordsTasks(
  targets: CompetitorTarget[],
  limitPerTarget = DEFAULT_LIMIT_PER_TARGET,
  maxCompetitorRank = DEFAULT_MAX_COMPETITOR_RANK,
): object[] {
  return targets.map((target) => ({
    target: target.target,
    location_name: 'United States',
    language_name: 'English',
    item_types: ['organic'],
    ignore_synonyms: true,
    historical_serp_mode: 'live',
    load_rank_absolute: true,
    limit: limitPerTarget,
    filters: [
      ['keyword_data.keyword_info.search_volume', '>', 0],
      'and',
      ['ranked_serp_element.serp_item.rank_group', '<=', maxCompetitorRank],
    ],
    order_by: [
      'ranked_serp_element.serp_item.rank_group,asc',
      'keyword_data.keyword_info.search_volume,desc',
    ],
  }));
}

export function flattenRankedKeywordResponse(
  body: unknown,
  targetsByCanonicalUrl: Map<string, CompetitorTarget>,
): RankedKeywordRow[] {
  const rows: RankedKeywordRow[] = [];
  const tasks = ((body as any)?.tasks ?? []) as any[];

  for (const task of tasks) {
    const taskTargetRaw = String(task?.data?.target ?? '');
    const canonicalTarget = canonicalizeCompetitorUrl(taskTargetRaw) ?? taskTargetRaw;
    const targetMeta = targetsByCanonicalUrl.get(canonicalTarget);
    if (!targetMeta) continue;

    for (const result of (task?.result ?? [])) {
      for (const item of (result?.items ?? [])) {
        const keyword = String(item?.keyword_data?.keyword ?? '').trim();
        if (!keyword) continue;

        rows.push({
          keyword,
          normalized_keyword: normalizeKeyword(keyword),
          core_keyword: item?.keyword_data?.keyword_properties?.core_keyword ?? null,
          search_volume: Number(item?.keyword_data?.keyword_info?.search_volume ?? 0),
          cpc: item?.keyword_data?.keyword_info?.cpc ?? null,
          competition_level: item?.keyword_data?.keyword_info?.competition_level ?? null,
          keyword_difficulty: item?.keyword_data?.keyword_properties?.keyword_difficulty ?? null,
          intent: item?.keyword_data?.search_intent_info?.main_intent ?? null,
          search_volume_trend: item?.keyword_data?.keyword_info?.search_volume_trend
            ? {
                monthly: item.keyword_data.keyword_info.search_volume_trend.monthly ?? null,
                quarterly: item.keyword_data.keyword_info.search_volume_trend.quarterly ?? null,
                yearly: item.keyword_data.keyword_info.search_volume_trend.yearly ?? null,
              }
            : null,
          competitor_domain: targetMeta.domain,
          competitor_target_url: targetMeta.target,
          competitor_page_title: targetMeta.title,
          competitor_rank_group: item?.ranked_serp_element?.serp_item?.rank_group ?? null,
          competitor_rank_absolute: item?.ranked_serp_element?.serp_item?.rank_absolute ?? null,
          surfaced_count: targetMeta.surfaced_count,
          surfaced_by_queries: targetMeta.surfaced_by_queries,
        });
      }
    }
  }

  return rows;
}

function scoreIntent(intent: TrueKeywordGap['intent']): number {
  if (intent === 'commercial' || intent === 'transactional') return 1;
  if (intent === 'informational') return 0.4;
  return 0;
}

function scoreVolume(searchVolume: number): number {
  return Math.min(Math.log10(Math.max(searchVolume, 1)) / Math.log10(10000), 1);
}

function scoreRank(bestRank: number | null): number {
  if (!bestRank || bestRank <= 0) return 0;
  return Math.max((DEFAULT_MAX_COMPETITOR_RANK + 1 - bestRank) / DEFAULT_MAX_COMPETITOR_RANK, 0);
}

function scoreQualifier(keyword: string): number {
  const lowered = keyword.toLowerCase();
  return HEIGHT_MODIFIERS.some((modifier) => lowered.includes(modifier)) ? 1 : 0;
}

function scoreCompetitorBreadth(competitorCount: number): number {
  return Math.min(competitorCount / 3, 1);
}

function computeGapScore(gap: Omit<TrueKeywordGap, 'score'>): number {
  const rawScore =
    (scoreIntent(gap.intent) * 0.35) +
    (scoreVolume(gap.search_volume) * 0.25) +
    (scoreRank(gap.best_competitor_rank) * 0.20) +
    (scoreQualifier(gap.keyword) * 0.10) +
    (scoreCompetitorBreadth(gap.competitor_count) * 0.10);

  return Math.round(rawScore * 1000) / 1000;
}

export function buildTrueKeywordGaps(
  rankedRows: RankedKeywordRow[],
  gscRankingSet: Set<string>,
): { gaps: TrueKeywordGap[]; stats: GapBuildStats } {
  const stats: GapBuildStats = {
    total_rows: rankedRows.length,
    filtered_already_ranking: 0,
    filtered_navigational: 0,
    filtered_zero_volume: 0,
    grouped_gap_count: 0,
  };

  const grouped = new Map<string, Omit<TrueKeywordGap, 'score'>>();

  for (const row of rankedRows) {
    if (gscRankingSet.has(row.normalized_keyword)) {
      stats.filtered_already_ranking += 1;
      continue;
    }

    if (row.intent === 'navigational') {
      stats.filtered_navigational += 1;
      continue;
    }

    if (!row.search_volume || row.search_volume <= 0) {
      stats.filtered_zero_volume += 1;
      continue;
    }

    const existing = grouped.get(row.normalized_keyword);
    const competitorEntry: GapCompetitor = {
      domain: row.competitor_domain,
      page_url: row.competitor_target_url,
      page_title: row.competitor_page_title,
      rank_group: row.competitor_rank_group,
      rank_absolute: row.competitor_rank_absolute,
      surfaced_count: row.surfaced_count,
      surfaced_by_queries: row.surfaced_by_queries,
    };

    if (!existing) {
      grouped.set(row.normalized_keyword, {
        keyword: row.keyword,
        normalized_keyword: row.normalized_keyword,
        core_keyword: row.core_keyword,
        search_volume: row.search_volume,
        cpc: row.cpc,
        competition_level: row.competition_level,
        keyword_difficulty: row.keyword_difficulty,
        intent: row.intent,
        search_volume_trend: row.search_volume_trend,
        tca_status: 'not-ranking',
        best_competitor_rank: row.competitor_rank_group,
        competitor_count: 1,
        competitors: [competitorEntry],
      });
      continue;
    }

    if (row.search_volume > existing.search_volume) {
      existing.keyword = row.keyword;
      existing.search_volume = row.search_volume;
      existing.cpc = row.cpc;
      existing.competition_level = row.competition_level;
      existing.keyword_difficulty = row.keyword_difficulty;
      existing.intent = row.intent;
      existing.search_volume_trend = row.search_volume_trend;
      existing.core_keyword = row.core_keyword;
    }

    existing.best_competitor_rank = existing.best_competitor_rank == null
      ? row.competitor_rank_group
      : row.competitor_rank_group == null
        ? existing.best_competitor_rank
        : Math.min(existing.best_competitor_rank, row.competitor_rank_group);

    const alreadyHasCompetitor = existing.competitors.some(
      (competitor) => competitor.page_url === competitorEntry.page_url,
    );
    if (!alreadyHasCompetitor) {
      existing.competitors.push(competitorEntry);
      existing.competitor_count += 1;
    }
  }

  const gaps = [...grouped.values()]
    .map((gap) => ({
      ...gap,
      competitors: gap.competitors.sort((a, b) => {
        const aRank = a.rank_group ?? 999;
        const bRank = b.rank_group ?? 999;
        if (aRank !== bRank) return aRank - bRank;
        return a.domain.localeCompare(b.domain);
      }),
      score: computeGapScore(gap),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.search_volume !== a.search_volume) return b.search_volume - a.search_volume;
      return (a.best_competitor_rank ?? 999) - (b.best_competitor_rank ?? 999);
    });

  stats.grouped_gap_count = gaps.length;

  return { gaps, stats };
}
