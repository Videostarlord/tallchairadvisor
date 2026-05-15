# Microsoft Clarity Diagnosis — 2026-05-14

Checked on May 14, 2026 (America/Los_Angeles).

## Scope

Diagnose why Microsoft Clarity project `wqec7ap5fe` is not appearing in the Clarity dashboard yet.

Reviewed:

- Local repo state
- GitHub `main`
- Live production responses from `https://tallchairadvisor.com/`
- Live production responses from representative content pages
- Live Clarity bootstrap script at `https://www.clarity.ms/tag/wqec7ap5fe`

## Verdict

The problem is not the Clarity project ID or the inline snippet itself.

There are two deployment/infrastructure issues:

1. The live homepage `/` is serving a stale `Content-Security-Policy` that does not allow Clarity at all, even though the HTML contains the Clarity snippet.
2. The repo and GitHub `main` CSP allowlist are still incomplete for Clarity because they allow `https://www.clarity.ms`, but the Clarity bootstrap script immediately loads `https://scripts.clarity.ms/0.8.64/clarity.js`.

Result: the loader is blocked on the homepage, and the second-stage script is likely blocked on other pages too.

## Evidence

### 1. Snippet is present in the repo and on GitHub `main`

- `src/layouts/Layout.astro` contains the exact snippet with project ID `wqec7ap5fe`
- GitHub `main` raw file also contains the same snippet
- GitHub `main` latest commit checked: `19126f40c9c3` — `fix(csp): allow Microsoft Clarity script and connect domains` — `2026-05-14T02:04:07Z`

This rules out:

- wrong project ID in code
- snippet missing from GitHub `main`
- snippet missing from generated HTML

### 2. Live homepage HTML includes the snippet, but live homepage CSP blocks it

Observed on `https://tallchairadvisor.com/`:

- HTML contains `wqec7ap5fe`
- Response header `Content-Security-Policy` does **not** include `https://www.clarity.ms`
- Response header `connect-src` does **not** include Clarity-related hosts either

Practical effect:

- the inline script runs
- the browser tries to inject `https://www.clarity.ms/tag/wqec7ap5fe`
- homepage CSP blocks that external script request

This is enough by itself to prevent Clarity from loading on `/`.

### 3. The live site is inconsistent by URL, which points to deployment/cache mismatch

Observed on representative pages:

- `/` → stale CSP, no Clarity hosts allowed
- `/review/gesture/` → CSP includes `https://www.clarity.ms`
- `/review/leap-plus/` → CSP includes `https://www.clarity.ms`
- `/best-office-chairs/` → CSP includes `https://www.clarity.ms`
- `/office-chairs-for-6-foot-4/` → CSP includes `https://www.clarity.ms`

This means the live site is not serving one consistent header set across routes.

Most likely explanation:

- Cloudflare edge cache is still serving an older homepage header variant
- or the live deployment/header rule state is partially stale at the edge

### 4. Even the newer CSP in GitHub `main` is not sufficient for Clarity

`public/_headers` on GitHub `main` currently allows:

- `script-src ... https://www.clarity.ms`
- `connect-src ... https://www.clarity.ms https://dc.services.visualstudio.com`

But the fetched Clarity bootstrap script at `https://www.clarity.ms/tag/wqec7ap5fe` contains:

- `t.src="https://scripts.clarity.ms/0.8.64/clarity.js"`
- `(new Image).src="https://c.clarity.ms/c.gif"`

Implication:

- allowing `www.clarity.ms` is not enough
- the second-stage script host is `scripts.clarity.ms`
- `img-src 'self' data: https:` already covers `c.clarity.ms`
- but `script-src` does not currently cover `scripts.clarity.ms`

So even the pages serving the newer CSP are likely still not initializing Clarity fully.

## Root Cause

The Clarity install is blocked by CSP, not by the project ID.

There are two layers of failure:

1. **Live homepage edge/header inconsistency**: `/` is still serving an older CSP that blocks the Clarity loader outright.
2. **CSP host mismatch in tracked config**: the tracked `_headers` rule whitelists the wrong Clarity script host (`www.clarity.ms` instead of the actual second-stage script host `scripts.clarity.ms`).

## Recommended Fix Direction

No code changes were made in this diagnosis session.

When fixing later, verify all of the following on the live site after deploy:

- homepage `/` serves the same CSP as content pages
- `script-src` allows the actual Clarity script host used by the loader
- the browser Network tab shows both:
  - `https://www.clarity.ms/tag/wqec7ap5fe`
  - `https://scripts.clarity.ms/.../clarity.js`
- Clarity requests are no longer blocked by CSP in DevTools Console

## Final Assessment

The install code itself is basically fine.

The issue is that the live site is serving CSP headers that are either stale, incomplete, or both. That is the most likely reason Clarity still has not populated after several days.
