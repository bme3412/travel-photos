# Roadmap

Living document — update it when direction changes, don't fork it.
Last updated: **2026-07-13** (after the neighborhood guide → copy flow integration).
Point-in-time context: `docs/ASSESSMENT-2026-07-13.md`.

## North star

A personal travel blog where **replays are the flagship**, **"Copy this
trip" is the differentiator**, and the **neighborhood registry quietly feeds
both** — with content that compounds every June instead of resetting.

## Decision filters

Apply these before adding anything:

1. **Grounded beats generated.** Nothing ships that can't cite a photo, an
   experience id, or the owner's own words. If a feature needs invented
   content, it's out of scope.
2. **The registry serves the copy flow.** Neighborhood depth exists to give
   visitors branches, not to become a destination site. (Owner-set, 2026-07-13.)
3. **Content over surface.** The machinery is ahead of the content — until
   the owner-voice pass and guide breadth catch up, prefer fixing and
   deepening over new features.
4. **Design for uneven coverage forever.** One person, ~2 trips a year.
   Every view must degrade gracefully when data is thin.

## Now — small, verified, high-trust

Quality fixes for the generation pipeline. All four are reproduced and
documented in the assessment; each is a contained change to
`generation.mjs` / `rules.mjs`:

- [ ] **No silent drops**: cross-check that every kept-but-absent experience
      is named in a comparison entry or warning; extend the repair pass.
- [ ] **Notes-conflict warnings**: prompt rule — if a scheduling choice
      contradicts the traveler's own notes, say so in `warnings`.
- [ ] **Ban day-of-week claims** in warnings (the model gets them wrong), or
      compute them server-side and inject as facts.
- [ ] **Consistency check**: `provenanceLabel` must agree with `status`.
- [ ] Unit tests for `rules.mjs` + `crossCheckPlan` (pure functions; this is
      the cheapest regression insurance in the repo).

## Next — content depth (mostly owner work; Claude drafts, owner edits)

- [ ] **copyOptions for Menton + Kraków Old Towns** — their select steps
      already render the guide; it's empty of options.
- [ ] **Paris breadth**: Île de la Cité and Champs-Élysées entries (refs
      exist in the candidate report); then Berlin's first entry (Mitte ×6).
- [ ] **Owner-voice pass**: replace seed essays/copyOptions/narratives one
      trip at a time. Track which files are still seed copy in this list.
- [ ] **Share/export a copied trip**: a share link or print view. This is
      the feature's payoff — "here's my version of your trip" — and the
      current localStorage-only design blocks it.

## Later — parked until the above lands

- Coverage map view (arrondissement/district rollup as a visual index of
  where the site is deep vs. thin).
- Copy-enable a pre-2026 trip (tests whether blueprint authoring is
  repeatable from older, sparser photo data).
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
