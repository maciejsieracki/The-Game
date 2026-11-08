// Generator wektorow: uruchamia PRAWDZIWY kod weba (gra/src/game/ai.ts) z git archive origin/main.
// Uzycie: P61C_WEB_ROOT=<web> node --experimental-transform-types --no-warnings --import <gen>/register.mjs <gen>/gen.mjs <OUT.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const WEB = process.env.P61C_WEB_ROOT;
const OUT = process.argv[2];
const ai = await import(pathToFileURL(join(import.meta.dirname, 'ai-purchase-web.ts')).href);
const aiParams = JSON.parse(readFileSync(join(WEB, 'gra/data/ai-params.json'), 'utf8'));
const data = { aiParams };

const params = {};
for (const n of [1, 2, 3]) params[n] = ai.loadAiPurchaseReserveParams(data, n);

const cases = [];
// Wejscia: pola opcjonalne (null = pominiete w wywolaniu weba)
const push = (id, level, inp) => {
  const reserve = inp.reserve === 'lvl' ? params[level] : null;
  const call = {
    treasury: inp.treasury,
    goldCost: inp.goldCost,
    hasManpower: inp.hasManpower,
  };
  if (reserve) call.reserve = reserve;
  if (inp.netIncomePerTurn !== undefined) call.netIncomePerTurn = inp.netIncomePerTurn;
  if (inp.upkeepPerTurn !== undefined) call.upkeepPerTurn = inp.upkeepPerTurn;
  if (inp.unitUpkeepPerTurn !== undefined) call.unitUpkeepPerTurn = inp.unitUpkeepPerTurn;
  const expected = ai.shouldAIPurchaseUnit(call);
  cases.push({
    id,
    level,
    input: {
      treasury: inp.treasury,
      goldCost: inp.goldCost,
      hasManpower: inp.hasManpower,
      reserve: reserve ? { rezerwaTur: reserve.rezerwaTur, minDochodNetto: reserve.minDochodNetto } : null,
      netIncomePerTurn: inp.netIncomePerTurn ?? null,
      upkeepPerTurn: inp.upkeepPerTurn ?? null,
      unitUpkeepPerTurn: inp.unitUpkeepPerTurn ?? null,
    },
    expected,
  });
};

const tag = (d) => (d === 0 ? 'N' : d > 0 ? `N+${d}` : `N${d}`);
const UP = 5, UNIT = 2; // upkeepAfter = 7
for (const n of [1, 2, 3]) {
  const R = params[n].rezerwaTur;
  const M = params[n].minDochodNetto;
  const prog = R * (UP + UNIT);
  // granica rezerwy: treasury - cena = R * upkeepAfter (+ -1 / 0 / +1)
  for (const d of [-1, 0, 1]) {
    const goldCost = 40;
    push(`L${n}-rezerwa-${tag(d)}`, n, {
      treasury: goldCost + prog + d, goldCost, hasManpower: true, reserve: 'lvl',
      netIncomePerTurn: 1000, upkeepPerTurn: UP, unitUpkeepPerTurn: UNIT,
    });
  }
  // granica dochodu netto: netAfter = net - unit = M + d
  for (const d of [-1, 0, 1]) {
    push(`L${n}-netto-${tag(d)}`, n, {
      treasury: 100000, goldCost: 40, hasManpower: true, reserve: 'lvl',
      netIncomePerTurn: M + d + UNIT, upkeepPerTurn: UP, unitUpkeepPerTurn: UNIT,
    });
  }
  push(`L${n}-brak-manpower`, n, { treasury: 100000, goldCost: 40, hasManpower: false, reserve: 'lvl', netIncomePerTurn: 1000, upkeepPerTurn: UP, unitUpkeepPerTurn: UNIT });
  push(`L${n}-skarbiec-ponizej-ceny`, n, { treasury: 39, goldCost: 40, hasManpower: true, reserve: 'lvl', netIncomePerTurn: 1000, upkeepPerTurn: UP, unitUpkeepPerTurn: UNIT });
  push(`L${n}-bez-rezerwy-legacy`, n, { treasury: 40, goldCost: 40, hasManpower: true });
  push(`L${n}-bez-netto-legacy`, n, { treasury: 40, goldCost: 40, hasManpower: true, reserve: 'lvl', upkeepPerTurn: UP, unitUpkeepPerTurn: UNIT });
  push(`L${n}-ujemne-clamp`, n, { treasury: 40, goldCost: 40, hasManpower: true, reserve: 'lvl', netIncomePerTurn: 0, upkeepPerTurn: -5, unitUpkeepPerTurn: -3 });
  push(`L${n}-ulamek`, n, { treasury: 123.5, goldCost: 40.25, hasManpower: true, reserve: 'lvl', netIncomePerTurn: 3.5, upkeepPerTurn: 6.25, unitUpkeepPerTurn: 1.5 });
  push(`L${n}-zerowa-cena`, n, { treasury: 0, goldCost: 0, hasManpower: true, reserve: 'lvl', netIncomePerTurn: 0, upkeepPerTurn: 0, unitUpkeepPerTurn: 0 });
}

const out = {
  pin: 'origin/main 679ab078a',
  generator: 'gen.mjs (uruchamia gra/src/game/ai.ts shouldAIPurchaseUnit + loadAiPurchaseReserveParams)',
  params,
  cases,
};
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log('cases', cases.length, JSON.stringify(params));
