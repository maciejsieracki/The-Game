/**
 * k08d-subs.mjs — WSPÓLNE definicje partii K08D (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1).
 * Używane przez `gen-k08d-port.mjs` (generator kopii z pinu) i `verify-k08d-copies.mjs` (bramka ORPHAN=0).
 * Jedno źródło prawdy: generator i bramka nie mogą mieć rozjechanych list.
 *
 * Zakres rundy 1 (dispatch K08D, „Partie ≤3 jednostki, commit po każdej"):
 *   partia `handel`:  `ownerHasMennica` (pin :1322-1330), `activeTradeRouteCountForCity` (pin :11045-11054),
 *                     `buildHandelDetailCard` (pin :10845-11005);
 *   partia `slider`:  `renderHandelSlidersPanel` (pin :11007-11033).
 * Zdjęte z rundy 1 (NIE_ZROBIONE, K08D §8): `renderWealth` (+ `loadWealthParams`, `wealthCap`, `buildWealthDetailCard`,
 * `appendWealthCompactStrip`), `renderReligia` (+ `religiaSzPunkty`, `computeOrderStateLocal`, `appendCompositionBlock`,
 * `buildTopBarReligiaDetailCard`; `resolveEmpireSnap` już jest delegatem K08C).
 *
 * Podstawienia LINE_SUBS_K08D: jedno (K08D-Z9, bramka dostępu do złota: wymagane pole cfg zamiast `?? true`); reszta bajt w bajt z pinem.
 */
export { codeEndLine } from './k08b-subs.mjs';

/** Partia `handel` (runda 1): karta „Podział Daniny" i dwa helpery pinu. */
export const BATCH_HANDEL = {
  file: 'k08d-handel.ts',
  header: `/**
 * K08D-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1, partia \`handel\`): karta szczegółów „Podział Daniny"
 * (pin \`edb8fb56\`, \`gra/src/ui/cityPanel.ts\`) — \`buildHandelDetailCard\` (:10845-11005) oraz helpery pinu
 * \`ownerHasMennica\` (:1322-1330) i \`activeTradeRouteCountForCity\` (:11045-11054).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08d-port.mjs --batch handel\` (bloki = pin, \`k08d-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08d-copies.mjs\`.
 * Reguły gry (parametry korupcji, mnożnik Waluty+Mennicy, premia tras, biblioteka) = delegaty \`k08d-deps.ts\`
 * (P5.13: UI ich nie liczy; wartości z hosta przez \`controller/k08dWiring.ts\`).
 */`,
  imports: `import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { estimateHandelChips } from './k01b-f';
import type { CityView } from './k01b-t';
import { HANDEL_KORUPCJA_PCT_PLACEHOLDER, HANDEL_ZAMOZNOSC_LABEL } from './k01a-fundament';
import { cfg, daninaLabelForCity, daninaLabelGenitive, readPodzialHandlu, type City, type GameData } from './k05b-host';
import {
  buildEconParams, cityHasBibliotekaLine, computeTradeRouteBuildingBonusByCity, daninaLabelAccusative,
  mennicaGate, mnoznikHandelPieniadzForCivByDifficulty,
} from './k08d-deps';`,
  units: [
    { name: 'ownerHasMennica', a: 1322, b: 1330 },
    { name: 'activeTradeRouteCountForCity', a: 11045, b: 11054 },
    { name: 'buildHandelDetailCard', a: 10845, b: 11005 },
  ],
};

/** Partia `slider` (runda 1): `renderHandelSlidersPanel` — suwaki „Podział Daniny" (zależy od partii `handel`). */
export const BATCH_SLIDER = {
  file: 'k08d-slider.ts',
  header: `/**
 * K08D-2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1, partia \`slider\`): panel suwaków „Podział Daniny"
 * (pin \`edb8fb56\`, \`gra/src/ui/cityPanel.ts\`) — \`renderHandelSlidersPanel\` (:11007-11033).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08d-port.mjs --batch slider\` (bloki = pin, \`k08d-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08d-copies.mjs\`.
 */`,
  imports: `import { cityPanelChipIcon, signed } from './k01a-fundament';
import { estimateHandelChips } from './k01b-f';
import type { CityView } from './k01b-t';
import { appendTabIndicators } from './k02-units';
import { appendPodzialHandlu } from './k05b-podzial';
import { daninaLabelForCity, daninaLabelGenitive, readPodzialHandlu, type City, type GameData } from './k05b-host';
import { appendSectionTitleWithDetails } from './k08b-title';
import { resourceTextClass } from '../resourceColors';
import { buildHandelDetailCard } from './k08d-handel';`,
  units: [
    { name: 'renderHandelSlidersPanel', a: 11007, b: 11033 },
  ],
};

