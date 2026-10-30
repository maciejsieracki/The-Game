// P6.8D (partie 8D-P1 gold-deficit.ts, 8D-P2 mennica-zloto-grace.ts + applyGoldDeficitHpLoss):
// wektory z URUCHOMIONEGO weba 91dc998a (git archive, poza repo).
// Uruchomienie (Node 22, z katalogu tego runu, bez builda gra/):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8d-gold-mennica-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <KATALOG_WYJSCIA>
// Kodowanie (jak citizen): liczba calkowita = JSON number; niecalkowita = {"$f": String(x)};
// NaN/Infinity/-Infinity/-0 = {"$n": "..."}; undefined = {"$undef": true}; null = null.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

const GD = await import(src('game/gold-deficit.ts'));
const MZ = await import(src('game/mennica-zloto-grace.ts'));
const SETUP = await import(src('units/setup.ts'));

const enc = (x) => {
  if (x === undefined) return { $undef: true };
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
};
const encObj = (o) => {
  const out = {};
  for (const [k, v] of Object.entries(o)) out[k] = enc(v);
  return out;
};
const encTick = (t) =>
  t === undefined || t === null
    ? null
    : {
        ownerId: enc(t.ownerId),
        skarbiec: enc(t.skarbiec),
        deficytZlota: t.deficytZlota,
        turyDeficytuZlotaPo: enc(t.turyDeficytuZlotaPo),
        zlotoDeficytAtrycjaAktywna: t.zlotoDeficytAtrycjaAktywna,
      };

// ---------------------------------------------------------------------------
// 1. buildGoldDeficitParams / freshGoldDeficitState
// ---------------------------------------------------------------------------
const RAW_CASES = [
  { name: 'pusty', raw: {} },
  { name: 'brakDifficulty', raw: { zloto_deficyt_stat_mult: { normal: 0.6 } } },
  {
    name: 'pelnyNormal',
    raw: {
      zloto_deficyt_stat_mult: { easy: 0.9, normal: 0.75, hard: 0.6 },
      zloto_deficyt_karencja_tur: { easy: 5, normal: 3, hard: 2 },
      zloto_deficyt_hp_frac: { easy: 0.05, normal: 0.08, hard: 0.12 },
    },
  },
  {
    name: 'ekonomiaMiasta',
    raw: {
      ekonomia_miasta: {
        zloto_deficyt_stat_mult: { easy: 0.5, normal: 0.25, hard: 0.1 },
        zloto_deficyt_karencja_tur: { easy: 0, normal: 1, hard: 7 },
        zloto_deficyt_hp_frac: { easy: 1, normal: 0, hard: 0.5 },
      },
    },
  },
  {
    name: 'stringZamiastLiczby',
    raw: { zloto_deficyt_stat_mult: { easy: '0.5', normal: '0.5', hard: '0.5' } },
  },
  {
    name: 'brakWartosciDlaTrudnosci',
    raw: { zloto_deficyt_karencja_tur: { normal: 4 }, zloto_deficyt_hp_frac: {} },
  },
  {
    name: 'zeroIUjemne',
    raw: {
      zloto_deficyt_stat_mult: { normal: 0 },
      zloto_deficyt_karencja_tur: { normal: -2 },
      zloto_deficyt_hp_frac: { normal: -0.3 },
    },
  },
  // r4 (Evaluator r3 zarzut 2): NaN/Infinity/-Infinity w wierszach raw => fallback (web Number.isFinite)
  {
    name: 'nieskonczonosci',
    raw: {
      zloto_deficyt_stat_mult: { easy: NaN, normal: Infinity, hard: -Infinity },
      zloto_deficyt_karencja_tur: { easy: -Infinity, normal: NaN, hard: 4 },
      zloto_deficyt_hp_frac: { easy: NaN, normal: NaN, hard: -0.2 },
    },
  },
];
// raw kodowany jak wektor (NaN/Infinity przezyja JSON); buildGoldDeficitParams dostaje oryginal
const encRaw = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encRaw(x)]))
    : enc(v);
