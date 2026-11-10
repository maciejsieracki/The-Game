// Generator wektorow P6.1E z URUCHOMIONEGO kodu weba (pin edb8fb56):
//   gra/src/game/civ-matrix.ts, civ-matrix-semantic.ts, civ-ai-data.ts, civ-roster.ts,
//   civ-names.ts (+ city-names-pool.ts, civ-entry-epoch.ts).
// Kod TS jest importowany BEZ ZMIAN (loader p61e-loader-hooks.mjs); zadnych stubow.
// Scenariusze z mutacjami danych (np. brak wiersza macierzy -> galaz fallbackowa) uruchamiaja
// TEN SAM kod z drzewa o zmienionych plikach data/*.json (kopia wybranych plikow src + data).
//
// Uruchomienie:
//   node --experimental-transform-types --import ./p61e-loader-register.mjs \
//        ./gen-p61e-web-vectors.mjs <WEB_ROOT> <TREES_DIR> <OUT_JSON>
//
// Liczby sa w wektorach zapisywane jako TEKST (String(x) z JS; "-0" dla minus zera), bo
// serde_json bez `float_roundtrip` myli ostatni bit (zob. P6.1 r2).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, treesDir, outPath] = process.argv.slice(2);
if (!webRoot || !treesDir || !outPath) {
  throw new Error('uzycie: gen-p61e-web-vectors.mjs <WEB_ROOT> <TREES_DIR> <OUT_JSON>');
}

// ---------- wspolne narzedzia ----------
const s = (x) => (x === null || x === undefined ? null : Object.is(x, -0) ? '-0' : String(x));
const readData = (root, f) => readFileSync(join(root, 'gra/data', f));
function fnv1a64(buf) {
  let h = 0xcbf29ce484222325n;
  for (const b of buf) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}
// Deterministyczny PRNG generatora (xorshift32) - NIE jest czescia testowanego kodu.
let rs = 0x9e3779b9;
const rnd = () => {
  rs ^= rs << 13; rs >>>= 0;
  rs ^= rs >>> 17;
  rs ^= rs << 5; rs >>>= 0;
  return rs / 4294967296;
};
const rndInt = (n) => Math.floor(rnd() * n);
const pick = (a) => a[rndInt(a.length)];

// Tabela tekstow (dedup) - dlugie teksty PL w wektorach wystepuja raz.
const texts = [];
const textIdx = new Map();
const T = (t) => {
  if (!textIdx.has(t)) {
    textIdx.set(t, texts.length);
    texts.push(t);
  }
  return textIdx.get(t);
};

// ---------- drzewa scenariuszy ----------
function applyOps(files, ops) {
  const { matrix, civAi, diplomacy } = files;
  for (const op of ops) {
    switch (op.t) {
      case 'matrix.deleteRow': {
        const i = matrix.cywilizacje.findIndex((c) => c.ikonaId === op.ikonaId);
        if (i < 0) throw new Error('deleteRow ' + op.ikonaId);
        matrix.cywilizacje.splice(i, 1);
        break;
      }
      case 'matrix.deleteParam': {
        const row = matrix.cywilizacje.find((c) => c.ikonaId === op.ikonaId);
        if (!row || !(op.param in row.params)) throw new Error('deleteParam ' + op.param);
        delete row.params[op.param];
        break;
      }
      case 'matrix.setValue': {
        const row = matrix.cywilizacje.find((c) => c.ikonaId === op.ikonaId);
        row.params[op.param] = op.value;
        break;
      }
      case 'matrix.setFormula':
        matrix.paramDefs[op.param].formula = op.formula;
        break;
      case 'matrix.addParamDef':
        matrix.paramDefs[op.param] = op.def;
        break;
      case 'matrix.setDefault':
        matrix.defaults[op.param] = op.value;
        break;
      case 'matrix.setVersion':
        matrix._meta.version = op.value;
        break;
      case 'civAi.set': {
        const row = civAi.cywilizacje.find((c) => c.Cywilizacja === op.cyw);
        row[op.field] = op.value;
        break;
      }
      case 'civAi.delete': {
        const i = civAi.cywilizacje.findIndex((c) => c.Cywilizacja === op.cyw);
        if (i < 0) throw new Error('civAi.delete ' + op.cyw);
        civAi.cywilizacje.splice(i, 1);
        break;
      }
      case 'diplo.set': {
        const row = diplomacy.perNacja.find((c) => c.Cywilizacja === op.cyw);
        row[op.field] = op.value;
        break;
      }
      case 'diplo.delete': {
        const i = diplomacy.perNacja.findIndex((c) => c.Cywilizacja === op.cyw);
        if (i < 0) throw new Error('diplo.delete ' + op.cyw);
        diplomacy.perNacja.splice(i, 1);
        break;
      }
      default:
        throw new Error('nieznana operacja ' + op.t);
    }
  }
}

const SCENARIOS = [
  { id: 'base', ops: [] },
  {
    // Galezie fallbackowe: brak wierszy macierzy => profile AI / dyplomacja z civ-ai.json i diplomacy.json.
    id: 'fallback',
    ops: [
      { t: 'matrix.deleteRow', ikonaId: 'grecy' },
      { t: 'matrix.deleteRow', ikonaId: 'zulusi' },
      { t: 'matrix.deleteRow', ikonaId: 'egipt' },
      { t: 'civAi.set', cyw: 'Rzymianie', field: 'agresywnosc', value: 8 },
      { t: 'civAi.set', cyw: 'Zulusi', field: 'profilMapy', value: '  kopia_typu_obronna \t' },
      { t: 'civAi.set', cyw: 'Grecy', field: 'profilMapy', value: '   ' },
      { t: 'civAi.delete', cyw: 'Egipt' },
      { t: 'diplo.set', cyw: 'Grecy', field: 'nastawienieBazowe', value: 70 },
      { t: 'diplo.set', cyw: 'Zulusi', field: 'otwartoscHandel', value: 15 },
      { t: 'diplo.set', cyw: 'Egipt', field: 'otwartoscHandel', value: -4 },
      { t: 'diplo.delete', cyw: 'Inkowie' },
    ],
  },
  {
    // Dane czesciowe: brak parametru w wierszu, nieznana formula, nowy paramDef bez wartosci,
    // wartosc ulamkowa o dlugim rozwinieciu, inna wersja macierzy.
    id: 'partial',
    ops: [
      { t: 'matrix.deleteParam', ikonaId: 'rzymianie', param: 'ai_agresywnosc' },
      { t: 'matrix.deleteParam', ikonaId: 'inkowie', param: 'walka_atak_morska' },
      { t: 'matrix.setFormula', param: 'walka_atak_kawaleria', formula: 'weird_formula' },
      { t: 'matrix.setFormula', param: 'eko_praca_proc', formula: 'mul_abs' },
      { t: 'matrix.setFormula', param: 'prod_koszt_budynku_proc', formula: 'add' },
      {
        t: 'matrix.addParamDef',
        param: 'zz_nowy_parametr',
        def: { domena: 'ekonomia', jednostka: 'ulamek', modul: 'test', formula: 'mul_proc' },
      },
      { t: 'matrix.setValue', ikonaId: 'egipt', param: 'lud_wzrost_proc', value: 0.30000000000000004 },
      { t: 'matrix.setValue', ikonaId: 'sumer', param: 'ai_ekspansywnosc', value: 11 },
      { t: 'matrix.setValue', ikonaId: 'celtowie', param: 'ai_tolerancja_ryzyka', value: 0 },
      { t: 'matrix.setDefault', param: 'ai_profil_obronna', value: 1 },
      { t: 'matrix.setVersion', value: '2.7-test' },
    ],
  },
];

