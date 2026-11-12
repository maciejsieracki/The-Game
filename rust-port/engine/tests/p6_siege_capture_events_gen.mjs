// R-RUSTPORT-P6-SIEGE-TRANSFER-Q7-Q1: generator wektorow dla rejestratorow zdarzen przejecia miasta
// (`recordCityCaptureEvent`, `recordCivElimEvent`) z pinu webu.
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, pliki tylko do odczytu, poza repo):
//   * gra/src/main.ts: recordCivElimEvent, recordCityCaptureEvent, captureReportOneLine,
//     captureReportShortLine, mirrorCaptureReportRowsForVictim (wycinane po nazwie i wykonywane w node);
//   * gra/src/game/retained-side-panel-events.ts: trimSidePanelEventLog (wycinany i wykonywany w node).
//
// Wykonywane REALNIE: wszystkie funkcje wymienione wyzej (typy zdejmowane przez node:module.stripTypeScriptTypes).
// Stan domkniecia (warEventLog, civElimEventDetails, cityCaptureEventDetails, turn, refreshD1bHud) jest
// atrapa w pamieci. Granica jawna: `eliminationSpectacleByLabel` jest zawsze pusta, wiec pole `spectacle`
// nie pojawia sie w wektorach (wejscie wolajacego, osobny temat).
//
// Uzycie:
//   node tests/p6_siege_capture_events_gen.mjs <main.ts@pin> <retained-side-panel-events.ts@pin> \
//     > tests/p6_siege_capture_events_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const [mainPath, retainedPath] = process.argv.slice(2);
if (!mainPath || !retainedPath) {
  throw new Error('uzycie: gen.mjs <main.ts> <retained-side-panel-events.ts>');
}
const mainLines = readFileSync(mainPath, 'utf8').split('\n');
const retainedLines = readFileSync(retainedPath, 'utf8').split('\n');

