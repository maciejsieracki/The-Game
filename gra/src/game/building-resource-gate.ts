/**
 * building-resource-gate.ts — bramka budynków: realne wymogi terenowe / budynkowe per budynek.
 *
 * TEMAT 8 (2026-07-24, decyzje właściciela C-BUD-Q1/Q2/Q3 — patrz dyspozycje handoff):
 *  - Q1: bramka EPOKI to WYŁĄCZNIE `building.epokaWejscia <= epoka gracza` — to jest CZYSTY
 *    epoch-check w `production.ts` (`if (b.epokaWejscia > epoch) continue;`, funkcja
 *    `availableProduction`), NIE w tym module. Poprzednia wersja (B-SUROW-BUD, 2026-07-23)
 *    dokładała TU dla WSZYSTKICH budynków dodatkowy blankietowy wymóg "aktywny dostęp do
 *    surowca danej epoki" (Drewno w epoce 1, +Kamień w epoce 2, +Cegła w epoce 3/4) —
 *    koncepcyjnie błędne (myliło "w jakiej epoce budynek jest dostępny" z "czy imperium ma
 *    dostęp do surowca tej epoki") i realnie blokowało budynki niezwiązane tematycznie z tymi
 *    surowcami. Dowód na realną szkodliwość: `tools/deposit-building-gate-test.cjs` test
 *    "garncarnia OK gdy Glina active" FAILOWAŁ przed tą poprawką, bo blankietowa bramka
 *    epoki 1 dokładała wymóg Drewna, którego test (słusznie) nie dostarczał. USUNIĘTE:
 *    stała `ERA_ACCESS_LABELS` i funkcja `eraAccessLabels()`.
 *  - Q2: zamiast usuniętych/mylących tekstów `wymagania` w buildings.json dograno REALNE,
 *    tematyczne bramki per budynek (patrz mapy niżej): (a) aktywny dostęp do etykiety
 *    surowca w IMPERIUM — źródło terenowe LUB zapas puli państwa (mechanizm B-SUROW-BUD
 *    sprzed Temat 8, tu zachowany, tylko już nie blankietowy per epokę); (b) inny budynek
 *    wybudowany W TYM SAMYM MIEŚCIE (nie imperium — sprawdzane w `production.ts`, bo tam
 *    jest per-city `builtList` + `isBuildingSupersededByUpgrade`); (c) wybrzeże LUB rzeka w
 *    zasięgu TEGO miasta (teren — sprawdzane w `production.ts` przez `ctx.cityHasCoastOrRiver`,
 *    WYLICZONE przez main.ts, bo ten moduł jest pure-logic i nie zna mapy).
 *  - Q3 (historyczne): Odlewnia brązu wymagała Kopalni miedzi na mapie — DOSTEP-SUROWCE-Q1
 *    (2026-07-29): tylko magazyn państwa (Ruda > 0), jak pozostałe DEPOSIT_LINKED.
 */
import type { BuildingDef } from '../data/loader';
import {
  deductBuildingStockCostAcrossCities,
  ownerResourceStock,
  type StockCitySource,
} from './building-stock-cost';
import {
  MENNICA_ZLOTO_DRAIN_PER_TURN,
  ownerCanFeedMennica,
  ZLOTO_LABEL,
} from './zloto-access';

const LABEL_BY_ASCII: Record<string, string> = {
  drewno: 'Drewno',
  kamien: 'Kamień',
  glina: 'Glina',
  ruda: 'Ruda',
  zelazo: 'Żelazo',
  stal: 'Stal',
  braz: 'Brąz',
  sol: 'Sól',
  cegla: 'Cegła',
  ceramika: 'Ceramika',
  zloto: ZLOTO_LABEL,
  kon: 'Koń',
};

/**
 * Budynki wymagające zapasu etykiety surowca w MAGAZYNIE PAŃSTWA (empireStock > 0).
 * DOSTEP-SUROWCE-Q1 (2026-07-29): brak „aktywnego dostępu" / źródła na mapie — tylko
 * fizyczny stock civ-wide. Koszt `koszt_surowce` = osobno (building-stock-cost.ts).
 */
