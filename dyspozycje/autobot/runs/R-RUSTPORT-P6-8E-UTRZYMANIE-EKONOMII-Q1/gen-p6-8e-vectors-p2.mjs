// Generator wektorow P6.8E-P2 (economy-upkeep.ts, sekcja B: utrzymanie budynkow/jednostek, zywnosc, saldo).
// URUCHAMIA kod TS weba (pin 91dc998a). Dane wejsciowe: prawdziwe buildings.json / units.json z tego samego pinu.
// Uzycie (z katalogu runu; KORZEN = git archive 91dc998a gra/src gra/data rozpakowany w katalogu tymczasowym):
//   node --experimental-transform-types --no-warnings --import ./gen-loader-register.mjs ./gen-p6-8e-vectors-p2.mjs <KORZEN> <KATALOG_WYJSCIA>
// Zapisuje economy_upkeep_p2.json. Kodowanie jak w P1: calkowita = number; niecalkowita = {"$f"}; NaN/Inf/-0 = {"$n"}.
// Wiersze units.json zapisane jako tablice par [klucz, komorka] (kolejnosc kluczy = web Object.keys).
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-p6-8e-vectors-p2.mjs <KORZEN> <KATALOG_WYJSCIA>');
  process.exit(2);
}
const url = (p) => pathToFileURL(`${root}/${p}`).href;
const U = await import(url('gra/src/game/economy-upkeep.ts'));

