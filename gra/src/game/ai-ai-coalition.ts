/**
 * ai-ai-coalition.ts -- R-WEB-AI-AI-COALITION-ANTI-LEADER-Q1 (etap B4 pakietu „twardsza dyplomacja").
 *
 * CZYSTA logika wykrywania LIDERA i premii koalicji antylidera. Bez DOM, main.ts, zegara i generatora losowego.
 *
 * Lider: cywilizacja (także gracz, owner 0) z NAJWIĘKSZĄ Mocą (ta sama miara co pasek Respektu: objectivePowerForOwner),
 * której Moc >= `liderProgPrzewagi` × średnia Mocy pozostałych głównych cywilizacji ORAZ jest liderem przez
 * >= `liderMinTur` kolejnych tur (seria). Remis na szczycie = brak lidera; średnia <= 0 = brak lidera.
 * Warunek niespełniony w danej turze zeruje serię (brak histerezy wyjścia — założenie, patrz raport).
 *
 * Premia koalicji (tor E3, ai-ai-alliance-tick.ts): para (p,t) dostaje premię w KOLEJNOŚCI WYBORU CELU, gdy
 * ani p, ani t nie jest sojusznikiem lidera oraz oba są w stanie wojny z liderem („wspólny wróg = lider").
 * Premia nie zmienia progów akceptacji (E1 evaluateTreatyOffer) i nie zmusza do wojny.
 *
 * PRZEŁĄCZNIK: `koalicjaAntyLiderAktywna` w gra/data/ai-ai-treaty-params.json (domyślnie true, decyzja właściciela 2026-11-19). Przy false
 * wołający nie przekazuje kontekstu koalicji i zachowanie gry jest identyczne jak przed B4.
 * Nadpisanie wyłącznie dla testów civTest: `setAiAiCoalitionEnabledForTest` (NIE z UI).
 */
import aiAiTreatyParamsJson from '../../data/ai-ai-treaty-params.json';

export interface AiAiCoalitionParams {
  /** Próg przewagi: Moc lidera >= prog × średnia Mocy pozostałych. */
  progPrzewagi: number;
  /** Minimalna liczba kolejnych tur bycia liderem. */
  minTur: number;
}

/** Stan wykrywania lidera (przekazywany między turami przez wołającego). */
export interface LiderKoalicjiStan {
  /** Potwierdzony lider (seria >= minTur) albo null. */
  lider: number | null;
  /** Kandydat aktualnej serii (może nie być jeszcze potwierdzony). */
  kandydat: number | null;
  /** Liczba kolejnych tur, w których kandydat spełnia warunek przewagi. */
  seria: number;
}

/** Kontekst koalicji przekazywany do kroku sojuszy (tylko gdy lider potwierdzony i flaga włączona). */
export interface AiAiCoalitionCtx {
  lider: number;
  /** Sojusznicy lidera (owner id). */
  sojusznicyLidera: ReadonlySet<number>;
  /** Cywilizacje w stanie wojny z liderem (owner id). */
  wrogowieLidera: ReadonlySet<number>;
}

let koalicjaNadpisanieTest: boolean | null = null;

/** Tylko testy (hak civTest). null = wróć do wartości z danych. */
export function setAiAiCoalitionEnabledForTest(value: boolean | null): void {
  koalicjaNadpisanieTest = value;
}

/** Czy koalicja antylidera jest włączona. Domyślnie true (dane: koalicjaAntyLiderAktywna). */
export function isAiAiCoalitionEnabled(): boolean {
  if (koalicjaNadpisanieTest !== null) return koalicjaNadpisanieTest;
  return (aiAiTreatyParamsJson as { koalicjaAntyLiderAktywna?: unknown }).koalicjaAntyLiderAktywna === true;
}

/** Parametry lidera z danych (liderProgPrzewagi, liderMinTur). */
export function loadAiAiCoalitionParams(): AiAiCoalitionParams {
  const d = aiAiTreatyParamsJson as { liderProgPrzewagi?: unknown; liderMinTur?: unknown };
  return {
    progPrzewagi: typeof d.liderProgPrzewagi === 'number' ? d.liderProgPrzewagi : 1.5,
    minTur: typeof d.liderMinTur === 'number' ? d.liderMinTur : 5,
  };
}

export function initLiderKoalicjiStan(): LiderKoalicjiStan {
  return { lider: null, kandydat: null, seria: 0 };
}

/**
 * Jedna aktualizacja na turę. `moce`: ownerId -> Moc obiektywna (w tym gracz 0). Czysta funkcja: nie zmienia wejścia.
 */
export function aktualizujLidera(
  stan: LiderKoalicjiStan,
  moce: ReadonlyMap<number, number>,
  params: AiAiCoalitionParams,
): LiderKoalicjiStan {
  const wpisy = Array.from(moce.entries());
  if (wpisy.length < 2) return initLiderKoalicjiStan();

  let maxMoc = -Infinity;
  for (const [, m] of wpisy) if (m > maxMoc) maxMoc = m;
  const szczyt = wpisy.filter(([, m]) => m === maxMoc);
  // Remis na szczycie: nie ma jednoznacznego lidera.
  if (szczyt.length !== 1) return initLiderKoalicjiStan();
  const kandydat = szczyt[0]![0];

  let suma = 0;
  let inni = 0;
  for (const [oid, m] of wpisy) {
    if (oid === kandydat) continue;
    suma += m;
    inni++;
  }
  const srednia = inni > 0 ? suma / inni : 0;
  // Brak średniej (pozostali bez Mocy) = brak wiarygodnej przewagi.
  if (!(srednia > 0) || !(maxMoc >= params.progPrzewagi * srednia)) return initLiderKoalicjiStan();

  const seria = stan.kandydat === kandydat ? stan.seria + 1 : 1;
  const lider = seria >= params.minTur ? kandydat : null;
  return { lider, kandydat, seria };
}

/** Buduje kontekst koalicji z potwierdzonego lidera; null gdy brak lidera. */
export function budujKontekstKoalicji(
  stan: LiderKoalicjiStan,
  sojusznicyLidera: ReadonlySet<number>,
  wrogowieLidera: ReadonlySet<number>,
): AiAiCoalitionCtx | null {
  if (stan.lider === null) return null;
  return { lider: stan.lider, sojusznicyLidera, wrogowieLidera };
}

/** Premia w kolejności wyboru celu: para (p,t) poza liderem, bez sojuszników lidera, oba wrogami lidera. */
export function maPremieKoalicji(p: number, t: number, ctx: AiAiCoalitionCtx | null | undefined): boolean {
  if (!ctx) return false;
  if (p === ctx.lider || t === ctx.lider) return false;
  if (ctx.sojusznicyLidera.has(p) || ctx.sojusznicyLidera.has(t)) return false;
  return ctx.wrogowieLidera.has(p) && ctx.wrogowieLidera.has(t);
}
