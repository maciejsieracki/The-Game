#!/usr/bin/env node
/**
 * run-k06a-units.mjs — harness porównania wartości/tekstu: jednostki K06A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1,
 * runda 1) — port (`src/ui/cityPanel/k06a-fundament.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`).
 *
 * Jednostki pinu wyciągane PO NAZWIE (od `function NAME`/`const NAME` w kolumnie 0 do końca bloku). Zależności
 * zewnętrzne (cfg, cityPanelChipIconWrap, tileYield, axialToWorld, formatCityMapLabel, CITY_TABS, activeDrawerTab,
 * cityTabIconHtml, switchCity, improvementKeysForHex, terrainImprovementsData, Nakladka) są po obu stronach tym samym
 * fixture (`globalThis.__K06_FIX`). Harness testuje KOPIĘ TREŚCI jednostek i delegatory, NIE prawdziwe `tileYield`
 * ani `improvementKeysForHex` (te są regułami silnika; NIE_ZMIERZONO w tym harnessie).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k06a-units.mjs --pin-dir <PIN_DIR> [--v2 <plik-portu>]
 *   <PIN_DIR> = katalog poza repo z `git archive edb8fb56 gra/src gra/data`.
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
  console.error('Użycie: node tools/dom-harness/run-k06a-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2 <plik>]');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k06a-fundament.ts'));
const PIN_ROOT = resolve(PIN_DIR);
const PIN_FILE = join(PIN_ROOT, 'gra/src/ui/cityPanel.ts');
const PIN_UI_PARAMS = JSON.parse(readFileSync(join(PIN_ROOT, 'gra/data/ui-params.json'), 'utf8'));
const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');

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

/** Jednostki K06A (nazwy z `select-k06a.mjs`, 16 nie-DOM). */
const UNIT_NAMES = [
  'okolicaHexPoints', 'okolicaTileHasWorkerAt', 'fireOkolicaTileToggle', 'formatTileYieldShort',
  'tileYieldLabel', 'IMPROVEMENT_KEY_TO_NAME', 'headerOrderBadge', 'drawerTabButtons',
  'ownerCities', 'ownerCitiesForNav', 'cityPanelTitle', 'navigateCityPanel',
];

/** Stan modułu pinu (ui/cityPanel.ts:10159-10163; `rootEl` pominięty — DOM). */
const pinState = pinLines.slice(10158, 10163).join('\n');

/** Prelude pinu: zależności zewnętrzne czytane z fixture (ten sam fixture co strona portu). */
const PIN_PRELUDE = `
const cfg = new Proxy({}, { get: (_t, k) => globalThis.__K06_FIX.cfg[k] });
const F = () => globalThis.__K06_FIX.deps;
const cityPanelChipIconWrap = (n, px) => F().cityPanelChipIconWrap(n, px);
const tileYield = (t) => F().tileYield(t);
const formatCityMapLabel = (c) => F().formatCityMapLabel(c);
const axialToWorld = (q, r, R) => F().axialToWorld(q, r, R);
const HEX_R = 1.0;
const CITY_TABS = { get map() { const t = F().cityTabs(); return t.map.bind(t); } };
let activeDrawerTab = 'plony';
const cityTabIconHtml = (id) => F().cityTabIconHtml(id);
const switchCity = (dir) => F().switchCity(dir);
const improvementKeysForHex = (h) => (h && h.keys ? h.keys : []);
const terrainImprovementsData = globalThis.__K06_FIX.rows;
const Nakladka = { Brak: 'brak' };
export const __setDrawerTab = (t) => { activeDrawerTab = t; };
export const __state = () => ({ activeCity, activeMap, activeOnClose, pinnedGarrisonCityId });
export const __setActive = (c, m, f) => { activeCity = c; activeMap = m; activeOnClose = f; };
export const __setPinned = (id) => { pinnedGarrisonCityId = id; };
`;

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

