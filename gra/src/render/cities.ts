/**
 * cities.ts
 * Renders settlement models on the hex map, one per City.
 *
 * INTEGRACJA (INTEGR-REN):
 *   - Epoka Kamień (era 1)  -> buildStoneAgeCity / buildStoneAgeCityRoblox
 *   - Epoka Brąz  (era 2+) -> buildBronzeCity / buildBronzeCityRoblox
 *   - Styl mapy roblox -> settlementModel.ts (A5 Roblox 2026-07-02)
 *   - Fallback (brak danych epoki) -> stary buildCityModel() – wbudowany, nigdy nie
 *     wywala mapy.
 *
 * sync() przyjmuje opcjonalny SyncOptions z callbackami:
 *   getEra(ownerId)   -> number (1=Kamień, 2=Brąz…); domyślnie 1
 *   getCiv(ownerId)   -> BronzeCiv;                   domyślnie 'grecja'
 *   getLevel(cityId)  -> number 1..10;                domyślnie city.population capped
 *   getWalls(cityId)  -> boolean;                     domyślnie false
 *
 * Owner color palette (same indices as units.ts):
 *   0 = gold 0xffd54a, 1 = red, 2 = green, 3 = blue,
 *   4 = orange, 5 = purple, 6 = teal, 7 = pink
 */

import * as THREE from 'three';
import type { City } from '../game/cities';
import { formatCityMapLabel } from '../game/display-names';
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { buildSettlementModel } from './settlementModel';
import { GAME_MAP_RENDER_STYLE, terrainVisualForStyle, type MapRenderStyle } from './mapRenderStyle';
import type { BronzeCiv } from './bronzeCity';
// MASTER render-miasta (2026-07-10): modele miast Kamień/Brąz — podpięcie
// bezpośrednio w CityRenderer.sync() (styl roblox), obok legacy
// buildSettlementModel (styl 'civ'/'minecraft' bez zmian).
import { buildMiastoKamien } from './miasto-kamien';
import { buildMiastoBraz } from './miasto-braz';
import type { CityProduction, ProductionItem } from '../game/production';
import { frontItem } from '../game/production';
import { getCityRationLevel } from '../game/population-growth-v85';
import {
  canAffordBuildingStock,
} from '../game/building-stock-cost';
import { clientRectToNdc } from '../input/picker';
import {
  cityMapBadgeKey,
  defenseTierFromWallKind,
  makeCityMapBadgeSprite,
  disposeCityStatChipTextures,
  wallKindFromBuilt,
  type CityMapBadgeInput,
} from './cityMapStatChip';
import {
  buildCityMapOutline,
  disposeCityMapOutline,
  placeCityMapOutline,
  type CityMapOutlineKind,
} from './cityMapOutline';

// ---------------------------------------------------------------------------
// Terrain top-Y — zsynchronizowane ze scene.ts (terrainVis / terrainVisualForStyle)
// ---------------------------------------------------------------------------

interface TerrainTopY {
  height: number;
  yOffset: number;
}

const CIV_TERRAIN_HEIGHT: Record<TerenBazowy, TerrainTopY> = {
  [TerenBazowy.Morze]:    { height: 0.30, yOffset: 0.00 },
  [TerenBazowy.Wybrzeze]: { height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]:     { height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]:  { height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]: { height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Wzgorza]:  { height: 0.70, yOffset: 0.15 },
  [TerenBazowy.Gory]:     { height: 1.20, yOffset: 0.40 },
  [TerenBazowy.Polarny]:  { height: 0.38, yOffset: 0.06 },
};

function terrainTopY(hex: Hex, style: MapRenderStyle = GAME_MAP_RENDER_STYLE): number {
  const civ = CIV_TERRAIN_HEIGHT[hex.terenBazowy];
  const spec = terrainVisualForStyle(hex.terenBazowy, style, civ);
  return spec.height + spec.yOffset;
}

// ---------------------------------------------------------------------------
// Owner color palette
// ---------------------------------------------------------------------------

const OWNER_COLORS: number[] = [
  0xffd54a, // 0 = player (gold)
  0xe53935, // 1 = red
  0x43a047, // 2 = green
  0x1e88e5, // 3 = blue
  0xfb8c00, // 4 = orange
  0x8e24aa, // 5 = purple
  0x00acc1, // 6 = teal
  0xf06292, // 7 = pink
];

