'use strict';
/**
 * hit-mode-archers-vs-warrior-sim.cjs
 * R-WEB-BATTLE-HIT-MODE-CONSISTENCY-AUDIT-Q1 -- POMIAR (nie bramka): 20 Lucznikow vs 20 Wojownikow
 * w trybach trafien 'pewne' i 'losowe'.
 *
 * Usage (z gra/):  node tools/hit-mode-archers-vs-warrior-sim.cjs [--seeds 30] [--mode both|pewne|losowe] [--out plik.json]
 *   esbuild: env HITMODE_ESBUILD=<sciezka do binarki> gdy brak gra/node_modules/.bin/esbuild.
 *
 * Silnik: prawdziwy resolveCombat z src/game/combat.ts oraz setActiveHitMode z src/game/hit-mode.ts.
 * Dane: data/units.json, pola lowercase (meleeAttack, health, missileAttack ...) jak w adapterze
 * combat-testow; zasieg i pociski Lucznika z kolumn "Zasięg ataku (hex)" i "Ilość pocisków".
 *
 * ZALOZENIA (jawne, bo 20 vs 20 nie jest jednym wywolaniem silnika):
 *  - Kolejka czolowa: kazdy pojedynek = 1 Lucznik (atakujacy, dystans) vs 1 Wojownik (obronca) przez
 *    resolveCombat. Zwyciezca zostaje na froncie z zachowanym zdrowiem (canonicalCurrentHp), przegrany
 *    znika. Strona bez zolnierzy przegrywa; obie strony wyczerpane naraz = remis.
 *  - Amunicja: kazdy pojedynek startuje z 12 pociskami (silnik nie zwraca zuzycia) -- zawyza ostrzal
 *    lucznikow wzgledem realnej bitwy; czytac jako gorna granice.
 *  - Teren plaski, bez bonusow, bez flank/tylu, bez generala, weteranow i mnoznikow cywilizacji.
 *  - 'losowe': rng = LCG(ziarno pojedynku). 'pewne': rng bez znaczenia (wynik deterministyczny).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const ESBUILD_BIN = process.env.HITMODE_ESBUILD || path.join(GRA, 'node_modules', '.bin', 'esbuild');
const UNITS_JSON = path.join(GRA, 'data', 'units.json');

function argVal(name, fb) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fb;
}
const SEEDS = Math.max(30, parseInt(argVal('--seeds', '30'), 10) || 30);
const MODE_ARG = argVal('--mode', 'both');
const MODES = MODE_ARG === 'both' ? ['pewne', 'losowe'] : [MODE_ARG];
const OUT = argVal('--out', '');
const N_ARCH = 20;
const N_WOJ = 20;

// --- bundle: combat + hit-mode (jeden wspolny stan trybu) ---
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-hitsim-'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best-effort */ } });
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');
const srcPath = (f) => path.join(GRA, 'src', 'game', f).replace(/\\/g, '/');
fs.writeFileSync(ENTRY, [
  `export * from '${srcPath('combat')}';`,
  `export * from '${srcPath('hit-mode')}';`,
  '',
].join('\n'));
execFileSync(ESBUILD_BIN, [ENTRY, '--bundle', '--platform=node', '--format=cjs', '--log-level=warning', `--outfile=${BUNDLE}`],
  { stdio: 'inherit' });
const C = require(BUNDLE);

// --- dane jednostek ---
const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const num = (v, fb) => (v === null || v === undefined || v === '' || v === '—' || v === '---' ? fb : (Number.isFinite(Number(v)) ? Number(v) : fb));
function findRaw(name) {
  const r = unitsRaw.find((u) => String(u['Jednostka']) === name);
  if (!r) throw new Error('brak jednostki w units.json: ' + name);
  return r;
}
function adapt(raw) {
  return {
    typNazwa: raw['Jednostka'],
    counterTyp: String(raw['Typ'] ?? raw['Jednostka']),
    rola: raw['Rola (linia)'],
    meleeAttack: num(raw.meleeAttack, 0),
    meleeDefence: num(raw.meleeDefence, 0),
    weaponDamage: num(raw.weaponDamage, 0),
    armor: num(raw.armor, 0),
    piercing: num(raw.piercing, 0),
    chargeBonus: num(raw.chargeBonus, 0),
    health: num(raw.health, 30),
    'Prog dezercji (% health)': raw['Próg dezercji (% health)'] ?? null,
    missileAttack: num(raw.missileAttack, 0),
    'Zasieg ataku (hex)': num(raw['Zasięg ataku (hex)'], null),
    'Ilosc pociskow': num(raw['Ilość pocisków'], null),
    'Ruch w bitwie (heksy)': raw['Ruch w bitwie (heksy)'] ?? '—',
    'Kara obrony z flanki (%)': raw['Kara obrony z flanki (%)'] ?? '—',
    'Kara obrony z tylu (%)': raw['Kara obrony z tyłu (%)'] ?? '—',
    'Super-jednostka': raw['Super-jednostka'] ?? '—',
  };
}
const ARCHER = adapt(findRaw('Łucznik'));
const WOJ = adapt(findRaw('Wojownik'));

