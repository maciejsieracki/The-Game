// Generator wektorow R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1 (pin weba 23dd158e9 = origin/main).
// Uruchamiane sa PRAWDZIWE funkcje weba z `gra/src/game/diplomacy-war-peace-profile.ts` (esbuild, bundle w WORK_DIR z czystego
// `git archive 23dd158e9 gra/src gra/data`; zero buildu w `gra/`). Dane `civ-matrix.json` i `ai-params.json` sa podmieniane wtyczka
// esbuild (onLoad) na warianty, zeby zbadac gałęzie `?? domyslne` i `typeof v === 'number' && isFinite`.
// Czyste rdzenie domkniec `main.ts:10225-10324` sa PRZEPISANE ponizej (domkniecia nieimportowalne), z numerami linii; funkcje modulu
// (`recordWarCityLoss`, `warStateFromRecord`, `brakeRelationThreshold`, `resolveWarPeaceProfile`) wolane sa z prawdziwego bundla.
// Kodowanie liczb: String(x) (NaN, Infinity, "-0" zachowane), undefined -> null (wyjscia) lub "undefined" (wejscia).
// Uzycie: node gen-p6-dypl2-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outDir] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outDir) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '23dd158e9'], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);
const REAL_MATRIX = JSON.parse(readFileSync(join(workDir, 'gra/data/civ-matrix.json'), 'utf8'));
const REAL_AI = JSON.parse(readFileSync(join(workDir, 'gra/data/ai-params.json'), 'utf8'));
const REAL_PARAMS = JSON.parse(readFileSync(join(workDir, 'gra/data/diplomacy-war-peace-params.json'), 'utf8'));

// ---- warianty danych ----
const AI_KEY = 'dyplomacja_zdrowie_armii_pokój';
// kod: [opis, wartoscJson (surowy tekst JSON wartosci pola `wartosc`, albo MISSING/NOENTRY)]
const AI_VARIANTS = [
  ['def', null], ['missing', 'MISSING'], ['noentry', 'NOENTRY'], ['str', '"0.5"'], ['null', 'null'], ['n09', '0.9'], ['neg', '-0.1'],
  ['inf', '1e999'], ['zero', '0'], ['bool', 'true'],
];
function aiJson(variant) {
  const ai = JSON.parse(JSON.stringify(REAL_AI));
  const v = variant[1];
  if (v === null) return JSON.stringify(ai);
  if (v === 'NOENTRY') { delete ai[AI_KEY]; return JSON.stringify(ai); }
  if (v === 'MISSING') { ai[AI_KEY] = { sekcja: 'x' }; return JSON.stringify(ai); }
  ai[AI_KEY] = { wartosc: '@@V@@' };
  return JSON.stringify(ai).replace('"@@V@@"', v);
}

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = mulberry32(0xD1910A02);
const ri = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (a) => a[Math.floor(rng() * a.length)];
const chance = (p) => rng() < p;

