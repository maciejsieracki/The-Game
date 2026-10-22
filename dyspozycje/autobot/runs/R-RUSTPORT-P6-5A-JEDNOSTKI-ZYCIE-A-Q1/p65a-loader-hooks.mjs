// Loader ESM (hooks) do uruchamiania PRAWDZIWEGO kodu TS weba z git archive (pin edb8fb56).
// - dopisuje .ts / /index.ts do importow bez rozszerzenia,
// - traktuje .json jako modul (export default),
// - BEZ STUBOW logiki i BEZ modulow wirtualnych: graf importow game/armyMerge.ts (units/setup.ts,
//   game/auto-battle-power.ts, game/unit-power.ts, game/unit-building-bonuses.ts, game/veteran.ts),
//   game/unit-cost-tempo.ts i game/unit-replace-context.ts laduje sie w calosci z pinu.
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
