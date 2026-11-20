// R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 (#354 czesc B): generator wektorow krokow P1/P9 pominietych w czesci A
// (`rust-port/engine/src/domain/city_capture_apply.rs`: `on_city_captured_religion`, `apply_capture_religion`,
// `apply_capture_law`, `apply_note_city_capture`, `apply_capture_production`).
//
// ORAKUL = WYKONANIE TEKSTU PINU 07d2fbd72 (git show, bez kopii logiki):
// * `gra/src/game/culture-religion.ts`: `onCityCapturedReligion` (`:788-870`), `civReligionForKey` (`:607`);
// * `gra/src/game/diplomacy-display.ts`: `sameCultureCircle` (`:214`);
// * `gra/src/game/post-capture-law.ts`: `applyPostCaptureLawOnCapture` (`:62-82`);
// * `gra/src/ui/eliminationSpectacle.ts`: `noteCityCapture` (`:138`);
// * `gra/src/game/production.ts`: `sanitizeBuildQueue`, `filterQueue`;
// * `gra/data/civs.json`, `gra/data/society-params.json`, `gra/data/buildings.json`.
// Klej z `main.ts` (domkniecia nieladowalne bez calej gry) przepisany 1:1 z cytatem linii: kolejka produkcji przy
// zdobyciu (`:36134-36184`) z `sanitizeProductionQueue` (`:5123-5137`), `ownerReligionForOwnerId` (`:5535`),
// `civKeyForOwnerId` (`:9813-9834`, mapa wlasciciel -> klucz cywilizacji), `setOwnerPracaPool` (`:34879`, Math.max(0, v)).
// `wonderGateOk` (`:4176`) nie jest portowany: scenariusze nie maja pozycji cudow (Rust zglasza je w `not_applied`).
//
// Uruchomienie: node rust-port/engine/tests/p6_zdobycie_miasta_b_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_zdobycie_miasta_b_vectors/vectors.json + MD5 na stdout.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const EXPECTED_SHA256 = process.env.ZMB_SHA256_OVERRIDE ?? 'f6b8e34d8df5f697637b938ccf7d233ad95d667cd715ce6901b790ab712160de';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const ts = createRequire(import.meta.url)(TS_JS);

const showCache = new Map();
const show = (p) => {
  if (showCache.has(p)) return showCache.get(p);
  let out = null;
  try {
    out = execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 1 << 27, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { out = null; }
  showCache.set(p, out);
  return out;
};

function makeStub(name = 'stub') {
  const cache = Object.create(null);
  const fn = function () {};
  return new Proxy(fn, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return (hint) => (hint === 'string' ? '' : 0);
      if (p === Symbol.iterator) return function* () {};
      if (p === 'then') return undefined;
      if (p === 'length') return 0;
      if (p === 'toString') return () => '';
      if (p === 'valueOf') return () => 0;
      if (p === 'prototype') return t.prototype;
      if (!(p in cache)) cache[p] = makeStub(`${name}.${String(p)}`);
      return cache[p];
    },
    set(t, p, v) { cache[p] = v; return true; },
    apply() { return makeStub(`${name}()`); },
    construct() { return makeStub(`new ${name}`); },
    has() { return true; },
  });
}
globalThis.window = makeStub('window');
globalThis.document = makeStub('document');
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
Math.random = () => { throw new Error('Math.random w zastosowaniu wyniku (oczekiwane: brak)'); };

const hash = createHash('sha256');
const hashed = new Set();
const transpile = (p, src) => ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, preserveConstEnums: true, isolatedModules: true },
  fileName: p,
}).outputText
  .replace(/import\.meta\.glob/g, '(() => ({}))')
  .replace(/import\.meta/g, "({ env: { DEV: false, PROD: true, MODE: 'production', BASE_URL: '/' }, url: 'file:///pin/' })");
