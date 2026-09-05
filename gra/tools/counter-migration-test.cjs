/**
 * counter-migration-test.cjs
 *
 * Regression test for R-KONTRY-BITWA-MIGRACJA-Q1 (2026-08-06).
 *
 * Before the migration, battle/battleScene.ts computed the counter-vs-type
 * damage multiplier from TWO independent sources multiplied together:
 *   1. counterMultiplier(attacker.counterTyp, defender.counterTyp, counters)
 *      -- data/counters.json, but returning a FLAT constant (COUNTER_MULT,
 *      1.5) for ANY matching row regardless of that row's own "Bonus" %.
 *   2. attackerBonusVsType(attacker, defender) -- a SEPARATE path reading
 *      units.json's own "Bonus vs <Typ> %" columns directly (+15/+25/+50%),
 *      with NO connection to counters.json at all.
 *
 * Only 3 of the ~14 real attacker/defender-type pairs existed in BOTH
 * sources at once (Spearman->Mount, Mount->Distance, Mount->Slinger) --
 * those were double-counted (1.5 x 1.5 = 2.25). The other ~11 pairs existed
 * ONLY in the units.json path (counters.json had no row for them at all).
 *
 * The migration:
 *   - extended counterMultiplier() to read the REAL % from each row's own
 *     "Bonus" cell instead of a flat constant,
 *   - added counters.json rows for every pair that previously existed only
 *     in the units.json columns,
 *   - deleted attackerBonusVsType() and its call site.
 *
 * This test proves, for EVERY attacker-type/defender-type pair that had a
 * nonzero bonus in the OLD units.json columns (computed straight from the
 * CURRENT units.json, which the migration does not touch):
 *   - pairs that existed in ONLY the old units.json path -> the NEW single-
 *     source multiplier is IDENTICAL to the OLD combined (2-source) value
 *     (pure migration, nothing lost, nothing changed).
 *   - pairs that existed in BOTH old sources (double-counted bug) -> the NEW
 *     multiplier is LOWER than the OLD combined value (duplicate removed)
 *     but still STRICTLY > 1.0 (the underlying bonus itself is not lost --
 *     it collapses from double-counted to single-counted, never to zero).
 *
 * Usage (from gra/): node tools/counter-migration-test.cjs
 */

'use strict';

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const COMBAT_TS = path.join(GRA_DIR, 'src/game/combat.ts');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const COUNTERS_JSON = path.join(GRA_DIR, 'data/counters.json');
const COMBAT_PARAMS_JSON = path.join(GRA_DIR, 'data/combat-params.json');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}
const BUNDLE_PATH = path.join(os.tmpdir(), `counter-migration-combat-bundle-${TMPDIR_RUN_ID}.cjs`);

// ---------------------------------------------------------------------------
// Step 1: Bundle the CURRENT (post-migration) combat.ts -> get the NEW
// counterMultiplier straight from the real source, not a re-implementation.
// ---------------------------------------------------------------------------
console.log('Bundling combat.ts with esbuild...');
try {
  execSync(
    '"' + ESBUILD_BIN + '" "' + COMBAT_TS + '" --bundle --platform=node --format=cjs --outfile="' + BUNDLE_PATH + '"',
    { stdio: 'inherit' },
  );
} catch (e) {
  console.error('esbuild failed:', e.message);
  process.exit(1);
}
const combat = require(BUNDLE_PATH);
const { counterMultiplier: counterMultiplierNEW } = combat;
if (typeof counterMultiplierNEW !== 'function') {
  console.error('counterMultiplier not exported from bundle!');
  process.exit(1);
}
console.log('Bundle OK.\n');

