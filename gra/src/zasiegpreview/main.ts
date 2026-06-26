/**
 * zasiegpreview/main.ts
 * Dedykowany podglad ZASIEG MIASTA / CYWILIZACJI z przelacznikiiem stylu granicy.
 *
 * Style:
 *   A — Linia granicy: ciagla LineSegments po krawedziach granicznych (DOMYSLNY)
 *   B — Aura: jasnoniebieskie polprzezroczyste wypelnienie calego terytorium (opacity 0.20)
 *   C — Tint + linia: cale terytorium opacity ~0.15 + cienka linia
 *   D — Bogaty: linia + aura + tint razem
 *   Ukryj: brak wizualizacji
 *
 * // STUB: rozwoj/dane z MIASTO — promienie i pozycje miast sa stubowane
 */

import * as THREE from 'three';
import { generateMap } from '../map/generator';
import { buildScene } from '../render/scene';
import { buildStoneAgeCity } from '../render/stoneCity';
import { buildImprovement } from '../render/improvements';
import { axialToWorld, HEX_R } from '../render/hexutil';
import { TerenBazowy } from '../types/hex';

// ============================================================
// STALEEEE
// ============================================================

const TERR_TOP: Partial<Record<TerenBazowy, number>> = {
  [TerenBazowy.Morze]:    0.30,
  [TerenBazowy.Wybrzeze]: 0.40,
  [TerenBazowy.Laka]:     0.45,
  [TerenBazowy.Rownina]:  0.53,
  [TerenBazowy.Pustynia]: 0.45,
  [TerenBazowy.Wzgorza]:  0.65,
  [TerenBazowy.Gory]:     0.80,
};

const TERENY_LADU = new Set<TerenBazowy>([
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza,
  TerenBazowy.Gory, TerenBazowy.Pustynia, TerenBazowy.Wybrzeze,
]);

// Kolor cywilizacji gracza (zloty)
const PLAYER_COLOR = 0xffd54a;

// Kolor aury (jasnoniebieska)
const AURA_COLOR = 0x66c0ff;

// ============================================================
// GEOMETRIA HEX — wspoldzielona
// ============================================================

/**
 * Wierzcholki jednego heksa pointy-top o promieniu R wokol srodka (cx, y, cz).
 * Kolejnosc katow: 30deg, 90deg, 150deg, 210deg, 270deg, 330deg (pointy-top).
 *
 * WAZNE: Uzywamy dokladnie R bez zadnego skalowania (nie *0.97 ani *1.01),
 * dzieki czemu wspolne rogi sasiadujacych heksow maja identyczne wspolrzedne
 * i odcinki graniczne stykaja sie bez przerw.
 */
function hexVertices(cx: number, y: number, cz: number, R: number): THREE.Vector3[] {
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 6) + (Math.PI / 3) * i; // pointy-top: start 30deg
    verts.push(new THREE.Vector3(
      cx + R * Math.cos(angle),
      y,
      cz + R * Math.sin(angle),
    ));
  }
  return verts;
}

/**
 * Kierunki sasiedztwa aksjalnego (pointy-top).
 * Krawedz i laczy wierzcholek i z wierzcholkiem (i+1)%6.
 */
const HEX_DIRS: { dq: number; dr: number }[] = [
  { dq:  1, dr:  0 },
  { dq:  1, dr: -1 },
  { dq:  0, dr: -1 },
  { dq: -1, dr:  0 },
  { dq: -1, dr:  1 },
  { dq:  0, dr:  1 },
];

// ============================================================
// MODELE MIAST — STUB
// ============================================================

/**
 * // STUB: rozwoj/dane z MIASTO
 * Tutaj stubujemy 3 osady:
 *   - Miasto glowne (q,r) populacja 6+ => r=10
 *   - Miasto 2 (dalej) populacja 2 => r=5
 *   - Posterunek (jeszcze dalej) => r=5
 */
interface CityNode {
  q: number;
  r: number;
  radius: number;   // promien terytorium (axial)
  isOutpost: boolean;
  color: number;    // kolor dla modelu 3D
}

function axialDist(aq: number, ar: number, bq: number, br: number): number {
  const as_ = -aq - ar;
  const bs  = -bq - br;
  return (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(as_ - bs)) / 2;
}

function isInTerritory(q: number, r: number, nodes: CityNode[]): boolean {
  for (const node of nodes) {
    if (axialDist(q, r, node.q, node.r) <= node.radius) return true;
  }
  return false;
}

// ============================================================
// BUILDERY STYLOW GRANICY
// ============================================================

