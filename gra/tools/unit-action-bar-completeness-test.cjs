'use strict';
/**
 * unit-action-bar-completeness-test.cjs — P-UNITACTIONBAR-RENDERER-BRAK-BRAMKI-KOMPLETNOSCI
 * (2026-08-16, znalezisko Evaluatora przy okazji P-BITWA-OBLEZENIE-NIE-ANULUJE-ZAKOLEJKOWANEGO-ATAKU).
 *
 * Zgłoszenie: `buildUnitActionBarHtml` (gra/src/ui/unitActionBarHtml.ts) renderuje WYŁĄCZNIE
 * id akcji z ręcznie utrzymywanej allowlisty `COMPACT_ACTION_ORDER` (przecięte z kluczami
 * `ACTION_ICONS` — pętla pomija id bez ikony) plus kilka osobno hardkodowanych bloków
 * (`march-stop`, `disband`, od tego commitu też `siege-hold`). Każde NOWE id akcji dodane po
 * stronie danych (`main.ts`, `buildArmyStackHudStateInner` / `armyMerge.ts`,
 * `stackHudMergeSplitActions`) domyślnie NIE trafia do DOM, dopóki ktoś jawnie nie dopisze go
 * do renderera — CICHO, bez błędu, bez ostrzeżenia. Dokładnie ten mechanizm sprawił, że akcja
 * 'march-stop' ("Anuluj atak") w trybie oblężenia nigdy realnie nie działała w już wdrożonej
 * FALA 284, mimo że Evaluator dał PASS-WITH-NOTES (test omijał DOM, wołał funkcję bezpośrednio).
 * Naprawione w FALA 285 (commit `13ac8d35`).
 *
 * Ta bramka zamyka CAŁĄ KLASĘ błędu, nie tylko dzisiejszy przypadek: statycznie (source-level,
 * bez budowania Vite/DOM) porównuje zbiór id, jakie `buildArmyStackHudStateInner` (main.ts) i
 * `stackHudMergeSplitActions` (armyMerge.ts) MOGĄ wyprodukować, ze zbiorem id, które
 * `buildUnitActionBarHtml` (unitActionBarHtml.ts) FAKTYCZNIE renderuje (czy to przez
 * COMPACT_ACTION_ORDER ∩ ACTION_ICONS, czy przez dedykowany blok `byId.get('...')`). Każde id
 * po lewej bez odpowiednika po prawej = FAIL, chyba że jest na `KNOWN_GAPS` (patrz niżej).
 *
 * KNOWN_GAPS — dziś pusty. 'unfortify-all' było tu tymczasowym, udokumentowanym wyjątkiem na
 * czas równoległej pracy nad `P-UNITACTIONBAR-UNFORTIFY-ALL-NIEOSIAGALNE`; ten temat zamknięty
 * (COMPACT_ACTION_ORDER ma już wpis), więc allowlistę wyczyszczono.
 *
 * Dowód mutacyjny (dwie niezależne ścieżki renderowania):
 *  (MUT-HARDCODED) usunięcie hardkodowanego bloku 'march-stop' z (kopii w pamięci) tekstu
 *    unitActionBarHtml.ts → 'march-stop' MUSI wypaść ze zbioru wyrenderowanych id.
 *  (MUT-COMPACT-ORDER) usunięcie 'fortify' z listy COMPACT_ACTION_ORDER (kopia w pamięci) →
 *    'fortify' MUSI wypaść ze zbioru wyrenderowanych id (nawet mając ikonę w ACTION_ICONS).
 * Obie mutacje działają WYŁĄCZNIE na stringu w pamięci (żaden plik na dysku nie jest ruszany).
 *
 * / EN: this gate closes the whole bug class, not just today's case — statically (source-level,
 * no Vite/DOM build) it compares the set of action ids `buildArmyStackHudStateInner` (main.ts)
 * and `stackHudMergeSplitActions` (armyMerge.ts) CAN produce against the set of ids
 * `buildUnitActionBarHtml` (unitActionBarHtml.ts) ACTUALLY renders. Any id on the left without a
 * counterpart on the right is a FAIL, unless it is on `KNOWN_GAPS` (documented, intentional,
 * owned by a parallel task — see above). Two mutation proofs (hardcoded-block path and
 * COMPACT_ACTION_ORDER path) confirm the detection logic actually catches a regression of this
 * exact class, operating only on in-memory string copies.
 *
 * Bramka (z katalogu gra/): node tools/unit-action-bar-completeness-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const ARMY_MERGE_TS = path.join(GRA_ROOT, 'src', 'game', 'armyMerge.ts');
const ACTION_BAR_TS = path.join(GRA_ROOT, 'src', 'ui', 'unitActionBarHtml.ts');

const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const armyMergeSrc = fs.readFileSync(ARMY_MERGE_TS, 'utf8');
const actionBarSrc = fs.readFileSync(ACTION_BAR_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

console.log('unit-action-bar-completeness-test');

// ---------------------------------------------------------------------------
// Celowy, udokumentowany wyjątek — patrz nagłówek pliku.
// ---------------------------------------------------------------------------
const KNOWN_GAPS = new Set([]);

// ---------------------------------------------------------------------------
// Wycinanie tekstu funkcji po znanych, stabilnych kotwicach tekstowych (wzorzec
// kanoniczny repo — patrz march-attack-queue-persist-test.cjs).
// ---------------------------------------------------------------------------
function sliceBetween(src, startMarker, endMarker, label) {
  const s = src.indexOf(startMarker);
  if (s === -1) throw new Error(`Nie znaleziono kotwicy startowej dla ${label}: ${JSON.stringify(startMarker)}`);
  const e = src.indexOf(endMarker, s + startMarker.length);
  if (e === -1) throw new Error(`Nie znaleziono kotwicy końcowej dla ${label}: ${JSON.stringify(endMarker)}`);
  return src.slice(s, e);
}

/** Wszystkie literały `id: '...'` wewnątrz wywołań `actions.push({...})` w podanym tekście. */
function extractPushedIds(text) {
  const re = /actions\.push\(\{[^}]*?id:\s*'([\w-]+)'/g;
  const ids = new Set();
  let m;
  while ((m = re.exec(text))) ids.add(m[1]);
  return ids;
}

const hudBody = sliceBetween(
  mainSrc,
  'function buildArmyStackHudStateInner(): ArmyStackHudState | null {',
  'function handleSelectedUnitHudAction(actionId: string): void {',
  'buildArmyStackHudStateInner (main.ts)',
);
const mergeBody = sliceBetween(
  armyMergeSrc,
  'export function stackHudMergeSplitActions(',
  '/** Wspólny pul ruchu stosu',
  'stackHudMergeSplitActions (armyMerge.ts)',
);

const producedFromMain = extractPushedIds(hudBody);
const producedFromMerge = extractPushedIds(mergeBody);
const ALL_PRODUCED_IDS = new Set([...producedFromMain, ...producedFromMerge]);

// Strażnik strukturalny: gdyby kotwice tekstowe przestały pasować (np. po refaktorze), obie
// funkcje ekstrakcji zwróciłyby pusty zbiór i test przeszedłby FAŁSZYWIE (brak "produced" =
// brak "gaps"). Domykamy to sanity-checkiem liczącym oczekiwane minimum id.
ok(producedFromMain.size >= 9,
  `sanity: buildArmyStackHudStateInner produkuje ≥9 różnych id akcji (dziś: ${producedFromMain.size}) — zbyt mało sugeruje zepsutą ekstrakcję, nie realny spadek liczby akcji`);
ok(producedFromMerge.size === 2 && producedFromMerge.has('split') && producedFromMerge.has('merge'),
  `sanity: stackHudMergeSplitActions produkuje dokładnie {'split','merge'} (dziś: ${[...producedFromMerge].sort().join(',')})`);
for (const expectedId of ['fortify', 'march-stop', 'siege-hold', 'skip', 'disband', 'sentry', 'scout-explore', 'replace', 'unfortify-all']) {
  ok(ALL_PRODUCED_IDS.has(expectedId), `sanity: id '${expectedId}' nadal produkowany przez main.ts (regresja ekstrakcji lub usunięcie akcji)`);
}

// ---------------------------------------------------------------------------
// Ekstrakcja tego, co unitActionBarHtml.ts FAKTYCZNIE renderuje.
// ---------------------------------------------------------------------------
function extractCompactOrder(text) {
  const m = /const COMPACT_ACTION_ORDER = \[([^\]]+)\]/.exec(text);
  if (!m) throw new Error('COMPACT_ACTION_ORDER nie znaleziony w unitActionBarHtml.ts');
  const ids = new Set();
  const re = /'([\w-]+)'/g;
  let mm;
  while ((mm = re.exec(m[1]))) ids.add(mm[1]);
  return ids;
}

