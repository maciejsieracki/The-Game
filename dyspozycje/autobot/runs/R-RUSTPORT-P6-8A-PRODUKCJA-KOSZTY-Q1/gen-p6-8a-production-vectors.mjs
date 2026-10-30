// P6.8A-P1/P2 (production.ts 1-692): wektory z URUCHOMIONEGO weba 91dc998a.
// Uruchomienie (Node 22, z katalogu tego runu, bez builda gra/):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8a-production-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <KATALOG_WYJSCIA>
// Kodowanie: calkowita skonczona = JSON number; niecalkowita = {"$f": String(x)};
//   NaN/Infinity/-Infinity/-0 = {"$n": "..."}; wejscie nieobecne (undefined) = brak klucza; null = null.
// `stripDiacritics` nie jest eksportowana z production.ts: jej tekst zrodlowy jest wycinany z
// production.ts (bez zmian) i importowany jako modul, wiec wynik pochodzi z kodu weba.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
// Katalog roboczy poza repo (tekst zrodlowy wycinanych funkcji), np. katalog scratchpad.
const scratch = presolve(process.argv[4] ?? '');
if (!process.argv[4]) throw new Error('podaj 3. argument: katalog roboczy poza repo');
mkdirSync(outDir, { recursive: true });
mkdirSync(scratch, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';
const readData = (name) => JSON.parse(readFileSync(join(webRoot, 'gra/data', name), 'utf8'));

const enc = (x) => {
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
};
// Wiersz danych do JSON: liczby kodowane, undefined pomijane.
const encRow = (o) => {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    out[k] = typeof v === 'number' ? enc(v) : v;
  }
  return out;
};
const encMarker = (m) => encRow(m);

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(0x8a9a);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const PROD = await import(src('game/production.ts'));
const BCT = await import(src('game/building-cost-tempo.ts'));
const UCT = await import(src('game/unit-cost-tempo.ts'));

// --- stripDiacritics: tekst zrodlowy z production.ts (bez zmian) --------------
{
  const prodText = readFileSync(join(webRoot, 'gra/src/game/production.ts'), 'utf8');
  const m = prodText.match(/function stripDiacritics\(s: string\): string \{[\s\S]*?\n\}/);
  if (!m) throw new Error('nie znaleziono stripDiacritics w production.ts');
  writeFileSync(join(scratch, 'strip-web.ts'), `export ${m[0]}\n`);
}
const STRIP = await import(pathToFileURL(join(scratch, 'strip-web.ts')).href);

