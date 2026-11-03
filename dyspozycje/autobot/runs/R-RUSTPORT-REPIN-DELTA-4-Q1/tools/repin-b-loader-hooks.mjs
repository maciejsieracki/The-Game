// Loader ESM (hooks) do uruchamiania PRAWDZIWEGO kodu TS weba z `git archive` (pin edb8fb56).
// Dopisuje .ts / /index.ts do importow bez rozszerzenia, .json traktuje jako modul.
//
// JEDYNY wyjatek od "zero stubow" (jawnie): gra/src/render/improvements.ts importuje `three` (render 3D;
// brak w repo bez npm install). `improvement-build.ts` importuje z niego wylacznie typ ImprovementKey i
// tablice danych IMPROVEMENTS. Zamiast modulu renderu ladowany jest WERBATIM wycinek tego samego pliku:
// linie 20-47 (typ + tablica IMPROVEMENTS), bez zmiany ani jednego znaku. Zero wrapperow logiki.
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
  if (url.endsWith('/gra/src/render/improvements.ts')) {
    const lines = readFileSync(fileURLToPath(url), 'utf8').split('\n');
    const slice = lines.slice(19, 47).join('\n');
    return { format: 'module-typescript', source: slice, shortCircuit: true };
  }
  return next(url, context);
}
