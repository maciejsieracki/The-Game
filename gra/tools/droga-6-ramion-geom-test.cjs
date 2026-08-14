'use strict';
/**
 * droga-6-ramion-geom-test.cjs — GEOMETRIA gwiazdy drogi (R-DROGA-WZOR-6-RAMION, runda 2).
 *
 * PO CO TEN PLIK: `road-connectivity-test.cjs` testuje CZYSTĄ LOGIKĘ maski (map/road-network.ts)
 * i nie dotyka Three.js. Sam plik rysujący, `src/render/droga-6-ramion.ts`, nie miał w repo ANI
 * JEDNEJ asercji — Evaluator (2026-08-14) pokazał, że mutacja „każde ramię obrócone o 30°"
 * (dokładnie pomyłka flat-top ↔ pointy-top, przed którą cała decyzja o wyprowadzeniu portów
 * z axialToWorld miała chronić) przechodziła WSZYSTKIE bramki repo na zielono. Ten test domyka
 * tę klasę błędów.
 *
 * METODA: budujemy prawdziwą `THREE.Group` i mierzymy REALNE wierzchołki `BufferGeometry`
 * po `matrixWorld` — nie ufamy deklaracjom w kodzie ani stałym z modułu logiki.
 *
 * KLUCZOWA ASERCJA (§2): dla każdej z 64 masek i każdego z 6 kierunków liczymy ZASIĘG
 * geometrii wzdłuż wektora do portu. Bit ustawiony → zasięg DOKŁADNIE równy długości ramienia
 * (R·√3/2). Bit nieustawiony → zasięg nie może przekroczyć wartości, jaką daje najbliższe
 * (60°) ramię. To pilnuje KIERUNKU każdego ramienia, nie tylko jego długości.
 *
 * §8 to samosprawdzenie: ta sama bateria puszczona na CELOWO zepsutych geometriach musi
 * zaświecić na czerwono. Test jest wart tyle, ile łapie.
 *
 * Bramka (z katalogu gra/): node tools/droga-6-ramion-geom-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.droga-6-ramion-geom-entry.ts');
const BUNDLE = path.resolve(__dirname, '.droga-6-ramion-geom-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildDrogaGwiazda } from '../src/render/droga-6-ramion';
export * from '../src/map/road-network';
export { axialToWorld, HEX_R } from '../src/render/hexutil';
export { hexRingPointsXZ } from '../src/render/hexShape';
import * as THREE from 'three';
export { THREE };
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: GRA_ROOT,
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});

const M = require(BUNDLE);
const THREE = M.THREE;
const {
  buildDrogaGwiazda, roadPortOffset, roadArmLength, roadMaskArms, roadMaskHasDir,
  ROAD_DIRS, ROAD_MASK_FULL, ROAD_MASK_NONE, ROAD_ARM_WIDTH_RATIO, ROAD_NODE_RADIUS_RATIO,
  axialToWorld, HEX_R, hexRingPointsXZ,
} = M;

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; } else { fail++; console.error('FAIL:', label); } }
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

const TYPY = ['droga', 'droga_brukowana'];

/** Wszystkie wierzchołki grupy w jej układzie lokalnym (po transformacjach dzieci). */
function verts(group) {
  group.updateMatrixWorld(true);
  const out = [];
  const v = new THREE.Vector3();
  group.traverse(o => {
    if (!o.isMesh) return;
    const pos = o.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      out.push({ x: v.x, y: v.y, z: v.z });
    }
  });
  return out;
}
function bbox(vs) {
  const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const v of vs) {
    b.minX = Math.min(b.minX, v.x); b.maxX = Math.max(b.maxX, v.x);
    b.minY = Math.min(b.minY, v.y); b.maxY = Math.max(b.maxY, v.y);
    b.minZ = Math.min(b.minZ, v.z); b.maxZ = Math.max(b.maxZ, v.z);
  }
  return b;
}
function meshCount(g) { let n = 0; g.traverse(o => { if (o.isMesh) n++; }); return n; }

// === 0. PUNKT ODNIESIENIA — liczony NIEZALEŻNIE od modułu ==================
// L = promień wpisany heksa pointy-top o promieniu opisanym 1 = odległość środek → środek ścianki.
const L = Math.sqrt(3) / 2;
const POL_SZER = ROAD_ARM_WIDTH_RATIO / 2;                       // półszerokość ramienia (jedn. HEX_R)
ok(near(roadArmLength(1), L, 1e-12), `roadArmLength(1) = √3/2 (got ${roadArmLength(1)})`);
// Ile MOŻE sięgnąć w kierunku d geometria, w której kierunku d NIE MA ramienia: najdalej dociąga
// róg ramienia sąsiedniego (60°). Liczone z definicji, nie zgadywane.
const ZASIEG_NIEAKTYWNY_MAX = L * Math.cos(Math.PI / 3) + POL_SZER * Math.sin(Math.PI / 3);
ok(ZASIEG_NIEAKTYWNY_MAX < L - 0.25,
  `margines rozróżnialny: ramię 60° sięga ${ZASIEG_NIEAKTYWNY_MAX.toFixed(4)} << ${L.toFixed(4)}`);