// ---- macierz syntetyczna: gałęzie `?? domyslne`, progi agresji (3/7), obronnosc ====
const SYN_PARAMS_KEYS = ['dip_prog_wojny', 'ai_agresywnosc', 'ai_ekspansywnosc', 'ai_sklonnosc_podboju', 'ai_tolerancja_ryzyka', 'ai_profil_obronna'];
const VALS = {
  dip_prog_wojny: [0, 1, 2, 4, 5, 6, 9, 10, 11, 14, 100, -3, 4.5, 'inf', 'ninf', null],
  ai_agresywnosc: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, -1, 2.5, 6.5, 6.999, 7.001, 3.001, 2.999, 'inf', 'ninf', null],
  ai_ekspansywnosc: [0, 1, 2, 3, 4, 5, 10, -2, 3.5, null],
  ai_sklonnosc_podboju: [0, 1, 2, 3, 4, 5, 10, -2, 2.5, null],
  ai_tolerancja_ryzyka: [0, 1, 2, 4, 5, 6, 8, 9, 10, 15, -4, 5.5, 'inf', null],
  ai_profil_obronna: [0, 1, 2, -1, 0.5, 1.0000001, null],
};
const synRows = [];
function mkRow(i, params) {
  return { typCywilizacji: 'syn_typ_' + i, Cywilizacja: 'Syn Cyw ' + i, ikonaId: 'syn_ikona_' + i, tier: 1, params };
}
// siatka: dla kazdego parametru wszystkie wartosci przy pozostalych bazowych
{
  let n = 0;
  for (const k of SYN_PARAMS_KEYS) {
    for (const v of VALS[k]) {
      const params = { dip_prog_wojny: 5, ai_agresywnosc: 5, ai_ekspansywnosc: 3, ai_sklonnosc_podboju: 2, ai_tolerancja_ryzyka: 5, ai_profil_obronna: 0 };
      params[k] = v;
      synRows.push(mkRow(n++, params));
    }
  }
  // wiersz bez zadnego parametru, wiersz z pustymi params
  synRows.push(mkRow(n++, {}));
  // losowe
  for (let i = 0; i < 160; i++) {
    const params = {};
    for (const k of SYN_PARAMS_KEYS) { if (chance(0.9)) params[k] = pick(VALS[k]); }
    synRows.push(mkRow(n++, params));
  }
  // duplikaty kluczy: pierwszy wiersz wygrywa; klucz z jednego pola wiersza A = innego pola wiersza B
  const a = mkRow(n++, { ai_agresywnosc: 9, dip_prog_wojny: 1 });
  const b = mkRow(n++, { ai_agresywnosc: 1, dip_prog_wojny: 9 });
  b.ikonaId = a.typCywilizacji; // wspolny klucz: a.typCywilizacji pasuje do a (typ) i b (ikona) -> wygrywa a
  b.Cywilizacja = 'DUPLIKAT_X';
  const c = mkRow(n++, { ai_agresywnosc: 3 });
  c.Cywilizacja = 'duplikat_x'; // pasuje do b po Cywilizacja bez wielkosci liter
  synRows.push(a, b, c);
}
const SYN_MATRIX = { cywilizacje: synRows.map((r) => ({ ...r, params: Object.fromEntries(Object.entries(r.params).map(([k, v]) => [k, v === 'inf' ? 1e999 : v === 'ninf' ? -1e999 : v])) })) };
function synMatrixText() {
  // 1e999 / -1e999 jako surowe literaly JSON (JSON.stringify daje null dla Infinity)
  return JSON.stringify({
    cywilizacje: synRows.map((r) => ({ ...r, params: Object.fromEntries(Object.entries(r.params).map(([k, v]) => [k, v === 'inf' ? '@@INF@@' : v === 'ninf' ? '@@NINF@@' : v])) })),
  }).replaceAll('"@@INF@@"', '1e999').replaceAll('"@@NINF@@"', '-1e999');
}

const THREE_STUB = '';
async function buildWeb(tag, matrixText, aiText) {
  const built = await esbuild.build({
    stdin: { contents: "export * from './diplomacy-war-peace-profile';", resolveDir: game, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json' },
    plugins: [{ name: 'json-variants', setup(b) {
      if (matrixText) b.onLoad({ filter: /civ-matrix\.json$/ }, () => ({ contents: matrixText, loader: 'json' }));
      if (aiText) b.onLoad({ filter: /ai-params\.json$/ }, () => ({ contents: aiText, loader: 'json' }));
    } }],
  });
  const f = join(workDir, `web-${tag}.mjs`);
  writeFileSync(f, built.outputFiles[0].text);
  return await import(pathToFileURL(f).href);
}

// bundle: [kod, modul, matrixMode('E'|'S'), aiVariantIndex]
const BUNDLES = {};
for (let i = 0; i < AI_VARIANTS.length; i++) {
  BUNDLES[`E${i}`] = await buildWeb(`E${i}`, null, i === 0 ? null : aiJson(AI_VARIANTS[i]));
}
for (const i of [0, 1, 3, 5, 7]) BUNDLES[`S${i}`] = await buildWeb(`S${i}`, synMatrixText(), i === 0 ? null : aiJson(AI_VARIANTS[i]));
const W = BUNDLES.E0; // funkcje bez zaleznosci od danych macierzy / ai

// ---- kodowanie ----
const N = (x) => (x === undefined ? null : Object.is(x, -0) ? '-0' : String(x));
const E = (x) => (x === undefined ? 'undefined' : N(x)); // wejscie
const PF = (p) => [p.civKey === null ? null : p.civKey, p.hasData, N(p.agresywnosc), N(p.ekspansywnosc), N(p.sklonnoscPodboju), N(p.tolerancjaRyzyka), N(p.progWojnyMacierz), p.profilObronny, N(p.progWojnyRelacji), N(p.progPokojSlabosc), N(p.progKrytyczny), N(p.progZdrowia), N(p.minTurWojny), N(p.zmeczenieT), N(p.hamulecN)];
const PFin = (p) => ({ civKey: p[0], hasData: p[1], agresywnosc: +p[2], ekspansywnosc: +p[3], sklonnoscPodboju: +p[4], tolerancjaRyzyka: +p[5], progWojnyMacierz: +p[6], profilObronny: p[7], progWojnyRelacji: +p[8], progPokojSlabosc: +p[9], progKrytyczny: +p[10], progZdrowia: +p[11], minTurWojny: +p[12], zmeczenieT: +p[13], hamulecN: +p[14] });
const stringifyLeaves = (o) => (typeof o === 'number' ? N(o) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, stringifyLeaves(v)])) : o);