const modCache = new Map();
function load(p) {
  if (modCache.has(p)) return modCache.get(p).exports;
  const src = show(p);
  if (src === null) throw new Error('brak w pinie: ' + p);
  if (!hashed.has(p)) { hashed.add(p); hash.update(p + '\n' + src); }
  const mod = { exports: {} };
  modCache.set(p, mod);
  if (p.endsWith('.json')) { mod.exports = JSON.parse(src); return mod.exports; }
  const req = (spec) => {
    if (spec === 'three' || spec.startsWith('three/')) return makeStub('THREE');
    if (/[?](raw|url|worker)/.test(spec) || /\.(css|svg|png|jpg|glsl|txt|md|mp3|ogg|wav)$/.test(spec)) return { __esModule: true, default: '' };
    if (!spec.startsWith('.')) return makeStub(spec);
    const base = posix.normalize(posix.join(posix.dirname(p), spec.replace(/\.ts$/, '')));
    for (const c of [base + '.ts', base, base + '/index.ts']) {
      if ((c.endsWith('.ts') || c.endsWith('.json')) && show(c) !== null) return load(c);
    }
    throw new Error('nie rozwiazano ' + spec + ' z ' + p);
  };
  new Function('module', 'exports', 'require', transpile(p, src))(mod, mod.exports, req);
  return mod.exports;
}

const CR = load('gra/src/game/culture-religion.ts');
const DD = load('gra/src/game/diplomacy-display.ts');
const PCL = load('gra/src/game/post-capture-law.ts');
const ES = load('gra/src/ui/eliminationSpectacle.ts');
const PROD = load('gra/src/game/production.ts');
const CIVS = load('gra/data/civs.json');
const SOC = load('gra/data/society-params.json');
const BLD = load('gra/data/buildings.json');
// Obrona r1 (Z1): karta zdobycia. Moduly ladowane jak wyzej; funkcje z domkniecia `main.ts` i z `cities.ts`
// wycinane z tekstu pinu po nazwie (bez kopii logiki) i wykonywane po zdjeciu typow.
const BSC = load('gra/src/game/building-stock-cost.ts');
const PL = load('gra/src/ui/power-labels.ts');
const RSP = load('gra/src/game/retained-side-panel-events.ts');
const hashText = (p) => { const src = show(p); if (src === null) throw new Error('brak w pinie: ' + p); if (!hashed.has(p)) { hashed.add(p); hash.update(p + '\n' + src); } return src; };
const MAIN_LINES = hashText('gra/src/main.ts').split('\n');
const CITIES_LINES = hashText('gra/src/game/cities.ts').split('\n');
const shaHex = hash.digest('hex');
if (EXPECTED_SHA256 !== 'UZUPELNIJ' && shaHex !== EXPECTED_SHA256) {
  throw new Error(`SHA-256 tekstu pinu ${shaHex} != ${EXPECTED_SHA256}`);
}
// Dane Rust (include_str!) musza byc rowne danym pinu, ktore wykonuje generator.
const sameJson = (pinObj, rustPath) => JSON.stringify(pinObj) === JSON.stringify(JSON.parse(readFileSync(join(here, '..', rustPath), 'utf8')));
const dataSame = {
  civs: sameJson(CIVS, 'data/civs.json'),
  society: sameJson(SOC, 'data/society-params.json'),
  // buildings.json Rust ma znany dryf rekordow (43 vs 44, poza tematem); krok czyta WYLACZNIE `lokalizacja` per id.
  buildingsLokalizacja: (() => {
    const rust = JSON.parse(readFileSync(join(here, '..', 'data/buildings.json'), 'utf8'));
    const m = (list) => Object.fromEntries(list.map(x => [x.id, x.lokalizacja ?? null]));
    const a = m(BLD); const r = m(rust);
    return [...new Set([...Object.keys(a), ...Object.keys(r)])].every(k => (a[k] ?? null) === (r[k] ?? null));
  })(),
};

// --- klej main.ts ---------------------------------------------------------------------------------------------------
// `civKeyForOwnerId` (`main.ts:9813-9834`) dla mapy wlasciciel -> klucz cywilizacji (bez macierzy: wszystkie cywilizacje
// civs.json maja wiersz macierzy w pinie, ikonaId == klucz).
const civKeyFor = (civByOwner) => (ownerId) => {
  const candidate = civByOwner[ownerId];
  if (!candidate?.trim()) return '';
  const key = candidate.trim().toLowerCase();
  const row = CIVS.cywilizacje.find(c => [c.ikonaId, c.Cywilizacja].some(v => typeof v === 'string' && v.trim().toLowerCase() === key));
  if (!row) return '';
  return row.ikonaId ?? candidate.trim();
};
// `ownerReligionForOwnerId` (`main.ts:5535`).
const religionFor = (civByOwner) => (ownerId) => CR.civReligionForKey(civByOwner[ownerId] ?? null, SOC, CIVS);