mkdirSync(treesDir, { recursive: true });
function buildTree(sc) {
  const root = join(treesDir, sc.id);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, 'gra/src/data'), { recursive: true });
  mkdirSync(join(root, 'gra/src/types'), { recursive: true });
  mkdirSync(join(root, 'gra/src/game'), { recursive: true });
  mkdirSync(join(root, 'gra/data'), { recursive: true });
  for (const f of [
    'civ-matrix.ts', 'civ-matrix-semantic.ts', 'civ-ai-data.ts', 'civ-roster.ts',
    'civ-entry-epoch.ts', 'civ-names.ts', 'city-names-pool.ts',
  ]) {
    cpSync(join(webRoot, 'gra/src/game', f), join(root, 'gra/src/game', f));
  }
  cpSync(join(webRoot, 'gra/src/types/player.ts'), join(root, 'gra/src/types/player.ts'));
  cpSync(join(webRoot, 'gra/src/data/loader.ts'), join(root, 'gra/src/data/loader.ts'));
  const files = {
    matrix: JSON.parse(readData(webRoot, 'civ-matrix.json').toString('utf8')),
    civAi: JSON.parse(readData(webRoot, 'civ-ai.json').toString('utf8')),
    diplomacy: JSON.parse(readData(webRoot, 'diplomacy.json').toString('utf8')),
    civs: JSON.parse(readData(webRoot, 'civs.json').toString('utf8')),
    pools: JSON.parse(readData(webRoot, 'city-names-pools.json').toString('utf8')),
  };
  applyOps(files, sc.ops);
  const w = (name, obj) => writeFileSync(join(root, 'gra/data', name), JSON.stringify(obj));
  w('civ-matrix.json', files.matrix);
  w('civ-ai.json', files.civAi);
  w('diplomacy.json', files.diplomacy);
  w('civs.json', files.civs);
  w('city-names-pools.json', files.pools);
  return { root, files };
}

const game = (root, f) => pathToFileURL(join(root, 'gra/src/game', f)).href;

// ======================================================================
// A. Zgodnosc z JS (helpery liczbowe/tekstowe)
// ======================================================================
const NICE = [
  0, 1, -1, 2, 10, 100, 0.5, -0.5, 1.5, 2.5, -2.5, 0.1, 0.2, 0.3, 0.7, 0.05, 0.005, 0.0005, 0.00005,
  0.15, 0.25, 0.35, 0.45, 0.075, 0.0625, 0.03125, 0.125, 0.375, 1.005, 1.0005, 2.675, 1.45, 8.345,
  10.235, 0.1 + 0.2, 1 / 3, 2 / 3, -1 / 3, 123456789, 1234567.891, 0.000001, 0.0000001, 1e-7, 1.5e-7,
  1e21, 1e20, 123456789012345680000, 1.5e21, 9.999999999999999e20, 1e300, 5e-324, 1.7976931348623157e308,
  4.35, 4.349999999999999, 0.285, 1.255, 1.115, 0.045, 0.055, 0.3333, 0.66666, 99.9999, 99.9995, 0.9995,
  0.0004999999999999999, 0.0005000000000000001, -0.0004, -0.0005, -0.0006, 5e-4, 12.3456789, -12.3456789,
  3.141592653589793, 2.718281828459045, 1e15, 1e16, 1e17, 4294967296, 2147483648, -2147483649, 0.49999999999999994,
  -0.49999999999999994, 4503599627370495.5, 9007199254740993, NaN, Infinity, -Infinity, -0,
];
function randomDouble() {
  const buf = new DataView(new ArrayBuffer(8));
  for (;;) {
    buf.setUint32(0, (rnd() * 4294967296) >>> 0);
    buf.setUint32(4, (rnd() * 4294967296) >>> 0);
    const x = buf.getFloat64(0);
    if (Number.isFinite(x)) return x;
  }
}
const numbers = [...NICE];
for (let i = 0; i < 200; i++) numbers.push(randomDouble());
for (let i = 0; i < 150; i++) numbers.push(Math.round(rnd() * 1e6) / 1000 - 300); // trojmiejscowe
for (let i = 0; i < 150; i++) numbers.push((rndInt(2000) - 1000) / 8); // dokladne polowki/cwiartki
for (let i = 0; i < 100; i++) numbers.push(rndInt(200000) / 10000); // 4 miejsca
for (let i = 0; i < 50; i++) numbers.push(Number((rnd() * 2 - 1).toFixed(2))); // dwa miejsca

const js = {
  numbers: numbers.map(s),
  toString: numbers.map((x) => String(x)),
  mathRound: numbers.map((x) => s(Math.round(x))),
  toFixed: [0, 1, 2, 3, 4, 6].map((d) =>
    numbers.map((x) => {
      try {
        return x.toFixed(d);
      } catch {
        return null;
      }
    }),
  ),
  toFixedDigits: [0, 1, 2, 3, 4, 6],
  isInteger: numbers.map((x) => Number.isInteger(x)),
};
const trimCases = [
  '', ' ', 'a', ' a ', '\ta\n', ' a ', '﻿a﻿', '\u0085a\u0085', '᠎a᠎', ' a ',
  ' a ', '​a​', '　a　', ' a ', ' a', 'a\u0009b', '\u000b\u000c a \r\n',
  '  grecy ', 'Słowianie ', '\u0085', ' ', '​', ' \u0085 x \u0085 ',
];
js.trim = trimCases.map((t) => ({ in: t, out: t.trim() }));