const DIFFS = ['easy', 'normal', 'hard'];
const paramCases = [];
for (const rc of RAW_CASES) {
  for (const d of DIFFS) {
    paramCases.push({
      name: rc.name,
      difficulty: d,
      raw: encRaw(rc.raw),
      expected: encObj(GD.buildGoldDeficitParams(rc.raw, d)),
    });
  }
}
// domyslna trudnosc (brak 2. argumentu)
paramCases.push({
  name: 'domyslnaTrudnosc',
  difficulty: null,
  raw: encRaw(RAW_CASES[2].raw),
  expected: encObj(GD.buildGoldDeficitParams(RAW_CASES[2].raw)),
});

const fresh = GD.freshGoldDeficitState();

// ---------------------------------------------------------------------------
// 2. advanceGoldDeficit + akcesory (globalny _lastTicks)
// ---------------------------------------------------------------------------
const PARAM_SETS = [
  { zlotoDeficytStatMult: 0.75, zlotoDeficytKarencjaTur: 3, zlotoDeficytHpFrac: 0.08 },
  { zlotoDeficytStatMult: 0.5, zlotoDeficytKarencjaTur: 0, zlotoDeficytHpFrac: 0.25 },
  { zlotoDeficytStatMult: 0.9, zlotoDeficytKarencjaTur: 1, zlotoDeficytHpFrac: 1 },
  { zlotoDeficytStatMult: 0.6, zlotoDeficytKarencjaTur: NaN, zlotoDeficytHpFrac: 0 },
  { zlotoDeficytStatMult: 0.6, zlotoDeficytKarencjaTur: -2, zlotoDeficytHpFrac: 0.5 },
  { zlotoDeficytStatMult: 0.6, zlotoDeficytKarencjaTur: Infinity, zlotoDeficytHpFrac: 0.5 },
  // karencja ulamkowa: countdown = max(1, karencja - po) ma tu znaczenie (r3 zarzut mutacji)
  { zlotoDeficytStatMult: 0.6, zlotoDeficytKarencjaTur: 2.5, zlotoDeficytHpFrac: 0.5 },
  { zlotoDeficytStatMult: 0.6, zlotoDeficytKarencjaTur: 0.5, zlotoDeficytHpFrac: 0.5 },
];

// Sekwencje skarbca: wartosc per owner per tura.
const TREASURY_SEQS = {
  narastajacy: [5, -1, -2, -3, -4, 0, -1, 10, -0.5, -0.5],
  wahania: [-1, 1, -1, -1, 2, -3, -3, -3, -3, -3, 0, -0],
  zerowy: [0, 0, -0, 0],
  specjalne: [NaN, -Infinity, Infinity, -1, NaN, 0],
  dlugi: Array.from({ length: 12 }, (_, i) => (i % 4 === 3 ? 4 : -(i + 1))),
};
const OWNERS_SEQ = [1, 2, 7];
const EXTRA_OWNER = 99;

const advanceCases = [];
for (const [seqName, seq] of Object.entries(TREASURY_SEQS)) {
  for (let pi = 0; pi < PARAM_SETS.length; pi++) {
    const params = PARAM_SETS[pi];
    const states = new Map();
    const steps = [];
    seq.forEach((t, turn) => {
      // kazdy owner dostaje wartosc przesunieta o indeks (rozne przebiegi per owner)
      const table = {};
      OWNERS_SEQ.forEach((oid, k) => {
        const v = seq[(turn + k) % seq.length];
        table[oid] = k === 0 ? t : v;
      });
      const ownerIds = turn === 4 ? [1, 1, 2, 7] : OWNERS_SEQ; // duplikat wlasciciela w turze 4
      const res = GD.advanceGoldDeficit(
        ownerIds,
        states,
        (id) => table[id] ?? 0,
        params,
      );
      const accessors = {};
      for (const oid of [...OWNERS_SEQ, EXTRA_OWNER]) {
        accessors[oid] = {
          isGoldDeficit: GD.isGoldDeficit(oid),
          isGoldDeficitStarving: GD.isGoldDeficitStarving(oid),
          countdown: enc(GD.getGoldDeficitCountdown(oid, params.zlotoDeficytKarencjaTur)),
          lastTick: encTick(GD.getLastGoldDeficitTick(oid)),
        };
      }
      steps.push({
        treasury: encObj(table),
        ownerIds,
        perOwner: res.perOwner.map(encTick),
        byOwner: [...res.byOwner.entries()].map(([k, v]) => [k, encTick(v)]),
        states: [...states.entries()].map(([k, v]) => [k, enc(v.turyDeficytuZlota)]),
        accessors,
      });
    });
    advanceCases.push({ seq: seqName, paramIndex: pi, params: encObj(params), steps });
    GD.clearLastGoldDeficitTicks();
  }
}

