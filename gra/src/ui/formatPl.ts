/** Odmiana „jednostka" (1 / 2–4 / 5+). */
export function formatJednostkiCount(n: number): string {
  const word = n === 1 ? 'jednostka' : n >= 2 && n <= 4 ? 'jednostki' : 'jednostek';
  return `${n} ${word}`;
}

/** Nagłówek stosu na heksie: „Armia — 2 jednostki". */
export function formatArmiaLabel(n: number): string {
  return `Armia — ${formatJednostkiCount(n)}`;
}

/** Tooltip listy armii: „Zaznacz armię — 2 jednostki". */
export function formatZaznaczArmieLabel(n: number): string {
  return `Zaznacz armię — ${formatJednostkiCount(n)}`;
}
