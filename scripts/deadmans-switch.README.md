# Dead-man's switch — second-repo setup

**This is the one component that must NOT run in this repository.**

PRD §7.7:

> Checked by an external cron or a scheduled GitHub Action **in a second repository** — a watcher
> inside the repo it watches cannot report its own death. Without this, the build has only moved
> silent failure up one level.

A watcher inside `tallchairadvisor` dies with the thing it watches. If Actions gets disabled, if
billing lapses, if a workflow edit breaks the cron, if the repo is renamed — the watcher stops too,
and the alarm that was supposed to fire never fires. The green checkmarks simply stop appearing, and
nobody notices that they stopped.

## Setup (~5 minutes, one time)

1. Create a second repo, e.g. `Videostarlord/tca-watchdog`. It can be private and otherwise empty.

2. Copy **only** `scripts/deadmans-switch.ts` into it. The script is deliberately dependency-free
   (no imports from this codebase, raw `fetch`, hand-validated JSON) so it runs standalone.

   > **This copy is manual, and that is the one maintenance cost of the second-repo design.**
   > Editing the file here changes nothing until it is copied across. The 2026-08-13 → 2026-08-30
   > false-alarm window persisted partly for this reason: the schedule changed in this repo and the
   > watcher's assumption about it lived in another one. After any edit to `deadmans-switch.ts`,
   > re-copy it to the watchdog repo and run the workflow once via `workflow_dispatch`.

3. Add `.github/workflows/watchdog.yml`:

```yaml
name: TCA Watchdog

on:
  schedule:
    # 15:10 UTC = 08:10 America/Los_Angeles during PDT — just past the PRD's
    # 08:00 deadline. During PST this lands at 07:10 local; the switch checks
    # the local hour itself and simply waits, so a PST run is a no-op until
    # the next firing. Add a second cron entry if you want an exact PST match.
    - cron: '10 15 * * *'
  workflow_dispatch:

jobs:
  watch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm i -D tsx dotenv
      - run: npx tsx deadmans-switch.ts
        env:
          NTFY_TOPIC: ${{ secrets.NTFY_TOPIC }}
          # Only needed if tallchairadvisor is private.
          GH_TOKEN: ${{ secrets.TCA_READ_TOKEN }}
```

4. Add the `NTFY_TOPIC` secret to the watchdog repo — **the same topic the nightly pushes to**.
   Without it the switch detects death but cannot tell anyone, which defeats it entirely. The script
   says so loudly on stderr if the topic is missing.

5. If `tallchairadvisor` is private, add `TCA_READ_TOKEN` — a fine-grained PAT with
   *Contents: read* on that repo only.

## What it checks

Two independent signals, so no single failure can fake life:

| signal | source | dead when |
|---|---|---|
| `heartbeat` | `data/nightly-heartbeat.json` | absent, malformed, or older than 29h |
| `report` | `wiki/nightly/<today>.md` **or** `wiki/nightly/<yesterday>.md` | neither was written |

Both must be alive. A heartbeat without a report — or the reverse — is a partial failure, which is
still worth waking up for.

### Why the report window is two days wide

The nightly names its report file with the local date **at the moment it runs**. It used to run at
03:00 local, so day D's report was found by the 08:00 check on day D. On 2026-08-13 the schedule
moved to 17:00 local (`cron: '0 0 * * *'` is 00:00 UTC, which is 17:00 PDT the *previous* day), so
the run now lands in the evening of day D and writes `D.md` — while this check, at 08:00 on D+1, was
still looking for `(D+1).md`. That file cannot exist yet and never will.

The result: **the switch fired "TCA DEAD" every single morning from 2026-08-13 onward**, printing a
perfectly healthy heartbeat directly underneath the alarm. Fixed 2026-08-30.

Accepting yesterday's file does not widen the detection window, because both candidate dates come
from the watchdog's own clock rather than from the watched repo:

- nightly ran on D → at 08:00 on D+1, `D.md` is present → **alive**
- nightly missed D → newest file is `(D-1).md`, neither candidate matches → **dead**

That is still exactly one missed cycle — the same window `MAX_HEARTBEAT_AGE_HOURS=29` enforces on
the other signal.

## Environment

| var | default | meaning |
|---|---|---|
| `NTFY_TOPIC` | — | **required.** ntfy.sh topic (PRD §11 default transport) |
| `GH_TOKEN` / `GITHUB_TOKEN` | — | required only if the watched repo is private |
| `TCA_REPO_OWNER` | `Videostarlord` | watched repo owner |
| `TCA_REPO_NAME` | `tallchairadvisor` | watched repo |
| `TCA_REPO_BRANCH` | `main` | watched branch |
| `DEADLINE_HOUR` | `8` | local hour after which absence is an alarm |
| `TCA_TZ` | `America/Los_Angeles` | timezone for the deadline |
| `MAX_HEARTBEAT_AGE_HOURS` | `29` | heartbeat staleness limit |

## Testing it

From anywhere, with the topic set:

```bash
# Force a check regardless of the current hour.
NTFY_TOPIC=your-topic npx tsx deadmans-switch.ts --force
```

To verify the alarm actually fires (PRD §9, step-5 acceptance — *"suppress the nightly entirely →
the dead-man's switch fires by 08:00"*), point it at a date with no report:

```bash
NTFY_TOPIC=your-topic MAX_HEARTBEAT_AGE_HOURS=0 npx tsx deadmans-switch.ts --force
# expect: exit 1, "TCA DEAD" push, both signals reported with reasons
```
