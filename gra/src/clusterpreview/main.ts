/**
 * clusterpreview/main.ts  (lane Civ-MAPA)
 * Podglad rozmieszczenia klastrów cywilizacji na mapie.
 *
 * Przepływ: generateMap → buildScene → setFog(all) → computeClusters
 *   → kolorowe nakładki regionów + markery miast (stolica wyróżniona).
 *
 * STEROWANIE: drag=obrót, kółko=zoom, WASD=przesuw.
 */

import * as THREE from 'three';
import { generateMap } from '../map/generator';
import { buildScene } from '../render/scene';
import { axialToWorld, HEX_R } from '../render/hexutil';
import { TerenBazowy } from '../types/hex';
import { computeClusters } from '../map/clusters';
import type { ClusterPlacement } from '../map/clusters';

// ---------------------------------------------------------------------------
// Paleta kolorów na klaster (do 9 typów)
// ---------------------------------------------------------------------------
const CLUSTER_COLORS: number[] = [
  0x4fc3f7, // grecy      — błękitny
  0xef5350, // rzymianie  — czerwony
  0xffee58, // chinczycy  — żółty
  0x66bb6a, // inkowie    — zielony
  0xab47bc, // zulusi     — fioletowy
  0xffa726, // egipt      — pomarańczowy
  0x26c6da, // sumerowie  — turkusowy
  0xff7043, // celtowie   — ceglasty
  0x8d6e63, // germanie   — brązowy
];

// Wysokości terenu — kopie z scene.ts żeby y-offset był spójny
const TERR_TOP: Partial<Record<TerenBazowy, number>> = {
  [TerenBazowy.Morze]:    0.30,
  [TerenBazowy.Wybrzeze]: 0.40,
  [TerenBazowy.Laka]:     0.45,
  [TerenBazowy.Rownina]:  0.53,
  [TerenBazowy.Pustynia]: 0.45,
  [TerenBazowy.Wzgorza]:  0.65,
  [TerenBazowy.Gory]:     0.80,
};

function clampInt(v: string | null, def: number, lo: number, hi: number): number {
  if (v === null) return def;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(hi, Math.max(lo, n));
}

