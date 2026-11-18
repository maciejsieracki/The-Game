'use strict';
/**
 * ai-ai-alliance-measure-hook-test.cjs -- R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1: test haka odczytowego sojuszy AI↔AI.
 *
 * Test STATYCZNY (bez przeglądarki, bez bundla): sprawdza w gra/src/main.ts i gra/src/game/ai-ai-alliance-tick.ts, że:
 *  H1 hak `aiAiAllianceTickForTest.state` istnieje i wola aiAiAllianceMeasureState();
 *  H2 bramka tickAiAiAllianceRequests bez zmian (flaga = isAiAiAllianceTickEnabled);
 *  H3 wymuszenie wymaga ?civTest=1 (isCivTestEnabled) i flagi strony __civAiAllianceMeasureForce;
 *  H3b wymuszenie pomiaru ustawia nadpisanie przełącznika (setAiAiAllianceTickEnabledForTest) przy instalacji hooków civTest;
 *  H4 metrics().diag zawiera `sojusze: aiAiAllianceMeasureState()` (pole trafia do każdego wiersza jsonl);
 *  H5 planer liczy próby i odmowy (proby++ przed evaluate, odmowy++ przy accept=false) i zwraca je w wyniku;
 *  H6/H7 liczniki skumulowane w main.ts (aiAiAllianceProbyLacznie / OdmowyLacznie) są zasilane z planu.
 *  H8a/H8b liczenie sojuszy per cywilizacja (+1 na każdą stronę, tylko między owners);
 *  H9 liczenie wojen czyta diplomacyRelations.get (bez getDiploRelation, który tworzy relację).
 *  H10a-c histogram powodów odmów toru (planer -> skumulowany licznik -> diag.sojusze.powodyOdmow).
 * UWAGA: to test STATYCZNY (dopasowanie tekstu źródła). NIE sprawdza zachowania w grze; poprawność liczb
 * potwierdza wyłącznie bieg dymny i analizator (NIE ZMIERZONO w teście behawioralnym: brak bundla w tym teście).
 * Mutanty (kopia źródła w pamięci, NIE zapis na dysk): każdy usuwa/zamienia jedną z powyższych linii i MUSI czerwienić test.
 *
 * Wymaga tylko Node (bez esbuild/chromium). Exit 0 = wszystko zielone i mutanty wykryte.
 *   node tools/ai-ai-alliance-measure-hook-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
const TICK = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'game', 'ai-ai-alliance-tick.ts'), 'utf8');

/** Reguły: [id, plik ('main'|'tick'), fragment, czego szukamy]. */
const CHECKS = [
  ['H1', 'main', 'state: (): ReturnType<typeof aiAiAllianceMeasureState> => aiAiAllianceMeasureState()'],
  ['H2', 'main', 'if (!isAiAiAllianceTickEnabled()) return;'],
  ['H3', 'main', 'return isCivTestEnabled(window.location.search) && (window as any).__civAiAllianceMeasureForce === true;'],
  ['H3b', 'main', 'if ((window as any).__civAiAllianceMeasureForce === true) setAiAiAllianceTickEnabledForTest(true);'],
  ['H4', 'main', 'sojusze: aiAiAllianceMeasureState(),'],
  ['H5a', 'tick', '    proby++;\n    const result = evaluate({'],
  ['H5b', 'tick', '    if (!result.accept) {\n      odmowy++;'],
  ['H5c', 'tick', 'return { accepted, treasuryPo: treasury, alliancesCountPo: counts, proby, odmowy, powodyOdmow };'],
  ['H10a', 'tick', "      powodyOdmow.set(klucz, (powodyOdmow.get(klucz) ?? 0) + 1);"],
  ['H10b', 'main', 'for (const [klucz, n] of plan.powodyOdmow) aiAiAllianceOdmowyPowody.set(klucz, (aiAiAllianceOdmowyPowody.get(klucz) ?? 0) + n);'],
  ['H10c', 'main', 'powodyOdmow: Array.from(aiAiAllianceOdmowyPowody.entries())'],
  ['H6', 'main', 'aiAiAllianceProbyLacznie += plan.proby;'],
  ['H7', 'main', 'aiAiAllianceOdmowyLacznie += plan.odmowy;'],
  ['H8a', 'main', 'if (ownerSet.has(a) && ownerSet.has(b)) {\n          liczba.set(a, (liczba.get(a) ?? 0) + 1);'],
  ['H8b', 'main', '          liczba.set(b, (liczba.get(b) ?? 0) + 1);\n        }'],
  ['H9', 'main', 'if (diplomacyRelations.get(`${owners[i]!}_${owners[j]!}`)?.status === \'wojna\') wojny++;'],
  // H11-H15 (runda obrony 2): pola zwracanego obiektu stanu muszą czytać realne liczniki/wyliczenia (nie stałe).
  ['H11', 'main', '        proby: aiAiAllianceProbyLacznie,'],
  ['H12', 'main', '        odmowy: aiAiAllianceOdmowyLacznie,'],
  ['H13', 'main', '        wojnyAiAi: wojny,'],
  ['H14', 'main', '        naCywilizacje: owners.map(oid => ({ owner: oid, n: liczba.get(oid) ?? 0 })),'],
  ['H15', 'main', '        sojuszeAiAi,\n        powodyOdmow:'],
];