ok(ROAD_NODE_RADIUS_RATIO < ZASIEG_NIEAKTYWNY_MAX, 'węzeł nie zaburza pomiaru zasięgu kierunkowego');

// === 1. PORTY = ŚRODKI ŚCIANEK heksa RENDEROWANEGO przez silnik ============
// Dokument designerski podawał piksele heksa FLAT-TOP; silnik rysuje POINTY-TOP. Gdyby ktoś
// przepisał współrzędne dosłownie, ramiona celowałyby w WIERZCHOŁKI i drogi nigdy by się nie
// zeszły — mimo zielonej logiki maski. Ta sekcja przypina orientację do realnego konturu heksa.
const ring = hexRingPointsXZ(1, 0).map(v => ({ x: v.x, z: v.z }));
const srodkiScianek = [];
for (let i = 0; i < 6; i++) {
  const a = ring[i], b = ring[(i + 1) % 6];
  srodkiScianek.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
}
for (let d = 0; d < 6; d++) {
  const p = roadPortOffset(d, 1);
  ok(srodkiScianek.some(m => near(m.x, p.x, 1e-9) && near(m.z, p.z, 1e-9)),
    `port ${d} leży w ŚRODKU ŚCIANKI heksa silnika (${p.x.toFixed(4)}, ${p.z.toFixed(4)})`);
  ok(!ring.some(m => near(m.x, p.x, 1e-9) && near(m.z, p.z, 1e-9)),
    `port ${d} NIE jest wierzchołkiem heksa (to byłby błąd flat-top ↔ pointy-top)`);
}

// === 2. KIERUNEK KAŻDEGO RAMIENIA — sedno testu ============================
/** Zasięg geometrii wzdłuż wektora jednostkowego do portu `d`. */
function zasiegWKierunku(vs, d) {
  const p = roadPortOffset(d, 1);
  const ux = p.x / L, uz = p.z / L;
  let max = -Infinity;
  for (const v of vs) max = Math.max(max, v.x * ux + v.z * uz);
  return max;
}
/** Dwa rogi PŁASKIEGO zakończenia ramienia `d`: port ± prostopadła × półszerokość. */
function rogiZakonczenia(d) {
  const p = roadPortOffset(d, 1);
  const ux = p.x / L, uz = p.z / L;
  const nx = -uz, nz = ux;
  return [
    { x: p.x + nx * POL_SZER, z: p.z + nz * POL_SZER },
    { x: p.x - nx * POL_SZER, z: p.z - nz * POL_SZER },
  ];
}
/**
 * Bateria kierunkowa: dla każdego z 6 kierunków zasięg MUSI wynosić dokładnie L, gdy bit jest
 * ustawiony, i nie więcej niż zasięg ramienia 60°, gdy nie jest. Dodatkowo oba rogi płaskiego
 * zakończenia muszą FIZYCZNIE istnieć wśród wierzchołków. Zwraca null gdy OK, albo opis pierwszej
 * rozbieżności — dzięki temu tej samej funkcji używa §8 (mutacje) bez duplikowania logiki.
 */