interface StyleObjects {
  /** Linia granicy — ciagla LineSegments (styl A) */
  borderLine?: THREE.LineSegments;
  /** Aura calego terytorium — InstancedMesh (styl B) jasnoniebieska 0.20 */
  auraMesh?: THREE.InstancedMesh;
  /** Tint calego terytorium — InstancedMesh (styl C/D) */
  tintMesh?: THREE.InstancedMesh;
  /** Cienka linia do stylu C — LineSegments */
  thinLine?: THREE.LineSegments;
}

/**
 * Buduje geometrie linii granicy.
 *
 * NAPRAWKA CIAGLOCI: uzywamy dokladnie HEX_R (bez *0.97 ani *1.01).
 * Dzieki temu wspolne rogi sasiadujacych heksow maja IDENTYCZNE wspolrzedne
 * i kolejne odcinki graniczne stykaja sie w rogach — zamkniety, ciagly obrys.
 * Usunieta podwojna linia (rdzen + kontur) ktora powodowala porozrywanie.
 */
function buildBorderLine(
  map: ReturnType<typeof generateMap>,
  nodes: CityNode[],
  color: number,
  yOffset: number,
  opacity: number,
): THREE.LineSegments {
  const territory = new Set<string>();
  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    if (isInTerritory(q, r, nodes)) territory.add(`${q},${r}`);
  }

  const positions: number[] = [];

  for (const key of territory) {
    const [qs, rs] = key.split(',');
    const q = parseInt(qs!, 10);
    const r = parseInt(rs!, 10);
    const hexObj = map.hexes[key];
    const hexY = (TERR_TOP[hexObj?.terenBazowy ?? TerenBazowy.Laka] ?? 0.45) + yOffset;
    const { x: cx, z: cz } = axialToWorld(q, r, HEX_R);

    // Uzywamy dokladnie HEX_R — identyczne wspolrzedne dla obu heksow dzielacych rog
    const verts = hexVertices(cx, hexY, cz, HEX_R);

    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i]!;
      const nq = q + dir.dq;
      const nr = r + dir.dr;
      if (!territory.has(`${nq},${nr}`)) {
        // Krawedz graniczna — pojedynczy odcinek
        positions.push(
          verts[i]!.x, verts[i]!.y, verts[i]!.z,
          verts[(i + 1) % 6]!.x, verts[(i + 1) % 6]!.y, verts[(i + 1) % 6]!.z,
        );
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = 4;
  return lines;
}

/**
 * Buduje aure — InstancedMesh dla WSZYSTKICH heksow terytorium.
 * Jasnoniebieska (0x66c0ff), opacity 0.20.
 */
function buildAuraMesh(
  map: ReturnType<typeof generateMap>,
  nodes: CityNode[],
  color: number,
  yOffset: number,
  opacity: number,
): THREE.InstancedMesh {
  const territoryHexes: Array<{ q: number; r: number; y: number }> = [];

  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    if (isInTerritory(q, r, nodes)) {
      territoryHexes.push({ q, r, y: (TERR_TOP[hex.terenBazowy] ?? 0.45) + yOffset });
    }
  }

  const geo = new THREE.CylinderGeometry(HEX_R * 0.97, HEX_R * 0.97, 0.002, 6);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, territoryHexes.length || 1);
  mesh.renderOrder = 2;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < territoryHexes.length; i++) {
    const { q, r, y } = territoryHexes[i]!;
    const { x, z } = axialToWorld(q, r, HEX_R);
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, Math.PI / 6, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = territoryHexes.length;

  return mesh;
}

/**
 * Buduje tint — InstancedMesh dla WSZYSTKICH heksow terytorium.
 */
function buildTintMesh(
  map: ReturnType<typeof generateMap>,
  nodes: CityNode[],
  color: number,
  yOffset: number,
  opacity: number,
): THREE.InstancedMesh {
  const territoryHexes: Array<{ q: number; r: number; y: number }> = [];

  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    if (isInTerritory(q, r, nodes)) {
      territoryHexes.push({ q, r, y: (TERR_TOP[hex.terenBazowy] ?? 0.45) + yOffset });
    }
  }

  const geo = new THREE.CylinderGeometry(HEX_R * 0.97, HEX_R * 0.97, 0.001, 6);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, territoryHexes.length || 1);
  mesh.renderOrder = 1;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < territoryHexes.length; i++) {
    const { q, r, y } = territoryHexes[i]!;
    const { x, z } = axialToWorld(q, r, HEX_R);
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, Math.PI / 6, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = territoryHexes.length;

  return mesh;
}

/**
 * Cienka linia do stylu C.
 */
