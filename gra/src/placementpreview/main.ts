/**
 * placementpreview/main.ts
 * Prototyp Placement UX ulepszeń terenu — lane Civ-MAPA.
 *
 * Co robi:
 *  1. Generuje mapę + buildScene + setFog (wszystko widoczne).
 *  2. Stawia MIASTA na startPositions + 2 POSTERUNKI jako węzły dróg.
 *  3. Panel budowania po prawej: 15 ulepszeń + tryb "Oglądaj".
 *  4. Raycaster: klik na heks → postaw / usuń ulepszenie (jeśli kwalifikuje).
 *  5. Podświetlenie kwalifikujących heksów (zielona nakładka).
 *  6. HUD: aktywne narzędzie, licznik, instrukcja.
 *
 * KONTRAKTY:
 *  - isInTerritory(q,r): STUB — promień 3 od miasta lub posterunku.
 *    MIASTO podmieni na realne granice (Voronoi / flood-fill).
 *  - Heksy przyrzeczne: z pola hex.rzeka.obecna (generator zapisuje tam flagę).
 *    UWAGA: generator może nie zawsze wypełniać rzeka.obecna — fallback na
 *    sprawdzanie, czy heks należy do jakiegoś riverPath (heurystyka O(n*m)).
 */

import * as THREE from 'three';
import { generateMap } from '../map/generator';
import { buildScene } from '../render/scene';
import { buildStoneAgeCity } from '../render/stoneCity';
import { buildImprovement, IMPROVEMENTS, ImprovementKey } from '../render/improvements';
import { axialToWorld, worldToAxial, HEX_R } from '../render/hexutil';
import { TerenBazowy, Nakladka } from '../types/hex';

// ============================================================
// STAŁE
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

// Kolory właścicieli (kolejne starty)
const OWNER_COLORS = [0xffd54a, 0xe53935, 0x43a047, 0x1e88e5, 0xfb8c00, 0x8e24aa];
const LEVEL_SEQ    = [2, 5, 8, 10, 3, 7, 4, 9, 6, 1];

// ============================================================
// MAPA KWALIFIKACJI (z terrain-improvements.json zredukowana do TerenBazowy)
// ============================================================

type TerenSet = Set<TerenBazowy>;

/** Tereny dopuszczalne per klucz ulepszenia.
 *  null = dowolny ląd (fort, droga, posterunek). */
const TERRAIN_ALLOW: Partial<Record<ImprovementKey, TerenSet | null>> = {
  farma:          new Set([TerenBazowy.Laka, TerenBazowy.Rownina]),
  irygacja:       new Set([TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia]),
  pastwisko:      new Set([TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza]),
  kopalnia:       new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  glinianka:      null, // złoże gliny — nakładka; kwalifikacja przez nakładkę
  kamieniolom:    new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  oboz_lowiecki:  null, // złoże dzikie/las — kwalifikacja przez nakładkę / las
  wyrab:          null, // las — nakładka
  lodzie_rybackie: new Set([TerenBazowy.Wybrzeze, TerenBazowy.Morze]),
  plantacja:      new Set([TerenBazowy.Laka, TerenBazowy.Rownina]),
  warzelnia_soli: new Set([TerenBazowy.Wybrzeze]),
  tarasy:         new Set([TerenBazowy.Wzgorza]),
  fort:           null, // dowolny ląd w terytorium
  droga:          null, // specjalna kwalifikacja
  posterunek:     null, // specjalna kwalifikacja
};

/** Wymagane nakładki (null = bez wymagania nakładki) */
const NAKLADKA_REQUIRE: Partial<Record<ImprovementKey, Nakladka | null>> = {
  glinianka:     Nakladka.ZlozeGliny,
  kopalnia:      Nakladka.ZlozeRudy,  // preferowane (też Wzgórza/Góry bez nakładki)
  oboz_lowiecki: null, // las lub złoże zwierzęce — obsługiwane w qualifies()
  wyrab:         Nakladka.Las,
};

// ============================================================
// FUNKCJE POMOCNICZE
// ============================================================

function clampInt(v: string | null, def: number, lo: number, hi: number): number {
  if (v === null) return def;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(hi, Math.max(lo, n));
}

function axialDist(aq: number, ar: number, bq: number, br: number): number {
  const as_ = -aq - ar;
  const bs  = -bq - br;
  return (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(as_ - bs)) / 2;
}

