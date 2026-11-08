/**
 * entityCards/buildingAdapter.ts — `BuildingDef` (`buildings.json`) → `EntityCardData`
 * (T5 MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA; kolejność sekcji przebudowana w
 * P-KARTA-PRZEBUDOWA-UKLAD-Q1 wg zaakceptowanego układu z `00-dispatch.md`).
 *
 * Kolejność `sections`: Wymagania (technologia/budynek-wymóg/dodatkowe warunki) → Opis
 * (proza) → [Rys historyczny, wstawiany przez `renderer.ts::renderEntityCard` na stałym
 * indeksie 2] → Top 5 (R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1, dane z
 * `data/building-cards-top5.json`; dawniej „Top 3” z `buildings.json`) → Co możesz teraz
 * zrobić (NOWA, CZYNNOŚĆ → KORZYŚĆ) → Charakterystyka (BEZ poziomu — poziom w
 * `headerChips`) → Efekty → Koszt budowy → Koszt utrzymania → Poziomy. `headerChips`
 * niesie Epokę/Poziom w nagłówku karty. Budynki niedostępne (Wielka odlewnia, Wielka
 * Kuźnia, Teatr) mają kartę ukrytą w `registry.ts::resolveBuildingRow`.
 *
 * ŚWIADOMIE NIE tutaj (host — `cityPanel.ts::buildBuildingDetailCard` — dopełnia po
 * `renderEntityCard()`, dokładnie wzorem T3/T4 „adapter = treść niezależna od
 * wywołania, wywołujący dopełnia resztę"):
 * - sekcja „Technologie" — dziś budowana przez WSPÓLNĄ `appendTechDetailBlock()`
 *   (współdzieloną też z kartą jednostki mapy/rekrutacji), którą plan architektury
 *   (`05-architektura-plan.md` §3 krok 2) explicite każe zostawić nietkniętą do T10 —
 *   duplikowanie tej logiki tutaj byłoby ryzykiem cichego rozjazdu treści;
 * - sekcja „Uwagi" (`playerFacingNote(def.uwagi)`) — ta sama funkcja co dla technologii/
 *   jednostek, zero powodu duplikować.
 * Adapter jest mimo to SAMOWYSTARCZALNY dla wszystkiego, co da się policzyć z samego
 * `BuildingDef` + czystych funkcji z `game/*` (żadnego I/O, żadnych ciężkich obliczeń —
 * wymóg wydajności hover z dispatchu T5) — czyta `buildings.json` bezpośrednio (jak
 * `registry.ts`/`unitAdapter.ts`) dla `cumulativeMnoznikForBuildingId`, która potrzebuje
 * PEŁNEJ listy budynków (łańcuch `upgradeFrom`).
 *
 * Stan zależny od miasta/gracza, którego adapter NIE MOŻE wyliczyć sam (bo zależy od
 * `cfg.getEpoch`/`cfg.getUnlockedTechs`/`cfg.getBuildingCostPace`/`cfg.getDifficulty` —
 * globalnej, wstrzykiwanej konfiguracji `cityPanel.ts`, prywatnej dla tego modułu, nie
 * części `BuildingDef`) — host wylicza RAZ i przekazuje przez `ctx.city` jako
 * `BuildingCardCityState` (patrz niżej). Brak `ctx.city` = tryb podglądu bez miasta
 * (L1, domyślne pace/difficulty) — dokładnie zachowanie dzisiejszego opcjonalnego
 * parametru `city?: City` w `buildBuildingDetailCard`.
 */
