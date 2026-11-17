'use strict';
/**
 * hit-mode-consistency-test.cjs
 * R-WEB-BATTLE-HIT-MODE-CONSISTENCY-AUDIT-Q1 -- straznik spojnosci trybu trafien.
 *
 * Usage (z gra/):  node tools/hit-mode-consistency-test.cjs
 *   Mutacja (kopia w bundlu, zadne pliki zrodlowe nie sa zmieniane):
 *     HITMODE_MUTATE=certain-off node tools/hit-mode-consistency-test.cjs   -> oczekiwane FAIL (exit 1)
 *   Pakiet esbuild: gra/node_modules/esbuild, albo env HITMODE_ESBUILD_PKG=<katalog pakietu esbuild>.
 *
 * Sprawdza:
 *  A. 'pewne': zero chybien w resolveCombat przy roznych obronach (0..200) i 40 ziarnach.
 *  B. 'losowe': hitChanceTw = clamp(tw_v3.hit_base + atk - def + bonus, hit_min, hit_max) na siatce.
 *  C. 'losowe': proba statystyczna rzutu (rng*100 < hitChanceTw), N=20000, tolerancja 1,5 pp.
 *  D. 'losowe': w resolveCombat sa chybienia (rzut realnie dziala).
 *  E. Stan domyslny = 'losowe'; setActiveHitMode('pewne') przelacza.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const UNITS_JSON = path.join(GRA, 'data', 'units.json');
const PARAMS_JSON = path.join(GRA, 'data', 'combat-params.json');
const MUTATE = process.env.HITMODE_MUTATE || '';

function loadEsbuild() {
  const candidates = [
    process.env.HITMODE_ESBUILD_PKG,
    path.join(GRA, 'node_modules', 'esbuild'),
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* next */ }
  }
  throw new Error('brak pakietu esbuild (gra/node_modules lub HITMODE_ESBUILD_PKG)');
}
const esbuild = loadEsbuild();

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

// --- bundle (z opcjonalna mutacja isCertainHitMode przez plugin) ---
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-hitcons-'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best-effort */ } });
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');
const srcPath = (f) => path.join(GRA, 'src', 'game', f).replace(/\\/g, '/');
fs.writeFileSync(ENTRY, [
  `export * from '${srcPath('combat')}';`,
  `export * from '${srcPath('hit-mode')}';`,
  '',
].join('\n'));
const mutatePlugin = {
  name: 'mutate-hit-mode',
  setup(b) {
    b.onLoad({ filter: /game[\\/]hit-mode\.ts$/ }, (args) => {
      let text = fs.readFileSync(args.path, 'utf8');
      if (MUTATE === 'certain-off') {
        const needle = "return activeHitMode === 'pewne';";
        if (!text.includes(needle)) throw new Error('mutacja: nie znaleziono wzorca w hit-mode.ts');
        text = text.replace(needle, 'return false;');
      }
      return { contents: text, loader: 'ts' };
    });
  },
};
esbuild.build({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'warning', plugins: [mutatePlugin],
}).then(() => main()).catch((e) => { console.error(e); process.exit(2); });

