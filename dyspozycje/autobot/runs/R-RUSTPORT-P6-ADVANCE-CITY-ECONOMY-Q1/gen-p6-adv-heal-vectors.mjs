// Generator wektorow plastra S9 `manpowerHeal` (obrona R1, R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1).
// PIN weba: 4bbef081d. Uruchamiany jest PRAWDZIWY `advanceCityEconomy` (turn-economy.ts) z `manpowerHeal`.
// Instrumentacja W PAMIECI (plugin esbuild, pliki na dysku nietkniete):
//  * tuz przed blokiem `if (manpowerHeal)` (linia 2887 pinu) zrzut puli miast PO petli (regen MP z petli
//    miast nie jest portowany, wiec Rust startuje od stanu przed leczeniem), a wynik
//    `tickManpowerUnitReplenishment` trafia do globalThis.__healRes;
//  * civ-matrix.json: podmiana mp_max_proc / mp_koszt_jednostki_proc dla kilku cywilizacji (w prawdziwych
//    danych WSZYSTKIE sa 0, wiec bez tego resolver macierzy nie bylby rozrozniany); ta sama zmiana jest
//    zapisana w wektorze (`matrixPatch`) i nakladana w tescie Rust.
// Uruchomienie: node gen-p6-adv-heal-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
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
  stdin: { contents: `export { advanceCityEconomy } from './turn-economy';\nexport { loadGameData } from '../data/loader';`, resolveDir: game, loader: 'ts' },
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

const enc = (x) => {
  if (x === undefined) return null;
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  if (Number.isSafeInteger(x)) return x;
  return '~' + String(x);
};
let seed = 0x4ea1b007;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];

const MAP = { szerokoscQ: 7, wysokoscR: 7, hexes: {}, seed: 1, rzeki: [] };
for (let q = 0; q < 7; q++) for (let r = 0; r < 7; r++) MAP.hexes[q + ',' + r] = { q, r, terenBazowy: 'Rownina', nakladka: 'Brak' };

const TYPES = ['Legionista', 'Lucznik', 'Rycerz', 'Katapulta', 'Falanga', 'Zwiadowca', 'Osadnik', 'Robotnik'];
const CATS = ['piechota', 'lucznik', 'kawaleria', 'machina', 'osadnik', 'robotnik', 'zwiadowca'];
const CIVS = ['egipt', 'sumer', 'celtowie', 'grecy', 'Rzymianie', 'chinczycy', '', 'nieznana', 'EGIPT'];
const numOrSpecial = (xs) => pick(xs);

function genScenario(i) {
  const nC = ri(1, 4);
  const cells = [];
  for (let q = 0; q < 7; q++) for (let r = 0; r < 7; r++) cells.push([q, r]);
  const cities = [];
  for (let c = 0; c < nC; c++) {
    const [q, r] = cells.splice(ri(0, cells.length - 1), 1)[0];
    const city = { id: pick(['c', 'a', 'Z', 'b10', '9']) + c, ownerId: ri(0, 2), q, r, name: 'n' + c, population: ri(1, 40) };
    if (rnd() < 0.8) city.manpower = rnd() < 0.2 ? ri(0, 9) + 0.5 : ri(0, 300);
    if (rnd() < 0.12) city.oblegane = true;
    cities.push(city);
  }
  const nU = ri(0, 8);
  const units = [];
  for (let u = 0; u < nU; u++) {
    const typeId = pick(TYPES);
    const home = pick(cities);
    const un = { id: 'u' + u + pick(['', 'x', '9']), ownerId: rnd() < 0.8 ? home.ownerId : ri(0, 2), typeId, category: rnd() < 0.7 ? pick(CATS) : (typeId === 'Zwiadowca' ? 'zwiadowca' : 'piechota') };
    if (rnd() < 0.85) un.hp = rnd() < 0.6 ? ri(1, 70) : numOrSpecial([ri(0, 120), 0, 1, 0.5, NaN, Infinity, -5, 500]);
    if (rnd() < 0.6) un.hpMax = numOrSpecial([100, 50, 120, 0, -1, NaN, 80.5]);
    if (rnd() < 0.3) un.parametryBonusProc = ri(0, 30);
    if (rnd() < 0.3) un.battlesSurvived = ri(0, 5);
    if (rnd() < 0.85) { un.q = rnd() < 0.6 ? home.q : ri(0, 6); un.r = rnd() < 0.6 ? home.r : ri(0, 6); }
    if (rnd() < 0.2) un.inGarnizon = rnd() < 0.5;
    units.push(un);
  }
  const maxHpByType = Object.fromEntries(TYPES.map((t) => [t, numOrSpecial([100, 100, 100, 120, 60, 80.5, 100, 0, -5, NaN, Infinity])]));
  const owners = [0, 1, 2];
  const civByOwner = Object.fromEntries(owners.filter(() => rnd() < 0.75).map((o) => [o, pick(CIVS)]));
  const eraByOwner = rnd() < 0.6 ? Object.fromEntries(owners.map((o) => [o, pick([1, 1, 2, 3, 4, 5, 1.5, 0])])) : null;
  return { name: 'heal-' + i, difficulty: pick(['easy', 'normal', 'hard']), playerEra: pick([1, 1, 2, 3, 6]), cities, units, maxHpByType, civByOwner, eraByOwner };
}

