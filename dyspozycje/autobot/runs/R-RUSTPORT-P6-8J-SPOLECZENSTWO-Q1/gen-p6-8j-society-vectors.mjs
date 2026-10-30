// P6.8J-P1 (society-breakdown.ts, pin 91dc998a): wektory z URUCHOMIONEGO weba (poza repo).
// Uruchomienie (Node 22, z katalogu tego runu, z WEB_ROOT = wyeksportowany pin 91dc998a, gra/src + gra/data):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8j-society-vectors.mjs <WEB_ROOT> <PLIK_WYJSCIA.json>
// Kodowanie: number | {$n:"NaN"|"Infinity"|"-Infinity"|"-0"} | {$f:"<String(x)>"} | {$undef:true} | null.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve as presolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outFile = presolve(process.argv[3]);
mkdirSync(dirname(outFile), { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

const SB = await import(src('game/society-breakdown.ts'));
const SOC = JSON.parse(readFileSync(join(webRoot, 'gra/data/society-params.json'), 'utf8'));

const enc = (x) => {
  if (x === undefined) return { $undef: true };
  if (x === null) return null;
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x) && Math.abs(x) <= Number.MAX_SAFE_INTEGER) return x;
  return { $f: String(x) };
};
const encObj = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));
const encLines = (ls) => ls.map((l) => ({ id: l.id, label: l.label, value: enc(l.value) }));
const encHappy = (b) => ({ lines: encLines(b.lines), netto: enc(b.netto), szMax: enc(b.szMax), szPct: enc(b.szPct) });
const encLaw = (b) => ({ lines: encLines(b.lines), netto: enc(b.netto), prawMax: enc(b.prawMax), prawPct: enc(b.prawPct) });

const SOCIETY_SETS = {
  none: null,
  pelny: SOC,
  pusty: {},
  zlySzablon: { szczescie: { szczescie_max_epoka: { normal: [] }, szczescie_pct_cap: { normal: 'x' } }, prawo: { prawo_max_epoka: { normal: [0, NaN] } } },
  nanLiczby: { szczescie: { szczescie_max_pop_wspolczynnik: { normal: NaN }, szczescie_max_pop_odniesienia: { normal: 3.9 } } },
  ujemne: { prawo: { prawo_max_pop_wspolczynnik: { normal: -0.5 }, prawo_max_pop_odniesienia: { normal: -2 } }, szczescie: { szczescie_podatki_prog_pct: { normal: 0 } } },
};
const DIFFS = ['easy', 'normal', 'hard'];

const NUMS = [-5, -1, -0, 0, 0.04, 0.5, 1, 1.5, 2, 3, 3.9, 4, 4.5, 5, 9, 10, 12, 25, 50, 99.95, 100, 120, 170, 1000, NaN, Infinity, -Infinity];
const ERAS = [-1, 0, 0.5, 1, 1.9, 2, 3, 4, 7, NaN, Infinity];
const POPS = [-3, 0, 1, 2, 3, 4, 5, 6, 12, 40, 200, 2.7, NaN, Infinity];

const scaleCases = [];
for (const [sn, s] of Object.entries(SOCIETY_SETS)) {
  for (const d of DIFFS) {
    const sc = SB.loadSocietyScaleParams(s, d);
    scaleCases.push({ society: sn, difficulty: d, expected: {
      szMaxByEra: sc.szMaxByEra.map(enc), prawMaxByEra: sc.prawMaxByEra.map(enc),
      prawGarnizonBudynekByEra: sc.prawGarnizonBudynekByEra.map(enc), kultReligByEra: sc.kultReligByEra.map(enc),
      szPctCap: enc(sc.szPctCap), prawPctCap: enc(sc.prawPctCap), szMaxPopWsp: enc(sc.szMaxPopWsp),
      prawMaxPopWsp: enc(sc.prawMaxPopWsp), szMaxPopOdniesienia: enc(sc.szMaxPopOdniesienia),
      prawMaxPopOdniesienia: enc(sc.prawMaxPopOdniesienia) } });
  }
}

