'use strict';
/**
 * road-connectivity-test.cjs — R-DROGA-WZOR-6-RAMION (Maciej 2026-08-14).
 * Czysta logika sieci dróg: maska 6 bitów sąsiedztwa, lista aktywnych portów, próg węzła
 * i zakres rekomputacji przy budowie/zniszczeniu. BEZ Three.js — testujemy algorytm,
 * nie geometrię mesh (geometria wchodzi tu tylko jako współrzędne portów, liczone
 * arytmetycznie z axialToWorld).
 *
 * Bramka: node tools/road-connectivity-test.cjs (z katalogu gra/), exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.road-connectivity-entry.ts');
const BUNDLE = path.resolve(__dirname, '.road-connectivity-bundle.cjs');

fs.writeFileSync(ENTRY, `
export * from '../src/map/road-network';
export { axialToWorld, HEX_R } from '../src/render/hexutil';
export { HEX_DIRECTIONS } from '../src/map/gen-helpers';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

const {
  ROAD_DIRS, ROAD_MASK_NONE, ROAD_MASK_FULL, ROAD_NODE_MIN_ARMS,
  ROAD_ARM_WIDTH_RATIO, ROAD_NODE_RADIUS_RATIO,
  roadDirBit, roadMaskHasDir, computeRoadMask, roadMaskArms, roadArmCount,
  roadMaskHasNode, roadMaskIsLonePatch, roadPortOffset, roadPortRotationY,
  roadArmLength, roadHexesToRefresh,
} = M;

// --- 0. KONTRAKT KIERUNKÓW ------------------------------------------------
// Indeks kierunku = numer bitu maski. Kolejność MUSI być ta sama co HEX_DIRECTIONS
// (map/gen-helpers.ts) — inaczej maska liczona w main.ts opisywałaby inne sąsiedztwo
// niż to, którym posługuje się reszta silnika.
ok(ROAD_DIRS.length === 6, 'ROAD_DIRS ma 6 kierunków');
ok(JSON.stringify(ROAD_DIRS) === JSON.stringify(M.HEX_DIRECTIONS),
  'kolejność ROAD_DIRS = HEX_DIRECTIONS (gen-helpers) — bit i opisuje tego samego sąsiada');
ok(ROAD_MASK_FULL === 0b111111, 'ROAD_MASK_FULL = 6 bitów');
ok(ROAD_MASK_NONE === 0, 'ROAD_MASK_NONE = 0');
for (let i = 0; i < 6; i++) ok(roadDirBit(i) === (1 << i), 'bit kierunku ' + i);

// Każdy kierunek ma kierunek przeciwny w tej samej tablicy (potrzebne, by port kafla
// i port sąsiada były tym samym punktem).
function oppositeDir(dir) {
  const [dq, dr] = ROAD_DIRS[dir];
  return ROAD_DIRS.findIndex(([aq, ar]) => aq === -dq && ar === -dr);
}
for (let i = 0; i < 6; i++) ok(oppositeDir(i) >= 0, 'kierunek ' + i + ' ma przeciwny w ROAD_DIRS');

// --- 1. MASKA Z SĄSIEDZTWA ------------------------------------------------
/** Mapa testowa: zbiór kluczy "q,r" z drogą. */
function roadsAt(list) {
  const s = new Set(list.map(([q, r]) => q + ',' + r));
  return (q, r) => s.has(q + ',' + r);
}

ok(computeRoadMask(0, 0, roadsAt([])) === 0, 'brak sąsiadów z drogą → maska 0');
ok(computeRoadMask(0, 0, roadsAt([[0, 0]])) === 0,
  'droga na SAMYM heksie nie ustawia bitu (bit = sąsiad, nie ja)');
ok(computeRoadMask(0, 0, roadsAt(ROAD_DIRS.map(([dq, dr]) => [dq, dr]))) === ROAD_MASK_FULL,
  'wszyscy sąsiedzi z drogą → pełna maska');
for (let i = 0; i < 6; i++) {
  const [dq, dr] = ROAD_DIRS[i];
  ok(computeRoadMask(0, 0, roadsAt([[dq, dr]])) === roadDirBit(i),
    'sąsiad w kierunku ' + i + ' ustawia dokładnie bit ' + i);
}
// Maska liczona z przesuniętego heksa — bity muszą wychodzić względem NIEGO, nie względem (0,0).
ok(computeRoadMask(5, -3, roadsAt([[6, -3]])) === roadDirBit(0), 'maska względna do (q,r), nie do origin');

