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
 * Budynki wymagające aktywnego dostępu do etykiety surowca w IMPERIUM (źródło terenowe
 * w zasięgu jakiegokolwiek miasta LUB zapas puli państwa) — patrz `empireLabelSatisfied`.
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
 */
export const CITY_BUILDING_PREREQ: Readonly<Record<string, string | readonly string[]>> = {
  warsztat_oblezniczy: ['koszary', 'akademia_wojskowa'],
  laznia_publiczna: 'studnia',
  akademia: 'biblioteka',
  fort: 'mury',
  akademia_wojskowa: 'koszary',
  swiatynia: 'kamienne_kregi',
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
 * Bramka spełniona etykietą, gdy: aktywne ŹRÓDŁO surowca (activeLabels), LUB budynek-konwerter
 * (Cegielnia/Garncarnia), LUB — Maciej 2026-07-24 — surowiec jest w ZAPASIE puli państwa
 * (`empireStock` > 0). Poprawka realnego buga: gracz miał 8 drewna w puli (i las/Tartak w zasięgu),
 * a bramka „dostępu" i tak blokowała Pałac, bo sprawdzała tylko aktywne źródło. Dokładną ILOŚĆ
 * i tak egzekwuje osobno `koszt_surowce` przy kliknięciu „Buduj".
 */
function empireLabelSatisfied(
  label: string,
  activeLabels: readonly string[],
  empireBuiltIds: readonly string[] | undefined,
  empireStock: Readonly<Record<string, number>> | undefined,
): boolean {
  if (activeLabels.includes(label)) return true;
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
