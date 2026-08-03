/**
 * auto-manage.ts
 * Zadanie 9A -- "Zarzadca automatyczny": autoManageCity
 *
 * PURE LOGIC -- bez DOM, bez THREE, bez I/O, bez globalnego stanu.
 * Zwraca obiekt decyzji; wywolujacy (SILNIK/master) aplikuje wyniki.
 * Funkcja NIE trzyma stanu wlaczenia/wylaczenia -- flaga auto-zarzadcy
 * jest zewnetrzna (przekazana przez UI/silnik przez odpowiedni callback).
 */

import type { City, BudowaFocus } from './cities';
import {
  DEFAULT_BUDOWA_FOCUS,
  DEFAULT_BUDOWA_TRYB,
} from './cities';
import type { GameMap } from '../types/map';
import type { TerritoryNode } from '../map/territory';
import {
  assignWorkedTiles,
  cityRangeForPopulation,
  wagiForFocus,
  type OkolicaTile,
  type TileYield,
} from './okolica';
import {
  buildableProduction,
  frontItem,
  splitPraca,
  type CityProduction,
  type ProductionData,
  type ProductionItem,
  type AvailabilityContext,
} from './production';
import { buildingStockCost, canAffordBuildingStock } from './building-stock-cost';

// ---------------------------------------------------------------------------
// Auto-production heuristic
// ---------------------------------------------------------------------------
/**
 * Heurystyka auto-produkcji (priorytet malejacy) — profil Zrównoważone:
 *  1. Budynki kat. "Zywnosc"   -- wzrost populacji (baza rozbudowy)
 *  2. Budynki kat. "Produkcja" -- wiecej Pracy = szybsza dalsza budowa
 *  3. Budynki kat. "Nauka"     -- odblokowanie technologii
 *  4. Budynki kat. "Pieniadz"  -- handel i utrzymanie jednostek
 *  5. Budynki kat. "Wojsko" / "Produkcja+Wojsko" -- sila obrony
 *  6. Budynki kat. "Obrona"
 *  7. Budynki kat. "Kultura" / "Kultura/Administracja"
 *  8. Budynki kat. "Zdrowie"
 *  9. Pozostale budynki (kat. "Produkcja+Pieniadz" itp.)
 * 10. (zarezerwowane -- jednostki kupowane za Pieniadz, nie trafiaja do kolejki Pracy)
 *
 * W obrebie tej samej kategorii: tanszy budynek najpierw (mniejszy koszt).
 * Jesli nic nie jest dostepne, zwraca null (kolejka zostaje pusta).
 */

const KATEGORIA_PRIORYTET: Record<string, number> = {
  'Zywnosc':                1,
  'Produkcja':              2,
  'Nauka':                  3,
  'Pieniadz':               4,
  'Wojsko':                 5,
  'Produkcja+Wojsko':       5,
  'Obrona':                 6,
  'Kultura':                7,
  'Kultura/Administracja':  7,
  'Zdrowie':                8,
};

const PRIORYTET_DEFAULT_BUDYNEK = 9;
const PRIORYTET_JEDNOSTKA       = 10;

/** Mapowanie kategorii budynku → priorytet wg profilu auto-budowy miasta. */
export function prioritiesForBudowaFocus(focus: BudowaFocus): Record<string, number> {
  switch (focus) {
    case 'wzrost':
      return {
        'Zywnosc': 1,
        'Zdrowie': 2,
      };
    case 'wojsko':
      return {
        'Wojsko': 1,
        'Produkcja+Wojsko': 2,
        'Obrona': 3,
        'Zdrowie+Wojsko': 4,
      };
    case 'kultura':
      return {
        'Kultura': 1,
        'Kultura/Administracja': 2,
      };
    case 'prawo':
      return {
        'Administracja': 1,
        'Kultura/Administracja': 2,
      };
    case 'produkcja':
      return {
        'Produkcja': 1,
        'Produkcja+Wojsko': 2,
        'Produkcja+Pieniadz': 3,
      };
    case 'zrownowazone':
    default:
      return KATEGORIA_PRIORYTET;
  }
}

