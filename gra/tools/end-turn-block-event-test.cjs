'use strict';
/**
 * end-turn-block-event-test.cjs — R-WEB-UI-END-TURN-BLOCK-EVENT-Q1.
 *
 * Blokada „Zakończ turę” (bramka NNS) ma być widoczna jako WYDARZENIE w zakładce „Ważne”,
 * a nie tylko w tooltipie. Sprawdza:
 *  (a) próba zakończenia tury przy blokadzie -> dokładnie jedno wydarzenie, pełny komunikat,
 *      kafelek w zakładce „Ważne” (eventTabOf === 'wazne'), tytuł po polsku bez surowych ID;
 *  (b) ponowna próba w tej samej turze -> to samo id (brak duplikatu);
 *  (c) blokada ustąpiła -> brak wydarzenia;
 *  (d) brak próby -> brak wydarzenia (zero spamu przy samej blokadzie);
 *  (e) próba z poprzedniej tury -> brak wydarzenia (wydarzenie żyje jedną turę);
 *  (f) wiring: main.ts zapisuje próbę w hintEndTurnBlocked (gałąź NNS) i dokleja wydarzenie
 *      w collectTurnEventsUncached; wydarzenie nie jest blokujące (nie liczy się do „wymaga decyzji”).
 *
 * Run: node tools/end-turn-block-event-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.end-turn-block-event-entry.ts');
const BUNDLE = path.resolve(__dirname, '.end-turn-block-event-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  "export { endTurnBlockEventOf, END_TURN_BLOCK_EVENT_TITLE, END_TURN_BLOCK_ACT_TAX_RAISE, END_TURN_BLOCK_ACT_OPEN_TAX, END_TURN_BLOCK_ACT_OPEN_FOOD } from '../src/ui/sidePanelEventFilter';\n" +
  "export { eventTabOf } from '../src/ui/sidePanelEventTabs';\n",
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const KOMUNIKAT =
  'Nie można zakończyć tury: Spichlerz państwa (żywność): po turze zabraknie 2. ' +
  'Pomogą: podatek złota: +10 złota/turę; obniżka racji żywności: +16 żywności/turę; ' +
  'rozwiązanie jednostek (złoto): +4 złota/turę; rozwiązanie jednostek (żywność): +4 żywności/turę.';

// Symulacja listy wydarzeń: jak collectTurnEventsUncached, wpis dokładany tylko gdy jest, a lista
// wynikowa deduplikowana po id (dokładnie tyle gwarantuje id zależne od tury).
function eventsAfter(attempts, input) {
  const list = [];
  for (let i = 0; i < attempts; i++) {
    const ev = M.endTurnBlockEventOf(input);
    if (ev) list.push(ev);
  }
  const byId = new Map();
  for (const ev of list) byId.set(ev.id, ev);
  return [...byId.values()];
}

// (a) próba przy blokadzie
{
  const input = { blokada: true, komunikat: KOMUNIKAT, turn: 12, attemptTurn: 12 };
  const evs = eventsAfter(1, input);
  ok(evs.length === 1, '(a) dokładnie jedno wydarzenie po próbie przy blokadzie');
  const ev = evs[0];
  ok(ev && ev.title === 'Nie można zakończyć tury', '(a) tytuł po polsku „Nie można zakończyć tury”');
  ok(ev && ev.subtitle.includes('Spichlerz państwa (żywność): po turze zabraknie 2.'), '(a) pełny komunikat: zasób i brakująca ilość');
  ok(ev && ev.subtitle.includes('podatek złota: +10 złota/turę') && ev.subtitle.includes('rozwiązanie jednostek (żywność): +4 żywności/turę'), '(a) pełna lista dźwigni z liczbami');
  ok(ev && !/Nie można zakończyć tury:/.test(ev.subtitle), '(a) prefiks tytułu nie powtarza się w treści');
  ok(ev && !/\b(brak|null|undefined)\b|[a-z]+-[a-z]+-\d/.test(ev.subtitle + ev.title), '(a) brak surowych ID w tekście');
  ok(ev && ev.important === true, '(a) ważne=true (zakładka Ważne)');
  ok(ev && M.endTurnBlockEventOf && ev.blocking !== true, '(f) wydarzenie nieblokujące (nie liczy się jako „wymaga decyzji”)');
  ok(ev && M.eventTabOf(ev) === 'wazne', '(a) eventTabOf -> zakładka „wazne”');
  ok(ev && ev.turnCreated === 12, '(e) znacznik tury utworzenia = 12');
}

// (b) ponowna próba w tej samej turze nie duplikuje
{
  const input = { blokada: true, komunikat: KOMUNIKAT, turn: 12, attemptTurn: 12 };
  const evs = eventsAfter(3, input);
  ok(evs.length === 1, '(b) trzy próby w tej samej turze -> nadal jedno wydarzenie');
  const a = M.endTurnBlockEventOf(input);
  const b = M.endTurnBlockEventOf(input);
  ok(a && b && a.id === b.id, '(b) id stabilne między próbami');
}

// (c) blokada ustąpiła -> brak wydarzenia
{
  const ev = M.endTurnBlockEventOf({ blokada: false, komunikat: '', turn: 12, attemptTurn: 12 });
  ok(ev === null, '(c) brak blokady -> brak wydarzenia');
}

// (d) brak próby -> brak wydarzenia
{
  const ev = M.endTurnBlockEventOf({ blokada: true, komunikat: KOMUNIKAT, turn: 12, attemptTurn: null });
  ok(ev === null, '(d) blokada bez próby gracza -> brak wydarzenia');
}

// (e) próba z poprzedniej tury -> brak wydarzenia; nowa tura kolejny id
{
  const ev = M.endTurnBlockEventOf({ blokada: true, komunikat: KOMUNIKAT, turn: 13, attemptTurn: 12 });
  ok(ev === null, '(e) próba z poprzedniej tury nie tworzy wydarzenia w nowej turze');
  const t12 = M.endTurnBlockEventOf({ blokada: true, komunikat: KOMUNIKAT, turn: 12, attemptTurn: 12 });
  const t13 = M.endTurnBlockEventOf({ blokada: true, komunikat: KOMUNIKAT, turn: 13, attemptTurn: 13 });
  ok(t12 && t13 && t12.id !== t13.id, '(e) kolejna tura z własną próbą -> inne id (nie jest ukryte po ✕ z poprzedniej tury)');
}

// (f) wiring w main.ts
{
  const src = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  // Kotwica strukturalna niezależna od wcięcia: ciało funkcji kończy się przed następną
  // deklaracją `function` (dowolne wcięcie). Brak kotwicy = jawny FAIL, bez cichego okna znaków.
  const hintStart = src.indexOf('function hintEndTurnBlocked');
  const nextDecl = hintStart >= 0 ? /\n[ \t]+(?:export )?function [A-Za-z_$][\w$]*\s*\(/.exec(src.slice(hintStart + 10)) : null;
  const hint = nextDecl ? src.slice(hintStart, hintStart + 10 + nextDecl.index) : '';
  ok(hint.length > 0, '(f) kotwica końca hintEndTurnBlocked znaleziona (struktura, nie okno znaków)');
  ok(/if \(nnsHint\.blokada\) \{\s*noteEndTurnBlockedByNns\(\);/.test(hint), '(f) hintEndTurnBlocked zapisuje próbę w gałęzi NNS');
  const collectIdx = src.indexOf('function collectTurnEventsUncached');
  const collectBody = src.slice(collectIdx, src.indexOf('dismissedSidePanelEventIds.has(e.id));', collectIdx));
  ok(/const nnsBlockEvent = nnsEndTurnBlockEvent\(\);\s*if \(nnsBlockEvent\) events\.push\(nnsBlockEvent\);/.test(collectBody), '(f) collectTurnEventsUncached dokleja wydarzenie blokady');
  ok(/function nnsEndTurnBlockEvent\(\)[\s\S]*?endTurnBlockEventOf\(\{/.test(src), '(f) nnsEndTurnBlockEvent używa endTurnBlockEventOf');
}

// (g) TDZ (zarzut 1 Evaluatora, FATAL „Cannot access … before initialization” w Chromium):
// stan próby MUSI być zadeklarowany PRZED funkcją collectTurnEventsUncached, bo ta jest wołana
// przy starcie gry, zanim boot() dojdzie do niżej położonych deklaracji. Test statyczny łapie tę
// klasę błędu; pełną gwarancję daje realny boot w Chromium (patrz raport Obrony).
{
  const src = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  const declIdx = src.indexOf('let nnsEndTurnBlockAttemptTurn');
  const collectIdx = src.indexOf('function collectTurnEventsUncached');
  ok(declIdx > 0 && collectIdx > 0 && declIdx < collectIdx,
    '(g) deklaracja nnsEndTurnBlockAttemptTurn przed collectTurnEventsUncached (brak TDZ przy boot)');
  ok(src.indexOf('let nnsEndTurnBlockAttemptTurn') === src.lastIndexOf('let nnsEndTurnBlockAttemptTurn'),
    '(g) jedna deklaracja nnsEndTurnBlockAttemptTurn');
}

// (k) zarzut 6: bez próby wczesny null PRZED nnsGateForPlayer (brak kosztu w każdym collect)
{
  const src = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  const fnIdx = src.indexOf('function nnsEndTurnBlockEvent()');
  const body = src.slice(fnIdx, src.indexOf('function noteEndTurnBlockedByNns', fnIdx));
  const early = body.indexOf('if (nnsEndTurnBlockAttemptTurn === null) return null;');
  const gate = body.indexOf('nnsGateForPlayer()');
  ok(early >= 0 && gate > early, '(k) wczesny return null bez próby, przed wywołaniem bramki');
}

// (l) DODATEK 1: przyciski akcji zdarzenia blokady (propozycja podatku / racja / maksimum nie wystarcza)
{
  const base = { blokada: true, komunikat: KOMUNIKAT, turn: 12, attemptTurn: 12 };
  const skarb = M.endTurnBlockEventOf({ ...base, zasob: 'skarbiec', propozycjaPunkty: 10, podatekTeraz: 30 });
  const labels = skarb ? skarb.buttons.map(b => b.label) : [];
  const acts = skarb ? skarb.buttons.map(b => b.act) : [];
  ok(labels[0] === 'Zwiększ podatek do 40%' && acts[0] === M.END_TURN_BLOCK_ACT_TAX_RAISE,
    '(l) skarbiec z propozycją: „Zwiększ podatek do 40%” (30 + 10 pkt), akcja tax-raise');
  ok(labels[1] === 'Zmienię sam' && acts[1] === M.END_TURN_BLOCK_ACT_OPEN_TAX,
    '(l) skarbiec: „Zmienię sam” otwiera panel podatków');
  const noProp = M.endTurnBlockEventOf({ ...base, zasob: 'skarbiec', propozycjaPunkty: null, podatekTeraz: 90 });
  ok(noProp && noProp.buttons.length === 1 && noProp.buttons[0].act === M.END_TURN_BLOCK_ACT_OPEN_TAX,
    '(l) skarbiec bez propozycji (maksimum nie wystarcza): tylko „Zmienię sam”');
  const food = M.endTurnBlockEventOf({ ...base, zasob: 'spichlerz', propozycjaPunkty: null, podatekTeraz: 30 });
  ok(food && food.buttons.length === 1 && food.buttons[0].act === M.END_TURN_BLOCK_ACT_OPEN_FOOD,
    '(l) spichlerz: przycisk „Otwórz racje” (panel racji)');
  ok(food && food.blocking !== true && food.kind === 'info', '(l) spichlerz: wydarzenie nieblokujące');
  const none = M.endTurnBlockEventOf({ ...base, zasob: null, propozycjaPunkty: null, podatekTeraz: 30 });
  ok(none && Array.isArray(none.buttons) && none.buttons.length === 0, '(l) brak zasobu -> brak przycisków (nie zgaduje akcji)');
}

// (m) wiring akcji w main.ts: przycisk -> handler -> istniejąca zmiana podziału (bez duplikatu logiki)
{
  const src = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  const fnIdx = src.indexOf('function handleEndTurnBlockButton(act: string)');
  const body = fnIdx > 0 ? src.slice(fnIdx, src.indexOf('/** R-WEB-ECON-NO-NEGATIVE-STOCKS-B-Q1', fnIdx)) : '';
  ok(fnIdx > 0, '(m) handleEndTurnBlockButton istnieje');
  ok(/applyPodzialHandluGracza\(cur\.procentPieniadz \+ p\.punktyProcentowe, cur\.procentNauka - p\.punktyProcentowe, cur\.procentLuksus\)/.test(body),
    '(m) „Zwiększ podatek” przesuwa punkty z Nauki na Pieniądz o propozycję bramki (przez wspólną funkcję zapisu)');
  ok(/function applyPodzialHandluGracza\(p: number, n: number, l: number\)[\s\S]{0,260}ownerDefaultPodzialHandlu\.set\(ME\(\), s\)/.test(src)
    && /setTaxSplit: \(p: number, n: number, l: number\)[\s\S]{0,260}?applyPodzialHandluGracza\(p, n, l\)/.test(src),
    '(m) suwak/hook testowy i przycisk karty używają tej samej funkcji zapisu podziału (bez duplikatu)');
  ok(/if \(!p\) return;/.test(body), '(m) bez propozycji akcja podatku nic nie zmienia');
  ok(/onEventButton: \(_id, act\) => handleEndTurnBlockButton\(act\)/.test(src), '(m) konfiguracja HUD podpina onEventButton');
  ok(/if \(act === END_TURN_BLOCK_ACT_OPEN_TAX\) \{ openEmpireDetailFromHud\('econ-skarbiec'\)/.test(body)
    && /openEmpireDetailFromHud\('spichlerz'\)/.test(body), '(m) „Zmienię sam” -> sekcja skarbca, racja -> sekcja spichlerza (nie „zywnosc”: brak takiej sekcji panelu)');
  ok(/nnsEndTurnBlockAttemptTurn = turn;[\s\S]{0,40}refreshD1bHud\(\);/.test(src), '(m) zapis próby odświeża panel');
}

console.log(`end-turn-block-event-test: passed=${passed} failed=${failed}`);
if (failed > 0) process.exit(1);
