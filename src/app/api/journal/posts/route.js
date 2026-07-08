// GET /api/journal/posts — list every journal post for the studio sidebar.
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const dynamic = 'force-dynamic';

const DIR = path.join(process.cwd(), 'content', 'journal');

export async function GET() {
  let files = [];
  try {
    files = fs.readdirSync(DIR).filter((f) => f.endsWith('.mdx'));
  } catch {
    // no content dir
  }

  const posts = files
    .map((file) => {
      const id = file.replace(/\.mdx$/, '');
      let data = {};
      try {
        data = matter(fs.readFileSync(path.join(DIR, file), 'utf8')).data;
      } catch {
        // skip malformed frontmatter
      }
      return {
        id,
        title: data.title || id,
        flag: data.flag || null,
        published: data.published !== false,
      };
    })
    .sort((a, b) => {
      if (a.published !== b.published) return a.published ? -1 : 1;
      return String(a.title).localeCompare(String(b.title));
    });

  return Response.json(posts);
}
