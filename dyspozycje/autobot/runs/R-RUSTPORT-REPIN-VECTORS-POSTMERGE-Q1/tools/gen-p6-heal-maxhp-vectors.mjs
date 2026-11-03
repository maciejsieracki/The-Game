// Generator wektorow R-RUSTPORT-P6-ECON-TICK-HEAL-MAXHP-Q1 (pin weba 4bbef081d, czysty `git archive`).
// URUCHAMIANE sa PRAWDZIWE: effectiveMaxHp (unit-card-stats.ts:79), unitParametryBonusFrac (unit-building-bonuses.ts:344),
// veteran* (veteran.ts:95-141), tickManpowerUnitReplenishment (manpower.ts:277) przez advanceCityEconomy (turn-economy.ts:2887).
// PRZEPISANE (main.ts nieimportowalny, zakaz buildu w gra/): normFieldVal (main.ts:29777), unitHealth (main.ts:29877)
// i closure getMaxHp (main.ts:34561-34568) - tresc 1:1 ponizej, oznaczone numerami linii.
// Uzycie: node gen-p6-heal-maxhp-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outDir] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outDir) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '23dd158e9'], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);

const HEAL_HEAD = `  if (manpowerHeal) {
    tickManpowerUnitReplenishment(`;
const HEAL_CAPTURE = `  globalThis.__pre = cities.map((c) => ({ id: c.id, ownerId: c.ownerId, population: c.population, manpower: c.manpower, q: c.q, r: c.r, oblegane: c.oblegane }));
  if (manpowerHeal) {
    globalThis.__healRes = tickManpowerUnitReplenishment(`;
const MATRIX_PATCH = {
  egipt: { mp_max_proc: 0.5, mp_koszt_jednostki_proc: -0.3 },
  sumer: { mp_max_proc: -1.5, mp_koszt_jednostki_proc: 1 },
  celtowie: { mp_max_proc: 2, mp_koszt_jednostki_proc: -2 },
  grecy: { mp_max_proc: 0.25 },
  rzymianie: { mp_koszt_jednostki_proc: 0.6 },
};

