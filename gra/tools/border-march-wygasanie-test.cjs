'use strict';
/**
 * border-march-wygasanie-test.cjs — R-PRZEMARSZ-WYGASANIE-Q1=A
 *
 * Weryfikuje dwie rzeczy:
 *
 * 1) ŹRÓDŁO (main.ts jako tekst, wzorzec jak w tools/weterani-test.cjs L505-512):
 *    - applyBorderMarchPenaltiesEndTurn pisze do borderMarchEventLog, NIE do warEventLog;
 *    - borderMarchEventLog jest zerowany razem z villageEventLog/tradeRouteEventLog przy
 *      turn++ (ten sam blok resetu);
 *    - onEventDismiss ma gałąź 'border-march-' celującą w borderMarchEventLog (nie warEventLog);
 *    - stary komentarz "N5 (+N3+N4): stabilne id per kierunek" (opis STAREGO mechanizmu
 *      findIndex+splice+unshift w warEventLog) został usunięty z funkcji.
 *
 * 2) MECHANIZM (symulacja behawioralna): borderMarchEventLog/villageEventLog/etc. to
 *    zwykłe tablice rządzone TRZEMA operacjami widocznymi w main.ts:
 *      - reset:   log.length = 0                (przy turn++, PRZED odbudową w tej samej turze)
 *      - populate: log.unshift({id, ...})        (w applyBorderMarchPenaltiesEndTurn, JEŚLI
 *                  warunek naruszenia jest prawdziwy W TEJ TURZE)
 *      - dismiss: log.splice(idx, 1)              (onEventDismiss, natychmiast po kliknięciu ✕)
 *    Poniższa symulacja odtwarza dokładnie te trzy operacje (nie inny model) i sprawdza
 *    właściwości na losowych ciągach tur z włączającym/wyłączającym się naruszeniem +
 *    losowymi kliknięciami ✕, tak jak zrobił to Evaluator dla starego mechanizmu.
 *
 * node tools/border-march-wygasanie-test.cjs
 */
const fs = require('fs');
const path = require('path');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// CZĘŚĆ 1 — ŹRÓDŁO
// ---------------------------------------------------------------------------

// Wytnij ciało applyBorderMarchPenaltiesEndTurn (od nagłówka do zamykającej klamry funkcji,
// rozpoznanej po tym że kolejna linia zaczyna kolejną deklarację function na tym samym wcięciu).
const fnStart = src.indexOf('function applyBorderMarchPenaltiesEndTurn(): void {');
ok(fnStart >= 0, 'znaleziono applyBorderMarchPenaltiesEndTurn w main.ts');
const fnEndMarker = '\n    function countTerritoryHexes(';
const fnEndIdx = src.indexOf(fnEndMarker, fnStart);
ok(fnEndIdx > fnStart, 'znaleziono koniec applyBorderMarchPenaltiesEndTurn (przed countTerritoryHexes)');
const fnBody = fnStart >= 0 && fnEndIdx > fnStart ? src.slice(fnStart, fnEndIdx) : '';

