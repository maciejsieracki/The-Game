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
  /**
   * P5.5 (`techTreeView.ts:699`, karta węzła „tempo … ×N”): mnożnik kosztu badań per tempo gry
   * = web `TEMPO_GRY` (`game/tech-tempo.ts:23-27`; P5-0 §6.1 `tempo_gry`). Klucz = `ResearchViewDto.tempo`.
   */
  tempoGry: Readonly<Record<string, number>>;
  /**
   * P5.6 (`diplomacyTradeBasket.ts:1583`, podpowiedź „1 PW = N” przy żywności): web `diplomacyZywnoscNaPn()`
   * (`game/diplomacy-value-catalog.ts:123-125`, `pn_zywnosc.jednostki_na_pn`).
   */
  zywnoscNaPn: number;
  /**
   * P5.6 (`diplomacyTradeBasket.ts:2138,2720`): próg Relacji daru, gdy kontekst modala go nie podaje — web
   * `diplomacyProgDarRelacja()` (`game/diplomacy-value-catalog.ts:715-721`, poziom `normal`, jak pin bez argumentów).
   */
  progDarRelacja: number;
  /** P5.6 (`diplomacyTradeBasket.ts:1962`): web `diplomacyHandelZaufaniePerTura()` (`:728-731`, `handel_zaufanie_perTura`). */
  handelZaufaniePerTura: number;
  /**
   * P5.6 (`diplomacyTradeBasket.ts:465-472`, lista zastępcza surowców ilościowych): klucze cennika handlu surowcami
   * w kolejności web `Object.keys(diplomacyHandelSurowceCatalog())` (`:424-431`).
   */
  handelSurowceKeys: string[];
  /**
   * P5.6 (`diplomacyAudience.ts:492,1777`): id akcji UI dopuszczających wiele własnych wpisów tego samego typu na stole
   * negocjacji — web `uiActionAllowsMultipleOwnOnTable` (`game/diplomacy-audience-actions.ts:132-134`: dziś `['14']`).
   */
  audienceMultiOwnActionIds: string[];
  /**
   * P5.7 r2 (`newGameFlow.ts`; P5-0 §6.10 `defaults: {player_civ, start_epoch, render_quality}`): domyślna cywilizacja
   * gracza, epoka startowa i jakość mapy kreatora — web `DEFAULT_PLAYER_CIV_ID`, `DEFAULT_START_EPOCH_ID`,
   * `DEFAULT_RENDER_QUALITY` (`map/newGameMapDefaults.ts:131,134,141`, Panel-E).
   */
  newGameDefaultPlayerCivId: string;
  newGameDefaultStartEpochId: string;
  newGameDefaultRenderQuality: QualityTierDto;
  /** P5.7 r2: web `MAX_TYPY_CYWILIZACJI_MENU` (`map/newGameMapDefaults.ts:540`). */
  maxTypyCywilizacjiMenu: number;
  /** P5.7 r2 (§6.10 `menus_by_map_label.land_fraction_opts`): web `LAND_FRACTION_PERCENT_OPTS` (`:460`), kolejność 1:1. */
  landFractionPercentOpts: readonly number[];
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
  /**
   * P5.6 (`diplomacyTradeBasket.ts:95,1557`): nazwy wyświetlane surowców po kluczu (małe litery) = web `RESOURCE_KEY_LABEL`
   * (`game/diplomacy-display.ts:416-432`); formatowanie zapasowe (wielka litera) zostaje w UI jak w `resourceDisplayLabel`.
   */
  resourceKeyLabels: Readonly<Record<string, string>>;
  /**
   * P5.7 (`empireDetailPanel.ts`): nazwy surowców magazynu państwa po kluczu = web `STOCK_RESOURCE_LABEL`
   * (`game/building-stock-cost.ts:143-159`); brak klucza = sam klucz (jak `stockResourceLabel`, `:170-172`).
   */
  stockResourceLabels: Readonly<Record<string, string>>;
  /** P5.7 (`empireDetailPanel.ts:3729,3732`): dopełniacz etykiety daniny = web `daninaLabelGenitive()` (`game/danina-nazwa.ts:17-19`). */
  daninaGenitive: string;
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
  /**
   * P5.4 (`sciencePicker.ts:130-135,182`): nazwy ulepszeń terenu odblokowywanych przez technologię
   * (klucz = nazwa technologii z `tech.json`) = web `terrainUnlockLabelsForTech(name)`
   * (`game/improvement-tech.ts:129-138`, bramka tech ulepszeń) policzone w Rust dla każdej technologii
   * katalogu. Brak klucza = pusta lista (web: fallback na pole `tech.json`). ROZSZ. Z4-4.
   */
  techTerrainUnlockLabels: Readonly<Record<string, readonly string[]>>;
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
/** P5.6 (`hexContextTooltip.ts`): = web `TileYield` (`game/economy.ts:256-268`) — plon heksa liczy Rust. */
export interface TileYieldDto {
  zywnosc: number;
  praca: number;
  handel: number;
  drewno: number;
  kamien: number;
  glina: number;
  ruda: number;
  ruda_zelaza: number;
}
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
  /** K03 (P5-8, runda 3, ZALOZENIE K03-Z10): wejscia kart panelu miasta liczone przez silnik; UI ich nie wylicza. */
  panelInputs?: CityPanelInputsDto;
}