import type { BuildingDef } from '../../data/loader';
import buildingsData from '../../../data/buildings.json';
import buildingCardsTop5Data from '../../../data/building-cards-top5.json';
import { buildingIconSvg } from '../icons/brandAssets';
import {
  buildingEffectAtLevel,
  buildingWorkCost,
  itemCost,
} from '../../game/production';
import type { BuildingCostPace } from '../../game/building-cost-tempo';
import type { GameDifficulty } from '../../game/difficulty-cost';
import { buildingUpkeep, buildingResourceUpkeep } from '../../game/economy-upkeep';
import {
  BUILDING_HAPPINESS_BASE_PER_BUILDING,
  buildingGivesHappiness,
  buildingHappinessAtLevel,
  type BuildingRecord,
} from '../../game/economy';
import { buildingStockCost, stockResourceLabel } from '../../game/building-stock-cost';
import { mnoznikRoleForBuildingId, cumulativeMnoznikForBuildingId } from '../../game/unit-building-bonuses';
import { buildingStructuralDefenseBonusLine } from '../../game/building-upgrades';
import { resolveTechnologyRow, technologyIdFromName } from './registry';
import type { EntityCardAdapter, EntityCardRow, EntityCardSection } from './types';

const ALL_BUILDINGS = buildingsData as unknown as BuildingDef[];

/** Stan zależny od miasta/gracza (patrz nagłówek pliku) — kształt oczekiwany w
 * `ctx.city` (pole `unknown` w kontrakcie ogólnym, per adapter — wzorem
 * `unitInfoCard.ts` nadpisującego `medallion`/`sections` po zbudowaniu danych). */
export interface BuildingCardCityState {
  /** `true` gdy wołający ma realne miasto (wpływa na tekst wiersza „Poziom w tym
   * mieście" — realne L$n vs. podgląd „L1 (podgląd; ...)"). */
  hasCity: boolean;
  /** `buildingUiDisplayLevel(def, city)` policzone przez hosta. */
  displayLevel: number;
  /** `cfg.getBuildingCostPace?.() ?? 'niski'` policzone przez hosta. */
  buildCostPace: BuildingCostPace;
  /** `cfg.getDifficulty?.() ?? 'normal'` policzone przez hosta. */
  difficulty: GameDifficulty;
  /** Owner of the city used to resolve price effects. */
  ownerId: number;
  civBonusy?: readonly import('../../game/production').CivBonusLite[];
}

const EPOCH_LABEL: Record<number, string> = { 1: 'Kamień', 2: 'Brąz', 3: 'Żelazo' };

function epochLabelNum(n: number): string {
  return EPOCH_LABEL[n] ?? `Epoka ${n}`;
}

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function isEmptyDataVal(v: unknown): boolean {
  return v == null || v === '' || v === '—' || v === '-';
}

/** `historia` (lowercase, konwencja `buildings.json` — zgodna z istniejącym
 * `uwagi`/`wymagania`) — pole NIE jest jeszcze zadeklarowane w `BuildingDef`
 * (dodadzą je dopiero batche treści, T-KARTY-HISTORIA-INFRA-Q1 to wyłącznie
 * infrastruktura), więc czytamy je bezpiecznie spoza typowanego kształtu, wzorem
 * `unitAdapter.ts::extra()`. Zwraca `undefined` (nie pusty string) gdy pole brakuje
 * lub jest puste — `types.ts`/`renderer.ts` traktują to jako „sekcja nie istnieje". */
function historicalNoteOf(building: BuildingDef): string | undefined {
  const v = (building as unknown as Record<string, unknown>).historia;
  const t = text(v);
  return t !== '' ? t : undefined;
}

// --- R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1: treść kart budynków z `data/building-cards-top5.json`
// (generator `tools/gen-building-cards-top5.cjs` z `budynki-top5.csv`, FC c828a978f) — wzorem
// etapu 1 (`technologyAdapter.ts` + `tech-cards-top5.json`). ---------------------------------

/** Pozycja „Top 5” — tytuł z liczbą + jedno zdanie (decyzja właściciela (1)); `rodzaj`
 * `warunek`/`rozbudowa` nigdy na Top1 (decyzja (3), pilnuje generator i test). */
