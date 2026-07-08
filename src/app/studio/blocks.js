// Convert an MDX post body to an editable block list and back. Only the known
// one-line components (Figure, Gallery, PullQuote) become structured blocks;
// all other content is preserved verbatim in text blocks, so round-tripping is
// lossless for anything the editor doesn't explicitly understand.

const uid = () =>
  (globalThis.crypto && globalThis.crypto.randomUUID && globalThis.crypto.randomUUID()) ||
  `b${Date.now()}${Math.round(Math.random() * 1e6)}`;

export const makeBlock = (type, data = {}) => ({ id: uid(), type, ...data });

const esc = (s = '') => String(s).replace(/"/g, '&quot;');

function parseFigure(str) {
  const src = (str.match(/src="([^"]*)"/) || [])[1] || '';
  const caption = (str.match(/caption="([^"]*)"/) || [])[1] || '';
  const wide = /(?:^|\s)wide(?:\s|=|\/|>)/.test(str);
  return makeBlock('figure', { src, caption, wide });
}

function parseGallery(str) {
  const caption = (str.match(/caption="([^"]*)"/) || [])[1] || '';
  const inner = (str.match(/srcs=\{\[([\s\S]*?)\]\}/) || [])[1] || '';
  const srcs = [...inner.matchAll(/"([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
  return makeBlock('gallery', { srcs, caption });
}

function parsePanorama(str) {
  const src = (str.match(/src="([^"]*)"/) || [])[1] || '';
  const caption = (str.match(/caption="([^"]*)"/) || [])[1] || '';
  const controls = /(?:^|\s)controls(?:\s|=|\/|>)/.test(str);
  return makeBlock('panorama', { src, caption, controls });
}

export function parseBlocks(body = '') {
  const lines = String(body).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let buf = [];
  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) blocks.push(makeBlock('text', { text }));
    buf = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const t = line.trim();

    // Figure / Gallery / Panorama — self-closing, possibly wrapped over lines.
    if (/^<(Figure|Gallery|Panorama)\b/.test(t)) {
      flush();
      let joined = t;
      while (!/\/>\s*$/.test(joined) && i + 1 < lines.length) {
        i += 1;
        joined += ` ${lines[i].trim()}`;
      }
      if (joined.startsWith('<Figure')) blocks.push(parseFigure(joined));
      else if (joined.startsWith('<Gallery')) blocks.push(parseGallery(joined));
      else blocks.push(parsePanorama(joined));
      continue;
    }

    // PullQuote — single line or wrapped.
    const pq = t.match(/^<PullQuote>([\s\S]*?)<\/PullQuote>\s*$/);
    if (pq) {
      flush();
      blocks.push(makeBlock('pullquote', { text: pq[1].trim() }));
      continue;
    }
    if (/^<PullQuote>\s*$/.test(t)) {
      flush();
      const inner = [];
      i += 1;
      while (i < lines.length && !/^\s*<\/PullQuote>\s*$/.test(lines[i])) {
        inner.push(lines[i]);
        i += 1;
      }
      blocks.push(makeBlock('pullquote', { text: inner.join('\n').trim() }));
      continue;
    }

    buf.push(line);
  }
  flush();
  return blocks.length ? blocks : [makeBlock('text', { text: '' })];
}

export function serializeBlocks(blocks) {
  const out = blocks
    .map((b) => {
      if (b.type === 'text') return b.text.trim();
      if (b.type === 'figure')
        return `<Figure src="${esc(b.src)}"${b.caption ? ` caption="${esc(b.caption)}"` : ''}${
          b.wide ? ' wide' : ''
        } />`;
      if (b.type === 'gallery')
        return `<Gallery srcs={[${(b.srcs || []).map((s) => `"${esc(s)}"`).join(', ')}]}${
          b.caption ? ` caption="${esc(b.caption)}"` : ''
        } />`;
      if (b.type === 'panorama')
        return `<Panorama src="${esc(b.src)}"${b.caption ? ` caption="${esc(b.caption)}"` : ''}${
          b.controls ? ' controls' : ''
        } />`;
      if (b.type === 'pullquote') return `<PullQuote>${b.text.trim()}</PullQuote>`;
      return '';
    })
    .filter((s) => s.length)
    .join('\n\n');
  return `${out}\n`;
}
