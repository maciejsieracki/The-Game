// Loader ESM (hooks) do uruchamiania PRAWDZIWEGO kodu TS weba z git archive (pin edb8fb56).
// - dopisuje .ts / /index.ts do importow bez rozszerzenia,
// - traktuje .json jako modul,
// - BEZ STUBOW logiki: graf importow cluster-start.ts / inca-llama-seed.ts / braz-access.ts
//   laduje sie w calosci (generateMap, buildClusterSpawnPlan, civ-names, diplomacy-layers...).
// - JEDYNA ingerencja: dwa cienkie wrappery OBSERWACYJNE (moduly wirtualne), podstawiane
//   wylacznie dla importow z game/cluster-start.ts. Deleguja do prawdziwych funkcji i tylko
//   ZAPISUJA wywolania w globalThis.__p61c - nie zmieniaja zadnego wyniku:
//     './civ-names'          -> pickNextCityName (argumenty + wynik)
//     '../map/cluster-spawn' -> buildClusterSpawnPlan (wynik), pickSecondHumanStartHex (argumenty + wynik)
// Korzen weba: zmienna srodowiskowa P61C_WEB_ROOT (katalog z gra/src, gra/data).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.P61C_WEB_ROOT;
if (!ROOT) throw new Error('P61C_WEB_ROOT not set');
const VIRTUAL = {
  './civ-names': 'p61c-virtual:civ-names',
  '../map/cluster-spawn': 'p61c-virtual:cluster-spawn',
};
const REAL = {
  'p61c-virtual:civ-names': `file://${ROOT}/gra/src/game/civ-names.ts`,
  'p61c-virtual:cluster-spawn': `file://${ROOT}/gra/src/map/cluster-spawn.ts`,
};
const SOURCES = {
  'p61c-virtual:civ-names': `
import * as real from '${REAL['p61c-virtual:civ-names']}';
export * from '${REAL['p61c-virtual:civ-names']}';
export function pickNextCityName(pools, ikonaId, usedNames, fallback) {
  const result = real.pickNextCityName(pools, ikonaId, usedNames, fallback);
  const cap = (globalThis.__p61c ??= { names: [], spawnPlans: [], picks: [] });
  cap.names.push({ typ: ikonaId, used: [...usedNames], fallback: fallback ?? null, result });
  return result;
}
`,
  'p61c-virtual:cluster-spawn': `
import * as real from '${REAL['p61c-virtual:cluster-spawn']}';
export * from '${REAL['p61c-virtual:cluster-spawn']}';
export function buildClusterSpawnPlan(input) {
  const result = real.buildClusterSpawnPlan(input);
  const cap = (globalThis.__p61c ??= { names: [], spawnPlans: [], picks: [] });
  const { placement, ...rest } = result;
  cap.spawnPlans.push(structuredClone(rest));
  return result;
}
export function pickSecondHumanStartHex(map, primaryHex, mode, seed, minDistance, occupiedHexes = []) {
  const result = real.pickSecondHumanStartHex(map, primaryHex, mode, seed, minDistance, occupiedHexes);
  const cap = (globalThis.__p61c ??= { names: [], spawnPlans: [], picks: [] });
  cap.picks.push({ primaryHex, mode, seed, minDistance, occupiedHexes: structuredClone(occupiedHexes), result });
  return result;
}
`,
};

export async function resolve(specifier, context, next) {
  if (
    context.parentURL &&
    context.parentURL.endsWith('/gra/src/game/cluster-start.ts') &&
    VIRTUAL[specifier]
  ) {
    return { url: VIRTUAL[specifier], shortCircuit: true };
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
  if (SOURCES[url]) {
    return { format: 'module', source: SOURCES[url], shortCircuit: true };
  }
  if (url.endsWith('.json')) {
    const src = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: `export default ${src};`, shortCircuit: true };
  }
  return next(url, context);
}
