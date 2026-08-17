/**
 * rangeOverlay.ts — wizualizacja zasięgu kultury / religii na mapie 3D (MAPA).
 */
import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { GAME_MAP_RENDER_STYLE, terrainSurfaceTopY } from './mapRenderStyle';
import {
  computeTerritoryBorderLoops,
  type BorderLoopPoint,
} from '../map/territory-border';

const HEX_DIRS: { dq: number; dr: number }[] = [
  { dq: 1, dr: 0 },
  { dq: 1, dr: -1 },
  { dq: 0, dr: -1 },
  { dq: -1, dr: 0 },
  { dq: -1, dr: 1 },
  { dq: 0, dr: 1 },
];

/** Wierzchołki heksa — ta sama orientacja co hexCorners / CylinderGeometry(6) w scene.ts (rog 0 w +Z). */
function hexVertices(cx: number, y: number, cz: number, R: number): THREE.Vector3[] {
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    verts.push(new THREE.Vector3(
      cx + R * Math.sin(a),
      y,
      cz + R * Math.cos(a),
    ));
  }
  return verts;
}

function hexTopY(map: GameMap, key: string, yOffset: number): number {
  const hex = map.hexes[key];
  const teren = hex?.terenBazowy ?? TerenBazowy.Laka;
  return terrainSurfaceTopY(teren, GAME_MAP_RENDER_STYLE, yOffset);
}

function buildTintMesh(
  map: GameMap,
  hexKeys: Set<string>,
  color: number,
  opacity: number,
  yOffset: number,
): THREE.InstancedMesh | null {
  const hexes: Array<{ q: number; r: number; y: number }> = [];
  for (const key of hexKeys) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    hexes.push({ q, r, y: hexTopY(map, key, yOffset) });
  }
  if (hexes.length === 0) return null;

  const geo = new THREE.CylinderGeometry(HEX_R * 0.97, HEX_R * 0.97, 0.002, 6);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, hexes.length);
  mesh.renderOrder = 3;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < hexes.length; i++) {
    const { q, r, y } = hexes[i]!;
    const { x, z } = axialToWorld(q, r, HEX_R);
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function buildBorderLine(
  map: GameMap,
  hexKeys: Set<string>,
  color: number,
  opacity: number,
  yOffset: number,
  flatY?: number,
): THREE.LineSegments | null {
  const positions: number[] = [];
  const borderY = flatY ?? terrainSurfaceTopY(TerenBazowy.Laka, GAME_MAP_RENDER_STYLE, yOffset);

  for (const key of hexKeys) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    const { x: cx, z: cz } = axialToWorld(q, r, HEX_R);
    const verts = hexVertices(cx, borderY, cz, HEX_R);

    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i]!;
      const nq = q + dir.dq;
      const nr = r + dir.dr;
      if (!hexKeys.has(`${nq},${nr}`)) {
        const va = verts[(i + 1) % 6]!;
        const vb = verts[(i + 2) % 6]!;
        positions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
      }
    }
  }

  if (positions.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = 5;
  return lines;
}

function edgeOutwardNormal(
  cx: number,
  cz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): { nx: number; nz: number } {
  const edx = bx - ax;
  const edz = bz - az;
  const len = Math.hypot(edx, edz) || 1;
  let nx = -edz / len;
  let nz = edx / len;
  const midx = (ax + bx) * 0.5;
  const midz = (az + bz) * 0.5;
  if ((midx - cx) * nx + (midz - cz) * nz < 0) {
    nx = -nx;
    nz = -nz;
  }
  return { nx, nz };
}

