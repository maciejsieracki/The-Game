'use strict';
/**
 * dyplo-karta-duplikat-komunikat-test.cjs — P-DYPLO-KARTA-DUPLIKAT-KOMUNIKAT
 * (Maciej: „Niepotrzebnie czasem powtarza się dwukrotnie ten sam komunikat dyplomacji...
 * Wystarczy, że jeden wisi się od nowa całą turę.")
 *
 * Przyczyna (recon): `enqueueNegotiationFromAiCmd` (main.ts) dla KAŻDEJ propozycji AI robi
 * DWIE rzeczy: (1) `negotiationTable.push(entry)` — trwała karta „Dyplomacja: [Cyw.]" wisząca
 * całą turę, (2) wołało `showHintMessage(DIPLOMACY_MSG_PREFIX + ...)`, które podczas
 * `endTurnInProgress` (faza AI) trafia w `deferredEotHints` i po EOT wychodzi jako DRUGI,
 * generyczny wpis w `warEventLog` (`deferredHintsToSidePanelEvents`, prefiks `eot-hint-`) —
 * czysty duplikat treści karty ze stołu negocjacji. Naprawa: (2) usunięte, (1) bez zmian.
 *
 * `enqueueNegotiationFromAiCmd` jest głęboko zagnieżdżoną funkcją w main.ts (zamknięcie na
 * całym stanie gry — main.ts bootuje scenę przy imporcie, nie da się jej wyodrębnić do
 * samodzielnego bundla, ta sama sytuacja co granice-relacja-dyplomatyczna-test.cjs /
 * camera-zoom-block-test.cjs). Test więc łączy DWIE warstwy:
 *   (A) asercje NA ŹRÓDLE main.ts — funkcja nadal tworzy trwałą kartę i NIE woła już
 *       showHintMessage z prefiksem dyplomacji; oraz że WSZYSTKIE typy komend AI (nie tylko
 *       zaproponuj_pokoj) faktycznie przechodzą przez tę samą, naprawioną funkcję (parytet
 *       C-DYP-Q1=A — więc naprawa obejmuje automatycznie sojusz/handel/umowę handlową/handel
 *       surowcem/trybut, bez osobnych miejsc do łatania).
 *   (B) REALNE zachowanie kolejki EOT przez PRAWDZIWY moduł `src/game/eot-event-defer.ts`
 *       (bundlowany, nie kopiowany) — pokazuje, że pusta kolejka `deferredEotHints` (bo (2)
 *       już nie woła showHintMessage) daje ZERO wpisów w warEventLog, a dla kontrastu pokazuje
 *       dokładnie ten SAM duplikat, który powstawałby, gdyby (2) nadal tam było.
 *
 * Dyscyplina mutacyjna (ręczna, przy wdrażaniu tej naprawy): tymczasowe przywrócenie usuniętej
 * linii `showHintMessage(DIPLOMACY_MSG_PREFIX + ...)` w main.ts powoduje FAIL testu (A2) —
 * zweryfikowane przed przywróceniem naprawy.
 *
 * Uruchamianie z katalogu gra/: node tools/dyplo-karta-duplikat-komunikat-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

console.log('dyplo-karta-duplikat-komunikat-test (P-DYPLO-KARTA-DUPLIKAT-KOMUNIKAT)\n');

// ─────────────────────────────────────────────────────────────────────────────
// A. Asercje na źródle main.ts
// ─────────────────────────────────────────────────────────────────────────────
console.log('A. enqueueNegotiationFromAiCmd — źródło main.ts');

const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

const fnName = 'function enqueueNegotiationFromAiCmd(';
const start = mainSrc.indexOf(fnName);
ok(start > 0, 'main.ts: funkcja enqueueNegotiationFromAiCmd istnieje');
// Ciało wycięte do pierwszego zamknięcia na wcięciu funkcji (4 spacje) — ten sam wzorzec co
// granice-relacja-dyplomatyczna-test.cjs (main.ts nie da się zbundlować/wykonać samodzielnie).
const end = start > 0 ? mainSrc.indexOf('\n    }', start) : -1;
const body = start > 0 && end > start ? mainSrc.slice(start, end) : '';
ok(body.length > 0, 'main.ts: ciało funkcji wycięte (niepuste)');

// A1: trwała karta ZOSTAJE bez zmian — to jest jedyna reprezentacja tego zdarzenia po naprawie.
ok(/negotiationTable\.push\(entry\);/.test(body),
  'A1: negotiationTable.push(entry) obecne — trwała karta stołu negocjacji bez zmian');

// A2: zbędny toast USUNIĘTY — to jest rdzeń naprawy zgłoszenia Macieja.
ok(!/showHintMessage\(/.test(body),
  'A2: showHintMessage NIE jest już wołane w tej funkcji (usunięty duplikat)');
ok(!/DIPLOMACY_MSG_PREFIX/.test(body),
  'A2b: prefiks komunikatu dyplomacji też zniknął z ciała (nie tylko samo wywołanie ukryte gdzie indziej)');

// A3: negotiationTable.push nadal wykonuje się PRZED miejscem, gdzie kiedyś był toast (refreshD1bHud
// zostaje jako kotwica pozycji — potwierdza że nie usunęliśmy przypadkiem samej karty razem z toastem).
{
  const pushIdx = body.indexOf('negotiationTable.push(entry);');
  const hudIdx = body.indexOf('refreshD1bHud();');
  ok(pushIdx > 0 && hudIdx > pushIdx,
    'A3: kolejność zachowana — push karty, potem refreshD1bHud (nic pomiędzy nie zniknęło poza toastem)');
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Parytet — WSZYSTKIE typy komend AI trafiają przez tę SAMĄ (naprawioną) funkcję
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. enqueueDiplomacyPendingFromCmd — parytet tras (C-DYP-Q1=A)');

{
  const callerStart = mainSrc.indexOf('function enqueueDiplomacyPendingFromCmd(');
  ok(callerStart > 0, 'main.ts: funkcja enqueueDiplomacyPendingFromCmd istnieje');
  const callerEnd = callerStart > 0 ? mainSrc.indexOf('\n    }', callerStart) : -1;
  const callerBody = callerStart > 0 && callerEnd > callerStart
    ? mainSrc.slice(callerStart, callerEnd) : '';
  const callSites = (callerBody.match(/enqueueNegotiationFromAiCmd\(/g) || []).length;
  // Jedna gałąź dla 'zaproponuj_pokoj' (return od razu), jedna gałąź fallback dla reszty typów
  // (sojusz/handel/umowa handlowa/handel surowcem/trybut) — DWA wywołania, ŻADNEJ osobnej,
  // niezależnej ścieżki toastu dla innych typów komend.
  ok(callSites === 2,
    `B1: enqueueDiplomacyPendingFromCmd woła enqueueNegotiationFromAiCmd dokładnie 2× (znaleziono ${callSites}) — brak osobnej ścieżki dla innych typów`);
  ok(!/showHintMessage\(/.test(callerBody),
    'B2: enqueueDiplomacyPendingFromCmd sam nie woła showHintMessage (cała odpowiedzialność w naprawionej funkcji)');
}

// Martwa, NIEUŻYWANA funkcja z takim samym toastem (enqueueDiplomacyPending, BEZ "FromCmd") —
// jedyne inne miejsce w main.ts z tym samym wzorcem `showHintMessage(DIPLOMACY_MSG_PREFIX + ...)`.
// Świadomie NIE naprawiona (poza zakresem) — dopilnowane, że naprawdę jest nieosiągalna, żeby
// obecność tego wzorca gdzie indziej w pliku nie była cichym drugim źródłem duplikatu.
{
  const deadCallCount = (mainSrc.match(/\benqueueDiplomacyPending\(/g) || []).length;
  ok(deadCallCount === 1,
    `C: enqueueDiplomacyPending(...) (bez FromCmd) występuje tylko RAZ w main.ts — czyli tylko\n` +
    `     jako własna deklaracja, ZERO wywołań (martwy kod, nie uczestniczy w duplikacie, poza zakresem naprawy)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// D. Realne zachowanie kolejki EOT — przez prawdziwy, zbundlowany moduł eot-event-defer.ts
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Kolejka deferredEotHints → warEventLog (realny moduł)');

const ENTRY = path.join(__dirname, '.dyplo-dup-entry.ts');
const BUNDLE = path.join(__dirname, '.dyplo-dup-bundle.cjs');
fs.writeFileSync(ENTRY, `
export {
  shouldDeferEotEvents,
  deferredHintsToSidePanelEvents,
  mergeDeferredEotSideEvents,
  DIPLOMACY_MSG_PREFIX,
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

const M = require(BUNDLE);

// (b) PO naprawie: enqueueNegotiationFromAiCmd nie woła już showHintMessage, więc dla tego
// zdarzenia deferredEotHints NIGDY nie dostaje wpisu — symulujemy dokładnie ten stan: pusta
// kolejka wchodzi do końca tury AI (endTurnInProgress=true przez cały czas trwania fazy AI).
ok(M.shouldDeferEotEvents(true), 'D0: faza AI (endTurnInProgress=true) → kolejka EOT aktywna');
{
  const deferredEotHints = []; // nic tu NIE trafia dla propozycji AI po naprawie
  const turn = 7;
  const hintEvents = M.deferredHintsToSidePanelEvents(deferredEotHints, turn);
  ok(hintEvents.length === 0,
    'D1: PO naprawie — zero wpisów eot-hint- dla propozycji AI (brak drugiej, generycznej karty)');
  const warEventLog = [];
  M.mergeDeferredEotSideEvents(warEventLog, hintEvents);
  ok(warEventLog.length === 0, 'D1b: warEventLog pozostaje bez duplikatu po scaleniu');
}

// (a) Kontrast — dokładnie TAKI SAM wpis, jaki PRZED naprawą powstawałby z usuniętego
// showHintMessage(DIPLOMACY_MSG_PREFIX + ' ' + civ + ' — ' + tytuł, 4500), żeby pokazać że
// mechanizm istnieje i faktycznie tworzyłby duplikat, gdyby wywołanie wróciło.
{
  const wouldBeHint = {
    msg: M.DIPLOMACY_MSG_PREFIX + ' Grecy — Propozycja pokoju',
    durationMs: 4500,
  };
  const turn = 7;
  const hintEvents = M.deferredHintsToSidePanelEvents([wouldBeHint], turn);
  ok(hintEvents.length === 1 && hintEvents[0].kind === 'diplo' && hintEvents[0].title === 'Dyplomacja',
    'D2: kontrast — GDYBY toast wrócił, wyszedłby jako druga karta "Dyplomacja" w warEventLog (dowód, że A2 faktycznie coś naprawia)');
}

try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

// ─────────────────────────────────────────────────────────────────────────────
// E. Niezmiennik na CAŁYM pliku (Evaluator N1, 2026-08-16, werdykt ab994b8ed44af2121)
// ─────────────────────────────────────────────────────────────────────────────
// A2/A2b/B2 to punktowe sondy (dwie konkretne funkcje) — mutacja dowodowa Evaluatora (M5)
// pokazała, że da się w pełni przywrócić duplikat z TRZECIEGO miejsca w main.ts (np. pętla
// dyspozytora komend AI), a test i tak przejdzie 14/14. Ten blok zamienia dwie sondy w jeden
// niezmiennik na całym źródle main.ts: dokładna liczba wystąpień wzorca
// `showHintMessage(DIPLOMACY_MSG_PREFIX` w CAŁYM pliku. Dziś to 3, NIE 2 (Evaluator policzył
// tylko żywe wystąpienia w wariancie „propozycja wygasła" — pominął, że wzorzec występuje też
// wewnątrz martwej funkcji `enqueueDiplomacyPending`, sekcja C wyżej, jako tekst źródłowy,
// mimo że nigdy się nie wykonuje). Jeśli liczba kiedykolwiek wzrośnie — ktoś dodał nowy toast
// dyplomacji gdzieś w pliku i trzeba świadomie ocenić, czy to kolejny duplikat.
console.log('\nE. Niezmiennik całego pliku — liczba wystąpień wzorca toastu dyplomacji');
{
  const allOccurrences = (mainSrc.match(/showHintMessage\(DIPLOMACY_MSG_PREFIX/g) || []).length;
  ok(allOccurrences === 3,
    `E1: showHintMessage(DIPLOMACY_MSG_PREFIX występuje dokładnie 3× w całym main.ts (znaleziono ${allOccurrences}) — ` +
    `2 żywe w wariancie „propozycja wygasła" (linie ok. 13990, 14109) + 1 martwe wewnątrz ` +
    `enqueueDiplomacyPending (linia ok. 14749, sekcja C wyżej potwierdza 0 wywołań tej funkcji). ` +
    `Wzrost tej liczby ponad 3 = nowy toast dodany gdzie indziej w pliku, do świadomej oceny.`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
