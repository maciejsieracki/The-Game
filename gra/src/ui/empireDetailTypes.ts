/**
 * empireDetailTypes.ts — snapshot panelu imperium (HUD mapy).
 */
import type { HudState } from './hud';
import type { ResourceUsageBreakdown } from '../game/resource-usage-breakdown';

/** PYTANIE-84-U23A — uchwała imperium (perk widoczny, gdy ≥1 Spichlerz II płaci Sól). */
export const UCHWALA_SOL_SPICHLERZ_II_ID = 'uchwala-sol-spichlerz-ii';

export interface EmpireUchwalaRow {
  id: string;
  /** Krótka nazwa uchwały (nagłówek w panelu). */
  nazwa: string;
  /** Efekt w grze — pełne zdanie, z jednostkami (pkt Żywności/turę). */
  opis: string;
  /** Źródło mechaniki (np. „Spichlerz II · Sól"). */
  zrodlo: string;
  aktywna: boolean;
}

/** Kanon tekstu U-23A (PYTANIE-84-R8 / U-10). */
export function buildUchwalaSolSpichlerzII(
  aktywna: boolean,
  spichlerzIISolCount?: number,
): EmpireUchwalaRow {
  const count = Math.max(0, spichlerzIISolCount ?? 0);
  const countNote = count > 0
    ? ` Aktywne Spichlerze II płacące Sól: ${count}.`
    : '';
  return {
    id: UCHWALA_SOL_SPICHLERZ_II_ID,
    nazwa: 'Solanka zapasowa',
    opis: aktywna
      ? `Armia poza własnym terytorium zużywa 1 pkt Żywności/turę zamiast 2 (bonus imperium).${countNote}`
      : 'Nieaktywna — wymaga co najmniej jednego Spichlerza II z dostępem do Soli w magazynie państwa (5 Soli/turę).',
    zrodlo: 'Spichlerz II · Sól',
    aktywna,
  };
}

export interface EmpireGlobalParams {
  civName: string;
  civEmoji: string;
  styl: string;
  jednostkaSpec: string;
  bonusStartowy: string;
  religiaPanstwowa: string;
  bonusy: Array<{ opis: string; realizuje: string }>;
  /** U-23A: aktywne uchwały cywilizacyjne (perki imperium poza bonusami z civs.json). */
  uchwaly?: EmpireUchwalaRow[];
}

export interface EmpireResourceRow {
  id: string;
  icon: string;
  label: string;
  stock: number;
  /** Zmiana zapasu / turę (netto: produkcja ± dyplomacja). */
  ratePerTurn: number;
  /**
   * Produkcja własna (teren + konwertery) — bez umów dyplomatycznych.
   * Gdy brak — UI traktuje `ratePerTurn` jako produkcję.
   */
  rateProductionPerTurn?: number;
  /** Surowce oddawane co turę na umowy handlowe (dyplomacja). */
  rateDiploOutPerTurn?: number;
  /** Surowce otrzymywane co turę z umów handlowych (dyplomacja). */
  rateDiploInPerTurn?: number;
  assigned?: string;
  typ: 'podstawowy' | 'surowy' | 'przetworzony' | 'hodowla';
  dostep: boolean;
  /**
   * SUROW-CIV-01 (Maciej 2026-07-24): cap CAŁEGO PAŃSTWA (civ-wide) dla tego typu
   * surowca — capBase + capBonusPerMagazyn×liczba Magazynów ownera. Brak (undefined)
   * tylko gdy surowiec nie jest magazynowany (dziś: żaden z katalogu — R-SUROWCE-DOSTEP-ILOSC-Q1
   * cofnęło 331aa180, wszystkie 13 surowców mają realny cap).
   */
  cap?: number;
  /**
   * SUROW-UI-A1 (2026-07-24): baza capu (econ-params.json magazyn_baza_surowce, DZIŚ
   * 1000) — pozwala UI wyliczyć tekst „baza + bonus × Magazyny” bez zaszywania starej
   * wartości 100 na sztywno.
   */
  capBase?: number;
  /** Bonus capu za KAŻDY Magazyn (econ-params.json magazyn_bonus_surowce_na_budynek). */
  capBonusPerMagazyn?: number;
  /**
   * Opcjonalnie: skąd dostęp pochodzi (Ceramika/Sól/Koń/Złoto — budynek/złoże/szlak).
   * `undefined` gdy `dostep` jest false (nie ma czego pokazać).
   */
  zrodlo?: string;
  /**
   * R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10): czy ten surowiec jest wymagany przez
   * obywateli imperium w bieżącej epoce (`citizen-resource-upkeep.ts`). `undefined`/`false` =
   * surowiec nie jest na liście tej epoki (badge nie jest rysowany).
   */
  citizenRequired?: boolean;
  /**
   * Gdy `citizenRequired` — czy magazyn centralny akurat TERAZ ma > 0 tego surowca (pokrycie)
   * czy 0 (kara aktywna — Szczęście −1, Rozwój −1% w każdym mieście imperium).
   */
  citizenCovered?: boolean;
  /**
   * P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12): rozbicie zużycia tego surowca w
   * OSTATNIEJ przeliczonej turze na budynki/obywateli/wojsko — czytane WPROST z tego, co
   * silnik faktycznie odjął z magazynu (`resource-usage-breakdown.ts`), NIE przeliczane
   * osobno. `undefined` = brak zużycia żadnej kategorii tego surowca tej tury (przycisk
   * „Zobacz szczegóły" niepotrzebny — patrz `resourceUsageHasAny`).
   */
  usage?: ResourceUsageBreakdown;
}

