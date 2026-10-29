#!/usr/bin/env node
/**
 * gen-k08a-port.mjs — generator portu K08A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1).
 * Bloki jednostek = linie pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) po zmianie nazw (PIN_TO_PORT_NAMES) i LINE_SUBS
 * (`k08a-subs.mjs`); sekcje K08A-Z1..Z4 (zależności, akcesory stanu, adaptery) są stałym tekstem tego generatora.
 * Bramka `verify-k08a-copies.mjs` sprawdza wynik względem pinu (ten sam `k08a-subs.mjs`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/gen-k08a-port.mjs --pin-dir <PIN_DIR> --wybrane <wybrane-r3.json> [--out <plik.ts>]
 * Domyślny `--out`: `src/ui/cityPanel/k08a-fundament.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIN_TO_PORT_NAMES, LINE_SUBS, codeEndLine } from './k08a-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const PIN_DIR = argOf('--pin-dir');
const WYBRANE = argOf('--wybrane');
if (!PIN_DIR || !WYBRANE) {
  console.error('Użycie: node tools/dom-harness/gen-k08a-port.mjs --pin-dir <PIN_DIR> --wybrane <wybrane.json> [--out <plik>]');
  process.exit(2);
}
const OUT = resolve(argOf('--out') ?? join(HERE, '../../src/ui/cityPanel/k08a-fundament.ts'));
const pin = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const units = JSON.parse(readFileSync(resolve(WYBRANE), 'utf8')).slice().sort((x, y) => x.a - y.a);

/** Zakres bloku: zakończony linią `}`/`};`/`;`/`)` (bez końcowych komentarzy i pustych linii). */
const trimEnd = (a, b) => codeEndLine(pin, a, b);

const renamePin = (line) => PIN_TO_PORT_NAMES.reduce((acc, [re, to]) => acc.replace(re, to), line);

const blockText = (u) => {
  const b = trimEnd(u.a, u.b);
  const subs = LINE_SUBS.filter((s) => s.a === u.a && s.b === b);
  const lines = pin.slice(u.a - 1, b).map((l) => {
    const hit = subs.find((s) => s.from === l);
    return hit ? hit.to : renamePin(l);
  });
  if (/^(function|const|type) /.test(lines[0])) lines[0] = `export ${lines[0]}`;
  return [`// pin edb8fb56 gra/src/ui/cityPanel.ts:${u.a}-${b}`, ...lines, '// pin-end'].join('\n');
};

const HEADER = `/**
 * K08A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1, runda 3): jednostki K08 (Handel, magazyn, panel prawy) bez DOM —
 * 15 z 39 jednostek bloku K08 (pin \`edb8fb56\`, \`gra/src/ui/cityPanel.ts\`): 10 nie-DOM (r2) + 5 o zależnościach
 * stanu modułu/kontrolera (r3, adaptery K08A-Z2/Z3).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k08a-port.mjs\` (bloki jednostek = pin + \`k08a-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k08a-copies.mjs\`.
 *
 * Jednostki r2: CityPanelIconTab, CityPanelProductionTab, CityPanelCityParamTab, CITY_PANEL_ICONS_LEFT,
 * CITY_PANEL_ICONS_RIGHT, isProductionPanelTab, CADUCEUS_SVG, cityRailIconHtml, activeCityPanelTab, isCityPanelOpen.
 * Jednostki r3: refreshCityPanelIfOpen, clearCityPanelUxMode, closeCityView, closeCityPanelIfOpen, getOpenCityPanelCityId.
 * NIEPORTOWANE: 24 jednostki DOM (1 324 LOC) → K08B (osobny temat).
 *
 * Konwencja: ciało jednostki = kopia pinu po PIN_TO_PORT_NAMES/LINE_SUBS (\`k08a-subs.mjs\`). Stan modułu pinu
 * (\`uxSectionRefresh\`, \`activeCity\`, \`activeMap\`, \`activeOnClose\`) jest w modułach K06A/K07A — K08A czyta i
 * zapisuje go akcesorami. Efekty DOM (\`clearGarrisonPanel\`, \`disposeHoverDetailDock\`, \`isCityUxFrameOpen\`) i
 * \`rerender\` (cięcie K09) wchodzą przez \`setK08aDeps\` (K08A-Z2). Ikony marki: import \`brandAssets\`.
 *
 * ZAŁOŻENIA (K08A-Z1..Z5) i tabela było/jest: \`dyspozycje/rust-port/p5/P5-8-K08A.md\`.
 */`;