const fnCases = [];
for (const [sn, s] of Object.entries(SOCIETY_SETS)) {
  for (const d of DIFFS) {
    const sc = SB.loadSocietyScaleParams(s, d);
    for (const era of ERAS) {
      fnCases.push({ society: sn, difficulty: d, era: enc(era),
        szMaxForEra: enc(SB.szMaxForEra(era, sc)), prawMaxForEra: enc(SB.prawMaxForEra(era, sc)),
        prawGarnizonBudynekForEra: enc(SB.prawGarnizonBudynekForEra(era, sc)),
        kultReligScaleForEra: enc(SB.kultReligScaleForEra(era, sc)) });
    }
    for (const pop of POPS) {
      fnCases.push({ society: sn, difficulty: d, population: enc(pop),
        szMaxForCity: enc(SB.szMaxForCity(2, pop, sc)), prawMaxForCity: enc(SB.prawMaxForCity(2, pop, sc)),
        szMaxForCityEra1: enc(SB.szMaxForCity(1, pop, sc)), prawMaxForCityEra3: enc(SB.prawMaxForCity(3, pop, sc)),
        osiedlePopLabel: SB.osiedlePopLabel(pop), osiedlePopMax: enc(SB.osiedlePopMax(s, d)),
        isOsiedleRevoltImmune: SB.isOsiedleRevoltImmune(pop, s, d),
        luksus: enc(SB.luksusHappinessBonus(pop, s, d)) });
    }
    for (const n of NUMS) {
      fnCases.push({ society: sn, difficulty: d, netto: enc(n),
        clampPct100: enc(SB.clampPct(n, 100)), clampPct120: enc(SB.clampPct(n, 120)),
        pctFromNetto50: enc(SB.pctFromNetto(n, 50, 120)), pctFromNettoMax0: enc(SB.pctFromNetto(n, 0, 120)),
        pctFromNettoMaxNeg: enc(SB.pctFromNetto(n, -4, 170)),
        proporcjonalne: enc(SB.proporcjonalneSzczescie(n, 0.75)),
        proporcjonalneNaN: enc(SB.proporcjonalneSzczescie(16, n)),
        ownShare: enc(SB.ownShareFromSignal(n)),
        luksus: enc(SB.luksusHappinessBonus(n, s, d)) });
    }
  }
}

const osiedleCases = [];
for (const [sn, s] of Object.entries(SOCIETY_SETS)) {
  for (const d of DIFFS) {
    for (const pop of POPS) {
      const sz = s?.szczescie ?? {};
      const pr = s?.prawo ?? {};
      osiedleCases.push({ society: sn, difficulty: d, population: enc(pop),
        szOsiedle: enc(SB.pickOsiedlePopBonus(sz, 'szczescie_bonus_osiedle_pop', pop, d, 7)),
        prOsiedle: enc(SB.pickOsiedlePopBonus(pr, 'prawo_bonus_osiedle_pop', pop, d, 0)) });
    }
    osiedleCases.push({ society: sn, difficulty: d, revolt: SB.loadRevoltParams(s, d) });
  }
}

const HAPPY_INPUTS = [
  { name: 'pusty', in: { population: 0, buildingZadowolenie: 0 } },
  { name: 'typowe', in: { difficulty: 'normal', era: 2, population: 5, buildingZadowolenie: 12, haRel: 0.5, ownCultureShare: 0.75, haWealth: 10, haCuda: 6, podzialHandlu: { procentLuksus: 45 }, atWar: true, stolicaEasyBonus: true, citizenResourceHappinessDelta: 4 } },
  { name: 'udzialy', in: { difficulty: 'hard', era: 3, population: 30, buildingZadowolenie: -3, ownReligionShare: 0.2, ownCultureShare: 0.1, haWealth: -2, podzialHandlu: { procentLuksus: 100 } } },
  { name: 'podatkiNisko', in: { difficulty: 'easy', era: 1, population: 1, buildingZadowolenie: 0, podzialHandlu: { procentLuksus: 0 }, haRel: -1 } },
  { name: 'nanPop', in: { difficulty: 'normal', era: 2, population: NaN, buildingZadowolenie: 5, haRel: NaN, ownCultureShare: NaN } },
  { name: 'nanEra', in: { difficulty: 'normal', era: NaN, population: 4, buildingZadowolenie: 1 } },
  { name: 'zeroCzesci', in: { difficulty: 'normal', era: 1, population: 4, buildingZadowolenie: 0, ownCultureShare: 0.5, ownReligionShare: 0.5 } },
  { name: 'udzialPoza', in: { difficulty: 'normal', era: 2, population: 2, buildingZadowolenie: 0, ownCultureShare: 1.7, ownReligionShare: -0.4 } },
];
const happyCases = [];
for (const hc of HAPPY_INPUTS) {
  for (const [sn, s] of Object.entries(SOCIETY_SETS)) {
    const input = { ...hc.in };
    const out = SB.computeHappinessBreakdown(input, s);
    happyCases.push({ name: hc.name, society: sn, input: encObj(input), expected: encHappy(out) });
  }
}

