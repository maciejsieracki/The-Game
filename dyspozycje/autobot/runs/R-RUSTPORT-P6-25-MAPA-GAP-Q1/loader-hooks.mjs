import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

import { readFileSync } from 'node:fs';
export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const src = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', shortCircuit: true, source: 'export default ' + src + ';' };
  }
  return nextLoad(url, context);
}

export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith('.') || specifier.startsWith('/')) && context.parentURL) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    for (const cand of [base, base + '.ts', path.join(base, 'index.ts')]) {
      if (existsSync(cand) && statSync(cand).isFile()) {
        return nextResolve(pathToFileURL(cand).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
