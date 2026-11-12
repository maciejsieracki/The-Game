// P6 COMBAT-HARNESS (R-RUSTPORT-P6-COMBAT-HARNESS-Q1): generator wektorow pinu dla petli dystansu
// `resolveCombat` (gra/src/game/combat.ts, blok "Phase 0: Ranged") z PINU 07d2fbd72.
//
// Wykonywany jest TEKST pinu (po zdjeciu typow TypeScript), a nie przepisana kopia:
//   - blok petli dystansu: od markera "Phase 0: Ranged" do markera "Phase 1 & 2: Melee" (verbatim),
//   - funkcje, od ktorych zalezy petla: hitChanceTw, rangedShotAccuracy, rangeDamageTw,
//     rangedShotDamage (combat.ts) oraz rangedDamageMultFor (unit-power.ts),
//   - stale: TW = combat-params.json tw_v3, RANGED_DAMAGE_MULT = combat-params.json ranged_damage_mult.
// Wejscia petli (atkMelee0, hpAtk, defFinalObrona, ...) sa wartosciami wstrzykiwanymi, czyli
// wynikami czesci przed petla (civ/budynki/teren), ktore NIE sa tu wykonywane (NIE_ZMIERZONO w raporcie).
// Jedyny stub: RNG = zapisana sekwencja losowan [0,1) (jedno losowanie na strzal, kolejnosc ATK, DEF).
//
// Straznik: SHA-256 wyciętych fragmentow pinu (funkcje + blok petli) oraz combat-params.json.
// Wynik -> p6_combat_harness_vectors/vectors.json. Wartosci NaN/Infinity/-0 jako napisy.
//
// Uruchomienie (z korzenia repo): node rust-port/engine/tests/p6_combat_harness_gen.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const COMBAT = 'gra/src/game/combat.ts';
const UNIT_POWER = 'gra/src/game/unit-power.ts';
const PARAMS = 'gra/data/combat-params.json';
const LOOP_START = '  // ---------- Phase 0: Ranged ----------';
const LOOP_END = '  // ---------- Phase 1 & 2: Melee ----------';
// Oczekiwane skroty (straznik); wartosci zapisane po pierwszym uruchomieniu na PINIE.
const EXPECT_FRAGMENT_SHA256 = '700d16235700836e4c5eb9e49d697556e9e1bbe21331c98dd1d535a314bd7837';
const EXPECT_PARAMS_SHA256 = '5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_combat_harness_vectors');
const outPath = join(outDir, 'vectors.json');

