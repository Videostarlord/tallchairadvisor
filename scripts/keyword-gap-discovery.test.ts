import {
  buildGscRankingSet,
  buildTrueKeywordGaps,
  canonicalizeCompetitorUrl,
  extractCompetitorTargets,
  normalizeKeyword,
  type RankedKeywordRow,
} from './keyword-gap-discovery-logic.ts';

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed += 1;
  } else {
    console.error(`  FAIL: ${label}`);
    failed += 1;
  }
}

console.log('\nCanonicalization tests:');
assert(
  'canonicalizeCompetitorUrl strips query params and hash',
  canonicalizeCompetitorUrl('https://example.com/path/?utm=1#frag') === 'https://example.com/path',
);
assert(
  'canonicalizeCompetitorUrl preserves root path',
  canonicalizeCompetitorUrl('https://example.com/?a=1') === 'https://example.com/',
);

console.log('\nExtraction tests:');
const intelligenceFixture = {
  pages: [
    {
      queryAnalyses: [
        {
          query: 'best office chair for tall people',
          editorialTargets: [
            {
              link: 'https://example.com/review?srsltid=abc',
              domain: 'example.com',
              title: 'Example Review',
              position: 2,
            },
            {
              link: 'https://example.com/review?utm=def',
              domain: 'example.com',
              title: 'Example Review',
              position: 3,
            },
            {
              link: 'https://second.com/best-chair/',
              domain: 'second.com',
              title: 'Second Chair',
              position: 1,
            },
          ],
        },
      ],
    },
  ],
};

const competitorTargets = extractCompetitorTargets(intelligenceFixture, 10);
assert('extractCompetitorTargets dedupes canonical URLs', competitorTargets.length === 2);
assert(
  'extractCompetitorTargets aggregates surfaced_count',
  competitorTargets[0].surfaced_count === 2 || competitorTargets[1].surfaced_count === 2,
);

console.log('\nGSC set tests:');
const gscSet = buildGscRankingSet({
  queries: [{ query: 'Best Office Chair For Tall People' }, { query: 'Office Chair Dimensions' }],
});
assert('buildGscRankingSet normalizes casing and spacing', gscSet.has(normalizeKeyword('best office chair for tall people')));

console.log('\nGap build tests:');
const rankedRows: RankedKeywordRow[] = [
  {
    keyword: 'best office chair for tall people',
    normalized_keyword: normalizeKeyword('best office chair for tall people'),
    core_keyword: null,
    search_volume: 880,
    cpc: 4.65,
    competition_level: 'HIGH',
    keyword_difficulty: 12,
    intent: 'commercial',
    search_volume_trend: { monthly: 22, quarterly: 0, yearly: -12 },
    competitor_domain: 'example.com',
    competitor_target_url: 'https://example.com/review',
    competitor_page_title: 'Example Review',
    competitor_rank_group: 2,
    competitor_rank_absolute: 2,
    surfaced_count: 2,
    surfaced_by_queries: ['best office chair for tall people'],
  },
  {
    keyword: 'office chair for long legs',
    normalized_keyword: normalizeKeyword('office chair for long legs'),
    core_keyword: null,
    search_volume: 320,
    cpc: 3.2,
    competition_level: 'MEDIUM',
    keyword_difficulty: 18,
    intent: 'commercial',
    search_volume_trend: { monthly: 0, quarterly: 0, yearly: 0 },
    competitor_domain: 'example.com',
    competitor_target_url: 'https://example.com/review',
    competitor_page_title: 'Example Review',
    competitor_rank_group: 3,
    competitor_rank_absolute: 3,
    surfaced_count: 2,
    surfaced_by_queries: ['best office chair for tall people'],
  },
  {
    keyword: 'office chair for long legs',
    normalized_keyword: normalizeKeyword('office chair for long legs'),
    core_keyword: null,
    search_volume: 320,
    cpc: 3.2,
    competition_level: 'MEDIUM',
    keyword_difficulty: 18,
    intent: 'commercial',
    search_volume_trend: { monthly: 0, quarterly: 0, yearly: 0 },
    competitor_domain: 'second.com',
    competitor_target_url: 'https://second.com/best-chair',
    competitor_page_title: 'Second Chair',
    competitor_rank_group: 4,
    competitor_rank_absolute: 4,
    surfaced_count: 1,
    surfaced_by_queries: ['best office chair for tall people'],
  },
  {
    keyword: 'forbes office chair list',
    normalized_keyword: normalizeKeyword('forbes office chair list'),
    core_keyword: null,
    search_volume: 90,
    cpc: 1.5,
    competition_level: 'LOW',
    keyword_difficulty: 5,
    intent: 'navigational',
    search_volume_trend: { monthly: 0, quarterly: 0, yearly: 0 },
    competitor_domain: 'forbes.com',
    competitor_target_url: 'https://forbes.com/list',
    competitor_page_title: 'Forbes List',
    competitor_rank_group: 1,
    competitor_rank_absolute: 1,
    surfaced_count: 1,
    surfaced_by_queries: ['best office chair for tall people'],
  },
];

const { gaps, stats } = buildTrueKeywordGaps(rankedRows, gscSet);
assert('buildTrueKeywordGaps filters already ranking keywords', stats.filtered_already_ranking === 1);
assert('buildTrueKeywordGaps filters navigational keywords', stats.filtered_navigational === 1);
assert('buildTrueKeywordGaps groups duplicate competitor rows into one keyword gap', gaps.length === 1);
assert('grouped gap aggregates competitor_count', gaps[0]?.competitor_count === 2);
assert('grouped gap uses not-ranking status', gaps[0]?.tca_status === 'not-ranking');

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
