// P6.8C (pin web 91dc998a): wektory z URUCHOMIONEGO weba dla symboli production.ts 1253-1976
// (pin): frontItem, etaTurns, buildingWorkPerTurn, unitRecruitmentCapacityPerTurn, enqueue,
// forfeitedProgressForIndex, bankRemovedBuildingProgress, withdrawBankedBuildingProgress,
// sanitizeBuildQueue, dequeue, filterQueue, promoteToFront, insertAtFront, advanceProduction.
// Funkcje z PRAWDZIWEGO modulu production.ts (loader z runu R-RUSTPORT-P6-8B-...; zero stubow).
// Uruchomienie (Node 22):
//   node --experimental-transform-types --no-warnings --import <ABS>/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/repin-b-loader-register.mjs \
//        <ABS>/R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1/gen-p6-8c-vectors.mjs <WEB_ROOT (katalog z gra/)> <KATALOG_WYJSCIA> <KATALOG_ROBOCZY_POZA_REPO>
// Kodowanie: calkowita |x|<=2^53 = JSON number; inna skonczona = {"$f": String(x)};
// NaN/Infinity/-Infinity/-0 = {"$n": "..."}; undefined = {"absent": true}; null = null.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const scratch = presolve(process.argv[4] ?? '');
if (!process.argv[4]) throw new Error('podaj 3. argument: katalog roboczy poza repo');
mkdirSync(outDir, { recursive: true });
mkdirSync(scratch, { recursive: true });

const W = await import(pathToFileURL(join(webRoot, 'gra/src/game/production.ts')).href);

const MAX_SAFE = 9007199254740991;
const enc = (x) => {
  if (x === undefined) return { absent: true };
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x) && Math.abs(x) <= MAX_SAFE) return x;
  return { $f: String(x) };
};
const it = (kind, id, koszt, postep) => {
  const o = { kind, id, nazwa: id, koszt };
  if (postep !== undefined) o.postep = postep;
  return o;
};
const encItem = (x) => {
  const o = { kind: x.kind, id: x.id, nazwa: x.nazwa, koszt: enc(x.koszt) };
  if (x.postep !== undefined) o.postep = enc(x.postep);
  if (x.isGeneral !== undefined) o.isGeneral = x.isGeneral;
  return o;
};
const encOptItem = (x) => (x === null || x === undefined ? null : encItem(x));
const encQueue = (q) => q.map(encItem);
const encProd = (p) => {
  const o = { kolejka: encQueue(p.kolejka), postep: enc(p.postep) };
  if (p.wstrzymana !== undefined) o.wstrzymana = p.wstrzymana;
  if (p.rekrutacja !== undefined) o.rekrutacja = encQueue(p.rekrutacja);
  return o;
};
const encMap = (m) => {
  if (m === undefined) return { absent: true };
  const o = {};
  for (const [k, v] of Object.entries(m)) o[k] = enc(v);
  return o;
};
const mkCity = (map) => {
  const c = {};
  if (map !== undefined) c.postepBudynkowUsuniete = { ...map };
  return c;
};
const cityMapOut = (c) => encMap(c.postepBudynkowUsuniete);
const encArg = (x) => (x === undefined ? { absent: true } : enc(x));

