/**
 * no-negative-stocks.ts — R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1 (wariant A, decyzja
 * właściciela 2026-11-13): skarbiec (złoto) i spichlerz państwa (żywność) nie mogą zakończyć
 * tury poniżej zera. Czysta logika bez DOM i bez stanu gry — wołający (main.ts) podaje
 * prognozę PO ticku tury.
 *
 * Zasady:
 *  - Próg liczony na stanie PO ticku tury (dochód − utrzymanie, zakupy, rekrutacja z kolejki),
 *    nie na chwilowym saldzie.
 *  - Tury 1–10 (włącznie) są zwolnione: brak blokady, brak równoważenia AI.
 *  - Blokada gracza („Zakończ turę”) tylko wtedy, gdy prognoza po turze jest < 0 ORAZ GORSZA
 *    niż stan obecny. Stary zapis z ujemnym stanem, którego prognoza nie pogarsza się,
 *    nie blokuje gry na stałe (bezpieczny wyjątek, patrz `wyjatekStarego`).
 *  - Gracz zawsze ma ruch naprawczy (podatki, rozwiązanie jednostki, usunięcie pozycji z
 *    kolejki); `czyRuchNaprawczy` sprawdza, czy dostępne dźwignie pokrywają brak.
 *  - AI równoważy się PRZED końcem tury: najpierw tańsze środki (podatki, wstrzymanie
 *    zakupów), potem najdroższe jednostki wsparcia. Nigdy nie eliminuje cywilizacji
 *    (dźwignie z `eliminujeCywilizacje` są pomijane).
 *
 * Kary deficytu (gold-deficit.ts, głód wojska) zostają jako siatka bezpieczeństwa.
 */

import type { EconomyTickResult, EconUnit, OwnerEraResolver } from './turn-economy';
import { sumEconomyForOwner, sumEconomyForPlayerCities } from './turn-economy';
import type { UpkeepParams, UnitFoodTable } from './economy-upkeep';
import {
  advanceEmpireFood,
  restoreEmpireFoodRuntime,
  snapshotEmpireFoodRuntime,
  type EmpireFoodParams,
  type EmpireFoodState,
} from './empire-food';

export const NNS_WOLNE_TURY = 10;

export type NnsStock = 'skarbiec' | 'spichlerz';

export interface NnsProjection {
  /** Numer kończonej tury (od 1). */
  turn: number;
  skarbiecObecny: number;
  /** Skarbiec po ticku tury (prognoza). */
  skarbiecPo: number;
  spichlerzObecny: number;
  /** Spichlerz państwa po ticku tury (prognoza). */
  spichlerzPo: number;
}

export interface NnsBrak {
  stock: NnsStock;
  /** Ile brakuje do zera (wartość dodatnia). */
  ile: number;
}

export interface NnsVerdict {
  /** true = przycisk „Zakończ turę” zablokowany dla gracza. */
  blokada: boolean;
  /** Tura należy do okresu wolnego (turn <= NNS_WOLNE_TURY). */
  wyjatekTur: boolean;
  /** Stan ujemny już istnieje, a prognoza się nie pogarsza — bezpieczny wyjątek. */
  wyjatekStarego: boolean;
  brakuje: NnsBrak[];
  /** Komunikat po polsku dla gracza; pusty gdy brak blokady. */
  komunikat: string;
}

const NAZWA: Record<NnsStock, string> = {
  skarbiec: 'Skarbiec (złoto)',
  spichlerz: 'Spichlerz państwa (żywność)',
};

function fmt(n: number): string {
  return String(Math.round(n));
}

/**
 * Ocena końca tury dla gracza. Czysta funkcja.
 */
export function evaluateEndTurnStocks(p: NnsProjection): NnsVerdict {
  const wyjatekTur = p.turn <= NNS_WOLNE_TURY;
  const brakuje: NnsBrak[] = [];
  let wyjatekStarego = false;

  const sprawdz = (stock: NnsStock, obecny: number, po: number): void => {
    if (!Number.isFinite(po) || po >= 0) return;
    if (po < obecny) {
      brakuje.push({ stock, ile: -po });
    } else {
      // stan ujemny już istnieje, prognoza nie gorsza — nie blokujemy
      wyjatekStarego = true;
    }
  };
  sprawdz('skarbiec', p.skarbiecObecny, p.skarbiecPo);
  sprawdz('spichlerz', p.spichlerzObecny, p.spichlerzPo);

  const blokada = !wyjatekTur && brakuje.length > 0;
  let komunikat = '';
  if (blokada) {
    const linie = brakuje.map(b =>
      `${NAZWA[b.stock]}: po turze zabraknie ${fmt(b.ile)}`,
    );
    komunikat =
      'Nie można zakończyć tury: ' + linie.join('; ') +
      '. Zwiększ podatki, rozwiąż jednostkę albo usuń pozycję z kolejki produkcji.';
  }
  return {
    blokada,
    wyjatekTur,
    wyjatekStarego: wyjatekStarego && !blokada,
    brakuje,
    komunikat,
  };
}

