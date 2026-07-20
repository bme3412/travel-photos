# Copy This Trip

Choose a place that has really been lived. Keep what you love. Make it yours.

Copy This Trip turns photographed journeys into personalized,
Claude-generated itineraries. The unit is the destination — Paris is a
growing collection of real moments, deepened by every visit — and each
destination page offers two doors: replay the trip, or copy it. Every
preserved stop points back to a real experience, photograph, or dispatch;
additions are explicitly marked as new. The dated visits (replays,
dispatches, photographs) are the proof layer, while curated neighborhood
options let a copied route branch without drifting into generic
travel-guide content.

## Product flow

1. Choose a destination from the front page.
2. From `/destinations/<city>`, replay the real trip or start a copy.
3. Keep, remove, or prioritize its grounded experiences.
4. Set dates, party, pace, budget, and personal notes.
5. Generate a day-by-day version with visible provenance.

Supporting routes provide trip replays, dispatches, photo galleries, a world
map, and Photo of the Day.

## Tech stack

- **Framework**: Next.js 15 App Router (React 18, Server Components + ISR)
- **Styling**: Tailwind CSS + custom global styles
- **Generation**: Anthropic API with deterministic rules, provenance cross-checks, and one repair pass
- **State & Data**: Zustand on the client; validated, hand-curated JSON in `src/data/`
- **Maps & Visualization**: Mapbox GL JS 3.x with a CSP worker (`src/workers/mapbox-gl-csp-worker.js`)
- **Media & Infra**: AWS S3, CloudFront CDN, `sharp` for image manipulation, Vercel deployment helpers

## Key directories

- `src/app/` – routes, API handlers, and shared UI
- `src/features/copy-trip/` – blueprint access, generation, validation, session state, and copy-flow URLs
- `src/features/destinations/` – the destination layer, derived from `<city>-<year>` trip ids
- `src/features/neighborhoods/` – registry joins and copy-guide data
- `src/data/` – albums, photos, narratives, blueprints, and neighborhoods
- `scripts/` – ingestion, generation, and validation utilities

## Core pages

- `/` – destination picker and product explanation
- `/destinations/[city]` – the destination hub: every visit, with Replay and Copy as the two front-door actions
- `/destinations/[city]/copy/**` – overview, selection, personalization, and result
- `/trips` / `/trips/[id]` – per-visit replays, the dated evidence layer
- `/journal/[id]` and `/albums/[id]` – source dispatch and photographs
- `/map` and `/photo-of-the-day` – secondary archive discovery

Old `/cities/*` and `/trips/<id>/copy/*` URLs redirect permanently to their
`/destinations/*` equivalents (`next.config.js`).

---