function runWeb(s) {
  const cities = s.cities.map((c) => ({ ...c }));
  const units = s.units.map((u) => ({ ...u }));
  const calls = [];
  const res = W.advanceCityEconomy(
    cities, MAP, DATA, s.difficulty, [], new Map(), new Map(), s.playerEra, new Set(),
    new Map(Object.entries(s.civByOwner).map(([k, v]) => [Number(k), v])), new Map(),
    s.eraByOwner ? (o) => s.eraByOwner[o] : undefined, undefined, 'wysoki', new Map(), new Map(), new Map(), new Map(),
    () => true, undefined, undefined, new Map(),
    { units, getMaxHp: (t) => s.maxHpByType[t], onUnitHpChanged: (id, hp, hpMax) => calls.push([id, enc(hp), enc(hpMax)]) },
  );
  void res;
  const pre = globalThis.__pre;
  const hr = globalThis.__healRes;
  return {
    pre: pre.map((c) => ({ id: c.id, ownerId: c.ownerId, population: enc(c.population), manpower: c.manpower === undefined ? null : enc(c.manpower), q: c.q, r: c.r, oblegane: c.oblegane === undefined ? null : c.oblegane })),
    units: units.map((u) => ({ id: u.id, hp: u.hp === undefined ? null : enc(u.hp), hpMax: u.hpMax === undefined ? null : enc(u.hpMax) })),
    cityManpower: cities.map((c) => (c.manpower === undefined ? null : enc(c.manpower))),
    calls,
    healedCount: hr.healedCount, totalMpSpent: enc(hr.totalMpSpent),
  };
}

const scenarios = [];
for (let i = 0; i < 400; i++) scenarios.push(genScenario(i));
for (const s of scenarios) s.out = runWeb(s);
const encUnit = (u) => Object.fromEntries(Object.entries(u).map(([k, v]) => [k, typeof v === 'number' ? enc(v) : v]));
const out = {
  pin: PIN,
  matrixPatch: MATRIX_PATCH,
  scenarios: scenarios.map((s) => ({
    name: s.name, difficulty: s.difficulty, playerEra: s.playerEra,
    units: s.units.map(encUnit),
    maxHpByType: Object.fromEntries(Object.entries(s.maxHpByType).map(([k, v]) => [k, enc(v)])),
    civByOwner: s.civByOwner, eraByOwner: s.eraByOwner, out: s.out,
  })),
};
mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(out);
writeFileSync(join(outDir, 'heal.json'), text);
const healed = scenarios.filter((s) => s.out.healedCount > 0).length;
const changedMp = scenarios.filter((s) => s.out.pre.some((c, k) => c.manpower !== s.out.cityManpower[k])).length;
console.log('scenarios', scenarios.length, 'healed>0', healed, 'poolChanged', changedMp, 'bytes', text.length);