function bateriaKierunkowa(vs, mask) {
  for (let d = 0; d < 6; d++) {
    const zasieg = zasiegWKierunku(vs, d);
    if (roadMaskHasDir(mask, d)) {
      if (!near(zasieg, L, 2e-6)) return `maska ${mask} dir${d}: zasięg ${zasieg.toFixed(8)} != ${L.toFixed(8)}`;
      for (const rog of rogiZakonczenia(d)) {
        if (!vs.some(v => near(v.x, rog.x, 2e-6) && near(v.z, rog.z, 2e-6))) {
          return `maska ${mask} dir${d}: brak rogu zakończenia (${rog.x.toFixed(5)}, ${rog.z.toFixed(5)})`;
        }
      }
    } else if (zasieg > ZASIEG_NIEAKTYWNY_MAX + 2e-6) {
      return `maska ${mask} dir${d}: geometria sięga ${zasieg.toFixed(8)} w kierunku BEZ ramienia`;
    }
  }
  return null;
}
for (const typ of TYPY) {
  let pierwszyBlad = null;
  for (let m = 0; m <= ROAD_MASK_FULL; m++) {
    const blad = bateriaKierunkowa(verts(buildDrogaGwiazda(typ, m, 1)), m);
    if (blad && !pierwszyBlad) pierwszyBlad = blad;
  }
  ok(pierwszyBlad === null,
    `${typ}: każde ramię celuje w SWÓJ port i kończy się płasko w jego środku — wszystkie 64 maski`
    + (pierwszyBlad ? ` [${pierwszyBlad}]` : ''));
}
// Ramię startuje w ŚRODKU heksa (bez tego „ramię" mogłoby być samym kikutem przy krawędzi).
for (const typ of TYPY) {
  let startOk = true;
  for (let d = 0; d < 6; d++) {
    const vs = verts(buildDrogaGwiazda(typ, 1 << d, 1));
    const p = roadPortOffset(d, 1);
    const ux = p.x / L, uz = p.z / L;
    let min = Infinity;
    for (const v of vs) min = Math.min(min, v.x * ux + v.z * uz);
    if (!near(min, 0, 2e-6)) startOk = false;
  }
  ok(startOk, `${typ}: ramię biegnie od ŚRODKA heksa (0) do portu, nie od krawędzi`);
}
// Szerokość: nic nie wystaje w bok poza półszerokość ramienia z dokumentu.
for (const typ of TYPY) {
  let szerOk = true;
  for (let d = 0; d < 6; d++) {
    const vs = verts(buildDrogaGwiazda(typ, 1 << d, 1));
    const p = roadPortOffset(d, 1);
    const ux = p.x / L, uz = p.z / L;
    let maxPerp = 0;
    for (const v of vs) maxPerp = Math.max(maxPerp, Math.abs(-v.x * uz + v.z * ux));
    if (!near(maxPerp, POL_SZER, 2e-6)) szerOk = false;
  }
  ok(szerOk, `${typ}: półszerokość ramienia = ${POL_SZER.toFixed(6)} (15/54 z dokumentu), nic nie wystaje`);
}

// === 3. SZEW: port kafla == port sąsiada na REALNYCH pozycjach świata ======
let seamWorst = 0;
for (const [q, r] of [[0, 0], [7, -4], [-3, 6], [12, 12]]) {
  const A = axialToWorld(q, r, HEX_R);
  for (let d = 0; d < 6; d++) {
    const [dq, dr] = ROAD_DIRS[d];
    const opp = ROAD_DIRS.findIndex(([aq, ar]) => aq === -dq && ar === -dr);
    const B = axialToWorld(q + dq, r + dr, HEX_R);
    const pA = roadPortOffset(d, HEX_R), pB = roadPortOffset(opp, HEX_R);
    seamWorst = Math.max(seamWorst, Math.hypot(A.x + pA.x - (B.x + pB.x), A.z + pA.z - (B.z + pB.z)));
  }
}
ok(seamWorst < 1e-12, `szew zerowy dla 4 heksów × 6 kierunków (największy rozjazd ${seamWorst})`);

// === 4. PEŁNA GWIAZDA: bbox, spód na y=0, MAKSYMALNA GRUBOŚĆ ===============
// Liczba 0.0736 stoi też w komentarzu nagłówkowym droga-6-ramion.ts. Poprzednia wersja tego
// komentarza deklarowała „< 0.07", czyli mniej niż realne maksimum (znalezisko Evaluatora
// 2026-08-14) — od teraz rozjazd komentarza z geometrią wywala bramkę.
const GRUBOSC_MAX_BRUK = 0.0736;
for (const typ of TYPY) {
  const b = bbox(verts(buildDrogaGwiazda(typ, ROAD_MASK_FULL, 1)));
  const oczekZ = L * Math.sin(Math.PI / 3) + POL_SZER * Math.cos(Math.PI / 3);
  ok(near(b.maxX, L, 2e-6) && near(b.minX, -L, 2e-6), `${typ}: bbox X = ±${L.toFixed(6)} (ramiona 0 i 3)`);
  ok(near(b.maxZ, oczekZ, 2e-6) && near(b.minZ, -oczekZ, 2e-6), `${typ}: bbox Z = ±${oczekZ.toFixed(6)}`);
  ok(b.minY >= -1e-9, `${typ}: spód nawierzchni dokładnie na y=0 (min Y = ${b.minY})`);
  const oczekY = typ === 'droga_brukowana' ? GRUBOSC_MAX_BRUK : 0.0666;
  ok(near(b.maxY, oczekY, 5e-5),
    `${typ}: najwyższy punkt pełnej gwiazdy = ${oczekY} (got ${b.maxY.toFixed(6)}) — zgodnie z nagłówkiem pliku`);
  // Kontur: żaden wierzchołek nie może wyjść poza obrys heksa (droga nie zachodzi na sąsiada).
  let poza = 0;
  for (const v of verts(buildDrogaGwiazda(typ, ROAD_MASK_FULL, 1))) {
    for (let d = 0; d < 6; d++) {
      const p = roadPortOffset(d, 1);
      if ((v.x * p.x + v.z * p.z) / L > L + 2e-6) { poza++; break; }
    }
  }
  ok(poza === 0, `${typ}: gwiazda mieści się w obrysie heksa (wierzchołki poza konturem: ${poza})`);
}
ok(GRUBOSC_MAX_BRUK < 0.08,
  'droga zostaje POD propsami kafla (budynki/drzewa startują od y=0 i są o rząd wielkości wyższe)');

