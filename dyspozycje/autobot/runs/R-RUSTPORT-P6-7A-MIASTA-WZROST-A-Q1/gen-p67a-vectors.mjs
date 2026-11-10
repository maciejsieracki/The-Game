// P6.7A: wektory z URUCHOMIONEGO weba (pin edb8fb56) dla population-growth-v85.ts, growth-happiness.ts,
// population-growth-tempo.ts, r-stawki-strojenie.ts i empire-food.ts (+ wejscia: cityPopulationCap,
// resolvePopulationCapMatrixDelta, building-resource-gate Spichlerz, magazynEraMultiplier,
// recomputeCityFoodBalancesInEcon, militaryFoodConsumptionWithSpichlerz, refreshManpowerAfterPopChange).
// ZERO stubow logiki: caly graf importow (cities, economy, turn-economy, okolica, manpower, ...) ladowany
// z `git archive edb8fb56` loaderem p66b-loader-*.mjs; jedyne "wlasne" funkcje to callbacki z API
// (`onCityPopulationChanged`) i rejestrator ich wywolan.
//
// Uruchomienie (Node 22):
//   node --experimental-transform-types --no-warnings --import ./p67a-loader-register.mjs \
//        ./gen-p67a-vectors.mjs <WEB_ROOT = katalog z gra/src i gra/data> <KATALOG_WYJSCIA = rust-port/engine/tests/p6_7a_vectors>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

await import(src('game/cities.ts')); // cykl importow weba: cities.ts najpierw
const PG = await import(src('game/population-growth-v85.ts'));
const EF = await import(src('game/empire-food.ts'));
const PT = await import(src('game/population-growth-tempo.ts'));
const RS = await import(src('game/r-stawki-strojenie.ts'));
const GH = await import(src('game/growth-happiness.ts'));
const EC = await import(src('game/economy.ts'));
const BG = await import(src('game/building-resource-gate.ts'));
const EU = await import(src('game/economy-upkeep.ts'));
const TE = await import(src('game/turn-economy.ts'));
const MP = await import(src('game/manpower.ts'));

const econParamsRaw = JSON.parse(readFileSync(join(webRoot, 'gra/data/econ-params.json'), 'utf8'));
const civMatrixRaw = JSON.parse(readFileSync(join(webRoot, 'gra/data/civ-matrix.json'), 'utf8'));

// ---------------------------------------------------------------------------
// narzedzia
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rnd = mulberry32(0x67a001);
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const rf = (a, b) => a + rnd() * (b - a);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

// Kodowanie liczb jak w P6.6B (tests/p6_6b_vectors/common.rs::enc): specjalne i niecalkowite jako napisy.
function replacer(_k, v) {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (Object.is(v, -0)) return '-0';
    // niecalkowite i calkowite > 2^53 jako napisy: serde_json (bez float_roundtrip) nie gwarantuje
    // poprawnego zaokraglenia przy parsowaniu liczb JSON; `str::parse::<f64>` je gwarantuje.
    if (!Number.isInteger(v) || Math.abs(v) > 2 ** 53) return '~' + String(v);
    return v;
  }
  if (v instanceof Map) return { __map: [...v.entries()] };
  if (v instanceof Set) return { __set: [...v.values()] };
  return v;
}
const hashes = {};
function write(name, data) {
  const text = JSON.stringify(data, replacer, 0);
  writeFileSync(join(outDir, name), text + '\n');
  // runda 2: hash CALEGO pliku (z koncowym newline) -> `sha256sum -c SHA256SUMS.txt` dziala
  hashes[name] = createHash('sha256').update(text + '\n').digest('hex');
}
const clone = (o) => structuredClone(o);
/** Odpowiednik `JSON.parse(JSON.stringify(x, replacer))` dla porownan (stan po wywolaniu). */
const norm = (x) => JSON.parse(JSON.stringify(x, replacer));

const SPECIALS = [NaN, Infinity, -Infinity, -0, 0, 1, -1, 0.5, 2, 3, 6, 7, 1e-9, 1e21, 1e300, -1e300];
function anyNum() {
  const r = rnd();
  if (r < 0.1) return pick(SPECIALS);
  if (r < 0.5) return ri(-5, 40);
  return Math.round(rf(-30, 90) * 1000) / 1000;
}

const SPICH_STATES = [
  undefined,
  { ceramikaActive: false, solActive: false, maSpichlerzPop: false, maSpichlerzIIPop: false },
  { ceramikaActive: true, solActive: false, maSpichlerzPop: true, maSpichlerzIIPop: false },
  { ceramikaActive: true, solActive: true, maSpichlerzPop: false, maSpichlerzIIPop: true },
  { ceramikaActive: true, solActive: true, maSpichlerzPop: true, maSpichlerzIIPop: true },
  { ceramikaActive: false, solActive: true, maSpichlerzPop: false, maSpichlerzIIPop: true },
];
const CIV_KEYS = [
  undefined, null, '', 'nieznana', 'GRECY', 'Chińczycy', 'chinczycy', 'zulusi', 'germanie', 'slowianie',
  'egipt', 'rzymianie', 'inkowie', 'harappa',
  ...civMatrixRaw.cywilizacje.flatMap((c) => [c.ikonaId, c.typCywilizacji, c.Cywilizacja]),
];
const DIFFICULTIES = [undefined, 'easy', 'normal', 'hard'];

// ---------------------------------------------------------------------------
// 1. params.json: stale z URUCHOMIONEGO weba
// ---------------------------------------------------------------------------
const parametry = {
  WYZYWIENIE_MIN: PG.WYZYWIENIE_MIN,
  WYZYWIENIE_MAX: PG.WYZYWIENIE_MAX,
  WYZYWIENIE_STEP: PG.WYZYWIENIE_STEP,
  WYZYWIENIE_LEVELS: [...PG.WYZYWIENIE_LEVELS],
  WYZYWIENIE_GROWTH_PCT: Object.entries(PG.WYZYWIENIE_GROWTH_PCT).map(([k, v]) => [Number(k), v]),
  DEFAULT_POZIOM_RACJI: PG.DEFAULT_POZIOM_RACJI,
  CIV_MATRIX_GROWTH_DIFFICULTY_MULT: Object.entries(PG.CIV_MATRIX_GROWTH_DIFFICULTY_MULT),
  WYZYWIENIE_POZIOM_NA_LIMICIE: EF.WYZYWIENIE_POZIOM_NA_LIMICIE,
  WZROST_LUDNOSCI_PACE: Object.entries(PT.WZROST_LUDNOSCI_PACE),
  R_STAWKI: {
    koszt: RS.R_STAWKI_KOSZT_MULT,
    fala2: RS.R_STAWKI_FALA2_MULT,
    fala1fala2: RS.R_STAWKI_FALA1_FALA2_MULT,
  },
  SPICHLERZ_EMPIRE_CAP: { i: BG.SPICHLERZ_EMPIRE_CAP_I, ii: BG.SPICHLERZ_EMPIRE_CAP_II_FULL },
  popCapEcon: Object.fromEntries(
    ['easy', 'normal', 'hard'].map((d) => [
      d,
      {
        akweduktProgLudnosci: econParamsRaw.ekonomia_miasta.akwedukt_prog_ludnosci[d],
        spichlerzProgLudnosci: econParamsRaw.ekonomia_miasta.spichlerz_prog_ludnosci[d],
        akweduktMaxLudnosci: econParamsRaw.ekonomia_miasta.akwedukt_max_ludnosci[d],
      },
    ]),
  ),
  magazynEra: [-3, 0, 0.5, 1, 1.5, 2, 3, 4, 5, 8, 10, NaN, Infinity, -Infinity].map((e) => ({
    era: e,
    out: EU.magazynEraMultiplier(e),
  })),
  econParamsRawForBuild: econParamsRaw,
};

