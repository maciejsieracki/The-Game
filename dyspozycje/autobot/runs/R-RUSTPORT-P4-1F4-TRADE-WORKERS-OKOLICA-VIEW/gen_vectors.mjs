// R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW: generator wektorow WYKONUJE kod z pinu (nie transkrypcja).
//
// Zrodla (pin 07d2fbd72, tylko odczyt, poza repo):
//   * gra/src/game/okolica.ts (modul CJS, importy wzgledne resolwowane): collectWorkedHexOwnerMap (:811-834),
//     computeLostToNearerSiblingByCity (:859), resolveWorkedTiles (:380), yieldOfMapHex (:459-477),
//     hexKeysWithinRadius (:66-89), isLandWorkableHex (:124-130), cityRangeForPopulation (:46);
//   * gra/src/main.ts: wycinki CALYCH funkcji po nazwie (od `function NAME(` do domykajacego nawiasu o tym
//     samym wcieciu): refreshTradeRoutesOverlay (:15379-15397), refreshWorkerFieldOverlay (:15432-15448),
//     syncOkolicaOverlay (:6644-6666), okolicaWorkedKeySet (:6625-6635), okolicaHexWorkable (:6617-6623),
//     siblingClaimedHexKeysForCity (:5701-5703), buildAllTerritoryNodes (:5667-5678), isMe (:13748-13750);
//   * gra/src/render/cityOkolicaOverlay.ts: collectRangeKeys (:239-249) — wycinek funkcji, ktora renderer
//     wola dla kazdego heksa zasiegu przed `params.yieldOf(q, r)` (:278-294).
// Wycinki wykonywane w `with(scope)`; identyfikator spoza `scope` rzuca blad (Proxy, brak cichych atrap).
// Atrapy dotycza WYLACZNIE sceny/three.js (rysowanie) — przechwytuja argumenty przekazane do renderera.
//
// Uzycie (WEB_ROOT = `git archive 07d2fbd72 gra/src gra/data | tar -x -C <katalog>`, poza repo; Node 22):
//   node gen_vectors.mjs <WEB_ROOT> > vectors.json

import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [WEB_ROOT] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen_vectors.mjs <WEB_ROOT>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const req = createRequire(import.meta.url);
const ts = req(process.env.TS_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js');

const modCache = new Map();
function resolveSpec(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, `${base}.ts`, path.join(base, 'index.ts')]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  throw new Error(`brak modulu ${spec} (z ${from})`);
}
function loadModule(file) {
  if (modCache.has(file)) return modCache.get(file).exports;
  const out = ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  modCache.set(file, mod);
  const r = spec => {
    if (!spec.startsWith('.')) throw new Error(`nieobslugiwany import '${spec}' w ${file}`);
    if (spec.endsWith('.json')) return JSON.parse(readFileSync(path.resolve(path.dirname(file), spec), 'utf8'));
    return loadModule(resolveSpec(file, spec));
  };
  new Function('require', 'module', 'exports', out)(r, mod, mod.exports);
  return mod.exports;
}
const P = rel => path.join(SRC, rel);
const okolica = loadModule(P('game/okolica.ts'));
const { hexDistance } = loadModule(P('units/setup.ts'));

