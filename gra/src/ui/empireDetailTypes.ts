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
  /** Fallback gdy brak portretu władcy (civPortraitUrl null) — patrz JSDoc niżej. */
  civEmoji: string;
  /**
   * Portret władcy gracza (medalion) — REUŻYCIE systemu z leaderPortraits.ts (ten sam
   * plik/URL co medaliony bitwy/preBattle/dyplomacji). `null` gdy civId nieznany lub brak
   * pliku dla tej i wszystkich wcześniejszych epok — wtedy nagłówek panelu ma fallback do
   * `civEmoji` (P-PANEL-IMPERIUM-PORTRET-WLADCA, Maciej 2026-08-14). / EN: player ruler
   * portrait (medallion) — REUSES the leaderPortraits.ts system (same file/URL as
   * battle/preBattle/diplomacy medallions). `null` when civId is unknown or no file
   * exists for this and all earlier epochs — the panel header then falls back to
   * `civEmoji`.
   */
  civPortraitUrl?: string | null;
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
   * P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12) + P-ZUZYCIE-ROZBICIE-NIEDOBOR:
   * rozbicie tego surowca na budynki/obywateli/wojsko — czytane WPROST z tego, co silnik
   * policzył (`resource-usage-breakdown.ts`), NIE przeliczane osobno. `undefined` = brak
   * żadnej kategorii tego surowca (przycisk „Zobacz szczegóły" niepotrzebny — patrz
   * `resourceUsageHasAny`). ⚠️ `citizens` jest klamrowany do zapasu (realny drenaż);
   * `buildings`/`units` to PEŁNE zapotrzebowanie, nie zawsze równe temu, co silnik realnie
   * odjął z magazynu przy niedoborze — patrz JSDoc `ResourceUsageBreakdown`.
   */
  usage?: ResourceUsageBreakdown;
  /**
   * P-SUROWCE-KOLEJNOSC-KART (Maciej 2026-08-12): karta placeholder dla surowca, który
   * jeszcze NIE istnieje w `resources.json` (dziś: „Ruda cyny"). Renderuje się wyszarzona,
   * 0/0, bez paska postępu i bez żadnych realnych danych (produkcja/dostęp/zużycie).
   * EN: placeholder card for a resource not yet implemented in `resources.json` (today:
   * "Ruda cyny" / tin ore). Renders dimmed, 0/0, no progress bar, no real data.
   */
  placeholder?: boolean;
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
  ranking: Array<{
    civ: string;
    power: number;
    /** P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): WYŁĄCZNIE Armia + Rekruci (ekw. jedn.). */
    powerMilitary: number;
    /** P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): wszystko OPRÓCZ Armii i Rekrutów. */
    powerEconomic: number;
    rank: number;
    isPlayer?: boolean;
    wiarygodnosc?: number;
  }>;
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
  /**
   * P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA punkt 2 (Maciej 2026-08-12): utrzymanie surowcowe
   * BUDYNKÓW WYBUDOWANYCH W TYM KONKRETNYM mieście / turę (klucz surowca → ilość, 1 szt./typ
   * obecny w koszt_surowce budynku — patrz `buildingResourceUpkeep` w `economy-upkeep.ts`).
   * Źródło: `main.ts` `buildingResourceUpkeepForCityId(cityId, 0)` — TA SAMA funkcja i ten sam
   * wywołanie, którym `_lastPlayerCityEcon.utrzymanieSurowcowBudynkow` jest już liczone (patrz
   * `populateLastPlayerCityEcon`), tylko dotąd nie było przekazane do `cityEcon` w
   * `buildEmpireDetailSnap()`. Budynki NALEŻĄ do jednego miasta, więc to jest PRAWDZIWY per-miasto
   * rozkład (nie przybliżenie) — w przeciwieństwie do zużycia obywateli (magazyn centralny
   * imperium, civ-wide z definicji — ECHO Q1 `citizen-resource-upkeep.ts`) i wojska (jednostki
   * poruszają się po mapie, nie należą do miasta), które NIE mają analogicznego rozbicia
   * per-miasto i celowo NIE są tu wliczone — pełne rozbicie budynki/obywatele/wojsko per
   * surowiec jest w sekcji SUROWCE (karta surowca → „Zobacz szczegóły zużycia",
   * `resource-usage-breakdown.ts`). `undefined` = brak wpisu tick jeszcze (przed 1. turą).
   * / EN: resource upkeep of buildings BUILT IN THIS SPECIFIC city / turn — buildings belong to
   * exactly one city, so this is a genuine per-city split (unlike citizens' central-warehouse
   * drain or roaming units' upkeep, neither of which has a per-city breakdown; both stay
   * empire-wide, shown in the SUROWCE section's "Zobacz szczegóły zużycia" instead).
   */
  utrzymanieSurowcowBudynkow?: Record<string, number>;
  pracaPula: number;
  pracaBudynki: number;
  nauka: number;
  /**
   * P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA dociągnięcie (Maciej 2026-08-16, ECHO A):
   * budynki tego miasta zliczone wg `BUILDING_GROUP_ORDER` (`building-upgrades.ts`,
   * `groupBuiltBuildingIds()`) — 8 grup zawsze obecne w tej kolejności (nawet z count=0),
   * plus ewentualny koszyk `BUILDING_GROUP_FALLBACK` na końcu, gdy dane budynku nie mają
   * rozpoznanej grupy. / EN: this city's buildings counted per `BUILDING_GROUP_ORDER` — all
   * 8 groups always present in this order (even count=0), plus an optional fallback bucket.
   */
  buildingGroups: EmpireCityBuildingGroupRow[];
  /**
   * Kolejka produkcji tego miasta (`cityProd.get(cityId).kolejka`, `production.ts`) — TEN
   * WIDOK świadomie eksponuje `postep` WYŁĄCZNIE dla frontu (index 0, `CityProduction.postep`
   * na żywo); pozostałe pozycje dostają `postep: undefined`, choć silnik MOŻE mieć na nich
   * zbankowany postęp (`ProductionItem.postep`, `promoteToFront()` bankuje go, gdy pozycja
   * schodzi z frontu) — patrz JSDoc `EmpireCityQueueItemRow.postep` (naprawa N5, runda 2,
   * Evaluator FAIL 6366e81e: poprzednie sformułowanie fałszywie sugerowało, że pozycje spoza
   * frontu NIE MAJĄ aktywnego postępu w silniku). Pusta lista = kolejka pusta.
   * / EN: this city's production queue — this VIEW deliberately exposes `postep` ONLY for the
   * front item (live `CityProduction.postep`); other items get `postep: undefined` even though
   * the engine MAY have banked progress on them (`ProductionItem.postep`, banked by
   * `promoteToFront()` when an item leaves the front) — see `EmpireCityQueueItemRow.postep`.
   * Empty array = empty queue.
   */
  queue: EmpireCityQueueItemRow[];
  /** `CityProduction.wstrzymana` — kolejka wstrzymana (Wstrzymaj), bez postępu mimo zawartości. */
  queueWstrzymana: boolean;
  /** Obrona strukturalna tego miasta (mury/cytadela/baszta/palisada) — patrz JSDoc typu. */
  defense: EmpireCityDefenseRow;
}

