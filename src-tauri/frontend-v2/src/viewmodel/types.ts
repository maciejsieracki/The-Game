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
  /** P5.2 (`mapLoadingOverlay.ts`): liczba faz generatora mapy (web: `MAP_GEN_PHASE_TOTAL`, `map/mapGenProgress.ts:6`). */
  mapGenPhaseTotal: number;
  /**
   * P5.2 (`perfReport.ts`): etykiety faz generatora w kolejności faz (web: `MAP_GEN_PHASE_LABELS`,
   * `map/mapGenProgress.ts:16-27`). Kolejność kluczy = kolejność faz (Rust: mapa z zachowaniem kolejności).
   */
  mapGenPhaseLabels: Readonly<Record<string, string>>;
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
  /**
   * P5.2 (`power-labels.ts`): etykieta HUD „Mocy” już rozstrzygnięta przez Rust
   * (web: `loadPowerOpcje().hudEtykietaPl`, `game/power-options.ts:39-48` — odczyt `power-params.json`
   * z wartością domyślną „Moc”). Pusty string = UI używa `MOC_LABEL_PL`.
   */
  powerHudLabelPl: string;
}

// ─── P5.2: wiersze katalogu statycznego czytane przez panele poziomu 0 ───────
// Kształty = podzbiór typów web `data/loader.ts` (`UnitDef` :37-…, `BuildingDef` :84-…, `CivDef` :211-…,
// `CivsData` :246-249) — wyłącznie pola czytane przez porty P5.2; reszta wiersza dociera bez typu.

export interface UnitDefDto {
  Jednostka: string;
  Tech?: string | null;
  'Super-jednostka'?: string | null;
  'Rola (linia)'?: string | null;
  Typ?: string | null;
  /** P5.3 (`unitRecruitCard.ts:70`): epoka jednostki (`data/loader.ts:39`). */
  Epoka?: string | null;
  readonly [field: string]: unknown;
}

export interface BuildingDefDto {
  id: string;
  kategoria?: string;
  readonly [field: string]: unknown;
}

export type LeaderEpochKey = 'kamien' | 'braz' | 'zelazo' | 'antyk';

export interface CivDefDto {
  Cywilizacja?: string;
  ikonaId?: string;
  typCywilizacji?: string;
  'Styl / charakter'?: string | null;
  'Jednostka specjalna'?: string | null;
  wodzowie?: Partial<Record<LeaderEpochKey, string>>;
  wodzowiePula?: readonly string[];
  readonly [field: string]: unknown;
}

export interface CivsCatalogDto {
  cywilizacje: CivDefDto[];
  readonly [field: string]: unknown;
}

