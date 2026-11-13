'use strict';
/**
 * R-WEB-DIPLO-TRUST-NUMBERS-Q1 — liczby zaufania:
 * (a) rozejm ustawia zaufanie 10; (b) pokój ustawia 20; (c) rozejm→pokój: 20;
 * (d) kara za sąsiedztwo −3/−4/−5 (Kamień/Brąz/Żelazo); (e) w karencji kara = 0, po karencji wraca;
 * (f) wspólna i odmienna religia dają zmianę zaufania 0; (g) mutacja (stare liczby / religia) czerwieni test.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.diplo-trust-numbers-entry.ts');
const bundle = path.resolve(__dirname, '.diplo-trust-numbers-bundle.cjs');
fs.writeFileSync(entry, `
export { DIPLOMACY_PARAMS, getEffectiveDiplomacyParams, sharedBorderPenaltyForEpochs, computeTickZaufanieDelta, tickDiplomacy, applyDiplomaticEvent } from '../src/game/diplomacy.ts';
export { buildRelationBreakdown } from '../src/game/diplomacy-factors.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'silent' });
const B = require(bundle);
const MAIN = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
const DIPLO = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'diplomacy.ts'), 'utf8');
const FACTORS = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'diplomacy-factors.ts'), 'utf8');
const LOCK = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'diplomacy-peace-lock.ts'), 'utf8');
const JSON_DATA = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'diplomacy.json'), 'utf8'));
let pass = 0;
let fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  OK:', msg); } else { fail++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { ok(a === b, `${msg} (got ${a}, want ${b})`); }
const params = B.getEffectiveDiplomacyParams('normal');

// (a)(b) wartości ustawień zaufania w parametrach i w JSON
eq(params.rozejm_zaufanie_ustawienie, 10, '(a) rozejm ustawia zaufanie 10 (params)');
eq(params.pokoj_zaufanie_ustawienie, 20, '(b) pokój ustawia zaufanie 20 (params)');
eq(JSON_DATA.params.rozejm_zaufanie_ustawienie, 10, '(a) rozejm 10 w diplomacy.json');
eq(JSON_DATA.params.pokoj_zaufanie_ustawienie, 20, '(b) pokój 20 w diplomacy.json');

// (a)(b)(c) wiring: finalizacja pokoju/rozejmu ustawia zaufanie ustawieniem (rozejm→pokój = 20)
const finStart = MAIN.indexOf('function finalizePeaceTreatyBetween(');
const fin = MAIN.slice(finStart, finStart + 4000);
ok(/const trustSetpoint = isTruce\s*\?\s*_diplomacyParams\(\)\.rozejm_zaufanie_ustawienie\s*:\s*_diplomacyParams\(\)\.pokoj_zaufanie_ustawienie/.test(fin),
  '(a)(b)(c) finalize wybiera 10 dla rozejmu, 20 dla pokoju (rozejm→pokój = pokój = 20)');
ok(/zaufanie: trustSetpoint/.test(fin), '(a)(b) finalize zapisuje zaufanie ustawieniem');

// (d) kara za sąsiedztwo −3/−4/−5 w Kamieniu/Brązie/Żelazie
eq(B.sharedBorderPenaltyForEpochs(1, 1, params), -3, '(d) Kamień: −3');
eq(B.sharedBorderPenaltyForEpochs(2, 2, params), -4, '(d) Brąz: −4');
eq(B.sharedBorderPenaltyForEpochs(3, 3, params), -5, '(d) Żelazo: −5');
eq(B.computeTickZaufanieDelta({ turn: 1, karaWspolnaGranica: true, karaWspolnaGranicaDelta: B.sharedBorderPenaltyForEpochs(3, 3, params) }, false), -5,
  '(d) tick: Żelazo kara −5 zaufania na turę');

// (e) karencja: kara = 0 w ctx, po karencji wraca; wiring z isPeaceLockedBetween/isTruceActive
eq(B.computeTickZaufanieDelta({ turn: 1, karaWspolnaGranica: true, karaWspolnaGranicaDelta: 0 }, false), 0,
  '(e) w karencji kara = 0');
eq(B.computeTickZaufanieDelta({ turn: 1, karaWspolnaGranica: true, karaWspolnaGranicaDelta: -4 }, false), -4,
  '(e) po karencji kara wraca (−4 Brąz)');
ok(/karaWspolnaGranicaDelta: \(isPeaceLockedBetween\(a, b\)\s*\|\|\s*isTruceActive\(getDiploPairMeta\(a, b\)\.truceUntilTurn, turn\)\)\s*\?\s*0\s*:\s*sharedBorderPenaltyForEpochs\(/.test(MAIN),
  '(e) main: kara = 0 gdy para w karencji pokoju lub aktywnym rozejmie');
ok(/export function isTruceActive\(until: number \| null \| undefined, currentTurn: number\)/.test(LOCK),
  '(e) isTruceActive zdefiniowany w diplomacy-peace-lock.ts');

// (f) religia nie zmienia zaufania; brak wiersza religii w UI
eq(B.computeTickZaufanieDelta({ turn: 1, wspolnaReligia: true, odmiennaReligia: false }, false), 0, '(f) wspólna religia: zmiana zaufania 0');
eq(B.computeTickZaufanieDelta({ turn: 1, wspolnaReligia: false, odmiennaReligia: true }, false), 0, '(f) odmienna religia: zmiana zaufania 0');
const brk = B.buildRelationBreakdown([], { wspolnaReligia: true, odmiennaReligia: true }, params);
ok(!brk.pozytywne.concat(brk.negatywne).some(r => /religi/i.test(r.label)), '(f) brak wierszy religii w czynnikach UI');
ok(!/if \(ctx\.wspolnaReligia\)|if \(ctx\.odmiennaReligia\)/.test(DIPLO), '(f) computeTickZaufanieDelta nie czyta religii');
ok(!/continuous\.wspolnaReligia|continuous\.odmiennaReligia/.test(FACTORS), '(f) diplomacy-factors nie pokazuje religii');

// (g) mutacja: stare liczby i stary model pokoju (+5 jako zaufanie) czerwienią asercje powyżej
ok(B.sharedBorderPenaltyForEpochs(1, 1, params) !== -2, '(g) mutacja: stare −2 odrzucone');
ok(params.pokoj_zaufanie_ustawienie !== 25 && params.rozejm_zaufanie_ustawienie !== 0, '(g) mutacja: brak starego modelu (pokój +5, rozejm 0)');

console.log(`\n[diplo-trust-numbers-test] ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