// ---------------------------------------------------------------------------
// Kolory nakładki regionu — delikatny półprzezroczysty dysk na każdym heksie
// ---------------------------------------------------------------------------
function buildRegionOverlay(color: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(HEX_R * 0.78, HEX_R * 0.78, 0.04, 6);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

// Marker miasta — słupek; stolica = wyższy + jasna czapka
function buildCityMarker(color: number, isCapital: boolean): THREE.Group {
  const grp = new THREE.Group();
  const h = isCapital ? 0.55 : 0.30;
  const r = isCapital ? 0.18 : 0.12;
  const bodyGeo = new THREE.CylinderGeometry(r, r, h, 8);
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = h / 2;
  grp.add(body);

  if (isCapital) {
    // Złota czapka (sfera) na szczycie stolicy
    const capGeo = new THREE.SphereGeometry(0.22, 8, 6);
    const capMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = h + 0.15;
    grp.add(cap);
  }
  return grp;
}

// ---------------------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------------------
function boot(): void {
  const canvas = document.getElementById('map') as HTMLCanvasElement | null;
  if (!canvas) { console.error('clusterpreview: brak <canvas id="map">'); return; }

  const params = new URLSearchParams(location.search);
  const W    = clampInt(params.get('w'), 46, 12, 120);
  const H    = clampInt(params.get('h'), 32, 10, 90);
  const SEED = params.get('seed') !== null ? (parseInt(params.get('seed')!, 10) || 0) : 7;

  const map = generateMap(W, H, SEED);
  const { scene, camera, renderer, center, setFog } = buildScene(map, canvas);

  // Pokaż CAŁĄ mapę (usuń mgłę)
  const allKeys = new Set<string>(Object.keys(map.hexes));
  setFog(allKeys, new Set<string>());

  // Oświetlenie (buildScene ma własne, ale doświetlamy nakładki)
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  // Wyznacz klastry
  const placement: ClusterPlacement = computeClusters(map, {
    seed: SEED,
    // aktywneTypy: auto z rozmiaru mapy
  });

  // --- Nakładki regionów: per każdy heks lądowy → kolor jego klastra ---
  // Najpierw zbuduj mapę centrum_index → kolory
  // Voronoi: każdy hex → najbliższy środek klastra (powtórzenie logiki z clusters.ts dla viz)
  const centrumy = placement.klastry.map(k => k.centrum);
  const hexDistAxial = (aq: number, ar: number, bq: number, br: number): number => {
    const dq = Math.abs(aq - bq);
    const dr = Math.abs(ar - br);
    const ds = Math.abs((-aq - ar) - (-bq - br));
    return Math.max(dq, dr, ds);
  };

  let overlayCount = 0;
  for (const hex of Object.values(map.hexes)) {
    const t = hex.terenBazowy;
    if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;

    // Znajdź najbliższy środek
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let ci = 0; ci < centrumy.length; ci++) {
      const d = hexDistAxial(hex.coords.q, hex.coords.r, centrumy[ci]!.q, centrumy[ci]!.r);
      if (d < bestDist) { bestDist = d; bestIdx = ci; }
    }
    if (bestIdx < 0) continue;

    const color = CLUSTER_COLORS[bestIdx % CLUSTER_COLORS.length]!;
    const overlay = buildRegionOverlay(color);
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, HEX_R);
    const yTop = TERR_TOP[t] ?? 0.45;
    overlay.position.set(x, yTop + 0.02, z);
    scene.add(overlay);
    overlayCount++;
  }

  // --- Markery miast ---
  let markerCount = 0;
  let capitalCount = 0;
  for (const klaster of placement.klastry) {
    const color = CLUSTER_COLORS[klaster.typIndex % CLUSTER_COLORS.length]!;
    for (const city of klaster.miasta) {
      const hexKey = `${city.q},${city.r}`;
      const hex = map.hexes[hexKey];
      const t = hex?.terenBazowy ?? TerenBazowy.Laka;
      const yTop = TERR_TOP[t] ?? 0.45;
      const marker = buildCityMarker(color, city.isCapital);
      const { x, z } = axialToWorld(city.q, city.r, HEX_R);
      marker.position.set(x, yTop + 0.01, z);
      scene.add(marker);
      markerCount++;
      if (city.isCapital) capitalCount++;
    }
  }

  // --- HUD: meta ---
  const totalCities = placement.klastry.reduce((s, k) => s + k.miasta.length, 0);
  const meta = document.getElementById('meta');
  if (meta) {
    meta.textContent =
      `${W}×${H} hex · seed ${SEED} · rozmiar: ${placement.rozmiarMapy}` +
      ` · typy: ${placement.aktywneTypy} · minDystans: ${placement.minDystans}` +
      ` · miasta: ${totalCities} (${capitalCount} stolic) · overlay: ${overlayCount}`;
  }

  // --- Legenda typów ---
  const legendEl = document.getElementById('legend');
  if (legendEl) {
    const hexColor = (n: number) => '#' + n.toString(16).padStart(6, '0');
    let html = '';
    for (const klaster of placement.klastry) {
      const col = CLUSTER_COLORS[klaster.typIndex % CLUSTER_COLORS.length]!;
      const playerMark = klaster.typIndex === placement.playerTypIndex ? ' ★' : '';
      html +=
        `<div class="legend-row">` +
        `<div class="swatch" style="background:${hexColor(col)}"></div>` +
        `<span>${klaster.typ}${playerMark} — ${klaster.miasta.length} miast</span>` +
        `</div>`;
    }
    legendEl.innerHTML = html;
  }

  // --- Kamera: orbit wokół ruchomego celu ---
  let tx = center.x, tz = center.z;
  const initPos = camera.position.clone();
  let radius = Math.hypot(initPos.x - tx, initPos.y, initPos.z - tz);
  let theta  = Math.atan2(initPos.x - tx, initPos.z - tz);
  let phi    = Math.acos(Math.min(1, Math.max(-1, initPos.y / radius)));
  const init = { radius, theta, phi, tx, tz };

  function updateCam(): void {
    const s = Math.sin(phi);
    camera.position.set(tx + radius * s * Math.sin(theta), radius * Math.cos(phi), tz + radius * s * Math.cos(theta));
    camera.lookAt(tx, 0, tz);
  }

  let dragging = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    theta -= (e.clientX - lx) * 0.005;
    phi = Math.min(1.45, Math.max(0.12, phi - (e.clientY - ly) * 0.005));
    lx = e.clientX; ly = e.clientY; updateCam();
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius = Math.min(520, Math.max(4, radius * (1 + Math.sign(e.deltaY) * 0.08)));
    updateCam();
  }, { passive: false });

  const pressed = new Set<string>();
  const panKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if (panKeys.includes(k)) { pressed.add(k); e.preventDefault(); } });
  window.addEventListener('keyup', (e) => { pressed.delete(e.key.toLowerCase()); });
  function applyPan(): void {
    if (pressed.size === 0) return;
    const st = radius * 0.012;
    const fx = -Math.sin(theta), fz = -Math.cos(theta);
    const rx = Math.cos(theta), rz = -Math.sin(theta);
    if (pressed.has('w') || pressed.has('arrowup'))    { tx += fx * st; tz += fz * st; }
    if (pressed.has('s') || pressed.has('arrowdown'))  { tx -= fx * st; tz -= fz * st; }
    if (pressed.has('d') || pressed.has('arrowright')) { tx += rx * st; tz += rz * st; }
    if (pressed.has('a') || pressed.has('arrowleft'))  { tx -= rx * st; tz -= rz * st; }
    updateCam();
  }

  let autoRot = false;
  const bS = document.getElementById('btn-seed');
  const bR = document.getElementById('btn-reset');
  const bO = document.getElementById('btn-rot');
  if (bS) bS.addEventListener('click', () => {
    const s = Math.floor(Math.random() * 100000);
    const p = new URLSearchParams(location.search);
    p.set('seed', String(s));
    location.search = p.toString();
  });
  if (bR) bR.addEventListener('click', () => {
    radius = init.radius; theta = init.theta; phi = init.phi;
    tx = init.tx; tz = init.tz; updateCam();
  });
  if (bO) bO.addEventListener('click', () => {
    autoRot = !autoRot;
    (bO as HTMLButtonElement).textContent = autoRot ? 'Obrot: on' : 'Obrot: off';
  });

  updateCam();
  renderer.setAnimationLoop(() => {
    applyPan();
    if (autoRot) { theta += 0.0016; updateCam(); }
    renderer.render(scene, camera);
  });
  (window as unknown as { __clusterReady?: boolean }).__clusterReady = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