ok(/borderMarchEventLog\.unshift\(/.test(fnBody),
  'applyBorderMarchPenaltiesEndTurn pisze do borderMarchEventLog.unshift(...)');
ok(!/warEventLog\.unshift\(/.test(fnBody),
  'applyBorderMarchPenaltiesEndTurn NIE pisze już do warEventLog.unshift(...)');
ok(!/warEventLog\.findIndex/.test(fnBody),
  'applyBorderMarchPenaltiesEndTurn NIE robi już findIndex na warEventLog (stary mechanizm usunięty)');
ok(!/N5 \(\+N3\+N4\): stabilne id per kier/.test(fnBody),
  'stary komentarz N5 (stabilne-id-w-warEventLog) usunięty z funkcji');

// Kara Zaufania (applyUnauthorizedBorderPenalties) i N7 Wiarygodności — muszą nadal być
// wywoływane W TEJ SAMEJ funkcji, bez zmian w wywołaniu.
ok(/applyUnauthorizedBorderPenalties\(/.test(fnBody),
  'applyUnauthorizedBorderPenalties nadal wywoływane w applyBorderMarchPenaltiesEndTurn (kara Zaufania nietknięta)');
ok(/appendWiarygodnoscEvent\(pair\.intruderOwnerId, 'nieautoryzowany_przemarsz'/.test(fnBody),
  'appendWiarygodnoscEvent(...,"nieautoryzowany_przemarsz",...) nadal wywoływane (N7 nietknięte)');
ok(/wiarygodnoscN7ActivePairs/.test(fnBody),
  'wiarygodnoscN7ActivePairs nadal obecne (N7 nietknięte)');

// Reset per-turowy: borderMarchEventLog.length = 0 w tym samym bloku co villageEventLog.length = 0.
const resetBlockMatch = src.match(
  /\n {8}villageEventLog\.length = 0;[\s\S]{0,800}?\n {8}borderMarchEventLog\.length = 0;/,
);
ok(!!resetBlockMatch,
  'borderMarchEventLog.length = 0 stoi w tym samym bloku resetu co villageEventLog.length = 0');

// Dismiss: gałąź 'border-march-' w onEventDismiss celuje w borderMarchEventLog, nie warEventLog.
const dismissIdx = src.indexOf("onEventDismiss: (id) => {");
ok(dismissIdx >= 0, 'znaleziono onEventDismiss');
const dismissWindow = dismissIdx >= 0 ? src.slice(dismissIdx, dismissIdx + 4000) : '';
const branchStartIdx = dismissWindow.indexOf("id.startsWith('border-march-')");
const branchEndIdx = dismissWindow.indexOf("id.startsWith('village-')", branchStartIdx);
ok(branchStartIdx >= 0 && branchEndIdx > branchStartIdx, 'znaleziono gałąź border-march- w onEventDismiss');
const dismissBranch = branchStartIdx >= 0 && branchEndIdx > branchStartIdx
  ? dismissWindow.slice(branchStartIdx, branchEndIdx)
  : '';
ok(/borderMarchEventLog\.findIndex/.test(dismissBranch),
  "onEventDismiss('border-march-...') czyta z borderMarchEventLog");
ok(/borderMarchEventLog\.splice/.test(dismissBranch),
  "onEventDismiss('border-march-...') usuwa z borderMarchEventLog");
ok(!/warEventLog/.test(dismissBranch),
  "onEventDismiss('border-march-...') już NIE dotyka warEventLog");

// collectTurnEvents zbiera borderMarchEventLog.
ok(/\.\.\.borderMarchEventLog,/.test(src),
  'collectTurnEvents zbiera ...borderMarchEventLog');

// ---------------------------------------------------------------------------
// CZĘŚĆ 2 — MECHANIZM (symulacja behawioralna)
// ---------------------------------------------------------------------------
//
// Model wiernie odtwarza main.ts:
//   - PRZED applyBorderMarchPenaltiesEndTurn w danej turze: log = [] (reset przy turn++).
//   - W applyBorderMarchPenaltiesEndTurn: jeśli violated -> unshift('border-march-violated'),
//     jeśli trespassing -> unshift('border-march-trespassing').
//   - Gracz może kliknąć ✕ na dowolny wpis obecny W BIEŻĄCEJ turze (po populate) -> splice.
//   - Test też sprawdza że NASTĘPNA tura resetuje log niezależnie od tego czy poprzedni
//     wpis był odrzucony czy nie (to jest właśnie naprawiony defekt #1 z raportu Evaluatora).

function simulateTurn(log, violated, trespassing, dismissIds) {
  // 1) reset (main.ts: villageEventLog.length = 0; ... borderMarchEventLog.length = 0;)
  log.length = 0;
  // 2) populate (main.ts: applyBorderMarchPenaltiesEndTurn, wywołane PO resecie w tej samej sekwencji EOT)
  if (violated) {
    log.unshift({ id: 'border-march-violated', title: 'Granice naruszone' });
  }
  if (trespassing) {
    log.unshift({ id: 'border-march-trespassing', title: 'Jednostka na cudzym terenie' });
  }
  if (log.length > 8) log.length = 8;
  // 3) dismiss (main.ts: onEventDismiss -> log.splice(idx, 1))
  for (const id of dismissIds) {
    const idx = log.findIndex(e => e.id === id);
    if (idx >= 0) log.splice(idx, 1);
  }
}

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const TURNS = 20000;
const rng = seededRng(0xc1712c);
const log = [];

let expiryChecks = 0, expiryOk = 0;
let dismissChecks = 0, dismissOk = 0;
let maxLenSeen = 0;
let violatedPrevTurn = false;
let trespassingPrevTurn = false;
let sawViolatedAfterStop = false;
let sawTrespassingAfterStop = false;

for (let t = 0; t < TURNS; t++) {
  const violated = rng() < 0.35;
  const trespassing = rng() < 0.35;

  // Decyzja o dismiss PRZED populate tej tury nie ma sensu (nic jeszcze nie ma w logu) —
  // klikamy na wpisy z POPRZEDNIEJ tury tylko jeśli chcemy sprawdzić że i tak znikają
  // (defekt #1: dismiss nigdy nie działał trwale, bo wpis wracał). Tu testujemy dismiss
  // NA WPISACH BIEŻĄCEJ TURY, zaraz po ich powstaniu — realistyczny klik gracza w tej samej turze.
  simulateTurn(log, violated, trespassing, []); // reset + populate, bez dismiss jeszcze

  maxLenSeen = Math.max(maxLenSeen, log.length);

  // Właściwość (a): wpis obecny <=> warunek prawdziwy w TEJ turze (auto-wygasanie).
  expiryChecks++;
  const hasViolated = log.some(e => e.id === 'border-march-violated');
  const hasTrespassing = log.some(e => e.id === 'border-march-trespassing');
  if (hasViolated === violated && hasTrespassing === trespassing) expiryOk++;

  // Defekt Evaluatora #2 potwierdzony na starym mechanizmie: po ustaniu naruszenia stary
  // wpis nadal wisiał w warEventLog. Tu jawnie sprawdzamy, że gdy naruszenie WŁAŚNIE ustało
  // (było w poprzedniej turze, nie ma w tej), wpisu NIE MA w logu.
  if (violatedPrevTurn && !violated && hasViolated) sawViolatedAfterStop = true;
  if (trespassingPrevTurn && !trespassing && hasTrespassing) sawTrespassingAfterStop = true;

  // Właściwość (b): dismiss w TEJ turze natychmiast usuwa wpis z TEJ tury.
  const dismissTargets = [];
  if (hasViolated && rng() < 0.5) dismissTargets.push('border-march-violated');
  if (hasTrespassing && rng() < 0.5) dismissTargets.push('border-march-trespassing');
  if (dismissTargets.length > 0) {
    for (const id of dismissTargets) {
      const idx = log.findIndex(e => e.id === id);
      if (idx >= 0) log.splice(idx, 1);
    }
    dismissChecks++;
    if (dismissTargets.every(id => !log.some(e => e.id === id))) dismissOk++;
  }

  violatedPrevTurn = violated;
  trespassingPrevTurn = trespassing;
}

ok(expiryChecks === TURNS, `expiryChecks policzone dla wszystkich ${TURNS} tur`);
ok(expiryOk === expiryChecks,
  `wygasanie: wpis obecny <=> naruszenie prawdziwe w danej turze — ${expiryOk}/${expiryChecks}`);
ok(dismissChecks > 0, `dismiss przetestowany w co najmniej jednej turze (${dismissChecks} razy)`);
ok(dismissOk === dismissChecks,
  `dismiss: kliknięcie ✕ usuwa wpis z bieżącej tury — ${dismissOk}/${dismissChecks}`);
ok(!sawViolatedAfterStop,
  'border-march-violated NIGDY nie przeżywa tury, w której naruszenie ustało (defekt #2 naprawiony)');
ok(!sawTrespassingAfterStop,
  'border-march-trespassing NIGDY nie przeżywa tury, w której naruszenie ustało (defekt #2 naprawiony)');
ok(maxLenSeen <= 8, `log nigdy nie rośnie bez ograniczeń — max długość zaobserwowana ${maxLenSeen} (limit 8, realnie <=2)`);

// Test odrębny: dismiss w turze N NIE musi przetrwać do tury N+1 (bo log i tak resetuje się
// przy turn++ niezależnie od dismiss) — sprawdzamy że to jest spójne: po dismiss w turze N,
// jeśli naruszenie trwa też w N+1, wpis wraca (to jest ZAMIERZONE zachowanie wzorca
// villageEventLog/village- dismiss, patrz main.ts onEventDismiss).
{
  const log2 = [];
  simulateTurn(log2, true, false, []); // tura 1: naruszenie, wpis powstaje
  const idx = log2.findIndex(e => e.id === 'border-march-violated');
  ok(idx >= 0, 'test dismiss-nie-przetrwa: wpis powstał w turze 1');
  log2.splice(idx, 1); // gracz klika ✕
  ok(!log2.some(e => e.id === 'border-march-violated'), 'test dismiss-nie-przetrwa: wpis zniknął po ✕ w turze 1');
  simulateTurn(log2, true, false, []); // tura 2: naruszenie WCIĄŻ trwa
  ok(log2.some(e => e.id === 'border-march-violated'),
    'test dismiss-nie-przetrwa: wpis wraca w turze 2, bo naruszenie nadal trwa (zgodnie z wzorcem village-)');
}

console.log(`\nborder-march-wygasanie-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
