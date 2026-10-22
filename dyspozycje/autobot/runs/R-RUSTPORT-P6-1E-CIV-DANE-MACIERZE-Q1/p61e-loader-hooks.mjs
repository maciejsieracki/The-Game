// Loader ESM (hooks) do uruchamiania kodu TS weba z git archive (pin edb8fb56).
// Bez stubow: civ-matrix.ts, civ-matrix-semantic.ts, civ-names.ts, city-names-pool.ts,
// civ-roster.ts, civ-entry-epoch.ts i civ-ai-data.ts importuja tylko siebie nawzajem i
// pliki data/*.json; types/player.ts (enum TypCywilizacji) ma wylacznie `import type`
// (wymazywany). Wymaga `node --experimental-transform-types` (enum). Loader tylko
// - dopisuje .ts / /index.ts do importow bez rozszerzenia,
// - traktuje .json jako modul.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, next) {
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
