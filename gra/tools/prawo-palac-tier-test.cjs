'use strict';
/**
 * prawo-palac-tier-test.cjs — Prawo z Pałacu rośnie z tierem (B-PALAC-TIER-PRAWO,
 * decyzja Macieja 2026-07-25: Pytanie 27=A, Pytanie 28 Pretorium=70% Pałacu III).
 * Run: cd gra && node tools/prawo-palac-tier-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.prawo-palac-tier-entry.ts');
const BUNDLE = path.resolve(__dirname, '.prawo-palac-tier-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { computeLawBreakdown } from '../src/game/society-breakdown';
export { cityPalacTier, cityHasPalacLine } from '../src/game/building-upgrades';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[prawo-palac-tier-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const society = require('../data/society-params.json');

let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

console.log('\n[prawo-palac-tier-test]\n');

function palacValue(diff, tier, ownerId) {
  const input = {
    garnizonCount: 0,
    era: 3,
    difficulty: diff,
    palacTier: tier,
    ownerId, // nie powinno być czytane przez computeLawBreakdown -- parytet AI
  };
  const res = M.computeLawBreakdown(input, society);
  const line = res.lines.find(l => l.id === 'palac');
  return { value: line ? line.value : 0, label: line ? line.label : null, lines: res.lines };
}

// --- cityPalacTier (building-upgrades.ts) -----------------------------------
eq(M.cityPalacTier(['palac']), 1, 'cityPalacTier: palac -> 1');
eq(M.cityPalacTier(['palac_ii']), 2, 'cityPalacTier: palac_ii -> 2');
eq(M.cityPalacTier(['palac_iii']), 3, 'cityPalacTier: palac_iii -> 3');
eq(M.cityPalacTier(['palac', 'palac_iii']), 3, 'cityPalacTier: kilka wpisów -> najwyższy tier (3)');
eq(M.cityPalacTier(['ratusz']), null, 'cityPalacTier: brak Pałacu -> null');
eq(M.cityHasPalacLine(['palac_ii']), true, 'cityHasPalacLine nadal działa (nie usunięta)');

// --- Wartości Prawa wg tieru (normal) ---------------------------------------
eq(palacValue('normal', 1).value, 35, 'Pałac I (normal) -> 35');
eq(palacValue('normal', 2).value, 45, 'Pałac II (normal) -> 45');
eq(palacValue('normal', 3).value, 55, 'Pałac III (normal) -> 55');

// --- Wartości Prawa wg tieru (easy) ------------------------------------------
eq(palacValue('easy', 1).value, 45, 'Pałac I (easy) -> 45');
eq(palacValue('easy', 2).value, 58, 'Pałac II (easy) -> 58');
eq(palacValue('easy', 3).value, 71, 'Pałac III (easy) -> 71');

// --- Wartości Prawa wg tieru (hard) ------------------------------------------
eq(palacValue('hard', 1).value, 28, 'Pałac I (hard) -> 28');
eq(palacValue('hard', 2).value, 36, 'Pałac II (hard) -> 36');
eq(palacValue('hard', 3).value, 44, 'Pałac III (hard) -> 44');

// --- Etykiety -----------------------------------------------------------------
eq(palacValue('normal', 1).label, 'Pałac', 'Etykieta tier 1 = "Pałac"');
eq(palacValue('normal', 2).label, 'Pałac II', 'Etykieta tier 2 = "Pałac II"');
eq(palacValue('normal', 3).label, 'Pałac III', 'Etykieta tier 3 = "Pałac III"');

// --- Wsteczna zgodność: hasPalac:true bez tieru -> tier 1 (35 normal) ---------
{
  const res = M.computeLawBreakdown({ garnizonCount: 0, era: 3, difficulty: 'normal', hasPalac: true }, society);
  const line = res.lines.find(l => l.id === 'palac');
  eq(line ? line.value : 0, 35, 'hasPalac:true bez tieru -> wsteczna zgodność, tier 1 (35)');
  eq(line ? line.label : null, 'Pałac', 'hasPalac:true bez tieru -> etykieta "Pałac"');
}

// --- Tylko JEDEN wpis Pałacu w rozbiciu (nigdy suma) --------------------------
{
  const res = M.computeLawBreakdown({ garnizonCount: 0, era: 3, difficulty: 'normal', palacTier: 3 }, society);
  const palacLines = res.lines.filter(l => l.id === 'palac');
  eq(palacLines.length, 1, 'Zawsze dokładnie jeden wpis Pałacu w rozbiciu (tier 3)');
}

// --- Pretorium / Sąd (normal) --------------------------------------------------
{
  const res = M.computeLawBreakdown({ garnizonCount: 0, era: 3, difficulty: 'normal', hasPretorium: true }, society);
  eq(res.lines.find(l => l.id === 'pretorium')?.value, 38, 'Pretorium (normal) -> 38');
}
{
  const res = M.computeLawBreakdown({ garnizonCount: 0, era: 3, difficulty: 'normal', hasSad: true }, society);
  eq(res.lines.find(l => l.id === 'sad')?.value, 19, 'Sąd (normal) -> 19');
}

// --- Miasto z Pałacem III + Pretorium + Sąd -> jeden wpis Pałacu, suma 55+38+19=112
{
  const res = M.computeLawBreakdown({
    garnizonCount: 0, era: 3, difficulty: 'normal',
    palacTier: 3, hasPretorium: true, hasSad: true,
  }, society);
  const palacLines = res.lines.filter(l => l.id === 'palac');
  eq(palacLines.length, 1, 'Pałac III + Pretorium + Sąd -> jeden wpis Pałacu');
  const palac = palacLines[0]?.value ?? 0;
  const pretorium = res.lines.find(l => l.id === 'pretorium')?.value ?? 0;
  const sad = res.lines.find(l => l.id === 'sad')?.value ?? 0;
  eq(palac + pretorium + sad, 112, 'Pałac III (55) + Pretorium (38) + Sąd (19) = 112');
}

// --- Parytet AI: wynik identyczny dla dwóch różnych ownerId -------------------
{
  const inputBase = { garnizonCount: 2, era: 3, difficulty: 'normal', palacTier: 2, hasPretorium: true, hasSad: true };
  const resPlayer = M.computeLawBreakdown({ ...inputBase, ownerId: 0 }, society);
  const resAi = M.computeLawBreakdown({ ...inputBase, ownerId: 3 }, society);
  eq(JSON.stringify(resPlayer), JSON.stringify(resAi), 'Parytet AI: wynik identyczny niezależnie od ownerId');
}

// ---------------------------------------------------------------------------
// ZADANIE 2 (decyzja 44, 2026-07-25): usunięcie Ratusza -- martwe ślady muszą zniknąć
// całkowicie, bez zostawiania kodu "na wszelki wypadek".
// ---------------------------------------------------------------------------
console.log('\n[Ratusz -- usunięcie, decyzja 44]\n');

ok(!Object.prototype.hasOwnProperty.call(society.prawo ?? {}, 'prawo_ratusz'),
  'society-params.json: klucz "prawo_ratusz" USUNIĘTY z bloku prawo');

{
  // computeLawBreakdown nie zna już Ratusza -- przekazanie hasRatusz (pole obce,
  // spoza typu LawBreakdownInput od strony JS) nie może wyprodukować linii 'ratusz'
  // ani wpłynąć na wynik względem tego samego inputu bez tego pola.
  const withoutFlag = { garnizonCount: 0, era: 3, difficulty: 'normal', hasPretorium: true };
  const withStrayFlag = { ...withoutFlag, hasRatusz: true };
  const resWithout = M.computeLawBreakdown(withoutFlag, society);
  const resWithStray = M.computeLawBreakdown(withStrayFlag, society);
  ok(!resWithout.lines.some(l => l.id === 'ratusz'), 'computeLawBreakdown: brak linii "ratusz" w rozbiciu');
  ok(!resWithStray.lines.some(l => l.id === 'ratusz'), 'computeLawBreakdown: pole hasRatusz (obce, nieznane typowi) jest ignorowane -- nadal brak linii "ratusz"');
  eq(JSON.stringify(resWithout), JSON.stringify(resWithStray), 'computeLawBreakdown: wynik identyczny z/bez zignorowanego pola hasRatusz -- Ratusz nie wpływa już na nic');
}

console.log('\n[prawo-palac-tier-test] ' + passed + ' OK, ' + failed + ' FAIL\n');
process.exit(failed > 0 ? 1 : 0);
