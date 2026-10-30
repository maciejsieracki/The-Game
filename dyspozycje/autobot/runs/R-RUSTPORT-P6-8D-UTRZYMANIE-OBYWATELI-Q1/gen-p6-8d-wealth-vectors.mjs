// P6.8D-P2 (wealth.ts, pin 91dc998a): wektory z URUCHOMIONEGO weba (git archive, poza repo).
// Uruchomienie (Node 22, z katalogu tego runu, bez builda gra/):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8d-wealth-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <PLIK_WYJSCIA.json>
// Kodowanie jak w gen-p6-8d-gold-mennica-vectors.mjs (number / $f / $n / $undef / null).
// wealthParamsWith{Cap,Multiplier}Modifier NIE sa tu generowane: pokrywa je B3 (city_growth).
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outFile = presolve(process.argv[3]);
mkdirSync(dirname(outFile), { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

const W = await import(src('game/wealth.ts'));

const enc = (x) => {
  if (x === undefined) return { $undef: true };
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  // Calkowite > 2^53 kodowane jak niecalkowite ($f): serde_json bez float_roundtrip parsuje
  // duze literaly JSON z bledem 1 ULP (wykryte w r3, pula ~1e22).
  if (Number.isInteger(x) && Math.abs(x) <= Number.MAX_SAFE_INTEGER) return x;
  return { $f: String(x) };
};
const encParams = (p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, enc(v)]));

// --- parametry (zestawy) ---
const PARAM_SETS = {
  fallback: W.FALLBACK_WEALTH_PARAMS,
  mocne: {
    capNaEpoke: 5, progNaPoziom: 1.5, mnoznikNaPoziom: 0.3, utrzymanieBaza: 0.1,
    utrzymaniePrzyCap: 0.9, zachowaniePoAwansie: 0.33, zadowolenieMax: 7, karaZero: -2, immunitetTur: 0,
  },
  // r4 (Evaluator r3 zarzut 1): ujemny cap => wealthCap = -0 dla epoka <= 0 (JS Math.min/max, znak zera)
  ujemnyCap: {
    capNaEpoke: -2, progNaPoziom: 4.5, mnoznikNaPoziom: 0.15, utrzymanieBaza: 0.2,
    utrzymaniePrzyCap: 0.4, zachowaniePoAwansie: 0.5, zadowolenieMax: 10, karaZero: 0, immunitetTur: 5,
  },
  zerowyCap: {
    capNaEpoke: 0, progNaPoziom: 2, mnoznikNaPoziom: 0.15, utrzymanieBaza: 0.2,
    utrzymaniePrzyCap: 0.4, zachowaniePoAwansie: 0.5, zadowolenieMax: 10, karaZero: 0, immunitetTur: 5,
  },
  ujemneMnoznik: {
    capNaEpoke: 12, progNaPoziom: 0.5, mnoznikNaPoziom: -0.2, utrzymanieBaza: 0.5,
    utrzymaniePrzyCap: 0.1, zachowaniePoAwansie: 1.5, zadowolenieMax: 3, karaZero: 1, immunitetTur: 2,
  },
  nanCap: {
    capNaEpoke: NaN, progNaPoziom: 4.5, mnoznikNaPoziom: 0.15, utrzymanieBaza: 0.2,
    utrzymaniePrzyCap: 0.4, zachowaniePoAwansie: 0.5, zadowolenieMax: 10, karaZero: 0, immunitetTur: 5,
  },
};

// --- load: raw wiersze i trudnosci ---
const RAW = {
  pusty: {},
  pelny: {
    wealth: {
      wealth_cap_na_epoke: { easy: 8, normal: 10, hard: 12 },
      wealth_prog_na_poziom: { easy: 3, normal: 4.5, hard: 6 },
      wealth_mnoznik_na_poziom: { easy: 0.1, normal: 0.15, hard: 0.2 },
      wealth_utrzymanie_baza: { easy: 0.1, normal: 0.2, hard: 0.3 },
      wealth_utrzymanie_przy_cap: { easy: 0.3, normal: 0.4, hard: 0.5 },
      wealth_zachowanie_po_awansie: { easy: 0.6, normal: 0.5, hard: 0.4 },
      wealth_zadowolenie_max: { easy: 12, normal: 10, hard: 8 },
      wealth_kara_zero: { easy: 0, normal: -1, hard: -2 },
      wealth_immunitet_tur: { easy: 7, normal: 5, hard: 3 },
    },
  },
  brakDifficulty: { wealth: { wealth_cap_na_epoke: { normal: 6 } } },
  stringi: { wealth: { wealth_cap_na_epoke: { easy: '7', normal: '7', hard: '7' } } },
  zeroIUjemne: {
    wealth: {
      wealth_cap_na_epoke: { normal: 0 },
      wealth_mnoznik_na_poziom: { normal: -0.5 },
      wealth_kara_zero: { normal: -0 },
    },
  },
};
const DIFFS = ['easy', 'normal', 'hard'];
const loadCases = [];
for (const [name, raw] of Object.entries(RAW)) {
  for (const d of DIFFS) {
    // raw przechodzi przez JSON (wektor = JSON), wiec -0 w wejsciu staje sie 0 po obu stronach
    const rawJ = JSON.parse(JSON.stringify(raw));
    loadCases.push({ name, difficulty: d, raw: rawJ, expected: encParams(W.loadWealthParams(rawJ, d)) });
  }
}
{
  const rawJ = JSON.parse(JSON.stringify(RAW.pelny));
  loadCases.push({ name: 'domyslna', difficulty: null, raw: rawJ, expected: encParams(W.loadWealthParams(rawJ)) });
}

