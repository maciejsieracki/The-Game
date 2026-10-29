/**
 * k07a-subs.mjs — WSPÓLNE podstawienia K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 3).
 * Używane przez `gen-k07a-port.mjs` (generator bloków portu z pinu) i `verify-k07a-copies.mjs` (bramka).
 * Jedno źródło prawdy: generator i bramka nie mogą mieć rozjechanych list.
 */

/** Zmiana nazw (port → pin), stosowana po obu stronach przed porównaniem (bramka). */
export const TOKENS = [
  [/\bCityK07\b/g, 'City'],
  [/\bW3_STAT_RES_KEY_K07\b/g, 'W3_STAT_RES_KEY'],
  [/\bw3CityChipK07\b/g, 'w3CityChip'],
  [/\bcapitalBadgeOrButtonHtmlK07\b/g, 'capitalBadgeOrButtonHtml'],
  [/\bresolveK07aActiveCity\b/g, 'resolveActiveCity'],
];

/** Odwrotność TOKENS dla generatora (nazwa pinu → nazwa portu). */
export const PIN_TO_PORT_NAMES = [
  [/\bCity\b/g, 'CityK07'],
  [/\bW3_STAT_RES_KEY\b/g, 'W3_STAT_RES_KEY_K07'],
  [/\bw3CityChip\b/g, 'w3CityChipK07'],
  [/\bcapitalBadgeOrButtonHtml\b/g, 'capitalBadgeOrButtonHtmlK07'],
  [/\bresolveActiveCity\b/g, 'resolveK07aActiveCity'],
];

/**
 * Jawne podstawienia linii (K07A-Z2): pojedyncza linia pinu w zakresie `a..b` zastąpiona linią portu `to`.
 * `from` musi wystąpić w pinie w zakresie dokładnie raz; `to` musi wystąpić w porcie w bloku dokładnie raz.
 */
export const LINE_SUBS = [
  { a: 10329, b: 10334, from: '  const fresh = cfg.getCities?.().find(c => c.id === activeCity!.id);', to: '  const fresh = deps?.getCities().find(c => c.id === activeCity!.id);', why: 'K07A-Z2 cfg.getCities -> deps' },
  { a: 10393, b: 10419, from: '    buildChipDeltaStockHtml(civRate, civStock) +', to: '    requireK07aDeps().chipDeltaStockHtml(civRate, civStock) +', why: 'K07A-Z2 buildChipDeltaStockHtml -> requireK07aDeps (brak deps = wyjątek, nie cicha utrata tempa)' },
  { a: 10719, b: 10734, from: '  const capitalId = cfg.getCapitalCityId?.(city.ownerId) ?? null;', to: '  const capitalId = deps?.getCapitalCityId(city.ownerId) ?? null;', why: 'K07A-Z2 cfg.getCapitalCityId -> deps' },
  { a: 10719, b: 10734, from: "  if (!isMeCity(city.ownerId) || !cfg.onSetCapital) return '';", to: "  if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return '';", why: 'K07A-Z2 isMeCity/onSetCapital -> deps' },
  { a: 10719, b: 10734, from: '  const allCitiesForCapital = cfg.getCities?.() ?? [];', to: '  const allCitiesForCapital = deps?.getCities() ?? [];', why: 'K07A-Z2 cfg.getCities -> deps' },
];

/**
 * Koniec bloku = ostatnia linia KODU (nie komentarza) w zakresie `a..b`, kończąca się `}`/`};`/`;`/`)`.
 * Linie komentarza (`*`, `//`, `/*`) są pomijane — inaczej JSDoc wewnątrz jednostki kończący się `;` wydłużałby blok.
 * @param {string[]} lines linie pinu (0-indeksowane)
 */
export function codeEndLine(lines, a, b) {
  let e = b;
  while (e > a && !(!/^\s*(\*|\/\/|\/\*)/.test(lines[e - 1]) && /[};)]\s*$/.test(lines[e - 1]))) e--;
  return e;
}

/** Nazwy deklaracji portu spoza jednostek pinu (K07A-Z1..Z5): dozwolone w porcie. */
export const LOCAL_NAMES = [
  // K07A-Z1 typy lokalne
  'CityK07', 'PracaSplitK07', 'SixK07',
  // K07A-Z2 zależności
  'K07aDeps', 'deps', 'setK07aDeps', 'requireK07aDeps',
  // K07A-Z3 stan modułu
  'activeCity', 'setK07aActiveCity', 'getK07aActiveCity',
  'setK07aUxSectionRefresh', 'getK07aUxSectionRefresh',
  'activeDrawerTab', 'setK07aDrawerTab', 'getK07aDrawerTab',
  'scalePx', 'setK07aScalePx',
  // K07A-Z4 adaptery zewnętrzne (cfg + ext + wrappery o nazwach pinu)
  'K07aCfg', 'K07aExt', 'cfg', 'ext', 'setK07aExt', 'requireK07aExt',
  'isMeCity', 'ownerCities', 'cityPanelTitle', 'headerOrderBadge', 'drawerTabButtons', 'formatManpower',
  'daninaLabelForCity', 'resolveEmpireSnap', 'cityPracaSplit', 'readPodzialHandlu',
  'civWideSixStatsFromEmpireSnap', 'resolveOrderState',
  // K07A-Z5 stała pinu
  'WYZYWIENIE_MAX',
];
