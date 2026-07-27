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
 *  - Q3: Odlewnia brązu (`odlewnia_brazu`) zostaje jako jedyny hard id-lock — Kopalnia miedzi
 *    w imperium, patrz `braz-access.ts` (`empireHasKopalniaMiedzi`) + `production.ts`
 *    (`PIEC_HUTNICZY_BUILDING_ID`) — NIE w tym module.
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
 * Budynki wymagające aktywnego dostępu do etykiety surowca w IMPERIUM (aktywne źródło
 * gdziekolwiek w cywilizacji LUB — dla surowców magazynowanych — zapas w puli państwa) —
 * patrz `empireLabelSatisfied`. NIE wymaga zasięgu TEGO miasta budowy.
 * TEMAT 8 Q2 (2026-07-24): stolarnia/kamieniarski/kuznia dograne tu z tym samym mechanizmem
 * co istniejące Glina/Ceramika/Sól (spójność — to już sprawdzony wzorzec, nie per-city
 * sąsiedztwo terenu, żeby nie różnicować traktowania bez wyraźnej potrzeby).
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
  // PYTANIE-84-R9/U-13: Mennica wymaga Złota w magazynie państwa (R3=B) LUB aktywnego
  // źródła (Kopalnia złota / szlak → stock). Runtime drain 1/t — game/zloto-access.ts.
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

/**
 * Surowce „tylko dostęp" — bramka NIE spełnia się samym zapasem w puli państwa.
 * PYTANIE-84 R4=A: Złoto, Sól, Koń — magazyn państwa (jak Ruda); zestaw pusty.
 */
export const ACCESS_ONLY_RESOURCE_LABELS: ReadonlySet<string> = new Set();

export function isAccessOnlyResourceLabel(label: string): boolean {
  return ACCESS_ONLY_RESOURCE_LABELS.has(label);
}

/**
 * Czy pojedyncza etykieta surowca jest spełniona dla RUNTIME gate (nie bramki budowy).
 * Kanon 2026-07-28: budowa = wyłącznie magazyn państwa (`koszt_surowce` + canAffordBuildingStock).
 */
/** Czy pojedyncza etykieta surowca jest spełniona (źródło / konwerter / zapas państwa) — runtime. */
export function empireResourceLabelSatisfied(
  label: string,
  activeLabels: readonly string[] | undefined,
  empireBuiltIds?: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
): boolean {
  return empireLabelSatisfied(label, activeLabels ?? [], empireBuiltIds, empireStock);
}

function empireLabelSatisfied(
  label: string,
  activeLabels: readonly string[],
  empireBuiltIds: readonly string[] | undefined,
  empireStock: Readonly<Record<string, number>> | undefined,
): boolean {
  if (activeLabels.includes(label)) return true;
  if (label === 'Cegła' && empireBuiltIds?.includes('cegielnia')) return true;
  if (label === 'Ceramika' && empireBuiltIds?.includes('garncarnia')) return true;
  if (!ACCESS_ONLY_RESOURCE_LABELS.has(label)) {
    const asciiKey = ASCII_BY_LABEL[label];
    if (asciiKey && empireStock && (empireStock[asciiKey] ?? 0) > 0) return true;
  }
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
 * Kanon 2026-07-28 (Maciej): bramka BUDOWY nie używa już dostępu do etykiety surowca
 * (deposit/zasięg/aktywne źródło). Warunek budowy = wystarczający stan magazynu państwa
 * dla `koszt_surowce` (building-stock-cost.ts / production.ts / cityPanel.ts).
 * Sygnatura zachowana dla kompatybilności wywołań — zawsze true.
 */
export function buildingResourceGateMet(
  _building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec?: string | null },
  _activeLabels?: readonly string[],
  _empireBuiltIds?: readonly string[],
  _empireStock?: Readonly<Record<string, number>>,
): boolean {
  return true;
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
 * PYTANIE-84 (Maciej 2026-07-27): runtime gate per budynek z DEPOSIT_LINKED.
 *  - DOSTĘP (ACCESS_ONLY — dziś puste): tylko aktywne źródło.
 *  - MAGAZYN (pozostałe etykiety, w tym Złoto): aktywne źródło LUB zapas państwa > 0.
 *  - Mennica runtime: resolveOwnerZlotoAccess (stock + łaska) LUB ownerCanFeedMennica(stock).
 *  - Ceramika/Cegła: liczone z runtimeActiveBuiltIds (Garncarnia/Cegielnia muszą być aktywne).
 */
function empireLabelSatisfiedAtRuntime(
  label: string,
  activeLabels: readonly string[],
  runtimeActiveBuiltIds: readonly string[],
  empireStock: Readonly<Record<string, number>> | undefined,
): boolean {
  if (activeLabels.includes(label)) return true;
  if (label === 'Cegła' && runtimeActiveBuiltIds.includes('cegielnia')) return true;
  if (label === 'Ceramika' && runtimeActiveBuiltIds.includes('garncarnia')) return true;
  if (!ACCESS_ONLY_RESOURCE_LABELS.has(label)) {
    const asciiKey = ASCII_BY_LABEL[label];
    if (asciiKey && empireStock && (empireStock[asciiKey] ?? 0) > 0) return true;
  }
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
  const active = activeLabels ?? [];
  return required.every(label =>
    empireLabelSatisfiedAtRuntime(label, active, runtimeActiveBuiltIds, empireStock),
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

/** B6/B8 — Spichlerz I i II (tor ludności). */
export const SPICHLERZ_DRAIN_CERAMIKA_PER_TURN = 5;
/** B7 — Spichlerz II (tor wojska, imperium-wide gdy ≥1 płaci). */
export const SPICHLERZ_DRAIN_SOL_PER_TURN = 5;

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

/** Cap zapasów armii 🍞 per miasto — U-22B, stare reguły empire-food.ts. */
export const SPICHLERZ_EMPIRE_CAP_I = 100;
export const SPICHLERZ_EMPIRE_CAP_II_FULL = 150;

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