// Dowolny TYP drogi łączy tak samo — predykat hasRoadAt jest z definicji „ma drogę",
// bez rozróżnienia droga/droga_brukowana (decyzja Operatora, opisana w road-network.ts).
ok(computeRoadMask(0, 0, roadsAt([[1, 0], [-1, 0]])) === (roadDirBit(0) | roadDirBit(3)),
  'dwa przeciwległe sąsiedzi → dwa bity');

// --- 2. (a) MASKA 0 = ZERO RAMION ----------------------------------------
ok(roadMaskArms(0).length === 0, '(a) maska 0 → zero ramion');
ok(roadArmCount(0) === 0, '(a) maska 0 → popcount 0');
ok(roadMaskHasNode(0) === false, '(a) maska 0 → brak węzła');
ok(roadMaskIsLonePatch(0) === true, '(a) maska 0 → sam placyk (świeżo postawiona droga widoczna)');

// --- 3. (b) 1 BIT = ŚLEPY KONIEC BEZ WĘZŁA -------------------------------
for (let i = 0; i < 6; i++) {
  const m = roadDirBit(i);
  ok(roadArmCount(m) === 1, '(b) 1 bit (' + i + ') → 1 ramię');
  ok(roadMaskArms(m)[0] === i, '(b) 1 bit (' + i + ') → ramię w tym właśnie kierunku');
  ok(roadMaskHasNode(m) === false, '(b) 1 bit (' + i + ') → BEZ węzła (ślepy koniec)');
  ok(roadMaskIsLonePatch(m) === false, '(b) 1 bit (' + i + ') → to nie jest samotny placyk');
}

// --- 4. (c) 2 BITY: SĄSIEDNIE (60°) I PRZECIWLEGŁE (180°) ----------------
const m60 = roadDirBit(0) | roadDirBit(1);          // dwa sąsiadujące porty = łuk
const m180 = roadDirBit(0) | roadDirBit(3);         // porty naprzeciw = przelot
const m120 = roadDirBit(0) | roadDirBit(2);         // porty co drugi = łagodny łuk
for (const [m, nazwa] of [[m60, '60°'], [m120, '120°'], [m180, '180°']]) {
  ok(roadArmCount(m) === 2, '(c) 2 bity ' + nazwa + ' → 2 ramiona');
  ok(roadMaskHasNode(m) === false, '(c) 2 bity ' + nazwa + ' → BEZ węzła (przelot/łuk)');
  ok(roadMaskIsLonePatch(m) === false, '(c) 2 bity ' + nazwa + ' → nie placyk');
}
ok(JSON.stringify(roadMaskArms(m180)) === JSON.stringify([0, 3]), '(c) przelot 180° → porty 0 i 3');

// Kąt między ramionami: sąsiednie porty = 60°, przeciwległe = 180° (sanity geometrii portów).
function kat(dirA, dirB) {
  const a = roadPortOffset(dirA), b = roadPortOffset(dirB);
  const cos = (a.x * b.x + a.z * b.z) / (Math.hypot(a.x, a.z) * Math.hypot(b.x, b.z));
  return Math.acos(Math.min(1, Math.max(-1, cos))) * 180 / Math.PI;
}
ok(near(kat(0, 1), 60, 1e-6), '(c) porty 0-1 rozstawione o 60°');
ok(near(kat(0, 2), 120, 1e-6), '(c) porty 0-2 rozstawione o 120°');
ok(near(kat(0, 3), 180, 1e-6), '(c) porty 0-3 rozstawione o 180° (przelot na wylot)');

// --- 5. (d) 3+ BITY = WĘZEŁ ----------------------------------------------
ok(ROAD_NODE_MIN_ARMS === 3, '(d) próg węzła = 3 ramiona');
const m3 = roadDirBit(0) | roadDirBit(2) | roadDirBit(4);   // T/Y — trójnik
ok(roadArmCount(m3) === 3 && roadMaskHasNode(m3) === true, '(d) 3 ramiona → węzeł JEST');
const m3b = roadDirBit(0) | roadDirBit(1) | roadDirBit(2);
ok(roadMaskHasNode(m3b) === true, '(d) 3 ramiona (skupione) → węzeł JEST');
const m4 = m3 | roadDirBit(5);
ok(roadArmCount(m4) === 4 && roadMaskHasNode(m4) === true, '(d) 4 ramiona → węzeł JEST');
const m5 = ROAD_MASK_FULL & ~roadDirBit(2);
ok(roadArmCount(m5) === 5 && roadMaskHasNode(m5) === true, '(d) 5 ramion → węzeł JEST');
// Kontrola progu w drugą stronę — pełny przegląd 64 kombinacji.
let bezWezla = 0, zWezlem = 0, popcountOk = true, nodeOk = true;
for (let m = 0; m <= ROAD_MASK_FULL; m++) {
  const n = roadMaskArms(m).length;
  if (n !== roadArmCount(m)) popcountOk = false;
  if (roadMaskHasNode(m) !== (n >= 3)) nodeOk = false;
  if (roadMaskHasNode(m)) zWezlem++; else bezWezla++;
  for (const d of roadMaskArms(m)) { if (!roadMaskHasDir(m, d)) nodeOk = false; }
}
ok(popcountOk, '(d) roadMaskArms().length == roadArmCount() dla wszystkich 64 masek');
ok(nodeOk, '(d) węzeł dokładnie wtedy, gdy ramion >= 3 — wszystkie 64 maski');
ok(zWezlem === 42 && bezWezla === 22,
  '(d) rozkład 64 masek: 42 z węzłem (3+ ramion), 22 bez (0-2 ramiona), got '
  + zWezlem + '/' + bezWezla);