const LAW_INPUTS = [
  { name: 'pusty', in: { garnizonCount: 0 } },
  { name: 'pelny', in: { difficulty: 'normal', era: 2, population: 3, garnizonCount: 7, hasDomStarszyzny: true, hasDworZarzadcy: true, hasPretorium: true, hasSad: true, hasTrybunal: true, palacTier: 3, hasGarnizonBudynek: true, stolicaEasyBonus: true } },
  { name: 'palacLegacy', in: { difficulty: 'hard', era: 3, population: 50, garnizonCount: 2, hasPalac: true, palacTier: null } },
  { name: 'palac2', in: { difficulty: 'easy', era: 1, population: 0, garnizonCount: -4, hasPalac: true, palacTier: 2 } },
  { name: 'nanPop', in: { difficulty: 'normal', era: 2, population: NaN, garnizonCount: NaN, hasGarnizonBudynek: true } },
  { name: 'nanEra', in: { difficulty: 'normal', era: NaN, population: 4, garnizonCount: 1, hasGarnizonBudynek: true } },
  { name: 'osada', in: { difficulty: 'normal', era: 1, population: 2, garnizonCount: 0 } },
];
const lawCases = [];
for (const lc of LAW_INPUTS) {
  for (const [sn, s] of Object.entries(SOCIETY_SETS)) {
    const input = { ...lc.in };
    const out = SB.computeLawBreakdown(input, s);
    lawCases.push({ name: lc.name, society: sn, input: encObj(input), expected: encLaw(out) });
  }
}

