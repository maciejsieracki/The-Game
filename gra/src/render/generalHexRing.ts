/**
 * generalHexRing.ts — obwódka „siedmiu hexów" wokół wodza/generała (R-WEB-UI-GENERAL-HEX-RING-OUTLINE-Q1).
 *
 * Kontur to ZEWNĘTRZNY OBRYS sumy 7 hexów: hex wodza + jego 6 sąsiadów (pointy-top, siatka
 * axialToWorld). Obrys wyliczany jest geometrycznie: krawędzie 7 hexów, których para nie
 * występuje dwukrotnie (krawędzie wewnętrzne znoszą się), tworzą pętlę o 18 krawędziach.
 * Pętla jest rozgrubiona do pasa (kwadraty na krawędziach + narożniki miter), leżącego tuż
 * na zewnątrz obrysu — tak, by nie zasłaniał samego wodza.
 *
 * Grubość: `max(baza świata, GENERAL_RING_MIN_PX × rozmiar piksela w świecie)` — przy oddaleniu
 * pas zachowuje co najmniej kilka pikseli ekranu, przy zbliżeniu rośnie razem z kamerą.
 *
 * Moduł czysty (bez DOM/sceny): geometria i przeliczenie grubości, testowalne w Node.
 */
import * as THREE from 'three';
import { axialToWorld, HEX_R } from './hexutil';

/** Przesunięcia axialne 7 hexów: środek + 6 sąsiadów (standardowe kierunki axial). */
export const GENERAL_RING_HEX_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

/** Bazowa grubość pasa (świat) — jak zaznaczenie armii, ~0,12 promienia hexa. */
export const GENERAL_RING_BASE_WIDTH = 0.12 * HEX_R;
/** Minimalna grubość pasa na ekranie (px) — „kilka px", widoczne przy oddaleniu. */
export const GENERAL_RING_MIN_PX = 4;
/** Odstęp pasa od obrysu (świat), żeby nie dotykał krawędzi hexów. */
export const GENERAL_RING_GAP = 0.05 * HEX_R;
/** Wysokość pasa nad terenem (świat) — poza z-fightingiem z kafelkiem. */
export const GENERAL_RING_LIFT = 0.05 * HEX_R;
export const GENERAL_RING_OPACITY = 0.9;

type Pt = { x: number; z: number };

/** 6 narożników pointy-top hexa w płaszczyźnie XZ (ta sama konwencja co hexShape.ts). */
function hexCorners(cx: number, cz: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 3;
    out.push({ x: cx + HEX_R * Math.cos(a), z: cz + HEX_R * Math.sin(a) });
  }
  return out;
}

// Klucz całkowity (bez -0 i błędów zmiennoprzecinkowych): wspólny narożnik dwóch hexów musi dać ten sam klucz.
const keyOf = (p: Pt): string => `${Math.round(p.x * 1e5)},${Math.round(p.z * 1e5)}`;

export interface GeneralRingLoop {
  /** Narożniki obrysu w kolejności pętli (bez powtórzenia pierwszego). */
  points: Pt[];
  /** Jednostkowe normale zewnętrzne krawędzi i (od punktu i do i+1). */
  normals: Pt[];
  /** Wektory miter w narożnikach: m·n_{i-1} = 1 oraz m·n_i = 1. */
  miters: Pt[];
}

let cachedLoop: GeneralRingLoop | null = null;

/** Zewnętrzny obrys 7 hexów (środek w 0,0), policzony raz i zbuforowany. */
export function getGeneralRingLoop(): GeneralRingLoop {
  if (cachedLoop) return cachedLoop;
  const edges = new Map<string, { a: Pt; b: Pt; count: number }>();
  for (const [dq, dr] of GENERAL_RING_HEX_OFFSETS) {
    const c = axialToWorld(dq, dr, HEX_R);
    const corners = hexCorners(c.x, c.z);
    for (let i = 0; i < 6; i++) {
      const a = corners[i]!;
      const b = corners[(i + 1) % 6]!;
      const ka = keyOf(a);
      const kb = keyOf(b);
      const id = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      const e = edges.get(id);
      if (e) e.count++;
      else edges.set(id, { a, b, count: 1 });
    }
  }
  // Krawędź wspólna dwóch hexów występuje dwa razy → znika z obrysu.
  const outer = [...edges.values()].filter((e) => e.count === 1);
  const next = new Map<string, { a: Pt; b: Pt }>();
  for (const e of outer) next.set(keyOf(e.a), e);
  const points: Pt[] = [];
  let cur: { a: Pt; b: Pt } = outer[0]!;
  for (let guard = 0; guard < outer.length; guard++) {
    points.push(cur.a);
    const step = next.get(keyOf(cur.b));
    if (!step) break;
    cur = step;
    if (cur === outer[0]) break;
  }
  const n = points.length;

  // Pole ze znakiem: dla pętli CW normalę zewnętrzną trzeba odwrócić.
  let area2 = 0;
  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    const q = points[(i + 1) % n]!;
    area2 += p.x * q.z - q.x * p.z;
  }
  const orient = area2 >= 0 ? 1 : -1;

  const normals: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    const q = points[(i + 1) % n]!;
    const dx = q.x - p.x;
    const dz = q.z - p.z;
    const len = Math.hypot(dx, dz) || 1;
    // Prawa normala (dz, -dx) dla CCW wskazuje na zewnątrz; orient koryguje CW.
    normals.push({ x: (orient * dz) / len, z: (orient * -dx) / len });
  }

  const miters: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const n1 = normals[(i - 1 + n) % n]!;
    const n2 = normals[i]!;
    const denom = 1 + (n1.x * n2.x + n1.z * n2.z);
    miters.push({ x: (n1.x + n2.x) / denom, z: (n1.z + n2.z) / denom });
  }

  cachedLoop = { points, normals, miters };
  return cachedLoop;
}

