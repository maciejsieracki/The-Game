// P6 COMBAT-MELEE-VEKTORY (R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1): generator wektorow pinu dla fazy
// zwarcia (melee) `resolveCombat` (gra/src/game/combat.ts, blok "Phase 1 & 2: Melee") z PINU 07d2fbd72.
//
// Wykonywany jest TEKST pinu (po zdjeciu typow TypeScript), a nie przepisana kopia:
//   - blok fazy zwarcia: od markera "Phase 1 & 2: Melee" do markera "Winner" (verbatim),
//   - funkcje, od ktorych zalezy faza: hitChanceTw, damageTw (combat.ts), negatesCharge (combat.ts),
//     applyMultiplier (civ-bonuses.ts),
//   - stala: TW = combat-params.json tw_v3.
// Wejscia fazy (hpAtk, hpDef, defFinalObrona, mnozniki, statystyki jednostek, ...) sa wartosciami
// wstrzykiwanymi, czyli wynikami czesci przed faza (civ/budynki/teren/roznica trudnosci), ktore NIE sa
// tu wykonywane. Jedyne zmiany tekstu pinu (po wycieciu, straznik SHA dotyczy tekstu PRZED zmianami):
//   1. `const atkRoundMods = mergeBuildingBonusIntoStatMultipliers(civCombatStatMultipliers(...), ...)`
//      oraz analogicznie `defRoundMods` -> wstrzyknieta funkcja `__modsAtk(isCharge)` / `__modsDef(isCharge)`
//      (zwraca {atk, obrona, pancerz, uderzenie}). Te dwie funkcje zaleza od civ-bonuses/unit-building-bonuses
//      i sa NIE_ZMIERZONE tutaj (wejscie wstrzykiwane).
//   2. Szablony logu `${n}` dla wartosci liczbowych -> `${__z(n)}` (JS `String(-0) === "0"` gubi znak zera).
// Jedyny stub RNG: zapisana sekwencja losowan [0,1), jedno losowanie na krok (kolejnosc ATK, DEF).
//
// Straznik: SHA-256 wyciętych fragmentow pinu (funkcje + blok fazy) oraz combat-params.json.
// Wynik -> p6_combat_melee_vectors/vectors.json. Wartosci NaN/Infinity/-0 jako napisy.
//
// Uruchomienie (z korzenia repo): node rust-port/engine/tests/p6_combat_melee_gen.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const COMBAT = 'gra/src/game/combat.ts';
const CIV_BONUSES = 'gra/src/game/civ-bonuses.ts';
const PARAMS = 'gra/data/combat-params.json';
const MELEE_START = '  // ---------- Phase 1 & 2: Melee ----------';
const MELEE_END = '  // ---------- Winner ----------';
// Oczekiwane skroty (straznik); wartosci zapisane po pierwszym uruchomieniu na PINIE.
const EXPECT_FRAGMENT_SHA256 = 'cab87df78457c3c2a2c320b9b92ad3eb602cf4be36a42b69834801993a2bf27e';
const EXPECT_PARAMS_SHA256 = '5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_combat_melee_vectors');
const outPath = join(outDir, 'vectors.json');

