/**
 * R-WEB-SIEGE-BADGE-TURNS-TO-SURRENDER-Q1 + R-WEB-SIEGE-STARVATION-SURRENDER-Q1 -- prognoza
 * „za ile tur miasto się podda" dla plakietki oblężenia.
 *
 * Czysty moduł (bez DOM/THREE/stanu globalnego). Funkcja ODWZOROWUJE mechanizm (nie zmienia go):
 *   1. tick ekonomii tury (turn-economy.ts, gałąź `oblegane`): magazyn -= (ludność + garnizon), podłoga 0.
 *   2. blok N3 (main.ts) + siege-starvation.ts: tick, w którym magazyn spada do 0, ROZPOCZYNA głód
 *      (zapis startowego maxHP, bez atrycji); każdy KOLEJNY tick każda jednostka garnizonu traci
 *      `hpFrac` maxHP (`max(1, floor(maxHP*hpFrac))`); miasto poddaje się w ticku, w którym
 *      sumaHP / startoweMaxHP < 0,5 (albo garnizon jest pusty).
 *   3. miasto BEZ garnizonu: ścieżka historyczna -- tick zera zapasów ustawia flagę, następny przejmuje.
 *
 * Wynik = liczba KOŃCÓW TUR (przetworzeń tury), po których miasto zostaje przejęte:
 *   - `siegeCapitulationPending` ustawione      -> 1,
 *   - z garnizonem: T0 + n, gdzie T0 = ticki do startu głodu (zapasy M>0: ceil(M/Z); M=0 bez zapisanego
 *     startu: 1; start już zapisany: 0), n = ticki atrycji do HP < 50%:
 *       model ułamkowy (brak listy jednostek): n = floor(0,5/hpFrac) + 1,
 *       lista jednostek (`ctx.garrison`): dokładna symulacja per jednostka (tak jak `applyArmyStarvationHpLoss`),
 *   - bez garnizonu: M>0 -> ceil(M/Z) + 1; M=0 -> 2,
 *   - zużycie <= 0 przy M>0 -> null (zapasy nie maleją -- brak poddania z głodu).
 * Założenie: ludność i garnizon stałe (odsiecz / zdjęcie oblężenia mogą to zmienić --
 * plakietka jest odświeżana co turę i po każdej zmianie stanu oblężenia).
 */

import { SIEGE_SURRENDER_BELOW_FRAC } from './siege-starvation';

/** Minimalny kształt miasta potrzebny do prognozy. */
export interface SiegeForecastCity {
  population: number;
  garnizon?: number;
  oblegane?: boolean;
  siegeCapitulationPending?: boolean;
  /** Bufor żywności (jak `City.magazynZywnosci`, skalar >= 0). */
  magazynZywnosci?: number;
  /** Startowe maxHP garnizonu zapisane przy rozpoczęciu głodu (siege-starvation.ts). */
  siegeStarveStartMaxHp?: number;
}

export interface SiegeForecastGarrisonUnit {
  /** Aktualne HP (brak = pełne). */
  hp?: number;
  /** maxHP (rozwiązane przez wołającego). */
  hpMax: number;
}

export interface SiegeForecastCtx {
  /** Nadpisanie zapasów (np. z `getCityFood`); domyślnie `city.magazynZywnosci`. */
  food?: number;
  /** Ułamek maxHP tracony przez jednostkę garnizonu na turę głodu (glodWojskaHpFrac); domyślnie 0,08. */
  hpFrac?: number;
  /** Realne jednostki garnizonu (dokładna symulacja); brak = model ułamkowy dla `city.garnizon`. */
  garrison?: SiegeForecastGarrisonUnit[];
}

export const DEFAULT_SIEGE_HUNGER_HP_FRAC = 0.08;

/** Ticki atrycji głodu do kapitulacji w modelu ułamkowym (stały garnizon, pełne HP): floor(0,5/frac)+1. */
export function hungerTicksFractional(hpFrac: number): number | null {
  if (!(hpFrac > 0)) return null;
  return Math.floor(SIEGE_SURRENDER_BELOW_FRAC / hpFrac + 1e-9) + 1;
}

/** Dokładna symulacja ticków atrycji (jak applyArmyStarvationHpLoss + warunek HP/start < 0,5 albo pusty garnizon). */
export function hungerTicksSimulated(
  garrison: SiegeForecastGarrisonUnit[],
  hpFrac: number,
  startMaxHp?: number,
): number | null {
  if (!(hpFrac > 0)) return null;
  const alive = garrison.filter(u => u.hpMax > 0).map(u => ({ max: u.hpMax, hp: u.hp ?? u.hpMax }));
  if (alive.length === 0) return 0;
  const start = startMaxHp != null && startMaxHp > 0 ? startMaxHp : alive.reduce((s, u) => s + u.max, 0);
  for (let k = 1; k <= 1000; k++) {
    let hp = 0;
    let count = 0;
    for (const u of alive) {
      if (u.hp <= 0) continue;
      u.hp = Math.max(0, u.hp - Math.max(1, Math.floor(u.max * hpFrac)));
      if (u.hp > 0) { count++; hp += u.hp; }
    }
    if (count === 0 || hp / start < SIEGE_SURRENDER_BELOW_FRAC) return k;
  }
  return null;
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
  const cons = siegeConsumptionPerTurn(city);
  const garrisonCount = ctx.garrison != null
    ? ctx.garrison.filter(u => u.hpMax > 0).length
    : (city.garnizon != null && city.garnizon > 0 ? city.garnizon : 0);
  const startRecorded = typeof city.siegeStarveStartMaxHp === 'number' && city.siegeStarveStartMaxHp > 0;

  if (garrisonCount <= 0 && !startRecorded) {
    // Miasto bez garnizonu: ścieżka historyczna (flaga + następny tick).
    if (food <= 0) return 2;
    if (!(cons > 0)) return null;
    return Math.ceil(food / cons) + 1;
  }
  let toStart: number;
  if (food > 0) {
    if (!(cons > 0)) return null;
    toStart = Math.ceil(food / cons);
  } else {
    toStart = startRecorded ? 0 : 1;
  }
  const hpFrac = ctx.hpFrac ?? DEFAULT_SIEGE_HUNGER_HP_FRAC;
  const n = ctx.garrison != null
    ? hungerTicksSimulated(ctx.garrison, hpFrac, startRecorded && food <= 0 ? city.siegeStarveStartMaxHp : undefined)
    : hungerTicksFractional(hpFrac);
  if (n === null) return null;
  return Math.max(1, toStart + n);
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

/** Tooltip wyjaśniający liczbę. `hunger` = zapasy wyczerpane, garnizon traci HP z głodu. */
export function siegeSurrenderTooltip(turns: number | null, food: number, cons: number, hunger = false): string {
  if (turns === null) {
    return 'Zapasy miasta nie maleją — oblężenie nie prowadzi (na razie) do poddania się.';
  }
  if (hunger) {
    return 'Głód garnizonu: zapasy wyczerpane, jednostki tracą HP co turę. Miasto podda się za ' + turns + ' ' +
      turnsAccusativePl(turns) + ' (gdy garnizon straci ponad 50% zdrowia).';
  }
  return 'Miasto podda się za ' + turns + ' ' + turnsAccusativePl(turns) +
    ' (zapasy ' + Math.max(0, Math.floor(food)) + ', zużycie ' + cons + '/turę; ' +
    'po wyczerpaniu zapasów garnizon głoduje, a miasto poddaje się, gdy straci ponad 50% zdrowia).';
}
