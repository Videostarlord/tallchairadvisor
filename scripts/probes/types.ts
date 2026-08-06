/**
 * probes/types.ts — the output contract of §7.5.
 *
 * THE ONE RULE THIS FILE ENCODES
 * A field the probe could not measure is `null`. Never a plausible default.
 * `gtagFired: false` must mean "a real browser loaded this page, waited, and no
 * GA4 collect request completed" — never "we didn't look". The June 16 incident
 * (CSP blocked GA4 for a month behind healthy-looking dashboards) is exactly what
 * a "didn't check" masquerading as a measurement produces.
 *
 * Where `null` is not expressible because the field is a boolean, the probe pushes
 * a sentence into `errors[]` and sets `healthy:false`. A consumer must treat
 * `healthy:false` as "this record proves nothing", not as "the page is broken".
 */

/** One JSON-LD node found in the page. One entry per top-level node, not per <script>. */
export interface ProbeJsonLd {
  /** `@type` verbatim; multiple types joined with '+'; '(untyped)' / '(unparseable)'. */
  type: string;
  /** The block parsed AND carried a usable `@type`. */
  valid: boolean;
  /** Exact script text when the block held one node; the node re-serialised otherwise. */
  raw: string;
}

export interface ProbeHead {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: ProbeJsonLd[];
  jsonLdParseErrors: string[];
}

export interface ProbeRequest {
  url: string;
  /** null = the request never produced a response (blocked, aborted, DNS, CSP-refused). */
  status: number | null;
  method: string;
}

export interface ProbeNetwork {
  /** A GA4 `/g/collect` request COMPLETED with a <400 response. Not "a script tag exists". */
  gtagFired: boolean;
  /** A *.clarity.ms request completed with a <400 response. */
  clarityLoaded: boolean;
  /** The document-level affiliate click listener intercepted a synthetic click and emitted. */
  affiliateHandlerAttached: boolean;
  /** Analytics/affiliate-relevant requests plus every failed request. Not the full waterfall. */
  requests: ProbeRequest[];
}

export interface ProbeVitals {
  /** ms. null when no largest-contentful-paint entry was ever observed. */
  lcp: number | null;
  /** Largest session window, unitless. null when the layout-shift observer is unsupported. */
  cls: number | null;
  /** ms, worst interaction latency. null when no qualifying interaction was recorded. */
  inp: number | null;
}

export interface ProbeGeo {
  directAnswerPresent: boolean;
  citationCapsulePresent: boolean;
  faqPageSchemaValid: boolean;
  answerFirstOrdering: boolean;
}

/**
 * Interop mirror for scripts/lib/predicates/tag-fires.ts.
 *
 * `tagFired()` there scans `record`, `record.tags`, `record.network`, `record.tagsFired`
 * for a key whose lowercase name equals the tag ('gtag' | 'clarity'). None of the
 * §7.5 field names (`gtagFired`, `clarityLoaded`) match, so without this mirror every
 * tag-fires predicate would read `unevaluable` forever — the probe would run nightly
 * and close nothing. Additive, never authoritative: `network.*` is the source of truth
 * and these are copied from it.
 *
 * null = not measured, which `tagFired()` correctly ignores (it only accepts booleans).
 */
export interface ProbeTagMirror {
  gtag: boolean | null;
  clarity: boolean | null;
  affiliate: boolean | null;
}

export interface ProbeResult {
  /** Path form, trailing slash: '/review/gesture/'. */
  url: string;
  status: number;
  redirectedTo: string | null;
  skipped: 'redirect-source' | 'noindex' | null;
  consoleErrors: { text: string; location: string }[];
  unhandledRejections: string[];
  network: ProbeNetwork;
  head: ProbeHead;
  vitals: ProbeVitals;
  geo: ProbeGeo;
  /** Non-empty means PARTIAL: something in this record is missing or unmeasured. */
  errors: string[];
  /** false = the probe itself could not complete. The record proves nothing. */
  healthy: boolean;

  // ── additive, documented above ──────────────────────────────────────────────
  /** ISO timestamp of the observation. Read by the predicate evaluators for evidence. */
  observedAt: string;
  /** Mirror consumed by predicates/tag-fires.ts. See ProbeTagMirror. */
  tags: ProbeTagMirror;
}

export interface ProbeFile {
  generatedAt: string;
  siteUrl: string;
  results: ProbeResult[];
}
