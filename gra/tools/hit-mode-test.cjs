'use strict';
/**
 * hit-mode-test.cjs
 * R-WEB-BATTLE-HIT-MODE-SETTING-Q1 — testy trybu trafień 'losowe' / 'pewne'.
 *
 * Usage (z gra/):  node tools/hit-mode-test.cjs
 *
 * Strategia: esbuild bundluje jeden moduł-wejście, który re-eksportuje combat.ts,
 * hit-mode.ts i auto-battle-power.ts (jeden wspólny stan trybu), potem:
 *   1. normalizeHitMode: brak pola / nieznana wartość = 'losowe' (migracja zapisów).
 *   2. Domyślny stan aktywny = 'losowe' (zachowanie sprzed zmiany).
 *   3. 'pewne': resolveCombat nie zawiera ani jednego chybienia, wynik nie zależy od rng
 *      (ten sam wynik dla różnych ziaren), na N=100 000 powtórzeń 1 vs 1 o równych statystykach.
 *   4. 'losowe': wynik identyczny dla tego samego ziarna jak w trybie domyślnym (golden).
 *   5. AUTO (resolveAutoBattleByPower): 'losowe' -> upset przy rng=0; 'pewne' -> brak upsetu.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const ESBUILD_BIN = path.join(GRA, 'node_modules/.bin/esbuild');
const UNITS_JSON = path.join(GRA, 'data/units.json');
const COUNTERS_JSON = path.join(GRA, 'data/counters.json');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log('PASS: ' + name);
  } else {
    fail++;
    console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

// ---------------------------------------------------------------------------
// Bundle (jeden wspolny modul hit-mode dla combat i auto-battle)
// ---------------------------------------------------------------------------
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-hitmode-'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best-effort */ } });
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'hit-mode-bundle.cjs');
fs.writeFileSync(ENTRY, [
  "export * from '" + path.join(GRA, 'src/game/combat').replace(/\\/g, '/') + "';",
  "export * from '" + path.join(GRA, 'src/game/hit-mode').replace(/\\/g, '/') + "';",
  "export * from '" + path.join(GRA, 'src/game/auto-battle-power').replace(/\\/g, '/') + "';",
  '',
].join('\n'));
execSync('"' + ESBUILD_BIN + '" "' + ENTRY + '" --bundle --platform=node --format=cjs --log-level=warning --outfile="' + BUNDLE + '"',
  { stdio: 'inherit' });
const mod = require(BUNDLE);
const { resolveCombat, normalizeHitMode, setActiveHitMode, getActiveHitMode, resolveAutoBattleByPower } = mod;

// ---------------------------------------------------------------------------
// Dane jednostek (adapter jak w combat-test.cjs)
// ---------------------------------------------------------------------------
const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
function num(v, fb) {
  if (v === null || v === undefined || v === '' || v === '—') return fb;
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}
function adaptUnit(raw) {
  return {
    typNazwa: raw['Jednostka'],
    counterTyp: String(raw['Typ'] ?? raw['Jednostka'] ?? ''),
    rola: raw['Rola (linia)'],
    meleeAttack: num(raw.meleeAttack, num(raw['Atak'], 0)),
    meleeDefence: num(raw.meleeDefence, num(raw['Obrona'], 0)),
    weaponDamage: num(raw.weaponDamage, num(raw['Uderzenie'], num(raw['Atak'], 0))),
    armor: num(raw.armor, num(raw['Pancerz'], 0)),
    piercing: num(raw.piercing, num(raw['Przebicie'], 0)),
    chargeBonus: num(raw.chargeBonus, num(raw['Uderzenie'], 0)),
    health: num(raw.health, num(raw['Health'], 30)),
    'Prog dezercji (% health)': raw['Próg dezercji (% health)'],
    missileAttack: num(raw.missileAttack, num(raw['Atak dystansowy'], 0)),
    'Zasieg ataku (hex)': '—',
    'Ilosc pociskow': '—',
    'Ruch w bitwie (heksy)': raw['Ruch w bitwie (heksy)'] || '—',
    'Kara obrony z flanki (%)': raw['Kara obrony z flanki (%)'] || '—',
    'Kara obrony z tyłu (%)': raw['Kara obrony z tyłu (%)'] || '—',
    'Super-jednostka': raw['Super-jednostka'],
  };
}
// Dwie jednostki wreczne (bez dystansu, bez pociskow) o roznych statystykach.
const meleeRaws = unitsRaw.filter(u => Number(num(u['Zasięg ataku (hex)'], 0)) === 0
  && num(u['Atak dystansowy'], 0) === 0 && num(u['Atak'], 0) > 0);
const rawA = meleeRaws[0];
const rawD = meleeRaws[1] || meleeRaws[0];
check('dane: sa co najmniej dwie jednostki wreczne', meleeRaws.length >= 2, meleeRaws.length);
const UA = adaptUnit(rawA);
const UD = adaptUnit(rawD);

// Deterministyczny LCG (ziarno -> [0,1)).
function lcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// 1. Normalizacja / migracja
// ---------------------------------------------------------------------------
check('normalize: brak pola (undefined) -> losowe', normalizeHitMode(undefined) === 'losowe');
check('normalize: null -> losowe', normalizeHitMode(null) === 'losowe');
check('normalize: nieznana wartosc -> losowe', normalizeHitMode('cokolwiek') === 'losowe');
check('normalize: pewne -> pewne', normalizeHitMode('pewne') === 'pewne');
check('normalize: losowe -> losowe', normalizeHitMode('losowe') === 'losowe');

