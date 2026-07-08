# Passport & Ponder · Travel Photo Hub

An immersive Next.js 15 experience for cataloging travel photography, mapping every stop on the journey, and sharing a curated “photo of the day.” Albums, data files, and helper scripts all live side by side so you can keep the storytelling layer (the UI) and the source of truth (JSON + S3) in sync.

---

## ✨ Highlights
- **Album explorer** with grid/list layouts, rich cover art, and quick stats powered by merged album + photo data (`src/app/components/PhotoAlbumExplorer.js`).
- **Dynamic album pages** that pre-render via ISR, hydrate with CloudFront-friendly URLs, and expose related location facts.
- **Interactive Mapbox GL world map** that shades visited countries, clusters destinations, and opens a side panel with contextual photos (`/map`).
- **Photo of the Day** service (`/photo-of-the-day` + `/api/random-photo`) that can serve either a deterministic daily shot or a true random pick.
- **AWS-based media pipeline** (S3 + CloudFront + sharp) with CLI helpers for converting HEIC files, uploading, validating credentials, and keeping JSON data tidy (see `scripts/`).

---

## 🧱 Tech Stack
- **Framework**: Next.js 15 App Router (React 18, Server Components + ISR)
- **Styling**: Tailwind CSS + custom global styles
- **State & Data**: Zustand store on the client, JSON files in `src/data/` read via server utilities (`fileHandler.js`)
- **Maps & Visualization**: Mapbox GL JS 3.x with a CSP worker (`src/workers/mapbox-gl-csp-worker.js`)
- **Media & Infra**: AWS S3, CloudFront CDN, `sharp` for image manipulation, Vercel deployment helpers

---

## 📁 Key Directories
- `src/app/` – App Router routes (`/`, `/albums/[id]`, `/map`, `/photo-of-the-day`, API routes, shared UI components, Zustand store, utilities).
- `src/data/` – JSON sources (`albums.json`, `photos.json`, `destinations.json`, `locations.json`, plus `travel-century-list.txt` used for stats).
- `scripts/` – Node utilities for importing photos, converting HEIC images, migrating assets, and validating AWS credentials (full docs in `scripts/README.md`).
- `public/` – Static assets, SVG icons, and any legacy images that still live locally.
- `loaders/` & `workers/` – Custom Webpack + Mapbox worker glue needed for Mapbox GL in Next.js 15.

---

## 🌍 Core Pages
- `/` – Album explorer fed by server-side data merge + client-side sorting, view toggles, and stats via Zustand.
- `/albums/[id]` – Detail layouts, CloudFront URL rewriting, dynamic Open Graph metadata, static params generation.
- `/map` – Full-screen Mapbox view with region fly-to controls, visited-country shading, destination markers, and a photo side panel.
- `/photo-of-the-day` – Fetches a random photo on each request; pairs with the `/api/random-photo` endpoint for client polling.

---
