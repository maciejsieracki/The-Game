// P6.8A (partie 8A-P1: building-upgrades.ts, pending-improvements.ts): wektory z URUCHOMIONEGO weba 91dc998a.
// Uruchomienie (Node 22, z katalogu tego runu, bez builda gra/):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8a-upgrades-pending-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <KATALOG_WYJSCIA>
// Wariant progu miasto-params (NaN/brak klucza/zero/ujemne/napis): ustaw P6_8A_JSON_OVERRIDE na JSON
//   {"miasto-params.json": <obiekt>} oraz P6_8A_VARIANT=<nazwa>; wtedy zapisuje tylko structural-<nazwa>.json.
// Kodowanie liczb: calkowita skonczona = JSON number; niecalkowita = {"$f": String(x)};
//   NaN/Infinity/-Infinity/-0 = {"$n": "..."}. Wejscia bez klucza = brak klucza w JSON (undefined).
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
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

// Deterministyczny PRNG (mulberry32) -- wektory musza byc powtarzalne.
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

const VARIANT = process.env.P6_8A_VARIANT;

// ---------------------------------------------------------------------------
// Wariant progu struktury obrony: tylko ta sekcja, z podmienionym miasto-params.json.
// ---------------------------------------------------------------------------
if (VARIANT) {
  const BU = await import(src('game/building-upgrades.ts'));
  // Wartosci widoczne dla webu: z nadpisania (P6_8A_JSON_OVERRIDE), a nie z dysku.
  const miasto = JSON.parse(process.env.P6_8A_JSON_OVERRIDE ?? '{}')['miasto-params.json'] ?? readData('miasto-params.json');
  const ids = ['palisada', 'mury', 'fort', 'baszta', 'teatr', 'palac', '', 'nieznany'];
  const cases = ids.map((id) => ({
    buildingId: id,
    percent: enc(BU.buildingStructuralDefenseBonusPercent(id)),
    line: BU.buildingStructuralDefenseBonusLine(id),
  }));
  writeFileSync(
    join(outDir, `structural-${VARIANT}.json`),
    JSON.stringify({ pin: PIN, variant: VARIANT, miastoRaw: {
      bonus_obrona_palisada_proc: miasto.bonus_obrona_palisada_proc?.wartosc ?? null,
      bonus_obrona_mur_proc: miasto.bonus_obrona_mur_proc?.wartosc ?? null,
      bonus_obrona_cytadela_proc: miasto.bonus_obrona_cytadela_proc?.wartosc ?? null,
      bonus_obrona_baszta_proc: miasto.bonus_obrona_baszta_proc?.wartosc ?? null,
    }, cases }, null, 1),
  );
  console.log(`structural variant ${VARIANT}: ${cases.length} cases`);
  process.exit(0);
}

const BU = await import(src('game/building-upgrades.ts'));
const PI = await import(src('game/pending-improvements.ts'));
const buildings = readData('buildings.json');
const miasto = readData('miasto-params.json');
const rand = rng(0x8a8a);

// Rzut na wejscie web: tylko pola potrzebne helperom (bez undefined -- brak klucza = brak pola).
const lite = (b) => {
  const o = { id: b.id, nazwa: b.nazwa };
  if (b.upgradeFrom !== undefined) o.upgradeFrom = b.upgradeFrom;
  if (b.suppressed !== undefined) o.suppressed = b.suppressed;
  return o;
};
const realLite = buildings.map(lite);
const realIds = buildings.map((b) => b.id);
const liteWithGroup = (b) => ({ id: b.id, grupa: b.grupa ?? undefined });

// --- 1. suppressed ---------------------------------------------------------
const suppressedInputs = [
  { id: 'teatr', suppressed: true },
  { id: 'teatr', suppressed: false },
  { id: 'teatr' },
  { id: 'teatr', suppressed: null },
  { id: 'x', suppressed: 1 },
  { id: 'x', suppressed: 'true' },
  { id: 'x', suppressed: 0 },
];
const suppressedCases = suppressedInputs.map((b) => ({
  input: b,
  result: BU.isBuildingSuppressedFromProduction(b),
}));
// Dane rzeczywiste: buildings.json (suppressed).
for (const b of buildings) {
  suppressedCases.push({ input: { id: b.id, ...(b.suppressed !== undefined ? { suppressed: b.suppressed } : {}) }, result: BU.isBuildingSuppressedFromProduction(b) });
}

