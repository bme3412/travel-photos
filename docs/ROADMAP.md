# Roadmap

Living document — update it when direction changes, don't fork it.
Last updated: **2026-07-20** (destination-first inversion set as direction).
Point-in-time context: `docs/ASSESSMENT-2026-07-13.md`.

## North star

**Copy This Trip** is a product built from places that have really been
lived. The unit is the destination: Paris is a growing collection of real
moments, deepened by every visit — not a date-bounded itinerary. Visitors
choose a place, keep the moments they love, and generate a personalized trip
in which every stop is traceable to a real moment or clearly marked as new.

Dates are metadata, not the frame. On the source side they are provenance
(each moment cites its photos and the day it happened); on the visitor's
side they are an output (the generated trip gets *their* dates and length).
The dated visits — replays, dispatches, photographs — are the trust and
evidence layer: a day film proves the place was lived and that its pace is
real. The neighborhood registry quietly gives each copy room to branch. The
content compounds every June instead of resetting — next year's visit
deepens the same Paris, it does not create a second one.

(Direction set 2026-07-20: destination is the frame, visits are the
evidence. Presentation-first — trip ids stay `<city>-<year>` as visit ids;
no data migration until multi-visit pooling is actually needed.)

## Decision filters

Apply these before adding anything:

1. **Grounded beats generated.** Nothing ships that can't cite a photo, an
   experience id, or the owner's own words. If a feature needs invented
   content, it's out of scope.
2. **The real visits prove the product.** Replays and dispatches make the
   dated source days tangible — evidence, not the frame — then lead
   naturally back to copying the place.
3. **The registry serves the copy flow.** Neighborhood depth exists to give
   visitors branches, not to become a destination site. (Owner-set, 2026-07-13.)
4. **Content over surface.** The machinery is ahead of the content — until
   the owner-voice pass and guide breadth catch up, prefer fixing and
   deepening over new features.
5. **Design for uneven coverage forever.** One person, ~2 trips a year.
   Every view must degrade gracefully when data is thin.

## Now — small, verified, high-trust

Quality fixes for the generation pipeline. All four are reproduced and
documented in the assessment; each is a contained change to
`generation.mjs` / `rules.mjs`:

- [x] **No silent drops**: cross-check that every kept-but-absent experience
      is named in a comparison entry or warning; extend the repair pass.
      (2026-07-19: `crossCheckPlan` flags unacknowledged drops; the
      overpacked rule now demands cuts be named.)
- [ ] **Notes-conflict warnings**: prompt rule — if a scheduling choice
      contradicts the traveler's own notes, say so in `warnings`.
- [ ] **Ban day-of-week claims** in warnings (the model gets them wrong), or
      compute them server-side and inject as facts.
- [x] **Consistency check**: `provenanceLabel` must agree with `status`.
      (2026-07-19: leading-keyword claims are checked; free-form labels pass.)
- [ ] Unit tests for `rules.mjs` + `crossCheckPlan` (pure functions; this is
      the cheapest regression insurance in the repo). (2026-07-19:
      `npm test` runs `crossCheckPlan` tests via a plain-node alias loader in
      `scripts/test/`; `rules.mjs` coverage still to write.)

## Next — content depth (mostly owner work; Claude drafts, owner edits)

- [ ] **copyOptions for Menton + Kraków Old Towns** — their select steps
      already render the guide; it's empty of options.
- [ ] **Paris breadth**: Île de la Cité and Champs-Élysées entries (refs
      exist in the candidate report); then Berlin's first entry (Mitte ×6).
- [ ] **Owner-voice pass**: replace seed essays/copyOptions/narratives one
      trip at a time. Track which files are still seed copy in this list.
- [ ] **Destination-language sweep**: remaining trip-framed copy (hero
      headline "Choose a trip that really happened", copy-overview facts
      ordering, select subhead) — decide the brand line deliberately, then
      sweep. Cards and personalize de-anchored 2026-07-20.
- [ ] **Share/export a copied trip**: a share link or print view. This is
      the feature's payoff — "here's my version of your trip" — and the
      current localStorage-only design blocks it.

## Later — parked until the above lands

- Coverage map view (arrondissement/district rollup as a visual index of
  where the site is deep vs. thin).
- Copy-enable a pre-2026 trip (tests whether blueprint authoring is
  repeatable from older, sparser photo data).
- **Multi-visit pooling** (activates when Paris 2027 lands): the copy
  source for a destination becomes the union of its `<city>-*` blueprint
  experiences; one Paris page, more depth per June. Registry needs no
  changes — it is already city-scoped.
- Shared rate-limit/cache store for the generate API (only if traffic
  warrants; per-instance is fine today).
- `npm audit` cleanup (2 critical are in legacy script deps — verify
  exposure, then upgrade or isolate).
- Registry `ideas`/links between neighborhoods ("pairs well with…").

## Non-goals

- A public neighborhoods section in the nav (explicitly reversed 2026-07-13).
- Generic destination-guide content not grounded in the owner's trips.
- Multi-user accounts / server-side persistence of visitor trips (share
  links should work without login).

## Playbook: annual trip ingestion (e.g. Paris 2027)

The compounding loop. Each step has tooling already:

1. `npm run add-photos` → EXIF gps/takenAt land in `photos.json`.
2. `npm run generate-narratives` → seed narrative; edit in `/studio` (dev).
3. Author the `report` (scene replay) in `narratives.json`.
4. Hand-curate the blueprint; `npm run validate-blueprints`.
5. Add registry `experienceRefs` for the new trip;
   `npm run validate-neighborhoods` (the drift check lists what's unclaimed).
6. Photos flow into neighborhood pages automatically (GPS radius) — no
   registry edits needed for existing quarters.
7. Deploy: push to `main` (auto) or `npm run deploy` (working tree).