/** Dźwignia (ruch gracza lub AI) zmieniająca jeden stock o `zysk` na turę. */
export interface NnsLever {
  id: string;
  /** Rodzaj: podatek / wstrzymanie zakupu / rozwiązanie jednostki. */
  rodzaj: 'podatek' | 'wstrzymanie' | 'rozwiazanie';
  stock: NnsStock;
  /** Poprawa salda tego stocka po turze (dodatnia). */
  zysk: number;
  /** Koszt wsparcia jednostki (kolejność dla AI; podatki/wstrzymania 0). */
  koszt: number;
  /** true = użycie zlikwidowałoby ostatnią cywilizację/miasto — AI nigdy tego nie robi. */
  eliminujeCywilizacje: boolean;
}

/**
 * Czy dostępne dźwignie gracza pokrywają brak (brak zakleszczenia).
 * Kontrakt wołającego: `levers` zawiera WYŁĄCZNIE dźwignie dostępne w tym momencie (np. podatek
 * ustawialny, jednostka do rozwiązania, pozycja w kolejce). Dostępność NIE jest sprawdzana w tej
 * funkcji — to czysta arytmetyka sumy `zysk` bez `eliminujeCywilizacje`.
 */
export function czyRuchNaprawczy(brakuje: readonly NnsBrak[], levers: readonly NnsLever[]): boolean {
  return brakuje.every(b =>
    levers
      .filter(l => l.stock === b.stock && !l.eliminujeCywilizacje)
      .reduce((s, l) => s + l.zysk, 0) >= b.ile,
  );
}

export interface NnsAiAkcja {
  leverId: string;
  rodzaj: NnsLever['rodzaj'];
  stock: NnsStock;
  zysk: number;
}

export interface NnsAiPlan {
  akcje: NnsAiAkcja[];
  /** Brak pokryty w całości po wykonaniu planu. */
  pokryte: boolean;
  /** Pozostały brak po planie (ile). */
  pozostalo: Record<NnsStock, number>;
}

const RANGA: Record<NnsLever['rodzaj'], number> = { podatek: 0, wstrzymanie: 1, rozwiazanie: 2 };

/**
 * Plan równoważenia AI przed końcem tury. Kolejność: podatki, wstrzymanie zakupów, potem
 * rozwiązanie jednostek od najdroższej. Dźwignie eliminujące cywilizację są pomijane.
 * Deterministyczny (ta sama lista -> ten sam plan).
 */
export function planAiBalance(brakuje: readonly NnsBrak[], levers: readonly NnsLever[]): NnsAiPlan {
  const pozostalo: Record<NnsStock, number> = { skarbiec: 0, spichlerz: 0 };
  for (const b of brakuje) pozostalo[b.stock] += b.ile;

  const kandydaci = levers
    .filter(l => !l.eliminujeCywilizacje && l.zysk > 0)
    .slice()
    .sort((a, b) =>
      RANGA[a.rodzaj] - RANGA[b.rodzaj] ||
      b.koszt - a.koszt ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );

  const akcje: NnsAiAkcja[] = [];
  for (const l of kandydaci) {
    if (pozostalo[l.stock] <= 0) continue;
    akcje.push({ leverId: l.id, rodzaj: l.rodzaj, stock: l.stock, zysk: l.zysk });
    pozostalo[l.stock] = Math.max(0, pozostalo[l.stock] - l.zysk);
  }
  return {
    akcje,
    pokryte: pozostalo.skarbiec <= 0 && pozostalo.spichlerz <= 0,
    pozostalo,
  };
}

// ---------------------------------------------------------------------------
// R-WEB-ECON-NO-NEGATIVE-STOCKS-A-Q1 — projekcja PO ticku (tylko odczyt, bez mutacji stanu gry).
// Wołający podaje econ/stan PO autoracjach (jak przed realnym ticku w main.ts). Dla gracza i AI
// ta sama funkcja, zero gałęzi po ownerId.
// ---------------------------------------------------------------------------