// ---------------------------------------------------------------- dane wejsciowe
const KO = it('budynek', 'koszary', 30);
const ZA = it('budynek', 'zamek', 120);
const WO = it('jednostka', 'Wojownik', 10);
const ZW = it('jednostka', 'Zwiadowca', 0);
const GA = it('jednostka', 'Galera', 7.5);
const NI = it('budynek', 'nieistnieje', 3);
const ITEMS = [
  KO, ZA, WO, ZW, GA, NI,
  it('budynek', 'koszary', NaN),
  it('budynek', 'constructor', 9),
  it('budynek', 'koszary', 30, 5),
  it('jednostka', 'Wojownik', 10, 4),
];
const PRODS = [
  { kolejka: [], postep: 0 },
  { kolejka: [it('budynek', 'koszary', 30)], postep: 12.5 },
  { kolejka: [it('jednostka', 'Wojownik', 10)], postep: 7, wstrzymana: true, rekrutacja: [it('jednostka', 'Galera', 7.5)] },
  { kolejka: [it('budynek', 'koszary', 30), it('budynek', 'zamek', 120, 4), it('jednostka', 'Galera', 7.5, 2), it('budynek', 'nieistnieje', 3), it('budynek', 'koszary', 30, 0)], postep: 0 },
  { kolejka: [it('budynek', 'koszary', 30)], postep: NaN },
  { kolejka: [it('budynek', 'zamek', 120), it('jednostka', 'Wojownik', 10, 3), it('budynek', 'koszary', 30, NaN)], postep: 50, wstrzymana: false, rekrutacja: [] },
  { kolejka: [it('budynek', 'koszary', NaN), it('budynek', 'zamek', 120, 9)], postep: 25 },
  { kolejka: [it('jednostka', 'Wojownik', 10), it('budynek', 'koszary', 30, 4), it('jednostka', 'Zwiadowca', 0, 6), it('budynek', 'zamek', 120, 7)], postep: 3, wstrzymana: true },
  { kolejka: [it('budynek', 'zamek', 120), it('jednostka', 'Galera', 7.5, Infinity), it('budynek', 'koszary', 30, -4)], postep: Infinity },
  { kolejka: [it('jednostka', 'Zwiadowca', 0), it('budynek', 'koszary', 30, 2.5)], postep: 0, rekrutacja: [it('jednostka', 'Wojownik', 10)] },
];
const MAPS = [
  undefined,
  {},
  { koszary: 5, zamek: 40 },
  { koszary: 0, zamek: NaN, nieistnieje: -2 },
];
const INDEXES = [-1, 0, 1, 2, 3, 4, 5, 1.5, NaN, Infinity];
const BONUSES = [undefined, 0, 0.25, -0.5, -1, -2, NaN, Infinity, 1e308];
const CITY_ARGS = [undefined, { map: undefined }, { map: { koszary: 5, zamek: 40 } }, { map: { koszary: 0, zamek: NaN, nieistnieje: -2 } }];

const cases = [];
const push = (op, args, out) => cases.push({ op, ...args, out });

// 1. frontItem
for (const p of PRODS) push('frontItem', { prod: encProd(p) }, encOptItem(W.frontItem(p)));

// 2. etaTurns
for (const koszt of [0, 1, 10, 30, 120, NaN, Infinity, -5]) for (const postep of [0, 7, NaN, 50, -3, Infinity])
  for (const praca of [0, -1, 0.5, 3, 7, NaN, Infinity]) {
    const out = W.etaTurns(koszt, postep, praca);
    push('etaTurns', { koszt: enc(koszt), postep: enc(postep), praca: enc(praca) }, out === null ? null : enc(out));
  }

// 3./4. buildingWorkPerTurn / unitRecruitmentCapacityPerTurn
for (const x of [0, -1, 1, 2.5, 3, 7.9, NaN, Infinity, -Infinity, 1e308]) for (const b of BONUSES) {
  const args = b === undefined ? [x] : [x, b];
  push('buildingWorkPerTurn', { praca: enc(x), bonus: encArg(b) }, enc(W.buildingWorkPerTurn(...args)));
  push('unitRecruitmentCapacityPerTurn', { base: enc(x), bonus: encArg(b) }, enc(W.unitRecruitmentCapacityPerTurn(...args)));
}

// 5. enqueue (z i bez miasta)
for (const p of PRODS) for (const item of ITEMS) for (const ca of CITY_ARGS) {
  const city = ca === undefined ? undefined : mkCity(ca.map);
  const out = city === undefined ? W.enqueue(p, item) : W.enqueue(p, item, city);
  push('enqueue', { prod: encProd(p), item: encItem(item), city: ca === undefined ? null : { map: encMap(ca.map) } },
    { prod: encProd(out), map: city === undefined ? { absent: true } : cityMapOut(city) });
}

