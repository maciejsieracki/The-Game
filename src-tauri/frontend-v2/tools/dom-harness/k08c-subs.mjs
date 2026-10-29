/**
 * k08c-subs.mjs — WSPÓLNE definicje partii K08C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 1).
 * Używane przez `gen-k08c-port.mjs` (generator kopii z pinu) i `verify-k08c-copies.mjs` (bramka ORPHAN=0).
 * Jedno źródło prawdy: generator i bramka nie mogą mieć rozjechanych list.
 *
 * Zakres rundy 1 (dispatch K08C, zadanie 3, po rozstrzygnięciach w `dyspozycje/rust-port/p5/P5-8-K08C.md`):
 *   partia `praca`: `buildPracaDetailCard` (pin :4946-5018) i `buildTopBarPracaDetailCard` (pin :5770-5822).
 * Zdjęte z rundy 1 (blokery nieporotowane, patrz P5-8-K08C.md §3): `renderPodzialPracy` (wymaga `appendPodzialPracyInfo`
 * :5028-5097 → `resolveEmpireSnap`, stan `activeMap`, `psiRowLabel`, `statChipBrand`, `frontItem`, `etaTurns`),
 * `renderWealth`, `renderReligia`, `renderHandelSlidersPanel`.
 *
 * Podstawienia LINE_SUBS: brak (K08C-Z4 — ciała kopii są bajt w bajt z pinem; stan pinu i zależności idą przez
 * importy z `k08c-deps.ts`, `k04b-podzial.ts` i portów K01/K03/K05B o tych samych nazwach jak w pinie).
 */
export { codeEndLine } from './k08b-subs.mjs';

/** Partia `praca` (runda 1): dwie jednostki DOM z zbioru K08C. */
export const BATCH_PRACA = {
  file: 'k08c-praca.ts',
  header: `/**
 * K08C-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 1, partia \`praca\`): karty szczegółów „Praca" (pin \`edb8fb56\`,
 * \`gra/src/ui/cityPanel.ts\`) — \`buildPracaDetailCard\` (karta „Podział pracy", ściąga) i \`buildTopBarPracaDetailCard\`
 * (karta paska u góry „🔨 Praca — co to znaczy"). Jednostki DOM: 2 z zbioru K08C (\`P5-8-K08C.md\` §0).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08c-port.mjs --batch praca\` (bloki = pin, \`k08c-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08c-copies.mjs\`.
 * Delegaty bez portu: \`k08c-deps.ts\` (readPodzialPracy, cityPracaSplit, procentPuliImperiumZBudynkow, computeView);
 * wiring: \`controller/k08cWiring.ts\` (NIE_ZROBIONE w produkcji: wywołujący = K09).
 */`,
  imports: `import { cityPanelChipIconWrap, signed, type EmpireHudSnap } from './k01a-fundament';
import { appendDetailAlgo, appendDetailSection, el, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { cfg, type City, type GameData } from './k05b-host';
import type { CityView } from './k01b-t';
import { PULA_LBL_PELNA, PULA_TIP } from './k01b-t';
import type { GameMap } from './k05a-fundament';
import {
  cityPracaSplit, computeView, procentPuliImperiumZBudynkow, readPodzialPracy,
} from './k08c-deps';`,
  units: [
    { name: 'buildPracaDetailCard', a: 4946, b: 5018 },
    { name: 'buildTopBarPracaDetailCard', a: 5770, b: 5822 },
  ],
};

/** Wszystkie partie K08C (kolejność stała). */
export const BATCHES_K08C = [BATCH_PRACA];

/** Partia po nazwie (`praca`). */
export const batchByNameK08c = (name) => {
  const b = BATCHES_K08C.find((x) => x.file === `k08c-${name}.ts`);
  if (!b) throw new Error(`nieznana partia K08C: ${name}`);
  return b;
};

/** Brak podstawień w rundzie 1 (K08C-Z4). Zachowane jako pusta lista, by bramka SUBS była jednolita. */
export const LINE_SUBS_K08C = [];

/** Zastosowanie podstawień K08C do linii pinu (pusta lista = bez zmian). */
export function applySubsK08c(unit, lines) {
  const subs = LINE_SUBS_K08C.filter((s) => s.a === unit.a && s.b === unit.b);
  return lines.map((line) => {
    let out = line;
    for (const s of subs) {
      if (out.includes(s.from)) out = out.split(s.from).join(s.to);
    }
    return out;
  });
}
