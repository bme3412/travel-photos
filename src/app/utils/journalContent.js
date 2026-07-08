// src/app/utils/journalContent.js
//
// Loads hand-written journal posts from content/journal/*.mdx. Each file is a
// dispatch for one trip: its filename (minus .mdx) is the trip/album id, so it
// renders at /journal/[id] in place of the auto-generated narrative post.
// Server-only (reads the filesystem).

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const JOURNAL_DIR = path.join(process.cwd(), 'content', 'journal');
const READ_WPM = 220;

function listFiles() {
  try {
    return fs.readdirSync(JOURNAL_DIR).filter((f) => f.endsWith('.mdx'));
  } catch {
    return []; // no content dir yet — every trip falls back to its narrative
  }
}

const readMinutes = (body) => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.round(words / READ_WPM)) : null;
};

// Raw source + parsed frontmatter for one post, or null when unwritten.
export function getJournalPost(id) {
  try {
    const raw = fs.readFileSync(path.join(JOURNAL_DIR, `${id}.mdx`), 'utf8');
    const { data, content } = matter(raw);
    return { frontmatter: data, body: content, readMin: readMinutes(content) };
  } catch {
    return null;
  }
}

// Frontmatter-only index of published posts, keyed by id, for the feed.
export function getJournalIndex() {
  const index = {};
  for (const file of listFiles()) {
    const id = file.replace(/\.mdx$/, '');
    try {
      const { data, content } = matter(fs.readFileSync(path.join(JOURNAL_DIR, file), 'utf8'));
      if (data.published === false) continue;
      index[id] = {
        title: data.title || null,
        excerpt: data.excerpt || null,
        date: data.date || null,
        readMin: readMinutes(content),
        written: true,
      };
    } catch {
      // skip a malformed post rather than break the whole feed
    }
  }
  return index;
}

export function getJournalSlugs() {
  return listFiles().map((f) => f.replace(/\.mdx$/, ''));
}