// --- 1. onCityCapturedReligion (funkcja) ----------------------------------------------------------------------------
const REL_R = 'Religia rzymska / kult państwa';
const REL_G = 'Politeizm olimpijski';
const religionCases = [];
// Obrona r1 (Z2): pary z dwiema nieznanymi / pustymi cywilizacjami pokrywaja galaz `if (!row) return ''` w
// `civKeyForOwnerId` (nieznana cywilizacja nie dziedziczy kregu: sameCultureCircle('', '') = false).
const civPairs = [['rzymianie', 'grecy'], ['rzymianie', 'rzymianie'], ['rzymianie', 'harappa'], ['harappa', 'grecy'], ['', 'grecy'], ['nieznana', 'grecy'], ['grecy', 'egipt'],
  ['nieznana', 'nieznana'], ['nieznana', 'inna_nieznana'], ['', ''], ['grecy', 'nieznana']];
const counts = [
  {}, { [REL_G]: 5 }, { [REL_G]: 3, [REL_R]: 2 }, { [REL_G]: 2, a_kult: 1, b_kult: 1 },
  { [REL_G]: 1, a_kult: 2, b_kult: 2, c_kult: 2 }, { x_kult: 3 }, { [REL_G]: 4, a_kult: 0 },
  { a_kult: 1, b_kult: 1, c_kult: 1 }, { [REL_R]: 7 }, { [REL_G]: 6, a_kult: 3, b_kult: 2, c_kult: 1 },
];
const pops = [0, 1, 3, 7];
for (const [cn, cp] of civPairs) {
  for (const c of counts) {
    for (const pop of pops) {
      const civ = { 1: cn, 101: cp };
      const ck = civKeyFor(civ);
      const nr = religionFor(civ)(1);
      const pr = religionFor(civ)(101);
      const same = DD.sameCultureCircle(ck(1), ck(101));
      const out = CR.onCityCapturedReligion({ counts: { ...c } }, pop, nr, pr, 1, 101, { civKeyForOwner: ck });
      religionCases.push({ civNew: cn, civPrev: cp, counts: c, population: pop, newRel: nr, prevRel: pr, same, out: out.counts });
    }
  }
}
// ten sam wlasciciel i brak id = zwrot stanu bez zmian
religionCases.push({ civNew: 'rzymianie', civPrev: 'grecy', counts: { [REL_G]: 2 }, population: 3, newRel: REL_R, prevRel: REL_G, same: false, sameOwner: true,
  out: CR.onCityCapturedReligion({ counts: { [REL_G]: 2 } }, 3, REL_R, REL_G, 101, 101, {}).counts });