function extractActionIconsKeys(text) {
  const startIdx = text.indexOf('const ACTION_ICONS');
  if (startIdx === -1) throw new Error('ACTION_ICONS nie znaleziony w unitActionBarHtml.ts');
  const braceIdx = text.indexOf('{', startIdx);
  const endIdx = text.indexOf('\n};', braceIdx);
  if (braceIdx === -1 || endIdx === -1) throw new Error('Nie udało się wyciąć ciała ACTION_ICONS');
  const body = text.slice(braceIdx + 1, endIdx);
  const ids = new Set();
  const re = /(?:^|\n)\s*(?:'([\w-]+)'|([A-Za-z_$][\w-]*)):/g;
  let mm;
  while ((mm = re.exec(body))) ids.add(mm[1] || mm[2]);
  return ids;
}

/** Id z dedykowanych hardkodowanych bloków renderujących: `byId.get('xyz')`. */
function extractHardcodedRenderIds(text) {
  const re = /byId\.get\('([\w-]+)'\)/g;
  const ids = new Set();
  let m;
  while ((m = re.exec(text))) ids.add(m[1]);
  return ids;
}

/** Pełna ścieżka wyliczenia "co się realnie renderuje" dla danego tekstu unitActionBarHtml.ts. */
function computeRenderedIds(text) {
  const compactOrder = extractCompactOrder(text);
  const iconKeys = extractActionIconsKeys(text);
  const hardcoded = extractHardcodedRenderIds(text);
  const viaLoop = new Set([...compactOrder].filter(id => iconKeys.has(id)));
  return new Set([...viaLoop, ...hardcoded]);
}