const f64 = new Float64Array(1); const u64 = new BigUint64Array(f64.buffer);
function nextUp(x) { if (!Number.isFinite(x)) return x; if (x === 0) return Number.MIN_VALUE; f64[0] = x; u64[0] += x > 0 ? 1n : -1n; return f64[0]; }
function nextDown(x) { return -nextUp(-x); }
const around = (x) => [nextDown(nextDown(x)), nextDown(x), x, nextUp(x), nextUp(nextUp(x)), x - 1, x + 1, x - 1e-9, x + 1e-9];

// ---- zestawy parametrow ----
function perturb(obj, factorFn) {
  if (typeof obj === 'number') return factorFn(obj);
  if (obj && typeof obj === 'object') return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, k.startsWith('_') ? v : perturb(v, factorFn)]));
  return obj;
}
const PARAMSETS = [REAL_PARAMS];
for (let i = 0; i < 6; i++) {
  const f = 0.5 + rng() * 1.1;
  PARAMSETS.push(perturb(REAL_PARAMS, (v) => (chance(0.7) ? Math.round(v * (0.5 + rng() * 1.1) * 1000) / 1000 : v * f)));
}
// zestaw z zamienionymi min/max (clampNum z lo > hi)
{
  const sw = JSON.parse(JSON.stringify(REAL_PARAMS));
  for (const k of ['progWojnyRelacji', 'progPokojSlabosc', 'progKrytyczny', 'progZdrowia', 'minTurWojny', 'hamulecRelacji']) {
    const o = sw[k];
    if ('min' in o) { [o.min, o.max] = [o.max, o.min]; } else { [o.minN, o.maxN] = [o.maxN, o.minN]; }
  }
  PARAMSETS.push(sw);
}
// zestaw z calkowitymi progami zmeczenia, 0.5-owymi mnoznikami (polowki w Math.round)
{
  const h = JSON.parse(JSON.stringify(REAL_PARAMS));
  h.hamulecRelacji.bazaN = 8.5; h.hamulecRelacji.wagaProgWojny = 0.5; h.minTurWojny.baza = 4.5; h.minTurWojny.min = 0; h.minTurWojny.max = 20;
  h.zmeczenie.maksTur = 30; h.zmeczenie.bazaTur = 10;
  PARAMSETS.push(h);
}
const PS_OUT = PARAMSETS.map(stringifyLeaves);

