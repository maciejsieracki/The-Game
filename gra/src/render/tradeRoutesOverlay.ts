/**
 * tradeRoutesOverlay.ts — E7 (epik Handel): wizualizacja aktywnych szlaków handlowych
 * na mapie 3D. Łuk (quadratic Bezier) między centrami dwóch połączonych miast, kolor
 * wg medium (ląd/morze). RENDER-ONLY — żadnego wpływu na logikę (game/trade-routes.ts
 * generuje listę tras; ten moduł tylko ją rysuje).
 *
 * Bez wpływu na raycast/picking: wybór heksu na mapie świata liczy się przez przecięcie
 * promienia z płaszczyzną y=0 (input/picker.ts:pixelToHex), nie przez intersectObjects
 * na obiektach sceny — dodatkowe THREE.Line w scenie nigdy nie mogą zasłonić kliknięcia.
 */
import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { GAME_MAP_RENDER_STYLE, terrainSurfaceTopY } from './mapRenderStyle';

/** Minimalne wejście potrzebne do narysowania jednego łuku trasy. */
export interface TradeRouteOverlayInput {
  fromQ: number;
  fromR: number;
  toQ: number;
  toR: number;
  medium: 'lad' | 'morze';
}

const LAND_COLOR = 0xd9a441; // karawana — złoto/brąz
const SEA_COLOR = 0x49b6e0;  // żagiel — błękit
const LINE_OPACITY = 0.85;
const ARC_SEGMENTS = 28;
/** Wysokość łuku rośnie z dystansem (unika "tonięcia" w górach na trasie), z sensownym sufitem. */
const ARC_HEIGHT_PER_WORLD_UNIT = 0.05;
const ARC_HEIGHT_MAX = 1.6;
const ARC_HEIGHT_MIN = 0.18;
/** Lekkie uniesienie ponad powierzchnię terenu w punktach miast. */
const BASE_LIFT = 0.05;

function hexTopY(map: GameMap, q: number, r: number): number {
  const hex = map.hexes[`${q},${r}`];
  const teren = hex?.terenBazowy ?? TerenBazowy.Laka;
  return terrainSurfaceTopY(teren, GAME_MAP_RENDER_STYLE, BASE_LIFT);
}

function buildRouteArc(map: GameMap, route: TradeRouteOverlayInput): THREE.Line {
  const a = axialToWorld(route.fromQ, route.fromR, HEX_R);
  const b = axialToWorld(route.toQ, route.toR, HEX_R);
  const ay = hexTopY(map, route.fromQ, route.fromR);
  const by = hexTopY(map, route.toQ, route.toR);

  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  const bumpH = Math.min(ARC_HEIGHT_MAX, Math.max(ARC_HEIGHT_MIN, dist * ARC_HEIGHT_PER_WORLD_UNIT));

  const mx = (a.x + b.x) * 0.5;
  const mz = (a.z + b.z) * 0.5;
  const my = Math.max(ay, by) + bumpH;

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(a.x, ay, a.z),
    new THREE.Vector3(mx, my, mz),
    new THREE.Vector3(b.x, by, b.z),
  );
  const points = curve.getPoints(ARC_SEGMENTS);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const color = route.medium === 'morze' ? SEA_COLOR : LAND_COLOR;
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: LINE_OPACITY,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.renderOrder = 7;
  line.frustumCulled = false;
  return line;
}

/** Buduje grupę łuków dla wszystkich podanych tras (wywołujący filtruje status/aktywność). */
export function buildTradeRoutesOverlayGroup(
  map: GameMap,
  routes: readonly TradeRouteOverlayInput[],
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trade-routes-overlay';
  for (const route of routes) {
    group.add(buildRouteArc(map, route));
  }
  return group;
}

/** Usuwa grupę ze sceny (wywołujący) i zwalnia geometrię/materiały. */
export function disposeTradeRoutesOverlayGroup(group: THREE.Group | null): void {
  if (!group) return;
  group.traverse((obj) => {
    const line = obj as THREE.Line;
    if (line.geometry) line.geometry.dispose();
    const mats = Array.isArray(line.material) ? line.material : [line.material];
    for (const m of mats) {
      if (m) (m as THREE.Material).dispose();
    }
  });
  group.clear();
}