export interface BuildingTop5Item {
  tytul: string;
  liczba?: string;
  zdanie: string;
  rodzaj: 'efekt' | 'warunek' | 'rozbudowa';
  dowod?: string;
}
/** „Co możesz teraz zrobić” — schemat CZYNNOŚĆ → KORZYŚĆ (decyzja (2)). */
export interface BuildingCmzItem { czynnosc: string; korzysc: string }
/** `ukryty` — budynek dziś niedostępny (decyzja (4)); `opisKarty` — opis bez odwołania do
 * efektu martwego (nadpisuje `opis` z `buildings.json` WYŁĄCZNIE na karcie). */
export interface BuildingCardContent {
  top5: BuildingTop5Item[];
  cmz: BuildingCmzItem[];
  ukryty?: boolean;
  opisKarty?: string;
}

const BUILDING_CARD_CONTENT = buildingCardsTop5Data as unknown as Record<string, BuildingCardContent | undefined>;

/** Treść karty budynku albo `undefined`, gdy budynek nie ma wpisu (fallback na `top3`). */
export function buildingCardContentOf(id: string): BuildingCardContent | undefined {
  if (id.startsWith('_')) return undefined;
  return BUILDING_CARD_CONTENT[id];
}

/** Jedno zdanie „Co możesz teraz zrobić”: „[CZYNNOŚĆ], aby [KORZYŚĆ].” — ten sam szablon co
 * `technologyAdapter.ts::cmzSentence` (etap 1). */
export function buildingCmzSentence(item: BuildingCmzItem): string {
  return `${item.czynnosc}, aby ${item.korzysc}.`;
}

/** `opis` (P-KARTA-PRZEBUDOWA-UKLAD-Q1) — czytany spoza typowanego kształtu `BuildingDef`,
 * wzorem `historicalNoteOf` wyżej. `opisKarty` z `building-cards-top5.json` ma pierwszeństwo
 * (decyzja (4): opis bez odwołania do efektu martwego, np. Katapulta Warsztatu oblężniczego). */
function descriptionOf(building: BuildingDef, content: BuildingCardContent | undefined): string | undefined {
  const override = text(content?.opisKarty);
  if (override !== '') return override;
  const t = text((building as unknown as Record<string, unknown>).opis);
  return t !== '' ? t : undefined;
}

interface Top3Entry { tytul?: unknown; tekst?: unknown }

/** Dawne `top3` z `buildings.json` — WYŁĄCZNIE fallback dla budynku BEZ wpisu w
 * `building-cards-top5.json` (dziś 0/43 — pilnuje `tools/building-cards-top5-test.cjs`).
 * Pole `top3` zostaje w danych (konsument: `tools/emporion-building-test.cjs`). */
function top3Of(building: BuildingDef): EntityCardRow[] {
  const raw = (building as unknown as Record<string, unknown>).top3;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return { label: text(item), value: '' };
      const o = (item ?? {}) as Top3Entry;
      return { label: text(o.tytul), value: text(o.tekst) };
    })
    .filter((r) => r.label !== '' || r.value !== '');
}

const YIELD_BRAND: { key: keyof BuildingDef['baza']; label: string }[] = [
  { key: 'praca', label: 'Praca' },
  { key: 'pieniadz', label: 'Pieniądz' },
  { key: 'zywnosc', label: 'Żywność' },
  { key: 'nauka', label: 'Nauka' },
  { key: 'kultura', label: 'Kultura' },
  { key: 'zadowolenie', label: 'Zadowolenie' },
  { key: 'obrona', label: 'Obrona' },
];

/** 1:1 z `cityPanel.ts::formatBuildingYieldDetailValue` — bez wtrąconej ikony HTML
 * (kontrakt `EntityCardRow.value` to zwykły tekst, `.textContent`, nie `.innerHTML` —
 * świadoma, udokumentowana delta: treść identyczna, brak inline-ikonki przy liczbie). */
function formatYieldDetailValue(baza: number, przyrost: number, level: number): string {
  const effect = buildingEffectAtLevel(baza, przyrost, level);
  if (effect === 0 && baza === 0 && przyrost === 0) return '—';
  const sign = effect >= 0 ? '+' : '';
  const main = `${sign}${effect} pkt/turę`;
  if (przyrost !== 0 && level > 1) {
    return `${main} (poziom ${level}: baza ${baza} + przyrost ${przyrost} × ${level - 1})`;
  }
  return main;
}

