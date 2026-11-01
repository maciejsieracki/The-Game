// Generator wektorow REPIN-EKONOMIA-E (stawka utrzymania obywateli per epoka + Spichlerz z JSON).
// PIN weba: 4bbef081d. Kod weba URUCHAMIANY BEZ ZMIAN: gra/src/game/citizen-resource-upkeep.ts oraz
// gra/src/game/building-resource-gate.ts sa bundlowane esbuildem (zrodla z `git archive 4bbef081d gra/src gra/data`
// do katalogu <WORK_DIR> poza repo - zero buildu/dev w gra/). Jedyna ingerencja: plugin esbuild podmienia
// zaladowanie `citizen-resource-upkeep.json` na tabele-wariant (NaN/Infinity/-0/null/napis nie sa
// reprezentowalne w JSON, a trzeba pokryc galezie `Number.isFinite`/`>= 0`); wariant 0 = NIEZMIENIONY plik z pinu.
//
// Uruchomienie (z korzenia repo, z czystego drzewa):
//   node gen-repin-ekonomia-e-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
// ESBUILD_MAIN_JS = .../node_modules/esbuild/lib/main.js (uzyto esbuild 0.28.2, node 22).
//
// Kodowanie liczb jak w tests/p6_7b_vectors/common.rs: bezpieczne calkowite = liczby JSON; NaN/Infinity/-Infinity/-0
// = napisy; reszta = "~<String(x)>" (round-trip f64).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outDir] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outDir) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '4bbef081d'], { encoding: 'utf8' }).trim();

rmSync(workDir, { recursive: true, force: true });
mkdirSync(join(workDir, 'pin'), { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', join(workDir, 'pin')]);
const game = join(workDir, 'pin/gra/src/game');
const realTable = JSON.parse(readFileSync(join(workDir, 'pin/gra/data/citizen-resource-upkeep.json'), 'utf8'));
const realEcon = JSON.parse(readFileSync(join(workDir, 'pin/gra/data/econ-params.json'), 'utf8'));
const esbuild = await import(pathToFileURL(esbuildMain).href);

const enc = (x) => {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  if (Number.isSafeInteger(x)) return x;
  return '~' + String(x);
};
const js = (x) => (Object.is(x, -0) ? '-0' : String(x)); // zrodlo JS literalu (NaN/Infinity ok)

// ---------------------------------------------------------------- bundle
async function bundle(name, entrySrc, tableSrc) {
  const entry = join(workDir, `${name}-entry.ts`);
  writeFileSync(entry, entrySrc);
  const plugins = tableSrc === null ? [] : [{
    name: 'tbl',
    setup(b) {
      b.onLoad({ filter: /citizen-resource-upkeep\.json$/ }, () => ({ contents: 'export default ' + tableSrc, loader: 'js' }));
    },
  }];
  const out = join(workDir, `${name}.mjs`);
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: { '.json': 'json' }, plugins, logLevel: 'error' });
  return import(pathToFileURL(out).href);
}
const citizenEntry = `export { citizenUpkeepRateForEra, citizenRequiredResourcesForEra, resolveCitizenResourceCoverage, computeCitizenResourceDrain, citizenUpkeepDisplayLines } from '${join(game, 'citizen-resource-upkeep')}';\n`;
const gateEntry = `export * from '${join(game, 'building-resource-gate')}';\nexport { loadThroughput } from '${join(game, 'converters')}';\n`;

