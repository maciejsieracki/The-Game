'use strict';
/**
 * notif-empty-queue-buildable-test.cjs -- R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1 (runda 3).
 * Reguła: powiadomienie „Produkcja: <miasto> — Kolejka pusta" tylko gdy gracz realnie może coś
 * wybudować teraz. Bramka budynków/ulepszeń i odcisk (main.ts) używają TEGO SAMEGO predykatu co
 * panel produkcji: buildingCanBuildNow (cityPanel.ts), czyli wszystkich chipów wymagań.
 *  A. JEDNOSTKOWA: realne isCityUnderSiege (src/game/city-siege-state.ts, esbuild).
 *  B. STRUKTURALNA src/main.ts: bramki budynków/ulepszeń i odcisk wołają buildingCanBuildNow (linia
 *     `if (!buildingCanBuildNow(def, city, data, ctx, techs)) continue;` dokładnie, bez canAffordBuildingStock);
 *     bramka werbunku i odcisk mają guard oblężenia. B2: MUTACJE main.ts w pamięci (if(false), `|| true`,
 *     powrót do canAffordBuildingStock, zdjęcie guardu) MUSZĄ czerwienić strukturę -- dowód, że test
 *     wykrywa cofnięcie poprawki w main.ts, a nie tylko własną kopię predykatu.
 *  C. BEHAWIORALNA: realny cityPanel.ts (esbuild, realne gra/data/buildings.json): budynek z kosztem
 *     magazynu bez surowców -> buildingCanBuildNow = false (brak zdarzenia); z pełnym magazynem -> true;
 *     z pełnym magazynem, ale bez odblokowanej technologii (chip tech) -> false.
 *  D. MUTACJA: bundel cityPanel.ts bez chipów magazynu MUSI dać true bez surowców (test C wykrywa).
 * Zakres: sprawdza predykat i strukturę bramki; samej funkcji cityHasActionableProduction (lokalnej
 * w boot()) nie wykonuje. Dowód w przeglądarce: NIE_ZMIERZONO (zakaz build/dev w gra/).
 * Run z gra/:  node tools/notif-empty-queue-buildable-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d !== undefined ? ' -- ' + JSON.stringify(d) : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nebq1-'));

// Wycinek funkcji z main.ts od sygnatury do pierwszego "\n    }\n" (wcięcie 4 spacje, jak w boot()).
function fnBody(src, sig) {
  const start = src.indexOf(sig);
  if (start < 0) return null;
  const end = src.indexOf('\n    }\n', start);
  return end < 0 ? null : src.slice(start, end);
}
const GATE_SIG = 'function cityHasAffordableUnitRecruitment(';
const FP_SIG = 'function productionOptionsFingerprint(';
const ENQ_SIG = 'function cityHasAffordableBuildingEnqueue(';
const UPG_SIG = 'function cityHasAffordableLevelUpgrade(';
const GUARD = /isCityUnderSiege\(\[city\], city\)/;
const PRED_LINE = 'if (!buildingCanBuildNow(def, city, data, ctx, techs)) continue;';
const LEGACY = /canAffordBuildingStock\(/;

function structural(src) {
  const gate = fnBody(src, GATE_SIG);
  const fp = fnBody(src, FP_SIG);
  const enq = fnBody(src, ENQ_SIG);
  const upg = fnBody(src, UPG_SIG);
  return {
    gateGuard: !!gate && GUARD.test(gate),
    fpGuard: !!fp && GUARD.test(fp),
    enqPred: !!enq && enq.includes(PRED_LINE) && !LEGACY.test(enq),
    upgPred: !!upg && upg.includes(PRED_LINE) && !LEGACY.test(upg),
    fpPred: !!fp && fp.includes(PRED_LINE),
  };
}
// Mutant: podmiana tekstu WEWNĄTRZ ciała jednej funkcji (np. enqueue) -- reszta pliku bez zmian.
function mutateBody(src, sig, from, to) {
  const start = src.indexOf(sig);
  if (start < 0) throw new Error('brak sygnatury ' + sig);
  const end = src.indexOf('\n    }\n', start);
  const body = src.slice(start, end);
  if (!body.includes(from)) throw new Error('brak wzorca mutacji w ' + sig);
  return src.slice(0, start) + body.split(from).join(to) + src.slice(end);
}

const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const cityPanelSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');

console.log('A. JEDNOSTKOWA (realne isCityUnderSiege)');
{
  const entry = path.join(tmp, 'entry.ts'), out = path.join(tmp, 'siege.cjs');
  fs.writeFileSync(entry, `export * from ${JSON.stringify(GRA + '/src/game/city-siege-state')};\n`);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
  const m = require(out);
  const besieged = { id: 'c1', ownerId: 0, q: 0, r: 0, oblegane: true };
  const free = { id: 'c2', ownerId: 0, q: 5, r: 5, oblegane: false };
  ok(m.isCityUnderSiege([besieged], besieged) === true, 'miasto oblegane: isCityUnderSiege = true');
  ok(m.isCityUnderSiege([free], free) === false, 'miasto nieoblegane: isCityUnderSiege = false');
}

console.log('B. STRUKTURALNA src/main.ts (predykat panelu + guard oblężenia)');
{
  const s = structural(mainSrc);
  ok(s.gateGuard, 'bramka cityHasAffordableUnitRecruitment ma guard isCityUnderSiege([city], city)');
  ok(s.fpGuard, 'productionOptionsFingerprint ma guard isCityUnderSiege([city], city)');
  ok(s.enqPred, 'cityHasAffordableBuildingEnqueue używa buildingCanBuildNow (predykat panelu)');
  ok(s.upgPred, 'cityHasAffordableLevelUpgrade używa buildingCanBuildNow (predykat panelu)');
  ok(s.fpPred, 'productionOptionsFingerprint używa buildingCanBuildNow (spójność z bramką)');
}
console.log('B2. MUTACJE main.ts w pamięci (test musi je wykryć)');
{
  const cases = [
    ['enqueue: if(false) zamiast predykatu', mutateBody(mainSrc, ENQ_SIG, PRED_LINE, 'if (false) continue;'), s => !s.enqPred],
    ['enqueue: predykat z || true', mutateBody(mainSrc, ENQ_SIG, PRED_LINE, 'if (!(buildingCanBuildNow(def, city, data, ctx, techs) || true)) continue;'), s => !s.enqPred],
    ['enqueue: cofnięcie do canAffordBuildingStock', mutateBody(mainSrc, ENQ_SIG, PRED_LINE, 'if (!canAffordBuildingStock(pool, buildingStockCost(def))) continue;'), s => !s.enqPred],
    ['ulepszenia: cofnięcie do canAffordBuildingStock', mutateBody(mainSrc, UPG_SIG, PRED_LINE, 'if (!canAffordBuildingStock(pool, buildingStockCost(def))) continue;'), s => !s.upgPred],
    ['odcisk: zdjęty guard oblężenia', mutateBody(mainSrc, FP_SIG, 'city.ownerId === 0 && !isCityUnderSiege([city], city)', 'city.ownerId === 0'), s => !s.fpGuard],
  ];
  for (const [name, mutSrc, detected] of cases) {
    ok(detected(structural(mutSrc)), 'mutacja wykryta: ' + name);
  }
}

(async () => {
console.log('C. BEHAWIORALNA (realny cityPanel.ts + realne dane)');
const DATA_DIR = path.join(GRA, 'data');
const buildingsJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'buildings.json'), 'utf8'));
const techJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tech.json'), 'utf8'));
const unitsJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'units.json'), 'utf8'));
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

// cityPanel.ts dotyka DOM przy ładowaniu modułu: w Node podstawiamy bezpieczną atrapę document/window.
// Predykat buildingCanBuildNow nie korzysta z DOM (tylko dane i chipy), więc atrapa go nie zmienia.
function domStub() {
  const make = () => {
    const f = function () {};
    const p = new Proxy(f, {
      get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : p),
      apply: () => p,
      construct: () => p,
      set: () => true,
    });
    return p;
  };
  if (typeof globalThis.document === 'undefined') globalThis.document = make();
  if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
  if (typeof globalThis.navigator === 'undefined') globalThis.navigator = { userAgent: 'node' };
  if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}
domStub();

// Bundel cityPanel.ts. variant 'orig' = plik bez zmian;
// 'mut' = predykat buildingCanBuildNow IGNORUJE chipy magazynu (kind 'stock') -- mutacja D.
async function bundlePanel(variant) {
  let src = cityPanelSrc;
  if (variant === 'mut') {
    const needle = 'return chips.length === 0 || chips.every(c => c.met);';
    if (src.split(needle).length !== 2) throw new Error('wzorzec predykatu buildingCanBuildNow nie znaleziony');
    src = src.replace(needle, "return chips.filter(c => c.kind !== 'stock').every(c => c.met);");
  }
  const entry = path.join(tmp, 'entry-' + variant + '.ts');
  const out = path.join(tmp, 'panel-' + variant + '.cjs');
  fs.writeFileSync(entry, [
    "import * as panel from '" + path.join(GRA, 'src', 'ui', 'cityPanel.ts') + "';",
    "import { buildingStockCost } from '" + path.join(GRA, 'src', 'game', 'building-stock-cost.ts') + "';",
    'export const buildingCanBuildNow = panel.buildingCanBuildNow;',
    'export const buildingRequirementChips = panel.buildingRequirementChips;',
    'export { buildingStockCost };',
    '',
  ].join('\n'));
  const variantPlugin = {
    name: 'panel-variant',
    setup(build) {
      build.onLoad({ filter: /src\/ui\/cityPanel\.ts$/ }, args => {
        if (path.resolve(args.path) !== path.resolve(GRA, 'src', 'ui', 'cityPanel.ts')) return undefined;
        return { contents: src + '\nexport { buildingRequirementChips };\n', loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    outfile: out, absWorkingDir: GRA, logLevel: 'silent', loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [variantPlugin, stubPlugin, svgRawPlugin, globPlugin],
  });
  return require(out);
}

// Prosty budynek testowy: koszt magazynu, bez technologii, rozbudowy, lokalizacji i wymagań miasta.
const data = { buildings: buildingsJson, units: unitsJson, tech: techJson.technologie, techs: techJson.technologie };
function behaviour(panel) {
  const def = data.buildings.find(b => {
    const cost = panel.buildingStockCost(b);
    return Object.keys(cost).length > 0
      && !b.upgradeFrom && !b.lokalizacja && (b.epokaWejscia ?? 1) <= 1;
  });
  if (!def) return null;
  const cost = panel.buildingStockCost(def);
  // Technologia z definicji budynku jest odblokowana (chip tech = spełniony), żeby zostały tylko chipy magazynu.
  const techs = [String(def.techUnlock ?? '').trim()].filter(t => t && t !== '-' && t !== '—');
  const base = { builtBuildingIds: [], productionQueue: [], epoch: 1, civBonusy: [], buildingCostPace: 'niski', difficulty: 'normal', isCapital: false, cityHasCoastOrRiver: false, cityHasRiver: false, empireBuiltIds: [] };
  // city=undefined: panel bierze pulę z ctx.empireResourceStock (ta sama pula, co ownerSurowcePoolFor w grze).
  return {
    id: def.id,
    noStock: panel.buildingCanBuildNow(def, undefined, data, { ...base, empireResourceStock: {} }, techs),
    withStock: panel.buildingCanBuildNow(def, undefined, data, { ...base, empireResourceStock: { ...cost } }, techs),
  };
}
const real = behaviour(await bundlePanel('orig'));
if (!real) {
  ok(false, 'znaleziono budynek testowy z kosztem magazynu');
} else {
  console.log(`  (budynek testowy: ${real.id})`);
  ok(real.noStock === false, 'bez surowców w magazynie: buildingCanBuildNow = false (brak zdarzenia)', real.noStock);
  ok(real.withStock === true, 'z pełnym magazynem: buildingCanBuildNow = true (zdarzenie)', real.withStock);
  const panelOrig = await bundlePanel('orig');
  const def = data.buildings.find(b => b.id === real.id);
  const cost = panelOrig.buildingStockCost(def);
  const base = { builtBuildingIds: [], productionQueue: [], epoch: 1, civBonusy: [], buildingCostPace: 'niski', difficulty: 'normal', isCapital: false, cityHasCoastOrRiver: false, cityHasRiver: false, empireBuiltIds: [] };
  const noTech = panelOrig.buildingCanBuildNow(def, undefined, data, { ...base, empireResourceStock: { ...cost } }, []);
  ok(noTech === false, 'pełny magazyn, brak odblokowanej technologii (chip tech): buildingCanBuildNow = false', noTech);
}

console.log('D. MUTACJA cityPanel.ts (bez chipów magazynu) musi wywrócić C');
{
  let mut = null;
  try { mut = behaviour(await bundlePanel('mut')); } catch (e) { ok(false, 'bundel mutacji powstał', String(e && e.message || e)); }
  if (mut) ok(mut.noStock === true, 'mutacja wykryta: bez chipów magazynu predykat daje true bez surowców (C byłaby czerwona)', mut.noStock);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nRESULT: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