/** Szerszy półprzezroczysty pas wzdłuż zewnętrznych krawędzi heksów (czytelniejszy niż cienka linia). */
function buildBorderBandMesh(
  map: GameMap,
  hexKeys: Set<string>,
  color: number,
  opacity: number,
  yOffset: number,
  bandWidth: number,
): THREE.Mesh | null {
  if (bandWidth <= 0) return null;
  const positions: number[] = [];
  const indices: number[] = [];
  let vi = 0;

  for (const key of hexKeys) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    const hexY = hexTopY(map, key, yOffset);
    const { x: cx, z: cz } = axialToWorld(q, r, HEX_R);
    const verts = hexVertices(cx, hexY, cz, HEX_R);

    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i]!;
      const nq = q + dir.dq;
      const nr = r + dir.dr;
      if (hexKeys.has(`${nq},${nr}`)) continue;

      const va = verts[(i + 1) % 6]!;
      const vb = verts[(i + 2) % 6]!;
      const { nx, nz } = edgeOutwardNormal(cx, cz, va.x, va.z, vb.x, vb.z);
      const ax0 = va.x;
      const az0 = va.z;
      const bx0 = vb.x;
      const bz0 = vb.z;
      const ax1 = ax0 + nx * bandWidth;
      const az1 = az0 + nz * bandWidth;
      const bx1 = bx0 + nx * bandWidth;
      const bz1 = bz0 + nz * bandWidth;
      const y = hexY + 0.004;

      positions.push(
        ax0, y, az0,
        bx0, y, bz0,
        bx1, y, bz1,
        ax1, y, az1,
      );
      indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
      vi += 4;
    }
  }

  if (positions.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 6;
  return mesh;
}

export interface RangeOverlayStyle {
  tintColor: number;
  tintOpacity: number;
  borderColor: number;
  borderOpacity: number;
  /** Grubość pasa na zewnętrznych krawędziach (world units); 0 = cienka linia. */
  borderBandWidth?: number;
  yOffset?: number;
  /**
   * Rysuj z `depthTest: false` — warstwa jest widoczna także tam, gdzie bryła terenu
   * wystaje ponad wierzch pryzmu heksa (Wzgórza, Góry). Domyślnie `false`, więc kultura
   * i religia zachowują dotychczasowe zachowanie co do piksela.
   * / EN: draw with `depthTest: false` so the layer stays visible where the terrain body
   * rises above the hex prism top (Hills, Mountains). Defaults to false, so the culture and
   * religion overlays keep their current behaviour pixel for pixel.
   */
  alwaysOnTop?: boolean;
}

/**
 * Kolejność rysowania warstwy `alwaysOnTop`: PONAD terenem i warstwami zasięgu (renderOrder
 * 3/5/6) oraz łukami tras handlowych (7), ale PONIŻEJ żetonów jednostek (10/12) i etykiet
 * miast (18/20) — inaczej półprzezroczysta płachta przymgliłaby czytelność liczb na plakietkach.
 * / EN: draw order for the `alwaysOnTop` layer: above terrain, range overlays (3/5/6) and trade
 * arcs (7), but below unit tokens (10/12) and city labels (18/20), which must stay crisp.
 */
const ALWAYS_ON_TOP_TINT_ORDER = 8;
const ALWAYS_ON_TOP_BORDER_ORDER = 9;

/** Wyłącza test głębi i przypina kolejność rysowania dla jednego obiektu warstwy. */
function applyAlwaysOnTop(obj: THREE.Object3D, renderOrder: number): void {
  const mesh = obj as THREE.Mesh;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const m of mats) {
    if (m) (m as THREE.Material).depthTest = false;
  }
  obj.renderOrder = renderOrder;
}

export const CULTURE_RANGE_STYLE: RangeOverlayStyle = {
  tintColor: 0xcc66ff,
  tintOpacity: 0.24,
  borderColor: 0xee99ff,
  borderOpacity: 0.85,
  yOffset: 0.05,
};

export const RELIGION_RANGE_STYLE: RangeOverlayStyle = {
  tintColor: 0xffb040,
  tintOpacity: 0.22,
  borderColor: 0xffd070,
  borderOpacity: 0.85,
  yOffset: 0.055,
};

