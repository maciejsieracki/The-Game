'use strict';
/** diplomacy-ai-balance-test.cjs — R-HANDEL-AI-FALA */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-ai-balance-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-ai-balance-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  clampAiResourceTradeCommand,
  basketItemsAffordableExtended,
} from '../src/game/diplomacy-ai-balance.ts';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const B = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  OK:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

console.log('diplomacy-ai-balance-test');

const baseCtx = {
  aiOwnerId: 2,
  partnerOwnerId: 0,
  aiGold: 500,
  partnerGold: 300,
  aiPraca: 50,
  partnerPraca: 40,
  aiStock: { drewno: 100 },
  partnerStock: { drewno: 200 },
  pakietWielkosc: 10,
  defaultTurns: 10,
};

const baseCmd = {
  type: 'zaproponuj_handel_surowiec',
  targetId: '0',
  powod: 'test',
  surowiecKey: 'drewno',
  label: 'Drewno',
  pakietyPerTura: 5,
  zaplataTyp: 'zloto',
  zaplataPerTura: 20,
  turns: 10,
  kierunek: 'sprzedaz',
};

// clamp reduces pakiety when seller low stock
{
  const ctx = { ...baseCtx, aiStock: { drewno: 25 } };
  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);
  ok(out != null && out.pakietyPerTura === 2,
    `clamp reduces pakiety when seller low stock (got ${out?.pakietyPerTura})`);
}

// clamp reduces zaplata when buyer poor gold over 10 turns
{
  const ctx = { ...baseCtx, partnerGold: 50 };
  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);
  ok(out != null && out.zaplataPerTura <= 5,
    `clamp reduces zaplata when buyer poor (got ${out?.zaplataPerTura}/turę)`);
}

// returns null when impossible
{
  const ctx = { ...baseCtx, aiStock: { drewno: 0 }, partnerGold: 0 };
  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);
  ok(out === null, 'returns null when impossible');
}

// basketItemsAffordableExtended rejects surowiec_ilosc when insufficient stock
{
  const ownerCtx = {
    gold: 1000,
    praca: 100,
    foodReserve: 100,
    stock: { kamien: 5 },
    pakietWielkosc: 10,
  };
  const items = [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 2 }];
  ok(!B.basketItemsAffordableExtended(items, ownerCtx, 1),
    'rejects surowiec_ilosc when insufficient stock');
}

// accepts when stock sufficient
{
  const ownerCtx = {
    gold: 1000,
    praca: 100,
    foodReserve: 100,
    stock: { kamien: 50 },
    pakietWielkosc: 10,
  };
  const items = [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 2 }];
  ok(B.basketItemsAffordableExtended(items, ownerCtx, 1),
    'accepts when stock sufficient');
}

// per-turn payment over full cycle
{
  const ownerCtx = { gold: 90, praca: 0, foodReserve: 0, stock: {}, pakietWielkosc: 10 };
  const items = [{ typ: 'zloto', id: 'zloto', ilosc: 10 }];
  ok(!B.basketItemsAffordableExtended(items, ownerCtx, 10),
    'rejects zloto when 10/turę × 10 tur > treasury');
  ok(B.basketItemsAffordableExtended(items, ownerCtx, 9),
    'accepts zloto when 10/turę × 9 tur fits treasury');
}

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