/** Zawartość JSON 1:1 (D-UI-4; P5-0 Z2) + stałe + etykiety. */
export interface StaticCatalogDto {
  contentHash: string;
  buildings: unknown;
  units: UnitDefDto[];
  tech: unknown;
  terrainImprovements: unknown;
  wonders: unknown;
  counters: unknown;
  civs: CivsCatalogDto;
  cityNamesPools: unknown;
  powerParams: unknown;
  uiParams: unknown;
  wiki: unknown;
  constants: StaticCatalogConstantsDto;
  labels: StaticCatalogLabelsDto;
  /**
   * Zastępuje `categoryOf` (P5-0 §6.1). Klucz = `UnitDef.Jednostka`; wartość = wynik
   * `categoryOf(Jednostka, 'Rola (linia)', Super-jednostka === 'TAK', Typ)` (`units/setup.ts:239`)
   * policzony w Rust dla każdej jednostki katalogu.
   */
  unitCategory: Readonly<Record<UnitTypeKey, string>>;
  /**
   * P5.2: kategoria liczona przez web BEZ wiersza `UnitDef` — `categoryOf(id, '', false, undefined)`
   * (same słowa kluczowe nazwy), używana gdy panel zna tylko nazwę jednostki (np.
   * `unitIconSvg(undefined, u.Jednostka)` w `techDiscoveryNotice.ts:386`, `technologyAdapter.ts:215`,
   * `cityPanel.ts:6403`). Osobna mapa, by zachować 1:1 zachowanie web (może różnić się od `unitCategory`).
   */
  unitCategoryNameOnly: Readonly<Record<UnitTypeKey, string>>;
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
/** P5.3: = web `SocietyLine` (`game/society-breakdown.ts:23-27`) — wiersz rozpiski Szczęścia/Prawa. */
export interface SocietyLineDto {
  id: string;
  label: string;
  value: number;
}
/** P5.3: = web `CitizenUpkeepCoverage` (`game/citizen-resource-upkeep.ts:166-177`), liczy Rust. */
export interface CitizenUpkeepCoverageDto {
  required: readonly string[];
  available: readonly string[];
  missing: readonly string[];
  happinessDelta: number;
  growthPctDelta: number;
}
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

/** P5.3: typ pozycji koszyka = web `WartoscPozycjaTyp` (`game/diplomacy-value-catalog.ts:18-26`). */
export type BasketItemTyp = 'zloto' | 'praca' | 'zloze' | 'tech' | 'jednostka' | 'surowiec_boolean' | 'surowiec_ilosc' | 'zywnosc';

/** P5.3: = web `BasketItem` (`game/diplomacy-pn-engine.ts:107-112`). */
export interface BasketItemDto {
  typ: BasketItemTyp;
  id: string;
  ilosc?: number;
  hexKey?: string;
}

export interface DiplomacyBasketPreviewRequest {
  partner: PlayerId;
  mode: 'trade' | 'gift' | 'treaty';
  actionId: string;
  give: BasketItemDto[];
  receive: BasketItemDto[];
  turns: number;
  resourceTradeMode: string;
}

/**
 * P5.2 (`diplomacyAcceptanceBalance.ts`): wiersz „Wpływ Relacji na deal”. Wszystkie liczby z Rust
 * (web liczył je w UI: `relationPnModPct(relationSignedFromTotal(total))` `:85,107`,
 * `formatRelationModLabel(total)` `:121`, mnożnik uczciwej wymiany `100 / max(1, total)` `:88`).
 */
export interface RelationDealDto {
  total: number;
  modPct: number;
  modLabel: string;
  /** Mnożnik PW do uczciwej wymiany przy Relacji < 100 (web: `100 / Math.max(1, relTotal)`). */
  tradeFairMult: number;
  /** Parytet 1:1 w handlu (web: `relTotal >= 100`, `diplomacyAcceptanceBalance.ts:87,109,112`). */
  tradeParity: boolean;
}

/** P5.2: = `AcceptanceSideBalance` (`game/diplomacy-acceptance-points.ts:33-60`) 1:1. */
export interface AcceptanceSideBalanceDto {
  offerPn: number;
  demandPn: number;
  fairMinPn: number;
  balancePn: number;
  treatyBasePn: number;
  treatyEffectivePn?: number;
  relationModPct?: number;
  relationModLabel?: string;
  relRequired?: number;
  relCurrent?: number;
  relBalance?: number;
  mode: 'gift' | 'basket' | 'treaty' | 'mixed';
  statusLabel: string;
  accepted: boolean;
}

/**
 * P5.2: = `PnBalancePanelData` (`diplomacyAcceptanceBalance.ts:36-55` na pinie) — wynik
 * `balancePanelDataFromRows` (`:229-431`: wybór wiersza głównego, suma PW pakietu, min `pwBalance`,
 * bramka `canAccept`/`blockReason`, tryb pakietu) liczony w Rust (zapytanie stołu negocjacji —
 * proponowane `diplomacy_table_balance`, NIE_ZMIERZONO w silniku). `relation` = relacja wiersza
 * głównego (web: `their.relCurrent ?? my.relCurrent ?? 100`, `:140,633`).
 * ROZSZERZENIE kontraktu P5-0 §6.6 (ZAŁOŻENIE P5.2-Z10): P5-0 nie przewiduje DTO stołu negocjacji
 * (wiele propozycji na stole), a `DiplomacyBasketPreviewDto` opisuje jeden koszyk przed wysłaniem.
 */
export interface PnBalancePanelDto {
  actionLabel: string;
  negotiationId?: string;
  direction: 'own' | 'incoming';
  myOfferPn: number;
  theirOfferPn: number;
  theirBalance: AcceptanceSideBalanceDto;
  myBalance?: AcceptanceSideBalanceDto;
  /**
   * WYMÓG (jak `DiplomacyBasketPreviewDto.accepted`, P5-0 §6.6): liczy TA SAMA funkcja Rust co bramka
   * komendy przyjęcia propozycji ze stołu — UI nie może pokazać „można przyjąć” dla pakietu, który
   * silnik odrzuci (web: `canAccept` `:379` liczony w UI osobno od bramki).
   */
  canAccept?: boolean;
  extraOnTable?: number;
  awaitingAiResponse?: boolean;
  responderPreview?: { accepted: boolean; reason?: string; pwBalance?: number };
  canCounter?: boolean;
  uiActionId?: string;
  relation: RelationDealDto;
}

/**
 * P5.2 — ROZSZERZENIE kontraktu P5-0 §6.6 (ZAŁOŻENIE P5.2-Z9, `P5-2-PORT-LEVEL0.md` §8): blok
 * `DiplomacyBasketPreviewDto.treatyGate`, wypełniany przez Rust tylko dla zapytania
 * `diplomacy_preview_basket { mode: 'treaty' }` (dla `trade`/`gift` = `null`). Pola, których P5-0 §6.6
 * nie przewiduje, a które web liczył w UI (`renderPnBalancePanelForTreaty`, pin
 * `diplomacyAcceptanceBalance.ts:753-871`). PW gracza/partnera/bazy NIE są tu powielane — są w
 * `DiplomacyBasketPreviewDto.treatyPw.{my,their,base}` (P5-0 §6.6); koszyk w `givePn`/`receivePn`.
 */
export interface DiplomacyTreatyGateDto {
  /** Web: `max(0, basketGivePn − basketReceivePn)`. */
  basketNet: number;
  /** Web: `playerPw + basketGivePn`. */
  myDisplayPw: number;
  /** Web: `partnerPw + basketReceivePn`. */
  theirDisplayPw: number;
  relRequired: number | null;
  /** Web: `relRequired == null || relTotal >= relRequired`. */
  relOk: boolean;
  /** Web: `basketReceivePn <= 0 || pnDealAcceptedByAi(...)` — ta sama funkcja Rust co bramka przyjęcia. */
  basketFair: boolean;
}

export interface DiplomacyBasketPreviewDto {
  givePn: number | null;
  receivePn: number | null;
  fairMinPn: number;
  balancePn: number;
  /** Liczone TĄ SAMĄ funkcją Rust co bramka przyjęcia (P5-0 §6.6 wymóg). */
  accepted: boolean;
  /** P5.2: rozszerzone o pola `RelationDealDto` (wiersz „Wpływ Relacji na deal”). */
  relation: RelationDealDto & { signed: number };
  treatyPw: { my: number; their: number; bilateral: number; base: number };
  trust: { surplusPn: number; delta: number; deltaRaw: number; cap: number; gained: number };
  dobraWola: { perTurn: number; turns: number } | null;
  giftTrust: number | null;
  validation: { valid: boolean; reason: string | null };
  currencyForbiddenWar: boolean;
  turnsMultiplier: number;
  brief: { give: string; receive: string };
  /** P5.2 — rozszerzenie P5-0 §6.6 (ZAŁOŻENIE P5.2-Z9): tylko `mode = 'treaty'`, inaczej `null`. */
  treatyGate: DiplomacyTreatyGateDto | null;
}

/**
 * P5.2: wejście renderera koszyka traktatu (`renderPnBalancePanelForTreaty`/`ForPeace`) = wynik
 * `diplomacy_preview_basket { mode: 'treaty' }` (P5-0 §6.6) z niepustym `treatyGate`. Jeden typ
 * wyniku dla handlu i traktatu — bez osobnego DTO podglądu traktatu.
 */
export type DiplomacyTreatyBasketPreviewDto =
  Pick<DiplomacyBasketPreviewDto, 'givePn' | 'receivePn' | 'balancePn' | 'accepted' | 'relation' | 'treatyPw'>
  & { treatyGate: DiplomacyTreatyGateDto };

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
  /** P5.3 (ROZSZ. Z3-1): strony stołu jako pozycje (ikony surowców) — `NegotiationDealSidesDto`. */
  sides?: NegotiationDealSidesDto | null;
}