/**
 * R-KOPALNIA-PODSWIETLENIE-HEKSOW-Q1 (Maciej): po wybraniu w trybie budowy konkretnego typu
 * KOPALNI (miedzi / żelaza / cyny / złota) wszystkie heksy terytorium, na których TĘ kopalnię
 * da się postawić, świecą na jasnoniebiesko z przezroczystością 30 %.
 *
 * `alwaysOnTop` NIE jest ozdobnikiem, tylko warunkiem widoczności tej konkretnej warstwy:
 * wszystkie cztery kopalnie kwalifikują się WYŁĄCZNIE na Wzgórzach i Górach (TERRAIN_ALLOW
 * w map/improvement-build.ts), a bryła wzgórza wyrasta 0,392 j nad wierzch pryzmu heksa przy
 * podstawie do 0,92·HEX_R, góra zaś 1,10–1,25 j przy podstawie 0,87·HEX_R (stałe
 * WZGORZE_SZCZYT_Y / GORA_APEX_Y / *_FOOTPRINT_R w render/teren-gory-wzgorza.ts). Płaski krążek
 * o promieniu 0,97·HEX_R położony na wierzchu pryzmu zniknąłby więc w całości WEWNĄTRZ tej bryły
 * — dokładnie to spotyka istniejące, ogólne podświetlenie `UnitRenderer.setHighlight`
 * (krążek 0,88·HEX_R, 0,005·HEX_R nad pryzmem), przez co dla kopalń nie widać dziś niczego.
 * / EN: the `alwaysOnTop` flag is a visibility requirement, not decoration: all four mines
 * qualify on Hills and Mountains only, whose bodies rise 0.392 / 1.10–1.25 world units above the
 * hex prism top over a footprint of 0.92 / 0.87·HEX_R. A flat disc laid on the prism top is
 * swallowed whole by that body — which is exactly what happens to the existing generic
 * `UnitRenderer.setHighlight` disc, so mines show no highlight at all today.
 */
export const MINE_ELIGIBLE_TINT_COLOR = 0x66ccff;
/** Przezroczystość 30 % — dokładnie wartość podana przez właściciela, bez zaokrąglania. */
export const MINE_ELIGIBLE_TINT_OPACITY = 0.30;
export const MINE_ELIGIBLE_STYLE: RangeOverlayStyle = {
  tintColor: MINE_ELIGIBLE_TINT_COLOR,
  tintOpacity: MINE_ELIGIBLE_TINT_OPACITY,
  borderColor: 0x99ddff,
  borderOpacity: 0.9,
  yOffset: 0.06,
  alwaysOnTop: true,
};

/**
 * Obrys granicy państwa — szeroki pas (world units), nie cienka linia WebGL 1px.
 *
 * R-GRANICE-STYK-CZYTELNOSC-Q1 = B (Maciej, 2026-08-14): ta sama liczba jest DZIŚ także
 * WSUNIĘCIEM pasa tożsamości do wewnątrz terytorium. Wcześniej pas szedł na ZEWNĄTRZ, czyli
 * na ziemię sąsiada — a że sąsiadujące terytoria dzielą tę SAMĄ polilinię obwodu (heksy
 * stykają się krawędzią, szczeliny nie ma), pas jednej cywilizacji lądował dokładnie tam,
 * gdzie pas drugiej. To NIE był z-fighting (materiały mają `depthWrite: false`), tylko
 * deterministyczne przesłanianie zależne od sortowania przezroczystości, czyli od położenia
 * kamery: kolor tożsamościowy sąsiada potrafił zniknąć na styku całkowicie. Dziś CAŁY pas
 * leży po własnej stronie — tożsamość [0 … 0,45] w głąb od linii granicy, relacja
 * [0,45 … 0,675]. Szerokości i proporcja 2:1 bez zmian; zmieniła się wyłącznie STRONA.
 * Wsunięcia nie są osobnymi stałymi — `buildTerritoryBorderGroup` wyprowadza je z szerokości,
 * które dostał, więc nie ma drugiego źródła prawdy do rozjechania się.
 * / EN: this same number is now ALSO the identity band's inward inset. The band used to grow
 * OUTWARD, i.e. onto the neighbour's land; since adjacent territories share the very same
 * boundary polyline, one civ's band landed exactly where the other's did. Not z-fighting
 * (materials use `depthWrite: false`) but deterministic, camera-dependent occlusion that could
 * hide a neighbour's identity colour completely. The whole belt now sits on its own side:
 * identity [0 … 0.45] inward, relation [0.45 … 0.675]. Widths and the 2:1 ratio unchanged.
 *
 * RUNDA 2: samo odwrócenie strony (`4de64fa8`) nie wystarczyło — o tym, GDZIE jest „wewnątrz",
 * decydowało porównanie ze środkiem pętli, poprawne wyłącznie dla kształtów wypukłych, więc na
 * realnych (niewypukłych) terytoriach część pasa i tak lądowała u sąsiada, a przy enklawie —
 * w enklawie. Szczegóły przy `segmentOutwardNormal` (skąd bierze się kierunek),
 * `insetBorderLoop` (co się dzieje we wklęsłej kieszeni) i `appendBandBetweenLoops` (dlaczego
 * pas jest wstęgą między dwiema wsuniętymi pętlami, a nie pasem ze ściętymi narożami).
 * / EN: round 2 — flipping the side was not enough; "inside" was decided by a centroid test
 * valid only for convex shapes. See segmentOutwardNormal, insetBorderLoop, appendBandBetweenLoops.
 */