/** Szczęście z budynku WG SILNIKA (`economy.ts::buildingHappinessAtLevel`): ryczałt +1 (tylko
 * `dajeSzczescie: true`) + `baza/przyrost.zadowolenie`. Wiersz „Zadowolenie” w „Plony i efekty”
 * pokazuje tę wartość — tę samą, co silnik i co Top 5 (R-WEB-TRYBUNAL-CARD-HAPPINESS-DISPLAY-Q1:
 * wcześniej karta pokazywała surowe `baza/przyrost` bez ryczałtu, np. Trybunał „+1” zamiast „+2”). */
function formatHappinessDetailValue(record: BuildingRecord, level: number): string {
  const eff = buildingHappinessAtLevel(record, level);
  const extra = eff - BUILDING_HAPPINESS_BASE_PER_BUILDING;
  const levelNote = level > 1 ? `poziom ${level}: ` : '';
  return extra > 0
    ? `+${eff} pkt/turę (${levelNote}ryczałt +${BUILDING_HAPPINESS_BASE_PER_BUILDING}, zadowolenie +${extra})`
    : `+${eff} pkt/turę (${levelNote}ryczałt +${BUILDING_HAPPINESS_BASE_PER_BUILDING})`;
}

/** Skala poziomów Szczęścia wg silnika; `null` gdy budynek nie zmienia wartości między poziomami. */
function formatHappinessScaleRow(record: BuildingRecord, maksPoziom: number): string | null {
  if (maksPoziom <= 1) return null;
  const values: number[] = [];
  for (let l = 1; l <= maksPoziom; l++) values.push(buildingHappinessAtLevel(record, l));
  if (values.every((v) => v === values[0])) return null;
  return values.map((v, i) => `L${i + 1}: +${v}`).join(' · ');
}

/** 1:1 z `cityPanel.ts::formatBuildingYieldScaleRow`. */
function formatYieldScaleRow(def: BuildingDef, baza: number, przyrost: number): string | null {
  if (przyrost === 0 || def.maksPoziom <= 1) return null;
  const parts: string[] = [];
  for (let l = 1; l <= def.maksPoziom; l++) {
    const v = buildingEffectAtLevel(baza, przyrost, l);
    parts.push(`L${l}: ${v >= 0 ? '+' : ''}${v}`);
  }
  return parts.join(' · ');
}

/** 1:1 z `cityPanel.ts::formatBuildingUpkeepGridValue`, bez ikon inline (patrz wyżej). */
function formatUpkeepValue(gold: number, resources: Record<string, number>): string {
  if (gold === 0 && Object.keys(resources).length === 0) return 'utrzymanie zero';
  const parts: string[] = [];
  if (gold > 0) parts.push(`${gold} Pieniądza`);
  const resKeys = Object.keys(resources);
  if (resKeys.length > 0) {
    parts.push(resKeys.map((k) => `−${resources[k]} ${stockResourceLabel(k)}/t`).join(' · '));
  }
  return parts.join(' + ');
}

const DEFAULT_CITY_STATE: BuildingCardCityState = {
  hasCity: false,
  displayLevel: 1,
  buildCostPace: 'niski',
  difficulty: 'normal',
  ownerId: 0,
};

