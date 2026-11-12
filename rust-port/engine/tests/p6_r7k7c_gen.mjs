// P6-WIRE-WAR-R7K7-C: generator wektorow z WEBA (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75) dla
// efektow umow na skarbce wlascicieli: activeDealsToPaymentDeals, tickDiplomacyPayments,
// tributeBreakPairsFromDeals (gra/src/game/diplomacy-economy.ts).
// Uzycie: node p6_r7k7c_gen.mjs <esbuild> <katalog-z-rozpakowanym-pinem(gra/src,gra/data)> <katalog-roboczy-POZA-REPO> <katalog-wyjsciowy>
//   np. git archive 07d2fbd72... gra/src gra/data | tar -x -C <pin>
// Scenariusze losowe, ale DETERMINISTYCZNE (PRNG mulberry32, ziarno 20261112): kazdy przypadek jest
// liczony przez kod pinu (wyjscie = wynik weba), a test Rust porownuje z tym wynikiem.
// STRAZNIK: SHA-256 zrodla pinu musi sie zgadzac, inaczej generator konczy sie bledem.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const [, , esbuild, pinDir, workDir, outDir] = process.argv;
if (!esbuild || !pinDir || !workDir || !outDir) {
  console.error('uzycie: node p6_r7k7c_gen.mjs <esbuild> <pinDir> <workDir> <outDir>');
  process.exit(2);
}
const REL = 'gra/src/game/diplomacy-economy.ts';
const SHA = '3e0c78672e9efcedce38ef06b540e5ba3b13326ca2db1f946c977325908c02e2';
const got = createHash('sha256').update(readFileSync(join(pinDir, REL))).digest('hex');
if (got !== SHA) {
  console.error(`STRAZNIK SHA-256: ${REL}: ${got} != ${SHA}`);
  process.exit(3);
}
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });
const entry = join(workDir, 'entry.ts');
const abs = join(pinDir, REL).replaceAll('\\', '/');
writeFileSync(
  entry,
  `export { activeDealsToPaymentDeals, tickDiplomacyPayments, tributeBreakPairsFromDeals } from '${abs}';\n`,
);
const bundled = join(workDir, 'entry.mjs');
execFileSync(esbuild, [entry, '--bundle', '--format=esm', `--outfile=${bundled}`], { stdio: 'inherit' });
const W = await import(pathToFileURL(bundled).href);

// PRNG mulberry32 (deterministyczny).
let seed = 20261112 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (xs) => xs[int(0, xs.length - 1)];

const N = 200;
const OWNERS = [1, 2, 3, 4];
const scenarios = [];
for (let s = 0; s < N; s++) {
  const turn = int(1, 12);
  const nDeals = int(0, 5);
  const deals = [];
  for (let d = 0; d < nDeals; d++) {
    const payer = pick(OWNERS);
    let receiver = pick(OWNERS);
    while (receiver === payer) receiver = pick(OWNERS);
    const pt = rnd();
    const perTurn = pt < 0.1 ? null : pt < 0.2 ? 0 : int(1, 40);
    const wygasa = rnd() < 0.5 ? null : int(1, 12);
    const deal = {
      id: `s${s}d${d}`,
      rodzaj: 'wasalizacja',
      strony: payer < receiver ? [payer, receiver] : [receiver, payer],
      wygasaTura: wygasa,
      zawartaTura: 1,
    };
    if (perTurn !== null) {
      deal.ekonomia = { payerOwnerId: payer, receiverOwnerId: receiver, pieniadzePerTura: perTurn };
    }
    if (rnd() < 0.1) deal.handelJednorazowy = true;
    deals.push(deal);
  }
  const treasury = Object.fromEntries(OWNERS.map((o) => [o, int(0, 60)]));
  scenarios.push({ name: `losowy-${s}`, turn, deals, treasury });
}
// Przypadki brzegowe dolozone na poczatku (zerowe i ujemne kwoty, ten sam tura-koniec).
scenarios.unshift(
  { name: 'brzeg-pusty', turn: 3, deals: [], treasury: { 1: 0, 2: 0, 3: 0, 4: 0 } },
  {
    name: 'brzeg-wygasa-w-turze',
    turn: 5,
    deals: [
      { id: 'w', rodzaj: 'wasalizacja', strony: [1, 2], wygasaTura: 5, zawartaTura: 1,
        ekonomia: { payerOwnerId: 1, receiverOwnerId: 2, pieniadzePerTura: 7 } },
    ],
    treasury: { 1: 7, 2: 0, 3: 0, 4: 0 },
  },
  {
    name: 'brzeg-ujemna-kwota',
    turn: 2,
    deals: [
      { id: 'u', rodzaj: 'wasalizacja', strony: [1, 2], wygasaTura: null, zawartaTura: 1,
        ekonomia: { payerOwnerId: 1, receiverOwnerId: 2, pieniadzePerTura: -4 } },
    ],
    treasury: { 1: 9, 2: 0, 3: 0, 4: 0 },
  },
);

const cases = scenarios.map((s) => {
  const bal = new Map(Object.entries(s.treasury).map(([k, v]) => [Number(k), v]));
  const treasury = {
    getPieniadze: (o) => bal.get(o) ?? 0,
    add: (o, d) => bal.set(o, (bal.get(o) ?? 0) + d),
  };
  const payDeals = W.activeDealsToPaymentDeals(s.deals, s.turn);
  const res = W.tickDiplomacyPayments(payDeals, treasury, s.turn);
  const breaks = W.tributeBreakPairsFromDeals(s.deals, res.broken);
  return {
    name: s.name,
    turn: s.turn,
    deals: s.deals,
    treasury: s.treasury,
    payDeals,
    paid: res.paid,
    broken: res.broken,
    messages: res.messages,
    breaks,
    balances: Object.fromEntries([...bal.entries()].sort(([a], [b]) => a - b)),
  };
});

writeFileSync(
  join(outDir, 'payments.json'),
  JSON.stringify({ pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75', sha256: SHA, payments: cases }, null, 2) + '\n',
);
console.log('OK', cases.length);
