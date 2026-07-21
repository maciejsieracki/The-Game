/**
 * capital-capture.ts — RDZEŃ „przejęcie stolicy" (plunder + eliminacja).
 *
 * Spec właściciela (2026-07-21), DWA OSOBNE ZDARZENIA rozróżniane po tym, czy
 * pokonany (oldOwner) ma jeszcze INNE miasta PO utracie tego jednego:
 *
 *   ZDARZENIE 1 — przejęcie stolicy, cywilizacja przeżywa (ma inne miasta):
 *     - Skarbiec (globalny per cyw) -> w całości do zwycięzcy; pokonany 0.
 *     - Pula pracy (cywilizacyjna) -> PRZEPADA (pokonany 0, NIE do zwycięzcy).
 *     - Nauka / techy / Power -> bez zmian.
 *
 *   ZDARZENIE 2 — przejęcie OSTATNIEGO miasta = ELIMINACJA:
 *     - Skarbiec + pula pracy jak w Zdarzeniu 1.
 *     - PLUS: pula punktów nauki pokonanego -> w całości do zwycięzcy.
 *     - PLUS: techy pokonanego, których zwycięzca NIE MA -> skopiowane (pokonanemu
 *       zostają też — kopiujemy, nie odbieramy).
 *     - Cywilizacja SKASOWANA (obsługa poza tym modułem — main.ts eliminateOwner(),
 *       bo wymaga dostępu do map stanu AI/dyplomacji lokalnych dla main.ts).
 *
 * „Stolica" = NAJSTARSZE miasto danego ownera (pierwsze założone). Kryterium wieku:
 * city.id ma postać 'city' + N, gdzie N to globalny licznik zakładania miast (patrz
 * foundCity/foundCityAt w cities.ts — jedyne dwa miejsca nadające id). Niższe N =
 * założone wcześniej. UWAGA: to NIE to samo co localeCompare użyty w
 * society-inputs.ts:isPlayerCapitalCity — ten porównuje id jako stringi, co dla
 * ownerów z 10+ miastami globalnie daje błędną kolejność (np. "city10" < "city9"
 * leksykograficznie, mimo że city9 założone wcześniej). Ten moduł parsuje N
 * numerycznie, żeby uniknąć tego błędu. isPlayerCapitalCity (society-inputs.ts)
 * naprawione 2026-07-21 — teraz importuje i używa cityFoundOrder z tego modułu,
 * więc oba miejsca liczą wiek miasta identycznie (numerycznie, nie leksykograficznie).
 *
 * WOŁANE PO zmianie city.ownerId (city.ownerId === newOwner już ustawione przez
 * wywołującego) — patrz applyCityCaptureAfterBattle (post-battle-map.ts) i
 * resolveSiegeSurrender (main.ts), oba ustawiają ownerId PRZED wywołaniem tego
 * modułu. „Pozostałe miasta oldOwner" liczymy więc jako miasta z ownerId===oldOwner
 * w `citiesAfterCapture` (przejęte miasto samo już tam nie pasuje, bo ma nowego wł.).
 *
 * Akcesory zasobów (OwnerResourceAccess) są CELOWO owner-agnostyczne — ten sam kod
 * działa identycznie gdy zdobywa/traci gracz (ownerId 0) i gdy zdobywa/traci AI.
 *
 * Determinizm: zero losowości; kopiowanie techów w kolejności alfabetycznej (stała).
 */

import type { City } from './cities';

/** Global city-founding order encoded in the id ('city' + N). +Infinity for ids
 *  that don't match the pattern (never treated as "oldest") — defensive fallback;
 *  as of 2026-07-21 the ONLY two city-id mint sites are foundCity/foundCityAt in
 *  cities.ts, both using this exact 'city' + cities.length scheme. */
export function cityFoundOrder(id: string): number {
  const m = /^city(\d+)$/.exec(id);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

/** Najstarsze (pierwsze założone) miasto danego ownera, lub null gdy brak miast. */
export function oldestCityOfOwner(ownerId: number, cities: readonly City[]): City | null {
  let best: City | null = null;
  let bestOrder = Number.POSITIVE_INFINITY;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    const order = cityFoundOrder(c.id);
    if (order < bestOrder) {
      best = c;
      bestOrder = order;
    }
  }
  return best;
}

/**
 * Czy `city` (już przypisane do newOwner) BYŁO stolicą (najstarszym miastem)
 * oldOwner sprzed przejęcia. Porównuje jego own id vs pozostałe miasta oldOwner
 * w `citiesAfterCapture` (city samo już ma ownerId!==oldOwner, więc nie wchodzi
 * do tamtej grupy — porównanie jest jawne przez wykluczenie po id, nie po ownerId).
 */
export function wasCapitalOfOldOwner(
  city: City,
  oldOwner: number,
  citiesAfterCapture: readonly City[],
): boolean {
  const order = cityFoundOrder(city.id);
  for (const c of citiesAfterCapture) {
    if (c.id === city.id) continue;
    if (c.ownerId !== oldOwner) continue;
    if (cityFoundOrder(c.id) < order) return false;
  }
  return true;
}

