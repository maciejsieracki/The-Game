/**
 * entityCards/buildingAdapter.ts — `BuildingDef` (`buildings.json`) → `EntityCardData`
 * (T5 MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA).
 *
 * Treść wypełniona 1:1 wg dzisiejszego `cityPanel.ts::buildBuildingDetailCard` — sekcje
 * „Charakterystyka" (kategoria/epoka wejścia/typ/poziom w mieście), „Plony i efekty"
 * (YIELD_BRAND + skala poziomów + bonus mnożnika jednostek + obrona strukturalna),
 * „Koszty budowy i utrzymania" (koszt budowy/przyrost/utrzymanie/przyrost utrzymania/
 * koszt surowcowy), „Poziomy" (maks. poziom + nazwy), „Wymagania budynku".
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
import { buildingIconSvg } from '../icons/brandAssets';
import {
  buildingEffectAtLevel,
  buildingWorkCost,
  itemCost,
} from '../../game/production';
import type { BuildingCostPace } from '../../game/building-cost-tempo';
import type { GameDifficulty } from '../../game/difficulty-cost';
import { buildingUpkeep, buildingResourceUpkeep } from '../../game/economy-upkeep';
import type { BuildingRecord } from '../../game/economy';
import { buildingStockCost, stockResourceLabel } from '../../game/building-stock-cost';
import { mnoznikRoleForBuildingId, cumulativeMnoznikForBuildingId } from '../../game/unit-building-bonuses';
import { buildingStructuralDefenseBonusLine } from '../../game/building-upgrades';
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
  /** Zawsze `0` w dzisiejszym `buildBuildingDetailCard` (świadomy, niezmieniony hardcode
   * — `const ownerId = 0;`), zachowane 1:1. */
  ownerId: number;
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

  // --- Charakterystyka — 1:1 z `buildBuildingDetailCard` sekcja „Charakterystyka" -------
  const charRows: EntityCardRow[] = [
    { label: 'Kategoria', value: text(building.kategoria) },
    { label: 'Epoka wejścia', value: epochLabelNum(building.epokaWejscia) },
    { label: 'Typ', value: building.wielokrotny ? 'Wielokrotny' : 'Unikalny w mieście' },
  ].filter((r) => hasVal(r.value));
  if (displayLevel > 1 || building.maksPoziom > 1) {
    charRows.push({
      label: 'Poziom w tym mieście',
      value: cityState.hasCity
        ? `L${displayLevel} (epoka miasta — jak liczy silnik)`
        : `L1 (podgląd; w mieście rośnie z epoką, max ${building.maksPoziom})`,
    });
  }
  const charSection: EntityCardSection = { key: 'characteristics', title: 'Charakterystyka', rows: charRows };

  // --- Plony i efekty — 1:1 z `buildBuildingDetailCard` sekcja „Plony i efekty" ----------
  const yieldRows: EntityCardRow[] = [];
  for (const y of YIELD_BRAND) {
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

  // --- Koszty budowy i utrzymania — 1:1 z `buildBuildingDetailCard` ----------------------
  const baseWork = itemCost('budynek', building.id, { buildings: ALL_BUILDINGS, units: [] }, 1);
  const workCost = buildingWorkCost(baseWork, undefined, cityState.buildCostPace, cityState.ownerId, cityState.difficulty);
  const upkeepGold = buildingUpkeep(building as unknown as BuildingRecord, 1);
  const upkeepResources = buildingResourceUpkeep(building);
  const stockCostDetail = buildingStockCost(building);
  const costRows: EntityCardRow[] = [
    { label: 'Koszt budowy (jednorazowy)', value: `${workCost} pkt Pracy` },
  ];
  if (building.przyrostKosztu) {
    costRows.push({ label: 'Przyrost kosztu budowy', value: `+${building.przyrostKosztu} pkt Pracy / poziom` });
  }
  costRows.push({ label: 'Utrzymanie (co turę)', value: formatUpkeepValue(upkeepGold, upkeepResources) });
  if (building.przyrostUtrzymania) {
    costRows.push({
      label: 'Przyrost utrzymania', value: `+${building.przyrostUtrzymania} pkt Pieniądza / poziom`,
    });
  }
  const stockKeys = Object.keys(stockCostDetail);
  if (stockKeys.length > 0) {
    costRows.push({
      label: 'Koszt surowcowy (jednorazowy)',
      value: `${stockKeys.map((k) => `${stockCostDetail[k]} ${stockResourceLabel(k)}`).join(' + ')} — z magazynu państwa`,
    });
  }
  const costSection: EntityCardSection = { key: 'cost', title: 'Koszty budowy i utrzymania', rows: costRows };

  const sections: EntityCardSection[] = [charSection, yieldSection, costSection];

  // --- Poziomy — conditional (maksPoziom > 1), 1:1 -----------------------------------------
  if (building.maksPoziom > 1) {
    const lvlRows: EntityCardRow[] = [{ label: 'Maks. poziom', value: String(building.maksPoziom) }];
    const names = building.nazwyPoziomow.slice(0, building.maksPoziom).filter(Boolean);
    if (names.length) lvlRows.push({ label: 'Nazwy', value: names.join(' → ') });
    sections.push({ key: 'levels', title: 'Poziomy', rows: lvlRows });
  }

  // --- Wymagania budynku — conditional, 1:1 -----------------------------------------------
  if (building.wymagania && !isEmptyDataVal(building.wymagania)) {
    sections.push({
      key: 'requirements',
      title: 'Wymagania budynku',
      rows: [{ label: 'Wymagania', value: text(building.wymagania) }],
    });
  }

  return {
    kind: 'building',
    id: building.id,
    title: building.nazwa,
    subtitle: text(building.kategoria) || undefined,
    medallion: { kind: 'icon', svg: buildingIconSvg(building, building.id) },
    sections,
    civpediaLink: { folder: 'budynki', slug: building.id },
    historicalNote: historicalNoteOf(building),
  };
};

function hasVal(v: string): boolean {
  return v !== '' && v !== '0' && !isEmptyDataVal(v);
}
