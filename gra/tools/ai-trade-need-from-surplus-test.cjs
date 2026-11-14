'use strict';
/**
 * ai-trade-need-from-surplus-test.cjs — R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 (test behawioralny).
 * Ilosc odbioru AI od gracza wynika z NADWYZKI GRACZA (stock - rezerwa) / tury, a nie ze sztywnego kroku 10.
 * Bramki wyceny w tym tescie przepuszczaja (wyjatek: sekcja D sprawdza, ze bramka nadal odrzuca).
 * Run from gra/: node tools/ai-trade-need-from-surplus-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const bundle = path.resolve(__dirname, '.ai-trade-need-surplus-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-need-surplus-entry.ts');
fs.writeFileSync(entry, "export { selectAiTradeBarter } from '../src/game/ai-trade-proposal.ts';\n");
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const { selectAiTradeBarter } = require(bundle);
let pass = 0;
let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

const RESERVE = 30; // rezerwa zapasu gracza (surplusMultiple x pakiet), jak w ai-trade-proposal-to-player-test
// AI: nadwyzka drewna (krok 10, rezerwa 2000). Gracz: deficyt drewna, nadwyzka zelaza (krok 10) o zadanej wielkosci.
function run(playerSpare, playerSurplus = true, aiNetRate = -10) {
  return selectAiTradeBarter({
    aiResources: [
      { key: 'drewno', stock: 5030, netRate: 0, deficit: false, surplus: true, reserve: 2000 },
      { key: 'zelazo', stock: 0, netRate: aiNetRate, deficit: true, surplus: false, reserve: 0 },
    ],
    playerResources: [
      { key: 'drewno', stock: 0, netRate: -20, deficit: true, surplus: false, reserve: 0 },
      { key: 'zelazo', stock: RESERVE + playerSpare, netRate: 0, deficit: false, surplus: playerSurplus, reserve: RESERVE },
    ],
    turns: 10,
    resolvePayloadPn: () => ({ givePn: 10, receivePn: 10 }),
    fairnessGate: () => true,
    evaluateExactPayload: () => true,
  });
}

console.log('--- A: ilosc odbioru zalezy od nadwyzki gracza (nie stala 10) ---');
const a1000 = run(1000);
const a400 = run(400);
const a100 = run(100);
assert(a1000 && a1000.receiveQty === 100, `A1: nadwyzka 1000 => odbior 100/ture (bylo ${a1000 && a1000.receiveQty})`);
assert(a400 && a400.receiveQty === 40, `A2: nadwyzka 400 => odbior 40/ture (bylo ${a400 && a400.receiveQty})`);
assert(a100 && a100.receiveQty === 10, `A3: nadwyzka 100 => odbior 10/ture (bylo ${a100 && a100.receiveQty})`);
assert(a1000 && a400 && a100 && a1000.receiveQty !== a400.receiveQty && a400.receiveQty !== a100.receiveQty, 'A4: rozne nadwyzki daja rozne ilosci');

console.log('--- B: brak nadwyzki gracza => brak oferty ---');
assert(run(0) === null, 'B1: nadwyzka 0 (stock rowny rezerwie) => brak oferty');
assert(run(1000, false) === null, 'B2: gracz bez flagi surplus => brak oferty');

console.log('--- C: deficyt AI pozostaje warunkiem wejscia ---');
const cNoDeficit = selectAiTradeBarter({
  aiResources: [
    { key: 'drewno', stock: 5030, netRate: 0, deficit: false, surplus: true, reserve: 2000 },
    { key: 'zelazo', stock: 0, netRate: 5, deficit: false, surplus: false, reserve: 0 },
  ],
  playerResources: [
    { key: 'drewno', stock: 0, netRate: -20, deficit: true, surplus: false, reserve: 0 },
    { key: 'zelazo', stock: 1030, netRate: 0, deficit: false, surplus: true, reserve: 30 },
  ],
  turns: 10,
  resolvePayloadPn: () => ({ givePn: 10, receivePn: 10 }),
  fairnessGate: () => true,
  evaluateExactPayload: () => true,
});
assert(cNoDeficit === null, 'C1: AI bez deficytu => brak oferty mimo nadwyzki gracza');

console.log('--- D: bramki wyceny nadal odrzucaja (uczciwosc bez zmian) ---');
const dUnfair = selectAiTradeBarter({
  aiResources: [
    { key: 'drewno', stock: 5030, netRate: 0, deficit: false, surplus: true, reserve: 2000 },
    { key: 'zelazo', stock: 0, netRate: -10, deficit: true, surplus: false, reserve: 0 },
  ],
  playerResources: [
    { key: 'drewno', stock: 0, netRate: -20, deficit: true, surplus: false, reserve: 0 },
    { key: 'zelazo', stock: 1030, netRate: 0, deficit: false, surplus: true, reserve: 30 },
  ],
  turns: 10,
  resolvePayloadPn: () => ({ givePn: 1000, receivePn: 10 }),
  fairnessGate: (g, r) => g <= r,
  evaluateExactPayload: () => true,
});
assert(dUnfair === null, 'D1: pozycja niesprawiedliwa (givePn > receivePn) odrzucona przez bramke');

console.log(`ai-trade-need-from-surplus-test: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
