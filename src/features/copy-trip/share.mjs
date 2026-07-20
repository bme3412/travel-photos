// Share links carry the whole generated plan in the URL fragment —
// deflate-compressed JSON, base64url — so "here's my version of your trip"
// needs no server storage and no login (a ROADMAP non-goal), and the
// payload never reaches server logs or caches. Decoding failures return
// null: a truncated or tampered link renders the invalid state, never a
// crash.

const b64encode = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const b64decode = (text) => {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

async function pipe(bytes, transform) {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// -> "c.<blob>" (deflated) or "p.<blob>" (plain, for the rare browser
// without CompressionStream). The scheme prefix keeps old links decodable
// if the default ever changes.
export async function encodeSharePayload(payload) {
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream === 'undefined') return `p.${b64encode(raw)}`;
  return `c.${b64encode(await pipe(raw, new CompressionStream('deflate-raw')))}`;
}

export async function decodeSharePayload(text) {
  try {
    const s = String(text ?? '');
    const dot = s.indexOf('.');
    if (dot < 1) return null;
    const scheme = s.slice(0, dot);
    let raw = b64decode(s.slice(dot + 1));
    if (scheme === 'c') raw = await pipe(raw, new DecompressionStream('deflate-raw'));
    else if (scheme !== 'p') return null;
    return JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return null;
  }
}
