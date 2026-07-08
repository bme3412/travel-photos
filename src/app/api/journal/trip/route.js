// POST /api/journal/trip — create a new trip (album + optional first
// destination + a blank journal scaffold). Local development only.
import fs from 'fs';
import path from 'path';
import { clearFileCache } from '../../../utils/fileHandler';

export const dynamic = 'force-dynamic';

const DATA = path.join(process.cwd(), 'src', 'data');
const JOURNAL = path.join(process.cwd(), 'content', 'journal');
const SLUG = /^[a-z0-9-]+$/;

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const writeJson = (f, d) => fs.writeFileSync(path.join(DATA, f), `${JSON.stringify(d, null, 2)}\n`);
const q = (s) => JSON.stringify(s ?? '');

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'The studio only works in local development.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const id = String(body.id || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  if (!SLUG.test(id)) {
    return Response.json({ error: 'Invalid id — use lowercase letters, numbers, hyphens.' }, { status: 400 });
  }
  if (!name) return Response.json({ error: 'Trip name is required.' }, { status: 400 });

  const albums = readJson('albums.json');
  if (albums.albums.some((a) => a.id.toLowerCase() === id)) {
    return Response.json({ error: 'A trip with that id already exists.' }, { status: 409 });
  }
  if (fs.existsSync(path.join(JOURNAL, `${id}.mdx`))) {
    return Response.json({ error: 'A post file with that id already exists.' }, { status: 409 });
  }

  const flag = String(body.flag || '').trim();
  const year = String(body.year || '').trim();
  const countryId = String(body.countryId || '').trim().toUpperCase();

  const album = { id, name: flag ? `${flag} ${name}` : name, year };
  if (countryId) album.countryId = countryId;
  albums.albums.push(album);
  writeJson('albums.json', albums);

  const loc = body.location || {};
  const hasLoc = loc.name && loc.lat !== '' && loc.lng !== '' && loc.lat != null && loc.lng != null;
  if (hasLoc) {
    const destinations = readJson('destinations.json'); // bare array
    const nextId = String(Math.max(0, ...destinations.map((d) => parseInt(d.id, 10) || 0)) + 1);
    destinations.push({
      id: nextId,
      name: String(loc.name).trim(),
      country: String(loc.country || '').trim(),
      description: String(loc.description || '').trim(),
      latitude: Number(loc.lat),
      longitude: Number(loc.lng),
    });
    writeJson('destinations.json', destinations);
  }

  const mdx = `---
title: ${q(name)}
tripId: ${id}
location: ${q(loc.country || body.country || '')}
flag: ${q(flag)}
date: ${q(year ? `${year}-01-01` : '')}
cover: ""
excerpt: "TODO: one or two sentences framing the trip — shown on the home feed."
published: false
---

{/* New trip — upload photos and videos in the Studio, then write here. */}
_Start writing…_
`;
  fs.writeFileSync(path.join(JOURNAL, `${id}.mdx`), mdx);

  clearFileCache();
  return Response.json({ ok: true, id });
}
