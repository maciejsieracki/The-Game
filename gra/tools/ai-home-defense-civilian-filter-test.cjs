'use strict';
/**
 * ai-home-defense-civilian-filter-test.cjs -- R-WEB-AI-HOME-DEFENDERS-CIVILIAN-FILTER-Q1.
 * Run from gra/:  node tools/ai-home-defense-civilian-filter-test.cjs
 *
 * Problem: glowna sciezka decideAITurn (krok 4b/4b2) woluje assignHomeDefenders na PELNYM
 * myUnits. Najblizszym obroncą domu przed barbarzyncami moze zostac cywil (robotnik, osadnik),
 * jednostka zaokretowana (embarked), jednostka morska (seaRaider) albo wodz kampanii (isGeneral).
 * Sciezka kampanii wodza (planCampaignBarbarianHomeDefense) juz filtruje pule -- ta sama zasada
 * ma obowiazywac w glownej sciezce (wspolna funkcja filtrujaca, bez kopii).
 *
 * Metoda: testy importuja RZECZYWISTE decideAITurn z ai.ts (esbuild bundle), bez kopiowania logiki.
 * Sciezka glowna: opts bez aiGeneralWarCampaign / warAllIn.
 *
 * T1 cywil (robotnik) blizej barbarzyncy niz wojskowy def1 -> def1 zostaje obroncą (rusza ku barbarzyncy).
 * T2 jednostka zaokretowana (embarked) blizej -> def1 zostaje obroncą.
 * T3 jednostka morska (seaRaider) blizej -> def1 zostaje obroncą.
 * T4 wodz (isGeneral) blizej -> def1 zostaje obroncą.
 * T5 osadnik (settler) blizej -> def1 zostaje obroncą.
 * T6 kontrola: bez cywila/okrętu/wodza -- def1 rusza ku barbarzyncy (zachowanie bez zmian).
 * T7 cywil nie dostaje rozkazu ruchu ku barbarzyncy jako obronca (przydzial nie trafia do cywila).
 *    Straznik regresji, nie dowod RED: przechodzi takze przed poprawka (robotnik sam idzie ku barbarzyncy).
 * T8 determinizm -- dwa identyczne wywolania daja identyczne komendy.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-home-defense-civilian-filter] esbuild not found. Run: npm ci --ignore-scripts (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-home-defense-civilian-filter-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-home-defense-civilian-filter-bundle.cjs');

const ENTRY_TS = `
export { decideAITurn } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { hexDistance } from ${JSON.stringify(AI_SRC + '/units/setup')};
export { setArmyConsolidationOverride } from ${JSON.stringify(AI_SRC + '/game/army-consolidation')};
export { setHomeWarDefenseOverride } from ${JSON.stringify(AI_SRC + '/game/ai-war-home-defense')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-home-defense-civilian-filter] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const AI = require(BUNDLE_FILE);
const { decideAITurn, hexDistance, setArmyConsolidationOverride, setHomeWarDefenseOverride } = AI;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const BARB = -1;
const ENEMY_CIV = 2;
const MY_CITY = { q: 25, r: 25 };
const ENEMY_CAPITAL = { q: 2, r: 25 };

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak',
        wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeUnit(id, ownerId, q, r, extra) {
  return { id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...(extra || {}) };
}
const data = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
  buildings: [{ id: 'koszary', nazwa: 'Koszary' }],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};

/** Glowna sciezka: bez kampanii wodza i bez war-allin. */
function mainOpts(turn = 1) {
  return { currentTurn: turn, canEngageOwner: (t) => t === ENEMY_CIV || t === BARB };
}

function commandsByUnit(cmds) {
  const m = new Map();
  for (const c of cmds) {
    if (c.unitId !== undefined && !m.has(c.unitId)) m.set(c.unitId, c);
  }
  return m;
}

function withFlags(fn) {
  setArmyConsolidationOverride(false);
  setHomeWarDefenseOverride(null);
  try { return fn(); }
  finally {
    setArmyConsolidationOverride(null);
    setHomeWarDefenseOverride(null);
  }
}

/**
 * Scenariusz: miasto AI c1 (pop=5), barbarzynca thr1 na dystansie 7 od miasta, wojskowy obronca
 * def1 na dystansie 5 od barbarzyncy. `nearExtra` to jednostka BLIZSZA barbarzyncy (dystans 3),
 * ktora przed poprawka trafia do puli obroncow.
 */