function enc(x) {
  if (typeof x !== 'number') throw new Error('enc: nie liczba');
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
}
// Wartosc JSON z webu -> JSON wektora: liczba -> enc, napis/null/bool -> jak jest, obiekt/tablica -> {"$o":1}.
function encAny(v) {
  if (typeof v === 'number') return enc(v);
  if (v === null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v;
  return { $o: 1 };
}

let seed = 0x8e2c0de5;
function rnd() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function pick(arr) {
  return arr[Math.floor(rnd() * arr.length)];
}

const PARAM_NUMS = [0, 1, 2, 0.5, 2.5, 3, 7, -1, NaN, Infinity, 0.25, 10, 1.5];
const LEVELS = [0, -1, 0.5, 1, 1.9, 2, 2.7, 3, 5, 10, NaN, Infinity];
const FLATS = [undefined, 1, 0, NaN, 3.5, -2, 0.75, 1.25];
const AMOUNTS = [0, 1, 2, 3, 5, 7.25, 10, 50, -2, NaN, Infinity, -0, 0.5];

// ---- Dane z pinu ------------------------------------------------------------------
const buildingsRaw = JSON.parse(readFileSync(`${root}/gra/data/buildings.json`, 'utf8'));
const unitsRaw = JSON.parse(readFileSync(`${root}/gra/data/units.json`, 'utf8'));
const econRaw = JSON.parse(readFileSync(`${root}/gra/data/econ-params.json`, 'utf8'));

// Rekord budynku dla web BuildingRecord (tylko czytane pola).
function bRecord(b) {
  const r = { id: b.id };
  if (b.utrzymanie !== undefined) r.utrzymanie = b.utrzymanie;
  if (b.przyrostUtrzymania !== undefined) r.przyrostUtrzymania = b.przyrostUtrzymania;
  if (b.epokaWejscia !== undefined) r.epokaWejscia = b.epokaWejscia;
  if (b.koszt_surowce !== undefined) r.koszt_surowce = b.koszt_surowce;
  return r;
}
const catalog = buildingsRaw.map(bRecord);
const CATALOG_IDS = catalog.map((b) => b.id);

// Syntetyczne budynki brzegowe.
const syntheticBuildings = [
  { id: 'syn_brak_utrz' },
  { id: 'syn_flat_epoka2', epokaWejscia: 2 },
  { id: 'syn_flat_epoka3', epokaWejscia: 3 },
  { id: 'syn_flat_epoka5', epokaWejscia: 5 },
  { id: 'syn_nan_utrz', utrzymanie: NaN, przyrostUtrzymania: 2 },
  { id: 'syn_inf_utrz', utrzymanie: Infinity, przyrostUtrzymania: 1 },
  { id: 'syn_zero', utrzymanie: 0, przyrostUtrzymania: 0 },
  { id: 'syn_ujemny', utrzymanie: -4, przyrostUtrzymania: 1 },
  { id: 'syn_przyrost_nan', utrzymanie: 3, przyrostUtrzymania: NaN, epokaWejscia: 2 },
  { id: 'syn_brak_przyrost', utrzymanie: 3, epokaWejscia: 4 },
  { id: 'syn_epoka_nan', utrzymanie: 2, przyrostUtrzymania: 1, epokaWejscia: NaN },
  { id: 'syn_epoka_0', utrzymanie: 2, przyrostUtrzymania: 1, epokaWejscia: 0 },
  { id: 'syn_epoka_9', utrzymanie: 5, przyrostUtrzymania: 2, epokaWejscia: 9 },
  { id: 'syn_koszt_mix', koszt_surowce: { drewno: 5, kamien: 0, glina: -3, ruda: NaN, zloto: Infinity, sol: null } },
  { id: 'syn_koszt_pusty', koszt_surowce: {} },
  { id: 'syn_koszt_null', koszt_surowce: null },
];
const syntheticRecords = syntheticBuildings.map(bRecord);
// Synthetyczne rekordy NIE wchodza do katalogu `catalog` (zeby nie psuc find po id) - maja unikalne id.
const fullCatalog = catalog.concat(syntheticRecords);

// Wiersze jednostek: pary [klucz, komorka] w kolejnosci z JSON (zachowana kolejnosc kluczy).
function unitRowPairs(row) {
  return Object.entries(row).map(([k, v]) => [k, encAny(v)]);
}
const unitRows = unitsRaw.map((r) => ({ src: r, pairs: unitRowPairs(r) }));
// Syntetyczne wiersze jako pary JS (wartosci NaN dozwolone; kodowanie nizej).
const syntheticUnitRows = [
  [['Jednostka', 'Syn1'], ['Utrzymanie surowiec (ilość)', 4], ['Utrzymanie (Pieniądz/turę)', 2], ['Epoka', 1]],
  [['Jednostka', 'Syn2'], ['Utrzymanie surowiec (ilość)', 4], ['Epoka', 'x']],
  [['Jednostka', 'Syn3'], ['Utrzymanie (Pieniadz/ture)', 6], ['Utrzymanie (Pieniądz/turę)', 9], ['Epoka', '2']],
  [['Jednostka', 'Syn4'], ['Utrzymanie (Pieniądz/turę)', 'abc'], ['Utrzymanie surowiec (ilość)', NaN], ['Epoka', null]],
  [['Jednostka', ''], ['Utrzymanie (Pieniądz/turę)', 3]],
  [['Utrzymanie (Pieniądz/turę)', 3]],
  [['Jednostka', 'Syn5'], ['żywność/turę', null], ['zywnosc/ture', 0.5], ['Epoka', 3]],
  [['Jednostka', 'Syn6'], ['żywność/turę', 2], ['zywnosc/ture', 9], ['Epoka', 1]],
  [['Jednostka', 'Syn7'], ['żywność/turę', 'x'], ['zywnosc/ture', 9], ['Epoka', 1]],
  [['Jednostka', 'Syn8'], ['żywność/turę', 0], ['Epoka', 'Ślęża']],
];
const allUnitRowPairs = unitRows.map((r) => r.pairs).concat(
  syntheticUnitRows.map((pairs) => pairs.map(([k, v]) => [k, encAny(v)])),
);
// Wiersze jako obiekty JS dla webu: dane realne = surowy JSON; syntetyczne = obiekt z tej samej kolejnosci.
const unitRowsWeb = unitRows.map((r) => r.src).concat(syntheticUnitRows.map((pairs) => {
  const o = {};
  for (const [k, v] of pairs) o[k] = v;
  return o;
}));

// Definicja jednostki dla bramki rekrutacji / utrzymania surowcowego: pola jak w units.json.
const UNIT_FIELDS = ['Jednostka', 'Typ', 'Epoka', 'Surowiec', 'Surowiec (ilość)', 'Utrzymanie surowiec', 'Utrzymanie surowiec (ilość)'];
function encUnitDef(row) {
  const o = {};
  for (const f of UNIT_FIELDS) {
    if (!(f in row)) continue;
    o[f] = encAny(row[f]);
  }
  return o;
}
function unitDefFromEnc(o) {
  // Odtwarza obiekt JS z zakodowanej definicji (tylko pola jednostki).
  const r = {};
  for (const f of UNIT_FIELDS) {
    if (!(f in o)) continue;
    const v = o[f];
    if (v && typeof v === 'object' && '$n' in v) r[f] = v.$n === 'NaN' ? NaN : v.$n === 'Infinity' ? Infinity : v.$n === '-Infinity' ? -Infinity : -0;
    else if (v && typeof v === 'object' && '$f' in v) r[f] = Number(v.$f);
    else if (v && typeof v === 'object' && '$o' in v) r[f] = [];
    else r[f] = v;
  }
  return r;
}

const UNIT_DEFS = unitRows.map((r) => encUnitDef(r.src));
const SYN_UNIT_DEFS = [
  { Jednostka: 'Wojownik', Typ: 'Mount', Epoka: 1, Surowiec: 'Drewno', 'Surowiec (ilość)': 50, 'Utrzymanie surowiec': 'Drewno', 'Utrzymanie surowiec (ilość)': 10 },
  { Jednostka: 'Syn', Epoka: '2', Surowiec: 'Kamień', 'Surowiec (ilość)': 7.5, 'Utrzymanie surowiec': 'Kamień', 'Utrzymanie surowiec (ilość)': 2.5 },
  { Jednostka: 'Syn2', Epoka: 3, Surowiec: '-', 'Surowiec (ilość)': 4, 'Utrzymanie surowiec': '-', 'Utrzymanie surowiec (ilość)': 4 },
  { Jednostka: 'Syn3', Epoka: null, Surowiec: 'Złoto', 'Surowiec (ilość)': 0, 'Utrzymanie surowiec': ' Złoto ', 'Utrzymanie surowiec (ilość)': 3 },
  { Jednostka: 'Syn4', Typ: 'Mount', Epoka: 2, Surowiec: '', 'Utrzymanie surowiec': 'Ruda Żelaza', 'Utrzymanie surowiec (ilość)': -2 },
  { Jednostka: 'Syn5', Epoka: 1, Surowiec: 'Glina', 'Surowiec (ilość)': NaN, 'Utrzymanie surowiec': null, 'Utrzymanie surowiec (ilość)': NaN },
  { Jednostka: 'Syn6', Epoka: 'x', Surowiec: 'Cegła', 'Surowiec (ilość)': 1, 'Utrzymanie surowiec': 'Cegła', 'Utrzymanie surowiec (ilość)': 2.5 },
  { Jednostka: 'Syn7', Typ: 'Mount', Epoka: 1, Surowiec: 'Kon', 'Surowiec (ilość)': 2, 'Utrzymanie surowiec': 'Kon', 'Utrzymanie surowiec (ilość)': 1 },
  { Jednostka: 'Syn8', Typ: 'Mount', Epoka: 1, 'Utrzymanie surowiec': 'Ruda cyny', 'Utrzymanie surowiec (ilość)': 4 },
];
const ALL_UNIT_DEFS = UNIT_DEFS.concat(SYN_UNIT_DEFS.map(encUnitDef));
const webUnitDefs = ALL_UNIT_DEFS.map(unitDefFromEnc);

const RES_KEYS = ['drewno', 'kamien', 'glina', 'ruda', 'zloto', 'kon', 'sol', 'ruda_cyny', 'cegla', 'zelazo'];
function randomPool() {
  if (rnd() < 0.1) return undefined;
  const pool = {};
  for (const k of RES_KEYS) if (rnd() < 0.6) pool[k] = pick(AMOUNTS);
  return pool;
}
function encPool(pool) {
  if (pool === undefined) return undefined;
  const o = {};
  for (const [k, v] of Object.entries(pool)) o[k] = enc(v);
  return o;
}
function encMap(m) {
  const o = {};
  for (const [k, v] of Object.entries(m)) o[k] = enc(v);
  return o;
}
function encParams(p) {
  return {
    ruch: enc(p.zywnoscJednostkaRuch), oboz: enc(p.zywnoscJednostkaOboz),
    terytorium: enc(p.zywnoscMnoznikTerytorium), poza: enc(p.zywnoscMnoznikPozaTerytorium),
    flat: p.budynekUtrzymanieFlat === undefined ? undefined : enc(p.budynekUtrzymanieFlat),
    jednostka: enc(p.jednostkaUtrzymanieStd),
  };
}
function randomParams() {
  return {
    zywnoscJednostkaRuch: pick(PARAM_NUMS), zywnoscJednostkaOboz: pick(PARAM_NUMS),
    zywnoscMnoznikTerytorium: pick(PARAM_NUMS), zywnoscMnoznikPozaTerytorium: pick(PARAM_NUMS),
    budynekUtrzymanieFlat: pick([1, 0, 2, NaN]), jednostkaUtrzymanieStd: pick([1, 0, 3, NaN]),
  };
}

const out = {
  zrodlo: 'uruchomiony kod TS weba economy-upkeep.ts (pin 91dc998a, generator gen-p6-8e-vectors-p2.mjs)',
};

// ---- loadUpkeepParams ----------------------------------------------------------------
const RAW_KEYS = {
  globalne: ['utrzymanie_jednostka_standard', 'magazyn_baza_surowce'],
  ekonomia_miasta: ['zywnosc_jednostka_ruch', 'zywnosc_jednostka_oboz', 'zywnosc_mnoznik_terytorium_wlasne', 'zywnosc_mnoznik_poza_terytorium'],
  budynki: ['utrzymanie_budynek'],
};
const DIFFS = ['easy', 'normal', 'hard'];
const CELLS = [7, 0, -2, 0.25, 13, NaN, Infinity, -0, 'abc', null, undefined];
function randomRaw() {
  const raw = {};
  for (const g of Object.keys(RAW_KEYS)) {
    if (rnd() < 0.15) continue;
    raw[g] = {};
    for (const key of RAW_KEYS[g]) {
      if (rnd() < 0.2) continue;
      const row = {};
      for (const d of DIFFS) {
        const v = pick(CELLS);
        if (v !== undefined) row[d] = v;
      }
      raw[g][key] = row;
    }
  }
  return raw;
}
function encRaw(raw) {
  const o = {};
  for (const [g, rows] of Object.entries(raw)) {
    o[g] = {};
    for (const [k, row] of Object.entries(rows)) {
      const r = {};
      for (const d of DIFFS) {
        if (!(d in row)) continue;
        const v = row[d];
        r[d] = typeof v === 'number' ? enc(v) : v === null ? null : String(v);
      }
      o[g][k] = r;
    }
  }
  return o;
}
const loadUpkeep = [];
for (let i = 0; i < 160; i++) {
  const raw = randomRaw();
  const difficulty = pick(['easy', 'normal', 'hard']);
  const p = U.loadUpkeepParams(raw, difficulty);
  loadUpkeep.push({ raw: encRaw(raw), difficulty, out: encParams(p) });
}
out.loadUpkeep = loadUpkeep;
out.defaultsUpkeep = encParams(U.DEFAULT_UPKEEP_PARAMS);

// ---- buildingUpkeep / totalBuildingUpkeep -----------------------------------------------
function encBuildingRec(r) {
  const o = { id: r.id };
  if (r.utrzymanie !== undefined) o.utrzymanie = encAny(r.utrzymanie);
  if (r.przyrostUtrzymania !== undefined) o.przyrost = encAny(r.przyrostUtrzymania);
  if (r.epokaWejscia !== undefined) o.epoka = encAny(r.epokaWejscia);
  if (r.koszt_surowce !== undefined) {
    o.koszt = r.koszt_surowce === null ? null : encMapAny(r.koszt_surowce);
  }
  return o;
}
function encMapAny(m) {
  const o = {};
  for (const [k, v] of Object.entries(m)) o[k] = encAny(v);
  return o;
}
const buildingUpkeepCases = [];
for (const rec of fullCatalog) {
  for (const level of LEVELS) {
    for (const flat of FLATS) {
      const v = U.buildingUpkeep(rec, level, flat);
      buildingUpkeepCases.push({
        rec: encBuildingRec(rec),
        level: enc(level),
        flat: flat === undefined ? undefined : enc(flat),
        out: enc(v),
      });
    }
  }
}
out.buildingUpkeep = buildingUpkeepCases;

const totalUpkeepCases = [];
for (let i = 0; i < 300; i++) {
  const n = Math.floor(rnd() * 6);
  const inst = [];
  for (let j = 0; j < n; j++) {
    const rec = pick(fullCatalog);
    inst.push({ record: rec, level: pick(LEVELS) });
  }
  const flat = pick(FLATS);
  totalUpkeepCases.push({
    inst: inst.map((x) => ({ rec: encBuildingRec(x.record), level: enc(x.level) })),
    flat: flat === undefined ? undefined : enc(flat),
    out: enc(U.totalBuildingUpkeep(inst, flat)),
  });
}
out.totalBuildingUpkeep = totalUpkeepCases;

// ---- budynki: surowce ------------------------------------------------------------------------
const buildingResCases = fullCatalog.map((rec) => ({
  rec: encBuildingRec(rec),
  out: encMapAny(U.buildingResourceUpkeep(rec)),
}));
out.buildingResourceUpkeep = buildingResCases;
out.buildingResourceUnits = enc(U.BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE);

const totalBuildingResCases = [];
for (let i = 0; i < 120; i++) {
  const n = Math.floor(rnd() * 6);
  const inst = [];
  for (let j = 0; j < n; j++) inst.push({ record: pick(fullCatalog), level: pick(LEVELS) });
  totalBuildingResCases.push({
    inst: inst.map((x) => ({ rec: encBuildingRec(x.record), level: enc(x.level) })),
    out: encMap(U.totalBuildingResourceUpkeep(inst)),
  });
}
out.totalBuildingResourceUpkeep = totalBuildingResCases;

const forBuiltCases = [];
for (let i = 0; i < 120; i++) {
  const ids = [];
  const n = Math.floor(rnd() * 7);
  for (let j = 0; j < n; j++) ids.push(rnd() < 0.1 ? 'nieznany' : pick(fullCatalog).id);
  forBuiltCases.push({ built: ids, out: encMap(U.buildingResourceUpkeepForBuiltIds(ids, fullCatalog)) });
}
out.buildingResourceUpkeepForBuiltIds = forBuiltCases;

// Podglad per owner (miasta, katalog, budynki per miasto).
const previewCases = [];
for (let i = 0; i < 120; i++) {
  const cities = [];
  const nc = 1 + Math.floor(rnd() * 5);
  for (let j = 0; j < nc; j++) cities.push({ id: `c${j}`, ownerId: Math.floor(rnd() * 3) });
  const built = {};
  for (const c of cities) {
    if (rnd() < 0.2) continue;
    const ids = [];
    const n = Math.floor(rnd() * 5);
    for (let j = 0; j < n; j++) ids.push(pick(fullCatalog).id);
    built[c.id] = ids;
  }
  const owner = Math.floor(rnd() * 3);
  previewCases.push({
    owner,
    cities,
    built,
    out: encMap(U.previewOwnerBuildingResourceUpkeep(owner, cities, fullCatalog, new Map(Object.entries(built)))),
  });
}
out.previewOwnerBuildingResourceUpkeep = previewCases;

// addResourceCosts (mutuje acc): acc + add -> acc.
const addCases = [];
for (let i = 0; i < 200; i++) {
  const acc = {};
  const add = {};
  for (const k of RES_KEYS) {
    if (rnd() < 0.5) acc[k] = pick(AMOUNTS);
    if (rnd() < 0.5) add[k] = pick(AMOUNTS);
  }
  const copy = { ...acc };
  U.addResourceCosts(copy, add);
  addCases.push({ acc: encMap(acc), add: encMap(add), out: encMap(copy) });
}
out.addResourceCosts = addCases;

// ---- jednostki: surowce -------------------------------------------------------------------
const unitResCases = [];
for (const def of webUnitDefs) {
  unitResCases.push({ def: encUnitDef(def), out: encMap(U.unitResourceUpkeep(def)) });
}
out.unitResourceUpkeep = unitResCases;

const reserveCases = [];
for (const def of webUnitDefs) {
  for (const turns of [1, 2, 0, 2.5, NaN, -1]) {
    reserveCases.push({ def: encUnitDef(def), turns: enc(turns), out: encMap(U.unitRecruitUpkeepReserve(def, turns)) });
  }
}
out.unitRecruitUpkeepReserve = reserveCases;
out.reserveTurnsDefault = enc(U.UNIT_RECRUIT_UPKEEP_RESERVE_TURNS);
out.stockOnlyHint = U.UNIT_RECRUIT_STOCK_ONLY_HINT;

const recruitCases = [];
for (let i = 0; i < 500; i++) {
  const idx = Math.floor(rnd() * webUnitDefs.length);
  const def = webUnitDefs[idx];
  const pool = randomPool();
  const full = U.canAffordUnitRecruitFull(pool, def);
  recruitCases.push({
    pool: encPool(pool),
    def: ALL_UNIT_DEFS[idx],
    stock: U.canAffordUnitRecruitStock(pool, def),
    full,
    hint: U.pickUnitRecruitHint(pool, def),
    chip: RES_KEYS.map((k) => ({ key: k, out: U.isUnitRecruitStockChipMissing(pool, def, k) })),
  });
}
// Brak definicji (null) i brak puli (undefined).
recruitCases.push({ pool: undefined, def: null, stock: U.canAffordUnitRecruitStock(undefined, null), full: U.canAffordUnitRecruitFull(undefined, null), hint: U.pickUnitRecruitHint(undefined, null), chip: RES_KEYS.map((k) => ({ key: k, out: U.isUnitRecruitStockChipMissing(undefined, null, k) })) });
out.recruit = recruitCases;

// ---- jednostki: utrzymanie zlota ----------------------------------------------------------
out.defaultUnitUpkeepByCategory = Object.entries(U.DEFAULT_UNIT_UPKEEP_BY_CATEGORY).map(([k, v]) => [k, enc(v)]);

const unitUpkeepTable = U.buildUnitUpkeepTable(unitRowsWeb);
const unitTableSynthetic = U.buildUnitUpkeepTable(syntheticUnitRows.map((pairs) => {
  const o = {};
  for (const [k, v] of pairs) o[k] = v;
  return o;
}));
out.buildUnitUpkeepTable = {
  rows: allUnitRowPairs,
  out: encMap(unitUpkeepTable),
  outSynthetic: encMap(unitTableSynthetic),
};

// Tablica typeId -> zloto, dla unitUpkeep: realna + losowe wpisy.
const CATEGORIES = Object.keys(U.DEFAULT_UNIT_UPKEEP_BY_CATEGORY).concat(['nieznana', 'constructor', 'toString', '']);
const TYPE_IDS = Object.keys(unitUpkeepTable).concat(['Nieznany', '', 'Syn1']);
const unitUpkeepCases = [];
for (let i = 0; i < 400; i++) {
  const table = {};
  for (const t of TYPE_IDS) if (rnd() < 0.5) table[t] = pick([0, 1, 2, 3.5, NaN, -1, Infinity]);
  const unit = { typeId: pick(TYPE_IDS), category: pick(CATEGORIES) };
  const std = pick([1, 0, NaN, -1, 3.5, Infinity]);
  unitUpkeepCases.push({
    unit: { typeId: unit.typeId, category: unit.category },
    table: encMap(table),
    std: enc(std),
    out: enc(U.unitUpkeep(unit, table, std)),
  });
}
out.unitUpkeep = unitUpkeepCases;

const totalUnitUpkeepCases = [];
for (let i = 0; i < 100; i++) {
  const units = [];
  const n = Math.floor(rnd() * 6);
  for (let j = 0; j < n; j++) units.push({ typeId: pick(TYPE_IDS), category: pick(CATEGORIES) });
  const std = pick([1, 0, NaN, 2]);
  totalUnitUpkeepCases.push({
    units: units.map((u) => ({ typeId: u.typeId, category: u.category })),
    table: encMap(unitUpkeepTable),
    std: enc(std),
    out: enc(U.totalUnitUpkeep(units, unitUpkeepTable, std)),
  });
}
out.totalUnitUpkeep = totalUnitUpkeepCases;

// Suma surowcowa jednostek i podglad per owner (rozwiazanie typeId -> definicja).
const resolveMap = {};
for (let i = 0; i < unitRows.length; i++) {
  const name = unitRows[i].src.Jednostka;
  if (typeof name === 'string' && name.length > 0) resolveMap[name] = ALL_UNIT_DEFS[i];
}
for (const def of SYN_UNIT_DEFS) resolveMap[def.Jednostka] = encUnitDef(def);
const RESOLVE_KEYS = Object.keys(resolveMap);
out.resolveUnitTable = resolveMap;

function resolveFn(typeId) {
  if (!Object.prototype.hasOwnProperty.call(resolveMap, typeId)) return undefined;
  return unitDefFromEnc(resolveMap[typeId]);
}
const totalUnitResCases = [];
for (let i = 0; i < 120; i++) {
  const units = [];
  const n = Math.floor(rnd() * 6);
  for (let j = 0; j < n; j++) units.push({ typeId: rnd() < 0.15 ? 'Nieznany' : pick(RESOLVE_KEYS) });
  totalUnitResCases.push({
    units: units.map((u) => ({ typeId: u.typeId })),
    out: encMap(U.totalUnitResourceUpkeep(units, resolveFn)),
  });
}
out.totalUnitResourceUpkeep = totalUnitResCases;

const previewTotalCases = [];
for (let i = 0; i < 80; i++) {
  const cities = [];
  const nc = 1 + Math.floor(rnd() * 4);
  for (let j = 0; j < nc; j++) cities.push({ id: `c${j}`, ownerId: Math.floor(rnd() * 3) });
  const built = {};
  for (const c of cities) {
    const ids = [];
    const k = Math.floor(rnd() * 4);
    for (let j = 0; j < k; j++) ids.push(pick(fullCatalog).id);
    built[c.id] = ids;
  }
  const units = [];
  const nu = Math.floor(rnd() * 6);
  for (let j = 0; j < nu; j++) units.push({ ownerId: Math.floor(rnd() * 3), typeId: rnd() < 0.15 ? 'Nieznany' : pick(RESOLVE_KEYS) });
  const owner = Math.floor(rnd() * 3);
  previewTotalCases.push({
    owner,
    cities,
    built,
    units: units.map((u) => ({ ownerId: u.ownerId, typeId: u.typeId })),
    out: encMap(U.previewOwnerTotalResourceUpkeep(owner, cities, fullCatalog, new Map(Object.entries(built)), units, resolveFn)),
  });
}
out.previewOwnerTotalResourceUpkeep = previewTotalCases;

// ---- zywnosc wojska ---------------------------------------------------------------------
const unitFoodTable = U.buildUnitFoodTable(unitRowsWeb);
out.buildUnitFoodTable = {
  rows: allUnitRowPairs,
  out: encMap(unitFoodTable),
};
const FOOD_TYPES = Object.keys(unitFoodTable).concat(['Nieznany', '']);
const foodCases = [];
for (let i = 0; i < 400; i++) {
  const p = randomParams();
  const unit = {
    typeId: rnd() < 0.1 ? undefined : pick(FOOD_TYPES),
    camping: rnd() < 0.5,
    onOwnTerritory: rnd() < 0.3 ? undefined : rnd() < 0.5,
  };
  const table = i % 3 === 0 ? unitFoodTable : {};
  foodCases.push({
    unit: {
      typeId: unit.typeId,
      camping: unit.camping,
      onOwnTerritory: unit.onOwnTerritory,
    },
    p: encParamsFood(p),
    table: encMap(table),
    out: enc(U.unitFoodPerTurn(unit, p, table)),
  });
}
function encParamsFood(p) {
  return {
    ruch: enc(p.zywnoscJednostkaRuch), oboz: enc(p.zywnoscJednostkaOboz),
    terytorium: enc(p.zywnoscMnoznikTerytorium), poza: enc(p.zywnoscMnoznikPozaTerytorium),
  };
}
out.unitFoodPerTurn = foodCases;

const militaryCases = [];
for (let i = 0; i < 80; i++) {
  const p = randomParams();
  const n = Math.floor(rnd() * 6);
  const units = [];
  for (let j = 0; j < n; j++) units.push({ typeId: pick(FOOD_TYPES), camping: rnd() < 0.5, onOwnTerritory: rnd() < 0.5 });
  militaryCases.push({
    units: units.map((u) => ({ typeId: u.typeId, camping: u.camping, onOwnTerritory: u.onOwnTerritory })),
    p: encParamsFood(p),
    table: encMap(unitFoodTable),
    out: enc(U.militaryFoodConsumption(units, p, unitFoodTable)),
  });
}
out.militaryFoodConsumption = militaryCases;

// ---- saldo skarbca ----------------------------------------------------------------------
const balanceCases = [];
for (let i = 0; i < 160; i++) {
  const p = {
    ...randomParams(),
  };
  const income = pick([0, 5, 100, 3.5, NaN, Infinity, -4, 1000]);
  const nb = Math.floor(rnd() * 6);
  const inst = [];
  for (let j = 0; j < nb; j++) inst.push({ record: pick(fullCatalog), level: pick(LEVELS) });
  const nu = Math.floor(rnd() * 6);
  const units = [];
  for (let j = 0; j < nu; j++) units.push({ typeId: pick(TYPE_IDS), category: pick(CATEGORIES) });
  const b = U.upkeepBalance(income, inst, units, unitUpkeepTable, p);
  balanceCases.push({
    income: enc(income),
    inst: inst.map((x) => ({ rec: encBuildingRec(x.record), level: enc(x.level) })),
    units: units.map((u) => ({ typeId: u.typeId, category: u.category })),
    p: encParams(p),
    table: encMap(unitUpkeepTable),
    out: {
      utrzymanieBudynki: enc(b.utrzymanieBudynki),
      utrzymanieJednostki: enc(b.utrzymanieJednostki),
      utrzymanieRazem: enc(b.utrzymanieRazem),
      saldo: enc(b.saldo),
      deficyt: b.deficyt,
    },
  });
}
out.upkeepBalance = balanceCases;

// buildingUpkeepForBuiltIds z poziomami per budynek (domyslnie 1).
const bufCases = [];
for (let i = 0; i < 160; i++) {
  const ids = [];
  const n = Math.floor(rnd() * 6);
  for (let j = 0; j < n; j++) ids.push(rnd() < 0.1 ? 'nieznany' : pick(fullCatalog).id);
  const levels = {};
  for (const id of ids) if (rnd() < 0.5) levels[id] = pick(LEVELS);
  const flat = pick(FLATS);
  const levelFor = (b) => (Object.prototype.hasOwnProperty.call(levels, b.id) ? levels[b.id] : 1);
  bufCases.push({
    built: ids,
    levels: Object.fromEntries(Object.entries(levels).map(([k, v]) => [k, enc(v)])),
    flat: flat === undefined ? undefined : enc(flat),
    out: enc(U.buildingUpkeepForBuiltIds(ids, fullCatalog, levelFor, flat)),
  });
}
out.buildingUpkeepForBuiltIds = bufCases;

// Katalog (realny + syntetyczny), uzywany przez wszystkie funkcje z `catalog`.
out.fullCatalog = fullCatalog.map(encBuildingRec);
out.catalogIds = CATALOG_IDS;

const text = JSON.stringify(out);
writeFileSync(`${outDir}/economy_upkeep_p2.json`, text);
const counts = Object.fromEntries(Object.entries(out).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]));
console.log('EXIT=0', text.length, JSON.stringify(counts));
