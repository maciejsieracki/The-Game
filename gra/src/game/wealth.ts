/**
 * wealth.ts
 * System WEALTH (zamoznosc spoleczenstwa) -- czysty modul, bez DOM/THREE, ZERO importow.
 *
 * Idea (ustalenia Maciej, 2026-06-24): strumien "Spoleczenstwo" (dawny Luksus, czyli czesc
 * pieniadza miasta zostawiona obywatelom) znika do PULI Wealth. Pula -> poziomy Wealth (jak
 * zywnosc -> populacja). Poziom Wealth MNOZY strumien podatku (skarbiec). Utrzymanie poziomu
 * kosztuje co ture (% pieniadza miasta) i rosnie z poziomem; gdy wplyw < utrzymanie -> pula
 * maleje -> poziom spada. Daje trade-off: nizsze podatki -> wyzszy Wealth -> dlugofalowo
 * wiekszy skarbiec; ale krotkoterminowo mniej gotowki na wojsko/nauke.
 *
 * Zrodla: EKONOMIA/EKONOMIA-wealth-projekt.md (model + symulacje), Spec-ekonomia.md s.2.
 *
 * Decyzje (skrot): per MIASTO; mnoznik tylko na strumien podatku (skarbiec); mnoznik=1+(W-1)*k,
 * min x1; W startuje na 1 (=x1); zadowolenie: W0->kara, co +10 poziomow -> +1 zadowolony;
 * spadek: bufor puli, potem -1 poziom przy puli=0; pula po awansie zostaje % (jak Spichlerz);
 * cap = epoka*10; prog awansu liniowy *(L+1)*epoka; utrzymanie = (baza + (W/cap)*(przyCap-baza)) * pieniadz.
 *
 * Parametry strojone per poziom trudnosci -> econ-params.json grupa "wealth".
 * Kod ASCII; bezpieczne fallbacki (jeden zly wiersz nie wywali tury).
 */

// ---------------------------------------------------------------------------
// Poziom trudnosci + parametry
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface WealthParams {
  /** cap poziomu = epoka * capNaEpoke (domyslnie 10 -> epoka1=10 ... epoka10=100). */
  capNaEpoke:           number;
  /** Prog awansu L->L+1 = progNaPoziom * (L+1) * epoka. */
  progNaPoziom:         number;
  /** Mnoznik podatku = 1 + (W-1) * mnoznikNaPoziom (min x1). */
  mnoznikNaPoziom:      number;
  /** Udzial spoleczenstwa potrzebny do utrzymania przy W=0 (rownowaga bazowa). */
  utrzymanieBaza:       number;
  /** Udzial spoleczenstwa potrzebny do utrzymania przy W=cap. */
  utrzymaniePrzyCap:    number;
  /** Ulamek puli zachowany po awansie poziomu (jak Spichlerz). */
  zachowaniePoAwansie:  number;
  /** Ilu zadowolonych mieszkancow daje kazde 10 poziomow Wealth. */
  zadowolenieNa10pkt:   number;
  /** Wklad do zadowolenia przy W=0 (kara za biede; ujemny). */
  karaZero:             number;
}

/** Domyslne wartosci (poziom 'normal'); uzywane jako fallback. */
export const FALLBACK_WEALTH_PARAMS: WealthParams = {
  capNaEpoke:          10,
  progNaPoziom:        4.5,
  mnoznikNaPoziom:     0.15,
  utrzymanieBaza:      0.20,
  utrzymaniePrzyCap:   0.40,
  zachowaniePoAwansie: 0.5,
  zadowolenieNa10pkt:  1,
  karaZero:            -2,
};

type RawRow = Record<string, number | string | undefined>;
export interface RawWealthParamsJson {
  wealth?: Record<string, RawRow>;
}

/**
 * Odczytaj WealthParams z econ-params.json (grupa "wealth") dla danej trudnosci.
 * Brak/zly wpis -> fallback z FALLBACK_WEALTH_PARAMS.
 */
export function loadWealthParams(
  raw: RawWealthParamsJson,
  difficulty: Difficulty = 'normal',
): WealthParams {
  const g = raw.wealth ?? {};
  const read = (key: string, fallback: number): number => {
    const row = g[key];
    const v   = row ? row[difficulty] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };
  return {
    capNaEpoke:          read('wealth_cap_na_epoke',          FALLBACK_WEALTH_PARAMS.capNaEpoke),
    progNaPoziom:        read('wealth_prog_na_poziom',        FALLBACK_WEALTH_PARAMS.progNaPoziom),
    mnoznikNaPoziom:     read('wealth_mnoznik_na_poziom',     FALLBACK_WEALTH_PARAMS.mnoznikNaPoziom),
    utrzymanieBaza:      read('wealth_utrzymanie_baza',       FALLBACK_WEALTH_PARAMS.utrzymanieBaza),
    utrzymaniePrzyCap:   read('wealth_utrzymanie_przy_cap',   FALLBACK_WEALTH_PARAMS.utrzymaniePrzyCap),
    zachowaniePoAwansie: read('wealth_zachowanie_po_awansie', FALLBACK_WEALTH_PARAMS.zachowaniePoAwansie),
    zadowolenieNa10pkt:  read('wealth_zadowolenie_na_10pkt',  FALLBACK_WEALTH_PARAMS.zadowolenieNa10pkt),
    karaZero:            read('wealth_kara_zero',             FALLBACK_WEALTH_PARAMS.karaZero),
  };
}

