/**
 * veteran.ts
 * TRZECI, NIEZALEŻNY system trwałych ulepszeń jednostek: doświadczenie bojowe
 * / weterani (decyzja właściciela Maciej, 2026-07-25, cytat pełny w zadaniu):
 *   "Jednostka, która wchodzi do walki ma statystyki tak jak w JSON-ach. Po
 *   pierwszej bitwie ma drugi poziom doświadczenia, po drugiej bitwie ma
 *   status weterana. Druga gwiazdka daje 10% do wszystkich statystyk oprócz
 *   armor. Trzecia gwiazdka weterana daje 20% do wszystkich statystyk poza
 *   armor."
 *
 * MODEL (3 poziomy etykiet + 3 gwiazdki, SUFIT na 3 wygranych -- "nie projektujemy na zapas"):
 *   Rekrut       -- 0 wygranych bitew -- 0 gwiazdek -- 0% premii (baza z units.json 1:1)
 *   Doświadczony -- 1–2 wygrane       -- ★ / ★★     -- etykieta wspólna; premia wg gwiazdek
 *   Weteran      -- 3 wygrane         -- ★★★         -- +20% / -20% (nie +30%, NIE się kumuluje)
 *
 * PREMIA WG GWIAZDEK (Maciej 2026-07-29): ★ +10% · ★★ +15% · ★★★ +20% (pancerz bez zmian;
 * progi dezercji/ucieczki w dół proporcjonalnie −10/−15/−20).
 *
 * GWIAZDKI tylko za WYGRANE (Maciej 2026-07-29): przegrana / remis / udział bez zwycięstwa
 * nie podbija licznika. Pole RuntimeUnit.battlesSurvived przechowuje liczbę wygranych bitew
 * (nazwa pola historyczna — kompatybilność zapisu).
 *
 * PREMIE SIĘ NIE KUMULUJĄ MIĘDZY POZIOMAMI -- każdy poziom liczy się OD BAZY
 * z units.json, nigdy od wartości poprzedniego poziomu (poziom 3 = bazowa
 * wartość × 1,20, NIE bazowa×1,10 następnie ×1,20 czyli NIE ×1,32 i NIE +30%).
 *
 * DWA KIERUNKI PREMII (korekta właściciela 2026-07-25 wieczorem -- pierwotnie
 * miałem zostawić "Morale ucieczki"/"Próg dezercji" bez zmian jako pola
 * odwrócone do potwierdzenia; właściciel odpowiedział, że to WŁAŚNIE te dwa
 * pola są najważniejsze i MUSZĄ reagować, tylko w przeciwnym kierunku):
 *   W GÓRĘ  (wyższa wartość = lepiej dla jednostki)  -- meleeAttack, meleeDefence,
 *           weaponDamage, piercing, chargeBonus, health, missileAttack (warstwa
 *           bitewna, patrz applyVeteranFracToCombatUnit); Morale bazowe (warstwa
 *           mapy, battleScene.ts) -- mnożnik (1 + frac).
 *   W DÓŁ   (niższa wartość = lepiej dla jednostki -- pole ODWRÓCONE) -- Prog
 *           dezercji (% health) (warstwa bitewna, ten plik) i Morale ucieczki
 *           (warstwa mapy, battleScene.ts) -- mnożnik (1 - frac): doświadczony
 *           żołnierz łamie się i dezerteruje PÓŹNIEJ, nie wcześniej.
 *   BEZ ZMIAN NA ŻADNYM POZIOMIE -- armor / Pancerz (wyłączenie właściciela,
 *           jedyne pole całkowicie pominięte przez ten system).
 *
 * PARYTET AI: żadna funkcja tego pliku nie odwołuje się do ownerId -- ten sam
 * kod liczy premię i próg awansu dla gracza i dla AI identycznie.
 *
 * KOLEJNOŚĆ WZGLĘDEM DWÓCH ISTNIEJĄCYCH SYSTEMÓW (unit-building-bonuses.ts --
 * Ścieżka A Pancerz / Ścieżka B parametry miękkie): weteran jest scalany jako
 * OSOBNA, kolejna warstwa mnożona NA WYNIKU już policzonym z civ+building mods
 * (te dwa sa scalane addytywnie w jeden ułamek, patrz combat.ts). Ponieważ to
 * zwykłe mnożenie ułamków niezależnych czynników, kolejność zastosowania
 * (baza -> ×(1+civ+building) -> ×(1+weteran) vs baza -> ×(1+weteran) ->
 * ×(1+civ+building)) daje MATEMATYCZNIE IDENTYCZNY wynik końcowy -- weteran
 * jest więc wpięty w combat.ts::resolveCombat() na samym POCZĄTKU funkcji
 * (najprostszy, najmniej inwazyjny punkt), a civ/building mods (dalej w
 * funkcji) liczą się już na bazie przeskalowanej. Trzy systemy pozostają
 * ROZŁĄCZNE w danych (RuntimeUnit.battlesSurvived vs .pancerzBonusProc vs
 * .parametryBonusProc) -- żaden nie nadpisuje ani nie czyta stanu drugiego.
 */