export const buildingAdapter: EntityCardAdapter<BuildingDef> = (building, ctx) => {
  const cityState = (ctx.city as BuildingCardCityState | undefined) ?? DEFAULT_CITY_STATE;
  const displayLevel = cityState.displayLevel;

  // ============================================================================================
  // P-KARTA-PRZEBUDOWA-UKLAD-Q1 — układ zaakceptowany przez właściciela 2026-09-08 (patrz
  // `00-dispatch.md`): Nagłówek → Wymagania → Opis → [Rys historyczny, wspólny punkt
  // pozycjonowania w renderer.ts] → Top 5 → Co możesz teraz zrobić (R-WEB-BUILDING-CARDS-
  // TOP5-IMPLEMENT-Q1) → Charakterystyka → Efekty → Koszt budowy →
  // Koszt utrzymania → Poziomy → Więcej informacji. Sekcje „Opis"/„Wymagania" MUSZĄ zostać
  // pierwsze dwie w tablicy `sections` (indeksy 0/1) — `renderEntityCard` wstawia Rys
  // historyczny na STAŁYM indeksie 2 tej listy, jednolicie dla wszystkich 5 kinds (patrz
  // komentarz tam); przesunięcie tych dwóch sekcji zepsułoby pozycję Rysu historycznego
  // bez żadnego błędu kompilatora.
  // ============================================================================================

  // --- 2. WYMAGANIA — skonsolidowane: technologia + budynek-wymóg + dodatkowe warunki.
  // ŚWIADOMY BRAK wiersza „surowce wymagane do odblokowania" (ZNANY BLOKER (a) z dispatchu):
  // `buildings.json` nie ma takiego pola — jedyne surowce to JEDNORAZOWY koszt budowy, który
  // zostaje w sekcji Koszty (pkt 8), nie tutaj. ----------------------------------------------
  const reqRows: EntityCardRow[] = [];
  const techName = text(building.techUnlock);
  if (techName !== '' && !isEmptyDataVal(techName)) {
    const techSlug = technologyIdFromName(techName);
    const row: EntityCardRow = { label: 'Wymagana technologia', value: techName };
    if (techSlug != null && resolveTechnologyRow(techSlug) != null) {
      row.linkTo = { kind: 'technology', id: techSlug };
    }
    reqRows.push(row);
  }
  const upgradeFromId = text((building as unknown as Record<string, unknown>).upgradeFrom);
  if (upgradeFromId !== '' && !isEmptyDataVal(upgradeFromId)) {
    const prev = ALL_BUILDINGS.find((b) => b.id === upgradeFromId);
    const upgradeRow: EntityCardRow = { label: 'Wymagany budynek', value: prev ? prev.nazwa : upgradeFromId };
    if (prev) upgradeRow.linkTo = { kind: 'building', id: prev.id };
    reqRows.push(upgradeRow);
  }
  if (building.wymagania && !isEmptyDataVal(building.wymagania)) {
    reqRows.push({ label: 'Dodatkowe warunki', value: text(building.wymagania) });
  }
  if (reqRows.length === 0) reqRows.push({ label: 'Wymagania', value: 'brak — dostępny od startu' });
  const requirementsSection: EntityCardSection = { key: 'requirements', title: 'Wymagania', rows: reqRows };

  // --- 3. OPIS — proza (1-2 zdania), slot ZAWSZE obecny na indeksie 1 (patrz komentarz nad
  // adapterem) nawet gdy dane jeszcze nie istnieją (`rows:[]` — renderer pomija pustą sekcję
  // przy budowie DOM, ale pozycja w tablicy zostaje zarezerwowana dla wspólnego punktu
  // wstawiania Rysu historycznego w rendererze). Zakaz wymyślania treści (dispatch) — dopóki
  // `opis` nie istnieje w danych, ta sekcja jest zawsze niewidoczna. -------------------------
  const content = buildingCardContentOf(building.id);
  const opis = descriptionOf(building, content);
  const descriptionSection: EntityCardSection = {
    key: 'description', title: 'Opis',
    rows: opis ? [{ label: '', value: opis }] : [],
    layout: 'prose',
  };

  const sections: EntityCardSection[] = [requirementsSection, descriptionSection];

  // --- 5. TOP 5 (R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1, decyzja właściciela (1)) — indeks 2
  // tablicy `sections`, więc `renderer.ts::renderEntityCard` (HISTORIA_SECTION_INDEX = 2,
  // NIETKNIĘTY) stawia Rys historyczny tuż PRZED nią: Top 5 jest zawsze bezpośrednio po Rysie.
  // Tylko realne pozycje (1–5, bez dopełniania); layout `top3` renderera numeruje dowolną
  // liczbę pozycji. Budynek ukryty (decyzja (4)) nie ma treści — sekcja się nie renderuje. ---
  const top5Rows: EntityCardRow[] = content
    ? (content.ukryty ? [] : content.top5.slice(0, 5).map((item) => ({ label: item.tytul, value: item.zdanie })))
    : top3Of(building);
  if (top5Rows.length > 0) sections.push({ key: 'top5', title: 'Top 5', rows: top5Rows, layout: 'top3' });

  // --- 5b. „Co możesz teraz zrobić” (NOWA, decyzja właściciela (2)) — zaraz po Top 5, maks. 3
  // zdania „[CZYNNOŚĆ], aby [KORZYŚĆ].” z danych; ten sam wygląd co sekcja `actions` karty
  // odkrycia (etap 1). Brak wpisu / budynek ukryty ⇒ brak sekcji (zero wymyślonej treści). ---
  const actionRows: EntityCardRow[] = content && !content.ukryty
    ? content.cmz.slice(0, 3).map((item) => ({ label: '', value: buildingCmzSentence(item) }))
    : [];
  if (actionRows.length > 0) {
    sections.push({
      key: 'actions', title: 'Co możesz teraz zrobić', rows: actionRows,
      collapsible: true, openDefault: true, highlighted: true, layout: 'prose',
    });
  }

  // --- 6. CHARAKTERYSTYKA — BEZ poziomu (poziom przeniesiony do nagłówka, patrz `headerChips`
  // w `return` niżej) -------------------------------------------------------------------------
  const charRows: EntityCardRow[] = [
    { label: 'Kategoria', value: text(building.kategoria) },
    { label: 'Epoka wejścia', value: epochLabelNum(building.epokaWejscia) },
    { label: 'Typ', value: building.wielokrotny ? 'Wielokrotny' : 'Unikalny w mieście' },
  ].filter((r) => hasVal(r.value));
  sections.push({ key: 'characteristics', title: 'Charakterystyka', rows: charRows });

  // --- 7. EFEKTY/PLONY — 1:1 z dawną sekcją „Plony i efekty" ---------------------------------
  const yieldRows: EntityCardRow[] = [];
  const happinessRecord = building as unknown as BuildingRecord;
  for (const y of YIELD_BRAND) {
    if (y.key === 'zadowolenie') {
      // Silnik daje Szczęście tylko budynkom `dajeSzczescie: true` i dolicza do nich ryczałt +1
      // nawet bez `baza.zadowolenie` (Targowisko, Port, Stela). Budynek bez Szczęścia — brak wiersza.
      if (!buildingGivesHappiness(happinessRecord)) continue;
      yieldRows.push({ label: y.label, value: formatHappinessDetailValue(happinessRecord, displayLevel) });
      const happinessScale = formatHappinessScaleRow(happinessRecord, building.maksPoziom);
      if (happinessScale) yieldRows.push({ label: `${y.label} — skala poziomów`, value: happinessScale });
      continue;
    }
    const baza = building.baza[y.key] ?? 0;
    const inc = building.przyrost[y.key] ?? 0;
    if (baza === 0 && inc === 0) continue;
    yieldRows.push({ label: y.label, value: formatYieldDetailValue(baza, inc, displayLevel) });
    const scale = formatYieldScaleRow(building, baza, inc);
    if (scale) yieldRows.push({ label: `${y.label} — skala poziomów`, value: scale });
  }
  const mnoznikRole = mnoznikRoleForBuildingId(building.id);
  if (mnoznikRole) {
    const cumulative = cumulativeMnoznikForBuildingId(building.id, ALL_BUILDINGS);
    if (cumulative !== 0) {
      const label = mnoznikRole === 'pancerz'
        ? 'Pancerz (jednostki, trwale)'
        : 'Parametry poza Pancerzem (jednostki, trwale)';
      yieldRows.push({ label, value: `+${cumulative}%` });
    }
  }
  const defenseLine = buildingStructuralDefenseBonusLine(building.id);
  if (defenseLine) yieldRows.push({ label: 'Obrona strukturalna', value: defenseLine });
  if (yieldRows.length === 0) yieldRows.push({ label: 'Efekty', value: '—' });
  const yieldSection: EntityCardSection = {
    key: 'yield', title: 'Plony i efekty (przychód na turę)', rows: yieldRows,
  };

  sections.push(yieldSection);

  // --- 8. KOSZTY — DWIE osobne pod-sekcje: „Koszt budowy" i „Koszt utrzymania" (dotąd jedna
  // sekcja „Koszty budowy i utrzymania" mieszała jednorazowy wydatek z co-turowym) -----------
  const baseWork = itemCost('budynek', building.id, { buildings: ALL_BUILDINGS, units: [] }, 1);
  const workCost = buildingWorkCost(baseWork, cityState.civBonusy, cityState.buildCostPace, cityState.ownerId, cityState.difficulty);
  const stockCostDetail = buildingStockCost(building);
  const buildCostRows: EntityCardRow[] = [
    { label: 'Praca (jednorazowo)', value: `${workCost} pkt Pracy` },
  ];
  if (building.przyrostKosztu) {
    buildCostRows.push({ label: 'Przyrost za poziom', value: `+${building.przyrostKosztu} pkt Pracy / poziom` });
  }
  const stockKeys = Object.keys(stockCostDetail);
  if (stockKeys.length > 0) {
    buildCostRows.push({
      label: 'Surowce (jednorazowo)',
      value: `${stockKeys.map((k) => `${stockCostDetail[k]} ${stockResourceLabel(k)}`).join(' + ')} — z magazynu państwa`,
    });
  }
  sections.push({ key: 'cost-build', title: 'Koszt budowy', rows: buildCostRows });

  const upkeepGold = buildingUpkeep(building as unknown as BuildingRecord, 1);
  const upkeepResources = buildingResourceUpkeep(building);
  const upkeepCostRows: EntityCardRow[] = [
    { label: 'Co turę', value: formatUpkeepValue(upkeepGold, upkeepResources) },
  ];
  if (building.przyrostUtrzymania) {
    upkeepCostRows.push({
      label: 'Przyrost za poziom', value: `+${building.przyrostUtrzymania} pkt Pieniądza / poziom`,
    });
  }
  sections.push({ key: 'cost-upkeep', title: 'Koszt utrzymania', rows: upkeepCostRows });

  // --- 9. POZIOMY — conditional (maksPoziom > 1), 1:1 wobec dawnej sekcji -------------------
  if (building.maksPoziom > 1) {
    const lvlRows: EntityCardRow[] = [{ label: 'Maks. poziom', value: String(building.maksPoziom) }];
    const names = building.nazwyPoziomow.slice(0, building.maksPoziom).filter(Boolean);
    if (names.length) lvlRows.push({ label: 'Nazwy', value: names.join(' → ') });
    sections.push({ key: 'levels', title: 'Poziomy', rows: lvlRows });
  }

  // --- 1. NAGŁÓWEK — POZIOM/EPOKA jako pigułki na górze (pkt 6: poziom opuszcza
  // Charakterystykę, bo już jest tutaj) ------------------------------------------------------
  const headerChips = [
    `Epoka ${epochLabelNum(building.epokaWejscia)}`,
    building.maksPoziom > 1
      ? `Poziom L${cityState.hasCity ? displayLevel : 1}/${building.maksPoziom}`
      : 'Jeden poziom',
  ];

  return {
    kind: 'building',
    id: building.id,
    title: building.nazwa,
    subtitle: text(building.kategoria) || undefined,
    medallion: { kind: 'icon', svg: buildingIconSvg(building, building.id) },
    headerChips,
    sections,
    civpediaLink: { folder: 'budynki', slug: building.id },
    historicalNote: historicalNoteOf(building),
  };
};

function hasVal(v: string): boolean {
  return v !== '' && v !== '0' && !isEmptyDataVal(v);
}
