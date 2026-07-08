// GET  /api/journal/post/[id] — read a post's frontmatter + body + trip photos.
// PUT  /api/journal/post/[id] — write it back to disk (local development only).
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { transformToCloudFront } from '../../../../utils/imageUtils';

export const dynamic = 'force-dynamic';

const JOURNAL_DIR = path.join(process.cwd(), 'content', 'journal');
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const SLUG = /^[a-z0-9-]+$/i;
const KEY_ORDER = ['title', 'tripId', 'location', 'flag', 'date', 'cover', 'excerpt', 'published'];

// Serialize frontmatter ourselves so emoji stay literal (js-yaml escapes them)
// and known keys keep a tidy order. String values use JSON quoting, which is
// valid YAML double-quoted syntax.
function serializeFrontmatter(data) {
  const keys = [
    ...KEY_ORDER.filter((k) => k in data),
    ...Object.keys(data).filter((k) => !KEY_ORDER.includes(k)),
  ];
  return keys
    .map((k) => {
      const v = data[k];
      if (v === undefined) return null;
      if (v === null) return `${k}: null`;
      if (typeof v === 'boolean' || typeof v === 'number') return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(String(v))}`;
    })
    .filter(Boolean)
    .join('\n');
}

function buildFile(data, body) {
  const cleanBody = String(body ?? '').replace(/^\s*\n/, '').trimEnd();
  return `---\n${serializeFrontmatter(data)}\n---\n\n${cleanBody}\n`;
}

const normalizeDate = (d) => {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
};

function tripPhotos(tripId) {
  try {
    const all = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'photos.json'), 'utf8')).photos;
    return all
      .filter((p) => p.albumId?.toLowerCase() === String(tripId).toLowerCase())
      .map((p) => ({
        file: p.url.split('/').pop(),
        url: transformToCloudFront(p.url),
        caption: p.caption || '',
      }));
  } catch {
    return [];
  }
}

function tripVideos(tripId) {
  try {
    const all = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'videos.json'), 'utf8')).videos || [];
    return all
      .filter((v) => v.albumId?.toLowerCase() === String(tripId).toLowerCase())
      .map((v) => ({
        file: v.file,
        url: transformToCloudFront(v.url),
        poster: v.poster ? transformToCloudFront(v.poster) : null,
        caption: v.caption || '',
      }));
  } catch {
    return [];
  }
}

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!SLUG.test(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

  let raw;
  try {
    raw = fs.readFileSync(path.join(JOURNAL_DIR, `${id}.mdx`), 'utf8');
  } catch {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }

  const { data, content } = matter(raw);
  const tripId = data.tripId || id;
  return Response.json({
    id,
    frontmatter: { ...data, date: normalizeDate(data.date) },
    body: content,
    photos: tripPhotos(tripId),
    videos: tripVideos(tripId),
  });
}

export async function PUT(request, { params }) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'The studio only works in local development. Save, then commit the file.' },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!SLUG.test(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

  const file = path.join(JOURNAL_DIR, `${id}.mdx`);
  // Never write outside content/journal.
  if (!file.startsWith(JOURNAL_DIR)) return Response.json({ error: 'Invalid path' }, { status: 400 });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data = { ...(payload.frontmatter || {}) };
  if (data.date === '' || data.date == null) delete data.date;

  try {
    fs.writeFileSync(file, buildFile(data, payload.body));
  } catch (error) {
    return Response.json({ error: `Write failed: ${error.message}` }, { status: 500 });
  }
  return Response.json({ ok: true });
}