// ======================================================================
// Ladowanie modulow z drzewa
// ======================================================================
async function loadModules(root) {
  return {
    M: await import(game(root, 'civ-matrix.ts')),
    S: await import(game(root, 'civ-matrix-semantic.ts')),
    A: await import(game(root, 'civ-ai-data.ts')),
    R: await import(game(root, 'civ-roster.ts')),
    N: await import(game(root, 'civ-names.ts')),
    C: await import(game(root, 'city-names-pool.ts')),
  };
}

const TYP_ENUM = [
  'grecy', 'rzymianie', 'chinczycy', 'inkowie', 'zulusi', 'egipt', 'babilon', 'sumer', 'celtowie',
  'germanie', 'harappa', 'hetyci', 'slowianie', 'babilonia', 'asyria', 'fenicjanie', 'drobna_cywilizacja',
];
const DIFFS = ['easy', 'normal', 'hard'];
const STATUSES = [
  'REAL_GAMEPLAY', 'UI_ONLY', 'REFERENCE_NEEDS_REVIEW', 'UNWIRED', 'DEAD_UNWIRED', 'PROPOSAL', 'BLOCKED',
  'DECISION_REQUIRED',
];

// js-vectors dla formatowania zalezy od kodu semantycznego (baza)
const base = SCENARIOS[0];
const baseTree = { root: webRoot };
const baseMods = await loadModules(webRoot);
{
  const { S } = baseMods;
  const units = ['flag_0_1', 'ulamek', 'ulamek_0_1', 'absolut', 'skala_1_10', 'integer', 'unknown'];
  const fmtNumbers = numbers.filter((_, i) => i % 3 === 0 || i < NICE.length);
  js.formatted = {
    units,
    values: [...fmtNumbers.map(s), null],
    out: units.map((u) => [...fmtNumbers, null].map((x) => S.civMatrixFormattedValue(x, u))),
  };
  const intensities = [0, -0, 1, -1, 3.33, -3.33, 10, -10, 0.01, -0.01, 5.5, 1e-7, NaN, 2.5, 7.25];
  js.intensity = { values: intensities.map(s), out: intensities.map((x) => S.civMatrixIntensityLabel(x)) };
  js.visibility = {
    statuses: [
      'REAL_GAMEPLAY', 'UI_ONLY', 'REFERENCE_NEEDS_REVIEW', 'UNWIRED', 'DEAD_UNWIRED', 'PROPOSAL', 'BLOCKED', 'DECISION_REQUIRED',
    ],
    out: [
      'REAL_GAMEPLAY', 'UI_ONLY', 'REFERENCE_NEEDS_REVIEW', 'UNWIRED', 'DEAD_UNWIRED', 'PROPOSAL', 'BLOCKED', 'DECISION_REQUIRED',
    ].map((st) => S.statusAllowsDefaultVisibility(st)),
  };
  const ids = [
    ...Object.keys(S.civMatrixSemanticParameterIds().reduce((a, k) => ((a[k] = 1), a), {})),
    '', 'proc', 'xproc', 'a__b', 'proc_proc', 'walka_proc', 'procx', 'ai_', '_ai', 'Walka_Atak', 'dip_proc_proc_proc',
    'kultura_naplyw_proc', 'nieznany_czlon_proc', 'obrona_miasta', 'sklonnosc_sojusze', 'prog_wojny',
  ];
  js.paramLabel = { ids, out: ids.map((i) => S.civMatrixParameterLabelPl(i)) };
}

// ======================================================================
// B/C/E. Macierz, semantyka, AI-data - per scenariusz
// ======================================================================
function civKeysFor(matrix) {
  const keys = [];
  const add = (k) => keys.indexOf(k) < 0 && keys.push(k);
  // klucze z BAZOWEJ macierzy (te same we wszystkich scenariuszach, takze dla usunietych wierszy)
  const baseMatrix = JSON.parse(readData(webRoot, 'civ-matrix.json').toString('utf8'));
  for (const c of baseMatrix.cywilizacje) {
    add(c.ikonaId);
    add(c.Cywilizacja);
    add(c.Cywilizacja.toUpperCase());
  }
  for (const k of ['nope', '', ' grecy ', 'GRECY', 'Chińczycy', 'CHIŃCZYCY', 'chińczycy', 'SŁOWIANIE', 'słowianie', 'İnkowie']) add(k);
  return keys;
}

function encodeCell(cell) {
  return [
    s(cell.rawValue),
    s(cell.baselineValue),
    s(cell.minValue),
    s(cell.maxValue),
    s(cell.maxDistance),
    s(cell.correctedDelta),
    ['POZYTYWNY', 'NEGATYWNY', 'NEUTRALNY'].indexOf(cell.label),
    s(cell.signedIntensity),
    STATUSES.indexOf(cell.consumerStatus),
    T(cell.statusReasonPl),
    T(cell.explanationPl),
    T(cell.difficultyBehaviorPl),
    cell.source,
  ];
}
function encodeFull(cell) {
  return {
    parameterId: cell.parameterId,
    civilizationId: cell.civilizationId,
    civilizationName: cell.civilizationName,
    domain: cell.domain,
    unit: cell.unit,
    formula: cell.formula,
    raw: s(cell.rawValue),
    baselineKind: cell.baselineKind,
    baseline: s(cell.baselineValue),
    min: s(cell.minValue),
    max: s(cell.maxValue),
    maxDistance: s(cell.maxDistance),
    correctedDelta: s(cell.correctedDelta),
    polarity: cell.polarity,
    band: { policyId: cell.neutralBand.policyId, tolerance: s(cell.neutralBand.tolerance), key: cell.neutralBand.key },
    label: cell.label,
    signedIntensity: s(cell.signedIntensity),
    status: cell.consumerStatus,
    statusLabelPl: T(cell.statusLabelPl),
    statusReasonPl: T(cell.statusReasonPl),
    explanationPl: T(cell.explanationPl),
    difficultyBehaviorPl: T(cell.difficultyBehaviorPl),
    source: cell.source,
    matrixVersion: cell.provenance.matrixVersion,
    semanticVersion: cell.provenance.semanticVersion,
    evidence: cell.provenance.consumerEvidence.map(T),
  };
}

