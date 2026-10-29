/**
 * k08e-subs.mjs — WSPÓLNE definicje partii K08E (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1).
 * Używane przez `gen-k08e-port.mjs` (generator kopii z pinu) i `verify-k08e-copies.mjs` (bramka ORPHAN=0).
 * Jedno źródło prawdy: generator i bramka nie mogą mieć rozjechanych list.
 *
 * Zakres rundy 1 (dispatch K08E, „Partie ≤3 jednostki, commit po każdej"):
 *   partia `magazyn`: `buildGrowthProgressTooltipCard` (pin :1598-1635), `renderMagazyn` (pin :5203-5472),
 *                     `buildRacjeWzrostDetailCard` (pin :5474-5579).
 *
 * Podstawienia LINE_SUBS_K08E: pusta lista (K08E-Z1: ciała kopii bajt w bajt z pinem; reguły gry = delegaty
 * `k08e-deps.ts`, wartości cfg = pola `K05bCfg` (dopiski `k05b-host.ts`)).
 */
export { codeEndLine } from './k08b-subs.mjs';

/** Partia `magazyn` (runda 1): karta „Wyżywienie i wzrost" (magazyn) i jej bloki pomocnicze. */
export const BATCH_MAGAZYN = {
  file: 'k08e-magazyn.ts',
  header: `/**
 * K08E-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia \`magazyn\`): sekcja „Wyżywienie i wzrost"
 * (pin \`edb8fb56\`, \`gra/src/ui/cityPanel.ts\`) — \`renderMagazyn\` (:5203-5472), \`buildRacjeWzrostDetailCard\`
 * (:5474-5579) i \`buildGrowthProgressTooltipCard\` (:1598-1635).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08e-port.mjs --batch magazyn\` (bloki = pin, \`k08e-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08e-copies.mjs\`.
 * Reguły gry (\`buildRationParams\`, \`cityLudnoscAbsolutna\`, skala wzrostu/tury) = delegaty \`k08e-deps.ts\` (P5.13).
 */`,
  imports: `import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { appendTabIndicators } from './k02-units';
import { attachHoverDetail } from '../hoverDetailDock';
import { formatLiczbaPl } from '../formatPl';
import type { CityView } from './k01b-t';
import {
  cityPanelChipIcon, effectiveGrowthPctForUi, fmtDecPl, growthBreakdownRow, loafIconHtml, pluralTur, signed,
  tury, type TabIndicatorChip,
} from './k01a-fundament';
import { buildGrowthProgressUi, clampedGrowthBreakdown, wyzwienieSummaryLabel } from './k01b-r';
import { resolveCityFedForUi } from './k01b-t';
import { cityFoodSplit } from './k03-model';
import { appendSectionTitleWithDetails } from './k08b-title';
import { gameData, type GameData } from './k05a-fundament';
import {
  appendIndywidualneToggle, cfg, formatManpower, isMeCity, rerender, type City,
  type EmpireFoodStateK08e as EmpireFoodState, type EmpireFoodTickK08e as EmpireFoodTick,
} from './k05b-host';
import { formatWyzwienieLabelK as formatWyzwienieLabel } from './k04c-model';
import {
  buildRationParams, cityLudnoscAbsolutna, growthGainPerTurnSlots, rationGrowthPercent, turnsUntilNextCitizen,
  WYZYWIENIE_MAX, WYZYWIENIE_MIN, WYZYWIENIE_STEP,
} from './k08e-deps';`,
  units: [
    { name: 'buildGrowthProgressTooltipCard', a: 1598, b: 1635 },
    { name: 'renderMagazyn', a: 5203, b: 5472 },
    { name: 'buildRacjeWzrostDetailCard', a: 5474, b: 5579 },
  ],
};

/** Wszystkie partie K08E (kolejność stała). */
export const BATCHES_K08E = [BATCH_MAGAZYN];

/** Partia po nazwie (`magazyn`). */
export const batchByNameK08e = (name) => {
  const b = BATCHES_K08E.find((x) => x.file === `k08e-${name}.ts`);
  if (!b) throw new Error(`nieznana partia K08E: ${name}`);
  return b;
};

/** Podstawienia LINE_SUBS_K08E (runda 1: brak — ciała kopii 1:1 z pinem). Każde `from` musi trafić w zakres DOKŁADNIE raz. */
export const LINE_SUBS_K08E = [
  // K08E-Z4 (id miasta): pin `city.id: string` (silnik); port `City.id: number` (k05b-host), wpisy `perCityRows.cityId: string`
  // (k01b-dto). Podstawienie `String(city.id)` przy odczycie wiersza karmienia (1:1 znaczeniowo: id miasta jako tekst).
  { a: 5203, b: 5472, from: 'tick?.perCityRows?.find(r => r.cityId === city.id)', to: 'tick?.perCityRows?.find(r => r.cityId === String(city.id))' },
  { a: 5203, b: 5472, from: 'resolveCityFedForUi(city.id, foodSplit.total, tick)', to: 'resolveCityFedForUi(String(city.id), foodSplit.total, tick)' },
  // K08E-Z7 (dane gry): pin `gameData()` zwraca `GameData | null`-like; port (`k05a`) zwraca `undefined` przy braku danych -> `?? null` (1:1 semantycznie: brak danych = null).
  { a: 5203, b: 5472, from: 'const data = gameData();', to: 'const data = gameData() ?? null;' },
  { a: 5474, b: 5579, from: 'tick?.perCityRows?.find(r => r.cityId === city.id)', to: 'tick?.perCityRows?.find(r => r.cityId === String(city.id))' },
  { a: 5474, b: 5579, from: 'resolveCityFedForUi(city.id, foodSplit.total, tick)', to: 'resolveCityFedForUi(String(city.id), foodSplit.total, tick)' },
];

/** Zastosowanie podstawień K08E do bloku pinu. */
export function applySubsK08e(unit, lines) {
  const subs = LINE_SUBS_K08E.filter((s) => s.a === unit.a && s.b === unit.b);
  let text = lines.join('\n');
  for (const s of subs) text = text.split(s.from).join(s.to);
  return text.split('\n');
}

/** Liczba wystąpień podstawienia w zakresie pinu (bramka SUBS wymaga 1). */
export function countSubK08e(pinLines, a, b, from) {
  const text = pinLines.slice(a - 1, b).join('\n');
  return text.split(from).length - 1;
}