/** Fixture: miasta (dwóch właścicieli, duplikaty pozycji, nazwy do sortowania), tryby, stany porządku. */
function makeFixture(v) {
  const cities = [
    { id: 'c1', ownerId: 1, q: 0, r: 0, name: 'Zeta', population: 3 },
    { id: 'c2', ownerId: 1, q: 2, r: -1, name: 'Alfa', population: 5 },
    { id: 'c3', ownerId: 1, q: 1, r: 1, name: 'Abel', population: 1 },
    { id: 'c4', ownerId: 1, q: 2, r: -1, name: 'Ąlfa', population: 2 },
    { id: 'c5', ownerId: 2, q: 5, r: 0, name: 'Gamma', population: 4 },
  ];
  const log = [];
  return {
    log,
    rows: {
      _meta: { nazwa: 'pomijany' },
      mina: { nazwa: 'Kopalnia' },
      farma: { nazwa: '' },
      tartak: { nazwa: 'Tartak' },
      bez: { nazwa: 7 },
      nul: null,
    },
    cfg: {
      getCities: () => (v % 3 === 0 ? undefined : v % 3 === 1 ? cities : [cities[0]]),
      getOrderState: (id) => {
        if (v % 4 === 0) return undefined;
        if (v % 4 === 1) return { szPct: null, porPct: 50 };
        const por = { c1: 55, c2: 45.5, c3: 20, c4: undefined, c5: 70 }[id];
        return { szPct: 10, porPct: por === undefined ? null : por, revoltWarning: id === 'c1' };
      },
      onOkolicaTileAdjust: v === 2 ? undefined : (c, q, r, d) => log.push(['adj', c, q, r, d]),
    },
    deps: {
      cityPanelChipIconWrap: (n, px) => `<i ${n} ${px}>`,
      tileYield: (t) => ({
        zywnosc: t.terenBazowy.length - 3 + (t.maRzeke ? 1 : 0) + (t.ulepszeniaKeys ? t.ulepszeniaKeys.length : 100) - 1 + v,
        praca: (t.nakladka === 'las' ? 2 : 0) + (t.ulepszenieKey ? t.ulepszenieKey.length * 10 : 0),
        handel: t.zloze ? -1 : 0,
      }),
      formatCityMapLabel: (c) => `${c.name}#${c.ownerId}`,
      // Stub reaguje na wartość R (dla R != 1 odwraca oś X): mutant HEX_R wychodzi na jaw w sortowaniu.
      axialToWorld: (q, r, R) => ({ x: (q + 0.5 * r) * (R === 1 ? 1 : -1), z: R * r }),
      cityTabs: () => (v % 2 ? [{ id: 'plony', short: 'P' }, { id: 'budynki', short: 'B' }] : [{ id: 'budynki', short: 'B' }]),
      cityTabIconHtml: (id) => `<ic ${id}>`,
      switchCity: (dir) => log.push(['switch', dir]),
      activeDrawerTab: () => (v % 2 ? 'budynki' : 'plony'),
    },
    cities,
  };
}

/** Wejścia do porównań; każda pozycja: [nazwa, [argumenty]] albo funkcja budująca argumenty z fixture. */
function buildCases(fix) {
  const [c1, c2, c3, c4, c5] = fix.cities;
  const tiles = [
    { zywnosc: 0, praca: 0, handel: 0 }, { zywnosc: 1, praca: -2, handel: 0 },
    { zywnosc: 0, praca: 0, handel: 3 }, { zywnosc: NaN, praca: Infinity, handel: -Infinity },
    { zywnosc: -4, praca: 5, handel: 6 },
  ];
  const hexes = [
    { terenBazowy: 'laka', nakladka: 'las', rzeka: { obecna: true }, keys: ['mina', 'farma'] },
    { terenBazowy: 'morze' },
    { terenBazowy: 'pustynia', zloze: 'zloto', keys: [] },
    { terenBazowy: 'wzgorza', rzeka: { obecna: false }, keys: ['tartak'] },
  ];
  const cases = [];
  for (const [cx, cy, s] of [[0, 0, 1], [1.5, -2.25, 0.5], [10, 20, Infinity], [NaN, 0, 1], [0, 0, 0], [-3, 4, -7]]) {
    cases.push(['okolicaHexPoints', [cx, cy, s]]);
  }
  for (const tryb of ['auto', 'reczny']) {
    for (const reczne of [undefined, { '1,0': 2 }, { '1,0': 0 }]) {
      for (const workedSet of [undefined, null, new Set(['1,0']), new Set()]) {
        for (const dist of [undefined, 0, 1, 2]) {
          for (const [q, r] of [[1, 0], [0, 0], [2, -1]]) {
            cases.push(['okolicaTileHasWorkerAt', [c1, q, r, tryb, reczne, workedSet, dist]]);
          }
        }
      }
    }
  }
  for (const [q, r] of [[1, 0], [0, 0], [2, -1]]) cases.push(['fireOkolicaTileToggle', [c1, q, r]]);
  for (const t of tiles) cases.push(['formatTileYieldShort', [t]]);
  for (const h of hexes) cases.push(['tileYieldLabel', [h]]);
  cases.push(['IMPROVEMENT_KEY_TO_NAME', []]);
  for (const c of [c1, c2, c3, c4, c5]) {
    cases.push(['headerOrderBadge', [c]]);
    cases.push(['ownerCities', [c]]);
    cases.push(['ownerCitiesForNav', [c]]);
    cases.push(['cityPanelTitle', [c]]);
  }
  cases.push(['drawerTabButtons', []]);
  cases.push(['navigateCityPanel', [1]], ['navigateCityPanel', [-1]]);
  return cases;
}

/** Wartość porównywalna: JSON z jawnym zapisem liczb niesk. i Map/Set/funkcji. */
function canon(x) {
  return JSON.stringify(x, (_k, v) => {
    if (typeof v === 'number' && !Number.isFinite(v)) return `#${String(v)}`;
    if (v instanceof Set) return { set: [...v] };
    if (v instanceof Map) return { map: [...v.entries()] };
    if (typeof v === 'function') return '#fn';
    return v;
  });
}

const tmp = mkdtempSync(join(tmpdir(), 'p58k06a-harness-'));
let exitCode = 0;
let comparisons = 0;
let diffs = 0;
const report = [];

