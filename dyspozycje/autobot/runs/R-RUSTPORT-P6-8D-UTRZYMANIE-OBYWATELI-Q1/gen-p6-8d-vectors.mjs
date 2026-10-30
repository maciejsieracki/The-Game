// P6.8D (partia 8D-P1, citizen-resource-upkeep.ts): wektory z URUCHOMIONEGO weba 91dc998a.
// Uruchomienie (Node 22, z katalogu tego runu, bez builda gra/):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8d-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <PLIK_WYJSCIA.json>
// Kodowanie (JSON nie ma NaN/Infinity/-0 ani niecalkowitych bez utraty):
//   liczba skonczona calkowita -> JSON number; niecalkowita -> {"$f": String(x)};
//   NaN/Infinity/-Infinity/-0 -> {"$n": "NaN"|"Infinity"|"-Infinity"|"-0"}.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outFile = presolve(process.argv[3]);
mkdirSync(dirname(outFile), { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

const C = await import(src('game/citizen-resource-upkeep.ts'));

const enc = (x) => {
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
};
const encObj = (o) => {
  if (o === null || o === undefined) return o === null ? null : { $undef: true };
  const out = {};
  for (const [k, v] of Object.entries(o)) out[k] = enc(v);
  return out;
};

const ERAS = [-Infinity, -3, 0, 0.5, 1, 1.9, 2, 2.999, 3, 4, 5, 9, NaN, Infinity];
const POPS = [-5, 0, 0.5, 1, 2, 3.7, 4, 12, 53, 1000, NaN, Infinity, -Infinity];

// Magazyny: wszystkie wartosci numeryczne (web: typeof === 'number'); klucze spoza wymaganych sa szumem.
const STOCKS = {
  null: null,
  pusty: {},
  pelny: { drewno: 1000, glina: 1000, kamien: 1000, ceramika: 1000, cegla: 1000 },
  zero: { drewno: 0, glina: 0, kamien: 0, ceramika: 0, cegla: 0 },
  ujemny: { drewno: -5, glina: -1, kamien: 0 },
  malyDrewno: { drewno: 2, glina: 0, kamien: 1, ceramika: 10, cegla: 0.5 },
  ulamkowy: { drewno: 3.5, glina: 7.25, kamien: 0.1, ceramika: 2, cegla: 4 },
  nanInf: { drewno: NaN, glina: Infinity, kamien: -Infinity, ceramika: 3, cegla: 1 },
  brakKluczy: { ruda: 9, zloto: 4 },
  kamienTylko: { kamien: 5 },
};

// `era` i `population` w wektorze: NaN/Infinity zakodowane jak wyzej; wejscie wraca do webu identyczne.
const decEra = (x) => x;

const eraCases = ERAS.map((era) => ({
  era: enc(era),
  required: C.citizenRequiredResourcesForEra(decEra(era)),
}));

const coverageCases = [];
for (const era of ERAS) {
  for (const [name, st] of Object.entries(STOCKS)) {
    const cov = C.resolveCitizenResourceCoverage(era, st);
    coverageCases.push({
      era: enc(era),
      stock: st === null ? null : encObj(st),
      stockName: name,
      required: cov.required,
      available: cov.available,
      missing: cov.missing,
      happinessDelta: enc(cov.happinessDelta),
      growthPctDelta: enc(cov.growthPctDelta),
    });
  }
}

const drainCases = [];
for (const era of ERAS) {
  for (const pop of POPS) {
    for (const [name, st] of Object.entries(STOCKS)) {
      const d = C.computeCitizenResourceDrain(era, pop, st);
      drainCases.push({
        era: enc(era),
        population: enc(pop),
        stock: st === null ? null : encObj(st),
        stockName: name,
        required: d.required,
        available: d.available,
        missing: d.missing,
        happinessDelta: enc(d.happinessDelta),
        growthPctDelta: enc(d.growthPctDelta),
        deductions: encObj(d.deductions),
      });
    }
  }
}

const displayCases = [];
for (const era of [1, 2, 3, 9]) {
  for (const [name, st] of Object.entries(STOCKS)) {
    const cov = C.resolveCitizenResourceCoverage(era, st);
    for (const pop of POPS) {
      const lines = C.citizenUpkeepDisplayLines(cov, pop);
      displayCases.push({
        era,
        stockName: name,
        stock: st === null ? null : encObj(st),
        population: enc(pop),
        available: cov.available,
        missing: cov.missing,
        lines: lines.map((l) => ({ key: l.key, value: enc(l.value), available: l.available })),
      });
    }
  }
}

const out = {
  _opis: 'P6.8D-P1 citizen-resource-upkeep.ts (wektory z weba, pin ' + PIN + ')',
  _pin: PIN,
  constants: {
    happinessPerAvailable: enc(C.CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE),
    happinessPerMissing: enc(C.CITIZEN_UPKEEP_HAPPINESS_PER_MISSING),
    growthPctPerMissing: enc(C.CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING),
    ratePerCitizen: enc(C.CITIZEN_UPKEEP_RATE_PER_CITIZEN),
  },
  cases: {
    eras: eraCases,
    coverage: coverageCases,
    drain: drainCases,
    display: displayCases,
  },
};

writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n');
console.log(
  `eras=${eraCases.length} coverage=${coverageCases.length} drain=${drainCases.length} display=${displayCases.length}`,
);
