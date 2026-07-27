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
 *  - Q3: Piec hutniczy (`odlewnia_brazu`) zostaje jako jedyny hard id-lock — Kopalnia miedzi
 *    w imperium, patrz `braz-access.ts` (`empireHasKopalniaMiedzi`) + `production.ts`
 *    (`PIEC_HUTNICZY_BUILDING_ID`) — NIE w tym module.
 */
import type { BuildingDef } from '../data/loader';

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
  spichlerz: ['Ceramika'],
  spichlerz_ii: ['Sól'],
  stolarnia: ['Drewno'],
  kamieniarski: ['Kamień'],
  kuznia: ['Ruda'],
  // ZLOTO (Maciej 2026-07-25): Mennica wymaga dostępu do Złota (empire-wide, Kopalnia złota
  // gdziekolwiek w imperium — game/zloto-access.ts empireHasKopalniaZlota, dolane do
  // aktywnych etykiet w resource-access.ts collectActiveAccess). Złoto NIE jest magazynowane
  // (brak wpisu w LABEL_BY_ASCII/ASCII_BY_LABEL niżej) — więc ta bramka NIGDY nie jest
  // spełniona zapasem puli państwa (empireLabelSatisfied), tylko realnym aktywnym dostępem.
  // PYTANIE 77=A (Maciej 2026-07-25): dostęp = własna Kopalnia złota ALBO aktywny szlak
  // handlowy z cywilizacją, która ma złoto (jak koń) — bramka TU jest bez zmian (nadal
  // sam sprawdza tylko obecność etykiety 'Złoto' w `activeLabels`); rozszerzenie jest
  // WYŻEJ w łańcuchu, w zloto-access.ts (placedImprovementsWithZlotoTradeGrant), WPIĘTE
  // w main.ts (placedImprovementsWithTradeGrants, domknięcie 2026-07-25 wieczór) —
  // szlak handlowy realnie odblokowuje Mennicę bez własnej Kopalni złota.
  mennica: ['Złoto'],
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
 * Surowce „tylko dostęp" — bramka NIE spełnia się samym zapasem w puli państwa (Maciej 2026-07-26).
 * Wymagają aktywnego źródła w imperium (np. warzelnia soli, kopalnia złota / handel).
 * Ilościowy koszt budowy (`koszt_surowce`) to osobna ścieżka — magazyn państwa.
 */
export const ACCESS_ONLY_RESOURCE_LABELS: ReadonlySet<string> = new Set(['Sól', 'Złoto']);

export function isAccessOnlyResourceLabel(label: string): boolean {
  return ACCESS_ONLY_RESOURCE_LABELS.has(label);
}

/**
 * Bramka spełniona etykietą, gdy: aktywne ŹRÓDŁO surowca w imperium (activeLabels), LUB
 * budynek-konwerter (Cegielnia/Garncarnia), LUB — dla surowców magazynowanych — zapas puli
 * państwa (`empireStock` > 0). Wyjątki ACCESS_ONLY (Sól, Złoto): tylko aktywne źródło.
 * Dokładną ILOŚĆ kosztu budowy egzekwuje osobno `koszt_surowce` (civ-wide magazyn).
 */
/** Czy pojedyncza etykieta surowca jest spełniona (źródło / konwerter / zapas państwa). */
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

export function buildingResourceGateMet(
  building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec?: string | null },
  activeLabels: readonly string[] | undefined,
  empireBuiltIds?: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
): boolean {
  const required = buildingRequiredActiveLabels(building);
  if (required.length === 0) return true;
  const active = activeLabels ?? [];
  return required.every(label => empireLabelSatisfied(label, active, empireBuiltIds, empireStock));
}

/** Id budynków z bramką runtime zależną od złoża/dostępu (PYTANIE-84). */
export const DEPOSIT_RUNTIME_GATED_BUILDING_IDS: readonly string[] = Object.freeze(
  Object.keys(DEPOSIT_LINKED_BUILDING_LABELS),
);

export function hasDepositRuntimeGate(buildingId: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPOSIT_LINKED_BUILDING_LABELS, buildingId);
}

export interface BuildingRuntimeGateOptions {
  /** Właściciel imperium — wymagany dla specjalnej bramki Mennicy (PYTANIE 77/83). */
  ownerId?: number;
  /** Dostęp do złota (natywna kopalnia LUB szlak) — wspólne API z turn-economy/main.ts. */
  resolveOwnerZlotoAccess?: (ownerId: number) => boolean;
}

/**
 * PYTANIE-84 (Maciej 2026-07-27, hybryda): runtime gate per budynek z DEPOSIT_LINKED.
 *  - DOSTĘP (ACCESS_ONLY: Sól, Złoto): tylko aktywne źródło — natychmiastowe uśpienie.
 *  - MAGAZYN (pozostałe etykiety): aktywne źródło LUB zapas państwa > 0.
 *  - Mennica: Złoto przez resolveOwnerZlotoAccess (handel + kopalnia), nie sam zapas.
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

export function buildingRuntimeGateMet(
  building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec?: string | null },
  activeLabels: readonly string[] | undefined,
  runtimeActiveBuiltIds: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
  options?: BuildingRuntimeGateOptions,
): boolean {
  if (building.id === 'mennica' && options?.resolveOwnerZlotoAccess && options.ownerId !== undefined) {
    return options.resolveOwnerZlotoAccess(options.ownerId);
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