/**
 * Liczba budynków miasta w jednej grupie dziedzinowej (`BUILDING_GROUP_ORDER`).
 * P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA (Maciej 2026-08-16, ECHO A).
 */
export interface EmpireCityBuildingGroupRow {
  grupa: string;
  count: number;
}

/** Jedna pozycja kolejki produkcji miasta — podzbiór `ProductionItem` (`production.ts`). */
export interface EmpireCityQueueItemRow {
  nazwa: string;
  koszt: number;
  /**
   * Postęp WYSTAWIONY W TYM WIDOKU WYŁĄCZNIE dla frontu kolejki (index 0); pozostałe pozycje
   * dostają `undefined` w tym DTO jako świadome uproszczenie widoku — NIE dlatego, że silnik nie
   * ma dla nich aktywnego postępu. `production.ts` `promoteToFront()` bankuje postęp na
   * pozycji, która schodzi z frontu (`ProductionItem.postep`) i przywraca go, gdy wraca na front
   * — więc pozycje spoza frontu w silniku MOGĄ nosić zbankowany postęp, tylko ten widok go nie
   * pokazuje (naprawa N5, runda 2, Evaluator FAIL 6366e81e — poprzednie sformułowanie twierdziło
   * fałszywie, że te pozycje NIE MAJĄ postępu w ogóle).
   * / EN: progress exposed by THIS VIEW only for the queue front (index 0); other items get
   * `undefined` in this DTO as a deliberate view simplification — NOT because the engine lacks
   * active progress for them. `production.ts` `promoteToFront()` banks progress on the item
   * leaving the front (`ProductionItem.postep`) and restores it when that item returns to the
   * front — so off-front items CAN carry banked progress in the engine, this view just omits it.
   */
  postep?: number;
}

