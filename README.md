# Copy This Trip

Choose a trip that really happened. Keep what you love. Make it yours.

Copy This Trip turns photographed journeys into personalized,
Claude-generated itineraries. Every preserved stop points back to a real
experience, photograph, or dispatch; additions are explicitly marked as new.
Replays are the proof layer, while curated neighborhood options let a copied
route branch without drifting into generic travel-guide content.

## Product flow

1. Choose a copy-enabled source trip.
2. Keep, remove, or prioritize its grounded experiences.
3. Set dates, party, pace, budget, and personal notes.
4. Generate a day-by-day version with visible provenance.

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
- `src/features/copy-trip/` – blueprint access, generation, validation, and session state
- `src/features/neighborhoods/` – registry joins and copy-guide data
- `src/data/` – albums, photos, narratives, blueprints, and neighborhoods
- `scripts/` – ingestion, generation, and validation utilities

## Core pages

- `/` – copy-enabled trip picker and product explanation
- `/trips/[id]/copy/**` – overview, selection, personalization, and result
- `/trips` / `/trips/[id]` – source-trip replay archive
- `/journal/[id]` and `/albums/[id]` – source dispatch and photographs
- `/map` and `/photo-of-the-day` – secondary archive discovery

---