function buildThinLine(
  map: ReturnType<typeof generateMap>,
  nodes: CityNode[],
  color: number,
  yOffset: number,
): THREE.LineSegments {
  const territory = new Set<string>();
  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    if (isInTerritory(q, r, nodes)) territory.add(`${q},${r}`);
  }

  const positions: number[] = [];

  for (const key of territory) {
    const [qs, rs] = key.split(',');
    const q = parseInt(qs!, 10);
    const r = parseInt(rs!, 10);
    const hexObj = map.hexes[key];
    const hexY = (TERR_TOP[hexObj?.terenBazowy ?? TerenBazowy.Laka] ?? 0.45) + yOffset;
    const { x: cx, z: cz } = axialToWorld(q, r, HEX_R);
    const verts = hexVertices(cx, hexY, cz, HEX_R);

    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i]!;
      if (!territory.has(`${q + dir.dq},${r + dir.dr}`)) {
        positions.push(
          verts[i]!.x, verts[i]!.y, verts[i]!.z,
          verts[(i + 1) % 6]!.x, verts[(i + 1) % 6]!.y, verts[(i + 1) % 6]!.z,
        );
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = 2;
  return lines;
}

// ============================================================
// TYPY STYLOW
// ============================================================

type StyleKey = 'A' | 'B' | 'C' | 'D' | 'H';

const STYLE_META: Record<StyleKey, { name: string; desc: string }> = {
  A: {
    name: 'A — Linia granicy [DOMYSLNY]',
    desc: 'Ciagla kolorowa linia po krawedziach granicznych — rogi stykaja sie dzieki dokladnym wspolrzednym wierzcholkow (R bez skalowania). Kolor gracza (zloty).',
  },
  B: {
    name: 'B — Aura terytorium (jasnoniebieska)',
    desc: 'Jasnoniebieskie polprzezroczyste wypelnienie (0x66c0ff, opacity 0.20) calego obszaru terytorium. Uzywane automatycznie w trybie budowy.',
  },
  C: {
    name: 'C — Tint + linia',
    desc: 'Cale terytorium polprzezroczyste wypelnienie (opacity ~0.15) + cienka linia graniczna po krawedziach.',
  },
  D: {
    name: 'D — Bogaty (linia+aura+tint)',
    desc: 'Kombinacja wszystkich stylow: tint calego terytorium + jasnoniebieska aura + ciagla linia.',
  },
  H: {
    name: 'Ukryj',
    desc: 'Brak wizualizacji terytorium.',
  },
};

// ============================================================
// BOOT
// ============================================================