// ---------------------------------------------------------------------------
// 2. tempo / happiness / r-stawki / era
// ---------------------------------------------------------------------------
const tempoStawki = { tempo: [], happiness: [], stawki: {}, era: [], spichlerz: [] };
{
  const progs = [-5, 0, 0.4, 0.5, 1, 1.5, 2.5, 20, 68, 68.5, 100.4999, 1e6, NaN, Infinity, -Infinity, -0];
  const mults = [0, 0.1, 0.5, 1, 1.5, 2, 2.5, 4, -1, NaN, Infinity];
  for (const p of progs) {
    for (const k of ['wysoki', 'normalny', 'wolny']) {
      tempoStawki.tempo.push({ prog: p, pace: k, out: PT.applyGrowthThresholdPace(p, k) });
    }
    for (const m of mults) tempoStawki.tempo.push({ prog: p, mult: m, out: PT.applyGrowthThresholdPace(p, m) });
  }
  for (let i = 0; i < 200; i++) {
    const p = anyNum();
    const m = chance(0.5) ? anyNum() : undefined;
    const k = pick(['wysoki', 'normalny', 'wolny']);
    tempoStawki.tempo.push(
      m === undefined
        ? { prog: p, pace: k, out: PT.applyGrowthThresholdPace(p, k) }
        : { prog: p, mult: m, out: PT.applyGrowthThresholdPace(p, m) },
    );
  }
  for (const w of [NaN, Infinity, -Infinity, 0, -0, 1, -3.5, 12, 0.1]) {
    tempoStawki.happiness.push({
      wealth: w,
      cer: chance(0.5),
      sp: chance(0.5),
      out: GH.computeGrowthHappinessNetto(w, true, true),
    });
  }
  for (let i = 0; i < 50; i++) {
    const w = anyNum();
    const c = chance(0.5);
    const s = chance(0.5);
    tempoStawki.happiness.push({ wealth: w, cer: c, sp: s, out: GH.computeGrowthHappinessNetto(w, c, s) });
  }
  const bases = [NaN, Infinity, -Infinity, 0, -0, -1, 0.1, 0.25, 0.5, 1, 1.5, 2, 2.5, 3.4, 7, 33, 100, 1e6, 1e21];
  tempoStawki.stawki.scalar = bases.map((b) => ({
    base: b,
    improvement: RS.scaleImprovementWorkCost(b),
    wonderWork: RS.scaledWonderWorkCost(b),
    wonderFood: RS.scaledWonderFoodCost(b),
  }));
  for (let i = 0; i < 100; i++) {
    const b = anyNum();
    tempoStawki.stawki.scalar.push({
      base: b,
      improvement: RS.scaleImprovementWorkCost(b),
      wonderWork: RS.scaledWonderWorkCost(b),
      wonderFood: RS.scaledWonderFoodCost(b),
    });
  }
  tempoStawki.stawki.record = [];
  const recs = [
    undefined,
    null,
    {},
    { drewno: 10, kamien: 3 },
    { drewno: 0, kamien: -2, zelazo: NaN, zloto: Infinity, sol: 1 },
    { a: 0.2, b: 0.5, c: 1.5, d: 2.5, e: 100 },
    { x: 'str', y: 4 },
  ];
  for (let i = 0; i < 40; i++) {
    const o = {};
    for (let j = 0; j < ri(0, 6); j++) o['k' + j] = chance(0.15) ? 'x' : anyNum();
    recs.push(o);
  }
  for (const r of recs) {
    const rawEntries = r && typeof r === 'object' ? Object.entries(r) : null;
    const out = Object.entries(RS.scaleStockCostRecord(r));
    tempoStawki.stawki.record.push({
      raw: rawEntries === null ? null : rawEntries.map(([k, v]) => [k, typeof v === 'number' ? v : { notNumber: true }]),
      out,
    });
  }
  const eras = [
    undefined, null, '', ' ', 'kamien', 'Kamień', 'KAMIEŃ', 'kamień', 'braz', 'Braz', 'BRĄZ', 'brąz', 'Brąz', 'zelazo',
    'Żelazo', 'ŻELAZO', 'żelazo', 'Zelazo ', ' braz', 'sredniowiecze', 'Średniowiecze', 'Łódź', 'ŁÓDŹ', 'ǅ', 'İstanbul',
    'ΣΑΣ', 'Éra', 'Ünï', 'ﬁ', '한글', '한', 'Å', 'ẛ̣', 'ǆ', 'é', 'à́', ' braz ',
    '﻿braz', 'ｂｒａｚ', 'ΐ', 'ᾳ', 'Ꞓ', '𝔸', '\u{1d15e}', '\u{2f800}', 'braẓ', 'ạ́', 'ạ́',
    'ö', 'ǟ', 'ṩ',
  ];
  for (let i = 0; i < 20; i++) {
    const code = [];
    for (let j = 0; j < ri(1, 6); j++) code.push(pick([0x41, 0x61, 0x105, 0x142, 0x15b, 0xf3, 0x17c, 0x301, 0x323, 0xc0, 0x1e9b, 0x3a3, 0x20, 0xac00, 0xd7a3, 0x1ea0]));
    eras.push(String.fromCodePoint(...code));
  }
  for (const e of eras) {
    tempoStawki.era.push({
      raw: e === undefined ? { absent: true } : e,
      norm: RS.normalizeResearchEra(e),
      fala2: RS.isResearchEraFala2Extra(e),
    });
  }
  // wejscia Spichlerz
  const builts = [[], ['spichlerz'], ['spichlerz_ii'], ['magazyn'], ['akwedukt', 'spichlerz'], ['x', 'spichlerz_ii', 'akwedukt'], ['Spichlerz'], ['spichlerz2']];
  for (const b of builts) tempoStawki.spichlerz.push({ built: b, has: BG.cityHasSpichlerzBuilding(b) });
  tempoStawki.spichlerzStates = SPICH_STATES.filter(Boolean).map((s) => ({
    state: s,
    growth: BG.spichlerzGrowthBonusPercent(s),
    cost: BG.spichlerzRationFoodCostMultiplier(s),
  }));
}