function main() {
const C = require(BUNDLE);

// --- dane ---
const params = JSON.parse(fs.readFileSync(PARAMS_JSON, 'utf8'));
const TWP = params.tw_v3;
const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const num = (v, fb) => (v === null || v === undefined || v === '' || v === '—' || v === '---' ? fb : (Number.isFinite(Number(v)) ? Number(v) : fb));
function adapt(raw) {
  return {
    typNazwa: raw['Jednostka'], counterTyp: String(raw['Typ'] ?? raw['Jednostka']), rola: raw['Rola (linia)'],
    meleeAttack: num(raw.meleeAttack, 0), meleeDefence: num(raw.meleeDefence, 0), weaponDamage: num(raw.weaponDamage, 0),
    armor: num(raw.armor, 0), piercing: num(raw.piercing, 0), chargeBonus: num(raw.chargeBonus, 0), health: num(raw.health, 30),
    'Prog dezercji (% health)': raw['Próg dezercji (% health)'] ?? null, missileAttack: num(raw.missileAttack, 0),
    'Zasieg ataku (hex)': null, 'Ilosc pociskow': null, 'Ruch w bitwie (heksy)': '—',
    'Kara obrony z flanki (%)': '—', 'Kara obrony z tylu (%)': '—', 'Super-jednostka': '—',
  };
}
const WOJ = adapt(unitsRaw.find((u) => u['Jednostka'] === 'Wojownik'));
const LUCZ = adapt(unitsRaw.find((u) => u['Jednostka'] === 'Łucznik'));
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

// --- E: stan domyslny ---
C.setActiveHitMode(undefined);
check('E: stan domyslny = losowe', C.getActiveHitMode() === 'losowe', C.getActiveHitMode());

// --- A: pewne = zero chybien ---
C.setActiveHitMode('pewne');
check('E: setActiveHitMode(pewne) przelacza', C.getActiveHitMode() === 'pewne', C.getActiveHitMode());
let missPewne = 0; let hitsPewne = 0; let walki = 0;
for (const dDef of [0, 20, 60, 90, 200]) {
  const d = Object.assign({}, WOJ, { meleeDefence: dDef });
  for (let seed = 1; seed <= 40; seed++) {
    const r = C.resolveCombat(Object.assign({}, LUCZ), d, { rng: lcg(seed) });
    walki++;
    missPewne += r.log.filter((l) => /chybi/.test(l)).length;
    hitsPewne += r.log.filter((l) => /trafia/.test(l)).length;
  }
}
check(`A: pewne -- zero chybien przy obronach 0..200 (${walki} walk)`, missPewne === 0, missPewne);
check('A: pewne -- sa trafienia w logu (test nie jest pusty)', hitsPewne > 0, hitsPewne);

// --- B: losowe = clamp formula ---
C.setActiveHitMode('losowe');
const badFormula = [];
for (let atk = 0; atk <= 30; atk += 3) {
  for (let def = 0; def <= 60; def += 5) {
    for (const bonus of [0, 4]) {
      const exp = Math.max(TWP.hit_min, Math.min(TWP.hit_max, TWP.hit_base + atk - def + bonus));
      const got = C.hitChanceTw(atk, def, bonus);
      if (got !== exp) badFormula.push({ atk, def, bonus, got, exp });
    }
  }
}
check('B: losowe -- hitChanceTw = clamp(hit_base+atk-def+bonus, hit_min, hit_max) na siatce', badFormula.length === 0, badFormula.slice(0, 5));
check('B: progi tw_v3 (40/15/75) zgodne z combat-params.json', TWP.hit_base === 40 && TWP.hit_min === 15 && TWP.hit_max === 75, TWP);

// --- C: proba statystyczna rzutu ---
const TOL_PP = 1.5;
const N = 20000;
const statFail = [];
for (const [atk, def] of [[6, 6], [6, 30], [30, 6], [4, 2]]) {
  const p = C.hitChanceTw(atk, def, 0);
  const rng = lcg(4242);
  let hits = 0;
  for (let i = 0; i < N; i++) if (rng() * 100 < p) hits++;
  const pct = (100 * hits) / N;
  if (Math.abs(pct - p) > TOL_PP) statFail.push({ atk, def, expected: p, measured: +pct.toFixed(2) });
}
check('C: losowe -- proba rzutu zgodna z hitChanceTw (+/-1,5 pp, N=20000)', statFail.length === 0, statFail);

// --- D: losowe realnie chybia w walce ---
let missLos = 0;
for (let seed = 1; seed <= 40; seed++) {
  const r = C.resolveCombat(Object.assign({}, LUCZ), Object.assign({}, WOJ), { rng: lcg(seed) });
  missLos += r.log.filter((l) => /chybi/.test(l)).length;
}
check('D: losowe -- sa chybienia w logu (rzut dziala)', missLos > 0, missLos);

console.log(`\nWynik: ${pass} PASS, ${fail} FAIL${MUTATE ? ' (mutacja: ' + MUTATE + ')' : ''}`);
process.exit(fail === 0 ? 0 : 1);
}
