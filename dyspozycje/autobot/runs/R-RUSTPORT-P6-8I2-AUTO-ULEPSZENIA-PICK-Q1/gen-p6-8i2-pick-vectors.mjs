// P6.8I2: generator wektorow `pickAutoImprovements` z URUCHOMIONEGO weba (pin 91dc998a).
// Wola PRAWDZIWA funkcje pickera z pina (loader-pin.mjs: transpilacja TS->CJS w pamieci z `git show`,
// bez buildu gra/). Zapisuje wejscia + wyjscia do rust-port/engine/tests/p6_8i2_vectors/pick.json.
// Uruchomienie (z katalogu tej partii, w worktree):
//   NODE_PATH=/opt/node22/lib/node_modules node gen-p6-8i2-pick-vectors.mjs
// Losowanie: Mulberry32 o stalym ziarnie (deterministyczne). NaN/Infinity kodowane jako stringi.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPin, PIN } from './loader-pin.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();

const picker = loadPin('gra/src/game/auto-improvements.ts');
const hexTypes = loadPin('gra/src/types/hex.ts');
const { TerenBazowy, Nakladka } = hexTypes;
const { pickAutoImprovements, AI_IMPROVEMENT_PRIORITY } = picker;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x50495832);
const int = (n) => Math.floor(rnd() * n);
const pick = (a) => a[int(a.length)];
const chance = (p) => rnd() < p;
const subset = (a, p) => a.filter(() => chance(p));

const TERENY = Object.values(TerenBazowy);
const NAKLADKI = Object.values(Nakladka);
const ZLOZA = [undefined, undefined, undefined, 'miedz', 'zelazo', 'zloto', 'cyna', 'sol', 'glina', 'ruda', 'wegiel', 'inne'];
const ULEPSZENIE_VALUES = [undefined, undefined, 'brak', 'farma', 'droga', 'tartak', 'irygacja', 'xyz', ''];
const CIVS = [undefined, null, '', 'inkowie', 'AZTEK', 'rzymianie', 'chinczycy', 'chiny'];
const TECHS = ['Rolnictwo', 'Irygacja', 'Gospodarka wodna', 'Oswojenie zwierząt', 'Jeździectwo', 'Garncarstwo', 'Murarstwo',
  'Łowiectwo', 'Obróbka drewna', 'Żegluga', 'Wojskowość', 'Koło', 'Drogi brukowane', 'Brązownictwo', 'Hutnictwo żelaza', 'Waluta', 'Matematyka'];
const FOCUSES = ['zywnosc', 'surowce', 'infrastruktura', 'zrownowazone', undefined];
const DEFICITS = [[], ['zywnosc'], ['drewno'], ['kamien'], ['zywnosc', 'kamien'], ['zelazo']];
const LAYER_POOL = ['farma', 'droga', '', 'tartak', ' FARMA ', 'brak', 'oboz_lowiecki', 'posterunek', 'fort', 'wyrab', 'bydlo', 'kopalnia_miedzi'];

// Kodowanie do JSON: undefined -> null (pole nieobecne), NaN/Infinity -> string.
const enc = (x) => {
  if (x === undefined) return null;
  if (typeof x === 'number') {
    if (Number.isNaN(x)) return 'NaN';
    if (x === Infinity) return 'Infinity';
    if (x === -Infinity) return '-Infinity';
  }
  return x;
};
const u = (x) => (x === undefined ? null : x);

function randTerrain() {
  const x = rnd();
  if (x < 0.25) return TerenBazowy.Laka;
  if (x < 0.45) return TerenBazowy.Rownina;
  if (x < 0.62) return TerenBazowy.Wzgorza;
  if (x < 0.70) return TerenBazowy.Gory;
  if (x < 0.78) return TerenBazowy.Pustynia;
  if (x < 0.84) return TerenBazowy.PlytkieMorze;
  if (x < 0.90) return TerenBazowy.Morze;
  return pick(TERENY);
}
function randNakladka(forest) {
  if (forest) return chance(0.6) ? Nakladka.Las : pick(NAKLADKI);
  const x = rnd();
  if (x < 0.45) return Nakladka.Brak;
  if (x < 0.7) return Nakladka.Las;
  return pick(NAKLADKI);
}

