// P6.M02 - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/map/generator.ts        (ROZMIAR_DIMS, ROZMIAR_MENU_LABELS, rozmiarFromMenuLabel, rozmiarToDims, menuLabelToDims)
//   gra/src/map/newGameMapDefaults.ts (CALY plik)
//   gra/src/map/deposit-era.ts
//   gra/src/map/riverGenSwitch.ts
// Kod weba jest ladowany BEZ stubow logiki (m02-loader-hooks.mjs). normQualityLabel nie jest
// eksportowane: wycinamy linie 144-151 newGameMapDefaults.ts WERBATIM (kotwice tekstowe) i importujemy.
// Floaty zapisujemy jako 16 cyfr hex bitow IEEE-754 (porownanie bitowe po stronie Rust/Python).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./m02-loader-register.mjs \
//     ./gen-m02-vectors.mjs <WEB_ROOT> <OUT_DIR> <STUB_DIR>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outDirArg, stubDirArg] = process.argv;
if (!webRootArg || !outDirArg || !stubDirArg) {
  console.error('usage: <WEB_ROOT> <OUT_DIR> <STUB_DIR>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const outDir = presolve(outDirArg);
const stubDir = presolve(stubDirArg);
mkdirSync(outDir, { recursive: true });
mkdirSync(stubDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

const origLog = console.log;
console.log = () => {};
const ngd = await import(src('map/newGameMapDefaults.ts'));
const gen = await import(src('map/generator.ts'));
const dep = await import(src('map/deposit-era.ts'));
const rgs = await import(src('map/riverGenSwitch.ts'));
const norm = await import(src('util/norm-pl-label.ts'));
console.log = origLog;

// --- normQualityLabel werbatim (newGameMapDefaults.ts:144-151) ---
const ngdLines = readFileSync(join(webRoot, 'gra/src/map/newGameMapDefaults.ts'), 'utf8').split('\n');
const anchors = [
  [144 - 1, 'function normQualityLabel(label: string): string {'],
  [145 - 1, '  return label.toLowerCase()'],
  [146 - 1, "    .replace(/ł/g, 'l')"],
  [147 - 1, "    .replace(/[ó]/g, 'o')"],
  [148 - 1, "    .replace(/[ąà]/g, 'a')"],
  [149 - 1, "    .replace(/[ę]/g, 'e')"],
  [150 - 1, "    .replace(/[^a-z0-9]/g, '');"],
  [151 - 1, '}'],
];
for (const [i, want] of anchors) {
  if (ngdLines[i] !== want) throw new Error(`normQualityLabel anchor drift line ${i + 1}: ${JSON.stringify(ngdLines[i])}`);
}
const stubPath = join(stubDir, 'norm-quality.ts');
writeFileSync(stubPath, 'export ' + ngdLines.slice(143, 151).join('\n') + '\n');
const { normQualityLabel } = await import(pathToFileURL(stubPath).href);

// --- kodowanie ---
const dv = new DataView(new ArrayBuffer(8));
const F = (x) => {
  if (typeof x !== 'number') throw new Error(`F: nie liczba ${x}`);
  dv.setFloat64(0, x, false);
  return dv.getBigUint64(0, false).toString(16).padStart(16, '0');
};
const I = (x) => {
  if (!Number.isInteger(x)) throw new Error(`I: nie calkowita ${x}`);
  return x;
};
const rawNum = (x) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : x);

const TIERS = ['low', 'medium', 'high'];
const MENU = ['Malenki', 'Mały', 'Standardowy', 'Duży', 'Ogromny', 'Super Huge'];
const LABELS = [
  ...MENU, 'Malenka', 'Mala', 'Mały', 'mały', 'MAŁY', 'Mala ', ' Standardowy ', 'Średnia', 'Srednia', 'Sredni',
  'Duża', 'Duza', 'Duzy', 'Large', 'large', 'Medium', 'Small', 'small', 'XLarge', 'xlarge', 'Kolosalny', 'Super', 'superhuge',
  'SUPER HUGE', 'Ogromna', 'Ogromny!', 'Wielki', 'xyz', '', ' ', 'ćńś', 'Żółć', 'standard', 'stand', 'sre', 'ogr', 'mal', 'malen', 'duz',
  'Kontynenty', 'Pangea', 'Wyspy', 'Ziemia', 'KONTYNENTY', 'Ziemia ', 'Wyspa', 'Mało', 'Normalnie', 'Dużo', 'Duzo', 'Low', 'HIGH', 'high',
  'low', 'malo', 'Niska', 'Wysoka', 'Šmieszne', 'Mąka', 'Ęę', 'Ąą', 'àà',
];
const EPOCHS = ['kamien', 'braz', 'zelazo', 'bronz', 'iron', 'Braz', 'BRAZ', ' zelazo ', 'Żelazo', 'Kamień', 'kamień', '', 'xyz', 'Brąz', 'BRONZ', 'Iron'];

const out = {};

// ---------------- normalizacja ----------------
out.norm = LABELS.map((l) => ({ label: l, pl: norm.normPlMenuLabel(l), quality: normQualityLabel(l) }));

// ---------------- generator.ts ----------------
{
  const dims = {};
  for (const [k, v] of Object.entries(gen.ROZMIAR_DIMS)) dims[k] = v.map(I);
  const toDims = {};
  for (const k of Object.keys(gen.ROZMIAR_DIMS)) toDims[k] = gen.rozmiarToDims(k);
  out.generator = {
    rozmiarDims: dims,
    rozmiarKeysOrder: Object.keys(gen.ROZMIAR_DIMS),
    menuLabels: [...gen.ROZMIAR_MENU_LABELS],
    rozmiarToDims: toDims,
    fromMenuLabel: LABELS.map((l) => ({ label: l, rozmiar: gen.rozmiarFromMenuLabel(l), dims: gen.menuLabelToDims(l) })),
  };
}

// ---------------- newGameMapDefaults.ts ----------------
const ngdOut = {};
ngdOut.mapSizeFromDims = [];
{
  const ws = [1, 20, 36, 40, 52, 60, 70, 76, 100, 108, 120, 168, 200, 240, 336, 400, 672];
  const hs = [1, 10, 28, 50, 52, 74, 80, 120, 168, 238, 300, 476];
  for (const w of ws) for (const h of hs) ngdOut.mapSizeFromDims.push({ w, h, label: ngd.mapSizeLabelFromDims(w, h) });
  // dokladne granice pola
  for (const area of [4799, 4800, 4801, 11999, 12000, 12001, 25199, 25200, 25201, 99999, 100000, 100001]) {
    ngdOut.mapSizeFromDims.push({ w: area, h: 1, label: ngd.mapSizeLabelFromDims(area, 1) });
  }
}
ngdOut.perLabel = LABELS.map((l) => {
  const row = {
    label: l,
    mapSizeFromMenu: ngd.mapSizeLabelFromMenuLabel(l),
    defaultRywale: ngd.defaultRywaleFromMapLabel(l),
    rywaleMenu: ngd.rywaleMenuForMapLabel(l),
    typSwiata: ngd.typSwiataFromMenuLabel(l),
    density: ngd.densityTierFromLabel(l),
    isLarge: ngd.isLargeMapMenuLabel(l),
    miastaDefault: ngd.defaultMiastaPanstwaFromMapLabel(l),
    miastaMenu: ngd.miastaPanstwaMenuForMapLabel(l),
    maxRiversLegacy: TIERS.map((t) => ngd.maxRiversForMapAndDensity(l, t)),
    riverTraceLimits: ngd.riverTraceLimitsForMap(l),
    riverTraceForMap: TIERS.map((t) => ngd.resolveRiverTraceForMap(l, t)),
    aktywne: EPOCHS.map((e) => ngd.aktywneTypyFromMapLabel(l, e)),
    aktywneDefault: ngd.aktywneTypyFromMapLabel(l),
    civTriple: EPOCHS.map((e) => ngd.civTypesTripleForMapLabel(l, e)),
    civTripleDefault: ngd.civTypesTripleForMapLabel(l),
    civMenuNoRoster: EPOCHS.map((e) => ngd.civTypesMenuForMapLabel(l, e)),
    civMenuDefault: ngd.civTypesMenuForMapLabel(l),
    civDefaultNoRoster: EPOCHS.map((e) => ngd.defaultCivTypesFromMapLabel(l, e)),
    civDefaultDefault: ngd.defaultCivTypesFromMapLabel(l),
  };
  return row;
});

// rostery
const civsJson = JSON.parse(readFileSync(join(webRoot, 'gra/data/civs.json'), 'utf8'));
const realRoster = civsJson.cywilizacje.map((c) => {
  const r = {};
  if (c.ikonaId !== undefined) r.ikonaId = c.ikonaId;
  if (c.epokaWejscia !== undefined) r.epokaWejscia = c.epokaWejscia;
  if (c.epokiStartowe !== undefined) r.epokiStartowe = c.epokiStartowe;
  return r;
});
const ROSTERS = {
  real: realRoster,
  empty: [],
  tiny: [
    { ikonaId: 'a', epokaWejscia: 'kamien' },
    { ikonaId: 'b', epokaWejscia: 'braz' },
    { ikonaId: 'c', epokaWejscia: 'zelazo' },
    { ikonaId: '', epokaWejscia: 'kamien' },
    { epokaWejscia: 'kamien' },
    { ikonaId: 'd', epokiStartowe: ['zelazo', 'braz'] },
    { ikonaId: 'e', epokiStartowe: ['xyz'] },
    { ikonaId: 'f', epokaWejscia: 'bogus', epokiStartowe: ['braz'] },
    { ikonaId: 'g' },
  ],
  onlyIron: [
    { ikonaId: 'x1', epokaWejscia: 'zelazo' },
    { ikonaId: 'x2', epokaWejscia: 'zelazo' },
    { ikonaId: 'x3', epokaWejscia: 'zelazo' },
  ],
  onlyStone: Array.from({ length: 20 }, (_, i) => ({ ikonaId: `s${i}`, epokaWejscia: 'kamien' })),
  onlyBronzeEntry: [{ ikonaId: 'b1', epokaWejscia: 'braz' }],
};
ngdOut.rosters = ROSTERS;
ngdOut.rosterCases = [];
for (const [rid, roster] of Object.entries(ROSTERS)) {
  for (const l of MENU.concat(['xyz', ''])) {
    for (const e of EPOCHS) {
      ngdOut.rosterCases.push({
        roster: rid,
        label: l,
        epoch: e,
        maxCiv: ngd.maxCivTypesForStartEpoch(e, roster),
        menu: ngd.civTypesMenuForMapLabel(l, e, roster),
        def: ngd.defaultCivTypesFromMapLabel(l, e, roster),
      });
    }
    ngdOut.rosterCases.push({
      roster: rid,
      label: l,
      epoch: null,
      maxCiv: null,
      menu: ngd.civTypesMenuForMapLabel(l, undefined, roster),
      def: ngd.defaultCivTypesFromMapLabel(l, undefined, roster),
    });
  }
}

ngdOut.epochs = EPOCHS;
ngdOut.tiers = TIERS;
ngdOut.maxMiast = ngd.MAX_MIAST_PANSTWA;
ngdOut.maxTypyMenu = ngd.MAX_TYPY_CYWILIZACJI_MENU;
ngdOut.epochPool = { ...ngd.EPOCH_CIV_TYPE_POOL };
ngdOut.defaultPlayerCivId = ngd.DEFAULT_PLAYER_CIV_ID;
ngdOut.defaultStartEpochId = ngd.DEFAULT_START_EPOCH_ID;
ngdOut.landFractionPercentOpts = [...ngd.LAND_FRACTION_PERCENT_OPTS];
ngdOut.riverRefArea = I(ngd.RIVER_REF_AREA);
ngdOut.baselineRarity = F(ngd.RESOURCE_BASELINE_RARITY_MULT);
ngdOut.defaultWorldDensity = { ...ngd.DEFAULT_WORLD_DENSITY };
ngdOut.densityToLabel = TIERS.map((t) => ngd.densityTierToLabel(t));

ngdOut.clampMiasta = [];
{
  const raws = [NaN, Infinity, -Infinity, -5, -1, -0.5, 0, 0.4, 0.99, 1, 1.5, 2, 3.7, 8.99, 9, 9.5, 10, 100, 1e9, 1e300];
  for (const raw of raws) {
    for (const az of [undefined, false, true]) {
      ngdOut.clampMiasta.push({ raw: rawNum(raw), allowZero: az === undefined ? null : az, result: az === undefined ? ngd.clampMiastaPanstwaCount(raw) : ngd.clampMiastaPanstwaCount(raw, az) });
    }
  }
  // wejscia nie-liczbowe (Number(raw) po stronie weba)
  for (const raw of ['5', '', 'abc', null, undefined, true]) {
    ngdOut.clampMiasta.push({ raw: `js:${raw === undefined ? 'undefined' : JSON.stringify(raw)}`, allowZero: null, result: ngd.clampMiastaPanstwaCount(raw) });
  }
}

ngdOut.presets = [];
{
  const mk = (r, ri, d, f, rl) => ({ resources: r, rivers: ri, desert: d, forest: f, ...(rl === undefined ? {} : { relief: rl }) });
  const cases = [
    mk('Mało', 'Mało', 'Mało', 'Mało', 'Mało'),
    mk('Normalnie', 'Normalnie', 'Normalnie', 'Normalnie'),
    mk('Dużo', 'Dużo', 'Dużo', 'Dużo', 'Dużo'),
    mk('Duzo', 'Duzo', 'Duzo', 'Duzo'),
    mk('low', 'high', 'medium', 'xyz', ''),
    mk('Mało', 'Dużo', 'Duzo', 'high', undefined),
    mk('high', 'low', 'high', 'low', 'high'),
    { resources: '', rivers: '', desert: '', forest: '' },
    mk('LOW', 'HIGH', 'MALO', 'DUZO', 'Normalnie'),
  ];
  for (const c of cases) ngdOut.presets.push({ labels: c, result: ngd.worldGenerationPresetFromLabels(c) });
}

ngdOut.tierFns = TIERS.map((t) => ({
  tier: t,
  multiplier: F(ngd.densityMultiplier(t)),
  maxRiversBase: I(ngd.maxRiversFromDensity(t)),
  minPath: I(ngd.riverMinPathLengthForTier(t)),
  gridCell: I(ngd.riverGridCellSizeForTier(t)),
  desert: F(ngd.desertNoiseThresholdFromTier(t)),
  forest: F(ngd.forestNoiseThresholdFromTier(t)),
  mountain: F(ngd.mountainNoiseThresholdFromTier(t)),
  highland: F(ngd.highlandNoiseThresholdFromTier(t)),
  traceMinLen: Array.from({ length: 41 }, (_, c) => I(ngd.riverGridTraceMinLen(c, t))),
  traceMinLenDefaultTier: t === 'medium' ? Array.from({ length: 41 }, (_, c) => I(ngd.riverGridTraceMinLen(c))) : null,
  scaleMaxRivers: [0, 5, 77].map((m) => I(ngd.scaleMaxRiversForLand(m, 1234, t))),
}));

ngdOut.riverParams = [];
{
  const sizes = [
    [1, 1], [3, 3], [10, 10], [20, 14], [24, 18], [30, 30], [36, 28], [39, 60], [40, 40], [40, 100], [50, 36],
    [76, 52], [108, 74], [120, 80], [168, 120], [169, 121], [200, 140], [240, 168], [336, 238], [500, 100], [672, 476],
    [1000, 1000], [168, 40], [40, 168], [330, 230], [300, 210], [100, 100], [156, 132], [181, 129], [0, 10], [10, 0],
  ];
  for (const t of TIERS) {
    for (const [w, h] of sizes) {
      const p = ngd.resolveRiverMapParams(t, w, h);
      ngdOut.riverParams.push({
        tier: t,
        w,
        h,
        areaScale: F(p.areaScale),
        areaScaleFn: F(ngd.riverMapAreaScale(w, h)),
        feederSourceSepMult: F(p.feederSourceSepMult),
        minDim: I(p.minDim),
        ints: Object.fromEntries(
          Object.entries(p)
            .filter(([k]) => !['areaScale', 'feederSourceSepMult'].includes(k))
            .map(([k, v]) => [k, I(v)]),
        ),
      });
    }
  }
}

ngdOut.landFraction = [];
{
  const typs = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];
  for (const typ of typs) {
    ngdOut.landFraction.push({
      typ,
      defaultPercent: ngd.defaultLandFractionPercentForTyp(typ),
      noOpts: F(ngd.resolveLandFraction(undefined, typ)),
      emptyOpts: F(ngd.resolveLandFraction({}, typ)),
    });
  }
  const vals = [NaN, Infinity, -Infinity, -1, 0, 0.1, 0.15, 0.2, 0.3, 0.5, 0.85, 0.9, 1, 7];
  ngdOut.landFractionOpts = [];
  for (const typ of typs) {
    for (const v of vals) {
      ngdOut.landFractionOpts.push({ typ, landFraction: rawNum(v), result: F(ngd.resolveLandFraction({ landFraction: v }, typ)) });
    }
    ngdOut.landFractionOpts.push({ typ, landFraction: null, result: F(ngd.resolveLandFraction({ landFraction: null }, typ)) });
  }
}

ngdOut.worldGenNumbers = [];
{
  const D = (a, b, c, d, e) => ({ resources: a, rivers: b, desert: c, forest: d, relief: e });
  const optsList = [
    undefined,
    {},
    { mapSizeMenuLabel: 'Duży' },
    { worldDensity: D('medium', 'medium', 'medium', 'medium', 'medium') },
    { worldDensity: D('low', 'high', 'low', 'high', 'low'), mapSizeMenuLabel: 'Mały' },
    { worldDensity: D('high', 'low', 'high', 'low', 'high'), mapSizeMenuLabel: 'Super Huge' },
    { worldDensity: D('high', 'high', 'high', 'high', 'high'), mapSizeMenuLabel: 'Malenki' },
    { worldDensity: D('low', 'low', 'low', 'low', 'low'), mapSizeMenuLabel: 'Ogromny' },
    { worldDensity: D('medium', 'low', 'high', 'medium', 'low'), mapSizeMenuLabel: 'xyz', landFraction: 0.4 },
    { worldDensity: D('medium', 'high', 'medium', 'low', 'medium'), mapSizeMenuLabel: 'Standardowy', difficulty: 'hard', civTypesCount: 5, cityStatesCount: 3, villageRewardsEnabled: false },
  ];
  for (const o of optsList) {
    const r = ngd.resolveWorldGenNumbers(o);
    ngdOut.worldGenNumbers.push({
      opts: o === undefined ? null : o,
      resourceMult: F(r.resourceMult),
      resourceBaseline: F(r.resourceBaseline),
      maxRivers: I(r.maxRivers),
      desertThreshold: F(r.desertThreshold),
      forestThreshold: F(r.forestThreshold),
      mountainThreshold: F(r.mountainThreshold),
      highlandThreshold: F(r.highlandThreshold),
      riverTrace: Object.fromEntries(Object.entries(r.riverTrace).map(([k, v]) => [k, I(v)])),
    });
  }
}
out.newGame = ngdOut;

// ---------------- deposit-era.ts ----------------
{
  const dOut = {};
  dOut.metalEra = { ...dep.METAL_DEPOSIT_MIN_ERA };
  const zlozes = [undefined, '', ' ', 'miedz', 'MIEDZ', ' Miedz ', 'zelazo', 'wegiel', 'WEGIEL', ' wegiel ', 'cyna', 'glina', 'konie', 'zloto', 'sol', 'xyz', 'owce'];
  const minEras = [undefined, null, 0, 1, 2, 3, 5, 8, 9];
  dOut.hexCases = [];
  for (const z of zlozes) {
    for (const me of minEras) {
      const hex = {};
      if (z !== undefined) hex.zloze = z;
      if (me !== undefined) hex.zlozeMinEra = me;
      const vis = [0, 1, 2, 3, 4, 7, 8, 9].map((era) => ({ era, visible: dep.isDepositVisible(hex, era), visibleZloze: dep.visibleZloze(hex, era) ?? null }));
      dOut.hexCases.push({ hex, minEraFor: dep.zlozeMinEraFor(hex), vis });
    }
  }
  // ensureDepositEraMeta + countHidden
  dOut.ensureCases = [];
  const mkMap = () => {
    const m = {};
    let i = 0;
    for (const z of zlozes) {
      for (const me of [undefined, 4]) {
        const hex = {};
        if (z !== undefined) hex.zloze = z;
        if (me !== undefined) hex.zlozeMinEra = me;
        m[`h${String(i++).padStart(3, '0')}`] = hex;
      }
    }
    return m;
  };
  const before = mkMap();
  const afterMap = mkMap();
  dep.ensureDepositEraMeta(afterMap);
  dOut.ensure = { before, after: afterMap };
  dOut.hidden = [0, 1, 2, 3, 4, 7, 8, 9].map((era) => ({ era, onBefore: dep.countHiddenMetalDeposits(before, era), onAfter: dep.countHiddenMetalDeposits(afterMap, era) }));
  out.deposit = dOut;
}

// ---------------- jakosc mapy (newGameMapDefaults.ts:136-190) ----------------
{
  const QLABELS = [
    ...LABELS, 'niska', 'NISKA', 'Niska!', ' Niska ', 'wysoka', 'WYSOKA', 'Wysoka ', 'Srednia', 'Średnia', 'sredni', 'Mid', 'medium', 'Hi', 'L',
    'duzy', 'DUZY', 'Duży ', 'ogromny', 'OGROMNY', 'Ogromny', 'Duzy!', 'Dużo', 'dużo', 'Super Huge', 'Malenki',
  ];
  const tiers = ['low', 'medium', 'high'];
  out.quality = {
    menuLabels: [...ngd.QUALITY_MENU_LABELS],
    defaultRenderQuality: ngd.DEFAULT_RENDER_QUALITY,
    defaultMapDetailQuality: ngd.DEFAULT_MAP_DETAIL_QUALITY,
    toLabel: tiers.map((t) => ({ tier: t, label: ngd.qualityTierToLabel(t) })),
    presets: tiers.map((t) => ({ tier: t, preset: ngd.bundledMapQualityPreset(t) })),
    perLabel: QLABELS.map((l) => ({
      label: l,
      tier: ngd.qualityTierFromLabel(l),
      bundle: ngd.bundledMapQualityFromLabel(l),
      large: ngd.isLargeMapMenuLabel(l),
    })),
  };
}

// ---------------- riverGenSwitch.ts ----------------
{
  const rOut = { keys: [rgs.RIVER_GEN_STORAGE_KEY, rgs.RIVER_GEN_PHASE_STORAGE_KEY], cases: [] };
  const queriedUrl = new Set();
  const queriedStorage = new Set();
  const origGet = URLSearchParams.prototype.get;
  URLSearchParams.prototype.get = function (name) { queriedUrl.add(name); return origGet.call(this, name); };
  const vals = [null, '0', '1', 'true', 'false', 'TRUE', 'yes', '', 'main', 'main+medium', 'all', 'ALL', 'main medium'];
  const enabledOverrides = [null, true, false];
  const phaseOverrides = [null, 'main', 'main+medium', 'all'];
  const saveLoc = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const saveLs = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    for (const eo of enabledOverrides) {
      for (const po of phaseOverrides) {
        for (const url of vals) {
          for (const store of vals) {
            rgs.setRiverGenEnabledOverride(eo);
            rgs.setRiverGenPhaseOverride(po);
            const q = new URLSearchParams();
            if (url !== null) { q.set('riverGen', url); q.set('riverGenPhase', url); }
            Object.defineProperty(globalThis, 'location', { value: url === null ? { search: '' } : { search: `?${q.toString()}` }, configurable: true, writable: true });
            Object.defineProperty(globalThis, 'localStorage', {
              value: { getItem: (k) => { queriedStorage.add(k); return store === null ? null : store; } },
              configurable: true,
              writable: true,
            });
            rOut.cases.push({
              enabledOverride: eo,
              phaseOverride: po,
              url,
              store,
              enabled: rgs.getRiverGenEnabled(),
              phase: rgs.getRiverGenPhase(),
              mainOnly: rgs.isRiverGenMainOnly(),
              full: rgs.isRiverGenFull(),
            });
          }
        }
      }
    }
  } finally {
    URLSearchParams.prototype.get = origGet;
    rgs.setRiverGenEnabledOverride(null);
    rgs.setRiverGenPhaseOverride(null);
    if (saveLoc) Object.defineProperty(globalThis, 'location', saveLoc); else delete globalThis.location;
    if (saveLs) Object.defineProperty(globalThis, 'localStorage', saveLs); else delete globalThis.localStorage;
  }
  rOut.queried = { url: [...queriedUrl].sort(), storage: [...queriedStorage].sort() };
  // bez location i bez localStorage (worker)
  delete globalThis.location;
  delete globalThis.localStorage;
  rOut.noEnv = { enabled: rgs.getRiverGenEnabled(), phase: rgs.getRiverGenPhase(), mainOnly: rgs.isRiverGenMainOnly(), full: rgs.isRiverGenFull() };
  out.riverSwitch = rOut;
}

// ---------------- zapis ----------------
const files = {
  'generator.json': out.generator,
  'norm.json': out.norm,
  'new-game.json': out.newGame,
  'deposit-era.json': out.deposit,
  'river-switch.json': out.riverSwitch,
  'quality.json': out.quality,
};
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 1) + '\n');
}
console.log(`ok: ${Object.keys(files).length} plikow -> ${outDir}`);