const sha = (s) => createHash('sha256').update(s).digest('hex');
const gitShow = (path) =>
  execFileSync('git', ['-C', repoRoot, 'show', `${PIN}:${path}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// Funkcja eksportowana (`export function name(`) lub prywatna (`function name(`), konczaca sie na "\n}\n".
function extractFn(src, name, exported = true) {
  const re = exported ? new RegExp(`export function ${name}\\(`) : new RegExp(`(^|\\n)function ${name}\\(`);
  const m = re.exec(src);
  if (!m) throw new Error(`brak ${name} w pinie ${PIN}`);
  const start = m.index + (m[1] !== undefined ? m[1].length : 0);
  const end = src.indexOf('\n}\n', start);
  if (end < 0) throw new Error(`nie znaleziono konca ${name}`);
  return src.slice(start, end + 3).replace(/^export /, '');
}

const combatSrc = gitShow(COMBAT);
const civSrc = gitShow(CIV_BONUSES);
const paramsText = gitShow(PARAMS);

const meleeStart = combatSrc.indexOf(MELEE_START);
const meleeEnd = combatSrc.indexOf(MELEE_END);
if (meleeStart < 0 || meleeEnd < 0 || meleeEnd <= meleeStart) throw new Error('brak markerow fazy zwarcia w pinie');
const meleeTs = combatSrc.slice(meleeStart, meleeEnd);

const fnTs = [
  extractFn(combatSrc, 'hitChanceTw'),
  extractFn(combatSrc, 'damageTw'),
  extractFn(combatSrc, 'negatesCharge', false),
].join('\n');
const applyMultTs = extractFn(civSrc, 'applyMultiplier');

const fragmentSha = sha([fnTs, applyMultTs, meleeTs].join('\n----\n'));
const paramsSha = sha(paramsText);
console.error(`fragment sha256 = ${fragmentSha}`);
console.error(`combat-params sha256 = ${paramsSha}`);
if (fragmentSha !== EXPECT_FRAGMENT_SHA256) {
  throw new Error(`straznik: fragmenty pinu (funkcje/faza zwarcia) zmienione: ${fragmentSha}`);
}
if (paramsSha !== EXPECT_PARAMS_SHA256) {
  throw new Error('straznik: combat-params.json w pinie zmieniony');
}

const params = JSON.parse(paramsText);
const TW = params.tw_v3;

// Naglowek: wejscia fazy jako zmienne lokalne (nazwy jak w pinie).
const HEADER = `
  let hpAtk = __in.hpAtk; let hpDef = __in.hpDef;
  let totalRounds = __in.totalRounds;
  const maxRounds = __in.maxRounds;
  const attacker = __in.attacker; const defender = __in.defender;
  const attackerMoved = __in.attackerMoved;
  const atkDiffMult = __in.atkDiffMult; const defDiffMult = __in.defDiffMult;
  const defenderTerrain = __in.defenderTerrain;
  const terrRiverMult = __in.terrRiverMult;
  const defFinalObrona = __in.defFinalObrona;
  const ctrAtkVsDef = __in.ctrAtkVsDef; const ctrDefVsAtk = __in.ctrDefVsAtk;
  const routAtk = __in.routAtk; const routDef = __in.routDef;
  const __modsAtk = __in.modsAtk; const __modsDef = __in.modsDef;
  const routed = []; const log = [];
  const rng = __rng;
  const __z = (x) => (Object.is(x, -0) ? '-0' : String(x));
`;
const FOOTER = `
  return { hpAtk, hpDef, totalRounds, routed, log };
`;

// Wstrzykniecie modyfikatorow rundy (civ/budynki) zamiast wywolan zaleznych od civ-bonuses.
const MODS_ATK_START = '      const atkRoundMods = ';
const MODS_DEF_START = '      const defRoundMods = ';
const MODS_END = '      const roundAtkMelee = ';
const iAtk = meleeTs.indexOf(MODS_ATK_START);
const iDef = meleeTs.indexOf(MODS_DEF_START);
const iEnd = meleeTs.indexOf(MODS_END);
if (iAtk < 0 || iDef < 0 || iEnd < 0 || !(iAtk < iDef && iDef < iEnd)) throw new Error('brak wywolan modyfikatorow rundy w pinie');
if (meleeTs.indexOf(MODS_ATK_START, iAtk + 1) >= 0 || meleeTs.indexOf(MODS_DEF_START, iDef + 1) >= 0) {
  throw new Error('zduplikowane wywolania modyfikatorow rundy');
}
const loopWithMods =
  meleeTs.slice(0, iAtk) +
  '      const atkRoundMods = __modsAtk(isCharge);\n' +
  '      const defRoundMods = __modsDef(isCharge);\n\n' +
  meleeTs.slice(iEnd);

// Szablony logu z wartosciami liczbowymi: znak zera zachowany (zob. naglowek).
const LOG_NUM = /\$\{(atkHitPct|finalDmg|hpDef|hpAtk|defHitPct|routDef|routAtk)\}/g;
const nLogNum = [...loopWithMods.matchAll(LOG_NUM)].length;
if (nLogNum < 10) throw new Error(`oczekiwano >= 10 szablonow liczbowych w logu fazy zwarcia, jest ${nLogNum}`);
const loopLog = loopWithMods.replace(LOG_NUM, (_, n) => `\${__z(${n})}`);

// Calosc owinieta w funkcje (stripTypeScriptTypes parsuje modul; `return` na poziomie modulu jest bledem).
const body = `function __body(__in, __rng, __tw) {\nconst TW = __tw;\n${fnTs}\n${applyMultTs}\n${HEADER}\n${loopLog}\n${FOOTER}}\n`;
const bodyJs = stripTypeScriptTypes(body);
const runMelee = new Function(`${bodyJs}\nreturn __body;`)();

// ---------- Generator wejsc (deterministyczny PRNG mulberry32) ----------
let seed = 6611 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const enc = (x) => {
  if (typeof x === 'boolean') return x;
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  // Niecalkowite liczby jako napisy (JS shortest round-trip): Rust parsuje napis poprawnie zaokraglonym f64::from_str.
  return Number.isSafeInteger(x) ? x : String(x);
};
// Obiekt z liczbami (statystyki, mnozniki): kazda liczba przez enc(); bez tego JSON.stringify
// zamienia NaN/Infinity na null, a -0 na 0, a niecalkowite liczby zostaja surowe (ryzyko 1 ulp w parsowaniu).
const encRec = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? enc(v) : v]));
const decJs = (s) => (typeof s === 'string' ? Number(s) : s);
const parseNum = (s) => {
  if (s === 'NaN') return NaN;
  if (s === 'Infinity') return Infinity;
  if (s === '-Infinity') return -Infinity;
  if (s === '-0') return -0;
  return Number(s);
};

const HP_EDGE = [NaN, Infinity, -Infinity, 0, -0, 0.5, 1, 1e308, -3, 120.25, 9007199254740993, 2.5e-300];
const NUM_EDGE = [NaN, Infinity, -Infinity, 0, -0, 1, 2.5, 7, 40, 1e308, -12.5];
const COUNTER_EDGE = [NaN, Infinity, -Infinity, 0, -0, 0.5, 1, 1.5, 3, -2];
const ROUT_EDGE = [NaN, 0, -0, Infinity, -Infinity, 40.5, 1e308];
const ROLL_EDGE = [0, 0.5, 0.9999999999999999, 0.25];
// counterTyp musi byc napisem (negatesCharge wywoluje toLowerCase), wiec bez null.
const COUNTER_TYPES = ['Spearman', 'Falangite', 'spearman', ' FALANGITE ', 'Slinger', 'Distance', 'Mount', 'Procarz'];
const DISPLAY_NAMES = ['Hoplita', 'Procarz (Huaracoc)', 'Łucznik', 'Triari'];

function genScalar(edges, lo, hi, pEdge = 0.35) {
  return rnd() < pEdge ? pick(edges) : lo + rnd() * (hi - lo);
}
// Statystyki i mnozniki: rzadziej wartosci brzegowe (NaN w statystyce zeruje trafienia i zamyka wiekszosc krokow).
const genStat = (lo, hi) => genScalar(NUM_EDGE, lo, hi, 0.04);
// Mnozniki roznicy/rzeki: wartosci brzegowe (NaN, 0, -0) w ~5% przypadkow, nie w 1/8 (NaN w mnoznikach dawal ~1/3 krokow z NaN).
const pickMult = (base) => (rnd() < 0.05 ? pick([NaN, 0, -0]) : pick(base));

const genMods = () => ({
  atk: genScalar(NUM_EDGE, 0, 2, 0.04),
  obrona: genScalar(NUM_EDGE, 0, 2, 0.04),
  pancerz: genScalar(NUM_EDGE, 0, 2, 0.04),
  uderzenie: genScalar(NUM_EDGE, 0, 3, 0.04),
});

function genCase(i) {
  const mkUnit = () => ({
    counterTyp: pick(COUNTER_TYPES),
    typNazwa: pick(DISPLAY_NAMES),
    unbreakable: rnd() < 0.2,
    meleeAttack: genStat(0, 60),
    meleeDefence: genStat(0, 60),
    armor: genStat(0, 30),
    chargeBonus: genStat(0, 20),
    weaponDamage: genStat(0, 30),
    piercing: genStat(0, 10),
  });
  const attacker = mkUnit();
  const defender = mkUnit();
  const maxRounds = ri(0, 8);
  const totalRounds = rnd() < 0.8 ? 0 : ri(0, 3);
  const c = {
    attacker, defender,
    attackerMoved: rnd() < 0.8,
    atkDiffMult: pickMult([1, 0.5, 1.25, 1]),
    defDiffMult: pickMult([1, 0.5, 1.25, 1]),
    defenderTerrain: pick(['', 'Las', 'Rzeka']),
    terrRiverMult: pickMult([1, 0.5, 0.75, 1, 2]),
    hpAtk: rnd() < 0.3 ? pick(HP_EDGE) : ri(0, 200) + pick([0, 0.5]),
    hpDef: rnd() < 0.3 ? pick(HP_EDGE) : ri(0, 200) + pick([0, 0.5]),
    totalRounds,
    maxRounds,
    defFinalObrona: genStat(0, 90),
    ctrAtkVsDef: genScalar(COUNTER_EDGE, 0, 3),
    ctrDefVsAtk: genScalar(COUNTER_EDGE, 0, 3),
    routAtk: rnd() < 0.5 ? 0 : genScalar(ROUT_EDGE, 0, 120),
    routDef: rnd() < 0.5 ? 0 : genScalar(ROUT_EDGE, 0, 120),
    modsCharge: { atkA: genMods(), defA: genMods() },
    modsRound: { atkA: genMods(), defA: genMods() },
  };
  // Losowania: 2 na runde (ATK, DEF) z zapasem; edge'owe wartosci co kilka przypadkow.
  const draws = [];
  const nDraws = 2 * (c.maxRounds + 3) + 2;
  for (let k = 0; k < nDraws; k++) {
    draws.push(i % 5 === 0 && k < ROLL_EDGE.length ? ROLL_EDGE[k] : rnd());
  }
  return { ...c, draws };
}

// Krok fazy z logu pinu: "R<n>[Szarza|Zwarcie] ATK|DEF trafia|chybia (roll<hit%) -> dmg obra. ...: HP".
const STEP_LINE = /^R(\d+)\[(Szarza|Zwarcie)\] (ATK|DEF) (trafia|chybia) \(([^<>=]+)(?:<|>=)([^%]+)%\)(?: -> (\S+) obra(?: \(\+Szarza\))?\. [^:]+: (\S+))?\.?$/;
const STEP_ANY = /^R\d+\[(Szarza|Zwarcie)\] (ATK|DEF)/;

const mkInput = (c, modsAtk, modsDef) => ({
  attacker: c.attacker, defender: c.defender,
  attackerMoved: c.attackerMoved,
  atkDiffMult: decJs(c.atkDiffMult), defDiffMult: decJs(c.defDiffMult),
  defenderTerrain: c.defenderTerrain,
  terrRiverMult: decJs(c.terrRiverMult),
  hpAtk: decJs(c.hpAtk), hpDef: decJs(c.hpDef),
  totalRounds: c.totalRounds, maxRounds: c.maxRounds,
  defFinalObrona: decJs(c.defFinalObrona),
  ctrAtkVsDef: decJs(c.ctrAtkVsDef), ctrDefVsAtk: decJs(c.ctrDefVsAtk),
  routAtk: decJs(c.routAtk), routDef: decJs(c.routDef),
  modsAtk, modsDef,
});

const parseSteps = (log, caseNo) => {
  const steps = [];
  for (const line of log) {
    if (!STEP_ANY.test(line)) continue;
    const m = STEP_LINE.exec(line);
    if (!m) throw new Error(`przypadek ${caseNo}: nie sparsowano kroku zwarcia: ${line}`);
    steps.push({
      round: Number(m[1]),
      phase: m[2] === 'Szarza' ? 'charge' : 'melee',
      side: m[3] === 'ATK' ? 'attacker' : 'defender',
      hit: m[4] === 'trafia',
      hitPct: parseNum(m[6].trim()),
      damage: m[7] !== undefined ? parseNum(m[7]) : 0,
      targetHp: m[8] !== undefined ? parseNum(m[8]) : null,
    });
  }
  return steps;
};

const f64 = new Float64Array(1);
const u64 = new BigUint64Array(f64.buffer);
const stepUlp = (x, s) => { f64[0] = x; u64[0] = u64[0] + BigInt(s); return f64[0]; };
const ROLL_PRED = { eq: (r, h) => r === h, lt: (r, h) => r < h, gt: (r, h) => r > h };
const rollFor = (h, mode) => {
  const d0 = h / 100;
  for (let s = 0; s <= 16; s++) {
    for (const d of [stepUlp(d0, s), stepUlp(d0, -s)]) {
      if (d >= 0 && d < 1 && ROLL_PRED[mode](d * 100, h)) return d;
    }
  }
  return null;
};
// hitPct kroku zalezy tylko od strony i szarzy (nie od losowan), wiec przebieg z rng=0 podaje je dla kolejnych krokow.
const applyBoundary = (c, i, mkIn, modsAtk, modsDef) => {
  let probeRng = () => 0;
  const probe = parseSteps(runMelee(mkIn(), probeRng, TW).log, i);
  const modes = ['eq', 'lt', 'gt'];
  for (let k = 0; k < Math.min(probe.length, c.draws.length); k++) {
    const h = probe[k].hitPct;
    if (!(h > 0 && h <= 100)) continue;
    const d = rollFor(h, modes[(k + i) % 3]);
    if (d !== null) c.draws[k] = d;
  }
};

const cases = [];
const N = 500;
for (let i = 0; i < N; i++) {
  const c = genCase(i);
  const draws = c.draws;
  let di = 0;
  const modsAtkB = (isCharge) => (isCharge ? c.modsCharge.atkA : c.modsRound.atkA);
  const modsDefB = (isCharge) => (isCharge ? c.modsCharge.defA : c.modsRound.defA);
  if (i % 3 === 1) applyBoundary(c, i, () => mkInput(c, modsAtkB, modsDefB), modsAtkB, modsDefB);
  const rng = () => {
    if (di >= draws.length) throw new Error(`przypadek ${i}: brak losowan`);
    return draws[di++];
  };
  // Modyfikatory: funkcja zwraca {atk, obrona, pancerz, uderzenie} dla strony; zestaw zalezy od szarzy.
  const modsAtk = (isCharge) => (isCharge ? c.modsCharge.atkA : c.modsRound.atkA);
  const modsDef = (isCharge) => (isCharge ? c.modsCharge.defA : c.modsRound.defA);
  const res = runMelee(mkInput(c, modsAtk, modsDef), rng, TW);
  const steps = parseSteps(res.log, i).map((p, k) => ({
    round: p.round,
    phase: p.phase,
    side: p.side,
    hit: p.hit,
    hitPct: enc(p.hitPct),
    roll: enc(draws[k]),
    damage: enc(p.damage),
    targetHp: p.targetHp === null ? null : enc(p.targetHp),
  }));
  if (steps.length > draws.length) throw new Error(`przypadek ${i}: wiecej krokow niz losowan`);
  cases.push({
    input: {
      attacker: encRec(c.attacker), defender: encRec(c.defender),
      attackerMoved: c.attackerMoved,
      atkDiffMult: enc(c.atkDiffMult), defDiffMult: enc(c.defDiffMult),
      defenderTerrain: c.defenderTerrain,
      terrRiverMult: enc(c.terrRiverMult),
      hpAtk: enc(c.hpAtk), hpDef: enc(c.hpDef),
      totalRounds: c.totalRounds, maxRounds: c.maxRounds,
      defFinalObrona: enc(c.defFinalObrona),
      ctrAtkVsDef: enc(c.ctrAtkVsDef), ctrDefVsAtk: enc(c.ctrDefVsAtk),
      routAtk: enc(c.routAtk), routDef: enc(c.routDef),
      modsCharge: { atk: encRec(c.modsCharge.atkA), def: encRec(c.modsCharge.defA) },
      modsRound: { atk: encRec(c.modsRound.atkA), def: encRec(c.modsRound.defA) },
    },
    draws: draws.slice(0, steps.length).map(enc),
    expected: {
      hpAtk: enc(res.hpAtk), hpDef: enc(res.hpDef),
      rounds: res.totalRounds,
      routed: res.routed.slice(),
      limitReached: res.log.some((l) => l === 'Limit rund osiagniety -> remis.'),
      steps,
    },
  });
}

// Liczniki niepustosci (kryterium 2) i pokrycia galezi.
const allSteps = cases.flatMap((c) => c.expected.steps);
const nums = (v) => (typeof v === 'string' ? parseNum(v) : v);
const counts = {
  cases: cases.length,
  steps: allSteps.length,
  stepsCharge: allSteps.filter((s) => s.phase === 'charge').length,
  stepsMelee: allSteps.filter((s) => s.phase === 'melee').length,
  stepsHit: allSteps.filter((s) => s.hit).length,
  stepsMiss: allSteps.filter((s) => !s.hit).length,
  stepsNaNHitPct: allSteps.filter((s) => s.hitPct === 'NaN').length,
  stepsNegZeroAnyField: allSteps.filter((s) => [s.hitPct, s.damage, s.targetHp].includes('-0')).length,
  casesRouted: cases.filter((c) => c.expected.routed.length > 0).length,
  casesLimitReached: cases.filter((c) => c.expected.limitReached).length,
  // negatesCharge(defender) jak w pinie (bez trim): odpieranie szarzy przy attackerMoved.
  casesDefBracing: cases.filter((c) => {
    const t = c.input.defender.counterTyp.toLowerCase();
    return c.input.attackerMoved && (t === 'spearman' || t === 'falangite');
  }).length,
  casesNaNHp: cases.filter((c) => c.expected.hpAtk === 'NaN' || c.expected.hpDef === 'NaN').length,
  casesWithChargeStep: cases.filter((c) => c.expected.steps.some((s) => s.phase === 'charge')).length,
  // roll*100 === hitPct na poziomie kroku (granica `<` vs `>=`).
  stepsRollEq: allSteps.filter((s) => nums(s.roll) * 100 === nums(s.hitPct)).length,
  stepsRollOnNaN: allSteps.filter((s) => Number.isNaN(nums(s.hitPct))).length,
};
const out = {
  source: { pin: PIN, files: [COMBAT, CIV_BONUSES], fragmentSha256: fragmentSha, paramsFile: PARAMS, paramsSha256: paramsSha },
  seed: 6611,
  tw_v3: TW,
  counts,
  cases,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(out) + '\n');
console.error(`zapisano ${outPath}: ${JSON.stringify(counts)}`);
