'use strict';
/**
 * R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1 — realny tik tury (tickDiplomacy) dla zaufania startowego 0:
 * para w wojnie, neutralna i w pokoju; po 1, 3 i 6 turach. Wypisuje tabelę.
 * Obrona r1: dodane (i) wojna z W>0 i W<0 (izolacja guardu `!atWar` w computeTickZaufanieDelta),
 * (ii) licznik kryzysu zaufania = 0 (advanceCrisisCounter) w tej samej kolejnosci co main.ts
 * (tick, potem krok licznika), dla N=6 (profil hamulca) i N=5 (p6.kryzysTurDoWojny w JSON).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.diplo-trust-war-drift-entry.ts');
const bundle = path.resolve(__dirname, '.diplo-trust-war-drift-bundle.cjs');
fs.writeFileSync(entry, `
export { tickDiplomacy, computeTickZaufanieDelta, getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
export { zaufanieDryfOdWiarygodnosci } from '../src/game/diplomacy-credibility.ts';
export { crisisStepForPair } from '../src/game/diplomacy-tick-war-brake.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'silent' });
const B = require(bundle);
let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); } else { fail++; console.error('  FAIL:', msg); }
}

const W_START = 20; // Normalny: wiarygodnoscStartNormalny
function ctxAt(t, wiar) {
  return { turn: t, wiarygodnoscSelf: wiar, aktywnyHandel: false, pokojTrustTier: undefined,
    dobraWolaAktywna: false, wspolnyWrog: false, karaWspolnaGranica: false };
}
function run(status, turns, wiar) {
  let rel = { zaufanie: 0, respekt: 0, status, traktaty: [], urazyHistoryczne: 0 };
  const out = [];
  for (let t = 1; t <= turns; t++) {
    rel = B.tickDiplomacy(rel, ctxAt(t, wiar));
    out.push(rel.zaufanie);
  }
  return out;
}
// Kolejnosc jak main.ts: tickDiplomacy, potem krok licznika kryzysu (diploBrakeCrisisStep).
// Zwraca pierwsza ture, w ktorej warTriggerReady (albo null przez `turns` tur).
function firstWarReadyTurn(status, wiar, n, turns, extra) {
  const p6 = { kryzysProgZaufania: 0, kryzysTurDoWojny: n, kryzysOstrzezenieTurPrzed: 2 };
  let rel = { zaufanie: 0, respekt: 0, status, traktaty: [], urazyHistoryczne: 0 };
  let counter = 0;
  for (let t = 1; t <= turns; t++) {
    rel = B.tickDiplomacy(rel, { ...ctxAt(t, wiar), ...(extra || {}) });
    // crisisStepForPair = dokladnie funkcja wolana przez main.ts diploBrakeCrisisStep (wojna -> 0).
    const step = B.crisisStepForPair(counter, rel.zaufanie, rel.status === 'wojna', p6);
    counter = step.counter;
    if (step.warTriggerReady) return t;
  }
  return null;
}
const war = run('wojna', 6, undefined);
const neu = run('neutralni', 6, W_START);
const pok = run('pokoj', 6, W_START);
const warPos = run('wojna', 6, W_START);
const warNeg = run('wojna', 6, -W_START);
console.log('| scenariusz | po t1 | po t3 | po t6 |');
console.log('|---|---|---|---|');
console.log(`| wojna (W=undefined) | ${war[0]} | ${war[2]} | ${war[5]} |`);
console.log(`| wojna (W=${W_START}) | ${warPos[0]} | ${warPos[2]} | ${warPos[5]} |`);
console.log(`| wojna (W=${-W_START}) | ${warNeg[0]} | ${warNeg[2]} | ${warNeg[5]} |`);
console.log(`| neutralna (W=${W_START}) | ${neu[0].toFixed(2)} | ${neu[2].toFixed(2)} | ${neu[5].toFixed(2)} |`);
console.log(`| pokoj (W=${W_START}) | ${pok[0].toFixed(2)} | ${pok[2].toFixed(2)} | ${pok[5].toFixed(2)} |`);
ok(war[0] === 0 && war[2] === 0 && war[5] === 0, 'wojna: zaufanie 0 po 1/3/6 turach (brak wzrostu)');
ok(B.zaufanieDryfOdWiarygodnosci(W_START) > 0, 'neutralna: dryf W>0 daje wzrost (zgodnie z ustawionym dryfem)');
ok(B.computeTickZaufanieDelta({ turn: 1, wiarygodnoscSelf: W_START }, true) === 0,
  'computeTickZaufanieDelta(atWar=true) z dryfem W=20 = 0');
ok(warPos.every(z => z === 0), 'wojna z W=+20 (dryf dodatni): zaufanie 0 na kazdej z 6 tur');
ok(warNeg.every(z => z === 0), 'wojna z W=-20 (dryf ujemny): zaufanie 0 na kazdej z 6 tur (clamp 0 i clampRelationForWar)');
// Guard `!atWar` (diplomacy.ts computeTickZaufanieDelta) jest jedynym miejscem, ktore chroni PREVIEW/audience
// (main.ts:25888, :29693) przed dryfem w wojnie; tickDiplomacy go nie pokazuje (clamp w wyjsciu).
ok(B.computeTickZaufanieDelta({ turn: 1, wiarygodnoscSelf: -W_START }, true) === 0,
  'computeTickZaufanieDelta(atWar=true, W=-20) = 0 (izoluje guard !atWar)');
ok(B.computeTickZaufanieDelta({ turn: 1, wiarygodnoscSelf: W_START }, true) === 0,
  'computeTickZaufanieDelta(atWar=true, W=+20) = 0 (izoluje guard !atWar)');
const neuTurns = 20;
ok(firstWarReadyTurn('neutralni', W_START, 6, neuTurns) === null,
  `neutralna W=20, N=6: warTriggerReady nigdy w ${neuTurns} turach (dryf zeruje licznik)`);
ok(firstWarReadyTurn('neutralni', 0, 6, 10) === 6, 'neutralna W=0 (zaufanie stale 0), N=6: warTriggerReady w turze 6');
ok(firstWarReadyTurn('neutralni', 0, 5, 10) === 5, 'neutralna W=0, N=5: warTriggerReady w turze 5 (N liczy dokladnie)');
ok(firstWarReadyTurn('wojna', undefined, 6, 10) === null, 'wojna: licznik kryzysu nie rusza (warTriggerReady nigdy)');
// Osiagalnosc przy karze za wspolna granice (min. kara -3/tur, R-WEB-DIPLO-TRUST-NUMBERS-Q1):
const borderMinus3 = { karaWspolnaGranica: true, karaWspolnaGranicaDelta: -3 };
const borderMinus3Dryf = firstWarReadyTurn('neutralni', W_START, 6, 20, borderMinus3);
const borderMinus3Dryf100 = firstWarReadyTurn('neutralni', 100, 6, 20, borderMinus3);
console.log(`  INFO: kara granicy -3 + W=20 (dryf +0,6): warTriggerReady w turze ${borderMinus3Dryf}`);
console.log(`  INFO: kara granicy -3 + W=100 (dryf +3): warTriggerReady w turze ${borderMinus3Dryf100}`);
ok(borderMinus3Dryf === 6, 'neutralna, kara granicy -3, W=20: zaufanie 0 utrzymane, warTriggerReady w turze 6');
ok(borderMinus3Dryf100 === 6, 'neutralna, kara granicy -3, W=100 (dryf +3 = kara, netto 0): zaufanie 0 utrzymane, warTriggerReady w turze 6');
ok(firstWarReadyTurn('neutralni', 100, 6, 20) === null, 'neutralna, W=100, bez innych kar: dryf +3/tura zeruje licznik (brak wojny w 20 turach)');
console.log(`PASS=${pass} FAIL=${fail}`);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
process.exit(fail ? 1 : 0);
