// Generator: web balanceFor / peaceOfferAiRequestPn / tolerancja (origin/main 5dd53e60f), R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 r5.
import fs from 'node:fs';
import { peaceOfferAiOwnBilans, peaceOfferAiRequestPn, aiOfferPwSurplusTolerance } from './web-src/gra/src/game/diplomacy-ai-offer-balance.ts';
import { treatyBasePnFromConfig } from './web-src/gra/src/game/diplomacy-proposals.ts';

const OUT = process.env.OUT!;
const enc = (v: number) => (Number.isNaN(v) ? 'NaN' : v === Infinity ? 'Infinity' : v === -Infinity ? '-Infinity' : v);
const pokoj = treatyBasePnFromConfig('pokoj');
const bases = [0, -10, 1, 2, 333, 500, 1000, 2000, pokoj];
const rels = [-50, 0, 10, 49.5, 90, 99.5, 100, 101, 150, 200, 250, 300];
const covs = [0, 1, 5.5, 100, 777.25, -3, 1234];
const diffs = ['easy', 'normal', 'hard'] as const;
const rows: unknown[] = [];
for (const base of bases) for (const rel of rels) for (const diff of diffs) {
  const req = peaceOfferAiRequestPn(0, 0, rel, base, diff);
  const tol = aiOfferPwSurplusTolerance(diff);
  const bal0 = peaceOfferAiOwnBilans(0, 0, rel, base);
  for (const cov of covs) {
    rows.push({ base, rel, diff, cov, balance: enc(peaceOfferAiOwnBilans(0, cov, rel, base)), required: enc(req), tol: enc(tol), balance0: enc(bal0) });
  }
}
fs.writeFileSync(OUT, JSON.stringify({ pokojBase: pokoj, rows }));
console.log('rows', rows.length, 'pokoj', pokoj);
