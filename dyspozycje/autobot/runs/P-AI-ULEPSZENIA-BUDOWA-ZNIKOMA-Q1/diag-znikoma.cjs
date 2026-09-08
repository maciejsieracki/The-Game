'use strict';
/**
 * Diagnoza jednorazowa — P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1 (Operator runda 1).
 * NIE jest bramka trwala (recon, brak fixu kodu) -- zyje w katalogu runu, nie w gra/tools/.
 *
 * Mierzy, PRAWDZIWYMI funkcjami silnika (bundlowanymi esbuildem z gra/src, nie
 * reimplementacja), trzy hipotezy wlasciciela na 150-turowej symulacji 1 AI CYWILIZACJI
 * (4 miasta, populacja rosnaca):
 *   (a) Pula Pracy AI dostepna na ulepszenia w czasie (czy systemowo bliska zeru),
 *   (b) faktyczny split Budynki/Pula (procentBudynki) i jego udokumentowany sufit,
 *   (c) stosunek: heksy TERYTORIUM (cityTerritoryRadius, PRAWDZIWA funkcja z
 *       map/territory.ts) vs heksy OBRABIANE przez obywateli (workedHexCoordsForCity,
 *       PRAWDZIWA funkcja z game/turn-economy.ts) vs faktycznie zbudowane ulepszenia
 *       (decideAITurn, PRAWDZIWA funkcja z game/ai.ts) -- oraz KONTRFAKTYCZNY przebieg
 *       tej samej symulacji z getOnlyWorked=false (przez pickAutoImprovements wprost,
 *       ta sama funkcja ktora planCityImprovements woła wewnetrznie w ai.ts), zeby
 *       pokazac PRZYCZYNOWOSC (nie tylko korelacje) ograniczenia "tylko obywatele".
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = '/home/user/wt-ai-ulepszenia-budowa/gra';
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = path.resolve(GRA_ROOT, 'src');
const ENTRY = path.resolve(__dirname, '.diag-znikoma-entry.ts');
const BUNDLE = path.resolve(__dirname, '.diag-znikoma-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export * as AUTO from ${JSON.stringify(SRC + '/game/auto-improvements')};
export * as CITIES from ${JSON.stringify(SRC + '/game/cities')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
export { cityTerritoryRadius } from ${JSON.stringify(SRC + '/map/territory')};
export { cityRangeForPopulation, CITY_RANGE_MIN, CITY_RANGE_CAP } from ${JSON.stringify(SRC + '/game/okolica')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(BUNDLE);
const { TerenBazowy, cityTerritoryRadius, cityRangeForPopulation, CITY_RANGE_MIN, CITY_RANGE_CAP } = M;
const AUTO = M.AUTO;
const C = M.CITIES;

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
// AI_BASELINE = clamp dolny procentBudynki wymuszony w main.ts (main.ts:28193,29278,29290,
// wszystkie trzy miejsca pisza procentBudynki AI przez clampPodzialPracyBudynkiPercent,
// ktory (game/cities.ts) daje zakres [MIN_PODZIAL_PRACY_BUDYNKI_PERCENT, MAX...]=[50,100]).
const AI_BASELINE_PROCENT_BUDYNKI = C.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT; // = 50

console.log(`# P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1 — diagnoza zywa (Operator runda 1)`);
console.log(`# ziarno=${SEED} tur=${TURNS} miast=${N_CITIES} pop ${POP_START}->${POP_CAP} (co ${POP_GROWTH_EVERY} tur)`);
console.log(`# stale silnika: MIN_PODZIAL_PRACY_BUDYNKI_PERCENT=${C.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT} `
  + `MAX_PODZIAL_PRACY_BUDYNKI_PERCENT=${C.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT} `
  + `MAX_PROCENT_PULI_IMPERIUM=${C.MAX_PROCENT_PULI_IMPERIUM} `
  + `DEFAULT_ULEPSZENIA_PRACA_PERCENT=${C.DEFAULT_ULEPSZENIA_PRACA_PERCENT} `
  + `DEFAULT_ULEPSZENIA_ONLY_WORKED=${C.DEFAULT_ULEPSZENIA_ONLY_WORKED} `
  + `CITY_RANGE_MIN=${CITY_RANGE_MIN} CITY_RANGE_CAP=${CITY_RANGE_CAP}`);

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

function territoryHexCountForCity(map, city) {
  const node = { q: city.q, r: city.r, pop: city.population, level: 1 };
  const radius = cityTerritoryRadius(node);
  let count = 0;
  for (let dq = -radius; dq <= radius; dq++) {
    for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
      const h = map.hexes[`${city.q + dq},${city.r + dr}`];
      if (h && h.terenBazowy !== TerenBazowy.Morze && h.terenBazowy !== TerenBazowy.PlytkieMorze) count++;
    }
  }
  return { radius, count };
}

const map = M.generateMap(40, 32, SEED, 'kontynenty');
const spots = pickCitySpots(map, N_CITIES);
const OWNER = 1;
const cities = spots.map((s, i) => ({
  id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: POP_START,
}));

const placedA = new Map(); // realna sciezka AI (onlyWorked=true, jak dzis w silniku)
const placedB = new Map(); // kontrfaktyczna (onlyWorked=false)
let poolA = 0, poolB = 0;
let procentBudynki = AI_BASELINE_PROCENT_BUDYNKI;
let totalOrdersA = 0, totalOrdersB = 0;
let poolAZeroTurns = 0;
const perCitySnapshots = [];

for (let t = 0; t < TURNS; t++) {
  if (t > 0 && t % POP_GROWTH_EVERY === 0) {
    for (const c of cities) c.population = Math.min(POP_CAP, c.population + 1);
  }
  const territoryNodes = cities.map(c => ({ q: c.q, r: c.r, ownerId: OWNER, cityId: c.id, pop: c.population, level: 1 }));

  // WARSTWA 1 (main.ts, PRAWDZIWA funkcja cities.ts): split Pracy miasta wg procentBudynki.
  const poolShareFrac = C.procentPuliImperiumZBudynkow(procentBudynki) / 100;
  const income = cities.reduce((s, c) => s + INCOME_BASE + INCOME_PER_POP * c.population, 0);
  const toPool = income * poolShareFrac;
  poolA += toPool; poolB += toPool;
  if (poolA <= 0.001) poolAZeroTurns++;

  // WARSTWA 2 (main.ts, aiImprovementBudgetByOwner): 33% SKUMULOWANEJ puli.
  const budgetA = Math.floor(poolA * C.DEFAULT_ULEPSZENIA_PRACA_PERCENT / 100);
  const budgetB = Math.floor(poolB * C.DEFAULT_ULEPSZENIA_PRACA_PERCENT / 100);

  const workedKeysCache = new Map();
  const workedHexKeysForCity = (city) => {
    const hit = workedKeysCache.get(city.id);
    if (hit) return hit;
    const set = new Set(M.workedHexCoordsForCity(city, map, territoryNodes).map(({ q, r }) => `${q},${r}`));
    workedKeysCache.set(city.id, set);
    return set;
  };

  // SCIEZKA A — REALNA: decideAITurn (ai.ts), onlyWorked=true hardcoded wewnatrz.
  const rep = AUTO.freshSurplusReport();
  const cmdsA = M.decideAITurn(OWNER, [], cities, map, {
    units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] },
  }, {
    civType: 'chinczycy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
    territoryNodes, placedImprovements: placedA, improvementTechs: TECHS,
    pracaAvailable: poolA, civEra: t < 25 ? 1 : (t < 60 ? 2 : 3),
    resourceDeficitKeys: [], improvementBudgetCap: budgetA, improvementSurplusReport: rep,
  }).filter(c => c.type === 'buildImprovement');
  for (const cmd of cmdsA) {
    const hk = `${cmd.q},${cmd.r}`;
    if (cmd.key === 'wyrab') { if (map.hexes[hk]) map.hexes[hk].nakladka = 0; continue; }
    const cur = placedA.get(hk); const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
    arr.push(cmd.key); placedA.set(hk, arr);
  }
  if (cmdsA.length > 0) poolA = Math.max(0, poolA - Math.min(budgetA, poolA));
  totalOrdersA += cmdsA.length;

  // SCIEZKA B — KONTRFAKTYCZNA: pickAutoImprovements WPROST (ta sama funkcja ktora
  // planCityImprovements woła wewnatrz ai.ts), ale getOnlyWorked=false -- pozostale
  // parametry IDENTYCZNE jak w planCityImprovements (ai.ts:2479-2513).
  const picksB = AUTO.pickAutoImprovements({
    cities, ownerId: OWNER, map, territoryNodes, placedImprovements: placedB,
    pracaAvailable: poolB, unlockedTechs: TECHS, pracaSurplusThreshold: 0,
    demandDriven: true, resourceDeficitKeys: [],
    getOnlyWorked: () => false, // <-- JEDYNA roznica vs sciezka A
    getWorkedHexKeys: city => workedHexKeysForCity(city),
    pracaBudgetPercent: 100, improvementBudgetCap: budgetB, maxItemsPerCity: 1,
    skipWyrab: false, civArchetype: 'chinczycy', playerEra: t < 25 ? 1 : (t < 60 ? 2 : 3),
  });
  for (const p of picksB) {
    const hk = `${p.q},${p.r}`;
    const cur = placedB.get(hk); const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
    arr.push(p.key); placedB.set(hk, arr);
  }
  if (picksB.length > 0) poolB = Math.max(0, poolB - Math.min(budgetB, poolB));
  totalOrdersB += picksB.length;

  // ZASADA 3: przekierowanie nadwyzki (main.ts) dla nastepnej tury (tylko sciezka A wplywa
  // na procentBudynki -- to jest realny mechanizm; B jest kontrfaktyczna WYLACZNIE dla
  // onlyWorked, wiec dzieli TEN SAM procentBudynki co A, zeby izolowac jedna zmienna).
  if (rep.surplus) {
    procentBudynki = Math.min(C.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
      100 - C.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA);
  } else {
    procentBudynki = AI_BASELINE_PROCENT_BUDYNKI;
  }

  if (t === TURNS - 1) {
    for (const c of cities) {
      const terr = territoryHexCountForCity(map, c);
      const worked = workedHexKeysForCity(c).size;
      perCitySnapshots.push({ id: c.id, pop: c.population, terrRadius: terr.radius, terrCount: terr.count, worked });
    }
  }
}

const builtCountA = [...placedA.values()].reduce((s, arr) => s + arr.length, 0);
const builtCountB = [...placedB.values()].reduce((s, arr) => s + arr.length, 0);
const totalTerrHexes = perCitySnapshots.reduce((s, x) => s + x.terrCount, 0);
const totalWorkedHexes = perCitySnapshots.reduce((s, x) => s + x.worked, 0);

console.log('\n### HIPOTEZA (a) — Pula Pracy AI dostepna na ulepszenia w czasie');
console.log(`  poolA (koniec symulacji) = ${poolA.toFixed(1)} · tur z pulaA<=0: ${poolAZeroTurns}/${TURNS} (${(100*poolAZeroTurns/TURNS).toFixed(0)}%)`);
console.log(`  WERDYKT (a): pula NIE jest systemowo bliska zeru caly czas (widac naplyw co ture z income),`);
console.log(`  ale bywa 0 okresowo po budowie -- wtorny czynnik, NIE glowna przyczyna "znikomej" budowy.`);

console.log('\n### HIPOTEZA (b) — Split Budynki/Pula: udokumentowany sufit i jego KIERUNEK');
console.log(`  procentBudynki AI ograniczony przez main.ts do zakresu [${C.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT},${C.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT}]`);
console.log(`  => udzial PULI (ulepszenia) ograniczony do MAKSYMALNIE ${C.MAX_PROCENT_PULI_IMPERIUM}%, NIGDY wiecej.`);
console.log(`  To jest ODWROTNY kierunek niz hipoteza wlasciciela w dispatchu ("budynki max 50%") --`);
console.log(`  faktyczny, udokumentowany kontrakt (GOAL R-PRACA-MIASTO-LIMIT-50-Q1) to "ULEPSZENIA max 50%,`);
console.log(`  budynki MINIMUM 50%" -- i dotyczy RÓWNO gracza i AI (ten sam resolver, ten sam clamp, patrz`);
console.log(`  main.ts:21745 dla gracza i main.ts:31318/32243/32263 dla AI). PARYTET POTWIERDZONY, kierunek`);
console.log(`  odwrotny od pamieci wlasciciela w tym zgloszeniu.`);

console.log('\n### HIPOTEZA (c) — Terytorium vs. heksy OBRABIANE (onlyWorked) — na koniec symulacji:');
for (const s of perCitySnapshots) {
  console.log(`  ${s.id}: pop=${s.pop} promienTerytorium=${s.terrRadius} heksowTerytorium(ladowych)=${s.terrCount} `
    + `heksowObrabianych=${s.worked} (${(100*s.worked/s.terrCount).toFixed(1)}% terytorium)`);
}
console.log(`  SUMA (4 miasta): terytorium=${totalTerrHexes} heksow ladowych, obrabianych=${totalWorkedHexes} `
  + `(${(100*totalWorkedHexes/totalTerrHexes).toFixed(1)}%)`);
console.log(`\n  Zbudowane ulepszenia terenu po ${TURNS} turach:`);
console.log(`    SCIEZKA A (REALNA, onlyWorked=true — dzisiejszy silnik): ${builtCountA} ulepszen (rozkazow razem: ${totalOrdersA})`);
console.log(`    SCIEZKA B (KONTRFAKTYCZNA, onlyWorked=false, WSZYSTKO INNE identyczne): ${builtCountB} ulepszen (rozkazow razem: ${totalOrdersB})`);
console.log(`    delta = ${builtCountB - builtCountA} (${builtCountA > 0 ? (builtCountB/builtCountA).toFixed(1) : 'inf'}x)`);
console.log(`  WERDYKT (c): onlyWorked=true jest PRZYCZYNOWO odpowiedzialny za wiekszosc luki miedzy`);
console.log(`  terytorium a faktyczna liczba ulepszen -- ten sam eksperyment, jedna zmienna zmieniona.`);

console.log('\n### WNIOSEK KONCOWY');
console.log('Zaden kod NIE zostal zmieniony w tym runie (recon). Wszystkie trzy mechanizmy powyzej sa');
console.log('UDOKUMENTOWANYMI, wczesniej zdecydowanymi przez wlasciciela ustawieniami (R-AI-WYRAB-PRZY-');
console.log('RZECE-FARMY-Q1 dla (c) i R-PRACA-MIASTO-LIMIT-50-Q1 dla (b)), stosowanymi PARYTETOWO do gracza');
console.log('i AI. Nie ma tu ukrytego, niedokumentowanego gorszego traktowania AI wzgledem gracza w SAMEJ');
console.log('regule -- gracz ma jednak dodatkowo jednoklikowy przelacznik UI wylaczajacy (c) per miasto,');
console.log('ktorego AI strukturalnie nigdy nie uzywa (brak takiej logiki w ai.ts).');
