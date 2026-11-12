// P6-WIRE-WAR-R7K7: generator wektorow z WEBA (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75) dla krokow D1-D7.
// Uzycie: node p6_wire_war_dipl_steps_gen.mjs <esbuild> <katalog-z-rozpakowanym-pinem(gra/src)> <katalog-roboczy-POZA-REPO> <katalog-wyjsciowy>
//   np. git archive 07d2fbd72... gra/src gra/data | tar -x -C <pin>
// Wektory:
//   - activeDealsToPaymentDeals / tickDiplomacyPayments / tributeBreakPairsFromDeals (diplomacy-economy.ts),
//   - tickDobraWolaOnRelation (diplomacy-pn-engine.ts),
//   - expireTreaties (diplomacy-treaties.ts).
// STRAZNIK: SHA-256 zrodel pinu musi sie zgadzac, inaczej generator konczy sie bledem.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , esbuild, pinDir, workDir, outDir] = process.argv;
if (!esbuild || !pinDir || !workDir || !outDir) {
  console.error('uzycie: node gen.mjs <esbuild> <pinDir> <workDir> <outDir>');
  process.exit(2);
}
const SHA = {
  'gra/src/game/diplomacy-economy.ts': '3e0c78672e9efcedce38ef06b540e5ba3b13326ca2db1f946c977325908c02e2',
  'gra/src/game/diplomacy-pn-engine.ts': 'ee1b1aabffd4fdf906ce260084f80ad5da055c64912b6eda86306ba261d89257',
  'gra/src/game/diplomacy-treaties.ts': '9b8e3bd81b65de1bb009a86058d1afa59a48c096b6ed6e91be71606af6cde6cb',
};
for (const [rel, want] of Object.entries(SHA)) {
  const got = createHash('sha256').update(readFileSync(join(pinDir, rel))).digest('hex');
  if (got !== want) {
    console.error(`STRAZNIK SHA-256: ${rel}: ${got} != ${want}`);
    process.exit(3);
  }
}
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });
const entry = join(workDir, 'entry.ts');
const g = (f) => join(pinDir, 'gra/src/game', f).replaceAll('\\', '/');
writeFileSync(
  entry,
  `export * from '${g('diplomacy-economy.ts')}';\n` +
    `export { tickDobraWolaOnRelation } from '${g('diplomacy-pn-engine.ts')}';\n` +
    `export { expireTreaties } from '${g('diplomacy-treaties.ts')}';\n`,
);
const bundled = join(workDir, 'entry.mjs');
execFileSync(esbuild, [entry, '--bundle', '--format=esm', `--outfile=${bundled}`], { stdio: 'inherit' });
const W = await import(pathToFileURL(bundled).href);

const deal = (id, payer, receiver, perTurn, wygasa, extra = {}) => ({
  id, rodzaj: 'wasalizacja', strony: payer < receiver ? [payer, receiver] : [receiver, payer],
  wygasaTura: wygasa, zawartaTura: 1,
  ekonomia: perTurn === null ? undefined : { payerOwnerId: payer, receiverOwnerId: receiver, pieniadzePerTura: perTurn },
  ...extra,
});

// ---- payments: scenariusze (deals, skarbce, tura) ----
const scenarios = [
  { name: 'dwie-dane-starcza', turn: 5, deals: [deal('d1', 1, 2, 10, null), deal('d2', 2, 3, 5, 9)], treasury: { 1: 30, 2: 0, 3: 0 } },
  { name: 'brak-srodkow-zrywa', turn: 5, deals: [deal('d1', 1, 2, 10, null), deal('d2', 1, 3, 25, null)], treasury: { 1: 30, 2: 0, 3: 0 } },
  { name: 'wygasle-pominiete', turn: 10, deals: [deal('d1', 1, 2, 10, 9), deal('d2', 1, 2, 10, 10)], treasury: { 1: 100, 2: 0 } },
  { name: 'jednorazowy-i-zero', turn: 3, deals: [deal('d1', 1, 2, 10, null, { handelJednorazowy: true }), deal('d2', 1, 2, 0, null), deal('d3', 1, 2, null, null)], treasury: { 1: 100, 2: 0 } },
  { name: 'kolejnosc-saldo', turn: 4, deals: [deal('a', 1, 2, 20, null), deal('b', 1, 3, 20, null), deal('c', 2, 3, 15, null)], treasury: { 1: 30, 2: 0, 3: 0 } },
];
const payments = scenarios.map((s) => {
  const bal = new Map(Object.entries(s.treasury).map(([k, v]) => [Number(k), v]));
  const treasury = {
    getPieniadze: (o) => bal.get(o) ?? 0,
    add: (o, d) => bal.set(o, (bal.get(o) ?? 0) + d),
  };
  const payDeals = W.activeDealsToPaymentDeals(s.deals, s.turn);
  const res = W.tickDiplomacyPayments(payDeals, treasury, s.turn);
  const breaks = W.tributeBreakPairsFromDeals(s.deals, res.broken);
  return {
    name: s.name, turn: s.turn, deals: s.deals, treasury: s.treasury,
    payDeals, paid: res.paid, broken: res.broken, messages: res.messages, breaks,
    balances: Object.fromEntries([...bal.entries()].sort(([a], [b]) => a - b)),
  };
});

// ---- dobra wola (galaz bez hamulca) ----
const dobra = [];
for (const rem of [0, 1, 3]) {
  for (const z of [0, 50, 100]) {
    const rel = { zaufanie: z, respekt: 10, status: 'pokoj' };
    const meta = { dobraWolaRemainingTur: rem, trustPnGainedThisTurn: 0 };
    const out = W.tickDobraWolaOnRelation(rel, meta);
    dobra.push({ rem, zaufanie: z, outZaufanie: out.rel.zaufanie, outRemaining: out.meta.dobraWolaRemainingTur, gained: out.gained });
  }
}

// ---- expireTreaties ----
const expire = [];
for (const turn of [4, 5, 6]) {
  const state = [deal('n', 1, 2, null, null), deal('e4', 1, 2, null, 4), deal('e5', 1, 3, null, 5), deal('e6', 2, 3, null, 6)];
  expire.push({ turn, kept: W.expireTreaties(state, turn).map((d) => d.id) });
}

writeFileSync(
  join(outDir, 'vectors.json'),
  JSON.stringify({ pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75', sha256: SHA, payments, dobra, expire }, null, 2) + '\n',
);
console.log('OK', payments.length, dobra.length, expire.length);
