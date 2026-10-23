// P6.M17 - wektory z URUCHOMIONEGO weba (pin edb8fb56): gra/src/map/mapSnapshot.ts (1-404).
// Funkcje weba ladowane WERBATIM z git archive (import typow `import type` jest wycinany przez
// --experimental-transform-types; zero stubow, zero przepisywania).
// Liczby specjalne: NaN / +-Infinity / -0 w WEJSCIACH zapisywane jako stringi "NaN"/"Infinity"/"-Infinity"/"-0";
// WYJSCIA snapshotu zapisywane jako tekst JSON.stringify (`text`) + sparsowany obiekt.
//
// Uzycie:
//   node --experimental-transform-types --no-warnings ./gen-m17-vectors.mjs <WEB_ROOT> <OUT_DIR>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outDirArg] = process.argv;
if (!webRootArg || !outDirArg) {
  console.error('usage: <WEB_ROOT> <OUT_DIR>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const outDir = presolve(outDirArg);
mkdirSync(outDir, { recursive: true });
const S = await import(pathToFileURL(join(webRoot, 'gra/src/map/mapSnapshot.ts')).href);
const { serializeMapForSave, buildGameMapFromSnapshot, isValidMapSnapshot } = S;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x17ac0de5);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const clone = (x) => structuredClone(x);

const replacer = (_k, v) => {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (Object.is(v, -0)) return '-0';
  }
  return v;
};
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(obj, replacer, 0) + '\n');

const TEREN = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny'];
const NAKL = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy'];
const ULEP = ['brak', 'farma', 'irygacja', 'kopalnia', 'droga', 'droga_brukowana', 'pastwisko', 'tartak'];
const VIS = ['nieodkryty', 'odkryty', 'widoczny'];
const OWN = ['0', '1', '2', 'ai-1', 'brak', ''];
// Klucze widocznosci: indeksy tablicy JS (porzadkowane rosnaco), nie-indeksy (kolejnosc wstawienia).
const PLAYERS = ['0', '1', '2', '10', '9', 'p', 'ai', '007', '-1', '4294967294', '4294967295', '1.5', 'brak'];
const ZLOZA = ['zloze_rudy', 'zloze_gliny', 'zloze_konia', ''];
const IKEYS = ['farm', 'mine', 'sawmill', ''];
const LUDN = [0, 1, 2, 3, 4, 5, 0.5, 2.25, 12];

function subset(arr, p) {
  return arr.filter(() => rnd() < p);
}

function genHex(q, r, density) {
  const h = {
    coords: { q, r },
    terenBazowy: pick(TEREN),
    nakladka: rnd() < 0.25 ? pick(NAKL) : 'brak',
    ulepszenie: rnd() < 0.2 ? pick(ULEP) : 'brak',
    wlasciciel: rnd() < 0.45 ? null : pick(OWN),
    wioska: { istnieje: rnd() < 0.5, ludnosc: pick(LUDN) },
    widocznosc: {},
    rzeka: { obecna: rnd() < 0.25, krawedzie: [] },
  };
  const widIns = [];
  if (h.rzeka.obecna || rnd() < 0.05) h.rzeka.krawedzie = subset([0, 1, 2, 3, 4, 5], 0.4);
  if (rnd() < density) h.zloze = pick(ZLOZA);
  if (rnd() < density) h.zlozeMinEra = pick([0, 1, 2, 3, 2.5]);
  if (rnd() < density) h.ulepszenia = subset(ULEP.slice(1), 0.35);
  if (rnd() < density) h.improvementKey = pick(IKEYS);
  if (rnd() < density * 3) {
    const keys = subset(PLAYERS, 0.25).sort(() => rnd() - 0.5);
    for (const k of keys) {
      h.widocznosc[k] = pick(VIS);
      widIns.push(k);
    }
  }
  return { hex: h, widIns };
}