function buildScenario(mode) {
  const radius = 2 + int(4);
  const forest = mode === 'forest' || chance(0.35);
  const hexes = [];
  const hexMap = {};
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      if (chance(0.05)) continue;
      const nak = randNakladka(forest);
      const h = {
        coords: { q, r }, terenBazowy: forest && chance(0.4) ? pick([TerenBazowy.Gory, TerenBazowy.Morze, TerenBazowy.PlytkieMorze]) : randTerrain(),
        nakladka: nak, wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: chance(0.2), krawedzie: [] },
      };
      if (chance(0.3)) h.ulepszenie = pick(ULEPSZENIE_VALUES.filter((x) => x !== undefined));
      else if (chance(0.7)) h.ulepszenie = 'brak';
      if (chance(0.2)) h.ulepszenia = subset(LAYER_POOL, 0.2);
      const z = pick(ZLOZA);
      if (z !== undefined) h.zloze = z;
      hexMap[`${q},${r}`] = h;
      hexes.push(h);
    }
  }
  const keysAll = Object.keys(hexMap);
  const riverPaths = [];
  for (let i = 0, n = int(3); i < n; i++) {
    const path = [];
    let q = int(2 * radius + 1) - radius, r = int(2 * radius + 1) - radius;
    for (let s = 0; s < 3 + int(5); s++) { path.push({ q, r }); q += int(3) - 1; r += int(3) - 1; }
    riverPaths.push(path);
  }
  // Rzeki w mapie: tylko te, ktorych heksy istnieja (jak w grze); czesc heksow ma `rzeka.obecna`.
  // Miasta: 1-3, rozne id w losowej kolejnosci (test sortowania po id).
  const cityCount = mode === 'nocity' ? 0 : 1 + int(3);
  const cities = [];
  for (let i = 0; i < cityCount; i++) {
    cities.push({
      id: `m${pick(['a', 'b', 'c', 'd', 'e'])}${int(9)}`,
      ownerId: chance(0.8) ? 0 : 1,
      q: int(5) - 2, r: int(5) - 2,
      population: pick([0, 1, 2, 3, 4, 5, 7, 9, 12, 16, 20]),
      ulepszeniaFocus: pick(FOCUSES),
      ulepszeniaOnlyWorked: chance(0.3) ? chance(0.6) : undefined,
      surowce: chance(0.25) ? { kon: pick([0, 10, 49, 50, 51, 120]) } : undefined,
    });
  }
  // Unikalne id (klucze map per miasto).
  const seen = new Set();
  for (const c of cities) { while (seen.has(c.id)) c.id += 'x'; seen.add(c.id); }

  const territoryNodes = chance(0.2) ? undefined : [
    ...cities.filter(() => chance(0.85)).map((c) => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: c.ownerId })),
    ...Array.from({ length: int(3) }, () => ({ q: int(7) - 3, r: int(7) - 3, pop: pick([1, 3, 5, 8, 11]), level: 1, ownerId: pick([1, 2]),
      ...(chance(0.15) ? { isFort: true } : chance(0.1) ? { isOutpost: true } : {}) })),
  ];

  const placed = chance(0.5) ? null : {};
  if (placed) {
    for (const key of subset(keysAll, 0.2)) {
      placed[key] = chance(0.55) ? pick(['farma', 'droga', '', 'tartak', 'oboz_lowiecki', 'posterunek', 'wyrab']) : subset(LAYER_POOL, 0.3);
    }
  }
  const researched = chance(0.3) ? TECHS : subset(TECHS, chance(0.5) ? 0.9 : 0.35);

  const pracaAvailable = chance(0.04) ? NaN : pick([0, 5, 25, 30, 31, 60, 120, 300, 600, 2000, 17.5]);
  const scenario = {
    hexes: hexes.map((h) => ({
      q: h.coords.q, r: h.coords.r, teren: h.terenBazowy, nakladka: h.nakladka,
      ulepszenie: u(h.ulepszenie), ulepszenia: u(h.ulepszenia), zloze: u(h.zloze), rzeka: h.rzeka.obecna,
    })),
    riverPaths: riverPaths.map((p) => p.map(({ q, r }) => [q, r])),
    cities: cities.map((c) => ({ id: c.id, ownerId: c.ownerId, q: c.q, r: c.r, population: c.population,
      focus: u(c.ulepszeniaFocus), onlyWorked: u(c.ulepszeniaOnlyWorked), surowceKon: c.surowce ? enc(c.surowce.kon) : null })),
    territoryNodes: territoryNodes === undefined ? null : territoryNodes.map((n) => ({ q: n.q, r: n.r, pop: n.pop, isOutpost: u(n.isOutpost), isFort: u(n.isFort), ownerId: n.ownerId })),
    placedImprovements: placed,
    researchedTechs: researched,
    pracaAvailable: enc(pracaAvailable),
    pracaBudgetPercent: chance(0.5) ? null : enc(pick([0, 20, 33, 50, 80, 100, 150, -5])),
    cityPracaBudgetPercent: null,
    improvementBudgetCap: chance(0.7) ? null : enc(pick([0, 10, 40, 150, 500])),
    maxItemsPerCity: chance(0.4) ? null : pick([1, 2, 3, 'Infinity']),
    pracaSurplusThreshold: chance(0.35) ? null : pick([0, 30, 60]),
    skipWyrab: chance(0.5) ? null : chance(0.3),
    citySkipWyrab: null,
    demandDriven: chance(0.5) ? null : chance(0.6),
    resourceDeficitKeys: chance(0.5) ? null : pick(DEFICITS),
    surplusReport: chance(0.6),
    civArchetype: u(pick(CIVS)),
    playerEra: chance(0.5) ? null : pick([0, 1, 2, 2.5, 3, 4, 7]),
    priorityOverride: chance(0.07) ? subset(AI_IMPROVEMENT_PRIORITY, 0.6).sort(() => rnd() - 0.5) : null,
    workedHexKeys: null,
  };
  if (chance(0.3)) {
    scenario.cityPracaBudgetPercent = Object.fromEntries(cities.filter(() => chance(0.5)).map((c) => [c.id, enc(pick([0, 10, 33, 80, 100]))]));
  }
  if (chance(0.3)) {
    scenario.citySkipWyrab = Object.fromEntries(cities.filter(() => chance(0.5)).map((c) => [c.id, chance(0.5)]));
  }
  if (chance(0.35)) {
    scenario.workedHexKeys = Object.fromEntries(cities.map((c) => [c.id, subset(keysAll, 0.45)]));
  }
  return { scenario, cities, hexMap, riverPaths, territoryNodes, placed, researched, radius };
}