/**
 * Partia `religia` (runda 3, NAPRAW 3c): `renderReligia` (pin :4112-4220) + `buildTopBarReligiaDetailCard` (pin :5992-6039)
 * + `appendCompositionBlock` (pin :3814-3834, czysto prezentacyjna). Reguły gry (`religiaSzPunkty`, skala epoki,
 * parametry religii) = delegaty `k08d-deps.ts` (K08D-Z12); ciała kopii bez reguł (podstawienia LINE_SUBS_K08D).
 */
export const BATCH_RELIGIA = {
  file: 'k08d-religia.ts',
  header: `/**
 * K08D-3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 3, partia \`religia\`): karta i panel „Religia" z pinu \`edb8fb56\`
 * (\`gra/src/ui/cityPanel.ts\`) — \`renderReligia\` (:4112-4220), \`buildTopBarReligiaDetailCard\` (:5992-6039),
 * \`appendCompositionBlock\` (:3814-3834).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08d-port.mjs --batch religia\` (bloki = pin, \`k08d-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08d-copies.mjs\`.
 * Reguły (\`religiaSzPunkty\`, \`religiaXRelTop\`, \`resolveEmpireSnap\`) = delegaty \`k08d-deps.ts\` (P5.13).
 */`,
  imports: `import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from './k01b-dom';
import { appendDetailGrid } from './k03-detail';
import {
  cityPanelChipIcon, cityPanelChipIconWrap, PH, pctSubheadHtml, shortIndLabel, signed,
  type BreakdownLine, type EmpireHudSnap, type TabIndicatorChip,
} from './k01a-fundament';
import { appendTabIndicators } from './k02-units';
import { appendW4SignedBreakdownSections } from './k02-breakdown';
import type { CityView } from './k01b-t';
import { cfg, type City, type GameData } from './k05b-host';
import { appendSectionTitleWithDetails } from './k08b-title';
import { religiaSzPunkty, religiaXRelTop, resolveEmpireSnap } from './k08d-deps';`,
  units: [
    { name: 'appendCompositionBlock', a: 3814, b: 3834 },
    { name: 'buildTopBarReligiaDetailCard', a: 5992, b: 6039 },
    { name: 'renderReligia', a: 4112, b: 4220 },
  ],
};

/**
 * Partia `wealth-pasek` (runda 4, NAPRAW 3a, cz. 1): pasek zamożności i jego tooltip (pin :4247-4305, :4307-4351).
 * Czysto prezentacyjne (DOM + tekst, bez reguł gry; wartości przychodzą w `opts`) => kopie pinu bez podstawień.
 */
export const BATCH_WEALTH_PASEK = {
  file: 'k08d-wealth-pasek.ts',
  header: `/**
 * K08D-4a (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 4, partia \`wealth-pasek\`): pasek zamożności „W" i jego tooltip
 * z pinu \`edb8fb56\` (\`gra/src/ui/cityPanel.ts\`) — \`appendWealthCompactStrip\` (:4247-4304) i \`buildWealthCompactTooltipCard\`
 * (:4307-4350). Czysto prezentacyjne: wszystkie liczby wchodzą w \`opts\` (liczy je karta/renderer z delegatów K08D).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08d-port.mjs --batch wealth-pasek\` (bloki = pin, \`k08d-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08d-copies.mjs\`.
 */`,
  imports: `import { el, gridDetailRow } from './k01b-dom';
import { appendDetailGrid } from './k03-detail';
import { cityPanelChipIconWrap, tury } from './k01a-fundament';
import { attachHoverDetail } from '../hoverDetailDock';`,
  units: [
    { name: 'appendWealthCompactStrip', a: 4247, b: 4305 },
    { name: 'buildWealthCompactTooltipCard', a: 4307, b: 4351 },
  ],
};

