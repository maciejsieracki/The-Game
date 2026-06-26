/**
 * scene.ts
 * Buduje scenę Three.js dla mapy hex The Game.
 *
 * Jeden CylinderGeometry(R, R, h, 6) per heks — prism sześcioboczny.
 * THREE.CylinderGeometry(6 segmentów) generuje pointy-top (pierwszy wierzchołek
 * w +Z, theta=0), co pasuje do axialToWorld (pointy-top). NIE rotujemy geometrii.
 * Kolory materiałów przypisane per typ terenu, scalane w grupy
 * (InstancedMesh osobno per teren-typ dla wydajności).
 *
 * Las = 1–3 stożki na heksie (ConeGeometry).
 * Góry = opcjonalna śnieżna czapka (biały disk na szczycie).
 * Wzgórza = ciemnozielone z małymi krzewami/drzewkami (ConeGeometry mniejsze niż Las).
 * Pustynia = losowa (LCG, ~1 na 6) oaza: basen wodny + 1-2 palmy.
 * Rzeka = jedna proceduralna wstążka CatmullRomCurve3 od Gór/Wzgórz do morza.
 *
 * Mgła wojenna (fog-of-war):
 *   - visible  → kolor bazowy terenu (factor 1.0)
 *   - explored → przyciemniony (factor 0.45)
 *   - unknown  → ciemny kolor mgły 0x0b0d12 (ustawiany bezpośrednio)
 * setFog(visible, explored) przelicza kolory instancji tylko dla prizmów terenu.
 */

import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy, Nakladka } from '../types/hex';
import { axialToWorld, mapCenter, HEX_R } from './hexutil';

// ---------------------------------------------------------------------------
// Paleta kolorów i parametry wysokości per teren
// ---------------------------------------------------------------------------

interface TerenVisual {
  color: number;
  height: number; // high of the prism
  yOffset: number; // dodatkowe podniesienie środka (>0 gdy prism wyżej)
}

const TERRAIN_VISUALS: Record<TerenBazowy, TerenVisual> = {
  [TerenBazowy.Morze]:     { color: 0x2e6b94, height: 0.30, yOffset: 0.00 },
  [TerenBazowy.Wybrzeze]:  { color: 0x5fb0cf, height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]:      { color: 0x6fa84a, height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]:   { color: 0x9cbf5a, height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]:  { color: 0xd8bd78, height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Wzgorza]:   { color: 0x4a7838, height: 0.70, yOffset: 0.15 },
  [TerenBazowy.Gory]:      { color: 0x8b97a1, height: 1.20, yOffset: 0.40 },
};

const FOREST_COLOR      = 0x1b5e20;
const FOREST_CONE_COLOR = 0x2f6b34;
const SNOW_COLOR        = 0xf5f7fa;
const SHRUB_COLOR       = 0x356b2c;

// Kolory oazy
const OASIS_WATER_COLOR = 0x3fa9c9;
const OASIS_TRUNK_COLOR = 0x6b4f2a;
const OASIS_FROND_COLOR = 0x2e8b3f;

// Kolor rzeki
const RIVER_COLOR = 0x3a86b5;

// Kolor mgły wojennej (nieznane hexsy)
const FOG_HIDDEN_COLOR = new THREE.Color(0x0b0d12);

// ---------------------------------------------------------------------------
// Pomocnik: numeryczny ranking terenu dla rzeki (niższy = niżej)
// ---------------------------------------------------------------------------

const TERRAIN_ELEVATION_RANK: Record<TerenBazowy, number> = {
  [TerenBazowy.Morze]:    0,
  [TerenBazowy.Wybrzeze]: 1,
  [TerenBazowy.Laka]:     2,
  [TerenBazowy.Pustynia]: 3,
  [TerenBazowy.Rownina]:  4,
  [TerenBazowy.Wzgorza]:  5,
  [TerenBazowy.Gory]:     6,
};

// Sąsiedzi aksjalni (pointy-top)
const HEX_NEIGHBORS: [number, number][] = [
  [+1,  0], [+1, -1], [0, -1],
  [-1,  0], [-1, +1], [0, +1],
];

// ---------------------------------------------------------------------------
// Budowa sceny
// ---------------------------------------------------------------------------