/** Miasta oldOwner POZOSTAŁE po przejęciu (przejęte miasto już wykluczone, bo ma nowego wł.). */
export function remainingCitiesOfOwner(
  oldOwner: number,
  citiesAfterCapture: readonly City[],
): City[] {
  return citiesAfterCapture.filter(c => c.ownerId === oldOwner);
}

// ---------------------------------------------------------------------------
// Owner-agnostic resource accessors — main.ts dostarcza implementację (gracz
// ownerId 0 = playerState.ts; AI ownerId>0 = mapy *ByOwner w main.ts).
// ---------------------------------------------------------------------------

export interface OwnerResourceAccess {
  getTreasury(ownerId: number): number;
  setTreasury(ownerId: number, value: number): void;
  /** Pula pracy (cywilizacyjna nadwyżka). AI dziś NIE MA takiej puli (nie buduje
   *  ulepszeń z niej) — implementacja main.ts zwraca 0 / no-op dla ownerId>0. */
  getPracaPool(ownerId: number): number;
  setPracaPool(ownerId: number, value: number): void;
  /** Pula (nieużytych) punktów nauki. AI dziś NIE MA osobnej puli — badania AI
   *  kończą się od razu (chooseAIResearch), bez kosztu z banku. Implementacja
   *  main.ts zwraca 0 / no-op dla ownerId>0 (patrz raport: asymetria danych). */
  getNaukaPool(ownerId: number): number;
  setNaukaPool(ownerId: number, value: number): void;
  getResearchedTechs(ownerId: number): ReadonlySet<string>;
  addResearchedTechs(ownerId: number, ids: Iterable<string>): void;
}

export type CapitalCaptureEventKind = 'przejecie_stolicy' | 'eliminacja';

export interface CapitalCaptureOutcome {
  event: CapitalCaptureEventKind;
  oldOwner: number;
  newOwner: number;
  /** Skarbiec przejęty (kwota, dla logu/UI). */
  skarbiecPrzejety: number;
  /** Nauka przejęta (0 poza Zdarzeniem 2). */
  naukaPrzejeta: number;
  /** Id techów skopiowanych zwycięzcy (puste poza Zdarzeniem 2), posortowane. */
  techSkopiowane: string[];
  /** True = Zdarzenie 2 (eliminacja) — caller (main.ts) musi doczyścić rostery/dyplomację. */
  eliminacja: boolean;
}

/**
 * Wołane PO zmianie city.ownerId (city.ownerId === newOwner już ustawione).
 * Zwraca null gdy przejęte miasto NIE było stolicą oldOwner — zwykła (nie-
 * stołeczna) utrata miasta, poza zakresem tego systemu, brak transferów.
 */
export function applyCapitalCapturePlunder(
  city: City,
  oldOwner: number,
  newOwner: number,
  citiesAfterCapture: readonly City[],
  access: OwnerResourceAccess,
): CapitalCaptureOutcome | null {
  if (!wasCapitalOfOldOwner(city, oldOwner, citiesAfterCapture)) return null;

  const remaining = remainingCitiesOfOwner(oldOwner, citiesAfterCapture);
  const eliminacja = remaining.length === 0;

  // --- Pieniądze: w całości do zwycięzcy (identycznie w obu zdarzeniach) ---
  const skarbiecPrzejety = access.getTreasury(oldOwner);
  if (skarbiecPrzejety > 0) {
    access.setTreasury(newOwner, access.getTreasury(newOwner) + skarbiecPrzejety);
  }
  access.setTreasury(oldOwner, 0);

  // --- Pula pracy: zawsze przepada (NIE idzie do zwycięzcy) ---
  access.setPracaPool(oldOwner, 0);

  let naukaPrzejeta = 0;
  const techSkopiowane: string[] = [];

  if (eliminacja) {
    // --- Zdarzenie 2 — dodatkowo nauka + techy ---
    naukaPrzejeta = access.getNaukaPool(oldOwner);
    if (naukaPrzejeta > 0) {
      access.setNaukaPool(newOwner, access.getNaukaPool(newOwner) + naukaPrzejeta);
    }
    access.setNaukaPool(oldOwner, 0);

    const winnerTechs = access.getResearchedTechs(newOwner);
    const loserTechs = access.getResearchedTechs(oldOwner);
    const missing = Array.from(loserTechs)
      .filter(id => !winnerTechs.has(id))
      .sort(); // deterministyczna kolejność kopiowania
    if (missing.length > 0) {
      access.addResearchedTechs(newOwner, missing);
      techSkopiowane.push(...missing);
    }
  }

  return {
    event: eliminacja ? 'eliminacja' : 'przejecie_stolicy',
    oldOwner,
    newOwner,
    skarbiecPrzejety,
    naukaPrzejeta,
    techSkopiowane,
    eliminacja,
  };
}