// --- 6. (e) 6 BITÓW = PEŁNA GWIAZDA --------------------------------------
ok(roadArmCount(ROAD_MASK_FULL) === 6, '(e) pełna maska → 6 ramion');
ok(JSON.stringify(roadMaskArms(ROAD_MASK_FULL)) === JSON.stringify([0, 1, 2, 3, 4, 5]),
  '(e) pełna maska → wszystkie 6 portów, w kolejności kierunków');
ok(roadMaskHasNode(ROAD_MASK_FULL) === true, '(e) pełna gwiazda ma węzeł');
ok(roadMaskIsLonePatch(ROAD_MASK_FULL) === false, '(e) pełna gwiazda to nie placyk');

// --- 7. PORTY: TEN SAM PUNKT PO OBU STRONACH ŚCIANKI ---------------------
// Sedno wzoru: ramię kafla i ramię sąsiada spotykają się w JEDNYM punkcie świata,
// dlatego szew jest niewidoczny bez dopasowywania grafiki.
const R = M.HEX_R;
const dlugosc = roadArmLength(R);
ok(near(dlugosc, Math.sqrt(3) / 2 * R), 'długość ramienia = R·√3/2 (promień wpisany), got ' + dlugosc);
let portyZgodne = true, dlugosciZgodne = true;
for (const [q, r] of [[0, 0], [3, -2], [-4, 5]]) {
  const A = M.axialToWorld(q, r, R);
  for (let d = 0; d < 6; d++) {
    const [dq, dr] = ROAD_DIRS[d];
    const B = M.axialToWorld(q + dq, r + dr, R);
    const pA = roadPortOffset(d, R);
    const pB = roadPortOffset(oppositeDir(d), R);
    if (!near(A.x + pA.x, B.x + pB.x, 1e-9) || !near(A.z + pA.z, B.z + pB.z, 1e-9)) portyZgodne = false;
    if (!near(Math.hypot(pA.x, pA.z), dlugosc, 1e-9)) dlugosciZgodne = false;
  }
}
ok(portyZgodne, 'port kafla == port sąsiada (ten sam punkt świata na wspólnej ściance)');
ok(dlugosciZgodne, 'każdy port leży dokładnie R·√3/2 od środka (środek ścianki, nie wierzchołek)');

// Obrót ramienia: lokalna oś +X po obrocie musi celować w port.
let obrotyOk = true;
for (let d = 0; d < 6; d++) {
  const th = roadPortRotationY(d);
  const p = roadPortOffset(d, 1);
  // obrót wokół Y: (1,0,0) → (cos θ, 0, −sin θ)
  if (!near(Math.cos(th), p.x / roadArmLength(1), 1e-9)) obrotyOk = false;
  if (!near(-Math.sin(th), p.z / roadArmLength(1), 1e-9)) obrotyOk = false;
}
ok(obrotyOk, 'roadPortRotationY kieruje lokalną oś +X ramienia dokładnie w port');

// Proporcje z dokumentu designerskiego (heks 108×60 px, ramię 15 px, węzeł r=11 px).
ok(near(ROAD_ARM_WIDTH_RATIO, 15 / 54), 'szerokość ramienia = 15/54 promienia heksa (14% szerokości)');
ok(near(ROAD_NODE_RADIUS_RATIO, 11 / 54), 'promień węzła = 11/54 promienia heksa (10% szerokości)');
ok(ROAD_NODE_RADIUS_RATIO > ROAD_ARM_WIDTH_RATIO / 2,
  'węzeł szerszy niż ramię — inaczej byłby niewidoczny w skrzyżowaniu');