export type VeteranLevel = 1 | 2 | 3;

/**
 * Sufit liczby ZAPISYWANYCH wygranych bitew -- ★★★ Weteran (+20%) po 3. wygranej;
 * dalsze zwycięstwa nic nie zmieniają (licznik nie rośnie w nieskończoność).
 */
export const VETERAN_MAX_BATTLES_TRACKED = 3;

/**
 * Ułamek premii wg liczby wygranych bitew (gwiazdek): 0 / +10% / +15% / +20%.
 * Klucz = veteranStarCount (0..3), NIE veteranLevel (etykieta Rekrut/Doświadczony/Weteran).
 */
export const VETERAN_BONUS_FRAC: Readonly<Record<0 | 1 | 2 | 3, number>> = {
  0: 0,
  1: 0.10,
  2: 0.15,
  3: 0.20,
};

/** Nazwa poziomu do UI (panel jednostki, roster bitwy). */
export const VETERAN_LEVEL_LABEL: Readonly<Record<VeteranLevel, string>> = {
  1: 'Rekrut',
  2: 'Doświadczony',
  3: 'Weteran',
};

// ---------------------------------------------------------------------------
// Stan trwały jednostki (podzbiór RuntimeUnit -- unikamy importu units/setup.ts,
// ten moduł zostaje pure/bez zależności na typy runtime, jak unit-building-bonuses.ts).
// ---------------------------------------------------------------------------

export interface VeteranProgress {
  battlesSurvived?: number;
}

