'use strict';
/**
 * node tools/era-change-toast-defer-test.cjs
 * P-EPOKA-TOAST-EOT-POLYKANY — bramka STRUKTURALNA (regex) na `gra/src/main.ts`: main.ts nie jest
 * bundlowany osobno w tym repo (za duży/za dużo zależności do izolowanego testu, patrz
 * `era-cud-main-ts-integracja-test.cjs`), więc pilnujemy TEKSTU integracji zamiast zachowania
 * runtime.
 *
 * Zgłoszenie (Maciej): brak widocznego komunikatu przy przejściu gry do nowej epoki. Diagnoza:
 * `notifyPlayerEraChangeIfAdvanced()` wołała `showHintMessage()` bezwarunkowo — podczas
 * `endTurnInProgress` (najczęstsza ścieżka: auto-badanie na koniec tury, main.ts ~25340)
 * `showHintMessage` deferowała toast do generycznej kolejki `deferredEotHints`, która po flushu
 * zamienia go w bierny wpis „Koniec tury” w panelu (deferredHintsToSidePanelEvents) — ZERO
 * widocznego toastu. Prosty bypass kolejki W MIEJSCU WYWOŁANIA nie wystarczał: overlay przejścia
 * tury (turnTransitionOverlay, z-index 100400) rysuje się NAD toastem (maks. z-index 9950) w tym
 * samym dolnym obszarze ekranu, a 5,5-sekundowy timer toastu zwykle wygasa, zanim overlay się
 * skończy — toast i tak by „mignął” niewidocznie.
 *
 * Naprawa: `notifyPlayerEraChangeIfAdvanced` podczas `endTurnInProgress` zapamiętuje dane toastu
 * w `pendingEraChangeToastForNextTurn` (NIE w `deferredEotHints`) zamiast wołać `showHintMessage`
 * od razu; `flushPendingEraChangeToast()` wypuszcza go NAPRAWDĘ dopiero w `finally` bloku
 * `triggerPlayerEndTurn`, TUŻ PO `endTurnInProgress = false` — wtedy `showHintMessage` przechodzi
 * na żywo (overlay już się kończy). Trwały wpis w `warEventLog` (już wcześniej omijał kolejkę)
 * jest bez zmian. Ogólny mechanizm defer (`showHintMessage`/`shouldDeferEotEvents`/
 * `deferredEotHints`) dla WSZYSTKICH INNYCH komunikatów końca tury MUSI zostać nienaruszony —
 * to nie jest rozluźnienie defer w ogóle, tylko wąski wyjątek dla jednego typu komunikatu.
 */

const fs = require('fs');
const path = require('path');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(MAIN_TS, 'utf8');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('era-change-toast-defer-test\n');

// ---------------------------------------------------------------------------
// Blok 1 — stan: pendingEraChangeToastForNextTurn, osobny od deferredEotHints
// ---------------------------------------------------------------------------
const RE_STATE_DECL = /let pendingEraChangeToastForNextTurn: DeferredEotHint \| null = null;/;

