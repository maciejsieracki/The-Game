// REPIN-EKONOMIA-B3 (pin weba 91dc998a): wektory z URUCHOMIONEGO weba.
//   route_cash.json  - routeCashForCity (turn-economy.ts, funkcja NIEeksportowana w webie: tekst
//                      funkcji wycinany dosownie z pliku 91dc998a i kompilowany obok PRAWDZIWEGO
//                      civ-matrix.ts; ZALOZENIE, opis w dokumencie tematu).
//   wealth_owner.json - wealthParamsForOwner (turn-economy.ts, eksport), wealthParamsWithCapModifier
//                      i wealthParamsWithMultiplierModifier (wealth.ts, eksport) - PRAWDZIWY kod weba.
// Kodowanie: liczba skonczona -> JSON number; NaN/Infinity/-Infinity -> napis "NaN"/"Infinity"/"-Infinity".
// Uruchomienie (Node 22, z katalogu tego runu):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin-b3-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <KATALOG_WYJSCIA>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

// Kazda liczba jako napis String(x) (najkrotsza forma round-trip JS): serde_json bez
// feature float_roundtrip nie parsuje wszystkich liczb JSON dokladnie, a Rust str::parse::<f64>() tak.
const numEnc = (x) => (typeof x === 'number' ? String(x) : x);

// ---- 1. routeCashForCity: wyciecie dosłowne z pliku weba --------------------
const teSrc = readFileSync(join(webRoot, 'gra/src/game/turn-economy.ts'), 'utf8');
const start = teSrc.indexOf('function routeCashForCity(');
if (start < 0) throw new Error('routeCashForCity nie znaleziona w 91dc998a');
const end = teSrc.indexOf('\n}\n', start) + 3;
const fnSrc = teSrc.slice(start, end);
const wrapperPath = join(webRoot, 'gra/src/game/__b3_route_cash.ts');
writeFileSync(wrapperPath, `import { applyCivMatrixParam } from './civ-matrix';\nexport ${fnSrc}`);
const RC = await import(pathToFileURL(wrapperPath).href);
const CM = await import(src('game/civ-matrix.ts'));
const TE = await import(src('game/turn-economy.ts'));
const WE = await import(src('game/wealth.ts'));

const rows = CM.loadCivMatrix().cywilizacje;
const civKeySet = new Set(['', 'NIEZNANA', 'zulusi-nie-ma']);
for (const r of rows) {
  for (const v of [r.ikonaId, r.typCywilizacji, r.Cywilizacja]) {
    civKeySet.add(v);
    civKeySet.add(String(v).toUpperCase());
  }
}
const CIV_KEYS = [undefined, ...civKeySet];

const TOTALS = [0, 1, 2.5, 10, 99.9, -3, 1e300, NaN, Infinity, -Infinity];
const MARITIME = [0, 0.5, 3, 10, 100, -2, 1.7, NaN, Infinity, -Infinity];

const routeCases = [];
for (const total of TOTALS) for (const maritime of MARITIME) for (const civKey of CIV_KEYS) {
  routeCases.push({
    total: numEnc(total), maritime: numEnc(maritime), civKey: civKey === undefined ? null : civKey,
    out: numEnc(RC.routeCashForCity(total, maritime, civKey)),
  });
}
const routeParamByKey = Object.fromEntries(
  CIV_KEYS.filter(k => k !== undefined).map(k => [k, numEnc(CM.civMatrixParam(k, 'eko_pieniadz_port_proc'))]),
);
writeFileSync(join(outDir, 'route_cash.json'), JSON.stringify({
  pin: PIN,
  source: 'turn-economy.ts routeCashForCity (wyciete dosłownie z 91dc998a, skompilowane z civ-matrix.ts 91dc998a)',
  paramId: 'eko_pieniadz_port_proc',
  paramByKey: routeParamByKey,
  cases: routeCases,
}, null, 1) + '\n');

// ---- 2. wealthParamsForOwner + modyfikatory Wealth -------------------------
const BASES = [
  { capNaEpoke: 10, mnoznikNaPoziom: 0.1 },
  { capNaEpoke: 0, mnoznikNaPoziom: 0 },
  { capNaEpoke: 7.3, mnoznikNaPoziom: 1.5 },
  { capNaEpoke: -5, mnoznikNaPoziom: -0.5 },
  { capNaEpoke: NaN, mnoznikNaPoziom: 2 },
  { capNaEpoke: Infinity, mnoznikNaPoziom: NaN },
];
const MODS = [0, 0.1, -0.5, -1, -2, 1, 0.25, NaN, Infinity, -Infinity];

const modCapCases = [];
const modMulCases = [];
for (const b of BASES) for (const m of MODS) {
  const cap = WE.wealthParamsWithCapModifier(b, m);
  const mul = WE.wealthParamsWithMultiplierModifier(b, m);
  modCapCases.push({ base: { capNaEpoke: numEnc(b.capNaEpoke), mnoznikNaPoziom: numEnc(b.mnoznikNaPoziom) }, mod: numEnc(m), out: { capNaEpoke: numEnc(cap.capNaEpoke), mnoznikNaPoziom: numEnc(cap.mnoznikNaPoziom) } });
  modMulCases.push({ base: { capNaEpoke: numEnc(b.capNaEpoke), mnoznikNaPoziom: numEnc(b.mnoznikNaPoziom) }, mod: numEnc(m), out: { capNaEpoke: numEnc(mul.capNaEpoke), mnoznikNaPoziom: numEnc(mul.mnoznikNaPoziom) } });
}

const OWNER_KEYS = CIV_KEYS; // undefined => brak wlasciciela-cywilizacji (zwraca baze)
const ownerCases = [];
for (const b of BASES) for (const key of OWNER_KEYS) {
  const out = TE.wealthParamsForOwner(b, key);
  ownerCases.push({
    base: { capNaEpoke: numEnc(b.capNaEpoke), mnoznikNaPoziom: numEnc(b.mnoznikNaPoziom) },
    civKey: key === undefined ? null : key,
    out: { capNaEpoke: numEnc(out.capNaEpoke), mnoznikNaPoziom: numEnc(out.mnoznikNaPoziom) },
  });
}
const wealthParamByKey = Object.fromEntries(
  OWNER_KEYS.filter(k => k !== undefined).map(k => [k, {
    wealth_cap_proc: numEnc(CM.civMatrixParam(k, 'wealth_cap_proc')),
    wealth_mnoznik_proc: numEnc(CM.civMatrixParam(k, 'wealth_mnoznik_proc')),
  }]),
);
writeFileSync(join(outDir, 'wealth_owner.json'), JSON.stringify({
  pin: PIN,
  source: 'turn-economy.ts wealthParamsForOwner; wealth.ts wealthParamsWith{Cap,Multiplier}Modifier (91dc998a)',
  paramByKey: wealthParamByKey,
  capModifierCases: modCapCases,
  multiplierModifierCases: modMulCases,
  ownerCases,
}, null, 1) + '\n');

console.log(`route=${routeCases.length} wealthOwner=${ownerCases.length} capMod=${modCapCases.length} mulMod=${modMulCases.length}`);