// Zwarta forma komorki dla siatki: [domain, unit, formula, raw, baseline, min, max, maxDistance,
// correctedDelta, polarity, bandKey, bandTol, label, signedIntensity, status, statusLabelIdx,
// reasonIdx, explanationIdx, difficultyIdx, source, civName, evidenceIdx[]]
function encodeGrid(c) {
  return [
    c.domain, c.unit, c.formula, s(c.rawValue), s(c.baselineValue), s(c.minValue), s(c.maxValue), s(c.maxDistance),
    s(c.correctedDelta), c.polarity, c.neutralBand.key, s(c.neutralBand.tolerance), c.label, s(c.signedIntensity),
    c.consumerStatus, T(c.statusLabelPl), T(c.statusReasonPl), T(c.explanationPl), T(c.difficultyBehaviorPl), c.source,
    c.civilizationName, c.provenance.consumerEvidence.map(T),
  ];
}
const scenarioOut = [];
for (const sc of SCENARIOS) {
  const tree = sc.id === 'base' ? { root: webRoot, files: null } : buildTree(sc);
  const mods = sc.id === 'base' ? baseMods : await loadModules(tree.root);
  const { M, S, A } = mods;
  const matrix = M.loadCivMatrix();
  const paramIds = Object.keys(matrix.paramDefs);
  const extraParams = ['__nope__', 'zz_nowy_parametr'];
  const allParams = [...paramIds, ...extraParams];
  const keys = civKeysFor(matrix);
  // Liczby w operacjach jako TEKST {n: "..."} (serde_json bez float_roundtrip myli ostatni bit).
  const opsOut = sc.ops.map((op) => (typeof op.value === 'number' ? { ...op, value: { n: s(op.value) } } : op));
  const out = { id: sc.id, ops: opsOut };

  out.dataFnv = {
    matrix: fnv1a64(readData(tree.root, 'civ-matrix.json')),
    civAi: fnv1a64(readData(tree.root, 'civ-ai.json')),
    diplomacy: fnv1a64(readData(tree.root, 'diplomacy.json')),
  };
  out.paramIds = paramIds;
  out.rows = matrix.cywilizacje.map((c) => ({ ikonaId: c.ikonaId, typ: c.typCywilizacji, name: c.Cywilizacja }));
  out.keys = keys;
  out.allParams = allParams;

  // --- civ-matrix.ts
  out.param = keys.map((k) => allParams.map((p) => s(M.civMatrixParam(k, p))));
  const diffKeys = [...matrix.cywilizacje.map((c) => c.ikonaId), 'nope', 'grecy', 'zulusi', 'egipt'];
  out.diffKeys = [...new Set(diffKeys)];
  out.atDifficulty = DIFFS.map((d) => out.diffKeys.map((k) => allParams.map((p) => s(M.civMatrixParamAtDifficulty(k, p, d)))));
  out.atDifficultyDefault = out.diffKeys.map((k) => allParams.map((p) => s(M.civMatrixParamAtDifficulty(k, p))));
  out.paramsAtDifficulty = DIFFS.map((d) =>
    ['grecy', 'rzymianie', 'nope'].map((k) => {
      const o = M.civMatrixParamsAtDifficulty(k, d);
      return { keys: Object.keys(o), values: Object.values(o).map(s) };
    }),
  );
  out.paramDef = allParams.map((p) => {
    const d = M.civMatrixParamDef(p);
    return d ? [d.domena, d.jednostka, d.modul, d.formula] : null;
  });
  const bases = [0, 1, 2.5, 100, -3.7, 0.1, 1e-3];
  out.applyBases = bases.map(s);
  out.applyKeys = ['grecy', 'Rzymianie', 'chinczycy', 'nope', 'egipt'];
  out.apply = bases.map((b) => out.applyKeys.map((k) => allParams.map((p) => s(M.applyCivMatrixParam(b, k, p)))));
  const groups = [
    [], ['walka_atak_piechota'], ['walka_atak_piechota', 'walka_atak_morska'],
    ['walka_atak_piechota', 'walka_atak_piechota', '__nope__'], ['eko_praca_proc', 'eko_pieniadz_proc', 'eko_zywnosc_proc', 'eko_nauka_proc'],
    ['ai_agresywnosc', 'lud_wzrost_proc'], ['__nope__'],
  ];
  out.procGroups = groups;
  out.procSum = groups.map((g) => out.applyKeys.map((k) => s(M.civMatrixProcSum(k, g))));
  out.applyProc = groups.map((g) => [1, 7.5, 0].map((b) => out.applyKeys.map((k) => s(M.civMatrixApplyProc(b, k, g)))));
  out.applyProcBases = [1, 7.5, 0].map(s);

  // --- civ-matrix-semantic.ts
  const sem = {};
  sem.paramIds = [...S.civMatrixSemanticParameterIds()];
  sem.civs = S.civMatrixSemanticCivilizations().map((c) => c.ikonaId);
  sem.status = sem.paramIds.map((p) => S.civMatrixConsumerStatus(p));
  sem.evidence = sem.paramIds.map((p) => S.civMatrixConsumerEvidence(p).map(T));
  sem.polarity = sem.paramIds.map((p) => S.civMatrixSemanticPolarity(p));
  sem.band = sem.paramIds.map((p) => {
    const b = S.civMatrixNeutralBand(matrix.paramDefs[p]);
    return [b.policyId, s(b.tolerance), b.key];
  });
  sem.baseline = sem.paramIds.map((p) => s(S.civMatrixSemanticBaseline(p)));
  sem.baselineExtra = extraParams.map((p) => s(S.civMatrixSemanticBaseline(p)));
  const medians = [[], [3], [1, 2], [5, 1, 3], [4, 1, 3, 2], [2, 2, 2], [-1, -3, -2, 0], [0.1, 0.2, 0.30000000000000004], [1e21, 1, 5]];
  sem.median = { in: medians.map((m) => m.map(s)), out: medians.map((m) => s(S.median(m))) };
  const snapshot = S.buildCivMatrixSemanticSnapshot();
  sem.snapshotHeader = {
    version: snapshot.version,
    difficulty: snapshot.difficulty,
    parameterCount: snapshot.parameterCount,
    civilizationCount: snapshot.civilizationCount,
    expectedCellCount: snapshot.expectedCellCount,
    cellsLen: snapshot.cells.length,
    profilesLen: snapshot.profiles.length,
  };
  sem.profiles = snapshot.profiles.map((p) => ({
    civilizationId: p.civilizationId,
    civilizationName: p.civilizationName,
    difficulty: p.difficulty,
    baselineKind: p.baselineKind,
    parameterCount: p.parameterCount,
    activeCount: p.activeCount,
    inactiveCount: p.inactiveCount,
    blocked: p.blockedReasonPl === undefined ? null : T(p.blockedReasonPl),
    cells: p.cells.map(encodeCell),
  }));
  // per-parametr stale pola (sprawdzamy ze wszystkie komorki zgodne)
  sem.perParam = sem.paramIds.map((pid) => {
    const first = snapshot.cells.find((c) => c.parameterId === pid);
    for (const c of snapshot.cells.filter((x) => x.parameterId === pid)) {
      for (const f of ['domain', 'unit', 'formula', 'polarity']) {
        if (c[f] !== first[f]) throw new Error('niespojne ' + f + ' ' + pid);
      }
      if (JSON.stringify(c.neutralBand) !== JSON.stringify(first.neutralBand)) throw new Error('band ' + pid);
      if (c.statusLabelPl !== first.statusLabelPl && c.consumerStatus === first.consumerStatus) throw new Error('lbl');
    }
    return { domain: first.domain, unit: first.unit, formula: first.formula, baselineKind: first.baselineKind };
  });
  sem.provenance = { matrixVersion: snapshot.cells[0].provenance.matrixVersion, semanticVersion: snapshot.cells[0].provenance.semanticVersion };
  const profKeys = ['grecy', ' GRECY ', 'Słowianie', 'SŁOWIANIE', ' egipt ', 'egipt\u0085', 'nope', '', 'Chińczycy', 'CHINCZYCY', 'zulusi'];
  sem.profileKeys = profKeys;
  sem.profileByKey = profKeys.map((k) => {
    const p = S.buildCivMatrixSemanticProfile(k);
    return {
      civilizationId: p.civilizationId,
      civilizationName: p.civilizationName,
      parameterCount: p.parameterCount,
      activeCount: p.activeCount,
      inactiveCount: p.inactiveCount,
      cellsLen: p.cells.length,
      blocked: p.blockedReasonPl === undefined ? null : T(p.blockedReasonPl),
      first: p.cells.length ? encodeFull(p.cells[0]) : null,
    };
  });
  // wszystkie statusy x wszystkie parametry (teksty zalezne od statusu i parametru)
  sem.allStatuses = {
    statuses: STATUSES,
    params: [...sem.paramIds, '__nope__'],
    cells: [...sem.paramIds, '__nope__'].map((p) =>
      STATUSES.map((st) => {
        const c = S.classifyCivMatrixCell({
          parameterId: p, civilizationId: 'grecy', civilizationName: 'Grecy', rawValue: 3, baselineValue: 2, minValue: 0, maxValue: 5, consumerStatus: st,
        });
        return [c.consumerStatus, T(c.statusLabelPl), T(c.statusReasonPl), T(c.explanationPl), T(c.difficultyBehaviorPl), c.label, s(c.signedIntensity)];
      }),
    ),
  };
  // siatka syntetycznych wejsc
  const gridParamsAll = [
    'ai_agresywnosc', 'eko_korupcja_proc', 'lud_wzrost_proc', 'walka_atak_morska', 'dip_nastawienie_bazowe', 'ai_profil_obronna',
    'lud_limit_populacji', 'walka_atak_piechota', 'obl_mur_proc', 'dip_sklonnosc_sojusze', 'meta_mnoznik_waluta', 'prod_koszt_budynku_proc',
    'mp_koszt_jednostki_proc', '__nope__',
  ].filter((p) => p === '__nope__' || paramIds.includes(p));
  const gridParams =
    sc.id === 'base'
      ? gridParamsAll
      : sc.id === 'partial'
        ? ['walka_atak_kawaleria', 'eko_praca_proc', 'prod_koszt_budynku_proc', 'zz_nowy_parametr', 'ai_agresywnosc']
        : [];
  const tuples = [
    [3, 2, 0, 5], [2, 2, 0, 5], [0, 2, 0, 5], [5, 2, 0, 5], [1, 1, 1, 1], [2, 1, 1, 1], [0, 1, 1, 1], [1, 2, 0, 3],
    [null, 2, 0, 5], [3, null, 0, 5], [3, 2, null, 5], [3, 2, 0, null], [NaN, 2, 0, 5], [3, Infinity, 0, 5], [3, 2, -Infinity, 5],
    [0.07, 0.05, 0.01, 0.1], [-0.3, 0.15, -0.3, 0.6], [100, 50, 0, 200], [1e-9, 0, -1, 1], [-0.0049, 0, -0.0049, 0.0049],
    [0.3333333333333333, 0.1, 0, 1], [7, 5, 1, 10], [0.015, 0.01, 0.005, 0.04], [2.675, 2.5, 1, 4], [-1.005, 0, -1.005, 1.005],
  ];
  const cases = [];
  for (const p of gridParams) {
    for (const tup of tuples) {
      for (const st of [undefined, 'REAL_GAMEPLAY', 'BLOCKED', 'DECISION_REQUIRED', 'UNWIRED']) {
        if (st !== undefined && (tup[0] === null || tup[3] === null) && st !== 'BLOCKED') continue;
        const input = { parameterId: p, civilizationId: 'x_civ', civilizationName: st === 'BLOCKED' ? undefined : 'X', rawValue: tup[0], baselineValue: tup[1], minValue: tup[2], maxValue: tup[3] };
        if (st) input.consumerStatus = st;
        if (st === 'UNWIRED') input.source = 'default';
        const c = S.classifyCivMatrixCell(input);
        cases.push({
          in: [p, tup.map(s), st ?? null, input.civilizationName ?? null, input.source ?? null],
          out: encodeGrid(c),
        });
      }
    }
  }
  sem.grid = cases;
  out.semantic = sem;

  // --- civ-ai-data.ts
  const ai = {};
  const civAiRaw = JSON.parse(readData(tree.root, 'civ-ai.json').toString('utf8'));
  const civParamsRaw = JSON.parse(readData(webRoot, 'civ-params.json').toString('utf8'));
  const dataVariants = [
    { id: 'full', civAiDelete: [], noCivAi: false },
    { id: 'minus-rzymianie', civAiDelete: ['Rzymianie', 'Inkowie'], noCivAi: false },
    { id: 'no-civai', civAiDelete: [], noCivAi: true },
  ];
  const dataOf = (v) => {
    const civAi = v.noCivAi ? undefined : { ...civAiRaw, cywilizacje: civAiRaw.cywilizacje.filter((c) => !v.civAiDelete.includes(c.Cywilizacja)) };
    return { civAi, civParams: civParamsRaw };
  };
  ai.dataVariants = dataVariants;
  const excelNames = JSON.parse(readData(webRoot, 'civs.json').toString('utf8')).cywilizacje.map((c) => c.Cywilizacja);
  const names = [...new Set([...excelNames, ...matrix.cywilizacje.map((c) => c.ikonaId), ...matrix.cywilizacje.map((c) => c.Cywilizacja), 'nope', '', 'GRECY', 'Grecy'])];
  ai.names = names;
  const profileEnc = (p) =>
    p === undefined
      ? null
      : [p.Cywilizacja, s(p.agresywnosc), s(p.ekspansywnosc), s(p.priorytetMilitarny), s(p.priorytetEkonomia), s(p.priorytetNauka), s(p.tolerancjaRyzyka), s(p.sklonnoscDoPodboju), p.profilMapy, p.uwagi ?? null];
  ai.aggressionNorm = dataVariants.map((v) => DIFFS.map((d) => names.map((n) => s(A.civAiAggressionNorm(dataOf(v), n, d)))));
  ai.profilMapy = dataVariants.map((v) => DIFFS.map((d) => names.map((n) => A.civAiProfilMapy(dataOf(v), n, d) ?? null)));
  ai.profileFor = dataVariants.map((v) => DIFFS.map((d) => names.map((n) => profileEnc(A.civAiProfileFor(dataOf(v), n, d)))));
  ai.isKopia = dataVariants.map((v) => names.map((n) => A.isKopiaTypuObronna(dataOf(v), n)));
  ai.civParamsFor = names.map((n) => {
    const r = A.civParamsFor(dataOf(dataVariants[0]), n);
    return r ? [r.Cywilizacja, r.preferowaneBudynki, s(r.modWzrostu), s(r.modEkonomii)] : null;
  });
  ai.civParamsForNoData = names.map((n) => A.civParamsFor({}, n) ?? null);
  const typs = [...TYP_ENUM, 'nope', ''];
  ai.typs = typs;
  ai.excelName = typs.map((t) => A.civExcelNameFromTyp(t) ?? null);
  ai.diploRow = names.map((n) => {
    const r = A.diplomacyPerNacjaRow(n);
    return r ? [r.Cywilizacja, s(r.sklonnoscSojusze), s(r.lojalnosc), s(r.progWojny), s(r.pamietliwosc), s(r.otwartoscHandel), s(r.nastawienieBazowe)] : null;
  });
  ai.diploRowForTyp = typs.map((t) => {
    const r = A.diplomacyPerNacjaForTyp(t);
    return r ? [r.Cywilizacja, s(r.nastawienieBazowe)] : null;
  });
  ai.profileForTyp = dataVariants.map((v) => DIFFS.map((d) => typs.map((t) => profileEnc(A.civAiProfileForTyp(dataOf(v), t, d)))));
  const fallbackAgg = [0.37, 0, 1];
  ai.fallbackAgg = fallbackAgg.map(s);
  ai.resolveAggression = fallbackAgg.map((fb) =>
    [...dataVariants.map(dataOf), undefined].map((data) => DIFFS.map((d) => typs.map((t) => s(A.resolveArchetypeAggression(t, fb, data, d))))),
  );
  ai.resolveAggressionDefaultDiff = typs.map((t) => s(A.resolveArchetypeAggression(t, 0.37)));
  const fallbackTrade = [0.42, 0.9];
  ai.fallbackTrade = fallbackTrade.map(s);
  ai.resolveTrade = fallbackTrade.map((fb) => DIFFS.map((d) => typs.map((t) => s(A.resolveArchetypeTrade(t, fb, d)))));
  ai.resolveTradeDefaultDiff = typs.map((t) => s(A.resolveArchetypeTrade(t, 0.42)));
  const baseTotals = [undefined, 40, 50, 0];
  ai.baseTotals = baseTotals.map(s);
  ai.nastawienie = baseTotals.map((bt) => DIFFS.map((d) => typs.map((t) => s(bt === undefined ? A.nastawienieBazoweZaufanieDelta(t, undefined, d) : A.nastawienieBazoweZaufanieDelta(t, bt, d)))));
  ai.nastawienieDefault = typs.map((t) => s(A.nastawienieBazoweZaufanieDelta(t)));
  out.ai = ai;

  scenarioOut.push(out);
}

