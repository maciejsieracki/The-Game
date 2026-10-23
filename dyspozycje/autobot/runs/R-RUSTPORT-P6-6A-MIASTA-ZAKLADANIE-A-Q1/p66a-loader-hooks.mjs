// Loader ESM (hooks) do uruchamiania PRAWDZIWEGO kodu TS weba z git archive (pin edb8fb56).
// Dopisuje .ts / /index.ts do importow bez rozszerzenia, .json traktuje jako modul.
// ZERO stubow i wrapperow: graf importow city-founding/city-hex-clear/conquest-stability/visibility
// (okolica, culture-religion, units/setup, types/*) laduje sie w calosci.
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
