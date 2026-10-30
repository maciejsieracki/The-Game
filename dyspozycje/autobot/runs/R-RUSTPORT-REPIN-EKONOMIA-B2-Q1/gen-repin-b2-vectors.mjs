// REPIN-EKONOMIA-B2 (krok 2, partia B2a + poprawka r1 po Obronie): wektory z URUCHOMIONEGO weba 91dc998a.
//   - buildingWorkCost (production.ts:555) z markerami civBonusy (civMatrixCostDiscount, production.ts:644),
//   - unitMoneyCost (production.ts:577) + civRecruitmentDiscount (production.ts:626),
//   - civProductionCostBonusyForCivKey (production.ts:609) na prawdziwej macierzy civ-matrix.json,
//   - newestAvailableSameTypeUnit + epochNumber (production.ts:190-226).
// Kodowanie (JSON nie ma NaN/Infinity ani undefined):
//   liczba skonczona -> JSON number; NaN/Infinity/-Infinity -> napis "NaN"/"Infinity"/"-Infinity" (wyniki i baza);
//   wartosc markera -> number | {"js":"NaN"|"Infinity"|"-Infinity"} | napis (typeof string, web: nie-liczba);
//   tempo (pace) -> {"t":"undef"} | {"t":"key","v":napis} | {"t":"num","v":number|"NaN"|"Infinity"}.
// Uruchomienie (Node 22, z katalogu tego runu):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin-b2-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <KATALOG_WYJSCIA>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

const P = await import(src('game/production.ts'));
const CM = await import(src('game/civ-matrix.ts'));

const numEnc = (x) => (typeof x === 'number' && !Number.isFinite(x) ? String(x) : x);
const valEnc = (x) => {
  if (typeof x === 'number' && !Number.isFinite(x)) return { js: String(x) };
  return x;
};
const markerEnc = (m) => {
  const out = {};
  for (const [k, v] of Object.entries(m)) out[k] = k === 'wartosc' ? valEnc(v) : v;
  return out;
};
// Pace: undefined | klucz (napis, takze '') | liczba (takze 0 i NaN - falsy w webie).
const paceEnc = (p) => {
  if (p === undefined) return { t: 'undef' };
  if (typeof p === 'string') return { t: 'key', v: p };
  return { t: 'num', v: numEnc(p) };
};

// ---- markery (CivBonusLite) ------------------------------------------------
const mB = (wartosc, extra = {}) => ({ typ: 'koszt_redukcja', cel: 'budynki', wartosc, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc', ...extra });
const mJ = (wartosc, extra = {}) => ({ typ: 'koszt_redukcja', cel: 'jednostki', wartosc, realizuje: 'ekonomia', matrixParamId: 'prod_koszt_jednostki_proc', ...extra });
const mR = (wartosc, cel, realizuje = 'ekonomia', extra = {}) => ({ typ: 'redukcja', cel, wartosc, realizuje, matrixParamId: 'walka_koszt_rekrutacji_proc', ...extra });

const BUILD_SETS = {
  brak: undefined,
  pusta: [],
  m0: [mB(0)],
  m01: [mB(0.1)],
  m025: [mB(0.25)],
  m05: [mB(0.5)],
  m099: [mB(0.99)],
  m1: [mB(1)],
  mneg: [mB(-0.3)],
  innyParam: [mJ(0.3)],
  opisOnly: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.3, opis: 'koszt budynkow', realizuje: 'miasto' }],
  nanFirst: [mB(NaN), mB(0.25)],
  infFirst: [mB(Infinity)],
  strFirst: [mB('0.5'), mB(0.25)],
  dupFirst: [mB(0.1), mB(0.5)],
  jednostkiThenBudynku: [mJ(0.3), mB(0.25)],
  recOnly: [mR(0.1, 'impi')],
};