const DEPOSIT_LINKED_BUILDING_LABELS: Readonly<Record<string, readonly string[]>> = {
  garncarnia: ['Glina'],
  cegielnia: ['Glina'],
  // PYTANIE-84-U-24: Spichlerz I — brak bramki Ceramika przy budowie; drain B6 po postawieniu.
  // spichlerz — celowo brak wpisu (bonusy z drain co turę, patrz sekcja Spichlerz niżej).
  spichlerz_ii: ['Sól'],
  stolarnia: ['Drewno'],
  kamieniarski: ['Kamień'],
  kuznia: ['Ruda'],
  odlewnia_brazu: ['Ruda'],
  // PYTANIE-84-R9/U-13 + DOSTEP-SUROWCE-Q1: Mennica — Złoto w magazynie państwa.
  mennica: [ZLOTO_LABEL],
};

/**
 * TEMAT 8 Q2: budynek wymaga innego budynku wybudowanego W TYM SAMYM MIEŚCIE (nie imperium).
 * Wartość = id budynku-prerekwizytu w buildings.json, LUB tablica id-ów gdy więcej niż jeden
 * budynek spełnia ten sam wymóg tematyczny (np. Warsztat oblężniczy ↔ Koszary/Akademia
 * wojskowa). Sprawdzane w `production.ts` przez `cityBuildingPrereqMet` niżej.
 *
 * GRUPY-BUDYNKOW (Maciej 2026-07-25, likwidacja "awansu bocznego"): Koszary i Akademia
 * wojskowa NIE są już w relacji upgradeFrom (oba stoją w mieście osobno) — dawny mechanizm
 * "akceptuje też upgrade prerekwizytu" przez `isBuildingSupersededByUpgrade('koszary', ...)`
 * przestał działać dla tej pary (nic już nie ma upgradeFrom='koszary'), a miasto MOŻE dziś
 * mieć Akademię wojskową bez nigdy niezbudowanych Koszar. Warsztat oblężniczy musi więc nadal
 * być dostępny, gdy w mieście stoi KTÓRYKOLWIEK z dwóch budynków treningowych — stąd tablica
 * zamiast pojedynczego id.
 *
 * REGRESJA-KOLEJNOSC (Maciej 2026-07-25, wieczór): likwidacja "awansu bocznego" (usunięcie
 * `upgradeFrom` z czterech par: Biblioteka/Akademia, Mury/Cytadela, Koszary/Akademia wojskowa,
 * Kamienne kręgi/Świątynia) skasowała PRZY OKAZJI wymóg kolejności budowy, którego istnienia
 * nikt nie planował usuwać — dało się postawić Akademię bez Biblioteki. Właściciel: "budynek
 * wcześniejszy musi być wybudowany, żeby wybudować kolejny", dla WSZYSTKICH par z dawnym
 * awansem bocznym. Stąd cztery dopiski niżej (semantyka OR nie ma tu znaczenia — pojedynczy
 * id — ale funkcja i tak akceptuje tablicę, gdyby kiedyś przybył drugi wariant poprzednika).
 *
 * DECYZJE 54a/54b (Maciej 2026-07-25): Baszta wymaga Murów, Akwedukt wymaga Studni — oba W TYM
 * SAMYM MIEŚCIE. Dograne tym samym mechanizmem (nie osobna ścieżka) — patrz `baszta`/`akwedukt`
 * niżej. Baszta jest budynkiem obronnym NIEZALEŻNYM od Cytadeli (city-defense.ts) — ten
 * prerekwyzyt dotyczy WYŁĄCZNIE kolejności budowy, NIE bonusu procentowego Obrony (Baszta nadal
 * daje własny +bonus_obrona_baszta_proc niezależnie od tego, czy Mury/Cytadela aktywują bazę
 * "mur" — patrz city-defense.ts). `akwedukt: 'studnia'` jest DODANY OBOK `laznia_publiczna:
 * 'studnia'` (nie zamiast) — to dwa różne budynki z tym samym wymogiem terenowym Studni w tym
 * samym mieście, nie pomyłka.
 */