export interface EmpireKulturaSnap {
  total: number;
  rate: number;
  thresholds: number[];
  nextThreshold: number | null;
  pctToNext: number | null;
  happinessNote: string;
  cities: Array<{ name: string; kultura: number; borderRadius: number }>;
}

export interface EmpirePowerComponentRow {
  key: string;
  label: string;
  rawCount: number;
  weightPct: number;
  normalized: number;
  points: number;
  sharePct: number;
  formulaNote?: string;
}

export interface EmpirePowerSnap {
  power: number;
  powerBase: number;
  components: EmpirePowerComponentRow[];
  ranking: Array<{ civ: string; power: number; rank: number; isPlayer?: boolean }>;
  respektExample?: { civ: string; respekt: number; playerPower: number; theirPower: number };
  /** R-RANKING-MOC: pozycja absolutna wśród WSZYSTKICH cywilizacji (także nieodkrytych). */
  absoluteRank?: { rank: number; total: number };
  ludnoscLudki: number;
  ludnoscAbsLabel: string;
  rekruci: number;
  rekruciLabel: string;
  rekrutEkw: number;
  rekruciMax: number;
  rekruciMaxLabel: string;
  unitsOnMap: number;
  kosztJednostki: number;
}

/** Dochód / turę per miasto (ostatni tick ekonomii). */
export interface EmpireCityEconRow {
  name: string;
  /** Wpływ do skarbca imperium z tego miasta / turę. */
  pieniadz: number;
  /** Pieniądz brutto miasta przed mnożnikiem zamożności. */
  pieniadzBrutto?: number;
  /** Dochód ze szlaków handlowych (wliczony w pieniadz). */
  handelZeSzlakow?: number;
  /** Utrzymanie budynków w tym mieście / turę (schodzi ze skarbca imperium). */
  utrzymanieBudynkow?: number;
  pracaPula: number;
  pracaBudynki: number;
  nauka: number;
}

/** Ludność i pula rekrutów per miasto. */
export interface EmpireCityPoborRow {
  name: string;
  ludki: number;
  ludnoscAbsLabel: string;
  rekruci: number;
  rekruciMax: number;
  regenPerTurn: number;
}

/**
 * TEMAT 14 (Maciej 2026-07-24) — jedna aktywna trasa handlowa gracz↔obca cywilizacja
 * (trade-routes.ts TradeRoute), widziana z panelu imperium (nie panelu miasta).
 */
export interface EmpireTradeRouteRow {
  id: string;
  /** Miasto gracza (fromCityId trasy — trasy zawsze gracz↔obcy, patrz refreshTradeRoutes). */
  cityName: string;
  partnerCityName: string;
  partnerOwnerLabel: string;
  medium: 'lad' | 'morze';
  dystans: number;
  /** Dochód tej trasy/turę (tradeRouteDistanceIncome) — kredytowany OBU miastom w pełnej kwocie. */
  income: number;
}