function ownerColor(ownerId: number): number {
  return OWNER_COLORS[ownerId % OWNER_COLORS.length]!;
}

// ---------------------------------------------------------------------------
// Settlement colors (legacy fallback builder)
// ---------------------------------------------------------------------------

const COLOR_PLATFORM = 0x9b9b8a;
const COLOR_HOUSE    = 0xcda77a;
const COLOR_ROOF     = 0xb5532f;
const COLOR_TEMPLE   = 0x8a8a7a;
const COLOR_POLE     = 0xaaaaaa;

const R = HEX_R;

const PLATFORM_RADIUS = 0.55 * R;
const PLATFORM_HEIGHT = 0.04 * R;
const HOUSE_W = 0.18 * R;
const HOUSE_H = 0.16 * R;
const HOUSE_D = 0.18 * R;
const ROOF_W  = 0.20 * R;
const ROOF_H  = 0.12 * R;
const ROOF_D  = 0.20 * R;
const HOUSE_DIST = 0.28 * R;
const TEMPLE_W = 0.24 * R;
const TEMPLE_H = 0.24 * R;
const TEMPLE_D = 0.24 * R;
const TEMPLE_ROOF_RADIUS = 0.17 * R;
const TEMPLE_ROOF_HEIGHT = 0.20 * R;
const POLE_RADIUS = 0.010 * R;
const POLE_HEIGHT = 0.55 * R;
const FLAG_RADIUS = 0.07 * R;
const FLAG_HEIGHT = 0.10 * R;

const CITY_LIFT = 0.008 * R;
/** Skala modelu osady na heksie — czytelność z kamery mapy / pod overlay bitwy. */
const CITY_MODEL_SCALE = 1.38;

interface CityModelResult {
  group: THREE.Group;
  mats:  THREE.Material[];
}

/** Legacy fallback model (always works, no external deps). */
function buildCityModel(ownerCol: number): CityModelResult {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];

  function mat(color: number): THREE.MeshLambertMaterial {
    const m = new THREE.MeshLambertMaterial({ color });
    mats.push(m);
    return m;
  }

  const matPlatform   = mat(COLOR_PLATFORM);
  const matHouseWall  = mat(COLOR_HOUSE);
  const matHouseRoof  = mat(COLOR_ROOF);
  const matTempleBody = mat(COLOR_TEMPLE);
  const matTempleRoof = mat(ownerCol);
  const matPole       = mat(COLOR_POLE);
  const matFlag       = mat(ownerCol);

  const gPlatform = new THREE.CylinderGeometry(PLATFORM_RADIUS, PLATFORM_RADIUS, PLATFORM_HEIGHT, 6, 1);
  const mPlatform = new THREE.Mesh(gPlatform, matPlatform);
  mPlatform.position.y = PLATFORM_HEIGHT * 0.5;
  group.add(mPlatform);

  const platformTop = PLATFORM_HEIGHT;

  const gHouseBody = new THREE.BoxGeometry(HOUSE_W, HOUSE_H, HOUSE_D);
  const gHouseRoof = new THREE.BoxGeometry(ROOF_W, ROOF_H, ROOF_D);
  const houseAngles = [Math.PI * 0.0, Math.PI * (2.0 / 3.0), Math.PI * (4.0 / 3.0)];

  for (const angle of houseAngles) {
    const hx = Math.cos(angle) * HOUSE_DIST;
    const hz = Math.sin(angle) * HOUSE_DIST;
    const body = new THREE.Mesh(gHouseBody, matHouseWall);
    body.position.set(hx, platformTop + HOUSE_H * 0.5, hz);
    group.add(body);
    const roof = new THREE.Mesh(gHouseRoof, matHouseRoof);
    roof.position.set(hx, platformTop + HOUSE_H + ROOF_H * 0.35, hz);
    roof.rotation.x = Math.PI * 0.25;
    group.add(roof);
  }

  const gTempleBody = new THREE.BoxGeometry(TEMPLE_W, TEMPLE_H, TEMPLE_D);
  const mTemple = new THREE.Mesh(gTempleBody, matTempleBody);
  mTemple.position.y = platformTop + TEMPLE_H * 0.5;
  group.add(mTemple);

  const templeTop = platformTop + TEMPLE_H;

  const gTempleRoof = new THREE.ConeGeometry(TEMPLE_ROOF_RADIUS, TEMPLE_ROOF_HEIGHT, 4, 1);
  const mTempleRoof = new THREE.Mesh(gTempleRoof, matTempleRoof);
  mTempleRoof.position.y = templeTop + TEMPLE_ROOF_HEIGHT * 0.5;
  mTempleRoof.rotation.y = Math.PI * 0.25;
  group.add(mTempleRoof);

  const poleBase = templeTop + TEMPLE_ROOF_HEIGHT;
  const gPole = new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 5, 1);
  const mPole = new THREE.Mesh(gPole, matPole);
  mPole.position.y = poleBase + POLE_HEIGHT * 0.5;
  group.add(mPole);

  const gFlag = new THREE.ConeGeometry(FLAG_RADIUS, FLAG_HEIGHT, 4, 1);
  const mFlag = new THREE.Mesh(gFlag, matFlag);
  mFlag.position.y = poleBase + POLE_HEIGHT + FLAG_HEIGHT * 0.5;
  mFlag.rotation.z = Math.PI * 0.5;
  mFlag.position.x = FLAG_RADIUS * 0.5;
  group.add(mFlag);

  group.userData['mats']         = mats;
  group.userData['perCityGeos']  = [gPlatform, gHouseBody, gHouseRoof, gTempleBody, gTempleRoof, gPole, gFlag];

  return { group, mats };
}

