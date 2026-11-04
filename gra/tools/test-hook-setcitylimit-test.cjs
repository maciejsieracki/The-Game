'use strict';
/**
 * R-WEB-TEST-HOOK-SETCITYLIMIT-Q1 — hak `__civTest.setCityLimit(n)` (tylko ?civTest=1).
 * Test na realnym kodzie (esbuild -> node): hak -> baza limitu -> REALNE isCityLimitExhausted/canFoundCity -> REALNY
 * automat ulepszen (E-FORT buduje fort dopiero przy wyczerpanym limicie). Uzasadnienie: dzis unlockAllTech podnosi epoke
 * (limit 1 -> 11), wiec "limit wyczerpany" nie dalo sie wymusic w tescie fortow.
 * Run z gra/: node tools/test-hook-setcitylimit-test.cjs      Mutacje: HOOK_SRC_DIR=<kopia gra/src>
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.HOOK_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'setcitylimit-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export * as HOOKS from ${JSON.stringify(SRC + '/game/civ-test-hooks')};`,
  `export * as AIMP from ${JSON.stringify(SRC + '/game/auto-improvements')};`,
  `export { canFoundCity } from ${JSON.stringify(SRC + '/game/cities')};`,
].join('\n') + '\n');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(bundle);
const { installCivTestHooks } = M.HOOKS;
const { pickAutoImprovements, isCityLimitExhausted } = M.AIMP;

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

const FULL = new Set(['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Górnictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Drogi brukowane', 'Matematyka', 'Obróbka kamienia', 'Kamieniarstwo']);
const W = 44, H = 44, CQ = 22, CR = 22, K = (q, r) => `${q},${r}`;
function makeMap() {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  hexes[K(CQ, CR)].terenBazowy = 'gory';
  hexes[K(CQ + 5, CR)].terenBazowy = 'gory';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [] };
}
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 5, ulepszeniaFocus: 'zrownowazone' };

// "gra": stan, ktory hak zmienia (jak _menuCityLimitBase w main.ts); gracz po unlockAllTech = epoka 3.
function mkGame(era) {
  const g = { base: 10, era };
  g.deps = new Proxy({ setCityLimitBase: b => { g.base = b; }, meEra: () => g.era }, {
    get: (t, k) => (k in t ? t[k] : () => { throw new Error('dep ' + String(k)); }),
  });
  return g;
}
function fortsFor(g) {
  const cities = [CITY];
  const exhausted = isCityLimitExhausted(cities, g.base, g.era);
  const picks = pickAutoImprovements({
    cities, ownerId: 0, map: makeMap(), territoryNodes: [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 5, level: 1 }],
    placedImprovements: new Map(), pracaAvailable: 5000, unlockedTechs: FULL, pracaSurplusThreshold: 30, skipWyrab: true,
    demandDriven: true, resourceDeficitKeys: [], getFocus: () => 'zrownowazone', getOnlyWorked: () => true,
    getWorkedHexKeys: () => new Set(), pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: g.era,
    foodImprovementStages: () => true, cityLimitExhausted: exhausted,
  });
  return { exhausted, forts: picks.filter(p => p.key === 'fort' || p.key === 'posterunek') };
}

console.log('A. bez parametru ?civTest=1 hak nie istnieje (produkcja)');
for (const s of ['', '?civTest=0', '?testhook=1', '?civTest=11']) {
  const win = {}; const g = mkGame(3);
  ok(installCivTestHooks(win, s, g.deps) === false && win.__civTest === undefined, `search="${s}" -> brak __civTest`);
  ok(g.base === 10, `search="${s}" -> baza limitu nietknieta (10)`);
}

console.log('B. bez wywolania setCityLimit limit liczy sie jak dotad (epoka 3, baza 10 -> limit 20)');
{
  const win = {}; const g = mkGame(3);
  ok(installCivTestHooks(win, '?civTest=1', g.deps) === true && typeof win.__civTest.setCityLimit === 'function', 'hak zainstalowany, setCityLimit jest funkcja');
  const r = fortsFor(g);
  ok(g.base === 10 && r.exhausted === false && r.forts.length === 0, 'baza 10, limit niewyczerpany, 0 fortow (stan "U-2" sprzed haka)');
}

console.log('C. setCityLimit(1), 1 miasto, epoka 3 (po unlockAllTech) -> limit wyczerpany -> automat buduje fort');
{
  const win = {}; const g = mkGame(3);
  installCivTestHooks(win, '?civTest=1', g.deps);
  win.__civTest.setCityLimit(1);
  const r = fortsFor(g);
  ok(g.base === -9, `baza = 1 - (3-1)*5 = -9 (got ${g.base})`);
  ok(r.exhausted === true, 'isCityLimitExhausted(1 miasto) === true');
  ok(r.forts.length === 1 && r.forts[0].key === 'fort' && r.forts[0].q === CQ + 5 && r.forts[0].r === CR, `fort na gorze na granicy (got ${JSON.stringify(r.forts.map(p => p.key + '@' + p.q + ',' + p.r))})`);
  const can = M.canFoundCity(CQ + 7, CR, [CITY], makeMap(), { ownerId: 0, ownerEra: 3, gameConfig: { cityLimitBase: g.base }, withinTerritory: () => true });
  ok(can.ok === false && can.reason === 'limit miast na tej epoce', `realny canFoundCity odmawia: "${can.reason}" (parytet limitu)`);
}

console.log('D. epoka 1 i 5: limit dokladnie n; n=2 przy 1 miescie -> NIE wyczerpany');
for (const era of [1, 5]) {
  const win = {}; const g = mkGame(era);
  installCivTestHooks(win, '?civTest=1', g.deps);
  win.__civTest.setCityLimit(1);
  ok(isCityLimitExhausted([CITY], g.base, era) === true, `epoka ${era}, limit 1 -> wyczerpany`);
  win.__civTest.setCityLimit(2);
  ok(isCityLimitExhausted([CITY], g.base, era) === false && fortsFor(g).forts.length === 0, `epoka ${era}, limit 2 -> niewyczerpany, 0 fortow`);
}

console.log('E. wejscia niepoprawne ignorowane; 0 dozwolone');
{
  const win = {}; const g = mkGame(1);
  installCivTestHooks(win, '?civTest=1', g.deps);
  for (const bad of [NaN, -1, Infinity, undefined]) { win.__civTest.setCityLimit(bad); }
  ok(g.base === 10, 'NaN/-1/Infinity/undefined -> baza bez zmian');
  win.__civTest.setCityLimit(0);
  ok(g.base === 0 && isCityLimitExhausted([], g.base, 1) === true, 'n=0 -> limit 0, wyczerpany nawet bez miast');
}

console.log(`\nPASS=${passed} FAIL=${failed}`);
process.exit(failed ? 1 : 0);
