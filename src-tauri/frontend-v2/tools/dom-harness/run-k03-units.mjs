#!/usr/bin/env node
/**
 * run-k03-units.mjs — harness porownania DOM/tekstu: 16 jednostek K03 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K03-Q1,
 * runda 3) — v2 (`src/ui/cityPanel/k03-cards.ts` + adaptery `k03-model.ts` z `CityPanelDto.panelInputs`) vs pin web
 * `edb8fb56` (`gra/src/ui/cityPanel.ts`, `gra/src/game/manpower.ts`).
 *
 * Jednostki pinu wyciagane PO NAZWIE (extractFn). Zaleznosci spoza K03 stubowane po obu stronach tak samo:
 *   cpInlineIcons / cityPanelChipIconWrap / resourceBrandIconHtml -> identyczne stuby (pin: probe; v2: patch
 *   zrodla k01a-fundament.ts w esbuild, tylko w harnessie). Reguly gry (buildEconParams, mnoznik, trasy,
 *   daninaLabel*, cityHasBibliotekaLine, readPodzialHandlu, cityLudnoscAbsolutna, growthGainPerTurnSlots)
 *   -> stuby zwracajace wartosc, ktora po stronie v2 dostarcza DTO (`panelInputs`).
 * Poza zakresem porownania (NIE_ZMIERZONO, sprawdzane jako asercje adaptera):
 *   buildingHappinessSum (pin :3061 zalezy od game/buildings, K03-Z10 -> silnik).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>   (PIN_DIR = mktemp -d poza repo)
 *   node tools/dom-harness/run-k03-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> 0 roznic; 1 <=> >=1 roznica; 2 <=> blad harnessu.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import * as esbuild from 'esbuild';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Uzycie: node tools/dom-harness/run-k03-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');
const PIN_FILE = join(PIN_DIR, 'gra/src/ui/cityPanel.ts');
const MANPOWER_FILE = join(PIN_DIR, 'gra/src/game/manpower.ts');

const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');
const manLines = readFileSync(MANPOWER_FILE, 'utf8').split('\n');

/** Funkcja top-level z pliku: od `function NAME` do pierwszej linii `}` w kolumnie 0. */
function extractFnFrom(lines, name) {
  const re = new RegExp(`^(export )?function ${name}[\\s(<]`);
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak funkcji ${name}`);
  let j = i;
  while (lines[j] !== '}') j++;
  return lines.slice(i, j + 1).join('\n').replace(/^(export )?function /m, 'export function ');
}
const extractFn = (name) => extractFnFrom(pinLines, name);
function extractLine(re) {
  const l = pinLines.find((x) => re.test(x));
  if (!l) throw new Error(`pin: brak linii ${re}`);
  return 'export ' + l.replace(/^(const|let) /, '$1 ');
}
function extractBlock(re) {
  const i = pinLines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak bloku ${re}`);
  let j = i;
  while (pinLines[j] !== '};') j++;
  return 'export ' + pinLines.slice(i, j + 1).join('\n');
}

const PIN_FNS = [
  'el', 'isEmptyDataVal', 'gridDetailRow', 'appendDetailSection', 'appendDetailAlgo', 'appendDetailGrid',
  'appendDetailFormula', 'setNoteHtml', 'tury', 'fmtDecPl', 'estimateHandelChips', 'techPrereqChain',
  'buildGrowthProgressTooltipCard', 'buildZdrowieDetailCard', 'buildSurowceDetailCard', 'appendCompositionBlock',
  'buildWealthCompactTooltipCard', 'appendWealthCompactStrip', 'buildTopBarRekruciDetailCard', 'copyCityProduction',
  'reorderRecruitQueueItem', 'bindRecruitQueueDragReorder', 'buildHandelDetailCard', 'ownerHasMennica',
  'territoryNodesForPanel', 'readOwnerDefaultPodzialHandlu',
];

