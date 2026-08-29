'use strict';
/**
 * P-KONIEC-TURY-DYPLOMACJA-MYLACY-NAGLOWEK — wpisy end-of-turn, których treść dotyczy
 * dyplomacji (np. „Dyplomacja: propozycja wygasła — wojna”, showHintMessage z
 * `resolveNegotiationEntryAt` / `pruneInvalidNegotiations` w main.ts), muszą dostać nagłówek
 * „Dyplomacja" + kind:'diplo', NIE mylący uniwersalny „Koniec tury". Regresja wzorowana na
 * tools/eot-event-defer-test.cjs (ta sama technika: esbuild bundluje realny moduł
 * src/game/eot-event-defer.ts, test woła prawdziwą funkcję — nie regex/stripLineComments, bo
 * pełne wykonanie jest tu praktyczne). Test sprawdza samo FORMATOWANIE nagłówka na podstawie
 * prefiksu wiadomości — nie zależy od tego, KTÓRA funkcja produkcyjna go dziś emituje.
 * KOREKTA (P-DYPLO-KARTA-DUPLIKAT-KOMUNIKAT, 2026-08-16): przypadek `diploHandelMsg` niżej
 * (wzorzec „Propozycja handlu surowcem") NIE jest już produkowany przez
 * `enqueueDiplomacyPendingFromCmd` — ta ścieżka toastu została usunięta jako zbędny duplikat
 * karty stołu negocjacji (trwała karta w `negotiationTable` wystarcza). Stała zostaje w teście
 * jako czysty przykład FORMATU (dowolny string zaczynający się od „Dyplomacja:" musi dostać
 * nagłówek „Dyplomacja"), nie jako dowód że main.ts wciąż go emituje.
 * EN: EOT toast entries whose content is about diplomacy must get the "Dyplomacja" header
 * + kind:'diplo', NOT the misleading generic "Koniec tury" — regression test. Tests header
 * FORMATTING from the message prefix only, independent of which production function emits it.
 * CORRECTED: the "Propozycja handlu surowcem" case is no longer emitted by
 * `enqueueDiplomacyPendingFromCmd` (removed as a redundant duplicate of the negotiation-table
 * card) — kept here purely as a format example, not proof of a live call site. */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.eot-diplo-header-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eot-diplo-header-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  deferredHintsToSidePanelEvents,
} from '../src/game/eot-event-defer.ts';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const B = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('eot-diplomacy-header-test');

// Przykład FORMATU nagłówka „Dyplomacja: <cyw.> — <tytuł>" (patrz korekta w nagłówku pliku —
// dziś już nie emitowany przez enqueueDiplomacyPendingFromCmd, ta stała testuje tylko format).
const diploHandelMsg = 'Dyplomacja: Korynt · Grecy · miasto-państwo — Propozycja handlu surowcem';
// showHintMessage('Dyplomacja: propozycja wygasła — ' + …) z resolveNegotiationEntryAt / pruneInvalidNegotiations.
const diploWygaslaMsg = 'Dyplomacja: propozycja wygasła — wojna';
// showHintMessage(`${labelA} handluje z ${labelB}`, …) z applyAiAiHandelSurowiecCmd — jedyny
// dotychczasowy „nie-nasz" typ hintu, już naprawiony wcześniej (R-WYDARZENIA-FILTR-KATEGORII).
const aiAiTradeMsg = 'Ateny handluje z Sparta';
// Kontrolny wpis NIE-dyplomatyczny — musi zostać przy domyślnej gałęzi fallbacku / kind:'info'.
// P-WYDARZENIA-NAGLOWEK-KONIEC-TURY-ZBEDNY-Q1: ta gałąź daje dziś PUSTY `title` (`''`), a nie
// dawny generyczny placeholder „Koniec tury" — asercje niżej zaktualizowane, intencja
// (dyplomacja ≠ fallback) bez zmian.
const nonDiploMsg = 'Ukończono: <b>Piramida</b> @ 3,4';
// N2 (Evaluator PASS-WITH-NOTES 7b02eb2d): prefiks „Dyplomacja:” NIE na początku zdania —
// musi wpaść w domyślną gałąź fallbacku (dziś: pusty `title`, dawniej „Koniec tury”). Łapie
// mutację startsWith→includes (bez tego przypadku ta mutacja przechodziła 15/15, bo żaden
// istniejący wpis nie miał prefiksu w środku).
// EN: "Dyplomacja:" prefix NOT at the start of the message — must fall into the default branch
// (today: empty `title`, formerly "Koniec tury"). Catches a startsWith→includes mutation
// (previously undetected: 15/15 passed).
const midSentenceDiploMsg = 'Coś tam Dyplomacja: coś tam';