function priorityForItem(
  item: ProductionItem,
  buildings: ProductionData['buildings'],
  focus: BudowaFocus,
): number {
  if (item.kind === 'budynek') {
    const def = buildings.find(b => b.id === item.id);
    const kat = def?.kategoria ?? '';
    const map = prioritiesForBudowaFocus(focus);
    return map[kat] ?? PRIORYTET_DEFAULT_BUDYNEK;
  }
  return PRIORYTET_JEDNOSTKA;
}

/** Czy kategoria budynku pasuje do profilu auto-budowy. */
export function buildingMatchesFocus(kategoria: string, focus: BudowaFocus): boolean {
  if (focus === 'zrownowazone') return true;
  const map = prioritiesForBudowaFocus(focus);
  return kategoria in map;
}

function budowaPriorytetTypowFor(city: Readonly<City>): BudowaFocus[] {
  const list = city.budowaPriorytetTypow;
  if (list && list.length > 0) return [...list];
  return [city.budowaFocus ?? DEFAULT_BUDOWA_FOCUS];
}

function bestCandidateForFocus(
  candidates: ProductionItem[],
  data: ProductionData,
  focus: BudowaFocus,
): ProductionItem | null {
  const matching = candidates.filter(item => {
    if (item.kind !== 'budynek') return false;
    const def = data.buildings.find(b => b.id === item.id);
    const kat = def?.kategoria ?? '';
    return buildingMatchesFocus(kat, focus);
  });
  if (matching.length === 0) return null;

  const scored = matching.map(item => ({
    item,
    prio: priorityForItem(item, data.buildings, focus),
  }));
  scored.sort((a, b) => {
    if (a.prio !== b.prio) return a.prio - b.prio;
    if (a.item.koszt !== b.item.koszt) return a.item.koszt - b.item.koszt;
    return a.item.nazwa.localeCompare(b.item.nazwa);
  });
  return scored[0]?.item ?? null;
}

// ---------------------------------------------------------------------------
// Context required by autoManageCity
// ---------------------------------------------------------------------------

/**
 * Parametry wstrzykiwane przez wywolujacego -- all optional for graceful degradation.
 *
 *   yieldOf        : plony pola (q,r) -- potrzebne do przydzialu pol
 *   cityPraca      : laczna Praca miasta w tej turze (do splitPraca)
 *   udzialBudynki  : udzial Pracy idacy do kolejki budynkow (0-1, domysl 0.7)
 *   unlockedTechs  : zbadane technologie gracza (do filtrowania produkcji)
 *   ctx            : AvailabilityContext (epoka, poziom, id zbudowanych budynkow)
 *   isWorkable     : opcjonalny filtr pol (np. bez pol zajmowanych przez inne miasta)
 */
export interface AutoManageInput {
  yieldOf: (q: number, r: number) => TileYield;
  cityPraca?: number;
  udzialBudynki?: number;
  unlockedTechs?: readonly string[];
  ctx?: AvailabilityContext;
  isWorkable?: (q: number, r: number) => boolean;
  /** Węzły terytorium — filtr własności heksów (overlap → najbliższe miasto). */
  territoryNodes?: readonly TerritoryNode[];
  /**
   * SUROW-CIV-01 (Maciej 2026-07-24): pula surowcowa CAŁEGO PAŃSTWA ownera (suma
   * City.surowce po wszystkich miastach — game/building-stock-cost.ts ownerResourceStockAll),
   * NIE tylko lokalne City.surowce. Brak hooka → fallback na city.surowce (miasto,
   * zachowanie sprzed SUROW-CIV-01 — testowalność pickAutoBuildItem bez pełnego stanu gry).
   * OWNERID-AGNOSTIC: wywołujący (main.ts) liczy tę samą pulę identycznie dla gracza i AI.
   */
  ownerSurowcePool?: Record<string, number>;
}

/**
 * Decyzja zarzadcy -- wywolujacy aplikuje te wartosci do stanu gry.
 *
 *   workedTiles  : N najlepszych pol do obrabiania (N = populacja, clamp do dostepnych)
 *   enqueue      : element do dodania na koniec kolejki (null = nie sugeruje zmiany)
 *   pracaSplit   : { doBudynkow, doPuli } -- podzial Pracy (null gdy cityPraca brak)
 */
export interface AutoManageDecision {
  workedTiles: OkolicaTile[];
  enqueue: ProductionItem | null;
  pracaSplit: { doBudynkow: number; doPuli: number } | null;
}

// ---------------------------------------------------------------------------
// pickAutoBuildItem — auto-kolejka budynkow wg profilu miasta
// ---------------------------------------------------------------------------