// ---------------------------------------------------------------------------
// MASTER render-miasta (2026-07-10): modele miast Kamień (era 1) / Brąz (era 2+)
// dla stylu mapy 'roblox'. Epoka 3+ (Żelazo) — brak modelu w tej partii,
// fallback do Brązu [fallback do czasu partii Żelaza]. Cywilizacje spoza
// Grecja/Rzym -> fallback Grecja, obsłużony wewnątrz buildMiastoBraz.
// Style 'civ'/'minecraft' -> bez zmian, legacy buildSettlementModel.
// ---------------------------------------------------------------------------

function buildSettlementModelForStyle(
  era: number,
  civ: BronzeCiv,
  level: number,
  ownerCol: number,
  wallKind: CityWallKind,
): THREE.Group {
  const withWalls = wallKind !== 'none';
  const palisadaOnly = wallKind === 'palisada';
  if (GAME_MAP_RENDER_STYLE === 'roblox') {
    if (era >= 2) {
      // era 2 = Brąz; era 3+ (Żelazo, brak modelu) [fallback do czasu partii Żelaza]
      return buildMiastoBraz(civ, level, {
        mur: wallKind === 'stone',
        palisada: palisadaOnly,
        color: ownerCol,
      });
    }
    return buildMiastoKamien(level, { mur: withWalls, color: ownerCol });
  }
  return buildSettlementModel(era, civ, level, ownerCol, withWalls);
}

// ---------------------------------------------------------------------------
// Mapowanie TypCywilizacji -> BronzeCiv
// Używane gdy runtime nie dostarcza callbacku getCiv.
// ---------------------------------------------------------------------------

/** Domyślne mapowanie ownerId -> BronzeCiv (fallback: 'grecja'). */
const DEFAULT_CIV_MAP: Record<number, BronzeCiv> = {
  0: 'grecja',
  1: 'rzym',
  2: 'egipt',
  3: 'chiny',
  4: 'sumer',
  5: 'zulu',
  6: 'celtowie',
  7: 'germanie',
};

// ---------------------------------------------------------------------------
// SyncOptions — opcjonalne callbacki kontekstu gry
// ---------------------------------------------------------------------------

export type { CityMapOutlineKind } from './cityMapOutline';

export type CityWallKind = 'none' | 'stone' | 'palisada';

export interface CityRenderOptions {
  /**
   * Zwraca epokę właściciela miasta (1=Kamień, 2=Brąz, …).
   * Domyślnie: 1 (epoka kamień).
   */
  getEra?: (ownerId: number) => number;

  /**
   * Zwraca cywilizację właściciela (BronzeCiv) dla epoki Brąz+.
   * Domyślnie: mapowanie DEFAULT_CIV_MAP wg ownerId.
   */
  getCiv?: (ownerId: number) => BronzeCiv;

  /**
   * Zwraca poziom rozwoju miasta (1..10).
   * Domyślnie: Math.max(1, Math.min(10, city.population)).
   */
  getLevel?: (cityId: string) => number;