// Mapa -> opis wejscia wektora: kolejnosc `Object.keys` + widocznosc jako kolejnosc WSTAWIENIA i kolejnosc JS.
function describeMap(map, insertionOrders) {
  const hexes = Object.entries(map.hexes).map(([k, h]) => {
    const o = clone(h);
    const wi = insertionOrders?.get(h) ?? Object.keys(h.widocznosc);
    o.widocznosc = {
      insertion: wi.map((p) => [p, h.widocznosc[p]]),
      jsOrder: Object.entries(h.widocznosc),
    };
    return [k, o];
  });
  const out = {
    szerokoscQ: map.szerokoscQ,
    wysokoscR: map.wysokoscR,
    seed: map.seed,
    hexes,
    riverPaths: map.riverPaths === undefined ? null : map.riverPaths,
  };
  if (map.riverPathKinds !== undefined) out.riverPathKinds = map.riverPathKinds;
  return out;
}

function makeMap(w, h, density, shuffle, extra) {
  const coords = [];
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) coords.push([q - (rnd() < 0.2 ? 3 : 0), r]);
  if (shuffle) coords.sort(() => rnd() - 0.5);
  const hexes = {};
  const ins = new Map();
  for (const [q, r] of coords) {
    const { hex, widIns } = genHex(q, r, density);
    hexes[`${q},${r}`] = hex;
    ins.set(hex, widIns);
  }
  const paths = [];
  const rc = ri(0, 3);
  for (let i = 0; i < rc; i++) {
    const p = [];
    for (let j = ri(1, 5); j > 0; j--) p.push({ q: ri(-2, w), r: ri(-2, h) });
    paths.push(p);
  }
  const map = { szerokoscQ: w, wysokoscR: h, hexes, seed: ri(0, 0xffffffff), riverPaths: paths };
  if (rnd() < 0.5) map.riverPathKinds = paths.map(() => pick(['main', 'medium', 'short', 'tributary']));
  Object.assign(map, extra ?? {});
  return { map, ins };
}

// ---------- serialize ----------
const serCases = [];
function addSer(label, map, ins, textExact = true) {
  const input = describeMap(map, ins);
  const before = JSON.stringify(map);
  const snapshot = serializeMapForSave(map);
  if (JSON.stringify(map) !== before) throw new Error(`mutacja wejscia: ${label}`);
  const text = JSON.stringify(snapshot);
  serCases.push({ label, input, snapshot: JSON.parse(text), text, textExact });
}
for (let i = 0; i < 40; i++) {
  const w = ri(1, 7);
  const h = ri(1, 6);
  const { map, ins } = makeMap(w, h, pick([0.02, 0.08, 0.2]), rnd() < 0.4);
  addSer(`random-${i}`, map, ins);
}
for (let i = 0; i < 3; i++) {
  const { map, ins } = makeMap(20, 14, 0.05, true);
  addSer(`duza-${i}`, map, ins);
}
// baza dla recznych snapshotow rebuild (n=9, bogate kolumny)
{
  const { map, ins } = makeMap(3, 3, 0.4, false);
  map.riverPathKinds = ['main'];
  map.riverPaths = [[{ q: 0, r: 0 }, { q: 1, r: 0 }]];
  addSer('base-3x3', map, ins);
}
// brak riverPaths (undefined ?? []) i brak riverPathKinds
{
  const { map, ins } = makeMap(3, 2, 0.2, false);
  delete map.riverPaths;
  delete map.riverPathKinds;
  addSer('riverPaths-undefined', map, ins);
}
// pusta mapa
addSer('pusta', { szerokoscQ: 0, wysokoscR: 0, hexes: {}, seed: 0, riverPaths: [] }, new Map());
// klucz != coords, klucz-indeks, duplikat coords pod roznymi kluczami
{
  const a = genHex(1, 1, 0.3).hex;
  const b = genHex(1, 1, 0.3).hex;
  const c = genHex(2, 2, 0.3).hex;
  const d = genHex(3, 3, 0.3).hex;
  addSer('klucze-nie-zgodne', { szerokoscQ: 4, wysokoscR: 4, hexes: { 'x': a, '5': b, '1,1': c, '7': d }, seed: 7, riverPaths: [] }, new Map());
}
// puste/falsy pola opcjonalne i wlasciciel pusty
{
  const h = genHex(0, 0, 0).hex;
  h.zloze = '';
  h.zlozeMinEra = 0;
  h.ulepszenia = [];
  h.improvementKey = '';
  h.wlasciciel = '';
  h.rzeka = { obecna: false, krawedzie: [3] };
  const h2 = genHex(1, 0, 0).hex;
  h2.zlozeMinEra = 0;
  h2.rzeka = { obecna: true, krawedzie: [] };
  h2.nakladka = 'brak';
  h2.terenBazowy = 'brak';
  addSer('falsy-pola', { szerokoscQ: 2, wysokoscR: 1, hexes: { '0,0': h, '1,0': h2 }, seed: 1, riverPaths: [] }, new Map());
}
// liczby egzotyczne (porownanie wartosci, nie tekstu)
{
  const mk = (l) => {
    const h = genHex(0, 0, 0).hex;
    h.wioska.ludnosc = l;
    return h;
  };
  const hexes = { '0,0': mk(NaN), '1,0': mk(Infinity), '2,0': mk(-0), '3,0': mk(1e21), '4,0': mk(-1e-7), '5,0': mk(123456789012345680000), '6,0': mk(0.1) };
  for (const [k, hx] of Object.entries(hexes)) hx.coords = { q: Number(k.split(',')[0]), r: 0 };
  addSer('liczby-egzotyczne', { szerokoscQ: 7.5, wysokoscR: 1e21, hexes, seed: -0, riverPaths: [] }, new Map(), false);
}

