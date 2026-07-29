/**
 * Formatowanie komórek bilansu skarbca (panel ZASOBY IMPERIUM).
 * Osobny moduł — testowalny bez ciężkiego UI (brand SVG itd.).
 */
import { signedPl } from './formatPl';

/** Bilans skarbca — jawne 0 zamiast „—" (signedTxt ukrywa zero dla surowców). */
export function treasuryBalanceSignedTxt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const r = Math.round(n);
  if (r === 0) return '0';
  return signedPl(r);
}
