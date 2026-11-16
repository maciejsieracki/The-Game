'use strict';
/**
 * end-turn-hint-diplo-audience-test.cjs — R-WEB-UI-END-TURN-HINT-DIPLO-AUDIENCE-TEXT-Q1.
 *
 * Podpowiedź przy zablokowanym „Zakończ turę” (hintEndTurnBlocked w gra/src/main.ts) ma
 * wskazywać właściwy modal blokujący. Sprawdza (na źródle main.ts, bez przeglądarki):
 *  (a) gałęzie modali (audiencja dyplomatyczna, panel łączenia armii, karta odkrycia
 *      technologii) są w hintEndTurnBlocked PRZED gałęzią „ekran bitwy" (isPreBattleOpen /
 *      hasPendingAutoPreBattle), każda z własnym komunikatem po polsku;
 *  (b) gałąź „Zakończ ekran bitwy…" zostaje, z tym samym tekstem, i nie jest wcześniejsza niż modale;
 *  (c) w treściach komunikatów nie ma surowych ID ani angielskich słów;
 *  (d) mutacja na KOPII źródła (usunięcie gałęzi audiencji) MUSI dać błąd — dowód, że test łapie regresję.
 *
 * Run: node tools/end-turn-hint-diplo-audience-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN = path.resolve(GRA_ROOT, 'src', 'main.ts');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const MODAL_MSGS = {
  isDiplomacyAudienceOpen: 'Zamknij okno audiencji dyplomatycznej, potem zakończ turę.',
  isArmyMergePanelOpen: 'Zamknij panel łączenia armii, potem zakończ turę.',
  isTechDiscoveryNoticeOpen: 'Zamknij kartę odkrycia technologii, potem zakończ turę.',
};
const BATTLE_MSG = 'Zakończ ekran bitwy, potem zakończ turę.';

// Wycina ciało hintEndTurnBlocked po dopasowaniu nawiasów klamrowych.
function bodyOf(src) {
  const start = src.indexOf('function hintEndTurnBlocked(): void {');
  if (start < 0) return null;
  let i = src.indexOf('{', start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

// Zwraca null gdy coś nie tak; w przeciwnym razie listę błędów (pusta = OK).
function check(src) {
  const errs = [];
  const body = bodyOf(src);
  if (!body) { errs.push('brak hintEndTurnBlocked'); return errs; }

  const battleIdx = body.indexOf('isPreBattleOpen() || hasPendingAutoPreBattle()');
  if (battleIdx < 0) errs.push('brak gałęzi ekranu bitwy');
  if (!body.includes(BATTLE_MSG)) errs.push('brak komunikatu ekranu bitwy');

  for (const [pred, msg] of Object.entries(MODAL_MSGS)) {
    const idx = body.indexOf(`if (${pred}())`);
    if (idx < 0) { errs.push(`brak gałęzi modala ${pred}`); continue; }
    if (battleIdx >= 0 && idx > battleIdx) errs.push(`gałąź ${pred} nie jest przed gałęzią bitwy`);
    if (!body.includes(`'${msg}'`)) errs.push(`brak komunikatu dla ${pred}`);
  }
  return errs;
}

// (c) audyt treści: brak surowych ID (wielkie litery/podkreślenia) i typowych angielskich słów.
const EN_WORDS = ['the', 'and', 'with', 'for', 'turn', 'battle', 'modal', 'close', 'open', 'end', 'hint', 'card', 'window', 'blocked'];
function auditTexts() {
  const bad = [];
  for (const t of [...Object.values(MODAL_MSGS), BATTLE_MSG]) {
    const words = t.toLowerCase().split(/[\s,.;:!?]+/).filter(Boolean);
    const en = words.filter((w) => EN_WORDS.includes(w));
    if (en.length) bad.push(`${t}: ${en.join(',')}`);
    if (/[_]|\b[A-Z]{2,}\b/.test(t)) bad.push(`ID w: ${t}`);
  }
  return bad;
}

const src = fs.readFileSync(MAIN, 'utf8');

const realErrs = check(src);
ok(realErrs.length === 0, 'źródło: ' + realErrs.join('; '));
const audit = auditTexts();
ok(audit.length === 0, 'audyt polszczyzny: ' + audit.join('; '));

// (d) mutacja na kopii: wycięcie gałęzi audiencji -> test MUSI wykryć.
const mutAudience = src.replace(
  "if (isDiplomacyAudienceOpen()) {\n        showHintMessage('Zamknij okno audiencji dyplomatycznej, potem zakończ turę.', 3500);\n        return;\n      }\n",
  '',
);
ok(mutAudience !== src, 'mutacja audiencji: wzorzec nie trafił');
ok(check(mutAudience).length > 0, 'mutacja (usunięcie gałęzi audiencji) NIE wykryta');

// Mutacja kolejności: gałąź audiencji przeniesiona ZA gałąź bitwy -> test MUSI wykryć.
const audBlock = "if (isDiplomacyAudienceOpen()) {\n        showHintMessage('Zamknij okno audiencji dyplomatycznej, potem zakończ turę.', 3500);\n        return;\n      }\n";
const battleBlock = "if (isPreBattleOpen() || hasPendingAutoPreBattle()) {\n        showHintMessage('Zakończ ekran bitwy, potem zakończ turę.', 3500);\n        return;\n      }\n";
ok(src.includes(audBlock) && src.includes(battleBlock), 'mutacja kolejności: wzorce nie trafiły');
const mutOrder = src.replace(audBlock, '').replace(battleBlock, battleBlock + audBlock);
ok(check(mutOrder).length > 0, 'mutacja kolejności (modal po bitwie) NIE wykryta');

console.log(`end-turn-hint-diplo-audience-test: passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