/** Mutanty: [id, plik, fragment do usunięcia/zamiany na pusty lub inny]. */
const MUTANTS = [
  ['M1 wymuszenie nie wlacza toru', 'main', 'if ((window as any).__civAiAllianceMeasureForce === true) setAiAiAllianceTickEnabledForTest(true);', ''],
  ['M2 brak pola sojusze w diag', 'main', 'sojusze: aiAiAllianceMeasureState(),', ''],
  ['M3 brak licznika odmów', 'tick', '      odmowy++;\n', ''],
  ['M4 brak licznika prób', 'tick', '    proby++;\n', ''],
  ['M5 liczenie per cywilizacja: +5 zamiast +1', 'main', 'liczba.set(a, (liczba.get(a) ?? 0) + 1);', 'liczba.set(a, (liczba.get(a) ?? 0) + 5);'],
  ['M5b brak liczenia per cywilizacja (strona b)', 'main', '          liczba.set(b, (liczba.get(b) ?? 0) + 1);', ''],
  ['M5c wojny przez getDiploRelation (mutacja)', 'main', 'if (diplomacyRelations.get(`${owners[i]!}_${owners[j]!}`)?.status === \'wojna\') wojny++;', 'if (getDiploRelation(owners[i]!, owners[j]!).status === \'wojna\') wojny++;'],
  ['M6 wymuszenie bez ?civTest', 'main', 'return isCivTestEnabled(window.location.search) && (window as any)', 'return (window as any)'],
  ['M7 bez zasilania licznika skumulowanego', 'main', 'aiAiAllianceOdmowyLacznie += plan.odmowy;', ''],
  ['M8 bez histogramu powodow w planerze', 'tick', "      powodyOdmow.set(klucz, (powodyOdmow.get(klucz) ?? 0) + 1);", ''],
  ['M9 bez zasilania histogramu skumulowanego', 'main', 'for (const [klucz, n] of plan.powodyOdmow) aiAiAllianceOdmowyPowody.set(klucz, (aiAiAllianceOdmowyPowody.get(klucz) ?? 0) + n);', ''],
  ['M10 proby w stanie = 0 (zerowanie licznika w odczycie)', 'main', '        proby: aiAiAllianceProbyLacznie,', '        proby: 0,'],
  ['M11 odmowy w stanie = 0', 'main', '        odmowy: aiAiAllianceOdmowyLacznie,', '        odmowy: 0,'],
  ['M12 wojnyAiAi w stanie = 0', 'main', '        wojnyAiAi: wojny,', '        wojnyAiAi: 0,'],
  ['M13 naCywilizacje zawsze zero', 'main', '        naCywilizacje: owners.map(oid => ({ owner: oid, n: liczba.get(oid) ?? 0 })),', '        naCywilizacje: owners.map(oid => ({ owner: oid, n: 0 })),'],
  ['M14 sojuszeAiAi w stanie = 0', 'main', '        sojuszeAiAi,\n        powodyOdmow:', '        sojuszeAiAi: 0,\n        powodyOdmow:'],
];

function src(kind, mainText, tickText) { return kind === 'main' ? mainText : tickText; }

/** Zwraca listę nazw nieprzechodzących reguł dla danych źródeł. */
function evaluate(mainText, tickText) {
  const failed = [];
  for (const [id, kind, frag] of CHECKS) {
    if (!src(kind, mainText, tickText).includes(frag)) failed.push(id);
  }
  return failed;
}

let fail = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fail++; };

// 1) Stan rzeczywisty: wszystkie reguły zielone.
const real = evaluate(MAIN, TICK);
ok(real.length === 0, `hak odczytowy: reguły H1..H10c zielone (nieprzechodzące: ${real.join(',') || 'brak'})`);

// 2) Domyślna flaga w danych pozostaje false (pomiar nie włącza toru w kodzie).
const params = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'ai-ai-treaty-params.json'), 'utf8'));
ok(params.torSojuszyAktywny === false, 'torSojuszyAktywny w danych = false (flaga nie włączona w kodzie)');

// 3) Mutanty: każdy musi czerwienić test (a sam mutant musi zmienić źródło).
for (const [name, kind, frag, repl] of MUTANTS) {
  const text = kind === 'main' ? MAIN : TICK;
  if (!text.includes(frag)) { ok(false, `mutant ${name}: kotwica nieobecna w źródle`); continue; }
  const mutated = text.replace(frag, repl);
  const m = kind === 'main'
    ? evaluate(mutated, TICK)
    : evaluate(MAIN, mutated);
  ok(m.length > 0, `mutant ${name} wykryty (nieprzechodzące: ${m.join(',') || 'NIC - BŁĄD TESTU'})`);
}

console.log(fail === 0 ? '\nWYNIK: ZIELONY' : `\nWYNIK: CZERWONY (${fail})`);
process.exit(fail === 0 ? 0 : 1);