// ---------------------------------------------------------------- warianty tabeli (citizen)
// rate: {k:'num',v} | {k:'none'} | {k:'null'} | {k:'str',v} | {k:'bool'}
const S1 = ['drewno', 'glina'];
const S2 = ['drewno', 'glina', 'kamien', 'ceramika'];
const S3 = ['drewno', 'glina', 'kamien', 'ceramika', 'cegla'];
const N = (v) => ({ k: 'num', v });
const NONE = { k: 'none' };
const row = (epoka, nazwa, rate, surowce) => ({ epoka, nazwa, rate, surowce });
const VARIANTS = [
  { id: 'real', rows: null }, // niezmieniony plik z pinu: stawki 1/2/3
  { id: 'nonfinite-negative', rows: [row(1, 'K', N(NaN), S1), row(2, 'B', N(-1), S2), row(3, 'Z', N(Infinity), S3)] },
  { id: 'custom-gap', rows: [row(1, 'K', N(0), S1), row(2, 'B', N(0.5), S2), row(3, 'Z', N(2.5), S3), row(5, 'X', N(7), ['cegla', 'drewno'])] },
  { id: 'missing', rows: [row(1, 'K', NONE, S1), row(2, 'B', NONE, S2), row(3, 'Z', NONE, S3)] },
  { id: 'bad-types', rows: [row(1, 'K', { k: 'str', v: '2' }, S1), row(2, 'B', { k: 'null' }, S2), row(3, 'Z', { k: 'bool' }, S3)] },
  { id: 'empty', rows: [] },
  { id: 'unsorted-dup', rows: [row(2, 'B1', N(5), S2), row(1, 'K', N(4), S1), row(2, 'B2', N(9), S3), row(3, 'Z', N(-0), S3)] },
  { id: 'dup-below', rows: [row(1, 'K', N(4), S1), row(2, 'B1', N(5), S2), row(2, 'B2', N(9), S3)] },
  { id: 'only-high', rows: [row(2, 'B', N(3), S2), row(3, 'Z', N(2), S3)] },
];
const rateSrc = (r) => (r.k === 'num' ? `stawkaNaObywatela: ${js(r.v)}, ` : r.k === 'null' ? 'stawkaNaObywatela: null, ' : r.k === 'str' ? `stawkaNaObywatela: ${JSON.stringify(r.v)}, ` : r.k === 'bool' ? 'stawkaNaObywatela: true, ' : '');
const tableSrcOf = (rows) => `{ _opis: 'wariant', _kara: ${JSON.stringify(realTable._kara)}, epoki: [${rows.map((r) => `{ epoka: ${r.epoka}, nazwa: ${JSON.stringify(r.nazwa)}, ${rateSrc(r.rate)}surowce: ${JSON.stringify(r.surowce)} }`).join(', ')}] }`;
const rateWire = (r) => (r.k === 'num' ? { t: 'n', v: enc(r.v) } : { t: 'x', kind: r.k }); // 'x' = nie-liczba => None w Rust

const mods = [];
for (const v of VARIANTS) mods.push(await bundle(`cit-${v.id}`, citizenEntry, v.rows === null ? null : tableSrcOf(v.rows)));

// ---------------------------------------------------------------- citizen: siatka przypadkow
let seed = 20261101;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const KEYS = ['drewno', 'glina', 'kamien', 'ceramika', 'cegla', 'zloto'];
const ERAS_FULL = [NaN, -1, 0, 0.5, 1, 2, 2.9999, 3, 4, Infinity];
const ERAS_SMALL = [NaN, 0, 1, 2, 3, 5, 6.7];
const POPS_FULL = [undefined, NaN, -1, 0, 1, 2, 3.7, 10, 53, Infinity];
const POPS_SMALL = [undefined, NaN, 0, 1, 53];
const STOCK_KINDS_FULL = ['null', 'zero', 'nan', 'inf', 'minus1', 'exact', 'plus1', 'mixed'];
const STOCK_KINDS_SMALL = ['null', 'minus1', 'exact', 'plus1', 'mixed', 'nan'];

function makeStock(kind, need) {
  switch (kind) {
    case 'null': return null;
    case 'empty': return {};
    case 'zero': return Object.fromEntries(KEYS.map((k) => [k, 0]));
    case 'neg': return Object.fromEntries(KEYS.map((k) => [k, -3]));
    case 'nan': return Object.fromEntries(KEYS.map((k, i) => [k, i % 2 ? NaN : need]));
    case 'inf': return Object.fromEntries(KEYS.map((k, i) => [k, i % 2 ? Infinity : need + 1]));
    case 'minus1': return Object.fromEntries(KEYS.map((k) => [k, need - 1]));
    case 'exact': return Object.fromEntries(KEYS.map((k) => [k, need]));
    case 'plus1': return Object.fromEntries(KEYS.map((k) => [k, need + 1]));
    case 'mixed': return Object.fromEntries(KEYS.map((k, i) => [k, need + ((i % 3) - 1) * (1 + Math.floor(rnd() * 3))]));
    case 'big': return Object.fromEntries(KEYS.map((k) => [k, 1e9]));
    case 'half': return Object.fromEntries(KEYS.map((k) => [k, need + 0.5]));
    default: throw new Error(kind);
  }
}
const stockWire = (st) => (st === null ? null : Object.fromEntries(Object.entries(st).map(([k, x]) => [k, enc(x)])));
const covWire = (c) => ({ required: c.required, rate: c.ratePerCitizen === undefined ? null : enc(c.ratePerCitizen), available: c.available, missing: c.missing, happ: enc(c.happinessDelta), growth: enc(c.growthPctDelta) });