// === 5. LICZBA RAMION, WĘZEŁ OD 3, PLACYK PRZY MASCE 0 =====================
const MESZE_WEZLA = 2;               // wezel() = 2 cylindry (podstawa + plama/płyta)
for (const typ of TYPY) {
  const meszeRamienia = meshCount(buildDrogaGwiazda(typ, 1, 1));
  let ramionaOk = true, wezelOk = true, placykOk = true;
  for (let m = 0; m <= ROAD_MASK_FULL; m++) {
    const n = roadMaskArms(m).length;
    const oczek = n * meszeRamienia + (n >= 3 || n === 0 ? MESZE_WEZLA : 0);
    const got = meshCount(buildDrogaGwiazda(typ, m, 1));
    if (got !== oczek) {
      if (n === 0) placykOk = false; else if (n >= 3) wezelOk = false; else ramionaOk = false;
    }
  }
  ok(ramionaOk, `${typ}: liczba meshy ramion = popcount maski (wszystkie 64 maski)`);
  ok(wezelOk, `${typ}: węzeł obecny DOKŁADNIE od 3 ramion w górę`);
  ok(placykOk, `${typ}: maska 0 → placyk (świeżo postawiona droga widoczna), nie pustka`);
  ok(meshCount(buildDrogaGwiazda(typ, 0b000101, 1)) === 2 * meszeRamienia, `${typ}: 2 ramiona → BEZ węzła`);
  ok(meshCount(buildDrogaGwiazda(typ, ROAD_MASK_NONE, 1)) === MESZE_WEZLA, `${typ}: sam placyk przy masce 0`);
}

// === 6. WĘZEŁ I SKALOWANIE hexR ===========================================
for (const typ of TYPY) {
  const g = buildDrogaGwiazda(typ, ROAD_MASK_FULL, 1);
  g.updateMatrixWorld(true);
  const meshes = []; g.traverse(o => { if (o.isMesh) meshes.push(o); });
  const podstawaWezla = meshes[meshes.length - MESZE_WEZLA];
  const pos = podstawaWezla.geometry.getAttribute('position');
  const v = new THREE.Vector3();
  let rMax = 0;
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); rMax = Math.max(rMax, Math.hypot(v.x, v.z)); }
  ok(near(rMax, ROAD_NODE_RADIUS_RATIO, 1e-6),
    `${typ}: promień węzła = 11/54 promienia heksa (got ${rMax.toFixed(6)})`);
  ok(rMax > POL_SZER, `${typ}: węzeł szerszy od ramienia — skrzyżowanie czytelne`);
}
for (const R of [0.5, 2, 3.7]) {
  const b = bbox(verts(buildDrogaGwiazda('droga', ROAD_MASK_FULL, R)));
  ok(near(b.maxX, L * R, 2e-6 * Math.max(1, R)), `hexR=${R}: geometria skaluje się liniowo w XZ`);
}

// === 7. PROPORCJE Z DOKUMENTU DESIGNERSKIEGO ==============================
ok(near(ROAD_ARM_WIDTH_RATIO, 15 / 54, 1e-12), 'szerokość ramienia = 15/54 promienia (dokument: ramię 15 px)');
ok(near(ROAD_NODE_RADIUS_RATIO, 11 / 54, 1e-12), 'promień węzła = 11/54 promienia (dokument: węzeł r=11 px)');
ok(near(ROAD_NODE_RADIUS_RATIO / POL_SZER, 11 / 7.5, 1e-12),
  'stosunek promień węzła : półszerokość ramienia zachowany 1:1 z dokumentem (11 : 7,5)');

