# Fixes Log — 2026-05-07

- [✅] Thursday workflow build failure recovered: knee-pain-seat-depth.astro had an em dash injected by Claude in a JS expression context — esbuild rejected it as an unexpected token. Changes were not committed by CI.
- [✅] FIX: /review/gesture/ redirect — already present in public/_redirects (line 38). No change needed.
- [✅] FIX: /aeron-vs-gesture/ redirect — already present in public/_redirects (line 44). No change needed.
- [✅] FIX: /review/aeron-size-c/ meta description rewritten to verdict-first format (removed "In-depth" filler; leads with "Aeron Size C fits most 6'0"-6'3" users: seat height reaches 20.5"...")
- [✅] FIX: /chairs/steelcase-gesture/ meta description rewritten from table-of-contents to verdict-first hook ("Gesture fits 6'0"-6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth...")
- [✅] FIX: /knee-pain-seat-depth/ title shortened from 72 chars to 48 chars ("Seat Depth & Knee Pain: The Fix for Tall People"); meta description updated to lead with fix/answer
- [✅] REWRITE: /best-office-chairs/ Height-Bracket Verdict Table — added Amazon affiliate links (tag=tallchairadvi-20) to all chair names in Top Pick and Runner-Up columns
- [✅] Hardened execute-fixes.ts: added sanitizeFrontmatter() to strip em dashes/en dashes/curly quotes from frontmatter JS block before writing; added system prompt rule to avoid Unicode in frontmatter
- [✅] Updated dateModified and sitemap pageLastmod for all 4 modified pages to 2026-05-07