// ---------------------------------------------------------------------------
// Step 2: Load data. units.json/combat-params.json are UNTOUCHED by the
// migration, so reading them straight from disk gives the "before" bonus
// values with no need for a frozen copy. counters.json IS the migration's
// target, so its post-migration content is read from disk (current file);
// its PRE-migration content (6 rows) is frozen below as a literal snapshot
// -- git history for the exact bytes: commit 87dbe82 / normCounters() shape.
// ---------------------------------------------------------------------------
const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const countersNewRaw = JSON.parse(fs.readFileSync(COUNTERS_JSON, 'utf8'));
const combatParams = JSON.parse(fs.readFileSync(COMBAT_PARAMS_JSON, 'utf8'));
const COUNTER_MULT_OLD = combatParams.counter_multiplier; // 1.5, unchanged by this migration

// Frozen PRE-migration counters.json (the 6 rows that existed before
// R-KONTRY-BITWA-MIGRACJA-Q1; see docs/decyzje/R-KONTRY-BITWA-SPOJNOSC-Q1.md).
const COUNTERS_OLD_SNAPSHOT = [
  { 'Typ atakujący': 'Spearman', 'Cel (typ)': 'Mount', 'Bonus': '+50%', 'Rodzaj (Atak/Obrona)': 'Atak', 'Status': 'potwierdzone' },
  { 'Typ atakujący': 'Spearman', 'Cel (typ)': 'Mount', 'Bonus': '+50%', 'Rodzaj (Atak/Obrona)': 'Obrona', 'Status': 'potwierdzone' },
  { 'Typ atakujący': 'Mount', 'Cel (typ)': 'Distance', 'Bonus': '+50%', 'Rodzaj (Atak/Obrona)': 'Atak', 'Status': 'potwierdzone' },
  { 'Typ atakujący': 'Mount', 'Cel (typ)': 'Slinger', 'Bonus': '+50%', 'Rodzaj (Atak/Obrona)': 'Atak', 'Status': 'potwierdzone' },
  { 'Typ atakujący': 'Slinger', 'Cel (typ)': 'Spearman', 'Bonus': '+50%', 'Rodzaj (Atak/Obrona)': 'Atak', 'Status': 'potwierdzone' },
  { 'Typ atakujący': 'Atak z flanki (z boku)', 'Cel (typ)': 'Falangite/Distance/Slinger', 'Bonus': '−50%', 'Rodzaj (Atak/Obrona)': 'Obrona', 'Status': 'potwierdzone' },
];

function adaptCounters(raw) {
  return raw.map((c) => ({
    'Typ atakujacy': c['Typ atakujący'],
    'Cel (typ)': c['Cel (typ)'],
    'Bonus': c['Bonus'],
    'Rodzaj (Atak/Obrona)': c['Rodzaj (Atak/Obrona)'],
    'Status': c['Status'],
  }));
}
const countersOld = adaptCounters(COUNTERS_OLD_SNAPSHOT);
const countersNew = adaptCounters(countersNewRaw);

// ---------------------------------------------------------------------------
// Step 3: Re-implement the OLD (pre-migration) formulas EXACTLY as they were
// in the removed code, so "PRZED" is computed the same way the game used to.
// ---------------------------------------------------------------------------

/** OLD counterMultiplier: flat COUNTER_MULT on any Atak-row match, else 1.0. */
function counterMultiplierOLD(attackerType, defenderType, counters) {
  const aLow = attackerType.toLowerCase();
  const dLow = defenderType.toLowerCase();
  for (const c of counters) {
    if (c['Status'] !== 'potwierdzone') continue;
    if (c['Rodzaj (Atak/Obrona)'] !== 'Atak') continue;
    const cAtk = c['Typ atakujacy'].toLowerCase();
    const cCel = c['Cel (typ)'].toLowerCase();
    const atkMatch = aLow.includes(cAtk) || cAtk.includes(aLow);
    const defAlts = cCel.split('/').map((s) => s.trim());
    const defMatch = defAlts.some((alt) => dLow.includes(alt) || alt.includes(dLow));
    if (atkMatch && defMatch) return COUNTER_MULT_OLD;
  }
  return 1.0;
}

