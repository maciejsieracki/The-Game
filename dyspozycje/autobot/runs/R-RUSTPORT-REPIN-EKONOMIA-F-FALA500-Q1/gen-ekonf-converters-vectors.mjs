// REPIN-EKONOMIA-F partia 2: regeneracja wektorow konwerterow z web origin/main (zamiast pinu 4bbef081d).
// Pochodna gen-p6-turn-econ-res-vectors.mjs; rozni sie: PIN=origin/main, throughputs przez
// converterThroughputsForEra (klucze '<id>#outMult'), runConverter z outputMultiplier, dodatkowe przypadki.
// Generator wektorow R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1 (pipeline zasobow per tura).
// (oryginalny) PIN weba: 4bbef081d. Kod weba URUCHAMIANY BEZ ZMIAN: gra/src/game/turn-economy.ts (z jednym dopisanym
// wierszem `export { tickEmpireResourcePipeline }` - funkcja jest prywatna, plugin esbuild dokleja eksport
// w pamieci, plik na dysku niezmieniony), gra/src/game/converters.ts, building-resource-gate.ts.
// Zrodla z `git archive 4bbef081d gra/src gra/data` do <WORK_DIR> poza repo (zero buildu/dev w gra/).
//
// Uruchomienie: node gen-p6-turn-econ-res-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
// (esbuild 0.28.2, node 22). Wyjscie deterministyczne (PRNG mulberry32 z ustalonym ziarnem).
//
// Kodowanie liczb jak w tests/p6_7b_vectors/common.rs: calkowite bezpieczne = liczby JSON; NaN/Infinity/-0 =
// napisy; reszta = "~<String(x)>".
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outDir] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outDir) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);

