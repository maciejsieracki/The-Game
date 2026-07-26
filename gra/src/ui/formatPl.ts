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

/**
 * Liczba DO WYŚWIETLENIA — obcina śmieci zmiennoprzecinkowe (Maciej 2026-07-26:
 * w pasku miasta pokazywało się „Skarbiec +6.600000000000005").
 *
 * ⚠️ Wyłącznie prezentacja. Zaokrąglenie NIE wraca do stanu gry — silnik liczy
 * dalej na pełnej wartości, więc grosze nie giną w kolejnych turach (właściciel:
 * „trzeba pamiętać, żeby dane się nie traciły przy zaokrągleniu").
 *
 * `maxMiejsca` = maksymalna liczba miejsc po przecinku (domyślnie 1). Końcowe
 * zera znikają: 6,6000000000001 → „6,6"; 7,0 → „7"; 0,04 → „0" (przy 1 miejscu).
 * Separator dziesiętny polski (przecinek), bo cała gra jest po polsku.
 */
export function formatLiczbaPl(n: number, maxMiejsca = 1): string {
  if (!Number.isFinite(n)) return '0';
  const zaokr = Number(n.toFixed(Math.max(0, Math.min(6, maxMiejsca))));
  // -0 po zaokrągleniu (np. -0,04 przy 1 miejscu) ma się pokazać jako „0".
  const bezMinusZera = Object.is(zaokr, -0) ? 0 : zaokr;
  return String(bezMinusZera).replace('.', ',');
}

/** Liczba ze znakiem do chipów HUD/miasta: „+6,6", „0", „−3,5". */
export function signedPl(n: number, maxMiejsca = 1): string {
  const txt = formatLiczbaPl(n, maxMiejsca);
  return txt.startsWith('-') || txt === '0' ? txt : '+' + txt;
}