const probeSrc = [
  // Stuby wspolne z v2 (ten sam wynik po obu stronach — patrz naglowek).
  'const CP_EMOJI_DETECT = /(?!)/u;',
  'function cpInlineIcons(t: string): string { return t; }',
  'function cityPanelChipIconWrap(id: string, _size?: number): string { return \'<i class="cw">\' + id + \'</i>\'; }',
  'function resourceBrandIconHtml(n: string): string { return \'<i class="rb">\' + n + \'</i>\'; }',
  '// Stan scenariusza (ustawiany przez __setS) i log efektow.',
  'let __S: any = {};',
  'let __log: any[] = [];',
  'export function __setS(s: any): void { __S = s; __log = []; }',
  'export function __getLog(): any[] { return __log; }',
  'export function __getS(): any { return __S; }',
  'const cfg: any = new Proxy({}, { get: (_t, k) => (__S.cfg || {})[k as string] });',
  'function getTechDef(data: any, name: string): any { const v = data.techs[name]; return v === undefined ? undefined : { \'Wymaga (prereq)\': v }; }',
  'function parsePrerequisites(raw: string): string[] { return raw.split(\',\').map((s) => s.trim()).filter(Boolean); }',
  'function cityLudnoscAbsolutna(_l: number, _e: number): number { return __S.osob; }',
  'function growthGainPerTurnSlots(_p: number, _g: number, _f: boolean, _c: boolean): number { return __S.gain; }',
  'function cityHasBibliotekaLine(built: string[]): boolean { return built.includes(\'biblioteka\'); }',
  'function buildEconParams(_d: any, _df: any): any { return __S.params; }',
  'function daninaLabelForCity(_c: any): string { return \'Podatek\'; }',
  'function daninaLabelGenitive(_l: string): string { return \'Podatku\'; }',
  'function daninaLabelAccusative(_l: string): string { return \'Podatek\'; }',
  'function activeTradeRouteCountForCity(_c: any): number { return __S.aktywne ?? 0; }',
  'function computeTradeRouteBuildingBonusByCity(_r: any): Map<string, number> { return new Map([[__S.cityId, __S.premia ?? 0]]); }',
  'function mnoznikHandelPieniadzForCivByDifficulty(_k: any, _c: any, _d: any, _m: any): number { return __S.mnoznik; }',
  'function readPodzialHandlu(_c: any, _d: any): any { return __S.split; }',
  'function normalizePodzialHandlu(x: any): any { return x; }',
  'function buildTerritoryNodesFromCities(cs: any[]): string[] { return cs.map((c) => c.id); }',
  'function attachHoverDetail(w: HTMLElement, build: () => HTMLElement, d: number, s: string): void { __log.push({ d, s, html: build().outerHTML }); }',
  'function setProd(_cityId: string, prod: any): void { __S.prodStore = prod; }',
  'function getProd(_cityId: string): any { return __S.prodStore; }',
  'function rerender(): void { __log.push(\'rerender\'); }',
  extractLine(/^const HANDEL_ZAMOZNOSC_LABEL = /),
  extractLine(/^const HANDEL_KORUPCJA_PCT_PLACEHOLDER = /),
  extractBlock(/^const DEFAULT_PODZIAL_HANDLU/),
  ...PIN_FNS.map(extractFn),
  extractFnFrom(manLines, 'formatPopulationAbs'),
  extractFnFrom(manLines, 'formatManpower'),
  '',
].join('\n');

// Sonda pinu musi lezec w katalogu z gra/src, zeby esbuild nie gubil typow; zapis w katalogu tymczasowym.
const tmp = mkdtempSync(join(tmpdir(), 'p58k03u-harness-'));
let exitCode = 0;
const vc = new VirtualConsole();
const errors = [];
vc.on('jsdomError', (e) => errors.push(String(e?.message ?? e).split('\n')[0]));

/** Patch zrodla v2 (tylko harness): stuby identyczne z probe pinu. Kazdy patch musi trafic dokladnie raz. */
const STUB_PATCHES = [
  ['export function cpInlineIcons(text: string): string {', 'export function cpInlineIcons(text: string): string { return text; '],
  ['export function cityPanelChipIconWrap(id: string, size: BrandIconSize = 18): string {', 'export function cityPanelChipIconWrap(id: string, size: BrandIconSize = 18): string { return \'<i class="cw">\' + id + \'</i>\'; '],
  ['export function resourceBrandIconHtml(nazwa: string): string {', 'export function resourceBrandIconHtml(nazwa: string): string { return \'<i class="rb">\' + nazwa + \'</i>\'; '],
];
const stubPlugin = {
  name: 'k03-stubs',
  setup(b) {
    b.onLoad({ filter: /k01a-fundament\.ts$/ }, (a) => {
      let s = readFileSync(a.path, 'utf8');
      for (const [from, to] of STUB_PATCHES) {
        const n = s.split(from).length - 1;
        if (n !== 1) throw new Error(`patch stubu: oczekiwano 1 trafienia, jest ${n}: ${from}`);
        s = s.replace(from, to);
      }
      return { contents: s, loader: 'ts', resolveDir: dirname(a.path) };
    });
  },
};