function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\b`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

const FNS = [
  [mainLines, 'captureReportOneLine'],
  [mainLines, 'captureReportShortLine'],
  [mainLines, 'mirrorCaptureReportRowsForVictim'],
  [mainLines, 'recordCivElimEvent'],
  [mainLines, 'recordCityCaptureEvent'],
  [retainedLines, 'trimSidePanelEventLog'],
];
const SRC_FNS = FNS.map(([lines, name]) => extractFn(lines, name)).join('\n\n');

// Naglowek domkniecia (odpowiednik zmiennych z zakresu `main.ts`). TS; typy zdejmowane przez node.
const HEADER = `
let turn: number = 1;
let hudRefreshes: number = 0;
const warEventLog: any[] = [];
const civElimEventDetails = new Map<string, any>();
const cityCaptureEventDetails = new Map<string, any>();
const eliminationSpectacleByLabel = new Map<string, any>();
const CITY_CAPTURE_EVENT_PREFIX = 'capture-';
function refreshD1bHud(): void { hudRefreshes++; }
const warEventDetailOwners = [
  { idPrefix: CITY_CAPTURE_EVENT_PREFIX, details: cityCaptureEventDetails },
  { idPrefix: 'elim-cs-', details: civElimEventDetails },
] as const;
function trimWarEventLog(): void {
  trimSidePanelEventLog(warEventLog, 8, warEventDetailOwners);
}
`;

const TAIL = `
return {
  setTurn(t: number) { turn = t; },
  recordCivElimEvent,
  recordCityCaptureEvent,
  snapshot() {
    const sortEntries = (m: Map<string, any>) =>
      [...m.keys()].sort().map(k => [k, m.get(k)]);
    return {
      hudRefreshes,
      warEventLog: warEventLog.map(e => ({ ...e })),
      civElim: Object.fromEntries(sortEntries(civElimEventDetails)),
      city: Object.fromEntries(sortEntries(cityCaptureEventDetails)),
    };
  },
};
`;

const ts = `const __mk = (): any => {\n${HEADER}\n${SRC_FNS}\n${TAIL}\n};`;
const js = stripTypeScriptTypes(ts, { mode: 'transform' });
// eslint-disable-next-line no-new-func
const mkEnv = new Function(js + '\nreturn __mk;')();

const snap = env => JSON.parse(JSON.stringify(env.snapshot()));

const rowsA = [
  { label: 'Złoto', value: '+120', tone: 'gain', group: 'lup' },
  { label: 'Ludność', value: '+1', tone: 'gain', group: 'przejete' },
  { label: 'Pula pracy', value: '−30', tone: 'loss', group: 'strata' },
];
const rowsB = [
  { label: 'Złoto ze skarbca', value: '+1234', tone: 'gain', group: 'lup' },
  { label: 'Nauka', value: '+16', tone: 'gain', group: 'lup' },
  { label: 'Budynki', value: '+2', tone: 'info', group: 'przejete' },
  { label: 'Lup: brak', value: 'brak', tone: 'info' },
];
const rowsNoGroup = [{ label: 'Złoto', value: '+5', tone: 'gain' }];

function cityArgs(over) {
  return {
    cityId: 'c1',
    cityName: 'Rzym',
    oldOwner: 2,
    newOwner: 0,
    rows: rowsA,
    victimLabel: 'Kartagina',
    captorLabel: 'Gracz',
    eliminatedCivLabel: null,
    ...over,
  };
}

// Kazdy krok: operacja + snapshot po niej.
const scenarios = [];

function scenario(name, steps) {
  const env = mkEnv(); // swiezy stan domkniecia dla kazdego scenariusza
  const out = [];
  for (const s of steps) {
    if (s.op === 'setTurn') env.setTurn(s.turn);
    else if (s.op === 'civElim') {
      const args = [s.csOwnerId, s.civLabel, s.details];
      if (s.cause !== undefined) args.push(s.cause);
      env.recordCivElimEvent(...args);
    } else if (s.op === 'cityCapture') env.recordCityCaptureEvent(s.args);
    else throw new Error(`nieznana operacja ${s.op}`);
    out.push({ step: s, snapshot: snap(env) });
  }
  scenarios.push({ name, steps: out });
}

scenario('player-captures-ai-city', [
  { op: 'setTurn', turn: 3 },
  { op: 'cityCapture', args: cityArgs({}) },
]);

scenario('ai-captures-player-city-mirrors-rows', [
  { op: 'setTurn', turn: 4 },
  { op: 'cityCapture', args: cityArgs({ cityId: 'p1', cityName: 'Ateny', oldOwner: 0, newOwner: 3, rows: rowsB, victimLabel: 'Gracz', captorLabel: 'Kartagina' }) },
]);

scenario('dedup-same-turn-same-pair-and-reverse-pair', [
  { op: 'setTurn', turn: 5 },
  { op: 'cityCapture', args: cityArgs({}) },
  { op: 'cityCapture', args: cityArgs({ rows: rowsB }) },
  { op: 'cityCapture', args: cityArgs({ oldOwner: 0, newOwner: 2, rows: rowsB, victimLabel: 'Gracz', captorLabel: 'Kartagina' }) },
]);

scenario('ai-to-ai-capture-is-ignored', [
  { op: 'setTurn', turn: 6 },
  { op: 'cityCapture', args: cityArgs({ oldOwner: 2, newOwner: 3, rows: rowsA }) },
  { op: 'cityCapture', args: cityArgs({ oldOwner: -1, newOwner: 2, rows: rowsA }) },
]);

scenario('capture-with-elimination-label', [
  { op: 'setTurn', turn: 7 },
  { op: 'cityCapture', args: cityArgs({ cityId: 'c9', cityName: 'Kartagina-Stolica', oldOwner: 3, newOwner: 0, rows: rowsB, victimLabel: 'Kartagina', captorLabel: 'Gracz', eliminatedCivLabel: 'Kartagina' }) },
  { op: 'cityCapture', args: cityArgs({ cityId: 'c10', cityName: 'Pusta', oldOwner: 4, newOwner: 0, rows: rowsNoGroup, victimLabel: 'Ateny', captorLabel: 'Gracz', eliminatedCivLabel: '' }) },
  { op: 'cityCapture', args: cityArgs({ cityId: 'c11', cityName: 'Bez lupu', oldOwner: 4, newOwner: 0, rows: [{ label: 'Ludność', value: '+1', tone: 'gain', group: 'przejete' }], victimLabel: 'Ateny', captorLabel: 'Gracz' }) },
]);

scenario('civ-elim-default-and-podboj-and-duplicate-id', [
  { op: 'setTurn', turn: 8 },
  { op: 'civElim', csOwnerId: 3, civLabel: 'Kartagina', details: 'Wchłonięta przez dyplomację' },
  { op: 'civElim', csOwnerId: 4, civLabel: 'Ateny', details: 'Zdobyta', cause: 'podboj' },
  { op: 'civElim', csOwnerId: 3, civLabel: 'Kartagina', details: 'Druga wersja', cause: 'dyplomacja' },
]);

scenario('trim-evicts-details-beyond-eight-entries', [
  { op: 'setTurn', turn: 1 },
  { op: 'civElim', csOwnerId: 1, civLabel: 'A', details: 'a' },
  { op: 'cityCapture', args: cityArgs({ cityId: 'x1', cityName: 'X1', oldOwner: 1, newOwner: 0 }) },
  { op: 'setTurn', turn: 2 },
  { op: 'civElim', csOwnerId: 2, civLabel: 'B', details: 'b' },
  { op: 'cityCapture', args: cityArgs({ cityId: 'x2', cityName: 'X2', oldOwner: 2, newOwner: 0 }) },
  { op: 'setTurn', turn: 3 },
  { op: 'civElim', csOwnerId: 5, civLabel: 'C', details: 'c' },
  { op: 'cityCapture', args: cityArgs({ cityId: 'x3', cityName: 'X3', oldOwner: 5, newOwner: 0 }) },
  { op: 'setTurn', turn: 4 },
  { op: 'civElim', csOwnerId: 6, civLabel: 'D', details: 'd' },
  { op: 'cityCapture', args: cityArgs({ cityId: 'x4', cityName: 'X4', oldOwner: 6, newOwner: 0 }) },
  { op: 'setTurn', turn: 5 },
  { op: 'civElim', csOwnerId: 7, civLabel: 'E', details: 'e' },
  { op: 'cityCapture', args: cityArgs({ cityId: 'x5', cityName: 'X5', oldOwner: 7, newOwner: 0 }) },
]);

const doc = {
  pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
  source: 'gra/src/main.ts: recordCivElimEvent, recordCityCaptureEvent, captureReportOneLine, captureReportShortLine, mirrorCaptureReportRowsForVictim; gra/src/game/retained-side-panel-events.ts: trimSidePanelEventLog',
  boundary: 'eliminationSpectacleByLabel pusta: pole spectacle nieobecne we wszystkich wektorach',
  scenarios,
};

process.stdout.write(JSON.stringify(doc, null, 2) + '\n');
