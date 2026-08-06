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

import {
  attachHoverDetail,
  attachInteractiveDetail,
  setHoverDetailDocks,
  disposeHoverDetailDock,
  showHoverDetailNow,
} from './hoverDetailDock';
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
import type { OkolicaFocus, OkolicaTryb, BudowaFocus, BudowaTryb, BudowaListaBiblioteka } from '../game/cities';
import {
  dedupeBudowaLista,
  defaultBudowaListaNazwa,
  sanitizeBudowaPriorytetTypow,
  BUDOWA_TYP_FOCUS,
  DEFAULT_BUDOWA_PRIORYTET_TYPOW,
} from '../game/cities';
import { HANDEL_PCT_STEP, normalizePodzialHandlu, snapHandelPct, adjustHandelSplit } from '../game/cities';
import { resolveCityPodzialHandlu } from '../game/empire-handel-split';
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
  cityPracaInteger,
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
  isBuildingSupersededByUpgrade,
} from '../game/production';
import {
  CITY_BUILDING_PREREQ,
  cityBuildingPrereqMet,
  WATER_ACCESS_BUILDING_IDS,
  buildingRequiredActiveLabels,
  empireResourceLabelSatisfied,
} from '../game/building-resource-gate';
import { CITY_PANEL_RANGE_DEPOSIT_LABELS } from '../game/resource-access';
import {
  buildingStockCost,
  unitStockCost,
  canAffordBuildingStock,
  missingStockFor,
  stockResourceLabel,
  ownerResourceStockAll,
  deductBuildingStockCostAcrossCities,
  refundBuildingStockCostAcrossCities,
} from '../game/building-stock-cost';
import {
  upgradeChainSteps,
  upgradeCompositionLines,
  buildingStructuralDefenseBonusLine,
  buildingStructuralDefenseBonusPercent,
  cityHasBibliotekaLine,
  cityHasAmfiteatrLine,
  cityPalacTier,
  groupBuiltBuildingIds,
} from '../game/building-upgrades';
import { getEmpireFoodMaxCap } from '../game/empire-food';
import {
  buildRationParams,
  computeCityRationCost,
  computeGrowthPercentV85,
  getCityRationLevel,
  growthGainPerTurnSlots,
  turnsUntilNextCitizen,
  rationFoodCostPerPop,
  rationGrowthPercent,
  formatWyzwienieLabel,
  WYZYWIENIE_MIN,
  WYZYWIENIE_MAX,
  WYZYWIENIE_STEP,
  type GrowthPercentBreakdown,
  type PoziomRacji,
} from '../game/population-growth-v85';
import {
  filterRuntimeActiveBuiltIds,
  paySpichlerzDrainForCity,
  resolveOwnedBuildingInactiveStatus,
  resolveSpichlerzCityBonusState,
} from '../game/building-resource-gate';
import { daninaLabel, daninaLabelGenitive, daninaLabelAccusative, type DaninaLabel } from '../game/danina-nazwa';
import type { CityManpowerSnapshot } from '../game/manpower';
import { civManpowerMaxMult, cityLudnoscAbsolutna, formatManpower, unitManpowerCost, unitManpowerCostForType } from '../game/manpower';
import { defaultOwnerColor, mountUnitMiniPreview } from './unitMiniPreview';
import {
  unitInfographicMedallionHtml,
  unitInfographicSvg,
  UNIT_INFOGRAPHIC_CSS,
} from './unitInfographic';
import { buildUnitRecruitCard, UNIT_RECRUIT_CARD_CSS } from './unitRecruitCard';
import { brandIconSvg, buildingIconSvg, unitIconSvg, mapResourceIconSvg, type BrandIconSize } from './icons/brandAssets';
import { techIconSvg } from './techIcons';
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
  computeGarncarniaSurplusZadowolenieByOwner,
  type CityHealthLine,
  type Difficulty,
} from '../game/turn-economy';
import { buildTerritoryNodesFromCities } from '../map/territory-work';
import { axialToWorld, HEX_R } from '../render/hexutil';
import { tileYield } from '../game/economy';
import { mnoznikRoleForBuildingId, cumulativeMnoznikForBuildingId } from '../game/unit-building-bonuses';
import { buildingUpkeep, buildingResourceUpkeep, addResourceCosts, unitResourceUpkeep } from '../game/economy-upkeep';
import {
  type TradeRoute,
} from '../game/trade-routes';
import { normalizeImprovementKey } from '../game/terrain-improvements';
import type { Hex } from '../types/hex';
import { loadOrderParams, type OrderYieldMults } from '../game/order';
import {
  evaluateOrderFromBreakdown,
  porPctBand,
  POR_BAND_LABELS,
} from '../game/society-breakdown';
import {
  applyPostCaptureLawOverride,
  isPostCaptureLawActive,
  postCaptureLawBannerLabel,
} from '../game/post-capture-law';
import { stolicaEasyBonusActive } from '../game/society-inputs';
import { cultureHappiness, loadCultureParams, loadReligionParams, FALLBACK_RELIGION_PARAMS } from '../game/culture-religion';
import { resolveOwnCultureShare } from '../game/society-inputs';
import {
  buildOrderSectionHtml,
  orderTierUi,
  type OrderState,
} from './orderPanel';
import {
  cityYieldPerTurn,
  cityPopulationCap,
  sumBuildingHappinessFromBuiltIds,
  cityBuildingEntriesFromBuiltIds,
  mnoznikHandelPieniadzForCivByDifficulty,
  civEconomyYieldMultipliers,
  type CityYieldContext,
  type BuildingRecord,
} from '../game/economy';
import { UI_PARAMS } from './uiParams';
import type { EmpireFoodState, EmpireFoodTick } from '../game/empire-food';
// Formatowanie liczb do wyświetlenia (obcięcie śmieci zmiennoprzecinkowych) — Maciej 2026-07-26.
import { signedPl } from './formatPl';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Suwak podzialu Handlu (Skarbiec / Nauka / Spoleczenstwo). Suma = 100. */
export interface PodzialHandluSplit {
  procentPieniadz: number;
  procentNauka: number;
  procentLuksus: number;
}

/** Suwak podzialu Pracy (budynki vs pula imperium). */
export interface PodzialPracySplit {
  procentBudynki: number;
}

/** A unit garrisoned in the city (supplied by the engine via getUnitsAt). */
export interface GarrisonUnit {
  /** RuntimeUnit id — potrzebny do akcji „Odfortyfikuj" (onLeaveGarrison). */
  id: string;
  nazwa: string;
  category?: string;
  health?: number;
  maxHealth?: number;
  /**
   * C-GARN-Q1 rozszerzenie (Maciej 2026-07-26): czy ta jednostka jest UKRYTA
   * w garnizonie (Ufort., RuntimeUnit.inGarnizon===true) — tylko takie dostają
   * przycisk „Odfortyfikuj". Jednostki po prostu stojące na heksie miasta
   * (niewymagające fortyfikacji) są już sterowalne normalnie z mapy.
   */
  inGarnizon?: boolean;
}

/** Optional hooks the engine may supply so the view reflects real game state. */
export interface CityPanelConfig {
  data?: GameData;
  difficulty?: Difficulty;
  getCities?: () => City[];
  getEpoch?: (ownerId: number) => number;
  getUnlockedTechs?: (ownerId: number) => string[];
  getBuiltBuildingIds?: (cityId: string) => string[];
  /**
   * PYTANIE 83=B (Maciej 2026-07-25): dostęp do złota TERAZ dla tego ownera
   * (własna Kopalnia złota gdziekolwiek w imperium ALBO aktywny szlak handlowy
   * z posiadaczem złota) -- ta sama funkcja co silnik (main.ts
   * ownerHasZlotoAccessNow / OwnerZlotoAccessResolver w turn-economy.ts).
   * Brak hooka -> domyślnie `true` (stare zachowanie: bramka Mennicy patrzy
   * tylko na Waluta+budynek, jak przed wprowadzeniem 83/B).
   */
  getOwnerHasZlotoAccess?: (ownerId: number) => boolean;
  getProduction?: (cityId: string) => CityProduction | null;
  setProduction?: (cityId: string, prod: CityProduction) => void;
  getCityBuildingFlags?: (cityId: string) => Partial<CityYieldContext>;
  /** Units standing on the city hex -> real Garnizon panel. */
  getUnitsAt?: (q: number, r: number) => GarrisonUnit[];
  /**
   * C-GARN-Q1 rozszerzenie (Maciej 2026-07-26): wyprowadza JEDNĄ jednostkę
   * z ukrytego garnizonu (inGarnizon=false) — wraca do zwykłego, widocznego
   * stosu na heksie miasta; „Czuwaj"/„Rozwiąż" działają dalej bez zmian.
   */
  onLeaveGarrison?: (unitId: string) => void;
  /** Odfortyfikowuje wszystkie jednostki w garnizonie na heksie miasta. */
  onLeaveAllGarrison?: (q: number, r: number) => void;
  /** Player treasury (gold) -> enables the Wykup (rush-buy) button. */
  getTreasury?: (ownerId: number) => number;
  /**
   * Globalne zasoby imperium (jak HUD mapy) — pasek miasta: baza + dopisek „+X” z tego miasta.
   * Brak hooka → cityPanel sumuje plony miast gracza (prototyp 1 miasto).
   */
  getEmpireHud?: (ownerId: number) => EmpireHudSnap | null;
  /** Bilans pieniędzy tego miasta (przychody i koszty lokalne). */
  getCityMoneySnap?: (cityId: string) => CityMoneySnap | null;
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
    ownerCultureLabel?: string;
    ownCultureSharePct?: number;
    kulturaMix?: { label: string; pct: number; isOwner: boolean }[];
    cultureConverting?: boolean;
  } | null;
  /** B4-Q2=A — religia w sekcji z kulturą. */
  getReligionState?: (cityId: string) => {
    dominujaca: string;
    udzialPct: number;
    wplywSzczescie: number;
    /** Nowi wierni szerzeni z tego miasta / ostatnia tura (wyjście). */
    przyrostWiernych?: number;
    zrodla?: { nazwa: string; wartosc: number }[];
    stateReligion?: string | null;
    sklad?: { name: string; pct: number; count: number }[];
  } | null;
  /** PYTANIE-85 — centralny magazyn żywności imperium. */
  getEmpireFoodState?: (ownerId: number) => EmpireFoodState | null;
  /** Mnożnik wzrostu z Porządku (z poprzedniej tury — jak w silniku). */
  getGrowthMult?: (cityId: string) => number;
  /**
   * #17: mnożniki Praca/Pieniądz/Nauka/Kultura z Porządku (z poprzedniej tury —
   * jak w silniku, turn-economy.ts applyOrderYieldMults). Brak hooka → panel
   * pomija Porządek w Bilansie plonów (stary, zaniżony wynik).
   */
  getOrderYieldMults?: (cityId: string) => OrderYieldMults | null;
  /** EKONOMIA — snapshot rekrutów (Manpower) per miasto. */
  getManpowerSnapshot?: (cityId: string) => CityManpowerSnapshot | null;
  /** Suma rekrutów (Manpower) imperium — werb jednostki zużywa tę pulę. */
  getEmpireRekruciTotal?: (ownerId: number) => number;
  getEmpireFoodTick?: (ownerId: number) => EmpireFoodTick | null;
  /** PYTANIE-85 — gracz wybiera rację 1|2|3 w panelu miasta. */
  onCityRationChange?: (cityId: string, poziomRacji: PoziomRacji) => void;
  /** R-AUTO-RACJE-RAISE-Q5=A — przełącznik auto Wyżywienie per miasto (gracz). */
  onCityAutoWyzywienieChange?: (cityId: string, enabled: boolean) => void;
  /** R-AUTO-RACJE-RAISE-Q3=A — max bezpieczny poziom suwaka Wyżywienia. */
  getMaxSafePoziomRacji?: (cityId: string) => number;
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
  /** Auto-budowa — tryb + kolejność typów / lista. */
  getBudowaState?: (cityId: string) => {
    tryb: BudowaTryb;
    priorytetTypow: BudowaFocus[];
    lista: string[];
    biblioteka?: BudowaListaBiblioteka;
  } | null;
  onBudowaPriorytetChange?: (cityId: string, priorytetTypow: BudowaFocus[], tryb: BudowaTryb) => void;
  onBudowaEnterManual?: (cityId: string) => void;
  onBudowaListaChange?: (cityId: string, lista: string[], tryb: 'lista') => void;
  onBudowaListaCreateTemplate?: (cityId: string, nazwa: string) => void;
  onBudowaListaLoadTemplate?: (cityId: string, templateId: string) => void;
  onBudowaListaRenameTemplate?: (templateId: string, nazwa: string) => void;
  onBudowaListaDeleteTemplate?: (templateId: string) => void;
  /** R-AUTO-V2-Q1=B: wgraj bieżącą listę + tryb Lista do wszystkich miast gracza. */
  onBudowaListaLoadAllCities?: (cityId: string, lista: string[]) => void;
  onArtView?: (cityId: string) => void;
  /**
   * Surowce w zasięgu: aktywny dostęp (legacy string[]) lub split ABC-19 { potential, active }.
   * Temat #4 (Handel E3b): opcjonalny `tradeSources` — mapa etykieta -> opis źródła
   * (np. "szlak handlowy z Rzym"), gdy dostęp do tej etykiety pochodzi (częściowo lub
   * całkowicie) z aktywnej trasy handlowej, nie z własnej infrastruktury.
   * DYSPOZYCJA 85 (Maciej 2026-07-26): `tradeSources` zostaje w kształcie danych (main.ts
   * nadal je liczy), ale panel miasta (cityPanel.ts normalizeResourceAccess) już go NIE
   * czyta/wyświetla -- to info o handlu międzynarodowym, przeniesione do panelu Handel
   * (empireDetailPanel.ts, sekcja "Surowce z wymiany handlowej").
   */
  getResourceAccess?: (cityId: string) => string[] | {
    potential: string[];
    active: string[];
    tradeSources?: Record<string, string>;
  };
  /** Union aktywnych etykiet surowców imperium (bramki epok B-SUROW-BUD). */
  getEmpireResourceAccess?: (ownerId: number) => string[];
  /** Union id budynków imperium (bramka cegła/ceramika). */
  getEmpireBuiltIds?: (ownerId: number) => string[];
  /** Zapas surowców puli państwa ownera (bramka surowcowa spełniona też zapasem — Maciej 2026-07-24). */
  getEmpireStock?: (ownerId: number) => Record<string, number>;
  /** TEMAT 8 Q2 (2026-07-24): czy TO miasto ma wybrzeże LUB rzekę w zasięgu — bramka Portu. */
  getCityHasCoastOrRiver?: (cityId: string) => boolean;
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
  /** Biezacy podzial Handlu per miasto (efektywny — global lub override). */
  getPodzialHandlu?: (cityId: string) => PodzialHandluSplit | null;
  /** Domyślny podział imperium (DYSPOZYCJA-85-SUWAK). */
  getOwnerDefaultPodzialHandlu?: (ownerId: number) => PodzialHandluSplit | null;
  /** Biezacy podzial Pracy per miasto (opcjonalnie). */
  getPodzialPracy?: (cityId: string) => PodzialPracySplit | null;
  /** Gracz zmienil suwaki Handlu — silnik zapisuje na City i przelicza plony. */
  onPodzialHandluChange?: (cityId: string, split: PodzialHandluSplit) => void;
  /** Gracz zmienil suwak Pracy (opcjonalnie). */
  onPodzialPracyChange?: (cityId: string, split: PodzialPracySplit) => void;
  /** Kup jednostke za Pieniadz ze skarbca (purchasableUnits). */
  onPurchaseUnit?: (cityId: string, itemId: string, koszt: number) => void;
  /** B11-A: anulowanie opłaconej pozycji w kolejce rekrutacji — pełny zwrot kosztu. */
  onCancelRecruitment?: (cityId: string, itemId: string, koszt: number) => void;
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
  /** Kopalnia na złożu żelaza gdziekolwiek w imperium gracza (bramka żelaza, dec. 2026-07-19) —
   *  całe imperium, nie per-miasto (jak Popalnia brązu). */
  getHasKopalniaNaZlozuZelaza?: () => boolean;
  /** Nazwy jednostek ("Jednostka") aktualnie żywych tego ownera -- limit 1 żywej
   *  Super-jednostka=TAK na cywilizację (audyt #11, decyzja A3=A). */
  getAliveUnitTypeNames?: (ownerId: number) => ReadonlySet<string>;
  /** Mnoznik kosztow budynkow z kreatora (globalny dla rozgrywki). */
  getBuildingCostPace?: () => import('../game/building-cost-tempo').BuildingCostPace;
  /** Mnoznik kosztow rekrutacji jednostek z kreatora (globalny dla rozgrywki). */
  getKosztJednostekPace?: () => import('../game/unit-cost-tempo').KosztJednostekPace;
  /** Mnoznik progu wzrostu ludnosci z kreatora (globalny dla rozgrywki). */
  getWzrostLudnosciPace?: () => import('../game/population-growth-tempo').WzrostLudnosciPace;
  /** Poziom trudnosci rozgrywki — asymetria kosztow budynkow/jednostek/badan. */
  getDifficulty?: () => import('../game/difficulty-cost').GameDifficulty;
  /** E7 — trasy handlowe aktywne w tej chwili (odswiezane co ture przez refreshTradeRoutes). */
  getTradeRoutes?: () => readonly TradeRoute[];
  /** E7 — etykieta cywilizacji wlasciciela (jak w panelu dyplomacji) — do „czyje to miasto". */
  getOwnerLabel?: (ownerId: number) => string;
  /**
   * C-HANDEL-UMOWA=B (2026-07-23) — etykiety obcych cywilizacji, z którymi TO miasto
   * geometrycznie MOGŁOBY mieć szlak (połączenie możliwe, bez wojny), ale brakuje
   * Umowy Handlowej — jedyny brakujący warunek jest traktat. Panel „Szlaki handlowe"
   * pokazuje to jako podpowiedź zamiast ogólnego „brak połączenia".
   */
  getTradeTreatyMissingPartners?: (cityId: string) => string[];
  /**
   * Follow-up „przenieś stolicę" (2026-07-21) — id aktualnie wyznaczonej stolicy
   * danego ownera (silnik już robi fallback na najstarsze miasto, jeśli gracz/AI
   * nigdy nic nie przenosił — patrz main.ts capitalCityIdForOwner).
   */
  getCapitalCityId?: (ownerId: number) => string | null;
  /**
   * Przenieś stolicę gracza na to miasto — silnik waliduje (miasto gracza, nie już
   * stolica, obecna stolica NIE oblegana) i wykonuje transfer; za darmo (Q1=A).
   */
  onSetCapital?: (cityId: string) => void;
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

/** Przesuń pozycję kolejki rekrutacji w górę/dół. */
function moveRecruitQueueItem(prod: CityProduction, index: number, dir: -1 | 1): CityProduction {
  const rq = prod.rekrutacja ?? [];
  const j = index + dir;
  if (index < 0 || j < 0 || index >= rq.length || j >= rq.length) {
    return copyCityProduction(prod);
  }
  const next = [...rq];
  const a = next[index] as ProductionItem;
  next[index] = next[j] as ProductionItem;
  next[j] = a;
  return {
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: next.length ? next : undefined,
  };
}