// --- dane: projekcja budynkow i jednostek z realnych plikow + syntetyczne przypadki ----
const realBuildings = readData('buildings.json').map((b) => ({
  id: b.id,
  nazwa: b.nazwa,
  kosztBudowy: b.kosztBudowy,
  przyrostKosztu: b.przyrostKosztu,
  epokaWejscia: b.epokaWejscia,
  lokalizacja: b.lokalizacja,
}));
const realUnits = readData('units.json').map((u) => ({
  Jednostka: u.Jednostka,
  Epoka: u.Epoka,
  'Pieniądz (koszt)': u['Pieniądz (koszt)'],
  'Super-jednostka': u['Super-jednostka'],
  'Rola (linia)': u['Rola (linia)'],
  Surowiec: u.Surowiec,
}));
const synBuildings = [
  { id: 'syn_przyrost_brak', nazwa: 'S1', kosztBudowy: 10, epokaWejscia: 2 },
  { id: 'syn_przyrost_nan', nazwa: 'S2', kosztBudowy: 10, przyrostKosztu: NaN, epokaWejscia: 1 },
  { id: 'syn_przyrost_inf', nazwa: 'S3', kosztBudowy: 7, przyrostKosztu: Infinity, epokaWejscia: 3 },
  { id: 'syn_koszt_nan', nazwa: 'S4', kosztBudowy: NaN, przyrostKosztu: 5, epokaWejscia: 2 },
  { id: 'syn_epoka_brak', nazwa: 'S5', kosztBudowy: 33, przyrostKosztu: 4 },
  { id: 'syn_epoka_ulamek', nazwa: 'S6', kosztBudowy: 50, przyrostKosztu: 9, epokaWejscia: 2.9, lokalizacja: 'stolica' },
  { id: 'syn_epoka_zero', nazwa: 'S7', kosztBudowy: 12, przyrostKosztu: 3, epokaWejscia: 0, lokalizacja: 'region' },
  { id: 'syn_epoka_ujemna', nazwa: 'S8', kosztBudowy: 12, przyrostKosztu: 3, epokaWejscia: -1, lokalizacja: 'inne' },
  { id: 'syn_koszt_zero', nazwa: 'S9', kosztBudowy: 0, przyrostKosztu: 0, epokaWejscia: 1 },
  { id: 'syn_przyrost_ujemny', nazwa: 'S10', kosztBudowy: 20, przyrostKosztu: -4, epokaWejscia: 3 },
];
const synUnits = [
  { Jednostka: 'syn_super0', Epoka: 'Kamien', 'Pieniądz (koszt)': 0, 'Super-jednostka': 'TAK', 'Rola (linia)': 'Wsparcie' },
  { Jednostka: 'syn_zero_nie_super', Epoka: 'Kamien', 'Pieniądz (koszt)': 0, 'Rola (linia)': 'Konnica' },
  { Jednostka: 'syn_ujemny', Epoka: 'Braz', 'Pieniądz (koszt)': -4, 'Rola (linia)': 'Wrecz' },
  { Jednostka: 'syn_wrecz_pl', Epoka: 'Kamien', 'Rola (linia)': 'Wręcz' },
  { Jednostka: 'syn_wrecz_ascii', Epoka: 'Kamien', 'Rola (linia)': 'Wrecz' },
  { Jednostka: 'syn_dystans', Epoka: 'Kamien', 'Rola (linia)': 'Dystans' },
  { Jednostka: 'syn_wsparcie', Epoka: 'Kamien', 'Rola (linia)': 'Wsparcie' },
  { Jednostka: 'syn_konnica', Epoka: 'Zelazo', 'Rola (linia)': 'Konnica' },
  { Jednostka: 'syn_rola_nieznana', Epoka: 'Kamien', 'Rola (linia)': 'Nieznana' },
  { Jednostka: 'syn_bez_roli', Epoka: 'Kamien' },
  { Jednostka: 'syn_nan', Epoka: 'Braz', 'Pieniądz (koszt)': NaN, 'Rola (linia)': 'Dystans' },
  { Jednostka: 'syn_ulamek', Epoka: 'Braz', 'Pieniądz (koszt)': 7.5 },
  { Jednostka: 'syn_brak_epoki', 'Pieniądz (koszt)': 9 },
  { Jednostka: 'syn_epoka_nieznana', Epoka: 'Nieznana', 'Pieniądz (koszt)': 11 },
  { Jednostka: 'syn_epoka_null', Epoka: null, 'Pieniądz (koszt)': 13 },
  { Jednostka: 'syn_epoka_zelazo', Epoka: 'Żelazo', 'Pieniądz (koszt)': 40, Surowiec: 'Żelazo' },
  { Jednostka: 'syn_surowiec_braz', Epoka: 'Braz', 'Pieniądz (koszt)': 20, Surowiec: 'Brąz' },
  { Jednostka: 'syn_surowiec_drewno', Epoka: 'Kamien', 'Pieniądz (koszt)': 15, Surowiec: 'Drewno' },
  { Jednostka: 'syn_surowiec_spacje', Epoka: 'Kamien', 'Pieniądz (koszt)': 15, Surowiec: '  Drewno ' },
];
const allBuildings = [...realBuildings, ...synBuildings];
const allUnits = [...realUnits, ...synUnits];
const data = { buildings: allBuildings, units: allUnits };

// --- 1. stale ---------------------------------------------------------------
const constants = {
  EPOCH_BY_NAME: PROD.EPOCH_BY_NAME,
  RECRUIT_UNITS_PER_TURN: PROD.RECRUIT_UNITS_PER_TURN,
  DEFAULT_UNIT_COST: PROD.DEFAULT_UNIT_COST,
  GLOBAL_BUILDING_PROD_MULT: PROD.GLOBAL_BUILDING_PROD_MULT,
  KOSZT_BUDYNKOW_PACE: BCT.KOSZT_BUDYNKOW_PACE,
  KOSZT_JEDNOSTEK_PACE: UCT.KOSZT_JEDNOSTEK_PACE,
};

// --- 2. itemCost --------------------------------------------------------------
const LEVELS = [-2, 0, 0.5, 1, 1.9, 2, 3, 5, 10, 2.7, NaN, Infinity, -Infinity];
const itemCostCases = [];
for (const b of allBuildings) {
  for (const lv of LEVELS) {
    itemCostCases.push({ kind: 'budynek', id: b.id, level: enc(lv), cost: enc(PROD.itemCost('budynek', b.id, data, lv)) });
  }
}
for (const u of allUnits) {
  for (const lv of [1, 5, NaN]) {
    itemCostCases.push({ kind: 'jednostka', id: u.Jednostka, level: enc(lv), cost: enc(PROD.itemCost('jednostka', u.Jednostka, data, lv)) });
  }
}
for (const kind of ['budynek', 'jednostka']) {
  itemCostCases.push({ kind, id: 'nieistnieje', level: 1, cost: enc(PROD.itemCost(kind, 'nieistnieje', data, 1)) });
}