/**
 * Partia `wealth` (runda 4, NAPRAW 3a, cz. 2): `renderWealth` (pin :4775-4822) i `buildWealthDetailCard` (pin :4824-4944).
 * Reguły zamożności (`loadWealthParams`, `wealthCap`, `wealthProg`, `wealthMnoznik`, `wealthZadowolenie`, `wealthRownowaga`)
 * = delegaty `k08d-deps.ts` (P5.13, K08D-Z13); `gameData()` pinu -> parametr `data` (K08D-Z14, podstawienia LINE_SUBS_K08D).
 * `freshWealthState` / `daninaLabel*` / `readPodzialHandlu` / `cfg` = host K05B (`k05b-host.ts`, bez reguł w UI).
 */
export const BATCH_WEALTH = {
  file: 'k08d-wealth.ts',
  header: `/**
 * K08D-4b (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 4, partia \`wealth\`): karta „Zamożność" i panel z pinu
 * \`edb8fb56\` (\`gra/src/ui/cityPanel.ts\`) — \`renderWealth\` (:4775-4823) i \`buildWealthDetailCard\` (:4824-4945).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08d-port.mjs --batch wealth\` (bloki = pin, \`k08d-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08d-copies.mjs\`.
 * Reguły zamożności = delegaty \`k08d-deps.ts\` (P5.13); pasek = \`k08d-wealth-pasek.ts\`.
 */`,
  imports: `import { el, appendDetailAlgo, appendDetailSection, gridDetailRow } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { estimateHandelChips } from './k01b-f';
import type { CityView } from './k01b-t';
import { HANDEL_ZAMOZNOSC_LABEL, signed, tury } from './k01a-fundament';
import { appendSectionTitleWithDetails } from './k08b-title';
import {
  cfg, daninaLabelForCity, daninaLabelGenitive, freshWealthState, readPodzialHandlu, type City, type GameData,
} from './k05b-host';
import { appendWealthCompactStrip } from './k08d-wealth-pasek';
import {
  loadWealthParams, wealthCap, wealthMnoznik, wealthProg, wealthRownowaga, wealthZadowolenie, type WealthParams,
} from './k08d-deps';`,
  units: [
    { name: 'renderWealth', a: 4775, b: 4822 },
    { name: 'buildWealthDetailCard', a: 4824, b: 4945 },
  ],
};

/** Wszystkie partie K08D (kolejność stała). */
export const BATCHES_K08D = [BATCH_HANDEL, BATCH_SLIDER, BATCH_RELIGIA, BATCH_WEALTH_PASEK, BATCH_WEALTH];

/** Partia po nazwie (`handel` | `slider`). */
export const batchByNameK08d = (name) => {
  const b = BATCHES_K08D.find((x) => x.file === `k08d-${name}.ts`);
  if (!b) throw new Error(`nieznana partia K08D: ${name}`);
  return b;
};

/**
 * Podstawienia LINE_SUBS_K08D (K08D-Z11, runda 3, NAPRAW 5 / P5.13): bramka Mennicy (koniunkcje pinu w
 * `buildHandelDetailCard`, `cityPanel.ts:10861-10874`) przeniesiona do delegatu `mennicaGate` (`k08d-deps.ts`).
 * Każde podstawienie = JEDNA linia pinu -> JEDNA linia portu (bramka `verify-k08d-copies.mjs` liczy wystąpienia = 1).
 * Zastąpiło K08D-Z9 (`?? true` w linii `maDostepDoZlota`): czytanie pola cfg przeniesione do implementacji delegatu (host).
 */