const built = await esbuild.build({
  stdin: {
    contents: `export { tickEmpireResourcePipeline as __tick, computeGarncarniaSurplusZadowolenieByOwner, applyStolarniaDrewnoMapInflow } from './turn-economy';
export * from './converters';
export { DEPOSIT_RUNTIME_GATED_BUILDING_IDS } from './building-resource-gate';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json' },
  plugins: [{ name: 'export-private', setup(b) {
    b.onLoad({ filter: /game[\\/]turn-economy\.ts$/ }, (a) => ({ contents: readFileSync(a.path, 'utf8') + '\nexport { tickEmpireResourcePipeline };\n', loader: 'ts' }));
  } }],
});
const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);

const enc = (x) => {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  if (Number.isSafeInteger(x)) return x;
  return '~' + String(x);
};
const encRec = (rec) => (rec == null ? null : Object.fromEntries(Object.keys(rec).sort().map((k) => [k, enc(rec[k])])));
const deepEnc = (v) => {
  if (typeof v === 'number') return enc(v);
  if (Array.isArray(v)) return v.map(deepEnc);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).map((k) => [k, deepEnc(v[k])]));
  return v;
};

// ------------------------------------------------------------------ PRNG
let seed = 0x5eed1234;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];

const KEYS = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon', 'cegla', 'ceramika', 'braz', 'zelazo', 'stal'];
const GATED = [...W.DEPOSIT_RUNTIME_GATED_BUILDING_IDS];
const BUILDINGS = ['spichlerz', 'spichlerz_ii', 'cegielnia', 'garncarnia', 'huta', 'odlewnia_brazu', 'odlewnia_zelaza', 'wielka_odlewnia', 'magazyn', 'stolarnia', 'kamieniarski', 'farma', ...GATED];
const TERR_KEYS = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon'];

function throughputsFor(era, scale) {
  return W.converterThroughputsForEra((r) => r.throughputFallback * scale, era);
}

// ------------------------------------------------------------------ scenariusze
const scenarios = [];
const add = (name, s) => scenarios.push({ name, ...s });
const base = (over) => ({
  cities: [], built: {}, terr: {}, worked: {}, stol: {}, kam: {}, stolBonus: 0.1, kamBonus: 0.1,
  throughputs: {}, cap: {}, labels: null, zloto: null, drain: { ceramikaI: 25, ceramikaII: 25, solII: 25 },
  ...over,
});
const sur = (o) => o;

// Brzegi Spichlerza I/II: zapas = drain-1 / drain / drain+1 (N-1/N/N+1), Ceramika i Sol osobno.
for (const [dr, label] of [[25, 'real25'], [3, 'custom3']]) {
  for (const delta of [-1, 0, 1]) {
    const stock = dr + delta;
    add(`edge-I-ceramika-${label}-${delta}`, base({
      cities: [{ id: 'c1', owner: 1, surowce: sur({ ceramika: stock }) }], built: { c1: ['spichlerz'] },
      cap: { 1: 1000 }, throughputs: { 1: throughputsFor(1, 1) }, drain: { ceramikaI: dr, ceramikaII: dr + 2, solII: dr + 4 },
    }));
    add(`edge-II-ceramika-${label}-${delta}`, base({
      cities: [{ id: 'c1', owner: 1, surowce: sur({ ceramika: dr + 2 + delta, sol: 1000 }) }], built: { c1: ['spichlerz_ii'] },
      cap: { 1: 5000 }, throughputs: { 1: throughputsFor(1, 1) }, drain: { ceramikaI: dr, ceramikaII: dr + 2, solII: dr + 4 },
    }));
    add(`edge-II-sol-${label}-${delta}`, base({
      cities: [{ id: 'c1', owner: 1, surowce: sur({ ceramika: 1000, sol: dr + 4 + delta }) }], built: { c1: ['spichlerz_ii'] },
      cap: { 1: 5000 }, throughputs: { 1: throughputsFor(1, 1) }, drain: { ceramikaI: dr, ceramikaII: dr + 2, solII: dr + 4 },
    }));
    // dwa Spichlerze I: pierwszy placi, drugi tylko gdy zapas >= 2*drain
    add(`edge-two-I-${label}-${delta}`, base({
      cities: [{ id: 'a', owner: 1, surowce: sur({ ceramika: Math.floor(stock / 2) }) }, { id: 'b', owner: 1, surowce: sur({ ceramika: stock - Math.floor(stock / 2) }) }],
      built: { a: ['spichlerz'], b: ['spichlerz'] }, cap: { 1: 1000 }, throughputs: { 1: throughputsFor(1, 1) },
      drain: { ceramikaI: dr, ceramikaII: dr, solII: dr },
    }));
    // stan "brak surowca -> brak bonusow ludnosci" po Garncarni: produkcja w tej samej turze utrzymuje Spichlerz
    add(`edge-garncarnia-feeds-spichlerz-${label}-${delta}`, base({
      cities: [{ id: 'g', owner: 1, surowce: sur({ glina: dr + delta, drewno: dr + delta }) }, { id: 's', owner: 1, surowce: null }],
      built: { g: ['garncarnia'], s: ['spichlerz'] }, cap: { 1: 1000 }, throughputs: { 1: throughputsFor(1, 1) },
      drain: { ceramikaI: dr, ceramikaII: dr, solII: dr },
    }));
  }
}
add('no-stock-no-bonus', base({
  cities: [{ id: 'c1', owner: 1, surowce: null }, { id: 'c2', owner: 1, surowce: {} }], built: { c1: ['spichlerz'], c2: ['spichlerz_ii'] },
  cap: { 1: 100 }, throughputs: { 1: throughputsFor(1, 1) },
}));
// Bonus Garncarni: ulamkowa nadwyzka Ceramiki (floor: 0.5 -> 0 => brak bonusu; 1.5 -> 1 => bonus), z Spichlerzem i bez.
for (const [cer, withSp] of [[0.5, false], [1.5, false], [0.99, false], [25.5, true], [26, true], [24.5, true], [50.5, true]]) {
  add(`garn-fractional-${cer}-${withSp ? 'sp' : 'nosp'}`, base({
    cities: [{ id: 'g', owner: 1, surowce: sur({ ceramika: cer }) }], built: { g: withSp ? ['garncarnia', 'spichlerz'] : ['garncarnia'] },
    cap: { 1: 1000 }, throughputs: { 1: throughputsFor(1, 1) },
  }));
}
add('garn-other-owner-has-garncarnia', base({
  cities: [{ id: 'a', owner: 1, surowce: sur({ ceramika: 9 }) }, { id: 'b', owner: 2, surowce: sur({ ceramika: 9 }) }],
  built: { a: [], b: ['garncarnia'] }, cap: { 1: 100, 2: 100 }, throughputs: { 1: throughputsFor(1, 1), 2: throughputsFor(1, 1) },
}));
add('empty-cities',base({ cities: [], cap: {}, throughputs: {} }));
add('inflow-cap-clamp', base({
  cities: [{ id: 'c1', owner: 1, surowce: sur({ drewno: 95, kamien: 98 }) }], built: { c1: [] },
  terr: { c1: { drewno: 20, kamien: 20, glina: 7.9, ruda: 1.5 } }, worked: { c1: { drewno: 3, kamien: 1, glina: 0.4 } },
  stol: { 1: 3 }, kam: { 1: 2 }, cap: { 1: 100 }, throughputs: { 1: throughputsFor(1, 1) },
}));

// losowe
for (let i = 0; i < 420; i++) {
  const nOwners = ri(1, 3);
  const nCities = ri(1, 7);
  const cities = [];
  const builtMap = {};
  const terr = {};
  const worked = {};
  for (let c = 0; c < nCities; c++) {
    const id = pick(['c', 'a', 'Z', 'b', 'Ab', '10', '9']) + c;
    const owner = ri(1, nOwners);
    const hasStock = rnd() < 0.85;
    const surowce = hasStock ? {} : null;
    if (hasStock) for (const k of KEYS) if (rnd() < 0.5) surowce[k] = rnd() < 0.15 ? ri(0, 6) + (rnd() < 0.3 ? 0.5 : 0) : ri(0, 80);
    cities.push({ id, owner, surowce });
    const nb = ri(0, 5);
    const b = [];
    for (let j = 0; j < nb; j++) { const x = pick(BUILDINGS); if (!b.includes(x)) b.push(x); }
    if (rnd() < 0.9) builtMap[id] = b;
    if (rnd() < 0.7) {
      const t = {};
      for (const k of TERR_KEYS) if (rnd() < 0.45) t[k] = rnd() < 0.2 ? pick([0, -1, 0.4, 2.5]) : ri(1, 30);
      terr[id] = t;
    }
    if (rnd() < 0.6) worked[id] = { drewno: ri(0, 12) + (rnd() < 0.3 ? 0.5 : 0), kamien: ri(0, 8), glina: ri(0, 8) };
  }
  const owners = [...new Set(cities.map((c) => c.owner))];
  const cap = {}, thr = {}, stol = {}, kam = {};
  for (const o of owners) {
    cap[o] = pick([10, 25, 50, 100, 500, 100.5]);
    thr[o] = throughputsFor(ri(0, 4), pick([0.1, 0.5, 1, 1, 2]));
    if (rnd() < 0.2) delete thr[o][pick(Object.keys(thr[o]))]; // brak wpisu -> fallback
    if (rnd() < 0.5) stol[o] = ri(0, 4);
    if (rnd() < 0.5) kam[o] = ri(0, 3);
  }
  const labelsOn = rnd() < 0.6;
  const labels = labelsOn ? Object.fromEntries(owners.map((o) => [o, ['x' + o]])) : null;
  const zloto = labelsOn && rnd() < 0.7 ? Object.fromEntries(owners.map((o) => [o, rnd() < 0.5])) : null;
  const dr = rnd() < 0.5 ? { ceramikaI: 25, ceramikaII: 25, solII: 25 } : { ceramikaI: ri(0, 12), ceramikaII: ri(0, 12) + 0.5, solII: ri(0, 12) };
  add(`rnd-${i}`, base({ cities, built: builtMap, terr, worked, stol, kam, stolBonus: pick([0.1, 0, 0.25]), kamBonus: pick([0.1, 0, 0.3]), throughputs: thr, cap, labels, zloto, drain: dr }));
}

// ------------------------------------------------------------------ uruchomienie weba
function runWeb(s) {
  const cities = s.cities.map((c) => (c.surowce === null ? { id: c.id, ownerId: c.owner } : { id: c.id, ownerId: c.owner, surowce: { ...c.surowce } }));
  const builtByCity = new Map(Object.entries(s.built).map(([k, v]) => [k, v.slice()]));
  const terrMap = new Map(Object.entries(s.terr).map(([k, v]) => [k, { ...v }]));
  const workedMap = new Map(Object.entries(s.worked).map(([k, v]) => [k, { ...v }]));
  const num = (o) => new Map(Object.entries(o).map(([k, v]) => [Number(k), v]));
  const labelsFn = s.labels ? (o) => s.labels[o] : undefined;
  const zlotoFn = s.zloto ? (o) => s.zloto[o] : undefined;
  const drain = { ceramikaI: s.drain.ceramikaI, ceramikaII: s.drain.ceramikaII, solII: s.drain.solII };
  const garnPre = W.computeGarncarniaSurplusZadowolenieByOwner(cities, builtByCity, false, drain);
  const spich = W.__tick(
    cities, builtByCity, terrMap, workedMap, num(s.stol), num(s.kam), s.stolBonus, s.kamBonus,
    (o) => s.throughputs[o], (o) => s.cap[o], labelsFn, zlotoFn, drain,
  );
  const garnTrue = W.computeGarncarniaSurplusZadowolenieByOwner(cities, builtByCity, true, drain);
  const garnFalsePost = W.computeGarncarniaSurplusZadowolenieByOwner(cities, builtByCity, false, drain);
  const mapOut = (m) => Object.fromEntries([...m.entries()].map(([k, v]) => [String(k), enc(v)]));
  return {
    cities: cities.map((c) => ({ id: c.id, surowce: c.surowce === undefined ? null : encRec(c.surowce) })),
    spichlerz: Object.fromEntries([...spich.entries()].map(([k, v]) => [k, v])),
    garnPre: mapOut(garnPre), garnTrue: mapOut(garnTrue), garnFalsePost: mapOut(garnFalsePost),
  };
}
const SOLEXPORT = null; // mapy _spichlerzSol* sa modulowe; wyprowadzane z `solActive` (kontrakt weba :1800-1805).

for (const s of scenarios) s.out = runWeb(s);

// ------------------------------------------------------------------ wektory konwerterow
const convCases = [];
const storesPool = [{}, { glina: 10, drewno: 10 }, { glina: 1, drewno: 10 }, { glina: 5, drewno: 0 }, { ruda: 7, drewno: 7, ruda_cyny: 0.3 }, { ruda: 7, drewno: 7, ruda_cyny: 0.1 },
  { ruda_zelaza: 5, drewno: 5, zelazo: 3 }, { zelazo: 2, drewno: 9 }, { glina: NaN, drewno: 4 }, { glina: -4, drewno: 4 }, { glina: Infinity, drewno: 3 }, { cegla: 95, glina: 100, drewno: 100 }, { ceramika: 49.5, glina: 9, drewno: 9 }];
for (const recipe of W.DEFAULT_CONVERTER_RECIPES) {
  for (const stores of storesPool) {
    for (const tput of [0, 1, 2.9, 50, NaN, -3, Infinity]) {
      for (const outCap of [0, 1, 10, 100, NaN]) {
        const oms = (tput === 2.9 || tput === 50) && (outCap === 10 || outCap === 100) ? [1, 1.5, 2, 3, NaN, 0, -1] : [1];
        for (const om of oms) {
          const r = W.runConverter(recipe, stores, tput, outCap, om);
          convCases.push({ recipe: recipe.id, stores: deepEnc(stores), tput: enc(tput), outCap: enc(outCap), outMult: enc(om), out: { produced: enc(r.produced), cykle: enc(r.cykle), consumed: encRec(r.consumed), stores: encRec(r.stores), reason: r.reason } });
        }
      }
    }
  }
}
const eraCases = [];
const ERAS = [-1, 0, 0.999, 1, 1.001, 1.999, 2, 2.001, 3, 4, 4.5, 5, 6, NaN, Infinity, -Infinity];
for (const id of ['cegielnia', 'garncarnia', 'huta', 'odlewnia_brazu', 'odlewnia_zelaza__braz', 'odlewnia_zelaza__zelazo', 'wielka_odlewnia__braz', 'wielka_odlewnia__zelazo', 'wielka_odlewnia__stal', 'nieznany']) {
  for (const base_ of [0, 10, 50, 3.3]) for (const era of ERAS) eraCases.push({ id, base: enc(base_), era: enc(era), out: enc(W.converterThroughputForEra(id, base_, era)) });
}
const outMultCases = [];
for (const id of ['cegielnia', 'garncarnia', 'huta', 'odlewnia_brazu', 'wielka_odlewnia__stal', 'nieznany']) {
  for (const era of ERAS) outMultCases.push({ id, era: enc(era), out: enc(W.converterOutputMultiplierForEra(id, era)) });
}
const inflowCases = [];
for (const b of [0, -1, NaN, Infinity, 1, 7, 7.5, 10]) for (const n of [0, 1, 2, 3.7, -2, NaN]) for (const bonus of [0, 0.1, 0.25]) inflowCases.push({ base: enc(b), n: enc(n), bonus: enc(bonus), out: enc(W.applyStolarniaDrewnoMapInflow(b, n, bonus)) });

const out = {
  pin: PIN,
  recipes: W.DEFAULT_CONVERTER_RECIPES.map((r) => ({ id: r.id, buildingId: r.buildingId ?? null, inputs: Object.entries(r.inputs).map(([k, v]) => [k, enc(v)]), output: r.output, outputAmount: r.outputAmount, key: r.throughputParamKey, fallback: r.throughputFallback })),
  scenarios: scenarios.map((s) => ({
    name: s.name,
    cities: s.cities.map((c) => ({ id: c.id, owner: c.owner, surowce: c.surowce === null ? null : encRec(c.surowce) })),
    built: s.built, terr: deepEnc(s.terr), worked: deepEnc(s.worked), stol: deepEnc(s.stol), kam: deepEnc(s.kam),
    stolBonus: enc(s.stolBonus), kamBonus: enc(s.kamBonus),
    throughputs: Object.fromEntries(Object.entries(s.throughputs).map(([o, t]) => [o, encRec(t)])),
    cap: deepEnc(s.cap), labels: s.labels, zloto: s.zloto, drain: deepEnc(s.drain), out: s.out,
  })),
  convCases, eraCases, outMultCases, inflowCases,
};
mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(out);
writeFileSync(join(outDir, 'pipeline.json'), text);
console.log('scenarios', scenarios.length, 'conv', convCases.length, 'era', eraCases.length, 'inflow', inflowCases.length, 'bytes', text.length);
