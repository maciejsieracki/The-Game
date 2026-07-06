/**
 * diplomacy-currency-trade.ts — kurs wymiany ¤ ↔ Praca (handel dyplomatyczny v1).
 * Maciej 2026-06-30: Rel 100 = 1:1; otrzymujesz = płacisz × (Rel ÷ 100).
 */
import diplomacyJson from '../../data/diplomacy.json';

export const HANDEL_KURS_RELACJA_BAZA = 100;

type HandelWalutaBlock = { kurs_relacja_baza?: number };

function loadKursBaza(): number {
  const block = (diplomacyJson as { handel_waluta?: HandelWalutaBlock }).handel_waluta;
  const v = block?.kurs_relacja_baza;
  return typeof v === 'number' && v > 0 ? v : HANDEL_KURS_RELACJA_BAZA;
}

const _kursBaza = loadKursBaza();

/** Ile otrzymasz (¤ lub Praca) za zapłaconą kwotę przy danej Relacji. */
export function diplomacyTradeReceiveAmount(
  payAmount: number,
  relacja: number,
  kursRelacjaBaza: number = _kursBaza,
): number {
  const pay = Math.max(0, payAmount);
  const rel = Math.max(1, relacja);
  return Math.floor(pay * (rel / kursRelacjaBaza));
}

/** Ile musisz zapłacić, żeby otrzymać targetAmount przy danej Relacji. */
export function diplomacyTradePayAmount(
  targetAmount: number,
  relacja: number,
  kursRelacjaBaza: number = _kursBaza,
): number {
  const target = Math.max(0, targetAmount);
  const rel = Math.max(1, relacja);
  return Math.ceil(target * (kursRelacjaBaza / rel));
}