export const CITY_BUILDING_PREREQ: Readonly<Record<string, string | readonly string[]>> = {
  warsztat_oblezniczy: ['koszary', 'akademia_wojskowa'],
  laznia_publiczna: 'studnia',
  akademia: 'biblioteka',
  fort: 'mury',
  akademia_wojskowa: 'koszary',
  swiatynia: 'kamienne_kregi',
  // ZLOTO (Maciej 2026-07-25, decyzja 54c=A): Mennica wymaga Targowiska W TYM SAMYM MIEŚCIE
  // (obok bramki surowcowej Złota powyżej — DEPOSIT_LINKED_BUILDING_LABELS).
  mennica: 'targowisko',
  // DECYZJA 54a (Maciej 2026-07-25): Baszta wymaga Murów w tym samym mieście.
  baszta: 'mury',
  // DECYZJA 54b (Maciej 2026-07-25): Akwedukt wymaga Studni w tym samym mieście.
  akwedukt: 'studnia',
};

/**
 * Czy `builtList` (budynki TEGO miasta) spełnia prerekwizyt `prereq` — dowolny z jego id-ów
 * jest wystarczający (semantyka OR), z akceptacją dawnego mechanizmu "upgrade prerekwizytu"
 * (`isBuildingSupersededByUpgrade`) dla id-ów, które nadal są w relacji upgradeFrom (np. gdyby
 * kiedyś wróciła para z awansem bocznym) — funkcja jest neutralna względem tego, które id-y są
 * dziś niezależne, a które w łańcuchu.
 */
export function cityBuildingPrereqMet(
  prereq: string | readonly string[] | undefined,
  builtList: readonly string[],
  buildings: readonly { id: string; upgradeFrom?: string }[],
  isSuperseded: (id: string, builtList: readonly string[], buildings: readonly { id: string; upgradeFrom?: string }[]) => boolean,
): boolean {
  if (!prereq) return true;
  const ids = typeof prereq === 'string' ? [prereq] : prereq;
  return ids.some(id => builtList.includes(id) || isSuperseded(id, builtList, buildings));
}

/**
 * TEMAT 8 Q2: budynek wymaga wybrzeża morskiego LUB rzeki w zasięgu TEGO miasta (teren, nie
 * surowiec — per-miasto, bo lokalizacja portu jest stała). Sprawdzane w `production.ts` przez
 * `ctx.cityHasCoastOrRiver`, wyliczone przez main.ts (`cityHasCoastOrRiverAccess`).
 */
export const WATER_ACCESS_BUILDING_IDS: ReadonlySet<string> = new Set(['port', 'port_wielki']);

/** Label → klucz ASCII w City.surowce / puli państwa (odwrotność LABEL_BY_ASCII). */
const ASCII_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(LABEL_BY_ASCII).map(([ascii, label]) => [label, ascii]),
);

/** @deprecated DOSTEP-SUROWCE-Q1 — pusty; wszystkie etykiety = magazyn państwa. */
export const ACCESS_ONLY_RESOURCE_LABELS: ReadonlySet<string> = new Set();

export function isAccessOnlyResourceLabel(_label: string): boolean {
  return false;
}

/** Czy pojedyncza etykieta surowca jest spełniona (magazyn państwa / konwerter) — runtime i budowa. */
export function empireResourceLabelSatisfied(
  label: string,
  _activeLabels: readonly string[] | undefined,
  empireBuiltIds?: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
  _buildingId?: string,
): boolean {
  return empireLabelSatisfied(label, empireBuiltIds, empireStock);
}

function empireLabelSatisfied(
  label: string,
  empireBuiltIds: readonly string[] | undefined,
  empireStock: Readonly<Record<string, number>> | undefined,
): boolean {
  if (label === 'Cegła' && empireBuiltIds?.includes('cegielnia')) return true;
  if (label === 'Ceramika' && empireBuiltIds?.includes('garncarnia')) return true;
  const asciiKey = ASCII_BY_LABEL[label];
  if (asciiKey && empireStock && (empireStock[asciiKey] ?? 0) > 0) return true;
  return false;
}

