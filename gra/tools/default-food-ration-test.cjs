'use strict';
/**
 * default-food-ration-test.cjs — R-WEB-SETTINGS-DEFAULT-FOOD-RATION-6-Q1
 * Domyslne wyzywienie (racja) nowej gry = 6 (decyzja wlasciciela 2026-11-14).
 * Pokrywa: nowa gra (gracz) -> 6; nowe miasto gracza -> 6; AI bez zmian (4);
 * stare zapisy (bez pola / z zapisanym poziomem) zachowuja swoje wartosci.
 * Run: node tools/default-food-ration-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.default-food-ration-entry.ts');
const BUNDLE = path.resolve(__dirname, '.default-food-ration-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { foundCityAt, canFoundCity } from '../src/game/cities';
export {
  DEFAULT_POZIOM_RACJI,
  DEFAULT_POZIOM_RACJI_AI,
  DEFAULT_POZIOM_RACJI_LEGACY,
  startowyPoziomRacjiDlaWlasciciela,
  getCityRationLevel,
  migrateProcentRozwojToPoziomRacji,
} from '../src/game/population-growth-v85';
export {
  freshOwnerDefaultPoziomRacji,
  freshAiOwnerDefaultPoziomRacji,
  migratePoziomRacjiOnLoad,
  resolveCityPoziomRacji,
  broadcastPoziomRacjiToOwnerCities,
} from '../src/game/empire-city-defaults';
export { generateMap } from '../src/map/generator';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  loader: { '.ts': 'ts', '.json': 'json' },
});

const M = require(BUNDLE);
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}
function eq(a, b, label) {
  ok(a === b, `${label} (got ${a}, want ${b})`);
}

console.log('--- T1: stale i nowa gra gracza = 6 ---');
eq(M.DEFAULT_POZIOM_RACJI, 6, 'T1a: DEFAULT_POZIOM_RACJI (gracz) = 6');
eq(M.freshOwnerDefaultPoziomRacji(), 6, 'T1b: freshOwnerDefaultPoziomRacji (nowa gra gracza) = 6');
eq(M.startowyPoziomRacjiDlaWlasciciela(0), 6, 'T1c: owner 0 (gracz) startuje z 6');

console.log('\n--- T2: AI bez zmian (4) ---');
eq(M.DEFAULT_POZIOM_RACJI_AI, 4, 'T2a: DEFAULT_POZIOM_RACJI_AI = 4');
eq(M.freshAiOwnerDefaultPoziomRacji(), 4, 'T2b: freshAiOwnerDefaultPoziomRacji = 4');
eq(M.startowyPoziomRacjiDlaWlasciciela(1), 4, 'T2c: owner 1 (AI) startuje z 4');
eq(M.startowyPoziomRacjiDlaWlasciciela(3), 4, 'T2d: owner 3 (AI) startuje z 4');

console.log('\n--- T3: nowe miasto gracza dziedziczy 6 (foundCityAt, owner 0) ---');
const map = M.generateMap(24, 24, 424242);
const cities = [];
function findLegalLandHex(foundingCityState = false) {
  for (const [key, hex] of Object.entries(map.hexes)) {
    const t = hex.terenBazowy;
    if (t !== 'morze' && t !== 'plytkie_morze' && t !== 'gory') {
      const [q, r] = key.split(',').map(Number);
      if (M.canFoundCity(q, r, cities, map, { foundingCityState }).ok) return { q, r };
    }
  }
  throw new Error('no legal land hex');
}
{
  const pos = findLegalLandHex(false);
  const city = M.foundCityAt(pos.q, pos.r, 0, cities, map, 'Memfis');
  ok(city !== null, 'T3a: foundCityAt gracza zwraca miasto');
  if (city) {
    cities.push(city);
    eq(city.poziomRacji, 6, 'T3b: miasto gracza poziomRacji=6');
    eq(M.getCityRationLevel(city), 6, 'T3c: getCityRationLevel=6');
  }
}
{
  const pos = findLegalLandHex(false);
  const city = M.foundCityAt(pos.q, pos.r, 1, cities, map, 'Ateny');
  ok(city !== null, 'T3d: foundCityAt AI zwraca miasto');
  if (city) {
    cities.push(city);
    eq(city.poziomRacji, 4, 'T3e: miasto AI poziomRacji=4 (bez zmian)');
  }
}

console.log('\n--- T4: dziedziczenie globalnego ustawienia wlasciciela ---');
{
  const owner = M.freshOwnerDefaultPoziomRacji();
  const inherit = { id: 'nowe', ownerId: 0, poziomRacji: 4, poziomRacjiOverride: false };
  eq(M.resolveCityPoziomRacji(inherit, owner), 6, 'T4a: miasto bez override dziedziczy 6');
  const pinned = { id: 'pin', ownerId: 0, poziomRacji: 2, poziomRacjiOverride: true };
  eq(M.resolveCityPoziomRacji(pinned, owner), 2, 'T4b: miasto z override (Indywidualne) zachowuje 2');
  const list = [
    { id: 'a', ownerId: 0, poziomRacji: 6, poziomRacjiOverride: false },
    { id: 'b', ownerId: 0, poziomRacji: 2, poziomRacjiOverride: true },
  ];
  M.broadcastPoziomRacjiToOwnerCities(list, 0, 3);
  eq(list[0].poziomRacji, 3, 'T4c: broadcast zmienia miasto bez override');
  eq(list[1].poziomRacji, 2, 'T4d: broadcast pomija miasto z override');
}

console.log('\n--- T5: stary zapis zachowuje swoje wartosci (bez zmiany przy wczytaniu) ---');
{
  const old = [
    { id: 's1', ownerId: 0, poziomRacji: 4, poziomRacjiOverride: undefined },
    { id: 's2', ownerId: 0, poziomRacji: 2, poziomRacjiOverride: undefined },
  ];
  const defaults = new Map();
  M.migratePoziomRacjiOnLoad(old, defaults, undefined);
  eq(old[0].poziomRacji, 4, 'T5a: stary zapis, miasto 4 zostaje 4 (nie nadpisane na 6)');
  eq(old[1].poziomRacji, 2, 'T5b: stary zapis, miasto 2 zostaje 2');
  eq(defaults.get(0), 4, 'T5c: domyslny gracza ze starego zapisu = wartosc pierwszego miasta (4)');
  ok(old[1].poziomRacjiOverride === true, 'T5d: miasto rozniace sie od domyslnego dostaje override=true');
  eq(M.migrateProcentRozwojToPoziomRacji(undefined), 4, 'T5e: legacy bez procentRozwoj -> 4');
  eq(M.DEFAULT_POZIOM_RACJI_LEGACY, 4, 'T5f: DEFAULT_POZIOM_RACJI_LEGACY = 4');
}

console.log(`\n=== default-food-ration-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