export const TERRITORY_BORDER_BAND_WIDTH = 0.45;
/**
 * R-GRANICE-RELACJA-DYPLOMATYCZNA-Q1 (Maciej, 2026-08-14): DRUGA obwódka, „o połowę
 * cieńsza" od pasa tożsamości — stąd dokładnie połowa `TERRITORY_BORDER_BAND_WIDTH`,
 * a nie osobna liczba do rozjechania się.
 * / EN: SECOND band, "half as thin" as the identity one — hence exactly half of
 * TERRITORY_BORDER_BAND_WIDTH, not a separate drifting constant.
 */
export const TERRITORY_RELATION_BAND_WIDTH = TERRITORY_BORDER_BAND_WIDTH / 2;
/** Jednolita przezroczystość pasa granicy terytorium. */
export const TERRITORY_BORDER_OPACITY = 0.7;
export const TERRITORY_BORDER_Y_OFFSET = 0.042;
/** Podniesienie pasa tożsamości nad wspólną płaszczyznę obwodu. / EN: identity band y bump. */
export const TERRITORY_BORDER_Y_BUMP = 0.004;
/**
 * Pas relacji wyżej od pasa tożsamości — oba stykają się wzdłuż wspólnej linii (0,45 w głąb
 * terytorium), a Three.js sortuje przezroczystość po głębokości środka bryły otaczającej,
 * więc ta różnica przechyla sortowanie w stronę powtarzalnej kolejności rysowania.
 * / EN: relation band sits above the identity band; they meet along a shared line, and
 * Three.js sorts transparency by bounding-sphere depth, so this delta pins the draw order.
 */
export const TERRITORY_RELATION_Y_BUMP = 0.008;

/**
 * Kierunek „na zewnątrz terytorium" dla segmentu obwodu A→B — wyłącznie z KIERUNKU OBIEGU
 * pętli, bez porównywania z czymkolwiek.
 *
 * Dlaczego stała normalna, a nie porównanie ze środkiem pętli (tak było do `4de64fa8`
 * włącznie): heurystyka „normalna ma wskazywać od centroidu" jest poprawna tylko dla
 * kształtów WYPUKŁYCH. Realne terytoria wypukłe prawie nigdy nie są — na 44 tys. segmentów
 * losowych spójnych klastrów 7–40 heksów centroid odwracał znak na ~20 % krawędzi, a że
 * `insetBorderLoop` używa tej samej funkcji, pas wsuwał się tam w złą stronę i lądował
 * u sąsiada. Kontrakt orientacji zapewnia `collectTerritoryBoundaryEdges`: każda krawędź
 * obwodu jest zapisywana kanonicznie jako róg (dir+1) → (dir+2) swojego heksa, a
 * `traceTerritoryBoundaryLoops` łączy je „głowa do ogona", więc CAŁA pętla ma jeden
 * kierunek obiegu i terytorium leży zawsze po tej samej jego stronie.
 *
 * Dlaczego NIE znak pola powierzchni (shoelace): pętla wokół dziury/enklawy ma pole
 * przeciwnego znaku niż pętla zewnętrzna (zmierzone: −18,187 vs +2,598 dla pierścienia
 * 6 heksów), ale „na zewnątrz terytorium" znaczy dla niej „w głąb dziury" — czyli obie
 * pętle potrzebują DOKŁADNIE TEJ SAMEJ reguły. Wybieranie strony po znaku pola odwróciłoby
 * dziury i tylko przeniosło błąd. Zweryfikowane próbkowaniem membership: 0 błędów na
 * 44 tys. segmentów, w tym pierścienie z dziurą, kształty wielowyspowe i styki rogiem.
 * / EN: outward direction taken solely from the loop's winding — no centroid, no signed area.
 * The centroid heuristic only holds for convex shapes and flipped ~20 % of edges on real
 * territories. Signed area is wrong too: hole loops wind the opposite way yet need the very
 * same rule, because "outside the territory" means "into the hole" for them. Orientation is
 * guaranteed upstream by collectTerritoryBoundaryEdges' canonical edge direction.
 */
