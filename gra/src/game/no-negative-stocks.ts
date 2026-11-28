/**
 * no-negative-stocks.ts — R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1 (wariant A, decyzja
 * właściciela 2026-11-13): skarbiec (złoto) i spichlerz państwa (żywność) nie mogą zakończyć
 * tury poniżej zera. Czysta logika bez DOM i bez stanu gry — wołający (main.ts) podaje
 * prognozę PO ticku tury.
 *
 * Zasady:
 *  - Próg liczony na stanie PO ticku tury (dochód − utrzymanie, zakupy, rekrutacja z kolejki),
 *    nie na chwilowym saldzie.
 *  - R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1 (2026-11-14): dla GRACZA liczy się
 *    WYŁĄCZNIE prognoza po turze, od tury 1 (bez wyjątku 1–10, bez porównania z stanem obecnym).
 *    Prognoza < 0 po reakcji automatu zarządzania → blokada, o ile istnieje ręczna dźwignia.
 *    Brak dźwigni = brak blokady (bez softlocku). AI równoważy od tury 1
 *    (`NNS_AI_BALANCE_TURN_MIN = 1`, decyzja 2026-11-14).
 *  - Gracz zawsze ma ruch naprawczy (podatek, racje, rozwiązanie jednostki); `czyRuchNaprawczy`
 *    sprawdza, czy dostępne dźwignie pokrywają brak. Kolejka produkcji NIE jest dźwignią gracza
 *    (R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1: prognoza gracza jej nie zawiera; AI ma własny plan).
 *  - AI równoważy się PRZED końcem tury: najpierw tańsze środki (podatki, wstrzymanie
 *    zakupów), potem najdroższe jednostki wsparcia. Nigdy nie eliminuje cywilizacji
 *    (dźwignie z `eliminujeCywilizacje` są pomijane).
 *
 * Kary deficytu (gold-deficit.ts, głód wojska) zostają jako siatka bezpieczeństwa.
 */

