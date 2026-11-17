'use strict';
/**
 * diplo-respect-military-events-test.cjs — R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRE-Q1
 *
 * Wariant B (decyzja właściciela 2026-11-13): zdarzenie militarne 'wygrana_bitwa' (+5 Respekt,
 * diplomacy.ts) jest podpięte pod silnik: applyMapBattleOutcome -> applyMilitaryWinRespectEvent
 * -> applyDiploEventTracked. Wartości zdarzeń i clamp wojenny NIE są zmieniane.
 *
 * Sekcje:
 *  A. silnik: 'wygrana_bitwa' poza wojną daje +5 Respekt (delta = p.wygraBitwa_respekt)
 *  B. silnik: w wojnie wynik zgodny z clampRelationForWar (Zaufanie do 0, Respekt nietknięty)
 *  C. wiring (main.ts): applyMilitaryWinRespectEvent wołane w applyMapBattleOutcome,
 *     helper zawiera gate „wygrał gracz” i wywołanie applyDiploEventTracked(...,'wygrana_bitwa')
 *  D. wiring: przewaga_militarna / slabszy_militarnie podpięte w turze (R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1)
 *
 * Mutacja: usunięcie linii wywołania w applyMapBattleOutcome czerwieni sekcję C.
 *
 * Run from gra/:  node tools/diplo-respect-military-events-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.respect-military-events-bundle.cjs');
const entryFile = path.resolve(__dirname, '.respect-military-events-entry.ts');
fs.writeFileSync(entryFile, `
export {
  applyDiplomaticEvent, clampRelationForWar, relationScore, WAR_RELATION_SCORE_CAP,
} from '../src/game/diplomacy.ts';
export { DIPLOMACY_PARAMS, militaryWinRespectPair } from '../src/game/diplomacy.ts';
`, 'utf8');

async function main() {
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  });

  const {
    applyDiplomaticEvent, clampRelationForWar, relationScore, WAR_RELATION_SCORE_CAP, DIPLOMACY_PARAMS,
    militaryWinRespectPair,
  } = require(BUNDLE);

  let pass = 0;
  let fail = 0;
  function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

  const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

  // ---- A. silnik poza wojną ----
  console.log('A. silnik: wygrana_bitwa poza wojną');
  const peaceRel = { zaufanie: 40, respekt: 30, status: 'pokoj' };
  const afterWin = applyDiplomaticEvent(peaceRel, 'wygrana_bitwa');
  const dR = afterWin.respekt - peaceRel.respekt;
  ok(dR === DIPLOMACY_PARAMS.wygraBitwa_respekt, `delta Respektu = wygraBitwa_respekt (${DIPLOMACY_PARAMS.wygraBitwa_respekt}), zmierzone ${dR}`);
  ok(afterWin.zaufanie === peaceRel.zaufanie, 'zdarzenie nie zmienia Zaufania (dZ = 0)');
  ok(afterWin.status === 'pokoj', 'status pokój zachowany');

  // ---- B. silnik w wojnie: pomiar clampu ----
  console.log('B. silnik: wojna i clamp (pomiar)');
  const warLow = { zaufanie: 0, respekt: 10, status: 'wojna' };
  const warLowAfter = applyDiplomaticEvent(warLow, 'wygrana_bitwa');
  ok(warLowAfter.respekt === warLow.respekt + DIPLOMACY_PARAMS.wygraBitwa_respekt,
    `wojna, score poniżej capu: pełne +${DIPLOMACY_PARAMS.wygraBitwa_respekt} Respektu (zmierzone ${warLowAfter.respekt - warLow.respekt})`);
  const warHigh = { zaufanie: 60, respekt: 60, status: 'wojna' };
  const warHighAfter = applyDiplomaticEvent(warHigh, 'wygrana_bitwa');
  const scoreAfter = relationScore(warHighAfter);
  ok(warHighAfter.zaufanie === 0 && warHighAfter.respekt === warHigh.respekt + DIPLOMACY_PARAMS.wygraBitwa_respekt,
    `wojna: Zaufanie do 0, Respekt nietknięty (+${DIPLOMACY_PARAMS.wygraBitwa_respekt}, bez limitu 29) (zmierzone Z=${warHighAfter.zaufanie} R=${warHighAfter.respekt})`);
  const clampDirect = clampRelationForWar(warHighAfter);
  ok(JSON.stringify(warHighAfter) === JSON.stringify(clampDirect),
    'wynik zdarzenia w wojnie = clampRelationForWar(wynik zdarzenia) (idempotentny clamp)');
  console.log(`  POMIAR wojna wysoka: przed Z=60 R=60 score=${relationScore(warHigh)}; po Z=${warHighAfter.zaufanie} R=${warHighAfter.respekt} score=${scoreAfter}`);

  // ---- C. wiring main.ts ----
  console.log('C. wiring: applyMilitaryWinRespectEvent w applyMapBattleOutcome');
  const callLine = 'applyMilitaryWinRespectEvent(atkRoster, defRoster, winner);';
  const outcomeStart = mainSrc.indexOf('function applyMapBattleOutcome(');
  const outcomeEnd = mainSrc.indexOf('function applyMapBattleOutcome', outcomeStart + 10);
  ok(outcomeStart > 0, 'znaleziono applyMapBattleOutcome');
  const outcomeBody = mainSrc.slice(outcomeStart, outcomeEnd > 0 ? outcomeEnd : outcomeStart + 4000);
  ok(outcomeBody.includes(callLine), 'applyMapBattleOutcome wywołuje applyMilitaryWinRespectEvent (1 raz)');
  ok(mainSrc.split(callLine).length - 1 === 1, 'wywołanie występuje dokładnie raz w main.ts');
  const helperIdx = mainSrc.indexOf('function applyMilitaryWinRespectEvent(');
  ok(helperIdx > 0, 'helper applyMilitaryWinRespectEvent zdefiniowany w main.ts');
  const helperBody = helperIdx > 0 ? mainSrc.slice(helperIdx, helperIdx + 1200) : '';
  ok(helperBody.includes('militaryWinRespectPair(winner'), 'helper: decyzja przez militaryWinRespectPair (testowana w sekcji E)');
  ok(helperBody.includes("applyDiploEventTracked(winnerOwner, loserOwner, cur, 'wygrana_bitwa')"),
    "helper: applyDiploEventTracked(winnerOwner, loserOwner, cur, 'wygrana_bitwa')");
  ok(helperBody.includes("if (!pair) return;"), 'helper: brak pary → brak zdarzenia');

  // ---- E. zachowanie decyzji „kto dostaje zdarzenie” (czysta funkcja z diplomacy.ts) ----
  console.log('E. zachowanie: militaryWinRespectPair');
  const isH = (id) => id === 1;
  const isB = (id) => id === 9;
  const pAtk = militaryWinRespectPair('atakujacy', 1, 2, isH, isB);
  ok(JSON.stringify(pAtk) === JSON.stringify({ winnerOwner: 1, loserOwner: 2 }), 'gracz atakuje i wygrywa → gracz dostaje zdarzenie (winner=1, loser=2)');
  const pDef = militaryWinRespectPair('obronca', 2, 1, isH, isB);
  ok(JSON.stringify(pDef) === JSON.stringify({ winnerOwner: 1, loserOwner: 2 }), 'gracz broni i wygrywa → gracz dostaje zdarzenie (winner=1, loser=2)');
  ok(militaryWinRespectPair('obronca', 1, 2, isH, isB) === null, 'gracz atakuje, wygrywa AI-obrońca → brak zdarzenia (przegrana gracza)');
  ok(militaryWinRespectPair('atakujacy', 2, 1, isH, isB) === null, 'AI atakuje, wygrywa → brak zdarzenia dla gracza');
  ok(militaryWinRespectPair('remis', 1, 2, isH, isB) === null, 'remis → brak zdarzenia');
  ok(militaryWinRespectPair('atakujacy', 3, 4, isH, isB) === null, 'bitwa AI↔AI → brak zdarzenia');
  ok(militaryWinRespectPair('atakujacy', 1, 9, isH, isB) === null, 'gracz wygrywa z barbarzyńcą → brak zdarzenia');
  ok(militaryWinRespectPair('atakujacy', 1, 1, isH, isB) === null, 'ta sama własność → brak zdarzenia');
  ok(militaryWinRespectPair('atakujacy', undefined, 2, isH, isB) === null, 'brak właściciela atakującego → brak zdarzenia');

  // ---- D. wiring: przewaga/słabszy podpięte (ABC 2026-11-14, próg 50%) ----
  console.log('D. wiring: przewaga_militarna / slabszy_militarnie podpięte w turze (applyMilitaryRespektEdgeTick)');
  const edgeIdx = mainSrc.indexOf('function applyMilitaryRespektEdgeTick(');
  ok(edgeIdx > 0, 'helper applyMilitaryRespektEdgeTick zdefiniowany w main.ts');
  const edgeBody = edgeIdx > 0 ? mainSrc.slice(edgeIdx, edgeIdx + 2000) : '';
  ok(edgeBody.includes("'przewaga_militarna' : 'slabszy_militarnie'"), "helper: wybór zdarzenia 'przewaga_militarna' / 'slabszy_militarnie'");
  ok(edgeBody.includes('respektMilitaryCrossing('), 'helper: decyzja przez respektMilitaryCrossing (testowana w diplo-respect-military-edge-test.cjs)');
  ok(edgeBody.includes('respektPrzewagaStan'), 'helper: stan przejścia zapisany w DiploPairMeta.respektPrzewagaStan');
  const tickIdx = mainSrc.indexOf('function runDiplomacyTurnTick(');
  const tickEnd = tickIdx > 0 ? mainSrc.indexOf('\n    function ', tickIdx + 10) : -1;
  const tickBody = tickIdx > 0 && tickEnd > 0 ? mainSrc.slice(tickIdx, tickEnd) : '';
  ok(tickBody.includes('applyMilitaryRespektEdgeTick();'), 'runDiplomacyTurnTick wywołuje applyMilitaryRespektEdgeTick');
  ok(mainSrc.includes('applyDiploEventTracked(gracz, o, cur, ev)'), 'zdarzenie idzie przez applyDiploEventTracked (zaufanie tempo + factors)');
  ok(edgeBody.includes('respektMilOffset'), 'helper: korekta militarna zapisana w DiploPairMeta.respektMilOffset (obrona r1, zarzut 3)');
  const aiIdx = mainSrc.indexOf('const respektAI = respektZKorektaMilitarna(');
  const aiBody = aiIdx > 0 ? mainSrc.slice(aiIdx, aiIdx + 200) : '';
  ok(aiBody.includes('computeRespekt(potAI, potPlr)') && aiBody.includes('respektMilOffset'), 'pętla AI: Respekt = computeRespekt + respektMilOffset (korekta przeżywa przeliczenie z Mocy)');

  console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
  try { fs.unlinkSync(BUNDLE); fs.unlinkSync(entryFile); } catch { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
