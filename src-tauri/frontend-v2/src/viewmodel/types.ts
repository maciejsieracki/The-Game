/**
 * viewmodel/types.ts — kształty DTO modelu widoku (Rust → webview).
 *
 * Źródło: `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` §5, §6.0–§6.17
 * (temat R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1, PASS).
 *
 * TYLKO TYPY. Zero logiki, zero wartości domyślnych, zero importów z modułów gry.
 * Reguła P5.13: UI nie liczy reguł gry — każda liczba poniżej przychodzi z Rust.
 *
 * Konwencja nazw (P5-0 ZAŁOŻENIE Z5): Rust `serde(rename_all = "camelCase")`,
 * więc pola z P5-0 zapisane w snake_case (`pct_per_turn`) mają tu postać camelCase
 * (`pctPerTurn`). Nazwy typów 1:1 z P5-0. Identyfikatory = newtype `u64` po stronie Rust
 * (P2-3), w JSON liczba.
 *
 * Pola, których P5-0 nie rozpisał (odwołanie do typu web 1:1, P5-0 §10 pkt 7/9),
 * są oznaczone `NIE_ZMIERZONO` i mają typ `Readonly<Record<string, unknown>>` —
 * do doprecyzowania w temacie portującym konsumenta (PORTING-QUEUE.md).
 */

// ─── Identyfikatory i podstawy ────────────────────────────────────────────────

export type CityId = number;
export type PlayerId = number;
export type UnitId = number;
export type SlotId = string;
export type TechId = string;
export type ResourceKey = string;
export type UnitTypeKey = string;