function boot(): void {
  const canvas = document.getElementById('map') as HTMLCanvasElement | null;
  if (!canvas) { console.error('zasiegpreview: brak <canvas id="map">'); return; }

  const params = new URLSearchParams(location.search);
  const W    = Math.min(120, Math.max(12, parseInt(params.get('w')  ?? '46', 10) || 46));
  const H    = Math.min(90,  Math.max(10, parseInt(params.get('h')  ?? '32', 10) || 32));
  const SEED = parseInt(params.get('seed') ?? '7', 10) || 7;

  const map = generateMap(W, H, SEED);
  const { scene, camera, renderer, center, setFog } = buildScene(map, canvas);

  setFog(new Set<string>(Object.keys(map.hexes)), new Set<string>());

  // ============================================================
  // STUBOWE OSADY
  // ============================================================

  const cityNodes: CityNode[] = [];

  // Znajdz pozycje startowe z mapy
  const starts = (map as unknown as { startPositions?: { q: number; r: number }[] }).startPositions ?? [];

  // Chcemy wstawic: 1 glowne miasto (r=10), 1 mniejsze (r=5), 1 posterunek (r=5)
  // Szukamy pierwszych 2 startowych pozycji na ladzie

  const landStarts: { q: number; r: number }[] = [];
  for (const sp of starts) {
    const hex = map.hexes[`${sp.q},${sp.r}`];
    if (!hex) continue;
    const t = hex.terenBazowy;
    if (!TERENY_LADU.has(t) || t === TerenBazowy.Gory) continue;
    landStarts.push(sp);
    if (landStarts.length >= 3) break;
  }

  // Jesli za malo pozycji startowych, generuj reczne ze srodka mapy
  const fallbackCenter = { q: Math.floor(W / 2), r: Math.floor(H / 3) };
  while (landStarts.length < 3) {
    const off = landStarts.length;
    const cand = { q: fallbackCenter.q + off * 8, r: fallbackCenter.r + off * 4 };
    const hex = map.hexes[`${cand.q},${cand.r}`];
    if (hex && TERENY_LADU.has(hex.terenBazowy)) landStarts.push(cand);
    else landStarts.push(fallbackCenter);
  }

  // Glowne miasto — r=10 (pop>=5 => duze miasto)
  // // STUB: rozwoj/dane z MIASTO
  const mainCityPos = landStarts[0]!;
  {
    const hex = map.hexes[`${mainCityPos.q},${mainCityPos.r}`];
    const t = hex?.terenBazowy ?? TerenBazowy.Laka;
    const city = buildStoneAgeCity(8, PLAYER_COLOR, true); // poziom 8, mury
    const { x, z } = axialToWorld(mainCityPos.q, mainCityPos.r, HEX_R);
    city.position.set(x, (TERR_TOP[t] ?? 0.45) + 0.01, z);
    scene.add(city);
    cityNodes.push({ q: mainCityPos.q, r: mainCityPos.r, radius: 10, isOutpost: false, color: PLAYER_COLOR });
  }

  // Drugie miasto — r=5 (mniejsze)
  // // STUB: rozwoj/dane z MIASTO
  const city2Pos = landStarts[1]!;
  {
    const hex = map.hexes[`${city2Pos.q},${city2Pos.r}`];
    const t = hex?.terenBazowy ?? TerenBazowy.Laka;
    const city = buildStoneAgeCity(3, 0xe53935, false); // poziom 3, bez murow
    const { x, z } = axialToWorld(city2Pos.q, city2Pos.r, HEX_R);
    city.position.set(x, (TERR_TOP[t] ?? 0.45) + 0.01, z);
    scene.add(city);
    cityNodes.push({ q: city2Pos.q, r: city2Pos.r, radius: 5, isOutpost: false, color: 0xe53935 });
  }

  // Posterunek — r=5, nieco dalej niz maly promien aby zasieg sie LACZYL
  // Szukamy punktu ~10-12 od glownego, ~6-8 od drugiego
  // // STUB: rozwoj/dane z MIASTO
  let outpostPlaced = false;
  {
    // Szukamy heksu w odleglosci ~8 od glownego, na ladzie
    const searchRadius = 8;
    for (let dq = -searchRadius; dq <= searchRadius && !outpostPlaced; dq++) {
      for (let dr = -searchRadius; dr <= searchRadius && !outpostPlaced; dr++) {
        const d = axialDist(0, 0, dq, dr);
        if (d < 7 || d > 10) continue;
        const tq = mainCityPos.q + dq;
        const tr = mainCityPos.r + dr;
        const hex = map.hexes[`${tq},${tr}`];
        if (!hex || !TERENY_LADU.has(hex.terenBazowy) || hex.terenBazowy === TerenBazowy.Gory) continue;
        // Sprawdz czy nie za blisko drugiego miasta
        const d2 = axialDist(tq, tr, city2Pos.q, city2Pos.r);
        if (d2 < 4) continue;
        const outpost = buildImprovement('posterunek', 0x4488cc);
        const { x, z } = axialToWorld(tq, tr, HEX_R);
        outpost.position.set(x, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.01, z);
        scene.add(outpost);
        cityNodes.push({ q: tq, r: tr, radius: 5, isOutpost: true, color: 0x4488cc });
        outpostPlaced = true;
      }
    }
  }

  // Jesli nie udalo sie postawic posterunku — uzyj trzeciej pozycji startowej
  if (!outpostPlaced && landStarts[2]) {
    const pos3 = landStarts[2];
    const hex = map.hexes[`${pos3.q},${pos3.r}`];
    const t = hex?.terenBazowy ?? TerenBazowy.Laka;
    const outpost = buildImprovement('posterunek', 0x4488cc);
    const { x, z } = axialToWorld(pos3.q, pos3.r, HEX_R);
    outpost.position.set(x, (TERR_TOP[t] ?? 0.45) + 0.01, z);
    scene.add(outpost);
    cityNodes.push({ q: pos3.q, r: pos3.r, radius: 5, isOutpost: true, color: 0x4488cc });
  }

  // Policz heksy terytorium
  let terrHexCount = 0;
  for (const hex of Object.values(map.hexes)) {
    if (isInTerritory(hex.coords.q, hex.coords.r, cityNodes)) terrHexCount++;
  }

  const meta = document.getElementById('meta');
  if (meta) meta.textContent = `${W}x${H} hex · seed ${SEED} · terytorium: ~${terrHexCount} heksow · osady: ${cityNodes.length}`;

  // ============================================================
  // WIZUALIZACJA — PRZELACZNIK STYLU
  // ============================================================

  type StyleObject3D = THREE.Object3D | THREE.Group;
  const activeObjects: StyleObject3D[] = [];

  function clearStyle(): void {
    for (const obj of activeObjects) scene.remove(obj);
    activeObjects.length = 0;
  }

  function applyStyle(style: StyleKey): void {
    clearStyle();
    if (style === 'H') return;

    const Y_TINT   = 0.042;
    const Y_AURA   = 0.048;
    const Y_LINE   = 0.065;
    const Y_THIN   = 0.055;

    if (style === 'A') {
      // SAMA LINIA — ciagla, pojedyncza, kolor gracza (zloty)
      const line = buildBorderLine(map, cityNodes, PLAYER_COLOR, Y_LINE, 0.9);
      scene.add(line);
      activeObjects.push(line);
    }

    if (style === 'B') {
      // SAMA AURA — jasnoniebieska, cale terytorium, opacity 0.20
      const aura = buildAuraMesh(map, cityNodes, AURA_COLOR, Y_AURA, 0.20);
      scene.add(aura);
      activeObjects.push(aura);
    }

    if (style === 'C') {
      const tint = buildTintMesh(map, cityNodes, PLAYER_COLOR, Y_TINT, 0.15);
      scene.add(tint);
      activeObjects.push(tint);
      const thin = buildThinLine(map, cityNodes, PLAYER_COLOR, Y_THIN);
      scene.add(thin);
      activeObjects.push(thin);
    }

    if (style === 'D') {
      // Tint
      const tint = buildTintMesh(map, cityNodes, PLAYER_COLOR, Y_TINT, 0.14);
      scene.add(tint);
      activeObjects.push(tint);
      // Aura jasnoniebieska 0.20
      const aura = buildAuraMesh(map, cityNodes, AURA_COLOR, Y_AURA, 0.20);
      scene.add(aura);
      activeObjects.push(aura);
      // Ciagla linia
      const line = buildBorderLine(map, cityNodes, PLAYER_COLOR, Y_LINE, 0.85);
      scene.add(line);
      activeObjects.push(line);
    }
  }

  // HUD — przyciski
  const btnA = document.getElementById('btn-A') as HTMLButtonElement;
  const btnB = document.getElementById('btn-B') as HTMLButtonElement;
  const btnC = document.getElementById('btn-C') as HTMLButtonElement;
  const btnD = document.getElementById('btn-D') as HTMLButtonElement;
  const btnH = document.getElementById('btn-H') as HTMLButtonElement;
  const legendName = document.getElementById('legend-name');
  const legendDesc = document.getElementById('legend-desc');

  const allBtns: { key: StyleKey; btn: HTMLButtonElement }[] = [
    { key: 'A', btn: btnA },
    { key: 'B', btn: btnB },
    { key: 'C', btn: btnC },
    { key: 'D', btn: btnD },
    { key: 'H', btn: btnH },
  ];

  function setActiveStyle(key: StyleKey): void {
    for (const { btn } of allBtns) btn.classList.remove('active');
    const found = allBtns.find(b => b.key === key);
    if (found) found.btn.classList.add('active');
    if (legendName) legendName.textContent = STYLE_META[key].name;
    if (legendDesc) legendDesc.textContent = STYLE_META[key].desc;
    applyStyle(key);
  }

  for (const { key, btn } of allBtns) {
    btn.addEventListener('click', () => setActiveStyle(key));
  }

  // Domyslny styl A — ciagla linia
  setActiveStyle('A');

  // ============================================================
  // KAMERA ORBIT
  // ============================================================

  let tx = center.x, tz = center.z;
  const initPos = camera.position.clone();
  let radius = Math.hypot(initPos.x - tx, initPos.y, initPos.z - tz);
  let theta  = Math.atan2(initPos.x - tx, initPos.z - tz);
  let phi    = Math.acos(Math.min(1, Math.max(-1, initPos.y / radius)));

  // Zblizenei do glownego miasta
  {
    const { x: mx, z: mz } = axialToWorld(mainCityPos.q, mainCityPos.r, HEX_R);
    tx = mx; tz = mz;
    radius = Math.min(radius, 80); // nie za daleko przy starcie
  }

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
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (panKeys.includes(k)) { pressed.add(k); e.preventDefault(); }
  });
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

  updateCam();
  renderer.setAnimationLoop(() => { applyPan(); renderer.render(scene, camera); });
  (window as unknown as Record<string, unknown>).__zasiegReady = true;

  console.log(`[zasiegpreview] mapa ${W}x${H} seed=${SEED} osady=${cityNodes.length} terytorium=${terrHexCount} heksow`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
