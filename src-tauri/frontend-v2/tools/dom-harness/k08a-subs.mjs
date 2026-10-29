/**
 * k08a-subs.mjs — WSPÓLNE podstawienia K08A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1).
 * Używane przez `gen-k08a-port.mjs` (generator bloków portu z pinu) i `verify-k08a-copies.mjs` (bramka).
 * Jedno źródło prawdy: generator i bramka nie mogą mieć rozjechanych list.
 */

/**
 * Zmiana nazw (port → pin), stosowana po obu stronach przed porównaniem (bramka).
 * K08A-Z3: `resolveActiveCity` (pin) = `resolveK07aActiveCity` (port, K07A) — jedyna zmiana nazwy w K08A.
 */
export const TOKENS = [
  [/\bresolveK07aActiveCity\b/g, 'resolveActiveCity'],
];

/** Odwrotność TOKENS dla generatora (nazwa pinu → nazwa portu). */
export const PIN_TO_PORT_NAMES = [
  [/\bresolveActiveCity\b/g, 'resolveK07aActiveCity'],
];

/**
 * Jawne podstawienia linii (K08A-Z2/Z3/Z4): pojedyncza linia pinu w zakresie `a..b` zastąpiona linią portu `to`.
 * `from` musi wystąpić w pinie w zakresie dokładnie raz; `to` musi wystąpić w porcie w bloku dokładnie raz.
 * Zakresy `a..b` = zakres PO `codeEndLine` (jak w `select-k08a.mjs`).
 */
export const LINE_SUBS = [
  // refreshCityPanelIfOpen (pin :10337-10346): uxSectionRefresh → accessor K07A; rerender → deps (cięcie K09, P5.8-Z1)
  { a: 10337, b: 10346, from: '  if (uxSectionRefresh) {', to: '  if (getK07aUxSectionRefresh()) {', why: 'K08A-Z3 uxSectionRefresh (stan K07A) -> getK07aUxSectionRefresh' },
  { a: 10337, b: 10346, from: '    uxSectionRefresh();', to: '    getK07aUxSectionRefresh()?.();', why: 'K08A-Z3 wywołanie uxSectionRefresh -> accessor K07A' },
  { a: 10337, b: 10346, from: '  rerender();', to: '  requireK08aDeps().rerender();', why: 'K08A-Z2 rerender (K09) -> deps' },
  // clearCityPanelUxMode (pin :10367-10374)
  { a: 10367, b: 10374, from: '  clearGarrisonPanel();', to: '  requireK08aDeps().clearGarrisonPanel();', why: 'K08A-Z2 clearGarrisonPanel (DOM, K06B) -> deps' },
  { a: 10367, b: 10374, from: '  uxSectionRefresh = null;', to: '  setK07aUxSectionRefresh(null);', why: 'K08A-Z3 uxSectionRefresh = null -> setK07aUxSectionRefresh' },
  { a: 10367, b: 10374, from: '  activeCity = null;', to: '  clearActiveCityMirrors();', why: 'K08A-Z3 activeCity = null -> lustra K06A/K07A (clearActiveCityMirrors)' },
  { a: 10367, b: 10374, from: '  activeMap = null;', to: '  // activeMap = null: zerowane razem z activeCity w clearActiveCityMirrors() (K08A-Z3)', why: 'K08A-Z3 activeMap = null -> K06A (clearActiveCityMirrors)' },
  { a: 10367, b: 10374, from: '  disposeHoverDetailDock();', to: '  requireK08aDeps().disposeHoverDetailDock();', why: 'K08A-Z2 disposeHoverDetailDock (DOM) -> deps' },
  // closeCityView (pin :10694-10698)
  { a: 10694, b: 10698, from: '  else activeOnClose();', to: '  else getK06aState().activeOnClose();', why: 'K08A-Z3 activeOnClose (stan K06A) -> getK06aState' },
  // isCityPanelOpen (pin :11979-11981)
  { a: 11979, b: 11981, from: '  return isCityUxFrameOpen();', to: '  return requireK08aDeps().isCityUxFrameOpen();', why: 'K08A-Z2 isCityUxFrameOpen (DOM) -> deps' },
  // closeCityPanelIfOpen (pin :11971-11976)
  { a: 11971, b: 11976, from: '  clearGarrisonPanel();', to: '  requireK08aDeps().clearGarrisonPanel();', why: 'K08A-Z2 clearGarrisonPanel (DOM, K06B) -> deps' },
  { a: 11971, b: 11976, from: '  activeOnClose();', to: '  getK06aState().activeOnClose();', why: 'K08A-Z3 activeOnClose (stan K06A) -> getK06aState' },
  // getOpenCityPanelCityId (pin :11984-11986)
  { a: 11984, b: 11986, from: '  return activeCity?.id ?? null;', to: '  return getK07aActiveCity()?.id ?? null;', why: 'K08A-Z3 activeCity (lustro K07A) -> getK07aActiveCity' },
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

/** Nazwy deklaracji portu spoza jednostek pinu (K08A-Z1..Z5): dozwolone w porcie. */
export const LOCAL_NAMES = [
  // K08A-Z2 zależności DOM/kontroler (wstrzykiwane)
  'K08aDeps', 'deps', 'setK08aDeps', 'requireK08aDeps',
  // K08A-Z3 lustra stanu i akcesory własnego stanu
  'clearActiveCityMirrors', 'getK08aActiveCityPanelTab', 'setK08aActiveCityPanelTab',
];