// --- 2. kolejka produkcji (main.ts:36134-36184) ----------------------------------------------------------------------
const capitalOnly = BLD.filter(b => b.lokalizacja === 'stolica').map(b => b.id);
const normalB = BLD.find(b => !b.lokalizacja && b.id).id;
const b = (id, extra = {}) => ({ kind: 'budynek', id, nazwa: id, koszt: 50, ...extra });
const j = (id, extra = {}) => ({ kind: 'jednostka', id, nazwa: id, koszt: 30, ...extra });
const prodScenarios = [
  { name: 'brak_kolejki', prod: null, isNewCapital: false },
  { name: 'zwykly_budynek', prod: { kolejka: [b(normalB)], postep: 12 }, isNewCapital: false },
  { name: 'legacy_jednostka_front', prod: { kolejka: [j('wojownik'), b(normalB)], postep: 9 }, isNewCapital: false },
  { name: 'legacy_jednostka_bank', prod: { kolejka: [b(normalB), j('wojownik', { postep: 4 })], postep: 6 }, isNewCapital: false },
  { name: 'stolica_front', prod: { kolejka: [b(capitalOnly[0]), b(normalB)], postep: 7 }, isNewCapital: false },
  { name: 'stolica_bank', prod: { kolejka: [b(normalB), b(capitalOnly[0], { postep: 5 })], postep: 2 }, isNewCapital: false },
  { name: 'stolica_front_z_postepem', prod: { kolejka: [b(capitalOnly[0], { postep: 4 }), b(normalB)], postep: 7 }, isNewCapital: false },
  { name: 'stolica_nowa_stolica', prod: { kolejka: [b(capitalOnly[0]), b(normalB, { postep: 3 })], postep: 7 }, isNewCapital: true },
  { name: 'mieszane', prod: { kolejka: [j('procarz'), b(capitalOnly[1] ?? capitalOnly[0], { postep: 8 }), b(normalB, { postep: 1 })], postep: 11, wstrzymana: true, rekrutacja: [j('wojownik')] }, isNewCapital: false },
];
const OLD = 101;
const ATK = 1;
const prodCases = prodScenarios.map((s) => {
  const pool = { [OLD]: 10, [ATK]: 3 };
  const setOwnerPracaPool = (o, v) => { pool[o] = Math.max(0, v); };
  const ownerPracaPool = (o) => pool[o] ?? 0;
  const cityProd = new Map();
  if (s.prod) cityProd.set('c', JSON.parse(JSON.stringify(s.prod)));
  // main.ts:5123-5137 (wonderGateOk: brak pozycji cudow w scenariuszach).
  const sanitizeProductionQueue = (ownerId, prod) => {
    const migrated = PROD.sanitizeBuildQueue(prod);
    if (migrated.refundedPraca > 0) setOwnerPracaPool(ownerId, ownerPracaPool(ownerId) + migrated.refundedPraca);
    const { prod: sanitized, forfeitedPostep } = PROD.filterQueue(migrated.prod, () => true);
    if (forfeitedPostep > 0) setOwnerPracaPool(ownerId, ownerPracaPool(ownerId) + forfeitedPostep);
    return sanitized;
  };
  // main.ts:36142-36183 (galaz nie-barbarzynska).
  const prodCapture = cityProd.get('c');
  if (prodCapture) {
    const migrated = PROD.sanitizeBuildQueue(prodCapture);
    if (migrated.refundedPraca > 0) setOwnerPracaPool(OLD, ownerPracaPool(OLD) + migrated.refundedPraca);
    const sanitizedCaptureProd = sanitizeProductionQueue(ATK, migrated.prod);
    const isCaptureNewCapital = s.isNewCapital;
    const isCapitalOnlyBuildingCapture = (item) => item.kind === 'budynek' && BLD.find(x => x.id === item.id)?.lokalizacja === 'stolica';
    const forfeitedBankedCapitalCapture = isCaptureNewCapital ? 0 : sanitizedCaptureProd.kolejka.slice(1).filter(isCapitalOnlyBuildingCapture)
      .reduce((sum, item) => sum + (Number.isFinite(item.postep) && item.postep > 0 ? item.postep : 0), 0);
    const { prod: capitalFilteredCaptureProd, forfeitedPostep: forfeitedCapitalOnlyCapture } = isCaptureNewCapital
      ? { prod: sanitizedCaptureProd, forfeitedPostep: 0 }
      : PROD.filterQueue(sanitizedCaptureProd, (item) => !isCapitalOnlyBuildingCapture(item));
    const totalForfeitedCapture = forfeitedCapitalOnlyCapture + forfeitedBankedCapitalCapture;
    if (totalForfeitedCapture > 0) setOwnerPracaPool(ATK, ownerPracaPool(ATK) + totalForfeitedCapture);
    cityProd.set('c', capitalFilteredCaptureProd);
  }
  return { name: s.name, prod: s.prod, isNewCapital: s.isNewCapital, poolBefore: { old: 10, atk: 3 }, out: cityProd.get('c') ?? null, poolAfter: { old: pool[OLD], atk: pool[ATK] } };
});

// --- 3. prawo po przejeciu + kronika ---------------------------------------------------------------------------------
const lawCases = [null, { postCaptureLawTurnsRemaining: 2, wasRebellionReconquest: false }, { postCaptureLawTurnsRemaining: 0, wasRebellionReconquest: true }].map((before) => {
  const city = before ? { ...before } : {};
  PCL.applyPostCaptureLawOnCapture(city, ATK, OLD);
  return { before, out: { postCaptureLawTurnsRemaining: city.postCaptureLawTurnsRemaining ?? null, wasRebellionReconquest: city.wasRebellionReconquest ?? false } };
});
const chronicleCases = [[], [[ATK, { citiesTaken: 2, sinceTurn: 1 }]], [[OLD, { citiesLost: 1, sinceTurn: 3 }], [ATK, { citiesTaken: 0, sinceTurn: 2 }]]].map((before) => {
  const map = new Map();
  for (const [o, c] of before) map.set(o, { ...ES.newChronicle(c.sinceTurn), ...c });
  ES.noteCityCapture(map, OLD, ATK, 7);
  return { before, turn: 7, out: [...map.entries()].sort((a, b2) => a[0] - b2[0]).map(([o, c]) => [o, c]) };
});