function segmentOutwardNormal(
  ax: number,
  az: number,
  bx: number,
  bz: number,
): { nx: number; nz: number } {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz) || 1;
  return { nx: -dz / len, nz: dx / len };
}

/** Odległość punktu od CAŁEGO obwodu terytorium (wszystkie pętle, także wokół enklaw). */
function distanceToBoundary(px: number, pz: number, loops: BorderLoopPoint[][]): number {
  let best = Infinity;
  for (const loop of loops) {
    const n = loop.length;
    for (let i = 0; i < n; i++) {
      const a = loop[i]!;
      const b = loop[(i + 1) % n]!;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const l2 = dx * dx + dz * dz;
      let t = l2 > 0 ? ((px - a.x) * dx + (pz - a.z) * dz) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = px - (a.x + dx * t);
      const ez = pz - (a.z + dz * t);
      const d2 = ex * ex + ez * ez;
      if (d2 < best) best = d2;
    }
  }
  return Math.sqrt(best);
}

/**
 * Przesuwa pętlę obwodu DO WEWNĄTRZ terytorium o `inset` (world units) — mitra dokładna,
 * więc każdy nowy wierzchołek leży w odległości równo `inset` od OBU sąsiednich krawędzi
 * oryginału (przesunięta pętla jest do niego równoległa). Uśrednianie normalnych „przez 2"
 * (tak budował zewnętrzną krawędź pasa dawny `appendBorderBandLoop`) dałoby tu 0,75·inset
 * w narożach. Mianownik `1 + n_prev·n_next` wynosi dla siatki heksów zawsze 1,5 (normalne
 * skręcają o ±60°); ogranicznik chroni tylko przed teoretycznym zwrotem o 180°, gdzie mitra
 * ucieka do nieskończoności. `allLoops` to WSZYSTKIE pętle obwodu tego terytorium (razem
 * z pętlami wokół enklaw) — potrzebne do przycięcia opisanego niżej.
 * / EN: shifts the boundary loop INWARD by `inset` using an exact miter, so every new vertex
 * keeps distance exactly `inset` from BOTH adjacent original edges. `allLoops` carries every
 * boundary loop of the territory (enclave loops included) for the clamp described below.
 */