// ---------------------------------------------------------------------------
// 2. Domyslny stan aktywny = losowe
// ---------------------------------------------------------------------------
setActiveHitMode(undefined);
check('stan domyslny = losowe', getActiveHitMode() === 'losowe', getActiveHitMode());

// ---------------------------------------------------------------------------
// 3. Tryb 'pewne': brak chybien, wynik niezalezny od rng
// ---------------------------------------------------------------------------
setActiveHitMode('pewne');
check('setActiveHitMode(pewne) ustawia pewne', getActiveHitMode() === 'pewne');

const countMiss = (log) => log.filter(l => /chybi/.test(l)).length;
const countHit = (log) => log.filter(l => /trafia/.test(l)).length;

let missTotal = 0;
let hitTotal = 0;
let resultsDiffer = false;
let baseline = null;
const SAMPLE = 2000;
for (let i = 0; i < SAMPLE; i++) {
  const r1 = resolveCombat(UA, UD, { rng: lcg(i + 1), maxRounds: 30 });
  const r2 = resolveCombat(UA, UD, { rng: lcg(i + 9999), maxRounds: 30 });
  missTotal += countMiss(r1.log);
  hitTotal += countHit(r1.log);
  const j1 = JSON.stringify([r1.winner, r1.attackerHpAfter ?? r1.hpAtk, r1.defenderHpAfter ?? r1.hpDef, r1.log]);
  const j2 = JSON.stringify([r2.winner, r2.attackerHpAfter ?? r2.hpAtk, r2.defenderHpAfter ?? r2.hpDef, r2.log]);
  if (j1 !== j2) resultsDiffer = true;
  if (baseline === null) baseline = j1;
  else if (j1 !== baseline) resultsDiffer = true;
}
check('pewne: zero chybien w ' + SAMPLE + ' walkach (log)', missTotal === 0, missTotal);
check('pewne: sa trafienia w logu (test nie jest pusty)', hitTotal > 0, hitTotal);
check('pewne: wynik niezalezny od ziarna rng', !resultsDiffer);

// 100 000 powtorzen 1 vs 1 o rownych statystykach (kazde wywolanie = pelne starcie).
const EQ_RUNS = 100000;
let eqMiss = 0;
let eqFirst = null;
let eqDiffer = false;
const eqUA = adaptUnit(rawA);
const eqUD = adaptUnit(rawA);
const t0 = Date.now();
for (let i = 0; i < EQ_RUNS; i++) {
  const r = resolveCombat(eqUA, eqUD, { rng: lcg(i + 7), maxRounds: 30 });
  eqMiss += countMiss(r.log);
  const key = JSON.stringify([r.winner, r.log.length]);
  if (eqFirst === null) eqFirst = key;
  else if (key !== eqFirst) eqDiffer = true;
}
const eqMs = Date.now() - t0;
check('pewne: 100 000 starc 1v1 (rowne staty) bez chybienia', eqMiss === 0, eqMiss);
check('pewne: 100 000 starc 1v1 deterministyczne', !eqDiffer);
console.log('INFO: 100 000 starc 1v1 w ' + eqMs + ' ms (kazde = pelne resolveCombat, nie pojedynczy cios)');

// ---------------------------------------------------------------------------
// 4. Tryb 'losowe': zachowanie jak domyslne (golden wzgledem stanu domyslnego)
// ---------------------------------------------------------------------------
setActiveHitMode('losowe');
const goldLosowe = [];
for (let i = 0; i < 300; i++) {
  const r = resolveCombat(UA, UD, { rng: lcg(i + 3), maxRounds: 30 });
  goldLosowe.push(JSON.stringify([r.winner, r.log]));
}
setActiveHitMode(undefined); // = losowe
let goldMismatch = 0;
for (let i = 0; i < 300; i++) {
  const r = resolveCombat(UA, UD, { rng: lcg(i + 3), maxRounds: 30 });
  if (JSON.stringify([r.winner, r.log]) !== goldLosowe[i]) goldMismatch++;
}
check('losowe: wynik identyczny dla tego samego ziarna jak stan domyslny (300 starc)', goldMismatch === 0, goldMismatch);
const loseLog = goldLosowe.join('\n');
check('losowe: w logu sa rzuty (chybienia/trafienia zaleza od rng)', /chybi/.test(loseLog) || /trafia/.test(loseLog));

// ---------------------------------------------------------------------------
// 5. AUTO: upset tylko w 'losowe'
// ---------------------------------------------------------------------------
const PARAMS_STUB = undefined; // domyslne parametry z auto-battle-params
setActiveHitMode('losowe');
const autoL = resolveAutoBattleByPower({ mAtk: 100, mDef: 95, rng: () => 0, params: PARAMS_STUB });
check('AUTO losowe: upset przy rng=0 (stosunek sil < 1,15)', autoL.upset === true, autoL);
setActiveHitMode('pewne');
const autoP = resolveAutoBattleByPower({ mAtk: 100, mDef: 95, rng: () => 0, params: PARAMS_STUB });
check('AUTO pewne: brak upsetu przy rng=0', autoP.upset !== true, autoP);
check('AUTO pewne: zwyciezca = silniejsza strona', autoP.winner === 'attacker', autoP.winner);
setActiveHitMode(undefined);

console.log('');
console.log('WYNIK: ' + pass + ' PASS, ' + fail + ' FAIL');
if (fail > 0) process.exit(1);
