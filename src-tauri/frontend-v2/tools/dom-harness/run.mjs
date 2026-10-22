#!/usr/bin/env node
/**
 * run.mjs — harness porównania DOM/wyników: 15 modułów poziomu 0 frontend-v2 vs ten sam moduł z pinu web
 * `edb8fb56` (temat R-RUSTPORT-P5-2-PORT-LEVEL0-Q1).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>     # odczyt pinu do katalogu scratch
 *   node tools/dom-harness/run.mjs --pin-dir <PIN_DIR> [--json <plik>]
 * EXIT 0 ⇔ 0 różnic we wszystkich porównaniach; 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Metoda:
 *  - oba drzewa pakowane `esbuild` (tools/dom-harness/build.mjs: emulacja `?raw` i `import.meta.glob`
 *    identyczna dla obu stron; strona pin dostaje atrapę `three`, bo jej moduły ładują `three` przy ewaluacji);
 *  - wspólny `jsdom` (globalne `window`/`document`/…); `Date` zamrożony na stałą chwilę (teksty z datą);
 *  - strona v2 dostaje „ODPOWIEDNIKI danych”: `StaticCatalogDto` i DTO zbudowane w harnessie z DANYCH PINU
 *    (`<PIN_DIR>/gra/data/*.json`, czytane w czasie działania — zero kopii w repo) i FUNKCJI PINU
 *    (`categoryOf`, `relationPnModPct`, `diplomacyFairGivePn`, … — harness gra rolę „Rust”);
 *  - porównanie: kanoniczna serializacja DOM (znacznik, WSZYSTKIE atrybuty posortowane — w tym `class`,
 *    węzły tekstowe dokładnie) całego `document.documentElement` po scenariuszu, a dla funkcji
 *    zwracających HTML/tekst — serializacja sparsowanego HTML albo równość JSON wartości.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_DATA = resolve(PIN_DIR, 'gra/data');

const LEVEL0 = [
  'icons/brandAssets.ts', 'leaderPortraits.ts', 'uiParams.ts', 'unitInfographic.ts', 'power-labels.ts',
  'unitMiniPreview.ts', 'civBrandDisplay.ts', 'diplomacyAcceptanceBalance.ts', 'techUnlockParse.ts',
  'minimapHud.ts', 'perfReport.ts', 'improvementBuildConfirm.ts', 'mapLoadingOverlay.ts',
  'saveLoadDialog.ts', 'victoryScreen.ts',
];
/** Moduły pinu używane przez harness jako „Rust” (źródło ODPOWIEDNIKÓW danych). */
const PIN_REF = [
  'units/setup.ts', 'game/diplomacy-pn-engine.ts', 'game/diplomacy-acceptance-points.ts',
  'game/diplomacy-value-catalog.ts', 'game/power-options.ts', 'game/victory.ts', 'game/visibility.ts',
  'map/mapGenProgress.ts', 'map/riverGenSwitch.ts', 'game/terrain-improvements.ts',
  'map/improvement-build.ts', 'buildInfo.ts', 'game/save.ts',
];
const V2_CTRL = ['controller/staticCatalog.ts', 'controller/diagnostics.ts', 'controller/saveSlots.ts', 'controller/unitThumbnails.ts', 'controller/mockCatalog.ts'];

// ─── jsdom ───────────────────────────────────────────────────────────────────
const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => jsdomErrors.push(String(e?.message ?? e).split('\n')[0]));
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const W = dom.window;
const GLOBALS = [
  'window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'HTMLCanvasElement', 'HTMLButtonElement',
  'HTMLParagraphElement', 'HTMLPreElement', 'HTMLInputElement', 'HTMLSpanElement', 'HTMLImageElement', 'Event',
  'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'localStorage', 'sessionStorage', 'location', 'DOMParser',
];
for (const k of GLOBALS) {
  const v = k === 'window' ? W : W[k];
  Object.defineProperty(globalThis, k, { value: typeof v === 'function' && k !== 'window' && /^[a-z]/.test(k) ? v.bind(W) : v, configurable: true, writable: true });
}
// Zamrożony czas (teksty z datą/stoperem identyczne po obu stronach).
const FIXED = Date.UTC(2026, 9, 22, 10, 30, 15);
const RealDate = Date;
class FrozenDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
  static now() { return FIXED; }
}
globalThis.Date = FrozenDate;
W.Date = FrozenDate;
// Pobieranie pliku (perfReport.downloadTextFile) — bez nawigacji; deterministyczne URL-e blob
// (licznik zerowany przed każdą połową scenariusza, więc obie strony dostają te same adresy).
W.HTMLAnchorElement.prototype.click = function () {};
let blobSeq = 0;
URL.createObjectURL = () => `blob:harness/${++blobSeq}`;
URL.revokeObjectURL = () => {};
const origWarn = console.warn;
console.warn = () => {};

