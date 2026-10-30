// Generator wektorow r4-obrona (Operator, odpowiedz na zarzuty 1 i 3):
//  (a) p1b-c2-icu-names.json  -- pary nazw [a, b, znak] wg ICU (Intl.Collator('en-US') = localeCompare),
//      alfabet: male litery polskie + ASCII; wiele par o tej samej bazie (tam leza roznice poziomu 2).
//  (b) p1b-c2b-nan-sort.json / p1b-c2c-nan-sort.json -- wynik PRAWDZIWEGO Array.prototype.sort (V8)
//      z komparatorami przepisanymi 1:1 z gra/src/game/production.ts (c2b: ~l.1103-1107, c2c: ~l.968-973),
//      na losowych tablicach z kosztami NaN/Infinity i zduplikowanymi nazwami (n = 2..63).
// Uruchomienie (z korzenia worktree):  node <ten plik>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '../../../../rust-port/engine/tests/p6_8b_vectors');

// Deterministyczny PRNG (mulberry32).
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const coll = new Intl.Collator('en-US');
const letters = ['a', 'ą', 'c', 'ć', 'e', 'ę', 'l', 'ł', 'n', 'ń', 'o', 'ó', 's', 'ś', 'z', 'ź', 'ż', 'b'];

// (a) pary ICU
const words = [];
for (const x of letters) for (const y of letters) words.push(x + y);
for (const x of letters) for (const y of letters) for (const z of letters) words.push(x + y + z);
const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
const accentCount = (s) => [...s].filter((c) => c === 'ł' || c.normalize('NFD') !== c).length;
const pairs = [];
const rnd = rng(20260930);
// (1) wszystkie pary o tej samej bazie, z roznica liczby diakrytykow (tam byl blad poziomu 2)
for (const a of words) for (const b of words) {
  if (a === b || strip(a) !== strip(b)) continue;
  if (accentCount(a) === accentCount(b)) continue;
  pairs.push([a, b]);
}
// (2) losowe pary z calej dziedziny
for (let i = 0; i < 4000; i++) {
  const a = words[Math.floor(rnd() * words.length)];
  const b = words[Math.floor(rnd() * words.length)];
  if (a !== b) pairs.push([a, b]);
}
// (3) jawne przyklady
pairs.push(['źą', 'ża'], ['żzz', 'zżż'], ['źź', 'żz'], ['zź', 'zż'], ['łb', 'lc'], ['ą', 'a']);
const icu = pairs.map(([a, b]) => [a, b, Math.sign(coll.compare(a, b))]);
fs.writeFileSync(path.join(OUT, 'p1b-c2-icu-names.json'), JSON.stringify(icu) + '\n');
console.log('icu pairs', icu.length);

// (b) sortowanie NaN: komparatory 1:1 z web
const cmpC2C = (a, b) => {
  if (a.kind !== b.kind) return a.kind === 'budynek' ? -1 : 1;
  if (a.koszt !== b.koszt) return a.koszt - b.koszt;
  return a.nazwa.localeCompare(b.nazwa);
};
const cmpC2B = (a, b) => {
  if (a.koszt !== b.koszt) return a.koszt - b.koszt;
  return a.nazwa.localeCompare(b.nazwa);
};
const costPool = [0, 1, 2, 2, 3, 5, 10, 2.5, Infinity, NaN, NaN, NaN];
const namePool = ['ąb', 'ab', 'żz', 'zż', 'ka', 'kaź', 'ba', 'łu', 'lu', 'ż', 'a', 'ź', 'zb', 'Ab'];
function encodeCost(x) {
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  return x;
}
function makeCases(seed, withKind) {
  const r = rng(seed);
  const cases = [];
  for (let c = 0; c < 400; c++) {
    const n = 2 + Math.floor(r() * 62); // 2..63
    const items = [];
    for (let i = 0; i < n; i++) {
      const it = {
        id: String(i),
        koszt: costPool[Math.floor(r() * costPool.length)],
        nazwa: namePool[Math.floor(r() * namePool.length)],
      };
      if (withKind) it.kind = r() < 0.5 ? 'budynek' : 'jednostka';
      items.push(it);
    }
    const sorted = items.slice().sort(withKind ? cmpC2C : cmpC2B);
    cases.push({
      items: items.map((it) => {
        const o = { id: it.id, koszt: encodeCost(it.koszt), nazwa: it.nazwa };
        if (withKind) o.kind = it.kind;
        return o;
      }),
      order: sorted.map((it) => it.id),
    });
  }
  return cases;
}
fs.writeFileSync(path.join(OUT, 'p1b-c2b-nan-sort.json'), JSON.stringify(makeCases(7001, false)) + '\n');
fs.writeFileSync(path.join(OUT, 'p1b-c2c-nan-sort.json'), JSON.stringify(makeCases(7002, true)) + '\n');
console.log('nan-sort cases written: c2b and c2c (400 each)');