// ---- Partia 2: PorPct, pasma, efekty, rozbicie wkladu, macierz, laska buntu (P2) ----
const OR = await import(src('game/order.ts'));
const encOrder = (o) => ({
  porPct: enc(o.porPct), tier: o.tier, band: o.band, bandLabel: o.bandLabel,
  effects: encObj(o.effects), wagaSz: enc(o.wagaSz), wagaPraw: enc(o.wagaPraw),
  szNetto: enc(o.sz.netto), szMax: enc(o.sz.szMax), szPct: enc(o.sz.szPct), szLines: encLines(o.sz.lines),
  prawNetto: enc(o.prawo.netto), prawPct: enc(o.prawo.prawPct),
});
const PORS = [-5, 0, 11.9, 12, 12.0000001, 29.9, 30, 49.99, 50, 69.9, 70, 89.9, 90, 100, 120, 170, NaN, Infinity, -Infinity];
const CRITS = [12, 0, 5, 40, NaN, -3, Infinity];
const bandCases = [];
for (const p of PORS) for (const c of CRITS) {
  const b = SB.porPctBand(p, c);
  bandCases.push({ porPct: enc(p), crit: enc(c), band: b, bandLabel: SB.POR_BAND_LABELS[b] });
}
const tierCases = PORS.map((p) => ({ porPct: enc(p), tier: SB.tierFromPorPct(p) }));
const effectsCases = [];
for (const [sn, s] of Object.entries(SOCIETY_SETS)) for (const d of ['normal', 'hard']) {
  const params = OR.loadOrderParams(s, d);
  for (const p of PORS) for (const c of [12, 40, NaN]) {
    effectsCases.push({ society: sn, difficulty: d, porPct: enc(p), crit: enc(c),
      effects: encObj(SB.orderEffectsFromPorPct(p, params, c)) });
  }
}
const PORPCT_PAIRS = [[0, 0], [100, 0], [0, 100], [50, 50], [120, 170], [NaN, 50], [50, NaN], [Infinity, 1], [-5, 200], [33.3, 66.6]];
const porPctCases = [];
for (const [sn, s] of Object.entries(SOCIETY_SETS)) for (const d of DIFFS) {
  const params = OR.loadOrderParams(s, d);
  for (const [a, b] of PORPCT_PAIRS) {
    porPctCases.push({ society: sn, difficulty: d, sz: enc(a), praw: enc(b), porPct: enc(SB.computePorPct(a, b, params)) });
  }
}
const CONTRIB = [[50, 50, 1, 1], [80, 20, 1, 1], [0, 0, 0.5, 0.5], [0, 0, 0, 0], [0, 0, 1, 3], [10, 0, 0, 0], [NaN, 30, 1, 1], [30, 30, NaN, 1], [30, 30, -1, 1], [30, 30, 2, -1], [33, 33, 1, 2], [100, 100, 1, 0], [-10, 50, 1, 1], [Infinity, 5, 1, 1]];
const contribCases = CONTRIB.map(([a, b, c, d2]) => {
  const r = SB.orderContributionPct(a, b, c, d2);
  return { sz: enc(a), praw: enc(b), wSz: enc(c), wPraw: enc(d2), szWklad: enc(r.szWkladPct), prawWklad: enc(r.prawWkladPct) };
});
const ORDER_SOCS = ['pelny', 'none', 'zlySzablon', 'ujemne'];
const orderBreakdownCases = [];
for (const hc of HAPPY_INPUTS) for (const lc of LAW_INPUTS) for (const sn of ORDER_SOCS) for (const d of ['normal', 'hard']) {
  const s = SOCIETY_SETS[sn];
  const o = SB.evaluateOrderFromBreakdown({ ...hc.in }, { ...lc.in }, s, d);
  orderBreakdownCases.push({ happy: hc.name, law: lc.name, society: sn, difficulty: d, expected: encOrder(o) });
}
// Surowe wartosci, dla ktorych netto*(1+raw) == netto (delta === 0 mimo raw !== 0 i skonczonego):
// 1e-17 (1+1e-17 === 1), -1e-17, 5e-324 (denormal). Dla netto == 0 delta === 0 zawsze.
const RAWS = [0, -0, NaN, Infinity, -Infinity, -0.2, 0.25, 1.5, -1, -1.5, 1e-9, 1e-17, -1e-17, 5e-324];
const matrixCases = [];
for (const hn of ['typowe', 'udzialy', 'pusty', 'nanPop']) {
  const hc = HAPPY_INPUTS.find((h) => h.name === hn);
  for (const sn of ['pelny', 'none', 'ujemne']) for (const d of ['normal', 'hard']) {
    const s = SOCIETY_SETS[sn];
    const base = SB.evaluateOrderFromBreakdown({ ...hc.in }, { garnizonCount: 2 }, s, d);
    for (const raw of RAWS) {
      const out = SB.applyCivMatrixHappinessModifier(base, raw, s, d);
      matrixCases.push({ happy: hn, society: sn, difficulty: d, raw: enc(raw), expected: encOrder(out) });
    }
    // Niespojny order (reczny szPct, sz ssprzeczny z netto): web przy raw === 0 zwraca order bez zmian
    // (guard `raw === 0`, society-breakdown.ts:1080), a dla raw != 0 przelicza szPct z netto.
    // Rust musi odtworzyc ten sam order: pole `tamper` mowi, ze base.sz.szPct += 7 przed wywolaniem.
    const tampered = { ...base, sz: { ...base.sz, szPct: base.sz.szPct + 7 } };
    for (const raw of [0, -0, 0.25, 1e-17]) {
      const out = SB.applyCivMatrixHappinessModifier(tampered, raw, s, d);
      matrixCases.push({ happy: hn, society: sn, difficulty: d, raw: enc(raw), tamper: 'szPctPlus7', expected: encOrder(out) });
    }
  }
}
const REVOLTS = [
  { criticalPorPct: 12, graceTurns: 3 }, { criticalPorPct: 5, graceTurns: 2.7 },
  { criticalPorPct: NaN, graceTurns: -1 }, { criticalPorPct: 12, graceTurns: NaN }, { criticalPorPct: 12, graceTurns: Infinity },
];
const GRACE_CURR = [null, undefined, -1, 0, 0.5, 1, 2, 3, NaN, 7];
const GRACE_PORS = [11.9, 12, 13, 0, NaN, 40, Infinity, -1];
const graceCases = [];
for (const cg of GRACE_CURR) for (const p of GRACE_PORS) for (const rv of REVOLTS) {
  graceCases.push({ currentGrace: cg === undefined ? { $undef: true } : enc(cg), porPct: enc(p), revolt: encObj(rv),
    expected: encObj(SB.updateRevoltGrace(cg, p, rv)) });
}
const MSG_LEFT = [null, -1, 0, 0.5, 1, 2, 3, 2.5, NaN, Infinity];
const messageCases = MSG_LEFT.map((g) => ({ left: enc(g), msg: SB.revoltWarningMessage('Kraków', g) }));
const order = {
  bands: bandCases, tiers: tierCases, effects: effectsCases, porPct: porPctCases,
  contribution: contribCases, breakdown: orderBreakdownCases, matrix: matrixCases,
  grace: graceCases, messages: messageCases,
};

const doc = {
  pin: PIN,
  order,
  generator: 'gen-p6-8j-society-vectors.mjs',
  // JSON.stringify zamienia NaN na null (to samo, co Rust po stronie testu). Zestaw `pelny` = plik
  // society-params.json z pina; po stronie Rust zastepowany przez `data::derived::SOCIETY_PARAMS_JSON`.
  societies: Object.fromEntries(Object.entries(SOCIETY_SETS).map(([k, v]) => [k, k === 'pelny' ? '@society-params.json' : v])),
  scale: scaleCases,
  fns: fnCases,
  osiedle: osiedleCases,
  happiness: happyCases,
  law: lawCases,
};
writeFileSync(outFile, JSON.stringify(doc));
console.log(`scale=${scaleCases.length} fns=${fnCases.length} osiedle=${osiedleCases.length} happy=${happyCases.length} law=${lawCases.length}`);
