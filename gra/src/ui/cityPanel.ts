/**
 * cityPanel.ts
 * FULL-SCREEN city view (UI task 1, design = Widok-miasta.html mockup, approved by Naster).
 *
 * A fixed full-viewport overlay reproducing the mockup: header (+ city nav + font
 * scale), 3 columns (citizens/buildings | yields/production | garrison/resources/
 * culture), footer, and the "Okolica" hex grid.  Sections the engine can already
 * feed are REAL; the rest are faithful placeholders that light up once the engine
 * exposes their data.
 *
 *   REAL now (no new engine work required):
 *     - header: name / owner / era / population, prev/next-city nav, font scale
 *     - Bilans plonow (Praca/Pieniadz/Nauka/Kultura/Zywnosc, computed like the tick)
 *     - Produkcja: current item + progress + ETA, Usun, queue reorder, Wykup (rush)*
 *     - Kolejka: production queue
 *     - Dostepne do budowy: Buduj / Ulepsz
 *     - Magazyn Zywnosci: net food + store + growth ETA (when granary present)
 *     - Garnizon: real units standing on the city hex (via getUnitsAt hook)*
 *     - Okolica: real hex neighbourhood drawn from the map
 *     (* light up when the matching optional hook is injected)
 *   PLACEHOLDER (until engine exposes them): Magazyny Surowcow, footer nav.
 *   REAL (B2, 2026-06-27): Społeczeństwo — SzPct/PrawPct/PorPct + rozpiska +/-, Zdrowie (+/-).
 *   USUNIĘTE (B2-Q4=C): Specjaliści — poza v0.1.
 *   REAL (decyzja 1A/4A, 2026-06-26): Podzial Handlu (suwaki), Wealth, Kup jednostke.
 *
 * LANE: src/ui/* only.  Imports TYPES and PURE functions from game/* + data/*
 * (read-only); never edits them, never touches main.ts, no THREE.  Public API
 * (showCityPanel / hideCityPanel / isCityPanelOpen) is unchanged & backward
 * compatible.  All engine wiring stays optional via configureCityPanel().
 *
 * Mini-podgląd jednostek: unitMiniPreview.ts (Three.js — buildUnitModel).
 */

import { attachHoverDetail, attachInteractiveDetail, setHoverDetailDocks, disposeHoverDetailDock } from './hoverDetailDock';
import { naukaCostSuffix } from './naukaLabel';
import { scienceOwlIconHtml } from './icons/scienceOwlIcon';
import {
  showCityUxFrame,
  hideCityUxFrame,
  refreshCityUxFrame,
  isCityUxFrameOpen,
} from './cityUxFrame';
import { setMapHudChromeSuppressed } from './hud';
import type { City } from '../game/cities';
import { formatCityMapLabel } from '../game/display-names';
import type { OkolicaFocus, OkolicaTryb, BudowaFocus, BudowaTryb } from '../game/cities';
import { HANDEL_PCT_STEP, normalizePodzialHandlu, snapHandelPct } from '../game/cities';
import type { GameMap } from '../types/map';
import { TerenBazowy, Nakladka } from '../types/hex';
import { loadGameData, getTechDef, type GameData, type BuildingDef, type UnitDef } from '../data/loader';
import {
  buildableProduction,
  eraBuildingCatalog,
  EPOCH_NUMBER_TO_NAME,
  type BuildingCatalogEntry,
  purchasableUnits,
  frontItem,
  enqueue,
  dequeue,
  setPaused,
  buildingProductionItem,
  buildingLevelForEpoch,
  buildingEffectAtLevel,
  buildingWorkCost,
  itemCost,
  splitPraca,
  buildingGoldPurchaseCost,
  buildingTypeQueued,
  enqueueRecruitment,
  dequeueRecruitment,
  unitProductionItem,
  unitNacjaForCivKey,
  type CityProduction,
  type ProductionItem,
  type CivBonusLite,
  type AvailabilityContext,
} from '../game/production';
import {
  upgradeChainSteps,
  upgradeCompositionLines,
  buildingStatSummaryLines,
  cityHasBibliotekaLine,
  cityHasAmfiteatrLine,
} from '../game/building-upgrades';
import { getEmpireFoodSplit, getEmpireFoodMaxCap } from '../game/empire-food';
import type { CityManpowerSnapshot } from '../game/manpower';
import { formatManpower } from '../game/manpower';
import { defaultOwnerColor, mountUnitMiniPreview } from './unitMiniPreview';
import {
  unitInfographicMedallionHtml,
  unitInfographicSvg,
  UNIT_INFOGRAPHIC_CSS,
} from './unitInfographic';
import { buildUnitRecruitCard, UNIT_RECRUIT_CARD_CSS } from './unitRecruitCard';
import { brandIconSvg, buildingIconSvg, unitIconSvg, mapResourceIconSvg, type BrandIconSize } from './icons/brandAssets';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import {
  freshWealthState,
  loadWealthParams,
  wealthCap,
  wealthMnoznik,
  wealthProg,
  wealthRownowaga,
  wealthZadowolenie,
  type RawWealthParamsJson,
  type WealthParams,
} from '../game/wealth';
import {
  buildEconParams,
  cityWorkedTilesForEconomy,
  toEconomyCity,
  computeCityHealthBreakdown,
  readCityFoodBufferFromCity,
  growthFoodThreshold,
  type CityHealthLine,
  type Difficulty,
} from '../game/turn-economy';
import { tileYield } from '../game/economy';
import { normalizeImprovementKey } from '../game/terrain-improvements';
import type { Hex } from '../types/hex';
import { loadOrderParams } from '../game/order';
import {
  evaluateOrderFromBreakdown,
  porPctBand,
  POR_BAND_LABELS,
} from '../game/society-breakdown';
import { stolicaEasyBonusActive } from '../game/society-inputs';
import { cultureHappiness, loadCultureParams, loadReligionParams, FALLBACK_RELIGION_PARAMS } from '../game/culture-religion';
import {
  buildOrderSectionHtml,
  orderTierUi,
  type OrderState,
} from './orderPanel';
import {
  cityYieldPerTurn,
  cityPopulationCap,
  type CityYieldContext,
} from '../game/economy';
import { UI_PARAMS } from './uiParams';
import type { EmpireFoodState, EmpireFoodTick } from '../game/empire-food';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Suwak podzialu Handlu (Skarbiec / Nauka / Spoleczenstwo). Suma = 100. */
export interface PodzialHandluSplit {
  procentPieniadz: number;
  procentNauka: number;
  procentLuksus: number;
}

/** Suwak podzialu Pracy (budynki vs ulepszenia terenu). */
export interface PodzialPracySplit {
  procentBudynki: number;
}

/** A unit garrisoned in the city (supplied by the engine via getUnitsAt). */
export interface GarrisonUnit {
  nazwa: string;
  category?: string;
  health?: number;
  maxHealth?: number;
}

/** Optional hooks the engine may supply so the view reflects real game state. */
export interface CityPanelConfig {
  data?: GameData;
  difficulty?: Difficulty;
  getCities?: () => City[];
  getEpoch?: (ownerId: number) => number;
  getUnlockedTechs?: (ownerId: number) => string[];
  getBuiltBuildingIds?: (cityId: string) => string[];
  getProduction?: (cityId: string) => CityProduction | null;
  setProduction?: (cityId: string, prod: CityProduction) => void;
  getCityBuildingFlags?: (cityId: string) => Partial<CityYieldContext>;
  /** Units standing on the city hex -> real Garnizon panel. */
  getUnitsAt?: (q: number, r: number) => GarrisonUnit[];
  /** Player treasury (gold) -> enables the Wykup (rush-buy) button. */
  getTreasury?: (ownerId: number) => number;
  /**
   * Globalne zasoby imperium (jak HUD mapy) — pasek miasta: baza + dopisek „+X” z tego miasta.
   * Brak hooka → cityPanel sumuje plony miast gracza (prototyp 1 miasto).
   */
  getEmpireHud?: (ownerId: number) => EmpireHudSnap | null;
  /** Engine performs the actual rush-buy spend + completion. */
  onRushBuy?: (cityId: string, item: ProductionItem, koszt: number) => void;
  /** Called after the queue changes so the engine can react (e.g. refresh HUD). */
  onChange?: (cityId: string) => void;
  /** ‹ › między miastami gracza — silnik przełącza widok 3D okolicy + etykietę. */
  onSwitchCity?: (cityId: string) => void;
  /** Zmiana nazwy miasta — silnik wykonuje faktyczną zmianę w modelu. */
  onRename?: (cityId: string, newName: string) => void;
  /** Przełącz zarządcę automatycznego dla miasta. */
  onAutoManage?: (cityId: string) => void;
  /** B1-Q3=A — czy auto-zarządca włączony (podświetlenie ⚙). */
  isAutoManageEnabled?: (cityId: string) => boolean;
  /** Stan kultury miasta -> dynamiczna sekcja Kultura i Religia. */
  getCultureState?: (cityId: string) => {
    kulturaSuma: number;
    przyrost: number;
    borderRadius: number;
    thresholds: number[];
    zrodla?: { nazwa: string; wartosc: number }[];
  } | null;
  /** B4-Q2=A — religia w sekcji z kulturą. */
  getReligionState?: (cityId: string) => {
    dominujaca: string;
    udzialPct: number;
    wplywSzczescie: number;
    /** Nowi wierni szerzeni z tego miasta / ostatnia tura (wyjście). */
    przyrostWiernych?: number;
    zrodla?: { nazwa: string; wartosc: number }[];
  } | null;
  /** B5-Q1=A — suwak split + zapasy państwa (global per owner). */
  getEmpireFoodState?: (ownerId: number) => EmpireFoodState | null;
  /** Mnożnik wzrostu z Porządku (z poprzedniej tury — jak w silniku). */
  getGrowthMult?: (cityId: string) => number;
  /** EKONOMIA — snapshot rekrutów (Manpower) per miasto. */
  getManpowerSnapshot?: (cityId: string) => CityManpowerSnapshot | null;
  getEmpireFoodTick?: (ownerId: number) => EmpireFoodTick | null;
  onEmpireFoodSplitChange?: (ownerId: number, procentRozwoj: number) => void;
  /** Okolica 4C — profile + ręczna korekta. */
  getOkolicaState?: (cityId: string) => {
    focus: OkolicaFocus;
    tryb: OkolicaTryb;
    reczne?: Record<string, number>;
  } | null;
  onOkolicaFocusChange?: (cityId: string, focus: OkolicaFocus) => void;
  onOkolicaEnterManual?: (cityId: string) => void;
  onOkolicaRestoreAuto?: (cityId: string) => void;
  onOkolicaTileAdjust?: (cityId: string, q: number, r: number, delta: number) => void;
  /** Otwórz mapę w trybie ręcznej okolicy (👤 na heksach). */
  onOpenMapForOkolica?: (cityId: string) => void;
  /** Auto-budowa — profile + tryb ręczny. */
  getBudowaState?: (cityId: string) => {
    focus: BudowaFocus;
    tryb: BudowaTryb;
  } | null;
  onBudowaFocusChange?: (cityId: string, focus: BudowaFocus) => void;
  onBudowaEnterManual?: (cityId: string) => void;
  onArtView?: (cityId: string) => void;
  /** Surowce w zasięgu: aktywny dostęp (legacy string[]) lub split ABC-19 { potential, active }. */
  getResourceAccess?: (cityId: string) => string[] | { potential: string[]; active: string[] };
  /**
   * Promień okolicy roboczej (pól obrabianych) wg EKONOMII:
   * cityRangeForPopulation(pop): pop<5 -> 5, pop>=5 -> 10, pop>=10 -> 15.
   * UI rysuje obwódkę zasięgu; pełne terytorium renderuje MAPA (świat).
   */
  getCityWorkedRange?: (cityId: string) => number | undefined;
  /**
   * Pola faktycznie obrabiane (N = populacja) wg EKONOMII (assignWorkedTiles).
   * UI podświetla te pola w kompaktowym podglądzie okolicy.
   */
  getWorkedTiles?: (cityId: string) => { q: number; r: number }[] | undefined;
  /** Biezacy podzial Handlu per miasto (alternatywa dla pola na City). */
  getPodzialHandlu?: (cityId: string) => PodzialHandluSplit | null;
  /** Biezacy podzial Pracy per miasto (opcjonalnie). */
  getPodzialPracy?: (cityId: string) => PodzialPracySplit | null;
  /** Gracz zmienil suwaki Handlu — silnik zapisuje na City i przelicza plony. */
  onPodzialHandluChange?: (cityId: string, split: PodzialHandluSplit) => void;
  /** Gracz zmienil suwak Pracy (opcjonalnie). */
  onPodzialPracyChange?: (cityId: string, split: PodzialPracySplit) => void;
  /** Kup jednostke za Pieniadz ze skarbca (purchasableUnits). */
  onPurchaseUnit?: (cityId: string, itemId: string, koszt: number) => void;
  /** B11-A: anulowanie opłaconej pozycji w kolejce rekrutacji — pełny zwrot kosztu. */
  onCancelRecruitment?: (cityId: string, koszt: number) => void;
  /** Kup budynek za Pieniadz (koszt 1:1 z kosztem Pracy — natychmiastowa budowa). */
  onPurchaseBuilding?: (cityId: string, item: ProductionItem, kosztGold: number) => void;
  /** Bonusy cywilizacji per owner (civs.json) — koszty budynkow/jednostek. */
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[];
  /** typCywilizacji / ikonaId gracza lub AI — filtr jednostek per Nacja. */
  getCivKey?: (ownerId: number) => string | undefined;
  /** Stan porządku/szczęścia per miasto (silnik po turze). Brak → szacunek z budynków. */
  getOrderState?: (cityId: string) => OrderState | null;
  /** Aktualna tura gry (D18-4 bonus stolicy easy). */
  getTurn?: () => number;
  /** Rozklad zdrowia per miasto. Brak → obliczenie lokalne (turn-economy). */
  getCityHealth?: (cityId: string) => { total: number; lines: CityHealthLine[] } | null;
  /** Kolor właściciela (hex) — miniatura 3D jednostek w panelu. */
  getOwnerColor?: (ownerId: number) => number;
  /** Ulepszenia terenu imperium — bramka Popalnia brązu (ABC-13). */
  getPlacedImprovements?: () => ReadonlyMap<string, string | readonly string[]> | null;
  /** Mnoznik kosztow budynkow z kreatora (globalny dla rozgrywki). */
  getBuildingCostPace?: () => import('../game/building-cost-tempo').BuildingCostPace;
  /** Mnoznik kosztow rekrutacji jednostek z kreatora (globalny dla rozgrywki). */
  getKosztJednostekPace?: () => import('../game/unit-cost-tempo').KosztJednostekPace;
  /** Mnoznik progu wzrostu ludnosci z kreatora (globalny dla rozgrywki). */
  getWzrostLudnosciPace?: () => import('../game/population-growth-tempo').WzrostLudnosciPace;
  /** Poziom trudnosci rozgrywki — asymetria kosztow budynkow/jednostek/badan. */
  getDifficulty?: () => import('../game/difficulty-cost').GameDifficulty;
}

let cfg: CityPanelConfig = {};

/** Inject engine hooks.  Merges into any previous config; call once at startup. */
export function configureCityPanel(config: CityPanelConfig): void {
  cfg = { ...cfg, ...config };
}

// ---------------------------------------------------------------------------
// Data + production access (with graceful fallbacks)
// ---------------------------------------------------------------------------

let cachedData: GameData | null = null;
function gameData(): GameData | null {
  if (cfg.data) return cfg.data;
  if (cachedData) return cachedData;
  try { cachedData = loadGameData(); } catch { cachedData = null; }
  return cachedData;
}

const localProd = new Map<string, CityProduction>();
function getProd(cityId: string): CityProduction {
  if (cfg.getProduction) { const p = cfg.getProduction(cityId); if (p) return p; }
  return localProd.get(cityId) ?? { kolejka: [], postep: 0 };
}
function setProd(cityId: string, prod: CityProduction): void {
  if (cfg.setProduction) cfg.setProduction(cityId, prod);
  else localProd.set(cityId, prod);
  cfg.onChange?.(cityId);
}

/** Move a queued item (index>=1) up/down.  Index 0 (in progress) never moves. */
function moveQueueItem(prod: CityProduction, index: number, dir: -1 | 1): CityProduction {
  const j = index + dir;
  if (index < 1 || j < 1 || j >= prod.kolejka.length) {
    return {
      kolejka: [...prod.kolejka],
      postep: prod.postep,
      wstrzymana: prod.wstrzymana,
      rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    };
  }
  const k = [...prod.kolejka];
  const a = k[index] as ProductionItem;
  k[index] = k[j] as ProductionItem;
  k[j] = a;
  return {
    kolejka: k,
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

function copyCityProduction(prod: CityProduction): CityProduction {
  return {
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

/** Przenieś pozycję kolejki (indeks ≥ 1) na inny indeks w tej samej kolejce. */
function reorderQueueItem(prod: CityProduction, fromIndex: number, toIndex: number): CityProduction {
  const len = prod.kolejka.length;
  if (fromIndex < 1 || toIndex < 1 || fromIndex >= len || toIndex >= len || fromIndex === toIndex) {
    return copyCityProduction(prod);
  }
  const k = [...prod.kolejka];
  const [moved] = k.splice(fromIndex, 1);
  if (!moved) return copyCityProduction(prod);
  k.splice(toIndex, 0, moved);
  return {
    kolejka: k,
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

function bindBuildQueueDragReorder(sc: HTMLElement, city: City): void {
  let dragFromIndex: number | null = null;

  const clearDropMarks = (): void => {
    sc.querySelectorAll('.qitem.is-drop-target').forEach(node => node.classList.remove('is-drop-target'));
    sc.querySelectorAll('.qitem.is-dragging').forEach(node => node.classList.remove('is-dragging'));
  };

  sc.querySelectorAll<HTMLElement>('.qitem[data-queue-idx]').forEach(row => {
    row.setAttribute('draggable', 'true');

    row.addEventListener('dragstart', (e) => {
      if ((e.target as HTMLElement).closest('button')) {
        e.preventDefault();
        return;
      }
      const idx = Number(row.dataset.queueIdx);
      if (!Number.isFinite(idx)) return;
      dragFromIndex = idx;
      row.classList.add('is-dragging');
      e.dataTransfer?.setData('text/plain', String(idx));
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.dropEffect = 'move';
      }
    });

    row.addEventListener('dragend', () => {
      dragFromIndex = null;
      clearDropMarks();
    });
  });

  sc.addEventListener('dragover', (e) => {
    if (dragFromIndex === null) return;
    e.preventDefault();
    const row = (e.target as HTMLElement).closest<HTMLElement>('.qitem[data-queue-idx]');
    clearDropMarks();
    if (row) row.classList.add('is-drop-target');
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  });

  sc.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragFromIndex === null) return;
    const row = (e.target as HTMLElement).closest<HTMLElement>('.qitem[data-queue-idx]');
    if (!row) {
      clearDropMarks();
      return;
    }
    const toIndex = Number(row.dataset.queueIdx);
    if (!Number.isFinite(toIndex) || toIndex === dragFromIndex) {
      clearDropMarks();
      return;
    }
    setProd(city.id, reorderQueueItem(getProd(city.id), dragFromIndex, toIndex));
    dragFromIndex = null;
    clearDropMarks();
    rerender();
  });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const CP_EMOJI_DETECT =
  /[\u{1F300}-\u{1FAFF}\u2600-\u27BF✓⚠★⚔⚖👤👥🍞🌾🔥💀😊⏱📈🛕🎭🏛🛠🛡]/u;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) {
    n.innerHTML = (cls?.includes('dc-h') || CP_EMOJI_DETECT.test(html)) ? cpInlineIcons(html) : html;
  }
  return n;
}
function signed(n: number): string { return (n > 0 ? '+' : '') + String(n); }
function tury(n: number): string {
  const a = Math.abs(n), m10 = a % 10, m100 = a % 100;
  if (a === 1) return 'tura';
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'tury';
  return 'tur';
}
function etaTurns(koszt: number, postep: number, praca: number): number | null {
  if (!(praca > 0)) return null;
  return Math.max(1, Math.ceil(Math.max(0, koszt - postep) / praca));
}

/** Font scale (px on the root); module-level so it persists across re-renders. */
const SCALES: ReadonlyArray<{ label: string; px: number }> = UI_PARAMS.panel_miasta.font_scale;
let scalePx = UI_PARAMS.panel_miasta.font_scale_domyslna_px;

/** B: podgląd całej epoki (badania) na dole listy budynków — niezależnie od tech w sandboxie. */
let showEraBuildingPreview = false;
try {
  showEraBuildingPreview = sessionStorage.getItem('civ-bld-era-preview') === '1';
} catch { /* ignore */ }

function setShowEraBuildingPreview(on: boolean): void {
  showEraBuildingPreview = on;
  try {
    sessionStorage.setItem('civ-bld-era-preview', on ? '1' : '0');
  } catch { /* ignore */ }
}

/** Domyslny podzial Handlu (decyzja Maciej 1A: 70/20/10). */
const DEFAULT_PODZIAL_HANDLU: PodzialHandluSplit = {
  procentPieniadz: 70,
  procentNauka: 20,
  procentLuksus: 10,
};

/** Domyslny podzial Pracy (70% budynki). */
const DEFAULT_PODZIAL_PRACY: PodzialPracySplit = { procentBudynki: 70 };

/** Etykieta suwaka handlu karmiącego pulę zamożności (UI — bez „Społ.” / „Wealth”). */
const HANDEL_ZAMOZNOSC_LABEL = 'Zamożność';

/**
 * Tymczasowy placeholder UI — docelowo korupcja z silnika (dystans od stolicy, liczba miast, cap).
 * TODO(produkt): pełny model korupcji — od czego zależy, czy gracz może redukować (budynek, tech, porządek).
 */
const HANDEL_KORUPCJA_PCT_PLACEHOLDER = 5;

interface HandelChipEstimates {
  brutto: number;
  korupcja: number;
  netto: number;
  skarb: number;
  nauka: number;
  zam: number;
}

/** Szacunek strumieni handlu do chipów (netto po korupcji, potem split suwaków). */
function estimateHandelChips(view: CityView | null, split: PodzialHandluSplit): HandelChipEstimates {
  const zero = { brutto: 0, korupcja: 0, netto: 0, skarb: 0, nauka: 0, zam: 0 };
  if (!view) return zero;

  let nettoEst = 0;
  if (split.procentNauka > 0) {
    nettoEst = Math.round(view.nauka * (100 / split.procentNauka));
  } else if (split.procentPieniadz > 0) {
    nettoEst = Math.round(view.pieniadz * (100 / split.procentPieniadz));
  }

  const k = HANDEL_KORUPCJA_PCT_PLACEHOLDER / 100;
  const brutto = k < 1 ? Math.round(nettoEst / (1 - k)) : nettoEst;
  const korupcja = Math.max(0, brutto - nettoEst);
  const netto = Math.max(0, brutto - korupcja);

  return {
    brutto,
    korupcja,
    netto,
    skarb: Math.floor(netto * split.procentPieniadz / 100),
    nauka: Math.floor(netto * split.procentNauka / 100),
    zam: Math.floor(netto * split.procentLuksus / 100),
  };
}

type CityWithSliders = City & {
  podzialHandlu?: PodzialHandluSplit;
  podziałHandlu?: PodzialHandluSplit;
  podzialPracy?: PodzialPracySplit;
  podziałPracy?: PodzialPracySplit;
};

function readPodzialHandlu(city: City, data: GameData | null): PodzialHandluSplit {
  const fromHook = cfg.getPodzialHandlu?.(city.id);
  if (fromHook) return normalizePodzialHandlu(fromHook);
  const ext = city as CityWithSliders;
  const stored = ext.podzialHandlu ?? ext.podziałHandlu;
  if (stored) return normalizePodzialHandlu(stored);
  if (data) {
    const params = buildEconParams(data, cfg.difficulty ?? 'normal');
    return normalizePodzialHandlu({
      procentPieniadz: params.suwaakHandelPieniadz,
      procentNauka: params.suwaakHandelNaukaDefault,
      procentLuksus: params.suwaakHandelLuksus,
    });
  }
  return { ...DEFAULT_PODZIAL_HANDLU };
}

function readPodzialPracy(city: City, data: GameData | null): PodzialPracySplit {
  const fromHook = cfg.getPodzialPracy?.(city.id);
  if (fromHook) return { procentBudynki: snapHandelPct(fromHook.procentBudynki) };
  const ext = city as CityWithSliders;
  const stored = ext.podzialPracy ?? ext.podziałPracy;
  if (stored) return { procentBudynki: snapHandelPct(stored.procentBudynki) };
  if (data) {
    const params = buildEconParams(data, cfg.difficulty ?? 'normal');
    return { procentBudynki: snapHandelPct(params.suwaakPracaBudynki) };
  }
  return { procentBudynki: snapHandelPct(DEFAULT_PODZIAL_PRACY.procentBudynki) };
}


/** Redystrybucja pozostalych dwoch pol tak, by suma = 100 po zmianie jednego (kroki 10%). */
function adjustHandelSplit(
  current: PodzialHandluSplit,
  changed: keyof PodzialHandluSplit,
  newVal: number,
): PodzialHandluSplit {
  const next: PodzialHandluSplit = { ...current };
  next[changed] = snapHandelPct(newVal);
  const keys = (['procentPieniadz', 'procentNauka', 'procentLuksus'] as const)
    .filter(k => k !== changed);
  let remainder = 100 - next[changed];
  if (remainder < 0) {
    next[changed] = 100;
    keys.forEach(k => { next[k] = 0; });
    return next;
  }
  const [k0, k1] = keys;
  if (k0 === undefined || k1 === undefined) return next;
  const sumOthers = current[k0] + current[k1];
  if (sumOthers <= 0) {
    const half = Math.round(remainder / 2 / HANDEL_PCT_STEP) * HANDEL_PCT_STEP;
    next[k0] = half;
    next[k1] = remainder - half;
    return next;
  }
  let v0 = snapHandelPct(remainder * current[k0] / sumOthers);
  if (v0 > remainder) v0 = Math.floor(remainder / HANDEL_PCT_STEP) * HANDEL_PCT_STEP;
  next[k0] = v0;
  next[k1] = remainder - v0;
  return next;
}

// ---------------------------------------------------------------------------
// Yield computation (mirrors turn-economy.advanceCityEconomy per city)
// ---------------------------------------------------------------------------

interface CityView {
  praca: number; pieniadz: number; nauka: number; kultura: number;
  zywnoscNetto: number; maSpichlerz: boolean; maAkwedukt: boolean;
  magazyn: number; progWzrostu: number;
  /** Max ludność bez Akweduktu (parametr gry). */
  popCapBezAkweduktu: number;
  /** Max ludność z Akweduktem (parametr gry, normal=15). */
  popCapZAkweduktem: number;
  /** Aktualny cap dla tego miasta. */
  popCapAktualny: number;
  /** Wzrost zablokowany — ludność ≥ aktualny cap. */
  atPopCap: boolean;
  /** Żywność/turę idąca do bufora wzrostu (po suwaku imperium). */
  zywnoscDoWzrostu: number;
}

/** Snapshot imperium do paska zasobów w widoku miasta (spójny z HudState). */
export interface EmpireHudSnap {
  /** Pula Pracy imperium (zapas — osadnicy, projekty). */
  pracaPool?: number;
  /** Suma Pracy / turę (wszystkie miasta). */
  pracaRate?: number;
  zloto?: number;
  zlotoRate?: number;
  nauka?: number;
  naukaRate?: number;
  zywnoscReserve?: number;
  zywnoscRate?: number;
  kulturaRate?: number;
  /** Suma wiernych religii państwa (imperium). */
  religionStock?: number;
  /** Suma szerzenia wiernych / turę (wszystkie miasta). */
  religionRate?: number;
  stateReligion?: string | null;
  religionSharePct?: number;
}
function isCapital(city: City): boolean {
  const all = cfg.getCities?.();
  if (!all || all.length === 0) return true;
  const first = all.find(c => c.ownerId === city.ownerId);
  return first ? first.id === city.id : true;
}
function computeView(city: City, map: GameMap, data: GameData): CityView | null {
  try {
    const params = buildEconParams(data, cfg.difficulty ?? 'normal');
    const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
    const maSpichlerz = built.includes('spichlerz');
    const maAkwedukt = built.includes('akwedukt');
    const worked = cityWorkedTilesForEconomy(city, map);
    const healthBd = computeCityHealthBreakdown(
      city.population,
      worked,
      built,
      data.societyParams,
      cfg.difficulty ?? 'normal',
      { city, map },
    );
    const zdrowie = healthBd.total;
    const econCity = toEconomyCity(city, params, isCapital(city), zdrowie, { maSpichlerz, maAkwedukt });
    const base: CityYieldContext = {
      wojskoZuzycieZywnosci: 0, strataFraction: 0,
      maMlyn: false, maCegielnia: false, maTargowisko: false, maMennica: false, mennicaMnoznik: 1,
    };
    const ctx: CityYieldContext = { ...base, ...(cfg.getCityBuildingFlags?.(city.id) ?? {}) };
    const y = cityYieldPerTurn(econCity, worked, [], params, ctx);
    const pctRozwoj = getEmpireFoodSplit(city.ownerId);
    const growthMult = cfg.getGrowthMult?.(city.id) ?? 1;
    const healthMod = Math.max(0, 1 + zdrowie * params.zdrowieModyfikatorWspolczynnik);
    const zywnoscDoWzrostu = Math.floor(y.zywnosc * (pctRozwoj / 100) * growthMult * healthMod);
    const magazyn = readCityFoodBufferFromCity(city);
    const wzrostPace = cfg.getWzrostLudnosciPace?.() ?? 'wysoki';
    const popCapBezAkweduktu = params.akweduktProgLudnosci;
    const popCapZAkweduktem = params.akweduktMaxLudnosci;
    const popCapAktualny = cityPopulationCap(maAkwedukt, params);
    const atPopCap = city.population >= popCapAktualny;
    return {
      praca: y.praca, pieniadz: y.pieniadz, nauka: y.nauka, kultura: y.kultura,
      zywnoscNetto: y.zywnosc, maSpichlerz, maAkwedukt,
      magazyn,
      progWzrostu: growthFoodThreshold(
        city.population, params, wzrostPace, city.ownerId, cfg.getDifficulty?.() ?? 'normal',
      ),
      popCapBezAkweduktu,
      popCapZAkweduktem,
      popCapAktualny,
      atPopCap,
      zywnoscDoWzrostu,
    };
  } catch { return null; }
}

function ownerHasSpichlerz(ownerId: number): boolean {
  const cities = cfg.getCities?.() ?? [];
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    const ids = cfg.getBuiltBuildingIds?.(c.id) ?? [];
    if (ids.includes('spichlerz')) return true;
  }
  return false;
}

function cityPracaSplit(city: City, view: CityView, data: GameData | null): {
  total: number;
  doBudynkow: number;
  doUlepszen: number;
  pctBudynki: number;
  pctUlepszenia: number;
} {
  const total = Math.round(view.praca);
  const pctB = readPodzialPracy(city, data).procentBudynki;
  const { doBudynkow, doPuli } = splitPraca(total, pctB / 100);
  return {
    total,
    doBudynkow: Math.round(doBudynkow),
    doUlepszen: Math.round(doPuli),
    pctBudynki: pctB,
    pctUlepszenia: 100 - pctB,
  };
}

/** Podział netto żywności miasta (suwak imperium: wzrost vs armia). */
function cityFoodSplit(view: CityView): { total: number; doWzrostu: number; doArmii: number } {
  const total = Math.round(view.zywnoscNetto);
  const doWzrostu = Math.round(view.zywnoscDoWzrostu);
  return { total, doWzrostu, doArmii: total - doWzrostu };
}

function snapFoodSplitPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Custom drag suwaka wzrost vs armia — pointer events, bez native range. */
function attachFoodSplitBar(
  barWrap: HTMLElement,
  initialPct: number,
  onChange: (pct: number) => void,
  onCommit: () => void,
): void {
  const gBar = barWrap.querySelector('[data-food-bar="wzrost"]') as HTMLElement | null;
  const aBar = barWrap.querySelector('[data-food-bar="armia"]') as HTMLElement | null;
  const handle = el('div', 'food-split-handle');
  barWrap.appendChild(handle);

  let currentPct = snapFoodSplitPct(initialPct);

  const syncVisual = (pct: number) => {
    const u = 100 - pct;
    if (gBar) gBar.style.width = `${pct}%`;
    if (aBar) aBar.style.width = `${u}%`;
    handle.style.left = `${pct}%`;
    barWrap.setAttribute('aria-valuenow', String(pct));
  };
  syncVisual(currentPct);

  barWrap.setAttribute('role', 'slider');
  barWrap.tabIndex = 0;
  barWrap.setAttribute('aria-valuemin', '0');
  barWrap.setAttribute('aria-valuemax', '100');
  barWrap.setAttribute('aria-label', 'Podział żywności: wzrost miast versus armia');

  const pctFromClientX = (clientX: number): number => {
    const rect = barWrap.getBoundingClientRect();
    if (rect.width <= 0) return currentPct;
    return snapFoodSplitPct(((clientX - rect.left) / rect.width) * 100);
  };

  const apply = (pct: number, notify: boolean) => {
    if (pct === currentPct) return;
    currentPct = pct;
    syncVisual(pct);
    if (notify) onChange(pct);
  };

  let dragging = false;

  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    barWrap.classList.remove('food-split-bar--dragging');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    onCommit();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    apply(pctFromClientX(e.clientX), true);
  };

  const onPointerUp = () => finishDrag();

  const startDrag = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    barWrap.classList.add('food-split-bar--dragging');
    barWrap.setPointerCapture(e.pointerId);
    apply(pctFromClientX(e.clientX), true);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  barWrap.addEventListener('pointerdown', startDrag);

  barWrap.addEventListener('keydown', (e) => {
    let next = currentPct;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = snapFoodSplitPct(currentPct - 1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = snapFoodSplitPct(currentPct + 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 100;
    else return;
    e.preventDefault();
    apply(next, true);
    onCommit();
  });
}

function resolveEmpireSnap(city: City, map: GameMap | null, data: GameData | null): EmpireHudSnap {
  const fromEngine = cfg.getEmpireHud?.(city.ownerId);
  if (fromEngine) return fromEngine;
  if (!map || !data) {
    return { zloto: cfg.getTreasury?.(city.ownerId) };
  }
  const peers = (cfg.getCities?.() ?? []).filter(c => c.ownerId === city.ownerId);
  let pracaRate = 0;
  let zlotoRate = 0;
  let naukaRate = 0;
  let kulturaRate = 0;
  let zywnoscRate = 0;
  for (const c of peers) {
    const v = computeView(c, map, data);
    if (!v) continue;
    pracaRate += v.praca;
    zlotoRate += v.pieniadz;
    naukaRate += v.nauka;
    kulturaRate += v.kultura;
    zywnoscRate += v.zywnoscNetto;
  }
  const foodSt = cfg.getEmpireFoodState?.(city.ownerId);
  const foodTick = cfg.getEmpireFoodTick?.(city.ownerId);
  return {
    pracaRate,
    zloto: cfg.getTreasury?.(city.ownerId),
    zlotoRate,
    naukaRate,
    zywnoscReserve: foodSt?.zapasyPanstwa,
    zywnoscRate: foodTick != null ? foodTick.zapasyPo - foodTick.zapasyPrzed : zywnoscRate,
    kulturaRate,
  };
}

function fmtResDelta(n: number): { html: string; cls: string } {
  if (n === 0) return { html: '', cls: '' };
  const cls = n > 0 ? 'green' : 'red';
  const html = n > 0 ? `+${n}` : String(n);
  return { html, cls };
}

function resInteractiveAttrs(statId: string, hint: string, rail = false): { cls: string; attrs: string } {
  const railCls = rail ? ' civ-v-res-rail-item' : '';
  return {
    cls: `civ-v-res-item${railCls} civ-v-res-interactive`,
    attrs: ` data-res-stat="${statId}" tabindex="0" role="button" aria-label="${hint.replace(/"/g, '&quot;')}"`,
  };
}

/** Kromka chleba — game-icons.net/delapouite/bread-slice (CC BY 3.0) */
const LOAF_SVG =
  '<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">' +
  '<path d="M233.2 25.36c-57-.02-109.1.58-119.7 2.23C61.74 35.66 35.44 154.9 80.21 155.9c-20.75 110.9-24.36 222.6-17.9 332.9 105.49 6.7 281.39 13.4 386.89 2.2 3.5-107.7 4.3-217.4-30.8-328.5 53.3-9.6 20.4-131.04-18.8-134.9-11.8-1.16-93.2-2.22-166.4-2.24zM126.6 57.8c1.5-.09 3.2.56 4.7 2.21 6.1 6.68 5.3 23.36 0 24.89-3.4.93-10.8-6.89-12.1-13.01-1.4-6.86 2.7-13.82 7.4-14.09zm201.5 31.11c5.7.25 11.9 12.69 10.3 19.89-1.3 5.3-8.7 8.4-12.1 5.3-5.3-4.9-6.1-22.06 0-24.86.6-.25 1.2-.36 1.8-.33zm83.2 35.99c3.8 0 5 6 1.8 10.7-5.3 7.7-20.9 15.6-22.1 10.1-1.2-5.4 12.8-19.4 19.5-20.7.3-.1.5-.1.8-.1zm-252.5 15.3c.8 0 1.5.1 2.3.4 7.6 2.9 15.2 17.4 9.5 21-5.7 3.5-19.5-6.8-20.7-13.9-.5-3.7 3.8-7.3 8.2-7.5h.7zm76.6 54.8c.5 0 1 .1 1.4.3 6.1 2.8 5.3 20 0 24.9-3.4 3.1-10.8 0-12.1-5.3-1.6-7.2 4.6-19.7 10.3-19.9h.4zm136.9 9.4c.5 0 1 .1 1.5.4 5.2 3.5 4.5 25.2 0 31.4-2.8 3.9-9.1 0-10.1-6.7-1.5-9.2 3.8-24.8 8.6-25.1zm-196.7 51.5c.4 0 .9.1 1.3.3 6.1 2.8 5.3 20 0 24.9-3.4 3.1-10.8 0-12.1-5.3-1.6-7.2 4.6-19.7 10.3-19.9h.5zm227.1 28.9c6.5.1 15.6 12.5 14.8 19.3-.6 4.5-8.3 6.9-12.7 3.7-6.5-4.9-9.8-20.9-3.4-22.8.4-.1.8-.2 1.3-.2zm-103.9 9.9c7.3.1 17.6 9.2 17.7 15.2 0 4.3-8.2 8-13.5 5.8-8-3.3-13.9-17.6-7.1-20.5.9-.4 1.9-.5 2.9-.5zm-166.3 46c2.4-.1 4.4.3 5.5 1.2 4.1 3.6-10.2 13.5-19.4 14.5-6.1.5-11-4-8.1-7.5 3.3-3.9 14.7-8 22-8.2zm149.7 49.2c4.4.3 9.2 14.5 7.9 22.8-1 6-6.6 9.6-9.2 6-4-5.6-4.6-25.2 0-28.4.4-.3.9-.4 1.3-.4zm-173.9 44.3c1.5 0 2.9.4 3.8 1.6 4 5.4-5 20.1-12 21.9-4.43 1.1-9.45-5.2-8.05-10.5 1.77-6.2 10.55-12.9 16.25-13zm316.2 5.6h.6c5.4 0 4.5 16.9-.6 24.9-3.4 5.2-10.8 6.8-12.1 2.3-1.8-6.9 6-26.1 12.1-27.2z"/>' +
  '</svg>';

function loafIconHtml(extraClass = ''): string {
  const cls = extraClass ? `civ-v-loaf-ic ${extraClass}` : 'civ-v-loaf-ic';
  return `<span class="${cls}">${LOAF_SVG}</span>`;
}

function resGlobalLocal(
  icon: string,
  mainVal: string,
  cityDelta: number,
  mainCls: string,
  hint: string,
  statId?: string,
  rail = false,
): string {
  const d = fmtResDelta(Math.round(cityDelta));
  const ia = statId ? resInteractiveAttrs(statId, hint, rail) : { cls: rail ? 'civ-v-res-item civ-v-res-rail-item' : 'civ-v-res-item', attrs: '' };
  return `<span class="${ia.cls}"${ia.attrs} title="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-res-icon">${icon}</span>` +
    `<span class="civ-v-res-val ${mainCls}">${mainVal}</span>` +
    (d.html ? `<span class="civ-v-res-delta ${d.cls}">${d.html}</span>` : '') +
    `</span>`;
}

/** Górny pasek: pula pracy + dwa dopiski (budynki / ulepszenia). */
function resPracaSplitBar(
  mainVal: string,
  doBudynkow: number,
  doUlepszen: number,
  hint: string,
  statId?: string,
  rail = false,
): string {
  const b = fmtResDelta(doBudynkow);
  const u = fmtResDelta(doUlepszen);
  const ia = statId ? resInteractiveAttrs(statId, hint, rail) : { cls: rail ? 'civ-v-res-item civ-v-res-rail-item' : 'civ-v-res-item', attrs: '' };
  const deltaWrap = rail ? 'civ-v-res-rail-deltas' : 'civ-v-res-inline-deltas';
  return `<span class="${ia.cls}"${ia.attrs} title="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-res-icon">${cityPanelChipIcon('res-work', 20)}</span>` +
    `<span class="civ-v-res-val gold">${mainVal}</span>` +
    `<span class="${deltaWrap}">` +
    `<span class="civ-v-res-delta ${b.cls}" title="Budynki">${b.html}</span>` +
    `<span class="civ-v-res-delta blue" title="Ulepszenia">${u.html}</span>` +
    `</span></span>`;
}

function resLocalOnly(icon: string, val: string, cls: string, hint: string, statId?: string, rail = false): string {
  const ia = statId ? resInteractiveAttrs(statId, hint, rail) : { cls: rail ? 'civ-v-res-item civ-v-res-rail-item' : 'civ-v-res-item', attrs: '' };
  return `<span class="${ia.cls}"${ia.attrs} title="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-res-icon">${icon}</span>` +
    `<span class="civ-v-res-val ${cls}">${val}</span></span>`;
}

// ---------------------------------------------------------------------------
// Scoped styles (injected once, namespaced under .civ-cs so the game is safe)
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-city-screen-css-w3';

/** Rozmiar samej ikonki (emoji/SVG) na pasku zakładek — w em względem font-size mountu. */
const CITY_PANEL_ICON_GLYPH_EM = 4.5;
/** Pionowy słupek zakładek — ~50% rozmiaru bazowego. */
const CITY_PANEL_ICON_RAIL_VERT_EM = CITY_PANEL_ICON_GLYPH_EM * 0.5;
/** Ile wierszy list (budynki, jednostki) widocznych bez przewijania — reszta w scrollu. */
const LIST_SCROLL_VISIBLE = 3;
/** Kolejka rekrutacji w panelu Produkcja (lewa kolumna). */
const RECRUIT_QUEUE_VISIBLE = 7;
/** Kolejka budowy (pozycje po bieżącym projekcie) — max widocznych wierszy. */
const BUILD_QUEUE_VISIBLE = 4;
/** Panel Buduj / Rekrutacja — więcej pozycji na ekranie. */
const LIST_SCROLL_VISIBLE_CATALOG = 8;
const LIST_ROW_HEIGHT_EM = 2.75;

type CityDrawerTab = 'plony' | 'produkcja' | 'miasto' | 'okolica';

const CITY_TABS: { id: CityDrawerTab; short: string }[] = [
  { id: 'plony', short: 'Plony' },
  { id: 'produkcja', short: 'Produkcja' },
  { id: 'miasto', short: 'Miasto' },
  { id: 'okolica', short: 'Okolica' },
];

const CITY_TAB_BRAND_ICONS: Record<CityDrawerTab, string> = {
  plony: 'cp-granary',
  produkcja: 'cp-labor',
  miasto: 'cp-order',
  okolica: 'res-settlements',
};

let activeDrawerTab: CityDrawerTab = 'plony';

function cityPanelBrandIcon(id: string, size: BrandIconSize = 24, cls = 'civ-cs-ic'): string {
  const svg = brandIconSvg(id, size);
  if (!svg) return '';
  return svg.replace('<svg ', `<svg class="${cls}" `);
}

/** Ikona chip/pasek w panelu miasta — brand-book 1E (bez emoji). */
function cityPanelChipIcon(id: string, size: BrandIconSize = 18): string {
  return cityPanelBrandIcon(id, size, 'civ-cs-chip-ic');
}

function cityPanelChipIconWrap(id: string, size: BrandIconSize = 18): string {
  const ic = cityPanelChipIcon(id, size);
  return ic ? `<span class="civ-cs-chip-ic-wrap">${ic}</span>` : '';
}

/** Emoji → brand SVG wraps in detail cards, notes, formulas (C1b). */
const CP_INLINE_EMOJI_BRAND: Record<string, string> = {
  '🔨': 'res-work',
  '💰': 'res-treasury',
  '🎭': 'res-culture',
  '🛕': 'res-religion',
  '👥': 'res-population',
  '👤': 'chip-manpower',
  '⚔': 'tb-army',
  '🏛': 'cp-buildings',
  '🛠': 'tb-build',
  '📈': 'cp-trade',
  '😊': 'chip-happiness',
  '⏱': 'chip-map',
  '🌾': 'chip-grain',
  '✓': 'chip-star',
  '⚠': 'chip-warning',
  '🔥': 'chip-rebellion',
  '💀': 'chip-death',
  '⚖': 'cp-order',
  '★': 'chip-star',
  '🔒': 'ui-lock',
  '🛡': 'chip-garrison',
};

function cpInlineIcons(text: string): string {
  if (!text || (!CP_EMOJI_DETECT.test(text) && !text.includes('🍞'))) return text;
  let out = text;
  out = out.replace(/🍞/g, `<span class="civ-cs-inline-loaf">${loafIconHtml('civ-v-loaf-chip')}</span>`);
  for (const [emoji, brandId] of Object.entries(CP_INLINE_EMOJI_BRAND)) {
    const wrap = cityPanelChipIconWrap(brandId, 14);
    if (wrap) out = out.split(emoji).join(wrap);
  }
  return out;
}

function setNoteHtml(note: HTMLElement, html: string): void {
  note.style.fontStyle = 'normal';
  note.innerHTML = cpInlineIcons(html);
}

function statChipBrand(iconId: string, label: string, value: string, cls: string): string {
  const ic = cityPanelChipIconWrap(iconId);
  const head = ic ? `${ic}<span>${label}</span>` : label;
  return `<span class="chip"><span class="cl">${head}</span><span class="cv ${cls}">${value}</span></span>`;
}

/** Chipy bilansu plonów (W4 / B-02) — zawsze SVG brand, bez emoji. */
function plonyChipRowHtml(view: CityView): string {
  const foodCls = view.zywnoscNetto > 0 ? 'green' : view.zywnoscNetto < 0 ? 'red' : 'gold';
  return (
    statChipBrand('res-food', 'Żyw.', signed(view.zywnoscNetto), foodCls) +
    statChipBrand('res-work', 'Praca', signed(view.praca), 'gold') +
    statChipBrand('res-treasury', 'Pieniądz', signed(view.pieniadz), 'blue') +
    statChipBrand('res-science', 'Nauka', signed(view.nauka), 'blue') +
    statChipBrand('res-culture', 'Kult.', signed(view.kultura), 'gold')
  );
}

function pracaSplitBarLabelHtml(pctB: number, pctU: number, budAmt?: number, uleAmt?: number): string {
  const bPart = budAmt != null ? ` +${budAmt}` : '';
  const uPart = uleAmt != null ? ` +${uleAmt}` : '';
  return (
    `${pctB}% ${cityPanelChipIconWrap('cp-buildings', 14)}${bPart}` +
    ` · ${pctU}% ${cityPanelChipIconWrap('tb-build', 14)}${uPart}`
  );
}

function psiRowLabel(iconId: string, text: string): string {
  return `${cityPanelChipIconWrap(iconId, 16)}<span>${text}</span>`;
}

function cityTabIconHtml(tab: CityDrawerTab): string {
  const ic = cityPanelBrandIcon(CITY_TAB_BRAND_ICONS[tab], 24, 'civ-cs-tab-ic');
  return ic ? `<span class="civ-cs-tab-ic-wrap">${ic}</span>` : '';
}

const OKOLICA_FOCUS_BRAND: Record<OkolicaFocus, string> = {
  zywnosc: 'field-food',
  produkcja: 'field-production',
  podatki: 'field-tax',
  zrownowazone: 'field-balanced',
};

const OKOLICA_FOCUS_SHORT: Record<OkolicaFocus, string> = {
  zywnosc: 'Żyw.',
  produkcja: 'Prod.',
  podatki: 'Podat.',
  zrownowazone: 'Zrówn.',
};

const BUDOWA_FOCUS_BRAND: Record<BudowaFocus, string> = {
  wzrost: 'field-food',
  wojsko: 'tb-army',
  kultura: 'res-culture',
  prawo: 'cp-order',
  produkcja: 'res-work',
  zrownowazone: 'field-balanced',
};

const BUDOWA_FOCUS_SHORT: Record<BudowaFocus, string> = {
  wzrost: 'Wzrost',
  wojsko: 'Wojsko',
  kultura: 'Kultura',
  prawo: 'Prawo',
  produkcja: 'Prod.',
  zrownowazone: 'Zrówn.',
};

const BUDOWA_FOCUS_TITLE: Record<BudowaFocus, string> = {
  wzrost: 'Wzrost — żywność i zdrowie',
  wojsko: 'Wojsko — koszary, obrona',
  kultura: 'Kultura — pomniki i kultura',
  prawo: 'Prawo — administracja i porządek',
  produkcja: 'Produkcja — Praca i warsztaty',
  zrownowazone: 'Zrównoważony rozwój',
};

function okolicaProfileIconHtml(iconId: string, size: BrandIconSize = 24): string {
  return cityPanelBrandIcon(iconId, size, 'okolica-profile-ic');
}

function setOkolicaProfileButtonContent(btn: HTMLButtonElement, iconId: string, label: string): void {
  btn.classList.add('okolica-profile-btn');
  const ic = okolicaProfileIconHtml(iconId, 24);
  btn.innerHTML = ic
    ? `<span class="okolica-profile-glyph">${ic}</span><span class="okolica-profile-lbl">${label}</span>`
    : label;
}

function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-city-screen-css-v2')?.remove();
  const css = `
.civ-cs{position:fixed;inset:0;z-index:400;display:flex;pointer-events:none;
  ${CIV_BRAND_SCOPE_VARS}
  --bg:var(--civ-bg-deep);--panel:var(--civ-panel-bg);--panel2:#121820;
  --border:var(--civ-gold-border);--bord2:var(--civ-gold-border-strong);
  --text:var(--civ-text-primary);--muted:var(--civ-text-muted);
  --gold:var(--civ-gold-primary);--green:var(--civ-success);--red:var(--civ-danger);
  --blue:var(--civ-science);--happy:var(--civ-gold-primary);
  font-family:var(--civ-font-ui);font-size:16px;}
.civ-cs *{box-sizing:border-box;}
.civ-cs-backdrop{flex:1 1 55%;min-width:0;background:rgba(8,10,18,0.58);pointer-events:auto;cursor:default;}
.civ-cs-drawer{flex:0 0 45%;width:45%;max-width:720px;min-width:300px;height:100%;pointer-events:auto;
  background:linear-gradient(180deg,rgba(26,32,44,0.98) 0%,var(--bg) 14%);color:var(--text);
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:-16px 0 48px rgba(0,0,0,0.65);border-left:1px solid var(--civ-gold-border-strong);
  animation:civ-cs-slide 0.24s ease-out;}
@keyframes civ-cs-slide{from{transform:translateX(100%);opacity:0.85}to{transform:translateX(0);opacity:1}}
.civ-cs-drawer-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:0.45em 0.55em 0.6em;}
.civ-cs-tab-panel{display:flex;flex-direction:column;gap:0.42em;}
.civ-cs-tabs{display:flex;gap:0.15em;padding:0.28em 0.45em 0;border-bottom:1px solid var(--border);background:rgba(0,0,0,0.22);flex-shrink:0;}
.civ-cs-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  border:none;background:transparent;color:var(--muted);font-size:0.68em;font-weight:600;
  padding:0.38em 0.2em 0.32em;cursor:pointer;border-radius:var(--civ-radius-btn) var(--civ-radius-btn) 0 0;font-family:inherit;}
.civ-cs-tab-inner{display:flex;flex-direction:column;align-items:center;gap:0.15em;pointer-events:none;}
.civ-cs-tab-ic-wrap{display:inline-flex;align-items:center;justify-content:center;line-height:0;}
.civ-cs-tab-ic svg{width:22px;height:22px;color:var(--civ-gold-dim);opacity:0.88;}
.civ-cs-tab.on .civ-cs-tab-ic svg{color:var(--civ-gold-primary);opacity:1;}
.civ-cs-tab-lbl{line-height:1.1;letter-spacing:0.02em;white-space:nowrap;}
.civ-cs-tab:hover{color:var(--text);background:rgba(232,216,138,0.04);}
.civ-cs-tab.on{color:var(--gold);background:rgba(232,216,138,0.06);box-shadow:inset 0 -2px 0 var(--gold);}
.civ-cs .hdr-ic{display:inline-flex;align-items:center;line-height:0;vertical-align:middle;}
.civ-cs .hdr-ic svg{color:var(--civ-gold-primary);}
.civ-cs .mbadge .hdr-ic svg{width:0.95em;height:0.95em;color:var(--civ-gold-dim);}
.civ-cs .hbtn .hdr-ic svg{width:1.05em;height:1.05em;color:var(--civ-text-primary);}
.civ-cs .closeb .hdr-ic svg{width:1.1em;height:1.1em;color:#fff8f0;}
.civ-cs .panel{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:0.38em 0.52em;box-shadow:0 1px 0 rgba(255,255,255,0.03);}
.civ-cs .panel-tight{padding:0.28em 0.45em;}
.civ-cs .ptitle{font-size:0.82em;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);
  border-bottom:1px solid rgba(232,216,138,0.2);padding:0.72em 0.85em 0.58em;margin:0 0 0.38em;
  background:linear-gradient(90deg,rgba(232,216,138,0.1),transparent);
  display:flex;justify-content:space-between;align-items:center;}
.civ-w4-panel-detail{font-size:0.56em;letter-spacing:0.14em;text-transform:uppercase;color:#a08030;font-weight:600;}
.civ-cs .subhd{font-size:0.72em;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin:0.35em 0 0.2em;}
.civ-cs .chip-row{display:flex;flex-wrap:wrap;gap:0.28em;align-items:center;}
.civ-cs .handel-chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.32em;max-width:100%;margin-bottom:0.32em;}
.civ-cs .handel-chip-grid .chip{display:flex;flex-direction:column;align-items:flex-start;gap:0.1em;padding:0.48em 0.58em;min-width:0;width:100%;box-sizing:border-box;border-radius:8px;border:1px solid rgba(232,216,138,0.18);background:rgba(255,255,255,0.02);}
.civ-cs .handel-chip-grid .chip .cl{font-size:0.72em;color:#8a8070;letter-spacing:.02em;}
.civ-cs .handel-chip-grid .chip .cv{font-size:0.82em;margin-top:0.04em;}
.civ-cs .handel-chip-grid .handel-card-skarb{border-color:rgba(232,216,138,0.18);}
.civ-cs .handel-chip-grid .handel-card-nauka{border-color:rgba(90,155,212,0.25);background:rgba(90,155,212,0.04);}
.civ-cs .handel-chip-grid .handel-card-zam{border-color:rgba(232,216,138,0.18);}
.civ-cs .handel-korupcja-chip{border-style:dashed;opacity:0.92;background:rgba(200,64,64,0.04)!important;border-color:rgba(200,64,64,0.25)!important;}
.civ-cs .handel-w4-sliders{display:flex;flex-direction:column;gap:0.38em;max-width:100%;margin-top:0.12em;}
.civ-cs .handel-w4-sliders .slider-row{margin-bottom:0;}
.civ-cs .handel-w4-sliders .slider-row label{font-size:0.74em;margin-bottom:0.08em;}
.civ-cs .handel-w4-sliders input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:5px;background:rgba(255,255,255,0.08);outline:none;}
.civ-cs .handel-w4-sliders input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f4e6a8,#a9861f);border:1px solid #6a5212;cursor:pointer;margin-top:0;}
.civ-cs .handel-w4-sliders input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f4e6a8,#a9861f);border:1px solid #6a5212;cursor:pointer;}
.civ-cs .handel-w4-sliders .slider-nauka input[type=range]::-webkit-slider-thumb{background:radial-gradient(circle at 40% 35%,#8fb6e0,#3a5f8a);border-color:#26456a;}
.civ-cs .handel-w4-sliders .slider-nauka input[type=range]::-moz-range-thumb{background:radial-gradient(circle at 40% 35%,#8fb6e0,#3a5f8a);border-color:#26456a;}
.civ-handel-wealth-host{margin-top:0.55em;padding-top:0.42em;border-top:1px solid rgba(212,175,90,0.22);padding-bottom:0.2em;}
.civ-handel-sliders-host{padding-bottom:0.18em;}
.civ-handel-tab-hint{font-size:0.68em;line-height:1.45;color:#8a8070;margin:0 0 0.42em;letter-spacing:.02em;}
.civ-tab-indicators{gap:0.28em!important;margin:0.28em 0 0.38em!important;flex-wrap:wrap;}
.civ-tab-indicators .chip{font-size:0.72em;padding:0.24em 0.55em;border-radius:7px;border-color:rgba(232,216,138,0.25);}
.civ-tab-indicators .cl{font-size:0.92em;color:#c8b898;}
.civ-tab-indicators .cv{font-size:1em;font-weight:700;}
.civ-cs .chip{display:inline-flex;align-items:center;gap:0.32em;background:rgba(255,255,255,0.02);border:1px solid rgba(232,216,138,0.25);border-radius:7px;padding:0.28em 0.58em;font-size:0.74em;line-height:1.25;white-space:nowrap;}
.civ-cs .chip .cl{color:#c8b898;font-size:0.92em;}
.civ-cs .chip .cv{font-weight:700;}
.civ-cs .sliders-compact{display:flex;flex-wrap:wrap;gap:0.2em 0.55em;max-width:28em;}
.civ-cs .sliders-compact .slider-row{flex:1 1 8.5em;margin-bottom:0;min-width:7.5em;}
.civ-cs .col{display:flex;flex-direction:column;gap:0.32em;align-items:stretch;}
.civ-cs #cs-center{align-items:flex-start;}
.civ-cs #cs-center .panel{width:100%;max-width:100%;}
.civ-cs .muted{color:var(--muted);} .civ-cs .gold{color:var(--gold);} .civ-cs .green{color:var(--green);}
.civ-cs .red{color:var(--red);} .civ-cs .blue{color:var(--blue);} .civ-cs .happy{color:var(--happy);} .civ-cs .val{font-weight:600;}
.civ-cs .rsb{display:flex;justify-content:space-between;align-items:center;gap:0.3em;}
.civ-cs .row{display:flex;align-items:center;gap:0.35em;}
.civ-cs .btn{display:inline-flex;align-items:center;gap:0.2em;background:linear-gradient(180deg,#3a4150,#2a3040);
  border:1px solid var(--bord2);border-radius:3px;color:var(--text);font-size:0.82em;padding:0.18em 0.6em;cursor:pointer;font-family:inherit;}
.civ-cs .btn:hover{background:linear-gradient(180deg,#4a5160,#3a4050);}
.civ-cs .btn:disabled{opacity:0.4;cursor:not-allowed;}
.civ-cs .btn-g{background:linear-gradient(180deg,rgba(232,216,138,0.38),rgba(140,100,32,0.92));
  border:1px solid var(--civ-gold-border-strong);color:#fff8e8;font-weight:700;border-radius:var(--civ-radius-btn);}
.civ-cs .btn-g:hover{filter:brightness(1.08);}
.civ-cs .btn-b{background:linear-gradient(180deg,#2a5080,#1a3860);border-color:#5080c0;color:#e8f4ff;font-weight:700;}
.civ-cs .btn-b:hover{background:linear-gradient(180deg,#356090,#244870);}
.civ-cs .btn-sm{padding:0.1em 0.45em;font-size:0.78em;}
.civ-cs .fsbtn{background:linear-gradient(180deg,#2a3040,#1e2530);border:1px solid var(--bord2);border-radius:3px;
  color:var(--muted);font-size:0.74em;padding:0.12em 0.5em;cursor:pointer;font-family:inherit;}
.civ-cs .fsbtn.active{color:var(--gold);border-color:var(--gold);font-weight:700;}
.civ-cs .hbtn{background:rgba(232,216,138,0.08);border:1px solid var(--civ-gold-border);color:var(--text);
  font-size:0.8em;padding:4px 8px;border-radius:var(--civ-radius-btn);cursor:pointer;font-family:inherit;
  display:inline-flex;align-items:center;justify-content:center;min-width:1.75em;min-height:1.75em;}
.civ-cs .hbtn:hover{background:rgba(232,216,138,0.16);border-color:var(--civ-gold-border-strong);}
.civ-cs .bwrap{background:#111518;border:1px solid var(--border);border-radius:2px;height:0.7em;overflow:hidden;}
.civ-cs .bfill{height:100%;border-radius:2px;}
.civ-cs #hdr{background:linear-gradient(180deg,rgba(28,34,46,0.98),rgba(14,18,26,0.98));border-bottom:1px solid var(--border);
  padding:0.4em 0.65em;display:flex;align-items:center;gap:0.4em;flex-wrap:wrap;flex-shrink:0;}
.civ-cs #cname{font-size:1.15em;font-weight:700;color:var(--gold);letter-spacing:.02em;font-family:var(--civ-font-title);}
.civ-cs .nav-arr{background:rgba(232,216,138,0.06);border:1px solid var(--bord2);color:var(--gold);font-size:0.95em;
  padding:0 0.4em;height:1.65em;cursor:pointer;border-radius:var(--civ-radius-btn);}
.civ-cs .nav-arr:disabled{opacity:0.35;cursor:not-allowed;}
.civ-cs .mbadge{background:var(--panel2);border:1px solid var(--border);border-radius:var(--civ-radius-btn);
  padding:0.1em 0.45em;font-size:0.76em;display:inline-flex;align-items:center;gap:0.25em;}
.civ-cs .era-b{background:linear-gradient(90deg,rgba(80,56,16,0.85),rgba(120,88,32,0.85),rgba(80,56,16,0.85));
  border:1px solid var(--gold);color:var(--gold);font-size:0.76em;font-weight:700;padding:0.12em 0.6em;border-radius:10px;}
.civ-cs #hdr-r{margin-left:auto;display:flex;align-items:center;gap:0.4em;}
.civ-cs .closeb{background:linear-gradient(180deg,#a83828,#6a1810);border:1px solid rgba(208,80,64,0.75);color:#fff;
  font-weight:700;border-radius:var(--civ-radius-btn);padding:0.12em 0.55em;cursor:pointer;font-size:1em;font-family:inherit;
  display:inline-flex;align-items:center;justify-content:center;}
.civ-cs #body{display:grid;grid-template-columns:14em minmax(0,1fr) 15em;gap:0.4em;padding:0.4em;align-items:start;}
.civ-cs .bld,.civ-cs .spec,.civ-cs .unit,.civ-cs .res{display:flex;align-items:center;gap:0.35em;background:var(--panel2);
  border:1px solid var(--border);border-radius:3px;padding:0.2em 0.42em;margin-bottom:0.18em;}
.civ-cs .bi{font-size:0.95em;width:1.3em;text-align:center;} .civ-cs .bn{flex:1;font-size:0.84em;}
.civ-cs .bld-upg{flex:0 0 auto;margin-left:auto;padding:0 0.35em;background:transparent;border:none;color:var(--gold);cursor:pointer;font-size:0.95em;line-height:1;}
.civ-cs .bld-upg:hover{color:#fff;}
.civ-cs .be{font-size:0.74em;color:var(--green);} .civ-cs .bm{font-size:0.74em;color:var(--red);margin-left:auto;}
.civ-cs .ybox{background:var(--panel2);border:1px solid var(--border);border-radius:3px;padding:0.4em 0.5em;}
.civ-cs .yn{font-size:0.74em;color:var(--muted);} .civ-cs .yv{font-size:1.4em;font-weight:700;line-height:1.1;}
.civ-cs .fbout{background:#111518;border:1px solid var(--border);border-radius:2px;height:1.15em;overflow:hidden;position:relative;}
.civ-cs .fbfil{height:100%;background:linear-gradient(90deg,#1e5a1e,#3a8a2a);}
.civ-cs .fbtxt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:0.74em;font-weight:700;white-space:nowrap;text-shadow:0 0 4px #000,0 1px 2px #000;}
.civ-cs .food-grow-block{margin:0.12em 0 0.32em;}
.civ-cs .food-grow-block.hover-detail-anchor{cursor:help;}
.civ-cs .food-grow-track{background:linear-gradient(180deg,#14100c,#0a0908);border:1px solid #4a3828;border-radius:4px;height:1.35em;position:relative;overflow:hidden;}
.civ-cs .food-grow-fill{height:100%;background:linear-gradient(180deg,#f0d878,#c89830 45%,#8a6018);border-radius:3px 0 0 3px;transition:width .15s ease;min-width:0;}
.civ-cs .food-grow-loaf{position:absolute;right:0.22em;top:50%;transform:translateY(-50%);font-size:0.9em;opacity:0.92;pointer-events:none;z-index:1;}
.civ-cs .food-stat-pair{display:flex;justify-content:space-between;gap:0.5em;margin-top:0.32em;}
.civ-cs .food-stat{display:flex;flex-direction:column;gap:0.06em;min-width:0;}
.civ-cs .food-stat-lbl{font-size:0.68em;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.civ-cs .food-stat-val{font-size:0.92em;font-weight:700;line-height:1.15;}
.civ-cs .food-split-wrap{margin-top:0.28em;}
.civ-cs .food-split-bar{display:flex;height:1.35em;background:#111518;border:1px solid var(--border);border-radius:4px;overflow:hidden;position:relative;touch-action:none;}
.civ-cs .food-split-bar--interactive{overflow:visible;cursor:ew-resize;}
.civ-cs .food-split-bar--interactive .food-split-g,.civ-cs .food-split-bar--interactive .food-split-a{border-radius:0;}
.civ-cs .food-split-g,.civ-cs .food-split-a{height:100%;min-width:0;flex-shrink:0;transition:width .12s ease;pointer-events:none;}
.civ-cs .food-split-bar--dragging .food-split-g,.civ-cs .food-split-bar--dragging .food-split-a{transition:none;}
.civ-cs .food-split-bar--ro{cursor:default;}
.civ-cs .food-split-g{background:linear-gradient(180deg,#f0d878,#c89830 45%,#8a6018);}
.civ-cs .food-split-a{background:linear-gradient(180deg,#5a3840,#3a2830);}
.civ-cs .food-split-handle{position:absolute;top:-3px;bottom:-3px;width:14px;margin-left:-7px;border-radius:4px;background:linear-gradient(180deg,#faf0c8 0%,#e8d070 35%,#a9861f 100%);border:1px solid #6a5212;box-shadow:0 1px 6px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.35);cursor:ew-resize;z-index:2;touch-action:none;pointer-events:none;}
.civ-cs .food-split-bar:focus-visible{outline:2px solid rgba(232,216,138,.55);outline-offset:2px;}
.civ-cs .food-split-labels{display:flex;justify-content:space-between;font-size:0.66em;color:var(--muted);margin-bottom:0.12em;}
.civ-cs .praca-split-bar{display:flex;height:26px;background:rgba(255,255,255,0.08);border:1px solid rgba(232,216,138,0.18);border-radius:7px;overflow:hidden;position:relative;margin-bottom:0.38em;}
.civ-cs .praca-split-b{background:linear-gradient(90deg,#a08030,#e8d88a);display:flex;align-items:center;justify-content:center;font-size:0.72em;color:#2e2708;font-weight:700;}
.civ-cs .praca-split-u{background:linear-gradient(90deg,#3a6ad0,#5a9bd4);display:flex;align-items:center;justify-content:center;font-size:0.72em;color:#08121e;font-weight:700;}
.civ-cs .praca-w4-sliders{margin:0.08em 0 0.32em;}
.civ-cs .praca-w4-sliders input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:5px;background:rgba(255,255,255,0.08);outline:none;}
.civ-cs .praca-w4-sliders input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f4e6a8,#a9861f);border:1px solid #6a5212;cursor:pointer;}
.civ-cs .praca-w4-sliders input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f4e6a8,#a9861f);border:1px solid #6a5212;cursor:pointer;}
.civ-cs .civ-w4-order-banner{display:flex;align-items:center;justify-content:center;gap:0.55em;margin-top:0.42em;padding:0.68em 0.75em;border-radius:9px;font-size:0.82em;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;}
.civ-cs .civ-w4-order-banner.ok{color:#7ad0a0;border:1px solid rgba(74,158,106,0.45);background:rgba(74,158,106,0.08);}
.civ-cs .civ-w4-order-banner.warn{color:#e0a860;border:1px solid rgba(224,168,96,0.4);background:rgba(224,168,96,0.08);}
.civ-cs .civ-w4-order-banner.crit{color:#ff8888;border:1px solid rgba(255,80,80,0.45);background:rgba(211,50,50,0.12);}
.civ-cs .civ-w4-order-banner.rebel{color:#e08a8a;border:1px solid rgba(200,64,64,0.45);background:rgba(200,64,64,0.1);}
.civ-cs .civ-breakdown-block .or-bar{height:8px;border-radius:5px;background:rgba(255,255,255,0.08);border:none;margin:0.12em 0 0.22em;}
.civ-cs .praca-split-bar .fbtxt{pointer-events:none;z-index:1;}
.civ-cs .civ-w4-tab-card{border:2px solid rgba(232,216,138,.42);border-radius:14px;overflow:hidden;
  background:linear-gradient(180deg,rgba(18,24,32,.97),rgba(8,10,16,.97));box-shadow:0 14px 36px rgba(0,0,0,.6);
  width:100%;max-width:24em;}
.civ-cs .civ-w4-tab-card.civ-w4-tab-card--scroll{display:flex;flex-direction:column;max-height:min(72vh,calc(100vh - 220px));min-height:0;}
.civ-cs .civ-w4-tab-card--scroll .civ-w4-tab-body--scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;
  padding-bottom:0.65em;scrollbar-width:thin;}
.civ-cs .civ-w4-tab-card--scroll .civ-w4-tab-body--scroll::-webkit-scrollbar{width:5px;}
.civ-cs .civ-w4-tab-card--scroll .civ-w4-tab-body--scroll::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-cs .civ-w4-tab-body{padding:0 0.85em 0.55em;}
.civ-cs .civ-w4-tab-body .ptitle{margin:0 -0.85em 0.38em;padding-left:0.85em;padding-right:0.85em;width:calc(100% + 1.7em);}
.civ-cs .civ-w4-tab-body > .panel,.civ-cs .civ-w4-tab-body > div.panel{border:none;border-radius:0;background:transparent;box-shadow:none;padding:0 0 0.12em;}
.civ-cs .civ-w4-tab-body .ptitle{margin:0;border-radius:0;}
.civ-cs .civ-w4-tab-foot{border-top:1px solid rgba(232,216,138,.16);background:rgba(255,255,255,.015);}
.civ-cs .civ-w4-tab-foot .civ-w4-surowce-foot{border:none;border-radius:0;background:transparent;padding:0.55em 0.85em;margin:0;}
.civ-cs .civ-w4-subhd{font-size:0.68em;letter-spacing:.14em;text-transform:uppercase;color:#a08030;margin-bottom:0.22em;
  display:flex;justify-content:space-between;align-items:baseline;gap:0.35em;}
.civ-cs .civ-w4-subhd-pct{color:#e8e0c8;font-weight:600;letter-spacing:normal;text-transform:none;flex-shrink:0;}
.civ-cs .civ-w4-pct-bar{height:8px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:0.28em;}
.civ-cs .civ-w4-pct-fill{height:100%;border-radius:5px;}
.civ-cs .civ-w4-inline-breakdown{font-size:0.74em;line-height:1.65;margin-bottom:0.55em;}
.civ-cs .civ-w4-inline-breakdown.pos{color:#7ad0a0;}
.civ-cs .civ-w4-inline-breakdown.neg{color:#e08a8a;}
.civ-cs .civ-w4-inline-breakdown.muted{color:#8a8070;font-style:italic;}
.civ-cs .civ-w4-section-hd{font-size:0.68em;letter-spacing:.14em;text-transform:uppercase;color:#a08030;
  margin:0.55em 0 0.38em;padding-top:0.35em;border-top:1px solid rgba(232,216,138,.12);}
.civ-cs .unit-w4-card{display:flex;align-items:center;gap:0.55em;border:1px solid rgba(232,216,138,.18);border-radius:8px;
  padding:0.55em 0.65em;margin-bottom:0.38em;background:rgba(255,255,255,.02);}
.civ-cs .unit-w4-card .unit-w4-thumb{width:2.75em;height:2.75em;flex:none;border-radius:8px;border:1px solid rgba(232,216,138,.28);
  background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);display:flex;align-items:center;justify-content:center;overflow:hidden;}
.civ-cs .unit-w4-card .unit-w4-thumb .unit-infographic-medallion{width:100%;height:100%;border:none;border-radius:8px;}
.civ-cs .unit-w4-card .unit-w4-thumb svg{width:1.35em;height:1.35em;display:block;}
.civ-cs .unit-w4-card .unit-w4-body{flex:1;min-width:0;}
.civ-cs .unit-w4-card .unit-w4-name{font-size:0.84em;font-weight:600;color:#e8e0c8;line-height:1.2;}
.civ-cs .unit-w4-card .unit-w4-cost{font-size:0.7em;color:#8a8070;margin-top:0.12em;display:flex;align-items:center;gap:0.25em;}
.civ-cs .unit-w4-scroll{max-height:calc(${RECRUIT_QUEUE_VISIBLE} * 4.6em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-cs .civ-w4-tab-body .civ-breakdown-block .subhd{font-size:0.68em;letter-spacing:.14em;text-transform:uppercase;color:#a08030;}
.civ-cs .civ-w4-tab-body .civ-breakdown-block .muted{font-size:0.68em;letter-spacing:.1em;text-transform:uppercase;color:#8a8070;}
.civ-cs .picon{width:3.4em;height:3.4em;border:2px solid var(--gold);border-radius:4px;background:var(--panel2);display:flex;align-items:center;justify-content:center;font-size:1.9em;flex-shrink:0;}
.civ-cs .qitem{background:var(--panel2);border:1px solid var(--border);border-radius:3px;padding:0.1em 0.45em;font-size:0.8em;display:flex;align-items:center;gap:0.25em;}
.civ-cs .qitem.qitem-draggable .qitem-grip{cursor:grab;}
.civ-cs .qitem.qitem-draggable{cursor:grab;}
.civ-cs .qitem.qitem-draggable button{cursor:pointer;}
.civ-cs .qitem.is-dragging{opacity:0.42;}
.civ-cs .qitem.is-drop-target{border-color:var(--gold);box-shadow:0 0 0 1px rgba(232,216,138,0.35);}
.civ-cs .qitem-grip{color:var(--muted);font-size:0.68em;letter-spacing:-0.14em;padding:0 0.12em;user-select:none;flex-shrink:0;line-height:1;opacity:0.75;}
.civ-cs .qitem-grip:hover{color:var(--gold);opacity:1;}
.civ-cs .hpb{height:0.4em;background:var(--panel2);border:1px solid var(--border);border-radius:2px;overflow:hidden;margin-top:0.15em;}
.civ-cs .hpf{height:100%;border-radius:2px;background:var(--green);} .civ-cs .hpl{background:var(--red);}
.civ-cs .rgrid{display:grid;grid-template-columns:1fr 1fr;gap:0.25em;}
.civ-cs .res.res-on{border-color:rgba(107,191,89,0.45);opacity:1;}
.civ-cs .res.res-off{opacity:0.38;border-style:dashed;filter:grayscale(0.85);}
.civ-cs .cring{display:flex;align-items:center;justify-content:center;width:3.6em;height:3.6em;border:3px solid var(--gold);
  border-radius:50%;font-size:0.9em;font-weight:700;color:var(--gold);margin:0.2em auto;background:radial-gradient(circle,#2a2530,#1b1f26);}
.civ-cs #ftr{background:linear-gradient(180deg,#1a2030,#141820);border-top:1px solid var(--border);padding:0.35em 0.55em;display:flex;align-items:center;gap:0.35em;flex-shrink:0;}
.civ-cs #ftr-r{margin-left:auto;display:flex;align-items:center;gap:0.45em;font-size:0.78em;}
.civ-cs .okolica{padding:0;}
.civ-cs .okolica h3{display:none;}
.civ-cs .okwrap{display:flex;gap:1em;align-items:flex-start;flex-wrap:wrap;}
.civ-cs .okolica-grid-wrap{position:relative;display:inline-block;line-height:0;}
.civ-cs #cs-okolica{position:relative;z-index:2;cursor:default;}
.civ-cs #cs-okolica svg{display:block;touch-action:manipulation;pointer-events:none;}
.civ-cs .ok-hex-hit{position:absolute;z-index:3;padding:0;margin:0;border:none;background:transparent;cursor:pointer;touch-action:manipulation;}
.civ-cs .ok-hex-hit:focus-visible{outline:2px solid var(--gold);outline-offset:1px;}
.civ-cs .oklegend{font-size:0.78em;color:var(--muted);display:flex;flex-direction:column;gap:0.25em;}
.civ-cs .sw{display:inline-block;width:0.75em;height:0.75em;border-radius:2px;vertical-align:middle;margin-right:0.3em;}
.civ-cs .okstats{display:flex;flex-wrap:wrap;gap:0.45em;margin-bottom:0.2em;}
.civ-cs .okstats.is-collapsed{display:none;}
.civ-cs .okstat{background:var(--panel2);border:1px solid var(--border);border-radius:4px;padding:0.3em 0.65em;font-size:0.82em;line-height:1.3;min-width:5.5em;}
.civ-cs .okstat b{color:var(--gold);font-size:1.1em;}
.civ-cs .okstat .ks{display:block;color:var(--muted);font-size:0.8em;text-transform:uppercase;letter-spacing:.04em;}
.civ-cs .okhint{font-size:0.76em;color:var(--muted);margin-top:0.55em;font-style:italic;flex-basis:100%;}
.civ-cs .okhint.is-collapsed{display:none;}
.civ-cs .okolica-compact-row{margin:0.12em 0 0.38em;}
.civ-cs .okolica-toolbar{display:flex;align-items:center;flex-wrap:nowrap;gap:0.2em;
  margin:0.12em 0 0.38em;padding:0.2em 0.38em;
  background:var(--panel2);border:1px solid var(--border);border-radius:4px;
  overflow-x:auto;min-width:0;}
.civ-cs .okolica-toolbar.hover-detail-anchor{cursor:help;}
.civ-cs .okolica-toolbar-profiles{display:flex;flex-wrap:nowrap;gap:0.16em;flex-shrink:0;}
.civ-cs .okolica-toolbar-profiles button{font-size:0.66em;padding:0.1em 0.28em;border:1px solid var(--border);
  background:var(--panel);color:var(--muted);border-radius:3px;cursor:pointer;font-family:inherit;white-space:nowrap;line-height:1.25;}
.civ-cs .okolica-toolbar-profiles button.on{border-color:var(--gold);color:var(--gold);background:#2a2530;}
.civ-cs .okolica-toolbar-profiles button:disabled{opacity:0.55;cursor:default;}
.civ-cs .okolica-toolbar-profiles button.okolica-profile-btn{display:inline-flex;align-items:center;gap:0.28em;
  padding:0.12em 0.38em;}
.civ-cs .okolica-toolbar-profiles .okolica-profile-glyph{display:inline-flex;align-items:center;justify-content:center;
  width:1.15em;height:1.15em;flex-shrink:0;}
.civ-cs .okolica-toolbar-profiles .okolica-profile-ic{width:100%;height:100%;display:block;}
.civ-cs .okolica-toolbar-profiles .okolica-profile-lbl{font-size:0.95em;line-height:1;}
.civ-cs .okolica-toolbar-profiles button.okolica-restore-btn{min-width:1.65em;padding:0.12em 0.32em;font-size:0.85em;}
.civ-cs .okolica-mode-hint{font-size:0.68em;color:var(--muted);margin:0.12em 0 0.22em;line-height:1.35;}
.civ-cs .okolica-grid-host{margin-top:0.15em;max-height:11em;overflow:auto;}
.civ-cs .okolica-compact-inner{display:flex;align-items:center;justify-content:space-between;gap:0.45em;flex-wrap:wrap;
  padding:0.28em 0.45em;background:var(--panel2);border:1px solid var(--border);border-radius:4px;}
.civ-cs .okolica-compact-inner.hover-detail-anchor{cursor:help;}
.civ-cs .okolica-info-link{font-size:0.72em;font-weight:600;text-decoration:underline dotted;text-underline-offset:2px;}
.civ-detail-scope .detail-card.okolica-detail-card{font-size:0.84em;line-height:1.42;}
.civ-detail-scope .detail-card.okolica-detail-card .dc-grid{grid-template-columns:minmax(7em,0.95fr) 1.05fr;}
.civ-cs .cs-order .or-t{font-size:0.78em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold);
  border-bottom:1px solid var(--border);padding-bottom:0.25em;margin-bottom:0.35em;display:flex;justify-content:space-between;align-items:center;}
.civ-cs .cs-order .or-r{display:flex;justify-content:space-between;padding:0.08em 0;font-size:0.82em;}
.civ-cs .cs-order .or-l{color:var(--muted);}
.civ-cs .cs-order .or-bar{height:0.55em;background:#111518;border:1px solid var(--border);border-radius:2px;overflow:hidden;margin:0.15em 0 0.3em;}
.civ-cs .cs-order .or-fill{height:100%;}
.civ-cs .cs-order .or-status{margin-top:0.35em;padding:0.25em 0.45em;border-radius:3px;font-size:0.78em;font-weight:700;text-align:center;}
.civ-cs .cs-order .or-status.ok{background:rgba(107,191,89,0.12);color:var(--green);border:1px solid rgba(107,191,89,0.35);}
.civ-cs .cs-order .or-status.t1{background:rgba(217,138,58,0.12);color:#d98a3a;border:1px solid rgba(217,138,58,0.35);}
.civ-cs .cs-order .or-status.t2{background:rgba(211,107,94,0.15);color:var(--red);border:1px solid rgba(211,107,94,0.45);}
.civ-cs .hbtn.active{background:linear-gradient(180deg,#2a5a28,#1e4020);border-color:var(--green);color:#dff5d8;box-shadow:0 0 8px rgba(107,191,89,.45);}
.civ-cs .okprof{display:flex;flex-wrap:wrap;gap:0.25em;margin:0.35em 0;}
.civ-cs .okprof button{font-size:0.72em;padding:0.15em 0.45em;border:1px solid var(--border);background:var(--panel2);color:var(--muted);border-radius:3px;cursor:pointer;font-family:inherit;}
.civ-cs .okprof button.on{border-color:var(--gold);color:var(--gold);background:#2a2530;}
.civ-cs .oktile-btn{font-size:0.65em;padding:0 0.25em;margin-left:0.15em;cursor:pointer;border:1px solid var(--border);background:var(--panel);border-radius:2px;color:var(--gold);}
.civ-cs .cs-order .or-ph{font-size:0.66em;color:var(--muted);border:1px solid var(--border);border-radius:3px;padding:0 0.3em;}
.civ-cs .cs-order .or-lines{font-size:0.72em;color:var(--muted);margin:0.15em 0 0.35em;line-height:1.35;padding-left:0.15em;}
.civ-cs .cs-order .or-lines .pos{color:var(--green);}
.civ-cs .cs-order .or-lines .neg{color:var(--red);}
.civ-cs .civ-breakdown-block{margin-top:0.38em;padding-top:0.12em;}
.civ-cs .civ-breakdown-block .or-r{display:flex;justify-content:space-between;padding:0.08em 0;font-size:0.82em;}
.civ-cs .civ-breakdown-block .or-l{color:var(--muted);}
.civ-cs .civ-breakdown-block .or-bar{height:0.55em;background:#111518;border:1px solid var(--border);border-radius:2px;overflow:hidden;margin:0.12em 0 0.22em;}
.civ-cs .civ-breakdown-block .or-fill{height:100%;}
.civ-cs .civ-breakdown-block .or-lines{font-size:0.72em;color:var(--muted);margin:0.1em 0 0.28em;line-height:1.38;padding-left:0.12em;}
.civ-cs .civ-breakdown-block .or-lines .pos{color:var(--green);}
.civ-cs .civ-breakdown-block .or-lines .neg{color:var(--red);}
.civ-cs .civ-breakdown-block .or-lines .muted-line{color:var(--muted);font-style:italic;}
.civ-cs .civ-breakdown-block .or-status{margin-top:0.28em;padding:0.25em 0.45em;border-radius:3px;font-size:0.78em;font-weight:700;text-align:center;}
.civ-cs .civ-breakdown-block .or-status.ok{background:rgba(107,191,89,0.12);color:var(--green);border:1px solid rgba(107,191,89,0.35);}
.civ-cs .civ-breakdown-block .or-status.t1{background:rgba(217,138,58,0.12);color:#d98a3a;border:1px solid rgba(217,138,58,0.35);}
.civ-cs .civ-breakdown-block .or-status.t2{background:rgba(211,107,94,0.15);color:var(--red);border:1px solid rgba(211,107,94,0.45);}
.civ-cs .civ-breakdown-block .or-status.crit{background:rgba(211,50,50,0.22);color:#ff8888;border:1px solid rgba(255,80,80,0.55);}
.civ-cs .hrow{display:flex;justify-content:space-between;align-items:center;font-size:0.82em;padding:0.1em 0;}
.civ-cs .slider-row{margin-bottom:0.22em;}
.civ-cs .slider-row label{display:flex;justify-content:space-between;font-size:0.72em;margin-bottom:0.06em;gap:0.3em;}
.civ-cs .slider-row input[type=range]{width:100%;accent-color:var(--gold);height:0.85em;}
.civ-cs .praca-balance{margin-top:0.12em;}
.civ-cs .praca-balance-labels{display:flex;justify-content:space-between;align-items:flex-end;gap:0.5em;margin-bottom:0.1em;}
.civ-cs .praca-side{display:flex;flex-direction:column;gap:0.04em;min-width:4.5em;}
.civ-cs .praca-side.right{align-items:flex-end;text-align:right;}
.civ-cs .praca-side .lbl{font-size:0.72em;color:var(--muted);letter-spacing:.02em;}
.civ-cs .praca-side .pct{font-size:0.95em;font-weight:700;line-height:1.1;}
.civ-cs .praca-balance input[type=range]{width:100%;accent-color:var(--gold);height:0.85em;margin:0.05em 0;}
.civ-cs .praca-balance-hint{font-size:0.65em;color:var(--muted);text-align:center;margin-top:0.1em;line-height:1.3;}
.civ-cs .praca-split-info{margin-top:0.35em;display:flex;flex-direction:column;gap:0.18em;font-size:0.74em;line-height:1.35;}
.civ-cs .praca-split-info .psi-row{display:flex;justify-content:space-between;align-items:flex-start;gap:0.45em;}
.civ-cs .praca-split-info .psi-lbl{color:var(--muted);flex:0 0 auto;}
.civ-cs .praca-split-info .psi-val{text-align:right;flex:1 1 auto;}
.civ-cs .praca-split-info .psi-sub{font-size:0.92em;color:var(--muted);margin-top:0.06em;}
.civ-cs .praca-split-chips{margin:0.28em 0 0.12em;}
.civ-cs .civ-cs-chip-ic-wrap{display:inline-flex;align-items:center;vertical-align:middle;margin-right:0.1em;}
.civ-cs .civ-cs-chip-ic{width:1em;height:1em;color:var(--gold);flex-shrink:0;}
.civ-cs .civ-cs-inline-loaf{display:inline-flex;align-items:center;vertical-align:middle;margin-right:0.06em;}
.civ-cs .civ-cs-inline-loaf .civ-v-loaf-ic{width:0.9em;height:0.95em;}
.civ-detail-scope .detail-card .dc-v .civ-cs-chip-ic-wrap,
.civ-detail-scope .detail-card .dc-note .civ-cs-chip-ic-wrap,
.civ-detail-scope .detail-card .dc-formula .civ-cs-chip-ic-wrap,
.civ-detail-scope .detail-card .dc-section .civ-cs-chip-ic-wrap,
.civ-detail-scope .detail-card .dc-algo-step .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-v .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-note .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-formula .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-section .civ-cs-chip-ic-wrap,
.civ-cs .detail-card .dc-algo-step .civ-cs-chip-ic-wrap,
.civ-cs .or-status .civ-cs-chip-ic-wrap,
.civ-cs .or-status .civ-cs-inline-loaf{display:inline-flex;align-items:center;vertical-align:middle;margin-right:0.08em;}
.civ-cs .praca-split-bar .fbtxt{display:flex;align-items:center;justify-content:center;gap:0.08em;flex-wrap:wrap;}
.civ-cs .praca-split-info .psi-lbl{display:inline-flex;align-items:center;gap:0.12em;}
.civ-cs .chip .cl{display:inline-flex;align-items:center;gap:0.1em;}
.civ-cs .wealth-grid{display:flex;flex-wrap:wrap;gap:0.22em;}
.civ-cs .wealth-compact-row{margin:0.08em 0 0.32em;}
.civ-cs .wealth-compact-inner{display:flex;align-items:center;justify-content:space-between;gap:0.45em;flex-wrap:wrap;
  padding:0.28em 0.45em;background:var(--panel2);border:1px solid var(--border);border-radius:4px;}
.civ-cs .wealth-compact-inner.hover-detail-anchor{cursor:help;}
.civ-detail-scope .detail-card.wealth-detail-card{font-size:0.84em;line-height:1.42;}
.civ-detail-scope .detail-card.wealth-detail-card .dc-grid{grid-template-columns:minmax(7.5em,0.95fr) 1.05fr;}
.civ-detail-scope .detail-card.wealth-detail-card .dc-formula{font-size:0.88em;color:var(--gold);font-family:Consolas,'Courier New',monospace;margin:0.2em 0 0.35em;padding:0.25em 0.4em;
  background:rgba(0,0,0,0.25);border-radius:3px;border-left:2px solid var(--gold);}
.civ-cs .wealth-stat{flex:0 0 auto;background:var(--panel2);border:1px solid var(--border);border-radius:3px;padding:0.15em 0.38em;font-size:0.78em;}
.civ-cs .wealth-stat .ks{display:inline;color:var(--muted);font-size:0.92em;margin-right:0.25em;}
.civ-cs .wealth-stat b{color:var(--gold);font-size:0.95em;}
.civ-ux-mount.civ-cs{pointer-events:auto;}
.civ-ux-panel-scope.civ-cs{position:relative!important;inset:auto!important;display:flex!important;flex-direction:column!important;
  gap:0.48em!important;
  pointer-events:auto!important;z-index:auto!important;width:100%;height:auto;min-height:0;
  background:transparent;color:var(--text);font-family:var(--civ-font-ui);}
.civ-v-card{background:rgba(6,12,24,0.55);border:1px solid var(--civ-gold-border);border-radius:var(--civ-radius-panel);
  padding:0.45em 0.5em;margin-bottom:0.45em;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.35);}
.civ-v-city-name{font-size:1.35em;font-weight:700;color:var(--civ-gold-primary);letter-spacing:0.04em;text-transform:uppercase;font-family:var(--civ-font-title);}
.civ-v-city-pop{font-size:0.78em;color:var(--muted);margin-top:0.15em;}
.civ-v-growth{margin:0.45em 0 0.55em;}
.civ-v-growth-lbl{font-size:0.68em;color:var(--muted);text-transform:uppercase;margin-bottom:0.12em;}
.civ-v-yields{display:flex;flex-direction:column;gap:0.22em;}
.civ-v-yield-row{display:flex;align-items:center;gap:0.45em;font-size:0.88em;padding:0.12em 0;
  border-bottom:1px solid rgba(255,255,255,0.04);}
.civ-v-yield-row:last-child{border-bottom:none;}
.civ-v-yield-icon{width:1.35em;text-align:center;font-size:1.05em;}
.civ-v-yield-label{flex:1;color:#c8d0dc;}
.civ-v-yield-val{font-weight:700;min-width:2.5em;text-align:right;}
.civ-v-top-strip{display:flex;align-items:center;justify-content:space-between;gap:0.5em;
  padding:0.28em 0.65em;background:linear-gradient(180deg,#121a28,#0a1018);
  border-bottom:1px solid rgba(212,175,90,0.25);font-size:0.78em;}
.civ-v-resource-bar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
  gap:0.5rem;padding:0 0.65rem;height:100%;min-height:0;box-sizing:border-box;
  background:linear-gradient(180deg,#0c121c,#060a10);border-bottom:1px solid rgba(212,175,90,0.32);}
.civ-v-resource-bar.civ-v-resource-bar-w3{display:flex;align-items:center;justify-content:center;gap:0.65rem;
  padding:0;background:transparent;border:none;height:auto;min-height:0;width:fit-content;max-width:100%;min-width:0;margin:0 auto;box-sizing:border-box;}
.civ-v-top-stack{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:fit-content;max-width:min(96vw,1120px);gap:0.38rem;padding:0 0.25rem;box-sizing:border-box;margin:0 auto;}
.civ-v-top-line{display:flex;align-items:center;justify-content:center;gap:0.65rem;flex-wrap:wrap;width:100%;}
.civ-v-exit-top-row{display:flex;flex-direction:column;align-items:center;gap:0.28em;pointer-events:auto;flex-shrink:0;}
.civ-v-exit-top-row .civ-v-exit-map-btn{font-size:0.82em;padding:0.48em 1.05em 0.48em 0.85em;}
.civ-v-exit-top-row .civ-v-exit-foot-hint{font-size:0.62em;color:#8b97a8;text-align:center;white-space:nowrap;}
.civ-v-w3-bar-spacer{display:none;}
.civ-v-w3-chips-city{margin-left:0;flex:0 0 auto;width:fit-content;max-width:100%;min-width:0;}
.civ-v-w3-city-badge{display:inline-flex;align-items:center;gap:0.55rem;padding:0.45rem 1.05rem 0.45rem 0.75rem;
  border-radius:24px;background:linear-gradient(180deg,#151b26,#0a0d14);border:1.5px solid #e8d88a;
  box-shadow:0 5px 16px rgba(0,0,0,0.6);flex-shrink:0;max-width:100%;}
.civ-v-w3-city-nav{background:none;border:none;color:#e8d88a;font-size:1.35em;line-height:1;padding:0 0.15em;
  cursor:pointer;opacity:0.85;font-family:inherit;}
.civ-v-w3-city-nav:hover:not(:disabled){opacity:1;color:#fff8e0;}
.civ-v-w3-city-nav:disabled{opacity:0.25;cursor:default;}
.civ-v-w3-city-name{font-family:var(--civ-font-title, Georgia, serif);font-size:1.35em;font-weight:700;
  color:#f0e6d0;letter-spacing:0.04em;text-transform:uppercase;line-height:1;}
.civ-v-w3-city-pop{width:1.65em;height:1.65em;border-radius:50%;background:#e8d88a;color:#2a2208;
  font-size:0.72em;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.civ-v-w3-chips{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:0.42rem 0.65rem;
  padding:0.42rem 1rem;border-radius:12px;
  background:linear-gradient(180deg,rgba(22,28,40,0.94),rgba(8,10,16,0.95));border:1px solid rgba(232,216,138,0.32);
  flex:1 1 auto;width:100%;max-width:100%;min-width:0;overflow-x:visible;overflow-y:visible;}
.civ-v-w3-chip{display:inline-flex;align-items:center;gap:0.42rem;white-space:nowrap;flex-shrink:0;
  font-size:0.78em;line-height:1;border:none;background:transparent;padding:0.12em 0.18em;margin:0;
  cursor:pointer;border-radius:4px;font-family:inherit;color:inherit;}
.civ-v-w3-chip:hover{background:rgba(212,175,90,0.1);}
.civ-v-w3-chip:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
.civ-v-w3-chip-icon{display:flex;align-items:center;justify-content:center;color:#e8d88a;font-size:1.05em;line-height:1;}
.civ-v-w3-chip-icon .civ-v-loaf-ic{width:1.05em;height:1.15em;}
.civ-v-w3-sci-med{display:inline-flex;align-items:center;justify-content:center;
  width:1.35em;height:1.35em;border-radius:50%;flex-shrink:0;
  background:radial-gradient(circle at 35% 30%,#8fb6e0,#3a5f8a);border:1px solid #26456a;}
.civ-v-w3-sci-med .civ-science-owl-ic{width:0.82em;height:0.82em;color:#0a1628;}
.civ-v-w3-chip-icon .civ-science-owl-ic{width:1.05em;height:1.05em;color:#0a1628;}
.civ-v-w3-chip-lbl{font-size:0.92em;color:#8a8070;}
.civ-v-w3-chip-val{font-size:1.05em;font-weight:700;color:#e8d88a;}
.civ-v-w3-chip-val.blue{color:#7cb4e4;}
.civ-v-w3-chip-val.green{color:var(--green);}
.civ-v-w3-chip-val.red{color:var(--red);}
.civ-v-w3-chip-sep{width:1px;height:1.45em;background:rgba(232,216,138,0.2);flex-shrink:0;}
.civ-v-w3-chip-splits{display:inline-flex;align-items:center;gap:0.22em;margin-left:0.12em;}
.civ-v-w3-split{font-size:0.68em;font-weight:700;line-height:1;opacity:0.95;}
.civ-v-w3-split.gold{color:var(--gold);}
.civ-v-w3-split.blue{color:#7cb4e4;}
.civ-v-w3-split.purple{color:#c894e8;}
.civ-v-w3-top-actions{display:flex;align-items:center;gap:0.75rem;flex-shrink:0;margin-left:0.35rem;}
.civ-v-exit-map-btn{display:inline-flex;align-items:center;gap:0.38em;padding:0.38em 0.85em 0.38em 0.65em;
  border-radius:10px;border:2px solid rgba(232,216,138,0.55);
  background:linear-gradient(180deg,#5a3018,#2a1408);color:#fff8e0;
  font-size:0.76em;font-weight:700;cursor:pointer;letter-spacing:0.06em;text-transform:uppercase;
  font-family:inherit;line-height:1;box-shadow:0 2px 10px rgba(0,0,0,0.45);}
.civ-v-exit-map-btn:hover{border-color:#e8d88a;background:linear-gradient(180deg,#7a4020,#3a1808);}
.civ-v-exit-map-btn:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
.civ-v-exit-map-btn .civ-v-exit-ic{display:flex;align-items:center;justify-content:center;width:1.35em;height:1.35em;}
.civ-v-resource-bar-w3 .civ-v-top-close{width:2.45em;height:2.45em;padding:0;border-radius:10px;
  border:1px solid rgba(232,216,138,0.35);background:linear-gradient(180deg,#161c28,#0a0d14);color:#e8d88a;
  font-size:1.05em;display:flex;align-items:center;justify-content:center;line-height:1;}
.civ-v-res-city{font-size:0.85em;font-weight:700;color:#d4af5a;letter-spacing:0.07em;text-transform:uppercase;
  white-space:nowrap;align-self:center;padding-right:0;line-height:1;flex-shrink:0;}
.civ-v-res-head{display:flex;align-items:center;gap:0.55rem;justify-self:start;min-width:0;max-width:min(44vw,520px);}
.civ-v-garrison-inline{display:flex;align-items:center;gap:0.42rem;min-width:0;overflow-x:auto;scrollbar-width:none;
  padding:0.1rem 0;-ms-overflow-style:none;}
.civ-v-garrison-inline::-webkit-scrollbar{display:none;}
.civ-v-garrison-label{display:inline-flex;align-items:center;gap:0.28em;font-size:0.82em;font-weight:700;color:var(--text);
  letter-spacing:0.03em;flex-shrink:0;white-space:nowrap;cursor:help;}
.civ-v-garrison-icon{font-size:1.45em;line-height:1;display:flex;align-items:center;flex-shrink:0;opacity:0.95;}
.civ-v-garrison-count{font-size:0.92em;font-weight:700;color:#d4af5a;}
.civ-v-garrison-chip{display:inline-flex;align-items:center;gap:0.3em;padding:0.22em 0.52em;border-radius:3px;
  background:rgba(20,28,40,0.88);border:1px solid rgba(212,175,90,0.28);font-size:0.72em;line-height:1.15;flex-shrink:0;cursor:help;}
.civ-v-garrison-chip .gi{font-size:1.15em;line-height:1;}
.civ-v-garrison-chip .gn{font-weight:600;color:var(--text);max-width:7em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-v-garrison-chip .hpb{width:2em;height:0.4em;background:#0a0e14;border-radius:2px;overflow:hidden;border:1px solid rgba(0,0,0,0.35);flex-shrink:0;}
.civ-v-garrison-chip .hpf{height:100%;background:linear-gradient(90deg,#2a6a2a,#6bbf59);}
.civ-v-garrison-chip .hpf.hpl{background:linear-gradient(90deg,#6a1818,#d36b5e);}
.civ-v-garrison-empty{display:none;}
.civ-v-res-scroll{display:flex;align-items:center;justify-content:center;gap:1.15rem;
  justify-self:center;align-self:center;max-width:min(100%,96vw);
  overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;
  padding:0 0.25rem;}
.civ-v-res-scroll::-webkit-scrollbar{display:none;}
.civ-v-res-item{display:inline-flex;align-items:center;gap:0.22em;font-size:1.68em;white-space:nowrap;line-height:1;}
.civ-v-res-item.civ-v-res-interactive{cursor:pointer;border-radius:4px;padding:0.1em 0.28em;margin:-0.1em -0.12em;
  border:1px solid transparent;transition:background .12s ease,border-color .12s ease,box-shadow .12s ease;}
.civ-v-res-item.civ-v-res-interactive:hover{background:rgba(212,175,90,0.14);border-color:rgba(212,175,90,0.38);
  box-shadow:0 0 0 1px rgba(212,175,90,0.08);}
.civ-v-res-item.civ-v-res-interactive:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
.civ-v-res-icon{opacity:0.95;font-size:1.05em;line-height:1;display:flex;align-items:center;}
.civ-v-res-icon .civ-v-loaf-ic{width:0.76em;height:0.84em;}
.civ-v-res-icon .civ-science-owl-ic{width:0.76em;height:0.76em;color:#0a1628;}
.civ-v-loaf-chip{width:0.62em;height:0.68em;display:inline-flex;vertical-align:-0.1em;}
.food-grow-loaf .civ-v-loaf-ic{width:0.58em;height:0.64em;display:inline-flex;}
.civ-v-loaf-ic svg{width:100%;height:100%;display:block;}
.civ-v-res-val{font-weight:700;font-size:1em;line-height:1;display:flex;align-items:center;}
.civ-v-res-delta{font-size:0.62em;font-weight:700;margin-left:0.14em;line-height:1;display:flex;align-items:center;}
.civ-v-res-delta.green{color:var(--green);}
.civ-v-res-delta.red{color:var(--red);}
.civ-v-res-delta.gold{color:var(--gold);}
.civ-v-res-delta.blue{color:var(--blue);}
.civ-v-res-sep{width:1px;height:1.35em;align-self:center;background:rgba(255,255,255,0.12);flex-shrink:0;}
.civ-v-resource-bar>.civ-v-top-close{justify-self:end;align-self:center;font-size:1.15em;padding:0.2em 0.65em;line-height:1;}
.civ-v-bld-btns{display:flex;gap:0.22em;margin-left:auto;flex-shrink:0;}
.civ-cs .list-scroll{max-height:calc(${LIST_SCROLL_VISIBLE} * ${LIST_ROW_HEIGHT_EM}em);overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;
  padding-right:0.12em;margin-bottom:0.15em;}
.civ-cs .list-scroll::-webkit-scrollbar{width:5px;}
.civ-cs .list-scroll::-webkit-scrollbar-thumb{background:var(--bord2);border-radius:3px;}
.civ-cs .mini-thumb{width:2.15em;height:2.15em;border:2px solid var(--gold);border-radius:4px;background:var(--panel2);
  display:flex;align-items:center;justify-content:center;font-size:1.1em;flex-shrink:0;line-height:1;color:var(--gold);}
.civ-cs .mini-thumb svg,.civ-cs .picon svg,.civ-cs .bi svg{width:1.35em;height:1.35em;display:block;}
.civ-cs .obelisk-ic{font-size:0;position:relative;display:inline-flex;align-items:flex-end;justify-content:center;}
.civ-cs .obelisk-ic::before{content:'';position:absolute;left:50%;bottom:0.22em;transform:translateX(-50%);
  width:0.38em;height:1.48em;background:linear-gradient(90deg,#8f6b2e 0%,#c9a04a 42%,#edd98a 50%,#c9a04a 58%,#8f6b2e 100%);
  clip-path:polygon(50% 0%,72% 11%,66% 100%,34% 100%,28% 11%);box-shadow:inset -1px 0 0 rgba(0,0,0,0.12);}
.civ-cs .obelisk-ic::after{content:'';position:absolute;left:50%;bottom:0.12em;transform:translateX(-50%);
  width:0.78em;height:0.11em;background:linear-gradient(180deg,#7a5c32,#5c4524);border-radius:1px;}
.civ-cs .mini-thumb.obelisk-ic,.civ-cs .picon.obelisk-ic{align-items:center;justify-content:center;}
.civ-cs .bi.obelisk-ic{width:1.3em;height:1.15em;vertical-align:middle;}
.civ-cs .qitem .obelisk-ic{width:1.05em;height:1.05em;flex-shrink:0;}
.civ-cs .planks-ic{font-size:0;position:relative;display:inline-flex;align-items:center;justify-content:center;}
.civ-cs .planks-ic::before{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:1.02em;height:1.38em;border-radius:1px;
  background:
    linear-gradient(90deg,#5c4018 0%,#8f6830 38%,#c89452 50%,#8f6830 62%,#5c4018 100%) 0 0/100% 0.27em no-repeat,
    linear-gradient(90deg,#5c4018 0%,#8f6830 38%,#c89452 50%,#8f6830 62%,#5c4018 100%) 0 0.38em/100% 0.27em no-repeat,
    linear-gradient(90deg,#5c4018 0%,#8f6830 38%,#c89452 50%,#8f6830 62%,#5c4018 100%) 0 0.76em/100% 0.27em no-repeat;
  box-shadow:inset 0 0.31em 0 -0.27em rgba(0,0,0,0.14),inset 0 0.62em 0 -0.54em rgba(0,0,0,0.11);}
.civ-cs .mini-thumb.planks-ic,.civ-cs .picon.planks-ic{align-items:center;justify-content:center;}
.civ-cs .bi.planks-ic{width:1.3em;height:1.15em;vertical-align:middle;}
.civ-cs .qitem .planks-ic{width:1.05em;height:1.05em;flex-shrink:0;}
.civ-cs .mini-thumb.building-thumb-hover{cursor:help;}
.civ-cs .unit-mini-preview{width:2.85em;height:2.85em;border:2px solid var(--gold);border-radius:4px;background:#87ceeb;
  overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative;}
.civ-cs .unit-mini-canvas{width:100%;height:100%;display:block;object-fit:cover;}
.civ-cs .unit-mini-loading,.civ-cs .unit-mini-fallback{color:var(--muted);font-size:0.85em;}
.civ-detail-scope{
  --bg:#141820;--panel:#1e2430;--panel2:#171c24;--border:#2e3848;--bord2:#3d4a5c;
  --text:#e8ebf0;--muted:#8b97a8;--gold:#e0b24a;--green:#6bbf59;--red:#d36b5e;--blue:#5a9bd4;--happy:#f6c942;
  color:var(--text);font-family:'Segoe UI',Tahoma,Verdana,sans-serif;line-height:1.38;}
.civ-detail-scope .detail-card{margin:0;padding:0.38em 0.48em;background:rgba(0,0,0,0.28);
  border:1px solid var(--bord2);border-left:3px solid var(--gold);border-radius:4px;font-size:0.78em;line-height:1.38;}
.civ-detail-scope .detail-card .dc-h{font-weight:700;color:var(--gold);margin-bottom:0.22em;display:flex;align-items:center;gap:0.35em;}
.civ-detail-scope .detail-card .dc-h .mini-thumb{width:1.85em;height:1.85em;font-size:0.95em;border-width:1px;
  width:2.15em;height:2.15em;border:2px solid var(--gold);border-radius:4px;background:var(--panel2);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;}
.civ-detail-scope .detail-card .dc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.12em 0.5em;margin-top:0.15em;}
.civ-detail-scope .detail-card .dc-l{color:var(--muted);}
.civ-detail-scope .detail-card .dc-v{word-break:break-word;}
.civ-detail-scope .detail-card .dc-section{font-size:0.68em;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;
  color:#d4af5a;margin:0.55em 0 0.2em;padding-bottom:0.12em;border-bottom:1px solid rgba(212,175,90,0.18);}
.civ-detail-scope .detail-card .dc-section:first-of-type{margin-top:0.15em;}
.civ-detail-scope .detail-card .dc-note{margin-top:0.35em;color:var(--muted);font-size:0.88em;font-style:italic;line-height:1.35;}
.civ-detail-scope .detail-card .dc-algo-step{font-size:0.76em;line-height:1.42;color:var(--muted);margin:0.1em 0 0.26em;padding-left:0.12em;}
.civ-detail-scope .detail-card .dc-formula{font-size:0.82em;color:var(--gold);font-family:Consolas,'Courier New',monospace;margin:0.18em 0 0.32em;padding:0.22em 0.38em;
  background:rgba(0,0,0,0.25);border-radius:3px;border-left:2px solid rgba(212,175,90,0.35);}
.civ-hover-detail-dock .civ-detail-scope .detail-card{box-shadow:none;}
.civ-hover-detail-float{display:none;position:fixed;z-index:100000;max-width:min(300px,92vw);pointer-events:none;
  padding:0.38em 0.48em;background:rgba(8,12,20,0.96);border:1px solid #e0b24a;border-radius:4px;
  box-shadow:0 6px 20px rgba(0,0,0,0.65);font-size:0.74em;line-height:1.38;}
.civ-hover-detail-float .civ-detail-scope .detail-card{border:none;background:transparent;padding:0;}
.civ-cs .mini-thumb.hover-detail-anchor,.civ-cs .unit-mini-preview.hover-detail-anchor,.civ-cs .item-row.hover-detail-anchor{cursor:help;}
.civ-cs .item-row{display:flex;align-items:center;gap:0.32em;background:var(--panel2);border:1px solid var(--border);
  border-radius:3px;padding:0.18em 0.38em;margin-bottom:0.16em;position:relative;}
.civ-cs .item-row.is-catalog-ready{border-color:rgba(107,191,89,0.35);}
.civ-cs .item-row.is-catalog-locked,.civ-cs .item-row.is-catalog-built,.civ-cs .item-row.is-catalog-queued{
  opacity:0.52;filter:grayscale(0.75);}
.civ-cs .item-row.is-catalog-locked .mini-thumb,.civ-cs .item-row.is-catalog-built .mini-thumb{opacity:0.7;}
.civ-cs .bld-catalog-lock{font-size:0.68em;color:#d36b5e;line-height:1.35;margin-top:0.12em;}
.civ-cs .bld-catalog-ready-tag{font-size:0.66em;color:var(--green);font-weight:600;}
.civ-cs .bld-catalog-meta{font-size:0.68em;color:var(--muted);line-height:1.3;}
.civ-cs .bld-catalog-scroll{max-height:calc(${LIST_SCROLL_VISIBLE} * 3.4em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-cs .bld-catalog-scroll::-webkit-scrollbar{width:5px;}
.civ-cs .bld-catalog-scroll::-webkit-scrollbar-thumb{background:var(--bord2);border-radius:3px;}
.civ-cs .bld-infocard-wrap{margin-bottom:0.55em;}
.civ-cs .bld-infocard{border:2px solid rgba(232,216,138,.4);border-radius:14px;overflow:hidden;background:linear-gradient(180deg,rgba(20,26,34,.98),rgba(8,10,16,.98));box-shadow:0 8px 24px rgba(0,0,0,.35);}
.civ-cs .bld-infocard.is-catalog-locked{opacity:.78;}
.civ-cs .bld-infocard-hd{padding:0.72em 0.85em;display:flex;align-items:center;gap:0.65em;border-bottom:1px solid rgba(232,216,138,.16);}
.civ-cs .bld-infocard-ic{width:2.4em;height:2.4em;flex:none;border-radius:9px;border:1px solid #a08030;background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.civ-cs .bld-infocard-ic .mini-thumb{width:100%;height:100%;border:none;background:transparent;}
.civ-cs .bld-infocard-title{font-family:Georgia,serif;font-size:1.05em;color:#e8e0c8;line-height:1.15;font-weight:600;}
.civ-cs .bld-infocard-cat{display:inline-flex;margin-top:0.28em;font-size:0.58em;letter-spacing:.1em;text-transform:uppercase;color:#0f1218;background:#c8b070;padding:0.18em 0.45em;border-radius:5px;}
.civ-cs .bld-infocard-bd{padding:0.62em 0.85em 0.72em;display:flex;flex-direction:column;gap:0.45em;}
.civ-cs .bld-infocard-chips{display:flex;flex-wrap:wrap;gap:0.35em;}
.civ-cs .bld-infocard-chip{display:inline-flex;align-items:center;gap:0.28em;font-size:0.68em;color:#c8b898;border:1px solid rgba(232,216,138,.25);border-radius:20px;padding:0.22em 0.52em;}
.civ-cs .bld-infocard-upg{display:flex;align-items:center;gap:0.42em;padding:0.42em 0.52em;background:rgba(232,216,138,.07);border:1px solid rgba(232,216,138,.22);border-radius:9px;font-size:0.68em;color:#d8cca8;}
.civ-cs .bld-infocard-ft{display:flex;align-items:center;justify-content:space-between;padding-top:0.42em;border-top:1px solid rgba(232,216,138,.12);font-size:0.62em;color:#8a8478;}
.civ-cs .bld-infocard-era{display:inline-flex;align-items:center;gap:0.35em;letter-spacing:.06em;text-transform:uppercase;color:#b7a06a;}
.civ-cs .bld-infocard-era-dot{width:7px;height:7px;border-radius:50%;background:#c8b070;flex-shrink:0;}
.civ-cs .bld-infocard-actions{display:flex;align-items:center;justify-content:space-between;gap:0.35em;margin-top:0.12em;flex-wrap:wrap;}
.civ-cs .bld-infocard-cost{font-size:0.68em;color:var(--muted);}
.civ-cs .bld-infocard-lock{font-size:0.68em;color:#d36b5e;line-height:1.35;}
${UNIT_INFOGRAPHIC_CSS}
${UNIT_RECRUIT_CARD_CSS}
.civ-cs .item-wrap{margin-bottom:0.05em;}
.civ-cs .detail-card{margin:0.08em 0 0.22em 0.2em;padding:0.38em 0.48em;background:rgba(0,0,0,0.28);
  border:1px solid var(--bord2);border-left:3px solid var(--gold);border-radius:4px;font-size:0.74em;line-height:1.38;}
.civ-cs .detail-card .dc-h{font-weight:700;color:var(--gold);margin-bottom:0.22em;display:flex;align-items:center;gap:0.35em;}
.civ-cs .detail-card .dc-h .mini-thumb{width:1.85em;height:1.85em;font-size:0.95em;border-width:1px;}
.civ-cs .detail-card .dc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.12em 0.5em;margin-top:0.15em;}
.civ-cs .detail-card .dc-l{color:var(--muted);}
.civ-cs .detail-card .dc-note{margin-top:0.25em;color:var(--muted);font-size:0.92em;font-style:italic;}
.civ-cs .recruit-prod{display:flex;gap:0.5em;align-items:flex-start;margin-bottom:0.3em;padding:0.22em 0;
  border-bottom:1px solid rgba(255,255,255,0.04);}
.civ-cs .recruit-prod:last-child{border-bottom:none;}
.civ-cs .recruit-prod .picon{width:2.75em;height:2.75em;font-size:1.45em;}
.civ-cs .recruit-scroll{max-height:calc(${RECRUIT_QUEUE_VISIBLE} * 4.2em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-cs .build-queue-scroll{max-height:calc(${BUILD_QUEUE_VISIBLE} * 2.75em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-v-top-strip .civ-v-tag{color:#8b97a8;letter-spacing:0.06em;text-transform:uppercase;}
.civ-v-top-close{background:linear-gradient(180deg,#5a3020,#3a1810);border:1px solid #a05040;
  color:#ffe8d0;font-size:0.85em;padding:0.15em 0.55em;border-radius:2px;cursor:pointer;font-weight:600;}
.civ-v-section-hd{font-size:0.7em;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;
  color:#d4af5a;margin:0.5em 0 0.35em;padding-bottom:0.2em;border-bottom:1px solid rgba(212,175,90,0.2);}
.civ-cs .section-blurb{font-size:0.72em;line-height:1.38;color:var(--muted);margin:-0.08em 0 0.4em;}
.civ-cs .civ-v-section-blurb{font-size:0.72em;line-height:1.38;color:var(--muted);margin:-0.12em 0 0.45em;}
.civ-v-map-plaque{position:absolute;top:8%;left:50%;transform:translateX(-50%);text-align:center;pointer-events:none;}
.civ-v-map-plaque .name{font-size:1.5em;font-weight:700;color:#f0e6c8;text-shadow:0 2px 8px rgba(0,0,0,0.85);
  letter-spacing:0.12em;text-transform:uppercase;}
.civ-v-map-plaque .sub{font-size:0.72em;color:#a8b4c8;margin-top:0.2em;text-shadow:0 1px 4px #000;}
.civ-v-map-exit-float{display:none!important;}
.civ-v-map-bottom-stack{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2;
  display:flex;flex-direction:column;align-items:stretch;gap:0.38em;
  min-width:min(440px,78vw);max-width:92vw;pointer-events:none;}
.civ-v-map-bottom-stack > *{pointer-events:auto;}
.civ-v-okolica-center{position:relative;left:auto;bottom:auto;top:auto;transform:none;
  display:flex;flex-direction:column;align-items:stretch;gap:0.32em;
  min-width:0;max-width:none;width:100%;padding:0.5rem 0.72rem 0.58rem;
  border-radius:12px;
  background:linear-gradient(180deg,rgba(16,22,34,0.97),rgba(6,8,14,0.96));
  border:2.5px solid rgba(232,216,138,0.82);
  box-shadow:0 0 0 1px rgba(212,175,90,0.45),0 0 22px rgba(232,216,138,0.12),0 10px 32px rgba(0,0,0,0.62);}
.civ-v-okolica-center .civ-v-okolica-head{margin:0;padding:0;border:none;
  font-size:0.82em;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#e8d88a;}
.civ-v-okolica-center .okolica-toolbar-map{margin:0;padding:0.32rem 0.4rem;
  border-radius:8px;border:1.5px solid rgba(232,216,138,0.55);
  background:rgba(4,8,16,0.72);justify-content:center;}
.civ-v-okolica-center .okolica-toolbar-profiles{justify-content:center;flex-wrap:wrap;gap:0.22em;}
.civ-v-okolica-center .okolica-toolbar-profiles button{
  font-size:0.72em;padding:0.18em 0.42em;border:1px solid rgba(232,216,138,0.35);
  border-radius:6px;background:rgba(12,18,28,0.9);color:#c8d0dc;}
.civ-v-okolica-center .okolica-toolbar-profiles button.okolica-profile-btn{gap:0.32em;padding:0.2em 0.48em;}
.civ-v-okolica-center .okolica-toolbar-profiles .okolica-profile-glyph{width:1.25em;height:1.25em;}
.civ-v-okolica-center .okolica-toolbar-profiles button.on{
  border-color:#e8d88a;color:#fff4c8;background:linear-gradient(180deg,#3a3018,#1a1408);
  box-shadow:0 0 0 1px rgba(232,216,138,0.55),inset 0 0 10px rgba(232,216,138,0.12);}
.civ-v-okolica-center .okolica-toolbar-profiles button.reczny.on{
  border-color:#7ad0a0;color:#dff5e8;background:linear-gradient(180deg,#1a3028,#0c1810);
  box-shadow:0 0 0 1px rgba(122,208,160,0.45),inset 0 0 8px rgba(122,208,160,0.1);}
.civ-v-okolica-center .civ-v-okmode-map{display:none;}
.civ-v-map-actions{position:relative;left:auto;bottom:auto;top:auto;transform:none;
  display:flex;flex-direction:column;align-items:center;gap:0.28em;pointer-events:auto;}
.civ-v-map-actions .civ-v-map-btn{pointer-events:auto;}
.civ-v-map-btn{background:linear-gradient(180deg,#1a3a5a,#0f2840);border:2px solid #5a9fd4;border-radius:8px;
  color:#e8f4ff;font-size:0.88em;font-weight:700;padding:0.55em 1.25em;cursor:pointer;
  box-shadow:0 4px 16px rgba(0,0,0,0.55);font-family:inherit;display:inline-flex;align-items:center;gap:0.4em;}
.civ-v-map-btn.primary{border-color:#e8d88a;color:#fff8e0;background:linear-gradient(180deg,#6a4020,#3a2010);
  font-size:0.92em;padding:0.6em 1.35em;letter-spacing:0.05em;text-transform:uppercase;}
.civ-v-map-hint{font-size:0.62em;color:#8b97a8;pointer-events:none;text-align:center;white-space:nowrap;}
.civ-v-exit-foot{display:flex;flex-direction:column;align-items:stretch;gap:0.32em;margin-bottom:0.45em;
  padding-bottom:0.42em;border-bottom:1px solid rgba(212,175,90,0.22);}
.civ-v-exit-foot-btn{width:100%;justify-content:center;padding:0.55em 1em;font-size:0.82em;}
.civ-v-exit-foot-hint{font-size:0.68em;text-align:center;color:var(--muted);}
.civ-ux-top-bar{display:flex;align-items:center;gap:0.65rem;padding:0.35rem 0.55rem;background:linear-gradient(180deg,#222838,#1a2030);border-bottom:1px solid var(--border);}
.civ-ux-top-city{font-weight:700;color:var(--gold);font-size:0.95em;white-space:nowrap;}
.civ-ux-top-table{border-collapse:collapse;flex:1;font-size:0.78em;}
.civ-ux-top-table td{padding:0.12rem 0.55rem;border-right:1px solid var(--border);vertical-align:middle;}
.civ-ux-top-table td:last-child{border-right:none;}
.civ-ux-tl{display:block;font-size:0.68em;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.civ-ux-tv{font-weight:700;font-size:1.05em;}
.civ-ux-top-close{background:linear-gradient(180deg,#c0402f,#8a2418);border:1px solid #d05040;color:#fff;font-weight:700;border-radius:4px;padding:0.15rem 0.55rem;cursor:pointer;font-size:0.95em;}
.civ-ux-mount .panel{margin-bottom:0.38em;}
.civ-ux-panel-scope.civ-cs > .panel{margin-bottom:0;padding:0.32em 0.45em;
  border-color:rgba(212,175,90,0.2);box-shadow:0 1px 0 rgba(0,0,0,0.2);}
.civ-ux-panel-scope.civ-cs > .civ-v-section-hd{
  margin:0.65em 0 0.05em;padding:0.38em 0 0.22em;
  border-bottom:1px solid rgba(212,175,90,0.32);flex-shrink:0;}
.civ-ux-panel-scope.civ-cs > .civ-v-section-hd:first-child{margin-top:0;}
.civ-ux-panel-scope.civ-cs > .civ-v-card{margin-bottom:0;padding:0.38em 0.48em;}
.civ-ux-panel-scope.civ-cs .ptitle{margin-bottom:0.22em;padding-bottom:0.14em;}
.civ-ux-panel-scope.civ-cs .food-grow-block{margin:0.15em 0 0.22em;}
.civ-ux-panel-scope.civ-cs .okolica-toolbar{margin:0.12em 0 0.18em;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar{flex-wrap:wrap;overflow-x:visible;overflow-y:visible;align-items:flex-start;gap:0.2em 0.35em;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar > .muted{flex:0 0 100%;margin-right:0;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));flex:1 1 100%;width:100%;min-width:0;gap:0.18em 0.24em;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles button{
  font-size:0.66em;padding:0.1em 0.26em;width:100%;box-sizing:border-box;justify-content:center;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles button.okolica-profile-btn{gap:0.24em;padding:0.12em 0.32em;}
.civ-ux-panel-scope.civ-cs .section-blurb,
.civ-ux-panel-scope.civ-cs .civ-v-section-blurb{margin:0.08em 0 0.28em;}
.civ-v-left-col{display:flex!important;flex-direction:column!important;flex:1;min-height:0;width:100%;gap:0;}
.civ-v-right-col{display:flex!important;flex-direction:column!important;flex:1;min-height:0;width:100%;height:100%!important;gap:0;}
.civ-v-right-head{flex:0 0 auto;padding-bottom:0.38em;margin-bottom:0.28em;border-bottom:1px solid rgba(212,175,90,0.28);}
.civ-v-left-main{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-top:0.12em;margin-top:0.2em;}
.civ-v-left-main::-webkit-scrollbar{width:5px;}
.civ-v-left-main::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-v-left-main.civ-v-left-main-split{overflow:hidden;display:flex;flex-direction:column;padding-top:0;}
.civ-v-right-main{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:0.06em;padding-top:0.12em;padding-bottom:0.85em;}
.civ-v-right-main::-webkit-scrollbar{width:5px;}
.civ-v-right-main::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-v-right-main > .panel:last-child{margin-bottom:0;}
.civ-v-right-foot{flex:0 0 auto;margin-top:auto;margin-left:-0.36rem;margin-right:-0.36rem;margin-bottom:-0.42rem;
  padding:0.58em 0.36rem 0.5rem;border-top:2px solid rgba(212,175,90,0.58);
  background:linear-gradient(180deg,rgba(5,8,14,0.99) 0%,rgba(2,4,8,1) 100%);
  position:relative;z-index:0;
  box-shadow:inset 0 1px 0 rgba(232,216,138,0.18);}
.civ-v-right-foot .panel{background:transparent!important;border:none!important;padding:0!important;box-shadow:none!important;}
.civ-w4-surowce-foot{padding:0.62em 0.72em;border:1px solid rgba(212,175,90,0.34);border-radius:10px;
  background:rgba(9,13,22,0.96);box-shadow:0 2px 10px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05);}
.civ-w4-surowce-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.42em;cursor:help;}
.civ-w4-surowce-title{font-size:0.62em;letter-spacing:0.16em;text-transform:uppercase;color:#a08030;font-weight:700;}
.civ-w4-surowce-detail{font-size:0.56em;letter-spacing:0.14em;text-transform:uppercase;color:#a08030;text-decoration:none;}
.civ-w4-surowce-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.32em;}
.civ-w4-surowce-item{display:inline-flex;align-items:center;gap:0.48em;font-size:0.74em;color:#c8b898;
  border:1px solid rgba(232,216,138,0.18);border-radius:8px;padding:0.48em 0.58em;line-height:1.2;}
.civ-w4-surowce-item.active{color:#e8d898;}
.civ-w4-surowce-item.potential{opacity:.46;color:#9a9078;}
.civ-w4-surowce-item.potential .civ-w4-res-ic{filter:grayscale(.65);}
.civ-w4-surowce-sub{font-size:0.58em;letter-spacing:0.12em;text-transform:uppercase;color:#7a7055;margin:0.38em 0 0.28em 2px;}
.civ-w4-res-ic{display:inline-flex;align-items:center;justify-content:center;width:1.12em;height:1.12em;color:#e8d88a;flex-shrink:0;line-height:0;}
.civ-w4-res-ic svg{width:100%;height:100%;display:block;}
.civ-v-icon-rail-mount{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;margin:0!important;width:100%;height:auto;}
.civ-v-icon-rail{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:2mm;margin:0 auto;padding:0;border:none;width:100%;height:auto;line-height:1;
  --civ-tab-icon:${CITY_PANEL_ICON_GLYPH_EM}em;}
.civ-v-icon-rail.civ-v-icon-rail-vert{flex-direction:column;justify-content:flex-start;align-items:center;gap:10px;height:auto;width:100%;padding:0;
  --civ-tab-icon:${CITY_PANEL_ICON_RAIL_VERT_EM}em;}
.civ-v-icon-rail-w3 .civ-v-icon-btn{width:46px;height:46px;min-width:46px;max-width:46px;padding:0;border-radius:50%;
  border:2px solid #a08030;background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);color:#e8d88a;
  box-shadow:none;transition:box-shadow .15s ease,border-color .15s ease,transform .12s ease;}
.civ-v-icon-rail-w3 .civ-v-icon-btn.on{border-color:#e8d88a;background:radial-gradient(circle at 38% 30%,#2a2416,#12100a);
  color:#f4e6a8;box-shadow:0 0 14px rgba(232,216,138,0.3),inset 0 2px 4px rgba(232,216,138,0.12);}
.civ-v-icon-rail-w3 .civ-v-icon-btn:hover{transform:translateY(-1px);border-color:#e8d88a;
  box-shadow:0 0 12px rgba(232,216,138,0.22);}
.civ-v-icon-rail-w3 .civ-v-icon-glyph{width:22px;height:22px;font-size:22px;}
.civ-ux-left-icon-rail .civ-v-icon-rail-vert .civ-v-icon-glyph{font-size:26px;width:26px;height:26px;}
.civ-ux-right-icon-rail .civ-v-icon-rail-vert .civ-v-icon-glyph{font-size:26px;width:26px;height:26px;}
.civ-v-icon-btn{display:flex;align-items:center;justify-content:center;flex:0 0 auto;padding:0.14em;
  border:2px solid var(--civ-gold-border, rgba(212,175,90,0.28));border-radius:var(--civ-radius-btn, 9px);
  background:rgba(8,10,18,0.35);color:var(--civ-gold-dim, #a08030);cursor:pointer;font-family:inherit;text-align:center;line-height:1;
  box-shadow:0 3px 14px rgba(0,0,0,0.38),0 1px 0 rgba(255,255,255,0.04) inset;
  transition:background .12s ease,border-color .12s ease,box-shadow .12s ease,transform .12s ease;}
.civ-v-icon-btn:hover{background:rgba(232,216,138,0.08);border-color:var(--civ-gold-border-strong, rgba(212,175,90,0.48));
  box-shadow:0 5px 18px rgba(0,0,0,0.48),0 0 10px rgba(232,216,138,0.12);transform:translateY(-1px);}
.civ-v-icon-btn.on{border-color:var(--civ-gold-primary, var(--gold));background:rgba(232,216,138,0.12);
  box-shadow:0 0 14px rgba(232,216,138,0.22),0 6px 20px rgba(0,0,0,0.45);transform:translateY(-1px);color:var(--civ-gold-primary, var(--gold));}
.civ-v-icon-glyph svg.civ-cp-rail-ic{width:100%;height:100%;color:currentColor;}
.civ-v-icon-btn.on .civ-cp-rail-ic{color:var(--civ-gold-primary, var(--gold));}
.civ-v-icon-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.civ-v-icon-glyph{font-size:var(--civ-tab-icon);width:1em;height:1em;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,0.45));}
.civ-v-icon-glyph svg{width:100%;height:100%;display:block;}
.civ-v-icon-lbl{display:none;}
.civ-v-caduceus-ic{color:#5a9bd4;}
.civ-v-temple-ic{color:#e0b24a;}
.civ-v-loaf-ic{color:#c89452;display:inline-flex;align-items:center;justify-content:center;}
.civ-v-icon-glyph .civ-v-loaf-ic{width:0.8em;height:0.88em;}
.civ-v-right-main.civ-v-right-main-split{overflow:hidden;display:flex;flex-direction:column;padding-top:0;}
.civ-v-split-pane{display:flex;flex-direction:column;flex:1;min-height:0;width:100%;gap:0;}
.civ-v-split-col{flex:1 1 50%;min-height:0;max-height:50%;display:flex;flex-direction:column;overflow:hidden;padding:0.12em 0;}
.civ-v-split-col + .civ-v-split-col{border-top:1px solid rgba(212,175,90,0.22);padding-top:0.28em;}
.civ-v-split-col > .panel{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.civ-v-split-col .list-scroll-fill,
.civ-v-split-col .recruit-scroll.list-scroll-fill{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;}
`;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = el('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
  document.getElementById('civ-city-screen-css')?.remove();
}

// ---------------------------------------------------------------------------
// Static (placeholder) panels -- faithful to the mockup; light up later
// ---------------------------------------------------------------------------

function PH(): string {
  return '<span class="muted" style="font-size:0.66em;border:1px solid var(--border);border-radius:3px;padding:0 0.3em;">podgląd</span>';
}

// ---------------------------------------------------------------------------
// Lewa kolumna — społeczeństwo (B2: Mieszkańcy, Porządek, Zdrowie)
// ---------------------------------------------------------------------------

function buildingHappinessSum(cityId: string, data: GameData, era: number): number {
  const builtIds = cfg.getBuiltBuildingIds?.(cityId) ?? [];
  let sum = 0;
  for (const bid of builtIds) {
    const bdef = data.buildings.find(b => b.id === bid);
    if (bdef && typeof bdef.baza.zadowolenie === 'number') {
      const lvl = buildingLevelForEpoch(bdef.epokaWejscia, era, bdef.maksPoziom);
      sum += buildingEffectAtLevel(bdef.baza.zadowolenie, lvl);
    }
  }
  return sum;
}

/** B2-Q7=1C: pełny model % z silnika lub lokalnie (evaluateOrderFromBreakdown). */
function resolveOrderState(city: City, data: GameData): { state: OrderState; fromEngine: boolean } {
  const live = cfg.getOrderState?.(city.id);
  const computed = computeOrderStateLocal(city, data);
  if (live && live.szPct !== undefined) {
    return {
      state: {
        ...live,
        szLines: live.szLines?.length ? live.szLines : computed.state.szLines,
        // Prawo/Porządek na żywo — wojsko na heksie miasta (getUnitsAt), nie tylko stan z końca tury.
        prawPct: computed.state.prawPct,
        prawLines: computed.state.prawLines,
        porPct: computed.state.porPct,
        bandLabel: computed.state.bandLabel,
        porzadek: computed.state.porzadek,
      },
      fromEngine: true,
    };
  }
  return computed;
}

function computeOrderStateLocal(city: City, data: GameData): { state: OrderState; fromEngine: boolean } {
  const difficulty = cfg.difficulty ?? 'normal';
  const era = cfg.getEpoch?.(city.ownerId) ?? 1;
  const builtIds = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const op = loadOrderParams(data.societyParams, difficulty);
  const cp = loadCultureParams(data.societyParams, difficulty);

  const relState = cfg.getReligionState?.(city.id);
  const cultState = cfg.getCultureState?.(city.id);
  const kulturaSkumulowana = cultState?.kulturaSuma
    ?? (city as { kultura?: number }).kultura
    ?? 0;
  const haKult = cultureHappiness({ kulturaSkumulowana, ownCultureShare: 1 }, cp);
  const haRel = relState?.wplywSzczescie ?? 0;

  const ws = city.wealthState ?? freshWealthState();
  const wealthParams = data.econParams
    ? loadWealthParams(data.econParams as unknown as RawWealthParamsJson, difficulty)
    : null;
  const haWealth = wealthParams ? wealthZadowolenie(ws.poziom ?? 0, wealthParams) : 0;

  const gCount = cfg.getUnitsAt?.(city.q, city.r)?.length ?? 0;
  const podzial = readPodzialHandlu(city, data);
  // Sandbox playtest miasta (drawer w main.ts): bez jednostek na starcie — nie pokazuj „buntu skrajnego” w T1.
  const playtestSandbox = typeof location !== 'undefined' && (
    /PLAYTEST-MIASTO/i.test(location.pathname || '') ||
    new URLSearchParams(location.search).get('playtest') === 'miasto'
  );
  const allCities = cfg.getCities?.() ?? [];
  const gameTurn = cfg.getTurn?.() ?? 1;
  const stolicaBonus = stolicaEasyBonusActive(difficulty, gameTurn, city, allCities);

  const ordPct = evaluateOrderFromBreakdown(
    {
      difficulty,
      era,
      population: city.population,
      buildingZadowolenie: buildingHappinessSum(city.id, data, era),
      haKult,
      haRel,
      haWealth,
      podzialHandlu: podzial,
      atWar: false,
      hasSwiatynia: builtIds.includes('swiatynia'),
      hasAmfiteatr: cityHasAmfiteatrLine(builtIds),
      stolicaEasyBonus: stolicaBonus,
    },
    {
      difficulty,
      era,
      population: city.population,
      garnizonCount: gCount,
      hasRatusz: builtIds.includes('ratusz'),
      hasPretorium: builtIds.includes('pretorium'),
      hasSad: builtIds.includes('sad'),
      hasPalac: builtIds.includes('palac'),
      brakGarnizonuKara: !playtestSandbox && city.population >= 6 && gCount === 0,
      stolicaEasyBonus: stolicaBonus,
    },
    data.societyParams,
    difficulty,
  );

  const grace = city.revoltGraceRemaining;
  const revoltWarning = grace != null && grace > 0;

  return {
    state: {
      szczescie: Math.round(ordPct.sz.netto * 10) / 10,
      porzadek: ordPct.prawo.netto,
      szPct: ordPct.sz.szPct,
      prawPct: ordPct.prawo.prawPct,
      porPct: ordPct.porPct,
      bandLabel: ordPct.bandLabel,
      szLines: ordPct.sz.lines,
      prawLines: ordPct.prawo.lines,
      progT1: op.progT1,
      progT2: op.progT2,
      revoltGraceRemaining: grace ?? undefined,
      revoltWarning: revoltWarning || undefined,
      rebelState: city.rebelState,
    },
    fromEngine: false,
  };
}

function resolveCityHealth(city: City, map: GameMap, data: GameData): { total: number; lines: CityHealthLine[]; fromEngine: boolean } {
  const live = cfg.getCityHealth?.(city.id);
  if (live) return { ...live, fromEngine: true };
  const builtIds = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const tiles = cityWorkedTilesForEconomy(city, map);
  const br = computeCityHealthBreakdown(
    city.population, tiles, builtIds, data.societyParams, cfg.difficulty ?? 'normal',
    { city, map },
  );
  return { ...br, fromEngine: false };
}

function renderSpoleczenstwo(mount: HTMLElement, city: City, data: GameData): void {
  const { state, fromEngine } = resolveOrderState(city, data);
  const badge = fromEngine ? '' : PH();
  mount.className = 'panel panel-tight cs-order';
  mount.innerHTML = '';
  appendSectionTitleWithDetails(
    mount,
    `<span>Porządek · ${city.population} mieszk.</span>${badge}`,
    () => buildPorzadekDetailCard(city, state),
  );
  const por = state.porPct ?? 0;
  const band = porPctBand(por);
  const bandName = state.bandLabel ?? POR_BAND_LABELS[band];
  const gCount = cfg.getUnitsAt?.(city.q, city.r)?.length ?? 0;
  const porCls = por >= 70 ? 'green' : por >= 50 ? 'gold' : 'red';
  const orderChips: TabIndicatorChip[] = [
    { icon: cityPanelChipIcon('cp-order', 14), label: 'Stan', value: bandName, cls: porCls },
    { icon: cityPanelChipIcon('chip-trend-up', 14), label: 'Efekt', value: orderBandEffectShort(band), cls: porCls },
    { icon: cityPanelChipIcon('chip-garrison', 14), label: 'Garnizon', value: `${gCount} jedn.`, cls: gCount >= 3 ? 'green' : gCount > 0 ? 'gold' : 'muted' },
  ];
  if (state.revoltWarning && state.revoltGraceRemaining != null) {
    orderChips.push({
      icon: cityPanelChipIcon('chip-warning', 14),
      label: 'Bunt',
      value: `${state.revoltGraceRemaining} tur`,
      cls: 'red',
      title: 'Brak reakcji — ryzyko rebelii',
    });
  } else if (state.rebelState) {
    orderChips.push({ icon: cityPanelChipIcon('chip-death', 14), label: 'Rebelia', value: 'aktywna', cls: 'red' });
  }
  appendTabIndicators(mount, orderChips);

  appendW4PctMetricBlock(
    mount,
    pctSubheadHtml('chip-heart', 'Szczęście'),
    state.szPct,
    'linear-gradient(90deg,#3a8a5a,#7ad0a0)',
    state.szLines,
    'Brak składników wpływających na szczęście.',
  );
  appendW4PctMetricBlock(
    mount,
    pctSubheadHtml('tb-army', 'Prawo'),
    state.prawPct,
    'linear-gradient(90deg,#3a8a5a,#7ad0a0)',
    state.prawLines,
    'Brak składników wpływających na prawo.',
  );

  appendW4PctMetricBlock(
    mount,
    pctSubheadHtml('cp-order', 'Porządek łącznie'),
    por,
    'linear-gradient(90deg,#a08030,#e8d88a)',
    undefined,
    '',
    (porBlock) => {
      if (state.revoltWarning && state.revoltGraceRemaining != null) {
        const st = el('div', 'civ-w4-order-banner crit');
        st.innerHTML = `${cityPanelChipIconWrap('chip-warning', 16)}<span>Grozi bunt · ${state.revoltGraceRemaining} tur</span>`;
        porBlock.appendChild(st);
      } else if (state.rebelState) {
        const st = el('div', 'civ-w4-order-banner rebel');
        st.innerHTML = `${cityPanelChipIconWrap('chip-rebellion', 16)}<span>Rebelia aktywna</span>`;
        porBlock.appendChild(st);
      } else {
        const tn = orderTierUi(state);
        const cls = tn === 0 ? 'ok' : 'warn';
        const ic = tn === 0 ? 'chip-star' : 'chip-warning';
        const st = el('div', `civ-w4-order-banner ${cls}`);
        st.innerHTML = `${cityPanelChipIconWrap(ic, 16)}<span>${bandName}</span>`;
        porBlock.appendChild(st);
      }
    },
  );
}

function buildPorzadekDetailCard(city: City, state: OrderState): HTMLDivElement {
  const por = state.porPct ?? 0;
  const sz = state.szPct ?? 0;
  const praw = state.prawPct ?? 0;
  const band = porPctBand(por);
  const bandName = state.bandLabel ?? POR_BAND_LABELS[band];
  const podzial = readPodzialHandlu(city, gameData());
  const gCount = cfg.getUnitsAt?.(city.q, city.r)?.length ?? 0;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Porządek — szczegóły</span>'));

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Miasto ma trzy warstwy stabilności: Szczęście (czy ludzie są zadowoleni), Prawo (czy władza trzyma kontrolę) ' +
    'i Porządek łącznie (jedna liczba decydująca o karach i ryzyku buntu).';
  card.appendChild(intro);

  appendDetailSection(card, 'Stan tego miasta');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Porządek łącznie', `${Math.round(por)}% — ${bandName}`);
  gridDetailRow(g0, 'Szczęście', `${Math.round(sz)}%`);
  gridDetailRow(g0, 'Prawo', `${Math.round(praw)}%`);
  if (state.revoltWarning && state.revoltGraceRemaining != null) {
    gridDetailRow(g0, 'Alert buntu', `${state.revoltGraceRemaining} tur(y) na reakcję`);
  }
  if (state.rebelState) {
    gridDetailRow(g0, 'Rebelia', 'Miasto pod kontrolą rebeliantów');
  }

  appendDetailSection(card, `Co znaczy „${bandName}”?`);
  const bandNote = el('div', 'dc-note');
  bandNote.style.fontStyle = 'normal';
  const bandExplain: Record<string, string> = {
    lad: '≥90% Porządku — bonus do pracy i handlu. Miasto w pełni stabilne.',
    spokoj: '70–89% — normalna gra, bez kar i bez bonusów.',
    napiecie: '50–69% — lekkie napięcie: praca spada o ~5%. Czas reagować, zanim spadnie dalej.',
    niepokoj: '30–49% — wyraźne kary na plony, wolniejszy wzrost. Możliwy chip niepokojów.',
    bunt: '10–29% — migracja ludności, ryzyko buntu. Pilna interwencja.',
    bunt_skrajny: '<10% — alert krytyczny, 2 tury grace → potem rebelia AI (odbicie wojskiem).',
  };
  bandNote.textContent = bandExplain[band] ?? 'Patrz tabela progów poniżej.';
  card.appendChild(bandNote);

  if (state.szLines && state.szLines.length > 0) {
    appendDetailSection(card, 'Składniki Szczęścia (+/−)');
    const gs = appendDetailGrid(card);
    for (const l of state.szLines) {
      gridDetailRow(gs, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  if (state.prawLines && state.prawLines.length > 0) {
    appendDetailSection(card, 'Składniki Prawa (+/−)');
    const gp = appendDetailGrid(card);
    for (const l of state.prawLines) {
      gridDetailRow(gp, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  appendDetailSection(card, 'Zależności — jak to się łączy');
  appendDetailFormula(card, 'PorPct ≈ waga_Sz × SzPct + waga_Prawo × PrawPct');
  appendDetailAlgo(card, 'Łańcuch przyczynowy', [
    'Suwak Zamożność (handel) → wyższy udział zamożności → wyższe Szczęście (niskie podatki).',
    'Budynki (Teatr, Łaźnia, Świątynia…) i kultura/religia → stały plus do Szczęścia.',
    'Zamożność W (poziom) → bonus zadowolenia z bogactwa obywateli.',
    'Garnizon w mieście → głównie Prawo (do 100% przy 5+ jednostkach), nie Szczęście.',
    'Ratusz, Pretorium, Sąd → trwały plus do Prawa.',
    'Duże miasto bez garnizonu → kara Prawa.',
    'PorPct spada → kary na pracę, pieniądz, naukę, wzrost; przy skrajnym spadku bunt.',
    'Sz i Prawo są niezależne — możesz podnieść jedno bez drugiego (np. wojsko bez obniżki podatków).',
  ]);

  appendDetailSection(card, 'Progi PorPct (efekty gameplay)');
  const gt = appendDetailGrid(card);
  gridDetailRow(gt, '≥90% Ład', 'Bonus praca ×1,10, handel ×1,10');
  gridDetailRow(gt, '70–89% Spokój', 'Brak kar');
  gridDetailRow(gt, '50–69% Napięcie', 'Praca ×0,95');
  gridDetailRow(gt, '30–49% Niepokój', 'Kary ~×0,85 plony, wzrost ×0,75');
  gridDetailRow(gt, '10–29% Bunt', 'Kary + migracja ~5%');
  gridDetailRow(gt, '<10% Bunt skrajny', 'Kary max + grace 2 tury → rebelia');

  appendDetailSection(card, 'Szybkie działania (gdy spada Porządek)');
  const actions = el('div', 'dc-note');
  actions.style.fontStyle = 'normal';
  actions.innerHTML = cpInlineIcons(
    `<b>Podnieś Szczęście:</b> przesuń suwak handlu na <b>${HANDEL_ZAMOZNOSC_LABEL}</b> ` +
    `(obecnie ${podzial.procentLuksus}% — im wyżej, tym więcej zamożności z handlu zamiast skarbca/nauki). ` +
    'Długoterminowo: Teatr, Łaźnia, wyższe W.<br><br>' +
    `<b>Podnieś Prawo:</b> stacjonuj wojsko w mieście (obecnie ${gCount} jedn. w garnizonie) ` +
    'lub buduj Ratusz / Pretorium / Sąd.<br><br>' +
    '<span class="muted">Kompromis: więcej zamożności = mniej 💰 i nauki teraz, ale spokojniejsze miasto. ' +
    'Wojsko w mieście = wyższe Prawo, ale koszt utrzymania armii.</span>',
  );
  card.appendChild(actions);

  appendDetailAlgo(card, 'Co robi silnik co turę', [
    'Liczy netto Sz i Prawo z rozpiski (budynki, garnizon, podatki, wojna…).',
    'Przelicza na SzPct i PrawPct (skala zależy od epoki).',
    'Liczy PorPct — od tego zależą mnożniki plonów i ryzyko buntu.',
    'Efekty zdejmują się od razu po poprawie PorPct (bez opóźnienia).',
    'PorPct <10%: licznik grace — brak reakcji → miasto może przejść pod rebeliantów (B2-Q12).',
  ]);

  return card;
}

function renderZdrowie(mount: HTMLElement, city: City, map: GameMap, data: GameData): void {
  const { total, lines, fromEngine } = resolveCityHealth(city, map, data);
  const pos = lines.filter(l => l.value > 0);
  const neg = lines.filter(l => l.value < 0);
  const posSum = pos.reduce((s, l) => s + l.value, 0);
  const negSum = neg.reduce((s, l) => s + l.value, 0);
  mount.innerHTML = '';
  appendSectionTitleWithDetails(
    mount,
    `<span>Zdrowie miasta</span>${fromEngine ? '' : PH()}`,
    () => buildZdrowieDetailCard(total, lines, posSum, negSum),
  );
  const healthChips: TabIndicatorChip[] = [
    {
      icon: cityPanelChipIcon('cp-health', 14),
      label: '= Razem',
      value: signed(total),
      cls: total >= 5 ? 'green' : total >= 0 ? 'gold' : 'red',
    },
    { icon: cityPanelChipIcon('chip-heart', 14), label: 'Plusy', value: signed(posSum), cls: 'green' },
    { icon: cityPanelChipIcon('chip-death', 14), label: 'Minusy', value: String(negSum), cls: negSum < 0 ? 'red' : 'muted' },
  ];
  appendTabIndicators(mount, healthChips);
  appendW4SignedBreakdownSections(
    mount,
    pctSubheadHtml('chip-heart', 'Składniki zdrowia'),
    lines,
    'Brak modyfikatorów zdrowotnych w tym mieście.',
  );
}

function buildZdrowieDetailCard(
  total: number,
  lines: CityHealthLine[],
  posSum: number,
  negSum: number,
): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Zdrowie — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Suma bonusów i kar zdrowotnych — budynki, okolica, choroby. Wpływa na wzrost populacji i szczęście.';
  card.appendChild(intro);
  appendDetailSection(card, 'Podsumowanie');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Plusy', `${posSum >= 0 ? '+' + posSum : posSum}`);
  gridDetailRow(g, 'Minusy', String(negSum));
  gridDetailRow(g, 'Razem', `${total >= 0 ? '+' + total : total}`);
  if (lines.length > 0) {
    appendDetailSection(card, 'Składniki');
    const g2 = appendDetailGrid(card);
    for (const l of lines) {
      gridDetailRow(g2, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  } else {
    appendDetailSection(card, 'Składniki');
    card.appendChild(el('div', 'dc-note', 'Brak modyfikatorów zdrowotnych w tym mieście.'));
  }
  appendDetailAlgo(card, 'Wpływ na rozgrywkę', [
    'Modyfikator zdrowia skaluje przyrost żywności do bufora wzrostu (effectiveFlow).',
    'Wyższe zdrowie = szybszy wzrost; ujemne = wolniejszy lub głód.',
    'Część składników pochodzi z budynków, terenu okolicy i stanu wojny/chorób.',
  ]);
  return card;
}

function normalizeResourceAccess(raw: string[] | { potential: string[]; active: string[] } | undefined): {
  potential: string[];
  active: string[];
  legacy: boolean;
} {
  if (!raw) return { potential: [], active: [], legacy: false };
  if (Array.isArray(raw)) return { potential: [], active: raw, legacy: true };
  return { potential: raw.potential ?? [], active: raw.active ?? [], legacy: false };
}

function appendSurowceGrid(
  parent: HTMLElement,
  labels: string[],
  mode: 'active' | 'potential',
): void {
  if (labels.length === 0) return;
  const grid = el('div', 'civ-w4-surowce-grid');
  for (const nazwa of labels) {
    const row = el('span', `civ-w4-surowce-item ${mode}`);
    row.title = mode === 'active'
      ? `${nazwa} — dostęp aktywny (ulepszenie / bramka spełniona)`
      : `${nazwa} — złoże w zasięgu (potencjał — zbuduj ulepszenie)`;
    row.innerHTML = `${resourceBrandIconHtml(nazwa)}<span>${nazwa}</span>`;
    grid.appendChild(row);
  }
  parent.appendChild(grid);
}

function renderSurowce(mount: HTMLElement, city: City): void {
  mount.innerHTML = '';
  const raw = cfg.getResourceAccess?.(city.id);
  const { potential, active, legacy } = normalizeResourceAccess(raw);
  const wrap = el('div', 'civ-w4-surowce-foot');
  const hd = el('div', 'civ-w4-surowce-hd');
  hd.innerHTML =
    '<span class="civ-w4-surowce-title">Surowce w zasięgu</span>' +
    '<span class="civ-w4-surowce-detail gold">i szczegóły</span>';
  wrap.appendChild(hd);
  attachHoverDetail(hd, () => buildSurowceDetailCard(potential, active, legacy), 220);

  const preview = ['Trzoda', 'Glina', 'Koń', 'Sól'];
  const hasSplit = raw !== undefined && !legacy;
  const hasAny = hasSplit ? (active.length + potential.length > 0) : (raw !== undefined ? active.length > 0 : true);

  if (raw !== undefined && !hasAny) {
    const none = el('div', 'muted');
    none.style.fontSize = '0.72em';
    none.textContent = '(brak surowców w zasięgu miasta)';
    wrap.appendChild(none);
  } else if (hasSplit) {
    if (active.length > 0) {
      const subA = el('div', 'civ-w4-surowce-sub');
      subA.textContent = 'Dostęp aktywny';
      wrap.appendChild(subA);
      appendSurowceGrid(wrap, active, 'active');
    }
    if (potential.length > 0) {
      const subP = el('div', 'civ-w4-surowce-sub');
      subP.textContent = 'Potencjał (złoże)';
      wrap.appendChild(subP);
      appendSurowceGrid(wrap, potential, 'potential');
    }
  } else {
    const items = raw !== undefined ? active : preview;
    appendSurowceGrid(wrap, items, 'active');
  }

  if (raw === undefined) {
    const ph = el('div', 'muted');
    ph.style.cssText = 'font-size:0.68em;margin-top:0.32em;';
    ph.textContent = 'PODGLĄD — czeka hak getResourceAccess';
    wrap.appendChild(ph);
  }

  mount.appendChild(wrap);
}

function buildSurowceDetailCard(
  potential: string[],
  active: string[],
  legacy: boolean,
): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Surowce — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent = legacy
    ? 'Surowce na mapie w zasięgu miasta odblokowują budynki i bonusy (ikona = dostęp). v0.1: tylko boolean dostęp — ilości w wersji 2.0.'
    : 'Potencjał = złoże widoczne w zasięgu (szare). Dostęp aktywny = po ulepszeniu terenu, hodowli na złożu lub bramce brązu (Popalnia + Piec hutniczy).';
  card.appendChild(intro);
  if (active.length > 0) {
    appendDetailSection(card, legacy ? 'Lista' : 'Dostęp aktywny');
    const g = appendDetailGrid(card);
    for (const n of active) gridDetailRow(g, resourceBrandIconHtml(n), n);
  }
  if (!legacy && potential.length > 0) {
    appendDetailSection(card, 'Potencjał (złoże)');
    const g2 = appendDetailGrid(card);
    for (const n of potential) gridDetailRow(g2, resourceBrandIconHtml(n), n);
  }
  appendDetailAlgo(card, 'Mechanika', legacy
    ? [
      'Surowiec w zasięgu = możliwość budowy wymagających go obiektów.',
      'Brak surowca = budynek zablokowany do czasu podboju/heksu z zasobem.',
    ]
    : [
      'Złoże w zasięgu ≠ dostęp — zbuduj ulepszenie (tartak, pastwisko, kopalnia…).',
      'Dostęp aktywny odblokowuje budynki, jednostki i handel surowcem.',
    ]);
  return card;
}

/**
 * Czy etykieta to surowiec mapy (ma dedykowaną ikonę res-* w resources-map/).
 * Reskin A-08: surowce mapy renderujemy przez mapResourceIconSvg, nie generyki.
 */
function isMapResourceLabel(n: string): boolean {
  return (
    n.includes('byd') || n.includes('glin') || n.includes('ceg') ||
    n.includes('koń') || n.includes('kon') || n.includes('horse') ||
    n.includes('sól') || n.includes('sol') || n.includes('salt') ||
    n.includes('drewn') || n.includes('las') ||
    n.includes('kamie') || n.includes('kamien') ||
    n.includes('ruda') || n.includes('braz') || n.includes('brąz') ||
    n.includes('żelaz') || n.includes('zelaz') ||
    n.includes('złot') || n.includes('zlot') ||
    n.includes('owc') || n.includes('lama') ||
    n.includes('węgiel') || n.includes('wegiel') || n.includes('miedz') || n.includes('stal')
  );
}

function resourceBrandKey(nazwa: string): string | null {
  const n = nazwa.toLowerCase();
  if (n.includes('byd')) return 'res-cattle';
  if (n.includes('glin') || n.includes('ceg')) return 'res-clay';
  if (n.includes('koń') || n.includes('kon') || n.includes('horse')) return 'res-horses';
  if (n.includes('sól') || n.includes('sol') || n.includes('salt')) return 'res-salt';
  if (n.includes('drewn')) return 'chip-crate';
  if (n.includes('kamie') || n.includes('kamien')) return 'tb-build';
  if (n.includes('ruda') || n.includes('braz')) return 'res-work';
  if (n.includes('owc')) return 'res-cattle';
  return 'chip-crate';
}

function resourceBrandIconHtml(nazwa: string): string {
  const n = nazwa.toLowerCase();
  // Surowce mapy → dedykowana ikona res-* (resources-map/), reskin z generyków.
  if (isMapResourceLabel(n)) {
    const mapSvg = mapResourceIconSvg(nazwa, 18);
    if (mapSvg) return `<span class="civ-w4-res-ic">${mapSvg}</span>`;
  }
  const key = resourceBrandKey(nazwa) ?? 'chip-crate';
  const svg = brandIconSvg(key, 24);
  if (svg) {
    const sized = svg.replace('<svg ', '<svg width="18" height="18" ');
    return `<span class="civ-w4-res-ic">${sized}</span>`;
  }
  return `<span class="civ-w4-res-ic">${cityPanelChipIcon('chip-crate', 18)}</span>`;
}

function resourceIcon(nazwa: string): string {
  return resourceBrandIconHtml(nazwa);
}

function renderImperiumZywnosc(mount: HTMLElement, _city: City): void {
  mount.innerHTML = '';
  mount.style.display = 'none';
}

function buildKulturaDetailCard(
  city: City,
  view: CityView | null,
  cultState: ReturnType<NonNullable<CityPanelConfig['getCultureState']>>,
  relState: ReturnType<NonNullable<CityPanelConfig['getReligionState']>>,
  data: GameData | null,
): HTMLDivElement {
  const diff = cfg.difficulty ?? 'normal';
  const relParams = data
    ? loadReligionParams(data.societyParams, diff)
    : FALLBACK_RELIGION_PARAMS;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Kultura i Religia — szczegóły</span>'));

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Kultura poszerza granice terytorium miasta i odblokowuje polityki (w przyszłych wersjach). ' +
    'Religia to soft power: wpływa na szczęście, szerzy się na sąsiednie miasta i nadaje tożsamość cywilizacji.';
  card.appendChild(intro);

  appendDetailSection(card, 'Kultura — po co');
  appendDetailAlgo(card, 'Cel kultury', [
    'Kultura to „miękkie” rozszerzanie wpływów — bez wojska zyskujesz więcej pól do pracy (👤 na mapie okolicy).',
    'Im więcej kultury zgromadzisz, tym dalej sięgają granice miasta (+pierścienie wokół centrum).',
    'Kultura dominująca (własna vs obca) wpływa też na szczęście — podbój obcej kultury może obniżyć porządek.',
    'Źródła: budynki (Teatr, Muzeum…), cuda, specjalne bonusy cywilizacji, plony z pól.',
  ]);

  if (cultState) {
    appendDetailSection(card, 'Kultura — stan miasta');
    const gc = appendDetailGrid(card);
    gridDetailRow(gc, 'Suma kultury', String(cultState.kulturaSuma));
    gridDetailRow(gc, 'Przyrost', `+${cultState.przyrost}`);
    gridDetailRow(gc, 'Zasięg granic', `+${cultState.borderRadius} pierścieni`);
    const thresholds = cultState.thresholds;
    const next = thresholds.find(t => t > cultState.kulturaSuma);
    gridDetailRow(gc, 'Następny próg', next !== undefined ? `${next} pkt kultury` : 'Maksymalny zasięg');
    if (cultState.zrodla && cultState.zrodla.length > 0) {
      appendDetailSection(card, 'Źródła kultury');
      const gz = appendDetailGrid(card);
      for (const z of cultState.zrodla) {
        gridDetailRow(gz, z.nazwa, `+${z.wartosc}`);
      }
    }
  } else if (view) {
    appendDetailSection(card, 'Kultura — stan (szacunek)');
    const gc = appendDetailGrid(card);
    gridDetailRow(gc, 'Przyrost z plonów', `${signed(view.kultura)}`);
  }

  appendDetailSection(card, 'Religia — po co w grze');
  const relWhy = el('div', 'dc-note');
  relWhy.style.fontStyle = 'normal';
  relWhy.innerHTML =
    'Religia nie jest „dekoracją” — to <b>trzeci filar stabilności</b> obok podatków (zamożność) i wojska (prawo). ' +
    'Daje powód, by db o jedność imperium, inwestować w świątynie i myśleć o podbojach jako o <b>konwersji</b>, nie tylko o zdobyciu heksu.';
  card.appendChild(relWhy);

  appendDetailAlgo(card, 'Sens mechaniki religii', [
    'Każda cywilizacja ma religię państwową (np. Politeizm, Animizm) — to tożsamość, nie wybór gracza co turę.',
    'Miasta mają skład wyznawców; gdy jedna wiara >50% ludności → religia dominująca.',
    'Twoja religia dominuje → bonus Szczęścia (spokojniejsze miasto, wyższy Porządek).',
    'Obca religia dominuje → kara Szczęścia (tarcie po podboju, ryzyko buntu).',
    'Brak dominującej / mieszanka wierzeń → mała kara (chaos duchowy).',
    'Religia <b>szerzy się</b> na sąsiednie miasta co turę — jak presja kulturowa; Świątynia przyspiesza.',
    'Po podboju miasto <b>konwertuje</b> stopniowo (%) ku religii właściciela — Świątynia przyspiesza.',
    'Strategia: misjonerskie imperium vs tolerancyjne (akceptuj obce miasta, ale płać karą Sz).',
    'Religia łączy się z Porządkiem: wpływ idzie do SzPct → PorPct → kary/bonusy ekonomii.',
  ]);

  appendDetailSection(card, 'Religia — parametry (normal)');
  const gr = appendDetailGrid(card);
  gridDetailRow(gr, 'Próg dominacji', `>${relParams.progDominacjiPct}% wyznawców`);
  gridDetailRow(gr, 'Twoja religia dominuje', `${relParams.zadowolenieDominujaca >= 0 ? '+' : ''}${relParams.zadowolenieDominujaca} Sz`);
  gridDetailRow(gr, 'Obca religia dominuje', String(relParams.karaObca));
  gridDetailRow(gr, 'Brak / mieszanka', String(relParams.karaBrakReligii));
  gridDetailRow(gr, 'Szerzenie bazowe', `${relParams.szybkoscSzerzeniaBazowa} sąsiednie miasto`);
  gridDetailRow(gr, 'Bonus Świątyni (szerzenie)', `+${relParams.swiatyniaBonusSzerzenia}`);
  gridDetailRow(gr, 'Zasięg szerzenia', `${relParams.szerzenieMaxDystans} heksy`);
  gridDetailRow(gr, 'Konwersja po podboju', `${relParams.konwersjaBazaPct}% (+${relParams.konwersjaSwiatyniaPct}% ze Świątynią)`);

  if (relState) {
    appendDetailSection(card, 'Religia — stan miasta');
    const gs = appendDetailGrid(card);
    gridDetailRow(gs, 'Dominująca', relState.dominujaca);
    gridDetailRow(gs, 'Udział wyznawców', `${relState.udzialPct}%`);
    gridDetailRow(gs, 'Wpływ na Szczęście', `${relState.wplywSzczescie >= 0 ? '+' : ''}${relState.wplywSzczescie}`);
    if (relState.przyrostWiernych != null) {
      gridDetailRow(gs, 'Szerzenie', `${relState.przyrostWiernych >= 0 ? '+' : ''}${relState.przyrostWiernych} wiernych`);
    }
    if (relState.zrodla && relState.zrodla.length > 0) {
      appendDetailSection(card, 'Składniki religii');
      const gz = appendDetailGrid(card);
      for (const z of relState.zrodla) {
        gridDetailRow(gz, z.nazwa, `${z.wartosc >= 0 ? '+' : ''}${z.wartosc}`);
      }
    }
  } else {
    appendDetailSection(card, 'Religia — stan');
    card.appendChild(el('div', 'dc-note', 'Brak danych silnika (hak getReligionState) — wartości z parametów powyżej.'));
  }

  appendDetailSection(card, 'Polityki (plan)');
  const pol = el('div', 'dc-note');
  pol.style.fontStyle = 'normal';
  pol.textContent =
    'Odblokowanie polityk społecznych za progi kultury — funkcja planowana; dziś kultura głównie poszerza granice i wpływa na szczęście.';
  card.appendChild(pol);

  return card;
}

function renderKultura(mount: HTMLElement, city: City, view: CityView | null): void {
  mount.innerHTML = '';
  const cultState = cfg.getCultureState?.(city.id) ?? undefined;
  const data = gameData();
  const empire = resolveEmpireSnap(city, activeMap, data);

  appendSectionTitleWithDetails(
    mount,
    '<span>Kultura</span>',
    () => view
      ? buildTopBarKulturaDetailCard(city, view, empire)
      : buildKulturaDetailCard(city, view, cultState ?? null, null, data),
  );

  const kultPerTurn = cultState?.przyrost ?? view?.kultura ?? 0;
  const cultChips: TabIndicatorChip[] = [
    {
      icon: cityPanelChipIcon('res-culture', 14),
      label: 'Przyrost',
      value: signed(Math.round(kultPerTurn)),
      cls: kultPerTurn > 0 ? 'gold' : 'muted',
    },
  ];

  if (cultState) {
    const thresholds = cultState.thresholds;
    const prev: number = thresholds.filter((t): t is number => t <= cultState.kulturaSuma).pop() ?? 0;
    const next: number | undefined = thresholds.find(t => t > cultState.kulturaSuma);
    if (next !== undefined && cultState.przyrost > 0) {
      const remain = next - cultState.kulturaSuma;
      const etaC = Math.max(1, Math.ceil(remain / cultState.przyrost));
      cultChips.push({
        icon: cityPanelChipIcon('chip-map', 14),
        label: 'Progi',
        value: `~${etaC} ${tury(etaC)}`,
        cls: 'gold',
        title: `Do kolejnego progu (${next} ${cityPanelChipIcon('res-culture', 14)})`,
      });
    }
    cultChips.push({
      icon: cityPanelChipIcon('chip-map', 14),
      label: 'Zasięg',
      value: `+${cultState.borderRadius}`,
      cls: 'green',
      title: 'Promień granic z kultury',
    });
  } else if (view && view.kultura !== 0) {
    cultChips.push({
      icon: cityPanelChipIcon('res-culture', 14),
      label: 'Zasięg',
      value: signed(view.kultura),
      cls: 'gold',
    });
  }

  appendTabIndicators(mount, cultChips);

  const kultLines: BreakdownLine[] = cultState?.zrodla?.map(z => ({ label: z.nazwa, value: z.wartosc })) ?? [];
  if (kultLines.length === 0 && view && view.kultura !== 0) {
    kultLines.push({ label: 'Przyrost z miasta', value: view.kultura });
  }
  appendW4SignedBreakdownSections(
    mount,
    pctSubheadHtml('res-culture', 'Kultura — składniki'),
    kultLines,
    'Brak rozpisanych źródeł kultury (patrz przyrost powyżej).',
  );

  if (cultState) {
    const thresholds = cultState.thresholds;
    const prev: number = thresholds.filter((t): t is number => t <= cultState.kulturaSuma).pop() ?? 0;
    const next: number | undefined = thresholds.find(t => t > cultState.kulturaSuma);
    let pct = 100;
    if (next !== undefined) {
      const span = next - prev;
      pct = span > 0 ? Math.round(Math.min(100, Math.max(0, (cultState.kulturaSuma - prev) / span * 100))) : 0;
    }

    const block = el('div', 'food-grow-block');
    const track = el('div', 'food-grow-track');
    track.style.borderColor = '#503080';
    track.innerHTML =
      `<div class="food-grow-fill" style="width:${pct}%;background:linear-gradient(180deg,#c070ff,#6030a0);"></div>` +
      `<span class="food-grow-loaf" aria-hidden="true">${cityPanelChipIconWrap('res-culture', 14)}</span>`;
    block.appendChild(track);

    const pair = el('div', 'food-stat-pair');
    const statK = el('div', 'food-stat');
    statK.innerHTML =
      `<span class="food-stat-lbl">${cityPanelChipIconWrap('res-culture', 14)} Kultura</span>` +
      `<span class="food-stat-val gold">${cultState.kulturaSuma}${next !== undefined ? ` / ${next}` : ''}</span>`;
    const statG = el('div', 'food-stat');
    statG.style.textAlign = 'right';
    statG.innerHTML =
      `<span class="food-stat-lbl">Granice · +</span>` +
      `<span class="food-stat-val gold">+${cultState.borderRadius} · +${cultState.przyrost}</span>`;
    pair.appendChild(statK);
    pair.appendChild(statG);
    block.appendChild(pair);
    mount.appendChild(block);
  } else {
    const kult = view ? view.kultura : 0;
    const row = el('div', 'rsb');
    row.innerHTML = `<span class="gold">${cityPanelChipIconWrap('res-culture', 14)} ${signed(kult)}</span><span class="muted">podgląd</span>`;
    mount.appendChild(row);
  }
}

function renderReligia(mount: HTMLElement, city: City, view: CityView | null): void {
  mount.innerHTML = '';
  const relState = cfg.getReligionState?.(city.id) ?? null;
  const data = gameData();
  const empire = resolveEmpireSnap(city, activeMap, data);

  appendSectionTitleWithDetails(
    mount,
    `<span>Religia</span>${relState ? '' : PH()}`,
    () => {
      if (view) return buildTopBarReligiaDetailCard(city, view, empire, data);
      const card = el('div', 'detail-card');
      card.appendChild(el('div', 'dc-h', `<span>${cityPanelChipIconWrap('res-religion', 14)} Religia — szczegóły</span>`));
      if (relState) {
        const g = appendDetailGrid(card);
        gridDetailRow(g, 'Dominująca', relState.dominujaca);
        gridDetailRow(g, 'Udział', `${relState.udzialPct}%`);
        gridDetailRow(g, 'Wpływ na Sz', `${relState.wplywSzczescie >= 0 ? '+' : ''}${relState.wplywSzczescie}`);
      } else {
        card.appendChild(el('div', 'dc-note', 'Brak danych silnika (hak getReligionState).'));
      }
      return card;
    },
  );

  const relChips: TabIndicatorChip[] = [];
  if (relState) {
    relChips.push({
      icon: cityPanelChipIcon('res-religion', 14),
      label: shortIndLabel(relState.dominujaca, 12),
      value: `${relState.udzialPct}%`,
      cls: 'gold',
      title: relState.dominujaca,
    });
    relChips.push({
      icon: cityPanelChipIcon('chip-happiness', 14),
      label: 'Sz',
      value: `${relState.wplywSzczescie >= 0 ? '+' : ''}${relState.wplywSzczescie}`,
      cls: relState.wplywSzczescie >= 0 ? 'green' : 'red',
      title: 'Wpływ na szczęście',
    });
    if (relState.przyrostWiernych != null) {
      relChips.push({
        icon: '✦',
        label: 'Wierni',
        value: `${signed(Math.round(relState.przyrostWiernych))}`,
        cls: relState.przyrostWiernych > 0 ? 'green' : 'muted',
      });
    }
  } else if (empire.stateReligion) {
    relChips.push({
      icon: cityPanelChipIcon('res-religion', 14),
      label: 'Państwo',
      value: shortIndLabel(empire.stateReligion, 14),
      cls: 'gold',
    });
  }
  appendTabIndicators(mount, relChips);

  const relLines: BreakdownLine[] = relState?.zrodla?.map(z => ({ label: z.nazwa, value: z.wartosc })) ?? [];
  if (relState) {
    if (relState.wplywSzczescie !== 0 && !relLines.some(l => /szczęście/i.test(l.label))) {
      relLines.push({ label: 'Wpływ na szczęście', value: relState.wplywSzczescie });
    }
    if (relState.przyrostWiernych != null && relState.przyrostWiernych !== 0
        && !relLines.some(l => /szerzenie/i.test(l.label))) {
      relLines.push({ label: 'Szerzenie wiernych', value: relState.przyrostWiernych });
    }
  }
  appendW4SignedBreakdownSections(
    mount,
    pctSubheadHtml('res-religion', 'Religia — składniki'),
    relLines,
    'Brak rozpisanych składników religii w tym mieście.',
  );

  if (relState) {
    const sum = el('div', 'rsb civ-w4-rel-summary');
    sum.style.cssText = 'margin-top:0.35em;font-size:0.82em;display:flex;justify-content:space-between;align-items:center;gap:0.35em;flex-wrap:wrap;';
    const szCls = relState.wplywSzczescie >= 0 ? 'green' : 'red';
    sum.innerHTML =
      `<span style="color:#e8e0c8;">${relState.dominujaca} / kult państwa</span>` +
      `<span class="${szCls} val">${relState.udzialPct}% · ${relState.wplywSzczescie >= 0 ? '+' : ''}${relState.wplywSzczescie}</span>`;
    mount.appendChild(sum);
  }
}

function statChip(icon: string, label: string, value: string, cls: string): string {
  const iconPart = icon.startsWith('<')
    ? `<span class="civ-cs-chip-ic-wrap">${icon}</span>`
    : icon;
  const head = iconPart ? `${iconPart}<span>${label}</span>` : label;
  return `<span class="chip"><span class="cl">${head}</span><span class="cv ${cls}">${value}</span></span>`;
}

function pctSubheadHtml(brandId: string, text: string): string {
  return `${cityPanelChipIconWrap(brandId, 14)}<span>${text}</span>`;
}

type TabIndicatorChip = { icon: string; label: string; value: string; cls?: string; title?: string };

function appendTabIndicators(mount: HTMLElement, chips: TabIndicatorChip[]): void {
  if (chips.length === 0) return;
  const row = el('div', 'chip-row civ-tab-indicators');
  row.innerHTML = chips.map(c => {
    const chipHtml = statChip(c.icon, c.label, c.value, c.cls ?? '');
    if (!c.title) return chipHtml;
    return chipHtml.replace('<span class="chip">', `<span class="chip" title="${c.title.replace(/"/g, '&quot;')}">`);
  }).join('');
  mount.appendChild(row);
}

function shortIndLabel(text: string, max = 13): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function orderBandEffectShort(band: ReturnType<typeof porPctBand>): string {
  switch (band) {
    case 'lad': return 'Bonus ×1,10';
    case 'spokoj': return 'Brak kar';
    case 'napiecie': return 'Praca ×0,95';
    case 'niepokoj': return 'Kary plony/wzrost';
    case 'bunt': return 'Migracja, bunt';
    case 'bunt_skrajny': return 'Grace → rebelia';
    default: return '';
  }
}

type BreakdownLine = { label: string; value: number };

function appendBreakdownLines(
  mount: HTMLElement,
  lines: BreakdownLine[] | undefined,
  emptyHint: string,
): void {
  const box = el('div', 'or-lines');
  if (!lines || lines.length === 0) {
    const none = el('div', 'muted-line');
    none.textContent = emptyHint;
    box.appendChild(none);
  } else {
    for (const l of lines) {
      const row = el('div', l.value >= 0 ? 'pos' : 'neg');
      row.textContent = `${l.label}: ${l.value >= 0 ? '+' : ''}${l.value}`;
      box.appendChild(row);
    }
  }
  mount.appendChild(box);
}

function appendPctBreakdownBlock(
  mount: HTMLElement,
  title: string,
  pct: number | undefined,
  barColor: string,
  lines: BreakdownLine[] | undefined,
  emptyHint: string,
): void {
  const block = el('div', 'civ-breakdown-block');
  const sub = el('div', 'subhd');
  if (title.includes('<')) sub.innerHTML = title;
  else sub.textContent = title;
  block.appendChild(sub);
  if (pct != null) {
    const row = el('div', 'or-r');
    row.innerHTML = `<span class="or-l">Stan</span><span><b>${Math.round(pct)}%</b></span>`;
    block.appendChild(row);
    const barWrap = el('div', 'or-bar');
    const fill = el('div', 'or-fill');
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    fill.style.background = barColor;
    barWrap.appendChild(fill);
    block.appendChild(barWrap);
  }
  appendBreakdownLines(block, lines, emptyHint);
  mount.appendChild(block);
}

function appendSignedBreakdownSections(
  mount: HTMLElement,
  title: string,
  lines: BreakdownLine[],
  emptyHint: string,
): void {
  const pos = lines.filter(l => l.value > 0);
  const neg = lines.filter(l => l.value < 0);
  const zero = lines.filter(l => l.value === 0);
  const block = el('div', 'civ-breakdown-block');
  const sub = el('div', 'subhd');
  if (title.includes('<')) sub.innerHTML = title;
  else sub.textContent = title;
  block.appendChild(sub);
  if (lines.length === 0) {
    appendBreakdownLines(block, undefined, emptyHint);
  } else {
    if (pos.length > 0) {
      const plusHd = el('div', 'muted');
      plusHd.style.cssText = 'font-size:0.68em;margin:0.08em 0 0.1em;text-transform:uppercase;letter-spacing:0.04em;';
      plusHd.textContent = 'Na plus';
      block.appendChild(plusHd);
      appendBreakdownLines(block, pos, '');
    }
    if (neg.length > 0) {
      const minusHd = el('div', 'muted');
      minusHd.style.cssText = 'font-size:0.68em;margin:0.22em 0 0.1em;text-transform:uppercase;letter-spacing:0.04em;';
      minusHd.textContent = 'Na minus';
      block.appendChild(minusHd);
      appendBreakdownLines(block, neg, '');
    }
    if (zero.length > 0) {
      appendBreakdownLines(block, zero, '');
    }
  }
  mount.appendChild(block);
}

/** Rozpiska +/- w stylu W4 v2 (Zdrowie · Kultura · Religia). */
function appendW4SignedBreakdownSections(
  mount: HTMLElement,
  titleHtml: string,
  lines: BreakdownLine[],
  emptyHint: string,
): void {
  const pos = lines.filter(l => l.value > 0);
  const neg = lines.filter(l => l.value < 0);
  const zero = lines.filter(l => l.value === 0);
  const block = el('div', 'civ-breakdown-block');
  const sub = el('div', 'civ-w4-subhd');
  if (titleHtml.includes('<')) sub.innerHTML = titleHtml;
  else sub.textContent = titleHtml;
  block.appendChild(sub);
  if (lines.length === 0) {
    const empty = el('div', 'civ-w4-inline-breakdown');
    empty.innerHTML = `<span class="muted">${emptyHint}</span>`;
    block.appendChild(empty);
  } else {
    if (pos.length > 0) {
      const plusHd = el('div', 'muted');
      plusHd.style.cssText = 'font-size:0.68em;margin:0.08em 0 0.1em;text-transform:uppercase;letter-spacing:0.1em;';
      plusHd.textContent = 'Na plus';
      block.appendChild(plusHd);
      appendBreakdownLines(block, pos, '');
    }
    if (neg.length > 0) {
      const minusHd = el('div', 'muted');
      minusHd.style.cssText = 'font-size:0.68em;margin:0.22em 0 0.1em;text-transform:uppercase;letter-spacing:0.1em;';
      minusHd.textContent = 'Na minus';
      block.appendChild(minusHd);
      appendBreakdownLines(block, neg, '');
    }
    if (zero.length > 0) {
      appendBreakdownLines(block, zero, '');
    }
  }
  mount.appendChild(block);
}

function formatW4InlineBreakdown(lines: BreakdownLine[] | undefined, emptyHint: string): string {
  if (!lines || lines.length === 0) {
    return `<span class="muted">${emptyHint}</span>`;
  }
  return lines.map(l => {
    const cls = l.value >= 0 ? 'pos' : 'neg';
    return `<span class="${cls}">${l.label}: ${l.value >= 0 ? '+' : ''}${l.value}</span>`;
  }).join(' · ');
}

/** Pasek procentowy W4 v2 (Szczęście / Prawo / Porządek) — mockup 1E. */
function appendW4PctMetricBlock(
  mount: HTMLElement,
  titleHtml: string,
  pct: number | undefined,
  barGradient: string,
  lines: BreakdownLine[] | undefined,
  emptyHint: string,
  afterBar?: (block: HTMLElement) => void,
): void {
  const block = el('div', 'civ-breakdown-block civ-w4-metric');
  const sub = el('div', 'civ-w4-subhd');
  if (pct != null) {
    sub.innerHTML = `${titleHtml}<span class="civ-w4-subhd-pct">${Math.round(pct)}%</span>`;
  } else if (titleHtml.includes('<')) {
    sub.innerHTML = titleHtml;
  } else {
    sub.textContent = titleHtml;
  }
  block.appendChild(sub);
  if (pct != null) {
    const barWrap = el('div', 'civ-w4-pct-bar');
    const fill = el('div', 'civ-w4-pct-fill');
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    fill.style.background = barGradient;
    barWrap.appendChild(fill);
    block.appendChild(barWrap);
  }
  if ((lines && lines.length > 0) || emptyHint) {
    const sumEl = el('div', 'civ-w4-inline-breakdown');
    sumEl.innerHTML = formatW4InlineBreakdown(lines, emptyHint);
    block.appendChild(sumEl);
  }
  if (afterBar) afterBar(block);
  mount.appendChild(block);
}

function renderEkonomiaStrip(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Plony i handel</span>'));
  if (!view) {
    mount.appendChild(el('div', 'muted', 'Brak danych gry'));
    return;
  }

  const foodCls = view.zywnoscNetto > 0 ? 'green' : view.zywnoscNetto < 0 ? 'red' : 'gold';
  const plony = el('div', 'chip-row');
  plony.innerHTML = plonyChipRowHtml(view);
  mount.appendChild(plony);

  appendPodzialHandlu(mount, city, view, data);
}

function appendPodzialHandlu(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  data: GameData | null,
  opts?: { skipSubhd?: boolean },
): void {
  if (!opts?.skipSubhd) {
    const sub = el('div', 'subhd');
    sub.textContent = 'Podział handlu';
    mount.appendChild(sub);
  }

  const split = readPodzialHandlu(city, data);
  const player = city.ownerId === 0;
  const editable = player && !!cfg.onPodzialHandluChange;
  const est = estimateHandelChips(view, split);

  const grid = el('div', 'handel-chip-grid');
  grid.innerHTML =
    statChipBrand('res-treasury', 'Skarb', `+${est.skarb} · ${split.procentPieniadz}%`, 'gold')
      .replace('<span class="chip">', '<span class="chip handel-card-skarb">') +
    statChipBrand('res-science', 'Nauka', `+${est.nauka} · ${split.procentNauka}%`, 'blue')
      .replace('<span class="chip">', '<span class="chip handel-card-nauka">') +
    statChipBrand('chip-happiness', HANDEL_ZAMOZNOSC_LABEL, `+${est.zam} · ${split.procentLuksus}%`, 'happy')
      .replace('<span class="chip">', '<span class="chip handel-card-zam">') +
    statChipBrand('chip-warning', 'Korupcja', `−${est.korupcja} · ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}%`, 'red')
      .replace('<span class="chip">', '<span class="chip handel-korupcja-chip" title="Placeholder — docelowo pełny model korupcji">');
  mount.appendChild(grid);

  const sliders = el('div', 'handel-w4-sliders');
  const makeSlider = (key: keyof PodzialHandluSplit, label: string, cls: string, rowCls = '') => {
    const row = el('div', `slider-row ${rowCls}`.trim());
    const lab = el('label');
    lab.innerHTML = `<span class="${cls}">${label}</span><span class="val ${cls}">${split[key]}%</span>`;
    row.appendChild(lab);
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = '0';
    inp.max = '100';
    inp.step = String(HANDEL_PCT_STEP);
    inp.value = String(split[key]);
    inp.disabled = !editable;
    if (editable) {
      inp.addEventListener('input', () => {
        const updated = adjustHandelSplit(split, key, Number(inp.value));
        cfg.onPodzialHandluChange?.(city.id, { ...updated });
        rerender();
      });
    }
    row.appendChild(inp);
    sliders.appendChild(row);
  };
  makeSlider('procentPieniadz', 'Skarb', 'gold');
  makeSlider('procentNauka', 'Nauka', 'blue', 'slider-nauka');
  makeSlider('procentLuksus', HANDEL_ZAMOZNOSC_LABEL, 'happy');
  mount.appendChild(sliders);

  const sum = split.procentPieniadz + split.procentNauka + split.procentLuksus;
  if (sum !== 100) {
    const sumRow = el('div', 'muted');
    sumRow.style.cssText = 'font-size:0.68em;margin-top:0.12em;';
    sumRow.textContent = `Suma ${sum}% (korygowane)`;
    mount.appendChild(sumRow);
  }
}

/** @deprecated używane przez testy / kompat — prefer renderEkonomiaStrip */
function renderPodzialHandlu(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Podział Handlu</span>'));
  appendPodzialHandlu(mount, city, view, data);
}

function renderWealth(mount: HTMLElement, city: City, data: GameData | null, view: CityView | null = null): void {
  mount.innerHTML = '';
  const ws = city.wealthState ?? freshWealthState();
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const wealthParams = data
    ? loadWealthParams(data.econParams as unknown as RawWealthParamsJson, cfg.difficulty ?? 'normal')
    : null;

  appendSectionTitleWithDetails(mount, '<span>Zamożność</span>', () => {
    if (!wealthParams) {
      const c = el('div', 'detail-card');
      c.appendChild(el('div', 'dc-note', 'Brak danych parametrów zamożności.'));
      return c;
    }
    return buildWealthDetailCard(city, ws, epoch, wealthParams, view);
  });

  if (!wealthParams) return;

  const cap = wealthCap(epoch, wealthParams);
  const prog = wealthProg(ws.poziom, epoch, wealthParams);
  const progRounded = Math.round(prog);
  const atCap = ws.poziom >= cap;
  const mnoz = wealthMnoznik(ws.poziom, wealthParams);
  const szBonus = wealthZadowolenie(ws.poziom, wealthParams);
  const pct = atCap ? 100 : (prog > 0
    ? Math.round(Math.min(100, Math.max(0, (ws.pula / prog) * 100)))
    : 0);
  const zamIn = view ? estimateHandelChips(view, readPodzialHandlu(city, data)).zam : 0;
  const etaW = !atCap && prog > ws.pula && zamIn > 0
    ? Math.max(1, Math.ceil((prog - ws.pula) / zamIn))
    : null;

  appendTabIndicators(mount, [
    {
      icon: 'W',
      label: 'Poziom',
      value: atCap ? `W${ws.poziom} MAX` : `W${ws.poziom}`,
      cls: 'gold',
    },
    { icon: '×', label: 'Skarb', value: mnoz.toFixed(2), cls: 'blue', title: 'Mnożnik pieniądza ze zamożności' },
    { icon: cityPanelChipIcon('chip-happiness', 14), label: 'Sz', value: `+${Math.round(szBonus)}`, cls: 'happy', title: 'Bonus szczęścia z poziomu W' },
    {
      icon: cityPanelChipIcon('chip-map', 14),
      label: 'Do W+1',
      value: atCap ? 'MAX' : (etaW != null ? `~${etaW} ${tury(etaW)}` : '—'),
      cls: atCap ? 'muted' : 'gold',
      title: 'Szacunek przy obecnym udziale Zamożności z handlu',
    },
  ]);

  const block = el('div', 'food-grow-block');
  const track = el('div', 'food-grow-track');
  const barLabel = atCap ? 'MAX' : `${ws.pula} / ${progRounded}`;
  track.innerHTML =
    `<div class="food-grow-fill" style="width:${pct}%"></div>` +
    `<span class="food-grow-loaf" aria-hidden="true">${cityPanelChipIconWrap('res-treasury', 14)}</span>` +
    `<span class="fbtxt">${barLabel}</span>`;
  block.appendChild(track);
  mount.appendChild(block);
}

function buildWealthDetailCard(
  city: City,
  ws: { poziom: number; pula: number },
  epoch: number,
  p: WealthParams,
  view: CityView | null,
): HTMLDivElement {
  const cap = wealthCap(epoch, p);
  const prog = wealthProg(ws.poziom, epoch, p);
  const mnoz = wealthMnoznik(ws.poziom, p);
  const szcz = wealthZadowolenie(ws.poziom, p);
  const rown = wealthRownowaga(ws.poziom, epoch, p);
  const podzial = readPodzialHandlu(city, gameData());
  const pctSpol = podzial.procentLuksus;
  const miastoMoney = view?.pieniadz ?? null;
  const spolEst = miastoMoney !== null ? Math.round(miastoMoney * pctSpol / 100) : null;
  const utrzymEst = miastoMoney !== null ? Math.round(rown * miastoMoney) : null;

  const card = el('div', 'detail-card wealth-detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Zamożność — ściąga</span>';
  card.appendChild(head);

  const summary = el('div', 'dc-summary muted');
  summary.style.cssText = 'font-size:0.88em;margin-bottom:0.35em;';
  summary.textContent = ws.poziom >= cap
    ? `W${ws.poziom} · MAX (epoka ${epoch}) · ×Skarb ${mnoz.toFixed(2)}`
    : `W${ws.poziom} · pula ${ws.pula} / ${Math.round(prog)} · ×Skarb ${mnoz.toFixed(2)}`;
  card.appendChild(summary);

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Pasek w panelu pokazuje tylko postęp puli do następnego poziomu W — jak spichlerz dla wzrostu ludności. ' +
    'Część handlu (suwak Zamożność) trafia do puli; wyższy W mnoży pieniądze do skarbca, ale utrzymanie W też kosztuje.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co oznaczają liczby');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Pasek (główny widok)', ws.poziom >= cap
    ? 'Pełny — osiągnięto max W w tej epoce'
    : `${ws.pula} / ${Math.round(prog)} — ile zebrano z puli potrzebnej do W${ws.poziom + 1}`);
  gridDetailRow(g0, 'W (poziom Wealth)', `W${ws.poziom} — poziom zamożności obywateli (max W${cap} w epoce ${epoch}). Wyższe W = bogatsze miasto i bonus do szczęścia co 10 poziomów.`);
  gridDetailRow(g0, '×Skarb (mnożnik)', `×${mnoz.toFixed(2)} — ile razy mnożony jest strumień pieniędzy do skarbca przy obecnym W. W1 = ×1,00 (bez bonusu); każdy kolejny poziom W podnosi mnożnik.`);
  gridDetailRow(g0, 'Próg awansu', ws.poziom >= cap
    ? 'Brak — cap epoki'
    : `${Math.round(prog)} 💰 w puli → awans na W${ws.poziom + 1} (zostaje ${Math.round(p.zachowaniePoAwansie * 100)}% puli)`);

  appendDetailSection(card, 'Stan miasta');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Poziom W', `W${ws.poziom} (max W${cap} w epoce ${epoch})`);
  gridDetailRow(g1, 'Pula zamożności', `${ws.pula} / ${Math.round(prog)} do W${Math.min(cap, ws.poziom + 1)}`);
  gridDetailRow(g1, 'Postęp paska', ws.poziom >= cap
    ? 'Maks. poziom zamożności w tej epoce'
    : `→ W${ws.poziom + 1}: ${ws.pula} / ${Math.round(prog)} (${Math.round(prog > 0 ? (ws.pula / prog) * 100 : 0)}%)`);
  gridDetailRow(g1, 'Mnożnik skarbca', `×${mnoz.toFixed(2)}`);
  gridDetailRow(g1, 'Wpływ na szczęście', `${signed(szcz)} zadowolonych`);

  appendDetailSection(card, 'Wzory');
  appendDetailFormula(card, `×Skarb = max(1, 1 + (W−1) × ${p.mnoznikNaPoziom})`);
  appendDetailFormula(card, `Próg W(L→L+1) = ${p.progNaPoziom} × (L+1) × epoka`);
  appendDetailFormula(card, `Utrzymanie = rownowaga(W) × pieniądz_miasta`);
  appendDetailFormula(card, `Równowaga(W) = ${Math.round(p.utrzymanieBaza * 100)}% + (W/cap)×(${Math.round(p.utrzymaniePrzyCap * 100)}%−${Math.round(p.utrzymanieBaza * 100)}%)`);

  appendDetailSection(card, 'Skąd bierze się pula');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, `Suwak ${HANDEL_ZAMOZNOSC_LABEL}`, `${pctSpol}% udziału handlu`);
  if (miastoMoney !== null) {
    gridDetailRow(g2, 'Pieniądz miasta', `${signed(miastoMoney)} 💰`);
    if (spolEst !== null) gridDetailRow(g2, '→ do puli zamożności', `~${signed(spolEst)}`);
    if (utrzymEst !== null) gridDetailRow(g2, '→ koszt utrzymania W', `~${signed(utrzymEst)}`);
    if (spolEst !== null && utrzymEst !== null) {
      const net = spolEst - utrzymEst;
      gridDetailRow(g2, 'Saldo puli', `${signed(net)} (${net >= 0 ? 'rośnie' : 'maleje'})`);
    }
  } else {
    gridDetailRow(g2, 'Pieniądz miasta', '— (brak podglądu tury)');
  }

  appendDetailSection(card, 'Mechanika');
  const g3 = appendDetailGrid(card);
  gridDetailRow(g3, 'Awans', `Pula ≥ próg → W+1, zostaje ${Math.round(p.zachowaniePoAwansie * 100)}% puli`);
  gridDetailRow(g3, 'Spadek', 'Gdy pula spadnie poniżej 0 → W−1 (bufor wyczerpany)');
  gridDetailRow(g3, 'Równowaga W', `${Math.round(p.utrzymanieBaza * 100)}%→${Math.round(p.utrzymaniePrzyCap * 100)}% pieniędzy (W0→cap)`);
  gridDetailRow(g3, 'Szczęście', `W=0: ${p.karaZero}; co 10 poziomów W: +${p.zadowolenieNa10pkt}`);

  appendDetailAlgo(card, 'Kolejność ticku zamożności', [
    `Wejście: strumień z handlu = floor(handelNetto × %${HANDEL_ZAMOZNOSC_LABEL}) — nie trafia do skarbca.`,
    'Koszt utrzymania = rownowaga(W) × pieniądz brutto miasta tej tury.',
    'Pula += wpływ z handlu − utrzymanie. Gdy pula < 0 → pula=0 i W−1.',
    'Dopóki pula ≥ próg awansu i W < cap: W+1, pula −= próg, pula ×= zachowanie po awansie.',
    'Mnożnik skarbca rośnie z poziomem W — stosowany do pieniędzy miasta (nie do nauki).',
  ]);

  appendDetailAlgo(card, 'Skąd bierze się wpływ do puli', [
    'Handel brutto z pól + bonus Targowiska → handelNetto (po korupcji, opcjonalnie ×Waluta).',
    `Podział handlu: %${HANDEL_ZAMOZNOSC_LABEL} × handelNetto → wpływ do puli zamożności.`,
    `Więcej % na Skarb = mniej ${HANDEL_ZAMOZNOSC_LABEL} = wolniejszy W, ale więcej 💰 od razu.`,
    `Więcej % na ${HANDEL_ZAMOZNOSC_LABEL} = szybszy W, ale mniej gotówki — ×Skarb rośnie z opóźnieniem.`,
  ]);

  const note = el('div', 'dc-note');
  note.textContent =
    `Trade-off: więcej % na ${HANDEL_ZAMOZNOSC_LABEL} = wolniejszy skarbiec dziś, ale wyższe W jutro mnoży podatki. ` +
    `Więcej % na Skarb = gotówka teraz, zamożność stoi w miejscu lub spada.`;
  card.appendChild(note);
  return card;
}

function buildPracaDetailCard(
  city: City,
  view: CityView | null,
  data: GameData | null,
): HTMLDivElement {
  const pctCfg = readPodzialPracy(city, data);
  const praca = view ? cityPracaSplit(city, view, data) : null;
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const maTargowisko = built.includes('targowisko');

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Podział pracy — ściąga</span>';
  card.appendChild(head);

  const pctB = praca?.pctBudynki ?? pctCfg.procentBudynki;
  const pctU = praca?.pctUlepszenia ?? (100 - pctB);
  const summary = el('div', 'dc-summary muted');
  summary.style.cssText = 'font-size:0.88em;margin-bottom:0.35em;';
  summary.innerHTML = praca
    ? `${pctB}% ${cityPanelChipIconWrap('cp-buildings', 14)} budynki · ${pctU}% ${cityPanelChipIconWrap('tb-build', 14)} ulepszenia · ${signed(praca.total)} ${cityPanelChipIconWrap('res-work', 14)}`
    : `${pctB}% ${cityPanelChipIconWrap('cp-buildings', 14)} · ${pctU}% ${cityPanelChipIconWrap('tb-build', 14)} (brak podglądu tury)`;
  card.appendChild(summary);

  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    'Praca 🔨 to surowiec z pól okolicy (👤 na heksach). Nie idzie wszystko w jedno miejsce — suwak dzieli ją między ' +
    'kolejkę budowy/rekrutacji a ulepszenia terenu (farma, kamieniołom…). Razem zawsze 100%.',
  );
  card.appendChild(intro);

  appendDetailSection(card, 'Co widać w panelu');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Pasek (złoty + niebieski)', `Złoty 🏛 = ${pctB}% pracy na budynki i jednostki w kolejce. Niebieski 🛠 = ${pctU}% na ulepszenia pól.`);
  gridDetailRow(g0, 'Tekst na pasku', `${pctB}% 🏛 · ${pctU}% 🛠 — ten sam podział co suwak; zmienia się na żywo.`);
  gridDetailRow(g0, 'Suwak pod spodem', 'Przesuwasz w lewo → więcej ulepszeń pól; w prawo → szybsza produkcja w kolejce. Kroki co 10%.');
  gridDetailRow(g0, 'Dlaczego tu, po lewej', 'Podział pracy karmi produkcję i budowę — garnizon jest w pasku u góry obok nazwy miasta.');

  appendDetailSection(card, 'Aktualny podział');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Praca', praca ? `${signed(praca.total)} 🔨` : '—');
  gridDetailRow(g1, '→ Budynki', praca ? `${signed(praca.doBudynkow)} (${praca.pctBudynki}%)` : '—');
  gridDetailRow(g1, '→ Ulepszenia', praca ? `${signed(praca.doUlepszen)} (${praca.pctUlepszenia}%)` : '—');

  appendDetailFormula(card, 'doBudynkow = floor(praca × %Budynki)');
  appendDetailFormula(card, 'doUlepszen = praca − doBudynkow');

  appendDetailSection(card, 'Trade-off (po co ten wybór)');
  const gt = appendDetailGrid(card);
  gridDetailRow(gt, 'Więcej 🏛', 'Szybciej kończysz budynki i rekrutację w kolejce — miasto rośnie „w pionie”.');
  gridDetailRow(gt, 'Więcej 🛠', 'Szybciej ulepszasz pola — lepsze plony i praca w kolejnych turach (długofalowo).');
  gridDetailRow(gt, 'Skrajności', '100% 🏛 = zero postępu ulepszeń terenu. 100% 🛠 = kolejka stoi w miejscu.');
  gridDetailRow(gt, 'Brak pracy', 'Gdy 🔨 = 0, suwak nic nie da — przypisz 👤 w okolicy (prawa kolumna).');

  appendDetailAlgo(card, 'Algorytm (splitPraca + productionProgress)', [
    'Praca netto = suma z obrabianych pól + budynki − strata (korupcja).',
    'doBudynkow idzie do kolejki produkcji (budynki, jednostki) co turę.',
    'doUlepszen trafia do puli ulepszeń pól (farma, kamieniołom itd.).',
    'Kolejka: postęp += doBudynkow; gdy postęp ≥ koszt → budynek gotowy.',
    maTargowisko
      ? 'Część pracy (doUlepszen) + Waluta + Targowisko → dodatkowy pieniądz (osobny strumień).'
      : 'Bez Targowiska doUlepszen nie konwertuje się na pieniądz.',
    'Brak pracy = brak postępu budowy i ulepszeń — przypisz 👤 w okolicy.',
  ]);

  appendDetailAlgo(card, 'Suwak UI', [
    'Kroki co 10%. Zmiana %Budynki automatycznie ustawia resztę na ulepszenia.',
    'Per miasto — każde miasto może mieć inny podział.',
    'Brak pracy w turze — przypisz 👤 na mapie okolicy. Miasto rywala: tylko podgląd.',
  ]);

  return card;
}

function appendPodzialPracyInfo(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  data: GameData | null,
): void {
  const praca = view ? cityPracaSplit(city, view, data) : null;
  const empire = resolveEmpireSnap(city, activeMap, data);
  const pool = Math.round(empire.pracaPool ?? empire.pracaRate ?? 0);
  const skarb = Math.round(empire.zloto ?? cfg.getTreasury?.(city.ownerId) ?? 0);
  const skarbDelta = view ? Math.round(view.pieniadz) : 0;
  const prod = getProd(city.id);
  const front = frontItem(prod);
  const rq = prod.rekrutacja ?? [];

  const chips = el('div', 'chip-row praca-split-chips');
  chips.innerHTML =
    statChipBrand('res-work', 'Miasto', praca ? signed(praca.total) : '—', 'gold') +
    statChipBrand('cp-buildings', 'Budowa', praca ? `+${praca.doBudynkow}` : '—', 'gold') +
    statChipBrand('chip-crate', 'Pula', praca ? `+${praca.doUlepszen}` : '—', 'blue');
  mount.appendChild(chips);

  const info = el('div', 'praca-split-info');

  const rowTotal = el('div', 'psi-row');
  rowTotal.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('res-work', 'Praca w mieście')}</span>` +
    `<span class="psi-val gold">${praca ? signed(praca.total) + cityPanelChipIconWrap('res-work', 16) : '—'}</span>`;
  info.appendChild(rowTotal);

  const rowBud = el('div', 'psi-row');
  let budVal = praca ? `+${signed(praca.doBudynkow)} (${praca.pctBudynki}%)` : '—';
  let budSub = '';
  if (front && praca) {
    const paused = prod.wstrzymana === true;
    const eta = paused ? null : etaTurns(front.koszt, prod.postep, praca.doBudynkow);
    budSub =
      `${front.nazwa}: ${prod.postep}/${front.koszt}${cityPanelChipIconWrap('res-work', 14)}` +
      (paused ? ' · wstrzymana' : eta != null ? ` · ~${eta} ${tury(eta)}` : praca.doBudynkow > 0 ? '' : ' · brak pracy');
  } else {
    budSub = `Kolejka budowy pusta — wybierz ${cityPanelChipIconWrap('cp-buildings', 14)} Buduj (lewy rail)`;
  }
  rowBud.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('cp-buildings', 'Kolejka budowy')}</span>` +
    `<span class="psi-val gold">${budVal}<div class="psi-sub">${budSub}</div></span>`;
  info.appendChild(rowBud);

  const rowPool = el('div', 'psi-row');
  rowPool.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('chip-crate', 'Pula imperium')}</span>` +
    `<span class="psi-val blue">${praca ? `+${signed(praca.doUlepszen)} (${praca.pctUlepszenia}%)` : '—'}` +
    `<div class="psi-sub">Zapas całej cywilizacji: ${pool}${cityPanelChipIconWrap('res-work', 14)} · osadnicy, projekty mapy</div></span>`;
  info.appendChild(rowPool);

  const rowSkarb = el('div', 'psi-row');
  const rqHint = rq.length > 0
    ? `Kolejka rekrutacji: ${rq.length} · opłacone złotem`
    : `Jednostki kupujesz za ${cityPanelChipIconWrap('res-treasury', 14)} ze skarbca (zakładka ${cityPanelChipIconWrap('cp-recruit', 14)} Rekrut.)`;
  rowSkarb.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('res-treasury', 'Skarbiec')}</span>` +
    `<span class="psi-val gold">${skarb}${skarbDelta !== 0 ? ` (${signed(skarbDelta)})` : ''}` +
    `<div class="psi-sub">${rqHint}</div></span>`;
  info.appendChild(rowSkarb);

  mount.appendChild(info);
}

function renderPodzialPracy(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  data: GameData | null,
): void {
  if (!cfg.onPodzialPracyChange) return;
  mount.innerHTML = '';
  appendSectionTitleWithDetails(mount, '<span>Podział pracy</span>', () => buildPracaDetailCard(city, view, data));
  const pctCfg = readPodzialPracy(city, data);
  const praca = view ? cityPracaSplit(city, view, data) : null;
  const pctB = praca?.pctBudynki ?? pctCfg.procentBudynki;
  const pctU = praca?.pctUlepszenia ?? (100 - pctB);
  const player = city.ownerId === 0;

  const barWrap = el('div', 'praca-split-bar');
  barWrap.innerHTML =
    `<div class="praca-split-b" data-praca-bar="budynki" style="width:${pctB}%"></div>` +
    `<div class="praca-split-u" data-praca-bar="ulepszenia" style="width:${pctU}%"></div>` +
    `<div class="fbtxt">${pracaSplitBarLabelHtml(pctB, pctU, praca ? praca.doBudynkow : undefined, praca ? praca.doUlepszen : undefined)}</div>`;
  mount.appendChild(barWrap);

  if (player) {
    const sliderWrap = el('div', 'praca-w4-sliders');
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.className = 'praca-split-range';
    inp.min = '0';
    inp.max = '100';
    inp.step = String(HANDEL_PCT_STEP);
    inp.value = String(pctB);
    inp.setAttribute('aria-label', 'Podział pracy: budynki versus pula imperium');
    inp.addEventListener('input', () => {
      const v = snapHandelPct(Number(inp.value));
      const u = 100 - v;
      const budBar = barWrap.querySelector('[data-praca-bar="budynki"]') as HTMLElement | null;
      const uleBar = barWrap.querySelector('[data-praca-bar="ulepszenia"]') as HTMLElement | null;
      const txt = barWrap.querySelector('.fbtxt');
      if (budBar) budBar.style.width = `${v}%`;
      if (uleBar) uleBar.style.width = `${u}%`;
      if (txt && praca) {
        const bAmt = Math.round(v / 100 * praca.total);
        const uAmt = Math.round(praca.total - bAmt);
        txt.innerHTML = pracaSplitBarLabelHtml(v, u, bAmt, uAmt);
      } else if (txt) {
        txt.innerHTML = pracaSplitBarLabelHtml(v, u);
      }
      cfg.onPodzialPracyChange?.(city.id, { procentBudynki: v });
      rerender();
    });
    sliderWrap.appendChild(inp);
    mount.appendChild(sliderWrap);
  }

  appendPodzialPracyInfo(mount, city, view, data);
}

// ---------------------------------------------------------------------------
// Real sections
// ---------------------------------------------------------------------------

function renderBilans(mount: HTMLElement, view: CityView | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Bilans plonów</span>'));
  if (!view) { mount.appendChild(el('div', 'muted', 'Brak danych gry')); return; }
  const row = el('div', 'chip-row');
  row.innerHTML = plonyChipRowHtml(view);
  mount.appendChild(row);
}

function renderMagazyn(mount: HTMLElement, city: City, view: CityView | null): void {
  mount.innerHTML = '';
  mount.style.display = '';
  const title = view?.maSpichlerz ? 'Spichlerz' : 'Wzrost ludności';
  appendSectionTitleWithDetails(mount, `<span>${title}</span>`, () => {
    const st = cfg.getEmpireFoodState?.(city.ownerId);
    const tick = cfg.getEmpireFoodTick?.(city.ownerId);
    return buildSpichlerzDetailCard(city, view!, st, tick);
  });
  if (!view) { mount.appendChild(el('div', 'muted', '—')); return; }

  const prog = Math.round(view.progWzrostu);
  const mag = Math.round(view.magazyn);
  const pct = Math.max(0, Math.min(100, Math.round((mag / Math.max(1, prog)) * 100)));
  const st = cfg.getEmpireFoodState?.(city.ownerId);
  const tick = cfg.getEmpireFoodTick?.(city.ownerId);
  const pctRozwoj = st?.procentRozwoj ?? getEmpireFoodSplit(city.ownerId);
  const pctArmia = 100 - pctRozwoj;
  const foodSplit = cityFoodSplit(view);
  const doWzrostu = foodSplit.doWzrostu;
  const doArmii = foodSplit.doArmii;
  const atPopCap = view.atPopCap;
  const eta = atPopCap ? null : etaTurns(prog, mag, Math.max(0, doWzrostu));
  const reserve = st?.zapasyPanstwa;
  const starving = tick?.glodWojska ?? (reserve != null && reserve < 0);
  const foodCls = foodSplit.total > 0 ? 'green' : foodSplit.total < 0 ? 'red' : 'gold';

  const spichlerzChips: TabIndicatorChip[] = [
    { icon: cityPanelChipIcon('res-population', 14), label: 'Ludność', value: String(city.population), cls: 'gold' },
    {
      icon: cityPanelChipIcon('chip-map', 14),
      label: 'Do +1',
      value: atPopCap ? 'Cap' : (eta != null ? `~${eta} ${tury(eta)}` : '—'),
      cls: atPopCap ? 'red' : (eta != null ? 'green' : 'muted'),
      title: atPopCap
        ? (view.maAkwedukt
          ? `Cap ${view.popCapAktualny} — max z Akweduktem; nadwyżka żywności idzie do armii lub przepada`
          : `Bez Akweduktu max ${view.popCapBezAkweduktu} mieszk. — zbuduj Akwedukt, by rosnąć dalej`)
        : 'Szacunek przy obecnym napływie do bufora',
    },
    {
      icon: loafIconHtml('civ-v-loaf-chip'),
      label: 'Produkcja',
      value: `${signed(foodSplit.total)}/t`,
      cls: foodCls,
      title: 'Netto żywności tego miasta na turę',
    },
    {
      icon: loafIconHtml('civ-v-loaf-chip'),
      label: 'Wzrost',
      value: signed(doWzrostu),
      cls: doWzrostu > 0 ? 'gold' : doWzrostu < 0 ? 'red' : 'muted',
      title: 'Część produkcji idąca do bufora wzrostu ludności',
    },
    {
      icon: cityPanelChipIcon('tb-army', 14),
      label: 'Armia',
      value: signed(doArmii),
      cls: starving ? 'red' : doArmii > 0 ? 'blue' : doArmii < 0 ? 'red' : 'muted',
      title: 'Część produkcji idąca do zapasów armii państwa',
    },
    { icon: '▣', label: 'Bufor', value: `${mag}/${prog}`, cls: 'gold', title: 'Stan bufora wzrostu w tym grodzie' },
  ];
  if (view.maSpichlerz) {
    spichlerzChips.push({ icon: cityPanelChipIcon('chip-grain', 14), label: 'Spichlerz', value: 'w mieście', cls: 'green' });
  } else if (ownerHasSpichlerz(city.ownerId)) {
    spichlerzChips.push({ icon: cityPanelChipIcon('chip-grain', 14), label: 'Spichlerz', value: 'imperium', cls: 'gold' });
  }
  if (starving) {
    spichlerzChips.push({ icon: cityPanelChipIcon('chip-warning', 14), label: 'Armia', value: 'głód', cls: 'red' });
  }
  if (atPopCap) {
    spichlerzChips.push({
      icon: cityPanelChipIcon('cp-buildings', 14),
      label: 'Limit',
      value: `max ${view.popCapAktualny}`,
      cls: 'red',
      title: view.maAkwedukt
        ? `Cap ${view.popCapAktualny} z Akweduktem — wzrost zablokowany`
        : `Bez Akweduktu miasto nie rośnie powyżej ${view.popCapBezAkweduktu} — zbuduj Akwedukt (Zdrowie)`,
    });
  } else if (view.maAkwedukt) {
    spichlerzChips.push({
      icon: cityPanelChipIcon('cp-buildings', 14),
      label: 'Akwedukt',
      value: `cap ${view.popCapZAkweduktem}`,
      cls: 'green',
      title: `Z Akweduktem miasto może rosnąć do ${view.popCapZAkweduktem} mieszkańców`,
    });
  }
  appendTabIndicators(mount, spichlerzChips);

  const player = city.ownerId === 0;
  const sliderEditable = player && !!cfg.onEmpireFoodSplitChange && st != null;

  const block = el('div', 'food-grow-block');
  const track = el('div', 'food-grow-track');
  track.innerHTML =
    `<div class="food-grow-fill" style="width:${pct}%"></div>` +
    `<span class="food-grow-loaf" aria-hidden="true">${loafIconHtml()}</span>`;
  block.appendChild(track);

  const pair = el('div', 'food-stat-pair');
  const statW = el('div', 'food-stat');
  statW.innerHTML =
    `<span class="food-stat-lbl">${loafIconHtml('civ-v-loaf-chip')} Wzrost</span>` +
    `<span class="food-stat-val gold">${mag} / ${prog}</span>`;
  const statA = el('div', 'food-stat');
  statA.style.textAlign = 'right';
  const armyCls = tick?.glodWojska ? 'red' : '';
  statA.innerHTML =
    `<span class="food-stat-lbl">${cityPanelChipIconWrap('tb-army', 14)} Armia</span>` +
    `<span class="food-stat-val ${armyCls}">${signed(doArmii)}/t</span>`;
  pair.appendChild(statW);
  pair.appendChild(statA);
  block.appendChild(pair);
  mount.appendChild(block);

  const splitWrap = el('div', 'food-split-wrap');
  const labels = el('div', 'food-split-labels');
  labels.innerHTML = `<span>${loafIconHtml('civ-v-loaf-chip')} Wzrost</span><span>${cityPanelChipIconWrap('tb-army', 14)} Armia</span>`;
  splitWrap.appendChild(labels);

  const barWrap = el('div', 'food-split-bar');
  barWrap.innerHTML =
    `<div class="food-split-g" data-food-bar="wzrost" style="width:${pctRozwoj}%"></div>` +
    `<div class="food-split-a" data-food-bar="armia" style="width:${pctArmia}%"></div>`;
  splitWrap.appendChild(barWrap);

  if (sliderEditable) {
    barWrap.classList.add('food-split-bar--interactive');
    attachFoodSplitBar(
      barWrap,
      pctRozwoj,
      (v) => cfg.onEmpireFoodSplitChange?.(city.ownerId, v),
      () => rerender(),
    );
  } else if (st) {
    barWrap.classList.add('food-split-bar--ro');
    const ro = el('div', 'muted');
    ro.style.cssText = 'font-size:0.62em;text-align:center;padding:0.2em 0;';
    ro.textContent = player ? 'Suwak — po wpieciu silnika.' : 'Tylko podgląd.';
    splitWrap.appendChild(ro);
  }
  mount.appendChild(splitWrap);
}

function buildSpichlerzDetailCard(
  city: City,
  view: CityView,
  st: EmpireFoodState | null | undefined,
  tick: EmpireFoodTick | null | undefined,
): HTMLDivElement {
  const data = gameData();
  const params = data ? buildEconParams(data, cfg.difficulty ?? 'normal') : null;
  const coeff = params?.progWzrostuWspolczynnik ?? 16;
  const spichlerzKeep = params ? Math.round(params.spichlerzZachowaniePoPrzroscie * 100) : 50;
  const prog = Math.round(view.progWzrostu);
  const mag = Math.round(view.magazyn);
  const eta = etaTurns(prog, mag, Math.max(0, view.zywnoscDoWzrostu));
  const hasSpichlerz = ownerHasSpichlerz(city.ownerId);
  const pctRozwoj = st?.procentRozwoj ?? getEmpireFoodSplit(city.ownerId);
  const pctArmia = 100 - pctRozwoj;
  const reserve = st?.zapasyPanstwa;
  const doArmii = Math.round(view.zywnoscNetto) - Math.round(view.zywnoscDoWzrostu);
  const starving = tick?.glodWojska ?? (reserve != null && reserve < 0);

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Spichlerz — szczegóły</span>';
  card.appendChild(head);

  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    'Bufor 🍞 kumuluje się w każdym mieście osobno. Suwak imperium dzieli świeżą żywność między wzrost miast a zapasy armii.',
  );
  card.appendChild(intro);

  appendDetailSection(card, 'Bufor wzrostu (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Próg', `${city.population} → ${city.population + 1}: ${prog} 🍞`);
  gridDetailRow(g1, 'Bufor', `${mag} / ${prog}`);
  gridDetailRow(g1, 'Przyrost', `+${Math.round(view.zywnoscDoWzrostu)} 🍞`);
  gridDetailRow(g1, 'ETA', view.atPopCap ? `Cap — max ${view.popCapAktualny}` : (eta != null ? `~${eta} ${tury(eta)}` : '—'));
  gridDetailRow(
    g1,
    'Limit ludności',
    view.maAkwedukt
      ? `max ${view.popCapZAkweduktem} z Akweduktem${view.atPopCap ? ' (osiągnięty)' : ''}`
      : `max ${view.popCapBezAkweduktu} bez Akweduktu${view.atPopCap ? ' (osiągnięty)' : ''}`,
  );
  gridDetailRow(g1, 'Spichlerz w mieście', view.maSpichlerz ? `tak (po wzroście ${spichlerzKeep}% bufora)` : 'nie (po wzroście bufor=0)');

  appendDetailFormula(card, `Próg(N) = 20 + N × ${coeff}`);
  appendDetailFormula(card, 'Bufor += zywnoscDoWzrostu × modyfikator_zdrowia');
  appendDetailFormula(card, `Po wzroście: bufor = ${view.maSpichlerz ? `floor(bufor × ${spichlerzKeep}%)` : '0'}`);

  appendDetailAlgo(card, 'Algorytm wzrostu (populationGrowth)', [
    `zywnoscDoWzrostu = zywnoscNetto_miasta × ${pctRozwoj}% (suwak imperium).`,
    'effectiveFlow = zywnoscDoWzrostu × max(0, 1 + zdrowie × wsp_zdrowia).',
    'Bufor += floor(effectiveFlow). Gdy bufor ≥ próg i ludność < cap → +1 mieszkaniec.',
    'Deficyt: bufor maleje; bufor=0 i nadal deficyt → −1 ludność (min 1).',
    'Cap bez Akweduktu = akwedukt_prog_ludnosci; z Akweduktem = akwedukt_max_ludnosci (normal 5 / 15).',
  ]);

  appendDetailSection(card, 'Armia (całe państwo)');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, 'Suwak', `${pctRozwoj}% wzrost · ${100 - pctRozwoj}% armia`);
  if (tick) {
    gridDetailRow(g2, 'Żywność brutto', `+${Math.round(tick.zywnoscBrutto)} 🍞 (suma miast)`);
    gridDetailRow(g2, '→ wzrost miast', `+${Math.round(tick.doRozwoju)} 🍞`);
    gridDetailRow(g2, '→ armia', `+${Math.round(tick.doPanstwa)} 🍞`);
    gridDetailRow(g2, 'Koszt armii', `−${Math.round(tick.kosztArmii)}`);
  } else {
    gridDetailRow(g2, 'Armia (miasto)', `+${Math.max(0, Math.round(view.zywnoscNetto - view.zywnoscDoWzrostu))}`);
  }

  appendDetailFormula(card, 'doRozwoju = Σ zywnoscNetto_miast × %wzrost');
  appendDetailFormula(card, 'doArmii = brutto − doRozwoju');
  appendDetailFormula(card, hasSpichlerz
    ? 'Zapasy += 100% × (doArmii − kosztArmii); max = pojemność Spichlerzy'
    : 'Zapasy += 50% × (doArmii − kosztArmii); bez limitu pojemności');

  appendDetailAlgo(card, 'Tick zapasów armii (advanceEmpireFood)', [
    'Brutto = suma dodatniej zywnoscNetto ze wszystkich miast (pomijane oblężone).',
    `doRozwoju = brutto × ${pctRozwoj}%; reszta idzie do armii w tej turze.`,
    'kosztArmii = militaryFoodConsumption(jednostki na mapie).',
    hasSpichlerz
      ? 'Ze Spichlerzem: odkłada 100% netto (doArmii − koszt); limit = 100 🍞 × liczba Spichlerzy.'
      : 'Bez Spichlerza: odkłada 50% netto od startu gry; reszta przepada; brak limitu zapasów.',
    'Ujemne zapasy = głód wojska (−HP co turę).',
    'Spichlerz w mieście NIE wpływa na % odkładania — liczy się dowolny Spichlerz w imperium.',
  ]);

  return card;
}

/** Karta szczegółów 🍞 z górnego paska — co znaczą liczby i skąd się biorą. */
function buildTopBarZywnoscDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  data: GameData | null,
): HTMLDivElement {
  const st = cfg.getEmpireFoodState?.(city.ownerId);
  const tick = cfg.getEmpireFoodTick?.(city.ownerId);
  const cityNet = Math.round(view.zywnoscNetto);
  const pctRozwoj = st?.procentRozwoj ?? getEmpireFoodSplit(city.ownerId);
  const pctArmia = 100 - pctRozwoj;
  const doWzrostu = Math.round(view.zywnoscDoWzrostu);
  const doArmiiMiasto = Math.max(0, cityNet - doWzrostu);
  const hasSpichlerz = ownerHasSpichlerz(city.ownerId);
  const params = data ? buildEconParams(data, cfg.difficulty ?? 'normal') : null;
  const coeff = params?.progWzrostuWspolczynnik ?? 16;
  const prog = Math.round(view.progWzrostu);
  const mag = Math.round(view.magazyn);

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = `<span>${loafIconHtml('civ-v-loaf-chip')} Żywność — co to znaczy</span>`;
  card.appendChild(head);

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Wkład tego miasta w produkcję żywności (zielony dopisek +X). ' +
    'Zapasy armii całego państwa — tylko na HUD mapy (górny pasek).';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku miasta');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Zielony dopisek', `${signed(cityNet)} — netto z tego miasta (pola + budynki − koszty)`);
  gridDetailRow(g0, 'Bufor vs zapasy', 'Bufor wzrostu = w tym grodzie; zapasy armii = HUD mapy (osobny licznik).');

  appendDetailSection(card, 'Skąd bierze się żywność (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Pola i okolica', 'Obrabiane heksy (🌾), ulepszenia, hodowla — patrz mapa okolicy po prawej.');
  gridDetailRow(g1, 'Budynki', 'Spichlerz, Targowisko, Świątynia itd. — plony z kart budynków.');
  gridDetailRow(g1, 'Netto', `${signed(cityNet)} 🍞 — suma po kosztach utrzymania miasta.`);
  gridDetailRow(g1, '→ na wzrost', `${signed(doWzrostu)} (${pctRozwoj}% suwaka imperium)`);
  gridDetailRow(g1, '→ na armię', `${signed(doArmiiMiasto)} (reszta netto miasta)`);

  appendDetailSection(card, 'Bufor wzrostu ludności (osobno!)');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, 'Bufor miasta', `${mag} / ${prog} 🍞 — liczy się tylko w tym grodzie`);
  gridDetailRow(g2, 'Próg wzrostu', `${prog} 🍞 na +1 mieszkańca (20 + ${city.population} × ${coeff})`);
  gridDetailRow(g2, 'Spichlerz', view.maSpichlerz
    ? 'tak — po wzroście zostaje 50% bufora miasta'
    : 'nie — po wzroście bufor zeruje się');

  appendDetailSection(card, 'Całe państwo (tick żywności)');
  const g3 = appendDetailGrid(card);
  gridDetailRow(g3, 'Suwak imperium', `${pctRozwoj}% wzrost miast · ${pctArmia}% armia`);
  if (tick) {
    gridDetailRow(g3, 'Produkcja brutto', `+${Math.round(tick.zywnoscBrutto)} (suma miast, bez oblężonych)`);
    gridDetailRow(g3, '→ wzrost miast', `+${Math.round(tick.doRozwoju)}`);
    gridDetailRow(g3, '→ armia', `+${Math.round(tick.doPanstwa)}`);
    gridDetailRow(g3, 'Koszt wojska', `−${Math.round(tick.kosztArmii)}`);
  }
  gridDetailRow(g3, 'Spichlerz w imperium', hasSpichlerz
    ? 'tak — odkładasz 100% netto armii (limit pojemności)'
    : 'nie — odkładasz 50% netto armii od startu (bez limitu)');

  appendDetailFormula(card, 'zywnoscNetto = plony_pól + budynki − utrzymanie_miasta');
  appendDetailFormula(card, `doWzrostu = zywnoscNetto × ${pctRozwoj}%`);
  appendDetailFormula(card, 'doArmii_miasto = zywnoscNetto − doWzrostu');
  appendDetailFormula(card, hasSpichlerz
    ? 'zapasy_armii += 100% × (doArmii − koszt_wojska); cap ze Spichlerzy'
    : 'zapasy_armii += 50% × (doArmii − koszt_wojska); reszta przepada');

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → „Spichlerz”: bufor 🍞 i suwak wzrost vs armia.',
    'Mapa okolicy → przypisz 👤 na pola żywnościowe (🌾).',
    'Garnizon na pasku → wojsko w mieście podnosi koszt żywności armii.',
    'Ujemne zapasy armii = głód wojska (obrażenia co turę).',
  ]);

  return card;
}

function buildTopBarRekruciDetailCard(
  city: City,
  mp: CityManpowerSnapshot,
): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>⚔ Rekruci (pobór wojskowy)</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Pula rekrutów tego miasta — werb jednostki zużywa rekrutów i ludność. ' +
    'Co turę pula rośnie (regen), chyba że miasto jest oblężone.';
  card.appendChild(intro);

  appendDetailSection(card, 'Stan puli');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Bieżąca pula', formatManpower(mp.manpowerBiezacy));
  gridDetailRow(g, 'Maksimum', formatManpower(mp.manpowerMax));
  gridDetailRow(g, 'Odnowa', `+${formatManpower(mp.regenPerTurn)}`);
  gridDetailRow(g, 'Koszt 1 jednostki', formatManpower(mp.kosztJednostki));
  gridDetailRow(g, 'Werb przy pełnej puli', String(mp.werbMaxPrzyPelnejPuli));
  gridDetailRow(g, 'Ludność abs.', formatManpower(mp.ludnoscAbsolutna));
  gridDetailRow(g, 'Obywatele', `${mp.ludki} · epoka ${mp.epoka}`);

  appendDetailAlgo(card, 'Skąd bierze się pula', [
    'Max ≈ 10% ludności absolutnej miasta (tabela epok).',
    'Regen domyślnie +10% max × bonus cywilizacji (np. Rzym +35%).',
    'Oblężenie blokuje odnowę do czasu zdjęcia oblężenia.',
  ]);
  return card;
}

function buildTopBarLudnoscDetailCard(
  city: City,
  view: CityView | null,
  data: GameData | null,
  map: GameMap | null,
): HTMLDivElement {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const params = data ? buildEconParams(data, cfg.difficulty ?? 'normal') : null;
  const coeff = params?.progWzrostuWspolczynnik ?? 16;
  const prog = view ? Math.round(view.progWzrostu) : 20 + city.population * coeff;
  const mag = view ? Math.round(view.magazyn) : (city.magazynZywnosci ?? 0);
  const eta = view && view.zywnoscDoWzrostu > 0
    ? etaTurns(prog, mag, Math.max(0, view.zywnoscDoWzrostu))
    : null;
  const health = data && map
    ? resolveCityHealth(city, map, data)
    : null;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>👥 Ludność — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Liczba przy nazwie miasta to wyłącznie mieszkańcy tego grodu — nie całego państwa. ' +
    'Wpływa na próg wzrostu, limit pól do pracy (👤) i koszty utrzymania.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 👥', `${city.population} — ludność tego miasta`);
  gridDetailRow(g0, 'Epoka', String(epoch));
  gridDetailRow(g0, 'Różnica', 'Brak dopisku +X — to statystyka lokalna, nie imperium.');

  if (view) {
    appendDetailSection(card, 'Wzrost ludności');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Bufor 🍞', `${mag} / ${prog} — osobny licznik wzrostu (nie zapasy armii)`);
    gridDetailRow(g1, 'Próg +1', `${prog} 🍞 (20 + ${city.population} × ${coeff})`);
    gridDetailRow(g1, 'Przyrost', `+${Math.round(view.zywnoscDoWzrostu)} 🍞 idzie do bufora (po suwaku armii)`);
    gridDetailRow(g1, 'ETA wzrostu', eta != null ? `~${eta} ${tury(eta)}` : '— (brak nadwyżki żywności)');
    gridDetailRow(g1, 'Spichlerz', view.maSpichlerz ? 'tak — po wzroście zostaje 50% bufora' : 'nie — bufor zeruje się po +1');
  }

  if (health) {
    appendDetailSection(card, 'Zdrowie (wpływ na wzrost)');
    const gh = appendDetailGrid(card);
    gridDetailRow(gh, 'Zdrowie łącznie', `${health.total >= 0 ? '+' : ''}${health.total}`);
    for (const l of health.lines.slice(0, 6)) {
      gridDetailRow(gh, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  appendDetailFormula(card, 'Próg(N) = 20 + N × wsp_wzrostu');
  appendDetailFormula(card, 'Bufor += zywnoscDoWzrostu × modyfikator_zdrowia');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → „Spichlerz”: pasek bufora 🍞.',
    'Mapa okolicy → max 👤 obok centrum = populacja (kto pracuje pola).',
    'Więcej mieszkańców = wyższy próg kolejnego wzrostu.',
  ]);
  return card;
}

function buildTopBarPracaDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  map: GameMap | null,
  data: GameData | null,
): HTMLDivElement {
  const pracaSplit = cityPracaSplit(city, view, data);
  const pctCfg = readPodzialPracy(city, data);
  const pctB = pracaSplit.pctBudynki;
  const pctU = pracaSplit.pctUlepszenia;
  const pool = Math.round(empire.pracaPool ?? empire.pracaRate ?? 0);
  let empireSum = 0;
  if (map && data) {
    for (const c of (cfg.getCities?.() ?? []).filter(x => x.ownerId === city.ownerId)) {
      const v = computeView(c, map, data);
      if (v) empireSum += v.praca;
    }
  }

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🔨 Praca — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Praca to surowiec z pól okolicy (👤). Duża liczba to pula imperium; złoty i niebieski dopisek to podział pracy tylko tego miasta.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🔨', `${pool} — pula Pracy imperium (zapas / suma tur)`);
  gridDetailRow(g0, 'Złoty dopisek', `${signed(pracaSplit.doBudynkow)} — ten gród → kolejka budowy (${pctB}%)`);
  gridDetailRow(g0, 'Niebieski dopisek', `${signed(pracaSplit.doUlepszen)} — ten gród → ulepszenia pól (${pctU}%)`);
  gridDetailRow(g0, 'Suma miast', empireSum > 0 ? `${signed(empireSum)} łącznie z wszystkich grodów` : '—');

  appendDetailSection(card, 'Skąd bierze się praca (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Praca brutto', `${signed(pracaSplit.total)} 🔨`);
  gridDetailRow(g1, '→ Budynki', `${signed(pracaSplit.doBudynkow)} — postęp w kolejce produkcji`);
  gridDetailRow(g1, '→ Ulepszenia', `${signed(pracaSplit.doUlepszen)} — farma, kamieniołom itd.`);

  appendDetailFormula(card, 'doBudynkow = floor(praca × %Budynki)');
  appendDetailFormula(card, 'doUlepszen = praca − doBudynkow');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Lewa kolumna → „Podział pracy”: suwak 🏛 vs 🛠 (per miasto).',
    'Mapa okolicy → przypisz 👤 na heksy z 🔨 (pola, lasy, kamieniołomy).',
    'Kolejka produkcji po lewej zużywa strumień „budynki”.',
  ]);
  return card;
}

function buildTopBarZlotoDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  data: GameData | null,
): HTMLDivElement {
  const skarb = Math.round(empire.zloto ?? cfg.getTreasury?.(city.ownerId) ?? 0);
  const cityMoney = Math.round(view.pieniadz);
  const split = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, split);
  const ws = city.wealthState ?? freshWealthState();

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>💰 Pieniądz — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Skarbiec imperium to gotówka na wykupy, rekrutację za złoto i utrzymanie. Dopisek +X to netto pieniędzy z tego miasta co turę.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 💰', `${skarb} — skarbiec całego państwa`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityMoney)} — netto z tego grodu`);

  appendDetailSection(card, 'Skąd bierze się pieniądz (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Plony + budynki', 'Targowisko, Mennica, podatki z pól — patrz okolica.');
  gridDetailRow(g1, 'Podział handlu', `${split.procentPieniadz}% Skarb · ${split.procentNauka}% Nauka · ${split.procentLuksus}% Zamożność`);
  if (est.netto) {
    gridDetailRow(g1, 'Handel netto (szac.)', `~${est.netto} → split suwaków`);
    gridDetailRow(g1, '→ do Skarbu', est.skarb ? `~+${est.skarb}` : '—');
  }
  gridDetailRow(g1, 'Zamożność W', `W${ws.poziom} — część handlu karmi pulę W (mnożnik podatków)`);

  appendDetailFormula(card, 'pieniadzNetto = podatki + handel_netto + budynki − utrzymanie');
  appendDetailFormula(card, 'Skarbiec += Σ pieniadzNetto_miast − wydatki');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → „Podział handlu”: Skarb vs Nauka vs Zamożność.',
    'Prawa kolumna → „Zamożność”: pasek puli W.',
    'Lewa kolumna → Wykup / Rekrutuj za złoto ze skarbca.',
  ]);
  return card;
}

function buildTopBarNaukaDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  data: GameData | null,
): HTMLDivElement {
  const isBank = empire.nauka != null;
  const mainVal = Math.round(isBank ? empire.nauka! : (empire.naukaRate ?? view.nauka));
  const cityNauka = Math.round(view.nauka);
  const split = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, split);
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const maBiblioteka = cityHasBibliotekaLine(built);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Nauka — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent = isBank
    ? 'Bank nauki to zebrane punkty na odblokowanie technologii. Dopisek +X to wkład tego miasta co turę.'
    : 'Duża liczba to suma nauki imperium. Dopisek +X to wkład tego grodu.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba (bank nauki)', isBank
    ? `${mainVal} — bank nauki (zebrane punkty)`
    : `${mainVal} — produkcja nauki imperium`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityNauka)} — ten gród`);

  appendDetailSection(card, 'Skąd bierze się nauka');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Pola i budynki', maBiblioteka ? 'Biblioteka + pola z nauką' : 'Głównie pola z nauką + budynki');
  gridDetailRow(g1, 'Udział handlu', `${split.procentNauka}% handlu netto → nauka`);
  if (est.nauka) gridDetailRow(g1, '→ z handlu (szac.)', `~+${est.nauka}`);

  appendDetailFormula(card, 'nauka += plony + budynki + % handlu');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Panel badań (mapa) — wydajesz bank na tech.',
    'Podział handlu → więcej % na Naukę = szybsze tech, mniej złota.',
    'Buduj Bibliotekę, przypisuj 👤 na pola z nauką.',
  ]);
  return card;
}

function buildTopBarKulturaDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
): HTMLDivElement {
  const empRate = Math.round(empire.kulturaRate ?? view.kultura);
  const cityKult = Math.round(view.kultura);
  const cultState = cfg.getCultureState?.(city.id);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🎭 Kultura — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Kultura poszerza granice miasta (więcej pól 👤) i wpływa na szczęście. Duża liczba to suma imperium; dopisek to ten gród.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🎭', `${empRate} — suma kultury imperium`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityKult)} — ten gród`);

  if (cultState) {
    appendDetailSection(card, 'Stan miasta (silnik)');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Suma kultury', String(cultState.kulturaSuma));
    gridDetailRow(g1, 'Przyrost', `+${cultState.przyrost}`);
    gridDetailRow(g1, 'Granice', `+${cultState.borderRadius} pierścieni wokół miasta`);
  } else {
    appendDetailSection(card, 'Skąd bierze się kultura');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Plony + budynki', 'Teatr, Świątynia, cuda — patrz karta miasta.');
    gridDetailRow(g1, 'Efekt', 'Więcej kultury → dalsze granice terytorium na mapie okolicy.');
  }

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → „Kultura i Religia”: pasek postępu granic.',
    'Mapa okolicy — fioletowe pierścienie = zasięg kultury.',
    'Budynki kulturalne w lewej kolumnie produkcji.',
  ]);
  return card;
}

function buildTopBarReligiaDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  data: GameData | null,
): HTMLDivElement {
  const relSt = cfg.getReligionState?.(city.id);
  const relName = empire.stateReligion ?? relSt?.dominujaca ?? '—';
  const relStock = Math.round(empire.religionStock ?? 0);
  const cityRel = Math.round(relSt?.przyrostWiernych ?? 0);
  const relRateEmp = Math.round(empire.religionRate ?? 0);
  const share = empire.religionSharePct ?? relSt?.udzialPct ?? 0;
  const diff = cfg.difficulty ?? 'normal';
  const relParams = data
    ? loadReligionParams(data.societyParams, diff)
    : FALLBACK_RELIGION_PARAMS;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🛕 Religia — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Religia państwowa to tożsamość cywilizacji. Duża liczba to wierni w imperium; dopisek to ile ten gród szerzy wiarę co turę.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🛕', `${relStock} — wierni „${relName}” w państwie`);
  gridDetailRow(g0, 'Udział wiary', `${share}% ludności`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityRel)} — ten gród szerzy religię`);
  gridDetailRow(g0, 'Imperium łącznie', `${signed(relRateEmp)}`);

  appendDetailSection(card, 'Po co religia w grze');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Twoja wiara dominuje', `bonus Sz (+${relParams.zadowolenieDominujaca})`);
  gridDetailRow(g1, 'Obca wiara dominuje', `kara Sz (${relParams.karaObca})`);
  gridDetailRow(g1, 'Szerzenie', 'Sąsiednie miasta + Świątynia przyspieszają konwersję');

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → ikona Religia.',
    'Buduj Świątynię — więcej presji religijnej.',
    'Podbój = stopniowa konwersja ku wierze właściciela.',
  ]);
  return card;
}

function attachTopBarStat(
  mount: HTMLElement,
  statId: string,
  build: () => HTMLElement,
  sideHint: 'left' | 'right' = 'right',
): void {
  const node = mount.querySelector(`[data-res-stat="${statId}"]`) as HTMLElement | null;
  if (node) attachInteractiveDetail(node, build, { delayMs: 220, sideHint });
}

function wireTopBarStatDetails(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  map: GameMap | null,
  data: GameData | null,
): void {
  const empire = resolveEmpireSnap(city, map, data);

  attachTopBarStat(mount, 'ludnosc', () => buildTopBarLudnoscDetailCard(city, view, data, map));
  const mpSnap = cfg.getManpowerSnapshot?.(city.id);
  if (mpSnap) {
    attachTopBarStat(mount, 'rekruci', () => buildTopBarRekruciDetailCard(city, mpSnap));
  }

  if (view) {
    attachTopBarStat(mount, 'zywnosc', () => buildTopBarZywnoscDetailCard(city, view, empire, data));
    attachTopBarStat(mount, 'praca', () => buildTopBarPracaDetailCard(city, view, empire, map, data));
    attachTopBarStat(mount, 'zloto', () => buildTopBarZlotoDetailCard(city, view, empire, data));
    attachTopBarStat(mount, 'nauka', () => buildTopBarNaukaDetailCard(city, view, empire, data));
    attachTopBarStat(mount, 'kultura', () => buildTopBarKulturaDetailCard(city, view, empire));
    attachTopBarStat(mount, 'religia', () => buildTopBarReligiaDetailCard(city, view, empire, data));
  }

  if (data) {
    const orderResolved = resolveOrderState(city, data);
    if (orderResolved.state.porPct != null) {
      attachTopBarStat(
        mount,
        'porzadek',
        () => buildPorzadekDetailCard(city, orderResolved.state),
      );
    }
  }
}

function addItem(city: City, item: ProductionItem, opts?: { upgrade?: boolean }): void {
  if (item.kind === 'budynek') {
    const prod = getProd(city.id);
    if (buildingTypeQueued(item.id, prod.kolejka)) return;
    if (!opts?.upgrade) {
      const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
      if (built.includes(item.id)) return;
    }
  }
  setProd(city.id, enqueue(getProd(city.id), item));
  rerender();
}

/** Kup (zloty, lewo) + Buduj/Ulepsz (Praca, niebieski, prawo). */
function appendBuildActionButtons(
  btnWrap: HTMLElement,
  city: City,
  item: ProductionItem,
  skarb: number | undefined,
  buildLabel: 'Buduj' | 'Ulepsz',
  upgrade?: boolean,
): void {
  const goldKoszt = buildingGoldPurchaseCost(item.koszt);
  const canBuy = !!cfg.onPurchaseBuilding && cfg.getTreasury;
  const stac = skarb === undefined ? true : skarb >= goldKoszt;
  const bBuy = el('button', 'btn btn-sm btn-g', 'Kup');
  (bBuy as HTMLButtonElement).disabled = !canBuy || !stac;
  if (!canBuy) bBuy.title = 'Wymaga wpiecia onPurchaseBuilding przez silnik';
  else if (!stac) bBuy.title = `Za malo zlota (${skarb ?? 0}/${goldKoszt})`;
  else bBuy.title = `Kup natychmiast za ${goldKoszt} złota (×2 kosztu Pracy)`;
  bBuy.addEventListener('click', () => {
    cfg.onPurchaseBuilding?.(city.id, item, goldKoszt);
    rerender();
  });
  btnWrap.appendChild(bBuy);

  const bBuild = el('button', 'btn btn-sm btn-b', buildLabel);
  bBuild.title = `Dodaj do kolejki · ${item.koszt} pracy`;
  bBuild.addEventListener('click', () => addItem(city, item, upgrade ? { upgrade: true } : undefined));
  btnWrap.appendChild(bBuild);
}

// ---------------------------------------------------------------------------
// Mini-karty budynków / jednostek (miniatura + rozwijana karta ⓘ)
// ---------------------------------------------------------------------------

function findBuildingDef(data: GameData, id: string): BuildingDef | undefined {
  return data.buildings.find(b => b.id === id);
}

function findUnitDef(data: GameData, id: string): UnitDef | undefined {
  return data.units.find(u => u.Jednostka === id);
}

function customBuildingIconClass(_def: BuildingDef | undefined): string | null {
  return null;
}

function buildingIconHtml(def: BuildingDef | undefined, buildingId?: string): string {
  return buildingIconSvg(def, buildingId ?? def?.id);
}

function unitIconHtml(u: UnitDef | undefined, id?: string): string {
  const key = id ?? u?.Jednostka;
  const svg = unitInfographicSvg(u, key, 22);
  if (svg) return svg;
  return unitIconSvg(u, key);
}

function unitMedallionHtml(u: UnitDef | undefined, id?: string, size = 22): string {
  const key = id ?? u?.Jednostka;
  const medallion = unitInfographicMedallionHtml(u, key, size);
  if (medallion) return medallion;
  const svg = unitIconSvg(u, key);
  return svg ? `<span class="unit-infographic-medallion" aria-hidden="true">${svg}</span>` : '';
}

function productionItemIconHtml(data: GameData | null, item: ProductionItem): string {
  if (!data) {
    return item.kind === 'budynek'
      ? buildingIconSvg(undefined, item.id)
      : unitIconSvg(undefined, item.id);
  }
  return item.kind === 'budynek'
    ? buildingIconHtml(findBuildingDef(data, item.id), item.id)
    : unitIconHtml(findUnitDef(data, item.id), item.id);
}

function fillIconElement(el: HTMLElement, iconHtml: string): void {
  if (iconHtml.startsWith('<svg')) el.innerHTML = iconHtml;
  else if (iconHtml) el.textContent = iconHtml;
}

function makeMiniThumb(iconHtml: string): HTMLDivElement {
  const t = el('div', 'mini-thumb');
  fillIconElement(t, iconHtml);
  return t;
}

function makeBuildingThumb(def: BuildingDef | undefined): HTMLDivElement {
  return makeMiniThumb(buildingIconHtml(def));
}

function appendBuildingInlineIcon(parent: HTMLElement, def: BuildingDef | undefined): void {
  const bi = el('span', 'bi');
  fillIconElement(bi, buildingIconHtml(def));
  parent.appendChild(bi);
}

function appendProductionPicon(parent: HTMLElement, data: GameData | null, item: ProductionItem): void {
  const iconEl = el('div', 'picon');
  fillIconElement(iconEl, productionItemIconHtml(data, item));
  parent.appendChild(iconEl);
}

function productionQueueIconSpan(data: GameData | null, item: ProductionItem): HTMLElement {
  const s = el('span');
  fillIconElement(s, productionItemIconHtml(data, item));
  return s;
}

function createScrollList(
  className = 'list-scroll',
  opts?: { visible?: number; rowEm?: number; fill?: boolean },
): HTMLDivElement {
  const sc = el('div', className);
  if (opts?.fill) {
    sc.classList.add('list-scroll-fill');
  } else if (opts?.visible != null) {
    const rowH = opts.rowEm ?? LIST_ROW_HEIGHT_EM;
    sc.style.maxHeight = `calc(${opts.visible} * ${rowH}em)`;
    sc.style.overflowY = 'auto';
    sc.style.overflowX = 'hidden';
    sc.style.scrollbarWidth = 'thin';
    sc.style.paddingRight = '0.1em';
  }
  return sc;
}

const YIELD_BRAND: { key: keyof BuildingDef['baza']; brandId: string; label: string }[] = [
  { key: 'praca', brandId: 'res-work', label: 'Praca' },
  { key: 'pieniadz', brandId: 'res-treasury', label: 'Pieniądz' },
  { key: 'zywnosc', brandId: 'loaf', label: 'Żywność' },
  { key: 'nauka', brandId: 'science-owl', label: 'Nauka' },
  { key: 'kultura', brandId: 'res-culture', label: 'Kultura' },
  { key: 'zadowolenie', brandId: 'chip-happiness', label: 'Zadowolenie' },
  { key: 'obrona', brandId: 'chip-garrison', label: 'Obrona' },
];

function yieldBrandIconHtml(brandId: string, size: BrandIconSize = 14): string {
  if (brandId === 'loaf') return `<span class="civ-cs-inline-loaf">${loafIconHtml('civ-v-loaf-chip')}</span>`;
  if (brandId === 'science-owl') return `<span class="civ-cs-chip-ic-wrap">${scienceOwlIconHtml()}</span>`;
  return cityPanelChipIconWrap(brandId, size);
}

function formatYieldLine(b: BuildingDef['baza'], p: BuildingDef['przyrost']): string {
  const parts: string[] = [];
  for (const y of YIELD_BRAND) {
    const base = b[y.key] ?? 0;
    const inc = p[y.key] ?? 0;
    if (base !== 0 || inc !== 0) {
      const incStr = inc !== 0 ? ` (+${inc}/poz.)` : '';
      parts.push(`${base >= 0 ? '+' : ''}${base} ${yieldBrandIconHtml(y.brandId)}${incStr}`);
    }
  }
  return parts.join(' · ') || '—';
}

/** Chipy bonusów (max 3) — mockup Poziom B budynków 1E. */
function buildingBonusChipsHtml(def: BuildingDef, max = 3): string {
  const chips: string[] = [];
  for (const y of YIELD_BRAND) {
    if (chips.length >= max) break;
    const base = def.baza[y.key] ?? 0;
    const inc = def.przyrost[y.key] ?? 0;
    if (base === 0 && inc === 0) continue;
    const val = base !== 0 ? `${base >= 0 ? '+' : ''}${base}` : `+${inc}/poz.`;
    chips.push(
      `<span class="bld-infocard-chip">${yieldBrandIconHtml(y.brandId, 13)}${val} ${y.label.toLowerCase()}</span>`,
    );
  }
  if (def.baza.mnoznik || def.przyrost.mnoznik) {
    if (chips.length < max) {
      chips.push(`<span class="bld-infocard-chip">×${def.baza.mnoznik ?? 1} mnożnik</span>`);
    }
  }
  return chips.join('');
}

function parentBuildingName(data: GameData, upgradeFromId: string | undefined): string | null {
  const id = upgradeFromId?.trim();
  if (!id) return null;
  return findBuildingDef(data, id)?.nazwa ?? id;
}

/** Karta infografiki budynku (Design Poziom B · 2026-07-05). */
function buildBuildingInfocard(
  def: BuildingDef,
  data: GameData,
  opts?: {
    locked?: boolean;
    lockHint?: string;
    readyTag?: string;
    item?: ProductionItem;
    praca?: number;
    skarb?: number;
    buildLabel?: 'Buduj' | 'Ulepsz';
    upgrade?: boolean;
    city?: City;
  },
): HTMLDivElement {
  const card = el('div', 'bld-infocard');
  if (opts?.locked) card.classList.add('is-catalog-locked');

  const hd = el('div', 'bld-infocard-hd');
  const ic = el('div', 'bld-infocard-ic');
  fillIconElement(ic, buildingIconHtml(def));
  hd.appendChild(ic);
  const titWrap = el('div');
  titWrap.style.cssText = 'flex:1;min-width:0;';
  titWrap.innerHTML = `<div class="bld-infocard-title">${def.nazwa}</div>`;
  if (def.kategoria) {
    const cat = el('span', 'bld-infocard-cat');
    cat.textContent = def.kategoria;
    titWrap.appendChild(cat);
  }
  hd.appendChild(titWrap);
  card.appendChild(hd);

  const bd = el('div', 'bld-infocard-bd');
  const chipsHtml = buildingBonusChipsHtml(def);
  if (chipsHtml) {
    const chips = el('div', 'bld-infocard-chips');
    chips.innerHTML = chipsHtml;
    bd.appendChild(chips);
  }

  const parentName = parentBuildingName(data, def.upgradeFrom);
  if (parentName) {
    const upg = el('div', 'bld-infocard-upg');
    upg.innerHTML = `<span style="color:var(--gold);font-size:1.1em;line-height:1;">↗</span>` +
      `<span>Rozbudowa z <span style="color:var(--gold);">${parentName}</span></span>`;
    bd.appendChild(upg);
  }

  const ft = el('div', 'bld-infocard-ft');
  const era = el('span', 'bld-infocard-era');
  era.innerHTML = `<span class="bld-infocard-era-dot"></span>Epoka ${epochLabelNum(def.epokaWejscia).toLowerCase()}`;
  ft.appendChild(era);
  const ftR = el('span');
  ftR.textContent = def.maksPoziom > 1 ? `max ${def.maksPoziom} poz.` : 'bez upgrade';
  if (parentName) ftR.textContent = def.techUnlock && !isEmptyDataVal(def.techUnlock) ? String(def.techUnlock) : '↗ upgrade';
  ft.appendChild(ftR);
  bd.appendChild(ft);

  if (opts?.item && opts.city) {
    const act = el('div', 'bld-infocard-actions');
    const e = etaTurns(opts.item.koszt, 0, opts.praca ?? 0);
    const workIc = cityPanelChipIconWrap('res-work', 12);
    const cost = el('div', 'bld-infocard-cost');
    cost.innerHTML = `${opts.item.koszt}${workIc}${e !== null ? ' · ~' + e + ' ' + tury(e) : ''}`;
    act.appendChild(cost);
    const btnWrap = el('div', 'civ-v-bld-btns');
    appendBuildActionButtons(btnWrap, opts.city, opts.item, opts.skarb, opts.buildLabel ?? 'Buduj', opts.upgrade);
    act.appendChild(btnWrap);
    bd.appendChild(act);
  } else if (opts?.readyTag) {
    const tag = el('div', 'bld-catalog-ready-tag');
    tag.textContent = opts.readyTag;
    bd.appendChild(tag);
  } else if (opts?.lockHint) {
    const lock = el('div', 'bld-infocard-lock');
    lock.textContent = opts.lockHint;
    bd.appendChild(lock);
  }

  card.appendChild(bd);
  return card;
}

const EPOCH_LABEL: Record<number, string> = { 1: 'Kamień', 2: 'Brąz', 3: 'Żelazo' };

function epochLabelNum(n: number): string {
  return EPOCH_LABEL[n] ?? `Epoka ${n}`;
}

function isEmptyDataVal(v: unknown): boolean {
  return v == null || v === '' || v === '—' || v === '-';
}

function unitExtraField(u: UnitDef, key: string): string | number | null {
  const v = (u as unknown as Record<string, unknown>)[key];
  if (isEmptyDataVal(v)) return null;
  return v as string | number;
}

function techPrereqChain(data: GameData, techName: string): string[] {
  const chain: string[] = [];
  let cur = techName.trim();
  const seen = new Set<string>();
  while (cur && !isEmptyDataVal(cur) && !seen.has(cur)) {
    seen.add(cur);
    chain.unshift(cur);
    const t = getTechDef(data, cur);
    const prereq = t?.['Wymaga (prereq)'];
    if (!prereq || isEmptyDataVal(prereq)) break;
    cur = String(prereq).trim();
  }
  return chain;
}

function appendDetailSection(card: HTMLElement, title: string): void {
  const s = el('div', 'dc-section');
  s.innerHTML = cpInlineIcons(title);
  card.appendChild(s);
}

function appendDetailGrid(card: HTMLElement): HTMLDivElement {
  const g = el('div', 'dc-grid');
  card.appendChild(g);
  return g;
}

function gridDetailRow(grid: HTMLElement, label: string, val: string | null | undefined): void {
  if (!val || isEmptyDataVal(val)) return;
  const lEl = el('span', 'dc-l');
  lEl.innerHTML = cpInlineIcons(label);
  grid.appendChild(lEl);
  const vEl = el('span', 'dc-v');
  vEl.innerHTML = cpInlineIcons(val);
  grid.appendChild(vEl);
}

function appendDetailAlgo(card: HTMLElement, title: string, steps: string[]): void {
  appendDetailSection(card, title);
  for (let i = 0; i < steps.length; i++) {
    const line = el('div', 'dc-algo-step');
    line.innerHTML = cpInlineIcons(`${i + 1}. ${steps[i]}`);
    card.appendChild(line);
  }
}

function appendDetailFormula(card: HTMLElement, text: string): void {
  const f = el('div', 'dc-formula');
  f.innerHTML = cpInlineIcons(text);
  card.appendChild(f);
}

function appendTechDetailBlock(card: HTMLElement, data: GameData, techName: string | null | undefined): void {
  if (!techName || isEmptyDataVal(techName)) {
    const g = appendDetailGrid(card);
    gridDetailRow(g, 'Technologia', 'Brak wymogu (startowa)');
    return;
  }
  const t = getTechDef(data, techName);
  const grid = appendDetailGrid(card);
  gridDetailRow(grid, 'Odblokowuje tech', techName);
  if (!t) return;

  if (t.Epoka) gridDetailRow(grid, 'Epoka tech', t.Epoka);
  if (t.Poziom != null) gridDetailRow(grid, 'Poziom drzewka', String(t.Poziom));
  if (t['Koszt nauki'] != null) gridDetailRow(grid, 'Koszt badania', `${t['Koszt nauki']}${naukaCostSuffix()}`);

  const chain = techPrereqChain(data, techName);
  if (chain.length > 1) {
    gridDetailRow(grid, 'Łańcuch wymagań', chain.join(' → '));
  } else {
    const prereq = t['Wymaga (prereq)'];
    if (prereq && !isEmptyDataVal(prereq)) gridDetailRow(grid, 'Bezpośredni prereq', String(prereq));
  }

  if (t['wymagany budynek'] && !isEmptyDataVal(t['wymagany budynek'])) {
    gridDetailRow(grid, 'Wymaga budynek', String(t['wymagany budynek']));
  }
  if (t['Dostęp do surowca.'] && !isEmptyDataVal(t['Dostęp do surowca.'])) {
    gridDetailRow(grid, 'Surowiec (tech)', String(t['Dostęp do surowca.']));
  }
  if (t['Odblokowuje budynek'] && !isEmptyDataVal(t['Odblokowuje budynek'])) {
    gridDetailRow(grid, 'Odblokowuje budynek', String(t['Odblokowuje budynek']));
  }
  if (t['Odblokowuje surowiec.'] && !isEmptyDataVal(t['Odblokowuje surowiec.'])) {
    gridDetailRow(grid, 'Odblokowuje surowiec', String(t['Odblokowuje surowiec.']));
  }
  const terrainUnlock = (t as unknown as Record<string, unknown>)['Odblokowuje ulepszenie terenu'];
  if (terrainUnlock && !isEmptyDataVal(terrainUnlock)) {
    gridDetailRow(grid, 'Odblokowuje pole', String(terrainUnlock));
  }
  if (t.Uwagi && !isEmptyDataVal(t.Uwagi)) gridDetailRow(grid, 'Uwagi tech', String(t.Uwagi));
}

function buildBuildingDetailCard(def: BuildingDef, data: GameData): HTMLDivElement {
  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.appendChild(makeBuildingThumb(def));
  const ht = el('span');
  ht.textContent = def.nazwa;
  head.appendChild(ht);
  card.appendChild(head);

  appendDetailSection(card, 'Charakterystyka');
  const gChar = appendDetailGrid(card);
  gridDetailRow(gChar, 'Kategoria', def.kategoria);
  gridDetailRow(gChar, 'Epoka wejścia', epochLabelNum(def.epokaWejscia));
  gridDetailRow(gChar, 'Typ', def.wielokrotny ? 'Wielokrotny' : 'Unikalny w mieście');

  appendDetailSection(card, 'Plony i efekty');
  const gYield = appendDetailGrid(card);
  let anyYield = false;
  for (const y of YIELD_BRAND) {
    const base = def.baza[y.key] ?? 0;
    const inc = def.przyrost[y.key] ?? 0;
    if (base !== 0 || inc !== 0) {
      anyYield = true;
      const incStr = inc !== 0 ? ` (+${inc}/poz.)` : '';
      gridDetailRow(gYield, y.label, `${base >= 0 ? '+' : ''}${base} ${yieldBrandIconHtml(y.brandId)}${incStr}`);
    }
  }
  if (def.baza.mnoznik || def.przyrost.mnoznik) {
    anyYield = true;
    gridDetailRow(gYield, 'Mnożnik', `baza ${def.baza.mnoznik} · +${def.przyrost.mnoznik}/poz.`);
  }
  if (!anyYield) gridDetailRow(gYield, 'Efekty', '—');

  appendDetailSection(card, 'Koszty');
  const gCost = appendDetailGrid(card);
  const pace = cfg.getBuildingCostPace?.() ?? 'niski';
  const difficulty = cfg.getDifficulty?.() ?? 'normal';
  const ownerId = 0;
  const baseWork = itemCost('budynek', def.id, { buildings: data.buildings, units: data.units }, 1);
  const workCost = buildingWorkCost(baseWork, undefined, pace, ownerId, difficulty);
  gridDetailRow(gCost, 'Koszt budowy', `${workCost} ${cityPanelChipIconWrap('res-work', 14)}`);
  if (def.przyrostKosztu) gridDetailRow(gCost, 'Przyrost kosztu', `+${def.przyrostKosztu} ${cityPanelChipIconWrap('res-work', 14)} / poziom`);
  gridDetailRow(gCost, 'Utrzymanie', `${def.utrzymanie} ${cityPanelChipIconWrap('res-treasury', 14)}`);
  if (def.przyrostUtrzymania) gridDetailRow(gCost, 'Przyrost utrzym.', `+${def.przyrostUtrzymania} ${cityPanelChipIconWrap('res-treasury', 14)} / poziom`);

  if (def.maksPoziom > 1) {
    appendDetailSection(card, 'Poziomy');
    const gLvl = appendDetailGrid(card);
    gridDetailRow(gLvl, 'Maks. poziom', String(def.maksPoziom));
    const names = def.nazwyPoziomow.filter(Boolean);
    if (names.length) gridDetailRow(gLvl, 'Nazwy', names.join(' → '));
  }

  if (def.wymagania && !isEmptyDataVal(def.wymagania)) {
    appendDetailSection(card, 'Wymagania budynku');
    const gReq = appendDetailGrid(card);
    gridDetailRow(gReq, 'Wymagania', def.wymagania);
  }

  appendDetailSection(card, 'Technologie');
  appendTechDetailBlock(card, data, def.techUnlock);

  if (def.uwagi && !isEmptyDataVal(def.uwagi)) {
    const note = el('div', 'dc-note');
    note.textContent = def.uwagi;
    card.appendChild(note);
  }
  return card;
}

function buildUnitDetailCard(u: UnitDef, data: GameData): HTMLDivElement {
  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  const thumb = el('span');
  thumb.innerHTML = unitInfographicMedallionHtml(u, u.Jednostka, 28);
  head.appendChild(thumb);
  const ht = el('span');
  const role = u['Rola (linia)'] ?? '';
  ht.textContent = `${u.Jednostka}${role ? ' · ' + role : ''}`;
  head.appendChild(ht);
  card.appendChild(head);

  appendDetailSection(card, 'Charakterystyka');
  const gChar = appendDetailGrid(card);
  if (role) gridDetailRow(gChar, 'Linia', role);
  if (u.Epoka) gridDetailRow(gChar, 'Epoka', u.Epoka);
  if (u.Kultura && !isEmptyDataVal(u.Kultura)) gridDetailRow(gChar, 'Wymaga kultura', String(u.Kultura));
  const typ = unitExtraField(u, 'Typ');
  if (typ) gridDetailRow(gChar, 'Typ', String(typ));
  const klasa = unitExtraField(u, 'Klasa');
  if (klasa) gridDetailRow(gChar, 'Klasa', String(klasa));
  if (u['Super-jednostka'] === 'TAK') gridDetailRow(gChar, 'Super-jednostka', 'Tak');
  const wZa = u['W zamian za'];
  if (wZa && !isEmptyDataVal(wZa)) gridDetailRow(gChar, 'W zamian za', String(wZa));

  appendDetailSection(card, 'Walka');
  const gFight = appendDetailGrid(card);
  const fight = (label: string, val: string | number | null | undefined, fmt?: (n: number) => string) => {
    if (val == null || isEmptyDataVal(val)) return;
    gridDetailRow(gFight, label, fmt && typeof val === 'number' ? fmt(val) : String(val));
  };
  fight('Atak w zwarciu', u.Atak);
  fight('Obrona', u.Obrona);
  fight('Obrażenia broni', u.Uderzenie);
  fight('Pancerz', u.Pancerz);
  fight('Przebicie', u.Przebicie);
  fight('Bonus szarży', unitExtraField(u, 'Bonus szarży'));
  fight('Atak dystansowy', u['Atak dystansowy']);
  fight('HP', u.Health);
  fight('Ruch (mapa)', u.Ruch, n => `${n} hex`);
  fight('Ruch (bitwa)', u['Ruch w bitwie (heksy)'], n => `${n} hex`);
  fight('Zasięg', u['Zasięg ataku (hex)']);
  fight('Pociski', u['Ilość pocisków']);
  fight('Widok pola', u['Widok pola'], n => `${n} hex`);
  fight('Kara flanki', u['Kara obrony z flanki (%)'], n => `${n}%`);
  fight('Kara od tyłu', u['Kara obrony z tyłu (%)'], n => `${n}%`);
  fight('Próg dezercji', u['Próg dezercji (% health)'], n => `${Math.round(n * 100)}% HP`);
  fight('Morale bazowe', unitExtraField(u, 'Morale bazowe'));
  fight('Morale ucieczki', unitExtraField(u, 'Morale ucieczki'));

  appendDetailSection(card, 'Ekonomia');
  const gEco = appendDetailGrid(card);
  gridDetailRow(gEco, 'Koszt rekrutacji', u['Pieniądz (koszt)'] != null ? `${u['Pieniądz (koszt)']} 💰` : null);
  gridDetailRow(gEco, 'Utrzymanie', u['Utrzymanie (Pieniądz/turę)'] != null
    ? `${u['Utrzymanie (Pieniądz/turę)']} ${cityPanelChipIconWrap('res-treasury', 14)}`
    : null);
  gridDetailRow(gEco, 'Żywność', u['żywność/turę'] != null ? `${u['żywność/turę']}` : null);
  gridDetailRow(gEco, 'Ludność', u.Ludność != null ? String(u.Ludność) : null);
  const surow = u.Surowiec;
  const surowIl = u['Surowiec (ilość)'];
  if (surow && !isEmptyDataVal(surow)) {
    gridDetailRow(gEco, 'Surowiec', surowIl != null ? `${surow} × ${surowIl}` : String(surow));
  }

  appendDetailSection(card, 'Technologie');
  appendTechDetailBlock(card, data, u.Tech);

  if (u.Uwagi && !isEmptyDataVal(u.Uwagi)) {
    const note = el('div', 'dc-note');
    note.textContent = u.Uwagi;
    card.appendChild(note);
  }
  return card;
}

function attachUnitRowThumb(
  row: HTMLElement,
  udef: UnitDef | undefined,
  id: string,
  data: GameData | null,
  ownerId: number,
): void {
  const thumb = el('div', 'item-thumb unit-row-thumb');
  thumb.style.cssText = 'width:2.6em;height:2.6em;flex-shrink:0;overflow:hidden;border-radius:4px;';
  row.appendChild(thumb);
  if (udef && data) {
    const color = cfg.getOwnerColor?.(ownerId) ?? defaultOwnerColor();
    mountUnitMiniPreview(thumb, udef, color);
    attachHoverDetail(thumb, () => buildUnitDetailCard(udef, data), 180);
  } else {
    const fallback = el('div', 'mini-thumb');
    fillIconElement(fallback, unitIconHtml(udef, id));
    thumb.appendChild(fallback);
  }
}

function appendBuildableItemRow(
  scroll: HTMLElement,
  city: City,
  item: ProductionItem,
  data: GameData,
  opts: { praca: number; skarb: number | undefined; buildLabel: 'Buduj' | 'Ulepsz'; upgrade?: boolean },
): void {
  const wrap = el('div', 'bld-infocard-wrap');
  const def = findBuildingDef(data, item.id);
  if (def) {
    wrap.appendChild(buildBuildingInfocard(def, data, {
      item,
      city,
      praca: opts.praca,
      skarb: opts.skarb,
      buildLabel: opts.buildLabel,
      upgrade: opts.upgrade,
    }));
  } else {
    const row = el('div', 'item-row');
    row.textContent = item.nazwa;
    wrap.appendChild(row);
  }
  scroll.appendChild(wrap);
}

function appendUnitRecruitCard(
  grid: HTMLElement,
  city: City,
  item: ProductionItem,
  data: GameData,
  skarb: number | undefined,
): void {
  const udef = findUnitDef(data, item.id);
  if (!udef) return;
  const cardWrap = buildUnitRecruitCard({
    udef,
    item,
    data,
    skarb,
    canPurchase: !!cfg.onPurchaseUnit,
    treasuryIconHtml: cityPanelChipIconWrap('res-treasury', 14),
    onRecruit: () => recruitUnit(city, item),
  });
  const card = cardWrap.querySelector('.unit-recruit-card');
  if (card) {
    attachHoverDetail(card as HTMLElement, () => buildUnitDetailCard(udef, data), 220);
  }
  grid.appendChild(cardWrap);
}

function recruitUnit(city: City, item: ProductionItem): void {
  const skarb = cfg.getTreasury?.(city.ownerId);
  if (skarb !== undefined && skarb < item.koszt) return;
  if (cfg.onPurchaseUnit) {
    cfg.onPurchaseUnit(city.id, item.id, item.koszt);
  } else {
    const data = gameData();
    const prodItem = data ? unitProductionItem(item.id, data) : item;
    if (!prodItem) return;
    setProd(city.id, enqueueRecruitment(getProd(city.id), prodItem));
  }
  rerender();
}

function appendRecruitmentQueue(mount: HTMLElement, city: City, player: boolean, opts?: { w4?: boolean }): void {
  const prod = getProd(city.id);
  const rq = prod.rekrutacja ?? [];
  const data = gameData();
  const wrap = el('div');
  wrap.style.cssText = opts?.w4
    ? 'margin-bottom:0.45em;padding-bottom:0.35em;border-bottom:1px solid rgba(232,216,138,.12);'
    : 'margin-top:0.5em;border-top:1px solid var(--border);padding-top:0.35em;';
  const qh = el('div', opts?.w4 ? 'civ-w4-section-hd' : 'gold');
  if (opts?.w4) {
    qh.textContent = 'Kolejka rekrutacji';
  } else {
    qh.textContent = 'Kolejka rekrutacji:';
    qh.style.cssText = 'font-size:0.78em;font-weight:700;margin-bottom:0.22em;';
  }
  wrap.appendChild(qh);
  if (rq.length === 0) {
    const none = el('span', 'muted', '— brak —');
    none.style.fontSize = '0.75em';
    wrap.appendChild(none);
  } else {
    const hint = el('div', 'muted');
    hint.style.cssText = 'font-size:0.7em;margin-bottom:0.3em;';
    hint.innerHTML = cpInlineIcons(`Opłacone ${cityPanelChipIconWrap('res-treasury', 14)} — max 1 jednostka gotowa na turę (v0.1).`);
    wrap.appendChild(hint);
    const sc = createScrollList(opts?.w4 ? 'unit-w4-scroll' : 'recruit-scroll', { visible: RECRUIT_QUEUE_VISIBLE, rowEm: 4.2 });
    for (let i = 0; i < rq.length; i++) {
      const it = rq[i]!;
      const udef = data ? findUnitDef(data, it.id) : undefined;
      const isFront = i === 0;
      const badge = isFront
        ? '<span class="blue" style="font-size:0.72em;font-weight:600;margin-left:0.3em;">· nast. tura</span>'
        : `<span class="muted" style="font-size:0.68em;margin-left:0.3em;">#${i + 1}</span>`;
      if (opts?.w4) {
        const block = el('div', 'unit-w4-card');
        const thumb = el('div', 'unit-w4-thumb');
        thumb.innerHTML = unitMedallionHtml(udef, it.id, 20);
        block.appendChild(thumb);
        const body = el('div', 'unit-w4-body');
        const name = el('div', 'unit-w4-name');
        name.innerHTML = `${it.nazwa}${badge}`;
        body.appendChild(name);
        const cost = el('div', 'unit-w4-cost');
        cost.innerHTML = `Opłacone ${it.koszt} ${cityPanelChipIconWrap('res-treasury', 14)}`;
        body.appendChild(cost);
        block.appendChild(body);
        if (udef && data) {
          attachHoverDetail(thumb, () => buildUnitDetailCard(udef, data), 180);
        }
        if (player) {
          const x = el('button', 'btn btn-sm');
          x.innerHTML = cityPanelChipIconWrap('ui-close', 14);
          x.style.cssText = 'padding:0 0.35em;align-self:flex-start;flex:none;';
          const idx = i;
          x.title = 'Usuń z kolejki (zwrot opłaty do skarbca)';
          x.addEventListener('click', () => {
            cfg.onCancelRecruitment?.(city.id, it.koszt);
            setProd(city.id, dequeueRecruitment(getProd(city.id), idx));
            rerender();
          });
          block.appendChild(x);
        }
        sc.appendChild(block);
        continue;
      }
      const icon = unitIconHtml(udef, it.id);
      const block = el('div', 'recruit-prod');
      block.style.position = 'relative';
      const iconEl = el('div', 'picon');
      fillIconElement(iconEl, icon);
      block.appendChild(iconEl);
      if (udef && data) {
        attachHoverDetail(iconEl, () => buildUnitDetailCard(udef, data), 180);
      }
      const body = el('div');
      body.style.cssText = 'flex:1;min-width:0;';
      body.innerHTML =
        `<div style="font-size:0.92em;font-weight:700;" class="gold">${it.nazwa}${badge}</div>` +
        `<div class="muted" style="font-size:0.74em;">Jednostka · Opłacone ${it.koszt} ${cityPanelChipIconWrap('res-treasury', 14)}</div>`;
      block.appendChild(body);
      if (player) {
        const x = el('button', 'btn btn-sm');
        x.innerHTML = cityPanelChipIconWrap('ui-close', 14);
        x.style.cssText = 'padding:0 0.35em;align-self:flex-start;';
        const idx = i;
        x.title = 'Usuń z kolejki (zwrot opłaty do skarbca)';
        x.addEventListener('click', () => {
          cfg.onCancelRecruitment?.(city.id, it.koszt);
          setProd(city.id, dequeueRecruitment(getProd(city.id), idx));
          rerender();
        });
        block.appendChild(x);
      }
      sc.appendChild(block);
    }
    wrap.appendChild(sc);
  }
  mount.appendChild(wrap);
}

/** Kolejka budynków (pozycje 2+ w kolejce produkcji). */
function appendBuildQueueSection(mount: HTMLElement, city: City, player: boolean): void {
  const prod = getProd(city.id);
  const data = gameData();
  const qWrap = el('div');
  qWrap.style.cssText = 'margin-bottom:0.42em;padding-bottom:0.35em;border-bottom:1px solid var(--border);';
  const qh = el('div', 'gold', 'Kolejka budowy:');
  qh.style.cssText = 'font-size:0.78em;font-weight:700;margin-bottom:0.22em;';
  qWrap.appendChild(qh);
  if (prod.kolejka.length <= 1) {
    const none = el('span', 'muted', '— brak dalszych pozycji —');
    none.style.fontSize = '0.75em';
    qWrap.appendChild(none);
  } else {
    const sc = createScrollList('build-queue-scroll', {
      visible: BUILD_QUEUE_VISIBLE,
      rowEm: 2.75,
    });
    for (let i = 1; i < prod.kolejka.length; i++) {
      const it = prod.kolejka[i] as ProductionItem;
      const qi = el('div', 'qitem');
      qi.style.marginBottom = '0.15em';
      qi.dataset.queueIdx = String(i);
      if (player) qi.classList.add('qitem-draggable');
      if (player) {
        const grip = el('span', 'qitem-grip', '⋮⋮');
        grip.title = 'Przeciągnij, aby zmienić kolejność';
        qi.appendChild(grip);
      }
      qi.appendChild(productionQueueIconSpan(data, it));
      const qLabel = el('span');
      qLabel.style.flex = '1';
      qLabel.textContent = it.nazwa;
      qi.appendChild(qLabel);
      const idx = i;
      const up = el('button', 'btn btn-sm', '↑');
      up.style.cssText = 'padding:0 0.35em;';
      (up as HTMLButtonElement).disabled = i <= 1;
      up.addEventListener('click', () => { setProd(city.id, moveQueueItem(getProd(city.id), idx, -1)); rerender(); });
      const down = el('button', 'btn btn-sm', '↓');
      down.style.cssText = 'padding:0 0.35em;';
      (down as HTMLButtonElement).disabled = i >= prod.kolejka.length - 1;
      down.addEventListener('click', () => { setProd(city.id, moveQueueItem(getProd(city.id), idx, 1)); rerender(); });
      const x = el('button', 'btn btn-sm', '✕');
      x.style.cssText = 'padding:0 0.35em;';
      x.addEventListener('click', () => { setProd(city.id, dequeue(getProd(city.id), idx)); rerender(); });
      if (player) { qi.appendChild(up); qi.appendChild(down); qi.appendChild(x); }
      sc.appendChild(qi);
    }
    if (player) bindBuildQueueDragReorder(sc, city);
    qWrap.appendChild(sc);
  }
  mount.appendChild(qWrap);
}

function renderProd(mount: HTMLElement, city: City, view: CityView | null): void {
  mount.innerHTML = '';
  mount.appendChild(el('div', 'ptitle', '<span>Produkcja</span>'));
  const prod = getProd(city.id);
  const front = frontItem(prod);
  const praca = view ? view.praca : 0;
  const player = city.ownerId === 0; // AI cities -> read-only (no build/queue controls)
  const data = gameData();

  // B7: obie kolejki na górze sekcji Produkcja (wszystkie zakładki lewego raila)
  appendBuildQueueSection(mount, city, player);
  appendRecruitmentQueue(mount, city, player);

  if (player && cfg.getBudowaState) {
    const bState = cfg.getBudowaState(city.id);
    if (bState) {
      const bToolbar = el('div', 'okolica-toolbar budowa-toolbar');
      bToolbar.style.cssText = 'margin:0.12em 0 0.35em;';
      const bLabel = el('span', 'muted');
      bLabel.style.cssText = 'font-size:0.72em;margin-right:0.35em;white-space:nowrap;';
      bLabel.textContent = 'Auto budowa:';
      bToolbar.appendChild(bLabel);
      const bProfiles = el('div', 'okolica-toolbar-profiles');
      appendBudowaToolbarProfiles(bProfiles, city, bState.focus, bState.tryb);
      bToolbar.appendChild(bProfiles);
      mount.appendChild(bToolbar);
    }
  }

  if (!front) {
    const empty = el('div', 'muted');
    const bTryb = cfg.getBudowaState?.(city.id)?.tryb;
    if (bTryb === 'auto') {
      const bf = cfg.getBudowaState?.(city.id)?.focus ?? 'zrownowazone';
      empty.innerHTML =
        `Auto budowa (${BUDOWA_FOCUS_TITLE[bf]}) — następny budynek wybierze zarządca` +
        ' (pusta kolejka, uzupełnienie na końcu tury).';
    } else {
      empty.innerHTML =
        `Kolejka pusta — wybierz ${cityPanelChipIconWrap('cp-buildings', 14)} Buduj lub ${cityPanelChipIconWrap('cp-recruit', 14)} Rekrut.`;
    }
    mount.appendChild(empty);
  } else {
    const paused = getProd(city.id).wstrzymana === true;
    const e = paused ? null : etaTurns(front.koszt, prod.postep, praca);
    const pct = front.koszt > 0 ? Math.round(Math.min(1, prod.postep / front.koszt) * 100) : 100;
    const workIc = cityPanelChipIconWrap('res-work', 12);
    const pauseBadge = paused
      ? ' <span style="font-size:0.7em;background:#7a4800;color:#ffd090;border:1px solid #c07020;border-radius:3px;padding:0 0.35em;vertical-align:middle;">wstrzymana</span>'
      : '';
    const row = el('div');
    row.style.cssText = 'display:flex;gap:0.55em;align-items:flex-start;';
    appendProductionPicon(row, data, front);
    const body = el('div');
    body.style.flex = '1';
    body.innerHTML =
        `<div style="font-size:1.05em;font-weight:700;" class="gold">${front.nazwa}${pauseBadge}</div>` +
        `<div class="muted" style="font-size:0.78em;">${front.kind === 'budynek' ? 'Budynek' : 'Jednostka'} • Koszt: ${front.koszt} ${workIc}</div>` +
        `<div class="rsb" style="font-size:0.78em;margin:0.22em 0 0.15em;">` +
          `<span class="muted">Zebrana Praca: <span class="gold">${Math.round(prod.postep)} / ${front.koszt}</span> ${workIc}</span>` +
          (paused
            ? `<span style="color:#e08030;font-weight:600;">Wstrzymane — brak postępu</span>`
            : `<span class="blue">${e !== null ? '~' + e + ' ' + tury(e) : 'brak Pracy'}</span>`) +
        `</div>` +
        `<div class="bwrap"><div class="bfill" style="width:${pct}%;background:linear-gradient(90deg,#8a6418,var(--gold));"></div></div>`;
    row.appendChild(body);
    mount.appendChild(row);

    const actions = el('div');
    actions.style.cssText = 'margin-top:0.35em;display:flex;gap:0.3em;flex-wrap:wrap;';
    // Wykup (rush-buy) -- only when the engine exposes treasury + a spend hook.
    if (cfg.getTreasury && cfg.onRushBuy) {
      const koszt = Math.ceil(Math.max(0, front.koszt - prod.postep) * UI_PARAMS.panel_miasta.rush_cost_mnoznik);
      const skarb = cfg.getTreasury(city.ownerId);
      const stac = skarb >= koszt;
      const wykup = el('button', 'btn btn-g');
      wykup.innerHTML = `${cityPanelChipIconWrap('res-treasury', 14)} Wykup (${koszt})`;
      (wykup as HTMLButtonElement).disabled = !stac;
      wykup.title = stac ? 'Zaplac zlotem i ukoncz natychmiast' : 'Za malo zlota (' + skarb + '/' + koszt + ')';
      wykup.addEventListener('click', () => { cfg.onRushBuy?.(city.id, front, koszt); rerender(); });
      actions.appendChild(wykup);
    }
    // Wstrzymaj / Wznów — przełącza flagę wstrzymana dla pozycji w budowie.
    const wstBtn = el('button', 'btn btn-sm', paused ? 'Wznów' : 'Wstrzymaj');
    wstBtn.title = paused ? 'Wznów produkcję' : 'Wstrzymaj produkcję (postęp zachowany)';
    wstBtn.addEventListener('click', () => {
      const cur = getProd(city.id);
      setProd(city.id, setPaused(cur, !cur.wstrzymana));
      rerender();
    });
    actions.appendChild(wstBtn);
    const usun = el('button', 'btn btn-sm', '✕ Usuń');
    usun.addEventListener('click', () => { setProd(city.id, dequeue(getProd(city.id), 0)); rerender(); });
    actions.appendChild(usun);
    if (player) mount.appendChild(actions);
  }
}

function missingTechSteps(data: GameData, techName: string, unlocked: ReadonlySet<string>): string[] {
  const chain = techPrereqChain(data, techName);
  return chain.filter(t => !unlocked.has(t));
}

function formatBuildingCatalogLockHint(
  entry: BuildingCatalogEntry,
  data: GameData,
  unlockedTechs: readonly string[],
): string {
  if (entry.status === 'built') return 'Już wybudowany w tym mieście';
  if (entry.status === 'queued') return '⏳ W kolejce produkcji';
  if (entry.status === 'ready') return '';

  const parts: string[] = [];
  if (entry.missingTech) {
    const unlocked = new Set(unlockedTechs);
    const steps = missingTechSteps(data, entry.missingTech, unlocked);
    if (steps.length > 0) {
      parts.push(`Zbadaj: ${steps.join(' → ')}`);
    } else {
      parts.push(`Zbadaj: ${entry.missingTech}`);
    }
    const tdef = getTechDef(data, entry.missingTech);
    if (tdef?.['wymagany budynek'] && !isEmptyDataVal(tdef['wymagany budynek'])) {
      parts.push(`wymaga budynku: ${tdef['wymagany budynek']}`);
    }
    if (tdef?.['Koszt nauki'] != null) {
      parts.push(`koszt badania ${tdef['Koszt nauki']}${naukaCostSuffix()}`);
    }
  }
  if (entry.wymagania && !isEmptyDataVal(entry.wymagania)) {
    parts.push(entry.wymagania);
  }
  return parts.length > 0 ? `🔒 ${parts.join(' · ')}` : '🔒 Niedostępny';
}

/** Podpowiedź badań do podglądu epoki (toggle B) — łańcuch tech nawet gdy gracz już ma odblokowane. */
function formatBuildingPreviewHint(
  def: BuildingDef,
  data: GameData,
  unlockedTechs: readonly string[],
): string {
  const parts: string[] = [];
  const tech = (def.techUnlock ?? '').trim();
  const unlocked = new Set(unlockedTechs);
  if (tech) {
    const steps = missingTechSteps(data, tech, unlocked);
    if (steps.length > 0) {
      parts.push(`🔒 Zbadaj: ${steps.join(' → ')}`);
    } else {
      parts.push('Badania OK — można budować (lista powyżej)');
    }
    const tdef = getTechDef(data, tech);
    if (tdef?.['wymagany budynek'] && !isEmptyDataVal(tdef['wymagany budynek'])) {
      parts.push(`wymaga budynku: ${tdef['wymagany budynek']}`);
    }
    if (tdef?.['Koszt nauki'] != null) {
      parts.push(`koszt badania ${tdef['Koszt nauki']}${naukaCostSuffix()}`);
    }
  } else {
    parts.push('Brak wymogu badań');
  }
  const wym = (def as unknown as Record<string, unknown>).wymagania;
  if (typeof wym === 'string' && !isEmptyDataVal(wym)) {
    parts.push(wym);
  }
  return parts.join(' · ');
}

function productionCtxForCity(city: City): AvailabilityContext {
  return {
    epoch: cfg.getEpoch?.(city.ownerId) ?? 1,
    builtBuildingIds: cfg.getBuiltBuildingIds?.(city.id) ?? [],
    productionQueue: getProd(city.id).kolejka,
    buildingLevel: 1,
    civBonusy: cfg.getCivBonusy?.(city.ownerId) ?? [],
    civUnitNacja: unitNacjaForCivKey(cfg.getCivKey?.(city.ownerId)),
    placedImprovements: cfg.getPlacedImprovements?.() ?? null,
    buildingCostPace: cfg.getBuildingCostPace?.() ?? 'niski',
    kosztJednostekPace: cfg.getKosztJednostekPace?.() ?? 'niski',
    ownerId: city.ownerId,
    difficulty: cfg.getDifficulty?.() ?? 'normal',
  };
}

function collectEraPreviewEntries(
  data: GameData,
  techs: readonly string[],
  prodCtx: {
    epoch?: number;
    builtBuildingIds?: readonly string[];
    productionQueue?: readonly ProductionItem[];
    buildingLevel?: number;
    civBonusy?: readonly CivBonusLite[];
  },
  fullEraPreview: boolean,
): BuildingCatalogEntry[] {
  const catalog = eraBuildingCatalog(data, techs, prodCtx);
  const built = new Set(prodCtx.builtBuildingIds ?? []);
  const queued = new Set(
    (prodCtx.productionQueue ?? [])
      .filter(it => it.kind === 'budynek')
      .map(it => it.id),
  );
  return catalog.filter(e => {
    if (built.has(e.id) || queued.has(e.id)) return false;
    if (fullEraPreview) return true;
    return e.status === 'locked';
  });
}

/** Wiersz podglądu budynku epoki (zablokowany / w kolejce / wybudowany — bez duplikatu listy akcji). */
function appendCatalogBuildingRow(
  scroll: HTMLElement,
  entry: BuildingCatalogEntry,
  def: BuildingDef | undefined,
  data: GameData,
  lockHint: string,
  opts?: { forceLocked?: boolean },
): void {
  const wrap = el('div', 'bld-infocard-wrap');
  const previewLocked = opts?.forceLocked === true;
  if (def) {
    wrap.appendChild(buildBuildingInfocard(def, data, {
      locked: previewLocked || entry.status === 'locked',
      lockHint: previewLocked || entry.status === 'locked' ? lockHint : undefined,
      readyTag: !previewLocked && entry.status === 'ready' ? 'Można budować' : undefined,
    }));
  } else {
    const row = el('div', 'item-row');
    row.textContent = entry.nazwa;
    wrap.appendChild(row);
  }
  scroll.appendChild(wrap);
}

function renderBuildList(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  view: CityView | null,
  opts?: { visibleRows?: number },
): void {
  mount.innerHTML = '';
  const titleRow = el('div');
  titleRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:0.35em;flex-wrap:wrap;margin-bottom:0.12em;';
  titleRow.appendChild(el('div', 'ptitle', '<span>Dostępne do budowy</span>'));
  const previewLbl = el('label');
  previewLbl.style.cssText = 'display:flex;align-items:center;gap:0.28em;font-size:0.68em;color:var(--muted);cursor:pointer;user-select:none;white-space:nowrap;';
  const previewChk = document.createElement('input');
  previewChk.type = 'checkbox';
  previewChk.checked = showEraBuildingPreview;
  previewChk.setAttribute('aria-label', 'Podgląd badań — cała epoka na dole listy');
  previewChk.addEventListener('change', () => {
    setShowEraBuildingPreview(previewChk.checked);
    rerender();
  });
  previewLbl.appendChild(previewChk);
  previewLbl.appendChild(document.createTextNode('Podgląd badań'));
  titleRow.appendChild(previewLbl);
  mount.appendChild(titleRow);
  if (!data) { mount.appendChild(el('div', 'muted', 'Brak danych gry')); return; }
  if (city.ownerId !== 0) { mount.appendChild(el('div', 'muted', 'Miasto rywala — budowa niedostępna (podgląd).')); return; }
  const praca = view ? view.praca : 0;
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const civBonusy = cfg.getCivBonusy?.(city.ownerId) ?? [];
  const prodState = getProd(city.id);
  const prodCtx = productionCtxForCity(city);
  const items = buildableProduction(city, data, techs, prodCtx);

  const skarb = cfg.getTreasury?.(city.ownerId);

  const ups: ProductionItem[] = [];
  if (built.length > 0) {
    const seenUpgrade = new Set<string>();
    for (const id of built) {
      if (seenUpgrade.has(id)) continue;
      seenUpgrade.add(id);
      const def = data.buildings.find(b => b.id === id);
      if (!def || def.maksPoziom <= 1) continue;
      if (buildingTypeQueued(id, prodState.kolejka)) continue;
      const targetLevel = buildingLevelForEpoch(def.epokaWejscia, epoch, def.maksPoziom);
      if (targetLevel <= 1) continue;
      const item = buildingProductionItem(
        id,
        data,
        targetLevel,
        civBonusy,
        cfg.getBuildingCostPace?.() ?? 'niski',
        city.ownerId,
        cfg.getDifficulty?.() ?? 'normal',
      );
      if (!item) continue;
      const nazwaPoziom: string = (def.nazwyPoziomow[targetLevel - 1] ?? '');
      const levelLabel = nazwaPoziom.length > 0
        ? `${def.nazwa} → poz. ${targetLevel} (${nazwaPoziom})`
        : `${def.nazwa} → poziom ${targetLevel}`;
      ups.push({ ...item, nazwa: levelLabel });
    }
  }

  const eraName = EPOCH_NUMBER_TO_NAME[epoch] ?? `Epoka ${epoch}`;
  const fullEraPreview = showEraBuildingPreview;
  const previewEntries = collectEraPreviewEntries(data, techs, prodCtx, fullEraPreview);

  if (items.length === 0 && ups.length === 0 && previewEntries.length === 0) {
    mount.appendChild(el('div', 'muted', '(brak budynków — zbadaj technologie)'));
    return;
  }

  const scroll = createScrollList(
    'list-scroll',
    opts?.visibleRows != null ? { visible: opts.visibleRows } : undefined,
  );
  for (const it of items) {
    appendBuildableItemRow(scroll, city, it, data, { praca, skarb, buildLabel: 'Buduj' });
  }
  if (ups.length > 0) {
    const h = el('div', 'muted');
    h.style.cssText = 'font-size:0.72em;margin:0.35em 0 0.2em;padding-top:0.25em;border-top:1px solid var(--border);';
    h.textContent = 'Ulepsz';
    scroll.appendChild(h);
    for (const u of ups) {
      appendBuildableItemRow(scroll, city, u, data, { praca, skarb, buildLabel: 'Ulepsz', upgrade: true });
    }
  }
  if (previewEntries.length > 0) {
    const h = el('div', 'muted');
    h.style.cssText = 'font-size:0.72em;margin:0.35em 0 0.2em;padding-top:0.25em;border-top:1px solid var(--border);';
    h.textContent = fullEraPreview
      ? `Podgląd epoki ${eraName} (badania)`
      : `Jeszcze zablokowane (epoka ${eraName})`;
    scroll.appendChild(h);
    const sub = el('div', 'muted');
    sub.style.cssText = 'font-size:0.68em;margin-bottom:0.25em;line-height:1.35;';
    sub.textContent = fullEraPreview
      ? 'Wyszarzone — cała epoka bez wybudowanych. Najedź po szczegóły i łańcuch badań.'
      : 'Wyszarzone — najedź po szczegóły i wymagane badania.';
    scroll.appendChild(sub);
    for (const entry of previewEntries) {
      const def = findBuildingDef(data, entry.id);
      const lockHint = fullEraPreview && def
        ? formatBuildingPreviewHint(def, data, techs)
        : formatBuildingCatalogLockHint(entry, data, techs);
      appendCatalogBuildingRow(scroll, entry, def, data, lockHint, {
        forceLocked: fullEraPreview || entry.status === 'locked',
      });
    }
  }
  mount.appendChild(scroll);
}

function buildRecruitTabDetailCard(city: City, unitCount: number, skarb: number | undefined): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Rekrutacja — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Jednostki kupujesz za pieniądz ze skarbca imperium. Opłacone pozycje trafiają do kolejki — max 1 gotowa na turę (v0.1).';
  card.appendChild(intro);
  appendDetailSection(card, 'Stan');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Dostępne jednostki', String(unitCount));
  gridDetailRow(g, 'Skarb imperium', skarb != null ? String(skarb) : '—');
  const rq = getProd(city.id).rekrutacja?.length ?? 0;
  gridDetailRow(g, 'W kolejce', String(rq));
  return card;
}

function renderPurchasableUnits(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  opts?: { visibleRows?: number; w4?: boolean },
): void {
  mount.innerHTML = '';
  const w4 = opts?.w4 === true;
  if (w4) {
    appendSectionTitleWithDetails(
      mount,
      '<span>Rekrutacja</span>',
      () => {
        if (!data) {
          const c = el('div', 'detail-card');
          c.appendChild(el('div', 'dc-note', 'Brak danych gry'));
          return c;
        }
        const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
        const units = purchasableUnits(city, data, techs, productionCtxForCity(city));
        return buildRecruitTabDetailCard(city, units.length, cfg.getTreasury?.(city.ownerId));
      },
    );
  } else {
    mount.appendChild(el('div', 'ptitle', '<span>Rekrutuj jednostkę (za Pieniądz)</span>'));
  }
  if (!data) { mount.appendChild(el('div', 'muted', 'Brak danych gry')); return; }
  if (city.ownerId !== 0) {
    mount.appendChild(el('div', 'muted', 'Miasto rywala — zakup niedostępny (podgląd).'));
    return;
  }
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  const units = purchasableUnits(city, data, techs, productionCtxForCity(city));
  const skarb = cfg.getTreasury?.(city.ownerId);
  const rqLen = getProd(city.id).rekrutacja?.length ?? 0;

  if (w4) {
    appendTabIndicators(mount, [
      {
        icon: cityPanelChipIcon('res-treasury', 14),
        label: 'Skarb',
        value: skarb != null ? String(skarb) : '—',
        cls: 'gold',
      },
      {
        icon: cityPanelChipIcon('cp-recruit', 14),
        label: 'Dostępne',
        value: String(units.length),
        cls: units.length > 0 ? 'green' : 'muted',
      },
      {
        icon: cityPanelChipIcon('tb-army', 14),
        label: 'Kolejka',
        value: String(rqLen),
        cls: rqLen > 0 ? 'blue' : 'muted',
      },
    ]);
  }

  if (units.length === 0) {
    mount.appendChild(el('div', 'muted', '(brak jednostek do kupienia — zbadaj technologie / Koszary)'));
    return;
  }

  const visible = opts?.visibleRows ?? LIST_SCROLL_VISIBLE_CATALOG;
  const scroll = el('div', 'unit-recruit-scroll');
  scroll.style.setProperty('--unit-recruit-visible', String(visible));
  const grid = el('div', 'unit-recruit-grid');
  scroll.appendChild(grid);
  for (const it of units) {
    appendUnitRecruitCard(grid, city, it, data, skarb);
  }
  mount.appendChild(scroll);
}

function buildUpgradeBonusDetailCard(
  def: BuildingDef,
  data: GameData,
): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', `<span>Skład bonusów — ${def.nazwa}</span>`));
  const chain = upgradeChainSteps(def.id, data.buildings);
  if (chain.length > 1) {
    appendDetailSection(card, 'Łańcuch upgrade');
    const g0 = appendDetailGrid(card);
    gridDetailRow(g0, 'Poziomy', chain.map(c => c.nazwa).join(' → '));
    for (const line of upgradeCompositionLines(def.id, data.buildings)) {
      const note = el('div', 'dc-note');
      note.style.fontStyle = 'normal';
      note.textContent = line;
      card.appendChild(note);
    }
  }
  appendDetailSection(card, 'Statystyki (silnik)');
  const stats = buildingStatSummaryLines(def);
  if (stats.length === 0) {
    const note = el('div', 'dc-note');
    note.textContent = 'Brak statów bazowych w definicji.';
    card.appendChild(note);
  } else {
    const g1 = appendDetailGrid(card);
    for (const s of stats) gridDetailRow(g1, s.split(' ')[0] ?? s, s.slice(s.indexOf(' ') + 1));
  }
  return card;
}

function renderBuildingsOwned(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  opts?: { visibleRows?: number; scrollFill?: boolean },
): void {
  mount.innerHTML = '';
  const built = cfg.getBuiltBuildingIds?.(city.id);
  mount.appendChild(el('div', 'ptitle',
    `<span>Budynki w mieście${built ? ' (' + built.length + ')' : ''}</span>${built ? '' : PH()}`));
  if (built && data) {
    if (built.length === 0) { mount.appendChild(el('div', 'muted', '(brak — zbuduj pierwszy)')); return; }
    const scroll = opts?.scrollFill
      ? createScrollList('list-scroll', { fill: true })
      : opts?.visibleRows != null
        ? createScrollList('list-scroll', { visible: opts.visibleRows })
        : null;
    const target = scroll ?? mount;
    for (const id of built) {
      const def = data.buildings.find(b => b.id === id);
      const row = el('div', 'bld');
      appendBuildingInlineIcon(row, def);
      const bn = el('span', 'bn');
      bn.textContent = def ? def.nazwa : id;
      if (def && (def.upgradeFrom ?? '').trim().length > 0) {
        const chain = upgradeChainSteps(def.id, data.buildings);
        bn.title = chain.map(c => c.nazwa).join(' → ');
      }
      row.appendChild(bn);
      if (def && (def.upgradeFrom ?? '').trim().length > 0) {
        const upBtn = el('button', 'bld-upg');
        upBtn.type = 'button';
        upBtn.textContent = '↗';
        upBtn.title = 'Skład bonusów upgrade';
        upBtn.setAttribute('aria-label', `Skład bonusów ${def.nazwa}`);
        attachInteractiveDetail(upBtn, () => buildUpgradeBonusDetailCard(def, data), { delayMs: 260, sideHint: 'left' });
        row.appendChild(upBtn);
      }
      target.appendChild(row);
    }
    if (scroll) mount.appendChild(scroll);
  } else {
    ['Spichlerz', 'Cegielnia', 'Targowisko', 'Świątynia'].forEach(n =>
      mount.appendChild(el('div', 'bld', `${cityPanelChipIconWrap('cp-buildings', 14)}<span class="bn">${n}</span>`)));
  }
}

function renderSplitPane(
  mount: HTMLElement,
  topRender: (row: HTMLElement) => void,
  bottomRender: (row: HTMLElement) => void,
): void {
  mount.innerHTML = '';
  const split = el('div', 'civ-v-split-pane');
  const rowTop = el('div', 'civ-v-split-col');
  const rowBot = el('div', 'civ-v-split-col');
  topRender(rowTop);
  bottomRender(rowBot);
  split.appendChild(rowTop);
  split.appendChild(rowBot);
  mount.appendChild(split);
}

function renderBuildSplitPanel(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  view: CityView | null,
): void {
  renderSplitPane(
    mount,
    row => renderBuildList(
      appendPanel(row, 'cs-build'),
      city,
      data,
      view,
      { visibleRows: LIST_SCROLL_VISIBLE_CATALOG },
    ),
    row => renderBuildingsOwned(appendPanel(row, 'cs-owned'), city, data, { scrollFill: true }),
  );
}

function renderTopBarGarrison(mount: HTMLElement, city: City): void {
  mount.innerHTML = '';
  const units = cfg.getUnitsAt?.(city.q, city.r);
  const count = units?.length ?? 0;
  const showDetail = () => buildGarnizonDetailCard(units ?? null, count);

  const label = el('span', 'civ-v-garrison-label');
  label.title = count === 0
    ? 'Garnizon pusty — brak wojska w mieście'
    : `Garnizon — ${count} jedn. w mieście`;
  const icon = el('span', 'civ-v-garrison-icon');
  icon.innerHTML = cityPanelChipIconWrap('chip-garrison', 18);
  label.appendChild(icon);
  const name = el('span');
  name.textContent = 'Garnizon';
  label.appendChild(name);
  if (units !== undefined) {
    const cnt = el('span', 'civ-v-garrison-count');
    cnt.textContent = String(count);
    label.appendChild(cnt);
  } else {
    const cnt = el('span', 'civ-v-garrison-count');
    cnt.textContent = '—';
    label.appendChild(cnt);
  }
  mount.appendChild(label);
  attachHoverDetail(mount, showDetail, 220, 'left');

  if (units === undefined || count === 0) return;

  for (const u of units) {
    const hp = u.health ?? 100;
    const max = u.maxHealth ?? 100;
    const pct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, max)) * 100)));
    const low = pct < 40;
    const chip = el('div', 'civ-v-garrison-chip');
    chip.innerHTML =
      `<span class="gi">${cityPanelChipIconWrap('tb-army', 14)}</span><span class="gn">${u.nazwa}</span>` +
      `<span class="hpb"><span class="hpf ${low ? 'hpl' : ''}" style="width:${pct}%"></span></span>`;
    chip.title = `${u.nazwa} · ${hp}/${max} HP`;
    mount.appendChild(chip);
  }
}

function buildGarnizonDetailCard(units: GarrisonUnit[] | null, count: number): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Garnizon — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Jednostki w mieście — wzmacniają prawo (porządek) i bronią przed atakiem.';
  card.appendChild(intro);
  appendDetailSection(card, 'Stan');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Jednostki', units === null ? '— (brak hooka silnika)' : count === 0 ? 'Brak garnizonu' : String(count));
  if (units && units.length > 0) {
    appendDetailSection(card, 'Lista');
    const gl = appendDetailGrid(card);
    for (const u of units) {
      const hp = u.health ?? 100;
      const max = u.maxHealth ?? 100;
      gridDetailRow(gl, u.nazwa, `${hp}/${max} HP`);
    }
  }
  appendDetailSection(card, 'Wpływ na Prawo');
  const gp = appendDetailGrid(card);
  gridDetailRow(gp, '1 jednostka', '+20 pkt Prawa (szac.)');
  gridDetailRow(gp, '5+ jednostek', 'PrawPct do 100% (cap)');
  gridDetailRow(gp, 'Duże miasto bez wojska', 'Kara Prawa (≥6 mieszk.)');
  appendDetailAlgo(card, 'Mechanika', [
    'Garnizon podnosi Prawo — tłumi bunt i niepokoje; nie podnosi znacząco Szczęścia.',
    'Podczas oblężenia jednostki zużywają żywność z puli imperium / miasta.',
    'Słaby garnizon = łatwiejsze zdobycie miasta przez wroga.',
    'Utrzymanie wojska kosztuje — stacjonuj tam, gdzie naprawdę potrzebujesz porządku lub obrony.',
  ]);
  return card;
}

// ---------------------------------------------------------------------------
// Okolica hex grid (real, drawn from the map around the city)
// ---------------------------------------------------------------------------

const TEREN_COL: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '#0d2236', [TerenBazowy.Wybrzeze]: '#14506a',
  [TerenBazowy.Laka]: '#243a24', [TerenBazowy.Rownina]: '#3f3815',
  [TerenBazowy.Pustynia]: '#4a3a18', [TerenBazowy.Wzgorza]: '#3a2f18', [TerenBazowy.Gory]: '#2e2e2e',
};
const TEREN_LETTER: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '~', [TerenBazowy.Wybrzeze]: '~',
  [TerenBazowy.Laka]: 'Ł', [TerenBazowy.Rownina]: 'R',
  [TerenBazowy.Pustynia]: 'P', [TerenBazowy.Wzgorza]: 'W', [TerenBazowy.Gory]: 'G',
};
function hexDist(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q2 - q1, dr = r2 - r1;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

/** Kompaktowy podgląd (ui-params) rozszerzany o heksy z faktycznym 👤 / auto-przydziałem. */
function okolicaPreviewRadius(
  city: City,
  Rwork: number | undefined,
  worked: { q: number; r: number }[] | undefined,
  reczne: Record<string, number> | undefined,
  tryb: OkolicaTryb,
): number {
  const fallback = Math.max(UI_PARAMS.panel_miasta.okolica_promien, 3);
  const cap = Rwork ?? fallback;
  let displayR = Math.min(fallback, cap);
  const bump = (q: number, r: number) => {
    const d = hexDist(city.q, city.r, q, r);
    if (d <= cap && d > displayR) displayR = d;
  };
  if (tryb === 'reczny') {
    for (const [key, count] of Object.entries(reczne ?? {})) {
      if (!count || count <= 0) continue;
      const parts = key.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      if (Number.isFinite(q) && Number.isFinite(r)) bump(q, r);
    }
  } else {
    for (const t of worked ?? []) bump(t.q, t.r);
  }
  return displayR;
}

function rangeName(R: number): string {
  if (R <= 5) return 'małe miasto';
  if (R <= 10) return 'średnie miasto';
  return 'duże miasto';
}
/** Liczba heksów dodanych przez `rings` pierścieni kultury poza promieniem R. */
function ringsTiles(R: number, rings: number): number {
  let n = 0;
  for (let k = 1; k <= rings; k++) n += 6 * (R + k);
  return n;
}
function okStat(key: string, val: string, sub: string): string {
  return `<div class="okstat"><span class="ks">${key}</span><b>${val}</b> <span class="muted">${sub}</span></div>`;
}

function buildOkolicaDetailCard(
  city: City,
  opts: {
    Rwork?: number;
    workedCount?: number;
    tilesInRange?: number;
    borderR: number;
    focus: OkolicaFocus;
    tryb: OkolicaTryb;
    clickHint: string;
  },
): HTMLDivElement {
  const { Rwork, workedCount, tilesInRange, borderR, focus, tryb, clickHint } = opts;
  const card = el('div', 'detail-card okolica-detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Okolica — ściąga</span>';
  card.appendChild(head);

  const wN = workedCount !== undefined ? workedCount : '—';
  const rTxt = Rwork !== undefined ? `r${Rwork}` : 'r?';
  const cultTxt = borderR > 0
    ? `${cityPanelChipIconWrap('res-culture', 14)} +${borderR}`
    : `${cityPanelChipIconWrap('res-culture', 14)} 0`;
  const summary = el('div', 'dc-summary muted');
  summary.style.cssText = 'font-size:0.88em;margin-bottom:0.35em;';
  summary.innerHTML = cpInlineIcons(
    `${cityPanelChipIconWrap('chip-manpower', 14)} ${wN}/${city.population} · ${rTxt} · ${cultTxt}`,
  );
  card.appendChild(summary);

  appendDetailSection(card, 'Zasięg i pola');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Zasięg roboczy', Rwork !== undefined ? `r${Rwork} (${rangeName(Rwork)})` : '—');
  gridDetailRow(g1, 'Pól w zasięgu', tilesInRange !== undefined ? `${tilesInRange} heksów` : '—');
  gridDetailRow(g1, 'Pól obrabianych', workedCount !== undefined
    ? `${workedCount} 👤 (max ${city.population} obok miasta)`
    : '—');
  gridDetailRow(g1, 'Centrum miasta', 'Plony z terenu bez 👤 (jak Civ V)');

  appendDetailSection(card, 'Kultura i terytorium');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, 'Granica kultury', borderR > 0 ? `+${borderR} pierścień(e) poza zasięgiem` : 'Brak dodatkowego pierścienia');
  if (Rwork !== undefined) {
    const total = 1 + 3 * Rwork * (Rwork + 1) + (borderR > 0 ? ringsTiles(Rwork, borderR) : 0);
    gridDetailRow(g2, 'Pełny zasięg', `~${total} pól (roboczy + kultura)`);
  }
  gridDetailRow(g2, 'Mapa świata', 'Granice i pełny zasięg widoczne na mapie');

  appendDetailSection(card, 'Profile i tryb');
  const g3 = appendDetailGrid(card);
  const focusLbl: Record<OkolicaFocus, string> = {
    zywnosc: `${cityPanelChipIconWrap('chip-grain', 14)} Żywność`,
    produkcja: `${cityPanelChipIconWrap('res-work', 14)} Produkcja`,
    podatki: `${cityPanelChipIconWrap('res-treasury', 14)} Podatki`,
    zrownowazone: `${cityPanelChipIconWrap('cp-order', 14)} Zrównoważone`,
  };
  gridDetailRow(g3, 'Profil auto', focusLbl[focus] ?? focus);
  gridDetailRow(g3, 'Tryb', tryb === 'reczny' ? 'Ręczny 👤 na mapie' : 'Automatyczny');

  appendDetailFormula(card, 'score = w🌾×żywność + w🔨×praca + w💰×handel');
  appendDetailFormula(card, 'Zasięg: r = min(max(5, populacja), 15)');

  appendDetailAlgo(card, 'Auto-przydział pól (assignWorkedTiles)', [
    'Zbierz wszystkie heksy w promieniu r od centrum (bez centrum miasta).',
    'Dla każdego pola oblicz plony (teren + rzeka + las + ulepszenie).',
    `Profil „${focusLbl[focus] ?? focus}”: wagi score — np. Żywność 3/0.5/0.5, Zrówn. 1/1/1.`,
    'Posortuj malejąco po score; remis → bliżej centrum → klucz „q,r”.',
    `Weź top N pól, gdzie N = populacja (${city.population} 👤).`,
    'Centrum miasta daje plony bez pracownika (jak Civ V).',
  ]);

  appendDetailAlgo(card, 'Tryb ręczny', [
    'Klik +👤 / PPM −👤 przypisuje pracownika na heksie.',
    'Max 👤 = populacja; nadmiarowe kliknięcia ignorowane.',
    '„↩ Przywróć auto” kopiuje bieżący auto-przydział i wraca do profilu.',
  ]);

  appendDetailSection(card, 'Sterowanie');
  const g4 = appendDetailGrid(card);
  gridDetailRow(g4, 'Mapa', 'Klik heks = +👤 · PPM = −👤');
  gridDetailRow(g4, 'Zoom', 'Kółko myszy na mapie okolicy');
  gridDetailRow(g4, 'Pełna pula', 'Brak efektu gdy brak wolnego pola');
  gridDetailRow(g4, 'Auto', 'Przycisk „↩ Przywróć auto” po ręcznych zmianach');
  gridDetailRow(
    g4,
    'Stan',
    `${tryb === 'reczny' ? 'Ręczny' : 'Auto'} · ${focusLbl[focus] ?? focus} · ${wN}/${city.population} 👤`,
  );

  const note = el('div', 'dc-note');
  setNoteHtml(note, clickHint.trim()
    || `Profile ustawiają priorytet pól (${cityPanelChipIconWrap('chip-grain', 14)} ${cityPanelChipIconWrap('res-work', 14)} ${cityPanelChipIconWrap('res-treasury', 14)}). Pełne statystyki i algorytm powyżej.`);
  card.appendChild(note);
  return card;
}

function okolicaHexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (60 * i - 30) * Math.PI / 180;
    pts.push((cx + size * Math.cos(ang)).toFixed(1) + ',' + (cy + size * Math.sin(ang)).toFixed(1));
  }
  return pts.join(' ');
}

function okolicaTileHasWorkerAt(
  city: City,
  q: number,
  r: number,
  tryb: OkolicaTryb,
  reczne?: Record<string, number>,
  workedSet?: Set<string> | null,
  distFromCity?: number,
): boolean {
  const key = `${q},${r}`;
  if (tryb === 'reczny') return (reczne?.[key] ?? 0) > 0;
  return workedSet ? workedSet.has(key) : (distFromCity ?? 1) <= 1;
}

function fireOkolicaTileToggle(city: City, q: number, r: number): void {
  if (!cfg.onOkolicaTileAdjust) return;
  cfg.onOkolicaTileAdjust(city.id, q, r, 0);
}

function formatTileYieldShort(y: { zywnosc: number; praca: number; handel: number }): string {
  const parts: string[] = [];
  if (y.zywnosc !== 0) parts.push(`${y.zywnosc > 0 ? '+' : ''}${y.zywnosc} ${cityPanelChipIconWrap('chip-grain', 12)}`);
  if (y.praca !== 0) parts.push(`${y.praca > 0 ? '+' : ''}${y.praca} ${cityPanelChipIconWrap('res-work', 12)}`);
  if (y.handel !== 0) parts.push(`${y.handel > 0 ? '+' : ''}${y.handel} ${cityPanelChipIconWrap('res-treasury', 12)}`);
  return parts.length ? parts.join(' ') : '0';
}

function tileYieldLabel(hex: Hex): string {
  const y = tileYield({
    terenBazowy: hex.terenBazowy,
    nakladka: hex.nakladka ?? Nakladka.Brak,
    maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
    ulepszenieKey: normalizeImprovementKey(String(hex.ulepszenie ?? 'brak')),
  });
  return formatTileYieldShort(y);
}

function appendOkolicaYieldLabel(
  svg: SVGSVGElement,
  c: { cx: number; cy: number; hex: Hex | null; isCity: boolean },
  SIZE: number,
  fontScale: number,
): void {
  if (!c.hex) return;
  const y = tileYield({
    terenBazowy: c.hex.terenBazowy,
    nakladka: c.hex.nakladka ?? Nakladka.Brak,
    maRzeke: !!(c.hex.rzeka && c.hex.rzeka.obecna),
    ulepszenieKey: normalizeImprovementKey(String(c.hex.ulepszenie ?? 'brak')),
  });
  const ytxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  ytxt.setAttribute('x', String(c.cx));
  ytxt.setAttribute('y', String(c.cy - SIZE * fontScale));
  ytxt.setAttribute('text-anchor', 'middle');
  ytxt.setAttribute('font-size', String(Math.round(SIZE * (fontScale === 0.35 ? 0.38 : 0.48))));
  ytxt.setAttribute('fill', c.isCity ? '#e0b24a' : '#c8d0dc');
  ytxt.setAttribute('pointer-events', 'none');
  const short: string[] = [];
  if (y.zywnosc !== 0) short.push(String(y.zywnosc));
  if (y.praca !== 0) short.push(String(y.praca));
  if (y.handel !== 0) short.push(String(y.handel));
  ytxt.textContent = short.join('/') || '·';
  svg.appendChild(ytxt);
}

/**
 * Kompaktowy podgląd pól obrabianych wokół miasta (ograniczone okno DISPLAY_R).
 * Pełna okolica (do r15) i granice kultury renderuje MAPA na świecie — tu tylko zerknięcie.
 * worked = realny zbiór z getWorkedTiles; brak haka -> fallback (pierścień d<=1).
 */
function renderWorkedPreview(
  gridEl: HTMLElement, city: City, map: GameMap,
  worked: { q: number; r: number }[] | undefined,
  reczne?: Record<string, number>,
  tryb: OkolicaTryb = 'auto',
): void {
  gridEl.innerHTML = '';
  const Rwork = cfg.getCityWorkedRange?.(city.id);
  const DISPLAY_R = okolicaPreviewRadius(city, Rwork, worked, reczne, tryb);
  const SIZE = UI_PARAMS.panel_miasta.okolica_hex_px, HEX_W = Math.sqrt(3) * SIZE, ROW = 1.5 * SIZE;
  const workedSet = worked ? new Set(worked.map(t => `${t.q},${t.r}`)) : null;
  type Cell = {
    q: number; r: number; cx: number; cy: number; d: number;
    isCity: boolean; hex: Hex | null;
    fill: string; isWorked: boolean; isLas: boolean; teren: TerenBazowy;
  };
  const cells: Cell[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let dq = -DISPLAY_R; dq <= DISPLAY_R; dq++) {
    for (let dr = -DISPLAY_R; dr <= DISPLAY_R; dr++) {
      const q = city.q + dq, r = city.r + dr;
      const d = hexDist(city.q, city.r, q, r);
      if (d > DISPLAY_R) continue;
      const cx = HEX_W * (q + r / 2), cy = ROW * r;
      cells.push({
        q, r, cx, cy, d,
        isCity: d === 0,
        hex: null,
        fill: '',
        isWorked: false,
        isLas: false,
        teren: TerenBazowy.Morze,
      });
      minX = Math.min(minX, cx - HEX_W / 2); maxX = Math.max(maxX, cx + HEX_W / 2);
      minY = Math.min(minY, cy - SIZE); maxY = Math.max(maxY, cy + SIZE);
    }
  }
  for (const c of cells) {
    const hex = map.hexes[`${c.q},${c.r}`] ?? null;
    const teren = hex ? hex.terenBazowy : TerenBazowy.Morze;
    const isLas = !!(hex && hex.nakladka === Nakladka.Las);
    c.hex = hex;
    c.teren = teren;
    c.isLas = isLas;
    c.isCity = c.d === 0;
    c.fill = hex ? (isLas ? '#142714' : (TEREN_COL[teren] ?? '#2a2a2a')) : '#10141a';
    const tileKey = `${c.q},${c.r}`;
    const inReczne = (reczne?.[tileKey] ?? 0) > 0;
    const inAutoWorked = workedSet ? workedSet.has(tileKey) : c.d <= 1;
    c.isWorked = !c.isCity && (tryb === 'reczny' ? inReczne : inAutoWorked);
  }
  const ns = 'http://www.w3.org/2000/svg';
  const vbX = minX - 2, vbY = minY - 2;
  const w = Math.ceil(maxX - minX) + 4, h = Math.ceil(maxY - minY) + 4;
  const wrap = document.createElement('div');
  wrap.className = 'okolica-grid-wrap';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.setAttribute('viewBox', `${vbX} ${vbY} ${w} ${h}`);
  const canAdjust = !!cfg.onOkolicaTileAdjust;

  for (const c of cells) {
    const pts = okolicaHexPoints(c.cx, c.cy, SIZE);
    const poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill', c.fill);
    poly.setAttribute('stroke', c.isCity ? '#66aaff' : 'rgba(224,178,74,0.22)');
    poly.setAttribute('stroke-width', c.isCity ? '3.5' : '1');
    poly.setAttribute('pointer-events', 'none');
    if (c.hex && (c.isCity || c.isWorked || (!c.isCity && canAdjust))) {
      const tip = document.createElementNS(ns, 'title');
      const hasW = okolicaTileHasWorkerAt(city, c.q, c.r, tryb, reczne, workedSet, c.d);
      tip.textContent = c.isCity
        ? `Centrum — plony z terenu (bez 👤) · ${tileYieldLabel(c.hex)}`
        : hasW
          ? `Plon: ${tileYieldLabel(c.hex)} · Klik: zabierz 👤`
          : `Plon: ${tileYieldLabel(c.hex)} · Klik: przypisz 👤`;
      poly.appendChild(tip);
    }
    svg.appendChild(poly);

    if (c.isCity) {
      const cityBand = document.createElementNS(ns, 'polygon');
      cityBand.setAttribute('points', pts);
      cityBand.setAttribute('fill', 'rgba(48,128,224,0.28)');
      cityBand.setAttribute('stroke', 'rgba(102,170,255,0.95)');
      cityBand.setAttribute('stroke-width', '5.5');
      cityBand.setAttribute('pointer-events', 'none');
      if (poly.querySelector('title')) cityBand.appendChild(poly.querySelector('title')!.cloneNode(true));
      svg.appendChild(cityBand);
    }

    if (c.isWorked) {
      const band = document.createElementNS(ns, 'polygon');
      band.setAttribute('points', pts);
      band.setAttribute('fill', 'rgba(40,255,120,0.44)');
      band.setAttribute('stroke', 'rgba(100,255,170,0.88)');
      band.setAttribute('stroke-width', '5.5');
      band.setAttribute('pointer-events', 'none');
      if (poly.querySelector('title')) band.appendChild(poly.querySelector('title')!.cloneNode(true));
      svg.appendChild(band);
    }

    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', String(c.cx)); txt.setAttribute('y', String(c.cy));
    txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('dominant-baseline', 'central');
    txt.setAttribute('font-size', String(Math.round(SIZE * 0.8)));
    txt.setAttribute('pointer-events', 'none');
    txt.textContent = c.isCity ? 'M' : (c.hex ? (c.isLas ? 'L' : (TEREN_LETTER[c.teren] ?? '')) : '');
    svg.appendChild(txt);

    if (c.hex) {
      appendOkolicaYieldLabel(svg, c, SIZE, c.isCity ? 0.35 : 0.35);
    }

    const workers = c.isWorked ? (reczne?.[`${c.q},${c.r}`] ?? 1) : undefined;
    if (!c.isCity && workers !== undefined && workers > 0) {
      const fo = document.createElementNS(ns, 'foreignObject');
      fo.setAttribute('x', String(c.cx - SIZE * 0.35));
      fo.setAttribute('y', String(c.cy + SIZE * 0.15));
      fo.setAttribute('width', String(SIZE * 0.9));
      fo.setAttribute('height', String(SIZE * 0.55));
      fo.setAttribute('pointer-events', 'none');
      fo.innerHTML =
        `<div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;gap:0.06em;font-size:${Math.round(SIZE * 0.42)}px;color:#e0b24a;line-height:1">` +
        `${cityPanelChipIconWrap('chip-manpower', 12)}<span>${workers}</span></div>`;
      svg.appendChild(fo);
    }
  }

  wrap.appendChild(svg);

  if (canAdjust) {
    for (const c of cells) {
      if (c.isCity || !c.hex) continue;
      const pctX = ((c.cx - vbX) / w) * 100;
      const pctY = ((c.cy - vbY) / h) * 100;
      const pctD = (SIZE * 2 / Math.min(w, h)) * 100;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ok-hex-hit';
      btn.style.left = `${pctX - pctD / 2}%`;
      btn.style.top = `${pctY - pctD / 2}%`;
      btn.style.width = `${pctD}%`;
      btn.style.height = `${pctD}%`;
      const hasW = okolicaTileHasWorkerAt(city, c.q, c.r, tryb, reczne, workedSet, c.d);
      btn.title = hasW
        ? `Zabierz pracownika · plon: ${tileYieldLabel(c.hex)}`
        : `Przypisz pracownika · plon: ${tileYieldLabel(c.hex)}`;
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        fireOkolicaTileToggle(city, c.q, c.r);
      });
      wrap.appendChild(btn);
    }
  }

  gridEl.appendChild(wrap);
}

/**
 * Sekcja „Okolica" — kompaktowa (wariant B):
 *  - statystyki: zasięg roboczy (r5/10/15), pól w zasięgu, pól obrabianych (N=ludność), granica kultury,
 *  - mały podgląd pól obrabianych (ograniczone okno),
 *  - hint: pełne terytorium + granice kultury renderuje MAPA na mapie świata.
 * Dane wg haków EKONOMII (getCityWorkedRange / getWorkedTiles); brak haka -> łagodny fallback.
 */
function renderOkolica(root: HTMLElement, city: City, map: GameMap): void {
  const statsEl = root.querySelector('#cs-okstats') as HTMLElement | null;
  const gridEl = root.querySelector('#cs-okolica') as HTMLElement | null;
  const hintEl = root.querySelector('#cs-okhint') as HTMLElement | null;
  const uxMap = isCityUxFrameOpen();
  const toolbarEl = uxMap
    ? document.getElementById('cs-oktoolbar-ux')
    : (document.getElementById('cs-oktoolbar')
      ?? root.querySelector('#cs-oktoolbar') as HTMLElement | null);
  const modeEl = root.querySelector('#cs-okmode') as HTMLElement | null;
  const headEl = uxMap
    ? document.getElementById('cs-okhead-ux')
    : (document.getElementById('cs-okhead')
      ?? root.querySelector('#cs-okhead') as HTMLElement | null);
  const profEl = root.querySelector('#cs-okprof') as HTMLElement | null;
  const compactEl = root.querySelector('#cs-okcompact') as HTMLElement | null;

  const okState = cfg.getOkolicaState?.(city.id);
  const focus = okState?.focus ?? city.okolicaFocus ?? 'zrownowazone';
  const tryb  = okState?.tryb ?? city.okolicaTryb ?? 'auto';

  const Rwork = cfg.getCityWorkedRange?.(city.id);
  const worked = cfg.getWorkedTiles?.(city.id);
  const borderR = cfg.getCultureState?.(city.id)?.borderRadius ?? 0;
  const tilesInRange = Rwork !== undefined ? 1 + 3 * Rwork * (Rwork + 1) : undefined;
  const clickHint = cfg.onOkolicaTileAdjust
    ? 'Klik heks = przypisz/zabierz pracownika. Centrum daje plony bez pracownika. Scroll = zoom.'
    : '';

  const buildDetail = () => buildOkolicaDetailCard(city, {
    Rwork,
    workedCount: worked?.length,
    tilesInRange,
    borderR,
    focus,
    tryb,
    clickHint: Rwork !== undefined
      ? `Pełny zasięg (~${1 + 3 * Rwork * (Rwork + 1) + (borderR > 0 ? ringsTiles(Rwork, borderR) : 0)} pól) na mapie świata.${clickHint ? ' ' + clickHint : ''}`
      : clickHint,
  });

  if (headEl) {
    headEl.innerHTML = '';
    headEl.className = 'ptitle';
    headEl.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;gap:0.35em;';
    const left = el('span', '');
    left.textContent = 'Zarządzanie polami';
    headEl.appendChild(left);
    const infoLink = el('span', 'okolica-info-link gold');
    infoLink.textContent = 'ℹ szczegóły';
    headEl.appendChild(infoLink);
    attachHoverDetail(headEl, buildDetail, 220);
  }

  const host = toolbarEl ?? compactEl;
  const useCompactStats = host !== null;

  if (host) {
    host.innerHTML = '';
    host.className = toolbarEl ? 'okolica-toolbar' : 'okolica-compact-row';
    if (profEl) {
      profEl.innerHTML = '';
      profEl.style.display = 'none';
    }

    const profilesWrap = el('div', 'okolica-toolbar-profiles');
    appendOkolicaToolbarProfiles(profilesWrap, city, focus, tryb);
    host.appendChild(profilesWrap);
  } else if (profEl) {
    profEl.style.display = '';
    profEl.innerHTML = '';
    const profilesWrap = el('div', 'okolica-toolbar-profiles');
    appendOkolicaToolbarProfiles(profilesWrap, city, focus, tryb);
    profEl.appendChild(profilesWrap);
    if (tryb === 'reczny') {
      const tag = el('span', 'muted');
      tag.style.cssText = 'font-size:0.72em;margin-left:0.35em;';
      tag.textContent = 'Tryb ręczny';
      profEl.appendChild(tag);
    }
  }

  if (modeEl) {
    if (uxMap) {
      modeEl.textContent = '';
      modeEl.style.display = 'none';
    } else {
      modeEl.style.display = '';
      modeEl.className = 'okolica-mode-hint';
      modeEl.innerHTML = cpInlineIcons(
        `${tryb === 'reczny' ? 'Ręczny' : 'Auto'} · ${worked?.length ?? 0}/${city.population} ${cityPanelChipIconWrap('chip-manpower', 14)}`,
      );
    }
  }

  if (useCompactStats) {
    if (statsEl) {
      statsEl.innerHTML = '';
      statsEl.classList.add('is-collapsed');
    }
    if (hintEl) {
      hintEl.textContent = '';
      hintEl.classList.add('is-collapsed');
    }
  } else if (statsEl) {
    statsEl.classList.remove('is-collapsed');
    statsEl.innerHTML = [
      okStat('Zasięg roboczy', Rwork !== undefined ? `r${Rwork}` : '—', Rwork !== undefined ? rangeName(Rwork) : 'gdy silnik dostarczy'),
      okStat('Pól w zasięgu', tilesInRange !== undefined ? String(tilesInRange) : '—', 'heksów'),
      okStat('Pól obrabianych', worked ? String(worked.length) : '—', cpInlineIcons(`${cityPanelChipIconWrap('chip-manpower', 12)} max ${city.population} obok + ${cityPanelChipIconWrap('cp-buildings', 12)} centrum`)),
      okStat('Granica kultury', borderR > 0 ? `+${borderR}` : '0', borderR > 0 ? 'pierścień(e)' : 'brak'),
    ].join('');
    if (hintEl) {
      hintEl.classList.remove('is-collapsed');
      const fullClick = cfg.onOkolicaTileAdjust
        ? cpInlineIcons(` ${cityPanelChipIconWrap('cp-buildings', 12)} = plony z terenu (bez ${cityPanelChipIconWrap('chip-manpower', 12)}). Max ${cityPanelChipIconWrap('chip-manpower', 12)} obok = ludność. Klik: przypisz/zabierz. Pełna pula + wolne pole = brak efektu. „↩ Przywróć auto”.`)
        : '';
      if (Rwork !== undefined) {
        const total = 1 + 3 * Rwork * (Rwork + 1) + (borderR > 0 ? ringsTiles(Rwork, borderR) : 0);
        hintEl.textContent = `Pełny zasięg (~${total} pól) i granice kultury widoczne na mapie świata.${fullClick}`;
      } else {
        hintEl.textContent = `Pełna okolica widoczna na mapie świata (render po stronie MAPY).${fullClick}`;
      }
    }
  }
  if (gridEl) renderWorkedPreview(gridEl, city, map, worked, okState?.reczne, tryb);
}

// ---------------------------------------------------------------------------
// Compose + render
// ---------------------------------------------------------------------------

let rootEl: HTMLDivElement | null = null;
let activeCity: City | null = null;
let activeMap: GameMap | null = null;
let activeOnClose: () => void = () => {};

/** Cities of the active city's owner (for prev/next navigation). */
function ownerCities(city: City): City[] {
  const all = cfg.getCities?.();
  if (!all) return [city];
  const list = all.filter(c => c.ownerId === city.ownerId);
  return list.length > 0 ? list : [city];
}

/** Tytuł miasta w panelu — dopisek miasto-państwo dla obcych klastrowych (Maciej 2026-07-07). */
function cityPanelTitle(city: City): string {
  return formatCityMapLabel(city);
}

function switchCity(dir: -1 | 1): void {
  if (activeCity === null) return;
  const list = ownerCities(activeCity);
  if (list.length < 2) return;
  const idx = list.findIndex(c => c.id === activeCity!.id);
  const next = list[(idx + dir + list.length) % list.length];
  if (next) {
    activeCity = next;
    cfg.onSwitchCity?.(next.id);
    rerender();
  }
}

function headerOrderBadge(city: City): string {
  const st = cfg.getOrderState?.(city.id);
  if (!st || st.szPct == null) {
    return `<div class="mbadge muted" style="font-size:0.78em;">Porządek — szczegóły poniżej</div>`;
  }
  const por = st.porPct ?? 0;
  const cls = por >= 60 ? 'green' : por >= 30 ? 'gold' : 'red';
  const warn = st.revoltWarning ? ' \u26a0\ufe0f' : '';
  return `<div class="mbadge"><span class="muted">Porządek:</span> <b class="${cls}">${por.toFixed(0)}%</b>${warn}</div>`;
}

function drawerTabButtons(): string {
  return CITY_TABS.map(t => {
    const on = activeDrawerTab === t.id;
    return `<button type="button" class="civ-cs-tab${on ? ' on' : ''}" data-tab="${t.id}" role="tab" aria-selected="${on}">`
      + `<span class="civ-cs-tab-inner">${cityTabIconHtml(t.id)}<span class="civ-cs-tab-lbl">${t.short}</span></span></button>`;
  }).join('');
}

function skeleton(city: City, view: CityView | null): string {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const owner = city.ownerId === 0 ? 'Gracz' : 'AI';
  const multi = ownerCities(city).length > 1;
  const navDis = multi ? '' : 'disabled';
  const fsbtns = SCALES.map(s =>
    `<button class="fsbtn ${s.px === scalePx ? 'active' : ''}" data-px="${s.px}">${s.label}</button>`).join('');
  const tabPanel = (id: CityDrawerTab, inner: string) =>
    `<div class="civ-cs-tab-panel" data-tab="${id}" role="tabpanel"${activeDrawerTab === id ? '' : ' hidden'}>${inner}</div>`;
  return `
  <div class="civ-cs-backdrop" aria-hidden="true"></div>
  <div class="civ-cs-drawer" role="dialog" aria-label="Panel miasta">
    <div id="hdr">
      <button class="nav-arr" id="cs-prev" ${navDis} title="Poprzednie miasto">◀</button>
      <span class="hdr-ic">${cityPanelBrandIcon('chip-star', 18)}</span>
      <span id="cname">${cityPanelTitle(city)}</span>
      <button class="nav-arr" id="cs-next" ${navDis} title="Następne miasto">▶</button>
      <div class="mbadge"><span class="hdr-ic">${cityPanelBrandIcon('res-population', 18)}</span> <b>${city.population}</b></div>
      <div class="era-b">Epoka ${epoch}</div>
      ${headerOrderBadge(city)}
      <div id="hdr-r">
        <button class="hbtn" id="cs-rename" title="Zmień nazwę miasta">✏</button>
        <button class="hbtn" id="cs-manager" title="Zarządca automatyczny"><span class="hdr-ic">${cityPanelBrandIcon('menu-settings', 18)}</span></button>
        <button class="hbtn" id="cs-artview" title="Widok artystyczny"><span class="hdr-ic">${cityPanelBrandIcon('cp-buildings', 18)}</span></button>
        <span class="muted" style="font-size:0.68em;">Aa</span> ${fsbtns}
        <button class="closeb" id="cs-close" title="Zamknij (Esc)"><span class="hdr-ic">${cityPanelBrandIcon('ui-close', 20)}</span></button>
      </div>
    </div>
    <div class="civ-cs-tabs" role="tablist">${drawerTabButtons()}</div>
    <div class="civ-cs-drawer-scroll">
      ${tabPanel('plony', `
        <div class="panel panel-tight" id="cs-magazyn"></div>
        <div class="panel panel-tight" id="cs-ekonomia"></div>
        <div class="panel panel-tight" id="cs-wealth"></div>
        <div class="panel panel-tight" id="cs-imperium"></div>
      `)}
      ${tabPanel('produkcja', `
        <div class="panel panel-tight" id="cs-praca"></div>
        <div class="panel" id="cs-prod"></div>
        <div class="panel" id="cs-build"></div>
        <div class="panel" id="cs-units"></div>
      `)}
      ${tabPanel('miasto', `
        <div class="panel panel-tight" id="cs-spoleczenstwo"></div>
        <div class="panel" id="cs-zdrowie"></div>
        <div class="panel" id="cs-owned"></div>
        <div class="panel" id="cs-kultura"></div>
        <div class="panel" id="cs-religia"></div>
        <div class="mbadge muted" style="align-self:flex-start;">Właściciel: <b class="gold">${owner}</b></div>
      `)}
      ${tabPanel('okolica', `
        <div class="okolica">
          <div id="cs-okhead" class="ptitle"></div>
          <div id="cs-oktoolbar" class="okolica-toolbar"></div>
          <div id="cs-okstats" class="okstats"></div>
          <div class="okwrap">
            <div id="cs-okolica" style="background:var(--panel2);border:1px solid var(--border);border-radius:4px;padding:6px;"></div>
            <div class="oklegend">
              <div class="gold" style="font-weight:700;">Podgląd — pola obrabiane</div>
              <div><span class="sw" style="background:#243a24;"></span>Łąka</div>
              <div><span class="sw" style="background:#3f3815;"></span>Równina</div>
              <div><span class="sw" style="background:#3a2f18;"></span>Wzgórza</div>
              <div><span class="sw" style="background:#142714;"></span>Las</div>
              <div><span class="sw" style="background:#2e2e2e;"></span>Góry</div>
              <div><span class="sw" style="background:#0d2236;"></span>Woda</div>
              <div><span class="sw" style="outline:2px solid #66aaff;"></span>Centrum miasta</div>
              <div style="margin-top:0.3em;"><span class="sw" style="outline:2px solid rgba(107,191,89,.9);"></span>Obrabiane (W = ludność N)</div>
              <div><span class="sw" style="outline:2px solid #e0b24a;"></span>Centrum — plony z terenu (bez W)</div>
            </div>
            <div id="cs-okhint" class="okhint"></div>
          </div>
        </div>
      `)}
    </div>
    <div id="ftr">
      <button class="btn" title="Wróć do mapy" id="cs-mapbtn"><span class="hdr-ic">${cityPanelBrandIcon('chip-map', 18)}</span> Mapa</button>
      <div id="ftr-r"><span class="muted">Esc — zamknij</span><span>Skarb: <span class="gold">${PH()}</span></span></div>
    </div>
  </div>`;
}

function resolveActiveCity(): City | null {
  if (activeCity === null) return null;
  const fresh = cfg.getCities?.().find(c => c.id === activeCity!.id);
  if (fresh) activeCity = fresh;
  return activeCity;
}

/** Odśwież panel jeśli otwarty (np. po zmianie okolicy w silniku). */
export function refreshCityPanelIfOpen(): void {
  if (uxSectionRefresh) {
    resolveActiveCity();
    uxSectionRefresh();
    return;
  }
  if (!isCityPanelOpen()) return;
  resolveActiveCity();
  rerender();
}

/** Prototyp UX (okolicapreview): mounty zamiast fullscreen drawera. */
export interface CityPanelUxMounts {
  top: HTMLElement;
  left: HTMLElement;
  /** Pionowy pasek ikon produkcji (budowa, rekrutacja). */
  leftIconRail?: HTMLElement;
  /** Pionowy pasek ikon parametrów miasta (spichlerz, handel…). */
  rightIconRail?: HTMLElement;
  /** Panel szczegółów na prawo od lewej kolumny (garnizon, produkcja…). */
  leftDetailDock?: HTMLElement;
  /** Panel szczegółów na lewo od prawej kolumny (okolica, ekonomia…). */
  detailDock?: HTMLElement;
  right: HTMLElement;
  /** Pływające elementy na mapie (tabliczka miasta, przyciski u dołu). */
  mapChrome?: HTMLElement;
}

let uxSectionRefresh: (() => void) | null = null;

export function clearCityPanelUxMode(): void {
  uxSectionRefresh = null;
  activeCityPanelTab = 'budowa';
  activeCity = null;
  activeMap = null;
  disposeHoverDetailDock();
}

function w3CityChip(
  icon: string,
  label: string,
  val: string,
  cls: string,
  statId: string,
  hint: string,
  splitsHtml = '',
): string {
  return `<button type="button" class="civ-v-w3-chip civ-v-res-interactive" data-res-stat="${statId}" ` +
    `title="${hint.replace(/"/g, '&quot;')}" aria-label="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-w3-chip-icon">${icon}</span>` +
    `<span class="civ-v-w3-chip-lbl">${label}</span>` +
    `<span class="civ-v-w3-chip-val ${cls}">${val}</span>` +
    splitsHtml +
    `</button>`;
}

function w3SplitSpan(amount: number, cls: string, title: string, suffix = ''): string {
  if (amount === 0) return '';
  const d = fmtResDelta(amount);
  return `<span class="civ-v-w3-split ${cls}" title="${title.replace(/"/g, '&quot;')}">${d.html}${suffix}</span>`;
}

/** Prawy górny pasek widoku miasta — tylko produkcja tego grodu (nie imperium). */
function buildCityOnlyW3StatItems(city: City, view: CityView, data: GameData | null): string {
  const pracaSplit = cityPracaSplit(city, view, data);
  const pracaCls = pracaSplit.total > 0 ? 'green' : pracaSplit.total < 0 ? 'red' : '';
  const pracaSplits =
    `<span class="civ-v-w3-chip-splits">` +
    w3SplitSpan(pracaSplit.doBudynkow, 'gold', 'Praca → budynki (kolejka produkcji)') +
    w3SplitSpan(pracaSplit.doUlepszen, 'blue', 'Praca → ulepszenia terenu (farma, kamieniołom…)') +
    `</span>`;

  const splitHandel = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, splitHandel);
  const goldCls = view.pieniadz > 0 ? 'green' : view.pieniadz < 0 ? 'red' : '';
  const skarbHandel = est.skarb;
  const wealthHandel = est.zam;
  const goldSplits =
    `<span class="civ-v-w3-chip-splits">` +
    w3SplitSpan(skarbHandel, 'gold', 'Handel → skarbiec imperium') +
    w3SplitSpan(wealthHandel, 'purple', 'Handel → pula zamożności (W)', 'W') +
    `</span>`;

  const foodSplit = cityFoodSplit(view);
  const foodCls = foodSplit.total > 0 ? 'green' : foodSplit.total < 0 ? 'red' : '';
  const foodSplits =
    `<span class="civ-v-w3-chip-splits">` +
    w3SplitSpan(foodSplit.doWzrostu, 'gold', 'Żywność → wzrost ludności (bufor miasta)') +
    w3SplitSpan(foodSplit.doArmii, 'blue', 'Żywność → zapasy armii państwa') +
    `</span>`;

  const kultCls = view.kultura > 0 ? 'gold' : view.kultura < 0 ? 'red' : '';
  const naukaCls = view.nauka > 0 ? 'blue' : view.nauka < 0 ? 'red' : 'blue';

  const relSt = cfg.getReligionState?.(city.id);
  const cityRel = Math.round(relSt?.przyrostWiernych ?? 0);
  const relCls = cityRel > 0 ? 'gold' : cityRel < 0 ? 'red' : '';

  const parts: string[] = [
    w3CityChip(
      cityPanelChipIcon('res-work', 20),
      'Praca',
      signed(pracaSplit.total),
      pracaCls,
      'praca',
      `Praca tego miasta · budynki ${signed(pracaSplit.doBudynkow)} · ulepszenia ${signed(pracaSplit.doUlepszen)}`,
      pracaSplits,
    ),
    w3CityChip(
      loafIconHtml(),
      'Żywność',
      signed(foodSplit.total),
      foodCls,
      'zywnosc',
      `Netto żywności tego miasta · wzrost ${signed(foodSplit.doWzrostu)} · armia ${signed(foodSplit.doArmii)}`,
      foodSplits,
    ),
    w3CityChip(
      cityPanelChipIcon('res-treasury', 20),
      'Skarbiec',
      signed(view.pieniadz),
      goldCls,
      'zloto',
      `Netto pieniędzy tego miasta → skarbiec · handel → skarb ${signed(skarbHandel)} · zamożność ${signed(wealthHandel)}`,
      goldSplits,
    ),
    w3CityChip(
      cityPanelChipIcon('res-culture', 20),
      'Kultura',
      signed(view.kultura),
      kultCls,
      'kultura',
      `Kultura generowana w tym mieście`,
    ),
    w3CityChip(
      cityPanelChipIcon('res-religion', 20),
      'Religia',
      signed(cityRel),
      relCls,
      'religia',
      `Przyrost wiernych w tym mieście`,
    ),
    w3CityChip(
      `<span class="civ-v-w3-sci-med">${scienceOwlIconHtml()}</span>`,
      'Nauka',
      signed(view.nauka),
      naukaCls,
      'nauka',
      `Nauka generowana w tym mieście`,
    ),
  ];

  return parts.join('<span class="civ-v-w3-chip-sep"></span>');
}

function buildCityResourceStatItems(
  city: City,
  view: CityView | null,
  map: GameMap | null,
  data: GameData | null,
  w3 = false,
): string {
  const empire = resolveEmpireSnap(city, map, data);
  if (w3 && view) {
    return buildCityOnlyW3StatItems(city, view, data);
  }
  if (w3 && !view) {
    return '';
  }

  let items = resLocalOnly(
    cityPanelChipIcon('res-population', 20),
    String(city.population),
    'muted',
    'Ludność tego miasta — kliknij po szczegóły',
    'ludnosc',
  );

  const mpSnap = cfg.getManpowerSnapshot?.(city.id);
  if (mpSnap) {
    items += `<span class="civ-v-res-sep"></span>`;
    items += resLocalOnly(
      cityPanelChipIcon('tb-army', 20),
      `${formatManpower(mpSnap.manpowerBiezacy)}/${formatManpower(mpSnap.manpowerMax)}`,
      'gold',
      `Rekruci (Manpower) · +${formatManpower(mpSnap.regenPerTurn)} · kliknij po szczegóły`,
      'rekruci',
    );
  }

  if (view) {
    const pracaPool = empire.pracaPool ?? empire.pracaRate ?? 0;
    const pracaSplit = cityPracaSplit(city, view, data);
    items += `<span class="civ-v-res-sep"></span>`;
    const foodCls = view.zywnoscNetto > 0 ? 'green' : view.zywnoscNetto < 0 ? 'red' : 'gold';
    items += resLocalOnly(
      loafIconHtml(),
      signed(view.zywnoscNetto),
      foodCls,
      `Netto żywności tego miasta · zapasy armii na HUD mapy · kliknij po szczegóły`,
      'zywnosc',
    );
    items += resPracaSplitBar(
      String(Math.round(pracaPool)),
      pracaSplit.doBudynkow,
      pracaSplit.doUlepszen,
      `Pula Pracy imperium · to miasto ${signed(pracaSplit.total)} · kliknij po szczegóły`,
      'praca',
    );
    items += resGlobalLocal(
      cityPanelChipIcon('res-treasury', 20),
      String(Math.round(empire.zloto ?? cfg.getTreasury?.(city.ownerId) ?? 0)),
      view.pieniadz,
      'gold',
      `Skarbiec imperium · ten gród: ${signed(view.pieniadz)} · kliknij po szczegóły`,
      'zloto',
    );
    if (empire.nauka != null) {
      items += resGlobalLocal(
        scienceOwlIconHtml(),
        String(Math.round(empire.nauka)),
        view.nauka,
        'blue',
        `Bank nauki imperium · ten gród: ${signed(view.nauka)} · kliknij po szczegóły`,
        'nauka',
      );
    } else {
      items += resGlobalLocal(
        scienceOwlIconHtml(),
        String(Math.round(empire.naukaRate ?? view.nauka)),
        view.nauka,
        'blue',
        `Nauka imperium · ten gród: ${signed(view.nauka)} · kliknij po szczegóły`,
        'nauka',
      );
    }
    items += resGlobalLocal(
      cityPanelChipIcon('res-culture', 20),
      String(Math.round(empire.kulturaRate ?? view.kultura)),
      view.kultura,
      'gold',
      `Kultura imperium · ten gród: ${signed(view.kultura)} · kliknij po szczegóły`,
      'kultura',
    );
    const relSt = cfg.getReligionState?.(city.id);
    const relName = empire.stateReligion ?? relSt?.dominujaca ?? '—';
    const relStock = empire.religionStock ?? 0;
    const cityRelDelta = relSt?.przyrostWiernych ?? 0;
    items += resGlobalLocal(
      cityPanelChipIcon('res-religion', 20),
      String(Math.round(relStock)),
      cityRelDelta,
      'gold',
      `Wierni „${relName}” (${empire.religionSharePct ?? relSt?.udzialPct ?? 0}%) · kliknij po szczegóły`,
      'religia',
    );
  }
  const orderSt = cfg.getOrderState?.(city.id);
  const porPct = orderSt?.porPct ?? (data ? resolveOrderState(city, data).state.porPct : null);
  if (porPct != null) {
    items += resLocalOnly(
      cityPanelChipIcon('cp-order', 20),
      `${porPct.toFixed(0)}%`,
      porPct >= 60 ? 'green' : 'gold',
      'Porządek w tym mieście — kliknij po szczegóły',
      'porzadek',
    );
  }
  return items;
}

function closeCityView(onClose?: () => void): void {
  clearCityPanelUxMode();
  if (onClose) onClose();
  else activeOnClose();
}

function renderCityExitFooter(mount: HTMLElement, onClose?: () => void): void {
  const wrap = el('div', 'civ-v-exit-foot');
  wrap.innerHTML =
    `<button type="button" class="civ-v-exit-map-btn civ-v-exit-foot-btn" data-city-exit title="Wróć na mapę świata (Esc)">` +
    `<span class="civ-v-exit-ic">${cityPanelBrandIcon('menu-exit', 24)}</span>` +
    `<span>Wróć na mapę</span>` +
    `</button>` +
    `<span class="civ-v-exit-foot-hint">Esc — szybkie zamknięcie</span>`;
  wrap.querySelector('[data-city-exit]')?.addEventListener('click', () => closeCityView(onClose));
  mount.appendChild(wrap);
}

function renderCivResourceTopBar(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  map: GameMap | null,
  data: GameData | null,
  onClose?: () => void,
): void {
  const items = buildCityResourceStatItems(city, view, map, data, true);
  const multi = ownerCities(city).length > 1;
  const navDis = multi ? '' : 'disabled';
  mount.innerHTML =
    `<div class="civ-v-top-stack">` +
    `<div class="civ-v-w3-city-badge">` +
    `<button type="button" class="civ-v-w3-city-nav" id="civ-v-city-prev" ${navDis} title="Poprzednie miasto">‹</button>` +
    `<span class="civ-v-w3-city-name">${cityPanelTitle(city)}</span>` +
    `<button type="button" class="civ-v-w3-city-nav" id="civ-v-city-next" ${navDis} title="Następne miasto">›</button>` +
    `<span class="civ-v-w3-city-pop">${city.population}</span>` +
    `</div>` +
    `<div class="civ-v-resource-bar civ-v-resource-bar-w3">` +
    `<div class="civ-v-w3-chips civ-v-w3-chips-city">${items}</div>` +
    `</div>` +
    `<div class="civ-v-exit-top-row">` +
    `<button type="button" class="civ-v-exit-map-btn" id="civ-v-map-close" title="Wróć na mapę świata (Esc)">` +
    `<span class="civ-v-exit-ic">${cityPanelBrandIcon('menu-exit', 24)}</span>` +
    `<span>Wróć na mapę</span>` +
    `</button>` +
    `<span class="civ-v-exit-foot-hint">Esc — szybkie wyjście</span>` +
    `</div>` +
    `</div>`;
  mount.querySelector('#civ-v-map-close')?.addEventListener('click', () => closeCityView(onClose));
  mount.querySelector('#civ-v-city-prev')?.addEventListener('click', () => switchCity(-1));
  mount.querySelector('#civ-v-city-next')?.addEventListener('click', () => switchCity(1));
  wireTopBarStatDetails(mount, city, view, map, data);
}

function renderCityIconLeftRail(mount: HTMLElement): void {
  mount.innerHTML = '';
  const scope = el('div', 'civ-cs civ-ux-panel-scope');
  mount.appendChild(scope);
  const iconMount = el('div', 'civ-v-icon-rail-mount');
  iconMount.id = 'cs-icon-rail-left';
  scope.appendChild(iconMount);
  renderCityIconRail(iconMount, CITY_PANEL_ICONS_LEFT, true, true);
}

function renderCityIconRightRail(mount: HTMLElement): void {
  mount.innerHTML = '';
  const scope = el('div', 'civ-cs civ-ux-panel-scope');
  mount.appendChild(scope);
  const iconMount = el('div', 'civ-v-icon-rail-mount');
  iconMount.id = 'cs-icon-rail-right';
  scope.appendChild(iconMount);
  renderCityIconRail(iconMount, CITY_PANEL_ICONS_RIGHT, true, true);
}

/** Prawy panel (góra): nazwa miasta, ludność, pasek wzrostu. */
function renderCityHeaderCompact(mount: HTMLElement, city: City, view: CityView | null): void {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  mount.innerHTML =
    `<div class="civ-v-city-name">${city.name}</div>` +
    `<div class="civ-v-city-pop">${city.population} obywateli · epoka ${epoch}</div>`;
  if (!view) {
    mount.appendChild(el('div', 'muted', 'Brak danych ekonomii'));
    return;
  }
  const growPct = view.progWzrostu > 0
    ? Math.min(100, Math.round((view.magazyn / view.progWzrostu) * 100))
    : 0;
  const grow = el('div', 'civ-v-growth');
  grow.innerHTML =
    `<div class="civ-v-growth-lbl">Wzrost · ${view.magazyn}/${Math.round(view.progWzrostu)} ${loafIconHtml('civ-v-loaf-chip')}</div>` +
    `<div class="bwrap"><div class="bfill" style="width:${growPct}%;background:linear-gradient(90deg,#2a6a2a,#6bbf59)"></div></div>`;
  mount.appendChild(grow);
}

function buildHandelDetailCard(
  city: City,
  view: CityView | null,
  data: GameData | null,
): HTMLDivElement {
  const split = readPodzialHandlu(city, data);
  const params = data ? buildEconParams(data, cfg.difficulty ?? 'normal') : null;
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const maTargowisko = built.includes('targowisko');
  const maMennica = built.includes('mennica');
  const maBiblioteka = cityHasBibliotekaLine(built);
  const est = estimateHandelChips(view, split);

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Podział handlu — szczegóły</span>';
  card.appendChild(head);

  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    `Handel z pól okolicy to osobny strumień 💰. Najpierw odejmujemy stratę (korupcję), potem suwaki dzielą resztę między skarbiec, naukę i ${HANDEL_ZAMOZNOSC_LABEL.toLowerCase()}. Suma suwaków = 100%, kroki 10%.`,
  );
  card.appendChild(intro);

  const todo = el('div', 'dc-note');
  todo.style.cssText = 'font-style:normal;border-left:2px solid var(--gold);padding-left:0.45em;margin-top:0.35em;';
  todo.innerHTML =
    '<b class="gold">Do rozkminienia (v2):</b> skąd bierze się korupcja (dystans od stolicy, liczba miast, epoka, porządek, tech?), ' +
    'czy gracz może ją obniżać, czy pokazujemy ją per miasto czy imperium. ' +
    `Na razie w UI: stałe <b>${HANDEL_KORUPCJA_PCT_PLACEHOLDER}%</b> handlu brutto — placeholder, nie wpływa jeszcze na silnik w prototypie.`;
  card.appendChild(todo);

  appendDetailSection(card, 'Korupcja (placeholder)');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Handel brutto (szac.)', est.brutto ? `~${est.brutto}` : '—');
  gridDetailRow(g0, 'Strata korupcji', `−${est.korupcja} (${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto)`);
  gridDetailRow(g0, 'Handel netto', est.netto ? `~${est.netto} → split suwaków` : '—');
  if (params) {
    gridDetailRow(g0, 'Silnik (docelowo)', `dystans×${params.korupcjaWspolczynnikDystansu} + miasta×${params.korupcjaWspolczynnikMiast}, cap ${Math.round(params.korupcjaCap * 100)}%`);
  }

  appendDetailSection(card, 'Aktualny podział');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Skarb', `${split.procentPieniadz}%${est.skarb ? ` · ~+${est.skarb} z handlu` : ''}`);
  gridDetailRow(g1, 'Nauka', `${split.procentNauka}%${est.nauka ? ` · ~+${est.nauka} z handlu` : ''}`);
  gridDetailRow(g1, HANDEL_ZAMOZNOSC_LABEL, `${split.procentLuksus}%${est.zam ? ` · ~+${est.zam} → pula` : ' → pula'}`);
  if (view) {
    gridDetailRow(g1, 'Uwaga', '* Pieniądz i Nauka zawierają też budynki (chipy = tylko udział z handlu netto)');
  }

  appendDetailFormula(card, 'handelBrutto = Σ handel pól' + (maTargowisko ? ' × (1 + bonus Targowiska)' : ''));
  appendDetailFormula(card, `strataKorupcji = handelBrutto × ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% (placeholder UI)`);
  appendDetailFormula(card, 'handelNetto = handelBrutto − strataKorupcji' + (params ? ' × mnożnik Waluty (jeśli zbadana)' : ''));
  appendDetailFormula(card, 'nauka = floor(handelNetto × %Nauka) + budynki');
  appendDetailFormula(card, 'skarb_z_handlu = floor(handelNetto × %Skarb × mennica)');
  appendDetailFormula(card, `${HANDEL_ZAMOZNOSC_LABEL} = floor(handelNetto × %${HANDEL_ZAMOZNOSC_LABEL}) → pula zamożności`);

  appendDetailAlgo(card, 'Algorytm podziału handlu (cityYieldPerTurn)', [
    'Zbierz handel ze wszystkich obrabianych pól + centrum miasta.',
    maTargowisko ? 'Targowisko zwiększa handelBrutto o bonus procentowy.' : 'Bez Targowiska — tylko plony z terenu.',
    `Odejmij korupcję (placeholder ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto; docelowo: dystans, miasta, cap) → handelNetto.`,
    'Technologia Waluta mnoży handelNetto (także Naukę i ' + HANDEL_ZAMOZNOSC_LABEL + ').',
    `Podziel handelNetto suwakami: Skarb / Nauka / ${HANDEL_ZAMOZNOSC_LABEL} (suma 100%).`,
    maMennica ? 'Mennica mnoży tylko część Skarb z handlu.' : 'Bez Mennicy — Skarb z handlu bez mnożnika.',
    maBiblioteka ? 'Biblioteka dodaje % bonusu do Nauki (łącznie z Nauką z handlu).' : 'Nauka = wyłącznie udział z handlu + budynki.',
    `${HANDEL_ZAMOZNOSC_LABEL} nie trafia do skarbca — idzie do puli zamożności miasta.`,
    'Na końcu: mnożnik W mnoży cały pieniądz miasta (Skarb + budynki + Targowisko).',
  ]);

  appendDetailAlgo(card, 'Suwak UI (adjustHandelSplit)', [
    'Zmieniasz jeden suwak — pozostałe dwa dostosowują się proporcjonalnie.',
    'Kroki co 10% (HANDEL_PCT_STEP). Suma zawsze 100%.',
    `Przesunięcie na ${HANDEL_ZAMOZNOSC_LABEL} = mniej 💰 teraz, wyższe W później (×Skarb rośnie z W).`,
    `Przesunięcie na Skarb = więcej 💰 teraz, wolniejszy W lub spadek W przy zbyt niskim udziale ${HANDEL_ZAMOZNOSC_LABEL}.`,
  ]);

  appendDetailSection(card, 'Kontekst kolumny');
  const note = el('div', 'dc-note');
  note.style.fontStyle = 'normal';
  note.textContent =
    'Handel, zamożność, Spichlerz/wzrost i porządek — ustawienia w tej kolumnie wpływają na każdą turę. ' +
    'Podział handlu jest per miasto; suwak żywności armii — globalny dla całego państwa.';
  card.appendChild(note);
  return card;
}

function renderHandelSlidersPanel(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {
  mount.innerHTML = '';
  appendSectionTitleWithDetails(mount, '<span>Podział handlu</span>', () => buildHandelDetailCard(city, view, data));
  const split = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, split);
  if (view) {
    appendTabIndicators(mount, [
      {
        icon: cityPanelChipIcon('cp-trade', 14),
        label: 'Handel',
        value: `${est.netto}`,
        cls: 'gold',
        title: `Brutto ~${est.brutto} · korupcja −${est.korupcja}`,
      },
      { icon: cityPanelChipIcon('res-treasury', 14), label: 'Pieniądz', value: `${signed(view.pieniadz)}`, cls: 'blue' },
      { icon: cityPanelChipIcon('res-science', 14), label: 'Nauka', value: `${signed(view.nauka)}`, cls: 'blue' },
      {
        icon: cityPanelChipIcon('res-culture', 14),
        label: 'Kultura',
        value: `${signed(view.kultura)}`,
        cls: 'gold',
      },
    ]);
  }
  appendPodzialHandlu(mount, city, view, data, { skipSubhd: true });
}

function renderCivMapChrome(mount: HTMLElement, city: City, _onClose?: () => void): void {
  mount.innerHTML =
    `<div class="civ-v-map-bottom-stack">` +
    `<div id="cs-okolica-center" class="civ-v-okolica-center">` +
    `<div id="cs-okhead-ux" class="ptitle civ-v-okolica-head"></div>` +
    `<div id="cs-oktoolbar-ux" class="okolica-toolbar okolica-toolbar-map"></div>` +
    `<div id="cs-okmode" class="okolica-mode-hint civ-v-okmode-map"></div>` +
    `</div>` +
    `</div>` +
    `<div id="cs-okolica-aux" hidden aria-hidden="true">` +
    `<div id="cs-okolica" class="okolica-grid-host"></div>` +
    `<div id="cs-okstats" class="okstats is-collapsed"></div>` +
    `<div id="cs-okhint" class="okhint is-collapsed"></div>` +
    `</div>`;
}

function appendOkolicaToolbarProfiles(
  wrap: HTMLElement,
  city: City,
  focus: OkolicaFocus,
  tryb: OkolicaTryb,
): void {
  const profiles: { id: OkolicaFocus; title: string }[] = [
    { id: 'zywnosc', title: 'Żywność' },
    { id: 'produkcja', title: 'Produkcja' },
    { id: 'podatki', title: 'Podatki' },
    { id: 'zrownowazone', title: 'Zrównoważone' },
  ];
  for (const p of profiles) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = tryb !== 'reczny' && p.id === focus ? 'on' : '';
    setOkolicaProfileButtonContent(b, OKOLICA_FOCUS_BRAND[p.id], OKOLICA_FOCUS_SHORT[p.id]);
    b.title = p.title;
    b.disabled = !cfg.onOkolicaFocusChange;
    b.addEventListener('click', () => { cfg.onOkolicaFocusChange?.(city.id, p.id); rerender(); });
    wrap.appendChild(b);
  }
  if (cfg.onOkolicaEnterManual) {
    const recBtn = document.createElement('button');
    recBtn.type = 'button';
    recBtn.className = 'reczny' + (tryb === 'reczny' ? ' on' : '');
    setOkolicaProfileButtonContent(recBtn, 'chip-manpower', 'Ręczny');
    recBtn.title = 'Ręczne przypisywanie pól na mapie';
    recBtn.addEventListener('click', () => { cfg.onOkolicaEnterManual?.(city.id); rerender(); });
    wrap.appendChild(recBtn);
  }
  if (tryb === 'reczny' && cfg.onOkolicaRestoreAuto) {
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'okolica-restore-btn';
    reset.textContent = '↩';
    reset.title = 'Przywróć auto';
    reset.addEventListener('click', () => { cfg.onOkolicaRestoreAuto?.(city.id); rerender(); });
    wrap.appendChild(reset);
  }
}

function appendBudowaToolbarProfiles(
  wrap: HTMLElement,
  city: City,
  focus: BudowaFocus,
  tryb: BudowaTryb,
): void {
  const profiles: BudowaFocus[] = [
    'wzrost', 'wojsko', 'kultura', 'prawo', 'produkcja', 'zrownowazone',
  ];
  for (const id of profiles) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = tryb !== 'reczny' && id === focus ? 'on' : '';
    setOkolicaProfileButtonContent(b, BUDOWA_FOCUS_BRAND[id], BUDOWA_FOCUS_SHORT[id]);
    b.title = BUDOWA_FOCUS_TITLE[id];
    b.disabled = !cfg.onBudowaFocusChange;
    b.addEventListener('click', () => { cfg.onBudowaFocusChange?.(city.id, id); rerender(); });
    wrap.appendChild(b);
  }
  if (cfg.onBudowaEnterManual) {
    const recBtn = document.createElement('button');
    recBtn.type = 'button';
    recBtn.className = 'reczny' + (tryb === 'reczny' ? ' on' : '');
    setOkolicaProfileButtonContent(recBtn, 'chip-manpower', 'Ręczny');
    recBtn.title = 'Ręczny wybór budynków w kolejce';
    recBtn.addEventListener('click', () => { cfg.onBudowaEnterManual?.(city.id); rerender(); });
    wrap.appendChild(recBtn);
  }
}

function renderTopStatsBar(mount: HTMLElement, city: City, view: CityView | null): void {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const skarb = cfg.getTreasury?.(city.ownerId);
  const orderSt = cfg.getOrderState?.(city.id);
  const por = orderSt?.porPct;
  const cell = (iconId: string, label: string, val: string, cls = '') =>
    `<td class="civ-ux-td"><span class="civ-ux-tl">${cityPanelChipIconWrap(iconId, 14)}<span>${label}</span></span><span class="civ-ux-tv ${cls}">${val}</span></td>`;

  const rows = view
    ? [
        cell('res-population', 'Ludność', String(city.population)),
        cell('cp-order', 'Epoka', String(epoch)),
        cell('field-food', 'Żywność', signed(view.zywnoscNetto), view.zywnoscNetto >= 0 ? 'green' : 'red'),
        cell('res-work', 'Praca', signed(view.praca), 'gold'),
        cell('res-treasury', 'Pieniądz', signed(view.pieniadz), 'blue'),
        cell('res-science', 'Nauka', signed(view.nauka), 'blue'),
        cell('res-culture', 'Kultura', signed(view.kultura), 'gold'),
        por != null ? cell('cp-order', 'Porządek', `${por.toFixed(0)}%`, por >= 60 ? 'green' : por >= 30 ? 'gold' : 'red') : '',
        skarb != null ? cell('res-treasury', 'Skarb', String(skarb), 'gold') : '',
      ].join('')
    : cell('cp-order', '—', 'Brak danych', 'muted');

  mount.innerHTML =
    `<div class="civ-ux-top-bar">` +
    `<span class="civ-ux-top-city">${cityPanelChipIconWrap('chip-star', 14)} ${cityPanelTitle(city)}</span>` +
    `<table class="civ-ux-top-table"><tr>${rows}</tr></table>` +
    `<button type="button" class="civ-ux-top-close" id="civ-ux-close" title="Zamknij (Esc)">✕</button>` +
    `</div>`;
}

function appendPanel(parent: HTMLElement, id?: string): HTMLElement {
  const p = el('div', 'panel panel-tight');
  if (id) p.id = id;
  parent.appendChild(p);
  return p;
}

function appendSectionTitleWithDetails(
  mount: HTMLElement,
  titleHtml: string,
  buildDetail: () => HTMLElement,
): void {
  const head = el('div', 'ptitle');
  const left = el('span', '');
  left.innerHTML = titleHtml;
  head.appendChild(left);
  const infoLink = el('span', 'okolica-info-link civ-w4-panel-detail gold');
  infoLink.textContent = 'i szczegóły';
  head.appendChild(infoLink);
  mount.appendChild(head);
  attachHoverDetail(head, buildDetail, 220);
}

function appendSectionBlurb(parent: HTMLElement, text: string): void {
  const b = el('div', 'section-blurb muted');
  b.textContent = text;
  parent.appendChild(b);
}

/** Zakładki panelu miasta — produkcja (lewy rail + lewy panel) vs parametry (prawy rail + prawy panel). */
type CityPanelIconTab =
  | 'budowa'
  | 'rekrutacja'
  | 'spichlerz'
  | 'handel'
  | 'praca'
  | 'porzadek'
  | 'zdrowie'
  | 'kultura'
  | 'religia';

type CityPanelProductionTab = 'budowa' | 'rekrutacja';
type CityPanelCityParamTab = Exclude<CityPanelIconTab, CityPanelProductionTab>;

const CITY_PANEL_ICONS_LEFT: { id: CityPanelProductionTab; iconId: string; title: string }[] = [
  { id: 'budowa', iconId: 'cp-buildings', title: 'Budowa — dostępne i w mieście' },
  { id: 'rekrutacja', iconId: 'cp-recruit', title: 'Jednostki do rekrutacji' },
];

const CITY_PANEL_ICONS_RIGHT: { id: CityPanelCityParamTab; iconId: string; title: string }[] = [
  { id: 'spichlerz', iconId: 'cp-granary', title: 'Spichlerz' },
  { id: 'handel', iconId: 'cp-trade', title: 'Podział handlu i zamożność — suwaki Skarb / Nauka / Zamożność' },
  { id: 'praca', iconId: 'cp-labor', title: 'Podział pracy — budynki i ulepszenia' },
  { id: 'porzadek', iconId: 'cp-order', title: 'Społeczeństwo i porządek' },
  { id: 'zdrowie', iconId: 'cp-health', title: 'Zdrowie miasta' },
  { id: 'kultura', iconId: 'cp-culture', title: 'Kultura — granice i progi' },
  { id: 'religia', iconId: 'cp-religion', title: 'Religia — wiara i szerzenie' },
];

function isProductionPanelTab(tab: CityPanelIconTab): tab is CityPanelProductionTab {
  return tab === 'budowa' || tab === 'rekrutacja';
}

const CADUCEUS_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<line x1="12" y1="9.2" x2="12" y2="21.5"/>' +
  '<circle cx="12" cy="7.4" r="1.35" fill="currentColor" stroke="none"/>' +
  '<path d="M12 8.6 C8.2 6.2 5.2 7.1 4 9.2"/>' +
  '<path d="M12 8.6 C15.8 6.2 18.8 7.1 20 9.2"/>' +
  '<path d="M9.6 10.8 C7.2 13.2 7.8 16.8 12 19.2"/>' +
  '<path d="M14.4 10.8 C16.8 13.2 16.2 16.8 12 19.2"/>' +
  '</svg>';

function cityRailIconHtml(iconId: string): string {
  const svg = brandIconSvg(iconId, 24);
  if (!svg) return '';
  return svg.replace('<svg ', '<svg class="civ-cp-rail-ic" ');
}

let activeCityPanelTab: CityPanelIconTab = 'budowa';

function renderOkolicaPanel(mount: HTMLElement, city: City, map: GameMap): void {
  mount.innerHTML =
    `<div id="cs-okmode" class="okolica-mode-hint"></div>` +
    `<div id="cs-okolica" class="okolica-grid-host"></div>` +
    `<div id="cs-okstats" class="okstats is-collapsed"></div>` +
    `<div id="cs-okhint" class="okhint is-collapsed"></div>`;
  renderOkolica(mount, city, map);
}

function renderCityIconRail(
  mount: HTMLElement,
  items: ReadonlyArray<{ id: CityPanelIconTab; iconId: string; title: string }>,
  vertical = false,
  w3Medallions = false,
): void {
  mount.innerHTML = '';
  const railCls = vertical
    ? (w3Medallions ? 'civ-v-icon-rail civ-v-icon-rail-vert civ-v-icon-rail-w3' : 'civ-v-icon-rail civ-v-icon-rail-vert')
    : 'civ-v-icon-rail';
  const rail = el('div', railCls);
  const iconPx = vertical && !w3Medallions ? Math.round(scalePx * CITY_PANEL_ICON_RAIL_VERT_EM) : 0;
  for (const item of items) {
    const btn = el('button', `civ-v-icon-btn${activeCityPanelTab === item.id ? ' on' : ''}`);
    btn.type = 'button';
    btn.title = item.title;
    btn.setAttribute('aria-label', item.title);
    btn.setAttribute('aria-pressed', activeCityPanelTab === item.id ? 'true' : 'false');
    const glyph = el('span', 'civ-v-icon-glyph');
    glyph.innerHTML = cityRailIconHtml(item.iconId);
    if (w3Medallions) {
      glyph.style.width = '26px';
      glyph.style.height = '26px';
      glyph.style.fontSize = '';
    } else if (vertical) {
      glyph.style.width = '24px';
      glyph.style.height = '24px';
      glyph.style.fontSize = '';
    } else if (iconPx > 0) {
      glyph.style.fontSize = iconPx + 'px';
      glyph.style.width = iconPx + 'px';
      glyph.style.height = iconPx + 'px';
    }
    btn.appendChild(glyph);
    btn.addEventListener('click', () => {
      if (activeCityPanelTab !== item.id) {
        activeCityPanelTab = item.id;
        rerender();
      }
    });
    rail.appendChild(btn);
  }
  mount.appendChild(rail);
}

function withW4TabCard(
  parent: HTMLElement,
  id: string | undefined,
  city: City,
  render: (body: HTMLElement) => void,
  opts?: { scrollable?: boolean },
): void {
  const cardCls = opts?.scrollable ? 'civ-w4-tab-card civ-w4-tab-card--scroll' : 'civ-w4-tab-card';
  const card = el('div', cardCls);
  if (id) card.id = id;
  const bodyCls = opts?.scrollable ? 'civ-w4-tab-body civ-w4-tab-body--scroll' : 'civ-w4-tab-body';
  const body = el('div', bodyCls);
  card.appendChild(body);
  parent.appendChild(card);
  render(body);
}

function renderLeftPanelTab(
  mount: HTMLElement,
  tab: CityPanelProductionTab,
  city: City,
  map: GameMap,
  view: CityView | null,
  data: GameData | null,
): void {
  mount.classList.toggle('civ-v-left-main-split', tab === 'budowa');
  mount.innerHTML = '';
  switch (tab) {
    case 'budowa':
      renderBuildSplitPanel(mount, city, data, view);
      break;
    case 'rekrutacja':
      withW4TabCard(mount, 'cs-units', city, body => {
        renderPurchasableUnits(body, city, data, {
          visibleRows: LIST_SCROLL_VISIBLE_CATALOG,
          w4: true,
        });
      });
      break;
    default:
      mount.appendChild(el('div', 'muted', '—'));
  }
}

function renderRightPanelTab(
  mount: HTMLElement,
  tab: CityPanelCityParamTab,
  city: City,
  map: GameMap,
  view: CityView | null,
  data: GameData | null,
): void {
  mount.classList.remove('civ-v-right-main-split');
  mount.innerHTML = '';
  switch (tab) {
    case 'spichlerz':
      withW4TabCard(mount, 'cs-magazyn', city, body => renderMagazyn(body, city, view));
      break;
    case 'handel':
      withW4TabCard(mount, undefined, city, body => {
        const hint = el('div', 'civ-handel-tab-hint');
        hint.textContent = 'Suwaki podziału handlu (Skarb · Nauka · Zamożność) i poziom zamożności — przewiń, jeśli nie mieści się na ekranie.';
        body.appendChild(hint);
        const slidersHost = el('div', 'civ-handel-sliders-host');
        const wealthHost = el('div', 'civ-handel-wealth-host');
        body.appendChild(slidersHost);
        body.appendChild(wealthHost);
        renderHandelSlidersPanel(slidersHost, city, view, data);
        renderWealth(wealthHost, city, data, view);
      }, { scrollable: true });
      break;
    case 'praca':
      withW4TabCard(mount, 'cs-praca', city, body => {
        if (cfg.onPodzialPracyChange) {
          renderPodzialPracy(body, city, view, data);
        } else {
          body.appendChild(el('div', 'muted', 'Podział pracy niedostępny (brak hooka silnika).'));
        }
      });
      break;
    case 'porzadek':
      if (data) {
        withW4TabCard(mount, 'cs-spoleczenstwo', city, body => renderSpoleczenstwo(body, city, data));
      } else mount.appendChild(el('div', 'muted', 'Brak danych społeczeństwa'));
      break;
    case 'zdrowie':
      if (data) {
        withW4TabCard(mount, 'cs-zdrowie', city, body => renderZdrowie(body, city, map, data));
      } else mount.appendChild(el('div', 'muted', 'Brak danych zdrowia'));
      break;
    case 'kultura':
      withW4TabCard(mount, 'cs-kultura', city, body => renderKultura(body, city, view));
      break;
    case 'religia':
      withW4TabCard(mount, 'cs-religia', city, body => renderReligia(body, city, view));
      break;
    default:
      mount.appendChild(el('div', 'muted', '—'));
  }
}

/**
 * Rysuje sekcje panelu miasta w zewnętrznych mountach (prototyp Civ V: lewo=produkcja, prawo=społeczeństwo).
 * Wywołuj `refresh` po każdej zmianie stanu; suwaki wewnątrz sekcji wołają rerender() → refresh.
 */
export function paintCityPanelSections(
  mounts: CityPanelUxMounts,
  city: City,
  map: GameMap,
  refresh: () => void,
  onClose?: () => void,
): void {
  uxSectionRefresh = refresh;
  activeCity = city;
  activeMap = map;
  if (onClose) activeOnClose = onClose;
  ensureStyles();

  setHoverDetailDocks(
    mounts.leftDetailDock || mounts.detailDock
      ? { left: mounts.leftDetailDock ?? null, right: mounts.detailDock ?? null }
      : null,
  );

  mounts.top.style.fontSize = scalePx + 'px';
  mounts.left.style.fontSize = scalePx + 'px';
  if (mounts.leftIconRail) mounts.leftIconRail.style.fontSize = scalePx + 'px';
  if (mounts.rightIconRail) mounts.rightIconRail.style.fontSize = scalePx + 'px';
  if (mounts.leftDetailDock) mounts.leftDetailDock.style.fontSize = scalePx + 'px';
  if (mounts.detailDock) mounts.detailDock.style.fontSize = scalePx + 'px';
  mounts.right.style.fontSize = scalePx + 'px';

  const data = gameData();
  const view = data ? computeView(city, map, data) : null;

  mounts.top.innerHTML = '';
  const topScope = el('div', 'civ-cs civ-ux-panel-scope');
  mounts.top.appendChild(topScope);
  renderCivResourceTopBar(topScope, city, view, map, data, onClose);

  if (mounts.leftIconRail) {
    renderCityIconLeftRail(mounts.leftIconRail);
  }
  if (mounts.rightIconRail) {
    renderCityIconRightRail(mounts.rightIconRail);
  }

  if (mounts.mapChrome) {
    mounts.mapChrome.innerHTML = '';
    renderCivMapChrome(mounts.mapChrome, city, onClose);
    renderOkolica(mounts.mapChrome, city, map);
  }

  mounts.left.innerHTML = '';
  const leftScope = el('div', 'civ-cs civ-ux-panel-scope civ-v-left-col');
  leftScope.style.display = 'flex';
  leftScope.style.flexDirection = 'column';
  leftScope.style.minHeight = '0';
  leftScope.style.height = '100%';
  mounts.left.appendChild(leftScope);

  renderProd(appendPanel(leftScope, 'cs-prod'), city, view);

  const leftMainEl = el('div', 'civ-v-left-main');
  leftMainEl.id = 'cs-left-main';
  leftScope.appendChild(leftMainEl);
  if (isProductionPanelTab(activeCityPanelTab)) {
    renderLeftPanelTab(leftMainEl, activeCityPanelTab, city, map, view, data);
  } else {
    leftMainEl.style.display = 'none';
  }

  mounts.right.innerHTML = '';
  const rightScope = el('div', 'civ-cs civ-ux-panel-scope civ-v-right-col');
  mounts.right.appendChild(rightScope);

  const mainEl = el('div', 'civ-v-right-main');
  mainEl.id = 'cs-right-main';
  rightScope.appendChild(mainEl);
  if (isProductionPanelTab(activeCityPanelTab)) {
    mainEl.style.display = 'none';
    mainEl.innerHTML = '';
  } else {
    mainEl.style.display = '';
    mainEl.style.flex = '1 1 auto';
    renderRightPanelTab(mainEl, activeCityPanelTab, city, map, view, data);
    mainEl.querySelectorAll('.civ-w4-surowce-foot').forEach(node => {
      node.closest('.panel')?.remove() ?? node.remove();
    });
  }

  const footEl = el('div', 'civ-v-right-foot');
  footEl.id = 'cs-surowce-foot';
  rightScope.appendChild(footEl);
  mounts.right.querySelectorAll('.civ-w4-surowce-foot').forEach(node => {
    if (!footEl.contains(node)) node.remove();
  });
  renderSurowce(appendPanel(footEl, 'cs-surowce'), city);
}

function rerender(): void {
  if (uxSectionRefresh) {
    uxSectionRefresh();
    return;
  }
  setHoverDetailDocks(null);
  if (rootEl === null || activeMap === null) return;
  const city = resolveActiveCity();
  if (!city) return;
  const map = activeMap, data = gameData();
  const view = data ? computeView(city, map, data) : null;

  rootEl.style.fontSize = scalePx + 'px';
  rootEl.innerHTML = skeleton(city, view);

  rootEl.querySelectorAll('.civ-cs-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).getAttribute('data-tab') as CityDrawerTab | null;
      if (tab && tab !== activeDrawerTab) {
        activeDrawerTab = tab;
        rerender();
      }
    });
  });

  const q = (id: string) => rootEl!.querySelector('#' + id) as HTMLElement | null;
  const eko = q('cs-ekonomia'); if (eko) renderEkonomiaStrip(eko, city, view, data);
  const wealth = q('cs-wealth'); if (wealth) renderWealth(wealth, city, data, view);
  const pracaEl = q('cs-praca');
  if (pracaEl) {
    if (cfg.onPodzialPracyChange) {
      pracaEl.style.display = '';
      renderPodzialPracy(pracaEl, city, view, data);
    } else {
      pracaEl.style.display = 'none';
      pracaEl.innerHTML = '';
    }
  }
  const mag = q('cs-magazyn'); if (mag) renderMagazyn(mag, city, view);
  const imp = q('cs-imperium'); if (imp) renderImperiumZywnosc(imp, city);
  const prod = q('cs-prod'); if (prod) renderProd(prod, city, view);
  const build = q('cs-build'); if (build) renderBuildList(build, city, data, view);
  const units = q('cs-units'); if (units) renderPurchasableUnits(units, city, data);
  const owned = q('cs-owned'); if (owned) renderBuildingsOwned(owned, city, data);
  const spol = q('cs-spoleczenstwo'); if (spol && data) renderSpoleczenstwo(spol, city, data);
  const zdr = q('cs-zdrowie'); if (zdr && data) renderZdrowie(zdr, city, map, data);
  renderOkolica(rootEl, city, map);
  const kult = q('cs-kultura'); if (kult) renderKultura(kult, city, view);
  const relig = q('cs-religia'); if (relig) renderReligia(relig, city, view);

  const close = q('cs-close'); if (close) close.addEventListener('click', () => { activeOnClose(); hideCityPanel(); });
  const mapbtn = q('cs-mapbtn');
  if (mapbtn) {
    mapbtn.addEventListener('click', () => {
      if (cfg.onOpenMapForOkolica) {
        cfg.onOpenMapForOkolica(city.id);
      } else {
        activeOnClose();
        hideCityPanel();
      }
    });
  }
  const prev = q('cs-prev'); if (prev) prev.addEventListener('click', () => switchCity(-1));
  const next = q('cs-next'); if (next) next.addEventListener('click', () => switchCity(1));
  const rename = q('cs-rename'); if (rename) rename.addEventListener('click', () => {
    const nn = window.prompt('Nowa nazwa miasta:', city.name);
    if (nn && nn.trim()) { cfg.onRename?.(city.id, nn.trim()); rerender(); }
  });
  const manager = q('cs-manager');
  if (manager) {
    if (cfg.isAutoManageEnabled?.(city.id)) {
      manager.classList.add('active');
      manager.setAttribute('title', 'Zarządca automatyczny — WŁĄCZONY');
    } else {
      manager.classList.remove('active');
      manager.setAttribute('title', 'Zarządca automatyczny — wyłączony');
    }
    manager.addEventListener('click', () => { cfg.onAutoManage?.(city.id); rerender(); });
  }
  const artview = q('cs-artview'); if (artview) artview.addEventListener('click', () => { cfg.onArtView?.(city.id); });
  rootEl.querySelectorAll('.fsbtn').forEach(b => {
    b.addEventListener('click', () => {
      const px = Number((b as HTMLElement).getAttribute('data-px'));
      if (Number.isFinite(px) && px > 0) { scalePx = px; rerender(); }
    });
  });
}

// ---------------------------------------------------------------------------
// Public API (unchanged signatures)
// ---------------------------------------------------------------------------

/** Show the Civ V city view (panels + map centre). */
export function showCityPanel(city: City, map: GameMap, onClose: () => void): void {
  if (rootEl) rootEl.style.display = 'none';
  activeCity = city;
  activeMap = map;
  activeOnClose = onClose;
  ensureStyles();
  setMapHudChromeSuppressed(true);
  const refresh = () => {
    const c = resolveActiveCity();
    if (!c || activeMap === null) return;
    refreshCityUxFrame(c, activeMap, refresh);
  };
  showCityUxFrame(city, map, refresh, onClose);
}

/** Hide the city view. */
export function hideCityPanel(): void {
  hideCityUxFrame();
  setMapHudChromeSuppressed(false);
  if (rootEl) rootEl.style.display = 'none';
}

/** Zamknij panel jeśli otwarty (Esc / skrót z mapy) — wywołuje ten sam onClose co przycisk „Wróć na mapę”. */
export function closeCityPanelIfOpen(): boolean {
  if (!isCityPanelOpen()) return false;
  activeOnClose();
  return true;
}

/** Return true if the city panel is currently visible. */
export function isCityPanelOpen(): boolean {
  return isCityUxFrameOpen();
}

/** Id miasta w aktualnie otwartym panelu (null gdy zamknięty). */
export function getOpenCityPanelCityId(): string | null {
  return activeCity?.id ?? null;
}