// ─── pakowanie ───────────────────────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'p52-harness-'));
const pinOut = join(tmp, 'pin');
const v2Out = join(tmp, 'v2');
let exitCode = 0;
try {
  await bundle([...LEVEL0.map((m) => join(PIN_SRC, 'ui', m)), ...PIN_REF.map((m) => join(PIN_SRC, m))], pinOut);
  await bundle([...V2_CTRL.map((m) => join(V2_ROOT, 'src', m)), ...LEVEL0.map((m) => join(V2_ROOT, 'src/ui', m))], v2Out);
  const imp = (base, rel) => import(pathToFileURL(join(base, rel.replace(/\.ts$/, '.js'))).href);

  const pin = {};
  for (const m of PIN_REF) pin[m] = await imp(pinOut, m);
  for (const m of LEVEL0) pin['ui/' + m] = await imp(pinOut, 'ui/' + m);

  const json = (f) => JSON.parse(readFileSync(join(PIN_DATA, f), 'utf8'));
  const unitsJson = json('units.json');
  const civsJson = json('civs.json');
  const techJson = json('tech.json');
  const buildingsJson = json('buildings.json');
  const uiParamsJson = json('ui-params.json');
  const { categoryOf } = pin['units/setup.ts'];

  // „Rust”: StaticCatalogDto z danych i funkcji pinu.
  const unitCategory = {};
  const unitCategoryNameOnly = {};
  const catCollisions = [];
  for (const u of unitsJson) {
    const c = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    if (u.Jednostka in unitCategory && unitCategory[u.Jednostka] !== c) catCollisions.push(u.Jednostka);
    unitCategory[u.Jednostka] = c;
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  const catalog = {
    contentHash: 'harness-pin-edb8fb56',
    buildings: buildingsJson, units: unitsJson, tech: techJson, terrainImprovements: {}, wonders: [], counters: {},
    civs: civsJson, cityNamesPools: {}, powerParams: {}, uiParams: uiParamsJson, wiki: {},
    constants: {
      fogExploredBrightness: pin['game/visibility.ts'].FOG_EXPLORED_BRIGHTNESS,
      progDominacjiPower: pin['game/victory.ts'].PROG_DOMINACJI_POWER,
      mapGenPhaseTotal: pin['map/mapGenProgress.ts'].MAP_GEN_PHASE_TOTAL,
      mapGenPhaseLabels: { ...pin['map/mapGenProgress.ts'].MAP_GEN_PHASE_LABELS },
    },
    labels: { powerHudLabelPl: pin['game/power-options.ts'].loadPowerOpcje().hudEtykietaPl },
    unitCategory, unitCategoryNameOnly,
  };

  const v2 = {};
  for (const m of V2_CTRL) v2[m] = await imp(v2Out, m);
  v2['controller/staticCatalog.ts'].installStaticCatalog(catalog);
  for (const m of LEVEL0) v2['ui/' + m] = await imp(v2Out, 'ui/' + m);

  // ─── porównanie ────────────────────────────────────────────────────────────
  const results = new Map();
  const R = (mod) => {
    if (!results.has(mod)) results.set(mod, { module: mod, cases: 0, diffs: 0, examples: [], notMeasured: [] });
    return results.get(mod);
  };
  function ser(node) {
    if (node.nodeType === 3) return JSON.stringify(node.data);
    if (node.nodeType === 8) return `<!--${node.data}-->`;
    if (node.nodeType !== 1) return '';
    const tag = node.tagName.toLowerCase();
    const attrs = [...node.attributes].map((a) => `${a.name}=${JSON.stringify(a.value)}`).sort().join(' ');
    const kids = tag === 'template' ? node.content.childNodes : node.childNodes;
    return `<${tag}${attrs ? ' ' + attrs : ''}>${[...kids].map(ser).join('')}</${tag}>`;
  }
  const htmlSer = (s) => {
    const t = document.createElement('template');
    t.innerHTML = s;
    return [...t.content.childNodes].map(ser).join('');
  };
  const canon = (v) => (typeof v === 'string' && /<[a-zA-Z!]/.test(v) ? 'HTML:' + htmlSer(v) : 'JSON:' + JSON.stringify(v));
  function record(mod, label, a, b) {
    const r = R(mod);
    r.cases++;
    if (a !== b) {
      r.diffs++;
      if (r.examples.length < 5) {
        let i = 0;
        while (i < a.length && a[i] === b[i]) i++;
        r.examples.push({ label, at: i, pin: a.slice(Math.max(0, i - 60), i + 120), v2: b.slice(Math.max(0, i - 60), i + 120) });
      }
    }
  }
  const cmpVal = (mod, label, a, b) => record(mod, label, canon(a), canon(b));
  function resetDoc() {
    for (const n of [...document.documentElement.childNodes]) {
      if (n !== document.head && n !== document.body) n.remove();
    }
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  }
  const snapshot = () => ser(document.documentElement);
  async function domCase(mod, label, runPin, runV2, { seedStorage } = {}) {
    resetDoc();
    localStorage.clear();
    seedStorage?.();
    blobSeq = 0;
    await runPin();
    const a = snapshot();
    resetDoc();
    localStorage.clear();
    seedStorage?.();
    blobSeq = 0;
    await runV2();
    const b = snapshot();
    resetDoc();
    record(mod, label, a, b);
    return b;
  }
  const notMeasured = (mod, why) => R(mod).notMeasured.push(why);

  // 1. icons/brandAssets.ts
  {
    const M = 'icons/brandAssets.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const brandDir = join(PIN_SRC, 'ui/icons/brand');
    const manifest = JSON.parse(readFileSync(join(brandDir, 'icons-manifest.json'), 'utf8'));
    const mapKeys = (f) => Object.keys(JSON.parse(readFileSync(join(brandDir, f), 'utf8')).map);
    for (const id of [...Object.keys(manifest.icons), 'nieistniejaca-ikona']) {
      for (const size of [16, 24, 40]) {
        cmpVal(M, `brandIconSvg(${id},${size})`, P.brandIconSvg(id, size), V.brandIconSvg(id, size));
        cmpVal(M, `menuIconSvg(${id},${size})`, P.menuIconSvg(id, size), V.menuIconSvg(id, size));
      }
    }
    for (const k of [...mapKeys('improvement-icon-map.json'), 'nieznane']) cmpVal(M, `improvementIconSvg(${k})`, P.improvementIconSvg(k), V.improvementIconSvg(k));
    for (const k of [...mapKeys('resources-map-icon-map.json'), 'Ruda żelaza', 'Bydło (krowa/wół)', 'xyz']) cmpVal(M, `mapResourceIconSvg(${k})`, P.mapResourceIconSvg(k, 20), V.mapResourceIconSvg(k, 20));
    for (const k of ['Laka', 'Rownina', 'Wzgorza', 'Gory', 'Pustynia', 'Morze', 'Wybrzeze', 'Łąka', 'Góry', 'ocean', '', 'Tundra']) cmpVal(M, `terrainIconSvg(${k})`, P.terrainIconSvg(k), V.terrainIconSvg(k));
    for (const b of buildingsJson) {
      cmpVal(M, `buildingIconSvg(def ${b.id})`, P.buildingIconSvg(b), V.buildingIconSvg(b));
      cmpVal(M, `buildingIconSvg(undefined,${b.id})`, P.buildingIconSvg(undefined, b.id), V.buildingIconSvg(undefined, b.id));
    }
    cmpVal(M, 'buildingIconSvg(undefined)', P.buildingIconSvg(undefined), V.buildingIconSvg(undefined));
    for (const u of unitsJson) {
      cmpVal(M, `unitIconSvg(def ${u.Jednostka})`, P.unitIconSvg(u), V.unitIconSvg(u));
      cmpVal(M, `unitIconSvg(undefined,${u.Jednostka})`, P.unitIconSvg(undefined, u.Jednostka), V.unitIconSvg(undefined, u.Jednostka));
    }
    cmpVal(M, 'unitIconSvg(undefined)', P.unitIconSvg(undefined), V.unitIconSvg(undefined));
    for (const k of [...mapKeys('civ-icon-map.json'), 'nieznana']) cmpVal(M, `civIconSvg(${k})`, P.civIconSvg(k, 40), V.civIconSvg(k, 40));
    for (const k of [...mapKeys('epoch-icon-map.json'), 'nieznana']) cmpVal(M, `epochIconSvg(${k})`, P.epochIconSvg(k), V.epochIconSvg(k));
    for (const k of [...mapKeys('setting-icon-map.json'), 'nieznane']) cmpVal(M, `settingIconSvg(${k})`, P.settingIconSvg(k, 20), V.settingIconSvg(k, 20));
    cmpVal(M, 'brandMenuComponentsCss', P.brandMenuComponentsCss(), V.brandMenuComponentsCss());
    cmpVal(M, 'brandMenuEmblemSvg', P.brandMenuEmblemSvg(), V.brandMenuEmblemSvg());
    cmpVal(M, 'newGameIntroEmblemSvg(40)', P.newGameIntroEmblemSvg(40), V.newGameIntroEmblemSvg(40));
    cmpVal(M, 'newGameIntroEmblemSvg()', P.newGameIntroEmblemSvg(), V.newGameIntroEmblemSvg());
    cmpVal(M, 'brandMotionCss', P.brandMotionCss(), V.brandMotionCss());
    cmpVal(M, 'brandMenuBackgroundCss', P.brandMenuBackgroundCss(), V.brandMenuBackgroundCss());
    cmpVal(M, 'svgThumbHtml', P.svgThumbHtml('<svg><g/></svg>'), V.svgThumbHtml('<svg><g/></svg>'));
    if (catCollisions.length) notMeasured(M, `kolizje nazw jednostek w units.json z różną kategorią: ${catCollisions.join(', ')}`);
  }

  // 2. leaderPortraits.ts
  {
    const M = 'leaderPortraits.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const keys = new Set(['', 'nieznany', 'Teby · Egipt · miasto-państwo', 'Słowianie', 'CHIŃCZYCY', 'rz']);
    for (const c of civsJson.cywilizacje) for (const k of [c.ikonaId, c.Cywilizacja, c.typCywilizacji]) if (k) keys.add(k);
    for (const k of [...keys, null, undefined]) {
      for (const era of [0, 1, 2, 2.6, 3, 4, 5]) {
        cmpVal(M, `leaderPortraitUrl(${k},${era})`, P.leaderPortraitUrl(k, era), V.leaderPortraitUrl(k, era));
        cmpVal(M, `leaderName(${k},${era})`, P.leaderName(k, era), V.leaderName(k, era));
      }
      for (const oi of [0, 1, 7, 13, -1]) cmpVal(M, `leaderNameFromPool(${k},${oi})`, P.leaderNameFromPool(k, oi), V.leaderNameFromPool(k, oi));
      cmpVal(M, `civDisplayNameFromKey(${k})`, P.civDisplayNameFromKey(k), V.civDisplayNameFromKey(k));
      cmpVal(M, `civIconIdFromCivLabel(${k})`, P.civIconIdFromCivLabel(k), V.civIconIdFromCivLabel(k));
      for (const icon of [null, 'grecy', 'egipt']) cmpVal(M, `civCardDisplayName(${k},${icon})`, P.civCardDisplayName(k ?? '', icon), V.civCardDisplayName(k ?? '', icon));
    }
  }

  // 3. uiParams.ts
  cmpVal('uiParams.ts', 'UI_PARAMS', pin['ui/uiParams.ts'].UI_PARAMS, v2['ui/uiParams.ts'].UI_PARAMS);

  // 4. unitInfographic.ts
  {
    const M = 'unitInfographic.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    for (const u of unitsJson) {
      cmpVal(M, `category(${u.Jednostka})`, P.unitInfographicCategory(u), V.unitInfographicCategory(u));
      cmpVal(M, `category(undefined,${u.Jednostka})`, P.unitInfographicCategory(undefined, u.Jednostka), V.unitInfographicCategory(undefined, u.Jednostka));
      cmpVal(M, `combatClass(${u.Jednostka})`, P.unitCombatClassTag(u), V.unitCombatClassTag(u));
      cmpVal(M, `svg(${u.Jednostka},30)`, P.unitInfographicSvg(u, u.Jednostka, 30), V.unitInfographicSvg(u, u.Jednostka, 30));
      cmpVal(M, `medallion(${u.Jednostka})`, P.unitInfographicMedallionHtml(u, u.Jednostka), V.unitInfographicMedallionHtml(u, u.Jednostka));
      cmpVal(M, `medallion(undefined,${u.Jednostka})`, P.unitInfographicMedallionHtml(undefined, u.Jednostka, 28), V.unitInfographicMedallionHtml(undefined, u.Jednostka, 28));
    }
    for (const c of ['lucznik', 'domyslny', 'xyz']) cmpVal(M, `label(${c})`, P.unitInfographicLabel(c), V.unitInfographicLabel(c));
    cmpVal(M, 'UNIT_INFOGRAPHIC_CSS', P.UNIT_INFOGRAPHIC_CSS, V.UNIT_INFOGRAPHIC_CSS);
    await domCase(M, 'ensureUnitInfographicStyles', () => P.ensureUnitInfographicStyles(), () => V.ensureUnitInfographicStyles());
  }

  // 5. power-labels.ts
  {
    const M = 'power-labels.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    cmpVal(M, 'mocLabel', P.mocLabel(), V.mocLabel());
    for (const n of [0, 3020, -5, 1.5]) {
      cmpVal(M, `mocTitle(${n})`, P.mocTitle(n), V.mocTitle(n));
      cmpVal(M, `mocWithValue(${n})`, P.mocWithValue(n), V.mocWithValue(n));
    }
    cmpVal(M, 'MOC_LABEL_PL/EN', [P.MOC_LABEL_PL, P.MOC_LABEL_EN], [V.MOC_LABEL_PL, V.MOC_LABEL_EN]);
    // Dane pinu mają etykietę równą domyślnej („Moc”), więc porównanie z pinem nie odróżni odczytu DTO
    // od stałej. Asercje v2: etykieta MUSI pochodzić z `StaticCatalogDto.labels.powerHudLabelPl`.
    const sc = v2['controller/staticCatalog.ts'];
    const checks = [];
    sc.installStaticCatalog({ ...catalog, labels: { ...catalog.labels, powerHudLabelPl: 'Siła-TEST' } });
    checks.push(['DTO „Siła-TEST” → mocLabel()', V.mocLabel() === 'Siła-TEST'], ['DTO → mocTitle(7)', V.mocTitle(7) === 'Siła-TEST 7']);
    sc.installStaticCatalog({ ...catalog, labels: { ...catalog.labels, powerHudLabelPl: '' } });
    checks.push(['DTO pusty → MOC_LABEL_PL', V.mocLabel() === 'Moc']);
    sc.installStaticCatalog(catalog);
    R(M).v2Assertions = checks.map(([k, ok]) => ({ check: k, ok }));
    R(M).v2AssertionsFailed = checks.filter(([, ok]) => !ok).length;
  }

  // 6. unitMiniPreview.ts — pin wymaga WebGL (three); porównanie niemożliwe bez renderu 3D.
  {
    const M = 'unitMiniPreview.ts';
    const V = v2['ui/' + M];
    notMeasured(M, 'pin renderuje miniaturę przez THREE.WebGLRenderer + render/units.buildUnitModel (pin :26-113) — w jsdom brak WebGL; D-UI-3: obraz z Rust. Sprawdzono tylko strukturę v2 (asercje niżej).');
    resetDoc();
    const box = document.createElement('div');
    document.body.appendChild(box);
    V.mountUnitMiniPreview(box, unitsJson[0]);
    const loading = box.innerHTML;
    await new Promise((r) => requestAnimationFrame(() => r()));
    await new Promise((r) => setTimeout(r, 0));
    const r = R(M);
    const checks = [
      ['klasa kontenera', box.classList.contains('unit-mini-preview')],
      ['stan ładowania = <span class="unit-mini-loading">…</span>', loading === '<span class="unit-mini-loading">…</span>'],
      ['placeholder .unit-mini-canvas 80×80', box.children.length === 1 && box.firstElementChild.className === 'unit-mini-canvas'
        && box.firstElementChild.style.width === '80px' && box.firstElementChild.style.height === '80px'],
      ['defaultOwnerColor = 0x3b7dd8 (pin :11)', V.defaultOwnerColor() === 0x3b7dd8],
    ];
    r.v2Assertions = checks.map(([k, ok]) => ({ check: k, ok }));
    r.v2AssertionsFailed = checks.filter(([, ok]) => !ok).length;
    resetDoc();
  }

  // 7. civBrandDisplay.ts
  {
    const M = 'civBrandDisplay.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const keys = new Set(['', 'nieznana', null, undefined]);
    for (const c of civsJson.cywilizacje) for (const k of [c.ikonaId, c.typCywilizacji, c.Cywilizacja, c.Cywilizacja?.toUpperCase()]) if (k) keys.add(k);
    for (const k of keys) {
      cmpVal(M, `civBrandLineForKey(${k})`, P.civBrandLineForKey(k), V.civBrandLineForKey(k));
      cmpVal(M, `civBrandTitleAttrForKey(${k})`, P.civBrandTitleAttrForKey(k), V.civBrandTitleAttrForKey(k));
    }
    for (const [s, j] of [['a', 'b'], ['—', 'x'], ['', ''], [null, 'Falanga <"&">'], [' styl ', '—']]) {
      cmpVal(M, `formatCivBrandLine(${s},${j})`, P.formatCivBrandLine(s, j), V.formatCivBrandLine(s, j));
      cmpVal(M, `civBrandTitleAttr(${s},${j})`, P.civBrandTitleAttr(s, j), V.civBrandTitleAttr(s, j));
    }
  }

  // 8. diplomacyAcceptanceBalance.ts
  {
    const M = 'diplomacyAcceptanceBalance.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const E = pin['game/diplomacy-pn-engine.ts'];
    const AP = pin['game/diplomacy-acceptance-points.ts'];
    const VC = pin['game/diplomacy-value-catalog.ts'];
    // „Rust”: RelationDealDto z funkcji pinu.
    const rel = (t) => ({
      total: t,
      modPct: E.relationPnModPct(E.relationSignedFromTotal(t)),
      modLabel: E.formatRelationModLabel(t),
      tradeFairMult: 100 / Math.max(1, t),
      tradeParity: t >= 100,
    });
    const RELS = [0, 1, 10, 27.8, 50, 99, 100, 101, 140, 190, 250];
    cmpVal(M, 'PW_EXCHANGE_TOOLTIP', P.PW_EXCHANGE_TOOLTIP, V.PW_EXCHANGE_TOOLTIP);
    cmpVal(M, 'RELATION_DEAL_TOOLTIP', P.RELATION_DEAL_TOOLTIP, V.RELATION_DEAL_TOOLTIP);
    for (const t of RELS) for (const ctx of ['treaty', 'trade']) {
      cmpVal(M, `relRow(${t},${ctx})`, P.renderRelationDealModRowHtml(t, ctx), V.renderRelationDealModRowHtml(rel(t), ctx));
    }
    // Koszyk handlu.
    const previews = [undefined, { accepted: true, pwBalance: 5 }, { accepted: false, pwBalance: -12 }, { accepted: true }, { accepted: false }, { accepted: true, pwBalance: 0 }];
    for (const give of [null, 0, 10, 50, 110]) for (const recv of [null, 0, 10, 50, 100]) for (const t of [20, 27.8, 60, 100, 150]) for (const fp of previews) {
      const label = `basket(${give},${recv},${t},${JSON.stringify(fp)})`;
      const pinHtml = P.renderPnBalancePanelFromBasket(give, recv, t, 'Wymiana', fp);
      let dto;
      if (give == null || recv == null) dto = { givePn: give, receivePn: recv, fairMinPn: 0, balancePn: 0, accepted: false, relation: { ...rel(t), signed: 0 } };
      else {
        const fairMin = VC.diplomacyFairGivePn(recv, Math.min(100, t));
        dto = {
          givePn: give, receivePn: recv,
          balancePn: fp?.pwBalance ?? (give - fairMin),
          fairMinPn: fp?.pwBalance != null ? give - fp.pwBalance : fairMin,
          accepted: fp?.accepted ?? E.pnDealAcceptedByAi(give, recv, t),
          relation: { ...rel(t), signed: E.relationSignedFromTotal(t) },
        };
      }
      cmpVal(M, label, pinHtml, V.renderPnBalancePanelFromBasket(dto, 'Wymiana'));
    }
    cmpVal(M, 'basket(label domyślny)', P.renderPnBalancePanelFromBasket(30, 20, 80), V.renderPnBalancePanelFromBasket({ givePn: 30, receivePn: 20, fairMinPn: VC.diplomacyFairGivePn(20, 80), balancePn: 30 - VC.diplomacyFairGivePn(20, 80), accepted: E.pnDealAcceptedByAi(30, 20, 80), relation: { ...rel(80), signed: -20 } }));
    // Koszyk traktatu (replika `:744-797` pinu na funkcjach pinu = „Rust”).
    const treatyDto = (playerTreatyPw, give, recv, t, relRequired, treatyBasePw, partnerTreatyPw) => {
      const base = treatyBasePw ?? partnerTreatyPw ?? playerTreatyPw;
      const partnerPw = partnerTreatyPw ?? E.treatyPwForRole(base, t, 'partner');
      const playerPw = playerTreatyPw > 0 ? playerTreatyPw : E.treatyPwForRole(base, t, 'player');
      const myDisplay = playerPw + give;
      const theirDisplay = partnerPw + recv;
      const asym = myDisplay - theirDisplay;
      const relOk = relRequired == null || t >= relRequired;
      const basketFairMin = recv > 0 ? VC.diplomacyFairGivePn(recv, Math.min(100, t)) : 0;
      const basketFair = recv <= 0 || E.pnDealAcceptedByAi(give, recv, t);
      return {
        basePw: base, playerPw, partnerPw, basketGivePn: give, basketReceivePn: recv,
        basketNet: Math.max(0, give - recv), myDisplayPw: myDisplay, theirDisplayPw: theirDisplay,
        relRequired: relRequired ?? null, relOk, basketFair,
        accepted: relOk && asym >= 0 && basketFair,
        balancePn: basketFair ? asym : (give - basketFairMin),
        relation: rel(t),
      };
    };
    for (const ptp of [0, 40]) for (const give of [0, 30, 110]) for (const recv of [0, 50]) for (const t of [27.8, 80, 100, 140])
      for (const rr of [undefined, 60]) for (const tb of [undefined, 50]) for (const pp of [undefined, 45]) {
        const label = `treaty(${ptp},${give},${recv},${t},${rr},${tb},${pp})`;
        cmpVal(M, label,
          P.renderPnBalancePanelForTreaty(ptp, give, recv, t, 'Sojusz', rr, 'Traktat', tb, pp),
          V.renderPnBalancePanelForTreaty(treatyDto(ptp, give, recv, t, rr, tb, pp), 'Sojusz', 'Traktat'));
      }
    for (const ptp of [0, 40]) for (const give of [0, 60]) for (const recv of [0, 20]) for (const t of [50, 120]) for (const tb of [undefined, 35]) {
      cmpVal(M, `peace(${ptp},${give},${recv},${t},${tb})`,
        P.renderPnBalancePanelForPeace(ptp, give, recv, t, 'Propozycja pokoju', tb),
        V.renderPnBalancePanelForPeace(treatyDto(ptp, give, recv, t, undefined, tb, tb != null ? tb : undefined), 'Propozycja pokoju'));
    }
    // Panel stołu negocjacji: pin `balancePanelDataFromRows` (= „Rust”) → render.
    const side = (o) => ({ offerPn: 0, demandPn: 0, fairMinPn: 0, balancePn: 0, treatyBasePn: 0, mode: 'basket', statusLabel: 'Status testowy', accepted: true, ...o });
    const S = {
      basketOk: side({ offerPn: 60, demandPn: 40, fairMinPn: 50, balancePn: 10, relCurrent: 80 }),
      basketNo: side({ offerPn: 20, demandPn: 40, fairMinPn: 50, balancePn: -30, accepted: false, statusLabel: 'Brakuje 30 PW', relCurrent: 40 }),
      treaty: side({ mode: 'treaty', treatyBasePn: 50, treatyEffectivePn: 65, relationModPct: 30, relCurrent: 130, relRequired: 60, relBalance: 70 }),
      treatyLowRel: side({ mode: 'treaty', treatyBasePn: 50, treatyEffectivePn: 25, relationModPct: -50, relCurrent: 50, relRequired: 70, relBalance: -20, accepted: false, statusLabel: 'Relacja za niska' }),
      mixed: side({ mode: 'mixed', offerPn: 30, treatyBasePn: 40, treatyEffectivePn: 44, relCurrent: 110 }),
      gift: side({ mode: 'gift', offerPn: 25 }),
    };
    const rowsCases = [
      [],
      [{ direction: 'own', actionLabel: 'Umowa wymiany', acceptanceMy: S.basketOk, acceptanceTheir: S.basketOk }],
      [{ direction: 'own', actionLabel: 'Bez strony', acceptanceMy: S.basketOk }],
      [{ direction: 'own', actionLabel: 'Czeka', awaitingAiResponse: true, acceptanceMy: S.basketOk, acceptanceTheir: S.basketNo, responderPreview: { accepted: true, pwBalance: 4 } }],
      [{ direction: 'own', actionLabel: 'Czeka-odrzut', awaitingAiResponse: true, acceptanceMy: S.basketNo, acceptanceTheir: S.basketNo, responderPreview: { accepted: false, reason: 'Za mało', pwBalance: -9 } }],
      [{ direction: 'own', actionLabel: 'Czeka-bez-podglądu', awaitingAiResponse: true, acceptanceMy: S.basketOk, acceptanceTheir: S.basketOk }],
      [{ id: 'n1', direction: 'incoming', actionLabel: 'Handel od AI', acceptanceMy: S.basketOk, acceptanceTheir: S.basketOk, canAccept: true, responderPreview: { accepted: true, pwBalance: 12 } }],
      [{ id: 'n2', direction: 'incoming', actionLabel: 'Handel od AI (−)', acceptanceMy: S.basketNo, acceptanceTheir: S.basketNo, responderPreview: { accepted: true, pwBalance: -7 } }],
      [{ id: 'n3', direction: 'incoming', actionLabel: 'Pokój', uiActionId: '10', acceptanceMy: S.treaty, acceptanceTheir: S.treaty, responderPreview: { accepted: true, reason: 'Warunki pokoju spełnione', pwBalance: -3 } }],
      [{ id: 'n4', direction: 'incoming', actionLabel: 'Traktat', acceptanceMy: S.treatyLowRel, acceptanceTheir: S.treatyLowRel, responderPreview: { accepted: false } }],
      [{ id: 'n5', direction: 'incoming', actionLabel: 'Mieszany', acceptanceMy: S.mixed, acceptanceTheir: S.mixed, responderPreview: { accepted: true } }],
      [{ id: 'n6', direction: 'incoming', actionLabel: 'Dar', acceptanceMy: S.gift, acceptanceTheir: S.gift, responderPreview: { accepted: true, pwBalance: 0 } }],
      [
        { id: 'a', direction: 'own', actionLabel: 'Traktat handlowy', awaitingAiResponse: true, acceptanceMy: S.treaty, acceptanceTheir: S.treaty, responderPreview: { accepted: true, pwBalance: 213 } },
        { id: 'b', direction: 'own', actionLabel: 'Umowa wymiany', awaitingAiResponse: true, acceptanceMy: S.basketNo, acceptanceTheir: S.basketNo, responderPreview: { accepted: true, pwBalance: -77 } },
      ],
      [
        { id: 'c', direction: 'incoming', actionLabel: 'A', acceptanceMy: S.basketOk, acceptanceTheir: S.basketOk, responderPreview: { accepted: true } },
        { id: 'd', direction: 'incoming', actionLabel: 'B', acceptanceMy: S.treaty, acceptanceTheir: S.treaty, responderPreview: { accepted: true, pwBalance: 5 } },
        { id: 'e', direction: 'own', actionLabel: 'C', acceptanceMy: S.gift, acceptanceTheir: S.gift },
      ],
      [
        { id: 'f', direction: 'own', actionLabel: 'Własna 1', acceptanceMy: S.mixed, acceptanceTheir: S.mixed },
        { id: 'g', direction: 'own', actionLabel: 'Własna 2', acceptanceMy: S.basketOk, acceptanceTheir: S.basketOk },
      ],
    ];
    rowsCases.forEach((rows, i) => {
      const data = P.balancePanelDataFromRows(rows);
      const dto = data == null ? null : { ...data, relation: rel(data.theirBalance.relCurrent ?? data.myBalance?.relCurrent ?? 100) };
      cmpVal(M, `table#${i}`, P.renderPnBalancePanelHtml(data), V.renderPnBalancePanelHtml(dto));
      if (data) {
        cmpVal(M, `isIncomingBasketTradePanel#${i}`, P.isIncomingBasketTradePanel(data), V.isIncomingBasketTradePanel(dto));
        cmpVal(M, `incomingTradeNetBalancePw#${i}`, P.incomingTradeNetBalancePw(data), V.incomingTradeNetBalancePw(dto));
      }
    });
    for (const [name, s] of Object.entries(S)) for (const bil of [undefined, 30]) {
      cmpVal(M, `compact(${name},${bil})`, P.renderAcceptanceCompactHtml(s, 'My', bil), V.renderAcceptanceCompactHtml(s, 'My', AP.sideDisplayOfferPw(s, bil)));
    }
    cmpVal(M, 'compact(undefined)', P.renderAcceptanceCompactHtml(undefined, 'Oni'), V.renderAcceptanceCompactHtml(undefined, 'Oni', 0));
  }

  // 9. techUnlockParse.ts
  {
    const M = 'techUnlockParse.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    for (const t of [...techJson.technologie, { Technologia: 'Nieznana', 'Odblokowuje budynek': null }]) {
      cmpVal(M, `unitsUnlockedByTech(${t.Technologia})`, P.unitsUnlockedByTech(t.Technologia), V.unitsUnlockedByTech(t.Technologia));
      cmpVal(M, `parseUnlockBuildings(${t.Technologia})`, P.parseUnlockBuildings(t['Odblokowuje budynek']), V.parseUnlockBuildings(t['Odblokowuje budynek']));
    }
    cmpVal(M, 'splitList', P.splitList(' a, —, b ,-,', /,/), V.splitList(' a, —, b ,-,', /,/));
  }

  // 10. minimapHud.ts
  {
    const M = 'minimapHud.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const data = {
      cols: 4, rows: 3,
      hexes: [
        { q: 0, r: 0, teren: 'Laka', fog: 'visible', ownerColor: '#ff0000' }, { q: 1, r: 0, teren: 'Morze', fog: 'explored' },
        { q: 2, r: 0, teren: 'Gory', fog: 'hidden' }, { q: 0, r: 1, teren: 'Xyz' },
      ],
      viewport: { x: 0.1, y: 0.1, w: 0.5, h: 0.5 },
      markers: [{ q: 0, r: 0, kind: 'city', color: '#fff' }, { q: 1, r: 0, kind: 'unit', color: '#0f0' }],
    };
    const layersOn = { onToggleTerritory: () => {}, isTerritoryActive: () => true, onToggleTradeRoutes: () => {}, isTradeRoutesActive: () => false };
    const scen = [
      ['null-data', { getMinimapData: () => null }],
      ['data', { getMinimapData: () => data, width: 200, height: 120 }],
      ['data+layers', { getMinimapData: () => data, layers: layersOn, onMinimapClick: () => {} }],
    ];
    // jsdom nie ma kontekstu 2D: podstawiamy REJESTRATOR wywołań (ten sam po obu stronach) i dopisujemy
    // jego log do DOM — porównywana jest pełna sekwencja rysowania (kolory, globalAlpha mgły, ścieżki).
    const logs = new WeakMap();
    const origGetContext = W.HTMLCanvasElement.prototype.getContext;
    W.HTMLCanvasElement.prototype.getContext = function (kind) {
      if (kind !== '2d') return null;
      let log = logs.get(this);
      if (!log) { log = []; logs.set(this, log); }
      const fmt = (x) => (typeof x === 'number' ? String(Math.round(x * 1e6) / 1e6) : JSON.stringify(x));
      return new Proxy({}, {
        get(_t, prop) { return (...a) => { log.push(`${String(prop)}(${a.map(fmt).join(',')})`); }; },
        set(_t, prop, v) { log.push(`${String(prop)}=${fmt(v)}`); return true; },
      });
    };
    const dumpLogs = () => {
      for (const c of document.querySelectorAll('canvas')) {
        const pre = document.createElement('pre');
        pre.setAttribute('data-canvas-log', '');
        pre.textContent = (logs.get(c) ?? []).join('\n');
        document.body.appendChild(pre);
      }
    };
    let drawCalls = 0;
    for (const [label, cfg] of scen) {
      const snap = await domCase(M, `createMinimapHud(${label})`,
        () => { const api = P.createMinimapHud(cfg); document.body.appendChild(api.el); api.update(); dumpLogs(); },
        () => { const api = V.createMinimapHud(cfg); document.body.appendChild(api.el); api.update(); dumpLogs(); });
      drawCalls += (snap.match(/globalAlpha=/g) ?? []).length;
    }
    W.HTMLCanvasElement.prototype.getContext = origGetContext;
    R(M).canvasLogGlobalAlphaSets = drawCalls;
    notMeasured(M, 'piksele canvas: porównano sekwencję wywołań kontekstu 2D (rejestrator), nie rastrowanie (jsdom bez canvas)');
  }

  // 11. perfReport.ts
  {
    const M = 'perfReport.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const RG = pin['map/riverGenSwitch.ts'];
    const stamp = pin['buildInfo.ts'].CIV_BUILD_STAMP;
    const gen = { prep: 1, terrain: 2, landSea: 3, relief: 4, coast: 5, riversMain: 6, riversFill: 7, forest: 8, deposits: 9, starts: 10, total: 55 };
    const scene = { hexes: 11, coast: 12, overlays: 13, rivers: 14, tail: 15, total: 65, hexCount: 4000, overlayTotal: 321, riverStage: 2,
      detail: { heksy: { alokacja: 1, pryzmy: 2, instancjeReliefu: 3, styledWPetli: 4, brzegWPetli: 5, pustynia: 6, finalizacja: 7 }, nakladki: { scalMerge: 8, instancjePlazaWydmy: 9, scalMergeCollapsed: 2 } } };
    const optsList = [
      {},
      { rozmiarLabel: 'Duża', ksztaltLabel: 'Kontynenty', mapGen: gen, scene },
      { rozmiarLabel: 'Mała', typLabel: 'Pangea', mapGen: gen, scene: { ...scene, detail: undefined }, error: 'boom', mapGenHandoffMs: 40, postSceneMs: 300, wallClockMs: 900,
        postSceneSteps: [{ label: 'krok A', ms: 10 }, { label: 'krok B', ms: 20 }] },
      { rozmiarLabel: 'Średnia ąę', wallClockMs: 30 },
    ];
    for (const [en, ph] of [[true, 'all'], [false, 'all'], [true, 'main'], [true, 'main+medium']]) {
      RG.setRiverGenEnabledOverride(en);
      RG.setRiverGenPhaseOverride(ph);
      v2['controller/diagnostics.ts'].installPerfDiagnostics({ buildStamp: stamp, riverGenEnabled: en, riverGenPhase: ph });
      optsList.forEach((o, i) => {
        cmpVal(M, `buildPerfReportText#${i}(${en},${ph})`, P.buildPerfReportText(o), V.buildPerfReportText(o));
        cmpVal(M, `buildPerfReportFilename#${i}`, P.buildPerfReportFilename(o), V.buildPerfReportFilename(o));
      });
    }
    RG.setRiverGenEnabledOverride(null);
    RG.setRiverGenPhaseOverride(null);
    v2['controller/diagnostics.ts'].installPerfDiagnostics({ buildStamp: stamp, riverGenEnabled: RG.getRiverGenEnabled(), riverGenPhase: RG.getRiverGenPhase() });
    cmpVal(M, 'storage keys', [P.PERF_REPORT_STORAGE_KEY, P.PERF_REPORT_FILENAME_KEY], [V.PERF_REPORT_STORAGE_KEY, V.PERF_REPORT_FILENAME_KEY]);
    await domCase(M, 'persistPerfReport → chip', () => { P.persistPerfReport(optsList[1]); }, () => { V.persistPerfReport(optsList[1]); });
    await domCase(M, 'showPerfReportModal(text)', () => { P.showPerfReportModal('Linia 1\nLinia <2>'); }, () => { V.showPerfReportModal('Linia 1\nLinia <2>'); });
    await domCase(M, 'showPerfReportModal(storage) + chip', () => { P.ensurePerfReportChip(); P.showPerfReportModal(); }, () => { V.ensurePerfReportChip(); V.showPerfReportModal(); },
      { seedStorage: () => localStorage.setItem('civ-last-perf-report', 'Zapisany raport') });
    await domCase(M, 'ensurePerfReportChip(pusto)', () => { P.ensurePerfReportChip(); }, () => { V.ensurePerfReportChip(); });
  }

  // 12. improvementBuildConfirm.ts
  {
    const M = 'improvementBuildConfirm.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const TI = pin['game/terrain-improvements.ts'];
    const IB = pin['map/improvement-build.ts'];
    const tiJson = json('terrain-improvements.json');
    const keys = Object.keys(tiJson.ulepszenia ?? tiJson).filter((k) => !k.startsWith('_'));
    const impacts = [
      { removedImprovements: [], removesForest: false },
      { removedImprovements: [], removesForest: true },
      { removedImprovements: keys.slice(0, 2), removesForest: false },
      { removedImprovements: [keys[0] ?? 'farma', 'nieznane_ulepszenie'], removesForest: true },
    ];
    for (const k of [...keys, 'nieznany_klucz', 'a<b&c']) {
      for (const [i, imp] of impacts.entries()) {
        const dto = { newLabel: TI.improvementDisplayName(k), lines: [...imp.removedImprovements.map((x) => TI.improvementDisplayName(x)), ...(imp.removesForest ? ['Las'] : [])] };
        const check = IB.formatImprovementBuildImpactList(imp) === dto.lines.join(', ');
        R(M).dtoJoinMatchesPin = (R(M).dtoJoinMatchesPin ?? true) && check;
        await domCase(M, `modal(${k},#${i})`, () => P.showImprovementBuildConfirmModal(k, imp, () => {}), () => V.showImprovementBuildConfirmModal(k, dto, () => {}));
      }
    }
    R(M).keys = keys.length;
  }

  // 13. mapLoadingOverlay.ts
  {
    const M = 'mapLoadingOverlay.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const optsList = [
      { seed: 123, rozmiarLabel: 'Duża', typLabel: 'Kontynenty' },
      { seed: 1, rozmiarLabel: 'Mała', typLabel: 'Pangea <x>', mapSizeMetric: 'Super Huge (672×476 · ~319 872 heksów)' },
      { seed: 2, rozmiarLabel: 'Mała', typLabel: 'Wyspy', mode: 'load', saveLabel: ' Rzym & Grecja ' },
      { seed: 3, rozmiarLabel: 'Mała', typLabel: 'Wyspy', mode: 'load' },
    ];
    // Każde wywołanie setProgress osobno (stan pośredni byłby nadpisany przez kolejne wywołanie).
    const progressCalls = [null, ['Klimat', 12.4], ['Relief', 42, 4], ['Rzeki', 130, 6, 7], ['Ujemne', -5, 0]];
    for (const [i, o] of optsList.entries()) for (const [j, call] of progressCalls.entries()) for (const withError of [false, true]) {
      const steps = (S) => {
        const h = S.showMapLoadingOverlay(o);
        if (call) h.setProgress(...call);
        if (withError) h.showError('Błąd <generatora>', () => {});
        return h;
      };
      let hp;
      let hv;
      await domCase(M, `overlay#${i}.progress#${j}.err=${withError}`, () => { hp = steps(P); }, () => { hv = steps(V); });
      hp?.hide();
      hv?.hide();
    }
    for (const e of [null, undefined, new Error('x'), new Error(''), 'tekst', 'null', 42]) cmpVal(M, `formatCaughtError(${String(e)})`, P.formatCaughtError(e), V.formatCaughtError(e));
    await domCase(M, 'hide() przywraca canvas', () => {
      const c = document.createElement('canvas'); c.style.pointerEvents = 'auto'; document.body.appendChild(c); P.showMapLoadingOverlay(optsList[0]).hide();
    }, () => {
      const c = document.createElement('canvas'); c.style.pointerEvents = 'auto'; document.body.appendChild(c); V.showMapLoadingOverlay(optsList[0]).hide();
    });
  }

  // 14. saveLoadDialog.ts
  {
    const M = 'saveLoadDialog.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const SV = pin['game/save.ts'];
    const idbOk = await SV.isIdbAvailable();
    R(M).pinIsIdbAvailable = idbOk;
    const metas = [
      { slotId: 'rzym-1', label: 'Rzym', tura: 12, savedAt: '2026-10-20T08:00:00.000Z', mapSize: 'Duża', worldType: 'kontynenty', civId: 'rzymianie', unitsCount: 7, citiesCount: 3, seed: 99, saveOrigin: '' },
      { slotId: 'grecja-2', label: 'Grecja <test>', tura: 4, savedAt: '2026-10-21T08:00:00.000Z', mapSize: 'Mała', worldType: 'wyspy', civId: 'grecy', unitsCount: 2, citiesCount: 1, seed: 0, saveOrigin: 'playtest' },
      { slotId: 'stary', label: 'Stary', tura: 30, savedAt: '', mapSize: '—', worldType: 'xyz', civId: '—', unitsCount: 0, citiesCount: 0, seed: 5, saveOrigin: '' },
    ];
    const seed = (list) => () => {
      for (const m of list) {
        const { slotId, ...meta } = m;
        localStorage.setItem('thegame.save.' + slotId, '{}');
        localStorage.setItem('thegame.savemeta.' + slotId, JSON.stringify(meta));
      }
    };
    const install = (list) => v2['controller/saveSlots.ts'].installSaveSlotsService(
      v2['controller/mockCatalog.ts'].createMockSaveSlotsService({ slots: list, lastPlayed: null, autosaves: [], storageAvailable: idbOk, diskSlotPrefix: 'fsa:' }),
    );
    for (const [name, list] of [['pusto', []], ['3 sloty', metas]]) {
      install(list);
      await domCase(M, `showSaveGameDialog(${name})`,
        () => P.showSaveGameDialog({ defaultLabel: 'Moja gra', turn: 5, onSave: () => {} }),
        () => V.showSaveGameDialog({ defaultLabel: 'Moja gra', turn: 5, onSave: () => {} }), { seedStorage: seed(list) });
      P.hideSaveLoadDialog(); V.hideSaveLoadDialog();
      install(list);
      const snapV2 = await domCase(M, `showLoadGameDialog(${name})`,
        async () => { await P.showLoadGameDialog({ onLoad: () => {} }); await new Promise((r) => setTimeout(r, 0)); },
        async () => { await V.showLoadGameDialog({ onLoad: () => {} }); await new Promise((r) => setTimeout(r, 0)); }, { seedStorage: seed(list) });
      // Kontrola, że porównanie nie jest puste: liczba wierszy listy w DOM = liczba slotów.
      const rowsInDom = (snapV2.match(/class="civ-sl-row-title"/g) ?? []).length;
      (R(M).nonVacuous ??= []).push({ scenario: name, rowsInDom, expected: list.length, ok: rowsInDom === list.length });
      P.hideSaveLoadDialog(); V.hideSaveLoadDialog();
      install(list);
      localStorage.clear(); seed(list)();
      cmpVal(M, `summarizeSaveSlots(${name})`, await P.summarizeSaveSlots(), await V.summarizeSaveSlots());
      cmpVal(M, `continueSaveSlotId(${name})`, await P.continueSaveSlotId(), await V.continueSaveSlotId());
      cmpVal(M, `summarizeFsaSaveSlots(${name})`, await P.summarizeFsaSaveSlots(), await V.summarizeFsaSaveSlots());
    }
    for (const m of metas) cmpVal(M, `saveContextLine(${m.slotId})`, P.saveContextLine({ meta: { newGameParams: { mapSize: m.mapSize, worldType: m.worldType, civId: m.civId }, saveOrigin: m.saveOrigin || undefined }, units: new Array(m.unitsCount), cities: new Array(m.citiesCount), seed: m.seed }), V.saveContextLine(m));
    const a = { slotId: 'a', label: 'a', tura: 3, savedAt: '', context: '' };
    const b = { slotId: 'b', label: 'b', tura: 9, savedAt: '', context: '' };
    const c = { slotId: 'c', label: 'c', tura: 1, savedAt: '2026-01-01', context: '' };
    for (const [x, y] of [[a, b], [b, a], [a, c], [c, a]]) cmpVal(M, `compareSaveSlotsDesc(${x.slotId},${y.slotId})`, P.compareSaveSlotsDesc(x, y), V.compareSaveSlotsDesc(x, y));
    notMeasured(M, 'zapisy z dysku (FSA) i „ostatnio grane”: jsdom nie ma File System Access API, a pin wymaga pełnego zapisu do walidacji lastPlayed — porównano listę pustą/3 sloty lokalne, lastPlayed=null, autosaves=[]');
    notMeasured(M, 'akcje (klik usuń/wczytaj/zapisz → komendy) — nie klikane w harnessie');
  }

  // 15. victoryScreen.ts
  {
    const M = 'victoryScreen.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const statsList = [
      { turn: 120 }, { turn: 77, powerShare: 0.537, eraLabel: 'Żelazo', civLabel: 'Rzymianie' },
      { turn: 5, eraLabel: 'Kamień', civLabel: '  ' }, { turn: 300, powerShare: 0.2, civLabel: 'A<b>&c' },
    ];
    for (const rodzaj of ['dominacja', 'nauka', 'przegrana']) for (const [i, st] of statsList.entries()) {
      cmpVal(M, `title(${rodzaj},${i})`, P.formatVictoryTitle(rodzaj, st.turn), V.formatVictoryTitle(rodzaj, st.turn));
      cmpVal(M, `subtitle(${rodzaj},${i})`, P.formatVictorySubtitle(rodzaj, st), V.formatVictorySubtitle(rodzaj, st));
      cmpVal(M, `condition(${rodzaj})`, P.formatVictoryConditionLabel(rodzaj), V.formatVictoryConditionLabel(rodzaj));
      cmpVal(M, `buildVictoryScreenData(${rodzaj},${i})`, P.buildVictoryScreenData({ winner: 0, rodzaj }, st), V.buildVictoryScreenData({ winner: 0, rodzaj }, st));
      await domCase(M, `showVictoryScreen(${rodzaj},${i})`,
        () => P.showVictoryScreen({ rodzaj, stats: st }, () => {}),
        () => V.showVictoryScreen({ rodzaj, stats: st }, () => {}));
      cmpVal(M, `isOpen(${rodzaj},${i})`, P.isVictoryScreenOpen(), V.isVictoryScreenOpen());
      P.hideVictoryScreen(); V.hideVictoryScreen();
    }
  }

  // ─── raport ────────────────────────────────────────────────────────────────
  const rows = LEVEL0.map((m) => R(m));
  let totalCases = 0;
  let totalDiffs = 0;
  for (const r of rows) {
    totalCases += r.cases;
    totalDiffs += r.diffs + (r.v2AssertionsFailed ?? 0) + (r.dtoJoinMatchesPin === false ? 1 : 0);
    const extra = [];
    if (r.v2Assertions) extra.push(`asercje_v2=${r.v2Assertions.length - r.v2AssertionsFailed}/${r.v2Assertions.length}`);
    if (r.canvasLogGlobalAlphaSets !== undefined) extra.push(`canvas_globalAlpha_w_logu=${r.canvasLogGlobalAlphaSets}`);
    if (r.dtoJoinMatchesPin !== undefined) extra.push(`dto.lines.join==formatImprovementBuildImpactList:${r.dtoJoinMatchesPin}`);
    if (r.nonVacuous) {
      extra.push('wiersze_listy=' + r.nonVacuous.map((n) => `${n.scenario}:${n.rowsInDom}/${n.expected}`).join(','));
      totalDiffs += r.nonVacuous.filter((n) => !n.ok).length;
    }
    console.log(`${r.module.padEnd(32)} przypadki=${String(r.cases).padStart(5)} różnice=${r.diffs}${extra.length ? ' ' + extra.join(' ') : ''}${r.notMeasured.length ? ' NIE_ZMIERZONO=' + r.notMeasured.length : ''}`);
    for (const ex of r.examples) console.log(`   RÓŻNICA ${ex.label} @${ex.at}\n     pin: ${ex.pin}\n     v2 : ${ex.v2}`);
    for (const nm of r.notMeasured) console.log(`   NIE_ZMIERZONO: ${nm}`);
  }
  console.log(`dom-harness: pin=edb8fb56 modułów=${rows.length} przypadków=${totalCases} różnic=${totalDiffs} kolizji_kategorii=${catCollisions.length} jsdomErrors=${jsdomErrors.length}`);
  if (jsdomErrors.length) console.log('jsdomErrors (unikalne): ' + [...new Set(jsdomErrors)].slice(0, 5).join(' | '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: 'edb8fb56', totalCases, totalDiffs, modules: rows }, null, 2) + '\n');
  exitCode = totalDiffs === 0 ? 0 : 1;
} catch (err) {
  console.error('dom-harness: BŁĄD', err?.stack ?? err);
  exitCode = 2;
} finally {
  console.warn = origWarn;
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