// ======================= profile =======================
const realKeys = [];
for (const c of REAL_MATRIX.cywilizacje) {
  realKeys.push(c.typCywilizacji, c.ikonaId, c.Cywilizacja, c.typCywilizacji.toUpperCase(), c.Cywilizacja.toUpperCase(), ' ' + c.typCywilizacji);
}
const extraKeys = [null, undefined, '', 'nieznany', 'gracz', 'miasto_panstwo', 'GRECY', 'Grecy', 'grecy ', '0'];
const profileCases = [];
const profileModes = []; // do statystyk
function addProfile(bundleCode, ps, key) {
  const mod = BUNDLES[bundleCode];
  const out = mod.resolveWarPeaceProfile(key, PARAMSETS[ps]);
  const aiIdx = +bundleCode.slice(1);
  profileCases.push({ p: ps, m: bundleCode[0] === 'E' ? -1 : 0, ai: aiIdx, k: key === undefined ? null : key, u: key === undefined, out: PF(out) });
}
for (let ps = 0; ps < PARAMSETS.length; ps++) {
  for (const k of [...realKeys, ...extraKeys]) addProfile('E0', ps, k);
}
for (let ai = 1; ai < AI_VARIANTS.length; ai++) {
  for (const k of [null, '', 'nieznany', 'grecy', 'rzymianie', ...realKeys.slice(0, 18)]) addProfile(`E${ai}`, 0, k);
  addProfile(`E${ai}`, 1, 'grecy'); addProfile(`E${ai}`, 7, 'zulusi');
}
// syntetyczna macierz
const synKeys = [];
for (const r of SYN_MATRIX.cywilizacje) synKeys.push(r.typCywilizacji, r.ikonaId, r.Cywilizacja);
synKeys.push('DUPLIKAT_X', 'duplikat_x', 'SYN_TYP_0', 'Syn Cyw 3', 'brak', '');
for (const k of synKeys) { addProfile('S0', 0, k); }
for (let ps = 1; ps < PARAMSETS.length; ps++) for (const k of synKeys.filter((_, i) => i % 7 === ps % 7)) addProfile('S0', ps, k);
for (const ai of [1, 3, 5, 7]) for (const k of synKeys.filter((_, i) => i % 5 === 0)) addProfile(`S${ai}`, 0, k);
// sprawdzenie zgodnosci osadzonej wartosci ai z wariantem E0 (default 0.4)
const profileFile = {
  pin: PIN, aiKey: AI_KEY, aiVariants: AI_VARIANTS.map(([n, v]) => [n, v === null ? 'REAL' : v]),
  paramsets: PS_OUT,
  synRows: synRows.map((r) => ({ typ: r.typCywilizacji, cyw: r.Cywilizacja, ikona: r.ikonaId, params: Object.fromEntries(Object.entries(r.params).filter(([, v]) => v !== null).map(([k, v]) => [k, v === 'inf' ? 'Infinity' : v === 'ninf' ? '-Infinity' : N(v)])) })),
  cases: profileCases,
};
writeFileSync(join(outDir, 'profile.json'), JSON.stringify(profileFile));

// ======================= weariness =======================
const TURNS = [-Infinity, -100, -1, -0, 0, 0.5, 1, 2, 5, 7, 8, 9, 10, 11, 14, 15, 16, 18, 19, 20, 21, 22, 25, 30, 100, Infinity, NaN, undefined];
const TT = [NaN, undefined, -Infinity, -5, -0, 0, 0.5, 1, 2, 5, 7.5, 8, 10, 15, 16, 17, 18, 19, 20, 21, 25, Infinity];
const wearCases = [];
for (const t of TURNS) for (const T of TT) {
  wearCases.push([E(t), E(T), N(W.warWearinessFraction(t, T)), N(W.warWearinessShare(t, T))]);
}
// ulamki wokol progu 0.4 i granicy T
for (const T of [5, 8, 10, 15, 16, 17, 18, 19, 20]) for (const t of [...around(0.4 * T), ...around(T)]) wearCases.push([E(t), E(T), N(W.warWearinessFraction(t, T)), N(W.warWearinessShare(t, T))]);
writeFileSync(join(outDir, 'weariness.json'), JSON.stringify({ pin: PIN, maxShare: N(W.WAR_WEARINESS_MAX_SHARE), cases: wearCases }));