/**
 * P5.3 (`diplomacyDealDisplay.ts`, ROZSZ. Z3-1): pozycja koszyka do wyświetlenia — `BasketItemDto`
 * + `label` = nazwa wyświetlana surowca (web `resourceDisplayLabel(id)`, `game/diplomacy-display.ts:434-437`).
 */
export interface DealBasketItemViewDto extends BasketItemDto {
  label: string;
}

/**
 * P5.3 (ROZSZ. Z3-1): podział propozycji na strony z perspektywy gracza — wynik web
 * `splitNegotiationDealPlayerSides(payload, incoming)` (`game/diplomacy-display.ts:562-592`, w tym
 * fallback starego `goldOnce` i tekst `schedule`) + kontekst formatowania z payloadu
 * (`perTurn = resourceTradeMode === 'per_turn'`, `turns`). `null` = web `split === null` (pusta oferta).
 */
export interface NegotiationDealSidesDto {
  weOffer: DealBasketItemViewDto[];
  theyOffer: DealBasketItemViewDto[];
  schedule: string | null;
  perTurn: boolean;
  turns: number | null;
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
  /** P5.2: nazwa wyświetlana nowego ulepszenia (web: `improvementDisplayName(newKey)`, `game/terrain-improvements.ts:385`). */
  newLabel: string;
  /**
   * Nazwy tego, co zniknie z heksa, w kolejności web (`formatImprovementBuildImpactList`,
   * `map/improvement-build.ts:662-671`: zdjęte ulepszenia, potem „Las”). Pusta = nic nie znika.
   */
  lines: string[];
}

