/**
 * mainview/main.ts
 * Widok główny — prototyp HUD + Mapa 3D + Tryb BUDOWA (placement) + Zasięg cywilizacji.
 *
 * Tryby:
 *   MAIN  — pełny HUD widoczny; klik ikon 1–7 otwiera modal-placeholder.
 *   BUILD — panel ulepszeń + kursor-młotek + ghost chip + klik-stawianie.
 *           Przełączenie przez ikonę 🔨 / baner "← Powrót do mapy".
 *   TERRITORY — toggle „🗺️ Zasięg cywilizacji" — tint + obrys granic.
 */

import * as THREE from 'three';
import { generateMap } from '../map/generator';
import { buildScene } from '../render/scene';
import { buildStoneAgeCity } from '../render/stoneCity';
import { buildImprovement, IMPROVEMENTS, ImprovementKey } from '../render/improvements';
import { axialToWorld, HEX_R } from '../render/hexutil';
import { TerenBazowy, Nakladka } from '../types/hex';
import { buildBronzeCity, BRONZE_CIVS, BronzeCiv } from '../render/bronzeCity';
import {
  CityNode as TerritoryCityNode,
  axialDistance,
  cityTerritoryRadius,
  isInTerritory as territoryIsInTerritory,
} from '../map/territory';
import civsData from '../../data/civs.json';

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

// Tereny dozwolone do zakladania miast (NIE Morze, NIE Gory)
const TERENY_ZALOZEN_MIASTA = new Set<TerenBazowy>([
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia,
  TerenBazowy.Wzgorza, TerenBazowy.Wybrzeze,
]);

const OWNER_COLORS = [0xffd54a, 0xe53935, 0x43a047, 0x1e88e5, 0xfb8c00, 0x8e24aa];
const LEVEL_SEQ    = [2, 5, 8, 10, 3, 7, 4, 9, 6, 1];

// ============================================================
// NAZWY MIAST — mapowanie BronzeCiv → nazwyKlastra (z civs.json)
// ============================================================
// Mapowanie klucza JSON → klucz BronzeCiv używany w buildBronzeCity
const CIV_JSON_TO_BRONZE: Record<string, BronzeCiv> = {
  'Grecy':     'grecja',
  'Rzymianie': 'rzym',
  'Chińczycy': 'chiny',
  'Inkowie':   'inka',
  'Zulusi':    'zulu',
  'Egipt':     'egipt',
  'Sumerowie': 'sumer',
  'Celtowie':  'celtowie',
  'Germanie':  'germanie',
};

// Buduj mapę: BronzeCiv → string[] (lista nazw, [0] = stolica)
const CIV_NAMES: Map<BronzeCiv, string[]> = new Map();
const _civsArr = (civsData as { cywilizacje?: Array<{ Cywilizacja: string; nazwyKlastra?: string[] }> }).cywilizacje ?? [];
for (const c of _civsArr) {
  const bronze = CIV_JSON_TO_BRONZE[c.Cywilizacja];
  if (bronze && c.nazwyKlastra && c.nazwyKlastra.length > 0) {
    CIV_NAMES.set(bronze, c.nazwyKlastra);
  }
}
// Fallback: każda BronzeCiv bez wpisu — polska pula nazw
const FALLBACK_NAMES: string[] = ['Gród', 'Warownia', 'Osada', 'Twierdza', 'Siedziba', 'Zamek', 'Kasztel', 'Wieża', 'Bastion', 'Cytadela'];
function getCivName(civ: BronzeCiv | undefined, index: number): string {
  if (civ) {
    const names = CIV_NAMES.get(civ);
    if (names && names.length > 0) return names[index % names.length] ?? names[0] ?? FALLBACK_NAMES[0]!;
  }
  // STUB: docelowo nazwa z cityState/MIASTO+DANE
  return FALLBACK_NAMES[index % FALLBACK_NAMES.length] ?? 'Miasto';
}

// Liczniki indeksów nazw per cyw — żeby kolejne miasta tej samej cyw miały różne nazwy
const civNameIndex: Map<BronzeCiv | 'stub', number> = new Map();
function nextCivNameIndex(civ: BronzeCiv | undefined): number {
  const key = civ ?? 'stub';
  const idx = civNameIndex.get(key) ?? 0;
  civNameIndex.set(key, idx + 1);
  return idx;
}

// Cywilizacje — 9 typów (kolor + skrót + nazwa + emoji)
const CIVS = [
  { name: 'Grecy',     abbr: 'GR', color: '#3a7bd5', emoji: '🏛️', player: true  },
  { name: 'Rzym',      abbr: 'RZ', color: '#c0392b', emoji: '⚔️', player: false },
  { name: 'Chiny',     abbr: 'CH', color: '#e67e22', emoji: '🐉', player: false },
  { name: 'Inkowie',   abbr: 'IN', color: '#8e44ad', emoji: '🦙', player: false },
  { name: 'Zulusi',    abbr: 'ZU', color: '#16a085', emoji: '🛡️', player: false },
  { name: 'Egipt',     abbr: 'EG', color: '#f39c12', emoji: '𓂀',  player: false },
  { name: 'Sumer',     abbr: 'SU', color: '#795548', emoji: '🏺', player: false },
  { name: 'Celtowie',  abbr: 'CE', color: '#2e7d32', emoji: '🌿', player: false },
  { name: 'Germanie',  abbr: 'GE', color: '#546e7a', emoji: '🪓', player: false },
];

