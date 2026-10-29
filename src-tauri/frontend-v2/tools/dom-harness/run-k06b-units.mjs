#!/usr/bin/env node
/**
 * run-k06b-units.mjs — harness DOM: jednostki K06B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, runda 1).
 *
 * Porównuje, dla tych samych argumentów i tego samego fixture'u zależności, wynik i DOM (innerHTML punktu montażu)
 * oraz dziennik wywołań delegatów: pin `gra/src/ui/cityPanel.ts` (ciała jednostek 1:1 z pinu) kontra port
 * `src/ui/cityPanel/k06b-*.ts`. Zależności po obu stronach to ten sam fixture (zamienniki `dep()` / stan pinu).
 *
 * Wyjątki zamierzone (P5-8 §6, K06B-Z7) — NIE są różnicami:
 *   - `renderWorkedPreview` (MAPA) — port = placeholder; sprawdzany osobno (brak zmian DOM i brak wywołań).
 *   - wpisy `mountUnitMiniPreview` (3D) — pomijane w dzienniku pinu.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k06b-units.mjs --pin-dir <PIN_DIR> [--v2-dir <katalog src/ui/cityPanel>]
 *   <PIN_DIR> = katalog poza repo z `git archive edb8fb56 gra/src gra/data`.
 * EXIT 0 <=> 0 różnic; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { JSDOM } from 'jsdom';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k06b-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2-dir <dir>]');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_DIR = resolve(argOf('--v2-dir') ?? join(V2_ROOT, 'src/ui/cityPanel'));
const PIN_FILE = join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts');
const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');
const PIN_UI_PARAMS = JSON.parse(readFileSync(join(resolve(PIN_DIR), 'gra/data/ui-params.json'), 'utf8'));

/** Jednostki K06B (21 DOM wg select-k06a; rootEl = stan, bez ciała). Zakresy: pomiar-r2 / odroczone.json. */
const DOM_UNITS = [
  'appendPodzialPracyInfo', 'buildOwnedBuildingsDetailCard', 'buildUnitDetailCardViaEntityCard', 'buildUnitDetailCard',
  'attachUnitRowThumb', 'appendBuildableItemRow', 'appendUnitRecruitCompactRow', 'appendRecruitmentQueue',
  'appendBuildQueueSection', 'appendCatalogBuildingRow', 'renderBuildList', 'appendOwnedBuildingRow',
  'renderTopBarGarrison', 'buildGarnizonDetailCard', 'buildOkolicaDetailCard', 'appendOkolicaYieldLabel',
  'renderWorkedPreview', 'setGarrisonLabelPinned', 'pinGarrisonPanel', 'clearGarrisonPanel',
];
/** Zakresy linii pinu z pomiaru (odroczone.json, reason DOM). */
const RANGES = JSON.parse(readFileSync(new URL('./k06b-ranges.json', import.meta.url), 'utf8'));

/** Nazwy zależności po stronie pinu (funkcje i wartości) — ten sam zbiór co delegaty portu. */
const FN_NAMES = JSON.parse(readFileSync(new URL('../../src/ui/cityPanel/k06b-deps.ts', import.meta.url), 'utf8').match(/K06B_FN_NAMES = (\[[^\]]*\])/)[1]);
const VALUE_NAMES = JSON.parse(readFileSync(new URL('../../src/ui/cityPanel/k06b-deps.ts', import.meta.url), 'utf8').match(/K06B_VALUE_NAMES = (\[[^\]]*\])/)[1]);
const PIN_ONLY_FNS = ['mountUnitMiniPreview'];
const K06A_PIN_FNS = ['okolicaHexPoints', 'okolicaTileHasWorkerAt', 'fireOkolicaTileToggle', 'formatTileYieldShort', 'tileYieldLabel'];

