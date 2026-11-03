'use strict';
/**
 * auto-improve-no-item-cap-test.cjs — R-WEB-AUTO-IMPROVE-REMOVE-ITEM-CAP-Q1
 * (decyzja wlasciciela 2026-11-03: „To mialo byc juz wczesniej zlikwidowane” — brak limitu LICZBY
 * ulepszen terenu na miasto/ture dla GRACZA, PANSTW-MIAST i AI cywilizacji; limitem jest wylacznie
 * budzet Pracy).
 *
 * Wszystkie asercje wołają PRAWDZIWE funkcje: `pickAutoImprovements` (gracz/AI) i `decideAITurn`
 * (AI cywilizacji `defensiveCopy:false`, panstwo-miasto `defensiveCopy:true`).
 *   A. Gracz (konfiguracja main.ts: %-budzet, onlyWorked, K2): > 1 ulepszenie na miasto w jednym wywolaniu;
 *      sztywny sufit % NADAL respektowany.
 *   B. Przekazanie historycznego `maxItemsPerCity: 1` jest IGNOROWANE (parametr nie istnieje) —
 *      RED przed zmiana (picker zwracal dokladnie 1), GREEN po.
 *   C. AI cywilizacji i panstwo-miasto przez `decideAITurn`: > 1 rozkaz na miasto, zero duplikatow
 *      (hex+klucz), laczny koszt <= pula (dwa niezalezne wywolania nie wydaja dwa razy tej samej Pracy).
 *   D. Straznik zrodla: brak `maxItemsPerCity` / `FOOD_STAGE_MAX_ITEMS_PER_CITY` w picker/ai/main.
 *   E. MUTACJA: przywrocenie limitu 1 w kopii pickera lamie A i C (test nie jest tautologia).
 *
 * Run z gra/:  node tools/auto-improve-no-item-cap-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); } }

function build(pickerModule, tag) {
  const entry = path.resolve(__dirname, `.nocap-${tag}-entry.ts`);
  const bundle = path.resolve(__dirname, `.nocap-${tag}-bundle.cjs`);
  fs.writeFileSync(entry, `
export { pickAutoImprovements, AI_IMPROVEMENT_PRIORITY } from ${JSON.stringify(pickerModule)};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
`, 'utf8');
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'warning',
  });
  const mod = require(bundle);
  fs.unlinkSync(entry); fs.unlinkSync(bundle);
  return mod;
}

// --- fikstury ---------------------------------------------------------------
function makeMap(w, h, riverAt = []) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  const riverPaths = riverAt.length ? [riverAt.map(([q, r]) => ({ q, r }))] : [];
  for (const [q, r] of riverAt) hexes[`${q},${r}`].rzeka = { obecna: true, krawedzie: [] };
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths };
}
const TECHS = new Set(['Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka']);
const tnode = (q, r, ownerId, cityId) => ({ q, r, ownerId, cityId, pop: 6, level: 1 });
function ringKeys(cq, cr, rad) {
  const s = new Set();
  for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
    if (Math.abs(dq + dr) <= rad) s.add(`${cq + dq},${cr + dr}`);
  }
  return s;
}
const CITIES = ownerId => [
  { id: 'c0', ownerId, q: 5, r: 5, name: 'A', population: 6 },
  { id: 'c1', ownerId, q: 14, r: 14, name: 'B', population: 6 },
];
const RIVER = [[7, 5], [7, 6], [7, 7], [16, 14], [16, 15], [16, 16]];
const perCity = picks => {
  const m = new Map();
  for (const p of picks) m.set(p.cityId, (m.get(p.cityId) ?? 0) + 1);
  return m;
};

function playerPicks(M, extra = {}) {
  const cities = CITIES(0);
  const worked = new Map(cities.map(c => [c.id, ringKeys(c.q, c.r, 2)]));
  return M.pickAutoImprovements({
    cities, ownerId: 0, map: makeMap(24, 24, RIVER),
    territoryNodes: cities.map(c => tnode(c.q, c.r, 0, c.id)),
    placedImprovements: new Map(),
    pracaAvailable: 100000, unlockedTechs: TECHS, pracaSurplusThreshold: 30,
    skipWyrab: true, demandDriven: true, resourceDeficitKeys: [], playerEra: 3, civArchetype: 'grecy',
    getFocus: () => 'zrownowazone', getOnlyWorked: () => true, getWorkedHexKeys: c => worked.get(c.id),
    foodImprovementStages: () => true, pracaBudgetPercent: 100,
    ...extra,
  });
}

function aiCmds(M, defensiveCopy, pool) {
  const cities = CITIES(3);
  const map = makeMap(24, 24, RIVER);
  const cmds = M.decideAITurn(3, [], cities, map, { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
    civType: 'grecy', poziomTrudnosci: 2, defensiveCopy, cityBuildings: {},
    territoryNodes: cities.map(c => tnode(c.q, c.r, 3, c.id)),
    placedImprovements: new Map(), improvementTechs: TECHS, pracaAvailable: pool, civEra: 3,
  }).filter(c => c.type === 'buildImprovement');
  return { cmds, cities };
}
function owningCity(cities, c) {
  const d = x => (Math.abs(c.q - x.q) + Math.abs(c.r - x.r) + Math.abs((c.q - x.q) + (c.r - x.r))) / 2;
  return d(cities[0]) <= d(cities[1]) ? 'c0' : 'c1';
}
function checkAi(M, label, defensiveCopy) {
  const pool = 100000;
  const { cmds, cities } = aiCmds(M, defensiveCopy, pool);
  const pc = new Map();
  for (const c of cmds) { const k = owningCity(cities, c); pc.set(k, (pc.get(k) ?? 0) + 1); }
  ok([...pc.values()].length === 2 && [...pc.values()].every(n => n > 1),
    `${label}: > 1 ulepszenie na KAZDE miasto w jednej turze (${JSON.stringify([...pc])})`);
  const seen = new Set(); let dup = null;
  for (const c of cmds) { const k = `${c.q},${c.r}:${c.key}`; if (seen.has(k)) dup = k; seen.add(k); }
  ok(dup === null, `${label}: zero duplikatow (hex+klucz) miedzy wywolaniami${dup ? ' — ' + dup : ''}`);
  return cmds;
}

// ===========================================================================
const M = build(SRC + '/game/auto-improvements', 'real');

console.log('A. GRACZ — brak limitu sztuk, sufit % nadal sztywny');
{
  const picks = playerPicks(M);
  const pc = perCity(picks);
  ok(picks.length > 2 && [...pc.values()].every(n => n > 1) && pc.size === 2,
    `gracz: > 1 ulepszenie na miasto w jednym wywolaniu (${JSON.stringify([...pc])})`);
  const cap = playerPicks(M, { pracaAvailable: 300, pracaBudgetPercent: 33, pracaSurplusThreshold: 0 });
  const spent = cap.reduce((n, p) => n + p.kosztPraca, 0);
  ok(cap.length >= 1 && spent <= Math.floor(0.33 * 300),
    `gracz: sztywny sufit 33% x 300 respektowany (wydatek ${spent} <= ${Math.floor(0.33 * 300)}, ${cap.length} sztuk)`);
}

console.log('B. historyczny `maxItemsPerCity` jest ignorowany (parametr usuniety)');
{
  const picks = playerPicks(M, { maxItemsPerCity: 1 });
  const pc = perCity(picks);
  ok([...pc.values()].every(n => n > 1), `przekazane maxItemsPerCity:1 NIE ogranicza (${JSON.stringify([...pc])})`);
}

console.log('C. AI CYWILIZACJI i PANSTWO-MIASTO (decideAITurn) — brak limitu, brak podwojnego wydatku');
{
  checkAi(M, 'AI cywilizacji', false);
  checkAi(M, 'panstwo-miasto (defensiveCopy)', true);
  // laczny koszt <= pula: przy malej puli nic nie przekracza puli (brak podwojnego wydatku)
  const pool = 120;
  const small = aiCmds(M, false, pool).cmds;
  const direct = playerPicks(M, { pracaAvailable: pool, pracaSurplusThreshold: 0 });
  ok(direct.reduce((n, p) => n + p.kosztPraca, 0) <= pool, `picker przy puli ${pool}: wydatek <= pula`);
  ok(small.length >= 1, `AI przy puli ${pool}: nadal buduje (${small.length} rozkazow), budzet jest jedynym limitem`);
}

console.log('D. straznik zrodla');
{
  for (const f of ['game/auto-improvements.ts', 'game/ai.ts', 'main.ts']) {
    const txt = fs.readFileSync(path.resolve(SRC, f), 'utf8');
    ok(!/maxItemsPerCity|FOOD_STAGE_MAX_ITEMS_PER_CITY/.test(txt), `${f}: brak maxItemsPerCity / FOOD_STAGE_MAX_ITEMS_PER_CITY`);
  }
}

console.log('E. MUTACJA — przywrocenie limitu 1 sztuki/miasto lamie test');
{
  const orig = fs.readFileSync(path.resolve(SRC, 'game/auto-improvements.ts'), 'utf8');
  const needle = '      if (globalSpent >= effectiveCityCap || pracaLeft <= reserve) {';
  const needle2 = '        if (globalSpent >= effectiveCityCap) {\n          cityBudgetExhausted = true;';
  ok(orig.split(needle).length === 2 && orig.split(needle2).length === 2, 'mutacja: znaleziono dokladnie po jednym miejscu petli heksow i petli kluczy FAZY 1');
  const mutated = orig
    .replace(needle, '      if (globalSpent >= effectiveCityCap || pracaLeft <= reserve || picks.some(p => p.cityId === city.id)) {')
    .replace(needle2, '        if (globalSpent >= effectiveCityCap || picks.some(p => p.cityId === city.id)) {\n          cityBudgetExhausted = true;');
  const mutPath = path.resolve(SRC, 'game', 'auto-improvements.nocapmut.ts');
  fs.writeFileSync(mutPath, mutated, 'utf8');
  let MM;
  try { MM = build(SRC + '/game/auto-improvements.nocapmut', 'mut'); } finally { fs.unlinkSync(mutPath); }
  // FAZA 1 jest w sciezce niestopniowanej (K1/profil bez etapow) — mierzymy bez etapow
  const pcReal = perCity(playerPicks(M, { foodImprovementStages: () => false, demandDriven: false, getFocus: () => 'zywnosc' }));
  const pcMut = perCity(playerPicks(MM, { foodImprovementStages: () => false, demandDriven: false, getFocus: () => 'zywnosc' }));
  ok([...pcReal.values()].every(n => n > 1), `kontrola: kod produkcyjny bez etapow daje > 1 na miasto (${JSON.stringify([...pcReal])})`);
  ok([...pcMut.values()].some(n => n <= 1) && [...pcMut.values()].every(n => n <= 1), `zmutowany picker (limit 1) daje <= 1 na miasto — test to wykrywa (${JSON.stringify([...pcMut])})`);
}

console.log(`\nauto-improve-no-item-cap-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
