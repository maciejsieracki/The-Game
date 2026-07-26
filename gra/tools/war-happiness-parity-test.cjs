'use strict';
/**
 * war-happiness-parity-test.cjs -- standalone Node test dla R-WOJNA-KARA-PARYTET
 * (decyzja Macieja 2026-07-26, PARYTET AI, Zadanie 2 zlecenia C-AI-SUWAKI-A):
 * kara za wojnę w Szczęściu miasta (`evaluateOrderFromBreakdown` /
 * `computeHappinessBreakdown`, pole `atWar`) dotąd była naliczana WYŁĄCZNIE
 * miastom gracza (ownerId 0) -- main.ts liczył
 * `city.ownerId === 0 && isPlayerAtWar()`. Miasta AI/miast-państw nigdy nie
 * odczuwały wojny.
 *
 * Naprawa: logika sprawdzania "czy ownerId jest w wojnie z kimkolwiek" jest
 * teraz w `isOwnerAtWarInRelations` (game/diplomacy.ts) -- CZYSTA funkcja,
 * ownerId jako parametr, zero specjalnej ścieżki dla ownerId===0. main.ts
 * `isOwnerAtWar(ownerId)` jest już tylko cienkim wrapperem nad nią
 * (`isOwnerAtWarInRelations(ownerId, diplomacyRelations)`).
 *
 * Run from gra/:  node tools/war-happiness-parity-test.cjs
 *
 * Wzorowany na tools/happiness-breakdown-test.cjs (esbuild bundling + styl
 * asercji) i tools/ai-slider-test.cjs (styl tabeli przypadków).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[war-happiness-parity-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.war-happiness-parity-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.war-happiness-parity-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { isOwnerAtWarInRelations } from '../src/game/diplomacy';
export { computeHappinessBreakdown } from '../src/game/society-breakdown';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[war-happiness-parity-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { isOwnerAtWarInRelations, computeHappinessBreakdown } = M;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function relMap(entries) {
  return new Map(entries.map(([k, status]) => [k, { status }]));
}

console.log('\n-- A. isOwnerAtWarInRelations: tabela przypadkow --');

// 1. Gracz (0) i AI (2) w wojnie miedzy soba -> OBIE strony "w wojnie"
{
  const rel = relMap([['0_2', 'wojna']]);
  eq(isOwnerAtWarInRelations(0, rel), true, 'owner 0 (strona wojny 0_2) -> true');
  eq(isOwnerAtWarInRelations(2, rel), true, 'owner 2 (strona wojny 0_2) -> true (PARYTET -- dawniej zawsze false dla AI)');
}

// 2. Owner spoza tej relacji -> false
{
  const rel = relMap([['0_2', 'wojna']]);
  eq(isOwnerAtWarInRelations(3, rel), false, 'owner 3 (poza relacja 0_2) -> false');
}

// 3. Dwa AI w wojnie miedzy soba (gracz nie zaangazowany) -> obie strony true, gracz false
{
  const rel = relMap([['2_5', 'wojna']]);
  eq(isOwnerAtWarInRelations(2, rel), true, 'AI vs AI: owner 2 -> true');
  eq(isOwnerAtWarInRelations(5, rel), true, 'AI vs AI: owner 5 -> true');
  eq(isOwnerAtWarInRelations(0, rel), false, 'AI vs AI: gracz (0) niezaangazowany -> false');
}

// 4. Status != 'wojna' (pokoj/sojusz/neutralni) -> false
{
  const rel = relMap([['0_2', 'pokoj'], ['0_3', 'sojusz'], ['0_4', 'neutralni']]);
  eq(isOwnerAtWarInRelations(0, rel), false, 'brak relacji ze statusem wojna -> false');
}

// 5. Barbarzyncy (ownerId ujemny, BARBARIAN_OWNER_ID=-1) sa pomijani (C-BARB-Q1)
{
  const rel = relMap([['0_-1', 'wojna']]);
  eq(isOwnerAtWarInRelations(0, rel), false, 'relacja z barbarzynca (zawsze wojna) -> pominieta, false');
}

// 6. Pusta mapa relacji -> false
{
  eq(isOwnerAtWarInRelations(0, new Map()), false, 'brak relacji w ogole -> false');
}

// 7. Klucz z nieparsowalna para -> pominiety bezpiecznie (brak wyjatku)
{
  const rel = relMap([['abc', 'wojna'], ['0_2', 'wojna']]);
  eq(isOwnerAtWarInRelations(0, rel), true, 'zle sformatowany klucz obok poprawnego -> poprawny nadal dziala');
}

console.log('\n-- B. Koniec-do-konca: kara za wojne trafia TAKZE do miasta AI --');

const CITY_BASE = { population: 6, buildingZadowolenie: 0 };

// 8. Gracz (owner 0) w wojnie -> linia 'wojna' w Szczesciu (parametr szczescie_kara_wojna, default -3)
{
  const rel = relMap([['0_2', 'wojna']]);
  const atWarPlayer = isOwnerAtWarInRelations(0, rel);
  eq(atWarPlayer, true, 'end-to-end: gracz jest w wojnie (wejscie do Szczescia)');
  const bp = computeHappinessBreakdown({ ...CITY_BASE, atWar: atWarPlayer });
  const wojnaLine = bp.lines.find(l => l.id === 'wojna');
  assert(!!wojnaLine, 'end-to-end gracz: linia "wojna" obecna w rozpisce Szczescia');
  eq(wojnaLine.value, -3, 'end-to-end gracz: kara za wojne = -3 (domyslny parametr szczescie_kara_wojna)');
}

// 9. Miasto AI (owner 2, ta sama relacja 0_2) -> TA SAMA kara za wojne (PARYTET -- to naprawia bug)
{
  const rel = relMap([['0_2', 'wojna']]);
  const atWarAi = isOwnerAtWarInRelations(2, rel);
  eq(atWarAi, true, 'end-to-end: AI (owner 2) jest w wojnie (wejscie do Szczescia)');
  const bp = computeHappinessBreakdown({ ...CITY_BASE, atWar: atWarAi });
  const wojnaLine = bp.lines.find(l => l.id === 'wojna');
  assert(!!wojnaLine, 'end-to-end AI: linia "wojna" obecna w rozpisce Szczescia (PRZED naprawa: zawsze nieobecna dla AI)');
  eq(wojnaLine.value, -3, 'end-to-end AI: kara za wojne = -3, identyczna jak u gracza (parytet)');
}

// 10. Trzeci owner (3) niezaangazowany w zadna wojne -> BRAK linii 'wojna' (kontrola negatywna)
{
  const rel = relMap([['0_2', 'wojna']]);
  const atWarNeutral = isOwnerAtWarInRelations(3, rel);
  eq(atWarNeutral, false, 'end-to-end: owner 3 nie jest w wojnie');
  const bp = computeHappinessBreakdown({ ...CITY_BASE, atWar: atWarNeutral });
  const wojnaLine = bp.lines.find(l => l.id === 'wojna');
  assert(!wojnaLine, 'end-to-end owner neutralny: brak linii "wojna" w rozpisce Szczescia');
}

console.log(`\nwar-happiness-parity-test: ${passed} passed, ${failed} failed`);

try { fs.unlinkSync(ENTRY_FILE); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_e) { /* noop */ }

process.exit(failed > 0 ? 1 : 0);