/**
 * Etykiety surowca (aktywny dostęp w imperium) wymagane przez ten budynek.
 * TEMAT 8 Q1 (2026-07-24): NIE zawiera już blankietowej bramki epoki — patrz nagłówek pliku.
 * `epokaWejscia` zostaje w sygnaturze (nieużywane tu) tylko dla kompatybilności wywołań
 * (tools/building-gate-audit.cjs, testy) — realny epoch-check jest w `production.ts`.
 */
export function buildingRequiredActiveLabels(building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & {
  wymaganySurowiec?: string | null;
}): readonly string[] {
  const out = new Set<string>();
  const hard = DEPOSIT_LINKED_BUILDING_LABELS[building.id];
  if (hard) hard.forEach(l => out.add(l));
  const key = building.wymaganySurowiec?.trim().toLowerCase();
  if (key && LABEL_BY_ASCII[key]) out.add(LABEL_BY_ASCII[key]!);
  return [...out];
}

/**
 * Bramka surowca przy budowie (DEPOSIT_LINKED): wymagany zapas w magazynie państwa.
 * Koszt `koszt_surowce` = osobno (building-stock-cost.ts).
 */
export function buildingResourceGateMet(
  building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec?: string | null },
  _activeLabels?: readonly string[],
  empireBuiltIds?: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
): boolean {
  const required = buildingRequiredActiveLabels(building);
  if (required.length === 0) return true;
  return required.every(label =>
    empireLabelSatisfied(label, empireBuiltIds, empireStock),
  );
}

/** Id budynków z bramką runtime zależną od złoża/dostępu (PYTANIE-84). */
export const DEPOSIT_RUNTIME_GATED_BUILDING_IDS: readonly string[] = Object.freeze(
  Object.keys(DEPOSIT_LINKED_BUILDING_LABELS),
);

/** Spichlerz I/II — bonusy z drain (U-5), nie z DEPOSIT_LINKED runtime gate. */
const SPICHLERZ_RUNTIME_EXCLUDED = new Set(['spichlerz', 'spichlerz_ii']);

export function hasDepositRuntimeGate(buildingId: string): boolean {
  if (SPICHLERZ_RUNTIME_EXCLUDED.has(buildingId)) return false;
  return Object.prototype.hasOwnProperty.call(DEPOSIT_LINKED_BUILDING_LABELS, buildingId);
}

export interface BuildingRuntimeGateOptions {
  /** Właściciel imperium — wymagany dla bramki Mennicy (łaska + stock). */
  ownerId?: number;
  /**
   * PYTANIE-84-U-13: czy owner ma wystarczająco Złota w skarbcu LUB łaskę po utracie
   * (mennica-zloto-grace.ts). Gdy brak — runtime gate Mennicy patrzy na empireStock.
   * Zachowana nazwa dla kompatybilności z turn-economy.ts / main.ts.
   */
  resolveOwnerZlotoAccess?: (ownerId: number) => boolean;
}

/**
 * PYTANIE-84 + DOSTEP-SUROWCE-Q1: runtime gate = magazyn państwa (lub konwerter Ceramika/Cegła).
 * Mennica: ownerCanFeedMennica (stock + łaska 1 tury).
 */
function empireLabelSatisfiedAtRuntime(
  label: string,
  runtimeActiveBuiltIds: readonly string[],
  empireStock: Readonly<Record<string, number>> | undefined,
): boolean {
  if (label === 'Cegła' && runtimeActiveBuiltIds.includes('cegielnia')) return true;
  if (label === 'Ceramika' && runtimeActiveBuiltIds.includes('garncarnia')) return true;
  const asciiKey = ASCII_BY_LABEL[label];
  if (asciiKey && empireStock && (empireStock[asciiKey] ?? 0) > 0) return true;
  return false;
}