try {
  const pinSrc = [
    `export const UI_PARAMS = ${JSON.stringify(PIN_UI_PARAMS)};`,
    PIN_PRELUDE,
    pinState,
    ...UNIT_NAMES.map(extractTop),
    '',
  ].join('\n');
  const probe = join(tmp, 'pin-probe.ts');
  writeFileSync(probe, pinSrc);

  const v2Bundle = join(tmp, 'v2.mjs');
  const pinBundle = join(tmp, 'pin.mjs');
  await esbuild.build({ entryPoints: [probe], outfile: pinBundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });
  // Wejście portu: K06A + akcesor reguł K05A (`setK05aRules`, używany przez `improvementKeysForHex`).
  const v2Entry = join(tmp, 'v2-entry.ts');
  writeFileSync(
    v2Entry,
    `export * from ${JSON.stringify(V2_FILE)};\nexport { setK05aRules } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k05a-fundament.ts'))};\n`,
  );
  await esbuild.build({ entryPoints: [v2Entry], outfile: v2Bundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error', plugins: [uiParamsStub] });

  // Fixture przed importem (pin oblicza IMPROVEMENT_KEY_TO_NAME przy ładowaniu modułu).
  globalThis.__K06_FIX = makeFixture(0);
  const P = await import(pathToFileURL(pinBundle).href);
  const V = await import(pathToFileURL(v2Bundle).href);

  const cases = buildCases(makeFixture(0));
  for (let v = 0; v < 4; v++) {
    const fix = makeFixture(v);
    globalThis.__K06_FIX = fix;
    P.__setDrawerTab(fix.deps.activeDrawerTab());
    // Port: wejścia przez te same funkcje (czytają bieżący fixture). `improvementKeysForHex` pochodzi z K05A
    // (delegator do `regul()`), więc wpis reguł K05A dostaje ten sam stub co pin (`PIN_PRELUDE`).
    V.setK06aCfg(new Proxy({}, { get: (_t, k) => globalThis.__K06_FIX.cfg[k] }));
    V.setK06aDeps(new Proxy({}, { get: (_t, k) => globalThis.__K06_FIX.deps[k] }));
    V.setK05aRules({ improvementKeysForHex: (h) => (h && h.keys ? h.keys : []) });

    for (const [name, a] of cases) {
      const pinFn = P[name];
      const v2Fn = V[name];
      comparisons++;
      let pinOut;
      let v2Out;
      if (name === 'IMPROVEMENT_KEY_TO_NAME') {
        pinOut = P.IMPROVEMENT_KEY_TO_NAME;
        v2Out = V.buildImprovementKeyToName(fix.rows);
      } else if (name === 'headerOrderBadge' || name === 'ownerCities' || name === 'ownerCitiesForNav' || name === 'cityPanelTitle') {
        pinOut = pinFn(a[0]);
        v2Out = v2Fn(a[0]);
      } else if (name === 'drawerTabButtons') {
        pinOut = pinFn();
        v2Out = v2Fn();
      } else if (name === 'fireOkolicaTileToggle' || name === 'navigateCityPanel') {
        fix.log.length = 0;
        pinFn(...a);
        pinOut = [...fix.log];
        fix.log.length = 0;
        v2Fn(...a);
        v2Out = [...fix.log];
      } else {
        pinOut = pinFn(...a);
        v2Out = v2Fn(...a);
      }
      const pc = canon(pinOut);
      const vc = canon(v2Out);
      if (pc !== vc) {
        diffs++;
        report.push({ v, name, args: canon(a.map((x) => (typeof x === 'object' && x !== null && !(x instanceof Set) ? x : x))), pin: pc, v2: vc });
      }
    }
  }

  // Stan modułu (K06A-Z7): ustawienie i odczyt po obu stronach.
  for (const [c, m, pinned] of [[null, null, null], [fix0().cities[0], null, 'c2'], [fix0().cities[1], { hexes: {} }, null]]) {
    comparisons++;
    P.__setActive(c, m, () => {});
    P.__setPinned(pinned);
    V.setK06aActive(c, m, () => {});
    V.setK06aPinnedGarrisonCityId(pinned);
    const ps = P.__state();
    const vs = V.getK06aState();
    const pinCmp = canon({ activeCity: ps.activeCity, activeMap: ps.activeMap, pinnedGarrisonCityId: ps.pinnedGarrisonCityId });
    const v2Cmp = canon({ activeCity: vs.activeCity, activeMap: vs.activeMap, pinnedGarrisonCityId: vs.pinnedGarrisonCityId });
    if (pinCmp !== v2Cmp) {
      diffs++;
      report.push({ name: 'state', pin: pinCmp, v2: v2Cmp });
    }
  }

  console.log(JSON.stringify({ comparisons, diffs, units: UNIT_NAMES.length, pinFile: 'gra/src/ui/cityPanel.ts (edb8fb56)' }, null, 1));
  if (report.length) console.log(JSON.stringify(report.slice(0, 20), null, 1));
  exitCode = diffs === 0 ? 0 : 1;
} catch (err) {
  console.error('BLAD HARNESSU:', err && err.stack ? err.stack : err);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);

function fix0() {
  return makeFixture(0);
}
