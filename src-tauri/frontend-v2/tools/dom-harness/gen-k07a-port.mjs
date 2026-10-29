#!/usr/bin/env node
/**
 * gen-k07a-port.mjs — generator portu K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 3).
 * Bloki jednostek = linie pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) po zmianie nazw (PIN_TO_PORT_NAMES) i LINE_SUBS
 * (`k07a-subs.mjs`); sekcje K07A-Z1..Z5 (typy, zależności, stan, adaptery) są stałym tekstem tego generatora.
 * Bramka `verify-k07a-copies.mjs` sprawdza wynik względem pinu (ten sam `k07a-subs.mjs`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/gen-k07a-port.mjs --pin-dir <PIN_DIR> --wybrane <wybrane-r3.json> [--out <plik.ts>]
 * Domyślny `--out`: `src/ui/cityPanel/k07a-fundament.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIN_TO_PORT_NAMES, LINE_SUBS, codeEndLine } from './k07a-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const PIN_DIR = argOf('--pin-dir');
const WYBRANE = argOf('--wybrane');
if (!PIN_DIR || !WYBRANE) {
  console.error('Użycie: node tools/dom-harness/gen-k07a-port.mjs --pin-dir <PIN_DIR> --wybrane <wybrane.json> [--out <plik>]');
  process.exit(2);
}
const OUT = resolve(argOf('--out') ?? join(HERE, '../../src/ui/cityPanel/k07a-fundament.ts'));
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
  if (/^(function|const) /.test(lines[0])) lines[0] = `export ${lines[0]}`;
  return [`// pin edb8fb56 gra/src/ui/cityPanel.ts:${u.a}-${b}`, ...lines, '// pin-end'].join('\n');
};

const HEADER = `/**
 * K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 3): jednostki K07 (pasek W3 i okolica) bez DOM — 8 z 8 jednostek
 * nie-DOM bloku K07 (pin \`edb8fb56\`, \`gra/src/ui/cityPanel.ts\`).
 *
 * PLIK GENEROWANY przez \`tools/dom-harness/gen-k07a-port.mjs\` (bloki jednostek = pin + \`k07a-subs.mjs\`).
 * Edycja ręczna bloku \`// pin edb8fb56 …\` … \`// pin-end\` = FAIL bramki \`verify-k07a-copies.mjs\`.
 *
 * Jednostki: uxSectionRefresh, W3_STAT_RES_KEY, resolveActiveCity, w3CityChip, capitalBadgeOrButtonHtml (r2),
 * skeleton, buildCityOnlyW3FlankChips, buildCityResourceStatItems (r3).
 * NIEPORTOWANE: 15 jednostek DOM (1 074 LOC) → K07B (osobny temat).
 *
 * Konwencja: ciało jednostki = kopia pinu po TOKENS/LINE_SUBS (\`k07a-subs.mjs\`). Zależności pinu bez odpowiednika w v2
 * (\`cfg.*\`, \`cityPracaSplit\`, \`readPodzialHandlu\`, \`resolveEmpireSnap\`, \`civWideSixStatsFromEmpireSnap\`,
 * \`resolveOrderState\`, \`ownerCities\`, \`cityPanelTitle\`, \`headerOrderBadge\`, \`drawerTabButtons\`, \`formatManpower\`,
 * \`daninaLabelForCity\`, \`isMeCity\`, \`WYZYWIENIE_MAX\`) wchodzą przez adaptery K07A-Z4 (wrappery o nazwach pinu).
 * Czyste formatery i typy v2 (signed, cityPanelChipIcon, resLocalOnly, …) są importowane — NIE kopiowane.
 *
 * ZAŁOŻENIA (K07A-Z1..Z5) i tabela było/jest: \`dyspozycje/rust-port/p5/P5-8-K07A.md\`.
 */`;

const IMPORTS = `import { resourceScopeClass, type ResourceColorKey } from '../resourceColors';
import { UI_PARAMS } from '../uiParams';
import {
  SCALES, PH, cityPanelBrandIcon, cityPanelChipIcon, loafIconHtml, resLocalOnly, resGlobalLocal, signed,
  type CityDrawerTab, type EmpireHudSnap, type PodzialHandluSplit,
} from './k01a-fundament';
import { estimateHandelChips, resPracaSplitBar } from './k01b-f';
import { clampedGrowthBreakdown } from './k01b-r';
import type { CityView } from './k01b-t';
import { cityFoodSplit } from './k03-model';
import type { GameData, GameMap } from './k05a-fundament';
import { scienceOwlIconHtml } from '../icons/scienceOwlIcon';`;

const MANUAL_TYPES = `
// ─── K07A-Z1: lokalne typy (pola pinu używane przez jednostki K07A) ──────────────────────────────────────────────

