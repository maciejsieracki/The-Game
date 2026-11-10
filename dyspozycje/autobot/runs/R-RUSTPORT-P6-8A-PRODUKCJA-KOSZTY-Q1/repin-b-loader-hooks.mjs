// Loader ESM (hooks) do uruchamiania PRAWDZIWEGO kodu TS weba z git archive (pin 91dc998a).
// Dopisuje .ts / /index.ts do importow bez rozszerzenia, .json traktuje jako modul.
// ZERO stubow i wrapperow: graf importow ladowany w calosci.
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

// Opcjonalne nadpisanie plikow JSON na czas uruchomienia (wariant progu miasto-params):
// P6_8A_JSON_OVERRIDE = '{"miasto-params.json": {...}}'. Dotyczy tylko wskazanych nazw plikow.
const OVERRIDES = process.env.P6_8A_JSON_OVERRIDE ? JSON.parse(process.env.P6_8A_JSON_OVERRIDE) : {};

export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    const name = url.slice(url.lastIndexOf('/') + 1);
    if (Object.prototype.hasOwnProperty.call(OVERRIDES, name)) {
      return { format: 'module', source: `export default ${JSON.stringify(OVERRIDES[name])};`, shortCircuit: true };
    }
    const src = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: `export default ${src};`, shortCircuit: true };
  }
  return next(url, context);
}
