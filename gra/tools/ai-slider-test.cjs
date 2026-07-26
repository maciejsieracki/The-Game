'use strict';
/**
 * ai-slider-test.cjs -- standalone Node test dla R-AI-SUWAKI (decyzja Macieja
 * 2026-07-26, C-AI-SUWAKI=A, PARYTET AI): AI zaczyna ruszać suwakami ekonomii
 * (świeża żywność / Praca / Handel), zamiast siedzieć na wartościach
 * startowych całą partię -- patrz decideAIEconomySliders (game/ai.ts).
 *
 * Run from gra/:  node tools/ai-slider-test.cjs
 *
 * Wzorowany na tools/ai-unit-rush-test.cjs (ten sam sposob budowania bundla
 * esbuild + styl asercji).
 *
 * Predykat (CZYSTY, bez dostępu do main.ts/stanu gry):
 *   decideAIEconomySliders({ zapasyPanstwa, atWar, turn, lastSliderChangeTurn,
 *                            current: { procentRozwoj, procentBudynki, procentNauka } },
 *                          { deficytZapasowProg, nadwyzkaZapasowProg,
 *                            krokProcentRozwoj, krokProcentPracaNauka, minOdstepTur })
 *     -> { procentRozwoj, procentBudynki, procentNauka, changed }
 *
 * Pokrywa:
 *   - deficyt zapasów żywności -> procentRozwoj w dół (ku armii)
 *   - wyraźna nadwyżka zapasów żywności -> procentRozwoj w górę (ku rozwojowi)
 *   - strefa neutralna (między progami) -> procentRozwoj bez zmian
 *   - wojna -> procentBudynki w górę / procentNauka w dół
 *   - pokój -> procentBudynki w dół / procentNauka w górę
 *   - blokada oscylacji: cooldown aktywny -> zero zmian mimo wyzwalaczy
 *   - cooldown wygasł (dokładnie na progu minOdstepTur) -> zmiana przechodzi
 *   - brzegi clamp 0/100
 *   - determinizm + brak mutacji wejścia
 *   - loadAiSliderParams: wiersze z econ-params.json + fallback przy braku/złych danych
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[ai-slider-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-slider-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-slider-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { decideAIEconomySliders, loadAiSliderParams } from '../src/game/ai';
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
  console.error('[ai-slider-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { decideAIEconomySliders, loadAiSliderParams } = M;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  assert(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

const PARAMS = {
  deficytZapasowProg:    0,
  nadwyzkaZapasowProg:   50,
  krokProcentRozwoj:     10,
  krokProcentPracaNauka: 10,
  minOdstepTur:          3,
};

const CURRENT = { procentRozwoj: 100, procentBudynki: 70, procentNauka: 20 };

function inp(overrides) {
  return {
    zapasyPanstwa: 100,
    atWar: false,
    turn: 10,
    lastSliderChangeTurn: null,
    current: { ...CURRENT },
    ...overrides,
  };
}

console.log('\n-- A. Suwak zywnosci: deficyt / nadwyzka / strefa neutralna --');

// 1. Deficyt zapasow (< prog) -> procentRozwoj w dol o krok
{
  const r = decideAIEconomySliders(inp({ zapasyPanstwa: -1 }), PARAMS);
  eq(r.changed, true, 'deficyt zapasow -> changed=true');
  eq(r.procentRozwoj, 90, 'deficyt zapasow -> procentRozwoj -10');
}

// 2. Zapasy dokladnie na progu deficytu (== prog, NIE < prog) -> brak zmiany zywnosci
{
  const r = decideAIEconomySliders(inp({ zapasyPanstwa: 0 }), PARAMS);
  eq(r.procentRozwoj, 100, 'zapasy == prog deficytu -> procentRozwoj bez zmian');
}

// 3. Wyrazna nadwyzka (> prog) -> procentRozwoj w gore o krok (od nizszej bazy)
{
  const r = decideAIEconomySliders(
    inp({ zapasyPanstwa: 51, current: { ...CURRENT, procentRozwoj: 50 } }),
    PARAMS,
  );
  eq(r.changed, true, 'wyrazna nadwyzka -> changed=true');
  eq(r.procentRozwoj, 60, 'wyrazna nadwyzka -> procentRozwoj +10');
}

// 4. Zapasy dokladnie na progu nadwyzki (== prog, NIE > prog) -> brak zmiany zywnosci
{
  const r = decideAIEconomySliders(
    inp({ zapasyPanstwa: 50, current: { ...CURRENT, procentRozwoj: 50 } }),
    PARAMS,
  );
  eq(r.procentRozwoj, 50, 'zapasy == prog nadwyzki -> procentRozwoj bez zmian');
}

// 5. Strefa neutralna (miedzy progami) -> procentRozwoj bez zmian
{
  const r = decideAIEconomySliders(inp({ zapasyPanstwa: 25 }), PARAMS);
  eq(r.procentRozwoj, 100, 'strefa neutralna -> procentRozwoj bez zmian');
}

// 6. Clamp: procentRozwoj juz na 0, dalszy deficyt -> zostaje 0, changed=false (bo nic sie nie zmienilo)
{
  const r = decideAIEconomySliders(
    inp({ zapasyPanstwa: -1, current: { ...CURRENT, procentRozwoj: 0 } }),
    PARAMS,
  );
  eq(r.procentRozwoj, 0, 'clamp dolny procentRozwoj -> zostaje 0');
}

// 7. Clamp: procentRozwoj juz na 100, dalsza nadwyzka -> zostaje 100
{
  const r = decideAIEconomySliders(
    inp({ zapasyPanstwa: 999, current: { ...CURRENT, procentRozwoj: 100 } }),
    PARAMS,
  );
  eq(r.procentRozwoj, 100, 'clamp gorny procentRozwoj -> zostaje 100');
}

console.log('\n-- B. Suwaki Praca/Nauka: wojna vs pokoj --');

// 8. Wojna -> procentBudynki w gore, procentNauka w dol
{
  const r = decideAIEconomySliders(inp({ atWar: true, zapasyPanstwa: 25 }), PARAMS);
  eq(r.changed, true, 'wojna -> changed=true');
  eq(r.procentBudynki, 80, 'wojna -> procentBudynki +10');
  eq(r.procentNauka, 10, 'wojna -> procentNauka -10');
}

// 9. Pokoj -> procentBudynki w dol, procentNauka w gore
{
  const r = decideAIEconomySliders(inp({ atWar: false, zapasyPanstwa: 25 }), PARAMS);
  eq(r.changed, true, 'pokoj -> changed=true');
  eq(r.procentBudynki, 60, 'pokoj -> procentBudynki -10');
  eq(r.procentNauka, 30, 'pokoj -> procentNauka +10');
}

// 10. Kombinacja: deficyt + wojna -> wszystkie trzy suwaki ruszaja sie naraz
{
  const r = decideAIEconomySliders(inp({ atWar: true, zapasyPanstwa: -5 }), PARAMS);
  eq(r.changed, true, 'deficyt+wojna -> changed=true');
  eq(r.procentRozwoj, 90, 'deficyt+wojna -> procentRozwoj -10');
  eq(r.procentBudynki, 80, 'deficyt+wojna -> procentBudynki +10');
  eq(r.procentNauka, 10, 'deficyt+wojna -> procentNauka -10');
}

// 11. Brak zadnego wyzwalacza (zapasy neutralne + pokoj juz na docelowych wartosciach) -> changed=false
{
  const r = decideAIEconomySliders(
    inp({ atWar: false, zapasyPanstwa: 25, current: { procentRozwoj: 100, procentBudynki: 0, procentNauka: 100 } }),
    PARAMS,
  );
  eq(r.changed, false, 'brak wyzwalacza (juz na skrajnych wartosciach pokoju) -> changed=false');
}

console.log('\n-- C. Zabezpieczenie przed oscylacja (minOdstepTur) --');

// 12. Cooldown aktywny (ostatnia zmiana 1 ture temu, prog=3) -> zero zmian mimo wyzwalaczy
{
  const r = decideAIEconomySliders(
    inp({ zapasyPanstwa: -1, atWar: true, turn: 11, lastSliderChangeTurn: 10 }),
    PARAMS,
  );
  eq(r.changed, false, 'cooldown aktywny (1/3 tur) -> changed=false');
  deepEq(
    { procentRozwoj: r.procentRozwoj, procentBudynki: r.procentBudynki, procentNauka: r.procentNauka },
    CURRENT,
    'cooldown aktywny -> wartosci bez zmian',
  );
}

// 13. Cooldown dokladnie na progu (turn - lastChange === minOdstepTur) -> zmiana przechodzi
{
  const r = decideAIEconomySliders(
    inp({ zapasyPanstwa: -1, turn: 13, lastSliderChangeTurn: 10 }),
    PARAMS,
  );
  eq(r.changed, true, 'cooldown dokladnie wygasl (3/3 tur) -> changed=true');
}

// 14. lastSliderChangeTurn = null (nigdy nie zmieniano) -> zmiana przechodzi od razu
{
  const r = decideAIEconomySliders(
    inp({ zapasyPanstwa: -1, turn: 1, lastSliderChangeTurn: null }),
    PARAMS,
  );
  eq(r.changed, true, 'lastSliderChangeTurn=null -> zmiana przechodzi od razu');
}

console.log('\n-- D. Determinizm + brak mutacji wejscia --');

// 15. Deterministyczny: dwa wywolania z tym samym wejsciem -> identyczny wynik
{
  const a = decideAIEconomySliders(inp({ zapasyPanstwa: -1, atWar: true }), PARAMS);
  const b = decideAIEconomySliders(inp({ zapasyPanstwa: -1, atWar: true }), PARAMS);
  deepEq(a, b, 'dwa wywolania z tym samym wejsciem -> identyczny wynik');
}

// 16. current nie jest mutowane
{
  const current = { ...CURRENT };
  const frozenCopy = { ...current };
  decideAIEconomySliders(inp({ zapasyPanstwa: -1, atWar: true, current }), PARAMS);
  deepEq(current, frozenCopy, 'obiekt current nie zostal zmutowany przez decideAIEconomySliders');
}

console.log('\n-- E. loadAiSliderParams: czytanie z econ-params.json + fallback --');

// 17. Odczyt realnych wartosci z gra/data/econ-params.json (normal)
{
  const raw = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'econ-params.json'), 'utf8'));
  const p = loadAiSliderParams(raw, 'normal');
  eq(p.deficytZapasowProg, 0, 'econ-params.json normal: deficytZapasowProg');
  eq(p.nadwyzkaZapasowProg, 50, 'econ-params.json normal: nadwyzkaZapasowProg');
  eq(p.krokProcentRozwoj, 10, 'econ-params.json normal: krokProcentRozwoj');
  eq(p.krokProcentPracaNauka, 10, 'econ-params.json normal: krokProcentPracaNauka');
  eq(p.minOdstepTur, 3, 'econ-params.json normal: minOdstepTur');
}

// 18. Brak sekcji globalne -> fallback na wartosci domyslne (nigdy nie psuje tury)
{
  const p = loadAiSliderParams({}, 'hard');
  eq(p.deficytZapasowProg, 0, 'fallback: deficytZapasowProg');
  eq(p.nadwyzkaZapasowProg, 50, 'fallback: nadwyzkaZapasowProg');
  eq(p.krokProcentRozwoj, 10, 'fallback: krokProcentRozwoj');
  eq(p.krokProcentPracaNauka, 10, 'fallback: krokProcentPracaNauka');
  eq(p.minOdstepTur, 3, 'fallback: minOdstepTur');
}

// 19. Wiersz z niepoprawna (nie-liczbowa) wartoscia -> fallback dla tego pola
{
  const p = loadAiSliderParams(
    { globalne: { ai_suwaki_min_odstep_tur: { normal: 'zle-dane' } } },
    'normal',
  );
  eq(p.minOdstepTur, 3, 'niepoprawny wiersz -> fallback minOdstepTur=3');
}

console.log(`\nai-slider-test: ${passed} passed, ${failed} failed`);

try { fs.unlinkSync(ENTRY_FILE); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_e) { /* noop */ }

process.exit(failed > 0 ? 1 : 0);