// Akcesory przed jakimkolwiek advance (pusty stan) i po clear.
const emptyAccessors = {};
for (const oid of [...OWNERS_SEQ, EXTRA_OWNER]) {
  emptyAccessors[oid] = {
    isGoldDeficit: GD.isGoldDeficit(oid),
    isGoldDeficitStarving: GD.isGoldDeficitStarving(oid),
    countdown: enc(GD.getGoldDeficitCountdown(oid, 3)),
    lastTick: encTick(GD.getLastGoldDeficitTick(oid)),
  };
}

// ---------------------------------------------------------------------------
// 3. applyGoldDeficitStatMultToCombatUnit
// ---------------------------------------------------------------------------
const STAT_KEYS = [
  'meleeAttack',
  'meleeDefence',
  'weaponDamage',
  'piercing',
  'chargeBonus',
  'health',
  'missileAttack',
  'Prog dezercji (% health)',
];
const baseCu = (prog) => ({
  typNazwa: 'Test',
  counterTyp: 'Miecznik',
  rola: 'Wrecz',
  meleeAttack: 7,
  meleeDefence: 5,
  weaponDamage: 3.5,
  armor: 4,
  piercing: 2,
  chargeBonus: 1.25,
  health: 10,
  missileAttack: 0,
  'Prog dezercji (% health)': prog,
});
const PROG_VALUES = [null, undefined, 0, 50, 33.33333, -7.5, NaN, 12.34567, 0.5, -0.5, -0.00001];
// r4 (Evaluator r3 zarzut 3): prog*(2-mult)*10000 = k+0.5 dokladnie (0.5*1.0625=17/32, *10000=5312.5)
// oraz mala ujemna dajaca -0 po round4 (-0.00001*1.5*10000 = -0.15)
const MULTS = [0.75, 1, 0, -1, 0.5, NaN, 0.333, 1.5, Infinity, -0.25, 0.1, 0.9375];
const statCases = [];
for (const prog of PROG_VALUES) {
  for (const mult of MULTS) {
    const cu = baseCu(prog);
    const out = GD.applyGoldDeficitStatMultToCombatUnit(cu, mult);
    const stats = {};
    for (const k of STAT_KEYS) stats[k] = enc(out[k]);
    statCases.push({
      input: encObj(
        Object.fromEntries(
          Object.entries(baseCu(prog)).filter(([, v]) => typeof v !== 'string'),
        ),
      ),
      progInput: enc(prog),
      mult: enc(mult),
      out: stats,
      armorKept: enc(out.armor),
      identity: out === cu,
    });
  }
}