// --- 8. (f) REKOMPUTACJA DOTYKA DOKŁADNIE 2 KAFLI ------------------------
// Dociągnięcie odcinka do istniejącej sieci JEDNYM stykiem: zmieniają się dwie maski —
// moja i tego jednego sąsiada. Reszta mapy bez zmian.
const poBudowie = roadsAt([[0, 0], [1, 0]]);            // stan JUŻ PO postawieniu drogi na (0,0)
const dotkniete = roadHexesToRefresh(0, 0, poBudowie);
ok(dotkniete.length === 2, '(f) jeden styk z siecią → dokładnie 2 kafle do przerysowania, got ' + dotkniete.length);
ok(dotkniete[0].q === 0 && dotkniete[0].r === 0, '(f) pierwszy dotknięty kafel to ten budowany');
ok(dotkniete[1].q === 1 && dotkniete[1].r === 0, '(f) drugi to TEN sąsiad, z którym powstał styk');

// Sąsiad BEZ drogi nie jest dotykany — nie przeliczamy całej mapy ani nawet całego pierścienia.
ok(roadHexesToRefresh(0, 0, roadsAt([[0, 0]])).length === 1,
  '(f) samotna droga → tylko własny kafel (żaden sąsiad nie ma maski do zmiany)');
ok(roadHexesToRefresh(0, 0, roadsAt([[0, 0], [9, 9]])).length === 1,
  '(f) odległa droga poza pierścieniem nie jest dotykana');

// Zburzenie działa tak samo (stan „po" nie zawiera już drogi na (0,0)).
ok(roadHexesToRefresh(0, 0, roadsAt([[1, 0]])).length === 2,
  '(f) zburzenie drogi też odświeża siebie + sąsiada z drogą');

// Wielokrotny styk: 1 + k, bo KAŻDY sąsiad z drogą zyskuje bit w moją stronę.
const trzyStyki = roadsAt([[0, 0], [1, 0], [0, -1], [-1, 1]]);
ok(roadHexesToRefresh(0, 0, trzyStyki).length === 4,
  '(f) trzy styki → 1+3 kafle (wersja „zawsze 2" zostawiłaby dwóm sąsiadom urwane ramię)');
ok(roadHexesToRefresh(0, 0, roadsAt([[0, 0], ...ROAD_DIRS.map(([dq, dr]) => [dq, dr])])).length === 7,
  '(f) styk ze wszystkich 6 stron → 1+6 kafli');

// MUTACJE: ta sama bateria asercji puszczona na CELOWO zepsutych implementacjach.
// Test jest wart tyle, ile łapie — więc sprawdzamy, że łapie.
function bateriaRekomputacji(fn) {
  const okDwa = fn(0, 0, poBudowie);
  if (okDwa.length !== 2) return false;
  if (!(okDwa[0].q === 0 && okDwa[0].r === 0)) return false;
  if (!okDwa.some(h => h.q === 1 && h.r === 0)) return false;
  if (fn(0, 0, roadsAt([[0, 0]])).length !== 1) return false;      // brak sąsiadów z drogą
  if (fn(0, 0, trzyStyki).length !== 4) return false;              // trzy styki
  return true;
}
ok(bateriaRekomputacji(roadHexesToRefresh) === true, '(f) implementacja przechodzi baterię rekomputacji');

/** MUTANT 1: „aktualizuj tylko siebie" — najbardziej kuszące uproszczenie. */
const mutantSelfOnly = (q, r) => [{ q, r }];
ok(bateriaRekomputacji(mutantSelfOnly) === false,
  '(f/mutacja) update tylko-self ZOSTAJE ZŁAPANY (1 kafel zamiast 2, sąsiad z nieaktualną maską)');

/** MUTANT 2: zawsze cały pierścień, bez warunku „sąsiad ma drogę". */
const mutantCalyPierscien = (q, r) =>
  [{ q, r }, ...ROAD_DIRS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }))];
ok(bateriaRekomputacji(mutantCalyPierscien) === false,
  '(f/mutacja2) „zawsze cały pierścień" ZOSTAJE ZŁAPANY (7 kafli zamiast 2)');

/** MUTANT 3: sami sąsiedzi, bez własnego kafla (własna maska zostałaby nieodświeżona). */
const mutantBezSelf = (q, r, hasRoadAt) => roadHexesToRefresh(q, r, hasRoadAt).slice(1);
ok(bateriaRekomputacji(mutantBezSelf) === false,
  '(f/mutacja3) pominięcie własnego kafla ZOSTAJE ZŁAPANE');

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('road-connectivity-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