// ======================= record / war state =======================
const recCases = [];
const keys = ['0', '1', '2', '7'];
const ods = [0, 1, 5, 5.5, -1, NaN, 100, Infinity];
const turns = [0, 1, 5, 6, 10, 100, -3, NaN, Infinity, 5.5];
const mkPrev = () => {
  if (chance(0.25)) return undefined;
  const u = {};
  for (const k of keys) if (chance(0.5)) u[k] = pick([0, 1, 2, 3, 0.5, NaN]);
  return { od: pick(ods), utraty: u, ...(chance(0.7) ? { ostatniaTura: pick(turns) } : {}) };
};
const encRec = (r) => (r === undefined ? null : { od: N(r.od), u: Object.fromEntries(Object.entries(r.utraty).map(([k, v]) => [k, N(v)])), o: N(r.ostatniaTura) });
for (let i = 0; i < 3000; i++) {
  const prev = mkPrev();
  const od = prev && chance(0.6) ? prev.od : pick(ods);
  const key = pick(keys); const turn = pick(turns);
  const out = W.recordWarCityLoss(prev, od, key, turn);
  recCases.push({ kind: 'loss', prev: encRec(prev), od: E(od), key, turn: E(turn), out: encRec(out) });
  const st = W.warStateFromRecord(prev, od, key, turn);
  recCases.push({ kind: 'state', prev: encRec(prev), od: E(od), key, turn: E(turn), out: [N(st.turnsAtWar), N(st.lostCities), N(st.turnsSinceCityChange)] });
}
// lancuch utrat w jednej wojnie
{
  let rec; const chain = [];
  for (const [od, key, turn] of [[3, '1', 4], [3, '1', 6], [3, '2', 7], [4, '1', 8], [4, '1', 9], [4, '2', 9]]) {
    const prev = rec; rec = W.recordWarCityLoss(prev, od, key, turn);
    recCases.push({ kind: 'loss', prev: encRec(prev), od: E(od), key, turn: E(turn), out: encRec(rec) });
    chain.push(rec);
  }
}
writeFileSync(join(outDir, 'record.json'), JSON.stringify({ pin: PIN, cases: recCases }));

// ======================= brake threshold =======================
const brakeCases = [];
for (let ps = 0; ps < PARAMSETS.length; ps++) for (const x of [-Infinity, -15, 0, 14, 15, 16, 30, 70, 70.5, 25.5, NaN, undefined, Infinity, 1e300]) {
  brakeCases.push({ p: ps, x: E(x), out: N(W.brakeRelationThreshold(x, PARAMSETS[ps])) });
}
writeFileSync(join(outDir, 'brake.json'), JSON.stringify({ pin: PIN, cases: brakeCases }));

// ======================= profile pool dla sygnalow / cen =======================
const profPool = [];
for (const ps of [0, 1, 4, 7]) {
  for (const c of REAL_MATRIX.cywilizacje) profPool.push([ps, W.resolveWarPeaceProfile(c.typCywilizacji, PARAMSETS[ps])]);
  profPool.push([ps, W.resolveWarPeaceProfile(null, PARAMSETS[ps])]);
}
for (const r of synRows.filter((_, i) => i % 3 === 0)) profPool.push([0, BUNDLES.S0.resolveWarPeaceProfile(r.typCywilizacji, PARAMSETS[0])]);
// profile reczne (granice, NaN, nieskonczonosci, czesci ulamkowe)
const handProf = (o) => ({ civKey: 'hand', hasData: true, agresywnosc: 5, ekspansywnosc: 3, sklonnoscPodboju: 2, tolerancjaRyzyka: 5, progWojnyMacierz: 5, profilObronny: false, progWojnyRelacji: 30, progPokojSlabosc: 0.4, progKrytyczny: 0.25, progZdrowia: 0.4, minTurWojny: 5, zmeczenieT: 20, hamulecN: 5, ...o });
const HAND = [
  handProf({}), handProf({ progPokojSlabosc: 0.5, progZdrowia: 0.5 }), handProf({ minTurWojny: 2.5 }), handProf({ minTurWojny: 1e21 }), handProf({ minTurWojny: 1e-7 }),
  handProf({ minTurWojny: NaN }), handProf({ minTurWojny: -1 }), handProf({ minTurWojny: Infinity }), handProf({ progPokojSlabosc: NaN, progZdrowia: NaN, zmeczenieT: NaN }),
  handProf({ zmeczenieT: Infinity }), handProf({ zmeczenieT: 0 }), handProf({ zmeczenieT: -3 }), handProf({ zmeczenieT: 5.5 }), handProf({ agresywnosc: NaN }), handProf({ sklonnoscPodboju: NaN }),
  handProf({ agresywnosc: 100, sklonnoscPodboju: 100 }), handProf({ agresywnosc: -100, sklonnoscPodboju: -100 }), handProf({ agresywnosc: Infinity }), handProf({ agresywnosc: -Infinity, sklonnoscPodboju: Infinity }),
  handProf({ progPokojSlabosc: 0.4 + 1e-16, zmeczenieT: 10 }), handProf({ minTurWojny: 8, zmeczenieT: 15 }), handProf({ minTurWojny: 3.3 }), handProf({ minTurWojny: 123456789.123 }),
];
for (const h of HAND) profPool.push([0, h]);

