'use strict';
/**
 * Diagnoza zywa — P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1, RUNDA 2 (Operator).
 * Rozszerza diag-znikoma.cjs (runda 1): TA SAMA sciezka A (decideAITurn -> RZECZYWISTY
 * planCityImprovements w ai.ts, bundlowany esbuildem z gra/src -- zero reimplementacji),
 * ale z dwoma dodatkami wymaganymi przez dispatch rundy 2:
 *   1) rozbicie zbudowanych ulepszen na kategorie ZYWNOSCIOWE / SUROWCOWE (wg
 *      bonus.zywnosc w gra/data/terrain-improvements.json, sprawdzone swiezo -- patrz
 *      FOOD_KEYS nizej, IDENTYCZNA lista jak AI_IMPROVEMENT_ZYWNOSCIOWE_KEYS w ai.ts),
 *   2) pomiar wykorzystania budzetu ulepszen (budgetA) per ture -- ile FAKTYCZNIE
 *      wydane vs ile przyznane, na sciezce A (onlyWorked=true PRZED fixem tej rundy,
 *      per-kategoria PO fixie -- ten sam skrypt uruchamiany PRZED i PO zmianie kodu w
 *      ai.ts, wynik porownany recznie w raporcie).
 * Uruchomienie: node diag-runda2.cjs   (env DIAG_SEED, DIAG_TURNS jak w rundzie 1)
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = '/home/user/wt-ai-ulepszenia-budowa/gra';
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = path.resolve(GRA_ROOT, 'src');
const ENTRY = path.resolve(__dirname, '.diag-runda2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.diag-runda2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export * as AUTO from ${JSON.stringify(SRC + '/game/auto-improvements')};
export * as CITIES from ${JSON.stringify(SRC + '/game/cities')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
export { cityTerritoryRadius } from ${JSON.stringify(SRC + '/map/territory')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(BUNDLE);
const { TerenBazowy } = M;
const AUTO = M.AUTO;
const C = M.CITIES;

// Zrodlo: gra/data/terrain-improvements.json, pole `bonus.zywnosc` (sprawdzone swiezo
// tego runu, node -e wypisujace .bonus kazdego klucza) -- IDENTYCZNA lista jak
// AI_IMPROVEMENT_ZYWNOSCIOWE_KEYS w ai.ts (patrz komentarz tam dla pelnego dowodu liczb).
const FOOD_KEYS = new Set([
  'farma', 'irygacja', 'bydlo', 'owce', 'lama', 'oboz_lowiecki', 'tarasy', 'lodzie_rybackie',
  'warzelnia_soli',
]);

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
]);

const SEED = Number(process.env.DIAG_SEED || 7);
const TURNS = Number(process.env.DIAG_TURNS || 150);
const N_CITIES = 4;
const POP_START = 3;
const POP_CAP = 22;
const POP_GROWTH_EVERY = 3;
const INCOME_BASE = 8;
const INCOME_PER_POP = 6;
const AI_BASELINE_PROCENT_BUDYNKI = C.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT; // = 50

// R-AI-011-STYL AI CYWILIZACJI ma okresowo niedobor surowca niezywnosciowego (np. przy
// rekrutacji) -- ZASADA 1 (demandDriven) otwiera wtedy pelna liste priorytetow. Bez
// zadnego niedoboru cala symulacja zostalaby zamknieta na samej zywnosci (jak dzis) i
// SUROWCOWA kategoria nigdy nie mialaby szansy sie ujawnic -- wiec harness wstrzykuje
// deterministyczny, cykliczny niedobor (co 5 tur) dokladnie tak jak main.ts wstrzykuje
// prawdziwy `resourceDeficitKeys`, zeby zmierzyc PRAWDZIWY efekt zmiany onlyWorked na
// SUROWCACH w warunkach, w ktorych silnik faktycznie je rozwaza (nie w warunkach, w
// ktorych z definicji ZASADA 1 je wyklucza).
function deficitKeysForTurn(t) {
  return (t % 5 === 0) ? ['zelazo', 'kamien', 'glina'] : [];
}

function pickCitySpots(map, n) {
  const keys = Object.keys(map.hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number); const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const scored = [];
  for (const k of keys) {
    const h = map.hexes[k];
    if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.PlytkieMorze) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
      if (Math.abs(dq + dr) > 3) continue;
      const nb = map.hexes[`${q + dq},${r + dr}`];
      if (nb && nb.terenBazowy !== TerenBazowy.Morze) land++;
    }
    scored.push({ q, r, land });
  }
  scored.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of scored) {
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 10)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

const map = M.generateMap(40, 32, SEED, 'kontynenty');
const spots = pickCitySpots(map, N_CITIES);
const OWNER = 1;
const cities = spots.map((s, i) => ({
  id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: POP_START,
}));

const placedA = new Map();
let poolA = 0;
let procentBudynki = AI_BASELINE_PROCENT_BUDYNKI;
let totalOrdersA = 0;
const builtByKey = {};
let budgetGrantedSum = 0, budgetSpentSum = 0, turnsWithBudget = 0;

for (let t = 0; t < TURNS; t++) {
  if (t > 0 && t % POP_GROWTH_EVERY === 0) {
    for (const c of cities) c.population = Math.min(POP_CAP, c.population + 1);
  }
  const territoryNodes = cities.map(c => ({ q: c.q, r: c.r, ownerId: OWNER, cityId: c.id, pop: c.population, level: 1 }));

  const poolShareFrac = C.procentPuliImperiumZBudynkow(procentBudynki) / 100;
  const income = cities.reduce((s, c) => s + INCOME_BASE + INCOME_PER_POP * c.population, 0);
  const toPool = income * poolShareFrac;
  poolA += toPool;

  const budgetA = Math.floor(poolA * C.DEFAULT_ULEPSZENIA_PRACA_PERCENT / 100);
  if (budgetA > 0) { budgetGrantedSum += budgetA; turnsWithBudget++; }

  const rep = AUTO.freshSurplusReport();
  const deficit = deficitKeysForTurn(t);
  const cmdsA = M.decideAITurn(OWNER, [], cities, map, {
    units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] },
  }, {
    civType: 'chinczycy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
    territoryNodes, placedImprovements: placedA, improvementTechs: TECHS,
    pracaAvailable: poolA, civEra: t < 25 ? 1 : (t < 60 ? 2 : 3),
    resourceDeficitKeys: deficit, improvementBudgetCap: budgetA, improvementSurplusReport: rep,
  }).filter(c => c.type === 'buildImprovement');

  let spentThisTurn = 0;
  for (const cmd of cmdsA) {
    const hk = `${cmd.q},${cmd.r}`;
    builtByKey[cmd.key] = (builtByKey[cmd.key] ?? 0) + 1;
    if (cmd.key === 'wyrab') { if (map.hexes[hk]) map.hexes[hk].nakladka = 0; continue; }
    const cur = placedA.get(hk); const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
    arr.push(cmd.key); placedA.set(hk, arr);
  }
  // Przyblizone zuzycie budzetu tej tury: budgetA - poolA_po (gorna granica, bo pula
  // dostaje TEZ naplyw w kolejnej turze -- do porownania PRZED/PO wystarcza spojna miara).
  if (cmdsA.length > 0) {
    const before = poolA;
    poolA = Math.max(0, poolA - Math.min(budgetA, poolA));
    spentThisTurn = before - poolA;
  }
  budgetSpentSum += Math.min(spentThisTurn, budgetA);
  totalOrdersA += cmdsA.length;

  if (rep.surplus) {
    procentBudynki = Math.min(C.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
      100 - C.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA);
  } else {
    procentBudynki = AI_BASELINE_PROCENT_BUDYNKI;
  }
}

let foodCount = 0, resourceCount = 0;
console.log(`# P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1 — diagnoza runda 2 (ziarno=${SEED} tur=${TURNS})`);
console.log('\n### Ulepszenia zbudowane, per klucz i kategoria:');
for (const [k, n] of Object.entries(builtByKey).sort((a, b) => b[1] - a[1])) {
  const cat = FOOD_KEYS.has(k) ? 'ZYWNOSC' : 'SUROWIEC/INFRA';
  if (FOOD_KEYS.has(k)) foodCount += n; else resourceCount += n;
  console.log(`  ${k.padEnd(20)} ${String(n).padStart(4)}  [${cat}]`);
}
console.log(`\n  SUMA ZYWNOSCIOWE=${foodCount}  SUROWCOWE/INFRA=${resourceCount}  RAZEM=${totalOrdersA}`);

console.log('\n### Wykorzystanie budzetu ulepszen (SCIEZKA A, onlyWorked wg biezacego kodu ai.ts):');
console.log(`  budzet przyznany (suma per ture, tury z budzetem>0): ${budgetGrantedSum.toFixed(0)} (${turnsWithBudget}/${TURNS} tur)`);
console.log(`  budzet faktycznie wydany (przyblizenie z ubytku puli): ${budgetSpentSum.toFixed(0)}`);
console.log(`  wykorzystanie = ${(100 * budgetSpentSum / Math.max(1, budgetGrantedSum)).toFixed(1)}%`);