/** Tekst jednostki pinu po zakresie (A-B) z pomiaru. */
const pinText = (name) => {
  const r = RANGES[name];
  if (!r) throw new Error('brak zakresu: ' + name);
  return pinLines.slice(r.a - 1, r.b).join('\n').replace(/^(export )?(async )?(function|const|let) /m, (_m, _e, as, kw) => `export ${as ?? ''}${kw} `);
};
/** Zakres K06A (do porównania delegatów K06A po obu stronach; wzorzec run-k06a). */
const pinTop = (name) => {
  const re = new RegExp(`^(export )?(function|const) ${name}\\b`);
  const i = pinLines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak ${name}`);
  let j = i;
  if (/^(export )?const /.test(pinLines[i]) && !pinLines[i].trimEnd().endsWith(';')) while (!/^\S.*;\s*$/.test(pinLines[j]) || j === i) j++;
  else if (!/^(export )?const /.test(pinLines[i])) while (pinLines[j] !== '}') j++;
  return pinLines.slice(i, j + 1).join('\n').replace(/^(export )?(function|const) /m, (_m, _e, kw) => `export ${kw} `);
};

// ─── Fixture wspólny (pin i port) ────────────────────────────────────────────────────────────────────────────────────

/** Dziennik + stuby. `specific` zwraca konkretne wartości; reszta to uniwersalne proxy (wywoływalne, bez końca). */
function makeFixture(variant) {
  const log = [];
  const state = { pinned: variant.pinned ?? null, activeMap: variant.activeMap ?? null, showEra: variant.showEra ?? false };
  const canon = (x, d = 0) => {
    if (typeof x === 'function') return '<fn>';
    if (x && typeof x === 'object' && x[IS_U]) return `<U:${x[IS_U]}>`;
    if (x && typeof x === 'object' && x.nodeType === 1) return `<el:${x.outerHTML}>`;
    if (typeof x === 'number' && !Number.isFinite(x)) return `#${String(x)}`;
    if (x instanceof Set) return { set: [...x] };
    if (x instanceof Map) return { map: [...x.entries()] };
    if (d > 3) return '<deep>';
    if (Array.isArray(x)) return x.map((v) => canon(v, d + 1));
    if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, canon(x[k], d + 1)]));
    return x;
  };
  const IS_U = Symbol('universal');
  const U = (name) => {
    const f = function () { return U(name + '()'); };
    return new Proxy(f, {
      get(t, k) {
        if (k === IS_U) return name;
        if (k === Symbol.iterator) return function* () {};
        if (k === Symbol.toPrimitive) return () => `<${name}>`;
        if (k === 'then') return undefined;
        if (k === 'nodeType') return undefined;
        return U(name + '.' + String(k));
      },
      set() { return true; },
      apply() { return U(name + '()'); },
    });
  };
  const el = (tag, cls, text) => {
    const e = globalThis.document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const specific = {
    el,
    defaultOwnerColor: () => '#123456',
    getProd: () => ({ kolejka: [], rekrutacja: [] }),
    gameData: () => ({ jednostki: {}, budynki: {} }),
    tileYield: () => ({ zywnosc: 1, praca: 2, handel: 0 }),
    cityPanelChipIconWrap: (n) => `<chip ${n}>`,
    cpInlineIcons: () => '<ic>',
    setShowEraBuildingPreview: (on) => { state.showEra = on; log.push(['setShowEraBuildingPreview', [on]]); },
    // Odczyt stanu `showEraBuildingPreview` (pin: zmienna modułu, bez wywołania) — nie wpisuje się do dziennika.
    getShowEraBuildingPreview: () => state.showEra,
    rangeName: (R) => `R${R}`,
    tury: (n) => `tur${n}`,
    constStr: undefined,
  };
  const fns = {};
  for (const n of [...FN_NAMES, ...PIN_ONLY_FNS, 'formatCityMapLabel', 'axialToWorld', 'cityTabs', 'activeDrawerTab', 'cityTabIconHtml', 'switchCity', 'improvementKeysForHex']) {
    if (n in fns) continue;
    fns[n] = (...a) => {
      if (n !== 'getShowEraBuildingPreview') log.push([n, a.map((x) => canon(x))]);
      if (n in specific && specific[n] !== undefined) return specific[n](...a);
      if (n === 'formatCityMapLabel') return 'lbl';
      if (n === 'axialToWorld') return { x: 0, z: 0 };
      if (n === 'cityTabs') return [{ id: 'plony', short: 'P' }];
      if (n === 'activeDrawerTab') return 'plony';
      if (n === 'improvementKeysForHex') return [];
      return U(n);
    };
  }
  const cfgMethods = {
    getUnitsAt: (q, r) => { log.push(['cfg.getUnitsAt', [q, r]]); return variant.units ?? []; },
    getBuiltBuildingIds: (id) => { log.push(['cfg.getBuiltBuildingIds', [id]]); return ['farma']; },
    getOwnerColor: (o) => { log.push(['cfg.getOwnerColor', [o]]); return '#abcdef'; },
    getOrderState: (id) => { log.push(['cfg.getOrderState', [id]]); return { szPct: 10, porPct: 50 }; },
    getCities: () => variant.cities ?? [],
    onOkolicaTileAdjust: (...a) => { log.push(['cfg.onOkolicaTileAdjust', a.map((x) => canon(x))]); },
  };
  const values = {
    cfg: cfgMethods,
    TEREN_COL: { Morze: '#0d2236', Laka: '#243a24' },
    TEREN_LETTER: { Morze: '~', Laka: 'L' },
    IMPROVEMENT_KEY_TO_NAME: { mina: 'Kopalnia' },
    EPOCH_NUMBER_TO_NAME: { 1: 'Starożytność' },
    Nakladka: { Brak: 'brak', Las: 'las' },
    UI_PARAMS: PIN_UI_PARAMS,
  };
  const consts = {
    PODZIAL_PRACY_PULA_TIP: 'Pula Pracy imperium — test',
    PODZIAL_PRACY_PULA_LBL_PELNA: 'Ulepszenia (pula imperium)',
  };
  return { log, state, canon, fns, values, consts, U, IS_U, el };
}