import type { EconomyTickResult, EconUnit, OwnerEraResolver } from './turn-economy';
import { sumEconomyForOwner, sumEconomyForPlayerCities } from './turn-economy';
import type { UpkeepParams, UnitFoodTable } from './economy-upkeep';
import { biezacyKosztJednostekPace } from './unit-cost-tempo';
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
  // R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1 (decyzja właściciela 2026-11-14):
  // liczy się WYŁĄCZNIE prognoza po zakończeniu tury, od tury 1. Stan obecny nie ma znaczenia,
  // brak wyjątku tur 1–10 dla gracza. `wyjatekTur` / `wyjatekStarego` zostają w typie wyłącznie
  // dla zgodności wstecznej i są zawsze false.
  const wyjatekTur = false;
  const wyjatekStarego = false;
  const brakuje: NnsBrak[] = [];

  const sprawdz = (stock: NnsStock, po: number): void => {
    if (!Number.isFinite(po) || po >= 0) return;
    brakuje.push({ stock, ile: -po });
  };
  sprawdz('skarbiec', p.skarbiecPo);
  sprawdz('spichlerz', p.spichlerzPo);

  const blokada = brakuje.length > 0;
  let komunikat = '';
  if (blokada) {
    const linie = brakuje.map(b =>
      `${NAZWA[b.stock]}: po zakończeniu tury zabraknie ${fmt(b.ile)}`,
    );
    komunikat =
      'Nie można zakończyć tury: ' + linie.join('; ') +
      '. Zwiększ podatki, zmniejsz racje albo rozwiąż jednostkę.';
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

/**
 * Wejście dla `buildAiLevers` — surowy opis dostępnych dźwigni jednego AI (bez stanu gry).
 * Wołający (ai.ts/main.ts, etap C2) wypełnia to z realnego stanu ownera.
 */
export interface NnsAiLeverInput {
  /** Dodatkowy dochód skarbca po podniesieniu podatku (0 = podatek niedostępny / bez zmiany). */
  podatekSkarbiec: number;
  /** Pozycje kolejki/budowy do wstrzymania; `zysk` = koszt złota/żywności nieponiesiony w tej turze. */
  wstrzymania?: ReadonlyArray<{ id: string; stock: NnsStock; zysk: number }>;
  /** Jednostki wsparcia (nie obronne) do rozwiązania. `koszt` = wartość do sortowania (najdroższe pierwsze). */
  jednostkiWsparcia: ReadonlyArray<{ id: string; stock: NnsStock; zysk: number; koszt: number }>;
  /** Ostatnie jednostki obronne miasta — nigdy nie są rozwiązywane przez AI (zob. `eliminujeCywilizacje`). */
  jednostkiObronne: ReadonlyArray<{ id: string; stock: NnsStock; zysk: number; koszt: number }>;
  /**
   * C3: zysk spichlerza (żywność/turę) z obniżenia racji/suwaka wzrostu (tania dźwignia, ranga „podatek”,
   * przed rozwiązywaniem jednostek). 0/brak = dźwignia niedostępna.
   */
  suwakZywnosc?: number;
}

/**
 * Buduje listę dźwigni AI z opisu stanu ownera. Czysta funkcja, deterministyczna.
 * Dźwignie z `zysk` <= 0 lub niefinitywnym są pomijane. Jednostki obronne dostają
 * `eliminujeCywilizacje: true`, więc `planAiBalance` nigdy po nie nie sięga.
 */
export function buildAiLevers(input: NnsAiLeverInput): NnsLever[] {
  const dobre = (z: number): boolean => Number.isFinite(z) && z > 0;
  const out: NnsLever[] = [];
  if (dobre(input.podatekSkarbiec)) {
    out.push({
      id: 'podatek-skarbiec', rodzaj: 'podatek', stock: 'skarbiec',
      zysk: input.podatekSkarbiec, koszt: 0, eliminujeCywilizacje: false,
    });
  }
  if (input.suwakZywnosc !== undefined && dobre(input.suwakZywnosc)) {
    out.push({
      id: 'suwak-zywnosc', rodzaj: 'podatek', stock: 'spichlerz',
      zysk: input.suwakZywnosc, koszt: 0, eliminujeCywilizacje: false,
    });
  }
  for (const w of input.wstrzymania ?? []) {
    if (!dobre(w.zysk)) continue;
    out.push({ id: w.id, rodzaj: 'wstrzymanie', stock: w.stock, zysk: w.zysk, koszt: 0, eliminujeCywilizacje: false });
  }
  for (const j of input.jednostkiWsparcia) {
    if (!dobre(j.zysk)) continue;
    out.push({ id: j.id, rodzaj: 'rozwiazanie', stock: j.stock, zysk: j.zysk, koszt: j.koszt, eliminujeCywilizacje: false });
  }
  for (const j of input.jednostkiObronne) {
    if (!dobre(j.zysk)) continue;
    out.push({ id: j.id, rodzaj: 'rozwiazanie', stock: j.stock, zysk: j.zysk, koszt: j.koszt, eliminujeCywilizacje: true });
  }
  return out;
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
  /** Koszt żywności armii po ticku (dźwignia: rozwiązanie jednostek odzyskuje tę kwotę). */
  kosztArmii: number;
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
      biezacyKosztJednostekPace(),
    );
    const t = res.byOwner.get(input.ownerId);
    if (!t) return { spichlerzPo: obecny, zapasyPoRealne: obecny, glodWojska: false, kosztArmii: 0 };
    return {
      spichlerzPo: t.spichlerzStolicy - t.kosztArmii,
      zapasyPoRealne: t.zapasyPo,
      glodWojska: t.glodWojska,
      kosztArmii: t.kosztArmii,
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

// ---------------------------------------------------------------------------
// R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (etap C2) — równoważenie AI po ticku.
// ---------------------------------------------------------------------------

/** Pierwsza tura, od której równoważenie AI jest aktywne (od tury 1; wyjątek 1–10 dotyczy wyłącznie gracza). */
export const NNS_AI_BALANCE_TURN_MIN = 1;

/**
 * Flaga równoważenia AI (jedno miejsce). Domyślnie włączona. Wyłączenie jest używane
 * wyłącznie w mutacji pomiarowej (runner headless / testy), nigdy w grze.
 */
const nnsAiBalanceFlag = { enabled: true };

export function isNnsAiBalanceEnabled(): boolean {
  return nnsAiBalanceFlag.enabled;
}

export function setNnsAiBalanceEnabled(enabled: boolean): void {
  nnsAiBalanceFlag.enabled = enabled;
}

export interface NnsAiOwnerDecision {
  /** Czy równoważenie uruchomić dla tego ownera w tej turze. */
  aktywne: boolean;
  /** Wstrzymać zakupy/rekrutację AI w tej turze. */
  wstrzymajZakupy: boolean;
  /** Id dźwigni „rozwiazanie” (jednostki wsparcia) wybranych do rozwiązania, od najdroższej. */
  rozwiazJednostki: string[];
  plan: NnsAiPlan;
}

/**
 * Decyzja równoważenia dla jednego AI po ticku. Czysta funkcja.
 * `skarbiecPo` / `spichlerzPo` = prognoza po ticku (wartości przed podłogą).
 */
export function decideAiOwnerBalance(
  turn: number,
  skarbiecPo: number,
  spichlerzPo: number,
  levers: readonly NnsLever[],
): NnsAiOwnerDecision {
  const brakuje: NnsBrak[] = [];
  if (skarbiecPo < 0) brakuje.push({ stock: 'skarbiec', ile: -skarbiecPo });
  if (spichlerzPo < 0) brakuje.push({ stock: 'spichlerz', ile: -spichlerzPo });
  const aktywne = isNnsAiBalanceEnabled() && turn >= NNS_AI_BALANCE_TURN_MIN && brakuje.length > 0;
  const plan = planAiBalance(brakuje, aktywne ? levers : []);
  return {
    aktywne,
    wstrzymajZakupy: aktywne,
    rozwiazJednostki: plan.akcje.filter(a => a.rodzaj === 'rozwiazanie').map(a => a.leverId),
    plan,
  };
}

// R-WEB-ECON-NO-NEGATIVE-STOCKS-B-Q1 — bramka „Zakończ turę” dla gracza.
// ---------------------------------------------------------------------------

export interface NnsGateResult {
  /** true = „Zakończ turę” zablokowane (prognoza po turze < 0 PO reakcji automatu ORAZ istnieje ruch naprawczy). */
  blokada: boolean;
  /** Komunikat po polsku (pusty gdy brak blokady): co na minusie po turze, o ile, które dźwignie pomogą. */
  komunikat: string;
  /** Dźwignie uwzględnione przy ocenie „ruchu naprawczego” (tylko dodatnie zyski; pusta tablica bez blokady). */
  dzwignie: NnsGateLever[];
  /** Zasób, którego dotyczy blokada (pierwszy na minusie); null bez blokady. Stabilne API dla okna zdarzenia. */
  zasob: NnsStock | null;
  /** Prognozowany stan tego zasobu po turze (po reakcji automatu); null bez blokady. */
  prognoza: number | null;
  /** Propozycja podatku do zera (tylko gdy skarbiec na minusie i da się to pokryć podatkiem); inaczej null. */
  propozycjaPodatku: NnsPropozycjaPodatku | null;
  /** true = reakcja automatu zmieniła prognozę (`extra.automat` użyte). */
  automatPoprawil: boolean;
  /**
   * R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1 r2 (zarzut 7/8): true = prognoza po turze
   * jest < 0, a dostępne dźwignie gracza NIE pokrywają braku (albo nawet maksymalny podatek nie wystarcza).
   * Bramka wtedy NIE blokuje (założenie: brak softlocku, Dodatek 2), ale UI dostaje jawny sygnał.
   */
  niewystarczajace: boolean;
}

/** Dźwignia pokazana graczowi w komunikacie bramki (zysk = poprawa salda po turze, dodatni). */
export interface NnsGateLever {
  id: string;
  stock: NnsStock;
  zysk: number;
  /** Opis po polsku, z liczbą z projekcji. */
  opis: string;
}

/** Zyski dźwigni gracza liczone przez wołającego (main.ts) z projekcji; 0/brak = dźwignia niedostępna. */
export interface NnsEndTurnLevers {
  /** Podatek: dodatkowy przychód skarbca po przesunięciu podziału na podatek (0 = niedostępne). */
  podatekSkarbiec?: number;
  /** Racje: dodatkowy zysk spichlerza po obniżeniu racji/suwaka wzrostu do 0 (0 = niedostępne). */
  suwakZywnosc?: number;
  /** Ile punktów % udziału podatku (pieniądz) gracz może dodać (0 = brak danych; do propozycji podatku). */
  podatekPunkty?: number;
  /** R-WEB-STARVATION-IMPL-Q44A: true = brak żywności (spichlerz < 0) nie blokuje tury (tylko skarbiec blokuje). */
  ignorujZywnosc?: boolean;
  /** Prognoza PO reakcji automatu zarządzania (Dodatek 3: najpierw automat, potem gracz). undefined = brak. */
  automat?: { skarbiecPo?: number; spichlerzPo?: number };
  /**
   * r2 (zarzut 3): prognoza skarbca PO TURZE przy podniesieniu podatku o `pkt` punktów % (wartość bezwzględna,
   * z tej samej projekcji co bramka, już po reakcji automatu). Gdy podana, propozycja podatku idzie krokami
   * (propozycjaPodatkuKrokami); gdy brak — estymacja liniowa (szacunek 'liniowy').
   */
  prognozaPoPodatku?: (punktyProcentowe: number) => number;
}

function zyskNieujemny(z: number | undefined): number {
  return z !== undefined && Number.isFinite(z) && z > 0 ? z : 0;
}

/**
 * Decyzja bramki gracza. `zyskSkarbiec` / `zyskSpichlerz` = łączna poprawa salda po ZDJĘCIU
 * wszystkich jednostek (rozwiązanie = odzyskany utrzymanie / koszt armii). `extra` = dźwignie
 * podatku i racji (zob. NnsEndTurnLevers). Blokada tylko gdy sumy dźwigni pokrywają brak
 * (brak zakleszczenia: gdy nic nie wystarcza, tura nie jest blokowana).
 */
export function decideEndTurnGate(
  p: NnsProjection,
  zyskSkarbiec: number,
  zyskSpichlerz: number,
  extra: NnsEndTurnLevers = {},
): NnsGateResult {
  // Kolejność reakcji (Dodatek 3, 2026-11-14): NAJPIERW automat zarządzania przetwarza turę i
  // poprawia prognozę; DOPIERO wynik po automacie jest oceniany. `extra.automat` = prognoza po
  // reakcji automatu (undefined = automat nie zadziałał / brak danych → prognoza bez zmian).
  const pPoAutomacie: NnsProjection = {
    ...p,
    skarbiecPo: extra.automat?.skarbiecPo ?? p.skarbiecPo,
    spichlerzPo: extra.automat?.spichlerzPo ?? p.spichlerzPo,
  };
  const automatPoprawil =
    (extra.automat?.skarbiecPo !== undefined && extra.automat.skarbiecPo !== p.skarbiecPo) ||
    (extra.automat?.spichlerzPo !== undefined && extra.automat.spichlerzPo !== p.spichlerzPo);
  let v = evaluateEndTurnStocks(pPoAutomacie);
  // R-WEB-STARVATION-IMPL-Q44A (Q42=C): brak ŻYWNOŚCI nie blokuje tury gracza — tura przechodzi z
  // ujemnym zapasem, a skutkiem jest głód wojska (istniejący mechanizm). Usuwamy tylko braki spichlerza;
  // braki skarbca nadal blokują, a ścieżka AI nie korzysta z tej opcji.
  if (extra.ignorujZywnosc) {
    const bezZywnosci = v.brakuje.filter(b => b.stock !== 'spichlerz');
    if (bezZywnosci.length !== v.brakuje.length) {
      v = { ...v, brakuje: bezZywnosci, blokada: bezZywnosci.length > 0, komunikat: '' };
    }
  }
  if (!v.blokada) {
    return { blokada: false, komunikat: '', dzwignie: [], zasob: null, prognoza: null, propozycjaPodatku: null, automatPoprawil, niewystarczajace: false };
  }
  const levers: NnsLever[] = [
    { id: 'podatek-skarbiec', rodzaj: 'podatek', stock: 'skarbiec', zysk: zyskNieujemny(extra.podatekSkarbiec), koszt: 0, eliminujeCywilizacje: false },
    { id: 'suwak-zywnosc', rodzaj: 'podatek', stock: 'spichlerz', zysk: zyskNieujemny(extra.suwakZywnosc), koszt: 0, eliminujeCywilizacje: false },
    { id: 'rozwiaz-skarbiec', rodzaj: 'rozwiazanie', stock: 'skarbiec', zysk: zyskNieujemny(zyskSkarbiec), koszt: 0, eliminujeCywilizacje: false },
    { id: 'rozwiaz-spichlerz', rodzaj: 'rozwiazanie', stock: 'spichlerz', zysk: zyskNieujemny(zyskSpichlerz), koszt: 0, eliminujeCywilizacje: false },
  ];
  // r3 (DODATEK 6): „brak ręcznej dźwigni = brak blokady” (bez martwego punktu), ale gdy dla JAKIEGOKOLWIEK zasobu na
  // minusie istnieje realna, niewykorzystana dźwignia (zysk > 0: podatek / racja / rozwiązanie jednostek),
  // blokada obowiązuje — także gdy jej pełne użycie nie pokrywa braku (flaga `niewystarczajace`).
  // Brak softlocku: użyta dźwignia ma zysk 0, więc po jej wyczerpaniu blokada znika.
  const brakujeZDzwignia = v.brakuje.filter(b => levers.some(l => l.stock === b.stock && l.zysk > 0 && !l.eliminujeCywilizacje));
  if (brakujeZDzwignia.length === 0) {
    return {
      blokada: false, komunikat: '', dzwignie: [], zasob: null, prognoza: null, propozycjaPodatku: null,
      automatPoprawil, niewystarczajace: false,
    };
  }
  const pokryte = czyRuchNaprawczy(brakujeZDzwignia, levers) && brakujeZDzwignia.length === v.brakuje.length;
  const dzwignie: NnsGateLever[] = levers
    .filter(l => l.zysk > 0)
    .map(l => ({ id: l.id, stock: l.stock, zysk: l.zysk, opis: opisDzwigni(l) }));
  // Pierwszy zasób na minusie (po automacie): skarbiec ma pierwszeństwo w komunikacie.
  const pierwszy = brakujeZDzwignia[0]!;
  let propozycjaPodatku: NnsPropozycjaPodatku | null = null;
  let niewystarczajace = false;
  if (v.brakuje.some(b => b.stock === 'skarbiec')) {
    const punkty = extra.podatekPunkty ?? 0;
    if (extra.prognozaPoPodatku && punkty > 0) {
      // r2 (zarzut 3): wyszukiwanie po krokach na tej samej projekcji co bramka.
      propozycjaPodatku = propozycjaPodatkuKrokami(extra.prognozaPoPodatku, punkty, 10);
    } else {
      propozycjaPodatku = propozycjaPodatkuDoZera(-pPoAutomacie.skarbiecPo, punkty, extra.podatekSkarbiec ?? 0);
    }
    // r2 (zarzut 7/8): nawet maksymalny podatek nie wystarcza do zera skarbca.
    niewystarczajace = propozycjaPodatku === null;
  }
  // r3: suma dźwigni danego zasobu nie pokrywa braku (np. spichlerz: racje + jednostki < brak).
  if (!pokryte) niewystarczajace = true;
  return {
    blokada: true,
    komunikat: komunikatBramki(v.brakuje, dzwignie) + komunikatPodatku(propozycjaPodatku, niewystarczajace),
    dzwignie,
    zasob: pierwszy.stock,
    prognoza: pPoAutomacie[pierwszy.stock === 'skarbiec' ? 'skarbiecPo' : 'spichlerzPo'],
    propozycjaPodatku,
    automatPoprawil,
    niewystarczajace,
  };
}

/** Dopisek do komunikatu bramki: propozycja podatku („chociażby na zero”) albo informacja, że maksymalny podatek nie wystarcza. */
function komunikatPodatku(p: NnsPropozycjaPodatku | null, niewystarczajace: boolean): string {
  if (p) return ` Podnieś podatek o ${p.punktyProcentowe} pkt % (kosztem Nauki), aby skarbiec po zakończeniu tury wyszedł co najmniej na zero.`;
  if (niewystarczajace) return ' Nawet maksymalny podatek nie wystarczy — zmniejsz wydatki (rozwiąż jednostki).';
  return '';
}

/** Propozycja podniesienia podatku, żeby prognoza skarbca po turze była ≥ 0 („chociażby na zero”). */
export interface NnsPropozycjaPodatku {
  /** Ile punktów procentowych podatku dodać (dodatnia liczba całkowita). */
  punktyProcentowe: number;
  /** Szacunek LINIOWY z pełnej dźwigni podatku (nie z osobnej projekcji): patrz `propozycjaPodatkuDoZera`. */
  szacunek: 'liniowy' | 'krokowy';
  /** Brak w pełni pokrytego zera nawet przy maksymalnym podatku — wtedy `null`. */
  maksPunktow: number;
}

/**
 * Minimalne podniesienie podatku do zera (czysta funkcja). `brak` = ile brakuje skarbcowi po turze
 * (dodatnie), `punktyDostepne` = o ile punktów % podatek może wzrosnąć, `zyskPelny` = dodatkowy
 * przychód skarbca przy podniesieniu o wszystkie `punktyDostepne` (z `NnsEndTurnLevers`).
 * Zakłada liniowość przychodu od udziału podatku (ESTYMACJA; wołający weryfikuje po ticku).
 * Zwraca `null`, gdy nawet pełny podatek nie wystarcza lub brak danych.
 */
export function propozycjaPodatkuDoZera(
  brak: number,
  punktyDostepne: number,
  zyskPelny: number,
): NnsPropozycjaPodatku | null {
  if (!(brak > 0) || !(punktyDostepne > 0) || !(zyskPelny > 0)) return null;
  const zyskNaPunkt = zyskPelny / punktyDostepne;
  const potrzeba = Math.ceil(brak / zyskNaPunkt);
  if (potrzeba > punktyDostepne) return null;
  return { punktyProcentowe: Math.max(1, potrzeba), szacunek: 'liniowy', maksPunktow: punktyDostepne };
}

/**
 * Wyszukiwanie po krokach suwaka podatku (kroki po 10 pkt %, R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1
 * runda 2, punkt 3). `prognozaPoPodatku(pkt)` = skarbiec po turze przy podniesieniu podatku o `pkt` pkt %
 * (ta sama funkcja projekcji co bramka). Zwraca NAJMNIEJSZY krok (10, 20, ... , maksimum), dla którego
 * prognoza ≥ 0, albo `null` (flaga „niewystarczające” po stronie wołającego: nawet maksimum nie wystarcza).
 * Czysta funkcja: nie modyfikuje stanu gry — callback musi być bezskutkowy.
 */
export function propozycjaPodatkuKrokami(
  prognozaPoPodatku: (punktyProcentowe: number) => number,
  punktyDostepne: number,
  krok = 10,
): NnsPropozycjaPodatku | null {
  if (!(punktyDostepne > 0) || !(krok > 0)) return null;
  for (let pkt = krok; ; pkt += krok) {
    const p = Math.min(pkt, punktyDostepne);
    if (prognozaPoPodatku(p) >= 0) {
      return { punktyProcentowe: p, szacunek: 'krokowy', maksPunktow: punktyDostepne };
    }
    if (p >= punktyDostepne) return null;
  }
}

const OPIS_DZWIGNI_ID: Record<string, string> = {
  'podatek-skarbiec': 'podatek złota',
  'suwak-zywnosc': 'obniżka racji żywności',
  'rozwiaz-skarbiec': 'rozwiązanie jednostek (złoto)',
  'rozwiaz-spichlerz': 'rozwiązanie jednostek (żywność)',
};

function opisDzwigni(l: NnsLever): string {
  const jednostka = l.stock === 'skarbiec' ? 'złota' : 'żywności';
  return `${OPIS_DZWIGNI_ID[l.id] ?? l.id}: +${fmt(l.zysk)} ${jednostka}/turę`;
}

/** Stały komunikat bramki: co na minusie (zasób i kwota), które dźwignie pomogą (liczby z projekcji). */
export function komunikatBramki(brakuje: readonly NnsBrak[], dzwignie: readonly NnsGateLever[]): string {
  const linie = brakuje.map(b => `${NAZWA[b.stock]}: po zakończeniu tury zabraknie ${fmt(b.ile)}`);
  const pomoga = dzwignie.length > 0 ? dzwignie.map(d => d.opis).join('; ') : 'brak';
  return 'Nie można zakończyć tury. ' + linie.join('; ') + '. Pomogą: ' + pomoga + '.';
}

// ---------------------------------------------------------------------------
// R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (C3) — jednostki jako dźwignie (per jednostka, nie średnia).
// ---------------------------------------------------------------------------

/** Jednostka AI opisana dla planera: koszt utrzymania w złocie i żywności per jednostka. */
export interface NnsAiUnitInfo {
  id: string;
  /** Utrzymanie złota/turę tej jednostki (tabela units.json × mnożniki, nie średnia). */
  zloto: number;
  /** Żywność/turę tej jednostki. */
  zywnosc: number;
  /** true = jednostka obronna (garnizon, jednostka w mieście własnym, wódz, oblężenie) — nigdy nie rozwiązywana. */
  obronna: boolean;
}

/** Rozdziela jednostki na dźwignie (id `<unit>|g` = złoto, `<unit>|f` = żywność). */
export function nnsAiUnitLeverInputs(units: readonly NnsAiUnitInfo[]): Pick<NnsAiLeverInput, 'jednostkiWsparcia' | 'jednostkiObronne'> {
  const wsparcie: Array<{ id: string; stock: NnsStock; zysk: number; koszt: number }> = [];
  const obronne: Array<{ id: string; stock: NnsStock; zysk: number; koszt: number }> = [];
  for (const u of units) {
    const target = u.obronna ? obronne : wsparcie;
    if (u.zloto > 0) target.push({ id: u.id + '|g', stock: 'skarbiec', zysk: u.zloto, koszt: u.zloto });
    if (u.zywnosc > 0) target.push({ id: u.id + '|f', stock: 'spichlerz', zysk: u.zywnosc, koszt: u.zywnosc });
  }
  return { jednostkiWsparcia: wsparcie, jednostkiObronne: obronne };
}

/** Id jednostek (bez sufiksu stocka) wybranych w planie do rozwiązania, bez duplikatów, w kolejności planu. */
export function nnsUnitIdsFromPlan(plan: NnsAiPlan): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of plan.akcje) {
    if (a.rodzaj !== 'rozwiazanie') continue;
    const id = a.leverId.replace(/\|[gf]$/, '');
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
