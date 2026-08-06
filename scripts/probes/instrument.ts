/**
 * probes/instrument.ts — the script injected before any page script runs.
 *
 * CORE WEB VITALS METHOD: raw PerformanceObserver. No `web-vitals` npm dependency
 * (PRD §7.5 forbids adding one) and no vendored UMD bundle to keep in sync. The
 * three metrics are small enough to implement exactly:
 *
 *   LCP — last `largest-contentful-paint` entry before the first interaction.
 *   CLS — largest 1s-gap / 5s-cap session window of non-input layout shifts. This is
 *         Google's actual definition, not the naive sum, which over-reports.
 *   INP — worst latency across `event` entries carrying an interactionId. THIS
 *         REQUIRES A REAL INTERACTION. The probe sends trusted Playwright input
 *         (keyboard + a mouse click on a verified-safe point). If no qualifying
 *         interaction is recorded, INP is reported as null — never 0. A 0 here would
 *         be the best-looking number on the report and would mean nothing.
 *
 * Every observer records whether `observe()` was even accepted. A metric whose
 * observer is unsupported reads null, not zero: "no shifts happened" and "we could
 * not watch for shifts" are different claims and the report must not merge them.
 */

/** Serialised into the browser via context.addInitScript. Must be self-contained. */
export const INSTRUMENT_SOURCE = `(() => {
  // tsx compiles with esbuild's keepNames, which rewrites every named function this
  // file hands to page.evaluate() into __name(fn, 'fn') — a helper that exists in the
  // Node bundle and not in the page. Without this shim every evaluate() throws
  // "ReferenceError: __name is not defined" and the whole probe reads healthy:false.
  if (typeof globalThis.__name !== 'function') {
    globalThis.__name = function (fn) { return fn; };
  }
  if (window.__tcaProbe) return;
  var state = {
    rejections: [],
    lcp: null,
    lcpSupported: false,
    cls: 0,
    clsSupported: false,
    interactions: [],
    inpSupported: false,
    notes: []
  };
  window.__tcaProbe = state;

  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    var text;
    try {
      text = r && r.stack ? String(r.stack) : (r && r.message ? String(r.message) : String(r));
    } catch (err) {
      text = '(unserialisable rejection reason)';
    }
    state.rejections.push(text.slice(0, 2000));
  });

  window.addEventListener('error', function (e) {
    if (e && e.error && e.error.stack) state.notes.push('window.error: ' + String(e.error.stack).slice(0, 500));
  });

  try {
    new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var t = e.renderTime || e.loadTime || e.startTime;
        if (typeof t === 'number') state.lcp = t;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    state.lcpSupported = true;
  } catch (err) {
    state.notes.push('LCP observer unsupported: ' + String(err));
  }

  try {
    var sessionValue = 0;
    var sessionEntries = [];
    var maxSession = 0;
    new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.hadRecentInput) continue;
        var first = sessionEntries[0];
        var last = sessionEntries[sessionEntries.length - 1];
        if (sessionEntries.length > 0 && e.startTime - last.startTime < 1000 && e.startTime - first.startTime < 5000) {
          sessionValue += e.value;
          sessionEntries.push(e);
        } else {
          sessionValue = e.value;
          sessionEntries = [e];
        }
        if (sessionValue > maxSession) maxSession = sessionValue;
      }
      state.cls = maxSession;
    }).observe({ type: 'layout-shift', buffered: true });
    state.clsSupported = true;
  } catch (err) {
    state.notes.push('CLS observer unsupported: ' + String(err));
  }

  try {
    var latencies = {};
    new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e.interactionId) continue;
        var prev = latencies[e.interactionId] || 0;
        if (e.duration > prev) latencies[e.interactionId] = e.duration;
      }
      var out = [];
      for (var k in latencies) out.push(latencies[k]);
      state.interactions = out;
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    state.inpSupported = true;
  } catch (err) {
    state.notes.push('INP (event timing) observer unsupported: ' + String(err));
  }
})();`;

/** Shape returned by readVitals() below. Mirrors the in-page state. */
export interface RawVitals {
  rejections: string[];
  lcp: number | null;
  lcpSupported: boolean;
  cls: number;
  clsSupported: boolean;
  interactions: number[];
  inpSupported: boolean;
  notes: string[];
}

/** Turn the in-page state into the §7.5 vitals contract, honouring the null rule. */
export function toVitals(raw: RawVitals): { lcp: number | null; cls: number | null; inp: number | null } {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    lcp: raw.lcpSupported && raw.lcp !== null ? Math.round(raw.lcp) : null,
    // Supported observer with zero shifts is a real CLS of 0. Unsupported is null.
    cls: raw.clsSupported ? round(raw.cls) : null,
    // No qualifying interaction was recorded → we did not measure INP. Not 0.
    inp: raw.inpSupported && raw.interactions.length > 0 ? Math.round(Math.max(...raw.interactions)) : null,
  };
}