export interface GeneralHexRing {
  /** Siatka pasa w płaszczyźnie XZ (y = 0, pozycję nadaje właściciel obiektu). */
  mesh: THREE.Mesh;
  /** Aktualna grubość pasa (świat). */
  readonly width: number;
  /** Przelicza narożniki pasa dla nowej grubości (świat). */
  setWidth(width: number): void;
  dispose(): void;
}

/**
 * Tworzy pas obrysu 7 hexów w kolorze cywilizacji.
 * Pozycje są zapisywane w miejscu przy `setWidth`, bez alokacji nowej geometrii.
 */
export function createGeneralHexRing(color: number, width = GENERAL_RING_BASE_WIDTH): GeneralHexRing {
  const loop = getGeneralRingLoop();
  const n = loop.points.length;
  const positions = new Float32Array(n * 2 * 3 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: GENERAL_RING_OPACITY,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 13;
  // Pas jest tylko wskazówką: nie przechwytuje kliknięć w hexy ani w jednostki.
  mesh.raycast = () => {};

  let current = -1;
  const write = (w: number): void => {
    const inner = GENERAL_RING_GAP;
    const outerOff = GENERAL_RING_GAP + w;
    let o = 0;
    const put = (x: number, z: number): void => {
      positions[o++] = x;
      positions[o++] = 0;
      positions[o++] = z;
    };
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const p = loop.points[i]!;
      const q = loop.points[j]!;
      const mi = loop.miters[i]!;
      const mj = loop.miters[j]!;
      const ai = { x: p.x + mi.x * inner, z: p.z + mi.z * inner };
      const bi = { x: p.x + mi.x * outerOff, z: p.z + mi.z * outerOff };
      const aj = { x: q.x + mj.x * inner, z: q.z + mj.z * inner };
      const bj = { x: q.x + mj.x * outerOff, z: q.z + mj.z * outerOff };
      // Dwa trójkąty na krawędzi: (ai, bi, bj) oraz (ai, bj, aj).
      put(ai.x, ai.z); put(bi.x, bi.z); put(bj.x, bj.z);
      put(ai.x, ai.z); put(bj.x, bj.z); put(aj.x, aj.z);
    }
    geometry.attributes['position']!.needsUpdate = true;
    geometry.computeBoundingSphere();
    current = w;
  };
  write(width);

  return {
    mesh,
    get width() { return current; },
    setWidth(w: number): void {
      if (w === current) return;
      write(w);
    },
    dispose(): void {
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * Grubość pasa (świat) przy danej odległości kamery: co najmniej `minPx` pikseli ekranu.
 * `camDist` — odległość kamery od ogniska, `fovDeg` — pionowy FOV, `viewportH` — wysokość w px.
 */
export function generalRingWorldWidth(
  camDist: number,
  fovDeg: number,
  viewportH: number,
  minPx = GENERAL_RING_MIN_PX,
): number {
  if (!(viewportH > 0) || !(camDist > 0) || !(fovDeg > 0)) return GENERAL_RING_BASE_WIDTH;
  const worldPerPx = (2 * camDist * Math.tan((fovDeg * Math.PI) / 360)) / viewportH;
  return Math.max(GENERAL_RING_BASE_WIDTH, minPx * worldPerPx);
}

/**
 * Wysokość płaszczyzny pasa (świat) nad terenem 7 hexów obrysu: najwyższy z ich wierzchołków
 * terenu + odstęp. Pas leży PONAD sąsiednim wzgórzem/górą, więc nie jest przysłaniany przez teren
 * z obrysu (bazowa wysokość wodza mogłaby leżeć niżej niż wyższy sąsiad).
 * `topYs` — wysokości wierzchołka terenu dla 7 hexów (GENERAL_RING_HEX_OFFSETS); niepoprawne wartości są pomijane.
 */
export function generalRingY(topYs: ReadonlyArray<number>): number {
  let top = 0;
  let any = false;
  for (const y of topYs) {
    if (!Number.isFinite(y)) continue;
    top = any ? Math.max(top, y) : y;
    any = true;
  }
  return (any ? top : 0) + GENERAL_RING_LIFT;
}