// ======================================================================
// D. civ-names.ts i civ-roster.ts (drzewo bazowe)
// ======================================================================
const { N, C, R } = baseMods;
const realCivs = JSON.parse(readData(webRoot, 'civs.json').toString('utf8'));
const realPools = JSON.parse(readData(webRoot, 'city-names-pools.json').toString('utf8'));
const realIds = realCivs.cywilizacje.map((c) => c.ikonaId);

const common = (n, prefix) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
const synthCivs = [
  { ikonaId: 'syn_a', Cywilizacja: 'Syn A', nazwyMiast: common(110, 'A') },
  { ikonaId: 'syn_b', Cywilizacja: 'Syn B', nazwyMiast: common(12, 'B') },
  { ikonaId: 'syn_c', Cywilizacja: 'Syn C', nazwyKlastra: common(10, 'K') },
  { ikonaId: 'syn_d', Cywilizacja: 'Syn D', nazwyMiast: [] },
  { ikonaId: 'syn_e', Cywilizacja: 'Syn E' },
  { ikonaId: 'syn_f', nazwyMiast: [...common(104, 'F'), '', 'F-dup', 'F-dup', 'F105', 'F106', 'F107'] },
  { Cywilizacja: 'Bez ikony', nazwyMiast: common(3, 'Z') },
  { ikonaId: 'syn_a', Cywilizacja: 'Syn A drugi', nazwyMiast: common(110, 'AA') },
];
const synthPools = {
  syn_a: { nazwa_pl: 'Syn A', miasta_cywilizacji: common(110, 'PA') },
  syn_g: { nazwa_pl: 'Syn G', miasta_cywilizacji: common(5, 'PG') },
};
const realViewCivs = realCivs.cywilizacje.map((c) => ({ ikonaId: c.ikonaId, Cywilizacja: c.Cywilizacja, nazwyMiast: c.nazwyMiast }));
const civSets = { real: realViewCivs, synth: synthCivs, mixed: [...realViewCivs.slice(0, 4), ...synthCivs] };
const poolSets = { real: realPools, none: undefined, synth: synthPools, empty: {} };
const idList = [...realIds, 'syn_a', 'syn_b', 'syn_c', 'syn_d', 'syn_e', 'syn_f', 'syn_g', 'nieznany', ''];