// Wywolanie PRAWDZIWEGO pickera z pina na zywych obiektach (jak w main.ts / ai.ts).
function runWeb(sc, built) {
  const { cities, hexMap, riverPaths, territoryNodes, placed, researched } = built;
  const map = { hexes: hexMap, riverPaths };
  const runtimeCities = cities.map((c) => ({
    id: c.id, ownerId: c.ownerId, q: c.q, r: c.r, population: c.population,
    ...(c.ulepszeniaFocus !== undefined ? { ulepszeniaFocus: c.ulepszeniaFocus } : {}),
    ...(c.ulepszeniaOnlyWorked !== undefined ? { ulepszeniaOnlyWorked: c.ulepszeniaOnlyWorked } : {}),
    ...(c.surowce !== undefined ? { surowce: c.surowce } : {}),
  }));
  const opts = {
    cities: runtimeCities,
    ownerId: 0,
    map,
    territoryNodes: territoryNodes === undefined ? undefined : territoryNodes,
    placedImprovements: placed === null ? undefined : new Map(Object.entries(placed)),
    pracaAvailable: sc.pracaAvailable === 'NaN' ? NaN : sc.pracaAvailable,
    unlockedTechs: new Set(researched),
    pracaBudgetPercent: sc.pracaBudgetPercent === null ? undefined : (sc.pracaBudgetPercent === 'NaN' ? NaN : sc.pracaBudgetPercent),
    improvementBudgetCap: sc.improvementBudgetCap === null ? undefined : (sc.improvementBudgetCap === 'NaN' ? NaN : sc.improvementBudgetCap),
    maxItemsPerCity: sc.maxItemsPerCity === null ? undefined : (sc.maxItemsPerCity === 'Infinity' ? Infinity : sc.maxItemsPerCity),
    pracaSurplusThreshold: sc.pracaSurplusThreshold === null ? undefined : sc.pracaSurplusThreshold,
    skipWyrab: sc.skipWyrab === null ? undefined : sc.skipWyrab,
    demandDriven: sc.demandDriven === null ? undefined : sc.demandDriven,
    resourceDeficitKeys: sc.resourceDeficitKeys === null ? undefined : sc.resourceDeficitKeys,
    surplusReport: sc.surplusReport ? picker.freshSurplusReport() : undefined,
    civArchetype: sc.civArchetype === null ? undefined : sc.civArchetype,
    playerEra: sc.playerEra === null ? undefined : sc.playerEra,
    priorityOverride: sc.priorityOverride === null ? undefined : sc.priorityOverride,
    getWorkedHexKeys: sc.workedHexKeys === null ? undefined : (c) => new Set(sc.workedHexKeys[c.id] ?? []),
    getPracaBudgetPercent: sc.cityPracaBudgetPercent === null ? undefined : (c) => {
      const v = sc.cityPracaBudgetPercent[c.id];
      return v === undefined ? undefined : (v === 'NaN' ? NaN : v);
    },
    getSkipWyrab: sc.citySkipWyrab === null ? undefined : (c) => (c.id in sc.citySkipWyrab ? sc.citySkipWyrab[c.id] : (sc.skipWyrab ?? undefined)),
  };
  // Pola bez callbackow, ktore picker czyta z miasta, tez z opts jako `undefined` gdy brak.
  const picks = pickAutoImprovements(opts);
  return { picks, surplus: opts.surplusReport ?? null };
}