// --- 3. buildingLevelForEpoch -------------------------------------------------
const gateVariants = [
  undefined,
  null,
  [],
  [['6', 'Astronomia']],
  [['2.5', 'A'], ['3', 'B']],
  [['3', 'B'], ['2.5', 'A']],
  [['0', 'Z']],
  [['-1', 'N']],
  [['x', 'Y']],
  [['5', 'B'], ['2', 'A'], ['9', 'C']],
  [['2.5', 'A'], ['6', 'Astronomia']],
  [['4', 'A'], ['5', 'B'], ['3', 'C']],
];
const unlockedVariants = [undefined, [], ['Astronomia'], ['A', 'B'], ['B']];
const levelCases = [];
for (let i = 0; i < 1400; i++) {
  const epoka = pick([1, 2, 3, 5, 0.5, 2.9, NaN]);
  const city = pick([0.5, 1, 2, 2.9, 3, 4, 5, 6]);
  const maks = pick([0, -1, 1, 3, 2.7, 6, NaN]);
  const gate = pick(gateVariants);
  const unlocked = pick(unlockedVariants);
  const gateObj = gate === undefined || gate === null ? gate : Object.fromEntries(gate);
  const out = PROD.buildingLevelForEpoch(epoka, city, maks, gateObj, unlocked === undefined ? undefined : unlocked);
  levelCases.push({
    epoka: enc(epoka),
    city: enc(city),
    maks: enc(maks),
    gate: gate === undefined ? null : gate === null ? null : gate, // pary [klucz, wartosc] w kolejnosci literalu
    gateAbsent: gate === undefined,
    unlocked: unlocked === undefined ? null : unlocked,
    level: enc(out),
  });
}