/** Sąsiedzi aksjalni heksa (6 kierunków pointy-top). */
function hexNeighbors(q: number, r: number): {q:number,r:number}[] {
  return [
    {q:q+1,r:r}, {q:q-1,r:r},
    {q:q,r:r+1}, {q:q,r:r-1},
    {q:q+1,r:r-1}, {q:q-1,r:r+1},
  ];
}

// ============================================================
// STAN GLOBALNY (wypełniany po buildScene)
// ============================================================

interface CityNode { q: number; r: number; isOutpost: boolean; }

let mapData: ReturnType<typeof generateMap> | null = null;
let cityNodes: CityNode[] = [];

// Zbiór kluczy "q,r" heksów, które leżą na riverpaths (dla irygacji)
let riverHexSet: Set<string> = new Set();

// Zbiór kluczy "q,r" heksów z istniejącymi drogami
let roadHexSet: Set<string> = new Set();

// ============================================================
// KWALIFIKACJA TERYTORIUM
// STUB — MIASTO dostarczy realne granice
// ============================================================

/**
 * isInTerritory(q, r) → boolean
 *
 * KONTRAKT (STUB):
 *   Wejście:  aksjalny heks (q, r)
 *   Wyjście:  true jeśli heks należy do terytorium któregokolwiek miasta/posterunku
 *
 * IMPLEMENTACJA STUB: heks jest w terytorium jeśli axialDist ≤ TERRITORY_RADIUS
 * od któregokolwiek węzła (miasta lub posterunku z cityNodes).
 *
 * // STUB — MIASTO dostarczy realne granice (Voronoi / flood-fill po zasobach)
 * // Podmianka: przekaż do tej funkcji Set<string> granic miast wyliczony przez
 * //            moduł MIASTO i zastąp poniższą logikę sprawdzeniem Set.has(`${q},${r}`).
 */
const TERRITORY_RADIUS = 3; // heksy od węzła miasta/posterunku

function isInTerritory(q: number, r: number): boolean {
  // STUB — MIASTO dostarczy realne granice
  for (const node of cityNodes) {
    if (axialDist(q, r, node.q, node.r) <= TERRITORY_RADIUS) return true;
  }
  return false;
}

/** Czy heks leży NA KRAWĘDZI terytorium (dla posterunku). */
function isOnTerritoryEdge(q: number, r: number): boolean {
  if (isInTerritory(q, r)) return true;
  // Sąsiaduje z terytorium
  for (const nb of hexNeighbors(q, r)) {
    if (isInTerritory(nb.q, nb.r)) return true;
  }
  return false;
}

/** Czy heks sąsiaduje z istniejącą drogą lub z miastem/posterunkiem. */
function isRoadQualified(q: number, r: number): boolean {
  for (const nb of hexNeighbors(q, r)) {
    const key = `${nb.q},${nb.r}`;
    if (roadHexSet.has(key)) return true;
    for (const node of cityNodes) {
      if (nb.q === node.q && nb.r === node.r) return true;
    }
  }
  // Bezpośrednio obok węzła
  for (const node of cityNodes) {
    if (axialDist(q, r, node.q, node.r) === 1) return true;
  }
  return false;
}

/** Czy heks jest przyrzeczny (irygacja).
 *
 * IMPLEMENTACJA: używamy hex.rzeka.obecna jeśli true, dodatkowo
 * sprawdzamy riverHexSet (heksy zaznaczone przez generator jako należące do riverPaths).
 *
 * HEURYSTYKA: riverPaths to tablice heksów przez które rzeka "przepływa" (środkami).
 * Heks jest przyrzeczny jeśli:
 *   a) hex.rzeka.obecna === true (preferowane — ustawiane przez generator), LUB
 *   b) klucz należy do riverHexSet (heks jest w riverPath), LUB
 *   c) któryś sąsiad jest w riverHexSet (sąsiaduje z osią rzeki).
 *
 * Niedokładność: riverPaths nie opisuje krawędzi — może brakować heksów
 * które graniczyłyby krawędzią z rzeką, ale nie leżą na jej środku.
 * Oznaczone komentarzem HEURYSTYKA_IRYGACJA.
 */