const num2 = (e) => (typeof e === 'number' ? e : e === '-0' ? -0 : e === 'NaN' ? NaN : e === 'Infinity' ? Infinity : e === '-Infinity' ? -Infinity : Number(String(e).replace('~', '')));
const stats = { citizenCases: 0, branchRateIsOne: 0, branchRateNotOne: 0, realEraRateAboveOne: 0, popGate: 0, deductions: 0, partial: 0 };
const citizenCases = [];
for (let vi = 0; vi < VARIANTS.length; vi++) {
  const M = mods[vi];
  const full = VARIANTS[vi].id === 'real';
  for (const era of full ? ERAS_FULL : ERAS_SMALL) {
    for (const pop of full ? POPS_FULL : POPS_SMALL) {
      const rate = M.citizenUpkeepRateForEra(era);
      const popOk = typeof pop === 'number' && Number.isFinite(pop) && pop > 0 ? Math.floor(pop) : 0;
      const need = Math.floor(popOk * rate);
      for (const kind of full ? STOCK_KINDS_FULL : STOCK_KINDS_SMALL) {
        const stock = makeStock(kind, need);
        const covLegacy = M.resolveCitizenResourceCoverage(era, stock);
        const covPop = M.resolveCitizenResourceCoverage(era, stock, pop);
        const drain = M.computeCitizenResourceDrain(era, pop === undefined ? 0 : pop, stock);
        const cityPop = pop === undefined ? 7 : pop;
        const lines = M.citizenUpkeepDisplayLines(drain, cityPop).map((l) => ({ key: l.key, value: enc(l.value), available: l.available }));
        const ded = Object.fromEntries(Object.entries(drain.deductions).map(([k, x]) => [k, enc(x)]));
        citizenCases.push({
          v: vi, era: enc(era), pop: pop === undefined ? null : enc(pop), kind, stock: stockWire(stock),
          rate: enc(rate), required: [...M.citizenRequiredResourcesForEra(era)],
          covLegacy: covWire(covLegacy), covPop: covWire(covPop), drain: { ...covWire(drain), ded }, lines,
        });
        stats.citizenCases++;
        if (Object.keys(ded).length) stats.deductions++;
        if (drain.available.length && drain.missing.length) stats.partial++;
        stats.popGate += covPop.available.length !== covLegacy.available.length || covPop.missing.length !== covLegacy.missing.length ? 1 : 0;
      }
    }
  }
}
for (const c of citizenCases) { const r = num2(c.rate); if (r === 1) stats.branchRateIsOne++; else stats.branchRateNotOne++; if (VARIANTS[c.v].id === 'real' && r !== 1) stats.realEraRateAboveOne++; }

// display niezalezny od tabeli: coverage z recznie zadana stawka (Option<f64>: undefined/NaN/0/ujemna/ulamek)
const displayCases = [];
{
  const M = mods[0];
  const covs = [
    { available: ['drewno', 'glina'], missing: ['kamien'] },
    { available: [], missing: ['drewno', 'glina', 'kamien', 'ceramika'] },
    { available: ['cegla'], missing: [] },
    { available: [], missing: [] },
  ];
  const rates = [undefined, NaN, 0, 1, 2, 3, 2.5, -1, Infinity];
  const pops = [NaN, -3, 0, 0.9, 1, 3.7, 10, 53, 1e6, Infinity];
  for (const cov of covs) for (const rate of rates) for (const cityPop of pops) {
    const coverage = rate === undefined ? { ...cov } : { ...cov, ratePerCitizen: rate };
    const lines = M.citizenUpkeepDisplayLines(coverage, cityPop).map((l) => ({ key: l.key, value: enc(l.value), available: l.available }));
    displayCases.push({ available: cov.available, missing: cov.missing, rate: rate === undefined ? null : enc(rate), cityPop: enc(cityPop), lines });
  }
}

