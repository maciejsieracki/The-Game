// Loader ESM (hooks) do uruchamiania kodu TS weba z git archive (pin edb8fb56).
// - dopisuje .ts / /index.ts do importow bez rozszerzenia,
// - traktuje .json jako modul,
// - ZASTEPUJE dwa importy wartosciowe ciezkiego grafu (./barbarians, ./society-breakdown)
//   stubami, ktorych stale sa werbatim z weba (weryfikowane regexem w generatorze).
//   Stuby nie przenosza zadnej logiki z tych plikow; uzywane tylko przez owner-utils/human-owners.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const STUBS = {
  './barbarians': pathToFileURL(join(here, 'stubs', 'barbarians.ts')).href,
  './society-breakdown': pathToFileURL(join(here, 'stubs', 'society-breakdown.ts')).href,
};

export async function resolve(specifier, context, next) {
  if (context.parentURL && context.parentURL.includes('/gra/src/game/') && STUBS[specifier]) {
    return { url: STUBS[specifier], shortCircuit: true };
  }
  try {
    return await next(specifier, context);
  } catch (e) {
    for (const suf of ['.ts', '/index.ts']) {
      try {
        return await next(specifier + suf, context);
      } catch {
        // kolejny sufiks
      }
    }
    throw e;
  }
}

export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    const src = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: `export default ${src};`, shortCircuit: true };
  }
  return next(url, context);
}
