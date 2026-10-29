#!/usr/bin/env node
/**
 * run-k07a-units.mjs — harness porównania wartości/tekstu: jednostki K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1,
 * runda 3) — port (`src/ui/cityPanel/k07a-fundament.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`).
 *
 * Zasada: po obu stronach TE SAME zależności zewnętrzne (fixture `globalThis.__K07_FIX`: `cfg`, `ext` = adaptery K07A-Z4,
 * `chipDeltaStockHtml`) oraz te same czyste formatery v2 (importowane do sondy pinu: signed, cityPanelChipIcon,
 * resLocalOnly, resGlobalLocal, resPracaSplitBar, estimateHandelChips, cityFoodSplit, clampedGrowthBreakdown,
 * scienceOwlIconHtml, SCALES, PH, cityPanelBrandIcon, loafIconHtml). Porównanie dotyczy ciał jednostek K07A, nie
 * parytetu formaterów (ten jest w ich własnych harnessach). Parytet ADAPTERÓW z pinem (fallbacki `cfg.*`) jest
 * w `installDeps`/`installExt` (kontrakt K07A-Z2/Z4) i NIE jest mierzony tu poza tym, co wynika z fixture.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k07a-units.mjs --pin-dir <PIN_DIR> [--v2 <plik-portu>]
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
  console.error('Użycie: node tools/dom-harness/run-k07a-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2 <plik>]');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k07a-fundament.ts'));
const V2_SRC = join(V2_ROOT, 'src');
const PIN_ROOT = resolve(PIN_DIR);
const PIN_FILE = join(PIN_ROOT, 'gra/src/ui/cityPanel.ts');
const PIN_RC = join(PIN_ROOT, 'gra/src/ui/resourceColors.ts');
const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');

/** Blok najwyższego poziomu z pinu: od linii `function NAME`/`const NAME` do `}` (function) lub `;` (const). */
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

/** Jednostki pinu wykonywane po obu stronach. `isMeCity` = zależność pinu (fallback `cfg.isMe ?? ownerId===0`). */
const UNIT_NAMES = [
  'isMeCity', 'W3_STAT_RES_KEY', 'resolveActiveCity', 'w3CityChip', 'capitalBadgeOrButtonHtml',
  'skeleton', 'buildCityOnlyW3FlankChips', 'buildCityResourceStatItems',
];
/** Stan modułu pinu: `let activeCity` (:10159) i `let uxSectionRefresh` (:10365). */
const pinStateActive = pinLines.slice(10158, 10159).join('\n');
const pinStateUx = pinLines.slice(10364, 10365).join('\n');

const PIN_PRELUDE = `
import { resourceScopeClass as __pinRSC } from ${JSON.stringify(PIN_RC)};
import { UI_PARAMS as __UI } from ${JSON.stringify(join(V2_SRC, 'ui/uiParams.ts'))};
import { SCALES, PH, cityPanelBrandIcon, cityPanelChipIcon, loafIconHtml, resLocalOnly, resGlobalLocal, signed } from ${JSON.stringify(join(V2_SRC, 'ui/cityPanel/k01a-fundament.ts'))};
import { estimateHandelChips, resPracaSplitBar } from ${JSON.stringify(join(V2_SRC, 'ui/cityPanel/k01b-f.ts'))};
import { clampedGrowthBreakdown } from ${JSON.stringify(join(V2_SRC, 'ui/cityPanel/k01b-r.ts'))};
import { cityFoodSplit } from ${JSON.stringify(join(V2_SRC, 'ui/cityPanel/k03-model.ts'))};
import { scienceOwlIconHtml } from ${JSON.stringify(join(V2_SRC, 'ui/icons/scienceOwlIcon.ts'))};
const resourceScopeClass = __pinRSC;
const cfg = new Proxy({}, { get: (_t, k) => globalThis.__K07_FIX.cfg[k] });
const buildChipDeltaStockHtml = (r, s) => globalThis.__K07_FIX.chipDeltaStockHtml(r, s);
const WYZYWIENIE_MAX = 6;
let activeDrawerTab = 'plony';
let scalePx = __UI.panel_miasta.font_scale_domyslna_px;
const __x = () => globalThis.__K07_FIX.ext;
const ownerCities = (c) => __x().ownerCities(c);
const cityPanelTitle = (c) => __x().cityPanelTitle(c);
const headerOrderBadge = (c) => __x().headerOrderBadge(c);
const drawerTabButtons = () => __x().drawerTabButtons(activeDrawerTab);
const formatManpower = (n) => __x().formatManpower(n);
const daninaLabelForCity = (c) => __x().daninaLabelForCity(c);
const resolveEmpireSnap = (c, m, d) => __x().resolveEmpireSnap(c, m, d);
const cityPracaSplit = (c, v, d) => __x().cityPracaSplit(c, v, d);
const readPodzialHandlu = (c, d) => __x().readPodzialHandlu(c, d);
const civWideSixStatsFromEmpireSnap = (e, s) => __x().civWideSixStatsFromEmpireSnap(e, s);
const resolveOrderState = (c, d) => __x().resolveOrderState(c, d);
export const __setCity = (c) => { activeCity = c; };
export const __getCity = () => activeCity;
export const __setUx = (f) => { uxSectionRefresh = f; };
export const __getUx = () => uxSectionRefresh;
export const __setDrawer = (t) => { activeDrawerTab = t; };
export const __setScale = (p) => { scalePx = p; };
export const __SCALES = SCALES;
`;