const entryJs = (outdir, name) => {
  const hit = (function walk(d) {
    return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  })(outdir).find((p) => p.endsWith('/' + name));
  if (!hit) throw new Error('brak bundla: ' + name);
  return hit;
};

try {
  const probePath = join(tmp, 'pin-probe.ts');
  writeFileSync(probePath, probeSrc);
  const pinOut = join(tmp, 'pin');
  const v2Out = join(tmp, 'v2');
  await esbuild.build({ entryPoints: [probePath], outdir: pinOut, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', logLevel: 'error', write: true });
  await bundle([join(CITY, 'k03-cards.ts'), join(CITY, 'k03-model.ts'), join(V2_ROOT, 'src/controller/mockCatalog.ts'), join(V2_ROOT, 'src/controller/staticCatalog.ts')], v2Out, { extraPlugins: [stubPlugin] });
  const P = await import(pathToFileURL(entryJs(pinOut, 'pin-probe.js')).href);
  const SC = await import(pathToFileURL(entryJs(v2Out, 'staticCatalog.js')).href);
  const MC = await import(pathToFileURL(entryJs(v2Out, 'mockCatalog.js')).href);
  SC.installStaticCatalog(MC.MOCK_STATIC_CATALOG);
  const V = {
    cards: await import(pathToFileURL(entryJs(v2Out, 'k03-cards.js')).href),
    model: await import(pathToFileURL(entryJs(v2Out, 'k03-model.js')).href),
  };

  /** Wykonuje scenariusz w swiezym dokumencie; wynik jako tekst. */
  const runIn = (fn, mod) => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true, virtualConsole: vc });
    const prev = globalThis.document;
    globalThis.document = dom.window.document;
    try {
      return ser(fn(mod, dom.window.document));
    } catch (e) {
      return `THROW: ${String(e?.message ?? e)}`;
    } finally {
      globalThis.document = prev;
    }
  };
  const ser = (x) => {
    if (x && typeof x === 'object' && 'outerHTML' in x) return x.outerHTML;
    if (typeof x === 'string') return x;
    return JSON.stringify(x) ?? String(x);
  };

  const CITY_OBJ = { id: 'c1', ownerId: 0 };
  const MP = { manpowerBiezacy: 1500, manpowerMax: 20000, regenPerTurn: 120, kosztJednostki: 1, werbMaxPrzyPelnejPuli: 9, ludnoscAbsolutna: 1200000, ludki: 4, epoka: 2 };
  const OPTS_A = { poziom: 3, atCap: false, cap: 5, epoch: 2, mnoz: 1.5, szBonus: 1, pula: 12.4, prog: 30, etaW: 4, zamIn: 2, daninaLblGen: 'Podatku' };
  const PCT_A = Math.min(100, (100 * 12.4) / 30);
  const SPLIT = { procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 };
  const VIEW = { nauka: 40, pieniadz: 60, wzrostUlamkowy: 0.5, zywnoscBrutto: 0, kosztRacji: 0, bilansLokalny: 0, poziomRacji: 0 };
  const DANINA = { mianownik: 'Podatek', dopelniacz: 'Podatku', biernik: 'Podatek' };
  const dtoBase = (panel, extra = {}) => ({ labels: { danina: DANINA }, trade: { activeRoutes: 0, buildingBonus: 0, missingTreatyPartners: [] }, panelInputs: panel, ...extra });

  /** [nazwa, pin(P, doc) -> wynik, v2(V, doc) -> wynik] */
  const cases = [];
  const add = (name, pin, v2) => cases.push({ name, pin, v2 });

  add('techPrereqChain: lancuch z pustym prereq i duplikatem',
    (P) => { P.__setS({}); return P.techPrereqChain({ techs: { A: 'B, C', B: 'D, A', C: '', D: '' } }, 'A'); },
    (V) => V.cards.techPrereqChainK('A', { A: ['B', 'C'], B: ['D', 'A'], C: [], D: [] }));

  add('buildGrowthProgressTooltipCard: nakarmione, tempo > 0',
    (P) => { P.__setS({ osob: 1000, gain: 0.25 }); return P.buildGrowthProgressTooltipCard(5, { wzrostUlamkowy: 0.5 }, 2, true, false); },
    (V) => V.cards.buildGrowthProgressTooltipCardK({ wzrostUlamkowy: 0.5 }, { osobNaObywatela: 1000, gainSlots: 0.25, fed: true }));

  add('buildGrowthProgressTooltipCard: glod, bez tempa',
    (P) => { P.__setS({ osob: 1000, gain: 0 }); return P.buildGrowthProgressTooltipCard(5, { wzrostUlamkowy: 0.2 }, 2, false, true); },
    (V) => V.cards.buildGrowthProgressTooltipCardK({ wzrostUlamkowy: 0.2 }, { osobNaObywatela: 1000, gainSlots: 0, fed: false }));

  add('buildZdrowieDetailCard: dwie linie',
    (P) => P.buildZdrowieDetailCard(3, [{ label: 'Budynki', value: 2 }, { label: 'Choroba', value: -1 }], 2, -1),
    (V) => V.cards.buildZdrowieDetailCardK(3, [{ label: 'Budynki', value: 2 }, { label: 'Choroba', value: -1 }], 2, -1));

  add('buildZdrowieDetailCard: brak skladnikow',
    (P) => P.buildZdrowieDetailCard(0, [], 0, 0),
    (V) => V.cards.buildZdrowieDetailCardK(0, [], 0, 0));

  add('buildZdrowieDetailCard: sumy z DTO (adapter)',
    (P) => P.buildZdrowieDetailCard(3, [{ label: 'X', value: 5 }], 2, -1),
    (V) => { const s = V.model.zdrowieSumsFromDto({ health: { total: 3, lines: [] }, panelInputs: { zdrowie: { posSum: 2, negSum: -1 } } }); return V.cards.buildZdrowieDetailCardK(s.total, [{ label: 'X', value: 5 }], s.posSum, s.negSum); });

  add('buildSurowceDetailCard: aktywne i potencjal',
    (P) => P.buildSurowceDetailCard(['Złoto'], ['Żelazo'], false),
    (V) => V.cards.buildSurowceDetailCardK(['Złoto'], ['Żelazo'], false));

  add('buildSurowceDetailCard: legacy',
    (P) => P.buildSurowceDetailCard(['A'], ['B'], true),
    (V) => V.cards.buildSurowceDetailCardK(['A'], ['B'], true));

  add('appendCompositionBlock: linie z notatka i stopka',
    (P, doc) => { const m = doc.createElement('div'); P.appendCompositionBlock(m, 'Tytul', [{ label: 'a', pct: 10 }, { label: 'b', pct: -5, note: 'n' }], 'stopka'); return m; },
    (V, doc) => { const m = doc.createElement('div'); V.cards.appendCompositionBlockK(m, 'Tytul', [{ label: 'a', pct: 10 }, { label: 'b', pct: -5, note: 'n' }], 'stopka'); return m; });

  add('appendCompositionBlock: pusta lista -> nic',
    (P, doc) => { const m = doc.createElement('div'); P.appendCompositionBlock(m, 'T', [], 'x'); return m; },
    (V, doc) => { const m = doc.createElement('div'); V.cards.appendCompositionBlockK(m, 'T', [], 'x'); return m; });

  add('buildWealthCompactTooltipCard: w toku',
    (P) => P.buildWealthCompactTooltipCard(OPTS_A),
    (V) => V.cards.buildWealthCompactTooltipCardK(OPTS_A));

  add('buildWealthCompactTooltipCard: maksimum',
    (P) => P.buildWealthCompactTooltipCard({ ...OPTS_A, atCap: true, poziom: 5 }),
    (V) => V.cards.buildWealthCompactTooltipCardK({ ...OPTS_A, atCap: true, poziom: 5 }));

  add('buildWealthCompactTooltipCard: W1 (bez bonusu mnoznika)',
    (P) => P.buildWealthCompactTooltipCard({ ...OPTS_A, poziom: 1, mnoz: 1 }),
    (V) => V.cards.buildWealthCompactTooltipCardK({ ...OPTS_A, poziom: 1, mnoz: 1 }));

  add('buildWealthCompactTooltipCard: zamIn 0 (brak wplywu)',
    (P) => P.buildWealthCompactTooltipCard({ ...OPTS_A, zamIn: 0 }),
    (V) => V.cards.buildWealthCompactTooltipCardK({ ...OPTS_A, zamIn: 0 }));

  add('buildWealthCompactTooltipCard: bez ETA',
    (P) => P.buildWealthCompactTooltipCard({ ...OPTS_A, etaW: null }),
    (V) => V.cards.buildWealthCompactTooltipCardK({ ...OPTS_A, etaW: null }));

  add('appendWealthCompactStrip: pasek + hover',
    (P, doc) => { const m = doc.createElement('div'); P.__setS({}); P.appendWealthCompactStrip(m, { ...OPTS_A, pct: PCT_A }); return { m: m.outerHTML, hover: P.__getLog() }; },
    (V, doc) => { const m = doc.createElement('div'); const hover = []; V.cards.appendWealthCompactStripK(m, { ...OPTS_A, pct: PCT_A }, (w, b, d, s) => hover.push({ d, s, html: b().outerHTML })); return { m: m.outerHTML, hover }; });

  add('appendWealthCompactStrip: opcje z DTO (adapter wealthOptsFromDto)',
    (P, doc) => { const m = doc.createElement('div'); P.__setS({}); P.appendWealthCompactStrip(m, { ...OPTS_A, pct: PCT_A }); return { m: m.outerHTML, hover: P.__getLog() }; },
    (V, doc) => {
      const dto = { wealth: { poziom: 3, cap: 5, prog: 30, mnoznik: 1.5, zadowolenie: 0, rownowaga: 0 }, labels: { danina: DANINA },
        panelInputs: { wealth: { atCap: false, epoch: 2, szBonus: 1, pula: 12.4, etaW: 4, zamIn: 2 } } };
      const opts = V.model.wealthOptsFromDto(dto, 'Podatku');
      const m = doc.createElement('div'); const hover = []; V.cards.appendWealthCompactStripK(m, opts, (w, b, d, s) => hover.push({ d, s, html: b().outerHTML })); return { m: m.outerHTML, hover };
    });

  add('buildTopBarRekruciDetailCard: pula',
    (P) => P.buildTopBarRekruciDetailCard(null, MP),
    (V) => V.cards.buildTopBarRekruciDetailCardK(MP));

  add('buildTopBarRekruciDetailCard: pula z DTO (adapter recruitPoolFromDto)',
    (P) => P.buildTopBarRekruciDetailCard(null, MP),
    (V) => V.cards.buildTopBarRekruciDetailCardK(V.model.recruitPoolFromDto({ panelInputs: { recruitPool: MP } })));

  // Kolejka rekrutow: przeciagniecie wiersza 0 na wiersz 2 (dragstart + drop), wynik = prod po zapisie + liczba rerender.
  const QPROD = { kolejka: [], postep: 0, rekrutacja: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const dragRun = (doc, sc, dropFrom, dropTo) => {
    const rows = [...sc.querySelectorAll('.qitem')];
    const ds = new doc.defaultView.Event('dragstart', { bubbles: true, cancelable: true });
    rows[dropFrom].dispatchEvent(ds);
    const dr = new doc.defaultView.Event('drop', { bubbles: true, cancelable: true });
    rows[dropTo].dispatchEvent(dr);
    return rows.map((r) => r.className);
  };
  const mkQueue = (doc) => {
    const sc = doc.createElement('div');
    for (let i = 0; i < 3; i++) {
      const r = doc.createElement('div');
      r.className = 'qitem';
      r.dataset.recruitIdx = String(i);
      sc.appendChild(r);
    }
    doc.body.appendChild(sc);
    return sc;
  };
  add('bindRecruitQueueDragReorder: przeciagniecie 0 -> 2',
    (P, doc) => {
      const sc = mkQueue(doc);
      P.__setS({ prodStore: JSON.parse(JSON.stringify(QPROD)) });
      P.bindRecruitQueueDragReorder(sc, CITY_OBJ);
      const cls = dragRun(doc, sc, 0, 2);
      return JSON.stringify({ cls, rerender: P.__getLog().filter((x) => x === 'rerender').length, prodOut: P.__getS().prodStore });
    },
    (V, doc) => {
      const sc = mkQueue(doc);
      V.model.setProd('c1', JSON.parse(JSON.stringify(QPROD)));
      let count = 0;
      V.cards.bindRecruitQueueDragReorderK(sc, 'c1', () => { count++; });
      const cls = dragRun(doc, sc, 0, 2);
      return JSON.stringify({ cls, rerender: count, prodOut: V.model.getProd('c1') });
    });

  // Handel: scenariusz pelny (Mennica aktywna, Targowisko, Biblioteka, korupcja, trasy).
  const PIN_CFG_S1 = {
    getBuiltBuildingIds: () => ['targowisko', 'mennica', 'biblioteka'],
    getCities: () => [CITY_OBJ],
    getOwnerHasZlotoAccess: () => true,
    getUnlockedTechs: () => ['Waluta'],
    getCivKey: () => 'rz',
    data: { civs: [] },
    difficulty: 'normal',
    getTradeRoutes: () => [],
  };
  add('buildHandelDetailCard: Mennica aktywna, Targowisko, korupcja, trasy',
    (P) => {
      P.__setS({ cfg: PIN_CFG_S1, split: SPLIT, params: { korupcjaWspolczynnikDystansu: 1, korupcjaWspolczynnikMiast: 2, korupcjaCap: 0.3, mennicaMnoznikPoWalucie: 2 }, aktywne: 2, premia: 12, mnoznik: 2, cityId: 'c1' });
      return P.buildHandelDetailCard(CITY_OBJ, VIEW, {});
    },
    (V) => V.cards.buildHandelDetailCardK(VIEW, V.model.handelDetailInputFromDto(dtoBase({
      mennica: { budynek: true, dostepZlota: true, walutaOdkryta: true, aktywna: true, spiZBrakuZlota: false, mnoznikTxt: '×2' },
      handel: { maTargowisko: true, maBiblioteka: true, korupcja: { wspolczynnikDystansu: 1, wspolczynnikMiast: 2, cap: 0.3 }, aktywneTrasy: 2, premiaTrasHandlowych: 12 },
    }, { trade: { activeRoutes: 2, buildingBonus: 12, missingTreatyPartners: [] } }), SPLIT)));

  add('buildHandelDetailCard: Mennica spi (brak Zlota), bez widoku i parametrow',
    (P) => {
      P.__setS({ cfg: { ...PIN_CFG_S1, getBuiltBuildingIds: () => ['mennica'], getOwnerHasZlotoAccess: () => false }, split: SPLIT, params: null, aktywne: 0, premia: 0, mnoznik: 2, cityId: 'c1' });
      return P.buildHandelDetailCard(CITY_OBJ, null, null);
    },
    (V) => V.cards.buildHandelDetailCardK(null, V.model.handelDetailInputFromDto(dtoBase({
      mennica: { budynek: true, dostepZlota: false, walutaOdkryta: true, aktywna: false, spiZBrakuZlota: true, mnoznikTxt: '×?' },
      handel: { maTargowisko: false, maBiblioteka: false, korupcja: null, aktywneTrasy: 0, premiaTrasHandlowych: 0 },
    }), SPLIT)));

  add('ownerHasMennica: wlasciciel ma Mennice',
    (P) => { P.__setS({ cfg: { getCities: () => [{ id: 'a', ownerId: 0 }], getBuiltBuildingIds: (id) => (id === 'a' ? ['mennica'] : []) } }); return P.ownerHasMennica(0); },
    (V) => V.model.ownerHasMennicaFromDto(dtoBase({ ownerHasMennica: true })));

  add('ownerHasMennica: brak Mennicy u wlasciciela',
    (P) => { P.__setS({ cfg: { getCities: () => [{ id: 'a', ownerId: 0 }], getBuiltBuildingIds: () => [] } }); return P.ownerHasMennica(0); },
    (V) => V.model.ownerHasMennicaFromDto(dtoBase({ ownerHasMennica: false })));

  add('readOwnerDefaultPodzialHandlu: hook',
    (P) => { P.__setS({ cfg: { getOwnerDefaultPodzialHandlu: () => ({ procentPieniadz: 50, procentNauka: 25, procentLuksus: 25 }) } }); return P.readOwnerDefaultPodzialHandlu({ ownerId: 0 }, null); },
    (V) => V.model.readOwnerDefaultPodzialHandluFromDto({ sliders: { handelDefault: { procentPieniadz: 50, procentNauka: 25, procentLuksus: 25 } } }));

  add('readOwnerDefaultPodzialHandlu: domyslny (brak hooka i danych)',
    (P) => { P.__setS({ cfg: {} }); return P.readOwnerDefaultPodzialHandlu({ ownerId: 0 }, null); },
    (V) => V.model.readOwnerDefaultPodzialHandluFromDto({ sliders: { handelDefault: {} } }));

  add('territoryNodesForPanel: lista miast',
    (P) => { P.__setS({ cfg: { getCities: () => [{ id: 'a' }, { id: 'b' }] } }); return P.territoryNodesForPanel(); },
    (V) => V.model.territoryNodesFromDto(dtoBase({ territoryNodes: ['a', 'b'] })));

  add('territoryNodesForPanel: brak getCities -> undefined',
    (P) => { P.__setS({ cfg: {} }); return P.territoryNodesForPanel(); },
    (V) => V.model.territoryNodesFromDto(dtoBase({})));

  // Pin (K03-Z10): buildingHappinessSum zalezy od game/buildings — poza zakresem porownania pinu; tylko adapter.
  const adapterChecks = [
    ['adapter buildingHappinessSumFromDto zwraca wartosc silnika', V.model.buildingHappinessSumFromDto(dtoBase({ happinessBuildingsSum: 7 })) === 7],
    ['adapter techPrereqsFromDto bez panelInputs -> {}', JSON.stringify(V.model.techPrereqsFromDto(dtoBase(undefined))) === '{}'],
    ['adapter recruitPoolFromDto bez panelInputs -> zera', V.model.recruitPoolFromDto(dtoBase(undefined)).ludki === 0],
    ['adapter ownerHasMennicaFromDto bez panelInputs -> false (jak pin bez miast)', V.model.ownerHasMennicaFromDto(dtoBase(undefined)) === false],
    // K03-Z3 / P5.13: zadnego lokalnego przeliczenia porzadku, wzrostu ani widoku (kod bez komentarzy).
    ['K03 bez lokalnego przeliczenia (computeOrderStateLocal/computeView/cityGrowthLive/resolveOrderState)', (() => {
      const code = ['k03-model.ts', 'k03-cards.ts', 'k03-detail.ts']
        .map((f) => readFileSync(join(CITY, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))
        .join('\n');
      return !/\b(computeOrderStateLocal|computeView|cityGrowthLive|resolveOrderState)\s*\(/.test(code);
    })()],
    ['K03_RETIRED: configureCityPanel i gameData (pin :612, :626)', V.cards.K03_RETIRED.length === 2 && V.cards.K03_RETIRED.every((r) => (r.pin === 'configureCityPanel' ? pinLines[r.line - 1].startsWith('export function configureCityPanel(') || pinLines[r.line - 1].startsWith('function configureCityPanel(') : pinLines[r.line - 1].startsWith('function gameData('))) ],
  ];

  const results = [];
  for (const c of cases) {
    const a = runIn((_d, doc) => c.pin(P, doc), P);
    const b = runIn((_d, doc) => c.v2(V, doc), V);
    results.push({ name: c.name, ok: a === b, pin: a, v2: b });
  }
  for (const [name, ok] of adapterChecks) results.push({ name, ok: !!ok, pin: '(adapter)', v2: ok ? 'ok' : 'FAIL' });

  const throws = results.filter((r) => String(r.pin).startsWith('THROW') || String(r.v2).startsWith('THROW')).length;
  if (args.includes('--verbose')) {
    for (const r of results) console.log(`  [${r.ok ? 'OK' : 'DIFF'}] ${r.name}\n      pin: ${String(r.pin).slice(0, 160)}\n      v2 : ${String(r.v2).slice(0, 160)}`);
  }
  console.log(`run-k03-units: wyjatkow(THROW)=${throws}`);
  const diffs = results.filter((r) => !r.ok).length + throws;
  console.log(`run-k03-units: asercji=${results.length} roznic=${diffs} jsdomErrors=${errors.length}`);
  for (const r of results.filter((x) => !x.ok)) {
    console.log(`  ROZNICA: ${r.name}\n    pin: ${r.pin}\n    v2 : ${r.v2}`);
  }
  exitCode = diffs > 0 ? 1 : 0;
} catch (e) {
  console.error('run-k03-units: blad harnessu:', e?.stack ?? e);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