/** Warianty argumentów: [nazwa, funkcja budująca argumenty z fixture'u] + opcjonalna konfiguracja stanu. */
function buildCases(F) {
  const city = { id: 'c1', ownerId: 1, q: 0, r: 0, name: 'Alfa', population: 3, produkcja: {}, budowa: [] };
  const city2 = { id: 'c2', ownerId: 1, q: 2, r: -1, name: 'Beta', population: 5 };
  const view = { id: 'c1', zywnosc: 3, praca: 2, handel: 1, kolejka: [], ludnosc: 3, tury: 2 };
  const units = [{ id: 'piechota', udef: { nazwa: 'Piechota', typ: 'lad' }, q: 0, r: 0 }];
  const mk = () => F.el('div', 'mount');
  const svg = () => globalThis.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const label = () => F.el('button', 'civ-v-garrison-label');
  const cases = [];
  const add = (name, make, variant = {}) => cases.push({ name, make, variant });
  add('renderTopBarGarrison', (m) => [m.mount, city], {});
  add('renderTopBarGarrison', (m) => [m.mount, city], { pinned: 'c1', units });
  add('renderTopBarGarrison', (m) => [m.mount, city2], { units });
  add('buildGarnizonDetailCard', () => [units, 1, 0, 0], { units });
  add('buildGarnizonDetailCard', () => [null, 0], {});
  add('buildOkolicaDetailCard', () => [city, { Rwork: 2, tryb: 'auto', reczne: {}, worked: [], map: {}, illegalReczneKeys: new Set() }], {});
  add('buildOkolicaDetailCard', () => [city2, { Rwork: 1, tryb: 'reczny', reczne: { '1,0': 2 }, worked: [{ q: 1, r: 0 }], map: {} }], {});
  add('appendOkolicaYieldLabel', () => [svg(), { cx: 1, cy: 2, hex: { terenBazowy: 'Laka' }, isCity: false }, 10], {});
  add('setGarrisonLabelPinned', () => [label(), true], {});
  add('setGarrisonLabelPinned', () => [label(), false], {});
  add('pinGarrisonPanel', () => ['c1', label()], {});
  add('clearGarrisonPanel', () => [], { pinned: 'c1' });
  add('appendPodzialPracyInfo', (m) => [m.mount, city, view], { activeMap: { hexes: {} } });
  add('appendPodzialPracyInfo', (m) => [m.mount, city, null], {});
  add('buildOwnedBuildingsDetailCard', () => [city, { ustawienia: {} }], {});
  add('buildUnitDetailCardViaEntityCard', () => [units[0].udef, { jednostki: {} }], {});
  add('buildUnitDetailCard', () => [units[0].udef, { jednostki: {} }], {});
  add('attachUnitRowThumb', (m) => [m.mount, units[0].udef, 'piechota', { jednostki: {} }, 1], {});
  add('attachUnitRowThumb', (m) => [m.mount, undefined, 'x', null, 2], {});
  add('appendBuildableItemRow', (m) => [m.mount, city, { typ: 'budynek', id: 'farma' }], {});
  add('appendUnitRecruitCompactRow', (m) => [m.mount, city, { typ: 'jednostka', id: 'piechota', ilosc: 1 }], {});
  add('appendRecruitmentQueue', (m) => [m.mount, city, true], {});
  add('appendBuildQueueSection', (m) => [m.mount, city, false], {});
  add('appendCatalogBuildingRow', (m) => [m.mount, { id: 'farma', nazwa: 'Farma' }, undefined], {});
  add('renderBuildList', (m) => [m.mount, city, { budynki: {} }], { showEra: true });
  add('renderBuildList', (m) => [m.mount, city, null], { showEra: false });
  add('appendOwnedBuildingRow', (m) => [m.mount, 'farma', { budynki: {} }], {});
  return cases;
}