function mennicaRuntimeGateMet(
  empireStock: Readonly<Record<string, number>> | undefined,
  options?: BuildingRuntimeGateOptions,
): boolean {
  if (options?.resolveOwnerZlotoAccess && options.ownerId !== undefined) {
    return options.resolveOwnerZlotoAccess(options.ownerId);
  }
  return ownerCanFeedMennica(empireStock);
}

export function buildingRuntimeGateMet(
  building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec?: string | null },
  activeLabels: readonly string[] | undefined,
  runtimeActiveBuiltIds: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
  options?: BuildingRuntimeGateOptions,
): boolean {
  if (building.id === 'mennica') {
    return mennicaRuntimeGateMet(empireStock, options);
  }
  const required = buildingRequiredActiveLabels(building);
  if (required.length === 0) return true;
  return required.every(label =>
    empireLabelSatisfiedAtRuntime(label, runtimeActiveBuiltIds, empireStock),
  );
}

/**
 * Filtruje builtIds do podzbioru aktywnych co turę (fixpoint — Ceramika/Cegła zależą
 * od aktywnej Garncarni/Cegielni). Budynki bez DEPOSIT_LINKED przechodzą zawsze.
 */
export function filterRuntimeActiveBuiltIds(
  builtIds: readonly string[],
  activeLabels: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
  options?: BuildingRuntimeGateOptions,
): string[] {
  const active = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of builtIds) {
      if (active.has(id)) continue;
      if (!hasDepositRuntimeGate(id)) {
        active.add(id);
        changed = true;
        continue;
      }
      if (buildingRuntimeGateMet(
        { id, epokaWejscia: 1 },
        activeLabels,
        [...active],
        empireStock,
        options,
      )) {
        active.add(id);
        changed = true;
      }
    }
  }
  return [...active];
}

/** Eksport stałej drain Mennicy dla turn-economy / main (bez magic number). */
export { MENNICA_ZLOTO_DRAIN_PER_TURN };

// ---------------------------------------------------------------------------
// PYTANIE-84 U-5 / U-10 / U-11 — Spichlerz: dwa tory (Ceramika lokalnie, Sól imperium)
// Drain B6/B7/B8 ze skarbca państwa po wpływie surowców w tej samej turze (R2).
// ---------------------------------------------------------------------------

/** B6/B8 — Spichlerz I i II (tor ludności). R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (Maciej
 *  2026-08-13): ×5, było 5 (utrzymanie surowcowe budynków — Ceramika to surowiec
 *  fizyczny, nie waluta). / EN: ×5, was 5 (building resource upkeep — Ceramika is a
 *  physical resource, not currency). */
export const SPICHLERZ_DRAIN_CERAMIKA_PER_TURN = 25;
/** B7 — Spichlerz II (tor wojska, imperium-wide gdy ≥1 płaci). R-EKONOMIA-SUROWCE-SKALA-5X-Q1
 *  (Maciej 2026-08-13): ×5, było 5. */
export const SPICHLERZ_DRAIN_SOL_PER_TURN = 25;

export interface SpichlerzDrainPayResult {
  ceramikaPaid: boolean;
  solPaid: boolean;
}

/** Stan bonusów Spichlerza w mieście po próbie drain w tej turze. */
export interface SpichlerzCityBonusState {
  /** Ceramika opłacona — bonus ludności lokalnie (U-5). */
  ceramikaActive: boolean;
  /** Sól opłacona (tylko II) — ten budynek płaci Sól (U-5/U-10 garnizon). */
  solActive: boolean;
  /** Tier I populacji: Ceramika bez pełnego II (U-11: II bez Soli = jak I). */
  maSpichlerzPop: boolean;
  /** Tier II populacji: II + oba surowce (U-12: +10 Zdrowia, 70% bufor). */
  maSpichlerzIIPop: boolean;
}