// ─── §6.8 Jednostki ──────────────────────────────────────────────────────────

/** P5.3: = `UnitCardCombatDisplay` (`game/unit-card-stats.ts:37-62`) — wartości bazowe i efektywne liczy Rust. */
export interface UnitCardCombatDisplayDto {
  atakBase: number;
  atakEffective: number;
  obronaBase: number;
  obronaEffective: number;
  hpMaxBase: number;
  hpMaxEffective: number;
  pancerzBase: number;
  pancerzEffective: number;
  weaponDamageBase: number;
  weaponDamageEffective: number;
  piercingBase: number;
  piercingEffective: number;
  chargeBonusBase: number;
  chargeBonusEffective: number;
  missileAttackBase: number;
  missileAttackEffective: number;
}
/** P5.3: = web `VeteranProgress` (`game/veteran.ts:90-92`). */
export interface VeteranProgressDto {
  battlesSurvived?: number;
}
/** P5.3: poziom odznaki ścieżki 0–3 = web `PathBadgeLevel` (`game/unit-building-bonuses.ts:292,454`). */
export type PathBadgeLevelDto = 0 | 1 | 2 | 3;
/**
 * P5.3: = `UnitCardDto.badges` (P5-0 §6.8) — liczy Rust: `softPath` = `softPathBadgeLevel`,
 * `armorPath` = `armorPathBadgeLevel` (`game/unit-building-bonuses.ts:312-336`, tercje 0/15/30 i 0/16/33 pp),
 * `veteranStars` = `veteranStarCount` (`game/veteran.ts:118-120`).
 */
export interface UnitCardBadgesDto {
  softPath: PathBadgeLevelDto;
  armorPath: PathBadgeLevelDto;
  veteranStars: number;
}
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
  badges: UnitCardBadgesDto;
  vitals: { hp: number; hpMax: number; ruchLeft: number; ruchMax: number; mov: number; rng: number };
  displayName: string | null;
  buildingBonusLabel: string | null;
}

