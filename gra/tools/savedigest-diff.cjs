'use strict';
/**
 * savedigest-diff.cjs -- R-WEB-SAVE-DIGEST-DIFF-Q1 (SAVEDIGEST). Strukturalny diff dwoch zrzutow __detHarness.full()
 * (units + cities). Dopasowanie po id (units[].id, cities[].id); wynik: klasy sciezek (indeksy zamienione na []),
 * liczba i rozmiar roznic: 'added' (tylko w drugim), 'removed' (tylko w pierwszym), 'changed' (inna wartosc).
 * Uzycie: node tools/savedigest-diff.cjs <A.full.json> <B.full.json> [--top 40]
 * Rozmiary w znakach JSON; sumy per klasa pozwalaja wskazac, ktore ~tysiace znakow sa 'nadmiarem'.
 */
const fs = require('fs');

const [, , fa, fb] = process.argv;
const topN = Number(process.argv[process.argv.indexOf('--top') + 1]) || 40;
if (!fa || !fb) { console.error('uzycie: savedigest-diff.cjs A.json B.json [--top N]'); process.exit(2); }
const A = JSON.parse(fs.readFileSync(fa, 'utf8'));
const B = JSON.parse(fs.readFileSync(fb, 'utf8'));

const cls = {};
const bump = (kind, p, size) => {
  const key = kind + ' ' + p;
  if (!cls[key]) cls[key] = { kind, path: p, n: 0, chars: 0 };
  cls[key].n++; cls[key].chars += size;
};
const norm = (p) => p.replace(/\[\d+\]/g, '[]');
const sz = (v) => (v === undefined ? 0 : JSON.stringify(v).length);

// Rozmiar wpisu obiektu = nazwa klucza + wartosc (JSON), zeby dodany klucz liczyl sie w znakach z nazwa.
function szKey(key, v) { return key === undefined ? sz(v) : JSON.stringify(key).length + 1 + sz(v); }

function walk(a, b, p, ctx, key) {
  if (a === b) return;
  const ta = a === null ? 'null' : Array.isArray(a) ? 'array' : typeof a;
  const tb = b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b;
  if (a === undefined) { bump('added', norm(p), szKey(key, b)); return; }
  if (b === undefined) { bump('removed', norm(p), szKey(key, a)); return; }
  if (ta !== tb || ta !== 'object' && ta !== 'array') { bump('changed', norm(p), sz(a) + sz(b)); return; }
  if (ta === 'array') {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) walk(a[i], b[i], p + '[' + i + ']', ctx);
    return;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) walk(a[k], b[k], p + '.' + k, ctx, k);
}

// Dopasowanie po id (kolejnosc tablic moze sie roznic po restore).
function matchById(arrA, arrB, name) {
  const mA = new Map(); const mB = new Map();
  arrA.forEach((x, i) => mA.set(x && x.id !== undefined ? String(x.id) : 'idx' + i, x));
  arrB.forEach((x, i) => mB.set(x && x.id !== undefined ? String(x.id) : 'idx' + i, x));
  const keys = new Set([...mA.keys(), ...mB.keys()]);
  let missingA = 0; let missingB = 0; let orderDiff = 0;
  const orderA = arrA.map((x, i) => (x && x.id !== undefined ? String(x.id) : 'idx' + i));
  const orderB = arrB.map((x, i) => (x && x.id !== undefined ? String(x.id) : 'idx' + i));
  for (let i = 0; i < Math.max(orderA.length, orderB.length); i++) if (orderA[i] !== orderB[i]) orderDiff++;
  for (const k of keys) {
    const a = mA.get(k); const b = mB.get(k);
    if (a === undefined) { missingA++; bump('added', name + '[*]', sz(b)); continue; }
    if (b === undefined) { missingB++; bump('removed', name + '[*]', sz(a)); continue; }
    walk(a, b, name + '[' + k + ']', {}, undefined);
  }
  return { missingA, missingB, orderDiff, count: [arrA.length, arrB.length] };
}

const res = {};
res.units = matchById(A.units || [], B.units || [], 'units');
res.cities = matchById(A.cities || [], B.cities || [], 'cities');
// Pola na poziomie korzenia (poza units/cities) -- full() ich nie zawiera, ale na wszelki wypadek:
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) if (k !== 'units' && k !== 'cities') walk(A[k], B[k], '$.' + k, {}, k);

const total = Object.values(cls).reduce((s, x) => s + x.chars, 0);
const rows = Object.values(cls).sort((x, y) => y.chars - x.chars);
const byKind = {};
for (const r of rows) byKind[r.kind] = (byKind[r.kind] || 0) + r.chars;
console.log(JSON.stringify({ lenA: fs.statSync(fa).size, lenB: fs.statSync(fb).size, matched: res, charsByKind: byKind, charsTotal: total }, null, 1));
console.log('--- top ' + topN + ' klas sciezek (kind | sciezka | n | znaki) ---');
for (const r of rows.slice(0, topN)) console.log(r.kind.padEnd(8) + ' | ' + r.path + ' | ' + r.n + ' | ' + r.chars);
