#!/usr/bin/env node
/**
 * diplo-war-battle-counter-test.cjs — R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1
 *
 * Testy stanu pary: licznik punktów wygranych bitew z bieżącej wojny (osobno dla niższego
 * i wyższego id) oraz czasowy bonus trybutu. Czyste pomocniki z
 * src/game/diplomacy-military-strength.ts + statyczne sprawdzenie podpięcia w src/main.ts.
 * Zachowanie gry bez zmian: żadna decyzja AI/pokoju/UI nie czyta nowych pól (sprawdzone grep).
 *
 * Run from gra/: node tools/diplo-war-battle-counter-test.cjs
 *
 * Przypadki:
 *  (a) bitwa wygrana przez AI w wojnie AI↔AI zapisuje punkty zwycięzcy (po właściwej stronie pary)
 *  (b) bitwa poza wojną nic nie zapisuje
 *  (c) reset przy nowej wojnie (setDiploRelation zeruje licznik przy przejściu w wojnę)
 *  (d) odczyt poza wojną = 0
 *  (e) trybut ustawia bonus na 10 tur (trybutBonusTur) i wygasa; bonus tylko dla pobierającego
 *  (f) stary zapis bez pól wczytuje się jako 0 bitew i brak bonusu; pola przeżywają JSON
 *  (g) mutacja: zapis tylko dla gracza (id 0) czerwieni test; wywołanie w main.ts nie jest
 *      zamknięte bramką isHuman/isMe
 */

'use strict';

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[diplo-war-battle-counter-test] esbuild not found. Run: npm ci --ignore-scripts (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA, 'src/main.ts');
const ENGINE_TS = path.join(GRA, 'src/game/diplomacy-pn-engine.ts');
const ENTRY_FILE = path.join(__dirname, '.diplo-war-battle-counter-entry.ts');
const BUNDLE_FILE = path.join(__dirname, '.diplo-war-battle-counter-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  addWarBattlePoints, resetWarBattlePoints, readWarBattlePoints,
  grantTributeBonus, isTributeBonusActive, loadMilitaryStrengthParams,
  DEFAULT_MILITARY_STRENGTH_PARAMS
} from '../src/game/diplomacy-military-strength';
`, 'utf8');

let mod;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
  mod = require(BUNDLE_FILE);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
}

const {
  addWarBattlePoints, resetWarBattlePoints, readWarBattlePoints,
  grantTributeBonus, isTributeBonusActive, loadMilitaryStrengthParams,
} = mod;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail !== undefined ? ` — ${detail}` : ''}`); }
}

const LOW = 3;
const HIGH = 5;
const PARAMS = loadMilitaryStrengthParams();

// --- (a) bitwa wygrana przez AI w wojnie AI↔AI ---
const base = { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0 };
const aWinHigh = addWarBattlePoints(base, LOW, HIGH, HIGH, 40, true);
check('(a) zwycięzca o wyższym id (AI 5) zapisany w polu wysoki',
  aWinHigh.wojnaBitwyPkt?.wysoki === 40 && aWinHigh.wojnaBitwyPkt?.niski === 0,
  JSON.stringify(aWinHigh.wojnaBitwyPkt));
check('(a) odczyt strony 5 w wojnie = 40', readWarBattlePoints(aWinHigh, HIGH, LOW, HIGH, true) === 40);
check('(a) odczyt strony 3 (przegrany) = 0', readWarBattlePoints(aWinHigh, LOW, LOW, HIGH, true) === 0);
const aWinLow = addWarBattlePoints(aWinHigh, LOW, HIGH, LOW, 15, true);
check('(a) zwycięzca o niższym id (AI 3) dopisuje do niski, nie nadpisuje wysoki',
  aWinLow.wojnaBitwyPkt.niski === 15 && aWinLow.wojnaBitwyPkt.wysoki === 40,
  JSON.stringify(aWinLow.wojnaBitwyPkt));
const aAcc = addWarBattlePoints(aWinLow, LOW, HIGH, HIGH, 10, true);
check('(a) kolejne wygrane sumują się (wysoki 40 + 10 = 50)', aAcc.wojnaBitwyPkt.wysoki === 50);
check('(a) zerowe punkty nic nie zmieniają', addWarBattlePoints(aAcc, LOW, HIGH, HIGH, 0, true) === aAcc);
check('(a) zwycięzca spoza pary nic nie zapisuje', addWarBattlePoints(aAcc, LOW, HIGH, 9, 7, true) === aAcc);

// --- (b) bitwa poza wojną nic nie zapisuje ---
const peace = addWarBattlePoints(base, LOW, HIGH, HIGH, 40, false);
check('(b) poza wojną meta bez zmian (brak wojnaBitwyPkt)', peace === base && peace.wojnaBitwyPkt === undefined);

// --- (c) reset przy nowej wojnie ---
const afterReset = resetWarBattlePoints(aAcc);
check('(c) reset zeruje odczyt obu stron', readWarBattlePoints(afterReset, LOW, LOW, HIGH, true) === 0
  && readWarBattlePoints(afterReset, HIGH, LOW, HIGH, true) === 0);
