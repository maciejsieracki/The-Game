/**
 * R-WEB-SIEGE-BADGE-TURNS-TO-SURRENDER-Q1 -- prognoza „za ile tur miasto się podda" dla plakietki oblężenia.
 *
 * Czysty moduł (bez DOM/THREE/stanu globalnego). Logika kapitulacji NIE jest tu zmieniana --
 * funkcja tylko ODWZOROWUJE istniejący mechanizm:
 *   1. tick ekonomii tury (turn-economy.ts, gałąź `oblegane`): magazyn -= (ludność + garnizon), podłoga 0;
 *      `obleganyGlod = magazyn <= 0`.
 *   2. `handleSiegeCapitulationPhase` (main.ts), w TYM SAMYM końcu tury, po ticku ekonomii:
 *        - `siegeCapitulationPending` już ustawione -> `resolveSiegeSurrender` (miasto przejęte),
 *        - inaczej, gdy magazyn <= 0 -> ustaw `siegeCapitulationPending` (alert „kapitulacja za 1 turę").
 *
 * Wynik = liczba KOŃCÓW TUR (przetworzeń tury), po których miasto zostaje przejęte:
 *   - pending już ustawione        -> 1  (przejęcie przy najbliższym końcu tury),
 *   - magazyn M>0, zużycie Z>0     -> ceil(M/Z) + 1  (ceil(M/Z) ticków do wyzerowania + 1 tick przejęcia),
 *   - magazyn 0 (pending jeszcze nie) -> 2  (tick ustawia pending, kolejny przejmuje),
 *   - zużycie <= 0 przy M>0        -> null (zapasy nie maleją -- miasto nie podda się z głodu).
 * Założenie: ludność i garnizon stałe (atrycja garnizonu / odsiecz / zdjęcie oblężenia mogą to zmienić --
 * plakietka jest odświeżana co turę i po każdej zmianie stanu oblężenia).
 */

/** Minimalny kształt miasta potrzebny do prognozy. */
export interface SiegeForecastCity {
  population: number;
  garnizon?: number;
  oblegane?: boolean;
  siegeCapitulationPending?: boolean;
  /** Bufor żywności (jak `City.magazynZywnosci`, skalar >= 0). */
  magazynZywnosci?: number;
}

export interface SiegeForecastCtx {
  /** Nadpisanie zapasów (np. z `getCityFood`); domyślnie `city.magazynZywnosci`. */
  food?: number;
}

/** Zużycie zapasów oblężonego miasta na turę -- identyczne ze wzorem w turn-economy.ts. */
export function siegeConsumptionPerTurn(city: Pick<SiegeForecastCity, 'population' | 'garnizon'>): number {
  const garnizon = city.garnizon != null && city.garnizon > 0 ? city.garnizon : 0;
  return city.population + garnizon;
}

/**
 * Liczba tur do poddania się miasta albo `null` (brak prognozy: miasto nie jest oblężone
 * albo zapasy nie maleją).
 */
export function turnsUntilSiegeSurrender(
  city: SiegeForecastCity,
  ctx: SiegeForecastCtx = {},
): number | null {
  if (city.oblegane !== true) return null;
  if (city.siegeCapitulationPending === true) return 1;
  const raw = ctx.food ?? city.magazynZywnosci ?? 0;
  const food = Number.isFinite(raw) && raw > 0 ? raw : 0;
  if (food <= 0) return 2;
  const cons = siegeConsumptionPerTurn(city);
  if (!(cons > 0)) return null;
  return Math.ceil(food / cons) + 1;
}

/** Odmiana PL: 1 tura, 2-4 tury, 5+ tur (12-14 -> tur). */
export function pluralTurPl(n: number): string {
  if (n === 1) return 'tura';
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'tury';
  return 'tur';
}

/** Przypadek „za N tur": 1 -> „turę", 2-4 -> „tury", 5+ -> „tur". */
export function turnsAccusativePl(n: number): string {
  if (n === 1) return 'turę';
  return pluralTurPl(n);
}

/** Tekst do plakietki: „poddanie za 3 tury" albo „poddanie: —" (zapasy nie maleją). */
export function siegeSurrenderBadgeText(turns: number | null): string {
  if (turns === null) return 'poddanie: —';
  return 'poddanie za ' + turns + ' ' + turnsAccusativePl(turns);
}

/** Tooltip wyjaśniający liczbę. */
export function siegeSurrenderTooltip(turns: number | null, food: number, cons: number): string {
  if (turns === null) {
    return 'Zapasy miasta nie maleją — oblężenie nie prowadzi (na razie) do poddania się.';
  }
  return 'Miasto podda się za ' + turns + ' ' + turnsAccusativePl(turns) +
    ' (zapasy ' + Math.max(0, Math.floor(food)) + ', zużycie ' + cons + '/turę; ' +
    'po wyczerpaniu zapasów kapitulacja następuje w kolejnej turze).';
}