// --- 2. chain / display / composition --------------------------------------
const synthetic = [
  // duplikat id: web Map -> ostatni wygrywa; Array.find (display) -> pierwszy wygrywa
  [{ id: 'x', nazwa: 'Stara' }, { id: 'x', nazwa: 'Nowa', upgradeFrom: 'y' }, { id: 'y', nazwa: 'Y' }],
  // biale znaki (JS trim obejmuje NBSP i em-space)
  [{ id: 'mury', nazwa: 'Mury' }, { id: 'fort', nazwa: 'Cytadela', upgradeFrom: ' mury ' }],
  // pusty po trim -> brak poprzednika
  [{ id: 'akademia', nazwa: 'Akademia', upgradeFrom: '   ' }, { id: 'a2', nazwa: 'A2', upgradeFrom: null }],
  // nieznany poprzednik
  [{ id: 'k', nazwa: 'K', upgradeFrom: 'nieistnieje' }],
  // trzy poziomy + pusty napis
  [{ id: 'p1', nazwa: 'P1' }, { id: 'p2', nazwa: 'P2', upgradeFrom: 'p1' }, { id: 'p3', nazwa: 'P3', upgradeFrom: 'p2' }],
  // brak listy
  [],
];
const chainCases = [];
const displayCases = [];
const compCases = [];
for (const list of [realLite, ...synthetic]) {
  const queries = list.length ? list.map((b) => b.id) : ['nic', 'x'];
  for (const id of queries) {
    const chain = BU.upgradeChainSteps(id, list);
    chainCases.push({ list, id, ids: chain.map((c) => c.id), nazwy: chain.map((c) => c.nazwa) });
    compCases.push({ list, id, lines: BU.upgradeCompositionLines(id, list) });
  }
  for (const target of list) {
    displayCases.push({ list, target, name: BU.upgradeProductionDisplayName(target, list) });
  }
}
// Losowe listy poprawne (bez cykli): losowy las z korzeniami; dla web cykl zapetlilby petle.
for (let k = 0; k < 40; k++) {
  const n = 2 + Math.floor(rand() * 6);
  const list = [];
  for (let i = 0; i < n; i++) {
    const from = i > 0 && rand() < 0.7 ? `n${Math.floor(rand() * i)}` : undefined;
    const e = { id: `n${i}`, nazwa: `N${i}` };
    if (from !== undefined) e.upgradeFrom = rand() < 0.2 ? `  ${from}\t` : from;
    list.push(e);
  }
  // duplikat z losowym nazwa
  if (rand() < 0.5) list.push({ id: `n${Math.floor(rand() * n)}`, nazwa: 'Dup' });
  for (const b of list) {
    const chain = BU.upgradeChainSteps(b.id, list);
    chainCases.push({ list, id: b.id, ids: chain.map((c) => c.id), nazwy: chain.map((c) => c.nazwa) });
    compCases.push({ list, id: b.id, lines: BU.upgradeCompositionLines(b.id, list) });
    displayCases.push({ list, target: b, name: BU.upgradeProductionDisplayName(b, list) });
  }
}

// --- 3. miasto: linie obecnosci, palac tier --------------------------------
const poolIds = ['biblioteka', 'akademia', 'teatr', 'mury', 'fort', 'palisada', 'palac', 'palac_ii', 'palac_iii', 'baszta', 'inne'];
const presenceCases = [];
const presenceSets = [[], ...poolIds.map((i) => [i])];
for (let k = 0; k < 300; k++) {
  presenceSets.push(poolIds.filter(() => rand() < 0.35));
}
presenceSets.push(['palac', 'palac_iii', 'palac_ii'], ['palac_ii', 'palac'], ['mury', 'fort', 'palisada', 'mury']);
for (const ids of presenceSets) {
  presenceCases.push({
    built: ids,
    biblioteka: BU.cityHasBibliotekaLine(ids),
    amfiteatr: BU.cityHasAmfiteatrLine(ids),
    mur: BU.cityHasMurLine(ids),
    palac: BU.cityHasPalacLine(ids),
    palacTier: BU.cityPalacTier(ids),
  });
}