// ---------------------------------------------------------------------------
// 3. growth.json: funkcje population-growth-v85.ts
// ---------------------------------------------------------------------------
const growth = {};
{
  const xs = [-100, -5, -0.3, -0.25, 0, -0, 0.24, 0.25, 0.26, 0.5, 0.74, 0.75, 0.76, 1, 1.24, 1.25, 1.26, 3.3, 5.99, 6, 6.2, 100, NaN, Infinity, -Infinity];
  for (let i = 0; i < 200; i++) xs.push(chance(0.5) ? Math.round(rf(-1, 7) * 100) / 100 : anyNum());
  growth.ration = xs.map((x) => ({
    x,
    clamp: PG.clampPoziomRacji(x),
    cost: PG.rationFoodCostPerPop(x),
    growthPct: PG.rationGrowthPercent(x),
    label: PG.formatWyzwienieLabel(x),
    legacy: PG.migrateLegacyRationLevel(x),
    procent: PG.migrateProcentRozwojToPoziomRacji(x),
  }));
  growth.procentUndefined = PG.migrateProcentRozwojToPoziomRacji(undefined);

  growth.cityLevel = [];
  const cityLevelCases = [
    {},
    { poziomRacji: 3 },
    { poziomRacji: 7 },
    { poziomRacji: -2 },
    { poziomRacji: 2.3 },
    { poziomRacji: NaN },
    { procentRozwoj: 100 },
    { procentRozwoj: 0 },
    { procentRozwoj: 50 },
    { procentRozwoj: 33 },
    { procentRozwoj: 150 },
    { procentRozwoj: -20 },
    { procentRozwoj: NaN },
    { poziomRacji: 2, procentRozwoj: 100 },
  ];
  for (let i = 0; i < 100; i++) {
    const c = {};
    if (chance(0.6)) c.poziomRacji = anyNum();
    if (chance(0.6)) c.procentRozwoj = anyNum();
    cityLevelCases.push(c);
  }
  for (const c of cityLevelCases) growth.cityLevel.push({ city: c, out: PG.getCityRationLevel(c) });

  growth.cost = [];
  for (let i = 0; i < 400; i++) {
    const pop = chance(0.2) ? anyNum() : ri(0, 14);
    const level = chance(0.3) ? anyNum() : pick(PG.WYZYWIENIE_LEVELS);
    const st = pick(SPICH_STATES);
    growth.cost.push({ pop, level, st, out: PG.computeCityRationCost(pop, level, undefined, st) });
  }

  growth.matrix = CIV_KEYS.map((k) => ({
    civ: k === undefined ? { absent: true } : k,
    out: PG.resolvePopulationMatrixForCiv(k),
    capDelta: EC.resolvePopulationCapMatrixDelta(k),
    mult: undefined,
  }));
  growth.diffMult = DIFFICULTIES.map((d) => ({
    d: d === undefined ? { absent: true } : d,
    out: PG.civMatrixGrowthDifficultyMultiplier(d),
  }));

  growth.popCap = [];
  for (const ak of [false, true]) {
    for (const sp of [false, true]) {
      for (const delta of [undefined, -2, -1, 0, 1, 2, 3, NaN, 0.5, -0]) {
        for (const d of ['easy', 'normal', 'hard']) {
          const params = parametry.popCapEcon[d];
          growth.popCap.push({
            ak, sp, d, delta: delta === undefined ? { absent: true } : delta,
            out: EC.cityPopulationCap(ak, sp, params, delta),
          });
        }
      }
    }
  }
  growth.popCapCustom = [];
  for (let i = 0; i < 60; i++) {
    const params = { akweduktProgLudnosci: anyNum(), spichlerzProgLudnosci: anyNum(), akweduktMaxLudnosci: anyNum() };
    const ak = chance(0.5);
    const sp = chance(0.5);
    const delta = pick([undefined, -1, 0, 1, 2, 5]);
    growth.popCapCustom.push({ params, ak, sp, delta: delta === undefined ? { absent: true } : delta, out: EC.cityPopulationCap(ak, sp, params, delta) });
  }

  // computeGrowthPercentV85
  growth.percent = [];
  const rationParams = PG.buildRationParams({}, 'normal');
  const matrixOverrides = [
    undefined,
    { hungerLossMultiplier: 1, healthGrowthMultiplier: 1, happinessBase: 0, populationCapDelta: 0 },
    { hungerLossMultiplier: 1.5, healthGrowthMultiplier: 1.25, happinessBase: 2, populationCapDelta: 1 },
    { hungerLossMultiplier: 0, healthGrowthMultiplier: 0, happinessBase: -1, populationCapDelta: -1 },
    { hungerLossMultiplier: 0.8, healthGrowthMultiplier: 0.85, happinessBase: 0, populationCapDelta: 2 },
  ];
  for (let i = 0; i < 700; i++) {
    const input = {
      population: chance(0.15) ? anyNum() : ri(0, 14),
      poziomRacji: chance(0.2) ? anyNum() : pick(PG.WYZYWIENIE_LEVELS),
      zdrowie: chance(0.2) ? anyNum() : ri(-10, 80),
      szczescieNetto: chance(0.2) ? anyNum() : ri(-20, 90),
      wealthPoziom: ri(0, 5),
      spichlerzState: pick(SPICH_STATES.filter(Boolean)),
      civKey: pick(CIV_KEYS),
      difficulty: pick(DIFFICULTIES),
      rationParams,
      citizenResourceGrowthPct: pick([undefined, undefined, 0, -1, -3, -7, 2.5, NaN]),
      populationMatrix: pick(matrixOverrides),
    };
    growth.percent.push({ in: clone(input), out: PG.computeGrowthPercentV85(input) });
  }

  // applyFractionalGrowthV85
  growth.fractional = [];
  for (let i = 0; i < 900; i++) {
    const city = { population: chance(0.1) ? anyNum() : ri(0, 14) };
    if (chance(0.8)) city.wzrostUlamkowy = chance(0.2) ? anyNum() : Math.round(rf(-2, 3) * 1000) / 1000;
    const growthPct = chance(0.2) ? anyNum() : pick([...PG.WYZYWIENIE_LEVELS.map((l) => PG.rationGrowthPercent(l)), 0, 12, 25, 40, 120, -30, -120]);
    const fed = chance(0.8);
    const ak = chance(0.4);
    const sp = chance(0.4);
    const d = pick(['easy', 'normal', 'hard']);
    const econP = chance(0.2)
      ? { akweduktProgLudnosci: ri(1, 8), spichlerzProgLudnosci: ri(1, 10), akweduktMaxLudnosci: ri(1, 18) }
      : parametry.popCapEcon[d];
    const delta = pick([undefined, 0, 0, 1, 2, -1]);
    const c0 = clone(city);
    const out = PG.applyFractionalGrowthV85(c0, growthPct, fed, ak, econP, sp, delta);
    growth.fractional.push({ city, growthPct, fed, ak, sp, econ: econP, delta: delta === undefined ? { absent: true } : delta, out, cityAfter: c0 });
  }

  growth.gain = [];
  for (let i = 0; i < 300; i++) {
    const pop = chance(0.15) ? anyNum() : ri(0, 14);
    const pct = chance(0.2) ? anyNum() : pick([0, 1.5, 4.5, 7, -2, -10, 33]);
    const fed = chance(0.8);
    const cap = chance(0.4);
    growth.gain.push({ pop, pct, fed, cap, out: PG.growthGainPerTurnSlots(pop, pct, fed, cap) });
  }
  growth.turns = [];
  for (let i = 0; i < 300; i++) {
    const frac = chance(0.15) ? pick([NaN, Infinity, -Infinity, 1, 0.999999, 2, -1]) : Math.round(rf(-1, 1.5) * 1000) / 1000;
    const gain = chance(0.2) ? anyNum() : Math.round(rf(-1, 3) * 1000) / 1000;
    const r = PG.turnsUntilNextCitizen(frac, gain);
    growth.turns.push({ frac, gain, out: r === null ? { isNull: true } : r });
  }
  growth.turnsNullFrac = PG.turnsUntilNextCitizen(null, 0.5);
  growth.turnsNullFracOut = growth.turnsNullFrac === null ? { isNull: true } : growth.turnsNullFrac;

  growth.hunger = [];
  for (let i = 0; i < 700; i++) {
    const pop = chance(0.1) ? anyNum() : ri(0, 14);
    const fed = chance(0.3);
    const tury = chance(0.15) ? pick([undefined, NaN, null]) : ri(0, 5);
    const mult = chance(0.2) ? pick([undefined, NaN, -1, 0, Infinity, 1.5, 2.25, 0.5]) : pick([1, 1.25, 0.85, 1.5]);
    const debt = chance(0.2) ? pick([undefined, NaN, -1, 0.25, 0.5, 0.75, 1, Infinity]) : Math.round(rf(0, 1.2) * 100) / 100;
    const args = [pop, fed, tury === null ? undefined : tury, mult, debt];
    const call = PG.applyHungerPenaltyV85(...args);
    growth.hunger.push({
      pop, fed,
      tury: tury === undefined || tury === null ? { absent: true } : tury,
      mult: mult === undefined ? { absent: true } : mult,
      debt: debt === undefined ? { absent: true } : debt,
      out: call,
    });
  }

  growth.ensure = [];
  const ensureBase = [
    {}, { poziomRacji: 1 }, { poziomRacji: 2 }, { poziomRacji: 3 }, { poziomRacji: 4 }, { poziomRacji: 0 }, { poziomRacji: 7 },
    { poziomRacji: 1.5 }, { poziomRacji: 2.5 }, { poziomRacji: NaN }, { procentRozwoj: 100 }, { procentRozwoj: 0 }, { procentRozwoj: 66 },
    { poziomRacji: 2, rationMigratedV114: true }, { poziomRacji: 3, rationMigratedV114: true }, { poziomRacji: 9, rationMigratedV114: true },
    { procentRozwoj: 50, rationMigratedV114: true }, { rationMigratedV114: false, poziomRacji: 1, procentRozwoj: 10 },
    { wzrostUlamkowy: 0.4, turyBezDoplaty: 2, hungerLossUlamkowy: 0.5, poziomRacji: 4 },
    { procentRozwoj: NaN }, { poziomRacji: -1 }, { poziomRacji: Infinity },
  ];
  for (let i = 0; i < 100; i++) {
    const c = {};
    if (chance(0.6)) c.poziomRacji = chance(0.5) ? pick([0, 1, 2, 3, 4, 5, 6, 0.5, 1.5]) : anyNum();
    if (chance(0.4)) c.procentRozwoj = anyNum();
    if (chance(0.3)) c.rationMigratedV114 = chance(0.5);
    if (chance(0.3)) c.wzrostUlamkowy = Math.round(rf(0, 1) * 100) / 100;
    if (chance(0.3)) c.turyBezDoplaty = ri(0, 4);
    if (chance(0.3)) c.hungerLossUlamkowy = Math.round(rf(0, 1) * 100) / 100;
    ensureBase.push(c);
  }
  for (const c of ensureBase) {
    const c0 = clone(c);
    PG.ensureCityRationDefaults(c0);
    growth.ensure.push({ city: c, after: c0 });
  }

  // buildRationParams / buildEmpireFoodParams
  growth.build = [];
  const rawCases = [
    {},
    econParamsRaw,
    { ekonomia_miasta: {} },
    { ekonomia_miasta: null },
    { ekonomia_miasta: 5 },
    { racje_zywnosc_1: { easy: 1, normal: 3, hard: 5 }, racje_wzrost_proc_3: { normal: 9 } },
    { ekonomia_miasta: { racje_zywnosc_2: { easy: NaN, normal: 'x', hard: 7 }, racje_wzrost_proc_1: { normal: Infinity } } },
    { globalne: { magazyn_centralny_baza_zywnosc: { normal: 1234 }, magazyn_centralny_bonus_zywnosc_na_budynek: { hard: 55 } }, ekonomia_miasta: { magazyn_centralny_baza_zywnosc: { normal: 9 } } },
    { globalne: null, ekonomia_miasta: { magazyn_centralny_baza_zywnosc: { easy: 77, normal: 78, hard: 79 }, glod_wojska_hp_frac: { easy: 0.1, normal: 0.2, hard: 0.3 }, glod_wojska_karencja_tur: { normal: 5 }, glod_wojska_stat_mult: { hard: 0.5 } } },
    { globalne: { magazyn_centralny_baza_zywnosc: null }, ekonomia_miasta: { magazyn_centralny_baza_zywnosc: { normal: 4242 } } },
  ];
  for (const raw of rawCases) {
    for (const d of ['easy', 'normal', 'hard']) {
      growth.build.push({
        raw: raw === econParamsRaw ? 'econ' : raw, d,
        ration: PG.buildRationParams(raw, d),
        food: EF.buildEmpireFoodParams(raw, d),
      });
    }
  }
  growth.buildDefaultDifficulty = {
    ration: PG.buildRationParams({}),
    food: EF.buildEmpireFoodParams({}),
  };
}