const N = 600;
const cases = [];
const modes = ['mixed', 'mixed', 'forest', 'nocity', 'mixed'];
for (let i = 0; i < N; i++) {
  const mode = modes[i % modes.length];
  const built = buildScenario(mode);
  const { scenario } = built;
  // Obsluga NaN w wejsciu wymaga, zeby `pracaAvailable` bylo liczba przed wywolaniem web (wyzej juz zakodowane).
  const web = runWeb(scenario, built);
  cases.push({
    id: i,
    input: scenario,
    expected: {
      picks: web.picks.map((p) => ({ ownerId: p.ownerId, cityId: p.cityId, q: p.q, r: p.r, key: p.key, kosztPraca: enc(p.kosztPraca) })),
      surplus: web.surplus,
    },
  });
}

// Scenariusze brzegowe: brak territoryNodes, pusta lista miast, NaN w puli.
const edge = [];
{
  const b = buildScenario('mixed');
  const s = { ...b.scenario, territoryNodes: null, surplusReport: true };
  const web = runWeb(s, { ...b, territoryNodes: undefined });
  edge.push({ id: 'edge-no-territory', input: s, expected: { picks: web.picks.map((p) => ({ ownerId: p.ownerId, cityId: p.cityId, q: p.q, r: p.r, key: p.key, kosztPraca: enc(p.kosztPraca) })), surplus: web.surplus } });
}
{
  // NaN w puli Pracy: porownania z NaN (false) i Math.min/max propagujace NaN.
  const b = buildScenario('mixed');
  const s = { ...b.scenario, pracaAvailable: 'NaN', surplusReport: true, pracaSurplusThreshold: null };
  const web = runWeb(s, b);
  edge.push({ id: 'edge-nan-pula', input: s, expected: { picks: web.picks.map((p) => ({ ownerId: p.ownerId, cityId: p.cityId, q: p.q, r: p.r, key: p.key, kosztPraca: enc(p.kosztPraca) })), surplus: web.surplus } });
}
{
  // NaN w budzecie imperium (pracaBudgetPercent) - Math.min/max propagacja NaN.
  const b = buildScenario('forest');
  const s = { ...b.scenario, pracaBudgetPercent: 'NaN', surplusReport: true };
  const web = runWeb(s, b);
  edge.push({ id: 'edge-nan-procent', input: s, expected: { picks: web.picks.map((p) => ({ ownerId: p.ownerId, cityId: p.cityId, q: p.q, r: p.r, key: p.key, kosztPraca: enc(p.kosztPraca) })), surplus: web.surplus } });
}

const doc = {
  pin: PIN,
  source: 'gra/src/game/auto-improvements.ts',
  generator: 'dyspozycje/autobot/runs/R-RUSTPORT-P6-8I2-AUTO-ULEPSZENIA-PICK-Q1/gen-p6-8i2-pick-vectors.mjs',
  cases,
  edge,
};

const dest = join(repo, 'rust-port/engine/tests/p6_8i2_vectors');
mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, 'pick.json'), JSON.stringify(doc) + '\n');
const withPicks = cases.filter((c) => c.expected.picks.length > 0).length;
const kinds = {};
for (const c of cases) for (const p of c.expected.picks) kinds[p.key] = (kinds[p.key] ?? 0) + 1;
console.log(`cases=${cases.length} withPicks=${withPicks} edge=${edge.length}`);
console.log(JSON.stringify(kinds));
