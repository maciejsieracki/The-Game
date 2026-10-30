import * as w from './work-tax.ts';
import { writeFileSync } from 'node:fs';

let s = 0x20261030 >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const enc = (x: any): any => {
  if (typeof x === 'number') { if (Number.isNaN(x)) return 'NaN'; if (x === Infinity) return 'Infinity'; if (x === -Infinity) return '-Infinity'; if (Number.isSafeInteger(x) || Object.is(x, -0)) return Object.is(x, -0) ? 0 : x; return String(x); }
  return x === undefined ? 'UNDEF' : x;
};
const numSpecial = [0, -0, 0.5, 0.999999, 1, 1.0000001, 2, 3.7, -0.5, -1, -3.2, 99.99, 1e15, 1e16, 2**53, 1e300, -1e300, Infinity, -Infinity, NaN, 1.5e-300, 7, 1000000];
const genNum = () => (rnd() < 0.5 ? pick(numSpecial) : Math.round((rnd() * 2 - 0.3) * 1e4) / 100 * (rnd()<0.2?1000:1));

const tax: any[] = [];
for (let i = 0; i < 1500; i++) { const wv = genNum(), rv = genNum(); tax.push({ w: enc(wv), r: enc(rv), out: enc(w.taxForWorkAmount(wv, rv)) }); }

const convert: any[] = [];
for (let i = 0; i < 2500; i++) {
  const pool = genNum(), req = genNum(), rate = genNum(), en = rnd() < 0.85;
  const o = w.convertWorkPoolToTax(pool, req, rate, en);
  convert.push({ pool: enc(pool), req: enc(req), rate: enc(rate), enabled: en, out: { workRemaining: enc(o.workRemaining), workSpent: enc(o.workSpent), taxGained: enc(o.taxGained) } });
}

const owner: any[] = [];
const ids = ['c1', 'c2', 'c3', 'c4', 'c5'];
const bnames = ['targowisko', 'Targowisko', 'targowisko2', 'koszary', 'mennica'];
for (let i = 0; i < 1200; i++) {
  const oid = pick([1, 2, 3, 0, -1, NaN, Infinity]);
  const cities: any[] = [];
  const nc = Math.floor(rnd() * 4);
  for (let k = 0; k < nc; k++) cities.push({ id: pick(ids), ownerId: pick([1, 2, 3, 0, -1, NaN]) });
  const bm = new Map<string, string[]>();
  for (const id of ids) if (rnd() < 0.6) { const b: string[] = []; const nb = Math.floor(rnd() * 3); for (let j = 0; j < nb; j++) b.push(pick(bnames)); bm.set(id, b); }
  const human = rnd() < 0.7;
  const out = w.ownerCanConvertWorkToTax(oid, human, cities, bm);
  owner.push({ oid: enc(oid), human, cities: cities.map(c => ({ id: c.id, ownerId: enc(c.ownerId) })), bm: [...bm.entries()], out });
}

const serialize: any[] = [];
const restore: any[] = [];
const restoreVals: any[] = [1, 2, 'x', '5', null, true, {}, [], NaN, Infinity, 0, -1, 3.5, 0.0001];
for (let i = 0; i < 900; i++) {
  const m = new Map<number, number>();
  const n = Math.floor(rnd() * 5);
  for (let j = 0; j < n; j++) m.set(pick([1, 2, 3, 1, NaN, Infinity, -1, 0]), genNum());
  const entries = [...m.entries()];
  serialize.push({ pending: entries.map(([k, v]) => [enc(k), enc(v)]), out: w.serializePendingWorkTax(m).map(([k, v]) => [enc(k), enc(v)]) });
  const rows: any[] = [];
  const nr = Math.floor(rnd() * 6);
  for (let j = 0; j < nr; j++) {
    const kind = rnd();
    if (kind < 0.1) rows.push(pick(restoreVals));
    else if (kind < 0.15) rows.push([pick(restoreVals), pick(restoreVals), pick(restoreVals)]);
    else rows.push([pick([1, 2, 3, 1, NaN, Infinity, '1', null, 0]), pick([...restoreVals, 2, 4, 0, 0.5, 2.5, 7])]);
  }
  const rawEnc = (x: any) => (typeof x === 'number' && !Number.isFinite(x) ? enc(x) : x);
  const savedJson = rows.map(r => Array.isArray(r) ? r.map(rawEnc) : rawEnc(r));
  const rm = w.restorePendingWorkTax(rows);
  restore.push({ saved: savedJson, out: [...rm.entries()].map(([k, v]) => [enc(k), enc(v)]) });
}
for (const bad of [null, 'abc', 5, {}]) restore.push({ saved: enc(bad), out: [...w.restorePendingWorkTax(bad).entries()] });

const exec: any[] = [];
for (let i = 0; i < 900; i++) {
  const pool0 = genNum(), req = genNum(), rate = genNum(), en = rnd() < 0.85;
  let pool = pool0; const sets: any[] = []; const queued: any[] = [];
  const conv = w.executeManualWorkTaxConversion(7, req, rate, en, {
    getWorkPool: (o) => { if (o !== 7) throw new Error('owner'); return pool; },
    setWorkPool: (o, v) => { sets.push([enc(o), enc(v)]); pool = v; },
    queueTax: (o, t) => { queued.push([enc(o), enc(t)]); },
  });
  exec.push({ pool0: enc(pool0), req: enc(req), rate: enc(rate), enabled: en, out: { workRemaining: enc(conv.workRemaining), workSpent: enc(conv.workSpent), taxGained: enc(conv.taxGained) }, sets, queued, finalPool: enc(pool) });
}

writeFileSync(process.argv[2], JSON.stringify({ tax, convert, owner, serialize, restore, exec }));
console.log('counts', tax.length, convert.length, owner.length, serialize.length, restore.length, exec.length);
