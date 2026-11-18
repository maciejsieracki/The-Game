// R-WEB-DIPLO-ZERO-TRUST-TREATY-BREAK-PROTECTOR-Q1 (etap C, część 1) — czysta logika "zerowego zaufania" za flagą.
// Flaga OFF (domyślnie, data/diplomacy-zero-trust-params.json) = brak zmian w zachowaniu gry.
//
// C-licznik: per para (AI → partner) licznik tur z Zaufaniem <= 0; rośnie co turę, zerowany gdy Zaufanie > 0.
//   Stan w pamięci modułu; reset przy nowej grze i wczytaniu (jak neighborSinceTurn). NIE jest w SaveGame (decyzja ABC).
// C2 zerwanie: licznik >= zeroZaufaniaProgTur → AI zrywa umowy handlowe i NAP z partnerem (main.ts, przez breakTreatyVoluntarily).
// C1 protektor: licznik >= 1 i AI słabsza militarnie od partnera → premia celu dla najsilniejszej trzeciej głównej
//   cywilizacji niebędącej partnerem (tylko kolejność celu w ai-ai-alliance-tick.ts; progi E1 bez zmian).

import zeroTrustParamsJson from '../../data/diplomacy-zero-trust-params.json';

export interface ZeroTrustParams {
  zeroZaufaniaAktywna: boolean;
  zeroZaufaniaProgTur: number;
}

export const ZERO_TRUST_PARAMS: ZeroTrustParams = zeroTrustParamsJson as ZeroTrustParams;

let flagOverride: boolean | null = null;

/** Tylko testy (hak civTest, NIE z UI). null = wróć do wartości z danych. */
export function setZeroTrustEnabledForTest(value: boolean | null): void {
  flagOverride = value;
}

export function isZeroTrustEnabled(): boolean {
  if (flagOverride !== null) return flagOverride;
  return ZERO_TRUST_PARAMS.zeroZaufaniaAktywna === true;
}

/** Próg zerwania w turach (z danych). */
export function zeroZaufaniaProgTur(): number {
  return ZERO_TRUST_PARAMS.zeroZaufaniaProgTur;
}

/** Klucz licznika: kierunkowy (AI → partner). */
function kluczZera(ai: number, partner: number): string {
  return `${ai}>${partner}`;
}

const licznikZera = new Map<string, number>();

/** Zerwania wykonane od startu gry/wczytania (hak odczytowy, tylko odczyt pomiaru). */
let zerwaniaLacznie = 0;
const zerwaniaLog: Array<{ turn: number; ai: number; partner: number; typy: string[] }> = [];

/** Aktualna wartość licznika zerowego zaufania (AI → partner); 0 gdy brak. */
export function zeroTrustCount(ai: number, partner: number): number {
  return licznikZera.get(kluczZera(ai, partner)) ?? 0;
}

/**
 * Krok licznika dla jednej pary (AI → partner), raz na turę. Zaufanie <= 0 → +1; > 0 → zerowanie.
 * Zaufanie nieskończone/NaN → licznik bez zmian. Zwraca nową wartość licznika.
 */
export function zeroTrustAdvancePair(ai: number, partner: number, zaufanie: number): number {
  if (ai === partner) return 0;
  const k = kluczZera(ai, partner);
  if (!Number.isFinite(zaufanie)) return licznikZera.get(k) ?? 0;
  if (zaufanie > 0) {
    licznikZera.delete(k);
    return 0;
  }
  const nowy = (licznikZera.get(k) ?? 0) + 1;
  licznikZera.set(k, nowy);
  return nowy;
}

/** Czy para (AI → partner) osiągnęła próg zerwania. */
export function zeroTrustBreakDue(ai: number, partner: number, progTur: number = zeroZaufaniaProgTur()): boolean {
  return zeroTrustCount(ai, partner) >= progTur;
}

/**
 * C1: wybór protektora dla AI `p` (czysta funkcja). Aktywne tylko gdy `p` ma licznik >= 1 wobec co najmniej
 * jednego partnera silniejszego militarnie. Cel = najsilniejsza (wg Mocy, przy remisie najniższe id, bo owners
 * rosnąco) główna cywilizacja z `owners` inna niż `p` i niż partnerzy. Zwraca null, gdy premia nie dotyczy `p`.
 */
export function zeroTrustPreferredTarget(
  p: number,
  owners: readonly number[],
  partners: readonly number[],
  powerOf: (oid: number) => number,
): number | null {
  const mocP = powerOf(p);
  const aktywni = partners.filter(q => q !== p && zeroTrustCount(p, q) >= 1 && mocP < powerOf(q));
  if (aktywni.length === 0) return null;
  let best: number | null = null;
  let bestMoc = -Infinity;
  for (const t of owners) {
    if (t === p || aktywni.includes(t)) continue;
    const m = powerOf(t);
    if (best === null || m > bestMoc) {
      best = t;
      bestMoc = m;
    }
  }
  return best;
}

/** Rejestruje wykonane zerwanie (hak odczytowy). */
export function zeroTrustRecordBreak(turn: number, ai: number, partner: number, typy: string[]): void {
  zerwaniaLacznie++;
  zerwaniaLog.push({ turn, ai, partner, typy: [...typy] });
}

/** Odczyt pomiaru: liczba zerwań i ich tury (kopia, bez wpływu na stan). */
export function zeroTrustStats(): { zerwania: number; log: Array<{ turn: number; ai: number; partner: number; typy: string[] }> } {
  return { zerwania: zerwaniaLacznie, log: zerwaniaLog.map(e => ({ ...e, typy: [...e.typy] })) };
}

/** Czyści cały stan: nowa gra i wczytanie zapisu (stan NIE trafia do SaveGame). */
export function resetZeroTrustSession(): void {
  licznikZera.clear();
  zerwaniaLacznie = 0;
  zerwaniaLog.length = 0;
}