// ---------------------------------------------------------------------------
// 4. swiat testowy imperium (empire.json, post_central.json)
// ---------------------------------------------------------------------------
const RATION_PARAMS = PG.buildRationParams({}, 'normal');

function makeWorld(opts = {}) {
  const owners = opts.owners ?? [0, 1, 2].slice(0, ri(1, 3));
  const cities = [];
  const ticks = [];
  const builtByCity = new Map();
  const spichlerzByCity = new Map();
  let idx = 0;
  for (const ownerId of owners) {
    const n = ri(opts.minCities ?? 1, opts.maxCities ?? 5);
    for (let j = 0; j < n; j++) {
      const id = `c${idx++}`;
      const city = {
        id, ownerId, name: `Miasto ${id}`, q: ri(-5, 5), r: ri(-5, 5), population: ri(1, 13),
        okolicaTryb: 'auto',
      };
      if (chance(0.85)) city.poziomRacji = pick([...PG.WYZYWIENIE_LEVELS, 1, 2, 3, 4, 4]);
      if (chance(0.15)) city.procentRozwoj = pick([0, 33, 50, 100, 150]);
      if (chance(0.5)) city.rationMigratedV114 = true;
      if (chance(0.7)) city.wzrostUlamkowy = Math.round(rf(0, 1.4) * 1000) / 1000;
      if (chance(0.3)) city.turyBezDoplaty = ri(0, 3);
      if (chance(0.3)) city.hungerLossUlamkowy = Math.round(rf(0, 1.3) * 100) / 100;
      if (chance(0.4)) city.autoWyzywienie = chance(0.5);
      if (chance(0.5)) city.manpower = ri(0, 80);
      if (chance(0.3)) city.wealthState = { poziom: ri(0, 4), pula: ri(0, 20) };
      cities.push(city);
      const brutto = chance(0.15) ? undefined : (chance(0.5) ? ri(0, 60) : Math.round(rf(0, 60) * 100) / 100);
      const tick = {
        cityId: id, ownerId,
        oblegany: chance(0.08),
        zywnoscNetto: Math.round(rf(-20, 40) * 100) / 100,
        zdrowie: chance(0.1) ? ri(-5, 0) : ri(0, 60),
      };
      if (brutto !== undefined) tick.zywnoscBrutto = brutto;
      if (chance(0.5)) tick.kosztRacji = ri(0, 30);
      if (chance(0.3)) tick.bilansLokalny = Math.round(rf(-20, 30) * 100) / 100;
      if (chance(0.4)) tick.wzrostProcent = ri(-10, 12);
      const ma = chance(0.3);
      const maII = ma && chance(0.4);
      if (chance(0.7)) {
        tick.maSpichlerz = ma && !maII;
        tick.maSpichlerzII = maII;
        tick.spichlerzCeramika = ma;
        tick.spichlerzSol = maII;
      }
      ticks.push(tick);
      const built = [];
      if (chance(0.3)) built.push('akwedukt');
      if (chance(0.25)) built.push('magazyn');
      if (chance(0.25)) built.push(pick(['spichlerz', 'spichlerz_ii']));
      if (chance(0.7)) builtByCity.set(id, built);
      if (chance(0.4)) spichlerzByCity.set(id, pick(SPICH_STATES.filter(Boolean)));
    }
  }
  return { owners, cities, ticks, builtByCity, spichlerzByCity };
}

function econOf(world) {
  return { perCity: clone(world.ticks), growth: 0, starved: 0 };
}

/** Wejsciowe tiki w stanie "po ticku ekonomii": koszt/bilans policzone PRAWDZIWYM recomputeCityFoodBalancesInEcon. */
function settledEcon(world, mutateFlags = true) {
  const econ = econOf(world);
  if (mutateFlags) {
    TE.recomputeCityFoodBalancesInEcon(econ.perCity, world.cities, RATION_PARAMS, chance(0.5) ? world.spichlerzByCity : undefined);
  }
  return econ;
}

function cityOut(c) {
  return norm(c);
}

// ---- recomputeCityFoodBalancesInEcon (turn-economy.ts) ----
const empire = { recompute: [], advance: [], accessors: [], simulate: [], plan: [], balance: [], raise: [], maxSafe: [], solvent: [], legacy: {} };
for (let i = 0; i < 60; i++) {
  const w = makeWorld();
  // powtorzone id miasta (Map w webie: ostatnie wygrywa): inna populacja i poziom racji pod tym samym id
  if (chance(0.35)) {
    const dup = clone(pick(w.cities));
    dup.population = ri(1, 13);
    dup.poziomRacji = pick(PG.WYZYWIENIE_LEVELS);
    w.cities.push(dup);
  }
  const econ = econOf(w);
  const useSp = chance(0.5);
  const cities0 = clone(w.cities);
  TE.recomputeCityFoodBalancesInEcon(econ.perCity, w.cities, RATION_PARAMS, useSp ? w.spichlerzByCity : undefined);
  empire.recompute.push({
    cities: cities0, ticks: w.ticks, spichlerz: useSp ? [...w.spichlerzByCity.entries()] : null,
    out: econ.perCity,
  });
}