const rateGrid = [];
for (let vi = 0; vi < VARIANTS.length; vi++) for (const era of ERAS_FULL.concat([5, 6, 7, 1e9, -1e9])) {
  rateGrid.push({ v: vi, era: enc(era), rate: enc(mods[vi].citizenUpkeepRateForEra(era)), required: [...mods[vi].citizenRequiredResourcesForEra(era)] });
}

writeFileSync(join(outDir, 'citizen.json'), JSON.stringify({
  pin: PIN,
  variants: VARIANTS.map((v) => ({ id: v.id, rows: v.rows === null ? null : v.rows.map((r) => ({ epoka: r.epoka, nazwa: r.nazwa, rate: rateWire(r.rate), surowce: r.surowce })) })),
  realRates: realTable.epoki.map((r) => ({ epoka: r.epoka, stawka: r.stawkaNaObywatela })),
  cases: citizenCases, display: displayCases, rateGrid,
}) + '\n');

// ---------------------------------------------------------------- Spichlerz
const G = await bundle('gate', gateEntry, null);
const FB = G.SPICHLERZ_DRAIN_FALLBACK_PER_TURN;
const K = { ceramikaI: G.SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_I, ceramikaII: G.SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_II, solII: G.SPICHLERZ_DRAIN_JSON_KEY_SOL_II };
const DIFFS = ['easy', 'normal', 'hard', 'extreme'];
const rowKinds = [
  ['absent', undefined],
  ['null', null],
  ['number', 7],
  ['string', 'x'],
  ['array', [1, 2, 3]],
  ['empty-obj', {}],
  ['str-values', { easy: '25', normal: '30', hard: '40' }],
  ['nonfinite', { easy: NaN, normal: Infinity, hard: -Infinity }],
  ['neg-zero', { easy: -1, normal: -0, hard: 0 }],
  ['frac-huge', { easy: 0.5, normal: 1e308, hard: 7 }],
  ['bad-types', { easy: true, normal: null, hard: {} }],
  ['good', { easy: 12, normal: 30, hard: 60 }],
];
const budynkiShapes = [['null', null], ['string', 'x'], ['number', 5], ['array', []], ['absent', undefined]];
const paramCases = [];
const rawList = [];
rawList.push({ name: 'undefined', js: undefined });
rawList.push({ name: 'null', js: null });
rawList.push({ name: 'empty', js: {} });
rawList.push({ name: 'real-econ', js: realEcon });
for (const [n, b] of budynkiShapes) rawList.push({ name: 'budynki-' + n, js: b === undefined ? {} : { budynki: b } });
rawList.push({ name: 'string', js: 'x' });
rawList.push({ name: 'number', js: 3 });
for (let i = 0; i < rowKinds.length; i++) {
  const mk = (idx) => rowKinds[idx % rowKinds.length][1];
  const bu = {};
  const pick = [i, i + 3, i + 7];
  [K.ceramikaI, K.ceramikaII, K.solII].forEach((key, j) => { if (mk(pick[j]) !== undefined) bu[key] = mk(pick[j]); });
  rawList.push({ name: `rows-${rowKinds[pick[0] % 12][0]}/${rowKinds[pick[1] % 12][0]}/${rowKinds[pick[2] % 12][0]}`, js: { budynki: bu } });
}
const paramSet = [];
for (const r of rawList) for (const d of DIFFS) {
  const out = G.loadSpichlerzDrainParams(r.js, d);
  paramCases.push({ name: r.name, raw: r.js === undefined ? { undef: true } : { json: JSON.stringify(r.js) }, difficulty: d, out: { ceramikaI: enc(out.ceramikaI), ceramikaII: enc(out.ceramikaII), solII: enc(out.solII) } });
  paramSet.push(out);
}
// loadThroughput bezposrednio
const thrCases = [];
for (const [rn, rv] of rowKinds) for (const d of DIFFS) for (const fb of [25, 0.5, -3]) {
  const raw = { budynki: rv === undefined ? {} : { k: rv } };
  thrCases.push({ rowKind: rn, raw: JSON.stringify(raw), difficulty: d, fallback: enc(fb), out: enc(G.loadThroughput(raw, 'k', d, fb)) });
}

