'use strict';
/**
 * deficit-mine-cap-test.cjs — R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1 (przeciek Rudy miedzi).
 *
 * Pomiar w pełnej grze (copper-income-audit-measure.cjs, 3 ziarna): przy niedoborze `ruda` krok
 * „brakujący surowiec” pickera stawiał Kopalnię miedzi na WSZYSTKICH złożach naraz (np. 5→47, 5→63
 * kopalń w jednej turze), a te kopalnie (20×1,5^(epoka−1) Rudy/turę każda) produkowały dziesiątki
 * tysięcy Rudy (25 075 / 29 085 szt. ~20 tur po wejściu w Brąz).
 *
 * Test woła PRAWDZIWE funkcje: `pickAutoImprovements` (K2 gracz „zrównoważone”) i `decideAITurn`
 * (K3 AI cywilizacji) na mapie z 14 wzgórzami ze złożem miedzi w terytorium:
 *   A. niedobór `ruda` → najwyżej DEFICIT_MINE_PICKS_PER_KEY_PER_TURN (=1) Kopalnia miedzi na turę (gracz i AI);
 *   B. brak niedoboru → 0 kopalń (zasada „nie na zapas” bez zmian);
 *   C. symulacja 6 tur z utrzymanym niedoborem → kopalnie przybywają stopniowo (1/turę), nie skokiem;
 *   D. MUTACJA: limit = Infinity w kopii pickera → A i C czerwone (test nie jest tautologią).
 * Run z gra/:  node tools/deficit-mine-cap-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); } }

function build(pickerModule, tag) {
  const entry = path.resolve(__dirname, `.minecap-${tag}-entry.ts`);
  const bundle = path.resolve(__dirname, `.minecap-${tag}-bundle.cjs`);
  fs.writeFileSync(entry, `
export { pickAutoImprovements, DEFICIT_MINE_PICKS_PER_KEY_PER_TURN } from ${JSON.stringify(pickerModule)};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
`, 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'warning',
    });
    return require(bundle);
  } finally {
    try { fs.unlinkSync(entry); } catch (_) { /* */ }
    try { fs.unlinkSync(bundle); } catch (_) { /* */ }
  }
}

const TECHS = new Set(['Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka']);
const tnode = (q, r, ownerId, cityId) => ({ q, r, ownerId, cityId, pop: 6, level: 1 });
const CITIES = ownerId => [
  { id: 'c0', ownerId, q: 5, r: 5, name: 'A', population: 6 },
  { id: 'c1', ownerId, q: 14, r: 14, name: 'B', population: 6 },
];
/** 14 wzgórz ze złożem miedzi w promieniu 1–2 od miast (wszystkie w terytorium). */
const COPPER = [[4, 5], [6, 5], [5, 4], [5, 6], [4, 6], [6, 4], [3, 5],
  [13, 14], [15, 14], [14, 13], [14, 15], [13, 15], [15, 13], [12, 14]];
function makeMap() {
  const hexes = {};
  for (let q = 0; q < 24; q++) for (let r = 0; r < 24; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of COPPER) Object.assign(hexes[`${q},${r}`], { terenBazowy: 'wzgorza', zloze: 'miedz', zlozeMinEra: 2 });
  return { szerokoscQ: 24, wysokoscR: 24, hexes, seed: 1, riverPaths: [] };
}
const mines = picks => picks.filter(p => p.key === 'kopalnia_miedzi').length;

function playerPicks(M, deficit, placed = new Map(), map = makeMap()) {
  const cities = CITIES(0);
  return M.pickAutoImprovements({
    cities, ownerId: 0, map,
    territoryNodes: cities.map(c => tnode(c.q, c.r, 0, c.id)),
    placedImprovements: placed,
    pracaAvailable: 100000, unlockedTechs: TECHS, pracaSurplusThreshold: 30,
    skipWyrab: true, demandDriven: true, resourceDeficitKeys: deficit, playerEra: 2, civArchetype: 'grecy',
    getFocus: () => 'zrownowazone', getOnlyWorked: () => true, getWorkedHexKeys: () => new Set(),
    foodImprovementStages: () => true, pracaBudgetPercent: 100,
  });
}
function aiMineCmds(M, deficit) {
  const cities = CITIES(3);
  return M.decideAITurn(3, [], cities, makeMap(), { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
    civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
    territoryNodes: cities.map(c => tnode(c.q, c.r, 3, c.id)),
    placedImprovements: new Map(), improvementTechs: TECHS, pracaAvailable: 100000, civEra: 2,
    resourceDeficitKeys: deficit,
  }).filter(c => c.type === 'buildImprovement' && c.key === 'kopalnia_miedzi').length;
}
function simulate(M, turns) {
  const map = makeMap();
  const placed = new Map();
  const perTurn = [];
  for (let t = 0; t < turns; t++) {
    const picks = playerPicks(M, ['ruda'], placed, map);
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    perTurn.push(mines(picks));
  }
  return perTurn;
}

const M = build(SRC + '/game/auto-improvements', 'real');
const CAP = M.DEFICIT_MINE_PICKS_PER_KEY_PER_TURN;
ok(CAP === 1, `stała DEFICIT_MINE_PICKS_PER_KEY_PER_TURN = ${CAP}`);

console.log('A. niedobór Rudy miedzi → najwyżej 1 kopalnia na turę');
const pA = mines(playerPicks(M, ['ruda']));
ok(pA >= 1 && pA <= CAP, `[K2 gracz] kopalnie miedzi w 1 turze = ${pA} (14 złóż dostępnych)`);
const aA = aiMineCmds(M, ['ruda']);
ok(aA >= 1 && aA <= CAP, `[K3 AI] kopalnie miedzi w 1 turze = ${aA} (14 złóż dostępnych)`);

console.log('B. brak niedoboru → 0 kopalń (bez zmian)');
ok(mines(playerPicks(M, [])) === 0, '[K2] brak niedoboru: 0 kopalń miedzi');
ok(aiMineCmds(M, []) === 0, '[K3] brak niedoboru: 0 kopalń miedzi');

console.log('C. utrzymany niedobór przez 6 tur → przyrost stopniowy');
const sim = simulate(M, 6);
ok(sim.every(n => n <= CAP) && sim.reduce((a, b) => a + b, 0) === 6, `kopalnie/turę: ${sim.join(',')} (oczekiwane 1×6)`);

console.log('D. MUTACJA: brak limitu (Infinity) → A i C czerwone');
{
  const orig = fs.readFileSync(path.resolve(SRC, 'game/auto-improvements.ts'), 'utf8');
  const needle = 'export const DEFICIT_MINE_PICKS_PER_KEY_PER_TURN = 1;';
  ok(orig.split(needle).length === 2, 'mutacja: znaleziono dokładnie jedną definicję limitu');
  const mutPath = path.resolve(SRC, 'game', 'auto-improvements.minecapmut.ts');
  fs.writeFileSync(mutPath, orig.replace(needle, 'export const DEFICIT_MINE_PICKS_PER_KEY_PER_TURN = Infinity;'));
  try {
    const MM = build(mutPath.replace(/\.ts$/, ''), 'mut');
    const mA = mines(playerPicks(MM, ['ruda']));
    ok(mA > 1, `mutacja: [K2] w 1 turze ${mA} kopalń (> 1 — skok jak w pomiarze)`);
    const mSim = simulate(MM, 6);
    ok(mSim[0] > 1, `mutacja: symulacja ${mSim.join(',')} — wszystkie złoża w 1. turze`);
  } finally {
    fs.unlinkSync(mutPath);
  }
}

console.log(`\ndeficit-mine-cap-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