const UNIT_SETS = {
  brak: undefined,
  pusta: [],
  jedn01: [mJ(0.1)],
  jednNan: [mJ(NaN)],
  jednFirstNanSecondOk: [mJ(NaN), mJ(0.2)],
  jednInf: [mJ(Infinity)],
  jednStr: [mJ('0.2')],
  jednNeg: [mJ(-0.4)],
  budyn025: [mB(0.25)],
  recImpi01: [mR(0.1, 'impi')],
  recImpiCapitalCel: [mR(0.1, 'IMPI')],
  recGen02: [mR(0.2, 'jednostki')],
  recEmptyCel: [mR(0.2, '')],
  recSumImpi: [mR(0.1, 'impi'), mR(0.2, ''), mR(0.3, 'impi', 'miasto')],
  recImpiPlusJedn: [mR(0.1, 'impi'), mJ(0.25)],
  recNan: [mR(NaN, 'impi')],
  recNeg: [mR(-0.2, 'impi')],
  recWrongRealizuje: [mR(0.5, 'impi', 'miasto')],
  recBig: [mR(0.6, 'impi'), mJ(0.7)],
  recNoMatrixParam: [{ typ: 'redukcja', cel: 'impi', wartosc: 0.4, realizuje: 'ekonomia', matrixParamId: 'inny' }],
  recNoCelField: [{ typ: 'redukcja', wartosc: 0.15, realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' }],
  recStrOnly: [mR('0.9', 'impi')],
  mixedDupRec: [mR(0.1, 'impi'), mR(0.1, 'impi')],
};

const UNIT_NAMES = [undefined, 'Impi', ' impi ', 'IMPI', 'Piechota', ' Impi﻿', 'İmpi', ''];
// Tempa: { t: undefined } = brak argumentu; { k } = klucz; { n } = liczba.
const PACES = [
  { t: undefined }, { k: 'niski' }, { k: 'normalny' }, { k: 'wysoki' }, { k: '' }, { k: 'nieznany' },
  { n: 0 }, { n: NaN }, { n: 1.5 }, { n: 0.5 },
];
const paceSpec = (p) => (p.k !== undefined ? p.k : p.n !== undefined ? p.n : undefined);
const OWNERS = [0, 1, -1];
const DIFFS = ['easy', 'normal', 'hard'];
const BASES = [0, 1, 2.5, 10, 100, 999.9, -3, NaN, Infinity];
const NOPACE = { t: undefined };

// ---- buildingWorkCost -----------------------------------------------------
const buildingCases = [];
const pushB = (base, setName, pace, owner, diff) => {
  const out = P.buildingWorkCost(base, BUILD_SETS[setName], paceSpec(pace), owner, diff);
  buildingCases.push({ base: numEnc(base), bonusy: setName, pace: paceEnc(paceSpec(pace)), owner, diff, out: numEnc(out) });
};
for (const base of BASES) for (const pace of PACES) for (const owner of OWNERS) for (const diff of DIFFS) pushB(base, 'brak', pace, owner, diff);
for (const setName of Object.keys(BUILD_SETS)) {
  for (const base of BASES) for (const pace of PACES) for (const owner of OWNERS) for (const diff of DIFFS) pushB(base, setName, pace, owner, diff);
}

// ---- unitMoneyCost --------------------------------------------------------
const unitCases = [];
const pushU = (base, setName, unitName, pace, owner, diff) => {
  const out = P.unitMoneyCost(base, UNIT_SETS[setName], paceSpec(pace), owner, diff, unitName);
  unitCases.push({
    base: numEnc(base), markers: setName, unitName: unitName === undefined ? null : unitName,
    pace: paceEnc(paceSpec(pace)), owner, diff, out: numEnc(out),
  });
};
for (const base of BASES) for (const pace of PACES) for (const owner of OWNERS) for (const diff of DIFFS) pushU(base, 'brak', undefined, pace, owner, diff);
for (const setName of Object.keys(UNIT_SETS)) {
  for (const unitName of UNIT_NAMES) pushU(10, setName, unitName, NOPACE, 0, 'normal');
  for (const unitName of UNIT_NAMES) for (const pace of PACES) pushU(100, setName, unitName, pace, 1, 'hard');
  for (const base of BASES) for (const pace of PACES) for (const owner of OWNERS) for (const diff of DIFFS) pushU(base, setName, 'Impi', pace, owner, diff);
}
const unitMarkerSets = Object.fromEntries(Object.entries(UNIT_SETS).map(([k, v]) => [k, v === undefined ? null : v.map(markerEnc)]));
const buildMarkerSets = Object.fromEntries(Object.entries(BUILD_SETS).map(([k, v]) => [k, v === undefined ? null : v.map(markerEnc)]));

writeFileSync(join(outDir, 'building_work_cost.json'), JSON.stringify({
  pin: PIN,
  bonusyVariants: buildMarkerSets,
  cases: buildingCases,
}, null, 1) + '\n');

writeFileSync(join(outDir, 'unit_money_cost.json'), JSON.stringify({
  pin: PIN,
  markerSets: unitMarkerSets,
  cases: unitCases,
}, null, 1) + '\n');

// ---- civProductionCostBonusyForCivKey (macierz web) -----------------------
const rows = CM.loadCivMatrix().cywilizacje;
const keys = new Set(['', 'NIEZNANA', 'zulusi-nie-ma']);
for (const r of rows) {
  for (const v of [r.ikonaId, r.typCywilizacji, r.Cywilizacja]) {
    keys.add(v);
    keys.add(String(v).toUpperCase());
  }
}
const civCases = [...keys].map(civKey => {
  const markers = P.civProductionCostBonusyForCivKey(civKey);
  return {
    civKey,
    markers: markers.map(m => ({
      cel: m.cel, realizuje: m.realizuje, matrixParamId: m.matrixParamId, wartosc: valEnc(m.wartosc),
    })),
  };
});
writeFileSync(join(outDir, 'civ_cost_markers.json'), JSON.stringify({ pin: PIN, cases: civCases }, null, 1) + '\n');

// ---- epochNumber + newestAvailableSameTypeUnit ----------------------------
const EPOKI = ['Kamien', 'Kamień', 'Braz', 'Brąz', 'Zelazo', 'Żelazo', 'Nieznana', '', 'constructor', null];
const epochCases = EPOKI.map(e => ({ epoka: e, out: P.epochNumber(e) }));

const UNITS = [
  { Jednostka: 'A1', Typ: 'Piechota', Epoka: 'Kamien' },
  { Jednostka: 'A2', Typ: 'Piechota', Epoka: 'Braz' },
  { Jednostka: 'A3', Typ: ' Piechota ', Epoka: 'Zelazo' },
  { Jednostka: 'A4', Typ: 'Piechota', Epoka: 'Żelazo' },
  { Jednostka: 'B1', Typ: 'Lucznik', Epoka: 'Braz' },
  { Jednostka: 'A5', Typ: '', Epoka: 'Zelazo' },
  { Jednostka: 'A6', Typ: 'Piechota', Epoka: 'Nieznana' },
  { Jednostka: 'A7', Typ: 'Piechota' },
  { Jednostka: 'A8', Typ: 'Piechota', Epoka: null },
  { Jednostka: 'A1', Typ: 'Lucznik', Epoka: 'Zelazo' },
  { Jednostka: 'D1', Typ: 'Piechota', Epoka: 'Zelazo' },
  { Jednostka: 'E1', Typ: 'Piechota', Epoka: 'Braz' },
  { Jednostka: 'E2', Typ: 'Piechota', Epoka: 'Braz' },
  { Jednostka: 'F1', Typ: ' Piechota﻿', Epoka: 'Zelazo' },
];
const CURRENT = ['A1', 'A2', 'A5', 'B1', 'A7', 'A8', 'A3', 'A4', 'E1', 'ZZZ', 'F1'];
const CAND_SETS = [
  ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'D1', 'E1', 'E2'],
  ['A2', 'A3'],
  ['A4', 'A3'],
  ['A6'],
  ['A7', 'A8', 'E2'],
  ['B1', 'A1'],
  [],
  ['F1', 'A4'],
];
const newestCases = [];
for (const cur of CURRENT) for (const cands of CAND_SETS) {
  const hit = P.newestAvailableSameTypeUnit(cur, cands, UNITS);
  newestCases.push({ current: cur, candidates: cands, out: hit ? hit.Jednostka + '|' + hit.Epoka + '|' + hit.Typ : null, outIndex: hit ? UNITS.indexOf(hit) : null });
}
writeFileSync(join(outDir, 'unit_newest.json'), JSON.stringify({
  pin: PIN,
  units: UNITS,
  epochCases,
  cases: newestCases,
}, null, 1) + '\n');

console.log(`building=${buildingCases.length} unitMoney=${unitCases.length} civMarkers=${civCases.length} newest=${newestCases.length} epoch=${epochCases.length}`);