// ─── Pin: bundle z preludium stubów + ciała jednostek (surowe) ───────────────────────────────────────────────────────

const PIN_FN_DECLS = [...new Set([...FN_NAMES, ...PIN_ONLY_FNS, 'formatCityMapLabel', 'axialToWorld', 'cityTabs', 'activeDrawerTab', 'cityTabIconHtml', 'switchCity', 'improvementKeysForHex'])]
  .filter((n) => !['getShowEraBuildingPreview', 'setShowEraBuildingPreview', 'constStr', 'cfg', 'TEREN_COL', 'TEREN_LETTER', 'IMPROVEMENT_KEY_TO_NAME', 'EPOCH_NUMBER_TO_NAME', 'Nakladka', 'TerenBazowy', 'UI_PARAMS'].includes(n))
  .map((n) => `const ${n} = (...a) => globalThis.__K06B_FIX.fns[${JSON.stringify(n)}](...a);`)
  .join('\n');
const pinPrelude = `
const __F = globalThis.__K06B_FIX;
let pinnedGarrisonCityId = __F.state.pinned;
let activeMap = __F.state.activeMap;
let activeOnClose = () => {};
let showEraBuildingPreview = __F.state.showEra;
const __syncState = () => { __F.state.pinned = pinnedGarrisonCityId; __F.state.showEra = showEraBuildingPreview; };
const __dyn = (n) => new Proxy({}, { get: (_t, k) => globalThis.__K06B_FIX.values[n][k] });
const cfg = __dyn("cfg");
const TEREN_COL = __dyn("TEREN_COL");
const TEREN_LETTER = __dyn("TEREN_LETTER");
const IMPROVEMENT_KEY_TO_NAME = __dyn("IMPROVEMENT_KEY_TO_NAME");
const EPOCH_NUMBER_TO_NAME = __dyn("EPOCH_NUMBER_TO_NAME");
const Nakladka = __dyn("Nakladka");
const UI_PARAMS = __dyn("UI_PARAMS");
const TerenBazowy = { Morze: 'Morze', Laka: 'Laka' };
const PULA_LBL = 'Ulepszenia (pula)';
const PULA_TIP = __F.consts.PODZIAL_PRACY_PULA_TIP;
const PULA_LBL_PELNA = __F.consts.PODZIAL_PRACY_PULA_LBL_PELNA;
const LIST_ROW_HEIGHT_COMPACT = 2.35;
const RECRUIT_QUEUE_VISIBLE = 5;
const BUILD_QUEUE_VISIBLE = 4;
const QUEUE_ROW_EM = 2.75;
const HEX_R = 1.0;
const CITY_TABS = [{ id: 'plony', short: 'P' }];
${PIN_FN_DECLS}
const getShowEraBuildingPreview = () => showEraBuildingPreview;
function setShowEraBuildingPreview(on) { showEraBuildingPreview = on; }
export const __state = () => ({ pinned: pinnedGarrisonCityId, activeMap, showEra: showEraBuildingPreview });
export const __setPinned = (v) => { pinnedGarrisonCityId = v; };
export const __setActive = (m) => { activeMap = m; };
export const __setShowEra = (v) => { showEraBuildingPreview = v; };
`;