function insetBorderLoop(
  loop: BorderLoopPoint[],
  inset: number,
  allLoops: BorderLoopPoint[][],
): BorderLoopPoint[] {
  if (inset === 0) return loop;
  const n = loop.length;
  const out: BorderLoopPoint[] = new Array(n);
  const EPS = 1e-4;
  for (let i = 0; i < n; i++) {
    const prev = loop[(i + n - 1) % n]!;
    const cur = loop[i]!;
    const next = loop[(i + 1) % n]!;
    const a = segmentOutwardNormal(prev.x, prev.z, cur.x, cur.z);
    const b = segmentOutwardNormal(cur.x, cur.z, next.x, next.z);
    const denom = Math.max(1 + (a.nx * b.nx + a.nz * b.nz), 0.5);
    // Kierunek dwusiecznej w głąb terytorium (niejednostkowy — długość niesie skalę mitry).
    // / EN: inward bisector direction (non-unit — its length carries the miter scale).
    const bx = -(a.nx + b.nx) / denom;
    const bz = -(a.nz + b.nz) / denom;
    let k = inset;
    // Mitra zakłada, że po wsunięciu wierzchołek nadal jest oddalony od obwodu o `inset`.
    // W WKLĘSŁYM narożu wąskiego terytorium to nieprawda: dwa takie wierzchołki jadą ku sobie
    // i przeskakują przez siebie (dla terytorium 1×2 każdy o 0,779 j przy dzielącej ich
    // odległości 1,0 j), a wtedy pas relacji wchodzi w strefę pasa tożsamości i przykrywa
    // kolor cywilizacji (nota N4 Evaluatora do `4de64fa8`). Dlatego wsunięcie jest przycinane
    // do rzeczywistej odległości od obwodu: gdy pełna mitra już do niej nie sięga, bierzemy
    // największe wsunięcie, które trzyma dystans `inset`, a jeśli nawet ono nie istnieje
    // (kieszeń płytsza niż `inset`) — wsunięcie o największym możliwym dystansie, czyli punkt
    // na grzbiecie kieszeni. Kształty bez wklęsłych naroży nie płacą za to nic poza jednym
    // sprawdzeniem: pełna mitra jest tam dokładna i warunek przechodzi od razu.
    // / EN: the miter assumes the inset vertex still keeps distance `inset` from the boundary.
    // In a concave corner of a narrow territory it does not: two such vertices travel toward
    // each other and cross over, letting the relation band invade the identity band's zone.
    // So the inset is clamped to the real distance-to-boundary — the largest shift that still
    // keeps `inset`, or the ridge point of the pocket when no such shift exists.
    if (distanceToBoundary(cur.x + bx * k, cur.z + bz * k, allLoops) < inset - EPS) {
      const STEPS = 24;
      let bestT = 0;
      let bestD = -Infinity;
      let keepT = -1;
      for (let s = 1; s <= STEPS; s++) {
        const t = (inset * s) / STEPS;
        const d = distanceToBoundary(cur.x + bx * t, cur.z + bz * t, allLoops);
        if (d > bestD) { bestD = d; bestT = t; }
        if (d >= inset - EPS) keepT = t;
      }
      if (keepT >= 0) {
        // Doprecyzowanie bisekcją w ostatnim przedziale, w którym dystans jeszcze się trzymał.
        // / EN: refine by bisection inside the last interval that still held the distance.
        let lo = keepT;
        let hi = Math.min(keepT + inset / STEPS, inset);
        for (let s = 0; s < 12; s++) {
          const mid = (lo + hi) / 2;
          if (distanceToBoundary(cur.x + bx * mid, cur.z + bz * mid, allLoops) >= inset - EPS) lo = mid;
          else hi = mid;
        }
        k = lo;
      } else {
        k = bestT;
      }
    }
    out[i] = { x: cur.x + bx * k, z: cur.z + bz * k };
  }
  return out;
}

/**
 * Wstęga między dwiema pętlami o tej samej liczbie wierzchołków — `outer` (bliżej linii
 * granicy) i `inner` (głębiej w terytorium). Obie powstają z tego samego obwodu przez
 * `insetBorderLoop`, więc wierzchołek `i` jednej odpowiada wierzchołkowi `i` drugiej i quady
 * sąsiadują pełnymi krawędziami — kontur jest ciągły, bez klinów do domykania.
 *
 * Zastąpiło ścięcie naroży (bevel: `(nPrev + nNext) · 0,5 · bandWidth`) plus trójkąty
 * domykające. Bevel sięgał w narożu tylko `0,75 · bandWidth` prostopadle, co po decyzji
 * `R-GRANICE-STYK-CZYTELNOSC-Q1` = B (pas w głąb własnego terytorium) wypadło od strony
 * LINII GRANICY i zostawiało tam goły korytarz terenu (nota N2 Evaluatora do `4de64fa8`:
 * średnio 0,0938 j, maks. 0,1505 j szczeliny). Wcześniej to samo ścięcie leżało po stronie
 * sąsiada i było nieszkodliwe. Trójkąty domykające dotykały linii granicy tylko trzema
 * izolowanymi wierzchołkami, więc asercje mierzące minimum po WIERZCHOŁKACH przechodziły,
 * mimo że POWIERZCHNIA pasa linii nie dotykała.
 * / EN: ribbon between two loops derived from the same boundary by insetBorderLoop, so vertex
 * i matches vertex i and quads share full edges — no corner wedges left to patch. Replaces the
 * bevelled outer edge (which only reached 0.75·bandWidth at corners) plus its closing
 * triangles; after the band moved inward that bevel sat on the border-line side and left a
 * bare corridor of terrain there.
 */