const PARAM_SAMPLES = [
  { ceramikaI: 25, ceramikaII: 25, solII: 25 },
  { ceramikaI: 10, ceramikaII: 40, solII: 7 },
  { ceramikaI: 40, ceramikaII: 10, solII: 33 },
  { ceramikaI: 0, ceramikaII: 0, solII: 0 },
  { ceramikaI: 1000, ceramikaII: 1000, solII: 1000 },
  { ceramikaI: 25.5, ceramikaII: 0.5, solII: 3 },
];
const pw = (p) => ({ ceramikaI: enc(p.ceramikaI), ceramikaII: enc(p.ceramikaII), solII: enc(p.solII) });
const BUILT = [[], ['spichlerz'], ['spichlerz_ii'], ['spichlerz', 'spichlerz_ii'], ['stolarnia'], ['spichlerz', 'stolarnia'], ['spichlerz_ii', 'kamieniarski']];
const amountCases = [];
for (const b of BUILT) for (const p of PARAM_SAMPLES) amountCases.push({ built: b, params: pw(p), out: enc(G.spichlerzCeramikaDrainAmount(b, p)) });

const cloneCities = (c) => JSON.parse(JSON.stringify(c, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? { $n: String(v) } : v)), (k, v) => (v && typeof v === 'object' && '$n' in v ? Number(v.$n) : v));
const view = (cities) => cities.map((c) => { const o = { id: c.id, ownerId: c.ownerId }; if (c.surowce) o.surowce = Object.fromEntries(Object.entries(c.surowce).map(([k, x]) => [k, enc(x)])); return o; });
const wireCities = (cities) => cities.map((c) => { const o = { id: c.id, ownerId: c.ownerId }; if (c.surowce) o.surowce = Object.fromEntries(Object.entries(c.surowce).map(([k, x]) => [k, enc(x)])); return o; });
const payCases = [];
const stockPts = (p) => [0, p - 1, p, p + 1, p * 3 + 0.5];
let cid = 0;
for (const p of PARAM_SAMPLES) for (const built of BUILT) {
  const cerPts = new Set([...stockPts(p.ceramikaI), ...stockPts(p.ceramikaII)]);
  for (const cer of cerPts) for (const sol of stockPts(p.solII)) {
    const split = Math.floor(rnd() * 3); // 0: jedno miasto; 1: dwa miasta ownera; 2: + cudze miasto
    const base = [{ id: 'c' + (cid++), ownerId: 1, surowce: { ceramika: cer, sol } }];
    if (split >= 1) { const half = Math.floor(cer / 2); base[0].surowce.ceramika = cer - half; base.push({ id: 'c' + (cid++), ownerId: 1, surowce: { ceramika: half, sol: 0, zloto: 3 } }); }
    if (split === 2) base.push({ id: 'c' + (cid++), ownerId: 2, surowce: { ceramika: 999, sol: 999 } });
    const pay = [false, true].map((dry) => {
      const cities = cloneCities(base);
      const out = G.paySpichlerzDrainForCity(cities, 1, built, dry, p);
      return { dry, out, after: view(cities) };
    });
    const inactive = {};
    for (const bid of ['spichlerz', 'spichlerz_ii']) {
      const cities = cloneCities(base);
      const st = G.resolveOwnedBuildingInactiveStatus(bid, { builtIds: built, allCities: cities, ownerId: 1, runtimeActiveBuiltIds: [], drainParams: p });
      inactive[bid] = st;
    }
    payCases.push({ cities: wireCities(base), owner: 1, built, params: pw(p), pay, inactive });
  }
}
stats.pay = payCases.length * 2; stats.paid = payCases.filter((c) => c.pay[0].out.ceramikaPaid).length; stats.solPaid = payCases.filter((c) => c.pay[0].out.solPaid).length;
stats.inactive = payCases.length * 2; stats.inactiveTrue = payCases.reduce((n, c) => n + Object.values(c.inactive).filter((x) => x.inactive).length, 0);
stats.params = paramCases.length; stats.thr = thrCases.length; stats.amount = amountCases.length;

writeFileSync(join(outDir, 'spichlerz.json'), JSON.stringify({
  pin: PIN, fallback: FB, keys: K, realEconKeys: Object.fromEntries(Object.values(K).map((k) => [k, realEcon.budynki[k]])),
  params: paramCases, throughput: thrCases, amount: amountCases, pay: payCases,
}) + '\n');
writeFileSync(join(outDir, 'stats.json'), JSON.stringify({ pin: PIN, ...stats }, null, 1) + '\n');
console.log(JSON.stringify({ pin: PIN, ...stats }));
