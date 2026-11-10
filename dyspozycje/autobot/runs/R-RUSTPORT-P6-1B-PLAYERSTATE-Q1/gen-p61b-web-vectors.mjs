// Generator wektorow referencyjnych z URUCHOMIONEGO kodu weba (P6.1B, pin edb8fb56).
// Modul: gra/src/game/playerState.ts (+ difficulty-cost.ts, research.ts, tech-tempo.ts z grafu importow),
// uruchamiany BEZ ZMIAN (zadnego wycinania ani przepisywania funkcji).
// Uzycie (web = git archive edb8fb56 gra/src gra/data w katalogu tymczasowym poza repo):
//   node --experimental-transform-types --import ./p61b-loader-register.mjs ./gen-p61b-web-vectors.mjs \
//        <WEB_ROOT> <RUST_TECH_JSON> <OUT_JSON>
//
// Konwencja liczb: wszystko, co moze byc ulamkiem, zapisane jako String(x) (JS), bo serde_json bez
// float_roundtrip moze zgubic 1 ulp (pulapka z P6.1 r2). Calkowite (era, koszty) jako liczby JSON.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, rustTechArg, outArg] = process.argv;
if (!webRootArg || !rustTechArg || !outArg) {
  console.error('usage: <WEB_ROOT> <RUST_TECH_JSON> <OUT_JSON>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const game = (f) => pathToFileURL(join(webRoot, 'gra/src/game', f)).href;

const ps = await import(game('playerState.ts'));
const research = await import(game('research.ts'));
const dc = await import(game('difficulty-cost.ts'));

const techFile = JSON.parse(readFileSync(join(webRoot, 'gra/data/tech.json'), 'utf8'));
const rustTechFile = JSON.parse(readFileSync(presolve(rustTechArg), 'utf8'));
if (JSON.stringify(techFile) !== JSON.stringify(rustTechFile)) {
  throw new Error('tech.json weba != tech.json silnika Rust (wektory real nie dotycza danych silnika)');
}
const buildings = JSON.parse(readFileSync(join(webRoot, 'gra/data/buildings.json'), 'utf8'));
const REAL = techFile.technologie;

// ---------------------------------------------------------------------------
// Zbiory technologii (zapisywane inline; web i Rust widza te same wiersze)
// ---------------------------------------------------------------------------
function compact(r) {
  const o = {
    Technologia: r.Technologia,
    Epoka: r.Epoka,
    Poziom: r.Poziom,
    'Wymaga (prereq)': r['Wymaga (prereq)'],
    'Koszt nauki': r['Koszt nauki'],
    Historia: '',
  };
  for (const k of ['Uwagi', 'Odblokowuje budynek', 'wymagany budynek', 'wymagane ulepszenie', 'awansDoEpoki']) {
    if (r[k] !== null && r[k] !== undefined) o[k] = r[k];
  }
  return o;
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const realRows = REAL.map(compact);

function patched(rows, patch) {
  return rows.map((r) => (patch[r.Technologia] ? { ...r, ...patch[r.Technologia] } : r));
}

const noPrereq = (rows) => rows.map((r) => ({ ...r, 'Wymaga (prereq)': '—' }));

function syn(name, epoka, poziom, prereq, koszt, extra = {}) {
  return { Technologia: name, Epoka: epoka, Poziom: poziom, 'Wymaga (prereq)': prereq, 'Koszt nauki': koszt, Historia: '', ...extra };
}

const SYN_A = [
  syn('A1', 'Kamień', 1, '—', 10),
  syn('A2', 'Kamien', 2, 'A1', 10, { 'wymagany budynek': 'Biblioteka' }),
  syn('B1', 'Brąz', 3, '-', 5, { 'wymagane ulepszenie': 'Tartak' }),
  syn('B2', 'BRĄZ ', 4, 'A1 + B1', 5),
  syn('B2', 'Braz', 4, '—', 7),
  syn('Z1', 'Żelazo', 5, '', 1),
  syn('Z2', 'zelazo', 5, 'Z1', 0),
  syn('X', 'Bronze', 2, 'brak', 3),
  syn('  pad  ', 'Kamień', 1, 'None', 2),
  syn('', 'Kamień', 1, '—', 1),
  syn('\u{1F600}', 'Kamień', 2, '—', 4),
  syn('Ａ', 'Kamień', 2, '—', 4),
  syn('N1', 'Kamień', 2, 'A1 + + pad', -3),
  syn('constructor', 'constructor', 3, '—', 1),
  syn('T-lo', 'Brąz', 1, '—', 2),
  syn('T-hi', 'Brąz', 9, '—', 2),
  syn('Tie1', 'Żelazo', 5, '—', 7),
  syn('Tie0', 'Żelazo', 5, '—', 7),
];

const SYN_MONEY = [
  syn('Waluta', 'Brąz', 1, '—', 1),
  syn('waluta', 'Brąz', 1, '—', 1),
  syn('  WALUTA ', 'Brąz', 1, '—', 1),
  syn('Waluta2', 'Brąz', 1, '—', 1),
  syn('M1', 'Brąz', 1, '—', 1, { Uwagi: 'kończy Epokę 2 (Pieniądz)' }),
  syn('M2', 'Brąz', 1, '—', 1, { Uwagi: 'PIENIĄDZ' }),
  syn('M3', 'Brąz', 1, '—', 1, { Uwagi: 'pieniadz' }),
  syn('M4', 'Brąz', 1, '—', 1, { Uwagi: 'pieniądze' }),
  syn('M5', 'Brąz', 1, '—', 1, { Uwagi: 'PİENIĄDZ' }),
  syn('M6', 'Brąz', 1, '—', 1, { Uwagi: 'pienią dz' }),
  syn('M7', 'Brąz', 1, '—', 1, { 'Odblokowuje budynek': 'Mennica (pieniądz)' }),
  syn('M8', 'Brąz', 1, '—', 1, { Uwagi: 'pieniąd', 'Odblokowuje budynek': 'z' }),
  syn('M9', 'Brąz', 1, '—', 1, { Uwagi: 'pieniądz', 'Odblokowuje budynek': null }),
  syn('M10', 'Brąz', 1, '—', 1, { Uwagi: null, 'Odblokowuje budynek': null }),
  syn('E0', 'Brąz', 1, '—', 1, { awansDoEpoki: 0 }),
  syn('E2', 'Brąz', 1, '—', 1, { awansDoEpoki: 2 }),
  syn('E3', 'Brąz', 1, '—', 1, { awansDoEpoki: 3 }),
  syn('Em1', 'Brąz', 1, '—', 1, { awansDoEpoki: -1 }),
  syn('Enull', 'Brąz', 1, '—', 1, { awansDoEpoki: null }),
];

const FAST_PATCH = {
  Garncarstwo: { awansDoEpoki: 0 },
  Murarstwo: { awansDoEpoki: 5 },
  Rolnictwo: { awansDoEpoki: 1 },
  Mistycyzm: { Uwagi: 'Pieniądze' },
  Łowiectwo: { 'Odblokowuje budynek': 'Targ (pieniądz)' },
};

const dupRow = { ...realRows.find((r) => r.Technologia === 'Rolnictwo'), Technologia: '  Rolnictwo ' };

const TECHSETS = {
  real: realRows,
  realSlice: realRows.slice(0, 12),
  realMid: realRows.slice(5, 26),
  realFast: patched(noPrereq(realRows), FAST_PATCH),
  realDup: [...realRows, clone(dupRow), clone(realRows[3])],
  synA: SYN_A,
  synMoney: SYN_MONEY,
};

// ---------------------------------------------------------------------------
// Bramki (wynik web `researchGatesMet` per nazwa techu; Rust dostaje gotowy predykat)
// ---------------------------------------------------------------------------
const bIds = (names) => buildings.filter((b) => names.includes(b.nazwa)).map((b) => b.id);
const GATE_CFG = {
  g0: { built: [], impr: [] },
  g1: { built: bIds(['Cegielnia', 'Biblioteka', 'Koszary']), impr: ['tartak'] },
  g2: { built: buildings.map((b) => b.id), impr: ['tartak', 'kopalnia_miedzi'] },
};
const webGate = (name) => {
  const c = GATE_CFG[name];
  if (!c) return undefined;
  return { empireBuiltIds: new Set(c.built), buildings, empireImprovementKeys: new Set(c.impr) };
};
const gateMaps = {};
for (const g of Object.keys(GATE_CFG)) {
  gateMaps[g] = {};
  for (const [sname, rows] of Object.entries(TECHSETS)) {
    const m = {};
    for (const r of rows) m[r.Technologia] = research.researchGatesMet(r, webGate(g));
    gateMaps[g][sname] = m;
  }
}

// ---------------------------------------------------------------------------
// Pomocnicze: snapshot stanu i wykonawca skryptow
// ---------------------------------------------------------------------------
const S = (x) => String(x);
const sortedSet = (set) => [...set].sort();

function snap(state, full) {
  const o = {
    skarbiec: S(state.skarbiec),
    nauka: S(state.nauka),
    badana: state.badana,
    target: state.playerResearchTargetId,
    queue: [...state.researchQueue],
    era: state.era,
    pieniadzMnoznik: state.pieniadzMnoznik,
    tempoGry: state.tempoGry,
    zbadaneCount: state.zbadane.size,
  };
  if (full) o.zbadane = sortedSet(state.zbadane);
  return o;
}

function applyPatch(state, f) {
  for (const [k, v] of Object.entries(f)) {
    if (k === 'zbadane') state.zbadane = new Set(v);
    else if (k === 'researchQueue') state.researchQueue = [...v];
    else state[k] = v;
  }
}

function runScenario(sc) {
  const techs = clone(TECHSETS[sc.techset]);
  const gate = sc.gate ? webGate(sc.gate) : undefined;
  const states = {};
  const seat = (id) => (states[id] ??= ps.createPlayerState());
  for (const id of sc.seats ?? ['0']) seat(id);
  for (const [id, f] of Object.entries(sc.init ?? {})) applyPatch(seat(id), f);
  const steps = [];
  for (const op of sc.ops) {
    const sid = op.s ?? '0';
    const st = seat(sid);
    const diff = op.d ?? sc.difficulty ?? 'normal';
    let ret = null;
    let full = false;
    switch (op.op) {
      case 'addNauka':
        st.nauka += Number(op.n);
        break;
      case 'patch':
        applyPatch(st, op.f);
        break;
      case 'step': {
        const r = ps.researchStep(st, techs, gate, diff);
        ret = {
          completed: r.completed.map((c) => ({ id: c.id, koszt: c.koszt, awansEpoki: c.awansEpoki, pieniadz: c.pieniadz, era: c.era })),
          badana: r.badana,
        };
        full = true;
        break;
      }
      case 'set':
        ret = ps.setPlayerResearchTarget(st, op.id, techs, gate);
        break;
      case 'enqueue':
        ret = ps.enqueueResearchTarget(st, op.id, techs);
        break;
      case 'dequeue':
        ret = ps.dequeueResearchTarget(st, op.id);
        break;
      case 'clear':
        ps.clearResearchQueue(st);
        break;
      case 'plan':
        ret = ps.getResearchPlanSnapshot(st);
        break;
      case 'planLength':
        ret = ps.researchPlanLength(st);
        break;
      case 'getState': {
        const r = ps.getResearchState(st, techs, Number(op.npt), diff);
        ret = {
          pula: S(r.pula),
          targetId: r.targetId,
          kosztCelu: r.kosztCelu,
          postep: S(r.postepFraction),
          turnsLeft: r.turnsLeft === null ? null : S(r.turnsLeft),
        };
        break;
      }
      default:
        throw new Error(`nieznana operacja ${op.op}`);
    }
    steps.push({ ret, state: snap(st, full), s: sid });
  }
  return { ...sc, expected: steps };
}

// deterministyczny LCG TYLKO do wyboru operacji w generatorze (wynik i tak pochodzi z weba)
function lcg(seed) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

const NAMES = REAL.map((r) => r.Technologia);
const EXTRA_NAMES = ['Nieistniejaca', '', ' Rolnictwo', 'rolnictwo'];
const TEMPOS = ['szybka', 'standardowa', 'dluga'];
const DIFFS = ['easy', 'normal', 'hard'];

function simOps(turns, nauka) {
  const ops = [];
  for (let i = 0; i < turns; i++) {
    ops.push({ op: 'addNauka', n: nauka });
    ops.push({ op: 'step' });
  }
  return ops;
}

function fuzzOps(seed, count, names) {
  const rnd = lcg(seed);
  const ops = [];
  for (let i = 0; i < count; i++) {
    const r = rnd();
    const nm = () => pick(rnd, [...names, ...EXTRA_NAMES]);
    if (r < 0.25) ops.push({ op: 'addNauka', n: pick(rnd, [0, 1, 2.5, 5, 17, 40, 120.5, 300, 900]) });
    else if (r < 0.45) ops.push({ op: 'step' });
    else if (r < 0.6) ops.push({ op: 'set', id: nm() });
    else if (r < 0.75) ops.push({ op: 'enqueue', id: nm() });
    else if (r < 0.83) ops.push({ op: 'dequeue', id: nm() });
    else if (r < 0.87) ops.push({ op: 'clear' });
    else if (r < 0.9) ops.push({ op: 'plan' });
    else if (r < 0.93) ops.push({ op: 'planLength' });
    else if (r < 0.98) ops.push({ op: 'getState', npt: pick(rnd, [0, -1, 0.5, 3, 7, 25.25, 1000]) });
    else ops.push({ op: 'patch', f: { tempoGry: pick(rnd, TEMPOS) } });
  }
  return ops;
}

const scenarios = [];
// Liczby wejsciowe (nauka, naukaPerTurn) zapisujemy jako String(x): serde_json bez float_roundtrip
// nie gwarantuje bit-w-bit parsowania np. 39.999; Rust czyta je przez str::parse::<f64>.
const add = (sc) =>
  scenarios.push(
    runScenario({
      ...sc,
      ops: sc.ops.map((o) => ({
        ...o,
        ...(o.n !== undefined ? { n: S(o.n) } : {}),
        ...(o.npt !== undefined ? { npt: S(o.npt) } : {}),
      })),
    }),
  );

// 1. symulacje end-turn: tempo x trudnosc na calym drzewku (z ustawianiem celow)
for (const tempo of TEMPOS) {
  for (const diff of DIFFS) {
    const ops = [{ op: 'patch', f: { tempoGry: tempo } }];
    for (let i = 0; i < 24; i++) {
      ops.push({ op: 'addNauka', n: 90 });
      if (i % 4 === 1) ops.push({ op: 'set', id: NAMES[(i * 7) % NAMES.length] });
      if (i % 5 === 2) ops.push({ op: 'enqueue', id: NAMES[(i * 11 + 3) % NAMES.length] });
      ops.push({ op: 'step' });
    }
    add({ name: `sim-${tempo}-${diff}`, techset: 'real', difficulty: diff, ops });
  }
}
// 2. ulamkowa nauka, granica rowna koszt
add({
  name: 'fractional-boundary',
  techset: 'real',
  difficulty: 'normal',
  init: { 0: { tempoGry: 'szybka' } },
  ops: [
    { op: 'addNauka', n: 19.75 },
    { op: 'step' },
    { op: 'addNauka', n: 0.25 },
    { op: 'step' },
    { op: 'addNauka', n: 39.999 },
    { op: 'step' },
    { op: 'getState', npt: 0.1 },
    { op: 'addNauka', n: 0.001 },
    { op: 'step' },
    { op: 'getState', npt: 3 },
    { op: 'getState', npt: 0 },
  ],
});
// 3. kolejka: lancuch zalezny, limit, duplikaty, promocja
add({
  name: 'queue-chain',
  techset: 'real',
  difficulty: 'normal',
  ops: [
    { op: 'enqueue', id: 'Brązownictwo' },
    { op: 'enqueue', id: 'Garncarstwo' },
    { op: 'enqueue', id: 'Murarstwo' },
    { op: 'enqueue', id: 'Obróbka drewna' },
    { op: 'enqueue', id: 'Rolnictwo' },
    { op: 'enqueue', id: 'Garncarstwo' },
    { op: 'enqueue', id: 'Nieistniejaca' },
    { op: 'plan' },
    { op: 'planLength' },
    { op: 'addNauka', n: 100000 },
    { op: 'step' },
    { op: 'plan' },
    { op: 'dequeue', id: 'Brązownictwo' },
    { op: 'dequeue', id: 'Nieistniejaca' },
    { op: 'plan' },
    { op: 'clear' },
    { op: 'plan' },
  ],
});
add({
  name: 'queue-dequeue-active',
  techset: 'real',
  difficulty: 'normal',
  ops: [
    { op: 'enqueue', id: 'Rolnictwo' },
    { op: 'enqueue', id: 'Łowiectwo' },
    { op: 'enqueue', id: 'Oswojenie zwierząt' },
    { op: 'dequeue', id: 'Rolnictwo' },
    { op: 'plan' },
    { op: 'dequeue', id: 'Oswojenie zwierząt' },
    { op: 'dequeue', id: 'Łowiectwo' },
    { op: 'plan' },
    { op: 'planLength' },
    { op: 'enqueue', id: 'Rolnictwo' },
    { op: 'patch', f: { zbadane: ['Rolnictwo'] } },
    { op: 'enqueue', id: 'Rolnictwo' },
    { op: 'patch', f: { researchQueue: ['Rolnictwo', 'Wymiana', 'Mistycyzm'], playerResearchTargetId: 'Łowiectwo' } },
    { op: 'addNauka', n: 100000 },
    { op: 'step' },
    { op: 'plan' },
  ],
});
add({
  name: 'queue-invalid-entries-skipped',
  techset: 'real',
  difficulty: 'normal',
  ops: [
    { op: 'patch', f: { tempoGry: 'szybka', playerResearchTargetId: 'Rolnictwo', researchQueue: ['Rolnictwo', 'Wymiana', 'Nieistniejaca', 'Mistycyzm', 'Garncarstwo'] } },
    { op: 'addNauka', n: 12 },
    { op: 'step' },
    { op: 'plan' },
    { op: 'addNauka', n: 200 },
    { op: 'step' },
    { op: 'plan' },
  ],
});
// 4. set target: wszystkie powody odrzucenia
add({
  name: 'set-target-rejections',
  techset: 'real',
  difficulty: 'normal',
  ops: [
    { op: 'set', id: 'Nieistniejaca' },
    { op: 'set', id: 'Brązownictwo' },
    { op: 'set', id: 'Żegluga' },
    { op: 'set', id: 'Rolnictwo' },
    { op: 'patch', f: { zbadane: ['Rolnictwo'] } },
    { op: 'set', id: 'Rolnictwo' },
    { op: 'set', id: 'Gospodarka wodna' },
    { op: 'patch', f: { zbadane: [...NAMES.filter((n) => REAL.find((r) => r.Technologia === n).Epoka === 'Kamień')] } },
    { op: 'set', id: 'Żegluga' },
    { op: 'set', id: 'Pismo' },
    { op: 'set', id: 'Handel' },
    { op: 'plan' },
  ],
});
for (const g of ['g0', 'g1', 'g2']) {
  add({
    name: `gate-${g}`,
    techset: 'real',
    gate: g,
    difficulty: 'normal',
    ops: [
      { op: 'patch', f: { tempoGry: 'szybka' } },
      ...simOps(14, 400).flatMap((o, i) => (o.op === 'step' && i % 6 === 5 ? [{ op: 'set', id: NAMES[(i * 3) % NAMES.length] }, o] : [o])),
      { op: 'getState', npt: 9 },
    ],
  });
}
// 5. era / pieniadz / awans (realFast: bez prereqow, patche awansDoEpoki i Uwag)
add({
  name: 'era-money-fast',
  techset: 'realFast',
  difficulty: 'normal',
  ops: [{ op: 'patch', f: { tempoGry: 'szybka' } }, { op: 'addNauka', n: 1000000 }, { op: 'step' }, { op: 'step' }],
});
add({
  name: 'era-money-real-full',
  techset: 'real',
  difficulty: 'normal',
  ops: [{ op: 'addNauka', n: 10000000 }, { op: 'step' }, { op: 'step' }, { op: 'getState', npt: 1 }],
});
add({
  name: 'era-money-slice',
  techset: 'realSlice',
  difficulty: 'hard',
  ops: [{ op: 'addNauka', n: 100000 }, { op: 'step' }, { op: 'patch', f: { era: 7 } }, { op: 'step' }],
});
add({
  name: 'duplicates-whitespace-names',
  techset: 'realDup',
  difficulty: 'easy',
  ops: [{ op: 'addNauka', n: 5000 }, { op: 'step' }, { op: 'addNauka', n: 5000 }, { op: 'step' }, { op: 'enqueue', id: 'Rolnictwo' }, { op: 'set', id: 'Rolnictwo' }],
});
add({
  name: 'target-empty-string',
  techset: 'real',
  difficulty: 'normal',
  ops: [
    { op: 'patch', f: { playerResearchTargetId: '' } },
    { op: 'getState', npt: 5 },
    { op: 'patch', f: { playerResearchTargetId: null, badana: '' } },
    { op: 'getState', npt: 5 },
    { op: 'patch', f: { badana: 'Nieistniejaca' } },
    { op: 'getState', npt: 5 },
    { op: 'step' },
  ],
});
add({
  name: 'stale-badana-reassigned',
  techset: 'real',
  difficulty: 'normal',
  ops: [
    { op: 'patch', f: { badana: 'Żegluga', tempoGry: 'szybka' } },
    { op: 'addNauka', n: 3 },
    { op: 'step' },
    { op: 'patch', f: { badana: ' Rolnictwo', playerResearchTargetId: 'Brązownictwo' } },
    { op: 'step' },
    { op: 'patch', f: { playerResearchTargetId: 'Rolnictwo', badana: 'Łowiectwo' } },
    { op: 'step' },
  ],
});
// 6. hot-seat: trzy niezalezne fotele, przeplatane operacje
add({
  name: 'hotseat-three-seats',
  techset: 'real',
  difficulty: 'normal',
  seats: ['0', '1', '2'],
  init: { 1: { tempoGry: 'szybka' }, 2: { tempoGry: 'dluga' } },
  ops: [
    { s: '0', op: 'addNauka', n: 300 },
    { s: '1', op: 'addNauka', n: 300 },
    { s: '2', op: 'addNauka', n: 300 },
    { s: '0', op: 'step' },
    { s: '1', op: 'step' },
    { s: '2', op: 'step' },
    { s: '1', op: 'enqueue', id: 'Garncarstwo' },
    { s: '0', op: 'enqueue', id: 'Murarstwo' },
    { s: '1', op: 'plan' },
    { s: '0', op: 'plan' },
    { s: '2', op: 'plan' },
    { s: '0', op: 'addNauka', n: 500 },
    { s: '1', op: 'addNauka', n: 500 },
    { s: '0', op: 'step' },
    { s: '1', op: 'step' },
    { s: '2', op: 'getState', npt: 4 },
    { s: '1', op: 'getState', npt: 4, d: 'hard' },
    { s: '0', op: 'getState', npt: 4, d: 'easy' },
  ],
});
// 7. fuzz
const FUZZ = [
  [101, 'real', 'normal'],
  [102, 'real', 'easy'],
  [103, 'real', 'hard'],
  [104, 'realFast', 'normal'],
  [105, 'realMid', 'normal'],
  [106, 'realSlice', 'hard'],
  [107, 'realDup', 'easy'],
  [108, 'real', 'normal', 'g1'],
  [109, 'real', 'hard', 'g0'],
  [110, 'realFast', 'easy', 'g2'],
];
for (const [seed, techset, difficulty, gate] of FUZZ) {
  add({ name: `fuzz-${seed}-${techset}${gate ? `-${gate}` : ''}`, techset, difficulty, gate, ops: fuzzOps(seed, 70, NAMES) });
}

// ---------------------------------------------------------------------------
// Wektory funkcji czystych (na zbiorze synA / synMoney / listach napisow)
// ---------------------------------------------------------------------------
const PREREQ_RAW = [
  '', '—', '–', '-', 'brak', 'BRAK', 'None', 'none', ' A ', 'A+B', 'A + B', 'A +  + B', 'A + - ', ' + ', '+',
  'A+—+B', ' A + B﻿', ' X ', 'Ż + ż', 'a+A', '—+—', 'brak + Brak', 'A + none',
  '\u0085A', '᠎A', 'Garncarstwo + Rolnictwo + Oswojenie zwierząt', 'A+B+C+D', 'A + A', ' A ',
];
const RESEARCHED_SETS = [[], ['A'], ['A', 'B'], ['A', 'B', 'C', 'D'], ['X'], ['Ż', 'ż', 'a'], ['Garncarstwo', 'Rolnictwo', 'Oswojenie zwierząt'], ['\u0085A'], ['᠎A']];
const prereqs = PREREQ_RAW.map((raw) => {
  const t = syn('P', 'Kamień', 1, raw, 1);
  return {
    raw,
    parsed: ps.parsePrereqs(t),
    met: RESEARCHED_SETS.map((s) => ps.prereqsMet(t, new Set(s))),
  };
});

const EPOKA_RAW = [
  'Kamień', 'Kamien', 'KAMIEŃ', 'kamień', '  Brąz ', 'Braz', 'BRĄZ', 'Żelazo', 'ŻELAZO', 'zelazo', 'Zelazo', 'Bronze', '',
  'constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 'Kamień', 'Ka mień', 'kamień ',
  'ŻELAZO﻿', 'Ǆ', 'İ', 'ĄĆĘŁŃÓŚŹŻ', 'braz\u0085',
];
const epochNumbers = EPOKA_RAW.map((raw) => ({ raw, n: ps.epochNumber(syn('E', raw, 1, '—', 1)) }));

const DONE_SETS = [
  [],
  ['A1'],
  ['A1', 'B1', 'pad'],
  ['A1', 'A2', 'pad', '\u{1F600}', 'Ａ'],
  ['  pad  '],
  ['A1', 'A2', 'B1', 'B2', 'X', 'pad', '\u{1F600}', 'Ａ', 'N1', 'constructor', 'T-lo'],
  ['A1', 'A2', 'B1', 'B2', 'X', 'pad', '\u{1F600}', 'Ａ', 'N1', 'constructor', 'T-lo', 'T-hi', 'Z1', 'Z2', 'Tie0', 'Tie1', ''],
  ['T-lo'],
  ['Tie0'],
];
const synTechs = clone(SYN_A);
const idxOf = (list, arr) => list.map((t) => arr.indexOf(t));
const pureSets = DONE_SETS.map((done) => {
  const doneSet = new Set(done);
  const per = {};
  for (const gname of [null, 'g0', 'g1', 'g2']) {
    const gate = gname ? webGate(gname) : undefined;
    per[gname ?? 'none'] = {
      available: idxOf(ps.availableTechs(synTechs, doneSet, gate), synTechs),
      cheapest: ps.cheapestAvailable(synTechs, doneSet, gate),
    };
  }
  return {
    done,
    prereqsMet: synTechs.map((t) => ps.prereqsMet(t, doneSet)),
    epochGate: synTechs.map((t) => ps.epochGateMet(t, synTechs, doneSet)),
    tierGate: synTechs.map((t) => ps.epochTierGateMet(t, synTechs, doneSet)),
    perGate: per,
  };
});
const pureRows = (rows) =>
  clone(rows).map((t) => ({
    techCost: ps.techCost(t),
    eraAdvanceTarget: ps.eraAdvanceTarget(t),
    isEraAdvanceTech: ps.isEraAdvanceTech(t),
    isMoneyTech: ps.isMoneyTech(t),
    epochNumber: ps.epochNumber(t),
    parsePrereqs: ps.parsePrereqs(t),
  }));

// cheapestAvailable: remisy nazw (UTF-16 vs UTF-8) na dedykowanym zbiorze
// U+FF21 (BMP, UTF-16 0xFF21) vs U+1F600 (UTF-16 0xD83D 0xDE00): JS `<` daje U+1F600 wczesniej,
// kolejnosc bajtow UTF-8 dalaby U+FF21 wczesniej. Rust musi porownywac jednostki UTF-16.
const TIE_SET = [syn('Ａ', 'Kamień', 1, '—', 4), syn('\u{1F600}', 'Kamień', 1, '—', 4)];
const tieCheapest = ps.cheapestAvailable(clone(TIE_SET), new Set());
const tieAvailable = idxOf(ps.availableTechs(TIE_SET, new Set()), TIE_SET);

// koszty: web scaledResearchCost (gracz, ownerId 0) per technologia x tempo x trudnosc
const costs = {};
for (const tempo of TEMPOS) {
  costs[tempo] = {};
  for (const diff of DIFFS) {
    costs[tempo][diff] = {};
    for (const t of REAL) {
      costs[tempo][diff][t.Technologia] = dc.scaledResearchCost(ps.techCost(t), tempo, 0, diff, t.Epoka);
    }
  }
}

const def = ps.createPlayerState();
const out = {
  meta: {
    pin: 'edb8fb56',
    node: process.version,
    source: 'gra/src/game/playerState.ts (uruchomiony bez zmian)',
    techJsonEqualRust: true,
  },
  constants: {
    PIENIADZ_MNOZNIK: ps.PIENIADZ_MNOZNIK,
    RESEARCH_QUEUE_MAX: ps.RESEARCH_QUEUE_MAX,
  },
  defaults: {
    keys: Object.keys(def),
    state: { ...snap(def, true), building: def.buildingCostPace, kosztJednostek: def.kosztJednostekPace, wzrost: def.wzrostLudnosciPace, ruch: def.ruchSwiataPace, civType: def.civType, civBonusy: def.civBonusy, rakieta: def.rakietaWystrzelona },
  },
  techsets: TECHSETS,
  gateMaps,
  costs,
  prereqs,
  researchedSets: RESEARCHED_SETS,
  epochNumbers,
  pure: {
    synTechs,
    doneSets: pureSets,
    rowsSynA: pureRows(SYN_A),
    rowsSynMoney: pureRows(SYN_MONEY),
    tie: { set: TIE_SET, cheapest: tieCheapest, available: tieAvailable },
  },
  scenarios,
};
writeFileSync(presolve(outArg), JSON.stringify(out));
const nOps = scenarios.reduce((a, s) => a + s.ops.length, 0);
const nSteps = scenarios.reduce((a, s) => a + s.ops.filter((o) => o.op === 'step').length, 0);
console.log(`OK scenarios=${scenarios.length} ops=${nOps} steps=${nSteps} prereqs=${prereqs.length} epochs=${epochNumbers.length} doneSets=${pureSets.length} costs=${TEMPOS.length * DIFFS.length * REAL.length}`);
