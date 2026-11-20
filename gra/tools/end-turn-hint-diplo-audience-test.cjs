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
 *  (e) WYKONANIE: ciało hintEndTurnBlocked uruchomione (new Function) z podstawionym stanem; każdy
 *      wariant (audiencja / panel armii / karta techu / ekran bitwy / bitwa w kolejce / pierwszeństwo modala)
 *      daje oczekiwany komunikat; brak zmiennej wolnej = błąd = FAIL.
 *  (f) mutacje WYKONAWCZE (usunięcie gałęzi audiencji, przestawienie kolejności) muszą zmienić wynik.
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

// (e) WYKONANIE: ciało hintEndTurnBlocked uruchamiane z podstawionym stanem (bez przeglądarki).
// Każda zmienna wolna jest podawana jawnie; brak jednej = ReferenceError = FAIL (nie cicha luka).
const HINT_DEPS = {
  playtestWalkaActive: false,
  isAwaitingFirstPlayerCity: () => false,
  nnsGateForPlayer: () => ({ blokada: false, komunikat: '' }),
  noteEndTurnBlockedByNns: () => {},
  isDiplomacyAudienceOpen: () => false,
  isArmyMergePanelOpen: () => false,
  isTechDiscoveryNoticeOpen: () => false,
  isPreBattleOpen: () => false,
  hasPendingAutoPreBattle: () => false,
  hasBlockingAiTradeOfferForPlayer: () => false,
  gameOver: false,
  endTurnInProgress: false,
  aiTurnAwaitingBattle: false,
  aiCmdResume: null,
  // R-WEB-TEST-DEBT-Q13 r5: PENDING-FORCED-PEACE-Q1 -- hintEndTurnBlocked czyta liste wiszacych pokojow wymuszonych
  // (pusta = brak blokady; ta galaz nie jest przedmiotem tego testu) oraz ja przycina (prunePendingForcedPeace).
  pendingForcedPeaceTreaties: [],
  prunePendingForcedPeace: () => {},
};

// Zwraca { err, last } – ostatni komunikat podpowiedzi albo błąd wykonania.
function runHint(body, state) {
  const shown = [];
  const depNames = Object.keys(HINT_DEPS);
  const code = body.replace('function hintEndTurnBlocked(): void {', 'function hintEndTurnBlocked() {')
    + '\nreturn hintEndTurnBlocked;';
  let fn;
  try {
    const make = new Function(...depNames, 'showHintMessage', code);
    const env = Object.assign({}, HINT_DEPS, state);
    fn = make(...depNames.map((n) => env[n]), (m) => shown.push(m));
  } catch (e) {
    return { err: 'kompilacja: ' + e.message, last: undefined };
  }
  try { fn(); } catch (e) { return { err: e.message, last: undefined }; }
  return { err: null, last: shown[shown.length - 1] };
}

const yes = () => true;
const AUD = MODAL_MSGS.isDiplomacyAudienceOpen;
const ARM = MODAL_MSGS.isArmyMergePanelOpen;
const TECH = MODAL_MSGS.isTechDiscoveryNoticeOpen;
const cases = [
  ['audiencja otwarta', { isDiplomacyAudienceOpen: yes }, AUD],
  ['panel łączenia armii otwarty', { isArmyMergePanelOpen: yes }, ARM],
  ['karta odkrycia techu otwarta', { isTechDiscoveryNoticeOpen: yes }, TECH],
  ['ekran bitwy otwarty', { isPreBattleOpen: yes }, BATTLE_MSG],
  ['bitwa czeka w kolejce (bez modala)', { hasPendingAutoPreBattle: yes }, BATTLE_MSG],
  ['audiencja + ekran bitwy: modal pierwszy', { isDiplomacyAudienceOpen: yes, isPreBattleOpen: yes }, AUD],
  ['karta techu + bitwa w kolejce: modal pierwszy', { isTechDiscoveryNoticeOpen: yes, hasPendingAutoPreBattle: yes }, TECH],
];
const bodyNow = bodyOf(src);
for (const [label, state, want] of cases) {
  const r = runHint(bodyNow, state);
  ok(r.err === null && r.last === want,
    `wykonanie (${label}): oczekiwano „${want}”, jest „${r.last}”${r.err ? ' błąd: ' + r.err : ''}`);
}

// (f) mutacje WYKONAWCZE: zmutowane ciało MUSI dać inny wynik niż prawdziwe.
ok(bodyNow.includes(audBlock) && bodyNow.includes(battleBlock), 'mutacja wykonawcza: wzorce nie trafiły');
const rMutAud = runHint(bodyNow.replace(audBlock, ''), { isDiplomacyAudienceOpen: yes });
ok(rMutAud.last !== AUD, 'mutacja wykonawcza (bez gałęzi audiencji) NIE wykryta');
const rMutOrd = runHint(bodyNow.replace(audBlock, '').replace(battleBlock, battleBlock + audBlock),
  { isDiplomacyAudienceOpen: yes, isPreBattleOpen: yes });
ok(rMutOrd.last !== AUD, 'mutacja wykonawcza (modal po bitwie) NIE wykryta');

console.log(`end-turn-hint-diplo-audience-test: passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