function appendBandBetweenLoops(
  outer: BorderLoopPoint[],
  inner: BorderLoopPoint[],
  y: number,
  positions: number[],
  indices: number[],
  viRef: { v: number },
): void {
  const n = outer.length;
  if (n < 3 || inner.length !== n) return;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a0 = outer[i]!;
    const a1 = outer[j]!;
    const b1 = inner[j]!;
    const b0 = inner[i]!;
    const vi = viRef.v;
    positions.push(
      a0.x, y, a0.z,
      a1.x, y, a1.z,
      b1.x, y, b1.z,
      b0.x, y, b0.z,
    );
    indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
    viRef.v += 4;
  }
}

/**
 * Szeroki pas wzdłuż zamkniętych konturów terytorium (polyline loops, nie segmenty per heks).
 * flatY — jedna wysokość dla całego obwodu (bez szczelin między heksami o różnym terenie).
 */
function buildTerritoryBorderMesh(
  map: GameMap,
  hexKeys: Set<string>,
  color: number,
  bandWidth: number,
  flatY: number,
  opacity: number,
  /**
   * O ile pętla obwodu jest wsunięta DO WEWNĄTRZ, zanim wyrośnie na niej pas — pas zajmuje
   * więc [inset − bandWidth … inset] licząc w głąb terytorium od linii granicy.
   * / EN: how far the loop is inset before the band grows on it — the band occupies
   * [inset − bandWidth … inset] measured inward from the border line.
   */
  inset: number,
  /** Podniesienie nad wspólną płaszczyznę obwodu. / EN: lift above the shared loop plane. */
  yBump: number = TERRITORY_BORDER_Y_BUMP,
): THREE.Mesh | null {
  if (bandWidth <= 0) return null;
  const y = flatY + yBump;

  const hexCenter = (q: number, r: number): { x: number; z: number } | null => {
    const hex = map.hexes[`${q},${r}`];
    if (!hex) return null;
    return axialToWorld(q, r, HEX_R);
  };

  const loops = computeTerritoryBorderLoops(hexKeys, hexCenter);
  if (loops.length === 0) return null;

  const positions: number[] = [];
  const indices: number[] = [];
  const viRef = { v: 0 };

  for (const loop of loops) {
    // Pas zajmuje [inset − bandWidth … inset] w głąb od linii granicy: obie jego krawędzie to
    // ta sama pętla obwodu, wsunięta o te dwie głębokości.
    // / EN: the band spans [inset − bandWidth … inset] inward — both edges are the same
    // boundary loop, inset by those two depths.
    appendBandBetweenLoops(
      insetBorderLoop(loop, inset - bandWidth, loops),
      insetBorderLoop(loop, inset, loops),
      y, positions, indices, viRef,
    );
  }

  if (positions.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 6;
  return mesh;
}

/**
 * Obrys granicy terytorium per właściciel: pas TOŻSAMOŚCI w kolorze cywilizacji (`colorFn`)
 * przy samej linii granicy, plus — gdy podano `relationColorFn` — pas RELACJI, o połowę
 * węższy, tuż za nim (R-GRANICE-RELACJA-DYPLOMATYCZNA-Q1). Kolejność czytania od granicy
 * w głąb (tożsamość → relacja) jest ta sama co przed R-GRANICE-STYK-CZYTELNOSC-Q1 = B;
 * zmieniła się wyłącznie STRONA: cały pas leży teraz W ŚRODKU własnego terytorium, więc
 * na styku dwóch cywilizacji żadna nie rysuje po ziemi drugiej i obie są widoczne
 * niezależnie od kąta kamery. Oba pasy wyrastają z tych samych pętli
 * `computeTerritoryBorderLoops`, tylko wsuniętych na różną głębokość — nie mogą się rozjechać.
 * / EN: per-owner territory border: IDENTITY band in the civ color right at the border line,
 * then — when `relationColorFn` is given — the half-width RELATION band just behind it. The
 * outside-in reading order is unchanged; only the SIDE changed (R-GRANICE-STYK-CZYTELNOSC-Q1
 * = B): the whole belt now sits INSIDE its own territory, so at a two-civ contact neither
 * paints over the other's land and both stay visible from any camera angle. Both bands grow
 * from the same boundary loops, only inset by different amounts, so they cannot drift apart.
 */
export function buildTerritoryBorderGroup(
  map: GameMap,
  hexKeysByOwner: Map<number, Set<string>>,
  colorFn: (ownerId: number) => number,
  bandWidth = TERRITORY_BORDER_BAND_WIDTH,
  opacity = TERRITORY_BORDER_OPACITY,
  relationColorFn?: (ownerId: number) => number,
  relationBandWidth = bandWidth / 2,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'territory-border-overlay';
  const yOff = TERRITORY_BORDER_Y_OFFSET;
  const flatBorderY = terrainSurfaceTopY(TerenBazowy.Laka, GAME_MAP_RENDER_STYLE, yOff + 0.008);

  for (const [ownerId, hexKeys] of hexKeysByOwner) {
    if (hexKeys.size === 0) continue;
    const border = buildTerritoryBorderMesh(
      map,
      hexKeys,
      colorFn(ownerId),
      bandWidth,
      flatBorderY,
      opacity,
      bandWidth,
      TERRITORY_BORDER_Y_BUMP,
    );
    if (border) {
      border.name = `territory-border-${ownerId}`;
      group.add(border);
    }
    if (!relationColorFn) continue;
    const relation = buildTerritoryBorderMesh(
      map,
      hexKeys,
      relationColorFn(ownerId),
      relationBandWidth,
      flatBorderY,
      opacity,
      bandWidth + relationBandWidth,
      TERRITORY_RELATION_Y_BUMP,
    );
    if (relation) {
      relation.name = `territory-relation-${ownerId}`;
      group.add(relation);
    }
  }
  return group;
}

/** Buduje grupę obiektów 3D (tint + obrys) dla podanego zbioru heksów. */
export function buildRangeOverlayGroup(
  map: GameMap,
  hexKeys: Set<string>,
  style: RangeOverlayStyle,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'range-overlay';
  const yOff = style.yOffset ?? 0.05;
  const flatBorderY = terrainSurfaceTopY(TerenBazowy.Laka, GAME_MAP_RENDER_STYLE, yOff + 0.008);
  const onTop = style.alwaysOnTop === true;
  const tint = buildTintMesh(map, hexKeys, style.tintColor, style.tintOpacity, yOff);
  if (tint) {
    if (onTop) applyAlwaysOnTop(tint, ALWAYS_ON_TOP_TINT_ORDER);
    group.add(tint);
  }
  const bandW = style.borderBandWidth ?? 0;
  if (bandW > 0) {
    const band = buildBorderBandMesh(map, hexKeys, style.borderColor, style.borderOpacity, yOff + 0.006, bandW);
    if (band) {
      if (onTop) applyAlwaysOnTop(band, ALWAYS_ON_TOP_BORDER_ORDER);
      group.add(band);
    }
  } else {
    const border = buildBorderLine(map, hexKeys, style.borderColor, style.borderOpacity, yOff + 0.008, flatBorderY);
    if (border) {
      if (onTop) applyAlwaysOnTop(border, ALWAYS_ON_TOP_BORDER_ORDER);
      group.add(border);
    }
  }
  return group;
}

/** Usuwa grupę z sceny i zwalnia geometrię/materiały. */
export function disposeRangeOverlayGroup(group: THREE.Group | null): void {
  if (!group) return;
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (m) (m as THREE.Material).dispose();
    }
  });
  group.clear();
}