export type UnitPanelActionDto = NieZmierzonoDto;

/**
 * P5.3 (`armyListHud.ts`, ROZSZ. Z3-5 — P5-1/`PORTING-QUEUE.md`: proponowane `ArmyStackDto.cards[].status`):
 * jeden stan rozkazu reprezentanta stosu, wybrany przez Rust z flag jednostki (web `armyStatusBadge`,
 * `sideListHud.css.ts:115-126`: garnizon > fortyfikacja w polu > czuwanie > auto-eksploracja). `null` = brak.
 */
export type ArmyUnitStatusDto = 'garrison' | 'fieldFortified' | 'sentry' | 'autoExplore';

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

/** P5.3: = web `SiegeMachineKind` (`game/siegeMachines.ts:6`). */
export type SiegeMachineKindDto = 'taran' | 'wieza';

/** P5.3: = web `SiegeMachinesState` (`game/siegeMachines.ts:8-13`). */
export interface SiegeMachinesStateDto {
  queue: SiegeMachineKindDto[];
  ready: SiegeMachineKindDto[];
  buildProgress: number;
}

/**
 * P5.3 (ROZSZ. Z3-4): pola `City` czytane przez `cityAttackChoice.ts`/`siegeMapPanel.ts`
 * (`game/cities.ts`: `id`, `name`, `ownerId`, `population`, `maMur` :860, `garnizon` :896,
 * `siegeCapitulationPending` :900, `siegeMachines` :902). Id miasta = string jak w webie (akcje panelu).
 */
export interface SiegeCityDto {
  id: string;
  name: string;
  ownerId: PlayerId;
  population: number;
  maMur?: boolean;
  garnizon?: number;
  siegeCapitulationPending?: boolean;
  siegeMachines?: SiegeMachinesStateDto;
}

/** P5.3 (ROZSZ. Z3-4): pola `RuntimeUnit` czytane przez panele oblężenia (`typeId`, `ownerId`). */
export interface SiegeUnitRefDto {
  id: string;
  typeId: string;
  ownerId: PlayerId;
}

/** P5.3: = web `MapSiegeContext` (`game/mapSiegeDetect.ts:10-19`) — klasyfikację starcia robi Rust. */
export interface MapSiegeContextDto {
  tryb: 'oblezenie' | 'zdobycie_z_marszu' | 'bitwa_polowa';
  city: SiegeCityDto;
  atakujacy: SiegeUnitRefDto;
  garnizonUnit: SiegeUnitRefDto | null;
  oblegajacyOwnerId: PlayerId;
}

/**
 * P5.3: panel oblężenia czyta dane miasta z `ctx.city` (jak web `siegeMapPanel.ts:216`); `city: CityRefDto`
 * (P5-0 §6.12) zostaje w kontrakcie, panel go nie czyta (ZAŁOŻENIE P5.3-Z4).
 */
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

/** P5.3: = web `BattleSummaryUnitCard` (`game/battle-summary.ts:16-27`); procenty i `dead` liczy Rust. */
export interface BattleSummaryUnitCardDto {
  typeId: string;
  kategoria: string;
  hpBefore: number;
  hpAfter: number;
  maxHp: number;
  hpBeforePct: number;
  hpAfterPct: number;
  lossPct: number;
  dead: boolean;
}

/** P5.3: = web `BattleSummarySide` (`game/battle-summary.ts:29-42`). */
export interface BattleSummarySideDto {
  label: string;
  civLabel?: string;
  civIconId?: string;
  isCityState?: boolean;
  isBarbarian?: boolean;
  era?: number;
  units: BattleSummaryUnitCardDto[];
  totalBefore: number;
  totalAfter: number;
  totalDead: number;
}

/**
 * P5.3: = web `PostBattleSummaryData` (`game/battle-summary.ts:44-57`) — wynik `buildPostBattleSummary`
 * (`game/battle-summary.ts:82-…`) liczony w Rust (P5-0 §6.13).
 */
