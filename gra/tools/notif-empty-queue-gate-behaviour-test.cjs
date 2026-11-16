'use strict';
/**
 * notif-empty-queue-gate-behaviour-test.cjs -- R-WEB-NOTIF-EMPTY-QUEUE-NO-BUILDING-AVAILABLE-Q2 (runda 2, odpowiedź na zarzut 1 Evaluatora).
 *
 * WYKONUJE (nie tylko czyta) prawdziwe funkcje z src/main.ts, wycięte po sygnaturze i przetranspilowane esbuildem:
 *   cityHasActionableProduction, cityHasAffordableBuildingEnqueue, cityHasAffordableLevelUpgrade, productionOptionsFingerprint.
 * Zależności są REALNE: buildableProduction / buildingLevelForEpoch / buildingProductionItem / buildingTypeQueued
 * (src/game/production.ts), buildingCanBuildNow (src/ui/cityPanel.ts) oraz realne dane (gra/data/*.json).
 * Stubowane są tylko to, czego gate nie czyta z żywego stanu gry: tech ownera (lista), kontekst dostępności
 * (productionAvailabilityCtxForCity -> podany obiekt) i tryb autobudowy (isCityAutoBuildActive).
 *
 * Przypadki (dispatch DODATEK 1):
 *   (i)   wszystko zbudowane (zostają zablokowane epoką/technologią) => BRAK zdarzenia (gate = false), także przy pełnej puli;
 *   (ii)  dostępny budynek, ale pula surowców pusta                => BRAK zdarzenia;
 *   (iii) dostępny budynek, stać, kolejka pusta                    => zdarzenie JEST (gate = true);
 *   (iv)  wszystko zbudowane + pełna pula (rekrutacja jednostek możliwa) => BRAK zdarzenia.
 * Mutacje na KOPII źródła (w pamięci), każda MUSI zmienić wynik behawioralny:
 *   M1 gate z gałęzią rekrutacji (ctx.__recruitAffordable) => przypadek (iv) daje true (test czerwony);
 *   M2 predykat budowy w enqueue wyłączony (if(false))      => przypadek (ii) daje true (test czerwony);
 *   M3 odcisk z członem „|up:” wycięty                     => przypadek fingerprint(i) różni się od oczekiwanego (test czerwony).
 * Run z gra/:  node tools/notif-empty-queue-gate-behaviour-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d !== undefined ? ' -- ' + JSON.stringify(d) : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nebq2-'));

// Wycinek funkcji z main.ts od sygnatury do pierwszego "\n    }\n" (wcięcie 4 spacje, jak w boot()).
function fnBody(src, sig) {
  const start = src.indexOf(sig);
  if (start < 0) throw new Error('brak sygnatury w main.ts: ' + sig);
  const end = src.indexOf('\n    }\n', start);
  if (end < 0) throw new Error('brak końca funkcji: ' + sig);
  return src.slice(start, end + '\n    }\n'.length - 1);
}
function mutateOnce(text, from, to) {
  if (text.split(from).length !== 2) throw new Error('wzorzec mutacji musi wystąpić dokładnie raz: ' + from);
  return text.replace(from, to);
}

const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const SRC = {
  gate: fnBody(mainSrc, 'function cityHasActionableProduction('),
  enq: fnBody(mainSrc, 'function cityHasAffordableBuildingEnqueue('),
  upg: fnBody(mainSrc, 'function cityHasAffordableLevelUpgrade('),
  fp: fnBody(mainSrc, 'function productionOptionsFingerprint('),
};
const PRED_LINE = 'if (!buildingCanBuildNow(def, city, data, ctx, techs)) continue;';

// Stuby zależności spoza gate (patrz nagłówek).
const STUBS = `
let data: any = null;
let TECHS: string[] = [];
let CTX: any = {};
let AUTO = false;
export function __setup(d: any, techs: string[]) { data = d; TECHS = techs; }
export function __setCtx(ctx: any) { CTX = ctx; }
export function __setAuto(v: boolean) { AUTO = v; }
function unlockedTechsForOwner(_o: number): string[] { return TECHS; }
function isCityAutoBuildActive(_c: any): boolean { return AUTO; }
function isAutoBudowaTryb(_t: any): boolean { return false; }
function productionAvailabilityCtxForCity(_c: any): any { return CTX; }
`;

const PROD = path.join(GRA, 'src', 'game', 'production.ts');
const PANEL = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const DATA_DIR = path.join(GRA, 'data');
const BRAND_STUB = path.join(GRA, 'tools', '.stubs', 'recruit-list-visibility-ui-brandAssets-stub.ts');
const stubPlugin = {
  name: 'stub-brand-assets',
  setup(build) { build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); },
};
const svgRawPlugin = {
  name: 'svg-raw',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, args => ({ path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'svg-raw' }));
    build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, args => ({ contents: 'export default ' + JSON.stringify(fs.readFileSync(args.path, 'utf8')) + ';', loader: 'js' }));
  },
};
const globPlugin = {
  name: 'import-meta-glob-empty',
  setup(build) {
    build.onLoad({ filter: /\/src\/.*\.ts$/ }, async args => {
      const c = await fs.promises.readFile(args.path, 'utf8');
      if (!c.includes('import.meta.glob')) return undefined;
      return { contents: c.replace(/import\.meta\.glob\(/g, '((..._g) => ({}))('), loader: 'ts' };
    });
  },
};
// Atrapa DOM (cityPanel.ts dotyka DOM przy ładowaniu); predykat buildingCanBuildNow nie korzysta z DOM.
function domStub() {
  const make = () => {
    const f = function () {};
    const p = new Proxy(f, {
      get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : p),
      apply: () => p, construct: () => p, set: () => true,
    });
    return p;
  };
  if (typeof globalThis.document === 'undefined') globalThis.document = make();
  if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
  if (typeof globalThis.navigator === 'undefined') globalThis.navigator = { userAgent: 'node' };
  if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}
domStub();

let buildCounter = 0;
// Buduje moduł z (możliwie zmutowanymi) wycinkami main.ts i zwraca wyeksportowane funkcje.
async function loadGate(texts) {
  const n = ++buildCounter;
  const entry = path.join(tmp, `gate-${n}.ts`);
  const out = path.join(tmp, `gate-${n}.cjs`);
  const body = [
    `import { buildableProduction, buildingLevelForEpoch, buildingProductionItem, buildingTypeQueued } from ${JSON.stringify(PROD)};`,
    `import { buildingCanBuildNow } from ${JSON.stringify(PANEL)};`,
    STUBS,
    'function __unused(): void { void buildableProduction; void buildingLevelForEpoch; void buildingProductionItem; void buildingTypeQueued; void buildingCanBuildNow; }',
    texts.gate, texts.enq, texts.upg, texts.fp,
    'export { cityHasActionableProduction, productionOptionsFingerprint };',
    '',
  ].join('\n');
  fs.writeFileSync(entry, body);
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    outfile: out, absWorkingDir: GRA, logLevel: 'silent', loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [stubPlugin, svgRawPlugin, globPlugin],
  });
  return require(out);
}

const buildingsJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'buildings.json'), 'utf8'));
const techJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tech.json'), 'utf8'));
const unitsJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'units.json'), 'utf8'));
const data = { buildings: buildingsJson, units: unitsJson, tech: techJson.technologie, techs: techJson.technologie };

(async () => {
  // Bazowy wariant (kod z main.ts bez mutacji) i dane do scenariuszy.
  const G = await loadGate(SRC);
  G.__setup(data, []);
  const base = {
    builtBuildingIds: [], productionQueue: [], epoch: 1, civBonusy: [], buildingCostPace: 'niski',
    difficulty: 'normal', isCapital: false, cityHasCoastOrRiver: false, cityHasRiver: false, empireBuiltIds: [],
    empireResourceStock: {},
  };
  const mkCity = (surowce) => ({ id: 1, ownerId: 0, surowce: { ...surowce }, budowaTryb: undefined, kolejka: [] });

  console.log('0. WARUNKI WSTĘPNE (realne dane): dostępne budynki epoki Kamień bez technologii');
  // Pozyskanie realnej listy dostępnych budynków przez ten sam kod gate (enqueue zwraca bool; listę bierzemy z G-bundle).
  const P = await loadProd();
  const emptyCtx = { ...base, empireResourceStock: {} };
  const candidates = P.buildableProduction(mkCity({}), data, [], { ...emptyCtx, showResourceGatedBuildings: true })
    .map(it => data.buildings.find(b => b.id === it.id))
    .filter(def => def && Object.keys(P.buildingStockCost(def)).length > 0);
  ok(candidates.length > 0, 'są budynki epoki Kamień z kosztem surowcowym i bez wymagań technologii', candidates.length);
  // Kandydat: stać na niego (pula = jego koszt), a bez puli — nie stać.
  const cand = candidates.find(def => P.buildingCanBuildNow(def, mkCity(P.buildingStockCost(def)), data, { ...emptyCtx, empireResourceStock: { ...P.buildingStockCost(def) } }, []));
  ok(!!cand, 'znaleziono budynek kandydata, na który stać przy pełnej puli');
  if (!cand) { finish(); return; }
  const candCost = P.buildingStockCost(cand);
  console.log(`  (kandydat: ${cand.id}, koszt: ${JSON.stringify(candCost)})`);

  // Pula „wszystko zbudowane”: suma kosztów wszystkich dostępnych budynków epoki Kamień (stać na wszystkie).
  const allIds = P.buildableProduction(mkCity({}), data, [], { ...emptyCtx, showResourceGatedBuildings: true }).map(it => it.id);
  const bigPool = {};
  for (const id of allIds) {
    const def = data.buildings.find(b => b.id === id);
    if (!def) continue;
    for (const [k, v] of Object.entries(P.buildingStockCost(def))) bigPool[k] = (bigPool[k] ?? 0) + v;
  }

  const setScenario = (surowce, ctxOver) => {
    G.__setCtx({ ...base, ...ctxOver });
    return mkCity(surowce);
  };

  console.log('(iii) dostępny budynek, stać, kolejka pusta => zdarzenie JEST');
  {
    const city = setScenario(candCost, { empireResourceStock: { ...candCost } });
    ok(G.cityHasActionableProduction(city) === true, 'gate = true (zdarzenie prod-empty)', G.cityHasActionableProduction(city));
    const fp = G.productionOptionsFingerprint(city);
    ok(fp.includes(cand.id) && fp.endsWith('|up:0'), 'odcisk zawiera dostępny budynek i |up:0', fp);
  }

  console.log('(ii) dostępny budynek, pula surowców pusta => BRAK zdarzenia');
  {
    const city = setScenario({}, { empireResourceStock: {} });
    const g = G.cityHasActionableProduction(city);
    ok(g === false, 'gate = false (brak zdarzenia)', g);
  }

  console.log('(i) wszystko zbudowane (zostają zablokowane epoką) => BRAK zdarzenia');
  {
    const city = setScenario({ ...bigPool }, { builtBuildingIds: allIds, empireResourceStock: { ...bigPool } });
    const g = G.cityHasActionableProduction(city);
    ok(g === false, 'gate = false mimo pełnej puli (nic do wybudowania)', g);
    const fp = G.productionOptionsFingerprint(city);
    ok(fp === '|up:0', 'odcisk pusty (brak budynków, brak ulepszeń)', fp);
  }

  console.log('(iv) wszystko zbudowane, pełna pula (rekrutacja jednostek możliwa) => BRAK zdarzenia');
  {
    const city = setScenario({ ...bigPool }, { builtBuildingIds: allIds, empireResourceStock: { ...bigPool }, __recruitAffordable: true });
    const g = G.cityHasActionableProduction(city);
    ok(g === false, 'gate = false mimo flagi „rekrutacja możliwa” (gate nie czyta rekrutacji)', g);
  }

  console.log('M. MUTACJE KOPII main.ts (test musi je wykryć zmianą wyniku behawioralnego)');
  {
    // M1: gałąź rekrutacji wpięta w bramkę.
    const M1 = await loadGate({ ...SRC, gate: mutateOnce(SRC.gate, 'if (cityHasAffordableBuildingEnqueue(city, ctx)) return true;',
      'if (cityHasAffordableBuildingEnqueue(city, ctx)) return true;\n      if ((ctx as any).__recruitAffordable) return true;') });
    M1.__setup(data, []);
    M1.__setCtx({ ...base, builtBuildingIds: allIds, empireResourceStock: { ...bigPool }, __recruitAffordable: true });
    const g1 = M1.cityHasActionableProduction(mkCity({ ...bigPool }));
    ok(g1 === true, 'M1 (rekrutacja w bramce): przypadek (iv) daje true => test (iv) czerwony', g1);

    // M2: predykat budowy wyłączony w enqueue (wszystko dostępne liczy się bez surowców).
    const M2 = await loadGate({ ...SRC, enq: mutateOnce(SRC.enq, PRED_LINE, 'if (false) continue;') });
    M2.__setup(data, []);
    M2.__setCtx({ ...base, empireResourceStock: {} });
    const g2 = M2.cityHasActionableProduction(mkCity({}));
    ok(g2 === true, 'M2 (bez predykatu budowy): przypadek (ii) daje true => test (ii) czerwony', g2);

    // M3: odcisk bez członu ulepszeń — ta sama sygnatura co bazowa dla (i), ale wynik ma `|up:` wycięty.
    const M3 = await loadGate({ ...SRC, fp: mutateOnce(SRC.fp, "return affordIds.sort().join(',') + '|up:' + ups;", "return affordIds.sort().join(',');") });
    M3.__setup(data, []);
    M3.__setCtx({ ...base, builtBuildingIds: allIds, empireResourceStock: { ...bigPool } });
    const fp3 = M3.productionOptionsFingerprint(mkCity({ ...bigPool }));
    ok(fp3 !== '|up:0', 'M3 (odcisk bez |up:): przypadek (i) daje inny odcisk => test (i)-odcisk czerwony', fp3);
  }

  finish();
})().catch(e => { console.error(e); process.exit(1); });

let PROD_CACHE = null;
async function loadProd() {
  if (PROD_CACHE) return PROD_CACHE;
  const n = 'prod-helpers';
  const entry = path.join(tmp, `${n}.ts`);
  const out = path.join(tmp, `${n}.cjs`);
  fs.writeFileSync(entry, [
    `export { buildableProduction } from ${JSON.stringify(PROD)};`,
    `export { buildingCanBuildNow } from ${JSON.stringify(PANEL)};`,
    `export { buildingStockCost } from ${JSON.stringify(path.join(GRA, 'src', 'game', 'building-stock-cost.ts'))};`,
    '',
  ].join('\n'));
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    outfile: out, absWorkingDir: GRA, logLevel: 'silent', loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [stubPlugin, svgRawPlugin, globPlugin],
  });
  PROD_CACHE = require(out);
  return PROD_CACHE;
}

function finish() {
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nRESULT: ${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}