// Treści modali (placeholder)
const MODAL_CONTENT: Record<string, { title: string; body: string }> = {
  epoka: {
    title: '⚗️ Postęp epoki',
    body: `<div class="progress-bar-wrap">
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:35%"></div></div>
      <div class="progress-label">35% · Epoka Brązu</div>
    </div>
    <p>Ukończ jeszcze 4 technologie aby przejść do Epoki Żelaza.<br><br>
    <em style="color:#8fa0c0">[Placeholder — sub-widok Postępu Epoki]</em></p>`,
  },
  tech: {
    title: '🔬 Badania technologiczne',
    body: `<div class="progress-bar-wrap">
      <div class="progress-bar-track"><div class="progress-bar-fill blue" style="width:62%"></div></div>
      <div class="progress-label">62% · Metalurgia Brązu</div>
    </div>
    <p>Bieżąca technologia: <strong style="color:#ffd479">Metalurgia Brązu</strong><br>
    Szacowany czas: 3 tury (89 nauki/turę)<br><br>
    <em style="color:#8fa0c0">[Placeholder — drzewo technologiczne]</em></p>`,
  },
  idee: {
    title: '💡 Opracowanie idei',
    body: `<div class="progress-bar-wrap">
      <div class="progress-bar-track"><div class="progress-bar-fill green" style="width:48%"></div></div>
      <div class="progress-label">48% · Mistycyzm</div>
    </div>
    <p>Bieżąca idea: <strong style="color:#ffd479">Mistycyzm</strong><br>
    <em style="color:#8fa0c0">[Placeholder — drzewo idei kulturowych]</em></p>`,
  },
  doktryny: {
    title: '📜 Doktryny społeczne',
    body: `<p>Aktywne doktryny:<br><br>
    🏛️ <strong>Arystokracja</strong> — +10% do produkcji dóbr luksusowych<br>
    🛡️ <strong>Militaryzm</strong> — -15% koszt utrzymania armii<br><br>
    Dostępne sloty: 2/4<br><br>
    <em style="color:#8fa0c0">[Placeholder — wybór doktryn, drzewo polityczne]</em></p>`,
  },
  zasoby: {
    title: '📦 Panel zasobów',
    body: `<p>Surowce strategiczne:<br><br>
    🪨 Kamień: 12 jednostek · Przydział: 8 do budowy<br>
    🪵 Drewno: 34 jednostki · Przydział: 20 do budowy<br>
    🐑 Owce: 6 stad · Przydział: 4 do osiedli<br><br>
    <em style="color:#8fa0c0">[Placeholder — zarządzanie zasobami / przydział do osiedli]</em></p>`,
  },
  dziela: {
    title: '🏛️ Panel wielkich dzieł',
    body: `<p>Ukończone wielkie dzieła: <strong style="color:#ffd479">2</strong><br><br>
    🎨 "Fresk z Akrotiri" — +3 kultura/turę<br>
    📜 "Epos o Gilgameszu" — +2 nauka/turę<br><br>
    Dostępne sloty: 3/5<br><br>
    <em style="color:#8fa0c0">[Placeholder — galeria wielkich dzieł]</em></p>`,
  },
  odblokowane: {
    title: '🔓 Odblokowane elementy',
    body: `<p>Ostatnio odblokowane:<br><br>
    ⚔️ Jednostka: <strong>Rydwan Wojenny</strong> (wymaga Koni)<br>
    🏗️ Budynek: <strong>Świątynia</strong><br>
    🛣️ Ulepszenie: <strong>Tarasy</strong> (na wzgórzach)<br><br>
    <em style="color:#8fa0c0">[Placeholder — pełna lista odblokowanych przez gracza]</em></p>`,
  },
  menu: {
    title: '☰ Menu',
    body: `<p>Opcje gry:<br><br>
    💾 Zapisz grę · 📂 Wczytaj · ⚙️ Ustawienia · ❓ Pomoc<br><br>
    <em style="color:#8fa0c0">[Placeholder — menu główne gry]</em></p>`,
  },
  civilopedia: {
    title: '📖 Civilopedia',
    body: `<p>Encyklopedia gry — poszukaj definicji mechanik, jednostek i budynków.<br><br>
    <em style="color:#8fa0c0">[Placeholder — pełna Civilopedia z wyszukiwarką]</em></p>`,
  },
  notif1: {
    title: '🔔 Zdarzenie: Nowe odkrycie',
    body: `<p>Twój zwiadowca odkrył nowe ziemie na północy.<br>Zasoby: złoże rudy żelaza w pobliżu rzeki.<br><br>
    <em style="color:#8fa0c0">[Placeholder — log zdarzeń]</em></p>`,
  },
  notif2: {
    title: '⚔️ Atak!',
    body: `<p>Barbarzyńcy atakują osadę Ateny!<br>Wyślij jednostki w obronę.<br><br>
    <em style="color:#8fa0c0">[Placeholder — panel bitwy]</em></p>`,
  },
  notif3: {
    title: '🏛️ Cud ukończony',
    body: `<p>Wybudowałeś <strong style="color:#ffd479">Piramidy</strong>!<br>+3 do zadowolenia globalnego · Premia: bezpłatne tarasy w miastach.<br><br>
    <em style="color:#8fa0c0">[Placeholder — szczegóły cudu]</em></p>`,
  },
};

// ============================================================
// TERRAIN ALLOW + KWALIFIKACJA (identyczne jak placement)
// ============================================================

type TerenSet = Set<TerenBazowy>;

const TERRAIN_ALLOW: Partial<Record<ImprovementKey, TerenSet | null>> = {
  farma:          new Set([TerenBazowy.Laka, TerenBazowy.Rownina]),
  irygacja:       new Set([TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia]),
  pastwisko:      new Set([TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza]),
  kopalnia:       new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  glinianka:      null,
  kamieniolom:    new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  oboz_lowiecki:  null,
  wyrab:          null,
  lodzie_rybackie: new Set([TerenBazowy.Wybrzeze, TerenBazowy.Morze]),
  plantacja:      new Set([TerenBazowy.Laka, TerenBazowy.Rownina]),
  warzelnia_soli: new Set([TerenBazowy.Wybrzeze]),
  tarasy:         new Set([TerenBazowy.Wzgorza]),
  fort:           null,
  droga:          null,
  posterunek:     null,
};

// ============================================================
// MODEL ZASIĘGU MIAST
// ============================================================

/**
 * CityNode z metadanymi rozwoju.
 *
 * Reguła promienia (STUB: docelowo z danymi o mieście z backendu):
 *   - POSTERUNEK:         r = 5
 *   - FORT (future):      r = 10
 *   - MIASTO pop < 5:     r = 5   (baza; wczesne/małe miasto)
 *   - MIASTO pop ≥ 5 AND poziom < 10: r = 10  (rozwinięte miasto)
 *   - MIASTO poziom ≥ 10: r = 15  (metropolia)
 *
 * // STUB: ludnosc/poziom da MIASTO — docelowo pobierz z modelu danych gry
 */
// CityNode rozszerza kontrakt z territory.ts o pola lokalne (BronzeCiv, cache nazwy).
// TerritoryCityNode (civ?: string) jest kompatybilny — TypeScript strukturalnie.
interface CityNode extends TerritoryCityNode {
  isOutpost: boolean;   // nadpisujemy optional → required (lokalnie zawsze ustawiane)
  civ?: BronzeCiv;      // zawężenie: BronzeCiv ⊆ string (kompatybilne z TerritoryCityNode)
  cityName?: string;    // wyliczona nazwa (cache, tylko mainview)
}

// cityTerritoryRadius — importowane z ../map/territory

let mapData: ReturnType<typeof generateMap> | null = null;
let cityNodes: CityNode[] = [];
let riverHexSet: Set<string> = new Set();
let roadHexSet: Set<string> = new Set();

// axialDist → axialDistance importowane z ../map/territory (alias dla czytelności kodu)
const axialDist = axialDistance;

function hexNeighbors(q: number, r: number): {q:number,r:number}[] {
  return [
    {q:q+1,r:r},{q:q-1,r:r},{q:q,r:r+1},{q:q,r:r-1},{q:q+1,r:r-1},{q:q-1,r:r+1},
  ];
}

/**
 * Wrapper: zamknięcie nad globalną tablicą cityNodes → wywołuje czysty
 * territoryIsInTerritory(q, r, nodes) z ../map/territory.
 * SILNIK używa bezpośrednio: territoryIsInTerritory(q, r, playerState.cityNodes).
 */
function isInTerritory(q: number, r: number): boolean {
  return territoryIsInTerritory(q, r, cityNodes);
}

function isOnTerritoryEdge(q: number, r: number): boolean {
  if (isInTerritory(q, r)) return true;
  for (const nb of hexNeighbors(q, r)) {
    if (isInTerritory(nb.q, nb.r)) return true;
  }
  return false;
}

function isRoadQualified(q: number, r: number): boolean {
  for (const nb of hexNeighbors(q, r)) {
    if (roadHexSet.has(`${nb.q},${nb.r}`)) return true;
    for (const node of cityNodes) {
      if (nb.q === node.q && nb.r === node.r) return true;
    }
  }
  for (const node of cityNodes) {
    if (axialDist(q, r, node.q, node.r) === 1) return true;
  }
  return false;
}

function isRiverAdjacent(q: number, r: number): boolean {
  if (mapData) {
    const hex = mapData.hexes[`${q},${r}`];
    if (hex?.rzeka?.obecna) return true;
  }
  if (riverHexSet.has(`${q},${r}`)) return true;
  for (const nb of hexNeighbors(q, r)) {
    if (riverHexSet.has(`${nb.q},${nb.r}`)) return true;
  }
  return false;
}