export interface BattleSummaryDto {
  title: string;
  subtitle?: string;
  teren?: string;
  winner: 'atakujacy' | 'obronca' | 'remis';
  winnerLabel: string;
  mode: 'auto' | 'manual' | 'szturm';
  atakujacy: BattleSummarySideDto;
  obronca: BattleSummarySideDto;
  playerSide?: 'atk' | 'def';
  lootNote?: string;
}

/** = `VictoryResult` (`game/victory.ts:95-98`). */
export interface VictoryResultDto {
  winner: PlayerId;
  rodzaj: 'dominacja' | 'nauka' | 'przegrana';
}

export interface VictoryDto {
  result: VictoryResultDto;
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

/**
 * P5.2: = `SaveSlotMeta` (`game/save.ts:214-227`) + `slotId`. Rust zwraca metadane także dla starych
 * zapisów bez osobnego klucza meta (web: fallback pełnego `loadFromLocal` + `extractSaveContextFields`,
 * `saveLoadDialog.ts:206-219`, `game/save.ts:230-…`).
 */
export interface SaveSlotMetaDto {
  slotId: SlotId;
  label: string;
  tura: number;
  savedAt: string;
  mapSize: string;
  /** Surowy klucz typu świata (np. 'kontynenty'); etykieta PL w UI. */
  worldType: string;
  civId: string;
  unitsCount: number;
  citiesCount: number;
  seed: number;
  /** 'playtest' albo ''. */
  saveOrigin: string;
}

export interface SaveSlotsDto {
  slots: SaveSlotMetaDto[];
  lastPlayed: SlotId | null;
  /** Zapisy z dysku (web: rotacja FSA, `game/fsa-autosave.ts`); `slotId` z prefiksem `diskSlotPrefix`. */
  autosaves: SaveSlotMetaDto[];
  /** Web: `isIdbAvailable()` (`game/save.ts`) — false = baner ostrzegawczy. */
  storageAvailable: boolean;
  /** Web: `FSA_SLOT_PREFIX = 'fsa:'` (`game/save.ts:163`). */
  diskSlotPrefix: string;
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

/** P5.2 (`perfReport.ts`) = `MapGenPhaseTimings` (`map/mapGenProgress.ts:53-…`), ms. */
export interface MapGenPhaseTimingsDto {
  prep: number;
  terrain: number;
  landSea: number;
  relief: number;
  coast: number;
  riversMain: number;
  riversFill: number;
  forest: number;
  deposits: number;
  starts: number;
  total: number;
}

/** P5.2 (`perfReport.ts`) = `SceneBuildTimings` (`render/scene.ts`), ms — kształt struktury, bez sond WebGL (D-UI-7). */
export interface SceneBuildTimingsDto {
  hexes: number;
  coast: number;
  overlays: number;
  rivers: number;
  tail: number;
  total: number;
  hexCount: number;
  overlayTotal: number;
  riverStage: number;
  detail?: {
    heksy: {
      alokacja: number;
      pryzmy: number;
      instancjeReliefu: number;
      styledWPetli: number;
      brzegWPetli: number;
      pustynia: number;
      finalizacja: number;
    };
    nakladki: {
      scalMerge: number;
      instancjePlazaWydmy: number;
      scalMergeCollapsed?: number;
      scalMergeSkippedMerged?: number;
      scalMergeSkippedLight?: number;
    };
  };
}

/**
 * P5.2 (`perfReport.ts`): stan diagnostyczny dostarczany przez powłokę/Rust zamiast importów
 * `buildInfo.ts` (`CIV_BUILD_STAMP`) i `map/riverGenSwitch.ts` (`getRiverGenEnabled`/`getRiverGenPhase`).
 */
export interface PerfDiagnosticsDto {
  buildStamp: string;
  riverGenEnabled: boolean;
  /** Web: `RiverGenPhase = 'main' | 'main+medium' | 'all'` (`map/riverGenSwitch.ts:12`). */
  riverGenPhase: 'main' | 'main+medium' | 'all';
}

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