/**
 * Obrona strukturalna miasta — bonus % z murów/cytadeli/baszty/palisady (`city-defense.ts`
 * `cityWallDefenseBonusPercent`, TA SAMA liczba co `structureDefenseBonusFor()` w main.ts
 * dla bitwy/oblężenia — parytet z silnikiem walki) + garnizon na żywo (`unitsOnCityHexForLaw`,
 * `armyMerge.ts` — IDENTYCZNY predykat filtrowania jednostek co `countLawGarrisonOnCityHex`
 * w rozpisce Prawa, ale to DWIE OSOBNE funkcje w tym samym pliku, nie jedna reużyta — naprawa
 * N7b, runda 2, Evaluator FAIL 6366e81e: poprzednie sformułowanie „ta sama funkcja" było
 * nieprawdziwe; liczby się zgadzają, bo filtr jest identyczny, kod nie jest współdzielony).
 */
export interface EmpireCityDefenseRow {
  /**
   * Bonus obrony strukturalnej miasta, w punktach procentowych (200 = +200%). 0 = brak
   * struktury obronnej NA TYM heksie z żadnego źródła — nie tylko „brak murów": naprawa N7a
   * (runda 2, Evaluator FAIL 6366e81e) — `structureDefenseBonusFor()` (main.ts) najpierw sprawdza
   * mury/cytadelę/basztę/palisadę miasta, ale gdy miasto ich nie ma, MOŻE zamiast tego zwrócić
   * bonus z ulepszenia TERENOWEGO na tym heksie (fort +100%/posterunek +50% — inny byt niż
   * budynek Cytadela o tym samym id). 0 nadal oznacza realny brak jakiejkolwiek struktury
   * obronnej, ale >0 niekoniecznie oznacza mury.
   */
  structBonusPct: number;
  /**
   * `structBonusPct > 0` — miasto ma bonus obrony strukturalnej na tym heksie. Zwykle z
   * budynku obronnego (Mury/Cytadela/Baszta/Palisada), ale patrz JSDoc `structBonusPct` —
   * może pochodzić też z ulepszenia terenowego (fort/posterunek) bez żadnych murów.
   */
  hasWalls: boolean;
  /** Jednostki gracza stacjonujące na heksie miasta (garnizon), NA ŻYWO (nie tylko koniec tury). */
  garnizonCount: number;
}