// ---- advanceEmpireFood ----
const FOOD_TABLE = { Wojownik: 1, Lucznik: 2, Katapulta: 3 };
function makeUnits(owners) {
  const units = [];
  for (const ownerId of [...owners, -1]) {
    for (let j = 0; j < ri(0, 5); j++) {
      units.push({
        ownerId, typeId: pick(['Wojownik', 'Lucznik', 'Katapulta', 'Nieznana']),
        camping: chance(0.3), onOwnTerritory: pick([true, false, undefined]),
      });
    }
  }
  return units;
}
const upkeep = EU.DEFAULT_UPKEEP_PARAMS;
for (let i = 0; i < 100; i++) {
  const w = makeWorld({ owners: pick([[0], [0, 1], [0, 1, 2], [1, 0], [2, 0, 1]]) });
  const econ = settledEcon(w);
  // powtorzony tik tego samego miasta: sprawdza dedup `countMagazynByOwner` (seen) i kolejnosc deficytow
  if (chance(0.2) && econ.perCity.length) econ.perCity.push(clone(pick(econ.perCity)));
  const units = makeUnits(w.owners);
  const unitOwners = units.map((u) => u.ownerId);
  const stateOwners = chance(0.4) ? [] : w.owners.filter(() => chance(0.7));
  if (chance(0.15)) stateOwners.push(7);
  const states = new Map();
  for (const o of stateOwners) {
    const st = { zapasyPanstwa: chance(0.2) ? 0 : Math.round(rf(0, 400) * 100) / 100, turyUjemnychZapasow: chance(0.7) ? ri(0, 4) : undefined };
    if (chance(0.2)) st.procentRozwoj = 100;
    states.set(o, st);
  }
  const rawParams = pick([{}, econParamsRaw, { globalne: { magazyn_centralny_baza_zywnosc: { normal: ri(20, 300) }, magazyn_centralny_bonus_zywnosc_na_budynek: { normal: ri(5, 50) } }, glod_wojska_karencja_tur: { normal: ri(1, 4) } }]);
  const d = pick(['easy', 'normal', 'hard']);
  const params = EF.buildEmpireFoodParams(rawParams, d);
  const useBuilt = chance(0.8);
  const eraByOwner = pick([null, { 0: 1, 1: 2, 2: 3 }, { 0: 4, 1: 1.5, 2: 0 }, { 0: 2, 1: 2, 2: 2, 7: 2 }]);
  const resolve = eraByOwner ? (o) => eraByOwner[o] ?? 1 : undefined;
  const statesBefore = norm(states);
  const econBefore = clone(econ);
  // koszt armii: PRAWDZIWA militaryFoodConsumptionWithSpichlerz (bez stanow Spichlerza Soli w runtime)
  const armyCost = {};
  for (const o of [...new Set([...unitOwners, ...w.owners, ...stateOwners])]) {
    armyCost[o] = TE.militaryFoodConsumptionWithSpichlerz(units, o, upkeep, FOOD_TABLE);
  }
  EF.clearLastEmpireFoodTicks();
  EF.bindEmpireFoodRuntime(states);
  const res = EF.advanceEmpireFood(econ, units, states, upkeep, params, FOOD_TABLE, useBuilt ? w.builtByCity : undefined, resolve);
  const accOwners = [...new Set([...unitOwners, ...w.owners, ...stateOwners, -1, 99])];
  const acc = accOwners.map((o) => ({
    o,
    reserve: EF.getEmpireFoodReserve(o),
    maxCap: EF.getEmpireFoodMaxCap(o),
    hungry: EF.isArmyHungry(o),
    starving: EF.isArmyStarving(o),
    countdown: (() => { const c = EF.getArmyStarvationCountdown(o, params.glodWojskaKarencjaTur); return c === null ? { isNull: true } : c; })(),
    last: EF.getLastEmpireFoodTick(o) ?? null,
  }));
  empire.advance.push({
    params, d, raw: rawParams === econParamsRaw ? 'econ' : rawParams,
    cities: w.cities, econ: econBefore, unitOwners, armyCost, statesBefore,
    built: useBuilt ? [...w.builtByCity.entries()] : null,
    eraByOwner,
    out: { perOwner: res.perOwner, byOwnerKeys: [...res.byOwner.keys()], statesAfter: states, accessors: acc },
  });
}
EF.bindEmpireFoodRuntime(new Map());
EF.clearLastEmpireFoodTicks();
{
  // clear: po clear wszystkie akcesory zwracaja wartosci domyslne
  empire.afterClear = [0, 1, -1].map((o) => ({
    o, reserve: EF.getEmpireFoodReserve(o), maxCap: EF.getEmpireFoodMaxCap(o), hungry: EF.isArmyHungry(o), starving: EF.isArmyStarving(o),
    last: EF.getLastEmpireFoodTick(o) ?? null,
  }));
  empire.split = { getEmpireFoodSplit: EF.getEmpireFoodSplit(0), clamp: [-5, 0, 50, 100, 150, NaN, Infinity].map((x) => ({ x, out: EF.clampFoodSplitPct(x) })) };
  empire.legacy.cityFoodSplit = [{}, { poziomRacji: 0 }, { poziomRacji: 3 }, { poziomRacji: 6 }, { poziomRacji: 4.5 }, { poziomRacji: NaN }, { procentRozwoj: 30 }].map((c) => ({ city: c, out: EF.getCityFoodSplit(c) }));
  empire.legacy.cityFoodSplit.push({ city: { poziomRacji: 2 }, defaultPct: 40, out: EF.getCityFoodSplit({ poziomRacji: 2 }, 40) });
  const pr = EF.buildEmpireFoodParams({}, 'normal');
  empire.legacy.netDelta = [[10, 3], [0, 0], [-5, 2.5], [NaN, 1]].map(([b, k]) => ({ b, k, out: EF.computeEmpireFoodNetDelta(b, k, 100, 0, pr) }));
  empire.legacy.netDeltaFromCities = [[[1, 2, 3], 1], [[], 0], [[-4.5, 0.25], 2], [[NaN, 1], 0]].map(([xs, k]) => ({
    xs, k, out: EF.computeEmpireFoodNetDeltaFromCityFoods(xs.map((x) => ({ zywnoscNetto: x })), k, 0, pr),
  }));
  empire.legacy.maxCap = { out: EF.computeEmpireFoodMaxCap(0, pr), params: pr };
  empire.legacy.fresh = [100, undefined, 0].map((x) => ({ x: x === undefined ? { absent: true } : x, out: EF.freshEmpireFoodState(x) }));
  const humanIds = [undefined, [0], [1], [0, 1], []];
  empire.legacy.autoEnabled = [];
  for (const own of [0, 1, 2]) {
    for (const auto of [undefined, true, false]) {
      for (const force of [undefined, true, false]) {
        const city = { ownerId: own, ...(auto === undefined ? {} : { autoWyzywienie: auto }) };
        const optsArg = force === undefined ? undefined : { forceAuto: force };
        for (const hid of humanIds) {
          empire.legacy.autoEnabled.push({
            city, force: force === undefined ? { absent: true } : force,
            humanIds: hid === undefined ? { absent: true } : hid,
            out: hid === undefined ? EF.isCityAutoWyzywienieEnabled(city, optsArg) : EF.isCityAutoWyzywienieEnabled(city, optsArg, hid),
          });
        }
      }
    }
  }
}

// ---- funkcje pomocnicze: nadwyzka, pula, allFed, solvent ----
for (let i = 0; i < 150; i++) {
  const w = makeWorld({ owners: [0, 1] });
  const econ = settledEcon(w);
  const owner = pick([0, 1, 2]);
  const zap = chance(0.2) ? 0 : Math.round(rf(0, 300) * 100) / 100;
  const koszt = chance(0.5) ? 0 : Math.round(rf(0, 60) * 100) / 100;
  const rawTicks = clone(econ.perCity);
  // czesc tikow bez bilansu / z NaN
  for (const t of rawTicks) {
    if (chance(0.1)) delete t.bilansLokalny;
    if (chance(0.05)) t.bilansLokalny = NaN;
    if (chance(0.1)) delete t.kosztRacji;
    if (chance(0.1)) delete t.zywnoscBrutto;
  }
  empire.simulate.push({
    owner, zap, koszt, ticks: rawTicks,
    nadwyzka: EF.computeEmpireCityFoodNadwyzka(rawTicks, owner),
    pool: EF.simulateCityFoodCentralPool(zap, rawTicks, owner),
    allFed: EF.simulateCityFoodAllFed(zap, rawTicks, owner),
    solvent: EF.isEmpireCityFoodSolvent(zap, rawTicks, owner, koszt),
    solventDefault: EF.isEmpireCityFoodSolvent(zap, rawTicks, owner),
  });
}

