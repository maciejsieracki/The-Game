// R-WEB-DIPLO-HARDER-RELATIONS-A-NEIGHBOR-TENSION-Q1 (etap 1, część A) — czysta logika
// "twardszej dyplomacji" za flagą. Flaga OFF (domyślnie) = brak zmian w zachowaniu gry.
// Parametry: gra/data/diplomacy-harder-params.json.
//
// A1 narastające napięcie graniczne: kara za wspólną granicę rośnie o `granicaPrzyrost`
//    co `granicaOkresTur` tur trwania sąsiedztwa bez NAP/sojuszu, do `granicaMax` (łącznie).
// A2 handel to nie przyjaźń: Zaufanie bez NAP/sojuszu nie rośnie ponad `handelSufitZaufania`.
// A3 zazdrość wobec lidera: najsilniejsza Moc dostaje od każdej AI bez sojuszu `zazdroscNaTure`
//    (`zazdroscNaTureDuza` gdy przewaga nad drugą ≥ `zazdroscProgPrzewagi`).

import harderParamsJson from '../../data/diplomacy-harder-params.json';

export interface HarderDiplomacyParams {
  twardaDyplomacjaAktywna: boolean;
  granicaPrzyrost: number;
  granicaOkresTur: number;
  granicaMax: number;
  handelSufitZaufania: number;
  zazdroscNaTure: number;
  zazdroscProgPrzewagi: number;
  zazdroscNaTureDuza: number;
}

export const HARDER_PARAMS: HarderDiplomacyParams = harderParamsJson as HarderDiplomacyParams;

/** Flaga domyślna: OFF. Nie włączać bez decyzji właściciela po pomiarze (ABC). */
export const DIPLO_HARDER_ENABLED_DEFAULT = false;

let flagOverride: boolean | null = null;

/** Tylko testy/diagnostyka (hak testowy, NIE z UI). null = wróć do stałej. */
export function setHarderDiplomacyEnabledForTest(value: boolean | null): void {
  flagOverride = value;
}

export function isHarderDiplomacyEnabled(): boolean {
  if (flagOverride !== null) return flagOverride;
  return DIPLO_HARDER_ENABLED_DEFAULT;
}

/**
 * A1: dodatkowa kara za granicę (wartość ≤ 0) po `tenureTur` turach sąsiedztwa bez NAP/sojuszu.
 * floor(tenure / okres) × przyrost, ucięte do granicaMax. Zero dla tenure < okres.
 */
export function napieciePenaltyZaTure(
  tenureTur: number,
  p: HarderDiplomacyParams = HARDER_PARAMS,
): number {
  if (!Number.isFinite(tenureTur) || tenureTur <= 0 || p.granicaOkresTur <= 0) return 0;
  const kroki = Math.floor(tenureTur / p.granicaOkresTur);
  const surowo = kroki * p.granicaPrzyrost;
  return -Math.min(surowo, Math.abs(p.granicaMax));
}

/**
 * A1 — licznik trwania sąsiedztwa per para (klucz = diploPairKey). Tura startu zapamiętana przy
 * pierwszym odczycie w sąsiedztwie bez NAP/sojuszu; kasowana, gdy sąsiedztwo ustaje albo pojawia
 * się NAP/sojusz. Idempotentne w obrębie tury (odczyty UI nie przesuwają licznika).
 * Stan NIE jest zapisywany w SaveGame (zob. raport — luka do decyzji).
 */
const neighborSinceTurn = new Map<string, number>();

export function neighborTenureTur(
  key: string,
  turn: number,
  sasiedztwoBezPokoju: boolean,
): number {
  if (!sasiedztwoBezPokoju) {
    neighborSinceTurn.delete(key);
    return 0;
  }
  let since = neighborSinceTurn.get(key);
  // Tura cofnięta (nowa gra od tury 1 albo wczytanie wcześniejszego zapisu) = licznik od nowa.
  if (since === undefined || since > turn) {
    since = turn;
    neighborSinceTurn.set(key, since);
  }
  return Math.max(0, turn - since);
}