const newWar = addWarBattlePoints(afterReset, LOW, HIGH, HIGH, 5, true);
check('(c) po resecie nowa wojna liczy od zera (wysoki = 5)', newWar.wojnaBitwyPkt.wysoki === 5 && newWar.wojnaBitwyPkt.niski === 0);

// --- (d) odczyt poza wojną = 0 ---
check('(d) odczyt poza wojną = 0 mimo punktów w meta', readWarBattlePoints(aAcc, HIGH, LOW, HIGH, false) === 0);
check('(d) odczyt bez meta = 0', readWarBattlePoints(undefined, HIGH, LOW, HIGH, true) === 0);
check('(d) odczyt strony spoza pary = 0', readWarBattlePoints(aAcc, 9, LOW, HIGH, true) === 0);

// --- (e) trybut: bonus na 10 tur i wygasa ---
const t5 = grantTributeBonus(base, LOW, 5, PARAMS);
check('(e) trybutBonusTur z JSON = 10', PARAMS.trybutBonusTur === 10, `trybutBonusTur=${PARAMS.trybutBonusTur}`);
check('(e) doTury = tura + 10 = 15', t5.trybutBonus.doTury === 15, JSON.stringify(t5.trybutBonus));
check('(e) bonus aktywny w turze 5 (dzień przyjęcia)', isTributeBonusActive(t5, LOW, 5));
check('(e) bonus aktywny w turze 14 (ostatnia z 10)', isTributeBonusActive(t5, LOW, 14));
check('(e) bonus wygasa w turze 15', !isTributeBonusActive(t5, LOW, 15));
check('(e) bonus nie działa dla płacącego', !isTributeBonusActive(t5, HIGH, 7));
check('(e) bez bonusu = nieaktywny', !isTributeBonusActive(base, LOW, 5));

// --- (f) stary zapis bez pól ---
const oldSave = JSON.parse('{"trustPnGainedThisTurn":2,"dobraWolaRemainingTur":0,"wojnaOdTury":4}');
check('(f) stary zapis: odczyt bitew = 0', readWarBattlePoints(oldSave, LOW, LOW, HIGH, true) === 0
  && readWarBattlePoints(oldSave, HIGH, LOW, HIGH, true) === 0);
check('(f) stary zapis: brak bonusu trybutu', !isTributeBonusActive(oldSave, LOW, 5));
const rt = JSON.parse(JSON.stringify(aAcc));
check('(f) pola przeżywają serializację JSON (round-trip)',
  rt.wojnaBitwyPkt.wysoki === 50 && rt.wojnaBitwyPkt.niski === 15, JSON.stringify(rt.wojnaBitwyPkt));
const rtT = JSON.parse(JSON.stringify(t5));
check('(f) bonus trybutu przeżywa JSON', isTributeBonusActive(rtT, LOW, 6));

// --- (g) mutacja i wiązanie z main.ts ---
function mutatedPlayerOnly(meta, lo, hi, winner, pkt, inWar) {
  if (winner !== 0) return meta; // mutacja: zapis tylko dla gracza (id 0)
  return addWarBattlePoints(meta, lo, hi, winner, pkt, inWar);
}
const mutA = mutatedPlayerOnly(base, LOW, HIGH, HIGH, 40, true);
check('(g) mutacja „tylko gracz” różni się od poprawnego zapisu AI (test czerwieni)',
  readWarBattlePoints(mutA, HIGH, LOW, HIGH, true) !== readWarBattlePoints(aWinHigh, HIGH, LOW, HIGH, true));

const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const callIdx = mainSrc.indexOf('diploRecordWarBattlePoints(winOid, loserOid, pts)');
const window = callIdx > 0 ? mainSrc.slice(Math.max(0, callIdx - 900), callIdx) : '';
check('(g) main.ts: zapis bitwy wołany z bitwy (winOid, loserOid, pts)', callIdx > 0);
check('(g) main.ts: zapis bitwy NIE jest bramkowany isHuman/isMe (wszyscy właściciele)',
  callIdx > 0 && !/if\s*\(\s*(isHuman|isMe)\b[^)]*\)[^;]*\n[^\n]*diploRecordWarBattlePoints/.test(window)
  && !/\(\s*isHuman\s*\(\s*winOid\s*\)\s*\)/.test(window.slice(-300)));
const engineSrc = fs.readFileSync(ENGINE_TS, 'utf8');
check('(g) DiploPairMeta ma pola opcjonalne wojnaBitwyPkt i trybutBonus',
  /wojnaBitwyPkt\?:\s*\{\s*niski:\s*number;\s*wysoki:\s*number\s*\}/.test(engineSrc)
  && /trybutBonus\?:\s*\{\s*dla:\s*number;\s*doTury:\s*number\s*\}/.test(engineSrc));
check('(c) main.ts: setDiploRelation zeruje licznik przy przejściu w wojnę',
  /resetWarBattlePoints\(meta\)/.test(mainSrc));
check('(e) main.ts: przyjęcie trybutu ustawia bonus dla pobierającego (proposerId)',
  /diploGrantTributeBonusFor\(proposerId, responderId\)/.test(mainSrc));

console.log(`\nWynik: ${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