/** K03-Z10: wejscia kart szczegolow (pin `cityPanel.ts`) — wartosci z silnika/Rust, nie z lokalnego przeliczenia. */
export interface CityPanelInputsDto {
  zdrowie: { posSum: number; negSum: number };
  surowce: { potential: string[]; active: string[]; legacy: boolean };
  /** K04-Z1 (P5-8-K04): pula magazynu PAŃSTWA po kluczu surowca (civ-wide, pin `ownerResourceStockAll`); brak = pusta. */
  stockPool?: Readonly<Record<string, number>>;
  /** K04-Z3 (P5-8-K04 batch 2): poziom budynku w mieście po id definicji (silnik: buildingLevelForEpoch); brak = 1. */
  ownedLevels?: Readonly<Record<string, number>>;
  /** K04-Z3 (P5-8-K04 batch 2): utrzymanie budynku na poziomie właściciela po id definicji (silnik: buildingUpkeep). */
  upkeepById?: Readonly<Record<string, number>>;
  /** K04B-Z1 (P5-8-K04B batch 3): podział Pracy miasta policzony przez silnik dla bieżącego suwaka (pin `splitPraca`). */
  podzialPracaSplit?: { total: number; doBudynkow: number; doPuli: number };
  /** K04B-Z2 (P5-8-K04B batch 3): koszt surowcowy utrzymania jednostki po id definicji (pin `unitResourceUpkeep`); brak = {}. */
  unitResourceUpkeepById?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  /** Bezposrednie wymagania technologii (nazwa -> lista poprzednikow) — zamiast `getTechDef`/`parsePrerequisites` pina. */
  techPrereqs: Record<string, string[]>;
  growthTooltip: { osobNaObywatela: number; gainSlots: number };
  happinessBuildingsSum: number;
  ownerHasMennica: boolean;
  territoryNodes?: readonly unknown[];
  mennica: { budynek: boolean; dostepZlota: boolean; walutaOdkryta: boolean; aktywna: boolean; spiZBrakuZlota: boolean; mnoznikTxt: string };
  handel: {
    maTargowisko: boolean;
    maBiblioteka: boolean;
    korupcja: { wspolczynnikDystansu: number; wspolczynnikMiast: number; cap: number } | null;
    aktywneTrasy: number;
    premiaTrasHandlowych: number;
  };
  wealth: { atCap: boolean; epoch: number; szBonus: number; pula: number; etaW: number | null; zamIn: number };
  recruitPool: {
    manpowerBiezacy: number; manpowerMax: number; regenPerTurn: number; kosztJednostki: number;
    werbMaxPrzyPelnejPuli: number; ludnoscAbsolutna: number; ludki: number; epoka: number;
  };
  /** K04C (P5-8-K04C, batch 4a): wejscia kart Porzadek / Kultura i Religia / Zamoznosc / Wyzywienie. Dopisek, brak = karta w trybie „brak danych”. */
  k04c?: CityPanelK04CDto;
  /** K04D (P5-8-K04D, batch TopBar): wejscia kart paska gornego (Zywnosc, Ludnosc, Praca, Zloto, Nauka, Kultura, Religia). Dopisek, brak = karta bez danych silnika. */
  k04d?: CityPanelK04DDto;
}

// ─── K04C (P5-8-K04C, R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1, runda 1): wejscia kart szczegolow batch 4a ──────────
// ZALOZENIA K04C-Z1..Z6 (pelny opis w dyspozycje/rust-port/p5/P5-8-K04C.md): kazda wartosc reguly gry
// (pasmo porzadku, skala religii, parametry zamoznosci i wyzywienia, stan magazynu) przychodzi z silnika.

/** K04C-Z1: pasmo porzadku z silnika (pin `porPctBand(por)`, `society-breakdown.ts`). */
export type OrderBandKeyDto = 'lad' | 'spokoj' | 'napiecie' | 'niepokoj' | 'bunt' | 'bunt_skrajny';

/** K04C-Z1 — karta Porzadek (pin `buildPorzadekDetailCard`, cityPanel.ts:3427). Pola spoza `order` (SzPct, PrawPct, maksima). */
export interface PorzadekDetailDto {
  bandKey: OrderBandKeyDto;
  szPct: number;
  prawPct: number;
  /** Maksimum punktow Szczescia tej epoki; `null` = brak (pin: `state.szMax != null`). */
  szMax: number | null;
  prawMax: number | null;
  /** Legacy pole pinu `state.porzadek` = netto punkty Prawa (orderPanel.ts:18). */
  prawPkt: number;
  prawLines: SocietyLineDto[];
}

/** K04C-Z2 — dane kultury miasta (pin `CultureState`, `cfg.getCultureState`). */
export interface CultureDetailDto {
  ownerCultureLabel?: string;
  kulturaMix?: { label: string; pct: number; isOwner: boolean }[];
  cultureConverting?: boolean;
  ownCultureSharePct?: number | null;
  kulturaSuma: number;
  przyrost: number;
  borderRadius: number;
  thresholds: number[];
  zrodla?: { nazwa: string; wartosc: number }[];
}

/** K04C-Z3 — dane religii miasta (pin `ReligionState`, `cfg.getReligionState`); `wplywSzczescieSzPkt` = surowe punkty silnika (przed `szPktDisplay`). */
export interface ReligionDetailDto {
  stateReligion?: string | null;
  sklad?: { name: string; pct: number }[];
  dominujaca: string;
  udzialPct: number;
  wplywSzczescieSzPkt: number;
  przyrostWiernych?: number;
  zrodla?: { nazwa: string; wartosc: number }[];
}

/** K04C-Z3 — parametry religii (pin `loadReligionParams` / `FALLBACK_RELIGION_PARAMS`, z silnika). */
export interface ReligionParamsDto {
  progDominacjiPct: number;
  szybkoscSzerzeniaBazowa: number;
  swiatyniaBonusSzerzenia: number;
  szerzenieMaxDystans: number;
  konwersjaBazaPct: number;
  konwersjaSwiatyniaPct: number;
}

