/**
 * battleScene.ts
 * Tactical 3D AUTO-battle overlay scene for The Game (SS5h: AI controls both
 * sides, player watches or skips).
 *
 * B7 REWORK -- SQUARE BATTLEFIELD + 4-DIRECTION FACING.
 * The WORLD MAP stays hex (scene.ts / hexutil.ts unchanged); ONLY this tactical
 * battle field was converted from a pointy-top hex grid to a regular SQUARE
 * (NxM) grid of flat tiles. Movement / melee adjacency / ranged reach are now
 * 4-directional (N/E/S/W); distance is Manhattan (in tiles); facing is one of
 * four directions. The turn loop, blow-for-blow pacing, ammo/pilum (B6) and the
 * canonical resolveCombat numbers are UNCHANGED -- only the geometry and the
 * distance/range measurements were swapped from hex to square.
 *
 *   PLACEMENT: the two armies line up FACING each other on opposite ends of the
 *   field in clean vertical COLUMNS, with a clear multi-tile GAP between the
 *   front lines. Attacker on the LEFT (front = EAST, +X). Defender on the RIGHT
 *   (front = WEST, -X).
 *
 *   TURN LOOP (every unit acts once per turn): every unit has movement points =
 *   its "Ruch w bitwie (heksy)" stat (default 2 if missing/0). On its turn the
 *   unit finds the nearest enemy, BFS-paths toward it and WALKS tile-by-tile
 *   (animated) up to its movement points, then on a LATER turn:
 *     - a MELEE unit may attack ONLY if it is ADJACENT (Manhattan dist == 1).
 *     - a RANGED unit (Atak dystansowy > 0 or Zasieg ataku (hex) >= 2) may
 *       attack any enemy within its range (no adjacency needed), while it has
 *       ammunition (B6); once ammo runs out it fights as pure melee.
 *
 * FACING (SS5l): the ATTACKER turns to FACE the tile it strikes (front -> the
 * target). The DEFENDER keeps its OWN facing, so a blow that lands on the
 * defender's side/back is a FLANK / REAR hit -- that arc is passed to the
 * canonical combat math (flankRearDefensePenalty / resolveCombat's
 * attackerPosition) which already applies the SS5l side/back defence penalty.
 *
 * Square-grid geometry (self-contained -- no hexutil):
 *   cellToWorld(col, row)  =>  x = col*S,  z = row*S   (S = TILE_S, tiles touch)
 *   tile = thin flat BoxGeometry(S, TILE_H, S), top face at y = 0.
 *
 * Combat numbers are canonical: the same exported SS5l helpers
 * (hitChance / baseDamage / rangeDamage / counter / flankRearDefensePenalty) and
 * resolveCombat decide each fight's exact HP loss / winner.
 *
 * ASCII-only source file (Polish UI strings via plain ASCII where possible).
 *
 * Public API (UNCHANGED):
 *   constructor(opts: BattleOpts)
 *   play(onFinish: (r: BattleResult) => void): void
 *   skip(): void
 *   dispose(): void
 */

import * as THREE from 'three';
import {
  resolveCombat,
  hitChanceTw,
  baseDamage,
  rangeDamage,
  counterMultiplier,
  terrainDefenseMultiplier,
  terrainRiverAttackMultiplier,
  terrainRangeDelta,
  cavalryTerrainMultiplier,
  flankRearDefensePenalty,
} from '../game/combat';
import type { CombatUnit, CombatResult } from '../game/combat';
import { combatUnitFromDef, unitRowStat } from '../game/combat';
import {
  buildTerrainTerenTooltipParts,
  terrainTerenTooltipColor,
} from './battleTerrainTooltip';
import type { CivBonusEntry } from '../game/civ-bonuses';
import { applyMultiplier, civCombatStatMultipliers } from '../game/civ-bonuses';
import { mergeBuildingBonusIntoStatMultipliers } from '../game/unit-building-bonuses';
import {
  applyVeteranFracToCombatUnit,
  veteranMoraleBazoweUp,
  veteranMoraleUcieczkiDown,
} from '../game/veteran';
import { applyArmyHungerStatMultToCombatUnit } from '../game/army-starvation';
import { applyGoldDeficitStatMultToCombatUnit } from '../game/gold-deficit';
import {
  cityWallDefenseBonusPercent,
  cityGatedTerrainMultiplier,
  fieldFortifyDefenseBonus,
} from '../game/city-defense';
import { buildUnitModel } from '../render/units';
import { clientRectToNdc, refreshInstancedPickBounds, worldToClientPx } from '../input/picker';
import {
  BTerrain,
  generateBattleTerrain,
  tileJitter,
  presetForWorldTerrain,
  type BattleTerrainMap,
  type WorldTerrainInput,
} from './battle-terrain';
import combatParamsData from '../../data/combat-params.json';
import miastoParamsData from '../../data/miasto-params.json';
import { buildSiegeWall, attachRowBreachPanels } from './siegeWall';
import type { BronzeCiv } from '../render/bronzeCity';
import {
  drawBattleMinimap,
  minimapPixelToTile,
  MINIMAP_H,
  MINIMAP_W,
  type BattleMinimapData,
  type BattleMinimapUnit,
  type BattleMinimapViewport,
} from './battleMinimap';
import {
  applyBtnOutline,
  applyBtnPrimary,
  applyBtnStartBattle,
  applyDeployToolbarBar,
  applyFilterChip1E,
  applyFilterIconChip1E,
  FILTER_ALL_SVG,
  FILTER_GENERAL_SVG,
  FILTER_KIND_SVG,
  applyGroupBadge1E,
  applyMinimap1E,
  applyModeHint1E,
  applyRailBtn1E,
  applyRosterFilterBar1E,
  applyRosterChromeRow1E,
  applyDeployGroupManagerBar1E,
  applyDeployGroupManagerRail1E,
  applyDeployGroupTab1E,
  applyRosterActionBar1E,
  applyRosterFooter1E,
  applyRosterHeaderSection1E,
  applyRosterPanel1E,
  applySelectionActionBtn1E,
  applyToolbarBtn1E,
  applyToolbarIconBtn1E,
  applyDeployDropdownPanel1E,
  wrapWithHoverTooltip1E,
  DEPLOY_TOOLBAR_MAIN_SVG,
  applyTopBar1E,
  applyUnitCardIconCircle,
  groupBtnLabelHtml,
  mkRosterBarTrack,
  BATTLE_ENEMY,
  BATTLE_ENEMY_TEXT,
  BATTLE_FONT,
  BATTLE_FONT_TITLE,
  BATTLE_GOLD,
  BATTLE_GOLD_DIM,
  BATTLE_HUD_BG,
  BATTLE_PANEL_BG,
  BATTLE_PANEL_BORDER,
  BATTLE_PLAYER,
  BATTLE_PLAYER_BG,
  BATTLE_PLAYER_TEXT,
  BATTLE_TEXT,
  BATTLE_TEXT_DIM,
  FMT_SVG,
  DEPLOY_KIND_LABEL,
  DEPLOY_SCOPE_SVG,
  DEPLOY_TACTIC_SVG,
  DEPLOY_POPUP_INACTIVE_BG,
  buildDeployPopupRowHtml,
  buildDeployTacticCellHtml,
  paintDeployPopupOption,
  hpBarGradient,
  moraleBarGradient,
  rosterCardBaseStyle,
  rosterRowAccent,
  applyTwRosterTrayStyle,
  applyRosterGridStyle,
  computeRosterGridMetrics,
  applyBattleRosterScrollbar,
  injectBattleRosterScrollbarStyles,
  ROSTER_PANEL_FIXED_W,
  rosterTypeCountsHtml,
  topBarRosterCountsHtml,
  applyDeployPopupItem1E,
  applyCommanderPanel1E,
  commanderPortraitRingSvg,
  applyTempoMinimapOuterPanel1E,
  applyTempoRow1E,
  applyTempoBtn1E,
  TEMPO_SVG,
  PB_SVG,
  type RosterGridMetrics,
  ROSTER_CARD_W,
  ROSTER_CARD_GAP,
  ROSTER_MAX_COLS,
  ROSTER_SCROLLBAR_RESERVE,
  ROSTER_MELEE,
  ROSTER_MOUNTED,
  ROSTER_RANGED,
  CMD_SVG,
  ROSTER_TYPE_SVG,
  createBattlePrioritySelect1E,
  createBattleClassTypeRow,
  applyBattleStrategyOutlineBtn,
  applyBattleStrategyGoldCta,
  applyBattleCheckbox1E,
  createRosterEmptySlotElement,
  STRATEGY_HEADER_SVG,
  type BattleClassKind,
  ROSTER_STATE_SVG,
  ROSTER_DEAD_COLOR,
  HP_BAR_LOW_GRADIENT,
  SETTINGS_GEAR_SVG,
  applySettingsGearBtn1E,
  applySettingsPopupPanel1E,
  applySettingsPopupHeader1E,
  createSettingsToggleRow1E,
  createSettingsActionRow1E,
} from './battleHudTheme';
import { civIconSvg, brandIconSvg } from '../ui/icons/brandAssets';
import { leaderPortraitUrl, leaderName, civIconIdFromCivLabel } from '../ui/leaderPortraits';
import { showEndScreen1E } from './endScreen1E';
import { markBattleSceneOpen, markBattleSceneClosed } from './battleSceneOpen';
import { startVictoryMusic, startDefeatMusic, startBattleMusic } from '../audio/muzyka-antyczna';
import {
  showEndDetails1E,
  type EndDetails1EParams,
  type EndDetailsSideData,
  type EndDetailsUnitRow,
} from './endDetails1E';
import { buildPostBattleSummary } from '../game/battle-summary';
import type { BattleSummaryWinner, BattleUnitBeforeSnap } from '../game/battle-summary';
import {
  computeBattleLoot,
  formatBattleLootNote,
  battleLootIsEmpty,
} from '../game/battle-loot';
import {
  hidePostBattleSummary,
  isPostBattleSummaryOpen,
  showPostBattleSummary,
} from '../ui/postBattleSummary';
import {
  disposeSiegeHud1E, layoutSiegeHud1E, mountSiegeHud1E,
  setSiegeHudVisible, updateSiegeHud1E,
} from './siegeHud1E';

export type { BattleMinimapData, BattleMinimapUnit, BattleMinimapViewport } from './battleMinimap';

// ---------------------------------------------------------------------------
// SQUARE-GRID FACING (4 directions: N / E / S / W)
//
// NOTE ON facing.ts: the spec asked for a NEW src/battle/facing.ts exposing the
// square Dir/facingToward/relativeHit API. A parallel session had ALREADY created
// src/battle/facing.ts as a HEX (6 pointy-top axial directions) helper for the
// previous hex battle field, and the lane rule forbids overwriting it. The hex
// facing.ts is geometrically incompatible with this square grid, so the square
// 4-direction facing logic lives self-contained HERE instead. It is the exact
// API the spec described (Dir enum N/E/S/W, facingToward, relativeHit) -- only
// the file location differs, to avoid clobbering the other session's work.
//
// Grid convention (matches cellToWorld below): col -> +X (East), row -> +Z.
// On screen the camera looks from +Z toward -Z, so:
//   E = +col (+X)   W = -col (-X)   S = +row (+Z, toward camera)   N = -row (-Z)
// ---------------------------------------------------------------------------

/** The four square-grid facing directions. */
export const enum Dir {
  N = 0, // -row
  E = 1, // +col
  S = 2, // +row
  W = 3, // -col
}

/** Result of classifying an attack against a defender's facing. */
export type FacingHit = 'front' | 'flank' | 'rear';

/** Unit (col,row) delta for each Dir, index === Dir. */
const DIR_DELTA: ReadonlyArray<readonly [number, number]> = [
  [0, -1], // N
  [1, 0],  // E
  [0, 1],  // S
  [-1, 0], // W
];

/**
 * The four orthogonal neighbour steps (N/E/S/W) used for movement, adjacency
 * and BFS on the square grid. Identical order to DIR_DELTA.
 */
const DIRS4: ReadonlyArray<readonly [number, number]> = DIR_DELTA;

/**
 * Pick the facing Dir that best matches the (dCol, dRow) vector pointing from a
 * unit toward a point of interest (its target). The dominant axis wins; ties
 * (|dCol| == |dRow|) prefer the horizontal axis (E/W) so a front line that
 * deploys left/right of the enemy keeps facing across the field. If the vector
 * is zero (target on the same tile) `fallback` (the unit's current facing) is
 * kept so a facing is never clobbered to a default.
 */
export function facingToward(dCol: number, dRow: number, fallback: Dir = Dir.E): Dir {
  if (dCol === 0 && dRow === 0) return fallback;
  if (Math.abs(dCol) >= Math.abs(dRow)) {
    return dCol >= 0 ? Dir.E : Dir.W;
  }
  return dRow >= 0 ? Dir.S : Dir.N;
}

/**
 * Convenience wrapper: facing Dir that points from (fromCol,fromRow) toward
 * (toCol,toRow).
 */
export function facingFromTo(
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
  fallback: Dir = Dir.E,
): Dir {
  return facingToward(toCol - fromCol, toRow - fromRow, fallback);
}

/** The diametrically opposite facing (N<->S, E<->W). */
export function oppositeDir(d: Dir): Dir {
  return ((d + 2) % 4) as Dir;
}

/**
 * Classify where an attack lands relative to the DEFENDER's facing.
 *
 *   - the direction FROM the defender TOWARD the attacker is the "incoming" dir;
 *   - if incoming == defender's facing            -> FRONT  (head-on)
 *   - if incoming is the OPPOSITE of the facing    -> REAR   (struck from behind)
 *   - otherwise (the two perpendicular dirs)        -> FLANK (side)
 *
 * Works for any attacker position (adjacent or ranged) -- it is purely the
 * relative direction of the blow, exactly as the SS5l side/back penalty needs.
 */
export function relativeHit(
  defenderFacing: Dir,
  attackerCol: number,
  attackerRow: number,
  defenderCol: number,
  defenderRow: number,
): FacingHit {
  const incoming = facingToward(
    attackerCol - defenderCol,
    attackerRow - defenderRow,
    defenderFacing,
  );
  if (incoming === defenderFacing) return 'front';
  if (incoming === oppositeDir(defenderFacing)) return 'rear';
  return 'flank';
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BattleUnit {
  id: string;
  nazwa: string;
  kategoria: string;
  ownerColor: number;
  stats: any;
  hp: number;
  maxHp: number;
  /**
   * Sciezki ulepszen jednostek (2026-07-25, game/unit-building-bonuses.ts).
   * Ulamkowy bonus Pancerza (Sciezka A: Kuznia/Kuznia zelaza/Wielka Kuznia)
   * wg NAJLEPSZEGO miasta ta jednostka kiedykolwiek odwiedzila. Wypelniane
   * przez main.ts runtimeToBattleUnit() z RuntimeUnit.pancerzBonusProc;
   * domyslnie undefined/0 -- bezpieczne dla wszystkich istniejacych wywolan
   * (synthetic/test BattleUnit literals bez tego pola).
   */
  pancerzBonusFrac?: number;
  /** Jak wyzej, Sciezka B (parametry miekkie: wszystko poza Pancerzem). */
  parametryBonusFrac?: number;
  /**
   * TRZECI SYSTEM -- doswiadczenie bojowe / weterani (2026-07-25, game/veteran.ts).
   * Ulamek premii (0 / 0.10 / 0.20) wg poziomu (Rekrut/Doswiadczony/Weteran).
   * Wypelniane przez main.ts runtimeToBattleUnit() z RuntimeUnit.battlesSurvived
   * (via veteranCombatBonusFrac()) -- ANALOGICZNIE do pancerzBonusFrac/
   * parametryBonusFrac powyzej, ale NIEZALEZNY, trzeci system (nie miesza sie
   * z tamtymi -- patrz naglowek game/veteran.ts). Domyslnie undefined/0 --
   * bezpieczne dla wszystkich istniejacych wywolan (synthetic/test BattleUnit
   * literals bez tego pola zachowuja dokladnie dawne zachowanie).
   */
  veteranBonusFrac?: number;
  /**
   * Fortyfikacja W POLU (dyspozycja Maciej 2026-07-26, "oblezenie + fortyfikacja").
   * Wypelniane przez main.ts runtimeToBattleUnit() z RuntimeUnit.ufortyfikowanyWPolu
   * -- OSOBNE od garnizonu miasta/muru (ktory ma wlasny procentowy system, patrz
   * onWallWalkway/wallDefenseTotalProc). Konsumowane przez _singleBlow (bitwa
   * taktyczna) i computeInstantResult ("Pomin") -- +50% Obrony (fortify_obrona_proc),
   * NIGDY Atak, przez fieldFortifyDefenseBonus (game/city-defense.ts).
   * Domyslnie undefined/false -- bezpieczne dla wszystkich istniejacych wywolan
   * (synthetic/test BattleUnit literals bez tego pola zachowuja dawne zachowanie).
   */
  fortifiedInField?: boolean;
  /**
   * Głód wojska (PYTANIE-85): państwo właściciela ma ujemne zapasy po koszcie armii.
   * Osłabia staty bojowe (bez armor) w toCombatUnit — patrz army-starvation.ts.
   */
  armyHungry?: boolean;
  /**
   * Deficyt Złota (R-DEFICYT-ZLOTA-KARA-Q1=A/R-DEFICYT-ZLOTA-TRIGGER-Q1=B):
   * Skarbiec właściciela < 0 po zbankowaniu tury. Osłabia staty bojowe (bez
   * armor) w toCombatUnit — patrz gold-deficit.ts.
   */
  goldDeficit?: boolean;
}

/** Siege-mode options: add a wall across the defender's end of the field. */
export interface SiegeOpts {
  /** Civilization style for the wall mesh (default 'rzym'). */
  civ?: BronzeCiv;
  /**
   * SIEGE v2: defender's civilization (controls the wall mesh style). When
   * provided, overrides `civ`. Use `defCiv` when the attacker's civ is
   * different from the city owner -- the wall should reflect the DEFENDER.
   */
  defCiv?: BronzeCiv;
  /**
   * Maciej 2026-07-25 (rozszerzone 41B -- Baszta): lista id budynkow FIZYCZNIE
   * obecnych w broniacym sie miescie (City.cityBuilt), np. ['mury', 'fort',
   * 'baszta']. Steruje bonusem obrony na koronie muru (onWallWalkway) przez
   * cityWallDefenseBonusPercent (game/city-defense.ts) -- +200% (sam mur),
   * +300% (mur+Cytadela, budynek 'fort'), +400% (mur+Cytadela+Baszta).
   * Domyslnie undefined/puste (brak bonusu ponad zero) dla wstecznej
   * zgodnosci callerow, ktorzy tego nie ustawiaja.
   */
  builtBuildingIds?: readonly string[];
}

export interface BattleOpts {
  attacker: BattleUnit[];
  defender: BattleUnit[];
  teren: string;
  /**
   * World-map hex the fight is happening on (defender's/target's hex): drives
   * the battle-terrain preset (forest/hills/river density + palette) so the
   * tactical field echoes the world terrain. OPTIONAL -- omit it and the field
   * generates exactly as before (no regression for callers that don't pass it).
   * See battle-terrain.ts `presetForWorldTerrain`. Overridable for playtests
   * via the `?bt=laka|rownina|wzgorza|gory|las|pustynia|wybrzeze|rzeka` query
   * param (see debugWorldTerrainOverride() below).
   */
  worldTerrain?: WorldTerrainInput;
  data?: any;
  onCancel?: () => void;
  /** When set, activates siege mode: a wall + gate are placed near the defender. */
  siege?: SiegeOpts;
  /**
   * C-COMBAT-Q2 (Maciej 2026-07-26): true when the DEFENDER is defending a
   * CITY hex -- walled (siege set, always implies this too) OR wall-less
   * (potyczka polowa o miasto bez muru, mapFieldBattle.ts's launchFieldBattleFromMap,
   * which never sets `siege`). Gates the Wzgorza/Gory terrain bonus so it only
   * counts for city defense when the city HAS a wall (cityGatedTerrainMultiplier,
   * game/city-defense.ts) -- see _singleBlow / computeInstantResult. Omit/false
   * for plain field battles (unit vs unit, no city on the hex) -- terrain keeps
   * its full, ungated effect exactly as before (bez zmian, decyzja wlasciciela).
   */
  cityDefense?: boolean;
  /** Gdy true — faza rozstawiania poprzedza walke; gracz ustawia formacje przed walka. */
  deploy?: boolean;
  /** Ktora strone gracz rozstawia/recznie prowadzi (domyslnie atakujacy). */
  deployPlayerSide?: 'atk' | 'def';
  /** RDY-01 / D4-Q3: bonusy cyw armii atakujacej (civs.json bonusy[]). */
  attackerCivBonusy?: readonly CivBonusEntry[];
  /** RDY-01 / D4-Q3: bonusy cyw armii broniacej. */
  defenderCivBonusy?: readonly CivBonusEntry[];
  /** Etykieta cywilizacji atakujacego (pasek mocy HUD). */
  attackerCivLabel?: string;
  /** Etykieta cywilizacji broniacego (pasek mocy HUD). */
  defenderCivLabel?: string;
  /** ikonaId cywilizacji atakujacego (emblemat UI). */
  attackerCivIconId?: string;
  /** ikonaId cywilizacji broniacego (emblemat UI). */
  defenderCivIconId?: string;
  /** C-BITWA-WLADCA=B: imie wladcy atakujacego przydzielone per wlasciciel (pula 10/civ). */
  attackerLeaderName?: string;
  /** C-BITWA-WLADCA=B: imie wladcy broniacego przydzielone per wlasciciel (pula 10/civ). */
  defenderLeaderName?: string;
  /** Epoka atakujacego (1=kamien,2=braz,3=zelazo) -- dobor portretu wladcy w medalionie. Brak = 1. */
  attackerEra?: number;
  /** Epoka broniacego (1=kamien,2=braz,3=zelazo) -- dobor portretu wladcy w medalionie. Brak = 1. */
  defenderEra?: number;
  /**
   * R-MP-PORTRET (Maciej 2026-07-24) -- atakujacy to miasto-panstwo klastra
   * (isOwnerClusterCityState). Gdy true, medalion dowodcy NIE pokazuje portretu-zdjecia
   * wladcy glownej cywilizacji -- wraca do ikony-symbolu kultury (civIconSvg).
   */
  attackerIsCityState?: boolean;
  /** Jw. dla broniacego. */
  defenderIsCityState?: boolean;
  /**
   * TEMAT 11 (Maciej 2026-07-24) -- atakujacy to frakcja barbarzyncow
   * (game/barbarians.ts isBarbarian(ownerId)). Gdy true, medalion dowodcy NIE pokazuje
   * ani portretu-zdjecia, ani ikony-symbolu jakiejkolwiek cywilizacji (civId barbarzyncow
   * bywa fallbackiem 'grecy' -- brak prawdziwej kultury) -- wlasny sygnet (czaszka).
   * Ma pierwszenstwo przed attackerIsCityState.
   */
  attackerIsBarbarian?: boolean;
  /** Jw. dla broniacego. */
  defenderIsBarbarian?: boolean;
  /** Etykieta składu atakującego (np. Skład (2) / Wojownik). */
  attackerSideLabel?: string;
  /** Etykieta składu broniącego. */
  defenderSideLabel?: string;
  /** Głód wojska atakującego (zapasy < 0 po koszcie armii). */
  attackerArmyHungry?: boolean;
  /** Głód wojska broniącego. */
  defenderArmyHungry?: boolean;
  /** Mnożnik statów bojowych przy głodzie wojska (domyślnie 0.75). */
  armyHungerStatMult?: number;
  /** Deficyt Złota atakującego (Skarbiec < 0 po zbankowaniu tury, gold-deficit.ts). */
  attackerGoldDeficit?: boolean;
  /** Deficyt Złota broniącego. */
  defenderGoldDeficit?: boolean;
  /** Mnożnik statów bojowych przy deficycie Złota (domyślnie 0.75). */
  goldDeficitStatMult?: number;
  /** P-AI-MOC-BONUS=A: bonus trudności walki atakującego (major AI). */
  attackerDifficultyCombatMult?: number;
  /** P-AI-MOC-BONUS=A: bonus trudności walki broniącego (major AI). */
  defenderDifficultyCombatMult?: number;
}

export interface BattleResult {
  winner: 'atakujacy' | 'obronca' | 'remis';
  survivors: BattleUnit[];
  log: string[];
}

// ---------------------------------------------------------------------------
// DEBUG: ?bt=<preset> query param forces a battle-terrain preset regardless of
// opts.worldTerrain -- for playtest/screenshot use only. Absent param = zero
// behaviour change. Each maps to a synthetic WorldTerrainInput; 'las'/'rzeka'
// demo the two OVERLAYS (forest / river) on a neutral 'rownina' base since
// those are hex NAKLADKA flags, not a TerenBazowy of their own.
// ---------------------------------------------------------------------------
const BT_DEBUG_PRESETS: Record<string, WorldTerrainInput> = {
  laka:     { baza: 'laka' },
  rownina:  { baza: 'rownina' },
  wzgorza:  { baza: 'wzgorza' },
  gory:     { baza: 'gory' },
  pustynia: { baza: 'pustynia' },
  wybrzeze: { baza: 'wybrzeze' },
  las:      { baza: 'rownina', las: true },
  rzeka:    { baza: 'rownina', rzeka: true },
};

/** Reads `?bt=...` from the page URL, if any. Never throws (SSR/test safety). */
function debugWorldTerrainOverride(): WorldTerrainInput | undefined {
  try {
    if (typeof window === 'undefined' || !window.location) return undefined;
    const bt = new URLSearchParams(window.location.search).get('bt');
    if (!bt) return undefined;
    return BT_DEBUG_PRESETS[bt.trim().toLowerCase()];
  } catch {
    return undefined;
  }
}

/** Kopia armii startowej do „Rozegraj ponownie” (pelne HP). */
function cloneBattleUnitsForReplay(units: BattleUnit[]): BattleUnit[] {
  return units.map(u => ({
    ...u,
    hp: u.maxHp,
    stats: u.stats ? { ...(u.stats as Record<string, unknown>) } : u.stats,
  }));
}

// ---------------------------------------------------------------------------
// Battlefield layout constants (SQUARE grid)
// ---------------------------------------------------------------------------

// BIG-BATTLE square battlefield (B9): sized for two 60-unit armies that deploy
// in EVEN ranks and clash FAST (front lines <= ~5 tiles apart).
//   - Z (rows) is the RANK axis: tall enough to hold a straight line of up to
//     ~20 figures plus a top/bottom terrain margin.
//   - X (columns) is the clash axis: wide enough for each side's THREE ranks +
//     a no-man's-land thick enough to hold a dense terrain belt, while the
//     fronts still start only FRONT_GAP tiles apart so melee is reached fast.
// The procedural terrain (rivers / forest / hills / rocks) is generated DENSELY
// across the whole field; battleScene then only LIGHTLY clears the exact tiles
// the ranks occupy and guarantees a passable clash corridor across the river
// (see _carveBattleBox), so the lines stand on flat passable ground and can
// reach each other, while terrain survives EVERYWHERE else as obstacles/scenery.
const BF_COLS = 68;   // pełne pole (2× poprzednie 34) — margines do przewijania kamery
const BF_ROWS = 156;  // pełne pole (2× poprzednie 78)

/** Strefa gry: ~50% powierzchni kafelków, wyśrodkowana (rozstaw + walka). */
const PLAYABLE_COLS = Math.round(BF_COLS * Math.SQRT1_2);
const PLAYABLE_ROWS = Math.round(BF_ROWS * Math.SQRT1_2);
const PLAY_COL0 = Math.floor((BF_COLS - PLAYABLE_COLS) / 2);
const PLAY_ROW0 = Math.floor((BF_ROWS - PLAYABLE_ROWS) / 2);
const PLAY_COL1 = PLAY_COL0 + PLAYABLE_COLS - 1;
const PLAY_ROW1 = PLAY_ROW0 + PLAYABLE_ROWS - 1;
const PLAY_MID_COL = PLAY_COL0 + Math.floor((PLAYABLE_COLS - 1) / 2);
const PLAY_MID_ROW = PLAY_ROW0 + Math.floor((PLAYABLE_ROWS - 1) / 2);

function inPlayable(col: number, row: number): boolean {
  return col >= PLAY_COL0 && col <= PLAY_COL1 && row >= PLAY_ROW0 && row <= PLAY_ROW1;
}

function clampPlayCol(c: number): number {
  return Math.max(PLAY_COL0, Math.min(PLAY_COL1, c));
}

function clampPlayRow(r: number): number {
  return Math.max(PLAY_ROW0, Math.min(PLAY_ROW1, r));
}

// --- HUD theme 1E (Design C — Ty niebieski / wróg czerwony) ---
const HUD_BG         = BATTLE_HUD_BG;
const HUD_GOLD       = BATTLE_GOLD;
const HUD_GOLD_DIM   = BATTLE_GOLD_DIM;
const HUD_TEXT       = BATTLE_TEXT;
const HUD_TEXT_DIM   = BATTLE_TEXT_DIM;
const HUD_FONT       = BATTLE_FONT;
/** Gracz (Ty) atakuje w typowym flow — kolory z DECYZJA-C-kolory-stron-bitwa.md */
const HOVER_TOOLTIP_MS = 300;

/** C2-Q7 TW: kontekstowe kursory (luk / miecz) — SVG data-URL. */
const CURSOR_BOW =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="none" stroke="#e8d88a" stroke-width="2" d="M4 20c5-8 5-12 0-16"/><path fill="#e8d88a" d="M14 8l6-2-2 6z"/></svg>',
  ) +
  '") 4 20, crosshair';
const CURSOR_SWORD =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="#e8d88a" d="M11 2h2v14h-2z"/><path fill="#c84040" d="M9 16h6v2H9z"/></svg>',
  ) +
  '") 12 4, crosshair';
const CURSOR_MOVE = 'crosshair';
const CURSOR_DEFAULT = 'default';
const ORDER_LINE_Y = 0.12;
const ORDER_COLOR_MOVE = 0x3080ff;
const ORDER_COLOR_ATTACK = 0xe04040;
const ORDER_MOVE_OPACITY = 0.30;
const ORDER_ATTACK_OPACITY = 0.45;

// Up to this many units deploy per side. maciej_playtest (POLE-BITWY) fields 110
// per side (60 infantry + 30 archers + 20 cavalry). Headroom 120 so nothing
// is sliced before deployment.
const MAX_PER_SIDE = 120;

// How many figures stand shoulder-to-shoulder in ONE rank (a straight line).
// 60 units => 3 even ranks of 20. Keep <= BF_ROWS minus a small margin so a
// full rank fits centred on the field.
const RANK_WIDTH = 20;

// How many ranks deep one full side can be (ceil(MAX_PER_SIDE / RANK_WIDTH)).
// Drives the rank-clearing band width and the rear-rank column budget.
const MAX_RANKS = Math.ceil(MAX_PER_SIDE / RANK_WIDTH); // 4 for 64 / 20

// Outer columns kept as clean plains by the terrain generator. Small value so
// the rivers / forest / hills generate across nearly the whole field; the rank
// band is cleared separately by _carveBattleBox.
const DEPLOY_MARGIN = 4;

// Tile size in world units. Tiles are flat slabs of side TILE_S placed so they
// TOUCH (cell centre = col*TILE_S, row*TILE_S). 1.0 matches the unit models'
// internal scale (buildUnitModel is sized around 1.0), so figures sit nicely on
// the squares.
const TILE_S = 1.0;

// Front-deployment columns. Both fronts sit close to the field CENTRE so the
// two armies start only a few tiles apart and reach melee quickly; rear ranks
// step OUTWARD toward each side's own edge. FRONT_GAP is the column distance
// between the two front lines (their Manhattan distance on a shared row), kept
// <= 5 per the spec so melee is reached fast. Attacker front faces E (+X),
// defender front faces W (-X).
const FRONT_GAP = 5;                                       // <= 5: tiles between the two fronts (a terrain belt + river sit in this no-man's-land)
const ATK_FRONT_COL = PLAY_COL0 + Math.floor((PLAYABLE_COLS - FRONT_GAP) / 2);
const DEF_FRONT_COL = ATK_FRONT_COL + FRONT_GAP;
const ATK_COL_STEP  = -1;           // attacker rear ranks step LEFT (toward -X edge)
const DEF_COL_STEP  = 1;            // defender rear ranks step RIGHT (toward +X edge)

/**
 * How many rank columns deep _carveBattleBox clears to Plains on each side.
 *
 * LEGACY (presetActive=false, i.e. no worldTerrain / no ?bt= override): the
 * exact pre-existing formula, UNTOUCHED -- verified bit-for-bit against the
 * pre-2026-07-22 generator (3 seeds). Sized generously (MAX_RANKS+12) so even
 * a fully-mounted MAX_PER_SIDE army (mounted deploy the deepest, see
 * arrangeFlankCavalry/_placeUnits) always lands on clean ground.
 *
 * PRESET-ACTIVE: owner correction 2026-07-22 #3 ("odblokuj teren poza
 * prostymi pasami") -- the legacy depth wipes 36 of the 48 playable columns
 * to Plains on EVERY row, leaving only three narrow 4-column bands for the
 * generator's terrain to ever be visible in, which is what forced hills/river
 * into straight rectangular-looking bars. Preset battles use a tighter depth
 * (still comfortably deeper than MAX_RANKS=6 and the real per-side rank
 * count) that keeps the actual deployment columns clean while giving the
 * meandering river/hill generation roughly DOUBLE the surviving interior
 * width to occupy. The BFS connectivity guard in _carveBattleBox (unchanged)
 * remains the hard safety net for the attacker/defender crossing regardless
 * of this number, and _placeUnits' own scoring-based placement loop already
 * tolerates a Hills/Forest/Rocks tile under a unit (only River/Wall/Gate are
 * impassable) -- so shrinking this is a rendering/variety change only, not a
 * gameplay-safety one.
 */
function deployClearRanksFor(presetActive: boolean): number {
  return presetActive
    ? Math.max(MAX_RANKS + 4, Math.ceil(MAX_PER_SIDE / 12) + 3)
    : Math.max(MAX_RANKS + 12, Math.ceil(MAX_PER_SIDE / 12) + 8);
}

/**
 * Column ranges that survive _carveBattleBox's deployment-rank clearing (see
 * that method): it unconditionally wipes columns
 * [ATK_FRONT_COL .. ATK_FRONT_COL+(DEPLOY_CLEAR_RANKS-1)*ATK_COL_STEP] and
 * [DEF_FRONT_COL .. DEF_FRONT_COL+(DEPLOY_CLEAR_RANKS-1)*DEF_COL_STEP] back to
 * Plains for EVERY playable row, regardless of what the generator drew there
 * -- so it applies equally to every preset (this is pre-existing behaviour,
 * not something the world-terrain presets introduced). `presetActive` MUST
 * match the value _carveBattleBox will use for the same battle (see
 * deployClearRanksFor) so this stays in sync with what actually survives.
 * Passed to generateBattleTerrain as `safeCols`, consulted only by
 * `preset.edgeRocks` (flank rock concentration) since the 2026-07-22 #3
 * meander correction -- hills and the wide river no longer read it (see
 * battle-terrain.ts). Computed independently of _carveBattleBox's own
 * Set<number> (duplicated formula, verified to match exactly) so this stays
 * a pure, side-effect-free query callable before generation runs.
 */
function battleSafeCols(presetActive: boolean): Array<[number, number]> {
  const deployClearRanks = deployClearRanksFor(presetActive);
  const atkRankEnd = ATK_FRONT_COL + (deployClearRanks - 1) * ATK_COL_STEP;
  const defRankEnd = DEF_FRONT_COL + (deployClearRanks - 1) * DEF_COL_STEP;
  const atkLo = Math.min(ATK_FRONT_COL, atkRankEnd);
  const atkHi = Math.max(ATK_FRONT_COL, atkRankEnd);
  const defLo = Math.min(DEF_FRONT_COL, defRankEnd);
  const defHi = Math.max(DEF_FRONT_COL, defRankEnd);
  const ranges: Array<[number, number]> = [
    [PLAY_COL0, atkLo - 1],
    [atkHi + 1, defLo - 1],
    [defHi + 1, PLAY_COL1],
  ];
  return ranges.filter(([lo, hi]) => hi >= lo);
}

// Faza rozstawiania: lewa połowa STREFY GRY = ATK, prawa = DEF (mgła wojny).
const DEPLOY_MID_COL       = PLAY_MID_COL;
const DEPLOY_MAX_COL       = DEPLOY_MID_COL - 1;
const DEPLOY_MIN_COL       = PLAY_COL0;
const DEPLOY_ATK_FRONT_COL = DEPLOY_MAX_COL - 2;
const DEPLOY_ATK_COL_STEP  = -1;
const DEPLOY_MIN_ROW       = PLAY_ROW0;
const DEPLOY_MAX_ROW       = PLAY_ROW1;
/** Margines od prawej krawedzi strefy ATK (hexy). */
const DEPLOY_EDGE_MARGIN   = 2;
/** Wysokosc paska formacji / akcji deploy (min. — rosnie z chipami). */
const DEPLOY_TOOLBAR_H         = 64;
/** Odstep paska od dolnej krawedzi ekranu (~2 mm). */
const DEPLOY_TOOLBAR_BOTTOM_GAP = 8;
/** Belka wyboru grupy nad toolbarem deploy. */
const DEPLOY_GROUP_RAIL_H      = 44;
/** Odstep belki grup od toolbara. */
const DEPLOY_GROUP_RAIL_GAP    = 4;
/** Laczna rezerwa UI na dole: pasek + odstep (roster, prawy rail). */
const DEPLOY_TOOLBAR_RESERVE   = DEPLOY_TOOLBAR_H + DEPLOY_TOOLBAR_BOTTOM_GAP;
/** Rezerwa dolna gdy widoczna belka grup + toolbar. */
const DEPLOY_GROUP_RAIL_RESERVE = DEPLOY_TOOLBAR_RESERVE + DEPLOY_GROUP_RAIL_H + DEPLOY_GROUP_RAIL_GAP;
/** Odstęp rosteru od dolnej krawędzi ekranu (toolbar + opcj. belka grup). */
const ROSTER_SCREEN_BOTTOM_GAP = 16;
/** Wysokosc dolnego paska GRUPY w walce recznej. */
const BATTLE_GROUP_BAR_H   = 52;
/** Dolny pasek mocy armii (zielony/czerwony) — pod paskiem fazy/statystyk. */
const DEPLOY_POWER_BAR_H   = 38;
/** Wysokosc gornego paska HUD (faza / straty / sklad armii). */
const BATTLE_TOP_BAR_H     = 68;
/** Laczna wysokosc naglowka: pasek fazy + pasek mocy. */
const BATTLE_HEADER_H      = BATTLE_TOP_BAR_H + DEPLOY_POWER_BAR_H;
/** Szerokosc kolumny kart w lewym panelu (tab + karta + odstep). */
const ROSTER_COL_W         = ROSTER_PANEL_FIXED_W;
/**
 * Wysokość karty rosteru deploy — lewy panel pionowy.
 *
 * BŁĄD H (właściciel, 2026-07-24): pasek mocy/HP zasłaniał nazwę jednostki
 * ("Oszczepnik"/"Wojownik" częściowo ucięte). Przyczyna: budżet wysokości
 * treści karty (_createUnitCard, ~linia 16386) NIE mieścił się w 56px —
 * padding 5+4 + ikona 26 + gap 3 + etykieta nazwy (~9-10, font 7px) + gap 3 +
 * pasek HP 4 + gap 3 + pasek morale 4 = ~61-62px, czyli o ~5-6px za dużo.
 * Bez jawnego flexShrink na dzieciach (dodany niżej), flexbox w kolumnie
 * ściskał elementy nierówno, a jednoliniowy tekst nazwy (white-space:nowrap)
 * wizualnie nachodził na sąsiedni pasek. 56 -> 64 daje realny zapas.
 */
const DEPLOY_ROSTER_CARD_H = 64;
const BATTLE_ROSTER_CARD_H = 64;
/** Wersja UI bitwy polowej — widoczna w panelu (weryfikacja buildu). */
const BATTLE_UI_BUILD      = 'POLE-BITWY-20260705-end-replay';
/** TW v5 §3: szerokosc panelu "Tempo + minimapa" (mockup 236px; minimapa
 * canvas 180×MINIMAP_H rozciaga sie na cala szerokosc — patrz _buildMinimapOverlay). */
const TEMPO_PANEL_W = 236;

/**
 * ikonaId z civs.json po nazwie wyswietlanej lub ikonaId.
 *
 * BŁĄD D (właściciel, 2026-07-24): `civRows` (opts.data.cywilizacje) NIE jest
 * nigdy wypełniane przez żadnego wołającego (main.ts/mapFieldBattle.ts) —
 * pętla poniżej więc nigdy nie dopasowuje nic, a stary fallback rozpoznawał
 * WYŁĄCZNIE Rzym ('rzym') i Grecję ('grec') substringiem, więc wszystkie
 * pozostałe 13 z 15 cywilizacji spadały na 'grecy' (portret + władca "Minos"
 * po OBU stronach bitwy, niezależnie od realnej cywilizacji). Naprawa: zanim
 * spadniemy na sztywny 'grecy', spróbuj civIconIdFromCivLabel() —
 * pełnowartościowe dopasowanie po WSZYSTKICH 15 cywilizacjach z civs.json
 * (leaderPortraits.ts, ta sama tabela co portrety/wodzowie), zarówno dla
 * czystej etykiety (player.civType = ikonaId) jak i złożonej etykiety
 * miasta-państwa ("Teby · Egipt · miasto-państwo").
 */
function civIconIdFromLabel(civRows: readonly { Cywilizacja?: string; ikonaId?: string }[], label: string): string {
  const key = String(label ?? '').trim().toLowerCase();
  if (!key) return 'grecy';
  for (const c of civRows) {
    if (String(c.Cywilizacja ?? '').trim().toLowerCase() === key) return c.ikonaId ?? 'grecy';
    if (String(c.ikonaId ?? '').trim().toLowerCase() === key) return c.ikonaId ?? 'grecy';
  }
  const resolved = civIconIdFromCivLabel(label);
  if (resolved) return resolved;
  if (key.includes('rzym')) return 'rzymianie';
  if (key.includes('grec')) return 'grecy';
  return 'grecy';
}

/** Normalizuje era (attackerEra/defenderEra z BattleOpts) do 1..3, brak/nieprawidlowe -> 1 (kamien). */
function clampEra(era: number | undefined): number {
  if (era === undefined || !Number.isFinite(era)) return 1;
  return Math.max(1, Math.min(3, Math.round(era)));
}

/** Kotwica centrum formacji deploy — front (dc=-2) laduje przy prawej krawedzi z marginesem. */
function deployFormationCentCol(): number {
  return DEPLOY_MAX_COL - DEPLOY_EDGE_MARGIN - 2;
}

function inDeployAtkZone(col: number, row: number): boolean {
  return col >= DEPLOY_MIN_COL && col <= DEPLOY_MAX_COL
    && row >= DEPLOY_MIN_ROW && row <= DEPLOY_MAX_ROW;
}

const DEPLOY_DEF_MIN_COL = DEPLOY_MID_COL + 1;
const DEPLOY_DEF_MAX_COL = PLAY_COL1;
/** Kotwica frontu obrońcy w deploy — przy lewej krawędzi prawej połowy (jak ATK po drugiej stronie). */
const DEPLOY_DEF_FRONT_COL = DEPLOY_DEF_MIN_COL + 2;
const DEPLOY_DEF_COL_STEP  = 1;

function inDeployDefZone(col: number, row: number): boolean {
  return col >= DEPLOY_DEF_MIN_COL && col <= DEPLOY_DEF_MAX_COL
    && row >= DEPLOY_MIN_ROW && row <= DEPLOY_MAX_ROW;
}

const DEFAULT_BATTLE_MOVE  = 2;   // fallback "Ruch w bitwie" when missing/0
const DEFAULT_RANGED_REACH = 2;   // reach for a shooter whose "Zasieg ataku (hex)" is missing

// CHANGE C (ranged KITE): the minimum gap a shooter wants to keep between itself
// and the NEAREST enemy. If an enemy closes to within this many tiles the shooter
// retreats (kites) to restore distance while STAYING within its own range, so it
// keeps shooting instead of being dragged into the melee scrum. 2 => a shooter
// flees the instant an enemy is ADJACENT (dist 1), aiming to stand at dist >= 2.
// It never tries to exceed its range when kiting (a range-2 Oszczepnik kites from
// dist 1 back to exactly dist 2, where it can still shoot next turn).
const RANGED_MIN_GAP = 2;

// SKIRMISH REFINE: the minimum gap a PRIMARY-ranged unit (archer/slinger/
// javelineer) must keep from an enemy OFFENSIVE (melee) unit -- i.e. any enemy
// that is NOT itself primary-ranged and therefore closes to fight. This rule
// takes PRECEDENCE over shooting: if a melee enemy is within MELEE_SAFE_GAP
// (Manhattan), the shooter KITES toward its own rear to restore the gap even if
// that means skipping the shot this turn. >=2 means it backs off the instant a
// melee foe is adjacent (dist 1), aiming to stand at dist >= 2 from it. It does
// NOT apply to enemy ranged units (those are safe to stand near and shoot).
const MELEE_SAFE_GAP = 2;

const TILE_H = 0.10;  // tile slab thickness; top face at y = 0
const UNIT_Y = 0;     // units stand on the top face

// ---------------------------------------------------------------------------
// C-BTL-BROD-Q1 (wariant C): ford (BTerrain.Ford) tactical mechanic constants.
// Source of truth: data/combat-params.json "brod". A unit that is FIGHTING
// while standing on a Ford tile is slowed (ruchMult) and weakened in combat
// (karaAtak/karaObrona); a unit defending on dry ground next to a Ford, when
// its attacker is wading in that Ford, gets a shore bonus (bonusObronaBrzegu).
// Battles with zero Ford tiles (no river preset) never hit these branches --
// legacy behaviour is bit-for-bit unchanged.
// ---------------------------------------------------------------------------
const BROD = combatParamsData.brod;
const BROD_RUCH_MULT   = BROD.ruchMult;             // 0.5 -> half speed while wading a ford
const BROD_KARA_ATAK   = BROD.karaAtak;              // 0.25 -> -25% Atak while fighting in a ford
const BROD_KARA_OBRONA = BROD.karaObrona;            // 0.25 -> -25% Obrona while fighting in a ford
const BROD_BONUS_BRZEG = BROD.bonusObronaBrzegu;     // 0.15 -> +15% Obrona defending the shore vs a ford attacker
// C-FORT-POLE-Q1 (Maciej 2026-07-26, korekta 2026-07-28): +50% Obrony
// (fortify_obrona_proc) dla BattleUnit.fortifiedInField (RuntimeUnit.
// ufortyfikowanyWPolu). Garnizon w oblężeniu nadal używa fortify_obrona_bonus
// (flat +2) w siege.ts -- NIE ten parametr. Applied via
// fieldFortifyDefenseBonus (game/city-defense.ts) -- parity across _singleBlow,
// computeInstantResult, main.ts effectiveDefenderM.
const FORTIFY_OBRONA_PROC_FIELD: number = combatParamsData['oblężenie'].fortify_obrona_proc;
// Small tie-breaking penalty added to the cavalry tile-scoring functions below
// (the only existing "score a candidate tile" AI logic in this file) so a
// rider prefers a same-progress dry tile over stopping to fight IN a ford.
// Not a rebuild of the AI -- just one extra term in an existing score formula.
const FORD_AI_AVOID_PENALTY = 3;

// ---------------------------------------------------------------------------
// Combat animation constants
// ---------------------------------------------------------------------------

// NOTE: combat is strictly turn-by-turn. There is NO per-pair "duel to the
// death" loop -- every living unit takes exactly ONE action per turn and a
// melee blow is a single lunge whose counter lands on the target's OWN later
// turn.

// Movement / ranged timings.
const MOVE_STEP_MS    = 240;   // time to walk one tile
const STEP_GAP_MS     = 70;    // tiny pause between consecutive tile steps
const RANGED_FLY_MS   = 380;   // projectile flight time
const RANGED_GAP_MS   = 320;   // pause after a ranged shot resolves
const ACT_GAP_MS      = 160;   // pause between two units activating (light stagger)
const DEATH_FADE_MS   = 500;

// Turn-by-turn single-blow pacing.
// Each TURN every living unit takes exactly ONE action (one move OR one blow).
// A melee blow is a single quick lunge; the target counters on ITS OWN later turn.
const BLOW_LUNGE_MS   = 260;   // attacker lunges in then snaps back (one blow)
const BLOW_HIT_T      = 150;   // moment within the lunge the blow connects
const BLOW_SETTLE_MS  = 220;   // brief settle after a blow before the next unit acts
const TURN_GAP_MS     = 240;   // short breather between full turns

// CHANGE2: the over-head stat bars were too big and obscured the figures.
//   - LENGTH (width along the bar) cut to 40% of the previous 0.80 => 0.32.
//   - THICKNESS (height) made 3x thinner: previous 0.08 / 3 => ~0.0267, so the
//     bars read as delicate slim lines. Both are single constants reused by the
//     fg scaling/anchoring and the vertical stacking (BAR_GAP_Y), so the three
//     stacked bars stay proportional and the green->red / ammo behaviour is
//     untouched -- only their size shrank.
const HPBAR_W = 0.32;          // 40% of the previous 0.80 length
const HPBAR_H = 0.08 / 3;      // 3x thinner than the previous 0.08 thickness
// CHANGE B: the over-head bars floated far too high (1.05 above the tile top --
// nearly double the ~0.55-0.65 model height), so near another figure they read
// as if they belonged to the NEIGHBOUR. Lower the whole stack so its BOTTOM (the
// HP bar, at the group origin) sits JUST above THIS unit's own head. The buildUnitModel
// avatars are ~0.55 tall with the tallest crest reaching ~0.62-0.65 (units.ts), so
// 0.72 clears the head/crest by a hair while keeping the bars unmistakably tied to
// this figure. Billboarding-to-camera and the per-frame Y-follow on terrain/hills
// are unchanged (the hpBarGroup is still re-positioned at tileTop + HPBAR_Y every
// move/flee frame), and the 40%-length / thin-bar sizing (HPBAR_W / HPBAR_H) is kept.
const HPBAR_Y = 0.72;

// ---------------------------------------------------------------------------
// Three stacked over-head bars (camera-billboarded, follow the unit's Y incl.
// the hill-raised standing height). From TOP to BOTTOM (task B reorder):
//   AMMO   (top)  -- BLUE, only for ranged units with ammo capacity; width =
//                    ammoLeft/ammoMax; when empty it reads as an EMPTY BLACK box
//                    (the bg stays a true-black plane so the faction frame does
//                    NOT bleed through and look like a filled bar).
//   MORALE (mid)  -- green->red gradient by current morale fraction (right above HP).
//   HP     (bot)  -- the existing green health bar at the group origin (y=0).
// All three share one billboard group anchored at HPBAR_Y above the unit; the
// HP bar sits at the group origin (y=0) and the other two stack above it.
// ---------------------------------------------------------------------------
const BAR_GAP_Y   = HPBAR_H * 1.35;     // vertical spacing between stacked bars
const MORALEBAR_Y = BAR_GAP_Y;          // morale bar right above HP (middle)
const AMMOBAR_Y   = BAR_GAP_Y * 2;      // ammo bar topmost
const AMMOBAR_COLOR = 0x2f7adf;         // BLUE ammo bar

// ---------------------------------------------------------------------------
// FACTION-COLOUR OUTLINE on the over-head bar stack.
//
// Units carry no per-faction art, so the only on-figure cue to which SIDE a
// unit belongs is a THIN coloured FRAME drawn behind its bar stack. The frame
// is a single slightly-larger quad in the side's colour placed just BEHIND the
// three bars (more negative local Z), so a hair of the colour shows as a delicate
// border around the slim bars. It lives INSIDE the billboard hpBarGroup, so it
// billboards to the camera and follows the unit's Y (terrain/hill) for free --
// exactly like the bars.
//
// Identity colours are intentionally independent from combat role. The player
// remains blue and the opponent remains red even when the player defends.
const SIDE_COLOR_BY_IDENTITY = {
  player: 0x1e88e5,
  enemy: 0xe53935,
} as const;
/** Role -> visual colour, resolved through the side controlled by the player. */
function sideColor(side: 'atk' | 'def', playerSide: 'atk' | 'def' = 'atk'): number {
  return side === playerSide ? SIDE_COLOR_BY_IDENTITY.player : SIDE_COLOR_BY_IDENTITY.enemy;
}
// The coloured frame extends this far (world units) beyond the bar cluster on
// every edge, so only a thin rim of colour is visible around the slim bars.
const BAR_OUTLINE_PAD = HPBAR_H * 0.5;
// Frame sits this far BEHIND the bar backgrounds (more negative local Z) so the
// bars always render in front of their coloured rim.
const BAR_OUTLINE_Z   = -0.004;

// ---------------------------------------------------------------------------
// BATTLE LOG -- how many of the most recent clashes the on-screen panel keeps
// (newest first). At high battle speed many blows resolve per frame; the buffer
// is still hard-capped to this many entries so the panel stays small + readable.
// ---------------------------------------------------------------------------
const CLASH_LOG_MAX = 10;
/** Human side tag shown in the battle-log panel for a unit's side. */
function sideTag(side: 'atk' | 'def'): string {
  return side === 'atk' ? 'atak' : 'obr';
}

// ---------------------------------------------------------------------------
// MORALE + ROUT model (scene-side bookkeeping; resolveCombat untouched).
//
// units.json has no explicit "Morale" stat (its keys are Atak/Obrona/Health/
// "Prog dezercji (% health)"/...), and the codebase convention (src/types/unit.ts)
// is: morale is a 0..100 pool referenced to max Health, and a unit ROUTS when it
// breaks. We therefore start every unit at MORALE_START (full) and lower the
// CURRENT pool as it takes damage and as nearby allies die; when it drops below
// ROUT_MORALE_THRESHOLD of its start the unit routs (flees + counts as OUT).
//
// NEVER-ROUT (elite / "walczy do smierci"): the data marks fight-to-the-death
// units two ways -- a null/blank "Prog dezercji (% health)" (siege.ts: "null =>
// never routs from morale, fights to 0 HP") and an Uwagi note containing
// "walczy do smierci" / "niezlomny". Such units ignore morale rout entirely and
// fight down to 0 HP (matching the human's "units fight to ~0 HP" expectation
// for those that shouldn't break).
// ---------------------------------------------------------------------------
const MORALE_START          = 100;   // every unit starts at full morale
// Morale lost by the victim of a blow, scaled by how big the blow was relative
// to its max HP (a hit that takes 50% HP shakes morale a lot; a scratch little).
const MORALE_HIT_LOSS_SCALE = 100;   // moraleLost = (dmg/maxHp)*100 -- loss off a FIXED 100 (not base): 10% HP lost => -10 morale for everyone (Naster)
// Flat morale hit to nearby SURVIVING allies when a friendly unit dies/routs
// (a "shaken by losses" ripple), within MORALE_DEATH_RADIUS tiles.
const MORALE_ALLY_DEATH_LOSS = 12;
const STALL_TURN_LIMIT = 6;   // tury bez zmiany HP/morale/strat -> rozstrzygnij bitwe (anty-pat)
const MORALE_DEATH_RADIUS    = 3;    // Manhattan tiles within which allies are shaken

// ---------------------------------------------------------------------------
// BATTLE MORALE MODIFIERS (Naster) -- a full set of tunable morale factors,
// all wired around the EXISTING morale model (per-unit morale/moraleMax/
// fleeMorale/neverRout). All values are flat morale points unless noted. GAINS
// clamp to [0, moraleMax]; LOSSES clamp to >=0. "once" effects use per-unit flags.
// ---------------------------------------------------------------------------
const MORALE_FLANK_HIT          = 8;    // extra morale loss to a defender hit in the FLANK
const MORALE_REAR_HIT           = 15;   // extra morale loss to a defender hit in the REAR
const MORALE_CHARGE_HIT         = 15;   // extra morale loss when a MOUNTED attacker's CHARGE blow lands
const MORALE_KILL_GAIN          = 6;    // attacker GAINS morale when its blow kills/routs the defender
const MORALE_ENEMY_BREAK_GAIN   = 5;    // nearby ENEMIES of a fallen/routed unit GAIN morale
const MORALE_SURROUND_HIT       = 10;   // ONCE-per-unit loss when >=3 enemies are adjacent (surrounded)
const MORALE_TERRAIN_RESIST     = 5;    // defensive terrain (hill/forest) lowers the effective flee threshold (holds longer)
const MORALE_ARMY_COLLAPSE_RATIO= 0.40; // if a side's army-morale ratio < this, HP-based morale loss is amplified
const MORALE_ARMY_COLLAPSE_MULT = 1.3;  // multiplier on HP-based morale loss for a collapsing army
const MORALE_GENERAL_AURA       = 0;    // PLACEHOLDER: future +morale aura when a general/leader is nearby (not wired)
const MORALE_GATE_BREACH        = 5;    // wyłom BRAMY: -morale wszystkim obrońcom (jednorazowy)
const MORALE_WALL_BREACH        = 0;    // wyłom MURU (kafel): -morale 0 (per-kafel compounding wyłączone)

// ARMY MORALE (TASK 3) -- a whole side's collective morale ratio:
//   sum(current morale of ALL that side's units) / sum(starting morale of ALL
//   units that side EVER fielded), where DEAD and ROUTED units contribute 0 to
//   the numerator but KEEP their starting morale in the denominator. When a
//   side's ratio falls below ARMY_MORALE_LOSS_THRESHOLD the side LOSES the
//   battle (collective collapse) even if some units still stand. Recomputed each
//   turn / after every loss via _armyMoraleRatio.
const ARMY_MORALE_LOSS_THRESHOLD = 0.25;
// OUT-OF-AMMO FALL-BACK distance (TASK 4): a dry PRIMARY shooter retreats only
// this many tiles toward its own rear, then HOLDS (avoids combat unless an enemy
// reaches it adjacent). It does NOT run to the board edge.
const FALLBACK_TILES = 3;
// PHALANX LINE TOLERANCE (RULE 2 / anti-freeze): how many tiles a phalanx may
// stand AHEAD of the line's laggard before it must pause to let the line catch
// up. >0 means the front does NOT freeze the instant it is one tile ahead -- the
// whole line keeps STEPPING FORWARD together as a thick band, and a unit only
// holds when it is already this far past the slowest phalanx (so a terrain-stuck
// straggler reins the line in without making the front stand idle forever).
const PHALANX_LEAD_TOLERANCE = 2;

// ---------------------------------------------------------------------------
// Terrain floor colours
// ---------------------------------------------------------------------------

const TERRAIN_COLORS: Record<string, number> = {
  laka:     0x5a8a3a,
  rownina:  0x7daa52,
  wzgorza:  0xa08850,
  gory:     0x8a8880,
  pustynia: 0xc8a862,
  wybrzeze: 0xd8c880,
  morze:    0x3068a0,
  las:      0x2e6830,
};

function terrainFloorColor(teren: string): number {
  const key = teren
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
  for (const [k, v] of Object.entries(TERRAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 0x6a9448;
}

// ---------------------------------------------------------------------------
// Per-tile terrain colours + low-poly decoration palette (B8).
// Colours imitate the world-map look in render/scene.ts (per-tile ground tint,
// cone tree clusters for forest, raised grass bumps for hills, a blue river
// strip) so the battlefield reads in the same low-poly style.
// ---------------------------------------------------------------------------

const BT_FLOOR_COLOR: Record<number, number> = {
  [BTerrain.Plains]: 0x6fa84a, // open grass (scene.ts Laka)
  [BTerrain.Forest]: 0x3a6b34, // shaded forest floor
  [BTerrain.Hills]:  0x4a7838, // hill grass (scene.ts Wzgorza)
  [BTerrain.River]:  0x3a86b5, // river water (scene.ts RIVER_COLOR)
  [BTerrain.Ford]:   0x6a93a8, // shallow ford -- paler water over a gravel bed
  [BTerrain.Rocks]:  0x8a8680, // rocky ground
  [BTerrain.Wall]:   0x9a9080, // wall base tile -- stone/earth color
  [BTerrain.Gate]:   0x7a6a50, // gate tile -- dark arch floor
};

// PUSTYNIA preset palette: swapped in wholesale by _buildBattlefield when
// this._desertPalette is true (sand tiles, sand "dune" hills, warm rocks --
// forest never spawns on desert so no crown/trunk override is needed).
const BT_FLOOR_COLOR_DESERT: Record<number, number> = {
  [BTerrain.Plains]: 0xd7b877, // open sand
  [BTerrain.Forest]: 0x3a6b34, // unused (noForest), kept for completeness
  [BTerrain.Hills]:  0xc9a662, // dune sand (slightly darker/warmer than flat sand)
  [BTerrain.River]:  0x3a86b5, // unused (noForest preset also has riverMode 'none')
  [BTerrain.Ford]:   0x6a93a8, // unused
  [BTerrain.Rocks]:  0x9c8a63, // sandstone outcrop
  [BTerrain.Wall]:   0x9a9080,
  [BTerrain.Gate]:   0x7a6a50,
};

const FOREST_CONE_COLOR  = 0x2f6b34; // tree crown (scene.ts)
const FOREST_CONE_COLOR2 = 0x3d7a3a; // 2nd crown shade -- deterministic per-tree mix, avoids a flat forest
const FOREST_TRUNK_COLOR = 0x5b4327; // tree trunk (scene.ts)
const HILL_GRASS_COLOR   = 0x52823f; // raised grass bump (scene.ts)
const SHRUB_COLOR        = 0x356b2c; // hill shrub
const ROCK_COLOR         = 0x6f7a85; // low-poly rock (scene.ts PEAK_ROCK)
const RIVER_WATER_COLOR  = 0x3a86b5; // water plane

// PUSTYNIA variants of the hill/rock decoration colours above (dune + sandstone).
const HILL_GRASS_COLOR_DESERT = 0xcaa863; // dune sand bump
const SHRUB_COLOR_DESERT      = 0x8a6f3f; // dry scrub, not green
const ROCK_COLOR_DESERT       = 0x9c8a63; // sandstone

// Close-up ground detail (B10 "z bliska"): grass tufts + tiny clutter that only
// read when the camera is zoomed in on the units, per owner feedback.
const GRASS_TUFT_COLOR_A = 0x7ab84c; // grass blade -- lighter/fresher than the floor tile
const GRASS_TUFT_COLOR_B = 0x5c9a3c; // grass blade -- 2nd shade, darker mix
const PEBBLE_COLOR       = 0x8a8478; // tiny loose pebble (paler than the ROCK boulders)
const TINY_BUSH_COLOR    = 0x3f7a34; // small ground bush -- between grass and forest shade

// PUSTYNIA variants of the close-up ground detail above (dry, not green).
const GRASS_TUFT_COLOR_A_DESERT = 0xc9ae7a; // dry pale tuft
const GRASS_TUFT_COLOR_B_DESERT = 0xb08f55; // dry darker tuft

// Elevation lift (world units) applied to a hill tile's slab + its decorations.
const HILL_LIFT  = 0.18;
// Footprint radius of the raised grass dome (SphereGeometry) drawn on a hill
// tile. 2026-07-22 owner review ("wzgorza look like sparse dots from a
// distance"): widened from TILE_S*0.60 so neighbouring hill-tile domes
// visibly OVERLAP (diameter > the TILE_S tile spacing) and read as one
// continuous rolling ridge instead of isolated bumps -- purely a mesh-size
// change, does not touch tile generation/movement cost.
const HILL_BUMP_RADIUS = TILE_S * 0.78;
// The VISIBLE top (summit) of the raised grass dome drawn on a hill tile. The
// half-dome is a SphereGeometry(HILL_BUMP_RADIUS) placed at y=0 and scaled in Y
// to (HILL_LIFT + 0.16)/HILL_BUMP_RADIUS, so its apex sits at exactly
// HILL_LIFT+0.16. Units standing on a hill rest their feet here (see
// tileTopY). This single constant is reused by the bump's Y-scale so the
// walking surface and the drawn dome can never drift apart.
const HILL_SUMMIT_Y = HILL_LIFT + 0.16;
// River/ford tiles sit slightly LOWER so water reads as a sunken channel.
const RIVER_DROP = 0.08;

// ---------------------------------------------------------------------------
// SIEGE: low-poly city buildings behind the wall (defender interior).
// Same earthy/stone family as siegeWall.ts (grecja/rzym/sumer/egipt palette),
// jittered per-instance the same way the wall's segments/merlons are.
// ---------------------------------------------------------------------------
const SIEGE_BLDG_BODY_COLORS = [0xcdb896, 0xb8a179, 0xc7a97e, 0xa89272, 0xbfae8c];
const SIEGE_BLDG_ROOF_COLORS = [0x8b4a35, 0x6b3d2a, 0x9c6b3f, 0x7a4530];

/**
 * makeGableRoofGeometry — unit gable ("dach dwuspadowy") roof prism: base
 * rectangle at y=0 spanning x/z in [-0.5,0.5] (matches BoxGeometry(1,1,1)'s
 * footprint convention so body/roof share the same X/Z instance scale),
 * ridge line along X at y=1 (apex height = 1 before the per-instance Y
 * scale). No underside face (hidden inside the building body). 6 triangles.
 * Built ONCE and shared across every instance via InstancedMesh.
 */
function makeGableRoofGeometry(): THREE.BufferGeometry {
  const A: [number, number, number]  = [-0.5, 0, -0.5];
  const B: [number, number, number]  = [ 0.5, 0, -0.5];
  const C: [number, number, number]  = [ 0.5, 0,  0.5];
  const D: [number, number, number]  = [-0.5, 0,  0.5];
  const R0: [number, number, number] = [-0.5, 1,  0];
  const R1: [number, number, number] = [ 0.5, 1,  0];
  const verts: number[] = [];
  const tri = (p1: readonly number[], p2: readonly number[], p3: readonly number[]) => {
    verts.push(...p1, ...p2, ...p3);
  };
  tri(A, R1, B);  // front slope (part 1)
  tri(A, R0, R1); // front slope (part 2)
  tri(D, C, R0);  // back slope (part 1)
  tri(C, R1, R0); // back slope (part 2)
  tri(A, D, R0);  // left gable end
  tri(B, R1, C);  // right gable end
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// Stat helpers
// ---------------------------------------------------------------------------

function norm(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === '---' || v === '—' || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v as string) : (v as number);
  return isNaN(n) ? fallback : n;
}

/** Read a stat field tolerating both ASCII and accented JSON key spellings. */
function statField(s: Record<string, unknown>, asciiKey: string, accentKey?: string): unknown {
  if (s[asciiKey] !== undefined) return s[asciiKey];
  if (accentKey && s[accentKey] !== undefined) return s[accentKey];
  return undefined;
}

/**
 * Normalise counters.json rows for resolveCombat.
 *
 * The JSON ships the accented key "Typ atakujacy" (with diacritics) while
 * combat.ts's counterMultiplier reads the ASCII key "Typ atakujacy". This maps
 * the accented spelling onto the ASCII key and drops any row missing the
 * required fields, so the canonical resolver can never hit `undefined.toLowerCase()`.
 */
function normCounters(raw: any[]): any[] {
  if (!Array.isArray(raw)) return [];
  const out: any[] = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object') continue;
    const typA = c['Typ atakujacy'] ?? c['Typ atakujący'];
    const cel  = c['Cel (typ)'];
    if (typeof typA !== 'string' || typeof cel !== 'string') continue; // skip malformed
    out.push({
      'Typ atakujacy':        typA,
      'Cel (typ)':            cel,
      'Bonus':                c['Bonus'] ?? '',
      'Rodzaj (Atak/Obrona)': c['Rodzaj (Atak/Obrona)'] ?? '',
      'Status':               c['Status'] ?? '',
    });
  }
  return out;
}

function toCombatUnit(
  bu: BattleUnit,
  armyHungerStatMult = 0.75,
  skipHunger = false,
  goldDeficitStatMult = 0.75,
  skipGoldDeficit = false,
): CombatUnit {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const cu = combatUnitFromDef(s, {
    typNazwa: (s['Jednostka'] as string) ?? bu.kategoria,
    hp: bu.hp,
  });
  // TRZECI SYSTEM (weterani): jedyny wspolny punkt budowy CombatUnit w tym
  // pliku (animowana bitwa PLUS "pomin animacje" -- oba wolaja toCombatUnit),
  // wiec przeskalowanie tutaj pokrywa obie sciezki na raz. Patrz game/veteran.ts.
  let scaled = applyVeteranFracToCombatUnit(cu, bu.veteranBonusFrac ?? 0);
  if (bu.armyHungry && !skipHunger) {
    scaled = applyArmyHungerStatMultToCombatUnit(scaled, armyHungerStatMult);
  }
  if (bu.goldDeficit && !skipGoldDeficit) {
    scaled = applyGoldDeficitStatMultToCombatUnit(scaled, goldDeficitStatMult);
  }
  return scaled;
}

/** Battle movement points (tiles / turn). Default DEFAULT_BATTLE_MOVE, min 1. */
function movementPoints(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const mv = norm(s['Ruch w bitwie (heksy)'], DEFAULT_BATTLE_MOVE);
  return Math.max(1, Math.round(mv));
}

/**
 * Ranged attack reach in TILES (0 for pure melee).
 *
 * A unit counts as RANGED when it has a ranged attack value
 * ("Atak dystansowy" > 0) OR an explicit reach of >= 2 tiles
 * ("Zasieg ataku (hex)" >= 2).  In the shipped data the reach field is
 * frequently null/"---" even for shooters (Lucznik, Procarz...), so when a
 * unit has a ranged-attack value but no explicit reach we fall back to
 * DEFAULT_RANGED_REACH instead of collapsing it to 1 (which would have made
 * archers fight as melee).  Pure melee units (no ranged attack, reach < 2)
 * return 0 and must be ADJACENT to strike. (The data field is historically
 * named "(hex)"; on the square grid it is simply read as a count of tiles.)
 */
function attackRange(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const dyst  = norm(s['missileAttack'] ?? s['Atak dystansowy'], 0);
  const reach = norm(statField(s, 'Zasieg ataku (hex)', 'Zasięg ataku (hex)'), 0);
  if (reach >= 2) return Math.round(reach);               // explicit ranged reach
  if (dyst > 0)   return Math.max(DEFAULT_RANGED_REACH, Math.round(reach)); // shooter, default reach
  return 0;                                                // pure melee -> adjacency only
}

/** True for a unit that can strike from a distance (range >= 2, no adjacency required). */
function isRanged(bu: BattleUnit): boolean {
  return attackRange(bu) >= 2;
}

/**
 * Starting throwing-ammunition for a unit ("Ilosc pociskow").
 *
 * Returns the FINITE projectile count when the data gives a real number
 * (e.g. Legionista = 2 pila), otherwise Infinity = unlimited shots. So a
 * pure archer/slinger whose data leaves the field blank keeps firing every
 * turn exactly as before, while a unit with a finite count throws that many
 * ranged blows and then must fight in melee. GRID-AGNOSTIC: no geometry here,
 * so this is identical to the hex version (B6 preserved).
 */
function ammoCount(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  // B6 FIX: the units.json key carries Polish diacritics ("Ilosc pociskow" with
  // accents). The previous call passed the ASCII spelling as BOTH the ascii and
  // the accent argument, so statField never matched the real key, ammoCount
  // returned Infinity, and a Legionista (Ilosc pociskow = 2) threw pilum FOREVER
  // instead of 2 pila then switching to the sword. Read both spellings so the
  // finite count is found and the unit goes melee once ammo is spent.
  const raw = statField(s, 'Ilosc pociskow', 'Ilość pocisków');
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (raw === null || raw === undefined || raw === '' || !Number.isFinite(n)) {
    return Infinity;            // blank / non-numeric -> unlimited (pure shooters)
  }
  return Math.max(0, Math.floor(n));
}

/**
 * Can this runtime unit fire a RANGED blow right now? True only while it has
 * the base ranged capability AND ammunition remaining. Once ammoLeft hits 0
 * the unit is treated as PURE MELEE everywhere (target picking, in-range
 * test, attack dispatch) -- it closes to adjacency and strikes with its
 * melee Atak. Decision is deliberately grid-agnostic (B6 preserved).
 */
function canShoot(ru: RuntimeBattleUnit): boolean {
  return ru.rangedBase && ru.ammoLeft > 0;
}

/**
 * Is this unit a PRIMARY shooter (skirmisher / archer / slinger) whose main job
 * is to shoot, as opposed to a MELEE unit that merely carries a few throwing
 * weapons (e.g. the Legionista's 2 pila)? The distinction drives the 1A
 * out-of-ammo behaviour: a primary shooter that runs dry FALLS BACK behind its
 * own melee line rather than charging into the scrum, while a melee unit that
 * spent its pila closes to the sword as before.
 *
 * Signal = the model CATEGORY (already normalised by the army builders to
 * 'lucznik' / 'procarz' / 'oszczepnik' for the pure-ranged lines). A NAME
 * fallback covers builders that leave kategoria generic. Legionista / falanga /
 * wlocznik / konnica / rydwan are NEVER primary shooters even when they throw.
 */
function isPrimaryRanged(bu: BattleUnit): boolean {
  if (!isRanged(bu)) return false;
  const cat = normName(String(bu.kategoria ?? ''));
  if (cat === 'lucznik' || cat === 'procarz' || cat === 'oszczepnik') return true;
  if (cat === 'legionista' || cat === 'falanga' || cat === 'wlocznik' ||
      cat === 'miecznik'  || cat === 'maczuga' || cat === 'topor' ||
      cat === 'konnica'   || cat === 'rydwan') return false;
  // Fallback on the unit name for generic categories.
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  if (n.includes('luczn') || n.includes('archer') || n.includes('kusznik') ||
      n.includes('procarz') || n.includes('sling') ||
      n.includes('oszczep') || n.includes('javelin') || n.includes('atlatl')) return true;
  return false;
}

/** True for a MOUNTED unit (cavalry or chariot) -- belongs on the wings. */
function isMounted(bu: BattleUnit): boolean {
  const cat = normName(String(bu.kategoria ?? ''));
  if (cat === 'konnica' || cat === 'rydwan') return true;
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('konnic') || n.includes('jazd') || n.includes('jezdz') ||
         n.includes('kawaler') || n.includes('rydwan') || n.includes('chariot') ||
         n.includes('cavalry') || n.includes('horse');
}

/**
 * TRUE for an ANTI-CAVALRY SPEAR unit -- a spearman / phalanx whose role is to
 * counter mounted units (the +50% spear-vs-cavalry bonus in data/counters.json,
 * "Wlocznik" vs "Konnica/Rydwan"). Detected by normalised CATEGORY (wlocznik /
 * falanga) with a NAME fallback so culture variants (Greek phalanx, hoplite,
 * pikemen, sarissa, impi, ...) are caught too. These are the units a cavalry/
 * chariot rider AVOIDS (RULE 1): it shuns the spear wall and rides for the enemy
 * horse and skirmishers instead.
 */
function isAntiCavSpear(bu: BattleUnit): boolean {
  const cat = normName(String(bu.kategoria ?? ''));
  if (cat === 'wlocznik' || cat === 'falanga' || cat === 'pikinier') return true;
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('wloczn') || n.includes('spear') || n.includes('pike') ||
         n.includes('falang') || n.includes('phalan') || n.includes('hoplit') ||
         n.includes('sarissa') || n.includes('impi') || n.includes('pikin');
}

/**
 * TRUE for a PHALANX unit (Greek phalanx + culture variants: hoplite, sarissa,
 * pike block). RULE 2 keeps these in an EVEN LINE so they are never flanked.
 * Detected by normalised CATEGORY ('falanga') with a NAME fallback. A wlocznik
 * (loose spearman) is anti-cavalry (RULE 1) but is NOT a dense phalanx, so the
 * line-cohesion rule applies only to the falanga family here.
 */
function isPhalanx(bu: BattleUnit): boolean {
  const cat = normName(String(bu.kategoria ?? ''));
  if (cat === 'falanga') return true;
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('falang') || n.includes('phalan') || n.includes('hoplit') ||
         n.includes('sarissa');
}

/**
 * TRUE for a SIEGE MACHINE unit (Taran / Katapulta / Wieza obleznicza).
 * Only siege machines deal real damage to the gate; regular units deal ~0.
 * Detected by "Typ" === "Siege" in stats (the units.json field set for these
 * three unit types). NAME fallback covers any naming variants.
 */
function isSiegeUnit(bu: BattleUnit): boolean {
  const typ = String((bu.stats as any)?.['Typ'] ?? '').trim();
  if (typ === 'Siege') return true;
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('taran') || n.includes('katapult') || n.includes('wieza oblezn') ||
         n.includes('battering') || n.includes('catapult') || n.includes('siege tower');
}

/** True if bu is specifically a SIEGE TOWER (wieża oblężnicza), used for wall-climb logic. */
function isSiegeTower(bu: BattleUnit): boolean {
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('wieza oblezn') || n.includes('siege tower');
}

/**
 * Reorder one side's units so MOUNTED units (cavalry / chariots) deploy on the
 * WINGS -- the top and bottom rows at the two ends of the rank axis -- instead
 * of trailing in a partial rear rank. The placement loop fills the array rank by
 * rank, each rank a straight line of `perRank` rows from top (rowIdx 0) to bottom
 * (rowIdx perRank-1); so the flank slots are the LOW and HIGH rowIdx of the FRONT
 * rank. We split the mounted units half to the top wing, half to the bottom wing
 * of the front rank, with the foot units filling the centre and the rear ranks.
 * Returns a NEW array (input order otherwise preserved). No geometry here.
 */
function arrangeFlankCavalry(units: BattleUnit[]): BattleUnit[] {
  const mounted = units.filter(isMounted);
  if (mounted.length === 0) return units.slice();
  const foot = units.filter(u => !isMounted(u));

  const perRank = Math.max(1, Math.min(RANK_WIDTH, BF_ROWS));
  // Mounted units split evenly to the two wings of the FRONT rank. Cap to half
  // the rank per wing so they never crowd out the whole front line.
  const maxPerWing = Math.max(1, Math.floor(perRank / 2));
  const topCount = Math.min(Math.ceil(mounted.length / 2), maxPerWing);
  const botCount = Math.min(mounted.length - topCount, maxPerWing);
  const topWing = mounted.slice(0, topCount);
  const botWing = mounted.slice(topCount, topCount + botCount);
  // Any mounted beyond the wing cap fall back to the centre with the foot.
  const extraMounted = mounted.slice(topCount + botCount);

  // Front rank = [topWing ... foot/extra centre ... botWing]; the remaining foot
  // forms the rear ranks (appended after the full front rank).
  const centreBudget = Math.max(0, perRank - topWing.length - botWing.length);
  const centre = [...extraMounted, ...foot].slice(0, centreBudget);
  const rear   = [...extraMounted, ...foot].slice(centreBudget);

  return [...topWing, ...centre, ...botWing, ...rear];
}

/**
 * Spear/phalanx-type defenders brace and NEGATE the attacker's charge bonus
 * (Uderzenie) when the attacker moved in. Mirrors the private negatesCharge()
 * rule inside combat.ts so a single blow matches the canonical model.
 */
function bracesAgainstCharge(bu: BattleUnit): boolean {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const name = String((s['Jednostka'] as string) ?? bu.kategoria ?? '').toLowerCase();
  return (
    name.includes('wlocznik') ||
    name.includes('falanga') ||
    name.includes('impi') ||
    name.includes('wloczn')
  );
}

/**
 * True for a "fights to the death" unit that IGNORES morale rout and only
 * leaves the field at HP <= 0. Two data signals (matching src/game/siege.ts and
 * the units.json Uwagi convention):
 *   1) a null / blank "Prog dezercji (% health)" -- siege.ts: "null/undefined =>
 *      never routs from morale (fights to 0 HP), e.g. militia/garrison".
 *   2) an Uwagi note containing "walczy do smierci" (fights to death) or
 *      "niezlomny" (unbreakable). The note is matched diacritic-insensitively.
 * Everything else has a finite desertion threshold and CAN rout from morale.
 */
function isNeverRout(bu: BattleUnit): boolean {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  // Morale-only model (battle-side): never routs only if flagged "fights to
  // death" in Uwagi, or its 'Morale ucieczki' level is blank.
  const flee = statField(s, 'Morale ucieczki', 'Morale ucieczki');
  const fleeBlank = flee === null || flee === undefined || flee === '' || flee === '---' || !Number.isFinite(Number(flee));
  const uwagi = normName(String((s['Uwagi'] as string) ?? ''));
  if (uwagi.includes('walczy do smierci') || uwagi.includes('niezlomny')) return true;
  if (fleeBlank) return true;
  return false;
}

/**
 * Per-unit MORALE rout threshold as a FRACTION (0..1): the unit breaks + flees
 * when its current morale drops below this share of its starting morale. Read
 * from the data column 'Prog ucieczki (% morale)' (accent-tolerant), a percent
 * (e.g. 35 => 0.35). Different units break at different morale per Naster.
 * Falls back to ROUT_MORALE_THRESHOLD when absent/invalid; clamped 5..90%.
 */
function moraleBaseFor(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const raw = statField(s, 'Morale bazowe', 'Morale bazowe');
  const v = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (!Number.isFinite(v)) return MORALE_START;
  const base = Math.max(10, Math.min(300, v));
  // TRZECI SYSTEM (weterani, 2026-07-25 -- korekta wlasciciela wieczorem):
  // "Morale bazowe" idzie W GORE (wyzej = lepiej) -- +10%/+20%, Math.ceil
  // gwarantuje widoczny efekt nawet dla malych wartosci. Patrz game/veteran.ts.
  return veteranMoraleBazoweUp(base, bu.veteranBonusFrac ?? 0);
}

/** Per-unit ABSOLUTE morale level at which the unit breaks + flees ('Morale ucieczki'). */
function fleeMoraleFor(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const raw = statField(s, 'Morale ucieczki', 'Morale ucieczki');
  const v = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (!Number.isFinite(v)) return 25;
  const base = Math.max(0, Math.min(295, v));
  // TRZECI SYSTEM (weterani): "Morale ucieczki" jest polem ODWROCONYM (nizej
  // = trudniej uciec) -- idzie W DOL -- x0.90/x0.80, Math.floor + podloga
  // bezpieczenstwa gwarantuja widoczny efekt bez zejscia do zera/ujemnych.
  // Patrz game/veteran.ts (korekta wlasciciela 2026-07-25 wieczorem).
  return veteranMoraleUcieczkiDown(base, bu.veteranBonusFrac ?? 0);
}

// ---------------------------------------------------------------------------
// Ranged projectile kinds + mesh factory (visual differentiation by weapon)
// ---------------------------------------------------------------------------

/** The kind of flying projectile a ranged attacker fires (visual only). */
type ProjectileKind = 'arrow' | 'javelin' | 'pilum' | 'sling';

/** Strip diacritics + lowercase, matching testBattle's normalizeForMatch. */
function normName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[łŁ]/g, 'l').toLowerCase();
}

/**
 * Classify the projectile a ranged attacker throws/shoots, from its model
 * CATEGORY (already normalised: 'lucznik'/'procarz'/'oszczepnik'/'legionista'/
 * 'rydwan' ...) with a normalised-NAME fallback so it is robust across both the
 * test-battle and the real-battle BattleUnit builders. Visual ONLY -- never
 * touches combat. Bow units (archers, crossbows, chariot archers) -> 'arrow';
 * slingers -> 'sling' pellet; javelineers -> 'javelin'; Legionista -> 'pilum'
 * (a heavy javelin). Anything unrecognised defaults to the slim arrow.
 */
function projectileKind(bu: BattleUnit): ProjectileKind {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const cat  = normName(String(bu.kategoria ?? ''));
  const name = normName(String((s['Jednostka'] as string) ?? bu.nazwa ?? ''));
  const hay  = cat + ' ' + name;
  if (hay.includes('legionist')) return 'pilum';
  if (cat === 'procarz' || hay.includes('procar') || hay.includes('sling')) return 'sling';
  if (cat === 'oszczepnik' || hay.includes('oszczep') || hay.includes('javelin') || hay.includes('atlatl') || hay.includes('estolic')) return 'javelin';
  if (cat === 'lucznik' || cat === 'rydwan' || hay.includes('luczn') || hay.includes('archer') || hay.includes('kusznik') || hay.includes('rydwan') || hay.includes('chariot')) return 'arrow';
  return 'arrow';
}

/**
 * Build the projectile mesh for a given weapon kind, laid out along LOCAL +X
 * (point at the +X end) so the caller can aim it with a single setFromUnitVectors
 * quaternion. Returns the group plus its geometries/materials so the caller can
 * register them for disposal. Dimensions are in world units (TILE_S-relative):
 *
 *   arrow   : VERY thin, SHORT shaft + tiny iron head + small tail fletch.
 *   javelin : clearly LONGER and THICKER shaft + bigger head (>> arrow).
 *   pilum   : heavy javelin -- long thick shaft + a slim iron shank + head.
 *   sling   : a tiny round stone (no shaft).
 */
function makeProjectileMesh(kind: ProjectileKind): {
  group: THREE.Group;
  geos:  THREE.BufferGeometry[];
  mats:  THREE.Material[];
} {
  const group = new THREE.Group();
  const geos:  THREE.BufferGeometry[] = [];
  const mats:  THREE.Material[]       = [];

  // Shared matte materials (no fireball glow): brown wood + grey iron + stone.
  const woodMat  = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.95, metalness: 0.0, emissive: 0x000000 });
  const ironMat  = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.6,  metalness: 0.5, emissive: 0x000000 });

  if (kind === 'sling') {
    // A tiny round stone -- no shaft, just a small low-poly sphere.
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9, metalness: 0.0, emissive: 0x000000 });
    const r = TILE_S * 0.05;
    const stoneGeo = new THREE.SphereGeometry(r, 8, 6);
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.castShadow = true;
    group.add(stone);
    geos.push(stoneGeo); mats.push(stoneMat, woodMat, ironMat); // dispose the unused shared mats too
    return { group, geos, mats };
  }

  // Shaft + head dimensions per kind. The ARROW is deliberately MUCH thinner
  // and shorter than the JAVELIN (~3x thinner, ~half the length) so the two
  // read as clearly different weapons in flight.
  let shaftLen: number, shaftR: number, headLen: number, headR: number;
  let headColor: 'wood' | 'iron' = 'iron';
  if (kind === 'arrow') {
    shaftLen = TILE_S * 0.34;   // short
    shaftR   = TILE_S * 0.009;  // very thin
    headLen  = TILE_S * 0.06;
    headR    = shaftR * 2.6;
  } else if (kind === 'javelin') {
    shaftLen = TILE_S * 0.60;   // long
    shaftR   = TILE_S * 0.028;  // thick (>> arrow)
    headLen  = TILE_S * 0.14;
    headR    = shaftR * 2.0;
  } else { // pilum -- heavy javelin
    shaftLen = TILE_S * 0.55;
    shaftR   = TILE_S * 0.024;
    headLen  = TILE_S * 0.13;
    headR    = shaftR * 1.8;
  }

  const shaftGeo = new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 6);
  const shaft    = new THREE.Mesh(shaftGeo, woodMat);
  shaft.rotation.z = -Math.PI / 2;        // lay along +X
  shaft.castShadow = true;
  group.add(shaft);
  geos.push(shaftGeo);

  const headGeo = new THREE.ConeGeometry(headR, headLen, 6);
  const headMat = headColor === 'iron' ? ironMat : woodMat;
  const head    = new THREE.Mesh(headGeo, headMat);
  head.rotation.z = -Math.PI / 2;
  head.position.x = shaftLen * 0.5 + headLen * 0.5;  // point at the +X tip
  head.castShadow = true;
  group.add(head);
  geos.push(headGeo);

  if (kind === 'pilum') {
    // Slim iron shank between shaft and head (the classic pilum look).
    const shankLen = TILE_S * 0.18;
    const shankR   = shaftR * 0.45;
    const shankGeo = new THREE.CylinderGeometry(shankR, shankR, shankLen, 5);
    const shank    = new THREE.Mesh(shankGeo, ironMat);
    shank.rotation.z = -Math.PI / 2;
    shank.position.x = shaftLen * 0.5 + shankLen * 0.5;
    shank.castShadow = true;
    head.position.x  = shaftLen * 0.5 + shankLen + headLen * 0.5;
    group.add(shank);
    geos.push(shankGeo);
  } else if (kind === 'arrow') {
    // Tiny flat fletching at the tail (-X end): a very small thin cone.
    const fletchLen = TILE_S * 0.05;
    const fletchR   = shaftR * 3.2;
    const fletchGeo = new THREE.ConeGeometry(fletchR, fletchLen, 4);
    const fletch    = new THREE.Mesh(fletchGeo, woodMat);
    fletch.rotation.z = Math.PI / 2;       // flare points back toward -X
    fletch.position.x = -(shaftLen * 0.5);
    group.add(fletch);
    geos.push(fletchGeo);
  }

  mats.push(woodMat, ironMat);
  return { group, geos, mats };
}

// ---------------------------------------------------------------------------
// Square-grid helpers (col,row) -- self-contained, no hexutil.
// ---------------------------------------------------------------------------

/** World position of the CENTRE of tile (col,row). Tiles are TILE_S apart. */
function cellToWorld(col: number, row: number): { x: number; z: number } {
  return { x: col * TILE_S, z: row * TILE_S };
}

/** Krawędzie kafla w X/Z (środek ± połowa TILE_S) — do obrysów zaznaczenia terenu. */
function cellBoundsXZ(
  minCol: number, minRow: number, maxCol: number, maxRow: number,
): { xMin: number; xMax: number; zMin: number; zMax: number } {
  const half = TILE_S * 0.5;
  return {
    xMin: minCol * TILE_S - half,
    xMax: maxCol * TILE_S + half,
    zMin: minRow * TILE_S - half,
    zMax: maxRow * TILE_S + half,
  };
}

function cellKey(col: number, row: number): string { return col + ',' + row; }

function clampBattleTile(col: number, row: number): { col: number; row: number } | null {
  if (col < 0 || col >= BF_COLS || row < 0 || row >= BF_ROWS) return null;
  return { col, row };
}

/** Normala trafionego mesha w przestrzeni świata (składowa Y). */
function battlePickMeshUpNormal(hit: THREE.Intersection): number {
  if (!hit.face) return 0;
  const n = hit.face.normal.clone();
  hit.object.updateMatrixWorld(true);
  n.transformDirection(hit.object.matrixWorld);
  return n.y;
}

/**
 * Płaszczyzna na tileTopY — ten sam relief co obrys deploy (cellBoundsXZ + tileTopY).
 * Używana gdy raycast meshów trafia w sąsiedni płaski kafel (y=0) przed wzgórzem.
 */
function pickBattleGroundTilePlane(
  raycaster: THREE.Raycaster,
  tm: BattleTerrainMap,
): { col: number; row: number } | null {
  const pt = new THREE.Vector3();
  let y = 0;
  let col = 0;
  let row = 0;
  for (let i = 0; i < 4; i++) {
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
    if (!raycaster.ray.intersectPlane(ground, pt)) return null;
    const nCol = Math.round(pt.x / TILE_S);
    const nRow = Math.round(pt.z / TILE_S);
    if (i > 0 && nCol === col && nRow === row) break;
    col = nCol;
    row = nRow;
    y = tileTopY(tm, col, row);
  }
  return clampBattleTile(col, row);
}

/**
 * Raycast na meshach terenu — wybiera trafienie, którego Y najlepiej pasuje do tileTopY
 * (nie pierwszy hit: płaski sąsiad y=0 często blokuje kopułę wzgórza).
 */
function pickBattleGroundTileFromMeshes(
  raycaster: THREE.Raycaster,
  tm: BattleTerrainMap,
  meshes: readonly THREE.Object3D[],
): { col: number; row: number } | null {
  if (meshes.length === 0) return null;
  const hits = raycaster.intersectObjects(meshes as THREE.Object3D[], false);
  let bestCol = 0;
  let bestRow = 0;
  let bestScore = -Infinity;
  let found = false;
  for (const h of hits) {
    if (battlePickMeshUpNormal(h) < 0.3) continue;
    const tile = clampBattleTile(Math.round(h.point.x / TILE_S), Math.round(h.point.z / TILE_S));
    if (!tile) continue;
    const expectedY = tileTopY(tm, tile.col, tile.row);
    const heightMatch = -Math.abs(h.point.y - expectedY);
    const score = heightMatch * 10 + h.point.y;
    if (score > bestScore) {
      bestScore = score;
      bestCol = tile.col;
      bestRow = tile.row;
      found = true;
    }
  }
  return found ? { col: bestCol, row: bestRow } : null;
}

/**
 * The Y of the VISIBLE walking surface on tile (col,row) -- the height a unit's
 * FEET rest at so it stands ON the terrain instead of sinking into it. This is
 * the battle-grid analogue of the world map's terrainTopY (render/units.ts):
 *
 *   - Hills  -> HILL_SUMMIT_Y (the apex of the raised grass dome drawn on the
 *               tile). The SAME constant scales the dome, so the surface and the
 *               bump stay locked together.
 *   - River / Ford -> -RIVER_DROP. Deep River is impassable (units never stand
 *               there); a Ford is waded across, so matching the sunken water
 *               slab keeps a unit mid-ford at the channel surface.
 *   - Plains / Forest / Rocks -> 0. Forest trees + rocks are decorations placed
 *               AROUND the figure on flat ground, so the unit stands at y=0.
 *
 * Used by deployment, the move animation (lerped between source + dest tops),
 * melee/ranged anchors and HP-bar/label placement so everything tracks the lift.
 */
function tileTopY(tm: BattleTerrainMap, col: number, row: number): number {
  switch (tm.at(col, row)) {
    case BTerrain.Hills:           return HILL_SUMMIT_Y;
    case BTerrain.River:
    case BTerrain.Ford:            return -RIVER_DROP;
    default:                       return 0; // Plains, Forest, Rocks: flat ground
  }
}

/** True if (col,row) is a Ford tile -- a wadeable river crossing (C-BTL-BROD-Q1). */
function isFordTile(tm: BattleTerrainMap, col: number, row: number): boolean {
  return tm.at(col, row) === BTerrain.Ford;
}

/**
 * "Obrona brzegu" adjacency (C-BTL-BROD-Q1): true if (col,row) is itself DRY
 * ground (not River/Ford) and orthogonally touches at least one Ford tile.
 * 4-directional, matching this square grid's adjacency model everywhere else
 * (DIR_DELTA / manhattan).
 */
function isShoreAdjacentToFord(tm: BattleTerrainMap, col: number, row: number): boolean {
  const own = tm.at(col, row);
  if (own === BTerrain.River || own === BTerrain.Ford) return false;
  for (const [dc, dr] of DIR_DELTA) {
    if (tm.at(col + dc, row + dr) === BTerrain.Ford) return true;
  }
  return false;
}

/** Manhattan (4-directional) distance in tiles. */
function manhattan(ac: number, ar: number, bc: number, br: number): number {
  return Math.abs(ac - bc) + Math.abs(ar - br);
}

/**
 * Convert a facing Dir (N/E/S/W) into a Three.js rotation.y (yaw) so the unit
 * model visibly turns to face that grid direction. The model's forward axis is
 * +X at yaw 0, and a positive yaw turns +X toward -Z, hence atan2(-dz, dx) over
 * the direction's WORLD delta (taken from cellToWorld so it matches geometry).
 */
function dirYaw(d: Dir): number {
  const delta = DIR_DELTA[d] ?? DIR_DELTA[Dir.E]!;
  const w = cellToWorld(delta[0], delta[1]);
  return Math.atan2(w.x, w.z); // model front = +Z (twarz ku +Z); obroc +Z w strone kierunku
}

// ---------------------------------------------------------------------------
// Internal runtime unit
// ---------------------------------------------------------------------------

/** Postawa taktyczna grupy gracza (auto-gra bez mikro). */
type GroupDoctrine = 'defensive' | 'steady' | 'aggressive' | 'skirmish' | 'manual';
type BattleUnitClass = 'mounted' | 'ranged' | 'melee';

/**
 * C-FLANK (Maciej 2026-07-25): KIERUNEK NATARCIA dla auto-odgrywania bitwy --
 * per-jednostka (i domyslnie per-grupa/armia przez UI deploy), WYLACZNIE dla
 * auto-play (recznej gry nie zmienia). 'front' = zachowanie dokladnie jak
 * dotychczas (domyslne -- zero regresji, gdy gracz nic nie ustawi). 'bok' /
 * 'tyl' every unit type manewruje w _advanceStep / _cavalryAction, by
 * dotrzec na hex, z ktorego cios zostanie sklasyfikowany przez relativeHit()
 * jako 'flank' / 'rear' wzgledem facingu celu (istniejacy bonus/kara SS5l);
 * gdy manewr niemozliwy (brak miejsca/sciezki) -- graceful fallback na atak
 * czolowy (front), bez zawieszen.
 */
type AttackDirection = 'front' | 'bok' | 'tyl';

/** Docelowa klasyfikacja ciosu (relativeHit) dla danego kierunku natarcia, lub
 * null gdy 'front' (brak wymuszonego manewru -- istniejace zachowanie). */
function desiredHitForDirection(dir: AttackDirection): FacingHit | null {
  if (dir === 'bok') return 'flank';
  if (dir === 'tyl') return 'rear';
  return null;
}

interface RuntimeBattleUnit {
  bu:           BattleUnit;
  group:        THREE.Group;
  hpBarFg:      THREE.Mesh;
  hpBarBg:      THREE.Mesh;
  hpBarGroup:   THREE.Group;
  // MORALE bar (top) -- green->red gradient by current morale fraction.
  moraleBarFg:  THREE.Mesh;
  moraleBarBg:  THREE.Mesh;
  // AMMO bar (middle, BLUE) -- only present/visible for ranged units with
  // finite ammo; tracks ammoLeft/ammoMax and hides when empty/melee-only.
  ammoBarFg:    THREE.Mesh;
  ammoBarBg:    THREE.Mesh;
  ammoBarShown: boolean;  // true only when this unit ever shows an ammo bar (ranged + finite ammo)
  q:            number;   // COLUMN (grid x); kept as `q` to minimise churn
  r:            number;   // ROW (grid z); kept as `r` to minimise churn
  side:         'atk' | 'def';
  dead:         boolean;
  fadingOut:    boolean;
  fadeStart:    number;
  acted:        boolean;
  moveLeft:     number;
  range:        number;   // CURRENT effective attack range in tiles (0 => melee adjacency only);
                          // recomputed every activation from rangeBase + the standing tile's
                          // terrain Delta Zasieg (C-TEREN-Q1 ETAP 2, see _applyTerrainRange),
                          // then the wall-walkway elevation bonus stacks on top temporarily.
  rangeBase:    number;   // unit's UNMODIFIED range (attackRange(bu) / catapult formula) --
                          // never mutated after spawn; `range` is recomputed from this each turn.
  ranged:       boolean;  // base ranged capability (kept for back-compat)
  rangedBase:   boolean;  // base ranged capability; actual shooting gated by ammoLeft (see canShoot)
  primaryRanged: boolean; // TRUE for a unit whose PRIMARY weapon is ranged (archer/slinger/javelin skirmisher).
                          // FALSE for a melee unit that merely carries throwing ammo (Legionista pilum): such a
                          // unit charges into melee once out of ammo. Drives the 1A out-of-ammo FALL-BACK: a
                          // primary shooter with no ammo retreats behind its own line instead of charging.
  ammoLeft:     number;   // throwing projectiles remaining; 0 => fights as pure melee from here on
  ammoMax:      number;   // starting finite ammo (for the ammo bar fraction); Infinity for pure shooters
  // OUT-OF-AMMO FALL-BACK tracking (TASK 4): when a PRIMARY shooter first runs
  // dry it records the column it stood on (dryCol). It then retreats only until
  // it is FALLBACK_TILES tiles back from that column OR FALLBACK_TILES tiles from
  // the nearest threat, after which heldAfterFallback latches and it HOLDS its
  // ground (no more retreating), fighting only if an enemy reaches it adjacent.
  dryCol:           number;  // side-relative advance column where ammo ran out; -1 until dry
  heldAfterFallback: boolean; // latched once it has fallen back ~3 tiles -> stop retreating
  mounted:      boolean;  // RULE 1: cavalry / chariot -- uses the cavalry target-priority picker
  antiCavSpear: boolean;  // RULE 1: spear/phalanx that counters cavalry -- cavalry avoids these
  phalanx:      boolean;  // RULE 2: phalanx line unit -- keeps the even line / never gets flanked
  facing:       Dir;      // FACING direction (N/E/S/W) toward the enemy line
  // --- Morale / rout (scene-side; resolveCombat untouched) ---
  morale:       number;   // CURRENT morale pool (0..MORALE_START)
  moraleMax:    number;   // starting morale (= MORALE_START) for the rout fraction
  neverRout:    boolean;  // elite / "walczy do smierci": ignores morale, fights to 0 HP
  routed:       boolean;  // has broken and is fleeing -- counts as OUT for victory
  screenLostApplied: boolean; // -50% morale raz, gdy strona straci ostatnia jedn. wrecz
  fleeStuck:    number;   // tury zablokowanej ucieczki -> po 2 znika z pola (nie zamarza)
  surroundApplied:   boolean; // -MORALE_SURROUND_HIT raz, gdy >=3 wrogow przylega (otoczenie)
  fleeMorale:   number;   // rout when morale <= fleeMorale (per-unit 'Morale ucieczki'); moraleMax = per-unit base morale
  removed:      boolean;  // fully removed from the scene (model + bars disposed) after crossing its home edge
  // SIEGE v2: wall walkway flag. Set TRUE for a defender placed on the wall
  // walkway (col = siegeWallCol). Wall defenders STAY ON THE WALL: they never
  // step off voluntarily. They gain +1 shooting range (elevation bonus). They
  // can engage melee attackers standing adjacent at the wall base (col-1) or
  // attackers who climbed via a siege tower (onWallWalkway too).
  // Attackers can also get this flag after mounting via a siege tower.
  onWallWalkway: boolean;
  playerOrder:   { type: 'none' } | { type: 'hold' } | { type: 'move'; col: number; row: number } | { type: 'attack'; targetId: string };
  // --- Tryby recz. sterowania ---
  rangedKite:       boolean; // true = kituje (domyslnie); false = stoi i bije bez cofania
  shootingEnabled:  boolean; // true = uzywa ataku dystansowego; false = idzie wrecz
  // --- GRUPOWANIE (zakres 1-5) ---
  /** Identyfikator grupy (np. "G1"), null gdy nie w grupie. */
  groupId:      string | null;
  /** Wzgledny offset {dc, dr} od centroidu grupy w chwili grupowania (formacja pierwotna). */
  formationOffset: { dc: number; dr: number } | null;
  /** Wlasna doktryna (null = dziedzicz z grupy, potem domyslnie Atak). */
  unitDoctrine: GroupDoctrine | null;
  /** C-FLANK: kierunek natarcia w auto-play (front/bok/tyl); domyslnie 'front'. */
  attackDirection: AttackDirection;
  /** Wlasne priorytety celow (gdy useUnitPriorities). */
  unitTargetPriorities?: Partial<Record<BattleUnitClass, BattleUnitClass[]>>;
  /** Gdy true — jednostka uzywa unitTargetPriorities zamiast armii/grupy. */
  useUnitPriorities?: boolean;
  mats:         THREE.Material[];
  perTokenGeos: THREE.BufferGeometry[];
}

/** Ustawienie konnicy w formacji deploy: skrzydla lub linia z tylu. */
type CavalryDeployMode = 'flanks' | 'rear';

/** Liczba linii glebokosci (1–3) dla piechoty lub lucznikow w deploy. */
type DeployLineCount = 1 | 2 | 3;

interface GroupMeta {
  doctrine: GroupDoctrine;
  autoPlay: boolean;
  rallyCol?: number;
  rallyRow?: number;
  /** Brak = uzyj aktywnego przycisku F1/F2/F3 z paska deploy. */
  formation?: 'F1' | 'F2' | 'F3';
  /** Konnica: boki (domyslnie) lub za liniami piechoty/lucznikow. */
  cavalryMode?: CavalryDeployMode;
  /** C-FLANK: kierunek natarcia domyslny dla grupy (brak = 'front'). */
  attackDirection?: AttackDirection;
  /** Linie glebokosci piechoty (1–3) w deploy. */
  meleeLines?: DeployLineCount;
  /** Linie glebokosci lucznikow (1–3) w deploy. */
  archerLines?: DeployLineCount;
  /** Własne priorytety celów grupy (per klasa atakującego). Brak = priorytety armii. */
  groupTargetPriorities?: Partial<Record<BattleUnitClass, BattleUnitClass[]>>;
  /** Gdy true — grupa używa groupTargetPriorities zamiast globalnych. */
  useGroupPriorities?: boolean;
}

/** Ustawienia dowódcy (menu Generała). */
interface GeneralSettings {
  /** Nazwa / placeholder pod przyszłe umiejętności generała. */
  commanderName: string;
  /** Blokada linii — jednostki nie przekraczają tej kolumny (atak → wschód). */
  blockadeActive: boolean;
  blockadeCol: number | null;
}

// ---------------------------------------------------------------------------
// Floating damage number
// ---------------------------------------------------------------------------

interface FloatLabel {
  elem:      HTMLDivElement;
  startTime: number;
  duration:  number;
  worldPos:  THREE.Vector3;
  riseRate:  number;
}

// ---------------------------------------------------------------------------
// BattleScene
// ---------------------------------------------------------------------------

/** Typ formacji grupy. F1=dystans-przod, F2=melee-przod, F3=oblezenie. */
type GroupFormation = 'F1' | 'F2' | 'F3';

export class BattleScene {
  private canvas:   HTMLCanvasElement;
  private overlay:  HTMLDivElement;
  private hint:     HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene:    THREE.Scene;
  private camera:   THREE.PerspectiveCamera;

  // --- PROCEDURAL AUDIO (Web Audio API; no external files) -----------------
  // ONE AudioContext, created LAZILY on the first user gesture (autoplay
  // policy). Everything is GUARDED so a missing/blocked AudioContext never
  // throws (headless/SSR/jsdom has no AudioContext -> silent no-op). Master
  // gain stays low (~0.25 SFX) so rapid battle events don't become a wall of
  // sound; SFX are throttled (min gap + thinned at high speed). A very light
  // ambient bed (drone + soft drum, gain ~0.07) loops while the battle runs.
  private _ac:          AudioContext | null = null;   // null until first gesture
  private _acTried      = false;             // attempted init (don't retry if blocked)
  private _masterGain:  GainNode | null = null;        // SFX bus (~0.25)
  private _ambGain:     GainNode | null = null;        // ambient bus (~0.07)
  private _ambNodes:    Array<{ stop?: () => void }> = []; // ambient oscillators/timers
  private _ambDrumTimer: ReturnType<typeof setInterval> | null = null;
  private _ambTimers:   Array<ReturnType<typeof setInterval>> = []; // all ambient schedulers
  private _audioMuted   = false;             // legacy M-key: toggles both buses
  private _sfxMuted     = false;
  private _musicMuted   = false;
  private _audioStarted = false;             // ambient started (after gesture)
  private _lastHitAt    = 0;                 // wall-time of last melee/ranged SFX (throttle)
  private _lastShotAt   = 0;

  // --- Camera dolly-zoom + drag-pan state (B9) ---
  // The camera always looks at camTarget along the fixed unit direction camDir.
  // ZOOM is a DOLLY along camDir (distance from the target), smoothly eased each
  // frame toward camDistTarget and clamped to [camDistMin, camDistMax]. PAN
  // drags camTarget across the ground plane (left-button drag on the canvas).
  private camTarget   = new THREE.Vector3();
  private camDir      = new THREE.Vector3(0, 0.92, 0.92).normalize();
  private camDist     = 30;   // current distance (eased)
  private camDistTarget = 30; // desired distance (set by wheel / +/- keys)
  private camDistMin  = 3;    // closest zoom (2× bliżej niż wcześniej)
  private camDistMax  = 70;   // farthest zoom -- whole field in shot

  // Drag-pan bookkeeping.
  private panning   = false;
  private panLastX  = 0;
  private panLastY  = 0;
  /** Trzymane strzałki — przesuwanie widoku (jak drag myszą). */
  private readonly _camPanKeys = { up: false, down: false, left: false, right: false };

  // --- Faza rozstawiania (deploy) ---
  /** opts.deploy === true — start w strefie deploy zamiast linii bitwy. */
  private _deployMode = false;
  /** Strona gracza w deploy / trybie recznym (atak lub obrona). */
  private _deployPlayerSideOpt: 'atk' | 'def' = 'atk';
  /** Tryb rozstawiania: gracz przesuwa jednostki przed walka. */
  private deployPhase = false;
  /** Zaznaczona jednostka atakujaca do przeniesienia. */
  private _deploySelected: RuntimeBattleUnit | null = null;
  /** Meshe strefy startowej (podswietlenie polowy ATK + mgla DEF). */
  private _deployZoneMeshes: THREE.Mesh[] = [];
  /** Floor + hill/water meshes for screen→tile raycast (avoids y=0 perspective skew). */
  private _battleGroundPickMeshes: THREE.Object3D[] = [];
  /** Grupa wizualizacji fazy deploy (jasna polowa / mgla / linia). */
  private _deployVisualGroup: THREE.Group | null = null;
  /** Etykiety HTML polow mapy w fazie deploy. */
  private _deployHalfLabels: HTMLDivElement | null = null;
  /** Overlay fazy rozstawiania (legacy — zastąpiony paskiem _deployToolbar). */
  private _deployOverlay: HTMLDivElement | null = null;
  /** Naglowek nad rosterem w fazie deploy (licznik armii / zaznaczenia). */
  private _deployRosterHeader: HTMLDivElement | null = null;
  /** Fixed dock na dole ekranu — roster + naglowek (poza canvas, zawsze widoczny). */
  private _deployRosterDock: HTMLDivElement | null = null;
  /** Panel szczegolow zaznaczonej jednostki (Total War — lewa strona docku). */
  private _deployDetailPanel: HTMLDivElement | null = null;
  /** Kontenery rzędow rosteru deploy: konnica / piesza / lucznictwo. */
  /** Jeden poziomy rzad kart (bez podzialu na konnica/piechota/lucznicy). */
  private _deployUnitsRow: HTMLDivElement | null = null;
  /** Pasek duzych przyciskow Grupa 1/2/3 w docku deploy. */
  private _deployGroupsBar: HTMLDivElement | null = null;
  /** Dolna belka wyboru grupy (nad toolbarem Formacja/Taktyka). */
  private _deployGroupManagerRail: HTMLDivElement | null = null;
  /** Doktryny auto-bitwy dla zaznaczonej grupy (deploy). */
  private _deployStrategyBar: HTMLDivElement | null = null;
  /** @deprecated — stary uklad 3 rzedow; tylko recover DOM. */
  private _deployRowUnits: { mounted: HTMLDivElement; melee: HTMLDivElement; ranged: HTMLDivElement } | null = null;
  /** Przyciski szybkiego zaznaczenia (grupy / typy / wszystkie). */
  private _deployQuickSelectBar: HTMLDivElement | null = null;
  /** Pasek grup G1/G2… w fazie walki recznej (lewy panel). */
  private _battleQuickSelectBar: HTMLDivElement | null = null;
  /** Sygnatura stanu paska szybkiego zaznaczenia (unikaj rebuild co klatke). */
  private _battleQuickSelectSig = '';
  /** @deprecated Dolny pasek GRUPY — ukryty; grupy w lewym panelu rosteru. */
  private _groupSelectorBar: HTMLDivElement | null = null;
  /** Nagłówek lewego panelu rosteru walki. */
  private _battleRosterHeader: HTMLDivElement | null = null;
  /** Lewy panel walki: licznik jednostek. */
  private _battleRosterCount: HTMLDivElement | null = null;
  /** Lewy panel walki: pasek zaznaczenia (Odznacz / Rozgrupuj). */
  private _battleSelBar: HTMLDivElement | null = null;
  /** Lewy panel walki: komunikaty. */
  private _battleRosterFeedback: HTMLDivElement | null = null;
  /** Kolumna grup w rosterze walki. */
  private _battleGroupsStrip: HTMLDivElement | null = null;
  /** Kontener kart jednostek w rosterze walki. */
  private _battleRosterCards: HTMLDivElement | null = null;
  private _battleLooseCards: HTMLDivElement | null = null;
  /** Zakładki grup w rosterze walki. */
  private _battleGroupTabs = new Map<string, HTMLDivElement>();
  /** Pasek ramek grup nad rosterem (karty zgrupowanych jednostek). */
  private _deployGroupsStrip: HTMLDivElement | null = null;
  /** Kontener siatki kart deploy (osobny od _rosterBar walki recznej). */
  private _deployLooseCards: HTMLDivElement | null = null;
  private _deployRosterGridEl: HTMLDivElement | null = null;
  /** Zakładki grup w rosterze deploy (groupId → nagłówek zwijany). */
  private _deployGroupTabs = new Map<string, HTMLDivElement>();
  /** Bloki zwijanych grup w rosterze deploy. */
  private _deployGroupBlocks = new Map<string, { wrapper: HTMLDivElement; header: HTMLDivElement; cards: HTMLDivElement }>();
  /** Bloki zwijanych grup w rosterze walki. */
  private _battleGroupBlocks = new Map<string, { wrapper: HTMLDivElement; header: HTMLDivElement; cards: HTMLDivElement }>();
  /** Zwiniete grupy w rosterze (domyslnie po utworzeniu grupy). */
  private _rosterGroupCollapsed = new Set<string>();
  /** Aktywna grupa w deploy (doktryny / priorytety na lewym panelu). */
  private _deployActiveGroupId: string | null = null;
  /** Aktywny uklad formacji w fazie deploy (UI + logika). */
  private _deployActiveFormation: 'F1' | 'F2' | 'F3' = 'F2';
  /** Ustawienie konnicy w formacji deploy (osobny od F1/F2/F3). */
  private _deployCavalryMode: CavalryDeployMode = 'flanks';
  /** C-FLANK: kierunek natarcia aktywny w toolbarze deploy (osobny od formacji/konnicy). */
  private _deployAttackDirection: AttackDirection = 'front';
  /** Linie glebokosci piechoty / lucznikow (1–3) — osobno od formacji F1/F2/F3. */
  private _deployMeleeLines: DeployLineCount = 1;
  private _deployArcherLines: DeployLineCount = 1;
  /** Rząd przyciskow formacji w pasku deploy (nad rosterem). */
  private _deployFmtRow: HTMLDivElement | null = null;
  /** Przyciski ustawienia konnicy (boki / z tylu). */
  private _deployCavRow: HTMLDivElement | null = null;
  /** C-FLANK: przyciski kierunku natarcia (front / bok / tyl). */
  private _deployDirRow: HTMLDivElement | null = null;
  /** Lewy blok: wybrane formacja + konnica. */
  private _deployToolbarStatus: HTMLDivElement | null = null;
  /** Srodek paska: Formacja / Konnica / Strategia. */
  private _deployToolbarCenter: HTMLDivElement | null = null;
  /** Otwarty dropdown toolbara deploy. */
  private _deployOpenDropdown: 'formation' | 'cavalry' | 'direction' | 'lines' | 'tactics' | 'strategy' | null = null;
  /** Popupy dropdownow toolbara — position:fixed, dzieci document.body (jak popup zebatki). */
  private _deployDropdownPopups: Partial<Record<'formation' | 'cavalry' | 'direction' | 'lines' | 'tactics' | 'strategy', HTMLDivElement>> = {};
  private _deployToolbarDocClick: ((e: MouseEvent) => void) | null = null;
  /** Zadanie #17: pływający klaster Reset + Start walki (prawy dół, WYŁĄCZNIE deploy) — dawny pełnoszerokościowy pasek zlikwidowany. */
  private _deployToolbar: HTMLDivElement | null = null;
  /** Zadanie #17: rządek ikon Formacja/Konnica/Linie/Taktyka/Strategia — pierwszy rząd panelu rosteru. */
  private _deployIconRow: HTMLDivElement | null = null;
  /** Podpowiedz w pasku deploy (legacy — feedback w rosterze). */
  private _deployHint: HTMLDivElement | null = null;
  /** Lewy panel: licznik rozstawionych jednostek. */
  private _deployRosterCount: HTMLDivElement | null = null;
  /** Lewy panel: komunikaty (grupowanie, feedback). */
  private _deployRosterFeedback: HTMLElement | null = null;
  /** Zaznaczenie + Odznacz na pasku deploy (jeden panel sterowania). */
  private _deploySelBar: HTMLDivElement | null = null;
  /** Stopka rosteru deploy — „Zaznaczone: N · Grupa X” (C09 v4). */
  private _deployRosterFooter: HTMLDivElement | null = null;
  /** Ostatni klik — Ctrl/Shift do wielokrotnego zaznaczenia. */
  private _lastClickModifiers = { ctrl: false, shift: false };
  /** Poczatek klikniecia — do rozrozniania klik vs pan. */
  private _pointerDownPos: { x: number; y: number } | null = null;
  // --- BOX-SELECT (ramka zaznaczenia) ---
  private _boxSelectDiv: HTMLDivElement | null = null;
  private _boxSelectStart: { x: number; y: number } | null = null;
  /** Przeciaganie grupy w fazie deploy (kotwica + biezacy cel). */
  private _deployDrag: { anchorCol: number; anchorRow: number; curCol: number; curRow: number } | null = null;
  /** Poczatek kliku / drag przesuniecia w deploy (tylko LPM). */
  private _deployMoveStart: { x: number; y: number; col: number; row: number } | null = null;
  /** Jednostka ATK kliknieta LPM — obsluga na mouseup (toggle grupy / zaznacz). */
  private _deployPickPending: RuntimeBattleUnit | null = null;
  /** Duchy jednostek + ramka rozciagania na mapie. */
  private _deployGhostGroup: THREE.Group | null = null;
  private _deployGhostOwnedMats: THREE.Material[] = [];
  private _deployGhostOwnedGeos: THREE.BufferGeometry[] = [];
  // --- STEROWANIE RECZNIE (faza walki) ---
  /** Tryb recznego sterowania jednostkami gracza. Domyslnie true = RECZNE (C2-FLOW). */
  private _manualMode = true;
  /** Po Start walki: faza planowania (Spacja = rozpocznij turę). */
  private _battleAwaitingOrders = false;
  /**
   * AUTO→RECZNY w trakcie tury: blokuje done()-callbacki starej aktywacji
   * (rAF animacje nie idą przez vTimers) — bez tego jednostki dostają acted=true
   * i _executeUnitsImmediate odrzuca rozkazy gracza.
   */
  private _autoBattleSuspended = false;
  /** Jednostki z rozkazem odlozonym (Ctrl/Shift) — wykonaj na SPACJI. */
  private _queuedOrderUnitIds = new Set<string>();
  /** Zaznaczone jednostki gracza (id). */
  private _selectedUnits = new Set<string>();
  /** Dolny pasek kart jednostek (roster). */
  private _rosterBar: HTMLDivElement | null = null;
  /** Przycisk AUTO/RECZNE w HUD. */
  private _manualBtn: HTMLButtonElement | null = null;
  /** Baner trybu (AUTO/RECZNE). */
  private _modeBanner: HTMLDivElement | null = null;
  /** Meshes obwodek zaznaczenia (jeden ring per jednostka). */
  private _selectionRings = new Map<string, THREE.Mesh>();
  // --- GRUPY (zakres 1-5) ---
  /** Mapa groupId -> zbior id jednostek nalezacych do grupy. */
  private _groups = new Map<string, Set<string>>();
  /** Doktryna / auto-gra per grupa. */
  private _groupMeta = new Map<string, GroupMeta>();
  /** Priorytety celu per klasa jednostki gracza (1→2→3). */
  private static readonly DEFAULT_TARGET_PRIORITIES: Record<BattleUnitClass, BattleUnitClass[]> = {
    mounted: ['mounted', 'ranged', 'melee'],
    ranged:  ['ranged', 'mounted', 'melee'],
    melee:   ['melee', 'ranged', 'mounted'],
  };
  private _targetPriorities: Record<BattleUnitClass, BattleUnitClass[]> = {
    mounted: ['mounted', 'ranged', 'melee'],
    ranged:  ['ranged', 'mounted', 'melee'],
    melee:   ['melee', 'ranged', 'mounted'],
  };
  /** Panel Generała (doktryny + priorytety + blokada). */
  private _generalPanel: HTMLDivElement | null = null;
  private _generalSettings: GeneralSettings = {
    commanderName: 'Dowódca armii',
    blockadeActive: false,
    blockadeCol: null,
  };
  /** Licznik do generowania unikalnych groupId. */
  private _groupCounter = 0;
  /**
   * BŁĄD I (R-BITWA-POWTORKA-I): stan grup (kto jest w jakiej grupie,
   * kto ręcznie rozgrupowany) zapisany na koniec fazy rozstawiania
   * (_endDeployPhase), klucz = bu.id jednostki, wartość = jej groupId W TEJ
   * CHWILI (grupy puste/rozgrupowane jednostki po prostu nie mają wpisu).
   * `null` = brak zapisu (pierwszy deploy tej sesji bitwy) → `_initDeployUI()`
   * używa `_autoGroupDeployByKind`. Po `_replayBattle()` odtwarza TEN zapis.
   */
  private _deployGroupSnapshot: Map<string, string> | null = null;
  /**
   * C-FLANK replay: kierunek natarcia per bu.id z końca fazy rozstawiania —
   * odtwarzany po _replayBattle() razem z _deployGroupSnapshot.
   */
  private _deployAttackDirSnapshot: Map<string, AttackDirection> | null = null;
  /** Zloty marker grupy na mapie (3D) per jednostka. */
  private _groupFrameMarkers = new Map<string, THREE.Group>();
  // --- PROFESSIONAL HUD (TotalWar-style) ---
  /** Gorny pasek HUD (tura, predkosc, morale, straty). */
  private _topBar: HTMLDivElement | null = null;
  /** Label tury w gornym pasku. */
  private _topTurnLbl: HTMLSpanElement | null = null;
  /** Label predkosci w gornym pasku. */
  private _topSpeedLbl: HTMLSpanElement | null = null;
  /** Paski morale armii (gorny pasek). */
  private _topMoraleA: HTMLDivElement | null = null;
  private _topMoraleD: HTMLDivElement | null = null;
  /** Sklad armii w gornym pasku (ikony typow + lacznie). */
  private _topCasATxt: HTMLSpanElement | null = null;
  private _topCasDTxt: HTMLSpanElement | null = null;
  /** Q4: badge pauzy w gornym pasku. */
  private _topPauseBadge: HTMLSpanElement | null = null;
  /** TW v5 §2: panel dowódców (portrety + zegar + przewaga), zastępuje stary topCenter. */
  private _commanderPanel: HTMLDivElement | null = null;
  private _cmdRingA: HTMLDivElement | null = null;
  private _cmdRingD: HTMLDivElement | null = null;
  private _battleClockEl: HTMLDivElement | null = null;
  private _battleClockCaptionEl: HTMLDivElement | null = null;
  private _momentumFillA: HTMLDivElement | null = null;
  private _momentumFillD: HTMLDivElement | null = null;
  private _momentumMarker: HTMLDivElement | null = null;
  private _momentumCaptionEl: HTMLDivElement | null = null;
  /** vNow (zegar wirtualny) w chwili START WALKI — bazowa dla zegara bitwy MM:SS. */
  private _battleStartVNow: number | null = null;
  /** TW v5 §3: przyciski Tempo (pauza/−/+) + AUTO-komputer przy minimapie. */
  private _tempoPauseBtn: HTMLButtonElement | null = null;
  private _tempoMinusBtn: HTMLButtonElement | null = null;
  private _tempoPlusBtn: HTMLButtonElement | null = null;
  private _tempoAutoBtn: HTMLButtonElement | null = null;
  /** Nagłówek „Minimapa · rozstawianie" (deploy, BEZ tempa) — makieta TW v5 §3/klatka 3. */
  private _minimapDeployHeaderRow: HTMLDivElement | null = null;
  /** Rząd Tempo (pauza/−/+/AUTO) — widoczny TYLKO w walce, nie w deployu. */
  private _tempoRow: HTMLDivElement | null = null;
  /** Q2: minimap canvas (lewy-dolny rog). */
  private _minimapCanvas: HTMLCanvasElement | null = null;
  private _minimapWrap: HTMLDivElement | null = null;
  private _minimapDragging = false;
  private _minimapDragStart: { x: number; y: number; camX: number; camZ: number } | null = null;
  /** Q3: hover tooltip (0.3 s delay). */
  private _hoverTooltip: HTMLDivElement | null = null;
  private _hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private _hoverUnit: RuntimeBattleUnit | null = null;
  /** Panel zaznaczonej jednostki (prawy panel rozkazow). */
  private _selPanel: HTMLDivElement | null = null;
  /** C2-Q7 TW: strzalki rozkazow na ziemi (niebieska=ruch, czerwona=atak). */
  private _orderLinesGroup: THREE.Group | null = null;
  private _orderPreviewGroup: THREE.Group | null = null;
  private _queuedOrderArrows: THREE.Group[] = [];
  /** Roster drag: scalanie rannych (Ctrl+M / drag karty). */
  private _rosterDragSourceId: string | null = null;
  /** Mapa id->element karty rostera (per-unit, NIE per-typ). */
  private _unitCards = new Map<string, HTMLDivElement>();
  /** Licznik strat (padli + uciekli) per strona. */
  private _deadCountA = 0;
  private _deadCountD = 0;
  private _routCountA = 0;
  private _routCountD = 0;

  private atk: RuntimeBattleUnit[] = [];
  private def: RuntimeBattleUnit[] = [];
  private occByKey = new Map<string, RuntimeBattleUnit>();
  /** Oryginalne BattleUnit[] — zapisane przy _placeUnits (Reset deploy + replay). */
  private _savedAtkBUs: BattleUnit[] = [];
  private _savedDefBUs: BattleUnit[] = [];
  /** HP na start starcia (mapa → pole bitwy, bez resetu do max). */
  private _startAtkSnaps: BattleUnitBeforeSnap[] = [];
  private _startDefSnaps: BattleUnitBeforeSnap[] = [];

  // --- Siege state ---
  /** The wall mesh group (siegeWall.ts output), or null in non-siege battles. */
  private siegeWallGroup: THREE.Group | null = null;
  /** Column on the battlefield where the siege wall is placed. */
  private siegeWallCol: number = -1;
  /** Column(s) of the gate tile. */
  private siegeGateCol: number = -1;
  /** Row of the gate tile (centre row). */
  private siegeGateRow: number = -1;
  /** Current HP of the gate (starts at GATE_MAX_HP, 0 = breached). */
  private gateHp: number = 0;
  /** Whether the gate has been breached (HP <= 0). */
  private gateOpen: boolean = false;
  /** Row range of the wall on the battlefield (inclusive). */
  private siegeWallRowLo: number = -1;
  private siegeWallRowHi: number = -1;
  /**
   * Obrona multiplier for a defender standing on the wall walkway (onWallWalkway).
   * 1 + cityWallDefenseBonusPercent(opts.siege.builtBuildingIds, ...)/100 --
   * +200% (mur), +300% (mur+Cytadela), +400% (mur+Cytadela+Baszta), decyzja
   * 41B (Maciej 2026-07-25 -- miasto-params.json bonus_obrona_mur_proc /
   * bonus_obrona_cytadela_proc / bonus_obrona_baszta_proc). Set once in the constructor.
   */
  private wallDefenseMult: number = 1;
  /**
   * Ta sama wartość jak wyżej, ale jako "surowy" procent strukturalny
   * (0/200/300/400) zamiast mnożnika — do przekazania jako
   * ResolveCombatOpts.structureDefBonusPct w computeInstantResult() (tryb
   * "Pomiń"), żeby ta ścieżka liczyła bonus muru identycznie jak _singleBlow
   * (C-COMBAT-Q1, Maciej 2026-07-26: „Pomiń" wcześniej w ogóle nie stosował
   * bonusu murów). wallDefenseMult === 1 + wallDefenseTotalProc/100.
   */
  private wallDefenseTotalProc: number = 0;
  /**
   * C-COMBAT-Q2 (Maciej 2026-07-26): true when the DEFENDER is defending a
   * CITY hex (walled or not) -- see BattleOpts.cityDefense doc for the full
   * rationale. `opts.siege != null` always implies this (every real siege
   * caller today only ever sets `siege` for an actual walled city), so this
   * is the OR of the explicit flag and siege presence. Set once in the
   * constructor; gates cityGatedTerrainMultiplier in _singleBlow /
   * computeInstantResult ("Pomiń").
   */
  private isCityDefenseBattle: boolean = false;
  /**
   * SIEGE v2: set of row values where a friendly siege tower has reached the
   * wall base (col = siegeWallCol-1). Attacking infantry adjacent to a tower
   * at these rows may "climb" onto the wall walkway.
   */
  private towerAtWallRows = new Set<number>();
  /** HP per-tile muru (klucz: row). 0 = wyburzony. */
  private wallTileHp = new Map<number, number>();
  /** Max HP pojedynczego kafla muru. */
  private static readonly WALL_TILE_HP = 640;
  /** HUD: pasek HP bramy + kafla muru. */
  private siegeHudDiv: HTMLDivElement | null = null;
  /** Ostatnio atakowany rząd muru (do wyświetlania HP). */
  private lastAttackedWallRow: number = -1;

  private ownedMats: THREE.Material[]       = [];
  private ownedGeos: THREE.BufferGeometry[] = [];

  private animFrameId: number | null = null;
  private started  = false;
  private finished = false;

  // True while a single action (move/attack) animation is running; the turn
  // scheduler waits for it before activating the next unit.
  private busy = false;

  // -------------------------------------------------------------------------
  // BATTLE SPEED (time-scale). Every piece of battle PACING -- tile walks,
  // melee lunges, projectile flight, the _schedule() gaps between actions /
  // turns, death fades and damage labels -- is timed against a VIRTUAL clock
  // (_vNow) instead of the wall clock. The virtual clock advances once per
  // render frame by (wall delta) * SPEED, so multiplying SPEED simply makes
  // virtual time pass faster: the WHOLE battle plays N times quicker while
  // every animation, hit moment and pause keeps its exact relative shape.
  //
  // Crucially this is PURELY a time-scale: resolveCombat / _singleBlow / the
  // hit rolls / damage math never see the speed factor, so the OUTCOME of a
  // battle is identical at 1x / 2x / 4x / 8x / 16x -- only the playback rate
  // changes. Default 1x. The factor can be changed LIVE mid-battle via the
  // overlay button (cycles 1 -> 2 -> 4 -> 8 -> 16 -> 1) and is mirrored by an
  // always-visible on-map HUD label ("Predkosc: Nx").
  //
  // ROOT-CAUSE FIX (speed "didn't work"): the previous _schedule() polled with
  // requestAnimationFrame -- a scheduled gap only resolved when a frame ran, so
  // it could fire at most ONCE per frame (~60/s) no matter the multiplier. The
  // continuous animations (interpolated off vNow) sped up, but the DISCRETE
  // pacing -- the gaps between blows and the turn transitions, which form a
  // self-rescheduling chain -- was frame-capped, so past ~2-4x the battle
  // stopped getting faster. Timers now live in a VIRTUAL-TIME QUEUE drained
  // each frame (_drainTimers): every timer whose due-time has passed within the
  // frame's virtual budget fires THAT frame, with an internal cursor advancing
  // to each due time so a chain of short gaps catches up fully. Throughput now
  // scales linearly to 16x (verified in a /tmp sim).
  private static readonly SPEED_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512] as const;
  private speedIdx   = 0;            // index into SPEED_STEPS; 0 => 1x default
  private speedMul   = 1;            // current multiplier (SPEED_STEPS[speedIdx])
  private vNow       = 0;            // virtual (speed-scaled) clock in ms
  private vLastWall  = 0;            // last wall-clock timestamp used to advance vNow
  private paused = false;            // P-key pause: when true the virtual clock is frozen
  private _stallSig = ''; private _stallTurns = 0; private _stalled = false;
  private pauseHud: HTMLDivElement | null = null;
  private muteHud:  HTMLDivElement | null = null;  // tiny audio on/off indicator
  private speedBtn:  HTMLButtonElement | null = null; // overlay speed control (cycle button)
  private speedHud:  HTMLDivElement   | null = null;  // always-visible on-map speed label
  // Virtual-time timer queue (replaces per-callback rAF polling). Each entry
  // fires its cb when vNow >= due; _drainTimers() empties it every frame.
  private vTimers: { due: number; cb: () => void; id: number }[] = [];
  private vTimerSeq = 0;             // monotonic id for stable ordering of equal-due timers

  // CHANGE2: master visibility toggle for ALL over-head stat bars (morale/ammo/
  // HP), flipped by the "H" key. Default true (bars shown). When false every
  // living unit's billboard bar GROUP is hidden; toggling back on restores it
  // (dead/removed units stay hidden -- they are skipped). Per-bar visibility
  // (e.g. ammo only for ranged) lives on the child meshes and is untouched, so
  // hiding/showing the parent group preserves the ammo-only-for-ranged rule.
  private barsVisible = true;

  // BATTLE LOG panel (top-RIGHT of the overlay -- the speed HUD + the cycle
  // buttons sit top-LEFT / bottom, so the right edge is free). Shows the last
  // CLASH_LOG_MAX combat clashes, NEWEST on top: "<atk name> (side) -> <def
  // name> (side): -N HP" with "(padl)" if the blow killed the defender or
  // "(rout)" if it broke its morale. clashLogEntries is the rolling buffer
  // (capped at CLASH_LOG_MAX, newest first); _renderClashLog repaints the DOM.
  private clashLog:        HTMLDivElement | null = null;
  private clashLogEntries: string[]             = [];

  /** Zębatka ustawień top-right (TW v5 §2) — zastępuje prawy rail: Muzyka/Efekty/Paski/Statystyki/Pomoc. */
  private _settingsGearWrap: HTMLDivElement | null = null;
  private _settingsPopup: HTMLDivElement | null = null;
  private _settingsMusicToggle: ((v: boolean) => void) | null = null;
  private _settingsSfxToggle: ((v: boolean) => void) | null = null;
  private _settingsBarsToggle: ((v: boolean) => void) | null = null;
  private readonly _onSettingsDocClick = (e: MouseEvent): void => {
    if (!this._settingsPopup || this._settingsPopup.style.display === 'none') return;
    const t = e.target as Node;
    // Popup jest teraz osobnym elementem (this.overlay), NIE dzieckiem gearWrap
    // (patrz komentarz przy budowie) — sprawdź oba, żeby klik WEWNĄTRZ popupu go nie zamykał.
    const insideGear = this._settingsGearWrap?.contains(t) ?? false;
    const insidePopup = this._settingsPopup.contains(t);
    if (!insideGear && !insidePopup) {
      this._settingsPopup.style.display = 'none';
    }
  };
  private _attackerCivLabel = 'Gracz';
  private _defenderCivLabel = 'Przeciwnik';
  private _attackerSideLabel = '';
  private _defenderSideLabel = '';
  private _attackerCivIconId = 'grecy';
  private _defenderCivIconId = 'grecy';
  private _attackerLeaderName: string | null = null;
  private _defenderLeaderName: string | null = null;
  /** Epoka per strona (1/2/3) -- portret wladcy w medalionie (leaderPortraits.ts). */
  private _attackerEra = 1;
  private _defenderEra = 1;

  // R-MP-PORTRET (2026-07-24) -- miasto-panstwo klastra: medalion wraca do symbolu kultury.
  private _attackerIsCityState = false;
  private _defenderIsCityState = false;
  // TEMAT 11 (2026-07-24) -- frakcja barbarzyncow: medalion dostaje wlasny sygnet (czaszka).
  private _attackerIsBarbarian = false;
  private _defenderIsBarbarian = false;
  /** Scroll kontener kart w lewym panelu deploy. */
  private _deployRosterScroll: HTMLDivElement | null = null;

  private log:        string[]                            = [];
  private onFinishCb: ((r: BattleResult) => void) | null  = null;
  private onCancelCb: (() => void) | null                 = null;
  // TASK D end-of-battle freeze screen state.
  private _endScreenShown = false;
  /** Ukrycie dolnego toolbara / raila pod ekranem zwycięstwa. */
  private _battleChromeSuppressed = false;
  /** Ekran podsumowania (endScreen1E) — ukrywany gdy otwarte Szczegoly. */
  private _endScreenBackdrop: HTMLDivElement | null = null;
  private _endScreenWrap: HTMLDivElement | null = null;
  /** Overlay Szczegoly bitwy (jeden na raz). */
  private _battleStatsOpen = false;
  /** C-23 „Szczegóły bitwy" (endDetails1E, TW v5) — otwierany z ekranu końca (C-12). */
  private _endDetailsEl: HTMLDivElement | null = null;
  private _endWinner: 'atakujacy' | 'obronca' | null = null;
  private _endSurvivors: BattleUnit[] = [];

  private floatLabels:  FloatLabel[]        = [];
  private fadingUnits:  RuntimeBattleUnit[] = [];
  // FUTURE HOOK (data only -- no behaviour now): identity of every unit that has
  // routed, so a future "general rally" feature could bring routed units back.
  // TODO: general rally recovery -- consume this list to respawn rallied units.
  private routedUnits:  { typeId: string; side: 'atk' | 'def'; owner: number }[] = [];
  private projectiles:  { mesh: THREE.Object3D; from: THREE.Vector3; to: THREE.Vector3; t0: number; dur: number; geos: THREE.BufferGeometry[]; mats: THREE.Material[] }[] = [];

  // resolveCombat context
  private terrain:     string;
  private _battleData: Record<string, unknown> = {};
  private terrainData: any[];
  private counters:    any[];
  private attackerCivBonusy: readonly CivBonusEntry[] = [];
  private defenderCivBonusy: readonly CivBonusEntry[] = [];
  private armyHungerStatMult = 0.75;
  private goldDeficitStatMult = 0.75;
  private attackerDifficultyCombatMult = 1;
  private defenderDifficultyCombatMult = 1;

  // Procedural per-tile battle terrain (B8). Drives rendering, per-tile move
  // cost / passability and the per-tile defender terrain fed to the combat math.
  private terrainMap:  BattleTerrainMap;
  // Pustynia preset: swap the floor/hill/grass palette for sand tones (see
  // _buildBattlefield). Set from opts.worldTerrain / ?bt= debug override.
  private _desertPalette = false;

  // Turn loop bookkeeping.
  // A TURN is one pass over EVERY living unit (both sides interleaved by
  // initiative). turnOrder is the snapshot of units to act this turn; turnIdx
  // walks it. activeSide is kept only for the opening hint.
  private activeSide: 'atk' | 'def' = 'atk';
  private roundNo = 0;
  private turnOrder: RuntimeBattleUnit[] = [];
  private turnIdx = 0;

  // Engagements that have already traded at least one blow.
  // Keyed by "attackerId>defenderId" so the charge bonus (Uderzenie) is
  // applied ONLY on the very first blow an attacker lands on a given target.
  private engaged = new Set<string>();

  // -------------------------------------------------------------------------
  constructor(opts: BattleOpts) {
    this.onCancelCb  = opts.onCancel ?? null;
    this.terrain     = opts.teren;
    const d: any     = opts.data ?? {};
    this._battleData = d;
    this.terrainData = d.terrainCombat ?? d.terrainData ?? [];
    this.counters    = normCounters(d.counters ?? []);
    this.attackerCivBonusy = opts.attackerCivBonusy ?? [];
    this.defenderCivBonusy = opts.defenderCivBonusy ?? [];
    this.armyHungerStatMult = opts.armyHungerStatMult ?? 0.75;
    this.goldDeficitStatMult = opts.goldDeficitStatMult ?? 0.75;
    this.attackerDifficultyCombatMult = opts.attackerDifficultyCombatMult ?? 1;
    this.defenderDifficultyCombatMult = opts.defenderDifficultyCombatMult ?? 1;
    this._attackerCivLabel = opts.attackerCivLabel?.trim() || 'Gracz';
    this._defenderCivLabel = opts.defenderCivLabel?.trim() || 'Przeciwnik';
    this._attackerSideLabel = opts.attackerSideLabel?.trim() || '';
    // C-COMBAT-Q2 (Maciej 2026-07-26): patrz doc na polu isCityDefenseBattle.
    this.isCityDefenseBattle = opts.cityDefense === true || opts.siege != null;
    // Wall/Cytadela/Baszta defence multiplier (Maciej 2026-07-25, rozszerzone
    // 41B) -- data-driven from miasto-params.json, not hardcoded. +200% (mur),
    // +300% (mur+Cytadela) or +400% (mur+Cytadela+Baszta). Scalone w
    // cityWallDefenseBonusPercent (game/city-defense.ts) -- ta sama funkcja co
    // main.ts structureDefenseBonusFor (mapa swiata), zeby oba tryby liczyly to samo.
    {
      const murProc = (miastoParamsData as any)?.bonus_obrona_mur_proc?.wartosc ?? 200;
      const cytadelaProc = (miastoParamsData as any)?.bonus_obrona_cytadela_proc?.wartosc ?? 100;
      const basztaProc = (miastoParamsData as any)?.bonus_obrona_baszta_proc?.wartosc ?? 100;
      const palisadaProc = (miastoParamsData as any)?.bonus_obrona_palisada_proc?.wartosc ?? 100;
      const totalProc = cityWallDefenseBonusPercent(opts.siege?.builtBuildingIds, {
        mur: murProc, cytadela: cytadelaProc, baszta: basztaProc, palisada: palisadaProc,
      });
      this.wallDefenseMult = 1 + totalProc / 100;
      this.wallDefenseTotalProc = totalProc;
    }
    this._defenderSideLabel = opts.defenderSideLabel?.trim() || '';
    const civRows: readonly { Cywilizacja?: string; ikonaId?: string }[] = d.cywilizacje ?? [];
    this._attackerCivIconId = opts.attackerCivIconId
      ?? civIconIdFromLabel(civRows, this._attackerCivLabel);
    this._defenderCivIconId = opts.defenderCivIconId
      ?? civIconIdFromLabel(civRows, this._defenderCivLabel);
    this._attackerLeaderName = opts.attackerLeaderName ?? null;
    this._defenderLeaderName = opts.defenderLeaderName ?? null;
    this._attackerEra = clampEra(opts.attackerEra);
    this._defenderEra = clampEra(opts.defenderEra);
    this._attackerIsCityState = opts.attackerIsCityState === true;
    this._defenderIsCityState = opts.defenderIsCityState === true;
    this._attackerIsBarbarian = opts.attackerIsBarbarian === true;
    this._defenderIsBarbarian = opts.defenderIsBarbarian === true;

    // World-hex-derived terrain preset (forest/hills/river density + palette).
    // ?bt=... (debug/screenshot only) wins over opts.worldTerrain; both are
    // optional -- with neither, presetForWorldTerrain() returns DEFAULT_PRESET
    // and generation is identical to before this feature existed.
    const worldTerrain = debugWorldTerrainOverride() ?? opts.worldTerrain;
    const terrainPreset = presetForWorldTerrain(worldTerrain);
    this._desertPalette = terrainPreset.desertPalette;
    // presetActive gates BOTH battleSafeCols() below and _carveBattleBox():
    // true whenever a world-hex terrain (or the ?bt= debug override) shaped
    // this battle, false for every legacy/no-worldTerrain call -- which keeps
    // the legacy carve (and therefore the legacy terrain) bit-for-bit
    // unchanged (owner correction 2026-07-22 #3).
    const presetActive = worldTerrain != null;

    // Deterministic procedural terrain for the big square field. Seeded from the
    // battle terrain name so the same matchup terrain reproduces every run.
    this.terrainMap = generateBattleTerrain({
      cols:         BF_COLS,
      rows:         BF_ROWS,
      seed:         'bf:' + opts.teren,
      deployMargin: DEPLOY_MARGIN,
      rowMargin:    PLAY_ROW0,
      preset:       terrainPreset,
      // Always passed: only consulted by generator branches gated on preset
      // flags (edgeRocks), false on DEFAULT_PRESET, so this is a no-op for
      // every legacy/no-worldTerrain call (verified bit-for-bit, see report).
      safeCols:     battleSafeCols(presetActive),
    });
    // Flatten the deploy ranks + the clash corridor to clean plains so the two
    // even lines stand on flat, even ground and reach melee fast; terrain stays
    // everywhere else (flanks AND, for preset battles, most of the no-man's-land
    // too -- see deployClearRanksFor) as a backdrop.
    this._carveBattleBox(presetActive);
    this._fencePlayableZone();

    // SIEGE MODE: carve wall tiles into terrainMap before the scene is built.
    if (opts.siege) {
      this._carveWallTiles();
    }

    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position:       'fixed',
      inset:          '0',
      zIndex:         '9999',
      background:     'rgba(0,0,0,0.88)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'flex-start',
    });
    document.body.appendChild(this.overlay);
    const titleBar = document.createElement('div');
    Object.assign(titleBar.style, {
      color:         '#f0d080',
      fontFamily:    'sans-serif',
      fontSize:      '18px',
      fontWeight:    'bold',
      padding:       '10px 20px 0',
      textAlign:     'center',
      textShadow:    '0 1px 4px #000',
      letterSpacing: '0.04em',
    });
    titleBar.textContent = 'Bitwa Automatyczna -- ' + opts.teren;
    titleBar.style.display = 'none';
    this.overlay.appendChild(titleBar);

    this.hint = document.createElement('div');
    Object.assign(this.hint.style, {
      color:      '#cfe0ff',
      fontFamily: 'sans-serif',
      fontSize:   '13px',
      padding:    '2px 20px 6px',
      textAlign:  'center',
      textShadow: '0 1px 3px #000',
      minHeight:  '16px',
    });
    this.hint.textContent = 'Armie ustawiaja sie naprzeciw siebie...';
    this.hint.style.display = 'none';
    this.overlay.appendChild(this.hint);

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      flex:     '1',
      width:    '100%',
      display:  'block',
      position: 'relative',
      outline:  'none',
    });
    this.canvas.tabIndex = 0;
    this.overlay.appendChild(this.canvas);

    // ALWAYS-VISIBLE on-map SPEED indicator (top-left HUD over the battlefield).
    // Shows the live multiplier ("Predkosc: Nx") so the player can read the
    // current battle speed on the map at all times, separate from the cycle
    // button at the bottom. Updated by _setSpeedIdx.
    const speedHud = document.createElement('div');
    Object.assign(speedHud.style, {
      position:      'absolute',
      top:           BATTLE_HEADER_H + 4 + 'px',
      left:          '14px',
      display:       'none',
      padding:       '4px 12px',
      background:    'rgba(20,30,20,0.72)',
      color:         '#7be08a',
      fontFamily:    'sans-serif',
      fontSize:      '15px',
      fontWeight:    'bold',
      borderRadius:  '5px',
      border:        '1px solid rgba(123,224,138,0.4)',
      textShadow:    '0 1px 3px #000',
      letterSpacing: '0.04em',
      pointerEvents: 'none',
      zIndex:        '10005',
    });
    this.overlay.appendChild(speedHud);
    this.speedHud = speedHud;

    // PAUSE badge (hidden until P / Pauza button): a clear frozen-state indicator.
    const pauseHud = document.createElement('div');
    Object.assign(pauseHud.style, {
      position: 'absolute', top: BATTLE_HEADER_H + 4 + 'px', left: '50%', transform: 'translateX(-50%)',
      padding: '5px 16px', background: 'rgba(60,20,20,0.85)', color: '#ffd54a',
      fontFamily: 'sans-serif', fontSize: '17px', fontWeight: 'bold',
      borderRadius: '6px', border: '1px solid rgba(255,213,74,0.6)',
      textShadow: '0 1px 3px #000', letterSpacing: '0.05em',
      pointerEvents: 'none', zIndex: '10006', display: 'none',
    });
    pauseHud.textContent = '|| PAUZA (P)';
    this.overlay.appendChild(pauseHud);
    this.pauseHud = pauseHud;

    // AUDIO indicator (tiny): shows mute state under the speed HUD. Audio only
    // actually starts after the first user gesture (autoplay policy).
    const muteHud = document.createElement('div');
    Object.assign(muteHud.style, {
      position: 'absolute', top: BATTLE_HEADER_H + 38 + 'px', left: '14px',
      display: 'none',
      padding: '2px 10px', background: 'rgba(20,30,20,0.6)', color: '#9fb6c9',
      fontFamily: 'sans-serif', fontSize: '11px', borderRadius: '4px',
      border: '1px solid rgba(159,182,201,0.3)', textShadow: '0 1px 2px #000',
      pointerEvents: 'none', zIndex: '10005',
    });
    muteHud.textContent = 'Dzwiek: WL (M)';
    this.overlay.appendChild(muteHud);
    this.muteHud = muteHud;

    // BATTLE LOG panel -- top-RIGHT of the battlefield (the speed HUD is top-left
    // and the cycle/skip/exit buttons are along the bottom, so the right edge is
    // clear). Lists the last CLASH_LOG_MAX clashes, newest on top; small font,
    // semi-transparent dark bg, non-interactive (pointer-events off) so it never
    // eats a drag/zoom on the canvas. Repainted live by _renderClashLog.
    const clashLog = document.createElement('div');
    Object.assign(clashLog.style, {
      position:      'absolute',
      top:           (BATTLE_HEADER_H + 6) + 'px',
      right:         '52px',
      width:         '168px',
      maxHeight:     '42%',
      overflow:      'hidden',
      padding:       '6px 9px',
      background:    'rgba(12,12,16,0.66)',
      color:         '#e8e8ec',
      fontFamily:    'monospace, sans-serif',
      fontSize:      '11px',
      lineHeight:    '1.45',
      borderRadius:  '5px',
      border:        '1px solid rgba(255,255,255,0.16)',
      textShadow:    '0 1px 2px #000',
      pointerEvents: 'none',
      zIndex:        '10005',
      whiteSpace:    'normal',
      wordBreak:     'break-word',
      display:       'none',
    });
    this.overlay.appendChild(clashLog);
    this.clashLog = clashLog;
    this._renderClashLog(); // paint the empty-state header

    // GORNY PASEK: faza / predkosc / sklad armii (pelna szerokosc) — nad paskiem mocy.
    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
      position:       'fixed',
      top:            '8px',
      left:           '20px',
      right:          '88px',
      height:         BATTLE_TOP_BAR_H + 'px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '8px 18px',
      zIndex:         '10010',
      pointerEvents:  'none',
      gap:            '8px',
      fontFamily:     HUD_FONT,
      boxSizing:      'border-box',
    });
    applyTopBar1E(topBar);
    // BŁĄD E (właściciel, 2026-07-24): usuń chrome KONTENERA topBar (tło/ramka/
    // cień/blur wspólne dla całego wiersza) — ma zostawać wygląd "nowoczesny",
    // same przyciski/etykiety uniesione nad mapą, BEZ pudełka. Każdy przycisk w
    // topLeft/topRight ma JUŻ własną, osobną otoczkę (speedLbl/pauseBadge/
    // btnGear/btnSkipTop mają własne tło+ramkę; btnTopExit był i zostaje
    // transparentny z czerwoną ramką) — usuwane jest wyłącznie WSPÓLNE tło tego
    // długiego paska, nie otoczki pojedynczych elementów. Środkowy panel
    // dowódców (commanderPanel/applyCommanderPanel1E) jest OSOBNYM elementem i
    // NIE jest tu ruszany.
    Object.assign(topBar.style, {
      background:    'transparent',
      backdropFilter: 'none',
      border:        'none',
      boxShadow:     'none',
      borderRadius:  '0',
    });
    this.overlay.appendChild(topBar);
    this._topBar = topBar;

    // Lewa czesc: faza + predkosc
    const topLeft = document.createElement('div');
    Object.assign(topLeft.style, { display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' });
    topBar.appendChild(topLeft);

    const turnLbl = document.createElement('span');
    Object.assign(turnLbl.style, {
      color: HUD_GOLD, fontFamily: BATTLE_FONT_TITLE, fontSize: '18px', fontWeight: 'bold',
      letterSpacing: '0.04em',
      // BŁĄD E: topBar stracił wspólne tło (patrz wyżej) — ten label jest jedynym
      // elementem topLeft BEZ własnej otoczki/pigułki, więc dopisujemy cień, żeby
      // zostać czytelnym nad jasną mapą zamiast pełnego panelu.
      textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.6)',
    });
    turnLbl.textContent = 'Przygotowanie';
    topLeft.appendChild(turnLbl);
    this._topTurnLbl = turnLbl;

    const civEmblem = document.createElement('div');
    civEmblem.id = 'battle-top-civ-emblem';
    Object.assign(civEmblem.style, {
      width: '40px', height: '40px', borderRadius: '50%', flexShrink: '0',
      background: 'radial-gradient(circle at 38% 30%,#2a2416,#12100a)',
      border: `2px solid ${BATTLE_GOLD}`,
      display: 'none', alignItems: 'center', justifyContent: 'center',
      color: '#f4e6a8', lineHeight: '0',
    });
    civEmblem.innerHTML = this._attackerIsBarbarian
      ? brandIconSvg('chip-death', 24)
      : civIconSvg(this._attackerCivIconId, 24);
    topLeft.insertBefore(civEmblem, turnLbl);

    const speedLbl = document.createElement('span');
    Object.assign(speedLbl.style, {
      color: HUD_TEXT, fontFamily: HUD_FONT, fontSize: '13px', fontWeight: 'bold',
      background: 'rgba(0,0,0,0.35)', padding: '4px 10px', borderRadius: '8px',
      border: '1px solid ' + HUD_GOLD_DIM,
    });
    speedLbl.textContent = 'x1';
    topLeft.appendChild(speedLbl);
    this._topSpeedLbl = speedLbl;

    const pauseBadge = document.createElement('span');
    Object.assign(pauseBadge.style, {
      display: 'none', color: HUD_GOLD, fontFamily: HUD_FONT, fontSize: '11px', fontWeight: 'bold',
      background: 'rgba(80,30,30,0.75)', padding: '2px 8px', borderRadius: '4px',
      border: '1px solid ' + HUD_GOLD_DIM, letterSpacing: '0.06em',
    });
    pauseBadge.textContent = '|| PAUZA';
    topLeft.appendChild(pauseBadge);
    this._topPauseBadge = pauseBadge;

    this._topMoraleA = null;
    this._topMoraleD = null;

    // ================= TW v5 SS2: PANEL DOWODCOW (portrety + zegar + przewaga) =================
    // Zastepuje stary topCenter (Ty/skrzyzowane miecze/Wrog) - panel niezalezny,
    // wysrodkowany nad polem, ~70%+blur wg makiety (nie zyje wewnatrz topBar,
    // zeby miec wlasna wysokosc niezalezna od BATTLE_TOP_BAR_H).
    const commanderPanel = document.createElement('div');
    Object.assign(commanderPanel.style, {
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '10012',
      display: 'flex',
      alignItems: 'stretch',
      pointerEvents: 'none',
      maxWidth: 'min(760px, calc(100% - 360px))',
    });
    applyCommanderPanel1E(commanderPanel);
    this.overlay.appendChild(commanderPanel);
    this._commanderPanel = commanderPanel;

    const mkCommanderCard = (side: 'atk' | 'def', left: boolean): void => {
      const isAtk = side === 'atk';
      const civLabel = isAtk ? this._attackerCivLabel : this._defenderCivLabel;
      const roleLabel = isAtk ? 'atakujacy' : 'obronca';
      const sideColor = this._factionColor(side);
      const card = document.createElement('div');
      Object.assign(card.style, {
        display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 16px',
        flexDirection: left ? 'row' : 'row-reverse',
      });
      const portraitWrap = document.createElement('div');
      Object.assign(portraitWrap.style, { position: 'relative', width: '52px', height: '52px', flexShrink: '0' });
      const ring = document.createElement('div');
      Object.assign(ring.style, { position: 'absolute', inset: '0', lineHeight: '0' });
      ring.innerHTML = commanderPortraitRingSvg(1);
      portraitWrap.appendChild(ring);
      const medallion = document.createElement('span');
      Object.assign(medallion.style, {
        position: 'absolute', inset: '5px', borderRadius: '50%',
        background: sideColor === BATTLE_PLAYER
          ? 'radial-gradient(circle at 38% 30%,#22314c,#0c1626)'
          : 'radial-gradient(circle at 38% 30%,#3a1c1c,#160a0a)',
        border: `2px solid ${sideColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: this._factionTextColor(side), lineHeight: '0',
      });
      const civIconId = isAtk ? this._attackerCivIconId : this._defenderCivIconId;
      const era = isAtk ? this._attackerEra : this._defenderEra;
      const isCityState = isAtk ? this._attackerIsCityState : this._defenderIsCityState;
      const isBarbarianSide = isAtk ? this._attackerIsBarbarian : this._defenderIsBarbarian;
      // R-MP-PORTRET: miasto-panstwo NIGDY nie dostaje portretu-zdjecia wladcy glownej
      // cywilizacji -- wraca do ikony-symbolu kultury (civIconSvg), nie do generycznej
      // ikony PB_SVG.commander, zeby bylo widac KTOREJ kultury to MP.
      // TEMAT 11: barbarzyncy tez NIGDY nie dostaja portretu -- ani nawet ikony-symbolu
      // cywilizacji (civIconId bywa fallbackiem 'grecy' -- brak prawdziwej kultury), tylko
      // wlasny sygnet (czaszka). Sprawdzane PRZED isCityState.
      const portraitUrl = (isBarbarianSide || isCityState) ? null : leaderPortraitUrl(civIconId, era);
      if (portraitUrl) {
        // Portret wladcy (docs/.../PORTRETY-WLADCOW-2026-07-23) -- obwodka/tlo medalionu
        // (border + gradient ustawione powyzej) zostaja, tylko srodek to zdjecie zamiast ikony.
        const img = document.createElement('img');
        img.src = portraitUrl;
        img.alt = '';
        Object.assign(img.style, {
          width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block',
        });
        medallion.appendChild(img);
      } else if (isBarbarianSide) {
        medallion.innerHTML = brandIconSvg('chip-death', 22);
        const medallionSvg = medallion.querySelector('svg');
        if (medallionSvg) { medallionSvg.setAttribute('width', '22'); medallionSvg.setAttribute('height', '22'); }
      } else if (isCityState) {
        medallion.innerHTML = civIconSvg(civIconId, 22);
        const medallionSvg = medallion.querySelector('svg');
        if (medallionSvg) { medallionSvg.setAttribute('width', '22'); medallionSvg.setAttribute('height', '22'); }
      } else {
        // Fallback obowiazkowy: brak portretu (np. epoka bez pliku i bez wczesniejszej) ->
        // dotychczasowa ikona SVG dowodcy, bez zmian.
        medallion.innerHTML = PB_SVG.commander;
        const medallionSvg = medallion.querySelector('svg');
        if (medallionSvg) { medallionSvg.setAttribute('width', '22'); medallionSvg.setAttribute('height', '22'); }
      }
      portraitWrap.appendChild(medallion);
      card.appendChild(portraitWrap);

      const textCol = document.createElement('div');
      Object.assign(textCol.style, { textAlign: left ? 'left' : 'right', minWidth: '0' });
      const nameLbl = document.createElement('div');
      Object.assign(nameLbl.style, {
        fontFamily: BATTLE_FONT_TITLE, fontSize: '14px',
        color: this._factionTextColor(side), lineHeight: '1.15', whiteSpace: 'nowrap',
      });
      nameLbl.textContent = civLabel;
      textCol.appendChild(nameLbl);
      // C-BITWA-WLADCA=B: imię przydzielone per właściciel (pula 10/civ) ma pierwszeństwo;
      // fallback do imienia per-epoka gdy brak (np. brak puli dla cywilizacji).
      const leaderOverride = isAtk ? this._attackerLeaderName : this._defenderLeaderName;
      const leader = isBarbarianSide ? null : (leaderOverride ?? leaderName(civIconId, era));
      if (leader) {
        const leaderLbl = document.createElement('div');
        Object.assign(leaderLbl.style, { fontSize: '10px', fontStyle: 'italic', color: BATTLE_TEXT_DIM, whiteSpace: 'nowrap' });
        leaderLbl.textContent = leader;
        textCol.appendChild(leaderLbl);
      }
      const roleLbl = document.createElement('div');
      Object.assign(roleLbl.style, { fontSize: '10px', color: BATTLE_TEXT_DIM, marginBottom: '4px', whiteSpace: 'nowrap' });
      roleLbl.textContent = roleLabel;
      textCol.appendChild(roleLbl);
      const countsEl = document.createElement('div');
      Object.assign(countsEl.style, { whiteSpace: 'nowrap' });
      textCol.appendChild(countsEl);
      card.appendChild(textCol);

      commanderPanel.appendChild(card);
      if (isAtk) {
        this._cmdRingA = ring;
        this._topCasATxt = countsEl as unknown as HTMLSpanElement;
      } else {
        this._cmdRingD = ring;
        this._topCasDTxt = countsEl as unknown as HTMLSpanElement;
      }
    };
    const playerSideForHud = this._playerControlSide();
    mkCommanderCard(playerSideForHud, true);

    // Centrum: zegar bitwy + pasek przewagi (SS2 - podlaczony do istniejacego
    // zrodla paska mocy, TYLKO nowy widok; stary pelnoszerokosciowy pasek
    // "Ostatnie starcia" znika, dane (army-morale ratio) sa te same).
    const clockCell = document.createElement('div');
    Object.assign(clockCell.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '10px 22px',
      borderLeft: '1px solid rgba(232,216,138,0.18)',
      borderRight: '1px solid rgba(232,216,138,0.18)',
      background: 'linear-gradient(180deg,rgba(232,216,138,0.06),transparent)',
      minWidth: '272px',
    });
    const clockEl = document.createElement('div');
    Object.assign(clockEl.style, {
      fontFamily: BATTLE_FONT_TITLE, fontSize: '26px', color: '#f4e6a8',
      letterSpacing: '0.04em', lineHeight: '1', textShadow: '0 0 14px rgba(232,216,138,0.35)',
      fontVariantNumeric: 'tabular-nums',
    });
    clockEl.textContent = '00:00';
    clockCell.appendChild(clockEl);
    this._battleClockEl = clockEl;
    const clockCaption = document.createElement('div');
    Object.assign(clockCaption.style, {
      fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase',
      color: BATTLE_TEXT_DIM, margin: '3px 0 7px', whiteSpace: 'nowrap',
    });
    clockCaption.textContent = 'Start po rozstawieniu';
    clockCell.appendChild(clockCaption);
    this._battleClockCaptionEl = clockCaption;

    const momentumTrack = document.createElement('div');
    Object.assign(momentumTrack.style, {
      position: 'relative', width: '210px', height: '12px', borderRadius: '7px',
      overflow: 'hidden', display: 'flex',
      border: '1px solid rgba(232,216,138,0.4)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
    });
    const momentumFillA = document.createElement('div');
    Object.assign(momentumFillA.style, { width: '50%', background: 'linear-gradient(90deg,#2f5aa8,#5a9bd4)' });
    const momentumFillD = document.createElement('div');
    Object.assign(momentumFillD.style, { flex: '1', background: 'linear-gradient(90deg,#8a3232,#c84040)' });
    const momentumMarker = document.createElement('div');
    Object.assign(momentumMarker.style, {
      position: 'absolute', left: '50%', top: '-2px', bottom: '-2px', width: '3px',
      background: '#f4e6a8', boxShadow: '0 0 8px rgba(232,216,138,0.9)', transform: 'translateX(-50%)',
    });
    momentumTrack.appendChild(momentumFillA);
    momentumTrack.appendChild(momentumFillD);
    momentumTrack.appendChild(momentumMarker);
    clockCell.appendChild(momentumTrack);
    this._momentumFillA = momentumFillA;
    this._momentumFillD = momentumFillD;
    this._momentumMarker = momentumMarker;

    const momentumCaption = document.createElement('div');
    Object.assign(momentumCaption.style, {
      fontSize: '10px', color: '#c8b898', marginTop: '6px', letterSpacing: '0.02em',
      whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
    });
    momentumCaption.innerHTML = 'Szacunkowa przewaga: <b style="color:' + this._factionTextColor(playerSideForHud) + '">50% Ty</b> \u00B7 <b style="color:' + this._factionTextColor(playerSideForHud === 'atk' ? 'def' : 'atk') + '">50% wr\u00F3g</b>';
    clockCell.appendChild(momentumCaption);
    this._momentumCaptionEl = momentumCaption;

    commanderPanel.appendChild(clockCell);
    mkCommanderCard(playerSideForHud === 'atk' ? 'def' : 'atk', false);

    // Prawa czesc gornego paska (TW v5 \u00a72 \u2014 rail 56px zlikwidowany, wszystko tu):
    // zebatka ustawien (popup Muzyka/Efekty/Paski/Statystyki/Pomoc) + Pomin + Wycofaj sie.
    const topRight = document.createElement('div');
    Object.assign(topRight.style, {
      display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: '140px',
      justifyContent: 'flex-end', pointerEvents: 'auto',
    });

    // --- Zebatka ustawien: popup Muzyka / Efekty dzwiekowe / Paski HP-Morale / Statystyki / Pomoc ---
    // UWAGA: popup NIE zyje wewnatrz topBar (z-index 10010) — panel dowodcow ma
    // 10012 i renderowalby sie NAD popupem (obcinajac go), bo dziecko nie moze
    // wyjsc poza stacking context rodzica. Popup wiec jest osobnym elementem
    // fixed, dzieckiem this.overlay, z wlasnym wysokim z-index + pozycja liczona
    // z realnego rect przycisku zebatki.
    const gearWrap = document.createElement('div');
    Object.assign(gearWrap.style, { position: 'relative' });
    const btnGear = document.createElement('button');
    applySettingsGearBtn1E(btnGear);
    btnGear.title = 'Ustawienia';
    btnGear.innerHTML = SETTINGS_GEAR_SVG;
    gearWrap.appendChild(btnGear);

    const settingsPopup = document.createElement('div');
    applySettingsPopupPanel1E(settingsPopup);
    Object.assign(settingsPopup.style, {
      position: 'fixed', top: '0', right: '0', left: 'auto',
      zIndex: '10020',
    });
    settingsPopup.style.display = 'none';
    const popupHeader = document.createElement('div');
    applySettingsPopupHeader1E(popupHeader);
    popupHeader.textContent = 'Ustawienia';
    settingsPopup.appendChild(popupHeader);
    const popupBody = document.createElement('div');
    Object.assign(popupBody.style, { padding: '6px' });
    settingsPopup.appendChild(popupBody);

    const musicRow = createSettingsToggleRow1E(CMD_SVG.music, 'Muzyka', !this._musicMuted, () => { this._toggleMusic(); });
    popupBody.appendChild(musicRow.row);
    this._settingsMusicToggle = musicRow.setActive;

    const sfxRow = createSettingsToggleRow1E(CMD_SVG.sound, 'Efekty d\u017awi\u0119kowe', !this._sfxMuted, () => { this._toggleSfx(); });
    popupBody.appendChild(sfxRow.row);
    this._settingsSfxToggle = sfxRow.setActive;

    const barsRow = createSettingsToggleRow1E(CMD_SVG.bars, 'Paski HP / Morale', this.barsVisible, () => {
      this.barsVisible = !this.barsVisible;
      for (const ru of [...this.atk, ...this.def]) {
        if (ru.dead || ru.removed) continue;
        ru.hpBarGroup.visible = this.barsVisible;
      }
      barsRow.setActive(this.barsVisible);
    });
    popupBody.appendChild(barsRow.row);
    this._settingsBarsToggle = barsRow.setActive;

    const statsSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">'
      + '<path d="M4 6h6v12H4zM14 6h6v8h-6z"/><path d="M8 10h2M16 12h2"/></svg>';
    const statsRow = createSettingsActionRow1E(statsSvg, 'Statystyki oddzia\u0142\u00f3w', () => {
      this._toggleBattleStatsOverlay('live');
      settingsPopup.style.display = 'none';
    });
    popupBody.appendChild(statsRow);

    const helpSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">'
      + '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.9c0 1.9-2.6 2.3-2.6 4M12 17.5v.01"/></svg>';
    const helpRow = createSettingsActionRow1E(helpSvg, 'Pomoc / skr\u00f3ty', () => {
      this._showOrderFeedback('Skr\u00f3ty: P pauza \u00b7 1/2/3 pr\u0119dko\u015b\u0107 \u00b7 R AUTO/r\u0119czne \u00b7 H paski \u00b7 I statystyki \u00b7 M d\u017awi\u0119k');
      settingsPopup.style.display = 'none';
    });
    popupBody.appendChild(helpRow);

    this.overlay.appendChild(settingsPopup);
    btnGear.onclick = (e) => {
      e.stopPropagation();
      const willOpen = settingsPopup.style.display === 'none';
      if (willOpen) {
        const r = btnGear.getBoundingClientRect();
        settingsPopup.style.top = (r.bottom + 8) + 'px';
        settingsPopup.style.right = (window.innerWidth - r.right) + 'px';
      }
      settingsPopup.style.display = willOpen ? 'block' : 'none';
    };
    topRight.appendChild(gearWrap);
    this._settingsGearWrap = gearWrap;
    this._settingsPopup = settingsPopup;
    document.addEventListener('click', this._onSettingsDocClick);

    // --- Pomin do wyniku (>>) \u2014 poprzednio na prawym railu, teraz obok zebatki ---
    const btnSkipTop = document.createElement('button');
    applySettingsGearBtn1E(btnSkipTop);
    btnSkipTop.title = 'Pomin do wyniku';
    btnSkipTop.innerHTML = CMD_SVG.skip;
    btnSkipTop.onclick = () => { if (!this.finished) this.skip(); };
    topRight.appendChild(btnSkipTop);

    const mkTopBtn = (label: string, title: string, onClick: () => void): HTMLButtonElement => {
      const b = document.createElement('button');
      b.textContent = label;
      b.title = title;
      Object.assign(b.style, {
        background: 'transparent',
        color: BATTLE_ENEMY_TEXT,
        border: '2px solid rgba(200,64,64,0.45)',
        borderRadius: '8px',
        padding: '4px 14px',
        fontFamily: HUD_FONT,
        fontSize: '11px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontWeight: 'bold',
      });
      b.onclick = onClick;
      return b;
    };
    const btnTopExit = mkTopBtn('Wycofaj si\u0119', 'Wycofaj si\u0119 z bitwy', () => { this.dispose(); if (this.onCancelCb) this.onCancelCb(); });
    topRight.appendChild(btnTopExit);
    topBar.appendChild(topRight);

    // TW v5 SS2: stary pelnoszerokosciowy pasek "Ostatnie starcia" (PASEK MOCY v4)
    // zastapiony paskiem przewagi wewnatrz commanderPanel (ta sama dana zrodlowa:
    // army-morale ratio z _armyMoraleRatio, patrz _updateArmyMoraleBars). Stary
    // pasek + pionowe słupki boczne i prawy rail 56px — USUNIĘTE (TW v5 §2/3,
    // sprzątnięcie FAZA 3): pola zawsze były `null`, siege-hud/layout rosteru
    // mają teraz stałe fallbacki zamiast opcjonalnego pola.
    requestAnimationFrame(() => this._syncRosterColumnLayout());
    this._setSpeedIdx(this.speedIdx);
    this._refreshAudioBtns();
    this._syncManualRailHighlight();

    // --- PANEL ZAZNACZONEJ JEDNOSTKI (Q3 — prawy panel rozkazow, szkielet) ---
    const selPanel = document.createElement('div');
    Object.assign(selPanel.style, {
      position:       'absolute',
      bottom:         '160px',
      right:          '14px',
      width:          '220px',
      background:     HUD_BG,
      border:         '1px solid ' + HUD_GOLD_DIM,
      borderRadius:   '8px',
      padding:        '10px 12px',
      zIndex:         '10011',
      fontFamily:     HUD_FONT,
      color:          HUD_TEXT,
      display:        'none',
      boxShadow:      '0 2px 16px rgba(0,0,0,0.7)',
    });
    this.overlay.appendChild(selPanel);
    this._selPanel = selPanel;

    // --- Q2: MINIMAPA (lewy-dolny rog, nad rosterem) ---
    this._buildMinimapOverlay();

    // --- Bogaty tooltip jednostki (C-09 v5 klatka 6) — hover na banerze 3D lub karcie rosteru ---
    const hoverTip = document.createElement('div');
    Object.assign(hoverTip.style, {
      position: 'fixed', display: 'none', pointerEvents: 'none', zIndex: '100020',
      fontFamily: BATTLE_FONT,
    });
    document.body.appendChild(hoverTip);
    this._hoverTooltip = hoverTip;

    // Hint trybu AUTO/R/SPACJA — dyskretny label 1E u dołu mapy (C06 v4).
    const modeBanner = document.createElement('div');
    applyModeHint1E(modeBanner);
    modeBanner.style.display = 'none';
    document.body.appendChild(modeBanner);
    this._modeBanner = modeBanner;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    // Filmic tone mapping gives the battlefield a "golden hour" depth instead
    // of the flat, un-tonemapped look (same recipe as render/scene.ts civ style).
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070b);
    this.scene.fog = new THREE.FogExp2(0x05070b, 0.012);

    // Camera centred on the PLAYABLE zone (default zoom). Full BF_COLS×BF_ROWS
    // map is larger — pan (strzałki / WASD) or drag to explore the margins.
    const midCol = PLAY_MID_COL;
    const midRow = PLAY_MID_ROW;
    const { x: cx, z: cz } = cellToWorld(midCol, midRow);
    const fieldWorldW = BF_COLS * TILE_S;
    const fieldWorldH = BF_ROWS * TILE_S;
    const fieldSpan   = Math.max(fieldWorldW, fieldWorldH);
    const playWorldW  = PLAYABLE_COLS * TILE_S;
    const playWorldH  = PLAYABLE_ROWS * TILE_S;
    const playSpan    = Math.max(playWorldW, playWorldH);

    this.camTarget.set(cx, 0, cz);
    // Default: strefa gry wygodnie w kadrze; zoom-out pokazuje całe duże pole.
    this.camDist       = playSpan * 0.92;
    this.camDistTarget = this.camDist;
    this.camDistMin = Math.max(2, playSpan * 0.07);
    this.camDistMax = fieldSpan * 1.65;

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 4000);
    this._applyCamera();

    this.scene.add(new THREE.AmbientLight(0xfff8e0, 0.45));
    const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x4a4030, 0.35);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe8b0, 1.15);
    sun.position.set(cx + 20, 70, cz - 30);
    sun.target.position.set(cx, 0, cz);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far  = 220;
    sun.shadow.camera.left = -fieldWorldW * 0.6;
    sun.shadow.camera.right = fieldWorldW * 0.6;
    sun.shadow.camera.top = fieldWorldH * 0.7;
    sun.shadow.camera.bottom = -fieldWorldH * 0.7;
    this.scene.add(sun);
    this.scene.add(sun.target);
    const fill = new THREE.DirectionalLight(0x8090c0, 0.30);
    fill.position.set(cx - 20, 24, cz + 30);
    this.scene.add(fill);
    // Softer fog so the far half of the big field doesn't grey out.
    this.scene.fog = new THREE.FogExp2(0x05070b, 0.005);

    this._orderLinesGroup = new THREE.Group();
    this._orderLinesGroup.name = 'orderLines';
    this.scene.add(this._orderLinesGroup);
    this._orderPreviewGroup = new THREE.Group();
    this._orderPreviewGroup.name = 'orderPreview';
    this._orderLinesGroup.add(this._orderPreviewGroup);

    this._buildBattlefield(opts.teren);
    if (opts.siege) {
      // SIEGE v2: prefer defCiv (defender's civilization) for the wall style.
      this._placeSiegeWall((opts.siege.defCiv ?? opts.siege.civ) ?? 'rzym');
      // Zadanie #8: prosta zabudowa miejska za murem (strona obrońcy) — dekor.
      this._buildSiegeInteriorBuildings();
    }
    this._deployMode = opts.deploy === true;
    this._deployPlayerSideOpt = opts.deployPlayerSide ?? 'atk';
    this._placeUnits(opts.attacker, opts.defender, opts.siege != null);

    // Inicjuj faze rozstawiania jesli opts.deploy === true
    if (this._deployMode) {
      this.deployPhase = true;
      this._buildDeployZone();
      this._buildDeployToolbar();
      this._initDeployUI();
      this._syncBattleToolbarMode();
      this._updateArmyMoraleBars();
      this._syncMinimapPhaseChrome();
    }

    window.addEventListener('resize', this._onResize);
    // Zoom: mouse wheel over the canvas + the +/- keys (B9).
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyZoom);
    window.addEventListener('keydown', this._onKeyPanDown);
    window.addEventListener('keyup', this._onKeyPanUp);
    // CHANGE1: "S" cycles battle speed (the on-screen button does not work for
    // the user); CHANGE2: "H" toggles all over-head stat bars. Both listen on
    // WINDOW so they work regardless of focus (there are no typing fields in the
    // battle overlay). Removed again in dispose().
    window.addEventListener('keydown', this._onKeySpeed);
    window.addEventListener('keydown', this._onKeyToggleBars);
    window.addEventListener('keydown', this._onKeyBattleStats);
    window.addEventListener('keydown', this._onKeyPause);
    window.addEventListener('keydown', this._onKeyManual);
    window.addEventListener('keydown', this._onKeyExecuteTurn);
    // AUDIO: "M" toggles all battle audio (SFX + ambient). Bound on WINDOW like
    // S/H/P, guarded by isEditableTarget; removed in dispose().
    window.addEventListener('keydown', this._onKeyMute);
    window.addEventListener('keydown', this._onKeyMergeWounded);
    // AUDIO GESTURE INIT: the AudioContext is created lazily on the FIRST user
    // gesture (autoplay policy). The overlay receives the battle's pointer/key
    // events, so we init/resume on its first pointerdown/keydown. Capture phase +
    // once-ish guard (the handler is idempotent and cheap to re-run).
    window.addEventListener('pointerdown', this._onAudioGesture, true);
    window.addEventListener('keydown', this._onAudioGesture, true);
    // Pan: PRAWY/SRODKOWY przycisk (lub lewy poza trybem recznym) przesuwa kamera.
    // LEWY w trybie RECZNYM = box-select / klik-zaznaczenie.
    this.canvas.addEventListener('pointerdown', this._onPanDown);
    window.addEventListener('pointermove', this._onPanMove);
    window.addEventListener('pointerup', this._onPanUp);
    // Blokuj menu kontekstowe prawego przycisku na canvasie (uzywamy go do pana)
    this.canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
    this.canvas.addEventListener('pointermove', this._onCanvasHoverMove);
    this.canvas.addEventListener('pointerleave', this._onCanvasHoverLeave);
    this._startLoop();
    // P-BITWA-MAPA-BLACKOUT-PO-WYGRANEJ: rejestruj scenę dopiero po pełnym
    // skonstruowaniu. Jeśli inicjalizacja WebGL/UI rzuci wyjątek, niedokończona
    // scena nie może zostawić mapy świata zablokowanej na zawsze.
    // / EN: register only after construction succeeds; a constructor failure
    // must not leave the world map blocked by a stale registry entry.
    markBattleSceneOpen(this);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  play(onFinish: (result: BattleResult) => void): void {
    this.onFinishCb = onFinish;
    if (this.deployPhase) {
      // Walka nie startuje -- czeka na przycisk "Start" w overlaya rozstawiania
      this.hint.textContent = 'FAZA ROZSTAWIANIA — strefa gry (środek mapy). WASD / strzałki = przesuń widok · kółko = zoom.';
      return;
    }
    this._startBattle();
  }

  /** Wewnetrzna metoda: rzeczywisty start walki (wywolywana po fazie rozstawiania). */
  private _startBattle(): void {
    this.started    = true;
    this.roundNo    = 0;
    this.activeSide = 'atk';
    // TW v5 §2: zegar bitwy MM:SS startuje TERAZ — bazowa = zegar wirtualny w
    // chwili START WALKI (patrz _updateArmyMoraleBars / _fmtBattleClock).
    this._battleStartVNow = this.vNow;
    this._manualMode = true;
    this._battleAwaitingOrders = true;
    this._queuedOrderUnitIds.clear();
    this._disposeAllOrderLines();
    if (this._orderLinesGroup) this._orderLinesGroup.visible = true;
    if (this._manualBtn) {
      this._syncManualRailHighlight();
    }
    this.hint.textContent =
      'TURA 1 — wydaj rozkazy (klik / G1-G3 / Generał) · SPACJA = start tury · R = AUTO';
    this._syncAllGroupFrameMarkers();
    if (this._manualMode && !this._rosterBar) this._buildRosterBar();
    if (this._rosterBar) this._rosterBar.style.display = 'flex';
    this._initDeployGhostLayer();
    this._ensureGroupSelectorBar();
    this._updateBattleRosterHeader();
    this._updateBattleQuickSelectBar();
    this._rebuildBattleRosterGrid();
    this._updateBattlePhaseBanner();
    this._syncMinimapPosition();
    this._syncBattleToolbarMode();
  }

  /** Wykonaj odłożone dyspozycje (Ctrl/Shift + SPACJA). */
  private _executeQueuedOrders(): void {
    if (this._queuedOrderUnitIds.size === 0) {
      this._showOrderFeedback('Brak odlozonych dyspozycji (uzyj Ctrl/Shift przy kliku)');
      return;
    }
    const ids = [...this._queuedOrderUnitIds];
    this._queuedOrderUnitIds.clear();
    this._executeUnitsImmediate(ids);
    this._showOrderFeedback('Wykonano ' + ids.length + ' dyspozycji');
  }

  /** C2-FLOW: rozpoczyna turę po fazie planowania (Spacja) lub przełączeniu na AUTO. */
  private _kickoffBattleTurn(): void {
    if (!this.started || this.finished || !this._battleAwaitingOrders) return;
    this._battleAwaitingOrders = false;
    this._autoBattleSuspended = false;
    this._clearOrderPreview();
    this._disposeQueuedOrderArrows();
    this._updateBattlePhaseBanner();
    this.hint.textContent =
      'Tura ' + (this.roundNo + 1) + ' — klik: ruch/atak od razu · Ctrl/Shift: dyspozycja · SPACJA: wykonaj odlozone.';
    if (this.roundNo === 0) {
      this._beginTurn();
    } else {
      this._activateNext();
    }
  }

  /** Baner fazy: planowanie / twoja tura / ruch przeciwnika — hint 1E u dołu (C06 v4). */
  private _updateBattlePhaseBanner(activeUnit?: RuntimeBattleUnit | null): void {
    if (!this._modeBanner || !this.started || this.finished) return;
    const hint = this._modeBanner;
    if (this.deployPhase) {
      hint.style.display = 'none';
      return;
    }
    this._syncModeHintPosition();
    if (!this._manualMode) {
      // AUTO + oblężenie: bez dolnego mockupu C-05 — baner też nie nachodzi na UI
      if (this.siegeWallCol >= 0) {
        hint.style.display = 'none';
        return;
      }
      hint.style.display = 'block';
      hint.textContent = 'Tryb AUTO · walka rozstrzyga się automatycznie · R = ręczna';
      return;
    }
    hint.style.display = 'block';
    if (this._battleAwaitingOrders) {
      hint.textContent = 'SPACJA = następna tura';
      return;
    }
    if (activeUnit && !this._isPlayerSide(activeUnit.side)) {
      hint.textContent = 'Ruch przeciwnika';
      return;
    }
    hint.textContent = 'SPACJA = następna tura';
  }

  /**
   * Pozycja hintu trybu (dolny srodek). Zadanie #17: dawny pelnoszerokosciowy
   * dolny pasek zlikwidowany — klaster Reset/Start i minimapa siedza teraz po
   * prawej, wiec hint nie musi juz robic miejsca u dolu niezaleznie od fazy.
   */
  private _syncModeHintPosition(): void {
    if (!this._modeBanner) return;
    this._modeBanner.style.bottom = '18px';
  }

  /** Podświetlenie rail R gdy tryb ręczny (C06 v4) + AUTO-rozegranie przy minimapie (TW v5 §3). */
  private _syncManualRailHighlight(): void {
    if (this._manualBtn) applyRailBtn1E(this._manualBtn, { active: this._manualMode });
    this._syncTempoPanelHighlight();
  }

  skip(): void {
    if (this.finished) return;
    this.finished = true;
    const result = computeInstantResult(
      this.atk.filter(u => !u.dead),
      this.def.filter(u => !u.dead),
      this.terrain,
      this.terrainData,
      this.counters,
      this.terrainMap,
      this.attackerCivBonusy,
      this.defenderCivBonusy,
      this.wallDefenseTotalProc,
      this.isCityDefenseBattle,
      this.armyHungerStatMult,
      this.attackerDifficultyCombatMult,
      this.defenderDifficultyCombatMult,
      this.goldDeficitStatMult,
    );
    for (const line of result.log) this.log.push(line);
    this._endWinner = result.winner;
    this._endSurvivors = result.survivors;
    this._showEndScreen(result.winner);
  }

  /**
   * Q2: minimap data contract for UI / battle overlay.
   * { cols, rows, terrain[], units[{q,r,color}], viewport }.
   */
  getBattleMinimapData(): BattleMinimapData {
    return this._collectMinimapData();
  }

  dispose(): void {
    this.finished = true;
    // P-BITWA-MAPA-BLACKOUT-PO-WYGRANEJ: zdejmij wpis z rejestru NAJPIERW — dispose()
    // bywa wołane dwa razy na ścieżce wygranej (ekran końca + podsumowanie), a
    // markBattleSceneClosed jest idempotentne. / EN: unregister first; dispose() legitimately
    // runs twice on the victory path and markBattleSceneClosed is idempotent.
    markBattleSceneClosed(this);
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyZoom);
    window.removeEventListener('keydown', this._onKeyPanDown);
    window.removeEventListener('keyup', this._onKeyPanUp);
    window.removeEventListener('keydown', this._onKeySpeed);
    window.removeEventListener('keydown', this._onKeyToggleBars);
    window.removeEventListener('keydown', this._onKeyBattleStats);
    window.removeEventListener('keydown', this._onKeyPause);
    window.removeEventListener('keydown', this._onKeyManual);
    window.removeEventListener('keydown', this._onKeyExecuteTurn);
    window.removeEventListener('keydown', this._onKeyMute);
    window.removeEventListener('keydown', this._onKeyMergeWounded);
    window.removeEventListener('pointerdown', this._onAudioGesture, true);
    window.removeEventListener('keydown', this._onAudioGesture, true);
    this.overlay.removeEventListener('pointerdown', this._onAudioGesture);
    this.overlay.removeEventListener('keydown', this._onAudioGesture);
    // AUDIO TEARDOWN: stop ambient, disconnect buses, close the context we made.
    this._teardownAudio();
    this.canvas.removeEventListener('pointerdown', this._onPanDown);
    window.removeEventListener('pointermove', this._onPanMove);
    window.removeEventListener('pointerup', this._onPanUp);
    this.canvas.removeEventListener('pointermove', this._onCanvasHoverMove);
    this.canvas.removeEventListener('pointerleave', this._onCanvasHoverLeave);
    this._clearHoverTooltip();
    if (this._hoverTooltip?.parentNode) this._hoverTooltip.parentNode.removeChild(this._hoverTooltip);
    this._hoverTooltip = null;
    this._clearOrderPreview();
    this._disposeAllOrderLines();
    if (this._orderLinesGroup) {
      this.scene.remove(this._orderLinesGroup);
      this._orderLinesGroup = null;
    }

    for (const fl of this.floatLabels) {
      if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem);
    }
    this.floatLabels = [];

    for (const p of this.projectiles) { for (const g of p.geos) g.dispose(); for (const m of p.mats) m.dispose(); }
    this.projectiles = [];

    for (const ru of [...this.atk, ...this.def]) {
      if (ru.removed) continue; // model resources already disposed when it fled off-map
      for (const m of ru.mats) m.dispose();
      for (const g of ru.perTokenGeos) g.dispose();
    }
    for (const m of this.ownedMats) m.dispose();
    for (const g of this.ownedGeos) g.dispose();
    this.renderer.dispose();

    // The battle-log panel is a child of the overlay, so removing the overlay
    // detaches it too; drop the handle + buffer so nothing dangles after dispose.
    this.clashLog = null;
    this.clashLogEntries = [];

    this._teardownDeployUI();
    this._hideEndDetails();
    if (this._endScreenBackdrop?.parentNode) {
      this._endScreenBackdrop.parentNode.removeChild(this._endScreenBackdrop);
    }
    if (this._endScreenWrap?.parentNode) {
      this._endScreenWrap.parentNode.removeChild(this._endScreenWrap);
    }
    this._endScreenBackdrop = null;
    this._endScreenWrap = null;
    this._endScreenShown = false;
    this._battleChromeSuppressed = false;
    if (this._deployRosterDock?.parentNode) {
      this._deployRosterDock.parentNode.removeChild(this._deployRosterDock);
    }
    this._deployRosterDock = null;
    // BŁĄD F (właściciel, 2026-07-24): "START WALKI" (+ Reset) osierocone na
    // mapie po zakończeniu bitwy. Przyczyna: `_buildDeployToolbar()` dołącza
    // `#deploy-toolbar` (pływający klaster Reset/Start, linia ~10512) i JEGO 5
    // popupów dropdownu (Formacja/Konnica/Linie/Taktyka/Strategia, linia ~10568)
    // BEZPOŚREDNIO do `document.body` — NIE do `this.overlay` — więc usunięcie
    // `this.overlay` (kilka linii niżej) ich nie zabiera. Zwykle klaster jest
    // ukryty (`display:none`) po starcie walki / na ekranie końca, więc
    // osierocenie jest niewidoczne — ALE `_replayBattle()` ("Rozegraj ponownie"
    // na ekranie końca, linia ~8376) jawnie ustawia z powrotem
    // `_deployToolbar.style.display = 'flex'` (nowa faza rozstawiania w tej
    // samej scenie); jeśli gracz z tego stanu wyjdzie przez "Wycofaj się"
    // zamiast dograć powtórkę, dispose() nigdy nie usuwał tego elementu z DOM —
    // został widoczny, floating, nad mapą świata. Ten sam wzorzec dotyczy
    // `_modeBanner` (linia ~2919, też `document.body.appendChild`), więc
    // sprzątamy je tu wszystkie explicite, tak samo jak _deployRosterDock wyżej.
    if (this._deployToolbar?.parentNode) {
      this._deployToolbar.parentNode.removeChild(this._deployToolbar);
    }
    this._deployToolbar = null;
    for (const popup of Object.values(this._deployDropdownPopups)) {
      if (popup?.parentNode) popup.parentNode.removeChild(popup);
    }
    this._deployDropdownPopups = {};
    if (this._modeBanner?.parentNode) {
      this._modeBanner.parentNode.removeChild(this._modeBanner);
    }
    disposeSiegeHud1E();
    document.removeEventListener('click', this._onSettingsDocClick);
    this._settingsGearWrap = null;
    this._settingsPopup = null;
    this._settingsMusicToggle = null;
    this._settingsSfxToggle = null;
    this._settingsBarsToggle = null;
    if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    this._rosterBar = null;
    this._manualBtn = null;
    this._modeBanner = null;
    this._selectionRings.clear();
  }

  // -------------------------------------------------------------------------
  // Private: clear the deploy RANK BANDS + guarantee a passable clash corridor,
  // WITHOUT flattening the whole middle (so dense terrain survives across the
  // field, per the "za lyso" feedback).
  //
  // The generator paints rivers / forest / hills / rocks DENSELY across the
  // whole field. Here we make the battle both playable AND still terrain-rich:
  //   1) RANK BANDS: clear ONLY the exact columns each side's ranks stand on
  //      (front +/- the rear ranks), across the rank rows + 1 row of slack, to
  //      clean Plains. Units therefore spawn on flat, even, passable ground and
  //      form straight lines -- but terrain butts right up against the lines and
  //      fills the rest of the field (flanks, top/bottom, the no-man's-land).
  //   2) CLASH CORRIDOR: along a few central rows, downgrade any DEEP RIVER in
  //      the no-man's-land to a FORD (passable, costly) so the river can never
  //      fully wall the two armies apart. Forest/hills/rocks there are LEFT in
  //      place (all passable) as the obstacles the armies fight through.
  //   3) CONNECTIVITY GUARD: a flood-fill from the attacker band verifies the
  //      defender band is reachable over passable tiles; if some pathological
  //      terrain still blocks it, punch fords straight across the centre row.
  // -------------------------------------------------------------------------
  private _carveBattleBox(presetActive: boolean): void {
    const tm = this.terrainMap;
    const tiles = tm.tiles;
    if (!tiles) return;

    const idx = (c: number, r: number) => r * BF_COLS + c;
    const inField = (c: number, r: number) => c >= 0 && c < BF_COLS && r >= 0 && r < BF_ROWS;

    // Pelna wysokosc strefy gry (skrzydla gora/dol — konnica tu staje).
    const rLo = PLAY_ROW0;
    const rHi = PLAY_ROW1;

    // --- 1) Kolumny formacji + tyl konnicy (glebsze niz MAX_RANKS piechoty).
    // presetActive=false (legacy): DOKLADNIE ta sama formula co przed
    // korekta -- bit-for-bit. presetActive=true: plytszy carve (patrz
    // deployClearRanksFor) tak, by srodek pola ("ziemia niczyja") zostal
    // wolny na meandrujacy teren (owner correction 2026-07-22 #3). ---
    const DEPLOY_CLEAR_RANKS = deployClearRanksFor(presetActive);
    const rankCols = new Set<number>();
    for (let k = 0; k < DEPLOY_CLEAR_RANKS; k++) {
      const ac = ATK_FRONT_COL + k * ATK_COL_STEP;
      const dc = DEF_FRONT_COL + k * DEF_COL_STEP;
      if (ac >= 0 && ac < BF_COLS) rankCols.add(ac);
      if (dc >= 0 && dc < BF_COLS) rankCols.add(dc);
    }
    for (let r = rLo; r <= rHi; r++) {
      for (const c of rankCols) {
        const i = idx(c, r);
        if (presetActive && (tiles[i] === BTerrain.River || tiles[i] === BTerrain.Ford)) {
          // Preset battles (owner spec 2026-07-22 #4 "rzeka ciagla przez cala
          // odleglosc"): WATER under a rank band becomes a FORD -- passable,
          // so formations still deploy there, but STILL WATER, so the
          // S-channel is never chopped into disconnected ponds (which is
          // exactly what the previous iteration's Plains-wipe here did).
          tiles[i] = BTerrain.Ford;
        } else {
          // Legacy (presetActive=false): the exact pre-existing wipe, bit-for-bit.
          tiles[i] = BTerrain.Plains;
        }
      }
    }

    // --- 2) Korytarz starcia: cala wysokosc strefy gry, rzeka -> bród. ---
    const midRow = PLAY_MID_ROW;
    const gapLo = Math.min(ATK_FRONT_COL, DEF_FRONT_COL);
    const gapHi = Math.max(ATK_FRONT_COL, DEF_FRONT_COL);
    for (let r = rLo; r <= rHi; r++) {
      for (let c = gapLo; c <= gapHi; c++) {
        if (tiles[idx(c, r)] === BTerrain.River) tiles[idx(c, r)] = BTerrain.Ford;
      }
    }

    // --- 3) Connectivity guard: flood-fill passable tiles from the attacker
    // front; if the defender front is unreachable, punch fords across the centre
    // row so a crossing always exists. ---
    const passableKind = (k: number): boolean => k !== BTerrain.River;
    const startC = ATK_FRONT_COL, startR = midRow;
    const goalC  = DEF_FRONT_COL, goalR  = midRow;
    const reachable = (): boolean => {
      if (!inField(startC, startR) || !inField(goalC, goalR)) return true;
      const seen = new Uint8Array(BF_COLS * BF_ROWS);
      const stack: Array<[number, number]> = [[startC, startR]];
      seen[idx(startC, startR)] = 1;
      while (stack.length) {
        const [c, r] = stack.pop()!;
        if (c === goalC && r === goalR) return true;
        for (const [dc, dr] of DIRS4) {
          const nc = c + dc, nr = r + dr;
          if (!inField(nc, nr) || seen[idx(nc, nr)]) continue;
          if (!passableKind(tiles[idx(nc, nr)] as number)) continue;
          seen[idx(nc, nr)] = 1;
          stack.push([nc, nr]);
        }
      }
      return false;
    };
    if (!reachable()) {
      for (let c = PLAY_COL0; c <= PLAY_COL1; c++) {
        if (tiles[idx(c, midRow)] === BTerrain.River) tiles[idx(c, midRow)] = BTerrain.Ford;
      }
    }
  }

  /**
   * Poza wyśrodkowaną strefą gry (~50% powierzchni) — teren nieprzejezdny
   * (margines do przewijania kamery bez rozgrywki).
   */
  private _fencePlayableZone(): void {
    const tiles = this.terrainMap.tiles;
    if (!tiles) return;
    const idx = (c: number, r: number) => r * BF_COLS + c;
    for (let c = 0; c < BF_COLS; c++) {
      for (let r = 0; r < BF_ROWS; r++) {
        if (!inPlayable(c, r)) tiles[idx(c, r)] = BTerrain.River;
      }
    }
  }

  // -------------------------------------------------------------------------
  // SIEGE: carve wall/gate tiles, place wall mesh, deploy siege armies
  // -------------------------------------------------------------------------

  /**
   * Mark the wall+gate columns in terrainMap as Wall/Gate tiles.
   * Called BEFORE _buildBattlefield so the tile renderer can colour them.
   * Wall position: a few columns from the DEFENDER's front (DEF_FRONT_COL).
   * The wall runs across the full rank band (rows rLo..rHi).
   * Gate: 2 tiles wide, centred on the midRow of the rank band.
   */
  private _carveWallTiles(): void {
    const tm = this.terrainMap;
    const tiles = tm.tiles;
    if (!tiles) return;

    // Wall column: 4 tiles behind DEF_FRONT_COL (toward the +X edge = defender side)
    const wallCol = Math.min(BF_COLS - 2, DEF_FRONT_COL + 4);
    this.siegeWallCol = wallCol;

    // POPRAWKA: mur od krawedzi do krawedzi pola (rzedy 0..BF_ROWS-1)
    const rLo = 0;
    const rHi = BF_ROWS - 1;
    this.siegeWallRowLo = rLo;
    this.siegeWallRowHi = rHi;

    // Brama: 2 rzedy szerokosci, posrodku pola (rzad ≈ BF_ROWS/2)
    const midRow = PLAY_MID_ROW;
    const gateRowLo = midRow - 1;
    const gateRowHi = midRow;
    this.siegeGateCol = wallCol;
    this.siegeGateRow = midRow;
    this.gateHp = 400; // GATE_MAX_HP
    this.gateOpen = false;
    // Inicjuj HP per-tile dla kafli BTerrain.Wall (pomijaj bramę)
    this.wallTileHp.clear();
    for (let r = rLo; r <= rHi; r++) {
      if (r >= gateRowLo && r <= gateRowHi) continue;
      this.wallTileHp.set(r, BattleScene.WALL_TILE_HP);
    }

    const idx = (c: number, r: number) => r * BF_COLS + c;
    for (let r = rLo; r <= rHi; r++) {
      const isGate = r >= gateRowLo && r <= gateRowHi;
      // Wall tile: impassable
      if (wallCol >= 0 && wallCol < BF_COLS) {
        tiles[idx(wallCol, r)] = isGate ? BTerrain.Gate : BTerrain.Wall;
      }
    }
  }

  /**
   * Build and place the 3D siege wall mesh in the scene.
   * Called after _buildBattlefield (so the scene exists) and before _placeUnits.
   * The wall runs perpendicular to the field (along Z axis = rows).
   * Its X position corresponds to siegeWallCol * TILE_S.
   * The "face" (blanki) faces -X = toward the attacker (which is the +Z direction
   * in local siege wall coords, since buildSiegeWall faces +Z by default).
   */
  private _placeSiegeWall(civ: import('../render/bronzeCity').BronzeCiv): void {
    const wallCol = this.siegeWallCol;
    if (wallCol < 0) return;

    const rLo = this.siegeWallRowLo;
    const rHi = this.siegeWallRowHi;
    const wallLengthTiles = rHi - rLo + 1;

    const wallGroup = buildSiegeWall(civ, {
      lengthTiles: wallLengthTiles,
      tileSize: TILE_S,
      height: 2.5,
      gateWidthTiles: 2,
    });

    // siegeWall.ts builds the wall along X axis, centred at origin.
    // We need it perpendicular to X (along Z), so rotate 90deg around Y.
    wallGroup.rotation.y = Math.PI / 2;

    // Position: wallCol * TILE_S (X), centred on the rank band (Z)
    const wallCenterRow = (rLo + rHi) / 2;
    const { x: wallX } = cellToWorld(wallCol, 0);
    const { z: wallZ } = cellToWorld(0, wallCenterRow);
    wallGroup.position.set(wallX, 0, wallZ);

    this.scene.add(wallGroup);
    this.siegeWallGroup = wallGroup;

    // Zmiana 2: Rejestruj per-rząd breach panele (wyrwa w murze).
    // gateRowLo/Hi = rząd bramy; panele są ukryte domyślnie, widoczne po wyłomie.
    {
      const _gateRowLo = this.siegeGateRow - 1;
      const _gateRowHi = this.siegeGateRow;
      attachRowBreachPanels(
        wallGroup,
        wallCenterRow,
        rLo,
        rHi,
        _gateRowLo,
        _gateRowHi,
        TILE_S
      );
    }

    // --- HUD oblężenia 1E (C-04 / C-05) ---
    const siegeHud = document.createElement('div');
    Object.assign(siegeHud.style, { display: 'none' });
    this.overlay.appendChild(siegeHud);
    this.siegeHudDiv = siegeHud;
    mountSiegeHud1E(this.overlay, {
      onSkip: () => { if (!this.finished) this.skip(); },
      onExit: () => { this.dispose(); if (this.onCancelCb) this.onCancelCb(); },
    });
    this._updateSiegeHud();
    this._syncSiegeHudChromeVisibility();
    requestAnimationFrame(() => this._syncSiegeHudLayout());

    // Register mesh resources for disposal
    wallGroup.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
        const mm = mesh.material;
        if (Array.isArray(mm)) this.ownedMats.push(...mm);
        else if (mm) this.ownedMats.push(mm as THREE.Material);
      }
    });
  }

  /**
   * SIEGE: proste, tanie bryły zabudowy miejskiej PO WEWNĘTRZNEJ stronie muru
   * (strona obrońcy) — czysto wizualna dekoracja (nie zmienia przejezdności:
   * kafle pod budynkami zostają Plains, jednostki mogą przez nie "przechodzić"
   * tak jak przez każdy inny dekor w tym pliku — lasy/skały/kępy trawy powyżej
   * też nie kolidują).
   *
   * Umiejscowienie: kolumny [siegeWallCol+5 .. PLAY_COL1-1] (głębia miasta za
   * murem, z marginesem od pasa gdzie ląduje odwrót obrońców z wyburzonego
   * muru i gdzie _placeSiegeDefenders stawia "resztę" obrony tuż za murem),
   * wiersze w obrębie PLAY_ROW0..PLAY_ROW1 z wyłączeniem korytarza wokół rzędu
   * bramy (SIEGE_STREET_HALF) — tak by "ulica" od bramy w głąb miasta zostawała
   * czytelna, a nie zastawiona domami. Slotu-kandydaci sortowani wg odległości
   * od rzędu bramy i przycięci do budżetu (BUILDING_CAP) — stąd zabudowa
   * gęstnieje bliżej centrum (bramy) i rzednie ku flankom.
   *
   * Deterministyczne: tileJitter(col,row,salt) — sam mechanizm co drzewa/
   * skały/kępy trawy w _buildBattlefield (zero Math.random()). InstancedMesh
   * (3 siatki: korpus, dach dwuspadowy, dach płaski) — budżet dziesiątki
   * trójkątów na budynek, do ~40 budynków.
   */
  private _buildSiegeInteriorBuildings(): void {
    if (this.siegeWallCol < 0) return;
    const tm = this.terrainMap;
    if (!tm.tiles) return;

    const wallCol = this.siegeWallCol;
    const gateRow = this.siegeGateRow;

    const colLo = wallCol + 5;
    const colHi = PLAY_COL1 - 1;
    const rowLo = PLAY_ROW0 + 2;
    const rowHi = PLAY_ROW1 - 2;
    if (colHi < colLo || rowHi < rowLo) return;

    const STREET_HALF = 3;  // korytarz od bramy w głąb miasta, wolny od zabudowy
    const STEP_COL = 3;
    const STEP_ROW = 3;
    const BUILDING_CAP = 38;

    type Plot = { col: number; row: number; dist: number };
    const plots: Plot[] = [];
    for (let col = colLo; col <= colHi; col += STEP_COL) {
      for (let row = rowLo; row <= rowHi; row += STEP_ROW) {
        if (Math.abs(row - gateRow) <= STREET_HALF) continue;
        if (tm.at(col, row) !== BTerrain.Plains) continue;
        // Organiczna rzadkość (nie każdy slot zabudowany) — deterministyczna.
        if (tileJitter(col, row, 901) > 0.82) continue;
        plots.push({ col, row, dist: Math.abs(row - gateRow) });
      }
    }
    if (plots.length === 0) return;
    plots.sort((a, b) => a.dist - b.dist);
    const chosen = plots.length > BUILDING_CAP ? plots.slice(0, BUILDING_CAP) : plots;
    const n = chosen.length;
    if (n === 0) return;

    const bodyGeo  = new THREE.BoxGeometry(1, 1, 1);
    const gableGeo = makeGableRoofGeometry();
    this.ownedGeos.push(bodyGeo, gableGeo);

    // Biały materiał bazowy: instanceColor jest jedynym źródłem barwy (ten sam
    // wzorzec co korony drzew / kępy trawy powyżej) — brak luk = brak "białych" instancji.
    const bodyMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0.0 });
    const gableMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 });
    const flatMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 });
    this.ownedMats.push(bodyMat, gableMat, flatMat);

    const bodies     = new THREE.InstancedMesh(bodyGeo, bodyMat, n);
    const gableRoofs = new THREE.InstancedMesh(gableGeo, gableMat, n);
    const flatRoofs  = new THREE.InstancedMesh(bodyGeo, flatMat, n);
    bodies.castShadow = true; bodies.receiveShadow = true;
    gableRoofs.castShadow = true;
    flatRoofs.castShadow = true;

    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();
    let gi = 0, fi = 0;

    for (let i = 0; i < n; i++) {
      const { col, row } = chosen[i]!;
      const { x, z } = cellToWorld(col, row);
      const px = x + (tileJitter(col, row, 902) - 0.5) * TILE_S * 0.8;
      const pz = z + (tileJitter(col, row, 903) - 0.5) * TILE_S * 0.8;

      // 2 najbliższe centrum (bramie) plotu = skromne "budynki publiczne"
      // (większe), reszta = 3 warianty wielkości mieszkalnej zabudowy.
      const isPublic = i < 2;
      const sizeRoll = tileJitter(col, row, 904);
      let w: number, d: number, bodyH: number, roofH: number;
      if (isPublic) {
        w = 1.5 + sizeRoll * 0.3; d = 1.1 + sizeRoll * 0.2; bodyH = 1.7; roofH = 0.55;
      } else if (sizeRoll < 0.33) {
        w = 0.55; d = 0.5; bodyH = 0.85; roofH = 0.35;
      } else if (sizeRoll < 0.7) {
        w = 0.72; d = 0.6; bodyH = 1.0; roofH = 0.4;
      } else {
        w = 0.85; d = 0.7; bodyH = 1.15; roofH = 0.45;
      }

      const yaw = tileJitter(col, row, 905) * Math.PI * 2;

      // Korpus
      dummy.position.set(px, bodyH / 2, pz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(w, bodyH, d);
      dummy.updateMatrix();
      bodies.setMatrixAt(i, dummy.matrix);
      const bColIdx = Math.floor(tileJitter(col, row, 906) * SIEGE_BLDG_BODY_COLORS.length) % SIEGE_BLDG_BODY_COLORS.length;
      const bJit = (tileJitter(col, row, 907) - 0.5) * 0.14;
      colorObj.set(lighten(SIEGE_BLDG_BODY_COLORS[bColIdx]!, bJit));
      bodies.setColorAt(i, colorObj);

      // Dach: dwuspadowy (~62%) lub płaski (~38%)
      const roofRoll = tileJitter(col, row, 908);
      const rColIdx = Math.floor(tileJitter(col, row, 909) * SIEGE_BLDG_ROOF_COLORS.length) % SIEGE_BLDG_ROOF_COLORS.length;
      const rJit = (tileJitter(col, row, 910) - 0.5) * 0.12;
      colorObj.set(lighten(SIEGE_BLDG_ROOF_COLORS[rColIdx]!, rJit));

      if (roofRoll < 0.62) {
        dummy.position.set(px, bodyH, pz);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(w * 1.06, roofH, d * 1.06);
        dummy.updateMatrix();
        gableRoofs.setMatrixAt(gi, dummy.matrix);
        gableRoofs.setColorAt(gi, colorObj);
        gi++;
      } else {
        dummy.position.set(px, bodyH + roofH * 0.4, pz);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(w * 1.08, roofH * 0.8, d * 1.08);
        dummy.updateMatrix();
        flatRoofs.setMatrixAt(fi, dummy.matrix);
        flatRoofs.setColorAt(fi, colorObj);
        fi++;
      }
    }

    bodies.count = n;
    gableRoofs.count = gi;
    flatRoofs.count = fi;
    bodies.instanceMatrix.needsUpdate = true;
    gableRoofs.instanceMatrix.needsUpdate = true;
    flatRoofs.instanceMatrix.needsUpdate = true;
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    if (gableRoofs.instanceColor) gableRoofs.instanceColor.needsUpdate = true;
    if (flatRoofs.instanceColor) flatRoofs.instanceColor.needsUpdate = true;

    this.scene.add(bodies);
    if (gi > 0) this.scene.add(gableRoofs);
    if (fi > 0) this.scene.add(flatRoofs);
  }

  /**
   * Move siege machine units (Taran/Katapulta) to the column ADJACENT to the wall
   * (one tile in front of the wall), so they can attack the gate immediately.
   * Called after place() for the attacker side.
   */
  private _repositionSiegeAttackers(): void {
    // SIEGE ATTACKER REPOSITIONING DISABLED:
    // Maszyny oblężnicze (Katapulta/Taran/Wieża) są już rozstawione NA KOŃCU
    // formacji atakującego (za łucznikami) przez _placeUnits z SIEGE_ATK_FRONT_COL=2.
    // Katapulta (zasięg 5) podejdzie do ~5 heksów od muru i zatrzyma się strzelając z dystansu.
    // Taran/Wieża mają zasięg 1 – dojdą do muru/bramy.
    // NIE przesuwamy maszyn pod mur od razu.
  }

  /**
   * Deploy the DEFENDER's units in siege mode:
   *   - Melee (Wrecz) units: placed ON the wall walkway (col = siegeWallCol),
   *     distributed along the wall's rows, skipping the gate.
   *   - All other units: placed BEHIND the wall (columns > siegeWallCol).
   */
  private _placeSiegeDefenders(defenders: BattleUnit[]): RuntimeBattleUnit[] {
    const wallCol = this.siegeWallCol;
    const rLo = this.siegeWallRowLo;
    const rHi = this.siegeWallRowHi;
    const gateRowLo = this.siegeGateRow - 1;
    const gateRowHi = this.siegeGateRow;

    // Separate wall defenders (melee + archers + def catapults) from the rest (mounted, non-cata siege).
    // Archers (isPrimaryRanged but not isMounted/isSiegeUnit) are placed ON the
    // wall walkway together with melee -- they shoot down at attackers from the
    // crown rather than standing behind the wall where their range is blocked.
    // Defender CATAPULTS (kontrbateria) are also placed ON the wall walkway so
    // they can shoot down at attacker catapults (counterbattery, range 6).
    const wallUnits = defenders.filter(u => !isMounted(u) && !isSiegeUnit(u));
    const meleeUnits = wallUnits.filter(u => !isPrimaryRanged(u));
    const archerUnits = wallUnits.filter(u => isPrimaryRanged(u));
    const defCataUnits = defenders.filter(u => isSiegeUnit(u) && this._isCatapult(u));
    const restUnits  = defenders.filter(u => isMounted(u) || (isSiegeUnit(u) && !this._isCatapult(u)));

    const result: RuntimeBattleUnit[] = [];

    // Helper to place a single unit at a given col/row
    const placeOne = (bu: BattleUnit, col: number, row: number, side: 'def', faceDir: Dir): RuntimeBattleUnit => {
      const clampedCol = Math.max(0, Math.min(BF_COLS - 1, col));
      const clampedRow = Math.max(0, Math.min(BF_ROWS - 1, row));

      // Find a free passable spot
      let fCol = clampedCol, fRow = clampedRow;
      if (this.occByKey.has(cellKey(fCol, fRow)) || !this.terrainMap.passable(fCol, fRow)) {
        // Try nearby rows
        let placed = false;
        for (let dr = 1; dr < BF_ROWS && !placed; dr++) {
          for (const rr of [clampedRow + dr, clampedRow - dr]) {
            const rc = Math.max(0, Math.min(BF_ROWS - 1, rr));
            if (!this.occByKey.has(cellKey(fCol, rc)) && this.terrainMap.passable(fCol, rc)) {
              fRow = rc; placed = true; break;
            }
          }
        }
        if (!placed) {
          // Try next col behind wall
          for (let dc = 1; dc < 5 && !placed; dc++) {
            const cc = Math.min(BF_COLS - 1, clampedCol + dc);
            for (let rr = rLo; rr <= rHi && !placed; rr++) {
              if (!this.occByKey.has(cellKey(cc, rr)) && this.terrainMap.passable(cc, rr)) {
                fCol = cc; fRow = rr; placed = true;
              }
            }
          }
        }
      }

      const key = cellKey(fCol, fRow);
      const { x, z } = cellToWorld(fCol, fRow);
      const topY = tileTopY(this.terrainMap, fCol, fRow);

      let group: THREE.Group;
      try {
        const modelName = String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa);
        group = buildUnitModel(bu.kategoria, sideColor(side, this._playerControlSide()), modelName);
      } catch (_) {
        group = makeFallbackAvatar(sideColor(side, this._playerControlSide()));
      }
      group.position.set(x, topY, z);
      group.rotation.y = dirYaw(faceDir);
      this.scene.add(group);

      const mats:         THREE.Material[]       = (group.userData['mats']         as THREE.Material[]      ) ?? [];
      const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

      const ammo0 = ammoCount(bu);
      const ammoShown = Number.isFinite(ammo0) && ammo0 > 0;
      const bars = makeUnitBars(sideColor(side, this._playerControlSide()), ammoShown);
      bars.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
      this.scene.add(bars.hpBarGroup);
      bars.hpBarGroup.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
          const mm = mesh.material;
          if (Array.isArray(mm)) this.ownedMats.push(...mm);
          else if (mm) this.ownedMats.push(mm as THREE.Material);
        }
      });

      const moraleBase = moraleBaseFor(bu) * 1.5; // obrońcy +50% morale na starcie
      const ru: RuntimeBattleUnit = {
        bu,
        group,
        hpBarFg:     bars.hpBarFg,
        hpBarBg:     bars.hpBarBg,
        hpBarGroup:  bars.hpBarGroup,
        moraleBarFg: bars.moraleBarFg,
        moraleBarBg: bars.moraleBarBg,
        ammoBarFg:   bars.ammoBarFg,
        ammoBarBg:   bars.ammoBarBg,
        ammoBarShown: ammoShown,
        q:          fCol,
        r:          fRow,
        side,
        dead:      false,
        fadingOut: false,
        fadeStart: 0,
        acted:     false,
        moveLeft:  movementPoints(bu),
        range:      attackRange(bu),
        rangeBase:  attackRange(bu),
        ranged:     isRanged(bu),
        rangedBase: isRanged(bu),
        primaryRanged: isPrimaryRanged(bu),
        ammoLeft:   ammo0,
        ammoMax:    ammo0,
        dryCol:           -1,
        heldAfterFallback: false,
        mounted:      isMounted(bu),
        antiCavSpear: isAntiCavSpear(bu),
        phalanx:      isPhalanx(bu),
        facing:       faceDir,
        morale:      moraleBase,
        moraleMax:   moraleBase,
        neverRout:   isNeverRout(bu),
        fleeMorale:  fleeMoraleFor(bu),
        routed:      false,
        screenLostApplied: false,
        fleeStuck:   0,
        surroundApplied: false,
        removed:    false,
        onWallWalkway: false,
        playerOrder:   { type: 'none' },
        rangedKite:       true,
        shootingEnabled:  true,
        groupId:      null,
        formationOffset: null,
        unitDoctrine: null,
        attackDirection: 'front',
        mats,
        perTokenGeos,
      };
      this._updateHpBar(ru);
      this._updateMoraleBar(ru);
      this._updateAmmoBar(ru);
      this.occByKey.set(key, ru);
      return ru;
    };

    // 1) Melee on the wall walkway (wall col), SKONCENTROWANE W CENTRUM (±12 rzędów od midRow)
    // Obrońcy skupieni naprzeciw atakujących (którzy też startują na środku).
    const DEFENSE_HALF_SPAN = 12; // pas ±12 rzędów od środka bramy
    const midRow = this.siegeGateRow;
    const centerLo = Math.max(rLo, midRow - DEFENSE_HALF_SPAN);
    const centerHi = Math.min(rHi, midRow + DEFENSE_HALF_SPAN);
    const wallRows: number[] = [];
    for (let r = centerLo; r <= centerHi; r++) {
      if (r >= gateRowLo && r <= gateRowHi) continue; // skip gate
      wallRows.push(r);
    }
    // Place melee + archer + defender catapult units on wall walkway. Wall tiles
    // are BTerrain.Wall (impassable for pathfinding) but we forcibly place them
    // there since they STAND ON TOP of the wall crown. Archers and def catapults
    // go alongside melee, concentrated in the central band around the gate.
    // Def catapults get onWallWalkway=true and range=6 (counterbattery bonus).
    //
    // ROZKŁAD KATAPULT: CENTRUM pasa obrońców (±4 rzędy od midRow).
    // Zmiana 1: katapulty obrońcy skupione w centrum ±4 (były spread po całym pasie).
    const nCata = defCataUnits.length;
    const CATA_HALF_SPAN = 4; // ±4 rzędy od bramy
    const cataRowSet = new Set<number>();
    if (nCata > 0 && wallRows.length > 0) {
      // Wylicz węższy pas centralny dla katapult
      const cataLo = Math.max(centerLo, midRow - CATA_HALF_SPAN);
      const cataHi = Math.min(centerHi, midRow + CATA_HALF_SPAN);
      const cataPool = wallRows.filter(r => r >= cataLo && r <= cataHi);
      const usedPool = cataPool.length > 0 ? cataPool : wallRows; // fallback pełny pas
      for (let ci = 0; ci < nCata; ci++) {
        const idx = nCata > 1
          ? Math.round(ci * (usedPool.length - 1) / (nCata - 1))
          : Math.floor((usedPool.length - 1) / 2);
        const safeIdx = Math.min(Math.max(0, idx), usedPool.length - 1);
        cataRowSet.add(usedPool[safeIdx] as number);
      }
    }
    // Pozostałe rzędy (bez rzędów zarezerwowanych dla katapult) dla melee+łuczników:
    const nonCataRows = wallRows.filter(r => !cataRowSet.has(r));
    // Listy rzędów dla każdej grupy:
    const cataRows = wallRows.filter(r => cataRowSet.has(r));
    // Kolejność na murze: najpierw melee i łucznicy (na wolnych rzędach),
    // potem katapulty (na zarezerwowanych rzędach).
    const meleeArcherUnits = [...meleeUnits, ...archerUnits];
    // Mapowanie indeks→rząd: melee+łucznicy korzystają z nonCataRows (równomiernie),
    // katapulty z cataRows (równomiernie — już wyznaczone jako spread).
    const getRowForUnit = (unitIndex: number, isCata: boolean): number => {
      const fallback = rLo;
      if (isCata) {
        const rows = cataRows;
        if (rows.length === 0) return fallback;
        return rows[unitIndex % rows.length] as number;
      } else {
        const rows = nonCataRows.length > 0 ? nonCataRows : wallRows;
        if (rows.length === 0) return fallback;
        const step = rows.length > 1 ? (rows.length - 1) / Math.max(1, meleeArcherUnits.length - 1) : 0;
        const ri = Math.round(unitIndex * step);
        const clamped = Math.min(Math.max(0, ri), rows.length - 1);
        return rows[clamped] as number;
      }
    };
    // Połączona lista w kolejności: melee+łucznicy, potem katapulty (ale każda
    // ma własny licznik indeksu w swojej grupie):
    let meleeArcherIdx = 0;
    let cataIdx = 0;
    // Iterujemy przez melee+łucznicy+katapulty zachowując oryginalną kolejność
    // jednostek w presecie, ale przypisując im rządy z odpowiednich pul.
    const allWallCrownUnits = [...meleeArcherUnits, ...defCataUnits];
    let wallRowIdx = 0;
    for (const bu of allWallCrownUnits) {
      const isCata = defCataUnits.includes(bu);
      const wr = isCata
        ? getRowForUnit(cataIdx++, true)
        : getRowForUnit(meleeArcherIdx++, false);
      void wallRowIdx; // zachowane dla kompatybilności (nie używane w nowej logice)
      // Forcibly place on wall col (even though terrain is Wall = impassable movement)
      const key = cellKey(wallCol, wr);
      const { x, z } = cellToWorld(wallCol, wr);
      const topY = 2.5; // stand on top of wall (walkY from siegeWall opts.height)

      let group: THREE.Group;
      try {
        const modelName = String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa);
        group = buildUnitModel(bu.kategoria, sideColor('def', this._playerControlSide()), modelName);
      } catch (_) {
        group = makeFallbackAvatar(sideColor('def', this._playerControlSide()));
      }
      group.position.set(x, topY, z);
      group.rotation.y = dirYaw(Dir.W); // face attacker
      this.scene.add(group);

      const mats:         THREE.Material[]       = (group.userData['mats']         as THREE.Material[]      ) ?? [];
      const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
      const ammo0 = ammoCount(bu);
      const ammoShown = Number.isFinite(ammo0) && ammo0 > 0;
      const bars = makeUnitBars(sideColor('def', this._playerControlSide()), ammoShown);
      bars.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
      this.scene.add(bars.hpBarGroup);
      bars.hpBarGroup.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
          const mm = mesh.material;
          if (Array.isArray(mm)) this.ownedMats.push(...mm);
          else if (mm) this.ownedMats.push(mm as THREE.Material);
        }
      });

      const moraleBase = moraleBaseFor(bu) * 1.5; // obrońcy +50% morale na starcie
      const ru: RuntimeBattleUnit = {
        bu, group,
        hpBarFg: bars.hpBarFg, hpBarBg: bars.hpBarBg, hpBarGroup: bars.hpBarGroup,
        moraleBarFg: bars.moraleBarFg, moraleBarBg: bars.moraleBarBg,
        ammoBarFg: bars.ammoBarFg, ammoBarBg: bars.ammoBarBg, ammoBarShown: ammoShown,
        q: wallCol, r: wr, side: 'def',
        dead: false, fadingOut: false, fadeStart: 0, acted: false,
        moveLeft: movementPoints(bu),
        // Defender catapult on wall walkway (kontrbateria) gets range 6 (cataRange 5 + 1 elevation).
        range: (this._isCatapult(bu) ? Math.max(attackRange(bu), 6) : attackRange(bu)),
        rangeBase: (this._isCatapult(bu) ? Math.max(attackRange(bu), 6) : attackRange(bu)),
        ranged: (this._isCatapult(bu) ? true : isRanged(bu)),
        rangedBase: (this._isCatapult(bu) ? true : isRanged(bu)),
        primaryRanged: isPrimaryRanged(bu),
        ammoLeft: ammo0, ammoMax: ammo0,
        dryCol: -1, heldAfterFallback: false,
        mounted: isMounted(bu), antiCavSpear: isAntiCavSpear(bu), phalanx: isPhalanx(bu),
        facing: Dir.W,
        morale: moraleBase, moraleMax: moraleBase,
        neverRout: isNeverRout(bu), fleeMorale: fleeMoraleFor(bu),
        routed: false, screenLostApplied: false, fleeStuck: 0, surroundApplied: false,
        removed: false, onWallWalkway: true, playerOrder: { type: 'none' },
        rangedKite: true, shootingEnabled: true,
        groupId: null, formationOffset: null,
        unitDoctrine: null,
        attackDirection: 'front',
        mats, perTokenGeos,
      };
      this._updateHpBar(ru);
      this._updateMoraleBar(ru);
      this._updateAmmoBar(ru);
      this.occByKey.set(key, ru);
      result.push(ru);
    }

    // 2) Rest of defender (mounted, siege machines) behind the wall
    let rearOffset = 0;
    for (const bu of restUnits) {
      const rearCol = Math.min(BF_COLS - 1, wallCol + 2 + Math.floor(rearOffset / (rHi - rLo + 1)));
      const rearRow = rLo + (rearOffset % Math.max(1, rHi - rLo + 1));
      rearOffset++;
      result.push(placeOne(bu, rearCol, rearRow, 'def', Dir.W));
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Private: battlefield (SQUARE grid of flat tiles)
  // -------------------------------------------------------------------------

  private _buildBattlefield(_teren: string): void {
    this._battleGroundPickMeshes = [];
    const tm = this.terrainMap;

    // PUSTYNIA preset: swap the whole ground-decoration palette for sand
    // tones. Forest never spawns on desert (preset.noForest) so crown/trunk
    // colours are never picked, only floor/hills/rocks/tufts need a variant.
    const desert = this._desertPalette;
    const floorColors  = desert ? BT_FLOOR_COLOR_DESERT : BT_FLOOR_COLOR;
    const hillColor    = desert ? HILL_GRASS_COLOR_DESERT : HILL_GRASS_COLOR;
    const shrubColor   = desert ? SHRUB_COLOR_DESERT : SHRUB_COLOR;
    const rockColor    = desert ? ROCK_COLOR_DESERT : ROCK_COLOR;
    const tuftColorA   = desert ? GRASS_TUFT_COLOR_A_DESERT : GRASS_TUFT_COLOR_A;
    const tuftColorB   = desert ? GRASS_TUFT_COLOR_B_DESERT : GRASS_TUFT_COLOR_B;
    const bushColor    = desert ? SHRUB_COLOR_DESERT : TINY_BUSH_COLOR;

    // Flat SQUARE tile: a thin slab BoxGeometry(S, h, S). A tiny gap (0.98)
    // keeps a faint grid line between adjacent tiles for readability; centres
    // are exactly TILE_S apart so the squares effectively touch. The grass slab
    // top sits at y = 0 (water slabs dip to -RIVER_DROP). The unit WALKING
    // surface, however, follows tileTopY(): on a hill it rises to the dome's
    // summit (HILL_SUMMIT_Y) so the figure stands ON the bump instead of being
    // buried in it; on flat ground it is y = 0 (= UNIT_Y).
    const tileGeo = new THREE.BoxGeometry(TILE_S * 0.995, TILE_H, TILE_S * 0.995);
    this.ownedGeos.push(tileGeo);

    // Material CACHE: thousands of tiles collapse onto a few dozen shared
    // materials keyed by quantised colour, so we don't allocate 1440 materials.
    const matCache = new Map<number, THREE.MeshStandardMaterial>();
    const tileMat = (color: number): THREE.MeshStandardMaterial => {
      const key = color & 0xffffff;
      let m = matCache.get(key);
      if (!m) {
        m = new THREE.MeshStandardMaterial({ color: key, roughness: 0.95, metalness: 0.0 });
        matCache.set(key, m);
        this.ownedMats.push(m);
      }
      return m;
    };

    // Decoration tallies for instanced-mesh sizing.
    const FOREST_TREES = 7; // crowns per forest tile
    const HILL_SHRUBS  = 4; // shrubs per hill tile
    let forestTiles = 0, hillTiles = 0, waterTiles = 0, rockTiles = 0;
    for (let i = 0; i < tm.tiles.length; i++) {
      const k = tm.tiles[i] as number;
      if (k === BTerrain.Forest) forestTiles++;
      else if (k === BTerrain.Hills) hillTiles++;
      else if (k === BTerrain.River || k === BTerrain.Ford) waterTiles++;
      else if (k === BTerrain.Rocks) rockTiles++;
    }

    // --- Tile floor (per-tile colour from terrain kind) ---
    for (let col = 0; col < BF_COLS; col++) {
      for (let row = 0; row < BF_ROWS; row++) {
        const kind = tm.at(col, row);
        const checker = ((col + row) % 2 === 0) ? 0.0 : 0.022;
        let c = lighten(floorColors[kind] ?? 0x6fa84a, checker);
        // Subtle deterministic per-tile tint (hash of position, not Math.random),
        // quantised to a handful of buckets so the material CACHE above still
        // collapses to a few dozen shared materials instead of one per tile.
        const varianceStep = Math.floor(tileJitter(col, row, 101) * 7) - 3; // -3..3
        const variance = varianceStep * 0.0225; // -6.75% .. +6.75% (was -4%..+4%)
        c = variance >= 0 ? lighten(c, variance) : blend(c, 0x000000, -variance);
        // Faint side tint marks the attacker / defender deploy ground.
        if (col <= ATK_FRONT_COL)      c = lighten(c, 0.05);
        else if (col >= DEF_FRONT_COL) c = blend(c, 0x9090a0, 0.07);

        const mesh = new THREE.Mesh(tileGeo, tileMat(c));
        const { x, z } = cellToWorld(col, row);
        // River/ford slabs sit slightly LOWER so water reads as a channel.
        const isWater = kind === BTerrain.River || kind === BTerrain.Ford;
        const yTop = isWater ? -RIVER_DROP : 0;
        mesh.position.set(x, yTop - TILE_H * 0.5, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this._battleGroundPickMeshes.push(mesh);
      }
    }

    // --- FOREST: instanced cone crowns + thin trunks (scene.ts look) ---
    if (forestTiles > 0) {
      const maxTrees = forestTiles * FOREST_TREES;
      const crownGeo = new THREE.ConeGeometry(TILE_S * 0.20, TILE_S * 0.62, 6);
      // White base material: instanceColor (crownColorA/B below) is the ONLY
      // source of hue. Any instance that never gets setColorAt() defaults to
      // white (three.js InstancedBufferAttribute fills with 1, not 0), so a
      // gap in coverage would read as a washed-out crown, never a black one --
      // and every crown below IS given a colour, so there is no gap either way.
      const crownMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
      const trunkGeo = new THREE.CylinderGeometry(TILE_S * 0.035, TILE_S * 0.05, TILE_S * 0.22, 5);
      const trunkMat = new THREE.MeshLambertMaterial({ color: FOREST_TRUNK_COLOR });
      this.ownedGeos.push(crownGeo, trunkGeo);
      this.ownedMats.push(crownMat, trunkMat);
      const crowns = new THREE.InstancedMesh(crownGeo, crownMat, maxTrees);
      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, maxTrees);
      crowns.castShadow = true; crowns.receiveShadow = true;
      trunks.castShadow = true;
      const dummy = new THREE.Object3D();
      const crownColorA = new THREE.Color(FOREST_CONE_COLOR);
      const crownColorB = new THREE.Color(FOREST_CONE_COLOR2);
      let ti = 0;
      for (let col = 0; col < BF_COLS; col++) {
        for (let row = 0; row < BF_ROWS; row++) {
          if (tm.at(col, row) !== BTerrain.Forest) continue;
          const { x, z } = cellToWorld(col, row);
          for (let t = 0; t < FOREST_TREES; t++) {
            const jx = (tileJitter(col, row, t * 2) - 0.5) * TILE_S * 0.72;
            const jz = (tileJitter(col, row, t * 2 + 1) - 0.5) * TILE_S * 0.72;
            const sc = 0.7 + tileJitter(col, row, t + 7) * 0.6;
            // trunk
            dummy.position.set(x + jx, TILE_S * 0.11 * sc, z + jz);
            dummy.scale.setScalar(sc);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            trunks.setMatrixAt(ti, dummy.matrix);
            // crown sits on top of the trunk
            dummy.position.set(x + jx, (TILE_S * 0.22 + TILE_S * 0.31) * sc, z + jz);
            dummy.updateMatrix();
            crowns.setMatrixAt(ti, dummy.matrix);
            // Two deterministic crown shades (hash of tile+tree index, not
            // Math.random) so a forest reads as a mix of trees, not one flat colour.
            crowns.setColorAt(ti, tileJitter(col, row, t + 50) < 0.5 ? crownColorA : crownColorB);
            ti++;
          }
        }
      }
      crowns.count = ti; trunks.count = ti;
      crowns.instanceMatrix.needsUpdate = true;
      trunks.instanceMatrix.needsUpdate = true;
      if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
      this.scene.add(trunks);
      this.scene.add(crowns);
    }

    // --- HILLS: instanced raised grass bumps (half-dome) + shrubs ---
    if (hillTiles > 0) {
      const bumpGeo = new THREE.SphereGeometry(HILL_BUMP_RADIUS, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const bumpMat = new THREE.MeshLambertMaterial({ color: hillColor, flatShading: true });
      const shrubGeo = new THREE.ConeGeometry(TILE_S * 0.13, TILE_S * 0.34, 6);
      const shrubMat = new THREE.MeshLambertMaterial({ color: shrubColor, flatShading: true });
      this.ownedGeos.push(bumpGeo, shrubGeo);
      this.ownedMats.push(bumpMat, shrubMat);
      const bumps  = new THREE.InstancedMesh(bumpGeo, bumpMat, hillTiles);
      const shrubs = new THREE.InstancedMesh(shrubGeo, shrubMat, hillTiles * HILL_SHRUBS);
      bumps.castShadow = true; bumps.receiveShadow = true;
      shrubs.castShadow = true;
      const dummy = new THREE.Object3D();
      let bi = 0, si = 0;
      for (let col = 0; col < BF_COLS; col++) {
        for (let row = 0; row < BF_ROWS; row++) {
          if (tm.at(col, row) !== BTerrain.Hills) continue;
          const { x, z } = cellToWorld(col, row);
          // raised grass dome (sits ON the y=0 surface; its apex = HILL_SUMMIT_Y)
          dummy.position.set(x, 0, z);
          dummy.scale.set(1, HILL_SUMMIT_Y / HILL_BUMP_RADIUS, 1);
          dummy.rotation.set(0, tileJitter(col, row, 3) * Math.PI, 0);
          dummy.updateMatrix();
          bumps.setMatrixAt(bi++, dummy.matrix);
          for (let h = 0; h < HILL_SHRUBS; h++) {
            const jx = (tileJitter(col, row, 10 + h) - 0.5) * TILE_S * 0.5;
            const jz = (tileJitter(col, row, 20 + h) - 0.5) * TILE_S * 0.5;
            dummy.scale.setScalar(0.7 + tileJitter(col, row, 30 + h) * 0.5);
            dummy.position.set(x + jx, HILL_LIFT + 0.10, z + jz);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            shrubs.setMatrixAt(si++, dummy.matrix);
          }
        }
      }
      bumps.count = bi; shrubs.count = si;
      bumps.instanceMatrix.needsUpdate = true;
      shrubs.instanceMatrix.needsUpdate = true;
      this.scene.add(bumps);
      this.scene.add(shrubs);
      this._battleGroundPickMeshes.push(bumps);
    }

    // --- RIVER + FORD: a translucent water sheen plane over each water tile ---
    if (waterTiles > 0) {
      const waterGeo = new THREE.BoxGeometry(TILE_S * 0.99, 0.04, TILE_S * 0.99);
      const waterMat = new THREE.MeshLambertMaterial({
        color: RIVER_WATER_COLOR, transparent: true, opacity: 0.78, emissive: 0x0a2a44,
      });
      this.ownedGeos.push(waterGeo);
      this.ownedMats.push(waterMat);
      const water = new THREE.InstancedMesh(waterGeo, waterMat, waterTiles);
      const dummy = new THREE.Object3D();
      let wi = 0;
      for (let col = 0; col < BF_COLS; col++) {
        for (let row = 0; row < BF_ROWS; row++) {
          const k = tm.at(col, row);
          if (k !== BTerrain.River && k !== BTerrain.Ford) continue;
          const { x, z } = cellToWorld(col, row);
          // Ford water sits a touch higher (shallower) than deep river.
          const wy = k === BTerrain.Ford ? -RIVER_DROP * 0.4 : -RIVER_DROP * 0.5;
          dummy.position.set(x, wy, z);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          water.setMatrixAt(wi++, dummy.matrix);
        }
      }
      water.count = wi;
      water.instanceMatrix.needsUpdate = true;
      this.scene.add(water);
      this._battleGroundPickMeshes.push(water);
    }

    // --- ROCKS: small instanced low-poly boulders on rock tiles ---
    if (rockTiles > 0) {
      const rockGeo = new THREE.IcosahedronGeometry(TILE_S * 0.22, 0);
      const rockMat = new THREE.MeshLambertMaterial({ color: rockColor, flatShading: true });
      this.ownedGeos.push(rockGeo);
      this.ownedMats.push(rockMat);
      const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockTiles * 2);
      rocks.castShadow = true; rocks.receiveShadow = true;
      const dummy = new THREE.Object3D();
      let ri = 0;
      for (let col = 0; col < BF_COLS; col++) {
        for (let row = 0; row < BF_ROWS; row++) {
          if (tm.at(col, row) !== BTerrain.Rocks) continue;
          const { x, z } = cellToWorld(col, row);
          const n = 1 + (tileJitter(col, row, 5) > 0.5 ? 1 : 0);
          for (let b = 0; b < n; b++) {
            const jx = (tileJitter(col, row, 40 + b) - 0.5) * TILE_S * 0.45;
            const jz = (tileJitter(col, row, 50 + b) - 0.5) * TILE_S * 0.45;
            const sc = 0.6 + tileJitter(col, row, 60 + b) * 0.7;
            dummy.position.set(x + jx, TILE_S * 0.10 * sc, z + jz);
            dummy.scale.setScalar(sc);
            dummy.rotation.set(tileJitter(col, row, 70 + b) * Math.PI, tileJitter(col, row, 80 + b) * Math.PI, 0);
            dummy.updateMatrix();
            rocks.setMatrixAt(ri++, dummy.matrix);
          }
        }
      }
      rocks.count = ri;
      rocks.instanceMatrix.needsUpdate = true;
      this.scene.add(rocks);
    }

    // --- GRASS TUFTS: close-up ground detail (B10). The floor tile is a flat
    // colour slab that only reads as "a nice hex" from far away; up close (and
    // the owner zooms in on the units to actually play) it looks bare. This adds
    // a SINGLE InstancedMesh of thin blade cones scattered as small clumps over
    // Plains/Hills tiles (never on water/rock/forest-canopy tiles). Deterministic
    // via tileJitter (no Math.random). Restricted to the PLAYABLE rectangle: the
    // margin outside it is already covered by the dark overlay in
    // _buildPlayableMarginVisuals, so tufts there would be instances nobody sees.
    {
      const GRASS_CAP = 8000;        // hard instance cap (perf, per owner brief)
      const BLADES_PER_TUFT = 3;     // 2-3 thin blades forming one clump
      const MAX_TUFTS_PER_TILE = 2;  // up to 2 clumps/tile -> up to 6 blades/tile

      let grassTiles = 0;
      for (let col = PLAY_COL0; col <= PLAY_COL1; col++) {
        for (let row = PLAY_ROW0; row <= PLAY_ROW1; row++) {
          const k = tm.at(col, row);
          if (k === BTerrain.Plains || k === BTerrain.Hills) grassTiles++;
        }
      }

      if (grassTiles > 0) {
        // Keep-probability per tuft SLOT, chosen so the EXPECTED total stays at
        // the hard cap. A sequential "fill tiles in scan order, stop at the cap"
        // approach would empty out one whole side of the field once the budget
        // runs out (columns are scanned low-to-high) -- a hard-to-miss bare
        // patch right where a formation stands. Per-slot probabilistic keep
        // (hashed from tile position, so still fully deterministic) spends the
        // same budget spread UNIFORMLY across the whole playable rectangle
        // instead, and doubles as the "organic sparsity" (not every tile shows
        // a tuft) the forest fringe already uses the same trick for.
        const rawSlots = grassTiles * MAX_TUFTS_PER_TILE;
        const keepProb = Math.min(1, GRASS_CAP / (rawSlots * BLADES_PER_TUFT));
        const maxBlades = GRASS_CAP; // allocate the hard cap; trimmed to actual gi below

        // Thin cone "blade": base at y=0 (translate up by half its own height)
        // so it stands upright on the tile surface instead of being centred on it.
        const bladeGeo = new THREE.ConeGeometry(TILE_S * 0.016, TILE_S * 0.20, 3);
        bladeGeo.translate(0, TILE_S * 0.10, 0);
        this.ownedGeos.push(bladeGeo);
        // White base (same reasoning as the forest crowns above): instanceColor
        // (grassColorA/B) is the sole hue source so both shades render true
        // instead of tinting through GRASS_TUFT_COLOR_A a second time.
        const grassMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
        this.ownedMats.push(grassMat);
        const grass = new THREE.InstancedMesh(bladeGeo, grassMat, maxBlades);
        grass.castShadow = false; // too thin to be worth the shadow-pass cost
        grass.receiveShadow = false;
        const grassColorA = new THREE.Color(tuftColorA);
        const grassColorB = new THREE.Color(tuftColorB);
        const dummy = new THREE.Object3D();
        let gi = 0;
        outerGrass:
        for (let col = PLAY_COL0; col <= PLAY_COL1; col++) {
          for (let row = PLAY_ROW0; row <= PLAY_ROW1; row++) {
            const k = tm.at(col, row);
            if (k !== BTerrain.Plains && k !== BTerrain.Hills) continue;
            const { x, z } = cellToWorld(col, row);
            const baseY = k === BTerrain.Hills ? HILL_LIFT : 0;
            for (let tft = 0; tft < MAX_TUFTS_PER_TILE; tft++) {
              if (tileJitter(col, row, 200 + tft) >= keepProb) continue; // uniformly-thinned slot
              const cx = (tileJitter(col, row, 210 + tft * 3) - 0.5) * TILE_S * 0.8;
              const cz = (tileJitter(col, row, 211 + tft * 3) - 0.5) * TILE_S * 0.8;
              for (let b = 0; b < BLADES_PER_TUFT; b++) {
                if (gi >= maxBlades) break outerGrass;
                const salt = 220 + tft * 10 + b * 7;
                const jx = cx + (tileJitter(col, row, salt) - 0.5) * TILE_S * 0.10;
                const jz = cz + (tileJitter(col, row, salt + 1) - 0.5) * TILE_S * 0.10;
                const sc = 0.6 + tileJitter(col, row, salt + 2) * 0.8;
                dummy.position.set(x + jx, baseY, z + jz);
                dummy.rotation.set(
                  (tileJitter(col, row, salt + 3) - 0.5) * 0.5,
                  tileJitter(col, row, salt + 4) * Math.PI * 2,
                  (tileJitter(col, row, salt + 5) - 0.5) * 0.5,
                );
                dummy.scale.setScalar(sc);
                dummy.updateMatrix();
                grass.setMatrixAt(gi, dummy.matrix);
                grass.setColorAt(gi, tileJitter(col, row, salt + 6) < 0.5 ? grassColorA : grassColorB);
                gi++;
              }
            }
          }
        }
        grass.count = gi;
        grass.instanceMatrix.needsUpdate = true;
        if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
        this.scene.add(grass);
      }
    }

    // --- TINY CLUTTER: sparse pebbles + tiny bushes on open Plains tiles, one
    // extra InstancedMesh each, so close-up ground never reads as empty between
    // grass tufts. Deliberately small/sparse -- the trees/hills/rocks decor
    // above stays the main terrain read, this is just "not bare" filler. ---
    {
      let plainsTiles = 0;
      for (let col = PLAY_COL0; col <= PLAY_COL1; col++) {
        for (let row = PLAY_ROW0; row <= PLAY_ROW1; row++) {
          if (tm.at(col, row) === BTerrain.Plains) plainsTiles++;
        }
      }
      if (plainsTiles > 0) {
        const PEBBLE_CHANCE = 0.10;
        const BUSH_CHANCE   = 0.06;
        const pebbleGeo = new THREE.IcosahedronGeometry(TILE_S * 0.045, 0);
        const pebbleMat = new THREE.MeshLambertMaterial({ color: PEBBLE_COLOR, flatShading: true });
        const bushGeo = new THREE.ConeGeometry(TILE_S * 0.09, TILE_S * 0.16, 5);
        bushGeo.translate(0, TILE_S * 0.08, 0);
        const bushMat = new THREE.MeshLambertMaterial({ color: bushColor, flatShading: true });
        this.ownedGeos.push(pebbleGeo, bushGeo);
        this.ownedMats.push(pebbleMat, bushMat);
        const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, plainsTiles);
        const bushes  = new THREE.InstancedMesh(bushGeo, bushMat, plainsTiles);
        pebbles.receiveShadow = true;
        bushes.castShadow = true; bushes.receiveShadow = true;
        const dummy = new THREE.Object3D();
        let pi = 0, bi2 = 0;
        for (let col = PLAY_COL0; col <= PLAY_COL1; col++) {
          for (let row = PLAY_ROW0; row <= PLAY_ROW1; row++) {
            if (tm.at(col, row) !== BTerrain.Plains) continue;
            const { x, z } = cellToWorld(col, row);
            if (tileJitter(col, row, 300) < PEBBLE_CHANCE) {
              const jx = (tileJitter(col, row, 301) - 0.5) * TILE_S * 0.7;
              const jz = (tileJitter(col, row, 302) - 0.5) * TILE_S * 0.7;
              const sc = 0.7 + tileJitter(col, row, 303) * 0.8;
              dummy.position.set(x + jx, TILE_S * 0.02 * sc, z + jz);
              dummy.scale.setScalar(sc);
              dummy.rotation.set(tileJitter(col, row, 304) * Math.PI, tileJitter(col, row, 305) * Math.PI, 0);
              dummy.updateMatrix();
              pebbles.setMatrixAt(pi++, dummy.matrix);
            }
            if (tileJitter(col, row, 310) < BUSH_CHANCE) {
              const jx = (tileJitter(col, row, 311) - 0.5) * TILE_S * 0.7;
              const jz = (tileJitter(col, row, 312) - 0.5) * TILE_S * 0.7;
              const sc = 0.6 + tileJitter(col, row, 313) * 0.6;
              dummy.position.set(x + jx, 0, z + jz);
              dummy.scale.setScalar(sc);
              dummy.rotation.set(0, tileJitter(col, row, 314) * Math.PI * 2, 0);
              dummy.updateMatrix();
              bushes.setMatrixAt(bi2++, dummy.matrix);
            }
          }
        }
        pebbles.count = pi; bushes.count = bi2;
        pebbles.instanceMatrix.needsUpdate = true;
        bushes.instanceMatrix.needsUpdate = true;
        this.scene.add(pebbles);
        this.scene.add(bushes);
      }
    }

    // --- Surrounding dark ground plane + side banners ---
    const midCol = (BF_COLS - 1) / 2;
    const midRow = (BF_ROWS - 1) / 2;
    const { x: mx, z: mz } = cellToWorld(midCol, midRow);
    const worldW = BF_COLS * TILE_S;
    const worldH = BF_ROWS * TILE_S;

    const gGeo = new THREE.PlaneGeometry(worldW * 2.2, worldH * 2.2);
    const gMat = new THREE.MeshLambertMaterial({ color: 0x050505 });
    this.ownedGeos.push(gGeo);
    this.ownedMats.push(gMat);
    const ground = new THREE.Mesh(gGeo, gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(mx, -0.16, mz);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Boczne pasy TY/wróg (niebieski/czerwony) USUNIĘTE na decyzję właściciela
    // (2026-07-23): tło pola bitwy ma być jednolicie czarne, bez kolorowych
    // obramówek. Zostawiono tylko czarny grunt + przyciemnione marginesy.

    this._buildPlayableMarginVisuals();
  }

  /** Przyciemnione marginesy poza strefą gry (wizualna granica 50% powierzchni). */
  private _buildPlayableMarginVisuals(): void {
    const ts = TILE_S;
    // Cały margines poza strefą gry generator wypełnia głęboką rzeką (kafle
    // River) niezależnie od wybranego biomu -- to świadome zachowanie tabel
    // terenu (nie ruszamy generatora), ale wizualnie oznacza dość jasny,
    // nasycony niebieski kolor pod spodem. Stąd wysoka nieprzezroczystość
    // (0.94) tej nakładki -- niżej tło "poza strefą gry" przestawało być
    // niemal niewidoczne, przebijając wyraźnym niebieskim odcieniem.
    //
    // Prostokąty budujemy z jawnych GRANIC (min/max), nie szerokość+środek --
    // pozwala to naddać PAD na zewnętrzną krawędź (poza prawdziwy skraj
    // BF_COLS/BF_ROWS, w czerń tła) i BLEED na styki z sąsiednimi
    // prostokątami/strefą gry, bez ryzyka niedomkniętej szpary z zaokrągleń.
    const PAD = ts * 3;      // naddatek na zewnątrz (w tło) -- z zapasem
    const INNER = ts * 0.15; // maly zachodzenie na strefe gry (jak zlota ramka)
    const CORNER = ts * 0.5; // zachodzenie lewo/prawo na strefe gora/dol (w tle, niewidoczne)
    const mkMarginBounds = (xMin: number, xMax: number, zMin: number, zMax: number): void => {
      const w = xMax - xMin, h = zMax - zMin;
      if (w <= 0.05 || h <= 0.05) return;
      const g = new THREE.PlaneGeometry(w, h);
      g.rotateX(-Math.PI / 2);
      this.ownedGeos.push(g);
      const m = new THREE.MeshBasicMaterial({
        color: 0x030303, transparent: true, opacity: 0.94, depthWrite: false,
      });
      this.ownedMats.push(m);
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set((xMin + xMax) * 0.5, 0.04, (zMin + zMax) * 0.5);
      // Wymuś rysowanie PO wodzie/innych półprzezroczystych kaflach terenu --
      // bez tego sortowanie przezroczystości po odległości potrafiło (przy
      // pewnych kątach kamery) zostawić cienką, jaśniejszą smugę wody na
      // granicy marginesu zamiast jednolitej czerni.
      mesh.renderOrder = 5;
      this.scene.add(mesh);
    };
    // UWAGA na tile-CENTER vs tile-EDGE: cellToWorld(col,row) daje środek kafla
    // (kafle mają szerokość ts, więc krawędź jest o pół kafla dalej). Granice
    // pól poniżej są liczone jako PRAWDZIWE krawędzie (±HALF), nie środki --
    // wcześniejsza wersja (bez HALF) myliła środek pierwszego kafla marginesu
    // z granicą strefy gry, zostawiając ~0.35 kafla NIEZAKRYTEJ szpary po
    // stronie xMax/zMax (prawo/dół), przez którą przebijał surowy kolor
    // kafla-rzeki spod spodu jako cienka jasna kreska.
    const HALF = ts * 0.5;
    const fieldXMin = -HALF;
    const fieldXMax = (BF_COLS - 1) * ts + HALF;
    const fieldZMin = -HALF;
    const fieldZMax = (BF_ROWS - 1) * ts + HALF;
    const playXMin  = PLAY_COL0 * ts - HALF;
    const playXMax  = PLAY_COL1 * ts + HALF;
    const playZMin  = PLAY_ROW0 * ts - HALF;
    const playZMax  = PLAY_ROW1 * ts + HALF;
    // Lewo / prawo: pełna wysokość strefy gry, zachodzą lekko (CORNER) na
    // strefy góra/dół (tam to wciąż tło, więc bezpieczne) i o INNER na samą
    // strefę gry (tyle samo rzędu co złota ramka, żeby nie odgryzać terenu).
    mkMarginBounds(fieldXMin - PAD, playXMin + INNER, playZMin - CORNER, playZMax + CORNER);
    mkMarginBounds(playXMax - INNER, fieldXMax + PAD, playZMin - CORNER, playZMax + CORNER);
    // Góra / dół: pełna szerokość CAŁEGO pola (+ PAD po bokach, żeby zakryć
    // rogi), zachodzą o INNER na strefę gry.
    mkMarginBounds(fieldXMin - PAD, fieldXMax + PAD, fieldZMin - PAD, playZMin + INNER);
    mkMarginBounds(fieldXMin - PAD, fieldXMax + PAD, playZMax - INNER, fieldZMax + PAD);

    // Obwódka strefy gry (złota linia)
    const frameW = PLAYABLE_COLS * ts;
    const frameH = PLAYABLE_ROWS * ts;
    const { x: fx, z: fz } = cellToWorld(PLAY_MID_COL, PLAY_MID_ROW);
    const frameGeo = new THREE.PlaneGeometry(frameW + ts * 0.12, frameH + ts * 0.12);
    frameGeo.rotateX(-Math.PI / 2);
    this.ownedGeos.push(frameGeo);
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37, transparent: true, opacity: 0.35, depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ownedMats.push(frameMat);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(fx, 0.038, fz);
    frame.renderOrder = 6;
    this.scene.add(frame);

    // Parytet z mapą świata (R-RUCH-WZGORZA, 2026-07-26): sfery otaczające meshy
    // pickingu liczymy TERAZ, na komplecie instancji. three.js liczy je inaczej
    // leniwie przy pierwszym raycaście i już nigdy nie odświeża — a wtedy każda
    // późniejsza podmiana macierzy instancji cicho wycina cały mesh z pickingu.
    refreshInstancedPickBounds(this._battleGroundPickMeshes);
  }

  // -------------------------------------------------------------------------
  // Private: place units -- two armies FACING each other in COLUMNS, GAP in
  // the middle. Attacker LEFT (front = E / +X), defender RIGHT (front = W / -X).
  // -------------------------------------------------------------------------

  private _placeUnits(attackers: BattleUnit[], defenders: BattleUnit[], siegeMode: boolean = false): void {
    // CLEAN FRONT LINE placement on the SQUARE grid.
    //
    // Both armies form a STRAIGHT vertical front line (a rank) in a single
    // column, facing each other across the field. Because the grid is square
    // (no shear), a rank is simply a constant COLUMN with the row running down
    // the field -- no zig-zag compensation is needed. The first (fullest) rank
    // sits on the front column; overflow steps to rear ranks toward that side's
    // own edge.
    //
    // Each unit's FACING is set toward the enemy front line: attacker -> E,
    // defender -> W, and the model is rotated to show it.
    const place = (
      units:    BattleUnit[],
      side:     'atk' | 'def',
      frontCol: number,
      rankStep: number,    // column step from one rank to the rear rank
      faceDir:  Dir,       // E for attacker, W for defender
    ): RuntimeBattleUnit[] => {
      const clampCol = (c: number): number => Math.max(0, Math.min(BF_COLS - 1, c));
      const clampRow = (r: number): number => Math.max(0, Math.min(BF_ROWS - 1, r));
      const freeOk = (c: number, r: number): boolean =>
        !this.occByKey.has(cellKey(c, r)) && this.terrainMap.passable(c, r);

      // DEPLOYMENT BY ROLE (Naster): ONE continuous melee front line, then a rank
      // of JAVELINEERS, then a rank of ARCHERS behind it; mounted on the wings.
      //   rank 0 (front col) = ALL melee (non-shooter foot) in one wide line
      //   rank 1 = javelineers (kategoria 'oszczep...')
      //   rank 2 = archers/slingers (rest of the primary shooters)
      // Each group is centred on the field; a group wider than the field wraps to
      // an extra rank behind it. Mounted deploy on the wings of the widest line.
      const meleeI:   number[] = [];
      const javI:     number[] = [];
      const arcI:     number[] = [];
      const siegeI:   number[] = []; // maszyny oblężnicze (Taran/Katapulta/Wieża) -- grupowane NA KOŃCU formacji
      const mountIdx: number[] = [];
      units.forEach((u, i) => {
        if (isMounted(u)) { mountIdx.push(i); return; }
        if (isSiegeUnit(u)) { siegeI.push(i); return; } // siege PRZED isPrimaryRanged, bo nie są ranged
        if (!isPrimaryRanged(u)) { meleeI.push(i); return; }
        if (normName(String(u.kategoria ?? '')).includes('oszczep')) { javI.push(i); return; }
        arcI.push(i);
      });

      const idealRow = new Array<number>(units.length);
      const idealCol = new Array<number>(units.length);

      // MAX units per rank (row-axis). Each group is centred on midRow so all
      // groups share the same centre column -- NO wing spreading.
      const MAX_LINE = 12;
      const midRow   = PLAY_MID_ROW;

      const layGroup = (list: number[], rankBase: number): number => {
        if (list.length === 0) return 0;
        // Deploy gracza: ten sam zwarty szyk co w walce (max 12 w szeregu, centrum
        // PLAY_MID_ROW) — NIE _deploySpreadRank (rozciągał całą wysokość strefy).
        const per = Math.max(1, Math.min(list.length, MAX_LINE));
        const r0g = midRow - Math.floor(per / 2);
        list.forEach((ui, k) => {
          idealRow[ui] = clampRow(r0g + (k % per));
          idealCol[ui] = clampCol(frontCol + (rankBase + Math.floor(k / per)) * rankStep);
        });
        return Math.ceil(list.length / per);
      };
      let rankBase = 0;
      rankBase += layGroup(meleeI, rankBase); // FRONT: jedna ciagla linia wrecz
      rankBase += layGroup(javI, rankBase);   // za nia: oszczepnicy
      const arcRanks = layGroup(arcI, rankBase); // za nimi: lucznicy
      rankBase += arcRanks;
      const siegeRanks = layGroup(siegeI, rankBase); // NA KOŃCU: maszyny oblężnicze (katapulty/taran/wieże)
      const totalFootRanks = rankBase + siegeRanks;

      // Mounted: za piechotą — zwarty blok w centrum mapy (deploy i walka).
      {
        const mountColOff = totalFootRanks + (this._deployMode && side === this._playerControlSide() ? 2 : 5);
        const mountPer    = Math.max(1, Math.min(mountIdx.length, MAX_LINE));
        const mountR0     = midRow - Math.floor(mountPer / 2);
        mountIdx.forEach((ui, k) => {
          idealRow[ui] = clampRow(mountR0 + (k % mountPer));
          idealCol[ui] = clampCol(frontCol + (mountColOff + Math.floor(k / mountPer)) * rankStep);
        });
      }

      return units.map((bu, idx) => {
        // Resolve collisions / impassable: prefer PLAINS (konnica nie startuje w lesie).
        let col = idealCol[idx]!;
        let row = idealRow[idx]!;
        const tileScore = (c: number, r: number): number => {
          if (!freeOk(c, r)) return -1;
          let s = 100 - Math.abs(r - idealRow[idx]!) * 3 - Math.abs(c - idealCol[idx]!) * 2;
          const kind = this.terrainMap.at(c, r);
          if (kind === BTerrain.Plains) s += 40;
          else if (kind === BTerrain.Ford) s += 20;
          else if (kind === BTerrain.Forest) s -= 15;
          return s;
        };
        let bestScore = -1;
        const playerDeploy = this._deployMode && side === this._playerControlSide();
        const rowLo = playerDeploy
          ? Math.max(DEPLOY_MIN_ROW, idealRow[idx]! - 8)
          : PLAY_ROW0;
        const rowHi = playerDeploy
          ? Math.min(DEPLOY_MAX_ROW, idealRow[idx]! + 8)
          : PLAY_ROW1;
        for (let extra = 0; extra < 10; extra++) {
          for (let rr = rowLo; rr <= rowHi; rr++) {
            for (const cc of [
              clampCol(idealCol[idx]! + extra * rankStep),
              clampCol(idealCol[idx]! - extra * rankStep),
            ]) {
              const sc = tileScore(cc, rr);
              if (sc > bestScore) {
                bestScore = sc;
                col = cc;
                row = rr;
              }
            }
          }
        }
        const key = cellKey(col, row);

        const { x, z } = cellToWorld(col, row);

        let group: THREE.Group;
        try {
          // Pass the unit NAME so battle figures pick up the same per-culture /
          // per-name distinctions as the map (e.g. Legionista vs Falanga vs the
          // super-units). buildUnitModel falls back to the generic category
          // model when the name carries no cultural marker.
          // Resolve the MODEL by the POLISH "Jednostka" name (the stable model
          // key the renderer/buildNamedUnit match on); bu.nazwa now holds the
          // ENGLISH display name, so use stats['Jednostka'] for dispatch.
          const modelName = String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa);
          group = buildUnitModel(bu.kategoria, sideColor(side, this._playerControlSide()), modelName);
        } catch (_) {
          group = makeFallbackAvatar(sideColor(side, this._playerControlSide()));
        }
        // Stand on the VISIBLE top of this tile (hill summit if on a hill) so
        // the figure rests ON the terrain instead of sinking into a raised bump.
        const topY = tileTopY(this.terrainMap, col, row);
        group.position.set(x, topY, z);

        // FACING: straight toward the enemy line (E for attacker, W for defender).
        const facing = faceDir;
        group.rotation.y = dirYaw(facing);
        this.scene.add(group);

        const mats:         THREE.Material[]       = (group.userData['mats']         as THREE.Material[]      ) ?? [];
        const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

        const ammo0 = ammoCount(bu);
        // AMMO bar (+ 3-ci slot/ramka) tylko dla jednostek z amunicja > 0; czysto
        // wrecz / nieskonczone strzaly -> tylko 2 paski (HP+morale) i ramka na dwa (Naster).
        const ammoShown = Number.isFinite(ammo0) && ammo0 > 0;
        const bars = makeUnitBars(sideColor(side, this._playerControlSide()), ammoShown);
        bars.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
        this.scene.add(bars.hpBarGroup);
        // Register the six bar meshes' geometries + materials for disposal
        // (mesh.geometry / .material), so the three over-head bars are cleaned
        // up with the scene -- same disposal path as the unit model resources.
        bars.hpBarGroup.traverse(obj => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
            const mm = mesh.material;
            if (Array.isArray(mm)) this.ownedMats.push(...mm);
            else if (mm) this.ownedMats.push(mm as THREE.Material);
          }
        });

        const ru: RuntimeBattleUnit = {
          bu,
          group,
          hpBarFg:     bars.hpBarFg,
          hpBarBg:     bars.hpBarBg,
          hpBarGroup:  bars.hpBarGroup,
          moraleBarFg: bars.moraleBarFg,
          moraleBarBg: bars.moraleBarBg,
          ammoBarFg:   bars.ammoBarFg,
          ammoBarBg:   bars.ammoBarBg,
          ammoBarShown: ammoShown,
          q:          col,
          r:          row,
          side,
          dead:      false,
          fadingOut: false,
          fadeStart: 0,
          acted:     false,
          moveLeft:  movementPoints(bu),
          range:      attackRange(bu),
          rangeBase:  attackRange(bu),
          ranged:     isRanged(bu),
          rangedBase: isRanged(bu),
          primaryRanged: isPrimaryRanged(bu),
          ammoLeft:   ammo0,
          ammoMax:    ammo0,
          dryCol:           -1,    // TASK 4: set when ammo runs out
          heldAfterFallback: false, // TASK 4: latches after ~3-tile fall-back
          mounted:      isMounted(bu),
          antiCavSpear: isAntiCavSpear(bu),
          phalanx:      isPhalanx(bu),
          facing,
          morale:      moraleBaseFor(bu),
          moraleMax:   moraleBaseFor(bu),
          neverRout:   isNeverRout(bu),
          fleeMorale:  fleeMoraleFor(bu),
          routed:      false,
          screenLostApplied: false,
          fleeStuck:   0,
          surroundApplied: false,
          // A routed unit FLEES toward its OWN home edge using NORMAL movement:
          // attacker -> col 0 (west), defender -> col BF_COLS-1 (east); _fleeStep
          // walks it there one tile per step at normal speed. It is removed from
          // the scene the moment it reaches the home-edge column.
          removed:    false,
          onWallWalkway: false,
          playerOrder:   { type: 'none' },
          rangedKite:       true,
          shootingEnabled:  true,
          groupId:      null,
          formationOffset: null,
          unitDoctrine: null,
          attackDirection: 'front',
          mats,
          perTokenGeos,
        };
        // Initialise HP, morale, and ammo bars to match unit state at spawn.
        this._updateHpBar(ru);
        this._updateMoraleBar(ru);
        this._updateAmmoBar(ru);
        this.occByKey.set(key, ru);
        return ru;
      });
    };

    // Cap each side to MAX_PER_SIDE so the field never overfills (the spec
    // allows up to 20 units per army). Extra units beyond the cap don't deploy.
    // FLANK CAVALRY: reorder each side so mounted units (konnica / rydwan) take
    // the front-rank WING rows (top & bottom ends of the rank axis) rather than
    // trailing in a partial rear rank, so horse/chariots sit on the wings.
    const atkArr = arrangeFlankCavalry(attackers.slice(0, MAX_PER_SIDE));
    const defArr = arrangeFlankCavalry(defenders.slice(0, MAX_PER_SIDE));
    // Zapisz oryginalne sklady (Reset deploy + Rozegraj ponownie)
    this._savedAtkBUs = cloneBattleUnitsForReplay(atkArr);
    this._savedDefBUs = cloneBattleUnitsForReplay(defArr);
    this._startAtkSnaps = atkArr.map(u => ({
      id: u.id,
      typeId: u.nazwa,
      kategoria: u.kategoria,
      hp: u.hp,
      maxHp: u.maxHp,
    }));
    this._startDefSnaps = defArr.map(u => ({
      id: u.id,
      typeId: u.nazwa,
      kategoria: u.kategoria,
      hp: u.hp,
      maxHp: u.maxHp,
    }));
    // SIEGE_ATK_FRONT_COL: kolumna frontu wrecz atakujacego (blisko krawedzi 0 = daleko od muru).
    // Wrecz sa z przodu (frontCol=2), za nimi oszczepnicy, lucznicy, a OSTATNIE szeregi to
    // maszyny obleznicze (siegeI). Step=+1 (rosnace kolumny = kierunek ku murowi).
    // Dystans od frontu (kol 2) do siegeWallCol (kol ~23) wynosi ~21 hexow --
    // katapulta (zasieg 5) zatrzyma sie na kol ~18 i bedzie strzelac z dystansu.
    const SIEGE_ATK_FRONT_COL = 2;  // front wrecz atakujacego -- kol 2 (daleka krawedz)
    const SIEGE_ATK_COL_STEP  = 1;  // krok ROSNACY = ku murowi (katapulty laduja za piechota)
    if (siegeMode && this.siegeWallCol >= 0) {
      // SIEGE DEPLOYMENT
      // Atakujacy: cala armia przy wlasnej krawedzi (kol 2+), formacja wrecz/oszczep/luki/siege;
      //   maszyny sa OSTATNIE (najdalej od muru), ale i tak sa daleko -- beда PODEJSC.
      // Obroncy: wrecz NA MURZE (siegeWallCol), reszta za murem.
      this.atk = place(atkArr, 'atk', SIEGE_ATK_FRONT_COL, SIEGE_ATK_COL_STEP, Dir.E);
      this._repositionSiegeAttackers(); // no-op; zachowany dla kompatybilnosci
      this.def = this._placeSiegeDefenders(defArr);
    } else {
      const atkFront = this._deployMode ? DEPLOY_ATK_FRONT_COL : ATK_FRONT_COL;
      const atkStep  = this._deployMode ? DEPLOY_ATK_COL_STEP  : ATK_COL_STEP;
      const defFront = this._deployMode ? DEPLOY_DEF_FRONT_COL : DEF_FRONT_COL;
      const defStep  = this._deployMode ? DEPLOY_DEF_COL_STEP  : DEF_COL_STEP;
      this.atk = place(atkArr, 'atk', atkFront, atkStep, Dir.E);
      this.def = place(defArr, 'def', defFront, defStep, Dir.W);
    }
  }

  // -------------------------------------------------------------------------
  // Private: turn loop (every unit acts once per turn)
  // -------------------------------------------------------------------------

  /**
   * Begin one TURN. A turn is a single pass in which EVERY living unit (both
   * sides) takes exactly ONE action -- either a one-tile-at-a-time MOVE toward
   * an attack position (up to its full movement points) OR, if a target is
   * already in reach, a SINGLE blow. Movement is refreshed for every unit at
   * the start of the turn. The whole army keeps acting each turn; the battle
   * NEVER blocks on one pair fighting to the death.
   */
  /** Anty-pat: wykrywa brak postepu (linie sie nie dosiegaja) i konczy bitwe. */
  private _updateStallWatch(): void {
    // W trybie oblezenia atakujacy maszeruje/buduje machiny przez wiele tur bez
    // starcia -- watchdog odpalalyby sie falszywie. Pomijamy inkrementowanie.
    if (this.siegeWallCol >= 0) return;
    let hp = 0, mor = 0, out = 0;
    for (const u of [...this.atk, ...this.def]) {
      hp += Math.max(0, u.bu.hp); mor += Math.max(0, u.morale);
      if (u.dead || u.routed) out++;
    }
    const sig = Math.round(hp) + '|' + Math.round(mor) + '|' + out;
    if (sig === this._stallSig) this._stallTurns++;
    else { this._stallTurns = 0; this._stallSig = sig; }
    if (this._stallTurns >= STALL_TURN_LIMIT) this._stalled = true;
  }

  private _beginTurn(): void {
    if (this.finished) return;
    if (this._battleAwaitingOrders) return;
    this._updateStallWatch();
    if (this._checkEnd()) return;
    this.roundNo++;

    // Snapshot of all living, non-routed units for this turn, interleaved
    // atk/def so both sides participate throughout the turn (initiative order).
    // Routed units are INCLUDED so they get a turn to FLEE (normal movement
    // toward their home edge); they never attack (handled in _activateUnit).
    const a = this.atk.filter(u => !u.dead && !u.fadingOut && !u.removed);
    const d = this.def.filter(u => !u.dead && !u.fadingOut && !u.removed);
    const order: RuntimeBattleUnit[] = [];
    if (this._manualMode) {
      const player = this._playerRoster().filter(u => !u.dead && !u.fadingOut && !u.removed);
      const enemy = this._enemyRoster().filter(u => !u.dead && !u.fadingOut && !u.removed);
      order.push(...player, ...enemy);
    } else {
      const n = Math.max(a.length, d.length);
      for (let i = 0; i < n; i++) {
        const au = a[i];
        const du = d[i];
        if (au) order.push(au);
        if (du) order.push(du);
      }
    }

    // Every unit acts this turn and gets fresh movement points.
    for (const ru of order) {
      ru.acted    = false;
      ru.moveLeft = movementPoints(ru.bu);
    }

    this.turnOrder = order;
    this.turnIdx   = 0;

    this.hint.textContent =
      'Tura ' + this.roundNo + ' — klik: ruch/atak od razu. Ctrl/Shift: dyspozycja · SPACJA: wykonaj odlozone.';

    this._updateBattlePhaseBanner();
    this._activateNext();
  }

  /**
   * Activate the next unit in this turn's order. When the order is exhausted,
   * a new turn begins. Each unit performs exactly ONE action.
   */
  private _activateNext(): void {
    if (this.finished) return;
    if (this._battleAwaitingOrders) return;
    if (this._checkEnd()) return;

    // Find the next unit in the snapshot that is still alive and has not acted.
    let ru: RuntimeBattleUnit | null = null;
    while (this.turnIdx < this.turnOrder.length) {
      const cand = this.turnIdx < this.turnOrder.length ? this.turnOrder[this.turnIdx] : undefined;
      this.turnIdx++;
      // Skip dead / fading / already-acted AND routed units (a unit that broke
      // mid-turn must not take an action).
      // Routed units ARE activated (to flee a few tiles per turn); they never attack.
      if (cand && !cand.dead && !cand.fadingOut && !cand.removed && !cand.acted) { ru = cand; break; }
    }

    if (!ru) {
      // Whole turn done -> start the next turn after a short breather.
      this._schedule(TURN_GAP_MS, () => this._beginTurn());
      return;
    }

    const u = ru;
    this._updateBattlePhaseBanner(u);
    this._activateUnit(u, () => {
      if (this._autoBattleSuspended) {
        this.busy = false;
        return;
      }
      const idlePlayerUnit =
        this._manualMode
        && this._isPlayerSide(u.side)
        && u.playerOrder.type === 'none'
        && !this._isUnitDoctrineAuto(u);
      if (!idlePlayerUnit) u.acted = true;
      // Light stagger so actions play in quick succession without freezing the
      // rest of the army.
      this._schedule(ACT_GAP_MS, () => this._activateNext());
    });
  }

  /**
   * One unit's single action for this turn. The decision SPLITS by unit type:
   *
   *   RANGED (can still shoot -- has a ranged attack/ammo, incl. a Legionista
   *   WHILE it has pila) -> _rangedAction: SHOOT ASAP whenever an enemy sits in
   *   range and is not point-blank; KITE away when an enemy closes inside the
   *   safe gap; otherwise APPROACH only up to the farthest in-range tile. Once a
   *   shooter is out of ammo (canShoot false) it falls through to the MELEE path.
   *
   *   MELEE (or a shooter out of ammo) -> CHANGE D: if an enemy is adjacent,
   *   strike it; otherwise advance by the most DIRECT route toward the nearest
   *   enemy and engage (no aimless lateral wandering).
   *
   * Either way a unit takes exactly ONE action per turn (one move OR one blow);
   * a blow's counter still lands on the target's OWN later turn.
   */
  private _activateUnit(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    // ROUTED units FLEE this turn using NORMAL movement toward their home edge
    // and NEVER attack. This branch runs FIRST, before any facing/ranged/melee
    // logic, so a broken unit only ever walks off the field.
    if (ru.routed) { this._fleeStep(ru, done); return; }

    // C-TEREN-Q1 ETAP 2 -- recompute this turn's shooting range from the tile
    // the unit is STANDING ON (not the target's tile) BEFORE any branch below
    // reads ru.range: Las -1 / Wzgorza+Gory +1 (data/terrain-combat.json "Delta
    // Zasieg (dystansowi)"). Runs every activation (position only changes
    // between activations -- a unit takes one action per turn -- so this always
    // reflects where it stood when its turn began). The wall-walkway elevation
    // bonus (below) stacks additively on top of this terrain-adjusted value.
    this._applyTerrainRange(ru);

    // STEROWANIE RECZNIE: jednostki gracza (atak lub obrona)
    if (this._manualMode && this._isPlayerSide(ru.side)) {
      if (this._performPlayerOrder(ru, done)) return;
    }

    // AUTO bitwy: jednostki z autoPlay wykonuja doktryne (Szturm, Atak, Obrona, …)
    if (!this._manualMode) {
      if (this._isUnitDoctrineAuto(ru) && ru.playerOrder.type === 'none') {
        const meta = this._effectiveMetaForUnit(ru);
        if (meta.doctrine !== 'manual') {
          if (this._executeGroupDoctrineStep(ru, meta, done)) return;
        }
      }
    }

    // FACTOR 5 -- SURROUNDED: ONCE per unit, if >=3 enemies are adjacent
    // (Manhattan==1) it takes a one-off morale hit and may rout. The once-flag
    // (surroundApplied) prevents repeat hits / loops.
    if (!ru.surroundApplied && !ru.neverRout) {
      const enemies = ru.side === 'atk' ? this.def : this.atk;
      let adjEnemies = 0;
      for (const e of enemies) {
        if (e.dead || e.fadingOut || e.routed) continue;
        if (manhattan(e.q, e.r, ru.q, ru.r) === 1) adjEnemies++;
      }
      if (adjEnemies >= 3) {
        ru.surroundApplied = true;
        ru.morale = Math.max(0, ru.morale - MORALE_SURROUND_HIT);
        this._updateMoraleBar(ru);
        this._checkRout(ru);
        if (ru.routed) { this._fleeStep(ru, done); return; }
      }
    }

    // Re-orient toward the nearest enemy before acting: this is the unit
    // "picking a new target", so its FRONT tracks the line it engages.
    this._updateFacing(ru);

    // SIEGE v2 -- WALL WALKWAY DEFENDERS: stay on the wall, get +1 range bonus.
    // A unit with onWallWalkway=true NEVER steps off the wall voluntarily. It
    // either shoots (with the elevation range bonus) or fights melee against
    // enemies at the base or on the walkway. No kiting, no advancing.
    if (ru.onWallWalkway) {
      // Defender CATAPULT (kontrbateria): range already set to 6 in _placeSiegeDefenders.
      // No additional range boost needed (already includes elevation).
      const wallRangeBonus = (ru.rangedBase && !this._isCatapult(ru.bu)) ? 1 : 0;
      // Temporarily boost range for this action (elevation = +1 like hills).
      const origRange = ru.range;
      if (wallRangeBonus > 0) ru.range = origRange + wallRangeBonus;

      if (canShoot(ru)) {
        // DEFENDER CATAPULT (kontrbateria): prioritize nearest attacker catapult in range 6.
        let tgt: RuntimeBattleUnit | null = null;
        if (this._isCatapult(ru.bu) && ru.side === 'def') {
          // Find nearest attacker catapult within range 6.
          const enemies = this._enemiesOf(ru);
          let bestCata: RuntimeBattleUnit | null = null;
          let bestCataDist = Infinity;
          for (const e of enemies) {
            if (e.dead || e.fadingOut || e.routed) continue;
            if (!this._isCatapult(e.bu)) continue;
            const dd = manhattan(ru.q, ru.r, e.q, e.r);
            if (dd <= ru.range && dd < bestCataDist) { bestCataDist = dd; bestCata = e; }
          }
          tgt = bestCata ?? this._rangedTargetInRange(ru);
        } else {
          // Shoot: use standard ranged action but DISABLE kiting/movement.
          tgt = this._rangedTargetInRange(ru);
        }
        if (tgt) {
          ru.range = origRange; // restore before doAttack reads it
          this._doAttack(ru, tgt, done);
          return;
        }
        // No target in range (wall range bonus already applied) -> hold.
        ru.range = origRange;
        done();
        return;
      }
      // Melee: check adjacency (includes base-of-wall and on-walkway).
      ru.range = origRange;
      const adj = this._targetInRange(ru);
      if (adj) { this._doAttack(ru, adj, done); return; }
      // Nothing to do this turn -> hold position on the wall.
      done();
      return;
    }

    // SIEGE v2 -- SIEGE TOWER: rejestracja w towerAtWallRows odbywa sie
    // w bloku isSiegeUnit powyzej; tutaj juz nie powielamy.

    // SIEGE v2 -- CLIMB via SIEGE TOWER: attacking infantry adjacent to a siege
    // tower that is at the wall base can step onto the wall walkway.
    if (!ru.onWallWalkway && ru.side === 'atk' && this.siegeWallCol >= 0 &&
        !isSiegeUnit(ru.bu) && !ru.mounted) {
      const wallBase = this.siegeWallCol - 1;
      // Is the unit adjacent to a tower at the wall?
      let canClimb = false;
      if (this.towerAtWallRows.size > 0) {
        for (const [dc, dr] of DIRS4) {
          const nc = ru.q + dc;
          const nr = ru.r + dr;
          if (nc === wallBase && this.towerAtWallRows.has(nr)) {
            canClimb = true; break;
          }
        }
      }
      if (canClimb) {
        // Check that the walkway tile at (wallCol, ru.r) is free.
        const wallCol = this.siegeWallCol;
        const wallRow = ru.r; // same row as the unit
        const wallKey = cellKey(wallCol, wallRow);
        if (!this.occByKey.has(wallKey)) {
          // Climb: move onto walkway. Costs all movement.
          this.occByKey.delete(cellKey(ru.q, ru.r));
          ru.q = wallCol;
          ru.r = wallRow;
          ru.onWallWalkway = true;
          this.occByKey.set(wallKey, ru);
          const { x, z } = cellToWorld(wallCol, wallRow);
          const walkY = 2.5; // wall walk height
          ru.group.position.set(x, walkY, z);
          ru.hpBarGroup.position.set(x, walkY + HPBAR_Y, z);
          ru.moveLeft = 0;
          done();
          return;
        }
      }
    }

    // SIEGE MACHINES: ruch i atak.
    // Taran (battering ram): atakuje TYLKO bramę z dystansu 1.
    // Katapulta (catapult, ranged): atakuje NAJBLIŻSZY kafel Muru z dystansu.
    // Wieża oblężnicza (siege tower): jedzie pod mur, piechota wchodzi po drabinie.
    // Zwykłe jednostki: nie niszczą muru ani bramy.
    if (isSiegeUnit(ru.bu) && ru.side === 'atk' && this.siegeWallCol >= 0) {
      const isRam  = this._isRam(ru.bu);
      const isCata = this._isCatapult(ru.bu);
      const isTower = isSiegeTower(ru.bu);
      if (isRam && !this.gateOpen) {
        // TARAN: jedzie do bramy i uderza gdy dystans 1
        const distToGate = manhattan(ru.q, ru.r, this.siegeGateCol, this.siegeGateRow);
        if (distToGate <= 1) {
          this._attackGate(ru, done);
          return;
        }
        this._advanceToward(ru, this.siegeGateCol, this.siegeGateRow, done);
        return;
      }
      if (isCata && this.wallTileHp.size > 0) {
        // KATAPULTA: strzela w NAJBLIŻSZY żywy kafel muru z zasięgu.
        // FIX 1: NIE rób pathfindingu do impassable kafla muru (BTerrain.Wall).
        // Zamiast tego poruszaj się na tile (wallCol-1, bestRow) = tuż przed murem.
        // FIX 2: Gdy w zasięgu — stój i strzelaj (stop-and-fire), nie idź dalej.
        const wallCol = this.siegeWallCol;
        const cataRange = this._siegeMachineRange(ru);
        let bestRow = -1, bestDist = Infinity;
        for (const [wr, hp] of this.wallTileHp) {
          if (hp <= 0) continue; // już wyburzony
          const d = manhattan(ru.q, ru.r, wallCol, wr);
          if (d < bestDist) { bestDist = d; bestRow = wr; }
        }
        if (bestRow >= 0 && bestDist <= cataRange) {
          // W zasięgu — strzelaj natychmiast (stop-and-fire), nie ruszaj się.
          this._attackWallTile(ru, bestRow, done);
          return;
        }
        // Poza zasięgiem — podejdź do (wallCol-1, bestRow): kafel PRZED murem (passable).
        if (bestRow >= 0) {
          const approachCol = Math.max(0, wallCol - 1);
          this._advanceToward(ru, approachCol, bestRow, done);
          return;
        }
        // Wszystkie kafle muru wyburzone — atakuj piechurów wroga
      }
      if (isTower) {
        // Wieża: jedzie pod mur (siegeWallCol-1); rejestracja w towerAtWallRows obsługiwana wyżej
        const wallBase = this.siegeWallCol - 1;
        if (ru.q >= wallBase) {
          this.towerAtWallRows.add(ru.r);
          done(); return; // stoi przy murze
        }
        this._advanceToward(ru, wallBase, ru.r, done);
        return;
      }
    }

    // NAPRAWA problem 4 — SIEGE DEFENDER HOLD (early check):
    // Wszyscy obrońcy siege (ranged, cavalry, phalanx, melee) NIGDY nie wychodzą ku wrogom.
    // Strzelają/atakują tylko przyległych; w przeciwnym razie HOLD.
    if (ru.side === 'def' && this.siegeWallCol >= 0) {
      if (canShoot(ru)) {
        const tgt = this._rangedTargetInRange(ru);
        if (tgt) { this._doAttack(ru, tgt, done); }
        else { done(); }
      } else {
        const adj = this._targetInRange(ru);
        if (adj) { this._doAttack(ru, adj, done); }
        else { done(); }
      }
      return;
    }

    // RANGED units (with ammo) use the dedicated kite-and-shoot decision so they
    // shoot the instant they can and back off rather than being pulled into melee.
    // TRYB shootingEnabled=false: idzie wrecz zamiast strzelac.
    if (canShoot(ru) && ru.shootingEnabled !== false) { this._rangedAction(ru, done); return; }

    // 1A OUT OF AMMO -- a PRIMARY shooter (archer/slinger/skirmisher) that has
    // run dry does NOT charge and does NOT run to the board edge (TASK 4): it
    // FALLS BACK ~FALLBACK_TILES tiles toward its own rear, then HOLDS and avoids
    // combat. It fights melee ONLY if an enemy reaches it (adjacent). A melee
    // unit that merely spent its throwing ammo (e.g. a Legionista out of pila)
    // skips this and closes to the sword below.
    if (ru.primaryRanged) {
      // Record the column where it ran dry the first time we get here.
      if (ru.dryCol < 0) ru.dryCol = this._advanceCoord(ru);

      const adj = this._targetInRange(ru); // adjacent enemy (range is now 1, ammo spent)
      if (adj) {
        // An enemy has reached it -> it FIGHTS (melee), whether or not it has a
        // retreat tile. (Holding ground means standing and fighting when caught.)
        this._doAttack(ru, adj, done);
        return;
      }

      // Has it fallen back far enough? Stop once it is FALLBACK_TILES tiles back
      // from where it ran dry, OR FALLBACK_TILES tiles from the nearest threat.
      const movedBack = ru.dryCol - this._advanceCoord(ru); // >0 = retreated this far
      const nearest   = this._nearestEnemy(ru);
      const distThreat = nearest ? manhattan(ru.q, ru.r, nearest.q, nearest.r) : Infinity;
      if (movedBack >= FALLBACK_TILES || distThreat >= FALLBACK_TILES) {
        ru.heldAfterFallback = true;
      }
      if (ru.heldAfterFallback) {
        // HOLD: no enemy adjacent (handled above) -> stand still this turn.
        done();
        return;
      }
      // Still pulling back the first ~3 tiles toward its own rear.
      this._fallBackStep(ru, done);
      return;
    }

    // RULE 1 -- CAVALRY / CHARIOT target priority. A mounted unit rides for the
    // enemy HORSE first, then enemy SKIRMISHERS, then other non-spear melee, and
    // SHUNS the anti-cavalry spear wall (wlocznik / falanga). It attacks a spear
    // only when FORCED (adjacent with no better adjacent target and no maneuver
    // tile that keeps it clear of spears).
    if (ru.mounted) { this._cavalryAction(ru, done); return; }

    // RULE 2 -- PHALANX line cohesion. A phalanx engages an adjacent enemy, but
    // otherwise advances ONLY while staying aligned with its phalanx neighbours
    // (it must not outrun the line) and prefers to keep lateral adjacency (no
    // holes). A lone phalanx falls through to the normal melee advance below.
    if (ru.phalanx) { this._phalanxAction(ru, done); return; }

    // MELEE (CHANGE D): adjacent enemy -> strike now; else advance directly.
    const target0 = this._targetInRange(ru);
    if (target0) {
      this._doAttack(ru, target0, done);
      return;
    }
    this._advanceStep(ru, done);
  }

  // -------------------------------------------------------------------------
  // RULE 1 -- CAVALRY / CHARIOT tactical decision (target priority + spear avoid)
  // -------------------------------------------------------------------------

  /**
   * Priority class of an enemy from a cavalry unit's point of view (lower =
   * more desirable target):
   *   0 = enemy CAVALRY / chariot (ride for the enemy horse first),
   *   1 = enemy RANGED skirmisher (archer/slinger/javelin -- run them down),
   *   2 = other NON-spear melee,
   *   3 = anti-cavalry SPEAR (wlocznik / falanga) -- AVOID; only a forced target.
   */
  private _cavPriority(e: RuntimeBattleUnit): number {
    if (e.mounted)       return 0;
    if (e.primaryRanged) return 1;
    if (e.antiCavSpear)  return 2.5; // worse than other melee, better than nothing
    return 2;
  }

  /**
   * Pick a cavalry unit's preferred target among living enemies: the BEST
   * priority class (cavalry > ranged > other melee), ties broken by nearest then
   * lowest HP. Anti-cavalry spears are ranked WORST so they are chosen only when
   * no other enemy type remains on the field. Returns null if no enemy.
   */
  private _cavalryTarget(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestP = Infinity;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      const p = this._cavPriority(e);
      const d = manhattan(ru.q, ru.r, e.q, e.r);
      if (p < bestP ||
          (p === bestP && d < bestD) ||
          (p === bestP && d === bestD && best && e.bu.hp < best.bu.hp)) {
        bestP = p; bestD = d; best = e;
      }
    }
    return best;
  }

  /**
   * Among enemies ADJACENT to this cavalry unit, return the best NON-spear target
   * (so the rider strikes horse/skirmisher/plain-melee in preference to a spear),
   * or null if no adjacent non-spear enemy exists.
   *
   * C-FLANK (Maciej 2026-07-25): when attackDirection is 'bok'/'tyl', prefer an
   * adjacent non-spear enemy the blow would land on as flank/rear -- falls back
   * to the original cavalry-priority pick when none matches (or 'front').
   */
  private _cavAdjacentNonSpear(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    const bestOf = (predicate: (e: RuntimeBattleUnit) => boolean): RuntimeBattleUnit | null => {
      let best: RuntimeBattleUnit | null = null;
      let bestP = Infinity;
      for (const e of this._enemiesOf(ru)) {
        if (manhattan(ru.q, ru.r, e.q, e.r) !== 1) continue;
        if (e.antiCavSpear) continue;
        if (!predicate(e)) continue;
        const p = this._cavPriority(e);
        if (p < bestP || (p === bestP && best && e.bu.hp < best.bu.hp)) { bestP = p; best = e; }
      }
      return best;
    };
    const desired = desiredHitForDirection(ru.attackDirection);
    if (desired) {
      const m = bestOf(e => relativeHit(e.facing, ru.q, ru.r, e.q, e.r) === desired);
      if (m) return m;
    }
    return bestOf(() => true);
  }

  private _cavalryAction(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    // 1) A worthy (non-spear) enemy is adjacent -> strike it now.
    const adjGood = this._cavAdjacentNonSpear(ru);
    if (adjGood) { this._doAttack(ru, adjGood, done); return; }

    // 2) Choose the priority target and try to MANEUVER toward it while shunning
    // the spear wall. If a maneuver step exists, take it (pure move).
    const tgt = this._cavalryTarget(ru);
    if (!tgt) { done(); return; }

    // C-FLANK (Maciej 2026-07-25): kierunek natarcia 'bok'/'tyl' -- kawaleria
    // probuje najpierw manewr na flanke/tyl tego samego priorytetowego celu
    // (BFS, omija zajete pola). 'front' (domyslne) pomija ten blok -- zero
    // regresji istniejacego zachowania szarzy/unikania wlocznikow ponizej.
    const desiredDir = desiredHitForDirection(ru.attackDirection);
    if (desiredDir && this._cavDirectedManeuverStep(ru, done, tgt, desiredDir)) return;

    if (this._cavManeuverStep(ru, done, tgt)) return;

    // 3) No spear-clear step improved the approach. If FORCED -- an enemy spear
    // is adjacent and there is no better move -- attack the spear rather than
    // waste the turn (cornered against the wall). Otherwise hold this turn.
    let adjSpear: RuntimeBattleUnit | null = null;
    for (const e of this._enemiesOf(ru)) {
      if (manhattan(ru.q, ru.r, e.q, e.r) === 1) { adjSpear = e; break; }
    }
    if (adjSpear) { this._doAttack(ru, adjSpear, done); return; }
    // Ostatnia szansa: BFS / najlepszy krok szarzy (omijanie lasu i wlasnej linii).
    const stepKey = this._bestChargeStepKey(ru, tgt);
    if (stepKey && ru.moveLeft > 0) {
      const comma = stepKey.indexOf(',');
      const nc = parseInt(stepKey.slice(0, comma), 10);
      const nr = parseInt(stepKey.slice(comma + 1), 10);
      this._doMove(ru, nc, nr, done);
      return;
    }
    done();
  }

  /**
   * C-FLANK (Maciej 2026-07-25): manewr kierunku natarcia dla kawalerii --
   * probuje BFS-em (_firstStepTowardDirectedAttack) dotrzec na hex, z ktorego
   * cios trafi w `desired` ('flank'/'rear') wzgledem facingu `tgt`. Jesli krok
   * istnieje, wykonuje go i (dopoki zostal ruch i cel wciaz nie jest dobrym
   * sasiadem) probuje kontynuowac manewr w tym samym wywolaniu tury -- mirror
   * rekursji _cavManeuverStep, zeby jednostka realnie wykorzystywala caly swoj
   * ruch na obejscie, a nie tylko jeden hex na tur. Zwraca FALSE gdy manewr
   * jest juz osiagniety (cel adjGood zlapie to wyzej) lub niemozliwy w tym
   * kroku -- wtedy wywolujacy spada do istniejacej logiki (_cavManeuverStep,
   * unikanie wlocznikow / atak czolowy w ostatecznosci).
   */
  private _cavDirectedManeuverStep(
    ru: RuntimeBattleUnit, done: () => void, tgt: RuntimeBattleUnit, desired: FacingHit,
  ): boolean {
    if (ru.moveLeft <= 0) return false;
    const stepKey = this._firstStepTowardDirectedAttack(ru, tgt, desired);
    if (!stepKey) return false;

    const comma = stepKey.indexOf(',');
    const nc = parseInt(stepKey.slice(0, comma), 10);
    const nr = parseInt(stepKey.slice(comma + 1), 10);
    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      if (this._cavAdjacentNonSpear(ru)) { done(); return; }
      if (ru.moveLeft > 0) {
        const t2 = this._cavalryTarget(ru) ?? tgt;
        if (this._cavDirectedManeuverStep(ru, done, t2, desired)) return;
      }
      done();
    });
    return true;
  }

  /**
   * Step a cavalry unit ONE tile toward its priority target while AVOIDING the
   * enemy spear wall. Scores each free/passable neighbour: it must strictly
   * reduce distance to the target; tiles ADJACENT to an enemy anti-cav spear are
   * heavily penalised so the rider swings around the spears rather than charging
   * into them. Animates the step (then re-evaluates next turn). Returns TRUE if a
   * step was issued (and `done` will be called by the move), FALSE if no
   * improving spear-clear step exists (caller decides whether to attack/hold).
   */
  private _cavManeuverStep(ru: RuntimeBattleUnit, done: () => void, tgt: RuntimeBattleUnit): boolean {
    if (ru.moveLeft <= 0) return false;
    const dNow = manhattan(ru.q, ru.r, tgt.q, tgt.r);

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;
      if (!this._passableForUnit(ru, nc, nr)) continue;

      const dTgt = manhattan(nc, nr, tgt.q, tgt.r);

      let spearAdj = false;
      for (const e of this._enemiesOf(ru)) {
        if (e.antiCavSpear && manhattan(nc, nr, e.q, e.r) === 1) { spearAdj = true; break; }
      }
      // Prefer closing on target; if front blocked, allow flank/lateral (-dTgt still scores).
      // C-BTL-BROD-Q1: small penalty for a candidate tile that is itself a Ford,
      // so the rider prefers an equal-progress dry tile over parking in the ford.
      const fordPenalty = isFordTile(this.terrainMap, nc, nr) ? FORD_AI_AVOID_PENALTY : 0;
      const score = (dNow - dTgt) * 12 - dTgt + (spearAdj ? 0 : 5) - fordPenalty;
      if (score > bestScore) { bestScore = score; best = nk; }
    }

    if (!best) return false;
    const parts = best.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);
    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      // After the step: if now adjacent to a worthy target, stop (strike next
      // turn); else keep maneuvering while movement remains.
      if (this._cavAdjacentNonSpear(ru)) { done(); return; }
      if (ru.moveLeft > 0) {
        const t2 = this._cavalryTarget(ru);
        if (t2 && this._cavManeuverStep(ru, done, t2)) return;
      }
      done();
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // RULE 2 -- PHALANX line cohesion (even line, never outrun, no gaps)
  // -------------------------------------------------------------------------

  /**
   * The phalanx LINE-FRONT advance coordinate for one side (RULE 2): the advance
   * column of the LAGGARD -- the LEAST-advanced living phalanx on this side,
   * INCLUDING this unit itself and INCLUDING any phalanx delayed by costly
   * terrain (water/forest): a stuck unit literally stands at a low advance column,
   * so taking the minimum over actual positions makes the laggard set the pace
   * even when it is bogged down. The whole line aligns DOWN to this value and
   * WAITS for the straggler; no phalanx is allowed to push more than one tile
   * past it (the shared anti-freeze creep). Returns null if this is the ONLY
   * living phalanx on its side (then it behaves like normal melee). Excludes
   * routed/dead/fading units.
   */
  private _phalanxLineFront(ru: RuntimeBattleUnit): number | null {
    const group = (ru.side === 'atk' ? this.atk : this.def)
      .filter(u => u.phalanx && !u.dead && !u.fadingOut && !u.routed);
    // Need at least one OTHER phalanx for line behaviour; a lone phalanx falls
    // back to normal melee in _phalanxAction.
    if (group.length <= 1) return null;
    let least = Infinity;
    for (const u of group) { const a = this._advanceCoord(u); if (a < least) least = a; }
    return least;
  }

  /**
   * A unit's side-relative ADVANCE coordinate: how far FORWARD (toward the enemy)
   * it stands. Attacker advances to higher col (+col); defender to lower col
   * (-col). Higher = further forward; lower = further back (toward own rear).
   * Used by both the phalanx line-front (RULE 2) and the out-of-ammo fall-back
   * distance (TASK 4).
   */
  private _advanceCoord(ru: RuntimeBattleUnit): number {
    return ru.side === 'atk' ? ru.q : -ru.q;
  }

  /** This unit's own side-relative advance coordinate (see _phalanxLineFront). */
  private _phalanxAdvanceOf(ru: RuntimeBattleUnit): number {
    return this._advanceCoord(ru);
  }

  private _phalanxAction(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    // Engage normally: an adjacent enemy is struck this turn.
    const adj = this._targetInRange(ru);
    if (adj) { this._doAttack(ru, adj, done); return; }

    // Lone phalanx (no phalanx neighbours) -> behave like normal melee.
    const lineFront = this._phalanxLineFront(ru);
    if (lineFront === null) { this._advanceStep(ru, done); return; }

    // LINE COHESION (RULE 2, anti-freeze): lineFront is the LAGGARD's advance
    // column (the least-advanced living phalanx, including any unit stuck on
    // costly terrain). The line PRESSES FORWARD as a thick band every turn: a
    // phalanx keeps advancing unless it is already PHALANX_LEAD_TOLERANCE tiles
    // AHEAD of the laggard, in which case it pauses ONE turn so the straggler /
    // rear ranks even up. This deliberately does NOT freeze the whole front the
    // instant a single unit is one tile back (the old bug after front-rank
    // losses) -- a terrain-stuck straggler only reins the line in to a tolerance
    // band, it never stops the advance. _phalanxStep caps the step so a unit
    // never pushes beyond lineFront + PHALANX_LEAD_TOLERANCE.
    const myAdv = this._phalanxAdvanceOf(ru);
    if (myAdv > lineFront + PHALANX_LEAD_TOLERANCE) {
      // Too far ahead of the laggard -> HOLD one turn so the line evens up.
      done();
      return;
    }
    // Within the line band -> advance ONE controlled step that (a) closes on the
    // enemy, (b) prefers keeping lateral phalanx adjacency (no holes), and (c)
    // never overshoots beyond lineFront + PHALANX_LEAD_TOLERANCE (the shared band).
    this._phalanxStep(ru, done, lineFront);
  }

  /**
   * One cohesion-aware forward step for a phalanx. Picks the free/passable
   * neighbour that reduces distance to the nearest enemy, does NOT push the
   * unit's advance beyond lineFront+1 (so it never outruns the line), and prefers
   * tiles that keep it laterally adjacent to a friendly phalanx (closing gaps).
   * Single step; the line advances together over successive turns. Holds (no
   * move) if no compliant step exists.
   */
  private _phalanxStep(ru: RuntimeBattleUnit, done: () => void, lineFront: number): void {
    if (ru.moveLeft <= 0) { done(); return; }
    // Falanga NIE goni skirmisherow (procarze/lucznicy): celuj w najblizszego
    // NIE-dystansowego wroga (linia/wrecz). Gdy zostali sami kitujacy strzelcy
    // -> trzymaj linie, nie ruszaj w poscig (Naster: nierealistyczne).
    let enemy: RuntimeBattleUnit | null = null; let _bd = Infinity;
    for (const e of this._enemiesOf(ru)) {
      if (e.primaryRanged) continue;
      const d = manhattan(ru.q, ru.r, e.q, e.r);
      if (d < _bd) { _bd = d; enemy = e; }
    }
    if (!enemy) { done(); return; }
    const dNow = manhattan(ru.q, ru.r, enemy.q, enemy.r);
    const allies = (ru.side === 'atk' ? this.atk : this.def)
      .filter(u => u !== ru && u.phalanx && !u.dead && !u.fadingOut && !u.routed);

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;
      if (!this._passableForUnit(ru, nc, nr)) continue;

      const dEnemy = manhattan(nc, nr, enemy.q, enemy.r);
      if (dEnemy >= dNow) continue; // must close on the enemy

      // Don't outrun the line: the step's advance coord must stay within the
      // tolerance band of the laggard (front + PHALANX_LEAD_TOLERANCE).
      const stepAdv = ru.side === 'atk' ? nc : -nc;
      if (stepAdv > lineFront + PHALANX_LEAD_TOLERANCE) continue;

      // Prefer keeping lateral adjacency to a friendly phalanx (avoid holes).
      let touchesPhalanx = false;
      for (const a of allies) {
        if (manhattan(nc, nr, a.q, a.r) === 1) { touchesPhalanx = true; break; }
      }
      const score = (dNow - dEnemy) * 10 + (touchesPhalanx ? 6 : 0);
      if (score > bestScore) { bestScore = score; best = nk; }
    }

    if (!best) { done(); return; } // no compliant step -> hold the line this turn
    const parts = best.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);
    this._doMove(ru, nc, nr, () => { done(); }); // exactly one controlled step per turn
  }

  // -------------------------------------------------------------------------
  // Private: RANGED tactical decision (CHANGE C -- kite & shoot ASAP)
  //
  // A shooter's single action each turn, in priority order:
  //   1) NEAREST enemy is at a SAFE distance and within range (RANGED_MIN_GAP <=
  //      dist <= range) -> SHOOT it this turn (prefer the nearest valid target).
  //      Do not reposition when it can already fire -- shoot ASAP.
  //   2) An enemy is too close (dist < RANGED_MIN_GAP, i.e. adjacent) -> KITE:
  //      step toward the reachable tile that MAXIMISES distance from the nearest
  //      threat while staying within range (so it can shoot next turn), biased
  //      toward its own back edge / open space, never stepping next to another
  //      enemy. After kiting, if a step opened a safe in-range shot this turn it
  //      still holds fire (one action/turn) -- it shoots next turn.
  //   3) No enemy in range (dist > range) -> APPROACH the nearest enemy by the
  //      most direct step, but STOP at the farthest tile still within range
  //      (never walk to point-blank/adjacent), then shoot on a later turn.
  // -------------------------------------------------------------------------

  private _rangedAction(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    const nearest = this._nearestEnemy(ru);
    if (!nearest) { done(); return; }
    const dNear = manhattan(ru.q, ru.r, nearest.q, nearest.r);

    // =====================================================================
    // STRICT DETERMINISTIC RANGED PRIORITY (no oscillation). Exactly ONE of
    // the four branches fires per activation, checked top-down:
    //
    //   1) KITE  -- a melee foe is within MELEE_SAFE_GAP (Manhattan <= 2):
    //               step directly AWAY one tile to restore the gap. The ONLY
    //               reason to move backward while armed.
    //   2) SHOOT -- otherwise, if a target is in firing range: SHOOT and STAY.
    //               Shooting beats moving. (No RANGED_MIN_GAP gate: once the
    //               melee-threat check in (1) has passed, any in-range target
    //               is fair game, even point-blank ranged-vs-ranged.)
    //   3) APPROACH -- otherwise (no target in range): march FORWARD toward
    //               the nearest enemy by the SAME shortest path the melee
    //               units use, stopping the instant a target enters range.
    //   4) (out of ammo never reaches here -- canShoot is false and the
    //       caller routes it to the fall-back path.)
    // =====================================================================

    // 1) STEP BACK -- a melee threat has closed inside MELEE_SAFE_GAP. Step
    // straight BACK along our ADVANCE AXIS (toward our own rear) to restore the
    // gap, keeping our lane; if still in range afterwards we shoot next turn. If
    // cornered (no improving backward tile) don't waste the turn: fire the
    // in-range foe in our face. Enemy RANGED units never trigger this (we are
    // happy to stand near them and shoot).
    // TRYB rangedKite=false: pomijamy krok wstecz, unit bije z miejsca.
    if (ru.primaryRanged && ru.rangedKite !== false) {
      const meleeThreat = this._nearestEnemyMelee(ru);
      if (meleeThreat && manhattan(ru.q, ru.r, meleeThreat.q, meleeThreat.r) <= MELEE_SAFE_GAP) {
        // KITE-AND-SHOOT: step back the MINIMUM needed to a tile from which a
        // target is STILL within range, then FIRE this same turn -- never drift
        // off silently. Pick the single backward tile that maximises the gap to
        // the threat WHILE keeping it (or any enemy) shootable (Manhattan in
        // [1..range]). If no such tile exists, don't move -- just shoot the
        // nearest in-range threat from where we stand.
        const stepKey = this._bestKiteShotStep(ru, meleeThreat);
        if (stepKey) {
          const parts = stepKey.split(',');
          const nc = Number(parts[0]);
          const nr = Number(parts[1]);
          this._doMove(ru, nc, nr, () => {
            if (this.finished) { done(); return; }
            // Shoot from the new tile: prefer the nearest in-range target; else
            // the original melee threat if still within range; else end the turn
            // (the chosen tile guarantees something is in range).
            let tgt = this._rangedTargetInRange(ru);
            if (!tgt && !meleeThreat.dead && !meleeThreat.fadingOut && !meleeThreat.routed
                && manhattan(ru.q, ru.r, meleeThreat.q, meleeThreat.r) <= ru.range) {
              tgt = meleeThreat;
            }
            if (tgt) this._doAttack(ru, tgt, done);
            else done();
          });
          return;
        }
        // Cornered / no backward tile keeps a target in range -> shoot in place.
        const tgt = this._rangedTargetInRange(ru) ?? nearest;
        this._doAttack(ru, tgt, done);
        return;
      }
    }

    // 2) SHOOT and STAY -- any enemy within firing range (no melee foe is inside
    // the safe gap, branch 1 handled that). Shooting has priority over moving.
    if (dNear >= 1 && dNear <= ru.range) {
      const tgt = this._rangedTargetInRange(ru) ?? nearest;
      this._doAttack(ru, tgt, done);
      return;
    }

    // 3) ADVANCE FORWARD -- nothing in range: march along our ADVANCE AXIS toward
    // the enemy front (attacker -> +col/east, defender -> -col/west), keeping our
    // LANE (minimise lateral row change), and STOP the instant any enemy enters
    // firing range (it shoots on a later turn). No BFS-to-adjacency, no sideways
    // detours -- a clean forward step that keeps the skirmisher in its lane.
    this._rangedForwardStep(ru, done);
  }

  /** Advance-axis column DELTA for a side's FORWARD direction toward the enemy:
   *  attacker advances to higher col (+1, east); defender to lower col (-1, west). */
  private _advanceDir(side: 'atk' | 'def'): number {
    return side === 'atk' ? 1 : -1;
  }

  /** Kolumna N kroków w stronę wroga (z clampem do planszy). */
  private _forwardCol(side: 'atk' | 'def', col: number, steps = 1): number {
    return Math.max(0, Math.min(BF_COLS - 1, col + this._advanceDir(side) * steps));
  }

  /** Ogranicza kolumnę marszu w stronę wroga (nie dalej niż pozycja celu). */
  private _clampColTowardEnemy(side: 'atk' | 'def', col: number, enemyCol: number): number {
    return side === 'atk' ? Math.min(enemyCol, col) : Math.max(enemyCol, col);
  }

  /** Strona bitwy grupy (atk/def) — pierwszy żywy członek. */
  private _groupSide(gid: string): 'atk' | 'def' {
    for (const id of this._liveGroupMemberIds(gid)) {
      const u = this._findUnitById(id);
      if (u && !u.dead && !u.removed) return u.side;
    }
    return 'atk';
  }

  /**
   * RANGED FORWARD ADVANCE (task A): the primary fix for skirmishers drifting
   * sideways. The shooter steps along its side's ADVANCE AXIS toward the enemy
   * front, keeping its current LANE. Each turn it picks the passable neighbour
   * that most reduces the advance-axis (column) distance to the NEAREST enemy,
   * breaking ties by the SMALLEST lateral (row) change so it never fans out. It
   * STOPS the instant any enemy is within firing range (shoots on a later turn).
   * Verified in a /tmp sim: column distance to the enemy line decreases
   * monotonically with ~zero lateral drift, and it halts once in range.
   */
  private _rangedForwardStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    const nearest = this._nearestEnemy(ru);
    if (!nearest) { done(); return; }
    // Already in range? Stop -- it will shoot next turn (and won't over-close).
    if (manhattan(ru.q, ru.r, nearest.q, nearest.r) <= ru.range) { done(); return; }

    const stepKey = this._bestForwardStep(ru, nearest);
    if (!stepKey) { done(); return; } // walled in: hold for this turn
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      const e = this._nearestEnemy(ru);
      if (!e) { done(); return; }
      // The moment we are within range, STOP (don't walk on toward adjacency).
      if (manhattan(ru.q, ru.r, e.q, e.r) <= ru.range) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._rangedForwardStep(ru, done));
      else done();
    });
  }

  /**
   * Choose the single best neighbour to step FORWARD onto for a shooter closing
   * on the enemy front, or null if no usable tile. Scores each free + passable
   * orthogonal neighbour:
   *   - PRIMARY: reduce the ADVANCE-AXIS (column) distance to the nearest enemy
   *     -- a forward step (along _advanceDir) beats a lateral one, which beats a
   *     backward step.
   *   - tie-break: SMALLEST change in lateral row (keep the lane); a step that
   *     also closes the row gap to the enemy edges out a pure-forward step into a
   *     wall, but lateral motion is otherwise minimised so units don't scatter.
   */
  private _bestForwardStep(ru: RuntimeBattleUnit, nearest: RuntimeBattleUnit): string | null {
    const dir = this._advanceDir(ru.side);
    const colDistNow = Math.abs(nearest.q - ru.q);

    let best: string | null = null;
    let bestColDist = Infinity;
    let bestLateral = Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;             // occupied
      if (!this._passableForUnit(ru, nc, nr)) continue; // deep river

      // Advance-axis (column) distance to the enemy from the candidate tile.
      const colDist = Math.abs(nearest.q - nc);
      // Lateral (row) change from the unit's CURRENT lane -- keep it minimal.
      const lateral = Math.abs(nr - ru.r);
      // Reject tiles that move us AWAY along the advance axis (backward), unless
      // forward is fully blocked and lateral is needed to round an obstacle: we
      // only accept a non-reducing step if it strictly closes the row gap to the
      // enemy lane (so a clogged lane can shuffle one tile toward the foe's row).
      const forwardGain = colDistNow - colDist; // >0 means closer along the axis
      const rowGap     = Math.abs(nearest.r - nr) - Math.abs(nearest.r - ru.r); // <0 means closer in row
      if (forwardGain <= 0 && rowGap >= 0) continue; // neither closes axis nor row
      // dir is informational here; colDist already encodes the correct direction
      // because the enemy sits on the far side along the axis.
      void dir;

      if (colDist < bestColDist || (colDist === bestColDist && lateral < bestLateral)) {
        bestColDist = colDist;
        bestLateral = lateral;
        best = nk;
      }
    }
    return best;
  }

  /**
   * Choose the best neighbour to step BACKWARD onto (toward our own rear, away
   * from the enemy front) when a melee foe has closed inside MELEE_SAFE_GAP --
   * restoring the firing gap while keeping the lane. Returns null if cornered
   * (no passable backward tile that opens the gap). Prefers a pure step along the
   * advance axis toward home; minimises lateral row change. Refuses tiles adjacent
   * to any enemy (never back into a different sword).
   */
  private _bestBackStep(ru: RuntimeBattleUnit): string | null {
    const dir = this._advanceDir(ru.side); // forward dir; we want the OPPOSITE
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;
    const threat = this._nearestEnemyMelee(ru) ?? this._nearestEnemy(ru);
    if (!threat) return null;
    const dNow = manhattan(ru.q, ru.r, threat.q, threat.r);

    let best: string | null = null;
    let bestGap = -Infinity;
    let bestLateral = Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;
      if (!this._passableForUnit(ru, nc, nr)) continue;

      // Never back ONTO a tile adjacent to ANY enemy.
      let dMinAny = Infinity;
      for (const e of enemies) {
        const dd = manhattan(nc, nr, e.q, e.r);
        if (dd < dMinAny) dMinAny = dd;
      }
      if (dMinAny <= 1) continue;

      const gap = manhattan(nc, nr, threat.q, threat.r);
      if (gap <= dNow) continue; // must open the gap from the threat
      // Prefer stepping straight back along the advance axis (col change toward
      // home, i.e. -dir), with minimal lateral row change to keep the lane.
      const movedBackAxis = (nc - ru.q) === -dir; // a pure backward axis step
      const lateral = Math.abs(nr - ru.r);
      // Score: gap opened dominates; a true backward-axis step is preferred via a
      // bonus; smallest lateral breaks remaining ties.
      const gapScore = gap * 100 + (movedBackAxis ? 50 : 0);
      if (gapScore > bestGap || (gapScore === bestGap && lateral < bestLateral)) {
        bestGap = gapScore;
        bestLateral = lateral;
        best = nk;
      }
    }
    return best;
  }

  /**
   * KITE-AND-SHOOT step picker. Choose a SINGLE backward tile (toward our own
   * rear, away from the melee threat) such that AFTER moving there at least one
   * enemy -- ideally the threat itself -- is STILL within firing range (Manhattan
   * in [1..range]) so the kite ENDS WITH A SHOT this same turn. Among qualifying
   * tiles prefer the one that MAXIMISES the gap to the threat (kite as far as we
   * can while staying able to fire), tie-broken toward our own rear / minimal
   * lateral drift. Never steps adjacent to ANY enemy (don't back into a sword).
   * Returns null if no backward tile keeps a target in range (caller then shoots
   * in place instead of wasting the turn).
   */
  private _bestKiteShotStep(ru: RuntimeBattleUnit, threat: RuntimeBattleUnit): string | null {
    const dir = this._advanceDir(ru.side); // forward dir; we want the OPPOSITE
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;
    const dNow = manhattan(ru.q, ru.r, threat.q, threat.r);

    let best: string | null = null;
    let bestGap = -Infinity;
    let bestLateral = Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;
      if (!this._passableForUnit(ru, nc, nr)) continue;

      // Distances FROM the candidate tile.
      let dMinAny = Infinity;
      let inRangeOfSome = false;
      for (const e of enemies) {
        const dd = manhattan(nc, nr, e.q, e.r);
        if (dd < dMinAny) dMinAny = dd;
        if (dd >= 1 && dd <= ru.range) inRangeOfSome = true;
      }
      // Never back ONTO a tile adjacent to ANY enemy.
      if (dMinAny <= 1) continue;
      // Must STILL be able to fire from here (otherwise the kite wastes the turn).
      if (!inRangeOfSome) continue;

      const gap = manhattan(nc, nr, threat.q, threat.r);
      if (gap <= dNow) continue; // must open the gap from the melee threat

      const movedBackAxis = (nc - ru.q) === -dir; // a pure backward axis step
      const lateral = Math.abs(nr - ru.r);
      const gapScore = gap * 100 + (movedBackAxis ? 50 : 0);
      if (gapScore > bestGap || (gapScore === bestGap && lateral < bestLateral)) {
        bestGap = gapScore;
        bestLateral = lateral;
        best = nk;
      }
    }
    return best;
  }

  /**
   * Step BACKWARD one tile at a time along the advance axis to restore the firing
   * gap from an encroaching melee foe (task A priority 1), spending up to the
   * unit's movement this turn. Pure move -- the shot follows on a later turn.
   * Stops once at a safe gap or when no improving backward tile remains.
   */
  private _rangedBackStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    // Safe already? (nearest melee enemy beyond the safe gap) -> stop.
    const m = this._nearestEnemyMelee(ru);
    if (!m || manhattan(ru.q, ru.r, m.q, m.r) > MELEE_SAFE_GAP) { done(); return; }

    const stepKey = this._bestBackStep(ru);
    if (!stepKey) { done(); return; }
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      const m2 = this._nearestEnemyMelee(ru);
      if (!m2 || manhattan(ru.q, ru.r, m2.q, m2.r) > MELEE_SAFE_GAP) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._rangedBackStep(ru, done));
      else done();
    });
  }

  /**
   * Pick the best LEGAL target a shooter may fire at from its CURRENT tile,
   * preferring the NEAREST enemy within [1..range] (ties broken by lower HP so
   * it finishes wounded foes). Returns null if nothing is in range. Distinct
   * from _targetInRange (which prefers lowest HP regardless of distance): the
   * kite logic wants the CLOSEST in-range target, matching "prefer the nearest".
   */
  private _rangedTargetInRange(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      const dd = manhattan(ru.q, ru.r, e.q, e.r);
      if (dd < 1 || dd > ru.range) continue;
      if (dd < bestD || (dd === bestD && best && e.bu.hp < best.bu.hp)) {
        bestD = dd; best = e;
      }
    }
    return best;
  }

  /**
   * KITE one tile at a time AWAY from the nearest threat, spending up to the
   * unit's movement this turn. Each step picks the free, passable neighbour that
   * best (a) increases the distance to the nearest enemy, (b) stays within the
   * unit's own range of some enemy when possible (so it can still shoot), and
   * (c) edges toward its own home side / open space, and which is never adjacent
   * to a DIFFERENT enemy (don't retreat into another sword). Stops once it stands
   * at a safe distance (>= RANGED_MIN_GAP) from the nearest enemy or when no step
   * improves the situation / movement runs out. Pure move -- the shot follows on
   * a later turn.
   */
  private _kiteStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }
    // rangedKite=false: pomijamy kite, natychmiast done
    if (ru.rangedKite === false) { done(); return; }

    const nearest = this._nearestEnemy(ru);
    if (!nearest) { done(); return; }

    // SKIRMISH REFINE: a PRIMARY shooter kites until it is at least MELEE_SAFE_GAP
    // from the nearest enemy MELEE unit (it tolerates standing near enemy ranged
    // units). Other shooters (e.g. a melee unit momentarily routed through here)
    // use the generic RANGED_MIN_GAP from the nearest enemy of any kind.
    if (this._kiteGapSatisfied(ru)) { done(); return; }

    const stepKey = this._bestKiteStep(ru);
    if (!stepKey) { done(); return; } // cornered / no improving retreat tile
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      // Reached a safe gap -> stop (shoot on a later turn).
      if (this._kiteGapSatisfied(ru)) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._kiteStep(ru, done));
      else done();
    });
  }

  /**
   * Choose the single best neighbour tile to KITE onto, or null if none helps.
   * Scores each free + passable orthogonal neighbour:
   *   - PRIMARY: maximise the distance to the NEAREST enemy (open up the gap).
   *   - reject tiles ADJACENT to any enemy (never back into a different melee).
   *   - prefer tiles still within the unit's RANGE of some enemy (so it keeps a
   *     shot next turn) over tiles that flee out of range entirely.
   *   - tie-break toward the unit's OWN home edge (attacker -> lower col / -X;
   *     defender -> higher col / +X) so it retreats toward its side, not sideways.
   */
  /**
   * SKIRMISH REFINE: is this unit currently at a SAFE gap (no need to kite
   * further)? For a PRIMARY shooter, "safe" means the nearest enemy MELEE unit
   * is at least MELEE_SAFE_GAP away (enemy ranged units are tolerated); if no
   * melee enemy remains, it is always safe. For any other unit, fall back to the
   * generic RANGED_MIN_GAP from the nearest enemy of any kind.
   */
  private _kiteGapSatisfied(ru: RuntimeBattleUnit): boolean {
    if (ru.primaryRanged) {
      const m = this._nearestEnemyMelee(ru);
      if (!m) return true;
      return manhattan(ru.q, ru.r, m.q, m.r) >= MELEE_SAFE_GAP;
    }
    const n = this._nearestEnemy(ru);
    if (!n) return true;
    return manhattan(ru.q, ru.r, n.q, n.r) >= RANGED_MIN_GAP;
  }

  private _bestKiteStep(ru: RuntimeBattleUnit): string | null {
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;
    // SKIRMISH REFINE: a PRIMARY shooter scores candidate tiles by distance from
    // the nearest enemy MELEE unit (the thing it must escape); other units use
    // the nearest enemy of any kind. The chosen "threat" anchor below.
    const threat = ru.primaryRanged
      ? (this._nearestEnemyMelee(ru) ?? this._nearestEnemy(ru))
      : this._nearestEnemy(ru);
    const dNow = threat ? manhattan(ru.q, ru.r, threat.q, threat.r) : Infinity;

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;            // occupied
      if (!this._passableForUnit(ru, nc, nr)) continue; // deep river

      // Distances FROM the candidate tile: dMinAny = nearest enemy of ANY kind
      // (used to forbid backing into adjacency with any sword), dMinThreat =
      // nearest MELEE enemy for a PRIMARY shooter (the gap we are opening) and
      // the nearest enemy of any kind otherwise.
      let dMinAny = Infinity;
      let dMinThreat = Infinity;
      let inRangeOfSome = false;
      for (const e of enemies) {
        const dd = manhattan(nc, nr, e.q, e.r);
        if (dd < dMinAny) dMinAny = dd;
        const counts = ru.primaryRanged ? !e.primaryRanged : true;
        if (counts && dd < dMinThreat) dMinThreat = dd;
        if (dd >= 1 && dd <= ru.range) inRangeOfSome = true;
      }
      // For a PRIMARY shooter with only ranged foes left, there is no melee to
      // open distance from; fall back to the nearest enemy of any kind.
      if (dMinThreat === Infinity) dMinThreat = dMinAny;
      // Never retreat ONTO a tile adjacent to ANY enemy (that is INTO melee).
      if (dMinAny <= 1) continue;
      // Must actually open the gap vs the threat where we stand now.
      if (dMinThreat <= dNow) continue;

      // Score: distance opened (from the threat) dominates; keeping a shot is a
      // strong bonus; a small bias toward our own home edge breaks ties so we
      // flee backward toward our own rear, not sideways.
      const homeBias = ru.side === 'atk' ? -nc : nc; // atk wants low col, def high col
      const score = dMinThreat * 100 + (inRangeOfSome ? 40 : 0) + homeBias;
      if (score > bestScore) { bestScore = score; best = nk; }
    }
    return best;
  }

  /**
   * 1A FALL-BACK (out-of-ammo primary shooter): pick the best neighbour tile to
   * RETREAT onto -- toward the unit's OWN home edge and behind the friendly
   * melee line -- or null if cornered (no free/passable tile that moves it away
   * from the nearest enemy). Unlike kiting (which wants to keep a shot), this
   * just wants to get OUT of the melee: it maximises distance to the nearest
   * enemy and biases hard toward the home edge, and refuses tiles adjacent to an
   * enemy. With no ammo there is no range to preserve.
   */
  private _bestFallBackStep(ru: RuntimeBattleUnit): string | null {
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;
    const nearestNow = this._nearestEnemy(ru);
    const dNow = nearestNow ? manhattan(ru.q, ru.r, nearestNow.q, nearestNow.r) : Infinity;

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;             // occupied
      if (!this._passableForUnit(ru, nc, nr)) continue; // deep river

      let dMin = Infinity;
      for (const e of enemies) {
        const dd = manhattan(nc, nr, e.q, e.r);
        if (dd < dMin) dMin = dd;
      }
      // Never retreat ONTO a tile adjacent to an enemy, and only accept tiles
      // that do not bring us CLOSER to the nearest threat.
      if (dMin <= 1) continue;
      if (dMin < dNow) continue;

      // Strong home-edge bias so the skirmisher streams back behind its line;
      // distance opened is a secondary tie-break.
      const homeBias = ru.side === 'atk' ? -nc : nc; // atk wants low col, def high col
      const score = homeBias * 100 + dMin;
      if (score > bestScore) { bestScore = score; best = nk; }
    }
    return best;
  }

  /**
   * Walk one tile at a time toward the home edge / behind the melee line for an
   * out-of-ammo primary shooter, spending up to its movement this turn. Pure
   * move (no attack); stops when no improving fall-back tile remains. The
   * cornered case (attack instead) is decided by the caller via
   * _bestFallBackStep before this is invoked.
   */
  private _fallBackStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    const stepKey = this._bestFallBackStep(ru);
    if (!stepKey) { done(); return; }
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._fallBackStep(ru, done));
      else done();
    });
  }

  /**
   * APPROACH for a shooter that has NO enemy in range yet: march STRAIGHT at the
   * nearest enemy by the shortest path, exactly like a melee unit closing for the
   * kill, and STOP the instant a target enters firing range (it shoots on a later
   * turn). It deliberately drives toward a tile ADJACENT to the nearest enemy --
   * the SAME convergent BFS goal the melee advance uses (_firstStepAlongPathToMelee)
   * -- so the path always heads toward the enemy line and never to some far
   * "farthest-in-range" ring tile or sideways. The instant the unit stands within
   * range it halts (it does NOT walk on to adjacency). A greedy nudge toward the
   * nearest enemy is the fallback when BFS is fully walled in.
   */
  private _rangedApproachStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    const nearest = this._nearestEnemy(ru);
    if (!nearest) { done(); return; }

    // Already in range? Stop -- it will shoot next turn (and won't over-close).
    if (manhattan(ru.q, ru.r, nearest.q, nearest.r) <= ru.range) { done(); return; }

    // Use the MELEE convergent path (goal = a free tile adjacent to the nearest
    // enemy) so the shooter walks straight at the enemy line. Fall back to a
    // greedy nudge that strictly reduces distance to the nearest enemy.
    const stepKey = this._firstStepTowardMelee(ru) ?? this._stepToward(ru, nearest);
    if (!stepKey) { done(); return; }
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      const e = this._nearestEnemy(ru);
      if (!e) { done(); return; }
      // The moment we are within range, STOP (don't walk to adjacency).
      if (manhattan(ru.q, ru.r, e.q, e.r) <= ru.range) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._rangedApproachStep(ru, done));
      else done();
    });
  }

  /**
   * MELEE ADVANCE (CHANGE D): walk one tile at a time toward the NEAREST enemy
   * by the most direct route, spending up to the unit's full movement points
   * this turn, and stop adjacent to it (ready to strike next turn). The route is
   * a BFS shortest path to the nearest free tile ADJACENT to an enemy, so the
   * unit drives straight forward into contact instead of wandering sideways; the
   * greedy fallback only accepts steps that strictly REDUCE distance to the
   * nearest enemy, so there is never any aimless lateral movement. This is a pure
   * move -- the unit does NOT attack even if a step brings it adjacent; it
   * strikes on a LATER turn. (Ranged units never reach here -- they use
   * _rangedAction; a shooter out of ammo falls through to this melee advance.)
   */
  // -------------------------------------------------------------------------
  // SIEGE: gate attack and move-toward-gate helpers
  // -------------------------------------------------------------------------

  /**
   * Siege machine attacks the gate this turn.
   * Deals a fixed damage based on unit Atak stat.
   * When gateHp drops to 0, the gate is breached: the gate mesh
   * portcullis/barrier is hidden, gate tiles become passable.
   */
  private _attackGate(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.gateOpen || this.siegeGateCol < 0) { done(); return; }

    // Damage: wallAttack TW (Taran 14, Katapulta 16) lub legacy Uderzenie/Atak
    const dmg = this._siegeStructureDamage(ru);

    // FIX 4: Animacja taranu (ruch do przodu i powrót) + SFX uderzenia
    const gw = cellToWorld(this.siegeGateCol, this.siegeGateRow);
    const gateDir = new THREE.Vector3(
      gw.x - ru.group.position.x,
      0,
      gw.z - ru.group.position.z,
    ).normalize();
    this._animateRam(ru.group, gateDir);
    this._sfxRamImpact();

    // Aplikuj obrażenia
    this.gateHp = Math.max(0, this.gateHp - dmg);
    if (this.gateHp <= 0) {
      this._breachGate();
    } else {
      this._updateSiegeHud();
    }

    ru.acted = true;
    done();
  }

  /** Animacja taranu: ruch do przodu i powrót (trójkąt). */
  private _animateRam(ramMesh: THREE.Object3D, direction: THREE.Vector3): void {
    try {
      const startPos = ramMesh.position.clone();
      const hitPos = startPos.clone().addScaledVector(direction, 0.25);
      const duration = 320; // ms wirtualnych
      const t0 = this._now();

      const animRam = () => {
        if (this.finished) {
          ramMesh.position.copy(startPos);
          return;
        }
        const t = Math.min(1, (this._now() - t0) / duration);
        // Trójkąt: do przodu (t<0.5) potem powrót (t>=0.5)
        const forward = t < 0.5 ? t * 2 : (1 - t) * 2;
        ramMesh.position.lerpVectors(startPos, hitPos, forward);
        if (t >= 1) {
          ramMesh.position.copy(startPos);
          return;
        }
        requestAnimationFrame(animRam);
      };
      requestAnimationFrame(animRam);
    } catch { /* no-op */ }
  }

  /** SFX: ciężkie uderzenie taranu w bramę (boom 55Hz + transient metaliczny). */
  private _sfxRamImpact(): void {
    if (this._sfxOff()) return;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      // Ciężki boom (55Hz)
      const osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.45);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.85, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(g).connect(this._masterGain!);
      osc.start(t); osc.stop(t + 0.52);
      // Krótki metaliczny transient (800Hz)
      const osc2 = ac.createOscillator(); osc2.type = 'sawtooth';
      osc2.frequency.value = 820;
      const g2 = ac.createGain();
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(0.28, t + 0.003);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      const lp2 = ac.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 2200;
      osc2.connect(lp2).connect(g2).connect(this._masterGain!);
      osc2.start(t); osc2.stop(t + 0.08);
      // Szum trzasku drewna
      const src = ac.createBufferSource(); src.buffer = this._noiseBuf(ac);
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.25, t + 0.005);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      src.connect(ng).connect(this._masterGain!);
      src.start(t); src.stop(t + 0.20);
    } catch { /* no-op */ }
  }

  /** Czy jednostka to Taran (battering ram) — atakuje bramę. */
  private _isRam(bu: BattleUnit): boolean {
    const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
    return n.includes('taran') || n.includes('battering');
  }

  /** Czy jednostka to Katapulta (dystansowa machina) — niszczy mur. */
  private _isCatapult(bu: BattleUnit): boolean {
    const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
    return n.includes('katapult') || n.includes('catapult') || n.includes('balist') || n.includes('onager');
  }

  // -------------------------------------------------------------------------
  // C-TEREN-Q1 ETAP 3 -- unit-aware move cost / passability.
  //
  // SINGLE shared rule for "can this unit enter (col,row)" / "what does it
  // cost": every movement/pathfinding call site in this file (kiting,
  // retreat, phalanx/cavalry maneuver, BFS approach, manual player orders,
  // siege advance, _doMove's per-step cost charge, and the battle-move ghost
  // preview) MUST call THIS pair, not this.terrainMap.passable/moveCost
  // directly -- otherwise a mounted unit could walk somewhere its own move
  // preview refused (owner spec, C-TEREN-Q1 ETAP 3).
  //
  // Foot units: identical to this.terrainMap.passable/moveCost (multiplier
  // 1 from cavalryTerrainMultiplier for every terrain), so this is a no-op
  // wrapper for them -- zero behaviour change for infantry/archers/siege.
  // Mounted units (cavalry/chariot, ru.mounted): Forest costs double (data:
  // Las "koszt x2"), Gory (world mountains preset only, see
  // battle-terrain.ts TerrainPreset.isMountain) is impassable (data:
  // "NIEDOSTEPNE dla kawalerii/rydwanow"). Both read from
  // data/terrain-combat.json via combat.ts's cavalryTerrainMultiplier --
  // never a hardcoded number here.
  // -------------------------------------------------------------------------

  /** Movement points to ENTER (col,row) for THIS unit. Infinity = cannot enter. */
  private _moveCostForUnit(ru: RuntimeBattleUnit, col: number, row: number): number {
    if (!this.terrainMap.passable(col, row)) return Infinity;
    const base = this.terrainMap.moveCost(col, row);
    if (!ru.mounted) return base;
    const mult = cavalryTerrainMultiplier(this.terrainMap.combatTerrainName(col, row), this.terrainData);
    if (!Number.isFinite(mult)) return Infinity;
    return base * mult;
  }

  /** True if THIS unit may stand on / enter (col,row) (terrain only -- ignores occupancy). */
  private _passableForUnit(ru: RuntimeBattleUnit, col: number, row: number): boolean {
    return Number.isFinite(this._moveCostForUnit(ru, col, row));
  }

  // -------------------------------------------------------------------------
  // C-TEREN-Q1 ETAP 2 -- terrain-derived ranged-reach delta.
  // -------------------------------------------------------------------------

  /**
   * Recompute ru.range = ru.rangeBase + terrain delta for the tile ru is
   * CURRENTLY standing on (data/terrain-combat.json "Delta Zasieg
   * (dystansowi)": Las -1, Wzgorza/Gory +1, everything else 0), gated the
   * same way the existing wall-elevation bonus is (rangedBase && not a
   * catapult -- a catapult's range is a fixed siege stat, never terrain-
   * modified). Non-ranged units (rangeBase === 0) are left at 0: melee reach
   * is adjacency-only regardless of terrain.
   *
   * Called once per activation (_activateUnit), BEFORE the wall-walkway
   * elevation bonus temporarily adds its own +1 on top -- the two stack
   * additively, same convention as that bonus already uses (origRange save/
   * restore around a temporary ru.range mutation).
   */
  private _applyTerrainRange(ru: RuntimeBattleUnit): void {
    if (!ru.rangedBase || this._isCatapult(ru.bu) || ru.rangeBase <= 0) {
      ru.range = ru.rangeBase;
      return;
    }
    const terrain = this.terrainMap.combatTerrainName(ru.q, ru.r);
    const delta = terrainRangeDelta(terrain, this.terrainData);
    ru.range = Math.max(0, ru.rangeBase + delta);
  }

  /** Obrażenia vs mur/bramę z units.json TW (`wallAttack`, fallback legacy). */
  private _siegeStructureDamage(ru: RuntimeBattleUnit): number {
    const s = ru.bu.stats as Record<string, unknown>;
    const wall = unitRowStat(s, 'wallAttack', undefined, 0);
    if (wall > 0) return Math.max(1, Math.round(wall));
    const rng = unitRowStat(s, 'missileAttack', 'Atak dystansowy', 0);
    if (rng > 0) return Math.max(1, Math.round(rng * 2));
    const imp = unitRowStat(s, 'chargeBonus', 'Uderzenie', unitRowStat(s, 'weaponDamage', 'Atak', 8));
    return Math.max(12, Math.round(imp * 2));
  }

  /** Zasięg machiny oblężniczej vs mur (hex) — z `Zasięg ataku (hex)` / TW. */
  private _siegeMachineRange(ru: RuntimeBattleUnit): number {
    const r = attackRange(ru.bu);
    if (r >= 1) return r;
    return this._isCatapult(ru.bu) ? 6 : 1;
  }

  /**
   * Katapulta ostrzeliwuje kafel muru (wallRow). Zadaje damage kaflu.
   * Kafel HP <= 0 -> wyburzenie: kafel staje się BTerrain.Plains (przejezdny).
   */
  private _attackWallTile(ru: RuntimeBattleUnit, wallRow: number, done: () => void): void {
    if (this.siegeWallCol < 0) { done(); return; }
    const rng = unitRowStat(ru.bu.stats as Record<string, unknown>, 'missileAttack', 'Atak dystansowy', 0);
    const wall = unitRowStat(ru.bu.stats as Record<string, unknown>, 'wallAttack', undefined, 0);
    const base = wall > 0 ? wall : (rng > 0 ? rng * 2 : unitRowStat(ru.bu.stats as Record<string, unknown>, 'weaponDamage', 'Atak', 8));
    const dmg = Math.max(1, Math.round(base));

    // FIX 3: Animacja pocisku-kamienia katapulty (parabola) + SFX przy uderzeniu
    const aw = cellToWorld(ru.q, ru.r);
    const ww = cellToWorld(this.siegeWallCol, wallRow);
    const fromPos = new THREE.Vector3(aw.x, tileTopY(this.terrainMap, ru.q, ru.r) + 0.8, aw.z);
    const toPos   = new THREE.Vector3(ww.x, 1.5, ww.z); // uderza w mur na wys. 1.5
    this._spawnCatapultBoulder(fromPos, toPos);

    // Aplikuj obrażenia po czasie lotu (700ms)
    this._schedule(700, () => {
      const curHp = this.wallTileHp.get(wallRow) ?? 0;
      const newHp = Math.max(0, curHp - dmg);
      this.wallTileHp.set(wallRow, newHp);
      this.lastAttackedWallRow = wallRow;
      this._updateSiegeHud();
      this._spawnWallLabel(this.siegeWallCol, wallRow, '-' + dmg + ' (mur)', '#ff8800');
      if (newHp <= 0) {
        this._breachWallTile(wallRow);
      }
    });
    ru.acted = true;
    done();
  }

  /** Animacja pocisku kamiennego katapulty: sfera szara lecąca parabolą. */
  private _spawnCatapultBoulder(from: THREE.Vector3, to: THREE.Vector3): void {
    try {
      const geo = new THREE.SphereGeometry(0.32, 7, 7);
      const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(from);
      mesh.castShadow = true;
      this.scene.add(mesh);

      const duration = 700; // ms wirtualnego czasu
      const arcHeight = 3.5; // wysoka parabola (lob nad murem)
      const t0 = this._now();

      const animBoulder = () => {
        if (this.finished) {
          this.scene.remove(mesh);
          geo.dispose(); mat.dispose();
          return;
        }
        const t = Math.min(1, (this._now() - t0) / duration);
        const x = from.x + (to.x - from.x) * t;
        const z = from.z + (to.z - from.z) * t;
        const y = from.y + (to.y - from.y) * t + arcHeight * Math.sin(t * Math.PI);
        mesh.position.set(x, y, z);
        if (t >= 1) {
          this.scene.remove(mesh);
          geo.dispose(); mat.dispose();
          this._sfxCatapultImpact(); // SFX przy uderzeniu w mur
          return;
        }
        requestAnimationFrame(animBoulder);
      };
      requestAnimationFrame(animBoulder);
    } catch { /* no-op */ }
  }

  /** SFX: uderzenie kamienia katapulty w mur (boom 80Hz + szum). */
  private _sfxCatapultImpact(): void {
    if (this._sfxOff()) return;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      // Niskie boom (80Hz) zanikające
      const osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.75, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(g).connect(this._masterGain!);
      osc.start(t); osc.stop(t + 0.42);
      // Szum kamienia + okruchów
      const src = ac.createBufferSource(); src.buffer = this._noiseBuf(ac);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      src.connect(lp).connect(ng).connect(this._masterGain!);
      src.start(t); src.stop(t + 0.30);
    } catch { /* no-op */ }
  }

  /**
   * Wyburz kafel muru (HP=0): zamień BTerrain.Wall -> BTerrain.Plains.
   * Piechota może teraz tamtędy przejść.
   */
  private _breachWallTile(wallRow: number): void {
    const tiles = this.terrainMap.tiles;
    if (!tiles) return;
    const wallCol = this.siegeWallCol;
    const idx = wallRow * BF_COLS + wallCol;
    if (idx >= 0 && idx < tiles.length) {
      tiles[idx] = BTerrain.Plains;
    }
    this.wallTileHp.delete(wallRow);
    this._spawnWallLabel(wallCol, wallRow, 'MUR WYBURZONY!', '#ff4400');

    // NAPRAWA problem 3: WYRWA — ukryj segment muru (visible=false), dodaj gruz.
    if (this.siegeWallGroup) {
      // Ukryj segment muru dla tego rzędu (per-tile segmenty z buildWallBodySegmented)
      const wallMeshes = this.siegeWallGroup.userData['rowWallMeshes'] as Map<number, THREE.Mesh[]> | undefined;
      if (wallMeshes) {
        const segs = wallMeshes.get(wallRow);
        if (segs) segs.forEach(m => { m.visible = false; });
      }
      // Gruz — nieregularna sterta boxów/odłamków skalnych w miejscu wyłomu
      // (world space). Deterministyczny jitter (tileJitter — sam mechanizm co
      // reszta dekoracji pola bitwy w _buildBattlefield), zasiany z (wallCol,
      // wallRow) tego konkretnego kafla, więc każdy wyłom wygląda nieco
      // inaczej, ale powtarzalnie. Czysto wizualne — kafel jest już Plains
      // (patrz wyżej), gruz NIE dostaje kolizji, jednostki przechodzą swobodnie.
      const { x: rubbleX, z: rubbleZ } = cellToWorld(wallCol, wallRow);
      const RUBBLE_DUST_COLOR = 0x6b5040; // przybrudzony kamień/glina muru
      const RUBBLE_ROCK_COLOR = 0x5a5850; // ciemniejszy odłamek skalny
      const RUBBLE_PIECES = 7;
      for (let i = 0; i < RUBBLE_PIECES; i++) {
        const s = 200 + i * 11; // salt bucket per piece (unikalne od reszty tileJitter w pliku)
        const ox = (tileJitter(wallCol, wallRow, s + 1) - 0.5) * TILE_S * 0.85;
        const oz = (tileJitter(wallCol, wallRow, s + 2) - 0.5) * TILE_S * 0.7;
        const sc = 0.55 + tileJitter(wallCol, wallRow, s + 3) * 0.55;
        const isRock = tileJitter(wallCol, wallRow, s + 4) < 0.4;
        const colorJit = (tileJitter(wallCol, wallRow, s + 5) - 0.5) * 0.16;
        const color = lighten(isRock ? RUBBLE_ROCK_COLOR : RUBBLE_DUST_COLOR, colorJit);
        const geo = isRock
          ? new THREE.IcosahedronGeometry(0.16 * sc, 0)
          : new THREE.BoxGeometry(0.34 * sc, 0.20 * sc, 0.30 * sc);
        const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
        const mesh = new THREE.Mesh(geo, mat);
        const oy = (isRock ? 0.06 : 0.10) * sc;
        mesh.position.set(rubbleX + ox, oy, rubbleZ + oz);
        mesh.rotation.set(
          tileJitter(wallCol, wallRow, s + 6) * Math.PI,
          tileJitter(wallCol, wallRow, s + 7) * Math.PI * 2,
          tileJitter(wallCol, wallRow, s + 8) * Math.PI
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.ownedGeos.push(geo);
        this.ownedMats.push(mat);
      }
    }

    // ZMIANA 5: obrońca na wyburzonym kaflu cofa się o 1 pole (nie ginie).
    // Katapulty obrońcy (nie mają jak zejść) → giną.
    for (const u of this.def) {
      if (u.dead || u.fadingOut || u.routed) continue;
      if (u.onWallWalkway && u.r === wallRow && u.q === wallCol) {
        if (this._isCatapult(u.bu)) {
          // Katapulta obrońcy na wyburzonym kaflu — niszczymy ją
          u.dead = true;
          u.fadingOut = true;
          u.fadeStart = performance.now();
          this.occByKey.delete(cellKey(u.q, u.r));
        } else {
          // Piechota/łucznik — cofa się o 1 pole w głąb obrony (wallCol+1)
          const retreatCol = Math.min(BF_COLS - 1, wallCol + 1);
          if (!this.occByKey.has(cellKey(retreatCol, wallRow)) && this.terrainMap.passable(retreatCol, wallRow)) {
            this.occByKey.delete(cellKey(u.q, u.r));
            u.q = retreatCol;
            u.r = wallRow;
            const { x, z } = cellToWorld(retreatCol, wallRow);
            const topY = tileTopY(this.terrainMap, retreatCol, wallRow);
            u.group.position.set(x, topY, z);
            u.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
            this.occByKey.set(cellKey(retreatCol, wallRow), u);
          } else {
            // Spróbuj retreatCol+1 lub po prostu pozostań (nie ginie)
            let placed = false;
            for (let dc = 1; dc <= 3 && !placed; dc++) {
              const cc = Math.min(BF_COLS - 1, wallCol + dc);
              for (let dr = 0; dr <= 2 && !placed; dr++) {
                for (const rr of [wallRow + dr, wallRow - dr]) {
                  const rc = Math.max(0, Math.min(BF_ROWS - 1, rr));
                  if (!this.occByKey.has(cellKey(cc, rc)) && this.terrainMap.passable(cc, rc)) {
                    this.occByKey.delete(cellKey(u.q, u.r));
                    u.q = cc; u.r = rc;
                    const { x, z } = cellToWorld(cc, rc);
                    const topY = tileTopY(this.terrainMap, cc, rc);
                    u.group.position.set(x, topY, z);
                    u.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
                    this.occByKey.set(cellKey(cc, rc), u);
                    placed = true;
                  }
                }
              }
            }
          }
          u.onWallWalkway = false; // zszedł z muru
        }
      }
    }

    // Morale: wyłom muru wstrząsa wszystkimi żywymi obrońcami
    for (const u of this.def) {
      if (u.dead || u.fadingOut || u.routed) continue;
      u.morale = Math.max(0, u.morale - MORALE_WALL_BREACH);
      this._updateMoraleBar(u);
      this._checkRout(u);
    }
  }

  /**
   * Open the gate: update terrain passability and hide the gate mesh.
   */
  private _breachGate(): void {
    this.gateOpen = true;
    this._updateSiegeHud();

    // Update terrain tiles: replace Gate with Plains so pathfinding opens up
    const tiles = this.terrainMap.tiles;
    if (tiles && this.siegeGateCol >= 0) {
      const wallCol = this.siegeGateCol;
      const midRow  = this.siegeGateRow;
      const gateRowLo = midRow - 1;
      const gateRowHi = midRow;
      for (let r = gateRowLo; r <= gateRowHi; r++) {
        const idx = r * BF_COLS + wallCol;
        if (idx >= 0 && idx < tiles.length && tiles[idx] === BTerrain.Gate) {
          tiles[idx] = BTerrain.Plains;
        }
      }
    }

    // Zmiana 3: Ukryj całą strukturę bramy — portkulisa + nadproże + most + filary.
    if (this.siegeWallGroup) {
      const gate: THREE.Group | null = this.siegeWallGroup.userData['gate'] as THREE.Group ?? null;
      if (gate) gate.visible = false;

      // Ukryj też nadproże / most / filary bramy:
      // Są to children wallGroup w lokalnym X bliskim 0 (centrum = gateCenterX),
      // które NIE należą do muru bocznego (ich X < gateW/2).
      // gateW = gateWidthTiles * tileSize = 2 * TILE_S = 2.0
      const gateCX  = (this.siegeWallGroup.userData['gateCenterX'] as number) ?? 0;
      const gateHalfW = TILE_S * 1.5; // gateWidthTiles=2, dodaj margines
      this.siegeWallGroup.children.forEach(child => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;                    // pomijaj Grupy (portkulisa)
        const lx = mesh.position.x;
        if (Math.abs(lx - gateCX) < gateHalfW + TILE_S * 0.6) {
          // Sprawdź: czy to element bramny (wyższy niż mur = nadbudówka, lub nadproże przy y≈H)
          const ly = mesh.position.y;
          const wallH = (this.siegeWallGroup!.userData['wallWalkY'] as number) ?? 2.5;
          // Nadproże (lintel): y ≈ wallH; Most (bridge): y ≈ wallH; Wieże bramne: y > wallH/2
          // Nie chcemy ukrywać ościeży/filarów bocznych muru — ale brama jest w centrum.
          if (ly >= wallH * 0.9 || (Math.abs(lx - gateCX) < gateHalfW * 0.9)) {
            mesh.visible = false;
          }
        }
      });
    }
    // Morale: wyłom bramy wstrząsa WSZYSTKIMI żywymi obrońcami (silniejszy efekt)
    for (const u of this.def) {
      if (u.dead || u.fadingOut || u.routed) continue;
      u.morale = Math.max(0, u.morale - MORALE_GATE_BREACH);
      this._updateMoraleBar(u);
      this._checkRout(u);
    }
  }

  /** Wyswietl etykiete tekstowa nad kaflem muru (worldSpace X/Z z col/row). */
  private _spawnWallLabel(wallCol: number, wallRow: number, text: string, color: string): void {
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
      position: 'absolute', pointerEvents: 'none', color,
      fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 'bold',
      textShadow: '0 0 6px #000, 1px 1px 2px #000',
      whiteSpace: 'nowrap', transform: 'translate(-50%, -50%)', zIndex: '10010',
    });
    this.overlay.appendChild(el);
    const { x, z } = cellToWorld(wallCol, wallRow);
    this.floatLabels.push({
      elem: el, startTime: this.vLastWall, duration: 2000,
      worldPos: new THREE.Vector3(x, 3.2, z),
      riseRate: 0.00012,
    });
  }

  /** Odswierz HUD oblężenia 1E (C-04 / C-05). */
  private _updateSiegeHud(): void {
    if (this.siegeWallCol < 0) return;
    if (this.deployPhase) return;
    const gMax = 400;
    const gCur = this.gateOpen ? 0 : Math.max(0, this.gateHp);
    let wallSum = 0;
    let wallMax = 0;
    for (const [, hp] of this.wallTileHp) {
      wallSum += Math.max(0, hp);
      wallMax += BattleScene.WALL_TILE_HP;
    }
    if (wallMax <= 0) wallMax = BattleScene.WALL_TILE_HP;
    const wallPct = Math.round(wallSum / wallMax * 100);
    const breachLabel = this.gateOpen
      ? 'Wy\u0142om w bramie g\u0142\u00F3wnej'
      : (this.lastAttackedWallRow >= 0 ? 'Uszkodzenie segmentu muru' : 'Mur miejski');
    let catapults = 0, rams = 0, infantry = 0;
    for (const u of this.atk) {
      if (u.dead || u.removed) continue;
      if (isSiegeUnit(u.bu)) {
        if (this._isCatapult(u.bu)) catapults++;
        else rams++;
      } else infantry++;
    }
    let garrison = 0;
    for (const u of this.def) {
      if (!u.dead && !u.removed) garrison++;
    }
    const cityName = String(this._battleData?.cityName ?? 'Kapua');
    updateSiegeHud1E({
      cityName,
      turn: Math.max(1, this.roundNo || 1),
      wallIntegrityPct: Math.min(100, Math.max(0, wallPct)),
      wallDeltaPerTurn: 0,
      breachLabel,
      catapults,
      rams,
      infantry,
      garrison,
      gateOpen: this.gateOpen,
    });
    this._syncSiegeHudChromeVisibility();
    requestAnimationFrame(() => this._syncSiegeHudLayout());
  }

  /**
   * Widoczność HUD oblężenia vs deploy / ręczna / auto.
   * Dolny pasek C-05 (Ostrzał/Szturm) = mockup auto — zawsze ukryty do implementacji.
   */
  private _syncSiegeHudChromeVisibility(): void {
    if (this.siegeWallCol < 0) return;
    const hideSides = this.deployPhase || !this.started || this.finished || this._battleChromeSuppressed;
    setSiegeHudVisible(!hideSides);
  }

  /**
   * Advance one step toward a specific target (col, row).
   * Used by siege machines to approach the gate.
   */
  private _advanceToward(ru: RuntimeBattleUnit, targetCol: number, targetRow: number, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    // Pick the neighbour tile (4-connected) that is passable and closest to target
    const dirs: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let bestKey: string | null = null;
    let bestDist = Infinity;
    for (const [dc, dr] of dirs) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nr < 0 || nc >= BF_COLS || nr >= BF_ROWS) continue;
      if (this._moveCostForUnit(ru, nc, nr) === Infinity) continue;
      if (this.occByKey.has(cellKey(nc, nr))) continue;
      const d = Math.abs(nc - targetCol) + Math.abs(nr - targetRow);
      if (d < bestDist) { bestDist = d; bestKey = cellKey(nc, nr); }
    }

    if (!bestKey) { done(); return; }
    const parts = bestKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);
    this._doMove(ru, nc, nr, done);
  }

  private _advanceStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    if (ru.moveLeft <= 0) { done(); return; }

    // C-FLANK (Maciej 2026-07-25): kierunek natarcia 'bok'/'tyl' -- probuj
    // manewrowac na hex, z ktorego cios trafi we flanke/tyl priorytetowego
    // celu (relativeHit), zamiast marszu prosto na front. 'front' (domyslne)
    // pomija ten blok calkowicie -- zero regresji istniejacego zachowania.
    const desiredDir = desiredHitForDirection(ru.attackDirection);
    if (desiredDir) {
      const dirTarget = this._pickTargetByPriority(ru) ?? this._nearestEnemy(ru);
      if (dirTarget) {
        const already = this._canStrikeTargetFrom(ru, ru.q, ru.r, dirTarget)
          && relativeHit(dirTarget.facing, ru.q, ru.r, dirTarget.q, dirTarget.r) === desiredDir;
        if (already) { done(); return; }

        const dirStepKey = this._firstStepTowardDirectedAttack(ru, dirTarget, desiredDir);
        if (dirStepKey) {
          const comma = dirStepKey.indexOf(',');
          const dnc = parseInt(dirStepKey.slice(0, comma), 10);
          const dnr = parseInt(dirStepKey.slice(comma + 1), 10);
          this._doMove(ru, dnc, dnr, () => {
            if (this.finished) { done(); return; }
            if (this._canAttackFrom(ru, ru.q, ru.r)) { done(); return; }
            if (ru.moveLeft > 0) {
              this._schedule(STEP_GAP_MS, () => this._advanceStep(ru, done));
            } else {
              done();
            }
          });
          return;
        }
        // Brak osiagalnego manewru na flanke/tyl w tym kroku -- graceful
        // fallback: ponizej zwykly (czolowy) marsz, jak dotychczas.
      }
    }

    // Already standing where it could attack -> stop moving (it will strike
    // next turn).
    if (this._canAttackFrom(ru, ru.q, ru.r)) { done(); return; }

    const target = this._nearestEnemy(ru);
    if (!target) { done(); return; }

    // BFS the battlefield grid for the shortest path to a tile from which this
    // unit could attack (adjacent for melee, within range for ranged), then
    // take only its FIRST step. This routes around occupied allied tiles
    // instead of stalling like a greedy step would. If BFS finds nothing
    // reachable (fully walled in), fall back to a greedy nudge closer.
    const stepKey = this._firstStepAlongPathToAttack(ru) ?? this._stepToward(ru, target);
    if (!stepKey) {
      // Blocked / cannot get closer this turn.
      done();
      return;
    }
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      // Reached an attack position? Stop -- the blow happens on a later turn.
      if (this._canAttackFrom(ru, ru.q, ru.r)) { done(); return; }
      // Otherwise keep advancing while movement remains this turn.
      if (ru.moveLeft > 0) {
        this._schedule(STEP_GAP_MS, () => this._advanceStep(ru, done));
      } else {
        done();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Private: targeting
  // -------------------------------------------------------------------------

  private _enemiesOf(ru: RuntimeBattleUnit): RuntimeBattleUnit[] {
    // Routed units are OUT of the fight -- they are no longer valid targets.
    return (ru.side === 'atk' ? this.def : this.atk).filter(u => !u.dead && !u.fadingOut && !u.routed);
  }

  private _nearestEnemy(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      const dd = manhattan(ru.q, ru.r, e.q, e.r);
      if (dd < bestD) { bestD = dd; best = e; }
    }
    return best;
  }

  /**
   * SKIRMISH REFINE: the nearest enemy OFFENSIVE (melee) unit -- one that is NOT
   * itself primary-ranged and therefore closes in to fight (Legionista, Falanga,
   * Wlocznik, Wojownik, maczuga, topor, Konnica, Rydwan, super, ...). These are
   * the threats a shooter must keep MELEE_SAFE_GAP away from. Enemy archers /
   * slingers / javelineers are excluded -- a shooter is happy to stand near them
   * and shoot. Returns null if no melee enemy remains (then only ranged foes are
   * left and the shooter has nothing to flee from). Measured from (col,row).
   */
  private _nearestEnemyMelee(ru: RuntimeBattleUnit, col = ru.q, row = ru.r): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      if (e.primaryRanged) continue; // only OFFENSIVE (melee) units threaten the gap
      const dd = manhattan(col, row, e.q, e.r);
      if (dd < bestD) { bestD = dd; best = e; }
    }
    return best;
  }

  /**
   * Re-orient a unit's FACING toward its current nearest enemy and rotate the
   * model to match. Called at the start of each turn and after every step so a
   * unit always presents its FRONT toward the line it is engaging; an enemy
   * that strikes from outside that front arc lands a FLANK or REAR blow (the
   * SS5l flank/rear defence penalty -- see _singleBlow). No-op (facing kept) if
   * the unit has no living enemy or the enemy sits on its own tile.
   */
  private _updateFacing(ru: RuntimeBattleUnit): void {
    const enemy = this._nearestEnemy(ru);
    if (!enemy) return;
    const newFacing = facingFromTo(ru.q, ru.r, enemy.q, enemy.r, ru.facing);
    if (newFacing === ru.facing) return;
    ru.facing = newFacing;
    ru.group.rotation.y = dirYaw(newFacing);
  }

  /**
   * Return an enemy this unit may legally attack from its CURRENT tile, or null.
   *   - melee (range 0): only an ADJACENT enemy (Manhattan distance == 1).
   *   - ranged (range >= 2): any enemy within `range` tiles; prefers lowest HP.
   *
   * C-FLANK (Maciej 2026-07-25): when this unit's kierunek natarcia is 'bok'/
   * 'tyl', among the in-reach candidates it prefers one that the blow would
   * actually land on as flank/rear (relativeHit) against THAT enemy's facing --
   * ties (or 'front' / no match at all) fall back to the original lowest-HP
   * pick, so behaviour is bit-for-bit unchanged when attackDirection is
   * 'front' (default).
   */
  private _targetInRange(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    const enemies = this._enemiesOf(ru);
    const inReach: RuntimeBattleUnit[] = [];
    if (canShoot(ru)) {
      for (const e of enemies) {
        const dd = manhattan(ru.q, ru.r, e.q, e.r);
        if (dd >= 1 && dd <= ru.range) inReach.push(e);
      }
    } else {
      // SIEGE v2 -- MELEE: adjacency includes vertical wall combat.
      // An attacker at (wallCol-1, r) can strike a defender at (wallCol, r) and vice versa.
      // Both units at Manhattan==1 in grid coords: standard adjacency already covers this.
      // Extra case: if ONE unit is onWallWalkway at wallCol and the other is at wallCol-1,
      // they are "adjacent in the vertical sense" even though the tile is BTerrain.Wall.
      // dd === 0: same tile (walkway combat between two units who both climbed) -- treat as melee.
      for (const e of enemies) {
        const dd = manhattan(ru.q, ru.r, e.q, e.r);
        if (dd === 1 || dd === 0) inReach.push(e);
      }
    }
    if (inReach.length === 0) return null;

    const lowestHp = (list: RuntimeBattleUnit[]): RuntimeBattleUnit => {
      let best = list[0]!;
      for (const e of list) if (e.bu.hp < best.bu.hp) best = e;
      return best;
    };

    const desired = desiredHitForDirection(ru.attackDirection);
    if (desired) {
      const matching = inReach.filter(
        e => relativeHit(e.facing, ru.q, ru.r, e.q, e.r) === desired,
      );
      if (matching.length > 0) return lowestHp(matching);
    }
    return lowestHp(inReach);
  }

  /** Nearest free neighbour tile that reduces distance to `target` (greedy fallback step). */
  private _stepToward(ru: RuntimeBattleUnit, target: RuntimeBattleUnit): string | null {
    let best: string | null = null;
    let bestD = manhattan(ru.q, ru.r, target.q, target.r);
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue; // occupied -- cannot enter
      if (!this._passableForUnit(ru, nc, nr)) continue; // deep river -- cannot enter
      const dd = manhattan(nc, nr, target.q, target.r);
      if (dd < bestD) { bestD = dd; best = nk; }
    }
    return best;
  }

  /**
   * True if, standing on (col, row), this unit could legally attack a living
   * enemy.
   *   - melee (range 0): an enemy is ADJACENT (Manhattan distance == 1).
   *   - ranged (range >= 2): an enemy is within `ru.range` (and at least 1 away).
   * (col, row) is assumed to be a tile the unit could actually stand on.
   */
  private _canAttackFrom(ru: RuntimeBattleUnit, col: number, row: number): boolean {
    const reach = canShoot(ru) ? ru.range : 1;
    for (const e of this._enemiesOf(ru)) {
      const dd = manhattan(col, row, e.q, e.r);
      if (dd >= 1 && dd <= reach) return true;
    }
    return false;
  }

  /**
   * True if, standing on (col, row), `ru` could legally strike this SPECIFIC
   * `target` (melee adjacency or within ranged reach) -- unlike _canAttackFrom
   * (any enemy), used by the C-FLANK directed-attack maneuver which must
   * evaluate the incoming angle against one particular defender's facing.
   */
  private _canStrikeTargetFrom(
    ru: RuntimeBattleUnit, col: number, row: number, target: RuntimeBattleUnit,
  ): boolean {
    const reach = canShoot(ru) ? ru.range : 1;
    const dd = manhattan(col, row, target.q, target.r);
    return dd >= 1 && dd <= reach;
  }

  /**
   * C-FLANK (Maciej 2026-07-25): BFS the battlefield grid for the shortest
   * walkable path from this unit's tile to a tile from which it could strike
   * `target` AND the blow would land as `desired` ('flank' or 'rear') against
   * the target's CURRENT facing -- i.e. the unit manewruje na bok/tyl instead
   * of marching straight at the front. Returns the FIRST step ("col,row") along
   * that path, or null if the unit is ALREADY in such a position, or if no such
   * tile is reachable this turn (caller falls back to the normal frontal
   * approach -- graceful degradation, never a hang).
   *
   * Mirrors _firstStepAlongPathToAttack exactly (same BFS shape, same
   * occupied/impassable rules) with a target- and facing-aware goal test.
   */
  private _firstStepTowardDirectedAttack(
    ru: RuntimeBattleUnit, target: RuntimeBattleUnit, desired: FacingHit,
  ): string | null {
    const startKey = cellKey(ru.q, ru.r);

    const isGoal = (c: number, r: number): boolean =>
      this._canStrikeTargetFrom(ru, c, r, target)
      && relativeHit(target.facing, c, r, target.q, target.r) === desired;

    if (isGoal(ru.q, ru.r)) return null; // juz w pozycji do ciosu z zadanego kierunku

    const parent = new Map<string, string | null>();
    parent.set(startKey, null);
    const frontier: Array<{ c: number; r: number }> = [{ c: ru.q, r: ru.r }];
    let goalKey: string | null = null;

    while (frontier.length > 0) {
      const cur = frontier.shift()!;
      for (const [dc, dr] of DIRS4) {
        const nc = cur.c + dc;
        const nr = cur.r + dr;
        if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
        const nk = cellKey(nc, nr);
        if (parent.has(nk)) continue;          // already seen
        if (this.occByKey.has(nk)) continue;   // occupied -> wall (cannot stand here)
        if (!this._passableForUnit(ru, nc, nr)) continue; // river / wall body -> cannot stand
        parent.set(nk, cellKey(cur.c, cur.r));
        if (isGoal(nc, nr)) { goalKey = nk; frontier.length = 0; break; }
        frontier.push({ c: nc, r: nr });
      }
    }

    if (!goalKey) return null; // brak osiagalnego manewru -- graceful fallback (front)

    let node: string | null = goalKey;
    let prev: string | null = parent.get(node) ?? null;
    while (prev !== null && prev !== startKey) {
      node = prev;
      prev = parent.get(node) ?? null;
    }
    return prev === startKey ? node : null;
  }

  /**
   * BFS the battlefield grid for the shortest walkable path from this unit's
   * tile to the NEAREST tile from which it could attack an enemy, and return the
   * FIRST step (a "col,row" key) along that path -- or null if no such tile is
   * reachable.
   *
   * Occupied tiles (allies AND enemies) are impassable walls, so a melee unit
   * cannot walk THROUGH the enemy line; it stops on the free tile next to it.
   * Enemy tiles still define the goal, because a free tile adjacent to (or
   * within range of) an enemy is a valid attack position. Distances here are
   * real grid path lengths, so the unit reliably routes around its own front
   * line instead of deadlocking behind it the way a greedy step would.
   */
  private _firstStepAlongPathToAttack(ru: RuntimeBattleUnit): string | null {
    const startKey = cellKey(ru.q, ru.r);

    // Already standing on an attack position -> handled by the caller, but be safe.
    if (this._canAttackFrom(ru, ru.q, ru.r)) return null;

    // BFS with parent links so we can reconstruct the first step.
    const parent = new Map<string, string | null>();
    parent.set(startKey, null);
    const frontier: Array<{ c: number; r: number }> = [{ c: ru.q, r: ru.r }];

    let goalKey: string | null = null;

    while (frontier.length > 0) {
      const cur = frontier.shift()!;
      for (const [dc, dr] of DIRS4) {
        const nc = cur.c + dc;
        const nr = cur.r + dr;
        if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
        const nk = cellKey(nc, nr);
        if (parent.has(nk)) continue;          // already seen
        if (this.occByKey.has(nk)) continue;   // occupied -> wall (cannot stand here)
        // SIEGE v2: wall tiles (BTerrain.Wall) are normally impassable but an
        // attacker approaching the base of the siege wall should be able to
        // stand on the tile ADJACENT to the wall (wallCol-1) and attack
        // defenders onWallWalkway. The BFS node at wallCol is NOT walkable (unit
        // cannot physically stand in the wall body), so we stop exploration at
        // the wall column -- but we DO recognise that from (wallCol-1, r) the
        // attacker is within melee reach of a wall-walkway defender at (wallCol,r).
        // The _canAttackFrom check already handles this (Manhattan==1 to defender).
        // We only skip wall tiles from being ENTERED (continued expansion), not
        // from being TARGETED.
        if (!this._passableForUnit(ru, nc, nr)) continue; // river / wall body -> cannot stand
        parent.set(nk, cellKey(cur.c, cur.r));
        if (this._canAttackFrom(ru, nc, nr)) { goalKey = nk; frontier.length = 0; break; }
        frontier.push({ c: nc, r: nr });
      }
    }

    if (!goalKey) return null;

    // Walk parent links back from the goal to the tile whose parent is the start.
    let node: string | null = goalKey;
    let prev: string | null = parent.get(node) ?? null;
    while (prev !== null && prev !== startKey) {
      node = prev;
      prev = parent.get(node) ?? null;
    }
    return prev === startKey ? node : null;
  }

  /**
   * BFS the battlefield grid for the shortest walkable path to a free tile that
   * is ADJACENT to ANY living enemy (Manhattan == 1), and return the FIRST step
   * along that path -- or null if no such tile is reachable. This is the MELEE
   * convergent goal (reach = 1 regardless of the unit's own range), so a SHOOTER
   * that reuses it marches STRAIGHT at the enemy line instead of drifting toward
   * a far in-range ring tile. Occupied tiles (allies AND enemies) are walls, so
   * the path stops on the free tile next to the line rather than walking through
   * it. (The caller halts the shooter the instant it is within firing range.)
   */
  private _firstStepTowardMelee(ru: RuntimeBattleUnit): string | null {
    const startKey = cellKey(ru.q, ru.r);
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;

    const adjEnemy = (c: number, r: number): boolean => {
      for (const e of enemies) {
        if (manhattan(c, r, e.q, e.r) === 1) return true;
      }
      return false;
    };

    // Already standing next to the line -> no step needed.
    if (adjEnemy(ru.q, ru.r)) return null;

    const parent = new Map<string, string | null>();
    parent.set(startKey, null);
    const frontier: Array<{ c: number; r: number }> = [{ c: ru.q, r: ru.r }];
    let goalKey: string | null = null;

    while (frontier.length > 0) {
      const cur = frontier.shift()!;
      for (const [dc, dr] of DIRS4) {
        const nc = cur.c + dc;
        const nr = cur.r + dr;
        if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
        const nk = cellKey(nc, nr);
        if (parent.has(nk)) continue;          // already seen
        if (this.occByKey.has(nk)) continue;   // occupied -> wall (cannot stand here)
        if (!this._passableForUnit(ru, nc, nr)) continue; // deep river -> wall
        parent.set(nk, cellKey(cur.c, cur.r));
        if (adjEnemy(nc, nr)) { goalKey = nk; frontier.length = 0; break; }
        frontier.push({ c: nc, r: nr });
      }
    }

    if (!goalKey) return null;

    let node: string | null = goalKey;
    let prev: string | null = parent.get(node) ?? null;
    while (prev !== null && prev !== startKey) {
      node = prev;
      prev = parent.get(node) ?? null;
    }
    return prev === startKey ? node : null;
  }

  // -------------------------------------------------------------------------
  // Private: animated single-tile move
  // -------------------------------------------------------------------------

  private _doMove(ru: RuntimeBattleUnit, col: number, row: number, done: () => void): void {
    this.busy = true;
    const oldKey = cellKey(ru.q, ru.r);
    const newKey = cellKey(col, row);
    this.occByKey.delete(oldKey);
    this.occByKey.set(newKey, ru);

    const from = cellToWorld(ru.q, ru.r);
    const to   = cellToWorld(col, row);
    // Capture the VISIBLE tile-top Y at BOTH ends (before ru.q/ru.r move) so the
    // walk interpolates height too: a unit climbing onto a hill smoothly rises
    // to the summit and descends coming off it (mirrors the world-map y-lerp).
    const fromTopY = tileTopY(this.terrainMap, ru.q, ru.r);
    const toTopY   = tileTopY(this.terrainMap, col, row);
    const oldCol = ru.q;
    const oldRow = ru.r; // captured BEFORE reassignment, for the ford speed check below

    ru.q = col; ru.r = row;
    // Per-tile movement cost (B8): forest/hills cost 2, a river ford costs 3,
    // plains 1 (terrain-movement.json intent). Entering rough ground therefore
    // eats more of this turn's movement budget, so units cross terrain slower.
    // A river ford is finite-but-expensive; deep river is never entered (walled
    // out of pathing). Always spend at least 1 so a unit can take its step.
    const enterCost = Math.max(1, Math.min(this._moveCostForUnit(ru, col, row), 99));
    // C-BTL-BROD-Q1 (wariant C): a unit standing on OR entering a Ford tile
    // wades at half speed -- ADDITIONAL on top of the move-cost table above
    // (not a replacement for it), via brod.ruchMult (data/combat-params.json).
    // Fires when either end of this single step is a Ford tile; a field with
    // zero Ford tiles (no river preset) never triggers it => legacy battles
    // spend exactly enterCost as before, bit-for-bit.
    const wadingFord = isFordTile(this.terrainMap, oldCol, oldRow) || isFordTile(this.terrainMap, col, row);
    const stepCost = wadingFord ? enterCost / BROD_RUCH_MULT : enterCost;
    ru.moveLeft = Math.max(0, ru.moveLeft - stepCost);

    // Re-orient toward the nearest enemy from the NEW tile so the FRONT keeps
    // tracking the enemy line as the unit advances. Drives the SS5l facing
    // model used in _singleBlow.
    this._updateFacing(ru);

    const t0 = this._now();
    const step = () => {
      if (this.finished || this._autoBattleSuspended) { this.busy = false; return; }
      const p = Math.min(1, (this._now() - t0) / MOVE_STEP_MS);
      const e = easeOut(p);
      const x = lerp(from.x, to.x, e);
      const z = lerp(from.z, to.z, e);
      // Interpolate the standing height the same way as x/z, then add the hop,
      // so the figure rides the slope between the two tile tops.
      const baseY = lerp(fromTopY, toTopY, e);
      const hop = Math.sin(p * Math.PI) * 0.12;
      ru.group.position.set(x, baseY + hop, z);
      ru.hpBarGroup.position.set(x, baseY + HPBAR_Y, z);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        ru.group.position.set(to.x, toTopY, to.z);
        ru.hpBarGroup.position.set(to.x, toTopY + HPBAR_Y, to.z);
        this.busy = false;
        done();
      }
    };
    requestAnimationFrame(step);
  }

  // -------------------------------------------------------------------------
  // Private: attack dispatch -- ONE BLOW per action (turn-by-turn)
  //
  // An attack is a SINGLE blow: one hit roll, one damage application. The
  // target does NOT counter within this action -- it strikes back on ITS OWN
  // turn. Combat therefore resolves gradually, one blow per attacker per turn,
  // while every other unit on the field also acts each turn.
  // -------------------------------------------------------------------------

  private _doAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {
    if (canShoot(attacker)) this._doRangedAttack(attacker, defender, done);
    else                    this._doMeleeAttack(attacker, defender, done);
  }

  /**
   * Compute ONE blow from attacker against defender using the canonical SS5l
   * formulas (hitChance / baseDamage / rangeDamage / counter), apply the
   * resulting damage to the defender's HP, and start its death/rout if needed.
   *
   * The Uderzenie charge bonus is added ONLY on the very first blow of this
   * particular engagement (attacker -> defender), and only for melee, and only
   * if the defender is not a bracing spear/phalanx. Returns the dealt damage
   * (0 on a miss) so the animation can show a floating '-N'.
   */
  private _singleBlow(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, ranged: boolean): number {
    // AUDIO: a melee blow connecting = a metallic clash (ranged shots have their
    // own "whoosh" at firing in _doRangedAttack, so don't double up here).
    if (!ranged) this._sfxMelee();
    const cuA = toCombatUnit(attacker.bu, this.armyHungerStatMult, false, this.goldDeficitStatMult);
    const cuD = toCombatUnit(defender.bu, this.armyHungerStatMult, false, this.goldDeficitStatMult);

    // PER-TILE terrain (B8). The defender's OWN tile decides its terrain defence
    // bonus (hills / forest give the SS5j +50% via terrainDefenseMultiplier);
    // the ATTACKER's tile decides the river-crossing penalty (a unit striking
    // from a river ford gets -25% Atak via terrainRiverAttackMultiplier). Both
    // helpers come straight from combat.ts and match the data/terrain-combat.json
    // "Teren" rows by name, so the per-blow math stays canonical -- only WHICH
    // tile's terrain feeds each modifier changed (was a single battlefield-wide
    // terrain before). Facing/flank (B7) is applied first, exactly as before.
    // SIEGE v2: a defender standing on the wall walkway gets the wall/Cytadela/
    // Baszta defence bonus (Maciej 2026-07-25, rozszerzone 41B: +200% mur-only,
    // +300% mur+Cytadela, +400% mur+Cytadela+Baszta -- this.wallDefenseMult,
    // computed once in the constructor from opts.siege.builtBuildingIds via
    // cityWallDefenseBonusPercent + miasto-params.json bonus_obrona_mur_proc/
    // bonus_obrona_cytadela_proc/bonus_obrona_baszta_proc).
    // NIE uzywamy 'Wzgorza' (+50%) — stosujemy jawny mnoznik muru dla onWallWalkway.
    const defTerrain = defender.onWallWalkway
      ? 'Plaskie (rownina/laka)'   // teren bazowy (x1.0) — mnoznik muru dodany ponizej
      : this.terrainMap.combatTerrainName(defender.q, defender.r);
    const atkTerrain = this.terrainMap.combatTerrainName(attacker.q, attacker.r);
    // C-COMBAT-Q2 (Maciej 2026-07-26): bonus terenu w obronie MIASTA liczy sie
    // WYLACZNIE z wzniesienia i WYLACZNIE gdy miasto ma mur -- gated przez
    // cityGatedTerrainMultiplier (game/city-defense.ts), TYLKO gdy to w ogole
    // obrona miasta (this.isCityDefenseBattle -- walled siege LUB potyczka o
    // miasto bez muru, patrz BattleOpts.cityDefense). Bitwa w polu (poza
    // miastem) zostaje BEZ ZMIAN: pelny, niegated terrainDefenseMultiplier.
    // Kombinacja z bonusem muru jest ADDYTYWNA w punktach procentowych (Razem =
    // struct% + teren%, patrz main.ts effectiveDefenderM dla pelnego
    // uzasadnienia) -- dla defender.onWallWalkway ELEWACJA pochodzi z terenu
    // BAZOWEGO miasta (this.terrain, np. 'wzgorza'), bo sama korona muru jest
    // celowo plaska; dla obroncy NIE na murze (dziedziniec podczas oblezenia,
    // lub kazdy obronca miasta bez muru) elewacja pochodzi z JEGO WLASNEGO
    // kafla bitewnego (defTerrain), dokladnie tak precyzyjnie jak dzis.
    const hasMur = this.wallDefenseTotalProc > 0;
    const cityElevationTerrain = defender.onWallWalkway ? this.terrain : defTerrain;
    const cityTerrMult = this.isCityDefenseBattle
      ? cityGatedTerrainMultiplier(hasMur, cityElevationTerrain, this.terrainData)
      : 1;
    const terrDefMult = this.isCityDefenseBattle
      ? 1 + ((defender.onWallWalkway ? this.wallDefenseTotalProc : 0) + (cityTerrMult - 1) * 100) / 100
      : terrainDefenseMultiplier(defTerrain, cuA.rola, this.terrainData);
    // River-crossing Atak penalty (SS5j, pre-existing): the ATTACKER's own
    // tile decides this -- -25% Atak when it is wading a Ford (river_attack_mult
    // in combat-params.json, numerically the same as brod.karaAtak below).
    const terrRiverMlt = terrainRiverAttackMultiplier(atkTerrain, this.terrainData);

    // C-BTL-BROD-Q1 (wariant C): the Obrona-side half of the ford mechanic, plus
    // the "obrona brzegu" shore bonus. Both are NEW and additive on top of the
    // pre-existing river Atak penalty above (which already covers karaAtak) --
    // extends the SAME per-tile terrain-modifier mechanism rather than a
    // parallel one. Zero Ford tiles on the field (no river preset) => both
    // booleans false => defFordMlt/shoreBonusMlt stay 1.0 => bit-for-bit legacy.
    const atkOnFord = isFordTile(this.terrainMap, attacker.q, attacker.r);
    const defOnFord = !defender.onWallWalkway && isFordTile(this.terrainMap, defender.q, defender.r);
    const defFordMlt = defOnFord ? (1 - BROD_KARA_OBRONA) : 1; // -25% Obrona fighting IN the ford
    const shoreBonusApplies = !defOnFord && !defender.onWallWalkway && atkOnFord
      && isShoreAdjacentToFord(this.terrainMap, defender.q, defender.r);
    const shoreBonusMlt = shoreBonusApplies ? (1 + BROD_BONUS_BRZEG) : 1; // +15% Obrona defending the shore

    // FACING (SS5l): where does this blow land relative to the DEFENDER's
    // facing? Front = no penalty; flank/rear reduce the defender's effective
    // Obrona by the defender's own "Kara obrony z flanki/tylu (%)" before the
    // terrain multiplier (identical order to resolveCombat: Obrona*(1-pen)*terr).
    const hitArc: FacingHit = relativeHit(
      defender.facing, attacker.q, attacker.r, defender.q, defender.r,
    );
    const defPenaltyFrac = flankRearDefensePenalty(cuD, hitArc);

    const atkBonusy = attacker.side === 'atk' ? this.attackerCivBonusy : this.defenderCivBonusy;
    const defBonusy = defender.side === 'def' ? this.defenderCivBonusy : this.attackerCivBonusy;

    let isCharge = false;
    if (!ranged) {
      const key = attacker.bu.id + '>' + defender.bu.id;
      const firstBlow = !this.engaged.has(key);
      isCharge = firstBlow && !bracesAgainstCharge(defender.bu);
      this.engaged.add(key);
    }

    // Sciezki ulepszen jednostek (2026-07-25): bonus PER-JEDNOSTKA (nie per-strona
    // jak bonusy cyw) -- czytany wprost z BattleUnit.pancerzBonusFrac/parametryBonusFrac
    // (main.ts runtimeToBattleUnit ustawia je z RuntimeUnit przy wejsciu do bitwy).
    const atkMods = mergeBuildingBonusIntoStatMultipliers(
      civCombatStatMultipliers(atkBonusy, cuA, {
        side: 'attacker',
        terrain: defTerrain,
        isChargeRound: isCharge,
      }),
      { pancerz: attacker.bu.pancerzBonusFrac ?? 0, other: attacker.bu.parametryBonusFrac ?? 0 },
    );
    const defMods = mergeBuildingBonusIntoStatMultipliers(
      civCombatStatMultipliers(defBonusy, cuD, {
        side: 'defender',
        terrain: defTerrain,
        isChargeRound: isCharge,
      }),
      { pancerz: defender.bu.pancerzBonusFrac ?? 0, other: defender.bu.parametryBonusFrac ?? 0 },
    );

    // C-FORT-POLE-Q1: fortyfikacja W POLU = +50% Obrony PRZED terenem/brodem
    // (fieldFortifyDefenseBonus -- działa WYLACZNIE na Obronie, nigdy Atak).
    const defMeleeDef = fieldFortifyDefenseBonus(
      applyMultiplier(cuD.meleeDefence, defMods.obrona),
      defender.bu.fortifiedInField === true,
      FORTIFY_OBRONA_PROC_FIELD,
    );
    const atkOwnerDiffMult = attacker.side === 'atk'
      ? this.attackerDifficultyCombatMult
      : this.defenderDifficultyCombatMult;
    const defOwnerDiffMult = defender.side === 'def'
      ? this.defenderDifficultyCombatMult
      : this.attackerDifficultyCombatMult;

    const defEffObrona   = Math.max(0, defMeleeDef * (1 - defPenaltyFrac) * defOwnerDiffMult);
    const defFinalObrona = defEffObrona * terrDefMult * defFordMlt * shoreBonusMlt;
    const atkMelee       = applyMultiplier(cuA.meleeAttack, atkMods.atk) * terrRiverMlt * atkOwnerDiffMult;
    const atkMissile     = applyMultiplier(cuA.missileAttack ?? 0, atkMods.rangedAtk) * atkOwnerDiffMult;
    const defArmor       = applyMultiplier(cuD.armor, defMods.pancerz);
    const roundAtkCharge = applyMultiplier(cuA.chargeBonus, atkMods.uderzenie);
    const ctrAtkVsDef    = counterMultiplier(cuA.counterTyp, cuD.counterTyp, this.counters);

    const chargeHitBonus = (!ranged && isCharge) ? roundAtkCharge : 0;
    const hitPct = hitChanceTw(atkMelee, defFinalObrona, chargeHitBonus);
    const roll   = Math.random() * 100;
    if (roll >= hitPct) {
      this.log.push(attacker.bu.nazwa + ' chybia w ' + defender.bu.nazwa + ' (' + roll.toFixed(0) + '>=' + hitPct + '%).');
      return 0;
    }

    let rawDmg: number;
    let meleeCharge = false; // FACTOR 2 flag: this blow is a mounted charge's first blow
    if (ranged) {
      rawDmg = rangeDamage(atkMissile, defArmor);
    } else {
      meleeCharge = isCharge; // FACTOR 2: mounted charge morale hit (set below)
      rawDmg = baseDamage(
        cuA.weaponDamage,
        defArmor,
        cuA.piercing,
        roundAtkCharge,
        isCharge,
      );
    }
    // R-KONTRY-BITWA-MIGRACJA-Q1 (2026-08-06): the old independent "Bonus vs
    // <defender.Typ> %" path (attackerBonusVsType, reading units.json's own
    // columns) is gone -- every pair it covered was migrated into
    // counters.json with its real percentage (see combat.ts:counterMultiplier
    // doc comment), so ctrAtkVsDef alone now carries the full counter bonus.
    const dmg = Math.max(1, Math.round(rawDmg * ctrAtkVsDef));

    defender.bu.hp = Math.max(0, defender.bu.hp - dmg);
    this._updateHpBar(defender);
    const arcTag =
      hitArc === 'flank' ? ' [FLANKA -' + Math.round(defPenaltyFrac * 100) + '% obrony]'
      : hitArc === 'rear' ? ' [TYL -' + Math.round(defPenaltyFrac * 100) + '% obrony]'
      : '';
    this.log.push(
      attacker.bu.nazwa + ' trafia ' + defender.bu.nazwa + arcTag + ' za ' + dmg +
      ' (HP ' + defender.bu.hp + '/' + defender.bu.maxHp + ').',
    );

    // BATTLE MORALE -- extra FLAT morale loss this blow deals on top of the
    // HP-based loss (FACTOR 1 flank/rear + FACTOR 2 mounted charge). Folded into
    // the rout-before-death projection so a blow that breaks morale still routs.
    let extraMorale = 0;
    if (hitArc === 'flank') extraMorale += MORALE_FLANK_HIT;
    else if (hitArc === 'rear') extraMorale += MORALE_REAR_HIT;
    if (!ranged && attacker.mounted && meleeCharge) extraMorale += MORALE_CHARGE_HIT;

    // Death check for the target (one blow affects one unit). HP <= 0 kills it
    // outright (and shakes nearby allies). The old HP-fraction "Prog dezercji"
    // elimination is now handled by the MORALE pool below; a never-rout unit
    // (null threshold / "walczy do smierci") still only dies at HP <= 0.
    // ROUT-BEFORE-DEATH (Naster): cios, ktory zlamalby morale obroncy, sprawia ze
    // PEKA I UCIEKA zamiast ginac -- zmeczone jednostki rotuja, nie bija sie do
    // ostatniego. Tylko cios NIE lamiacy morale moze zabic od razu (nagla smierc
    // jeszcze niezlamanej jednostki). neverRout (berserk/"walczy do smierci") nie pekaja.
    if (!defender.dead && !defender.fadingOut && !defender.routed && !defender.neverRout) {
      const projMorale = defender.morale - MORALE_HIT_LOSS_SCALE * (dmg / Math.max(1, defender.bu.maxHp)) - extraMorale;
      if (projMorale <= defender.fleeMorale) {
        if (defender.bu.hp <= 0) { defender.bu.hp = 1; this._updateHpBar(defender); } // przezywa by uciec
        this._applyMoraleDamage(defender, dmg, extraMorale); // obniza morale (+flanka/tyl/szarza) -> _checkRout -> _startRout
        // FACTOR 3: blow that ROUTED the defender -> attacker GAINS morale.
        if (defender.routed) this._gainMorale(attacker, MORALE_KILL_GAIN);
        this._pushClash(attacker, defender, dmg, 'rout');
        return dmg;
      }
    }

    if (!defender.dead && !defender.fadingOut && !defender.routed) {
      if (defender.bu.hp <= 0) {
        this.log.push('  -> ' + defender.bu.nazwa + ' wyeliminowany');
        this._startFade(defender);
        this._shakeAlliesOnLoss(defender);
        this._boostEnemiesOnBreak(defender); // FACTOR 4: nearby enemies of the fallen gain morale
        // FACTOR 3: this blow KILLED the defender -> attacker GAINS morale.
        this._gainMorale(attacker, MORALE_KILL_GAIN);
        // BATTLE LOG: this blow KILLED the defender -> tag "(padl)".
        this._pushClash(attacker, defender, dmg, 'padl');
        return dmg;
      }
    }

    // MORALE (SS-morale): the blow shakes the victim's morale, scaled by the
    // damage relative to its max HP. If the pool breaks below the rout
    // threshold the unit routs (flees + counts as OUT). resolveCombat is never
    // touched -- this is purely scene-side bookkeeping around the blow.
    this._applyMoraleDamage(defender, dmg, extraMorale);
    // FACTOR 3: if this (non-killing) blow broke the defender's morale -> attacker GAINS.
    if (defender.routed) this._gainMorale(attacker, MORALE_KILL_GAIN);
    // BATTLE LOG: damaging blow that did NOT kill -- tag "(rout)" iff THIS blow
    // just broke the defender's morale (routed flag flipped by _applyMoraleDamage).
    this._pushClash(attacker, defender, dmg, defender.routed ? 'rout' : '');
    return dmg;
  }

  /**
   * Should the DEFENDER strike back in a mutual melee exchange? It counters iff
   * it is still in the fight (not dead/fading/routed after the initiator's blow)
   * AND it is a MELEE combatant: any non-primary-ranged unit melee-counters, and
   * a PRIMARY shooter counters ONLY when CORNERED -- i.e. it can no longer shoot
   * (out of ammo), so it has nothing left but its sidearm. (A primary shooter
   * with ammo just took a hit but does not trade blows in melee.)
   */
  private _defenderCounters(defender: RuntimeBattleUnit, _attacker: RuntimeBattleUnit): boolean {
    if (defender.dead || defender.fadingOut || defender.routed) return false;
    if (defender.bu.hp <= 0) return false;
    if (!defender.primaryRanged) return true;     // melee unit -> always counters
    return !canShoot(defender);                   // ranged unit counters only when cornered (dry)
  }

  // ---- Melee: ONE quick lunge delivering a single blow ----

  private _doMeleeAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {
    this.busy = true;

    const aw = cellToWorld(attacker.q, attacker.r);
    const dw = cellToWorld(defender.q, defender.r);
    // Attacker turns to FACE the tile it is striking (this is engaging that
    // target). The defender keeps its OWN facing so the player can see when it
    // is being hit in the flank or rear.
    attacker.facing = facingFromTo(attacker.q, attacker.r, defender.q, defender.r, attacker.facing);
    attacker.group.rotation.y = dirYaw(attacker.facing);

    // The attacker lunges in x/z only -- it never leaves its own tile -- so its
    // Y stays at that tile's standing height (hill summit if it stands on one).
    const aHome  = new THREE.Vector3(aw.x, tileTopY(this.terrainMap, attacker.q, attacker.r), aw.z);
    const midX   = (aw.x + dw.x) * 0.5;
    const midZ   = (aw.z + dw.z) * 0.5;
    const aLunge = { x: aw.x + (midX - aw.x) * 0.6, z: aw.z + (midZ - aw.z) * 0.6 };

    let hitDone = false;
    const t0 = this._now();

    const stepAnim = () => {
      if (this.finished || this._autoBattleSuspended) { this.busy = false; return; }
      const localT = this._now() - t0;

      // Land the single blow once we reach the connect moment.
      if (!hitDone && localT >= BLOW_HIT_T) {
        hitDone = true;
        const dmg = this._singleBlow(attacker, defender, false);
        if (dmg > 0 && !defender.dead) this._spawnDamageLabel(defender, dmg);

        // COUNTER-ATTACK (mutual exchange): the DEFENDER strikes back in the same
        // clash IF it is a MELEE unit and survived the initiator's blow. The
        // INITIATOR already got the charge (Uderzenie) on its blow above; the
        // return blow is a PLAIN melee strike (no charge), so we pre-mark the
        // reverse engagement key as already-engaged to deny the defender a charge.
        // A ranged defender does NOT melee-counter unless CORNERED (out of ammo /
        // cannot shoot). resolveCombat is untouched -- this reuses _singleBlow.
        if (this._defenderCounters(defender, attacker)) {
          this.engaged.add(defender.bu.id + '>' + attacker.bu.id); // deny counter the charge
          // Defender turns to face the blow it returns (front exchange for it).
          defender.facing = facingFromTo(defender.q, defender.r, attacker.q, attacker.r, defender.facing);
          defender.group.rotation.y = dirYaw(defender.facing);
          const back = this._singleBlow(defender, attacker, false);
          if (back > 0 && !attacker.dead && !attacker.fadingOut) this._spawnDamageLabel(attacker, back);
        }
      }

      // Lunge forward in the first half, snap back in the second half.
      if (!attacker.dead && !attacker.fadingOut) {
        let ax = aHome.x, az = aHome.z;
        if (localT < BLOW_LUNGE_MS * 0.5) {
          const p = localT / (BLOW_LUNGE_MS * 0.5);
          ax = lerp(aHome.x, aLunge.x, easeOut(p)); az = lerp(aHome.z, aLunge.z, easeOut(p));
        } else if (localT < BLOW_LUNGE_MS) {
          const p = (localT - BLOW_LUNGE_MS * 0.5) / (BLOW_LUNGE_MS * 0.5);
          ax = lerp(aLunge.x, aHome.x, easeIn(p)); az = lerp(aLunge.z, aHome.z, easeIn(p));
        }
        attacker.group.position.set(ax, aHome.y, az);
        attacker.hpBarGroup.position.set(ax, aHome.y + HPBAR_Y, az);
      }

      if (localT >= BLOW_LUNGE_MS) {
        if (!attacker.dead && !attacker.fadingOut) {
          attacker.group.position.set(aHome.x, aHome.y, aHome.z);
          attacker.hpBarGroup.position.set(aHome.x, aHome.y + HPBAR_Y, aHome.z);
        }
        this._schedule(BLOW_SETTLE_MS, () => {
          if (this._autoBattleSuspended) { this.busy = false; return; }
          this.busy = false;
          done();
        });
        return;
      }
      requestAnimationFrame(stepAnim);
    };
    requestAnimationFrame(stepAnim);
  }

  // ---- Ranged: ONE shot with a flying projectile, single blow on landing ----

  private _doRangedAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {
    this.busy = true;

    const aw = cellToWorld(attacker.q, attacker.r);
    const dw = cellToWorld(defender.q, defender.r);
    // Shooter turns to FACE its target tile (engaging it).
    attacker.facing = facingFromTo(attacker.q, attacker.r, defender.q, defender.r, attacker.facing);
    attacker.group.rotation.y = dirYaw(attacker.facing);

    // Throwing this pilum costs one round of ammunition. Once it runs out
    // the unit can no longer shoot (canShoot -> false) and fights in melee.
    // (B6: Legionista has Ilosc pociskow = 2 -> throws 2 pila, then sword.)
    if (Number.isFinite(attacker.ammoLeft)) {
      attacker.ammoLeft -= 1;
      this._updateAmmoBar(attacker); // shrink the BLUE ammo bar (empties + hides at 0)
    }

    // Spawn a PROJECTILE (not a glowing fireball) flying from attacker to
    // defender, its shape chosen by the ATTACKER's weapon: a slim ARROW for
    // bow units (much thinner + shorter than a javelin), a longer/thicker
    // JAVELIN for javelineers, a heavy PILUM for the Legionista, or a tiny
    // stone PELLET for slingers. Geometry built point-first along local +X so
    // we can aim it with one quaternion. Matte / no emissive (no fireball).
    // Launch from the shooter's torso and aim at the target's torso, each lifted
    // by its own tile-top so an arrow from/at a unit on a hill leaves/strikes at
    // the right height rather than from the flat base.
    const from = new THREE.Vector3(aw.x, tileTopY(this.terrainMap, attacker.q, attacker.r) + 0.5, aw.z);
    const to   = new THREE.Vector3(dw.x, tileTopY(this.terrainMap, defender.q, defender.r) + 0.5, dw.z);

    const kind = projectileKind(attacker.bu);
    const { group: proj, geos: projGeos, mats: projMats } = makeProjectileMesh(kind);
    proj.position.copy(from);
    // Aim the group's +X (its point) along the flight direction. (A sling
    // pellet is a sphere, so the orientation is harmless for it.)
    const dir = new THREE.Vector3().subVectors(to, from);
    if (dir.lengthSq() > 1e-6) {
      dir.normalize();
      const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      proj.quaternion.copy(qq);
    }
    this.scene.add(proj);
    this._sfxShot(); // AUDIO: a "whoosh"/twang as the projectile is launched
    this.projectiles.push({
      mesh: proj, from, to, t0: this._now(), dur: RANGED_FLY_MS,
      geos: projGeos, mats: projMats,
    });

    // Apply the single blow when the projectile lands.
    this._schedule(RANGED_FLY_MS, () => {
      if (this.finished || this._autoBattleSuspended) { this.busy = false; return; }
      const dmg = this._singleBlow(attacker, defender, true);
      if (dmg > 0 && !defender.dead && !defender.fadingOut) {
        this._spawnDamageLabel(defender, dmg);
      }
      this._schedule(RANGED_GAP_MS, () => {
        if (this._autoBattleSuspended) { this.busy = false; return; }
        this.busy = false;
        done();
      });
    });
  }

  // -------------------------------------------------------------------------
  // Private: render loop + per-frame updates
  // -------------------------------------------------------------------------

  private _startLoop(): void {
    const loop = (t: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      // W fazie rozstawiania zamrazamy zegar wirtualny — animacje 3D dzialaja,
      // ale jednostki nie sa aktywowane i czas bitwy nie plynie.
      if (this.deployPhase) {
        this._clearOrderPreview();
        if (this._orderLinesGroup) this._orderLinesGroup.visible = false;
        this._syncRendererSize();
        this._tickZoom();
        this._tickCameraPanKeys();
        this._updateArmyMoraleBars();
        for (const ru of [...this.atk, ...this.def]) {
          if (!ru.dead) ru.hpBarGroup.lookAt(this.camera.position);
        }
        this._drawMinimap();
        this.renderer.render(this.scene, this.camera);
        return;
      }
      // Advance the speed-scaled virtual clock from the wall clock, THEN drive
      // every battle ticker off that virtual time so animations honour the
      // current speed multiplier (1x/2x/4x/8x) without breaking their shape.
      this._advanceVClock(t);
      // Drain the virtual-time scheduler BEFORE the per-frame tickers so newly
      // due actions are applied this frame (the speed fix -- see _drainTimers).
      this._drainTimers();
      const vt = this._now();
      this._syncRendererSize();
      this._tickZoom();
      this._tickCameraPanKeys();
      this._tickProjectiles(vt);
      this._tickFades(vt);
      this._tickFloatLabels(t); // WALL time: damage numbers persist ~2s real regardless of speed
      this._updateArmyMoraleBars(); // TASK 5: live L/R army-morale meters
      if (this._manualMode) this._updateRosterBar(); // roster odswiezany co klatkę w trybie RECZNYM
      this._drawMinimap();
      for (const ru of [...this.atk, ...this.def]) {
        if (!ru.dead) ru.hpBarGroup.lookAt(this.camera.position);
      }
      this.renderer.render(this.scene, this.camera);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private _syncRendererSize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    const size = this.renderer.getSize(new THREE.Vector2());
    if (Math.round(size.x) !== w || Math.round(size.y) !== h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  /** clientX/Y → NDC zsynchronizowane z getBoundingClientRect (jak picker.ts na mapie). */
  private _canvasNdc(clientX: number, clientY: number): THREE.Vector2 | null {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = clientRectToNdc(clientX, clientY, rect);
    if (!ndc) return null;
    return new THREE.Vector2(ndc.x, ndc.y);
  }

  /** Promień z pozycji kursora — świeża macierz kamery po pan/zoom w deploy. */
  private _raycastFromCanvas(clientX: number, clientY: number): THREE.Raycaster | null {
    const ndc = this._canvasNdc(clientX, clientY);
    if (!ndc) return null;
    this.camera.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    return raycaster;
  }

  private _tickProjectiles(t: number): void {
    if (this.projectiles.length === 0) return;
    this.projectiles = this.projectiles.filter(p => {
      const prog = Math.min(1, (t - p.t0) / p.dur);
      const x = lerp(p.from.x, p.to.x, prog);
      const y = lerp(p.from.y, p.to.y, prog) + Math.sin(prog * Math.PI) * 0.6; // arc
      const z = lerp(p.from.z, p.to.z, prog);
      p.mesh.position.set(x, y, z);
      if (prog >= 1) {
        this.scene.remove(p.mesh);
        for (const g of p.geos) g.dispose();
        for (const m of p.mats) m.dispose();
        return false;
      }
      return true;
    });
  }

  private _tickFades(t: number): void {
    if (this.fadingUnits.length === 0) return;
    this.fadingUnits = this.fadingUnits.filter(ru => {
      const p = Math.min(1, (t - ru.fadeStart) / DEATH_FADE_MS);
      for (const m of ru.mats) {
        const lm = m as THREE.MeshLambertMaterial;
        lm.transparent = true;
        lm.opacity     = 1 - p;
        lm.needsUpdate = true;
      }
      ru.group.scale.setScalar(1 - p * 0.6);
      if (p >= 1) {
        ru.dead               = true;
        ru.fadingOut          = false;
        ru.group.visible      = false;
        ru.hpBarGroup.visible = false;
        return false;
      }
      return true;
    });
  }

  private _tickFloatLabels(t: number): void {
    if (this.floatLabels.length === 0) return;
    this.floatLabels = this.floatLabels.filter(fl => {
      const age = t - fl.startTime;
      const p   = Math.min(1, age / fl.duration);
      if (p >= 1) {
        if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem);
        return false;
      }
      const wp = fl.worldPos.clone();
      wp.y += age * fl.riseRate;
      const sp = worldToScreen(wp, this.camera, this.canvas);
      if (sp) {
        fl.elem.style.left    = sp.x + 'px';
        fl.elem.style.top     = sp.y + 'px';
        fl.elem.style.opacity = String(1 - p * p);
      }
      return true;
    });
  }

  // -------------------------------------------------------------------------
  // Private: helpers
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // BATTLE SPEED: virtual clock + live control
  // -------------------------------------------------------------------------

  /**
   * The VIRTUAL (speed-scaled) clock, in ms. ALL battle pacing reads this
   * instead of performance.now(): start-stamps (move/lunge/projectile/fade/
   * label) and the elapsed comparisons in _schedule / the per-frame tickers
   * all share this single time base, so they stay perfectly consistent when
   * the speed changes mid-flight. Advanced once per render frame in
   * _advanceVClock() by (wall delta) * speedMul.
   */
  private _now(): number { return this.vNow; }

  /** Advance the virtual clock from the wall clock, scaled by speedMul. Called once per frame. */
  private _advanceVClock(wall: number): void {
    if (this.vLastWall === 0) { this.vLastWall = wall; return; }
    let dw = wall - this.vLastWall;
    this.vLastWall = wall;
    if (this.paused) return; // P-key pause: keep wall ref fresh but freeze virtual time
    if (dw < 0) dw = 0;
    // Clamp the wall delta so a backgrounded tab (huge dt) can't teleport the
    // whole battle forward in a single frame; pacing stays smooth on resume.
    if (dw > 100) dw = 100;
    this.vNow += dw * this.speedMul;
  }

  /** Apply a speed step by index into SPEED_STEPS and refresh the button label. */
  private _setSpeedIdx(idx: number, opts?: { clamp?: boolean }): void {
    const steps = BattleScene.SPEED_STEPS;
    this.speedIdx = opts?.clamp
      ? Math.max(0, Math.min(steps.length - 1, idx))
      : ((idx % steps.length) + steps.length) % steps.length;
    this.speedMul = steps[this.speedIdx] ?? 1;
    const label = 'Predkosc: ' + this.speedMul + 'x';
    if (this.speedHud) this.speedHud.textContent = label;
    if (this._topSpeedLbl) this._topSpeedLbl.textContent = 'x' + this.speedMul;
    this._syncTempoPanelHighlight();
  }

  /** Panel ±: zmiana o jeden stopień SPEED_STEPS bez zawijania (clamp 0..max). */
  private _adjustSpeedIdx(delta: number): void {
    this._setSpeedIdx(this.speedIdx + delta, { clamp: true });
  }

  /** Cycle to the next speed step (1 -> 2 -> 4 -> 8 -> 16 -> 32 -> 64 -> 128 -> 1). Safe to call mid-battle. */
  private _cycleSpeed(): void { this._setSpeedIdx(this.speedIdx + 1); }

  // -------------------------------------------------------------------------
  // BATTLE LOG (last CLASH_LOG_MAX clashes, newest first)
  // -------------------------------------------------------------------------

  /**
   * Record one damaging clash for the on-screen battle-log panel. Called from
   * the blow-resolution path AFTER the damage + death/rout outcome is known, so
   * the entry can tag "(padl)" (defender died) or "(rout)" (defender broke). The
   * `dmg` is the HP the blow dealt (this method is only called for dmg > 0).
   * Newest entry goes to the FRONT; the buffer is hard-capped at CLASH_LOG_MAX
   * so it stays small even when many blows resolve in one high-speed frame.
   */
  private _pushClash(
    attacker: RuntimeBattleUnit,
    defender: RuntimeBattleUnit,
    dmg:      number,
    outcome:  '' | 'padl' | 'rout',
  ): void {
    let line =
      attacker.bu.nazwa + ' (' + sideTag(attacker.side) + ') -> ' +
      defender.bu.nazwa + ' (' + sideTag(defender.side) + '): -' + dmg + ' HP';
    if (outcome === 'padl')      line += ' (padl)';
    else if (outcome === 'rout') line += ' (rout)';
    this.clashLogEntries.unshift(line);                  // newest on top
    if (this.clashLogEntries.length > CLASH_LOG_MAX) {
      this.clashLogEntries.length = CLASH_LOG_MAX;        // drop oldest
    }
    this._renderClashLog();
  }

  /** Repaint the battle-log DOM panel from the rolling clashLogEntries buffer. */
  private _renderClashLog(): void {
    const el = this.clashLog;
    if (!el) return;
    const header =
      '<div style="color:#f0d080;font-weight:bold;margin-bottom:3px;letter-spacing:.03em;">' +
      'Ostatnie starcia</div>';
    if (this.clashLogEntries.length === 0) {
      el.innerHTML = header +
        '<div style="opacity:.55;">(brak starc)</div>';
      return;
    }
    const rows = this.clashLogEntries
      .map(s => '<div>' + escapeHtml(s) + '</div>')
      .join('');
    el.innerHTML = header + rows;
  }

  /**
   * Schedule `cb` to fire after `ms` of VIRTUAL (speed-scaled) time. Timers go
   * into a virtual-time queue drained every frame by _drainTimers(); they are
   * NOT polled per-frame with rAF. This is the SPEED FIX: the old rAF poll could
   * only resolve one step of a self-rescheduling chain (turn/action gaps) per
   * frame, so the discrete battle pacing was capped at the frame rate and high
   * speed multipliers had little effect. With the drained queue a chain of short
   * gaps catches up fully within a frame, so tempo scales linearly to 16x.
   */
  private _schedule(ms: number, cb: () => void): void {
    if (this.finished) return;
    this.vTimers.push({ due: this._now() + Math.max(0, ms), cb, id: this.vTimerSeq++ });
  }

  /**
   * Fire every virtual timer whose due-time has passed, called ONCE per frame
   * from the render loop AFTER _advanceVClock. An internal cursor advances vNow
   * to each timer's due time (in due order) within the frame's virtual budget,
   * so a chain of short gaps that all elapse this frame fires fully -- the key
   * to making speed scale past the frame rate. A guard caps the per-frame fire
   * count so a pathological zero-delay self-reschedule can't spin forever.
   */
  private _drainTimers(): void {
    const target = this._now(); // vNow already advanced for this frame
    let guard = 0;
    for (;;) {
      if (this.finished) { this.vTimers.length = 0; return; }
      // Find the earliest-due timer that is due by `target`.
      let best = -1;
      for (let i = 0; i < this.vTimers.length; i++) {
        const t = this.vTimers[i]!;
        if (t.due > target) continue;
        const b = best >= 0 ? this.vTimers[best]! : null;
        if (!b || t.due < b.due || (t.due === b.due && t.id < b.id)) best = i;
      }
      if (best < 0) break;
      const timer = this.vTimers.splice(best, 1)[0]!;
      timer.cb();
      if (++guard > 100000) break; // safety: never spin forever in one frame
    }
  }

  private _updateHpBar(ru: RuntimeBattleUnit): void {
    const ratio = Math.max(0, Math.min(1, ru.bu.hp / ru.bu.maxHp));
    ru.hpBarFg.scale.x    = ratio;
    ru.hpBarFg.position.x = (ratio - 1) * HPBAR_W * 0.5;
    let color: number;
    if (ratio > 0.60) color = 0x30c030;
    else if (ratio > 0.30) color = 0xd0a020;
    else color = 0xd02020;
    (ru.hpBarFg.material as THREE.MeshBasicMaterial).color.setHex(color);
  }

  /**
   * Refresh the TOP (morale) bar: width = current morale fraction, colour a
   * smooth GREEN->RED gradient by that fraction (full = green, low = red), so
   * the player can watch a unit's morale bleed toward red before it routs.
   */
  private _updateMoraleBar(ru: RuntimeBattleUnit): void {
    const frac = ru.moraleMax > 0 ? Math.max(0, Math.min(1, ru.morale / ru.moraleMax)) : 0;
    ru.moraleBarFg.scale.x    = Math.max(0.0001, frac);
    ru.moraleBarFg.position.x = (frac - 1) * HPBAR_W * 0.5;
    // Green (0x30c030) -> yellow -> red (0xd02020) across frac 1 -> 0.
    const r = Math.round(0xd0 + (0x30 - 0xd0) * frac);
    const g = Math.round(0x20 + (0xc0 - 0x20) * frac);
    const b = 0x20;
    (ru.moraleBarFg.material as THREE.MeshBasicMaterial).color.setRGB(r / 255, g / 255, b / 255);
  }

  /**
   * Refresh the TOP (ammo, BLUE) bar for ranged units with ammo capacity:
   * width = ammoLeft / ammoMax. Once ammo is spent the BLUE fill disappears but
   * the bar's BLACK bg box stays visible, so an out-of-ammo shooter reads as a
   * clear EMPTY BLACK rectangle (not the faction-colour frame bleeding through,
   * which used to make an empty ammo bar look filled red/blue). No-op for units
   * that never show an ammo bar (pure melee / unlimited-shot archers).
   */
  private _updateAmmoBar(ru: RuntimeBattleUnit): void {
    if (!ru.ammoBarShown) return;
    const frac = ru.ammoMax > 0 && Number.isFinite(ru.ammoMax)
      ? Math.max(0, Math.min(1, ru.ammoLeft / ru.ammoMax))
      : 0;
    ru.ammoBarFg.scale.x    = Math.max(0.0001, frac);
    ru.ammoBarFg.position.x = (frac - 1) * HPBAR_W * 0.5;
    // Empty -> hide ONLY the blue fill; the black bg box stays so the empty
    // slot reads black (distinct from a filled bar and from the faction frame).
    ru.ammoBarFg.visible = frac > 0;
    ru.ammoBarBg.visible = true;
  }

  /**
   * Apply a morale hit to the VICTIM of a blow, scaled by how hard the blow was
   * relative to its max HP, then rout it if the pool broke. resolveCombat is
   * never touched -- this is pure scene bookkeeping around the blow. Never-rout
   * units still LOSE morale (the bar reddens) but never actually break.
   */
  /**
   * MORALE GAIN (clamped to [0, moraleMax]). Used by FACTOR 3 (kill/rout an
   * enemy) and FACTOR 4 (enemy breaks nearby). Gains NEVER trigger rout, so they
   * cannot cause death/rout loops.
   */
  private _gainMorale(ru: RuntimeBattleUnit, amount: number): void {
    if (ru.dead || ru.fadingOut || ru.routed || amount <= 0) return;
    ru.morale = Math.min(ru.moraleMax, ru.morale + amount);
    this._updateMoraleBar(ru);
  }

  /**
   * FACTOR 4 -- ENEMY BREAKS NEARBY: when a unit dies or routs, every LIVING
   * ENEMY within MORALE_DEATH_RADIUS gains +MORALE_ENEMY_BREAK_GAIN morale
   * (mirror of _shakeAlliesOnLoss but a GAIN to the OPPOSITE side). A pure gain,
   * so it never retriggers rout.
   */
  private _boostEnemiesOnBreak(fallen: RuntimeBattleUnit): void {
    const enemies = (fallen.side === 'atk' ? this.def : this.atk);
    for (const e of enemies) {
      if (e.dead || e.fadingOut || e.routed) continue;
      if (manhattan(e.q, e.r, fallen.q, fallen.r) > MORALE_DEATH_RADIUS) continue;
      this._gainMorale(e, MORALE_ENEMY_BREAK_GAIN);
    }
  }

  /**
   * FACTOR 8 -- GENERAL aura PLACEHOLDER. future: +morale aura when a general/
   * leader unit is nearby. Not wired into behaviour yet.
   */
  private _generalMoraleAura(_ru: RuntimeBattleUnit): number { return MORALE_GENERAL_AURA; }

  private _applyMoraleDamage(victim: RuntimeBattleUnit, dmg: number, extraLoss = 0): void {
    if (victim.dead || victim.fadingOut || victim.routed) return;
    const maxHp = Math.max(1, victim.bu.maxHp);
    let hpLoss  = MORALE_HIT_LOSS_SCALE * (dmg / maxHp);
    // FACTOR 7 -- ARMY-COLLAPSE AURA: an army already in retreat breaks faster.
    // Amplify ONLY the HP-based loss (not the flat flank/rear/charge extras).
    if (this._armyMoraleRatio(victim.side) < MORALE_ARMY_COLLAPSE_RATIO) {
      hpLoss *= MORALE_ARMY_COLLAPSE_MULT;
    }
    const loss = hpLoss + Math.max(0, extraLoss);
    victim.morale = Math.max(0, victim.morale - loss);
    this._updateMoraleBar(victim);
    this._checkRout(victim);
  }

  /**
   * A unit has just died or routed -> shake the morale of nearby SURVIVING
   * ALLIES (a "shaken by losses" ripple), within MORALE_DEATH_RADIUS tiles, and
   * rout any whose morale breaks as a result. Cascading routs are bounded
   * because each shaken ally only ripples further if IT breaks.
   */
  private _shakeAlliesOnLoss(fallen: RuntimeBattleUnit): void {
    const allies = (fallen.side === 'atk' ? this.atk : this.def);
    for (const a of allies) {
      if (a === fallen || a.dead || a.fadingOut || a.routed) continue;
      if (manhattan(a.q, a.r, fallen.q, fallen.r) > MORALE_DEATH_RADIUS) continue;
      a.morale = Math.max(0, a.morale - MORALE_ALLY_DEATH_LOSS);
      this._updateMoraleBar(a);
      this._checkRout(a);
    }
    if (!fallen.primaryRanged) this._checkMeleeScreenLost(fallen.side);
  }

  /**
   * OSLONA WRECZ: gdy strona straci OSTATNIA zywa jednostke do walki wrecz
   * (kazda nie-primaryRanged), jej STRZELCY panikuja -- jednorazowo -50% morale
   * (potem zwykle pekaja i uciekaja). To realistycznie konczy sytuacje, gdy na
   * polu zostaja sami kitujacy strzelcy (i falanga ich nie goni).
   */
  private _checkMeleeScreenLost(side: 'atk' | 'def'): void {
    const arr = side === 'atk' ? this.atk : this.def;
    const hasMelee = arr.some(u => !u.dead && !u.fadingOut && !u.routed && !u.primaryRanged);
    if (hasMelee) return;
    for (const u of arr) {
      if (u.dead || u.fadingOut || u.routed || u.neverRout) continue;
      if (!u.primaryRanged || u.screenLostApplied) continue;
      u.screenLostApplied = true;
      u.morale = Math.max(0, u.morale * 0.5);
      this._updateMoraleBar(u);
      this._checkRout(u);
    }
  }

  /**
   * Rout a unit once its CURRENT morale drops below ROUT_MORALE_THRESHOLD of its
   * start -- unless it is a never-rout (elite / fights-to-death) unit, which
   * ignores morale and only leaves at HP <= 0. A routing unit stops attacking,
   * turns AWAY from the enemy and is sent fleeing toward its own back edge; it
   * counts as OUT for the victory check, so a side loses when all its units are
   * dead OR routed (battles end by morale collapse, not annihilation).
   */
  private _checkRout(ru: RuntimeBattleUnit): void {
    if (ru.routed || ru.dead || ru.fadingOut || ru.neverRout) return;
    // FACTOR 6 -- DEFENSIVE TERRAIN: a unit on a hill/forest (the same terrain
    // that grants the +50% defence via terrainDefenseMultiplier>1) routs LATER,
    // i.e. its effective flee threshold is lowered (so morale must drop further
    // before it breaks). Threshold kept >=0.
    let flee = ru.fleeMorale;
    const terr = this.terrainMap.combatTerrainName(ru.q, ru.r);
    const cu = toCombatUnit(ru.bu, this.armyHungerStatMult, false, this.goldDeficitStatMult);
    if (terrainDefenseMultiplier(terr, cu.rola, this.terrainData) > 1) {
      flee = Math.max(0, ru.fleeMorale - MORALE_TERRAIN_RESIST);
    }
    if (ru.morale > flee) return;
    this._startRout(ru);
  }

  private _startRout(ru: RuntimeBattleUnit): void {
    if (ru.routed || ru.dead || ru.fadingOut) return;
    this._sfxRout(); // AUDIO: a brief falling horn as the unit breaks
    ru.routed = true;
    ru.acted  = true; // never takes another offensive action
    if (!ru.primaryRanged) this._checkMeleeScreenLost(ru.side);
    this._boostEnemiesOnBreak(ru); // FACTOR 4: this unit broke -> nearby enemies gain morale
    // Free its tile immediately so others can path through the gap it leaves and
    // it never blocks tiles while fleeing.
    this.occByKey.delete(cellKey(ru.q, ru.r));
    // Turn to FACE its OWN home edge (away from the enemy): the attacker deploys
    // LEFT so it flees WEST toward the left edge; the defender deploys RIGHT so it
    // flees EAST toward the right edge.
    ru.facing = ru.side === 'atk' ? Dir.W : Dir.E;
    ru.group.rotation.y = dirYaw(ru.facing);
    this.log.push('  -> ' + ru.bu.nazwa + ' ZALAMUJE MORALE i ucieka z pola!');

    // FUTURE HOOK (data only): record this unit's identity so a future "general
    // rally" feature could recover it. No recovery behaviour now.
    // TODO: general rally recovery.
    const s: Record<string, unknown> = (ru.bu.stats as Record<string, unknown>) ?? {};
    const typeId = String((s['Jednostka'] as string) ?? ru.bu.kategoria ?? ru.bu.nazwa ?? '');
    this.routedUnits.push({ typeId, side: ru.side, owner: ru.bu.ownerColor });

    // The unit now FLEES toward its home edge using NORMAL turn-based movement:
    // each turn _beginTurn includes it in the order, refreshes its movement, and
    // _activateUnit routes it to _fleeStep (one or more one-tile moves toward the
    // edge at normal walk speed). It vanishes (removed from scene + ripples morale
    // to allies) the moment it steps onto its home-edge column. No continuous
    // per-frame glide. acted is set above for the CURRENT turn only (reset each
    // turn by _beginTurn), so it gets fresh flee-turns afterwards.
  }

  /**
   * ROUTED unit's per-turn flee action: walk up to its movement points toward its
   * OWN home edge (attacker -> col 0 / west; defender -> col BF_COLS-1 / east) at
   * NORMAL move speed, one tile per step. Prefers the straight-back tile in its
   * current row; if blocked/impassable it tries row +-1, +-2 to route around.
   * Each completed step that lands on the home-edge column removes the unit from
   * the scene (it leaves the field). One tile at a time, chaining via _schedule
   * while moveLeft remains -- mirrors _fallBackStep / _advanceStep.
   */
  private _fleeStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut || ru.removed) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    const homeCol = ru.side === 'atk' ? 0 : (BF_COLS - 1);

    // Already at (or past) the home edge -> leave the field now.
    const atEdge = ru.side === 'atk' ? (ru.q <= homeCol) : (ru.q >= homeCol);
    if (atEdge) {
      this._removeUnitFromScene(ru);
      this._shakeAlliesOnLoss(ru);
      done();
      return;
    }

    // One column toward home; prefer the same row, then row +-1, +-2 to round
    // any blocker / impassable tile.
    const dir = ru.side === 'atk' ? -1 : 1; // toward home edge along the column axis
    const nc  = ru.q + dir;
    let target: [number, number] | null = null;
    for (const dr of [0, 1, -1, 2, -2]) {
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      if (this.occByKey.has(cellKey(nc, nr))) continue;
      if (!this._passableForUnit(ru, nc, nr)) continue;
      target = [nc, nr];
      break;
    }
    if (!target) {
      // Zablokowany (rzeka/teren/jednostki): zrootowany i tak liczy sie jako OUT.
      // Jesli nie moze dojsc do krawedzi przez ~2 tury -> usun, by nie zamarzal.
      ru.fleeStuck = (ru.fleeStuck ?? 0) + 1;
      if (ru.fleeStuck >= 2) { this._removeUnitFromScene(ru); this._shakeAlliesOnLoss(ru); }
      done();
      return;
    }
    ru.fleeStuck = 0;

    this._doMove(ru, target[0], target[1], () => {
      if (this.finished) { done(); return; }
      if (ru.removed || ru.dead) { done(); return; }
      // Reached the home-edge column -> leave the field.
      const reached = ru.side === 'atk' ? (ru.q <= homeCol) : (ru.q >= homeCol);
      if (reached) {
        this._removeUnitFromScene(ru);
        this._shakeAlliesOnLoss(ru);
        done();
        return;
      }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._fleeStep(ru, done));
      else done();
    });
  }

  /**
   * Remove a unit FULLY from the scene: detach its model group + over-head bar
   * group from the scene graph and dispose the model's own (non-shared) geometry
   * + materials so a fled/dead unit leaves no GPU residue and can no longer
   * render or block tiles. The bar geometries/materials live in the shared
   * ownedGeos/ownedMats lists (disposed once at scene teardown), so they are only
   * detached + hidden here, never disposed twice. The unit is marked `removed`
   * (and `dead`) so it counts as OUT for the victory check and dispose() skips
   * re-disposing its model resources. Idempotent.
   */
  private _removeUnitFromScene(ru: RuntimeBattleUnit): void {
    if (ru.removed) return;
    ru.removed   = true;
    ru.dead      = true;   // counts as OUT for _checkEnd (already true via routed)
    ru.fadingOut = false;
    this.occByKey.delete(cellKey(ru.q, ru.r));
    this.scene.remove(ru.group);
    this.scene.remove(ru.hpBarGroup);
    ru.group.visible      = false;
    ru.hpBarGroup.visible = false;
    // Dispose only the model's OWN resources (these are unique per unit and are
    // NOT in the shared ownedGeos/ownedMats lists). dispose() guards against
    // touching them again for removed units.
    for (const m of ru.mats) m.dispose();
    for (const g of ru.perTokenGeos) g.dispose();
  }

  private _startFade(ru: RuntimeBattleUnit): void {
    if (ru.fadingOut || ru.dead) return;
    this._sfxDeath(); // AUDIO: a dull thud as the unit falls
    ru.fadingOut = true;
    ru.fadeStart = this._now();
    this.fadingUnits.push(ru);
    this.occByKey.delete(cellKey(ru.q, ru.r));
  }

  private _spawnDamageLabel(ru: RuntimeBattleUnit, dmg: number): void {
    const el = document.createElement('div');
    el.textContent = '-' + dmg;
    Object.assign(el.style, {
      position:      'absolute',
      pointerEvents: 'none',
      color:         '#ff4444',
      fontFamily:    'sans-serif',
      fontSize:      '15px',
      fontWeight:    'bold',
      textShadow:    '0 0 6px #000, 1px 1px 2px #000',
      whiteSpace:    'nowrap',
      transform:     'translate(-50%, -50%)',
      zIndex:        '10010',
    });
    this.overlay.appendChild(el);
    const wp = cellToWorld(ru.q, ru.r);
    // Float the damage number above the unit's HP bar, lifted by its tile-top so
    // it sits over the head even when the unit stands on a raised hill.
    const wpTopY = tileTopY(this.terrainMap, ru.q, ru.r);
    this.floatLabels.push({
      elem:      el,
      startTime: this.vLastWall,
      duration:  2000,
      worldPos:  new THREE.Vector3(wp.x, wpTopY + HPBAR_Y + 0.20, wp.z),
      riseRate:  0.00012,
    });
  }

  // -------------------------------------------------------------------------
  // Private: end of battle
  // -------------------------------------------------------------------------

  /**
   * ARMY MORALE ratio for a side (TASK 3): sum of the CURRENT morale of every
   * unit that side ever fielded, divided by the sum of their STARTING morale.
   * DEAD and ROUTED units contribute 0 to the numerator (they have broken /
   * fallen) but KEEP their starting morale in the denominator -- so losing units
   * drags the ratio down. The full per-side roster lives in this.atk / this.def
   * (units are flagged dead/routed, never removed from the array), so iterating
   * those arrays gives exactly "all units that ever existed". Returns 1.0 for an
   * empty roster (avoids divide-by-zero; an empty side is handled by the
   * all-out branch of _checkEnd anyway).
   */
  private _armyMoraleRatio(side: 'atk' | 'def'): number {
    const arr = side === 'atk' ? this.atk : this.def;
    let cur = 0;
    let start = 0;
    for (const u of arr) {
      start += u.moraleMax;
      // Dead OR routed units contribute 0 current morale.
      if (u.dead || u.fadingOut || u.routed) continue;
      cur += Math.max(0, u.morale);
    }
    if (start <= 0) return 1.0;
    return cur / start;
  }

  /**
   * ARMY HP ratio for a side (TW v5 SS2 — pierscien HP na medalionie dowodcy):
   * suma aktualnego HP / suma maxHP calego rosteru strony (ten sam wzorzec co
   * _armyMoraleRatio i _sideEndStats — dead/routed licza sie jako 0 w liczniku).
   */
  private _armyHpRatio(side: 'atk' | 'def'): number {
    const arr = side === 'atk' ? this.atk : this.def;
    let cur = 0;
    let max = 0;
    for (const u of arr) {
      max += Math.max(0, u.bu.maxHp);
      if (u.dead || u.fadingOut || u.routed) continue;
      cur += Math.max(0, u.bu.hp);
    }
    if (max <= 0) return 1.0;
    return Math.max(0, Math.min(1, cur / max));
  }

  /**
   * Klasyfikacja PRAWDZIWEGO typu jednostki (konnica/wręcz/dystans) — liczniki
   * HUD, filtry rosteru, sortowanie kart. isPrimaryRanged() bez wyjątków
   * (oszczepnik = dystans, jak Rola (linia) w units.json). Formacja na polu
   * (wrecz / oszczep / luki) ma osobną ścieżkę javI po kategorii — nie polega
   * na tej funkcji.
   */
  private _armyCompositionKind(ru: RuntimeBattleUnit): 'mounted' | 'melee' | 'ranged' {
    if (ru.mounted || isMounted(ru.bu)) return 'mounted';
    if (isPrimaryRanged(ru.bu)) return 'ranged';
    return 'melee';
  }

  /** Konnica / piechota / lucznictwo — opcjonalnie tylko aktywne (w trakcie walki). */
  private _sideTypeCounts(
    arr: RuntimeBattleUnit[],
    activeOnly: boolean,
  ): { k: number; p: number; l: number } {
    let k = 0, p = 0, l = 0;
    for (const u of arr) {
      if (u.removed) continue;
      if (activeOnly && (u.dead || u.routed || u.fadingOut)) continue;
      const kind = this._armyCompositionKind(u);
      if (kind === 'mounted') k++;
      else if (kind === 'ranged') l++;
      else p++;
    }
    return { k, p, l };
  }

  /**
   * HTML skladu armii w karcie dowodcy (TW v5 SS2). Kolejnosc konnica/piechota/
   * dystansowe/suma NIE jest lustrzana miedzy stronami (decyzja Design
   * 2026-07-23, DESIGN-do-UI_POLE-BITWY-TW-v5.md SS2) — obie karty czytaja sie
   * w tym samym porzadku, tylko caly blok karty jest wizualnie mirror (prawa
   * karta ma flexDirection: row-reverse, patrz mkCommanderCard).
   */
  private _renderSideRoster(
    el: HTMLSpanElement,
    _side: 'atk' | 'def',
    counts: { k: number; p: number; l: number },
    _live: boolean,
  ): void {
    el.innerHTML = topBarRosterCountsHtml({ mounted: counts.k, melee: counts.p, ranged: counts.l });
  }

  /** MM:SS (Georgia, tabular-nums) z milisekund; mm capped na 2 cyfry (99:59 max wyswietlane). */
  private _fmtBattleClock(ms: number): string {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.min(99, Math.floor(totalSec / 60));
    const ss = totalSec % 60;
    return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }

  /**
   * Live refresh of the top-bar commander panel (TW v5 SS2): HP-pierscienie na
   * medalionach (zrodlo: _armyHpRatio), zegar bitwy MM:SS (od START WALKI,
   * na bazie zegara wirtualnego vNow — zamrozony na pauzie/w deployu, jak
   * reszta pacingu), pasek przewagi (zrodlo: _armyMoraleRatio — TA SAMA dana,
   * co dawny pelnoszerokosciowy pasek "Ostatnie starcia" v4) oraz sklad armii
   * w kartach dowodcow. Wywolywane co klatke (tanie).
   */
  private _updateArmyMoraleBars(): void {
    const ratioA = this._armyMoraleRatio('atk');
    const ratioD = this._armyMoraleRatio('def');
    const rA = Math.max(0, Math.min(1, ratioA));
    const rD = Math.max(0, Math.min(1, ratioD));

    // Pierscienie HP na medalionach dowodcow.
    if (this._cmdRingA) this._cmdRingA.innerHTML = commanderPortraitRingSvg(this._armyHpRatio('atk'));
    if (this._cmdRingD) this._cmdRingD.innerHTML = commanderPortraitRingSvg(this._armyHpRatio('def'));

    // Zegar bitwy: 00:00 przed startem / w deployu; liczy od START WALKI na
    // bazie vNow (ten sam zegar co reszta pacingu -- honoruje pauze/predkosc).
    if (this._battleClockEl) {
      const elapsedMs = (this.started && this._battleStartVNow !== null)
        ? Math.max(0, this.vNow - this._battleStartVNow)
        : 0;
      this._battleClockEl.textContent = this._fmtBattleClock(elapsedMs);
    }
    if (this._battleClockCaptionEl) {
      this._battleClockCaptionEl.textContent = this.started ? 'Czas bitwy' : 'Start po rozstawieniu';
    }

    // Pasek przewagi: udzial sily Ty/wrog znormalizowany do 100% (ta sama
    // zrodlowa dana co stary pasek mocy — army-morale ratio), zloty znacznik
    // na styku (mockup TW v5 SS2).
    const sum = rA + rD;
    const tyShare = sum > 0 ? rA / sum : 0.5;
    const tyPct = Math.round(tyShare * 100);
    const foePct = 100 - tyPct;
    if (this._momentumFillA) this._momentumFillA.style.width = tyPct + '%';
    if (this._momentumMarker) this._momentumMarker.style.left = tyPct + '%';
    if (this._momentumCaptionEl) {
      const label = this.started ? 'Przewaga na polu' : 'Szacunkowa przewaga';
      const playerSide = this._playerControlSide();
      this._momentumCaptionEl.innerHTML = label + ': <b style="color:' + this._factionTextColor(playerSide) + '">'
        + tyPct + '% Ty</b> · <b style="color:' + this._factionTextColor(playerSide === 'atk' ? 'def' : 'atk') + '">' + foePct + '% wróg</b>';
    }

    // Gorny pasek: sklad armii (przed walka = startowy; w walce = pozostali)
    const live = this.started && !this.deployPhase;
    const cA = this._sideTypeCounts(this.atk, live);
    const cD = this._sideTypeCounts(this.def, live);
    if (this._topCasATxt) this._renderSideRoster(this._topCasATxt, 'atk', cA, live);
    if (this._topCasDTxt) this._renderSideRoster(this._topCasDTxt, 'def', cD, live);
    if (this._topTurnLbl) {
      if (this.deployPhase) this._topTurnLbl.textContent = 'Faza rozstawiania';
      else if (!this.started) this._topTurnLbl.textContent = 'Przygotowanie';
      else this._topTurnLbl.textContent = this._manualMode
        ? ('Tura ' + this.roundNo + ' · Ręczne')
        : ('Tura ' + this.roundNo);
    }
    const civEmblem = document.getElementById('battle-top-civ-emblem') as HTMLDivElement | null;
    if (civEmblem) civEmblem.style.display = this.deployPhase ? 'inline-flex' : 'none';
    if (this.pauseHud) this.pauseHud.style.display = this.paused ? 'block' : 'none';
    if (this._topPauseBadge) this._topPauseBadge.style.display = this.paused ? 'inline' : 'none';
  }

  private _checkEnd(): boolean {
    if (this.finished) return true;
    // A unit counts as OUT when dead OR routed (morale collapse). A side loses
    // when ALL its units are dead or routed -- battles end by morale break, not
    // only by annihilation. (Routed units also fade out shortly after, but the
    // victory check treats them as gone the instant they break.)
    let aliveA = this.atk.some(u => !u.dead && !u.fadingOut && !u.routed);
    let aliveD = this.def.some(u => !u.dead && !u.fadingOut && !u.routed);

    // ARMY-MORALE DEFEAT (TASK 3): a side whose collective army-morale ratio has
    // fallen below ARMY_MORALE_LOSS_THRESHOLD is broken as a fighting force and
    // LOSES, even if it still has units on the field. Treat such a side as "not
    // alive" for the win check below. Recomputed here every turn / after losses.
    const ratioA = this._armyMoraleRatio('atk');
    const ratioD = this._armyMoraleRatio('def');
    const brokenA = ratioA < ARMY_MORALE_LOSS_THRESHOLD;
    const brokenD = ratioD < ARMY_MORALE_LOSS_THRESHOLD;
    if (this._stalled && aliveA && aliveD) {
      // Nie rozstrzygaj po stall gdy: (a) tryb oblezenia -- atakujacy maszeruje/
      // buduje machiny wiele tur bez starcia, (b) zerowe straty po obu stronach
      // -- bitwa faktycznie sie nie zaczela.
      const isSiege = this.siegeWallCol >= 0;
      const totalDead = [...this.atk, ...this.def].filter(u => u.dead).length;
      if (!isSiege && totalDead > 0) {
        this.log.push('=== PAT: brak postepu w walce -- rozstrzygniecie po morale armii ===');
        if (ratioA <= ratioD) aliveA = false; else aliveD = false;
      }
    }
    if (brokenA && aliveA) {
      this.log.push('=== Morale armii ATAKUJACEGO zalamane (' + Math.round(ratioA * 100) + '% < 25%) -- armia w rozsypce! ===');
      aliveA = false;
    }
    if (brokenD && aliveD) {
      this.log.push('=== Morale armii OBRONCY zalamane (' + Math.round(ratioD * 100) + '% < 25%) -- armia w rozsypce! ===');
      aliveD = false;
    }

    if (aliveA && aliveD) return false;

    this.finished = true;

    let winner: 'atakujacy' | 'obronca';
    if (aliveA && !aliveD)      winner = 'atakujacy';
    else if (aliveD && !aliveA) winner = 'obronca';
    else {
      // Mutual elimination -- compare remaining HP for a decisive call.
      const hpA = this.atk.reduce((s, u) => s + Math.max(0, u.bu.hp), 0);
      const hpD = this.def.reduce((s, u) => s + Math.max(0, u.bu.hp), 0);
      winner = hpA >= hpD ? 'atakujacy' : 'obronca';
    }

    // Rout na polu 3D ustawia dead=true przy _removeUnitFromScene — na mapie świata
    // jednostka rozbita (rout) ma wrócić z HP>0 (post-battle-map.ts wycofanie).
    const survivors = this._battleUnitsForMapExport(
      winner === 'atakujacy' ? this.atk : this.def,
    );

    const winMsg = winner === 'atakujacy' ? 'ATAKUJACEGO' : 'OBRONCY';
    this.log.push('=== Koniec bitwy: zwyciestwo ' + winMsg + ' ===');

    // TASK D: FREEZE on an end-of-battle summary screen instead of auto-closing.
    // The battle pauses here (the render loop keeps drawing the frozen field) and
    // the player reviews who won + per-side stats, then clicks "Zakoncz bitwe" to
    // tear down the scene and return to the map. The onFinish result is still
    // delivered (so the map applies the outcome) at the moment they exit.
    this._endWinner    = winner;
    this._endSurvivors = survivors;
    this._showEndScreen(winner);
    return true;
  }

  /**
   * Ocalałe jednostki zwycięskiej strony do applyPostBattleMap (manualSurvivors).
   * Rout = ucieczka z pola bitwy, nie kasacja z units[] — HP>0 wraca na mapę.
   */
  private _battleUnitsForMapExport(roster: RuntimeBattleUnit[]): BattleUnit[] {
    return roster
      .filter(u => u.bu.hp > 0 && (!u.dead || u.routed))
      .map(u => ({ ...u.bu, hp: Math.max(0, u.bu.hp) }));
  }

  /**
   * TASK D: per-side end-of-battle stat snapshot. A unit counts as LOST if it is
   * dead OR routed (broke and fled); REMAINING = still alive on the field (not
   * dead, not routed). HP totals are summed over the side's whole roster.
   */
  private _sideEndStats(side: 'atk' | 'def'): {
    total: number; lost: number; remaining: number; hp: number; hpMax: number;
  } {
    const roster = side === 'atk' ? this.atk : this.def;
    let lost = 0, remaining = 0, hp = 0, hpMax = 0;
    for (const u of roster) {
      const out = u.dead || u.routed;
      if (out) lost++; else remaining++;
      hp    += out ? 0 : Math.max(0, u.bu.hp);
      hpMax += Math.max(0, u.bu.maxHp);
    }
    return { total: roster.length, lost, remaining, hp, hpMax };
  }

  private _sideDisplayLabel(side: 'atk' | 'def'): string {
    const custom = side === 'atk' ? this._attackerSideLabel : this._defenderSideLabel;
    if (custom) return custom;
    const snaps = side === 'atk' ? this._startAtkSnaps : this._startDefSnaps;
    if (snaps.length > 1) return 'Sklad (' + snaps.length + ')';
    if (snaps.length === 1) return snaps[0]!.typeId;
    const roster = side === 'atk' ? this.atk : this.def;
    if (roster.length > 1) return 'Sklad (' + roster.length + ')';
    const u = roster[0];
    return String(u?.bu.nazwa ?? u?.bu.kategoria ?? (side === 'atk' ? 'Atakujacy' : 'Obronca'));
  }

  private _liveHpLookup(): (id: string) => number | null {
    const byId = new Map<string, RuntimeBattleUnit>();
    for (const u of [...this.atk, ...this.def]) byId.set(u.bu.id, u);
    return (id: string) => {
      const ru = byId.get(id);
      if (!ru) return null;
      if (ru.dead) return null;
      return ru.bu.hp;
    };
  }

  private _battleSummaryWinner(): BattleSummaryWinner {
    if (this._endWinner === 'atakujacy' || this._endWinner === 'obronca') return this._endWinner;
    if (this.finished) {
      const aliveA = this.atk.some(u => !u.dead && !u.removed);
      const aliveD = this.def.some(u => !u.dead && !u.removed);
      if (aliveA && !aliveD) return 'atakujacy';
      if (aliveD && !aliveA) return 'obronca';
    }
    return 'remis';
  }

  private _buildBattleSummaryData(live: boolean) {
    const winner = live ? 'remis' as const : this._battleSummaryWinner();
    return buildPostBattleSummary({
      winner,
      atkLabel: this._sideDisplayLabel('atk'),
      defLabel: this._sideDisplayLabel('def'),
      atkCivLabel: this._attackerCivLabel,
      defCivLabel: this._defenderCivLabel,
      teren: this.terrain,
      mode: 'manual',
      atkBefore: this._startAtkSnaps,
      defBefore: this._startDefSnaps,
      lookupHp: this._liveHpLookup(),
    });
  }

  /**
   * Pełny widok rosteru + paski HP (ten sam layout co postBattleSummary na mapie).
   * live=true: w trakcie walki (przycisk I / rail); false: z ekranu końca bitwy.
   */
  private _showBattleStatsOverlay(mode: 'live' | 'end'): void {
    if (mode === 'live' && (!this.started || this.deployPhase)) return;
    if (mode === 'live' && this._endScreenShown) return;

    this._hideEndDetails();

    if (mode === 'end') {
      if (this._endScreenBackdrop) this._endScreenBackdrop.style.visibility = 'hidden';
      if (this._endScreenWrap) this._endScreenWrap.style.visibility = 'hidden';
    }

    const live = mode === 'live';
    let data = this._buildBattleSummaryData(live);
    if (live) {
      data = {
        ...data,
        title: 'Stan oddzialow',
        winnerLabel: 'Bitwa w toku',
      };
    }

    showPostBattleSummary(
      data,
      () => { this._hideEndDetails(); },
      {
        continueLabel: mode === 'end' ? '\u2190 Wroc do podsumowania' : 'Zamknij',
        zIndex: '100530',
        statusHeading: live ? 'Status' : undefined,
        playerSide: this._playerControlSide(),
      },
    );
    this._battleStatsOpen = true;
  }

  private _toggleBattleStatsOverlay(mode: 'live' | 'end'): void {
    if (isPostBattleSummaryOpen()) {
      this._hideEndDetails();
      return;
    }
    this._showBattleStatsOverlay(mode);
  }

  /** Zbiera dane strony (ATK/OBR) dla C-23 „Szczegóły bitwy" (endDetails1E). */
  private _buildEndDetailsSide(side: 'atk' | 'def'): EndDetailsSideData {
    const roster = side === 'atk' ? this.atk : this.def;
    const snaps = side === 'atk' ? this._startAtkSnaps : this._startDefSnaps;
    const snapById = new Map(snaps.map(s => [s.id, s]));
    const units: EndDetailsUnitRow[] = roster.map(ru => {
      const snap = snapById.get(ru.bu.id);
      const hpBefore = Math.max(0, Math.round(snap ? snap.hp : ru.bu.maxHp));
      const hpAfter = ru.dead ? 0 : Math.max(0, Math.round(ru.bu.hp));
      // ZNALEZISKO 86: maxHp z tego samego snapshotu (_startAtkSnaps/_startDefSnaps),
      // które już zasila _buildBattleSummaryData/postBattleSummary — jedno źródło,
      // bez ponownego liczenia. Fallback na ru.bu.maxHp, jak przy hpBefore wyżej.
      const maxHp = Math.max(0, Math.round(snap ? snap.maxHp : ru.bu.maxHp));
      const fate: EndDetailsUnitRow['fate'] = ru.dead ? 'destroyed' : ru.routed ? 'routed' : 'survived';
      return {
        name: this._unitDisplayLabel(ru),
        kind: this._unitBattleClass(ru),
        hpBefore, hpAfter, maxHp, fate,
      };
    });
    const totalBefore = units.reduce((s, u) => s + u.hpBefore, 0);
    const totalAfter = units.reduce((s, u) => s + u.hpAfter, 0);
    return {
      civLabel: side === 'atk' ? this._attackerCivLabel : this._defenderCivLabel,
      roleLabel: side === 'atk' ? 'Atakujący' : 'Obrońca',
      totalBefore, totalAfter, units,
    };
  }

  /** C-23 „Szczegóły bitwy" — otwierana z „Szczegóły bitwy" na ekranie końca (C-12). */
  private _showEndDetails(): void {
    if (this._endScreenBackdrop) this._endScreenBackdrop.style.visibility = 'hidden';
    if (this._endScreenWrap) this._endScreenWrap.style.visibility = 'hidden';
    this._hideEndDetails();

    const battleWinner = this._battleSummaryWinner();
    const playerWon = battleWinner !== 'remis' && this._playerWonFromBattleWinner(battleWinner);
    const playerSide = this._playerControlSide();
    const elapsedMs = (this.started && this._battleStartVNow !== null)
      ? Math.max(0, this.vNow - this._battleStartVNow)
      : 0;
    const battleSubtitle = 'Tura ' + this.roundNo + ' · ' + this._fmtBattleClock(elapsedMs);
    const winnerCiv = playerWon
      ? this._civLabelForSide(playerSide)
      : this._civLabelForSide(playerSide === 'atk' ? 'def' : 'atk');
    const params: EndDetails1EParams = {
      battleSubtitle,
      resultLabel: 'zwycięstwo ' + winnerCiv,
      playerWon,
      playerSide,
      atk: this._buildEndDetailsSide('atk'),
      def: this._buildEndDetailsSide('def'),
    };
    this._endDetailsEl = showEndDetails1E(this.overlay, params, {
      onClose: () => { this._hideEndDetails(); },
    });
    this._battleStatsOpen = true;
  }

  private _hideEndDetails(): void {
    // `_battleStatsOpen` identifies the summary overlay owned by this scene's
    // "Szczegóły bitwy" view. The map-level post-battle summary is created by
    // `onFinishCb` immediately before `dispose()` runs; hiding every open
    // post-battle summary here used to remove that new screen in the same tick.
    if (this._battleStatsOpen) {
      hidePostBattleSummary();
    }
    if (this._endDetailsEl?.parentNode) {
      this._endDetailsEl.parentNode.removeChild(this._endDetailsEl);
    }
    this._endDetailsEl = null;
    this._battleStatsOpen = false;
    if (this._endScreenBackdrop) this._endScreenBackdrop.style.visibility = '';
    if (this._endScreenWrap) this._endScreenWrap.style.visibility = '';
  }

  /** Usuwa overlay podsumowania (bez dispose calej sceny). */
  private _hideEndScreen(): void {
    this._hideEndDetails();
    if (this._endScreenBackdrop?.parentNode) {
      this._endScreenBackdrop.parentNode.removeChild(this._endScreenBackdrop);
    }
    if (this._endScreenWrap?.parentNode) {
      this._endScreenWrap.parentNode.removeChild(this._endScreenWrap);
    }
    this._endScreenBackdrop = null;
    this._endScreenWrap = null;
    this._endScreenShown = false;
    if (this._battleChromeSuppressed) this._setBattleChromeForEndScreen(false);
  }

  private _removeAllUnitsFromField(): void {
    for (const fl of this.floatLabels) {
      if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem);
    }
    this.floatLabels = [];
    for (const p of this.projectiles) {
      for (const g of p.geos) g.dispose();
      for (const m of p.mats) m.dispose();
    }
    this.projectiles = [];
    for (const ru of [...this.atk, ...this.def]) {
      if (ru.removed) continue;
      this.occByKey.delete(cellKey(ru.q, ru.r));
      this.scene.remove(ru.group);
      this.scene.remove(ru.hpBarGroup);
    }
    this.atk = [];
    this.def = [];
    this.occByKey.clear();
    this._groups.clear();
    this._groupCounter = 0;
    this._groupMeta.clear();
    this._rosterGroupCollapsed.clear();
    this._selectedUnits.clear();
    this._deploySelected = null;
    this._unitCards.clear();
    this._selectionRings.clear();
    this._disposeAllOrderLines();
    this._clearOrderPreview();
    this._disposeQueuedOrderArrows();
  }

  private _resetSiegeForReplay(): void {
    if (this.siegeWallCol < 0) return;
    this.gateHp = 400;
    this.gateOpen = false;
    this.towerAtWallRows.clear();
    this.wallTileHp.clear();
    const gateRowLo = this.siegeGateRow - 1;
    const gateRowHi = this.siegeGateRow;
    for (let r = this.siegeWallRowLo; r <= this.siegeWallRowHi; r++) {
      if (r >= gateRowLo && r <= gateRowHi) continue;
      this.wallTileHp.set(r, BattleScene.WALL_TILE_HP);
    }
  }

  private _resetBattleRuntimeState(): void {
    this.finished = false;
    this.started = false;
    this.busy = false;
    this.roundNo = 0;
    this.activeSide = 'atk';
    this._manualMode = true;
    this._battleAwaitingOrders = true;
    this._endWinner = null;
    this._endSurvivors = [];
    this.log = [];
    this.vTimers.length = 0;
    this.engaged.clear();
    this._stallTurns = 0;
    this._stallSig = '';
    this._stalled = false;
    this._queuedOrderUnitIds.clear();
    this.clashLogEntries = [];
    this._renderClashLog();
    this._routCountA = 0;
    this._routCountD = 0;
    this.turnOrder = [];
    this.turnIdx = 0;
    this.paused = false;
    if (this.pauseHud) this.pauseHud.style.display = 'none';
    if (this._topPauseBadge) this._topPauseBadge.style.display = 'none';
    this._autoBattleSuspended = false;
    this._haltAutoBattleTurn(false);
  }

  /** Ta sama bitwa od poczatku — bez wyjscia na mape i bez onFinish (wygrana lub porazka). */
  private _replayBattle(): void {
    if (this._savedAtkBUs.length === 0 || this._savedDefBUs.length === 0) {
      this._showOrderFeedback('Brak zapisu armii — nie mozna powtorzyc bitwy');
      return;
    }
    this._hideEndScreen();
    startBattleMusic(); // powtórka -> z ekranu zwycięstwa/porażki wróć na muzykę bitwy (czysta wymiana)
    this._resetBattleRuntimeState();
    this._removeAllUnitsFromField();
    this._resetSiegeForReplay();
    this._clearAllSelection();
    if (this._modeBanner) this._modeBanner.style.display = 'none';

    const siegeMode = this.siegeWallCol >= 0;
    const atk = cloneBattleUnitsForReplay(this._savedAtkBUs);
    const def = cloneBattleUnitsForReplay(this._savedDefBUs);
    if (atk.length === 0 && def.length === 0) return;
    this._placeUnits(atk, def, siegeMode);

    if (this._deployMode) {
      this.deployPhase = true;
      this._setDeployZoneVisible(true);
      this._buildDeployHalfLabels();
      this._initDeployUI();
      if (this._deployToolbar) this._deployToolbar.style.display = 'flex';
      this._syncBattleToolbarMode();
      this._closeDeployDropdowns();
      this._updateArmyMoraleBars();
      if (this._topTurnLbl) this._topTurnLbl.textContent = 'Faza rozstawiania';
      this.hint.textContent =
        'FAZA ROZSTAWIANIA — strefa gry (środek mapy). WASD / strzałki = przesuń widok · kółko = zoom.';
      // NIE chowaj _rosterBar tutaj: to ten sam panel co w walce
      // (`player-roster-bar`, patrz _initDeployUI) i _initDeployUI() wyżej już
      // ustawił mu display:flex — schowanie go tu było przyczyną zgłoszenia
      // właściciela (2026-07-26): po „Rozegraj ponownie" panel sterowania
      // fazą rozstawiania (szyk/grupowanie/roster) znikał całkowicie, zostawało
      // tylko przesuwanie żetonów po siatce.
      this._showDeployFeedback('Bitwa od nowa — rozstaw armie');
    } else {
      this.deployPhase = false;
      this._startBattle();
      this.hint.textContent =
        'TURA 1 — wydaj rozkazy (klik / G1-G3 / Generał) · SPACJA = start tury · R = AUTO';
    }
    this._syncMinimapPhaseChrome();
  }

  /**
   * TASK D: build + show the frozen END-OF-BATTLE overlay panel. Shows the WINNER
   * and a per-side table (units lost / remaining / HP), plus a clearly labelled
   * "Zakoncz bitwe" button that EXITS the battle via the SAME path as the existing
   * "Wyjscie" control (dispose + onCancel), additionally delivering the battle
   * result through onFinish so the map state is updated. The scene stays frozen
   * until the player clicks it.
   */
  /**
   * Ukrywa pasek Taktyka/Strategia, rail i minimapę — mają z-index > overlay bitwy
   * i zasłaniały panel zwycięstwa (endScreen1E na body @ 100500).
   */
  private _setBattleChromeForEndScreen(suppress: boolean): void {
    this._battleChromeSuppressed = suppress;
    const apply = (el: HTMLElement | null | undefined): void => {
      if (!el) return;
      if (suppress) {
        if (el.dataset.battleChromePrevDisplay === undefined) {
          el.dataset.battleChromePrevDisplay = el.style.display || '';
        }
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
      } else {
        const prev = el.dataset.battleChromePrevDisplay;
        if (prev !== undefined) {
          el.style.display = prev;
          delete el.dataset.battleChromePrevDisplay;
        }
        el.style.pointerEvents = '';
      }
    };
    apply(this._deployToolbar);
    apply(this._modeBanner);
    apply(this._minimapWrap);
    apply(this._deployRosterDock);
    apply(this._rosterBar);
    apply(this._selPanel);
    if (this.siegeWallCol >= 0) {
      if (suppress) {
        setSiegeHudVisible(false);
      } else {
        this._syncSiegeHudChromeVisibility();
      }
    }
    if (!suppress) this._syncBattleToolbarMode();
  }

  private _showEndScreen(winner: 'atakujacy' | 'obronca'): void {
    if (this._endScreenShown) return;
    this._endScreenShown = true;
    this._hideEndDetails();
    this._setBattleChromeForEndScreen(true);
    this._sfxVictory();

    const playerSide = this._playerControlSide();
    const sA = this._sideEndStats('atk');
    const sD = this._sideEndStats('def');
    const playerWon = this._playerWonFromBattleWinner(winner);
    // Muzyka ekranu końca bitwy (wg tej samej flagi playerWon, co wizualia):
    // wygrana -> utwór zwycięstwa, przegrana -> utwór porażki. Overlay bitwy jest
    // aktywny, więc to czysta wymiana utworu; muzykę mapy wznawia setMood('mapa')
    // wołane z callbacku onFinish/onCancel bitwy (patrz main.ts).
    if (playerWon) startVictoryMusic(); else startDefeatMusic();
    const winSub = winner === 'atakujacy' ? 'Zwyci\u0119stwo atakuj\u0105cego!' : 'Zwyci\u0119stwo obro\u0144cy!';
    const enemyRoster = playerSide === 'atk' ? this.def : this.atk;
    const killedTypeIds = playerWon
      ? enemyRoster.map(u => String(u.bu.nazwa || '')).filter(Boolean)
      : [];
    const lootResult = playerWon ? computeBattleLoot(killedTypeIds) : null;
    const loot = lootResult && !battleLootIsEmpty(lootResult) ? lootResult.gold : 0;
    const lootNote = lootResult ? formatBattleLootNote(lootResult) : 'brak \u0142up\u00F3w';
    let heroLabel = '—';
    for (const u of this._playerRoster()) {
      if (!u.dead && !u.routed) {
        heroLabel = String(u.bu.nazwa ?? u.bu.kategoria ?? 'Jednostka');
        if (isMounted(u.bu)) break;
      }
    }
    const elapsedMsEnd = (this.started && this._battleStartVNow !== null)
      ? Math.max(0, this.vNow - this._battleStartVNow)
      : 0;
    const endUi = showEndScreen1E(this.overlay, {
      playerWon,
      playerSide,
      winnerLabel: winSub,
      battleTitle: 'Tura ' + this.roundNo + ' \u00b7 ' + this._fmtBattleClock(elapsedMsEnd),
      atk: sA,
      def: sD,
      lootGold: loot,
      lootNote: loot > 0 ? lootNote : 'brak \u0142up\u00F3w',
      heroLabel,
      heroPromo: playerWon ? 'Awans \u2192 Weteran' : '',
    }, {
      onDetails: () => { this._showEndDetails(); },
      onReplay: () => { this._replayBattle(); },
      onFinish: () => {
        if (this.onFinishCb) {
          this.onFinishCb({ winner: this._endWinner ?? winner, survivors: this._endSurvivors, log: this.log });
        }
        this.dispose();
        if (this.onCancelCb) this.onCancelCb();
      },
    });
    this._endScreenBackdrop = endUi.backdrop;
    this._endScreenWrap = endUi.wrap;
  }

  private _showResultBanner(winner: 'atakujacy' | 'obronca'): void {
    const banner = document.createElement('div');
    banner.textContent = winner === 'atakujacy'
      ? 'Zwyci\u0119stwo atakuj\u0105cego!'
      : 'Zwyci\u0119stwo obro\u0144cy!';
    Object.assign(banner.style, {
      position:      'absolute',
      top:           '38%',
      left:          '50%',
      transform:     'translate(-50%, -50%)',
      color:         HUD_GOLD,
      fontFamily:    BATTLE_FONT_TITLE,
      fontSize:      '48px',
      fontWeight:    '400',
      letterSpacing: '0.08em',
      textShadow:    '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(232,216,138,0.25)',
      pointerEvents: 'none',
      zIndex:        '10001',
    });
    this.overlay.appendChild(banner);
  }

  // -------------------------------------------------------------------------
  // Private: camera dolly-zoom (B9)
  // -------------------------------------------------------------------------

  /** Place the camera at camTarget + camDir * camDist, looking at camTarget. */
  private _applyCamera(): void {
    const d = Math.max(this.camDistMin, Math.min(this.camDistMax, this.camDist));
    this.camera.position.set(
      this.camTarget.x + this.camDir.x * d,
      this.camTarget.y + this.camDir.y * d,
      this.camTarget.z + this.camDir.z * d,
    );
    this.camera.lookAt(this.camTarget);
  }

  /** Clamp + store a new desired zoom distance. */
  private _setZoomTarget(dist: number): void {
    this.camDistTarget = Math.max(this.camDistMin, Math.min(this.camDistMax, dist));
  }

  /** Ease the current zoom toward its target; called once per render frame. */
  private _tickZoom(): void {
    const diff = this.camDistTarget - this.camDist;
    if (Math.abs(diff) < 0.01) {
      if (this.camDist !== this.camDistTarget) { this.camDist = this.camDistTarget; this._applyCamera(); }
      return;
    }
    this.camDist += diff * 0.18; // smooth approach
    this._applyCamera();
  }

  /** Mouse wheel = dolly zoom, centred on the field target. */
  private readonly _onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    // Scale the step with the current distance so zoom feels even across the
    // whole range; deltaY > 0 (scroll down / away) zooms OUT.
    const factor = Math.exp(e.deltaY * 0.0012);
    this._setZoomTarget(this.camDistTarget * factor);
  };

  /** +/- (and =/_) keys = step zoom in/out. */
  private readonly _onKeyZoom = (e: KeyboardEvent): void => {
    const k = e.key;
    if (k === '+' || k === '=' || k === 'Add') {
      this._setZoomTarget(this.camDistTarget * 0.88); // zoom IN
      e.preventDefault();
    } else if (k === '-' || k === '_' || k === 'Subtract') {
      this._setZoomTarget(this.camDistTarget / 0.88); // zoom OUT
      e.preventDefault();
    }
  };

  /** Strzałki + WASD — przesuwanie kamery po dużym polu. */
  private _setPanKey(code: string, down: boolean, e?: KeyboardEvent): void {
    if (e && isEditableTarget(e.target)) return;
    let handled = false;
    switch (code) {
      case 'ArrowLeft': case 'KeyA': this._camPanKeys.left = down; handled = true; break;
      case 'ArrowRight': case 'KeyD': this._camPanKeys.right = down; handled = true; break;
      case 'ArrowUp': case 'KeyW': this._camPanKeys.up = down; handled = true; break;
      case 'ArrowDown': case 'KeyS': this._camPanKeys.down = down; handled = true; break;
      default: break;
    }
    if (handled && e) e.preventDefault();
  }

  private readonly _onKeyPanDown = (e: KeyboardEvent): void => {
    this._setPanKey(e.code, true, e);
  };

  private readonly _onKeyPanUp = (e: KeyboardEvent): void => {
    this._setPanKey(e.code, false, e);
  };

  /** Ogranicza cel kamery do granic dużego pola (margines zależny od zoomu). */
  private _clampCamTarget(): void {
    const margin = Math.max(2, this.camDist * 0.28);
    const minX = margin;
    const maxX = (BF_COLS - 1) * TILE_S - margin;
    const minZ = margin;
    const maxZ = (BF_ROWS - 1) * TILE_S - margin;
    this.camTarget.x = Math.max(minX, Math.min(maxX, this.camTarget.x));
    this.camTarget.z = Math.max(minZ, Math.min(maxZ, this.camTarget.z));
  }

  /** Co klatkę: przesuń camTarget gdy trzymane strzałki / WASD. W/góra = -Z (North), S/dół = +Z (South). */
  private _tickCameraPanKeys(): void {
    const k = this._camPanKeys;
    let dx = 0;
    let dy = 0;
    if (k.left) dx += 1;
    if (k.right) dx -= 1;
    if (k.up) dy -= 1;
    if (k.down) dy += 1;
    if (dx === 0 && dy === 0) return;
    const h = Math.max(1, this.canvas.clientHeight);
    const worldPerPx = (this.camDist * 1.2) / h;
    const stepPx = 14;
    this.camTarget.x -= dx * worldPerPx * stepPx;
    this.camTarget.z += dy * worldPerPx * stepPx;
    this._clampCamTarget();
    this._applyCamera();
  }

  /**
   * "V" key cycles battle speed 1 -> 2 -> 4 -> 8 -> 16 -> 1
   * (S = przesuń mapę w dół, jak WASD — bez konfliktu).
   */
  private readonly _onKeySpeed = (e: KeyboardEvent): void => {
    if (e.code !== 'KeyV' && e.key !== 'v' && e.key !== 'V') return;
    if (this.deployPhase) return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this._cycleSpeed();
    this._flashSpeedHud();
  };

  /**
   * CHANGE2: the "H" key toggles ALL over-head stat bars (morale/ammo/HP)
   * visible <-> hidden (default visible) so the slim bars can be dropped when
   * they get in the way of reading the figures. Hides/shows each LIVING unit's
   * billboard bar GROUP; dead/removed units are skipped so their bars stay gone.
   * Child-mesh visibility (ammo only for ranged etc.) is preserved. Bound on
   * WINDOW so it works regardless of focus.
   */
  private readonly _onKeyToggleBars = (e: KeyboardEvent): void => {
    if (e.key !== 'h' && e.key !== 'H') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this.barsVisible = !this.barsVisible;
    for (const ru of [...this.atk, ...this.def]) {
      if (ru.dead || ru.removed) continue; // keep dead/fled units' bars hidden
      ru.hpBarGroup.visible = this.barsVisible;
    }
    this._settingsBarsToggle?.(this.barsVisible);
  };

  /** I — stan oddziałów (ten sam overlay co po bitwie na mapie). */
  private readonly _onKeyBattleStats = (e: KeyboardEvent): void => {
    if (e.key !== 'i' && e.key !== 'I') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this._toggleBattleStatsOverlay('live');
  };

  /**
   * "P" key (and the Pauza button) toggle a freeze of the battle: the virtual
   * clock stops advancing (see _advanceVClock), so moves/attacks/projectiles all
   * hold. Camera pan/zoom still work so the player can inspect the frozen field.
   */
  private readonly _onKeyPause = (e: KeyboardEvent): void => {
    if (e.key !== 'p' && e.key !== 'P') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this._togglePause();
  };

  private _togglePause(): void {
    this.paused = !this.paused;
    if (this.pauseHud) this.pauseHud.style.display = this.paused ? 'block' : 'none';
    if (this._topPauseBadge) this._topPauseBadge.style.display = this.paused ? 'inline' : 'none';
    this._syncTempoPanelHighlight();
  }

  // =========================================================================
  // PROCEDURAL AUDIO -- self-contained Web Audio SFX + ambient (no files).
  // Every method below is GUARDED so a missing/blocked AudioContext (headless,
  // SSR, jsdom, autoplay-blocked) NEVER throws -- failures silently no-op.
  // =========================================================================

  /** "M" key: toggle ALL battle audio (SFX + ambient) on/off. Default ON. */
  private readonly _onKeyMute = (e: KeyboardEvent): void => {
    if (e.key !== 'm' && e.key !== 'M') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this._ensureAudio();
    const next = !(this._sfxMuted && this._musicMuted);
    this._sfxMuted = next;
    this._musicMuted = next;
    this._audioMuted = next;
    if (!this._musicMuted) this._startAmbient();
    this._applyAudioGains();
    this._refreshAudioBtns();
  };

  private _toggleSfx(): void {
    this._ensureAudio();
    this._sfxMuted = !this._sfxMuted;
    this._audioMuted = this._sfxMuted && this._musicMuted;
    this._applyAudioGains();
    this._refreshAudioBtns();
  }

  private _toggleMusic(): void {
    this._ensureAudio();
    this._musicMuted = !this._musicMuted;
    this._audioMuted = this._sfxMuted && this._musicMuted;
    if (!this._musicMuted) this._startAmbient();
    this._applyAudioGains();
    this._refreshAudioBtns();
  }

  private _applyAudioGains(): void {
    try {
      if (this._masterGain) this._masterGain.gain.value = this._sfxMuted ? 0 : 0.25;
      if (this._ambGain)    this._ambGain.gain.value    = this._musicMuted ? 0 : this._ambBaseGain();
    } catch { /* no-op */ }
    if (this.muteHud) {
      this.muteHud.textContent = (this._sfxMuted && this._musicMuted)
        ? 'Dzwiek: WYL (M)' : 'Dzwiek: WL (M)';
    }
  }

  /** Muzyka/Efekty żyją w popupie zębatki (topRight, TW v5 §2) — synchronizuj przełączniki. */
  private _refreshAudioBtns(): void {
    this._settingsMusicToggle?.(!this._musicMuted);
    this._settingsSfxToggle?.(!this._sfxMuted);
  }

  /** Dostosuj dolna krawedz prawego paska (nad toolbarem deploy / recznym). */
  private _updateRightRailLayout(): void {
    this._syncRosterBottomInset();
  }

  /** First-gesture handler: lazily create+resume the AudioContext, start ambient. */
  private readonly _onAudioGesture = (): void => {
    this._ensureAudio();
    this._startAmbient();
  };

  /** Lazily create the single AudioContext + buses on the first user gesture. */
  private _ensureAudio(): void {
    if (this._ac || this._acTried) {
      // Already have one (or tried) -- just make sure it's resumed.
      try { if (this._ac && this._ac.state === 'suspended') void this._ac.resume(); } catch { /* no-op */ }
      return;
    }
    this._acTried = true;
    try {
      const Ctor = (typeof AudioContext !== 'undefined')
        ? AudioContext
        : (typeof window !== 'undefined' ? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined);
      if (!Ctor) return; // headless / no Web Audio -> silent
      const ac = new Ctor();
      const master = ac.createGain();
      master.gain.value = this._sfxMuted ? 0 : 0.25; // LOW SFX bus
      master.connect(ac.destination);
      const amb = ac.createGain();
      amb.gain.value = this._musicMuted ? 0 : this._ambBaseGain();
      amb.connect(ac.destination);
      this._ac = ac; this._masterGain = master; this._ambGain = amb;
      try { if (ac.state === 'suspended') void ac.resume(); } catch { /* no-op */ }
    } catch { this._ac = null; /* blocked -> silent */ }
  }

  /** Ambient bus base gain (very light); faint epoch flavour via terrain hint. */
  private _ambBaseGain(): number { return 0.05; }

  /** A small noise buffer (cached) for percussive/whoosh SFX. */
  private _noiseBuf(ac: AudioContext): AudioBuffer {
    if (this._cachedNoise && this._cachedNoise.sampleRate === ac.sampleRate) return this._cachedNoise;
    const len = Math.floor(ac.sampleRate * 0.4);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._cachedNoise = buf;
    return buf;
  }
  private _cachedNoise: AudioBuffer | null = null;

  /** True if SFX should be skipped right now (muted / no context). */
  private _sfxOff(): boolean { return this._sfxMuted || !this._ac || !this._masterGain; }

  /**
   * MELEE clash: short filtered-noise clack with a quick metallic decay and a
   * little pitch variation. Throttled (min ~40ms gap) and thinned at high speed.
   */
  private _sfxMelee(): void {
    if (this._sfxOff()) return;
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (now - this._lastHitAt < 40) return;                 // per-frame cap
    if (this.speedMul >= 16 && Math.random() > 0.18) return; // thin the wall of sound
    this._lastHitAt = now;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      // Bright metallic ring: 3 inharmonic partials, each slightly detuned per hit.
      const partials = [2100, 3100, 4500];
      partials.forEach((base, i) => {
        const f = base * (1 + (Math.random() * 2 - 1) * 0.08);
        const osc = ac.createOscillator();
        osc.type = (i === 0) ? 'triangle' : 'sine';
        osc.frequency.value = f;
        const decay = 0.18 + Math.random() * 0.12;          // 0.18..0.30s ring tail
        const peak = (i === 0 ? 0.20 : 0.12) / (1 + i * 0.2); // higher partials quieter
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.003); // fast attack
        g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        osc.connect(g).connect(this._masterGain!);
        osc.start(t); osc.stop(t + decay + 0.02);
      });
      // Short bright noise transient = the metallic "clash" onset.
      const src = ac.createBufferSource(); src.buffer = this._noiseBuf(ac);
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      src.connect(hp).connect(ng).connect(this._masterGain!);
      src.start(t); src.stop(t + 0.04);
    } catch { /* no-op */ }
  }

  /** RANGED shot: short descending noise "whoosh"/twang on firing. */
  private _sfxShot(): void {
    if (this._sfxOff()) return;
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (now - this._lastShotAt < 50) return;
    if (this.speedMul >= 16 && Math.random() > 0.25) return;
    this._lastShotAt = now;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      const dur = 0.18 + Math.random() * 0.04;               // 0.18..0.22s
      // Pitched whistle sweeping down: świst of an arrow/javelin in flight.
      const osc = ac.createOscillator(); osc.type = 'sine';
      const f0 = 1900 * (1 + (Math.random() * 2 - 1) * 0.07);
      const f1 = 650  * (1 + (Math.random() * 2 - 1) * 0.07);
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const og = ac.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(0.30, t + 0.02);   // soft attack
      og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(og).connect(this._masterGain!);
      osc.start(t); osc.stop(t + dur + 0.02);
      // Airy noise layer = the "air"/whoosh, high bandpass at low gain.
      const src = ac.createBufferSource(); src.buffer = this._noiseBuf(ac);
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
      bp.frequency.setValueAtTime(2300, t);
      bp.frequency.exponentialRampToValueAtTime(1500, t + dur);
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.14, t + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(bp).connect(ng).connect(this._masterGain!);
      src.start(t); src.stop(t + dur + 0.02);
    } catch { /* no-op */ }
  }

  /** DEATH: short dull thud (low sine drop + tiny noise body). */
  private _sfxDeath(): void {
    if (this._sfxOff()) return;
    if (this.speedMul >= 16 && Math.random() > 0.3) return;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      const osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(150 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.18);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.8, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(g).connect(this._masterGain!);
      osc.start(t); osc.stop(t + 0.24);
    } catch { /* no-op */ }
  }

  /** ROUT: brief low falling horn tone when a unit breaks. */
  private _sfxRout(): void {
    if (this._sfxOff()) return;
    if (this.speedMul >= 16 && Math.random() > 0.4) return;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      const osc = ac.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.45); // falling
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.45, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(lp).connect(g).connect(this._masterGain!);
      osc.start(t); osc.stop(t + 0.52);
    } catch { /* no-op */ }
  }

  /** VICTORY: short rising 3-note fanfare when the battle ends. */
  private _sfxVictory(): void {
    if (this._sfxOff()) return;
    try {
      const ac = this._ac!; const t0 = ac.currentTime;
      const notes = [392, 523, 659]; // G4, C5, E5 -- rising
      notes.forEach((f, i) => {
        const t = t0 + i * 0.13;
        const osc = ac.createOscillator(); osc.type = 'triangle'; osc.frequency.value = f;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.connect(g).connect(this._masterGain!);
        osc.start(t); osc.stop(t + 0.3);
      });
    } catch { /* no-op */ }
  }

  /**
   * AMBIENT bed: a slow low drone + a soft periodic low drum, very low volume.
   * Faint EPOCH flavour from the terrain string (this.terrain) shifts the drone
   * pitch + drum interval a touch. Starts once (after the audio gesture).
   */
  private _startAmbient(): void {
    if (this._audioStarted) return;
    if (!this._ac || !this._ambGain) return;
    this._audioStarted = true;
    try {
      const ac = this._ac; const amb = this._ambGain;
      // Faint epoch/terrain flavour: pick scale root (MIDI) + tempo from terrain.
      // CALM scales (major pentatonic flavours) so swells + melody never grate.
      const ter = (this.terrain || '').toLowerCase();
      let rootMidi = 45;       // A2 (neutral, calm)
      let chordMs  = 6200;     // ~6.2s between pad swells
      let melodyMs = 2500;     // ~2.5s between melody notes
      // pentatonic (major-ish) intervals for the soft melody
      let pentaSteps = [0, 2, 4, 7, 9, 12, 14];
      // chord = root + minor third + fifth (soft, slightly wistful but calm)
      let chordSteps = [0, 3, 7];
      if (/(las|forest|bagno|swamp)/.test(ter))            { rootMidi = 43; chordMs = 7000; melodyMs = 2800; pentaSteps = [0, 2, 5, 7, 9, 12, 14]; chordSteps = [0, 4, 7]; } // mellow, slower
      else if (/(gor|hill|wzg|mount)/.test(ter))           { rootMidi = 48; chordMs = 5500; melodyMs = 2200; pentaSteps = [0, 2, 4, 7, 9, 12, 16]; chordSteps = [0, 4, 7]; } // brighter, airier
      else if (/(pust|desert|step|plain|rownin)/.test(ter)) { rootMidi = 46; chordMs = 6500; melodyMs = 2600; pentaSteps = [0, 2, 4, 7, 11, 12, 14]; chordSteps = [0, 7, 12]; } // open, sparse
      const midiToHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

      // Subtle feedback DELAY for an airy/echo bed (melody routes through this).
      const delay = ac.createDelay(1.0); delay.delayTime.value = 0.38;
      const fb = ac.createGain(); fb.gain.value = 0.25;
      const wet = ac.createGain(); wet.gain.value = 0.18; // low wet
      delay.connect(fb); fb.connect(delay);
      delay.connect(wet); wet.connect(amb);
      this._ambNodes.push({ stop: () => { try { delay.disconnect(); fb.disconnect(); wet.disconnect(); } catch { /* */ } } });

      // ---- PAD via SWELLS: soft chord that fades in/out, overlapping into an
      //      evolving pad. NEVER a continuous held drone (that was the buzz).
      const playChord = (): void => {
        if (this._musicMuted || !this._ac || !this._ambGain) return;
        try {
          const a = this._ac; const t = a.currentTime;
          const atk = 1.5; const rel = 3.5;
          const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820;
          const g = a.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.10, t + atk);          // slow swell in
          g.gain.exponentialRampToValueAtTime(0.0001, t + atk + rel);  // long fade out
          lp.connect(g).connect(this._ambGain);
          const oscs: OscillatorNode[] = [];
          chordSteps.forEach((semis, i) => {
            const o = a.createOscillator();
            o.type = 'sine';
            o.frequency.value = midiToHz(rootMidi - 12 + semis); // an octave below root
            o.detune.value = (i - 1) * 4;                        // gentle spread
            o.connect(lp); o.start(t); o.stop(t + atk + rel + 0.1);
            oscs.push(o);
          });
          this._ambNodes.push({ stop: () => { try { oscs.forEach(o => o.stop()); } catch { /* */ } } });
        } catch { /* no-op */ }
      };

      // ---- MELODY: one soft pentatonic note, sparse, through delay (airy echo).
      let mStep = 0;
      const playNote = (): void => {
        if (this._musicMuted || !this._ac || !this._ambGain) return;
        try {
          const a = this._ac; const t = a.currentTime;
          // wander the pentatonic scale gently (random-ish but calm)
          mStep += (Math.random() < 0.5 ? 1 : -1) + pentaSteps.length;
          const semis = pentaSteps[mStep % pentaSteps.length] ?? 0;
          const hz = midiToHz(rootMidi + 12 + semis); // melody an octave up, soft
          const osc = a.createOscillator();
          osc.type = (Math.random() < 0.5) ? 'sine' : 'triangle';
          osc.frequency.value = hz;
          const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
          const g = a.createGain();
          const atk = 0.08; const rel = 1.4;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.06, t + atk);  // low gain, gentle attack
          g.gain.exponentialRampToValueAtTime(0.0001, t + atk + rel);
          osc.connect(lp); lp.connect(g);
          g.connect(this._ambGain);  // dry
          g.connect(delay);          // wet echo
          osc.start(t); osc.stop(t + atk + rel + 0.05);
        } catch { /* no-op */ }
      };

      playChord();
      const chordTimer = setInterval(playChord, chordMs);
      const melTimer   = setInterval(playNote, melodyMs);
      this._ambDrumTimer = melTimer;            // keep legacy field pointing at a live timer
      this._ambTimers.push(chordTimer, melTimer);
    } catch { /* no-op */ }
  }

  /** Stop ambient, disconnect buses, close the context. Called from dispose(). */
  private _teardownAudio(): void {
    try {
      if (this._ambDrumTimer !== null) { clearInterval(this._ambDrumTimer); this._ambDrumTimer = null; }
      for (const tm of this._ambTimers) { try { clearInterval(tm); } catch { /* */ } }
      this._ambTimers = [];
      for (const n of this._ambNodes) { try { n.stop?.(); } catch { /* */ } }
      this._ambNodes = [];
      try { this._ambGain?.disconnect(); } catch { /* */ }
      try { this._masterGain?.disconnect(); } catch { /* */ }
      const ac = this._ac;
      this._ac = null; this._masterGain = null; this._ambGain = null;
      this._audioStarted = false;
      if (ac) { try { void ac.close(); } catch { /* */ } }
    } catch { /* no-op */ }
  }

  /**
   * CHANGE1: briefly highlight the on-map speed indicator to confirm a speed
   * change (a short colour/scale pop that eases back). Scheduled on the WALL
   * clock (setTimeout) so the confirm reads the same at any battle speed.
   */
  private _flashSpeedHud(): void {
    const hud = this.speedHud;
    if (!hud) return;
    hud.style.transition = 'transform 90ms ease-out, background 90ms ease-out';
    hud.style.transform  = 'scale(1.18)';
    hud.style.background  = 'rgba(40,90,40,0.95)';
    setTimeout(() => {
      if (!this.speedHud) return;
      this.speedHud.style.transform  = 'scale(1.0)';
      this.speedHud.style.background = 'rgba(20,30,20,0.72)';
    }, 160);
  }

  // -------------------------------------------------------------------------
  // C2-Q7 TW: kursor kontekstowy, linie rozkazow, scalanie rannych
  // -------------------------------------------------------------------------

  private _isManualInputActive(): boolean {
    return (
      this.deployPhase
      || (this.started && !this.finished && (this._manualMode || this._battleAwaitingOrders))
    );
  }

  private _primarySelectedUnit(): RuntimeBattleUnit | null {
    for (const id of this._selectedUnits) {
      const u = this._findPlayerUnit(id);
      if (u && !u.dead && !u.removed && !u.routed) return u;
    }
    return null;
  }

  private _unitCanRangedAttack(ru: RuntimeBattleUnit, target: RuntimeBattleUnit): boolean {
    if (!ru.shootingEnabled && ru.rangedBase) return false;
    if (!(ru.rangedBase || ru.primaryRanged)) return false;
    const dist = Math.abs(ru.q - target.q) + Math.abs(ru.r - target.r);
    const rng = Math.max(2, Number((ru.bu.stats as any)?.['Zasieg ataku (hex)'] ?? 2));
    return dist <= rng && dist > 1;
  }

  /**
   * Kafel pod kursorem — relief-aware (tileTopY), wspólny dla hover obrysu,
   * deploy/move i fallbacku zaznaczenia jednostki.
   */
  private _pickGroundTile(cx: number, cy: number): { col: number; row: number } | null {
    const raycaster = this._raycastFromCanvas(cx, cy);
    if (!raycaster) return null;
    const tm = this.terrainMap;
    const fromMeshes = pickBattleGroundTileFromMeshes(
      raycaster, tm, this._battleGroundPickMeshes,
    );
    const fromPlane = pickBattleGroundTilePlane(raycaster, tm);
    if (fromMeshes && fromPlane) {
      if (fromMeshes.col === fromPlane.col && fromMeshes.row === fromPlane.row) return fromMeshes;
      const meshY = tileTopY(tm, fromMeshes.col, fromMeshes.row);
      const planeY = tileTopY(tm, fromPlane.col, fromPlane.row);
      if (meshY > planeY) return fromMeshes;
      if (planeY > meshY) return fromPlane;
      return fromMeshes;
    }
    return fromMeshes ?? fromPlane;
  }

  private _worldAtTile(col: number, row: number): THREE.Vector3 {
    const w = cellToWorld(col, row);
    const y = tileTopY(this.terrainMap, col, row) + ORDER_LINE_Y;
    return new THREE.Vector3(w.x, y, w.z);
  }

  private _unitWorldPos(ru: RuntimeBattleUnit): THREE.Vector3 {
    const p = ru.group.position.clone();
    p.y = tileTopY(this.terrainMap, ru.q, ru.r) + ORDER_LINE_Y;
    return p;
  }

  private _disposeOrderArrowGroup(arrow: THREE.Group): void {
    arrow.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach(x => x.dispose());
        else m?.dispose();
      }
    });
  }

  /** Gruba strzalka na ziemi (30% niebieski = ruch, czerwony = atak). */
  private _makeOrderArrow(from: THREE.Vector3, to: THREE.Vector3, isAttack: boolean, preview = false): THREE.Group {
    const g = new THREE.Group();
    g.name = preview ? 'orderArrowPreview' : 'orderArrow';
    const dir = new THREE.Vector3(to.x - from.x, 0, to.z - from.z);
    const len = dir.length();
    if (len < 0.08) return g;

    const color = isAttack ? ORDER_COLOR_ATTACK : ORDER_COLOR_MOVE;
    const opacity = preview
      ? (isAttack ? 0.38 : 0.38)
      : (isAttack ? ORDER_ATTACK_OPACITY : ORDER_MOVE_OPACITY);
    const angle = Math.atan2(dir.x, dir.z);
    const headLen = Math.min(0.48, len * 0.24);
    const shaftLen = Math.max(0.06, len - headLen * 0.75);
    const y = from.y;

    const shaftGeo = new THREE.BoxGeometry(0.34, 0.05, shaftLen);
    const shaftMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, depthWrite: false,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    const mid = new THREE.Vector3(
      (from.x + to.x) * 0.5,
      y,
      (from.z + to.z) * 0.5,
    );
    shaft.position.copy(mid);
    shaft.rotation.y = angle;
    g.add(shaft);

    const coneGeo = new THREE.ConeGeometry(0.26, headLen, 12);
    coneGeo.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: Math.min(0.55, opacity + 0.12), depthWrite: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    const tip = new THREE.Vector3(from.x, y, from.z).add(dir.normalize().multiplyScalar(len));
    cone.position.copy(tip);
    cone.rotation.y = angle;
    g.add(cone);

    return g;
  }

  private _clearOrderPreview(): void {
    if (!this._orderPreviewGroup) return;
    while (this._orderPreviewGroup.children.length > 0) {
      const ch = this._orderPreviewGroup.children[0] as THREE.Group;
      this._orderPreviewGroup.remove(ch);
      this._disposeOrderArrowGroup(ch);
    }
  }

  private _disposeQueuedOrderArrows(): void {
    if (!this._orderLinesGroup) return;
    for (const arrow of this._queuedOrderArrows) {
      this._orderLinesGroup.remove(arrow);
      this._disposeOrderArrowGroup(arrow);
    }
    this._queuedOrderArrows = [];
  }

  private _disposeAllOrderLines(): void {
    this._clearOrderPreview();
    this._disposeQueuedOrderArrows();
  }

  /** Docelowe pole ruchu dla jednostki (z offsetem formacji grupy). */
  private _moveTargetForUnit(u: RuntimeBattleUnit, col: number, row: number): { col: number; row: number } {
    const off = u.formationOffset ?? { dc: 0, dr: 0 };
    return {
      col: Math.max(0, Math.min(BF_COLS - 1, col + off.dc)),
      row: Math.max(0, Math.min(BF_ROWS - 1, row + off.dr)),
    };
  }

  /** Docelowe pola ruchu dla biezacego zaznaczenia (grupy + wielokrotne bez grupy). */
  private _moveDestinationsForSelection(
    targetCol: number, targetRow: number,
  ): Map<string, { col: number; row: number }> {
    const out = new Map<string, { col: number; row: number }>();
    const ids = this._collectOrderUnitIds();
    const units = ids
      .map(id => this._findPlayerUnit(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    const processedGroups = new Set<string>();
    const ungrouped: RuntimeBattleUnit[] = [];
    for (const u of units) {
      if (u.groupId) {
        if (processedGroups.has(u.groupId)) continue;
        processedGroups.add(u.groupId);
        for (const mid of this._liveGroupMemberIds(u.groupId)) {
          const mu = this._findPlayerUnit(mid);
          if (!mu || mu.dead) continue;
          out.set(mid, this._moveTargetForUnit(mu, targetCol, targetRow));
        }
      } else {
        ungrouped.push(u);
      }
    }
    if (ungrouped.length === 1) {
      out.set(ungrouped[0]!.bu.id, { col: targetCol, row: targetRow });
    } else if (ungrouped.length > 1) {
      const centCol = ungrouped.reduce((s, u) => s + u.q, 0) / ungrouped.length;
      const centRow = ungrouped.reduce((s, u) => s + u.r, 0) / ungrouped.length;
      for (const u of ungrouped) {
        const dc = Math.round(u.q - centCol);
        const dr = Math.round(u.r - centRow);
        out.set(u.bu.id, {
          col: Math.max(0, Math.min(BF_COLS - 1, Math.round(targetCol + dc))),
          row: Math.max(0, Math.min(BF_ROWS - 1, Math.round(targetRow + dr))),
        });
      }
    }
    return out;
  }

  /** Marsz wielu jednostek — grupy z offsetem formacji, reszta z zachowaniem wzglednego ukladu. */
  private _orderMoveForUnits(targetCol: number, targetRow: number, unitIds: string[]): void {
    const units = unitIds
      .map(id => this._findPlayerUnit(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    const processedGroups = new Set<string>();
    const ungrouped: RuntimeBattleUnit[] = [];
    for (const u of units) {
      if (u.groupId) {
        if (!processedGroups.has(u.groupId)) {
          processedGroups.add(u.groupId);
          this._orderGroupMove(u.groupId, targetCol, targetRow);
        }
      } else {
        ungrouped.push(u);
      }
    }
    if (ungrouped.length === 1) {
      ungrouped[0]!.playerOrder = { type: 'move', col: targetCol, row: targetRow };
    } else if (ungrouped.length > 1) {
      const dests = this._moveDestinationsForSelection(targetCol, targetRow);
      for (const u of ungrouped) {
        const d = dests.get(u.bu.id);
        if (d) u.playerOrder = { type: 'move', col: d.col, row: d.row };
      }
    }
  }

  /** Odswieza niebieskie/czerwone strzalki aktywnych celow (trwale do dotarcia). */
  private _refreshQueuedOrderVisuals(): void {
    this._disposeQueuedOrderArrows();
    if (!this._orderLinesGroup || !this.started || this.finished) return;
    for (const ru of this._playerRoster()) {
      if (ru.dead || ru.removed || ru.routed) continue;
      const ord = ru.playerOrder;
      const queued = this._queuedOrderUnitIds.has(ru.bu.id);
      if (ord.type === 'move') {
        const to = this._worldAtTile(ord.col, ord.row);
        const arrow = this._makeOrderArrow(this._unitWorldPos(ru), to, false, queued);
        this._orderLinesGroup.add(arrow);
        this._queuedOrderArrows.push(arrow);
      } else if (ord.type === 'attack') {
        const tgt = this._enemyRoster().find(d => d.bu.id === ord.targetId && !d.dead && !d.removed);
        if (tgt) {
          const arrow = this._makeOrderArrow(this._unitWorldPos(ru), this._unitWorldPos(tgt), true, queued);
          this._orderLinesGroup.add(arrow);
          this._queuedOrderArrows.push(arrow);
        }
      }
    }
  }

  private _addOrderPreviewArrow(from: THREE.Vector3, to: THREE.Vector3, isAttack: boolean): void {
    if (!this._orderPreviewGroup) return;
    const arrow = this._makeOrderArrow(from, to, isAttack, true);
    this._orderPreviewGroup.add(arrow);
  }

  private _updateBattleCursor(cx: number, cy: number): void {
    if (!this._isManualInputActive() || this._selectedUnits.size === 0) {
      this.canvas.style.cursor = CURSOR_DEFAULT;
      return;
    }
    const sel = this._primarySelectedUnit();
    if (!sel) {
      this.canvas.style.cursor = CURSOR_DEFAULT;
      return;
    }
    const enemySide = this._playerControlSide() === 'atk' ? 'def' : 'atk';
    const hoverUnit = this._pickUnitAtScreen(cx, cy);
    if (hoverUnit && hoverUnit.side === enemySide && !hoverUnit.dead && !hoverUnit.removed) {
      this.canvas.style.cursor = this._unitCanRangedAttack(sel, hoverUnit) ? CURSOR_BOW : CURSOR_SWORD;
      return;
    }
    const tile = this._pickGroundTile(cx, cy);
    if (tile) {
      const occ = this.occByKey.get(cellKey(tile.col, tile.row));
      const enemySide = this._playerControlSide() === 'atk' ? 'def' : 'atk';
      if (occ && occ.side === enemySide && !occ.dead) {
        this.canvas.style.cursor = this._unitCanRangedAttack(sel, occ) ? CURSOR_BOW : CURSOR_SWORD;
        return;
      }
    }
    this.canvas.style.cursor = CURSOR_MOVE;
  }

  private _updateOrderPreview(cx: number, cy: number): void {
    if (this.deployPhase) {
      this._clearOrderPreview();
      if (!this._deployDrag) this._updateDeployPlacementPreview(cx, cy);
      return;
    }
    this._clearOrderPreview();
    if (!this._isManualInputActive() || this._selectedUnits.size === 0) {
      this._clearDeployGhosts();
      return;
    }

    const hoverUnit = this._pickUnitAtScreen(cx, cy);
    const tile = this._pickGroundTile(cx, cy);
    const enemySide = this._playerControlSide() === 'atk' ? 'def' : 'atk';

    if (hoverUnit && hoverUnit.side === enemySide && !hoverUnit.dead && !hoverUnit.removed) {
      for (const id of this._selectedUnits) {
        const u = this._findPlayerUnit(id);
        if (!u || u.dead || u.removed || u.routed) continue;
        this._addOrderPreviewArrow(this._unitWorldPos(u), this._unitWorldPos(hoverUnit), true);
      }
      return;
    }

    if (!tile) {
      this._clearDeployGhosts();
      return;
    }

    const occ = this.occByKey.get(cellKey(tile.col, tile.row));
    if (occ && occ.side === enemySide && !occ.dead) {
      this._clearDeployGhosts();
      for (const id of this._selectedUnits) {
        const u = this._findPlayerUnit(id);
        if (!u || u.dead || u.removed || u.routed) continue;
        this._addOrderPreviewArrow(this._unitWorldPos(u), this._unitWorldPos(occ), true);
      }
      return;
    }

    const issuedGroups = new Set<string>();
    const destMap = this._moveDestinationsForSelection(tile.col, tile.row);
    for (const id of this._selectedUnits) {
      const u = this._findPlayerUnit(id);
      if (!u || u.dead || u.removed || u.routed) continue;
      if (u.groupId) {
        if (issuedGroups.has(u.groupId)) continue;
        issuedGroups.add(u.groupId);
        for (const mid of this._liveGroupMemberIds(u.groupId)) {
          const mu = this._findPlayerUnit(mid);
          if (!mu || mu.dead || mu.removed) continue;
          const dest = destMap.get(mid) ?? this._moveTargetForUnit(mu, tile.col, tile.row);
          this._addOrderPreviewArrow(
            this._unitWorldPos(mu),
            this._worldAtTile(dest.col, dest.row),
            false,
          );
        }
      } else {
        const dest = destMap.get(id) ?? { col: tile.col, row: tile.row };
        this._addOrderPreviewArrow(
          this._unitWorldPos(u),
          this._worldAtTile(dest.col, dest.row),
          false,
        );
      }
    }
    this._refreshBattleMoveGhosts(tile.col, tile.row);
  }

  private _unitsMergeCompatible(a: RuntimeBattleUnit, b: RuntimeBattleUnit): boolean {
    if (a.bu.id === b.bu.id) return false;
    if (a.dead || b.dead || a.removed || b.removed || a.routed || b.routed) return false;
    const sameType =
      a.bu.nazwa === b.bu.nazwa ||
      String(a.bu.kategoria ?? '').toLowerCase() === String(b.bu.kategoria ?? '').toLowerCase();
    if (!sameType) return false;
    const wounded = a.bu.hp < a.bu.maxHp || b.bu.hp < b.bu.maxHp;
    return wounded;
  }

  private _tryMergeWounded(sourceId: string, targetId: string): boolean {
    const a = this._findPlayerUnit(sourceId);
    const b = this._findPlayerUnit(targetId);
    if (!a || !b) return false;
    if (!this._unitsMergeCompatible(a, b)) {
      this._showOrderFeedback('Scalanie: ten sam typ + co najmniej jedna ranna');
      return false;
    }
    let target = a;
    let source = b;
    if (b.bu.hp > a.bu.hp) {
      target = b;
      source = a;
    }
    const room = Math.max(0, target.bu.maxHp - target.bu.hp);
    if (room <= 0) {
      this._showOrderFeedback('Scalanie: docelowa jednostka pelna HP');
      return false;
    }
    const transfer = Math.min(room, Math.max(0, source.bu.hp));
    if (transfer <= 0) {
      this._showOrderFeedback('Scalanie: brak HP do przeniesienia');
      return false;
    }
    target.bu.hp += transfer;
    source.bu.hp -= transfer;
    if (source.groupId) this._disbandGroup(source.groupId);
    if (target.groupId) this._disbandGroup(target.groupId);
    this._selectedUnits.delete(source.bu.id);
    this._removeSelectionRing(source);
    if (source.bu.hp <= 0 || source.bu.hp < source.bu.maxHp * 0.01) {
      this._removeUnitFromScene(source);
      const card = this._unitCards.get(source.bu.id);
      if (card?.parentNode) card.parentNode.removeChild(card);
      this._unitCards.delete(source.bu.id);
    }
    this._selectedUnits.add(target.bu.id);
    this._addSelectionRing(target);
    this._updateRosterBar();
    this._updateSelectedPanel();
    this._showOrderFeedback('SCALONO: +' + transfer + ' HP -> ' + target.bu.nazwa);
    return true;
  }

  private _mergeSelectedWounded(): void {
    const ids = [...this._selectedUnits].filter(id => {
      const u = this._findPlayerUnit(id);
      return u && !u.dead && !u.removed && !u.routed;
    });
    if (ids.length !== 2) {
      this._showOrderFeedback('Scalanie (Ctrl+M): zaznacz 2 jednostki tego samego typu');
      return;
    }
    this._tryMergeWounded(ids[0]!, ids[1]!);
  }

  private readonly _onKeyMergeWounded = (e: KeyboardEvent): void => {
    if (e.key.toLowerCase() !== 'm' || !(e.ctrlKey || e.metaKey)) return;
    if (isEditableTarget(e.target)) return;
    if (!this._isManualInputActive()) return;
    e.preventDefault();
    this._mergeSelectedWounded();
  };

  private _attachRosterMergeDrag(card: HTMLDivElement, ru: RuntimeBattleUnit): void {
    card.addEventListener('pointerdown', (e: PointerEvent) => {
      if (ru.dead || ru.removed || ru.routed) return;
      if (e.button !== 0) return;
      this._rosterDragSourceId = ru.bu.id;
    });
    card.addEventListener('pointerup', (e: PointerEvent) => {
      if (!this._rosterDragSourceId || this._rosterDragSourceId === ru.bu.id) {
        this._rosterDragSourceId = null;
        return;
      }
      e.preventDefault();
      this._tryMergeWounded(this._rosterDragSourceId, ru.bu.id);
      this._rosterDragSourceId = null;
    });
    card.addEventListener('pointerleave', () => {
      // zostaw source do pointerup na innej karcie
    });
  };

  // -------------------------------------------------------------------------
  // Q2 — MINIMAPA + Q3 — HOVER TOOLTIP
  // -------------------------------------------------------------------------

  /** Q2: build minimap canvas overlay (bottom-left, above roster). */
  /**
   * TW v5 §3: panel "Tempo + minimapa" (jeden panel, prawy dół wg makiety —
   * u nas obok rosteru, patrz _syncMinimapPosition). Rząd Tempo (pauza/−/+
   * + AUTO-komputer) NAD minimapą, w tym samym panelu ~70%+blur. Podłączony
   * do ISTNIEJĄCYCH handlerów pauzy/prędkości/AUTO (_togglePause/_setSpeedIdx/
   * _toggleManualMode) — usunięte z prawego raila (patrz makeRailBtn), rail
   * zostaje krótszy (R/M/MUZ/H/Statystyki/Pomiń/Wycofaj — F2/F3 przeniosą resztę).
   */
  private _buildMinimapOverlay(): void {
    const TEMPO_ROW_H = 42;
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      // Zadanie #17: prawy dolny rog — patrz _syncMinimapPosition (wywolane
      // ponizej), te left/bottom sa tylko fallbackiem przed pierwszym sync.
      position: 'absolute', right: '16px', bottom: '16px',
      width: TEMPO_PANEL_W + 'px', height: (TEMPO_ROW_H + MINIMAP_H) + 'px',
      zIndex: '10008', display: 'flex', flexDirection: 'column',
    });
    applyTempoMinimapOuterPanel1E(wrap);
    this.overlay.appendChild(wrap);
    this._minimapWrap = wrap;

    // --- Nagłówek deploy (BEZ tempa — start dopiero po rozstawieniu, makieta §3) ---
    const deployHeaderRow = document.createElement('div');
    Object.assign(deployHeaderRow.style, {
      display: 'none', alignItems: 'center', gap: '6px',
      padding: '8px 12px', borderBottom: '1px solid rgba(232,216,138,0.2)', flexShrink: '0',
    });
    const deployHeaderLbl = document.createElement('span');
    Object.assign(deployHeaderLbl.style, {
      font: '700 9px ' + BATTLE_FONT, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: BATTLE_TEXT_DIM,
    });
    deployHeaderLbl.textContent = 'Minimapa · rozstawianie';
    deployHeaderRow.appendChild(deployHeaderLbl);
    wrap.appendChild(deployHeaderRow);
    this._minimapDeployHeaderRow = deployHeaderRow;

    // --- Rząd Tempo: pauza + −/+ + AUTO-komputer (TYLKO w walce) ---
    const tempoRow = document.createElement('div');
    applyTempoRow1E(tempoRow);
    const tempoLbl = document.createElement('span');
    Object.assign(tempoLbl.style, {
      font: '700 9px ' + BATTLE_FONT, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: BATTLE_TEXT_DIM, marginRight: '2px', flexShrink: '0',
    });
    tempoLbl.textContent = 'Tempo';
    tempoRow.appendChild(tempoLbl);

    const mkTempoBtn = (svg: string, title: string, onClick: () => void): HTMLButtonElement => {
      const b = document.createElement('button');
      applyTempoBtn1E(b);
      b.title = title;
      b.innerHTML = svg;
      b.onclick = onClick;
      tempoRow.appendChild(b);
      return b;
    };
    this._tempoPauseBtn = mkTempoBtn(TEMPO_SVG.pause, 'Pauza / Wznów (P)', () => { this._togglePause(); this._syncTempoPanelHighlight(); });
    // ± po pelnej drabinie SPEED_STEPS (clamp, bez zawijania); V nadal cyklicznie.
    this._tempoMinusBtn = mkTempoBtn(TEMPO_SVG.minus, 'Zwolnij', () => { this._adjustSpeedIdx(-1); });
    this._tempoPlusBtn = mkTempoBtn(TEMPO_SVG.plus, 'Przyspiesz', () => { this._adjustSpeedIdx(1); });
    const tempoSpacer = document.createElement('span');
    tempoSpacer.style.flex = '1';
    tempoRow.appendChild(tempoSpacer);
    this._tempoAutoBtn = mkTempoBtn(TEMPO_SVG.computer, 'AUTO-rozegranie bitwy (R)', () => { this._toggleManualMode(); });
    wrap.appendChild(tempoRow);
    this._tempoRow = tempoRow;
    this._syncTempoPanelHighlight();
    this._syncMinimapPhaseChrome();

    // --- Minimapa (canvasBox — ramka #6a5212 wg tokenow, bez zmian wobec v4) ---
    const canvasBox = document.createElement('div');
    Object.assign(canvasBox.style, {
      position: 'relative', flex: '1', cursor: 'crosshair', borderTop: 'none',
    });
    applyMinimap1E(canvasBox);
    canvasBox.style.borderTop = 'none';
    canvasBox.style.borderRadius = '0';
    const canvas = document.createElement('canvas');
    canvas.width = MINIMAP_W;
    canvas.height = MINIMAP_H;
    Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
    canvasBox.appendChild(canvas);
    wrap.appendChild(canvasBox);
    this._minimapCanvas = canvas;

    canvasBox.addEventListener('pointerdown', (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this._minimapDragging = true;
      this._minimapDragStart = {
        x: e.clientX, y: e.clientY,
        camX: this.camTarget.x, camZ: this.camTarget.z,
      };
      canvasBox.setPointerCapture(e.pointerId);
    });
    canvasBox.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this._minimapDragging || !this._minimapDragStart) return;
      const dx = e.clientX - this._minimapDragStart.x;
      const dy = e.clientY - this._minimapDragStart.y;
      const worldW = BF_COLS * TILE_S;
      const worldH = BF_ROWS * TILE_S;
      const rectW = canvas.clientWidth || MINIMAP_W;
      const rectH = canvas.clientHeight || MINIMAP_H;
      this.camTarget.x = this._minimapDragStart.camX - (dx / rectW) * worldW;
      this.camTarget.z = this._minimapDragStart.camZ - (dy / rectH) * worldH;
      this._applyCamera();
    });
    canvasBox.addEventListener('pointerup', (e: PointerEvent) => {
      if (!this._minimapDragStart) return;
      const dx = e.clientX - this._minimapDragStart.x;
      const dy = e.clientY - this._minimapDragStart.y;
      if (dx * dx + dy * dy < 36) {
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const data = this._collectMinimapData();
        const tile = minimapPixelToTile(px, py, data, canvas.clientWidth || MINIMAP_W, canvas.clientHeight || MINIMAP_H);
        if (tile) {
          const w = cellToWorld(tile.col, tile.row);
          this.camTarget.x = w.x;
          this.camTarget.z = w.z;
          this._applyCamera();
        }
      }
      this._minimapDragging = false;
      this._minimapDragStart = null;
      try { canvasBox.releasePointerCapture(e.pointerId); } catch { /* no-op */ }
    });
    this._drawMinimap();
    this._syncMinimapPosition();
  }

  /** Podswietla pauze/AUTO i odswieza tooltips ± w panelu Tempo (przy minimapie). */
  private _syncTempoPanelHighlight(): void {
    const maxIdx = BattleScene.SPEED_STEPS.length - 1;
    const speedTag = '×' + this.speedMul;
    if (this._tempoPauseBtn) {
      applyTempoBtn1E(this._tempoPauseBtn, { active: this.paused });
      this._tempoPauseBtn.style.opacity = '1';
    }
    if (this._tempoMinusBtn) {
      applyTempoBtn1E(this._tempoMinusBtn, { active: false });
      this._tempoMinusBtn.title = 'Zwolnij (teraz ' + speedTag + ')';
      this._tempoMinusBtn.style.opacity = this.speedIdx === 0 ? '0.42' : '1';
    }
    if (this._tempoPlusBtn) {
      applyTempoBtn1E(this._tempoPlusBtn, { active: false });
      this._tempoPlusBtn.title = 'Przyspiesz (teraz ' + speedTag + ')';
      this._tempoPlusBtn.style.opacity = this.speedIdx >= maxIdx ? '0.42' : '1';
    }
    if (this._tempoAutoBtn) {
      applyTempoBtn1E(this._tempoAutoBtn, { active: !this._manualMode, auto: true });
      this._tempoAutoBtn.style.opacity = '1';
    }
  }

  /**
   * Panel Tempo+minimapa: w DEPLOYU pokazuje nagłówek „Minimapa · rozstawianie"
   * (tempo nie ma jeszcze sensu — bitwa startuje dopiero po rozstawieniu);
   * w WALCE pokazuje rząd Tempo (pauza/−/+/AUTO) — makieta TW v5 §3.
   */
  private _syncMinimapPhaseChrome(): void {
    const deploy = this.deployPhase;
    if (this._minimapDeployHeaderRow) this._minimapDeployHeaderRow.style.display = deploy ? 'flex' : 'none';
    if (this._tempoRow) this._tempoRow.style.display = deploy ? 'none' : 'flex';
  }

  private _collectMinimapData(): BattleMinimapData {
    const terrain: number[] = [];
    const tiles = this.terrainMap.tiles;
    for (let r = 0; r < BF_ROWS; r++) {
      for (let c = 0; c < BF_COLS; c++) {
        terrain.push(tiles ? (tiles[r * BF_COLS + c] ?? 0) : 0);
      }
    }
    const units: BattleMinimapUnit[] = [];
    for (const ru of [...this.atk, ...this.def]) {
      if (ru.dead || ru.removed || ru.fadingOut) continue;
      units.push({
        q: ru.q,
        r: ru.r,
        color: this._factionColor(ru.side),
      });
    }
    return {
      cols: BF_COLS,
      rows: BF_ROWS,
      terrain,
      units,
      viewport: this._computeMinimapViewport(),
    };
  }

  private _computeMinimapViewport(): BattleMinimapViewport {
    const h = Math.max(1, this.canvas.clientHeight);
    const w = Math.max(1, this.canvas.clientWidth);
    const worldPerPx = (this.camDist * 1.2) / h;
    const visibleW = w * worldPerPx;
    const visibleH = h * worldPerPx;
    const colCenter = this.camTarget.x / TILE_S;
    const rowCenter = this.camTarget.z / TILE_S;
    const colHalf = visibleW / TILE_S / 2;
    const rowHalf = visibleH / TILE_S / 2;
    return {
      colMin: Math.max(0, Math.floor(colCenter - colHalf)),
      rowMin: Math.max(0, Math.floor(rowCenter - rowHalf)),
      colMax: Math.min(BF_COLS - 1, Math.ceil(colCenter + colHalf)),
      rowMax: Math.min(BF_ROWS - 1, Math.ceil(rowCenter + rowHalf)),
    };
  }

  private _drawMinimap(): void {
    if (!this._minimapCanvas) return;
    const ctx = this._minimapCanvas.getContext('2d');
    if (!ctx) return;
    drawBattleMinimap(ctx, this._collectMinimapData());
  }

  private _unitRoleLabel(ru: RuntimeBattleUnit): string {
    if (ru.mounted) return 'Mounted';
    if (ru.rangedBase || ru.primaryRanged) return 'Dystans';
    return 'Frontalne';
  }

  /**
   * Jednostka pod kursorem — najpierw kafel (relief), potem mesh 3D tylko gdy
   * zgadza się z kaflem (K2: włócznia na sąsiednim heksie nie przełącza zaznaczenia).
   */
  private _pickUnitAtScreen(cx: number, cy: number): RuntimeBattleUnit | null {
    const tile = this._pickGroundTile(cx, cy);
    if (tile) {
      const cellUnit = this.occByKey.get(cellKey(tile.col, tile.row));
      if (cellUnit && !cellUnit.dead && !cellUnit.fadingOut && !cellUnit.removed) return cellUnit;
    }
    const raycaster = this._raycastFromCanvas(cx, cy);
    if (!raycaster) return null;
    const allGroups = [...this.atk, ...this.def]
      .filter(u => !u.dead && !u.fadingOut && !u.removed)
      .map(u => u.group);
    const hits = raycaster.intersectObjects(allGroups, true);
    for (const h of hits) {
      let obj: THREE.Object3D | null = h.object;
      while (obj) {
        const found = [...this.atk, ...this.def].find(u => u.group === obj);
        if (found && !found.dead && !found.fadingOut && !found.removed) {
          if (!tile || found.q === tile.col && found.r === tile.row) return found;
          return null;
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  private _clearHoverTooltip(): void {
    if (this._hoverTimer !== null) {
      clearTimeout(this._hoverTimer);
      this._hoverTimer = null;
    }
    this._hoverUnit = null;
    if (this._hoverTooltip) this._hoverTooltip.style.display = 'none';
  }

  /**
   * Postawa jednostki (C-09 v5 klatka 6, tooltip §6) — wyprowadzona WYŁĄCZNIE z
   * realnych pól silnika: rozkaz gracza (playerOrder: hold/move/attack), doktryna
   * własna jednostki (unitDoctrine) lub doktryna grupy (_groupMeta.doctrine).
   * Gdy żadne z tych pól nie jest ustawione -> "Bez rozkazu" (nie zmyślamy treści).
   */
  private _unitPostawaLabel(ru: RuntimeBattleUnit): string {
    if (ru.dead || ru.removed) return 'Poza walką';
    if (ru.routed) return 'Ucieczka (rozbici)';
    const order = ru.playerOrder;
    if (order.type === 'hold') return 'Rozkaz: trzymaj pozycję';
    if (order.type === 'move') return 'Rozkaz: marsz';
    if (order.type === 'attack') return 'Rozkaz: atak celu';
    if (ru.unitDoctrine != null) return 'Doktryna: ' + this._doctrineLabel(ru.unitDoctrine);
    if (ru.groupId) {
      const meta = this._groupMeta.get(ru.groupId);
      if (meta) return 'Doktryna grupy: ' + this._doctrineLabel(meta.doctrine);
    }
    return 'Bez rozkazu';
  }

  /** Buduje treść bogatego tooltipa jednostki (C-09 v5 klatka 6, §6 dokumentu Design). */
  private _unitTooltipHtml(ru: RuntimeBattleUnit): string {
    const hp = Math.max(0, Math.round(ru.bu.hp));
    const hpMax = Math.max(0, Math.round(ru.bu.maxHp));
    const hpPct = ru.bu.maxHp > 0 ? Math.round(100 * Math.max(0, ru.bu.hp) / ru.bu.maxHp) : 0;
    const morPct = ru.moraleMax > 0 ? Math.round(100 * Math.max(0, ru.morale) / ru.moraleMax) : 0;
    const roleLabel = this._unitRoleLabel(ru);
    const kategoria = String(ru.bu.kategoria ?? '').trim();
    const subtitle = kategoria ? (kategoria + ' · ' + roleLabel) : roleLabel;
    const postawa = this._unitPostawaLabel(ru);
    const gNum = ru.groupId ? this._groupDisplayNum(ru.groupId) : null;
    const groupLabel = gNum != null ? ('Grupa ' + gNum) : '—';
    // Amunicja: TYLKO dla jednostek dystansowych z realną, skończoną pulą (ammoBarShown);
    // silnik ma to pole (ammoLeft/ammoMax, patrz ammoCount) — jeśli go brak, wiersz pomijamy.
    const hasAmmo = ru.ammoBarShown && Number.isFinite(ru.ammoMax) && ru.ammoMax > 0;
    const ammoPct = hasAmmo ? Math.round(100 * Math.max(0, ru.ammoLeft) / ru.ammoMax) : 0;

    // C-TEREN-IMPL-3=B: wiersz TEREN — brod/brzeg + obrona, Δ zasięg, koszt, blokada.
    const onFord = !ru.onWallWalkway && isFordTile(this.terrainMap, ru.q, ru.r);
    const onShore = !onFord && !ru.onWallWalkway && isShoreAdjacentToFord(this.terrainMap, ru.q, ru.r);
    const terenParts = buildTerrainTerenTooltipParts({
      terrain: this.terrainMap.combatTerrainName(ru.q, ru.r),
      onWallWalkway: !!ru.onWallWalkway,
      onFord,
      onShore,
      rangedUnit: !!ru.rangedBase,
      isCatapult: this._isCatapult(ru.bu),
      rangeBase: ru.rangeBase,
      mounted: !!ru.mounted,
      moveCost: this._moveCostForUnit(ru, ru.q, ru.r),
      baseMoveCost: this.terrainMap.moveCost(ru.q, ru.r),
      terrainData: this.terrainData,
    });
    const terenText = terenParts.map((p) => p.text).join(' · ');
    const terenColor = terrainTerenTooltipColor(terenParts);

    const row = (label: string, value: string, color = '#e8e0c8'): string =>
      '<div style="display:flex;align-items:flex-start;gap:10px;font-size:12px;line-height:1.35;">' +
      '<span style="color:#8a8070;min-width:58px;letter-spacing:.04em;text-transform:uppercase;font-size:10px;font-weight:700;padding-top:1px;">' + label + '</span>' +
      '<span style="color:' + color + ';flex:1;">' + escapeHtml(value) + '</span></div>';

    const statCell = (svgColor: string, iconSvg: string, label: string, value: string): string =>
      '<div class="tnum" style="display:flex;align-items:center;gap:6px;font-size:12px;">' +
      '<span style="color:' + svgColor + ';display:inline-flex;line-height:0;">' + iconSvg + '</span>' +
      '<span style="color:#8a8070;">' + label + '</span>' +
      '<b style="margin-left:auto;color:#e8e0c8;">' + value + '</b></div>';

    const ICON_HP = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 6v12M6 12h12"/></svg>';
    const ICON_MORALE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 21V4l12 2v9l-12-2"/></svg>';
    const ICON_AMMO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 19 19 5M15 5h4v4"/><path d="M9 5H5v4"/></svg>';

    const statCells = [
      statCell('#4caf50', ICON_HP, 'Zdrowie', hpPct + '%'),
      statCell('#ffd54a', ICON_MORALE, 'Morale', morPct + '%'),
    ];
    if (hasAmmo) statCells.push(statCell('#c8a878', ICON_AMMO, 'Amunicja', ammoPct + '%'));

    return (
      '<div style="padding:11px 14px 9px;border-bottom:1px solid rgba(232,216,138,0.2);background:linear-gradient(90deg,rgba(58,106,208,0.14),transparent);border-radius:10px 10px 0 0;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
      '<span style="font-family:' + BATTLE_FONT_TITLE + ';font-size:15px;color:#cfe0f4;">' + escapeHtml(String(ru.bu.nazwa)) + '</span>' +
      '<span class="tnum" style="font-size:12px;font-weight:700;color:' + BATTLE_GOLD + ';white-space:nowrap;">' + hp + ' / ' + hpMax + '</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#8a8070;margin-top:2px;">' + escapeHtml(subtitle) + '</div>' +
      '</div>' +
      '<div style="padding:10px 14px;display:flex;flex-direction:column;gap:8px;">' +
      row('Postawa', postawa) +
      row('Grupa', groupLabel, gNum != null ? BATTLE_PLAYER_TEXT : '#8a8070') +
      (terenParts.length > 0 ? row('Teren', terenText, terenColor) : '') +
      '</div>' +
      '<div style="padding:9px 12px;border-top:1px solid rgba(232,216,138,0.16);display:grid;grid-template-columns:1fr 1fr;gap:7px 12px;">' +
      statCells.join('') +
      '</div>'
    );
  }

  /** Bogaty tooltip jednostki (C-09 v5 klatka 6) — pigułka 1E, hover na banerze 3D lub karcie rosteru. */
  private _showHoverTooltip(ru: RuntimeBattleUnit, cx: number, cy: number): void {
    const tip = this._hoverTooltip;
    if (!tip) return;
    tip.innerHTML = this._unitTooltipHtml(ru);
    Object.assign(tip.style, {
      display: 'block',
      padding: '0',
      width: '300px',
      background: 'linear-gradient(180deg,rgba(22,28,38,0.99),rgba(8,10,16,0.99))',
      border: '2px solid rgba(232,216,138,0.5)',
      borderRadius: '12px',
      boxShadow: '0 18px 44px rgba(0,0,0,0.75)',
      color: BATTLE_TEXT,
      overflow: 'hidden',
    });
    tip.style.left = (cx + 14) + 'px';
    tip.style.top = (cy + 14) + 'px';
  }

  private readonly _onCanvasHoverMove = (e: PointerEvent): void => {
    if (this.panning || this._boxSelectStart || this._minimapDragging || this._deployDrag) {
      this._clearHoverTooltip();
      this._clearOrderPreview();
      this.canvas.style.cursor = CURSOR_DEFAULT;
      return;
    }
    this._updateBattleCursor(e.clientX, e.clientY);
    this._updateOrderPreview(e.clientX, e.clientY);
    const ru = this._pickUnitAtScreen(e.clientX, e.clientY);
    if (!ru) {
      this._clearHoverTooltip();
      return;
    }
    if (this._hoverUnit === ru && this._hoverTooltip?.style.display === 'block') {
      if (this._hoverTooltip) {
        this._hoverTooltip.style.left = (e.clientX + 14) + 'px';
        this._hoverTooltip.style.top = (e.clientY + 14) + 'px';
      }
      return;
    }
    if (this._hoverUnit !== ru) {
      this._clearHoverTooltip();
      this._hoverUnit = ru;
      this._hoverTimer = setTimeout(() => {
        this._hoverTimer = null;
        if (this._hoverUnit === ru) this._showHoverTooltip(ru, e.clientX, e.clientY);
      }, HOVER_TOOLTIP_MS);
    }
  };

  private readonly _onCanvasHoverLeave = (): void => {
    this._clearHoverTooltip();
    this._clearOrderPreview();
    this.canvas.style.cursor = CURSOR_DEFAULT;
  };

  // --- Drag-pan: PPM/scroll w deploy; LPM = zaznacz / przesuń jednostki ---
  private readonly _onPanDown = (e: PointerEvent): void => {
    // LEWY przycisk w fazie rozstawiania — zaznaczenie i przesuwanie (NIE kamera)
    if (e.button === 0 && this.deployPhase) {
      this._pointerDownPos = { x: e.clientX, y: e.clientY };
      this._deployMoveStart = null;
      this._deployPickPending = null;
      if (e.shiftKey) {
        this._boxSelectStart = { x: e.clientX, y: e.clientY };
        return;
      }
      // Deploy LPM: kafel relief-aware → select (zajęty) albo move (pusty legalny)
      const tile = this._pickGroundTile(e.clientX, e.clientY);
      if (tile) {
        const unitAtTile = this.occByKey.get(cellKey(tile.col, tile.row));
        if (
          unitAtTile
          && this._isPlayerSide(unitAtTile.side)
          && !unitAtTile.dead
          && !unitAtTile.removed
        ) {
          this._deployPickPending = unitAtTile;
          return;
        }
        if (this._selectedUnits.size > 0 && this._inDeployPlayerZone(tile.col, tile.row)) {
          this._deployMoveStart = { x: e.clientX, y: e.clientY, col: tile.col, row: tile.row };
          return;
        }
      }
      this._boxSelectStart = { x: e.clientX, y: e.clientY };
      return;
    }
    // LEWY przycisk w trybie RECZNYM w fazie walki → box-select (nie pan)
    if (e.button === 0 && this._manualMode && !this.deployPhase && this.started && !this.finished) {
      this._pointerDownPos = { x: e.clientX, y: e.clientY };
      this._boxSelectStart = { x: e.clientX, y: e.clientY };
      return;
    }
    // PRAWY (2) lub SRODKOWY (1) = pan kamery; w deploy LPM nigdy nie przesuwa mapy
    if (e.button !== 0 && e.button !== 2 && e.button !== 1) return;
    if (e.button === 0) {
      this._pointerDownPos = { x: e.clientX, y: e.clientY };
    }
    this.panning  = true;
    this.panLastX = e.clientX;
    this.panLastY = e.clientY;
    if (!this._pointerDownPos) this._pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private readonly _onPanMove = (e: PointerEvent): void => {
    // LPM + zaznaczenie: po przesunieciu kursora start drag z duchami (deploy)
    if (this.deployPhase && this._deployMoveStart && !this._deployDrag && e.buttons === 1) {
      const dx = e.clientX - this._deployMoveStart.x;
      const dy = e.clientY - this._deployMoveStart.y;
      if (dx * dx + dy * dy >= 36) {
        const tile = this._pickGroundTile(e.clientX, e.clientY);
        if (tile && this._inDeployPlayerZone(tile.col, tile.row)) {
          const anchorCol = this._deployMoveStart?.col ?? tile.col;
          const anchorRow = this._deployMoveStart?.row ?? tile.row;
          this._deployDrag = {
            anchorCol,
            anchorRow,
            curCol: tile.col,
            curRow: tile.row,
          };
          this._deployMoveStart = null;
          this._refreshDeployGhosts();
        }
      }
    }
    // Przeciaganie formacji deploy — duchy + rozciaganie (tylko LPM)
    if (this._deployDrag && e.buttons === 1) {
      const tile = this._pickGroundTile(e.clientX, e.clientY);
      if (tile) {
        this._deployDrag.curCol = this._clampDeployPlayerCol(tile.col);
        this._deployDrag.curRow = Math.max(DEPLOY_MIN_ROW, Math.min(DEPLOY_MAX_ROW, tile.row));
        this._refreshDeployGhosts();
      }
      return;
    }
    // Box-select ruch — lewy w manualMode / deploy+shift
    if (this._boxSelectStart && e.buttons === 1) {
      const dx = e.clientX - this._boxSelectStart.x;
      const dy = e.clientY - this._boxSelectStart.y;
      if (dx * dx + dy * dy >= 36) {
        // Rysuj overlay
        if (!this._boxSelectDiv) {
          const d = document.createElement('div');
          d.id = 'box-select-overlay';
          Object.assign(d.style, {
            position: 'fixed',
            border: '2px dashed #00ffcc',
            background: 'rgba(0,255,204,0.08)',
            pointerEvents: 'none',
            zIndex: '99999',
          });
          // Na <html>, nie <body> — applyUiZoom() skaluje body (transform), co psuje position:fixed + clientX/Y.
          document.documentElement.appendChild(d);
          this._boxSelectDiv = d;
        }
        const x1 = Math.min(this._boxSelectStart.x, e.clientX);
        const y1 = Math.min(this._boxSelectStart.y, e.clientY);
        const x2 = Math.max(this._boxSelectStart.x, e.clientX);
        const y2 = Math.max(this._boxSelectStart.y, e.clientY);
        Object.assign(this._boxSelectDiv.style, {
          left: x1 + 'px', top: y1 + 'px',
          width: (x2 - x1) + 'px', height: (y2 - y1) + 'px',
        });
      }
      return;
    }
    if (!this.panning) return;
    const dx = e.clientX - this.panLastX;
    const dy = e.clientY - this.panLastY;
    this.panLastX = e.clientX;
    this.panLastY = e.clientY;

    // Screen-right -> field +X; screen-down -> field +Z (South / dół mapy).
    const h = Math.max(1, this.canvas.clientHeight);
    const worldPerPx = (this.camDist * 1.2) / h;
    this.camTarget.x -= dx * worldPerPx;
    this.camTarget.z -= dy * worldPerPx;
    this._clampCamTarget();
    this._applyCamera();
  };

  private readonly _onPanUp = (e: PointerEvent): void => {
    // LPM na jednostce ATK — zaznacz / odznacz (toggle grupy), bez box-select
    if (this._deployPickPending && e.button === 0) {
      const pending = this._deployPickPending;
      this._deployPickPending = null;
      if (!this._boxSelectDiv) {
        this._lastClickModifiers = { ctrl: e.ctrlKey, shift: e.shiftKey };
        this._handleDeployUnitPick(pending, this._lastClickModifiers.ctrl, this._lastClickModifiers.shift);
      }
      this._pointerDownPos = null;
      return;
    }
    // Zakoncz przeciaganie formacji deploy (tylko LPM)
    if (this._deployDrag && e.button === 0) {
      const d = this._deployDrag;
      this._deployDrag = null;
      const units = this._getDeploySelectedUnits();
      this._applyDeployPlacement(units, d.anchorCol, d.anchorRow, d.curCol, d.curRow);
      this._clearDeployGhosts();
      this._deployMoveStart = null;
      this._pointerDownPos = null;
      return;
    }
    // Krotki LPM na polu docelowym = przesun zaznaczone (klik, bez drag)
    if (this._deployMoveStart && e.button === 0) {
      const start = this._deployMoveStart;
      this._deployMoveStart = null;
      const distSq = (e.clientX - start.x) ** 2 + (e.clientY - start.y) ** 2;
      if (distSq < 36) {
        this._lastClickModifiers = { ctrl: e.ctrlKey, shift: e.shiftKey };
        this._onDeployClick(e.clientX, e.clientY, true);
      }
      this._pointerDownPos = null;
      return;
    }
    // Zakoncz box-select
    if (this._boxSelectStart && e.button === 0) {
      const startX = this._boxSelectStart.x, startY = this._boxSelectStart.y;
      const endX = e.clientX, endY = e.clientY;
      const distSq = (endX - startX) ** 2 + (endY - startY) ** 2;
      if (this._boxSelectDiv) {
        // Zaznacz jednostki w prostokącie
        this._doBoxSelect(
          Math.min(startX, endX), Math.min(startY, endY),
          Math.max(startX, endX), Math.max(startY, endY),
        );
        this._boxSelectDiv.parentNode?.removeChild(this._boxSelectDiv);
        this._boxSelectDiv = null;
      } else if (distSq < 36) {
        // Krotki klik — standardowe zaznaczanie
        this._lastClickModifiers = { ctrl: e.ctrlKey, shift: e.shiftKey };
        if (this.deployPhase) {
          this._onDeployClick(e.clientX, e.clientY);
        } else if (!this.deployPhase && this.started && !this.finished && (this._manualMode || this._battleAwaitingOrders)) {
          this._onBattleClick(e.clientX, e.clientY);
        }
      } else if (this.deployPhase) {
        // Box-select w fazie deploy: zaznacz grupowo do grupowania
        // (uzupelniajace — doBoxSelect juz sie wykonal powyzej)
      }
      this._boxSelectStart = null;
      this._pointerDownPos = null;
      return;
    }

    this.panning = false;
    // PPM — krotki klik: odznacz (mapa lub wlasna jednostka); drag = kamera
    if (e.button === 2) {
      if (this._isShortPointerClick(e) && this._selectionInputActive()) {
        this._deselectOnRightClick();
      }
      this._pointerDownPos = null;
      this._deployMoveStart = null;
      return;
    }
    // PPM / scroll — tylko kamera (mouseup po dragu)
    if (e.button !== 0) {
      this._pointerDownPos = null;
      this._deployMoveStart = null;
      return;
    }
    const isClick = this._pointerDownPos &&
      (() => { const dx = e.clientX - this._pointerDownPos!.x; const dy = e.clientY - this._pointerDownPos!.y; return dx*dx+dy*dy < 36; })();
    if (this.deployPhase && isClick) {
      this._lastClickModifiers = { ctrl: e.ctrlKey, shift: e.shiftKey };
      this._onDeployClick(e.clientX, e.clientY);
    }
    else if (!this.deployPhase && this.started && !this.finished && this._manualMode && isClick) {
      this._onBattleClick(e.clientX, e.clientY);
    }
    this._pointerDownPos = null;
  };

  private readonly _onResize = (): void => { this._syncRendererSize(); };

  // -------------------------------------------------------------------------
  // FAZA ROZSTAWIANIA — metody pomocnicze
  // -------------------------------------------------------------------------

  private _findUnitById(id: string): RuntimeBattleUnit | undefined {
    return this.atk.find(u => u.bu.id === id) ?? this.def.find(u => u.bu.id === id);
  }

  private _playerControlSide(): 'atk' | 'def' {
    return this._deployPlayerSideOpt;
  }

  /** Battle UI identity palette: player=blue, enemy=red; role stays separate. */
  private _factionColor(side: 'atk' | 'def'): string {
    return sideColor(side, this._playerControlSide()) === SIDE_COLOR_BY_IDENTITY.player
      ? BATTLE_PLAYER
      : BATTLE_ENEMY;
  }

  private _factionTextColor(side: 'atk' | 'def'): string {
    return sideColor(side, this._playerControlSide()) === SIDE_COLOR_BY_IDENTITY.player
      ? BATTLE_PLAYER_TEXT
      : BATTLE_ENEMY_TEXT;
  }

  /** Czy gracz wygrał bitwę — uwzględnia deployPlayerSide (atk/def). */
  private _playerWonFromBattleWinner(winner: 'atakujacy' | 'obronca'): boolean {
    const playerRole: 'atakujacy' | 'obronca' =
      this._playerControlSide() === 'atk' ? 'atakujacy' : 'obronca';
    return winner === playerRole;
  }

  private _civLabelForSide(side: 'atk' | 'def'): string {
    return side === 'atk' ? this._attackerCivLabel : this._defenderCivLabel;
  }

  private _isPlayerSide(side: 'atk' | 'def'): boolean {
    return side === this._playerControlSide();
  }

  private _playerRoster(): RuntimeBattleUnit[] {
    return this._playerControlSide() === 'atk' ? this.atk : this.def;
  }

  private _enemyRoster(): RuntimeBattleUnit[] {
    return this._playerControlSide() === 'atk' ? this.def : this.atk;
  }

  private _findPlayerUnit(id: string): RuntimeBattleUnit | undefined {
    return this._playerRoster().find(u => u.bu.id === id);
  }

  private _groupRegistryRoster(): RuntimeBattleUnit[] {
    if (this.deployPhase || this.started) {
      return this._playerRoster();
    }
    return this.atk;
  }

  private _inDeployPlayerZone(col: number, row: number): boolean {
    return this._playerControlSide() === 'atk'
      ? inDeployAtkZone(col, row)
      : inDeployDefZone(col, row);
  }

  private _clampDeployPlayerCol(col: number): number {
    if (this._playerControlSide() === 'atk') {
      return Math.max(DEPLOY_MIN_COL, Math.min(DEPLOY_MAX_COL, col));
    }
    return Math.max(DEPLOY_DEF_MIN_COL, Math.min(DEPLOY_DEF_MAX_COL, col));
  }

  /**
   * Buduje wizualizacje fazy rozstawiania:
   * - lewa polowa: rozjasniona + niebieskie kafle (strefa ATK)
   * - prawa polowa: mgla wojny (przyciemniona)
   * - zlota linia podzialu na srodku mapy
   */
  private _buildDeployZone(): void {
    const midCol   = DEPLOY_MID_COL;
    const midRow   = PLAY_MID_ROW;
    const worldH   = PLAYABLE_ROWS * TILE_S;
    const boundaryX = midCol * TILE_S - TILE_S * 0.5;
    const zoneZ    = midRow * TILE_S;
    const playerIsAtk = this._playerControlSide() === 'atk';
    const playerCol0 = playerIsAtk ? PLAY_COL0 : DEPLOY_DEF_MIN_COL;
    const playerColEnd = playerIsAtk ? midCol : PLAY_COL1 + 1;
    const enemyCol0 = playerIsAtk ? midCol : PLAY_COL0;
    const enemyColEnd = playerIsAtk ? PLAY_COL1 + 1 : midCol;
    const playerCols = playerColEnd - playerCol0;
    const enemyCols = enemyColEnd - enemyCol0;
    const playerW = playerCols * TILE_S;
    const enemyW = enemyCols * TILE_S;
    const playerCenterX = playerCol0 * TILE_S + playerW * 0.5 - TILE_S * 0.5;
    const enemyCenterX = enemyCol0 * TILE_S + enemyW * 0.5 - TILE_S * 0.5;

    const group = new THREE.Group();
    group.name = 'deployVisuals';

    const brightGeo = new THREE.PlaneGeometry(playerW, worldH);
    brightGeo.rotateX(-Math.PI / 2);
    this.ownedGeos.push(brightGeo);
    const brightMat = new THREE.MeshBasicMaterial({
      color: 0xc8e8ff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    this.ownedMats.push(brightMat);
    const bright = new THREE.Mesh(brightGeo, brightMat);
    bright.position.set(playerCenterX, 0.035, zoneZ);
    group.add(bright);
    this._deployZoneMeshes.push(bright);

    const tileGeo = new THREE.PlaneGeometry(TILE_S * 0.94, TILE_S * 0.94);
    tileGeo.rotateX(-Math.PI / 2);
    this.ownedGeos.push(tileGeo);
    for (let col = playerCol0; col < playerColEnd; col++) {
      for (let row = PLAY_ROW0; row <= PLAY_ROW1; row++) {
        if (!this.terrainMap.passable(col, row)) continue;
        const mat = new THREE.MeshBasicMaterial({
          color: 0x44bbff,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        });
        this.ownedMats.push(mat);
        const mesh = new THREE.Mesh(tileGeo, mat);
        const { x, z } = cellToWorld(col, row);
        mesh.position.set(x, 0.045, z);
        group.add(mesh);
        this._deployZoneMeshes.push(mesh);
      }
    }

    const fogGeo = new THREE.PlaneGeometry(enemyW, worldH);
    fogGeo.rotateX(-Math.PI / 2);
    this.ownedGeos.push(fogGeo);
    const fogMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a12,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    this.ownedMats.push(fogMat);
    const fog = new THREE.Mesh(fogGeo, fogMat);
    fog.position.set(enemyCenterX, 0.055, zoneZ);
    group.add(fog);
    this._deployZoneMeshes.push(fog);

    const fog2Mat = new THREE.MeshBasicMaterial({
      color: 0x606878,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.ownedMats.push(fog2Mat);
    const fog2 = new THREE.Mesh(fogGeo, fog2Mat);
    fog2.position.set(fog.position.x, 0.06, fog.position.z);
    group.add(fog2);
    this._deployZoneMeshes.push(fog2);

    const lineGeo = new THREE.BoxGeometry(0.10, 0.18, worldH * 0.98);
    this.ownedGeos.push(lineGeo);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.92,
    });
    this.ownedMats.push(lineMat);
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(boundaryX, 0.09, zoneZ);
    group.add(line);
    this._deployZoneMeshes.push(line);

    const mkEdge = (color: number, dx: number): void => {
      const eg = new THREE.BoxGeometry(0.04, 0.12, worldH * 0.96);
      this.ownedGeos.push(eg);
      const em = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 });
      this.ownedMats.push(em);
      const edge = new THREE.Mesh(eg, em);
      edge.position.set(boundaryX + dx, 0.085, zoneZ);
      group.add(edge);
      this._deployZoneMeshes.push(edge);
    };
    mkEdge(0x3060c0, playerIsAtk ? -0.12 : 0.12);
    mkEdge(0xcc4030, playerIsAtk ? 0.12 : -0.12);

    this.scene.add(group);
    this._deployVisualGroup = group;
  }

  /** @deprecated Etykiety frakcji na pasku mocy — nie nad mapą. */
  private _buildDeployHalfLabels(): void {
    this._removeDeployHalfLabels();
  }

  private _removeDeployHalfLabels(): void {
    if (this._deployHalfLabels?.parentNode) {
      this._deployHalfLabels.parentNode.removeChild(this._deployHalfLabels);
    }
    this._deployHalfLabels = null;
  }

  /** Ukrywa/pokazuje meshe strefy startowej. */
  private _setDeployZoneVisible(v: boolean): void {
    if (this._deployVisualGroup) this._deployVisualGroup.visible = v;
    for (const m of this._deployZoneMeshes) m.visible = v;
    if (this._deployHalfLabels) this._deployHalfLabels.style.display = v ? 'flex' : 'none';
  }

  /**
   * Pasek deploy: jedna linia — chipy formacji + Formacja/Konnica/Linie/Strategia;
   * po prawej Reset + Start walki. Jednostki/grupy w lewym panelu rosteru.
   */
  private _buildDeployToolbar(): void {
    if (this._deployToolbar) return;

    // Zadanie #17: pływający klaster Reset + Start walki (prawy dół) — dawny
    // pełnoszerokościowy pasek zlikwidowany; zostaje ciasny klaster z własnym
    // tłem (~72%+blur), widoczny WYŁĄCZNIE w deployu (patrz _syncBattleToolbarMode).
    const bar = document.createElement('div');
    bar.id = 'deploy-toolbar';
    Object.assign(bar.style, {
      position:       'fixed',
      right:          '16px',
      bottom:         '16px',
      width:          'auto',
      minHeight:      DEPLOY_TOOLBAR_H + 'px',
      height:         'auto',
      zIndex:         '100200',
      display:        'flex',
      alignItems:     'center',
      gap:            '10px',
      boxSizing:      'border-box',
      pointerEvents:  'auto',
      overflow:       'visible',
    });
    applyDeployToolbarBar(bar);

    const chipsCol = document.createElement('div');
    Object.assign(chipsCol.style, {
      display: 'none',
    });

    const chips = document.createElement('div');
    chips.id = 'deploy-toolbar-chips';
    Object.assign(chips.style, {
      display: 'flex', flexWrap: 'nowrap', gap: '4px', alignItems: 'center', flexShrink: '0',
    });
    this._deployToolbarStatus = chips;
    chipsCol.appendChild(chips);
    bar.appendChild(chipsCol);

    // Zadanie #17: rzadek ikon Formacja/Konnica/Linie/Taktyka/Strategia — pierwszy
    // rzad panelu rosteru (nad naglowkiem "Roster N jednostek"), nie dolny pasek.
    const center = document.createElement('div');
    center.id = 'deploy-icon-row';
    Object.assign(center.style, {
      display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
      alignItems: 'center', justifyContent: 'center',
      gap: '6px', flexShrink: '0',
      padding: '10px 10px 8px',
      borderBottom: '1px solid rgba(232,216,138,0.2)',
    });
    this._deployToolbarCenter = center;
    this._deployIconRow = center;

    const fmtDefs: Array<{ fmt: 'F1' | 'F2' | 'F3'; label: string; subtitle: string; icon: string; msg: string }> = [
      { fmt: 'F1', label: 'Dystans', subtitle: '\u0141ucznicy z przodu', icon: FMT_SVG.f1, msg: '\u0141ucznicy z przodu' },
      { fmt: 'F2', label: 'Piechota', subtitle: 'Zwarta linia z przodu', icon: FMT_SVG.f2, msg: 'Piechota z przodu' },
      { fmt: 'F3', label: 'Obl\u0119\u017Cenie', subtitle: 'Machiny na skrzyd\u0142ach', icon: FMT_SVG.f3, msg: 'Machiny na skrzyd\u0142ach' },
    ];
    const fmtPopup = document.createElement('div');
    Object.assign(fmtPopup.style, { minWidth: '220px' });
    for (const fd of fmtDefs) {
      const ob = document.createElement('button');
      ob.type = 'button';
      ob.dataset.deployFmtOption = fd.fmt;
      ob.innerHTML = buildDeployPopupRowHtml(fd.icon, fd.label, fd.subtitle);
      Object.assign(ob.style, {
        padding: '11px 13px', borderRadius: '9px', cursor: 'pointer', fontFamily: HUD_FONT,
        width: '100%', textAlign: 'left',
        border: `1px solid rgba(232,216,138,0.2)`, background: DEPLOY_POPUP_INACTIVE_BG,
      });
      applyDeployPopupItem1E(ob);
      ob.addEventListener('click', (e) => {
        e.stopPropagation();
        this._setDeployActiveFormation(fd.fmt);
        this._applyDeployArmyFormation(fd.fmt);
        this._closeDeployDropdowns();
        if (this._deployRosterFeedback) this._showDeployFeedback(fd.msg);
      });
      fmtPopup.appendChild(ob);
    }
    center.appendChild(this._makeDeployToolbarDropdown(
      'Formacja', 'formation', fmtPopup, DEPLOY_TOOLBAR_MAIN_SVG.formation,
    ));
    this._deployFmtRow = center;

    const cavDefs: Array<{ mode: CavalryDeployMode; label: string; subtitle: string; icon: string; msg: string }> = [
      { mode: 'flanks', label: 'Z boku', subtitle: 'Oskrzydlenie flanki', icon: FMT_SVG.cavFlanks, msg: 'Konnica na skrzyd\u0142ach' },
      { mode: 'rear', label: 'Z ty\u0142u', subtitle: 'Uderzenie na ty\u0142y', icon: FMT_SVG.cavRear, msg: 'Konnica za liniami' },
    ];
    const cavPopup = document.createElement('div');
    Object.assign(cavPopup.style, { minWidth: '220px' });
    for (const cd of cavDefs) {
      const ob = document.createElement('button');
      ob.type = 'button';
      ob.dataset.deployCavOption = cd.mode;
      ob.innerHTML = buildDeployPopupRowHtml(cd.icon, cd.label, cd.subtitle);
      Object.assign(ob.style, {
        padding: '11px 13px', borderRadius: '9px', cursor: 'pointer', fontFamily: HUD_FONT,
        width: '100%', textAlign: 'left',
        border: `1px solid rgba(232,216,138,0.2)`, background: DEPLOY_POPUP_INACTIVE_BG,
      });
      applyDeployPopupItem1E(ob);
      ob.addEventListener('click', (e) => {
        e.stopPropagation();
        this._applyDeployCavalryMode(cd.mode);
        this._closeDeployDropdowns();
        if (this._deployRosterFeedback) this._showDeployFeedback(cd.msg);
      });
      cavPopup.appendChild(ob);
    }
    center.appendChild(this._makeDeployToolbarDropdown(
      'Konnica', 'cavalry', cavPopup, DEPLOY_TOOLBAR_MAIN_SVG.cavalry,
    ));
    this._deployCavRow = center;

    // C-FLANK (Maciej 2026-07-25): kierunek natarcia w auto-odgrywaniu --
    // FRONT/BOK/TYL, dla WSZYSTKICH typow jednostek (nie tylko konnicy),
    // zastosowany do aktualnie zaznaczonego zakresu (jednostka/grupa/armia),
    // dokladnie jak Formacja/Konnica powyzej (_resolveDeployFormationTargets).
    const dirDefs: Array<{ dir: AttackDirection; label: string; subtitle: string; icon: string; msg: string }> = [
      { dir: 'front', label: 'Front', subtitle: 'Uderzenie czolowe (domyslnie)', icon: FMT_SVG.dirFront, msg: 'Kierunek natarcia: front' },
      { dir: 'bok', label: 'Bok', subtitle: 'Manewr na flanke przeciwnika', icon: FMT_SVG.cavFlanks, msg: 'Kierunek natarcia: bok' },
      { dir: 'tyl', label: 'Tył', subtitle: 'Manewr na tyły przeciwnika', icon: FMT_SVG.cavRear, msg: 'Kierunek natarcia: tył' },
    ];
    const dirPopup = document.createElement('div');
    Object.assign(dirPopup.style, { minWidth: '220px' });
    for (const dd of dirDefs) {
      const ob = document.createElement('button');
      ob.type = 'button';
      ob.dataset.deployDirOption = dd.dir;
      ob.innerHTML = buildDeployPopupRowHtml(dd.icon, dd.label, dd.subtitle);
      Object.assign(ob.style, {
        padding: '11px 13px', borderRadius: '9px', cursor: 'pointer', fontFamily: HUD_FONT,
        width: '100%', textAlign: 'left',
        border: `1px solid rgba(232,216,138,0.2)`, background: DEPLOY_POPUP_INACTIVE_BG,
      });
      applyDeployPopupItem1E(ob);
      ob.addEventListener('click', (e) => {
        e.stopPropagation();
        this._applyDeployAttackDirection(dd.dir);
        this._closeDeployDropdowns();
        if (this._deployRosterFeedback) this._showDeployFeedback(dd.msg);
      });
      dirPopup.appendChild(ob);
    }
    center.appendChild(this._makeDeployToolbarDropdown(
      'Kierunek natarcia', 'direction', dirPopup, DEPLOY_TOOLBAR_MAIN_SVG.direction,
    ));
    this._deployDirRow = center;

    const linesPopup = document.createElement('div');
    linesPopup.id = 'deploy-lines-popup';
    Object.assign(linesPopup.style, { minWidth: '240px' });
    center.appendChild(this._makeDeployToolbarDropdown(
      'Linie', 'lines', linesPopup, DEPLOY_TOOLBAR_MAIN_SVG.lines,
    ));

    const tacticsPopup = document.createElement('div');
    tacticsPopup.id = 'deploy-tactics-popup';
    Object.assign(tacticsPopup.style, { minWidth: '300px' });
    center.appendChild(this._makeDeployToolbarDropdown(
      'Taktyka', 'tactics', tacticsPopup, DEPLOY_TOOLBAR_MAIN_SVG.tactics,
    ));

    const stratPopup = document.createElement('div');
    stratPopup.id = 'deploy-strategy-popup';
    Object.assign(stratPopup.style, { minWidth: '360px', maxWidth: '360px' });
    center.appendChild(this._makeDeployToolbarDropdown(
      'Strategia', 'strategy', stratPopup, STRATEGY_HEADER_SVG,
    ));

    // Rzadek ikon NIE jest juz czescia dolnego paska — wpiety do panelu rosteru
    // (pierwszy rzad, nad naglowkiem), patrz _mountDeployIconRow.
    this._mountDeployIconRow();

    const actionRow = document.createElement('div');
    Object.assign(actionRow.style, {
      display: 'flex', gap: '10px', alignItems: 'center',
      marginLeft: 'auto',
      position: 'relative', zIndex: '3', flexShrink: '0',
    });

    const btnReset = document.createElement('button');
    btnReset.id = 'deploy-toolbar-reset';
    btnReset.type = 'button';
    applyToolbarIconBtn1E(btnReset);
    btnReset.style.color = '#c8b898';
    btnReset.style.borderColor = 'rgba(232,216,138,0.25)';
    btnReset.innerHTML = FMT_SVG.reset;
    btnReset.onclick = (e) => {
      e.stopPropagation();
      this._resetDeployPlayer();
      this._showDeployFeedback('Jednostki przywr\u00F3cone do domy\u015Blnego rozstawienia.');
      this._updateDeployToolbarStatus();
    };
    actionRow.appendChild(wrapWithHoverTooltip1E(btnReset, 'Reset rozstawienia', 'above'));

    const btnStart = document.createElement('button');
    btnStart.id = 'deploy-toolbar-start';
    btnStart.type = 'button';
    applyBtnStartBattle(btnStart);
    btnStart.style.flex = 'none';
    btnStart.style.height = '52px';
    btnStart.style.padding = '0 34px';
    btnStart.style.fontSize = '14px';
    btnStart.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.25),0 6px 20px rgba(200,64,64,0.4)';
    btnStart.innerHTML = '<span style="display:inline-flex;line-height:0;">' + FMT_SVG.start + '</span>Start walki';
    btnStart.onclick = (e) => { e.stopPropagation(); this._endDeployPhase(); };
    actionRow.appendChild(btnStart);

    bar.appendChild(actionRow);
    document.body.appendChild(bar);
    this._deployToolbar = bar;

    this._deployToolbarDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (this._deployIconRow?.contains(t)) return;
      if (this._deployToolbar?.contains(t)) return;
      for (const popup of Object.values(this._deployDropdownPopups)) {
        if (popup?.contains(t)) return;
      }
      this._closeDeployDropdowns();
    };
    document.addEventListener('click', this._deployToolbarDocClick);

    this._syncDeployFormationButtons();
    this._syncDeployCavalryButtons();
    this._syncDeployAttackDirectionButtons();
    const linesPop = this._deployDropdownPopups.lines;
    if (linesPop) this._renderDeployLinesPopup(linesPop);
    this._updateDeployToolbarStatus();
    this._updateDeployToolbarSelection();
    this._updateRightRailLayout();
  }

  /** Wpina rzadek ikon (Formacja..Strategia) jako pierwszy rzad panelu rosteru, nad naglowkiem. */
  private _mountDeployIconRow(): void {
    if (!this._deployIconRow || !this._rosterBar) return;
    if (this._deployIconRow.parentElement !== this._rosterBar) {
      this._rosterBar.insertBefore(this._deployIconRow, this._rosterBar.firstChild);
    }
  }

  /** Dropdown w rzadku ikon nad rosterem (Formacja / Konnica / Linie / Taktyka / Strategia). */
  private _makeDeployToolbarDropdown(
    label: string,
    key: 'formation' | 'cavalry' | 'direction' | 'lines' | 'tactics' | 'strategy',
    popupBody: HTMLDivElement,
    toolbarIcon?: string,
  ): HTMLDivElement {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { position: 'relative', flexShrink: '0' });

    // Popup NIE zyje wewnatrz panelu rosteru (overflow:hidden by go obcial) —
    // osobny element position:fixed, dziecko document.body, pozycjonowany z
    // realnego rect przycisku (jak popup zebatki ustawien), patrz
    // _positionDeployDropdownPopup / _toggleDeployDropdown.
    const popup = document.createElement('div');
    popup.dataset.deployDropdown = key;
    Object.assign(popup.style, {
      position: 'fixed', display: 'none', flexDirection: 'column', gap: '8px',
      padding: '12px 14px', zIndex: '100210',
      pointerEvents: 'auto',
    });
    applyDeployDropdownPanel1E(popup);
    popup.appendChild(popupBody);
    this._deployDropdownPopups[key] = popup;
    document.body.appendChild(popup);

    // Rzadek ikon nad rosterem = WYLACZNIE ikony (jak dawny dolny toolbar) —
    // podpis tylko na hover (pigulka 1E), nie w tresci przycisku.
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.deployMainBtn = key;
    applyToolbarIconBtn1E(btn);
    btn.style.width = '38px';
    btn.style.height = '38px';
    btn.innerHTML = toolbarIcon ?? label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleDeployDropdown(key, btn);
    });
    const btnWithTip = wrapWithHoverTooltip1E(btn, label, 'below');

    wrap.appendChild(btnWithTip);
    return wrap;
  }

  /** Pozycjonuje popup dropdownu wzgledem realnego rect przycisku (fixed, poza overflow rosteru). */
  private _positionDeployDropdownPopup(popup: HTMLDivElement, btn: HTMLButtonElement): void {
    const r = btn.getBoundingClientRect();
    popup.style.visibility = 'hidden';
    popup.style.display = 'flex';
    const popupW = popup.offsetWidth || 220;
    const popupH = popup.offsetHeight || 0;
    let left = r.left + r.width / 2 - popupW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - popupW - 8));
    let top = r.bottom + 8;
    if (top + popupH > window.innerHeight - 8) {
      top = Math.max(8, r.top - popupH - 8);
    }
    popup.style.left = Math.round(left) + 'px';
    popup.style.top = Math.round(top) + 'px';
    popup.style.visibility = 'visible';
  }

  private _toggleDeployDropdown(
    key: 'formation' | 'cavalry' | 'direction' | 'lines' | 'tactics' | 'strategy',
    btn?: HTMLButtonElement,
  ): void {
    if (this._deployOpenDropdown === key) {
      this._closeDeployDropdowns();
      return;
    }
    this._closeDeployDropdowns();
    this._deployOpenDropdown = key;
    const popup = this._deployDropdownPopups[key];
    if (popup) {
      if (key === 'tactics') this._renderDeployTacticsPopup(popup);
      if (key === 'strategy') this._renderDeployStrategyPopup(popup);
      if (key === 'lines') this._renderDeployLinesPopup(popup);
      if (btn) this._positionDeployDropdownPopup(popup, btn);
      else popup.style.display = 'flex';
    }
    this._paintDeployMainButtons();
  }

  private _closeDeployDropdowns(): void {
    this._deployOpenDropdown = null;
    for (const popup of Object.values(this._deployDropdownPopups)) {
      if (popup) popup.style.display = 'none';
    }
    this._paintDeployMainButtons();
  }

  private _paintDeployMainButtons(): void {
    const paint = (key: string, open: boolean): void => {
      const btn = this._deployIconRow?.querySelector(
        `button[data-deploy-main-btn="${key}"]`,
      ) as HTMLButtonElement | null;
      if (!btn) return;
      applyToolbarIconBtn1E(btn, open);
    };
    paint('formation', this._deployOpenDropdown === 'formation');
    paint('cavalry', this._deployOpenDropdown === 'cavalry');
    paint('direction', this._deployOpenDropdown === 'direction');
    paint('lines', this._deployOpenDropdown === 'lines');
    paint('tactics', this._deployOpenDropdown === 'tactics');
    paint('strategy', this._deployOpenDropdown === 'strategy');
  }

  private _deployFormationShortLabel(fmt: 'F1' | 'F2' | 'F3'): string {
    if (fmt === 'F1') return 'Dystans';
    if (fmt === 'F2') return 'Piechota';
    return 'Obl\u0119\u017Cenie';
  }

  private _deployCavalryShortLabel(mode: CavalryDeployMode): string {
    return mode === 'flanks' ? 'Konnica z boku' : 'Konnica z ty\u0142u';
  }

  /** C-FLANK: etykieta chipu kierunku natarcia (front/bok/tyl). */
  private _deployAttackDirShortLabel(dir: AttackDirection): string {
    if (dir === 'bok') return 'Natarcie: bok';
    if (dir === 'tyl') return 'Natarcie: ty\u0142';
    return 'Natarcie: front';
  }

  /** Dolny pasek: chipy aktywnej formacji, linii i konnicy (jedna linia). */
  private _updateDeployToolbarStatus(): void {
    const el = this._deployToolbarStatus;
    if (!el) return;
    el.innerHTML = '';

    const mkChip = (text: string): HTMLSpanElement => {
      const c = document.createElement('span');
      c.textContent = text;
      Object.assign(c.style, {
        fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.05em',
        padding: '2px 6px', borderRadius: '4px',
        color: '#fff8dc', background: 'rgba(232,216,138,0.18)',
        border: `1px solid ${BATTLE_GOLD}`,
        whiteSpace: 'nowrap',
      });
      return c;
    };

    const groups = this._sortedGroupIds();
    const gid = this._resolveDeployPopupGroupId();

    if (!this.deployPhase && this.started) {
      const units = this._resolveDeployPopupUnits();
      if (units.length === 1) {
        el.appendChild(mkChip(this._unitDisplayLabel(units[0]!)));
        const doc = this._getEffectiveDoctrine(units[0]!);
        el.appendChild(mkChip(this._doctrineLabel(doc)));
        if (this._isUnitDoctrineAuto(units[0]!)) el.appendChild(mkChip('AUTO'));
        else el.appendChild(mkChip('RECZNY'));
      } else if (units.length > 1) {
        const docs = units.map(u => this._getEffectiveDoctrine(u));
        const allSame = docs.every(d => d === docs[0]);
        el.appendChild(mkChip(units.length + ' j.'));
        el.appendChild(mkChip(allSame ? this._doctrineLabel(docs[0]!) : 'MIESZANE'));
      } else if (gid) {
        const meta = this._ensureGroupMeta(gid);
        el.appendChild(mkChip(this._groupDisplayLabel(gid)));
        el.appendChild(mkChip(this._doctrineLabel(meta.doctrine)));
        if (meta.autoPlay) el.appendChild(mkChip('AUTO'));
        else el.appendChild(mkChip('RECZNY'));
      }
      return;
    }

    el.appendChild(mkChip(this._deployFormationShortLabel(this._deployActiveFormation)));
    el.appendChild(mkChip('P: ' + this._deployMeleeLines + ' lin.'));
    el.appendChild(mkChip('D: ' + this._deployArcherLines + ' lin.'));
    el.appendChild(mkChip(this._deployCavalryShortLabel(this._deployCavalryMode)));
    el.appendChild(mkChip(this._deployAttackDirShortLabel(this._deployAttackDirection)));

    if (groups.length > 0 && gid) {
      el.insertBefore(mkChip(this._groupDisplayLabel(gid)), el.firstChild);
      const doc = this._ensureGroupMeta(gid).doctrine;
      if (doc !== 'manual') {
        el.appendChild(mkChip(this._doctrineLabel(doc)));
      }
    }
  }

  /** Aktywna grupa w popupach Taktyka / Strategia. */
  private _resolveDeployPopupGroupId(): string | null {
    const groups = this._sortedGroupIds();
    if (groups.length === 0) return null;
    const selUnits = [...this._selectedUnits]
      .map(id => this._findPlayerUnit(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    const groupIds = [...new Set(selUnits.map(u => u.groupId).filter(Boolean))];
    const singleGid = groupIds.length === 1 && selUnits.every(u => u.groupId === groupIds[0])
      ? groupIds[0]! : null;
    let gid = singleGid ?? this._deployActiveGroupId;
    if (!gid || !groups.includes(gid)) gid = groups[0]!;
    this._deployActiveGroupId = gid;
    return gid;
  }

  private _priorityShortLabel(prefs: BattleUnitClass[]): string {
    return prefs.map(c => c === 'mounted' ? 'K' : c === 'ranged' ? '\u0141' : 'P').join('\u2192');
  }

  private _appendDeployPriorityBlock(
    parent: HTMLElement,
    title: string,
    getPrefs: (cls: BattleUnitClass) => BattleUnitClass[],
    setPrefs: (cls: BattleUnitClass, prefs: BattleUnitClass[]) => void,
    onChange: () => void,
  ): void {
    const hdr = document.createElement('div');
    hdr.textContent = title;
    Object.assign(hdr.style, {
      fontFamily: BATTLE_FONT, fontWeight: '700', fontSize: '12px',
      letterSpacing: '0.08em', textTransform: 'uppercase', color: BATTLE_GOLD,
      marginBottom: '0', marginTop: '0',
    });
    parent.appendChild(hdr);

    const hint = document.createElement('div');
    hint.textContent = 'Kogo atakowa\u0107 w pierwszej kolejno\u015Bci (1\u21922\u21923):';
    Object.assign(hint.style, {
      fontSize: '11px', color: BATTLE_TEXT_DIM, margin: '3px 0 6px', lineHeight: '1.35',
    });
    parent.appendChild(hint);

    const classOptions = ['mounted', 'ranged', 'melee'] as const;
    const mkSelect = (
      cls: BattleUnitClass, slot: number, prefs: BattleUnitClass[],
    ): HTMLSelectElement => createBattlePrioritySelect1E(
      prefs[slot]! as BattleClassKind,
      classOptions,
      (val) => {
        const next = [...getPrefs(cls)];
        const oldIdx = next.indexOf(val);
        if (oldIdx >= 0 && oldIdx !== slot) next[oldIdx] = next[slot]!;
        next[slot] = val;
        setPrefs(cls, next);
        onChange();
      },
    );

    for (const cls of classOptions) {
      const prefs = getPrefs(cls);
      parent.appendChild(createBattleClassTypeRow(cls));
      for (let slot = 0; slot < 3; slot++) {
        const row = document.createElement('div');
        Object.assign(row.style, {
          display: 'grid', gridTemplateColumns: '22px 1fr', alignItems: 'center',
          gap: '8px', marginBottom: '6px',
        });
        const lbl = document.createElement('span');
        lbl.textContent = (slot + 1) + '.';
        Object.assign(lbl.style, {
          fontFamily: BATTLE_FONT, fontWeight: '700', fontSize: '12px',
          color: '#a08030', textAlign: 'center',
        });
        row.appendChild(lbl);
        row.appendChild(mkSelect(cls, slot, prefs));
        parent.appendChild(row);
      }
    }
  }

  /** Popup Taktyka — doktryny per jednostka lub wspolnie dla zaznaczenia. */
  private _renderDeployTacticsPopup(popup: HTMLDivElement): void {
    const body = popup.querySelector('#deploy-tactics-popup') as HTMLDivElement | null
      ?? popup.firstElementChild as HTMLDivElement | null;
    if (!body) return;
    body.innerHTML = '';

    const units = this._resolveDeployPopupUnits();
    if (units.length === 0) {
      body.textContent = 'Zaznacz jednostk\u0119 (Ctrl+LPM = tylko ta) \u2014 Taktyka dotyczy zaznaczenia.';
      Object.assign(body.style, { fontSize: '10px', color: BATTLE_TEXT_DIM, padding: '4px' });
      return;
    }

    const doctrines = units.map(u => this._getEffectiveDoctrine(u));
    const allSame = doctrines.every(d => d === doctrines[0]);
    const doc = allSame ? doctrines[0]! : null;

    const hdr = document.createElement('div');
    if (units.length === 1) {
      hdr.textContent = this._unitDisplayLabel(units[0]!);
    } else if (allSame) {
      hdr.textContent = units.length + ' jednostek \u00B7 ' + this._doctrineLabel(doc!);
    } else {
      hdr.textContent = units.length + ' jednostek \u00B7 mieszane';
    }
    Object.assign(hdr.style, {
      fontSize: '10px', color: BATTLE_GOLD, fontWeight: 'bold', marginBottom: '4px',
      letterSpacing: '0.06em',
    });
    body.appendChild(hdr);

    const hint = document.createElement('div');
    if (units.length === 1) {
      hint.textContent = this.deployPhase
        ? 'Postawa taktyczna tej jednostki (auto):'
        : 'Postawa taktyczna \u2014 jednostka wykona ja na turze (SPACJA):';
    } else if (allSame) {
      hint.textContent = 'Wsp\u00F3lna postawa \u2014 klik ustawia wszystkim zaznaczonym:';
    } else {
      hint.textContent = 'R\u00F3\u017Cne postawy \u2014 klik ustawia wszystkim zaznaczonym:';
    }
    Object.assign(hint.style, {
      fontSize: '9px', color: BATTLE_TEXT_DIM, marginBottom: '6px', lineHeight: '1.35',
    });
    body.appendChild(hint);

    const docRow = document.createElement('div');
    Object.assign(docRow.style, {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
    });

    const mkDoc = (label: string, d: GroupDoctrine, icon: string): HTMLElement => {
      const active = doc === d;
      // kind domyslny 'all' (nie klasa) — zawsze zwraca <button>, nie owinięty w pigułkę.
      const b = this._makeDeployQuickBtn(label, active, () => {
        this._setUnitsDoctrine(units, d);
        if (units.length === 1 && units[0]!.groupId) {
          this._deployActiveGroupId = units[0]!.groupId;
        }
        this._renderDeployTacticsPopup(popup);
        this._updateDeployToolbarStatus();
      }, { fullWidth: true }) as HTMLButtonElement;
      b.innerHTML = buildDeployTacticCellHtml(icon, label);
      Object.assign(b.style, {
        padding: '12px 10px', width: '100%', textAlign: 'center',
        justifyContent: 'center', borderRadius: '9px',
      });
      applyDeployPopupItem1E(b);
      paintDeployPopupOption(b, active);
      return b;
    };

    docRow.appendChild(mkDoc('Obrona', 'defensive', DEPLOY_TACTIC_SVG.defensive));
    docRow.appendChild(mkDoc('Atak', 'steady', DEPLOY_TACTIC_SVG.steady));
    docRow.appendChild(mkDoc('Szturm', 'aggressive', DEPLOY_TACTIC_SVG.aggressive));
    docRow.appendChild(mkDoc('Ostrza\u0142', 'skirmish', DEPLOY_TACTIC_SVG.skirmish));
    body.appendChild(docRow);
  }

  /** Popup Strategia — priorytety celów armii i per grupa. */
  private _renderDeployStrategyPopup(popup: HTMLDivElement): void {
    const body = popup.querySelector('#deploy-strategy-popup') as HTMLDivElement | null
      ?? popup.firstElementChild as HTMLDivElement | null;
    if (!body) return;
    body.innerHTML = '';

    const outer = popup.parentElement as HTMLDivElement | null;
    if (outer?.dataset.deployDropdown === 'strategy') {
      Object.assign(outer.style, {
        padding: '0', background: 'transparent', border: 'none', boxShadow: 'none',
      });
    }

    Object.assign(body.style, {
      display: 'flex',
      flexDirection: 'column',
      width: '360px',
      maxWidth: '360px',
      maxHeight: 'min(480px, 62vh)',
      overflow: 'hidden',
      border: '2px solid rgba(232,216,138,0.5)',
      borderRadius: '14px',
      background: 'linear-gradient(180deg,rgba(22,28,38,.98),rgba(8,10,16,.98))',
      boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      color: BATTLE_TEXT,
      fontFamily: BATTLE_FONT,
    });

    const units = this._resolveDeployPopupUnits();
    const gid = units.length === 1 && units[0]!.groupId ? units[0]!.groupId : this._resolveDeployPopupGroupId();
    const meta = gid ? this._ensureGroupMeta(gid) : null;
    const rerender = (): void => this._renderDeployStrategyPopup(popup);

    if (units.length === 0) {
      body.textContent = 'Zaznacz jednostk\u0119 (Ctrl+LPM = tylko ta) \u2014 strategia dotyczy zaznaczenia.';
      Object.assign(body.style, {
        fontSize: '10px', color: BATTLE_TEXT_DIM, padding: '12px',
        display: 'block', maxHeight: 'none', border: 'none', boxShadow: 'none',
      });
      return;
    }

    const primary = units[0]!;
    const useOwnFlags = units.map(u => !!u.useUnitPriorities);
    const allSameUnitPri = useOwnFlags.every(f => f === useOwnFlags[0]);
    const useOwnUnit = allSameUnitPri ? !!useOwnFlags[0] : false;

    const topHdr = document.createElement('div');
    Object.assign(topHdr.style, {
      padding: '14px 18px',
      borderBottom: '1px solid rgba(232,216,138,0.22)',
      background: 'linear-gradient(90deg,rgba(232,216,138,0.12),transparent)',
      display: 'flex', alignItems: 'center', gap: '10px', flex: 'none',
    });
    const topIcon = document.createElement('span');
    Object.assign(topIcon.style, { display: 'inline-flex', color: BATTLE_GOLD, lineHeight: '0' });
    topIcon.innerHTML = STRATEGY_HEADER_SVG;
    const topTitle = document.createElement('span');
    topTitle.textContent = 'Strategia';
    Object.assign(topTitle.style, {
      fontFamily: BATTLE_FONT_TITLE, fontSize: '18px', letterSpacing: '0.08em', color: BATTLE_GOLD,
    });
    topHdr.appendChild(topIcon);
    topHdr.appendChild(topTitle);
    body.appendChild(topHdr);

    const scroll = document.createElement('div');
    Object.assign(scroll.style, {
      flex: '1',
      minHeight: '0',
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '16px 18px',
    });
    applyBattleRosterScrollbar(scroll);
    body.appendChild(scroll);

    const stickyFoot = document.createElement('div');
    Object.assign(stickyFoot.style, {
      flexShrink: '0',
      padding: '12px 18px',
      borderTop: '1px solid rgba(232,216,138,0.22)',
      background: 'linear-gradient(180deg,rgba(18,14,8,.92),rgba(12,10,6,.98))',
    });
    body.appendChild(stickyFoot);

    this._appendDeployPriorityBlock(
      scroll,
      'Priorytety armii',
      (cls) => [...this._targetPriorities[cls]],
      (cls, prefs) => { this._targetPriorities[cls] = prefs; },
      () => { rerender(); this._updateDeployToolbarStatus(); },
    );

    const resetArmy = document.createElement('button');
    resetArmy.textContent = 'Przywr\u00F3\u0107 domy\u015Blne (armia)';
    applyBattleStrategyOutlineBtn(resetArmy);
    resetArmy.addEventListener('click', (e) => {
      e.stopPropagation();
      this._targetPriorities = {
        mounted: [...BattleScene.DEFAULT_TARGET_PRIORITIES.mounted],
        ranged:  [...BattleScene.DEFAULT_TARGET_PRIORITIES.ranged],
        melee:   [...BattleScene.DEFAULT_TARGET_PRIORITIES.melee],
      };
      rerender();
      this._updateDeployToolbarStatus();
    });
    scroll.appendChild(resetArmy);

    const divider = document.createElement('div');
    Object.assign(divider.style, {
      height: '1px', background: 'rgba(232,216,138,0.2)', margin: '18px 0',
    });
    scroll.appendChild(divider);

    const grpHdr = document.createElement('div');
    if (units.length === 1) {
      grpHdr.textContent = 'Priorytety jednostki: ' + this._unitDisplayLabel(primary);
    } else if (allSameUnitPri) {
      grpHdr.textContent = 'Priorytety ' + units.length + ' zaznaczonych jednostek';
    } else {
      grpHdr.textContent = 'Priorytety ' + units.length + ' jednostek \u00B7 mieszane';
    }
    Object.assign(grpHdr.style, {
      fontFamily: BATTLE_FONT_TITLE, fontSize: '16px', color: BATTLE_GOLD,
      marginBottom: '4px',
    });
    scroll.appendChild(grpHdr);

    const toggleRow = document.createElement('label');
    Object.assign(toggleRow.style, {
      display: 'flex', alignItems: 'center', gap: '9px',
      fontSize: '13px', color: '#c8b898', margin: '10px 0 4px', cursor: 'pointer',
    });
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = useOwnUnit;
    applyBattleCheckbox1E(toggle);
    toggle.addEventListener('change', () => {
      for (const u of units) {
        u.useUnitPriorities = toggle.checked;
        if (toggle.checked && !u.unitTargetPriorities) {
          u.unitTargetPriorities = {
            mounted: [...this._targetPriorities.mounted],
            ranged:  [...this._targetPriorities.ranged],
            melee:   [...this._targetPriorities.melee],
          };
        }
      }
      rerender();
      this._updateDeployToolbarStatus();
    });
    toggleRow.appendChild(toggle);
    toggleRow.appendChild(document.createTextNode(
      units.length === 1
        ? 'W\u0142asne priorytety tej jednostki'
        : 'W\u0142asne priorytety zaznaczonych jednostek',
    ));
    scroll.appendChild(toggleRow);

    if (useOwnUnit) {
      if (!primary.unitTargetPriorities) {
        primary.unitTargetPriorities = {
          mounted: [...this._targetPriorities.mounted],
          ranged:  [...this._targetPriorities.ranged],
          melee:   [...this._targetPriorities.melee],
        };
      }
      const up = primary.unitTargetPriorities;
      this._appendDeployPriorityBlock(
        scroll,
        units.length === 1 ? 'Kolejno\u015B\u0107 cel\u00F3w jednostki' : 'Kolejno\u015B\u0107 cel\u00F3w (zaznaczenie)',
        (cls) => [...(up[cls] ?? this._targetPriorities[cls])],
        (cls, prefs) => {
          for (const u of units) {
            if (!u.unitTargetPriorities) {
              u.unitTargetPriorities = {
                mounted: [...this._targetPriorities.mounted],
                ranged:  [...this._targetPriorities.ranged],
                melee:   [...this._targetPriorities.melee],
              };
            }
            u.unitTargetPriorities[cls] = prefs;
            u.useUnitPriorities = true;
          }
        },
        () => { rerender(); this._updateDeployToolbarStatus(); },
      );
      const resetUnit = document.createElement('button');
      resetUnit.textContent = 'Skopiuj z priorytet\u00F3w armii';
      applyBattleStrategyGoldCta(resetUnit);
      resetUnit.addEventListener('click', (e) => {
        e.stopPropagation();
        const copy = {
          mounted: [...this._targetPriorities.mounted],
          ranged:  [...this._targetPriorities.ranged],
          melee:   [...this._targetPriorities.melee],
        };
        for (const u of units) {
          u.unitTargetPriorities = {
            mounted: [...copy.mounted],
            ranged:  [...copy.ranged],
            melee:   [...copy.melee],
          };
          u.useUnitPriorities = true;
        }
        rerender();
      });
      stickyFoot.appendChild(resetUnit);
    } else if (meta && gid) {
      const useGrp = !!meta.useGroupPriorities;
      const grpNote = document.createElement('div');
      grpNote.textContent = useGrp
        ? 'Jednostka dziedziczy priorytety grupy ' + this._groupDisplayLabel(gid) + '.'
        : 'Jednostka u\u017Cywa priorytet\u00F3w armii (powy\u017Cej).';
      Object.assign(grpNote.style, {
        fontSize: '11px', color: BATTLE_TEXT_DIM, lineHeight: '1.35', marginBottom: '4px',
      });
      scroll.appendChild(grpNote);
    } else {
      const note = document.createElement('div');
      note.textContent = 'Jednostka u\u017Cywa priorytet\u00F3w armii (powy\u017Cej).';
      Object.assign(note.style, {
        fontSize: '11px', color: BATTLE_TEXT_DIM, lineHeight: '1.35', marginBottom: '4px',
      });
      scroll.appendChild(note);
    }
  }

  /** Popup Linie: piechota i dystansowe — osobno 1 / 2 / 3 linie glebokosci. */
  private _renderDeployLinesPopup(popup: HTMLDivElement): void {
    const body = popup.querySelector('#deploy-lines-popup') as HTMLDivElement | null
      ?? popup.firstElementChild as HTMLDivElement | null;
    if (!body) return;
    body.innerHTML = '';

    const mkSection = (
      title: string,
      kind: 'melee' | 'archer',
      active: DeployLineCount,
      headerIcon?: string,
    ): void => {
      const hdr = document.createElement('div');
      if (headerIcon) {
        hdr.innerHTML =
          '<span style="display:inline-flex;align-items:center;gap:6px;">' +
          `<span style="display:inline-flex;line-height:0;color:${BATTLE_GOLD};">${headerIcon}</span>` +
          `<span>${title}</span></span>`;
      } else {
        hdr.textContent = title;
      }
      Object.assign(hdr.style, {
        fontSize: '10px', color: BATTLE_GOLD, fontWeight: 'bold',
        marginBottom: '4px', letterSpacing: '0.06em',
      });
      body.appendChild(hdr);

      const row = document.createElement('div');
      Object.assign(row.style, { display: 'flex', gap: '4px', marginBottom: '8px' });

      for (const n of [1, 2, 3] as DeployLineCount[]) {
        const on = active === n;
        // kind domyslny 'all' (nie klasa) — zawsze zwraca <button>, nie owinięty w pigułkę.
        const b = this._makeDeployQuickBtn(String(n), on, () => {
          if (kind === 'melee') this._setDeployMeleeLines(n);
          else this._setDeployArcherLines(n);
          this._applyDeployLineSettings();
          this._renderDeployLinesPopup(popup);
          this._updateDeployToolbarStatus();
          const who = kind === 'melee' ? DEPLOY_KIND_LABEL.melee : DEPLOY_KIND_LABEL.ranged;
          this._showDeployFeedback(who + ': ' + n + ' linie');
        }) as HTMLButtonElement;
        b.dataset.deployLinesKind = kind;
        b.dataset.deployLinesCount = String(n);
        Object.assign(b.style, {
          flex: '1', padding: '0', fontSize: '11px', textAlign: 'center', minHeight: '34px',
        });
        applyDeployPopupItem1E(b);
        paintDeployPopupOption(b, on);
        row.appendChild(b);
      }
      body.appendChild(row);
    };

    mkSection(DEPLOY_KIND_LABEL.melee, 'melee', this._deployMeleeLines, ROSTER_TYPE_SVG.melee.replace(/width="14"/g, 'width="17"').replace(/height="14"/g, 'height="17"'));
    mkSection(DEPLOY_KIND_LABEL.ranged, 'archer', this._deployArcherLines, DEPLOY_SCOPE_SVG);
  }

  /** Ikony typów + liczby dla bieżącego zaznaczenia. */
  private _selectionTypeCountsHtml(units: RuntimeBattleUnit[]): string {
    const counts = { mounted: 0, melee: 0, ranged: 0 };
    for (const u of units) counts[this._deployRowKind(u)]++;
    return rosterTypeCountsHtml(counts);
  }

  /** Lewy panel rosteru: licznik rozstawionych + zaznaczenie + Grupuj/Rozgrupuj. */
  private _updateDeployRosterCountLine(): void {
    if (!this._deployRosterCount || !this.deployPhase) return;
    const live = this._playerRoster().filter(u => !u.dead && !u.removed).length;
    this._deployRosterCount.textContent = 'Rozstawiono: ' + live + ' jednostek';
  }

  /** Lewy panel rosteru: pasek zaznaczenia — ten sam co w walce (deploy też). */
  private _updateDeployToolbarSelection(): void {
    if (this.deployPhase) {
      this._updateBattleRosterHeader();
      this._updateBattleSelectionBar();
      this._updateBattleQuickSelectBar();
      return;
    }
    this._updateDeployRosterCountLine();
    const bar = this._deploySelBar;
    if (!bar || !this.deployPhase) return;
    bar.innerHTML = '';

    const selUnits = [...this._selectedUnits]
      .map(id => this._findUnitById(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);

    const groupIds = [...new Set(selUnits.map(u => u.groupId).filter(Boolean))];
    const singleGid = groupIds.length === 1 && selUnits.every(u => u.groupId === groupIds[0])
      ? groupIds[0]! : null;
    const canGroup = selUnits.length >= 2 && !(
      singleGid && selUnits.length === this._liveGroupMemberIds(singleGid).length
    );
    const canUngroup = groupIds.length > 0;

    const mkBtn = (
      text: string,
      onClick: () => void,
      gold: boolean,
      group: boolean,
      disabled: boolean,
      action: 'clear' | 'group' | 'ungroup',
    ): HTMLButtonElement => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.rosterAction = action;
      if (disabled) b.dataset.rosterMuted = '1';
      if (group) {
        b.innerHTML = groupBtnLabelHtml('Grupuj');
        applySelectionActionBtn1E(b, true, disabled);
      } else {
        b.textContent = text;
        applySelectionActionBtn1E(b, gold, disabled);
      }
      return b;
    };

    bar.appendChild(mkBtn('Odznacz', () => this._clearDeploySelectionState(), true, false, selUnits.length === 0, 'clear'));
    bar.appendChild(mkBtn('', () => this._groupSelected(), true, true, !canGroup, 'group'));
    bar.appendChild(mkBtn('Rozgrupuj', () => this._ungroupSelected(), false, false, !canUngroup, 'ungroup'));
    this._updateDeployRosterFooter(selUnits, singleGid);
  }

  /**
   * Jeden listener (capture) na panelu rosteru — chipy grup/typów i Grupuj/Rozgrupuj
   * działają nawet gdy innerHTML pasków jest odbudowywany co klatkę.
   */
  private _bindDeployRosterChromeClicks(dock: HTMLDivElement): void {
    if (dock.dataset.rosterRoute === '1') return;
    dock.dataset.rosterRoute = '1';
    dock.addEventListener('click', (e: MouseEvent) => {
      if (!this.deployPhase) return;
      const hit = (e.target as HTMLElement).closest(
        '[data-roster-chip],[data-roster-action]',
      ) as HTMLElement | null;
      if (!hit || !dock.contains(hit)) return;
      e.preventDefault();
      e.stopPropagation();

      const action = hit.dataset.rosterAction;
      if (action === 'clear') {
        this._clearDeploySelectionState();
        return;
      }
      if (action === 'group') {
        if (hit.dataset.rosterMuted === '1') {
          this._showDeployFeedback('Zaznacz co najmniej 2 jednostki, potem \u25C6 Grupuj');
          return;
        }
        this._groupSelected();
        return;
      }
      if (action === 'ungroup') {
        if (hit.dataset.rosterMuted === '1') {
          this._showDeployFeedback('Zaznacz jednostki z grupy (chip Grupa N lub karta)');
          return;
        }
        this._ungroupSelected();
        return;
      }

      const chip = hit.dataset.rosterChip;
      if (chip === 'all') {
        this._selectDeployAllToggle();
        return;
      }
      if (chip === 'kind-mounted') {
        this._selectDeployByKindToggle('mounted');
        return;
      }
      if (chip === 'kind-melee') {
        this._selectDeployByKindToggle('melee');
        return;
      }
      if (chip === 'kind-ranged') {
        this._selectDeployByKindToggle('ranged');
        return;
      }
    }, true);
  }

  /** Klik zakładki grupy (belka rosteru lub dolna belka nad toolbarem). */
  private _handleDeployGroupTabClick(gid: string): void {
    this._deployActiveGroupId = gid;
    if (this._isDeploySelectionExactlyGroup(gid)) {
      this._clearDeploySelectionState();
      this._deployActiveGroupId = gid;
      this._updateDeployGroupsBar();
      this._syncDeployToolbarFromSelection();
      this._showDeployFeedback('Odznaczono \u00B7 nadal zarządzasz: ' + this._groupDisplayLabel(gid));
    } else {
      this._selectDeployGroupToggle(gid, true);
      this._showDeployFeedback('Zarządzasz: ' + this._groupDisplayLabel(gid)
        + ' (' + this._liveGroupMemberIds(gid).length + ' j.)');
    }
    this._updateDeployToolbarStatus();
  }

  /** Zakładka grupy na pasku zarządzania (deploy). */
  private _makeDeployGroupTab(gid: string): HTMLButtonElement {
    const cnt = this._liveGroupMemberIds(gid).length;
    const selected = this._isDeploySelectionExactlyGroup(gid);
    const managing = this._deployActiveGroupId === gid;
    const active = selected || managing;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.deployGroupTab = gid;
    btn.textContent = this._groupDisplayLabel(gid) + ' \u00B7 ' + cnt;
    applyDeployGroupTab1E(btn, active);
    btn.title = 'Klik = zaznacz grup\u0119 \u00B7 Ctrl+LPM = jedna jednostka (Taktyka per jednostka)';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._handleDeployGroupTabClick(gid);
    });
    return btn;
  }

  /** Stopka rosteru deploy — status zaznaczenia (C09 v4). */
  private _updateDeployRosterFooter(
    selUnits: RuntimeBattleUnit[],
    singleGid: string | null,
  ): void {
    const footer = this._deployRosterFooter;
    if (!footer) return;
    const status = footer.querySelector('#deploy-roster-footer-status') as HTMLSpanElement | null;
    const hint = footer.querySelector('#deploy-roster-footer-hint') as HTMLSpanElement | null;
    if (!status) return;
    const n = selUnits.length;
    const manageGid = this._deployActiveGroupId
      && this._sortedGroupIds().includes(this._deployActiveGroupId)
      ? this._deployActiveGroupId
      : null;
    if (n === 0) {
      status.textContent = manageGid
        ? 'Zarządzasz: ' + this._groupDisplayLabel(manageGid)
        : 'Zaznaczone: 0';
      status.style.color = manageGid ? BATTLE_GOLD : BATTLE_TEXT_DIM;
    } else if (singleGid) {
      status.textContent = 'Zaznaczone: ' + n + ' \u00B7 ' + this._groupDisplayLabel(singleGid);
      status.style.color = BATTLE_PLAYER_TEXT;
    } else {
      status.textContent = 'Zaznaczone: ' + n;
      status.style.color = BATTLE_GOLD;
    }
    if (hint) {
      if (n === 1 && selUnits[0]) {
        hint.textContent = 'Taktyka/Strategia: ' + this._unitDisplayLabel(selUnits[0]);
        hint.style.color = BATTLE_TEXT_DIM;
      } else if (n > 1) {
        const docs = selUnits.map(u => this._getEffectiveDoctrine(u));
        const mixed = !docs.every(d => d === docs[0]);
        hint.textContent = mixed
          ? 'Taktyka: ' + n + ' jednostek \u00B7 mieszane postawy'
          : 'Taktyka: ' + n + ' jednostek \u00B7 ' + this._doctrineLabel(docs[0]!);
        hint.style.color = BATTLE_TEXT_DIM;
      } else if (manageGid && this._deployRosterFeedback === hint) {
        const base = 'Formacja grupy ' + this._groupDisplayLabel(manageGid) + ' \u00B7 Taktyka = zaznaczenie (Ctrl+LPM)';
        if (!hint.textContent || hint.textContent.includes('Ctrl+LPM') || hint.textContent.includes('Formacja')) {
          hint.textContent = base;
          hint.style.color = BATTLE_TEXT_DIM;
        }
      }
    }
  }

  /** Przycisk formacji na pasku deploy. @deprecated — dropdown w toolbara deploy. */
  private _makeDeployFmtButton(
    svg: string, label: string, msg: string, fmt: 'F1' | 'F2' | 'F3',
  ): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.deployFmt = fmt;
    Object.assign(b.style, {
      flex: '1', maxWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '4px', padding: '8px 6px', borderRadius: '8px', cursor: 'pointer',
      color: BATTLE_GOLD, background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${BATTLE_GOLD_DIM}`, fontFamily: HUD_FONT,
    });
    b.innerHTML = svg + '<span style="font-size:9px;letter-spacing:0.05em;text-transform:uppercase;line-height:1.2;">'
      + label + '</span>';
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._setDeployActiveFormation(fmt);
      this._applyDeployArmyFormation(fmt);
      this._showDeployFeedback(msg);
    }, true);
    return b;
  }

  /** Przycisk ustawienia konnicy (boki / z tylu) — osobno od F1/F2/F3. */
  private _makeDeployCavButton(
    svg: string, label: string, msg: string, mode: CavalryDeployMode,
  ): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.deployCav = mode;
    Object.assign(b.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '2px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
      color: BATTLE_GOLD, background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${BATTLE_GOLD_DIM}`, fontFamily: HUD_FONT, minWidth: '64px',
    });
    b.innerHTML = svg + '<span style="font-size:9px;letter-spacing:0.05em;text-transform:uppercase;line-height:1.2;">'
      + label + '</span>';
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._applyDeployCavalryMode(mode);
      this._showDeployFeedback(msg);
    }, true);
    return b;
  }

  /** Feedback formacji w fazie rozstawiania. */
  private _showDeployFmtFeedback(hintEl: HTMLElement, msg: string): void {
    hintEl.textContent = 'Formacja: ' + msg;
    hintEl.style.color = '#7be08a';
    setTimeout(() => {
      hintEl.style.color = BATTLE_TEXT_DIM;
      hintEl.textContent = 'LPM: zaznacz \u00B7 PPM: odznacz \u00B7 drag: szeroko\u015B\u0107';
    }, 2500);
  }

  /**
   * UI fazy rozstawiania — ten sam lewy panel co w walce (`player-roster-bar`).
   */
  private _initDeployUI(): void {
    document.querySelectorAll('#deploy-detail-panel').forEach(el => el.remove());
    this._deployDetailPanel = null;
    document.getElementById('deploy-roster-dock')?.remove();
    this._deployRosterDock = null;
    this._deployUnitsRow = null;
    this._deployGroupsBar = null;
    this._deployStrategyBar = null;
    this._deployQuickSelectBar = null;
    this._deployRosterHeader = null;
    this._deployGroupsStrip = null;
    this._deployRowUnits = null;
    this._deployGroupTabs.clear();

    this._buildRosterBar();
    this._ensureBattleRosterChrome();
    if (this._rosterBar) {
      this._rosterBar.style.display = 'flex';
      this._rosterBar.style.visibility = 'visible';
    }

    if (this._selPanel) {
      this._selPanel.style.display = 'none';
    }

    this._groups.clear();
    this._groupCounter = 0;
    this._groupMeta.clear();
    for (const u of this._playerRoster()) {
      u.groupId = null;
      u.formationOffset = null;
      u.group.scale.setScalar(1.0);
    }

    this._buildDeployHalfLabels();
    this._initDeployGhostLayer();
    // R-BITWA-POWTORKA-I: mamy zapis grup z końca poprzedniej fazy rozstawiania
    // tej samej bitwy (_endDeployPhase) → odtwórz go (w tym ręczne rozgrupowanie)
    // zamiast na nowo auto-grupować po typie. Pusty zapis (size 0) = gracz miał
    // wszystko rozgrupowane — też przetwarza powtórkę. Brak zapisu (`null`,
    // pierwszy deploy) → świeża auto-grupa po typie.
    if (this._deployGroupSnapshot) {
      this._restoreDeployGroupSnapshot(this._deployGroupSnapshot);
      if (this._deployAttackDirSnapshot) {
        this._restoreDeployAttackDirSnapshot(this._deployAttackDirSnapshot);
      }
    } else {
      this._autoGroupDeployByKind();
    }
    this._updateBattleRosterHeader();
    this._updateDeployGroupsBar();
    this._updateDeployStrategyBar();
    this._updateBattleQuickSelectBar();
    this._updateBattleSelectionBar();
    this._updateRosterBar();
    this._updateSelectedPanel();
    if (this._groupSelectorBar) this._groupSelectorBar.style.display = 'none';
    this._syncRosterBottomInset();
    this._syncBattleToolbarMode();
    this._syncRendererSize();
    const fb = this._rosterBar?.querySelector('#battle-roster-feedback') as HTMLDivElement | null;
    if (fb) {
      fb.style.display = 'block';
      fb.textContent = 'LPM: zaznacz \u00B7 Ctrl+LPM: wiele \u00B7 PPM: odznacz';
    }
  }

  /**
   * Dolny inset lewego panelu rosteru. Zadanie #17: dawny pelnoszerokosciowy
   * dolny pasek zlikwidowany (klaster Reset/Start jest teraz pływajacy, prawy
   * dol) — panel rosteru (lewa strona) nie musi juz robic mu miejsca u dolu.
   */
  private _rosterBottomInsetPx(): number {
    return ROSTER_SCREEN_BOTTOM_GAP;
  }

  /** Ustawia bottom rosteru + minimapy względem dolnego toolbara (rail 56px — usunięty w TW v5). */
  private _syncRosterBottomInset(): void {
    const bottom = this._rosterBottomInsetPx() + 'px';
    if (this._rosterBar) this._rosterBar.style.bottom = bottom;
    if (this._deployRosterDock) this._deployRosterDock.style.bottom = bottom;
    this._syncSiegeHudLayout();
    this._syncMinimapPosition();
    this._syncDeployToolbarOffset();
  }

  /** Dolna krawędź paska fazy — panele oblężenia zaczynają się poniżej (stary pasek mocy usunięty). */
  private _battlePowerStackBottomPx(): number {
    return BATTLE_HEADER_H + 8;
  }

  /** Panele oblężenia — poza rosterem i paskiem fazy (prawy rail 56px zlikwidowany w TW v5). */
  private _syncSiegeHudLayout(): void {
    if (this.siegeWallCol < 0) return;
    let rosterW = 0;
    const rosterEl = (this.deployPhase && this._rosterBar?.isConnected)
      ? this._rosterBar
      : (this._rosterBar && (this._manualMode || this.started || this.deployPhase)
        ? this._rosterBar
        : this._deployRosterDock);
    if (rosterEl?.isConnected) rosterW = rosterEl.offsetWidth + 16;
    // 88px = ten sam inset co górny pasek (dawny rail 56 + margines), żeby panel nie wchodził pod przyciski.
    const railW = 88;
    layoutSiegeHud1E({
      rosterLeftPx: rosterW > 0 ? rosterW : 16,
      railRightPx: railW,
      topPanelPx: this._battlePowerStackBottomPx(),
      bottomReservePx: 0,
    });
  }

  /** Odtwarza zapis grup z końca poprzedniej fazy rozstawiania (R-BITWA-POWTORKA-I). */
  private _restoreDeployGroupSnapshot(snapshot: Map<string, string>): void {
    const byGroup = new Map<string, Set<string>>();
    for (const ru of this._playerRoster()) {
      if (ru.dead || ru.removed) continue;
      const gid = snapshot.get(ru.bu.id);
      if (!gid) continue;
      ru.groupId = gid;
      let set = byGroup.get(gid);
      if (!set) { set = new Set<string>(); byGroup.set(gid, set); }
      set.add(ru.bu.id);
      this._refreshUnitRingColor(ru);
      this._updateGroupFrameMarker(ru);
    }
    for (const [gid, memberIds] of byGroup) {
      if (memberIds.size === 0) continue;
      this._groups.set(gid, memberIds);
      this._ensureGroupMeta(gid);
      const n = parseInt(gid, 10);
      if (Number.isFinite(n)) this._groupCounter = Math.max(this._groupCounter, n);
    }
    this._pruneStaleGroups();
    this._selectedUnits.clear();
    for (const gid of this._sortedGroupIds()) {
      this._rosterGroupCollapsed.delete(gid);
    }
    this._rebuildDeployRosterGrid();
    this._refreshDeploySelectionVisuals();
  }

  /** Odtwarza kierunek natarcia (C-FLANK) po powtórce bitwy w fazie deploy. */
  private _restoreDeployAttackDirSnapshot(snapshot: Map<string, AttackDirection>): void {
    const groupDirs = new Map<string, AttackDirection>();
    for (const ru of this._playerRoster()) {
      if (ru.dead || ru.removed) continue;
      const dir = snapshot.get(ru.bu.id) ?? 'front';
      ru.attackDirection = dir;
      if (ru.groupId) groupDirs.set(ru.groupId, dir);
    }
    for (const [gid, dir] of groupDirs) {
      this._ensureGroupMeta(gid).attackDirection = dir;
    }
    const live = this._playerRoster().filter(u => !u.dead && !u.removed);
    const first = live[0];
    if (first) this._setDeployAttackDirection(first.attackDirection);
  }

  /** Start deploy: osobne grupy Konnica / Piechota / Łucznicy (playtest POLE-BITWY). */
  private _autoGroupDeployByKind(): void {
    const kinds: Array<'mounted' | 'melee' | 'ranged'> = ['mounted', 'melee', 'ranged'];
    for (const kind of kinds) {
      const units = this._playerRoster().filter(u =>
        !u.dead && !u.removed && this._deployRowKind(u) === kind,
      );
      if (units.length < 2) continue;
      this._selectedUnits.clear();
      for (const u of units) this._selectedUnits.add(u.bu.id);
      this._groupSelected();
    }
    this._selectedUnits.clear();
    for (const gid of this._sortedGroupIds()) {
      this._rosterGroupCollapsed.delete(gid);
    }
    this._rebuildDeployRosterGrid();
    this._refreshDeploySelectionVisuals();
  }

  /** Upewnij się, że dock ma pasek akcji + stopkę C09 (migracja ze starego DOM). */
  private _ensureDeployC09Chrome(): void {
    const dock = this._deployRosterDock
      ?? document.getElementById('deploy-roster-dock') as HTMLDivElement | null;
    if (!dock) return;
    this._deployRosterDock = dock;

    dock.querySelector('#deploy-roster-unit-bar')?.remove();

    let actionBar = dock.querySelector('#deploy-roster-action-bar') as HTMLDivElement | null;
    if (!actionBar) {
      actionBar = document.createElement('div');
      actionBar.id = 'deploy-roster-action-bar';
      applyRosterActionBar1E(actionBar);
      const quick = dock.querySelector('#deploy-quick-select');
      const scroll = dock.querySelector('#deploy-roster-scroll');
      if (quick?.nextSibling) dock.insertBefore(actionBar, quick.nextSibling);
      else if (scroll) dock.insertBefore(actionBar, scroll);
      else dock.appendChild(actionBar);
    }
    this._deploySelBar = actionBar;

    let groupsBar = dock.querySelector('#deploy-groups-bar') as HTMLDivElement | null;
    if (!groupsBar) {
      groupsBar = document.createElement('div');
      groupsBar.id = 'deploy-groups-bar';
      applyDeployGroupManagerBar1E(groupsBar);
      Object.assign(groupsBar.style, { display: 'none' });
      const quick = dock.querySelector('#deploy-quick-select');
      const scroll = dock.querySelector('#deploy-roster-scroll');
      if (actionBar) dock.insertBefore(groupsBar, actionBar);
      else if (scroll) dock.insertBefore(groupsBar, scroll);
      else if (quick?.nextSibling) dock.insertBefore(groupsBar, quick.nextSibling);
      else dock.appendChild(groupsBar);
    }
    this._deployGroupsBar = groupsBar;

    let footer = dock.querySelector('#deploy-roster-footer') as HTMLDivElement | null;
    if (!footer) {
      footer = document.createElement('div');
      footer.id = 'deploy-roster-footer';
      applyRosterFooter1E(footer);
      const status = document.createElement('span');
      status.id = 'deploy-roster-footer-status';
      status.textContent = 'Zaznaczone: 0';
      footer.appendChild(status);
      const hint = document.createElement('span');
      hint.id = 'deploy-roster-footer-hint';
      hint.textContent = 'Ctrl+LPM = wielokrotne';
      hint.style.color = BATTLE_PLAYER_TEXT;
      footer.appendChild(hint);
      dock.appendChild(footer);
    }
    Object.assign(footer.style, {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '4px',
    });
    const hintEl = footer.querySelector('#deploy-roster-footer-hint') as HTMLSpanElement | null;
    if (hintEl) {
      Object.assign(hintEl.style, {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        maxWidth: '100%',
        lineHeight: '1.35',
      });
    }
    this._deployRosterFooter = footer;
    this._deployRosterFeedback = footer.querySelector('#deploy-roster-footer-hint') as HTMLDivElement | null;
    this._updateDeployToolbarSelection();
    this._normalizeDeployRosterChromeOrder(dock);
    this._bindDeployRosterChromeClicks(dock);
  }

  /** Kolejność: filtry → grupy → akcje (przed scrollem kart). */
  private _normalizeDeployRosterChromeOrder(dock: HTMLDivElement): void {
    const quick = dock.querySelector('#deploy-quick-select');
    const groups = dock.querySelector('#deploy-groups-bar');
    const action = dock.querySelector('#deploy-roster-action-bar');
    const scroll = dock.querySelector('#deploy-roster-scroll');
    if (!quick || !groups || !action || !scroll) return;
    let anchor: Element = scroll;
    dock.insertBefore(action, anchor);
    anchor = action;
    dock.insertBefore(groups, anchor);
    anchor = groups;
    dock.insertBefore(quick, anchor);
  }

  /** @deprecated — zastąpione przez _ensureDeployC09Chrome. */
  private _ensureDeployRosterUnitBar(): void {
    this._ensureDeployC09Chrome();
  }

  private _buildDeployRosterDock(): void {
    if (this._deployRosterDock) {
      this._deployRosterDock.style.bottom = '16px';
      applyRosterPanel1E(this._deployRosterDock);
      this._ensureDeployRosterUnitBar();
      this._normalizeDeployRosterChromeOrder(this._deployRosterDock);
      this._bindDeployRosterChromeClicks(this._deployRosterDock);
      this._rebuildDeployRosterGrid();
      this._syncRosterColumnLayout();
      return;
    }

    const dock = document.createElement('div');
    dock.id = 'deploy-roster-dock';
    Object.assign(dock.style, {
      position:       'fixed',
      left:           '16px',
      top:            (BATTLE_TOP_BAR_H + 8) + 'px',
      bottom:         '16px',
      width:          ROSTER_PANEL_FIXED_W + 'px',
      minWidth:       ROSTER_PANEL_FIXED_W + 'px',
      maxWidth:       ROSTER_PANEL_FIXED_W + 'px',
      zIndex:         '100050',
      pointerEvents:  'auto',
      display:        'flex',
      flexDirection:  'column',
      padding:        '0',
      boxSizing:      'border-box',
      overflow:       'hidden',
    });
    applyRosterPanel1E(dock);

    const hdr = document.createElement('div');
    hdr.id = 'deploy-roster-header';
    applyRosterHeaderSection1E(hdr);
    Object.assign(hdr.style, {
      display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', marginBottom: '0', lineHeight: '1.15',
    });
    dock.appendChild(hdr);
    this._deployRosterHeader = hdr;

    const quickBar = document.createElement('div');
    quickBar.id = 'deploy-quick-select';
    applyRosterFilterBar1E(quickBar);
    dock.appendChild(quickBar);
    this._deployQuickSelectBar = quickBar;

    const groupsBar = document.createElement('div');
    groupsBar.id = 'deploy-groups-bar';
    applyDeployGroupManagerBar1E(groupsBar);
    Object.assign(groupsBar.style, { display: 'none' });
    dock.appendChild(groupsBar);
    this._deployGroupsBar = groupsBar;

    const actionBar = document.createElement('div');
    actionBar.id = 'deploy-roster-action-bar';
    applyRosterActionBar1E(actionBar);
    dock.appendChild(actionBar);
    this._deploySelBar = actionBar;

    const strategyBar = document.createElement('div');
    strategyBar.id = 'deploy-strategy-bar';
    Object.assign(strategyBar.style, {
      display: 'none', flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch', gap: '4px',
      marginBottom: '6px', padding: '4px 6px', borderRadius: '6px',
      background: 'rgba(20,30,40,0.5)', border: '1px solid rgba(90,155,212,0.25)',
      flexShrink: '0',
    });
    dock.appendChild(strategyBar);
    this._deployStrategyBar = strategyBar;

    const scroll = document.createElement('div');
    scroll.id = 'deploy-roster-scroll';
    Object.assign(scroll.style, {
      flex: '1', minHeight: '0', overflowY: 'auto', overflowX: 'hidden',
      background: 'transparent',
      position: 'relative',
      zIndex: '1',
      boxSizing: 'border-box',
      scrollbarGutter: 'stable',
      padding: '12px 22px 12px 12px',
    });
    dock.appendChild(scroll);
    applyBattleRosterScrollbar(scroll);
    this._deployRosterScroll = scroll;

    const unitsRow = document.createElement('div');
    unitsRow.id = 'deploy-units-row';
    Object.assign(unitsRow.style, {
      display: 'flex', flexDirection: 'column', gap: '4px',
      width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box',
    });
    scroll.appendChild(unitsRow);
    this._deployUnitsRow = unitsRow;
    this._deployRosterGridEl = unitsRow;
    this._deployLooseCards = null;
    this._unitCards.clear();

    const footer = document.createElement('div');
    footer.id = 'deploy-roster-footer';
    applyRosterFooter1E(footer);
    const footerStatus = document.createElement('span');
    footerStatus.id = 'deploy-roster-footer-status';
    footerStatus.textContent = 'Zaznaczone: 0';
    footer.appendChild(footerStatus);
    const footerHint = document.createElement('span');
    footerHint.id = 'deploy-roster-footer-hint';
    footerHint.textContent = 'Ctrl+LPM = wielokrotne';
    footerHint.style.color = BATTLE_PLAYER_TEXT;
    Object.assign(footerHint.style, {
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      maxWidth: '100%',
      lineHeight: '1.35',
    });
    footer.appendChild(footerHint);
    Object.assign(footer.style, {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '4px',
    });
    dock.appendChild(footer);
    this._deployRosterFooter = footer;
    this._deployRosterFeedback = footerHint;

    document.body.appendChild(dock);
    this._deployRosterDock = dock;
    this._bindDeployRosterChromeClicks(dock);

    if (!this._deployLayoutListener) {
      this._deployLayoutListener = () => {
        if (this.deployPhase) this._syncDeployPanelLayout();
        else if (this._rosterBar) this._syncBattleRosterPanelLayout();
      };
      window.addEventListener('resize', this._deployLayoutListener);
    }

    this._rebuildDeployRosterGrid();
    this._syncDeployToolbarOffset();
    this._syncRosterColumnLayout();
    this._updateDeployRosterHeader();
    this._updateDeployToolbarSelection();
    requestAnimationFrame(() => {
      this._syncDeployPanelLayout();
      requestAnimationFrame(() => this._syncDeployPanelLayout());
    });
  }

  private _deployLayoutListener: (() => void) | null = null;
  /** Guard — _rebuildDeployRosterGrid ↔ _updateRosterBar ↔ _ensureDeployRowRefs. */
  private _rebuildDeployRosterGridBusy = false;

  /**
   * Metryki siatki + skalowanie kart w kontenerze rosteru.
   * availH/W = obszar scrolla — chipy wypełniają panel (max 6×5, potem skala + scroll).
   */
  private _rosterScrollAvailH(deploy: boolean): number {
    if (deploy && (this._deployRosterScroll || this._rosterBar)) {
      const scrollEl = this._deployRosterScroll
        ?? this._rosterBar?.querySelector('#battle-roster-scroll') as HTMLDivElement | null;
      if (scrollEl) return Math.max(80, scrollEl.clientHeight);
    }
    if (!deploy && this._rosterBar) {
      const scrollEl = this._rosterBar.querySelector('#battle-roster-scroll') as HTMLDivElement | null
        ?? this._rosterBar.querySelector('[data-roster-scroll]') as HTMLDivElement | null;
      if (scrollEl) return Math.max(80, scrollEl.clientHeight);
    }
    return 0;
  }

  private _rosterScrollAvailW(deploy: boolean): number {
    if (deploy && (this._deployRosterScroll || this._rosterBar)) {
      const scrollEl = this._deployRosterScroll
        ?? this._rosterBar?.querySelector('#battle-roster-scroll') as HTMLDivElement | null;
      if (scrollEl) return Math.max(120, scrollEl.clientWidth - 4);
    }
    if (!deploy && this._rosterBar) {
      const scrollEl = this._rosterBar.querySelector('#battle-roster-scroll') as HTMLDivElement | null;
      if (scrollEl) return Math.max(120, scrollEl.clientWidth - 4);
    }
    if (this._deployRosterDock) {
      return Math.max(120, ROSTER_PANEL_FIXED_W - ROSTER_SCROLLBAR_RESERVE - 20);
    }
    return Math.max(120, ROSTER_PANEL_FIXED_W - ROSTER_SCROLLBAR_RESERVE - 20);
  }

  private _layoutRosterCardGrid(
    container: HTMLDivElement,
    unitCount: number,
    deploy: boolean,
    availH?: number,
    availW?: number,
  ): RosterGridMetrics {
    const baseH = deploy ? DEPLOY_ROSTER_CARD_H : BATTLE_ROSTER_CARD_H;
    const h = availH ?? this._rosterScrollAvailH(deploy);
    const w = availW ?? this._rosterScrollAvailW(deploy);
    const m = computeRosterGridMetrics(unitCount, ROSTER_CARD_W, baseH, ROSTER_MAX_COLS, h, w);
    applyRosterGridStyle(container, m);
    for (const child of Array.from(container.children)) {
      const el = child as HTMLElement;
      if (el.dataset.rosterEmpty) continue;
      if (el.tagName === 'DIV' && el.dataset.unitId) {
        this._applyRosterCardMetrics(el as HTMLDivElement, m);
      }
    }
    this._syncRosterEmptySlots(container, unitCount, m);
    return m;
  }

  /** Placeholdery pustych komórek w ostatnim rzędzie siatki 6 kol. */
  private _syncRosterEmptySlots(
    container: HTMLDivElement,
    unitCount: number,
    m: RosterGridMetrics,
  ): void {
    container.querySelectorAll('[data-roster-empty]').forEach(el => el.remove());
    if (unitCount <= 0) return;
    const filledInLastRow = unitCount % m.cols;
    if (filledInLastRow === 0) return;
    const emptyNeeded = m.cols - filledInLastRow;
    for (let i = 0; i < emptyNeeded; i++) {
      container.appendChild(createRosterEmptySlotElement(m.cardH));
    }
  }

  /** Skaluje wymiary karty jednostki wg metryk siatki (6 kolumn × pełna szerokość). */
  private _applyRosterCardMetrics(card: HTMLDivElement, m: RosterGridMetrics): void {
    card.style.width = '100%';
    card.style.maxWidth = '100%';
    card.style.height = m.cardH + 'px';
    card.style.boxSizing = 'border-box';
    const hpTrack = card.firstElementChild as HTMLDivElement | null;
    if (hpTrack) {
      hpTrack.style.height = Math.max(2, Math.round(4 * m.scale)) + 'px';
      hpTrack.style.marginBottom = Math.max(1, Math.round(3 * m.scale)) + 'px';
    }
    const iconEl = (card as { _iconEl?: HTMLDivElement })._iconEl
      ?? card.querySelector(':scope > div:nth-child(2)') as HTMLDivElement | null;
    if (iconEl) {
      iconEl.style.transform = `scale(${Math.max(0.55, m.scale)})`;
      iconEl.style.transformOrigin = 'center center';
    }
    const hpLbl = (card as { _hpLbl?: HTMLDivElement })._hpLbl;
    if (hpLbl) {
      hpLbl.style.fontSize = Math.max(6, Math.round(8 * m.scale)) + 'px';
    }
    const gBadge = (card as { _gBadge?: HTMLDivElement })._gBadge;
    if (gBadge) {
      const sz = Math.max(10, Math.round(14 * m.scale));
      gBadge.style.minWidth = sz + 'px';
      gBadge.style.height = sz + 'px';
      gBadge.style.lineHeight = sz + 'px';
      gBadge.style.fontSize = Math.max(7, Math.round(9 * m.scale)) + 'px';
      gBadge.style.top = Math.max(3, Math.round(6 * m.scale)) + 'px';
    }
  }

  /** Układ kart w panelu deploy — ten sam scroll co walka. */
  private _syncDeployPanelLayout(): void {
    if (this.deployPhase) {
      this._syncRendererSize();
    }
    if (this.deployPhase && this._rosterBar) {
      this._syncBattleRosterPanelLayout();
      this._syncRosterBottomInset();
      return;
    }
    const dock = this._deployRosterDock;
    if (!dock) return;

    const availH = this._rosterScrollAvailH(true);
    const availW = this._rosterScrollAvailW(true);

    this._syncRosterGroupLayouts(true, availH, availW);

    if (this._deployLooseCards?.isConnected) {
      const n = this._deployLooseCards.querySelectorAll('[data-unit-id]').length;
      if (n > 0) {
        this._layoutRosterCardGrid(this._deployLooseCards, n, true, availH, availW);
      }
    }

    this._syncDeployToolbarOffset();
    this._syncMinimapPosition();
    this._syncRosterColumnLayout();
    this._updateGroupSelectorBarLayout();
  }

  /**
   * Lewa kolumna rosteru od razu pod paskiem fazy (dawny pasek mocy nad mapą — usunięty w TW v5).
   */
  private _syncRosterColumnLayout(): void {
    const rosterEl = (this.deployPhase && this._rosterBar)
      ? this._rosterBar
      : (this._rosterBar && (this._manualMode || this.started) ? this._rosterBar : this._deployRosterDock);
    if (rosterEl) {
      rosterEl.style.top = (BATTLE_TOP_BAR_H + 8) + 'px';
      if (this.deployPhase || this._manualMode || this.started) {
        rosterEl.style.bottom = this._rosterBottomInsetPx() + 'px';
      }
    }
    this._syncSiegeHudLayout();
  }

  /** Układ kart wewnątrz bloku grupy — stałe 6 kolumn, scroll w pionie. */
  private _syncRosterGroupLayouts(deploy: boolean, availH = 0, availW = 0): number {
    const blocks = deploy ? this._deployGroupBlocks : this._battleGroupBlocks;
    const baseH = deploy ? DEPLOY_ROSTER_CARD_H : BATTLE_ROSTER_CARD_H;
    const h = availH || this._rosterScrollAvailH(deploy);
    const w = availW || this._rosterScrollAvailW(deploy);
    let maxGridW = ROSTER_CARD_W;

    for (const [gid, block] of blocks) {
      if (block.wrapper.style.display === 'none') continue;
      const collapsed = this._rosterGroupCollapsed.has(gid);
      const n = this._liveGroupMemberIds(gid).length;

      if (collapsed || n === 0) {
        block.wrapper.style.width = '100%';
        block.wrapper.style.maxWidth = '100%';
        block.header.style.height = baseH + 'px';
        continue;
      }

      const m = this._layoutRosterCardGrid(block.cards, n, deploy, h, w);
      maxGridW = Math.max(maxGridW, m.gridW);

      block.wrapper.style.width = '100%';
      block.wrapper.style.maxWidth = '100%';
      block.header.style.height = m.cardH + 'px';
      block.header.style.fontSize = Math.max(9, Math.round(12 * m.scale)) + 'px';
    }
    return maxGridW;
  }

  /** Kontener kart poza grupami — siatka 4 kolumny w stałym panelu. */
  private _ensureBattleLooseCardsContainer(): HTMLDivElement {
    if (this._battleLooseCards?.isConnected) return this._battleLooseCards;
    const looseWrap = document.createElement('div');
    looseWrap.id = 'battle-loose-cards';
    looseWrap.className = 'roster-loose-cards';
    if (this._battleRosterCards) {
      this._battleRosterCards.appendChild(looseWrap);
    } else if (this._rosterBar) {
      this._rosterBar.appendChild(looseWrap);
    }
    this._battleLooseCards = looseWrap;
    return looseWrap;
  }

  /** Układ kart w panelu walki — stała szerokość, skala tylko chipów. */
  private _syncBattleRosterPanelLayout(): void {
    if (!this._rosterBar) return;
    const availH = this._rosterScrollAvailH(false);
    const availW = this._rosterScrollAvailW(false);
    this._syncRosterGroupLayouts(false, availH, availW);
    if (this._battleLooseCards) {
      const n = this._battleLooseCards.querySelectorAll('[data-unit-id]').length;
      if (n > 0) {
        this._layoutRosterCardGrid(this._battleLooseCards, n, false, availH, availW);
      }
    }
    if (this._battleRosterCards) {
      this._battleRosterCards.style.width = '100%';
      this._battleRosterCards.style.maxWidth = '100%';
    }
    this._syncMinimapPosition();
    this._syncRosterColumnLayout();
  }

  /** Po teardown deploy — odswiez referencje do chipow i popupow (DOM zostaje). */
  private _rebindDeployToolbarRefs(): void {
    if (this._deployToolbar) {
      const chips = this._deployToolbar.querySelector('#deploy-toolbar-chips') as HTMLDivElement | null;
      if (chips) this._deployToolbarStatus = chips;
    }
    // Popupy zyja w document.body (position:fixed), nie w wewnatrz paska/rzedu
    // ikon — szukamy ich globalnie, zeby przetrwac ewentualna odbudowe DOM.
    for (const key of ['formation', 'cavalry', 'lines', 'tactics', 'strategy'] as const) {
      const popup = document.querySelector(
        `[data-deploy-dropdown="${key}"]`,
      ) as HTMLDivElement | null;
      if (popup) this._deployDropdownPopups[key] = popup;
    }
    if (!this._deployToolbarDocClick) {
      this._deployToolbarDocClick = (e: MouseEvent) => {
        const t = e.target as Node | null;
        if (!t) return;
        if (this._deployIconRow?.contains(t)) return;
        if (this._deployToolbar?.contains(t)) return;
        for (const popup of Object.values(this._deployDropdownPopups)) {
          if (popup?.contains(t)) return;
        }
        this._closeDeployDropdowns();
      };
      document.addEventListener('click', this._deployToolbarDocClick);
    }
  }

  /**
   * Widocznosc rzadku ikon (Formacja..Strategia, gora rosteru) + pływajacego
   * klastra Reset/Start (prawy dol, WYLACZNIE deploy). Zadanie #17 — dawny
   * pelnoszerokosciowy dolny pasek zlikwidowany.
   */
  private _syncBattleToolbarMode(): void {
    if (this._battleChromeSuppressed) return;
    this._syncSiegeHudChromeVisibility();
    const battleManual = this.started && !this.deployPhase && !this.finished && this._manualMode;
    const showIconRow = this.deployPhase || battleManual;
    const showActionCluster = this.deployPhase;

    if (battleManual && !this._deployToolbar) {
      this._buildDeployToolbar();
    }
    this._mountDeployIconRow();
    this._rebindDeployToolbarRefs();

    if (this._deployIconRow) {
      this._deployIconRow.style.display = showIconRow ? 'flex' : 'none';
      this._deployIconRow.style.pointerEvents = showIconRow ? 'auto' : 'none';
    }
    if (this._deployToolbar) {
      this._deployToolbar.style.display = showActionCluster ? 'flex' : 'none';
      this._deployToolbar.style.pointerEvents = showActionCluster ? 'auto' : 'none';
    }

    const battleOnly = battleManual && !this.deployPhase;
    for (const key of ['formation', 'cavalry', 'lines'] as const) {
      const btn = this._deployIconRow?.querySelector(`[data-deploy-main-btn="${key}"]`);
      const wrap = btn?.parentElement as HTMLElement | null;
      if (wrap) wrap.style.display = battleOnly ? 'none' : '';
    }
    const resetBtn = document.getElementById('deploy-toolbar-reset');
    const startBtn = document.getElementById('deploy-toolbar-start');
    if (resetBtn?.parentElement) resetBtn.parentElement.style.display = battleOnly ? 'none' : '';
    if (startBtn) startBtn.style.display = battleOnly ? 'none' : '';

    if (showIconRow) {
      this._syncDeployToolbarOffset();
      this._updateDeployToolbarStatus();
      this._updateDeployGroupsBar();
      this._syncRosterBottomInset();
    } else if (this._deployGroupManagerRail) {
      this._deployGroupManagerRail.style.display = 'none';
    }
    this._syncModeHintPosition();
    this._updateGroupSelectorBarLayout();
    this._updateRightRailLayout();
    this._syncMinimapPosition();
  }

  /** Prawa krawędź lewego panelu rosteru (px) — toolbar deploy zaczyna się za nią. */
  private _deployRosterRightEdgePx(): number {
    const el = this._rosterBar?.isConnected
      ? this._rosterBar
      : ((this.deployPhase && this._deployRosterDock)
        ? this._deployRosterDock
        : (this._rosterBar && (this._manualMode || this.started) ? this._rosterBar : this._deployRosterDock));
    if (el?.isConnected) {
      return Math.round(el.getBoundingClientRect().right);
    }
    return 16 + ROSTER_PANEL_FIXED_W;
  }

  /**
   * Zadanie #17: klaster Reset/Start jest teraz pływajacy (prawy dol, stały
   * `right`) — nie zalezy juz od szerokosci lewego panelu rosteru. Funkcja
   * zostaje (wywolywana z wielu miejsc) jako cienki wrapper na rzecz grup —
   * uproszczone wzgledem dawnego liczenia lewej krawedzi paska.
   */
  private _syncDeployToolbarOffset(): void {
    this._syncDeployGroupManagerRailLayout();
  }

  /**
   * Minimapa + panel Tempo: prawy dolny rog (decyzja Macieja — „minimapa w
   * bitwie na prawej stronie"). W deployu unosi sie NAD pływajacym klastrem
   * Reset/Start (mierzymy jego realny gorny brzeg); w walce klaster jest
   * ukryty, wiec minimapa siedzi przy samej krawedzi.
   */
  private _syncMinimapPosition(): void {
    if (!this._minimapWrap) return;
    const clusterUp = !!this._deployToolbar
      && this._deployToolbar.style.display !== 'none'
      && this._deployToolbar.isConnected;
    let bottomOff = 16;
    if (clusterUp) {
      const r = this._deployToolbar!.getBoundingClientRect();
      if (r.height > 0) bottomOff = Math.round(window.innerHeight - r.top) + 10;
    }
    Object.assign(this._minimapWrap.style, {
      left: 'auto',
      right: '16px',
      bottom: bottomOff + 'px',
      zIndex: '100060',
    });
  }

  /** Rząd rosteru deploy: konnica (0) → piesza (1) → lucznictwo (2). */
  private _deployRowKind(ru: RuntimeBattleUnit): 'mounted' | 'melee' | 'ranged' {
    return this._armyCompositionKind(ru);
  }

  /** Sortowanie w rzedzie: nazwa jednostki. */
  private _sortedDeployUnits(): RuntimeBattleUnit[] {
    return this._playerRoster()
      .filter(u => !u.dead && !u.removed)
      .sort((a, b) => {
        const ra = this._deployRowKind(a);
        const rb = this._deployRowKind(b);
        const order = { mounted: 0, melee: 1, ranged: 2 };
        if (order[ra] !== order[rb]) return order[ra] - order[rb];
        return String(a.bu.nazwa).localeCompare(String(b.bu.nazwa), 'pl');
      });
  }

  /** Odtwarza siatke rosteru deploy — ten sam układ bloków grup co walka. */
  private _rebuildDeployRosterGrid(): void {
    if (this._rebuildDeployRosterGridBusy) return;
    this._rebuildDeployRosterGridBusy = true;
    try {
      this._rebuildDeployRosterGridInner();
    } finally {
      this._rebuildDeployRosterGridBusy = false;
    }
  }

  private _rebuildDeployRosterGridInner(): void {
    if (!this._ensureDeployRowRefs()) {
      if (this.deployPhase) {
        this._recoverDeployRosterDock();
        if (!this._ensureDeployRowRefs()) return;
      } else {
        return;
      }
    }
    const container = this.deployPhase ? this._battleRosterCards : this._deployUnitsRow;
    if (container) container.innerHTML = '';
    this._deployGroupTabs.clear();
    this._deployGroupBlocks.clear();
    this._unitCards.clear();
    this._deployLooseCards = null;

    const inGroup = new Set<string>();
    for (const gid of this._sortedGroupIds()) {
      const memberIds = this._liveGroupMemberIds(gid);
      if (memberIds.length === 0) continue;
      const block = this._createRosterGroupBlock(gid, true);
      container?.appendChild(block.wrapper);
      this._deployGroupTabs.set(gid, block.header);
      this._deployGroupBlocks.set(gid, block);
      for (const id of memberIds) {
        const ru = this._playerRoster().find(u => u.bu.id === id);
        if (!ru || ru.dead || ru.removed) continue;
        inGroup.add(id);
        const card = this._createUnitCard(ru);
        block.cards.appendChild(card);
        this._unitCards.set(id, card);
      }
      this._applyRosterGroupCollapse(gid, true);
    }

    const ungrouped = this._playerRoster().filter(u =>
      !u.dead && !u.removed && !inGroup.has(u.bu.id),
    );
    if (ungrouped.length > 0) {
      const looseWrap = document.createElement('div');
      looseWrap.id = 'deploy-loose-cards';
      looseWrap.className = 'roster-loose-cards';
      for (const ru of ungrouped) {
        const card = this._createUnitCard(ru);
        looseWrap.appendChild(card);
        this._unitCards.set(ru.bu.id, card);
      }
      container?.appendChild(looseWrap);
      this._deployLooseCards = looseWrap;
    }

    this._expandAllDeployGroups();
    this._updateDeployRowCounts();
    this._updateRosterBar();
    this._updateDeployGroupsBar();
    this._updateDeployStrategyBar();
    this._updateBattleQuickSelectBar();
    this._updateBattleSelectionBar();
    requestAnimationFrame(() => {
      this._syncDeployPanelLayout();
      this._syncRosterBottomInset();
    });
    this._updateDeployToolbarSelection();
  }

  /** Liczba „slotów” pionowych w rosterze (zwinięta grupa = 1 slot). */
  private _countRosterLayoutSlots(visibleOnly = false): number {
    let filterGid: string | null = null;
    if (visibleOnly) {
      for (const gid of this._sortedGroupIds()) {
        if (this._isDeploySelectionExactlyGroup(gid)) {
          filterGid = gid;
          break;
        }
      }
    }

    let slots = 0;
    const inGroup = new Set<string>();
    for (const gid of this._sortedGroupIds()) {
      if (visibleOnly && filterGid && gid !== filterGid) continue;
      const block = this._deployGroupBlocks.get(gid);
      if (visibleOnly && block && block.wrapper.style.display === 'none') continue;
      const ids = this._liveGroupMemberIds(gid);
      if (ids.length === 0) continue;
      for (const id of ids) inGroup.add(id);
      slots += 1;
    }
    if (!visibleOnly || !filterGid) {
      for (const ru of this._playerRoster()) {
        if (ru.dead || ru.removed || inGroup.has(ru.bu.id)) continue;
        slots += 1;
      }
    }
    return Math.max(1, slots);
  }

  /** Blok zwijanej grupy: nagłówek (numer) + karty w środku. */
  private _createRosterGroupBlock(
    gid: string, deploy: boolean,
  ): { wrapper: HTMLDivElement; header: HTMLDivElement; cards: HTMLDivElement } {
    const wrapper = document.createElement('div');
    wrapper.className = 'roster-group-block';
    wrapper.dataset.groupId = gid;
    Object.assign(wrapper.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
      width: '100%', maxWidth: '100%',
      flex: 'none', flexShrink: '0',
      gap: ROSTER_CARD_GAP + 'px', marginBottom: '2px',
      overflow: 'hidden', boxSizing: 'border-box',
    });

    // Nagłówek grupy (makieta TW v5 §7): kolorowy pionowy znacznik 3px + „Grupa
    // N · X" + linia wypełniająca + chevron zwijania (SVG) — zastępuje dawną
    // pełną „zakładkę" TW (solidny złoty blok na całą wysokość kart).
    const header = document.createElement('div');
    header.className = deploy ? 'deploy-group-tab' : 'battle-group-tab';
    header.dataset.groupId = gid;
    Object.assign(header.style, {
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px',
      width: '100%', minHeight: '18px', cursor: 'default',
      padding: '0 1px', marginBottom: '2px', boxSizing: 'border-box',
      fontFamily: BATTLE_FONT,
    });

    const bar = document.createElement('span');
    bar.className = 'roster-grp-bar';
    Object.assign(bar.style, {
      width: '3px', height: '14px', borderRadius: '2px', flexShrink: '0',
    });
    header.appendChild(bar);

    const body = document.createElement('div');
    body.className = 'roster-grp-select';
    Object.assign(body.style, {
      cursor: 'pointer', userSelect: 'none', flexShrink: '0',
      fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    });
    header.appendChild(body);

    const rule = document.createElement('span');
    rule.className = 'roster-grp-rule';
    Object.assign(rule.style, { flex: '1', height: '1px', background: 'rgba(232,216,138,0.12)' });
    header.appendChild(rule);

    const chev = document.createElement('span');
    chev.className = 'roster-grp-chev';
    Object.assign(chev.style, {
      display: 'inline-flex', alignItems: 'center', flexShrink: '0',
      color: '#8a8070', cursor: 'pointer', userSelect: 'none', lineHeight: '0',
      transition: 'transform 0.15s',
    });
    chev.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M6 9l6 6 6-6"/></svg>';
    header.appendChild(chev);

    body.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      if (deploy) {
        this._deployActiveGroupId = gid;
        this._selectDeployGroupToggle(gid, true);
      } else {
        this._selectBattleGroupReplace(gid);
      }
    });
    chev.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      this._toggleRosterGroupCollapsed(gid, deploy);
    });

    const cards = document.createElement('div');
    cards.className = 'roster-group-cards';
    Object.assign(cards.style, {
      overflowX: 'hidden', boxSizing: 'border-box', width: '100%', maxWidth: '100%',
      gridTemplateColumns: `repeat(${ROSTER_MAX_COLS}, minmax(0, 1fr))`,
      gap: ROSTER_CARD_GAP + 'px', justifyContent: 'start', alignContent: 'start',
    });

    header.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
    });

    wrapper.appendChild(header);
    wrapper.appendChild(cards);
    this._updateRosterGroupHeaderLabel(header, gid);
    return { wrapper, header, cards };
  }

  private _refreshDeployGroupHeaderLabels(): void {
    for (const [gid, block] of this._deployGroupBlocks) {
      this._updateRosterGroupHeaderLabel(block.header, gid);
    }
  }

  /** Paleta pask\u00F3w grup \u2014 cykliczna, ta sama co akcenty typ\u00F3w (mockup Grupa 1/2/3). */
  private static readonly ROSTER_GROUP_BAR_PALETTE = [BATTLE_PLAYER_TEXT, BATTLE_GOLD, '#c8a878'] as const;

  private _updateRosterGroupHeaderLabel(header: HTMLDivElement, gid: string): void {
    const bar = header.querySelector('.roster-grp-bar') as HTMLSpanElement | null;
    const body = header.querySelector('.roster-grp-select') as HTMLDivElement | null;
    const chev = header.querySelector('.roster-grp-chev') as HTMLSpanElement | null;
    const collapsed = this._rosterGroupCollapsed.has(gid);
    const n = this._groupDisplayNum(gid);
    const cnt = this._liveGroupMemberIds(gid).length;
    const liveIds = this._liveGroupMemberIds(gid);
    const allSel = liveIds.length > 0 && liveIds.every(id => this._selectedUnits.has(id));
    const partialSel = !allSel && liveIds.some(id => this._selectedUnits.has(id));
    const managing = this.deployPhase && this._deployActiveGroupId === gid;
    const active = managing || allSel || partialSel;
    const palette = BattleScene.ROSTER_GROUP_BAR_PALETTE;
    const barColor = active ? BATTLE_GOLD : palette[n != null ? (n - 1) % palette.length : 0]!;
    if (bar) {
      bar.style.background = barColor;
      bar.style.boxShadow = active ? '0 0 6px ' + barColor : 'none';
    }
    if (body) {
      body.textContent = 'Grupa ' + (n != null ? String(n) : '?') + ' \u00B7 ' + cnt;
      body.style.color = active ? '#e8e0c8' : '#c8b898';
    }
    if (chev) chev.style.transform = collapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    header.title = 'Klik = zaznacz grupe \u00B7 strzalka = zwin/rozwin karty';
  }

  /** Deploy: wszystkie grupy rozwinięte — maks. powierzchnia na chipy jednostek. */
  private _expandAllDeployGroups(): void {
    for (const id of this._sortedGroupIds()) {
      this._rosterGroupCollapsed.delete(id);
    }
    for (const id of this._sortedGroupIds()) {
      this._applyRosterGroupCollapse(id, true);
    }
    this._refreshDeployGroupHeaderLabels();
  }

  /** Po zaznaczeniu: odśwież pasek akcji i siatkę (deploy = płaska siatka C09). */
  private _syncDeployRosterGroupVisibility(): void {
    if (!this.deployPhase || !this._ensureDeployRowRefs()) return;
    this._updateDeployToolbarSelection();
    requestAnimationFrame(() => this._syncDeployPanelLayout());
  }

  private _toggleRosterGroupCollapsed(gid: string, deploy: boolean): void {
    if (this._rosterGroupCollapsed.has(gid)) this._rosterGroupCollapsed.delete(gid);
    else this._rosterGroupCollapsed.add(gid);
    this._applyRosterGroupCollapse(gid, deploy);
  }

  private _applyRosterGroupCollapse(gid: string, deploy: boolean): void {
    const blocks = deploy ? this._deployGroupBlocks : this._battleGroupBlocks;
    const block = blocks.get(gid);
    if (!block) return;
    const collapsed = this._rosterGroupCollapsed.has(gid);
    block.cards.style.display = collapsed ? 'none' : 'grid';
    this._updateRosterGroupHeaderLabel(block.header, gid);
    const tabs = deploy ? this._deployGroupTabs : this._battleGroupTabs;
    this._paintTwGroupTabs(tabs);
    if (deploy) {
      requestAnimationFrame(() => this._syncDeployPanelLayout());
    } else {
      requestAnimationFrame(() => this._syncBattleRosterPanelLayout());
    }
  }

  /** @deprecated Użyj _createRosterGroupBlock. */
  private _createTwGroupTab(gid: string, deploy: boolean): HTMLDivElement {
    return this._createRosterGroupBlock(gid, deploy).header;
  }

  /**
   * Podświetla nagłówki grup wg zaznaczenia — deleguje do wspólnego malowania
   * (_updateRosterGroupHeaderLabel, makieta TW v5 §7). Dawniej osobna „zakładka"
   * TW z pełnym kolorowym tłem; teraz jeden spójny styl nagłówka.
   */
  private _paintTwGroupTabs(tabs: Map<string, HTMLDivElement>): void {
    for (const [gid, tab] of tabs) {
      this._updateRosterGroupHeaderLabel(tab, gid);
    }
  }

  /** Ustawia aktywny uklad formacji i odswieza pasek nad rosterem. */
  private _setDeployActiveFormation(fmt: 'F1' | 'F2' | 'F3'): void {
    this._deployActiveFormation = fmt;
    this._syncDeployFormationButtons();
    this._updateDeployToolbarStatus();
  }

  /** Odswieza formacje i linie toolbara deploy wg aktywnej grupy / zaznaczenia. */
  private _syncDeployToolbarFromSelection(): void {
    if (!this.deployPhase) return;
    const selUnits = [...this._selectedUnits]
      .map(id => this._findPlayerUnit(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    const groupIds = [...new Set(selUnits.map(u => u.groupId).filter(Boolean))];
    const singleGid = groupIds.length === 1 && selUnits.every(u => u.groupId === groupIds[0])
      ? groupIds[0]! : null;
    const gid = singleGid
      ?? (this._deployActiveGroupId && this._sortedGroupIds().includes(this._deployActiveGroupId)
        ? this._deployActiveGroupId
        : null);
    let targets = selUnits;
    if (targets.length === 0 && gid) {
      targets = this._liveGroupMemberIds(gid)
        .map(id => this._findPlayerUnit(id))
        .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    }
    if (targets.length > 0) {
      this._deployActiveFormation = this._formationForDeployUnits(targets);
      this._syncDeployFormationButtons();
    }
    if (gid) {
      const meta = this._groupMeta.get(gid);
      if (meta?.meleeLines != null) this._deployMeleeLines = meta.meleeLines;
      if (meta?.archerLines != null) this._deployArcherLines = meta.archerLines;
      if (meta?.attackDirection != null) this._setDeployAttackDirection(meta.attackDirection);
      this._syncDeployLinesButtons();
    } else if (targets.length === 1 && targets[0]!.attackDirection !== 'front') {
      this._setDeployAttackDirection(targets[0]!.attackDirection);
    }
    this._updateDeployToolbarStatus();
  }

  /** Ustawia tryb konnicy i odswieza przyciski. */
  private _setDeployCavalryMode(mode: CavalryDeployMode): void {
    this._deployCavalryMode = mode;
    this._syncDeployCavalryButtons();
    this._updateDeployToolbarStatus();
  }

  /** C-FLANK: ustawia aktywny kierunek natarcia (toolbar) i odswieza przyciski. */
  private _setDeployAttackDirection(dir: AttackDirection): void {
    this._deployAttackDirection = dir;
    this._syncDeployAttackDirectionButtons();
    this._updateDeployToolbarStatus();
  }

  private _setDeployMeleeLines(n: DeployLineCount): void {
    this._deployMeleeLines = n;
    this._syncDeployLinesButtons();
    this._updateDeployToolbarStatus();
  }

  private _setDeployArcherLines(n: DeployLineCount): void {
    this._deployArcherLines = n;
    this._syncDeployLinesButtons();
    this._updateDeployToolbarStatus();
  }

  /** Liczba linii glebokosci dla roli w formacji deploy. */
  private _deployLinesForRole(role: string): DeployLineCount {
    if (role === 'archer') return this._deployArcherLines;
    if (role === 'melee' || role === 'javelin') return this._deployMeleeLines;
    return 1;
  }

  /** Podswietla aktywne liczby linii w popupie Linie. */
  private _syncDeployLinesButtons(): void {
    document.querySelectorAll('button[data-deploy-lines-kind]').forEach(el => {
      const kind = (el as HTMLElement).dataset.deployLinesKind;
      const cnt = Number((el as HTMLElement).dataset.deployLinesCount) as DeployLineCount;
      const active = kind === 'melee' ? this._deployMeleeLines : this._deployArcherLines;
      paintDeployPopupOption(el as HTMLButtonElement, cnt === active);
    });
  }

  /**
   * Stosuje ustawienia linii (piechota / lucznicy) do zaznaczenia lub calej armii.
   */
  private _applyDeployLineSettings(): void {
    const live = this._playerRoster().filter(u => !u.dead && !u.removed);
    if (live.length === 0) return;

    const targets = this._resolveDeployFormationTargets(live);
    if (targets.length === 0) return;

    const groupIds = [...new Set(targets.map(u => u.groupId).filter(Boolean))] as string[];
    for (const g of groupIds) {
      const meta = this._ensureGroupMeta(g);
      meta.meleeLines = this._deployMeleeLines;
      meta.archerLines = this._deployArcherLines;
    }

    const formation = this._formationForDeployUnits(targets);
    const moved = this._applyFormationToUnits(targets, formation);
    if (!moved) {
      this._showOrderFeedback('Linie: brak wolnego miejsca w strefie');
      return;
    }
    this._refreshDeploySelectionVisuals();
    this._updateRosterBar();
  }

  /** Podswietla aktywna opcje w popupie formacji. */
  private _syncDeployFormationButtons(): void {
    const active = this._deployActiveFormation;
    document.querySelectorAll('button[data-deploy-fmt-option]').forEach(el => {
      paintDeployPopupOption(
        el as HTMLButtonElement,
        (el as HTMLElement).dataset.deployFmtOption === active,
      );
    });
  }

  /** Podswietla aktywna opcje w popupie konnicy. */
  private _syncDeployCavalryButtons(): void {
    const active = this._deployCavalryMode;
    document.querySelectorAll('button[data-deploy-cav-option]').forEach(el => {
      paintDeployPopupOption(
        el as HTMLButtonElement,
        (el as HTMLElement).dataset.deployCavOption === active,
      );
    });
  }

  /** C-FLANK: podswietla aktywna opcje w popupie kierunku natarcia. */
  private _syncDeployAttackDirectionButtons(): void {
    const active = this._deployAttackDirection;
    document.querySelectorAll('button[data-deploy-dir-option]').forEach(el => {
      paintDeployPopupOption(
        el as HTMLButtonElement,
        (el as HTMLElement).dataset.deployDirOption === active,
      );
    });
  }

  /** Odtwarza referencje do rosteru atk (deploy = ten sam panel co walka). */
  private _ensureDeployRowRefs(): boolean {
    if (this.deployPhase) {
      if (!this._rosterBar?.isConnected) this._buildRosterBar();
      this._ensureBattleRosterChrome();
      const scroll = this._rosterBar?.querySelector('#battle-roster-scroll') as HTMLDivElement | null;
      const cards = this._rosterBar?.querySelector('#battle-roster-cards') as HTMLDivElement | null;
      if (!scroll || !cards) return false;
      this._battleRosterCards = cards;
      this._deployUnitsRow = cards;
      this._deployRosterScroll = scroll;
      this._deployRosterGridEl = cards;
      applyBattleRosterScrollbar(scroll);
      return true;
    }
    if (this._deployUnitsRow?.isConnected) return true;
    const dock = document.getElementById('deploy-roster-dock') as HTMLDivElement | null;
    if (!dock) return false;
    const unitsRow = dock.querySelector('#deploy-units-row') as HTMLDivElement | null;
    if (!unitsRow) return false;
    this._deployRosterDock = dock;
    this._deployUnitsRow = unitsRow;
    this._deployGroupsBar = dock.querySelector('#deploy-groups-bar') as HTMLDivElement | null;
    this._deployStrategyBar = dock.querySelector('#deploy-strategy-bar') as HTMLDivElement | null;
    this._deployRosterGridEl = unitsRow;
    this._deployRosterHeader = dock.querySelector('#deploy-roster-header') as HTMLDivElement | null;
    this._deployRosterCount = dock.querySelector('#deploy-roster-count') as HTMLDivElement | null;
    this._deploySelBar = dock.querySelector('#deploy-roster-action-bar') as HTMLDivElement | null
      ?? dock.querySelector('#deploy-roster-sel-bar') as HTMLDivElement | null;
    this._deployRosterFooter = dock.querySelector('#deploy-roster-footer') as HTMLDivElement | null;
    this._deployRosterFeedback = dock.querySelector('#deploy-roster-footer-hint') as HTMLDivElement | null;
    this._deployQuickSelectBar = dock.querySelector('#deploy-quick-select') as HTMLDivElement | null;
    this._deployRosterScroll = dock.querySelector('#deploy-roster-scroll') as HTMLDivElement | null;
    if (this._deployRosterScroll) applyBattleRosterScrollbar(this._deployRosterScroll);
    this._normalizeDeployRosterChromeOrder(dock);
    this._bindDeployRosterChromeClicks(dock);
    return true;
  }

  /** Odbudowa lewego panelu gdy referencje DOM rozjechane (deploy). */
  private _recoverDeployRosterDock(): void {
    document.getElementById('deploy-roster-dock')?.remove();
    this._deployRosterDock = null;
    this._deployUnitsRow = null;
    this._deployGroupTabs.clear();
    this._deployGroupBlocks.clear();
    if (this.deployPhase) {
      this._buildRosterBar();
      this._ensureBattleRosterChrome();
    } else {
      this._buildDeployRosterDock();
    }
  }

  /** @deprecated — zastąpione zwartym layGroup (centrum PLAY_MID_ROW, max 12/szereg). */
  private _deploySpreadRank(
    list: number[],
    col: number,
    idealRow: number[],
    idealCol: number[],
    clampRow: (r: number) => number,
    clampCol: (c: number) => number,
  ): void {
    const MAX_LINE = 12;
    const midRow = PLAY_MID_ROW;
    const per = Math.max(1, Math.min(list.length, MAX_LINE));
    const r0g = midRow - Math.floor(per / 2);
    list.forEach((ui, k) => {
      idealCol[ui] = clampCol(col);
      idealRow[ui] = clampRow(r0g + (k % per));
    });
  }

  private _updateDeployRowCounts(): void {
    this._updateBattleRosterHeader();
  }

  /** Kompaktowa karta jednostki — styl C09 v4 (deploy roster). */
  private _createDeployRosterCard(ru: RuntimeBattleUnit): HTMLDivElement {
    const isDead = ru.dead || ru.removed;
    const isRouted = ru.routed;
    const isSel = this._selectedUnits.has(ru.bu.id);
    const hpPct = ru.bu.maxHp > 0 ? Math.max(0, ru.bu.hp / ru.bu.maxHp) : 0;
    const morPct = ru.moraleMax > 0 ? Math.max(0, ru.morale / ru.moraleMax) : hpPct;
    const row = this._armyCompositionKind(ru);

    const card = document.createElement('div');
    card.className = 'deploy-roster-card';
    card.dataset.unitId = ru.bu.id;
    Object.assign(card.style, {
      width: ROSTER_CARD_W + 'px', flex: 'none', height: DEPLOY_ROSTER_CARD_H + 'px',
      borderRadius: '8px',
      cursor: isDead ? 'default' : 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      userSelect: 'none', flexShrink: '0',
      opacity: isDead ? '0.4' : isRouted ? '0.5' : '1',
      transition: 'border-color 0.12s, box-shadow 0.12s, background 0.12s',
      position: 'relative', overflow: 'visible',
      padding: '5px 4px 4px', textAlign: 'center', gap: '3px',
      ...rosterCardBaseStyle(row, isSel),
    });

    if (ru.groupId && !isDead) {
      const gBadge = document.createElement('div');
      const gNum = this._groupDisplayNum(ru.groupId);
      Object.assign(gBadge.style, {
        position: 'absolute', top: '-5px', right: '-5px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: BATTLE_GOLD, color: '#2e2708',
        fontSize: '9px', fontWeight: 'bold', lineHeight: '16px',
        textAlign: 'center', zIndex: '2',
      });
      gBadge.textContent = gNum != null ? String(gNum) : '';
      card.appendChild(gBadge);
      (card as { _gBadge?: HTMLDivElement })._gBadge = gBadge;
    }

    const iconEl = document.createElement('div');
    applyUnitCardIconCircle(iconEl, row);
    iconEl.innerHTML = row === 'mounted' ? ROSTER_TYPE_SVG.mounted
      : row === 'ranged' ? ROSTER_TYPE_SVG.ranged
      : ROSTER_TYPE_SVG.melee;
    const iconSvg = iconEl.querySelector('svg');
    if (iconSvg) {
      iconSvg.setAttribute('width', '15');
      iconSvg.setAttribute('height', '15');
    }
    card.appendChild(iconEl);
    (card as { _iconEl?: HTMLDivElement })._iconEl = iconEl;

    const mkBar = (pct: number, gradient: string): { track: HTMLDivElement; fill: HTMLDivElement } => {
      const track = document.createElement('div');
      Object.assign(track.style, {
        width: '100%', height: '4px', borderRadius: '2px',
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden', flexShrink: '0',
      });
      const fill = document.createElement('div');
      Object.assign(fill.style, {
        width: (pct * 100).toFixed(0) + '%', height: '100%', background: gradient,
      });
      track.appendChild(fill);
      return { track, fill };
    };

    const hpBar = mkBar(hpPct, hpBarGradient());
    card.appendChild(hpBar.track);
    (card as any)._hpFill = hpBar.fill;

    const morBar = mkBar(isDead ? 0 : morPct, moraleBarGradient());
    card.appendChild(morBar.track);
    (card as any)._morFill = morBar.fill;

    const hpLbl = document.createElement('div');
    Object.assign(hpLbl.style, {
      fontSize: '8px', fontWeight: '700', color: isDead ? '#8a5a5a' : isRouted ? BATTLE_ENEMY_TEXT : '#c8b898',
      lineHeight: '1.1',
    });
    hpLbl.textContent = isDead ? 'pad\u0142' : isRouted ? 'rout' : String(Math.round(ru.bu.hp));
    card.appendChild(hpLbl);
    (card as { _hpLbl?: HTMLDivElement })._hpLbl = hpLbl;
    (card as any)._grpLbl = null;

    card.addEventListener('pointerdown', (e: PointerEvent) => { e.stopPropagation(); });
    card.addEventListener('click', (e: MouseEvent) => {
      if (ru.dead || ru.removed) return;
      e.stopPropagation();
      e.preventDefault();
      this._handleDeployUnitPick(ru, e.ctrlKey || e.metaKey, e.shiftKey);
    });

    return card;
  }

  private _unitStatVal(bu: BattleUnit, key: string): string {
    const v = (bu.stats as Record<string, unknown> | undefined)?.[key];
    if (v == null || v === '') return '\u2014';
    return String(v);
  }

  /** Panel szczegolow — wylaczony; zaznaczenie na pasku deploy (_deploySelBar). */
  private _updateDeployDetailPanel(): void {
    /* legacy no-op */
  }

  /** Nagłówek nad rosterem — C09 v4 (Roster + licznik + podsumowanie grup). */
  private _updateDeployRosterHeader(): void {
    if (!this._deployRosterHeader || !this.deployPhase) return;
    const live = this._playerRoster().filter(u => !u.dead && !u.removed).length;
    let titleWrap = this._deployRosterHeader.querySelector('#deploy-roster-title-wrap') as HTMLDivElement | null;
    let count = this._deployRosterHeader.querySelector('#deploy-roster-header-count') as HTMLSpanElement | null;
    let groupsLine = this._deployRosterHeader.querySelector('#deploy-roster-groups-line') as HTMLDivElement | null;
    if (!titleWrap || !count) {
      this._deployRosterHeader.innerHTML = '';
      applyRosterHeaderSection1E(this._deployRosterHeader);
      Object.assign(this._deployRosterHeader.style, {
        display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '3px',
        padding: '12px 14px',
      });
      const row = document.createElement('div');
      row.id = 'deploy-roster-title-wrap';
      Object.assign(row.style, {
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      });
      const title = document.createElement('span');
      title.id = 'deploy-roster-title';
      title.textContent = 'Roster';
      count = document.createElement('span');
      count.id = 'deploy-roster-header-count';
      Object.assign(count.style, {
        fontSize: '11px', color: BATTLE_TEXT_DIM, fontWeight: '400',
        letterSpacing: '0', textTransform: 'none',
      });
      row.appendChild(title);
      row.appendChild(count);
      this._deployRosterHeader.appendChild(row);
      titleWrap = row;
      groupsLine = document.createElement('div');
      groupsLine.id = 'deploy-roster-groups-line';
      Object.assign(groupsLine.style, {
        fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase',
        color: BATTLE_TEXT_DIM, lineHeight: '1.35',
      });
      this._deployRosterHeader.appendChild(groupsLine);
    }
    if (!groupsLine) {
      groupsLine = this._deployRosterHeader.querySelector('#deploy-roster-groups-line') as HTMLDivElement | null;
    }
    count!.textContent = live + ' / ' + live;
    const groupParts = this._sortedGroupIds().map(gid =>
      this._groupDisplayLabel(gid) + ' \u00B7 ' + this._liveGroupMemberIds(gid).length,
    );
    if (groupsLine) {
      groupsLine.textContent = groupParts.length > 0 ? groupParts.join(' \u00A0\u00B7\u00A0 ') : '';
      groupsLine.style.display = groupParts.length > 0 ? 'block' : 'none';
    }
    this._deployRosterHeader.title = BATTLE_UI_BUILD;
    this._updateDeployRosterCountLine();
  }

  /** Czy interakcja zaznaczenia (LPM/PPM) jest aktywna w tej fazie. */
  private _selectionInputActive(): boolean {
    if (this.deployPhase) return true;
    return !!(this.started && !this.finished && (this._manualMode || this._battleAwaitingOrders));
  }

  /** Krotki klik wskaznika (bez drag / box-select). */
  private _isShortPointerClick(e: PointerEvent): boolean {
    const down = this._pointerDownPos;
    if (!down) return false;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    return dx * dx + dy * dy < 36;
  }

  /** PPM — odznacz biezace zaznaczenie (mapa lub jednostka). */
  private _deselectOnRightClick(): void {
    if (this._selectedUnits.size === 0) return;
    if (this.deployPhase) {
      this._clearDeploySelectionState();
      this._showDeployFeedback('Odznaczono');
    } else {
      this._clearAllSelection();
      this._showBattleRosterFeedback('Odznaczono');
    }
  }

  private _clearDeploySelectionState(): void {
    for (const id of this._selectedUnits) {
      const u = this._findUnitById(id);
      if (u) {
        this._removeSelectionRing(u);
        u.group.scale.setScalar(1.0);
      }
    }
    this._selectedUnits.clear();
    this._deploySelected = null;
    this._clearDeployGhosts();
    this._refreshDeploySelectionVisuals();
    this._syncDeployRosterGroupVisibility();
    this._updateDeployToolbarSelection();
  }

  /**
   * Zaznaczenie jednostki w fazie deploy (mapa lub karta).
   * LPM na zeton/karte = pojedyncza jednostka; Ctrl/Shift = multi-select.
   * Cala grupe zaznacza naglowek grupy w rosterze (nie klik w zeton).
   */
  private _handleDeployUnitPick(ru: RuntimeBattleUnit, ctrl: boolean, shift: boolean): void {
    if (ru.dead || ru.removed) return;
    const additive = ctrl || shift;

    if (ru.groupId && additive) {
      if (this._selectedUnits.has(ru.bu.id)) {
        this._selectedUnits.delete(ru.bu.id);
        this._removeSelectionRing(ru);
      } else {
        this._selectedUnits.add(ru.bu.id);
        this._addSelectionRing(ru);
        this._refreshUnitRingColor(ru);
      }
      this._refreshDeploySelectionVisuals();
      return;
    }

    if (additive) {
      if (this._selectedUnits.has(ru.bu.id)) {
        this._selectedUnits.delete(ru.bu.id);
        this._removeSelectionRing(ru);
        if (this._deploySelected === ru) this._deploySelected = null;
      } else {
        this._selectedUnits.add(ru.bu.id);
        this._addSelectionRing(ru);
      }
    } else {
      if (this._selectedUnits.size === 1 && this._selectedUnits.has(ru.bu.id)) return;
      for (const id of [...this._selectedUnits]) {
        const u = this._findUnitById(id);
        if (u) {
          this._removeSelectionRing(u);
          u.group.scale.setScalar(1.0);
        }
      }
      this._selectedUnits.clear();
      this._selectedUnits.add(ru.bu.id);
      this._addSelectionRing(ru);
      this._deploySelected = ru;
    }
    this._refreshDeploySelectionVisuals();
  }

  /** Numer grupy do wyswietlania (1, 2, 3…) — groupId to licznik tekstowy. */
  private _groupDisplayNum(gid: string | null): number | null {
    if (!gid) return null;
    const n = parseInt(gid, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  /** Etykieta „Grupa N” dla UI. */
  private _groupDisplayLabel(gid: string | null): string {
    const n = this._groupDisplayNum(gid);
    return n != null ? 'Grupa ' + n : (gid ?? '');
  }

  /** Usuwa puste grupy z rejestru; NIGDY nie kasuje groupId na jednostkach. */
  private _pruneStaleGroups(): void {
    this._syncGroupRegistry();
    const roster = this._groupRegistryRoster();
    for (const gid of [...this._groups.keys()]) {
      const live = roster.filter(u => u.groupId === gid && !u.dead && !u.removed);
      if (live.length === 0) {
        this._groups.delete(gid);
        this._groupMeta.delete(gid);
      } else {
        this._groups.set(gid, new Set(live.map(u => u.bu.id)));
      }
    }
  }

  /**
   * BŁĄD J (właściciel, 2026-07-24): najniższy WOLNY numer grupy (1, 2, 3…),
   * nie licznik monotonicznie rosnący. Przyczyna zgłoszonego błędu:
   * `_groupSelected()` (patrz niżej) przydzielał gid przez `_groupCounter++`,
   * który nigdy nie wraca w dół — rozgrupowanie i ponowne zgrupowanie TYCH
   * SAMYCH jednostek dawało kolejno G1, potem G2, potem G3, mimo że G1/G2 są
   * już wolne (puste grupy są usuwane z `_groups` przez `_detachUnitsFromGroups`/
   * `_pruneStaleGroups`, ale sam licznik tego nie widział). Tu liczymy
   * najmniejszą dodatnią liczbę całkowitą NIEobecną wśród kluczy `_groups`
   * (gid = numer jako string, patrz `_groupDisplayNum`) — wołający powinien
   * najpierw upewnić się, że `_groups` jest świeże (np. przez
   * `_detachUnitsFromGroups`/`_pruneStaleGroups`, co `_groupSelected()` już
   * robi tuż przed wywołaniem tej funkcji).
   */
  private _nextFreeGroupId(): string {
    const used = new Set<number>();
    for (const gid of this._groups.keys()) {
      const n = parseInt(gid, 10);
      if (Number.isFinite(n) && n > 0) used.add(n);
    }
    let n = 1;
    while (used.has(n)) n++;
    return String(n);
  }

  /** Posortowane groupId (po numerze) — tylko grupy z >=1 zywym czlonkiem. */
  private _sortedGroupIds(): string[] {
    this._pruneStaleGroups();
    const ids = new Set<string>();
    for (const u of this._groupRegistryRoster()) {
      if (u.groupId && !u.dead && !u.removed) ids.add(u.groupId);
    }
    return [...ids].sort((a, b) => {
      const na = parseInt(a.match(/(\d+)$/)?.[1] ?? '0', 10);
      const nb = parseInt(b.match(/(\d+)$/)?.[1] ?? '0', 10);
      return na - nb || a.localeCompare(b);
    });
  }

  /** Zywe id czlonkow grupy (fallback skan rosteru gracza). */
  private _liveGroupMemberIds(gid: string): string[] {
    const roster = this._playerRoster();
    const fromMap = this._groups.get(gid);
    let ids: string[];
    if (fromMap && fromMap.size > 0) {
      ids = [...fromMap].filter(id => {
        const u = roster.find(x => x.bu.id === id);
        return u && !u.dead && !u.removed;
      });
    } else {
      ids = roster
        .filter(u => u.groupId === gid && !u.dead && !u.removed)
        .map(u => u.bu.id);
      if (ids.length > 0) this._groups.set(gid, new Set(ids));
    }
    return ids;
  }

  /** Odtwarza mape _groups z groupId na jednostkach (po resecie / starym stanie). */
  private _syncGroupRegistry(): void {
    for (const u of this._groupRegistryRoster()) {
      if (!u.groupId || u.dead || u.removed) continue;
      let set = this._groups.get(u.groupId);
      if (!set) { set = new Set(); this._groups.set(u.groupId, set); }
      set.add(u.bu.id);
    }
  }

  /** Zastepuje zaznaczenie podanymi jednostkami. */
  private _selectDeployUnitsByIds(ids: string[]): void {
    for (const id of [...this._selectedUnits]) {
      const u = this._findPlayerUnit(id);
      if (u) {
        this._removeSelectionRing(u);
        u.group.scale.setScalar(1.0);
      }
    }
    this._selectedUnits.clear();
    for (const id of ids) {
      const u = this._findPlayerUnit(id);
      if (u && !u.dead && !u.removed) {
        this._selectedUnits.add(id);
        this._addSelectionRing(u);
        this._refreshUnitRingColor(u);
      }
    }
    this._refreshDeploySelectionVisuals();
  }

  /** Zaznacz cala grupe (przycisk szybkiego wyboru). */
  private _selectDeployGroupById(gid: string): void {
    this._selectDeployUnitsByIds(this._liveGroupMemberIds(gid));
  }

  /** Zaznacz wszystkie jednostki danego typu (konnica / piechota / lucznicy). */
  private _selectDeployByKind(kind: 'mounted' | 'melee' | 'ranged'): void {
    const ids = this._playerRoster()
      .filter(u => !u.dead && !u.removed && this._deployRowKind(u) === kind)
      .map(u => u.bu.id);
    this._selectDeployUnitsByIds(ids);
  }

  /** Toggle zaznaczenia typu (Konnica / Piechota / Lucznicy). */
  private _selectDeployByKindToggle(kind: 'mounted' | 'melee' | 'ranged'): void {
    const ids = this._playerRoster()
      .filter(u => !u.dead && !u.removed && this._deployRowKind(u) === kind)
      .map(u => u.bu.id);
    if (ids.length === 0) return;
    const allSel = ids.every(id => this._selectedUnits.has(id));
    const onlyThis = allSel && this._selectedUnits.size === ids.length;
    if (onlyThis) this._clearDeploySelectionState();
    else this._selectDeployUnitsByIds(ids);
  }

  /** Zaznacz cala armie gracza. */
  private _selectDeployAll(): void {
    const ids = this._playerRoster().filter(u => !u.dead && !u.removed).map(u => u.bu.id);
    this._selectDeployUnitsByIds(ids);
  }

  /** Toggle zaznaczenia calej armii. */
  private _selectDeployAllToggle(): void {
    const ids = this._playerRoster().filter(u => !u.dead && !u.removed).map(u => u.bu.id);
    if (ids.length === 0) return;
    const allSel = ids.every(id => this._selectedUnits.has(id));
    const onlyAll = allSel && this._selectedUnits.size === ids.length;
    if (onlyAll) {
      this._deployActiveGroupId = null;
      this._clearDeploySelectionState();
    } else {
      this._deployActiveGroupId = null;
      this._selectDeployUnitsByIds(ids);
    }
  }

  /**
   * Klik na czlonka grupy bez Ctrl: zaznacz/odznacz cala grupe (replace).
   * replace=false: toggle grupy w istniejacym zaznaczeniu.
   */
  private _selectDeployGroupToggle(gid: string, replace: boolean): void {
    this._pruneStaleGroups();
    const liveIds = this._liveGroupMemberIds(gid);
    if (liveIds.length === 0) {
      this._updateDeployQuickSelectBar();
      this._showDeployFeedback('Grupa pusta — uzyj \u25C6 Grupuj, aby utworzyc nowa');
      return;
    }
    const allSelected = liveIds.every(id => this._selectedUnits.has(id));
    const onlyThisGroup = allSelected && this._selectedUnits.size === liveIds.length;

    if (replace) {
      if (onlyThisGroup) {
        this._deployActiveGroupId = gid;
        this._clearDeploySelectionState();
        this._updateDeployGroupsBar();
        return;
      }
      this._deployActiveGroupId = gid;
      this._selectDeployUnitsByIds(liveIds);
      return;
    }

    if (allSelected) {
      for (const id of liveIds) {
        this._selectedUnits.delete(id);
        const u = this._findPlayerUnit(id);
        if (u) this._removeSelectionRing(u);
      }
    } else {
      for (const id of liveIds) {
        if (this._selectedUnits.has(id)) continue;
        const u = this._findPlayerUnit(id);
        if (u) {
          this._selectedUnits.add(id);
          this._addSelectionRing(u);
          this._refreshUnitRingColor(u);
        }
      }
    }
    this._refreshDeploySelectionVisuals();
  }

  /** Czy zaznaczenie to dokladnie jedna grupa (bez obcych jednostek). */
  private _isDeploySelectionExactlyGroup(gid: string): boolean {
    const liveIds = this._liveGroupMemberIds(gid);
    if (liveIds.length === 0) return false;
    return liveIds.every(id => this._selectedUnits.has(id)) && this._selectedUnits.size === liveIds.length;
  }

  /** Jednostki dostepne do zaznaczenia (deploy lub walka reczna — bez wycofanych). */
  private _selectableAtkUnits(): RuntimeBattleUnit[] {
    const battleLive = this.started && !this.deployPhase;
    return this._playerRoster().filter(u => !u.dead && !u.removed && (!battleLive || !u.routed));
  }

  /** Czy zaznaczone sa wylacznie jednostki danego typu. */
  private _isDeploySelectionExactlyKind(kind: 'mounted' | 'melee' | 'ranged'): boolean {
    const ids = this._selectableAtkUnits()
      .filter(u => this._deployRowKind(u) === kind)
      .map(u => u.bu.id);
    if (ids.length === 0) return false;
    return ids.every(id => this._selectedUnits.has(id)) && this._selectedUnits.size === ids.length;
  }

  /** Czy zaznaczona cala armia. */
  private _isDeploySelectionAll(): boolean {
    const live = this._selectableAtkUnits();
    return live.length > 0 && live.every(u => this._selectedUnits.has(u.bu.id));
  }

  /**
   * Przycisk szybkiego zaznaczenia — chip filtra C09 v4. Klasy jednostek
   * (Konnica/Piechota/Dystansowe) renderują się jako kwadratowa ikona 32px
   * (bez napisu, nazwa w pigułce hover) — uwaga właściciela; Wszystkie/Grupa/
   * Generał zostają tekstowe (są dynamiczne — liczby grup, etykiety).
   */
  private _makeDeployQuickBtn(
    label: string, active: boolean, onClick: () => void,
    opts?: {
      fullWidth?: boolean;
      kind?: 'mounted' | 'melee' | 'ranged' | 'all' | 'all-icon' | 'general-icon' | 'group';
      groupId?: string;
    },
  ): HTMLElement {
    const fullWidth = opts?.fullWidth !== false;
    const kind = opts?.kind ?? 'all';
    const isClassIcon = kind === 'mounted' || kind === 'melee' || kind === 'ranged' || kind === 'all-icon' || kind === 'general-icon';
    const btn = document.createElement('button');
    btn.type = 'button';
    if (!isClassIcon) btn.textContent = label;
    if (kind === 'group' && opts?.groupId) {
      btn.dataset.rosterChip = 'group';
      btn.dataset.groupId = opts.groupId;
    } else if (kind === 'all' || kind === 'all-icon') {
      btn.dataset.rosterChip = 'all';
    } else if (kind === 'general-icon') {
      btn.dataset.rosterChip = 'general';
    } else {
      btn.dataset.rosterChip = 'kind-' + kind;
    }
    if (isClassIcon) {
      btn.innerHTML = kind === 'all-icon'
        ? FILTER_ALL_SVG
        : kind === 'general-icon'
          ? FILTER_GENERAL_SVG
          : FILTER_KIND_SVG[kind];
      btn.setAttribute('aria-label', label);
      applyFilterIconChip1E(btn, active, kind === 'all-icon' ? 'all' : kind === 'general-icon' ? 'group' : kind);
    } else if (kind === 'group' && opts?.groupId) {
      // Grupy jako kompaktowe "G1"/"G2"... (decyzja Macieja 2026-07-23); pełna nazwa w pigułce.
      const num = label.match(/\d+/)?.[0] ?? '';
      btn.textContent = num ? 'G' + num : label;
      btn.setAttribute('aria-label', label);
      applyFilterIconChip1E(btn, active, 'group');
      Object.assign(btn.style, {
        lineHeight: '1',
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '.02em',
        fontFamily: "'Segoe UI', sans-serif",
      });
    } else {
      applyFilterChip1E(btn, active, kind);
    }
    if (!fullWidth) {
      btn.style.flexShrink = '0';
      btn.style.whiteSpace = 'nowrap';
    } else {
      btn.style.width = 'auto';
    }
    btn.style.pointerEvents = 'auto';
    btn.style.position = 'relative';
    btn.style.zIndex = '2';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return (isClassIcon || (kind === 'group' && opts?.groupId))
      ? wrapWithHoverTooltip1E(btn, label, 'below')
      : btn;
  }

  /** Odswieza pasek filtrów — C09 v4 (typy + grupy jak w walce recznej). */
  private _updateDeployQuickSelectBar(): void {
    const bar = this._deployQuickSelectBar;
    if (!bar || !this.deployPhase) return;
    bar.innerHTML = '';
    // Dwa piętra (decyzja Macieja 2026-07-23): rząd 1 = klasy + Wszystkie (+ Generał w walce),
    // rząd 2 = grupy G1/G2/...
    Object.assign(bar.style, {
      flexDirection: 'column',
      flexWrap: 'nowrap',
      gap: '5px',
    });
    const mkRow = (): HTMLDivElement => {
      const r = document.createElement('div');
      Object.assign(r.style, { display: 'flex', flexWrap: 'wrap', gap: '5px' });
      return r;
    };
    const row1 = mkRow();
    bar.appendChild(row1);

    row1.appendChild(this._makeDeployQuickBtn(
      'Konnica',
      this._isDeploySelectionExactlyKind('mounted'),
      () => this._selectDeployByKindToggle('mounted'),
      { kind: 'mounted', fullWidth: false },
    ));
    row1.appendChild(this._makeDeployQuickBtn(
      'Piechota',
      this._isDeploySelectionExactlyKind('melee'),
      () => this._selectDeployByKindToggle('melee'),
      { kind: 'melee', fullWidth: false },
    ));
    row1.appendChild(this._makeDeployQuickBtn(
      DEPLOY_KIND_LABEL.ranged,
      this._isDeploySelectionExactlyKind('ranged'),
      () => this._selectDeployByKindToggle('ranged'),
      { kind: 'ranged', fullWidth: false },
    ));
    row1.appendChild(this._makeDeployQuickBtn(
      'Wszystkie',
      this._isDeploySelectionAll(),
      () => this._selectDeployAllToggle(),
      { kind: 'all-icon', fullWidth: false },
    ));

    const groups = this._sortedGroupIds();
    if (groups.length > 0) {
      const row2 = mkRow();
      bar.appendChild(row2);
      for (const gid of groups) {
        const managing = this._deployActiveGroupId === gid;
        const selected = this._isDeploySelectionExactlyGroup(gid);
        row2.appendChild(this._makeDeployQuickBtn(
          this._groupDisplayLabel(gid),
          managing || selected,
          () => this._handleDeployGroupTabClick(gid),
          { kind: 'group', groupId: gid, fullWidth: false },
        ));
      }
    }
  }

  /** Dolna belka „Zarządzaj grupą” — nad toolbarem Formacja/Taktyka. */
  private _buildDeployGroupManagerRail(): void {
    if (this._deployGroupManagerRail?.isConnected) return;
    let rail = document.getElementById('deploy-group-manager-rail') as HTMLDivElement | null;
    if (!rail) {
      rail = document.createElement('div');
      rail.id = 'deploy-group-manager-rail';
      applyDeployGroupManagerRail1E(rail);
      document.body.appendChild(rail);
    }
    this._deployGroupManagerRail = rail;
  }

  /** Pozycja i widoczność dolnej belki grup. */
  private _syncDeployGroupManagerRailLayout(): void {
    const rail = this._deployGroupManagerRail;
    if (!rail) return;
    const groups = this._sortedGroupIds();
    const toolbarUp = !!this._deployToolbar
      && this._deployToolbar.style.display !== 'none'
      && this.deployPhase;
    const show = toolbarUp && groups.length > 0;
    rail.style.display = show ? 'flex' : 'none';
    if (!show) return;
    const edge = this._deployRosterRightEdgePx();
    rail.style.left = (edge > 0 ? edge : 0) + 'px';
    rail.style.bottom = (16 + DEPLOY_TOOLBAR_H + DEPLOY_GROUP_RAIL_GAP) + 'px';
  }

  /** Pasek zarządzania grupami — tylko stan aktywnej grupy (UI jak walka). */
  private _updateDeployGroupsBar(): void {
    if (!this.deployPhase) {
      if (this._deployGroupManagerRail) {
        this._deployGroupManagerRail.style.display = 'none';
        this._deployGroupManagerRail.innerHTML = '';
      }
      return;
    }
    const groups = this._sortedGroupIds();
    if (groups.length === 0) {
      this._deployActiveGroupId = null;
    } else if (!this._deployActiveGroupId || !groups.includes(this._deployActiveGroupId)) {
      this._deployActiveGroupId = groups[0]!;
    }
    if (this._deployGroupManagerRail) {
      this._deployGroupManagerRail.style.display = 'none';
      this._deployGroupManagerRail.innerHTML = '';
    }
    if (this._deployGroupsBar) {
      this._deployGroupsBar.style.display = 'none';
      this._deployGroupsBar.innerHTML = '';
    }
    this._syncRosterBottomInset();
  }

  /** Doktryny — ukryty pasek w rosterze; taktyka/strategia w dropdownie toolbara. */
  private _updateDeployStrategyBar(): void {
    const bar = this._deployStrategyBar;
    if (bar) bar.style.display = 'none';
    if (this._deployOpenDropdown === 'tactics') {
      const popup = this._deployDropdownPopups.tactics;
      if (popup) this._renderDeployTacticsPopup(popup);
    }
    if (this._deployOpenDropdown === 'strategy') {
      const popup = this._deployDropdownPopups.strategy;
      if (popup) this._renderDeployStrategyPopup(popup);
    }
    this._updateDeployToolbarStatus();
  }

  /** @deprecated Dolny pasek GRUPY — zawsze ukryty (grupy w lewym panelu rosteru). */
  private _ensureGroupSelectorBar(): void {
    const existing = document.getElementById('group-selector-bar') as HTMLDivElement | null;
    if (existing) {
      existing.style.display = 'none';
      this._groupSelectorBar = existing;
      return;
    }
    if (this._groupSelectorBar?.isConnected) {
      this._groupSelectorBar.style.display = 'none';
      return;
    }
    if (this._groupSelectorBar) return;
    const bar = document.createElement('div');
    bar.id = 'group-selector-bar';
    bar.style.display = 'none';
    this.overlay.appendChild(bar);
    this._groupSelectorBar = bar;
  }

  /** Pozycjonuje pasek grup — wyłączony; roster pełna wysokość. */
  private _updateGroupSelectorBarLayout(): void {
    if (this._groupSelectorBar) this._groupSelectorBar.style.display = 'none';
    if (this._rosterBar) this._rosterBar.style.bottom = '0';
    const toolbarVisible = !!this._deployToolbar
      && this._deployToolbar.style.display !== 'none'
      && (this.deployPhase || (this.started && !this.finished && this._manualMode));
    if (this._selPanel) {
      this._selPanel.style.bottom = (toolbarVisible ? DEPLOY_TOOLBAR_RESERVE + 14 : 14) + 'px';
      this._selPanel.style.zIndex = toolbarVisible ? '100250' : '100065';
    }
  }

  /** @deprecated Grupy w lewym panelu rosteru — ten pasek nie jest używany. */
  private _updateGroupSelectorBar(): void {
    this._updateGroupSelectorBarLayout();
  }

  /** Odtwarza roster walki — lewy panel pionowy (stała szerokość, 4 kolumny). */
  /** Guard — _rebuildBattleRosterGrid ↔ _updateRosterBar (crash: Maximum call stack). */
  private _rebuildBattleRosterGridBusy = false;

  private _rebuildBattleRosterGrid(): void {
    if (this._rebuildBattleRosterGridBusy) return;
    this._rebuildBattleRosterGridBusy = true;
    try {
      this._rebuildBattleRosterGridInner();
    } finally {
      this._rebuildBattleRosterGridBusy = false;
    }
  }

  private _rebuildBattleRosterGridInner(): void {
    if (this.deployPhase || !this._rosterBar) return;

    if (!this._battleRosterCards?.isConnected) {
      this._rosterBar = null;
      this._battleRosterCards = null;
      this._battleLooseCards = null;
      this._buildRosterBar();
      return;
    }
    this._battleRosterCards.innerHTML = '';
    this._battleLooseCards = null;
    this._unitCards.clear();
    this._battleGroupTabs.clear();
    this._battleGroupBlocks.clear();

    const inGroup = new Set<string>();
    for (const gid of this._sortedGroupIds()) {
      const memberIds = this._liveGroupMemberIds(gid);
      if (memberIds.length === 0) continue;
      const block = this._createRosterGroupBlock(gid, false);
      this._battleRosterCards?.appendChild(block.wrapper);
      this._battleGroupTabs.set(gid, block.header);
      this._battleGroupBlocks.set(gid, block);
      for (const id of memberIds) {
        const ru = this._playerRoster().find(u => u.bu.id === id);
        if (!ru || ru.dead || ru.removed || ru.routed) continue;
        inGroup.add(id);
        const card = this._createUnitCard(ru);
        block.cards.appendChild(card);
        this._unitCards.set(id, card);
      }
      this._applyRosterGroupCollapse(gid, false);
    }

    const ungrouped = this._playerRoster().filter(u =>
      !u.dead && !u.removed && !u.routed && !inGroup.has(u.bu.id),
    );
    this._battleLooseCards = null;
    if (ungrouped.length > 0) {
      const looseWrap = document.createElement('div');
      looseWrap.id = 'battle-loose-cards';
      looseWrap.className = 'roster-loose-cards';
      for (const ru of ungrouped) {
        const card = this._createUnitCard(ru);
        looseWrap.appendChild(card);
        this._unitCards.set(ru.bu.id, card);
      }
      this._battleRosterCards?.appendChild(looseWrap);
      this._battleLooseCards = looseWrap;
    }
    this._updateRosterBar();
    this._updateBattleRosterHeader();
    this._updateBattleSelectionBar();
    this._updateBattleQuickSelectBar();
    this._updateGroupSelectorBar();
    requestAnimationFrame(() => this._syncBattleRosterPanelLayout());
  }

  /** Odswieza karty, naglowek, panel po zmianie zaznaczenia (deploy = jak walka, bez skali 3D). */
  private _refreshDeploySelectionVisuals(): void {
    this._clearDeployGhosts();
    for (const u of this._playerRoster()) {
      if (u.dead || u.removed) continue;
      u.group.scale.setScalar(1.0);
      const sel = this._selectedUnits.has(u.bu.id);
      if (sel) {
        const ring = this._selectionRings.get(u.bu.id);
        if (ring) ring.position.set(0, 0.03, 0);
      }
    }
    this._deploySelected = this._selectedUnits.size === 1
      ? this._primarySelectedUnit()
      : (this._selectedUnits.size > 0 ? this._primarySelectedUnit() : null);
    this._updateRosterBar();
    this._updateBattleRosterHeader();
    this._updateDeployDetailPanel();
    this._updateBattleQuickSelectBar();
    this._updateDeployToolbarSelection();
    this._syncDeployToolbarFromSelection();
    this._updateDeployGroupsBar();
    this._updateDeployStrategyBar();
    this._syncDeployRosterGroupVisibility();
    this._refreshDeployGroupHeaderLabels();
    this._syncRosterBottomInset();
  }

  /** Sprzata UI specyficzne dla fazy deploy po starcie walki. */
  private _teardownDeployUI(): void {
    this._removeDeployHalfLabels();
    if (this._deployDetailPanel?.parentNode) {
      this._deployDetailPanel.parentNode.removeChild(this._deployDetailPanel);
    }
    if (this._deployRosterDock?.parentNode) {
      this._deployRosterDock.parentNode.removeChild(this._deployRosterDock);
    }
    if (this._deployGroupManagerRail?.parentNode) {
      this._deployGroupManagerRail.parentNode.removeChild(this._deployGroupManagerRail);
    }
    this._deployRosterDock = null;
    this._deployGroupManagerRail = null;
    this._deployGroupsBar = null;
    // player-roster-bar zostaje — ten sam panel w walce
    this._deployRosterHeader = null;
    this._deployRosterCount = null;
    this._deployRosterFeedback = null;
    this._deployDetailPanel = null;
    this._deployQuickSelectBar = null;
    this._deployGroupsStrip = null;
    this._deployGroupTabs.clear();
    this._deployGroupBlocks.clear();
    this._deployFmtRow = null;
    this._deployCavRow = null;
    this._deployDirRow = null;
    // Zachowaj dolny toolbar (Taktyka/Strategia) — tylko rebind referencji po usunieciu paneli deploy.
    this._rebindDeployToolbarRefs();
    this._deployOpenDropdown = null;
    this._deployHint = null;
    this._deploySelBar = null;
    this._deployRosterFooter = null;
    this._closeDeployDropdowns();
    this._syncBattleToolbarMode();
    this._deployUnitsRow = null;
    this._deployLooseCards = null;
    this._deployRosterScroll = null;
    this._deployGroupsBar = null;
    this._deployStrategyBar = null;
    this._deployRowUnits = null;
    this._deployRosterGridEl = null;
    this._deployGroupTabs.clear();
    this._deployGroupBlocks.clear();
    this._unitCards.clear();
    this._deployDrag = null;
    this._deployMoveStart = null;
    this._deployPickPending = null;
    this._clearDeployGhosts();
    if (this._deployGhostGroup) {
      this.scene.remove(this._deployGhostGroup);
      this._deployGhostGroup = null;
    }
    this._updateGroupSelectorBarLayout();
    this._rebuildBattleRosterGrid();
    this._syncRosterBottomInset();
  }

  /**
   * Obsluguje klik w fazie rozstawiania: najpierw raycast 3D na meshach
   * atakujacych (precyzyjne trafienie w model), potem raycast y=0 do
   * wyznaczenia celu przeniesienia.
   *
   * NAPRAWA BUGU: poprzednia wersja uzywala wylacznie plaszczyzny y=0 do
   * wyznaczenia celu przeniesienia. Przy pochylonej kamerze dawalo to przesuniecie
   * w strone kamery — Math.round trafial sasiedni kafelek. Teraz raycast na
   * meshach terenu (_battleGroundPickMeshes), jak picker.ts na mapie swiata.
   * preferPlacement=true pomija ponowne trafienie w model jednostki (klik na pole).
   */
  private _onDeployClick(cx: number, cy: number, preferPlacement = false): void {
    if (!this.deployPhase) return;

    // Kafel pod kursorem liczony RAZ na starcie — uzywany zarowno do
    // weryfikacji trafienia modelu (KROK 1, patrz BLAD K2 nizej), jak i do
    // przeniesienia (KROK 2).
    const tile = this._pickGroundTile(cx, cy);

    // --- KROK 1: Sprawdz 3D-raycast na meshach atakujacych ---
    // Dzieki temu klikniecie w dowolna czesc modelu (nie tylko podstawe)
    // precyzyjnie identyfikuje jednostke bez bledu perspektywy.
    // Pomijamy gdy uzytkownik kliknal puste pole z zaznaczeniem (preferPlacement).
    if (!preferPlacement) {
      const raycaster = this._raycastFromCanvas(cx, cy);
      if (raycaster) {
      const atkGroups = this._playerRoster()
        .filter(u => !u.dead && !u.removed)
        .map(u => u.group);
      const hits3d = raycaster.intersectObjects(atkGroups, true);
      if (hits3d.length > 0) {
        let hitUnit: RuntimeBattleUnit | null = null;
        const roster = this._playerRoster();
        for (const h of hits3d) {
          let obj: THREE.Object3D | null = h.object;
          while (obj) {
            const found = roster.find(u => u.group === obj && !u.dead && !u.removed);
            if (found) { hitUnit = found; break; }
            obj = obj.parent;
          }
          if (hitUnit) break;
        }
        // BŁĄD K2 (właściciel, 2026-07-25): "prawie nie można przenieść
        // pojedynczej jednostki z grupy" — model 3D (włócznia/pióropusz/
        // sylwetka) często wystaje POZA własny kafel na sąsiedni, zwłaszcza
        // gdy jednostki stoją ciasno w grupie/formacji. Bez tej weryfikacji
        // raycast na mesh łapał SĄSIADA jednostki, którą user próbował
        // przenieść (klik "obok" trafiał w model grupowego kolegi) — więc
        // zamiast ruchu wychodziła cicha zmiana zaznaczenia ("cuda" z
        // relacji właściciela). Honorujemy trafienie modelu TYLKO gdy
        // realnie zgadza się z kaflem geometrycznie wskazywanym przez
        // kursor (_pickGroundTile) — czyli user faktycznie mierzy we
        // WŁASNY kafel tej jednostki, nie w sąsiedni. Ten sam mechanizm co
        // BŁĄD K1 (rozjazd kursor/heks) — tu chodzi o priorytet
        // wybór-jednostki vs przenieś-tutaj, nie o samo wyznaczenie kafla.
        if (hitUnit && (!tile || hitUnit.q !== tile.col || hitUnit.r !== tile.row)) {
          hitUnit = null;
        }
        if (hitUnit) {
          this._handleDeployUnitPick(hitUnit, this._lastClickModifiers.ctrl, this._lastClickModifiers.shift);
          return;
        }
      }
      }
    }

    // --- KROK 2: Raycast na teren 3D (cel przeniesienia) ---
    if (!tile) return;
    const { col, row } = tile;

    // Fallback: sprawdz occByKey (na wypadek gdyby raycast 3D nie trafil —
    // np. jednostka bez mesha; dla bezpieczenstwa zachowujemy ten krok)
    if (!preferPlacement) {
      const key = cellKey(col, row);
      const unitAtCell = this.occByKey.get(key);
      if (unitAtCell && this._isPlayerSide(unitAtCell.side)) {
        this._handleDeployUnitPick(unitAtCell, this._lastClickModifiers.ctrl, this._lastClickModifiers.shift);
        return;
      }
    }

    // LPM + zaznaczenie: przesun na wskazane pole (pojedynczo lub grupa)
    const hasSelection = this._deploySelected != null || this._selectedUnits.size > 0;
    const inZone = this._inDeployPlayerZone(col, row);
    const passable = this.terrainMap.passable(col, row);
    if (hasSelection && inZone && passable) {
      const units = this._getDeploySelectedUnits();
      if (units.length > 0) {
        this._applyDeployPlacement(units, col, row, col, row);
        this._clearDeployGhosts();
        return;
      }
    }
    if (hasSelection) {
      if (!inZone) this._showDeployFeedback('Poza strefą rozstawienia');
      else if (!passable) this._showDeployFeedback('Pole nieprzechodne');
      this._clearDeploySelectionState();
    }
  }

  /** Przenosi zaznaczone jednostki (pojedynczo lub grupowo) w strefie deploy. */
  private _moveDeploySelection(targetCol: number, targetRow: number): void {
    const ids: string[] = this._selectedUnits.size > 0
      ? [...this._selectedUnits]
      : (this._deploySelected ? [this._deploySelected.bu.id] : []);
    const units = ids
      .map(id => this._playerRoster().find(u => u.bu.id === id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    if (units.length === 0) return;

    const inDeployZone = (c: number, r: number): boolean =>
      this._inDeployPlayerZone(c, r)
        && this.terrainMap.passable(c, r);

    const isFree = (c: number, r: number, skipId?: string): boolean => {
      const occ = this.occByKey.get(cellKey(c, r));
      return !occ || occ.bu.id === skipId;
    };

    const tryMove = (u: RuntimeBattleUnit, c: number, r: number): boolean => {
      if (!inDeployZone(c, r) || !isFree(c, r, u.bu.id)) return false;
      this._moveDeployUnit(u, c, r);
      return true;
    };

    if (units.length === 1) {
      tryMove(units[0]!, targetCol, targetRow);
      this._refreshDeploySelectionVisuals();
      return;
    }

    const centCol = units.reduce((s, u) => s + u.q, 0) / units.length;
    const centRow = units.reduce((s, u) => s + u.r, 0) / units.length;
    const gid = units[0]!.groupId;
    const sameGroup = !!gid && units.every(u => u.groupId === gid);

    for (const u of units) {
      let dc: number, dr: number;
      if (sameGroup && u.formationOffset) {
        dc = targetCol + u.formationOffset.dc;
        dr = targetRow + u.formationOffset.dr;
      } else {
        dc = targetCol + Math.round(u.q - centCol);
        dr = targetRow + Math.round(u.r - centRow);
      }
      if (!tryMove(u, dc, dr)) {
        let placed = false;
        for (let rad = 1; rad <= 4 && !placed; rad++) {
          for (const [dx, dy] of [[0, rad], [rad, 0], [0, -rad], [-rad, 0]] as const) {
            if (tryMove(u, dc + dx, dr + dy)) { placed = true; break; }
          }
        }
      }
    }
    this._refreshDeploySelectionVisuals();
  }

  // -------------------------------------------------------------------------
  // DEPLOY — duchy jednostek + rozciaganie formacji (Total War)
  // -------------------------------------------------------------------------

  private _initDeployGhostLayer(): void {
    if (this._deployGhostGroup) return;
    const stale = this.scene.getObjectByName('deployGhosts');
    if (stale) this.scene.remove(stale);
    const g = new THREE.Group();
    g.name = 'deployGhosts';
    g.renderOrder = 500;
    this.scene.add(g);
    this._deployGhostGroup = g;
  }

  private _getDeploySelectedUnits(): RuntimeBattleUnit[] {
    return [...this._selectedUnits]
      .map(id => this._playerRoster().find(u => u.bu.id === id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
  }

  private _clearDeployGhosts(): void {
    if (!this._deployGhostGroup) return;
    while (this._deployGhostGroup.children.length > 0) {
      this._deployGhostGroup.remove(this._deployGhostGroup.children[0]!);
    }
    for (const m of this._deployGhostOwnedMats) m.dispose();
    for (const g of this._deployGhostOwnedGeos) g.dispose();
    this._deployGhostOwnedMats = [];
    this._deployGhostOwnedGeos = [];
  }

  /**
   * Obrys zaznaczonego terenu (krawędzie kafli + tileTopY na wzgórzach).
   * Wcześniej ramka leżała na y≈0 i łączyła środki kafli → na reliefie wyglądała
   * jak przesunięcie w bok względem kursora i duchów jednostek.
   */
  private _appendDeployCellOutline(
    minCol: number, minRow: number, maxCol: number, maxRow: number,
    color: number, opacity: number, dashed: boolean,
  ): void {
    if (!this._deployGhostGroup) return;
    const { xMin, xMax, zMin, zMax } = cellBoundsXZ(minCol, minRow, maxCol, maxRow);
    const yLift = 0.08;
    const y00 = tileTopY(this.terrainMap, minCol, minRow) + yLift;
    const y10 = tileTopY(this.terrainMap, maxCol, minRow) + yLift;
    const y11 = tileTopY(this.terrainMap, maxCol, maxRow) + yLift;
    const y01 = tileTopY(this.terrainMap, minCol, maxRow) + yLift;
    const boxGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xMin, y00, zMin),
      new THREE.Vector3(xMax, y10, zMin),
      new THREE.Vector3(xMax, y11, zMax),
      new THREE.Vector3(xMin, y01, zMax),
      new THREE.Vector3(xMin, y00, zMin),
    ]);
    this._deployGhostOwnedGeos.push(boxGeo);
    const boxMat = dashed
      ? new THREE.LineDashedMaterial({
        color, transparent: true, opacity, dashSize: TILE_S * 0.22, gapSize: TILE_S * 0.14,
      })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    this._deployGhostOwnedMats.push(boxMat);
    const boxLine = new THREE.Line(boxGeo, boxMat);
    if (dashed) boxLine.computeLineDistances();
    this._deployGhostGroup.add(boxLine);
  }

  /** Podglad przy najechaniu / podczas drag rozciagania formacji. */
  private _updateDeployPlacementPreview(cx: number, cy: number): void {
    if (!this.deployPhase || this._selectedUnits.size === 0) {
      this._clearDeployGhosts();
      return;
    }
    if (this._deployDrag) {
      this._refreshDeployGhosts();
      return;
    }
    const tile = this._pickGroundTile(cx, cy);
    if (!tile || !this._inDeployPlayerZone(tile.col, tile.row)) {
      this._clearDeployGhosts();
      return;
    }
    this._refreshDeployGhostsAt(tile.col, tile.row);
  }

  /**
   * Rozmieszczenie zaznaczonych jednostek: klik / krotki drag → formacja F1/F2/F3
   * (lub zachowane offsety grupy); dlugi drag → rozciaganie linii (Total War).
   */
  private _computeDeployPlacementLayout(
    units: RuntimeBattleUnit[],
    anchorCol: number,
    anchorRow: number,
    dragCol: number,
    dragRow: number,
  ): Map<string, { col: number; row: number }> {
    const n = units.length;
    if (n === 0) return new Map();

    if (n === 1) {
      const out = new Map<string, { col: number; row: number }>();
      out.set(units[0]!.bu.id, { col: dragCol, row: dragRow });
      return out;
    }

    const isStretchDrag =
      Math.abs(dragCol - anchorCol) > 1 || Math.abs(dragRow - anchorRow) > 1;
    if (isStretchDrag) {
      return this._computeDeployStretchLayout(units, anchorCol, anchorRow, dragCol, dragRow);
    }

    return this._computeFormationLayoutAt(
      units, dragCol, dragRow, this._formationForDeployUnits(units),
    );
  }

  /**
   * Domyslna formacja wg skladu: piechota > dystans; oblezenie gdy sa machiny
   * i brak piechoty wrecz.
   */
  private _inferDefaultFormation(units: RuntimeBattleUnit[]): GroupFormation {
    if (units.length === 0) return 'F2';
    let hasMelee = false;
    let hasRanged = false;
    let hasSiege = false;
    for (const u of units) {
      const role = this._deployRoleOf(u);
      if (role === 'melee' || role === 'javelin') hasMelee = true;
      else if (role === 'archer') hasRanged = true;
      else if (role === 'siege') hasSiege = true;
    }
    if (hasSiege && !hasMelee) return 'F3';
    if (hasMelee) return 'F2';
    if (hasRanged) return 'F1';
    return 'F2';
  }

  private _inferDefaultFormationForGroup(gid: string): GroupFormation {
    const units = this._liveGroupMemberIds(gid)
      .map(id => this._findPlayerUnit(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    return this._inferDefaultFormation(units);
  }

  /** Aktywny schemat formacji dla biezacego zaznaczenia deploy. */
  private _formationForDeployUnits(units: RuntimeBattleUnit[]): 'F1' | 'F2' | 'F3' {
    const gid = units[0]?.groupId;
    if (gid && units.every(u => u.groupId === gid)) {
      return this._ensureGroupMeta(gid).formation ?? this._inferDefaultFormation(units);
    }
    if (units.length > 0) return this._inferDefaultFormation(units);
    return this._deployActiveFormation;
  }

  /** Ustawienie konnicy dla biezacego zaznaczenia deploy. */
  private _cavalryModeForDeployUnits(units: RuntimeBattleUnit[]): CavalryDeployMode {
    const gid = units[0]?.groupId;
    if (gid && units.every(u => u.groupId === gid)) {
      return this._ensureGroupMeta(gid).cavalryMode ?? this._deployCavalryMode;
    }
    return this._deployCavalryMode;
  }

  /** Rola jednostki w formacji deploy. */
  private _deployRoleOf(u: RuntimeBattleUnit): 'mounted' | 'siege' | 'javelin' | 'archer' | 'melee' {
    if (u.mounted || isMounted(u.bu)) return 'mounted';
    if (isSiegeUnit(u.bu)) return 'siege';
    if (!isPrimaryRanged(u.bu)) return 'melee';
    const kat = normName(String(u.bu.kategoria ?? ''));
    if (kat.includes('oszczep')) return 'javelin';
    return 'archer';
  }

  /** Kolejnosc pasow (front → tyl) + konnica boki/tyl dla F1/F2/F3. */
  private _deployFormationPlan(
    units: RuntimeBattleUnit[],
    formation: 'F1' | 'F2' | 'F3',
    cavalryMode: CavalryDeployMode,
  ): {
    main: Array<{ role: string; units: RuntimeBattleUnit[] }>;
    mountedFlank: RuntimeBattleUnit[];
    mountedRear: RuntimeBattleUnit[];
    flankAtRole: string;
  } {
    const byRole = (role: string): RuntimeBattleUnit[] =>
      units.filter(u => this._deployRoleOf(u) === role);

    const mounted = byRole('mounted');
    const siege = byRole('siege');
    const javelin = byRole('javelin');
    const archers = byRole('archer');
    const meleeUs = byRole('melee');

    let main: Array<{ role: string; units: RuntimeBattleUnit[] }>;
    let flankAtRole = 'melee';

    if (formation === 'F1') {
      main = [
        { role: 'javelin', units: javelin },
        { role: 'archer', units: archers },
        { role: 'melee', units: meleeUs },
        { role: 'siege', units: siege },
      ];
      flankAtRole = 'melee';
    } else if (formation === 'F2') {
      main = [
        { role: 'melee', units: meleeUs },
        { role: 'javelin', units: javelin },
        { role: 'archer', units: archers },
        { role: 'siege', units: siege },
      ];
      flankAtRole = 'melee';
    } else {
      main = [
        { role: 'siege', units: siege },
        { role: 'archer', units: archers },
        { role: 'javelin', units: javelin },
        { role: 'melee', units: meleeUs },
      ];
      flankAtRole = 'archer';
    }

    main = main.filter(b => b.units.length > 0);

    return {
      main,
      mountedFlank: cavalryMode === 'flanks' ? mounted : [],
      mountedRear: cavalryMode === 'rear' ? mounted : [],
      flankAtRole,
    };
  }

  /** @deprecated Glebokosc ustawiana przyciskiem Linie (piechota / lucznicy). */
  private _computeRanksPerBandFromDepthSpan(_depthSpan: number): number {
    return 1;
  }

  /** Dzieli jednostki pasu na rowne rzedy glebokosci. */
  private _splitUnitsIntoRanks(units: RuntimeBattleUnit[], rankCount: number): RuntimeBattleUnit[][] {
    if (units.length === 0) return [];
    const ranks = Math.max(1, Math.min(rankCount, units.length));
    const per = Math.ceil(units.length / ranks);
    const out: RuntimeBattleUnit[][] = [];
    for (let r = 0; r < ranks; r++) {
      const slice = units.slice(r * per, (r + 1) * per);
      if (slice.length > 0) out.push(slice);
    }
    return out;
  }

  /** Rozklad w poprzek (dr) — compact gdy waski drag, rozciagniety gdy szeroki. */
  private _deployLateralRow(
    index: number, count: number, centerRow: number, lateralSpan: number,
  ): number {
    if (count <= 1) return centerRow;
    if (lateralSpan <= 2) {
      return centerRow + index - Math.floor((count - 1) / 2);
    }
    const t = count === 1 ? 0.5 : index / (count - 1);
    const half = Math.max(0, Math.floor(lateralSpan / 2));
    return centerRow + Math.round((t - 0.5) * 2 * half);
  }

  private _colOffForFormation(side: 'atk' | 'def', dc: number): number {
    return side === 'atk' ? -dc : dc;
  }

  private _clampDeployCell(col: number, row: number, side?: 'atk' | 'def'): { col: number; row: number } {
    const s = side ?? (this.deployPhase ? this._playerControlSide() : 'atk');
    if (s === 'def') {
      return {
        col: Math.max(DEPLOY_DEF_MIN_COL, Math.min(DEPLOY_DEF_MAX_COL, col)),
        row: Math.max(DEPLOY_MIN_ROW, Math.min(DEPLOY_MAX_ROW, row)),
      };
    }
    return {
      col: Math.max(DEPLOY_MIN_COL, Math.min(DEPLOY_MAX_COL, col)),
      row: Math.max(DEPLOY_MIN_ROW, Math.min(DEPLOY_MAX_ROW, row)),
    };
  }

  private _clampDeployFormationAnchor(col: number, row: number, side: 'atk' | 'def'): { col: number; row: number } {
    if (!this.deployPhase || side !== this._playerControlSide()) return { col, row };
    if (side === 'atk') {
      let c = Math.min(col, DEPLOY_MAX_COL - 2);
      c = Math.max(c, DEPLOY_MIN_COL + 4);
      const r = Math.max(DEPLOY_MIN_ROW + 6, Math.min(DEPLOY_MAX_ROW - 6, row));
      return { col: c, row: r };
    }
    let c = Math.max(col, DEPLOY_DEF_MIN_COL + 2);
    c = Math.min(c, DEPLOY_DEF_MAX_COL - 4);
    const r = Math.max(DEPLOY_MIN_ROW + 6, Math.min(DEPLOY_MAX_ROW - 6, row));
    return { col: c, row: r };
  }

  /** Docelowe pola deploy wg istniejacych offsetow formacji (grupa). */
  private _deployDestinationsWithOffsets(
    units: RuntimeBattleUnit[],
    targetCol: number,
    targetRow: number,
  ): Map<string, { col: number; row: number }> {
    const out = new Map<string, { col: number; row: number }>();
    for (const u of units) {
      const off = u.formationOffset ?? { dc: 0, dr: 0 };
      const raw = { col: targetCol + off.dc, row: targetRow + off.dr };
      out.set(u.bu.id, this._clampDeployCell(raw.col, raw.row, u.side));
    }
    return out;
  }

  /** Sloty formacji F1/F2/F3 — wspolne dla przycisku formacji i klikniecia na mape. */
  private _formationSlotsForUnits(
    units: RuntimeBattleUnit[],
    formation: 'F1' | 'F2' | 'F3',
  ): Array<[RuntimeBattleUnit, number, number]> {
    const cavalryMode = this._cavalryModeForDeployUnits(units);
    const plan = this._deployFormationPlan(units, formation, cavalryMode);
    const slots: Array<[RuntimeBattleUnit, number, number]> = [];

    const addBandLine = (list: RuntimeBattleUnit[], frontDc: number): void => {
      if (list.length === 0) return;
      const n = list.length;
      list.forEach((u, i) => {
        slots.push([u, frontDc, i - Math.floor((n - 1) / 2)]);
      });
    };

    let dc = 0;
    let flankDc = 0;
    let maxHalfWidth = 0;

    for (const band of plan.main) {
      if (band.role === plan.flankAtRole) flankDc = dc;
      const rankSlices = this._splitUnitsIntoRanks(
        band.units, this._deployLinesForRole(band.role),
      );
      for (let r = 0; r < rankSlices.length; r++) {
        const slice = rankSlices[r]!;
        addBandLine(slice, dc + r);
        maxHalfWidth = Math.max(maxHalfWidth, Math.ceil(slice.length / 2));
      }
      dc += rankSlices.length;
    }

    const wingBase = maxHalfWidth + 1;
    plan.mountedFlank.forEach((u, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      slots.push([u, flankDc, side * (wingBase + Math.floor(i / 2))]);
    });
    addBandLine(plan.mountedRear, dc);

    const seen = new Set<string>();
    const uniqueSlots: Array<[RuntimeBattleUnit, number, number]> = [];
    for (const entry of slots) {
      if (seen.has(entry[0].bu.id)) continue;
      seen.add(entry[0].bu.id);
      uniqueSlots.push(entry);
    }
    for (const u of units) {
      if (!seen.has(u.bu.id)) uniqueSlots.push([u, 0, 0]);
    }
    return uniqueSlots;
  }

  /** Mapa pol docelowych formacji kotwiczona w punkcie klikniecia (bez przesuwania kotwicy). */
  private _computeFormationLayoutAt(
    units: RuntimeBattleUnit[],
    anchorCol: number,
    anchorRow: number,
    formation: 'F1' | 'F2' | 'F3',
  ): Map<string, { col: number; row: number }> {
    const out = new Map<string, { col: number; row: number }>();
    for (const [u, dc, dr] of this._formationSlotsForUnits(units, formation)) {
      const colOff = this._colOffForFormation(u.side, dc);
      out.set(u.bu.id, this._clampDeployCell(anchorCol + colOff, anchorRow + dr, u.side));
    }
    return out;
  }

  /** Kolejnosc jednostek w rozciaganej formacji (role F1/F2/F3 — przod → tyl). */
  private _sortUnitsForDeployStretch(units: RuntimeBattleUnit[]): RuntimeBattleUnit[] {
    const formation = this._formationForDeployUnits(units);
    const slots = this._formationSlotsForUnits(units, formation);
    const rank = new Map(slots.map(([u], i) => [u.bu.id, i]));
    return [...units].sort(
      (a, b) => (rank.get(a.bu.id) ?? 999) - (rank.get(b.bu.id) ?? 999),
    );
  }

  /** Zapisuje offsety formacji przed ruchem (klik bez wczesniejszej formacji). */
  private _persistFormationOffsets(units: RuntimeBattleUnit[], formation: 'F1' | 'F2' | 'F3'): void {
    for (const [u, dc, dr] of this._formationSlotsForUnits(units, formation)) {
      u.formationOffset = { dc: this._colOffForFormation(u.side, dc), dr };
    }
  }

  /** Klik / drag na mape deploy — formacja lub rozciaganie. */
  private _applyDeployPlacement(
    units: RuntimeBattleUnit[],
    anchorCol: number,
    anchorRow: number,
    dragCol: number,
    dragRow: number,
  ): void {
    if (units.length === 0) return;

    const isStretchDrag =
      Math.abs(dragCol - anchorCol) > 1 || Math.abs(dragRow - anchorRow) > 1;

    if (units.length === 1) {
      units[0]!.formationOffset = { dc: 0, dr: 0 };
    } else if (!isStretchDrag) {
      this._persistFormationOffsets(units, this._formationForDeployUnits(units));
    } else if (isStretchDrag && units.length > 1) {
      const layout = this._computeDeployPlacementLayout(units, anchorCol, anchorRow, dragCol, dragRow);
      for (const u of units) {
        const pos = layout.get(u.bu.id);
        if (pos) {
          u.formationOffset = { dc: pos.col - anchorCol, dr: pos.row - anchorRow };
        }
      }
      this._applyDeployLayout(layout);
      return;
    }

    this._applyDeployLayout(
      this._computeDeployPlacementLayout(units, anchorCol, anchorRow, dragCol, dragRow),
    );
  }

  /**
   * Rozciaganie: drag w bok = szerokosc linii; glebokosc (1–3 linie) z przycisku Linie.
   * Kolejnosc pasow wg F1/F2/F3; konnica osobno (boki / tyl).
   */
  private _computeDeployStretchLayout(
    units: RuntimeBattleUnit[],
    anchorCol: number,
    anchorRow: number,
    dragCol: number,
    dragRow: number,
  ): Map<string, { col: number; row: number }> {
    const formation = this._formationForDeployUnits(units);
    const cavalryMode = this._cavalryModeForDeployUnits(units);
    const plan = this._deployFormationPlan(units, formation, cavalryMode);
    const out = new Map<string, { col: number; row: number }>();
    if (units.length === 0) return out;

    const absC = Math.abs(dragCol - anchorCol);
    const absR = Math.abs(dragRow - anchorRow);
    if (absC <= 1 && absR <= 1) {
      return this._computeFormationLayoutAt(units, dragCol, dragRow, formation);
    }

    const side = units[0]?.side ?? 'atk';
    const lateralSpan = Math.max(1, absC + 1);

    const frontCol = side === 'atk'
      ? Math.max(anchorCol, dragCol)
      : Math.min(anchorCol, dragCol);
    const centerRow = Math.round((anchorRow + dragRow) / 2);

    let dcCursor = 0;
    let flankDc = 0;
    let maxHalfWidth = 0;

    for (const band of plan.main) {
      if (band.role === plan.flankAtRole) flankDc = dcCursor;
      const rankSlices = this._splitUnitsIntoRanks(
        band.units, this._deployLinesForRole(band.role),
      );
      for (let r = 0; r < rankSlices.length; r++) {
        const rankUnits = rankSlices[r]!;
        const rankDc = dcCursor + r;
        const colOff = this._colOffForFormation(side, rankDc);
        const rankCol = frontCol + colOff;
        rankUnits.forEach((u, i) => {
          const row = this._deployLateralRow(i, rankUnits.length, centerRow, lateralSpan);
          out.set(u.bu.id, this._clampDeployCell(rankCol, row));
        });
        maxHalfWidth = Math.max(maxHalfWidth, Math.ceil(rankUnits.length / 2));
      }
      dcCursor += rankSlices.length;
    }

    const wingBase = maxHalfWidth + 1;
    const flankColOff = this._colOffForFormation(side, flankDc);
    const flankCol = frontCol + flankColOff;
    plan.mountedFlank.forEach((u, i) => {
      const sideSign = i % 2 === 0 ? 1 : -1;
      const row = centerRow + sideSign * (wingBase + Math.floor(i / 2));
      out.set(u.bu.id, this._clampDeployCell(flankCol, row));
    });

    if (plan.mountedRear.length > 0) {
      const rearSlices = this._splitUnitsIntoRanks(plan.mountedRear, 1);
      for (let r = 0; r < rearSlices.length; r++) {
        const rankUnits = rearSlices[r]!;
        const rankDc = dcCursor + r;
        const colOff = this._colOffForFormation(side, rankDc);
        const rankCol = frontCol + colOff;
        rankUnits.forEach((u, i) => {
          const row = this._deployLateralRow(i, rankUnits.length, centerRow, lateralSpan);
          out.set(u.bu.id, this._clampDeployCell(rankCol, row));
        });
      }
    }

    for (const u of units) {
      if (!out.has(u.bu.id)) {
        out.set(u.bu.id, this._clampDeployCell(frontCol, centerRow));
      }
    }
    return out;
  }

  /**
   * Docelowe pola duchow deploy: formacja / offsety grupy / rozciaganie drag.
   */
  private _computeDeployGhostLayout(
    units: RuntimeBattleUnit[],
    anchorCol: number,
    anchorRow: number,
    dragCol: number,
    dragRow: number,
  ): Map<string, { col: number; row: number }> {
    return this._computeDeployPlacementLayout(units, anchorCol, anchorRow, dragCol, dragRow);
  }

  private _isDeployCellOk(col: number, row: number, skipIds: Set<string>): boolean {
    if (!this._inDeployPlayerZone(col, row)) return false;
    if (!this.terrainMap.passable(col, row)) return false;
    const occ = this.occByKey.get(cellKey(col, row));
    return !occ || skipIds.has(occ.bu.id);
  }

  private _resolveDeployCell(
    wantCol: number,
    wantRow: number,
    skipIds: Set<string>,
  ): [number, number] | null {
    const tryCell = (c: number, r: number): [number, number] | null =>
      this._isDeployCellOk(c, r, skipIds) ? [c, r] : null;
    let hit = tryCell(wantCol, wantRow);
    if (hit) return hit;
    for (let rad = 1; rad <= 3; rad++) {
      for (const [dx, dy] of [[0, rad], [rad, 0], [0, -rad], [-rad, 0],
        [rad, rad], [rad, -rad], [-rad, rad], [-rad, -rad]] as const) {
        hit = tryCell(wantCol + dx, wantRow + dy);
        if (hit) return hit;
      }
    }
    return null;
  }

  /** Fizyczne rozstawienie jednostek wg mapy pol (kolejnosc slotow formacji). */
  private _placeDeployLayoutUnits(
    units: RuntimeBattleUnit[],
    layout: Map<string, { col: number; row: number }>,
    slotOrder?: RuntimeBattleUnit[],
  ): number {
    if (units.length === 0) return 0;
    const skipIds = new Set(units.map(u => u.bu.id));
    const taken = new Set<string>();
    for (const ru of [...this.atk, ...this.def]) {
      if (!ru.dead && !ru.removed && !skipIds.has(ru.bu.id)) {
        taken.add(cellKey(ru.q, ru.r));
      }
    }

    const order = slotOrder ?? units;
    let placed = 0;
    for (const u of order) {
      const want = layout.get(u.bu.id);
      if (!want) continue;
      taken.delete(cellKey(u.q, u.r));
      let dest: [number, number] | null = null;
      if (this._isDeployCellOk(want.col, want.row, skipIds) && !taken.has(cellKey(want.col, want.row))) {
        dest = [want.col, want.row];
      } else {
        dest = this._resolveDeployCell(want.col, want.row, skipIds);
        if (dest && taken.has(cellKey(dest[0], dest[1]))) dest = null;
      }
      if (!dest) continue;
      const [col, row] = dest;
      taken.add(cellKey(col, row));
      this._moveDeployUnit(u, col, row);
      placed++;
    }
    return placed;
  }

  private _applyDeployLayout(layout: Map<string, { col: number; row: number }>): void {
    const units = this._getDeploySelectedUnits();
    if (units.length === 0) return;
    const formation = this._formationForDeployUnits(units);
    const slotOrder = this._formationSlotsForUnits(units, formation).map(([u]) => u);
    const n = this._placeDeployLayoutUnits(units, layout, slotOrder);
    this._refreshDeploySelectionVisuals();
    if (n > 0) this._showDeployFeedback('Rozstawiono ' + n + ' jednostek');
  }

  /** Rysuje duchy docelowe + ramke rozciagania na mapie. */
  private _refreshDeployGhosts(): void {
    this._initDeployGhostLayer();
    this._clearDeployGhosts();
    if (!this._deployGhostGroup || this._selectedUnits.size === 0) return;
    this._deployGhostGroup.visible = true;

    const units = this._getDeploySelectedUnits();
    if (units.length === 0) return;

    let anchorCol: number;
    let anchorRow: number;
    let dragCol: number;
    let dragRow: number;

    if (this._deployDrag) {
      anchorCol = this._deployDrag.anchorCol;
      anchorRow = this._deployDrag.anchorRow;
      dragCol = this._deployDrag.curCol;
      dragRow = this._deployDrag.curRow;
    } else {
      return;
    }

    const layout = this._computeDeployGhostLayout(
      units, anchorCol, anchorRow, dragCol, dragRow,
    );
    const skipIds = new Set(units.map(u => u.bu.id));
    const discGeo = new THREE.CircleGeometry(0.42, 24);
    discGeo.rotateX(-Math.PI / 2);
    this._deployGhostOwnedGeos.push(discGeo);
    const ringGeo = new THREE.RingGeometry(0.38, 0.48, 24);
    ringGeo.rotateX(-Math.PI / 2);
    this._deployGhostOwnedGeos.push(ringGeo);

    let minC = dragCol;
    let maxC = dragCol;
    let minR = dragRow;
    let maxR = dragRow;

    for (const u of units) {
      const pos = layout.get(u.bu.id);
      if (!pos) continue;
      minC = Math.min(minC, pos.col);
      maxC = Math.max(maxC, pos.col);
      minR = Math.min(minR, pos.row);
      maxR = Math.max(maxR, pos.row);
      const ok = this._isDeployCellOk(pos.col, pos.row, skipIds);
      const { x, z } = cellToWorld(pos.col, pos.row);
      const topY = tileTopY(this.terrainMap, pos.col, pos.row);

      const unitDiscGeo = discGeo.clone();
      this._deployGhostOwnedGeos.push(unitDiscGeo);
      const mat = new THREE.MeshBasicMaterial({
        color: ok ? 0x44ffcc : 0xff5555,
        transparent: true,
        opacity: ok ? 0.55 : 0.45,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this._deployGhostOwnedMats.push(mat);
      const mesh = new THREE.Mesh(unitDiscGeo, mat);
      mesh.position.set(x, topY + 0.06, z);
      this._deployGhostGroup.add(mesh);

      const unitRingGeo = ringGeo.clone();
      this._deployGhostOwnedGeos.push(unitRingGeo);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ok ? 0xd4af37 : 0xff8888,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this._deployGhostOwnedMats.push(ringMat);
      const ring = new THREE.Mesh(unitRingGeo, ringMat);
      ring.position.set(x, topY + 0.07, z);
      this._deployGhostGroup.add(ring);
    }

    this._appendDeployCellOutline(minC, minR, maxC, maxR, 0xffd700, 0.75, false);

    const anchorGeo = new THREE.RingGeometry(0.2, 0.32, 16);
    anchorGeo.rotateX(-Math.PI / 2);
    this._deployGhostOwnedGeos.push(anchorGeo);
    const anchorMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide,
    });
    this._deployGhostOwnedMats.push(anchorMat);
    const ax = cellToWorld(anchorCol, anchorRow);
    const ay = tileTopY(this.terrainMap, anchorCol, anchorRow);
    const anchorMesh = new THREE.Mesh(anchorGeo, anchorMat);
    anchorMesh.position.set(ax.x, ay + 0.09, ax.z);
    this._deployGhostGroup.add(anchorMesh);
  }

  /** Odswieza duchy dla podgladu hover (bez aktywnego drag). */
  private _refreshDeployGhostsAt(col: number, row: number): void {
    if (!this.deployPhase || this._selectedUnits.size === 0 || this._deployDrag) return;
    this._initDeployGhostLayer();
    const units = this._getDeploySelectedUnits();
    if (units.length === 0) return;

    this._clearDeployGhosts();
    if (this._deployGhostGroup) this._deployGhostGroup.visible = true;
    const layout = this._computeDeployPlacementLayout(units, col, row, col, row);
    const skipIds = new Set(units.map(u => u.bu.id));
    const discGeo = new THREE.CircleGeometry(0.42, 24);
    discGeo.rotateX(-Math.PI / 2);
    this._deployGhostOwnedGeos.push(discGeo);

    for (const u of units) {
      const pos = layout.get(u.bu.id);
      if (!pos) continue;
      const ok = this._isDeployCellOk(pos.col, pos.row, skipIds);
      const { x, z } = cellToWorld(pos.col, pos.row);
      const topY = tileTopY(this.terrainMap, pos.col, pos.row);
      const unitDiscGeo = discGeo.clone();
      this._deployGhostOwnedGeos.push(unitDiscGeo);
      const mat = new THREE.MeshBasicMaterial({
        color: ok ? 0x44ffcc : 0xff5555,
        transparent: true, opacity: ok ? 0.5 : 0.4,
        depthWrite: false, side: THREE.DoubleSide,
      });
      this._deployGhostOwnedMats.push(mat);
      const mesh = new THREE.Mesh(unitDiscGeo, mat);
      mesh.position.set(x, topY + 0.06, z);
      this._deployGhostGroup!.add(mesh);
    }

    let minC = col;
    let maxC = col;
    let minR = row;
    let maxR = row;
    for (const u of units) {
      const pos = layout.get(u.bu.id);
      if (!pos) continue;
      minC = Math.min(minC, pos.col);
      maxC = Math.max(maxC, pos.col);
      minR = Math.min(minR, pos.row);
      maxR = Math.max(maxR, pos.row);
    }
    this._appendDeployCellOutline(minC, minR, maxC, maxR, 0x00ffcc, 0.9, true);
  }

  /**
   * Stosuje formacje F1/F2/F3 do zaznaczenia (lub calej armii gdy brak zaznaczenia).
   */
  private _applyDeployArmyFormation(formation: 'F1' | 'F2' | 'F3'): void {
    const live = this._playerRoster().filter(u => !u.dead && !u.removed);
    if (live.length === 0) return;

    // C-BITWA-FORMACJA=B (Maciej 2026-07-25): szyk stosuje się do AKTUALNIE ZAZNACZONEGO
    // zakresu — pojedyncza jednostka / grupa / cała armia (gdy nic nie zaznaczone).
    // „Niezależnie czy wybierzemy jedną jednostkę, formację czy całą armię — zasady
    // obowiązują zaznaczonych" (Maciej). _resolveDeployFormationTargets zwraca dokładnie
    // ten zakres (zaznaczenie → grupa → armia), spójnie na każdym poziomie. Komunikat
    // niżej jasno wskazuje, do czego zastosowano (usuwa dawną dwuznaczność błędu G).
    // Osobny mechanizm „postawa grupy" (_setGroupDoctrine → _applyGroupFormation) nadal
    // ustawia formację per-grupa w auto-grze walki.
    const targets = this._resolveDeployFormationTargets(live);
    if (targets.length === 0) return;

    const groupIds = [...new Set(targets.map(u => u.groupId).filter(Boolean))] as string[];
    for (const g of groupIds) {
      this._ensureGroupMeta(g).formation = formation;
    }

    const moved = this._applyFormationToUnits(targets, formation);
    if (!moved) {
      this._showOrderFeedback('Formacja: brak wolnego miejsca w strefie');
      return;
    }
    this._setDeployActiveFormation(formation);
    this._refreshDeploySelectionVisuals();
    this._updateRosterBar();
    const scopeLabel = targets.length >= live.length
      ? 'cała armia'
      : 'zaznaczenie (' + targets.length + ')';
    this._showOrderFeedback('Formacja ' + formation + ' — ' + scopeLabel);
  }

  /**
   * Ustawia konnice (boki / z tylu) i przelicza aktywna formacje zaznaczenia.
   */
  private _applyDeployCavalryMode(mode: CavalryDeployMode): void {
    const live = this._playerRoster().filter(u => !u.dead && !u.removed);
    if (live.length === 0) return;

    const targets = this._resolveDeployFormationTargets(live);
    if (targets.length === 0) return;

    const gid = targets[0]?.groupId;
    if (gid && targets.every(u => u.groupId === gid)) {
      this._ensureGroupMeta(gid).cavalryMode = mode;
    }

    this._setDeployCavalryMode(mode);
    const formation = this._formationForDeployUnits(targets);
    const moved = this._applyFormationToUnits(targets, formation);
    if (!moved) {
      this._showOrderFeedback('Konnica: brak wolnego miejsca w strefie');
      return;
    }
    this._refreshDeploySelectionVisuals();
    this._updateRosterBar();
    this._showOrderFeedback(mode === 'flanks' ? 'Konnica: boki' : 'Konnica: z ty\u0142u');
  }

  /**
   * C-FLANK (Maciej 2026-07-25): ustawia KIERUNEK NATARCIA (front/bok/tyl) dla
   * auto-odgrywania bitwy -- stosuje sie do aktualnie zaznaczonego zakresu
   * (jednostka/grupa/armia), dokladnie jak Formacja/Konnica powyzej
   * (_resolveDeployFormationTargets zwraca ten sam zakres, spojnie z
   * C-BITWA-FORMACJA=B). W przeciwienstwie do Formacji/Konnicy NIE przestawia
   * fizycznie jednostek w strefie -- to ustawienie ZACHOWANIA w auto-play
   * (manewr na flanke/tyl w _advanceStep / _cavalryAction), nie ukladu
   * poczatkowego deploy.
   */
  private _applyDeployAttackDirection(dir: AttackDirection): void {
    const live = this._playerRoster().filter(u => !u.dead && !u.removed);
    if (live.length === 0) return;

    const targets = this._resolveDeployFormationTargets(live);
    if (targets.length === 0) return;

    for (const u of targets) u.attackDirection = dir;

    const groupIds = [...new Set(targets.map(u => u.groupId).filter(Boolean))] as string[];
    for (const g of groupIds) {
      this._ensureGroupMeta(g).attackDirection = dir;
    }

    this._setDeployAttackDirection(dir);
    this._refreshDeploySelectionVisuals();
    this._updateRosterBar();
    const dirLabel = dir === 'bok' ? 'bok' : dir === 'tyl' ? 'ty\u0142' : 'front';
    const scopeLabel = targets.length >= live.length
      ? 'ca\u0142a armia'
      : 'zaznaczenie (' + targets.length + ')';
    this._showOrderFeedback('Kierunek natarcia: ' + dirLabel + ' \u2014 ' + scopeLabel);
  }

  /** Jednostki objete formacja: zaznaczenie / cala grupa / cala armia. */
  private _resolveDeployFormationTargets(live: RuntimeBattleUnit[]): RuntimeBattleUnit[] {
    const selLive = [...this._selectedUnits]
      .map(id => live.find(u => u.bu.id === id))
      .filter((u): u is RuntimeBattleUnit => !!u);

    if (selLive.length === 0) return live;

    const gids = [...new Set(selLive.map(u => u.groupId).filter(Boolean))] as string[];
    if (gids.length === 1) {
      const members = this._liveGroupMemberIds(gids[0]!)
        .map(id => live.find(u => u.bu.id === id))
        .filter((u): u is RuntimeBattleUnit => !!u);
      if (members.length > 0) return members;
    }
    return selLive;
  }

  /** Zaznacza jednostke w fazie deploy (ring only — bez skali 3D). */
  private _setDeploySelection(ru: RuntimeBattleUnit): void {
    this._clearAllSelection();
    this._selectedUnits.add(ru.bu.id);
    this._addSelectionRing(ru);
    this._deploySelected = ru;
    this._refreshDeploySelectionVisuals();
  }

  /** Odznacza aktualnie zaznaczona jednostke. */
  private _clearDeploySelection(): void {
    if (this._deploySelected) {
      this._deploySelected.group.scale.setScalar(1.0);
    }
    this._deploySelected = null;
  }

  /**
   * Przenosi jednostke atakujaca na nowe pole (col, row).
   * Aktualizuje occByKey, pozycje mesha i pasek HP.
   */
  private _moveDeployUnit(ru: RuntimeBattleUnit, newCol: number, newRow: number): void {
    // Usun stary klucz
    const oldKey = cellKey(ru.q, ru.r);
    this.occByKey.delete(oldKey);
    // Ustaw nowe wspolrzedne
    ru.q = newCol;
    ru.r = newRow;
    const { x, z } = cellToWorld(newCol, newRow);
    const topY = tileTopY(this.terrainMap, newCol, newRow);
    ru.group.position.set(x, topY, z);
    ru.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
    // Wstaw nowy klucz
    this.occByKey.set(cellKey(newCol, newRow), ru);
  }

  /**
   * Reset rozmieszczenia gracza (atak lub obrona) — usuwa jednostki ze sceny
   * i odtwarza startowe pozycje z zapisu _saved*BU.
   */
  private _resetDeployPlayer(): void {
    this._resetDeploySide(this._playerControlSide());
  }

  /** @deprecated alias — używaj _resetDeployPlayer */
  private _resetDeployAttacker(): void {
    this._resetDeploySide('atk');
  }

  private _resetDeploySide(side: 'atk' | 'def'): void {
    const roster = side === 'atk' ? this.atk : this.def;
    for (const ru of roster) {
      if (ru.removed) continue;
      this.occByKey.delete(cellKey(ru.q, ru.r));
      this.scene.remove(ru.group);
      this.scene.remove(ru.hpBarGroup);
    }
    if (side === 'atk') this.atk = [];
    else this.def = [];
    this._groups.clear();
    this._groupCounter = 0;
    this._placeUnitsOneSide(side, this.siegeWallCol >= 0);
    this._clearAllSelection();
    this._clearDeploySelection();
    this._rebuildDeployRosterGrid();
    this._updateDeployRosterHeader();
  }

  /**
   * Ustawia tylko jedną stronę (dla Reset w fazie deploy).
   * Korzysta z _savedAtkBUs / _savedDefBUs zapisanych przy _placeUnits.
   */
  private _placeUnitsOneSide(side: 'atk' | 'def', siegeMode: boolean): void {
    const saved = side === 'atk' ? this._savedAtkBUs : this._savedDefBUs;
    if (saved.length === 0) {
      this._showDeployFeedback('Brak danych do resetu — uzyj Start walki.');
      return;
    }

    const SIEGE_ATK_FRONT_COL = 2;
    const SIEGE_ATK_COL_STEP  = 1;
    let frontCol: number;
    let rankStep: number;
    if (side === 'atk') {
      frontCol = (siegeMode && this.siegeWallCol >= 0)
        ? SIEGE_ATK_FRONT_COL
        : (this.deployPhase ? DEPLOY_ATK_FRONT_COL : ATK_FRONT_COL);
      rankStep = (siegeMode && this.siegeWallCol >= 0)
        ? SIEGE_ATK_COL_STEP
        : (this.deployPhase ? DEPLOY_ATK_COL_STEP : ATK_COL_STEP);
    } else {
      frontCol = this.deployPhase ? DEPLOY_DEF_FRONT_COL : DEF_FRONT_COL;
      rankStep = this.deployPhase ? DEPLOY_DEF_COL_STEP : DEF_COL_STEP;
    }
    const faceDir = side === 'atk' ? Dir.E : Dir.W;

    const clampCol = (c: number): number => Math.max(0, Math.min(BF_COLS - 1, c));
    const clampRow = (r: number): number => Math.max(0, Math.min(BF_ROWS - 1, r));
    const freeOk = (c: number, r: number): boolean =>
      !this.occByKey.has(cellKey(c, r)) && this.terrainMap.passable(c, r);

    const units = saved;
    const meleeI: number[] = [], javI: number[] = [], arcI: number[] = [],
          siegeI: number[] = [], mountIdx: number[] = [];
    units.forEach((u, i) => {
      if (isMounted(u)) { mountIdx.push(i); return; }
      if (isSiegeUnit(u)) { siegeI.push(i); return; }
      if (!isPrimaryRanged(u)) { meleeI.push(i); return; }
      if (normName(String(u.kategoria ?? '')).includes('oszczep')) { javI.push(i); return; }
      arcI.push(i);
    });

    const MAX_LINE = 12;
    const midRow = PLAY_MID_ROW;
    const idealRow = new Array<number>(units.length);
    const idealCol = new Array<number>(units.length);
    const playerSide = this._playerControlSide();

    const layGroup = (list: number[], rankBase: number): number => {
      if (list.length === 0) return 0;
      const per = Math.max(1, Math.min(list.length, MAX_LINE));
      const r0g = midRow - Math.floor(per / 2);
      list.forEach((ui, k) => {
        idealRow[ui] = clampRow(r0g + (k % per));
        idealCol[ui] = clampCol(frontCol + (rankBase + Math.floor(k / per)) * rankStep);
      });
      return Math.ceil(list.length / per);
    };
    let rankBase = 0;
    rankBase += layGroup(meleeI, rankBase);
    rankBase += layGroup(javI, rankBase);
    const arcRanks = layGroup(arcI, rankBase);
    rankBase += arcRanks;
    const siegeRanks = layGroup(siegeI, rankBase);
    const totalFootRanks = rankBase + siegeRanks;
    {
      const mountColOff = totalFootRanks + (this.deployPhase && side === playerSide ? 2 : 5);
      const mountPer = Math.max(1, Math.min(mountIdx.length, MAX_LINE));
      const mountR0 = midRow - Math.floor(mountPer / 2);
      mountIdx.forEach((ui, k) => {
        idealRow[ui] = clampRow(mountR0 + (k % mountPer));
        idealCol[ui] = clampCol(frontCol + (mountColOff + Math.floor(k / mountPer)) * rankStep);
      });
    }

    const placed: RuntimeBattleUnit[] = [];
    for (let idx = 0; idx < units.length; idx++) {
      const bu = units[idx]!;
      let row = idealRow[idx]!;
      let col = idealCol[idx]!;
      let key = cellKey(col, row);
      if (!freeOk(col, row)) {
        let found = false;
        const baseCol = col;
        const rowLo = this.deployPhase && side === playerSide
          ? Math.max(DEPLOY_MIN_ROW, idealRow[idx]! - 8)
          : 0;
        const rowHi = this.deployPhase && side === playerSide
          ? Math.min(DEPLOY_MAX_ROW, idealRow[idx]! + 8)
          : BF_ROWS - 1;
        for (let rr = rowLo; rr <= rowHi && !found; rr++) {
          if (freeOk(baseCol, rr)) { col = baseCol; row = rr; key = cellKey(baseCol, rr); found = true; }
        }
        for (let extra = 1; extra < BF_COLS && !found; extra++) {
          for (let rr = rowLo; rr <= rowHi && !found; rr++) {
            const cc = clampCol(baseCol + extra * rankStep);
            if (freeOk(cc, rr)) { col = cc; row = rr; key = cellKey(cc, rr); found = true; }
          }
        }
      }
      const { x, z } = cellToWorld(col, row);
      const topY = tileTopY(this.terrainMap, col, row);

      let group: THREE.Group;
      try {
        const modelName = String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa);
        group = buildUnitModel(bu.kategoria, sideColor(side, this._playerControlSide()), modelName);
      } catch (_) {
        group = makeFallbackAvatar(sideColor(side, this._playerControlSide()));
      }
      group.position.set(x, topY, z);
      group.rotation.y = dirYaw(faceDir);
      this.scene.add(group);

      const mats: THREE.Material[] = (group.userData['mats'] as THREE.Material[]) ?? [];
      const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

      const ammo0 = ammoCount(bu);
      const ammoShown = Number.isFinite(ammo0) && ammo0 > 0;
      const bars = makeUnitBars(sideColor(side, this._playerControlSide()), ammoShown);
      bars.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
      this.scene.add(bars.hpBarGroup);
      bars.hpBarGroup.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
          const mm = mesh.material;
          if (Array.isArray(mm)) this.ownedMats.push(...mm);
          else if (mm) this.ownedMats.push(mm as THREE.Material);
        }
      });

      const moraleBase = moraleBaseFor(bu);
      const ru: RuntimeBattleUnit = {
        bu,
        group,
        hpBarFg:     bars.hpBarFg,
        hpBarBg:     bars.hpBarBg,
        hpBarGroup:  bars.hpBarGroup,
        moraleBarFg: bars.moraleBarFg,
        moraleBarBg: bars.moraleBarBg,
        ammoBarFg:   bars.ammoBarFg,
        ammoBarBg:   bars.ammoBarBg,
        ammoBarShown: ammoShown,
        q:           col,
        r:           row,
        side,
        dead:        false,
        fadingOut:   false,
        fadeStart:   0,
        acted:       false,
        moveLeft:    movementPoints(bu),
        range:       attackRange(bu),
        rangeBase:   attackRange(bu),
        ranged:      isRanged(bu),
        rangedBase:  isRanged(bu),
        primaryRanged: isPrimaryRanged(bu),
        ammoLeft:    ammo0,
        ammoMax:     ammo0,
        dryCol:           -1,
        heldAfterFallback: false,
        mounted:      isMounted(bu),
        antiCavSpear: isAntiCavSpear(bu),
        phalanx:      isPhalanx(bu),
        facing:       faceDir,
        morale:       moraleBase,
        moraleMax:    moraleBase,
        neverRout:    isNeverRout(bu),
        fleeMorale:   fleeMoraleFor(bu),
        routed:       false,
        screenLostApplied: false,
        fleeStuck:    0,
        surroundApplied: false,
        removed:      false,
        onWallWalkway: false,
        playerOrder:  { type: 'none' },
        rangedKite:       true,
        shootingEnabled:  true,
        groupId:      null,
        formationOffset: null,
        unitDoctrine: null,
        attackDirection: 'front',
        mats,
        perTokenGeos,
      };
      this._updateHpBar(ru);
      this._updateMoraleBar(ru);
      this._updateAmmoBar(ru);
      this.occByKey.set(key, ru);
      placed.push(ru);
    }
    if (side === 'atk') this.atk = placed;
    else this.def = placed;
  }

  /**
   * Ustawia tylko atakujacych (dla Reset w fazie deploy).
   * @deprecated używaj _placeUnitsOneSide('atk', …)
   */
  private _placeUnitsAtkOnly(siegeMode: boolean): void {
    this._placeUnitsOneSide('atk', siegeMode);
  }

  /**
   * Konczy faze rozstawiania — ukrywa overlay i strefe,
   * uruchamia walke.
   */
  private _endDeployPhase(): void {
    // R-BITWA-POWTORKA-I: zapamiętaj stan grup PRZED czymkolwiek innym, żeby
    // _replayBattle -> _initDeployUI mógł go odtworzyć zamiast auto-grupować.
    this._deployGroupSnapshot = new Map();
    this._deployAttackDirSnapshot = new Map();
    for (const ru of this._playerRoster()) {
      if (ru.groupId) this._deployGroupSnapshot.set(ru.bu.id, ru.groupId);
      this._deployAttackDirSnapshot.set(ru.bu.id, ru.attackDirection);
    }
    this.deployPhase = false;
    this._clearAllSelection();
    this._clearDeploySelection();
    this._clearDeployGhosts();
    this._clearOrderPreview();
    this._disposeAllOrderLines();
    this._syncGroupRegistry();
    if (this._orderLinesGroup) this._orderLinesGroup.visible = true;
    this._setDeployZoneVisible(false);
    this._teardownDeployUI();
    this._updateRightRailLayout();
    // Zresetuj vLastWall zeby nie skoczyc czasu po dlugiej fazie deploy
    this.vLastWall = 0;
    this._startBattle();
    this._syncMinimapPhaseChrome();
  }

  // =========================================================================
  // STEROWANIE RECZNIE -- tryb override (RECZNY/AUTO)
  // =========================================================================

  /** Zatrzymaj zaplanowana auto-ture (przejscie AUTO -> RECZNY w trakcie bitwy). */
  private _haltAutoBattleTurn(suspendInFlight = true): void {
    this.vTimers.length = 0;
    this.busy = false;
    this._battleAwaitingOrders = true;
    if (suspendInFlight) this._autoBattleSuspended = true;
  }

  /** Przelacza miedzy trybem AUTO a RECZNYM. */
  private _toggleManualMode(): void {
    this._manualMode = !this._manualMode;
    if (this._manualBtn) {
      this._syncManualRailHighlight();
    }
    if (!this._manualMode) {
      this._clearAllSelection();
      for (const ru of this._playerRoster()) ru.playerOrder = { type: 'none' };
      this._queuedOrderUnitIds.clear();
      this._disposeQueuedOrderArrows();
      for (const gid of this._sortedGroupIds()) {
        const meta = this._ensureGroupMeta(gid);
        if (meta.doctrine === 'manual') {
          meta.doctrine = 'steady';
          meta.autoPlay = true;
        }
      }
      if (this._battleAwaitingOrders) {
        this._kickoffBattleTurn();
      } else if (this.started && !this.finished) {
        this._battleAwaitingOrders = false;
        this._activateNext();
      }
    } else {
      this._haltAutoBattleTurn();
      for (const ru of this._playerRoster()) {
        if (ru.dead || ru.removed || ru.routed) continue;
        ru.playerOrder = { type: 'none' };
        ru.acted = false;
      }
      this._syncGroupRegistry();
      this._showBattleRosterFeedback(
        'Tryb RECZNY — SPACJA = kontynuuj · Taktyka/Strategia = per jednostka (Ctrl+LPM) · Grupuj = wspolna formacja',
      );
    }
    if (this._manualMode && !this._rosterBar) this._buildRosterBar();
    if (this._rosterBar) this._rosterBar.style.display = this._manualMode ? 'flex' : 'none';
    this._battleQuickSelectSig = '';
    this._updateGroupSelectorBarLayout();
    this._updateBattleRosterHeader();
    this._updateBattleSelectionBar();
    this._updateBattleQuickSelectBar();
    this._updateRosterBar();
    this._updateSelectedPanel();
    this._updateBattlePhaseBanner();
    this._syncManualRailHighlight();
    this._syncMinimapPosition();
    this._syncBattleToolbarMode();
  }

  /** Klawisz R — przełącz RECZNE / AUTO. */
  private readonly _onKeyManual = (e: KeyboardEvent): void => {
    if (e.key !== 'r' && e.key !== 'R') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.deployPhase || !this.started || this.finished) return;
    e.preventDefault();
    this._toggleManualMode();
  };

  /** SPACJA — start tury (planowanie) lub wykonaj odlozone dyspozycje. */
  private readonly _onKeyExecuteTurn = (e: KeyboardEvent): void => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    if (isEditableTarget(e.target)) return;
    if (this.deployPhase || !this.started || this.finished) return;
    if (!this._manualMode && !this._battleAwaitingOrders) return;
    e.preventDefault();
    if (this._battleAwaitingOrders) {
      this._kickoffBattleTurn();
      return;
    }
    this._executeQueuedOrders();
  };

  /**
   * Obsluguje klikniecie w fazie walki (tryb RECZNY).
   * Zaznaczanie jednostek gracza / wydawanie rozkazow.
   *
   * NAPRAWA: gdy raycast3D trafi na mesh sceniczny (teren/mur/gruz) bez
   * identyfikacji jednostki, nie wracamy od razu — przechodzimy do
   * kliknięcia na puste pole (rozkaz RUCH). Dodatkowo fallback occByKey.
   */
  /**
   * Box-select: zaznacza wszystkie WLASNE (atk) jednostki ktore mieszcza sie
   * w prostokącie ekranowym (x1,y1)-(x2,y2) w pikselach (client coords).
   */
  private _doBoxSelect(x1: number, y1: number, x2: number, y2: number): void {
    const found: RuntimeBattleUnit[] = [];
    const roster = (this.deployPhase || this._manualMode) ? this._playerRoster() : this.atk;
    this.camera.updateMatrixWorld(true);
    for (const ru of roster) {
      if (ru.dead || ru.fadingOut || ru.removed || ru.routed) continue;
      const p = ru.group.position;
      const px = worldToClientPx(p.x, p.y, p.z, this.camera, this.canvas);
      if (!px) continue;
      if (px.x >= x1 && px.x <= x2 && px.y >= y1 && px.y <= y2) found.push(ru);
    }
    if (found.length === 0) {
      this._clearAllSelection();
      return;
    }
    this._clearAllSelection();
    for (const ru of found) {
      this._selectedUnits.add(ru.bu.id);
      this._addSelectionRing(ru);
    }
    if (this.deployPhase) {
      this._refreshDeploySelectionVisuals();
      this._showDeployFeedback('Zaznaczono: ' + found.length);
    } else {
      this._updateRosterBar();
      this._updateSelectedPanel();
      this._showOrderFeedback('ZAZNACZONO: ' + found.length);
      this._updateBattleQuickSelectBar();
      this._updateBattleSelectionBar();
    }
  }

  /** Wrog sasiedni (Manhattan 1) — auto-walka przy marszu. */
  private _adjacentEnemy(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    const adj = this._pickAdjacentTargetByPriority(ru);
    return adj;
  }

  private _unitBattleClass(ru: RuntimeBattleUnit): BattleUnitClass {
    if (ru.mounted) return 'mounted';
    if (ru.primaryRanged || ru.rangedBase) return 'ranged';
    return 'melee';
  }

  private _battleClassLabel(c: BattleUnitClass): string {
    return DEPLOY_KIND_LABEL[c];
  }

  private _prefsForUnit(ru: RuntimeBattleUnit): BattleUnitClass[] {
    const ac = this._unitBattleClass(ru);
    if (ru.useUnitPriorities) {
      const up = ru.unitTargetPriorities?.[ac];
      if (up && up.length === 3) return up;
    }
    if (ru.groupId) {
      const meta = this._groupMeta.get(ru.groupId);
      if (meta?.useGroupPriorities) {
        const gp = meta.groupTargetPriorities?.[ac];
        if (gp && gp.length === 3) return gp;
      }
    }
    return this._targetPriorities[ac];
  }

  private _priorityScore(ru: RuntimeBattleUnit, enemy: RuntimeBattleUnit): number {
    const ac = this._unitBattleClass(ru);
    const prefs = this._prefsForUnit(ru);
    const ec = this._unitBattleClass(enemy);
    const idx = prefs.indexOf(ec);
    let score = idx >= 0 ? idx : prefs.length;
    if (ac === 'mounted' && enemy.antiCavSpear) score += 0.45;
    return score;
  }

  /** Najlepszy cel wg priorytetow gracza (dystans jako tie-break). */
  private _pickTargetByPriority(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    const ac = this._unitBattleClass(ru);
    let best: RuntimeBattleUnit | null = null;
    let bestP = Infinity;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      const p = this._priorityScore(ru, e);
      const d = manhattan(ru.q, ru.r, e.q, e.r);
      if (p < bestP || (p === bestP && d < bestD)) {
        bestP = p; bestD = d; best = e;
      }
    }
    return best;
  }

  /**
   * C-FLANK (Maciej 2026-07-25): among enemies adjacent to `ru`, when this
   * unit's kierunek natarcia is 'bok'/'tyl' prefer one the blow would land on
   * as flank/rear (relativeHit) -- falling back to the original priority-score
   * pick over ALL adjacent enemies when no adjacent enemy matches (or
   * attackDirection is 'front'), so behaviour is unchanged by default.
   */
  private _pickAdjacentTargetByPriority(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    const adj = this._enemiesOf(ru).filter(e => manhattan(ru.q, ru.r, e.q, e.r) === 1);
    if (adj.length === 0) return null;

    const bestByPriority = (list: RuntimeBattleUnit[]): RuntimeBattleUnit | null => {
      let best: RuntimeBattleUnit | null = null;
      let bestP = Infinity;
      for (const e of list) {
        const p = this._priorityScore(ru, e);
        if (p < bestP || (p === bestP && best && e.bu.hp < best.bu.hp)) {
          bestP = p; best = e;
        }
      }
      return best;
    };

    const desired = desiredHitForDirection(ru.attackDirection);
    if (desired) {
      const matching = adj.filter(e => relativeHit(e.facing, ru.q, ru.r, e.q, e.r) === desired);
      const m = bestByPriority(matching);
      if (m) return m;
    }
    const best = bestByPriority(adj);
    return best;
  }

  private _pickRangedTargetByPriority(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestP = Infinity;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      const d = manhattan(ru.q, ru.r, e.q, e.r);
      if (d > ru.range || d < 1) continue;
      const p = this._priorityScore(ru, e);
      if (p < bestP || (p === bestP && d < bestD)) {
        bestP = p; bestD = d; best = e;
      }
    }
    return best;
  }

  private _ensureGroupMeta(gid: string): GroupMeta {
    let m = this._groupMeta.get(gid);
    if (!m) {
      m = { doctrine: 'steady', autoPlay: true };
      this._groupMeta.set(gid, m);
    }
    return m;
  }

  private _unitDisplayLabel(ru: RuntimeBattleUnit): string {
    return String(ru.bu.nazwa ?? ru.bu.kategoria ?? 'Jednostka');
  }

  /** Jednostki objete popupami Taktyka / Strategia (zaznaczenie, potem aktywna grupa). */
  private _resolveDeployPopupUnits(): RuntimeBattleUnit[] {
    const fromSel = [...this._selectedUnits]
      .map(id => this._findPlayerUnit(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    if (fromSel.length > 0) return fromSel;
    const gid = this._resolveDeployPopupGroupId();
    if (!gid) return [];
    return this._liveGroupMemberIds(gid)
      .map(id => this._findPlayerUnit(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
  }

  private _getEffectiveDoctrine(ru: RuntimeBattleUnit): GroupDoctrine {
    if (ru.unitDoctrine != null) return ru.unitDoctrine;
    if (ru.groupId) {
      const meta = this._groupMeta.get(ru.groupId);
      if (meta) return meta.doctrine;
    }
    return 'steady';
  }

  private _isUnitDoctrineAuto(ru: RuntimeBattleUnit): boolean {
    const doc = this._getEffectiveDoctrine(ru);
    if (doc === 'manual') return false;
    if (ru.unitDoctrine != null) return true;
    if (ru.groupId) {
      const meta = this._groupMeta.get(ru.groupId);
      return meta?.autoPlay ?? true;
    }
    return true;
  }

  /** Meta do wykonania doktryny — doktryna z jednostki, reszta z grupy. */
  private _effectiveMetaForUnit(ru: RuntimeBattleUnit): GroupMeta {
    const doctrine = this._getEffectiveDoctrine(ru);
    const base: GroupMeta = ru.groupId
      ? { ...this._ensureGroupMeta(ru.groupId) }
      : { doctrine: 'steady', autoPlay: true };
    const meta: GroupMeta = {
      ...base,
      doctrine,
      autoPlay: this._isUnitDoctrineAuto(ru),
    };
    if (!ru.groupId && doctrine !== 'defensive' && doctrine !== 'manual' && doctrine !== 'aggressive') {
      if (doctrine === 'steady' || doctrine === 'skirmish') {
        meta.rallyCol = this._forwardCol(ru.side, ru.q, 2);
        meta.rallyRow = ru.r;
      } else {
        const tgt = this._pickTargetByPriority(ru);
        if (tgt) {
          meta.rallyCol = tgt.q;
          meta.rallyRow = tgt.r;
        }
      }
    }
    return meta;
  }

  private _applySkirmishFlagsForUnit(ru: RuntimeBattleUnit): void {
    if (ru.primaryRanged || ru.rangedBase || ru.range > 1) {
      ru.rangedKite = true;
      ru.shootingEnabled = true;
    }
  }

  /** Ustaw doktryne na zaznaczonych jednostkach (per unit, nie nadpisuje calej grupy). */
  private _setUnitsDoctrine(units: RuntimeBattleUnit[], doctrine: GroupDoctrine): void {
    if (units.length === 0) return;
    for (const ru of units) {
      ru.unitDoctrine = doctrine;
      ru.playerOrder = { type: 'none' };
      if (doctrine === 'skirmish') this._applySkirmishFlagsForUnit(ru);
    }
    this._refreshQueuedOrderVisuals();
    const label = this._doctrineLabel(doctrine);
    if (units.length === 1) {
      this._showOrderFeedback('Taktyka · ' + this._unitDisplayLabel(units[0]!) + ': ' + label);
    } else {
      this._showOrderFeedback('Taktyka · ' + units.length + ' jednostek: ' + label);
    }
    this._updateSelectedPanel();
    if (this.deployPhase) this._updateDeployStrategyBar();
    if (!this.deployPhase) this._updateDeployToolbarStatus();
    if (this._generalPanel) this._refreshGeneralPanelBody();
  }

  private _groupCentroid(gid: string): { col: number; row: number } {
    const ids = this._liveGroupMemberIds(gid);
    let col = 0; let row = 0; let n = 0;
    for (const id of ids) {
      const u = this._findUnitById(id);
      if (!u || u.dead || u.removed) continue;
      col += u.q; row += u.r; n++;
    }
    if (n === 0) return { col: 0, row: 0 };
    return { col: Math.round(col / n), row: Math.round(row / n) };
  }

  private _doctrineLabel(d: GroupDoctrine): string {
    if (d === 'defensive') return 'OBRONA';
    if (d === 'steady') return 'ATAK';
    if (d === 'aggressive') return 'SZTURM';
    if (d === 'skirmish') return 'OSTRZAL';
    return 'RECZNIE';
  }

  /** Cel marszu formacji (Atak): centroid + krok do przodu, bez rozpadu linii. */
  private _attackFormationRallyPoint(gid: string, meta: GroupMeta): { col: number; row: number } | null {
    if (this._liveGroupMemberIds(gid).length === 0) return null;
    const side = this._groupSide(gid);
    const cent = this._groupCentroid(gid);
    const fwd = this._advanceDir(side);
    let col: number;
    let row: number;
    if (meta.rallyCol != null && meta.rallyRow != null) {
      const dc = Math.sign(meta.rallyCol - cent.col);
      const dr = Math.sign(meta.rallyRow - cent.row);
      col = cent.col + (dc !== 0 ? dc : fwd);
      row = cent.row + dr;
    } else {
      col = this._forwardCol(side, cent.col, 1);
      row = cent.row;
      const lead = this._liveGroupMemberIds(gid)
        .map(id => this._findUnitById(id))
        .find(u => u && !u.dead && !u.removed);
      const tgt = lead ? this._pickTargetByPriority(lead) : null;
      if (tgt && row !== tgt.r) row += Math.sign(tgt.r - row);
      if (tgt) col = this._clampColTowardEnemy(side, col, tgt.q);
    }
    return {
      col: Math.max(0, Math.min(BF_COLS - 1, col)),
      row: Math.max(0, Math.min(BF_ROWS - 1, row)),
    };
  }

  /** Najlepszy krok szarzy — BFS, potem manewr (takze boczny gdy front zablokowany). */
  private _bestChargeStepKey(ru: RuntimeBattleUnit, tgt?: RuntimeBattleUnit | null): string | null {
    const target = tgt ?? this._pickTargetByPriority(ru);
    if (target) {
      const bfs = this._firstStepAlongPathToAttack(ru);
      if (bfs) return bfs;
      if (ru.mounted) {
        const dNow = manhattan(ru.q, ru.r, target.q, target.r);
        let best: string | null = null;
        let bestScore = -Infinity;
        for (const [dc, dr] of DIRS4) {
          const nc = ru.q + dc;
          const nr = ru.r + dr;
          if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
          const nk = cellKey(nc, nr);
          if (this.occByKey.has(nk)) continue;
          if (!this._passableForUnit(ru, nc, nr)) continue;
          const dTgt = manhattan(nc, nr, target.q, target.r);
          let spearAdj = false;
          for (const e of this._enemiesOf(ru)) {
            if (e.antiCavSpear && manhattan(nc, nr, e.q, e.r) === 1) { spearAdj = true; break; }
          }
          // C-BTL-BROD-Q1: same shore-preferring tie-break as _cavManeuverStep above.
          const fordPenalty = isFordTile(this.terrainMap, nc, nr) ? FORD_AI_AVOID_PENALTY : 0;
          const score = (dNow - dTgt) * 12 - dTgt + (spearAdj ? 0 : 4) - fordPenalty;
          if (score > bestScore) { bestScore = score; best = nk; }
        }
        if (best) return best;
        return this._stepToward(ru, target);
      }
      return this._stepToward(ru, target);
    }
    const nc = this._forwardCol(ru.side, ru.q, 1);
    if (nc < 0 || nc >= BF_COLS) return null;
    for (const r of [ru.r, ru.r - 1, ru.r + 1]) {
      if (r < 0 || r >= BF_ROWS) continue;
      const nk = cellKey(nc, r);
      if (!this.occByKey.has(nk) && this._passableForUnit(ru, nc, r)) return nk;
    }
    return null;
  }

  /** Cel ruchu Szturmu: kazda jednostka osobno, bez offsetu formacji. */
  private _chargeMoveDest(ru: RuntimeBattleUnit): { col: number; row: number } | null {
    const tgt = this._pickTargetByPriority(ru);
    const stepKey = this._bestChargeStepKey(ru, tgt);
    if (stepKey) {
      const comma = stepKey.indexOf(',');
      return {
        col: parseInt(stepKey.slice(0, comma), 10),
        row: parseInt(stepKey.slice(comma + 1), 10),
      };
    }
    if (tgt) return null;
    const nc = this._forwardCol(ru.side, ru.q, 1);
    if (nc >= BF_COLS) return null;
    const tryCell = (c: number, r: number): { col: number; row: number } | null => {
      if (r < 0 || r >= BF_ROWS) return null;
      const nk = cellKey(c, r);
      if (this.occByKey.has(nk) || !this._passableForUnit(ru, c, r)) return null;
      return { col: c, row: r };
    };
    return tryCell(nc, ru.r) ?? tryCell(nc, ru.r - 1) ?? tryCell(nc, ru.r + 1);
  }

  private _groupHasRanged(gid: string): boolean {
    for (const id of this._liveGroupMemberIds(gid)) {
      const u = this._findUnitById(id);
      if (u && !u.dead && (u.primaryRanged || u.rangedBase || u.range > 1)) return true;
    }
    return false;
  }

  /** Czy cel ruchu nie lamie blokady linii. */
  private _destAllowedByBlockade(ru: RuntimeBattleUnit, col: number): boolean {
    if (!this._generalSettings.blockadeActive || this._generalSettings.blockadeCol == null) return true;
    const block = this._generalSettings.blockadeCol;
    if (ru.side === 'atk') return col <= block;
    if (ru.side === 'def') return col >= block;
    return true;
  }

  private _applySkirmishFlags(gid: string): void {
    for (const id of this._liveGroupMemberIds(gid)) {
      const u = this._findUnitById(id);
      if (!u || u.dead) continue;
      if (u.primaryRanged || u.rangedBase || u.range > 1) {
        u.rangedKite = true;
        u.shootingEnabled = true;
      }
    }
  }

  /** Ustaw blokadę linii na kolumnie (front atakującego). */
  private _setLineBlockade(col: number, active = true): void {
    this._generalSettings.blockadeActive = active;
    this._generalSettings.blockadeCol = active ? Math.max(0, Math.min(BF_COLS - 1, col)) : null;
    this._showOrderFeedback(active
      ? 'Blokada linii: kolumna ' + this._generalSettings.blockadeCol
      : 'Blokada wylaczona');
    if (this._generalPanel) this._refreshGeneralPanelBody();
    this._updateSelectedPanel();
  }

  /** Blokada na froncie zaznaczonej grupy / armii. */
  private _setLineBlockadeFromSelection(): void {
    const cols: number[] = [];
    for (const id of this._selectedUnits) {
      const u = this._findUnitById(id);
      if (u && !u.dead) cols.push(u.q);
    }
    if (cols.length === 0) {
      for (const u of this._playerRoster()) {
        if (!u.dead && !u.removed) cols.push(u.q);
      }
    }
    if (cols.length === 0) return;
    const side = this._playerControlSide();
    const front = side === 'atk' ? Math.max(...cols) : Math.min(...cols);
    this._setLineBlockade(front, true);
    for (const gid of this._sortedGroupIds()) {
      const meta = this._ensureGroupMeta(gid);
      if (meta.doctrine === 'manual' || !meta.autoPlay) {
        this._setGroupDoctrine(gid, 'defensive');
      }
    }
  }

  /** Ustaw doktryne grupy + formacja + auto-gra. */
  private _setGroupDoctrine(gid: string, doctrine: GroupDoctrine): void {
    const meta = this._ensureGroupMeta(gid);
    meta.doctrine = doctrine;
    if (doctrine === 'manual') {
      meta.autoPlay = false;
      this._showOrderFeedback('Grupa: recznie');
      this._updateSelectedPanel();
      if (!this.deployPhase) this._updateDeployToolbarStatus();
      return;
    }
    // autoPlay per grupa: po wczesnym return dla manual — tu zawsze auto
    meta.autoPlay = true;
    if (doctrine === 'defensive') meta.formation = 'F2';
    else meta.formation = this._inferDefaultFormationForGroup(gid);
    this._applyGroupFormation(gid, meta.formation);
    if (doctrine === 'skirmish') {
      this._applySkirmishFlags(gid);
      if (!this._groupHasRanged(gid)) {
        this._showOrderFeedback('Ostrzal: brak lucznikow w grupie — dziala jak Atak');
      }
    }
    if (doctrine === 'defensive') {
      delete meta.rallyCol;
      delete meta.rallyRow;
    } else if (doctrine === 'aggressive') {
      delete meta.rallyCol;
      delete meta.rallyRow;
    } else if (doctrine === 'skirmish') {
      const cent = this._groupCentroid(gid);
      const side = this._groupSide(gid);
      meta.rallyCol = this._forwardCol(side, cent.col, 2);
      meta.rallyRow = cent.row;
    } else if (doctrine === 'steady') {
      const cent = this._groupCentroid(gid);
      const side = this._groupSide(gid);
      meta.rallyCol = this._forwardCol(side, cent.col, 2);
      meta.rallyRow = cent.row;
    } else {
      const cent = this._groupCentroid(gid);
      const side = this._groupSide(gid);
      const lead = this._liveGroupMemberIds(gid)
        .map(id => this._findUnitById(id))
        .find(u => u && !u.dead && !u.removed);
      const tgt = lead ? this._pickTargetByPriority(lead) : null;
      if (tgt) {
        meta.rallyCol = tgt.q;
        meta.rallyRow = tgt.r;
      } else {
        meta.rallyCol = this._forwardCol(side, cent.col, 4);
        meta.rallyRow = cent.row;
      }
    }
    for (const id of this._liveGroupMemberIds(gid)) {
      const u = this._findUnitById(id);
      if (u && !u.dead) u.playerOrder = { type: 'none' };
    }
    this._refreshQueuedOrderVisuals();
    this._showOrderFeedback(
      'Doktryna: ' + this._doctrineLabel(doctrine)
      + (this.deployPhase ? ' (auto)' : (meta.autoPlay ? ' · grupa AUTO' : ' · recznie')),
    );
    this._updateSelectedPanel();
    if (this.deployPhase) this._updateDeployStrategyBar();
    if (!this.deployPhase) this._updateDeployToolbarStatus();
    if (this._generalPanel) this._refreshGeneralPanelBody();
  }

  private _doctrineMoveDest(ru: RuntimeBattleUnit, meta: GroupMeta): { col: number; row: number } | null {
    if (meta.doctrine === 'skirmish' && (ru.primaryRanged || ru.rangedBase)) {
      return null;
    }
    if (meta.doctrine === 'defensive') return null;

    // Atak: cala grupa idzie do przodu, zachowujac offset formacji
    if (meta.doctrine === 'steady' && ru.groupId) {
      const rally = this._attackFormationRallyPoint(ru.groupId, meta);
      if (!rally) return null;
      const d = this._moveTargetForUnit(ru, rally.col, rally.row);
      if (!this._destAllowedByBlockade(ru, d.col)) return null;
      return d;
    }

    // Szturm: kazda jednostka osobno, maksymalnie do przodu (bez formacji)
    if (meta.doctrine === 'aggressive') {
      const d = this._chargeMoveDest(ru);
      if (!d || (d.col === ru.q && d.row === ru.r)) return null;
      if (!this._destAllowedByBlockade(ru, d.col)) return null;
      return d;
    }

    if (meta.rallyCol != null && meta.rallyRow != null) {
      const d = this._moveTargetForUnit(ru, meta.rallyCol, meta.rallyRow);
      if (!this._destAllowedByBlockade(ru, d.col)) return null;
      return d;
    }
    const tgt = this._pickTargetByPriority(ru);
    if (!tgt) return null;
    if (!this._destAllowedByBlockade(ru, tgt.q)) return null;
    return { col: tgt.q, row: tgt.r };
  }

  /** Jeden krok auto-gra wg doktryny grupy. */
  private _executeGroupDoctrineStep(ru: RuntimeBattleUnit, meta: GroupMeta, done: () => void): boolean {
    if (meta.doctrine === 'defensive') {
      const adj = this._pickAdjacentTargetByPriority(ru);
      if (adj) {
        this._doAttack(ru, adj, done);
        return true;
      }
      done();
      return true;
    }
    if (meta.doctrine === 'skirmish') {
      return this._executeSkirmishDoctrineStep(ru, meta, done);
    }
    // Szturm: konnica = pelna logika jazdy; reszta = BFS do wroga (omija wlasna linie)
    if (meta.doctrine === 'aggressive') {
      if (ru.mounted) {
        this._cavalryAction(ru, done);
        return true;
      }
      if (canShoot(ru) && ru.shootingEnabled !== false) {
        const rt = this._pickRangedTargetByPriority(ru);
        if (rt) {
          this._doAttack(ru, rt, done);
          return true;
        }
      }
      const adjA = this._pickAdjacentTargetByPriority(ru);
      if (adjA) {
        this._doAttack(ru, adjA, done);
        return true;
      }
      if (ru.moveLeft <= 0) {
        done();
        return true;
      }
      this._advanceStep(ru, done);
      return true;
    }
    if (canShoot(ru) && ru.shootingEnabled !== false) {
      const rt = this._pickRangedTargetByPriority(ru);
      if (rt) {
        this._doAttack(ru, rt, done);
        return true;
      }
    }
    const adj = this._pickAdjacentTargetByPriority(ru);
    if (adj) {
      this._doAttack(ru, adj, done);
      return true;
    }
    const dest = this._doctrineMoveDest(ru, meta);
    if (!dest || (dest.col === ru.q && dest.row === ru.r)) {
      done();
      return true;
    }
    ru.playerOrder = { type: 'move', col: dest.col, row: dest.row };
    const finish = (): void => {
      if (ru.q !== dest.col || ru.r !== dest.row) {
        ru.playerOrder = { type: 'move', col: dest.col, row: dest.row };
      } else {
        ru.playerOrder = { type: 'none' };
      }
      this._refreshQueuedOrderVisuals();
      done();
    };
    this._performPlayerOrder(ru, finish);
    return true;
  }

  /** Ostrzał / kit — lucznicy strzelają i cofają się, piechota osłania linię. */
  private _executeSkirmishDoctrineStep(
    ru: RuntimeBattleUnit, meta: GroupMeta, done: () => void,
  ): boolean {
    const isRanged = ru.primaryRanged || ru.rangedBase || (ru.range > 1 && canShoot(ru));
    if (isRanged && ru.shootingEnabled !== false) {
      ru.rangedKite = true;
      if (canShoot(ru)) {
        this._rangedAction(ru, done);
        return true;
      }
    }
    const adj = this._pickAdjacentTargetByPriority(ru);
    if (adj) {
      this._doAttack(ru, adj, done);
      return true;
    }
    const dest = this._doctrineMoveDest(ru, meta);
    if (!dest || (dest.col === ru.q && dest.row === ru.r)) {
      done();
      return true;
    }
    if (!this._destAllowedByBlockade(ru, dest.col)) {
      done();
      return true;
    }
    ru.playerOrder = { type: 'move', col: dest.col, row: dest.row };
    const finish = (): void => {
      if (ru.q !== dest.col || ru.r !== dest.row) {
        ru.playerOrder = { type: 'move', col: dest.col, row: dest.row };
      } else {
        ru.playerOrder = { type: 'none' };
      }
      this._refreshQueuedOrderVisuals();
      done();
    };
    this._performPlayerOrder(ru, finish);
    return true;
  }

  private _generalPanelSectionTitle(text: string): string {
    return '<div style="font-size:10px;color:#ffd700;letter-spacing:0.08em;margin:12px 0 6px;text-transform:uppercase;border-bottom:1px solid rgba(232,216,138,0.25);padding-bottom:4px;">'
      + text + '</div>';
  }

  private _generalDoctrineBtnHtml(gid: string, d: GroupDoctrine, label: string, active: boolean): string {
    return '<button type="button" data-gen-gid="' + gid + '" data-gen-doc="' + d + '" style="flex:1;min-width:42px;padding:5px 2px;font-size:8px;border-radius:4px;cursor:pointer;'
      + 'background:' + (active ? 'rgba(232,216,138,0.25)' : 'rgba(25,32,44,0.95)') + ';'
      + 'color:' + (active ? '#ffd700' : '#ccc') + ';border:1px solid ' + (active ? BATTLE_GOLD : 'rgba(212,175,55,0.25)') + ';">'
      + label + '</button>';
  }

  private _buildGeneralPanelBodyHtml(): string {
    const gs = this._generalSettings;
    const groups = this._sortedGroupIds();
    let groupsHtml = '';
    if (groups.length === 0) {
      groupsHtml = '<div style="font-size:10px;color:#888;">Brak grup — najpierw grupuj jednostki w deploy.</div>';
    } else {
      for (const gid of groups) {
        const meta = this._ensureGroupMeta(gid);
        const n = this._groupDisplayNum(gid);
        const lbl = this._groupDisplayLabel(gid);
        const cnt = this._liveGroupMemberIds(gid).length;
        const doc = meta.doctrine;
        groupsHtml +=
          '<div style="margin-bottom:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(212,175,55,0.15);">'
          + '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">'
          + '<span style="color:#ffd700;font-size:11px;font-weight:bold;">' + lbl + '</span>'
          + '<span style="font-size:9px;color:#888;">' + cnt + ' · ' + this._doctrineLabel(doc) + '</span>'
          + '</div>'
          + '<div style="display:flex;gap:3px;flex-wrap:wrap;">'
          + this._generalDoctrineBtnHtml(gid, 'defensive', 'Obrona', doc === 'defensive')
          + this._generalDoctrineBtnHtml(gid, 'steady', 'Atak', doc === 'steady')
          + this._generalDoctrineBtnHtml(gid, 'aggressive', 'Szturm', doc === 'aggressive')
          + this._generalDoctrineBtnHtml(gid, 'skirmish', 'Ostrzał', doc === 'skirmish')
          + this._generalDoctrineBtnHtml(gid, 'manual', 'Ręcznie', doc === 'manual')
          + '</div></div>';
      }
    }
    const mkSelect = (cls: BattleUnitClass, slot: number): string => {
      const opts = (['mounted', 'ranged', 'melee'] as BattleUnitClass[]).map(c =>
        '<option value="' + c + '"' + (this._targetPriorities[cls][slot] === c ? ' selected' : '') + '>'
        + this._battleClassLabel(c) + '</option>',
      ).join('');
      return '<select data-tp-class="' + cls + '" data-tp-slot="' + slot + '" style="flex:1;font-size:11px;padding:4px;background:#1a2433;color:#e8e0d0;border:1px solid rgba(212,175,55,0.35);border-radius:4px;">' + opts + '</select>';
    };
    const prioRow = (cls: BattleUnitClass, icon: string): string =>
      '<div style="margin-bottom:8px;">'
      + '<div style="font-size:10px;color:#ccc;margin-bottom:4px;">' + icon + ' ' + this._battleClassLabel(cls) + '</div>'
      + '<div style="display:flex;gap:4px;align-items:center;font-size:9px;color:#888;margin-bottom:3px;"><span style="width:22px;">1.</span>' + mkSelect(cls, 0) + '</div>'
      + '<div style="display:flex;gap:4px;align-items:center;font-size:9px;color:#888;margin-bottom:3px;"><span style="width:22px;">2.</span>' + mkSelect(cls, 1) + '</div>'
      + '<div style="display:flex;gap:4px;align-items:center;font-size:9px;color:#888;"><span style="width:22px;">3.</span>' + mkSelect(cls, 2) + '</div>'
      + '</div>';
    const blockadeInfo = gs.blockadeActive && gs.blockadeCol != null
      ? '<span style="color:#7be08a;">AKTYWNA · kolumna ' + gs.blockadeCol + '</span>'
      : '<span style="color:#888;">wyłączona</span>';
    return ''
      + this._generalPanelSectionTitle('Blokada linii')
      + '<div style="font-size:9px;color:#aaa;margin-bottom:8px;line-height:1.45;">Armia nie przekracza wyznaczonej linii frontu (kolumna mapy). Przydatne do trzymania wąskiego gardła.</div>'
      + '<div style="font-size:10px;margin-bottom:8px;">Status: ' + blockadeInfo + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px;">'
      + '<button id="gen-blockade-set" type="button" style="flex:1;min-width:120px;padding:8px;border-radius:6px;cursor:pointer;font-size:10px;background:rgba(60,80,40,0.5);color:#dfe;border:1px solid rgba(120,180,80,0.45);">Ustaw na froncie zazn.</button>'
      + '<button id="gen-blockade-off" type="button" style="padding:8px 12px;border-radius:6px;cursor:pointer;font-size:10px;background:rgba(40,20,20,0.6);color:#ccc;border:1px solid rgba(180,80,80,0.35);">Wyłącz</button>'
      + '</div>'
      + this._generalPanelSectionTitle('Doktryny grup (auto-gra)')
      + '<div style="font-size:9px;color:#888;margin-bottom:8px;line-height:1.4;">Obrona=F2 stoi · Atak=formacja do przodu · Szturm=bez formacji · Ostrzał=kit+strzał · Ręcznie=klikasz sam</div>'
      + groupsHtml
      + this._generalPanelSectionTitle('Priorytety celów')
      + '<div style="font-size:9px;color:#888;margin-bottom:8px;">Kogo atakować w pierwszej kolejności (1→2→3). Później: modyfikatory generała.</div>'
      + prioRow('mounted', '\u{1F40E}') + prioRow('ranged', '\u{1F3F9}') + prioRow('melee', '\u{1F5E1}')
      + '<button id="gen-prio-reset" type="button" style="width:100%;margin-top:6px;padding:8px;border-radius:6px;cursor:pointer;font-size:10px;background:rgba(255,255,255,0.06);color:#ccc;border:1px solid rgba(255,255,255,0.12);">Przywróć domyślne priorytety</button>';
  }

  private _wireGeneralPanelEvents(panel: HTMLDivElement): void {
    panel.querySelectorAll('[data-gen-gid][data-gen-doc]').forEach(el => {
      el.addEventListener('click', () => {
        const gid = (el as HTMLElement).dataset.genGid!;
        const doc = (el as HTMLElement).dataset.genDoc as GroupDoctrine;
        this._setGroupDoctrine(gid, doc);
      });
    });
    panel.querySelectorAll('select[data-tp-class]').forEach(el => {
      el.addEventListener('change', () => {
        const cls = (el as HTMLSelectElement).dataset.tpClass as BattleUnitClass;
        const slot = parseInt((el as HTMLSelectElement).dataset.tpSlot ?? '0', 10);
        const val = (el as HTMLSelectElement).value as BattleUnitClass;
        const prefs = [...this._targetPriorities[cls]];
        const oldIdx = prefs.indexOf(val);
        if (oldIdx >= 0 && oldIdx !== slot) prefs[oldIdx] = prefs[slot]!;
        prefs[slot] = val;
        this._targetPriorities[cls] = prefs;
      });
    });
    panel.querySelector('#gen-blockade-set')?.addEventListener('click', () => this._setLineBlockadeFromSelection());
    panel.querySelector('#gen-blockade-off')?.addEventListener('click', () => this._setLineBlockade(0, false));
    panel.querySelector('#gen-prio-reset')?.addEventListener('click', () => {
      this._targetPriorities = {
        mounted: [...BattleScene.DEFAULT_TARGET_PRIORITIES.mounted],
        ranged:  [...BattleScene.DEFAULT_TARGET_PRIORITIES.ranged],
        melee:   [...BattleScene.DEFAULT_TARGET_PRIORITIES.melee],
      };
      this._refreshGeneralPanelBody();
    });
  }

  private _refreshGeneralPanelBody(): void {
    if (!this._generalPanel) return;
    const body = this._generalPanel.querySelector('#gen-panel-body') as HTMLDivElement | null;
    if (!body) return;
    body.innerHTML = this._buildGeneralPanelBodyHtml();
    this._wireGeneralPanelEvents(body);
  }

  /** Menu Generała — doktryny, blokada, priorytety celów. */
  private _toggleGeneralPanel(): void {
    if (this._generalPanel) {
      this._generalPanel.remove();
      this._generalPanel = null;
      this._updateBattleQuickSelectBar();
      return;
    }
    const panel = document.createElement('div');
    panel.id = 'battle-general-panel';
    Object.assign(panel.style, {
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      width: 'min(480px,94vw)', maxHeight: '85vh',
      background: 'rgba(10,16,26,0.98)', border: `2px solid ${BATTLE_GOLD}`,
      borderRadius: '12px', zIndex: this.deployPhase ? '100100' : '10020', fontFamily: HUD_FONT,
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
    });
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;border-bottom:1px solid rgba(212,175,55,0.2);">'
      + '<div><div style="color:#ffd700;font-size:15px;font-weight:bold;">\u2694 Generał</div>'
      + '<div style="font-size:9px;color:#888;margin-top:2px;">' + this._generalSettings.commanderName + ' · doktryny · blokada · cele</div></div>'
      + '<button id="gen-close" type="button" style="background:transparent;border:none;color:#aaa;font-size:22px;cursor:pointer;line-height:1;">&times;</button>'
      + '</div>'
      + '<div id="gen-panel-body" style="overflow-y:auto;padding:8px 16px 16px;flex:1;"></div>';
    panel.querySelector('#gen-close')?.addEventListener('click', () => this._toggleGeneralPanel());
    this.overlay.appendChild(panel);
    this._generalPanel = panel;
    this._refreshGeneralPanelBody();
    this._updateBattleQuickSelectBar();
  }

  /** @deprecated użyj _toggleGeneralPanel */
  private _toggleTargetPriorityPanel(): void {
    this._toggleGeneralPanel();
  }

  /**
   * Wykonuje rozkaz gracza (ruch/atak/stoj) — wspolne dla tury i natychmiastowego kliku.
   * @returns true gdy obsluzono (nie przechodz do AI).
   */
  private _performPlayerOrder(ru: RuntimeBattleUnit, done: () => void): boolean {
    const ord = ru.playerOrder;
    if (ord.type === 'hold') {
      done();
      return true;
    }
    if (ord.type === 'none') {
      if (this._isUnitDoctrineAuto(ru)) {
        const meta = this._effectiveMetaForUnit(ru);
        if (meta.doctrine !== 'manual') {
          return this._executeGroupDoctrineStep(ru, meta, done);
        }
      }
      done();
      return true;
    }
    if (ord.type === 'move') {
      const tc = ord.col;
      const tr = ord.row;
      if (tc === ru.q && tr === ru.r) {
        ru.playerOrder = { type: 'none' };
        this._refreshQueuedOrderVisuals();
        done();
        return true;
      }
      const adj = this._adjacentEnemy(ru);
      if (adj) {
        this._doAttack(ru, adj, done);
        return true;
      }
      const dc = Math.sign(tc - ru.q);
      const dr = Math.sign(tr - ru.r);
      let nc = ru.q + dc;
      let nr = ru.r + dr;
      if (!this._passableForUnit(ru, nc, nr) || this.occByKey.has(cellKey(nc, nr))) {
        if (dc !== 0 && this._passableForUnit(ru, ru.q + dc, ru.r) && !this.occByKey.has(cellKey(ru.q + dc, ru.r))) {
          nc = ru.q + dc; nr = ru.r;
        } else if (dr !== 0 && this._passableForUnit(ru, ru.q, ru.r + dr) && !this.occByKey.has(cellKey(ru.q, ru.r + dr))) {
          nc = ru.q; nr = ru.r + dr;
        } else {
          done();
          return true;
        }
      }
      if (nc === tc && nr === tr) ru.playerOrder = { type: 'none' };
      if (!this._destAllowedByBlockade(ru, nc)) {
        done();
        return true;
      }
      this._doMove(ru, nc, nr, () => {
        this._refreshQueuedOrderVisuals();
        done();
      });
      return true;
    }
    if (ord.type === 'attack') {
      const tgt = this._enemiesOf(ru).find(u => u.bu.id === ord.targetId && !u.dead && !u.fadingOut);
      if (!tgt) {
        ru.playerOrder = { type: 'none' };
        this._refreshQueuedOrderVisuals();
        done();
        return true;
      }
      const dist = manhattan(ru.q, ru.r, tgt.q, tgt.r);
      if (dist <= Math.max(1, ru.range)) {
        this._doAttack(ru, tgt, done);
        return true;
      }
      const dc = Math.sign(tgt.q - ru.q);
      const dr = Math.sign(tgt.r - ru.r);
      let nc = ru.q + dc;
      let nr = ru.r + dr;
      if (!this._passableForUnit(ru, nc, nr) || this.occByKey.has(cellKey(nc, nr))) {
        nc = ru.q + dc; nr = ru.r;
        if (!this._passableForUnit(ru, nc, nr) || this.occByKey.has(cellKey(nc, nr))) {
          nc = ru.q; nr = ru.r + dr;
        }
      }
      if (nc !== ru.q || nr !== ru.r) this._doMove(ru, nc, nr, done);
      else done();
      return true;
    }
    done();
    return true;
  }

  /** Natychmiastowe wykonanie rozkazow wybranych jednostek (po kolei). */
  private _executeUnitsImmediate(unitIds: string[]): void {
    this._autoBattleSuspended = false;
    const queue = unitIds.filter(id => {
      const u = this._findPlayerUnit(id);
      return u && !u.dead && !u.removed && !u.routed && !u.acted
        && !this._queuedOrderUnitIds.has(id);
    });
    const runNext = (idx: number): void => {
      if (idx >= queue.length) {
        this._refreshQueuedOrderVisuals();
        return;
      }
      const id = queue[idx];
      if (!id) {
        runNext(idx + 1);
        return;
      }
      const u = this._findPlayerUnit(id);
      if (!u) {
        runNext(idx + 1);
        return;
      }
      if (this.busy) {
        this._schedule(40, () => runNext(idx));
        return;
      }
      if (u.acted || u.dead || u.routed) {
        runNext(idx + 1);
        return;
      }
      this._performPlayerOrder(u, () => {
        u.acted = true;
        runNext(idx + 1);
      });
    };
    runNext(0);
  }

  /** Zbiera id jednostek objetych rozkazem (grupy = calosc formacji). */
  private _collectOrderUnitIds(): string[] {
    const out = new Set<string>();
    const doneGroups = new Set<string>();
    for (const id of this._selectedUnits) {
      const u = this._findPlayerUnit(id);
      if (!u || u.dead || u.removed) continue;
      if (u.groupId) {
        if (doneGroups.has(u.groupId)) continue;
        doneGroups.add(u.groupId);
        for (const mid of this._liveGroupMemberIds(u.groupId)) out.add(mid);
      } else {
        out.add(id);
      }
    }
    return [...out];
  }

  /** Ruch / atak — domyslnie od razu; Ctrl/Shift = dyspozycja na pozniej. */
  private _issueBattleAttack(targetId: string, queueOnly: boolean): void {
    const ids = this._collectOrderUnitIds();
    if (ids.length === 0) return;
    for (const id of ids) {
      const u = this._findPlayerUnit(id);
      if (!u || u.dead) continue;
      u.playerOrder = { type: 'attack', targetId };
      if (queueOnly) this._queuedOrderUnitIds.add(id);
      else this._queuedOrderUnitIds.delete(id);
    }
    this._refreshQueuedOrderVisuals();
    const tgt = this._enemyRoster().find(d => d.bu.id === targetId);
    this._showOrderFeedback(queueOnly ? 'Dyspozycja ATAK' : 'ATAK: ' + (tgt?.bu.nazwa ?? ''));
    if (!queueOnly) {
      this._executeUnitsImmediate(ids);
      this._advanceToNextBattleUnit(new Set(ids));
    }
  }

  private _issueBattleMove(col: number, row: number, queueOnly: boolean): void {
    const ids = this._collectOrderUnitIds();
    if (ids.length === 0) return;
    this._orderMoveForUnits(col, row, ids);
    for (const id of ids) {
      if (queueOnly) this._queuedOrderUnitIds.add(id);
      else this._queuedOrderUnitIds.delete(id);
    }
    this._refreshQueuedOrderVisuals();
    this._showOrderFeedback(queueOnly ? 'Dyspozycja RUCH' : 'RUCH');
    if (!queueOnly) {
      const gids = new Set<string>();
      for (const id of ids) {
        const u = this._findPlayerUnit(id);
        if (u?.groupId) gids.add(u.groupId);
      }
      if (gids.size === 1) {
        const meta = this._ensureGroupMeta([...gids][0]!);
        if (meta.autoPlay) {
          meta.rallyCol = col;
          meta.rallyRow = row;
        }
      }
      this._executeUnitsImmediate(ids);
      this._advanceToNextBattleUnit(new Set(ids));
    }
  }

  /** Duchy docelowej formacji grupy (podglad w walce). */
  private _refreshBattleMoveGhosts(col: number, row: number): void {
    if (!this._deployGhostGroup || this._selectedUnits.size === 0) return;
    this._clearDeployGhosts();
    const skipIds = new Set<string>();
    for (const id of this._selectedUnits) skipIds.add(id);
    const discGeo = new THREE.CircleGeometry(0.38, 20);
    discGeo.rotateX(-Math.PI / 2);
    this._deployGhostOwnedGeos.push(discGeo);
    const destMap = this._moveDestinationsForSelection(col, row);
    for (const [id, dest] of destMap) {
      // C-TEREN-Q1 ETAP 3: look up the actual unit so the ghost reflects the
      // SAME per-unit terrain rule (Gory blocks cavalry/chariot, etc.) that
      // _performPlayerOrder will enforce when the move is actually issued --
      // otherwise a mounted unit's move preview could show a tile as
      // reachable (blue) that its real move then refuses to enter.
      const u = this._findPlayerUnit(id);
      this._addBattleGhostDisc(discGeo, dest.col, dest.row, skipIds, u ?? null);
    }
  }

  private _addBattleGhostDisc(
    geo: THREE.BufferGeometry, col: number, row: number, skipIds: Set<string>,
    ru: RuntimeBattleUnit | null,
  ): void {
    if (!this._deployGhostGroup) return;
    const passable = ru ? this._passableForUnit(ru, col, row) : this.terrainMap.passable(col, row);
    const ok = passable
      && (!this.occByKey.has(cellKey(col, row)) || skipIds.has(this.occByKey.get(cellKey(col, row))!.bu.id));
    const mat = new THREE.MeshBasicMaterial({
      color: ok ? 0x44aaff : 0xff5555,
      transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide,
    });
    this._deployGhostOwnedMats.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    const { x, z } = cellToWorld(col, row);
    mesh.position.set(x, tileTopY(this.terrainMap, col, row) + 0.06, z);
    this._deployGhostGroup.add(mesh);
  }

  private _onBattleClick(cx: number, cy: number): void {
    const queueOnly = this._lastClickModifiers.ctrl || this._lastClickModifiers.shift
      || (this._battleAwaitingOrders && this.roundNo < 1);

    // Kafel pod kursorem liczony wczesniej niz dawniej — patrz BLAD K2 nizej
    // (ten sam mechanizm co w _onDeployClick).
    const tile = this._pickGroundTile(cx, cy);

    const raycaster = this._raycastFromCanvas(cx, cy);
    if (!raycaster) return;

    const allGroups = [...this.atk, ...this.def]
      .filter(u => !u.dead && !u.fadingOut)
      .map(u => u.group);
    const hits = raycaster.intersectObjects(allGroups, true);

    let hitUnit: RuntimeBattleUnit | null = null;
    for (const h of hits) {
      let obj: THREE.Object3D | null = h.object;
      while (obj) {
        const found = [...this.atk, ...this.def].find(u => u.group === obj);
        if (found && !found.dead && !found.fadingOut) { hitUnit = found; break; }
        obj = obj.parent;
      }
      if (hitUnit) break;
    }

    // BŁĄD K2 (parytet z _onDeployClick): model 3D moze wystawac na sasiedni
    // kafel (grupa stojaca ciasno) — honoruj trafienie mesha TYLKO gdy
    // zgadza sie z kaflem geometrycznie wskazywanym przez kursor, inaczej
    // klik "obok" (np. rozkaz ruchu dla zaznaczonej jednostki) chwytal
    // sasiada zamiast wykonac zamierzona akcje na kaflu.
    if (hitUnit && (!tile || hitUnit.q !== tile.col || hitUnit.r !== tile.row)) {
      hitUnit = null;
    }

    if (hitUnit) {
      if (this._isPlayerSide(hitUnit.side)) {
        this._handleBattleUnitPick(hitUnit, this._lastClickModifiers.ctrl, this._lastClickModifiers.shift);
        return;
      }
      if (!this._isPlayerSide(hitUnit.side) && this._selectedUnits.size > 0) {
        this._issueBattleAttack(hitUnit.bu.id, queueOnly);
        return;
      }
    }

    if (!tile) return;

    if (!hitUnit) {
      const cellUnit = this.occByKey.get(cellKey(tile.col, tile.row));
      if (cellUnit && !cellUnit.dead && !cellUnit.fadingOut) {
        if (this._isPlayerSide(cellUnit.side)) {
          this._handleBattleUnitPick(cellUnit, this._lastClickModifiers.ctrl, this._lastClickModifiers.shift);
          return;
        }
        if (!this._isPlayerSide(cellUnit.side) && this._selectedUnits.size > 0) {
          this._issueBattleAttack(cellUnit.bu.id, queueOnly);
          return;
        }
      }
    }

    if (this._selectedUnits.size > 0) {
      this._issueBattleMove(tile.col, tile.row, queueOnly);
    }
  }

  /** Zaznacza / odznacza pojedyncza jednostke. */
  private _toggleSelectUnit(ru: RuntimeBattleUnit): void {
    if (this._selectedUnits.has(ru.bu.id)) {
      this._selectedUnits.delete(ru.bu.id);
      this._removeSelectionRing(ru);
    } else {
      this._selectedUnits.add(ru.bu.id);
      this._addSelectionRing(ru);
    }
    if (this.deployPhase) {
      this._refreshDeploySelectionVisuals();
    } else {
      this._updateRosterBar();
      this._updateSelectedPanel();
    }
  }

  /** Zaznacza cala grupe jednostek (np. z rostera). */
  private _selectGroup(units: RuntimeBattleUnit[]): void {
    this._clearAllSelection();
    for (const u of units) {
      if (!u.dead && !u.fadingOut) {
        this._selectedUnits.add(u.bu.id);
        this._addSelectionRing(u);
      }
    }
    if (this.deployPhase) {
      this._refreshDeploySelectionVisuals();
    } else {
      this._updateRosterBar();
      this._updateSelectedPanel();
    }
  }

  /** Wyczysc calkowite zaznaczenie. */
  private _clearAllSelection(): void {
    for (const id of this._selectedUnits) {
      const u = this._findUnitById(id);
      if (u) this._removeSelectionRing(u);
    }
    this._selectedUnits.clear();
    if (this.deployPhase) {
      this._refreshDeploySelectionVisuals();
    } else {
      this._updateRosterBar();
      this._updateSelectedPanel();
      this._updateBattleQuickSelectBar();
      this._updateBattleSelectionBar();
      if (this.started) this._updateDeployToolbarStatus();
    }
  }

  /** Dodaj swiecacy ring pod jednostka (PlaneGeometry, emissive). */
  private _addSelectionRing(ru: RuntimeBattleUnit): void {
    if (this._selectionRings.has(ru.bu.id)) return;
    const geo = new THREE.RingGeometry(0.45, 0.58, 24);
    geo.rotateX(-Math.PI / 2);
    this.ownedGeos.push(geo);
    // Kolor obwodki: zloty dla jednostek w grupie, cyjan dla zwyklych
    const ringColor = ru.groupId ? 0xffd700 : 0x00ffcc;
    const mat = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.85, depthWrite: false });
    this.ownedMats.push(mat);
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(0, 0.03, 0);
    ru.group.add(ring);
    this._selectionRings.set(ru.bu.id, ring);
  }

  /** Usun ring spod jednostki. */
  private _removeSelectionRing(ru: RuntimeBattleUnit): void {
    const ring = this._selectionRings.get(ru.bu.id);
    if (!ring) return;
    ru.group.remove(ring);
    this._selectionRings.delete(ru.bu.id);
  }

  /** Rozkaz STOJ dla zaznaczonych. */
  private _orderHoldSelected(): void {
    if (this._selectedUnits.size === 0) return;
    for (const id of this._selectedUnits) {
      const u = this._findUnitById(id);
      if (u && !u.dead) u.playerOrder = { type: 'hold' };
    }
    this._refreshQueuedOrderVisuals();
    this._showOrderFeedback('STOJ');
  }

  /** Krotki feedback tekstowy w hint. */
  private _showOrderFeedback(msg: string): void {
    const full = '[RECZNE] ' + msg;
    const prev = this.hint.textContent;
    this.hint.textContent = full;
    setTimeout(() => { if (this.hint.textContent === full) this.hint.textContent = prev ?? ''; }, 1800);
  }

  /** Feedback w fazie deploy (ten sam element co walka). */
  private _showDeployFeedback(msg: string): void {
    if (this.deployPhase && this._battleRosterFeedback) {
      const el = this._battleRosterFeedback;
      el.style.display = 'block';
      const prev = el.textContent;
      el.textContent = msg;
      el.style.color = '#7be08a';
      setTimeout(() => {
        if (el.textContent === msg) {
          el.style.color = BATTLE_TEXT_DIM;
          el.textContent = prev ?? 'LPM: zaznacz \u00B7 Ctrl+LPM: wiele \u00B7 PPM: odznacz';
        }
      }, 2800);
      return;
    }
    if (this.deployPhase && this._deployRosterFeedback) {
      const el = this._deployRosterFeedback;
      const prev = el.textContent;
      el.textContent = msg;
      el.style.color = '#7be08a';
      setTimeout(() => {
        if (el.textContent === msg) {
          el.style.color = BATTLE_PLAYER_TEXT;
          el.textContent = prev ?? 'Ctrl+LPM = wielokrotne';
        }
      }, 2800);
      return;
    }
    this._showOrderFeedback(msg);
  }

  /** Rozkaz WYCOFAJ. */
  private _orderRetreatSelected(): void {
    if (this._selectedUnits.size === 0) return;
    for (const id of this._selectedUnits) {
      const u = this._findUnitById(id);
      if (!u || u.dead) continue;
      const retreatCol = u.side === 'def'
        ? Math.min(BF_COLS - 1, u.q + 6)
        : Math.max(0, u.q - 6);
      u.playerOrder = { type: 'move', col: retreatCol, row: u.r };
    }
    this._showOrderFeedback('WYCOFAJ');
  }

  /** @deprecated Legacy Q3 — ukryty; sterowanie przez roster C09 + dolny toolbar. */
  private _updateSelectedPanel(): void {
    if (!this._selPanel) return;
    this._selPanel.style.display = 'none';
    if (!this.deployPhase && this.started && this._manualMode && this._selectedUnits.size > 0) {
      this._updateBattleSelectionBar();
    }
    if (!this.deployPhase && this.started) this._updateDeployToolbarStatus();
  }

  /** Opis rozkazu. */
  private _orderLabel(ru: RuntimeBattleUnit): string {
    const o = ru.playerOrder;
    if (!o || o.type === 'none') return this._manualMode ? 'Brak rozkazu' : 'Brak rozkazu (AI)';
    if (o.type === 'hold') return 'Stoj';
    if (o.type === 'move') return 'Ruch -> (' + o.col + ',' + o.row + ')';
    if (o.type === 'attack') return 'Atak -> ' + o.targetId;
    return '';
  }


  // -------------------------------------------------------------------------
  // DOLNY ROSTER — karty PER JEDNOSTKA (Total War style)
  // -------------------------------------------------------------------------

  /** Typ jednostki -> ikona unicode */
  private _unitTypeIcon(bu: BattleUnit | { kategoria: string; stats?: any }): string {
    const cat = String((bu as any).kategoria ?? '').toLowerCase().trim();
    if (cat === 'lucznik' || cat === 'kusznik') return '\u{1F3F9}';
    if (cat === 'procarz') return '\u{27BF}';
    if (cat === 'oszczepnik') return '\u{27B6}';
    if (cat === 'konnica') return '\u{1F40E}';
    if (cat === 'rydwan') return '\u{1F6F5}';
    if (cat === 'falanga' || cat === 'wlocznik') return '\u{1F531}';
    if (cat === 'taran' || cat === 'katapulta' || cat === 'wieza') return '\u{1F3F0}';
    const n = String((bu as any).nazwa ?? '').toLowerCase();
    if (n.includes('luczn') || n.includes('archer') || n.includes('kusznik')) return '\u{1F3F9}';
    if (n.includes('procarz') || n.includes('sling')) return '\u{27BF}';
    if (n.includes('oszczep') || n.includes('javelin') || n.includes('atlatl')) return '\u{27B6}';
    if (n.includes('konn') || n.includes('jezdz')) return '\u{1F40E}';
    return '\u{1F5E1}';
  }

  /** Lewy panel walki: licznik rozstawionych jednostek. */
  private _updateBattleRosterCountLine(): void {
    if (!this._battleRosterCount || this.deployPhase || !this.started) return;
    const live = this._playerRoster().filter(u => !u.dead && !u.removed && !u.routed).length;
    this._battleRosterCount.textContent = 'Na polu: ' + live + ' jednostek';
  }

  /** Lewy panel: zaznaczenie + Odznacz / Grupuj / Rozgrupuj (deploy i walka). */
  private _updateBattleSelectionBar(): void {
    this._updateBattleRosterCountLine();
    const bar = this._battleSelBar;
    const active = this.deployPhase || (this.started && this._manualMode);
    if (!bar || !active) return;
    bar.innerHTML = '';
    const n = this._selectedUnits.size;
    const unitBar = this._rosterBar?.querySelector('#battle-roster-unit-bar') as HTMLDivElement | null;
    if (unitBar) {
      unitBar.style.display = 'flex';
      unitBar.style.flexDirection = 'column';
      unitBar.style.gap = '2px';
    }
    const feedback = this._battleRosterFeedback;
    if (feedback) {
      feedback.style.display = 'block';
      if (this.deployPhase && !feedback.textContent) {
        feedback.textContent = 'LPM: zaznacz \u00B7 Ctrl+LPM: wiele \u00B7 PPM: odznacz';
      }
    }
    if (n === 0) {
      if (unitBar) unitBar.style.display = this.deployPhase ? 'none' : 'none';
      return;
    }
    if (unitBar) unitBar.style.display = 'flex';

    const selUnits = [...this._selectedUnits]
      .map(id => this._findUnitById(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed
        && (this.deployPhase || !u.routed));
    if (selUnits.length === 0) return;

    const groupIds = [...new Set(selUnits.map(u => u.groupId).filter(Boolean))];
    const singleGid = groupIds.length === 1 && selUnits.every(u => u.groupId === groupIds[0])
      ? groupIds[0]! : null;
    const canGroup = selUnits.length >= 2 && !(
      singleGid && selUnits.length === this._liveGroupMemberIds(singleGid).length
    );
    const lbl = document.createElement('span');
    lbl.textContent = singleGid
      ? this._groupDisplayLabel(singleGid) + ' \u00B7 ' + selUnits.length
      : selUnits.length + ' zazn.';
    Object.assign(lbl.style, {
      fontSize: '11px', color: BATTLE_GOLD, letterSpacing: '0.06em', whiteSpace: 'nowrap',
    });
    bar.appendChild(lbl);

    const types = document.createElement('span');
    types.innerHTML = this._selectionTypeCountsHtml(selUnits);
    types.style.flexShrink = '0';
    bar.appendChild(types);

    const mkBtn = (text: string, onClick: () => void, gold = false, group = false): HTMLButtonElement => {
      const b = document.createElement('button');
      b.type = 'button';
      if (group) {
        b.innerHTML = groupBtnLabelHtml('Grupuj');
        applySelectionActionBtn1E(b, true);
      } else {
        b.textContent = text;
        applySelectionActionBtn1E(b, gold);
      }
      b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
      return b;
    };

    const clearFn = () => this.deployPhase
      ? this._clearDeploySelectionState()
      : this._clearAllSelection();
    bar.appendChild(mkBtn('Odznacz', clearFn, true));
    if (canGroup) {
      bar.appendChild(mkBtn('', () => this._groupSelected(), true, true));
    }
    if (groupIds.length > 0) {
      bar.appendChild(mkBtn('Rozgrupuj', () => this._ungroupSelected()));
    }
  }

  /** Nagłówek lewego panelu rosteru walki. */
  private _updateBattleRosterHeader(): void {
    if (!this._battleRosterHeader) return;
    if (!this.deployPhase && (!this.started || !this._manualMode)) return;
    const counts = { mounted: 0, melee: 0, ranged: 0 };
    for (const ru of this._playerRoster()) {
      if (ru.dead || ru.removed) continue;
      if (!this.deployPhase && ru.routed) continue;
      counts[this._deployRowKind(ru)]++;
    }
    const total = counts.mounted + counts.melee + counts.ranged;
    this._battleRosterHeader.innerHTML =
      'Roster \u00B7 ' + total + (total === 1 ? ' jednostka' : ' jednostek');
    this._battleRosterHeader.title = BATTLE_UI_BUILD;
    this._updateBattleRosterCountLine();
  }

  /** Lewy panel pionowy — karty jednostek (walka ręczna). */
  private _ensureBattleRosterChrome(): void {
    const bar = this._rosterBar ?? document.getElementById('player-roster-bar') as HTMLDivElement | null;
    if (!bar) return;
    this._rosterBar = bar;
    bar.style.top = BATTLE_TOP_BAR_H + 'px';
    bar.style.padding = '2px 3px 4px 4px';

    if (!bar.querySelector('#battle-roster-header')) {
      const hdr = document.createElement('div');
      hdr.id = 'battle-roster-header';
      Object.assign(hdr.style, {
        display: 'flex', flexDirection: 'column', gap: '1px',
        marginBottom: '2px', fontSize: '10px', letterSpacing: '0.08em',
        textTransform: 'uppercase', color: BATTLE_GOLD, flexShrink: '0',
        lineHeight: '1.15',
      });
      bar.insertBefore(hdr, bar.firstChild);
      this._battleRosterHeader = hdr;
    } else {
      this._battleRosterHeader = bar.querySelector('#battle-roster-header') as HTMLDivElement;
    }

    if (!bar.querySelector('#battle-roster-unit-bar')) {
      const unitBar = document.createElement('div');
      unitBar.id = 'battle-roster-unit-bar';
      Object.assign(unitBar.style, {
        display: 'none', flexDirection: 'column', gap: '2px',
        marginBottom: '2px', flexShrink: '0', padding: '2px 4px', borderRadius: '4px',
        background: 'rgba(40,32,12,0.35)', border: `1px solid ${BATTLE_GOLD_DIM}`,
      });
      const countEl = document.createElement('div');
      countEl.id = 'battle-roster-count';
      Object.assign(countEl.style, { fontSize: '9px', color: BATTLE_TEXT_DIM, letterSpacing: '0.04em', display: 'none' });
      unitBar.appendChild(countEl);
      const selBar = document.createElement('div');
      selBar.id = 'battle-roster-sel-bar';
      Object.assign(selBar.style, {
        display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
      });
      unitBar.appendChild(selBar);
      const feedback = document.createElement('div');
      feedback.id = 'battle-roster-feedback';
      Object.assign(feedback.style, {
        fontSize: '9px', color: BATTLE_TEXT_DIM, lineHeight: '1.35', minHeight: '12px',
      });
      feedback.textContent = 'LPM: zaznacz \u00B7 PPM: odznacz \u00B7 R = AUTO/RECZNY';
      unitBar.appendChild(feedback);
      const insertAfter = this._battleRosterHeader ?? bar.firstChild;
      if (insertAfter?.nextSibling) bar.insertBefore(unitBar, insertAfter.nextSibling);
      else bar.appendChild(unitBar);
      this._battleRosterCount = countEl;
      this._battleSelBar = selBar;
      this._battleRosterFeedback = feedback;
    } else {
      this._battleRosterCount = bar.querySelector('#battle-roster-count') as HTMLDivElement;
      this._battleSelBar = bar.querySelector('#battle-roster-sel-bar') as HTMLDivElement;
      this._battleRosterFeedback = bar.querySelector('#battle-roster-feedback') as HTMLDivElement;
    }

    let quickBar = bar.querySelector('#battle-quick-select') as HTMLDivElement | null;
    if (!quickBar) {
      quickBar = document.createElement('div');
      quickBar.id = 'battle-quick-select';
      Object.assign(quickBar.style, {
        display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '5px',
        marginBottom: '0', flexShrink: '0',
      });
      applyRosterFilterBar1E(quickBar);
      const scroll = bar.querySelector('#battle-roster-scroll')
        ?? bar.querySelector('[data-roster-scroll]')
        ?? bar.querySelector('#battle-roster-cards')?.parentElement;
      if (scroll) bar.insertBefore(quickBar, scroll);
      else bar.appendChild(quickBar);
    }
    this._battleQuickSelectBar = quickBar;

    const orphanQuick = document.querySelector('#battle-quick-select');
    if (orphanQuick && orphanQuick !== quickBar && orphanQuick.parentElement === this.overlay) {
      orphanQuick.remove();
    }
    const orphanGroups = document.getElementById('group-selector-bar');
    if (orphanGroups) orphanGroups.style.display = 'none';

    let scrollEl = bar.querySelector('#battle-roster-scroll') as HTMLDivElement | null;
    if (!scrollEl) {
      scrollEl = document.createElement('div');
      scrollEl.id = 'battle-roster-scroll';
      Object.assign(scrollEl.style, {
        flex: '1', minHeight: '0', overflowY: 'auto', overflowX: 'hidden',
        background: 'rgba(8,10,16,1)', scrollbarGutter: 'stable', paddingRight: '2px',
      });
      bar.appendChild(scrollEl);
    }
    applyBattleRosterScrollbar(scrollEl);

    let cardsRow = bar.querySelector('#battle-roster-cards') as HTMLDivElement | null;
    if (!cardsRow) {
      cardsRow = document.createElement('div');
      cardsRow.id = 'battle-roster-cards';
      Object.assign(cardsRow.style, {
        display: 'flex', flexDirection: 'column', gap: '2px',
        width: '100%', maxWidth: '100%', boxSizing: 'border-box',
      });
      scrollEl.appendChild(cardsRow);
    }
    this._battleRosterCards = cardsRow;
    if (this.deployPhase) {
      this._deployUnitsRow = cardsRow;
      this._deployRosterScroll = scrollEl;
      this._deployRosterGridEl = cardsRow;
    }

    this._updateBattleRosterHeader();
    this._updateBattleSelectionBar();
    this._updateBattleQuickSelectBar();
    // Zadanie #17: rzadek ikon Formacja..Strategia musi byc PIERWSZYM dzieckiem
    // panelu (nad naglowkiem) — wymuszamy to na koniec, niezaleznie od tego w
    // jakiej kolejnosci powstaly reszta elementow chrome powyzej.
    this._mountDeployIconRow();
  }

  /** Lewy panel pionowy — karty jednostek (walka ręczna). */
  private _buildRosterBar(): void {
    if (this._rosterBar) {
      this._ensureBattleRosterChrome();
      return;
    }
    const bar = document.createElement('div');
    bar.id = 'player-roster-bar';
    Object.assign(bar.style, {
      position:       'fixed',
      left:           '16px',
      top:            (BATTLE_TOP_BAR_H + 8) + 'px',
      bottom:         '16px',
      width:          ROSTER_PANEL_FIXED_W + 'px',
      minWidth:       ROSTER_PANEL_FIXED_W + 'px',
      maxWidth:       ROSTER_PANEL_FIXED_W + 'px',
      display:        'flex',
      flexDirection:  'column',
      padding:        '0',
      zIndex:         '100050',
      overflow:       'hidden',
      fontFamily:     HUD_FONT,
      boxSizing:      'border-box',
      pointerEvents:  'auto',
    });
    applyRosterPanel1E(bar);
    this.overlay.appendChild(bar);
    this._rosterBar = bar;
    // Zadanie #17: rzadek ikon Formacja..Strategia — jesli juz zbudowany
    // (_buildDeployToolbar dziala PRZED _buildRosterBar w fazie deploy), wpinamy
    // go jako pierwsze dziecko, PRZED naglowkiem "Roster".
    this._mountDeployIconRow();

    const hdr = document.createElement('div');
    hdr.id = 'battle-roster-header';
    Object.assign(hdr.style, {
      display: 'flex', flexDirection: 'column', gap: '1px',
      marginBottom: '0', fontSize: '12px', letterSpacing: '0.12em',
      textTransform: 'uppercase', color: BATTLE_GOLD, flexShrink: '0',
      lineHeight: '1.15',
      padding: '12px 14px',
      borderBottom: '1px solid rgba(232,216,138,0.2)',
      background: 'linear-gradient(90deg,rgba(232,216,138,0.08),transparent)',
      fontWeight: '700',
    });
    bar.appendChild(hdr);
    this._battleRosterHeader = hdr;

    const unitBar = document.createElement('div');
    unitBar.id = 'battle-roster-unit-bar';
    Object.assign(unitBar.style, {
      display: 'none', flexDirection: 'column', gap: '2px',
      marginBottom: '2px', flexShrink: '0', padding: '2px 4px', borderRadius: '4px',
      background: 'rgba(40,32,12,0.35)', border: `1px solid ${BATTLE_GOLD_DIM}`,
    });
    const countEl = document.createElement('div');
    countEl.id = 'battle-roster-count';
    Object.assign(countEl.style, { fontSize: '9px', color: BATTLE_TEXT_DIM, letterSpacing: '0.04em', display: 'none' });
    countEl.textContent = 'Na polu: 0 jednostek';
    unitBar.appendChild(countEl);
    this._battleRosterCount = countEl;

    const selBar = document.createElement('div');
    selBar.id = 'battle-roster-sel-bar';
    Object.assign(selBar.style, {
      display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minHeight: '0',
    });
    unitBar.appendChild(selBar);
    this._battleSelBar = selBar;

    const feedback = document.createElement('div');
    feedback.id = 'battle-roster-feedback';
    Object.assign(feedback.style, {
      fontSize: '9px', color: BATTLE_TEXT_DIM, lineHeight: '1.25', minHeight: '0', display: 'none',
    });
    feedback.textContent = 'LPM: zaznacz \u00B7 PPM: odznacz \u00B7 R = AUTO/RECZNY';
    unitBar.appendChild(feedback);
    this._battleRosterFeedback = feedback;
    bar.appendChild(unitBar);

    const quickBar = document.createElement('div');
    quickBar.id = 'battle-quick-select';
      Object.assign(quickBar.style, {
        display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '5px',
        marginBottom: '0', flexShrink: '0',
      });
    applyRosterFilterBar1E(quickBar);
    bar.appendChild(quickBar);
    this._battleQuickSelectBar = quickBar;

    const scroll = document.createElement('div');
    scroll.id = 'battle-roster-scroll';
    Object.assign(scroll.style, {
      flex: '1', minHeight: '0', overflowY: 'auto', overflowX: 'hidden',
      background: 'rgba(8,10,16,1)', scrollbarGutter: 'stable', paddingRight: '2px',
    });
    bar.appendChild(scroll);
    applyBattleRosterScrollbar(scroll);

    const cardsRow = document.createElement('div');
    cardsRow.id = 'battle-roster-cards';
    Object.assign(cardsRow.style, {
      display: 'flex', flexDirection: 'column', gap: '2px',
      width: '100%', maxWidth: '100%', boxSizing: 'border-box',
    });
    scroll.appendChild(cardsRow);
    this._battleRosterCards = cardsRow;

    this._unitCards.clear();
    if (this.deployPhase) {
      this._rebuildDeployRosterGrid();
    } else {
      this._rebuildBattleRosterGrid();
    }
    this._ensureGroupSelectorBar();
    if (!this._deployLayoutListener) {
      this._deployLayoutListener = () => {
        if (this.deployPhase) this._syncDeployPanelLayout();
        else if (this._rosterBar) this._syncBattleRosterPanelLayout();
      };
      window.addEventListener('resize', this._deployLayoutListener);
    }
    requestAnimationFrame(() => {
      if (this.deployPhase) {
        this._syncDeployPanelLayout();
        this._syncRosterBottomInset();
      } else {
        this._syncBattleRosterPanelLayout();
      }
    });
  }

  /** Calkowicie odtwarza karty rostera (np. po resecie deploy). */
  private _rebuildRosterBar(): void {
    if (!this._rosterBar) return;
    if (this.deployPhase) {
      this._rebuildDeployRosterGrid();
      return;
    }
    this._rebuildBattleRosterGrid();
  }

  /** Tworzy karte jednostki dla rostera — C09 v4. */
  private _createUnitCard(ru: RuntimeBattleUnit): HTMLDivElement {
    const isDead = ru.dead || ru.fadingOut || ru.removed;
    const isRouted = ru.routed;
    const isSel = this._selectedUnits.has(ru.bu.id);
    const hpPct = ru.bu.maxHp > 0 ? Math.max(0, ru.bu.hp / ru.bu.maxHp) : 0;
    const morPct = ru.moraleMax > 0 ? Math.max(0, ru.morale / ru.moraleMax) : hpPct;
    const row = this._armyCompositionKind(ru);

    const card = document.createElement('div');
    card.dataset.unitId = ru.bu.id;
    // C-09 v5 klatka 6: karta MARTWA = obw\u00f3dka przerywana + wy\u015brodkowany X (bez pask\u00f3w);
    // karta ROZBITA/rout = cie\u0144sza pe\u0142na obw\u00f3dka + ikona ucieczki + zaczerwieniony HP.
    const stateStyle = isDead
      ? { border: '1px dashed rgba(232,216,138,0.22)', background: 'rgba(255,255,255,0.02)', boxShadow: 'none' }
      : isRouted
        ? { border: '1px solid rgba(232,216,138,0.18)', background: 'linear-gradient(180deg,rgba(24,30,40,.96),rgba(10,13,20,.96))', boxShadow: 'none' }
        : rosterCardBaseStyle(row, isSel);
    Object.assign(card.style, {
      minWidth:       ROSTER_CARD_W + 'px',
      width:          ROSTER_CARD_W + 'px',
      height:         BATTLE_ROSTER_CARD_H + 'px',
      borderRadius:   '7px',
      cursor:         (isDead || isRouted) ? 'default' : 'pointer',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: isDead ? 'center' : 'flex-start',
      padding:        isDead ? '4px' : '5px 4px 4px',
      gap:            isDead ? '4px' : '3px',
      userSelect:     'none',
      flexShrink:     '0',
      opacity:        isDead ? '0.4' : isRouted ? '0.5' : '1',
      transition:     'border-color 0.15s, box-shadow 0.15s, opacity 0.3s',
      position:       'relative',
      overflow:       'visible',
      ...stateStyle,
    });

    if (ru.groupId && !isDead) {
      const gBadge = document.createElement('div');
      const gNum = this._groupDisplayNum(ru.groupId);
      Object.assign(gBadge.style, {
        position: 'absolute', top: '-5px', right: '-5px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: BATTLE_GOLD, color: '#2e2708',
        fontSize: '9px', fontWeight: 'bold', lineHeight: '16px',
        textAlign: 'center', zIndex: '2',
      });
      gBadge.textContent = gNum != null ? String(gNum) : '';
      card.appendChild(gBadge);
      (card as any)._gBadge = gBadge;
    }

    const iconEl = document.createElement('div');
    // BŁĄD H: flexShrink:'0' na ikonie/nazwie/paskach — bez tego flexbox w
    // kolumnie (patrz DEPLOY_ROSTER_CARD_H/BATTLE_ROSTER_CARD_H wyżej) potrafił
    // nierówno ścisnąć te elementy, a jednoliniowa nazwa nachodziła na pasek.
    iconEl.style.flexShrink = '0';
    if (isDead) {
      Object.assign(iconEl.style, {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: ROSTER_DEAD_COLOR, lineHeight: '0',
      });
      iconEl.innerHTML = ROSTER_STATE_SVG.dead;
    } else {
      applyUnitCardIconCircle(iconEl, row);
      iconEl.innerHTML = isRouted
        ? ROSTER_STATE_SVG.routed
        : row === 'mounted' ? ROSTER_TYPE_SVG.mounted
          : row === 'ranged' ? ROSTER_TYPE_SVG.ranged
            : ROSTER_TYPE_SVG.melee;
      if (isRouted) iconEl.style.color = BATTLE_ENEMY_TEXT;
      const iconSvg = iconEl.querySelector('svg');
      if (iconSvg) {
        iconSvg.setAttribute('width', '15');
        iconSvg.setAttribute('height', '15');
      }
    }
    card.appendChild(iconEl);
    (card as any)._iconEl = iconEl;

    // C-06/09 v5 (makieta): pod ikon\u0105 nazwa jednostki (7px, elipsa) \u2014 NIE liczba
    // HP (ta \u017cyje w bogatym tooltipie). Stany dead/rout (F2) zachowane bez zmian.
    const hpLbl = document.createElement('div');
    Object.assign(hpLbl.style, {
      fontSize: (isDead || isRouted) ? '7px' : '7px',
      // B\u0141\u0104D H: lineHeight jawny (zamiast domy\u015blnego 'normal') + flexShrink:'0'
      // \u2014 nazwa jednostki dostaje sta\u0142\u0105, przewidywaln\u0105 wysoko\u015b\u0107 linii i nigdy
      // nie jest \u015bciskana przez flexbox, wi\u0119c pasek HP pod ni\u0105 jej nie zas\u0142ania.
      lineHeight: '1.3',
      flexShrink: '0',
      fontWeight: (isDead || isRouted) ? '700' : '600',
      letterSpacing: isDead ? '0.06em' : isRouted ? '0.08em' : '0',
      textTransform: (isDead || isRouted) ? 'uppercase' : 'none',
      color: isDead ? ROSTER_DEAD_COLOR : isRouted ? BATTLE_ENEMY_TEXT : '#c8b898',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
    hpLbl.textContent = isDead ? 'Pad\u0142a' : isRouted ? 'Rout' : this._unitDisplayLabel(ru);
    card.appendChild(hpLbl);
    (card as any)._hpLbl = hpLbl;
    (card as any)._grpLbl = null;
    (card as any)._selBadge = null;

    const hpTrack = document.createElement('div');
    Object.assign(hpTrack.style, {
      width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px',
      overflow: 'hidden', display: isDead ? 'none' : '', flexShrink: '0',
    });
    const hpFill = document.createElement('div');
    Object.assign(hpFill.style, {
      width: (hpPct * 100).toFixed(1) + '%', height: '100%',
      background: (isRouted || hpPct <= 0.25) ? HP_BAR_LOW_GRADIENT : hpBarGradient(),
      transition: 'width 0.25s', borderRadius: '2px',
    });
    hpTrack.appendChild(hpFill);
    card.appendChild(hpTrack);
    (card as any)._hpFill = hpFill;
    (card as any)._hpTrack = hpTrack;

    const morTrack = document.createElement('div');
    Object.assign(morTrack.style, {
      width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px',
      overflow: 'hidden', display: isDead ? 'none' : '', flexShrink: '0',
    });
    const morFill = document.createElement('div');
    Object.assign(morFill.style, {
      width: (isDead ? 0 : morPct * 100).toFixed(1) + '%', height: '100%',
      background: moraleBarGradient(), transition: 'width 0.25s', borderRadius: '2px',
    });
    morTrack.appendChild(morFill);
    card.appendChild(morTrack);
    (card as any)._morFill = morFill;
    (card as any)._morTrack = morTrack;

    card.addEventListener('pointerdown', (e: PointerEvent) => {
      e.stopPropagation();
    });

    card.addEventListener('click', (e: MouseEvent) => {
      if (ru.dead || ru.removed || ru.routed) return;
      e.stopPropagation();
      if (this.deployPhase) {
        this._handleDeployUnitPick(ru, e.ctrlKey || e.metaKey, e.shiftKey);
        return;
      }
      this._handleBattleUnitPick(ru, e.ctrlKey || e.metaKey, e.shiftKey);
    });

    // Bogaty tooltip 1E (C-09 v5 klatka 6) \u2014 hover na kart\u0119 rosteru, bez op\u00f3\u017anienia.
    card.addEventListener('pointerenter', (e: PointerEvent) => {
      if (ru.dead || ru.removed) return;
      this._showHoverTooltip(ru, e.clientX, e.clientY);
    });
    card.addEventListener('pointermove', (e: PointerEvent) => {
      if (this._hoverTooltip && this._hoverTooltip.style.display === 'block') {
        this._hoverTooltip.style.left = (e.clientX + 14) + 'px';
        this._hoverTooltip.style.top = (e.clientY + 14) + 'px';
      }
    });
    card.addEventListener('pointerleave', () => {
      this._clearHoverTooltip();
    });

    if (!this.deployPhase) {
      this._attachRosterMergeDrag(card, ru);
    }

    return card;
  }

  /** Odswiez WSZYSTKIE karty rostera (aktualizuj, nie odtwarzaj). */
  private _updateRosterBar(): void {
    if (this.deployPhase) {
      if (!this._ensureDeployRowRefs()) return;
      const roster = this._playerRoster();
      const rosterContainer = this._battleRosterCards ?? this._deployUnitsRow;
      let missingCards = false;
      let wrongContainer = false;
      for (const ru of roster) {
        if (ru.dead || ru.removed) continue;
        const card = this._unitCards.get(ru.bu.id);
        if (!card) { missingCards = true; break; }
        if (!rosterContainer?.contains(card)) {
          wrongContainer = true;
          break;
        }
      }
      if (missingCards || wrongContainer) {
        this._rebuildDeployRosterGrid();
        return;
      }
      this._updateBattleRosterHeader();
      for (const ru of roster) {
        const card = this._unitCards.get(ru.bu.id);
        if (!card) continue;
        const isDead = ru.dead || ru.removed;
        const isSel = this._selectedUnits.has(ru.bu.id);
        const hpPct = ru.bu.maxHp > 0 ? Math.max(0, ru.bu.hp / ru.bu.maxHp) : 0;
        const row = this._armyCompositionKind(ru);
        card.style.opacity = isDead ? '0.35' : '1';
        card.style.cursor = isDead ? 'default' : 'pointer';
        Object.assign(card.style, rosterCardBaseStyle(row, isSel));
        if (ru.groupId && !isSel && !isDead) {
          card.style.border = '1px solid rgba(232,216,138,0.55)';
          card.style.boxShadow = 'none';
        }
        const hpFill = (card as any)._hpFill as HTMLDivElement | undefined;
        if (hpFill) {
          hpFill.style.width = (hpPct * 100).toFixed(0) + '%';
          hpFill.style.background = hpPct > 0.25 ? '#4caf50' : BATTLE_ENEMY;
        }
        // Etykieta karty = nazwa jednostki (ustawiona raz w _createUnitCard, statyczna —
        // deploy nie zna stanów dead/rout, więc nie ma czego tu przemalowywać).
        let gBadge = (card as any)._gBadge as HTMLDivElement | undefined;
        if (ru.groupId && !isDead) {
          if (!gBadge) {
            gBadge = document.createElement('div');
            Object.assign(gBadge.style, {
              position: 'absolute', top: '6px', right: '3px',
              minWidth: '14px', height: '14px', borderRadius: '3px',
              background: 'linear-gradient(180deg,#ffd700,#c9a020)',
              color: '#1a1000',
              fontSize: '9px', fontWeight: 'bold', lineHeight: '14px',
              textAlign: 'center', padding: '0 2px',
              boxShadow: '0 0 4px rgba(255,215,0,0.7)',
            });
            card.appendChild(gBadge);
            (card as any)._gBadge = gBadge;
          }
          const gNum = this._groupDisplayNum(ru.groupId);
          gBadge.textContent = gNum != null ? String(gNum) : '';
          gBadge.style.display = 'block';
        } else if (gBadge) {
          gBadge.style.display = 'none';
        }
      }
      this._refreshDeployGroupHeaderLabels();
      requestAnimationFrame(() => this._syncDeployPanelLayout());
      return;
    }
    // Walka: karty płasko w battle-roster-cards.
    // Iterujemy _playerRoster() (a NIE this.atk), bo _rebuildBattleRosterGrid buduje
    // karty właśnie dla _playerRoster(). Gdy gracz jest OBROŃCĄ (_playerRoster()===this.def),
    // rozjazd atk/roster powodował wieczne needRebuild → nieskończona rekurencja (crash).
    const battleRoster = this._playerRoster();
    let needRebuild = false;
    for (const ru of battleRoster) {
      if (ru.dead || ru.removed || ru.routed) continue;
      const card = this._unitCards.get(ru.bu.id);
      if (!card) { needRebuild = true; break; }
      if (!this._battleRosterCards?.contains(card)) {
        needRebuild = true;
        break;
      }
    }
    if (needRebuild || !this._battleRosterCards?.isConnected) {
      this._rebuildBattleRosterGrid();
      return;
    }
    for (const ru of battleRoster) {
      let card = this._unitCards.get(ru.bu.id);
      if (!card) {
        card = this._createUnitCard(ru);
        const looseHost = this._ensureBattleLooseCardsContainer();
        looseHost.appendChild(card);
        this._unitCards.set(ru.bu.id, card);
        requestAnimationFrame(() => this._syncBattleRosterPanelLayout());
      }
      const isDead = ru.dead || ru.fadingOut || ru.removed;
      const isRouted = ru.routed;
      const isSel = this._selectedUnits.has(ru.bu.id);
      const hpPct = ru.bu.maxHp > 0 ? Math.max(0, ru.bu.hp / ru.bu.maxHp) : 0;
      const moraleVal: number = ru.morale ?? (hpPct * 100);
      const moraleMax: number = ru.moraleMax ?? 100;
      const morPct = moraleMax > 0 ? Math.max(0, moraleVal / moraleMax) : hpPct;
      const row = this._armyCompositionKind(ru);

      // C-09 v5 klatka 6: stan karty (normalna/zaznaczona/rout/martwa) \u2014 pe\u0142ny
      // przemalunek na wypadek przej\u015bcia \u017cywa->rout->martwa PO utworzeniu karty.
      const stateStyle = isDead
        ? { border: '1px dashed rgba(232,216,138,0.22)', background: 'rgba(255,255,255,0.02)', boxShadow: 'none' }
        : isRouted
          ? { border: '1px solid rgba(232,216,138,0.18)', background: 'linear-gradient(180deg,rgba(24,30,40,.96),rgba(10,13,20,.96))', boxShadow: 'none' }
          : rosterCardBaseStyle(row, isSel);
      card.style.opacity = isDead ? '0.4' : isRouted ? '0.5' : '1';
      card.style.cursor = isDead || isRouted ? 'default' : 'pointer';
      card.style.justifyContent = isDead ? 'center' : 'flex-start';
      Object.assign(card.style, stateStyle);
      let gBadge = (card as any)._gBadge as HTMLDivElement | undefined;
      if (ru.groupId && !isDead) {
        if (!gBadge) {
          gBadge = document.createElement('div');
          applyGroupBadge1E(gBadge);
          card.appendChild(gBadge);
          (card as any)._gBadge = gBadge;
        }
        const gNum = this._groupDisplayNum(ru.groupId);
        gBadge.textContent = gNum != null ? String(gNum) : '';
        gBadge.style.display = 'block';
      } else if (gBadge) {
        gBadge.style.display = 'none';
      }

      const iconEl = (card as any)._iconEl as HTMLDivElement | undefined;
      if (iconEl) {
        const wantSvg = isDead ? ROSTER_STATE_SVG.dead : isRouted ? ROSTER_STATE_SVG.routed
          : row === 'mounted' ? ROSTER_TYPE_SVG.mounted : row === 'ranged' ? ROSTER_TYPE_SVG.ranged : ROSTER_TYPE_SVG.melee;
        if ((iconEl as any)._stateKey !== (isDead ? 'dead' : isRouted ? 'routed' : row)) {
          iconEl.innerHTML = wantSvg;
          const sv = iconEl.querySelector('svg');
          if (sv && !isDead) { sv.setAttribute('width', '15'); sv.setAttribute('height', '15'); }
          (iconEl as any)._stateKey = isDead ? 'dead' : isRouted ? 'routed' : row;
        }
        iconEl.style.color = isDead ? ROSTER_DEAD_COLOR : isRouted ? BATTLE_ENEMY_TEXT : '';
      }
      const hpTrack = (card as any)._hpTrack as HTMLDivElement | undefined;
      if (hpTrack) hpTrack.style.display = isDead ? 'none' : '';
      const morTrack = (card as any)._morTrack as HTMLDivElement | undefined;
      if (morTrack) morTrack.style.display = isDead ? 'none' : '';

      const hpFill = (card as any)._hpFill as HTMLDivElement | undefined;
      if (hpFill) {
        hpFill.style.width = (hpPct * 100).toFixed(0) + '%';
        hpFill.style.background = (isRouted || hpPct <= 0.25) ? HP_BAR_LOW_GRADIENT : hpBarGradient();
      }
      const morFill = (card as any)._morFill as HTMLDivElement | undefined;
      if (morFill) {
        morFill.style.width = (isDead ? 0 : morPct * 100).toFixed(0) + '%';
        morFill.style.background = moraleBarGradient();
      }
      const hpLbl = (card as any)._hpLbl as HTMLDivElement | undefined;
      if (hpLbl) {
        // Makieta TW v5: etykieta = nazwa jednostki w stanie normalnym; dead/rout
        // (F2) nadpisuj\u0105 j\u0105 chwilowym stanem \u2014 nazwa wraca, gdy jednostka o\u017cyje
        // (np. scalanie rannych) bo _createUnitCard j\u0105 tam zapisa\u0142 raz na starcie.
        hpLbl.textContent = isDead ? 'Pad\u0142a' : isRouted ? 'Rout' : this._unitDisplayLabel(ru);
        hpLbl.style.color = isDead ? ROSTER_DEAD_COLOR : isRouted ? BATTLE_ENEMY_TEXT : '#c8b898';
        hpLbl.style.textTransform = (isDead || isRouted) ? 'uppercase' : 'none';
        hpLbl.style.letterSpacing = isDead ? '0.06em' : isRouted ? '0.08em' : '0';
        hpLbl.style.fontSize = '7px';
      }
    }
    this._paintTwGroupTabs(this._battleGroupTabs);
    this._updateGroupSelectorBar();
  }


  // =========================================================================
  // GRUPOWANIE JEDNOSTEK (zakres 1-5)
  // =========================================================================

  /**
   * Wycofuje jednostki z dotychczasowych grup (bez rozbijania calej grupy —
   * pozostali czlonkowie zostaja w starej grupie).
   */
  private _detachUnitsFromGroups(units: RuntimeBattleUnit[]): void {
    for (const ru of units) {
      if (!ru.groupId) continue;
      const gid = ru.groupId;
      const set = this._groups.get(gid);
      if (set) {
        set.delete(ru.bu.id);
        if (set.size === 0) {
          this._groups.delete(gid);
          this._groupMeta.delete(gid);
          this._rosterGroupCollapsed.delete(gid);
        }
      }
      ru.groupId = null;
      ru.formationOffset = null;
      this._refreshUnitRingColor(ru);
      this._removeGroupFrameMarker(ru);
    }
    this._pruneStaleGroups();
  }

  /**
   * Tworzy TRWALA grupe z aktualnie zaznaczonych jednostek.
   * Nadaje im wspolne groupId, zapisuje wzgledne offsety od centroidu
   * (formacja pierwotna) i aktualizuje roster oraz panel.
   */
  private _groupSelected(): void {
    if (this._selectedUnits.size < 2) {
      this._showDeployFeedback('Zaznacz co najmniej 2 jednostki, potem kliknij \u25C6 Grupuj');
      return;
    }
    const selUnits = [...this._selectedUnits]
      .map(id => this._groupRegistryRoster().find(u => u.bu.id === id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed && !u.routed);
    if (selUnits.length < 2) {
      this._showDeployFeedback('Za malo zywych jednostek do grupowania');
      return;
    }

    // Wycofaj tylko zaznaczone z dotychczasowych grup (reszta zostaje w starej grupie).
    this._detachUnitsFromGroups(selUnits);

    // Wyznacz centroid (srednia pozycja) w chwili grupowania
    const centCol = selUnits.reduce((s, u) => s + u.q, 0) / selUnits.length;
    const centRow = selUnits.reduce((s, u) => s + u.r, 0) / selUnits.length;

    // Nadaj nowe groupId — BŁĄD J: najniższy WOLNY numer (_nextFreeGroupId),
    // nie licznik rosnący (_groupCounter zostaje tylko jako high-water mark,
    // niekonsultowany przy alokacji — patrz komentarz przy _nextFreeGroupId).
    const gid = this._nextFreeGroupId();
    this._groupCounter = Math.max(this._groupCounter, parseInt(gid, 10));
    const memberIds = new Set<string>();

    for (const ru of selUnits) {
      ru.groupId = gid;
      ru.formationOffset = {
        dc: Math.round(ru.q - centCol),
        dr: Math.round(ru.r - centRow),
      };
      memberIds.add(ru.bu.id);
      // Kolor obwodki: zloty dla grupy
      this._refreshUnitRingColor(ru);
      this._updateGroupFrameMarker(ru);
    }
    this._groups.set(gid, memberIds);
    const meta = this._ensureGroupMeta(gid);
    if (this.deployPhase) {
      this._setGroupDoctrine(gid, 'steady');
    } else if (meta.doctrine === 'manual') {
      meta.autoPlay = false;
    } else {
      meta.autoPlay = true;
    }
    if (!this.deployPhase) this._rosterGroupCollapsed.add(gid);
    this._deployActiveGroupId = gid;
    this._pruneStaleGroups();
    this._showDeployFeedback('\u2713 ' + this._groupDisplayLabel(gid) + ': ' + selUnits.length + ' jednostek');
    if (this.deployPhase) {
      this._rebuildDeployRosterGrid();
      this._refreshDeploySelectionVisuals();
      this._selectDeployGroupToggle(gid, true);
    } else {
      this._rebuildBattleRosterGrid();
      this._updateSelectedPanel();
      this._updateGroupSelectorBar();
      this._updateDeployToolbarStatus();
      this._syncBattleToolbarMode();
    }
  }

  /**
   * Rozbiega grupe o podanym groupId.
   * Resetuje groupId i formationOffset wszystkich czlonkow.
   */
  private _disbandGroup(gid: string): void {
    const ids = this._liveGroupMemberIds(gid);
    for (const id of ids) {
      const ru = this._groupRegistryRoster().find(u => u.bu.id === id);
      if (!ru) continue;
      ru.groupId = null;
      ru.formationOffset = null;
      this._refreshUnitRingColor(ru);
      this._removeGroupFrameMarker(ru);
    }
    this._groups.delete(gid);
    this._groupMeta.delete(gid);
    this._rosterGroupCollapsed.delete(gid);
  }

  /**
   * Wycofuje zaznaczone jednostki z grup (bez rozwalania calej grupy, jesli zaznaczono podzbior).
   */
  private _ungroupSelected(): void {
    const selUnits = [...this._selectedUnits]
      .map(id => this._findUnitById(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed && !!u.groupId);
    if (selUnits.length === 0) {
      const msg = 'Zaznaczone jednostki nie sa w grupie';
      if (this.deployPhase) this._showDeployFeedback(msg);
      else this._showOrderFeedback(msg);
      return;
    }
    const gids = new Set(selUnits.map(u => u.groupId!));
    this._detachUnitsFromGroups(selUnits);
    this._pruneStaleGroups();
    const msg = '\u2713 Wycofano ' + selUnits.length + ' z '
      + gids.size + (gids.size === 1 ? ' grupy' : ' grup');
    if (this.deployPhase) this._showDeployFeedback(msg);
    else this._showOrderFeedback(msg);
    if (this.deployPhase) {
      this._rebuildDeployRosterGrid();
      this._refreshDeploySelectionVisuals();
      this._updateDeployGroupsBar();
      this._updateDeployStrategyBar();
    } else {
      this._rebuildBattleRosterGrid();
      this._updateSelectedPanel();
      this._updateGroupSelectorBar();
      this._updateDeployToolbarStatus();
      this._syncBattleToolbarMode();
    }
  }

  /**
   * Odswieza kolor obwodki zaznaczenia dla jednostki (zloty = w grupie, zielony = zaznaczona zwykla).
   */
  private _refreshUnitRingColor(ru: RuntimeBattleUnit): void {
    const ring = this._selectionRings.get(ru.bu.id);
    if (!ring) return;
    ring.position.set(0, 0.03, 0);
    const mat = ring.material as THREE.MeshBasicMaterial;
    if (ru.groupId) {
      mat.color.setHex(0xffd700); // zloty = grupa
    } else {
      mat.color.setHex(0x00ffcc); // cyjan = zwykle zaznaczenie
    }
  }

  /** Tekstura z numerem grupy (sprite nad jednostka). */
  private _makeGroupNumberTexture(label: string): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 28;
    c.height = 28;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(2, 2, 24, 24);
    ctx.strokeStyle = '#1a1408';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 24, 24);
    ctx.fillStyle = '#1a1408';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 14, 15);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  /** Usuwa ramke grupy spod jednostki. */
  private _removeGroupFrameMarker(ru: RuntimeBattleUnit): void {
    const g = this._groupFrameMarkers?.get(ru.bu.id);
    if (!g) return;
    ru.group.remove(g);
    g.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Sprite) {
        obj.geometry?.dispose();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach(x => x.dispose());
        else m?.dispose();
      }
    });
    this._groupFrameMarkers.delete(ru.bu.id);
  }

  /** Zloty kwadrat + numer grupy na mapie (widoczne caly czas). */
  private _updateGroupFrameMarker(ru: RuntimeBattleUnit): void {
    this._removeGroupFrameMarker(ru);
    if (!ru.groupId || ru.dead || ru.removed) return;

    const g = new THREE.Group();
    g.name = 'groupFrame';
    const hs = TILE_S * 0.44;
    const y = 0.04;

    const frameGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-hs, y, -hs),
      new THREE.Vector3( hs, y, -hs),
      new THREE.Vector3( hs, y,  hs),
      new THREE.Vector3(-hs, y,  hs),
      new THREE.Vector3(-hs, y, -hs),
    ]);
    this.ownedGeos.push(frameGeo);
    const frameMat = new THREE.LineBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    this.ownedMats.push(frameMat);
    g.add(new THREE.Line(frameGeo, frameMat));

    const num = this._groupDisplayNum(ru.groupId);
    if (num != null) {
      const tex = this._makeGroupNumberTexture(String(num));
      const spriteMat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });
      this.ownedMats.push(spriteMat);
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.55, 0.55, 1);
      sprite.position.set(-hs * 0.85, 0.55, -hs * 0.85);
      g.add(sprite);
    }

    ru.group.add(g);
    this._groupFrameMarkers.set(ru.bu.id, g);
  }

  /** Odswieza ramki wszystkich jednostek gracza w grupach. */
  private _syncAllGroupFrameMarkers(): void {
    for (const ru of this._playerRoster()) {
      if (ru.groupId && !ru.dead && !ru.removed) {
        this._updateGroupFrameMarker(ru);
      } else {
        this._removeGroupFrameMarker(ru);
      }
    }
  }

  /** Kolejnosc jednostek na pasku rostera (zywe, nie wycofane). */
  private _battleRosterOrder(): RuntimeBattleUnit[] {
    return this._playerRoster().filter(u => !u.dead && !u.removed && !u.routed);
  }

  /** Zastepuje zaznaczenie w walce recznej. */
  private _selectBattleUnitsByIds(ids: string[]): void {
    for (const id of [...this._selectedUnits]) {
      const u = this._findUnitById(id);
      if (u) this._removeSelectionRing(u);
    }
    this._selectedUnits.clear();
    for (const id of ids) {
      const u = this._findUnitById(id);
      if (u && !u.dead && !u.removed && !u.routed) {
        this._selectedUnits.add(id);
        this._addSelectionRing(u);
        this._refreshUnitRingColor(u);
      }
    }
    this._updateRosterBar();
    this._updateSelectedPanel();
    this._updateBattleQuickSelectBar();
    this._updateBattleSelectionBar();
    if (!this.deployPhase && this.started) this._updateDeployToolbarStatus();
  }

  /** Toggle zaznaczenia calej grupy (przycisk w panelu — drugi klik odznacza). */
  private _selectBattleGroupToggle(gid: string): void {
    this._pruneStaleGroups();
    const liveIds = this._liveGroupMemberIds(gid);
    if (liveIds.length === 0) {
      this._updateBattleQuickSelectBar();
      this._showBattleRosterFeedback('Grupa pusta');
      return;
    }
    const onlyThisGroup = liveIds.every(id => this._selectedUnits.has(id))
      && this._selectedUnits.size === liveIds.length;
    if (onlyThisGroup) {
      this._clearAllSelection();
      this._showBattleRosterFeedback('Odznaczono');
    } else {
      this._selectBattleUnitsByIds(liveIds);
      this._showBattleRosterFeedback(this._groupDisplayLabel(gid) + ': ' + liveIds.length);
    }
    this._updateBattleSelectionBar();
  }

  /** Mapa / karta — przełącz na grupe (bez odznaczania ponownego kliku tej samej). */
  private _selectBattleGroupReplace(gid: string): void {
    this._pruneStaleGroups();
    const liveIds = this._liveGroupMemberIds(gid);
    if (liveIds.length === 0) {
      this._showBattleRosterFeedback('Grupa pusta');
      return;
    }
    const onlyThisGroup = liveIds.every(id => this._selectedUnits.has(id))
      && this._selectedUnits.size === liveIds.length;
    if (onlyThisGroup) return;
    this._selectBattleUnitsByIds(liveIds);
    this._updateBattleSelectionBar();
  }

  /** Po rozkazie — automatycznie zaznacz nastepna jednostke do recznego sterowania. */
  private _advanceToNextBattleUnit(skipIds: Set<string>): void {
    const order = this._battleRosterOrder();
    if (order.length === 0) return;
    let pivot = -1;
    for (let i = 0; i < order.length; i++) {
      if (skipIds.has(order[i]!.bu.id)) pivot = i;
    }
    const tryPick = (preferUnacted: boolean): RuntimeBattleUnit | null => {
      if (pivot < 0) pivot = 0;
      for (let step = 1; step <= order.length; step++) {
        const u = order[(pivot + step) % order.length]!;
        if (skipIds.has(u.bu.id)) continue;
        if (!preferUnacted || !u.acted) return u;
      }
      return null;
    };
    const next = tryPick(true) ?? tryPick(false);
    if (next) this._selectBattleUnitsByIds([next.bu.id]);
    else this._clearAllSelection();
  }

  /** Klik na jednostke w walce — jak deploy C09: LPM = jedna jednostka; Ctrl/Shift = multi. */
  private _handleBattleUnitPick(ru: RuntimeBattleUnit, ctrl: boolean, shift: boolean): void {
    if (ru.dead || ru.removed || ru.routed) return;
    const additive = ctrl || shift;

    if (additive) {
      if (this._selectedUnits.has(ru.bu.id)) {
        this._selectedUnits.delete(ru.bu.id);
        this._removeSelectionRing(ru);
      } else {
        this._selectedUnits.add(ru.bu.id);
        this._addSelectionRing(ru);
        this._refreshUnitRingColor(ru);
      }
      this._updateRosterBar();
      this._updateSelectedPanel();
      this._updateBattleQuickSelectBar();
      this._updateBattleSelectionBar();
      if (!this.deployPhase && this.started) this._updateDeployToolbarStatus();
      return;
    }

    if (this._selectedUnits.size === 1 && this._selectedUnits.has(ru.bu.id)) return;
    this._selectBattleUnitsByIds([ru.bu.id]);
  }

  /** Buduje pasek szybkiego zaznaczenia w lewym panelu rosteru walki. */
  private _ensureBattleQuickSelectBar(): void {
    if (this._battleQuickSelectBar?.isConnected || this.deployPhase) return;
    if (this._rosterBar) return;
    this._buildRosterBar();
  }

  /** Odswieza filtry typu + grupy (+ Generał tylko w walce). */
  private _updateBattleQuickSelectBar(): void {
    const bar = this._battleQuickSelectBar;
    const active = this.deployPhase || (this.started && this._manualMode);
    if (!bar || !active) {
      if (bar) bar.style.display = 'none';
      this._battleQuickSelectSig = '';
      return;
    }
    bar.style.display = 'flex';

    const groups = this._sortedGroupIds();
    const sig = [
      this.deployPhase ? 'deploy' : 'battle',
      [...this._selectedUnits].sort().join(','),
      groups.join(','),
      this._deployActiveGroupId ?? '',
      this._generalPanel ? '1' : '0',
    ].join('|');
    if (sig === this._battleQuickSelectSig && bar.childElementCount > 0) return;
    this._battleQuickSelectSig = sig;

    bar.innerHTML = '';
    // Dwa piętra (decyzja Macieja 2026-07-23): rząd 1 = klasy + Wszystkie + Generał (walka),
    // rząd 2 = grupy G1/G2/...
    Object.assign(bar.style, { flexDirection: 'column', flexWrap: 'nowrap', gap: '5px' });
    const mkRow = (): HTMLDivElement => {
      const r = document.createElement('div');
      Object.assign(r.style, { display: 'flex', flexWrap: 'wrap', gap: '5px' });
      return r;
    };
    const row1 = mkRow();
    bar.appendChild(row1);

    const mkKind = (label: string, kind: 'mounted' | 'melee' | 'ranged'): void => {
      row1.appendChild(this._makeDeployQuickBtn(
        label,
        this._isDeploySelectionExactlyKind(kind),
        () => this.deployPhase
          ? this._selectDeployByKindToggle(kind)
          : this._selectBattleByKindToggle(kind),
        { kind, fullWidth: false },
      ));
    };
    mkKind('Konnica', 'mounted');
    mkKind('Piechota', 'melee');
    mkKind(DEPLOY_KIND_LABEL.ranged, 'ranged');
    row1.appendChild(this._makeDeployQuickBtn(
      'Wszystkie',
      this._isDeploySelectionAll(),
      () => {
        if (this.deployPhase) {
          this._selectDeployAllToggle();
          return;
        }
        const ids = this._selectableAtkUnits().map(u => u.bu.id);
        const allSel = ids.every(id => this._selectedUnits.has(id)) && this._selectedUnits.size === ids.length;
        if (allSel) {
          this._clearAllSelection();
          this._showBattleRosterFeedback('Odznaczono');
        } else {
          this._selectBattleUnitsByIds(ids);
          this._showBattleRosterFeedback('Wszystkie: ' + ids.length);
        }
      },
      { kind: 'all-icon', fullWidth: false },
    ));

    if (!this.deployPhase) {
      row1.appendChild(this._makeDeployQuickBtn(
        'Genera\u0142',
        !!this._generalPanel,
        () => this._toggleGeneralPanel(),
        { kind: 'general-icon', fullWidth: false },
      ));
    }

    if (groups.length > 0) {
      const row2 = mkRow();
      bar.appendChild(row2);
      for (const gid of groups) {
        const managing = this.deployPhase && this._deployActiveGroupId === gid;
        const selected = this._isDeploySelectionExactlyGroup(gid);
        row2.appendChild(this._makeDeployQuickBtn(
          this._groupDisplayLabel(gid),
          managing || selected,
          () => this.deployPhase
            ? this._handleDeployGroupTabClick(gid)
            : this._selectBattleGroupToggle(gid),
          { kind: 'group', groupId: gid, fullWidth: false },
        ));
      }
    }
  }

  /** Zaznacz / odznacz wszystkie jednostki danego typu (walka). */
  private _selectBattleByKindToggle(kind: 'mounted' | 'melee' | 'ranged'): void {
    const kindLbl = DEPLOY_KIND_LABEL[kind];
    const ids = this._selectableAtkUnits()
      .filter(u => this._deployRowKind(u) === kind)
      .map(u => u.bu.id);
    if (ids.length === 0) {
      this._showBattleRosterFeedback(kindLbl + ': brak');
      return;
    }
    const allSel = ids.every(id => this._selectedUnits.has(id)) && this._selectedUnits.size === ids.length;
    if (allSel) {
      this._clearAllSelection();
      this._showBattleRosterFeedback('Odznaczono');
    } else {
      this._selectBattleUnitsByIds(ids);
      this._showBattleRosterFeedback(kindLbl + ': ' + ids.length);
    }
  }

  /** Komunikat w lewym panelu rosteru walki. */
  private _showBattleRosterFeedback(msg: string): void {
    if (!this._battleRosterFeedback || !this.started || this.deployPhase) {
      this._showOrderFeedback(msg);
      return;
    }
    const el = this._battleRosterFeedback;
    const prev = el.textContent;
    el.textContent = msg;
    el.style.color = '#7be08a';
    setTimeout(() => {
      if (el.textContent === msg) {
        el.style.color = BATTLE_TEXT_DIM;
        el.textContent = prev ?? 'LPM: zaznacz \u00B7 PPM: odznacz \u00B7 R = AUTO/RECZNY';
      }
    }, 2800);
  }

  /**
   * Klikniecie na jednostke: jezeli jest w grupie, zaznacz CALA grupe.
   * Jezeli Ctrl/Shift wcisniety, zaznacz tylko TE jednostke (indywidualny rozkaz).
   */
  private _toggleSelectUnitOrGroup(ru: RuntimeBattleUnit, individual: boolean = false): void {
    if (!individual && ru.groupId) {
      // Zaznacz cala grupe
      const gid = ru.groupId;
      const alreadyAllSelected = this._isWholeGroupSelected(gid);
      if (alreadyAllSelected) {
        const members = this._liveGroupMemberIds(gid);
        for (const id of members) {
          const u = this._findUnitById(id);
          if (u) { this._selectedUnits.delete(id); this._removeSelectionRing(u); }
        }
      } else {
        const members = this._liveGroupMemberIds(gid);
        for (const id of members) {
          const u = this._findUnitById(id);
          if (u && !u.dead && !u.removed) {
            this._selectedUnits.add(id);
            this._addSelectionRing(u);
            this._refreshUnitRingColor(u);
          }
        }
      }
    } else {
      // Zwykly toggle (indywidualny lub jednostka bez grupy)
      this._toggleSelectUnit(ru);
    }
    if (this.deployPhase) {
      this._refreshDeploySelectionVisuals();
    } else {
      this._updateRosterBar();
      this._updateSelectedPanel();
    }
  }

  /** Sprawdza czy WSZYSTKIE zywe czlonkowie grupy sa zaznaczeni. */
  private _isWholeGroupSelected(gid: string): boolean {
    const members = this._liveGroupMemberIds(gid);
    if (members.length === 0) return false;
    for (const id of members) {
      const u = this._findUnitById(id);
      if (u && !u.dead && !u.removed && !this._selectedUnits.has(id)) return false;
    }
    return true;
  }

  /**
   * Wydaje rozkaz RUCH grupie Z ZACHOWANIEM FORMACJI.
   * Jednostki docieraja do targetCol/targetRow + ich formationOffset.
   */
  private _orderGroupMove(gid: string, targetCol: number, targetRow: number): void {
    const ids = this._liveGroupMemberIds(gid);
    for (const id of ids) {
      const u = this._findUnitById(id);
      if (!u || u.dead || u.removed) continue;
      const dest = this._moveTargetForUnit(u, targetCol, targetRow);
      u.playerOrder = { type: 'move', col: dest.col, row: dest.row };
    }
  }

  /**
   * Stosuje formacje F1/F2/F3 do grupy o podanym gid (walka reczna / legacy).
   */
  private _applyGroupFormation(gid: string, formation: 'F1' | 'F2' | 'F3'): void {
    const ids = this._liveGroupMemberIds(gid);
    if (ids.length === 0) return;
    const units = ids
      .map(id => this._findUnitById(id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    if (units.length === 0) return;
    this._applyFormationToUnits(units, formation);
    if (this.deployPhase) {
      this._updateRosterBar();
      this._refreshDeploySelectionVisuals();
    } else {
      this._updateSelectedPanel();
    }
  }

  /**
   * Uklada podane jednostki w formacji F1/F2/F3.
   * W deploy: fizyczny ruch; w walce: rozkazy move.
   * @returns true gdy przynajmniej jedna jednostka zmienila pozycje lub slot.
   */
  private _applyFormationToUnits(units: RuntimeBattleUnit[], formation: 'F1' | 'F2' | 'F3'): boolean {
    if (units.length === 0) return false;

    const avgCol = Math.round(units.reduce((s, u) => s + u.q, 0) / units.length);
    const avgRow = Math.round(units.reduce((s, u) => s + u.r, 0) / units.length);
    const anchor = this._clampDeployFormationAnchor(avgCol, avgRow, units[0]?.side ?? 'atk');
    const centCol = anchor.col;
    const midRow = anchor.row;

    const uniqueSlots = this._formationSlotsForUnits(units, formation);
    if (uniqueSlots.length === 0) return false;

    for (const [u, dc, dr] of uniqueSlots) {
      const colOff = this._colOffForFormation(u.side, dc);
      u.formationOffset = { dc: colOff, dr };
    }

    if (this.deployPhase) {
      const layout = this._computeFormationLayoutAt(units, centCol, midRow, formation);
      const slotOrder = uniqueSlots.map(([u]) => u);
      const placed = this._placeDeployLayoutUnits(units, layout, slotOrder);
      return placed > 0;
    }

    const clampPlayColFn = (c: number): number => clampPlayCol(c);
    const clampPlayRowFn = (r: number): number => clampPlayRow(r);
    let anyChange = false;
    for (const [u, dc, dr] of uniqueSlots) {
      const colOff = this._colOffForFormation(u.side, dc);
      const destCol = clampPlayColFn(centCol + colOff);
      const destRow = clampPlayRowFn(midRow + dr);
      u.playerOrder = { type: 'move', col: destCol, row: destRow };
      anyChange = true;
    }
    return anyChange || uniqueSlots.length > 0;
  }


}

// ---------------------------------------------------------------------------
// Instant (skip) resolver -- pure logic, no DOM/THREE rendering
// ---------------------------------------------------------------------------

function computeInstantResult(
  aliveAtk: RuntimeBattleUnit[],
  aliveDef: RuntimeBattleUnit[],
  terrain: string,
  terrainData: any[],
  counters: any[],
  terrainMap?: BattleTerrainMap,
  attackerCivBonusy: readonly CivBonusEntry[] = [],
  defenderCivBonusy: readonly CivBonusEntry[] = [],
  // C-COMBAT-Q1 (Maciej, 2026-07-26): bonus Obrony muru/Cytadeli/Baszty (procent,
  // 0/200/300/400 -- BattleScene.wallDefenseTotalProc), przekazywany do
  // resolveCombat jako structureDefBonusPct dla obrońców onWallWalkway --
  // wcześniej "Pomiń" w ogóle nie stosował tego bonusu (rozjazd z _singleBlow).
  wallDefenseTotalProc: number = 0,
  // C-COMBAT-Q2 (Maciej, 2026-07-26): BattleScene.isCityDefenseBattle -- gate
  // bonusu terenu w obronie miasta (patrz komentarz przy defOnWall nizej).
  // Domyslnie false = bez zmian dla kazdego istniejacego wywolania (bitwa w
  // polu, poza miastem).
  isCityDefense: boolean = false,
  armyHungerStatMult: number = 0.75,
  attackerDifficultyCombatMult: number = 1,
  defenderDifficultyCombatMult: number = 1,
  goldDeficitStatMult: number = 0.75,
): { winner: 'atakujacy' | 'obronca'; survivors: BattleUnit[]; log: string[] } {
  const log: string[] = [];

  const atkState = aliveAtk.map(u => ({ ru: u, hp: u.bu.hp }));
  const defState = aliveDef.map(u => ({ ru: u, hp: u.bu.hp }));

  const maxWaves = (atkState.length + defState.length) * 6 + 10;
  let wave = 0;

  while (wave < maxWaves) {
    wave++;
    const lA = atkState.filter(u => u.hp > 0);
    const lD = defState.filter(u => u.hp > 0);
    if (lA.length === 0 || lD.length === 0) break;

    const pairs = Math.max(lA.length, lD.length);
    for (let i = 0; i < pairs; i++) {
      const a = lA[i % lA.length];
      const d = lD[i % lD.length];
      if (!a || !d || a.hp <= 0 || d.hp <= 0) continue;

      const cu_a = toCombatUnit(a.ru.bu, armyHungerStatMult, true, goldDeficitStatMult, true);
      const cu_d = toCombatUnit(d.ru.bu, armyHungerStatMult, true, goldDeficitStatMult, true);
      cu_a.health = a.hp;
      cu_d.health = d.hp;

      // FACING (SS5l) for the instant/skip resolve too: classify where the
      // attacker strikes relative to the defender's facing so flank/rear
      // defence penalties match the watched battle.
      const arc = relativeHit(
        d.ru.facing, a.ru.q, a.ru.r, d.ru.q, d.ru.r,
      );

      // Per-tile terrain (B8): the DEFENDER's tile decides its terrain defence
      // bonus in the canonical resolver, falling back to the battlefield-wide
      // terrain name when no map is provided.
      //
      // C-COMBAT-Q1 (Maciej, 2026-07-26) parity with _singleBlow: a defender
      // onWallWalkway gets the mur/Cytadela/Baszta Obrona bonus via
      // structureDefBonusPct below instead of its tile's terrain bonus (the
      // wall walkway itself is flat ground) -- previously this skip path
      // ignored the wall bonus entirely, so "Pomiń" resolved as if the city
      // had no walls at all.
      const defOnWall = d.ru.onWallWalkway === true;
      const defTerrain = defOnWall
        ? 'Plaskie (rownina/laka)'
        : (terrainMap ? terrainMap.combatTerrainName(d.ru.q, d.ru.r) : terrain);

      // C-COMBAT-Q2 (Maciej, 2026-07-26): bonus terenu w obronie MIASTA liczy
      // sie WYLACZNIE z wzniesienia i WYLACZNIE gdy miasto ma mur -- gated
      // przez cityGatedTerrainMultiplier (game/city-defense.ts), TYLKO gdy to
      // w ogole obrona miasta (isCityDefense -- walled siege LUB potyczka o
      // miasto bez muru). Bitwa w polu zostaje BEZ ZMIAN (defTerrain ponizej
      // przekazywany do resolveCombat bez zadnej podmiany -- pelny, niegated
      // terrainDefenseMultiplier jak dzis). Kombinacja z bonusem muru jest
      // ADDYTYWNA w punktach procentowych -- patrz main.ts effectiveDefenderM
      // dla pelnego uzasadnienia (Razem = struct% + teren%, NIE mnozone).
      // ELEWACJA: dla obroncy NA murze pochodzi z terenu BAZOWEGO miasta
      // (parametr `terrain`, np. 'wzgorza' -- korona muru sama w sobie jest
      // plaska); dla obroncy NIE na murze (dziedziniec podczas oblezenia, lub
      // kazdy obronca miasta bez muru) pochodzi z JEGO WLASNEGO kafla
      // bitewnego (defTerrain), dokladnie tak precyzyjnie jak terrain zwykly.
      // `defenderTerrainDefMultOverride` (combat.ts) podmienia WYLACZNIE
      // wewnetrzny terrDefMult resolveCombat -- defTerrain nizej (przekazywany
      // jako defenderTerrain) zostaje NIETKNIETY, wiec kontekst bonusow cyw
      // (civCombatStatMultipliers) i kara Atak przy przekraczaniu rzeki
      // (terrainRiverAttackMultiplier) dalej widza REALNY teren.
      const hasMur = wallDefenseTotalProc > 0;
      const cityElevationTerrain = defOnWall ? terrain : defTerrain;
      const cityTerrMult = isCityDefense
        ? cityGatedTerrainMultiplier(hasMur, cityElevationTerrain, terrainData)
        : 1;
      const structBonusPctForPair = (defOnWall ? wallDefenseTotalProc : 0)
        + (isCityDefense ? (cityTerrMult - 1) * 100 : 0);

      // C-FORT-POLE-Q1, skip-resolve parity: +50% Obrony gdy fortifiedInField
      // (jak _singleBlow) -- PRZED mnożnikami brodu/brzegu/terenu.
      if (d.ru.bu.fortifiedInField === true) {
        cu_d.meleeDefence = fieldFortifyDefenseBonus(
          cu_d.meleeDefence, true, FORTIFY_OBRONA_PROC_FIELD,
        );
      }

      // C-BTL-BROD-Q1 (wariant C), skip-resolve parity: pre-scale the
      // defender's Obrona for the ford penalty / shore bonus the animated
      // battle applies per-blow (resolveCombat has no per-attacker-tile
      // concept, so it is folded in here as a stat multiplier instead). No
      // terrainMap (legacy caller) or zero Ford tiles => both multipliers
      // stay 1.0 => unchanged result.
      if (terrainMap) {
        const dOnFord = isFordTile(terrainMap, d.ru.q, d.ru.r);
        if (dOnFord) {
          cu_d.meleeDefence *= (1 - BROD_KARA_OBRONA);
        } else if (
          isFordTile(terrainMap, a.ru.q, a.ru.r) &&
          isShoreAdjacentToFord(terrainMap, d.ru.q, d.ru.r)
        ) {
          cu_d.meleeDefence *= (1 + BROD_BONUS_BRZEG);
        }
      }
      // NOTE: the Atak-side ford penalty (karaAtak) is already covered here by
      // resolveCombat's own pre-existing terrainRiverAttackMultiplier (fires
      // off defTerrain, i.e. when the DEFENDER stands in the ford) -- a
      // legacy, defender-tile-based approximation of the same rule kept as-is
      // for this skip-resolve path. The animated engine (_singleBlow) checks
      // the ATTACKER's own tile instead, which is the precise per-blow rule.

      const res = resolveCombat(cu_a, cu_d, {
        maxRounds:        30,
        defenderTerrain:  defTerrain,
        terrainData,
        counters,
        attackerPosition: arc,
        attackerCivBonusy,
        defenderCivBonusy,
        // C-COMBAT-Q1 (Maciej, 2026-07-26): bonus muru/Cytadeli/Baszty, dopiety
        // do "Pomiń" -- patrz defOnWall/structBonusPctForPair powyżej.
        structureDefBonusPct: structBonusPctForPair,
        // C-COMBAT-Q2 (Maciej, 2026-07-26): w obronie miasta neutralizuje
        // wewnetrzny terrDefMult resolveCombat (elewacja juz policzona wyzej,
        // dodana ADDYTYWNIE do structBonusPctForPair) -- undefined dla bitwy w
        // polu (isCityDefense=false), czyli zero regresji tam.
        defenderTerrainDefMultOverride: isCityDefense ? 1 : undefined,
        // Sciezki ulepszen jednostek (2026-07-25): tryb "pomin animacje" korzysta
        // z tego samego resolveCombat -- musi dostac ten sam per-jednostkowy bonus.
        attackerBuildingBonus: { pancerz: a.ru.bu.pancerzBonusFrac ?? 0, other: a.ru.bu.parametryBonusFrac ?? 0 },
        defenderBuildingBonus: { pancerz: d.ru.bu.pancerzBonusFrac ?? 0, other: d.ru.bu.parametryBonusFrac ?? 0 },
        attackerArmyHungry: a.ru.bu.armyHungry === true,
        defenderArmyHungry: d.ru.bu.armyHungry === true,
        armyHungerStatMult,
        attackerGoldDeficit: a.ru.bu.goldDeficit === true,
        defenderGoldDeficit: d.ru.bu.goldDeficit === true,
        goldDeficitStatMult,
        attackerDifficultyCombatMult,
        defenderDifficultyCombatMult,
      });
      for (const line of res.log) log.push(line);

      a.hp = res.attackerHpLeft;
      d.hp = res.defenderHpLeft;
    }
  }

  const survivorsA = atkState.filter(u => u.hp > 0).map(u => ({ ...u.ru.bu, hp: u.hp }));
  const survivorsD = defState.filter(u => u.hp > 0).map(u => ({ ...u.ru.bu, hp: u.hp }));

  let winner: 'atakujacy' | 'obronca';
  let survivors: BattleUnit[];

  if (survivorsA.length > 0 && survivorsD.length === 0) {
    winner = 'atakujacy'; survivors = survivorsA;
  } else if (survivorsD.length > 0 && survivorsA.length === 0) {
    winner = 'obronca'; survivors = survivorsD;
  } else {
    const hpA = survivorsA.reduce((s, u) => s + u.hp, 0);
    const hpD = survivorsD.reduce((s, u) => s + u.hp, 0);
    winner    = hpA >= hpD ? 'atakujacy' : 'obronca';
    survivors = winner === 'atakujacy' ? survivorsA : survivorsD;
  }

  log.push('=== Natychmiastowy wynik: ' + (winner === 'atakujacy' ? 'ATAKUJACY' : 'OBRONCA') + ' wygrywa ===');
  return { winner, survivors, log };
}

// ---------------------------------------------------------------------------
// Fallback avatar
// ---------------------------------------------------------------------------

function makeFallbackAvatar(color: number): THREE.Group {
  const group   = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.18, 0.28, 0.12);
  const headGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const mat     = new THREE.MeshLambertMaterial({ color });
  const body    = new THREE.Mesh(bodyGeo, mat);
  const head    = new THREE.Mesh(headGeo, mat);
  body.position.y = 0.14;
  head.position.y = 0.35;
  body.castShadow = true;
  head.castShadow = true;
  group.add(body);
  group.add(head);
  group.userData['mats']         = [mat];
  group.userData['perTokenGeos'] = [bodyGeo, headGeo];
  return group;
}

// ---------------------------------------------------------------------------
// HP / Ammo / Morale bar factory
// ---------------------------------------------------------------------------

function makeUnitBars(outlineColor: number, ammoShown: boolean = false): {
  hpBarGroup:  THREE.Group;
  hpBarFg:     THREE.Mesh;
  hpBarBg:     THREE.Mesh;
  ammoBarFg:   THREE.Mesh;
  ammoBarBg:   THREE.Mesh;
  moraleBarFg: THREE.Mesh;
  moraleBarBg: THREE.Mesh;
} {
  const group = new THREE.Group();

  const frameH = (MORALEBAR_Y - 0) + HPBAR_H + BAR_OUTLINE_PAD * 2;
  const frameW = HPBAR_W + BAR_OUTLINE_PAD * 2;
  const frameGeo = new THREE.PlaneGeometry(frameW, frameH);
  const frameMat = new THREE.MeshBasicMaterial({ color: outlineColor, side: THREE.DoubleSide });
  const frame    = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, MORALEBAR_Y * 0.5, BAR_OUTLINE_Z);
  group.add(frame);

  const makeBar = (y: number, fgColor: number): { fg: THREE.Mesh; bg: THREE.Mesh } => {
    const bgGeo = new THREE.PlaneGeometry(HPBAR_W, HPBAR_H);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x1a1410, side: THREE.DoubleSide });
    const bg    = new THREE.Mesh(bgGeo, bgMat);
    bg.position.y = y;
    group.add(bg);

    const fgGeo = new THREE.PlaneGeometry(HPBAR_W, HPBAR_H * 0.75);
    const fgMat = new THREE.MeshBasicMaterial({ color: fgColor, side: THREE.DoubleSide });
    const fg    = new THREE.Mesh(fgGeo, fgMat);
    fg.position.set(0, y, 0.002);
    group.add(fg);
    return { fg, bg };
  };

  const hp     = makeBar(0,           0x30c030);
  const ammo   = makeBar(AMMOBAR_Y,   AMMOBAR_COLOR);
  const morale = makeBar(MORALEBAR_Y, 0x30c030);

  // Ukryj pasek ammo jesli nie dotyczy tej jednostki
  if (!ammoShown) {
    ammo.fg.visible = false;
    ammo.bg.visible = false;
  }

  // Small decorative side-colour pennant on a short mast above the bars.
  // Lives in the SAME billboard group as the bars (frame/hp/ammo/morale), so it
  // inherits their lookAt() billboarding and their disposal path automatically
  // (all 4 unit-spawn call sites already traverse hpBarGroup and register every
  // mesh's geometry/material for disposal) -- no changes needed elsewhere.
  const mastH = 0.22;
  const mastTopY = AMMOBAR_Y + BAR_OUTLINE_PAD + mastH;
  const mastGeo = new THREE.CylinderGeometry(0.006, 0.008, mastH, 5);
  const mastMat = new THREE.MeshBasicMaterial({ color: 0x2a2018 });
  const mast    = new THREE.Mesh(mastGeo, mastMat);
  mast.position.set(0, AMMOBAR_Y + BAR_OUTLINE_PAD + mastH * 0.5, BAR_OUTLINE_Z);
  group.add(mast);

  const flagW = 0.16, flagH = 0.11;
  const flagGeo = new THREE.PlaneGeometry(flagW, flagH);
  const flagMat = new THREE.MeshBasicMaterial({ color: outlineColor, side: THREE.DoubleSide });
  const flag    = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(flagW * 0.5, mastTopY - flagH * 0.5, BAR_OUTLINE_Z);
  group.add(flag);

  return {
    hpBarGroup:  group,
    hpBarFg:     hp.fg,     hpBarBg:     hp.bg,
    ammoBarFg:   ammo.fg,   ammoBarBg:   ammo.bg,
    moraleBarFg: morale.fg, moraleBarBg: morale.bg,
  };
}

// ---------------------------------------------------------------------------
// Project world position to screen pixels
// ---------------------------------------------------------------------------

function worldToScreen(
  worldPos: THREE.Vector3,
  camera:   THREE.PerspectiveCamera,
  canvas:   HTMLCanvasElement,
): { x: number; y: number } | null {
  const v = worldPos.clone().project(camera);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return null;
  return {
    x: ((v.x + 1) / 2) * w,
    y: ((-v.y + 1) / 2) * h,
  };
}

// ---------------------------------------------------------------------------
// Math / colour helpers
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }
function easeIn(t: number): number  { return t * t; }

function lighten(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8)  & 0xff;
  const b =  color        & 0xff;
  const rr = Math.round(r + (255 - r) * amount);
  const gg = Math.round(g + (255 - g) * amount);
  const bb = Math.round(b + (255 - b) * amount);
  return (rr << 16) | (gg << 8) | bb;
}

function blend(a: number, b: number, amount: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr  = Math.round(ar + (br - ar) * amount);
  const gg  = Math.round(ag + (bg - ag) * amount);
  const bbv = Math.round(ab + (bb - ab) * amount);
  return (rr << 16) | (gg << 8) | bbv;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof (el as any).tagName !== 'string') return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function styleButton(btn: HTMLElement, bgColor: string, fgColor: string): void {
  Object.assign(btn.style, {
    padding:       '6px 18px',
    background:    bgColor,
    color:         fgColor,
    border:        '1px solid rgba(255,255,255,0.18)',
    borderRadius:  '4px',
    cursor:        'pointer',
    font:          '14px/1.4 sans-serif',
    letterSpacing: '0.03em',
  });
}

/** Alias for styleButton used in deploy overlay. */
function styleDeployBtn(btn: HTMLElement, bgColor: string, fgColor: string): void {
  styleButton(btn, bgColor, fgColor);
}