  /**
   * Zwraca czy miasto ma mury.
   * Domyślnie: false.
   */
  getWalls?: (cityId: string) => boolean;

  /**
   * Rodzaj obwodu obronnego: kamień (mury/fort), palisada drewniana, brak.
   * Domyślnie: getWalls ? 'stone' : 'none'.
   */
  getWallKind?: (cityId: string) => CityWallKind;

  /** B2-Q5: bunt w bieżącej turze — ikona 🔥 nad miastem. */
  getRevolt?: (cityId: string) => boolean;

  /** Mgła: false = ukryj model (obce miasta poza bieżącym zasięgiem widzenia). Domyślnie true. */
  isVisible?: (city: City) => boolean;

  /** Jednostki stojące na heksie miasta (wojsko na mapie). Domyślnie 0. */
  getUnitCountOnHex?: (q: number, r: number) => number;

  /** Obwódka heksu na mapie świata wg relacji dyplomatycznej względem gracza. */
  getMapOutlineKind?: (ownerId: number) => CityMapOutlineKind | null;

  /** Ukryj żetony 👥/⚔ nad miastem (np. panel miasta — liczby tylko w HUD miasta). */
  hideStatChips?: boolean;

  /** Kolor właściciela (tint modelu osady); domyślnie stara paleta OWNER_COLORS. */
  ownerColorFn?: (ownerId: number) => number;

  /** Zbudowane budynki miasta — obrona 3 stany na pigułce. */
  getBuiltBuildingIds?: (cityId: string) => readonly string[];

  /** ikonaId cywilizacji właściciela (civs.json). */
  getCivIconId?: (ownerId: number) => string;

  /** Kolejka produkcji — ikona frontu (buildingIconSvg / unitIconSvg). */
  getProduction?: (cityId: string) => CityProduction | null;

  /** Magazyn surowców państwa (suma City.surowce) — ostrzeżenie hover. */
  getOwnerResourceStock?: (ownerId: number) => Record<string, number>;

  /** Koszt surowcowy pozycji kolejki (enqueue) — do ostrzeżenia hover. */
  getProductionItemStockCost?: (item: ProductionItem) => Record<string, number>;

  /** Miasto pod kursorem — rozszerzona pigułka (hover). */
  hoverStatChipCityId?: string | null;

  /** ownerId gracza — pigułka: poziom Wyżywienia tylko dla jego miast. Domyślnie 0. */
  playerOwnerId?: number;

  /** true = miasto-państwo → medalion pigułki tylko sygnet kultury. */
  isCityStateOwner?: (ownerId: number) => boolean;

  /**
   * id stolicy właściciela — JEDNO źródło prawdy o stolicy (main.ts `capitalCityIdForOwner`,
   * to samo, co karmi `cityPanel.getCapitalCityId` i bramkę budynków `lokalizacja: 'stolica'`).
   * Renderer NIE liczy stolicy własną heurystyką. Brak callbacku = brak markera stolicy.
   * PARYTET AI: pytanie jest o `ownerId`, bez gałęzi „gracz vs AI”.
   */
  getCapitalCityId?: (ownerId: number) => string | null;

  /**
   * Nazwa cywilizacji właściciela (civs.json → kolumna `Cywilizacja`), np. „Rzym”.
   * MAP-UX-CLUSTER-LABEL-Q1=B+C: etykieta stolicy OBCEGO państwa zamiast nazwy miasta.
   */
  getCivDisplayName?: (ownerId: number) => string | undefined;
}

// ---------------------------------------------------------------------------
// CityRenderer
// ---------------------------------------------------------------------------

export class CityRenderer {
  private scene:   THREE.Scene;

  /** Fast hex lookup by "q,r" key. */
  private hexGrid: Map<string, Hex>;

  /** Active city models keyed by city.id. */
  private models: Map<string, THREE.Group> = new Map();

  /** B2-Q5: sprite 🔥 per city.id */
  private revoltSprites: Map<string, THREE.Sprite> = new Map();
  private revoltTex: THREE.CanvasTexture | null = null;

  /** Żeton nazwa + populacja nad miastem. */
  private statSprites: Map<string, THREE.Sprite> = new Map();
  private statSpriteKeys: Map<string, string> = new Map();
  private statTexCache: Map<string, THREE.CanvasTexture> = new Map();