/** Fixture: miasta (dwóch właścicieli, stolice, oblężenie), widok miasta i adaptery K07A-Z4 — warianty `v`. */
function makeFixture(v) {
  const cities = [
    { id: 'c1', ownerId: 0, name: 'Alfa', population: 3, oblegane: false },
    { id: 'c2', ownerId: 0, name: 'Beta', population: 5, oblegane: true },
    { id: 'c3', ownerId: 1, name: 'Gamma', population: 1, oblegane: false },
    { id: 'c4', ownerId: 1, name: 'Delta "x"', population: 2, oblegane: true },
  ];
  const capitals = [{ 0: 'c2', 1: 'c3' }, { 0: 'c1', 1: null }, { 0: 'zz', 1: 'c4' }, { 0: undefined, 1: 'c3' }][v % 4];
  const cfg = {
    isMe: v % 5 === 0 ? undefined : (o) => (o + v) % 2 === 0,
    getCapitalCityId: v % 3 === 0 ? undefined : (o) => capitals[o],
    getCities: v % 4 === 3 ? undefined : () => cities,
    onSetCapital: v % 2 === 0 ? () => {} : undefined,
    getEpoch: v % 3 === 2 ? undefined : (o) => 2 + (o % 2) + v,
    getMaxSafePoziomRacji: v % 3 === 0 ? undefined : () => (v % 2 ? 2 : 5),
    getReligionState: v % 4 === 1 ? undefined : () => ({ przyrostWiernych: v - 2, dominujaca: 'Wiara', udzialPct: 33 }),
    getManpowerSnapshot: v % 2 ? () => ({ manpowerBiezacy: 12.5 * v, manpowerMax: 100, regenPerTurn: 1.5 }) : () => undefined,
    getTreasury: v % 3 ? (o) => 50 + v + o : () => undefined,
    getOrderState: v % 4 === 2 ? () => ({ porPct: 60 }) : v % 2 ? () => ({ porPct: 61 + v }) : () => undefined,
  };
  const ext = {
    cfg,
    isMeCity: (o) => cfg.isMe?.(o) ?? (o === 0),
    ownerCities: (c) => {
      const all = cities.filter((x) => x.ownerId === c.ownerId);
      return all.length > 0 ? all : [c];
    },
    cityPanelTitle: (c) => `T[${c.name}|${c.population}|${v}]`,
    headerOrderBadge: (c) => `H[${c.id}|${c.oblegane ? 1 : 0}]`,
    drawerTabButtons: (t) => `D[${t}|${v}]`,
    formatManpower: (n) => `M${n}`,
    daninaLabelForCity: () => (v % 2 ? 'Podatek' : 'Danina'),
    resolveEmpireSnap: () => ({
      pracaPool: v % 3 ? v * 10 : undefined,
      pracaRate: v + 1,
      pracaUpkeep: v % 2 ? 2 : undefined,
      zloto: v % 4 === 3 ? undefined : 100 + v,
      nauka: 7 + v,
      naukaRate: v % 2 ? 3 : undefined,
      zywnoscReserve: 5,
      kultura: 2,
      kulturaRate: 9,
      religionStock: v % 5 ? 4 : undefined,
      stateReligion: v % 3 ? 'Katolicyzm' : null,
      religionSharePct: 12,
    }),
    cityPracaSplit: (c, view) => ({ total: (view?.praca ?? 0) + v, doBudynkow: 3 - v, doPuli: -2 + v, pctBudynki: 50, pctPuli: 50 }),
    readPodzialHandlu: () => (v % 3 === 0
      ? { procentPieniadz: 40 + v, procentNauka: 0, procentLuksus: 30 - v }
      : { procentPieniadz: 40 + v, procentNauka: 30, procentLuksus: 30 - v }),
    civWideSixStatsFromEmpireSnap: (e, s) => ({
      praca: s.praca * 2 + (e.pracaRate ?? 0),
      zywnosc: s.zywnosc - 1,
      zloto: s.zloto,
      nauka: s.nauka + 3,
      kultura: s.kultura,
      religia: v === 7 ? Infinity : s.religia,
    }),
    resolveOrderState: () => ({ state: { porPct: v % 2 ? 55 + v : 40 } }),
  };
  const view = {
    praca: v * 3 - 4, pieniadz: 10 - v, nauka: 2 * v, kultura: v % 2 ? NaN : 3,
    zywnoscNetto: v - 3, zywnoscBrutto: 8 + v, kosztRacji: 4, bilansLokalny: v, poziomRacji: v % 3,
    growthBreakdown: { total: 5 + v, racje: 1, produkcja: 6 },
  };
  return {
    cfg,
    ext,
    chipDeltaStockHtml: (r, s) => `<d ${String(r)}|${String(s)}|v${v}>`,
    cities,
    view,
  };
}

