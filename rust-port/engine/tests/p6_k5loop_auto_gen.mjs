// K5-LOOP-AUTO-WEKTORY V1/V5/V6: generator wektorow pinu dla faz AUTO (bez oblezenia i tryb reczny).
// Zrodlo: gra/src/battle/battleScene.ts przy pinie 07d2fbd72 (tylko odczyt, git show).
//   V1: _beginAutoBatchTurnFromCurrentState (:5696-5704) + _beginAutoBatchPhase (:5707-5745)
//   V5: _finishAutoBatchPhase (:5961-5973)
//   V6: _haltAutoBattleTurn (:17333-17344) + callback fali _launchAutoBatchResolution (:5865-5905)
//   Stale ACT_GAP_MS (:1014) i TURN_GAP_MS (:1023).
// Metody sa WYCIAGANE z pinu i WYKONYWANE (nie przepisywane); typy TS zdejmuje node:module stripTypeScriptTypes.
// Stubowane sa wylacznie: _snapshotAutoBatchIntents (planowanie AI, osobny temat), resolveAutoBatchPhase (K5G0,
// stub iteruje migawki w kolejnosci jak modul: strona == faza, zywe, niezajete -> hold), _resolveAutoBatchAttack
// (zapisuje callback `done` do wykonania przez wektor), _resolveAutoBatchMovement / _fleeStep (throw: wektory
// nie wchodza w te galezie), _schedule (zapisuje ms i nazwe timera, nie odpala), _checkEnd (skrypt z wektora).
//
// Uruchom:  node rust-port/engine/tests/p6_k5loop_auto_gen.mjs           (zapis vectors.json + SHA256SUMS)
//           node rust-port/engine/tests/p6_k5loop_auto_gen.mjs --check   (porownanie z plikami + sha256sum -c)
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as nodeModule from 'node:module';

const PIN = '07d2fbd72';
const SRC_PATH = 'gra/src/battle/battleScene.ts';
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'p6_k5loop_auto_vectors');
const checkMode = process.argv.includes('--check');