// --- 4. E2E przez most (stan testu `p6_zdobycie_miasta_b_bridge.rs`) -------------------------------------------------
// Gracz (1, rzymianie) zdobywa miasto 900 (101, grecy, ludnosc 3 -> 2 po stracie P9) w turze `turn`.
const e2e = (() => {
  const civ = { 1: 'rzymianie', 101: 'grecy' };
  const rel = CR.onCityCapturedReligion({ counts: { [REL_G]: 2, a_kult: 1 } }, 2, religionFor(civ)(1), religionFor(civ)(101), 1, 101, { civKeyForOwner: civKeyFor(civ) });
  const law = {};
  PCL.applyPostCaptureLawOnCapture(law, 1, 101);
  const chron = new Map();
  ES.noteCityCapture(chron, 101, 1, 1);
  const p = prodCases.find(c => c.name === 'mieszane');
  return { civ, religionBefore: { [REL_G]: 2, a_kult: 1 }, religionOut: rel.counts, law, chronicle: [...chron.entries()].sort((a, b2) => a[0] - b2[0]), turn: 1, prod: p };
})();

// --- 5. Karta zdobycia (obrona r1, Z1) ---------------------------------------------------------------------------------
// `buildCityCaptureReportRows` (`main.ts:1802`), `captureReportOneLine`/`ShortLine`, `mirrorCaptureReportRowsForVictim`,
// `recordCityCaptureEvent` (`main.ts:10650`) z domkniecia `main.ts`; `capturePopLossReportRow` (`cities.ts:1255`).
function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\b`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}
const FN_SRC = [
  ...['buildCityCaptureReportRows', 'captureReportOneLine', 'captureReportShortLine', 'mirrorCaptureReportRowsForVictim', 'recordCityCaptureEvent']
    .map(n => extractFn(MAIN_LINES, n)),
  extractFn(CITIES_LINES, 'capturePopLossReportRow'),
].join('\n\n');
const ENV_TS = `
let turn: number = 1;
const warEventLog: any[] = [];
const cityCaptureEventDetails = new Map<string, any>();
const civElimEventDetails = new Map<string, any>();
const eliminationSpectacleByLabel = new Map<string, any>();
const CITY_CAPTURE_EVENT_PREFIX = 'capture-';
const warEventDetailOwners = [
  { idPrefix: CITY_CAPTURE_EVENT_PREFIX, details: cityCaptureEventDetails },
  { idPrefix: 'elim-cs-', details: civElimEventDetails },
] as const;
function trimWarEventLog(): void { trimSidePanelEventLog(warEventLog, 8, warEventDetailOwners); }
function refreshD1bHud(): void {}
${FN_SRC}
return {
  setTurn(t: number) { turn = t; },
  buildCityCaptureReportRows, capturePopLossReportRow, recordCityCaptureEvent,
  snapshot() {
    const sorted = (m: Map<string, any>) => Object.fromEntries([...m.keys()].sort().map(k => [k, m.get(k)]));
    return JSON.parse(JSON.stringify({ warEventLog, city: sorted(cityCaptureEventDetails), civElim: sorted(civElimEventDetails) }));
  },
};`;
const ENV_JS = ts.transpileModule(ENV_TS, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mkEnv = () => new Function('trimSidePanelEventLog', 'EMPIRE_STOCK_RESOURCE_KEYS', 'stockResourceLabel', ENV_JS)(
  RSP.trimSidePanelEventLog, BSC.EMPIRE_STOCK_RESOURCE_KEYS, BSC.stockResourceLabel);
const R = mkEnv();
const MOC = PL.mocLabel();
const rin = (o) => ({ kind: 'zwykle', mocEtykieta: MOC, ludnosc: 0, budynki: 0, zloto: 0, nauka: 0, technologie: 0, moc: 0, barbarzyncaZdobywca: false, pracaPoolPrzejeta: 0, ...o });
// Klucze surowcow spoza listy w kolejnosci alfabetycznej (JSON Rust bez preserve_order czyta obiekt posortowany).
const SUR = { aaa_nowy: 1, braz: 0.5, drewno: 3.7, kamien: 0, kon: -2, sol: 6, zelazo: 2, zzz_nowy: 4 };
const reportInputs = [
  rin({ ludnosc: 2, budynki: 1 }),
  rin({}),
  rin({ ludnosc: 5, budynki: 0, surowce: SUR }),
  rin({ ludnosc: 1, surowce: {} }),
  rin({ kind: 'stolica', ludnosc: 2, budynki: 1, zloto: 40, surowce: {} }),
  rin({ kind: 'stolica', ludnosc: 3, zloto: 0 }),
  rin({ kind: 'stolica', ludnosc: 3, zloto: 9, barbarzyncaZdobywca: true }),
  rin({ kind: 'stolica', zloto: 5, zywnoscPrzejeta: 8, nauka: 3 }),
  rin({ kind: 'eliminacja', ludnosc: 4, budynki: 2, zloto: 12, nauka: 5, technologie: 2, moc: 7.5, zywnoscPrzejeta: 10, zywnoscUtracona: 3, zywnoscOfiaryRazem: 13, pracaPoolPrzejeta: 6, surowce: SUR }),
  rin({ kind: 'eliminacja', ludnosc: 1, zywnoscPrzejeta: 4, zywnoscUtracona: 0 }),
  rin({ kind: 'eliminacja', ludnosc: 1, zywnoscPrzejeta: 4, zywnoscUtracona: 2 }),
  rin({ kind: 'eliminacja', ludnosc: 2, zloto: 7, nauka: 1, moc: 3, pracaPoolPrzejeta: 6, barbarzyncaZdobywca: true }),
  rin({ kind: 'eliminacja', ludnosc: 2, pracaPoolPrzejeta: 0, barbarzyncaZdobywca: true }),
  rin({ kind: 'eliminacja' }),
  rin({ kind: 'eliminacja', moc: 0.25, technologie: 1 }),
];
const reportCases = reportInputs.map(input => ({ input, rows: R.buildCityCaptureReportRows(input) }));
const popLossCases = [0, 1, 2, 2.6, -1].map(loss => ({ loss, row: R.capturePopLossReportRow(loss) }));
// E2E (most): ta sama sekwencja wolan co `applyCityCaptureToMap` (`main.ts:36222-36258`) + wolanie stoleczne z wnetrza
// `runCapitalCapturePlunder` (`main.ts:35558`), etykiety `civLabelForOwner` = konwencja `owner{id}` (D-ZMB-7).
const captureEnv = (steps) => {
  const env = mkEnv();
  env.setTurn(1);
  for (const st of steps) env.recordCityCaptureEvent(st);
  return env.snapshot();
};
const popLoss1 = R.capturePopLossReportRow(Math.max(0, 3 - 2));
const zwykleRows = R.buildCityCaptureReportRows(rin({ ludnosc: 2, budynki: 1, surowce: undefined }));
const stolicaRows = R.buildCityCaptureReportRows(rin({ kind: 'stolica', ludnosc: 2, budynki: 1, zloto: Math.floor(40), surowce: {} }));
const capArgs = (rows, extra = {}) => ({ cityId: 'city900', cityName: 'Twierdza', oldOwner: 101, newOwner: 0, rows, victimLabel: 'owner101', captorLabel: 'owner0', ...extra });
const captureEvents = {
  zwykle: captureEnv([capArgs([...zwykleRows, popLoss1], { eliminatedCivLabel: null })]),
  stolica: captureEnv([capArgs(stolicaRows), capArgs([...stolicaRows, popLoss1], { eliminatedCivLabel: null })]),
};
const capture = { mocLabel: MOC, reportCases, popLossCases, captureEvents };

const out = { pin: PIN, pinSha256: shaHex, dataSame, capitalOnly, religionCases, prodCases, lawCases, chronicleCases, e2e, capture };
const dir = join(here, 'p6_zdobycie_miasta_b_vectors');
mkdirSync(dir, { recursive: true });
const text = JSON.stringify(out, null, 1) + '\n';
writeFileSync(join(dir, 'vectors.json'), text);
console.log('pinSha256', shaHex, 'md5', createHash('md5').update(text).digest('hex'), 'religion', religionCases.length, 'prod', prodCases.length, 'dataSame', JSON.stringify(dataSame));
