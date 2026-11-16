// R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1: generator wektorow kolejki rozkazow (`_executeUnitsImmediate`).
//
// Wektory WYKONUJA kod z pinu, nie transkrypcje: metoda `_executeUnitsImmediate` (battleScene.ts:18578-18614)
// jest wycinana z `git show <PIN>:gra/src/battle/battleScene.ts`, typy zdejmowane node:module.stripTypeScriptTypes
// i wstrzykiwana do klasy-atrapy sceny. Atrapy odpowiadaja wylacznie za zaleznosci spoza tej metody:
// `_findPlayerUnit`, `_queuedOrderUnitIds`, `busy`, `_schedule` (zegar), `_performPlayerOrder` (zwraca zdarzenia
// i wywoluje `done` synchronicznie lub odkladnie), `_refreshQueuedOrderVisuals`, `_autoBattleSuspended`.
// Trace zdarzen i lista `u.acted = true` (setter jednostki) to wynik wykonania pinu.
//
// Uzycie (z korzenia repo, Node 22):
//   node rust-port/engine/tests/p6_player_order_queue_gen.mjs <PIN_SHA> > rust-port/engine/tests/p6_player_order_queue_vectors/vectors.json

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = process.argv[2];
if (!PIN) throw new Error('uzycie: p6_player_order_queue_gen.mjs <PIN_SHA>');
const FILE = 'gra/src/battle/battleScene.ts';
const FIRST = 18578;
const LAST = 18614;