function isRiverAdjacent(q: number, r: number): boolean {
  // HEURYSTYKA_IRYGACJA: riverPaths to osie rzek (środki heksów), nie krawędzie.
  // hex.rzeka.obecna jest autorytatywne jeśli generator je wypełnia.
  if (mapData) {
    const hex = mapData.hexes[`${q},${r}`];
    if (hex?.rzeka?.obecna) return true;
  }
  // Fallback: własny heks lub sąsiad leży na riverPath
  const key = `${q},${r}`;
  if (riverHexSet.has(key)) return true;
  for (const nb of hexNeighbors(q, r)) {
    if (riverHexSet.has(`${nb.q},${nb.r}`)) return true;
  }
  return false;
}

// ============================================================
// GŁÓWNA LOGIKA KWALIFIKACJI
// ============================================================

function qualifies(key: ImprovementKey, q: number, r: number): boolean {
  if (!mapData) return false;
  const hex = mapData.hexes[`${q},${r}`];
  if (!hex) return false;
  const teren = hex.terenBazowy;
  const nakladka = hex.nakladka;

  switch (key) {
    // --- SPECJALNE ---
    case 'droga':
      return TERENY_LADU.has(teren) && isRoadQualified(q, r);

    case 'posterunek':
      return TERENY_LADU.has(teren) && isOnTerritoryEdge(q, r);

    case 'irygacja':
      if (!TERRAIN_ALLOW.irygacja?.has(teren)) return false;
      if (!isInTerritory(q, r)) return false;
      return isRiverAdjacent(q, r);

    case 'fort':
      return TERENY_LADU.has(teren) && isInTerritory(q, r);

    // --- NAKŁADKA GLINY ---
    case 'glinianka':
      return nakladka === Nakladka.ZlozeGliny && isInTerritory(q, r);

    // --- KOPALNIA: ruda lub wzgórza/góry ---
    case 'kopalnia':
      if (!isInTerritory(q, r)) return false;
      return nakladka === Nakladka.ZlozeRudy ||
             teren === TerenBazowy.Wzgorza ||
             teren === TerenBazowy.Gory;

    // --- WYRĄB: las ---
    case 'wyrab':
      return nakladka === Nakladka.Las && isInTerritory(q, r);

    // --- OBÓZ ŁOWIECKI: las lub złoże zwierzęce ---
    case 'oboz_lowiecki': {
      if (!isInTerritory(q, r)) return false;
      const zwierzece = new Set([
        Nakladka.ZlozeKonia, Nakladka.ZlozeOwiec,
        Nakladka.ZlozeBydla, Nakladka.ZlozeLamy,
      ]);
      return nakladka === Nakladka.Las || zwierzece.has(nakladka);
    }

    // --- WARZELNIA SOLI: wybrzeże (w JSON też złoże soli — brak w Nakladka enum) ---
    case 'warzelnia_soli':
      if (!isInTerritory(q, r)) return false;
      return teren === TerenBazowy.Wybrzeze;

    // --- ŁODZIE RYBACKIE: woda ---
    case 'lodzie_rybackie':
      // NIE wymaga terytorium (morze jest poza terytorium zazwyczaj)
      return teren === TerenBazowy.Wybrzeze || teren === TerenBazowy.Morze;

    // --- PASTWISKO: teren + nakładka zwierzęca preferowana ale nie wymagana w prototypie ---
    case 'pastwisko': {
      if (!isInTerritory(q, r)) return false;
      const allowed = TERRAIN_ALLOW.pastwisko;
      return !!allowed && allowed.has(teren);
    }

    // --- POZOSTAŁE: teren + terytorium ---
    default: {
      const allowed = TERRAIN_ALLOW[key];
      if (!TERENY_LADU.has(teren)) return false;
      if (!isInTerritory(q, r)) return false;
      if (allowed && !allowed.has(teren)) return false;
      return true;
    }
  }
}

// ============================================================
// PODŚWIETLENIE — zielona nakładka nad kaflem
// ============================================================

