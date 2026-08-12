'use strict';
/**
 * P-KONIEC-TURY-DYPLOMACJA-MYLACY-NAGLOWEK — wpisy end-of-turn, których treść dotyczy
 * dyplomacji (np. „Dyplomacja: Korynt · Grecy · miasto-państwo — Propozycja handlu
 * surowcem”, showHintMessage z enqueueDiplomacyPendingFromCmd / resolveNegotiationEntryAt
 * w main.ts), muszą dostać nagłówek „Dyplomacja" + kind:'diplo', NIE mylący uniwersalny
 * „Koniec tury". Regresja wzorowana na tools/eot-event-defer-test.cjs (ta sama technika:
 * esbuild bundluje realny moduł src/game/eot-event-defer.ts, test woła prawdziwą funkcję —
 * nie regex/stripLineComments, bo pełne wykonanie jest tu praktyczne).
 * EN: EOT toast entries whose content is about diplomacy must get the "Dyplomacja" header
 * + kind:'diplo', NOT the misleading generic "Koniec tury" — regression test.
 */
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

// Wpis dokładnie odtwarzający zgłoszony przypadek (P-KONIEC-TURY-DYPLOMACJA-MYLACY-NAGLOWEK):
// showHintMessage('Dyplomacja: ' + ownerDiploLabel(ownerId) + ' — ' + diploPendingTitle(cmd.type), …)
// z enqueueDiplomacyPendingFromCmd / resolveNegotiationEntryAt (main.ts), odłożony bo endTurnInProgress.
const diploHandelMsg = 'Dyplomacja: Korynt · Grecy · miasto-państwo — Propozycja handlu surowcem';
// showHintMessage('Dyplomacja: propozycja wygasła — ' + …) z resolveNegotiationEntryAt / pruneInvalidNegotiations.
const diploWygaslaMsg = 'Dyplomacja: propozycja wygasła — wojna';
// showHintMessage(`${labelA} handluje z ${labelB}`, …) z applyAiAiHandelSurowiecCmd — jedyny
// dotychczasowy „nie-nasz" typ hintu, już naprawiony wcześniej (R-WYDARZENIA-FILTR-KATEGORII).
const aiAiTradeMsg = 'Ateny handluje z Sparta';
// Kontrolny wpis NIE-dyplomatyczny — musi zostać przy dotychczasowym „Koniec tury" / kind:'info'.
const nonDiploMsg = 'Ukończono: <b>Piramida</b> @ 3,4';

const evs = B.deferredHintsToSidePanelEvents(
  [
    { msg: diploHandelMsg, durationMs: 4500 },
    { msg: diploWygaslaMsg, durationMs: 4000 },
    { msg: aiAiTradeMsg, durationMs: 4000 },
    { msg: nonDiploMsg, durationMs: 4500 },
  ],
  7,
);

ok(evs.length === 4, 'zwraca 4 wpisy (1:1 z hints)');

const [evHandel, evWygasla, evAiAi, evNonDiplo] = evs;

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

// Brak regresji: wpisy NIE-dyplomatyczne zachowują dotychczasowy nagłówek/kind.
ok(evNonDiplo.title === 'Koniec tury', `nie-dyplomacja → title 'Koniec tury' bez zmian (got '${evNonDiplo.title}')`);
ok(evNonDiplo.kind === 'info', `nie-dyplomacja → kind 'info' bez zmian (got '${evNonDiplo.kind}')`);
ok(evNonDiplo.origin === undefined, 'nie-dyplomacja → bez origin');
ok(!evNonDiplo.subtitle.includes('<'), 'nie-dyplomacja → subtitle bez HTML (bez regresji istniejącego strippingu)');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