// ---- plan, autoBalance, autoRaise, maxSafe ----
function popCapMapFor(world) {
  const m = new Map();
  for (const c of world.cities) if (chance(0.7)) m.set(c.id, pick([5, 8, 12, 3, c.population, c.population + 1]));
  return m;
}
function levelsOf(cities) {
  return cities.map((c) => ({ id: c.id, poziomRacji: c.poziomRacji, rationMigratedV114: c.rationMigratedV114, wzrostUlamkowy: c.wzrostUlamkowy, turyBezDoplaty: c.turyBezDoplaty, hungerLossUlamkowy: c.hungerLossUlamkowy }));
}
function planScenario(kind, i, tune = false) {
  const w = makeWorld({ owners: pick([[0], [0, 1], [1, 0]]), minCities: 1, maxCities: 6 });
  const econ = settledEcon(w);
  // 30% scenariuszy "niedoboru": produkcja miast zbita tak, ze nawet minimum Wyzywienia nie karmi wszystkich
  // (galaz `!allFed` w resolveEqualGrowthRationPlan)
  if (chance(0.3)) {
    for (const t of econ.perCity) {
      if (t.zywnoscBrutto !== undefined) t.zywnoscBrutto = Math.round(t.zywnoscBrutto * 0.03 * 100) / 100;
    }
    TE.recomputeCityFoodBalancesInEcon(econ.perCity, w.cities, RATION_PARAMS, undefined);
  }
  const ownerId = chance(0.85) ? w.owners[0] : 5;
  let zap = chance(0.2) ? 0 : Math.round(rf(0, 400) * 100) / 100;
  let kosztArmii = chance(0.5) ? 0 : Math.round(rf(0, 60) * 100) / 100;
  const spMap = chance(0.5) ? w.spichlerzByCity : undefined;
  const popCap = chance(0.7) ? popCapMapFor(w) : undefined;
  const onlyAuto = chance(0.4);
  let flow = chance(0.5);
  if (tune) {
    // runda 2b (tylko edge.json): koszt armii zblizony do biezacej nadwyzki produkcji i dodatnia rezerwa, wiec
    // kryterium FLOW (nadwyzka - koszt >= 0, `requireFlowBalance`) rozni sie od kryterium zapasowego
    // (nadwyzka + zapasy - koszt >= 0) - zamyka mutanta [107] "raise - flow dla gracza"; wlasciciel = pierwszy fotel
    const nad = EF.computeEmpireCityFoodNadwyzka(econ.perCity, ownerId);
    kosztArmii = Math.round(Math.max(0.1, Math.abs(nad) * rf(0.4, 1.6)) * 100) / 100;
    zap = Math.round(rf(30, 400) * 100) / 100;
    flow = true;
  }
  const cities = clone(w.cities);
  const econCopy = clone(econ);
  const base = {
    cities: clone(w.cities), econ: clone(econ), ownerId, zap, kosztArmii,
    spichlerz: spMap ? [...spMap.entries()] : null,
    popCap: popCap ? [...popCap.entries()] : null,
    onlyAuto, flow,
  };
  if (kind === 'plan') {
    const plan = EF.resolveEqualGrowthRationPlan({
      ownerId, cities, econ: econCopy, zapasyPrzed: zap, rationParams: RATION_PARAMS,
      spichlerzByCity: spMap, onlyAutoManaged: onlyAuto, requireFlowBalance: flow, kosztArmii, popCapByCityId: popCap,
    });
    return { ...base, out: { plan, citiesAfter: levelsOf(cities), econAfter: econCopy } };
  }
  if (kind === 'balance') {
    const r = EF.autoBalanceRationsToSolvency({
      ownerId, cities, econ: econCopy, zapasyPrzed: zap, rationParams: RATION_PARAMS,
      spichlerzByCity: spMap, onlyAutoManaged: onlyAuto, requireFlowBalance: flow, kosztArmii, popCapByCityId: popCap,
    });
    return { ...base, out: { result: r, citiesAfter: levelsOf(cities), econAfter: econCopy } };
  }
  if (kind === 'raise') {
    const surplus = tune ? true : chance(0.5);
    const r = EF.autoRaiseRationsForGrowth({
      ownerId, cities, econ: econCopy, zapasyPrzed: zap, rationParams: RATION_PARAMS,
      spichlerzByCity: spMap, requireProductionSurplus: surplus, onlyAutoManaged: onlyAuto, kosztArmii, popCapByCityId: popCap,
    });
    return { ...base, surplus, out: { result: r, citiesAfter: levelsOf(cities), econAfter: econCopy } };
  }
  // maxSafe
  const target = pick(w.cities.map((c) => c.id).concat(['brak']));
  const human = pick([undefined, [0], [1], [0, 1], []]);
  const out = EF.maxSafePoziomRacjiForCity({
    cityId: target, ownerId, cities, econ: econCopy, zapasyPrzed: zap, rationParams: RATION_PARAMS,
    spichlerzByCity: spMap, kosztArmii, popCapByCityId: popCap, humanOwnerIds: human,
  });
  return { ...base, target, human: human === undefined ? { absent: true } : human, out: { level: out, citiesAfter: levelsOf(cities), econAfter: econCopy } };
}
for (let i = 0; i < 70; i++) empire.plan.push(planScenario('plan', i));
for (let i = 0; i < 70; i++) empire.balance.push(planScenario('balance', i));
for (let i = 0; i < 70; i++) empire.raise.push(planScenario('raise', i));
for (let i = 0; i < 70; i++) empire.maxSafe.push(planScenario('maxSafe', i));

