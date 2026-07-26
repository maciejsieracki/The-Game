'use strict';
/**
 * teren-walki-etapy-test.cjs
 *
 * C-TEREN-Q1 (2026-07-26): decyzja wlasciciela wdrazana etapami w
 * gra/src/battle/battleScene.ts + battle-terrain.ts + gra/src/game/combat.ts.
 * Test sprawdza trzy nowe reguly terenu bitwy reczne/ogladane, wszystkie
 * czytane z data/terrain-combat.json (nie zaszyte jako liczby w kodzie):
 *
 *   ETAP 1: Gory = +75% Obrony broniacego (nie +50% jak Wzgorza) -- battle-
 *           terrain.ts's combatTerrainName musi zwracac 'Gory', nie zawsze
 *           'Wzgorza', gdy plansza pochodzi ze swiatowego heksu Gory.
 *   ETAP 2: Delta Zasieg (dystansowi) -- Las -1, Wzgorza/Gory +1.
 *   ETAP 3: Kawaleria/Rydwan -- Las koszt x2, Gory NIEDOSTEPNE.
 *
 * Strategia: esbuild-uje src/game/combat.ts i src/battle/battle-terrain.ts
 * (czyste, THREE.js-niezalezne moduly), laduje realny data/terrain-combat.json
 * i wywoluje eksportowane funkcje wprost -- bez instancjonowania calej
 * BattleScene (wymaga WebGL/canvas, poza zasiegiem testu node).
 *
 * Usage (from gra/): node tools/teren-walki-etapy-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const TERRAIN_JSON = path.join(GRA_DIR, 'data/terrain-combat.json');

const ENTRY = path.join(__dirname, '.teren-walki-etapy-entry.ts');
const OUT = path.join(os.tmpdir(), 'teren-walki-etapy-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  [
    "export { terrainDefenseMultiplier, terrainRangeDelta, cavalryTerrainMultiplier } from '../src/game/combat';",
    "export { presetForWorldTerrain, generateBattleTerrain, BTerrain } from '../src/battle/battle-terrain';",
  ].join('\n'),
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: GRA_DIR,
  logLevel: 'silent',
});

const {
  terrainDefenseMultiplier,
  terrainRangeDelta,
  cavalryTerrainMultiplier,
  presetForWorldTerrain,
  generateBattleTerrain,
  BTerrain,
} = require(OUT);

const terrainData = JSON.parse(fs.readFileSync(TERRAIN_JSON, 'utf8'));

let ok = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  [OK]', msg); ok++; }
  else { console.error('  [FAIL]', msg); fail++; }
}
function assertEq(actual, expected, msg) {
  assert(actual === expected, msg + ' (expected ' + expected + ', got ' + actual + ')');
}

console.log('teren-walki-etapy-test (C-TEREN-Q1)');

// ---------------------------------------------------------------------------
// ETAP 1: Gory battlefield reports combat name 'Gory' (not 'Wzgorza'), which
// makes combat.ts's terrainDefenseMultiplier resolve +75% (1.75x) Obrona for
// a defender standing there -- vs +50% (1.5x) on an actual Wzgorza battlefield.
// ---------------------------------------------------------------------------
console.log('ETAP 1 -- Gory = +75% Obrona broniacego');
{
  const goryPreset = presetForWorldTerrain({ baza: 'gory' });
  const wzgPreset = presetForWorldTerrain({ baza: 'wzgorza' });
  assertEq(goryPreset.isMountain, true, 'preset Gory ma isMountain=true');
  assertEq(wzgPreset.isMountain, false, 'preset Wzgorza ma isMountain=false');

  const goryMap = generateBattleTerrain({ cols: 34, rows: 28, seed: 'etapy-test-gory', preset: goryPreset });
  const wzgMap = generateBattleTerrain({ cols: 34, rows: 28, seed: 'etapy-test-wzg', preset: wzgPreset });

  let goryHills = 0, goryNamedGory = 0;
  for (let r = 0; r < goryMap.rows; r++) {
    for (let c = 0; c < goryMap.cols; c++) {
      if (goryMap.at(c, r) === BTerrain.Hills) {
        goryHills++;
        if (goryMap.combatTerrainName(c, r) === 'Gory') goryNamedGory++;
      }
    }
  }
  assert(goryHills > 0, 'plansza Gory wygenerowala kafle wzniesien (Hills)');
  assertEq(goryNamedGory, goryHills, 'KAZDY kafel Hills na planszy Gory raportuje nazwe bojowa Gory');

  let wzgHills = 0, wzgNamedWzg = 0;
  for (let r = 0; r < wzgMap.rows; r++) {
    for (let c = 0; c < wzgMap.cols; c++) {
      if (wzgMap.at(c, r) === BTerrain.Hills) {
        wzgHills++;
        if (wzgMap.combatTerrainName(c, r) === 'Wzgorza') wzgNamedWzg++;
      }
    }
  }
  assert(wzgHills > 0, 'plansza Wzgorza wygenerowala kafle wzniesien (Hills)');
  assertEq(wzgNamedWzg, wzgHills, 'KAZDY kafel Hills na planszy Wzgorza raportuje nazwe bojowa Wzgorza (nie Gory)');

  const defGory = terrainDefenseMultiplier('Gory', 'Wrecz', terrainData);
  const defWzg = terrainDefenseMultiplier('Wzgorza', 'Wrecz', terrainData);
  assertEq(defGory, 1.75, 'Obrona broniacego na Gory: x1.75 (+75%)');
  assertEq(defWzg, 1.5, 'Obrona broniacego na Wzgorza: x1.5 (+50%), rozne od Gory');
}

// ---------------------------------------------------------------------------
// ETAP 2: Delta Zasieg (dystansowi) czytane z terrain-combat.json.
// ---------------------------------------------------------------------------
console.log('ETAP 2 -- Delta Zasieg (dystansowi)');
{
  assertEq(terrainRangeDelta('Las', terrainData), -1, 'Zasieg dystansowego: -1 pole (Las, zaslona)');
  assertEq(terrainRangeDelta('Wzgorza', terrainData), 1, 'Zasieg dystansowego: +1 pole (Wzgorza, elewacja)');
  assertEq(terrainRangeDelta('Gory', terrainData), 1, 'Zasieg dystansowego: +1 pole (Gory, elewacja)');
  assertEq(terrainRangeDelta('Plaskie (rownina/laka)', terrainData), 0, 'Zasieg dystansowego: +-0 (Plaskie)');
  assertEq(terrainRangeDelta('Pustynia', terrainData), 0, 'Zasieg dystansowego: +-0 (Pustynia)');
}

// ---------------------------------------------------------------------------
// ETAP 3: Kawaleria/Rydwan -- koszt wejscia x2 (Las), NIEDOSTEPNE (Gory).
// Combines cavalryTerrainMultiplier (combat.ts) with battle-terrain.ts's own
// base moveCost, exactly the way battleScene.ts's _moveCostForUnit does --
// proving the SHARED rule composes correctly for a mounted unit.
// ---------------------------------------------------------------------------
console.log('ETAP 3 -- przejezdnosc/koszt konnicy i rydwanow');
{
  assertEq(cavalryTerrainMultiplier('Las', terrainData), 2, 'mnoznik kosztu ruchu konnicy: x2 (Las)');
  assertEq(cavalryTerrainMultiplier('Gory', terrainData), Infinity, 'mnoznik kosztu ruchu konnicy: NIEDOSTEPNE (Gory)');
  assertEq(cavalryTerrainMultiplier('Wzgorza', terrainData), 1, 'mnoznik kosztu ruchu konnicy: brak kary jawnej (Wzgorza -- tylko "spowolnione", bez liczby/blokady)');
  assertEq(cavalryTerrainMultiplier('Plaskie (rownina/laka)', terrainData), 1, 'mnoznik kosztu ruchu konnicy: x1 (Plaskie)');

  const goryPreset = presetForWorldTerrain({ baza: 'gory' });
  const map = generateBattleTerrain({ cols: 34, rows: 28, seed: 'etapy-test-cav', preset: goryPreset });

  // Same combined rule as battleScene.ts's _moveCostForUnit:
  //   passable(c,r) -> false => Infinity
  //   else moveCost(c,r) * (mounted ? cavalryTerrainMultiplier(combatTerrainName(c,r)) : 1)
  function moveCostForUnit(mounted, c, r) {
    if (!map.passable(c, r)) return Infinity;
    const base = map.moveCost(c, r);
    if (!mounted) return base;
    const mult = cavalryTerrainMultiplier(map.combatTerrainName(c, r), terrainData);
    if (!Number.isFinite(mult)) return Infinity;
    return base * mult;
  }

  let forestTile = null, hillsTile = null;
  for (let r = 0; r < map.rows && (!forestTile || !hillsTile); r++) {
    for (let c = 0; c < map.cols && (!forestTile || !hillsTile); c++) {
      if (!forestTile && map.at(c, r) === BTerrain.Forest) forestTile = [c, r];
      if (!hillsTile && map.at(c, r) === BTerrain.Hills) hillsTile = [c, r];
    }
  }
  assert(!!forestTile, 'plansza Gory ma przynajmniej 1 kafel Lasu do testu');
  assert(!!hillsTile, 'plansza Gory ma przynajmniej 1 kafel Gor (Hills) do testu');

  if (forestTile) {
    const [fc, fr] = forestTile;
    const footCost = moveCostForUnit(false, fc, fr);
    const cavCost = moveCostForUnit(true, fc, fr);
    assertEq(footCost, 2, 'koszt wejscia piechoty w Las: 2 (bazowy)');
    assertEq(cavCost, 4, 'koszt wejscia konnicy w Las: 4 (bazowy 2 x mnoznik x2)');
  }
  if (hillsTile) {
    const [hc, hr] = hillsTile;
    assertEq(map.combatTerrainName(hc, hr), 'Gory', 'kafel Hills na planszy Gory nazywa sie Gory (spojnosc z ETAP 1)');
    const footCost = moveCostForUnit(false, hc, hr);
    const cavCost = moveCostForUnit(true, hc, hr);
    assert(Number.isFinite(footCost), 'piechota MOZE wejsc w Gory (koszt skonczony)');
    assertEq(cavCost, Infinity, 'konnica/rydwan NIE MOZE wejsc w Gory (koszt Infinity, NIEDOSTEPNE)');
  }

  // Wzgorza (hills, NOT mountains) must NOT block cavalry -- only Gory does.
  const wzgPreset = presetForWorldTerrain({ baza: 'wzgorza' });
  const wzgMap = generateBattleTerrain({ cols: 34, rows: 28, seed: 'etapy-test-cav-wzg', preset: wzgPreset });
  let wzgHillsTile = null;
  for (let r = 0; r < wzgMap.rows && !wzgHillsTile; r++) {
    for (let c = 0; c < wzgMap.cols && !wzgHillsTile; c++) {
      if (wzgMap.at(c, r) === BTerrain.Hills) wzgHillsTile = [c, r];
    }
  }
  assert(!!wzgHillsTile, 'plansza Wzgorza ma przynajmniej 1 kafel Hills do testu');
  if (wzgHillsTile) {
    const [hc, hr] = wzgHillsTile;
    const mult = cavalryTerrainMultiplier(wzgMap.combatTerrainName(hc, hr), terrainData);
    assert(Number.isFinite(mult), 'konnica MOZE wejsc na Wzgorza (nie Gory) -- tylko Gory jest NIEDOSTEPNE');
  }
}

console.log('');
console.log('--- ' + ok + ' ok, ' + fail + ' fail ---');
process.exit(fail > 0 ? 1 : 0);
