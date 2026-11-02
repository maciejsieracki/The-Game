// Generator wektorow R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1 (plastry zasobowe advanceCityEconomy).
// PIN weba: 4bbef081d. Uruchamiany jest PRAWDZIWY `advanceCityEconomy` (gra/src/game/turn-economy.ts) na
// minimalnej mapie i prawdziwym `loadGameData()`, bez zmian kodu na dysku. Instrumentacja W PAMIECI (plugin
// esbuild, plik zrodlowy nietkniety): tuz przed wywolaniem `tickEmpireResourcePipeline` (linia 2482 pinu)
// zapisywane sa wartosci posrednie (liczniki, cap, przepustowosci, zbior Mennic, bonusy), a wejscia terenowe
// moga zostac podmienione na wstrzykniete (`globalThis.__inject`) - te same mapy dostaje Rust.
// Zrodla z czystego `git archive 4bbef081d gra/src gra/data` do <WORK_DIR> poza repo (zero buildu/dev w gra/).
//
// Uruchomienie: node gen-p6-adv-city-econ-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
// Wyjscie deterministyczne (PRNG mulberry32, ustalone ziarno). Kodowanie liczb: jak p6_7b_vectors/common.rs.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outDir] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outDir) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '4bbef081d'], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);

const CALL_HEAD = `  const spichlerzByCity = tickEmpireResourcePipeline(
    cities,
    builtByCity,
    territoryResourceByCity,
    workedMagazynByCity,`;
const CAPTURE = `  globalThis.__cap = {
    stol: [...stolarniaCountByOwner], kam: [...kamieniarskiCountByOwner], mag: [...magazynCountByOwner],
    mennica: [...mennicaOwners], stolBonus: stolarniaBonusDrewnaCiv, kamBonus: kamieniarskiBonusKamieniaCiv,
    owners: [...new Set(cities.map((c) => c.ownerId))].map((o) => [o, ownerResourceCapFor(o), converterThroughputsForOwner(o)]),
    terr: [...territoryResourceByCity], worked: [...workedMagazynByCity],
  };
  const spichlerzByCity = tickEmpireResourcePipeline(
    cities,
    builtByCity,
    globalThis.__inject ? globalThis.__inject.terr : territoryResourceByCity,
    globalThis.__inject ? globalThis.__inject.worked : workedMagazynByCity,`;

