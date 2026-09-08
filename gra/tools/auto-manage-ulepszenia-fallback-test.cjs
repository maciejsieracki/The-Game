'use strict';
/**
 * auto-manage-ulepszenia-fallback-test.cjs -- P-BUDOWA-AUTO-NIE-LADUJE-ULEPSZEN-Q1
 *
 * Dowod PO naprawie: pickAutoBuildItem (auto-manage.ts) laduje ulepszenia POZIOMU
 * budynkow juz zbudowanych (fallback "poziom 2") gdy pula NOWYCH budynkow jest
 * wyczerpana -- w KAZDYM z trzech trybow (priorytet/lista/zrownowazone), na
 * prawdziwych danych z data/buildings.json.
 *
 * DIAGNOZA (PRZED naprawa, potwierdzona zywa symulacja -- patrz raport Operatora):
 * `buildableProduction` (production.ts) wyklucza z kandydatow KAZDY budynek juz w
 * `builtBuildingIds` (`buildingTypeCommitted`) -- poprawne dla nowych budynkow, ale
 * oznacza ze podniesienie poziomu (ten sam `id`, wyzszy `targetLevel`, manualny
 * przycisk "Ulepsz" w cityPanel.ts) NIGDY nie trafialo do `candidates`. Wszystkie
 * trzy tryby czytaly te sama liste `candidates` -> wszystkie trzy zwracaly `null`
 * mimo dostepnych ulepszen (jedna wspolna wada, nie trzy osobne).
 *
 * Run from gra/: node tools/auto-manage-ulepszenia-fallback-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[auto-manage-ulepszenia-fallback-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.auto-manage-ulepszenia-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.auto-manage-ulepszenia-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { pickAutoBuildItem } from '../src/game/auto-manage';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[auto-manage-ulepszenia-fallback-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { pickAutoBuildItem } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' -- got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b)); }
}
function assert(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

// --- prawdziwe dane budynkow ------------------------------------------------
const buildingsRaw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'buildings.json'), 'utf8'));
const buildings = Array.isArray(buildingsRaw) ? buildingsRaw : buildingsRaw.buildings;
const data = { buildings, units: [] };

// Scenariusz z ekranu wlasciciela: wszystkie budynki epoki 1 juz zbudowane w miescie
// (m.in. Stolarnia, Targowisko, Stela/Pomnik, Kamienne kregi, Warsztat kamieniarski,
// Studnia, Garncarnia), miasto w epoce 2 -- pula NOWYCH budynkow (epoki<=2, jeszcze
// niezbudowanych) jest pusta (brak zbadanych technologii epoki 2), a kilka zbudowanych
// budynkow ma dostepny "Ulepsz" do poziomu 2 (maksPoziom>1).
const epoch1Ids = buildings.filter(b => b.epokaWejscia === 1).map(b => b.id);
const ctx = { epoch: 2, builtBuildingIds: epoch1Ids, empireResourceStock: {}, activeResourceLabels: [], empireActiveResourceLabels: [] };
const prod = { kolejka: [], postep: 0 };
const surowce = { drewno: 999999, kamien: 999999, zelazo: 999999, cegla: 999999, ceramika: 999999 };

console.log('\n[auto-manage-ulepszenia-fallback-test] Running tests...\n');

// Test 1: tryb 'zrownowazone' -- realistyczny profil gracza -- laduje ulepszenie
console.log("1. tryb 'zrownowazone': pula nowych wyczerpana -> ulepszenie zamiast null");
const cityZrown = { id: 'c1', budowaTryb: 'zrownowazone', budowaFocus: 'zrownowazone', budowaPriorytetTypow: ['zrownowazone'], surowce };
const r1 = pickAutoBuildItem(cityZrown, prod, data, { unlockedTechs: [], ctx });
assert(r1 !== null, "zrownowazone: enqueue nie jest null");
assert(r1 && epoch1Ids.includes(r1.id), "zrownowazone: wybrany element to ulepszenie juz zbudowanego budynku (" + (r1 && r1.id) + ")");

// Test 2: tryb 'priorytet' -- realistyczny profil (typowe ogniska gracza) -- laduje ulepszenie
console.log("\n2. tryb 'priorytet': pula nowych wyczerpana -> ulepszenie zamiast null");
const cityPrio = { id: 'c2', budowaTryb: 'priorytet', budowaFocus: 'wzrost', budowaPriorytetTypow: ['wzrost', 'produkcja', 'wojsko', 'kultura', 'prawo'], surowce };
const r2 = pickAutoBuildItem(cityPrio, prod, data, { unlockedTechs: [], ctx });
assert(r2 !== null, "priorytet: enqueue nie jest null");
assert(r2 && epoch1Ids.includes(r2.id), "priorytet: wybrany element to ulepszenie juz zbudowanego budynku (" + (r2 && r2.id) + ")");

// Test 3: tryb 'lista' -- lista gracza z DAWNA skonfigurowana samymi id NOWYCH budynkow,
// zaden z nich juz nie jest w candidates (wszystkie zbudowane/niedostepne) -> zamiast
// bezczynnosci, auto-budowa laduje ulepszenie.
console.log("\n3. tryb 'lista': lista bez dopasowania w puli nowych -> ulepszenie zamiast null");
const cityLista = { id: 'c3', budowaTryb: 'lista', budowaLista: ['stolarnia', 'targowisko', 'kamieniarski'], surowce };
const r3 = pickAutoBuildItem(cityLista, prod, data, { unlockedTechs: [], ctx });
assert(r3 !== null, "lista: enqueue nie jest null");
assert(r3 && epoch1Ids.includes(r3.id), "lista: wybrany element to ulepszenie juz zbudowanego budynku (" + (r3 && r3.id) + ")");

// Test 4: tryb 'lista' -- REGRESJA: lista z pasujacym NOWYM budynkiem (nie zbudowanym,
// dostepnym) MUSI nadal wygrywac nad ulepszeniem (sterowanie gracza ma pierwszenstwo).
console.log("\n4. tryb 'lista' regresja: dopasowanie w puli nowych wygrywa nad ulepszeniem");
const epoch2NotBuilt = buildings.find(b => b.id === 'biblioteka');
assert(!!epoch2NotBuilt, "fixture: istnieje budynek 'biblioteka' (epoka 2)");
if (epoch2NotBuilt) {
  const cityLista2 = { id: 'c4', budowaTryb: 'lista', budowaLista: [epoch2NotBuilt.id, 'stolarnia'], surowce };
  const r4 = pickAutoBuildItem(cityLista2, prod, data, {
    unlockedTechs: [epoch2NotBuilt.techUnlock],
    ctx: { ...ctx, empireActiveResourceLabels: ['Drewno', 'Kamien'], activeResourceLabels: ['Drewno', 'Kamien'] },
  });
  eq(r4 && r4.id, epoch2NotBuilt.id, "lista: nowy budynek z listy nadal wygrywa nad ulepszeniem");
}

// Test 5: tryb 'reczny' -- bez zmian, nadal null (auto-budowa wylaczona)
console.log("\n5. tryb 'reczny' -- bez zmian, brak auto-enqueue");
const cityReczny = { id: 'c5', budowaTryb: 'reczny', surowce };
const r5 = pickAutoBuildItem(cityReczny, prod, data, { unlockedTechs: [], ctx });
eq(r5, null, "reczny: enqueue === null (bez zmian)");

// Test 6: gdy NIE MA zadnych ulepszen dostepnych (brak zbudowanych budynkow z maksPoziom>1)
// i pula nowych tez pusta -> nadal null (fallback nie wymysla kandydatow z powietrza)
console.log('\n6. Brak ulepszen i brak nowych -> nadal null');
const ctxPusty = { epoch: 2, builtBuildingIds: [], empireResourceStock: {}, activeResourceLabels: [], empireActiveResourceLabels: [] };
const cityPusty = { id: 'c6', budowaTryb: 'zrownowazone', budowaFocus: 'zrownowazone', budowaPriorytetTypow: ['zrownowazone'] };
const r6 = pickAutoBuildItem(cityPusty, prod, data, { unlockedTechs: [], ctx: ctxPusty });
// (przy braku surowcow i builtBuildingIds nowe budynki tez sa odciete gate'ami surowcowymi,
// wiec candidates i upgrades powinny obie byc puste)
eq(r6, null, 'brak jakichkolwiek kandydatow -> null (fallback nie wymysla)');

// Test 7: front kolejki niepusty -> null, niezaleznie od dostepnych ulepszen (bez zmian)
console.log('\n7. Front kolejki niepusty -> null (bez zmian, regresja)');
const prodZFrontem = { kolejka: [{ kind: 'budynek', id: 'stolarnia', nazwa: 'Stolarnia', koszt: 20 }], postep: 0 };
const r7 = pickAutoBuildItem(cityZrown, prodZFrontem, data, { unlockedTechs: [], ctx });
eq(r7, null, 'front niepusty -> null');

// --- summary ---------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log('\nAUTO-MANAGE-ULEPSZENIA-FALLBACK OK (' + passed + '/' + total + ')');
} else {
  console.log('\nAUTO-MANAGE-ULEPSZENIA-FALLBACK FAIL (' + passed + '/' + total + ' passed, ' + failed + ' failed)');
}

try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
