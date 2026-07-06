/**
 * cityMapOutline.ts — delikatna obwódka heksu miasta na mapie świata (MAPA).
 * Nie dotyczy overlay okolicy w panelu miasta.
 */
import * as THREE from 'three';
import { axialToWorld, HEX_R } from './hexutil';

/** Relacja względem gracza (owner 0). */
export type CityMapOutlineKind = 'player' | 'war' | 'neutral' | 'ally';

export const CITY_MAP_OUTLINE_STYLE: Record<
  CityMapOutlineKind,
  { color: number; opacity: number; outerOpacity: number }
> = {
  /** Nasze miasto — jasnoniebieski (Maciej 2026-07-03). */
  player:  { color: 0x7ec8e8, opacity: 0.92, outerOpacity: 0.52 },
  /** Wojna — czerwony. */
  war:     { color: 0xff4444, opacity: 0.92, outerOpacity: 0.55 },
  /** Neutralni — zielony. */
  neutral: { color: 0x5cb85c, opacity: 0.88, outerOpacity: 0.48 },
  /** Sojusznik — ciemnoniebieski. */
  ally:    { color: 0x1a4a8a, opacity: 0.90, outerOpacity: 0.52 },
};

function hexRingPoints(cx: number, y: number, cz: number, R: number): THREE.Vector3[] {
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    verts.push(new THREE.Vector3(cx + R * Math.sin(a), y, cz + R * Math.cos(a)));
  }
  return verts;
}

function makeHexRing(
  cx: number,
  y: number,
  cz: number,
  R: number,
  color: number,
  opacity: number,
): THREE.LineLoop {
  const geo = new THREE.BufferGeometry().setFromPoints(hexRingPoints(cx, y, cz, R));
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

/** Podwójna obwódka: wewnętrzna wyraźniejsza + zewnętrzna miękka (czytelność na terenie). */
export function buildCityMapOutline(
  q: number,
  r: number,
  topY: number,
  kind: CityMapOutlineKind,
): THREE.Group {
  const style = CITY_MAP_OUTLINE_STYLE[kind];
  const { x, z } = axialToWorld(q, r, HEX_R);
  const y = topY + 0.085;
  const g = new THREE.Group();
  g.userData['outlineKind'] = kind;

  const outer = makeHexRing(x, y, z, HEX_R * 1.06, style.color, style.outerOpacity);
  const inner = makeHexRing(x, y + 0.004, z, HEX_R * 0.98, style.color, style.opacity);
  g.add(outer, inner);

  g.userData['outlineMats'] = [
    outer.material as THREE.LineBasicMaterial,
    inner.material as THREE.LineBasicMaterial,
  ];
  g.userData['outlineGeos'] = [outer.geometry, inner.geometry];
  return g;
}

export function disposeCityMapOutline(group: THREE.Group): void {
  for (const m of (group.userData['outlineMats'] as THREE.Material[] | undefined) ?? []) {
    m.dispose();
  }
  for (const geo of (group.userData['outlineGeos'] as THREE.BufferGeometry[] | undefined) ?? []) {
    geo.dispose();
  }
}