// ─── Port: wiring delegatów ──────────────────────────────────────────────────────────────────────────────────────────

function wirePort(V, F) {
  const deps = {};
  for (const n of FN_NAMES) deps[n] = F.fns[n];
  for (const n of Object.keys(F.consts)) deps[n] = F.consts[n];
  for (const n of VALUE_NAMES) deps[n] = F.values[n];
  // K06A: delegaty dla reguł (K06aDeps) i cfg
  V.setK06aCfg(F.values.cfg);
  V.setK06aDeps({
    cityPanelChipIconWrap: (n, px) => F.fns.cityPanelChipIconWrap(n, px),
    tileYield: (t) => F.fns.tileYield(t),
    formatCityMapLabel: (c) => F.fns.formatCityMapLabel(c),
    axialToWorld: (q, r, R) => F.fns.axialToWorld(q, r, R),
    cityTabs: () => F.fns.cityTabs(),
    activeDrawerTab: () => F.fns.activeDrawerTab(),
    cityTabIconHtml: (id) => F.fns.cityTabIconHtml(id),
    switchCity: (dir) => F.fns.switchCity(dir),
  });
  V.setK06bDeps(deps);
}

// ─── Uruchomienie ────────────────────────────────────────────────────────────────────────────────────────────────────

const tmp = mkdtempSync(join(tmpdir(), 'p58k06b-harness-'));
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
let exitCode = 0;
let comparisons = 0;
let diffs = 0;
const report = [];

