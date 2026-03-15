export interface ApifyRedditLiteInput {
  startUrls?: Array<{ url: string }>;
  searches?: string[];
  searchCommunityName?: string;
  searchPosts?: boolean;
  searchComments?: boolean;
  searchCommunities?: boolean;
  searchUsers?: boolean;
  skipComments?: boolean;
  skipUserPosts?: boolean;
  skipCommunity?: boolean;
  ignoreStartUrls?: boolean;
  sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
  time?: 'all' | 'year' | 'month' | 'week' | 'day' | 'hour';
  postDateLimit?: string;
  commentDateLimit?: string;
  includeNSFW?: boolean;
  maxItems?: number;
  maxPostCount?: number;
  maxComments?: number;
  maxCommunitiesCount?: number;
  maxUserCount?: number;
  scrollTimeout?: number;
  proxy?: {
    useApifyProxy?: boolean;
    apifyProxyGroups?: string[];
  };
  debugMode?: boolean;
}

export interface ChairRegistryEntry {
  chairId: string;
  brand: string;
  model: string;
  reviewPath: string;
  searches: string[];
  comparisonSearches: string[];
  subredditScopes: string[];
  aliases: string[];
  postDateLimitDefault: string;
  commentDateLimitDefault: string;
}

export interface NormalizedPost {
  id: string;
  type: 'post' | 'comment';
  title?: string;
  body: string;
  permalink: string;
  subreddit: string;
  author: string;
  score: number;
  createdAt: string;
  relevanceScore: number;
  ownerSignal: boolean;
  tallUserSignal: boolean;
  chairId: string;
}

export interface NormalizedRedditEvidence {
  chairId: string;
  normalizedAt: string;
  postCount: number;
  commentCount: number;
  items: NormalizedPost[];
}

export interface QuoteCandidate {
  text: string;
  permalink: string;
  author: string;
  score: number;
  subreddit: string;
}

export interface ChairRedditInsights {
  chairId: string;
  generatedAt: string;
  corpusSummary: string;
  ownerReportCounts: {
    confirmed: number;
    likely: number;
  };
  topPositiveThemes: string[];
  topNegativeThemes: string[];
  tallUserFindings: string[];
  comparisonPatterns: string[];
  durabilityPatterns: string[];
  quoteCandidates: QuoteCandidate[];
  faqAngles: string[];
  editorialWarnings: string[];
  pageSnippets: {
    whatRedditOwnersLike: string;
    commonComplaints: string;
    tallUserNotes: string;
  };
}

export interface RunManifest {
  runId: string;
  chairId: string;
  runType: 'search' | 'thread-expansion';
  runStamp: string;
  apifyRunId: string;
  defaultDatasetId: string;
  itemCount: number;
  inputSummary: {
    searches?: string[];
    startUrls?: string[];
    sort?: string;
    time?: string;
  };
  startedAt: string;
  finishedAt: string;
}
