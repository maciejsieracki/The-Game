'use strict';
/**
 * ai-trade-offer-frequency-up-test.cjs — R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 (r3, O1 parytet wyceny).
 *
 * Regresja: wymiana cykliczna AI->gracz musi byc wyceniana TYMI SAMYMI opcjami przy wejsciu na stol
 * (enqueue, trim, bramka uczciwosci, podglad) co przy wyborze pary (pickAiPlayerCyclicBarter).
 * Pomiar r3 (MEAS_ECON, 3 ziarna): enqGive = pickGive / turnsMultiplier (10x mniej) — bez mnoznika tur.
 *
 * Trzy czesci:
 *  A) zachowanie silnika: ten sam payload per_turn daje PN x turnsMultiplier; opcje z mnoznikiem = wybor pary;
 *  B) strazbnik zrodla: gałąź enqueue dla 'zaproponuj_wymiane_cykliczna' uzywa pnCyclicOpts (z mnoznikiem
 *     tur i tempoGry) w trimie, filtrze bilansu i bramce givePn > receivePn;
 *  C) dane bez zmian w tej rundzie: cooldown odrzucenia i propozycji (15) — r3 nie zmienia wartosci.
 *
 * Run from gra/: node tools/ai-trade-offer-frequency-up-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.resolve(__dirname, '.ai-trade-offer-up-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-offer-up-entry.ts');
fs.writeFileSync(entry, `
export { resolveProposalPn, proposalPnTurnsMultiplier } from '../src/game/diplomacy-pn-engine.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const { resolveProposalPn, proposalPnTurnsMultiplier } = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(c, m) {
  if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); }
}

console.log('A) zachowanie silnika: wycena per_turn z mnoznikiem tur = wybor pary');
const turns = 10;
const payload = {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 20 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'zelazo', ilosc: 5 }],
  resourceTradeMode: 'per_turn',
  turns,
  exchangeDurationTurns: turns,
};
const base = { difficulty: 'normal', proposerOwnerId: 1, playerOwnerId: 0, actionId: 'handel', tempoGry: 'standardowa' };
const withoutMult = resolveProposalPn(payload, base);
const withMult = resolveProposalPn(payload, { ...base, ...proposalPnTurnsMultiplier(payload) });
assert(proposalPnTurnsMultiplier(payload).turnsMultiplier === turns, 'mnoznik tur dla per_turn = turns');
assert(withMult.givePn > withoutMult.givePn, `z mnoznikiem give PN rosnie (${withoutMult.givePn} -> ${withMult.givePn})`);
assert(withMult.givePn > 0 && Math.abs(withMult.givePn - withoutMult.givePn * turns) <= turns, 'give PN z mnoznikiem ~ turns x bez mnoznika (wycena liniowa w turach)');

console.log('B) strazbnik zrodla: parytet wyceny wymiany cyklicznej w main.ts');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const defM = /const pnCyclicOpts = workingCmd\.type === 'zaproponuj_wymiane_cykliczna'([\s\S]*?): pnBalanceOpts;/.exec(mainSrc);
assert(!!defM, 'main.ts definiuje pnCyclicOpts dla zaproponuj_wymiane_cykliczna');
const defBody = defM ? defM[1] : '';
assert(/proposalPnTurnsMultiplier\(clampedPayload\)/.test(defBody), 'pnCyclicOpts zawiera mnoznik tur (proposalPnTurnsMultiplier)');
assert(/tempoGry:\s*player\.tempoGry/.test(defBody), 'pnCyclicOpts zawiera tempoGry gracza');
assert(/const balancedPayload = workingCmd\.type === 'zaproponuj_wymiane_cykliczna'\s*\?\s*clampedPayload/.test(mainSrc), 'wymiana cykliczna nie przechodzi trimu po wyborze pary (payload = wybrany)');
assert(/aiProposalPlayerBenefitSurplus\(balancedPayload, relationTotal\(relForBalance\), pnCyclicOpts\)/.test(mainSrc), 'filtr bilansu PW uzywa pnCyclicOpts');
assert(/const \{ givePn, receivePn \} = resolveProposalPn\(balancedPayload, pnCyclicOpts\);/.test(mainSrc), 'bramka wejscia na stol (givePn/receivePn) uzywa pnCyclicOpts');
assert(!/const \{ givePn, receivePn \} = resolveProposalPn\(balancedPayload, pnBalanceOpts\);/.test(mainSrc), 'brak starej bramki na pnBalanceOpts dla wymiany cyklicznej');
assert(/evaluateExactPayload:[\s\S]*?payloadKeepsRealResourcesForPick\(ownerId, payload\)/.test(mainSrc), 'wybor pary (evaluateExactPayload) wymaga, by clamp do realnych zasobow nie zmienial koszyka');

console.log('C) dane bez zmian w tej rundzie (cooldown propozycji i odrzucenia = 15)');
const params = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'ai-params.json'), 'utf8'));
const cd = params.propozycja_wymiany_surowcow_cooldown_tur && params.propozycja_wymiany_surowcow_cooldown_tur.wartosc;
assert(cd === 15, `propozycja_wymiany_surowcow_cooldown_tur = 15 (jest ${cd})`);

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
fs.rmSync(BUNDLE, { force: true });
fs.rmSync(entry, { force: true });
process.exit(fail === 0 ? 0 : 1);
