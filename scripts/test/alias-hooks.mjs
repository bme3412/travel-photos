// Module hooks that let plain `node --test` load application modules from
// src/: resolves the Next.js "@/" alias, force-treats src/**/*.js as ESM
// (the package has no "type": "module"), and supplies the JSON import
// attribute Next's bundler doesn't require but Node does.

import { statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const SRC_URL = pathToFileURL(SRC_DIR + path.sep).href;

const isFile = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

// Mirror the bundler's extensionless resolution for alias imports.
function probe(base) {
  return [base, `${base}.js`, `${base}.mjs`, `${base}.json`, path.join(base, 'index.js')].find(
    isFile
  );
}

export async function resolve(specifier, context, next) {
  let spec = specifier;
  if (spec.startsWith('@/')) {
    const resolved = probe(path.join(SRC_DIR, spec.slice(2)));
    if (!resolved) throw new Error(`Cannot resolve alias import "${specifier}"`);
    spec = pathToFileURL(resolved).href;
  }
  const result = await next(spec, context);
  if (result.url?.endsWith('.json')) {
    return { ...result, importAttributes: { type: 'json' } };
  }
  return result;
}

export async function load(url, context, next) {
  if (url.startsWith(SRC_URL) && url.endsWith('.js')) {
    const source = await readFile(new URL(url), 'utf8');
    return { format: 'module', source, shortCircuit: true };
  }
  return next(url, context);
}