// ---------------------------------------------------------------------------
// Blok 2 — notifyPlayerEraChangeIfAdvanced: podczas endTurnInProgress ZAPAMIĘTAJ zamiast
// wołać showHintMessage (co i tak wpadłoby do generycznej kolejki deferredEotHints).
// ---------------------------------------------------------------------------
const RE_BRANCH = /function notifyPlayerEraChangeIfAdvanced\(prevEra: number\): void \{[\s\S]{0,100}?const toastHtml = eraChangeNotifyToastHtml\(player\.era\);[\s\S]{0,600}?if \(endTurnInProgress\) \{\s*\n\s*pendingEraChangeToastForNextTurn = \{ msg: toastHtml, durationMs: ERA_CHANGE_NOTIFY\.toastDurationMs \};\s*\n\s*\} else \{\s*\n\s*showHintMessage\(toastHtml, ERA_CHANGE_NOTIFY\.toastDurationMs\);\s*\n\s*\}/;

// Trwały wpis warEventLog zostaje NIETKNIĘTY (bezwarunkowy, poza if/else) — to on już wcześniej
// omijał kolejkę (R-WYDARZENIA-FILTR-KATEGORII); ta naprawa dotyczy WYŁĄCZNIE toastu.
const RE_JOURNAL_UNCHANGED = /\} else \{\s*\n\s*showHintMessage\(toastHtml, ERA_CHANGE_NOTIFY\.toastDurationMs\);\s*\n\s*\}\s*\n\s*const evId = 'era-' \+ turn \+ '-' \+ player\.era;\s*\n\s*if \(!warEventLog\.some\(e => e\.id === evId\)\) \{/;

// ---------------------------------------------------------------------------
// Blok 3 — flushPendingEraChangeToast: konsumuje + zeruje stan, woła showHintMessage NAPRAWDĘ.
// ---------------------------------------------------------------------------
const RE_FLUSH_FN = /function flushPendingEraChangeToast\(\): void \{\s*\n\s*if \(!pendingEraChangeToastForNextTurn\) return;\s*\n\s*const \{ msg, durationMs \} = pendingEraChangeToastForNextTurn;\s*\n\s*pendingEraChangeToastForNextTurn = null;\s*\n\s*showHintMessage\(msg, durationMs\);\s*\n\s*\}/;

// ---------------------------------------------------------------------------
// Blok 4 — wywołanie flush MUSI nastąpić PO `endTurnInProgress = false;` w finally
// triggerPlayerEndTurn (inaczej showHintMessage znów by go zdeferowała).
//
// N1 (Evaluator, werdykt 6936d4d3, 2026-08-16): stara wersja tego regexa nie miała ŻADNEJ
// kotwicy na `triggerPlayerEndTurn`/`finally` — `endTurnInProgress = false;` występuje w
// main.ts CZTEROKROTNIE (resetEndTurnBlockers ~7034, healStaleEndTurnBlockers ~24381/24391,
// finally triggerPlayerEndTurn ~28354), więc dopasowanie mogło się „przykleić" do KTÓREGOKOLWIEK
// z nich. Eksperymentalnie potwierdzone: przeniesienie flushPendingEraChangeToast() CAŁKOWICIE
// z finally triggerPlayerEndTurn do healStaleEndTurnBlockers (ścieżka leczenia zacięć, w
// normalnej rozgrywce się nie wykonuje) DALEJ dawało 6/6 PASS. Nowa kotwica: literalna sekwencja
// `endTurnTransition();` NATYCHMIAST przed `endTurnInProgress = false;` — zweryfikowane
// (node -e), że ten dokładny ciąg znaków występuje w main.ts DOKŁADNIE RAZ, wyłącznie w bloku
// `finally` triggerPlayerEndTurn (endTurnTransition() poprzedza tam endTurnInProgress = false;
// w tej kolejności; w pozostałych trzech miejscach endTurnTransition() albo w ogóle nie
// występuje w sąsiedztwie, albo występuje PO endTurnInProgress = false, nigdy bezpośrednio przed).
// / EN: the old version of this regex had NO anchor at all on `triggerPlayerEndTurn`/`finally` —
// `endTurnInProgress = false;` appears FOUR times in main.ts, so the match could latch onto ANY
// of them. Experimentally confirmed: moving flushPendingEraChangeToast() ENTIRELY out of
// triggerPlayerEndTurn's finally into healStaleEndTurnBlockers (a stuck-transition healing path
// that never runs in normal play) still gave 6/6 PASS. New anchor: the literal sequence
// `endTurnTransition();` IMMEDIATELY before `endTurnInProgress = false;` — verified (node -e)
// to occur in main.ts EXACTLY ONCE, only inside triggerPlayerEndTurn's `finally` block.
// ---------------------------------------------------------------------------
const RE_FLUSH_WIRED_AFTER_FALSE = /endTurnTransition\(\);\s*\n\s*endTurnInProgress = false;[\s\S]{0,2200}?flushPendingEraChangeToast\(\);/;

// ---------------------------------------------------------------------------
// Blok 5 — REGRESJA: ogólny mechanizm defer (showHintMessage/shouldDeferEotEvents/
// deferredEotHints) dla WSZYSTKICH INNYCH komunikatów końca tury MUSI zostać nienaruszony.
// ---------------------------------------------------------------------------
const RE_GENERIC_DEFER_INTACT = /function showHintMessage\(msg: string, durationMs: number = 3000\): void \{\s*\n\s*if \(shouldDeferEotEvents\(endTurnInProgress\)\) \{\s*\n\s*deferredEotHints\.push\(\{ msg, durationMs \}\);\s*\n\s*return;\s*\n\s*\}/;

// ---------------------------------------------------------------------------
// Blok 6 — N2 (Evaluator, werdykt 6936d4d3, 2026-08-16): resetEndTurnBlockers() (wołane z
// prepareSessionForLoad/doStartGame) MUSI zerować pendingEraChangeToastForNextTurn, tak samo jak
// F4 (2026-08-14) domknął tam deferredAutoRequests. Bez tego: awans epoki w trakcie EOT ustawia
// pending → gracz wczytuje inną grę w oknie fazy AI → resetEndTurnBlockers zeruje
// endTurnInProgress, ale NIE pending → oryginalna async sekwencja i tak dobiega do finally i
// wypuszcza toast "Nowa epoka" w świeżo wczytanej grze.
// ---------------------------------------------------------------------------
const RE_RESET_CLEARS_PENDING_TOAST = /function resetEndTurnBlockers\(reason: string\): void \{[\s\S]{0,1500}?aiCmdResume = null;[\s\S]{0,700}?pendingEraChangeToastForNextTurn = null;[\s\S]{0,80}?endTurnTransition\(\);/;

assert(RE_STATE_DECL.test(src), 'Blok 1: stan pendingEraChangeToastForNextTurn zadeklarowany (osobno od deferredEotHints)');
assert(RE_BRANCH.test(src), 'Blok 2: notifyPlayerEraChangeIfAdvanced podczas endTurnInProgress zapamiętuje toast zamiast wołać showHintMessage (unika generycznej kolejki)');
assert(RE_JOURNAL_UNCHANGED.test(src), 'Blok 2: trwały wpis warEventLog nietknięty — nadal bezwarunkowy, poza if/else toastu');
assert(RE_FLUSH_FN.test(src), 'Blok 3: flushPendingEraChangeToast konsumuje + zeruje stan, woła showHintMessage naprawdę');
assert(RE_FLUSH_WIRED_AFTER_FALSE.test(src), 'Blok 4: flushPendingEraChangeToast() wołane PO endTurnInProgress = false w finally triggerPlayerEndTurn (kotwica: endTurnTransition(); NATYCHMIAST przed endTurnInProgress = false)');
assert(RE_GENERIC_DEFER_INTACT.test(src), 'Blok 5: ogólny mechanizm defer (showHintMessage/shouldDeferEotEvents/deferredEotHints) dla innych komunikatów EOT nienaruszony');
assert(RE_RESET_CLEARS_PENDING_TOAST.test(src), 'Blok 6 (N2): resetEndTurnBlockers() zeruje pendingEraChangeToastForNextTurn (ta sama klasa wycieku co F4 dla deferredAutoRequests)');

console.log('\n' + passed + ' passed, ' + failed + ' failed');

// ---------------------------------------------------------------------------
// Weryfikacja mutacyjna (samo-test bramki) — każda mutacja na TEKŚCIE main.ts musi
// zaczerwienić odpowiednią asercję.
// ---------------------------------------------------------------------------
function countPass(text) {
  const checks = [
    RE_STATE_DECL, RE_BRANCH, RE_JOURNAL_UNCHANGED, RE_FLUSH_FN,
    RE_FLUSH_WIRED_AFTER_FALSE, RE_GENERIC_DEFER_INTACT, RE_RESET_CLEARS_PENDING_TOAST,
  ];
  return checks.filter(re => re.test(text)).length;
}

const baselinePassCount = countPass(src);
let mutFailed = 0;
function assertMutationCaught(name, mutated) {
  const p = countPass(mutated);
  if (p < baselinePassCount) {
    console.log('MUT-PASS (złapana):', name, `(${p}/${baselinePassCount})`);
  } else {
    mutFailed++;
    console.error('MUT-FAIL (NIE złapana):', name);
  }
}

console.log('\n-- weryfikacja mutacyjna --\n');

// M1: cofnięcie do STAREGO błędu — bezwarunkowe showHintMessage (toast znów ginie w EOT).
assertMutationCaught('M1: notifyPlayerEraChangeIfAdvanced woła showHintMessage bezwarunkowo (reintrodukcja P-EPOKA-TOAST-EOT-POLYKANY)',
  src.replace(
    /if \(endTurnInProgress\) \{\s*\n\s*pendingEraChangeToastForNextTurn = \{ msg: toastHtml, durationMs: ERA_CHANGE_NOTIFY\.toastDurationMs \};\s*\n\s*\} else \{\s*\n\s*showHintMessage\(toastHtml, ERA_CHANGE_NOTIFY\.toastDurationMs\);\s*\n\s*\}/,
    'showHintMessage(toastHtml, ERA_CHANGE_NOTIFY.toastDurationMs);',
  ));

// M2: usunięcie wywołania flushPendingEraChangeToast() z finally (toast nigdy nie wystrzeli).
assertMutationCaught('M2: usunięcie flushPendingEraChangeToast() z finally triggerPlayerEndTurn',
  src.replace(
    "          flushPendingEraChangeToast();\n",
    '',
  ));

// M3: przeniesienie flush PRZED endTurnInProgress = false (znów wpadłby w defer).
assertMutationCaught('M3: flushPendingEraChangeToast() wołane PRZED endTurnInProgress = false (znów trafiłby w defer)',
  src.replace(
    'endTurnTransition();\n          endTurnInProgress = false;',
    'endTurnTransition();\n          flushPendingEraChangeToast();\n          endTurnInProgress = false;',
  ).replace(
    /\n          \/\/ P-EPOKA-TOAST-EOT-POLYKANY: toast awansu epoki odłożony z fazy EOT — wypuść go\n          \/\/ NAPRAWDĘ dopiero TERAZ, endTurnInProgress jest już false \(patrz komentarz przy\n          \/\/ flushPendingEraChangeToast\)\.\n          flushPendingEraChangeToast\(\);/,
    '',
  ));

// M4: flush nie zeruje stanu (ryzyko podwójnego odpalenia toastu w kolejnych turach).
assertMutationCaught('M4: flushPendingEraChangeToast nie zeruje pendingEraChangeToastForNextTurn (ryzyko double-fire)',
  src.replace(
    'const { msg, durationMs } = pendingEraChangeToastForNextTurn;\n      pendingEraChangeToastForNextTurn = null;\n      showHintMessage(msg, durationMs);',
    'const { msg, durationMs } = pendingEraChangeToastForNextTurn;\n      showHintMessage(msg, durationMs);',
  ));

// M5: osłabienie ogólnego mechanizmu defer (rozluźnienie DLA WSZYSTKICH komunikatów EOT —
// dokładnie to, przed czym ostrzega zlecenie: "nie chodzi o rozluźnienie defer dla WSZYSTKICH").
assertMutationCaught('M5: showHintMessage przestaje w ogóle sprawdzać shouldDeferEotEvents (rozluźnienie defer dla WSZYSTKICH komunikatów)',
  src.replace(
    "function showHintMessage(msg: string, durationMs: number = 3000): void {\n      if (shouldDeferEotEvents(endTurnInProgress)) {\n        deferredEotHints.push({ msg, durationMs });\n        return;\n      }",
    'function showHintMessage(msg: string, durationMs: number = 3000): void {',
  ));

// M6: usunięcie deklaracji stanu (kompilacja padnie, ale tekstowo też musi zaczerwienić bramkę).
assertMutationCaught('M6: usunięcie deklaracji pendingEraChangeToastForNextTurn',
  src.replace(
    'let pendingEraChangeToastForNextTurn: DeferredEotHint | null = null;\n',
    '',
  ));

// M7 (N1, Evaluator werdykt 6936d4d3): DOKŁADNY scenariusz eksperymentu Evaluatora —
// flushPendingEraChangeToast() przeniesione CAŁKOWICIE z finally triggerPlayerEndTurn do
// healStaleEndTurnBlockers (ścieżka leczenia zacięć, w normalnej rozgrywce się nie wykonuje).
// Ze STARYM regexem (bez kotwicy na finally triggerPlayerEndTurn) ta mutacja NIE była łapana
// (bramka dalej pokazywała 6/6 PASS) — to jest dowód, że nowy, zaostrzony regex Blok 4 naprawia
// dziurę zgłoszoną przez Evaluatora.
assertMutationCaught('M7: flushPendingEraChangeToast() przeniesione z finally triggerPlayerEndTurn do healStaleEndTurnBlockers (scenariusz Evaluatora)',
  src.replace(
    "          flushDeferredAutoPreBattle();\n          // P-EPOKA-TOAST-EOT-POLYKANY: toast awansu epoki odłożony z fazy EOT — wypuść go\n          // NAPRAWDĘ dopiero TERAZ, endTurnInProgress jest już false (patrz komentarz przy\n          // flushPendingEraChangeToast).\n          flushPendingEraChangeToast();\n",
    "          flushDeferredAutoPreBattle();\n",
  ).replace(
    "      if (endTurnInProgress && !isTurnTransitionActive()) {\n        console.warn('[EndTurn] Clearing stale endTurnInProgress (brak overlay)');\n        endTurnInProgress = false;\n        endTurnStartedAt = 0;\n      }",
    "      if (endTurnInProgress && !isTurnTransitionActive()) {\n        console.warn('[EndTurn] Clearing stale endTurnInProgress (brak overlay)');\n        endTurnInProgress = false;\n        endTurnStartedAt = 0;\n        flushPendingEraChangeToast();\n      }",
  ));

// M8 (N2, Evaluator werdykt 6936d4d3): resetEndTurnBlockers() PRZESTAJE zerować
// pendingEraChangeToastForNextTurn (cofnięcie naprawy N2 — ta sama klasa wycieku, którą F4
// domknął 2026-08-14 dla deferredAutoRequests, w TEJ SAMEJ funkcji).
assertMutationCaught('M8: resetEndTurnBlockers nie zeruje pendingEraChangeToastForNextTurn (regresja N2)',
  src.replace(
    '      pendingEraChangeToastForNextTurn = null;\n      endTurnTransition();\n      if (isPreBattleOpen()) hidePreBattle();',
    '      endTurnTransition();\n      if (isPreBattleOpen()) hidePreBattle();',
  ));

console.log('\n' + (8 - mutFailed) + '/8 mutacji złapanych, ' + mutFailed + ' NIEZŁAPANYCH');

// Sondy kruchości (NIESZKODLIWE zmiany — bramka MUSI zostać zielona)
console.log('\n-- sondy kruchości (muszą zostać PASS) --\n');
let probeFailed = 0;
function assertProbeSafe(name, mutated) {
  const p = countPass(mutated);
  if (p === baselinePassCount) {
    console.log('PROBE-OK:', name);
  } else {
    probeFailed++;
    console.error('PROBE-FAIL (kotwica za krucha):', name, `(${p}/${baselinePassCount})`);
  }
}

assertProbeSafe('P1: dodatkowy komentarz przed if (endTurnInProgress) w notifyPlayerEraChangeIfAdvanced',
  src.replace(
    'if (endTurnInProgress) {\n        pendingEraChangeToastForNextTurn',
    '// nowy komentarz bez znaczenia\n      if (endTurnInProgress) {\n        pendingEraChangeToastForNextTurn',
  ));
assertProbeSafe('P2: niepowiązany kod dodany między blokami (nowa funkcja no-op)',
  src.replace(
    'function maybeHintArmyFoodOnFirstPlayerUnit(ownerId: number): void {',
    'function unrelatedNoopHelperEraToastXYZ(): void { /* no-op */ }\n    function maybeHintArmyFoodOnFirstPlayerUnit(ownerId: number): void {',
  ));
assertProbeSafe('P3: dodatkowy whitespace wokół flushPendingEraChangeToast() w finally',
  src.replace(
    'flushDeferredAutoPreBattle();\n          // P-EPOKA-TOAST-EOT-POLYKANY',
    'flushDeferredAutoPreBattle();\n\n          // P-EPOKA-TOAST-EOT-POLYKANY',
  ));
assertProbeSafe('P4: dodatkowy komentarz wewnątrz resetEndTurnBlockers, obok pendingEraChangeToastForNextTurn = null (N2)',
  src.replace(
    'pendingEraChangeToastForNextTurn = null;\n      endTurnTransition();',
    '// nowy komentarz bez znaczenia\n      pendingEraChangeToastForNextTurn = null;\n      endTurnTransition();',
  ));

console.log('\n' + (4 - probeFailed) + '/4 sond kruchości bezpiecznych, ' + probeFailed + ' fałszywie czerwonych');

const allOk = failed === 0 && mutFailed === 0 && probeFailed === 0;
console.log('\n=== WYNIK: ' + (allOk ? 'OK' : 'FAIL') + ' ===');
process.exit(allOk ? 0 : 1);
