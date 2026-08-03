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
  maxSustainablePakietyPerTura,
  maxResourcePakiety,
  clampBasketItemsToAffordable,
  buildClampedAiTradeAgreementPayload,
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



// per_turn: magazyn nie podbija stawki — tylko produkcja

{

  const ctx = { ...baseCtx, aiStock: { drewno: 500 }, aiResourceRates: { drewno: 25 } };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out != null && out.pakietyPerTura === 2,

    `per_turn cap from production only (got ${out?.pakietyPerTura}, want 2)`);

}



// per_turn: duży magazyn + zero produkcji → null

{

  const ctx = { ...baseCtx, aiStock: { drewno: 500 }, aiResourceRates: { drewno: 0 } };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out === null, 'per_turn with stock but no production -> null');

}



// clamp reduces zaplata when buyer poor gold over 10 turns

{

  const ctx = { ...baseCtx, partnerGold: 50, aiResourceRates: { drewno: 50 } };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out != null && out.zaplataPerTura <= 5,

    `clamp reduces zaplata when buyer poor (got ${out?.zaplataPerTura}/turę)`);

}



// returns null when impossible

{

  const ctx = { ...baseCtx, aiStock: { drewno: 0 }, partnerGold: 0, aiResourceRates: { drewno: 0 } };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out === null, 'returns null when impossible');

}



// once mode: rejects surowiec_ilosc when insufficient stock

{

  const ownerCtx = {

    gold: 1000,

    praca: 100,

    foodReserve: 100,

    stock: { kamien: 5 },

    pakietWielkosc: 10,

  };

  const items = [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 2 }];

  ok(!B.basketItemsAffordableExtended(items, ownerCtx, 1, 'once'),

    'once: rejects surowiec_ilosc when insufficient stock');

}



// once mode: accepts when stock sufficient

{

  const ownerCtx = {

    gold: 1000,

    praca: 100,

    foodReserve: 100,

    stock: { kamien: 50 },

    pakietWielkosc: 10,

  };

  const items = [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 2 }];

  ok(B.basketItemsAffordableExtended(items, ownerCtx, 1, 'once'),

    'once: accepts when stock sufficient');

}



// per_turn: production enables offer without relying on stock

{

  const ctx = {

    ...baseCtx,

    aiStock: { drewno: 0 },

    aiResourceRates: { drewno: 10 },

  };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out != null && out.pakietyPerTura === 1,

    `production enables 1 pakiet/turę bez zapasu (got ${out?.pakietyPerTura})`);

}



// no production + no stock -> null

{

  const ctx = {

    ...baseCtx,

    aiStock: { drewno: 0 },

    aiResourceRates: { drewno: 0 },

  };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out === null, 'no stock and no production -> null');

}



// maxResourcePakiety unit checks

{

  ok(B.maxResourcePakiety('once', 250, 0, 10) === 25,

    'once: stock 250 -> 25 pakietów');

  ok(B.maxResourcePakiety('per_turn', 300, 20, 10) === 2,

    'per_turn: prod 20/t -> 2 pakiety/t (ignores stock)');

}



// clampBasket per_turn scales to production

{

  const ownerCtx = {

    gold: 1000,

    praca: 100,

    foodReserve: 100,

    stock: { drewno: 500 },

    pakietWielkosc: 10,

    resourceRates: { drewno: 25 },

  };

  const items = [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 5 }];

  const clamped = B.clampBasketItemsToAffordable(items, ownerCtx, 10, 'per_turn');

  ok(clamped.length === 1 && clamped[0].ilosc === 2,

    `clampBasket per_turn scales to production (got ${clamped[0]?.ilosc})`);

}



// clampBasket once scales to stock

{

  const ownerCtx = {

    gold: 1000,

    praca: 100,

    foodReserve: 100,

    stock: { drewno: 250 },

    pakietWielkosc: 10,

    resourceRates: { drewno: 100 },

  };

  const items = [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 30 }];

  const clamped = B.clampBasketItemsToAffordable(items, ownerCtx, 1, 'once');

  ok(clamped.length === 1 && clamped[0].ilosc === 25,

    `clampBasket once scales to stock (got ${clamped[0]?.ilosc})`);

}



{

  const ownerCtx = { gold: 90, praca: 0, foodReserve: 0, stock: {}, pakietWielkosc: 10 };

  const items = [{ typ: 'zloto', id: 'zloto', ilosc: 10 }];

  ok(!B.basketItemsAffordableExtended(items, ownerCtx, 10),

    'rejects zloto when 10/turę × 10 tur > treasury');

  ok(B.basketItemsAffordableExtended(items, ownerCtx, 9),

    'accepts zloto when 10/turę × 9 tur fits treasury');

}



{

  const quick = { giveItems: [], receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 }] };

  const aiCtx = { gold: 50, praca: 0, foodReserve: 0, stock: { drewno: 100 }, pakietWielkosc: 10 };

  const playerCtx = { gold: 0, praca: 0, foodReserve: 0, stock: {}, pakietWielkosc: 10 };

  const empty = B.buildClampedAiTradeAgreementPayload(quick, 0, aiCtx, playerCtx);

  ok(empty === null, 'empty receive after clamp → null (no enqueue)');

}



{

  const quick = { giveItems: [], receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 2 }] };

  const aiCtx = { gold: 30, praca: 0, foodReserve: 0, stock: {}, pakietWielkosc: 10 };

  const playerCtx = { gold: 0, praca: 0, foodReserve: 0, stock: { drewno: 25 }, pakietWielkosc: 10 };

  const out = B.buildClampedAiTradeAgreementPayload(quick, 20, aiCtx, playerCtx);

  ok(out != null && (out.giveItems?.length ?? 0) > 0 && (out.receiveItems?.length ?? 0) > 0,

    'sweetener + receive clamped to player stock');

  const gold = out?.giveItems?.find(i => i.typ === 'zloto');

  ok(gold != null && gold.ilosc === 15, `sweetener capped to AI_TRADE_AGREEMENT_SWEETENER_MAX (got ${gold?.ilosc})`);

}



try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}



console.log(`\n${pass}/${pass + fail} PASS`);

process.exit(fail ? 1 : 0);

