/** Odmiana „jednostka” z wyjątkiem 12–14: 1 / 2–4 / 5+. */
export function formatJednostkiCount(n: number): string {
  const lastDigit = Math.abs(n) % 10;
  const lastTwoDigits = Math.abs(n) % 100;
  const fewForm = lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14);
  const word = n === 1 ? 'jednostka' : fewForm ? 'jednostki' : 'jednostek';
  return `${n} ${word}`;
}

/**
 * Wybór formy rzeczownika po liczebniku (mianownik): 1 / 2–4 (z wyjątkiem 12–14) / 5+.
 * Dla innych przypadków podaj własne trzy formy (np. biernik: „turę / tury / tur”).
 */
export function pluralPl(n: number, one: string, few: string, many: string): string {
  const v = Math.abs(Math.floor(n));
  const m10 = v % 10;
  const m100 = v % 100;
  if (v === 1) return one;
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return few;
  return many;
}

/** „1 tura / 2 tury / 5 tur” (mianownik). */
export function formatTurCount(n: number): string {
  return `${n} ${pluralPl(n, 'tura', 'tury', 'tur')}`;
}

/** „za 1 turę / 2 tury / 5 tur” — wersja w bierniku (po „za”, „na”). */
export function formatTurCountAcc(n: number): string {
  return `${n} ${pluralPl(n, 'turę', 'tury', 'tur')}`;
}

/** „1 budynek / 2 budynki / 5 budynków”. */
export function formatBudynkiCount(n: number): string {
  return `${n} ${pluralPl(n, 'budynek', 'budynki', 'budynków')}`;
}

/** „1 umowa / 2 umowy / 5 umów”. */
export function formatUmowyCount(n: number): string {
  return `${n} ${pluralPl(n, 'umowa', 'umowy', 'umów')}`;
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