// ---------- rebuild ----------
function findUndefined(v, path, out) {
  if (v === undefined) {
    out.push(path);
    return;
  }
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) findUndefined(v[k], `${path}.${k}`, out);
    if (Array.isArray(v)) for (let i = 0; i < v.length; i++) if (!(i in v)) out.push(`${path}[${i}]`);
  }
}
function describeBuilt(m) {
  const hexes = Object.entries(m.hexes).map(([k, h]) => {
    const o = { ...h };
    o.widocznosc = Object.entries(h.widocznosc);
    return [k, o];
  });
  const out = { szerokoscQ: m.szerokoscQ, wysokoscR: m.wysokoscR, seed: m.seed, hexes, riverPaths: m.riverPaths };
  if (m.riverPathKinds !== undefined) out.riverPathKinds = m.riverPathKinds;
  return out;
}
const rebCases = [];
function addReb(label, snapJson) {
  const parsed = JSON.parse(JSON.stringify(snapJson));
  const res = { label, snapshot: snapJson };
  let built;
  try {
    built = buildGameMapFromSnapshot(parsed);
  } catch (e) {
    res.outcome = 'throws';
    res.error = String(e && e.name);
    rebCases.push(res);
    return;
  }
  const desc = describeBuilt(built);
  const und = [];
  findUndefined(desc, 'map', und);
  // klucz "undefined" (dict[idx] === undefined uzyte jako nazwa gracza) - web nie rzuca, tworzy klucz-smiec
  for (const [k, h] of desc.hexes) for (const [p] of h.widocznosc) if (p === 'undefined') und.push(`map.hexes.${k}.widocznosc.undefined`);
  // JSON.stringify gubi undefined - sciezki zapisane osobno
  res.outcome = und.length ? 'undefined' : 'ok';
  res.undefinedPaths = und;
  res.map = JSON.parse(JSON.stringify(desc));
  rebCases.push(res);
}
for (const c of serCases) if (c.textExact) addReb(`from-ser:${c.label}`, c.snapshot);

