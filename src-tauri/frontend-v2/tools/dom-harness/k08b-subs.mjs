/**
 * k08b-subs.mjs — WSPÓLNE podstawienia K08B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 1).
 * Używane przez `gen-k08b-port.mjs` (generator bloków portu z pinu) i `verify-k08b-copies.mjs` (bramka).
 * Jedno źródło prawdy: generator i bramka nie mogą mieć rozjechanych list.
 *
 * Partie K08B (jednostki DOM bloku K08, pin `edb8fb56`): każda partia = osobny plik `src/ui/cityPanel/k08b-*.ts`.
 * Partia `rail` (runda 1): 6 jednostek DOM bez zależności od jednostek nieportowanych (patrz P5-8-K08B.md §3).
 *
 * LINE_SUBS: podstawienie PODCIĄGU (substring) w liniach zakresu `a..b` (zakres po `codeEndLine`).
 * Każdy `from` musi wystąpić w zakresie DOKŁADNIE raz (generator i bramka to sprawdzają).
 */

/** Partia `rail`: nazwy jednostek pinu, zakresy (po przycięciu do końca kodu) i plik docelowy. */
export const BATCH_RAIL = {
  file: 'k08b-rail.ts',
  units: [
    { name: 'renderOwnedBuildingsBar', a: 9273, b: 9305 },
    { name: 'renderCityExitFooter', a: 10700, b: 10718 },
    { name: 'renderCityIconLeftRail', a: 10783, b: 10792 },
    { name: 'renderCivMapChrome', a: 11056, b: 11080 },
    { name: 'renderCityIconRail', a: 11605, b: 11650 },
    { name: 'withW4TabCard', a: 11651, b: 11667 },
  ],
};

/** Wszystkie partie (kolejność stała; partia `rail` jako pierwsza). */
export const BATCHES = [BATCH_RAIL];

/**
 * K08B-Z2/Z3 (runda 1): podstawienia podciągów w jednostkach. Stan pinu (`activeCityPanelTab`, `scalePx`) i efekty
 * (`clearGarrisonPanel`, `rerender`) przechodzą przez akcesory K08A/K07A i `requireK08aDeps()` — tak jak K08A-Z2/Z3.
 */
export const LINE_SUBS = [
  // renderCityIconRail (pin :11605-11650)
  { a: 11605, b: 11650, from: 'Math.round(scalePx * ', to: 'Math.round(getK07aScalePx() * ', why: 'K08B-Z3 scalePx (stan K07A) -> getK07aScalePx' },
  { a: 11605, b: 11650, from: "activeCityPanelTab === item.id ? ' on'", to: "getK08aActiveCityPanelTab() === item.id ? ' on'", why: 'K08B-Z3 activeCityPanelTab (K08A) -> akcesor' },
  { a: 11605, b: 11650, from: "activeCityPanelTab === item.id ? 'true'", to: "getK08aActiveCityPanelTab() === item.id ? 'true'", why: 'K08B-Z3 activeCityPanelTab (aria-pressed) -> akcesor' },
  { a: 11605, b: 11650, from: 'if (activeCityPanelTab !== item.id) {', to: 'if (getK08aActiveCityPanelTab() !== item.id) {', why: 'K08B-Z3 activeCityPanelTab (klik) -> akcesor' },
  { a: 11605, b: 11650, from: 'clearGarrisonPanel();', to: 'requireK08aDeps().clearGarrisonPanel();', why: 'K08B-Z2 clearGarrisonPanel (DOM, K06B) -> deps K08A' },
  { a: 11605, b: 11650, from: 'activeCityPanelTab = item.id;', to: 'setK08aActiveCityPanelTab(item.id);', why: 'K08B-Z3 przypisanie activeCityPanelTab -> setter K08A' },
  { a: 11605, b: 11650, from: 'rerender();', to: 'requireK08aDeps().rerender();', why: 'K08B-Z2 rerender (K09) -> deps K08A' },
];

/**
 * Koniec bloku = ostatnia linia KODU w zakresie `a..b` kończąca się `}`/`};`/`;`/`)` (jak `k08a-subs.mjs`).
 * @param {string[]} lines linie pinu (0-indeksowane)
 */
export function codeEndLine(lines, a, b) {
  let e = b;
  while (e > a && !(!/^\s*(\*|\/\/|\/\*)/.test(lines[e - 1]) && /[};)]\s*$/.test(lines[e - 1]))) e--;
  return e;
}

/** Zastosowanie podciągów do jednej linii pinu (używane przez generator i bramkę). */
export function applySubs(unit, lines) {
  const subs = LINE_SUBS.filter((s) => s.a === unit.a && s.b === unit.b);
  return lines.map((line) => {
    let out = line;
    for (const s of subs) {
      if (out.includes(s.from)) out = out.split(s.from).join(s.to);
    }
    return out;
  });
}