// === 8. SAMOSPRAWDZENIE — bateria §2 MUSI łapać zepsute geometrie ==========
// Bez tej sekcji §2 mogłaby być tautologią. Mutacje aplikujemy do WYNIKU (transformacja grupy /
// podmiana maski), więc nie ruszamy plików na dysku i nie ma czego po sobie sprzątać.
/** Ta sama transformacja co „arm.rotation.y = roadPortRotationY(dir) + 30°" w źródle: ramiona
 *  wychodzą z (0,0), więc obrót każdego z osobna == obrót całej gwiazdy. */
function obrocGwiazde(g, kat) { g.rotation.y = kat; return g; }
const MASKI_KONTROLNE = [0b000001, 0b000101, 0b010101, ROAD_MASK_FULL];
// Obrót o 60° przeprowadza pełną gwiazdę SAMĄ W SIEBIE (symetria 6-krotna), więc dla
// ROAD_MASK_FULL jest fizycznie nieobserwowalny — i słusznie, bo taki kafel wygląda tak samo.
// Sprawdzamy go na maskach niesymetrycznych, a samą niezmienniczość przypinamy osobno niżej.
const MASKI_BEZ_PELNEJ = MASKI_KONTROLNE.filter(m => m !== ROAD_MASK_FULL);
const MUTACJE = [
  ['M9: każde ramię obrócone o +30° (flat-top ↔ pointy-top)', MASKI_KONTROLNE,
    (typ, m) => obrocGwiazde(buildDrogaGwiazda(typ, m, 1), Math.PI / 6)],
  ['M9b: każde ramię obrócone o −30°', MASKI_KONTROLNE,
    (typ, m) => obrocGwiazde(buildDrogaGwiazda(typ, m, 1), -Math.PI / 6)],
  ['M-obrót o 60° (ramiona w portach SĄSIADA)', MASKI_BEZ_PELNEJ,
    (typ, m) => obrocGwiazde(buildDrogaGwiazda(typ, m, 1), Math.PI / 3)],
  ['M8: ramiona za krótkie (0.9 długości — nie dochodzą do ścianki, szew widoczny)', MASKI_KONTROLNE,
    (typ, m) => { const g = buildDrogaGwiazda(typ, m, 1); g.scale.set(0.9, 1, 0.9); return g; }],
  ['M10: ramiona za szerokie (×1.6 — zakończenie płaskie, ale nie ta szerokość)', MASKI_KONTROLNE,
    (typ, m) => { const g = buildDrogaGwiazda(typ, m, 1); g.scale.set(1.6, 1, 1.6); return g; }],
];
for (const [nazwa, maski, mutant] of MUTACJE) {
  let zlapana = true;
  for (const typ of TYPY) {
    for (const m of maski) {
      if (bateriaKierunkowa(verts(mutant(typ, m)), m) === null) zlapana = false;
    }
  }
  ok(zlapana, `(mutacja) ${nazwa} — ZŁAPANA przez baterię kierunkową`);
}
ok(bateriaKierunkowa(verts(obrocGwiazde(buildDrogaGwiazda('droga', ROAD_MASK_FULL, 1), Math.PI / 3)), ROAD_MASK_FULL) === null,
  '(własność) pełna gwiazda jest niezmiennicza na obrót o 60° — dlatego ta jedna maska nie testuje obrotu');
// Mutacja „ramiona rysowane wg złej maski" (przesunięcie bitów) — geometria poprawna, ale
// w złych kierunkach; bateria porównuje z maską ŻĄDANĄ, więc musi to wyłapać.
let zlaMaskaZlapana = true;
for (const typ of TYPY) {
  for (const m of [0b000001, 0b000101, 0b010101]) {
    const przesunieta = ((m << 1) | (m >> 5)) & ROAD_MASK_FULL;
    if (bateriaKierunkowa(verts(buildDrogaGwiazda(typ, przesunieta, 1)), m) === null) zlaMaskaZlapana = false;
  }
}
ok(zlaMaskaZlapana, '(mutacja) ramiona wg maski przesuniętej o 1 bit — ZŁAPANA (kierunki nie zgadzają się z portami)');
// Kontrola pozytywna: nietknięta geometria MUSI przechodzić — inaczej bateria świeci na czerwono
// zawsze i sekcja 8 nic nie dowodzi.
ok(bateriaKierunkowa(verts(buildDrogaGwiazda('droga_brukowana', ROAD_MASK_FULL, 1)), ROAD_MASK_FULL) === null,
  '(kontrola) nietknięta pełna gwiazda brukowana PRZECHODZI baterię — mutacje wyżej nie są fałszywie dodatnie');

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('droga-6-ramion-geom-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