// --- wycinki funkcji po nazwie -------------------------------------------------------------
function sliceFunction(file, name) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const start = lines.findIndex(l => new RegExp(`^\\s*function ${name}\\(`).test(l));
  if (start < 0) throw new Error(`brak funkcji ${name} w ${file}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start;
  while (!(lines[end].startsWith(`${indent}}`) && end > start)) end++;
  const tsText = lines.slice(start, end + 1).join('\n');
  const js = ts.transpile(tsText, { target: ts.ScriptTarget.ES2020, alwaysStrict: false, noImplicitUseStrict: true })
    .replace(/^\s*"use strict";\s*/, '');
  return { js, from: start + 1, to: end + 1 };
}
function strictScope(vars) {
  return new Proxy(vars, {
    has: () => true,
    get: (t, k) => {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      if (k in globalThis) return globalThis[k];
      throw new Error(`identyfikator spoza scope: ${String(k)}`);
    },
    set: (t, k, v) => { t[k] = v; return true; },
  });
}
const MAIN = P('main.ts');
const OVL = P('render/cityOkolicaOverlay.ts');
const SLICES = {};
function bindAll(vars, list) {
  const scope = strictScope(vars);
  for (const [file, name] of list) {
    const s = sliceFunction(file, name);
    SLICES[name] = `${path.relative(SRC, file)}:${s.from}-${s.to}`;
    // eslint-disable-next-line no-new-func
    vars[name] = new Function('scope', `with (scope) { return (${s.js.trim().replace(/;$/, '')}); }`)(scope);
  }
  return vars;
}

// --- mapa --------------------------------------------------------------------------------
// hex: [q, r, teren, nakladka, rzeka(0/1), ulepszenie|null, ulepszenia[]|null, zloze|null]
function mkMap(rows) {
  const hexes = {};
  for (const [q, r, t, n, rz, u, us, z] of rows) {
    const h = { coords: { q, r }, terenBazowy: t, nakladka: n };
    if (rz) h.rzeka = { obecna: true };
    if (u) h.ulepszenie = u;
    if (us) h.ulepszenia = us;
    if (z) h.zloze = z;
    hexes[`${q},${r}`] = h;
  }
  return { hexes };
}
function grid(q0, q1, r0, r1, special) {
  const rows = [];
  for (let r = r0; r <= r1; r++) {
    for (let q = q0; q <= q1; q++) {
      const s = special[`${q},${r}`];
      rows.push(s ? [q, r, ...s] : [q, r, 'rownina', 'brak', 0, null, null, null]);
    }
  }
  return rows;
}

function mkCity(id, ownerId, q, r, population, extra = {}) {
  return { id, ownerId, q, r, population, ...extra };
}

function runWorld(rows, cities, eraTbl, ui, tradeRoutes) {
  const map = mkMap(rows);
  const captured = { trade: null, workers: null, okolica: null };
  const vars = {
    // stan swiata
    map, cities, tradeRoutes, fortNodes: [],
    // UI
    showTradeRoutesOverlay: ui.showTradeRoutes, showWorkerOverlay: ui.showWorkerOverlay,
    isCityPanelOpen: () => ui.cityPanelOpen, getOpenCityPanelCityId: () => ui.openCityId,
    ME: () => ui.viewer, humanSeats: { activeHumanOwnerId: ui.viewer },
    // funkcje gry (prawdziwe)
    collectWorkedHexOwnerMap: okolica.collectWorkedHexOwnerMap,
    computeLostToNearerSiblingByCity: okolica.computeLostToNearerSiblingByCity,
    resolveWorkedTiles: okolica.resolveWorkedTiles, yieldOfMapHex: okolica.yieldOfMapHex,
    isLandWorkableHex: okolica.isLandWorkableHex, cityRangeForPopulation: okolica.cityRangeForPopulation,
    hexKeysWithinRadius: okolica.hexKeysWithinRadius, hexDistance,
    fortTerritoryNodes: () => { throw new Error('fortNodes puste'); },
    empireEpochForOwner: o => { if (!(o in eraTbl)) throw new Error(`brak epoki ${o}`); return eraTbl[o]; },
    // scena / renderer: atrapy przechwytujace wejscie renderera
    scene: { add() {}, remove() {} },
    clearTradeRoutesOverlay() {}, tradeRoutesOverlayGroup: null,
    buildTradeRoutesOverlayGroup(_m, inputs) { captured.trade = inputs; return {}; },
    clearWorkerFieldOverlay() {}, workerFieldOverlayGroup: null,
    syncWorkerFieldOverlay(_s, _g, _m, byKey, me) { captured.workers = { entries: [...byKey.entries()], me }; return {}; },
    syncWorkerFieldOverlayFog() {}, fogOn: false, revealAllLand: false, ALL_KEYS: new Set(),
    currentVisible: () => new Set(), fogExploredForRender: () => new Set(),
    disposeOkolicaOverlay() {}, okolicaOverlayGroup: null,
    syncCityOkolicaOverlay(_s, _g, m, params) {
      const rangeKeys = [...vars.collectRangeKeys(m, params.cityQ, params.cityR, params.range)];
      captured.okolica = {
        cityQ: params.cityQ, cityR: params.cityR, range: params.range,
        workedKeys: [...params.workedKeys], showYields: params.showYields, ownerId: params.ownerId,
        yields: rangeKeys.map(k => { const [q, r] = k.split(',').map(Number); return [k, params.yieldOf(q, r)]; }),
      };
      return {};
    },
  };
  bindAll(vars, [
    [MAIN, 'refreshTradeRoutesOverlay'], [MAIN, 'refreshWorkerFieldOverlay'], [MAIN, 'syncOkolicaOverlay'],
    [MAIN, 'okolicaWorkedKeySet'], [MAIN, 'okolicaHexWorkable'], [MAIN, 'siblingClaimedHexKeysForCity'],
    [MAIN, 'buildAllTerritoryNodes'], [MAIN, 'isMe'], [OVL, 'collectRangeKeys'],
  ]);
  vars.refreshTradeRoutesOverlay();
  vars.refreshWorkerFieldOverlay();
  vars.syncOkolicaOverlay();
  return captured;
}

// --- scenariusze -------------------------------------------------------------------------
const out = { pin: '07d2fbd72', slices: SLICES, scenarios: [] };

// S1: dwoch wlascicieli w roznych epokach, identyczne otoczenie miast -> rozny wybor pol (ranking z epoka).
{
  const special = {};
  for (const [cq, cr] of [[0, 0], [10, 0]]) {
    special[`${cq + 1},${cr}`] = ['laka', 'brak', 0, null, ['farma'], null];
    special[`${cq - 1},${cr}`] = ['wzgorza', 'las', 1, null, null, null];
    special[`${cq},${cr + 1}`] = ['laka', 'brak', 1, null, null, null];
    special[`${cq},${cr - 1}`] = ['rownina', 'brak', 0, null, ['kopalnia_zlota'], null];
  }
  const rows = grid(-4, 14, -4, 4, special);
  const cities = [mkCity('1', 0, 0, 0, 1), mkCity('2', 1, 10, 0, 1)];
  const ui = { showTradeRoutes: true, showWorkerOverlay: true, cityPanelOpen: false, openCityId: null, viewer: 0 };
  const perOwner = runWorld(rows, cities, { 0: 1, 1: 3 }, ui, []);
  const global1 = runWorld(rows, cities, { 0: 1, 1: 1 }, ui, []);
  const global3 = runWorld(rows, cities, { 0: 3, 1: 3 }, ui, []);
  out.scenarios.push({ name: 'S1_era_per_owner', rows, cities, era: { 0: 1, 1: 3 }, ui, tradeRoutes: [],
    expected: perOwner, control_global_era1: global1.workers, control_global_era3: global3.workers });
}

// S2: spor sasiadow tego samego wlasciciela (dwa miasta 0 w odleglosci 2) + okolica otwartego miasta.
{
  const special = {
    '1,0': ['laka', 'brak', 1, null, ['farma'], null],
    '1,-1': ['laka', 'brak', 0, null, null, null],
    '2,-1': ['wzgorza', 'brak', 0, null, null, null],
    '0,1': ['morze', 'brak', 0, null, null, null],
    '-1,0': ['gory', 'brak', 0, null, null, null],
  };
  const rows = grid(-4, 6, -4, 4, special);
  const cities = [mkCity('5', 0, 0, 0, 3), mkCity('6', 0, 2, 0, 3), mkCity('7', 2, -3, 3, 2)];
  const era = { 0: 2, 2: 1 };
  const uiW = { showTradeRoutes: true, showWorkerOverlay: true, cityPanelOpen: false, openCityId: null, viewer: 0 };
  const uiO = { showTradeRoutes: true, showWorkerOverlay: true, cityPanelOpen: true, openCityId: '6', viewer: 0 };
  const lost = okolica.computeLostToNearerSiblingByCity(cities, mkMap(rows));
  out.scenarios.push({ name: 'S2_sibling_workers', rows, cities, era, ui: uiW, tradeRoutes: [],
    expected: runWorld(rows, cities, era, uiW, []),
    lost: [...lost.entries()].map(([k, v]) => [k, [...v]]) });
  out.scenarios.push({ name: 'S2_sibling_okolica', rows, cities, era, ui: uiO, tradeRoutes: [],
    expected: runWorld(rows, cities, era, uiO, []) });
  const uiOther = { ...uiO, openCityId: '7' };
  out.scenarios.push({ name: 'S2_okolica_foreign_city', rows, cities, era, ui: uiOther, tradeRoutes: [],
    expected: runWorld(rows, cities, era, uiOther, []) });
}

// S3: filtr tras.
{
  const rows = grid(-2, 8, -2, 4, {});
  const cities = [
    mkCity('10', 0, 0, 0, 1), mkCity('11', 1, 4, 0, 1), mkCity('12', 2, 0, 3, 1),
    mkCity('13', 3, 6, 2, 1), mkCity('11', 1, 5, 1, 1), // zdublowane id: Map -> ostatni wpis
  ];
  const tr = (id, from, to, ownerId, toOwnerId, medium, status) => ({ id, fromCityId: from, toCityId: to, ownerId, toOwnerId, medium, dystans: 3, status, budynekOdblokowany: false });
  const routes = [
    tr('a', '10', '11', 0, 1, 'lad', 'polaczony'),
    tr('b', '11', '12', 1, 2, 'lad', 'polaczony'),          // AI<->AI
    tr('c', '10', '12', 0, 2, 'morze', 'brak_polaczenia'),  // brak polaczenia
    tr('d', '10', '99', 0, 1, 'lad', 'polaczony'),          // brak miasta docelowego
    tr('e', '12', '10', 2, 0, 'morze', 'polaczony'),        // AI -> gracz 0
    tr('f', '13', '12', 3, 2, 'morze', 'polaczony'),        // AI<->AI
    tr('g', '98', '10', 1, 0, 'lad', 'polaczony'),          // brak miasta zrodlowego
  ];
  const ui = { showTradeRoutes: true, showWorkerOverlay: false, cityPanelOpen: false, openCityId: null, viewer: 0 };
  const era = { 0: 1, 1: 1, 2: 1, 3: 1 };
  out.scenarios.push({ name: 'S3_trade_filter', rows, cities, era, ui, tradeRoutes: routes,
    expected: runWorld(rows, cities, era, ui, routes) });
  const uiHot = { ...ui, viewer: 1 };
  out.scenarios.push({ name: 'S3_trade_hotseat_literal0', rows, cities, era, ui: uiHot, tradeRoutes: routes,
    expected: runWorld(rows, cities, era, uiHot, routes) });
  const uiPanel = { ...ui, cityPanelOpen: true, openCityId: '10' };
  out.scenarios.push({ name: 'S3_trade_panel_open', rows, cities, era, ui: uiPanel, tradeRoutes: routes,
    expected: runWorld(rows, cities, era, uiPanel, routes) });
}

// S4: kolejnosc Map i nadpisanie klucza — bez wezlow terytorium, miasta roznych wlascicieli zachodza.
{
  const rows = grid(-4, 6, -3, 3, { '3,0': ['laka', 'brak', 1, null, ['farma'], null] });
  const cities = [mkCity('20', 1, 4, 0, 3), mkCity('21', 0, 1, 0, 3), mkCity('22', 1, 2, 1, 1)];
  const map = mkMap(rows);
  const era = { 0: 1, 1: 3 };
  const byKey = okolica.collectWorkedHexOwnerMap(cities, map, {
    isWorkable: (q, r) => okolica.isLandWorkableHex(map, q, r),
    eraForOwner: o => era[o],
  });
  const perCity = cities.map(c => okolica.resolveWorkedTiles(c, map,
    (q, r) => okolica.yieldOfMapHex(map, q, r, era[c.ownerId]),
    { isWorkable: (q, r) => okolica.isLandWorkableHex(map, q, r), ownerId: c.ownerId,
      excludeHexKeys: okolica.computeLostToNearerSiblingByCity(cities, map).get(c.id) }).map(t => t.key));
  out.scenarios.push({ name: 'S4_map_order_no_territory', rows, cities, era, direct: [...byKey.entries()], perCity });
}

process.stdout.write(JSON.stringify(out, null, 1));