function makeHighlightMesh(): THREE.Mesh {
  // Walec płaski (approx heks) — lekko uniesiony nad kaflem
  const geo = new THREE.CylinderGeometry(HEX_R * 0.9, HEX_R * 0.9, 0.04, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x44ff88, transparent: true, opacity: 0.35,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.y = Math.PI / 6; // obrót by "flat side" był poziomy
  return m;
}

function makeBlockedMesh(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(HEX_R * 0.9, HEX_R * 0.9, 0.04, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff3322, transparent: true, opacity: 0.18,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.y = Math.PI / 6;
  return m;
}

// ============================================================
// BOOT
// ============================================================

function boot(): void {
  const canvas = document.getElementById('map') as HTMLCanvasElement | null;
  if (!canvas) { console.error('placementpreview: brak <canvas id="map">'); return; }

  const params = new URLSearchParams(location.search);
  const W    = clampInt(params.get('w'), 46, 12, 120);
  const H    = clampInt(params.get('h'), 32, 10, 90);
  const SEED = params.get('seed') !== null ? (parseInt(params.get('seed')!, 10) || 0) : 7;

  mapData = generateMap(W, H, SEED);
  const map = mapData;
  const { scene, camera, renderer, center, setFog } = buildScene(map, canvas);

  // Wszystko widoczne
  const allKeys = new Set<string>(Object.keys(map.hexes));
  setFog(allKeys, new Set<string>());

  // --- Zbuduj riverHexSet z riverPaths ---
  for (const path of map.riverPaths) {
    for (const pos of path) {
      riverHexSet.add(`${pos.q},${pos.r}`);
    }
  }

  // --- MIASTA na startPositions ---
  const starts = (map as unknown as { startPositions?: { q: number; r: number }[] }).startPositions ?? [];
  let ci = 0, cityCount = 0;
  for (const sp of starts) {
    const hex = map.hexes[`${sp.q},${sp.r}`];
    if (!hex) continue;
    const t = hex.terenBazowy;
    if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;
    const level  = LEVEL_SEQ[ci % LEVEL_SEQ.length]!;
    const walls  = ci % 3 === 0;
    const city   = buildStoneAgeCity(level, OWNER_COLORS[ci % OWNER_COLORS.length]!, walls);
    const { x, z } = axialToWorld(sp.q, sp.r, HEX_R);
    city.position.set(x, (TERR_TOP[t] ?? 0.45) + 0.01, z);
    scene.add(city);
    cityNodes.push({ q: sp.q, r: sp.r, isOutpost: false });
    ci++; cityCount++;
    if (cityCount >= 8) break;
  }

  // --- 2 POSTERUNKI (węzły dróg) — w pobliżu pierwszych dwóch miast ---
  const OUTPOST_OWNER = 0xffd54a;
  let outpostCount = 0;
  for (let ni = 0; ni < Math.min(2, cityNodes.length) && outpostCount < 2; ni++) {
    const node = cityNodes[ni]!;
    // Szukaj heksu w odległości 4–6 od miasta, lad, kwalifikuje sie na posterunek
    let placed = false;
    for (let dist = 4; dist <= 6 && !placed; dist++) {
      // Spirala po heksach w danej odległości
      const candidates: {q:number,r:number}[] = [];
      for (let dq = -dist; dq <= dist; dq++) {
        for (let dr = -dist; dr <= dist; dr++) {
          if (Math.round(axialDist(0,0,dq,dr)) === dist) {
            candidates.push({ q: node.q + dq, r: node.r + dr });
          }
        }
      }
      for (const cand of candidates) {
        const h = map.hexes[`${cand.q},${cand.r}`];
        if (!h) continue;
        if (!TERENY_LADU.has(h.terenBazowy)) continue;
        if (h.terenBazowy === TerenBazowy.Gory) continue;
        // Tymczasowo dodaj węzeł by qualifies() widział go jako sąsiada terytorium
        // (posterunek może być na krawędzi -> sprawdzamy odległość od węzłów)
        const distToNode = axialDist(cand.q, cand.r, node.q, node.r);
        if (distToNode <= TERRITORY_RADIUS + 1) {
          // Postaw posterunek
          const outpost = buildImprovement('posterunek', OUTPOST_OWNER);
          const { x, z } = axialToWorld(cand.q, cand.r, HEX_R);
          outpost.position.set(x, (TERR_TOP[h.terenBazowy] ?? 0.45) + 0.01, z);
          scene.add(outpost);
          cityNodes.push({ q: cand.q, r: cand.r, isOutpost: true });
          outpostCount++;
          placed = true;
          break;
        }
      }
    }
  }

  // --- Budowanie panelu bocznego (lista ulepszeń) ---
  let activeTool: ImprovementKey | null = null;
  let highlightEnabled = true;

  const impList   = document.getElementById('imp-list')!;
  const btnWatch  = document.getElementById('btn-watch')!;
  const toolInfo  = document.getElementById('tool-info')!;
  const counterEl = document.getElementById('counter')!;
  const metaEl    = document.getElementById('meta')!;
  const btnHL     = document.getElementById('btn-highlight')!;

  // ============================================================
  // FEEDBACK KURSORA — kursor-młotek + ghost chip
  // ============================================================

  // Kursor-młotek: inline SVG jako data-URI (hammer icon)
  // Hotspot 4,4 (lewy-górny narożnik głowicy)
  const HAMMER_SVG_RAW = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">'
    + '<rect x="11" y="2" width="8" height="4" rx="1.5" fill="%23d4d4d4"/>'
    + '<rect x="9" y="6" width="12" height="6" rx="2" fill="%23e8e8e8"/>'
    + '<rect x="12" y="12" width="5" height="13" rx="1.5" fill="%23b0b0b0"/>'
    + '</svg>';
  const HAMMER_CURSOR = 'url("data:image/svg+xml,' + HAMMER_SVG_RAW + '") 4 4, crosshair';

  // Mapowanie emoji per ImprovementKey
  const TOOL_EMOJI: Partial<Record<ImprovementKey, string>> = {
    droga:           '🛣️',
    farma:           '🌾',
    irygacja:        '💧',
    pastwisko:       '🐄',
    kopalnia:        '⛏️',
    glinianka:       '🏺',
    kamieniolom:     '🪨',
    oboz_lowiecki:   '🏕️',
    wyrab:           '🪓',
    tarasy:          '🌱',
    lodzie_rybackie: '🎣',
    plantacja:       '🍇',
    warzelnia_soli:  '🧂',
    fort:            '🏰',
    posterunek:      '🗼',
  };

  // Ghost chip — pływający div śledzący kursor myszy
  const ghostChip = document.createElement('div');
  ghostChip.id = 'ghost-chip';
  ghostChip.style.cssText = [
    'position:fixed',
    'pointer-events:none',
    'z-index:9999',
    'display:none',
    'align-items:center',
    'gap:4px',
    'padding:3px 8px 3px 5px',
    'border-radius:20px',
    'background:rgba(30,34,50,0.90)',
    'border:1.5px solid rgba(255,212,121,0.75)',
    'color:#ffd479',
    'font-family:system-ui,"Segoe UI",Arial,sans-serif',
    'font-size:13px',
    'font-weight:700',
    'white-space:nowrap',
    'box-shadow:0 2px 10px rgba(0,0,0,0.55)',
    'line-height:1.4',
    'transition:background 0.15s,border-color 0.15s',
  ].join(';');
  document.body.appendChild(ghostChip);

  let chipOverCanvas = false;

  /** Ustawia kursor i widoczność ghost chipa zgodnie z activeTool */
  function updateCursorFeedback(): void {
    if (activeTool) {
      const imp = IMPROVEMENTS.find(i => i.key === activeTool);
      const emoji = TOOL_EMOJI[activeTool] ?? '🔨';
      const label = imp?.label ?? activeTool;
      ghostChip.innerHTML =
        '<span style="font-size:16px;line-height:1">' + emoji + '</span>'
        + '<span style="font-size:11px">' + label + '</span>';
      canvas.style.cursor = HAMMER_CURSOR;
      if (chipOverCanvas) ghostChip.style.display = 'flex';
    } else {
      canvas.style.cursor = 'default';
      ghostChip.style.display = 'none';
    }
  }

  /** Tymczasowo pokoloruj ghost chip na czerwono (nieudane postawienie) */
  function flashChipError(): void {
    ghostChip.style.background = 'rgba(180,30,30,0.92)';
    ghostChip.style.borderColor = '#ff6655';
    setTimeout(() => {
      ghostChip.style.background = 'rgba(30,34,50,0.90)';
      ghostChip.style.borderColor = 'rgba(255,212,121,0.75)';
    }, 800);
  }

  // Śledź wejście/wyjście kursora z canvasa
  canvas.addEventListener('mouseenter', () => {
    chipOverCanvas = true;
    if (activeTool) ghostChip.style.display = 'flex';
  });
  canvas.addEventListener('mouseleave', () => {
    chipOverCanvas = false;
    ghostChip.style.display = 'none';
  });
  // Pozycjonuj ghost chip lekko z prawej-góry od kursora
  window.addEventListener('mousemove', (e: MouseEvent) => {
    ghostChip.style.left = (e.clientX + 18) + 'px';
    ghostChip.style.top  = (e.clientY - 32) + 'px';
  });

    metaEl.textContent = `${W}×${H} hex · seed ${SEED} · miast: ${cityCount} · posterunki: ${outpostCount} · rzek: ${map.riverPaths.length}`;

  const EPOKA_LABEL: Record<number, string> = { 1: 'E1 Kamień', 2: 'E2 Brąz', 3: 'E3 Żelazo' };

  const toolBtns: HTMLButtonElement[] = [];
  for (const imp of IMPROVEMENTS) {
    const btn = document.createElement('button');
    btn.className = `imp-btn e${imp.epoka}`;
    btn.innerHTML = `${imp.label} <span class="epoka">${EPOKA_LABEL[imp.epoka] ?? ''}</span>`;
    btn.addEventListener('click', () => {
      if (activeTool === imp.key) {
        // odznacz
        activeTool = null;
        updateToolUI();
      } else {
        activeTool = imp.key;
        updateToolUI();
      }
    });
    toolBtns.push(btn);
    impList.appendChild(btn);
  }

  btnWatch.addEventListener('click', () => {
    activeTool = null;
    updateToolUI();
  });

  btnHL.addEventListener('click', () => {
    highlightEnabled = !highlightEnabled;
    btnHL.textContent = `Podświetl: ${highlightEnabled ? 'on' : 'off'}`;
    updateHighlights();
  });

  function updateToolUI() {
    for (const b of toolBtns) b.classList.remove('active');
    if (activeTool) {
      const idx = IMPROVEMENTS.findIndex(i => i.key === activeTool);
      if (idx >= 0) toolBtns[idx]?.classList.add('active');
      const imp = IMPROVEMENTS.find(i => i.key === activeTool);
      toolInfo.textContent = `Tryb: ${imp?.label ?? activeTool}`;
      btnWatch.classList.remove('active');
    } else {
      toolInfo.textContent = 'Tryb: Oglądaj';
      btnWatch.classList.add('active');
    }
    updateHighlights();
    updateCursorFeedback();
  }

  // ---- Podświetlenie kwalifikujących heksów ----
  const highlightObjects: THREE.Object3D[] = [];

  function clearHighlights() {
    for (const obj of highlightObjects) scene.remove(obj);
    highlightObjects.length = 0;
  }

  function updateHighlights() {
    clearHighlights();
    if (!activeTool || !highlightEnabled) return;

    for (const hex of Object.values(map.hexes)) {
      const { q, r } = hex.coords;
      const isQ = qualifies(activeTool!, q, r);
      if (isQ) {
        const hl = makeHighlightMesh();
        const { x, z } = axialToWorld(q, r, HEX_R);
        hl.position.set(x, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.035, z);
        scene.add(hl);
        highlightObjects.push(hl);
      }
    }
  }

  // ---- Stan postawionych ulepszeń ----
  // "q,r" -> { key, group }
  const placed = new Map<string, { key: ImprovementKey; group: THREE.Group }>();

  function updateCounter() {
    counterEl.textContent = `Postawione ulepszenia: ${placed.size}`;
  }

  // ---- Raycaster ----
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Budujemy mesh-y kafli dla raycasta (niewidoczne, nad powierzchnią)
  // Jeden walec 6-kątny per heks, wystarczająco duży by złapać klik
  const raycastMeshes: THREE.Mesh[] = [];
  const meshToHex = new Map<THREE.Mesh, { q: number; r: number }>();

  // Tworzymy uproszczone PLANE per heks — ale walce będą dokładniejsze
  // Używamy CylinderGeometry (6 seg) jako przybliżenia heksa
  {
    const rGeo = new THREE.CylinderGeometry(HEX_R * 0.95, HEX_R * 0.95, 0.5, 6);
    // Współdzielony material (invisible)
    const rMat = new THREE.MeshBasicMaterial({ visible: false });
    for (const hex of Object.values(map.hexes)) {
      const { q, r } = hex.coords;
      const m = new THREE.Mesh(rGeo, rMat);
      m.rotation.y = Math.PI / 6;
      const { x, z } = axialToWorld(q, r, HEX_R);
      const top = TERR_TOP[hex.terenBazowy] ?? 0.45;
      m.position.set(x, top, z);
      scene.add(m);
      raycastMeshes.push(m);
      meshToHex.set(m, { q, r });
    }
  }

  // Rozróżnienie: czy pointer był draggowany (not a click)?
  let pointerDownPos = { x: 0, y: 0 };
  let pointerDragged = false;

  canvas.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
    pointerDragged = false;
  });

  window.addEventListener('pointermove', (e) => {
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    if (Math.hypot(dx, dy) > 4) pointerDragged = true;
  });

  canvas.addEventListener('pointerup', (e) => {
    if (pointerDragged) return; // drag → nie klik
    if (!activeTool) return;     // tryb oglądaj

    const rect = canvas.getBoundingClientRect();
    mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(raycastMeshes, false);
    if (hits.length === 0) return;

    const hitMesh = hits[0]!.object as THREE.Mesh;
    const coords  = meshToHex.get(hitMesh);
    if (!coords) return;

    const { q, r } = coords;
    const hexKey = `${q},${r}`;
    const hex = map.hexes[hexKey];
    if (!hex) return;

    // Toggle: ten sam klucz = usuń
    const existing = placed.get(hexKey);
    if (existing) {
      if (existing.key === activeTool) {
        // Usuń
        scene.remove(existing.group);
        placed.delete(hexKey);
        if (activeTool === 'droga') roadHexSet.delete(hexKey);
        if (activeTool === 'posterunek') {
          cityNodes = cityNodes.filter(n => !(n.q === q && n.r === r && n.isOutpost));
        }
        updateCounter();
        updateHighlights();
        return;
      } else {
        // Inne narzędzie → usuń stary, postaw nowy (jeśli kwalifikuje)
        scene.remove(existing.group);
        placed.delete(hexKey);
        if (existing.key === 'droga') roadHexSet.delete(hexKey);
        if (existing.key === 'posterunek') {
          cityNodes = cityNodes.filter(n => !(n.q === q && n.r === r && n.isOutpost));
        }
      }
    }

    // Sprawdź kwalifikację
    if (!qualifies(activeTool, q, r)) {
      // Flash red info (nie blokuj)
      const oldText = toolInfo.textContent;
      toolInfo.textContent = '✗ Ten teren nie kwalifikuje się!';
      toolInfo.style.color = '#ff6655';
      setTimeout(() => { toolInfo.textContent = oldText; toolInfo.style.color = '#ffd479'; }, 1200);
      flashChipError();
      return;
    }

    // Postaw ulepszenie
    const group = buildImprovement(activeTool, OWNER_COLORS[0]!);
    const { x, z } = axialToWorld(q, r, HEX_R);
    const top = TERR_TOP[hex.terenBazowy] ?? 0.45;
    group.position.set(x, top + 0.01, z);
    scene.add(group);
    placed.set(hexKey, { key: activeTool, group });

    // Aktualizuj dodatkowy stan
    if (activeTool === 'droga') {
      roadHexSet.add(hexKey);
      updateHighlights(); // przebuduj (rozrost sieci dróg)
    }
    if (activeTool === 'posterunek') {
      cityNodes.push({ q, r, isOutpost: true });
      updateHighlights(); // przebuduj (nowy węzeł rozszerza terytorium)
    }

    updateCounter();
    updateHighlights();
  });

  // ---- Kamera: orbit ----
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
    const st = radius * 0.012, fx = -Math.sin(theta), fz = -Math.cos(theta), rx = Math.cos(theta), rz = -Math.sin(theta);
    if (pressed.has('w') || pressed.has('arrowup'))    { tx += fx * st; tz += fz * st; }
    if (pressed.has('s') || pressed.has('arrowdown'))  { tx -= fx * st; tz -= fz * st; }
    if (pressed.has('d') || pressed.has('arrowright')) { tx += rx * st; tz += rz * st; }
    if (pressed.has('a') || pressed.has('arrowleft'))  { tx -= rx * st; tz -= rz * st; }
    updateCam();
  }

  // Przyciski HUD
  const bS = document.getElementById('btn-seed'), bR = document.getElementById('btn-reset');
  if (bS) bS.addEventListener('click', () => { const s = Math.floor(Math.random() * 100000); const p = new URLSearchParams(location.search); p.set('seed', String(s)); location.search = p.toString(); });
  if (bR) bR.addEventListener('click', () => { radius = init.radius; theta = init.theta; phi = init.phi; tx = init.tx; tz = init.tz; updateCam(); });

  updateCam();
  updateToolUI(); // inicjalizacja panelu

  renderer.setAnimationLoop(() => { applyPan(); renderer.render(scene, camera); });
  (window as unknown as { __placementReady?: boolean }).__placementReady = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
