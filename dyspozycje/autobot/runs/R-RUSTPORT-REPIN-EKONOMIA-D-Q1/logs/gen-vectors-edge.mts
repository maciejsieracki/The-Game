// Generator wektorow brzegowych (R3, zarzut 4): uruchamia work-tax.ts z pinu 91dc998a.
// Uruchomienie: node --experimental-strip-types gen-vectors-edge.mts <out.json>
// Plik work-tax.ts kopiowany z `git show 91dc998a:gra/src/game/work-tax.ts` do katalogu
// roboczego POZA repo (obok tego skryptu). Liczby kodowane jako {"f": String(x)} (-0 -> "-0").
// String() daje najkrotsza reprezentacje round-trip; Rust f64::from_str zwraca ten sam bit-pattern.
import * as w from './work-tax.ts';
import { writeFileSync } from 'node:fs';

const E: number[] = [-0, 0, 0.5, 0.999999999, 1, 1.0000001, 2.9999999999999996, 3, -1e300, 1e300,
  2 ** 53, 2 ** 53 + 2, Number.MAX_VALUE, Number.MIN_VALUE, 1.5e-300, 129419.99999999999,
  0.1 + 0.2, -0.5, 7, Infinity, -Infinity, NaN];
const f = (x: number): { f: string } => ({ f: Object.is(x, -0) ? '-0' : String(x) });
const S8 = [-0, 0.5, 1, 3, 1e300, 2 ** 53, Infinity, NaN];

const tax: any[] = [];
for (const a of E) for (const b of E) tax.push({ w: f(a), r: f(b), out: f(w.taxForWorkAmount(a, b)) });

const convert: any[] = [];
for (const p of S8) for (const r of S8) for (const t of S8) for (const en of [true, false]) {
  const o = w.convertWorkPoolToTax(p, r, t, en);
  convert.push({ pool: f(p), req: f(r), rate: f(t), enabled: en,
    out: { workRemaining: f(o.workRemaining), workSpent: f(o.workSpent), taxGained: f(o.taxGained) } });
}

const serialize: any[] = [];
for (let i = 0; i < E.length; i++) {
  const m = new Map<number, number>();
  m.set(E[i], E[(i + 3) % E.length]);
  m.set(E[(i + 7) % E.length], E[(i + 11) % E.length]);
  m.set(E[(i + 5) % E.length], E[(i + 1) % E.length]);
  serialize.push({ pending: [...m.entries()].map(([k, v]) => [f(k), f(v)]),
    out: w.serializePendingWorkTax(m).map(([k, v]) => [f(k), f(v)]) });
}

writeFileSync(process.argv[2], JSON.stringify({ tax, convert, serialize }));
console.log('counts', tax.length, convert.length, serialize.length);