const RENDERED_IDS = computeRenderedIds(actionBarSrc);

ok(RENDERED_IDS.size >= 8,
  `sanity: renderer ma ≥8 wyrenderowanych id (dziś: ${RENDERED_IDS.size}) — zbyt mało sugeruje zepsutą ekstrakcję`);
for (const expectedRendered of ['fortify', 'sentry', 'scout-explore', 'split', 'merge', 'replace', 'skip', 'march-stop', 'disband', 'siege-hold']) {
  ok(RENDERED_IDS.has(expectedRendered), `sanity: id '${expectedRendered}' ma ścieżkę renderowania (regresja ekstrakcji lub usunięcie render path)`);
}

// ---------------------------------------------------------------------------
// GŁÓWNA ASERCJA: każde produkowane id musi mieć render path, poza KNOWN_GAPS.
// ---------------------------------------------------------------------------
const gaps = [...ALL_PRODUCED_IDS].filter(id => !RENDERED_IDS.has(id));
const unexpectedGaps = gaps.filter(id => !KNOWN_GAPS.has(id));

ok(unexpectedGaps.length === 0,
  unexpectedGaps.length === 0
    ? 'brak nieudokumentowanych luk renderowania'
    : `NIEUDOKUMENTOWANE luki renderowania (id produkowane w main.ts/armyMerge.ts bez render path w unitActionBarHtml.ts, poza KNOWN_GAPS): ${unexpectedGaps.sort().join(', ')}`);

