/**
 * barb-warrior-audit-sim.cjs
 * R-WEB-BARB-WARRIOR-SUPERPOWER-AUDIT-Q1 (zgloszenie #286) -- audyt, bez zmian w gra/src ani gra/data.
 *
 * Co robi: bundluje (esbuild) PRAWDZIWE moduly silnika -- src/game/combat.ts (resolveCombat,
 * combatUnitFromDef), src/game/unit-power.ts (fieldPower), src/game/auto-battle-power.ts
 * (resolveAutoBattleByPower, autoBattleWinPct), src/game/hit-mode.ts (setActiveHitMode) -- i
 * symuluje walki barbarzynskiego "Wojownika" przeciw jednostkom gracza w kazdej epoce:
 *   - tryb RECZNY "losowe"  : resolveCombat z ziarnowanym rng (rzut na kazde uderzenie),
 *   - tryb RECZNY "pewne"   : setActiveHitMode('pewne') (kazde uderzenie trafia, bez rzutu),
 *   - tryb AUTO             : resolveAutoBattleByPower na M = fieldPower (upset 20% tylko w "losowe").
 * Dla 3v3 walki sekwencyjne 1v1 (zwyciezca zostaje z pozostalym HP) -- przyblizenie, opisane w raporcie.
 * Dla kazdej konfiguracji: wygrana strony barbarzynskiej i sredni % HP utracony przez zwyciezce.
 *
 * Uzycie (z katalogu gra/):
 *   ESBUILD_BIN=/sciezka/do/esbuild N=200 node tools/barb-warrior-audit-sim.cjs
 * (ESBUILD_BIN domyslnie: node_modules/.bin/esbuild wewnatrz gra/). Nic nie zapisuje w repo.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const ESBUILD_BIN = process.env.ESBUILD_BIN || path.join(GRA_DIR, 'node_modules/.bin/esbuild');
const N = Number(process.env.N || 200);
const BUNDLE = path.join(os.tmpdir(), `barb-audit-bundle-${RUN_ID}.cjs`);
const ENTRY = path.join(os.tmpdir(), `barb-audit-entry-${RUN_ID}.ts`);

process.on('exit', () => {
  try { fs.rmSync(BUNDLE, { force: true }); fs.rmSync(ENTRY, { force: true }); } catch { /* best-effort */ }
});

// ---------------------------------------------------------------------------
// 1. Bundle prawdziwego silnika
// ---------------------------------------------------------------------------
fs.writeFileSync(ENTRY, [
  `export { resolveCombat, combatUnitFromDef } from ${JSON.stringify(path.join(GRA_DIR, 'src/game/combat.ts'))};`,
  `export { fieldPower, loadUnitPowerCoeffs } from ${JSON.stringify(path.join(GRA_DIR, 'src/game/unit-power.ts'))};`,
  `export { resolveAutoBattleByPower, autoBattleWinPct } from ${JSON.stringify(path.join(GRA_DIR, 'src/game/auto-battle-power.ts'))};`,
  `export { setActiveHitMode } from ${JSON.stringify(path.join(GRA_DIR, 'src/game/hit-mode.ts'))};`,
  '',
].join('\n'));
execFileSync(ESBUILD_BIN, [ENTRY, '--bundle', '--platform=node', '--format=cjs', `--outfile=${BUNDLE}`, '--log-level=error'],
  { cwd: GRA_DIR, stdio: ['ignore', 'ignore', 'inherit'], timeout: 180000 });
const eng = require(BUNDLE);

// ---------------------------------------------------------------------------
// 2. Dane (surowe JSON, bez zmian)
// ---------------------------------------------------------------------------
const units = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data/units.json'), 'utf8'));
const countersRaw = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data/counters.json'), 'utf8'));
const counters = countersRaw.map((c) => ({
  'Typ atakujacy': c['Typ atakujący'],
  'Cel (typ)': c['Cel (typ)'],
  'Bonus': c['Bonus'],
  'Rodzaj (Atak/Obrona)': c['Rodzaj (Atak/Obrona)'],
  'Status': c['Status'],
}));

function rawDef(name) {
  const d = units.find((u) => u['Jednostka'] === name);
  if (!d) throw new Error(`brak jednostki w units.json: ${name}`);
  return d;
}

// Jednostka do walki: prawdziwy combatUnitFromDef (ta sama sciezka co runtime), hp = maxHP.
function cu(name, hpOverride) {
  return eng.combatUnitFromDef(rawDef(name), { typNazwa: name, hp: hpOverride });
}