// --- funkcje skladowe ---
const EPOKI = [-1, 0, -0, 0.5, 1, 1.9, 2, 3, 5, 10, 11, NaN, Infinity, -Infinity];
const POZIOMY = [-5, -0, 0, 0.5, 1, 2, 3.7, 10, 25, 100, 101, 500, NaN, Infinity, -Infinity];
const fnCases = [];
for (const [pn, p] of Object.entries(PARAM_SETS)) {
  for (const e of EPOKI) {
    fnCases.push({
      params: pn,
      epoka: enc(e),
      cap: enc(W.wealthCap(e, p)),
    });
  }
  for (const poz of POZIOMY) {
    for (const e of EPOKI) {
      fnCases.push({
        params: pn,
        poziom: enc(poz),
        epoka: enc(e),
        mnoznik: enc(W.wealthMnoznik(poz, p)),
        zadowolenie: enc(W.wealthZadowolenie(poz, p, e)),
        rownowaga: enc(W.wealthRownowaga(poz, e, p)),
        prog: enc(W.wealthProg(poz, e, p)),
      });
    }
  }
}

// --- advanceWealth: sekwencje ---
const STARTS = [
  { poziom: 1, pula: 0 },
  { poziom: 0, pula: 0 },
  { poziom: 3.7, pula: 12.5 },
  { poziom: 500, pula: -4 },
  { poziom: NaN, pula: NaN },
  { poziom: -2, pula: Infinity },
  { poziom: 2, pula: 40 },
];
const SPOL = [0, 1, 2.5, 10, 50, -3, NaN, Infinity, 0.75];
const MIASTO = [0, 5, 20, 100, -1, NaN, 33.3];
const EPOKI_SEQ = [1, 1, 2, 2, 3, 3, 5, 10, 10, 11, 0.5, 4];
const MINPOZ = [undefined, 0, 1, 3, -2, NaN, null, 2];
const advanceCases = [];
for (const [pn, p] of Object.entries(PARAM_SETS)) {
  for (let si = 0; si < STARTS.length; si++) {
    let state = { ...STARTS[si] };
    const steps = [];
    for (let t = 0; t < 14; t++) {
      const spol = SPOL[(t * 3) % SPOL.length];
      const miasto = MIASTO[(t * 2 + si) % MIASTO.length];
      const epoka = EPOKI_SEQ[t % EPOKI_SEQ.length];
      const minP = MINPOZ[(t + si) % MINPOZ.length];
      const opts = minP === undefined ? undefined : { minPoziom: minP };
      const inState = { poziom: enc(state.poziom), pula: enc(state.pula) };
      const res = W.advanceWealth(state, spol, miasto, epoka, p, opts);
      steps.push({
        inState,
        spol: enc(spol),
        miasto: enc(miasto),
        epoka: enc(epoka),
        minPoziom: enc(minP === null ? null : minP),
        out: {
          poziom: enc(res.poziom),
          pula: enc(res.pula),
          mnoznik: enc(res.mnoznik),
          zadowolenie: enc(res.zadowolenie),
          awans: enc(res.awans),
          spadek: enc(res.spadek),
        },
      });
      state = { poziom: res.poziom, pula: res.pula };
    }
    advanceCases.push({ params: pn, startIndex: si, steps });
  }
}

// Przypiete kroki: domyslny minPoziom (opts undefined => 0) przy poziomie 1 i pustej puli.
{
  const p = PARAM_SETS.fallback;
  const pinned = [
    { poziom: 1, pula: 0, spol: 0, miasto: 100, epoka: 1, minP: undefined },
    { poziom: 1, pula: 0, spol: 0, miasto: 100, epoka: 1, minP: 1 },
    { poziom: 1, pula: 0, spol: 0, miasto: 100, epoka: 1, minP: null },
    // r4 (Evaluator r3 zarzut 1): granica pula == prog (prog = 4.5*(1+1)*max(1,2) = 18) => awans
    { poziom: 1, pula: 0, spol: 18, miasto: 0, epoka: 2, minP: undefined },
  ];
  const steps = pinned.map((s) => {
    const opts = s.minP === undefined ? undefined : { minPoziom: s.minP };
    const res = W.advanceWealth({ poziom: s.poziom, pula: s.pula }, s.spol, s.miasto, s.epoka, p, opts);
    return {
      inState: { poziom: enc(s.poziom), pula: enc(s.pula) },
      spol: enc(s.spol),
      miasto: enc(s.miasto),
      epoka: enc(s.epoka),
      minPoziom: enc(s.minP),
      out: {
        poziom: enc(res.poziom),
        pula: enc(res.pula),
        mnoznik: enc(res.mnoznik),
        zadowolenie: enc(res.zadowolenie),
        awans: enc(res.awans),
        spadek: enc(res.spadek),
      },
    };
  });
  advanceCases.push({ params: 'fallback', startIndex: 'pinned', steps });
}

const fresh = W.freshWealthState();

writeFileSync(
  outFile,
  JSON.stringify(
    {
      _opis: 'P6.8D-P2 wealth.ts (bez wealthParamsWith*, pokryte przez B3) - wektory z weba, pin ' + PIN,
      _pin: PIN,
      fallback: encParams(W.FALLBACK_WEALTH_PARAMS),
      fresh: { poziom: enc(fresh.poziom), pula: enc(fresh.pula) },
      paramSets: Object.fromEntries(Object.entries(PARAM_SETS).map(([k, v]) => [k, encParams(v)])),
      load: loadCases,
      fn: fnCases,
      advance: advanceCases,
    },
    null,
    1,
  ) + '\n',
);
console.log(`load=${loadCases.length} fn=${fnCases.length} advance=${advanceCases.length}`);