// --- 4. buildingProductionItem / unitProductionItem --------------------------
const MARKER_SETS = [
  [],
  [
    { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.2, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc', opis: 'x' },
    { typ: 'koszt_redukcja', cel: 'jednostki', wartosc: 0.1, realizuje: 'ekonomia', matrixParamId: 'prod_koszt_jednostki_proc' },
  ],
  [
    { cel: 'impi', wartosc: 0.25, realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' },
    { cel: 'jednostki', wartosc: 0.05, realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' },
  ],
  [{ matrixParamId: 'prod_koszt_budynku_proc', wartosc: '0.3' }],
  [
    { matrixParamId: 'prod_koszt_budynku_proc', wartosc: NaN },
    { matrixParamId: 'prod_koszt_budynku_proc', wartosc: 0.5, realizuje: 'miasto' },
  ],
  [{ cel: 'Impi', wartosc: -0.5, realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' }],
  [{ wartosc: 0.4, realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' }],
  [
    { wartosc: 0.9, realizuje: 'ekonomia', matrixParamId: 'prod_koszt_jednostki_proc' },
    { matrixParamId: 'prod_koszt_budynku_proc', wartosc: 0.1, realizuje: 'miasto' },
    { cel: 'impi', wartosc: 0.3, realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' },
  ],
  [{ cel: 'jednostki', wartosc: [0.5], realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' }],
];
const BUILD_PACES = [undefined, ...Object.keys(BCT.KOSZT_BUDYNKOW_PACE), 'nieznany', 0.5, 2, 0];
const UNIT_PACES = [undefined, ...Object.keys(UCT.KOSZT_JEDNOSTEK_PACE), 'nieznany', 0.5, 3, 0];
const DIFFS = ['normal', 'easy', 'hard'];
const paceJson = (p) => (p === undefined ? null : typeof p === 'number' ? { mult: enc(p) } : { key: p });

const buildingItemCases = [];
for (const b of allBuildings) {
  for (let k = 0; k < 6; k++) {
    const lv = pick([1, 1, 3, 5]);
    const mi = pick(MARKER_SETS.map((_, i) => i));
    const pace = pick(BUILD_PACES);
    const owner = pick([0, 1]);
    const diff = pick(DIFFS);
    const item = PROD.buildingProductionItem(b.id, data, lv, MARKER_SETS[mi], pace, owner, diff);
    buildingItemCases.push({
      id: b.id,
      level: enc(lv),
      markers: MARKER_SETS[mi].map(encMarker),
      pace: paceJson(pace),
      owner,
      difficulty: diff,
      item: item === null ? null : encRow({ kind: item.kind, id: item.id, nazwa: item.nazwa, koszt: item.koszt }),
    });
  }
}
buildingItemCases.push({
  id: 'nieistnieje', level: 1, markers: [], pace: null, owner: 0, difficulty: 'normal',
  item: PROD.buildingProductionItem('nieistnieje', data, 1) ,
});

const unitItemCases = [];
for (const u of allUnits) {
  for (let k = 0; k < 6; k++) {
    const mi = pick(MARKER_SETS.map((_, i) => i));
    const pace = pick(UNIT_PACES);
    const owner = pick([0, 1]);
    const diff = pick(DIFFS);
    const item = PROD.unitProductionItem(u.Jednostka, data, MARKER_SETS[mi], pace, owner, diff);
    unitItemCases.push({
      id: u.Jednostka,
      markers: MARKER_SETS[mi].map(encMarker),
      pace: paceJson(pace),
      owner,
      difficulty: diff,
      item: item === null ? null : encRow({ kind: item.kind, id: item.id, nazwa: item.nazwa, koszt: item.koszt }),
    });
  }
}
unitItemCases.push({
  id: 'nieistnieje', markers: [], pace: null, owner: 0, difficulty: 'normal', item: null,
});

// --- 5. lokalizacja (ADMIN-STOLICA) -----------------------------------------
// buildingLocationAllowed nie jest eksportowana z production.ts: tekst zrodlowy wycinany jak wyzej.
const locationCases = [];
{
  const prodText = readFileSync(join(webRoot, 'gra/src/game/production.ts'), 'utf8');
  const m = prodText.match(/function buildingLocationAllowed\([\s\S]*?\n\}/);
  if (!m) throw new Error('nie znaleziono buildingLocationAllowed');
  writeFileSync(join(scratch, 'location-web.ts'), `export ${m[0]}\n`);
}
const LOC = await import(pathToFileURL(join(scratch, 'location-web.ts')).href);
for (const lok of [undefined, 'stolica', 'region', 'inne']) {
  for (const cap of [undefined, true, false]) {
    locationCases.push({
      lokalizacja: lok ?? null,
      isCapital: cap ?? null,
      allowed: LOC.buildingLocationAllowed(lok, cap),
    });
  }
}

// --- 6. empireStockHas / unitStockShortfallLabel ----------------------------
const STOCKS = [
  null,
  {},
  { drewno: 1 },
  { braz: 0 },
  { zelazo: NaN },
  { drewno: -1 },
  { braz: 2, zelazo: 3, drewno: 0.5 },
  { 'Brąz': 5 },
  { zelazo: Infinity, drewno: 0.25 },
];
const SURO = [...new Set(allUnits.map((u) => u.Surowiec).filter((s) => s !== undefined)), undefined, null, '  Brąz ', 'ŻELAZO', 'zelazo', 'DREWNO', 'kamień', 'Kamień', 'Drewno', ''];
const stockCases = [];
for (const s of SURO) {
  for (const st of STOCKS) {
    const label = PROD.unitStockShortfallLabel({ Surowiec: s }, st === null ? undefined : st);
    stockCases.push({
      surowiec: s === undefined ? null : s,
      stock: st === null ? null : Object.fromEntries(Object.entries(st).map(([k, v]) => [k, enc(v)])),
      label: label === undefined ? null : label,
    });
  }
}

// --- 7. stripDiacritics -----------------------------------------------------
const stripInputs = new Set();
for (let c = 0xc0; c <= 0x17f; c++) stripInputs.add(String.fromCharCode(c));
for (const s of ['  Żółw ', 'ĄĘ', 'łódź', 'ŚĆŹŻ', 'İstanbul', 'Brąz', 'Żelazo', 'Kamień', 'Wręcz', 'ＡＢＣ', 'ΑΒΓ', 'Ế']) stripInputs.add(s);
// znaki laczace na granicach zakresu U+0300-U+036F (usuwane przez web)
for (const s of ['̀', 'ͯ', 'Ͱ', 'aͯ', 'é', 'òͯ', 'xͮ']) stripInputs.add(s);
for (const b of allBuildings) if (b.nazwa) stripInputs.add(b.nazwa);
for (const u of allUnits) if (typeof u.Surowiec === 'string') stripInputs.add(u.Surowiec);
const stripCases = [...stripInputs].map((input) => ({ input, output: STRIP.stripDiacritics(input) }));

// --- zapis --------------------------------------------------------------------
const dataJson = {
  buildings: allBuildings.map(encRow),
  units: allUnits.map(encRow),
};
writeFileSync(join(outDir, 'production_costs.json'), JSON.stringify({
  pin: PIN,
  source: 'gra/src/game/production.ts @ 91dc998a (uruchomiony web, Node 22 + loader)',
  constants,
  data: dataJson,
  itemCost: itemCostCases,
  buildingLevel: levelCases,
  buildingItems: buildingItemCases,
  unitItems: unitItemCases,
  location: locationCases,
  stock: stockCases,
  strip: stripCases,
}));
console.log(`production: itemCost=${itemCostCases.length} level=${levelCases.length} buildingItems=${buildingItemCases.length} unitItems=${unitItemCases.length} location=${locationCases.length} stock=${stockCases.length} strip=${stripCases.length}`);