  /** Delikatna obwódka heksu na mapie świata (poza panelem okolicy). */
  private mapOutlines: Map<string, THREE.Group> = new Map();
  private mapOutlineKeys: Map<string, string> = new Map();

  /** Per-model materials for disposal. */
  private modelMaterials: Map<string, THREE.Material[]> = new Map();

  /** Per-model unique geometries for disposal. */
  private modelGeos: Map<string, THREE.BufferGeometry[]> = new Map();

  constructor(scene: THREE.Scene, map: GameMap) {
    this.scene   = scene;
    this.hexGrid = new Map<string, Hex>(Object.entries(map.hexes));
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Synchronise rendered settlement models with the current city list.
   * Reuses existing models by city.id; creates new ones; removes stale ones.
   *
   * Opcjonalny parametr options pozwala dostarczyć callbacki z kontekstu gry
   * (epoka, cywilizacja, poziom, mury). Bez options – bezpieczne fallbacki.
   */
  sync(cities: City[], options?: CityRenderOptions): void {
    const presentIds = new Set<string>();

    for (const city of cities) {
      presentIds.add(city.id);

      const q = city.q;
      const r = city.r;
      const key = `${q},${r}`;

      const hex   = this.hexGrid.get(key);
      const topY  = hex ? terrainTopY(hex) : 0;
      const yBase = topY + CITY_LIFT;

      const ownerIndex = city.ownerId;
      const era     = options?.getEra?.(ownerIndex) ?? 1;
      const level   = options?.getLevel?.(city.id) ?? Math.max(1, Math.min(10, city.population ?? 1));
      const walls   = options?.getWalls?.(city.id) ?? false;
      const wallKind: CityWallKind = options?.getWallKind?.(city.id)
        ?? (walls ? 'stone' : 'none');
      const civ: BronzeCiv = options?.getCiv?.(ownerIndex) ??
        (DEFAULT_CIV_MAP[ownerIndex % 8] ?? 'grecja');
      const visualKey = `${GAME_MAP_RENDER_STYLE}|${era}|${civ}|${level}|${wallKind}`;
      const visible = options?.isVisible?.(city) ?? true;

      if (this.models.has(city.id)) {
        const grp = this.models.get(city.id)!;
        grp.userData['ownerId'] = ownerIndex;
        grp.userData['q'] = q;
        grp.userData['r'] = r;
        grp.visible = visible;
        if (grp.userData['visualKey'] === visualKey) {
          const { x, z } = axialToWorld(q, r, HEX_R);
          grp.position.set(x, yBase, z);
          grp.scale.setScalar(CITY_MODEL_SCALE);
          this._syncRevolt(city.id, grp, options?.getRevolt?.(city.id) ?? false);
          this._syncStatChip(
            city,
            grp,
            visible && !options?.hideStatChips,
            options,
          );
          this._syncMapOutline(city.id, q, r, topY, ownerIndex, options, visible);
          continue;
        }
        this._removeRevolt(city.id, grp);
        this._removeStatChip(city.id, grp);
        this._removeMapOutline(city.id);
        this.scene.remove(grp);
        this._disposeModel(city.id);
        this.models.delete(city.id);
        this.modelMaterials.delete(city.id);
        this.modelGeos.delete(city.id);
      }
      const col = (options?.ownerColorFn ?? ownerColor)(ownerIndex);
      let group: THREE.Group;
      try {
        group = buildSettlementModelForStyle(era, civ, level, col, wallKind);
      } catch (err) {
        console.warn('[CityRenderer] fallback na buildCityModel dla', city.id, err);
        const result = buildCityModel(col);
        group = result.group;
      }

      const { x, z } = axialToWorld(q, r, HEX_R);
      group.position.set(x, yBase, z);
      group.scale.setScalar(CITY_MODEL_SCALE);
      group.userData['cityId'] = city.id;
      group.userData['visualKey'] = visualKey;
      group.userData['ownerId'] = ownerIndex;
      group.userData['q'] = q;
      group.userData['r'] = r;
      group.visible = visible;

      this._registerModel(city.id, group);
      this.scene.add(group);
      this._syncRevolt(city.id, group, options?.getRevolt?.(city.id) ?? false);
      this._syncStatChip(
        city,
        group,
        visible && !options?.hideStatChips,
        options,
      );
      this._syncMapOutline(city.id, q, r, topY, ownerIndex, options, visible);
    }

    // Remove models for cities that no longer exist
    for (const [id, grp] of this.models) {
      if (!presentIds.has(id)) {
        this._removeRevolt(id, grp);
        this._removeStatChip(id, grp);
        this._removeMapOutline(id);
        this.scene.remove(grp);
        this._disposeModel(id);
        this.models.delete(id);
        this.modelMaterials.delete(id);
        this.modelGeos.delete(id);
      }
    }
  }

  /** Odśwież etykiety nazwa + populacja (np. po wzroście ludności). */
  syncStatChips(cities: City[], options?: CityRenderOptions): void {
    for (const city of cities) {
      const grp = this.models.get(city.id);
      if (!grp) continue;
      const visible = options?.isVisible?.(city) ?? true;
      this._syncStatChip(
        city,
        grp,
        visible && grp.visible && !options?.hideStatChips,
        options,
      );
    }
  }

  /**
   * Raycast na pigułkę miasta — cityId gdy kursor nad żetonem (hover rozszerzony).
   */
  pickStatChipCityIdAt(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
  ): string | null {
    const rect = canvas.getBoundingClientRect();
    const ndc = clientRectToNdc(clientX, clientY, rect);
    if (!ndc) return null;

    camera.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);

    const sprites = [...this.statSprites.values()].filter((s) => s.visible);
    if (sprites.length === 0) return null;

    const hits = raycaster.intersectObjects(sprites, false);
    for (const h of hits) {
      const cityId = h.object.userData['cityId'];
      if (typeof cityId === 'string' && cityId.length > 0) return cityId;
    }
    return null;
  }