const namesOut = { civSets, synthPools, ids: idList, constants: {} };
namesOut.constants = {
  miastaLen: N.MIASTA_CYWILIZACJI_LEN,
  klastraLen: N.NAZWY_KLASTRA_LEN,
  commonLen: N.CITY_NAMES_POOL_COMMON_LEN,
  regularLen: N.CITY_NAMES_POOL_REGULAR_LEN,
};
namesOut.find = Object.entries(civSets).map(([k, civs]) => ({
  set: k,
  out: idList.map((id) => {
    const r = N.findCivByIkonaId({ cywilizacje: civs }, id);
    return r ? civs.indexOf(r) : -1;
  }),
}));
namesOut.klastra = Object.entries(civSets).map(([k, civs]) => ({
  set: k,
  out: idList.map((id) => [...N.getNazwyKlastra({ cywilizacje: civs }, id)]),
}));
namesOut.display = Object.entries(civSets).map(([k, civs]) => ({
  set: k,
  out: idList.map((id) => N.civDisplayName({ cywilizacje: civs }, id)),
}));
namesOut.validateNazwy = Object.entries(civSets).map(([k, civs]) => ({ set: k, out: N.validateNazwyKlastra({ cywilizacje: civs }) }));
namesOut.validateNazwy.push({
  set: 'inline-dupes',
  civs: [{ ikonaId: 'q', nazwyMiast: common(110, 'Q').map((x, i) => (i === 5 ? 'Q1' : x)) }, { Cywilizacja: 'Bez', nazwyMiast: [] }, {}],
  out: N.validateNazwyKlastra({ cywilizacje: [{ ikonaId: 'q', nazwyMiast: common(110, 'Q').map((x, i) => (i === 5 ? 'Q1' : x)) }, { Cywilizacja: 'Bez', nazwyMiast: [] }, {}] }),
});
const usedVariants = {
  undef: undefined,
  empty: [],
  three: null, // wypelniane per cywilizacja (3 pierwsze nazwy z kolejki)
  mixedx: ['Ateny', 'Sparta', 'X', 'A1', 'B1', 'K1', 'PA1', 'PG1'],
  many: common(120, 'A'),
};
const setOf = (a) => (a === undefined ? undefined : new Set(a));
namesOut.usedVariants = { empty: [], mixedx: usedVariants.mixedx, many: usedVariants.many };
const poolsFor = (k) => poolSets[k];
namesOut.start = [];
namesOut.rival = [];
namesOut.foreign = [];
namesOut.state = [];
for (const [cs, civs] of Object.entries(civSets)) {
  for (const ps of Object.keys(poolSets)) {
    for (const uv of ['undef', 'empty', 'mixedx', 'many']) {
      const used = () => setOf(usedVariants[uv]);
      namesOut.start.push({ cs, ps, uv, out: idList.map((id) => N.playerStartCityName({ cywilizacje: civs }, id, poolsFor(ps), used())) });
      namesOut.foreign.push({ cs, ps, uv, out: idList.map((id) => N.foreignCapitalCityName({ cywilizacje: civs }, id, poolsFor(ps), used())) });
      namesOut.rival.push({
        cs, ps, uv,
        out: idList.map((id) => [-2, 0, 1, 2, 3, 7, 10, 11, 12, 25].map((n) => N.clusterRivalCityName({ cywilizacje: civs }, id, n, poolsFor(ps), used()))),
      });
      namesOut.state.push({
        cs, ps, uv,
        out: idList.map((id) => [-1, 0, 1, 5, 9, 10, 11, 130].map((i) => N.stateCityName({ cywilizacje: civs }, id, i, 'Fallback', poolsFor(ps), used()))),
      });
    }
  }
}
namesOut.rivalIndexes = [-2, 0, 1, 2, 3, 7, 10, 11, 12, 25];
namesOut.stateIndexes = [-1, 0, 1, 5, 9, 10, 11, 130];
namesOut.rivalNoUsed = [];
for (const [cs, civs] of Object.entries(civSets)) {
  for (const ps of ['real', 'synth', 'none']) {
    namesOut.rivalNoUsed.push({ cs, ps, out: idList.map((id) => namesOut.rivalIndexes.map((n) => N.clusterRivalCityName({ cywilizacje: civs }, id, n, poolsFor(ps)))) });
  }
}
namesOut.miasta = ['real', 'synth', 'empty'].map((ps) => ({
  ps,
  cywilizacji: idList.map((id) => [...N.getMiastaCywilizacji(poolSets[ps], id)]),
  panstwa: idList.map((id) => [...N.getMiastaPanstwa(poolSets[ps], id)]),
}));
namesOut.aiFounded = ['real', 'synth'].map((ps) => ({
  ps,
  out: idList.map((id) => ['empty', 'mixedx', 'many'].map((uv) => N.pickAiFoundedCityName(poolSets[ps], id, setOf(usedVariants[uv]), 4))),
}));
namesOut.validatePools = Object.entries(civSets).flatMap(([cs, civs]) =>
  ['real', 'synth', 'empty'].map((ps) => ({ cs, ps, out: N.validateCityNamesPools(poolSets[ps], { cywilizacje: civs }) })),
);
// re-eksporty (wartosci i przykladowe wywolania)
namesOut.reexports = {
  suffix: [1, 2, 3, 10, 11, 12].map((n) => N.cityNameWithSuffix('Ateny', n)),
  klastraAt: [N.nazwaKlastraAt(['a', '', 'c'], 0, 'f'), N.nazwaKlastraAt(['a', '', 'c'], 1, 'f'), N.nazwaKlastraAt(['a'], 5, 'f'), N.nazwaKlastraAt(['a'], -1, 'f')],
  next: ['grecy', 'syn_a', 'nope'].map((id) => [N.pickNextCityName(poolSets.real, id, new Set(['Ateny'])), N.pickNextRegularCityName(poolSets.real, id, new Set())]),
  suggest: N.suggestPlayerFoundCityName(realPools, 'grecy', [{ ownerId: 0, name: 'Ateny' }], () => 'grecy', 0),
  ai: N.pickAiFoundCityName(realPools, 'grecy', [{ ownerId: 1, name: 'Ateny' }], () => 'grecy', 1),
  used: [...N.collectUsedCityNamesFromCities([{ ownerId: 1, name: 'Ateny' }, { ownerId: 2, name: 'Rzym' }], (o) => (o === 1 ? 'grecy' : 'rzymianie'), 'grecy')],
  fromNames: N.pickNextCityNameFromNames(['a', 'b'], new Set(['a', 'b']), 'fb'),
};