/** K04C-Z4 — parametry zamoznosci (pin `WealthParams`, `loadWealthParams`). */
export interface WealthParamsDto {
  zachowaniePoAwansie: number;
  mnoznikNaPoziom: number;
  progNaPoziom: number;
  utrzymanieBaza: number;
  utrzymaniePrzyCap: number;
  karaZero: number;
  zadowolenieMax: number;
}

/** K04C-Z5 — magazyn centralny z ostatniej tury (pin `EmpireFoodTick`, pola czytane przez kartę Wyzywienia). */
export interface EmpireFoodTickDetailDto {
  uprawaHodowla: number;
  wyzwienieLudnosci: number;
  pomocMiastom: number;
  wojsko: number;
  maxCap: number;
  zapasyPo: number;
}

/** K04C — wejscia kart szczegolow batch 4a (pola pinu `buildKulturaDetailCard`, `buildWealthDetailCard`, `buildRacjeWzrostDetailCard`). */
export interface CityPanelK04CDto {
  porzadek: PorzadekDetailDto;
  kultura: {
    /** Pin `kultReligScaleForEra(epoka, loadSocietyScaleParams(...))` — skala Szczescia tej epoki (K04C-Z3). */
    skalaSzEpoki: number;
    relParams: ReligionParamsDto;
    culture: CultureDetailDto | null;
    religion: ReligionDetailDto | null;
    /** Pin `view.kultura` (estymata „Przyrost z plonów” gdy brak stanu kultury); `null` = brak widoku miasta. */
    kulturaZPlonow: number | null;
  };
  zamoznosc: {
    params: WealthParamsDto;
    /** Pin `view.pieniadz` (`null` = brak podgladu tury). */
    pieniadzMiasta: number | null;
  };
  wyzywienie: {
    /** Ludnosc absolutna miasta i jednego obywatela (pin `cityLudnoscAbsolutna(pop, epoka)` i `(1, epoka)`). */
    ludnoscAbsolutna: number;
    ludnoscNaObywatela: number;
    /** Pin `wyzwienieSummaryLabel(poziomRacji, rationParams)`; `null` = brak parametrow racji. */
    wyzwienieSummary: string | null;
    /** Pin `tick` (magazyn centralny ostatniej tury); `null` = brak sekcji „Magazyn”. */
    tick: EmpireFoodTickDetailDto | null;
    /** Pin `st?.zapasyPanstwa` (aktualny zapas magazynu panstwa); `null` = brak. */
    zapasyPanstwa: number | null;
  };
}

// ─── K04D (P5-8-K04D, R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1, runda 1): karty paska gornego (TopBar) ──────────
// ZALOZENIA K04D-Z1..Z5 (pelny opis w dyspozycje/rust-port/p5/P5-8-K04D.md): podzial pracy i handlu, snapshot
// pieniadza miasta, parametry zamoznosci i sumy miast liczy silnik; UI tylko prezentuje.

/** K04D-Z1: podzial handlu miasta (pin `readPodzialHandlu(city, data)`, ustawienia suwakow). */
export interface PodzialHandluDto {
  procentPieniadz: number;
  procentNauka: number;
  procentLuksus: number;
}

/** K04D-Z2: podzial pracy miasta (pin `cityPracaSplit(city, view, data)`); K04B nie jest jeszcze zintegrowany — pola z silnika. */
export interface PracaSplitDto {
  total: number;
  doBudynkow: number;
  doPuli: number;
  pctBudynki: number;
  pctPuli: number;
  /** Pin `Σ computeView(c).praca` po miastach właściciela; `null` = brak danych (pin: brak mapy/data). */
  sumaMiast: number | null;
}

/** K04D-Z3: snapshot pieniądza miasta (pin `CityMoneySnap`, `cfg.getCityMoneySnap`); `null` = brak snapshotu. Nazwa różna od placeholdera `CityMoneySnapDto` (NieZmierzonoDto). */
export interface CityMoneySnapK04D {
  doSkarbca: number;
  pieniadzBrutto: number;
  wealthMnoznik: number;
  handelZeSzlakow: number;
  utrzymanieBudynkow: number;
  utrzymanieSurowcowBudynkow?: Readonly<Record<string, number>>;
  utrzymanieGarnizonu: number;
  nauka: number;
}

/** K04D — wejscia kart paska gornego (pola pinu `buildTopBar*DetailCard`, bez Rekruci — ta karta jest w K03). */
export interface CityPanelK04DDto {
  /** Pin `cfg.getEpoch?.(ownerId) ?? 1` (K04D-Z4). */
  epoka: number;
  praca: PracaSplitDto;
  podzialHandlu: PodzialHandluDto;
  /** Pin `cfg.getCityMoneySnap?.(city.id)`. */
  moneySnap: CityMoneySnapK04D | null;
  /** Pin `city.wealthState.poziom` (fallback: `freshWealthState()` = W0) z silnika. */
  wealthPoziom: number;
  /** Pin `daninaLabelForCity(city)` i `daninaLabelGenitive(...)` (stała „Podatek” / forma dopełniacza z katalogu). */
  daninaLbl: string;
  daninaLblGen: string;
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
  /** P5.5: = web `UlepszeniaEmpirePolicy` (`game/cities.ts:303-310`) — konsument `buildModeHud.ts`. */
  improvementPolicy: UlepszeniaEmpirePolicyDto;
}