  /** Odśwież obwódki heksów (np. po zmianie dyplomacji). */
  syncMapOutlines(cities: City[], options?: CityRenderOptions): void {
    for (const city of cities) {
      const hex = this.hexGrid.get(`${city.q},${city.r}`);
      const topY = hex ? terrainTopY(hex) : 0;
      const visible = options?.isVisible?.(city) ?? true;
      const grp = this.models.get(city.id);
      this._syncMapOutline(
        city.id,
        city.q,
        city.r,
        topY,
        city.ownerId,
        options,
        visible && (grp?.visible ?? true),
      );
    }
  }

  /**
   * Ukryj obce miasta poza bieżącym zasięgiem widzenia (jak jednostki AI).
   * Wywoływane z refreshFog() po ruchu jednostek / zmianie mgły.
   */
  applyFogVisibility(vis: ReadonlySet<string>, fogOn: boolean, playerOwnerId = 0): void {
    for (const grp of this.models.values()) {
      if (!fogOn) {
        grp.visible = true;
        continue;
      }
      const ownerId = grp.userData['ownerId'] as number | undefined;
      if (ownerId === playerOwnerId) {
        grp.visible = true;
        continue;
      }
      const q = grp.userData['q'] as number | undefined;
      const r = grp.userData['r'] as number | undefined;
      if (q === undefined || r === undefined) {
        grp.visible = false;
        continue;
      }
      grp.visible = vis.has(`${q},${r}`);
    }
    for (const [cityId, outline] of this.mapOutlines) {
      const grp = this.models.get(cityId);
      outline.visible = grp?.visible ?? false;
    }
  }

  /** Remove all city models from the scene and dispose GPU resources. */
  dispose(): void {
    for (const [id, grp] of this.models) {
      this.scene.remove(grp);
      this._disposeModel(id);
    }
    for (const id of [...this.mapOutlines.keys()]) {
      this._removeMapOutline(id);
    }
    this.models.clear();
    this.modelMaterials.clear();
    this.modelGeos.clear();
    this.revoltSprites.clear();
    this.statSprites.clear();
    this.statSpriteKeys.clear();
    disposeCityStatChipTextures(this.statTexCache);
    if (this.revoltTex) {
      this.revoltTex.dispose();
      this.revoltTex = null;
    }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private _revoltTexture(): THREE.CanvasTexture {
    if (!this.revoltTex) {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.font = '48px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1F525}', 32, 36);
      this.revoltTex = new THREE.CanvasTexture(c);
    }
    return this.revoltTex;
  }