const built = await esbuild.build({
  stdin: {
    contents: `export { advanceCityEconomy } from './turn-economy';\nexport { effectiveMaxHp } from './unit-card-stats';\nexport { unitParametryBonusFrac } from './unit-building-bonuses';\nexport { veteranCombatBonusFrac, veteranStarCount, veteranBattlesWon, veteranBonusFracForWins } from './veteran';\nexport { loadGameData } from '../data/loader';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  plugins: [{ name: 'capture', setup(b) {
    b.onLoad({ filter: /game[\\/]turn-economy\.ts$/ }, (a) => {
      const src = readFileSync(a.path, 'utf8');
      if (src.split(HEAL_HEAD).length !== 2) throw new Error('HEAL_HEAD: oczekiwano dokladnie 1 wystapienia');
      return { contents: src.replace(HEAL_HEAD, HEAL_CAPTURE), loader: 'ts' };
    });
    b.onLoad({ filter: /data[\\/]civ-matrix\.json$/ }, (a) => {
      const m = JSON.parse(readFileSync(a.path, 'utf8'));
      for (const row of m.cywilizacje) if (MATRIX_PATCH[row.ikonaId]) Object.assign(row.params, MATRIX_PATCH[row.ikonaId]);
      return { contents: JSON.stringify(m), loader: 'json' };
    });
  } }],
});
const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);
const DATA = W.loadGameData();

// ---- main.ts:29777-29781 (1:1) ----
function normFieldVal(v, fallback) {
  if (v === null || v === undefined || v === '---' || v === '—' || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? fallback : n;
}
// ---- main.ts:29877-29879 (1:1) ----
function unitHealth(def) { return normFieldVal(def['health'] ?? def['Health'], 30); }
// ---- main.ts:34561-34568 (1:1): closure manpowerHeal.getMaxHp ----
function getMaxHp(typeId, liveUnit) {
  const def = DATA.units.find((ud) => ud.Jednostka === typeId) ?? {};
  return W.effectiveMaxHp(unitHealth(def), W.unitParametryBonusFrac(liveUnit), W.veteranCombatBonusFrac(liveUnit));
}

const enc = (x) => {
  if (x === undefined || x === null) return null;
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  if (Number.isSafeInteger(x)) return x;
  return '~' + String(x);
};
let seed = 0x7a31c0de;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];

// ---------- A. funkcje skladowe ----------
const NORM_INPUTS = [undefined, null, '---', '—', '', '40', ' 12abc', 'abc', '1e2', '.5', '-3', '0x10', 'Infinity', '-Infinity', '  7', '+8', '1.5e', '1e+', '5.', '.', '-', '1,5', 0, -5, 17.5, 22, 0.1, true, false, '0', ' 7', '1e400', '1e-400', '-.5e1x', '+.e1', 'Infinityx', 'infinity'];
// wynik normFieldVal/unitHealth moze byc boolem (true) - dalsze wyrazenia arytmetyczne koercja Number(): kodujemy ja jawnie
const encN = (x) => enc(typeof x === 'boolean' ? Number(x) : x);
const normVec = [];
for (const fb of [30, 0, 5.5, -1]) for (const v of NORM_INPUTS) {
  const o = { fb, out: encN(normFieldVal(v, fb)) };
  if (v !== undefined) o.v = v;
  normVec.push(o);
}
const defVec = [];
const HV = [undefined, null, 22, 0, -4, 17.5, '40', '---', '', 'abc', 'Infinity', true, 60, ' 9x'];
for (const lo of HV) for (const hi of HV) {
  const def = {};
  if (lo !== undefined) def.health = lo;
  if (hi !== undefined) def.Health = hi;
  defVec.push({ def, out: encN(unitHealth(def)) });
}
const rows = DATA.units.map((u) => u.Jednostka);

const emhVec = [];
const BASES = [0, 1, 10, 22, 30, 60, 100, 360, 3600, 24, 16, 0.5, -10, 33.3, 1e9];
const FRACS = [0, 0.1, 0.15, 0.2, 0.05, 0.3, 0.07, 0.12, 0.25, 0.01, -0.1, 1, 0.333, 0.8];
for (const b of BASES) for (const p of FRACS) for (const v of [0, 0.1, 0.15, 0.2]) emhVec.push({ b: enc(b), p: enc(p), v: enc(v), out: enc(W.effectiveMaxHp(b, p, v)) });
const SPECIAL = [NaN, Infinity, -Infinity, -0, 1e300];
for (const b of [...SPECIAL, 22]) for (const p of [...SPECIAL, 0.1]) emhVec.push({ b: enc(b), p: enc(p), v: enc(0.2), out: enc(W.effectiveMaxHp(b, p, 0.2)) });
for (let i = 0; i < 300; i++) { const b = pick([ri(1, 400), rnd() * 400, ri(1, 120) + 0.25]); const p = ri(0, 60) / 100; const v = pick([0, 0.1, 0.15, 0.2]); emhVec.push({ b: enc(b), p: enc(p), v: enc(v), out: enc(W.effectiveMaxHp(b, p, v)) }); }

const BATTLES = [undefined, null, 0, 1, 2, 3, 4, 5, 10, 99, 0.5, 1.9, 2.5, 2.999, 3.2, -1, -0, NaN, Infinity, -Infinity, '2', 'x'];
const vetVec = BATTLES.map((v) => {
  const u = v === undefined ? {} : { battlesSurvived: v };
  const o = { out: { won: enc(W.veteranBattlesWon(u)), stars: enc(W.veteranStarCount(u)), frac: enc(W.veteranCombatBonusFrac(u)) } };
  if (v === undefined) o.absent = true; else if (typeof v === 'string') o.str = v; else o.bs = enc(v);
  return o;
});
const winsVec = [-5, -1, 0, 0.5, 1, 1.5, 2, 2.9, 3, 4, 100, 1e9].map((w) => ({ w, out: enc(W.veteranBonusFracForWins(w)) }));
const PARAMS = [undefined, null, 0, 5, 10, 15, 20, 30.5, 100, -3, NaN, Infinity, '12', 7.7];
const parVec = PARAMS.map((p) => {
  const u = p === undefined ? {} : { parametryBonusProc: p };
  const o = { out: enc(W.unitParametryBonusFrac(u)) };
  if (p === undefined) o.absent = true; else if (typeof p === 'string') o.str = p; else o.p = enc(p);
  return o;
});

// ---------- B. closure getMaxHp na prawdziwych danych ----------
const closureVec = [];
const allTypes = [...rows, 'NieIstnieje', '', 'wojownik'];
for (const t of allTypes) {
  closureVec.push({ type: t, live: false, out: enc(getMaxHp(t, undefined)) });
  for (let k = 0; k < 4; k++) {
    const live = {};
    if (rnd() < 0.7) live.parametryBonusProc = pick([0, 5, 10, 15, 20, 25, 30, 7.5, 33, 100, ri(0, 40)]);
    if (rnd() < 0.7) live.battlesSurvived = pick([0, 1, 2, 3, 4, 7, 1.5]);
    closureVec.push({ type: t, live: true, pp: live.parametryBonusProc === undefined ? null : enc(live.parametryBonusProc), bs: live.battlesSurvived === undefined ? null : enc(live.battlesSurvived), out: enc(getMaxHp(t, live)) });
  }
}

// ---------- C. e2e: prawdziwy advanceCityEconomy + manpowerHeal ----------
const MAP = { szerokoscQ: 7, wysokoscR: 7, hexes: {}, seed: 1, rzeki: [] };
for (let q = 0; q < 7; q++) for (let r = 0; r < 7; r++) MAP.hexes[q + ',' + r] = { q, r, terenBazowy: 'Rownina', nakladka: 'Brak' };
const CATS = ['piechota', 'lucznik', 'kawaleria', 'machina', 'osadnik', 'robotnik', 'zwiadowca'];
const CIVS = ['egipt', 'sumer', 'celtowie', 'grecy', 'Rzymianie', 'chinczycy', '', 'nieznana'];
const COMBAT_TYPES = rows.filter((t) => !['Osadnik', 'Robotnik'].includes(t));

function genScenario(i) {
  const nC = ri(1, 4);
  const cells = [];
  for (let q = 0; q < 7; q++) for (let r = 0; r < 7; r++) cells.push([q, r]);
  const cities = [];
  for (let c = 0; c < nC; c++) {
    const [q, r] = cells.splice(ri(0, cells.length - 1), 1)[0];
    const city = { id: pick(['c', 'a', 'Z', 'b10', '9']) + c, ownerId: ri(0, 2), q, r, name: 'n' + c, population: ri(1, 40) };
    if (rnd() < 0.9) city.manpower = rnd() < 0.2 ? ri(0, 9) + 0.5 : ri(100, 4000);
    if (rnd() < 0.08) city.oblegane = true;
    cities.push(city);
  }
  const nU = ri(1, 9);
  const units = [];
  for (let u = 0; u < nU; u++) {
    const typeId = rnd() < 0.9 ? pick(COMBAT_TYPES) : pick(['NieIstnieje', 'Zwiadowca', 'Osadnik']);
    const home = pick(cities);
    const un = { id: 'u' + u + pick(['', 'x', '9']), ownerId: rnd() < 0.8 ? home.ownerId : ri(0, 2), typeId, category: rnd() < 0.8 ? pick(CATS.slice(0, 4)) : pick(CATS) };
    if (rnd() < 0.5) un.parametryBonusProc = rnd() < 0.9 ? pick([5, 10, 15, 20, 25, 30, 7.5, ri(1, 40)]) : pick([0, -3, NaN, Infinity, 100]);
    if (rnd() < 0.5) un.battlesSurvived = rnd() < 0.9 ? ri(0, 5) : pick([0.5, 2.7, -1, NaN, Infinity, 99]);
    const eff = getMaxHp(typeId, un);
    const r = rnd();
    if (r < 0.7) un.hp = Math.max(1, Math.floor(eff * rnd()));
    else if (r < 0.85) un.hp = pick([ri(0, 400), 0, 1, 0.5, NaN, Infinity, -5, eff, eff + 5]);
    if (rnd() < 0.6) un.hpMax = pick([100, 50, 120, 0, -1, NaN, 80.5, eff, eff - 3]);
    if (rnd() < 0.85) { un.q = rnd() < 0.6 ? home.q : ri(0, 6); un.r = rnd() < 0.6 ? home.r : ri(0, 6); }
    if (rnd() < 0.2) un.inGarnizon = rnd() < 0.5;
    units.push(un);
  }
  const owners = [0, 1, 2];
  const civByOwner = Object.fromEntries(owners.filter(() => rnd() < 0.75).map((o) => [o, pick(CIVS)]));
  const eraByOwner = rnd() < 0.6 ? Object.fromEntries(owners.map((o) => [o, pick([1, 1, 2, 3, 4, 5, 1.5, 0])])) : null;
  return { name: 'heal-maxhp-' + i, difficulty: pick(['easy', 'normal', 'hard']), playerEra: pick([1, 1, 2, 3, 6]), cities, units, civByOwner, eraByOwner };
}

function runWeb(s) {
  const cities = s.cities.map((c) => ({ ...c }));
  const units = s.units.map((u) => ({ ...u }));
  const calls = [];
  const asked = [];
  W.advanceCityEconomy(
    cities, MAP, DATA, s.difficulty, [], new Map(), new Map(), s.playerEra, new Set(),
    new Map(Object.entries(s.civByOwner).map(([k, v]) => [Number(k), v])), new Map(),
    s.eraByOwner ? (o) => s.eraByOwner[o] : undefined, undefined, 'wysoki', new Map(), new Map(), new Map(), new Map(),
    () => true, undefined, undefined, new Map(),
    { units, getMaxHp: (t, lu) => { const v = getMaxHp(t, lu); asked.push([lu ? lu.id : null, enc(v)]); return v; }, onUnitHpChanged: (id, hp, hpMax) => calls.push([id, enc(hp), enc(hpMax)]) },
  );
  const hr = globalThis.__healRes;
  return {
    pre: globalThis.__pre.map((c) => ({ id: c.id, ownerId: c.ownerId, population: enc(c.population), manpower: c.manpower === undefined ? null : enc(c.manpower), q: c.q, r: c.r, oblegane: c.oblegane === undefined ? null : c.oblegane })),
    units: units.map((u) => ({ id: u.id, hp: u.hp === undefined ? null : enc(u.hp), hpMax: u.hpMax === undefined ? null : enc(u.hpMax) })),
    cityManpower: cities.map((c) => (c.manpower === undefined ? null : enc(c.manpower))),
    calls, asked,
    healedCount: hr.healedCount, totalMpSpent: enc(hr.totalMpSpent),
  };
}

const scenarios = [];
for (let i = 0; i < 400; i++) scenarios.push(genScenario(i));
for (const s of scenarios) s.out = runWeb(s);
const encUnit = (u) => Object.fromEntries(Object.entries(u).map(([k, v]) => [k, typeof v === 'number' ? enc(v) : v]));
const out = {
  pin: PIN, matrixPatch: MATRIX_PATCH,
  norm: normVec, defs: defVec, emh: emhVec, vet: vetVec, wins: winsVec, par: parVec, closure: closureVec,
  scenarios: scenarios.map((s) => ({ name: s.name, difficulty: s.difficulty, playerEra: s.playerEra, cities: s.cities, units: s.units.map(encUnit), civByOwner: s.civByOwner, eraByOwner: s.eraByOwner, out: s.out })),
};
mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(out);
writeFileSync(join(outDir, 'maxhp.json'), text);
const healed = scenarios.filter((s) => s.out.healedCount > 0).length;
const withBonus = scenarios.filter((s) => s.units.some((u) => u.parametryBonusProc > 0 || u.battlesSurvived > 0)).length;
const asked = scenarios.reduce((n, s) => n + s.out.asked.length, 0);
console.log('scenarios', scenarios.length, 'healed>0', healed, 'withBonus', withBonus, 'getMaxHpCalls', asked, 'norm', normVec.length, 'defs', defVec.length, 'emh', emhVec.length, 'closure', closureVec.length, 'bytes', text.length);