// ======================= sygnaly pokoju =======================
const sigCases = [];
const RW = (pf, ps) => [-1, 0, 0.1, 0.25, 0.5, 0.55, 0.6, 1, 2, NaN, undefined, Infinity, -Infinity, ...around(pf.progPokojSlabosc), ...around(PARAMSETS[ps].sygnalyPokoju.progRwMiasta)];
const TW = (pf, ps) => [-5, 0, 1, 5, 9, 10, 14, 15, 16, 20, 21, 30, NaN, undefined, Infinity, -Infinity, ...around(PARAMSETS[ps].sygnalyPokoju.patTurWojny), ...around(pf.zmeczenieT * PARAMSETS[ps].zmeczenie.progSygnaluPokoju), ...around(PARAMSETS[ps].zmeczenie.progSygnaluPokoju * 20)];
let poolIdx = 0;
for (const [ps, pf] of profPool) {
  const P = PARAMSETS[ps];
  const n = poolIdx++ % 3 === 0 ? 150 : 60;
  for (let i = 0; i < n; i++) {
    const rw = pick(RW(pf, ps)); const t = pick(TW(pf, ps));
    const l = pick([0, 0, 1, 2, 0.5, NaN, -1, undefined]);
    const s = pick([undefined, undefined, null, 0, 5, 9, 10, 11, 15, NaN, Infinity, ...around(P.sygnalyPokoju.patBrakZmianyTur)]);
    const h = pick([undefined, undefined, 0, 1, NaN, 0.3, ...around(pf.progZdrowia), Infinity, -1]);
    const input = { rw, turnsAtWar: t, lostCitiesInWar: l };
    if (s !== undefined || chance(0.1)) input.turnsSinceCityChange = s;
    if (h !== undefined) input.armyHealthShare = h;
    const out = W.aiPeaceSignals(input, pf, P);
    sigCases.push({ p: ps, pf: PF(pf), in: [E(rw), E(t), E(l), (s === null || s === undefined) ? null : E(s), h === undefined ? null : E(h)], out: [out.wantsPeace, out.reasons] });
  }
}
// kontrola: undefined == NaN dla rw / turnsAtWar / lostCitiesInWar (Rust mapuje undefined -> NaN)
for (let i = 0; i < 40; i++) {
  const [ps, pf] = pick(profPool); const base = { rw: 0.3, turnsAtWar: 12, lostCitiesInWar: 1 };
  for (const k of ['rw', 'turnsAtWar', 'lostCitiesInWar']) {
    const a = W.aiPeaceSignals({ ...base, [k]: undefined }, pf, PARAMSETS[ps]); const b = W.aiPeaceSignals({ ...base, [k]: NaN }, pf, PARAMSETS[ps]);
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('undefined != NaN w aiPeaceSignals dla ' + k);
  }
}
writeFileSync(join(outDir, 'signals.json'), JSON.stringify({ pin: PIN, paramsets: PS_OUT, cases: sigCases }));

// ======================= ceny pokoju + bramka =======================
const priceCases = [];
for (let ps = 0; ps < PARAMSETS.length; ps++) {
  const C = PARAMSETS[ps].cenaPokoju;
  const rws = new Set([-1, 0, 0.5, 1, 1.5, NaN, undefined, Infinity, -Infinity, ...around(C.progSilyWysoki), ...around(C.progSilyNiski), ...around(0.5)]);
  for (const rw of rws) priceCases.push({ k: 's', p: ps, rw: E(rw), out: N(W.peaceStrengthPriceMultiplier(rw, PARAMSETS[ps])) });
}
for (const [ps, pf] of profPool) priceCases.push({ k: 'c', p: ps, pf: PF(pf), out: N(W.peaceCivPriceMultiplier(pf, PARAMSETS[ps])) });
// profile reczne dla granic clamp (agr/pod ze srodkami)
for (const ps of [0, 1, 2, 3, 5]) {
  const C = PARAMSETS[ps].cenaPokoju;
  for (const agr of [...around(C.agresjaSrodek), 0, 10, 20, -20]) for (const pod of [...around(C.podbojSrodek), 0, 8, 30, -30]) {
    const pf = handProf({ agresywnosc: agr, sklonnoscPodboju: pod });
    priceCases.push({ k: 'c', p: ps, pf: PF(pf), out: N(W.peaceCivPriceMultiplier(pf, PARAMSETS[ps])) });
  }
}
writeFileSync(join(outDir, 'price.json'), JSON.stringify({ pin: PIN, paramsets: PS_OUT, cases: priceCases }));