function scenario(nearExtra) {
  const map = makeMap(60, 60);
  const cities = [
    { id: 'c1', ownerId: 1, q: MY_CITY.q, r: MY_CITY.r, name: 'TestCity', population: 5 },
    { id: 'ec1', ownerId: ENEMY_CIV, q: ENEMY_CAPITAL.q, r: ENEMY_CAPITAL.r, name: 'Enemy', population: 5 },
  ];
  const threat = makeUnit('thr1', BARB, 25, 32);
  const units = [
    makeUnit('def1', 1, 25, 27),
    ...(nearExtra ? [nearExtra] : []),
    threat,
  ];
  return { map, units, cities, threat };
}

function assertDefenderApproaches(cmds, label) {
  const cd = cmds.get('def1');
  assert(cd !== undefined && cd.type === 'move' && hexDistance(cd.toQ, cd.toR, 25, 32) < hexDistance(25, 27, 25, 32),
    `${label}: wojskowy obronca def1 zbliza sie do barbarzyncy (${JSON.stringify(cd)})`);
}

withFlags(() => {
  // T1: cywil (robotnik) blizej barbarzyncy.
  console.log('\n--- T1: robotnik blizej barbarzyncy nie zostaje obroncą domu (sciezka glowna) ---');
  {
    const sc = scenario(makeUnit('wrk1', 1, 25, 29, { category: 'robotnik', typeId: 'Robotnik' }));
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, mainOpts()));
    assertDefenderApproaches(cmds, 'T1');
  }

  // T2: jednostka zaokretowana blizej.
  console.log('\n--- T2: jednostka zaokretowana (embarked) blizej nie zostaje obroncą ---');
  {
    const sc = scenario(makeUnit('emb1', 1, 25, 30, { embarked: true }));
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, mainOpts()));
    assertDefenderApproaches(cmds, 'T2');
  }

  // T3: jednostka morska (seaRaider) blizej.
  console.log('\n--- T3: jednostka morska (seaRaider) blizej nie zostaje obroncą ---');
  {
    const sc = scenario(makeUnit('sea1', 1, 25, 30, { seaRaider: true }));
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, mainOpts()));
    assertDefenderApproaches(cmds, 'T3');
  }

  // T4: wodz kampanii (isGeneral) blizej.
  console.log('\n--- T4: wodz (isGeneral) blizej nie zostaje obroncą ---');
  {
    const sc = scenario(makeUnit('gen1', 1, 25, 30, { isGeneral: true }));
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, mainOpts()));
    assertDefenderApproaches(cmds, 'T4');
  }

  // T5: osadnik blizej.
  console.log('\n--- T5: osadnik blizej nie zostaje obroncą ---');
  {
    const sc = scenario(makeUnit('set1', 1, 25, 29, { category: 'osadnik', typeId: 'Osadnik' }));
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, mainOpts()));
    assertDefenderApproaches(cmds, 'T5');
  }

  // T6: kontrola -- bez dodatkowej jednostki def1 nadal broni domu.
  console.log('\n--- T6: kontrola bez dodatkowej jednostki ---');
  {
    const sc = scenario(null);
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, mainOpts()));
    assertDefenderApproaches(cmds, 'T6');
  }

  // T7: cywil nie dostaje rozkazu ruchu jako obronca (ruch ku barbarzyncy).
  console.log('\n--- T7: cywil nie dostaje przydzialu obrony (brak ruchu ku barbarzyncy) ---');
  {
    const sc = scenario(makeUnit('wrk1', 1, 25, 29, { category: 'robotnik', typeId: 'Robotnik' }));
    const cmds = commandsByUnit(decideAITurn(1, sc.units, sc.cities, sc.map, data, mainOpts()));
    const cw = cmds.get('wrk1');
    assert(cw === undefined || (cw.type !== 'attack' && cw.targetCityId === undefined),
      `T7: robotnik nie dostaje ataku na barbarzyncę ani marszu na miasto wroga (${JSON.stringify(cw)})`);
  }

  // T8: determinizm.
  console.log('\n--- T8: determinizm ---');
  {
    const s1 = scenario(makeUnit('wrk1', 1, 25, 29, { category: 'robotnik', typeId: 'Robotnik' }));
    const s2 = scenario(makeUnit('wrk1', 1, 25, 29, { category: 'robotnik', typeId: 'Robotnik' }));
    const a = JSON.stringify(decideAITurn(1, s1.units, s1.cities, s1.map, data, mainOpts()));
    const b = JSON.stringify(decideAITurn(1, s2.units, s2.cities, s2.map, data, mainOpts()));
    eq(a, b, 'T8: dwa przebiegi zgodne');
  }
});

console.log(`\nai-home-defense-civilian-filter-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