const built = await esbuild.build({
  stdin: {
    contents: `export { advanceCityEconomy } from './turn-economy';
export { loadGameData } from '../data/loader';
export * from './converters';
export { DEPOSIT_RUNTIME_GATED_BUILDING_IDS } from './building-resource-gate';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  plugins: [{ name: 'capture', setup(b) {
    b.onLoad({ filter: /game[\\/]turn-economy\.ts$/ }, (a) => {
      const src = readFileSync(a.path, 'utf8');
      if (src.split(CALL_HEAD).length !== 2) throw new Error('CALL_HEAD: oczekiwano dokladnie 1 wystapienia');
      return { contents: src.replace(CALL_HEAD, CAPTURE), loader: 'ts' };
    });
  } }],
});
const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);
const DATA = W.loadGameData();

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

let seed = 0xad7a1c11;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];

const KEYS = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon', 'cegla', 'ceramika', 'braz', 'zelazo', 'stal'];
const TERR_KEYS = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon'];
const GATED = [...W.DEPOSIT_RUNTIME_GATED_BUILDING_IDS];
const PLAIN_B = ['magazyn', 'mennica', 'farma', 'akwedukt'];
const FULL_B = ['spichlerz', 'spichlerz_ii', 'cegielnia', 'garncarnia', 'huta', 'odlewnia_brazu', 'odlewnia_zelaza', 'wielka_odlewnia', 'magazyn', 'magazyn', 'stolarnia', 'kamieniarski', 'mennica', 'farma', ...GATED];
const LABELS = ['x', 'zloto', 'zelazo', 'braz', 'sol', 'kon', 'ruda', 'glina', 'kamien', 'drewno', 'Zloto'];
const TECHS = ['Waluta', 'waluta', 'Pismo', 'Brąz'];

// econ-params: dokladnie klucze czytane przez plastry zasobowe; kazdy moze byc pominiety/zepsuty (fallback).
const ECON_KEYS = {
  globalne: ['magazyn_baza_surowce', 'magazyn_bonus_surowce_na_budynek'],
  budynki: ['budynek_cegielnia_przepustowosc', 'budynek_garncarnia_przepustowosc', 'budynek_huta_przepustowosc',
    'budynek_odlewnia_zelaza_przepustowosc', 'budynek_wielka_odlewnia_przepustowosc',
    'budynek_stolarnia_bonus_drewna_civ', 'budynek_kamieniarski_bonus_kamienia_civ',
    'budynek_spichlerz_zuzywa_ceramika', 'budynek_spichlerz_ii_zuzywa_ceramika', 'budynek_spichlerz_ii_zuzywa_sol'],
};
function econValue(g) {
  const val = (key) => {
    if (key === 'magazyn_baza_surowce') return pick([20, 40, 80, 150, 500.5]);
    if (key === 'magazyn_bonus_surowce_na_budynek') return pick([0, 5, 10, 25.5]);
    if (key.includes('bonus_')) return pick([0, 0.1, 0.25, 0.5]);
    if (key.includes('zuzywa')) return pick([0, 1, 2, 4.5, 8]);
    return pick([0, 5, 12.5, 25, 50, 60]);
  };
  const out = { globalne: {}, budynki: {} };
  for (const grp of ['globalne', 'budynki']) {
    for (const key of ECON_KEYS[grp]) {
      const r = rnd();
      if (r < 0.08) continue; // brak klucza -> fallback
      if (r < 0.12) { out[grp][key] = { easy: 'x', normal: 'x', hard: 'x' }; continue; } // nie-liczba -> fallback
      out[grp][key] = { easy: val(key), normal: val(key), hard: val(key) };
    }
  }
  return out;
}
function webData(econ) {
  const d = { ...DATA, econParams: JSON.parse(JSON.stringify(DATA.econParams)) };
  for (const grp of ['globalne', 'budynki']) {
    d.econParams[grp] = d.econParams[grp] || {};
    for (const key of ECON_KEYS[grp]) {
      if (econ[grp][key] === undefined) delete d.econParams[grp][key];
      else d.econParams[grp][key] = { ...econ[grp][key] };
    }
  }
  return d;
}

const MAP = { szerokoscQ: 7, wysokoscR: 7, hexes: {}, seed: 1, rzeki: [] };
for (let q = 0; q < 7; q++) for (let r = 0; r < 7; r++) MAP.hexes[q + ',' + r] = { q, r, terenBazowy: 'Rownina', nakladka: 'Brak' };

function genScenario(i, cls) {
  const plain = cls === 'plain';
  const nC = ri(1, plain ? 6 : 7);
  const owners = [0, 1, 2].slice(0, ri(1, 3));
  const cells = [];
  for (let q = 0; q < 7; q++) for (let r = 0; r < 7; r++) cells.push([q, r]);
  const cities = [];
  const built = {};
  const terr = {};
  const worked = {};
  for (let c = 0; c < nC; c++) {
    const id = pick(['c', 'a', 'Z', 'b', 'Ab', '10', '9']) + c;
    const owner = pick(owners);
    const [q, r] = cells.splice(ri(0, cells.length - 1), 1)[0];
    const hasStock = rnd() < 0.85;
    const surowce = hasStock ? {} : null;
    if (hasStock) for (const k of KEYS) if (rnd() < (plain ? 0.6 : 0.5)) surowce[k] = rnd() < 0.15 ? ri(0, 6) + (rnd() < 0.3 ? 0.5 : 0) : ri(0, plain ? 120 : 80);
    cities.push({ id, owner, q, r, surowce });
    const nb = ri(0, plain ? 4 : 6);
    const b = [];
    for (let j = 0; j < nb; j++) { const x = pick(plain ? PLAIN_B : FULL_B); if (!b.includes(x)) b.push(x); }
    if (rnd() < 0.92) built[id] = b;
    if (!plain && rnd() < 0.6) {
      const t = {};
      for (const k of TERR_KEYS) if (rnd() < 0.4) t[k] = rnd() < 0.2 ? pick([0, -1, 0.4, 2.5]) : ri(1, 30);
      terr[id] = t;
    }
    if (!plain && rnd() < 0.5) worked[id] = { drewno: ri(0, 12) + (rnd() < 0.3 ? 0.5 : 0), kamien: ri(0, 8), glina: ri(0, 8) };
  }
  const own = [...new Set(cities.map((c) => c.owner))];
  const eraOn = rnd() < 0.6;
  const eraByOwner = eraOn ? Object.fromEntries(own.map((o) => [o, pick([1, 1, 2, 3, 4, 5, 1.5])])) : null;
  const techOn = rnd() < 0.7;
  const techByOwner = techOn ? Object.fromEntries(own.map((o) => [o, rnd() < 0.7 ? [pick(TECHS)] : []])) : null;
  const zlotoByOwner = rnd() < 0.6 ? Object.fromEntries(own.map((o) => [o, rnd() < 0.6])) : null;
  const labelsOn = !plain && rnd() < 0.6;
  const labelsByOwner = labelsOn ? Object.fromEntries(own.map((o) => [o, LABELS.filter(() => rnd() < 0.5)])) : null;
  const stockOn = !plain && rnd() < 0.3;
  const stockByOwner = stockOn ? Object.fromEntries(own.map((o) => [o, Object.fromEntries(KEYS.filter(() => rnd() < 0.4).map((k) => [k, ri(0, 40)]))])) : null;
  return {
    name: `${cls}-${i}`, cls, difficulty: pick(['easy', 'normal', 'hard']), econ: econValue(), playerEra: pick([1, 1, 2, 3]),
    playerZbadane: rnd() < 0.5 ? [pick(TECHS)] : [], eraByOwner, techByOwner, zlotoByOwner, labelsByOwner, stockByOwner,
    cities, built, terr, worked,
  };
}

function runWeb(s) {
  const cities = s.cities.map((c) => (c.surowce === null ? { id: c.id, ownerId: c.owner, q: c.q, r: c.r, name: c.id, population: 3 } : { id: c.id, ownerId: c.owner, q: c.q, r: c.r, name: c.id, population: 3, surowce: { ...c.surowce } }));
  const builtByCity = new Map(Object.entries(s.built).map(([k, v]) => [k, v.slice()]));
  const byOwner = (m, f = (x) => x) => (m ? (o) => f(m[o]) : undefined);
  const resolveOwnerEra = s.eraByOwner ? (o) => s.eraByOwner[o] : undefined;
  const resolveOwnerTech = s.techByOwner ? (o) => new Set(s.techByOwner[o]) : undefined;
  const resolveOwnerZlotoAccess = s.zlotoByOwner ? (o) => s.zlotoByOwner[o] : () => true;
  const resolveOwnerActiveLabels = byOwner(s.labelsByOwner);
  const resolveOwnerEmpireStock = byOwner(s.stockByOwner);
  globalThis.__inject = { terr: new Map(Object.entries(s.terr).map(([k, v]) => [k, { ...v }])), worked: new Map(Object.entries(s.worked).map(([k, v]) => [k, { ...v }])) };
  const res = W.advanceCityEconomy(
    cities, MAP, webData(s.econ), s.difficulty, [], new Map(), builtByCity, s.playerEra, new Set(s.playerZbadane), new Map(), new Map(),
    resolveOwnerEra, resolveOwnerTech, 'wysoki', new Map(), new Map(), new Map(), new Map(),
    resolveOwnerZlotoAccess, resolveOwnerActiveLabels, resolveOwnerEmpireStock,
  );
  globalThis.__inject = undefined;
  const cap = globalThis.__cap;
  const num = (m) => Object.fromEntries(m.map(([k, v]) => [String(k), enc(v)]));
  return {
    cities: cities.map((c) => ({ id: c.id, surowce: c.surowce === undefined ? null : encRec(c.surowce) })),
    perCity: res.perCity.map((t) => ({ id: t.cityId, maSpichlerz: t.maSpichlerz, maSpichlerzII: t.maSpichlerzII, spichlerzCeramika: t.spichlerzCeramika, spichlerzSol: t.spichlerzSol, garncarnia: enc(t.garncarniaSurplusZadowolenie) })),
    cap: Object.fromEntries(cap.owners.map(([o, c]) => [String(o), enc(c)])),
    thr: Object.fromEntries(cap.owners.map(([o, , t]) => [String(o), encRec(t)])),
    stol: num(cap.stol), kam: num(cap.kam), mag: num(cap.mag), mennica: cap.mennica.map(String).sort(),
    stolBonus: enc(cap.stolBonus), kamBonus: enc(cap.kamBonus),
    webTerrEmpty: cap.terr.length === 0 && cap.worked.every(([, v]) => v.drewno === 0 && v.kamien === 0 && v.glina === 0),
  };
}

const scenarios = [];
for (let i = 0; i < 230; i++) scenarios.push(genScenario(i, 'plain'));
for (let i = 0; i < 250; i++) scenarios.push(genScenario(i, 'full'));
// scenariusze brzegowe N-1/N/N+1 (klasa `plain`, wiec liczone tez niezaleznym weryfikatorem Pythona):
// prog drenazu Mennicy (zloto 0.5/1/1.5/2), cap panstwa (cap-1/cap/cap+1) dla 0/1/2 Magazynow i epok 1/2.
const econFixed = (base, bonus) => ({ globalne: { magazyn_baza_surowce: { easy: base, normal: base, hard: base }, magazyn_bonus_surowce_na_budynek: { easy: bonus, normal: bonus, hard: bonus } }, budynki: {} });
const edge = (name, { built, surowce, base = 20, bonus = 5, era = null, tech = ['Waluta'], zloto = null, extra = [] }) => ({
  name, cls: 'plain', difficulty: 'normal', econ: econFixed(base, bonus), playerEra: 1, playerZbadane: [],
  eraByOwner: era === null ? null : { 0: era }, techByOwner: { 0: tech }, zlotoByOwner: zloto === null ? null : { 0: zloto }, labelsByOwner: null, stockByOwner: null,
  cities: [{ id: 'e0', owner: 0, q: 1, r: 1, surowce }, ...extra], built: { e0: built, ...Object.fromEntries(extra.map((c) => [c.id, c.built])) }, terr: {}, worked: {},
});
for (const z of [0, 0.5, 0.999, 1, 1.5, 2]) scenarios.push(edge(`plain-edge-mennica-zloto-${z}`, { built: ['mennica'], surowce: { zloto: z, drewno: 3 } }));
for (const z of [1, 2]) {
  scenarios.push(edge(`plain-edge-mennica-no-tech-${z}`, { built: ['mennica'], surowce: { zloto: z }, tech: ['Pismo'] }));
  scenarios.push(edge(`plain-edge-mennica-no-access-${z}`, { built: ['mennica'], surowce: { zloto: z }, zloto: false }));
  scenarios.push(edge(`plain-edge-mennica-waluta-lower-${z}`, { built: ['mennica'], surowce: { zloto: z }, tech: ['waluta'] }));
}
for (const mag of [0, 1, 2]) for (const era of [null, 1, 2]) {
  const cap = (20 + 5 * mag) * (era === 2 ? 2 : 1);
  for (const d of [-1, 0, 1]) {
    const extra = mag === 2 ? [{ id: 'e1', owner: 0, q: 3, r: 3, surowce: { drewno: 2 }, built: ['magazyn'] }] : [];
    scenarios.push(edge(`plain-edge-cap-m${mag}-e${era}-d${d}`, { built: mag >= 1 ? ['magazyn'] : [], surowce: { drewno: cap + d - (mag === 2 ? 2 : 0), kamien: cap + d }, era, extra }));
  }
}
for (const s of scenarios) {
  s.out = runWeb(s);
  if (!s.out.webTerrEmpty) throw new Error('web zwrocil niepuste wejscia terenowe na plaskiej mapie: ' + s.name);
}

// przepustowosci: kompozycja weba (turn-economy.ts:2330-2352) = loadThroughput + converterThroughputForEra
const thrCases = [];
for (let i = 0; i < 40; i++) {
  const econ = econValue();
  const raw = webData(econ).econParams;
  for (const era of [0, 1, 1.5, 2, 3, 6, NaN, Infinity, -1]) {
    const diff = pick(['easy', 'normal', 'hard']);
    const out = {};
    for (const r of W.DEFAULT_CONVERTER_RECIPES) out[r.id] = enc(W.converterThroughputForEra(r.id, W.loadThroughput(raw, r.throughputParamKey, diff, r.throughputFallback), era));
    thrCases.push({ econ, difficulty: diff, era: enc(era), out });
  }
}
// luka FC poprzedniego tematu: ceramikaHappinessBonus (converters.ts:299-305) z URUCHOMIONEGO weba
const happyCases = [];
for (const v of [0, -0, 0.5, 1, 7, -1, NaN, Infinity, -Infinity]) for (const g of [true, false]) happyCases.push({ v: enc(v), g, out: enc(W.ceramikaHappinessBonus(v, g)) });

const out = {
  pin: PIN,
  scenarios: scenarios.map((s) => ({
    name: s.name, cls: s.cls, difficulty: s.difficulty, econ: s.econ, playerEra: s.playerEra, playerZbadane: s.playerZbadane,
    eraByOwner: s.eraByOwner, techByOwner: s.techByOwner, zlotoByOwner: s.zlotoByOwner, labelsByOwner: s.labelsByOwner, stockByOwner: s.stockByOwner,
    cities: s.cities.map((c) => ({ id: c.id, owner: c.owner, surowce: c.surowce === null ? null : encRec(c.surowce) })),
    built: s.built, terr: deepEnc(s.terr), worked: deepEnc(s.worked), out: s.out,
  })),
  thrCases, happyCases,
};
mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(out);
writeFileSync(join(outDir, 'advance.json'), text);
console.log('scenarios', scenarios.length, 'thr', thrCases.length, 'happy', happyCases.length, 'bytes', text.length);