/** Wartość porównywalna: JSON z jawnym zapisem liczb niesk., undefined i funkcji. */
function canon(x) {
  return JSON.stringify(x, (_k, val) => {
    if (typeof val === 'number' && !Number.isFinite(val)) return `#${String(val)}`;
    if (val === undefined) return '#undef';
    if (typeof val === 'function') return '#fn';
    return val;
  });
}

/** Wtyczka esbuild: importy `*.svg?raw` (ikony v2) jako tekst — tak jak w buildzie Vite. */
const rawPlugin = {
  name: 'raw-text',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw-text' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-text' }, (a) => ({ contents: readFileSync(a.path, 'utf8'), loader: 'text' }));
  },
};

/**
 * Atrapa `icons/brandAssets` (ikony SVG): zawiera `import.meta.glob` (konstrukcja Vite). Atrapa jest IDENTYCZNA po obu
 * stronach (ten sam moduł w obu paczkach), więc nie wpływa na porównanie ciał jednostek K07A; treść ikon = NIE_ZMIERZONO.
 */
const brandStub = {
  name: 'brand-stub',
  setup(b) {
    b.onResolve({ filter: /icons\/brandAssets$/ }, (a) => ({ path: a.path, namespace: 'bstub' }));
    b.onLoad({ filter: /.*/, namespace: 'bstub' }, () => ({
      contents: [
        `export function brandIconSvg(id, size) { return '<svg data-brand="' + id + '" data-size="' + size + '"></svg>'; }`,
        `export function mapResourceIconSvg(key, size) { return '<svg data-map="' + key + '" data-size="' + size + '"></svg>'; }`,
        `export function buildingIconSvg(def, id) { return '<svg data-building="' + id + '"></svg>'; }`,
        `export function unitIconSvg(u, id) { return '<svg data-unit="' + id + '"></svg>'; }`,
        '',
      ].join('\n'),
      loader: 'js',
    }));
  },
};

const tmp = mkdtempSync(join(tmpdir(), 'p58k07a-harness-'));
let exitCode = 0;
let comparisons = 0;
let diffs = 0;
const report = [];
const perUnit = {};
/** Wywołanie strony portu: wyjątek = wartość `{threw}` (porównywalna z pinem; nie kończy harnessu EXIT 2). */
const tv = (f) => {
  try {
    return f();
  } catch (e) {
    return { threw: String(e && e.message) };
  }
};
const cmp = (unit, pinOut, v2Out) => {
  comparisons++;
  perUnit[unit] = (perUnit[unit] ?? 0) + 1;
  const pc = canon(pinOut);
  const vc = canon(v2Out);
  if (pc !== vc) {
    diffs++;
    report.push({ unit, pin: pc, v2: vc });
  }
};