const pinSource = execFileSync('git', ['show', `${PIN}:${SRC_PATH}`], {
  cwd: here,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');

function pinConst(name) {
  const re = new RegExp(`^const ${name}\\s*=\\s*(\\d+);`);
  for (const line of pinSource) {
    const m = re.exec(line);
    if (m) return Number(m[1]);
  }
  throw new Error(`brak stalej ${name} w pinie ${PIN}`);
}
const ACT_GAP_MS = pinConst('ACT_GAP_MS');
const TURN_GAP_MS = pinConst('TURN_GAP_MS');
if (ACT_GAP_MS !== 160 || TURN_GAP_MS !== 240) {
  throw new Error(`nieoczekiwane stale z pina: ACT_GAP_MS=${ACT_GAP_MS} TURN_GAP_MS=${TURN_GAP_MS}`);
}

// Cialo metody od naglowka do domykajacego "  }" w tej samej kolumnie (jak p6_k5doc_geometry_gen.mjs).
function pinMethod(header) {
  const start = pinSource.indexOf(header);
  if (start < 0) throw new Error(`brak naglowka w pinie ${PIN}: ${header}`);
  const body = [];
  for (let i = start; i < pinSource.length; i++) {
    body.push(pinSource[i].replace(/^  private /, '  '));
    if (i > start && pinSource[i] === '  }') return body.join('\n');
  }
  throw new Error(`brak konca metody w pinie ${PIN}: ${header}`);
}

const HEADERS = {
  beginFromState: '  private _beginAutoBatchTurnFromCurrentState(): void {',
  beginPhase: '  private _beginAutoBatchPhase(side: AutoBatchPhase, units: RuntimeBattleUnit[]): void {',
  finishPhase: '  private _finishAutoBatchPhase(token: number): void {',
  haltTurn: '  private _haltAutoBattleTurn(suspendInFlight = true): void {',
  launch: '  private _launchAutoBatchResolution(resolution: AutoBatchResolution, token: number): void {',
};
// Metody obiektu literalowego sa oddzielone przecinkami (cialo konczy sie "  }").
const methodSource = Object.values(HEADERS).map(pinMethod).join(',\n');
const objectSource = `({\n${methodSource}\n});`;
const stripped = nodeModule.stripTypeScriptTypes(objectSource).trim().replace(/;$/, '');

// Wolne identyfikatory z pina: stale i cellKey (klucz pola, bez znaczenia dla wartosci oczekiwanych).
const cellKey = (q, r) => `${q},${r}`;
// Stub K5G0 (patrz naglowek): kolejnosc wynikow = kolejnosc migawek, filtr jak w module.
function resolveAutoBatchPhase(phase, snapshots) {
  return snapshots
    .filter(s => s.side === phase && !s.acted && !s.dead && !s.removed && !s.fadingOut)
    .map(s => ({ unitId: s.id, side: phase, kind: 'hold', steps: [], targetId: null }));
}
const pinMethods = new Function(
  'ACT_GAP_MS',
  'TURN_GAP_MS',
  'cellKey',
  'resolveAutoBatchPhase',
  `return ${stripped};`,
)(ACT_GAP_MS, TURN_GAP_MS, cellKey, resolveAutoBatchPhase);

function toRu(u) {
  return {
    bu: { id: u.id, hp: 30 },
    side: u.side,
    q: u.q,
    r: u.r,
    dead: u.dead,
    fadingOut: u.fading_out,
    removed: u.removed,
    routed: u.routed,
    acted: u.acted,
  };
}

function scheduleName(cb) {
  const s = String(cb);
  if (/_beginTurn/.test(s)) return 'beginTurn';
  if (/_finishAutoBatchPhase/.test(s)) return 'finishPhase';
  throw new Error(`nieznany cel _schedule: ${s}`);
}

// Wykonuje sekwencje operacji na obiekcie `this` zbudowanym z metod pinu + stubow; zwraca obserwacje.
function runPin(setup) {
  const trace = { banners: [], beginCalls: [], endChecks: [], scheduled: [], deferred: [] };
  const self = {
    finished: setup.finished,
    _manualMode: setup.manual,
    _autoBattleSuspended: setup.suspended,
    _battleAwaitingOrders: setup.awaiting,
    siegeWallCol: setup.siege_wall_col,
    atk: setup.atk.map(toRu),
    def: setup.def.map(toRu),
    occByKey: new Map(),
    _autoBatchToken: setup.token,
    _autoBatchPhase: setup.phase,
    _autoBatchResolutions: setup.resolutions.map(r => ({
      unitId: r.unit_id,
      side: r.side,
      kind: r.kind,
      steps: [],
      targetId: r.target_id,
    })),
    _autoBatchPending: setup.pending,
    vTimers: [],
    busy: false,
  };
  for (const ru of [...self.atk, ...self.def]) self.occByKey.set(cellKey(ru.q, ru.r), ru);
  for (const k of Object.keys(pinMethods)) self[k] = pinMethods[k];

  self._snapshotAutoBatchIntents = () => [];
  self._updateBattlePhaseBanner = ru => {
    trace.banners.push(ru ? ru.bu.id : null);
  };
  self._findUnitById = id => [...self.atk, ...self.def].find(u => u.bu.id === id);
  self._checkEnd = () => {
    const ended = setup.check_end;
    trace.endChecks.push(ended);
    if (ended) self.finished = true;
    return ended;
  };
  self._schedule = (ms, cb) => {
    trace.scheduled.push({ ms, timer: scheduleName(cb) });
  };
  self._resolveAutoBatchAttack = (_ru, _targetId, done) => {
    trace.deferred.push(done);
  };
  self._resolveAutoBatchMovement = () => {
    throw new Error('wektor V1/V5/V6 nie wchodzi w sciezke ruchu');
  };
  self._fleeStep = () => {
    throw new Error('wektor V1/V5/V6 nie wchodzi w ucieczke');
  };
  const realBegin = self._beginAutoBatchPhase;
  // Wywolanie liczy sie jako start fazy tylko gdy pin wyemitowal baner (strazniki :5708 odrzucaja bez banera).
  self._beginAutoBatchPhase = function (side, units) {
    const ids = units.map(u => u.bu.id);
    const before = trace.banners.length;
    const result = realBegin.call(this, side, units);
    if (trace.banners.length > before) trace.beginCalls.push({ side, ids });
    return result;
  };

  for (const op of setup.ops) {
    switch (op.op) {
      case 'begin_from_state':
        self._beginAutoBatchTurnFromCurrentState();
        break;
      case 'begin_phase':
        self._beginAutoBatchPhase(op.side, op.ids.map(id => self._findUnitById(id)));
        break;
      case 'finish':
        self._finishAutoBatchPhase(op.token);
        break;
      case 'halt':
        self._haltAutoBattleTurn(op.suspend);
        break;
      case 'launch_attack': {
        const attacker = self._findUnitById(op.attacker);
        self._launchAutoBatchResolution(
          { unitId: op.attacker, side: attacker.side, kind: 'attack', steps: [], targetId: op.target },
          op.token,
        );
        break;
      }
      case 'deliver_attack_done': {
        const done = trace.deferred.shift();
        if (!done) throw new Error('brak odlozonego callbacku ciosu');
        done();
        break;
      }
      default:
        throw new Error(`nieznana operacja: ${op.op}`);
    }
  }
  if (trace.beginCalls.length !== trace.banners.length || trace.beginCalls.length > 1) {
    throw new Error('wektor musi miec co najwyzej jedno wywolanie _beginAutoBatchPhase');
  }
  return {
    banners: trace.banners,
    begin_phase_calls: trace.beginCalls.map(c => ({ side: c.side, ids: c.ids })),
    end_checks: trace.endChecks,
    scheduled: trace.scheduled,
    resolution_ids: self._autoBatchResolutions.map(r => r.unitId),
    phase_after: self._autoBatchPhase,
    pending_after: self._autoBatchPending,
    token_after: self._autoBatchToken,
    suspended_after: self._autoBattleSuspended,
    awaiting_after: self._battleAwaitingOrders,
  };
}

// ---- wektory ----
const U = (id, side, q, r, f = {}) => ({
  id,
  side,
  q,
  r,
  dead: !!f.dead,
  fading_out: !!f.fading,
  removed: !!f.removed,
  routed: !!f.routed,
  acted: !!f.acted,
});
const BASE = {
  token: 3,
  pending: 0,
  phase: null,
  finished: false,
  manual: false,
  suspended: false,
  awaiting: false,
  siege_wall_col: -1,
  check_end: false,
  atk: [],
  def: [],
  resolutions: [],
  ops: [],
};
const defaultsV5 = [
  U('d0', 'def', 3, 0),
  U('d1', 'def', 4, 0, { fading: true }),
  U('d2', 'def', 5, 0, { acted: true }),
  U('d3', 'def', 6, 0, { dead: true }),
  U('d4', 'def', 7, 0, { removed: true }),
];
const twoVsTwo = () => ({
  atk: [U('a0', 'atk', 0, 0), U('a1', 'atk', 1, 0)],
  def: [U('d0', 'def', 5, 0), U('d1', 'def', 6, 0)],
});

const VECTORS = [
  // ---- V1: _beginAutoBatchTurnFromCurrentState + _beginAutoBatchPhase (pin :5696-5704, :5707-5745) ----
  {
    id: 'v1a_attackers_first_when_attackers_live',
    pin: 'battleScene.ts:5696-5704 (wybor strony) + 5707-5745 (faza)',
    title: 'Dwoch zywych atakujacych i dwoch obroncow: pierwsza faza to atak, obrona czeka',
    over: { ...twoVsTwo(), ops: [{ op: 'begin_from_state' }] },
  },
  {
    id: 'v1b_defenders_first_when_no_attacker_left',
    pin: 'battleScene.ts:5696-5704 (galaz else: faza obrony)',
    title: 'Atakujacy martwi lub usunieci: pierwsza faza to obrona',
    over: {
      atk: [U('a0', 'atk', 0, 0, { dead: true }), U('a1', 'atk', 1, 0, { removed: true })],
      def: [U('d0', 'def', 5, 0), U('d1', 'def', 6, 0)],
      ops: [{ op: 'begin_from_state' }],
    },
  },
  {
    id: 'v1c_acted_attacker_is_skipped',
    pin: 'battleScene.ts:5698-5703 (filtr liveUnacted)',
    title: 'Atakujacy juz dzialajacy w tej turze nie wchodzi do fazy ataku',
    over: {
      atk: [U('a0', 'atk', 0, 0, { acted: true }), U('a1', 'atk', 1, 0)],
      def: [U('d0', 'def', 5, 0)],
      ops: [{ op: 'begin_from_state' }],
    },
  },
  {
    id: 'v1d_siege_wall_blocks_turn_start',
    pin: 'battleScene.ts:5697 (siegeWallCol >= 0 -> brak fazy AUTO wsadowej)',
    title: 'Oblezenie z murem: sciezka AUTO wsadowa nie startuje',
    over: { ...twoVsTwo(), siege_wall_col: 0, ops: [{ op: 'begin_from_state' }] },
  },
  {
    id: 'v1e_manual_mode_blocks_turn_start',
    pin: 'battleScene.ts:5697 (_manualMode -> return)',
    title: 'Tryb reczny: start fazy AUTO z aktualnego stanu nie rusza',
    over: { ...twoVsTwo(), manual: true, ops: [{ op: 'begin_from_state' }] },
  },
  {
    id: 'v1f_finished_battle_blocks_turn_start',
    pin: 'battleScene.ts:5697 (finished -> return)',
    title: 'Zakonczona bitwa: start fazy AUTO nie rusza',
    over: { ...twoVsTwo(), finished: true, ops: [{ op: 'begin_from_state' }] },
  },
  {
    id: 'v1g_suspended_blocks_phase_start',
    pin: 'battleScene.ts:5708 (_autoBattleSuspended -> return w _beginAutoBatchPhase)',
    title: 'Zawieszona fala AUTO: _beginAutoBatchPhase nie startuje fazy',
    over: { ...twoVsTwo(), suspended: true, ops: [{ op: 'begin_phase', side: 'atk', ids: ['a0', 'a1'] }] },
  },

  // ---- V5: _finishAutoBatchPhase (pin :5961-5973) ----
  {
    id: 'v5a_attack_phase_end_starts_defense_with_filter',
    pin: 'battleScene.ts:5961-5973 (filtr obroncow :5964, start fazy def :5966)',
    title: 'Koniec fali atakujacego bez konca bitwy: obrona startuje tylko na obroncach z filtra pinu',
    over: {
      atk: [U('a0', 'atk', 0, 0)],
      def: defaultsV5,
      phase: 'atk',
      ops: [{ op: 'finish', token: 3 }],
    },
  },
  {
    id: 'v5b_defense_phase_end_schedules_next_turn',
    pin: 'battleScene.ts:5969-5972 (koniec fazy obrony -> TURN_GAP_MS)',
    title: 'Koniec fazy obrony bez konca bitwy: nastepna tura po TURN_GAP_MS 240',
    over: { phase: 'def', ops: [{ op: 'finish', token: 3 }] },
  },
  {
    id: 'v5c_attacker_wins_in_attack_phase_no_defense',
    pin: 'battleScene.ts:5963 (_checkEnd w fazie atakujacego -> return)',
    title: 'Atakujacy wygrywa w swojej fazie: obrona nie startuje, brak timera',
    over: {
      atk: [U('a0', 'atk', 0, 0)],
      def: [U('d0', 'def', 5, 0)],
      phase: 'atk',
      check_end: true,
      ops: [{ op: 'finish', token: 3 }],
    },
  },
  {
    id: 'v5d_stale_token_is_ignored',
    pin: 'battleScene.ts:5962 (token !== _autoBatchToken -> return)',
    title: 'Przeterminowany token: _finishAutoBatchPhase nic nie zmienia i nie sprawdza konca',
    over: {
      atk: [U('a0', 'atk', 0, 0)],
      def: [U('d0', 'def', 5, 0)],
      phase: 'atk',
      ops: [{ op: 'finish', token: 2 }],
    },
  },
  {
    id: 'v5e_manual_mode_blocks_finish',
    pin: 'battleScene.ts:5962 (_manualMode -> return)',
    title: 'Tryb reczny: _finishAutoBatchPhase nie wchodzi w faze',
    over: { phase: 'atk', manual: true, ops: [{ op: 'finish', token: 3 }] },
  },

  // ---- V6: _haltAutoBattleTurn (pin :17333-17344) + callback fali (pin :5865-5905) ----
  {
    id: 'v6a_halt_mid_wave_late_callback_dropped',
    pin: 'battleScene.ts:17333-17344 (token++) + 5868-5876 (complete: token !== _autoBatchToken)',
    title: 'Przerwanie w polowie fali: spozniony callback ciosu nie zmienia stanu ani nie planuje finishu',
    over: {
      token: 7,
      pending: 2,
      phase: 'atk',
      ...twoVsTwo(),
      resolutions: [
        { unit_id: 'a0', side: 'atk', kind: 'attack', target_id: 'd0' },
        { unit_id: 'a1', side: 'atk', kind: 'hold', target_id: null },
      ],
      ops: [
        { op: 'launch_attack', attacker: 'a0', target: 'd0', token: 7 },
        { op: 'halt', suspend: true },
        { op: 'deliver_attack_done' },
      ],
    },
  },
  {
    id: 'v6b_halt_without_suspend_keeps_flag_clear',
    pin: 'battleScene.ts:17333-17344 (suspendInFlight=false: bez _autoBattleSuspended)',
    title: 'Przerwanie bez zawieszenia: flaga zawieszenia zostaje false, spozniony callback ignorowany',
    over: {
      token: 7,
      pending: 2,
      phase: 'atk',
      ...twoVsTwo(),
      resolutions: [
        { unit_id: 'a0', side: 'atk', kind: 'attack', target_id: 'd0' },
        { unit_id: 'a1', side: 'atk', kind: 'hold', target_id: null },
      ],
      ops: [
        { op: 'launch_attack', attacker: 'a0', target: 'd0', token: 7 },
        { op: 'halt', suspend: false },
        { op: 'deliver_attack_done' },
      ],
    },
  },
  {
    id: 'v6c_callback_before_halt_counts_down',
    pin: 'battleScene.ts:5868-5876 (kontrola: callback przy zgodnym tokenie zmniejsza _autoBatchPending)',
    title: 'Kontrola: callback przed przerwaniem zmniejsza licznik fali o jeden, bez finishu',
    over: {
      token: 7,
      pending: 2,
      phase: 'atk',
      ...twoVsTwo(),
      resolutions: [
        { unit_id: 'a0', side: 'atk', kind: 'attack', target_id: 'd0' },
        { unit_id: 'a1', side: 'atk', kind: 'hold', target_id: null },
      ],
      ops: [
        { op: 'launch_attack', attacker: 'a0', target: 'd0', token: 7 },
        { op: 'deliver_attack_done' },
      ],
    },
  },
];

const out = {
  source: `gra/src/battle/battleScene.ts @ ${PIN}`,
  pin_refs: {
    TURN_GAP_MS: 'battleScene.ts:1023',
    ACT_GAP_MS: 'battleScene.ts:1014',
    beginFromState: 'battleScene.ts:5696-5704',
    beginPhase: 'battleScene.ts:5707-5745',
    finishPhase: 'battleScene.ts:5961-5973',
    haltTurn: 'battleScene.ts:17333-17344',
    launch: 'battleScene.ts:5865-5905',
  },
  act_gap_ms: ACT_GAP_MS,
  turn_gap_ms: TURN_GAP_MS,
  vectors: VECTORS.map(v => {
    const setup = { ...BASE, ...v.over };
    return {
      id: v.id,
      pin: v.pin,
      title: v.title,
      setup,
      expect: runPin(setup),
    };
  }),
};

// Mini-straznik: zadne wektory bez odpalonej operacji i bez pustego oczekiwania (oszukiwane wektory).
for (const v of out.vectors) {
  if (v.setup.ops.length === 0) throw new Error(`wektor bez operacji: ${v.id}`);
}

const text = JSON.stringify(out, null, 2) + '\n';
const digest = createHash('sha256').update(text).digest('hex');
const sums = `${digest}  vectors.json\n`;

if (checkMode) {
  const onDisk = readFileSync(join(outDir, 'vectors.json'), 'utf8');
  if (onDisk !== text) {
    console.error('DRIFT: vectors.json nie zgadza sie z generatorem');
    process.exit(1);
  }
  const sumsOnDisk = readFileSync(join(outDir, 'SHA256SUMS'), 'utf8');
  if (sumsOnDisk !== sums) {
    console.error('DRIFT: SHA256SUMS nie zgadza sie z vectors.json');
    process.exit(1);
  }
  console.log(`OK: ${out.vectors.length} wektorow, sha256 ${digest}`);
} else {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'vectors.json'), text);
  writeFileSync(join(outDir, 'SHA256SUMS'), sums);
  console.log(`wrote ${out.vectors.length} vectors to ${outDir}, sha256 ${digest}`);
}
