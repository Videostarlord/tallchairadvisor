# Cloudflare Cache Investigation — 2026-05-14

Checked on May 14, 2026 (America/Los_Angeles).

## Scope

Investigate why `tallchairadvisor.com` is still serving stale HTML/CSP responses after the Clarity CSP fix was deployed and Cloudflare cache was manually cleared.

## Verdict

The deployment is correct.

The cache issue exists at the **custom-domain Cloudflare zone layer**, not in the Astro build and not in the Cloudflare Pages origin deployment.

## Key Findings

### 1. Pages origin is serving the correct headers

Verified on:

- `https://6085090b.tallchairadvisor.pages.dev/`
- `https://6085090b.tallchairadvisor.pages.dev/review/gesture/`
- `https://tallchairadvisor.pages.dev/`

All of those responses return:

- `Cache-Control: public, max-age=300, must-revalidate`
- updated Clarity CSP with `https://*.clarity.ms`
- no stale older CSP variants

This rules out:

- bad `_headers` file
- bad Astro build
- bad Pages deployment

### 2. Custom domain is overriding the Pages-origin cache behavior

Verified on:

- `https://tallchairadvisor.com/`
- `https://www.tallchairadvisor.com/`
- `https://tallchairadvisor.com/review/gesture/`
- `https://tallchairadvisor.com/best-office-chairs/`
- `https://tallchairadvisor.com/office-chairs-for-6-foot-4/`

Those responses return:

- `Cache-Control: public, max-age=3600, must-revalidate`
- `CF-Cache-Status: HIT`
- `Age` values well over 20 minutes

This does **not** match the Pages-origin response, which is 300 seconds, not 3600.

Conclusion:

- the custom domain layer is overriding or independently caching HTML beyond the Pages-origin header
- the zone is caching full HTML documents by URL

### 3. Fresh query-string variants fetch the new deployment immediately

Example:

- `https://tallchairadvisor.com/?cacheprobe=1` → `CF-Cache-Status: MISS`
- same response includes the new wildcard Clarity CSP

Then repeating the same query-string URL:

- first request → `MISS`
- second request → `HIT`
- second request age rises immediately

This proves:

- the new deployment is already live behind the custom domain
- Cloudflare is caching HTML per full URL key
- stale bare-path objects and fresh query-string objects can coexist

### 4. The stale issue is per-path object retention, not deploy propagation

At the same time:

- bare `/` still served an old CSP with **no** Clarity allowlist
- `/review/gesture/` still served the previous CSP with `https://www.clarity.ms` only
- query-string variants served the newest CSP with `https://*.clarity.ms`

That means old objects for existing paths remain cached while fresh URL keys pull the newest deployment.

## Most Likely Root Cause

There is an untracked Cloudflare custom-domain cache policy affecting HTML on `tallchairadvisor.com`.

Evidence strongly suggests one of:

1. a Cache Rule that makes HTML eligible for cache with a 1-hour TTL
2. a legacy Page Rule doing equivalent HTML caching
3. a Cloudflare zone-level override that rewrites cache behavior on the custom domain

I could confirm the existence of the custom-domain override from live headers, but the current OAuth token did not have permission to read Cloudflare zone rulesets or page rules directly, so the exact dashboard rule object could not be named from the CLI.

## Why the purge did not appear to fix it

From observed behavior, one of these is true:

1. the purge did not hit the exact custom-domain HTML cache objects that were already stored for the bare paths
2. the zone has a cache rule/policy that immediately re-caches HTML at the custom-domain layer
3. the purge was applied to a different cache layer than the one serving the old custom-domain HTML objects

Regardless, the important point is this:

- the stale objects are **not** coming from Pages origin
- the stale objects are **not** caused by the current git commit

## Recommended Dashboard Checks

In Cloudflare dashboard for zone `tallchairadvisor.com`, inspect:

1. **Rules → Cache Rules**
   - look for rules matching `tallchairadvisor.com/*` or `*tallchairadvisor.com/*`
   - especially anything like:
     - Cache Everything / Eligible for cache
     - Edge TTL = 1 hour
     - Browser Cache TTL = 1 hour
     - Respect / Ignore origin cache control

2. **Rules → Page Rules** (legacy)
   - check for any rule caching HTML on all URLs

3. **Caching settings**
   - verify whether HTML is being cached independently of Pages-origin headers

## Final Assessment

This is a Cloudflare custom-domain caching problem, not a deployment problem.

The current Pages deployment is correct, the custom domain is live on the new release, and stale HTML objects are persisting at the zone cache layer for previously requested paths.