// ---------------------------------------------------------------------------
// 5. post_central.json: applyPostCentralPopulationGrowth / applyCentralFoodPopulationGrowth
// ---------------------------------------------------------------------------
const postCentral = { scenarios: [] };
function postCentralScenario(deleteFed, siege = false) {
  const w = makeWorld({ owners: pick([[0], [0, 1], [1, 0, 2]]), minCities: 1, maxCities: 5 });
  for (const c of w.cities) {
    // bez wartosci specjalnych w populacji: sciezka rebalance/manpower dziala na liczbach naturalnych
    if (chance(0.5)) c.okolicaTryb = 'auto';
  }
  const econ = settledEcon(w);
  const units = makeUnits(w.owners);
  const states = new Map();
  for (const o of w.owners) if (chance(0.6)) states.set(o, { zapasyPanstwa: Math.round(rf(0, 300) * 100) / 100, turyUjemnychZapasow: 0 });
  const params = EF.buildEmpireFoodParams(econParamsRaw, 'normal');
  EF.clearLastEmpireFoodTicks();
  const armyCost = {};
  for (const o of [...new Set([...units.map((u) => u.ownerId), ...w.owners])]) armyCost[o] = TE.militaryFoodConsumptionWithSpichlerz(units, o, upkeep, FOOD_TABLE);
  const efRes = EF.advanceEmpireFood(econ, units, states, upkeep, params, FOOD_TABLE, w.builtByCity, undefined);
  if (deleteFed) {
    // migawka z brakujacymi wpisami `fedByCityId` (web: `?? false`); tylko w edge.json
    for (const ot of efRes.perOwner) for (const k of [...ot.fedByCityId.keys()]) if (chance(0.4)) ot.fedByCityId.delete(k);
  }
  if (siege) {
    // runda 2: miasto oblezone PO zlozeniu migawki centrali (wiersze `perCityRows` nadal je zawieraja);
    // `advanceEmpireFood` nie wystawia wierszy oblezonych miast, wiec bez tego `tick.oblegany` w
    // `applyPostCentralPopulationGrowth` (population-growth-v85.ts:481) jest nieosiagalne.
    let any = false;
    for (const t of econ.perCity) {
      if (chance(0.5)) { t.oblegany = true; any = true; }
    }
    if (!any) econ.perCity[0].oblegany = true;
  }
  const efBefore = norm(efRes.perOwner);

  const d = pick(['easy', 'normal', 'hard']);
  const ownerCiv = new Map();
  for (const o of w.owners) if (chance(0.8)) ownerCiv.set(o, pick(CIV_KEYS.filter((k) => typeof k === 'string' && k)));
  const happiness = new Map();
  for (const c of w.cities) if (chance(0.7)) happiness.set(c.id, ri(-10, 80));
  const eraByOwner = new Map();
  for (const o of w.owners) if (chance(0.7)) eraByOwner.set(o, pick([1, 2, 3, 4, 5, 7]));
  const matrixByOwner = new Map();
  for (const o of w.owners) {
    if (chance(0.4)) {
      matrixByOwner.set(o, pick([
        { hungerLossMultiplier: 1.5, healthGrowthMultiplier: 1.25, happinessBase: 2, populationCapDelta: 1 },
        { hungerLossMultiplier: 0.5, healthGrowthMultiplier: 0, happinessBase: 0, populationCapDelta: 2 },
        { hungerLossMultiplier: 2.25, healthGrowthMultiplier: 0.85, happinessBase: 0, populationCapDelta: -1 },
      ]));
    }
  }
  const civBonusy = new Map();
  for (const o of w.owners) {
    if (chance(0.5)) {
      civBonusy.set(o, [
        { typ: 'bonus_pobor_pula', wartosc: pick([0.25, 1, -0.5]) },
        { typ: 'mnoznik_manpower_max', wartosc: pick([1.5, 2, 0.5]) },
        { typ: 'bonus_pobor_regen', wartosc: 1 },
        { typ: 'inne', wartosc: 'x' },
      ].slice(0, ri(1, 4)));
    }
  }
  const citizenGrowth = new Map();
  for (const c of w.cities) if (chance(0.5)) citizenGrowth.set(c.id, pick([0, -1, -3, 2, -7.5]));
  const exclude = new Map();
  for (const c of w.cities) if (chance(0.3)) exclude.set(c.id, new Set(['1,2', '3,4']));
  const spMap = chance(0.5) ? w.spichlerzByCity : undefined;
  const builtMap = chance(0.85) ? w.builtByCity : undefined;
  const econParams = chance(0.7) ? parametry.popCapEcon[d] : { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 };
  const cities = clone(w.cities);
  const citiesBefore = clone(w.cities);
  const calls = [];
  const via = pick(['post', 'central2', 'efAlias']);
  const optsBase = {
    cities, econ, map: { hexes: new Map() }, territoryNodes: [], econParams, rationParams: RATION_PARAMS,
    ownerCivByOwnerId: ownerCiv, spichlerzByCity: spMap, happinessByCityId: happiness, builtByCity: builtMap,
    ownerEraByOwner: eraByOwner, difficulty: d, populationMatrixByOwnerId: matrixByOwner, civBonusyByOwner: civBonusy,
    citizenGrowthPctByCityId: citizenGrowth,
    onCityPopulationChanged: (id) => calls.push(id),
    excludeHexKeysByCity: exclude,
  };
  const econBefore = clone(econ);
  if (via === 'central2') {
    PG.applyCentralFoodPopulationGrowth(efRes, optsBase);
  } else if (via === 'efAlias') {
    EF.applyCentralFoodPopulationGrowth({ ...optsBase, efResult: efRes });
  } else {
    PG.applyPostCentralPopulationGrowth({ ...optsBase, efResult: { perOwner: efRes.perOwner } });
  }
  return {
    d, via,
    cities: citiesBefore, econ: econBefore, ef: efBefore,
    ownerCiv: [...ownerCiv.entries()], happiness: [...happiness.entries()], eraByOwner: [...eraByOwner.entries()],
    matrixByOwner: [...matrixByOwner.entries()], civBonusy: [...civBonusy.entries()],
    citizenGrowth: [...citizenGrowth.entries()],
    exclude: [...exclude.entries()].map(([k, v]) => [k, [...v]]),
    spichlerz: spMap ? [...spMap.entries()] : null,
    built: builtMap ? [...builtMap.entries()] : null,
    econParams,
    out: {
      cities: cities.map(cityOut), econ, efPerOwner: efRes.perOwner, calls,
      manpowerCheck: cities.map((c) => c.manpower),
    },
  };
}
for (let i = 0; i < 100; i++) postCentral.scenarios.push(postCentralScenario(false));

// jawny test hook MP (czy prawdziwy refreshManpowerAfterPopChange dziala jak w Rust): losowe wejscia
const manpower = [];
for (let i = 0; i < 300; i++) {
  const city = { population: ri(0, 20) };
  if (chance(0.7)) city.manpower = chance(0.1) ? pick([NaN, Infinity]) : ri(0, 200);
  const epoka = pick([1, 2, 3, 4, 5, 7]);
  const prev = chance(0.2) ? undefined : ri(0, 20);
  const mult = pick([1, 0.5, 2, 1.5, 0.05]);
  manpower.push({ city, epoka, prev: prev === undefined ? { absent: true } : prev, mult, out: MP.refreshManpowerAfterPopChange(city, epoka, prev, mult) });
}

write('params.json', parametry);
write('tempo_stawki.json', tempoStawki);
write('growth.json', growth);
write('empire.json', empire);
write('post_central.json', postCentral);
write('manpower.json', manpower);

