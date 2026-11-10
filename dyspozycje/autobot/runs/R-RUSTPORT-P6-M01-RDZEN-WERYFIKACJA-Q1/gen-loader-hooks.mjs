// Loader Node (ESM hooks) do uruchamiania kodu TS weba z git archive (pin edb8fb56).
// Rozwiazuje importy bez rozszerzenia (dopisuje .ts / /index.ts) i traktuje .json jako modul.
// Uzycie: node --experimental-strip-types --import ./gen-loader-register.mjs <skrypt>
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
        // proba kolejnego sufiksu
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