function qualifies(key: ImprovementKey, q: number, r: number): boolean {
  if (!mapData) return false;
  const hex = mapData.hexes[`${q},${r}`];
  if (!hex) return false;
  const teren = hex.terenBazowy;
  const nakladka = hex.nakladka;

  switch (key) {
    case 'droga': return TERENY_LADU.has(teren) && isRoadQualified(q, r);
    case 'posterunek': return TERENY_LADU.has(teren) && isOnTerritoryEdge(q, r);
    case 'irygacja':
      if (!TERRAIN_ALLOW.irygacja?.has(teren)) return false;
      if (!isInTerritory(q, r)) return false;
      return isRiverAdjacent(q, r);
    case 'fort': return TERENY_LADU.has(teren) && isInTerritory(q, r);
    case 'glinianka': return nakladka === Nakladka.ZlozeGliny && isInTerritory(q, r);
    case 'kopalnia':
      if (!isInTerritory(q, r)) return false;
      return nakladka === Nakladka.ZlozeRudy || teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory;
    case 'wyrab': return nakladka === Nakladka.Las && isInTerritory(q, r);
    case 'oboz_lowiecki': {
      if (!isInTerritory(q, r)) return false;
      const zwierzece = new Set([Nakladka.ZlozeKonia, Nakladka.ZlozeOwiec, Nakladka.ZlozeBydla, Nakladka.ZlozeLamy]);
      return nakladka === Nakladka.Las || zwierzece.has(nakladka);
    }
    case 'warzelnia_soli':
      if (!isInTerritory(q, r)) return false;
      return teren === TerenBazowy.Wybrzeze;
    case 'lodzie_rybackie':
      return teren === TerenBazowy.Wybrzeze || teren === TerenBazowy.Morze;
    case 'pastwisko': {
      if (!isInTerritory(q, r)) return false;
      const allowed = TERRAIN_ALLOW.pastwisko;
      return !!allowed && allowed.has(teren);
    }
    default: {
      const allowed = TERRAIN_ALLOW[key];
      if (!TERENY_LADU.has(teren)) return false;
      if (!isInTerritory(q, r)) return false;
      if (allowed && !allowed.has(teren)) return false;
      return true;
    }
  }
}

/**
 * Warunek kwalifikacji heksa do zalozenia miasta.
 * // STUB kontrakt: docelowo MIASTO.cities.canFoundCity(opts.withinTerritory=isInTerritory); regula >=5 = MIASTO
 *
 * Warunki:
 *  - teren LADOWY nadajacy sie (NIE Morze, NIE Gory; dozwolone Laka/Rownina/Pustynia/Wzgorza/Wybrzeze)
 *  - dystans >=5 (axialDist) od kazdego istniejacego MIASTA (wezly !isOutpost && !isFort)
 *  - w terytorium (isInTerritory) — budujemy tylko w zasiegu
 *  - nie na polu z istniejacym miastem/posterunkiem/fortem
 */
function canFoundCityHere(q: number, r: number): boolean {
  if (!mapData) return false;
  const hex = mapData.hexes[`${q},${r}`];
  if (!hex) return false;

  // Teren kwalifikujacy
  if (!TERENY_ZALOZEN_MIASTA.has(hex.terenBazowy)) return false;

  // Musi byc w terytorium
  if (!isInTerritory(q, r)) return false;

  // Nie na polu juz zajetym przez jakikolwiek wezel
  if (cityNodes.some(n => n.q === q && n.r === r)) return false;

  // Dystans >=5 od kazdego MIASTA (nie posterunek, nie fort)
  for (const node of cityNodes) {
    if (!node.isOutpost && !node.isFort) {
      if (axialDist(q, r, node.q, node.r) < 5) return false;
    }
  }

  return true;
}

// ============================================================
// HIGHLIGHT MESHES
// ============================================================

function makeHighlightMesh(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(HEX_R * 0.9, HEX_R * 0.9, 0.04, 6);
  const mat = new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.y = Math.PI / 6;
  return m;
}

// ============================================================
// MINIMAPA — prosty procedural canvas
// ============================================================

function drawMinimap(canvas: HTMLCanvasElement, map: ReturnType<typeof generateMap>): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Zbierz zakres koordynatów
  const hexes = Object.values(map.hexes);
  if (hexes.length === 0) return;
  let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
  for (const h of hexes) {
    minQ = Math.min(minQ, h.coords.q); maxQ = Math.max(maxQ, h.coords.q);
    minR = Math.min(minR, h.coords.r); maxR = Math.max(maxR, h.coords.r);
  }
  const rangeQ = maxQ - minQ || 1, rangeR = maxR - minR || 1;

  const TERRAIN_COLORS: Partial<Record<TerenBazowy, string>> = {
    [TerenBazowy.Morze]:    '#1a3a6b',
    [TerenBazowy.Wybrzeze]: '#2a5a9b',
    [TerenBazowy.Laka]:     '#2d6a2d',
    [TerenBazowy.Rownina]:  '#5a8a3a',
    [TerenBazowy.Pustynia]: '#b8a060',
    [TerenBazowy.Wzgorza]:  '#7a6040',
    [TerenBazowy.Gory]:     '#9a9a9a',
  };

  const px = 3; // piksele per hex
  for (const h of hexes) {
    const x = Math.floor(((h.coords.q - minQ) / rangeQ) * (W - px));
    const y = Math.floor(((h.coords.r - minR) / rangeR) * (H - px));
    ctx.fillStyle = TERRAIN_COLORS[h.terenBazowy] ?? '#444';
    ctx.fillRect(x, y, px, px);
  }

  // Miasta — żółte kropki
  for (const node of cityNodes) {
    const x = Math.floor(((node.q - minQ) / rangeQ) * (W - px));
    const y = Math.floor(((node.r - minR) / rangeR) * (H - px));
    ctx.fillStyle = node.isOutpost ? '#88aaff' : '#ffd479';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, node.isOutpost ? 2 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================
// TERRITORY VISUALIZATION — ciagla granica + aura budowy
// ============================================================

// Kolor aury (jasnoniebieska) — uzywana w trybie budowy
const AURA_COLOR = 0x66c0ff;

/**
 * Wierzcholki jednego heksa pointy-top o promieniu R wokol srodka (cx, y, cz).
 * Kolejnosc katow: 30deg, 90deg, 150deg, 210deg, 270deg, 330deg (pointy-top).
 *
 * WAZNE: uzywamy dokladnie R bez skalowania — dzieki temu wspolne rogi
 * sasiadujacych heksow maja identyczne wspolrzedne i odcinki graniczne
 * stykaja sie bez przerw (ciagly obrys).
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
 * Kierunki sasiedztwa aksjalnego — spojne z hexNeighbors().
 * Kolejnosc odpowiada krawedziom heksa (pointy-top):
 *   krawedz i laczy wierzcholek i z wierzcholkiem (i+1)%6
 *   i jej sasiad aksjalny to HEX_DIRS[i].
 */
const HEX_DIRS: {dq: number; dr: number}[] = [
  {dq:  1, dr:  0},
  {dq:  1, dr: -1},
  {dq:  0, dr: -1},
  {dq: -1, dr:  0},
  {dq: -1, dr:  1},
  {dq:  0, dr:  1},
];

interface TerritoryObjects {
  borderLines: THREE.LineSegments | null;
}

/**
 * Buduje ciagla linie granicy terytorium.
 *
 * NAPRAWA CIAGLOCI: uzywamy dokladnie HEX_R (bez *0.97 ani *1.01).
 * Usuniety scaling promienia powodujacy ze wspolne rogi sasiadow mialy rozne
 * wspolrzedne — teraz sa identyczne, wiec linia jest ciagla i styka sie w rogach.
 * Usunieta podwojna linia (rdzen + kontur) ktora rowniez powodowala porozrywanie.
 */
function buildTerritoryObjects(
  map: ReturnType<typeof generateMap>,
  playerColor: number,
): TerritoryObjects {
  const territorySet = new Set<string>();
  const territoryHexes: Array<{q: number; r: number}> = [];

  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    if (isInTerritory(q, r)) {
      territorySet.add(`${q},${r}`);
      territoryHexes.push({ q, r });
    }
  }

  if (territoryHexes.length === 0) return { borderLines: null };

  // --- GRANICA: pojedyncza ciagla linia ---
  // Dla kazdego heksa w terytorium, dla kazdej krawedzi i (0..5):
  //   jesli sasiad kierunku i NIE jest w terytorium => rysuj odcinek krawedzi i.
  // Krawedz i: wierzcholek i => wierzcholek (i+1)%6 (pointy-top).
  // Uzycie dokladnie HEX_R gwarantuje ze rogi sasiadow sa wspolne.
  const linePositions: number[] = [];
  const BORDER_Y_OFFSET = 0.06; // nieco wyzej niz kafel

  for (const { q, r } of territoryHexes) {
    const hexObj = map.hexes[`${q},${r}`];
    const hexTopY = (TERR_TOP[hexObj?.terenBazowy ?? TerenBazowy.Laka] ?? 0.45) + BORDER_Y_OFFSET;
    const { x: cx, z: cz } = axialToWorld(q, r, HEX_R);
    // Dokladnie HEX_R — wspolne z sasiadem
    const verts = hexVertices(cx, hexTopY, cz, HEX_R);

    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i]!;
      const nq = q + dir.dq;
      const nr = r + dir.dr;
      if (!territorySet.has(`${nq},${nr}`)) {
        const va = verts[i]!;
        const vb = verts[(i + 1) % 6]!;
        linePositions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
      }
    }
  }

  let borderLines: THREE.LineSegments | null = null;
  if (linePositions.length > 0) {
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: playerColor,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    borderLines = new THREE.LineSegments(lineGeo, lineMat);
    borderLines.renderOrder = 4;
  }

  return { borderLines };
}