/** Ludność i pula rekrutów per miasto. */
export interface EmpireCityPoborRow {
  /**
   * P-EMPIRE-MIASTA-JOIN-INDEX (naprawa F2, Evaluator FAIL na 89c16ec1): identyfikator miasta
   * (`city.id`), NIE tylko `name` — nazwy miast NIE są unikalne w obrębie jednej cywilizacji:
   * `captureCity()` (`siege.ts:766`) zachowuje nazwę zdobytego miasta, więc dwa miasta TEGO
   * SAMEGO ownera mogą mieć tę samą nazwę po podboju (94 nazwy współdzielone między pulami w
   * `city-names-pools.json`). Join `cityEcon`↔`cityPobor` w tabeli „Miasta"
   * (`cityMiastaMiniDetail`, `empireDetailPanel.ts`) jest INDEKSOWY (obie tablice są równoległe,
   * budowane z tego samego `pc.map()` w `main.ts`) — to pole służy do jednoznacznego
   * dopasowania wiersza żywności (`food.perCityRows`, który już ma `cityId`), gdzie join po
   * nazwie miałby ten sam błąd.
   * / EN: city identifier (`city.id`), NOT just `name` — city names are not unique within one
   * civilization: `captureCity()` keeps the conquered city's name, so two same-owner cities can
   * share a name after conquest. The `cityEcon`↔`cityPobor` join in the Miasta table is
   * INDEX-based (both arrays are parallel, built from the same `pc.map()` in `main.ts`) — this
   * field is for unambiguously matching the food row (`food.perCityRows`, which already carries
   * `cityId`), where a name-based join would have the same bug.
   */
  cityId: string;
  name: string;
  ludki: number;
  ludnoscAbsLabel: string;
  /**
   * P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA punkt 2 (Maciej 2026-08-12): wartość SUROWA (przed
   * `formatManpower`) tożsama z tą, z której liczy się `ludnoscAbsLabel` — potrzebna do
   * zsumowania kolumny LUDNOŚĆ w wierszu podsumowania tabeli „Miasta" (suma liczb, nie sklejanie
   * sformatowanych etykiet tekstowych). / EN: raw value backing `ludnoscAbsLabel`, needed to sum
   * the LUDNOŚĆ column in the city table's summary row (numeric sum, not label concatenation).
   */
  ludnoscAbsolutna: number;
  rekruci: number;
  rekruciMax: number;
  regenPerTurn: number;
  /**
   * P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA dociągnięcie (Maciej 2026-08-16, ECHO A): liczba
   * budynków grupy „Zdrowie" w tym mieście — TA SAMA liczba jak w `EmpireCityEconRow
   * .buildingGroups` (Miasto), tylko wydzielona dla wygody zakładki Obywatele (kąt społeczny).
   */
  zdrowieBuildingCount: number;
  /** Jak wyżej, dla grupy „Prawo i administracja". */
  prawoAdminBuildingCount: number;
  /**
   * Procent Prawa tego miasta (`LawPctBreakdown.prawPct`, `society-breakdown.ts`), czytany
   * WPROST z `cityOrderState` (main.ts) — TA SAMA, autorytatywna liczba silnika co panel
   * miasta (Porządek), liczona raz na koniec tury. `null` = jeszcze brak wpisu (przed 1. turą,
   * `cityOrderState` puste) — panel pokazuje „—", NIE zero (zero sugerowałoby realny wynik).
   */
  prawoPct: number | null;
  /** Bieżący poziom Wyżywienia (Racji) tego miasta, 0–6 co 0,5 (`getCityRationLevel()`). */
  poziomRacji: number;
  /** Wpływ bieżącego poziomu Racji na wzrost ludności, %/turę (`rationGrowthPercent()`). */
  racjaGrowthPct: number;
}

/**
 * P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA dociągnięcie (Maciej 2026-08-16, ECHO A): jedno
 * źródło Zadowolenia (`SocietyLine` z `society-breakdown.ts computeHappinessBreakdown()`,
 * czytane WPROST z `cityOrderState.szLines` w main.ts — TA SAMA, autorytatywna rozpiska, którą
 * panel miasta już pokazuje per miasto). Liczba aktywnych źródeł zależy od stanu gry (silnik
 * pomija linie o wartości 0) — designer mówił o „5 źródłach" jako przybliżeniu z makiety, ale
 * silnik NIE ma sztywnej piątki (może być 0–14 linii naraz, `computeHappinessBreakdown` w
 * `society-breakdown.ts`); ten typ pokazuje realne źródła, nie sztuczne dopasowanie do 5.
 */
export interface EmpireHappinessSourceRow {
  id: string;
  label: string;
  value: number;
}

/** Zagregowane (suma po `id` ze wszystkich miast gracza) źródła Zadowolenia imperium. */
export interface EmpireHappinessSnap {
  /** Posortowane malejąco po |value| — najsilniejsze źródła na górze. */
  sources: EmpireHappinessSourceRow[];
  /** Suma netto wszystkich linii (== suma `value`) — poziom Zadowolenia zagregowany z miast gracza. */
  totalNetto: number;
  /** true = przynajmniej jedno miasto gracza ma już policzony `OrderState` (po 1. turze). */
  hasData: boolean;
}

/**
 * P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA RUNDA 2 (Maciej 2026-08-16, naprawa N1 Evaluatora):
 * agregacja rozbicia Zadowolenia na źródła (suma po `id`, WSZYSTKIE miasta gracza) — wyciągnięta
 * z `buildEmpireDetailSnap()` (main.ts) do czystej, eksportowanej funkcji, żeby dało się ją
 * przetestować bezpośrednio (esbuild bundle + wywołanie), bez odtwarzania całego main.ts.
 * `main.ts` woła TĘ SAMĄ funkcję — nie duplikat, więc test i silnik nie mogą się po cichu
 * rozjechać. Sumowanie MUSI być `+=` (nie nadpisanie) — dwa miasta z tym samym `id` źródła
 * (np. „Budynki") mają się zsumować, nie nadpisać ostatnią wartością.
 * EN: happiness source-breakdown aggregation (sum by `id`, ALL player cities) — extracted from
 * `buildEmpireDetailSnap()` into a pure, exported function so it can be unit-tested directly.
 * `main.ts` calls this SAME function (not a duplicate), so test and engine can't silently drift.
 * Summation MUST be `+=` (not overwrite) — two cities with the same source `id` must sum, not
 * clobber each other.
 */
