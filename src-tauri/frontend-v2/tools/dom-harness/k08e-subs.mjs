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

/**
 * Partia `karty-a` (runda 1, P5-8 K08E-2): karty górnego paska „Żywność", „Rekruci", „Ludność" (pin :5582-5650, :5652-5682,
 * :5684-5768). Czysto prezentacyjne z reguł delegatów (`k08e-deps.ts`) i kopii K08E; bez podstawień.
 */
export const BATCH_KARTY_A = {
  file: 'k08e-karty-a.ts',
  header: `/**
 * K08E-2a (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia \`karty-a\`): karty szczegółów górnego paska
 * z pinu \`edb8fb56\` (\`gra/src/ui/cityPanel.ts\`) — \`buildTopBarZywnoscDetailCard\` (:5582-5650),
 * \`buildTopBarRekruciDetailCard\` (:5652-5682), \`buildTopBarLudnoscDetailCard\` (:5684-5768).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08e-port.mjs --batch karty-a\` (bloki = pin, \`k08e-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08e-copies.mjs\`.
 */`,
  imports: `import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { cityPanelChipIcon, cityPanelChipIconWrap, effectiveGrowthPctForUi, fmtDecPl, loafIconHtml, pluralTur, signed, tury, type EmpireHudSnap } from './k01a-fundament';
import { resolveCityFedForUi, type CityView } from './k01b-t';
import { clampedGrowthBreakdown, wyzwienieSummaryLabel } from './k01b-r';
import { cityFoodSplit } from './k03-model';
import { cfg, formatManpower, type City, type GameData, type ManpowerSnapshotK05b as CityManpowerSnapshot } from './k05b-host';
import type { GameMap } from './k05a-fundament';
import { formatWyzwienieLabelK as formatWyzwienieLabel } from './k04c-model';
import {
  buildRationParams, cityLudnoscAbsolutna, growthGainPerTurnSlots, resolveCityHealth, turnsUntilNextCitizen, WYZYWIENIE_MAX,
} from './k08e-deps';`,
  units: [
    { name: 'buildTopBarZywnoscDetailCard', a: 5582, b: 5650 },
    { name: 'buildTopBarRekruciDetailCard', a: 5652, b: 5682 },
    { name: 'buildTopBarLudnoscDetailCard', a: 5684, b: 5768 },
  ],
};

/**
 * Partia `karty-b` (runda 1, P5-8 K08E-2b): karty „Nauka", „Kultura" (pin :5904-5947, :5949-5990) i „Porządek" (pin :3427-3549).
 * `resolveOrderState` (pin :3084) NIE jest kopiowany: reguła porządku przychodzi z silnika (K03-Z3), delegat `resolveOrderState`
 * w `k08e-deps.ts` (K08E-Z8).
 */
export const BATCH_KARTY_B = {
  file: 'k08e-karty-b.ts',
  header: `/**
 * K08E-2b (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia \`karty-b\`): karty szczegółów górnego paska
 * z pinu \`edb8fb56\` (\`gra/src/ui/cityPanel.ts\`) — \`buildTopBarNaukaDetailCard\` (:5904-5947),
 * \`buildTopBarKulturaDetailCard\` (:5949-5990), \`buildPorzadekDetailCard\` (:3427-3549).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08e-port.mjs --batch karty-b\` (bloki = pin, \`k08e-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08e-copies.mjs\`.
 */`,
  imports: `import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import {
  cityPanelChipIcon, cpInlineIcons, fmtDecPl, HANDEL_ZAMOZNOSC_LABEL, loafIconHtml, pluralTur, signed, tury, type EmpireHudSnap,
} from './k01a-fundament';
import { estimateHandelChips } from './k01b-f';
import { szLinesDoWyswietlenia, type CityView } from './k01b-t';
import { appendSectionTitleWithDetails } from './k08b-title';
import { cfg, daninaLabelForCity, readPodzialHandlu, type City, type GameData } from './k05b-host';
import { gameData } from './k05a-fundament';
import type { OrderStateK as OrderState } from './k03-model';
import { cityHasBibliotekaLine } from './k08d-deps';
import { porBandLabel, porPctBand } from './k08e-deps';`,
  units: [
    { name: 'buildTopBarNaukaDetailCard', a: 5904, b: 5947 },
    { name: 'buildTopBarKulturaDetailCard', a: 5949, b: 5990 },
    { name: 'buildPorzadekDetailCard', a: 3427, b: 3549 },
  ],
};

