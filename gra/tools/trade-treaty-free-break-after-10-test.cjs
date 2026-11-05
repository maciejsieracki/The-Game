'use strict';
/**
 * trade-treaty-free-break-after-10-test.cjs — R-WEB-TREATY-TRADE-FREE-BREAK-AFTER-10-Q1.
 * Dobrowolne zerwanie UMOWY HANDLOWEJ po >=10 turach od zawarcia jest bez kary
 * (Zaufanie/Wiarygodność, okno N3, N5). Inne traktaty i wiek < 10 — bez zmian.
 * Run: node tools/trade-treaty-free-break-after-10-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.trade-free-break-entry.ts');
const BUNDLE = path.resolve(__dirname, '.trade-free-break-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  previewVoluntaryTreatyBreakPenalties,
  tradeTreatyBreakPenaltyFree,
  tradeTreatyBreakPenaltyTurnsLeft,
  voluntaryTreatyBreakPlan,
  TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS,
  formatDiploPenaltyShort,
} from '../src/game/diplomacy-penalty-preview.ts';
export { applyDiplomaticEvent, DIPLOMACY_PARAMS } from '../src/game/diplomacy.ts';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const {
  previewVoluntaryTreatyBreakPenalties: preview,
  tradeTreatyBreakPenaltyFree: penaltyFree,
  tradeTreatyBreakPenaltyTurnsLeft: turnsLeft,
  voluntaryTreatyBreakPlan: plan,
  TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS: AGE,
  formatDiploPenaltyShort: shortText,
  applyDiplomaticEvent,
  DIPLOMACY_PARAMS,
} = M;

const PARAMS = {
  zlamanaPaktGracz_zaufanie: -40,
  wiarygodnoscN1BezOstrzezenia: -10,
  wiarygodnoscN2ZlamaniePaktuNap: -18,
  wiarygodnoscN2ZlamaniePaktuSojusz: -25,
  wiarygodnoscN3AtakWOknieKarencji: -12,
  wiarygodnoscN3KarencjaBezterminoweTur: 10,
  wiarygodnoscN5ZerwanieTraktatCzasowy: -6,
  wiarygodnoscN5ZerwanieHandelCzasowy: -4,
};

let pass = 0;
let fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); }
}

const TURN = 100;
const trade = (age, wygasaTura) => ({
  id: 't', rodzaj: 'umowa_handlowa', strony: [0, 1],
  wygasaTura: wygasaTura === undefined ? TURN + 20 : wygasaTura,
  zawartaTura: age === undefined ? undefined : TURN - age,
});
const pact = (age, wygasaTura) => ({
  id: 'n', rodzaj: 'pakt_nieagresji', strony: [0, 1],
  wygasaTura: wygasaTura === undefined ? TURN + 20 : wygasaTura,
  zawartaTura: age === undefined ? undefined : TURN - age,
});

ok(AGE === 10, 'stała progu = 10 tur');

// --- wiek 9: kary jak dziś ---
const t9 = preview(trade(9), PARAMS, TURN);
ok(t9.wiarygodnoscTotal === -4 && t9.zaufanieTotal === -10, 'handel czasowy wiek 9: W −4 Z −10');
ok(!penaltyFree(trade(9), TURN), 'handel wiek 9: nie jest bez kary');
ok(turnsLeft(trade(9), TURN) === 1, 'handel wiek 9: została 1 tura kary');
ok(shortText(t9).includes('kara jeszcze 1 tura'), 'UI wiek 9: tekst „kara jeszcze 1 tura”');

// --- wiek 10: brak kar (terminowy) ---
const t10 = preview(trade(10), PARAMS, TURN);
ok(t10.wiarygodnoscTotal === 0 && t10.zaufanieTotal === 0, 'handel terminowy wiek 10: brak kar W/Z');
ok(penaltyFree(trade(10), TURN), 'handel wiek 10: bez kary');
ok(shortText(t10) === 'brak kary — umowa handlowa zawarta 10 tur temu lub wcześniej', 'UI wiek 10: tekst „brak kary”');

// --- wiek 10 bezterminowy: brak kar i brak okna N3 (preview) ---
const tb10 = preview(trade(10, null), PARAMS, TURN);
ok(tb10.wiarygodnoscTotal === 0 && tb10.zaufanieTotal === 0, 'handel bezterminowy wiek 10: brak kar');
ok(tb10.lines.every(l => l.kind === 'info'), 'handel bezterminowy wiek 10: tylko informacja, bez N3/N5');

// --- wiek 9 bezterminowy: dawne zachowanie (info N3 + brak kar W, Z −10) ---
const tb9 = preview(trade(9, null), PARAMS, TURN);
ok(tb9.wiarygodnoscTotal === 0 && tb9.zaufanieTotal === -10, 'handel bezterminowy wiek 9: jak dziś (Z −10)');
ok(tb9.lines.some(l => l.reason.includes('karencji') || l.reason.includes('N3') || l.reason.includes('Wiarygodności')), 'handel bezterminowy wiek 9: info o oknie N3 zachowane');

// --- wiek nieznany (stary zapis): kary jak dziś ---
const tu = preview(trade(undefined), PARAMS, TURN);
ok(tu.wiarygodnoscTotal === -4 && tu.zaufanieTotal === -10, 'wiek nieznany: kary jak dziś');
ok(!penaltyFree(trade(undefined), TURN), 'wiek nieznany: nie jest bez kary');
const tNoTurn = preview(trade(10), PARAMS);
ok(tNoTurn.zaufanieTotal === -10, 'brak bieżącej tury w podglądzie: kary jak dziś (wsteczna zgodność)');

// --- inne traktaty bez zmian ---
const p10 = preview(pact(10), PARAMS, TURN);
ok(p10.wiarygodnoscTotal === -6 && p10.zaufanieTotal === -15, 'pakt o nieagresji wiek 10: nadal W −6 Z −15');
ok(!penaltyFree(pact(10), TURN), 'pakt wiek 10: nie jest bez kary');
ok(turnsLeft(pact(9), TURN) === undefined, 'pakt: brak licznika tur kary');
const pNull = preview(pact(10, null), PARAMS, TURN);
ok(pNull.wiarygodnoscTotal === 0 && pNull.zaufanieTotal === -15, 'pakt bezterminowy: Z −15 bez zmian (wiek nie zwalnia)');

// --- plan skutków zerwania (wspólny dla gracza i AI; brak parametru właściciela) ---
const pT10 = plan(trade(10), TURN);
ok(pT10.penaltyFree && !pT10.openN3Window && !pT10.n5Charged, 'plan terminowy wiek 10: bez N3, bez N5');
const pB10 = plan(trade(10, null), TURN);
ok(pB10.penaltyFree && !pB10.openN3Window && !pB10.n5Charged, 'plan bezterminowy wiek 10: bez okna N3, bez N5');
const pB9 = plan(trade(9, null), TURN);
ok(!pB9.penaltyFree && pB9.openN3Window && !pB9.n5Charged, 'plan bezterminowy wiek 9: okno N3 jak dziś');
const pT9 = plan(trade(9), TURN);
ok(!pT9.penaltyFree && !pT9.openN3Window && pT9.n5Charged, 'plan terminowy wiek 9: N5 jak dziś');
const pTU = plan(trade(undefined), TURN);
ok(!pTU.penaltyFree && pTU.n5Charged, 'plan wiek nieznany: N5 jak dziś');
const pP10 = plan(pact(10), TURN);
ok(!pP10.penaltyFree && pP10.n5Charged, 'plan pakt wiek 10: N5 bez zmian');
const pPB10 = plan(pact(10, null), TURN);
ok(!pPB10.penaltyFree && pPB10.openN3Window && !pPB10.n5Charged, 'plan pakt bezterminowy wiek 10: okno N3 bez zmian');

// --- skutek na relację (efekt zdarzenia wybrany przez wiring): wiek 10 → Z bez zmian ---
const rel = { status: 'pokoj', zaufanie: 50, respekt: 50 };
const relFree = applyDiplomaticEvent(rel, 'zerwanie_handlu_bez_kary', DIPLOMACY_PARAMS, undefined);
ok(relFree.zaufanie === 50 && relFree.respekt === 50, 'zdarzenie zerwanie_handlu_bez_kary: brak zmiany Z/R');
const relTrade = applyDiplomaticEvent(rel, 'zerwanie_handlu', DIPLOMACY_PARAMS, undefined);
ok(relTrade.zaufanie === 40, 'zdarzenie zerwanie_handlu (wiek < 10): Z −10 bez zmian');

// --- wiring w main.ts: breakTreatyVoluntarily sterowana planem, nie lokalnym warunkiem ---
const src = fs.readFileSync(path.join(ROOT, 'src', 'main.ts'), 'utf8');
const fnStart = src.indexOf('function breakTreatyVoluntarily(');
const fnBody = src.slice(fnStart, src.indexOf('function activeTreatiesForPair(', fnStart));
ok(fnStart > 0, 'breakTreatyVoluntarily znaleziona w main.ts');
ok(/const breakPlan = voluntaryTreatyBreakPlan\(deal, turn\)/.test(fnBody), 'silnik zerwania liczy plan z tury bieżącej');
ok(/if \(breakPlan\.openN3Window\)\s*\{[\s\S]*setDiploPairMeta/.test(fnBody), 'silnik: okno N3 tylko gdy plan.openN3Window');
ok(/else if \(breakPlan\.n5Charged\)\s*\{[\s\S]*appendWiarygodnoscEvent/.test(fnBody), 'silnik: N5 tylko gdy plan.n5Charged');
ok(fnBody.includes("'zerwanie_handlu_bez_kary' as const"), 'silnik: zdarzenie bez kary dla wieku ≥ 10');

// --- UI: oba miejsca przekazują bieżącą turę (sprawdzenie wprost, nie tautologia) ---
function bodyOf(name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return '';
  const j = src.indexOf('\n    }', i);
  return src.slice(i, j < 0 ? i + 400 : j);
}
const labelBody = bodyOf('treatyBreakPenaltyLabel');
const previewBody = bodyOf('buildBreakTreatyPenaltyPreview');
ok(/previewVoluntaryTreatyBreakPenalties\(deal, _diplomacyParams\(\), turn\)/.test(labelBody),
  'UI: treatyBreakPenaltyLabel przekazuje turn');
ok(/previewVoluntaryTreatyBreakPenalties\(deal, _diplomacyParams\(\), turn\)/.test(previewBody),
  'UI: buildBreakTreatyPenaltyPreview przekazuje turn');

console.log(`\ntrade-treaty-free-break-after-10: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
process.exit(fail > 0 ? 1 : 0);
