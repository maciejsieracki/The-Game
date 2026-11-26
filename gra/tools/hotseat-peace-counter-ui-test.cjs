'use strict';
/**
 * hotseat-peace-counter-ui-test.cjs — R-WEB-DIPLO-HOTSEAT-PEACE-COUNTER-UI-Q1 (HOTSEATHUD, #152).
 *
 * Licznik „Dostępne za N tur” w oknie dyplomacji między fotelami (hotseat) dla akcji „Pokój”.
 *  (a) Rdzeń (czysta funkcja `peaceCounterLabel` z gra/src/game/diplomacy-peace-proposal-timing.ts):
 *      wykonywany naprawdę (TypeScript -> JS przez `typescript.transpileModule`), sprawdzany dla
 *      N = 10, 8, 5, 4, 1 (odmiana „tur/tury/turę”) oraz N = 0 (blokada zniknęła) i brak wojny.
 *      MUTACJE: (1) licznik zawsze pusty, (2) przesunięty licznik (N+1) — test MUSI wykryć obie (czerwono).
 *  (b) Spięcie ze źródłem prawdy: okno HUD (gra/src/ui/interHumanDiplomacyHud.ts) korzysta z
 *      `peaceCounterLabel` i blokuje akcję Pokój; main.ts przekazuje `peaceTurnsAtWar` z TEJ SAMEJ
 *      pary/źródła co bramka `peaceProposalIsTooEarly(meId, otherOwnerId, 'pokoj')`.
 *
 * Nie ma tu renderu DOM (brak jsdom/Chromium w tej rundzie) — zrzut z żywego Chromium: NIE ZMIERZONO.
 *
 * Użycie (z katalogu gra/): node tools/hotseat-peace-counter-ui-test.cjs
 * Wymaga: node_modules/typescript (npm install w gra/).
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const GRA = path.join(__dirname, '..');
const timingPath = path.join(GRA, 'src', 'game', 'diplomacy-peace-proposal-timing.ts');
const hudSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'interHumanDiplomacyHud.ts'), 'utf8');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const timingSrc = fs.readFileSync(timingPath, 'utf8');

let pass = 0;
let fail = 0;
function check(label, ok) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
}

/** Wykonuje moduł timingu (transpilowany) i zwraca jego eksporty. */
function loadTiming(src) {
  const code = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', code)(mod.exports, mod);
  return mod.exports;
}

/** Oczekiwania: [turnsAtWar | null, tekst]. null = brak licznika. */
const CASES = [
  ['brak wojny (undefined)', undefined, null],
  ['brak wojny (null)', null, null],
  ['wojna, 0 tur -> N=10', 0, 'Dostępne za 10 tur'],
  ['wojna, 2 tury -> N=8', 2, 'Dostępne za 8 tur'],
  ['wojna, 5 tur -> N=5', 5, 'Dostępne za 5 tur'],
  ['wojna, 6 tur -> N=4 (odmiana „tury”)', 6, 'Dostępne za 4 tury'],
  ['wojna, 9 tur -> N=1 (odmiana „turę”)', 9, 'Dostępne za 1 turę'],
  ['wojna, 10 tur -> N=0, blokada zniknęła', 10, null],
  ['wojna, 14 tur -> po blokadzie', 14, null],
];

/** quiet=true: tylko zlicza niezgodności (używane dla mutantów — ich czerwień jest oczekiwana). */
function runCases(label, src, quiet) {
  let mod;
  try {
    mod = loadTiming(src);
  } catch (e) {
    if (!quiet) console.log('  (ładowanie nie powiodło się: ' + e.message + ')');
    return { ok: false, failed: CASES.length };
  }
  let failed = 0;
  for (const [desc, turns, expected] of CASES) {
    const got = mod.peaceCounterLabel(turns);
    const ok = got === expected;
    if (!ok) failed++;
    if (!quiet) check(`${label}: ${desc} (oczekiwano ${JSON.stringify(expected)}, otrzymano ${JSON.stringify(got)})`, ok);
  }
  return { ok: failed === 0, failed };
}

// (a) Rdzeń — produkcyjny kod.
const real = runCases('rdzeń (produkcja)', timingSrc, false);
check('rdzeń produkcyjny: funkcja eksportowana i zgodna z tabelą', real.ok);

// (a) Mutacje — MUSZĄ być wykryte (czerwono).
const mutNever = timingSrc.replace(
  "if (!peaceProposalBlocked('pokoj', true, turnsAtWar)) return null;",
  'return null;',
);
const mutShift = timingSrc.replace(
  'const left = peaceProposalTurnsLeft(turnsAtWar);',
  'const left = peaceProposalTurnsLeft(turnsAtWar) + 1;',
);
check('mutacja 1 (licznik zawsze pusty) użyta w teście', mutNever !== timingSrc);
check('mutacja 2 (N+1) użyta w teście', mutShift !== timingSrc);
const mutNeverRes = runCases('MUTACJA-1', mutNever, true);
const mutShiftRes = runCases('MUTACJA-2', mutShift, true);
check(`mutacja 1 wykryta przez test (niezgodności: ${mutNeverRes.failed})`, !mutNeverRes.ok);
check(`mutacja 2 wykryta przez test (niezgodności: ${mutShiftRes.failed})`, !mutShiftRes.ok);

// (b) Spięcie HUD <-> rdzeń.
check('HUD importuje peaceCounterLabel z diplomacy-peace-proposal-timing',
  /import\s*\{\s*peaceCounterLabel\s*\}\s*from\s*'\.\.\/game\/diplomacy-peace-proposal-timing'/.test(hudSrc));
check('HUD: konfiguracja ma pole peaceTurnsAtWar',
  /peaceTurnsAtWar\?:\s*number\s*\|\s*null/.test(hudSrc));
check('HUD: licznik liczony z cfg.peaceTurnsAtWar',
  hudSrc.includes('peaceCounterLabel(cfg.peaceTurnsAtWar)'));
check('HUD: przycisk „Wyślij propozycję” zablokowany przy aktywnym liczniku pokoju',
  /ihd-new-submit"\$\{peaceNote !== null \? ' disabled' : ''\}/.test(hudSrc)
  && hudSrc.includes('newSubmit.disabled = blocked'));
check('HUD: „Akceptuj” zablokowane dla propozycji pokoju przy aktywnym liczniku',
  hudSrc.includes("const blocked = item.kind === 'zaproponuj_pokoj' && peaceNote !== null;")
  && hudSrc.includes('ihd-accept"${blocked ? \' disabled\' : \'\'}'));
check('HUD: klik „Wyślij” przy zablokowanym pokoju nie wywołuje onPropose',
  hudSrc.includes("if (k === 'zaproponuj_pokoj' && peaceNote !== null) return;"));

// main.ts: ta sama para i to samo źródło co bramka humanPeaceRejectReason.
check('main.ts: openInterHumanDiplomacyHud przekazuje peaceTurnsAtWar',
  mainSrc.includes("peaceTurnsAtWar: peaceAtWar ? diploWarStateFor(meId, otherOwnerId).turnsAtWar : null,"));
check('main.ts: status wojny z getDiploRelation(meId, otherOwnerId) (jak peaceProposalIsTooEarly)',
  mainSrc.includes("const peaceAtWar = getDiploRelation(meId, otherOwnerId).status === 'wojna';"));
check('main.ts: bramka czasu pokoju nadal to samo źródło (peaceProposalIsTooEarly, akcja pokoj)',
  mainSrc.includes("if (peaceProposalIsTooEarly(fromOwnerId, toOwnerId, 'pokoj')) {"));

console.log(`\nWynik: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