/** Wpis w mapie instancji — łączy InstancedMesh + indeks instancji + bazowy kolor terenu. */
interface HexInstanceEntry {
  mesh:      THREE.InstancedMesh;
  index:     number;
  baseColor: THREE.Color;
}

export interface SceneResult {
  scene:    THREE.Scene;
  camera:   THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** Środek mapy w world space (cel kamery i centrum panowania). */
  center:   { x: number; z: number };
  dispose:  () => void;
  /**
   * Przelicza kolory prizmów terenu według stanu mgły wojennej.
   * @param visible  Zbiór kluczy "q,r" aktualnie widocznych hexów.
   * @param explored Zbiór kluczy "q,r" odkrytych, lecz nie widocznych hexów.
   *
   * Poziomy:
   *   visible  → factor 1.0  (pełny kolor bazowy)
   *   explored → factor 0.45 (przyciemniony, zapamiętany)
   *   unknown  → kolor 0x0b0d12 (ciemna mgła, ustawiany bezpośrednio)
   */
  setFog: (visible: Set<string>, explored: Set<string>) => void;
}

export function buildScene(map: GameMap, canvas: HTMLCanvasElement): SceneResult {
  // -- Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // -- Scena + tlo
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // sky blue
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

  // -- Swiatla
  const hemi = new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0cc, 1.4);
  sun.position.set(60, 100, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 500;
  const sc = 60;
  sun.shadow.camera.left   = -sc;
  sun.shadow.camera.right  =  sc;
  sun.shadow.camera.top    =  sc;
  sun.shadow.camera.bottom = -sc;
  scene.add(sun);

  // -- Geometrie wspoldzielone
  const R = HEX_R;
  // CylinderGeometry(6) jest juz pointy-top -- bez rotacji.

  // Zlicz ilosc per teren i nakladke
  const countByTerrain: Partial<Record<TerenBazowy, number>> = {};
  let forestCount = 0;
  let mountainSnowCount = 0;
  let hillCount = 0;
  let desertCount = 0;

  for (const hex of Object.values(map.hexes)) {
    const t = hex.terenBazowy;
    countByTerrain[t] = (countByTerrain[t] ?? 0) + 1;
    if (hex.nakladka === Nakladka.Las) forestCount += 2; // avg 2 trees per forest hex
    if (t === TerenBazowy.Gory) mountainSnowCount++;
    if (t === TerenBazowy.Wzgorza) hillCount++;
    if (t === TerenBazowy.Pustynia) desertCount++;
  }

  // -- Instanced hex prisms per terrain type
  const instancedMeshes: THREE.InstancedMesh[] = [];
  const terrainMaterials: Partial<Record<TerenBazowy, THREE.MeshLambertMaterial>> = {};

  const terrainIndex: Partial<Record<TerenBazowy, number>> = {};

  const terrainTypes = Object.values(TerenBazowy);
  for (const t of terrainTypes) {
    const cnt = countByTerrain[t] ?? 0;
    if (cnt === 0) continue;
    const vis = TERRAIN_VISUALS[t];
    const geo = new THREE.CylinderGeometry(R * 0.998, R * 0.998, vis.height, 6, 1);
    // Brak rotateY -- CylinderGeometry(6) jest juz pointy-top jak axialToWorld.
    const mat = new THREE.MeshLambertMaterial({ color: vis.color });
    terrainMaterials[t] = mat;
    const mesh = new THREE.InstancedMesh(geo, mat, cnt);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    instancedMeshes.push(mesh);
    scene.add(mesh);
    terrainIndex[t] = instancedMeshes.length - 1;
  }

  const terrainInstanceIdx: Partial<Record<TerenBazowy, number>> = {};
  for (const t of terrainTypes) terrainInstanceIdx[t] = 0;

  // -- Las -- InstancedMesh stozkow
  const forestConeGeo = new THREE.ConeGeometry(R * 0.18, R * 0.55, 6);
  const forestConeMat = new THREE.MeshLambertMaterial({ color: FOREST_CONE_COLOR });
  const forestMesh = new THREE.InstancedMesh(forestConeGeo, forestConeMat, forestCount * 2);
  forestMesh.castShadow = true;
  scene.add(forestMesh);

  // -- Snieg na gorach
  const snowGeo = new THREE.CylinderGeometry(R * 0.45, R * 0.50, 0.15, 6);
  // Brak rotateY -- snieg jest maly, orientacja bez znaczenia, ale spojnosc.
  const snowMat = new THREE.MeshLambertMaterial({ color: SNOW_COLOR });
  const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, mountainSnowCount);
  snowMesh.castShadow = true;
  scene.add(snowMesh);

  // -- Krzewy na wzgorzach -- male stozki (mniejsze niz las)
  const MAX_SHRUBS_PER_HILL = 3;
  const shrubConeGeo = new THREE.ConeGeometry(R * 0.13, R * 0.38, 6);
  const shrubConeMat = new THREE.MeshLambertMaterial({ color: SHRUB_COLOR });
  const shrubMesh = new THREE.InstancedMesh(shrubConeGeo, shrubConeMat, hillCount * MAX_SHRUBS_PER_HILL);
  shrubMesh.castShadow = true;
  scene.add(shrubMesh);

  // ---------------------------------------------------------------------------
  // Oaza na pustyni -- per-hex mesze (nie Instanced, bo skomplikowane)
  // ---------------------------------------------------------------------------

  // Geometrie współdzielone dla elementów oazy
  const oasisPoolGeo  = new THREE.CylinderGeometry(R * 0.35, R * 0.35, R * 0.04, 16);
  const oasisPoolMat  = new THREE.MeshLambertMaterial({ color: OASIS_WATER_COLOR });
  const oasisTrunkGeo = new THREE.CylinderGeometry(R * 0.04, R * 0.055, R * 0.55, 6);
  const oasisTrunkMat = new THREE.MeshLambertMaterial({ color: OASIS_TRUNK_COLOR });
  const oasisFrondGeo = new THREE.ConeGeometry(R * 0.18, R * 0.32, 5);
  const oasisFrondMat = new THREE.MeshLambertMaterial({ color: OASIS_FROND_COLOR });

  // Listę meshy oazy zbierzemy tu, żeby dispose() je posprzątał
  const oasisMeshes: THREE.Mesh[] = [];

  // ---------------------------------------------------------------------------
  // Rzeka proceduralna -- trasa po siatce od Gory/Wzgorza do Morza
  // ---------------------------------------------------------------------------

  // Geometrie i materiały rzeki (tworzone po wyznaczeniu trasy)
  let riverTubeMesh: THREE.Mesh | null = null;
  let riverTubeGeo:  THREE.TubeGeometry | null = null;
  const riverMat = new THREE.MeshLambertMaterial({ color: RIVER_COLOR });

  // ---------------------------------------------------------------------------
  // LCG -- deterministyczny PRNG (ten sam co istnieje, seed z map.seed)
  // ---------------------------------------------------------------------------

  let rndState = map.seed;
  const rnd = () => {
    rndState = (Math.imul(rndState, 1664525) + 1013904223) >>> 0;
    return rndState / 4294967296;
  };

  // ---------------------------------------------------------------------------
  // Mapa instancji dla fog-of-war -- klucz "q,r" → mesh + index + baseColor
  // ---------------------------------------------------------------------------

  const hexInstance = new Map<string, HexInstanceEntry>();

  // ---------------------------------------------------------------------------
  // Pętla główna -- wypełnij macierze instancji + oazy
  // ---------------------------------------------------------------------------

  const dummy = new THREE.Object3D();
  let forestIdx   = 0;
  let snowIdx     = 0;
  let shrubIdx    = 0;

  for (const hex of Object.values(map.hexes)) {
    const t   = hex.terenBazowy;
    const vis = TERRAIN_VISUALS[t];
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    const y = vis.height / 2 + vis.yOffset;

    // Hex prism
    const meshIdx = terrainIndex[t];
    const iIdx    = terrainInstanceIdx[t] ?? 0;
    if (meshIdx !== undefined) {
      const mesh = instancedMeshes[meshIdx]!;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(iIdx, dummy.matrix);

      // Inicjalizuj kolor instancji do koloru bazowego terenu
      const baseColor = new THREE.Color(vis.color);
      mesh.setColorAt(iIdx, baseColor);

      // Rejestruj wpis w mapie instancji (fog-of-war)
      const key = `${hex.coords.q},${hex.coords.r}`;
      hexInstance.set(key, { mesh, index: iIdx, baseColor });

      terrainInstanceIdx[t] = iIdx + 1;
    }

    // Las -- 2-3 stozki
    if (hex.nakladka === Nakladka.Las) {
      const baseY = vis.height + vis.yOffset;
      const treeCount = 2 + (rnd() > 0.5 ? 1 : 0);
      for (let ti = 0; ti < treeCount && forestIdx < forestMesh.count; ti++) {
        const angle  = rnd() * Math.PI * 2;
        const spread = rnd() * R * 0.38;
        const tx = x + Math.cos(angle) * spread;
        const tz = z + Math.sin(angle) * spread;
        const treeH  = 0.28 + rnd() * 0.25;
        dummy.position.set(tx, baseY + treeH / 2 + 0.02, tz);
        dummy.scale.set(1, treeH / 0.55, 1);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        dummy.updateMatrix();
        forestMesh.setMatrixAt(forestIdx, dummy.matrix);
        forestIdx++;
      }
    }

    // Snieg na gorach
    if (t === TerenBazowy.Gory) {
      const snowY = vis.height + vis.yOffset;
      dummy.position.set(x, snowY + 0.07, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      snowMesh.setMatrixAt(snowIdx, dummy.matrix);
      snowIdx++;
    }

    // Krzewy na wzgorzach -- 1-3 male stozki
    if (t === TerenBazowy.Wzgorza) {
      const baseY = vis.height + vis.yOffset;
      const shrubCount = 1 + Math.floor(rnd() * 3); // 1, 2 or 3
      for (let si = 0; si < shrubCount && shrubIdx < hillCount * MAX_SHRUBS_PER_HILL; si++) {
        const angle  = rnd() * Math.PI * 2;
        const spread = rnd() * R * 0.40;
        const sx = x + Math.cos(angle) * spread;
        const sz = z + Math.sin(angle) * spread;
        const shrubH = 0.18 + rnd() * 0.18;
        dummy.position.set(sx, baseY + shrubH / 2 + 0.01, sz);
        dummy.scale.set(1, shrubH / 0.38, 1);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        dummy.updateMatrix();
        shrubMesh.setMatrixAt(shrubIdx, dummy.matrix);
        shrubIdx++;
      }
    }

    // -------------------------------------------------------------------------
    // Oaza na pustyni -- ~1 na 6 hexow pustyni (LCG deterministyczny)
    // -------------------------------------------------------------------------
    if (t === TerenBazowy.Pustynia) {
      // Consume one rnd() call per desert hex for determinism regardless of branch
      const oasisRoll = rnd();
      if (oasisRoll < 1.0 / 6.0) {
        const baseY = vis.height + vis.yOffset; // top of the desert prism

        // Basen wodny -- plaska cylinder na srodku hexa
        const pool = new THREE.Mesh(oasisPoolGeo, oasisPoolMat);
        pool.position.set(x, baseY + R * 0.02, z);
        pool.castShadow = false;
        pool.receiveShadow = true;
        scene.add(pool);
        oasisMeshes.push(pool);

        // 1 lub 2 palmy
        const palmCount = oasisRoll < 1.0 / 12.0 ? 1 : 2;
        for (let pi = 0; pi < palmCount; pi++) {
          // Pozycja palmy -- obok basenu
          const palmAngle = rnd() * Math.PI * 2;
          const palmDist  = R * (0.30 + rnd() * 0.15);
          const px = x + Math.cos(palmAngle) * palmDist;
          const pz = z + Math.sin(palmAngle) * palmDist;

          // Pien palmy
          const trunk = new THREE.Mesh(oasisTrunkGeo, oasisTrunkMat);
          trunk.position.set(px, baseY + R * 0.275, pz);
          // Lekkie pochylenie pnia w bok
          trunk.rotation.set(0, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.25);
          trunk.castShadow = true;
          scene.add(trunk);
          oasisMeshes.push(trunk);

          // Liscie palmy -- 3-4 stozki rozchodzace sie od czubka pnia
          const frondCount = 3 + (rnd() > 0.5 ? 1 : 0);
          const trunkTopY = baseY + R * 0.55;
          for (let fi = 0; fi < frondCount; fi++) {
            const frond = new THREE.Mesh(oasisFrondGeo, oasisFrondMat);
            const frondAngle = (fi / frondCount) * Math.PI * 2 + rnd() * 0.4;
            const tiltOut = 0.55 + rnd() * 0.25; // angle from vertical
            frond.position.set(
              px + Math.cos(frondAngle) * R * 0.18,
              trunkTopY + R * 0.10,
              pz + Math.sin(frondAngle) * R * 0.18,
            );
            frond.rotation.set(tiltOut, frondAngle + Math.PI * 0.5, 0);
            frond.castShadow = true;
            scene.add(frond);
            oasisMeshes.push(frond);
          }
        }
      }
    }
  }

  // Aktualizuj bufor instancji
  for (const m of instancedMeshes) {
    m.instanceMatrix.needsUpdate = true;
    // Zatwierdź inicjalne kolory instancji (bazowe kolory terenu)
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }
  forestMesh.count = forestIdx;
  forestMesh.instanceMatrix.needsUpdate = true;
  snowMesh.count = snowIdx;
  snowMesh.instanceMatrix.needsUpdate = true;
  shrubMesh.count = shrubIdx;
  shrubMesh.instanceMatrix.needsUpdate = true;

  // ---------------------------------------------------------------------------
  // Rzeka -- proceduralne śledzenie od Gory/Wzgorza w dół do Morza
  // ---------------------------------------------------------------------------

  {
    // Zbierz heksy interior Gory i Wzgorza jako kandydatów na źródła
    const W = map.szerokoscQ;
    const H = map.wysokoscR;
    const margin = 2; // omijamy krawędziowe
    const sourceCandidates: Array<[number, number]> = [];
    for (let r = margin; r < H - margin; r++) {
      for (let q = margin; q < W - margin; q++) {
        const hex = map.hexes[`${q},${r}`];
        if (!hex) continue;
        const t = hex.terenBazowy;
        if (t === TerenBazowy.Gory || t === TerenBazowy.Wzgorza) {
          sourceCandidates.push([q, r]);
        }
      }
    }

    // Deterministyczny wybór źródła (seed-based shuffle pick)
    let riverPath: Array<[number, number]> = [];
    const MAX_RIVER_LEN = 40;

    const tryTraceRiver = (sq: number, sr: number): Array<[number, number]> => {
      const path: Array<[number, number]> = [[sq, sr]];
      const visited = new Set<string>([`${sq},${sr}`]);
      let cq = sq, cr = sr;

      for (let step = 0; step < MAX_RIVER_LEN; step++) {
        const curHex = map.hexes[`${cq},${cr}`];
        if (!curHex) break;
        if (curHex.terenBazowy === TerenBazowy.Morze) break;

        // Znajdź sąsiada z najniższym rankingiem terenu
        let bestRank = TERRAIN_ELEVATION_RANK[curHex.terenBazowy];
        let bestNeighbors: Array<[number, number]> = [];

        for (const [dq, dr] of HEX_NEIGHBORS) {
          const nq = cq + dq;
          const nr = cr + dr;
          const key = `${nq},${nr}`;
          if (visited.has(key)) continue;
          const nhex = map.hexes[key];
          if (!nhex) continue;
          const rank = TERRAIN_ELEVATION_RANK[nhex.terenBazowy];
          if (rank < bestRank) {
            bestRank = rank;
            bestNeighbors = [[nq, nr]];
          } else if (rank === bestRank) {
            bestNeighbors.push([nq, nr]);
          }
        }

        if (bestNeighbors.length === 0) break; // utknęliśmy
        // Jeśli kilka równorzędnych, bierzemy pierwszy (deterministyczny)
        const next = bestNeighbors[0]!;
        path.push(next);
        visited.add(`${next[0]},${next[1]}`);
        cq = next[0];
        cr = next[1];

        // Dotarliśmy do morza?
        const nHex = map.hexes[`${cq},${cr}`];
        if (nHex && nHex.terenBazowy === TerenBazowy.Morze) break;
      }
      return path;
    };

    // Próby znalezienia dobrego źródła (min 4 hexów ścieżki)
    // Wybieramy co ~7. kandydat (deterministycznie), max 8 prób
    const totalCandidates = sourceCandidates.length;
    const step = Math.max(1, Math.floor(totalCandidates / 8));
    for (let attempt = 0; attempt < 8 && riverPath.length < 4; attempt++) {
      const idx = (attempt * step) % Math.max(1, totalCandidates);
      const src = sourceCandidates[idx];
      if (!src) continue;
      const candidate = tryTraceRiver(src[0], src[1]);
      if (candidate.length > riverPath.length) riverPath = candidate;
    }

    // Fallback: jeśli nadal za krótka, generuj falistą linię przez środek mapy
    if (riverPath.length < 4) {
      riverPath = [];
      const midR = Math.floor(H / 2);
      for (let q = 0; q < W; q += 2) {
        riverPath.push([q, midR + (q % 4 === 0 ? -1 : 1)]);
      }
    }

    // Zbuduj CatmullRomCurve3 ze środków hexów
    const riverPoints: THREE.Vector3[] = riverPath.map(([q, r]) => {
      const hex = map.hexes[`${q},${r}`];
      const t = hex ? hex.terenBazowy : TerenBazowy.Laka;
      const vis = TERRAIN_VISUALS[t];
      const { x, z } = axialToWorld(q, r, R);
      const yTop = vis.height + vis.yOffset + 0.05; // tuż nad powierzchnią
      return new THREE.Vector3(x, yTop, z);
    });

    if (riverPoints.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(riverPoints, false, 'catmullrom', 0.5);
      const segments = Math.max(20, riverPoints.length * 6);
      riverTubeGeo = new THREE.TubeGeometry(curve, segments, R * 0.12, 8, false);
      riverTubeMesh = new THREE.Mesh(riverTubeGeo, riverMat);
      riverTubeMesh.castShadow = false;
      riverTubeMesh.receiveShadow = true;
      scene.add(riverTubeMesh);
    }
  }

  // -- Kamera
  const center = mapCenter(map.szerokoscQ, map.wysokoscR, R);
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 600);
  const camDist = Math.max(map.szerokoscQ, map.wysokoscR) * R * 1.45;
  camera.position.set(center.x, camDist * 0.9, center.z + camDist * 0.7);
  camera.lookAt(center.x, 0, center.z);

  // -- Resize handler
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // -- Dispose
  function dispose() {
    window.removeEventListener('resize', onResize);
    for (const m of instancedMeshes) { m.geometry.dispose(); }
    for (const mat of Object.values(terrainMaterials)) mat?.dispose();
    forestConeGeo.dispose(); forestConeMat.dispose();
    snowGeo.dispose(); snowMat.dispose();
    shrubConeGeo.dispose(); shrubConeMat.dispose();
    // Oazy
    for (const m of oasisMeshes) { m.geometry.dispose(); }
    oasisPoolGeo.dispose();  oasisPoolMat.dispose();
    oasisTrunkGeo.dispose(); oasisTrunkMat.dispose();
    oasisFrondGeo.dispose(); oasisFrondMat.dispose();
    // Rzeka
    if (riverTubeGeo)  riverTubeGeo.dispose();
    riverMat.dispose();
    renderer.dispose();
  }

  // ---------------------------------------------------------------------------
  // setFog -- przelicza kolory prizmów terenu według stanu mgły wojennej
  // ---------------------------------------------------------------------------

  function setFog(visible: Set<string>, explored: Set<string>): void {
    // Śledź które meshe były dotknięte, żeby zaznaczyć needsUpdate tylko raz
    const touchedMeshes = new Set<THREE.InstancedMesh>();

    for (const [key, entry] of hexInstance) {
      const { mesh, index, baseColor } = entry;
      let color: THREE.Color;

      if (visible.has(key)) {
        // Widoczny -- pełny kolor bazowy (factor 1.0)
        color = baseColor.clone();
      } else if (explored.has(key)) {
        // Odkryty, ale nie widoczny -- przyciemniony (factor 0.45)
        color = baseColor.clone().multiplyScalar(0.45);
      } else {
        // Nieznany -- ciemna mgła wojenna
        color = FOG_HIDDEN_COLOR.clone();
      }

      mesh.setColorAt(index, color);
      touchedMeshes.add(mesh);
    }

    // Zatwierdź zmiany kolorów na wszystkich dotkniętych meshach
    for (const mesh of touchedMeshes) {
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  return { scene, camera, renderer, center, dispose, setFog };
}