export const LINE_SUBS_K08D = [
  { a: 10845, b: 11005, from: 'const maMennicaBudynek = ownerHasMennica(city.ownerId);', to: 'const gateMennica = mennicaGate(city.ownerId);' },
  { a: 10845, b: 11005, from: 'const maDostepDoZlota = cfg.getOwnerHasZlotoAccess?.(city.ownerId) ?? true;', to: 'const maMennicaBudynek = gateMennica.maMennicaBudynek;' },
  { a: 10845, b: 11005, from: 'const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];', to: '// K08D-Z11 (P5.13): Waluta odkryta i dostęp do złota czyta delegat mennicaGate (bez koniunkcji w UI).' },
  { a: 10845, b: 11005, from: "const walutaOdkryta = techs.includes('Waluta') || techs.includes('waluta');", to: '// (walutaOdkryta: wewnątrz delegatu mennicaGate, K08D-Z11)' },
  { a: 10845, b: 11005, from: 'const maMennica = maMennicaBudynek && maDostepDoZlota;', to: '// (maMennica: koniunkcja wyłącznie w delegacie mennicaGate, K08D-Z11)' },
  { a: 10845, b: 11005, from: 'const mennicaAktywna = maMennica && walutaOdkryta;', to: 'const mennicaAktywna = gateMennica.mennicaAktywna;' },
  { a: 10845, b: 11005, from: 'const mennicaSpiZBrakuZlota = maMennicaBudynek && walutaOdkryta && !maDostepDoZlota;', to: 'const mennicaSpiZBrakuZlota = gateMennica.mennicaSpiZBrakuZlota;' },
  // K08D-Z12 (runda 3, partia religia): reguły skali epoki i parametrów religii -> delegaty; `relParams` (pin) nie jest czytany.
  { a: 5992, b: 6039, from: '  const diff = cfg.difficulty ?? \'normal\';\n', to: '' },
  { a: 5992, b: 6039, from: "  const relParams = data\n    ? loadReligionParams(data.societyParams, diff)\n    : FALLBACK_RELIGION_PARAMS;\n", to: '' },
  { a: 5992, b: 6039, from: '  const xRelTop = kultReligScaleForEra(\n    cfg.getEpoch?.(city.ownerId) ?? 1,\n    loadSocietyScaleParams(data?.societyParams ?? null, diff),\n  );', to: '  const xRelTop = religiaXRelTop(city.ownerId, data);' },
  // K08D-Z12: renderReligia dostaje `data` jako parametr (port nie ma `gameData()`/`activeMap` pinu; mapa nieczytana przez delegat K08C).
  { a: 4112, b: 4220, from: 'function renderReligia(mount: HTMLElement, city: City, view: CityView | null): void {', to: 'export function renderReligia(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {' },
  { a: 4112, b: 4220, from: '  const data = gameData();\n', to: '' },
  { a: 4112, b: 4220, from: 'resolveEmpireSnap(city, activeMap, data)', to: 'resolveEmpireSnap(city, null, data)' },
  // K08D-Z13/Z14 (runda 4, partia wealth): reguły zamożności -> delegaty; `loadWealthParams` dostaje econParams (bez rzutowania typu pinu).
  { a: 4775, b: 4822, from: "    ? loadWealthParams(data.econParams as unknown as RawWealthParamsJson, cfg.difficulty ?? 'normal')", to: "    ? loadWealthParams(data.econParams, cfg.difficulty ?? 'normal')" },
  { a: 4775, b: 4822, from: '    return buildWealthDetailCard(city, ws, epoch, wealthParams, view);', to: '    return buildWealthDetailCard(city, ws, epoch, wealthParams, view, data);' },
  // K08D-Z14: `gameData()` pinu -> parametr `data` (port nie czyta globalnego stanu gry; dane podaje wywołujący).
  { a: 4824, b: 4945, from: '  p: WealthParams,\n  view: CityView | null,\n): HTMLDivElement {', to: '  p: WealthParams,\n  view: CityView | null,\n  data: GameData | null,\n): HTMLDivElement {' },
  { a: 4824, b: 4945, from: '  const data = gameData();\n', to: '' },
  { a: 4824, b: 4945, from: 'const podzial = readPodzialHandlu(city, gameData());', to: 'const podzial = readPodzialHandlu(city, data);' },
];

/**
 * Zastosowanie podstawień K08D do bloku pinu (K08D-Z12, runda 3: podstawienia mogą obejmować wiele linii; `from` z `\n`,
 * usunięcie linii = `from` kończący się `\n` i `to` pusty). Każde `from` musi trafić w zakres pinu DOKŁADNIE raz (SUBS w bramce).
 */
export function applySubsK08d(unit, lines) {
  const subs = LINE_SUBS_K08D.filter((s) => s.a === unit.a && s.b === unit.b);
  let text = lines.join('\n');
  for (const s of subs) text = text.split(s.from).join(s.to);
  return text.split('\n');
}

/** Liczba wystąpień podstawienia w zakresie pinu (joined; bramka SUBS wymaga 1). */
export function countSubK08d(pinLines, a, b, from) {
  const text = pinLines.slice(a - 1, b).join('\n');
  return text.split(from).length - 1;
}