const gateCases = [];
const gateTurns = (pf, ps) => [-1, 0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 15, 19, 20, 21, 25, 100, NaN, undefined, Infinity, -Infinity, 9.5, 19.5, 0.5,
  ...around(pf.minTurWojny), ...around(PARAMSETS[ps].cenaPokoju.odrzucenieMaxTurWojny), ...around(PARAMSETS[ps].cenaPokoju.turyBezOgraniczenAi)];
poolIdx = 0;
for (const [ps, pf] of profPool) {
  const C = PARAMSETS[ps].cenaPokoju;
  const n = poolIdx++ % 3 === 0 ? 120 : 50;
  for (let i = 0; i < n; i++) {
    const rw = pick([-1, 0, 0.3, 0.5, 1, NaN, undefined, Infinity, ...around(C.odrzucenieRwProg), ...around(C.progSilyWysoki), ...around(C.progSilyNiski)]);
    const t = pick(gateTurns(pf, ps)); const l = pick([0, 0, 0, 1, 2, NaN, undefined, 0.5, -0]);
    const input = { rw, turnsAtWar: t, lostCitiesInWar: l };
    const g = W.evaluatePeaceAiGate(input, pf, PARAMSETS[ps]);
    gateCases.push({ k: 'g', p: ps, pf: PF(pf), in: [E(rw), E(t), E(l)], out: [g.verdict, N(g.priceMultiplier), g.reason === undefined ? null : g.reason], fs: W.isFeelingStronger(input, PARAMSETS[ps]) });
  }
}
for (let i = 0; i < 40; i++) {
  const [ps, pf] = pick(profPool); const base = { rw: 0.6, turnsAtWar: 3, lostCitiesInWar: 0 };
  for (const k of ['rw', 'turnsAtWar', 'lostCitiesInWar']) {
    const a = W.evaluatePeaceAiGate({ ...base, [k]: undefined }, pf, PARAMSETS[ps]); const b = W.evaluatePeaceAiGate({ ...base, [k]: NaN }, pf, PARAMSETS[ps]);
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('undefined != NaN w evaluatePeaceAiGate dla ' + k);
  }
}
writeFileSync(join(outDir, 'gate.json'), JSON.stringify({ pin: PIN, paramsets: PS_OUT, cases: gateCases }));