// ręczne snapshoty
const base = () => clone(serCases.find((c) => c.label === 'base-3x3').snapshot);
function dictIdx(s, str) {
  let i = s.dict.indexOf(str);
  if (i < 0) {
    s.dict.push(str);
    i = s.dict.length - 1;
  }
  return i;
}
{
  // kolejnosc kluczy widocznosci: wstawianie nie-posortowane (indeksy tablicy po nieindeksach)
  const s = base();
  s.widocznosc = { hexIdx: [], playerIdx: [], valIdx: [] };
  const players = ['p', '10', 'ai', '2', '4294967295', '4294967294', '007', '0', '9', '-1'];
  players.forEach((p, k) => {
    s.widocznosc.hexIdx.push(0);
    s.widocznosc.playerIdx.push(dictIdx(s, p));
    s.widocznosc.valIdx.push(dictIdx(s, VIS[k % 3]));
  });
  // nadpisanie istniejacego klucza (zachowuje pozycje)
  s.widocznosc.hexIdx.push(0);
  s.widocznosc.playerIdx.push(dictIdx(s, 'ai'));
  s.widocznosc.valIdx.push(dictIdx(s, 'widoczny'));
  addReb('widocznosc-kolejnosc-kluczy', s);
}
{
  // duplikat wspolrzednych: pozycja pierwszego, wartosc ostatniego; rzadkie kolumny na osieroconym heksie
  const s = base();
  s.q[1] = s.q[0];
  s.r[1] = s.r[0];
  s.rzekaKrawedzie = { hexIdx: [0, 1], val: [[1, 2], [3]] };
  s.zloze = { hexIdx: [0], val: [dictIdx(s, 'zloze_rudy')] };
  addReb('duplikat-wspolrzednych', s);
}
{
  // ta sama kolumna rzadka nadpisuje ten sam heks dwa razy
  const s = base();
  s.zlozeMinEra = { hexIdx: [2, 2], val: [1, 3] };
  s.improvementKey = { hexIdx: [2, 2], val: [dictIdx(s, 'farm'), dictIdx(s, 'mine')] };
  s.ulepszenia = { hexIdx: [2, 2], val: [[dictIdx(s, 'farma')], []] };
  addReb('rzadkie-nadpisanie', s);
}
{
  // n mniejsze niz dlugosci kolumn: nadmiar ignorowany
  const s = base();
  s.n = 2;
  addReb('n-mniejsze-niz-kolumny', s);
}
{
  const s = base();
  s.wlascicielIdx[0] = -1;
  s.wlascicielIdx[1] = dictIdx(s, '');
  addReb('wlasciciel-pusty-i-null', s);
}
{
  const s = base();
  s.n = 0;
  for (const f of ['q', 'r', 'terenIdx', 'nakladkaIdx', 'ulepszenieIdx', 'wlascicielIdx', 'wioskaIstnieje', 'wioskaLudnosc', 'rzekaObecna']) s[f] = [];
  s.rzekaKrawedzie = { hexIdx: [], val: [] };
  s.zloze = { hexIdx: [], val: [] };
  s.zlozeMinEra = { hexIdx: [], val: [] };
  s.ulepszenia = { hexIdx: [], val: [] };
  s.improvementKey = { hexIdx: [], val: [] };
  s.widocznosc = { hexIdx: [], playerIdx: [], valIdx: [] };
  addReb('n-zero', s);
}
{
  const s = base();
  s.wioskaIstnieje[0] = 2;
  s.wioskaIstnieje[1] = 1;
  s.rzekaObecna[0] = 1;
  s.rzekaObecna[1] = 3;
  addReb('flagi-inne-niz-0-1', s);
}
// niepoprawne indeksy (Z-M17-3): web daje undefined albo TypeError
{
  const s = base();
  s.terenIdx[0] = 9999;
  addReb('oob-terenIdx', s);
}
{
  const s = base();
  s.nakladkaIdx[0] = -2;
  addReb('oob-nakladkaIdx-ujemny', s);
}
{
  const s = base();
  s.wlascicielIdx[0] = 9999;
  addReb('oob-wlascicielIdx', s);
}
{
  const s = base();
  s.zloze = { hexIdx: [0], val: [9999] };
  addReb('oob-zloze-val', s);
}
{
  const s = base();
  s.ulepszenia = { hexIdx: [0], val: [[0, 9999]] };
  addReb('oob-ulepszenia-item', s);
}
{
  const s = base();
  s.rzekaKrawedzie = { hexIdx: [s.n + 5], val: [[1]] };
  addReb('oob-hexIdx-rzekaKrawedzie', s);
}
{
  const s = base();
  s.zlozeMinEra = { hexIdx: [-1], val: [2] };
  addReb('oob-hexIdx-ujemny', s);
}
{
  const s = base();
  s.widocznosc = { hexIdx: [0], playerIdx: [9999], valIdx: [0] };
  addReb('oob-widocznosc-player', s);
}
{
  const s = base();
  s.widocznosc = { hexIdx: [s.n], playerIdx: [0], valIdx: [0] };
  addReb('oob-widocznosc-hexIdx', s);
}
{
  const s = base();
  s.q.pop();
  addReb('krotsza-kolumna-q', s);
}
{
  const s = base();
  s.wioskaLudnosc.pop();
  addReb('krotsza-kolumna-ludnosc', s);
}

