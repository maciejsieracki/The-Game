/**
 * k08a-subs.mjs — WSPÓLNE podstawienia K08A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1).
 * Używane przez `gen-k08a-port.mjs` (generator bloków portu z pinu) i `verify-k08a-copies.mjs` (bramka).
 * Jedno źródło prawdy: generator i bramka nie mogą mieć rozjechanych list.
 */

/**
 * Zmiana nazw (port → pin), stosowana po obu stronach przed porównaniem (bramka).
 * K08A-Z3/Z4 (r3): `resolveActiveCity` (pin) = `resolveK08aActiveCity` (port, K08A: K07A + sync lustra K06A).
 * `resolveK07aActiveCity` (port) też mapowane na nazwę pinu — dla wywołań spoza bloków (bramka TOKENS).
 */
export const TOKENS = [
  [/\bresolveK08aActiveCity\b/g, 'resolveActiveCity'],
  [/\bresolveK07aActiveCity\b/g, 'resolveActiveCity'],
];

/** Odwrotność TOKENS dla generatora (nazwa pinu → nazwa portu). */
export const PIN_TO_PORT_NAMES = [
  [/\bresolveActiveCity\b/g, 'resolveK08aActiveCity'],
];

/**
 * Jawne podstawienia linii (K08A-Z2/Z3/Z4): pojedyncza linia pinu w zakresie `a..b` zastąpiona linią portu `to`.
 * `from` musi wystąpić w pinie w zakresie dokładnie raz; `to` musi wystąpić w porcie w bloku dokładnie raz.
 * Zakresy `a..b` = zakres PO `codeEndLine` (jak w `select-k08a.mjs`).
 */
export const LINE_SUBS = [
  // refreshCityPanelIfOpen (pin :10660-10669): uxSectionRefresh → accessor K07A; rerender → deps (cięcie K09, P5.8-Z1)
  { a: 10660, b: 10669, from: '  if (uxSectionRefresh) {', to: '  if (getK07aUxSectionRefresh()) {', why: 'K08A-Z3 uxSectionRefresh (stan K07A) -> getK07aUxSectionRefresh' },
  { a: 10660, b: 10669, from: '    uxSectionRefresh();', to: '    getK07aUxSectionRefresh()?.();', why: 'K08A-Z3 wywołanie uxSectionRefresh -> accessor K07A' },
  { a: 10660, b: 10669, from: '  rerender();', to: '  requireK08aDeps().rerender();', why: 'K08A-Z2 rerender (K09) -> deps' },
  // clearCityPanelUxMode (pin :10690-10697)
  { a: 10690, b: 10697, from: '  clearGarrisonPanel();', to: '  requireK08aDeps().clearGarrisonPanel();', why: 'K08A-Z2 clearGarrisonPanel (DOM, K06B) -> deps' },
  { a: 10690, b: 10697, from: '  uxSectionRefresh = null;', to: '  setK07aUxSectionRefresh(null);', why: 'K08A-Z3 uxSectionRefresh = null -> setK07aUxSectionRefresh' },
  { a: 10690, b: 10697, from: '  activeCity = null;', to: '  clearActiveCityMirrors();', why: 'K08A-Z3 activeCity = null -> lustra K06A/K07A (clearActiveCityMirrors)' },
  { a: 10690, b: 10697, from: '  activeMap = null;', to: '  // activeMap = null: zerowane razem z activeCity w clearActiveCityMirrors() (K08A-Z3)', why: 'K08A-Z3 activeMap = null -> K06A (clearActiveCityMirrors)' },
  { a: 10690, b: 10697, from: '  disposeHoverDetailDock();', to: '  requireK08aDeps().disposeHoverDetailDock();', why: 'K08A-Z2 disposeHoverDetailDock (DOM) -> deps' },
  // closeCityView (pin :11036-11040)
  { a: 11036, b: 11040, from: '  else activeOnClose();', to: '  else getK06aState().activeOnClose();', why: 'K08A-Z3 activeOnClose (stan K06A) -> getK06aState' },
  // isCityPanelOpen (pin :12327-12329)
  { a: 12327, b: 12329, from: '  return isCityUxFrameOpen();', to: '  return requireK08aDeps().isCityUxFrameOpen();', why: 'K08A-Z2 isCityUxFrameOpen (DOM) -> deps' },
  // closeCityPanelIfOpen (pin :12319-12324)
  { a: 12319, b: 12324, from: '  clearGarrisonPanel();', to: '  requireK08aDeps().clearGarrisonPanel();', why: 'K08A-Z2 clearGarrisonPanel (DOM, K06B) -> deps' },
  { a: 12319, b: 12324, from: '  activeOnClose();', to: '  getK06aState().activeOnClose();', why: 'K08A-Z3 activeOnClose (stan K06A) -> getK06aState' },
  // getOpenCityPanelCityId (pin :12332-12334)
  { a: 12332, b: 12334, from: '  return activeCity?.id ?? null;', to: '  return getK07aActiveCity()?.id ?? null;', why: 'K08A-Z3 activeCity (lustro K07A) -> getK07aActiveCity' },
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
  // K08A-Z3/Z4 (r3, zarzut FC r2 #1): odświeżenie K07A + synchronizacja lustra K06A (pin ma jedno `activeCity`)
  'resolveK08aActiveCity',
];
