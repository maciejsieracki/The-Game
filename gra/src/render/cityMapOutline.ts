/**
 * cityMapOutline.ts — delikatna obwódka heksu miasta na mapie świata (MAPA).
 * Geometria pointy-top jak zaznaczenie armii (hexShape.ts / units.ts).
 */
import * as THREE from 'three';
import { axialToWorld, HEX_R } from './hexutil';
import { hexRingPointsXZ } from './hexShape';

/** Relacja względem gracza (owner 0) — do wykrycia wojny (czerwony akcent). */
export type CityMapOutlineKind = 'player' | 'war' | 'neutral' | 'ally';

const CIV_INNER_OPACITY = 0.92;
const CIV_OUTER_OPACITY = 0.52;
const WAR_ACCENT_COLOR = 0xff4444;
const WAR_ACCENT_OPACITY = 0.55;

const OUTLINE_LIFT = 0.085;

function makeHexRing(
  R: number,
  color: number,
  opacity: number,
  y = 0,
): THREE.LineLoop {
  const geo = new THREE.BufferGeometry().setFromPoints(hexRingPointsXZ(R, y));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const loop = new THREE.LineLoop(geo, mat);
  loop.renderOrder = 12;
  return loop;
}

/** Podwójna obwódka: kolor cywilizacji właściciela; w wojnie — czerwony akcent na zewnątrz. */
export function buildCityMapOutline(
  q: number,
  r: number,
  topY: number,
  civColor: number,
  atWar = false,
): THREE.Group {
  const { x, z } = axialToWorld(q, r, HEX_R);
  const g = new THREE.Group();
  g.position.set(x, topY + OUTLINE_LIFT, z);
  g.userData['outlineCivColor'] = civColor;
  g.userData['outlineAtWar'] = atWar;
  g.userData['outlineHex'] = { q, r };

  const inner = makeHexRing(HEX_R * 0.98, civColor, CIV_INNER_OPACITY, 0.004);
  const outerColor = atWar ? WAR_ACCENT_COLOR : civColor;
  const outerOpacity = atWar ? WAR_ACCENT_OPACITY : CIV_OUTER_OPACITY;
  const outer = makeHexRing(HEX_R * 1.06, outerColor, outerOpacity);
  g.add(outer, inner);

  g.userData['outlineMats'] = [
    outer.material as THREE.LineBasicMaterial,
    inner.material as THREE.LineBasicMaterial,
  ];
  g.userData['outlineGeos'] = [outer.geometry, inner.geometry];
  return g;
}

/** Przesuń istniejącą obwódkę (np. po sync bez przebudowy geometrii). */
export function placeCityMapOutline(
  group: THREE.Group,
  q: number,
  r: number,
  topY: number,
): void {
  const { x, z } = axialToWorld(q, r, HEX_R);
  group.position.set(x, topY + OUTLINE_LIFT, z);
  group.userData['outlineHex'] = { q, r };
}

export function disposeCityMapOutline(group: THREE.Group): void {
  for (const m of (group.userData['outlineMats'] as THREE.Material[] | undefined) ?? []) {
    m.dispose();
  }
  for (const geo of (group.userData['outlineGeos'] as THREE.BufferGeometry[] | undefined) ?? []) {
    geo.dispose();
  }
}