const evs = B.deferredHintsToSidePanelEvents(
  [
    { msg: diploHandelMsg, durationMs: 4500 },
    { msg: diploWygaslaMsg, durationMs: 4000 },
    { msg: aiAiTradeMsg, durationMs: 4000 },
    { msg: nonDiploMsg, durationMs: 4500 },
    { msg: midSentenceDiploMsg, durationMs: 4500 },
  ],
  7,
);

ok(evs.length === 5, 'zwraca 5 wpisów (1:1 z hints)');

const [evHandel, evWygasla, evAiAi, evNonDiplo, evMidSentence] = evs;

// Zgłoszony przypadek: nagłówek MA BYĆ „Dyplomacja", NIE „Koniec tury".
ok(evHandel.title === 'Dyplomacja', `handel surowcem → title 'Dyplomacja' (got '${evHandel.title}')`);
ok(evHandel.title !== 'Koniec tury', 'handel surowcem → title NIE „Koniec tury" (regresja zgłoszenia)');
ok(evHandel.kind === 'diplo', `handel surowcem → kind 'diplo' (got '${evHandel.kind}')`);
ok(evHandel.origin === undefined, 'handel surowcem (gracz↔AI) → BEZ origin other-civs (dotyczy gracza wprost)');
ok(evHandel.subtitle === diploHandelMsg, 'handel surowcem → subtitle = pełna treść (bez zmian)');

ok(evWygasla.title === 'Dyplomacja', `propozycja wygasła → title 'Dyplomacja' (got '${evWygasla.title}')`);
ok(evWygasla.kind === 'diplo', `propozycja wygasła → kind 'diplo' (got '${evWygasla.kind}')`);

// Brak regresji: handel AI↔AI (już naprawiony wcześniej) zachowuje title + origin.
ok(evAiAi.title === 'Dyplomacja', `handel AI↔AI → title 'Dyplomacja' (got '${evAiAi.title}')`);
ok(evAiAi.kind === 'diplo', `handel AI↔AI → kind 'diplo' (got '${evAiAi.kind}')`);
ok(evAiAi.origin === 'other-civs', 'handel AI↔AI → origin other-civs (bez regresji filtra 🌍)');

// Brak regresji: wpisy NIE-dyplomatyczne wpadają w domyślną gałąź (pusty title) i kind 'info'.
ok(evNonDiplo.title === '', `nie-dyplomacja → title PUSTY '' (P-WYDARZENIA-NAGLOWEK-KONIEC-TURY-ZBEDNY-Q1; got '${evNonDiplo.title}')`);
ok(evNonDiplo.title !== 'Koniec tury', 'nie-dyplomacja → generyczny placeholder „Koniec tury" NIE wraca');
ok(evNonDiplo.kind === 'info', `nie-dyplomacja → kind 'info' bez zmian (got '${evNonDiplo.kind}')`);
ok(evNonDiplo.origin === undefined, 'nie-dyplomacja → bez origin');
ok(!evNonDiplo.subtitle.includes('<'), 'nie-dyplomacja → subtitle bez HTML (bez regresji istniejącego strippingu)');

// N2: prefiks „Dyplomacja:” w ŚRODKU zdania (nie na początku) → MUSI wpaść w domyślną
// gałąź fallbacku, czyli pusty `title` (startsWith, nie includes).
ok(evMidSentence.title === '', `„Dyplomacja:” w środku zdania → title PUSTY '' (got '${evMidSentence.title}')`);
ok(evMidSentence.kind === 'info', `„Dyplomacja:” w środku zdania → kind 'info' (got '${evMidSentence.kind}')`);
ok(evMidSentence.origin === undefined, '„Dyplomacja:” w środku zdania → bez origin');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