/**
 * Wybiera nastepny budynek do kolejki gdy front jest pusty.
 * PURE — nie mutuje argumentow.
 */
export function pickAutoBuildItem(
  city: Readonly<City>,
  prod: Readonly<CityProduction>,
  data: ProductionData,
  input: Pick<AutoManageInput, 'unlockedTechs' | 'ctx' | 'ownerSurowcePool'>,
): ProductionItem | null {
  if (frontItem(prod) !== null) return null;
  if ((city.budowaTryb ?? DEFAULT_BUDOWA_TRYB) !== 'priorytet') return null;

  const unlockedTechs = input.unlockedTechs ?? [];
  const ctx = input.ctx ?? {};
  const allCandidates = buildableProduction(city, data, unlockedTechs, ctx);
  // TEMAT #6 (2026-07-23) / SUROW-CIV-01 (2026-07-24): auto-kolejka nigdy nie proponuje
  // budynek, na ktorego koszt surowcowy (cegla/ceramika — koszt_surowce) nie starcza
  // magazyn PANSTWA ownera (suma City.surowce po wszystkich miastach — pula, nie tylko to
  // miasto). Brak `input.ownerSurowcePool` -> fallback na city.surowce lokalnie (zachowanie
  // sprzed SUROW-CIV-01, testowalnosc bez pelnego stanu gry). Jednostki i budynki bez
  // koszt_surowce przechodza bez zmian (zero regresji).
  const surowcePool = input.ownerSurowcePool ?? city.surowce;
  const candidates = allCandidates.filter(item => {
    const def = data.buildings.find(b => b.id === item.id);
    const cost = buildingStockCost(def);
    return Object.keys(cost).length === 0 || canAffordBuildingStock(surowcePool, cost);
  });

  if (candidates.length === 0) return null;

  const typy = budowaPriorytetTypowFor(city);
  for (const focus of typy) {
    const pick = bestCandidateForFocus(candidates, data, focus);
    if (pick) return pick;
  }
  return null;
}

// ---------------------------------------------------------------------------
// autoManageCity
// ---------------------------------------------------------------------------

/**
 * Glowna funkcja zarzadcy automatycznego.
 *
 * PURE: nie mutuje zadnego argumentu; zwraca nowy obiekt decyzji.
 *
 * @param city    Miasto do zarzadzania (tylko do odczytu).
 * @param map     Mapa globalna (do wyznaczenia okolicy).
 * @param prod    Aktualny stan kolejki produkcji miasta (do odczytu).
 * @param data    Dane gry: buildings + units.
 * @param input   Parametry wstrzykiwane przez silnik (plony, Praca, technologie...).
 */
export function autoManageCity(
  city: Readonly<City>,
  map: GameMap,
  prod: Readonly<CityProduction>,
  data: ProductionData,
  input: AutoManageInput,
): AutoManageDecision {
  // --- 1. Auto-przydial pol -------------------------------------------------
  const radius = cityRangeForPopulation(city.population);
  const focus = city.okolicaFocus ?? 'zrownowazone';
  const workedTiles = assignWorkedTiles(
    city.q,
    city.r,
    city.population,
    map,
    input.yieldOf,
    {
      radius,
      isWorkable: input.isWorkable,
      territoryNodes: input.territoryNodes,
      ownerId: city.ownerId,
      wagi: wagiForFocus(focus),
    },
  );

  // --- 2. Auto-budowa: zaproponuj element jesli kolejka pusta i tryb auto ---
  const enqueue = pickAutoBuildItem(city, prod, data, input);

  // --- 3. Auto-podzial Pracy -----------------------------------------------
  let pracaSplit: AutoManageDecision['pracaSplit'] = null;
  if (typeof input.cityPraca === 'number' && Number.isFinite(input.cityPraca)) {
    const udzial = typeof input.udzialBudynki === 'number' && Number.isFinite(input.udzialBudynki)
      ? input.udzialBudynki
      : 0.7; // domysl: 70% Pracy do kolejki budynkow, 30% do globalnej puli (skarbiec)
    pracaSplit = splitPraca(input.cityPraca, udzial);
  }

  // --- Wynik (czysta kopia, wejscia nie zmutowane) -------------------------
  return { workedTiles, enqueue, pracaSplit };
}