// ---------- validate ----------
const valCases = [];
function addVal(label, input) {
  const parsed = JSON.parse(JSON.stringify(input === undefined ? null : input));
  const out = isValidMapSnapshot(parsed);
  valCases.push({ label, input: input === undefined ? null : JSON.parse(JSON.stringify(input)), out });
}
function tinySnap(seedLabel) {
  const { map, ins } = makeMap(2, 2, 0.5, false);
  const sn = JSON.parse(JSON.stringify(serializeMapForSave(map)));
  void seedLabel;
  return sn;
}
const bases = [tinySnap('a'), clone(serCases.find((c) => c.label === 'falsy-pola').snapshot)];
bases.forEach((b, bi) => {
  addVal(`base${bi}-valid`, b);
  const topFields = Object.keys(b);
  const wrong = [null, 'x', {}, [], 0, -1, true, 1.5, '2'];
  for (const f of topFields) {
    const d = clone(b);
    delete d[f];
    addVal(`base${bi}-del-${f}`, d);
    wrong.forEach((w, wi) => {
      const m = clone(b);
      m[f] = w;
      addVal(`base${bi}-set-${f}-w${wi}`, m);
    });
  }
  // dlugosci kolumn gestych +-1
  for (const f of ['q', 'r', 'terenIdx', 'nakladkaIdx', 'ulepszenieIdx', 'wlascicielIdx', 'wioskaIstnieje', 'wioskaLudnosc', 'rzekaObecna']) {
    const p = clone(b);
    p[f].push(0);
    addVal(`base${bi}-len+1-${f}`, p);
    const m = clone(b);
    m[f].pop();
    addVal(`base${bi}-len-1-${f}`, m);
  }
  // kolumny rzadkie
  for (const f of ['rzekaKrawedzie', 'zloze', 'zlozeMinEra', 'ulepszenia', 'improvementKey']) {
    const a = clone(b);
    a[f].val.push(0);
    addVal(`base${bi}-sparse-val+1-${f}`, a);
    const c = clone(b);
    c[f].hexIdx.push(0);
    addVal(`base${bi}-sparse-hexIdx+1-${f}`, c);
    for (const sub of ['hexIdx', 'val']) {
      const e = clone(b);
      delete e[f][sub];
      addVal(`base${bi}-sparse-del-${f}.${sub}`, e);
      const g = clone(b);
      g[f][sub] = {};
      addVal(`base${bi}-sparse-obj-${f}.${sub}`, g);
    }
    for (const [wi, w] of [null, 5, 'str', [], true].entries()) {
      const e = clone(b);
      e[f] = w;
      addVal(`base${bi}-sparse-whole-${f}-w${wi}`, e);
    }
  }
  // widocznosc
  for (const sub of ['hexIdx', 'playerIdx', 'valIdx']) {
    const a = clone(b);
    a.widocznosc[sub].push(0);
    addVal(`base${bi}-wid-+1-${sub}`, a);
    const d = clone(b);
    delete d.widocznosc[sub];
    addVal(`base${bi}-wid-del-${sub}`, d);
    const o = clone(b);
    o.widocznosc[sub] = 'x';
    addVal(`base${bi}-wid-str-${sub}`, o);
  }
  // n i wymiary
  for (const [f, v] of [['n', 0], ['n', -1], ['n', b.n + 0.5], ['szerokoscQ', 0], ['szerokoscQ', -3], ['szerokoscQ', 0.5], ['wysokoscR', 0], ['wysokoscR', -1], ['fmt', 1], ['fmt', 3], ['fmt', 2.0], ['seed', -5], ['seed', 0], ['seed', 1e21]]) {
    const m = clone(b);
    m[f] = v;
    addVal(`base${bi}-val-${f}=${v}`, m);
  }
  // pola dodatkowe sa ignorowane; brak riverPathKinds jest ok
  const ex = clone(b);
  ex.dodatkowe = [1, 2, 3];
  addVal(`base${bi}-extra-field`, ex);
  const nk = clone(b);
  delete nk.riverPathKinds;
  addVal(`base${bi}-no-riverPathKinds`, nk);
  // kolumny puste przy n>0 i wartosci poza zakresem (walidator nie sprawdza wartosci)
  const oob = clone(b);
  oob.terenIdx = oob.terenIdx.map(() => 99999);
  addVal(`base${bi}-values-not-checked`, oob);
});
// poprawny ksztalt, ale n = 0 i wszystkie kolumny puste (n <= 0 => niepoprawny)
{
  const e = clone(bases[0]);
  e.n = 0;
  for (const f of ['q', 'r', 'terenIdx', 'nakladkaIdx', 'ulepszenieIdx', 'wlascicielIdx', 'wioskaIstnieje', 'wioskaLudnosc', 'rzekaObecna']) e[f] = [];
  for (const f of ['rzekaKrawedzie', 'zloze', 'zlozeMinEra', 'ulepszenia', 'improvementKey']) e[f] = { hexIdx: [], val: [] };
  e.widocznosc = { hexIdx: [], playerIdx: [], valIdx: [] };
  e.szerokoscQ = 1;
  e.wysokoscR = 1;
  addVal('empty-columns-n0', e);
  const e1 = clone(e);
  e1.n = 1;
  for (const f of ['q', 'r', 'terenIdx', 'nakladkaIdx', 'ulepszenieIdx', 'wlascicielIdx', 'wioskaIstnieje', 'wioskaLudnosc', 'rzekaObecna']) e1[f] = [0];
  addVal('single-hex-n1', e1);
}
for (const [i, v] of [undefined, null, 0, 1, '', 'snapshot', true, false, [], [1, 2], {}, { fmt: 2 }, 42.5].entries()) {
  addVal(`non-object-${i}`, v);
}

// RUNDA-2 (zarzut 3): wynik WEBA `isValidMapSnapshot` dla KAZDEGO snapshotu zwroconego przez WEBOWE `serializeMapForSave`
// (round-trip przez JSON jak przy zapisie: `snapshot` w serialize.json jest juz JSON.parse(JSON.stringify(...))).
for (const c of serCases) addVal(`serialize:${c.label}`, c.snapshot);

write('serialize.json', { source: 'gra/src/map/mapSnapshot.ts@edb8fb56', cases: serCases });
write('rebuild.json', { source: 'gra/src/map/mapSnapshot.ts@edb8fb56', cases: rebCases });
write('validate.json', { source: 'gra/src/map/mapSnapshot.ts@edb8fb56', cases: valCases });
console.log(`serialize=${serCases.length} rebuild=${rebCases.length} validate=${valCases.length}`);
const oc = {};
for (const c of rebCases) oc[c.outcome] = (oc[c.outcome] ?? 0) + 1;
console.log('rebuild outcomes', JSON.stringify(oc));
const vo = { true: 0, false: 0 };
for (const c of valCases) vo[c.out]++;
console.log('validate outcomes', JSON.stringify(vo));