  private _removeRevolt(cityId: string, parent: THREE.Group): void {
    const s = this.revoltSprites.get(cityId);
    if (s) {
      parent.remove(s);
      (s.material as THREE.SpriteMaterial).dispose();
      this.revoltSprites.delete(cityId);
    }
  }

  private _syncRevolt(cityId: string, parent: THREE.Group, show: boolean): void {
    if (!show) {
      this._removeRevolt(cityId, parent);
      return;
    }
    if (this.revoltSprites.has(cityId)) return;
    const mat = new THREE.SpriteMaterial({
      map: this._revoltTexture(),
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.9, 0.9, 1);
    sprite.position.set(0, 1.35, 0);
    parent.add(sprite);
    this.revoltSprites.set(cityId, sprite);
  }

  private _removeStatChip(cityId: string, parent: THREE.Group): void {
    const s = this.statSprites.get(cityId);
    if (s) {
      parent.remove(s);
      // Uwaga: NIE dispose'ować (s.material as THREE.SpriteMaterial).map — tekstura jest
      // współdzielona przez statTexCache (klucz nazwa|pop) i może być używana przez inny
      // sprite. Cache czyszczony całościowo w disposeCityStatChipTextures() (dispose()).
      (s.material as THREE.SpriteMaterial).dispose();
      this.statSprites.delete(cityId);
      this.statSpriteKeys.delete(cityId);
    }
  }

  /**
   * Czy TO miasto jest stolicą swojego państwa — wyłącznie z `options.getCapitalCityId`
   * (main.ts `capitalCityIdForOwner`). Bez callbacku: false, czyli brak markera, ale
   * NIGDY własna heurystyka „najstarsze miasto” — jedno źródło prawdy.
   * Miasta-państwa WYŁĄCZONE (MAP-UX-CAPITAL-MP-SCOPE-Q1=B, Maciej 2026-08-06): MP ma
   * zawsze jedno miasto, więc predykat capId===city.id byłby prawdziwy dla każdego MP —
   * korona/obwódka ma czytać się jako „stolica imperium”, nie jako techniczny fakt
   * „to jedyne miasto tego właściciela”.
   */
  private _isCapitalCity(city: City, options?: CityRenderOptions): boolean {
    if (options?.isCityStateOwner?.(city.ownerId) ?? false) return false;
    const capId = options?.getCapitalCityId?.(city.ownerId) ?? null;
    return capId !== null && capId === city.id;
  }

  /** Etykieta pigułki — MAP-UX-CLUSTER-LABEL-Q1=B+C (stolica obcego państwa → nazwa cywilizacji). */
  private _cityMapLabel(
    city: City,
    isCapital: boolean,
    options?: CityRenderOptions,
  ): string {
    return formatCityMapLabel(city, {
      playerOwnerId: options?.playerOwnerId ?? 0,
      isCapital,
      civDisplayName: options?.getCivDisplayName?.(city.ownerId),
      isCityStateOwner: options?.isCityStateOwner?.(city.ownerId) ?? false,
    });
  }

  private _buildBadgeInput(
    city: City,
    cityName: string,
    isCapital: boolean,
    options?: CityRenderOptions,
  ): CityMapBadgeInput {
    const built = options?.getBuiltBuildingIds?.(city.id) ?? [];
    const wallKind: CityWallKind = options?.getWallKind?.(city.id)
      ?? wallKindFromBuilt(built);
    const prod = options?.getProduction?.(city.id) ?? null;
    const front = prod ? frontItem(prod) : null;
    const ownerCol = (options?.ownerColorFn ?? ownerColor)(city.ownerId);
    const playerId = options?.playerOwnerId ?? 0;
    const isPlayerCity = city.ownerId === playerId;
    const hoverExpanded = options?.hoverStatChipCityId === city.id;
    const prodPaused = prod?.wstrzymana === true;
    let resourceWarning = false;
    if (front && options?.getOwnerResourceStock && options?.getProductionItemStockCost) {
      const pool = options.getOwnerResourceStock(city.ownerId);
      const stockCost = options.getProductionItemStockCost(front);
      if (Object.keys(stockCost).length > 0) {
        resourceWarning = !canAffordBuildingStock(pool, stockCost);
      }
    }
    const prodCategoryLabel = front
      ? (front.kind === 'budynek' ? 'Budynek' : 'Jednostka')
      : null;
    return {
      cityName,
      population: city.population ?? 1,
      defenseTier: defenseTierFromWallKind(wallKind),
      civIconId: options?.getCivIconId?.(city.ownerId) ?? 'grecy',
      ownerColor: ownerCol,
      prodActive: front !== null && prod?.wstrzymana !== true,
      prodKind: front?.kind ?? null,
      prodId: front?.id ?? null,
      growthLevel: isPlayerCity ? getCityRationLevel(city) : null,
      resourceWarning,
      hoverExpanded,
      prodCategoryLabel,
      prodItemName: front?.nazwa ?? null,
      prodPaused,
      isCityState: options?.isCityStateOwner?.(city.ownerId) ?? false,
      era: options?.getEra?.(city.ownerId) ?? 1,
      isCapital,
    };
  }

  private _syncStatChip(
    city: City,
    parent: THREE.Group,
    show: boolean,
    options?: CityRenderOptions,
  ): void {
    const cityId = city.id;
    if (!show) {
      this._removeStatChip(cityId, parent);
      return;
    }
    const isCapital = this._isCapitalCity(city, options);
    const cityName = this._cityMapLabel(city, isCapital, options);
    const badge = this._buildBadgeInput(city, cityName, isCapital, options);
    const key = cityMapBadgeKey(badge);
    const prevKey = this.statSpriteKeys.get(cityId);
    if (prevKey === key && this.statSprites.has(cityId)) {
      const sp = this.statSprites.get(cityId)!;
      sp.visible = true;
      return;
    }
    this._removeStatChip(cityId, parent);
    const sprite = makeCityMapBadgeSprite(badge, this.statTexCache);
    sprite.userData['cityId'] = cityId;
    parent.add(sprite);
    this.statSprites.set(cityId, sprite);
    this.statSpriteKeys.set(cityId, key);
  }

  private _removeMapOutline(cityId: string): void {
    const g = this.mapOutlines.get(cityId);
    if (!g) return;
    this.scene.remove(g);
    disposeCityMapOutline(g);
    this.mapOutlines.delete(cityId);
    this.mapOutlineKeys.delete(cityId);
  }

  private _syncMapOutline(
    cityId: string,
    q: number,
    r: number,
    topY: number,
    ownerId: number,
    options: CityRenderOptions | undefined,
    show: boolean,
  ): void {
    const kind = options?.getMapOutlineKind?.(ownerId) ?? null;
    if (!show || kind === null) {
      this._removeMapOutline(cityId);
      return;
    }
    const civColor = (options?.ownerColorFn ?? ownerColor)(ownerId);
    const atWar = kind === 'war';
    const outlineKey = `${ownerId}:${kind}:${civColor}`;
    const prev = this.mapOutlineKeys.get(cityId);
    if (prev === outlineKey && this.mapOutlines.has(cityId)) {
      const g = this.mapOutlines.get(cityId)!;
      placeCityMapOutline(g, q, r, topY);
      g.visible = true;
      return;
    }
    this._removeMapOutline(cityId);
    const outline = buildCityMapOutline(q, r, topY, civColor, atWar);
    this.scene.add(outline);
    this.mapOutlines.set(cityId, outline);
    this.mapOutlineKeys.set(cityId, outlineKey);
  }

  /**
   * Convert a string ownerId to a numeric palette index.
   * Interprets numeric strings directly (e.g. "0", "1").
   * Falls back to a stable hash for arbitrary string ids.
   */
  private _ownerIndex(ownerId: string): number {
    const n = parseInt(ownerId, 10);
    if (!isNaN(n) && n >= 0) return n;
    let h = 0;
    for (let i = 0; i < ownerId.length; i++) {
      h = (Math.imul(h, 31) + ownerId.charCodeAt(i)) >>> 0;
    }
    return h % OWNER_COLORS.length;
  }

  private _registerModel(id: string, group: THREE.Group): void {
    this.models.set(id, group);
    this.modelMaterials.set(id, (group.userData['mats'] as THREE.Material[]) ?? []);
    this.modelGeos.set(id, (group.userData['perCityGeos'] as THREE.BufferGeometry[]) ?? []);
  }

  private _disposeModel(id: string): void {
    const mats = this.modelMaterials.get(id) ?? [];
    for (const m of mats) m.dispose();
    const geos = this.modelGeos.get(id) ?? [];
    for (const g of geos) g.dispose();
  }
}
