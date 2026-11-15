'use strict';
/**
 * ai-trade-offer-min-one-block-test.cjs — R-WEB-AI-TRADE-OFFER-MIN-ONE-BLOCK-Q1.
 * Najmniejsza oferta AI przy małej potrzebie = JEDEN blok epoki umowy (Kamień 10 / Brąz 50 /
 * Żelazo 100 szt.), a nie 3 bloki. Limit 3x potrzeby działa powyżej jednego bloku.
 * Run from gra/: node tools/ai-trade-offer-min-one-block-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const BUNDLE = path.resolve(__dirname, '.ai-trade-min-one-block-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-min-one-block-entry.ts');
fs.writeFileSync(entry, `
export { selectAiTradeBarter } from '../src/game/ai-trade-proposal.ts';
export { diplomacyHandelSurowiecKrok } from '../src/game/diplomacy-value-catalog.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const mod = require(BUNDLE);
fs.rmSync(BUNDLE, { force: true });
fs.rmSync(entry, { force: true });
let pass = 0;
let fail = 0;
function assert(c, m) {
  if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); }
}

// Gracz ma deficyt wegla (AI ma nadwyzke), AI ma deficyt drewna (gracz ma nadwyzke = playerSurplus).
function scenario({ era, need, playerSurplus, gate = () => true }) {
  return mod.selectAiTradeBarter({
    aiResources: [
      { key: 'wegiel', stock: 1e6, netRate: 0, deficit: false, surplus: true, reserve: 0 },
      { key: 'drewno', stock: 0, netRate: -need, deficit: true, surplus: false, reserve: 0 },
    ],
    playerResources: [
      { key: 'wegiel', stock: 0, netRate: -1, deficit: true, surplus: false, reserve: 0 },
      { key: 'drewno', stock: playerSurplus, netRate: 0, deficit: false, surplus: true, reserve: 0 },
    ],
    turns: 1,
    tradeEra: era,
    fairnessGate: (g, r) => gate(g, r),
    resolvePayloadPn: p => ({ givePn: p.giveItems[0].ilosc, receivePn: p.receiveItems[0].ilosc }),
    evaluateExactPayload: () => true,
  });
}

const KROK = { 1: 10, 2: 50, 3: 100 };
console.log('--- A: maly need (5/turę), duza nadwyzka gracza -> oferta = 1 blok epoki ---');
for (const era of [1, 2, 3]) {
  const r = scenario({ era, need: 5, playerSurplus: 300 });
  assert(mod.diplomacyHandelSurowiecKrok('drewno', era) === KROK[era], 'A0 era ' + era + ': krok bloku = ' + KROK[era]);
  assert(r !== null && r.receiveQty === KROK[era], 'A' + era + ': receiveQty = ' + KROK[era] + ' (1 blok), bylo ' + (r && r.receiveQty));
}
console.log('--- B: duza potrzeba (200/turę, Brąz) -> cap 3x = 600 bez regresji ---');
{
  const r = scenario({ era: 2, need: 200, playerSurplus: 5000 });
  assert(r !== null && r.receiveQty === 600, 'B1: receiveQty = 600 (3 x 200), bylo ' + (r && r.receiveQty));
}
console.log('--- C: potrzeba 60/turę (Brąz): 3x = 180 -> 3 pełne bloki = 150 ---');
{
  const r = scenario({ era: 2, need: 60, playerSurplus: 5000 });
  assert(r !== null && r.receiveQty === 150, 'C1: receiveQty = 150, bylo ' + (r && r.receiveQty));
}
console.log('--- D: nadwyzka gracza < 1 blok -> brak oferty ---');
{
  assert(scenario({ era: 2, need: 5, playerSurplus: 30 }) === null, 'D1: nadwyzka 30 < blok 50 -> null');
  assert(scenario({ era: 1, need: 5, playerSurplus: 9 }) === null, 'D2: nadwyzka 9 < blok 10 -> null');
}
console.log('--- E: potrzeba 0 (nadwyzka netto AI) -> nadal 1 blok, nie 0 ---');
{
  const r = scenario({ era: 3, need: 0, playerSurplus: 5000 });
  assert(r !== null && r.receiveQty === 100, 'E1: receiveQty = 100 (1 blok Żelaza), bylo ' + (r && r.receiveQty));
}
console.log('--- F: uczciwosc (bramka) nadal decyduje ---');
assert(scenario({ era: 2, need: 5, playerSurplus: 300, gate: () => false }) === null, 'F1: gate=false -> null');

console.log('ai-trade-offer-min-one-block-test: ' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