// ---------------------------------------------------------------------------
// 6. edge.json: przypadki graniczne dobrane PO mutacjach (osobny PRNG; wygenerowane wyzej pliki sie nie zmieniaja)
// ---------------------------------------------------------------------------
rnd = mulberry32(0x67aed9e);
const edge = { advance: [], simulate: [], postCentral: [] };
// (a) ulamkowa karencja glodu wojska: odliczanie `max(1, karencja - tury)` (empire-food.ts:357) rozni sie od
//     `karencja - tury`, gdy 0 < karencja - tury < 1
for (let i = 0; i < 40; i++) {
  const w = makeWorld({ owners: pick([[0], [0, 1]]) });
  const econ = settledEcon(w);
  const units = makeUnits(w.owners);
  for (let k = 0; k < 8; k++) units.push({ ownerId: w.owners[0], typeId: 'Katapulta', camping: false, onOwnTerritory: false });
  const unitOwners = units.map((u) => u.ownerId);
  const states = new Map();
  for (const o of w.owners) states.set(o, { zapasyPanstwa: Math.round(rf(0, 30) * 100) / 100, turyUjemnychZapasow: ri(0, 3) });
  const rawParams = { glod_wojska_karencja_tur: { normal: pick([0.5, 1.5, 2.5, 3.5, 4.25]) } };
  const params = EF.buildEmpireFoodParams(rawParams, 'normal');
  const armyCost = {};
  for (const o of [...new Set([...unitOwners, ...w.owners])]) armyCost[o] = TE.militaryFoodConsumptionWithSpichlerz(units, o, upkeep, FOOD_TABLE);
  EF.clearLastEmpireFoodTicks();
  EF.bindEmpireFoodRuntime(states);
  const statesBefore = norm(states);
  const econBefore = clone(econ);
  const res = EF.advanceEmpireFood(econ, units, states, upkeep, params, FOOD_TABLE, w.builtByCity, undefined);
  const accOwners = [...new Set([...unitOwners, ...w.owners, -1, 99])];
  const acc = accOwners.map((o) => ({
    o,
    reserve: EF.getEmpireFoodReserve(o),
    maxCap: EF.getEmpireFoodMaxCap(o),
    hungry: EF.isArmyHungry(o),
    starving: EF.isArmyStarving(o),
    countdown: (() => { const c = EF.getArmyStarvationCountdown(o, params.glodWojskaKarencjaTur); return c === null ? { isNull: true } : c; })(),
    last: EF.getLastEmpireFoodTick(o) ?? null,
  }));
  // runda 2b: cykl zycia runtime po `advanceEmpireFood` (zamyka mutanty [84] i [85])
  //  (i) `clearLastEmpireFoodTicks` po realnym advance czysci tiki ORAZ `_maxCapByOwner` (empire-food.ts:369-372),
  //  (ii) `_setLastEmpireFoodTicks` (eksport weba) wstrzykuje tik wlasciciela -1 (barbarzynca) z glodWojska i
  //       glodWojskaAtrycjaAktywna = true: guardy `isBarbarian` w isArmyHungry/isArmyStarving (empire-food.ts:345,351)
  //       sa nieosiagalne przez sama `advanceEmpireFood` (pomija barbarzyncow, empire-food.ts:216).
  const realTicks = new Map();
  for (const o of accOwners) {
    const t = EF.getLastEmpireFoodTick(o);
    if (t) realTicks.set(o, t);
  }
  const accessorsOf = (owners, kar) => owners.map((o) => ({
    o,
    reserve: EF.getEmpireFoodReserve(o),
    maxCap: EF.getEmpireFoodMaxCap(o),
    hungry: EF.isArmyHungry(o),
    starving: EF.isArmyStarving(o),
    countdown: (() => { const c = EF.getArmyStarvationCountdown(o, kar); return c === null ? { isNull: true } : c; })(),
    last: EF.getLastEmpireFoodTick(o) ?? null,
  }));
  EF.clearLastEmpireFoodTicks();
  const accAfterClear = accessorsOf(accOwners, params.glodWojskaKarencjaTur);
  const baseTick = realTicks.get(w.owners[0]);
  let injected = null;
  if (baseTick) {
    const injTick = { ...baseTick, ownerId: -1, glodWojska: true, glodWojskaAtrycjaAktywna: true };
    const injMap = new Map(realTicks);
    injMap.set(-1, injTick);
    EF._setLastEmpireFoodTicks(injMap);
    injected = { baseOwner: w.owners[0], tick: injTick, accessors: accessorsOf([...accOwners, -1], params.glodWojskaKarencjaTur) };
  }
  edge.advance.push({
    params, d: 'normal', raw: rawParams, cities: w.cities, econ: econBefore, unitOwners, armyCost, statesBefore,
    built: [...w.builtByCity.entries()], eraByOwner: null,
    out: { perOwner: res.perOwner, byOwnerKeys: [...res.byOwner.keys()], statesAfter: states, accessors: acc, accessorsAfterClear: accAfterClear, injected },
  });
}
// (b) ujemne zapasy "przed" w symulacjach puli (clamp `max(0, central)` w empire-food.ts:446,484)
for (let i = 0; i < 80; i++) {
  const w = makeWorld({ owners: [0, 1] });
  const econ = settledEcon(w);
  const owner = pick([0, 1]);
  const zap = -Math.round(rf(1, 120) * 100) / 100;
  const koszt = chance(0.5) ? 0 : Math.round(rf(0, 60) * 100) / 100;
  const rawTicks = clone(econ.perCity);
  edge.simulate.push({
    owner, zap, koszt, ticks: rawTicks,
    nadwyzka: EF.computeEmpireCityFoodNadwyzka(rawTicks, owner),
    pool: EF.simulateCityFoodCentralPool(zap, rawTicks, owner),
    allFed: EF.simulateCityFoodAllFed(zap, rawTicks, owner),
    solvent: EF.isEmpireCityFoodSolvent(zap, rawTicks, owner, koszt),
    solventDefault: EF.isEmpireCityFoodSolvent(zap, rawTicks, owner),
  });
}
// (c) migawka efResult bez wpisow `fedByCityId` dla czesci miast (`?? false` w population-growth-v85.ts:489)
for (let i = 0; i < 40; i++) edge.postCentral.push(postCentralScenario(true));
// (d) runda 2: oblezone miasta w migawce centrali (zamyka mutanta "p: oblegane miasto")
edge.postCentralSiege = [];
for (let i = 0; i < 40; i++) edge.postCentralSiege.push(postCentralScenario(false, true));

// (e) runda 2: macierz SYNTETYCZNA (zamyka mutanty `max(0, 1 + x)` dla lud_spadek_proc / lud_zdrowie_proc).
//     W prawdziwym civ-matrix.json (pin) lud_spadek_proc = lud_zdrowie_proc = 0 dla KAZDEJ cywilizacji, wiec
//     galaz `1 + x < 0` nie byla osiagalna. Ten sam kod weba (`resolvePopulationMatrixForCiv`,
//     `resolvePopulationCapMatrixDelta`) uruchamiany na danych `loadCivMatrix()` zmienionych w miejscu
//     (zero stubow logiki); po kazdym przypadku macierz jest przywracana.
rnd = mulberry32(0x67a5717);
const CM = (await import(src('game/civ-matrix.ts'))).loadCivMatrix();
const CM_ORIG = structuredClone(CM);
const HUNGER_POOL = [-3, -2, -1.5, -1, -0.999, -0.5, 0, 0.25, 0.5, 1, 1.5, 2];
const LIMIT_POOL = [-2, -1, 0, 0.5, 1, 2, 3, 4];
const edgeMatrix = [];
for (let i = 0; i < 40; i++) {
  const patch = { defaults: {}, rows: [] };
  if (chance(0.5)) patch.defaults.lud_spadek_proc = pick(HUNGER_POOL);
  if (chance(0.5)) patch.defaults.lud_zdrowie_proc = pick(HUNGER_POOL);
  if (chance(0.3)) patch.defaults.lud_zadowolenie_bazowe = pick([-2, 0.5, 3]);
  if (chance(0.3)) patch.defaults.lud_limit_populacji = pick(LIMIT_POOL);
  const nRows = ri(2, 5);
  const used = new Set();
  while (patch.rows.length < nRows) {
    const idx = ri(0, CM_ORIG.cywilizacje.length - 1);
    if (used.has(idx)) continue;
    used.add(idx);
    const params = {};
    if (chance(0.7)) params.lud_spadek_proc = pick(HUNGER_POOL);
    if (chance(0.7)) params.lud_zdrowie_proc = pick(HUNGER_POOL);
    if (chance(0.4)) params.lud_zadowolenie_bazowe = pick([-2, -0.5, 0, 1, 2.5]);
    if (chance(0.5)) params.lud_limit_populacji = pick(LIMIT_POOL);
    patch.rows.push({ ikonaId: CM_ORIG.cywilizacje[idx].ikonaId, params });
  }
  for (const [k, v] of Object.entries(patch.defaults)) CM.defaults[k] = v;
  for (const pr of patch.rows) {
    const row = CM.cywilizacje.find((c) => c.ikonaId === pr.ikonaId);
    Object.assign(row.params, pr.params);
  }
  const keys = [];
  for (const pr of patch.rows) {
    const row = CM.cywilizacje.find((c) => c.ikonaId === pr.ikonaId);
    keys.push(row.ikonaId, row.typCywilizacji, row.Cywilizacja, row.ikonaId.toUpperCase());
  }
  keys.push('nieznana', '');
  const cases = keys.map((k) => ({ civ: k, out: PG.resolvePopulationMatrixForCiv(k), capDelta: EC.resolvePopulationCapMatrixDelta(k) }));
  cases.push({ civ: { absent: true }, out: PG.resolvePopulationMatrixForCiv(undefined), capDelta: EC.resolvePopulationCapMatrixDelta(undefined) });
  edgeMatrix.push({ patch, cases });
  // przywrocenie macierzy (w miejscu: ta sama referencja co w civ-matrix.ts)
  for (const k of Object.keys(CM.defaults)) delete CM.defaults[k];
  Object.assign(CM.defaults, structuredClone(CM_ORIG.defaults));
  CM.cywilizacje.splice(0, CM.cywilizacje.length, ...structuredClone(CM_ORIG.cywilizacje));
}
edge.matrixSynth = edgeMatrix;

// (g) runda 2b: scenariusze auto-raise / plan / balance z kryterium FLOW (gracz) przy dodatniej rezerwie i
//     koszcie armii bliskim nadwyzce (zamyka mutanta [107]); `planScenario(kind, i, true)`.
rnd = mulberry32(0x67a9f10);
edge.raiseFlow = [];
edge.planFlow = [];
edge.balanceFlow = [];
for (let i = 0; i < 60; i++) edge.raiseFlow.push(planScenario('raise', i, true));
for (let i = 0; i < 40; i++) edge.planFlow.push(planScenario('plan', i, true));
for (let i = 0; i < 40; i++) edge.balanceFlow.push(planScenario('balance', i, true));
write('edge.json', edge);
writeFileSync(join(outDir, 'SHA256SUMS.txt'), Object.entries(hashes).map(([k, v]) => `${v}  ${k}`).join('\n') + '\n');
console.log(JSON.stringify(hashes, null, 1));