/** OLD attackerBonusVsType: reads units.json's "Bonus vs <defTyp> %" column, clamped. */
function attackerBonusVsTypeOLD(pct) {
  let p = pct;
  if (!Number.isFinite(p)) p = 0;
  if (p > 200) p = 200;
  if (p < -90) p = -90;
  return 1 + p / 100;
}

// ---------------------------------------------------------------------------
// Step 4: Build the FULL inventory of (attackerTyp, defenderTyp, pct) pairs
// with a nonzero bonus, straight from the CURRENT units.json "Bonus vs X %"
// columns (grepped independently of docs/decyzje/R-KONTRY-BITWA-SPOJNOSC-Q1.md
// per the task's instruction not to trust the doc's inventory blindly).
// ---------------------------------------------------------------------------
const BONUS_COLS = ['Swordsman', 'Spearman', 'Falangite', 'Offensive', 'Distance', 'Mount', 'Slinger'];

// pairKey -> { attackerTyp, defenderTyp, pct, units: [name,...] }
const pairs = new Map();
for (const u of unitsRaw) {
  const attackerTyp = String(u['Typ'] ?? '').trim();
  if (!attackerTyp) continue;
  for (const col of BONUS_COLS) {
    const raw = u['Bonus vs ' + col + ' %'];
    if (raw === undefined || raw === null || raw === '') continue;
    const pct = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (!Number.isFinite(pct) || pct === 0) continue;
    const key = attackerTyp + ' -> ' + col;
    if (!pairs.has(key)) {
      pairs.set(key, { attackerTyp, defenderTyp: col, pct, units: [] });
    } else {
      const existing = pairs.get(key);
      if (existing.pct !== pct) {
        console.error(
          'CONFLICT: pair ' + key + ' has inconsistent pct values: ' + existing.pct + ' vs ' + pct +
          ' (unit ' + u['Jednostka'] + ') -- ambiguous, NOT guessing, failing loudly.',
        );
        process.exit(1);
      }
    }
    pairs.get(key).units.push(u['Jednostka']);
  }
}

console.log('Found ' + pairs.size + ' distinct attacker-type/defender-type pairs with a nonzero bonus');
let totalUnitPairInstances = 0;
for (const p of pairs.values()) totalUnitPairInstances += p.units.length;
console.log('covering ' + totalUnitPairInstances + ' unit-level bonus instances (units.json rows x column).\n');

// ---------------------------------------------------------------------------
// Step 5: For each pair, compute OLD-combined vs NEW and assert per spec.
// ---------------------------------------------------------------------------
let passCount = 0;
let failCount = 0;
const rows = [];