try {
  // Katalog statyczny v2 (ZAŁOŻENIE P5.2-Z1) instalowany PIERWSZYM modułem, zanim załadują się moduły z `staticCatalog()`.
  const setup = join(tmp, 'setup.ts');
  writeFileSync(
    setup,
    [
      `import { installStaticCatalog } from ${JSON.stringify(join(V2_SRC, 'controller/staticCatalog.ts'))};`,
      `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(V2_SRC, 'controller/mockCatalog.ts'))};`,
      'installStaticCatalog(MOCK_STATIC_CATALOG);',
      '',
    ].join('\n'),
  );
  const pinSrc = [
    `import ${JSON.stringify(setup)};`,
    PIN_PRELUDE,
    pinStateActive,
    pinStateUx,
    ...UNIT_NAMES.map(extractTop),
    '',
  ].join('\n');
  const probe = join(tmp, 'pin-probe.ts');
  writeFileSync(probe, pinSrc);
  const pinBundle = join(tmp, 'pin.mjs');
  await esbuild.build({ entryPoints: [probe], outfile: pinBundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error', plugins: [rawPlugin, brandStub] });
  const v2Entry = join(tmp, 'v2-entry.ts');
  writeFileSync(v2Entry, `import ${JSON.stringify(setup)};\nexport * from ${JSON.stringify(V2_FILE)};\n`);
  const v2Bundle = join(tmp, 'v2.mjs');
  await esbuild.build({ entryPoints: [v2Entry], outfile: v2Bundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error', plugins: [rawPlugin, brandStub] });

  globalThis.__K07_FIX = makeFixture(0);
  const P = await import(pathToFileURL(pinBundle).href);
  const V = await import(pathToFileURL(v2Bundle).href);
  const G = () => globalThis.__K07_FIX;
  /** Adapter testowy zależności portu (kontrakt K07A-Z2): fallbacki pinu przeniesione do adaptera. */
  const installDeps = () => V.setK07aDeps({
    isMe: (o) => G().cfg.isMe?.(o) ?? (o === 0),
    getCapitalCityId: (o) => G().cfg.getCapitalCityId?.(o) ?? null,
    getCities: () => G().cfg.getCities?.() ?? [],
    canSetCapital: !!G().cfg.onSetCapital,
    chipDeltaStockHtml: (r, s) => G().chipDeltaStockHtml(r, s),
  });
  /** Adaptery K07A-Z4: ten sam obiekt fixture co u pinu (`cfg` i `ext`). */
  const installExt = () => V.setK07aExt(G().ext);

  const fnA = () => {};
  const fnB = () => {};
  const copy = (c) => (c === null ? null : { ...c });
  const STATES = [
    null,
    { id: 'c1', ownerId: 0, name: 'STALE', population: 99 },
    { id: 'c3', ownerId: 1, name: 'STALE', population: 0 },
    { id: 'zz', ownerId: 0, name: 'Nieistniejące', population: 7 },
  ];
  const STAT_IDS = ['praca', 'zywnosc', 'zloto', 'nauka', 'kultura', 'religia', 'brak', 'constructor', '__proto__', 'toString'];
  const CIV_RATES = [undefined, 0, 3, -2, Infinity, NaN];
  const CIV_STOCKS = [undefined, 12, NaN, -Infinity];
  const HINTS = ['Tempo "x" & <y>', 'zwykły'];
  const TABS = ['plony', 'produkcja', 'miasto', 'okolica'];
  const PX = [...P.__SCALES.map((s) => s.px), 99];
  const DATAS = [null, { marker: 1 }];

  for (let v = 0; v < 8; v++) {
    const fix = makeFixture(v);
    globalThis.__K07_FIX = fix;
    installDeps();
    installExt();

    // Stan modułu uxSectionRefresh (K07A-Z3): rejestracja, nadpisanie, wyrejestrowanie.
    for (const f of [fnA, fnB, null]) {
      P.__setUx(f);
      V.setK07aUxSectionRefresh(f);
      const pinS = { isNull: P.__getUx() === null, isA: P.__getUx() === fnA, isB: P.__getUx() === fnB };
      const v2S = { isNull: V.getK07aUxSectionRefresh() === null, isA: V.getK07aUxSectionRefresh() === fnA, isB: V.getK07aUxSectionRefresh() === fnB };
      cmp('uxSectionRefresh', pinS, v2S);
    }

    // W3_STAT_RES_KEY: cała mapa i odczyty kluczy (w tym klucze z prototypu — zachowanie `Record`).
    cmp('W3_STAT_RES_KEY', P.W3_STAT_RES_KEY, V.W3_STAT_RES_KEY_K07);
    for (const k of STAT_IDS) cmp('W3_STAT_RES_KEY', P.W3_STAT_RES_KEY[k], V.W3_STAT_RES_KEY_K07[k]);

    // resolveActiveCity: odświeżenie z listy miast; brak miasta w liście = zachowany stan.
    for (const st of STATES) {
      P.__setCity(copy(st));
      V.setK07aActiveCity(copy(st));
      const pinRet = P.resolveActiveCity();
      const v2Ret = V.resolveK07aActiveCity();
      cmp('resolveActiveCity', { ret: pinRet, after: P.__getCity() }, { ret: v2Ret, after: V.getK07aActiveCity() });
    }
    // resolveActiveCity bez zależności (deps = null) = pin bez `cfg.getCities` (brak odświeżenia).
    {
      const stale = { id: 'c1', ownerId: 0, name: 'STALE', population: 99 };
      const savedGet = fix.cfg.getCities;
      fix.cfg.getCities = undefined;
      P.__setCity(copy(stale));
      const pinRet = P.resolveActiveCity();
      fix.cfg.getCities = savedGet;
      V.setK07aDeps(null);
      V.setK07aActiveCity(copy(stale));
      const v2Ret = V.resolveK07aActiveCity();
      cmp('resolveActiveCity', { ret: pinRet, after: P.__getCity() }, { ret: v2Ret, after: V.getK07aActiveCity() });
      installDeps();
    }

    // w3CityChip: wszystkie identyfikatory statystyk × tempo × zapas × podpowiedź (Infinity/NaN/undefined).
    for (const sid of STAT_IDS) {
      for (const cr of CIV_RATES) {
        for (const cs of CIV_STOCKS) {
          for (const hint of HINTS) {
            cmp(
              'w3CityChip',
              P.w3CityChip('<i>', 'Lbl', '12', 'pos', sid, hint, cr, cs),
              tv(() => V.w3CityChipK07('<i>', 'Lbl', '12', 'pos', sid, hint, cr, cs)),
            );
          }
        }
      }
    }
    // w3CityChip bez setK07aDeps: port MUSI rzucić (K07A-Z2, r3); pin zawsze dokleja tempo/zapas.
    {
      V.setK07aDeps(null);
      let threw = false;
      try {
        V.w3CityChipK07('<i>', 'Lbl', '12', 'pos', 'praca', 'h', 1, 2);
      } catch {
        threw = true;
      }
      cmp('w3CityChip', { threw: true }, { threw });
      installDeps();
    }

    // capitalBadgeOrButtonHtml: każde miasto z fixture + miasta spoza listy stolic (właściciel 2, duplikat id).
    const extras = [
      { id: 'c9', ownerId: 2, name: 'Omega', population: 1 },
      { id: 'c3', ownerId: 1, name: 'Gamma-dup', population: 1, oblegane: true },
    ];
    for (const city of [...fix.cities, ...extras]) {
      cmp('capitalBadgeOrButtonHtml', P.capitalBadgeOrButtonHtml(city), tv(() => V.capitalBadgeOrButtonHtmlK07(city)));
    }

    // skeleton (K07 DOM-free szkielet panelu): każde miasto × zakładka × skala × widok (null/obiekt).
    for (const city of [...fix.cities, ...extras]) {
      for (const tab of TABS) {
        for (const px of PX) {
          for (const view of [null, fix.view]) {
            P.__setDrawer(tab);
            P.__setScale(px);
            V.setK07aDrawerTab(tab);
            V.setK07aScalePx(px);
            cmp('skeleton', P.skeleton(copy(city), view), tv(() => V.skeleton(copy(city), view)));
          }
        }
      }
    }

    // buildCityOnlyW3FlankChips: miasto × widok × dane (null/obiekt) — mapa zawsze null (wejście z pinu).
    for (const city of [...fix.cities, ...extras]) {
      for (const data of DATAS) {
        cmp('buildCityOnlyW3FlankChips', P.buildCityOnlyW3FlankChips(copy(city), fix.view, data, null), tv(() => V.buildCityOnlyW3FlankChips(copy(city), fix.view, data, null)));
      }
    }

    // buildCityResourceStatItems: miasto × widok (null/obiekt) × w3 × dane.
    for (const city of [...fix.cities, ...extras]) {
      for (const view of [null, fix.view]) {
        for (const w3 of [false, true]) {
          for (const data of DATAS) {
            cmp('buildCityResourceStatItems', P.buildCityResourceStatItems(copy(city), view, null, data, w3), tv(() => V.buildCityResourceStatItems(copy(city), view, null, data, w3)));
          }
        }
      }
    }
  }

  console.log(JSON.stringify({ comparisons, diffs, perUnit, pinFile: 'gra/src/ui/cityPanel.ts (edb8fb56)' }, null, 1));
  if (report.length) console.log(JSON.stringify(report.slice(0, 20), null, 1));
  exitCode = diffs === 0 ? 0 : 1;
} catch (err) {
  console.error('BLAD HARNESSU:', err && err.stack ? err.stack : err);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