/**
 * Buduje aure terytorium — InstancedMesh dla wszystkich heksow.
 * Jasnoniebieska (0x66c0ff), opacity 0.20.
 * Uzywana w trybie budowy.
 */
function buildTerritoryAura(
  map: ReturnType<typeof generateMap>,
): THREE.InstancedMesh | null {
  const territoryHexes: Array<{q: number; r: number; y: number}> = [];

  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    if (isInTerritory(q, r)) {
      territoryHexes.push({ q, r, y: (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.042 });
    }
  }

  if (territoryHexes.length === 0) return null;

  const geo = new THREE.CylinderGeometry(HEX_R * 0.97, HEX_R * 0.97, 0.002, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: AURA_COLOR,
    transparent: true,
    opacity: 0.20,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, territoryHexes.length);
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

// ============================================================
// BOOT
// ============================================================

function boot(): void {
  const canvas = document.getElementById('map') as HTMLCanvasElement | null;
  if (!canvas) { console.error('mainview: brak <canvas id="map">'); return; }

  const params = new URLSearchParams(location.search);
  const W    = parseInt(params.get('w') ?? '46', 10) || 46;
  const H    = parseInt(params.get('h') ?? '32', 10) || 32;
  const SEED = parseInt(params.get('seed') ?? '7', 10) || 7;

  mapData = generateMap(W, H, SEED);
  const map = mapData;
  const { scene, camera, renderer, center, setFog } = buildScene(map, canvas);

  setFog(new Set<string>(Object.keys(map.hexes)), new Set<string>());

  for (const path of map.riverPaths) {
    for (const pos of path) riverHexSet.add(`${pos.q},${pos.r}`);
  }

  // ============================================================
  // MIASTA — STUB DANYCH ROZWOJU (pop/level)
  // ============================================================
  // Zróżnicowane stuby: część miast pop3/lvl4 → r5, część pop6/lvl7 → r10, jedno lvl10 → r15
  // // STUB: ludnosc/poziom da MIASTO — docelowo wymień na dane z modelu gry
  const CITY_STUBS: Array<{pop: number; level: number}> = [
    { pop: 3, level: 4  }, // r=5  — małe miasto
    { pop: 6, level: 7  }, // r=10 — rozwinięte
    { pop: 8, level: 10 }, // r=15 — metropolia
    { pop: 2, level: 3  }, // r=5  — małe
    { pop: 5, level: 6  }, // r=10
    { pop: 7, level: 8  }, // r=10
    { pop: 3, level: 2  }, // r=5
    { pop: 6, level: 9  }, // r=10
  ];

  const starts = (map as unknown as { startPositions?: { q: number; r: number }[] }).startPositions ?? [];
  let ci = 0, cityCount = 0;
  for (const sp of starts) {
    const hex = map.hexes[`${sp.q},${sp.r}`];
    if (!hex) continue;
    const t = hex.terenBazowy;
    if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;
    const level = LEVEL_SEQ[ci % LEVEL_SEQ.length]!;
    const walls = ci % 3 === 0;
    const city  = buildStoneAgeCity(level, OWNER_COLORS[ci % OWNER_COLORS.length]!, walls);
    const { x, z } = axialToWorld(sp.q, sp.r, HEX_R);
    city.position.set(x, (TERR_TOP[t] ?? 0.45) + 0.01, z);
    scene.add(city);

    // STUB: ludnosc/poziom da MIASTO
    const stub = CITY_STUBS[ci % CITY_STUBS.length] ?? { pop: 3, level: 4 };
    const stubCiv: BronzeCiv = BRONZE_CIVS[ci % BRONZE_CIVS.length] ?? 'grecja';
    const stubNameIdx = nextCivNameIndex(stubCiv);
    const stubCityName = getCivName(stubCiv, stubNameIdx);
    cityNodes.push({ q: sp.q, r: sp.r, isOutpost: false, pop: stub.pop, level: stub.level, civ: stubCiv, cityName: stubCityName });
    ci++; cityCount++;
    if (cityCount >= 8) break;
  }

  // Posterunki
  const OUTPOST_OWNER = 0xffd54a;
  let outpostCount = 0;
  const OUTPOST_RADIUS = 5; // posterunek zawsze r=5
  for (let ni = 0; ni < Math.min(2, cityNodes.length) && outpostCount < 2; ni++) {
    const node = cityNodes[ni]!;
    let placed = false;
    for (let dist = 4; dist <= 6 && !placed; dist++) {
      const candidates: {q:number,r:number}[] = [];
      for (let dq = -dist; dq <= dist; dq++) {
        for (let dr = -dist; dr <= dist; dr++) {
          if (Math.round(axialDist(0,0,dq,dr)) === dist) candidates.push({ q: node.q+dq, r: node.r+dr });
        }
      }
      for (const cand of candidates) {
        const h = map.hexes[`${cand.q},${cand.r}`];
        if (!h || !TERENY_LADU.has(h.terenBazowy) || h.terenBazowy === TerenBazowy.Gory) continue;
        if (axialDist(cand.q, cand.r, node.q, node.r) <= OUTPOST_RADIUS + 1) {
          const outpost = buildImprovement('posterunek', OUTPOST_OWNER);
          const { x, z } = axialToWorld(cand.q, cand.r, HEX_R);
          outpost.position.set(x, (TERR_TOP[h.terenBazowy] ?? 0.45) + 0.01, z);
          scene.add(outpost);
          cityNodes.push({ q: cand.q, r: cand.r, isOutpost: true, isFort: false, pop: 0, level: 0 });
          outpostCount++;
          placed = true;
          break;
        }
      }
    }
  }

  // MINIMAPA
  const minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
  if (minimapCanvas) {
    minimapCanvas.width  = 160;
    minimapCanvas.height = 110;
    drawMinimap(minimapCanvas, map);
  }

  // BANERY CIV
  const civBannersEl = document.getElementById('civ-banners')!;
  for (const civ of CIVS) {
    const btn = document.createElement('button');
    btn.className = 'civ-banner' + (civ.player ? ' player' : '');
    btn.style.background = civ.color;
    btn.title = civ.name + (civ.player ? ' (Ty)' : '');
    btn.textContent = civ.abbr;
    btn.dataset.modal = 'civ_' + civ.name;
    MODAL_CONTENT['civ_' + civ.name] = {
      title: (civ.player ? '👑 ' : '') + civ.emoji + ' ' + civ.name,
      body: `<p><strong style="color:#ffd479">${civ.name}</strong>${civ.player ? ' (Twoja cywilizacja)' : ''}<br><br>
      Relacje: Neutralne<br>
      Miasta: ${civ.player ? '4' : Math.floor(Math.random()*3+2)}<br>
      Armia: ${Math.floor(Math.random()*8+3)} jednostek<br><br>
      <em style="color:#8fa0c0">[Placeholder — panel dyplomacji i relacji]</em></p>`,
    };
    civBannersEl.appendChild(btn);
  }

  // ============================================================
  // STAN TRYBÓW
  // ============================================================

  let buildMode = false;
  let activeTool: ImprovementKey | null = null;
  let highlightEnabled = true;
  const highlightObjects: THREE.Object3D[] = [];
  const placedMap = new Map<string, { key: ImprovementKey; group: THREE.Group }>();

  // ---- NARZEDZIE "ZALOZ MIASTO" ----
  let foundCityMode = false;   // true gdy narzedzie "Zaloz miasto" aktywne
  let selectedFoundCiv: BronzeCiv = 'grecja';  // wybrana cywilizacja
  const foundCityHighlights: THREE.Object3D[] = [];  // podswietlenia kwalifikujacych heksow
  const foundCityNodes = new Map<string, THREE.Group>();  // postawione (hexKey -> group)

  // ============================================================
  // NAZWY MIAST — etykiety Sprite nad miastami
  // ============================================================
  let cityLabelsVisible = false;
  const cityLabelSprites = new Map<string, THREE.Sprite>(); // hexKey → Sprite

  /** Tworzy teksturę canvas z nazwą miasta. */
  function makeCityLabelTexture(name: string): THREE.CanvasTexture {
    const W = 256, H = 64;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d')!;
    // Tło: zaokrąglony prostokąt, półprzezroczysty ciemny
    const rx = 10;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(14, 18, 28, 0.78)';
    ctx.beginPath();
    ctx.moveTo(rx, 4); ctx.lineTo(W - rx, 4);
    ctx.quadraticCurveTo(W - 4, 4, W - 4, rx + 4);
    ctx.lineTo(W - 4, H - rx - 4);
    ctx.quadraticCurveTo(W - 4, H - 4, W - rx - 4, H - 4);
    ctx.lineTo(rx + 4, H - 4);
    ctx.quadraticCurveTo(4, H - 4, 4, H - rx - 4);
    ctx.lineTo(4, rx + 4);
    ctx.quadraticCurveTo(4, 4, rx + 4, 4);
    ctx.closePath();
    ctx.fill();
    // Ramka złota (HUD-gold)
    ctx.strokeStyle = 'rgba(255, 212, 121, 0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Tekst: biały, pogrubiony
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, W / 2, H / 2);
    return new THREE.CanvasTexture(c);
  }

  /** Tworzy Sprite etykiety nad miastem (q,r). */
  function makeCityLabelSprite(name: string, q: number, r: number, hex: NonNullable<ReturnType<typeof generateMap>['hexes'][string]>): THREE.Sprite {
    const tex = makeCityLabelTexture(name);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
    const sprite = new THREE.Sprite(mat);
    const { x, z } = axialToWorld(q, r, HEX_R);
    const baseY = (TERR_TOP[hex.terenBazowy] ?? 0.45);
    sprite.position.set(x, baseY + 1.1, z);
    sprite.scale.set(1.6, 0.4, 1.0); // billboard — zawsze do kamery
    sprite.renderOrder = 10;
    return sprite;
  }

  /** Dodaje sprite etykiety dla węzła miejskiego. Pomija posterunki i forty. */
  function addCityLabel(node: CityNode): void {
    if (node.isOutpost || node.isFort) return;
    const hexKey = `${node.q},${node.r}`;
    if (cityLabelSprites.has(hexKey)) return; // już jest
    const hex = map.hexes[hexKey];
    if (!hex) return;
    const name = node.cityName ?? getCivName(node.civ, 0);
    const sprite = makeCityLabelSprite(name, node.q, node.r, hex);
    scene.add(sprite);
    cityLabelSprites.set(hexKey, sprite);
  }

  /** Usuwa sprite etykiety dla danego hexKey. */
  function removeCityLabel(hexKey: string): void {
    const sp = cityLabelSprites.get(hexKey);
    if (sp) { scene.remove(sp); (sp.material as THREE.SpriteMaterial).map?.dispose(); sp.material.dispose(); cityLabelSprites.delete(hexKey); }
  }

  /** Pokazuje etykiety dla wszystkich istniejących miast. */
  function showAllCityLabels(): void {
    for (const node of cityNodes) {
      addCityLabel(node);
    }
    // Etykiety foundCityNodes (założone przez "Załóż miasto")
    for (const [hexKey] of foundCityNodes) {
      const node = cityNodes.find(n => `${n.q},${n.r}` === hexKey);
      if (node) addCityLabel(node);
    }
  }

  /** Ukrywa (usuwa) wszystkie etykiety miast. */
  function hideAllCityLabels(): void {
    for (const hexKey of [...cityLabelSprites.keys()]) {
      removeCityLabel(hexKey);
    }
  }

  /** Toggle przełącznik nazw miast. */
  function toggleCityLabels(): void {
    cityLabelsVisible = !cityLabelsVisible;
    const btn = document.getElementById('btn-city-labels');
    if (cityLabelsVisible) {
      showAllCityLabels();
      if (btn) { btn.classList.add('active-labels'); btn.title = 'Nazwy miast [ON] — kliknij aby wylaczyc'; }
    } else {
      hideAllCityLabels();
      if (btn) { btn.classList.remove('active-labels'); btn.title = 'Nazwy miast [OFF] — kliknij aby wlaczyc'; }
    }
  }
  // ============================================================
  // / NAZWY MIAST
  // ============================================================

  // ---- GHOST-PREVIEW ----
  let ghostGroup: THREE.Group | null = null;
  let lastGhostKey = '';   // "q,r|tool" — guard przed przebudową

  function removeGhost(): void {
    if (ghostGroup) {
      scene.remove(ghostGroup);
      ghostGroup = null;
    }
    lastGhostKey = '';
  }

  function showGhost(q: number, r: number): void {
    if (!activeTool) { removeGhost(); return; }
    const newKey = `${q},${r}|${activeTool}`;
    if (newKey === lastGhostKey) return; // bez zmian — nie rób nic
    removeGhost();
    const hex = map.hexes[`${q},${r}`];
    if (!hex) return;
    if (!qualifies(activeTool, q, r)) return;

    const g = buildImprovement(activeTool, OWNER_COLORS[0]!);
    const { x, z } = axialToWorld(q, r, HEX_R);
    g.position.set(x, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.01, z);

    // Ustaw materiały na półprzezroczyste z lekkim zielonkawym odcieniem
    g.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const cloned = mats.map((m) => {
          const c = (m as THREE.MeshStandardMaterial).clone() as THREE.MeshStandardMaterial;
          c.transparent = true;
          c.opacity = 0.45;
          c.depthWrite = false;
          if ('emissive' in c) c.emissive.set(0x224422);
          return c;
        });
        mesh.material = cloned.length === 1 ? cloned[0]! : cloned;
        mesh.castShadow = false;
      }
    });

    scene.add(g);
    ghostGroup = g;
    lastGhostKey = newKey;
  }

  // ---- GHOST CITY (dla narzedzia Zaloz miasto) ----
  let ghostCityGroup: THREE.Group | null = null;
  let lastGhostCityKey = '';

  function removeGhostCity(): void {
    if (ghostCityGroup) { scene.remove(ghostCityGroup); ghostCityGroup = null; }
    lastGhostCityKey = '';
  }

  function showGhostCity(q: number, r: number): void {
    const newKey = `${q},${r}|${selectedFoundCiv}`;
    if (newKey === lastGhostCityKey) return;
    removeGhostCity();
    if (!canFoundCityHere(q, r)) return;
    const hex = map.hexes[`${q},${r}`];
    if (!hex) return;

    const g = buildBronzeCity(selectedFoundCiv, 1, OWNER_COLORS[0]!, false);
    const { x, z } = axialToWorld(q, r, HEX_R);
    g.position.set(x, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.01, z);

    g.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const cloned = mats.map((m) => {
          const c = (m as THREE.MeshStandardMaterial).clone() as THREE.MeshStandardMaterial;
          c.transparent = true;
          c.opacity = 0.45;
          c.depthWrite = false;
          if ('emissive' in c) c.emissive.set(0x224422);
          return c;
        });
        mesh.material = cloned.length === 1 ? cloned[0]! : cloned;
        mesh.castShadow = false;
      }
    });

    scene.add(g);
    ghostCityGroup = g;
    lastGhostCityKey = newKey;
  }
  // ---- / GHOST CITY ----

  // Highlight-y dla "Zaloz miasto"
  function clearFoundCityHighlights(): void {
    for (const obj of foundCityHighlights) scene.remove(obj);
    foundCityHighlights.length = 0;
  }

  function updateFoundCityHighlights(): void {
    clearFoundCityHighlights();
    if (!buildMode || !foundCityMode) return;
    for (const hex of Object.values(map.hexes)) {
      const { q, r } = hex.coords;
      if (canFoundCityHere(q, r)) {
        const hl = makeHighlightMesh();
        const { x, z } = axialToWorld(q, r, HEX_R);
        hl.position.set(x, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.035, z);
        scene.add(hl);
        foundCityHighlights.push(hl);
      }
    }
  }
  // ---- / ZALOZ MIASTO ----

  // ---- / GHOST-PREVIEW ----

  const modeBanner    = document.getElementById('mode-banner')!;
  const btnBuild      = document.getElementById('btn-build')!;
  const buildPanel    = document.getElementById('build-panel')!;
  const buildStatus   = document.getElementById('build-status')!;
  const bsToolName    = document.getElementById('bs-tool-name')!;
  const buildCounter  = document.getElementById('build-counter')!;
  const buildImpList  = document.getElementById('build-imp-list')!;
  const btnWatchBuild = document.getElementById('btn-watch-build')!;
  const ghostChip     = document.getElementById('ghost-chip')!;

  // MODAL
  const modalOverlay = document.getElementById('modal-overlay')!;
  const modalTitle   = document.getElementById('modal-title')!;
  const modalBody    = document.getElementById('modal-body')!;
  const modalClose   = document.getElementById('modal-close')!;

  function openModal(key: string): void {
    const content = MODAL_CONTENT[key];
    if (!content) return;
    modalTitle.textContent = content.title;
    modalBody.innerHTML    = content.body;
    modalOverlay.classList.add('open');
  }
  function closeModal(): void {
    modalOverlay.classList.remove('open');
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Klik toolbar 1–7 + menu + civilopedia + notifikacje
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('[data-modal]') as HTMLElement | null;
    if (!btn) return;
    const key = btn.dataset.modal;
    if (!key) return;
    if (buildMode) exitBuildMode(); // wyjdź z trybu budowy przed otwarciem zakładki
    openModal(key);
  });

  // KURSOR-MŁOTEK
  const HAMMER_SVG_RAW = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">'
    + '<rect x="11" y="2" width="8" height="4" rx="1.5" fill="%23d4d4d4"/>'
    + '<rect x="9" y="6" width="12" height="6" rx="2" fill="%23e8e8e8"/>'
    + '<rect x="12" y="12" width="5" height="13" rx="1.5" fill="%23b0b0b0"/>'
    + '</svg>';
  const HAMMER_CURSOR = 'url("data:image/svg+xml,' + HAMMER_SVG_RAW + '") 4 4, crosshair';

  const TOOL_EMOJI: Partial<Record<ImprovementKey, string>> = {
    droga:'🛣️',farma:'🌾',irygacja:'💧',pastwisko:'🐄',kopalnia:'⛏️',
    glinianka:'🏺',kamieniolom:'🪨',oboz_lowiecki:'🏕️',wyrab:'🪓',tarasy:'🌱',
    lodzie_rybackie:'🎣',plantacja:'🍇',warzelnia_soli:'🧂',fort:'🏰',posterunek:'🗼',
  };

  let chipOverCanvas = false;

  function updateCursorFeedback(): void {
    if (buildMode && foundCityMode) {
      const civLabel = selectedFoundCiv.charAt(0).toUpperCase() + selectedFoundCiv.slice(1);
      ghostChip.innerHTML = '<span style="font-size:16px;line-height:1">&#x1F3DB;&#xFE0F;</span>'
        + '<span style="font-size:11px">Zaloz: ' + civLabel + '</span>';
      canvas.style.cursor = HAMMER_CURSOR;
      if (chipOverCanvas) ghostChip.style.display = 'flex';
    } else if (buildMode && activeTool) {
      const imp = IMPROVEMENTS.find(i => i.key === activeTool);
      const emoji = TOOL_EMOJI[activeTool] ?? '\u{1F528}';
      const label = imp?.label ?? activeTool;
      ghostChip.innerHTML = '<span style="font-size:16px;line-height:1">' + emoji + '</span>'
        + '<span style="font-size:11px">' + label + '</span>';
      canvas.style.cursor = HAMMER_CURSOR;
      if (chipOverCanvas) ghostChip.style.display = 'flex';
    } else {
      canvas.style.cursor = buildMode ? 'crosshair' : 'default';
      ghostChip.style.display = 'none';
    }
  }

  function flashChipError(): void {
    ghostChip.style.background = 'rgba(180,30,30,0.92)';
    ghostChip.style.borderColor = '#ff6655';
    setTimeout(() => {
      ghostChip.style.background = 'rgba(30,34,50,0.90)';
      ghostChip.style.borderColor = 'rgba(255,212,121,0.75)';
    }, 800);
  }

  canvas.addEventListener('mouseenter', () => {
    chipOverCanvas = true;
    if (buildMode && activeTool) ghostChip.style.display = 'flex';
  });
  canvas.addEventListener('mouseleave', () => {
    chipOverCanvas = false;
    ghostChip.style.display = 'none';
  });
  window.addEventListener('mousemove', (e: MouseEvent) => {
    ghostChip.style.left = (e.clientX + 18) + 'px';
    ghostChip.style.top  = (e.clientY - 32) + 'px';
  });

  // HIGHLIGHT
  function clearHighlights(): void {
    for (const obj of highlightObjects) scene.remove(obj);
    highlightObjects.length = 0;
  }

  function updateHighlights(): void {
    clearHighlights();
    if (!buildMode || !activeTool || !highlightEnabled) return;
    for (const hex of Object.values(map.hexes)) {
      const { q, r } = hex.coords;
      if (qualifies(activeTool!, q, r)) {
        const hl = makeHighlightMesh();
        const { x, z } = axialToWorld(q, r, HEX_R);
        hl.position.set(x, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.035, z);
        scene.add(hl);
        highlightObjects.push(hl);
      }
    }
  }

  // PANEL ULEPSZEŃ
  const EPOKA_LABEL: Record<number, string> = {1:'E1 Kamień',2:'E2 Brąz',3:'E3 Żelazo'};
  const toolBtns: HTMLButtonElement[] = [];

  for (const imp of IMPROVEMENTS) {
    const btn = document.createElement('button');
    btn.className = `imp-btn e${imp.epoka}`;
    btn.innerHTML = `${imp.label} <span class="epoka">${EPOKA_LABEL[imp.epoka] ?? ''}</span>`;
    btn.addEventListener('click', () => {
      activeTool = (activeTool === imp.key) ? null : imp.key;
      foundCityMode = false;
      updateBuildUI();
    });
    toolBtns.push(btn);
    buildImpList.appendChild(btn);
  }

  btnWatchBuild.addEventListener('click', () => {
    activeTool = null;
    foundCityMode = false;
    updateBuildUI();
  });

  // ---- WIRING: "Zaloz miasto" przycisk + wybor cyw ----
  const btnFoundCity = document.getElementById('btn-found-city');
  if (btnFoundCity) {
    btnFoundCity.addEventListener('click', () => {
      foundCityMode = !foundCityMode;
      if (foundCityMode) activeTool = null;
      updateBuildUI();
    });
  }

  // Civ-selector — rzadek przyciskow cyw
  const civSelectorBtns = document.querySelectorAll<HTMLButtonElement>('[data-found-civ]');
  function syncCivSelector(): void {
    civSelectorBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.foundCiv === selectedFoundCiv);
    });
  }
  civSelectorBtns.forEach(b => {
    b.addEventListener('click', () => {
      selectedFoundCiv = (b.dataset.foundCiv as BronzeCiv) ?? 'grecja';
      syncCivSelector();
      // Jesli foundCityMode — odswiez ghost i cursor chip
      if (foundCityMode) {
        removeGhostCity();
        updateCursorFeedback();
      }
    });
  });
  syncCivSelector();
  // ---- /WIRING Zaloz miasto ----

  function updateBuildUI(): void {
    for (const b of toolBtns) b.classList.remove('active');
    if (foundCityMode) {
      // Narzedzie "Zaloz miasto" — zadne inne nie aktywne
      btnWatchBuild.classList.remove('active');
      bsToolName.textContent = 'Zaloz miasto';
      clearHighlights();
      updateFoundCityHighlights();
    } else if (activeTool) {
      const idx = IMPROVEMENTS.findIndex(i => i.key === activeTool);
      if (idx >= 0) toolBtns[idx]?.classList.add('active');
      btnWatchBuild.classList.remove('active');
      bsToolName.textContent = IMPROVEMENTS.find(i => i.key === activeTool)?.label ?? activeTool;
      clearFoundCityHighlights();
      updateHighlights();
    } else {
      btnWatchBuild.classList.add('active');
      bsToolName.textContent = 'brak';
      clearFoundCityHighlights();
      updateHighlights();
    }
    buildCounter.textContent = `Postawione: ${placedMap.size + foundCityNodes.size}`;
    updateCursorFeedback();
    // Zmiana narzedzia uniewaznia aktualnego ducha
    removeGhost();
    removeGhostCity();
    // Sync przycisku Zaloz miasto w HTML
    const btnFC = document.getElementById('btn-found-city');
    if (btnFC) btnFC.classList.toggle('active', foundCityMode);
  }

  // PRZELACZANIE TRYBOW
  function enterBuildMode(): void {
    buildMode = true;
    document.body.classList.add('build-mode');
    modeBanner.classList.add('visible');
    buildPanel.classList.add('visible');
    buildStatus.classList.add('visible');
    btnBuild.classList.add('active-build');
    activeTool = null;
    // Pokaz jasnoniebieska aure terytorium w trybie budowy
    showBuildAura();
    updateBuildUI();
  }

  function exitBuildMode(): void {
    buildMode = false;
    document.body.classList.remove('build-mode');
    modeBanner.classList.remove('visible');
    buildPanel.classList.remove('visible');
    buildStatus.classList.remove('visible');
    btnBuild.classList.remove('active-build');
    activeTool = null;
    foundCityMode = false;
    removeGhost();
    removeGhostCity();
    clearHighlights();
    clearFoundCityHighlights();
    // Schowaj aure po wyjsciu z trybu budowy
    hideBuildAura();
    updateCursorFeedback();
    canvas.style.cursor = 'default';
  }

  btnBuild.addEventListener('click', () => {
    if (buildMode) exitBuildMode();
    else enterBuildMode();
  });


  // ZAKOŃCZ TURĘ
  const btnEndTurn = document.getElementById('btn-end-turn')!;
  const turnInfoEl = document.getElementById('turn-info')!;
  let currentTurn = 15;
  btnEndTurn.addEventListener('click', () => {
    currentTurn++;
    const spans = turnInfoEl.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = String(currentTurn);
    // Mały flash
    btnEndTurn.style.transform = 'scale(0.95)';
    setTimeout(() => { btnEndTurn.style.transform = ''; }, 120);
  });

  // ============================================================
  // PRZELACZNIK "ZASIEG CYWILIZACJI"
  // ============================================================

  const PLAYER_TERRITORY_COLOR = 0xffd54a; // zloty — kolor gracza (Grecy)

  let territoryVisible = true;
  let territoryBorder: THREE.LineSegments | null = null;
  // Aura jasnoniebieska — pojawia sie tylko w trybie budowy
  let territoryAura: THREE.InstancedMesh | null = null;

  const btnTerritory = document.getElementById('btn-territory')!;

  function showTerritory(): void {
    // Buduj sama linie (bez aury — aura tylko w trybie budowy)
    const objs = buildTerritoryObjects(map, PLAYER_TERRITORY_COLOR);
    if (objs.borderLines) {
      scene.add(objs.borderLines);
      territoryBorder = objs.borderLines;
    }
  }

  function hideTerritory(): void {
    if (territoryBorder) { scene.remove(territoryBorder); territoryBorder = null; }
    hideBuildAura();
  }

  /** Pokazuje jasnoniebieska aure terytorium — wywolywana przy wejsciu w tryb budowy. */
  function showBuildAura(): void {
    if (territoryAura) return; // juz widoczna
    const aura = buildTerritoryAura(map);
    if (aura) {
      scene.add(aura);
      territoryAura = aura;
    }
  }

  /** Chowa aure — wywolywana przy wyjsciu z trybu budowy. */
  function hideBuildAura(): void {
    if (territoryAura) { scene.remove(territoryAura); territoryAura = null; }
  }

  /**
   * Odswiezanie granicy i aury po mutacji cityNodes.
   * Jesli obrys terytorium (🗺️) jest wlaczony — przebuduj linie graniczna.
   * Jesli aura budowy jest widoczna — przebuduj aure.
   */
  function refreshTerritoryIfVisible(): void {
    if (territoryVisible) {
      if (territoryBorder) { scene.remove(territoryBorder); territoryBorder = null; }
      const objs = buildTerritoryObjects(map, PLAYER_TERRITORY_COLOR);
      if (objs.borderLines) { scene.add(objs.borderLines); territoryBorder = objs.borderLines; }
    }
    if (territoryAura) {
      scene.remove(territoryAura); territoryAura = null;
      const aura = buildTerritoryAura(map);
      if (aura) { scene.add(aura); territoryAura = aura; }
    }
  }

  function toggleTerritory(): void {
    territoryVisible = !territoryVisible;
    if (territoryVisible) {
      showTerritory();
      btnTerritory.classList.add('active-territory');
      btnTerritory.title = 'Zasieg cywilizacji [ON] — kliknij aby wylaczyc';
    } else {
      hideTerritory();
      btnTerritory.classList.remove('active-territory');
      btnTerritory.title = 'Zasieg cywilizacji [OFF] — kliknij aby wlaczyc';
    }
  }

  btnTerritory.addEventListener('click', (e) => {
    e.stopPropagation(); // nie propaguj do modal-delegata
    toggleTerritory();
  });

  // Domyslnie: granica terytorium widoczna od startu
  showTerritory();
  btnTerritory.classList.add('active-territory');
  btnTerritory.title = 'Zasieg cywilizacji [ON] — kliknij aby wylaczyc';

  // Przełącznik "Nazwy miast"
  const btnCityLabels = document.getElementById('btn-city-labels');
  if (btnCityLabels) {
    btnCityLabels.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCityLabels();
    });
  }

  // RAYCASTER
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const raycastMeshes: THREE.Mesh[] = [];
  const meshToHex = new Map<THREE.Mesh, { q: number; r: number }>();

  {
    const rGeo = new THREE.CylinderGeometry(HEX_R * 0.95, HEX_R * 0.95, 0.5, 6);
    const rMat = new THREE.MeshBasicMaterial({ visible: false });
    for (const hex of Object.values(map.hexes)) {
      const { q, r } = hex.coords;
      const m = new THREE.Mesh(rGeo, rMat);
      m.rotation.y = Math.PI / 6;
      const { x, z } = axialToWorld(q, r, HEX_R);
      m.position.set(x, TERR_TOP[hex.terenBazowy] ?? 0.45, z);
      scene.add(m);
      raycastMeshes.push(m);
      meshToHex.set(m, { q, r });
    }
  }

  let pointerDownPos = { x: 0, y: 0 };
  let pointerDragged = false;

  canvas.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
    pointerDragged = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 4) pointerDragged = true;
  });

  canvas.addEventListener('pointerup', (e) => {
    if (pointerDragged) return;
    if (!buildMode) return;

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

    // ---- TRYB "ZALOZ MIASTO" ----
    if (foundCityMode) {
      if (!canFoundCityHere(q, r)) {
        const orig = bsToolName.textContent;
        bsToolName.textContent = 'Nie mozna zalozyc!';
        bsToolName.style.color = '#ff6655';
        setTimeout(() => { bsToolName.textContent = orig; bsToolName.style.color = ''; }, 1200);
        flashChipError();
        return;
      }
      // Usun ewentualnego ducha
      removeGhostCity();
      // Postaw solidne miasto
      const cityGroup = buildBronzeCity(selectedFoundCiv, 1, OWNER_COLORS[0]!, false);
      const { x: cx2, z: cz2 } = axialToWorld(q, r, HEX_R);
      cityGroup.position.set(cx2, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.01, cz2);
      scene.add(cityGroup);
      foundCityNodes.set(hexKey, cityGroup);
      // Dodaj do cityNodes -> terytorium r5 (pop=1, level=1)
      const foundCiv = selectedFoundCiv;
      const foundNameIdx = nextCivNameIndex(foundCiv);
      const foundCityName = getCivName(foundCiv, foundNameIdx);
      cityNodes.push({ q, r, isOutpost: false, isFort: false, pop: 1, level: 1, civ: foundCiv, cityName: foundCityName });
      // Dodaj etykietę jeśli włączone
      if (cityLabelsVisible) { addCityLabel(cityNodes[cityNodes.length - 1]!); }
      refreshTerritoryIfVisible();
      // Odswiez minimape
      const mc = document.getElementById('minimap-canvas') as HTMLCanvasElement | null;
      if (mc) drawMinimap(mc, map);
      updateBuildUI();
      return;
    }

    // ---- TRYB ULEPSZEN ----
    if (!activeTool) return;

    const existing = placedMap.get(hexKey);
    if (existing) {
      if (existing.key === activeTool) {
        scene.remove(existing.group); placedMap.delete(hexKey);
        if (activeTool === 'droga') roadHexSet.delete(hexKey);
        if (activeTool === 'posterunek') cityNodes = cityNodes.filter(n => !(n.q===q && n.r===r && n.isOutpost));
        if (activeTool === 'fort') cityNodes = cityNodes.filter(n => !(n.q===q && n.r===r && n.isFort));
        refreshTerritoryIfVisible();
        updateBuildUI(); updateHighlights(); return;
      } else {
        scene.remove(existing.group); placedMap.delete(hexKey);
        if (existing.key === 'droga') roadHexSet.delete(hexKey);
        if (existing.key === 'posterunek') cityNodes = cityNodes.filter(n => !(n.q===q && n.r===r && n.isOutpost));
        if (existing.key === 'fort') cityNodes = cityNodes.filter(n => !(n.q===q && n.r===r && n.isFort));
      }
    }

    if (!qualifies(activeTool, q, r)) {
      const orig = bsToolName.textContent;
      bsToolName.textContent = '✗ teren nie kwalifikuje!';
      bsToolName.style.color = '#ff6655';
      setTimeout(() => { bsToolName.textContent = orig; bsToolName.style.color = ''; }, 1200);
      flashChipError();
      return;
    }

    const group = buildImprovement(activeTool, OWNER_COLORS[0]!);
    const { x, z } = axialToWorld(q, r, HEX_R);
    group.position.set(x, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.01, z);
    scene.add(group);
    placedMap.set(hexKey, { key: activeTool, group });
    if (activeTool === 'droga') { roadHexSet.add(hexKey); }
    if (activeTool === 'posterunek') {
      cityNodes.push({ q, r, isOutpost: true, isFort: false, pop: 0, level: 0 });
      refreshTerritoryIfVisible();
    }
    if (activeTool === 'fort') {
      cityNodes.push({ q, r, isOutpost: false, isFort: true, pop: 0, level: 0 });
      refreshTerritoryIfVisible();
    }
    removeGhost(); // usuwamy ducha — solidny model już stoi
    updateBuildUI(); updateHighlights();
  });

  // GHOST-PREVIEW — mousemove na canvas
  canvas.addEventListener('mousemove', (e: MouseEvent) => {
    if (!buildMode) { removeGhost(); removeGhostCity(); return; }

    const rect = canvas.getBoundingClientRect();
    const mx =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
    const my = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
    const hits = raycaster.intersectObjects(raycastMeshes, false);

    if (foundCityMode) {
      removeGhost();
      if (hits.length === 0) { removeGhostCity(); return; }
      const coords = meshToHex.get(hits[0]!.object as THREE.Mesh);
      if (!coords) { removeGhostCity(); return; }
      showGhostCity(coords.q, coords.r);
      return;
    }

    removeGhostCity();
    if (!activeTool) { removeGhost(); return; }
    if (hits.length === 0) { removeGhost(); return; }
    const coords = meshToHex.get(hits[0]!.object as THREE.Mesh);
    if (!coords) { removeGhost(); return; }
    showGhost(coords.q, coords.r);
  });

  // KAMERA ORBIT
  let tx = center.x, tz = center.z;
  const initPos = camera.position.clone();
  let radius = Math.hypot(initPos.x - tx, initPos.y, initPos.z - tz);
  let theta  = Math.atan2(initPos.x - tx, initPos.z - tz);
  let phi    = Math.acos(Math.min(1, Math.max(-1, initPos.y / radius)));

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
  const panKeys = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (buildMode) {
        exitBuildMode();
      } else if (modalOverlay.classList.contains('open')) {
        closeModal();
      }
      return;
    }
    const k = e.key.toLowerCase(); if (panKeys.includes(k)) { pressed.add(k); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => { pressed.delete(e.key.toLowerCase()); });

  function applyPan(): void {
    if (pressed.size === 0) return;
    const st = radius * 0.012, fx = -Math.sin(theta), fz = -Math.cos(theta), rx = Math.cos(theta), rz = -Math.sin(theta);
    if (pressed.has('w') || pressed.has('arrowup'))    { tx += fx*st; tz += fz*st; }
    if (pressed.has('s') || pressed.has('arrowdown'))  { tx -= fx*st; tz -= fz*st; }
    if (pressed.has('d') || pressed.has('arrowright')) { tx += rx*st; tz += rz*st; }
    if (pressed.has('a') || pressed.has('arrowleft'))  { tx -= rx*st; tz -= rz*st; }
    updateCam();
  }

  // Przyciski reset seed
  const bSeed = document.querySelector('[data-modal="seed"]') as HTMLElement | null;
  if (bSeed) bSeed.addEventListener('click', () => {
    const s = Math.floor(Math.random()*100000);
    const p = new URLSearchParams(location.search); p.set('seed', String(s));
    location.search = p.toString();
  });

  updateCam();
  updateBuildUI();

  renderer.setAnimationLoop(() => { applyPan(); renderer.render(scene, camera); });
  (window as unknown as Record<string, unknown>).__mainviewReady = true;

  console.log(`[mainview] mapa ${W}x${H} seed=${SEED} miast=${cityCount} posterunki=${outpostCount}`);
  console.log('[mainview] zasięg territory — tiery: r5/r10/r15 wg pop/level, posterunek=r5');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