/**
 * R-SPICHLERZ-CAP-LUDNOSCI-ETAP (2026-08-09): czy miasto ma Spichlerz W DOWOLNYM tierze
 * (I lub II) — sam fakt POSIADANIA budynku, NIEZALEŻNIE od tego, czy Ceramika/Sól zostały
 * odprowadzone w tej turze (`SpichlerzCityBonusState.maSpichlerzPop/maSpichlerzIIPop` to co
 * innego — miękkie bonusy zależne od drain). Używane wyłącznie do twardego capu ludności
 * (`cityPopulationCap`) — cap to stały parametr strukturalny miasta, nie bonus turowy.
 * Ulepszenie do Spichlerz II USUWA `'spichlerz'` z `builtIds` (upgradeFrom w buildings.json),
 * dlatego trzeba sprawdzać OBA id — jedna, współdzielona konwencja zamiast osobnych kopii w
 * `turn-economy.ts` / `population-growth-v85.ts` / `cityPanel.ts` (patrz R-SPICHLERZ-CAP-LUDNOSCI-ETAP
 * runda 2, B1).
 */
export function cityHasSpichlerzBuilding(builtIds: readonly string[]): boolean {
  return builtIds.includes('spichlerz') || builtIds.includes('spichlerz_ii');
}

/**
 * Pobiera drain Spichlerza z puli państwa ownera (B6/B7/B8).
 * `dryRun=true` — tylko sprawdzenie zapasu (podgląd HUD), bez mutacji City.surowce.
 */
export function paySpichlerzDrainForCity<T extends StockCitySource>(
  cities: readonly T[],
  ownerId: number,
  builtIds: readonly string[],
  dryRun = false,
): SpichlerzDrainPayResult {
  const hasI = builtIds.includes('spichlerz');
  const hasII = builtIds.includes('spichlerz_ii');
  if (!hasI && !hasII) return { ceramikaPaid: false, solPaid: false };

  let ceramikaPaid = false;
  let solPaid = false;

  if (ownerResourceStock(cities, ownerId, 'ceramika') >= SPICHLERZ_DRAIN_CERAMIKA_PER_TURN) {
    if (!dryRun) {
      deductBuildingStockCostAcrossCities(cities, ownerId, {
        ceramika: SPICHLERZ_DRAIN_CERAMIKA_PER_TURN,
      });
    }
    ceramikaPaid = true;
  }

  if (hasII && ownerResourceStock(cities, ownerId, 'sol') >= SPICHLERZ_DRAIN_SOL_PER_TURN) {
    if (!dryRun) {
      deductBuildingStockCostAcrossCities(cities, ownerId, {
        sol: SPICHLERZ_DRAIN_SOL_PER_TURN,
      });
    }
    solPaid = true;
  }

  return { ceramikaPaid, solPaid };
}

/** Mapuje wynik drain → flagi bonusów (U-5, U-11). */
export function resolveSpichlerzCityBonusState(
  builtIds: readonly string[],
  drain: SpichlerzDrainPayResult,
): SpichlerzCityBonusState {
  const hasII = builtIds.includes('spichlerz_ii');
  const hasI = builtIds.includes('spichlerz');
  if (!hasI && !hasII) {
    return {
      ceramikaActive: false,
      solActive: false,
      maSpichlerzPop: false,
      maSpichlerzIIPop: false,
    };
  }
  const ceramikaActive = drain.ceramikaPaid;
  const solActive = hasII && drain.solPaid;
  const maSpichlerzIIPop = hasII && ceramikaActive && solActive;
  const maSpichlerzPop = ceramikaActive && !maSpichlerzIIPop;
  return { ceramikaActive, solActive, maSpichlerzPop, maSpichlerzIIPop };
}

/** P84-SPICHLERZ-2026-07-27: +5 tier I (Ceramika), +10 pełny II — równolegle z % wzrostu (P85). */
export function spichlerzHealthBonus(state: SpichlerzCityBonusState): number {
  if (state.maSpichlerzIIPop) return 10;
  if (state.maSpichlerzPop) return 5;
  return 0;
}

