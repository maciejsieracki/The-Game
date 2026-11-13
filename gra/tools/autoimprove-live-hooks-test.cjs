'use strict';
/**
 * R-WEB-AUTOIMPROVE-LIVE-HOOKS-Q1 — kontrakt: (1) log decyzji pickera (opcjonalny, zero wplywu na wyniki),
 * (2) hooki `window.__civTest` tylko przy `?civTest=1`, (3) SONDY TEKSTOWE main.ts (lekcja
 * P-PROC-BRAMKA-NIE-LAPIE-USUNIECIA-HOOKA-Q1: usuniecie wywolania hooka z main.ts ma lapac test).
 * Run z gra/:  node tools/autoimprove-live-hooks-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.LIVE_HOOKS_SRC_DIR || path.resolve(GRA_ROOT, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

// --- sondy tekstowe ---------------------------------------------------------
console.log('(A) sondy tekstowe main.ts / civ-test-hooks.ts');
const mainTs = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const hooksTs = fs.readFileSync(path.join(SRC, 'game', 'civ-test-hooks.ts'), 'utf8');
const autoTs = fs.readFileSync(path.join(SRC, 'game', 'auto-improvements.ts'), 'utf8');
ok(/import \{ installCivTestHooks(?:, isCivTestEnabled)? \} from '\.\/game\/civ-test-hooks'/.test(mainTs), 'main.ts importuje installCivTestHooks');
ok(/installCivTestHooks\(\s*window as unknown as Record<string, unknown>,\s*typeof location !== 'undefined' \? location\.search : ''/.test(mainTs),
  'main.ts WYWOLUJE installCivTestHooks(window, location.search, ...)');
const callIdx = mainTs.indexOf('installCivTestHooks(window');
ok(callIdx > 0 && /triggerPlayerEndTurn\(\)/.test(mainTs.slice(callIdx, callIdx + 4000)), 'hook endTurn deleguje do triggerPlayerEndTurn');
ok(/civTestOnRiver\(q, r\)/.test(mainTs) && /riverPaths/.test(mainTs.slice(mainTs.indexOf('const civTestOnRiver'), mainTs.indexOf('const civTestOnRiver') + 600)), 'main.ts: hook naRzece uzywa riverPaths + sasiadow (nie tylko rzeka.obecna)');
ok(/get\('civTest'\) === '1'/.test(hooksTs), 'civ-test-hooks.ts: bramka dokladnie ?civTest=1');
ok(/if \(!isCivTestEnabled\(search\)\) return false;/.test(hooksTs), 'civ-test-hooks.ts: instalacja za bramka (return false bez parametru)');
ok(!/__civTest\s*=/.test(mainTs), 'main.ts nie przypisuje __civTest bezposrednio (tylko przez bramkowany modul)');
ok(/resolveDecisionSink\(opts\.onDecision\)/.test(autoTs) && /if \(dbg\) \{/.test(autoTs), 'auto-improvements.ts: log za `if (dbg)` (domyslnie wylaczony)');

// --- bundle -----------------------------------------------------------------
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'live-hooks-'));
const entry = path.join(temp, 'entry.ts'), bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\nexport { installCivTestHooks, isCivTestEnabled } from ${JSON.stringify(SRC + '/game/civ-test-hooks')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error', nodePaths: [path.resolve(GRA_ROOT, 'node_modules')] });
const { pickAutoImprovements, installCivTestHooks, isCivTestEnabled } = require(bundle);

// --- hooki: bramka URL --------------------------------------------------------
console.log('(B) window.__civTest tylko przy ?civTest=1');
const deps = {
  getTurn: () => 7, getCities: () => [{ id: 'c1', ownerId: 0, q: 1, r: 2, population: 3 }], getUnits: () => [], getFortNodes: () => [{ q: 4, r: 5, ownerId: 0, type: 'fort' }],
  territoryOwnerAt: () => 0, getPlacedLayers: () => ['farma'], getHexInfo: () => ({ nakladka: 'las', teren: 'laka', naRzece: true, clearing: false }),
  hexesWithin: () => [{ q: 1, r: 2 }], unlockAllTech: () => {}, setPracaPool: () => {}, getPracaPool: () => 9, setUlepszeniaPolicy: () => {}, getUlepszeniaPolicy: () => ({}),
  foundCandidates: () => [], foundPlayerCity: () => true, addUnit: () => 'u1', setWar: () => {}, endTurn: () => {}, meOwnerId: () => 0,
};
for (const s of ['', '?', '?skipMenuRedirect=1', '?civTest=0', '?civTest=true', '?civTest=', '?xcivTest=1', null, undefined]) {
  const w = {};
  const r = installCivTestHooks(w, s, deps);
  ok(r === false && w.__civTest === undefined, `search=${JSON.stringify(s)} => __civTest === undefined`);
}
{
  const w = {};
  ok(installCivTestHooks(w, '?skipMenuRedirect=1&civTest=1', deps) === true && !!w.__civTest, '?civTest=1 => __civTest zdefiniowany');
  ok(w.__civTest.hex(1, 2).layers[0] === 'farma' && w.__civTest.forts().length === 1 && w.__civTest.state().turn === 7, 'odczyt stanu: hex/forts/state');
  w.__civTest.debugOn();
  ok(typeof w.__civAutoImproveDebug === 'function', 'debugOn ustawia flage __civAutoImproveDebug');
  w.__civAutoImproveDebug({ x: 1 });
  ok(w.__civTest.drainDecisions().length === 1 && w.__civTest.drainDecisions().length === 0, 'drainDecisions zwraca i czysci bufor');
  w.__civTest.debugOff();
  ok(w.__civAutoImproveDebug === undefined, 'debugOff zdejmuje flage');
}
ok(isCivTestEnabled('?civTest=1') && !isCivTestEnabled('?civTest=2'), 'isCivTestEnabled');

// --- picker: log + parytet wynikow -------------------------------------------
console.log('(C) log decyzji pickera: powod braku wycinki, wyniki bez zmian');
const FULL = ['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Górnictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Drogi brukowane', 'Matematyka', 'Obróbka kamienia', 'Kamieniarstwo'];
const W = 24, H = 24, CQ = 12, CR = 12;
function makeMap({ river = [], forest = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  for (const [q, r] of river) hexes[`${q},${r}`].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[`${q},${r}`].nakladka = 'las';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
const K = (q, r) => `${q},${r}`;
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 12 };
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 12, level: 1 }];
const FOREST = [[11, 11], [13, 11], [11, 13], [12, 13], [14, 12]];
const WORKED = new Set([[12, 12], ...FOREST].map(([q, r]) => K(q, r)));
function run(wolno, extra = {}) {
  return pickAutoImprovements({
    cities: [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }], ownerId: 0, map: makeMap({ forest: FOREST }), territoryNodes: TN,
    placedImprovements: new Map(), pracaAvailable: 5000, unlockedTechs: new Set(FULL), pracaSurplusThreshold: 30,
    skipWyrab: !wolno, demandDriven: true, resourceDeficitKeys: [], getFocus: () => 'zrownowazone', getOnlyWorked: () => true,
    getWorkedHexKeys: () => WORKED, pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3,
    foodImprovementStages: () => true, ...extra,
  });
}
for (const wolno of [false, true]) {
  const base = JSON.stringify(run(wolno));
  const events = [];
  const withCb = JSON.stringify(run(wolno, { onDecision: e => events.push(e) }));
  ok(base === withCb, `wolno=${wolno}: wyniki z onDecision == bez (${base.length} B)`);
  globalThis.__civAutoImproveDebug = () => {};
  const withFlag = JSON.stringify(run(wolno));
  delete globalThis.__civAutoImproveDebug;
  ok(base === withFlag, `wolno=${wolno}: wyniki z flaga globalna == bez`);
  const forest = events.filter(e => e.scope === 'las');
  ok(forest.length >= FOREST.length, `wolno=${wolno}: log obejmuje heksy lasu (zdarzen lasu: ${forest.length})`);
  if (!wolno) ok(forest.every(e => e.verdict === 'odrzucony' && e.reason === 'wycinka wylaczona'), 'wolno=OFF: KAZDY las odrzucony z powodem "wycinka wylaczona"');
  else ok(forest.every(e => e.reason.length > 0), 'wolno=ON: kazdy las ma powod: ' + [...new Set(forest.map(e => e.verdict + ':' + e.reason))].join(' | '));
}
// Spojnosc logu z realnym pickiem (zarzut Evaluatora #3): log to rekonstrukcja bramek, wiec sprawdzamy ZGODNOSC, nie zakladamy jej.
// Kazdy realny pick wycinki MUSI miec w logu werdykt 'wybrany' dla tego heksa (log nie moze byc ciasniejszy niz picker).
{
  for (const riverCase of [false, true]) {
    const mk = () => pickAutoImprovements({
      cities: [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }], ownerId: 0, map: makeMap({ forest: FOREST, river: riverCase ? [[10, 12], [10, 13], [10, 14]] : [] }), territoryNodes: TN,
      placedImprovements: new Map(), pracaAvailable: 5000, unlockedTechs: new Set(FULL), pracaSurplusThreshold: 30,
      skipWyrab: false, demandDriven: true, resourceDeficitKeys: [], getFocus: () => 'zrownowazone', getOnlyWorked: () => true,
      getWorkedHexKeys: () => WORKED, pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3, foodImprovementStages: () => true,
    });
    const evs = [];
    globalThis.__civAutoImproveDebug = e => evs.push(e);
    let res; try { res = mk(); } finally { delete globalThis.__civAutoImproveDebug; }
    const picks = (Array.isArray(res) ? res : (res.picks || [])).filter(p => (p.key || p.improvementKey || p.ulepszenie) === 'wyrab');
    const chosen = new Set(evs.filter(e => e.scope === 'las' && e.verdict === 'wybrany').map(e => e.hex));
    const missing = picks.filter(p => !chosen.has(K(p.q, p.r)));
    ok(missing.length === 0, `rzeka=${riverCase}: kazdy realny pick wyrab (${picks.length}) ma werdykt 'wybrany' w logu (brakuje: ${missing.length})`);
    ok(evs.some(e => e.scope === 'miasto' && e.detail && e.detail.rekonstrukcja === true), `rzeka=${riverCase}: log jawnie oznaczony jako rekonstrukcja`);
  }
}
{
  let calls = 0;
  const probe = () => { calls++; };
  run(true);
  ok(calls === 0, 'bez onDecision/flagi: callback nie jest wolany (domyslnie wylaczony)');
  const evs = [];
  run(false, { onDecision: e => { probe(); evs.push(e); } });
  ok(calls > 0 && evs.some(e => e.scope === 'miasto' && e.detail && e.detail.citySkipWyrab === true), 'zdarzenie miasta ujawnia citySkipWyrab=true');
}
console.log(`\nautoimprove-live-hooks-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