const IMPORTS = `import { brandIconSvg } from '../icons/brandAssets';
import { getK06aState, setK06aActive, type CityK06 } from './k06a-fundament';
import {
  getK07aActiveCity, getK07aUxSectionRefresh, resolveK07aActiveCity, setK07aActiveCity, setK07aUxSectionRefresh,
  type CityK07,
} from './k07a-fundament';`;

const MANUAL_TYPES = `
// ─── K08A-Z2: wstrzykiwane zależności (DOM i rerender kontrolera) ────────────────────────────────────────────────────

export interface K08aDeps {
  /** Pin \`rerender()\` (blok K09, cięcie P5.8-Z1) — przez kontroler/ctx, NIE przez K08A. */
  rerender: () => void;
  /** Pin \`clearGarrisonPanel()\` (K06B, DOM). */
  clearGarrisonPanel: () => void;
  /** Pin \`disposeHoverDetailDock()\` (\`ui/hoverDetailDock\`, DOM). */
  disposeHoverDetailDock: () => void;
  /** Pin \`isCityUxFrameOpen()\` (\`ui/cityUxFrame\`, DOM). */
  isCityUxFrameOpen: () => boolean;
}

let deps: K08aDeps | null = null;

/** Instaluje zależności K08A (most/kontroler). */
export function setK08aDeps(next: K08aDeps | null): void {
  deps = next;
}

/** K08A-Z2: brak \`setK08aDeps\` = wyjątek (pin zawsze wywołuje te funkcje; cicha utrata efektu byłaby błędem). */
function requireK08aDeps(): K08aDeps {
  if (deps === null) throw new Error('K08A: brak setK08aDeps (rerender/DOM — pin zawsze je wywołuje)');
  return deps;
}

// ─── K08A-Z3: stan modułu (pin \`let activeCityPanelTab\`) i lustra stanu K06A/K07A ─────────────────────────────────

/** K08A-Z3: akcesor \`activeCityPanelTab\` (K08B będzie czytać/pisać zakładkę przez akcesory). */
export function getK08aActiveCityPanelTab(): CityPanelIconTab {
  return activeCityPanelTab;
}

export function setK08aActiveCityPanelTab(tab: CityPanelIconTab): void {
  activeCityPanelTab = tab;
}

/**
 * K08A-Z3: pin \`activeCity = null; activeMap = null;\` (\`clearCityPanelUxMode\`). Pin trzyma JEDEN \`activeCity\`;
 * v2 trzyma lustra w K06A (\`activeCity\`, \`activeMap\`) i K07A (\`activeCity\`) — czyszczone razem tu. \`activeOnClose\`
 * zostaje (pin tego nie zeruje).
 */
function clearActiveCityMirrors(): void {
  setK07aActiveCity(null);
  setK06aActive(null, null, getK06aState().activeOnClose);
}

/**
 * K08A-Z4 (r3, zarzut FC r2 #1): pin \`resolveActiveCity()\` odświeża JEDEN \`activeCity\`. Port trzyma dwa lustra
 * (K07A i K06A), a samo \`resolveK07aActiveCity()\` odświeżało tylko K07A. Tu: odświeżenie K07A + synchronizacja lustra
 * K06A do świeżego obiektu o tym samym \`id\` (\`activeMap\`/\`activeOnClose\` bez zmian). Brak miasta = lustro K06A \`null\`.
 * Rzutowanie: \`getCities\` (adapter kontrolera) zwraca pełny obiekt miasta ze store; \`CityK07\` jest jego podzbiorem.
 */
export function resolveK08aActiveCity(): CityK07 | null {
  const fresh = resolveK07aActiveCity();
  const k06 = getK06aState();
  if (fresh === null) {
    if (k06.activeCity !== null) setK06aActive(null, k06.activeMap, k06.activeOnClose);
  } else if (k06.activeCity !== null && k06.activeCity.id === fresh.id) {
    setK06aActive(fresh as unknown as CityK06, k06.activeMap, k06.activeOnClose);
  }
  return fresh;
}
`;

const parts = [HEADER, '', IMPORTS, MANUAL_TYPES, '// ─── Jednostki K08A (kopie pinu wygenerowane; markery = bramka verify-k08a-copies.mjs) ───────────────────────────────', ''];
for (const u of units) {
  parts.push(blockText(u), '');
}
writeFileSync(OUT, parts.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n'));
console.log(`gen-k08a-port: ${units.length} bloków -> ${OUT}`);