// 6. forfeitedProgressForIndex
for (const p of PRODS) for (const idx of INDEXES)
  push('forfeitedProgressForIndex', { prod: encProd(p), index: enc(idx) }, enc(W.forfeitedProgressForIndex(p, idx)));

// 7. bankRemovedBuildingProgress
for (const p of PRODS) for (const idx of INDEXES) for (const m of MAPS) {
  const city = mkCity(m);
  W.bankRemovedBuildingProgress(city, p, idx);
  push('bankRemovedBuildingProgress', { prod: encProd(p), index: enc(idx), map: encMap(m) }, { map: cityMapOut(city) });
}

// 8. withdrawBankedBuildingProgress
for (const m of MAPS) for (const id of ['koszary', 'zamek', 'nieistnieje', 'brak', 'constructor', '__proto__']) {
  const city = mkCity(m);
  const out = W.withdrawBankedBuildingProgress(city, id);
  push('withdrawBankedBuildingProgress', { map: encMap(m), buildingId: id }, { value: enc(out), map: cityMapOut(city) });
}

// 9. sanitizeBuildQueue
for (const p of PRODS) {
  const out = W.sanitizeBuildQueue(p);
  push('sanitizeBuildQueue', { prod: encProd(p) }, { prod: encProd(out.prod), refundedPraca: enc(out.refundedPraca) });
}

// 10. dequeue
for (const p of PRODS) for (const idx of INDEXES) for (const ca of CITY_ARGS) {
  const city = ca === undefined ? undefined : mkCity(ca.map);
  const out = city === undefined ? W.dequeue(p, idx) : W.dequeue(p, idx, city);
  push('dequeue', { prod: encProd(p), index: enc(idx), city: ca === undefined ? null : { map: encMap(ca.map) } },
    { prod: encProd(out), map: city === undefined ? { absent: true } : cityMapOut(city) });
}

// 11. filterQueue (predykaty nazwane, tak samo po stronie Rust)
const KEEP = {
  only_budynek: (i) => i.kind === 'budynek',
  only_jednostka: (i) => i.kind === 'jednostka',
  none: () => false,
  all: () => true,
  not_koszary: (i) => i.id !== 'koszary',
  not_zamek: (i) => i.id !== 'zamek',
  only_nieistnieje: (i) => i.id === 'nieistnieje',
};
for (const p of PRODS) for (const name of Object.keys(KEEP)) {
  const out = W.filterQueue(p, KEEP[name]);
  push('filterQueue', { prod: encProd(p), keep: name }, { prod: encProd(out.prod), forfeitedPostep: enc(out.forfeitedPostep) });
}

// 12. promoteToFront
for (const p of PRODS) for (const idx of INDEXES)
  push('promoteToFront', { prod: encProd(p), index: enc(idx) }, encProd(W.promoteToFront(p, idx)));

// 13. insertAtFront
for (const p of PRODS) for (const item of ITEMS) for (const ap of [0, 4.5, NaN, Infinity]) {
  push('insertAtFront', { prod: encProd(p), item: encItem(item), activePostep: enc(ap) }, encProd(W.insertAtFront(p, item, ap)));
}

// 14. advanceProduction
for (const p of PRODS) for (const praca of [-1, 0, 0.5, 3, 7.5, 10, 30, NaN, Infinity]) for (const b of [undefined, 0, 0.25, -0.5, NaN]) {
  const out = b === undefined ? W.advanceProduction(p, praca) : W.advanceProduction(p, praca, b);
  push('advanceProduction', { prod: encProd(p), praca: enc(praca), bonus: encArg(b) }, {
    prod: encProd(out.prod),
    completed: encOptItem(out.completed),
    overflowToPool: encArg(out.overflowToPool),
  });
}

const counts = {};
for (const c of cases) counts[c.op] = (counts[c.op] ?? 0) + 1;
writeFileSync(join(outDir, 'p8c.json'), JSON.stringify({ pin: '91dc998a', cases }));
console.log(JSON.stringify({ total: cases.length, counts }));