/**
 * Partia `topbar` (runda 1, P5-8 K08E-3): górny pasek miasta — `capitalBadgeOrButtonHtml` (:10719-10734),
 * `renderCivResourceTopBar` (:10736-10781; `switchCity` = delegat K09), `wireTopBarStatDetails` (:6051-6085).
 */
export const BATCH_TOPBAR = {
  file: 'k08e-topbar.ts',
  header: `/**
 * K08E-3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia \`topbar\`): górny pasek miasta z pinu \`edb8fb56\`
 * (\`gra/src/ui/cityPanel.ts\`) — \`capitalBadgeOrButtonHtml\` (:10719-10734), \`renderCivResourceTopBar\` (:10736-10781),
 * \`wireTopBarStatDetails\` (:6051-6085).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08e-port.mjs --batch topbar\` (bloki = pin, \`k08e-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08e-copies.mjs\`.
 * \`switchCity\` (pin :10209) = delegat K09 (\`k08e-deps.ts\`, K08E-Z9); \`resolveOrderState\` = delegat (K08E-Z8).
 */`,
  imports: `import { attachTopBarStat } from './k01b-dom';
import { renderTopBarGarrison } from './k06b-garnizon';
import { cfg, isMeCity, rerender, type City, type GameData } from './k05b-host';
import type { CityView } from './k01b-t';
import type { GameMap } from './k05a-fundament';
import { resolveEmpireSnap } from './k08d-deps';
import {
  buildCityOnlyW3FlankChips, cityPanelTitle, ownerCities, resolveOrderState, switchCity,
} from './k08e-deps';
import { buildTopBarZywnoscDetailCard, buildTopBarRekruciDetailCard, buildTopBarLudnoscDetailCard } from './k08e-karty-a';
import { buildTopBarNaukaDetailCard, buildTopBarKulturaDetailCard, buildPorzadekDetailCard } from './k08e-karty-b';
import { buildTopBarPracaDetailCard } from './k08c-praca';
import { buildTopBarZlotoDetailCard } from './k05b-podzial';
import { buildTopBarReligiaDetailCard } from './k08d-religia';`,
  units: [
    { name: 'capitalBadgeOrButtonHtml', a: 10719, b: 10734 },
    { name: 'renderCivResourceTopBar', a: 10736, b: 10781 },
    { name: 'wireTopBarStatDetails', a: 6051, b: 6085 },
  ],
};

/** Partie K08E aktywne w tym commicie (kolejność stała): zielone w typecheck i w bramce kopii. */
export const BATCHES_K08E = [BATCH_MAGAZYN, BATCH_KARTY_A];

/**
 * WIP (NIE_ZROBIONE w rundzie 1, poza commitem): `karty-b` i `topbar` — kopie generowane, ale nie kompilują się
 * (`OrderStateK` z `k03-model` to zawężony DTO bez pól porządku pinu; `ManpowerSnapshot`/`GameData` k05a vs k05b).
 * Decyzja typu porządku (pełny `OrderState` z silnika) = K09; patrz dossier K08E §6.
 */
export const BATCHES_K08E_WIP = [BATCH_KARTY_B, BATCH_TOPBAR];

/** Partia po nazwie (`magazyn`). */
export const batchByNameK08e = (name) => {
  const b = [...BATCHES_K08E, ...BATCHES_K08E_WIP].find((x) => x.file === `k08e-${name}.ts`);
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
  // K08E-Z15 (partia karty-a): identyczne podstawienie id miasta jak w magazynie (perCityRows.cityId: string).
  { a: 5684, b: 5768, from: 'tick?.perCityRows?.find(r => r.cityId === city.id)', to: 'tick?.perCityRows?.find(r => r.cityId === String(city.id))' },
  { a: 5684, b: 5768, from: 'resolveCityFedForUi(city.id, foodSplit.total, tick)', to: 'resolveCityFedForUi(String(city.id), foodSplit.total, tick)' },
  // K08E-Z11 (partia karty-b): etykieta pasma porządku z delegatu (pin: tabela `POR_BAND_LABELS` z danych gry).
  { a: 3427, b: 3549, from: 'POR_BAND_LABELS[band]', to: 'porBandLabel(band)' },
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
