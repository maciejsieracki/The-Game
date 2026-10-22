/** Odmiana „jednostka" (1 / 2–4 / 5+). */
export function formatJednostkiCount(n: number): string {
  const word = n === 1 ? 'jednostka' : n >= 2 && n <= 4 ? 'jednostki' : 'jednostek';
  return `${n} ${word}`;
}

/** Nagłówek stosu na heksie: „Armia — 2 jednostki". */
export function formatArmiaLabel(n: number): string {
  return `Armia — ${formatJednostkiCount(n)}`;
}

/** Odmiana „miasto" (1 / 2–4 / 5+) — pasmo podsumowania panelu Miasta
 *  (MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §4.2, hero „N miast"). */
export function formatMiastaCount(n: number): string {
  const word = n === 1 ? 'miasto' : n >= 2 && n <= 4 ? 'miasta' : 'miast';
  return `${n} ${word}`;
}

/** Odmiana „kolejka" (1 / 2–4 / 5+) — podpis „N kolejek w toku" w tym samym paśmie. */
export function formatKolejkiCount(n: number): string {
  const word = n === 1 ? 'kolejka' : n >= 2 && n <= 4 ? 'kolejki' : 'kolejek';
  return `${n} ${word}`;
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

/**
 * Liczba ze znakiem do chipów HUD/miasta: „+6,6", „0", „−3,5".
 *
 * Ujemne wartości używają U+2212 (matematyczny minus), NIE ASCII „-" (0x2D) —
 * spójnie z resztą gry (np. `formatCityGrowthPercentLabel` w
 * `render/cityMapStatChip.ts`). `formatLiczbaPl` (baza tej funkcji) sama
 * zwraca zwykły ASCII myślnik — podmiana glifu jest świadomie tylko tutaj,
 * bo `formatLiczbaPl` ma własnych konsumentów, którzy asercjonują ASCII
 * (P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD, `city-panel-growth-percent-separator-test.cjs`).
 */
export function signedPl(n: number, maxMiejsca = 1): string {
  const txt = formatLiczbaPl(n, maxMiejsca);
  if (txt.startsWith('-')) return '−' + txt.slice(1);
  return txt === '0' ? txt : '+' + txt;
}
