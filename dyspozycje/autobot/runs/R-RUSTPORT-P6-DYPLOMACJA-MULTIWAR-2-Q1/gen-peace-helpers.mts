// Generator: czyste helpery pokoju AI<->AI z URUCHOMIONEGO weba (origin/main 5dd53e60f), R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 r5.
// requesterShare / isClearlyLosing / isStillLosing (gra/src/game/diplomacy-ai-forced-peace.ts).
// Kształt `kinked` (test-double w generatorze gen-forced-peace.mts, linia 37) - ten sam wzor wyrazenia.
// Liczby zapisane jako napisy String(x) (najkrotsza forma zwrotna) - parsowanie w Rust jest dokladne (bez ulp-bledu serde_json).
import fs from 'node:fs';
import { requesterShare, isClearlyLosing, isStillLosing } from './web-src/gra/src/game/diplomacy-ai-forced-peace.ts';

const OUT = process.env.OUT!;
const s = (v: number) => String(v);
const powers = [0, 0.1, 0.2, 0.3, 0.45, 0.5, 0.55, 0.9, 1, 1.5, 2, 3, 10, 100, 12345.5, -0.5, -1];
const shares: unknown[] = [];
for (const rp of powers) for (const op of powers) {
  shares.push({ rp: s(rp), op: s(op), share: s(requesterShare(rp, op)) });
}
const shareVals = [0, 0.1, 0.2, 0.44, 0.449, 0.45, 0.4500001, 0.5, 0.5000001, 0.55, 0.6, 1, -0.1, 0.45 - 1e-12];
const clearly = shareVals.map((v) => ({ s: s(v), clearly: isClearlyLosing(v), still: isStillLosing(v) }));
const exact = [[0.45, 0.55], [0.9, 0.5], [0.5, 0.5], [1, 1]].map(([rp, op]) => ({ rp: s(rp), op: s(op), share: s(requesterShare(rp, op)) }));

// Kinked: c <= knee ? b0 + slope*c : b0 + slope*knee + slope2*(c-knee)  (wyrazenie jak w gen-forced-peace.mts)
const kb = { balance0: -100, slope: 1, knee: 50, slope2: 0.5 };
const kinkedBalance = (c: number) => (c <= kb.knee ? kb.balance0 + kb.slope * c : kb.balance0 + kb.slope * kb.knee + kb.slope2 * (c - kb.knee));
const kinkedVals = [0, 1, 10, 49, 50, 50.5, 51, 100, 777.25, -3];
const kinked = kinkedVals.map((c) => ({ b0: s(kb.balance0), slope: s(kb.slope), knee: s(kb.knee), slope2: s(kb.slope2), c: s(c), bal: s(kinkedBalance(c)) }));

fs.writeFileSync(OUT, JSON.stringify({ shares: [...shares, ...exact], clearly, kinked }));
console.log('shares', shares.length + exact.length, 'clearly', clearly.length, 'kinked', kinked.length);
