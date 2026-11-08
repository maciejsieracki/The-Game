'use strict';
/**
 * spichlerz-drain-pipeline-test.cjs — R-WEB-SPICHLERZ-DRAIN-KEYS-Q1 (runda 2, zarzuty Evaluatora 1+3).
 * Test PRZEZ advanceCityEconomy (realna ścieżka: tickEmpireResourcePipeline → drain Spichlerza).
 *
 *  A) GOLDEN (uruchamiany także na bazie 4d1916f2c, bez nowych eksportów):
 *     scenariusze brak/I/II/I+II × magazyn 24/25/26 (+ dwa miasta, pula 49/50/51 i sól 24/25/26),
 *     trzy poziomy trudności. Wynik zamieniany na digest sha256; digest na bazie === digest po zmianie.
 *  B) KLUCZE CZYTANE (tylko HEAD): podmiana klucza JSON per trudność (10/40/60) zmienia zużycie
 *     dokładnie o tę wartość przez advanceCityEconomy; klucze I/II/Sól niezależne; próg płatności też z JSON.
 *
 * Tryb bazowy: SPICH_GOLDEN_ONLY=1 pomija B (na bazie klucze są martwe — B ma wtedy padać).
 * Run from gra/: node tools/spichlerz-drain-pipeline-test.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const TAG = `spichlerz-drain-pipeline-${process.pid}`;
const ENTRY = path.join(__dirname, `.${TAG}-entry.ts`);
const BUNDLE = path.join(__dirname, `.${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `export { advanceCityEconomy } from '../src/game/turn-economy';\n`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
});
const M = require(BUNDLE);
const D = f => JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', f), 'utf8'));
const DATA_BASE = {
  civs: D('civs.json'), econParams: D('econ-params.json'), societyParams: D('society-params.json'),
  buildings: D('buildings.json'), units: D('units.json'), tech: D('tech.json'),
};
const ECON = DATA_BASE.econParams;
const DIFFS = ['easy', 'normal', 'hard'];
const K_I = 'budynek_spichlerz_zuzywa_ceramika';
const K_II = 'budynek_spichlerz_ii_zuzywa_ceramika';
const K_SOL = 'budynek_spichlerz_ii_zuzywa_sol';

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function econWith(key, diff, val) {
  const e = clone(ECON);
  e.budynki[key][diff] = val;
  return e;
}
function city(id, cer, sol) {
  return { id, ownerId: 0, q: 0, r: 0, name: id, population: 1, magazynZywnosci: 10,
    surowce: { ceramika: cer, sol } };
}
// Jedna tura advanceCityEconomy; zwraca [ceramika, sol] per miasto (?? 0 — brak klucza = 0).
function tick(cities, builtLists, diff, econ) {
  const map = { hexes: {} };
  const builtByCity = new Map(cities.map((c, i) => [c.id, builtLists[i] ?? []]));
  const data = econ ? { ...DATA_BASE, econParams: econ } : DATA_BASE;
  M.advanceCityEconomy(cities, map, data, diff, [], new Map(), builtByCity);
  return cities.map(c => [c.surowce.ceramika ?? 0, c.surowce.sol ?? 0]);
}

// ---------------------------------------------------------------------------
console.log('[A] golden przez advanceCityEconomy (digest base === head)');
{
  const measured = {};
  const sets = [[], ['spichlerz'], ['spichlerz_ii'], ['spichlerz', 'spichlerz_ii']];
  for (const diff of DIFFS) {
    for (const b of sets) for (const cer of [24, 25, 26]) for (const sol of [24, 25, 26]) {
      const key = `${diff}|1|${b.join('+') || 'none'}|c${cer}|s${sol}`;
      measured[key] = tick([city('A', cer, sol)], [b], diff)[0];
    }
    for (const tot of [49, 50, 51]) {
      const cs = [city('A', Math.floor(tot / 2), 0), city('B', tot - Math.floor(tot / 2), 0)];
      measured[`${diff}|2I|c${tot}`] = tick(cs, [['spichlerz'], ['spichlerz']], diff);
    }
    for (const tot of [24, 25, 26]) {
      const cs = [city('A', 0, Math.floor(tot / 2)), city('B', 0, tot - Math.floor(tot / 2))];
      measured[`${diff}|2II|s${tot}`] = tick(cs, [['spichlerz_ii'], ['spichlerz_ii']], diff);
    }
  }
  const digest = crypto.createHash('sha256').update(JSON.stringify(measured)).digest('hex');
  console.log(`  GOLDEN-DIGEST sha256=${digest} (scenariuszy: ${Object.keys(measured).length})`);
  // Analityczne oczekiwania (25/25/25): ceramika −25 gdy magazyn ≥25 i jest Spichlerz I lub II (jedna wypłata/miasto);
  // sól −25 tylko przy Spichlerzu II i soli ≥25; brak budynku → bez zmian.
  let allOk = true;
  for (const diff of DIFFS) {
    for (const b of sets) for (const cer of [24, 25, 26]) for (const sol of [24, 25, 26]) {
      const got = measured[`${diff}|1|${b.join('+') || 'none'}|c${cer}|s${sol}`];
      const hasS = b.length > 0;
      const hasII = b.includes('spichlerz_ii');
      const cPaid = hasS && cer >= 25;
      const sPaid = hasII && sol >= 25;
      const want = [cer - (cPaid ? 25 : 0), sol - (sPaid ? 25 : 0)];
      if (got[0] !== want[0] || got[1] !== want[1]) { allOk = false; console.error('   mismatch', diff, b, cer, sol, got, want); }
    }
    for (const tot of [49, 50, 51]) {
      const got = measured[`${diff}|2I|c${tot}`];
      const sum = got[0][0] + got[1][0];
      const paid = Math.floor(tot / 2) >= 25 ? 1 : 0;
      const payers = (Math.floor(tot / 2) >= 25 ? 1 : 0) + ((tot - Math.floor(tot / 2)) >= 25 ? 1 : 0);
      if (sum !== tot - 25 * payers) { allOk = false; console.error('   mismatch 2I', diff, tot, got); }
      void paid;
    }
    for (const tot of [24, 25, 26]) {
      const got = measured[`${diff}|2II|s${tot}`];
      const sum = got[0][1] + got[1][1];
      if (sum !== (tot >= 25 ? tot - 25 : tot)) { allOk = false; console.error('   mismatch 2II', diff, tot, got); }
    }
  }
  ok(allOk, 'golden: wynik zgodny z analitycznym 25/25/25 (N-1/N/N+1, jedno i dwa miasta, sól imperium-wide)');
  ok(measured[`normal|1|spichlerz|c25|s25`][0] === 0, 'golden: Spichlerz I przy 25 ceramiki zużywa 25 (25→0)');
  ok(measured[`normal|2I|c50`][0][0] === 0 && measured[`normal|2I|c50`][1][0] === 0,
    'golden: dwa miasta z I, pula 50 → dwie wypłaty (0/0), jak dotąd');
  ok(measured[`normal|1|spichlerz+spichlerz_ii|c25|s25`][0] === 0 && measured[`normal|1|spichlerz+spichlerz_ii|c25|s25`][1] === 0,
    'golden: miasto z I+II przy 25/25 — jedna wypłata ceramiki i sól zużyta (ZAŁOŻENIE: patrz raport)');
}

// ---------------------------------------------------------------------------
if (process.env.SPICH_GOLDEN_ONLY === '1') {
  console.log('[B] pominięte (SPICH_GOLDEN_ONLY=1, tryb bazowy)');
} else {
  console.log('[B] klucze JSON czytane przez advanceCityEconomy (per trudność, każdy klucz osobno)');
  const VAL = { easy: 10, normal: 40, hard: 60 };
  for (const d of DIFFS) {
    // Spichlerz I: ceramika z K_I; 100 → 100−val.
    const r1 = tick([city('A', 100, 0)], [['spichlerz']], d, econWith(K_I, d, VAL[d]))[0];
    ok(r1[0] === 100 - VAL[d], `Spichlerz I (${d}) zużywa ${VAL[d]} ceramiki z JSON: 100→${100 - VAL[d]} (got ${r1[0]})`);
    // Spichlerz II: ceramika z K_II, sól bez zmian (25 domyślnie).
    const r2 = tick([city('A', 100, 100)], [['spichlerz_ii']], d, econWith(K_II, d, VAL[d]))[0];
    ok(r2[0] === 100 - VAL[d] && r2[1] === 75,
      `Spichlerz II (${d}) ceramika ${VAL[d]} z K_II, sól nadal 25 (got ${JSON.stringify(r2)})`);
    // Sól II: sól z K_SOL, ceramika bez zmian (25 domyślnie).
    const r3 = tick([city('A', 100, 100)], [['spichlerz_ii']], d, econWith(K_SOL, d, VAL[d]))[0];
    ok(r3[1] === 100 - VAL[d] && r3[0] === 75,
      `Sól II (${d}) zużywa ${VAL[d]} z K_SOL, ceramika nadal 25 (got ${JSON.stringify(r3)})`);
    // Brak mieszania I↔II: zmiana K_I nie zmienia Spichlerza II i odwrotnie.
    const rSwapA = tick([city('A', 100, 0)], [['spichlerz_ii']], d, econWith(K_I, d, VAL[d]))[0];
    ok(rSwapA[0] === 75, `zamiana I↔II (${d}): zmiana K_I nie wpływa na Spichlerz II (got ${rSwapA[0]})`);
    const rSwapB = tick([city('A', 100, 0)], [['spichlerz']], d, econWith(K_II, d, VAL[d]))[0];
    ok(rSwapB[0] === 75, `zamiana I↔II (${d}): zmiana K_II nie wpływa na Spichlerz I (got ${rSwapB[0]})`);
    // Próg płatności z JSON: magazyn 30 < 40 → brak wypłaty (30 zostaje) dla klucza 40.
    if (VAL[d] > 30) {
      const th = tick([city('A', 30, 0)], [['spichlerz']], d, econWith(K_I, d, VAL[d]))[0];
      ok(th[0] === 30, `próg (${d}): magazyn 30 < ${VAL[d]} → brak wypłaty (got ${th[0]})`);
    }
  }
}

console.log(`spichlerz-drain-pipeline-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exitCode = fail ? 1 : 0;
