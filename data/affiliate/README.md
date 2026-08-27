# data/affiliate/ — FROZEN 2026-08-09. Do not delete. Do not "refresh".

These two files were written by `scripts/amazon-pull.ts`, the Playwright session-replay
automation that was **retired on 2026-08-26** (see `wiki/synthesis/decisions-log.md`).
Nothing writes here any more, and nothing should.

| File | Contents |
|---|---|
| `latest.json` | 25 **per-day** rows covering 2026-07-11 → 2026-08-09, plus window totals |
| `history.jsonl` | one appended line per successful pull (2 lines) |

## Why they are kept rather than deleted

**`latest.json` is the decoder for every hand-dropped Associates CSV.**

Associates Central does not record the selected date range in its CSV exports, so a hand
export arrives with an unknown window — and a rolling 30-day export is indistinguishable
from a month-to-date one in the file. That ambiguity already caused the 2026-08-03 export
to be misread as a second positive month when it was 99.7% July's money re-reported.

The per-day rows here resolve it. On 2026-08-26 the window of a hand export was **solved,
not guessed**: summing these daily rows from 2026-07-27 onward gave 4 shipped items /
$2,293.77 / $68.98, identical to the cent on three independent quantities to that export's
`tallchairadvi-20` row. Window: rolling 30-day, 2026-07-27 → 2026-08-25.

That method keeps working for any hand export whose window overlaps 2026-07-11 → 2026-08-09.

## What must never happen to these files

**Never overwrite `latest.json` from a hand-dropped CSV.** A CSV drop is one undated rolling
aggregate; this is 25 dated daily rows. Syncing one onto the other does not update the
decoder — it deletes it. This is the third and strongest of the standing reasons never to do
that, recorded in `wiki/pages/concepts/affiliate-performance.md`.

**`collectors/amazon.ts` deliberately EXCLUDES this directory from its staleness scan.**
`latest.json` matches the collector's name pattern but carries no date in its filename, so it
would be dated by mtime — and a CI checkout stamps every file it writes with "now". The nag
would read *0 days old* forever, on a file frozen since August. Do not remove that exclusion.

## Where live affiliate data comes from now

Hand exports only: `raw/affiliate/YYYY-MM-DD-amazon-csv/`, dropped by Jackson, with the
selected date range recorded in the accompanying report. `collectors/amazon.ts` nags at 7 days.