for (const [key, p] of [...pairs.entries()].sort()) {
  const oldCtr = counterMultiplierOLD(p.attackerTyp, p.defenderTyp, countersOld);
  const oldBonus = attackerBonusVsTypeOLD(p.pct);
  const oldCombined = oldCtr * oldBonus;
  const dualSource = oldCtr !== 1.0; // pair already matched a row in the OLD counters.json snapshot

  const newMult = counterMultiplierNEW(p.attackerTyp, p.defenderTyp, countersNew);

  const errors = [];

  // Universal invariant: the bonus must never be lost -- multiplier stays > 1.0.
  if (!(newMult > 1.0)) {
    errors.push('newMult=' + newMult + ' is not > 1.0 -- bonus LOST for pair ' + key);
  }

  if (!dualSource) {
    // Single-source pair (only the old units.json path had it): pure
    // migration, NEW must be IDENTICAL to OLD combined.
    if (Math.abs(newMult - oldCombined) > 1e-9) {
      errors.push(
        'single-source pair must be IDENTICAL: oldCombined=' + oldCombined +
        ' newMult=' + newMult,
      );
    }
  } else {
    // Dual-source pair (double-counted bug: matched in old counters.json
    // AND had a units.json column): NEW must be LOWER than OLD combined
    // (duplicate removed) but the underlying bonus must still be present.
    if (!(newMult < oldCombined)) {
      errors.push(
        'dual-source pair must shrink (duplicate removed): oldCombined=' + oldCombined +
        ' newMult=' + newMult + ' (expected newMult < oldCombined)',
      );
    }
    // The de-duplicated value should match the single canonical bonus %
    // (1 + pct/100) exactly -- there is exactly one row per pair, so NEW
    // is just that row's own value now, with no OLD-flat-constant residue.
    const expectedDedup = 1 + p.pct / 100;
    if (Math.abs(newMult - expectedDedup) > 1e-9) {
      errors.push(
        'dual-source pair NEW should equal the single canonical bonus 1+pct/100=' +
        expectedDedup + ' but got ' + newMult,
      );
    }
  }

  const passed = errors.length === 0;
  if (passed) passCount++; else failCount++;

  rows.push({
    pair: key,
    pct: p.pct,
    unitCount: p.units.length,
    source: dualSource ? 'DUAL (old counters.json + old units.json col)' : 'SINGLE (old units.json col only)',
    oldCombined: oldCombined,
    newMult: newMult,
    passed: passed,
    errors: errors,
  });
}

// ---------------------------------------------------------------------------
// Step 6: also confirm counters.json-ONLY rows (present before the migration,
// with NO corresponding units.json bonus column at all -- e.g. Slinger ->
// Spearman) are completely unaffected: NEW must equal the OLD flat multiplier
// exactly, zero regression for pairs the migration never touched.
// ---------------------------------------------------------------------------
const untouchedPairs = [
  ['Slinger', 'Spearman'],
];
for (const [atk, def] of untouchedPairs) {
  const oldCtr = counterMultiplierOLD(atk, def, countersOld);
  const newMult = counterMultiplierNEW(atk, def, countersNew);
  const passed = oldCtr === newMult && oldCtr > 1.0;
  if (passed) passCount++; else failCount++;
  rows.push({
    pair: atk + ' -> ' + def,
    pct: '(counters.json only)',
    unitCount: '-',
    source: 'counters.json-ONLY (no units.json column, untouched by migration)',
    oldCombined: oldCtr,
    newMult: newMult,
    passed: passed,
    errors: passed ? [] : ['expected NEW === OLD (' + oldCtr + ') but got ' + newMult],
  });
}

// ---------------------------------------------------------------------------
// Step 7: print the table + summary
// ---------------------------------------------------------------------------
console.log('========================================================================');
console.log('COUNTER MIGRATION ZERO-LOSS TEST');
console.log('========================================================================\n');
console.log(
  padEnd('Pair', 26) + padEnd('%', 6) + padEnd('Units', 7) +
  padEnd('Source', 46) + padEnd('OLD combined', 14) + padEnd('NEW', 8) + 'Result',
);
console.log('-'.repeat(120));
for (const r of rows) {
  console.log(
    padEnd(r.pair, 26) + padEnd(String(r.pct), 6) + padEnd(String(r.unitCount), 7) +
    padEnd(r.source, 46) +
    padEnd(fmtNum(r.oldCombined), 14) + padEnd(fmtNum(r.newMult), 8) +
    (r.passed ? 'PASS' : 'FAIL: ' + r.errors.join('; ')),
  );
}
console.log('');

function fmtNum(n) {
  return typeof n === 'number' ? n.toFixed(4) : String(n);
}
function padEnd(s, n) {
  s = String(s);
  return s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length);
}

const total = passCount + failCount;
console.log('========================================================================');
console.log('COUNTER MIGRATION TEST: ' + passCount + '/' + total + ' pass');
if (failCount > 0) {
  console.log('FAILURES: ' + failCount);
  process.exit(1);
} else {
  console.log('All pairs migrated with zero bonus loss.');
}