const sha = (s) => createHash('sha256').update(s).digest('hex');
const gitShow = (path) =>
  execFileSync('git', ['-C', repoRoot, 'show', `${PIN}:${path}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function extractFn(src, name) {
  const m = new RegExp(`export function ${name}\\(`).exec(src);
  if (!m) throw new Error(`brak ${name} w pinie ${PIN}`);
  const end = src.indexOf('\n}\n', m.index);
  if (end < 0) throw new Error(`nie znaleziono konca ${name}`);
  return src.slice(m.index, end + 3).replace(/^export /, '');
}

const combatSrc = gitShow(COMBAT);
const unitPowerSrc = gitShow(UNIT_POWER);
const paramsText = gitShow(PARAMS);

const loopStart = combatSrc.indexOf(LOOP_START);
const loopEnd = combatSrc.indexOf(LOOP_END);
if (loopStart < 0 || loopEnd < 0 || loopEnd <= loopStart) throw new Error('brak markerow petli dystansu w pinie');
const loopTs = combatSrc.slice(loopStart, loopEnd);

const fnTs = [
  extractFn(combatSrc, 'hitChanceTw'),
  extractFn(combatSrc, 'rangedShotAccuracy'),
  extractFn(combatSrc, 'rangeDamageTw'),
  extractFn(combatSrc, 'rangedShotDamage'),
].join('\n');
const multTs = extractFn(unitPowerSrc, 'rangedDamageMultFor');

const fragmentSha = sha([fnTs, multTs, loopTs].join('\n----\n'));
const paramsSha = sha(paramsText);
console.error(`fragment sha256 = ${fragmentSha}`);
console.error(`combat-params sha256 = ${paramsSha}`);
if (fragmentSha !== EXPECT_FRAGMENT_SHA256) {
  throw new Error(`straznik: fragmenty pinu (funkcje/petla) zmienione: ${fragmentSha}`);
}
if (paramsSha !== EXPECT_PARAMS_SHA256) {
  throw new Error('straznik: combat-params.json w pinie zmieniony');
}

const params = JSON.parse(paramsText);
const TW = params.tw_v3;

// Naglowek: wejscia petli jako zmienne lokalne (nazwy jak w pinie).
const HEADER = `
  let ammoAtk = __in.ammoAtk; let ammoDef = __in.ammoDef;
  let hpAtk = __in.hpAtk; let hpDef = __in.hpDef;
  let totalRounds = __in.totalRounds;
  const maxRounds = __in.maxRounds;
  const attacker = __in.attacker; const defender = __in.defender;
  const atkIsRanged = __in.atkIsRanged; const defIsRanged = __in.defIsRanged;
  const atkMelee0 = __in.atkMelee0; const atkMissile0 = __in.atkMissile0; const atkObrona0 = __in.atkObrona0;
  const atkPanc0 = __in.atkPanc0;
  const defMelee0 = __in.defMelee0; const defMissile0 = __in.defMissile0;
  const defPanc0 = __in.defPanc0;
  const defFinalObrona = __in.defFinalObrona; const terrRiverMult = __in.terrRiverMult;
  const ctrAtkVsDef = __in.ctrAtkVsDef; const ctrDefVsAtk = __in.ctrDefVsAtk;
  const routAtk = __in.routAtk; const routDef = __in.routDef;
  const routed = []; const log = [];
  const rng = __rng;
  const __z = (x) => (Object.is(x, -0) ? '-0' : String(x));
`;
const FOOTER = `
  return { hpAtk, hpDef, ammoAtk, ammoDef, totalRounds, routed, log };
`;
// Formatowanie zdarzen (poprawka zarzutu 4): JS `String(-0) === "0"`, wiec szablony logu pinu gubia znak zera
// w hitPct/dmg/HP. Jedyna zmiana tekstu petli: 10 szablonow `${hitPct|dmg|hpDef|hpAtk}` -> `${__z(...)}`,
// gdzie __z(x) = String(x) poza -0 (dla -0 zwraca "-0"). Straznik SHA powyzej dotyczy tekstu pinu PRZED zmiana.
const LOG_NUM = /\$\{(hitPct|dmg|hpDef|hpAtk)\}/g;
const nLogNum = [...loopTs.matchAll(LOG_NUM)].length;
if (nLogNum !== 10) throw new Error(`oczekiwano 10 szablonow liczbowych w logu petli, jest ${nLogNum}`);
const loopLog = loopTs.replace(LOG_NUM, (_, n) => `\${__z(${n})}`);

// Calosc owinieta w funkcje (stripTypeScriptTypes parsuje modul; `return` na poziomie modulu jest bledem).
const body = `function __body(__in, __rng, __tw, __rdm) {\nconst TW = __tw; const RANGED_DAMAGE_MULT = __rdm;\n${fnTs}\n${multTs}\n${HEADER}\n${loopLog}\n${FOOTER}}\n`;
const bodyJs = stripTypeScriptTypes(body);
const runLoop = new Function(`${bodyJs}\nreturn __body;`)();

// ---------- Generator wejsc (deterministyczny PRNG mulberry32) ----------
let seed = 6610 >>> 0;
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
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  // Niecalkowite liczby jako napisy (JS shortest round-trip): serde_json bez float_roundtrip
  // moze zaokraglic o 1 ULP; Rust parsuje napis poprawnie zaokraglonym `f64::from_str`.
  return Number.isSafeInteger(x) ? x : String(x);
};
const decJs = (s) => (typeof s === 'string' ? Number(s) : s); // do obliczen harnessu (NaN/Inf/-0 przez napisy)
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
const TYPES = [
  [null, null], ['Slinger', 'Procarz'], [' Slinger ', 'Procarz (Huaracoc)'], ['Distance', 'Łucznik'],
  ['Distance', 'łucznik piesi'], ['Distance', 'Oszczepnik'], ['Mount', 'Łucznik'], ['Spearman', 'Hoplita'],
];

function genScalar(edges, lo, hi) {
  return rnd() < 0.35 ? pick(edges) : lo + rnd() * (hi - lo);
}

function genCase(i) {
  const at = pick(TYPES);
  const dt = pick(TYPES);
  const mkUnit = (tp) => ({
    counterTyp: tp[0] ?? undefined,
    typNazwa: tp[1] ?? undefined,
    unbreakable: rnd() < 0.2,
  });
  const attacker = mkUnit(at);
  const defender = mkUnit(dt);
  const atkIsRanged = rnd() < 0.8;
  const defIsRanged = rnd() < 0.8;
  const ammoAtk = ri(-1, 6);
  const ammoDef = ri(-1, 6);
  const hpAtk = rnd() < 0.3 ? pick(HP_EDGE) : ri(0, 200) + pick([0, 0.5]);
  const hpDef = rnd() < 0.3 ? pick(HP_EDGE) : ri(0, 200) + pick([0, 0.5]);
  const maxRounds = ri(0, 8);
  const totalRounds = rnd() < 0.8 ? 0 : ri(0, 3);
  const c = {
    attacker, defender,
    atkIsRanged, defIsRanged,
    ammoAtk, ammoDef, hpAtk, hpDef, totalRounds, maxRounds,
    atkMelee0: genScalar(NUM_EDGE, 0, 60),
    atkMissile0: genScalar(NUM_EDGE, 0, 40),
    atkObrona0: genScalar(NUM_EDGE, 0, 60),
    atkPanc0: genScalar(NUM_EDGE, 0, 30),
    defMelee0: genScalar(NUM_EDGE, 0, 60),
    defMissile0: genScalar(NUM_EDGE, 0, 40),
    defPanc0: genScalar(NUM_EDGE, 0, 30),
    defFinalObrona: genScalar(NUM_EDGE, 0, 90),
    terrRiverMult: pick([1, 0.5, 0.75, NaN, 0, -0, 2]),
    ctrAtkVsDef: genScalar(COUNTER_EDGE, 0, 3),
    ctrDefVsAtk: genScalar(COUNTER_EDGE, 0, 3),
    routAtk: rnd() < 0.5 ? 0 : genScalar(ROUT_EDGE, 0, 120),
    routDef: rnd() < 0.5 ? 0 : genScalar(ROUT_EDGE, 0, 120),
  };
  // Losowania: 2 na runde (ATK, DEF) z zapasem; edge'owe wartosci co kilka przypadkow.
  const draws = [];
  const nDraws = 2 * (c.maxRounds + 2) + 2;
  for (let k = 0; k < nDraws; k++) {
    draws.push(i % 5 === 0 && k < ROLL_EDGE.length ? ROLL_EDGE[k] : rnd());
  }
  return { ...c, draws };
}

const LINE = /^R(\d+)\[Dyst-(ATK|DEF)\] (trafienie|chybienie) \(([^<>=]+)(?:<|>=)([^%]+)%\)(?: -> ([^ ]+) obra\. [^:]+: (\S+))?\.?$/;

const mkInput = (c) => ({
  attacker: c.attacker, defender: c.defender,
  atkIsRanged: c.atkIsRanged, defIsRanged: c.defIsRanged,
  ammoAtk: c.ammoAtk, ammoDef: c.ammoDef, hpAtk: decJs(c.hpAtk), hpDef: decJs(c.hpDef),
  totalRounds: c.totalRounds, maxRounds: c.maxRounds,
  atkMelee0: c.atkMelee0, atkMissile0: c.atkMissile0, atkObrona0: c.atkObrona0, atkPanc0: c.atkPanc0,
  defMelee0: c.defMelee0, defMissile0: c.defMissile0, defPanc0: c.defPanc0,
  defFinalObrona: c.defFinalObrona, terrRiverMult: c.terrRiverMult,
  ctrAtkVsDef: c.ctrAtkVsDef, ctrDefVsAtk: c.ctrDefVsAtk,
  routAtk: c.routAtk, routDef: c.routDef,
});

// Zdarzenia strzalow z logu pinu (wyprowadzone z tekstu pinu, nie z ponownej implementacji).
const parseShots = (log, caseNo) => {
  const shots = [];
  for (const line of log) {
    if (!/Dyst-(ATK|DEF)\]/.test(line)) continue;
    const m = LINE.exec(line);
    if (!m) throw new Error(`przypadek ${caseNo}: nie sparsowano linii dystansowej: ${line}`);
    shots.push({
      round: Number(m[1]),
      side: m[2] === 'ATK' ? 'attacker' : 'defender',
      hit: m[3] === 'trafienie',
      hitPct: parseNum(m[5].trim()),
      damage: m[6] !== undefined ? parseNum(m[6]) : 0,
      targetHp: m[7] !== undefined ? parseNum(m[7]) : null,
    });
  }
  return shots;
};

// Przypadki graniczne rzutu (zarzut 1): roll = rng()*100 (jak w pinie) ma byc rowny / tuz ponizej / tuz powyzej hitPct.
// Wartosc losowania dobierana po ULP tak, by (d*100) === hitPct (lub < / >) w IEEE double.
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
// hitPct strzalu jest stale dla strony (zalezy tylko od wejsc), wiec pierwszy przebieg z rng=0 podaje je dla kolejnych strzalow.
const applyBoundary = (c, i) => {
  const probe = parseShots(runLoop(mkInput(c), () => 0, TW, params.ranged_damage_mult).log, i);
  const modes = ['eq', 'lt', 'gt'];
  for (let k = 0; k < Math.min(probe.length, c.draws.length); k++) {
    const h = probe[k].hitPct;
    if (!(h > 0 && h <= 100)) continue;
    const d = rollFor(h, modes[(k + i) % 3]);
    if (d !== null) c.draws[k] = d;
  }
};

// Zdarzenie z zerem w targetHp (R2): HP obroncy ustawione tak, by pierwszy strzal ATK (trafienie wymuszone
// rzutem 0) doprowadzil HP dokladnie do zera (`hpDef - dmg === 0`, wynik +0 w IEEE). Obrazenia strzalu nie
// zaleza od HP celu, wiec pierwszy przebieg z rng=0 podaje wartosc, ktora przypadek potem uzywa.
const applyZeroHp = (c, i) => {
  const probe = parseShots(runLoop(mkInput(c), () => 0, TW, params.ranged_damage_mult).log, i);
  const first = probe[0];
  if (!first || first.side !== 'attacker' || !first.hit || !(first.damage > 0) || !Number.isFinite(first.damage)) return;
  c.hpDef = first.damage;
  c.draws[0] = 0;
};

const cases = [];
const N = 700;
for (let i = 0; i < N; i++) {
  const c = genCase(i);
  if (i % 7 === 3) applyBoundary(c, i);
  else if (i % 6 === 5) applyZeroHp(c, i);
  const draws = c.draws;
  let di = 0;
  const rng = () => {
    if (di >= draws.length) throw new Error(`przypadek ${i}: brak losowan`);
    return draws[di++];
  };
  // Kolejnosc ATK, DEF; sprawdzamy, ze petla nie wykona wiecej strzalow niz zapas (zapas = 2*(maxRounds+2)+2).
  const res = runLoop(mkInput(c), rng, TW, params.ranged_damage_mult);
  const shots = parseShots(res.log, i).map((p) => ({
    round: p.round,
    side: p.side,
    hit: p.hit,
    hitPct: enc(p.hitPct),
    damage: enc(p.damage),
    targetHp: p.targetHp === null ? null : enc(p.targetHp),
  }));
  // Losowania zuzyte = liczba strzalow (jedno na strzal).
  if (shots.length > draws.length) throw new Error(`przypadek ${i}: wiecej strzalow niz losowan`);
  cases.push({
    input: {
      attacker: c.attacker, defender: c.defender,
      atkIsRanged: c.atkIsRanged, defIsRanged: c.defIsRanged,
      ammoAtk: c.ammoAtk, ammoDef: c.ammoDef,
      hpAtk: enc(c.hpAtk), hpDef: enc(c.hpDef),
      totalRounds: c.totalRounds, maxRounds: c.maxRounds,
      atkMelee0: enc(c.atkMelee0), atkMissile0: enc(c.atkMissile0), atkObrona0: enc(c.atkObrona0),
      atkPanc0: enc(c.atkPanc0), defMelee0: enc(c.defMelee0), defMissile0: enc(c.defMissile0),
      defPanc0: enc(c.defPanc0), defFinalObrona: enc(c.defFinalObrona), terrRiverMult: enc(c.terrRiverMult),
      ctrAtkVsDef: enc(c.ctrAtkVsDef), ctrDefVsAtk: enc(c.ctrDefVsAtk),
      routAtk: enc(c.routAtk), routDef: enc(c.routDef),
    },
    draws: draws.slice(0, shots.length).map(enc),
    expected: {
      hpAtk: enc(res.hpAtk), hpDef: enc(res.hpDef),
      ammoAtk: res.ammoAtk, ammoDef: res.ammoDef,
      rounds: res.totalRounds,
      routed: res.routed.slice(),
      shots,
    },
  });
}

const nanHp = cases.filter((c) => c.expected.hpAtk === 'NaN' || c.expected.hpDef === 'NaN').length;
const infHp = cases.filter((c) => c.expected.hpAtk === '-Infinity' || c.expected.hpDef === '-Infinity').length;
const allShots = cases.flatMap((c) => c.expected.shots);
const counts = {
  cases: cases.length,
  shots: allShots.length,
  shotsHitNaNPct: allShots.filter((s) => s.hitPct === 'NaN').length,
  shotsNaNDamage: allShots.filter((s) => s.damage === 'NaN').length,
  shotsInfDamage: allShots.filter((s) => s.damage === 'Infinity').length,
  casesNaNHp: nanHp,
  casesMinusInfHp: infHp,
  casesRouted: cases.filter((c) => c.expected.routed.length > 0).length,
  // roll*100 === hitPct (granica `<` vs `<=`; pin: trafienie tylko przy roll < hitPct).
  shotsRollEq: cases.flatMap((c) => c.expected.shots.map((s, k) => [s, parseNum(c.draws[k])]))
    .filter(([s, d]) => d * 100 === parseNum(s.hitPct)).length,
  // R2: sasiedzi ULP wokol granicy (roll*100 tuz ponizej / tuz powyzej hitPct) oraz zero w targetHp (+0).
  shotsRollJustBelow: cases.flatMap((c) => c.expected.shots.map((s, k) => [s, parseNum(c.draws[k])]))
    .filter(([s, d]) => Number.isFinite(parseNum(s.hitPct)) && d * 100 < parseNum(s.hitPct) && d * 100 >= parseNum(s.hitPct) - 1e-9).length,
  shotsRollJustAbove: cases.flatMap((c) => c.expected.shots.map((s, k) => [s, parseNum(c.draws[k])]))
    .filter(([s, d]) => Number.isFinite(parseNum(s.hitPct)) && d * 100 > parseNum(s.hitPct) && d * 100 <= parseNum(s.hitPct) + 1e-9).length,
  shotsTargetHpZero: allShots.filter((s) => s.targetHp === 0).length,
  shotsNegZeroAnyField: allShots.filter((s) => [s.hitPct, s.damage, s.targetHp].includes('-0')).length,
};
const out = {
  source: { pin: PIN, files: [COMBAT, UNIT_POWER], fragmentSha256: fragmentSha, paramsFile: PARAMS, paramsSha256: paramsSha },
  seed: 6610,
  ranged_damage_mult: params.ranged_damage_mult,
  tw_v3: TW,
  counts,
  cases,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(out) + '\n');
console.error(`zapisano ${outPath}: ${JSON.stringify(counts)}`);