// --- roster
const rosterOut = {};
rosterOut.civIdsFromRoster = {
  in: [{ ikonaId: 'a' }, {}, { ikonaId: '' }, { ikonaId: 'b' }, { ikonaId: 'a' }].map((c) => c.ikonaId ?? null),
  out: R.civIdsFromRoster([{ ikonaId: 'a' }, {}, { ikonaId: '' }, { ikonaId: 'b' }, { ikonaId: 'a' }]),
  real: R.civIdsFromRoster(realCivs.cywilizacje),
};
const seeds = [0, 1, 2, 5, 42, 99, 12345, 65535, 2147483647, 2147483648, 4294967295, 4294967296, 4294967297, 9007199254740, -1, -7919, -4294967296, 1000000007];
rosterOut.seeds = seeds;
rosterOut.makeRng = seeds.map((sd) => {
  const rng = R.makeRng(sd);
  return Array.from({ length: 6 }, () => s(rng()));
});
const rosters = {
  real: realIds,
  small: ['a', 'b', 'c', 'd', 'e'],
  dupes: ['a', 'b', 'a', '', 'c', 'b', 'd', '', 'e'],
  one: ['solo'],
  empty: [],
  onlyEmpty: ['', ''],
};
rosterOut.rosters = rosters;
const players = (ids) => [...new Set([...ids.filter(Boolean).slice(0, 2), 'nieznany', '', ids.filter(Boolean)[3] ?? 'x'])];
rosterOut.pool = [];
for (const [rk, ids] of Object.entries(rosters)) {
  for (const player of players(ids)) {
    for (const types of [-1, 0, 1, 2, 3, 5, 9, 20]) {
      for (const numAi of [0, 1, 2, 4, 8, 20]) {
        const sd = pick(seeds);
        const prefSets = [undefined, [], ['a', 'c'], ids.slice(5, 8), [...ids.slice(-3), ...ids.slice(0, 2), 'nope', ''], [player, player]];
        const pref = pick(prefSets);
        rosterOut.pool.push({
          r: rk, player, types, numAi, seed: sd, pref: pref ?? null,
          out: R.pickActiveCivPool(ids, player, types, numAi, sd, pref),
        });
      }
    }
  }
}
rosterOut.rotate = [];
for (const sd of seeds) {
  for (const pref of [[], ['a'], ['a', 'b'], ['a', 'b', 'c'], ['a', 'b', 'c', 'd', 'e'], realIds]) {
    rosterOut.rotate.push({ seed: sd, pref, out: R.rotatePreferredForRepairSeed(pref, sd) });
  }
}
rosterOut.assign = [];
const ownerSets = [[], [1], [3, 1, 2], [5, 5, 2], [10, 20, 30, 40, 50, 60, 70, 80], [0, -3, 7], [4, 2, 4, 2, 9]];
for (const [rk, ids] of Object.entries(rosters)) {
  for (const player of players(ids).slice(0, 3)) {
    for (let rep = 0; rep < 40; rep++) {
      const types = pick([-1, 0, 1, 2, 3, 5, 7, 9, 20]);
      const owners = pick(ownerSets);
      const sd = pick(seeds);
      const pref = pick([undefined, undefined, [], ['a', 'c'], ids.slice(5, 8), [...ids.slice(-3), ...ids.slice(0, 2), 'nope', '']]);
      const input = { allCivIds: ids, playerCivId: player, aiOwnerIds: owners, aktywneTypy: types, seed: sd };
      if (pref !== undefined) input.preferredCivIds = pref;
      const res = R.assignAiCivTypes(input);
      rosterOut.assign.push({
        r: rk, player, owners, types, seed: sd, pref: pref ?? null,
        out: [...res.entries()],
      });
    }
  }
}