function lcg(seed) {
  let s = seed >>> 0;
  return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// Pojedynek: Lucznik (atakujacy) z aHp vs Wojownik z dHp; zwraca wynik silnika.
function duel(aHp, dHp, seed) {
  const a = Object.assign({}, ARCHER, { canonicalEffectiveMaxHp: ARCHER.health, canonicalCurrentHp: aHp });
  const d = Object.assign({}, WOJ, { canonicalEffectiveMaxHp: WOJ.health, canonicalCurrentHp: dHp });
  return C.resolveCombat(a, d, { rng: lcg(seed) });
}

// Bitwa 20 vs 20 w kolejce czolowej.
function battle(seed, keepLog) {
  const archers = Array(N_ARCH).fill(ARCHER.health);
  const wojs = Array(N_WOJ).fill(WOJ.health);
  let rounds = 0; let duels = 0; let firstLog = null;
  while (archers.length > 0 && wojs.length > 0) {
    const r = duel(archers[0], wojs[0], seed * 1000 + duels);
    duels++;
    rounds += r.rounds;
    if (keepLog && !firstLog) firstLog = r.log.slice(0, 40);
    const aLeft = r.attackerHpLeft; const dLeft = r.defenderHpLeft;
    const aOut = aLeft <= 0 || r.routed.includes('attacker');
    const dOut = dLeft <= 0 || r.routed.includes('defender');
    if (aOut && dOut) { archers.shift(); wojs.shift(); }
    else if (dOut) { wojs.shift(); archers[0] = aLeft; }
    else if (aOut) { archers.shift(); wojs[0] = dLeft; }
    else if (aLeft >= dLeft) { wojs.shift(); archers[0] = aLeft; }   // limit rund: wyzsze HP przechodzi dalej
    else { archers.shift(); wojs[0] = dLeft; }
  }
  const winner = archers.length > 0 ? 'attacker' : (wojs.length > 0 ? 'defender' : 'draw');
  return {
    winner,
    archerLosses: N_ARCH - archers.length,
    wojLosses: N_WOJ - wojs.length,
    archersLeft: archers.length,
    wojLeft: wojs.length,
    rounds,
    duels,
    firstLog,
  };
}

function mean(xs) { return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0; }

const out = {
  seeds: SEEDS,
  archer: { health: ARCHER.health, missileAttack: ARCHER.missileAttack, zasieg: ARCHER['Zasieg ataku (hex)'], pociski: ARCHER['Ilosc pociskow'] },
  warrior: { health: WOJ.health, meleeAttack: WOJ.meleeAttack, meleeDefence: WOJ.meleeDefence },
  modes: {},
};
for (const mode of MODES) {
  C.setActiveHitMode(mode);
  const rs = [];
  for (let s = 1; s <= SEEDS; s++) rs.push(battle(s, s === 1));
  const pct = (pred) => +(100 * rs.filter(pred).length / rs.length).toFixed(1);
  out.modes[mode] = {
    battles: rs.length,
    archerWinPct: pct((b) => b.winner === 'attacker'),
    wojWinPct: pct((b) => b.winner === 'defender'),
    drawPct: pct((b) => b.winner === 'draw'),
    meanArcherLosses: +mean(rs.map((b) => b.archerLosses)).toFixed(2),
    meanWojLosses: +mean(rs.map((b) => b.wojLosses)).toFixed(2),
    meanArcherSurvivors: +mean(rs.map((b) => b.archersLeft)).toFixed(2),
    meanWojSurvivors: +mean(rs.map((b) => b.wojLeft)).toFixed(2),
    meanRounds: +mean(rs.map((b) => b.rounds)).toFixed(1),
    meanDuels: +mean(rs.map((b) => b.duels)).toFixed(1),
    distinctOutcomes: new Set(rs.map((b) => JSON.stringify([b.winner, b.archerLosses, b.wojLosses, b.rounds]))).size,
    firstBattleDuel1Log: rs[0].firstLog,
  };
}
C.setActiveHitMode(undefined);

const lines = [`Symulacja 20 Lucznikow vs 20 Wojownikow (resolveCombat, kolejka czolowa), ziarna=${SEEDS}`];
for (const mode of MODES) {
  const m = out.modes[mode];
  lines.push(`[${mode}] lucznicy wygrywaja ${m.archerWinPct}% | wojownicy ${m.wojWinPct}% | remis ${m.drawPct}%`
    + ` | straty lucznikow sr. ${m.meanArcherLosses} | straty wojownikow sr. ${m.meanWojLosses}`
    + ` | rund sr. ${m.meanRounds} | pojedynkow sr. ${m.meanDuels} | roznych wynikow ${m.distinctOutcomes}`);
}
console.log(lines.join('\n'));
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