/** PYTANIE-85-Q4: +1% tier I (Ceramika), +2% pełny II, 0 bez drainu. */
export function spichlerzGrowthBonusPercent(state: SpichlerzCityBonusState): number {
  if (state.maSpichlerzIIPop) return 2;
  if (state.maSpichlerzPop) return 1;
  return 0;
}

/** P84-U25B: obniżka kosztu racji żywnościowej (nie produkcji z pól): I −25%, II pełny −50%. */
export function spichlerzRationFoodCostMultiplier(state: SpichlerzCityBonusState): number {
  if (state.maSpichlerzIIPop) return 0.5;
  if (state.maSpichlerzPop) return 0.75;
  return 1;
}

/**
 * U-22B: +Zadowolenie z pola `baza.zadowolenie` w JSON Spichlerza II (+2) — tylko lokalnie
 * w mieście z działającym II (oba surowce opłacone). Tier I / II bez Soli → 0 z JSON.
 */
export function spichlerzHappinessBonusFromJson(
  state: SpichlerzCityBonusState,
  jsonBonus = 2,
): number {
  return state.maSpichlerzIIPop ? jsonBonus : 0;
}

/**
 * U-22B: zamienia `spichlerz` / `spichlerz_ii` w builtIds na jeden efektywny id do yieldów
 * z buildings.json (cityBuildingEntriesFromBuiltIds). Pełny II → spichlerz_ii (+2 Zadowolenie);
 * tier I (Ceramika, U-11 II bez Soli) → spichlerz; brak drain → pomija oba.
 */
export function builtIdsForSpichlerzYields(
  builtIds: readonly string[],
  state: SpichlerzCityBonusState,
): string[] {
  const effective = state.maSpichlerzIIPop
    ? 'spichlerz_ii'
    : state.maSpichlerzPop
      ? 'spichlerz'
      : null;
  const out: string[] = [];
  let spichlerzMapped = false;
  for (const id of builtIds) {
    if (id === 'spichlerz' || id === 'spichlerz_ii') {
      if (!spichlerzMapped && effective) {
        out.push(effective);
        spichlerzMapped = true;
      }
      continue;
    }
    out.push(id);
  }
  return out;
}

/**
 * Cap zapasów armii 🍞 per miasto — U-22B, stare reguły empire-food.ts.
 * P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej 2026-08-12): wartości BAZOWE dla epoki 1
 * (Kamień), podniesione 100/150→1000/1500 -- dosłowny cytat właściciela „dla
 * magazynów, które wybudujemy w mieście zwiększ przepustowość z 100 i 150 na
 * 1000 i 1500" (potwierdzone grepem: to JEDYNA para wartości 100/150 w całym
 * mechanizmie magazynów -- patrz komentarz „Spichlerze lokalne +100/+150,
 * Magazyn +100" przy magazyn_centralny_baza_zywnosc w econ-params.json). Od
 * epoki 2 wzwyż PODWAJAJĄ SIĘ co epokę CYWILIZACJI WŁAŚCICIELA (epoka2=2000/3000,
 * epoka3=4000/6000) przez empire-food.ts::computeCentralFoodCap ×
 * economy-upkeep.ts::magazynEraMultiplier -- te stałe zostają FLAT (era1), tak
 * jak throughputFallback w converters.ts (P-KONWERTERY-PRZEPUSTOWOSC-Q1).
 * / EN: era-1 (Stone) BASE values, raised 100/150→1000/1500 per the owner's
 * literal request; double every era of the OWNING civilization from era 2 on.
 */
export const SPICHLERZ_EMPIRE_CAP_I = 1000;
export const SPICHLERZ_EMPIRE_CAP_II_FULL = 1500;

/**
 * U-10B: mnożnik kosztu żywności jednostki (nakładany na wynik unitFoodPerTurn).
 * - Armia poza terytorium: 2→1 gdy ≥1 Spichlerz II płaci Sól (imperium).
 * - Garnizon w mieście płacącym Sól: ½ żywności.
 */
