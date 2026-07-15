# Project assessment — July 13, 2026

A point-in-time snapshot, written after the neighborhood guide was folded into
the copy-trip flow. Pair with `docs/ROADMAP.md` (living) — this file is not
updated, it is superseded by later assessments.

## What this site is

**Copy This Trip** — a personal travel journal (bme-travel-photos.vercel.app)
in the middle of a pivot from photo-album site to travel blog. Three ideas
carry it:

1. **Trip replays** are the flagship: scroll-driven scene retellings of real
   trips, grounded in photo EXIF (GPS trails, capture times, inferred pauses).
2. **Copy this trip** is the interactive differentiator: a visitor selects
   from a real trip, personalizes it, and Claude builds their version — every
   item traceable to the source or explicitly new.
3. **The neighborhood registry** feeds #2 with depth: owner-curated
   write-ups and extra options per quarter, so a copied trip can branch
   beyond the original route. Explicit owner direction: this is *not* a
   standalone browsing section (no nav link; pages reachable quietly).

Content compounds: the owner returns to Paris every June (since a 2009 study
abroad), and the registry is designed so next year's photos deepen existing
pages with zero edits.

## Inventory

| Layer | State |
|---|---|
| Albums / trips | 52, spanning 1987–2026 |
| Photos | 1,677 (EXIF `gps` + `takenAt` drive replays and registry joins) |
| Narratives | 50 entries; 4 with `report` (full scene replay): the 2026 four |
| Blueprints (copy-enabled) | 4: paris, menton, berlin, krakow — all 2026 |
| Neighborhoods | 6 entries; copyOptions only in the 4 Paris quarters (14 options) |
| Validators | `validate-blueprints`, `validate-neighborhoods` (referential + geo + drift) |
| Generation | Sonnet 4.6 behind `/api/copy-trip/generate`; rate-limited, cached, cross-checked with one repair pass; verified in prod twice (~85s/build) |
| Deploys | Vercel git integration on `main` + working CLI (`npm run deploy`, v56) |

## What's strong

- **The grounding discipline.** Every layer references upward into real data
  (photo ids → experiences → narrative days), enforced by validators. This is
  the site's genuine moat: generated itineraries cite real experiences, and
  the cross-check + repair pass rejects fabricated provenance.
- **The additions contract.** Guide picks flow through with `item id ==
  option id, status "new"` enforced server-side — verified end-to-end in
  production, all three test additions placed in sensible day slots.
- **Replication proven.** The registry schema survived its second and third
  cities (Menton, Kraków) unchanged; per-city name uniqueness was the only
  design fix needed.
- **Operational calm.** Two deploy paths, validators in npm scripts, seed
  data clearly separated from code.

## Verified issues (open)

From the July 13 production review of a generated Paris itinerary — real,
reproducible, none fixed yet:

1. **Silent drops.** 3 of 21 selected experiences vanished without mention
   (Île Saint-Louis wander, Champs-Élysées walk, last Saint-Germain walk).
   The overpacked rule says "explain what was cut"; `crossCheckPlan` doesn't
   enforce it.
2. **Traveler-notes conflicts pass silently.** The request said "keep the
   Fête evening intact"; the plan moved the Fête block to 13:30 with no
   warning acknowledging the trade.
3. **Confident date-math errors in warnings.** "June 19, 2027 falls on a
   Friday" — it's a Saturday. Small, trust-eroding.
4. **Provenance label / status mismatches.** An item with `status:
   "modified"` carried a label starting "Preserved from…". Not checked.
5. Day item counts exceed the prompt's "hard target" (7 vs 6) — arguably fine
   since transport/rest pad the count, but the prompt overpromises.

## Structural gaps

- **Coverage is thin relative to the surface.** 4 of 52 trips are
  copy-enabled; 2 of 6 neighborhoods have zero copyOptions (Menton, Kraków),
  so their select steps show the guide without its point. Berlin has no
  registry entries at all.
- **Seed copy everywhere.** Essays, narratives, and copyOptions are
  Claude-drafted placeholders awaiting the owner's voice — the pivot's whole
  premise. Nothing marks which files have been humanized.
- **Copied trips are trapped in the browser.** localStorage only — no share
  link, no export. The feature's social payoff ("here's *my* version of your
  trip") doesn't exist yet.
- **No tests.** `rules.mjs`, `crossCheckPlan`, and `planEdits.mjs` are pure
  functions begging for unit tests; today only the two data validators guard
  regressions.
- **Hygiene.** `npm audit`: 64 vulnerabilities (2 critical) — mostly legacy
  script deps, unaudited. Rate limits/cache are per-instance in-memory
  (acceptable at current traffic, noted in code).

## The honest one-line read

The machinery is ahead of the content: a sophisticated, verified pipeline
serving four trips and six neighborhoods of seed copy. The highest-value work
now is quality fixes (cheap, verified) and content depth — not new surface.