try {
  const pinBody = DOM_UNITS.filter((n) => n !== 'renderWorkedPreview').map((n) => pinText(n)).join('\n\n');
  const pinK06a = K06A_PIN_FNS.map((n) => pinTop(n)).join('\n\n');
  const pinSrc = [
    `export const __K06B_UNUSED = 0;`,
    pinPrelude,
    pinK06a,
    pinBody,
    '',
  ].join('\n');
  const pinProbe = join(tmp, 'pin.ts');
  writeFileSync(pinProbe, pinSrc);
  const pinBundle = join(tmp, 'pin.mjs');
  await esbuild.build({ entryPoints: [pinProbe], outfile: pinBundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });

  // Preinstalacja katalogu statycznego (łańcuch importów k05a/k04 woła staticCatalog() przy ewaluacji).
  const v2Pre = join(tmp, 'v2-pre.ts');
  writeFileSync(
    v2Pre,
    `import { installStaticCatalog } from ${JSON.stringify(join(V2_DIR, '../../controller/staticCatalog.ts'))};\ninstallStaticCatalog({} as any);\n`,
  );
  const v2Entry = join(tmp, 'v2-entry.ts');
  writeFileSync(
    v2Entry,
    [
      `import ${JSON.stringify(v2Pre)};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k06b-garnizon.ts'))};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k06b-jednostki.ts'))};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k06b-kolejki.ts'))};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k06a-fundament.ts'))};`,
      `export * from ${JSON.stringify(join(V2_DIR, 'k06b-deps.ts'))};`,
      '',
    ].join('\n'),
  );
  const v2Bundle = join(tmp, 'v2.mjs');
  await esbuild.build({ entryPoints: [v2Entry], outfile: v2Bundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });

  globalThis.__K06B_FIX = makeFixture({});
  const P = await import(pathToFileURL(pinBundle).href);
  const V = await import(pathToFileURL(v2Bundle).href);

  const cases = buildCases({ el: (t, c, x) => globalThis.document.createElement(t) });
  for (let idx = 0; idx < cases.length; idx++) {
    const { name, make, variant } = cases[idx];
    const results = {};
    for (const side of ['pin', 'v2']) {
      const F = makeFixture(variant);
      globalThis.__K06B_FIX = F;
      const mod = side === 'pin' ? P : V;
      if (side === 'v2') wirePort(V, F);
      if (side === 'pin') {
        mod.__setPinned(F.state.pinned);
        mod.__setActive(F.state.activeMap);
        mod.__setShowEra(F.state.showEra);
        // Stan K06A dla strony portu (akcesory) — ta sama wartość startowa.
      } else {
        V.setK06aPinnedGarrisonCityId(F.state.pinned);
        V.setK06aActive(null, F.state.activeMap, () => {});
      }
      const mount = globalThis.document.createElement('div');
      const m = { mount };
      let ret;
      let err = null;
      const argv = make(m);
      try {
        ret = mod[name](...argv);
      } catch (e) {
        err = String(e && e.message ? e.message : e);
      }
      const log = F.log.filter(([n]) => !(side === 'pin' && PIN_ONLY_FNS.includes(n)));
      results[side] = {
        ret: F.canon(ret),
        err,
        html: mount.innerHTML,
        // stan właściwości `checked` (nie widać w innerHTML)
        checks: [...mount.querySelectorAll('input')].map((i) => i.checked),
        // elementy przekazane jako argumenty (np. etykieta przypinania) — ich stan po wywołaniu
        argsHtml: argv.filter((x) => x && x.nodeType === 1).map((x) => x.outerHTML),
        log: log.map((e) => [e[0], e[1]]),
        state: side === 'pin' ? mod.__state() : { pinned: V.getK06aState().pinnedGarrisonCityId, activeMap: V.getK06aState().activeMap, showEra: F.state.showEra },
      };
      if (side === 'pin') {
        // stan pinu po wywołaniu (pinned/activeMap/showEra)
      }
    }
    comparisons++;
    const a = JSON.stringify(results.pin);
    const b = JSON.stringify(results.v2);
    if (a !== b) {
      diffs++;
      report.push({ idx, unit: name, pin: results.pin, v2: results.v2 });
    }
  }

  // Placeholder MAPA (K06B-Z7): port nie zmienia DOM i nie wywołuje delegatów.
  {
    const F = makeFixture({});
    globalThis.__K06B_FIX = F;
    wirePort(V, F);
    const mount = globalThis.document.createElement('div');
    comparisons++;
    V.renderWorkedPreview(mount, { id: 'c1', q: 0, r: 0 }, { hexes: {} }, [{ q: 0, r: 0 }], {}, 'auto', new Set());
    if (mount.innerHTML !== '' || F.log.length !== 0) {
      diffs++;
      report.push({ unit: 'renderWorkedPreview(placeholder)', html: mount.innerHTML, log: F.log.length });
    }
  }

  console.log(JSON.stringify({ comparisons, diffs, units: DOM_UNITS.length, pinFile: 'gra/src/ui/cityPanel.ts (edb8fb56)', portDir: 'src/ui/cityPanel' }, null, 1));
  if (report.length) {
    // Podsumowanie różnic: pole, błędy po obu stronach, pierwsza rozbieżna pozycja dziennika.
    for (const r of report) {
      if (r.pin === undefined) { console.log(`DIFF ${r.unit}: ${JSON.stringify(r).slice(0, 300)}`); continue; }
      const fields = ['ret', 'err', 'html', 'checks', 'argsHtml', 'log', 'state'].filter((f) => JSON.stringify(r.pin[f]) !== JSON.stringify(r.v2[f]));
      const pl = r.pin.log;
      const vl = r.v2.log;
      let at = 0;
      while (at < Math.max(pl.length, vl.length) && JSON.stringify(pl[at]) === JSON.stringify(vl[at])) at++;
      console.log(`DIFF #${r.idx} ${r.unit}: pola=${fields.join(',')} errPin=${r.pin.err} errV2=${r.v2.err}`);
      console.log(`  log@${at} pin=${JSON.stringify(pl[at] ?? null).slice(0, 220)}`);
      console.log(`  log@${at} v2 =${JSON.stringify(vl[at] ?? null).slice(0, 220)}`);
      if (fields.includes('html')) console.log(`  html pin=${r.pin.html.slice(0, 160)}\n  html v2 =${r.v2.html.slice(0, 160)}`);
    }
  }
  exitCode = diffs === 0 ? 0 : 1;
} catch (err) {
  console.error('BLAD HARNESSU:', err && err.stack ? err.stack : err);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
