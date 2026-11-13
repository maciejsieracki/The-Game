/**
 * R-WEB-HUD-NUMBER-ABBREV-Q1 — JEDNA wspólna funkcja skracania dużych liczb w HUD.
 *
 * Reguły: |n| < 1000 → bez zmian (jak dotąd: całkowite „999", ułamki przez `formatLiczbaPl`,
 * 1 miejsce); od 1000 forma z sufiksem i JEDNYM miejscem po przecinku (przecinek polski),
 * bez zbędnego „,0": 1200 → „1,2k", 20860 → „20,9k", 1000 → „1k", 3042 → „3k",
 * 1 250 000 → „1,3M". Zaokrąglenie zwykłe (half-up na wartości bezwzględnej, symetrycznie
 * dla ujemnych → „-1,2k", ASCII minus), a wynik „1000k" awansuje do następnej jednostki
 * (999 950 → „1M"). NaN/±Infinity/undefined → „0" (ten sam bezpieczny fallback co
 * `formatLiczbaPl`).
 *
 * ⚠️ Wyłącznie prezentacja — NIE do pól edytowalnych/suwaków, kosztów, numerów tur ani ID.
 * Pełną wartość pokazuj w `title`/`aria-label` przez `formatFullNumber`.
 */
import { formatLiczbaPl, signedPl } from './formatPl';

const COMPACT_UNITS: ReadonlyArray<readonly [number, string]> = [
  [1_000, 'k'],
  [1_000_000, 'M'],
  [1_000_000_000, 'B'],
];

/** Skrócona wartość bezwzględna albo null, gdy liczba zostaje „zwykła" (< 1000). */
function compactBody(abs: number): string | null {
  // Liczba, która po zaokrągleniu do 1 miejsca nadal jest < 1000, zostaje zwykła.
  if (Math.round(abs * 10) / 10 < 1000) return null;
  for (let i = 0; i < COMPACT_UNITS.length; i++) {
    const entry = COMPACT_UNITS[i];
    if (!entry) continue;
    const [unit, suffix] = entry;
    const tenths = Math.round(abs / (unit / 10)); // dziesiąte części jednostki
    if (tenths >= 10_000 && i < COMPACT_UNITS.length - 1) continue; // „1000k" → następna jednostka
    const whole = Math.floor(tenths / 10);
    const frac = tenths % 10;
    return (frac === 0 ? String(whole) : `${whole},${frac}`) + suffix;
  }
  return null;
}

export function formatCompactNumber(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0';
  const body = compactBody(Math.abs(n));
  if (body === null) return Number.isInteger(n) ? String(n) : formatLiczbaPl(n, 1);
  return (n < 0 ? '-' : '') + body;
}

/** Wersja „ze znakiem" do przyrostów: „+1,3k", „−1,2k" (U+2212), „0"; < 1000 jak `signedPl`. */
export function formatCompactSigned(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0';
  const body = compactBody(Math.abs(n));
  if (body === null) return signedPl(n);
  return (n < 0 ? '−' : '+') + body;
}

/** Pełna wartość z separatorem tysięcy (NBSP) do `title`/`aria-label`: 20860 → „20 860". */
export function formatFullNumber(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0';
  const txt = formatLiczbaPl(n, 1);
  const neg = txt.startsWith('-');
  const [int = '0', dec] = (neg ? txt.slice(1) : txt).split(',');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '−' : '') + grouped + (dec ? ',' + dec : '');
}

/** Tekst „Dokładnie: 20 860 (+1 257)" do `title`/`aria-label`, albo '' gdy nic nie skrócono. */
export function exactCompactNote(value?: number, rate?: number): string {
  const vCompact = value !== undefined && compactBody(Math.abs(Number.isFinite(value) ? value : 0)) !== null;
  const rCompact = rate !== undefined && compactBody(Math.abs(Number.isFinite(rate) ? rate : 0)) !== null;
  if (!vCompact && !rCompact) return '';
  const parts: string[] = [];
  if (value !== undefined) parts.push(formatFullNumber(value));
  if (rate !== undefined) {
    const full = formatFullNumber(rate);
    parts.push(`(${rate > 0 ? '+' : ''}${full})`);
  }
  return 'Dokładnie: ' + parts.join(' ');
}