const pinSource = execFileSync('git', ['show', `${PIN}:${FILE}`], { encoding: 'utf8', maxBuffer: 1 << 28 });
const lines = pinSource.split('\n');
const fragment = lines.slice(FIRST - 1, LAST).join('\n');
if (!/^ {2}private _executeUnitsImmediate\(unitIds: string\[\]\): void \{$/.test(lines[FIRST - 1])) {
  throw new Error(`pin: linia ${FIRST} nie jest deklaracja _executeUnitsImmediate`);
}
if (lines[LAST - 1] !== '  }') throw new Error(`pin: linia ${LAST} nie zamyka metody`);
if (!lines[LAST - 2].includes('runNext(0);') && !lines[LAST - 2].includes('};')) {
  throw new Error('pin: nieoczekiwany koniec metody');
}
const fragmentSha256 = createHash('sha256').update(fragment).digest('hex');

// Klasa-atrapa. Metoda pinu wstrzykiwana verbatim (bez zmian).
const harnessSource = `
class Harness {
  constructor(ctx) {
    this.ctx = ctx;
    this._susp = true;
    this._queuedOrderUnitIds = new Set(ctx.queued);
  }
  get _autoBattleSuspended() { return this._susp; }
  set _autoBattleSuspended(v) { this._susp = v; this.ctx.events.push('suspend:' + v); }
  get busy() { return this.ctx.busySeq.length ? this.ctx.busySeq.shift() : false; }
  _findPlayerUnit(id) { return this.ctx.units.get(id); }
  _schedule(ms, cb) {
    if (this.ctx.planning) { cb(); return; }
    if (this.ctx.finished) return;
    this.ctx.events.push('schedule:' + ms);
    this.ctx.timers.push(cb);
  }
  _refreshQueuedOrderVisuals() { this.ctx.events.push('refresh'); }
  _performPlayerOrder(u, done) {
    this.ctx.events.push('perform:' + u.id);
    for (const se of this.ctx.sideEffects[u.id] || []) {
      this.ctx.units.get(se.id)[se.flag] = se.value;
    }
    if (this.ctx.asyncIds.includes(u.id)) this.ctx.pending.push(done);
    else done();
    return true;
  }
${fragment}
}
`;
const harnessJs = stripTypeScriptTypes(harnessSource, { mode: 'strip' });

function makeUnit(id, f, ctx) {
  let acted = !!f.acted;
  return {
    id,
    dead: !!f.dead,
    removed: !!f.removed,
    routed: !!f.routed,
    get acted() { return acted; },
    set acted(v) { if (v) ctx.acted.push(id); acted = v; },
  };
}

function runScenario(sc) {
  const ctx = {
    events: [],
    acted: [],
    timers: [],
    pending: [],
    busySeq: [...(sc.busy || [])],
    planning: !!sc.planning,
    finished: !!sc.finished,
    queued: sc.queued || [],
    asyncIds: sc.async || [],
    sideEffects: sc.sideEffects || {},
    units: new Map(),
  };
  for (const u of sc.units) ctx.units.set(u.id, makeUnit(u.id, u, ctx));
  // Pinned class is evaluated in a function scope so that `Harness` is fresh per scenario.
  const Harness = new Function(`${harnessJs}\nreturn Harness;`)();
  const h = new Harness(ctx);
  h._executeUnitsImmediate(sc.ids);
  for (;;) {
    if (ctx.timers.length) { ctx.timers.shift()(); continue; }
    if (ctx.pending.length) { ctx.pending.shift()(); continue; }
    break;
  }
  return { events: ctx.events, acted: ctx.acted };
}

const U = (id, f = {}) => ({ id, ...f });
const scenarios = [
  { name: 'kolejnosc_tablicy_id', units: [U('A'), U('B'), U('C')], ids: ['A', 'B', 'C'] },
  { name: 'kolejnosc_nie_sortowana', units: [U('A'), U('B'), U('C')], ids: ['C', 'A', 'B'] },
  {
    name: 'filtr_dead_removed_routed_acted_queued',
    units: [U('A'), U('B', { dead: true }), U('C', { removed: true }), U('D', { routed: true }),
      U('E', { acted: true }), U('F'), U('G')],
    queued: ['F'],
    ids: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  },
  { name: 'pusta_lista', units: [U('A')], ids: [] },
  { name: 'brak_jednostki_pomijana', units: [U('A'), U('B')], ids: ['X', 'A', 'B'] },
  { name: 'duplikat_wykonywany_raz', units: [U('A'), U('B')], ids: ['A', 'A', 'B'] },
  { name: 'juz_acted_nie_wykonywana', units: [U('A', { acted: true }), U('B')], ids: ['A', 'B'] },
  { name: 'busy_blokuje_do_zdarzenia_zegara', units: [U('A'), U('B')], ids: ['A', 'B'], busy: [true, false, false] },
  { name: 'busy_co_jednostke', units: [U('A'), U('B'), U('C')], ids: ['A', 'B', 'C'], busy: [false, true, false, true, false] },
  { name: 'busy_planowanie_synchroniczne', units: [U('A'), U('B')], ids: ['A', 'B'], busy: [true, false, false], planning: true },
  { name: 'zakonczona_kolejka_bez_zegara', units: [U('A'), U('B')], ids: ['A', 'B'], busy: [true], finished: true },
  { name: 'async_done_przed_nastepna', units: [U('A'), U('B')], ids: ['A', 'B'], async: ['A'] },
  {
    name: 'rozkaz_zabija_nastepna_jednostke',
    units: [U('A'), U('B'), U('C')],
    ids: ['A', 'B', 'C'],
    sideEffects: { A: [{ id: 'B', flag: 'dead', value: true }] },
  },
  {
    name: 'rozkaz_rozbija_nastepna_przy_async',
    units: [U('A'), U('B'), U('C')],
    ids: ['A', 'B', 'C'],
    async: ['A'],
    sideEffects: { A: [{ id: 'B', flag: 'routed', value: true }] },
  },
  {
    name: 'busy_po_async',
    units: [U('A'), U('X1'), U('B')],
    ids: ['A', 'X1', 'B'],
    async: ['A'],
    busy: [false, true, false],
  },
  // Wektory odroznajace filtr startowy od ponownego sprawdzenia w runNext: `busy` jest czytane
  // dopiero w runNext, wiec jednostka odfiltrowana na starcie nie zuzywa odczytu busy.
  { name: 'acted_przed_busy_nie_odracza', units: [U('A', { acted: true }), U('B')], ids: ['A', 'B'], busy: [false, true, false] },
  { name: 'dead_przed_busy_nie_odracza', units: [U('D', { dead: true }), U('B')], ids: ['D', 'B'], busy: [false, true, false] },
  { name: 'routed_przed_busy_nie_odracza', units: [U('R', { routed: true }), U('B')], ids: ['R', 'B'], busy: [false, true, false] },
  // Pusty id (`if (!id) runNext(idx + 1)`, battleScene.ts:18591-18594) pomijany przed odczytem jednostki.
  { name: 'pusty_id_pomijany', units: [U(''), U('B')], ids: ['', 'B'], busy: [] },
  // Planowanie synchroniczne z dwoma kolejnymi busy: petla RunNow ponawia busy-gate bez odroczenia.
  { name: 'busy_planowanie_dwa_razy', units: [U('A'), U('B')], ids: ['A', 'B'], busy: [true, true, false], planning: true },
];

const out = {
  pin: PIN,
  file: FILE,
  fragment_lines: [FIRST, LAST],
  fragment_sha256: fragmentSha256,
  generator: 'rust-port/engine/tests/p6_player_order_queue_gen.mjs',
  scenarios: scenarios.map(sc => ({
    name: sc.name,
    units: sc.units.map(u => ({
      id: u.id,
      dead: !!u.dead,
      removed: !!u.removed,
      routed: !!u.routed,
      acted: !!u.acted,
    })),
    ids: sc.ids,
    queued: sc.queued || [],
    busy: sc.busy || [],
    planning: !!sc.planning,
    finished: !!sc.finished,
    async: sc.async || [],
    side_effects: Object.fromEntries(Object.entries(sc.sideEffects || {}).map(([k, v]) => [
      k, v.map(s => ({ id: s.id, flag: s.flag, value: s.value })),
    ])),
    expect: runScenario(sc),
  })),
};
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