// Informacyjnie: potwierdź, że KNOWN_GAPS nadal odzwierciedla rzeczywistość (nie jest to FAIL —
// gdyby drugi agent naprawił 'unfortify-all', ten test ma dalej przechodzić bez modyfikacji;
// tylko logujemy, żeby było widać w konsoli, że allowlist jest już martwa i można ją posprzątać).
for (const knownGap of KNOWN_GAPS) {
  if (gaps.includes(knownGap)) {
    console.log(`  (info) KNOWN_GAPS: '${knownGap}' nadal bez render path (temat równoległy, celowo nie naprawiane tutaj)`);
  } else {
    console.log(`  (info) KNOWN_GAPS: '${knownGap}' JUŻ ma render path — allowlist nieaktualna, można usunąć wpis`);
  }
}

// ---------------------------------------------------------------------------
// DOWÓD MUTACYJNY 1 (MUT-HARDCODED): usunięcie hardkodowanego bloku 'march-stop' z KOPII
// tekstu w pamięci MUSI sprawić, że 'march-stop' wypadnie ze zbioru wyrenderowanych id.
// Reprodukuje dokładnie klasę błędu, która wyciekła do ROBOCZA FALA 284.
// ---------------------------------------------------------------------------
{
  const marchStopBlockRe = /const marchStop = byId\.get\('march-stop'\);\s*\n\s*if \(marchStop\) \{[\s\S]*?\n {2}\}\n/;
  ok(marchStopBlockRe.test(actionBarSrc), '(MUT-HARDCODED) blok march-stop znaleziony w źródle (mutacja przygotowana poprawnie)');
  const mutatedSrc = actionBarSrc.replace(marchStopBlockRe, '');
  ok(mutatedSrc !== actionBarSrc, '(MUT-HARDCODED) mutacja faktycznie zmieniła tekst');
  const mutatedRendered = computeRenderedIds(mutatedSrc);
  ok(!mutatedRendered.has('march-stop'),
    "(MUT-HARDCODED) po usunięciu bloku: 'march-stop' wypada ze zbioru wyrenderowanych id → ZŁAPANE (dokładnie ten bug, który wyciekł do ROBOCZA FALA 284)");
  // Kontrola: 'disband' (drugi hardkodowany blok, nietknięty mutacją) zostaje wyrenderowany.
  ok(mutatedRendered.has('disband'),
    "(MUT-HARDCODED) kontrola: 'disband' nietknięty mutacją, nadal wyrenderowany (mutacja precyzyjna, nie nadmiarowa)");
}

// ---------------------------------------------------------------------------
// DOWÓD MUTACYJNY 2 (MUT-COMPACT-ORDER): usunięcie 'fortify' z COMPACT_ACTION_ORDER (kopia w
// pamięci) MUSI sprawić, że 'fortify' wypadnie ze zbioru wyrenderowanych id, mimo że nadal ma
// wpis w ACTION_ICONS (dowodzi, że sama obecność ikony NIE wystarcza — liczy się przecięcie
// z listą kolejności, dokładnie tak jak w realnym kodzie).
// ---------------------------------------------------------------------------
{
  const compactOrderRe = /const COMPACT_ACTION_ORDER = \[([^\]]+)\]/;
  ok(compactOrderRe.test(actionBarSrc), '(MUT-COMPACT-ORDER) COMPACT_ACTION_ORDER znaleziony (mutacja przygotowana poprawnie)');
  const mutatedSrc = actionBarSrc.replace(compactOrderRe, (full, inner) => {
    const withoutFortify = inner.replace(/'fortify',?\s*/, '');
    return full.replace(inner, withoutFortify);
  });
  ok(mutatedSrc !== actionBarSrc, '(MUT-COMPACT-ORDER) mutacja faktycznie zmieniła tekst');
  const mutatedRendered = computeRenderedIds(mutatedSrc);
  ok(!mutatedRendered.has('fortify'),
    "(MUT-COMPACT-ORDER) po usunięciu 'fortify' z COMPACT_ACTION_ORDER: wypada ze zbioru wyrenderowanych id mimo wpisu w ACTION_ICONS → ZŁAPANE");
  // Kontrola: 'sentry' (nietknięty mutacją) zostaje wyrenderowany.
  ok(mutatedRendered.has('sentry'),
    "(MUT-COMPACT-ORDER) kontrola: 'sentry' nietknięty mutacją, nadal wyrenderowany (mutacja precyzyjna, nie nadmiarowa)");
}

console.log('unit-action-bar-completeness-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