// --- 4. grupy budynkow -----------------------------------------------------
const groupCases = [];
const groupInputs = [
  buildings.map(liteWithGroup),
  [{ id: 'a', grupa: null }, { id: 'b', grupa: '' }, { id: 'c', grupa: '   ' }, { id: 'd' }, { id: 'e', grupa: ' Wiara ' }, { id: 'f', grupa: 'Nowa grupa' }, { id: 'a', grupa: 'Wiara' }],
  [{ id: 'g', grupa: 'Zdrowie' }, { id: 'g', grupa: 'Żywność' }],
];
for (const list of groupInputs) {
  const pool = list.map((b) => b.id).concat(['nieznany']);
  const sets = [[], ...pool.map((i) => [i])];
  for (let k = 0; k < 60; k++) sets.push(pool.filter(() => rand() < 0.4));
  for (const built of sets) {
    groupCases.push({ list, built, buckets: BU.groupBuiltBuildingIds(built, list) });
  }
}

// --- 5. struktura obrony (wartosci z realnego miasto-params.json) ------------
const structuralCases = ['palisada', 'mury', 'fort', 'baszta', 'teatr', 'palac', '', 'nieznany'].map((id) => ({
  buildingId: id,
  percent: enc(BU.buildingStructuralDefenseBonusPercent(id)),
  line: BU.buildingStructuralDefenseBonusLine(id),
}));

// --- 5b. buildingStatSummaryLines (zalezy od unit-building-bonuses; bez losowania) --------
// Wejscia web: obiekty JS (bez undefined jako wartosci); liczby w zagniezdzonych mapach kodowane.
const encDeep = (v) => {
  if (v === null || v === undefined) return v;
  if (typeof v === 'number') return enc(v);
  if (Array.isArray(v)) return v.map(encDeep);
  if (typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (x !== undefined) out[k] = encDeep(x);
    return out;
  }
  return v;
};
const statLookupReal = buildings.map((b) => {
  const o = { id: b.id };
  if (b.baza && b.baza.mnoznik !== undefined) o.baza = { mnoznik: b.baza.mnoznik };
  if (b.upgradeFrom !== undefined) o.upgradeFrom = b.upgradeFrom;
  return o;
});
const statLookupSyn = [
  { id: 'kuznia', baza: { mnoznik: 20 } },
  { id: 'kuznia_zelaza', baza: { mnoznik: 10 }, upgradeFrom: 'kuznia' },
  { id: 'wielka_kuznia', baza: { mnoznik: 5 }, upgradeFrom: 'kuznia_zelaza' },
  { id: 'koszary', baza: { mnoznik: 15 } },
  { id: 'akademia_wojskowa', baza: { mnoznik: 25 }, upgradeFrom: 'koszary' },
  { id: 'koszary2', baza: { mnoznik: 7 }, upgradeFrom: '  koszary ' },
  { id: 'brak_mnoznika', baza: {}, upgradeFrom: 'kuznia' },
];
const statDefs = [
  ...buildings.map((b) => ({ id: b.id, baza: b.baza ?? undefined, przyrost: b.przyrost ?? undefined })),
  { id: 'kuznia', baza: { praca: 2, mnoznik: 20 }, przyrost: { praca: 1 } },
  { id: 'akademia_wojskowa', baza: { mnoznik: 25, obrona: 0.5 } },
  { id: 'koszary', baza: { mnoznik: 0, praca: 0 }, przyrost: { praca: 0, nauka: 0 } },
  { id: 'koszary', baza: { mnoznik: NaN, nauka: NaN } },
  { id: 'warsztat_oblezniczy', baza: { mnoznik: -3 } },
  { id: 'nieznany', baza: { praca: 1e21, pieniadz: -0.5 }, przyrost: { praca: 0.25, obrona: Infinity } },
  { id: 'kuznia_zelaza', baza: {}, przyrost: {} },
];
const statLookupVariants = [undefined, statLookupReal, statLookupSyn, []];
const statCases = [];
for (const def of statDefs) {
  for (const lk of statLookupVariants) {
    statCases.push({
      def: encDeep(def),
      buildings: lk === undefined ? null : encDeep(lk),
      lines: BU.buildingStatSummaryLines(def, lk),
    });
  }
}

