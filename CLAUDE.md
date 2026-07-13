# Passport & Ponder — travel journal

Personal travel blog (Next.js app router + Tailwind), deployed at
bme-travel-photos.vercel.app. Trip replays are the flagship; "Copy this
trip" (Claude-generated personalized itineraries) is the differentiator;
the neighborhood registry feeds the copy flow — it is deliberately NOT a
standalone nav section.

**Read `docs/ROADMAP.md` before proposing work** — it holds the north star,
decision filters, current priorities, and non-goals. Point-in-time state:
`docs/ASSESSMENT-*.md` (latest date wins).

## Commands

- `npm run dev` / `npm run build` / `npm start`
- `npm run validate-blueprints` — after editing `src/data/blueprints.json`
- `npm run validate-neighborhoods` — after editing `src/data/neighborhoods.json`
- Deploy: push to `main` (git auto-deploy) or `npm run deploy` (ships working tree)

## Data model (all hand-curated JSON in `src/data/`, validated)

- `photos.json` — EXIF truth: per-photo `gps` + `takenAt` (not `coordinates`,
  which is an album-level default)
- `narratives.json` — replay copy; entries with `report` get the scene replay
- `blueprints.json` — copy-trip source decomposition; experience ids are the
  provenance spine
- `neighborhoods.json` — registry: refs into blueprints + editorial
  (`essay`, `copyOptions`); photos/visit-years derived at build by GPS radius,
  never stored

## Conventions

- **Grounded beats generated**: everything cites a photo id, experience id,
  or the owner's words. Much current prose is Claude seed copy awaiting the
  owner's voice — preserve that expectation when editing.
- References over duplication: new layers point at existing ids.
- Trip ids are `<city>-<year>`; registry uniqueness is scoped per city.
- Generation contract: guide additions appear as items with
  `id == option id, status "new"` — enforced in `crossCheckPlan`.
- `src/features/*/schema.mjs` files are imported by plain-node scripts:
  use relative imports there, not `@/`.