/** Czyści licznik A1: wywoływane przy nowej grze i przy wczytaniu zapisu (prepareSessionForLoad). */
export function resetNeighborTenureSession(): void {
  neighborSinceTurn.clear();
}

export function resetNeighborTenureForTest(): void {
  resetNeighborTenureSession();
}

/**
 * A1 w ctx pary: wynikowa kara za granicę = kara bazowa (-3/-4/-5, ≤ 0) + napięcie z tury,
 * ucięta do ŁĄCZNIE -granicaMax (dispatch: „do −6 łącznie"). Kara bazowa 0 (brak wspólnej granicy
 * albo karencja po pokoju/rozejmie) zostaje 0 — napięcie nie działa w karencji, licznik idzie dalej.
 */
export function karaGranicaZNapieciem(
  karaBazowa: number,
  tenureTur: number,
  p: HarderDiplomacyParams = HARDER_PARAMS,
): number {
  if (!(karaBazowa < 0)) return karaBazowa;
  const suma = karaBazowa + napieciePenaltyZaTure(tenureTur, p);
  return Math.max(suma, -Math.abs(p.granicaMax));
}

/**
 * A1+A3 w ctx pary (czysta funkcja; wywołuje ją main.ts tylko gdy flaga ON).
 */
export function harderPairDeltas(
  args: {
    karaBazowa: number;
    tenureTur: number;
    czyParaZLiderem: boolean;
    partnerToGracz: boolean;
    sojuszZLiderem: boolean;
    mocLidera: number;
    mocDrugiego: number;
  },
  p: HarderDiplomacyParams = HARDER_PARAMS,
): { karaWspolnaGranicaDelta: number; zazdroscDelta: number } {
  return {
    karaWspolnaGranicaDelta: karaGranicaZNapieciem(args.karaBazowa, args.tenureTur, p),
    zazdroscDelta: zazdroscLidera(args, p),
  };
}

/**
 * A2: ograniczenie przyrostu Zaufania od handlu. Bez NAP/sojuszu dodatni przyrost nie wynosi
 * więcej niż wolne miejsce do sufitu; powyżej sufitu przyrost dodatni = 0 (nie cofa zaufania).
 */
export function capZaufanieZaHandel(
  zaufanieObecne: number,
  dZ: number,
  maPokojNapLubSojusz: boolean,
  p: HarderDiplomacyParams = HARDER_PARAMS,
): number {
  if (maPokojNapLubSojusz || dZ <= 0) return dZ;
  const headroom = Math.max(0, p.handelSufitZaufania - zaufanieObecne);
  return Math.min(dZ, headroom);
}

/**
 * A3: zazdrość lidera — Zaufanie/turę dla pary. 0 gdy: para nie zawiera lidera, partner jest
 * graczem (zazdrość dotyczy AI), partner jest sojusznikiem lidera albo brak Mocy lidera.
 * `mocLidera`/`mocDrugiego` — ta sama miara co pasek Respektu (objectivePowerForOwnerEffective).
 */
export function zazdroscLidera(
  args: {
    czyParaZLiderem: boolean;
    partnerToGracz: boolean;
    sojuszZLiderem: boolean;
    mocLidera: number;
    mocDrugiego: number;
  },
  p: HarderDiplomacyParams = HARDER_PARAMS,
): number {
  if (!args.czyParaZLiderem || args.partnerToGracz || args.sojuszZLiderem) return 0;
  if (!(args.mocLidera > 0)) return 0;
  const przewaga = args.mocDrugiego > 0
    ? (args.mocLidera - args.mocDrugiego) / args.mocDrugiego
    : Infinity;
  const duza = przewaga >= p.zazdroscProgPrzewagi;
  return -(duza ? p.zazdroscNaTureDuza : p.zazdroscNaTure);
}