// --- 6. pending-improvements: sekwencje operacji ----------------------------
const HEX = ['1,1', '2,3', '0,-1'];
const KEYS = ['kopalnia', 'farma', 'droga', 'tama'];
const probes = [];
for (const h of HEX) for (const k of KEYS) probes.push([h, k]);
probes.push(['9,9', 'farma'], ['1,1', 'nieznany']);
const mkEntry = () => {
  const h = HEX[Math.floor(rand() * HEX.length)];
  const k = KEYS[Math.floor(rand() * KEYS.length)];
  const kosztChoices = [0, 1, 12, 12.5, 0.1, 1e21, NaN, -3];
  const koszt = kosztChoices[Math.floor(rand() * kosztChoices.length)];
  return { hexKey: h, key: k, kosztPraca: koszt, action: rand() < 0.5 ? 'buduj' : 'wytnij' };
};
const pendingScenarios = [];
for (let s = 0; s < 40; s++) {
  const ops = [];
  let state = new PI.PendingImprovementsTurn();
  for (let step = 0; step < 50; step++) {
    const r = rand();
    let op;
    if (r < 0.5) {
      const e = mkEntry();
      state.add(e);
      op = { op: 'add', entry: enc2(e) };
    } else if (r < 0.75) {
      const [h, k] = probes[Math.floor(rand() * probes.length)];
      const ret = state.remove(h, k);
      op = { op: 'remove', hexKey: h, key: k, ret: ret === undefined ? null : enc2(ret) };
    } else if (r < 0.82) {
      state.commitTurn();
      op = { op: 'commit' };
    } else if (r < 0.9) {
      const rows = state.toSave().map((e) => (rand() < 0.5 ? e : mkEntry()));
      state = PI.PendingImprovementsTurn.fromSave(rows);
      op = { op: 'fromSave', rows: rows.map(enc2) };
    } else {
      op = { op: 'probe' };
    }
    ops.push({
      ...op,
      size: state.size,
      has: probes.map(([h, k]) => state.has(h, k)),
      get: probes.map(([h, k]) => {
        const g = state.get(h, k);
        return g === undefined ? null : enc2(g);
      }),
      toSave: state.toSave().map(enc2),
      undoKeySet: Array.from(state.getUndoKeySet()),
    });
  }
  pendingScenarios.push({ ops });
}

function enc2(e) {
  return { hexKey: e.hexKey, key: e.key, kosztPraca: enc(e.kosztPraca), action: e.action };
}

// --- zapis -----------------------------------------------------------------
writeFileSync(join(outDir, 'building_upgrades.json'), JSON.stringify({
  pin: PIN,
  source: 'gra/src/game/building-upgrades.ts @ 91dc998a (uruchomiony web, Node 22 + loader)',
  suppressed: suppressedCases,
  chain: chainCases,
  composition: compCases,
  display: displayCases,
  presence: presenceCases,
  groups: groupCases,
  structural: structuralCases,
  stats: statCases,
  groupOrder: BU.BUILDING_GROUP_ORDER,
  groupFallback: BU.BUILDING_GROUP_FALLBACK,
}));
writeFileSync(join(outDir, 'pending.json'), JSON.stringify({
  pin: PIN,
  source: 'gra/src/game/pending-improvements.ts @ 91dc998a (uruchomiony web, Node 22 + loader)',
  probes,
  ids: [
    { hexKey: '1,1', key: 'kopalnia', id: PI.pendingImprovementId('1,1', 'kopalnia') },
    { hexKey: 'a:b', key: 'c', id: PI.pendingImprovementId('a:b', 'c') },
    { id: '1,1:kopalnia:x', parsed: PI.parsePendingImprovementId('1,1:kopalnia:x') },
    { id: ':x', parsed: PI.parsePendingImprovementId(':x') },
    { id: 'brak', parsed: PI.parsePendingImprovementId('brak') },
  ],
  scenarios: pendingScenarios,
}));
console.log(`building_upgrades: chain=${chainCases.length} display=${displayCases.length} presence=${presenceCases.length} groups=${groupCases.length}`);
console.log(`pending: scenarios=${pendingScenarios.length} ops=${pendingScenarios.length * 50}`);
