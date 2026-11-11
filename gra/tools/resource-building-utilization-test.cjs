'use strict';
/**
 * resource-building-utilization-test.cjs -- R-WEB-UI-RESOURCE-BUILDING-UTILIZATION-PERCENT-Q1 (2026-11-11).
 *
 * Run from gra/: node tools/resource-building-utilization-test.cjs
 *
 * A. TABELA (forecastNextTurnProduction -> utilizationByCity): pelny zapas -> 100%, polowa -> 50%, brak -> 0% + powod,
 *    wylaczony -> brak wpisu (panel: "wyłączony"), budynek bez przerobu (stolarnia/kamieniarski) -> 100% neutralnie.
 * B. SPOJNOSC z realna tura: dla scenariuszy z brakiem wejscia wyswietlany % == faktyczna realizacja po advanceCityEconomy (+-0 pkt).
 * C. migawka panelu (buildEmpireProducersSnap): widoki, agregat per typ, "asleep".
 * D. UI (esbuild+jsdom): procent przy KAZDYM wierszu, chipy ikona+liczba dla powodu, agregat, "wyłączony", "bez przerobu".
 * E. MUTACJA: zahardkodowanie 100% czerwieni asercje.
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const { JSDOM } = require(path.resolve(GRA, 'node_modules', 'jsdom'));

let passed = 0;
let failed = 0;
function ok(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const ENTRY = path.join(__dirname, '.rbu-entry.ts');
const BUNDLE = path.join(__dirname, '.rbu-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { advanceCityEconomy, forecastNextTurnProduction } from '../src/game/turn-economy';
export { buildEmpireProducersSnap, setProductionBuildingEnabled } from '../src/game/building-toggle';
export { converterProductionDisplayForBuilding } from '../src/game/converters';
export { summarizeBuildingUtilization } from '../src/game/converters';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
});
const M = require(BUNDLE);

const econParams = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');
const DATA = { civs, econParams, societyParams, buildings, units, tech };
const MAP = { hexes: { '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'laka', nakladka: 'brak', rzeka: null, ulepszenia: [] } } };
const buildingLabel = id => (buildings.find(b => b.id === id) || { nazwa: id }).nazwa;

function mkCity(id, ownerId, q, extra = {}) {
  return { id, ownerId, q, r: q, name: id, population: 3, magazynZywnosci: 50, surowce: {}, ...extra };
}
function forecast(cities, built, era = 1) {
  return M.forecastNextTurnProduction({
    cities, map: MAP, data: DATA, difficulty: 'normal', builtByCity: new Map(Object.entries(built)), playerEra: era,
    playerZbadane: new Set(), resolveOwnerEra: () => era,
  });
}
function realTick(cities, built, era = 1) {
  return M.advanceCityEconomy(
    cities, MAP, DATA, 'normal', [], new Map(), new Map(Object.entries(built)), era, new Set(), new Map(), new Map(),
    () => era, undefined,
  );
}

// ---------------------------------------------------------------------------
console.log('-- A. tabela: pelny / polowa / brak / wylaczony / bez przerobu --');
const GARN_MAX = 50; // Garncarnia, epoka 1 (cykle/ture z econ-params)
// Miasto ma wlasny dopyw gliny z terytorium (przed konwerterami) -- mierzymy go realna tura przy pustym magazynie,
// zeby liczby tabeli byly dokladne (zapas koncowy = zapas + dopyw).
const GIN = (realTick([mkCity('p', 0, 0, { surowce: { glina: 0, drewno: 500 } })], { p: ['garncarnia'] })
  .converterProducedByOwner.get(0) || {}).ceramika || 0;
console.log(`   zmierzony dopyw gliny z terytorium miasta: ${GIN}/ture`);
const TABLE = [
  { name: 'pelny zapas', stock: { glina: 500, drewno: 500 }, pct: 100, cykle: GARN_MAX, lim: undefined },
  { name: 'polowa zapasu glina', stock: { glina: 25 - GIN, drewno: 500 }, pct: 50, cykle: 25, lim: 'wejscie', missing: { glina: 25 } },
  { name: 'brak gliny', stock: { glina: 0, drewno: 500 }, pct: Math.round(100 * GIN / GARN_MAX), cykle: GIN, lim: 'wejscie', missing: { glina: 50 - GIN } },
  { name: 'brak drewna', stock: { glina: 500, drewno: 0 }, pct: 0, cykle: 0, lim: 'wejscie', missing: { drewno: 50 } },
];
for (const t of TABLE) {
  const f = forecast([mkCity('c1', 0, 0, { surowce: { ...t.stock } })], { c1: ['garncarnia'] });
  const u = f.utilizationByCity.get('c1') && f.utilizationByCity.get('c1').garncarnia;
  ok(!!u, `[${t.name}] jest wpis wykorzystania`);
  if (!u) continue;
  eq(u.pct, t.pct, `[${t.name}] procent`);
  eq(u.cykle, t.cykle, `[${t.name}] cykle`);
  eq(u.maxCykle, GARN_MAX, `[${t.name}] maks. cykle`);
  eq(u.limitedBy, t.lim, `[${t.name}] powod`);
  if (t.missing) eq(JSON.stringify(u.missing), JSON.stringify(t.missing), `[${t.name}] brakujace wejscia`);
}
{
  // wylaczony: brak wpisu (silnik go pomija); snapshot pokazuje enabled=false bez widoku
  const c = mkCity('c1', 0, 0, { surowce: { glina: 500, drewno: 500 } });
  M.setProductionBuildingEnabled(c, 'garncarnia', false);
  const f = forecast([c], { c1: ['garncarnia'] });
  ok(!(f.utilizationByCity.get('c1') && f.utilizationByCity.get('c1').garncarnia), 'wylaczony: brak wpisu wykorzystania');
  const s = M.buildEmpireProducersSnap({
    cities: [c], ownerId: 0, builtByCity: new Map([['c1', ['garncarnia']]]), era: 1, rawParams: econParams, difficulty: 'normal',
    realizedLastTurn: undefined, utilizationByCity: f.utilizationByCity, buildingLabel,
  });
  const row = s.cities[0].buildings[0];
  eq(row.enabled, false, 'wylaczony: enabled=false');
  eq(row.utilization, undefined, 'wylaczony: brak widoku procentu');
}
{
  // bez przerobu: stolarnia / kamieniarski -> 100% neutralnie, niezaleznie od zapasow
  const c = mkCity('c1', 0, 0, { surowce: {} });
  const f = forecast([c], { c1: ['stolarnia', 'kamieniarski'] });
  const s = M.buildEmpireProducersSnap({
    cities: [c], ownerId: 0, builtByCity: new Map([['c1', ['stolarnia', 'kamieniarski']]]), era: 1, rawParams: econParams, difficulty: 'normal',
    realizedLastTurn: undefined, utilizationByCity: f.utilizationByCity, buildingLabel,
  });
  for (const b of s.cities[0].buildings) {
    eq(b.utilization && b.utilization.kind, 'noConversion', `${b.buildingId}: bez przerobu`);
    eq(b.utilization && b.utilization.pct, 100, `${b.buildingId}: 100%`);
  }
}
{
  // multi-receptura (wielka odlewnia: braz + zelazo + stal): procent = suma cykli / suma maks.
  const f = forecast([mkCity('c1', 0, 0, { surowce: { ruda: 1000, ruda_cyny: 1000, ruda_zelaza: 1000, drewno: 5000, zelazo: 0 } })], { c1: ['wielka_odlewnia'] }, 3);
  const u = f.utilizationByCity.get('c1').wielka_odlewnia;
  ok(u && u.maxCykle > 0 && u.pct >= 0 && u.pct <= 100, 'wielka odlewnia: wpis, 0..100%');
}

// ---------------------------------------------------------------------------
console.log('-- A2. zaokraglenie: niepelne wykorzystanie nie pokazuje 100% (obrona zarzut 3) --');
{
  const mkR = (c, m) => ({ cykle: c, maxCykle: m, limitedBy: c < m ? 'wejscie' : undefined, limitingInputs: ['glina'], missing: { glina: 1 } });
  const a = M.summarizeBuildingUtilization([mkR(199, 200)]);
  eq(a.pct, 99, '199/200 -> 99%');
  ok(a.limitedBy === 'wejscie', '199/200: powod zachowany');
  eq(M.summarizeBuildingUtilization([mkR(200, 200)]).pct, 100, '200/200 -> 100%');
  eq(M.summarizeBuildingUtilization([mkR(100, 200)]).pct, 50, '100/200 -> 50%');
}
console.log('-- B. spojnosc z realna tura (advanceCityEconomy) --');
{
  // 1 garncarnia: procent z prognozy == realizacja / nominal (+-0 pkt)
  for (const glina of [500, 37, 25, 10, 1, 0]) {
    const mk = () => [mkCity('c1', 0, 0, { surowce: { glina, drewno: 500 } })];
    const f = forecast(mk(), { c1: ['garncarnia'] });
    const shown = f.utilizationByCity.get('c1').garncarnia.pct;
    const real = realTick(mk(), { c1: ['garncarnia'] });
    const produced = (real.converterProducedByOwner.get(0) || {}).ceramika || 0;
    const nominal = M.converterProductionDisplayForBuilding('garncarnia', econParams, 'normal', 1).produced.ceramika;
    eq(shown, Math.round(100 * produced / nominal), `glina=${glina}: pokazany % == realna realizacja (${produced}/${nominal})`);
  }
  // 3 garncarnie w 3 miastach, wspolna pula 75 gliny: 100 / 50 / 0 (konkurencja, kolejnosc jak w ticku)
  const mk = () => [mkCity('c1', 0, 0, { surowce: { glina: 75 - GIN, drewno: 500 } }), mkCity('c2', 0, 40), mkCity('c3', 0, 80)];
  const built = { c1: ['garncarnia'], c2: ['garncarnia'], c3: ['garncarnia'] };
  const f = forecast(mk(), built);
  const pcts = ['c1', 'c2', 'c3'].map(id => f.utilizationByCity.get(id).garncarnia.pct);
  eq(pcts.join(','), '100,50,0', '3 garncarnie, 75 gliny: 100/50/0%');
  const real = realTick(mk(), built);
  eq((real.converterProducedByOwner.get(0) || {}).ceramika, 75, 'realna tura: 75 ceramiki');
  const sumCykle = ['c1', 'c2', 'c3'].reduce((a, id) => a + f.utilizationByCity.get(id).garncarnia.cykle, 0);
  eq(sumCykle, 75, 'suma cykli z prognozy == realna produkcja');
  const g = f.producedByOwner.get(0).ceramika;
  eq(g, 75, 'prognoza produkcji (te sama) == 75');
}

// ---------------------------------------------------------------------------
console.log('-- C. migawka: agregat per typ --');
function buildSnap(utilMutator) {
  const cities = [mkCity('c1', 0, 0, { surowce: { glina: 75 - GIN, drewno: 500 } }), mkCity('c2', 0, 40), mkCity('c3', 0, 80), mkCity('c4', 0, 120)];
  M.setProductionBuildingEnabled(cities[3], 'garncarnia', false);
  const built = { c1: ['garncarnia', 'stolarnia'], c2: ['garncarnia'], c3: ['garncarnia', 'kamieniarski'], c4: ['garncarnia'] };
  const f = forecast(cities, built);
  const s = M.buildEmpireProducersSnap({
    cities, ownerId: 0, builtByCity: new Map(Object.entries(built)), era: 1, rawParams: econParams, difficulty: 'normal',
    realizedLastTurn: undefined, utilizationByCity: f.utilizationByCity, buildingLabel,
  });
  if (utilMutator) utilMutator(s);
  return s;
}
{
  const s = buildSnap();
  const g = s.typeSummaries.find(t => t.buildingId === 'garncarnia');
  eq(g.count, 4, 'agregat: 4 garncarnie');
  eq(g.disabled, 1, 'agregat: 1 wylaczona');
  eq(g.avgPct, 50, 'agregat: srednie wykorzystanie wlaczonych 75/150 = 50%');
  ok(!s.typeSummaries.some(t => t.buildingId === 'stolarnia'), 'agregat bez budynkow bez przerobu');
}

// ---------------------------------------------------------------------------
async function sectionD() {
  console.log('-- D. UI panelu imperium (esbuild + jsdom) + E. mutacja --');
  const E_ENTRY = path.join(__dirname, '.rbu-ui-entry.ts');
  const E_BUNDLE = path.join(__dirname, '.rbu-ui-bundle.cjs');
  fs.writeFileSync(E_ENTRY, `export { renderProducersSection } from '../src/ui/empireDetailPanel';\n`, 'utf8');
  const STUB = {
    name: 'stub-brand-assets-rbu',
    setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, (a) => ({ path: a.path, namespace: 'stub-rbu-svg' }));
      build.onLoad({ filter: /.*/, namespace: 'stub-rbu-svg' }, () => ({ contents: 'export default "";\n', loader: 'js' }));
      build.onResolve({ filter: /icons\/brandAssets$/ }, (a) => ({ path: a.path, namespace: 'stub-rbu' }));
      build.onLoad({ filter: /.*/, namespace: 'stub-rbu' }, () => ({
        contents: ['brandIconSvg', 'improvementIconSvg', 'mapResourceIconSvg', 'terrainIconSvg', 'buildingIconSvg', 'unitIconSvg',
          'civIconSvg', 'epochIconSvg', 'settingIconSvg', 'brandMenuComponentsCss', 'menuIconSvg', 'brandMenuEmblemSvg',
          'newGameIntroEmblemSvg', 'brandMotionCss', 'brandMenuBackgroundCss', 'svgThumbHtml']
          .map(n => 'export function ' + n + '(a) { return String(a && a.id ? a.id : (a || "")); }').join('\n') + '\n',
        loader: 'js',
      }));
    },
  };
  try {
    await esbuild.build({
      entryPoints: [E_ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      loader: { '.ts': 'ts', '.json': 'json' }, plugins: [STUB], define: { 'import.meta.glob': '__globStub', 'import.meta.env': '__envStub' },
      banner: { js: 'var __globStub = function () { return {}; }; var __envStub = {};' }, outfile: E_BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
    });
  } catch (e) { console.error('FAIL: bundling UI:', e.message || e); failed++; return; }
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document; global.window = dom.window;
  const U = require(E_BUNDLE);

  /** Zwraca liste niezgodnosci (pusta = UI zgodne z silnikiem). */
  function checkUi(snap) {
    const bad = [];
    const host = document.createElement('div');
    host.innerHTML = U.renderProducersSection(snap);
    const pctOf = key => {
      const el = host.querySelector(`[data-prod-row="${key}"] [data-prod-util-pct]`);
      return el ? el.getAttribute('data-prod-util-pct') : null;
    };
    const rowOf = key => host.querySelector(`[data-prod-row="${key}"]`);
    if (pctOf('c1|garncarnia') !== '100') bad.push('c1 garncarnia != 100');
    if (pctOf('c2|garncarnia') !== '50') bad.push('c2 garncarnia != 50');
    if (pctOf('c3|garncarnia') !== '0') bad.push('c3 garncarnia != 0');
    const r2 = rowOf('c2|garncarnia');
    if (!r2 || !r2.querySelector('[data-prod-util-kind="wejscie"] .bld-res-chip')) bad.push('c2: brak chipa ikona+liczba dla powodu');
    if (r2 && !/brakuje\s*25/.test(r2.textContent)) bad.push('c2: brak "brakuje 25"');
    if (r2 && /Glina/.test(r2.textContent.replace(/title="[^"]*"/g, '')) && !r2.querySelector('.bld-res-chip-ic')) bad.push('c2: naga nazwa surowca zamiast ikony');
    const r4 = rowOf('c4|garncarnia');
    if (!r4 || !r4.querySelector('[data-prod-util-kind="off"]') || !/wyłączony/.test(r4.textContent)) bad.push('c4: brak "wyłączony"');
    if (r4 && r4.querySelector('[data-prod-util-pct]')) bad.push('c4: procent przy wylaczonym');
    const st = rowOf('c1|stolarnia');
    if (!st || !st.querySelector('[data-prod-util-kind="noConversion"]') || pctOf('c1|stolarnia') !== '100') bad.push('stolarnia: brak "bez przerobu" 100%');
    const ag = host.querySelector('[data-prod-type="garncarnia"]');
    if (!ag || !/4 szt\./.test(ag.textContent) || !/średnie wykorzystanie 50%/.test(ag.textContent)) bad.push('agregat garncarni');
    return bad;
  }
  const real = buildSnap();
  const badReal = checkUi(real);
  eq(badReal.length, 0, 'UI zgodne z silnikiem: ' + badReal.join('; '));
  // E. MUTACJA: zahardkodowane 100% (jak "naiwny" panel) musi czerwienic asercje
  const mutated = buildSnap(s => {
    for (const c of s.cities) for (const b of c.buildings) if (b.utilization) { b.utilization.pct = 100; b.utilization.limitedBy = undefined; b.utilization.missing = {}; }
    for (const t of s.typeSummaries) t.avgPct = 100;
  });
  const badMut = checkUi(mutated);
  ok(badMut.length >= 3, `MUTACJA hardkod 100% czerwieni test (niezgodnosci: ${badMut.length})`);
  // brak utilization (stary snap bez prognozy) nie wywala renderu
  const old = buildSnap(s => { for (const c of s.cities) for (const b of c.buildings) delete b.utilization; delete s.typeSummaries; });
  const html = U.renderProducersSection(old);
  ok(html.includes('data-prod-toggle') && !html.includes('data-prod-util-pct'), 'snap bez prognozy: render bez procentow, przelaczniki dzialaja');
}

sectionD().then(() => {
  console.log(`\nresource-building-utilization-test: ${passed} passed, ${failed} failed`);
  for (const f of ['.rbu-entry.ts', '.rbu-bundle.cjs', '.rbu-ui-entry.ts', '.rbu-ui-bundle.cjs']) { try { fs.unlinkSync(path.join(__dirname, f)); } catch (e) { /* ignore */ } }
  process.exit(failed ? 1 : 0);
});