// ---------------------------------------------------------------------------
// 4. applyGoldDeficitHpLoss (8D-P2)
// ---------------------------------------------------------------------------
const MAXHP_TABLE = { tPiech: 10, tLucz: 7.5, tZero: 0, tNaN: NaN, tDuzy: 1000, tUjemny: -5, tMikro: 0.4 };
const CAT_CIV = 'Cywilne';
const unitDefs = (uid) => [
  { id: `${uid}a`, ownerId: 1, typeId: 'tPiech', category: 'Piechota' },
  { id: `${uid}b`, ownerId: 1, typeId: 'tLucz', category: 'Lucznicy' },
  { id: `${uid}c`, ownerId: 2, typeId: 'tPiech', category: 'Piechota' },
  { id: `${uid}d`, ownerId: 1, typeId: 'tZero', category: 'Piechota' },
  { id: `${uid}e`, ownerId: 1, typeId: 'tNaN', category: 'Piechota' },
  { id: `${uid}f`, ownerId: 1, typeId: 'tDuzy', category: 'Piechota' },
  { id: `${uid}g`, ownerId: 1, typeId: 'tMikro', category: 'Piechota' },
  { id: `${uid}h`, ownerId: 1, typeId: 'tUjemny', category: 'Piechota' },
  { id: `${uid}i`, ownerId: 1, typeId: 'tPiech', category: CAT_CIV },
];
const HP_SCENARIOS = {
  pelneHp: (u) => ({ ...u, hp: u.id.endsWith('a') ? 10 : u.id.endsWith('b') ? 3 : 1, hpMax: undefined }),
  hpNullHpMaxNull: (u) => ({ ...u, hp: null, hpMax: null }),
  hpMaxZadany: (u) => ({ ...u, hp: 5, hpMax: 20 }),
  hpNaN: (u) => ({ ...u, hp: NaN, hpMax: 10 }),
  hpNiskie: (u) => ({ ...u, hp: 1, hpMax: undefined }),
  mieszane: (u, i) => ({ ...u, hp: i % 2 === 0 ? null : 4, hpMax: i % 3 === 0 ? 9 : undefined }),
};
const HP_FRACS = [0, 0.08, 0.5, 1, 1.5, -1, NaN, Infinity, 0.001, 0.3333];
const hpCases = [];
for (const [scName, mk] of Object.entries(HP_SCENARIOS)) {
  for (const frac of HP_FRACS) {
    for (const ownerId of [1, 2]) {
      const units = unitDefs(scName.slice(0, 2)).map((u, i) => mk(u, i));
      // undefined-owned civilian flag liczony przez web (isCivilianUnit)
      const withCiv = units.map((u) => ({
        ...u,
        civilian: SETUP.isCivilianUnit({ category: u.category, typeId: u.typeId }),
      }));
      const inputs = withCiv.map((u) => ({
        id: u.id,
        ownerId: u.ownerId,
        typeId: u.typeId,
        category: u.category,
        civilian: u.civilian,
        hp: enc(u.hp),
        hpMax: enc(u.hpMax),
      }));
      const res = GD.applyGoldDeficitHpLoss(
        withCiv.map((u) => ({ ...u })),
        ownerId,
        frac,
        (typeId) => MAXHP_TABLE[typeId],
      );
      // ponownie na kopiach, zeby odczytac koncowe pola jednostek
      const copies = withCiv.map((u) => ({ ...u }));
      const res2 = GD.applyGoldDeficitHpLoss(copies, ownerId, frac, (typeId) => MAXHP_TABLE[typeId]);
      hpCases.push({
        scenario: scName,
        ownerId,
        hpFrac: enc(frac),
        inputs,
        destroyedIds: res2.destroyedIds,
        damagedCount: res2.damagedCount,
        final: copies.map((u) => ({ id: u.id, hp: enc(u.hp), hpMax: enc(u.hpMax) })),
        sameAsFirstRun: res.damagedCount === res2.damagedCount,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 5. mennica-zloto-grace.ts (8D-P2)
// ---------------------------------------------------------------------------
const mennicaCases = [];

// Deterministyczny LCG (bez Math.random) - reprodukowalnosc.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const MZ_OWNERS = [1, 2, 3];
const scenarioGen = (seed, turns) => {
  const rnd = lcg(seed);
  const seqs = [];
  for (let t = 0; t < turns; t++) {
    const row = {};
    for (const oid of MZ_OWNERS) row[oid] = rnd() < 0.6;
    seqs.push(row);
  }
  return seqs;
};
const handScenarios = {
  utrataJednaTura: [
    { 1: true, 2: true }, { 1: false, 2: true }, { 1: true, 2: true }, { 1: false, 2: false },
    { 1: false, 2: true }, { 1: false, 2: true }, { 1: true, 2: false },
  ],
  utrataDwieTury: [
    { 1: true }, { 1: false }, { 1: false }, { 1: true }, { 1: false }, { 1: false }, { 1: false },
  ],
  nigdyDostep: [{ 1: false }, { 1: false }, { 1: false }, { 1: false }],
  zawszeDostep: [{ 1: true }, { 1: true }, { 1: true }],
  brakMigawki: [{ 1: false, 2: false }, { 1: false, 2: true }, { 1: true, 2: false }],
};
const scenarios = {
  ...handScenarios,
  losowy1: scenarioGen(1, 40),
  losowy2: scenarioGen(20260905, 40),
  losowy3: scenarioGen(7, 40),
};

const simulate = (seq, owners) => {
  const state = MZ.createMennicaZlotoGraceState();
  const out = [];
  for (const row of seq) {
    const hasNow = (oid) => (row[oid] ?? false);
    const ownersArr = owners ?? Object.keys(row).map(Number);
    const resolver = MZ.prepareMennicaZlotoGraceForTick(state, ownersArr, hasNow);
    const resolved = ownersArr.map((oid) => [oid, resolver(oid)]);
    const afterPrepare = [...state.graceTurnsLeft.entries()].sort((a, b) => a[0] - b[0]);
    MZ.finalizeMennicaZlotoGraceAfterTick(state, ownersArr, hasNow);
    const ser = MZ.serializeMennicaZlotoGrace(state);
    out.push({
      access: encObj(Object.fromEntries(ownersArr.map((o) => [o, hasNow(o)]))),
      owners: ownersArr,
      resolved,
      afterPrepareGrace: afterPrepare.map(([k, v]) => [k, enc(v)]),
      serialized: {
        graceTurnsLeft: ser.graceTurnsLeft.map(([k, v]) => [k, enc(v)]).sort((a, b) => a[0] - b[0]),
        hadAccessLastTurn: ser.hadAccessLastTurn.sort((a, b) => a[0] - b[0]),
      },
    });
  }
  return out;
};

for (const [name, seq] of Object.entries(scenarios)) {
  // owners = wszyscy z MZ_OWNERS (rowniez brakujacy w wierszu => hasNow false)
  const owners = MZ_OWNERS;
  mennicaCases.push({ name, owners, steps: simulate(seq.map((r) => ({ ...r })), owners) });
}
// Kontrola: MENNICA_ZLOTO_GRACE_TURNS i clear/restore
mennicaCases.push({
  name: 'const',
  graceTurns: enc(MZ.MENNICA_ZLOTO_GRACE_TURNS),
});
{
  const st = MZ.createMennicaZlotoGraceState();
  st.graceTurnsLeft.set(4, 1);
  st.hadAccessLastTurn.set(4, true);
  MZ.restoreMennicaZlotoGrace(st, {
    graceTurnsLeft: [[9, 1], [2, 0]],
    hadAccessLastTurn: [[9, false]],
  });
  const restored = MZ.serializeMennicaZlotoGrace(st);
  MZ.clearMennicaZlotoGraceState(st);
  mennicaCases.push({
    name: 'restoreClear',
    restoreFrom: {
      graceTurnsLeft: [[9, 1], [2, 0]],
      hadAccessLastTurn: [[9, false]],
    },
    restored: {
      graceTurnsLeft: restored.graceTurnsLeft.map(([k, v]) => [k, enc(v)]).sort((a, b) => a[0] - b[0]),
      hadAccessLastTurn: restored.hadAccessLastTurn.sort((a, b) => a[0] - b[0]),
    },
    afterClear: MZ.serializeMennicaZlotoGrace(st),
    restoreNull: (() => {
      const s2 = MZ.createMennicaZlotoGraceState();
      s2.graceTurnsLeft.set(1, 1);
      MZ.restoreMennicaZlotoGrace(s2, null);
      return MZ.serializeMennicaZlotoGrace(s2);
    })(),
  });
}

const constants = {
  MENNICA_ZLOTO_GRACE_TURNS: enc(MZ.MENNICA_ZLOTO_GRACE_TURNS),
  DEFAULT_PARAMS: encObj(GD.buildGoldDeficitParams({}, 'normal')),
};

writeFileSync(
  join(outDir, 'gold_deficit.json'),
  JSON.stringify(
    {
      _opis: 'P6.8D-P1 gold-deficit.ts (+ applyGoldDeficitHpLoss 8D-P2) - wektory z weba, pin ' + PIN,
      _pin: PIN,
      freshState: enc(fresh.turyDeficytuZlota),
      emptyAccessors,
      params: paramCases,
      advance: advanceCases,
      statMult: statCases,
      hpLoss: hpCases,
    },
    null,
    1,
  ) + '\n',
);
writeFileSync(
  join(outDir, 'mennica_zloto_grace.json'),
  JSON.stringify(
    { _opis: 'P6.8D-P2 mennica-zloto-grace.ts - wektory z weba, pin ' + PIN, _pin: PIN, constants, cases: mennicaCases },
    null,
    1,
  ) + '\n',
);
console.log(
  `params=${paramCases.length} advance=${advanceCases.length} statMult=${statCases.length} hpLoss=${hpCases.length} mennica=${mennicaCases.length}`,
);