// ---------------------------------------------------------------------------
// Funkcje skladowe (czyste, latwo testowalne)
// ---------------------------------------------------------------------------

/** Maksymalny poziom Wealth w danej epoce. */
export function wealthCap(epoka: number, p: WealthParams): number {
  return Math.max(0, Math.floor(epoka)) * p.capNaEpoke;
}

/** Mnoznik strumienia podatku: 1 + (W-1)*k, nie mniej niz 1. */
export function wealthMnoznik(poziom: number, p: WealthParams): number {
  return Math.max(1, 1 + (poziom - 1) * p.mnoznikNaPoziom);
}

/**
 * Wklad Wealth do zadowolenia miasta (w "zadowolonych mieszkancach").
 * W=0 -> karaZero (bieda); inaczej floor(W/10)*zadowolenieNa10pkt (W10->+1 ... W100->+10).
 */
export function wealthZadowolenie(poziom: number, p: WealthParams): number {
  if (poziom <= 0) return p.karaZero;
  return Math.floor(poziom / 10) * p.zadowolenieNa10pkt;
}

/**
 * Udzial pieniadza miasta, jaki spoleczenstwo musi dostac, by UTRZYMAC poziom W:
 *   rownowaga(W) = baza + (W/cap) * (przyCap - baza)
 * (20% przy W=0 -> 40% przy cap, dla normal). Powyzej -> Wealth rosnie; ponizej -> spada.
 */
export function wealthRownowaga(poziom: number, epoka: number, p: WealthParams): number {
  const cap = wealthCap(epoka, p);
  if (cap <= 0) return p.utrzymaniePrzyCap;
  const frac = Math.min(1, Math.max(0, poziom / cap));
  return p.utrzymanieBaza + frac * (p.utrzymaniePrzyCap - p.utrzymanieBaza);
}

/** Pula potrzebna do awansu z poziomu L na L+1: progNaPoziom*(L+1)*epoka. */
export function wealthProg(poziom: number, epoka: number, p: WealthParams): number {
  return p.progNaPoziom * (poziom + 1) * Math.max(1, Math.floor(epoka));
}

// ---------------------------------------------------------------------------
// Stan + tick
// ---------------------------------------------------------------------------

export interface WealthState {
  poziom: number;  // aktualny poziom Wealth (0..cap)
  pula:   number;  // skumulowana pula (srodki spoleczne) ku nastepnemu poziomowi
}

export interface WealthTickResult {
  poziom:      number;   // poziom po turze
  pula:        number;   // pula po turze
  mnoznik:     number;   // mnoznik strumienia podatku (do economy, 6B)
  zadowolenie: number;   // wklad do zadowolenia miasta (dla MIASTO/order)
  awans:       number;   // o ile poziomow w gore w tej turze
  spadek:      number;   // o ile poziomow w dol w tej turze
}

/**
 * Przesun Wealth o jedna ture (per miasto).
 *
 * @param state         biezacy stan {poziom, pula}
 * @param spoleczMoney  pieniadz przeznaczony na spoleczenstwo (wejscie do puli) = udzial_suwaka * pieniadz_miasta
 * @param miastoMoney   calkowity pieniadz miasta tej tury (do policzenia kosztu utrzymania)
 * @param epoka         numer epoki (1..10) -> cap i prog
 * @param p             parametry Wealth
 *
 * Kolejnosc: utrzymanie (decay = rownowaga*miastoMoney) -> pula += spol - decay;
 * gdy pula<0 -> pula=0 i -1 poziom (9A bufor->spadek); awanse dopoki pula>=prog i poziom<cap,
 * po kazdym awansie pula *= zachowaniePoAwansie.
 */
export function advanceWealth(
  state: WealthState,
  spoleczMoney: number,
  miastoMoney: number,
  epoka: number,
  p: WealthParams,
): WealthTickResult {
  const cap = wealthCap(epoka, p);
  let poziom = Math.min(cap, Math.max(0, Math.floor(state.poziom)));
  let pula   = Math.max(0, Number.isFinite(state.pula) ? state.pula : 0);

  const spol  = Number.isFinite(spoleczMoney) ? Math.max(0, spoleczMoney) : 0;
  const M     = Number.isFinite(miastoMoney)  ? Math.max(0, miastoMoney)  : 0;

  // --- utrzymanie / decay ---
  const decay = wealthRownowaga(poziom, epoka, p) * M;
  pula += spol - decay;

  let spadek = 0;
  if (pula < 0) {
    pula = 0;
    if (poziom > 0) { poziom -= 1; spadek = 1; }   // bufor wyczerpany -> -1 poziom (9A)
  }

  // --- awanse ---
  let awans = 0;
  while (poziom < cap) {
    const prog = wealthProg(poziom, epoka, p);
    if (pula >= prog) {
      pula  -= prog;
      poziom += 1;
      pula   = Math.floor(pula * p.zachowaniePoAwansie);
      awans += 1;
    } else {
      break;
    }
  }

  return {
    poziom,
    pula,
    mnoznik:     wealthMnoznik(poziom, p),
    zadowolenie: wealthZadowolenie(poziom, p),
    awans,
    spadek,
  };
}

/** Swiezy stan startowy miasta: Wealth = 1 (mnoznik x1), pusta pula. */
export function freshWealthState(): WealthState {
  return { poziom: 1, pula: 0 };
}