export function aggregateHappinessSources(
  cityLines: ReadonlyArray<ReadonlyArray<{ id: string; label: string; value: number }> | undefined>,
): EmpireHappinessSnap {
  const agg = new Map<string, { label: string; value: number }>();
  let hasData = false;
  for (const szLines of cityLines) {
    if (!szLines) continue;
    hasData = true;
    for (const line of szLines) {
      const prev = agg.get(line.id);
      if (prev) prev.value += line.value;
      else agg.set(line.id, { label: line.label, value: line.value });
    }
  }
  const sources = Array.from(agg.entries())
    .map(([id, v]) => ({ id, label: v.label, value: Math.round(v.value * 10) / 10 }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const totalNetto = Math.round(sources.reduce((s, r) => s + r.value, 0) * 10) / 10;
  return { sources, totalNetto, hasData };
}

/**
 * TEMAT 14 (Maciej 2026-07-24) — jedna aktywna trasa handlowa gracz↔obca cywilizacja
 * (trade-routes.ts TradeRoute), widziana z panelu imperium (nie panelu miasta).
 */
export interface EmpireTradeRouteRow {
  id: string;
  /**
   * P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA dociągnięcie (Maciej 2026-08-16, ECHO A):
   * `TradeRoute.fromCityId` — identyfikator miasta gracza (NIE tylko `cityName`, patrz
   * P-EMPIRE-MIASTA-JOIN-INDEX: nazwy miast nie są unikalne po podboju) — pozwala zakładce
   * Miasto pogrupować trasy PER MIASTO niezawodnie.
   */
  cityId: string;
  /** Miasto gracza (fromCityId trasy — trasy zawsze gracz↔obcy, patrz refreshTradeRoutes). */
  cityName: string;
  partnerCityName: string;
  partnerOwnerLabel: string;
  medium: 'lad' | 'morze';
  dystans: number;
  /**
   * Dochód DYSTANSOWY tej trasy/turę (`tradeRouteTotalDistanceIncome` × bonus cudów,
   * CUDA-HANDEL-01) — kredytowany OBU miastom w pełnej kwocie i wchodzący do skarbca
   * WPROST (`pieniadzZTras`, turn-economy.ts — z pominięciem Zamożności).
   * T6: to NIE jest cały dochód trasy — drugi składnik to `premiaBudynku` niżej.
   */
  income: number;
  /**
   * T6 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1): czy ta konkretna trasa ma dziś pokrycie
   * budynkiem handlowym w mieście gracza — `TradeRoute.budynekOdblokowany` z T3,
   * przekazane WPROST, bez przeliczania. Od T3 budynek NIE warunkuje istnienia trasy
   * (dochód dystansowy leci od zawarcia umowy) — odblokowuje wyłącznie premię 5%
   * (`premiaBudynku`). `false` = 5% czeka na Targowisko/Port w tym mieście.
   */
  budynekOdblokowany: boolean;
  /**
   * T6: składnik 5% TEJ trasy — dokładnie `tradeRouteBuildingBonusForRoute()`
   * (trade-routes.ts), czyli ta sama liczba, którą `computeTradeRouteBuildingBonusByCity()`
   * (T4) wnosi do `CityYieldContext.premiaHandluTrasHandlowych` w economy.ts.
   * `0` gdy `budynekOdblokowany === false` (dwa nośniki celowo: flaga mówi DLACZEGO,
   * liczba mówi ILE — UI musi odróżnić „5% = 0, bo brak budynku" od zwykłego zera).
   *
   * UWAGA (spójność, nie mieszać strumieni): `income` wpływa do skarbca CZYSTO, a
   * `premiaBudynku` jest addytywnym składnikiem `handelBrutto` miasta (economy.ts
   * Step 4) — przechodzi jeszcze przez korupcję, mnożnik Waluty/Mennicy i podział
   * suwakami Nauka/Skarb/Zamożność. Dlatego UI pokazuje je jako DWA osobne składniki
   * dochodu trasy, a nie jako jedną liczbę „do skarbca" — inaczej byłaby to czwarta,
   * nieprawdziwa wersja tej samej liczby (precedens P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1).
   *
   * Wartość jest UŁAMKOWA (0,05 × dochód dystansowy, bez zaokrąglenia) — dokładnie
   * jak w silniku; zaokrągla dopiero warstwa wyświetlania.
   */
  premiaBudynku: number;
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

/**
 * R-DESIGN-11-ZAKLADEK faza 2 (Maciej 2026-08-1x) — Klatka 3 makiety: box „BADANE TERAZ" w
 * zakładce Nauka pokazuje cel badań aktywny TERAZ, nie tylko sumę Nauki/turę. Źródło: silnikowa,
 * czysta funkcja `getResearchState()` (`gra/src/game/playerState.ts`) — TA SAMA, którą już
 * konsumują `sciencePicker.ts`/`scienceHubHud.ts` (dwa wywołania w `main.ts`), więc panel imperium
 * nie duplikuje formuły postępu/ETA, tylko przekazuje jej wynik dalej. `targetLabel` = id celu
 * (== nazwa technologii w `tech.json`, patrz `PlayerState.badana` JSDoc), gotowe do wyświetlenia
 * bez dodatkowego słownika.
 * EN: "RESEARCHING NOW" box in the Science tab shows the CURRENTLY active research target, not
 * just the Science/turn sum. Source: the engine's pure `getResearchState()` — the SAME function
 * already consumed by sciencePicker.ts/scienceHubHud.ts — so the empire panel doesn't duplicate
 * the progress/ETA formula, just forwards its result. `targetLabel` = target id (== tech name).
 */
export interface EmpireResearchSnap {
  targetLabel: string;
  /** Koszt Nauki (PN) celu, po skalowaniu tempem gry/trudnością — `scaledResearchCost()`. */
  kosztCelu: number;
  /** Pula Nauki zgromadzona (bank, ta sama liczba co `economy.nauka`). */
  pula: number;
  /** Postęp [0..1] w kierunku celu — `min(1, pula/kosztCelu)`. */
  postepFraction: number;
  /** Szacowane tury do ukończenia przy bieżącym tempie Nauki/turę; null = brak celu lub tempo 0. */
  turnsLeft: number | null;
}

/** Wiersz tabeli per-miasto w zakładce Religia (Klatka 11, wariant A). */
export interface EmpireReligionCityRow {
  name: string;
  /** Religia z NAJWIĘKSZĄ liczbą wyznawców w tym mieście (niezależnie od progu dominacji —
   *  w przeciwieństwie do `dominantReligion()`, który zwraca null poniżej progu). '—' = brak
   *  żadnych wyznawców zapisanych (T0 przed pierwszym tickiem). */
  religionLabel: string;
  /** true = wiodąca religia miasta to religia państwowa gracza. */
  isOwn: boolean;
  /** Liczba wyznawców wiodącej religii w tym mieście (wartość surowa z `ReligionState.counts`). */
  adherents: number;
}

/**
 * R-DESIGN-11-ZAKLADEK faza 2 — Klatka 11 (wariant A ZATWIERDZONY 2026-08-14): karta religii
 * państwowej. Pola grounded 1:1 w silniku (`culture-religion.ts`/`main.ts`) — BEZ pola „Porządek"
 * z makiety, bo żaden parametr silnika nie wiąże religii z Porządkiem wprost (tylko Zadowolenie,
 * przez `ReligionParams.zadowolenieDominujaca`/`karaObca`) — patrz notatka Operatora w
 * `empireDetailPanel.ts` przy `renderReligiaSection()`.
 * EN: state religion card. Fields are grounded 1:1 in the engine — WITHOUT the mockup's "Order"
 * row, because no engine parameter ties religion to Order directly (only Happiness, via
 * `ReligionParams.zadowolenieDominujaca`/`karaObca`) — see the Operator's note next to
 * `renderReligiaSection()` in empireDetailPanel.ts.
 */
export interface EmpireReligionSnap {
  /** Nazwa religii państwowej gracza ('—' gdy nieustalona, np. T0). */
  stateReligionLabel: string;
  /** Suma wyznawców religii PAŃSTWOWEJ we wszystkich miastach gracza. */
  totalAdherents: number;
  /** Udział wyznawców własnej religii w sumie wszystkich wyznawców imperium [0..100]. */
  ownSharePct: number;
  /** 100 - ownSharePct — udział wyznawców religii OBCYCH. */
  foreignSharePct: number;
  /** Najliczniejsza obca religia w imperium (do etykiety paska); null = brak obcych wyznawców. */
  foreignLabel: string | null;
  /** Netto szerzenie wyznawców/turę (ta sama liczba co `economy.religionRate`) — panel nie ma
   *  osobnej waluty „Wiara" w silniku, więc etykieta „Wiara/turę" z makiety pokazuje TĘ liczbę. */
  faithRatePerTurn: number;
  /** Bonus Zadowolenia w mieście, gdy religia państwa tam dominuje (`ReligionParams.zadowolenieDominujaca`). */
  zadowolenieBonus: number;
  /** Liczba Świątyń wybudowanych w miastach gracza (`builtIds.includes('swiatynia')`). */
  templeCount: number;
  cities: EmpireReligionCityRow[];
}

/**
 * P-ARMIA-PANEL-BRAK-INFO-PRODUKCJA-JEDNOSTEK (Maciej 2026-08-16): jedno miasto gracza, na
 * czele kolejki produkcji (`City.productionQueue`/`kolejka[0]`, `game/production.ts`
 * `frontItem()`) którego stoi JEDNOSTKA (`ProductionItem.kind === 'jednostka'`) — miasta z
 * pustą kolejką albo z budynkiem na czele NIE trafiają do tej listy (patrz filtr w
 * `buildEmpireDetailSnap()`, main.ts). Zgłoszenie Macieja: „w widoku armii powinien być
 * jeszcze jedno miejsce. Jaka jednostka jest produkowana, jeżeli jest produkowana."
 * EN: one player city whose production queue front (`kolejka[0]`, `frontItem()`) is a UNIT
 * — cities with an empty queue or a building at the front are excluded from this list.
 */
export interface EmpireArmiaProductionRow {
  /** Patrz JSDoc `EmpireCityPoborRow.cityId` — nazwy miast NIE są unikalne po podboju. */
  cityId: string;
  name: string;
  /** Nazwa jednostki na czele kolejki (`ProductionItem.nazwa`). */
  unitName: string;
  /**
   * Tury do ukończenia przy bieżącym tempie Pracy/turę do budynków tego miasta
   * (`etaTurns()`, `game/production.ts` — ta sama formuła co ETA w panelu miasta,
   * `cityPanel.ts`). `null` = brak dopływu Pracy do budynków w tej turze (`pracaBudynki`
   * ≤ 0) LUB kolejka wstrzymana (patrz `wstrzymana` niżej) — nie da się oszacować, panel
   * pokazuje wtedy samą nazwę jednostki bez liczby tur.
   */
  etaTurns: number | null;
  /**
   * N1 (RUNDA 2, Evaluator FAIL, Maciej 2026-08-16): `CityProduction.wstrzymana === true` —
   * silnik (`production.ts`, `advanceProduction()`) NIE dodaje Pracy do wstrzymanej kolejki,
   * więc `etaTurns` jest zawsze `null` w tym wypadku, ale panel MUSI odróżnić „wstrzymana" od
   * zwykłego braku Pracy — inaczej dwa panele tej samej gry przeczą sobie (panel miasta,
   * `cityPanel.ts`, drukuje „wstrzymana" w 4 miejscach dla tej samej sytuacji silnika).
   * EN: mirrors `CityProduction.wstrzymana` — the engine adds no Praca to a paused queue, so
   * `etaTurns` is always `null` here too, but the panel must distinguish "paused" from plain
   * "no Praca this turn" so it does not contradict the city panel.
   */
  wstrzymana: boolean;
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
  /** R-DESIGN-11-ZAKLADEK faza 2 — cel badań aktywny teraz; null = gracz nie wybrał celu. */
  research: EmpireResearchSnap | null;
  /** R-DESIGN-11-ZAKLADEK faza 2 — karta religii państwowej (Klatka 11, wariant A). */
  religion: EmpireReligionSnap;
  /**
   * P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA dociągnięcie (Maciej 2026-08-16, ECHO A):
   * rozbicie Zadowolenia imperium na źródła (zakładka Obywatele) — patrz JSDoc `EmpireHappinessSnap`.
   */
  happiness: EmpireHappinessSnap;
  /** P-ARMIA-PANEL-BRAK-INFO-PRODUKCJA-JEDNOSTEK — miasta gracza aktualnie budujące jednostkę
   *  (front kolejki produkcji == jednostka); patrz JSDoc EmpireArmiaProductionRow. */
  armiaProdukcja: EmpireArmiaProductionRow[];
}