/**
 * DYSPOZYCJA 85 (Maciej 2026-07-26): surowiec, do którego gracz ma dostęp DZIĘKI
 * aktywnej trasie handlowej z obcą cywilizacją (trade-routes.ts TradeRouteResourceGrant,
 * pierwszy/deterministyczny grant per surowiec — patrz firstTradeRouteResourceGrant).
 * Panel Handel = handel międzynarodowy i tylko on, więc to jedyne miejsce, gdzie ten
 * fakt jest pokazywany graczowi (miasto go już NIE pokazuje — 🔗/tradeSources usunięte
 * z cityPanel.ts przy tym samym zadaniu).
 */
export interface EmpireTradeResourceGrantRow {
  resourceKey: string;
  label: string;
  partnerLabel: string;
}

/** Aktywna Umowa Handlowa (traktat) — widok panelu imperium. */
export interface EmpireTradeDealRow {
  partnerLabel: string;
  partnerOwnerId: number;
  /** null = bezterminowa */
  turnsLeft: number | null;
  trustPerTurn: number;
  hasActiveRoute: boolean;
  blockReason?: string;
}

/** Zbiorczy widok imperium: suma dochodu + rozpiska aktywnych tras (żeton HUD „Handel"). */
export interface EmpireTradeSnap {
  totalIncome: number;
  routes: EmpireTradeRouteRow[];
  /** Aktywne umowy handlowe (traktaty) gracza z obcymi cywilizacjami. */
  activeDeals: EmpireTradeDealRow[];
  /**
   * Etykieta strumienia podatkowego z pól miasta (zawsze "Podatek" od 2026-07-27).
   * Używana w zdaniu "+5% podatku z pól" w renderHandelSection — NIE do nazwy
   * sekcji "Handel — szlaki handlowe" (trasy z obcymi cywilizacjami).
   */
  daninaLabel: 'Podatek';
  /**
   * CUDA-HANDEL-01 (Maciej 2026-07-26) + DYSPOZYCJA 85: suma % bonusu cudów świata
   * "handel_procent" gracza (ownerId=0), addytywna, w punktach procentowych (15 = +15%).
   * Ląd = tylko wpisy "cel":"handel" (Petra, Brama wszystkich narodów, Pałac Weiyang).
   * Morze = "cel":"handel" ORAZ "handel_morski" (dolicza się Kamień Ha'amonga, Kolos
   * Rodyjski) — zgodnie z sumWonderTradeRouteBonusForOwner (wonders-data.ts).
   */
  wonderBonusLadPct: number;
  wonderBonusMorzePct: number;
  /** Surowce "z trasy" aktywne DLA GRACZA teraz (pusta lista = brak). */
  resourceGrants: EmpireTradeResourceGrantRow[];
}

/** PYTANIE-85 — wiersz tabeli miast w Spichlerzu centralnym. */
export interface EmpireFoodCityUiRow {
  cityId: string;
  name: string;
  produkcja: number;
  kosztRacji: number;
  bilans: number;
  wzrostProcent: number;
  nakarmione?: boolean;
}

/** PYTANIE-85 — podsumowanie tury + stan magazynu centralnego żywności. */
export interface EmpireFoodSnap {
  zapasy: number;
  maxCap: number;
  glodWojska?: boolean;
  /** Rozbicie ostatniej tury (brak przed pierwszym tickiem). */
  tick?: {
    uprawaHodowla: number;
    wyzwienieLudnosci: number;
    nadwyzka: number;
    pomocMiastom: number;
    spichlerzStolicy: number;
    wojsko: number;
    przyrostZapasow: number;
  };
  perCityRows: EmpireFoodCityUiRow[];
}

export interface EmpireDetailSnap {
  global: EmpireGlobalParams;
  economy: HudState;
  kultura: EmpireKulturaSnap;
  power: EmpirePowerSnap;
  cityEcon: EmpireCityEconRow[];
  cityPobor: EmpireCityPoborRow[];
  resources: EmpireResourceRow[];
  trade: EmpireTradeSnap;
  /** PYTANIE-85 — Spichlerz centralny (magazyn żywności imperium). */
  food: EmpireFoodSnap;
}
