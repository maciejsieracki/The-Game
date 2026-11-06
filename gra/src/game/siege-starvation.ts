/**
 * R-WEB-SIEGE-STARVATION-SURRENDER-Q1 -- oblezenie w dwoch etapach: zapasy, potem glod garnizonu.
 *
 * Czysty modul (bez DOM/THREE/stanu globalnego). Decyzja wlasciciela 2026-11-05:
 *   Etap 1 (zapasy): magazyn miasta maleje o (ludnosc + garnizon)/ture (turn-economy.ts, galaz `oblegane`);
 *     garnizon NIE traci HP z glodu. Tick, w ktorym magazyn spada do 0, ROZPOCZYNA glod:
 *     zapisuje `city.siegeStarveStartMaxHp` (suma maxHP garnizonu w tej chwili), bez atrycji w tym ticku.
 *   Etap 2 (glod): w kazdym kolejnym ticku KAZDA jednostka garnizonu traci `glodWojskaHpFrac` maxHP
 *     (6/8/10%, `applyArmyStarvationHpLoss`).
 *   KAPITULACJA: gdy sumaHP / siegeStarveStartMaxHp < 0,5 ("wiecej niz 50% health stracone";
 *     remis 50,0% = miasto jeszcze sie trzyma) ALBO gdy garnizon (po starcie glodu) jest pusty.
 *   Miasto BEZ garnizonu (zero realnych jednostek, brak zapisanego startu): sciezka historyczna --
 *     tick z zapasami 0 ustawia `siegeCapitulationPending`, nastepny tick przejmuje miasto.
 *   Stary zapis z `siegeCapitulationPending=true`: poddanie w nastepnym ticku (kompatybilnie).
 *   Stary zapis z zapasami 0 i bez pola startu: pierwszy tick tylko zapisuje start (HP liczone "jak sa").
 */

export interface SiegeGarrisonUnit {
  hp?: number;
  hpMax?: number;
  typeId?: string;
}

export interface SiegeStarvationCity {
  oblegane?: boolean;
  siegeCapitulationPending?: boolean;
  /** Suma maxHP garnizonu w chwili rozpoczecia glodu (opcjonalne; brak = glod jeszcze nie rozpoczety). */
  siegeStarveStartMaxHp?: number;
}

export interface SiegeStarvationParams {
  /** Zapasy miasta PO ticku ekonomii (magazyn). */
  food: number;
  /** maxHP po typie jednostki (gdy `hpMax` nieustawione). */
  getMaxHp: (typeId: string) => number;
  /** Prog kapitulacji jako ulamek startowego maxHP (domyslnie 0,5). */
  surrenderBelowFrac?: number;
}

export interface SiegeStarvationState {
  /** Zapasy = 0 (etap 2 rozpoczety albo zaczyna sie w tym ticku). */
  hungerStarted: boolean;
  /** Tick ma zapisac `siegeStarveStartMaxHp` (= startMaxHp) i NIE stosowac jeszcze atrycji. */
  recordStart: boolean;
  /** Tick ma zastosowac atrycje HP glodu (etap 2 w toku). */
  applyAttrition: boolean;
  /** Miasto bez garnizonu przy zapasach 0: ustaw flage `siegeCapitulationPending` (przejecie w nast. ticku). */
  setLegacyPending: boolean;
  /** sumaHP / startMaxHp (null gdy glod nie rozpoczety albo brak garnizonu). */
  hpFraction: number | null;
  /** Suma maxHP do zapisania (gdy recordStart) albo aktualny start. */
  startMaxHp: number | null;
  /** Miasto ma sie poddac w tym ticku. */
  surrender: boolean;
}

export const SIEGE_SURRENDER_BELOW_FRAC = 0.5;

function unitMax(u: SiegeGarrisonUnit, getMaxHp: (typeId: string) => number): number {
  const m = u.hpMax ?? (u.typeId != null ? getMaxHp(u.typeId) : 0);
  return Number.isFinite(m) && m > 0 ? m : 0;
}

function unitHp(u: SiegeGarrisonUnit, max: number): number {
  const h = u.hp ?? max;
  return Number.isFinite(h) && h > 0 ? Math.min(h, max > 0 ? max : h) : 0;
}

/** Suma maxHP i HP jednostek garnizonu (tylko jednostki z maxHP > 0; cywilow filtruje wolajacy). */
export function garrisonHpTotals(
  units: SiegeGarrisonUnit[],
  getMaxHp: (typeId: string) => number,
): { hp: number; maxHp: number; count: number } {
  let hp = 0;
  let maxHp = 0;
  let count = 0;
  for (const u of units) {
    const m = unitMax(u, getMaxHp);
    if (m <= 0) continue;
    count++;
    maxHp += m;
    hp += unitHp(u, m);
  }
  return { hp, maxHp, count };
}

/**
 * Czysta decyzja o stanie oblezenia po ticku ekonomii. Wolac PRZED atrycja (decyzja o jej zastosowaniu)
 * i PONOWNIE po atrycji (decyzja o kapitulacji).
 */
export function siegeStarvationState(
  city: SiegeStarvationCity,
  garnizonUnits: SiegeGarrisonUnit[],
  params: SiegeStarvationParams,
): SiegeStarvationState {
  const none: SiegeStarvationState = {
    hungerStarted: false, recordStart: false, applyAttrition: false, setLegacyPending: false,
    hpFraction: null, startMaxHp: null, surrender: false,
  };
  if (city.oblegane !== true) return none;
  const frac = params.surrenderBelowFrac ?? SIEGE_SURRENDER_BELOW_FRAC;
  const food = Number.isFinite(params.food) ? params.food : 0;
  // Stary zapis / sciezka bez garnizonu: flaga ustawiona w poprzednim ticku -> przejecie teraz.
  if (city.siegeCapitulationPending === true) {
    return { ...none, hungerStarted: true, surrender: true };
  }
  if (food > 0) return none;

  const tot = garrisonHpTotals(garnizonUnits, params.getMaxHp);
  const stored = city.siegeStarveStartMaxHp;
  const hasStart = typeof stored === 'number' && stored > 0;

  if (!hasStart) {
    if (tot.count === 0) {
      // Bez garnizonu: sciezka historyczna (flaga + nastepny tick).
      return { ...none, hungerStarted: true, setLegacyPending: true };
    }
    // Pierwszy tick glodu: zapamietaj start, jeszcze bez atrycji.
    return {
      ...none, hungerStarted: true, recordStart: true,
      hpFraction: tot.maxHp > 0 ? tot.hp / tot.maxHp : null, startMaxHp: tot.maxHp,
    };
  }

  // Etap 2 w toku. Pusty garnizon (wszyscy zgineli/wyszli) = kapitulacja.
  const startMax = stored as number;
  const fraction = tot.hp / startMax;
  const surrender = tot.count === 0 || tot.hp / startMax < frac;
  return {
    ...none, hungerStarted: true, applyAttrition: true,
    hpFraction: fraction, startMaxHp: startMax, surrender,
  };
}