/** P5.5: = web `UlepszeniaFocus` (`game/cities.ts:181`). */
export type UlepszeniaFocusDto = 'zywnosc' | 'surowce' | 'infrastruktura' | 'zrownowazone';
/** P5.5: = web `UlepszeniaTryb` (`game/cities.ts:184`). */
export type UlepszeniaTrybDto = 'auto' | 'reczny';
/** P5.5: = web `UlepszeniaPracaPercent` (`game/cities.ts:200`), % 0–`constants.maxUlepszeniaPracaAutoPercent`. */
export type UlepszeniaPracaPercentDto = number;
/** P5.5: = web `UlepszeniaEmpirePolicy` (`game/cities.ts:303-310`; P5-0 §6.5 `improvement_policy`). */
export interface UlepszeniaEmpirePolicyDto {
  focus: UlepszeniaFocusDto;
  tryb: UlepszeniaTrybDto;
  onlyWorked: boolean;
  pracaAutoPercent: UlepszeniaPracaPercentDto;
  wolnoWycinacLas: boolean;
}

// ─── P5.7: panel imperium (`empireDetailPanel.ts`, `empireDetailTypes.ts`; P5-0 §6.5) ─────────────

/** P5.7: = web `CityPodzialHandlu` (`game/cities.ts:21-25`) — podział handlu w %, kroki `constants.handelPctStep`. */
export interface CityPodzialHandluDto {
  procentNauka: number;
  procentPieniadz: number;
  procentLuksus: number;
}

/** P5.7: = web `CityPodzialPracy` (`game/cities.ts:40-42`) — jedyny podział Pracy (udział budynków). */
export interface CityPodzialPracyDto {
  procentBudynki: number;
}

/**
 * P5.7: = web `ResourceUsageBreakdown` (`game/resource-usage-breakdown.ts:66-88`) + `total`
 * (= web `resourceUsageTotal(b)`, `:102-104` — liczy silnik; P5-0 §6.5 `resource_usage + total`).
 */
export interface ResourceUsageBreakdownDto {
  buildings: number;
  citizens: number;
  units: number;
  total: number;
}

/**
 * P5.7: = web `MiastaSummaryRow` (`ui/empireMiastaTable.ts:109-121`) — wiersz SUMA/ŚREDNIA tabeli Miasta liczony
 * przez silnik (proponowane w P5.1 `EmpireDetailDto.citiesSummary`; wejście WZROST = efektywny, ECHO B).
 */