/**
 * Skarbiec po ticku — ta sama arytmetyka co blok „Bank treasury” w main.ts (dochód miast
 * `pieniadz` − `utrzymanieRazem` gdy > 0). Brak podłogi do 0 (symetria z realnym bankowaniem).
 * UWAGA: to odwzorowanie arytmetyki bloku, nie wywołanie main.ts (main.ts nie jest importowalny).
 */
export function projectTreasuryAfterTick(
  skarbiecObecny: number,
  econ: Pick<EconomyTickResult, 'perCity' | 'upkeepByOwner'>,
  ownerId: number,
  cities?: ReadonlyArray<{ id: string; ownerId: number }>,
): number {
  // Źródło dochodu jak w realnym ticku main.ts (zob. blok „Bank treasury”):
  //  - fotel człowieka: sumEconomyForPlayerCities(econ, cities, ownerId) (filtr po liście miast),
  //  - AI: sumEconomyForOwner(econ, ownerId) (filtr po perCity.ownerId).
  // Przy podaniu `cities` wołający deklaruje fotel człowieka; rozjazd starych zapisów daje ten sam wynik co tick.
  const dochod = cities
    ? sumEconomyForPlayerCities(econ, cities, ownerId)
    : sumEconomyForOwner(econ, ownerId);
  let s = skarbiecObecny + dochod.pieniadz;
  const u = econ.upkeepByOwner.get(ownerId)?.utrzymanieRazem ?? 0;
  if (u > 0) s -= u;
  return s;
}

export interface NnsFoodProjectionInput {
  ownerId: number;
  states: ReadonlyMap<number, EmpireFoodState>;
  econ: EconomyTickResult;
  units: ReadonlyArray<EconUnit>;
  upkeep: UpkeepParams;
  params: EmpireFoodParams;
  foodTable?: UnitFoodTable;
  builtByCity?: ReadonlyMap<string, readonly string[]>;
  resolveOwnerEra?: OwnerEraResolver;
}

export interface NnsFoodProjection {
  /** Spichlerz państwa PRZED klamrą do zera (wartość < 0 = niedobór po ticku). */
  spichlerzPo: number;
  /** Wartość zapisywana przez realny tick (po klamrze do 0 i capie) — z kopii, stan nie tknięty. */
  zapasyPoRealne: number;
  glodWojska: boolean;
}

/**
 * Spichlerz państwa po ticku — wywołuje REALNE `advanceEmpireFood` na KOPII stanu, potem przywraca
 * globalny cache HUD (`snapshotEmpireFoodRuntime`/`restoreEmpireFoodRuntime`). Stan wejściowy
 * (`states`, `econ`) nie jest modyfikowany. Prognoza = `spichlerzStolicy − wojsko` (przed capem
 * i klamrą; cap działa tylko w górę, więc nie zmienia znaku).
 */
export function projectEmpireFoodAfterTick(input: NnsFoodProjectionInput): NnsFoodProjection {
  const obecny = input.states.get(input.ownerId)?.zapasyPanstwa ?? 0;
  const snap = snapshotEmpireFoodRuntime();
  try {
    const clone = new Map<number, EmpireFoodState>();
    for (const [k, v] of input.states) clone.set(k, { ...v });
    const res = advanceEmpireFood(
      input.econ, input.units, clone, input.upkeep, input.params,
      input.foodTable, input.builtByCity, input.resolveOwnerEra,
    );
    const t = res.byOwner.get(input.ownerId);
    if (!t) return { spichlerzPo: obecny, zapasyPoRealne: obecny, glodWojska: false };
    return {
      spichlerzPo: t.spichlerzStolicy - t.kosztArmii,
      zapasyPoRealne: t.zapasyPo,
      glodWojska: t.glodWojska,
    };
  } finally {
    restoreEmpireFoodRuntime(snap);
  }
}

/** Pełna prognoza NNS po ticku (skarbiec + spichlerz) dla jednego ownera. */
export function projectNnsAfterTick(
  turn: number,
  skarbiecObecny: number,
  food: NnsFoodProjectionInput,
): NnsProjection {
  const f = projectEmpireFoodAfterTick(food);
  return {
    turn,
    skarbiecObecny,
    skarbiecPo: projectTreasuryAfterTick(skarbiecObecny, food.econ, food.ownerId),
    spichlerzObecny: food.states.get(food.ownerId)?.zapasyPanstwa ?? 0,
    spichlerzPo: f.spichlerzPo,
  };
}