/** K07A-Z1: lokalna kopia pól \`City\` z pinu (game/cities.ts) używanych przez jednostki K07A. */
export interface CityK07 {
  id: string;
  ownerId: number;
  name: string;
  population: number;
  /** Pin: \`city.oblegane\` (\`capitalBadgeOrButtonHtml\`, \`:10727\`). */
  oblegane?: boolean;
}

/** K07A-Z1: kształt wyniku pinu \`cityPracaSplit\` (:1361) — pola czytane przez jednostki K07A. */
export interface PracaSplitK07 {
  total: number;
  doBudynkow: number;
  doPuli: number;
  pctBudynki: number;
  pctPuli: number;
}

/** K07A-Z1: kształt wyniku pinu \`civWideSixStatsFromEmpireSnap\` (game/empire-hud-totals) — sześć statystyk. */
export interface SixK07 {
  praca: number;
  zywnosc: number;
  zloto: number;
  nauka: number;
  kultura: number;
  religia: number;
}

// ─── K07A-Z2: wstrzykiwane zależności (wartości z DTO / adaptera) ───────────────────────────────────────────────────

export interface K07aDeps {
  /** Pin \`cfg.isMe?.(ownerId) ?? (ownerId === 0)\` (\`isMeCity\`, \`cityPanel.ts:617-619\`) — adapter liczy fallback. */
  isMe: (ownerId: number) => boolean;
  /** Pin \`cfg.getCapitalCityId?.(ownerId) ?? null\` (\`:10720\`) — adapter zwraca null, gdy brak. */
  getCapitalCityId: (ownerId: number) => string | null;
  /** Pin \`cfg.getCities?.() ?? []\` (\`:10725\`) — adapter zwraca [], gdy brak. */
  getCities: () => readonly CityK07[];
  /** Pin \`!cfg.onSetCapital\` (\`:10724\`) — true, gdy akcja ustawienia stolicy jest dostępna. */
  canSetCapital: boolean;
  /**
   * Pin \`buildChipDeltaStockHtml(civRate, civStock)\` (\`game/empire-hud-totals\`, import \`cityPanel.ts:78\`).
   * W v2 brak odpowiednika — dostarczany przez adapter DTO (K07A-Z2).
   */
  chipDeltaStockHtml: (civRate: number | undefined, civStock: number | undefined) => string;
}

let deps: K07aDeps | null = null;

/** Instaluje zależności K07A (most/kontroler). */
export function setK07aDeps(next: K07aDeps | null): void {
  deps = next;
}

/** K07A-Z2 (r3): brak \`setK07aDeps\` = wyjątek, NIE cicha utrata tempa/zapasu (pin zawsze dokleja te fragmenty). */
function requireK07aDeps(): K07aDeps {
  if (deps === null) throw new Error('K07A: brak setK07aDeps (tempo/zapas chipa W3 — pin zawsze je dokleja)');
  return deps;
}

// ─── K07A-Z3: stan modułu pinu (\`let activeCity\`, \`let uxSectionRefresh\`, \`let activeDrawerTab\`, \`let scalePx\`) ──────

/** Pin \`let activeCity: City | null = null;\` (\`cityPanel.ts:10159\`). */
let activeCity: CityK07 | null = null;

/** Akcesor K07A-Z3: ustawia \`activeCity\` (pin: przypisanie w \`switchCity\`/\`openCityPanel\`, poza K07A). */
export function setK07aActiveCity(city: CityK07 | null): void {
  activeCity = city;
}

/** Akcesor K07A-Z3: czyta \`activeCity\`. */
export function getK07aActiveCity(): CityK07 | null {
  return activeCity;
}

/** Akcesor K07A-Z3: rejestracja odświeżania sekcji ramki UX (pin \`uxSectionRefresh = …\`, \`:11766\`); \`null\` = wyrejestrowanie. */
export function setK07aUxSectionRefresh(refresh: (() => void) | null): void {
  uxSectionRefresh = refresh;
}

/** Akcesor K07A-Z3: czy zarejestrowano odświeżanie sekcji ramki UX. */
export function getK07aUxSectionRefresh(): (() => void) | null {
  return uxSectionRefresh;
}

/** K07A-Z3 (r3): pin \`let activeDrawerTab: CityDrawerTab = 'plony';\` (\`cityPanel.ts:1791\`). Wiąże kontroler (poza K07A). */
let activeDrawerTab: CityDrawerTab = 'plony';

export function setK07aDrawerTab(tab: CityDrawerTab): void {
  activeDrawerTab = tab;
}

export function getK07aDrawerTab(): CityDrawerTab {
  return activeDrawerTab;
}

/** K07A-Z3 (r3): pin \`let scalePx = UI_PARAMS.panel_miasta.font_scale_domyslna_px;\` (\`cityPanel.ts:919\`). */
let scalePx: number = UI_PARAMS.panel_miasta.font_scale_domyslna_px;

export function setK07aScalePx(px: number): void {
  scalePx = px;
}