export interface EmpireMiastaSummaryDto {
  obywTotal: number;
  ludnoscAbsolutnaTotal: number;
  wzrostProcentAvg: number | null;
  pracaTotal: number;
  pieniadzTotal: number;
  zywnoscTotal: number;
  surowceTotal: Record<string, number>;
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
  /**
   * P5.6 (`diplomacyTradeBasket.ts` `summaryHtml`, dar): dookreślenie P5-0 §6.6 `gift_trust: Option<u32>` do pary
   * `{ delta, deltaRaw }` = web `diplomacyGiftTrustFromPn(givePn, trustGained)` (`deltaZaufanie`, `deltaZaufanieRaw`;
   * pin `:1988-1992` pokazuje dopisek limitu, gdy `deltaRaw > delta`). `null` = brak wyceny / nie dar. ROZSZ. Z6-2.
   */
  giftTrust: { delta: number; deltaRaw: number } | null;
  validation: { valid: boolean; reason: string | null };
  currencyForbiddenWar: boolean;
  turnsMultiplier: number;
  brief: { give: string; receive: string };
  /** P5.2 — rozszerzenie P5-0 §6.6 (ZAŁOŻENIE P5.2-Z9): tylko `mode = 'treaty'`, inaczej `null`. */
  treatyGate: DiplomacyTreatyGateDto | null;
  /**
   * P5.6 (`summaryHtml`, wiersz „Fair min (Rel N)”, ostrzeżenie i werdykt; pin `:1923-1980`): web
   * `diplomacyFairGivePn(receivePn, rel)` z Relacją BEZ limitu 100 — inna liczba niż `fairMinPn` panelu PW
   * (P5.2: `min(100, rel)`), gdy Relacja > 100. ROZSZ. Z6-2.
   */
  summaryFairMinPn: number;
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

// ─── P5.6: cykl C2 (audiencja, modal negocjacji, koszyk PW) ──────────────────

/** P5.6: = web `CivBonusLite` (`game/production.ts:553-562`) — wiersz `bonusy[]` z `civs.json` (dane, nie reguła). */
export interface CivBonusLiteDto {
  typ: string;
  cel: string;
  wartosc: number | string | string[];
  opis?: string;
  realizuje?: string;
  matrixParamId?: string;
}

/** P5.6: = web `FormalDiplomaticKind` (`game/diplomacy-display.ts:260`). */
export type FormalDiplomaticKindDto = 'wojna' | 'sojusz' | 'pakt' | 'handel' | 'pokoj' | 'brak';

/** P5.6: = web `TradeGoodsCategories` (`game/diplomacy-goods.ts:30-35`) — gotowe etykiety dóbr z Rust. */
export interface TradeGoodsCategoriesDto {
  surowce: string[];
  technologie: string[];
  inne: string[];
}

/** P5.6: = web `WiarygodnoscRozbicie` (`game/diplomacy-credibility.ts:407-418`). */
export interface WiarygodnoscRozbicieDto {
  startowa: number;
  trwalyZyciorys: number;
  biezaceUczynki: number;
  strumien: number;
  razem: number;
}

/** P5.6: = web `WiarygodnoscFactorRow` (`game/diplomacy-credibility.ts:517-522`). */
export interface WiarygodnoscFactorRowDto {
  label: string;
  value: number;
  perTurn?: boolean;
}

/** P5.6: = web `WiarygodnoscBreakdown` (`game/diplomacy-credibility.ts:525-528`). */
export interface WiarygodnoscBreakdownDto {
  pozytywne: WiarygodnoscFactorRowDto[];
  negatywne: WiarygodnoscFactorRowDto[];
}

/**
 * P5.6 (P5-0 §6.6 `DiplomacyAudienceDto.wiarygodnosc {label, tooltip, tooltip_def, rozbicie}`): teksty Wiarygodności
 * jednej strony liczone w Rust dla wartości `round(clamp(W, −100, 100))` — `band` = web `wiarygodnoscLabelPl(w)`
 * (`game/diplomacy-credibility.ts:61-63`, progi pasm); `tooltip` = treść `title` (web: z rozbiciem
 * `WIARYGODNOSC_TOOLTIP_DEF_PL + ' ' + wiarygodnoscTooltipRozbiciePl(rozbicie, band)`, bez rozbicia
 * `WIARYGODNOSC_TOOLTIP_PL`; `game/diplomacy-display.ts:244-257`, `diplomacyAudience.ts:1527-1535`).
 */
export interface WiarygodnoscViewDto {
  band: string;
  tooltip: string;
}

/**
 * P5.6 (P5-0 §6.6 `DiplomacyAudienceDto.nastawienie {scores, label, hint}`): nastawienie rozmówcy z Rust —
 * `scores` = web `effectiveNastawienieScores(zaufanie, respekt, atWar)` (podłoga wojny, `diplomacy-display.ts:330-338`),
 * `label` = `nastawienieLabelFromScore(…, { atWar })` (`:315-327`), `hint` = `nastawienieHintPl(atWar)` (`:341-346`).
 */
export interface DiplomacyNastawienieDto {
  scores: { zaufanie: number; respekt: number };
  label: string;
  hint: string;
}

/**
 * P5.6: surowy payload propozycji na stole (web `ProposalPayload`, `game/diplomacy-proposals.ts`) — UI czyta wyłącznie
 * pozycje koszyka (`giveItems`/`receiveItems`, filtr technologii już na stole `diplomacyAudience.ts:407-424`); reszta
 * pól dociera bez typu.
 */
export interface ProposalPayloadDto {
  giveItems?: readonly BasketItemDto[];
  receiveItems?: readonly BasketItemDto[];
  readonly [field: string]: unknown;
}

/**
 * P5.6 (`diplomacyTradeBasket.ts`): kontekst wywołania zapytań koszyka — te same pola `NegotiationModalContext`, które
 * pin podawał funkcjom reguł (`basketPnOpts`/`summaryHtml`/`balanceGiveItemsToFairMin`/`computeQuickDealBasket`,
 * `:190-227,1899-1900,2545-2557,2800-2807`). Wartości surowe z kontekstu (bez domyślnych) — wartości domyślne
 * (`'standardowa'`, `'normal'`, Relacja 100/0, skarbiec 0) stosuje Rust (ZAŁOŻENIE P5.6-Z6).
 */
export interface BasketRulesCtxDto {
  relacjaTotal?: number;
  trustPnGainedThisTurn?: number;
  tempoGry?: string | number;
  difficulty?: string;
  playerSkarbiec?: number;
}

/** P5.6: zapytanie wyceny strony koszyka (web `sumBasketPn` → `diplomacySumPn(toPnItems, basketPnOpts)`, pin `:194-227`). */
export interface BasketPnQueryDto {
  items: readonly BasketItemDto[];
  side: 'give' | 'receive';
  resourceTradeMode: 'once' | 'per_turn';
  dealTurns: number;
  ctx: BasketRulesCtxDto;
}

/**
 * P5.6: zapytanie podsumowania koszyka handlu/daru (`diplomacy_preview_basket`, P5-0 §6.6; pin `summaryHtml`
 * `:1891-1999`) — wynik `DiplomacyBasketPreviewDto` (panel PW + liczby podsumowania).
 */
export interface BasketSummaryQueryDto {
  mode: 'trade' | 'gift';
  give: readonly BasketItemDto[];
  receive: readonly BasketItemDto[];
  resourceTradeMode: 'once' | 'per_turn';
  dealTurns: number;
  ctx: BasketRulesCtxDto;
}

/**
 * P5.6: zapytanie podsumowania koszyka traktatu (pin `treatySummaryHtml` `:1056-1117`: `computePlayerAcceptanceSides`,
 * `bilateralTreatyDisplayPw`, `sideDisplayOfferPw`, panel traktatu). `proposalActionId` = `proposalActionIdFromPayload`
 * (mapowanie UI, `diplomacyNegotiationModal.ts`), `payload` = pola propozycji bez `actionId`.
 */
export interface TreatyBasketSummaryQueryDto {
  proposalActionId: string;
  payload: Readonly<Record<string, unknown>>;
  give: readonly BasketItemDto[];
  receive: readonly BasketItemDto[];
  resourceTradeMode: 'once' | 'per_turn';
  dealTurns: number;
  ctx: BasketRulesCtxDto;
}

/**
 * P5.6: wynik zapytania traktatu — PW stron (web `sideDisplayOfferPw`), PW dwustronne (`bilateralTreatyDisplayPw`) i gotowe
 * dane paneli: `treatyPreview` (gdy `bilateralPw > 0`; = `DiplomacyTreatyBasketPreviewDto`, P5.2) albo `basketPreview`
 * (gdy nie ma PW dwustronnego, a `myPw > 0 || theirPw > 0`; web `renderPnBalancePanelFromBasket(myPw, theirPw, rel)`).
 */
export interface TreatyBasketSummaryDto {
  bilateralPw: number | null;
  myPw: number;
  theirPw: number;
  treatyPreview: DiplomacyTreatyBasketPreviewDto | null;
  basketPreview: Pick<DiplomacyBasketPreviewDto, 'givePn' | 'receivePn' | 'fairMinPn' | 'balancePn' | 'accepted' | 'relation'> | null;
}

/** P5.6: zapytanie „SZYBKA UMOWA” (`diplomacy_quick_deal`, P5-0 §6.6; web `computeQuickDealBasket`, pin `:2800-2807`). */
export interface QuickDealQueryDto {
  ctx: BasketRulesCtxDto;
  ourQuantityResourceOptions: readonly { id: string; label: string; maxQty: number }[];
  theirQuantityResourceOptions: readonly { id: string; label: string; maxQty: number }[];
}

/** P5.6: zapytanie „Wyrównaj (fair @ Rel)” (`diplomacy_balance_to_fair`, P5-0 §6.6; web `balanceGiveItemsToFairMin`, pin `:2539-2559`). */
export interface BalanceToFairQueryDto {
  giveItems: readonly BasketItemDto[];
  receivePn: number;
  resourceTradeMode: 'once' | 'per_turn';
  dealTurns: number;
  ctx: BasketRulesCtxDto;
}

/** P5.6: wycinek payloadu do bramki „waluta w wojnie” (web `CurrencyPayloadSlice`, `game/diplomacy-war-gates.ts`). */
export interface CurrencyPayloadDto {
  goldOnce?: number;
  goldPerTurn?: number;
  giveItems?: readonly BasketItemDto[];
  receiveItems?: readonly BasketItemDto[];
}

export interface DiploListDto {
  lines: string[];
}

/**
 * P5.5 (`diploListHud.ts:481-490`, `diploListEntryFromRelation`): gotowe linie karty obcej cywilizacji
 * = wynik web `formatDiploCivListLines` (`game/diplomacy-display.ts:670-706`; P5-0 §6.6 „DiploListDto: gotowe
 * linie tekstu”) policzony w Rust dla relacji (z etykietą tieru relacji `tierLabel`, `diplomacyPanel.ts:132`).
 * Pusty `metaLine`/`perspectiveLine` = brak linii (jak web).
 */
export interface DiploCivListLinesDto {
  metaLine: string;
  detailLine: string;
  perspectiveLine: string;
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

/** P5.6: = web `ImprovementBonus` (`game/terrain-improvements.ts:11-14`) — bonus ulepszenia z `terrain-improvements.json`. */
export type ImprovementBonusDto = Partial<Record<'zywnosc' | 'praca' | 'handel' | 'pieniadz' | 'drewno' | 'kamien' | 'glina', number>>;

/** P5.6: = web `TerritoryResourceKey` (`game/terrain-improvements.ts:203-205`). */
export type TerritoryResourceKeyDto = 'drewno' | 'kamien' | 'glina' | 'ruda' | 'ruda_zelaza' | 'ruda_cyny' | 'sol' | 'zloto' | 'kon';

/** P5.6: = wynik web `territoryResourceYieldForImprovement(key, zloze)` (magazyn państwa z ulepszenia, SUROW-TERYT-01). */
export interface TerritoryResourceYieldDto {
  resourceKey: TerritoryResourceKeyDto;
  amount: number;
}

/**
 * P5.6 (`hexContextTooltip.ts`, ROZSZ. Z6-1 kontraktu P5-0 §6.7 `improvements_active`/`improvements_available`):
 * jedna pozycja ulepszenia w panelu heksa — nazwa (`improvementDisplayName`), bonus (`improvementBonusForKey`),
 * magazyn (`territoryResourceYieldForImprovement`; dla `built` ze złożem heksa, dla `possible` bez złoża — jak pin
 * `:176,193` vs `:504`), etykiety odblokowań (`labelsForImprovementUnlock`).
 */
export interface HexImprovementLineDto {
  key: string;
  name: string;
  bonus: ImprovementBonusDto;
  magazyn: TerritoryResourceYieldDto | null;
  unlockLabels: string[];
}

/** P5.6: składowa rozbicia plonów miasta (pin `yieldParts`, `:274-295`): `[0]` = teren bazowy, dalej las/rzeka/ulepszenia. */
export interface HexYieldPartDto {
  label: string;
  delta: TileYieldDto;
}

/**
 * P5.6 (`hexContextTooltip.ts`, ROZSZ. Z6-1): widok heksa dla `buildHexContextTooltipHtml` — dookreślenie `HexContextDto`
 * (P5-0 §6.7) do pól, które pin liczył w UI z `Hex`/`GameMap`/cywilizacji/epoki gracza:
 * `terrainBase` = `hex.terenBazowy`; `resourceLabels` = `collectResourceLabels` (`:327-358`); `built` = `improvementKeysForHex`
 * (`:247-249`); `implicit` = klucze aktywne nie-postawione (`:557`; na pinie zawsze puste — `built` = te same klucze);
 * `yieldParts`/`yieldFull` = `yieldParts`/`fullTileYield` (`:251-295`); `possible` = `listTerrainPossibleImprovements`
 * (`:440-513`, ≤ 10 pozycji).
 */
export interface HexTooltipViewDto {
  terrainBase: string;
  resourceLabels: string[];
  built: HexImprovementLineDto[];
  implicit: HexImprovementLineDto[];
  yieldParts: HexYieldPartDto[];
  yieldFull: TileYieldDto;
  possible: HexImprovementLineDto[];
}

/** P5.6: = web `PowerBreakdown` (`game/unit-power.ts:90-109`, `fieldPower`) — Moc pola jednostki liczy Rust (P5-0 §6.8 `power`). */
export interface FieldPowerDto {
  attack: number;
  defense: number;
  total: number;
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

/** P5.4 (`scienceHubHud.ts:16,354-403`): = web `EraGateMissingTech` (`game/era-gate-ui.ts:19-22`). */
export interface EraGateMissingTechDto {
  id: string;
  name: string;
}

/** P5.4: = web `EraGateWonderStatus` (`game/era-gate-ui.ts:24-30`). */
export interface EraGateWonderStatusDto {
  id: string;
  name: string;
  built: boolean;
  inProgress: boolean;
}

/**
 * P5.4 (`scienceHubHud.ts:121,354-403,573-576`): = web `EraGateInfo` (`game/era-gate-ui.ts:46-67`);
 * wszystkie pola liczy silnik (bramka awansu epoki), panel tylko je wyświetla.
 */
export interface EraGateInfoDto {
  era: number;
  eraLabel: string;
  nextEraLabel: string;
  maxEra: number;
  isMaxEra: boolean;
  missingTechs: EraGateMissingTechDto[];
  techsComplete: boolean;
  wonderRequired: boolean;
  wonders: EraGateWonderStatusDto[];
  wonderSatisfied: boolean;
  canAdvance: boolean;
  blocked: boolean;
}

/**
 * P5.4 (`sciencePicker.ts:489-497`): wpis listy huba badań = web `HubEntryDraft`
 * (`ui/scienceHubSnapshotLogic.ts:14-21`) — wynik `buildHubTechEntries` (`:76-141`, reguła wpisana bez importu,
 * `PORTING-QUEUE.md`: REGUŁA `:89-134`) policzony w Rust. `id` = slug węzła drzewka.
 */
export interface HubTechEntryDto {
  id: TechId;
  name: string;
  epoka: string;
  koszt: number;
  locked: boolean;
  isTarget: boolean;
}

export interface ResearchViewDto {
  /**
   * `id` = slug węzła drzewka (`techToSlug`); `effectiveCost` = web `scaledResearchCost(base, tempo, owner,
   * difficulty, epoka)` (`game/difficulty-cost.ts:86-101`, użycie `sciencePicker.ts:1176-1180`).
   */
  techs: { id: TechId; baseCost: number; effectiveCost: number; epoka: string; state: string; terrainUnlockLabels: string[] }[];
  queue: TechId[];
  queueMax: number;
  eraGate: EraGateInfoDto | null;
  tempo: string;
  difficulty: string;
  /**
   * P5.4 (ROZSZ. Z4-3): epoka widoczna na drzewku (`sciencePicker.ts:521-532` `currentEpochLabel`:
   * numer epoki gracza → etykieta, przycięcie do znanych epok); `null` = wszystkie epoki.
   */
  treeEpoch: string | null;
  /** P5.4 (ROZSZ. Z4-2): lista „Możesz wybrać” + podgląd ≤4 zablokowanych (`buildHubTechEntries`). */
  hubEntries: HubTechEntryDto[];
}

// ─── §6.10 Nowa gra ──────────────────────────────────────────────────────────

/**
 * §6.10 `CivMatrixCellDto` (`param_label, formatted, intensity, visible_by_default`). P5.7 r2 (`newGameFlow.ts`,
 * profil macierzy kroku 3, pin `:1174-1354`): + pola komórki web `CivMatrixSemanticCell`
 * (`game/civ-matrix-semantic.ts:33-62`), które UI wyświetla/filtruje, oraz gotowe teksty formatterów silnika
 * (`baselineFormatted`, `intensityLabel`). `paramLabel` = `civMatrixParameterLabelPl(parameterId)`, `formatted` =
 * `civMatrixFormattedValue(rawValue, unit)`, `intensity` = `signedIntensity`, `visibleByDefault` =
 * `statusAllowsDefaultVisibility(consumerStatus)`.
 */
export interface CivMatrixCellDto {
  paramLabel: string;
  formatted: string;
  intensity: number;
  visibleByDefault: boolean;
  /** P5.7 r2 (ROZSZ.): `civMatrixFormattedValue(baselineValue, unit)`. */
  baselineFormatted: string;
  /** P5.7 r2 (ROZSZ.): `civMatrixIntensityLabel(signedIntensity)`. */
  intensityLabel: string;
  /** P5.7 r2 (ROZSZ.): pola `CivMatrixSemanticCell` 1:1. */
  parameterId: string;
  domain: string;
  consumerStatus: string;
  statusLabelPl: string;
  statusReasonPl: string;
  explanationPl: string;
  label: 'POZYTYWNY' | 'NEGATYWNY' | 'NEUTRALNY';
  polarity: 'beneficial' | 'harmful' | 'neutral/not-applicable';
}

/** P5.7 r2 (ROZSZ. §6.10 `civs[].matrix`): = web `CivMatrixSemanticProfile` (`game/civ-matrix-semantic.ts:64-74`), komórki jako DTO. */
export interface CivMatrixProfileDto {
  civilizationId: string;
  civilizationName: string;
  parameterCount: number;
  activeCount: number;
  inactiveCount: number;
  cells: CivMatrixCellDto[];
  blockedReasonPl?: string;
}

export interface NewGameOptionsDto {
  mapSizes: NieZmierzonoDto[];
  menusByMapLabel: { civTypes: NieZmierzonoDto; miastaPanstwa: NieZmierzonoDto; landFractionOpts: NieZmierzonoDto };
  defaults: NieZmierzonoDto;
  civs: { id: string; availableAtEpoch: number; matrix: CivMatrixCellDto[] }[];
}

/**
 * §6.10 `StartPreviewDto { summary_rows, ... }`. P5.7 r2: „...” = pola web `StartPreview` (`game/start-preview.ts:21-37`)
 * 1:1; `summaryRows` = web `startPreviewSummaryRows(p)` (`:120-128`).
 */
export interface StartPreviewDto {
  summaryRows: [string, string][];
  playerCivId: string;
  playerCapitalName: string;
  sameTypeRivalNames: readonly string[];
  sameTypeRivalCount: number;
  activeTypesOnMap: number;
  foreignTypesCount: number;
  modelLine: string;
  modelDetail: string;
}

/** P5.7 r2: wejście zapytania `new_game_preview` = web `BuildStartPreviewInput` (`game/start-preview.ts:39-54`, bez `rivalsCount` @deprecated). */
export interface StartPreviewInputDto {
  civs: CivsCatalogDto;
  cityNamesPools?: unknown;
  playerCivId: string;
  mapSizeMenuLabel?: string;
  cityStatesCount?: number;
  activeTypesCount?: number;
}

/** P5.7 r2: = web `RywaleMenuBundle`/`CivTypesMenuBundle` (`map/newGameMapDefaults.ts:98-103,705-709`) — §6.10 `menus_by_map_label`. */
export interface NewGameMenuBundleDto {
  opts: string[];
  descs: string[];
  domyslny: number;
}

/** P5.7 r2: = web `QualityTier` (`map/newGameMapDefaults.ts:137`) — ustawienie renderera, nie reguła gry (P5-0 Z9). */
export type QualityTierDto = 'low' | 'medium' | 'high';
/** P5.7 r2: = web `DensityTier` (`map/newGameMapDefaults.ts:193`). */
export type DensityTierDto = 'low' | 'medium' | 'high';
/** P5.7 r2: = web `WorldGenerationPreset` (`map/newGameMapDefaults.ts:211-217`). */
export interface WorldGenerationPresetDto {
  resources: DensityTierDto;
  rivers: DensityTierDto;
  desert: DensityTierDto;
  forest: DensityTierDto;
  relief: DensityTierDto;
}
/** P5.7 r2: = web `TypSwiata` (`map/gen-helpers.ts:47`). */
export type TypSwiataDto = 'kontynenty' | 'pangea' | 'wyspy' | 'ziemia';
/** P5.7 r2: = web `BuildingCostPace` (`game/building-cost-tempo.ts:19-25`). */
export type BuildingCostPaceDto = 'niski' | 'normalny' | 'wysoki';
/** P5.7 r2: = web `KosztJednostekPace` (`game/unit-cost-tempo.ts:19-25`). */
export type KosztJednostekPaceDto = 'niski' | 'normalny' | 'wysoki';
/** P5.7 r2: = web `WzrostLudnosciPace` (`game/population-growth-tempo.ts:21-27`). */
export type WzrostLudnosciPaceDto = 'wysoki' | 'normalny' | 'wolny';
/** P5.7 r2: = web `RuchSwiataPace` (`game/ruch-swiata-tempo.ts:23-29`). */
export type RuchSwiataPaceDto = 'krotki' | 'normalny' | 'dlugi';

// ─── §6.11 Karty encji ───────────────────────────────────────────────────────

export type EntityCardDto =
  | { kind: 'building'; id: string; card: NieZmierzonoDto }
  | { kind: 'unit'; id: string; card: NieZmierzonoDto }
  | { kind: 'tech'; id: string; card: NieZmierzonoDto }
  | { kind: 'improvement'; id: string; card: NieZmierzonoDto }
  | { kind: 'wonder'; id: string; card: NieZmierzonoDto };

/**
 * P5.4 (`entityCards/buildingAdapter.ts:58-71`): stan zależny od miasta/gracza, z którym Rust liczy kartę
 * budynku (web `BuildingCardCityState`). `buildCostPace` = web `BuildingCostPace` (`niski|normalny|wysoki`),
 * `difficulty` = web `GameDifficulty` (`easy|normal|hard`) — tu jako `string` (typy web z `game/**`).
 */
export interface BuildingCardStateDto {
  hasCity: boolean;
  displayLevel: number;
  buildCostPace: string;
  difficulty: string;
  ownerId: number;
}

/**
 * P5.4 (§6.11 `EntityCardDto::Building`, ROZSZ. Z4-1): wartości karty budynku policzone przez silnik
 * (web: `buildingAdapter.ts:137,152,257-259,267,278-280,296-297` — funkcje `game/**`). Klucze plonów =
 * klucze `BuildingDef.baza` (`praca|pieniadz|zywnosc|nauka|kultura|zadowolenie|obrona`).
 */
export interface BuildingCardRulesDto {
  /** `buildingEffectAtLevel(baza, przyrost, displayLevel)` per klucz plonu. */
  yieldAtDisplayLevel: Readonly<Record<string, number>>;
  /** `buildingEffectAtLevel(baza, przyrost, l)` dla l = 1..maksPoziom (indeks l−1) per klucz plonu. */
  yieldScale: Readonly<Record<string, readonly number[]>>;
  /** `mnoznikRoleForBuildingId(id)`. */
  mnoznikRole: 'pancerz' | 'parametry' | null;
  /** `cumulativeMnoznikForBuildingId(id, buildings)`. */
  cumulativeMnoznik: number;
  /** `buildingStructuralDefenseBonusLine(id)`. */
  structuralDefenseLine: string | null;
  /** `buildingWorkCost(itemCost('budynek', id, …, 1), undefined, pace, ownerId, difficulty)`. */
  workCost: number;
  /** `buildingStockCost(def)` (kolejność kluczy = web). */
  stockCost: Readonly<Record<string, number>>;
  /** `buildingUpkeep(def, 1)`. */
  upkeepGold: number;
  /** `buildingResourceUpkeep(def)` (kolejność kluczy = web). */
  upkeepResources: Readonly<Record<string, number>>;
  /** `stockResourceLabel(k)` dla kluczy `stockCost` ∪ `upkeepResources`. */
  resourceLabels: Readonly<Record<string, string>>;
}

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