// Mapy ziaren: LCG (deterministyczny, powtarzalny).
function lcg(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// 3. Konfiguracje: barbarzynca vs gracz, epoka po epoce
// ---------------------------------------------------------------------------
// Barbarzynca: units.json "Jednostka" z barbarians.ts (unitTypeId 'Wojownik' domyslnie; Brąz = Ludy Morza).
// Gracz: typowe jednostki epoki z zadania (Łucznik / Włócznik / Falanga / Miecznik galijski).
const CONFIGS = [
  { epoka: 'Kamień', barb: 'Wojownik', gracz: ['Łucznik', 'Wojownik'] },
  { epoka: 'Brąz', barb: 'Wojownik Sherden', gracz: ['Włócznik', 'Wojownik z mieczem i tarczą'] },
  { epoka: 'Brąz', barb: 'Wojownik szekelesz', gracz: ['Włócznik', 'Wojownik z mieczem i tarczą'] },
  { epoka: 'Żelazo', barb: 'Wojownik', gracz: ['Falanga', 'Miecznik galijski'] },
];

// ---------------------------------------------------------------------------
// 4. Symulacje
// ---------------------------------------------------------------------------
// Reczna walka 1v1 (resolveCombat). Zwraca {win: bool, lossPct: % HP utracone przez barbarzynce (zwyciezce jesli wygrywa)}.
function manual1v1(barbName, playerName, seed, certain) {
  eng.setActiveHitMode(certain ? 'pewne' : 'losowe');
  const a = cu(barbName);
  const d = cu(playerName);
  const r = eng.resolveCombat(a, d, { counters, rng: lcg(seed), attackerPosition: 'front' });
  eng.setActiveHitMode('losowe');
  return {
    winner: r.winner,
    aHpLeftPct: r.attackerHpLeft / a.health,
    dHpLeftPct: r.defenderHpLeft / d.health,
    aRounds: r.rounds,
  };
}

// Reczna walka 3v3: sekwencyjne 1v1, zwyciezca zostaje z pozostalym HP (przyblizenie).
function manual3v3(barbNames, playerNames, seed, certain) {
  eng.setActiveHitMode(certain ? 'pewne' : 'losowe');
  const rng = lcg(seed);
  const A = barbNames.map((n) => cu(n));
  const D = playerNames.map((n) => cu(n));
  const aMax = A.reduce((s, u) => s + u.health, 0);
  const dMax = D.reduce((s, u) => s + u.health, 0);
  let i = 0;
  let j = 0;
  while (i < A.length && j < D.length) {
    const a = A[i];
    const d = D[j];
    const r = eng.resolveCombat(a, d, { counters, rng: () => rng(), attackerPosition: 'front' });
    a.health = r.attackerHpLeft;
    d.health = r.defenderHpLeft;
    if (r.winner === 'attacker') { j += 1; } else if (r.winner === 'defender') { i += 1; } else { i += 1; j += 1; }
  }
  eng.setActiveHitMode('losowe');
  const aLeft = A.reduce((s, u) => s + Math.max(0, u.health), 0);
  const dLeft = D.reduce((s, u) => s + Math.max(0, u.health), 0);
  const aAlive = i < A.length;
  return { winner: aAlive ? 'attacker' : (j < D.length ? 'defender' : 'draw'), aLossPct: 1 - aLeft / aMax, dLossPct: 1 - dLeft / dMax };
}

// Tryb AUTO: M = suma fieldPower.total po rosterze; resolveAutoBattleByPower.
function autoRoster(barbNames, playerNames, seed) {
  const mA = barbNames.reduce((s, n) => s + eng.fieldPower(rawDef(n)).total, 0);
  const mD = playerNames.reduce((s, n) => s + eng.fieldPower(rawDef(n)).total, 0);
  const r = eng.resolveAutoBattleByPower({ mAtk: mA, mDef: mD, rng: lcg(seed) });
  // resolveAutoBattleByPower zwraca straty jako ULAMEK (0..1), nie procent.
  return { winner: r.winner, lossAtkPct: r.lossAtkPct, lossDefPct: r.lossDefPct, mA, mD, upset: !!r.upset };
}

function summarize(rows, mode) {
  const n = rows.length;
  const wins = rows.filter((r) => r.winner === 'attacker').length;
  const lossWin = rows.filter((r) => r.winner === 'attacker');
  const avgLoss = lossWin.length ? lossWin.reduce((s, r) => s + (mode === 'auto' ? r.lossAtkPct : r.aLossPct), 0) / lossWin.length : NaN;
  return { wins, n, winPct: (100 * wins) / n, avgWinnerLossPct: Number.isFinite(avgLoss) ? 100 * avgLoss : NaN };
}

function runCfg(cfg, nRuns) {
  const out = [];
  for (const pl of cfg.gracz) {
    for (const [label, count] of [['1v1', 1], ['3v3', 3]]) {
      const barbs = Array(count).fill(cfg.barb);
      const plrs = Array(count).fill(pl);
      const rowsLos = [];
      const rowsPew = [];
      const rowsAuto = [];
      for (let k = 0; k < nRuns; k++) {
        const seed = 1000 + k * 7919;
        if (count === 1) {
          const m1 = manual1v1(cfg.barb, pl, seed, false);
          rowsLos.push({ winner: m1.winner, aLossPct: 1 - m1.aHpLeftPct });
          const m2 = manual1v1(cfg.barb, pl, seed, true);
          rowsPew.push({ winner: m2.winner, aLossPct: 1 - m2.aHpLeftPct });
        } else {
          const m1 = manual3v3(barbs, plrs, seed, false);
          rowsLos.push({ winner: m1.winner, aLossPct: m1.aLossPct });
          const m2 = manual3v3(barbs, plrs, seed, true);
          rowsPew.push({ winner: m2.winner, aLossPct: m2.aLossPct });
        }
        const a = autoRoster(barbs, plrs, seed);
        rowsAuto.push(a);
      }
      out.push({
        epoka: cfg.epoka, barb: cfg.barb, gracz: pl, format: label,
        losowe: summarize(rowsLos, 'manual'),
        pewne: summarize(rowsPew, 'manual'),
        auto: summarize(rowsAuto, 'auto'),
        autoUpsetRate: rowsAuto.filter((r) => r.upset).length / nRuns,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 5. Raport
// ---------------------------------------------------------------------------
function fmt(x) { return Number.isFinite(x) ? x.toFixed(1) : 'n/d'; }

console.log(`N=${N} walk na konfiguracje; ziarna LCG 1000+k*7919 (powtarzalne)`);
console.log('\n== Statystyki jednostek (z combatUnitFromDef / fieldPower, prawdziwy silnik) ==');
const names = Array.from(new Set(CONFIGS.flatMap((c) => [c.barb, ...c.gracz])));
for (const nm of names) {
  const r = rawDef(nm);
  const cuu = cu(nm);
  const fp = eng.fieldPower(r);
  console.log(`${nm.padEnd(32)} Atak=${cuu.meleeAttack} Obrona=${cuu.meleeDefence} Uderz=${cuu.weaponDamage} Przeb=${cuu.piercing} Pancerz=${cuu.armor} HP=${cuu.health} Typ=${cuu.counterTyp} | fieldPower att=${fp.attack} def=${fp.defense} total=${fp.total}`);
}

console.log('\n== Wyniki: wygrana barbarzyncy % (sredni % utraty HP zwyciezcy-barbarzyncy, gdy wygrywa) ==');
console.log('epoka | barbarzynca | gracz | format | RECZNE losowe | RECZNE pewne | AUTO (upset%)');
const all = [];
for (const cfg of CONFIGS) {
  for (const row of runCfg(cfg, N)) {
    all.push(row);
    const f = (s) => `${fmt(s.winPct)}% (${fmt(s.avgWinnerLossPct)}%)`;
    console.log(`${row.epoka} | ${row.barb} | ${row.gracz} | ${row.format} | ${f(row.losowe)} | ${f(row.pewne)} | ${f(row.auto)} (upset ${fmt(100 * row.autoUpsetRate)}%)`);
  }
}

const flag = all.filter((r) => [r.losowe, r.pewne, r.auto].some((s) => s.winPct > 90 && s.avgWinnerLossPct < 10));
console.log('\n== Konfiguracje: barbarzynca >90% wygranych przy stracie zwyciezcy <10% ==');
if (flag.length === 0) console.log('(brak)');
for (const r of flag) console.log(`${r.epoka} | ${r.barb} vs ${r.gracz} | ${r.format}`);

// ---------------------------------------------------------------------------
// 6. Kontrola roli: ta sama para 1v1, role odwrocone (gracz atakuje, barbarzynca broni).
//    Rozstrzyga, czy przewaga wynika z ROLI (inicjatywa atakujacego), a nie ze statystyk barbarzyncy.
// ---------------------------------------------------------------------------
console.log('\n== Kontrola roli 1v1 (wygrana ATAKUJACEGO %; role odwrocone wzgledem sekcji 4) ==');
console.log('para (atakujacy vs obronca) | RECZNE losowe | RECZNE pewne');
const seenPairs = new Set();
for (const cfg of CONFIGS) {
  for (const pl of cfg.gracz) {
    const key = `${pl}|${cfg.barb}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    let wL = 0;
    let wP = 0;
    for (let k = 0; k < N; k++) {
      const seed = 1000 + k * 7919;
      if (manual1v1(pl, cfg.barb, seed, false).winner === 'attacker') wL += 1;
      if (manual1v1(pl, cfg.barb, seed, true).winner === 'attacker') wP += 1;
    }
    console.log(`${pl} vs ${cfg.barb} | ${fmt((100 * wL) / N)}% | ${fmt((100 * wP) / N)}%`);
  }
}
