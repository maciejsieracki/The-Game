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
 * Podstawienia LINE_SUBS_K08D: brak (ciała kopii bajt w bajt z pinem; reguły idą przez `k08d-deps.ts`).
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
  mnoznikHandelPieniadzForCivByDifficulty,
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

/** Wszystkie partie K08D (kolejność stała). */
export const BATCHES_K08D = [BATCH_HANDEL, BATCH_SLIDER];

/** Partia po nazwie (`handel` | `slider`). */
export const batchByNameK08d = (name) => {
  const b = BATCHES_K08D.find((x) => x.file === `k08d-${name}.ts`);
  if (!b) throw new Error(`nieznana partia K08D: ${name}`);
  return b;
};

/** Brak podstawień (K08D-Z4, jak K08C-Z4). Pusta lista zachowana dla jednolitej bramki. */
export const LINE_SUBS_K08D = [];

/** Zastosowanie podstawień K08D do linii pinu (pusta lista = bez zmian). */
export function applySubsK08d(unit, lines) {
  const subs = LINE_SUBS_K08D.filter((s) => s.a === unit.a && s.b === unit.b);
  return lines.map((line) => {
    let out = line;
    for (const s of subs) {
      if (out.includes(s.from)) out = out.split(s.from).join(s.to);
    }
    return out;
  });
}