/** Przenieś pozycję kolejki rekrutacji na inny indeks. */
function reorderRecruitQueueItem(prod: CityProduction, fromIndex: number, toIndex: number): CityProduction {
  const rq = prod.rekrutacja ?? [];
  const len = rq.length;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= len || toIndex >= len || fromIndex === toIndex) {
    return copyCityProduction(prod);
  }
  const next = [...rq];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return copyCityProduction(prod);
  next.splice(toIndex, 0, moved);
  return {
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: next.length ? next : undefined,
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

function bindRecruitQueueDragReorder(sc: HTMLElement, city: City): void {
  let dragFromIndex: number | null = null;

  const clearDropMarks = (): void => {
    sc.querySelectorAll('.qitem.is-drop-target').forEach(node => node.classList.remove('is-drop-target'));
    sc.querySelectorAll('.qitem.is-dragging').forEach(node => node.classList.remove('is-dragging'));
  };

  sc.querySelectorAll<HTMLElement>('.qitem[data-recruit-idx]').forEach(row => {
    row.setAttribute('draggable', 'true');

    row.addEventListener('dragstart', (e) => {
      if ((e.target as HTMLElement).closest('button')) {
        e.preventDefault();
        return;
      }
      const idx = Number(row.dataset.recruitIdx);
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
    const row = (e.target as HTMLElement).closest<HTMLElement>('.qitem[data-recruit-idx]');
    clearDropMarks();
    if (row) row.classList.add('is-drop-target');
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  });

  sc.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragFromIndex === null) return;
    const row = (e.target as HTMLElement).closest<HTMLElement>('.qitem[data-recruit-idx]');
    if (!row) {
      clearDropMarks();
      return;
    }
    const toIndex = Number(row.dataset.recruitIdx);
    if (!Number.isFinite(toIndex) || toIndex === dragFromIndex) {
      clearDropMarks();
      return;
    }
    setProd(city.id, reorderRecruitQueueItem(getProd(city.id), dragFromIndex, toIndex));
    dragFromIndex = null;
    clearDropMarks();
    rerender();
  });
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
function signed(n: number): string { return signedPl(n); }
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

/** Etykieta ETA budowy — null → „brak Pracy”. */
function formatBuildEtaLabel(turns: number | null, prefix = '~'): string {
  if (turns === null) return 'brak Pracy';
  return `${prefix}${turns} ${tury(turns)}`;
}

/**
 * Kumulatywny ETA pozycji kolejki (indeks ≥ 1): kiedy budynek będzie gotowy,
 * licząc od bieżącej tury przy stałym dopływie Pracy do budynków.
 * Gdy produkcja wstrzymana — null (nie da się oszacować kolejki).
 */
function queueItemCumulativeEta(
  prod: CityProduction,
  queueIndex: number,
  pracaPerTurn: number,
): number | null {
  if (!(pracaPerTurn > 0) || queueIndex < 1) return null;
  if (prod.wstrzymana === true) return null;
  const front = frontItem(prod);
  let sum = 0;
  if (front) {
    const rem = etaTurns(front.koszt, prod.postep, pracaPerTurn);
    if (rem === null) return null;
    sum += rem;
  }
  for (let i = 1; i < queueIndex; i++) {
    const it = prod.kolejka[i] as ProductionItem;
    sum += Math.max(1, Math.ceil(it.koszt / pracaPerTurn));
  }
  const cur = prod.kolejka[queueIndex] as ProductionItem;
  sum += Math.max(1, Math.ceil(cur.koszt / pracaPerTurn));
  return sum;
}

/** ETA samego budynku w kolejce (bez oczekiwania na poprzednie). */
function queueItemOwnEta(koszt: number, pracaPerTurn: number): number | null {
  return etaTurns(koszt, 0, pracaPerTurn);
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

/**
 * Domyslny podzial Daniny netto nowego miasta — MUSI byc zgodny z
 * DEFAULT_PODZIAL_HANDLU w game/cities.ts oraz z econ-params.json.
 * 20% Nauka / 60% Skarbiec / 20% Zamoznosc (decyzja Maciej 2026-07-25, PYTANIE 74 = A;
 * dawniej 20/70/10).
 */
const DEFAULT_PODZIAL_HANDLU: PodzialHandluSplit = {
  procentPieniadz: 60,
  procentNauka: 20,
  procentLuksus: 20,
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
  const ownerDefault = readOwnerDefaultPodzialHandlu(city, data);
  return resolveCityPodzialHandlu(city, ownerDefault);
}

function readOwnerDefaultPodzialHandlu(city: City, data: GameData | null): PodzialHandluSplit {
  const fromHook = cfg.getOwnerDefaultPodzialHandlu?.(city.ownerId);
  if (fromHook) return normalizePodzialHandlu(fromHook);
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

// ---------------------------------------------------------------------------
// Yield computation (mirrors turn-economy.advanceCityEconomy per city)
// ---------------------------------------------------------------------------

interface CityView {
  praca: number; pieniadz: number; nauka: number; kultura: number;
  /** PYTANIE-85: bilans lokalny = produkcja − racje (wyświetlany jako żywność netto). */
  zywnoscNetto: number;
  /** Produkcja brutto żywności (pola + budynki, przed racjami). */
  zywnoscBrutto: number;
  kosztRacji: number;
  bilansLokalny: number;
  poziomRacji: PoziomRacji;
  wzrostProcent: number;
  growthBreakdown: GrowthPercentBreakdown;
  wzrostUlamkowy: number;
  maSpichlerz: boolean; maAkwedukt: boolean;
  /** Max ludność bez Akweduktu (parametr gry). */
  popCapBezAkweduktu: number;
  /** Max ludność z Akweduktem (parametr gry, normal=15). */
  popCapZAkweduktem: number;
  /** Aktualny cap dla tego miasta. */
  popCapAktualny: number;
  /** Wzrost zablokowany — ludność ≥ aktualny cap. */
  atPopCap: boolean;
}

/** Snapshot imperium do paska zasobów w widoku miasta (spójny z HudState). */
export interface EmpireHudSnap {
  /** Pula Pracy imperium (zapas — załóż miasto, ulepszenia / projekty mapy). */
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
  /** Rozbicie skarbca imperium (jak HUD — bilans netto / turę). */
  bogactwoWplywyBrutto?: number;
  bogactwoHandel?: number;
  bogactwoUtrzymanieBudynkow?: number;
  bogactwoUtrzymanieSurowcowBudynkow?: Record<string, number>;
  bogactwoUtrzymanieJednostek?: number;
  bogactwoRate?: number;
}

/** Bilans pieniędzy jednego miasta — tylko przychody/koszty tego grodu. */
export interface CityMoneySnap {
  /** Wpływ do skarbca imperium z tego miasta / turę. */
  doSkarbca: number;
  /** Pieniądz brutto (pola + budynki) przed mnożnikiem zamożności. */
  pieniadzBrutto: number;
  /** Mnożnik zamożności W tej tury. */
  wealthMnoznik: number;
  /** Dochód ze szlaków handlowych (doliczany do skarbca). */
  handelZeSzlakow: number;
  /** Utrzymanie budynków w tym mieście / turę. */
  utrzymanieBudynkow: number;
  /** Utrzymanie surowców budynków w tym mieście / turę (magazyn państwa). */
  utrzymanieSurowcowBudynkow?: Record<string, number>;
  /** Utrzymanie jednostek na heksie miasta (garnizon) / turę. */
  utrzymanieGarnizonu: number;
  /** Nauka / turę z tego miasta (informacyjnie). */
  nauka: number;
}
function isCapital(city: City): boolean {
  const all = cfg.getCities?.();
  if (!all || all.length === 0) return true;
  const first = all.find(c => c.ownerId === city.ownerId);
  return first ? first.id === city.id : true;
}
function territoryNodesForPanel() {
  const all = cfg.getCities?.();
  return all ? buildTerritoryNodesFromCities(all) : undefined;
}

function computeView(city: City, map: GameMap, data: GameData): CityView | null {
  try {
    const params = buildEconParams(data, cfg.difficulty ?? 'normal');
    const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
    const maSpichlerz = built.includes('spichlerz');
    const maAkwedukt = built.includes('akwedukt');
    const worked = cityWorkedTilesForEconomy(city, map, territoryNodesForPanel());
    const healthBd = computeCityHealthBreakdown(
      city.population,
      worked,
      built,
      data.societyParams,
      cfg.difficulty ?? 'normal',
      { city, map },
    );
    const zdrowie = healthBd.total;
    const ownerDefaultPodzial = readOwnerDefaultPodzialHandlu(city, data);
    const econCity = toEconomyCity(
      city, params, isCapital(city), zdrowie,
      { maSpichlerz, maAkwedukt },
      ownerDefaultPodzial,
    );
    // #17 fix: base ctx miał flagi budynków/Waluty/bonusów cyw. na sztywno false/1/undefined,
    // więc Bilans plonów pomijał Młyn/Cegielnię/Targowisko/Bibliotekę/Mennicę, Walutę i bonusy
    // cyw. — panel pokazywał inne liczby niż silnik (turn-economy.ts tickCityEconomy). Odtwarzamy
    // tu dokładnie tę samą budowę kontekstu co silnik, z tych samych hooków co reszta panelu
    // (getBuiltBuildingIds/getUnlockedTechs/getCivKey/getCivBonusy używane już np. w buildHandelDetailCard).
    const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
    const walutaOdkryta = techs.includes('Waluta') || techs.includes('waluta');
    // Pytanie 71/C (Maciej 2026-07-25): Mennica stoi wyłącznie w stolicy (pytanie
    // 70/B) -> bramka Efektu 1 patrzy na CAŁE imperium, nie tylko to miasto.
    // PYTANIE 83=B: budynek "stoi" nawet bez złota (nie burzymy go), ale EFEKT
    // (mnożnik) śpi bez aktualnego dostępu do złota -- dokładnie
    // maMennicaEmpireWide z turn-economy.ts (maMennicaBuiltEmpireWide &&
    // resolveOwnerZlotoAccess). ctx.maMennica poniżej idzie właśnie do
    // cityYieldPerTurn tak samo jak silnik, więc musi być tym samym warunkiem.
    const maMennica = ownerHasMennica(city.ownerId) && (cfg.getOwnerHasZlotoAccess?.(city.ownerId) ?? true);
    const civKey = cfg.getCivKey?.(city.ownerId);
    // Efekt 1 SCALONY (2026-07-25) + pytanie 69 (2026-07-25): mnoznik cywilizacyjny
    // (civs.json mnoznikHandelPieniadz) SKALOWANY TRUDNOSCIA (+0,5 easy / -0,5 hard).
    // ZASTĘPUJE dawna plaska regule "2/1.5/1 dla wszystkich" -- ta zostaje TYLKO
    // jako fallbackScaled (params.mennicaMnoznikPoWalucie, juz per-trudnosc) dla
    // cywilizacji bez wpisu w civs.json. Musi być IDENTYCZNE ze silnikiem tury
    // (resolveWalutaMnoznikOverride w turn-economy.ts) — inaczej panel znów
    // rozjeżdża się z realnym dochodem (rozjazd wykryty i naprawiony 2026-07-25).
    // bramka maMennica&&walutaOdkryta w cityYieldPerTurn i tak decyduje CZY ten
    // mnoznik w ogole zadziala, wiec ustawienie go tutaj nie omija Mennicy.
    const walutaMnoznikOverride = walutaOdkryta && civKey
      ? mnoznikHandelPieniadzForCivByDifficulty(civKey, cfg.data?.civs, cfg.difficulty ?? 'normal', params.mennicaMnoznikPoWalucie)
      : undefined;
    const { handel: civHandelMult, nauka: civNaukaMult } =
      civEconomyYieldMultipliers(cfg.getCivBonusy?.(city.ownerId) ?? []);
    const base: CityYieldContext = {
      wojskoZuzycieZywnosci: 0, strataFraction: 0,
      maMlyn: built.includes('mlyn'),
      maCegielnia: built.includes('cegielnia'),
      maTargowisko: built.includes('targowisko'),
      maBiblioteka: built.includes('biblioteka'),
      maAkademia: built.includes('akademia'),
      // Efekt 1 SCALONY: maMennica jest jednym z dwoch warunkow bramki w
      // cityYieldPerTurn (razem z walutaOdkryta) -- osobne pole `mennicaMnoznik`
      // (mnoznik TYLKO na strumien Pieniadza) zostalo usuniete 2026-07-25.
      maMennica,
      walutaOdkryta,
      walutaMnoznikOverride,
      civHandelMult,
      civNaukaMult,
      // Zadanie 2 (2026-07-23): Garncarnia +Zywnosc% LOKALNIE -- liczba sztuk w TYM miescie.
      liczbaGarncarni: built.filter(id => id === 'garncarnia').length,
    };
    const ctx: CityYieldContext = { ...base, ...(cfg.getCityBuildingFlags?.(city.id) ?? {}) };
    // Naprawa 2026-07-25: plony budynkow (Praca/Pieniadz/Zywnosc/Nauka/Kultura) -- ta sama
    // funkcja co silnik (turn-economy.ts), zeby "Bilans plonow" nie pokazywal 0 z budynkow.
    const era = cfg.getEpoch?.(city.ownerId) ?? 1;
    const cityBuildings = cityBuildingEntriesFromBuiltIds(built, data.buildings as unknown as BuildingRecord[], era, techs);
    const y = cityYieldPerTurn(econCity, worked, cityBuildings, params, ctx);
    // Porządek (B2-Q6): silnik mnoży plony PO cityYieldPerTurn, PRZED Wealth/splitPraca
    // (turn-economy.ts applyOrderYieldMults) — panel musi odtworzyć to samo, inaczej
    // Bilans plonów rozjeżdża się z silnikiem gdy miasto ma karę/bonus Porządku.
    const orderMult = cfg.getOrderYieldMults?.(city.id);
    if (orderMult) {
      if (orderMult.productionMult !== 1) y.praca *= orderMult.productionMult;
      if (orderMult.pieniadzMult !== 1) y.pieniadz *= orderMult.pieniadzMult;
      if (orderMult.naukaMult !== 1) y.nauka *= orderMult.naukaMult;
      if (orderMult.kulturaMult !== 1) y.kultura *= orderMult.kulturaMult;
    }
    y.praca = cityPracaInteger(y.praca);
    const zywnoscBrutto = y.zywnosc;
    const rationParams = buildRationParams(data.econParams, cfg.difficulty ?? 'normal');
    const poziomRacji = getCityRationLevel(city);
    const allCities = cfg.getCities?.() ?? [];
    const spichlerzDrain = paySpichlerzDrainForCity(allCities, city.ownerId, built, true);
    const spichlerzState = resolveSpichlerzCityBonusState(built, spichlerzDrain);
    const kosztRacji = computeCityRationCost(city.population, poziomRacji, rationParams, spichlerzState);
    const bilansLokalny = zywnoscBrutto - kosztRacji;
    const { state: ordState } = resolveOrderState(city, data);
    const ws = city.wealthState ?? freshWealthState();
    const growthBreakdown = computeGrowthPercentV85({
      population: city.population,
      poziomRacji,
      zdrowie,
      szczescieNetto: ordState.szczescie ?? 0,
      wealthPoziom: ws.poziom ?? 0,
      spichlerzState,
      civKey: cfg.getCivKey?.(city.ownerId) ?? null,
      rationParams,
    });
    const popCapBezAkweduktu = params.akweduktProgLudnosci;
    const popCapZAkweduktem = params.akweduktMaxLudnosci;
    const popCapAktualny = cityPopulationCap(maAkwedukt, params);
    const atPopCap = city.population >= popCapAktualny;
    return {
      praca: y.praca, pieniadz: y.pieniadz, nauka: y.nauka, kultura: y.kultura,
      zywnoscNetto: bilansLokalny,
      zywnoscBrutto,
      kosztRacji,
      bilansLokalny,
      poziomRacji,
      wzrostProcent: growthBreakdown.total,
      growthBreakdown,
      wzrostUlamkowy: city.wzrostUlamkowy ?? 0,
      maSpichlerz, maAkwedukt,
      popCapBezAkweduktu,
      popCapZAkweduktem,
      popCapAktualny,
      atPopCap,
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

/**
 * Czy właściciel ma Mennicę zbudowaną GDZIEKOLWIEK w imperium (nie tylko w
 * tym mieście) -- Maciej 2026-07-25, pytanie 71/C: Mennica stoi wyłącznie w
 * stolicy (pytanie 70/B), więc bramka Efektu 1 (Waluta+Mennica) musi patrzeć
 * na całe imperium, inaczej żadne miasto poza stolicą nie dostałoby mnożnika.
 * Spójne z turn-economy.ts ownersWithMennica() (ten sam union, liczony po
 * stronie panelu zamiast silnika tury).
 */
function ownerHasMennica(ownerId: number): boolean {
  const cities = cfg.getCities?.() ?? [];
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    const ids = cfg.getBuiltBuildingIds?.(c.id) ?? [];
    if (ids.includes('mennica')) return true;
  }
  return false;
}

/**
 * Etykieta strumienia podatkowego miasta — zawsze "Podatek" (decyzja 2026-07-27).
 */
function daninaLabelForCity(_city: City): DaninaLabel {
  return daninaLabel();
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

/** Bilans żywności miasta (PYTANIE-85: produkcja − racje). */
function cityFoodSplit(view: CityView): { total: number; produkcja: number; racje: number } {
  const produkcja = Math.round(view.zywnoscBrutto);
  const racje = Math.round(view.kosztRacji);
  const total = Math.round(view.bilansLokalny);
  return { total, produkcja, racje };
}

function wyzwienieSummaryLabel(level: PoziomRacji, params: ReturnType<typeof buildRationParams>): string {
  const cost = rationFoodCostPerPop(level, params);
  const grow = rationGrowthPercent(level, params);
  const growTxt = grow > 0 ? `+${grow}` : String(grow);
  return `${cost} 🍞/miesz. · ${growTxt}%`;
}

function growthBreakdownRow(label: string, value: number, showZero = false): string {
  if (!showZero && value === 0) return '';
  const cls = value > 0 ? 'pos' : value < 0 ? 'neg' : 'muted';
  return `<div class="growth-bd-row ${cls}"><span>${label}</span><span>${signed(value)}%</span></div>`;
}

function fmtDecPl(n: number, digits = 2): string {
  return n.toFixed(digits).replace('.', ',');
}

function pluralTur(n: number): string {
  if (n === 1) return 'turę';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'tury';
  return 'tur';
}

/** SPICH-AUTO-Q1: fed z ticku imperium — bez fałszywego „nakarmione” przy deficycie Spichlerza. */
function resolveCityFedForUi(
  cityId: string,
  foodSplitTotal: number,
  tick?: EmpireFoodTick | null,
): boolean {
  const row = tick?.perCityRows?.find(r => r.cityId === cityId);
  if (row !== undefined) return row.nakarmione === true;
  if (tick) return false;
  return foodSplitTotal >= 0;
}

function effectiveGrowthPctForUi(wzrostProcent: number, fed: boolean): number {
  return fed ? wzrostProcent : 0;
}

/** Postęp wzrostu (sloty) i ETA kolejnego obywatela — szczegóły absolutne/tempo tylko w tooltipie. */
function buildGrowthProgressUi(
  population: number,
  view: CityView,
  epoch: number,
  fed: boolean,
  atPopCap: boolean,
  growthPctOverride?: number,
): { progressHtml: string; etaHtml: string } {
  const frac = view.wzrostUlamkowy;
  const growthPct = growthPctOverride ?? view.wzrostProcent;
  const gainSlots = growthGainPerTurnSlots(population, growthPct, fed, atPopCap);

  const progressHtml =
    `<div class="growth-progress-main">Wzrost ludności: <strong>${fmtDecPl(frac)}</strong> / 1 obywatela</div>`;

  let etaHtml = '';
  if (atPopCap) {
    etaHtml = '<div class="growth-eta warn">Limit ludności — brak kolejnego obywatela.</div>';
  } else if (!fed) {
    etaHtml = '<div class="growth-eta warn">Brak wzrostu — miasto nie jest w pełni nakarmione ze Spichlerza.</div>';
  } else if (growthPct <= 0) {
    etaHtml = '<div class="growth-eta muted">WZROST% = 0 — brak kolejnego obywatela.</div>';
  } else {
    const turns = turnsUntilNextCitizen(frac, gainSlots);
    if (turns === 0) {
      etaHtml = '<div class="growth-eta ok">Kolejny obywatel w tej turze (bufor ≥ 1).</div>';
    } else if (turns != null) {
      etaHtml = `<div class="growth-eta ok">Kolejny obywatel za <strong>≈ ${turns}</strong> ${pluralTur(turns)}.</div>`;
    }
  }

  return { progressHtml, etaHtml };
}

/** Tooltip wzrostu — skala absolutna, tempo/turę, bufor (poza głównym widokiem). */
function buildGrowthProgressTooltipCard(
  population: number,
  view: CityView,
  epoch: number,
  fed: boolean,
  atPopCap: boolean,
  growthPctOverride?: number,
): HTMLDivElement {
  const frac = view.wzrostUlamkowy;
  const osobNaObywatela = cityLudnoscAbsolutna(1, epoch);
  const growthPct = growthPctOverride ?? view.wzrostProcent;
  const gainSlots = growthGainPerTurnSlots(population, growthPct, fed, atPopCap);
  const fracPeople = Math.round(frac * osobNaObywatela);
  const gainPeople = Math.round(gainSlots * osobNaObywatela);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Wzrost ludności — szczegóły</span>'));
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Postęp (sloty)', `${fmtDecPl(frac)} / 1 obywatela`);
  gridDetailRow(
    g,
    'Skala absolutna',
    `≈ ${formatManpower(fracPeople)} / ${formatManpower(osobNaObywatela)} os.`,
  );
  if (gainSlots > 0) {
    gridDetailRow(
      g,
      'Tempo',
      `+${fmtDecPl(gainSlots)} obywatela/t (≈ +${formatManpower(gainPeople)}/t)`,
    );
  }
  const note = el('div', 'dc-note');
  note.textContent = fed
    ? 'Ułamek poniżej 1 zostaje w buforze (wzrostUlamkowy) i sumuje się co turę — tylko gdy miasto jest nakarmione.'
    : 'Brak wzrostu przy głodzie — bufor nie rośnie, dopóki bilans nie zostanie pokryty z magazynu centralnego.';
  card.appendChild(note);
  return card;
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

/** Górny pasek: pula pracy + dwa dopiski (budynki / pula imperium). */
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
    `<span class="civ-v-res-delta blue" title="Pula imperium">${u.html}</span>` +
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

const STYLE_ID = 'civ-city-screen-css-w3-hudfix';

/** Rozmiar samej ikonki (emoji/SVG) na pasku zakładek — w em względem font-size mountu. */
const CITY_PANEL_ICON_GLYPH_EM = 4.5;
/** Pionowy słupek zakładek — ~50% rozmiaru bazowego. */
const CITY_PANEL_ICON_RAIL_VERT_EM = CITY_PANEL_ICON_GLYPH_EM * 0.5;
/** Ile wierszy list (budynki, jednostki) widocznych bez przewijania — reszta w scrollu. */
const LIST_SCROLL_VISIBLE = 3;
/** Kompaktowy wiersz katalogu budowy (ikona + nazwa + Buduj). */
const LIST_ROW_HEIGHT_COMPACT = 2.35;
/** Kolejka rekrutacji w panelu Produkcja — max widocznych wierszy (reszta scroll). */
const RECRUIT_QUEUE_VISIBLE = 5;
/** Kolejka budowy (pozycje po bieżącym projekcie) — max widocznych wierszy. */
const BUILD_QUEUE_VISIBLE = 4;
/** Wysokość jednego wiersza kolejki rekrutacji/budowy (em). */
const QUEUE_ROW_EM = 2.75;
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
    ` · ${pctU}% ${cityPanelChipIconWrap('chip-crate', 14)}${uPart}`
  );
}

function psiRowLabel(iconId: string, text: string, title?: string): string {
  const t = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
  return `${cityPanelChipIconWrap(iconId, 16)}<span${t}>${text}</span>`;
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

function setOkolicaProfileButtonIconOnly(btn: HTMLButtonElement, iconId: string, size: BrandIconSize = 20): void {
  btn.classList.add('okolica-profile-btn', 'okolica-profile-btn-ic-only');
  const ic = okolicaProfileIconHtml(iconId, size);
  btn.innerHTML = ic ? `<span class="okolica-profile-glyph">${ic}</span>` : '?';
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
.civ-cs .city-money-grid{display:flex;flex-direction:column;gap:0.22em;font-size:0.72em;}
.civ-cs .city-money-row{display:flex;justify-content:space-between;gap:0.5em;padding:0.18em 0;border-bottom:1px solid rgba(255,255,255,0.04);}
.civ-cs .city-money-lbl{color:#8a8070;flex:1;}
.civ-cs .city-money-val{font-weight:600;white-space:nowrap;}
.civ-cs .city-money-val.green{color:#78c95a;}
.civ-cs .city-money-val.red{color:#e07070;}
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
.civ-cs .btn-b.can-build{background:linear-gradient(180deg,#3a7cc8,#2560a8);border-color:#5aa0e8;color:#f0f8ff;font-weight:700;
  box-shadow:0 0 0 1px rgba(90,160,232,0.32);}
.civ-cs .btn-b.can-build:hover{background:linear-gradient(180deg,#4890d8,#3070b8);}
.civ-cs .btn-b.cannot-build{background:linear-gradient(180deg,#2a3848,#1e2a38);border-color:#3d5068;color:#8a9cac;font-weight:600;
  opacity:1!important;cursor:not-allowed;}
.civ-cs .btn-b.cannot-build:disabled{opacity:1!important;}
.civ-cs .btn-g.can-build{background:linear-gradient(180deg,rgba(232,216,138,0.48),rgba(140,100,32,0.96));
  border-color:var(--civ-gold-border-strong);color:#fff8e8;opacity:1!important;}
.civ-cs .btn-g.cannot-build{background:linear-gradient(180deg,rgba(60,54,38,0.55),rgba(40,36,26,0.82));
  border-color:rgba(100,88,60,0.42);color:#8a8070;opacity:1!important;cursor:not-allowed;}
.civ-cs .btn-g.cannot-build:disabled{opacity:1!important;}
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
.civ-cs .bld-group{margin-bottom:0.22em;}
.civ-cs .bld-group>.bld,.civ-cs .bld-group>.bld-owned-row,.civ-cs .bld-group>.bld-group-empty-note{margin-left:0.15em;}
.civ-cs .bld-group-h{cursor:pointer;font-size:0.82em;font-weight:700;color:var(--fg);padding:0.16em 0.3em;
  background:var(--panel2);border:1px solid var(--border);border-radius:3px;margin-bottom:0.16em;user-select:none;}
.civ-cs .bld-group-h:hover{color:var(--gold);}
.civ-cs .bld-group-empty>.bld-group-h{color:var(--muted);font-weight:400;background:transparent;border-style:dashed;}
.civ-cs .bld-group-empty-note{font-size:0.72em;padding-left:0.5em;}
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
.civ-cs .wyzwienie-w4-sliders{margin:0.38em 0 0.12em;}
.civ-cs .wyzwienie-w4-sliders input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:5px;background:rgba(255,255,255,0.08);outline:none;}
.civ-cs .wyzwienie-w4-sliders input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#c8e8a8,#4a7a1f);border:1px solid #3a5a12;cursor:pointer;}
.civ-cs .wyzwienie-w4-sliders input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#c8e8a8,#4a7a1f);border:1px solid #3a5a12;cursor:pointer;}
.civ-cs .wyzwienie-w4-sliders .slider-row label{font-size:0.74em;margin-bottom:0.08em;}
.civ-cs .wyzwienie-w4-hint{font-size:0.62em;color:var(--muted);text-align:center;margin-top:0.2em;}
.civ-cs .food-bilans-row{display:flex;justify-content:space-between;align-items:center;gap:0.35em;font-size:0.76em;margin:0.28em 0 0.12em;padding:0.35em 0.45em;border:1px solid var(--border);border-radius:5px;background:rgba(255,255,255,.02);}
.civ-cs .food-bilans-row .pos{color:var(--green);}
.civ-cs .food-bilans-row .neg{color:var(--red);}
.civ-cs .growth-bd-block{margin-top:0.42em;padding-top:0.35em;border-top:1px solid rgba(232,216,138,.14);}
.civ-cs .growth-bd-hd{font-size:0.66em;letter-spacing:.12em;text-transform:uppercase;color:#a08030;margin-bottom:0.28em;}
.civ-cs .growth-bd-total{font-size:1.05em;font-weight:700;color:var(--gold);margin-bottom:0.22em;}
.civ-cs .growth-bd-row{display:flex;justify-content:space-between;gap:0.5em;font-size:0.74em;line-height:1.55;}
.civ-cs .growth-bd-row.pos{color:#7ad0a0;}
.civ-cs .growth-bd-row.neg{color:#e08a8a;}
.civ-cs .growth-bd-row.muted{color:var(--muted);}
.civ-cs .food-pop-hero{margin:0.1em 0 0.42em;padding:0.42em 0.5em;border-radius:9px;border:1px solid rgba(232,216,138,.22);background:rgba(232,216,138,.06);}
.civ-cs .food-pop-hero .pop-slots{font-size:1.12em;font-weight:700;color:var(--gold);line-height:1.35;}
.civ-cs .food-pop-hero .pop-abs{font-size:0.78em;color:var(--muted);margin-top:0.12em;}
.civ-cs .growth-progress-block{margin-top:0.22em;padding-top:0.2em;border-top:1px dashed rgba(232,216,138,.12);}
.civ-cs .growth-progress-block.hover-detail-anchor{cursor:help;}
.civ-cs .growth-progress-main{font-size:0.76em;color:var(--text);line-height:1.45;}
.civ-cs .growth-eta{font-size:0.74em;margin-top:0.2em;line-height:1.4;}
.civ-cs .growth-eta.ok{color:#7ad0a0;}
.civ-cs .growth-eta.warn{color:#e0a860;}
.civ-cs .growth-eta.muted{color:var(--muted);}
.civ-cs .praca-split-bar{display:flex;height:26px;background:rgba(255,255,255,0.08);border:1px solid rgba(232,216,138,0.18);border-radius:7px;overflow:hidden;position:relative;margin-bottom:0.38em;}
.civ-cs .praca-split-b{background:linear-gradient(90deg,#a08030,#e8d88a);display:flex;align-items:center;justify-content:center;font-size:0.72em;color:#2e2708;font-weight:700;}
.civ-cs .praca-split-u{background:linear-gradient(90deg,#3a6ad0,#5a9bd4);display:flex;align-items:center;justify-content:center;font-size:0.72em;color:#08121e;font-weight:700;}
.civ-cs .praca-w4-sliders{margin:0.38em 0 0.12em;}
.civ-cs .praca-w4-sliders .slider-row label{font-size:0.74em;margin-bottom:0.08em;}
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
.civ-cs .qitem-eta{font-size:0.72em;color:var(--blue,#6ab0e8);white-space:nowrap;flex-shrink:0;line-height:1.2;}
.civ-cs .qitem-eta.muted-eta{color:var(--muted,#8a8070);}
.civ-cs .qitem-cost{font-size:0.72em;color:var(--muted,#8a8070);white-space:nowrap;flex-shrink:0;display:inline-flex;align-items:center;gap:0.12em;line-height:1.2;}
.civ-cs .qitem .qitem-ic{width:1.05em;height:1.05em;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;}
.civ-cs .qitem .qitem-ic svg{width:1.05em;height:1.05em;display:block;}
.civ-cs .qitem .qitem-ic .unit-infographic-medallion{width:1.05em;height:1.05em;border:none;}
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
.civ-cs .okolica-info-link{font-size:0.72em;font-weight:600;text-decoration:underline dotted;text-underline-offset:2px;
  pointer-events:auto;cursor:pointer;position:relative;z-index:6;background:none;border:none;padding:0.18em 0.32em;margin:0;
  font-family:inherit;color:inherit;line-height:inherit;text-transform:inherit;letter-spacing:inherit;}
.civ-cs .okolica-info-link:hover,.civ-cs .okolica-info-link:focus-visible{color:var(--gold);}
.civ-cs .civ-w4-surowce-detail{pointer-events:auto;cursor:pointer;position:relative;z-index:6;background:none;border:none;padding:0.18em 0.32em;margin:0;
  font-family:inherit;color:inherit;line-height:inherit;text-transform:inherit;letter-spacing:inherit;}
.civ-cs .civ-w4-surowce-detail:hover,.civ-cs .civ-w4-surowce-detail:focus-visible{color:var(--gold);}
.civ-cs .ptitle .okolica-info-link,.civ-cs .ptitle .civ-w4-panel-detail{flex-shrink:0;pointer-events:auto;}
.civ-ux-right .ptitle,.civ-ux-left .ptitle{position:relative;z-index:3;isolation:isolate;}
.civ-ux-right .civ-w4-tab-body--scroll .ptitle{z-index:4;}
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
.civ-cs .wealth-compact-wrap{margin:0.06em 0 0.28em;padding:0.28em 0.34em;background:var(--panel2);border:1px solid var(--border);border-radius:6px;}
.civ-cs .wealth-compact-wrap.hover-detail-anchor{cursor:help;}
.civ-cs .wealth-compact-badges{display:flex;align-items:center;gap:0.28em;flex-wrap:wrap;margin-bottom:0.28em;}
.civ-cs .wealth-compact-stat{display:inline-flex;align-items:center;justify-content:center;gap:0.12em;
  min-width:2.1em;padding:0.18em 0.38em;border:1px solid rgba(232,216,138,0.22);border-radius:5px;
  font-size:0.78em;line-height:1;cursor:help;flex:0 0 auto;background:rgba(0,0,0,0.14);}
.civ-cs .wealth-compact-stat b{font-weight:700;font-size:1em;}
.civ-cs .wealth-compact-stat.wealth-w b{color:var(--gold);}
.civ-cs .wealth-compact-stat.wealth-mnoz b{color:#8ec8f0;}
.civ-cs .wealth-compact-stat.wealth-happy{padding:0.18em 0.32em;}
.civ-cs .wealth-compact-bar{width:100%;height:1.15em;margin:0;}
.civ-cs .wealth-compact-bar .fbtxt{font-size:0.82em;padding:0 0.25em;}
.civ-cs .wealth-compact-eta{font-size:0.66em;color:var(--muted);margin-top:0.22em;line-height:1.35;}
.civ-cs .wealth-compact-eta.ok{color:#7ad0a0;}
.civ-cs .wealth-compact-eta.warn{color:#e0a860;}
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
  z-index:auto!important;width:100%;height:auto;min-height:0;
  background:transparent;color:var(--text);font-family:var(--civ-font-ui);}
.civ-ux-left .civ-ux-panel-scope.civ-cs,
.civ-ux-right .civ-ux-panel-scope.civ-cs,
.civ-ux-left-icon-rail .civ-ux-panel-scope.civ-cs,
.civ-ux-right-icon-rail .civ-ux-panel-scope.civ-cs,
.civ-ux-map-chrome .civ-ux-panel-scope.civ-cs{pointer-events:auto!important;}
.civ-ux-top .civ-ux-panel-scope.civ-cs{pointer-events:none;}
.civ-ux-right,.civ-ux-left,.civ-v-right-main,.civ-v-left-main,.civ-w4-tab-card,.civ-w4-tab-body{pointer-events:auto;}
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
.civ-v-top-stack{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:fit-content;max-width:min(98vw,1280px);gap:0.22rem;padding:0;box-sizing:border-box;margin:0 auto;}
.civ-v-top-flank-row{display:flex;align-items:flex-start;justify-content:center;gap:0.5rem 0.65rem;flex-wrap:nowrap;width:100%;overflow:visible;}
.civ-v-w3-chips-flank{display:flex;align-items:center;justify-content:center;flex-wrap:nowrap;gap:0.32rem 0.48rem;
  padding:0.38rem 0.82rem;border-radius:12px;
  background:linear-gradient(180deg,rgba(22,28,40,0.94),rgba(8,10,16,0.95));border:1px solid rgba(232,216,138,0.32);
  flex:0 0 auto;min-width:0;overflow:visible;}
.civ-v-w3-chips-flank.civ-v-w3-chips-left{justify-content:flex-end;}
.civ-v-w3-chips-flank.civ-v-w3-chips-right{justify-content:flex-start;}
.civ-v-top-line{display:flex;align-items:center;justify-content:center;gap:0.65rem;flex-wrap:wrap;width:100%;}
.civ-v-exit-bottom-row{display:flex;flex-direction:column;align-items:center;gap:0.15em;pointer-events:auto;flex-shrink:0;margin-bottom:0.12em;}
.civ-v-exit-bottom-row .civ-v-exit-map-btn{font-size:0.76em;padding:0.38em 0.9em 0.38em 0.72em;}
.civ-v-exit-bottom-row .civ-v-exit-foot-hint{font-size:0.58em;color:#8b97a8;text-align:center;white-space:nowrap;}
.civ-v-w3-bar-spacer{display:none;}
.civ-v-w3-chips-city{margin-left:0;flex:0 0 auto;width:fit-content;max-width:100%;min-width:0;}
.civ-v-w3-city-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0.12rem;
  flex-shrink:0;min-width:0;max-width:100%;width:fit-content;}
.civ-v-w3-city-badge{display:inline-flex;align-items:center;gap:0.55rem;padding:0.45rem 1.05rem 0.45rem 0.75rem;
  border-radius:24px;background:linear-gradient(180deg,#151b26,#0a0d14);border:1.5px solid #e8d88a;
  box-shadow:0 5px 16px rgba(0,0,0,0.6);flex-shrink:0;max-width:100%;}
.civ-v-w3-city-nav{display:inline-flex;align-items:center;justify-content:center;min-width:1.75em;min-height:1.75em;
  padding:0 0.22em;border:none;border-radius:7px;background:rgba(232,216,138,0.08);color:#e8d88a;
  font-size:1.15em;font-weight:700;line-height:1;cursor:pointer;opacity:0.92;font-family:inherit;
  flex-shrink:0;pointer-events:auto;}
.civ-v-w3-city-nav:hover:not(:disabled){opacity:1;color:#fff8e0;background:rgba(232,216,138,0.18);}
.civ-v-w3-city-nav:disabled{opacity:0.25;cursor:default;background:transparent;}
.civ-v-w3-city-name{font-family:var(--civ-font-title, Georgia, serif);font-size:1.35em;font-weight:700;
  color:#f0e6d0;letter-spacing:0.04em;text-transform:uppercase;line-height:1;}
.civ-v-w3-city-pop{width:1.65em;height:1.65em;border-radius:50%;background:#e8d88a;color:#2a2208;
  font-size:0.72em;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.civ-v-w3-capital-badge{font-size:0.68em;font-weight:700;color:#2a2208;background:#e8d88a;
  border-radius:10px;padding:0.2em 0.6em;white-space:nowrap;flex-shrink:0;letter-spacing:0.02em;}
.civ-v-w3-capital-btn{font-size:0.62em;font-family:inherit;font-weight:600;color:#e8d88a;
  background:transparent;border:1px solid #e8d88a;border-radius:10px;padding:0.22em 0.6em;
  white-space:nowrap;flex-shrink:0;cursor:pointer;opacity:0.9;}
.civ-v-w3-capital-btn:hover:not(:disabled){opacity:1;background:rgba(232,216,138,0.14);}
.civ-v-w3-capital-btn:disabled{opacity:0.35;cursor:not-allowed;}
.civ-v-w3-chips{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:0.35rem 0.55rem;
  padding:0.3rem 0.85rem;border-radius:12px;
  background:linear-gradient(180deg,rgba(22,28,40,0.94),rgba(8,10,16,0.95));border:1px solid rgba(232,216,138,0.32);
  flex:1 1 auto;width:100%;max-width:100%;min-width:0;overflow-x:visible;overflow-y:visible;}
.civ-v-w3-chips-stacked{flex-direction:column;align-items:stretch;flex-wrap:nowrap;gap:0.22rem;
  padding:0.34rem 0.9rem 0.38rem;}
.civ-v-w3-chips-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:0.7rem;
  align-items:center;justify-items:center;width:100%;}
.civ-v-w3-chips-row + .civ-v-w3-chips-row{padding-top:0.24rem;border-top:1px solid rgba(232,216,138,0.18);}
.civ-v-w3-chips-stacked .civ-v-w3-chip{justify-content:center;width:100%;max-width:100%;min-width:0;
  flex-wrap:wrap;row-gap:0.08rem;}
.civ-v-w3-chips-stacked.civ-v-w3-chips-city{width:100%;}
.civ-v-w3-chip{display:inline-flex;align-items:center;gap:0.48rem;white-space:nowrap;flex-shrink:0;
  font-size:1.56em;line-height:1.2;border:none;background:transparent;padding:0.14em 0.2em;margin:0;
  cursor:pointer;border-radius:4px;font-family:inherit;color:inherit;}
.civ-v-w3-chip:hover{background:rgba(212,175,90,0.1);}
.civ-v-w3-chip:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
.civ-v-w3-chip-icon{display:flex;align-items:center;justify-content:center;color:#e8d88a;font-size:1.15em;line-height:1;}
.civ-v-w3-chip-icon .civ-v-loaf-ic{width:1.2em;height:1.3em;}
.civ-v-w3-sci-med{display:inline-flex;align-items:center;justify-content:center;
  width:1.35em;height:1.35em;border-radius:50%;flex-shrink:0;
  background:radial-gradient(circle at 35% 30%,#8fb6e0,#3a5f8a);border:1px solid #26456a;}
.civ-v-w3-sci-med .civ-science-owl-ic{width:0.82em;height:0.82em;color:#0a1628;}
.civ-v-w3-chip-icon .civ-science-owl-ic{width:1.05em;height:1.05em;color:#0a1628;}
.civ-v-w3-chip-lbl{font-size:0.95em;color:#a8a090;font-weight:600;}
.civ-v-w3-chip-val{font-size:1.08em;font-weight:700;color:#e8d88a;}
.civ-v-w3-chip-val.blue{color:#7cb4e4;}
.civ-v-w3-chip-val.green{color:var(--green);}
.civ-v-w3-chip-val.red{color:var(--red);}
.civ-v-w3-chip-sep{width:1px;height:1.45em;background:rgba(232,216,138,0.2);flex-shrink:0;}
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
.civ-v-garrison-inline{display:flex;align-items:center;justify-content:center;gap:0.42rem;min-width:0;overflow-x:auto;scrollbar-width:none;
  padding:0.1rem 0;-ms-overflow-style:none;width:auto;max-width:100%;text-align:center;align-self:center;}
.civ-v-garrison-inline::-webkit-scrollbar{display:none;}
.civ-v-garrison-label{display:inline-flex;align-items:center;gap:0.28em;font-size:0.82em;font-weight:700;color:var(--text);
  letter-spacing:0.03em;flex-shrink:0;white-space:nowrap;cursor:pointer;border-radius:6px;padding:0.18em 0.42em;
  border:1px solid transparent;transition:color .15s,border-color .15s,background .15s;}
.civ-v-garrison-label:hover,.civ-v-garrison-label:focus-visible{color:#f0e8b8;border-color:rgba(212,175,90,0.28);
  background:rgba(212,175,90,0.08);outline:none;}
.civ-v-garrison-icon{font-size:1.45em;line-height:1;display:flex;align-items:center;flex-shrink:0;opacity:0.95;}
.civ-v-garrison-count{font-size:0.92em;font-weight:700;color:#d4af5a;}
.civ-v-garrison-chip{display:inline-flex;align-items:center;gap:0.3em;padding:0.22em 0.52em;border-radius:3px;
  background:rgba(20,28,40,0.88);border:1px solid rgba(212,175,90,0.28);font-size:0.72em;line-height:1.15;flex-shrink:0;}
.civ-v-garrison-detail-list{display:flex;flex-direction:column;gap:0.35em;max-height:min(50vh,320px);overflow-y:auto;
  padding:0.15em 0.05em 0.05em;scrollbar-width:thin;}
.civ-v-garrison-detail-list .civ-v-garrison-chip{width:100%;font-size:0.78em;padding:0.35em 0.55em;}
.civ-v-garrison-detail-list .civ-v-garrison-chip .gn{max-width:none;flex:1;}
.civ-v-garrison-chip .gi{font-size:1.15em;line-height:1;}
.civ-v-garrison-chip .gn{font-weight:600;color:var(--text);max-width:7em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-v-garrison-chip .hpb{width:2em;height:0.4em;background:#0a0e14;border-radius:2px;overflow:hidden;border:1px solid rgba(0,0,0,0.35);flex-shrink:0;}
.civ-v-garrison-chip .hpf{height:100%;background:linear-gradient(90deg,#2a6a2a,#6bbf59);}
.civ-v-garrison-chip .hpf.hpl{background:linear-gradient(90deg,#6a1818,#d36b5e);}
.civ-v-garrison-chip.in-garnizon{border-color:rgba(224,178,74,0.55);}
.civ-v-garrison-leave-btn{flex-shrink:0;cursor:pointer;border:1px solid rgba(212,175,90,0.4);
  background:rgba(212,175,90,0.12);color:#e0b24a;font-size:0.85em;line-height:1;border-radius:3px;
  padding:0.05em 0.32em;margin-left:0.1em;pointer-events:auto;}
.civ-v-garrison-leave-btn:hover:not(:disabled){background:rgba(212,175,90,0.28);color:#f0d290;}
.civ-v-garrison-leave-btn:disabled{opacity:0.35;cursor:not-allowed;border-color:rgba(212,175,90,0.2);}
.civ-v-garrison-leave-all-btn{pointer-events:auto;}
.civ-v-garrison-leave-all-btn{display:block;width:100%;margin-top:0.5rem;cursor:pointer;
  border:1px solid rgba(212,175,90,0.45);background:rgba(212,175,90,0.14);color:#e0b24a;
  font-size:0.78em;padding:0.35em 0.6em;border-radius:4px;text-align:center;}
.civ-v-garrison-leave-all-btn:hover{background:rgba(212,175,90,0.28);color:#f0d290;}
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
.civ-detail-scope .detail-card.bld-detail-card{padding:0.32em 0.38em;}
.civ-detail-scope .detail-card.bld-detail-card .dc-h{margin-bottom:0.3em;padding-bottom:0.24em;border-bottom:1px solid rgba(212,175,90,0.24);}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile{margin-top:0.28em;padding:0.34em 0.42em 0.38em;
  background:rgba(0,0,0,0.24);border:1px solid rgba(212,175,90,0.18);border-radius:5px;
  box-shadow:inset 0 1px 0 rgba(232,216,138,0.04);}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile:first-of-type{margin-top:0.12em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile + .bld-detail-tile{margin-top:0.32em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-hd{font-size:0.64em;font-weight:700;text-transform:uppercase;
  letter-spacing:0.08em;color:#d4af5a;margin:0 0 0.2em;padding-bottom:0.14em;border-bottom:1px solid rgba(212,175,90,0.2);}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .dc-grid{margin-top:0.06em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .dc-note{margin-top:0.14em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-chips{margin-top:0.08em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-eyebrow{margin-top:0.18em;}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-eyebrow:first-child{margin-top:0;}
.civ-detail-scope .detail-card .dc-note{margin-top:0.35em;color:var(--muted);font-size:0.88em;font-style:italic;line-height:1.35;}
.civ-detail-scope .detail-card .dc-algo-step{font-size:0.76em;line-height:1.42;color:var(--muted);margin:0.1em 0 0.26em;padding-left:0.12em;}
.civ-detail-scope .detail-card .dc-formula{font-size:0.82em;color:var(--gold);font-family:Consolas,'Courier New',monospace;margin:0.18em 0 0.32em;padding:0.22em 0.38em;
  background:rgba(0,0,0,0.25);border-radius:3px;border-left:2px solid rgba(212,175,90,0.35);}
.civ-hover-detail-dock .civ-detail-scope .detail-card{box-shadow:none;}
.civ-hover-detail-float{display:none;position:fixed;z-index:100000;max-width:min(400px,92vw);pointer-events:none;
  padding:0.38em 0.48em;background:rgba(8,12,20,0.96);border:1px solid #e0b24a;border-radius:4px;
  box-shadow:0 6px 20px rgba(0,0,0,0.65);font-size:0.74em;line-height:1.38;}
.civ-hover-detail-float .civ-detail-scope{pointer-events:auto;}
.civ-hover-detail-float .civ-detail-scope .detail-card{border:none;background:transparent;padding:0;}
.civ-cs .mini-thumb.hover-detail-anchor,.civ-cs .unit-mini-preview.hover-detail-anchor,.civ-cs .item-row.hover-detail-anchor,.civ-cs .growth-progress-block.hover-detail-anchor,.civ-cs .wealth-compact-wrap.hover-detail-anchor{cursor:help;}
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
.civ-cs .bld-infocard-chip{display:inline-flex;align-items:center;gap:0.28em;font-size:0.68em;color:#c8b898;border:1px solid rgba(232,216,138,.25);border-radius:20px;padding:0.22em 0.52em;}
.civ-cs .bld-infocard-chip.stock-missing{color:#e88a7a;border-color:rgba(232,110,90,.45);background:rgba(232,90,70,.08);}
.civ-cs .bld-req-chip,.civ-detail-scope .bld-req-chip{display:inline-flex;align-items:center;gap:0.28em;font-size:0.68em;border-radius:20px;padding:0.22em 0.52em;border:1px solid;line-height:1.25;}
.civ-cs .bld-req-chip.met,.civ-detail-scope .bld-req-chip.met{color:#6eb5ff;border-color:rgba(90,155,212,.55);background:rgba(90,155,212,.12);}
.civ-cs .bld-req-chip.unmet,.civ-detail-scope .bld-req-chip.unmet{color:#ff6b6b;border-color:rgba(232,110,90,.5);background:rgba(232,90,70,.1);}
.civ-cs .bld-req-chip .bld-req-tech-ic,.civ-detail-scope .bld-req-chip .bld-req-tech-ic{color:currentColor;opacity:0.92;}
.civ-cs .bld-infocard-chips,.civ-detail-scope .bld-infocard-chips{display:flex;flex-wrap:wrap;gap:0.35em;}
.civ-cs .bld-infocard-eyebrow,.civ-detail-scope .bld-infocard-eyebrow{font-size:0.54em;letter-spacing:.14em;text-transform:uppercase;color:#8a8478;margin-top:0.15em;}
.civ-cs .bld-infocard-eyebrow.req,.civ-detail-scope .bld-infocard-eyebrow.req{color:#c9a35a;}
.civ-cs .bld-infocard-req-access{font-size:0.68em;color:#c8b898;display:flex;align-items:center;gap:0.3em;}
/* SUROW-UI-B1/B2 (Maciej 2026-07-24): pasek surowców uproszczony (budowa/rekrutacja) — Total War-style. */
.civ-cs .civ-cs-res-strip{display:flex;flex-wrap:wrap;align-items:center;gap:0.65em;margin:0 0 0.55em;padding:0.35em 0;}
.civ-cs .civ-cs-res-chip{display:inline-flex;align-items:center;gap:0.4em;color:#e8e0c8;font-weight:600;font-variant-numeric:tabular-nums;line-height:1;}
.civ-cs .civ-cs-res-chip-ic{display:flex;align-items:center;justify-content:center;width:32px;height:32px;flex:none;color:#c8b070;}
.civ-cs .civ-cs-res-chip-ic svg{width:100%;height:100%;display:block;}
.civ-cs .civ-cs-res-chip>b{font-size:16px;line-height:32px;min-width:1.15em;}
.civ-cs .civ-cs-mil-strip{gap:0.6em;padding:0.35em 0.6em;border:1px solid rgba(232,216,138,.22);border-radius:8px;background:rgba(232,216,138,.05);}
.civ-cs .civ-cs-mil-era{font-size:0.62em;letter-spacing:.08em;text-transform:uppercase;color:#8a8070;}
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
.civ-cs .detail-card.bld-detail-card{padding:0.32em 0.38em;}
.civ-cs .detail-card.bld-detail-card .dc-h{margin-bottom:0.3em;padding-bottom:0.24em;border-bottom:1px solid rgba(212,175,90,0.24);}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile{margin-top:0.28em;padding:0.34em 0.42em 0.38em;
  background:rgba(0,0,0,0.24);border:1px solid rgba(212,175,90,0.18);border-radius:5px;
  box-shadow:inset 0 1px 0 rgba(232,216,138,0.04);}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile:first-of-type{margin-top:0.12em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile + .bld-detail-tile{margin-top:0.32em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-hd{font-size:0.64em;font-weight:700;text-transform:uppercase;
  letter-spacing:0.08em;color:#d4af5a;margin:0 0 0.2em;padding-bottom:0.14em;border-bottom:1px solid rgba(212,175,90,0.2);}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .dc-grid{margin-top:0.06em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .dc-note{margin-top:0.14em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-chips{margin-top:0.08em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-eyebrow{margin-top:0.18em;}
.civ-cs .detail-card.bld-detail-card .bld-detail-tile-bd .bld-infocard-eyebrow:first-child{margin-top:0;}
.civ-cs .recruit-queue-scroll{max-height:calc(${RECRUIT_QUEUE_VISIBLE} * ${QUEUE_ROW_EM}em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-cs .build-queue-scroll{max-height:calc(${BUILD_QUEUE_VISIBLE} * ${QUEUE_ROW_EM}em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-v-top-strip .civ-v-tag{color:#8b97a8;letter-spacing:0.06em;text-transform:uppercase;}
.civ-v-top-close{background:linear-gradient(180deg,#5a3020,#3a1810);border:1px solid #a05040;
  color:#ffe8d0;font-size:0.85em;padding:0.15em 0.55em;border-radius:2px;cursor:pointer;font-weight:600;}
.civ-v-section-hd{font-size:0.7em;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;
  color:#d4af5a;margin:0.5em 0 0.35em;padding-bottom:0.2em;border-bottom:1px solid rgba(212,175,90,0.2);}
.civ-v-map-plaque{position:absolute;top:8%;left:50%;transform:translateX(-50%);text-align:center;pointer-events:none;}
.civ-v-map-plaque .name{font-size:1.5em;font-weight:700;color:#f0e6c8;text-shadow:0 2px 8px rgba(0,0,0,0.85);
  letter-spacing:0.12em;text-transform:uppercase;}
.civ-v-map-plaque .sub{font-size:0.72em;color:#a8b4c8;margin-top:0.2em;text-shadow:0 1px 4px #000;}
.civ-v-map-exit-float{display:none!important;}
.civ-v-map-bottom-stack{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:409;
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
.civ-ux-panel-scope.civ-cs .budowa-toolbar{flex-wrap:nowrap;overflow-x:auto;overflow-y:visible;align-items:center;gap:0;margin:0.06em 0 0.18em;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles{
  display:flex;flex-wrap:nowrap;flex:1 1 auto;width:100%;min-width:0;gap:0.12em;justify-content:flex-start;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles button{
  font-size:0.66em;padding:0;width:auto;min-width:0;flex:0 0 auto;box-sizing:border-box;justify-content:center;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-toolbar-profiles button.okolica-profile-btn-ic-only{
  padding:0.18em;border-radius:4px;line-height:0;}
.civ-ux-panel-scope.civ-cs .budowa-toolbar .okolica-profile-btn-ic-only .okolica-profile-glyph{width:1.35em;height:1.35em;}
.civ-ux-panel-scope.civ-cs .budowa-lista-bar{margin:0.12em 0 0.22em;padding:0.18em 0.28em;border:1px solid rgba(120,90,40,0.35);border-radius:4px;background:rgba(20,16,10,0.35);}
.civ-ux-panel-scope.civ-cs .budowa-lista-row{display:flex;align-items:center;gap:0.28em;font-size:0.72em;margin:0.1em 0;}
.civ-ux-panel-scope.civ-cs .budowa-lista-row .budowa-lista-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-ux-panel-scope.civ-cs .budowa-lista-slots{display:flex;gap:0.35em;flex-wrap:wrap;margin-top:0.15em;font-size:0.65em;}
.civ-ux-panel-scope.civ-cs .budowa-lista-slots button{padding:0.1em 0.35em;cursor:pointer;}
.civ-v-left-col{display:flex!important;flex-direction:column!important;flex:1;min-height:0;width:100%;gap:0;}
.civ-v-right-col{display:flex!important;flex-direction:column!important;flex:1;min-height:0;width:100%;height:100%!important;gap:0;}
.civ-v-right-head{flex:0 0 auto;padding-bottom:0.38em;margin-bottom:0.28em;border-bottom:1px solid rgba(212,175,90,0.28);}
.civ-v-left-main{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-top:0;margin-top:0;}
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
.okolica-surowce-strip{margin:0.28em 0 0.42em;padding:0.38em 0.48em;border:1px solid rgba(212,175,90,0.22);
  border-radius:8px;background:rgba(20,18,14,0.45);}
.okolica-surowce-strip .civ-w4-surowce-hd{margin-bottom:0.28em;}
.okolica-surowce-strip .civ-w4-surowce-title{font-size:0.58em;}
.okolica-surowce-strip .civ-w4-surowce-grid{gap:0.22em 0.35em;}
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
.civ-v-split-col .recruit-queue-scroll.list-scroll-fill{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;}
.civ-v-build-pane{display:flex;flex-direction:column;flex:1;min-height:0;height:100%;width:100%;gap:0;}
.civ-v-build-main{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.civ-v-build-main > .panel{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.civ-v-build-main .list-scroll-fill{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;}
.civ-v-build-owned-bar{flex:1 1 auto;padding-top:0.28em;border-top:1px solid rgba(212,175,90,0.28);min-height:10em;max-height:68%;display:flex;flex-direction:column;}
.civ-v-build-owned-bar > .panel{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:0.32em 0.36em 0.28em!important;}
.civ-v-build-owned-bar .list-scroll-fill{flex:1 1 auto;min-height:0;max-height:18em;overflow-y:auto;}
.civ-v-build-owned-bar .ptitle{font-size:0.82em;margin-bottom:0.22em;letter-spacing:.06em;padding:0;}
.civ-v-build-owned-bar .muted{font-size:0.82em;min-height:4.5em;padding:0.55em 0.12em;line-height:1.45;}
.civ-v-build-owned-bar .bld-owned-title-upkeep{font-weight:600;color:#c8a878;margin-left:0.2em;font-size:0.95em;}
.civ-v-build-owned-bar .bld-owned-summary{margin:0 0 0.28em;padding:0.28em 0.36em;font-size:0.78em;}
.civ-v-build-owned-bar .bld-group{margin-bottom:0.18em;}
.civ-v-build-owned-bar .bld-group-h{font-size:0.8em;padding:0.12em 0.28em;margin-bottom:0.1em;line-height:1.35;}
.civ-v-build-owned-bar .bld-group>.bld-owned-row{margin-left:0.12em;}
.civ-v-build-owned-bar .bld-owned-compact-mount .bld-owned-row--tight{padding:0.18em 0.32em;margin-bottom:0.1em;border-radius:4px;gap:0.18em 0.36em;min-height:2.7em;}
.civ-v-build-owned-bar .bld-owned-compact-mount .bld-owned-hd{gap:0.28em;max-width:46%;}
.civ-v-build-owned-bar .bld-owned-compact-mount .bld-owned-hd .bi{width:1.25em;height:1.25em;font-size:1em;}
.civ-v-build-owned-bar .bld-owned-compact-mount .bld-owned-name{font-size:0.82em;max-width:9em;}
.civ-v-build-owned-bar .bld-owned-compact-mount .bld-owned-tail{font-size:0.76em;gap:0.28em 0.36em;line-height:1.25;}
.civ-v-build-owned-bar .bld-owned-compact-mount .bld-owned-chip{gap:0.1em;}
.civ-v-build-owned-bar .bld-owned-compact-mount .bld-owned-sep{opacity:.4;font-size:0.95em;margin:0 0.1em;}
.civ-v-build-owned-bar .bld-owned-compact-mount .bld-owned-row .bld-upg{font-size:0.76em;padding:0.06em 0.28em;}
.bld-owned-compact-mount .bld-owned-row--tight{padding:0.1em 0.22em;margin-bottom:0.06em;border-radius:4px;gap:0.12em 0.28em;min-height:1.35em;}
.bld-owned-compact-mount .bld-owned-hd{gap:0.18em;max-width:46%;}
.bld-owned-compact-mount .bld-owned-hd .bi{width:1em;height:1em;font-size:0.85em;}
.bld-owned-compact-mount .bld-owned-name{font-size:0.68em;max-width:7.5em;}
.bld-owned-compact-mount .bld-owned-tail{font-size:0.62em;gap:0.22em 0.28em;line-height:1.1;}
.bld-owned-compact-mount .bld-owned-chip{gap:0.06em;}
.bld-owned-compact-mount .bld-owned-sep{opacity:.4;font-size:0.9em;margin:0 0.06em;}
.bld-owned-compact-mount .bld-owned-row .bld-upg{font-size:0.62em;padding:0 0.2em;}
.bld-owned-bar{width:100%;display:flex;align-items:center;justify-content:space-between;gap:0.5em;padding:0.48em 0.58em;
  background:rgba(9,13,22,0.96);border:1px solid rgba(212,175,90,0.34);border-radius:8px;color:var(--gold);cursor:pointer;
  font-family:inherit;font-size:0.78em;letter-spacing:.03em;}
.bld-owned-bar:hover{border-color:rgba(232,216,138,0.55);background:rgba(14,18,28,0.98);}
.bld-owned-bar .bld-owned-chevron{opacity:.75;font-size:0.9em;}
.bld-owned-summary{display:flex;align-items:center;gap:0.35em;flex-wrap:wrap;font-size:0.72em;color:#a8a090;
  margin:0.12em 0 0.42em;padding:0.32em 0.42em;border-radius:6px;background:rgba(232,216,138,0.06);
  border:1px solid rgba(232,216,138,0.14);}
.bld-owned-summary b{color:#e8d070;font-weight:700;}
.bld-owned-row{display:flex;flex-direction:row;align-items:center;flex-wrap:wrap;gap:0.22em 0.42em;padding:0.24em 0.36em;margin-bottom:0.12em;
  background:rgba(255,255,255,0.025);border:1px solid rgba(232,216,138,0.14);border-radius:6px;cursor:pointer;}
.bld-owned-row:hover{border-color:rgba(232,216,138,0.38);background:rgba(232,216,138,0.05);}
.bld-owned-hd{display:flex;align-items:center;gap:0.28em;min-width:0;flex:0 1 auto;max-width:55%;}
.bld-owned-hd .bi{flex:none;width:1.25em;height:1.25em;display:flex;align-items:center;justify-content:center;}
.bld-owned-name{flex:0 1 auto;min-width:0;max-width:9.5em;font-size:0.78em;font-weight:600;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bld-owned-name--inactive{color:#e07070;}
.bld-owned-lvl{flex:none;font-size:0.58em;font-weight:700;color:#2a2208;background:#c8b070;border-radius:4px;padding:0.08em 0.32em;line-height:1.2;}
.bld-owned-tail{display:flex;align-items:center;justify-content:flex-end;gap:0.35em 0.45em;flex:1 1 8em;min-width:0;margin-left:auto;flex-wrap:wrap;font-size:0.66em;line-height:1.25;}
.bld-owned-upkeep{flex:none;color:#e8a090;font-weight:600;white-space:nowrap;}
.bld-owned-upkeep.muted{color:#6a6458;font-weight:500;}
.bld-owned-bonus{display:inline-flex;flex-wrap:wrap;gap:0.18em 0.32em;min-width:0;justify-content:flex-end;}
.bld-owned-chip{display:inline-flex;align-items:center;gap:0.12em;color:#c8d8b0;white-space:nowrap;}
.bld-owned-chip .civ-cs-chip-ic-wrap,.bld-owned-chip .civ-cs-inline-loaf{opacity:0.92;}
.bld-owned-row .bld-upg{margin-left:auto;flex:none;font-size:0.72em;padding:0.1em 0.32em;line-height:1;border-radius:4px;
  border:1px solid rgba(232,216,138,0.28);background:rgba(0,0,0,0.2);color:var(--gold);cursor:pointer;}
.bld-compact-row{display:flex;align-items:center;gap:0.45em;padding:0.2em 0.38em;margin-bottom:0.16em;
  background:var(--panel2);border:1px solid var(--border);border-radius:6px;min-height:calc(${LIST_ROW_HEIGHT_COMPACT}em - 0.35em);
  cursor:help;}
.bld-compact-row.is-locked{opacity:.72;cursor:help;}
.bld-compact-ic{width:1.65em;height:1.65em;flex:none;border-radius:6px;border:1px solid rgba(160,128,48,.35);
  background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.bld-compact-ic .mini-thumb{width:100%;height:100%;border:none;background:transparent;}
.bld-compact-name{flex:1;min-width:0;font-size:0.82em;font-weight:600;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bld-compact-actions{flex:0 0 auto;display:flex;gap:0.28em;margin-left:auto;flex-shrink:0;}
.bld-compact-actions .btn-sm{padding:0.18em 0.55em;font-size:0.72em;min-width:3.2em;}
.bld-compact-row.can-build-row{border-color:rgba(90,160,232,0.28);}
.bld-compact-row.cannot-build-row{border-color:rgba(80,96,112,0.32);}
.bld-detail-actions{display:flex;flex-wrap:wrap;gap:0.35em;margin-top:0.55em;padding-top:0.45em;border-top:1px solid rgba(232,216,138,.16);}
.civ-detail-scope .detail-card.bld-detail-card .bld-detail-actions,
.civ-cs .detail-card.bld-detail-card .bld-detail-actions{margin-top:0.38em;padding:0.42em 0.42em 0.1em;border-top:1px solid rgba(212,175,90,0.22);}
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

function buildingHappinessSum(cityId: string, data: GameData, era: number, ownerId: number): number {
  const builtIds = cfg.getBuiltBuildingIds?.(cityId) ?? [];
  const techs = cfg.getUnlockedTechs?.(ownerId) ?? [];
  let sum = sumBuildingHappinessFromBuiltIds(
    builtIds,
    data.buildings,
    bdef => buildingLevelForEpoch(
      bdef.epokaWejscia,
      era,
      bdef.maksPoziom,
      bdef.poziomTechGate ?? null,
      techs,
    ),
  );
  if (builtIds.includes('garncarnia')) {
    const allCities = cfg.getCities?.() ?? [];
    const builtByCity = new Map<string, readonly string[]>();
    for (const c of allCities) {
      builtByCity.set(c.id, cfg.getBuiltBuildingIds?.(c.id) ?? []);
    }
    sum += computeGarncarniaSurplusZadowolenieByOwner(allCities, builtByCity, false).get(ownerId) ?? 0;
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
  const ownCultureShare = resolveOwnCultureShare(city as { ownCultureShare?: number; kulturaOwnShare?: number });
  const haKult = cultureHappiness({ kulturaSkumulowana, ownCultureShare }, cp);
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
  const stolicaBonus = stolicaEasyBonusActive(
    difficulty, gameTurn, city, allCities, 10, cfg.getCapitalCityId?.(city.ownerId) ?? null,
  );

  const ordPctRaw = evaluateOrderFromBreakdown(
    {
      difficulty,
      era,
      population: city.population,
      buildingZadowolenie: buildingHappinessSum(city.id, data, era, city.ownerId),
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
      hasDomStarszyzny: builtIds.includes('dom_starszyzny'),
      hasDworZarzadcy: builtIds.includes('dwor_zarzadcy'),
      hasPretorium: builtIds.includes('pretorium'),
      hasTrybunal: builtIds.includes('trybunal'),
      hasSad: builtIds.includes('sad'),
      palacTier: cityPalacTier(builtIds),
      brakGarnizonuKara: !playtestSandbox && city.population >= 6 && gCount === 0,
      stolicaEasyBonus: stolicaBonus,
    },
    data.societyParams,
    difficulty,
  );

  const ordPct = isPostCaptureLawActive(city)
    ? applyPostCaptureLawOverride(ordPctRaw, city, data.societyParams, difficulty)
    : ordPctRaw;

  const grace = city.revoltGraceRemaining;
  const revoltWarning = !isPostCaptureLawActive(city) && grace != null && grace > 0;

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
      postCaptureLawTurnsRemaining: city.postCaptureLawTurnsRemaining,
    },
    fromEngine: false,
  };
}

function resolveCityHealth(city: City, map: GameMap, data: GameData): { total: number; lines: CityHealthLine[]; fromEngine: boolean } {
  const live = cfg.getCityHealth?.(city.id);
  if (live) return { ...live, fromEngine: true };
  const builtIds = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const tiles = cityWorkedTilesForEconomy(city, map, territoryNodesForPanel());
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
  } else if (state.postCaptureLawTurnsRemaining != null && state.postCaptureLawTurnsRemaining > 0) {
    orderChips.push({
      icon: cityPanelChipIcon('chip-garrison', 14),
      label: 'Prawo',
      value: `${state.postCaptureLawTurnsRemaining} tur`,
      cls: 'green',
      title: postCaptureLawBannerLabel(city) ?? 'Bonus Prawa po podboju',
    });
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
  const daninaLbl = daninaLabelForCity(city);
  appendDetailAlgo(card, 'Łańcuch przyczynowy', [
    `Suwak Zamożność (${daninaLbl.toLowerCase()}) → wyższy udział zamożności → wyższe Szczęście (niskie podatki).`,
    'Budynki (Teatr, Łaźnia, Świątynia…) i kultura/religia → stały plus do Szczęścia.',
    'Zamożność W (poziom) → bonus zadowolenia z bogactwa obywateli.',
    'Garnizon w mieście → głównie Prawo (do 100% przy 5+ jednostkach), nie Szczęście.',
    'Dom Starszyzny / Dwór Zarządcy / Pretorium (region) lub Pałac (stolica), Trybunał, Sąd → trwały plus do Prawa.',
    'Duże miasto bez garnizonu → kara Prawa.',
    'PorPct spada → kary na pracę, pieniądz, naukę, wzrost; przy skrajnym spadku bunt.',
    'Sz i Prawo są niezależne — możesz podnieść jedno bez drugiego (np. wojsko bez obniżki podatków).',
  ]);

  appendDetailSection(card, 'Progi PorPct (efekty gameplay)');
  const gt = appendDetailGrid(card);
  gridDetailRow(gt, '≥90% Ład', `Bonus praca ×1,10, ${daninaLbl.toLowerCase()} ×1,10`);
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
    'lub rozwijaj administrację lokalną (Dom Starszyzny → Dwór Zarządcy → Pretorium; ' +
    'Pałac w stolicy), Trybunał albo Sąd.<br><br>' +
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
    'Zdrowie dodaje do WZROST%: floor(Zdrowie ÷ 10) × 1 p.p.',
    'Wyższe zdrowie = szybszy wzrost ludności; ujemne = wolniejszy.',
    'Część składników pochodzi z budynków, terenu okolicy i stanu wojny/chorób.',
  ]);
  return card;
}

function normalizeResourceAccess(
  raw: string[] | { potential: string[]; active: string[]; tradeSources?: Record<string, string> } | undefined,
): {
  potential: string[];
  active: string[];
  legacy: boolean;
} {
  if (!raw) return { potential: [], active: [], legacy: false };
  if (Array.isArray(raw)) {
    return {
      potential: [],
      active: raw.filter(l => CITY_PANEL_RANGE_DEPOSIT_LABELS.has(l)),
      legacy: true,
    };
  }
  return {
    potential: raw.potential ?? [],
    active: (raw.active ?? []).filter(l => CITY_PANEL_RANGE_DEPOSIT_LABELS.has(l)),
    legacy: false,
  };
  // DYSPOZYCJA 85 (Maciej 2026-07-26): `raw.tradeSources` (którego szlak handlowy
  // przyznał dostęp do tego surowca) już NIE jest odczytywany tutaj -- to jest
  // informacja o handlu międzynarodowym, a ta należy WYŁĄCZNIE do panelu Handel
  // (empireDetailPanel.ts), nie do panelu miasta. main.ts nadal może zwracać to
  // pole (getResourceAccess) -- po prostu nie jest tu już konsumowane.
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

function renderSurowce(mount: HTMLElement, city: City, compact = false): void {
  mount.innerHTML = '';
  const raw = cfg.getResourceAccess?.(city.id);
  const { potential, active, legacy } = normalizeResourceAccess(raw);
  const wrap = el('div', compact ? 'okolica-surowce-strip' : 'civ-w4-surowce-foot');
  const hd = el('div', 'civ-w4-surowce-hd');
  const surowceTitle = el('span', compact ? 'okolica-surowce-title' : 'civ-w4-surowce-title');
  surowceTitle.textContent = compact ? 'Surowce w zasięgu' : 'Surowce w zasięgu';
  const surowceDetail = el('button', compact ? 'okolica-info-link civ-w4-surowce-detail gold' : 'civ-w4-surowce-detail civ-w4-panel-detail gold');
  surowceDetail.type = 'button';
  surowceDetail.textContent = 'i szczegóły';
  surowceDetail.setAttribute('aria-label', 'Pokaż szczegóły surowców');
  hd.appendChild(surowceTitle);
  hd.appendChild(surowceDetail);
  wrap.appendChild(hd);
  const surowceBuild = () => buildSurowceDetailCard(potential, active, legacy);
  attachInteractiveDetail(surowceDetail, surowceBuild, { delayMs: 220, sideHint: 'right' });

  const preview = ['Koń', 'Sól', 'Złoto'];
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
      subP.textContent = 'Potencjał (złoże — zbuduj ulepszenie)';
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
    ? 'Surowce w zasięgu TEGO miasta — podgląd mapy lokalnej (nie warunek budowy w innym mieście). Koszt surowcowy budynku = magazyn całej cywilizacji.'
    : 'Potencjał (szare) = złoże widoczne w zasięgu tego miasta — jeszcze nieużywalne. Surowce magazynowe (Drewno, Glina, Ruda…) wymagają zapasu w magazynie państwa — koszt budowy (`koszt_surowce`) też stamtąd.';
  card.appendChild(intro);
  if (active.length > 0) {
    appendDetailSection(card, legacy ? 'Lista' : 'Dostęp aktywny');
    const g = appendDetailGrid(card);
    for (const n of active) {
      gridDetailRow(g, resourceBrandIconHtml(n), n);
    }
  }
  if (!legacy && potential.length > 0) {
    appendDetailSection(card, 'Potencjał (złoże)');
    const g2 = appendDetailGrid(card);
    for (const n of potential) gridDetailRow(g2, resourceBrandIconHtml(n), n);
  }
  appendDetailAlgo(card, 'Mechanika', legacy
    ? [
      'Lista pokazuje surowce widoczne z tego miasta — informacja mapowa.',
      'Budowa wymagająca surowców liczonych: wystarczy zapas w magazynie państwa (dowolne miasto).',
    ]
    : [
      'Złoże w zasięgu tego miasta — podgląd mapy; nie warunek budowy w innym mieście.',
      'Koszt surowcowy budynku (`koszt_surowce`): tylko magazyn państwa (suma po wszystkich miastach).',
      'Wyjątki lokalne: Port (wybrzeże/rzeka przy tym mieście), prerekwizyty budynków w tym mieście.',
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

/** Blok „Kultura: Grecka 70% / Obca 30%” lub skład wyznawców. */
function appendCompositionBlock(
  parent: HTMLElement,
  title: string,
  lines: { label: string; pct: number; note?: string }[],
  footnote?: string,
): void {
  if (!lines.length) return;
  appendDetailSection(parent, title);
  const g = appendDetailGrid(parent);
  for (const row of lines) {
    const val = row.note ? `${row.pct}% · ${row.note}` : `${row.pct}%`;
    gridDetailRow(g, row.label, val);
  }
  if (footnote) {
    const note = document.createElement('div');
    note.className = 'dc-note';
    note.style.fontStyle = 'normal';
    note.textContent = footnote;
    parent.appendChild(note);
  }
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
    if (cultState.ownerCultureLabel) {
      gridDetailRow(gc, 'Okręg kulturowy właściciela', cultState.ownerCultureLabel);
    }
    if (cultState.kulturaMix && cultState.kulturaMix.length > 0) {
      appendCompositionBlock(
        card,
        'Skład kultury w mieście',
        cultState.kulturaMix.map(m => ({
          label: m.label,
          pct: m.pct,
          note: !m.isOwner ? 'konwersja w toku' : undefined,
        })),
        cultState.cultureConverting
          ? 'Miasto ma mieszankę kultur — udział kultury właściciela rośnie co turę (budynki kulturalne przyspieszają).'
          : undefined,
      );
    } else if (cultState.ownCultureSharePct != null) {
      gridDetailRow(gc, 'Udział kultury właściciela', `${cultState.ownCultureSharePct}%`);
    }
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
    if (relState.stateReligion) {
      gridDetailRow(gs, 'Religia państwa', relState.stateReligion);
    }
    if (relState.sklad && relState.sklad.length > 0) {
      appendCompositionBlock(
        card,
        'Skład wyznawców',
        relState.sklad.map(s => ({
          label: s.name,
          pct: s.pct,
          note: relState.stateReligion && s.name !== relState.stateReligion ? 'obca wiara' : undefined,
        })),
        relState.sklad.some(s => relState.stateReligion && s.name !== relState.stateReligion)
          ? 'Po podboju obca wiara stopniowo ustępuje religii państwa (Świątynia przyspiesza konwersję).'
          : undefined,
      );
    }
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

  if (cultState?.kulturaMix && cultState.kulturaMix.length > 0) {
    appendCompositionBlock(
      mount,
      'Skład kultury',
      cultState.kulturaMix.map(m => ({
        label: m.label,
        pct: m.pct,
        note: !m.isOwner ? 'konwersja' : (m.pct >= 100 ? 'pełna zgodność' : undefined),
      })),
    );
  }

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

  if (relState?.stateReligion) {
    const stateNote = document.createElement('di' + 'v');
    stateNote.className = 'rsb';
    stateNote.innerHTML =
      `<span class="muted">Religia państwa:</span> <span class="gold">${relState.stateReligion}</span>`;
    mount.appendChild(stateNote);
  }
  if (relState?.sklad && relState.sklad.length > 0) {
    appendCompositionBlock(
      mount,
      'Skład wyznawców',
      relState.sklad.map(s => ({
        label: s.name,
        pct: s.pct,
        note: relState.stateReligion && s.name !== relState.stateReligion ? 'obca' : undefined,
      })),
    );
  }

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

function appendWealthCompactStrip(
  mount: HTMLElement,
  opts: {
    poziom: number;
    atCap: boolean;
    cap: number;
    epoch: number;
    mnoz: number;
    szBonus: number;
    pula: number;
    prog: number;
    pct: number;
    etaW: number | null;
    zamIn: number;
    daninaLblGen: string;
  },
): void {
  const wrap = el('div', 'wealth-compact-wrap');
  const badges = el('div', 'wealth-compact-badges');
  const mkStat = (html: string, cls: string) => {
    const s = el('span', `wealth-compact-stat ${cls}`.trim());
    s.innerHTML = html;
    return s;
  };
  const nextW = opts.poziom + 1;
  const mnozTxt = opts.mnoz.toFixed(2).replace('.', ',');

  badges.appendChild(mkStat(`<b>W${opts.poziom}</b>`, 'wealth-w'));
  badges.appendChild(mkStat(
    `${cityPanelChipIconWrap('res-treasury', 14)}<b>×${mnozTxt}</b>`,
    'wealth-mnoz',
  ));
  const szStat = mkStat(cityPanelChipIconWrap('chip-happiness', 14), 'wealth-happy');
  szStat.setAttribute('aria-label', `Szczęście z zamożności ${opts.szBonus >= 0 ? '+' : ''}${Math.round(opts.szBonus)}`);
  badges.appendChild(szStat);
  wrap.appendChild(badges);

  const track = el('div', 'food-grow-track wealth-compact-bar');
  const barLabel = opts.atCap ? `W${opts.poziom} — MAX` : `${Math.round(opts.pula)} / ${Math.round(opts.prog)}`;
  track.innerHTML =
    `<div class="food-grow-fill" style="width:${opts.pct}%"></div>` +
    `<span class="fbtxt">${barLabel}</span>`;
  wrap.appendChild(track);

  if (!opts.atCap && opts.etaW != null) {
    const eta = el('div', 'wealth-compact-eta ok');
    eta.textContent = `Kolejny W${nextW} za ok. ${opts.etaW} ${tury(opts.etaW)}.`;
    wrap.appendChild(eta);
  }

  mount.appendChild(wrap);
  attachHoverDetail(
    wrap,
    () => buildWealthCompactTooltipCard(opts),
    220,
    'left',
  );
}

/** Tooltip zamożności — pełne wyjaśnienia (poza głównym widokiem). */
function buildWealthCompactTooltipCard(opts: {
  poziom: number;
  atCap: boolean;
  cap: number;
  epoch: number;
  mnoz: number;
  szBonus: number;
  pula: number;
  prog: number;
  etaW: number | null;
  zamIn: number;
  daninaLblGen: string;
}): HTMLDivElement {
  const nextW = opts.poziom + 1;
  const mnozTxt = opts.mnoz.toFixed(2).replace('.', ',');

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Zamożność — szczegóły</span>'));
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Poziom W', opts.atCap
    ? `W${opts.poziom} — maksimum w epoce ${opts.epoch} (limit W${opts.cap})`
    : `W${opts.poziom} (limit W${opts.cap} w epoce ${opts.epoch})`);
  gridDetailRow(g, 'Pula', opts.atCap
    ? 'Pełna — brak kolejnego poziomu w tej epoce'
    : `${Math.round(opts.pula)} / ${Math.round(opts.prog)} 💰 do W${nextW}`);
  gridDetailRow(g, 'Mnożnik skarbca', `×${mnozTxt}${opts.poziom <= 1 ? ' (W1 = bez bonusu)' : ''}`);
  gridDetailRow(g, 'Szczęście', `${opts.szBonus >= 0 ? '+' : ''}${Math.round(opts.szBonus)} (co 10 poziomów W +1)`);

  const note = el('div', 'dc-note');
  if (opts.atCap) {
    note.textContent = `Osiągnięto najwyższą zamożność W${opts.poziom} w epoce ${opts.epoch}.`;
  } else if (opts.zamIn <= 0) {
    note.textContent =
      `Brak wpływu do puli — przesuń suwak „Zamożność” w podziale ${opts.daninaLblGen}, żeby rosnąć do W${nextW}.`;
  } else if (opts.etaW != null) {
    note.textContent =
      `Postęp do W${nextW}: ≈ +${opts.zamIn} 💰/turę trafia do puli z udziału „Zamożność” w ${opts.daninaLblGen}. ` +
      'Nadwyżka puli zostaje po awansie.';
  } else {
    note.textContent = `Cel: W${nextW} — potrzeba ${Math.round(opts.prog)} 💰 w puli.`;
  }
  card.appendChild(note);
  return card;
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
  mount.appendChild(el('div', 'ptitle', `<span>Plony i ${daninaLabelForCity(city).toLowerCase()}</span>`));
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
    sub.textContent = `Podział ${daninaLabelGenitive(daninaLabelForCity(city))}`;
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

  appendCitySkarbiecBalance(mount, city);
}

/** Bilans pieniędzy tego miasta — przychody i koszty lokalne. */
function appendCitySkarbiecBalance(mount: HTMLElement, city: City): void {
  const snap = cfg.getCityMoneySnap?.(city.id);
  if (!snap) return;

  const sub = el('div', 'subhd');
  sub.textContent = 'Bilans pieniędzy miasta';
  sub.style.marginTop = '0.65em';
  mount.appendChild(sub);

  const rows: Array<{ label: string; value: string; cls?: string }> = [
    { label: 'Pieniądz brutto (pola + budynki)', value: signed(snap.pieniadzBrutto) },
    { label: 'Mnożnik zamożności W', value: `×${snap.wealthMnoznik.toFixed(2)}` },
    { label: 'Handel ze szlaków', value: signed(snap.handelZeSzlakow) },
    { label: '→ Wpływ do skarbca imperium', value: signed(snap.doSkarbca), cls: snap.doSkarbca > 0 ? 'green' : snap.doSkarbca < 0 ? 'red' : 'muted' },
    { label: 'Utrzymanie budynków (to miasto)', value: snap.utrzymanieBudynkow > 0 ? `−${snap.utrzymanieBudynkow}` : '—', cls: snap.utrzymanieBudynkow > 0 ? 'red' : undefined },
    { label: 'Utrzymanie surowców budynków', value: formatResourceUpkeepSummary(snap.utrzymanieSurowcowBudynkow ?? {}), cls: Object.keys(snap.utrzymanieSurowcowBudynkow ?? {}).length > 0 ? 'red' : undefined },
    { label: 'Utrzymanie garnizonu (hex miasta)', value: snap.utrzymanieGarnizonu > 0 ? `−${snap.utrzymanieGarnizonu}` : '—', cls: snap.utrzymanieGarnizonu > 0 ? 'red' : undefined },
  ];

  const grid = el('div', 'city-money-grid');
  for (const r of rows) {
    const row = el('div', 'city-money-row');
    const lbl = el('span', 'city-money-lbl');
    lbl.textContent = r.label;
    const val = el('span', `city-money-val${r.cls ? ' ' + r.cls : ''}`);
    val.textContent = r.value;
    row.appendChild(lbl);
    row.appendChild(val);
    grid.appendChild(row);
  }
  mount.appendChild(grid);
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
  const atCap = ws.poziom >= cap;
  const mnoz = wealthMnoznik(ws.poziom, wealthParams);
  const szBonus = wealthZadowolenie(ws.poziom, wealthParams);
  const pct = atCap ? 100 : (prog > 0
    ? Math.round(Math.min(100, Math.max(0, (ws.pula / prog) * 100)))
    : 0);
  const daninaLblGen = daninaLabelGenitive(daninaLabelForCity(city));
  const zamIn = view && data ? estimateHandelChips(view, readPodzialHandlu(city, data)).zam : 0;
  const etaW = !atCap && prog > ws.pula && zamIn > 0
    ? Math.max(1, Math.ceil((prog - ws.pula) / zamIn))
    : null;

  appendWealthCompactStrip(mount, {
    poziom: ws.poziom,
    atCap,
    cap,
    epoch,
    mnoz,
    szBonus,
    pula: ws.pula,
    prog,
    pct,
    etaW,
    zamIn,
    daninaLblGen,
  });
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
  const daninaLbl = daninaLabelForCity(city);
  const daninaLblGen = daninaLabelGenitive(daninaLbl);
  const rown = wealthRownowaga(ws.poziom, epoch, p);
  const podzial = readPodzialHandlu(city, gameData());
  const pctSpol = podzial.procentLuksus;
  const miastoMoney = view?.pieniadz ?? null;
  const spolEst = miastoMoney !== null ? Math.round(miastoMoney * pctSpol / 100) : null;
  const utrzymEst = miastoMoney !== null ? Math.round(rown * miastoMoney) : null;
  const data = gameData();
  const zamIn = view && data ? estimateHandelChips(view, readPodzialHandlu(city, data)).zam : 0;
  const atCap = ws.poziom >= cap;
  const etaW = !atCap && prog > ws.pula && zamIn > 0
    ? Math.max(1, Math.ceil((prog - ws.pula) / zamIn))
    : null;

  const card = el('div', 'detail-card wealth-detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Zamożność — ściąga</span>';
  card.appendChild(head);

  const summary = el('div', 'dc-summary muted');
  summary.style.cssText = 'font-size:0.88em;margin-bottom:0.35em;';
  summary.textContent = ws.poziom >= cap
    ? `W${ws.poziom} · MAX (epoka ${epoch}) · ×Skarb ${mnoz.toFixed(2)}`
    : `W${ws.poziom} · pula ${Math.round(ws.pula)} / ${Math.round(prog)} · ×Skarb ${mnoz.toFixed(2)}`;
  card.appendChild(summary);

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Pasek w panelu pokazuje tylko postęp puli do następnego poziomu W — jak spichlerz dla wzrostu ludności. ' +
    `Część ${daninaLblGen} (suwak Zamożność) trafia do puli; wyższy W mnoży pieniądze do skarbca, ale utrzymanie W też kosztuje.`;
  card.appendChild(intro);

  appendDetailSection(card, 'Co oznaczają liczby');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Pasek (główny widok)', ws.poziom >= cap
    ? 'Pełny — osiągnięto max W w tej epoce'
    : `${Math.round(ws.pula)} / ${Math.round(prog)} — ile zebrano z puli potrzebnej do W${ws.poziom + 1}`);
  gridDetailRow(g0, 'W (poziom Wealth)', `W${ws.poziom} — poziom zamożności obywateli (max W${cap} w epoce ${epoch}). Wyższe W = bogatsze miasto i bonus do szczęścia co 10 poziomów.`);
  gridDetailRow(g0, '×Skarb (mnożnik)', `×${mnoz.toFixed(2)} — ile razy mnożony jest strumień pieniędzy do skarbca przy obecnym W. W1 = ×1,00 (bez bonusu); każdy kolejny poziom W podnosi mnożnik.`);
  gridDetailRow(g0, 'Próg awansu', ws.poziom >= cap
    ? 'Brak — cap epoki'
    : `${Math.round(prog)} 💰 w puli → awans na W${ws.poziom + 1} (zostaje ${Math.round(p.zachowaniePoAwansie * 100)}% puli)`);

  appendDetailSection(card, 'Stan miasta');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Poziom W', `W${ws.poziom} (max W${cap} w epoce ${epoch})`);
  gridDetailRow(g1, 'Pula zamożności', `${Math.round(ws.pula)} / ${Math.round(prog)} do W${Math.min(cap, ws.poziom + 1)}`);
  gridDetailRow(g1, 'Postęp paska', ws.poziom >= cap
    ? 'Maks. poziom zamożności w tej epoce'
    : `→ W${ws.poziom + 1}: ${Math.round(ws.pula)} / ${Math.round(prog)} (${Math.round(prog > 0 ? (ws.pula / prog) * 100 : 0)}%)`);
  gridDetailRow(g1, 'Mnożnik skarbca', `×${mnoz.toFixed(2).replace('.', ',')}`);
  gridDetailRow(g1, 'Wpływ na szczęście', `${signed(szcz)} zadowolonych`);
  gridDetailRow(g1, 'Kolejny poziom W', atCap
    ? 'Maks. poziom w tej epoce'
    : (etaW != null
      ? `W${ws.poziom + 1} za ok. ${etaW} ${tury(etaW)} przy ~${zamIn} 💰/turę do puli (udział „Zamożność” w ${daninaLblGen})`
      : 'Brak wpływu do puli — zwiększ udział „Zamożność” w podziale handlu'));

  appendDetailSection(card, 'Wzory');
  appendDetailFormula(card, `×Skarb = max(1, 1 + (W−1) × ${p.mnoznikNaPoziom})`);
  appendDetailFormula(card, `Próg W(L→L+1) = ${p.progNaPoziom} × (L+1) × epoka`);
  appendDetailFormula(card, `Utrzymanie = rownowaga(W) × pieniądz_miasta`);
  appendDetailFormula(card, `Równowaga(W) = ${Math.round(p.utrzymanieBaza * 100)}% + (W/cap)×(${Math.round(p.utrzymaniePrzyCap * 100)}%−${Math.round(p.utrzymanieBaza * 100)}%)`);

  appendDetailSection(card, 'Skąd bierze się pula');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, `Suwak ${HANDEL_ZAMOZNOSC_LABEL}`, `${pctSpol}% udziału ${daninaLblGen}`);
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
    `Wejście: strumień z ${daninaLblGen} = floor(handelNetto × %${HANDEL_ZAMOZNOSC_LABEL}) — nie trafia do skarbca.`,
    'Koszt utrzymania = rownowaga(W) × pieniądz brutto miasta tej tury.',
    `Pula += wpływ z ${daninaLblGen} − utrzymanie. Gdy pula < 0 → pula=0 i W−1.`,
    'Dopóki pula ≥ próg awansu i W < cap: W+1, pula −= próg, pula ×= zachowanie po awansie.',
    'Mnożnik skarbca rośnie z poziomem W — stosowany do pieniędzy miasta (nie do nauki).',
  ]);

  appendDetailAlgo(card, 'Skąd bierze się wpływ do puli', [
    `${daninaLbl} brutto z pól + bonus Targowiska → handelNetto (po korupcji, opcjonalnie ×Waluta).`,
    `Podział ${daninaLblGen}: %${HANDEL_ZAMOZNOSC_LABEL} × handelNetto → wpływ do puli zamożności.`,
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
    ? `${pctB}% ${cityPanelChipIconWrap('cp-buildings', 14)} budynki · ${pctU}% ${cityPanelChipIconWrap('chip-crate', 14)} pula · ${signed(praca.total)} ${cityPanelChipIconWrap('res-work', 14)}`
    : `${pctB}% ${cityPanelChipIconWrap('cp-buildings', 14)} · ${pctU}% ${cityPanelChipIconWrap('chip-crate', 14)} (brak podglądu tury)`;
  card.appendChild(summary);

  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    'Praca 🔨 to surowiec z pól okolicy (👤 na heksach). Nie idzie wszystko w jedno miejsce — suwak dzieli ją między ' +
    'kolejkę budowy/rekrutacji a pulę imperium (załóż miasto, ulepszenia / projekty mapy). Razem zawsze 100%.',
  );
  card.appendChild(intro);

  appendDetailSection(card, 'Co widać w panelu');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Suwak (jak Wyżywienie)', `Etykieta: ${pctB}% 🏛 · ${pctU}% 📦 — jeden pasek przesuwania, bez osobnego paska podglądu.`);
  gridDetailRow(g0, 'Lewo / prawo', 'W lewo → więcej do puli imperium; w prawo → szybsza kolejka budowy. Kroki co 10%.');
  gridDetailRow(g0, 'Dlaczego tu, po lewej', 'Podział pracy karmi produkcję i budowę — garnizon jest w pasku u góry obok nazwy miasta.');

  appendDetailSection(card, 'Aktualny podział');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Praca', praca ? `${signed(praca.total)} 🔨` : '—');
  gridDetailRow(g1, '→ Budynki', praca ? `${signed(praca.doBudynkow)} (${praca.pctBudynki}%)` : '—');
  gridDetailRow(g1, '→ Pula imperium', praca ? `${signed(praca.doUlepszen)} (${praca.pctUlepszenia}%)` : '—');

  appendDetailFormula(card, 'doBudynkow = round(praca × %Budynki)');
  appendDetailFormula(card, 'doPuli = praca − doBudynkow  (nigdy nie gubi reszty)');

  appendDetailSection(card, 'Trade-off (po co ten wybór)');
  const gt = appendDetailGrid(card);
  gridDetailRow(gt, 'Więcej 🏛', 'Szybciej kończysz budynki i rekrutację w kolejce — miasto rośnie „w pionie”.');
  gridDetailRow(gt, 'Więcej 📦', 'Szybciej kumulujesz pulę imperium — załóż miasto, ulepszenia terenu na mapie, projekty.');
  gridDetailRow(gt, 'Skrajności', '100% 🏛 = zero wpływu do puli. 100% 📦 = kolejka stoi w miejscu (chyba że pusta — wtedy całość i tak idzie do puli).');
  gridDetailRow(gt, 'Brak pracy', 'Gdy 🔨 = 0, suwak nic nie da — przypisz 👤 w okolicy (prawa kolumna).');

  appendDetailAlgo(card, 'Algorytm (splitPraca + productionProgress)', [
    'Praca netto = suma z obrabianych pól + budynki − strata (korupcja).',
    'doBudynkow idzie do kolejki produkcji (budynki, jednostki) co turę.',
    'doPuli trafia do zapasu Pracy imperium (nie do ulepszeń pól — te kosztują pulę przy akcji na mapie).',
    'Kolejka pusta: cała Praca miasta (doBudynkow + doPuli) idzie do puli imperium.',
    'Kolejka zajęta: postęp += doBudynkow; gdy postęp ≥ koszt → budynek gotowy; reszta → doPuli.',
    maTargowisko
      ? 'Część pracy (doPuli) + Waluta + Targowisko → dodatkowy pieniądz (osobny strumień).'
      : 'Bez Targowiska doPuli nie konwertuje się na pieniądz.',
    'Brak pracy = brak postępu budowy i brak wpływu do puli — przypisz 👤 w okolicy.',
  ]);

  appendDetailAlgo(card, 'Suwak UI', [
    'Kroki co 10%. Zmiana %Budynki automatycznie ustawia resztę na pulę imperium.',
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
    statChipBrand('tb-build', 'Ulepszenia', praca ? `+${praca.doUlepszen}` : '—', 'blue');
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
  }
  const budLbl = psiRowLabel(
    'cp-buildings',
    'Kolejka budowy',
    front ? undefined : 'Kolejka budowy pusta — wybierz Buduj w lewym railu',
  );
  rowBud.innerHTML =
    `<span class="psi-lbl">${budLbl}</span>` +
    `<span class="psi-val gold">${budVal}${budSub ? `<div class="psi-sub">${budSub}</div>` : ''}</span>`;
  info.appendChild(rowBud);

  const rowPool = el('div', 'psi-row');
  const poolTip = `Zapas całej cywilizacji: ${pool} Pracy · załóż miasto, ulepszenia / projekty mapy`;
  rowPool.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('tb-build', 'Ulepszenia', poolTip)}</span>` +
    `<span class="psi-val blue">${praca ? `+${signed(praca.doUlepszen)} (${praca.pctUlepszenia}%)` : '—'}` +
    `<div class="psi-sub">Zapas Pracy na ulepszenia pól: ${pool}${cityPanelChipIconWrap('res-work', 14)} · farma, kamieniołom, projekty mapy</div></span>`;
  info.appendChild(rowPool);

  const rowSkarb = el('div', 'psi-row');
  const rqSub = rq.length > 0 ? `Kolejka rekrutacji: ${rq.length} · opłacone złotem` : '';
  const skarbTip = rq.length > 0
    ? undefined
    : 'Jednostki kupujesz za złoto ze skarbca (zakładka Rekrut.)';
  rowSkarb.innerHTML =
    `<span class="psi-lbl">${psiRowLabel('res-treasury', 'Skarbiec', skarbTip)}</span>` +
    `<span class="psi-val gold">${skarb}${skarbDelta !== 0 ? ` (${signed(skarbDelta)})` : ''}` +
    `${rqSub ? `<div class="psi-sub">${rqSub}</div>` : ''}</span>`;
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

  const sliderWrap = el('div', 'praca-w4-sliders');
  const sliderRow = el('div', 'slider-row');
  const sliderLabel = el('label');
  const podzialTip = 'Kroki co 10%. W lewo → więcej do ulepszeń · w prawo → szybsza kolejka budowy.';
  sliderLabel.innerHTML =
    `<span title="${podzialTip.replace(/"/g, '&quot;')}">${cityPanelChipIconWrap('res-work', 14)} Budynki / Ulepszenia</span>` +
    `<span>${pracaSplitBarLabelHtml(pctB, pctU, praca?.doBudynkow, praca?.doUlepszen)}</span>`;
  sliderRow.appendChild(sliderLabel);

  if (player) {
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = '0';
    inp.max = '100';
    inp.step = String(HANDEL_PCT_STEP);
    inp.value = String(pctB);
    inp.setAttribute('aria-label', 'Podział pracy: budynki versus ulepszenia');
    inp.title = podzialTip;
    inp.addEventListener('input', () => {
      const v = snapHandelPct(Number(inp.value));
      cfg.onPodzialPracyChange?.(city.id, { procentBudynki: v });
      rerender();
    });
    sliderRow.appendChild(inp);
  } else {
    const ro = el('div', 'muted');
    ro.style.cssText = 'font-size:0.68em;margin-top:0.06em;';
    ro.textContent = 'Tylko podgląd (miasto rywala).';
    sliderRow.appendChild(ro);
  }
  sliderWrap.appendChild(sliderRow);
  mount.appendChild(sliderWrap);

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
  const data = gameData();
  appendSectionTitleWithDetails(mount, '<span>Wyżywienie i wzrost</span>', () => {
    const st = cfg.getEmpireFoodState?.(city.ownerId);
    const tick = cfg.getEmpireFoodTick?.(city.ownerId);
    return view ? buildRacjeWzrostDetailCard(city, view, st, tick, data) : el('div', 'muted', '—');
  });
  if (!view || !data) { mount.appendChild(el('div', 'muted', '—')); return; }

  const rationParams = buildRationParams(data.econParams, cfg.difficulty ?? 'normal');
  const foodSplit = cityFoodSplit(view);
  const bilansCls = foodSplit.total > 0 ? 'green' : foodSplit.total < 0 ? 'red' : 'gold';
  const bd = view.growthBreakdown;
  const atPopCap = view.atPopCap;
  const tick = cfg.getEmpireFoodTick?.(city.ownerId);
  const cityRow = tick?.perCityRows?.find(r => r.cityId === city.id);
  const fed = resolveCityFedForUi(city.id, foodSplit.total, tick);
  const growthPctUi = effectiveGrowthPctForUi(view.wzrostProcent, fed);
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const osobRazem = cityLudnoscAbsolutna(city.population, epoch);
  const osobNaObywatela = cityLudnoscAbsolutna(1, epoch);
  const growthUi = buildGrowthProgressUi(city.population, view, epoch, fed, atPopCap, growthPctUi);

  const popHero = el('div', 'food-pop-hero');
  popHero.innerHTML =
    `<div class="pop-slots">${cityPanelChipIcon('res-population', 14)} Ludność ${city.population}</div>` +
    `<div class="pop-abs">≈ ${formatManpower(osobRazem)} osób` +
    ` (1 obywatel = ${formatManpower(osobNaObywatela)})</div>`;
  mount.appendChild(popHero);

  const chips: TabIndicatorChip[] = [
    {
      icon: loafIconHtml('civ-v-loaf-chip'),
      label: 'Produkcja',
      value: `${signed(foodSplit.produkcja)}/t`,
      cls: foodSplit.produkcja > 0 ? 'green' : foodSplit.produkcja < 0 ? 'red' : 'muted',
      title: 'Uprawa i hodowla w tym mieście (brutto)',
    },
    {
      icon: loafIconHtml('civ-v-loaf-chip'),
      label: 'Racje',
      value: `−${foodSplit.racje}/t`,
      cls: 'red',
      title: `Koszt wyżywienia przy poziomie ${formatWyzwienieLabel(view.poziomRacji)}`,
    },
    {
      icon: loafIconHtml('civ-v-loaf-chip'),
      label: 'Bilans',
      value: `${signed(foodSplit.total)}/t`,
      cls: bilansCls,
      title: 'Produkcja − racje = bilans lokalny',
    },
    {
      icon: cityPanelChipIcon('chip-map', 14),
      label: 'WZROST%',
      value: fed ? `${view.wzrostProcent}%` : '—',
      cls: fed && view.wzrostProcent > 0 ? 'gold' : fed ? 'muted' : 'red',
      title: fed
        ? 'Łączny procent wzrostu ludności w tej turze'
        : 'Brak wzrostu — miasto nie jest w pełni nakarmione ze Spichlerza',
    },
  ];
  if (!fed) {
    chips.push({
      icon: cityPanelChipIcon('chip-warning', 14),
      label: 'Głód',
      value: 'brak dopłaty',
      cls: 'red',
      title: 'Miasto na minusie bez pokrycia z magazynu centralnego — brak wzrostu',
    });
  }
  if (atPopCap) {
    chips.push({
      icon: cityPanelChipIcon('cp-buildings', 14),
      label: 'Limit',
      value: `max ${view.popCapAktualny}`,
      cls: 'red',
      title: view.maAkwedukt
        ? `Cap ${view.popCapAktualny} z Akweduktem`
        : `Bez Akweduktu max ${view.popCapBezAkweduktu}`,
    });
  } else if (view.maAkwedukt) {
    chips.push({
      icon: cityPanelChipIcon('cp-buildings', 14),
      label: 'Akwedukt',
      value: `cap ${view.popCapZAkweduktem}`,
      cls: 'green',
    });
  }
  appendTabIndicators(mount, chips);

  const bilans = el('div', 'food-bilans-row');
  bilans.innerHTML =
    `<span>Produkcja <span class="pos">${signed(foodSplit.produkcja)}</span> − racje <span class="neg">−${foodSplit.racje}</span></span>` +
    `<span class="${bilansCls}">= ${signed(foodSplit.total)} 🍞/t</span>`;
  mount.appendChild(bilans);

  const player = city.ownerId === 0;
  const rationEditable = player && !!cfg.onCityRationChange;
  const maxSafe = cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX;
  const maxSlider = maxSafe / WYZYWIENIE_STEP;
  const sliderWrap = el('div', 'wyzwienie-w4-sliders');
  const sliderRow = el('div', 'slider-row');
  const sliderLabel = el('label');
  const displayLevel = Math.min(view.poziomRacji, maxSafe);
  const growPct = rationGrowthPercent(displayLevel, rationParams);
  const growTxt = growPct > 0 ? `+${growPct}` : String(growPct);
  sliderLabel.innerHTML =
    `<span>${loafIconHtml('civ-v-loaf-chip')} Wyżywienie</span>` +
    `<span>${formatWyzwienieLabel(displayLevel)} · ${growTxt}%</span>`;
  sliderRow.appendChild(sliderLabel);
  const inp = document.createElement('input');
  inp.type = 'range';
  inp.min = String(WYZYWIENIE_MIN / WYZYWIENIE_STEP);
  inp.max = String(maxSlider);
  inp.step = '1';
  inp.value = String(displayLevel / WYZYWIENIE_STEP);
  inp.disabled = !rationEditable;
  inp.title = maxSafe < WYZYWIENIE_MAX
    ? `Wyżywienie — limit Spichlerza: max ${formatWyzwienieLabel(maxSafe)}`
    : 'Wyżywienie — koszt żywności na mieszkańca i tempo wzrostu ludności';
  if (rationEditable) {
    inp.addEventListener('input', () => {
      const rawLevel = Number(inp.value) * WYZYWIENIE_STEP;
      const level = Math.min(rawLevel, maxSafe);
      if (level < rawLevel) {
        inp.value = String(level / WYZYWIENIE_STEP);
      }
      if (level === view.poziomRacji) return;
      cfg.onCityRationChange?.(city.id, level);
      rerender();
    });
  }
  sliderRow.appendChild(inp);
  sliderWrap.appendChild(sliderRow);
  if (rationEditable && cfg.onCityAutoWyzywienieChange) {
    const autoRow = el('div', 'slider-row auto-wyzywienie-row');
    const autoLabel = el('label');
    autoLabel.style.cssText = 'display:flex;align-items:center;gap:0.35em;cursor:pointer;';
    const autoCb = document.createElement('input');
    autoCb.type = 'checkbox';
    autoCb.checked = city.autoWyzywienie === true;
    autoCb.title =
      'WŁ: automatycznie obniża i podnosi Wyżywienie (Spichlerz ≥ 0). ' +
      'WYŁ: tylko ręczny suwak — bez auto-obniżenia przy deficycie.';
    autoLabel.appendChild(autoCb);
    const autoTxt = document.createElement('span');
    autoTxt.textContent = 'Auto Wyżywienie';
    autoLabel.appendChild(autoTxt);
    autoRow.appendChild(autoLabel);
    autoCb.addEventListener('change', () => {
      cfg.onCityAutoWyzywienieChange?.(city.id, autoCb.checked);
      rerender();
    });
    sliderWrap.appendChild(autoRow);
  }
  const hint = el('div', 'wyzwienie-w4-hint');
  hint.textContent = wyzwienieSummaryLabel(displayLevel, rationParams);
  if (maxSafe < WYZYWIENIE_MAX && rationEditable) {
    hint.textContent += ` · Limit Spichlerza: ${formatWyzwienieLabel(maxSafe)}`;
  }
  if (view.poziomRacji > maxSafe) {
    hint.textContent += ' · poziom zostanie obniżony do limitu na koniec tury';
  }
  if (rationEditable && city.autoWyzywienie !== true) {
    hint.textContent += ' · Auto WYŁ — bez auto-obniżania/podnoszenia';
  }
  sliderWrap.appendChild(hint);
  mount.appendChild(sliderWrap);
  if (!rationEditable && player) {
    const ro = el('div', 'muted');
    ro.style.cssText = 'font-size:0.62em;text-align:center;';
    ro.textContent = 'Suwak Wyżywienie — po wpieciu silnika.';
    mount.appendChild(ro);
  }

  const growBlock = el('div', 'growth-bd-block');
  growBlock.innerHTML =
    `<div class="growth-bd-hd">WZROST ludności</div>` +
    `<div class="growth-bd-total">Łącznie ${fed ? view.wzrostProcent : 0}%${fed ? '' : ' <span class="muted">(brak — głód)</span>'}</div>` +
    growthBreakdownRow('Wyżywienie', bd.racje, true) +
    growthBreakdownRow('Małe miasto', bd.maleMiasto) +
    growthBreakdownRow('Spichlerz', bd.spichlerz) +
    growthBreakdownRow('Zdrowie', bd.zdrowie) +
    growthBreakdownRow('Szczęście', bd.szczescie) +
    growthBreakdownRow('Cywilizacja', bd.cywilizacja) +
    `<div class="growth-progress-block">${growthUi.progressHtml}${growthUi.etaHtml}</div>`;
  mount.appendChild(growBlock);
  const progressBlock = growBlock.querySelector('.growth-progress-block') as HTMLElement | null;
  if (progressBlock) {
    attachHoverDetail(
      progressBlock,
      () => buildGrowthProgressTooltipCard(city.population, view, epoch, fed, atPopCap, growthPctUi),
      220,
      'left',
    );
  }
}

function buildRacjeWzrostDetailCard(
  city: City,
  view: CityView,
  st: EmpireFoodState | null | undefined,
  tick: EmpireFoodTick | null | undefined,
  data: GameData | null,
): HTMLDivElement {
  const rationParams = data ? buildRationParams(data.econParams, cfg.difficulty ?? 'normal') : null;
  const foodSplit = cityFoodSplit(view);
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const tickRow = tick?.perCityRows?.find(r => r.cityId === city.id);
  const fed = resolveCityFedForUi(city.id, foodSplit.total, tick);
  const growthPctUi = effectiveGrowthPctForUi(view.wzrostProcent, fed);
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Wyżywienie i wzrost — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    'Lokalnie: produkcja żywności minus koszt racji = bilans miasta. Nadwyżka trafia do magazynu centralnego, niedobór jest pokrywany stamtąd.',
  );
  card.appendChild(intro);

  appendDetailSection(card, 'Ludność miasta');
  const g0 = appendDetailGrid(card);
  const osobRazem = cityLudnoscAbsolutna(city.population, epoch);
  gridDetailRow(g0, 'Obywatele (sloty)', String(city.population));
  gridDetailRow(g0, 'Ludność absolutna', `≈ ${formatManpower(osobRazem)} osób`);
  gridDetailRow(g0, 'Skala epoki', `1 obywatel = ${formatManpower(cityLudnoscAbsolutna(1, epoch))}`);

  appendDetailSection(card, 'Bilans lokalny (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Produkcja brutto', `${signed(foodSplit.produkcja)} 🍞/t`);
  gridDetailRow(g1, 'Koszt wyżywienia', `−${foodSplit.racje} 🍞/t (Wyżywienie ${formatWyzwienieLabel(view.poziomRacji)})`);
  gridDetailRow(g1, 'Bilans', `${signed(foodSplit.total)} 🍞/t`);
  if (rationParams) {
    gridDetailRow(g1, 'Wyżywienie', wyzwienieSummaryLabel(view.poziomRacji, rationParams));
  }

  appendDetailSection(card, 'WZROST% — składniki');
  const g2 = appendDetailGrid(card);
  const bd = view.growthBreakdown;
  gridDetailRow(g2, 'Wyżywienie', `${signed(bd.racje)}%`);
  gridDetailRow(g2, 'Małe miasto', `${signed(bd.maleMiasto)}%`);
  gridDetailRow(g2, 'Spichlerz', `${signed(bd.spichlerz)}%`);
  gridDetailRow(g2, 'Zdrowie', `${signed(bd.zdrowie)}%`);
  gridDetailRow(g2, 'Szczęście', `${signed(bd.szczescie)}%`);
  gridDetailRow(g2, 'Cywilizacja', `${signed(bd.cywilizacja)}%`);
  gridDetailRow(g2, 'Łącznie', fed ? `${view.wzrostProcent}%` : '— (głód)');
  gridDetailRow(g2, 'Postęp do +1 obywatela', `${fmtDecPl(view.wzrostUlamkowy)} / 1`);
  const gainSlots = growthGainPerTurnSlots(city.population, growthPctUi, fed, view.atPopCap);
  const turns = turnsUntilNextCitizen(view.wzrostUlamkowy, gainSlots);
  gridDetailRow(
    g2,
    'Kolejny obywatel',
    view.atPopCap ? 'limit ludności'
      : !fed ? 'brak — głód'
        : turns === 0 ? 'w tej turze'
          : turns != null ? `za ≈ ${turns} ${pluralTur(turns)}`
            : '—',
  );

  appendDetailFormula(card, 'bilans = produkcja_brutto − (ludność × koszt_racji)');
  appendDetailFormula(card, 'wzrost = ludność × WZROST% / 100 — ułamek <1 zostaje w buforze na kolejną turę');

  if (view.maSpichlerz || view.maAkwedukt) {
    appendDetailSection(card, 'Budynki wpływające na wzrost');
    const gB = appendDetailGrid(card);
    if (view.maSpichlerz) {
      gridDetailRow(gB, 'Spichlerz', `+${bd.spichlerz}% WZROST · niższy koszt racji (Ceramika −25%, pełny II −50%)`);
    }
    if (view.maAkwedukt) {
      gridDetailRow(gB, 'Akwedukt', `Limit ludności ${view.popCapZAkweduktem} (bez niego max ${view.popCapBezAkweduktu})`);
    }
  }

  if (tick) {
    appendDetailSection(card, 'Magazyn centralny (ostatnia tura)');
    const g3 = appendDetailGrid(card);
    gridDetailRow(g3, 'Uprawa i hodowla', `+${Math.round(tick.uprawaHodowla)} 🍞`);
    gridDetailRow(g3, 'Wyżywienie ludności', `−${Math.round(tick.wyzwienieLudnosci)} 🍞`);
    gridDetailRow(g3, 'Pomoc miastom', `−${Math.round(tick.pomocMiastom)} 🍞`);
    gridDetailRow(g3, 'Wojsko', `−${Math.round(tick.wojsko)} 🍞`);
    gridDetailRow(g3, 'W magazynie', `${Math.round(st?.zapasyPanstwa ?? tick.zapasyPo)} / ${Math.round(tick.maxCap)} 🍞`);
  }

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Suwak Wyżywienie (0–6) — koszt żywności i tempo wzrostu tego miasta.',
    'Magazyn centralny — panel imperium (Spichlerz stolicy).',
    'Pola 🌾 w okolicy — podnoszą produkcję brutto.',
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
  const tick = cfg.getEmpireFoodTick?.(city.ownerId);
  const st = cfg.getEmpireFoodState?.(city.ownerId);
  const foodSplit = cityFoodSplit(view);
  const rationParams = data ? buildRationParams(data.econParams, cfg.difficulty ?? 'normal') : null;

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = `<span>${loafIconHtml('civ-v-loaf-chip')} Żywność — co to znaczy</span>`;
  card.appendChild(head);

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Bilans lokalny tego miasta: produkcja żywności minus koszt racji. Nadwyżka idzie do magazynu centralnego.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku miasta');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Zielony dopisek', `${signed(foodSplit.total)} — bilans lokalny (produkcja − racje)`);
  gridDetailRow(g0, 'WZROST%', `${view.wzrostProcent}% — tempo wzrostu ludności`);

  appendDetailSection(card, 'Skąd bierze się żywność (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Produkcja brutto', `${signed(foodSplit.produkcja)} 🍞/t`);
  gridDetailRow(g1, 'Koszt wyżywienia', `−${foodSplit.racje} 🍞/t (Wyżywienie ${formatWyzwienieLabel(view.poziomRacji)})`);
  gridDetailRow(g1, 'Bilans lokalny', `${signed(foodSplit.total)} 🍞/t`);
  if (rationParams) {
    gridDetailRow(g1, 'Wyżywienie aktywne', wyzwienieSummaryLabel(view.poziomRacji, rationParams));
  }

  appendDetailSection(card, 'WZROST ludności');
  const g2 = appendDetailGrid(card);
  const bd = view.growthBreakdown;
  gridDetailRow(g2, 'Łącznie', `${view.wzrostProcent}%`);
  gridDetailRow(g2, 'Ułamek', view.wzrostUlamkowy.toFixed(2));
  gridDetailRow(g2, 'Składniki', `racje ${bd.racje}% · małe miasto ${bd.maleMiasto}% · Spichlerz ${bd.spichlerz}%`);

  if (tick) {
    appendDetailSection(card, 'Magazyn centralny (ostatnia tura)');
    const g3 = appendDetailGrid(card);
    gridDetailRow(g3, 'W magazynie', `${Math.round(st?.zapasyPanstwa ?? tick.zapasyPo)} / ${Math.round(tick.maxCap)} 🍞`);
    gridDetailRow(g3, 'Pomoc miastom', `−${Math.round(tick.pomocMiastom)} 🍞`);
    gridDetailRow(g3, 'Wojsko', `−${Math.round(tick.wojsko)} 🍞`);
  }

  appendDetailFormula(card, 'bilans = produkcja_brutto − koszt_racji');
  appendDetailFormula(card, 'wzrost = ludność × WZROST% / 100');

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → Wyżywienie i wzrost: suwak Wyżywienie 0–6.',
    'Mapa okolicy → przypisz 👤 na pola żywnościowe (🌾).',
    'Magazyn centralny → panel imperium (Spichlerz stolicy).',
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
    'Pula rekrutów tego miasta (składnik sumy imperium). Werb jednostki zużywa rekrutów ' +
    'z puli całej cywilizacji — ludność miasta nie spada. ' +
    'Zwiadowca — 0 kosztu Manpower. Co turę pula rośnie (regen), chyba że miasto jest oblężone.';
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
    'Regen = % max (parametr balansu, patrz "Odnowa" wyżej) × bonus cywilizacji (np. Rzym ×2).',
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
  const health = data && map
    ? resolveCityHealth(city, map, data)
    : null;
  const osobRazem = cityLudnoscAbsolutna(city.population, epoch);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>👥 Ludność — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Liczba przy nazwie miasta to wyłącznie mieszkańcy tego grodu — nie całego państwa. ' +
    'Wpływa na koszt racji, limit pól do pracy (👤) i koszty utrzymania.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 👥', `${city.population} — obywatele (sloty) tego miasta`);
  gridDetailRow(g0, 'Ludność absolutna', `≈ ${formatManpower(osobRazem)} osób`);
  gridDetailRow(g0, 'Epoka', String(epoch));
  gridDetailRow(g0, 'WZROST%', view ? `${view.wzrostProcent}%` : '—');

  if (view) {
    const foodSplit = cityFoodSplit(view);
    const tick = cfg.getEmpireFoodTick?.(city.ownerId);
    const tickRow = tick?.perCityRows?.find(r => r.cityId === city.id);
    const fed = resolveCityFedForUi(city.id, foodSplit.total, tick);
    const growthPctUi = effectiveGrowthPctForUi(view.wzrostProcent, fed);
    const gainSlots = growthGainPerTurnSlots(city.population, growthPctUi, fed, view.atPopCap);
    const turns = turnsUntilNextCitizen(view.wzrostUlamkowy, gainSlots);
    appendDetailSection(card, 'Wzrost ludności');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Wyżywienie', formatWyzwienieLabel(view.poziomRacji));
    gridDetailRow(g1, 'WZROST%', fed ? `${view.wzrostProcent}%` : '— (głód)');
    gridDetailRow(g1, 'Postęp do +1', `${fmtDecPl(view.wzrostUlamkowy)} / 1 obywatela`);
    gridDetailRow(
      g1,
      'Kolejny obywatel',
      view.atPopCap ? 'limit ludności'
        : !fed ? 'brak — głód'
          : turns === 0 ? 'w tej turze'
            : turns != null ? `za ≈ ${turns} ${pluralTur(turns)}`
              : '—',
    );
    gridDetailRow(g1, 'Bilans żywności', `${signed(view.bilansLokalny)} 🍞/t`);
    if (view.atPopCap) {
      gridDetailRow(g1, 'Limit', `max ${view.popCapAktualny} mieszkańców`);
    }
  }

  if (health) {
    appendDetailSection(card, 'Zdrowie (wpływ na wzrost)');
    const gh = appendDetailGrid(card);
    gridDetailRow(gh, 'Zdrowie łącznie', `${health.total >= 0 ? '+' : ''}${health.total}`);
    for (const l of health.lines.slice(0, 6)) {
      gridDetailRow(gh, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  appendDetailFormula(card, 'wzrost = ludność × WZROST% / 100 — ułamek <1 zostaje w buforze');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → Wyżywienie i wzrost: suwak Wyżywienie 0–6.',
    'Mapa okolicy → max 👤 obok centrum = populacja (kto pracuje pola).',
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
  gridDetailRow(g0, 'Niebieski dopisek', `${signed(pracaSplit.doUlepszen)} — ten gród → pula imperium (${pctU}%)`);
  gridDetailRow(g0, 'Suma miast', empireSum > 0 ? `${signed(empireSum)} łącznie z wszystkich grodów` : '—');

  appendDetailSection(card, 'Skąd bierze się praca (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Praca brutto', `${signed(pracaSplit.total)} 🔨`);
  gridDetailRow(g1, '→ Budynki', `${signed(pracaSplit.doBudynkow)} — postęp w kolejce produkcji`);
  gridDetailRow(g1, '→ Pula imperium', `${signed(pracaSplit.doUlepszen)} — zapas cywilizacji (załóż miasto, projekty mapy)`);

  appendDetailFormula(card, 'doBudynkow = round(praca × %Budynki)');
  appendDetailFormula(card, 'doPuli = praca − doBudynkow  (nigdy nie gubi reszty)');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Lewa kolumna → „Podział pracy”: suwak 🏛 vs 📦 pula (per miasto).',
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
  const daninaLbl = daninaLabelForCity(city);
  const daninaLblGen = daninaLabelGenitive(daninaLbl);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>💰 Pieniądz — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Skarbiec imperium to gotówka na wykupy, rekrutację za złoto i utrzymanie. Poniżej: bilans całego państwa oraz wpływ tego miasta.';
  card.appendChild(intro);

  const moneySnap = cfg.getCityMoneySnap?.(city.id);

  appendDetailSection(card, 'Skarbiec imperium (bilans / turę)');
  const gImp = appendDetailGrid(card);
  const wplywy = empire.bogactwoWplywyBrutto ?? 0;
  const handel = empire.bogactwoHandel ?? 0;
  const utrzB = empire.bogactwoUtrzymanieBudynkow ?? 0;
  const utrzRes = empire.bogactwoUtrzymanieSurowcowBudynkow ?? {};
  const utrzJ = empire.bogactwoUtrzymanieJednostek ?? 0;
  const netto = empire.bogactwoRate ?? empire.zlotoRate ?? 0;
  gridDetailRow(gImp, 'Stan skarbca', `${skarb}`);
  gridDetailRow(gImp, 'Wpływy brutto', signed(wplywy - handel));
  gridDetailRow(gImp, 'Handel ze szlaków', signed(handel));
  gridDetailRow(gImp, 'Utrzymanie budynków', utrzB > 0 ? `−${utrzB}` : '—');
  gridDetailRow(gImp, 'Utrzymanie surowców budynków', formatResourceUpkeepSummary(utrzRes));
  gridDetailRow(gImp, 'Utrzymanie jednostek', utrzJ > 0 ? `−${utrzJ}` : '—');
  gridDetailRow(gImp, 'Netto / turę', signed(netto));

  appendDetailSection(card, 'Ten gród — przychody i koszty lokalne');
  const gCity = appendDetailGrid(card);
  if (moneySnap) {
    gridDetailRow(gCity, 'Pieniądz brutto', signed(moneySnap.pieniadzBrutto));
    gridDetailRow(gCity, 'Mnożnik zamożności W', `×${moneySnap.wealthMnoznik.toFixed(2)}`);
    gridDetailRow(gCity, 'Handel ze szlaków', signed(moneySnap.handelZeSzlakow));
    gridDetailRow(gCity, '→ Do skarbca imperium', signed(moneySnap.doSkarbca));
    gridDetailRow(gCity, 'Utrzymanie budynków', moneySnap.utrzymanieBudynkow > 0 ? `−${moneySnap.utrzymanieBudynkow}` : '—');
    gridDetailRow(gCity, 'Utrzymanie surowców budynków', formatResourceUpkeepSummary(moneySnap.utrzymanieSurowcowBudynkow ?? {}));
    gridDetailRow(gCity, 'Utrzymanie garnizonu', moneySnap.utrzymanieGarnizonu > 0 ? `−${moneySnap.utrzymanieGarnizonu}` : '—');
    gridDetailRow(gCity, 'Nauka (osobny bank)', signed(moneySnap.nauka));
  } else {
    gridDetailRow(gCity, 'Wpływ do skarbca', signed(cityMoney));
  }

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 💰', `${skarb} — skarbiec całego państwa`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityMoney)} — netto z tego grodu do skarbca`);

  appendDetailSection(card, 'Skąd bierze się pieniądz (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Plony + budynki', 'Targowisko, Mennica, podatki z pól — patrz okolica.');
  gridDetailRow(g1, `Podział ${daninaLblGen}`, `${split.procentPieniadz}% Skarb · ${split.procentNauka}% Nauka · ${split.procentLuksus}% Zamożność`);
  if (est.netto) {
    gridDetailRow(g1, `${daninaLbl} netto (szac.)`, `~${est.netto} → split suwaków`);
    gridDetailRow(g1, '→ do Skarbu', est.skarb ? `~+${est.skarb}` : '—');
  }
  gridDetailRow(g1, 'Zamożność W', `W${ws.poziom} — część ${daninaLblGen} karmi pulę W (mnożnik podatków)`);

  appendDetailFormula(card, 'pieniadzNetto = podatki + handel_netto + budynki − utrzymanie');
  appendDetailFormula(card, 'Skarbiec += Σ pieniadzNetto_miast − wydatki');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    `Prawa kolumna → „Podział ${daninaLblGen}”: Skarb vs Nauka vs Zamożność.`,
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

/**
 * TEMAT #6 (2026-07-23): koszt surowcowy budynku (cegła/ceramika — buildings.json
 * `koszt_surowce`) pobierany z magazynu MIASTA (City.surowce) RAZ, przy starcie
 * budowy (enqueue) — nie przy ukończeniu. Pusty obiekt = budynek bez kosztu
 * surowcowego (zachowanie sprzed TEMAT #6). Patrz game/building-stock-cost.ts.
 */
function buildingStockCostForItem(item: ProductionItem): Record<string, number> {
  if (item.kind !== 'budynek') return {};
  const def = gameData()?.buildings.find(b => b.id === item.id);
  return buildingStockCost(def);
}

/**
 * JEDNOSTKI-SUROWIEC-01 (Maciej 2026-07-24): koszt surowcowy jednostki (units.json
 * `Surowiec` / `Surowiec (ilość)`) pobierany z puli PAŃSTWA RAZ, przy starcie budowy
 * (enqueue) -- symetrycznie z buildingStockCostForItem powyżej. Puste dla jednostek
 * bez surowca (Surowiec='-' lub ilość<=0). Patrz game/building-stock-cost.ts unitStockCost.
 */
function unitStockCostForItem(item: ProductionItem): Record<string, number> {
  if (item.kind !== 'jednostka') return {};
  const def = gameData()?.units.find(u => u.Jednostka === item.id);
  return unitStockCost(def);
}

/** Koszt surowcowy pobrany przy enqueue — do zwrotu przy anulowaniu z kolejki. */
function stockCostForQueueItem(item: ProductionItem): Record<string, number> {
  if (item.kind === 'budynek') return buildingStockCostForItem(item);
  if (item.kind === 'jednostka') return unitStockCostForItem(item);
  return {};
}

/** Usuń pozycję z kolejki Pracy i zwróć jednorazowy koszt surowcowy do puli państwa. */
function cancelQueueItem(city: City, index: number): void {
  const prod = getProd(city.id);
  if (index < 0 || index >= prod.kolejka.length) return;
  const item = prod.kolejka[index] as ProductionItem;
  const cost = stockCostForQueueItem(item);
  if (Object.keys(cost).length > 0) {
    refundBuildingStockCostAcrossCities(cfg.getCities?.() ?? [city], city.ownerId, cost);
  }
  setProd(city.id, dequeue(prod, index));
  rerender();
}

/**
 * SUROW-CIV-01 (Maciej 2026-07-24): magazyn surowcow = pula PANSTWA (civ-wide, suma po
 * WSZYSTKICH miastach ownera), nie tylko lokalne City.surowce. Brak cfg.getCities (np.
 * testy panelu bez pelnego silnika) -> fallback na [city] (zachowanie sprzed SUROW-CIV-01).
 * OWNERID-AGNOSTIC: dziala identycznie dla gracza i kazdej cywilizacji AI (ownerId zwykly
 * parametr, panel miasta nie ma pojecia "gracz vs AI").
 */
function ownerSurowcePoolFor(city: City): Record<string, number> {
  const allCities = cfg.getCities?.() ?? [city];
  return ownerResourceStockAll(allCities, city.ownerId);
}

/**
 * SUROW-UI-B1 (Maciej 2026-07-24): kolejność surowców magazynowanych (pula PAŃSTWA,
 * civ-wide) w paskach uproszczonych — Ceramika CELOWO pominięta (dostęp, nie stock —
 * patrz main.ts buildEmpireResourceRows). Klucze ASCII zgodne z City.surowce /
 * STOCK_RESOURCE_LABEL (game/building-stock-cost.ts).
 */
const CS_RES_STRIP_ORDER: readonly string[] = [
  'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'cegla', 'braz', 'zelazo', 'stal',
];

/** Rdzeń paska budowy — ZAWSZE widoczny, także przy 0 (podstawowe materiały budowlane),
 *  żeby UI surowców był obecny od tury 1 (C-SURUI=A, Maciej 2026-07-24). */
const CS_RES_STRIP_CORE: ReadonlySet<string> = new Set(['drewno', 'kamien']);

/** Rozmiar ikon surowców na pasku budowy/rekrutacji (2× względem pierwotnych 16px). */
const CS_RES_STRIP_ICON_PX = 32;

/**
 * SUROW-UI-B1: pasek „ikona + ilość" surowców magazynowanych (pula PAŃSTWA ownera) —
 * forma uproszczona wg mockupu (Total War-style, bez przyrostu/turę — w mieście liczy
 * się tylko „ile mam"). C-SURUI=A: rdzeń (drewno+kamień) pokazywany ZAWSZE, także przy 0;
 * pozostałe surowce tylko gdy owner ma > 0 (żeby nie zaśmiecać zerami metali/rud epok, których
 * jeszcze nie ma). Dzięki temu pasek jest widoczny od startu gry, a nie chowa się przy pustej puli.
 */
function appendCityResourceStockStrip(mount: HTMLElement, city: City): void {
  const pool = ownerSurowcePoolFor(city);
  const entries = CS_RES_STRIP_ORDER
    .map(k => ({ k, v: Math.floor(pool[k] ?? 0) }))
    .filter(e => e.v > 0 || CS_RES_STRIP_CORE.has(e.k));
  if (entries.length === 0) return;
  const strip = el('div', 'civ-cs-res-strip');
  for (const e of entries) {
    const label = stockResourceLabel(e.k);
    const chip = el('span', 'civ-cs-res-chip');
    chip.title = label;
    const ic = el('span', 'civ-cs-res-chip-ic');
    ic.innerHTML = mapResourceIconSvg(label, CS_RES_STRIP_ICON_PX);
    chip.appendChild(ic);
    const val = el('b');
    val.textContent = String(e.v);
    chip.appendChild(val);
    strip.appendChild(chip);
  }
  mount.appendChild(strip);
}

/**
 * SUROW-UI-B2 (Maciej 2026-07-24): pasek rekrutacji — TYLKO surowiec militarny epoki
 * (Brąz w epoce 2, Żelazo w epoce 3) — jedyny, którym płaci się za jednostki. Epoka
 * Kamienia (1) nie ma surowca militarnego jeszcze -> pasek pusty (nic nie renderuje).
 */
function appendRecruitMilitaryResourceStrip(mount: HTMLElement, city: City): void {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const key = epoch === 2 ? 'braz' : (epoch === 3 ? 'zelazo' : null);
  if (!key) return;
  const pool = ownerSurowcePoolFor(city);
  const qty = Math.floor(pool[key] ?? 0);
  const label = stockResourceLabel(key);
  const eraName = EPOCH_NUMBER_TO_NAME[epoch] ?? `Epoka ${epoch}`;
  const strip = el('div', 'civ-cs-res-strip civ-cs-mil-strip');
  const eraTag = el('span', 'civ-cs-mil-era');
  eraTag.textContent = `Epoka ${eraName}`;
  strip.appendChild(eraTag);
  const chip = el('span', 'civ-cs-res-chip');
  chip.title = `${label} — pula państwa`;
  const ic = el('span', 'civ-cs-res-chip-ic');
  ic.innerHTML = mapResourceIconSvg(label, CS_RES_STRIP_ICON_PX);
  chip.appendChild(ic);
  const val = el('b');
  val.textContent = String(qty);
  chip.appendChild(val);
  strip.appendChild(chip);
  mount.appendChild(strip);
}

function addItem(city: City, item: ProductionItem, opts?: { upgrade?: boolean }): void {
  if (item.kind === 'budynek') {
    const prod = getProd(city.id);
    if (buildingTypeQueued(item.id, prod.kolejka)) return;
    if (!opts?.upgrade) {
      const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
      if (built.includes(item.id)) return;
    }
    const cost = buildingStockCostForItem(item);
    if (Object.keys(cost).length > 0) {
      if (!canAffordBuildingStock(ownerSurowcePoolFor(city), cost)) return; // blokada: pula panstwa nie starcza
      // pobór RAZ, przy starcie budowy — rozłożony po miastach ownera (pula PAŃSTWA).
      deductBuildingStockCostAcrossCities(cfg.getCities?.() ?? [city], city.ownerId, cost);
    }
  } else if (item.kind === 'jednostka') {
    // JEDNOSTKI-SUROWIEC-01: identyczny wzorzec jak budynki powyżej -- pobór RAZ przy
    // enqueue do kolejki Pracy; anulowanie (cancelQueueItem) zwraca surowiec symetrycznie.
    const cost = unitStockCostForItem(item);
    if (Object.keys(cost).length > 0) {
      if (!canAffordBuildingStock(ownerSurowcePoolFor(city), cost)) return; // blokada: pula panstwa nie starcza
      deductBuildingStockCostAcrossCities(cfg.getCities?.() ?? [city], city.ownerId, cost);
    }
  }
  setProd(city.id, enqueue(getProd(city.id), item));
  rerender();
}

function applyBuildButtonVisualState(btn: HTMLButtonElement, canAct: boolean, title: string): void {
  btn.disabled = !canAct;
  btn.title = title;
  btn.classList.remove('can-build', 'cannot-build');
  btn.classList.add(canAct ? 'can-build' : 'cannot-build');
}

/** Kup (zloty, lewo) + Buduj/Ulepsz (Praca, niebieski, prawo). */
function appendBuildActionButtons(
  btnWrap: HTMLElement,
  city: City,
  item: ProductionItem,
  skarb: number | undefined,
  buildLabel: 'Buduj' | 'Ulepsz',
  upgrade?: boolean,
  opts?: { requirementsMet?: boolean; showPurchase?: boolean },
): void {
  const goldKoszt = buildingGoldPurchaseCost(item.koszt);
  const purchaseHook = !!cfg.onPurchaseBuilding && !!cfg.getTreasury;
  const stac = skarb === undefined ? true : skarb >= goldKoszt;
  const stockCost = buildingStockCostForItem(item);
  const missing = missingStockFor(ownerSurowcePoolFor(city), stockCost); // SUROW-CIV-01: pula PAŃSTWA
  const stockOk = Object.keys(missing).length === 0;
  const canBuild = opts?.requirementsMet ?? stockOk;
  const showPurchase = opts?.showPurchase !== false;

  if (showPurchase) {
    const bBuy = el('button', 'btn btn-sm btn-g', 'Kup') as HTMLButtonElement;
    const canBuy = !!(purchaseHook && stac && canBuild);
    let buyTitle: string;
    if (!purchaseHook) buyTitle = 'Wymaga wpiecia onPurchaseBuilding przez silnik';
    else if (!canBuild) buyTitle = 'Najpierw spełnij wymagania budowy';
    else if (!stac) buyTitle = `Za malo zlota (${skarb ?? 0}/${goldKoszt})`;
    else buyTitle = `Kup natychmiast za ${goldKoszt} złota (×2 kosztu Pracy)`;
    applyBuildButtonVisualState(bBuy, canBuy, buyTitle);
    bBuy.addEventListener('click', () => {
      if (!canBuy) return;
      cfg.onPurchaseBuilding?.(city.id, item, goldKoszt);
      rerender();
    });
    btnWrap.appendChild(bBuy);
  }

  const bBuild = el('button', 'btn btn-sm btn-b', buildLabel) as HTMLButtonElement;
  const buildTitle = canBuild
    ? `Dodaj do kolejki · ${item.koszt} pracy`
    : (!stockOk
      ? 'Brakuje w magazynie: ' + Object.entries(missing)
        .map(([k, v]) => `${v} ${stockResourceLabel(k)}`)
        .join(', ')
      : 'Nie spełniono wymagań budowy — najedź po szczegóły');
  applyBuildButtonVisualState(bBuild, canBuild, buildTitle);
  bBuild.addEventListener('click', () => {
    if (!canBuild) return;
    addItem(city, item, upgrade ? { upgrade: true } : undefined);
  });
  btnWrap.appendChild(bBuild);
}

/** Wyłączony zestaw Kup + Buduj na wierszu podglądu (zablokowane budynki). */
function appendDisabledBuildActionButtons(
  btnWrap: HTMLElement,
  buildLabel: 'Buduj' | 'Ulepsz',
  lockHint: string,
  opts?: { showPurchase?: boolean },
): void {
  if (opts?.showPurchase !== false) {
    const bBuy = el('button', 'btn btn-sm btn-g', 'Kup') as HTMLButtonElement;
    applyBuildButtonVisualState(bBuy, false, lockHint);
    btnWrap.appendChild(bBuy);
  }
  const bBuild = el('button', 'btn btn-sm btn-b', buildLabel) as HTMLButtonElement;
  applyBuildButtonVisualState(bBuild, false, lockHint);
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

/** Poziom budynku do wyświetlenia w katalogu / karcie (C-PRZYROST=A — jak silnik). */
function buildingUiDisplayLevel(def: BuildingDef, city?: City): number {
  if (!city) return 1;
  return buildingOwnedLevel(def, city);
}

/** Przychód budynku na turę — wartość z buildingEffectAtLevel (C-PRZYROST=A). */
function formatBuildingYieldDetailValue(baza: number, przyrost: number, level: number): string {
  const effect = buildingEffectAtLevel(baza, przyrost, level);
  if (effect === 0 && baza === 0 && przyrost === 0) return '—';
  const sign = effect >= 0 ? '+' : '';
  const main = `${sign}${effect} pkt/turę`;
  if (przyrost !== 0 && level > 1) {
    return `${main} (poziom ${level}: baza ${baza} + przyrost ${przyrost} × ${level - 1})`;
  }
  return main;
}

/** Skrót przychodu na chipie infokarty budynku — realna wartość na poziomie miasta. */
function formatBuildingYieldChipText(baza: number, przyrost: number, label: string, level: number): string {
  const effect = buildingEffectAtLevel(baza, przyrost, level);
  const sign = effect >= 0 ? '+' : '';
  const base = `${sign}${effect} ${label}/turę`;
  if (level > 1) return `${base} (L${level})`;
  return base;
}

/** Wiersze skali L1…Ln gdy budynek rośnie z epoką miasta (bez mylącego „+X/poz.”). */
function formatBuildingYieldScaleRow(def: BuildingDef, baza: number, przyrost: number): string | null {
  if (przyrost === 0 || def.maksPoziom <= 1) return null;
  const parts: string[] = [];
  for (let l = 1; l <= def.maksPoziom; l++) {
    const v = buildingEffectAtLevel(baza, przyrost, l);
    parts.push(`L${l}: ${v >= 0 ? '+' : ''}${v}`);
  }
  return parts.join(' · ');
}

/** Chipy bonusów (max 3) — mockup Poziom B budynków 1E. */
function buildingBonusChipsHtml(
  def: BuildingDef,
  buildings: readonly BuildingDef[],
  max = 3,
  level = 1,
): string {
  const chips: string[] = [];
  for (const y of YIELD_BRAND) {
    if (chips.length >= max) break;
    const base = def.baza[y.key] ?? 0;
    const inc = def.przyrost[y.key] ?? 0;
    if (base === 0 && inc === 0) continue;
    const val = formatBuildingYieldChipText(base, inc, y.label, level);
    chips.push(
      `<span class="bld-infocard-chip">${yieldBrandIconHtml(y.brandId, 13)}${val}</span>`,
    );
  }
  // Sciezki ulepszen jednostek (2026-07-25, druga tura -- suma lancucha
  // upgradeFrom): mnoznik nie idzie juz do Pracy -- pokaz PRAWDZIWY,
  // SKUMULOWANY efekt (Pancerz / Parametry, wlasny % + cala sciezka
  // poprzednikow) tylko dla 6 rozpoznanych budynkow; dla reszty
  // (Targowisko/Akademia/Pretorium) mnoznik jest odtad calkowicie martwy,
  // wiec chip znika (nie obiecujemy nieistniejacego).
  const role = mnoznikRoleForBuildingId(def.id);
  if (role) {
    const cumulative = cumulativeMnoznikForBuildingId(def.id, buildings);
    if (cumulative !== 0 && chips.length < max) {
      const label = role === 'pancerz' ? 'Pancerz' : 'Parametry';
      chips.push(`<span class="bld-infocard-chip">+${cumulative}% ${label}</span>`);
    }
  }
  const defenseProc = buildingStructuralDefenseBonusPercent(def.id);
  if (defenseProc != null && chips.length < max) {
    chips.push(
      `<span class="bld-infocard-chip">${yieldBrandIconHtml('chip-garrison', 13)}+${defenseProc}% Obrona</span>`,
    );
  }
  return chips.join('');
}

function buildingOwnedLevel(def: BuildingDef, city: City): number {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  return buildingLevelForEpoch(
    def.epokaWejscia,
    epoch,
    def.maksPoziom,
    def.poziomTechGate ?? null,
    techs,
  );
}

function sumOwnedBuildingsUpkeep(built: readonly string[], data: GameData, city: City): number {
  let sum = 0;
  for (const id of built) {
    const def = data.buildings.find(b => b.id === id);
    if (!def) continue;
    sum += buildingUpkeep(def as unknown as BuildingRecord, buildingOwnedLevel(def, city));
  }
  return sum;
}

/** Skompresowane chipy bonusów zbudowanego budynku (poziom epoki miasta). */
function buildingOwnedBonusCompactHtml(
  def: BuildingDef,
  level: number,
  buildings: readonly BuildingDef[],
  opts?: { max?: number; iconSize?: BrandIconSize; compact?: boolean },
): string {
  const max = opts?.max ?? (opts?.compact ? 3 : 5);
  const iconSize = opts?.iconSize ?? (opts?.compact ? 8 : 10);
  const chips: string[] = [];
  for (const y of YIELD_BRAND) {
    if (chips.length >= max) break;
    const val = buildingEffectAtLevel(def.baza[y.key] ?? 0, def.przyrost[y.key] ?? 0, level);
    if (val === 0) continue;
    chips.push(
      `<span class="bld-owned-chip">${val > 0 ? '+' : ''}${val}${yieldBrandIconHtml(y.brandId, iconSize)}</span>`,
    );
  }
  const role = mnoznikRoleForBuildingId(def.id);
  if (role && chips.length < max) {
    const cumulative = cumulativeMnoznikForBuildingId(def.id, buildings);
    if (cumulative !== 0) {
      chips.push(`<span class="bld-owned-chip">+${cumulative}%</span>`);
    }
  }
  if (chips.length === 0) return '';
  return opts?.compact
    ? chips.join('<span class="bld-owned-sep">·</span>')
    : chips.join('');
}

/**
 * TEMAT #6 / SUROW-CIV-01: chip(y) kosztu surowcowego budynku (koszt_surowce w
 * buildings.json, np. cegła/ceramika) obok kosztów Pracy/Pieniądza — czerwony gdy
 * pula PAŃSTWA ownera (suma City.surowce po wszystkich miastach) nie starcza.
 * Pusty string gdy budynek nie ma kosztu surowcowego.
 */
function buildingStockCostChipsHtml(def: BuildingDef, city: City | undefined): string {
  const cost = buildingStockCost(def);
  const keys = Object.keys(cost);
  if (keys.length === 0) return '';
  const pool = city !== undefined ? ownerSurowcePoolFor(city) : undefined;
  const chips: BuildingReqChip[] = keys.map(k => {
    const need = cost[k]!;
    const have = pool?.[k] ?? 0;
    const met = pool !== undefined && have >= need;
    return {
      label: pool !== undefined
        ? `${need} ${stockResourceLabel(k)} (masz ${have})`
        : `${need} ${stockResourceLabel(k)}`,
      met,
      kind: 'stock' as const,
    };
  });
  return buildingRequirementChipsHtml(chips);
}

const BUILDING_UPKEEP_ZERO_LABEL = 'utrzymanie zero';

function formatResourceUpkeepText(
  resources: Record<string, number>,
  compact: boolean,
): string {
  const keys = Object.keys(resources);
  if (keys.length === 0) return '';
  return keys
    .map(k => (compact
      ? `−${resources[k]} ${stockResourceLabel(k)}`
      : `−${resources[k]} ${stockResourceLabel(k)}/t`))
    .join(' · ');
}

function buildingUpkeepDisplay(
  def: BuildingDef,
  level: number,
): { gold: number; resources: Record<string, number> } {
  return {
    gold: buildingUpkeep(def as unknown as BuildingRecord, level),
    resources: buildingResourceUpkeep(def),
  };
}

function sumOwnedBuildingsResourceUpkeep(
  built: readonly string[],
  data: GameData,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of built) {
    const def = data.buildings.find(b => b.id === id);
    if (!def) continue;
    addResourceCosts(out, buildingResourceUpkeep(def));
  }
  return out;
}

function formatBuildingUpkeepGridValue(display: { gold: number; resources: Record<string, number> }): string {
  if (display.gold === 0 && Object.keys(display.resources).length === 0) {
    return BUILDING_UPKEEP_ZERO_LABEL;
  }
  const parts: string[] = [];
  if (display.gold > 0) {
    parts.push(`${display.gold} ${cityPanelChipIconWrap('res-treasury', 14)}`);
  }
  const res = formatResourceUpkeepText(display.resources, false);
  if (res) parts.push(res);
  return parts.join(' + ');
}

function formatBuildingUpkeepRowHtml(
  display: { gold: number; resources: Record<string, number> },
  compact: boolean,
): string {
  if (display.gold === 0 && Object.keys(display.resources).length === 0) {
    return BUILDING_UPKEEP_ZERO_LABEL;
  }
  const parts: string[] = [];
  if (display.gold > 0) {
    parts.push(compact
      ? `−${display.gold}${cityPanelChipIconWrap('res-treasury', 8)}`
      : `−${display.gold}${cityPanelChipIconWrap('res-treasury', 10)}/t`);
  }
  const res = formatResourceUpkeepText(display.resources, compact);
  if (res) parts.push(res);
  return parts.join(compact ? ' ' : ' · ');
}

function formatBuildingUpkeepTotalHtml(
  totalGold: number,
  totalResources: Record<string, number>,
): string {
  if (totalGold === 0 && Object.keys(totalResources).length === 0) {
    return `Utrzymanie łącznie: <b>${BUILDING_UPKEEP_ZERO_LABEL}</b>`;
  }
  const parts: string[] = [];
  if (totalGold > 0) {
    parts.push(`−${totalGold}${cityPanelChipIconWrap('res-treasury', 12)}`);
  }
  const res = formatResourceUpkeepText(totalResources, false).replace(/\/t/g, '');
  if (res) parts.push(res);
  return `Utrzymanie łącznie: <b>${parts.join(' · ')}</b>/turę`;
}

function formatResourceUpkeepSummary(resources: Record<string, number>): string {
  const keys = Object.keys(resources);
  if (keys.length === 0) return '—';
  return keys.map(k => `−${resources[k]} ${stockResourceLabel(k)}`).join(' · ');
}

type BuildingReqChipKind = 'tech' | 'stock' | 'other';

interface BuildingReqChip {
  label: string;
  met: boolean;
  iconHtml?: string;
  kind: BuildingReqChipKind;
}

function buildingLocationRequirementMet(
  lokalizacja: 'stolica' | 'region' | undefined,
  isCapital: boolean | undefined,
): boolean {
  if (lokalizacja === 'stolica') return isCapital === true;
  if (lokalizacja === 'region') return isCapital === false;
  return true;
}

/** Warunki budowy z oceną spełnienia (niebieski = OK, czerwony = brak). */
function buildingRequirementChips(
  def: BuildingDef,
  city: City | undefined,
  data: GameData,
  ctx: AvailabilityContext,
  unlockedTechs: readonly string[],
): BuildingReqChip[] {
  const chips: BuildingReqChip[] = [];
  const techSet = new Set(unlockedTechs);
  const built = ctx.builtBuildingIds ?? [];
  const buildings = data.buildings;
  const pool = city !== undefined
    ? ownerSurowcePoolFor(city)
    : (ctx.empireResourceStock ?? {});

  const tech = (def.techUnlock ?? '').trim();
  if (tech && tech !== '-' && tech !== '—') {
    const steps = missingTechSteps(data, tech, techSet);
    const met = steps.length === 0;
    chips.push({
      label: met ? tech : steps.join(' → '),
      met,
      iconHtml: techIconHintSpan(tech, 14, { inheritColor: true }),
      kind: 'tech',
    });
  }

  const parentId = def.upgradeFrom?.trim();
  if (parentId) {
    const parentName = parentBuildingName(data, parentId) ?? parentId;
    const met = built.includes(parentId)
      || isBuildingSupersededByUpgrade(parentId, built, buildings);
    chips.push({ label: `Rozbudowa: ${parentName}`, met, kind: 'other' });
  }

  const cityPrereq = CITY_BUILDING_PREREQ[def.id];
  if (cityPrereq) {
    const ids = typeof cityPrereq === 'string' ? [cityPrereq] : [...cityPrereq];
    const names = ids.map(id => findBuildingDef(data, id)?.nazwa ?? id);
    const met = cityBuildingPrereqMet(
      cityPrereq, built, buildings, isBuildingSupersededByUpgrade,
    );
    const label = names.length > 1
      ? `W mieście: ${names.join(' lub ')}`
      : `W mieście: ${names[0]}`;
    chips.push({ label, met, kind: 'other' });
  }

  if (WATER_ACCESS_BUILDING_IDS.has(def.id)) {
    chips.push({
      label: 'Wybrzeże lub rzeka przy mieście',
      met: ctx.cityHasCoastOrRiver === true,
      kind: 'other',
    });
  }

  if (def.lokalizacja === 'stolica' || def.lokalizacja === 'region') {
    chips.push({
      label: def.lokalizacja === 'stolica' ? 'Tylko stolica' : 'Tylko poza stolicą',
      met: buildingLocationRequirementMet(def.lokalizacja, ctx.isCapital),
      kind: 'other',
    });
  }

  const stockCost = buildingStockCost(def);
  for (const [k, need] of Object.entries(stockCost)) {
    const have = pool[k] ?? 0;
    chips.push({
      label: `${need} ${stockResourceLabel(k)} w magazynie (masz ${have})`,
      met: have >= need,
      kind: 'stock',
    });
  }

  const LABEL_STOCK_KEY: Record<string, string> = {
    Drewno: 'drewno', Kamień: 'kamien', Glina: 'glina', Ruda: 'ruda',
    Żelazo: 'zelazo', Stal: 'stal', Brąz: 'braz', Sól: 'sol', Cegła: 'cegla',
    Ceramika: 'ceramika', Złoto: 'zloto', Koń: 'kon',
  };
  for (const label of buildingRequiredActiveLabels(def)) {
    const asciiKey = LABEL_STOCK_KEY[label];
    const have = asciiKey ? (pool[asciiKey] ?? 0) : 0;
    const met = empireResourceLabelSatisfied(
      label, undefined, ctx.empireBuiltIds ?? built, pool, def.id,
    );
    chips.push({
      label: `${label} w magazynie państwa (masz ${have})`,
      met,
      kind: 'stock',
    });
  }

  const accessReq = (def.wymagania && !isEmptyDataVal(def.wymagania)) ? String(def.wymagania) : '';
  if (accessReq && chips.length === 0) {
    chips.push({ label: accessReq, met: false, kind: 'other' });
  }

  return chips;
}

/** Czy gracz może TERAZ kliknąć Buduj — wszystkie chipy wymagań spełnione (tech, magazyn…). */
function buildingCanBuildNow(
  def: BuildingDef,
  city: City,
  data: GameData,
  ctx: AvailabilityContext,
  techs: readonly string[],
): boolean {
  const chips = buildingRequirementChips(def, city, data, ctx, techs);
  return chips.length === 0 || chips.every(c => c.met);
}

/**
 * Sortuje pulę budynków: najpierw te, które można wybudować teraz, potem zablokowane
 * (np. brak surowców w magazynie). W obrębie tieru zachowuje kolejność wejściową
 * (koszt → nazwa z buildableProduction).
 */
function sortProductionItemsByBuildability(
  items: readonly ProductionItem[],
  city: City,
  data: GameData,
  ctx: AvailabilityContext,
  techs: readonly string[],
): ProductionItem[] {
  const buildable: ProductionItem[] = [];
  const blocked: ProductionItem[] = [];
  for (const item of items) {
    const def = findBuildingDef(data, item.id);
    if (def && buildingCanBuildNow(def, city, data, ctx, techs)) buildable.push(item);
    else blocked.push(item);
  }
  return [...buildable, ...blocked];
}

function buildingReqChipSpan(chip: Pick<BuildingReqChip, 'label' | 'met' | 'iconHtml'>): string {
  const cls = chip.met ? 'bld-req-chip met' : 'bld-req-chip unmet';
  return `<span class="${cls}">${chip.iconHtml ?? ''}${chip.label}</span>`;
}

function buildingRequirementChipsHtml(chips: BuildingReqChip[]): string {
  return chips.map(c => buildingReqChipSpan(c)).join('');
}

const BUILDING_REQ_SECTION_LABELS: Record<BuildingReqChipKind, string> = {
  tech: 'Wymagane badania',
  stock: 'Wymagane surowce',
  other: 'Wymagane warunki',
};

function appendBuildingRequirementChipSections(parent: HTMLElement, chips: BuildingReqChip[]): boolean {
  if (chips.length === 0) return false;
  const groups: BuildingReqChipKind[] = ['tech', 'stock', 'other'];
  for (const kind of groups) {
    const group = chips.filter(c => c.kind === kind);
    if (group.length === 0) continue;
    parent.appendChild(el('div', 'bld-infocard-eyebrow req', BUILDING_REQ_SECTION_LABELS[kind]));
    const wrap = el('div', 'bld-infocard-chips');
    wrap.innerHTML = buildingRequirementChipsHtml(group);
    parent.appendChild(wrap);
  }
  return true;
}

function appendBuildingRequirementsBlock(
  parent: HTMLElement,
  def: BuildingDef,
  city: City | undefined,
  data: GameData,
  ctx: AvailabilityContext,
  unlockedTechs: readonly string[],
): boolean {
  const chips = buildingRequirementChips(def, city, data, ctx, unlockedTechs);
  return appendBuildingRequirementChipSections(parent, chips);
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
    ctx?: AvailabilityContext;
    techs?: readonly string[];
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
  // DAJE (efekty) — bonusy budynku, wyraźnie oddzielone od tego, co jest WYMAGANE do budowy
  // (Maciej 2026-07-24: gracz musi wiedzieć, czego mu brakuje i dlaczego nie może budować).
  const displayLevel = buildingUiDisplayLevel(def, opts?.city);
  const chipsHtml = buildingBonusChipsHtml(def, data.buildings, 3, displayLevel);
  if (chipsHtml) {
    bd.appendChild(el('div', 'bld-infocard-eyebrow', 'Daje'));
    const chips = el('div', 'bld-infocard-chips');
    chips.innerHTML = chipsHtml;
    bd.appendChild(chips);
  }
  // WYMAGANE — badania / budynki / surowce (niebieski = spełnione, czerwony = brak).
  const techs = opts?.techs ?? (opts?.city ? (cfg.getUnlockedTechs?.(opts.city.ownerId) ?? []) : []);
  const ctx = opts?.ctx ?? (opts?.city ? productionCtxForCity(opts.city) : undefined);
  const hasReqBlock = ctx
    ? appendBuildingRequirementsBlock(bd, def, opts?.city, data, ctx, techs)
    : false;
  if (!hasReqBlock) {
    const stockChipsHtml = buildingStockCostChipsHtml(def, opts?.city);
    const accessReq = (def.wymagania && !isEmptyDataVal(def.wymagania)) ? String(def.wymagania) : '';
    if (stockChipsHtml) {
      bd.appendChild(el('div', 'bld-infocard-eyebrow req', BUILDING_REQ_SECTION_LABELS.stock));
      const stockChips = el('div', 'bld-infocard-chips');
      stockChips.innerHTML = stockChipsHtml;
      bd.appendChild(stockChips);
    }
    if (accessReq) {
      bd.appendChild(el('div', 'bld-infocard-eyebrow req', BUILDING_REQ_SECTION_LABELS.other));
      const acc = el('div', 'bld-infocard-req-access');
      acc.textContent = '⛰️ ' + accessReq;
      bd.appendChild(acc);
    }
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
  const upkeepLine = formatBuildingUpkeepRowHtml(buildingUpkeepDisplay(def, 1), true);
  if (upkeepLine !== BUILDING_UPKEEP_ZERO_LABEL) {
    const up = el('span', 'bld-infocard-upkeep');
    up.innerHTML = upkeepLine;
    up.title = 'Utrzymanie co turę';
    ft.appendChild(up);
  }
  const ftR = el('span');
  ftR.textContent = def.maksPoziom > 1 ? `max ${def.maksPoziom} poz.` : 'bez upgrade';
  if (parentName) {
    ftR.innerHTML = def.techUnlock && !isEmptyDataVal(def.techUnlock)
      ? `${techIconHintSpan(def.techUnlock, 12)}${String(def.techUnlock)}`
      : '↗ upgrade';
  }
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
  } else if (opts?.lockHint && !hasReqBlock) {
    const lock = el('div', 'bld-infocard-lock');
    lock.innerHTML = opts.lockHint;
    bd.appendChild(lock);
  }

  card.appendChild(bd);
  return card;
}

const EPOCH_LABEL: Record<number, string> = { 1: 'Kamień', 2: 'Brąz', 3: 'Żelazo' };

function epochLabelNum(n: number): string {
  return EPOCH_LABEL[n] ?? `Epoka ${n}`;
}

/** Świątynia/kolumny — emblemat „Cuda świata” (KANON 1E, ten sam glif co dawny toolbar). */
function isEmptyDataVal(v: unknown): boolean {
  return v == null || v === '' || v === '—' || v === '-';
}

/** Ukrywa wewnętrzne notatki decyzyjne (PYTANIE/DECYZJA) przed graczem. */
function isDevOnlyPlayerText(text: string): boolean {
  const t = text.trim();
  return /^PYTANIE\s+\d+/i.test(t)
    || /^DECYZJA\b/i.test(t)
    || /^DEC-\d{8}/i.test(t)
    || /\bpatrz\s+unit-building-bonuses/i.test(t);
}

function stripInlineDevAnnotations(text: string): string {
  return text
    .replace(/^PYTANIE\s+\d+\s*=\s*[ABC]\s*\([^)]*\)\s*:?\s*/i, '')
    .replace(/\bPYTANIE\s+\d+\s*=\s*[ABC]\s*\([^)]*\)/gi, '')
    .replace(/\(Maciej\s+\d{4}-\d{2}-\d{2}\)/g, '')
    .replace(/\bdecyzj[aą]\s+Maciej\s+\d{4}-\d{2}-\d{2}/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function playerFacingNote(text: string | null | undefined): string | null {
  if (!text || isEmptyDataVal(text)) return null;
  const raw = String(text).trim();
  if (isDevOnlyPlayerText(raw)) return null;
  const cleaned = stripInlineDevAnnotations(raw);
  return cleaned || null;
}

/** Mały medalion ikony technologii (14px) do wklejenia w tekst-podpowiedzi (innerHTML). */
function techIconHintSpan(
  techName: string | null | undefined,
  sizePx = 14,
  opts?: { inheritColor?: boolean },
): string {
  if (!techName) return '';
  const svg = techIconSvg(techName, sizePx);
  if (!svg) return '';
  const icCls = opts?.inheritColor ? 'bld-req-tech-ic' : '';
  const color = opts?.inheritColor ? 'currentColor' : 'var(--gold)';
  return `<span class="${icCls}" style="display:inline-flex;width:${sizePx}px;height:${sizePx}px;vertical-align:-3px;margin-right:4px;color:${color};">${svg}</span>`;
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

/** Kafelek sekcji w karcie szczegółów budynku (hover / panel boczny). */
function beginBuildingDetailTile(card: HTMLElement, title: string): HTMLElement {
  const tile = el('div', 'bld-detail-tile');
  const hd = el('div', 'bld-detail-tile-hd');
  hd.innerHTML = cpInlineIcons(title);
  tile.appendChild(hd);
  const bd = el('div', 'bld-detail-tile-bd');
  tile.appendChild(bd);
  card.appendChild(tile);
  return bd;
}

function appendDetailGridIn(parent: HTMLElement): HTMLDivElement {
  const g = el('div', 'dc-grid');
  parent.appendChild(g);
  return g;
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

function appendTechDetailBlock(parent: HTMLElement, data: GameData, techName: string | null | undefined): void {
  if (!techName || isEmptyDataVal(techName)) {
    const g = appendDetailGridIn(parent);
    gridDetailRow(g, 'Technologia', 'Brak wymogu (startowa)');
    return;
  }
  const t = getTechDef(data, techName);
  const grid = appendDetailGridIn(parent);
  gridDetailRow(grid, 'Odblokowuje tech', `${techIconHintSpan(techName)}${techName}`);
  if (!t) return;

  if (t.Epoka) gridDetailRow(grid, 'Epoka tech', t.Epoka);
  if (t.Poziom != null) gridDetailRow(grid, 'Poziom drzewka', String(t.Poziom));
  if (t['Koszt nauki'] != null) gridDetailRow(grid, 'Koszt badania', `${t['Koszt nauki']}${naukaCostSuffix()}`);

  const chain = techPrereqChain(data, techName);
  if (chain.length > 1) {
    gridDetailRow(grid, 'Łańcuch wymagań', chain.map(n => `${techIconHintSpan(n, 12)}${n}`).join(' → '));
  } else {
    const prereq = t['Wymaga (prereq)'];
    if (prereq && !isEmptyDataVal(prereq)) {
      gridDetailRow(grid, 'Bezpośredni prereq', `${techIconHintSpan(String(prereq))}${String(prereq)}`);
    }
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
  const techNote = playerFacingNote(t.Uwagi);
  if (techNote) gridDetailRow(grid, 'Uwagi tech', techNote);
}

function buildBuildingDetailCard(def: BuildingDef, data: GameData, city?: City): HTMLDivElement {
  const card = el('div', 'detail-card bld-detail-card');
  const head = el('div', 'dc-h');
  head.appendChild(makeBuildingThumb(def));
  const ht = el('span');
  ht.textContent = def.nazwa;
  head.appendChild(ht);
  card.appendChild(head);

  const displayLevel = buildingUiDisplayLevel(def, city);

  const charBody = beginBuildingDetailTile(card, 'Charakterystyka');
  const gChar = appendDetailGridIn(charBody);
  gridDetailRow(gChar, 'Kategoria', def.kategoria);
  gridDetailRow(gChar, 'Epoka wejścia', epochLabelNum(def.epokaWejscia));
  gridDetailRow(gChar, 'Typ', def.wielokrotny ? 'Wielokrotny' : 'Unikalny w mieście');
  if (displayLevel > 1 || def.maksPoziom > 1) {
    gridDetailRow(
      gChar,
      'Poziom w tym mieście',
      city
        ? `L${displayLevel} (epoka miasta — jak liczy silnik)`
        : `L1 (podgląd; w mieście rośnie z epoką, max ${def.maksPoziom})`,
    );
  }

  const yieldBody = beginBuildingDetailTile(card, 'Plony i efekty (przychód na turę)');
  const gYield = appendDetailGridIn(yieldBody);
  let anyYield = false;
  for (const y of YIELD_BRAND) {
    const base = def.baza[y.key] ?? 0;
    const inc = def.przyrost[y.key] ?? 0;
    if (base !== 0 || inc !== 0) {
      anyYield = true;
      gridDetailRow(
        gYield,
        y.label,
        `${formatBuildingYieldDetailValue(base, inc, displayLevel)} ${yieldBrandIconHtml(y.brandId)}`,
      );
      const scale = formatBuildingYieldScaleRow(def, base, inc);
      if (scale) {
        gridDetailRow(gYield, `${y.label} — skala poziomów`, scale);
      }
    }
  }
  // Sciezki ulepszen jednostek (2026-07-25, druga tura -- suma lancucha
  // upgradeFrom): jak w buildingBonusChipsHtml powyzej -- mnoznik nie idzie juz
  // do Pracy, wiec pokazujemy PRAWDZIWY SKUMULOWANY efekt tylko dla 6
  // rozpoznanych budynkow (Pancerz / Parametry); dla reszty jest martwy -> ukryty.
  {
    const role = mnoznikRoleForBuildingId(def.id);
    if (role) {
      const cumulative = cumulativeMnoznikForBuildingId(def.id, data.buildings);
      if (cumulative !== 0) {
        anyYield = true;
        const label = role === 'pancerz' ? 'Pancerz (jednostki, trwale)' : 'Parametry poza Pancerzem (jednostki, trwale)';
        gridDetailRow(gYield, label, `+${cumulative}%`);
      }
    }
  }
  const defenseLine = buildingStructuralDefenseBonusLine(def.id);
  if (defenseLine) {
    anyYield = true;
    gridDetailRow(gYield, 'Obrona strukturalna', defenseLine);
  }
  if (!anyYield) gridDetailRow(gYield, 'Efekty', '—');

  const costBody = beginBuildingDetailTile(card, 'Koszty budowy i utrzymania');
  const gCost = appendDetailGridIn(costBody);
  const pace = cfg.getBuildingCostPace?.() ?? 'niski';
  const difficulty = cfg.getDifficulty?.() ?? 'normal';
  const ownerId = 0;
  const baseWork = itemCost('budynek', def.id, { buildings: data.buildings, units: data.units }, 1);
  const workCost = buildingWorkCost(baseWork, undefined, pace, ownerId, difficulty);
  gridDetailRow(gCost, 'Koszt budowy (jednorazowy)', `${workCost} pkt Pracy ${cityPanelChipIconWrap('res-work', 14)}`);
  if (def.przyrostKosztu) {
    gridDetailRow(
      gCost,
      'Przyrost kosztu budowy',
      `+${def.przyrostKosztu} pkt Pracy ${cityPanelChipIconWrap('res-work', 14)} / poziom`,
    );
  }
  gridDetailRow(
    gCost,
    'Utrzymanie (co turę)',
    formatBuildingUpkeepGridValue(buildingUpkeepDisplay(def, 1)),
  );
  if (def.przyrostUtrzymania) {
    gridDetailRow(
      gCost,
      'Przyrost utrzymania',
      `+${def.przyrostUtrzymania} pkt Pieniądza ${cityPanelChipIconWrap('res-treasury', 14)} / poziom`,
    );
  }
  const stockCostDetail = buildingStockCost(def);
  if (Object.keys(stockCostDetail).length > 0) {
    gridDetailRow(
      gCost,
      'Koszt surowcowy (jednorazowy)',
      Object.entries(stockCostDetail).map(([k, v]) => `${v} ${stockResourceLabel(k)}`).join(' + ')
        + ' — z magazynu państwa',
    );
  }

  if (def.maksPoziom > 1) {
    const lvlBody = beginBuildingDetailTile(card, 'Poziomy');
    const gLvl = appendDetailGridIn(lvlBody);
    gridDetailRow(gLvl, 'Maks. poziom', String(def.maksPoziom));
    // Przytnij WYŚWIETLANIE do maksPoziom -- nazwyPoziomow bywa dłuższe w danych
    // (zarezerwowane pod przyszłe epoki), ale pokazujemy tylko realnie osiągalne.
    const names = def.nazwyPoziomow.slice(0, def.maksPoziom).filter(Boolean);
    if (names.length) gridDetailRow(gLvl, 'Nazwy', names.join(' → '));
  }

  if (def.wymagania && !isEmptyDataVal(def.wymagania)) {
    const reqBody = beginBuildingDetailTile(card, 'Wymagania budynku');
    const gReq = appendDetailGridIn(reqBody);
    gridDetailRow(gReq, 'Wymagania', def.wymagania);
  }

  const techBody = beginBuildingDetailTile(card, 'Technologie');
  appendTechDetailBlock(techBody, data, def.techUnlock);

  const playerNote = playerFacingNote(def.uwagi);
  if (playerNote) {
    const noteBody = beginBuildingDetailTile(card, 'Uwagi');
    const note = el('div', 'dc-note');
    note.style.fontStyle = 'normal';
    note.textContent = playerNote;
    noteBody.appendChild(note);
  }
  return card;
}

/**
 * Karta szczegółów budynku w zakładce Budowa — pełne info (bonusy, koszty,
 * utrzymanie, wymagania, epoka) w panelu bocznym po najechaniu / kliknięciu.
 * Na liście zostaje tylko ikona + nazwa + Buduj.
 */
function buildBuildingBuildTabDetailCard(
  def: BuildingDef,
  data: GameData,
  city: City | undefined,
  opts?: {
    item?: ProductionItem;
    praca?: number;
    skarb?: number;
    lockHint?: string;
    locked?: boolean;
    buildLabel?: 'Buduj' | 'Ulepsz';
    upgrade?: boolean;
    ctx?: AvailabilityContext;
    techs?: readonly string[];
  },
): HTMLDivElement {
  const card = buildBuildingDetailCard(def, data, city);

  const techs = opts?.techs ?? (city ? (cfg.getUnlockedTechs?.(city.ownerId) ?? []) : []);
  const ctx = opts?.ctx ?? (city ? productionCtxForCity(city) : undefined);
  let hasReqBlock = false;
  if (ctx) {
    const reqBody = beginBuildingDetailTile(card, 'Wymagane');
    const reqTile = reqBody.parentElement as HTMLElement;
    hasReqBlock = appendBuildingRequirementsBlock(reqBody, def, city, data, ctx, techs);
    if (hasReqBlock) {
      card.insertBefore(reqTile, card.children[1] ?? null);
    } else {
      reqTile.remove();
    }
  }

  if (opts?.lockHint && !hasReqBlock) {
    const lockBody = beginBuildingDetailTile(card, 'Niedostępne');
    const lockTile = lockBody.parentElement as HTMLElement;
    const lock = el('div', 'dc-note');
    lock.style.cssText = 'color:#d36b5e;font-style:normal;';
    lock.textContent = opts.lockHint;
    lockBody.appendChild(lock);
    card.insertBefore(lockTile, card.children[1] ?? null);
  }

  if (!hasReqBlock) {
    const stockChipsHtml = city ? buildingStockCostChipsHtml(def, city) : '';
    const accessReq = (def.wymagania && !isEmptyDataVal(def.wymagania)) ? String(def.wymagania) : '';
    if (stockChipsHtml) {
      const stockBody = beginBuildingDetailTile(card, BUILDING_REQ_SECTION_LABELS.stock);
      const chips = el('div', 'bld-infocard-chips');
      chips.innerHTML = stockChipsHtml;
      stockBody.appendChild(chips);
    }
    if (accessReq) {
      const accessBody = beginBuildingDetailTile(card, BUILDING_REQ_SECTION_LABELS.other);
      const acc = el('div', 'dc-note');
      acc.style.fontStyle = 'normal';
      acc.textContent = accessReq;
      accessBody.appendChild(acc);
    }
  }

  const displayLevel = city ? buildingUiDisplayLevel(def, city) : 1;
  const chipsHtml = buildingBonusChipsHtml(def, data.buildings, 3, displayLevel);
  if (chipsHtml) {
    const givesBody = beginBuildingDetailTile(card, 'Daje');
    const chips = el('div', 'bld-infocard-chips');
    chips.innerHTML = chipsHtml;
    givesBody.appendChild(chips);
  }

  const parentName = parentBuildingName(data, def.upgradeFrom);
  if (parentName) {
    const chainBody = beginBuildingDetailTile(card, 'Łańcuch');
    const note = el('div', 'dc-note');
    note.style.fontStyle = 'normal';
    note.textContent = `Rozbudowa z: ${parentName}`;
    chainBody.appendChild(note);
  }

  if (opts?.item && city && !opts.locked) {
    const act = el('div', 'bld-detail-actions');
    const e = etaTurns(opts.item.koszt, 0, opts.praca ?? 0);
    const workIc = cityPanelChipIconWrap('res-work', 12);
    const cost = el('div', 'bld-infocard-cost');
    cost.style.cssText = 'flex:1 1 100%;margin-bottom:0.2em;';
    cost.innerHTML = `Koszt kolejki: ${opts.item.koszt}${workIc}${e !== null ? ' · ~' + e + ' ' + tury(e) : ''}`;
    act.appendChild(cost);
    const btnWrap = el('div', 'civ-v-bld-btns');
    appendBuildActionButtons(btnWrap, city, opts.item, opts.skarb, opts.buildLabel ?? 'Buduj', opts.upgrade);
    act.appendChild(btnWrap);
    card.appendChild(act);
  } else if (!opts?.locked && opts?.item) {
    const e = etaTurns(opts.item.koszt, 0, opts.praca ?? 0);
    const workIc = cityPanelChipIconWrap('res-work', 12);
    const note = el('div', 'dc-note');
    note.style.fontStyle = 'normal';
    note.textContent = `Koszt: ${opts.item.koszt} pracy${e !== null ? ' · ~' + e + ' ' + tury(e) : ''}`;
    card.appendChild(note);
  }

  return card;
}

function buildOwnedBuildingsDetailCard(city: City, data: GameData | null): HTMLDivElement {
  const card = el('div', 'detail-card');
  const built = cfg.getBuiltBuildingIds?.(city.id);
  card.appendChild(el('div', 'dc-h',
    `<span>Budynki w mieście${built ? ' (' + built.length + ')' : ''}</span>`));
  if (!data) {
    card.appendChild(el('div', 'dc-note', 'Brak danych gry'));
    return card;
  }
  if (!built || built.length === 0) {
    card.appendChild(el('div', 'dc-note', '(brak — zbuduj pierwszy)'));
    return card;
  }
  const totalUpkeep = sumOwnedBuildingsUpkeep(built, data, city);
  const totalResUpkeep = sumOwnedBuildingsResourceUpkeep(built, data);
  const summary = el('div', 'bld-owned-summary');
  summary.innerHTML =
    formatBuildingUpkeepTotalHtml(totalUpkeep, totalResUpkeep) +
  ` · kliknij budynek — pełne szczegóły`;
  card.appendChild(summary);
  const groups = groupBuiltBuildingIds(built, data.buildings);
  for (const { grupa, ids } of groups) {
    if (ids.length === 0) continue;
    appendDetailSection(card, grupa);
    const list = el('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:0.1em;margin-bottom:0.28em;';
    for (const id of ids) appendOwnedBuildingRow(list, id, data, city);
    card.appendChild(list);
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
  const resUpkeep = unitResourceUpkeep(u);
  const resUpkeepKeys = Object.keys(resUpkeep);
  if (resUpkeepKeys.length > 0) {
    gridDetailRow(
      gEco,
      'Utrzymanie surowców',
      formatResourceUpkeepSummary(resUpkeep) + '/t',
    );
  }
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
  const def = findBuildingDef(data, item.id);
  if (!def) {
    const row = el('div', 'item-row');
    row.textContent = item.nazwa;
    scroll.appendChild(row);
    return;
  }

  const prodCtx = productionCtxForCity(city);
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  const canBuild = buildingCanBuildNow(def, city, data, prodCtx, techs);

  const row = el('div', `bld-compact-row${canBuild ? ' can-build-row' : ' cannot-build-row'}`);
  const ic = el('div', 'bld-compact-ic');
  fillIconElement(ic, buildingIconHtml(def));
  row.appendChild(ic);
  const name = el('span', 'bld-compact-name');
  name.textContent = def.nazwa;
  row.appendChild(name);

  const actions = el('div', 'bld-compact-actions');
  appendBuildActionButtons(actions, city, item, opts.skarb, opts.buildLabel, opts.upgrade, {
    requirementsMet: canBuild,
  });
  actions.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', (e: MouseEvent) => e.stopPropagation());
  });
  row.appendChild(actions);

  attachHoverDetail(
    row,
    () => buildBuildingBuildTabDetailCard(def, data, city, {
      item,
      praca: opts.praca,
      skarb: opts.skarb,
      buildLabel: opts.buildLabel,
      upgrade: opts.upgrade,
      ctx: prodCtx,
      techs,
    }),
    220,
    'left',
  );
  scroll.appendChild(row);
}

function recruitManpowerCost(city: City, typeId: string): number {
  const ep = cfg.getEpoch?.(city.ownerId) ?? 1;
  const maxMult = civManpowerMaxMult(cfg.getCivBonusy?.(city.ownerId));
  return unitManpowerCostForType(typeId, ep, maxMult);
}

/** Czy imperium ma wystarczającą pulę rekrutów na werb (fallback: pula miasta). */
function empireRekruciAffordable(city: City, mpCost: number): boolean {
  if (mpCost <= 0) return true;
  const empireTotal = cfg.getEmpireRekruciTotal?.(city.ownerId);
  if (empireTotal != null) return empireTotal >= mpCost;
  const mpSnap = cfg.getManpowerSnapshot?.(city.id);
  return !mpSnap || mpSnap.manpowerBiezacy >= mpCost;
}

/**
 * JEDNOSTKI-SUROWIEC-01 (Maciej 2026-07-24): chip(y) kosztu surowcowego jednostki
 * (units.json Surowiec/Surowiec (ilość)) na karcie rekrutacji — czerwony gdy pula
 * PAŃSTWA ownera (suma City.surowce po wszystkich miastach) nie starcza. Pusty string
 * gdy jednostka nie ma kosztu surowcowego. Wzorzec: buildingStockCostChipsHtml powyżej.
 */
function unitStockCostChipsHtml(u: UnitDef, city: City): string {
  const cost = unitStockCost(u);
  const keys = Object.keys(cost);
  if (keys.length === 0) return '';
  const pool = ownerSurowcePoolFor(city);
  const chips = keys.map(k => {
    const need = cost[k]!;
    const missing = need > (pool[k] ?? 0);
    const cls = missing ? 'bld-infocard-chip stock-missing' : 'bld-infocard-chip';
    return `<span class="${cls}">${need} ${stockResourceLabel(k)}</span>`;
  });
  return chips.join('');
}

/** Chip(y) utrzymania surowcowego jednostki (units.json Utrzymanie surowiec). */
function unitResourceUpkeepChipsHtml(u: UnitDef): string {
  const upkeep = unitResourceUpkeep(u);
  const keys = Object.keys(upkeep);
  if (keys.length === 0) return '';
  return keys
    .map(k => `<span class="bld-infocard-chip">−${upkeep[k]} ${stockResourceLabel(k)}/t</span>`)
    .join('');
}

function appendUnitRecruitCompactRow(
  scroll: HTMLElement,
  city: City,
  item: ProductionItem,
  data: GameData,
  skarb: number | undefined,
): void {
  const udef = findUnitDef(data, item.id);
  if (!udef) return;
  const mpCost = recruitManpowerCost(city, item.id);
  const canMp = empireRekruciAffordable(city, mpCost);
  // JEDNOSTKI-SUROWIEC-01: blokada rekrutacji gdy pula PAŃSTWA ownera nie pokrywa
  // Surowiec/Surowiec (ilość) tej jednostki — identyczny wzorzec jak canMp powyżej.
  const stockCost = unitStockCost(udef);
  const stockMissing = missingStockFor(ownerSurowcePoolFor(city), stockCost);
  const stockOk = Object.keys(stockMissing).length === 0;
  const row = buildUnitRecruitCard({
    udef,
    item,
    data,
    skarb,
    canPurchase: !!cfg.onPurchaseUnit && canMp && stockOk,
    treasuryIconHtml: cityPanelChipIconWrap('res-treasury', 14),
    mpCost,
    mpCostLabel: formatManpower(mpCost),
    stockChipsHtml: unitStockCostChipsHtml(udef, city),
    resourceUpkeepChipsHtml: unitResourceUpkeepChipsHtml(udef),
    stockMissingLabel: stockOk ? undefined : 'Brakuje w magazynie: ' + Object.entries(stockMissing)
      .map(([k, v]) => `${v} ${stockResourceLabel(k)}`)
      .join(', '),
    onRecruit: () => recruitUnit(city, item),
  });
  attachHoverDetail(row, () => buildUnitDetailCard(udef, data), 220, 'left');
  scroll.appendChild(row);
}

function recruitUnit(city: City, item: ProductionItem): void {
  const skarb = cfg.getTreasury?.(city.ownerId);
  if (skarb !== undefined && skarb < item.koszt) return;
  const mpCost = recruitManpowerCost(city, item.id);
  if (!empireRekruciAffordable(city, mpCost)) return;
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
  if (rq.length === 0) return;
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
  {
    const sc = createScrollList('recruit-queue-scroll', {
      visible: RECRUIT_QUEUE_VISIBLE,
      rowEm: QUEUE_ROW_EM,
    });
    if (opts?.w4) sc.classList.add('list-scroll-fill');
    for (let i = 0; i < rq.length; i++) {
      const it = rq[i]!;
      const udef = data ? findUnitDef(data, it.id) : undefined;
      const qi = el('div', 'qitem');
      qi.style.marginBottom = '0.15em';
      qi.dataset.recruitIdx = String(i);
      if (player) qi.classList.add('qitem-draggable');
      if (player) {
        const grip = el('span', 'qitem-grip', '⋮⋮');
        grip.title = 'Przeciągnij, aby zmienić kolejność';
        qi.appendChild(grip);
      }
      const iconSpan = productionQueueIconSpan(data, it);
      iconSpan.classList.add('qitem-ic');
      if (udef && data) {
        attachHoverDetail(iconSpan, () => buildUnitDetailCard(udef, data), 180);
      }
      qi.appendChild(iconSpan);
      const qLabel = el('span');
      qLabel.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      qLabel.textContent = it.nazwa;
      qi.appendChild(qLabel);
      const costEl = el('span', 'qitem-cost');
      costEl.innerHTML = `${it.koszt} ${cityPanelChipIconWrap('res-treasury', 14)}`;
      costEl.title = `Opłacone ze skarbca: ${it.koszt}`;
      qi.appendChild(costEl);
      const etaTurns = i + 1;
      const etaEl = el('span', 'qitem-eta');
      etaEl.textContent = etaTurns === 1 ? 'nast. tura' : `~${etaTurns} ${tury(etaTurns)}`;
      etaEl.title = `Szacunek: ${etaTurns} ${tury(etaTurns)} (1 jednostka na turę)`;
      qi.appendChild(etaEl);
      if (player) {
        const up = el('button', 'btn btn-sm', '↑');
        up.style.cssText = 'padding:0 0.35em;';
        (up as HTMLButtonElement).disabled = i <= 0;
        up.addEventListener('click', () => {
          setProd(city.id, moveRecruitQueueItem(getProd(city.id), i, -1));
          rerender();
        });
        const down = el('button', 'btn btn-sm', '↓');
        down.style.cssText = 'padding:0 0.35em;';
        (down as HTMLButtonElement).disabled = i >= rq.length - 1;
        down.addEventListener('click', () => {
          setProd(city.id, moveRecruitQueueItem(getProd(city.id), i, 1));
          rerender();
        });
        const x = el('button', 'btn btn-sm', '✕');
        x.style.cssText = 'padding:0 0.35em;';
        x.title = 'Usuń z kolejki (zwrot opłaty do skarbca)';
        x.addEventListener('click', () => {
          cfg.onCancelRecruitment?.(city.id, it.id, it.koszt);
          setProd(city.id, dequeueRecruitment(getProd(city.id), i));
          rerender();
        });
        qi.appendChild(up);
        qi.appendChild(down);
        qi.appendChild(x);
      }
      sc.appendChild(qi);
    }
    if (player) bindRecruitQueueDragReorder(sc, city);
    wrap.appendChild(sc);
  }
  mount.appendChild(wrap);
}

/** Kolejka budynków (pozycje 2+ w kolejce produkcji). */
function appendBuildQueueSection(
  mount: HTMLElement,
  city: City,
  player: boolean,
  prod: CityProduction,
  pracaBudynki: number,
): void {
  if (prod.kolejka.length <= 1) return;
  const data = gameData();
  const qWrap = el('div');
  qWrap.style.cssText = 'margin-top:0.5em;padding-top:0.35em;border-top:1px solid var(--border);';
  const qh = el('div', 'gold', 'Kolejka budowy:');
  qh.style.cssText = 'font-size:0.78em;font-weight:700;margin-bottom:0.22em;';
  qWrap.appendChild(qh);
  {
    const sc = createScrollList('build-queue-scroll', {
      visible: BUILD_QUEUE_VISIBLE,
      rowEm: QUEUE_ROW_EM,
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
      const cumEta = queueItemCumulativeEta(prod, i, pracaBudynki);
      const ownEta = queueItemOwnEta(it.koszt, pracaBudynki);
      const etaEl = el('span', 'qitem-eta');
      if (cumEta !== null) {
        etaEl.textContent = `gotowy za ~${cumEta} ${tury(cumEta)}`;
        etaEl.title =
          `Szacunek przy +${pracaBudynki} Pracy/turę do budynków` +
          (ownEta !== null && ownEta !== cumEta ? ` · sam budynek: ~${ownEta} ${tury(ownEta)}` : '');
      } else if (ownEta !== null) {
        etaEl.textContent = `~${ownEta} ${tury(ownEta)}`;
        etaEl.classList.add('muted-eta');
        etaEl.title =
          prod.wstrzymana === true
            ? `Budynek: ~${ownEta} ${tury(ownEta)} po wznowieniu (kolejka wstrzymana)`
            : `Sam budynek: ~${ownEta} ${tury(ownEta)} przy +${pracaBudynki} Pracy/turę`;
      } else {
        etaEl.textContent = 'brak Pracy';
        etaEl.classList.add('muted-eta');
        etaEl.title = 'Brak Pracy skierowanej do budynków — ustaw suwak „Budynki”';
      }
      qi.appendChild(etaEl);
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
      x.title = 'Usuń z kolejki (zwrot surowców do puli państwa)';
      x.addEventListener('click', () => { cancelQueueItem(city, idx); });
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
  const prod = getProd(city.id);
  const front = frontItem(prod);
  const data = gameData();
  const pracaSplit = view ? cityPracaSplit(city, view, data) : null;
  const pracaBud = pracaSplit?.doBudynkow ?? 0;
  const player = city.ownerId === 0; // AI cities -> read-only (no build/queue controls)
  const hasBuildQueue = prod.kolejka.length > 1;
  const hasRecruitQueue = (prod.rekrutacja ?? []).length > 0;
  const hasAutoToolbar = !!(player && cfg.getBudowaState?.(city.id));
  if (!front && !hasBuildQueue && !hasRecruitQueue && !hasAutoToolbar) {
    mount.style.display = 'none';
    return;
  }
  mount.style.display = '';
  mount.appendChild(el('div', 'ptitle', '<span>Produkcja</span>'));

  if (player && cfg.getBudowaState) {
    const bState = cfg.getBudowaState(city.id);
    if (bState) {
      const bToolbar = el('div', 'okolica-toolbar budowa-toolbar');
      bToolbar.style.cssText = 'margin:0.06em 0 0.18em;';
      const bProfiles = el('div', 'okolica-toolbar-profiles');
      appendBudowaToolbarProfiles(bProfiles, city, bState.priorytetTypow, bState.tryb, bState.lista);
      bToolbar.appendChild(bProfiles);
      if (bState.tryb === 'lista') {
        appendBudowaListaBar(bToolbar, city, bState.lista, bState.biblioteka);
      }
      mount.appendChild(bToolbar);
    }
  }

  if (front) {
    const paused = getProd(city.id).wstrzymana === true;
    const e = paused ? null : etaTurns(front.koszt, prod.postep, pracaBud);
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
            : `<span class="blue">${formatBuildEtaLabel(e)}</span>`) +
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
    usun.title = 'Usuń z kolejki (zwrot surowców do puli państwa)';
    usun.addEventListener('click', () => { cancelQueueItem(city, 0); });
    actions.appendChild(usun);
    if (player) mount.appendChild(actions);
  }

  appendBuildQueueSection(mount, city, player, prod, pracaBud);
  appendRecruitmentQueue(mount, city, player);
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
  if (entry.locationBlocked === 'stolica') return '🔒 Tylko w stolicy';
  if (entry.locationBlocked === 'region') return '🔒 Tylko poza stolicą';

  const parts: string[] = [];
  let techIc = '';
  if (entry.missingTech) {
    techIc = techIconHintSpan(entry.missingTech);
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
  return parts.length > 0 ? `🔒 ${techIc}${parts.join(' · ')}` : '🔒 Niedostępny';
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
      parts.push(`🔒 ${techIconHintSpan(tech)}Zbadaj: ${steps.join(' → ')}`);
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
  const raw = cfg.getResourceAccess?.(city.id);
  const activeResourceLabels = Array.isArray(raw)
    ? raw
    : (raw?.active ?? []);
  const empireActiveResourceLabels = cfg.getEmpireResourceAccess?.(city.ownerId);
  const empireBuiltIds = cfg.getEmpireBuiltIds?.(city.ownerId);
  return {
    epoch: cfg.getEpoch?.(city.ownerId) ?? 1,
    builtBuildingIds: cfg.getBuiltBuildingIds?.(city.id) ?? [],
    productionQueue: getProd(city.id).kolejka,
    buildingLevel: 1,
    civBonusy: cfg.getCivBonusy?.(city.ownerId) ?? [],
    civUnitNacja: unitNacjaForCivKey(cfg.getCivKey?.(city.ownerId)),
    placedImprovements: cfg.getPlacedImprovements?.() ?? null,
    hasKopalniaNaZlozuZelaza: cfg.getHasKopalniaNaZlozuZelaza?.() ?? false,
    aliveUnitTypeNames: cfg.getAliveUnitTypeNames?.(city.ownerId),
    buildingCostPace: cfg.getBuildingCostPace?.() ?? 'niski',
    kosztJednostekPace: cfg.getKosztJednostekPace?.() ?? 'niski',
    ownerId: city.ownerId,
    difficulty: cfg.getDifficulty?.() ?? 'normal',
    activeResourceLabels,
    empireActiveResourceLabels,
    empireBuiltIds,
    empireResourceStock: cfg.getEmpireStock?.(city.ownerId),
    cityHasCoastOrRiver: cfg.getCityHasCoastOrRiver?.(city.id) ?? false,
    // ADMIN-STOLICA (2026-07-25): jedno źródło prawdy o stolicy — capitalCityIdForOwner
    // (main.ts), tu przez cfg.getCapitalCityId (patrz getCapitalCityId doc powyżej —
    // wyznaczona stolica z fallbackiem na najstarsze miasto, NIE heurystyka
    // turn-economy.ts "pierwsze miasto w tablicy"). Ownerid-agnostyczne (parytet AI).
    isCapital: (cfg.getCapitalCityId?.(city.ownerId) ?? null) === city.id,
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
    // ADMIN-STOLICA (Maciej 2026-07-26 playtest): budynek z `lokalizacja: 'stolica'|'region'`
    // odrzucony WYŁĄCZNIE przez bramkę lokalizacji (locationBlocked) nigdy nie stanie się
    // budowalny w TYM mieście — to ograniczenie jest trwałe (nie "jeszcze niedostępne", jak
    // brak tech/surowca/budynku-warunku), więc karta w ogóle nie trafia na listę (ani do
    // "Jeszcze zablokowane", ani do "Podgląd epoki"/"Podgląd badań" — tam też byłaby myląca,
    // bo formatBuildingPreviewHint nie zna bramki lokalizacji i pokazałby "Badania OK").
    // eraBuildingCatalog (production.ts) CELOWO nadal zwraca ten wpis jako status='locked' +
    // locationBlocked — to surowe źródło prawdy silnika (testowane wprost w
    // administracja-stolica-test.cjs); filtrowanie dla UI robimy tutaj, jednym miejscem.
    if (e.locationBlocked) return false;
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
  city: City,
  prodCtx: AvailabilityContext,
  techs: readonly string[],
  lockHint: string,
  opts?: { forceLocked?: boolean },
): void {
  const previewLocked = opts?.forceLocked === true;
  if (!def) {
    const row = el('div', 'item-row');
    row.textContent = entry.nazwa;
    scroll.appendChild(row);
    return;
  }

  const row = el('div', 'bld-compact-row is-locked cannot-build-row');
  const ic = el('div', 'bld-compact-ic');
  fillIconElement(ic, buildingIconHtml(def));
  row.appendChild(ic);
  const name = el('span', 'bld-compact-name');
  name.textContent = def.nazwa;
  row.appendChild(name);

  const actions = el('div', 'bld-compact-actions');
  appendDisabledBuildActionButtons(actions, 'Buduj', lockHint);
  row.appendChild(actions);

  if (!previewLocked && entry.status === 'ready') {
    const tag = el('span', 'bld-catalog-ready-tag');
    tag.style.fontSize = '0.62em';
    tag.textContent = 'Można budować';
    actions.insertBefore(tag, actions.firstChild);
  }

  attachHoverDetail(
    row,
    () => buildBuildingBuildTabDetailCard(def, data, city, {
      locked: previewLocked || entry.status === 'locked',
      lockHint: previewLocked || entry.status === 'locked' ? lockHint : undefined,
      ctx: prodCtx,
      techs,
    }),
    220,
    'left',
  );
  scroll.appendChild(row);
}

function renderBuildList(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  view: CityView | null,
  opts?: { visibleRows?: number; scrollFill?: boolean },
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
  // SUROW-UI-B1: pasek „ikona + ilość" surowców magazynowanych (Total War-style),
  // nad listą budowy — patrz mockup „Surowce magazyn i formy v1" KLATKA B kontekst 2.
  appendCityResourceStockStrip(mount, city);
  const praca = view ? view.praca : 0;
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const civBonusy = cfg.getCivBonusy?.(city.ownerId) ?? [];
  const prodState = getProd(city.id);
  const prodCtx = productionCtxForCity(city);
  const items = sortProductionItemsByBuildability(
    buildableProduction(city, data, techs, prodCtx),
    city,
    data,
    prodCtx,
    techs,
  );

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
      const targetLevel = buildingLevelForEpoch(def.epokaWejscia, epoch, def.maksPoziom, def.poziomTechGate, techs);
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

  const sortedUps = sortProductionItemsByBuildability(ups, city, data, prodCtx, techs);

  if (items.length === 0 && sortedUps.length === 0 && previewEntries.length === 0) {
    mount.appendChild(el('div', 'muted', '(brak budynków — zbadaj technologie)'));
    return;
  }

  const scroll = createScrollList(
    'list-scroll',
    opts?.scrollFill
      ? { fill: true }
      : opts?.visibleRows != null
        ? { visible: opts.visibleRows, rowEm: LIST_ROW_HEIGHT_COMPACT }
        : undefined,
  );
  for (const it of items) {
    appendBuildableItemRow(scroll, city, it, data, { praca, skarb, buildLabel: 'Buduj' });
  }
  if (sortedUps.length > 0) {
    const h = el('div', 'muted');
    h.style.cssText = 'font-size:0.72em;margin:0.35em 0 0.2em;padding-top:0.25em;border-top:1px solid var(--border);';
    h.textContent = 'Ulepsz';
    scroll.appendChild(h);
    for (const u of sortedUps) {
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
    for (const entry of previewEntries) {
      const def = findBuildingDef(data, entry.id);
      const lockHint = fullEraPreview && def
        ? formatBuildingPreviewHint(def, data, techs)
        : formatBuildingCatalogLockHint(entry, data, techs);
      appendCatalogBuildingRow(scroll, entry, def, data, city, prodCtx, techs, lockHint, {
        forceLocked: fullEraPreview || entry.status === 'locked',
      });
    }
  }
  mount.appendChild(scroll);
}

function buildRecruitTabDetailCard(city: City, unitCount: number, skarb: number | undefined): HTMLDivElement {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const mpSnap = cfg.getManpowerSnapshot?.(city.id);
  const maxMult = civManpowerMaxMult(cfg.getCivBonusy?.(city.ownerId));
  const mpCostStd = unitManpowerCost(epoch, maxMult);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Rekrutacja — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Jednostki kupujesz za pieniądz ze skarbca imperium oraz rekrutów (Manpower) z puli całej cywilizacji. ' +
    'Werb zużywa tylko rekrutów imperium — ludność miasta nie spada. Zwiadowca — 0 kosztu Manpower. ' +
    'Opłacone pozycje trafiają do kolejki — max 1 gotowa na turę (v0.1).';
  card.appendChild(intro);
  appendDetailSection(card, 'Stan');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Dostępne jednostki', String(unitCount));
  gridDetailRow(g, 'Skarb imperium', skarb != null ? `${skarb} 💰` : '—');
  if (mpSnap) {
    gridDetailRow(g, 'Rekruci (pula miasta)', `${formatManpower(mpSnap.manpowerBiezacy)} / ${formatManpower(mpSnap.manpowerMax)}`);
    gridDetailRow(g, 'Koszt Manpower (typowy)', `${formatManpower(mpSnap.kosztJednostki)} · epoka ${mpSnap.epoka}`);
  } else {
    gridDetailRow(g, 'Koszt Manpower (typowy)', `${formatManpower(mpCostStd)} · epoka ${epoch}`);
  }
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
  // SUROW-UI-B2: pasek TYLKO surowca militarnego epoki (Brąz/Żelazo) — patrz mockup
  // „Surowce magazyn i formy v1" KLATKA B kontekst 3.
  appendRecruitMilitaryResourceStrip(mount, city);
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

  const scroll = createScrollList(
    'list-scroll',
    opts?.visibleRows != null
      ? { visible: opts.visibleRows, rowEm: LIST_ROW_HEIGHT_COMPACT }
      : { visible: LIST_SCROLL_VISIBLE_CATALOG, rowEm: LIST_ROW_HEIGHT_COMPACT },
  );
  for (const it of units) {
    appendUnitRecruitCompactRow(scroll, city, it, data, skarb);
  }
  mount.appendChild(scroll);
}

function buildUpgradeBonusDetailCard(
  def: BuildingDef,
  data: GameData,
  city?: City,
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
  const displayLevel = buildingUiDisplayLevel(def, city);
  appendDetailSection(card, 'Statystyki (silnik)');
  const g1 = appendDetailGrid(card);
  let anyStat = false;
  for (const y of YIELD_BRAND) {
    const baza = def.baza[y.key] ?? 0;
    const przyrost = def.przyrost[y.key] ?? 0;
    if (baza === 0 && przyrost === 0) continue;
    anyStat = true;
    gridDetailRow(
      g1,
      y.label,
      formatBuildingYieldDetailValue(baza, przyrost, displayLevel),
    );
    const scale = formatBuildingYieldScaleRow(def, baza, przyrost);
    if (scale) gridDetailRow(g1, `${y.label} — skala`, scale);
  }
  const role = mnoznikRoleForBuildingId(def.id);
  if (role) {
    const cumulative = cumulativeMnoznikForBuildingId(def.id, data.buildings);
    if (cumulative !== 0) {
      anyStat = true;
      const label = role === 'pancerz' ? 'Pancerz (jednostki)' : 'Parametry poza Pancerzem (jednostki)';
      gridDetailRow(g1, label, `+${cumulative}%`);
    }
  }
  if (!anyStat) {
    const note = el('div', 'dc-note');
    note.textContent = 'Brak statów bazowych w definicji.';
    card.appendChild(note);
  }
  return card;
}

/** Jeden wiersz budynku w panelu „Budynki w mieście" — skrót utrzymania + bonusów. */
function appendOwnedBuildingRow(
  target: HTMLElement,
  id: string,
  data: GameData,
  city?: City,
  opts?: { compact?: boolean },
): void {
  const compact = opts?.compact === true;
  const def = data.buildings.find(b => b.id === id);
  const row = el('div', compact ? 'bld-owned-row bld-owned-row--tight' : 'bld-owned-row');
  const hd = el('div', 'bld-owned-hd');
  appendBuildingInlineIcon(hd, def);
  const bn = el('span', 'bld-owned-name');
  bn.textContent = def ? def.nazwa : id;
  let upgradeChainTitle = '';
  if (def && (def.upgradeFrom ?? '').trim().length > 0) {
    upgradeChainTitle = upgradeChainSteps(def.id, data.buildings).map(c => c.nazwa).join(' → ');
  }
  if (def && city) {
    const builtIds = cfg.getBuiltBuildingIds?.(city.id) ?? [];
    const allCities = cfg.getCities?.() ?? [];
    const empireStock = cfg.getEmpireStock?.(city.ownerId);
    let empireBuiltIds = cfg.getEmpireBuiltIds?.(city.ownerId);
    if (!empireBuiltIds) {
      const collected: string[] = [];
      for (const c of allCities) {
        if (c.ownerId !== city.ownerId) continue;
        collected.push(...(cfg.getBuiltBuildingIds?.(c.id) ?? []));
      }
      empireBuiltIds = collected;
    }
    const activeLabels = cfg.getEmpireResourceAccess?.(city.ownerId) ?? [];
    const runtimeActiveBuiltIds = filterRuntimeActiveBuiltIds(
      empireBuiltIds,
      activeLabels,
      empireStock,
      { ownerId: city.ownerId, resolveOwnerZlotoAccess: cfg.getOwnerHasZlotoAccess },
    );
    const inactiveStatus = resolveOwnedBuildingInactiveStatus(id, {
      builtIds,
      allCities,
      ownerId: city.ownerId,
      runtimeActiveBuiltIds,
      empireStock,
      building: def,
      resolveOwnerZlotoAccess: cfg.getOwnerHasZlotoAccess,
    });
    if (inactiveStatus.inactive) {
      bn.classList.add('bld-owned-name--inactive');
      bn.title = inactiveStatus.tooltip
        + (upgradeChainTitle ? '\n' + upgradeChainTitle : '');
    } else if (upgradeChainTitle) {
      bn.title = upgradeChainTitle;
    }
  } else if (upgradeChainTitle) {
    bn.title = upgradeChainTitle;
  }
  hd.appendChild(bn);
  if (def && city) {
    const level = buildingOwnedLevel(def, city);
    if (!compact && (level > 1 || def.maksPoziom > 1)) {
      const lv = el('span', 'bld-owned-lvl');
      lv.textContent = `L${level}`;
      lv.title = `Poziom ${level}${def.nazwyPoziomow[level - 1] ? ' · ' + def.nazwyPoziomow[level - 1] : ''}`;
      hd.appendChild(lv);
    } else if (compact && level > 1) {
      bn.textContent = `${def.nazwa} L${level}`;
    }
  }
  if (def && (def.upgradeFrom ?? '').trim().length > 0) {
    const upBtn = el('button', 'bld-upg');
    upBtn.type = 'button';
    upBtn.textContent = '↗';
    upBtn.title = 'Skład bonusów upgrade';
    upBtn.setAttribute('aria-label', `Skład bonusów ${def.nazwa}`);
    attachInteractiveDetail(upBtn, () => buildUpgradeBonusDetailCard(def, data, city), { delayMs: 260, sideHint: 'left' });
    hd.appendChild(upBtn);
  }
  row.appendChild(hd);

  if (def && city) {
    const level = buildingOwnedLevel(def, city);
    const tail = el('div', 'bld-owned-tail');
    const upkeepDisplay = buildingUpkeepDisplay(def, level);
    const upSpan = el('span', 'bld-owned-upkeep' + (upkeepDisplay.gold === 0 && Object.keys(upkeepDisplay.resources).length === 0 ? ' muted' : ''));
    upSpan.innerHTML = formatBuildingUpkeepRowHtml(upkeepDisplay, compact);
    tail.appendChild(upSpan);
    const bonusHtml = buildingOwnedBonusCompactHtml(def, level, data.buildings, { compact });
    if (bonusHtml) {
      const bon = el('span', 'bld-owned-bonus');
      bon.innerHTML = bonusHtml;
      tail.appendChild(bon);
    }
    if (tail.childElementCount > 0) row.appendChild(tail);
    attachHoverDetail(row, () => buildBuildingDetailCard(def, data, city), 280, 'left');
    row.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.bld-upg')) return;
      e.stopPropagation();
      showHoverDetailNow(row, () => buildBuildingDetailCard(def, data, city), 'left');
    });
  }

  target.appendChild(row);
}

/**
 * Panel „Budynki w mieście" — GRUPY-BUDYNKOW (Maciej 2026-07-25): zamiast
 * płaskiej listy do 38 budynków, osiem grup dziedzinowych (`<details>`,
 * kliknięcie rozwija). Przypisanie budynek→grupa czyta się z danych
 * (BuildingDef.grupa, patrz data/loader.ts) — grupowanie samo w sobie jest
 * WYŁĄCZNIE prezentacją, nie zmienia żadnej wartości silnika. Grupa bez
 * zbudowanych budynków zostaje widoczna (wymóg #3 zadania), ale w stanie
 * odróżnionym (`bld-group-empty`, zwinięta, „— brak —").
 */
function renderBuildingsOwned(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  opts?: { visibleRows?: number; scrollFill?: boolean; compact?: boolean },
): void {
  mount.innerHTML = '';
  const compact = opts?.compact === true;
  if (compact) mount.classList.add('bld-owned-compact-mount');
  const built = cfg.getBuiltBuildingIds?.(city.id);
  const builtCount = built?.length ?? 0;
  let titleHtml = compact
    ? `<span>Budynki (${builtCount})</span>`
    : `<span>Budynki w mieście${built ? ' (' + built.length + ')' : ''}</span>${built ? '' : PH()}`;
  if (built && data && built.length > 0 && compact) {
    const totalUpkeep = sumOwnedBuildingsUpkeep(built, data, city);
    const totalResUpkeep = sumOwnedBuildingsResourceUpkeep(built, data);
    if (totalUpkeep === 0 && Object.keys(totalResUpkeep).length === 0) {
      titleHtml += `<span class="bld-owned-title-upkeep">· ${BUILDING_UPKEEP_ZERO_LABEL}</span>`;
    } else {
      const parts: string[] = [];
      if (totalUpkeep > 0) parts.push(`−${totalUpkeep}${cityPanelChipIconWrap('res-treasury', 9)}`);
      const res = formatResourceUpkeepText(totalResUpkeep, true);
      if (res) parts.push(res);
      titleHtml += `<span class="bld-owned-title-upkeep">· ${parts.join(' ')}</span>`;
    }
  }
  mount.appendChild(el('div', 'ptitle', titleHtml));
  if (built && data) {
    if (built.length === 0) { mount.appendChild(el('div', 'muted', '(brak)')); return; }
    if (!compact) {
      const totalUpkeep = sumOwnedBuildingsUpkeep(built, data, city);
      const totalResUpkeep = sumOwnedBuildingsResourceUpkeep(built, data);
      const summary = el('div', 'bld-owned-summary');
      summary.innerHTML = formatBuildingUpkeepTotalHtml(totalUpkeep, totalResUpkeep);
      mount.appendChild(summary);
    }
    const scroll = opts?.scrollFill
      ? createScrollList('list-scroll', { fill: true })
      : opts?.visibleRows != null
        ? createScrollList('list-scroll', { visible: opts.visibleRows })
        : null;
    const target = scroll ?? mount;
    const groups = groupBuiltBuildingIds(built, data.buildings);
    for (const { grupa, ids } of groups) {
      const isEmpty = ids.length === 0;
      if (compact && isEmpty) continue;
      const details = el('details', `bld-group${isEmpty ? ' bld-group-empty' : ''}`);
      details.open = !isEmpty;
      const summary = el('summary', 'bld-group-h');
      summary.textContent = isEmpty ? `${grupa} —` : `${grupa} (${ids.length})`;
      details.appendChild(summary);
      if (isEmpty) {
        if (!compact) {
          details.appendChild(el('div', 'muted bld-group-empty-note', '(brak)'));
        }
      } else {
        for (const id of ids) appendOwnedBuildingRow(details, id, data, city, { compact });
      }
      target.appendChild(details);
    }
    if (scroll) mount.appendChild(scroll);
  } else if (!compact) {
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

function renderOwnedBuildingsBar(mount: HTMLElement, city: City, data: GameData | null): void {
  mount.innerHTML = '';
  const built = cfg.getBuiltBuildingIds?.(city.id);
  const count = built?.length ?? 0;
  const bar = el('button', 'bld-owned-bar');
  bar.type = 'button';
  bar.setAttribute('aria-label', `Budynki w mieście (${count}) — pokaż szczegóły`);
  const left = el('span');
  left.innerHTML = `${cityPanelChipIconWrap('cp-buildings', 16)}<span>Budynki w mieście (${count})</span>`;
  left.style.cssText = 'display:inline-flex;align-items:center;gap:0.4em;';
  bar.appendChild(left);
  const chev = el('span', 'bld-owned-chevron');
  chev.textContent = 'ℹ szczegóły';
  bar.appendChild(chev);
  bar.addEventListener('click', (e) => {
    e.stopPropagation();
    showHoverDetailNow(bar, () => buildOwnedBuildingsDetailCard(city, data), 'left');
  });
  attachHoverDetail(bar, () => buildOwnedBuildingsDetailCard(city, data), 280, 'left');
  mount.appendChild(bar);
}

function renderBuildSplitPanel(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  view: CityView | null,
): void {
  mount.innerHTML = '';
  const pane = el('div', 'civ-v-build-pane');
  const mainCol = el('div', 'civ-v-build-main');
  renderBuildList(
    appendPanel(mainCol, 'cs-build'),
    city,
    data,
    view,
    { scrollFill: true },
  );
  pane.appendChild(mainCol);
  const barCol = el('div', 'civ-v-build-owned-bar');
  renderBuildingsOwned(appendPanel(barCol, 'cs-owned'), city, data, { scrollFill: true, compact: true });
  pane.appendChild(barCol);
  mount.appendChild(pane);
}

function appendGarrisonUnitChip(parent: HTMLElement, u: GarrisonUnit): void {
  const hp = u.health ?? 100;
  const max = u.maxHealth ?? 100;
  const pct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, max)) * 100)));
  const low = pct < 40;
  const isHidden = u.inGarnizon === true;
  const chip = el('div', 'civ-v-garrison-chip' + (isHidden ? ' in-garnizon' : ''));
  chip.innerHTML =
    `<span class="gi">${cityPanelChipIconWrap('tb-army', 14)}</span><span class="gn">${u.nazwa}</span>` +
    `<span class="hpb"><span class="hpf ${low ? 'hpl' : ''}" style="width:${pct}%"></span></span>`;
  chip.title = `${u.nazwa} · ${hp}/${max} HP`
    + (isHidden ? ' · w koszarach (ufortyfikowana)' : '');
  if (cfg.onLeaveGarrison) {
    const leaveBtn = document.createElement('button');
    leaveBtn.type = 'button';
    leaveBtn.className = 'civ-v-garrison-leave-btn';
    leaveBtn.textContent = '−';
    leaveBtn.disabled = !isHidden;
    leaveBtn.title = isHidden
      ? `Odfortyfikuj — ${u.nazwa} zostaje na heksie miasta`
      : `${u.nazwa} — już na heksie miasta (sterowanie z mapy)`;
    leaveBtn.setAttribute('aria-label', isHidden ? `Odfortyfikuj — ${u.nazwa}` : u.nazwa);
    if (isHidden) {
      leaveBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        cfg.onLeaveGarrison?.(u.id);
      });
    }
    chip.appendChild(leaveBtn);
  }
  parent.appendChild(chip);
}

function renderTopBarGarrison(mount: HTMLElement, city: City): void {
  mount.innerHTML = '';
  const units = cfg.getUnitsAt?.(city.q, city.r);
  const count = units?.length ?? 0;
  const showDetail = () => buildGarnizonDetailCard(units ?? null, count, city.q, city.r);

  const label = el('button', 'civ-v-garrison-label');
  label.type = 'button';
  label.title = count === 0
    ? 'Garnizon pusty — kliknij, aby zobaczyć szczegóły'
    : `Garnizon — ${count} jedn. w mieście · kliknij, aby zobaczyć listę`;
  const icon = el('span', 'civ-v-garrison-icon');
  icon.innerHTML = cityPanelChipIconWrap('chip-garrison', 18);
  label.appendChild(icon);
  const name = el('span');
  name.textContent = 'Garnizon';
  label.appendChild(name);
  const cnt = el('span', 'civ-v-garrison-count');
  cnt.textContent = units !== undefined ? String(count) : '—';
  label.appendChild(cnt);
  mount.appendChild(label);
  attachInteractiveDetail(label, showDetail, { delayMs: 220, sideHint: 'left' });
}

function buildGarnizonDetailCard(
  units: GarrisonUnit[] | null,
  count: number,
  cityQ?: number,
  cityR?: number,
): HTMLDivElement {
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
    appendDetailSection(card, 'Lista jednostek');
    const list = el('div', 'civ-v-garrison-detail-list');
    for (const u of units) appendGarrisonUnitChip(list, u);
    card.appendChild(list);
    const hiddenCount = units.filter(u => u.inGarnizon === true).length;
    if (hiddenCount >= 1 && cfg.onLeaveAllGarrison && cityQ !== undefined && cityR !== undefined) {
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'civ-v-garrison-leave-all-btn';
      allBtn.textContent = hiddenCount > 1 ? 'Odfortyfikuj wszystkie' : 'Odfortyfikuj';
      allBtn.title = hiddenCount > 1
        ? `Odfortyfikuj wszystkie ${hiddenCount} jednostki — zostają na heksie miasta`
        : 'Odfortyfikuj jednostkę — zostaje na heksie miasta';
      allBtn.addEventListener('click', () => cfg.onLeaveAllGarrison?.(cityQ, cityR));
      card.appendChild(allBtn);
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
  [TerenBazowy.Polarny]: '#d8e4f0',
};
const TEREN_LETTER: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '~', [TerenBazowy.Wybrzeze]: '~',
  [TerenBazowy.Laka]: 'Ł', [TerenBazowy.Rownina]: 'R',
  [TerenBazowy.Pustynia]: 'P', [TerenBazowy.Wzgorza]: 'W', [TerenBazowy.Gory]: 'G',
  [TerenBazowy.Polarny]: '❄',
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
    zrownowazone: `${cityPanelChipIconWrap('field-balanced', 14)} Zrównoważone`,
  };
  gridDetailRow(g3, 'Profil auto', focusLbl[focus] ?? focus);
  gridDetailRow(g3, 'Tryb', tryb === 'reczny' ? 'Ręczny 👤 na mapie' : 'Automatyczny');

  appendDetailFormula(card, `score = w🌾×żywność + w🔨×praca + w💰×${daninaLabelForCity(city).toLowerCase()}`);
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
    const infoLink = el('button', 'okolica-info-link gold');
    infoLink.type = 'button';
    infoLink.textContent = 'ℹ szczegóły';
    infoLink.setAttribute('aria-label', 'Pokaż szczegóły okolicy');
    headEl.appendChild(infoLink);
    attachInteractiveDetail(infoLink, buildDetail, { delayMs: 220, sideHint: 'right' });
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

  const surowceHost = root.querySelector('#cs-oksurowce') as HTMLElement | null;
  if (surowceHost) {
    renderSurowce(surowceHost, city, true);
  }
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

/** Kolejność nawigacji między miastami — od lewej do prawej na mapie (świat X, potem Z). */
function ownerCitiesForNav(city: City): City[] {
  const list = ownerCities(city);
  if (list.length < 2) return list;
  return [...list].sort((a, b) => {
    const aw = axialToWorld(a.q, a.r, HEX_R);
    const bw = axialToWorld(b.q, b.r, HEX_R);
    if (Math.abs(aw.x - bw.x) > 0.01) return aw.x - bw.x;
    if (Math.abs(aw.z - bw.z) > 0.01) return aw.z - bw.z;
    return a.name.localeCompare(b.name, 'pl');
  });
}

/** Tytuł miasta w panelu — dopisek miasto-państwo dla obcych klastrowych (Maciej 2026-07-07). */
function cityPanelTitle(city: City): string {
  return formatCityMapLabel(city);
}

function switchCity(dir: -1 | 1): void {
  if (activeCity === null) return;
  const list = ownerCitiesForNav(activeCity);
  if (list.length < 2) return;
  const idx = list.findIndex(c => c.id === activeCity!.id);
  if (idx < 0) return;
  const next = list[(idx + dir + list.length) % list.length];
  if (!next || next.id === activeCity.id) return;
  activeCity = next;
  cfg.onSwitchCity?.(next.id);
  rerender();
}

/** Nawigacja ← → — eksport dla skrótów klawiszowych w cityUxFrame. */
export function navigateCityPanel(dir: -1 | 1): void {
  switchCity(dir);
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
          <div id="cs-oksurowce" class="okolica-surowce-host"></div>
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
): string {
  return `<button type="button" class="civ-v-w3-chip civ-v-res-interactive" data-res-stat="${statId}" ` +
    `title="${hint.replace(/"/g, '&quot;')}" aria-label="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-w3-chip-icon">${icon}</span>` +
    `<span class="civ-v-w3-chip-lbl">${label}</span>` +
    `<span class="civ-v-w3-chip-val ${cls}">${val}</span>` +
    `</button>`;
}

/** Górny pasek widoku miasta — chipy po bokach nazwy miasta (lewo: ekonomia, prawo: kultura/nauka). */
function buildCityOnlyW3FlankChips(city: City, view: CityView, data: GameData | null): { left: string; right: string } {
  const pracaSplit = cityPracaSplit(city, view, data);
  const pracaCls = pracaSplit.total > 0 ? 'green' : pracaSplit.total < 0 ? 'red' : '';

  const splitHandel = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, splitHandel);
  const goldCls = view.pieniadz > 0 ? 'green' : view.pieniadz < 0 ? 'red' : '';
  const skarbHandel = est.skarb;
  const wealthHandel = est.zam;
  const daninaLblChip = daninaLabelForCity(city);

  const foodSplit = cityFoodSplit(view);
  const foodCls = foodSplit.total > 0 ? 'green' : foodSplit.total < 0 ? 'red' : '';

  const kultCls = view.kultura > 0 ? 'gold' : view.kultura < 0 ? 'red' : '';
  const naukaCls = view.nauka > 0 ? 'blue' : view.nauka < 0 ? 'red' : 'blue';

  const relSt = cfg.getReligionState?.(city.id);
  const cityRel = Math.round(relSt?.przyrostWiernych ?? 0);
  const relCls = cityRel > 0 ? 'gold' : cityRel < 0 ? 'red' : '';

  const economyRow = [
    w3CityChip(
      cityPanelChipIcon('res-work', 20),
      'Praca',
      signed(pracaSplit.total),
      pracaCls,
      'praca',
      `Praca tego miasta · budynki ${signed(pracaSplit.doBudynkow)} · pula ${signed(pracaSplit.doUlepszen)}`,
    ),
    w3CityChip(
      cityPanelChipIcon('res-food', 20),
      'Żywność',
      signed(foodSplit.total),
      foodCls,
      'zywnosc',
      `Bilans żywności: produkcja ${signed(foodSplit.produkcja)} − racje ${foodSplit.racje} = ${signed(foodSplit.total)} · WZROST ${view.wzrostProcent}%`,
    ),
    w3CityChip(
      cityPanelChipIcon('res-treasury', 20),
      'Skarbiec',
      signed(view.pieniadz),
      goldCls,
      'zloto',
      `Netto pieniędzy tego miasta → skarbiec · ${daninaLblChip.toLowerCase()} → skarb ${signed(skarbHandel)} · zamożność ${signed(wealthHandel)}`,
    ),
  ].join('');

  const cultureRow = [
    w3CityChip(
      cityPanelChipIcon('res-science', 20),
      'Nauka',
      signed(view.nauka),
      naukaCls,
      'nauka',
      `Nauka generowana w tym mieście`,
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
  ].join('');

  return { left: economyRow, right: cultureRow };
}

function buildCityResourceStatItems(
  city: City,
  view: CityView | null,
  map: GameMap | null,
  data: GameData | null,
  w3 = false,
): string {
  const empire = resolveEmpireSnap(city, map, data);
  if (w3) {
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

/**
 * Follow-up „przenieś stolicę" (2026-07-21): ★ Stolica (badge) gdy `city` jest
 * aktualną wyznaczoną stolicą swojego ownera; w przeciwnym razie — dla miast
 * GRACZA — przycisk „Ustaw jako stolicę" (widoczny tylko gdy silnik udostępnia
 * `onSetCapital`), wyłączony (disabled) gdy obecna stolica gracza jest oblegana
 * (Q1=A: bez kosztu/cooldownu poza tym warunkiem).
 */
function capitalBadgeOrButtonHtml(city: City): string {
  const capitalId = cfg.getCapitalCityId?.(city.ownerId) ?? null;
  if (capitalId != null && capitalId === city.id) {
    return `<span class="civ-v-w3-capital-badge" title="Stolica">★ Stolica</span>`;
  }
  if (city.ownerId !== 0 || !cfg.onSetCapital) return '';
  const allCitiesForCapital = cfg.getCities?.() ?? [];
  const capitalCity = capitalId ? allCitiesForCapital.find(c => c.id === capitalId) : null;
  const besieged = !!capitalCity?.oblegane;
  if (besieged) {
    return `<button type="button" class="civ-v-w3-capital-btn" disabled ` +
      `title="Obecna stolica (${capitalCity?.name ?? '?'}) jest oblegana — nie można przenieść">Ustaw jako stolicę</button>`;
  }
  return `<button type="button" class="civ-v-w3-capital-btn" id="civ-v-set-capital" ` +
    `title="Przenieś stolicę do tego miasta (za darmo)">Ustaw jako stolicę</button>`;
}

function renderCivResourceTopBar(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  map: GameMap | null,
  data: GameData | null,
  _onClose?: () => void,
): void {
  const flank = view ? buildCityOnlyW3FlankChips(city, view, data) : { left: '', right: '' };
  const multi = ownerCities(city).length > 1;
  const navDis = multi ? '' : 'disabled';
  mount.innerHTML =
    `<div class="civ-v-top-stack">` +
    `<div class="civ-v-top-flank-row">` +
    `<div class="civ-v-w3-chips-flank civ-v-w3-chips-left">${flank.left}</div>` +
    `<div class="civ-v-w3-city-col">` +
    `<div class="civ-v-w3-city-badge">` +
    `<button type="button" class="civ-v-w3-city-nav" id="civ-v-city-prev" ${navDis} title="Poprzednie miasto (←)" aria-label="Poprzednie miasto">‹</button>` +
    `<span class="civ-v-w3-city-name">${cityPanelTitle(city)}</span>` +
    `<button type="button" class="civ-v-w3-city-nav" id="civ-v-city-next" ${navDis} title="Następne miasto (→)" aria-label="Następne miasto">›</button>` +
    `<span class="civ-v-w3-city-pop">${city.population}</span>` +
    capitalBadgeOrButtonHtml(city) +
    `</div>` +
    `<div id="civ-v-garrison-row" class="civ-v-garrison-inline"></div>` +
    `</div>` +
    `<div class="civ-v-w3-chips-flank civ-v-w3-chips-right">${flank.right}</div>` +
    `</div>` +
    `</div>`;
  mount.querySelector('#civ-v-city-prev')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    switchCity(-1);
  });
  mount.querySelector('#civ-v-city-next')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    switchCity(1);
  });
  mount.querySelector('#civ-v-set-capital')?.addEventListener('click', () => {
    cfg.onSetCapital?.(city.id);
    rerender();
  });
  const garrisonRow = mount.querySelector('#civ-v-garrison-row') as HTMLElement | null;
  if (garrisonRow) renderTopBarGarrison(garrisonRow, city);
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

function renderCityIconRightRail(mount: HTMLElement, city: City): void {
  mount.innerHTML = '';
  const scope = el('div', 'civ-cs civ-ux-panel-scope');
  mount.appendChild(scope);
  const iconMount = el('div', 'civ-v-icon-rail-mount');
  iconMount.id = 'cs-icon-rail-right';
  scope.appendChild(iconMount);
  // Decyzje 65B/66B: tytul zakladki 'handel' (tooltip ikony) odzwierciedla
  // Danina/Podatek tej cywilizacji -- CITY_PANEL_ICONS_RIGHT jest stalym
  // modulowym configiem, wiec podmieniamy title per-render zamiast trzymac
  // dynamiczny tekst w stalej.
  const daninaLbl = daninaLabelForCity(city);
  const items = CITY_PANEL_ICONS_RIGHT.map(item => item.id === 'handel'
    ? { ...item, title: `Podział ${daninaLabelGenitive(daninaLbl)} i zamożność — suwaki Skarb / Nauka / Zamożność` }
    : item);
  renderCityIconRail(iconMount, items, true, true);
}

/** Prawy panel (góra): nazwa miasta, ludność, pasek wzrostu. */
function renderCityHeaderCompact(mount: HTMLElement, city: City, view: CityView | null): void {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const osobRazem = cityLudnoscAbsolutna(city.population, epoch);
  mount.innerHTML =
    `<div class="civ-v-city-name">${city.name}</div>` +
    `<div class="civ-v-city-pop">${city.population} obywateli · ≈ ${formatManpower(osobRazem)} · epoka ${epoch}</div>`;
  if (!view) {
    mount.appendChild(el('div', 'muted', 'Brak danych ekonomii'));
    return;
  }
  const foodSplit = cityFoodSplit(view);
  const tick = cfg.getEmpireFoodTick?.(city.ownerId);
  const tickRow = tick?.perCityRows?.find(r => r.cityId === city.id);
  const fed = resolveCityFedForUi(city.id, foodSplit.total, tick);
  const growthPctUi = effectiveGrowthPctForUi(view.wzrostProcent, fed);
  const gainSlots = growthGainPerTurnSlots(city.population, growthPctUi, fed, view.atPopCap);
  const turns = turnsUntilNextCitizen(view.wzrostUlamkowy, gainSlots);
  const etaTxt = view.atPopCap ? 'limit'
    : !fed ? 'brak wzrostu'
      : turns === 0 ? 'w tej turze'
        : turns != null ? `za ≈ ${turns} ${pluralTur(turns)}`
          : '—';
  const grow = el('div', 'civ-v-growth');
  grow.innerHTML =
    `<div class="civ-v-growth-lbl">WZROST · ${fed ? view.wzrostProcent : '—'}% ${loafIconHtml('civ-v-loaf-chip')}</div>` +
    `<div class="muted" style="font-size:0.68em;margin-top:0.12em">Wyżywienie ${formatWyzwienieLabel(view.poziomRacji)} · postęp ${fmtDecPl(view.wzrostUlamkowy)}/1 · ${etaTxt}</div>`;
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
  // Pytanie 71/C (Maciej 2026-07-25): Mennica stoi wyłącznie w stolicy (pytanie
  // 70/B) -> bramka Efektu 1 patrzy na CAŁE imperium, nie tylko to miasto.
  // maMennicaBudynek = budynek fizycznie istnieje (nie burzymy go po utracie
  // złota -- "budynek stoi, efekt śpi", ten sam wzorzec co
  // maMennicaBuiltEmpireWide w turn-economy.ts). Rozdzielone od maDostepDoZlota
  // (PYTANIE 83=B), zeby ponizej dalo sie rozroznic w tekscie DLACZEGO mnoznik
  // nie dziala: brak Mennicy vs brak Waluty vs Mennica usnieta bez zlota.
  const maMennicaBudynek = ownerHasMennica(city.ownerId);
  const maDostepDoZlota = cfg.getOwnerHasZlotoAccess?.(city.ownerId) ?? true;
  const maBiblioteka = cityHasBibliotekaLine(built);
  const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
  const walutaOdkryta = techs.includes('Waluta') || techs.includes('waluta');
  // Zadanie 1 (E1) + PYTANIE 83=B: Mennica dziala TYLKO gdy zbudowana
  // (gdziekolwiek w imperium) ORAZ Waluta odkryta ORAZ cywilizacja MA TERAZ
  // dostep do zlota (turn-economy.ts maMennicaEmpireWide && walutaOdkryta) --
  // identyczna bramka jak silnik, zeby panel nigdy nie pokazywal aktywnego
  // mnoznika, ktorego silnik juz nie liczy.
  const maMennica = maMennicaBudynek && maDostepDoZlota;
  const mennicaAktywna = maMennica && walutaOdkryta;
  // Mennica fizycznie stoi + Waluta odkryta, ale mnoznik SPI bo brak zlota TERAZ.
  const mennicaSpiZBrakuZlota = maMennicaBudynek && walutaOdkryta && !maDostepDoZlota;
  // Pytanie 69 (2026-07-25): tekst pokazuje mnoznik CYWILIZACYJNY skalowany
  // trudnoscia (ten sam co realnie liczy silnik), nie plaski params.mennicaMnoznikPoWalucie.
  const civKeyForMennicaTxt = cfg.getCivKey?.(city.ownerId);
  const mennicaMnoznikVal = params
    ? mnoznikHandelPieniadzForCivByDifficulty(civKeyForMennicaTxt, cfg.data?.civs, cfg.difficulty ?? 'normal', params.mennicaMnoznikPoWalucie)
    : undefined;
  const mennicaMnoznikTxt = mennicaMnoznikVal !== undefined ? `×${mennicaMnoznikVal}` : '×?';
  const est = estimateHandelChips(view, split);
  // Decyzje 65B/66B: etykieta widoczna dla gracza (Danina domyslnie, Podatek gdy
  // Waluta+Mennica W STOLICY -- scislejsze niz `mennicaAktywna` powyzej, ktore
  // opisuje REALNY mnoznik ekonomiczny (gdziekolwiek w imperium, patrz komentarz
  // przy `maMennica`) i NIE jest tu zmieniane.
  const daninaLbl = daninaLabelForCity(city);
  const daninaLblGen = daninaLabelGenitive(daninaLbl);
  const daninaLblAcc = daninaLabelAccusative(daninaLbl);
  // DYSPOZYCJA 85 (Maciej 2026-07-26): premia za trasy handlowe realnie mnoży
  // handelBrutto w silniku (economy.ts, ctx.liczbaAktywnychTrasHandlowych, +5%/trasa
  // -- NIE ruszane tutaj). W UI zostaje WYŁĄCZNIE ta jedna zbiorcza linia (bez listy
  // szlaków, bez nazw partnerów, bez dochodu ze szlaków — to przeniesione do panelu
  // Handel, empireDetailPanel.ts, zgodnie z zasadą rozdziału z dyspozycji).
  const aktywneTrasyCount = activeTradeRouteCountForCity(city);
  const premiaTrasPct = aktywneTrasyCount * TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE;

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = `<span>Podział ${daninaLblGen} — szczegóły</span>`;
  card.appendChild(head);

  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    `${daninaLbl} z pól okolicy to osobny strumień 💰. Najpierw odejmujemy stratę (korupcję), potem suwaki dzielą resztę między skarbiec, naukę i ${HANDEL_ZAMOZNOSC_LABEL.toLowerCase()}. Suma suwaków = 100%, kroki 10%.`,
  );
  card.appendChild(intro);

  const todo = el('div', 'dc-note');
  todo.style.cssText = 'font-style:normal;border-left:2px solid var(--gold);padding-left:0.45em;margin-top:0.35em;';
  todo.innerHTML =
    '<b class="gold">Do rozkminienia (v2):</b> skąd bierze się korupcja (dystans od stolicy, liczba miast, epoka, porządek, tech?), ' +
    'czy gracz może ją obniżać, czy pokazujemy ją per miasto czy imperium. ' +
    `Na razie w UI: stałe <b>${HANDEL_KORUPCJA_PCT_PLACEHOLDER}%</b> ${daninaLblGen} brutto — placeholder, nie wpływa jeszcze na silnik w prototypie.`;
  card.appendChild(todo);

  // PYTANIE 83=B: Mennica fizycznie stoi (nie burzymy jej), ale mnoznik SPI bez
  // aktualnego dostepu do zlota -- gracz musi wiedziec DLACZEGO i CO zrobic.
  if (mennicaSpiZBrakuZlota) {
    const mennicaWarn = el('div', 'dc-note');
    mennicaWarn.style.cssText = 'font-style:normal;border-left:2px solid #e08a8a;padding-left:0.45em;margin-top:0.35em;color:#f0c8c8;';
    mennicaWarn.textContent =
      'Mennica nieaktywna: brak Złota w magazynie państwa (Kopalnia złota, szlak handlowy lub zapas). ' +
      'Uzupełnij magazyn Złotem, żeby mnożnik znów zadziałał — budynek nie jest burzony, tylko czeka.';
    card.appendChild(mennicaWarn);
  }

  appendDetailSection(card, 'Korupcja (placeholder)');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, `${daninaLbl} brutto (szac.)`, est.brutto ? `~${est.brutto}` : '—');
  gridDetailRow(g0, 'Strata korupcji', `−${est.korupcja} (${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto)`);
  gridDetailRow(g0, `${daninaLbl} netto`, est.netto ? `~${est.netto} → split suwaków` : '—');
  if (params) {
    gridDetailRow(g0, 'Silnik (docelowo)', `dystans×${params.korupcjaWspolczynnikDystansu} + miasta×${params.korupcjaWspolczynnikMiast}, cap ${Math.round(params.korupcjaCap * 100)}%`);
  }
  gridDetailRow(
    g0,
    'Premia za trasy handlowe',
    aktywneTrasyCount > 0
      ? `+${premiaTrasPct}% (${aktywneTrasyCount} aktywnych) — już w brutto powyżej`
      : 'brak aktywnych tras',
  );

  appendDetailSection(card, 'Aktualny podział');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Skarb', `${split.procentPieniadz}%${est.skarb ? ` · ~+${est.skarb} z ${daninaLblGen}` : ''}`);
  gridDetailRow(g1, 'Nauka', `${split.procentNauka}%${est.nauka ? ` · ~+${est.nauka} z ${daninaLblGen}` : ''}`);
  gridDetailRow(g1, HANDEL_ZAMOZNOSC_LABEL, `${split.procentLuksus}%${est.zam ? ` · ~+${est.zam} → pula` : ' → pula'}`);
  if (view) {
    gridDetailRow(g1, 'Uwaga', `* Pieniądz i Nauka zawierają też budynki (chipy = tylko udział z ${daninaLblGen} netto)`);
  }

  appendDetailFormula(card, `handelBrutto = Σ ${daninaLblGen} pól`
    + (maTargowisko ? ' × (1 + bonus Targowiska)' : '')
    + (aktywneTrasyCount > 0 ? ' × (1 + premia tras handlowych)' : ''));
  appendDetailFormula(card, `strataKorupcji = handelBrutto × ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% (placeholder UI)`);
  appendDetailFormula(card, 'handelNetto = handelBrutto − strataKorupcji' + (
    mennicaAktywna
      ? ` × Waluta+Mennica (${mennicaMnoznikTxt})`
      : mennicaSpiZBrakuZlota
        ? ' × ×1 (Mennica śpi — brak Złota w magazynie)'
        : ' × ×1 (brak Waluty lub Mennicy)'
  ));
  appendDetailFormula(card, 'nauka = floor(handelNetto × %Nauka) + budynki  ← już zawiera mnożnik Waluty+Mennicy powyżej');
  appendDetailFormula(card, 'skarb_z_handlu = floor(handelNetto × %Skarb)  ← już zawiera mnożnik Waluty+Mennicy powyżej');
  appendDetailFormula(card, `${HANDEL_ZAMOZNOSC_LABEL} = floor(handelNetto × %${HANDEL_ZAMOZNOSC_LABEL}) → pula zamożności  ← też już zawiera mnożnik`);

  appendDetailAlgo(card, `Algorytm podziału ${daninaLblGen} (cityYieldPerTurn)`, [
    `Zbierz ${daninaLblAcc} ze wszystkich obrabianych pól + centrum miasta.`,
    maTargowisko ? 'Targowisko zwiększa handelBrutto o bonus procentowy.' : 'Bez Targowiska — tylko plony z terenu.',
    aktywneTrasyCount > 0
      ? `Trasy handlowe: +${premiaTrasPct}% do handelBrutto (${aktywneTrasyCount} aktywnych — szczegóły szlaków i partnerów w panelu Handel, żeton paska zasobów).`
      : 'Bez aktywnych tras handlowych — brak premii do handelBrutto.',
    `Odejmij korupcję (placeholder ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto; docelowo: dystans, miasta, cap) → handelNetto.`,
    'Waluta + Mennica RAZEM (decyzja 2026-07-25) mnożą całe handelNetto — Skarb, Naukę i ' + HANDEL_ZAMOZNOSC_LABEL + ' równocześnie. Sam tech Waluty już NIE wystarcza.',
    `Podziel handelNetto suwakami: Skarb / Nauka / ${HANDEL_ZAMOZNOSC_LABEL} (suma 100%).`,
    mennicaAktywna
      ? `Mennica + Waluta razem mnożą całe ${daninaLbl} netto ${mennicaMnoznikTxt} (Skarb, Nauka i ${HANDEL_ZAMOZNOSC_LABEL} rosną razem).`
      : mennicaSpiZBrakuZlota
        ? `Mennica zbudowana i Waluta odkryta, ale mnożnik ŚPI: brak Złota w magazynie państwa — wraca sam po uzupełnieniu zapasu.`
        : maMennicaBudynek
          ? 'Mennica zbudowana, ale bez Waluty jeszcze nic nie mnoży (bramka: budynek + technologia, obie wymagane).'
          : `Bez Mennicy — ${daninaLbl} netto bez mnożnika, niezależnie od tego czy Waluta jest odkryta.`,
    maBiblioteka ? `Biblioteka dodaje % bonusu do Nauki (łącznie z Nauką z ${daninaLblGen}).` : `Nauka = wyłącznie udział z ${daninaLblGen} + budynki.`,
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
    `${daninaLbl}, zamożność, racje/wzrost i porządek — ustawienia w tej kolumnie wpływają na każdą turę. ` +
    `Podział ${daninaLblGen} jest per miasto; racje żywności — per miasto (batony 1/2/3).`;
  card.appendChild(note);
  return card;
}

function renderHandelSlidersPanel(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {
  mount.innerHTML = '';
  const daninaLbl = daninaLabelForCity(city);
  appendSectionTitleWithDetails(mount, `<span>Podział ${daninaLabelGenitive(daninaLbl)}</span>`, () => buildHandelDetailCard(city, view, data));
  const split = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, split);
  if (view) {
    appendTabIndicators(mount, [
      {
        icon: cityPanelChipIcon('cp-trade', 14),
        label: daninaLbl,
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

/** E7 — bonus Handlu na trasę (musi zgadzać się z hardcoded 0.05 w game/economy.ts cityYieldPerTurn). */
const TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE = 5;

/**
 * DYSPOZYCJA 85 (Maciej 2026-07-26): panel miasta NIE pokazuje już listy szlaków/
 * partnerów/dochodu z tras (to poszło do panelu Handel — imperium, empireDetailPanel.ts).
 * Tu zostaje WYŁĄCZNIE liczba aktywnych tras tego miasta — potrzebna do JEDNEJ linii
 * "premia za trasy handlowe: +X%" w rozbiciu Podatku/Daniny (ta premia realnie mnoży
 * handelBrutto w silniku, patrz economy.ts ctx.liczbaAktywnychTrasHandlowych — silnik
 * NIE jest tu ruszany, tylko odczytany ten sam fakt co silnik już liczy).
 */
function activeTradeRouteCountForCity(city: City): number {
  const all = cfg.getTradeRoutes?.() ?? [];
  let n = 0;
  for (const route of all) {
    if (route.status !== 'polaczony') continue;
    if (route.fromCityId === city.id || route.toCityId === city.id) n++;
  }
  return n;
}

function renderCivMapChrome(mount: HTMLElement, city: City, onClose?: () => void): void {
  mount.innerHTML =
    `<div class="civ-v-map-bottom-stack">` +
    `<div class="civ-v-exit-bottom-row">` +
    `<button type="button" class="civ-v-exit-map-btn" id="civ-v-map-close" title="Wróć na mapę świata (Esc)">` +
    `<span class="civ-v-exit-ic">${cityPanelBrandIcon('menu-exit', 24)}</span>` +
    `<span>Wróć na mapę</span>` +
    `</button>` +
    `<span class="civ-v-exit-foot-hint">Esc — szybkie wyjście</span>` +
    `</div>` +
    `<div id="cs-okolica-center" class="civ-v-okolica-center">` +
    `<div id="cs-okhead-ux" class="ptitle civ-v-okolica-head"></div>` +
    `<div id="cs-oktoolbar-ux" class="okolica-toolbar okolica-toolbar-map"></div>` +
    `<div id="cs-okmode" class="okolica-mode-hint civ-v-okmode-map"></div>` +
    `</div>` +
    `</div>` +
    `<div id="cs-okolica-aux" hidden aria-hidden="true">` +
    `<div id="cs-oksurowce" class="okolica-surowce-host"></div>` +
    `<div id="cs-okolica" class="okolica-grid-host"></div>` +
    `<div id="cs-okstats" class="okstats is-collapsed"></div>` +
    `<div id="cs-okhint" class="okhint is-collapsed"></div>` +
    `</div>`;
  mount.querySelector('#civ-v-map-close')?.addEventListener('click', () => closeCityView(onClose));
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
  priorytetTypow: BudowaFocus[],
  tryb: BudowaTryb,
  lista: string[],
): void {
  const profiles = BUDOWA_TYP_FOCUS;
  const active = tryb === 'priorytet' ? priorytetTypow : [];
  for (const id of profiles) {
    const idx = active.indexOf(id);
    const inList = idx >= 0;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = tryb === 'priorytet' && inList ? 'on' : '';
    setOkolicaProfileButtonIconOnly(b, BUDOWA_FOCUS_BRAND[id]);
    const prioLabel = inList ? `${idx + 1}. ` : '';
    b.title = `${prioLabel}${BUDOWA_FOCUS_TITLE[id]}${inList ? ` (priorytet ${idx + 1})` : ''}`;
    b.disabled = !cfg.onBudowaPriorytetChange;
    if (inList && tryb === 'priorytet') {
      const badge = document.createElement('span');
      badge.className = 'budowa-prio-badge';
      badge.textContent = String(idx + 1);
      badge.style.cssText =
        'position:absolute;top:-0.15em;right:-0.15em;font-size:0.62em;font-weight:700;' +
        'background:var(--gold);color:#1a1208;border-radius:50%;min-width:1.1em;height:1.1em;' +
        'line-height:1.1em;text-align:center;pointer-events:none;';
      b.style.position = 'relative';
      b.appendChild(badge);
    }
    if (tryb === 'lista') {
      b.title = `Wyjdź z Listy → Priorytet: ${BUDOWA_FOCUS_TITLE[id]}`;
    }
    b.addEventListener('click', () => {
      if (!cfg.onBudowaPriorytetChange) return;
      let next: BudowaFocus[];
      let nextTryb: BudowaTryb;
      if (tryb === 'lista') {
        // Wyjście z Listy — bez duplikowania typów w priorytecie.
        nextTryb = 'priorytet';
        next = priorytetTypow.includes(id) ? [...priorytetTypow] : [...priorytetTypow, id];
        if (next.length === 0) next = [id];
      } else if (tryb === 'zrownowazone') {
        // Wyjście ze zrównoważonego: start od klikniętego typu (nie włączaj całej zapisanej piątki).
        nextTryb = 'priorytet';
        next = [id];
      } else if (tryb === 'reczny') {
        nextTryb = 'priorytet';
        next = priorytetTypow.includes(id) ? [...priorytetTypow] : [...priorytetTypow, id];
        if (next.length === 0) next = [id];
      } else if (inList) {
        nextTryb = 'priorytet';
        next = priorytetTypow.filter(f => f !== id);
        if (next.length === 0) next = [id];
      } else {
        nextTryb = 'priorytet';
        next = [...priorytetTypow, id];
      }
      cfg.onBudowaPriorytetChange?.(city.id, sanitizeBudowaPriorytetTypow(next), nextTryb);
      rerender();
    });
    wrap.appendChild(b);
  }
  if (cfg.onBudowaPriorytetChange) {
    const zrownBtn = document.createElement('button');
    zrownBtn.type = 'button';
    zrownBtn.className = tryb === 'zrownowazone' ? 'on' : '';
    setOkolicaProfileButtonIconOnly(zrownBtn, BUDOWA_FOCUS_BRAND.zrownowazone);
    zrownBtn.title = tryb === 'zrownowazone'
      ? 'Auto zrównoważone (wszystkie kategorie)'
      : BUDOWA_FOCUS_TITLE.zrownowazone;
    zrownBtn.addEventListener('click', () => {
      cfg.onBudowaPriorytetChange?.(
        city.id,
        sanitizeBudowaPriorytetTypow(priorytetTypow),
        'zrownowazone',
      );
      rerender();
    });
    wrap.appendChild(zrownBtn);
  }
  if (cfg.onBudowaListaChange) {
    const listaBtn = document.createElement('button');
    listaBtn.type = 'button';
    listaBtn.className = tryb === 'lista' ? 'on' : '';
    listaBtn.textContent = 'Lista';
    listaBtn.title = tryb === 'lista'
      ? 'Wyjdź z Listy (wróć do Priorytetu) — albo kliknij Ręczny / ikonę typu'
      : 'Lista nazwana — buduj wg kolejności';
    listaBtn.style.cssText = 'font-size:0.68em;padding:0.15em 0.45em;min-width:auto;';
    listaBtn.addEventListener('click', () => {
      if (tryb === 'lista') {
        // Ponowne kliknięcie „Lista” zamyka edytor → Priorytet.
        const next = sanitizeBudowaPriorytetTypow(priorytetTypow);
        cfg.onBudowaPriorytetChange?.(city.id, next, 'priorytet');
      } else {
        cfg.onBudowaListaChange?.(city.id, [...lista], 'lista');
      }
      rerender();
    });
    wrap.appendChild(listaBtn);
  }
  if (cfg.onBudowaEnterManual) {
    const recBtn = document.createElement('button');
    recBtn.type = 'button';
    recBtn.className = 'reczny' + (tryb === 'reczny' ? ' on' : '');
    setOkolicaProfileButtonIconOnly(recBtn, 'chip-manpower');
    recBtn.title = tryb === 'lista'
      ? 'Wyjdź z Listy → Ręczny (własna kolejka budynków)'
      : 'Ręczny — własny wybór budynków w kolejce';
    recBtn.addEventListener('click', () => { cfg.onBudowaEnterManual?.(city.id); rerender(); });
    wrap.appendChild(recBtn);
  }
}

function appendBudowaListaBar(
  parent: HTMLElement,
  city: City,
  lista: string[],
  biblioteka?: BudowaListaBiblioteka,
): void {
  const data = gameData();
  const bar = el('div', 'budowa-lista-bar');
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const buildingName = (id: string): string => {
    const def = data?.buildings.find(b => b.id === id);
    return def?.nazwa ?? id;
  };

  // Jawne wyjście z edytora Listy (Maciej 2026-08-04) — profil typów / Ręczny też działają.
  const head = el('div');
  head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:0.4em;margin-bottom:0.12em;';
  const headLbl = el('span', 'muted');
  headLbl.style.fontSize = '0.72em';
  headLbl.textContent = 'Edycja listy budowy';
  head.appendChild(headLbl);
  if (cfg.onBudowaPriorytetChange || cfg.onBudowaEnterManual) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Zamknij listę';
    closeBtn.title = 'Wyjdź z Listy — wróć do Priorytetu typów (albo Ręczny obok)';
    closeBtn.style.cssText = 'font-size:0.68em;padding:0.12em 0.4em;cursor:pointer;';
    closeBtn.addEventListener('click', () => {
      if (cfg.onBudowaPriorytetChange) {
        const prio = sanitizeBudowaPriorytetTypow(
          city.budowaPriorytetTypow?.length
            ? city.budowaPriorytetTypow
            : DEFAULT_BUDOWA_PRIORYTET_TYPOW,
        );
        cfg.onBudowaPriorytetChange(city.id, prio, 'priorytet');
      } else {
        cfg.onBudowaEnterManual?.(city.id);
      }
      rerender();
    });
    head.appendChild(closeBtn);
  }
  bar.appendChild(head);

  if (lista.length === 0) {
    bar.appendChild(el('div', 'muted', 'Lista pusta — dodaj budynki (+)'));
  } else {
    for (let i = 0; i < lista.length; i++) {
      const id = lista[i];
      if (!id) continue;
      const def = data?.buildings.find(b => b.id === id);
      const bEpoch = def?.epokaWejscia ?? 1;
      const epochLocked = bEpoch > epoch;
      const row = el('div', 'budowa-lista-row');
      if (epochLocked) row.style.opacity = '0.55';
      const name = el('span', 'budowa-lista-name');
      name.textContent = `${i + 1}. ${buildingName(id)}${epochLocked ? ' 🔒' : ''}`;
      row.appendChild(name);
      if (cfg.onBudowaListaChange) {
        const up = document.createElement('button');
        up.type = 'button';
        up.textContent = '↑';
        up.title = 'Wyżej';
        up.disabled = i === 0;
        up.addEventListener('click', () => {
          const next = [...lista];
          const a = next[i - 1];
          const b = next[i];
          if (!a || !b) return;
          next[i - 1] = b;
          next[i] = a;
          cfg.onBudowaListaChange?.(city.id, next, 'lista');
          rerender();
        });
        row.appendChild(up);
        const down = document.createElement('button');
        down.type = 'button';
        down.textContent = '↓';
        down.title = 'Niżej';
        down.disabled = i === lista.length - 1;
        down.addEventListener('click', () => {
          const next = [...lista];
          const a = next[i];
          const b = next[i + 1];
          if (!a || !b) return;
          next[i] = b;
          next[i + 1] = a;
          cfg.onBudowaListaChange?.(city.id, next, 'lista');
          rerender();
        });
        row.appendChild(down);
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.textContent = '✕';
        rm.title = 'Usuń z listy';
        rm.addEventListener('click', () => {
          const next = lista.filter((_, j) => j !== i);
          cfg.onBudowaListaChange?.(city.id, next, 'lista');
          rerender();
        });
        row.appendChild(rm);
      }
      bar.appendChild(row);
    }
  }

  const addRow = el('div');
  addRow.style.cssText = 'display:flex;gap:0.3em;align-items:center;margin-top:0.12em;flex-wrap:wrap;';
  if (cfg.onBudowaListaChange && data) {
    const sel = document.createElement('select');
    sel.style.cssText = 'font-size:0.68em;max-width:9em;';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = '+ dodaj…';
    sel.appendChild(ph);
    const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
    const prodCtx = productionCtxForCity(city);
    const buildableIds = new Set(
      buildableProduction(city, data, techs, prodCtx).map(it => it.id),
    );
    const allBuildings = [...data.buildings].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));
    for (const b of allBuildings) {
      if (lista.includes(b.id)) continue;
      const epochLocked = (b.epokaWejscia ?? 1) > epoch;
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.nazwa;
      if (epochLocked) {
        opt.style.color = '#888';
        opt.textContent += ' 🔒';
      } else if (!buildableIds.has(b.id)) {
        opt.style.color = '#888';
        opt.textContent += ' (zabl.)';
      }
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => {
      const id = sel.value;
      if (!id || lista.includes(id)) return;
      cfg.onBudowaListaChange?.(city.id, dedupeBudowaLista([...lista, id]), 'lista');
      sel.value = '';
      rerender();
    });
    addRow.appendChild(sel);
  }
  bar.appendChild(addRow);

  if (
    cfg.onBudowaListaCreateTemplate
    || cfg.onBudowaListaLoadTemplate
    || cfg.onBudowaListaRenameTemplate
    || cfg.onBudowaListaDeleteTemplate
    || cfg.onBudowaListaLoadAllCities
  ) {
    const tplBar = el('div', 'budowa-lista-slots');
    tplBar.style.cssText = 'display:flex;flex-direction:column;gap:0.2em;margin-top:0.2em;';

    if (cfg.onBudowaListaCreateTemplate && lista.length > 0) {
      const createBtn = document.createElement('button');
      createBtn.type = 'button';
      createBtn.textContent = 'Stwórz listę';
      createBtn.title = 'Zapisz bieżącą listę budynków jako nowy szablon';
      createBtn.addEventListener('click', () => {
        const defaultName = defaultBudowaListaNazwa(biblioteka ?? []);
        const nazwa = window.prompt('Nazwa listy:', defaultName)?.trim();
        if (!nazwa) return;
        cfg.onBudowaListaCreateTemplate?.(city.id, nazwa);
        rerender();
      });
      tplBar.appendChild(createBtn);
    }

    for (const tpl of biblioteka ?? []) {
      const row = el('div');
      row.style.cssText = 'display:flex;gap:0.25em;align-items:center;flex-wrap:wrap;';
      const label = el('span');
      label.textContent = tpl.nazwa;
      label.style.cssText = 'font-size:0.68em;min-width:4em;';
      row.appendChild(label);
      if (cfg.onBudowaListaLoadTemplate) {
        const loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.textContent = 'Wgraj';
        loadBtn.title = `Wgraj „${tpl.nazwa}” (${tpl.budynki.length} pozycji)`;
        loadBtn.addEventListener('click', () => {
          cfg.onBudowaListaLoadTemplate?.(city.id, tpl.id);
          rerender();
        });
        row.appendChild(loadBtn);
      }
      if (cfg.onBudowaListaRenameTemplate) {
        const renameBtn = document.createElement('button');
        renameBtn.type = 'button';
        renameBtn.textContent = 'Zmień nazwę';
        renameBtn.title = `Zmień nazwę „${tpl.nazwa}”`;
        renameBtn.addEventListener('click', () => {
          const nazwa = window.prompt('Nowa nazwa listy:', tpl.nazwa)?.trim();
          if (!nazwa || nazwa === tpl.nazwa) return;
          cfg.onBudowaListaRenameTemplate?.(tpl.id, nazwa);
          rerender();
        });
        row.appendChild(renameBtn);
      }
      if (cfg.onBudowaListaDeleteTemplate) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = 'Usuń';
        delBtn.title = `Usuń szablon „${tpl.nazwa}”`;
        delBtn.addEventListener('click', () => {
          if (!window.confirm(`Usunąć listę „${tpl.nazwa}”?`)) return;
          cfg.onBudowaListaDeleteTemplate?.(tpl.id);
          rerender();
        });
        row.appendChild(delBtn);
      }
      tplBar.appendChild(row);
    }

    if (cfg.onBudowaListaLoadAllCities && lista.length > 0) {
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.textContent = 'Wgraj do wszystkich miast';
      allBtn.title = 'Nadpisze Listę i tryb Lista we wszystkich twoich miastach';
      allBtn.addEventListener('click', () => {
        cfg.onBudowaListaLoadAllCities?.(city.id, [...lista]);
        rerender();
      });
      tplBar.appendChild(allBtn);
    }

    if (tplBar.childNodes.length > 0) {
      bar.appendChild(tplBar);
    }
  }
  parent.appendChild(bar);
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

function resolveDetailSideHint(mount: HTMLElement): 'left' | 'right' | 'auto' {
  if (mount.closest('.civ-ux-left')) return 'left';
  if (mount.closest('.civ-ux-right')) return 'right';
  return 'auto';
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
  const infoLink = el('button', 'okolica-info-link civ-w4-panel-detail gold');
  infoLink.type = 'button';
  infoLink.textContent = 'i szczegóły';
  infoLink.setAttribute('aria-label', 'Pokaż szczegóły sekcji');
  head.appendChild(infoLink);
  mount.appendChild(head);
  attachInteractiveDetail(infoLink, buildDetail, {
    delayMs: 220,
    sideHint: resolveDetailSideHint(mount),
  });
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
  { id: 'spichlerz', iconId: 'cp-granary', title: 'Wyżywienie i wzrost — suwak 0–6' },
  // Tytuł poniżej to fallback modułowej stałej — DYSPOZYCJA 85 (Maciej 2026-07-26):
  // realny tooltip gracza podmienia renderCityIconRightRail() na "Podział daniny/podatku"
  // (daninaLabelGenitive), więc ten string nigdy nie trafia na ekran. Celowo bez słowa
  // "handel" mimo to — Handel jest WYŁĄCZNIE zakładką imperium, nie miasta.
  { id: 'handel', iconId: 'cp-trade', title: 'Podział daniny/podatku i zamożność — suwaki Skarb / Nauka / Zamożność' },
  { id: 'praca', iconId: 'cp-labor', title: 'Podział pracy — budynki i pula imperium' },
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
    `<div id="cs-oksurowce" class="okolica-surowce-host"></div>` +
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
    renderCityIconRightRail(mounts.rightIconRail, city);
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
  }

  const footEl = rightScope.querySelector('#cs-surowce-foot');
  if (footEl) footEl.remove();
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
