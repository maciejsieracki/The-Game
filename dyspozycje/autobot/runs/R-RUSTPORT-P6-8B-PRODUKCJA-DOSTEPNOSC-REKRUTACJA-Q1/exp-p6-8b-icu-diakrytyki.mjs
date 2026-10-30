// Pelne porownanie (rozne bazy tez): wariant M14 = baza (strip + l z l-kreskowanego) wg ICU, przy rownosci bazy -> UTF-16 na oryginalach.
// Wariant CUR = ten sam pierwszy poziom + liczba diakrytykow + UTF-16.
const coll = new Intl.Collator('en-US');
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').toLowerCase();
const isAcc = c => c === 'ł' || c === 'Ł' || (c.normalize('NFD') !== c);
const cnt = s => [...s].filter(isAcc).length;
const u16 = (a, b) => {
  const x = [...a].map(c => c.charCodeAt(0)), y = [...b].map(c => c.charCodeAt(0));
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return Math.sign(x[i] - y[i]);
  return Math.sign(x.length - y.length);
};
const prim = (a, b) => { const x = strip(a), y = strip(b); return x === y ? 0 : Math.sign(coll.compare(x, y)); };
const cur = (a, b) => { const p = prim(a, b); if (p) return p; const c = Math.sign(cnt(a) - cnt(b)); if (c) return c; return u16(a, b); };
const m14 = (a, b) => { const p = prim(a, b); if (p) return p; return u16(a, b); };
const alpha = ['a', 'ą', 'c', 'ć', 'e', 'ę', 'l', 'ł', 'n', 'ń', 'o', 'ó', 's', 'ś', 'z', 'ź', 'ż', 'b'];
const words = [];
for (const x of alpha) for (const y of alpha) words.push(x + y);
for (const x of alpha) for (const y of alpha) for (const z of alpha) words.push(x + y + z);
let total = 0, curBad = 0, m14Bad = 0; const ex = [], ex2 = [];
for (const a of words) for (const b of words) {
  if (a === b) continue;
  total++;
  const t = Math.sign(coll.compare(a, b));
  if (cur(a, b) !== t) { curBad++; if (ex.length < 6) ex.push([a, b, t, cur(a, b)]); }
  if (m14(a, b) !== t) { m14Bad++; if (ex2.length < 6) ex2.push([a, b, t, m14(a, b)]); }
}
console.log('all pairs', total, 'cur!=ICU', curBad, 'm14!=ICU', m14Bad);
console.log('cur ex', JSON.stringify(ex));
console.log('m14 ex', JSON.stringify(ex2));
