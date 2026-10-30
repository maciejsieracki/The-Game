import { writeFileSync } from 'node:fs';
import { mnoznikHandelPieniadzForCiv as fc, mnoznikHandelPieniadzForCivByDifficulty as fd, civEconomyYieldMultipliers as ey } from './gra/src/game/slice.mts';
import { loadCivMatrix } from './gra/src/game/civ-matrix.ts';
const enc = (x: any) => ({ f: Object.is(x, -0) ? '-0' : String(x) });
const m = loadCivMatrix();
const ids = new Set<string>();
for (const r of m.cywilizacje) { for (const s of [r.ikonaId, r.typCywilizacji, r.Cywilizacja]) { ids.add(s); ids.add(s.toUpperCase()); ids.add(' ' + s); } }
ids.add('xyz'); ids.add('');
const keys: any[] = [...ids, null, undefined];
const fbs: any[] = [0, -0, 0.5, 1, 2, 2.5, -1, 1e-300, 3.14159, NaN, Infinity, -Infinity, undefined];
const fo: any[] = [];
for (const k of keys) for (const fb of fbs) {
  const got = fb === undefined ? fc(k) : fc(k, undefined, fb);
  fo.push({ key: k === undefined ? { u: true } : k, fb: fb === undefined ? { default: true } : enc(fb), out: enc(got) });
}
const dd: any[] = [];
for (const k of keys) for (const d of ['easy', 'normal', 'hard'] as const) for (const fb of fbs.filter((x: any) => x !== undefined)) {
  dd.push({ key: k === undefined ? { u: true } : k, diff: d, fb: enc(fb), out: enc(fd(k, undefined, d, fb)) });
}
writeFileSync(process.argv[2], JSON.stringify({ forCiv: fo, byDiff: dd, yieldMult: [{ out: ey(undefined) }] }));
console.log('forCiv', fo.length, 'byDiff', dd.length, 'keys', keys.length);