/** Odczyt z defaultem 0 -- stare zapisy bez pola / NaN / ujemne / niecałkowite = 0 wygranych. */
export function veteranBattlesWon(unit: VeteranProgress | null | undefined): number {
  const v = unit?.battlesSurvived;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

/** @deprecated alias — pole `battlesSurvived` = liczba wygranych (nazwa historyczna). */
export function veteranBattlesSurvived(unit: VeteranProgress | null | undefined): number {
  return veteranBattlesWon(unit);
}

/** Próg premii: 0 wygranych -> poziom 1, 1–2 wygrane -> poziom 2, 3+ wygranych -> poziom 3. */
export function veteranLevelFromBattles(battlesWon: number): VeteranLevel {
  if (battlesWon >= 3) return 3;
  if (battlesWon >= 1) return 2;
  return 1;
}

/** Poziom premii jednostki (1..3), z liczby wygranych bitew (pole battlesSurvived). */
export function veteranLevel(unit: VeteranProgress | null | undefined): VeteranLevel {
  return veteranLevelFromBattles(veteranBattlesWon(unit));
}

/** Liczba gwiazdek na mapie / w UI (0–3) = liczba wygranych bitew (sufit 3). */
export function veteranStarCount(unit: VeteranProgress | null | undefined): number {
  return Math.min(VETERAN_MAX_BATTLES_TRACKED, veteranBattlesWon(unit));
}

/** Ułamek premii dla liczby wygranych bitew / gwiazdek (0 / 0.10 / 0.15 / 0.20). */
export function veteranBonusFracForWins(wins: number): number {
  const w = Math.min(VETERAN_MAX_BATTLES_TRACKED, Math.max(0, Math.floor(wins)));
  return VETERAN_BONUS_FRAC[w as 0 | 1 | 2 | 3];
}

/**
 * Ułamek premii dla poziomu etykiety (legacy / testy bez kontekstu wygranych).
 * Poziom 2 bez liczby wygranych zakłada ★ (+10%) — pełna premia wymaga veteranBonusFracForWins.
 */
export function veteranBonusFracForLevel(level: VeteranLevel): number {
  if (level >= 3) return VETERAN_BONUS_FRAC[3];
  if (level >= 2) return VETERAN_BONUS_FRAC[1];
  return VETERAN_BONUS_FRAC[0];
}

/** Ułamek premii jednostki (od wygranych bitew) -- gotowy do przekazania combat.ts/BattleUnit. */
export function veteranCombatBonusFrac(unit: VeteranProgress | null | undefined): number {
  return veteranBonusFracForWins(veteranStarCount(unit));
}

/** Liczba gwiazdek dla poziomu premii (legacy w testach) — preferuj veteranStarCount(unit). */
export function veteranStars(level: VeteranLevel): number {
  if (level >= 3) return 3;
  if (level >= 2) return 2;
  return 0;
}

export function veteranLevelLabel(level: VeteranLevel): string {
  return VETERAN_LEVEL_LABEL[level];
}

/**
 * Etykieta do panelu jednostki / rosteru bitwy, np. "★★ Doświadczony +10%"
 * albo "★★★ Weteran +20%". Poziom 1 (Rekrut, 0% premii) zwraca PUSTY STRING --
 * "brak odznaki" na poziomie 1 to świadoma decyzja (patrz nagłówek modułu) --
 * odznaka pojawia się dopiero gdy jednostka faktycznie zdobyła doświadczenie.
 */
export function veteranBadgeLabel(unit: VeteranProgress | null | undefined): string;
export function veteranBadgeLabel(level: VeteranLevel, wins: number): string;
export function veteranBadgeLabel(
  unitOrLevel: VeteranProgress | VeteranLevel | null | undefined,
  winsArg?: number,
): string {
  const wins = typeof unitOrLevel === 'number'
    ? (winsArg ?? (unitOrLevel >= 3 ? 3 : unitOrLevel >= 2 ? 2 : 0))
    : veteranStarCount(unitOrLevel);
  if (wins < 1) return '';
  const level = typeof unitOrLevel === 'number'
    ? unitOrLevel
    : veteranLevel(unitOrLevel);
  const stars = '★'.repeat(wins);
  const pct = Math.round(veteranBonusFracForWins(wins) * 100);
  return stars + ' ' + veteranLevelLabel(level) + ' +' + pct + '%';
}

/** ≥1 wygrana — jednostka ma widoczne gwiazdki weterana (C-OBCE-JEDN-Q3). */
export function veteranHasVisibleBadge(unit: VeteranProgress | null | undefined): boolean;
export function veteranHasVisibleBadge(level: VeteranLevel): boolean;
export function veteranHasVisibleBadge(
  unitOrLevel: VeteranProgress | VeteranLevel | null | undefined,
): boolean {
  if (typeof unitOrLevel === 'number') return unitOrLevel >= 2;
  return veteranStarCount(unitOrLevel) >= 1;
}

/** Krótki tooltip przy najechaniu na ★ (własne i obce, mapa + panel). */
export function veteranStarsTooltipText(unit: VeteranProgress | null | undefined): string;
export function veteranStarsTooltipText(level: VeteranLevel): string;
export function veteranStarsTooltipText(
  unitOrLevel: VeteranProgress | VeteranLevel | null | undefined,
): string {
  const wins = typeof unitOrLevel === 'number'
    ? veteranStars(unitOrLevel)
    : veteranStarCount(unitOrLevel);
  if (wins < 1) return '';
  const level = typeof unitOrLevel === 'number'
    ? unitOrLevel
    : veteranLevel(unitOrLevel);
  const pct = Math.round(veteranBonusFracForWins(wins) * 100);
  return (
    'Doświadczenie bojowe: ' + veteranLevelLabel(level)
    + ' (+' + pct + '% do ataku, obrony i HP; pancerz bez zmian). '
    + 'Gwiazdki rosną tylko po wygranych bitwach — maks. ★★★ Weteran (+20%).'
  );
}

/** Jedna linia do karty jednostki (własnej i obcej — C-OBCE-JEDN-Q1/Q3). */
export function veteranExperienceLine(unit: VeteranProgress | null | undefined): string {
  const wins = veteranBattlesWon(unit);
  const level = veteranLevel(unit);
  if (wins < 1) {
    return 'Doświadczenie bojowe: Rekrut (0 wygranych bitew — brak premii)';
  }
  const winLabel = wins === 1 ? '1 wygrana' : wins + ' wygrane';
  const pct = Math.round(veteranBonusFracForWins(wins) * 100);
  return (
    'Doświadczenie bojowe: ' + veteranLevelLabel(level)
    + ' (' + winLabel + ', +' + pct + '% do walki)'
  );
}

/** Pełniejsze wyjaśnienie do panelu obcej jednostki (C-OBCE-JEDN-Q3 B). */
export function veteranPanelExplanation(unit: VeteranProgress | null | undefined): string;
export function veteranPanelExplanation(level: VeteranLevel): string;
export function veteranPanelExplanation(
  unitOrLevel: VeteranProgress | VeteranLevel | null | undefined,
): string {
  const wins = typeof unitOrLevel === 'number'
    ? veteranStars(unitOrLevel)
    : veteranStarCount(unitOrLevel);
  if (wins < 1) {
    return 'Jednostka nie ma jeszcze doświadczenia bojowego — statystyki jak w karcie typu.';
  }
  const level = typeof unitOrLevel === 'number'
    ? unitOrLevel
    : veteranLevel(unitOrLevel);
  const pct = Math.round(veteranBonusFracForWins(wins) * 100);
  return (
    'Gwiazdki oznaczają wygrane bitwy (przegrane nie liczą się). '
    + veteranLevelLabel(level) + ' daje +' + pct + '% do ataku, obrony, obrażeń i HP. '
    + 'Pancerz pozostaje bez zmian. Doświadczony żołnierz rzadziej dezerteruje.'
  );
}

/** Toast + dziennik przy pierwszym wrogu z ★≥2 (C-OBCE-JEDN-Q3 A). */
export function veteranFirstEncounterHintHtml(): string {
  return (
    '<b>★ Doświadczeni wojownicy</b> — wroga jednostka ma gwiazdki: '
    + 'wygrała bitwy i bije mocniej niż rekrut. Najedź na ★ po szczegóły.'
  );
}

/** Podtytuł wpisu w panelu WYDARZENIA (pierwsze spotkanie weterana wroga). */
export function veteranFirstEncounterJournalSubtitle(): string {
  return (
    'Wrogie ★/★★/★★★ — premia do walki po wygranych bitwach. '
    + 'Kliknij obcą jednostkę po pełną kartę.'
  );
}

/**
 * Pola edukacji weterana do karty/tooltipu jednostki (C-OBCE-JEDN-Q3 B).
 * Zwraca null na poziomie 1 (brak odznaki). Q1 wpinia w buildForeignUnitPanel.
 */
export function veteranUnitEducationFields(
  unit: VeteranProgress | null | undefined,
): {
  veteranBadgeLabel: string;
  veteranStarsTooltip: string;
  veteranPanelExplanation: string;
  veteranExperienceLine: string;
} | null {
  const badge = veteranBadgeLabel(unit);
  if (!badge) return null;
  return {
    veteranBadgeLabel: badge,
    veteranStarsTooltip: veteranStarsTooltipText(unit),
    veteranPanelExplanation: veteranPanelExplanation(unit),
    veteranExperienceLine: veteranExperienceLine(unit),
  };
}

/**
 * Nowa wartość licznika wygranych po jednej WYGRANEJ bitwie (sufit
 * VETERAN_MAX_BATTLES_TRACKED). Wołający (post-battle-map.ts) woła to
 * DOKŁADNIE RAZ na żywą jednostkę ze zwycięskiej strony — przegrani i remis
 * nie podbijają licznika.
 */
export function registerBattleWon(unit: VeteranProgress | null | undefined): number {
  const cur = veteranBattlesWon(unit);
  return Math.min(VETERAN_MAX_BATTLES_TRACKED, cur + 1);
}

/** @deprecated użyj registerBattleWon */
export function registerBattleSurvived(unit: VeteranProgress | null | undefined): number {
  return registerBattleWon(unit);
}

// ---------------------------------------------------------------------------
// Skalowanie statystyk WARSTWY BITEWNEJ (CombatUnit -- game/combat.ts) wg
// ułamka premii. Generyczne przez strukturalne dopasowanie (T extends ...),
// żeby nie tworzyć zależności cyklicznej na combat.ts (ten moduł jest
// importowany PRZEZ combat.ts, nie odwrotnie).
// ---------------------------------------------------------------------------

export interface VeteranScalableCombatStats {
  meleeAttack: number;
  meleeDefence: number;
  weaponDamage: number;
  piercing: number;
  chargeBonus: number;
  health: number;
  missileAttack: number;
  /** Odwrócone pole -- niżej = trudniej zdezerterować. Skalowane W DÓŁ. */
  'Prog dezercji (% health)': number | null;
  /** Pancerz -- NIGDY nie skalowany (wyłączenie właściciela). Pozostawiony
   *  tu tylko po to, żeby T (CombatUnit) strukturalnie pasował -- pole nie
   *  jest w ogóle dotykane przez funkcję poniżej. */
  armor: number;
}

/**
 * Minimalna precyzja dla "Prog dezercji (% health)" (ułamek 0..1) po
 * przeskalowaniu -- 4 miejsca po przecinku, żeby uniknąć szumu zmiennoprz.
 * (0.4 * 0.9 w IEEE754 to 0.36000000000000004, nie 0.36) bez gubienia efektu
 * na małych bazowych wartościach (najniższa w units.json to 0.1 -> 0.09/0.08,
 * nadal reprezentowalne z zapasem przy 4 miejscach).
 */
function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

/**
 * Zaokragla do 6 miejsc PRZED Math.ceil/Math.floor w funkcjach ponizej --
 * czysta ochrona przed szumem zmiennoprzecinkowym (np. 50*1.10 w IEEE754 to
 * 55.00000000000001, a Math.ceil() na tym da 56 zamiast oczekiwanego 55).
 * 6 miejsc to duzo wiecej precyzji niz jakikolwiek realny wynik w danych
 * gry wymaga, wiec nie gubi zadnego zamierzonego efektu.
 */
function round6(x: number): number {
  return Math.round(x * 1e6) / 1e6;
}

/**
 * Przeskalowuje statystyki bojowe jednostki wg ułamka premii weterana.
 * `frac` = 0 -> zwraca WEJŚCIOWY obiekt BEZ ZMIAN (poziom 1 -- twardy
 * wymóg "statystyki dokładnie jak w units.json, zero modyfikacji", bez
 * ryzyka szumu zmiennoprzecinkowego z mnożenia przez 1.0).
 *
 * Pola W GÓRĘ (×(1+frac)): meleeAttack, meleeDefence, weaponDamage, piercing,
 *   chargeBonus, health, missileAttack.
 * Pole W DÓŁ (×(1-frac), zaokrąglone do 4 miejsc): 'Prog dezercji (% health)'
 *   (null/undefined -- np. jednostki "walczą do śmierci" -- pozostaje bez zmian).
 * Pole BEZ ZMIAN: armor (i wszystkie pozostałe pola T nie wymienione tutaj,
 *   np. 'Kara obrony z flanki (%)', 'Ilosc pociskow', rola, counterTyp...
 *   -- spread zachowuje je 1:1).
 */
export function applyVeteranFracToCombatUnit<T extends VeteranScalableCombatStats>(
  cu: T,
  frac: number,
): T {
  if (!frac) return cu;
  const up = 1 + frac;
  const progRaw = cu['Prog dezercji (% health)'];
  const progScaled = progRaw === null || progRaw === undefined
    ? progRaw
    : round4(progRaw * (1 - frac));
  return {
    ...cu,
    meleeAttack: cu.meleeAttack * up,
    meleeDefence: cu.meleeDefence * up,
    weaponDamage: cu.weaponDamage * up,
    piercing: cu.piercing * up,
    chargeBonus: cu.chargeBonus * up,
    health: cu.health * up,
    missileAttack: cu.missileAttack * up,
    'Prog dezercji (% health)': progScaled,
  };
}

// ---------------------------------------------------------------------------
// Skalowanie pól WARSTWY MAPY używanych WYŁĄCZNIE przez system morale
// animowanej bitwy 3D (battle/battleScene.ts moraleBaseFor/fleeMoraleFor) --
// "Morale bazowe" (w górę) i "Morale ucieczki" (w dół). Te pola są liczbami
// CAŁKOWITYMI porównywanymi bezpośrednio jako progi w symulacji morale (co
// innego niż CombatUnit powyżej, gdzie wartości zostają floatami aż do
// końcowego Math.round HP) -- Math.ceil/Math.floor gwarantują WIDOCZNY efekt
// nawet dla najmniejszych wartości w danych (np. Berserker germański,
// Morale ucieczki=5 -- patrz PYTANIA-OTWARTE / raport), bo zwykłe
// zaokrąglenie do najbliższej liczby całkowitej (Math.round) potrafi
// wylądować z powrotem na wartości bazowej dla x.5 (5*0.9=4.5 -> round=5,
// czyli ZERO efektu -- niedopuszczalne, właściciel prosił wyraźnie o
// zabezpieczenie przed takim gubieniem efektu).
// ---------------------------------------------------------------------------

/** Minimalna sensowna podłoga dla "Morale ucieczki" po przeskalowaniu w dół -- zabezpieczenie, nie powinna nigdy zadziałać przy realnych danych (patrz raport: najniższa wartość w units.json to 5, ×0.80=4). */
export const VETERAN_MORALE_UCIECZKI_FLOOR = 1;

/** Minimalna sensowna podłoga dla "Prog dezercji (% health)" po przeskalowaniu w dół -- jw., najniższa wartość w danych to 0.1, ×0.80=0.08. */
export const VETERAN_PROG_DEZERCJI_FLOOR = 0.02;

/** "Morale bazowe" -- W GÓRĘ, Math.ceil gwarantuje wzrost o min. 1 gdy frac>0. */
export function veteranMoraleBazoweUp(base: number, frac: number): number {
  if (!frac || !Number.isFinite(base)) return base;
  return Math.ceil(round6(base * (1 + frac)));
}

/** "Morale ucieczki" -- W DÓŁ, Math.floor gwarantuje spadek o min. 1 gdy frac>0, z podłogą bezpieczeństwa. */
export function veteranMoraleUcieczkiDown(base: number, frac: number): number {
  if (!frac || !Number.isFinite(base)) return base;
  return Math.max(VETERAN_MORALE_UCIECZKI_FLOOR, Math.floor(round6(base * (1 - frac))));
}

/** "Prog dezercji (% health)" w kontekście warstwy mapy/UI (jw. combat.ts, ale z podłogą + wspólnym zaokrągleniem). */
export function veteranProgDezercjiDown(base: number, frac: number): number {
  if (!frac || !Number.isFinite(base)) return base;
  return Math.max(VETERAN_PROG_DEZERCJI_FLOOR, round4(base * (1 - frac)));
}
