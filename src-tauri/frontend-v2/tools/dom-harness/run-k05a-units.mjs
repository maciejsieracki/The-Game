#!/usr/bin/env node
/**
 * run-k05a-units.mjs — harness porównania wartości/tekstu: jednostki K05A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1,
 * runda 2) — port (`src/ui/cityPanel/k05a-fundament.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`).
 *
 * Jednostki pinu wyciągane PO NAZWIE (od `function NAME`/`const NAME` w kolumnie 0 do końca bloku). Każda jednostka
 * z pinu i z portu jest wywoływana na tym samym zestawie wejść; wynik (wartość lub tekst HTML) musi być identyczny.
 * Parametry UI: pin czyta `gra/data/ui-params.json`; port importuje `../uiParams`, który w harnessie jest podmieniany
 * (plugin esbuild) na stub z tym samym JSON-em — wiring `staticCatalog` nie jest tu testowany (NIE_ZMIERZONO, K01A-ADAPT).
 * Typy (`City`, `OkolicaTryb`, `TerenBazowy`) są usuwane przy kompilacji; enum `TerenBazowy` z pinu jest wstrzykiwany do
 * sondy pinu i porównany z kopią portu wartość po wartość.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k05a-units.mjs --pin-dir <PIN_DIR> [--v2 <plik-portu>]
 *   <PIN_DIR> = katalog poza repo z `git archive edb8fb56 gra/src gra/data`.
 *   --v2 podmienia plik portu (używane przez mutate-k05a-units.mjs).
 * EXIT 0 <=> 0 różnic; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k05a-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2 <plik>]');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k05a-fundament.ts'));
const PIN_FILE = join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts');
const PIN_HEX = join(resolve(PIN_DIR), 'gra/src/types/hex.ts');
const PIN_UI_PARAMS = JSON.parse(readFileSync(join(resolve(PIN_DIR), 'gra/data/ui-params.json'), 'utf8'));
const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');
const pinHexLines = readFileSync(PIN_HEX, 'utf8').split('\n');

/** Blok najwyższego poziomu z pinu: od linii `function NAME`/`const NAME` do `}` (function) lub do `;` (const). */
function extractTop(name) {
  const re = new RegExp(`^(export )?(function|const) ${name}\\b`);
  const i = pinLines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak deklaracji ${name}`);
  let j = i;
  if (/^(export )?const /.test(pinLines[i]) && pinLines[i].trimEnd().endsWith(';')) {
    j = i;
  } else if (/^(export )?const /.test(pinLines[i])) {
    while (!/^\S.*;\s*$/.test(pinLines[j]) || j === i) j++;
  } else {
    while (pinLines[j] !== '}') j++;
  }
  return pinLines.slice(i, j + 1).join('\n').replace(/^(export )?(function|const) /m, (_m, _e, kw) => `export ${kw} `);
}

const PIN_NAMES = [
  'ENTITY_CARD_BUILDING_STYLE_ID', 'TEREN_COL', 'TEREN_LETTER', 'hexDist', 'okolicaPreviewRadius', 'rangeName', 'ringsTiles', 'okStat',
  // K05A r3 (batch 1): jednostki z pinu wołające reguły przez wejścia z fixture (K05A-Z4).
  'buildingLocationRequirementMet', 'recruitManpowerCost', 'empireRekruciTotal', 'empireRekruciAffordable',
  'maxAffordableRecruitQuantity', 'unitStockCostChipsHtml', 'unitResourceUpkeepChipsHtml', 'missingTechSteps',
  'recruitUnit', 'improvementsInCityRange',
  // K05A r3 (batch 2): kopie z pinu; `buildingRequirementChips` to ADAPTER (K05A-Z4) — nie jest tu porównywany z pinem.
  'buildingCanBuildNow', 'sortProductionItemsByBuildability', 'buildingConverterProductionDisplay', 'productionCtxForCity',
  'formatBuildingCatalogLockHint', 'formatBuildingPreviewHint', 'collectEraPreviewEntries',
];
const pinEnum = pinHexLines.slice(11, 24).join('\n'); // types/hex.ts:12-24 (TerenBazowy)
/** K05A-Z4: wejścia reguł pinu = ten sam fixture co po stronie portu (`globalThis.__K05A_FIX`, ustawiany per wariant). */
const PIN_RULE_STUBS = `
const cfg = new Proxy({}, { get: (_t, k) => globalThis.__K05A_FIX.cfg[k] });
const civManpowerMaxMult = (b) => globalThis.__K05A_FIX.rules.civManpowerMaxMult(b);
const unitManpowerCostForType = (t, e, m) => globalThis.__K05A_FIX.rules.unitManpowerCostForType(t, e, m);
const ownerSurowcePoolFor = (c) => globalThis.__K05A_FIX.rules.ownerSurowcePoolFor(c);
const stockResourceLabel = (k) => globalThis.__K05A_FIX.rules.stockResourceLabel(k);
const unitStockCost = (u) => globalThis.__K05A_FIX.rules.unitStockCost(u);
const unitResourceUpkeep = (u) => globalThis.__K05A_FIX.rules.unitResourceUpkeep(u);
const isUnitRecruitStockChipMissing = (p, u, k) => globalThis.__K05A_FIX.rules.isUnitRecruitStockChipMissing(p, u, k);
const techPrereqChain = (d, t) => globalThis.__K05A_FIX.rules.techPrereqChain(d, t);
const buildingRequirementChips = (...a) => globalThis.__K05A_FIX.rulesExt.buildingRequirementChips(...a);
const findBuildingDef = (d, id) => globalThis.__K05A_FIX.rulesExt.findBuildingDef(d, id);
const converterProductionDisplayForBuilding = (...a) => globalThis.__K05A_FIX.rulesExt.converterProductionDisplayForBuilding(...a);
const techIconHintSpan = (...a) => globalThis.__K05A_FIX.rulesExt.techIconHintSpan(...a);
const getTechDef = (d, n) => globalThis.__K05A_FIX.rulesExt.getTechDef(d, n);
const isEmptyDataVal = (v) => globalThis.__K05A_FIX.rulesExt.isEmptyDataVal(v);
const naukaCostSuffix = () => globalThis.__K05A_FIX.rulesExt.naukaCostSuffix();
const eraBuildingCatalog = (d, t, p) => globalThis.__K05A_FIX.rulesExt.eraBuildingCatalog(d, t, p);
const unitNacjaForCivKey = (k) => globalThis.__K05A_FIX.rulesExt.unitNacjaForCivKey(k);
const getProd = (id) => globalThis.__K05A_FIX.cfg.getProd?.(id) ?? { kolejka: [] };
const gameData = () => globalThis.__K05A_FIX.cfg.getGameData?.();
const findUnitDef = (d, id) => globalThis.__K05A_FIX.rulesExt.findUnitDef(d, id);
const canAffordUnitRecruitStock = (p, u) => globalThis.__K05A_FIX.rules.canAffordUnitRecruitStock(p, u);
const missingStockFor = (p, c) => globalThis.__K05A_FIX.rules.missingStockFor(p, c);
const rerender = () => globalThis.__K05A_FIX.cfg.rerender?.();
const improvementKeysForHex = (h) => globalThis.__K05A_FIX.rulesExt.improvementKeysForHex(h);
`;
const probeSrc = [
  `export const UI_PARAMS = ${JSON.stringify(PIN_UI_PARAMS)};`,
  pinEnum,
  PIN_RULE_STUBS,
  ...PIN_NAMES.map(extractTop),
  '',
].join('\n');

/** Fixture wejść reguł (K05A-Z4): deterministyczny, zależny od wariantu `v`; ten sam obiekt po obu stronach. */
function mkFix(v) {
  return {
    cfg: {
      getEpoch: (o) => ((o + v) % 4 === 0 ? undefined : o + v),
      getCivBonusy: (o) => (v % 2 === 0 ? [o, 'k'] : undefined),
      getEmpireRekruciTotal: (o) => ((o + v) % 3 === 0 ? undefined : (o + 1) * 10 + v),
      getManpowerSnapshot: (c) => ((c + v) % 2 === 0 ? undefined : { manpowerBiezacy: c * 3 + v }),
      // K05A r3 (batch 2): pola cfg używane przez productionCtxForCity i buildingConverterProductionDisplay.
      difficulty: v === 2 ? undefined : v % 2 ? 'hard' : 'normal',
      getDifficulty: () => (v % 2 ? 'hard' : 'normal'),
      getResourceAccess: (c) => ((c + v) % 2 ? [`r${c}`] : { active: [`x${c}`] }),
      getEmpireResourceAccess: (o) => ((o + v) % 3 ? ['e'] : undefined),
      getEmpireBuiltIds: (o) => ((o + v) % 2 ? ['b1', 'b2'] : undefined),
      getBuiltBuildingIds: (c) => ((c + v) % 3 ? ['b1'] : undefined),
      getCivKey: (o) => ((o + v) % 2 ? 'kk' : undefined),
      getPlacedImprovements: () => (v === 2 ? null : { p: v }),
      getHasKopalniaNaZlozuZelaza: () => v === 1,
      getAliveUnitTypeNames: (o) => (v === 3 ? undefined : [`u${o}`]),
      getBuildingCostPace: () => ['niski', 'normalny', 'wysoki'][v % 3],
      getKosztJednostekPace: () => ['wysoki', 'niski', 'normalny'][v % 3],
      getEmpireStock: (o) => ((o + v) % 2 ? { drewno: o + v } : undefined),
      getCityHasCoastOrRiver: (c) => (c + v) % 2 === 0,
      getCapitalCityId: (o) => ((o + v) % 3 === 0 ? null : o * 2 + v),
      getProd: (c) => ((c + v) % 4 === 0 ? undefined : { kolejka: [{ id: 'a', koszt: c, kind: 'budynek' }, { id: 'b', koszt: 1, kind: 'unit' }] }),
      // K05A r3 (batch 3): recruitUnit — skarb, zakup (log wywołań), odświeżenie panelu (log).
      getTreasury: (o) => ((o + v) % 3 === 0 ? undefined : (o + v) % 3 === 1 ? 100 : 5),
      onPurchaseUnit: (c, t, k, q) => {
        globalThis.__K05A_LOG.push(['buy', c, t, k, q]);
        return v === 1 ? false : v === 2 ? undefined : true;
      },
      rerender: () => globalThis.__K05A_LOG.push(['rr']),
      getGameData: () => ({ units: `g${v}` }),
    },
    rules: {
      civManpowerMaxMult: (b) => (Array.isArray(b) ? b.length + 1 : 1),
      unitManpowerCostForType: (t, ep, m) => t.length * ep * m + v,
      ownerSurowcePoolFor: (city) => ({ drewno: city.id * 2 + v, kamien: v === 1 ? 0 : 3, zloto: v + 2 }),
      stockResourceLabel: (k) => `L${v}:${k}`,
      unitStockCost: (u) => (!u ? {} : u.id === 'a' ? { drewno: 3, kamien: 1 + v } : u.id === 'b' ? { zloto: 2 } : {}),
      unitResourceUpkeep: (u) => (u.id === 'b' ? { zywnosc: 2 + v } : u.id === 'c' ? { drewno: 1, kamien: 0 } : {}),
      isUnitRecruitStockChipMissing: (pool, u, k) => (pool[k] ?? 0) < 2 + v,
      canAffordUnitRecruitStock: (pool, u) => u !== undefined && (pool.drewno ?? 0) >= 2 + v,
      missingStockFor: (pool, cost) =>
        Object.fromEntries(
          Object.entries(cost)
            .filter(([k, n]) => (pool[k] ?? 0) < n + v)
            .map(([k, n]) => [k, n + v - (pool[k] ?? 0)]),
        ),
      techPrereqChain: (d, t) => (t === 'x' ? ['a', 'b', 'x'] : t === 'y' ? ['b', 'y'] : [t]),
    },
    rulesExt: {
      buildingRequirementChips: (def, city, data, ctx, unl) =>
        v === 3
          ? []
          : [
              { label: `C${city ? city.id : 'u'}:${def.id}`, met: (ctx.epoch + v) % 2 === 0, kind: 'stock' },
              { label: `T${unl.length}`, met: unl.length % 2 === 0, iconHtml: '<i>t</i>', kind: 'tech' },
              ...(v % 2 ? [{ label: 'x', met: false, kind: 'other' }] : []),
            ],
      findBuildingDef: (d, id) => (id === 'nope' ? undefined : { id, nazwa: `N-${id}`, techUnlock: id.length % 2 ? 'x' : '-', upgradeFrom: id === 'up' ? 'base' : undefined }),
      converterProductionDisplayForBuilding: (id, raw, diff, era) =>
        (id.length + era + (diff === 'hard' ? 1 : 0) + v) % 3 === 0
          ? null
          : { consumed: { glina: era + v, drewno: 1 }, produced: { ceramika: (era + v + (raw && raw.x ? raw.x : 0)) / 4, glina: 0 } },
      techIconHintSpan: (tech, size, opts) => `<i ${size}>${tech}${opts && opts.inheritColor ? '!' : ''}</i>`,
      getTechDef: (d, name) =>
        name === 'x' ? { 'wymagany budynek': 'Koszary', 'Koszt nauki': 12 + v }
          : name === 'y' ? { 'wymagany budynek': '', 'Koszt nauki': undefined }
            : undefined,
      isEmptyDataVal: (x) => x === '' || x === '-' || x == null,
      naukaCostSuffix: () => ` N${v}`,
      eraBuildingCatalog: (d, t, p) => [
        { id: 'b1', status: 'locked', missingTech: 'x', wymagania: 'W1' },
        { id: 'b2', status: v % 2 ? 'locked' : 'ready' },
        { id: 'b3', status: 'built' },
        { id: 'b4', status: 'locked', locationBlocked: 'stolica' },
        { id: 'b5', status: 'queued', missingTech: 'y' },
        { id: 'b6', status: 'locked', missingTech: 'y', locationBlocked: 'region' },
        { id: 'b7', status: 'locked', wymagania: '' },
        { id: 'b8', status: 'locked', missingTech: 'z', wymagania: 'W8' },
      ],
      unitNacjaForCivKey: (k) => (k === undefined ? null : `N:${k}`),
      findUnitDef: (d, id) => (id === 'zz' ? undefined : { id }),
      improvementKeysForHex: (h) => (h && h.keys ? h.keys : []),
    },
  };
}

const tmp = mkdtempSync(join(tmpdir(), 'p58k05a-harness-'));
const results = [];
let exitCode = 0;

/** Plugin: `../uiParams` w porcie → stub z JSON-em pinu (ten sam wejściowy zestaw parametrów po obu stronach). */
const uiParamsStub = {
  name: 'uiparams-stub',
  setup(build) {
    build.onResolve({ filter: /(^|\/)uiParams$/ }, (a) => ({ path: a.path, namespace: 'uistub' }));
    build.onLoad({ filter: /.*/, namespace: 'uistub' }, () => ({
      contents: `export const UI_PARAMS = ${JSON.stringify(PIN_UI_PARAMS)};`,
      loader: 'js',
    }));
  },
};

try {
  const pinProbe = join(tmp, 'pin-probe.ts');
  writeFileSync(pinProbe, probeSrc);
  await esbuild.build({ entryPoints: [pinProbe], outfile: join(tmp, 'pin.mjs'), bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });
  await esbuild.build({ entryPoints: [V2_FILE], outfile: join(tmp, 'v2.mjs'), bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error', plugins: [uiParamsStub] });
  const P = await import(pathToFileURL(join(tmp, 'pin.mjs')).href);
  const V = await import(pathToFileURL(join(tmp, 'v2.mjs')).href);

  const cmp = (name, fa, fb) => {
    let ra;
    let rb;
    try { ra = String(JSON.stringify(fa())); } catch (e) { ra = `THROW:${e.message}`; }
    try { rb = String(JSON.stringify(fb())); } catch (e) { rb = `THROW:${e.message}`; }
    results.push({ name, status: ra === rb ? 'OK' : 'ROZNICA', detail: ra === rb ? ra.slice(0, 80) : `pin=${ra} v2=${rb}` });
  };

  // Stałe i enum (wartości, nie tylko kształt).
  cmp('TerenBazowy (enum)', () => P.TerenBazowy, () => V.TerenBazowy);
  cmp('ENTITY_CARD_BUILDING_STYLE_ID', () => P.ENTITY_CARD_BUILDING_STYLE_ID, () => V.ENTITY_CARD_BUILDING_STYLE_ID);
  cmp('TEREN_COL', () => P.TEREN_COL, () => V.TEREN_COL);
  cmp('TEREN_LETTER', () => P.TEREN_LETTER, () => V.TEREN_LETTER);

  // Geometria i etykiety.
  for (let q = -4; q <= 4; q++)
    for (let r = -4; r <= 4; r++)
      cmp(`hexDist(0,0,${q},${r})`, () => P.hexDist(0, 0, q, r), () => V.hexDist(0, 0, q, r));
  for (const [a, b, c, d] of [[1, 2, 5, -3], [7, -2, -4, 9], [0, 0, 0, 0], [-6, 3, 2, 3]])
    cmp(`hexDist(${a},${b},${c},${d})`, () => P.hexDist(a, b, c, d), () => V.hexDist(a, b, c, d));
  for (let R = -1; R <= 14; R++) cmp(`rangeName(${R})`, () => P.rangeName(R), () => V.rangeName(R));
  for (let R = 0; R <= 12; R++)
    for (let rings = 0; rings <= 6; rings++)
      cmp(`ringsTiles(${R},${rings})`, () => P.ringsTiles(R, rings), () => V.ringsTiles(R, rings));
  for (const [k, v, s] of [
    ['Miasto', '12', 'pop'],
    ['', '', ''],
    ['<x>', '&amp;', 'a"b'],
    ['Żywność', '3.5', 'na turę'],
  ])
    cmp(`okStat(${k},${v},${s})`, () => P.okStat(k, v, s), () => V.okStat(k, v, s));

  // okolicaPreviewRadius: DTO pozycji miasta (q, r), Rwork, worked, reczne, tryb (K05A-Z2).
  const cities = [{ q: 0, r: 0 }, { q: 2, r: -1 }, { q: -3, r: 4 }];
  const rworks = [undefined, 0, 1, 2, 3, 5, 8];
  const workeds = [undefined, [], [{ q: 1, r: 0 }], [{ q: 4, r: -2 }, { q: -6, r: 1 }]];
  const recznes = [undefined, {}, { '1,0': 2 }, { '3,-3': 0, 'x,1': 4, '2,2': -1 }, { '5,5': 1 }, { '7,x': 3, '1,1': 1 }];
  const trybs = ['auto', 'reczny', 'x'];
  for (const c of cities)
    for (const Rw of rworks)
      for (const w of workeds)
        for (const rc of recznes)
          for (const t of trybs)
            cmp(
              `okolicaPreviewRadius(${c.q},${c.r};${Rw};${w ? w.length : 'u'};${rc ? Object.keys(rc).length : 'u'};${t})`,
              () => P.okolicaPreviewRadius(c, Rw, w, rc, t),
              () => V.okolicaPreviewRadius(c, Rw, w, rc, t),
            );

  // K05A r3 (batch 1): pure + wejścia reguł z fixture, po wariantach v=0..3.
  for (const lok of ['stolica', 'region', undefined, 'x'])
    for (const cap of [true, false, undefined])
      cmp(`buildingLocationRequirementMet(${lok};${cap})`, () => P.buildingLocationRequirementMet(lok, cap), () => V.buildingLocationRequirementMet(lok, cap));
  const cities3 = [{ id: 1, ownerId: 0 }, { id: 2, ownerId: 2 }, { id: 3, ownerId: 3 }, { id: 4, ownerId: 5 }];
  const items3 = [{ id: 'a', koszt: 0, kind: 'unit' }, { id: 'b', koszt: 7, kind: 'unit' }];
  const units3 = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'zz' }];
  const stocks3 = [{}, { drewno: 3 }, { kamien: 0, zloto: 2 }, { drewno: 1, kamien: 9 }, { ruda: 1 }];
  const unlocked3 = [new Set(), new Set(['a']), new Set(['a', 'b', 'x'])];
  for (let v = 0; v <= 3; v++) {
    const fix = mkFix(v);
    globalThis.__K05A_FIX = fix;
    V.setK05aCfg(fix.cfg);
    V.setK05aRules({ ...fix.rules, ...fix.rulesExt });
    const tag = `v${v}`;
    for (const c of cities3) {
      for (const t of ['a', 'bb', '']) cmp(`recruitManpowerCost(${c.id},${t};${tag})`, () => P.recruitManpowerCost(c, t), () => V.recruitManpowerCost(c, t));
      cmp(`empireRekruciTotal(${c.id};${tag})`, () => P.empireRekruciTotal(c), () => V.empireRekruciTotal(c));
      for (const mp of [-1, 0, 3, 10]) {
        cmp(`empireRekruciAffordable(${c.id},${mp};${tag})`, () => P.empireRekruciAffordable(c, mp), () => V.empireRekruciAffordable(c, mp));
        for (const av of [undefined, null, -5, 0, 5, 100])
          cmp(`empireRekruciAffordable(${c.id},${mp},${av};${tag})`, () => P.empireRekruciAffordable(c, mp, av), () => V.empireRekruciAffordable(c, mp, av));
      }
      for (const it of items3)
        for (const sk of [undefined, 0, 50])
          for (const mp of [0, 4])
            for (const st of stocks3)
              cmp(`maxAffordableRecruitQuantity(${c.id},${it.id},${sk},${mp},${Object.keys(st).length};${tag})`,
                () => P.maxAffordableRecruitQuantity(c, it, mp, sk, st),
                () => V.maxAffordableRecruitQuantity(c, it, mp, sk, st));
      for (const u of units3) cmp(`unitStockCostChipsHtml(${u.id},${c.id};${tag})`, () => P.unitStockCostChipsHtml(u, c), () => V.unitStockCostChipsHtml(u, c));
    }
    for (const u of units3) cmp(`unitResourceUpkeepChipsHtml(${u.id};${tag})`, () => P.unitResourceUpkeepChipsHtml(u), () => V.unitResourceUpkeepChipsHtml(u));
    for (const tech of ['x', 'y', 'z'])
      for (const un of unlocked3) cmp(`missingTechSteps(${tech},${un.size};${tag})`, () => P.missingTechSteps({}, tech, un), () => V.missingTechSteps({}, tech, un));

    // K05A r3 (batch 2): kopie z pinu; ctx/def/item to zwykłe obiekty (typy usuwane przy kompilacji).
    const defs2 = [{ id: 'd1', techUnlock: 'x', lokalizacja: undefined }, { id: 'up', upgradeFrom: 'base' }, { id: 'd3', techUnlock: '-', lokalizacja: 'stolica' }, { id: 'nope' }];
    const ctx2 = (c) => ({ epoch: 1 + v, builtBuildingIds: ['b1'], empireResourceStock: { drewno: 3 }, cityHasCoastOrRiver: v % 2 === 0, isCapital: c.id % 2 === 0 });
    const data2 = { econParams: { x: v } };
    for (const c of cities3) {
      for (const d of defs2)
        for (const techs of [[], ['x'], ['a', 'b', 'x']]) {
          cmp(`buildingCanBuildNow(${d.id},${c.id},${techs.length};${tag})`, () => P.buildingCanBuildNow(d, c, data2, ctx2(c), techs), () => V.buildingCanBuildNow(d, c, data2, ctx2(c), techs));
          cmp(`buildingConverterProductionDisplay(${d.id},${c.id};${tag})`, () => P.buildingConverterProductionDisplay(d, c, data2), () => V.buildingConverterProductionDisplay(d, c, data2));
        }
      const items2 = [{ id: 'd1', koszt: 1, kind: 'budynek' }, { id: 'nope', koszt: 2, kind: 'budynek' }, { id: 'd3', koszt: 3, kind: 'budynek' }];
      for (const techs of [[], ['x']])
        cmp(`sortProductionItemsByBuildability(${c.id},${techs.length};${tag})`, () => P.sortProductionItemsByBuildability(items2, c, data2, ctx2(c), techs), () => V.sortProductionItemsByBuildability(items2, c, data2, ctx2(c), techs));
      cmp(`productionCtxForCity(${c.id};${tag})`, () => P.productionCtxForCity(c), () => V.productionCtxForCity(c));
    }
    const entries = [
      { id: 'b1', status: 'locked', missingTech: 'x', wymagania: 'W1' },
      { id: 'b2', status: 'ready' }, { id: 'b3', status: 'built' }, { id: 'b4', status: 'queued' },
      { id: 'b5', status: 'locked', locationBlocked: 'stolica' }, { id: 'b6', status: 'locked', locationBlocked: 'region' },
      { id: 'b7', status: 'locked', missingTech: 'y', wymagania: '' }, { id: 'b8', status: 'locked', missingTech: 'z', wymagania: 'W8' },
    ];
    for (const e of entries)
      for (const un of unlocked3) cmp(`formatBuildingCatalogLockHint(${e.id},${un.size};${tag})`, () => P.formatBuildingCatalogLockHint(e, {}, [...un]), () => V.formatBuildingCatalogLockHint(e, {}, [...un]));
    for (const d of defs2)
      for (const un of unlocked3) cmp(`formatBuildingPreviewHint(${d.id},${un.size};${tag})`, () => P.formatBuildingPreviewHint(d, {}, [...un]), () => V.formatBuildingPreviewHint(d, {}, [...un]));
    const prodCtx = { epoch: 1 + v, builtBuildingIds: ['b2'], productionQueue: [{ id: 'b5', koszt: 1, kind: 'budynek' }, { id: 'b1', koszt: 1, kind: 'unit' }], buildingLevel: 1, civBonusy: [] };
    for (const techs of [[], ['x']])
      for (const full of [true, false])
        cmp(`collectEraPreviewEntries(${techs.length},${full};${tag})`, () => P.collectEraPreviewEntries({}, techs, prodCtx, full), () => V.collectEraPreviewEntries({}, techs, prodCtx, full));
    // K05A r3 (batch 3): recruitUnit (log wywołań cfg/rerender w wyniku) i improvementsInCityRange (Map → wpisy).
    const items3r = [{ id: 'a', koszt: 5, kind: 'unit' }, { id: 'zz', koszt: 1, kind: 'unit' }, { id: 'b', koszt: 200, kind: 'unit' }];
    for (const c of cities3)
      for (const it of items3r)
        for (const qty of [undefined, 1, 3, 0, Number.NaN])
          cmp(`recruitUnit(${c.id},${it.id},${qty};${tag})`,
            () => { globalThis.__K05A_LOG = []; const r = P.recruitUnit(c, it, qty); return [r, globalThis.__K05A_LOG]; },
            () => { globalThis.__K05A_LOG = []; const r = V.recruitUnit(c, it, qty); return [r, globalThis.__K05A_LOG]; });
    const hexes3 = { '0,0': { keys: ['mine'] }, '1,0': { keys: ['road', 'farm'] }, '-1,1': { keys: [] }, '2,-2': { keys: ['road'] }, '1,-1': {} };
    for (const city of [{ id: 1, ownerId: 0, q: 0, r: 0 }, { id: 2, ownerId: 2, q: 1, r: -1 }])
      for (const Rw of [undefined, 0, 1, 2])
        for (const mp of [undefined, { hexes: hexes3 }, { hexes: {} }])
          cmp(`improvementsInCityRange(${city.id},${Rw},${mp ? Object.keys(mp.hexes).length : 'u'};${tag})`,
            () => [...P.improvementsInCityRange(city, mp, Rw).entries()],
            () => [...V.improvementsInCityRange(city, mp, Rw).entries()]);
    // Adapter buildingRequirementChips: kontrakt (wynik = wejście reguł z DTO); równoważność z pinem = silnik (NIE_ZMIERZONO).
    for (const d of defs2)
      for (const c of cities3)
        cmp(`buildingRequirementChips-adapter(${d.id},${c.id};${tag})`, () => fix.rulesExt.buildingRequirementChips(d, c, data2, ctx2(c), ['x']), () => V.buildingRequirementChips(d, c, data2, ctx2(c), ['x']));
  }
} catch (e) {
  console.error(`harness: ${e.message}`);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (exitCode === 0) {
  const diffs = results.filter((x) => x.status !== 'OK');
  for (const x of results) if (x.status !== 'OK') console.log(`${x.status} ${x.name}: ${x.detail}`);
  console.log(`run-k05a-units: porownan=${results.length} roznic=${diffs.length} v2=${V2_FILE.split('/').slice(-3).join('/')}`);
  exitCode = diffs.length === 0 ? 0 : 1;
}
process.exit(exitCode);
