#!/usr/bin/env node
/**
 * gen-k08b-port.mjs — generator portu K08B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 1).
 * Bloki jednostek = linie pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) po podstawieniach `k08b-subs.mjs`
 * (`applySubs`); nagłówek i importy są stałym tekstem tego generatora.
 * Bramka `verify-k08b-copies.mjs` sprawdza wynik względem pinu (ten sam `k08b-subs.mjs`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/gen-k08b-port.mjs --pin-dir <PIN_DIR> [--batch rail|title] [--out <plik.ts>]
 * Domyślny `--out`: `src/ui/cityPanel/k08b-rail.ts` (partia `rail`); `--batch title` -> `k08b-title.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BATCH_RAIL, LINE_SUBS, applySubs, batchByName, codeEndLine } from './k08b-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/gen-k08b-port.mjs --pin-dir <PIN_DIR> [--out <plik>]');
  process.exit(2);
}
const BATCH = batchByName(argOf('--batch') ?? 'rail');
const OUT = resolve(argOf('--out') ?? join(HERE, '../../src/ui/cityPanel', BATCH.file));
const pin = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const units = BATCH.units.slice().sort((x, y) => x.a - y.a);

/** Zakres bloku: zakończony linią `}`/`};`/`;`/`)` (bez końcowych komentarzy i pustych linii). */
const blockRange = (u) => ({ a: u.a, b: codeEndLine(pin, u.a, u.b) });

const blockText = (u) => {
  const { a, b } = blockRange(u);
  const lines = applySubs({ a: u.a, b: u.b }, pin.slice(a - 1, b));
  if (/^(function|const|type) /.test(lines[0])) lines[0] = `export ${lines[0]}`;
  return [`// pin edb8fb56 gra/src/ui/cityPanel.ts:${a}-${b}`, ...lines, '// pin-end'].join('\n');
};

const HEADER = `/**
 * K08B-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 1, partia \`rail\`): jednostki DOM bloku K08 (pin \`edb8fb56\`,
 * \`gra/src/ui/cityPanel.ts\`) — lewa/prawa szyna ikon, pasek „Budynki", zejście na mapę, karta W4.
 * 6 jednostek, 150 LOC (z 24 jednostek DOM bloku K08 = 1 324 LOC; reszta w kolejnych partiach, patrz
 * \`dyspozycje/rust-port/p5/P5-8-K08B.md\`).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08b-port.mjs\` (bloki = pin + \`k08b-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08b-copies.mjs\`.
 *
 * Zależności: DOM/kontroler przez \`requireK08aDeps()\` (K08A-Z2: \`clearGarrisonPanel\`, \`rerender\`); stan
 * \`activeCityPanelTab\` przez akcesory K08A; \`scalePx\` przez \`getK07aScalePx\` (K08B-Z3); \`cfg\` z \`k05b-host\`.
 * Efekty hover (\`attachHoverDetail\`, \`showHoverDetailNow\`) z \`ui/hoverDetailDock\` (moduł UI, nie logika gry).
 */`;

const IMPORTS = `import { attachHoverDetail, showHoverDetailNow } from '../hoverDetailDock';
import { el } from './k01b-dom';
import { CITY_PANEL_ICON_RAIL_VERT_EM, cityPanelBrandIcon, cityPanelChipIconWrap } from './k01a-fundament';
import { cfg, type City, type GameData } from './k05b-host';
import { buildOwnedBuildingsDetailCard } from './k06b-jednostki';
import { getK07aScalePx } from './k07a-fundament';
import {
  CITY_PANEL_ICONS_LEFT, type CityPanelIconTab, cityRailIconHtml, closeCityView, getK08aActiveCityPanelTab,
  requireK08aDeps, setK08aActiveCityPanelTab,
} from './k08a-fundament';`;

const HEADER_TITLE = `/**
 * K08B-2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 2, partia \`title\`): nagłówek sekcji z przyciskiem
 * „i szczegóły" (pin \`edb8fb56\`, \`gra/src/ui/cityPanel.ts\`): helper \`resolveDetailSideHint\` + \`appendSectionTitleWithDetails\`.
 * Jednostki DOM: 1 (\`appendSectionTitleWithDetails\`) — DODATEK blokera spoza zbioru 24 jednostek K08B (blok 7 w
 * \`dyspozycje/rust-port/p5/P5-8-K08B.md\` §3; rozstrzygnięcie K08B-Z6 w §2). Zbiór 24 i liczba pozostałych 18 bez zmian.
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08b-port.mjs --batch title\` (bloki = pin + \`k08b-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08b-copies.mjs --batch title\`.
 * Zależności: \`attachInteractiveDetail\` z \`ui/hoverDetailDock\` (warstwa UI); \`el\` z \`k01b-dom\`.
 */`;
const IMPORTS_TITLE = `import { attachInteractiveDetail } from '../hoverDetailDock';
import { el } from './k01b-dom';`;
const HEAD = BATCH.file === 'k08b-title.ts' ? HEADER_TITLE : HEADER;
const IMP = BATCH.file === 'k08b-title.ts' ? IMPORTS_TITLE : IMPORTS;
const parts = [HEAD, '', IMP, '', `// ─── Jednostki K08B, partia ${BATCH.file} (kopie pinu wygenerowane; markery = bramka verify-k08b-copies.mjs) ─────────────`, ''];
for (const u of units) {
  parts.push(blockText(u), '');
}
writeFileSync(OUT, parts.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n'));
console.log(`gen-k08b-port: ${units.length} bloków -> ${OUT}`);
console.log(`LINE_SUBS: ${LINE_SUBS.length}`);