// ─── K07A-Z4: adaptery zewnętrzne (r3) — \`cfg\` (akcesory pinu) i \`ext\` (wyniki reguł/DTO) ─────────────────────────────

/** K07A-Z4: akcesory \`cfg.*\` pinu używane przez jednostki K07A (kształt jak w pinie; brak = \`undefined\`). */
export interface K07aCfg {
  getEpoch?: (ownerId: number) => number;
  getMaxSafePoziomRacji?: (cityId: string) => number | undefined;
  getReligionState?: (cityId: string) => { przyrostWiernych?: number; dominujaca?: string; udzialPct?: number } | undefined;
  getManpowerSnapshot?: (cityId: string) => { manpowerBiezacy: number; manpowerMax: number; regenPerTurn: number } | undefined;
  getTreasury?: (ownerId: number) => number | undefined;
  getOrderState?: (cityId: string) => { porPct?: number } | undefined;
}

/** K07A-Z4: funkcje pinu bez odpowiednika w v2 (wynik z DTO/silnika; adapter rozstrzyga fallbacki pinu). */
export interface K07aExt {
  cfg: K07aCfg;
  isMeCity: (ownerId: number) => boolean;
  ownerCities: (city: CityK07) => CityK07[];
  cityPanelTitle: (city: CityK07) => string;
  headerOrderBadge: (city: CityK07) => string;
  drawerTabButtons: (activeTab: CityDrawerTab) => string;
  formatManpower: (n: number) => string;
  daninaLabelForCity: (city: CityK07) => string;
  resolveEmpireSnap: (city: CityK07, map: GameMap | null, data: GameData | null) => EmpireHudSnap;
  cityPracaSplit: (city: CityK07, view: CityView, data: GameData | null) => PracaSplitK07;
  readPodzialHandlu: (city: CityK07, data: GameData | null) => PodzialHandluSplit;
  civWideSixStatsFromEmpireSnap: (empire: EmpireHudSnap, six: SixK07) => SixK07;
  resolveOrderState: (city: CityK07, data: GameData) => { state: { porPct?: number } };
}

let cfg: K07aCfg = {};
let ext: K07aExt | null = null;

/** K07A-Z4: instaluje adaptery (most/kontroler); \`cfg\` = \`ext.cfg\`. */
export function setK07aExt(next: K07aExt | null): void {
  ext = next;
  cfg = next?.cfg ?? {};
}

function requireK07aExt(): K07aExt {
  if (ext === null) throw new Error('K07A: brak setK07aExt (adaptery K07A-Z4)');
  return ext;
}

// Wrappery o nazwach pinu (K07A-Z4): ciała jednostek wołają je bez zmian tekstu.
function isMeCity(ownerId: number): boolean {
  return requireK07aExt().isMeCity(ownerId);
}
function ownerCities(city: CityK07): CityK07[] {
  return requireK07aExt().ownerCities(city);
}
function cityPanelTitle(city: CityK07): string {
  return requireK07aExt().cityPanelTitle(city);
}
function headerOrderBadge(city: CityK07): string {
  return requireK07aExt().headerOrderBadge(city);
}
function drawerTabButtons(): string {
  return requireK07aExt().drawerTabButtons(activeDrawerTab);
}
function formatManpower(n: number): string {
  return requireK07aExt().formatManpower(n);
}
function daninaLabelForCity(city: CityK07): string {
  return requireK07aExt().daninaLabelForCity(city);
}
function resolveEmpireSnap(city: CityK07, map: GameMap | null, data: GameData | null): EmpireHudSnap {
  return requireK07aExt().resolveEmpireSnap(city, map, data);
}
function cityPracaSplit(city: CityK07, view: CityView, data: GameData | null): PracaSplitK07 {
  return requireK07aExt().cityPracaSplit(city, view, data);
}
function readPodzialHandlu(city: CityK07, data: GameData | null): PodzialHandluSplit {
  return requireK07aExt().readPodzialHandlu(city, data);
}
function civWideSixStatsFromEmpireSnap(empire: EmpireHudSnap, six: SixK07): SixK07 {
  return requireK07aExt().civWideSixStatsFromEmpireSnap(empire, six);
}
function resolveOrderState(city: CityK07, data: GameData): { state: { porPct?: number } } {
  return requireK07aExt().resolveOrderState(city, data);
}

/** K07A-Z5: kopia stałej pinu \`WYZYWIENIE_MAX = 6\` (\`game/population-growth-v85.ts:28\`). */
const WYZYWIENIE_MAX = 6;

// ─── Jednostki K07A (kopie pinu wygenerowane; markery = bramka verify-k07a-copies.mjs) ─────────────────────────────────
`;

const parts = [HEADER, '', IMPORTS, MANUAL_TYPES];
for (const u of units) {
  parts.push(blockText(u), '');
}
writeFileSync(OUT, parts.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n'));
console.log(`gen-k07a-port: ${units.length} bloków -> ${OUT}`);