// ======================= rdzenie main.ts (przepisane z numerami linii) =======================
const mainCases = [];
// main.ts:10257-10268 diploArmyHealthShare (isCivilianUnit i effectiveRuntimeUnitMaxHp podane w jednostce)
function diploArmyHealthShare(units, ownerId) {
  let hp = 0; let max = 0;
  for (const u of units) {
    if (u.ownerId !== ownerId || u.civilian) continue;
    const m = u.maxHp;
    if (!(m > 0)) continue;
    hp += Math.max(0, Math.min(m, u.hp ?? m));
    max += m;
  }
  return max > 0 ? hp / max : undefined;
}
for (let i = 0; i < 1500; i++) {
  const nU = ri(0, 7);
  const units = [];
  for (let j = 0; j < nU; j++) {
    const u = { ownerId: pick([0, 1, 2]), civilian: chance(0.2), maxHp: pick([100, 100, 50, 0, -5, NaN, 80, 1, Infinity, 33.3]) };
    const hpv = pick([undefined, undefined, 100, 0, 50, 120, -10, NaN, 33.3, 1e-9, Infinity]);
    if (hpv !== undefined) u.hp = hpv;
    units.push(u);
  }
  const owner = pick([0, 1, 2, 3]);
  mainCases.push({ k: 'army', units: units.map((u) => [u.ownerId, u.civilian, E(u.maxHp), u.hp === undefined ? null : E(u.hp)]), owner, out: N(diploArmyHealthShare(units, owner)) });
}
// main.ts:10225-10255 diploWarStateFor + diploEnsureWarStart (stan pary jako wejscie/wyjscie)
function diploWarStateForCore(atWar, stamp, rec, ownerKey, turn) {
  if (!atWar) return { st: { turnsAtWar: 0, lostCities: 0, turnsSinceCityChange: 0 }, stamp: undefined };
  const od = stamp !== undefined ? stamp : turn; // diploEnsureWarStart
  return { st: W.warStateFromRecord(rec, od, ownerKey, turn), stamp: od };
}
for (let i = 0; i < 2500; i++) {
  const atWar = chance(0.8); const stamp = chance(0.5) ? undefined : pick([0, 3, 5, 5.5, NaN, -1, Infinity]);
  const rec = mkPrev(); const key = pick(keys); const turn = pick(turns);
  const r = diploWarStateForCore(atWar, stamp, rec, key, turn);
  mainCases.push({ k: 'wsf', atWar, stamp: stamp === undefined ? null : E(stamp), rec: encRec(rec), key, turn: E(turn), out: [N(r.st.turnsAtWar), N(r.st.lostCities), N(r.st.turnsSinceCityChange), N(r.stamp)] });
}
// main.ts:10271-10276 diploRelWarFields (zdrowie liczone leniwie tylko gdy turnsAtWar > 0)
function diploRelWarFieldsCore(s, healthFn) {
  const armyHealthShare = s.turnsAtWar > 0 ? healthFn() : undefined;
  return { turnsAtWar: s.turnsAtWar, lostCitiesInWar: s.lostCities, turnsSinceCityChange: s.turnsSinceCityChange, armyHealthShare };
}
for (const t of [-1, 0, 0.5, 1, 7, NaN, Infinity]) for (const h of [undefined, 0, 0.5, 1, NaN]) {
  let called = false;
  const r = diploRelWarFieldsCore({ turnsAtWar: t, lostCities: 2, turnsSinceCityChange: 3 }, () => { called = true; return h; });
  mainCases.push({ k: 'rel', t: E(t), h: h === undefined ? null : E(h), called, out: [N(r.turnsAtWar), N(r.lostCitiesInWar), N(r.turnsSinceCityChange), N(r.armyHealthShare)] });
}
// main.ts:10278-10292 diploProposalWarState (poza wojna -> undefined)
for (const atWar of [true, false]) for (const rw of [0, 0.5, NaN, 1]) {
  const s = { turnsAtWar: 4, lostCities: 1, turnsSinceCityChange: 2 };
  const out = atWar ? { turnsAtWar: s.turnsAtWar, lostCitiesResponder: s.lostCities, turnsSinceCityChange: s.turnsSinceCityChange, responderRw: rw } : undefined;
  mainCases.push({ k: 'pws', atWar, rw: E(rw), out: out === undefined ? null : [N(out.turnsAtWar), N(out.lostCitiesResponder), N(out.turnsSinceCityChange), N(out.responderRw)] });
}
// main.ts:10318-10324 diploBrakeWarParams (pa/pb to profile)
function diploBrakeWarParamsCore(pa, pb, P) {
  const higher = pa.progWojnyRelacji >= pb.progWojnyRelacji ? pa : pb;
  return { prog: W.brakeRelationThreshold(higher.progWojnyRelacji, P), n: higher.hamulecN };
}
for (let i = 0; i < 1500; i++) {
  const [ps, pa] = pick(profPool); const [, pb0] = pick(profPool);
  const pb = chance(0.2) ? { ...pb0, progWojnyRelacji: pa.progWojnyRelacji } : pb0; // remis
  const pbn = chance(0.05) ? { ...pb, progWojnyRelacji: NaN } : pb;
  const r = diploBrakeWarParamsCore(pa, pbn, PARAMSETS[ps]);
  mainCases.push({ k: 'brk', p: ps, a: PF(pa), b: PF(pbn), out: [N(r.prog), N(r.n)] });
}
writeFileSync(join(outDir, 'main_cores.json'), JSON.stringify({ pin: PIN, paramsets: PS_OUT, cases: mainCases }));

console.log(JSON.stringify({ pin: PIN, profile: profileCases.length, weariness: wearCases.length, record: recCases.length, brake: brakeCases.length, signals: sigCases.length, price: priceCases.length, gate: gateCases.length, main: mainCases.length }));
