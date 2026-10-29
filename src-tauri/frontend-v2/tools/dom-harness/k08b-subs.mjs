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

/**
 * Partia `title` (runda 2, P5-8 K08B-Z6): helper `resolveDetailSideHint` (pin :11512-11516, bez DOM, wymagany przez
 * `appendSectionTitleWithDetails`) + jednostka DOM `appendSectionTitleWithDetails` (pin :11518-11537, blok 7 w
 * `P5-8-K08B.md` §3). Wywołanie `attachInteractiveDetail` z `ui/hoverDetailDock` (warstwa UI, jak w `k01b-dom.ts`).
 */
export const BATCH_TITLE = {
  file: 'k08b-title.ts',
  units: [
    { name: 'resolveDetailSideHint', a: 11512, b: 11516 },
    { name: 'appendSectionTitleWithDetails', a: 11518, b: 11537 },
  ],
};

/**
 * Partia `owned` (runda 3, K08B-Z5 domknięte): `renderBuildingsOwned` (pin :9184-9255) i jego prawa karta
 * `renderBuildingsOwnedRightPanel` (pin :9341-9357). Zależności: porty K01A/K01B/K02/K05B/K06B; dwie funkcje pinu
 * bez portu (`sumOwnedBuildingsUpkeep`, `groupBuiltBuildingIds`) przez delegaty `k08b-deps.ts` (K08B-Z7).
 */
export const BATCH_OWNED = {
  file: 'k08b-owned.ts',
  header: `/**
 * K08B-3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 3, partia \`owned\`): lista „Budynki w mieście" (pin \`edb8fb56\`,
 * \`gra/src/ui/cityPanel.ts\`) — \`renderBuildingsOwned\` i prawa karta \`renderBuildingsOwnedRightPanel\`.
 * Jednostki DOM: 2 z zbioru 24 (\`P5-8-K08B.md\` §3, wiersze \`renderBuildingsOwned\` i \`renderBuildingsOwnedRightPanel\`).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08b-port.mjs --batch owned\` (bloki = pin + \`k08b-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08b-copies.mjs --batch owned\`.
 * Delegaty bez portu: \`k08b-deps.ts\` (K08B-Z7, wiring \`setK06bDeps\`: NIE_ZROBIONE).
 */`,
  imports: `import { BUILDING_UPKEEP_ZERO_LABEL, PH, cityPanelChipIconWrap } from './k01a-fundament';
import { formatBuildingUpkeepTotalHtml } from './k01b-f';
import { formatResourceUpkeepText, sumOwnedBuildingsResourceUpkeep } from './k01b-r';
import { el } from './k01b-dom';
import { createScrollList } from './k02-units';
import { cfg, type City, type GameData } from './k05b-host';
import { appendOwnedBuildingRow } from './k06b-kolejki';
import { groupBuiltBuildingIds, sumOwnedBuildingsUpkeep } from './k08b-deps';
import { withW4TabCard } from './k08b-rail';`,
  units: [
    { name: 'renderBuildingsOwned', a: 9184, b: 9255 },
    { name: 'renderBuildingsOwnedRightPanel', a: 9341, b: 9357 },
  ],
};

/**
 * Partia `purchase` (runda 3, K08B-Z7): `renderPurchasableUnits` (pin :8891-8977, zakładka Rekrutacja). Zależności
 * z gry (`purchasableUnits`, `sortByUnitPowerDescending`, `getUnitDef`, pasek surowców rekrutacji) — delegaty `k08b-deps.ts`.
 */
export const BATCH_PURCHASE = {
  file: 'k08b-purchase.ts',
  header: `/**
 * K08B-4 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 3, partia \`purchase\`): panel „Rekrutuj jednostkę" (pin \`edb8fb56\`,
 * \`gra/src/ui/cityPanel.ts\`) — \`renderPurchasableUnits\` (zakładka Rekrutacja, kolumna lewa lub karta W4).
 * Jednostki DOM: 1 z zbioru 24 (\`P5-8-K08B.md\` §3, wiersz \`renderPurchasableUnits\`).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08b-port.mjs --batch purchase\` (bloki = pin + \`k08b-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08b-copies.mjs --batch purchase\`.
 * Delegaty bez portu: \`k08b-deps.ts\` (K08B-Z7, wiring \`setK06bDeps\`: NIE_ZROBIONE).
 */`,
  imports: `import { LIST_ROW_HEIGHT_COMPACT, LIST_SCROLL_VISIBLE_CATALOG, cityPanelChipIcon } from './k01a-fundament';
import { el } from './k01b-dom';
import { appendTabIndicators, createScrollList } from './k02-units';
import { buildRecruitTabDetailCard, buildUpgradeBonusDetailCard } from './k05b-jednostki';
import { cfg, getProd, isMeCity, productionCtxForCity, type City, type GameData } from './k05b-host';
import { appendUnitRecruitCompactRow } from './k06b-jednostki';
import {
  appendRecruitMilitaryResourceStrip, getUnitDef, purchasableUnits, sortByUnitPowerDescending, type UnitPowerInput,
} from './k08b-deps';
import { appendSectionTitleWithDetails } from './k08b-title';`,
  units: [
    { name: 'renderPurchasableUnits', a: 8891, b: 8977 },
  ],
};

/** Wszystkie partie (kolejność stała). */
export const BATCHES = [BATCH_RAIL, BATCH_TITLE, BATCH_OWNED, BATCH_PURCHASE];

/** Partia po nazwie pliku-partii (`rail`, `title`, `owned`, `purchase`). */
export const batchByName = (name) => {
  const b = BATCHES.find((x) => x.file === `k08b-${name}.ts`);
  if (!b) throw new Error(`nieznana partia K08B: ${name}`);
  return b;
};

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