/** Heks osiowy (P5-0 §6 Z5). Mapowanie na `PositionDto(x,y)` — NIE_ZMIERZONO (P5-0 §10 pkt 5). */
export interface HexCoord {
  q: number;
  r: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Placeholder dla typu web 1:1 nierozpisanego w P5-0 (§10 pkt 7). */
export type NieZmierzonoDto = Readonly<Record<string, unknown>>;

/** Mapa surowiec → ilość (pusta = brak braków). */
export type ResourceAmounts = Readonly<Record<ResourceKey, number>>;

// ─── Transport (P5-0 §6 ZAŁOŻENIE Z6) ─────────────────────────────────────────

export type ViewKey =
  | { kind: 'city'; id: CityId }
  | { kind: 'empire'; id: PlayerId }
  | { kind: 'hex'; hex: HexCoord }
  | { kind: 'unit'; id: UnitId }
  | { kind: 'research'; id: PlayerId }
  | { kind: 'staticCatalog' }
  | { kind: 'minimap' }
  | { kind: 'saveSlots' };

export interface ViewRevision {
  rev: number;
  turn: number;
  activeOwner: PlayerId;
  dirty: ViewKey[];
}

// ─── §6.1 StaticCatalogDto ───────────────────────────────────────────────────

export interface StaticCatalogConstantsDto {
  handelPctStep: number;
  maxProcentNauka: number;
  minPodzialPracyBudynkiPercent: number;
  maxPodzialPracyBudynkiPercent: number;
  maxProcentPuliImperium: number;
  maxUlepszeniaPracaAutoPercent: number;
  wyzywienieMin: number;
  wyzywienieMax: number;
  wyzywienieStep: number;
  researchQueueMax: number;
  progDominacjiPower: number;
  citizenUpkeepRatePerCitizen: number;
  handelZlozeCenaBaza: number;
  barbarianCooperationDefaultDurationTurns: number;
  fogExploredBrightness: number;
  epochNumberToName: Readonly<Record<string, string>>;
  improvementKeys: string[];
  cityBuildingPrereq: NieZmierzonoDto;
  waterAccessBuildingIds: string[];
  cityPanelRangeDepositLabels: NieZmierzonoDto;
  tempoGry: NieZmierzonoDto;
}

export interface StaticCatalogLabelsDto {
  podzialPracyPulaLbl: string;
  podzialPracyPulaPelna: string;
  podzialPracyPulaTip: string;
  porBandLabels: string[];
  traktatHandlowyLabel: string;
  resourceAccessTradeWithdrawnReason: string;
}

/** Zawartość JSON 1:1 (D-UI-4; P5-0 Z2) + stałe + etykiety. */
export interface StaticCatalogDto {
  contentHash: string;
  buildings: unknown;
  units: unknown;
  tech: unknown;
  terrainImprovements: unknown;
  wonders: unknown;
  counters: unknown;
  civs: unknown;
  cityNamesPools: unknown;
  powerParams: unknown;
  uiParams: unknown;
  wiki: unknown;
  constants: StaticCatalogConstantsDto;
  labels: StaticCatalogLabelsDto;
  /** Zastępuje `categoryOf` (P5-0 §6.1). */
  unitCategory: Readonly<Record<UnitTypeKey, string>>;
}

// ─── §5 / §6.2 Miasto (pola dzielone renderer ↔ UI, D-UI-9) ───────────────────

export interface CityRefDto {
  id: CityId;
  owner: PlayerId;
  q: number;
  r: number;
  name: string;
  mapLabel: string;
  population: number;
  isCapital: boolean;
  isMine: boolean;
}

export type GrowthBreakdownDto = NieZmierzonoDto;

export interface CityGrowthDto {
  pctPerTurn: number;
  fed: boolean;
  breakdown: GrowthBreakdownDto;
  wzrostUlamkowy: number;
  turnsToNextCitizen: number | null;
  maxSafeRation: number;
}

export type RebelStateDto = NieZmierzonoDto;

export interface CityRevoltDto {
  bunt: boolean;
  warning: boolean;
  graceRemaining: number | null;
  rebelState: RebelStateDto | null;
  postCaptureLawTurns: number | null;
}

export type ProductionItemKind = 'building' | 'unit' | 'wonder' | 'improvement';

export interface ProductionItemDto {
  kind: ProductionItemKind;
  id: string;
  label: string;
  koszt: number;
  postep: number;
  etaTurns: number | null;
  stockCost: ResourceAmounts;
  /** Pusty = OK (P5-0 §5 wiersz „brak surowców”). */
  stockMissing: ResourceAmounts;
}

export interface CityProductionDto {
  front: ProductionItemDto | null;
  queue: ProductionItemDto[];
  paused: boolean;
  rekrutacja: ProductionItemDto[];
}

export interface SplitDto {
  [key: string]: number;
}

export interface RationPreviewDto {
  poziom: number;
  kosztRacji: number;
  wzrostProcent: number;
}

export type EmpireFoodDto = NieZmierzonoDto;
export type CityHealthLineDto = NieZmierzonoDto;
export type SocietyLineDto = NieZmierzonoDto;
export type CitizenUpkeepCoverageDto = NieZmierzonoDto;
export type CultureStateDto = NieZmierzonoDto;
export type ReligionStateDto = NieZmierzonoDto;
export type CityMoneySnapDto = NieZmierzonoDto;
export type CityManpowerSnapshotDto = NieZmierzonoDto;
export type BuiltBuildingGroupDto = NieZmierzonoDto;
export type TileYieldDto = NieZmierzonoDto;
export type GarrisonUnitDto = NieZmierzonoDto;
export type BudowaListaTemplateDto = NieZmierzonoDto;

export interface OkolicaTileDto {
  hex: HexCoord;
  yield: TileYieldDto;
  improvements: string[];
}

export interface DaninaLabelForms {
  mianownik: string;
  dopelniacz: string;
  biernik: string;
}

export interface CityPanelDto {
  city: CityRefDto;
  navOrder: CityId[];
  yields: { praca: number; pieniadz: number; nauka: number; kultura: number; zywnoscBrutto: number };
  food: {
    kosztRacji: number;
    bilansLokalny: number;
    poziomRacji: number;
    maxSafePoziom: number;
    autoWyzywienie: boolean;
    overrideLocal: boolean;
    rationLevels: RationPreviewDto[];
    empireFood: EmpireFoodDto;
  };
  /** §5 — to samo pole co `CityMapBadge.growth` w rendererze Rust. */
  growth: CityGrowthDto;
  popCaps: {
    bezAkweduktu: number;
    spichlerz: number;
    zAkweduktem: number;
    aktualny: number;
    atCap: boolean;
    maSpichlerz: boolean;
    maAkwedukt: boolean;
  };
  health: { total: number; lines: CityHealthLineDto[] };
  order: {
    szczescie: number;
    porzadekPct: number;
    band: number;
    bandLabel: string;
    lines: SocietyLineDto[];
    citizenUpkeep: CitizenUpkeepCoverageDto;
    postCaptureLaw: string | null;
    /** §5 wiersz „Stan buntu” — to samo źródło co `CityMapBadge.revolt`. */
    revolt: CityRevoltDto;
  };
  culture: CultureStateDto | null;
  religion: ReligionStateDto | null;
  wealth: { poziom: number; cap: number; prog: number; mnoznik: number; zadowolenie: number; rownowaga: number };
  money: CityMoneySnapDto;
  manpower: CityManpowerSnapshotDto;
  sliders: {
    handel: SplitDto;
    handelDefault: SplitDto;
    handelOverride: boolean;
    pracaBudynkiPct: number;
    pracaProcentPuli: number;
    pracaOverride: boolean;
  };
  production: CityProductionDto;
  buildOptions: BuildOptionDto[];
  recruitOptions: RecruitOptionDto[];
  built: BuiltBuildingGroupDto[];
  okolica: {
    focus: string;
    tryb: string;
    overrideLocal: boolean;
    range: number;
    worked: HexCoord[];
    excluded: HexCoord[];
    illegalManual: HexCoord[];
    tiles: OkolicaTileDto[];
  };
  budowa: {
    tryb: string;
    priorytetTypow: string[];
    lista: string[];
    biblioteka: BudowaListaTemplateDto[];
    overrideLocal: boolean;
  };
  garrison: GarrisonUnitDto[];
  trade: { activeRoutes: number; buildingBonus: number; missingTreatyPartners: string[] };
  labels: { danina: DaninaLabelForms };
  autoManage: boolean;
}

// ─── §6.3 Opcje budowy / rekrutacji ──────────────────────────────────────────

export interface BuildOptionDto {
  item: ProductionItemDto;
  level: number;
  available: boolean;
  blockReasons: string[];
  prereqChips: { label: string; met: boolean }[];
  workCost: number;
  goldCost: number;
  stockCost: ResourceAmounts;
  stockMissing: ResourceAmounts;
  upkeepGold: number;
  upkeepResources: ResourceAmounts;
  effectLines: string[];
  structuralDefensePct: number | null;
  unitRoleMult: { role: string; cumulative: number } | null;
  superseded: boolean;
  queued: boolean;
}

export interface RecruitOptionDto {
  unitType: UnitTypeKey;
  label: string;
  category: string;
  power: number;
  goldCost: number;
  manpowerCost: number;
  stockCost: ResourceAmounts;
  stockMissing: ResourceAmounts;
  upkeepResources: ResourceAmounts;
  affordable: boolean;
  chipMissing: boolean;
}

// ─── §6.4 / §6.5 Imperium ───────────────────────────────────────────────────

export type SixStatsDto = NieZmierzonoDto;

/** = dzisiejszy `EmpireHudSnap` (cityPanel.ts:1075-1106) — pola NIE_ZMIERZONO poza `civWide`. */
export interface EmpireHudDto {
  snap: NieZmierzonoDto;
  civWide: SixStatsDto;
}

export interface EmpireDetailDto {
  defaultHandel: SplitDto;
  defaultPracaProcentPuli: number;
  defaultRation: number;
  resourceUsage: NieZmierzonoDto;
  resourceUsageTotal: number;
  citizenUpkeepPerCitizen: number;
  manpower: { obywateleLabel: string; rekruciTotal: number };
  improvementPolicy: NieZmierzonoDto;
}

// ─── §6.6 Dyplomacja ─────────────────────────────────────────────────────────

export type BasketItemDto = NieZmierzonoDto;

export interface DiplomacyBasketPreviewRequest {
  partner: PlayerId;
  mode: 'trade' | 'gift' | 'treaty';
  actionId: string;
  give: BasketItemDto[];
  receive: BasketItemDto[];
  turns: number;
  resourceTradeMode: string;
}

export interface DiplomacyBasketPreviewDto {
  givePn: number | null;
  receivePn: number | null;
  fairMinPn: number;
  balancePn: number;
  /** Liczone TĄ SAMĄ funkcją Rust co bramka przyjęcia (P5-0 §6.6 wymóg). */
  accepted: boolean;
  relation: { total: number; signed: number; modPct: number; modLabel: string };
  treatyPw: { my: number; their: number; bilateral: number; base: number };
  trust: { surplusPn: number; delta: number; deltaRaw: number; cap: number; gained: number };
  dobraWola: { perTurn: number; turns: number } | null;
  giftTrust: number | null;
  validation: { valid: boolean; reason: string | null };
  currencyForbiddenWar: boolean;
  turnsMultiplier: number;
  brief: { give: string; receive: string };
}

export interface TradeableItemsDto {
  units: string[];
  techs: string[];
  zloza: { id: string; label: string; basePrice: number }[];
  resourceAccess: { id: string; pn: number }[];
  surowce: { id: string; pn: number; step: number }[];
}

export interface DiplomacyAudienceDto {
  nastawienie: { scores: NieZmierzonoDto; label: string; hint: string };
  wiarygodnosc: {
    label: string;
    badgeTier: number;
    tooltip: string;
    tooltipDef: string;
    rozbicie: NieZmierzonoDto[];
  };
  treatyPw: { player: number; partner: number; bilateral: number };
  actions: { id: string; allowed: boolean; allowsMultipleOwn: boolean; lockNote: string | null; statusNote: string | null }[];
  resourceAccessWithdrawn: boolean;
}

export interface DealDisplayDto {
  lines: string[];
}

export interface DiploListDto {
  lines: string[];
}

// ─── §6.7 Heks ───────────────────────────────────────────────────────────────

export interface HexContextDto {
  hex: HexCoord;
  terrain: { base: string; overlay: string | null; river: boolean };
  yieldBase: TileYieldDto;
  yieldFull: TileYieldDto;
  cityYieldRows: NieZmierzonoDto[];
  improvementsActive: { key: string; name: string; bonus: string }[];
  improvementsAvailable: { key: string; name: string; unlockLabels: string[] }[];
  magazynParts: { resource: ResourceKey; amount: number }[];
  deposit: { label: string; hiddenHint: string | null } | null;
  ownerCity: CityRefDto | null;
  worked: boolean;
  units: UnitCardDto[];
}

export interface ImprovementBuildImpactDto {
  lines: string[];
}

// ─── §6.8 Jednostki ──────────────────────────────────────────────────────────

/** = `UnitCardCombatDisplay` (game/unit-card-stats.ts:37-…) — pola NIE_ZMIERZONO. */
export type UnitCardCombatDisplayDto = NieZmierzonoDto;
export type VeteranProgressDto = NieZmierzonoDto;
/** = `UnitSufferingStatusFields` (unitCardStatus.ts:32-55) — pola NIE_ZMIERZONO. */
export type UnitSufferingStatusDto = NieZmierzonoDto;

export interface UnitCardStatusDto {
  parametryPathPp: number | null;
  pancerzPathPp: number | null;
  veteranProgress: VeteranProgressDto | null;
  veteranBadgeLabel: string | null;
  veteranStarsTooltip: string | null;
  veteranExperienceLine: string | null;
  veteranPanelExplanation: string | null;
  inGarnizon: boolean;
  sentry: boolean;
  ufortyfikowanyWPolu: boolean;
  oblegaCityName: string | null;
  suffering: UnitSufferingStatusDto;
}

export interface UnitCardDto {
  unitId: UnitId;
  unitType: UnitTypeKey;
  label: string;
  category: string;
  owner: PlayerId;
  combat: UnitCardCombatDisplayDto;
  power: number;
  status: UnitCardStatusDto;
  badges: { softPath: number; armorPath: number; veteranStars: number };
  vitals: { hp: number; hpMax: number; ruchLeft: number; ruchMax: number; mov: number; rng: number };
  displayName: string | null;
  buildingBonusLabel: string | null;
}

export type UnitPanelActionDto = NieZmierzonoDto;

export interface ArmyStackDto {
  hexLabel: string;
  unitCount: number;
  cards: { id: UnitId; name: string; icon: string; hp: number; hpMax: number; ruchLeft: number; ruchMax: number; active: boolean }[];
  active: UnitCardDto;
  actions: UnitPanelActionDto[];
}

// ─── §6.9 Badania ────────────────────────────────────────────────────────────

export type EraGateInfoDto = NieZmierzonoDto;

export interface ResearchViewDto {
  techs: { id: TechId; baseCost: number; effectiveCost: number; epoka: string; state: string; terrainUnlockLabels: string[] }[];
  queue: TechId[];
  queueMax: number;
  eraGate: EraGateInfoDto | null;
  tempo: string;
  difficulty: string;
}

// ─── §6.10 Nowa gra ──────────────────────────────────────────────────────────

export interface CivMatrixCellDto {
  paramLabel: string;
  formatted: string;
  intensity: number;
  visibleByDefault: boolean;
}

export interface NewGameOptionsDto {
  mapSizes: NieZmierzonoDto[];
  menusByMapLabel: { civTypes: NieZmierzonoDto; miastaPanstwa: NieZmierzonoDto; landFractionOpts: NieZmierzonoDto };
  defaults: NieZmierzonoDto;
  civs: { id: string; availableAtEpoch: number; matrix: CivMatrixCellDto[] }[];
}

export interface StartPreviewDto {
  summaryRows: [string, string][];
}

// ─── §6.11 Karty encji ───────────────────────────────────────────────────────

export type EntityCardDto =
  | { kind: 'building'; id: string; card: NieZmierzonoDto }
  | { kind: 'unit'; id: string; card: NieZmierzonoDto }
  | { kind: 'tech'; id: string; card: NieZmierzonoDto }
  | { kind: 'improvement'; id: string; card: NieZmierzonoDto }
  | { kind: 'wonder'; id: string; card: NieZmierzonoDto };

// ─── §6.12 Oblężenie ─────────────────────────────────────────────────────────

export type MapSiegeContextDto = NieZmierzonoDto;
export type SiegeMachinesStateDto = NieZmierzonoDto;

export interface SiegePanelDto {
  ctx: MapSiegeContextDto;
  city: CityRefDto;
  food: number;
  garnizon: number;
  zuzycie: number;
  atrycjaNext: number;
  milicjaEst: number;
  /** Bramka komendy szturmu/kolejki machin — UI nie decyduje (P5-0 §6.12). */
  playerCanStorm: boolean;
  machines: SiegeMachinesStateDto;
}

// ─── §6.13 Bitwa i koniec gry ────────────────────────────────────────────────

export interface PreBattleDto {
  sides: { nazwa: string; cywilizacja: string; wodz: string; bonusChips: string[] }[];
}

/** = `PostBattleSummaryData` (postBattleSummary.ts:4) — pola NIE_ZMIERZONO. */
export type BattleSummaryDto = NieZmierzonoDto;

export interface VictoryDto {
  result: NieZmierzonoDto;
  progDominacjiPct: number;
}

// ─── §6.14 Minimapa ──────────────────────────────────────────────────────────

export type FogState = 'hidden' | 'explored' | 'visible';

export interface MinimapHexDto {
  q: number;
  r: number;
  teren: string;
  ownerColor: string | null;
  fog: FogState | null;
}

export interface MinimapMarkerDto {
  q: number;
  r: number;
  kind: 'city' | 'outpost' | 'unit';
  color: string;
}

export interface MinimapDto {
  cols: number;
  rows: number;
  hexes: MinimapHexDto[];
  viewport: Rect | null;
  markers: MinimapMarkerDto[];
}

// ─── §6.15 Zapisy ────────────────────────────────────────────────────────────

export type SaveSlotMetaDto = NieZmierzonoDto;

export interface SaveSlotsDto {
  slots: SaveSlotMetaDto[];
  lastPlayed: SlotId | null;
  autosaves: SaveSlotMetaDto[];
  storageAvailable: boolean;
}

// ─── §6.16 Zdarzenia (nie DTO stanu) ─────────────────────────────────────────

export interface MapGenProgressEvent {
  phase: number;
  total: number;
  label: string;
}

export type HoverTarget =
  | { kind: 'hex'; hex: HexCoord }
  | { kind: 'veteranBadge'; unitId: UnitId }
  | { kind: 'statChip'; cityId: CityId }
  | { kind: 'none' };

export interface HoverEvent {
  target: HoverTarget;
}

// ─── §6.17 Diagnostyka (warunkowo, D-UI-7) ───────────────────────────────────

export type PerfReportDto = NieZmierzonoDto;

// ─── Granica mapa ↔ UI (P4-5B §4.1, §4.3, §5.2, §5.3) — tylko typy komunikatów ──

export interface Modifiers {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
}

export interface CityPanelGeometry {
  topBottom: number;
  bottomStack: Rect | null;
  okolicaCenter: Rect | null;
  leftMargin: number;
  leftPanelEnd: number;
  leftRailLeft: number;
  leftRailRight: number;
  railTop: number;
  rightRailLeft: number;
  rightDockEnd: number;
  rightPanelLeft: number;
}

export interface HitRegions {
  seq: number;
  viewport: { w: number; h: number };
  uiZoom: number;
  rects: { id: string; kind: 'hud' | 'cityPanel' | 'modal' | 'tooltip'; x: number; y: number; w: number; h: number; passThrough: boolean }[];
  fullBlock: boolean;
  cityPanel: CityPanelGeometry | null;
}

export interface UiState {
  worldMapUnitMode: boolean;
  cityPanelOpen: boolean;
  cityPanelCityId: CityId | null;
  foundCityMode: boolean;
  buildModeOpen: boolean;
  activeImprovement: string | null;
  activeWonder: string | null;
  preBattleOpen: boolean;
  postBattleOpen: boolean;
  galleryOn: boolean;
}

export type MapHit =
  | { kind: 'unit'; unitId: UnitId; hex: HexCoord }
  | { kind: 'terrain'; hex: HexCoord };

export interface MapClick {
  x: number;
  y: number;
  button: 0 | 1 | 2;
  mods: Modifiers;
  hit: MapHit | null;
  placementClick: boolean;
}

export interface VeteranTip {
  show: boolean;
  x: number;
  y: number;
  text: string;
}

export interface HoverChanged {
  veteranTip: VeteranTip | null;
  statChipHover: CityId | null;
  lastBHex: HexCoord | null;
  hex: HexCoord | null;
}