const out = {
  pin: 'edb8fb56',
  generator: 'gen-p61e-web-vectors.mjs (r1)',
  node: process.version,
  sourceFiles: [
    'gra/src/game/civ-matrix.ts', 'gra/src/game/civ-matrix-semantic.ts', 'gra/src/game/civ-ai-data.ts',
    'gra/src/game/civ-roster.ts', 'gra/src/game/civ-names.ts', 'gra/src/game/city-names-pool.ts',
  ],
  dataFnv: {
    civs: fnv1a64(readData(webRoot, 'civs.json')),
    civMatrix: fnv1a64(readData(webRoot, 'civ-matrix.json')),
    civAi: fnv1a64(readData(webRoot, 'civ-ai.json')),
    civParams: fnv1a64(readData(webRoot, 'civ-params.json')),
    diplomacy: fnv1a64(readData(webRoot, 'diplomacy.json')),
    cityNamesPools: fnv1a64(readData(webRoot, 'city-names-pools.json')),
  },
  texts,
  js,
  scenarios: scenarioOut,
  names: namesOut,
  roster: rosterOut,
};
writeFileSync(outPath, JSON.stringify(out));
console.log(
  `OK numbers=${numbers.length} scenarios=${scenarioOut.length} texts=${texts.length} grid=${scenarioOut.map((x) => x.semantic.grid.length).join('/')} ` +
    `names.start=${namesOut.start.length} pool=${rosterOut.pool.length} assign=${rosterOut.assign.length} rotate=${rosterOut.rotate.length}`,
);
