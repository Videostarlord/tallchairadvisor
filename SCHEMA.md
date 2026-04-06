# TCA Wiki Schema

Operating rules for how the LLM maintains the wiki. This is the "schema" layer — it tells every agent (human or automated) how to interact with the wiki.

---

## Directory Structure

All paths below are relative to the repo root (`tall-chair-advisor/`).
The wiki and raw dirs are committed to git alongside `src/` and `scripts/`.
Astro only builds from `src/` — wiki/ and raw/ don't interfere with the site build.

```
raw/                          ← Layer 1: Immutable source documents
├── gsc/                      # GSC CSV/JSON exports by date
├── audits/                   # Audit reports and analysis snapshots
├── strategy/                 # Strategy docs, action plans, calendars
├── competitors/              # Competitor data snapshots
├── reddit/                   # Reddit/Apify pipeline docs
├── misc/                     # Session context, PDFs, etc.
└── assets/                   # Images, XML, CSV files

wiki/                         ← Layer 2: LLM-maintained wiki
├── index.md                  # Master catalog — read this first
├── log.md                    # Chronological operation log
├── pages/
│   ├── chairs/               # Chair entity pages (one per chair)
│   ├── site-pages/           # Site page entity pages (one per important URL)
│   └── concepts/             # Concept/topic pages
├── weekly/                   # Weekly summary pages (future: from Saturday agent)
└── synthesis/                # Cross-cutting analysis
    ├── what-works.md         # Confirmed wins
    ├── what-failed.md        # Fixes that didn't work
    ├── thesis.md             # Current strategic thesis
    └── decisions-log.md      # Week-by-week decision record

SCHEMA.md                     ← Layer 3: This file (operating rules)
CLAUDE.md                     ← Claude Code project instructions (unchanged)
AUTOMATION-SYSTEM.md          ← Automation pipeline reference (unchanged)
tall-chair-advisor/           ← The actual Astro codebase (unchanged)
```

---

## Page Types

### Entity Pages (chairs/, site-pages/)
One page per real-world entity (a chair model, a site URL). Contains:
- Current state (specs, metrics, scores)
- Open issues
- Fix history (date + what changed + result)
- Links to related wiki pages

### Concept Pages (concepts/)
One page per topic that spans multiple entities. Contains:
- Current status
- Accumulated learnings and patterns
- Open questions
- Links to related entities and other concepts

### Synthesis Pages (synthesis/)
Cross-cutting analysis derived from multiple entities and concepts:
- **what-works.md** — Fixes/approaches with confirmed positive outcomes
- **what-failed.md** — Fixes that didn't produce expected results
- **thesis.md** — Current strategic thesis and priorities
- **decisions-log.md** — Week-by-week record of actions, decisions, and surprises

### Weekly Pages (weekly/)
One page per week, filed by the Saturday verification agent:
- What was fixed, written, or changed
- GSC metrics snapshot
- Surprises or unexpected outcomes
- Deferred items

---

## Frontmatter Convention

Every wiki page has YAML frontmatter:

```yaml
---
type: entity | concept | synthesis | index | log
entity: chair | site-page        # only for entity pages
last_updated: 2026-04-06
sources: [raw/path/to/file.md]   # which raw sources inform this page
tags: [relevant, tags]
---
```

---

## Linking Convention

Use Obsidian `[[wikilinks]]` for all internal wiki links. Link to the filename without path:
- `[[steelcase-gesture]]` not `[[wiki/pages/chairs/steelcase-gesture]]`
- `[[ctr-optimization]]` not `[[wiki/pages/concepts/ctr-optimization]]`

---

## Operations

### Ingest (when new raw data arrives)

1. Drop the new source into the appropriate `raw/` subdirectory
2. Read `wiki/index.md` to find which wiki pages are affected
3. Read each affected page
4. Update each page: add new data, update metrics, flag contradictions, update `last_updated`
5. If a new entity or concept emerges, create a new page and add it to `index.md`
6. Append an entry to `wiki/log.md`
7. If the ingest changes the strategic picture, update `wiki/synthesis/thesis.md`

**Example:** Monday's GSC pull arrives. Update `wiki/pages/concepts/gsc-performance.md` with new numbers. Check if any page's position changed significantly → update that page's entity. If a new page got indexed, note it. Append to log.

### Query (answering a question)

1. Read `wiki/index.md` to identify relevant pages (usually 3–8)
2. Read those pages
3. Synthesize an answer using wiki content
4. If the answer is valuable and reusable, file it back into the wiki as a new page or update an existing one

### Lint (periodic health check)

Run monthly or when things feel stale. Check for:
- **Contradictions** — page says X, newer data says Y
- **Stale pages** — `last_updated` more than 4 weeks old despite new raw data
- **Orphan pages** — no inbound `[[wikilinks]]` from other pages
- **Missing pages** — entities mentioned in text but lacking their own page
- **Missing cross-references** — pages that should link to each other but don't
- **Data gaps** — important questions with no wiki page or analysis

### Weekly Agent Integration

For the automation pipeline (see AUTOMATION-SYSTEM.md):

| Day | Agent | Wiki Operation |
|-----|-------|---------------|
| Monday | Data pull + competitor scan | **Ingest:** Update gsc-performance.md, competitor-landscape.md, chair entities with new data |
| Tuesday | Full site audit | **Ingest:** Update site-page entities with current metrics/issues, content-quality-scores.md |
| Wednesday | Strategy + planning | **Query:** Read index → relevant pages → use compiled history as context for strategy |
| Thursday | Execute fixes | **Update:** Mark fixes as done in entity pages, update fix history tables |
| Friday | New content | **Create:** New site-page entity if a new page was written |
| Saturday | Verify + deploy | **File:** Write weekly summary page, update decisions-log.md, what-works.md/what-failed.md |

---

## Rules

1. **Never modify `raw/` files.** They are immutable source documents.
2. **Never delete wiki content.** Mark outdated information as superseded with date. History is valuable.
3. **Always update `last_updated`** when modifying a wiki page.
4. **Always update `index.md`** when creating a new page.
5. **Always append to `log.md`** after any ingest or significant update.
6. **Contradictions are features, not bugs.** When new data contradicts old, note both and flag which is newer. Don't silently overwrite.
7. **The wiki supplements, not replaces, CLAUDE.md.** Site rules (voice constraints, affiliate tags, meta lengths) live in CLAUDE.md. The wiki tracks state, history, and analysis.

---

## Voice and Style

- Write for a future LLM that needs to quickly understand the current state
- Lead with the most important fact, not background
- Use tables for structured data
- Use `**bold**` for critical warnings and key numbers
- Keep pages scannable — an agent should get the gist from headings and tables alone