export function spichlerzArmyFoodCostMultiplier(opts: {
  solArmyBonusActive: boolean;
  onOwnTerritory: boolean;
  isGarrisonInSolCity: boolean;
}): number {
  let m = 1;
  if (!opts.onOwnTerritory && opts.solArmyBonusActive) m *= 0.5;
  if (opts.isGarrisonInSolCity) m *= 0.5;
  return m;
}

// ---------------------------------------------------------------------------
// R-BUDYNKI-NIEAKTYWNE (2026-08-04): wybudowany budynek bez surowca runtime → UI
// ---------------------------------------------------------------------------

export interface OwnedBuildingInactiveStatus {
  inactive: boolean;
  /** Polskie etykiety, np. ['Ceramika','Sól'] */
  missingLabels: string[];
  /** Gotowy tooltip: 'Brak: Ceramika, Sól' lub '' gdy aktywny */
  tooltip: string;
}

function formatInactiveTooltip(missingLabels: readonly string[]): string {
  if (missingLabels.length === 0) return '';
  return 'Brak: ' + missingLabels.join(', ');
}

/** Brakujące etykiety surowca dla runtime gate (nie Spichlerz — patrz resolveOwnedBuildingInactiveStatus). */
export function missingRuntimeResourceLabels(
  building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec?: string | null },
  runtimeActiveBuiltIds: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
  options?: BuildingRuntimeGateOptions,
): string[] {
  if (building.id === 'mennica') {
    if (mennicaRuntimeGateMet(empireStock, options)) return [];
    return [ZLOTO_LABEL];
  }
  const required = buildingRequiredActiveLabels(building);
  if (required.length === 0) return [];
  const missing: string[] = [];
  for (const label of required) {
    if (!empireLabelSatisfiedAtRuntime(label, runtimeActiveBuiltIds, empireStock)) {
      missing.push(label);
    }
  }
  return missing;
}

export function resolveOwnedBuildingInactiveStatus(
  buildingId: string,
  opts: {
    builtIds: readonly string[];
    allCities: readonly StockCitySource[];
    ownerId: number;
    /** empire runtime-active built ids (filterRuntimeActiveBuiltIds) — konwerter Ceramika/Cegła */
    runtimeActiveBuiltIds: readonly string[];
    empireStock?: Readonly<Record<string, number>>;
    building?: Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec?: string | null };
    resolveOwnerZlotoAccess?: (ownerId: number) => boolean;
  },
): OwnedBuildingInactiveStatus {
  const empty: OwnedBuildingInactiveStatus = { inactive: false, missingLabels: [], tooltip: '' };

  if (buildingId === 'spichlerz' || buildingId === 'spichlerz_ii') {
    if (!opts.builtIds.includes(buildingId)) return empty;
    const drain = paySpichlerzDrainForCity(
      opts.allCities,
      opts.ownerId,
      opts.builtIds,
      true,
    );
    if (buildingId === 'spichlerz') {
      const missingI = !drain.ceramikaPaid ? ['Ceramika'] : [];
      return {
        inactive: missingI.length > 0,
        missingLabels: missingI,
        tooltip: formatInactiveTooltip(missingI),
      };
    }
    const missingII: string[] = [];
    if (!drain.ceramikaPaid) missingII.push('Ceramika');
    if (!drain.solPaid) missingII.push('Sól');
    return {
      inactive: missingII.length > 0,
      missingLabels: missingII,
      tooltip: formatInactiveTooltip(missingII),
    };
  }

  if (!hasDepositRuntimeGate(buildingId)) return empty;

  const building = opts.building ?? { id: buildingId, epokaWejscia: 1 };
  const gateOptions: BuildingRuntimeGateOptions = {
    ownerId: opts.ownerId,
    resolveOwnerZlotoAccess: opts.resolveOwnerZlotoAccess,
  };
  const missingLabels = missingRuntimeResourceLabels(
    building,
    opts.runtimeActiveBuiltIds,
    opts.empireStock,
    gateOptions,
  );
  return {
    inactive: missingLabels.length > 0,
    missingLabels,
    tooltip: formatInactiveTooltip(missingLabels),
  };
}
