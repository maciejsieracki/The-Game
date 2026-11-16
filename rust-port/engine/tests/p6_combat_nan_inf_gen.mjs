// P6 COMBAT-NAN-INF (R-RUSTPORT-P6-NAN-INF-WEKTORY-Q1, #137): generator wektorow pinu dla NaN / Inf / ulamkow
// w amunicji (`resolveAmmo`) i w `maxRounds` (petla dystansu `resolveCombat`, blok "Phase 0: Ranged") z PINU 07d2fbd72.
//
// Wykonywany jest TEKST pinu (po zdjeciu typow TypeScript), a nie przepisana kopia:
//   - resolveAmmo i isRangedUnit (combat.ts),
//   - blok petli dystansu (verbatim), funkcje hitChanceTw, rangedShotAccuracy, rangeDamageTw, rangedShotDamage
//     (combat.ts) oraz rangedDamageMultFor (unit-power.ts),
//   - stale: TW = combat-params.json tw_v3, RANGED_DAMAGE_MULT = combat-params.json ranged_damage_mult,
//   - dane jednostek (Typ, Jednostka, missileAttack, Ilosc pociskow) z gra/data/units.json pinu.
// Jedyny stub: RNG = zapisana sekwencja losowan [0,1) (jedno losowanie na strzal, kolejnosc ATK, DEF).
// Poza zakresem (NIE_ZMIERZONO): wejscia przed petla (civ/budynki/teren) i pelne resolveCombat.
//
// Jak traktowane sa wartosci spoza i64 (Rust ma `ammo: i64`, `max_rounds: u32`):
//   1. Pin jest wykonany dla wartosci ORYGINALNEJ (NaN, +-Infinity, -0, 0.5, 2.5, ...) i sprawdzany wzgledem
//      recon NAN-INF-AMUNICJA-ROZPOZNANIE §5 (V-A1, V-A2, V-A3, V-K2).
//   2. Gdy wartosc nie jest calkowita (NaN, +-Inf) podaje sie PROXY calkowite (np. NaN -> 0, +Inf -> 1000000).
//      Generator wykonuje pin takze z proxy i sprawdza, ze zdarzenia strzalow, HP, rundy i rout sa takie same.
//      Amunicja po walce jest sprawdzana osobno (Inf - n = Inf; NaN pozostaje NaN, a w Rust porownywany jest proxy).
//   3. Ulamki (0.5, 2.5) NIE maja proxy: i64 nie przenosi ulamka, a zaokraglenie to niewdrozona decyzja (§4 recon).
//      Zostaja tylko w pinie (rust.applicable = false, powod w JSON).
//
// Straznik SHA-256: fragmenty pinu (te same co w p6_combat_harness_gen.mjs) oraz resolveAmmo/isRangedUnit.
// Wynik -> p6_combat_nan_inf_vectors/vectors.json.
//
// Uruchomienie (z korzenia repo): node rust-port/engine/tests/p6_combat_nan_inf_gen.mjs

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
const UNITS = 'gra/data/units.json';
const LOOP_START = '  // ---------- Phase 0: Ranged ----------';
const LOOP_END = '  // ---------- Phase 1 & 2: Melee ----------';
// Te same skroty co w p6_combat_harness_gen.mjs (ten sam tekst pinu).
const EXPECT_FRAGMENT_SHA256 = '700d16235700836e4c5eb9e49d697556e9e1bbe21331c98dd1d535a314bd7837';
const EXPECT_PARAMS_SHA256 = '5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e';
// resolveAmmo + isRangedUnit (combat.ts, pin 07d2fbd72).
const EXPECT_AUX_SHA256 = '799b1a9ad9f4e158fa723b33578f824f77990c1b23102d2ffefac0a7db7eec67';
const LIMIT_LOG = 'Limit rund osiagniety w fazie dystansowej.';
const HEADER_LOG = '=== Faza dystansowa ===';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outDir = join(here, 'p6_combat_nan_inf_vectors');
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

function extractPlain(src, name) {
  const m = new RegExp(`(?:export )?function ${name}\\(`).exec(src);
  if (!m) throw new Error(`brak ${name} w pinie ${PIN}`);
  const end = src.indexOf('\n}\n', m.index);
  if (end < 0) throw new Error(`nie znaleziono konca ${name}`);
  return src.slice(m.index, end + 3).replace(/^export /, '');
}

const combatSrc = gitShow(COMBAT);
const unitPowerSrc = gitShow(UNIT_POWER);
const paramsText = gitShow(PARAMS);
const unitsText = gitShow(UNITS);

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
const auxTs = [extractPlain(combatSrc, 'resolveAmmo'), extractPlain(combatSrc, 'isRangedUnit')].join('\n');

const fragmentSha = sha([fnTs, multTs, loopTs].join('\n----\n'));
const paramsSha = sha(paramsText);
const auxSha = sha(auxTs);
console.error(`fragment sha256 = ${fragmentSha}`);
console.error(`combat-params sha256 = ${paramsSha}`);
console.error(`aux (resolveAmmo+isRangedUnit) sha256 = ${auxSha}`);
if (fragmentSha !== EXPECT_FRAGMENT_SHA256) throw new Error(`straznik: fragmenty pinu (funkcje/petla) zmienione: ${fragmentSha}`);
if (paramsSha !== EXPECT_PARAMS_SHA256) throw new Error('straznik: combat-params.json w pinie zmieniony');
if (auxSha !== EXPECT_AUX_SHA256) throw new Error(`straznik: resolveAmmo/isRangedUnit zmienione w pinie: ${auxSha}`);

const params = JSON.parse(paramsText);
const TW = params.tw_v3;
const RDM = params.ranged_damage_mult;

// Naglowek / stopka / formatowanie logu: identyczne jak w p6_combat_harness_gen.mjs.
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
const LOG_NUM = /\$\{(hitPct|dmg|hpDef|hpAtk)\}/g;
const nLogNum = [...loopTs.matchAll(LOG_NUM)].length;
if (nLogNum !== 10) throw new Error(`oczekiwano 10 szablonow liczbowych w logu petli, jest ${nLogNum}`);
const loopLog = loopTs.replace(LOG_NUM, (_, n) => `\${__z(${n})}`);

const body = `function __body(__in, __rng, __tw, __rdm) {\nconst TW = __tw; const RANGED_DAMAGE_MULT = __rdm;\n${fnTs}\n${multTs}\n${HEADER}\n${loopLog}\n${FOOTER}}\n`;
const runLoop = new Function(`${stripTypeScriptTypes(body)}\nreturn __body;`)();
const aux = new Function(`${stripTypeScriptTypes(auxTs)}\nreturn { resolveAmmo, isRangedUnit };`)();

// ---------- Kodowanie liczb (NaN / Infinity / -0 jako napisy) ----------
const enc = (x) => {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  return Number.isSafeInteger(x) ? x : String(x);
};
const parseNum = (s) => {
  if (s === 'NaN') return NaN;
  if (s === 'Infinity') return Infinity;
  if (s === '-Infinity') return -Infinity;
  if (s === '-0') return -0;
  return Number(s);
};

// Zdarzenia strzalow z logu pinu (wyprowadzone z tekstu pinu).
const LINE = /^R(\d+)\[Dyst-(ATK|DEF)\] (trafienie|chybienie) \(([^<>=]+)(?:<|>=)([^%]+)%\)(?: -> ([^ ]+) obra\. [^:]+: (\S+))?\.?$/;
const parseShots = (log, id) => {
  const shots = [];
  for (const line of log) {
    if (!/Dyst-(ATK|DEF)\]/.test(line)) continue;
    const m = LINE.exec(line);
    if (!m) throw new Error(`${id}: nie sparsowano linii dystansowej: ${line}`);
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

// ---------- Uruchomienie pinu ----------
function runPin(c, draws) {
  let di = 0;
  const rng = () => {
    if (di >= draws.length) throw new Error(`${c.id}: brak losowan (zuzyto ${di})`);
    return draws[di++];
  };
  const res = runLoop(c, rng, TW, RDM);
  return {
    hpAtk: res.hpAtk,
    hpDef: res.hpDef,
    ammoAtk: res.ammoAtk,
    ammoDef: res.ammoDef,
    rounds: res.totalRounds,
    routed: res.routed.slice(),
    shots: parseShots(res.log, c.id),
    hasHeader: res.log.includes(HEADER_LOG),
    hasLimit: res.log.includes(LIMIT_LOG),
    drawsUsed: di,
  };
}

const encShot = (s) => ({
  round: s.round,
  side: s.side,
  hit: s.hit,
  hitPct: enc(s.hitPct),
  damage: enc(s.damage),
  targetHp: s.targetHp === null ? null : enc(s.targetHp),
});
const encRun = (r) => ({
  hpAtk: enc(r.hpAtk),
  hpDef: enc(r.hpDef),
  ammoAtk: enc(r.ammoAtk),
  ammoDef: enc(r.ammoDef),
  rounds: r.rounds,
  routed: r.routed,
  shots: r.shots.map(encShot),
  hasHeader: r.hasHeader,
  hasLimit: r.hasLimit,
  drawsUsed: r.drawsUsed,
});
const sideShots = (r, side) => r.shots.filter((s) => s.side === side).length;
const shotsKey = (r) => JSON.stringify(r.shots.map(encShot));
const sameNum = (a, b) => (Number.isNaN(a) ? Number.isNaN(b) : Object.is(a, b));

// Ta sama wartosc zdarzen, HP, rund i rout (bez amunicji).
function sameEvents(a, b) {
  return sameNum(a.hpAtk, b.hpAtk) && sameNum(a.hpDef, b.hpDef) && a.rounds === b.rounds
    && JSON.stringify(a.routed) === JSON.stringify(b.routed) && shotsKey(a) === shotsKey(b);
}

// ---------- Dane jednostek z pinu (units.json) ----------
const unitsArr = JSON.parse(unitsText);
function unitFromData(name) {
  const r = unitsArr.find((x) => x['Jednostka'] === name);
  if (!r) throw new Error(`brak jednostki ${name} w units.json pinu`);
  const raw = r['Ilosc pociskow'];
  return {
    unitName: name,
    counterTyp: r['Typ'],
    typNazwa: r['Jednostka'],
    unbreakable: false,
    missileAttack: r['missileAttack'],
    // combatStatField zamienia '—' na undefined, a `?? null` daje null (resolveAmmo -> 0).
    'Ilosc pociskow': raw === '—' || raw === '---' || raw === undefined ? null : raw,
  };
}

// ---------- Stale wejsc petli (wartosci neutralne, jak w generatorze harnessu) ----------
const BASE = {
  totalRounds: 0,
  maxRounds: 5,
  atkMelee0: 10,
  atkMissile0: 20,
  atkObrona0: 10,
  atkPanc0: 5,
  defMelee0: 10,
  defMissile0: 20,
  defPanc0: 5,
  defFinalObrona: 10,
  terrRiverMult: 1,
  ctrAtkVsDef: 1,
  ctrDefVsAtk: 1,
  routAtk: 0,
  routDef: 0,
};
const DRAWS = [0.3, 0.9, 0.1, 0.5, 0.7, 0.2, 0.95, 0.05, 0.6, 0.4, 0.8, 0.15, 0.35, 0.65, 0.25, 0.85, 0.45, 0.55, 0.75, 0.5];

const ARCHER = { unitName: 'Łucznik (test)', counterTyp: 'Distance', typNazwa: 'Łucznik', unbreakable: false, missileAttack: 3, 'Ilosc pociskow': null };
const SPEAR = { unitName: 'Włócznik (test)', counterTyp: 'Spearman', typNazwa: 'Włócznik', unbreakable: false, missileAttack: 0, 'Ilosc pociskow': null };

// Wejscie pinu: `ammoAtk`/`ammoDef` przekazywane jako nadpisanie (override) do resolveAmmo, tak jak w pinie.
function makePinCase({ id, group, desc, atk, def, ammoAtkOverride, ammoDefOverride, draws = DRAWS, maxRounds = 5, hpAtk = 100, hpDef = 100 }) {
  const c = {
    id,
    attacker: atk,
    defender: def,
    atkIsRanged: aux.isRangedUnit(atk),
    defIsRanged: aux.isRangedUnit(def),
    ammoAtk: aux.resolveAmmo(atk, ammoAtkOverride),
    ammoDef: aux.resolveAmmo(def, ammoDefOverride),
    hpAtk,
    hpDef,
    ...BASE,
    maxRounds,
  };
  return { id, group, desc, c, draws, ammoAtkOverride, ammoDefOverride };
}

// Proxy calkowite dla wartosci nie-calkowitych (NaN, +-Inf); ulamki bez proxy.
const PROXY = {
  NaN: 0,
  '+Inf': 1000000,
  '-Inf': -1000000,
};
const tagOf = (v) => (Number.isNaN(v) ? 'NaN' : v === Infinity ? '+Inf' : v === -Infinity ? '-Inf' : Object.is(v, -0) ? '-0' : String(v));

// ---------- Przypadki ----------
const specs = [];

// V-A1: ammoAtk w fazie dystansowej (obronca bez dystansu), maxRounds = 5. Oczekiwane strzaly wg §5.
const A1_EXPECT = { NaN: 0, '+Inf': 5, '-Inf': 0, '-0': 0, '0': 0, '0.5': 1, '1': 1, '2.5': 3 };
for (const v of [NaN, Infinity, -Infinity, -0, 0, 0.5, 1, 2.5]) {
  const tag = tagOf(v);
  specs.push(makePinCase({
    id: `V-A1-${tag}`,
    group: 'V-A1',
    desc: `ammoAtk = ${tag} (override), obronca bez dystansu, maxRounds = 5`,
    atk: ARCHER,
    def: SPEAR,
    ammoAtkOverride: v,
    ammoDefOverride: undefined,
  }));
}

// V-A2: ammoAtk = NaN, ammoDef = 3 (obaj dystansowi). Atakujacy 0 strzalow, obronca 3.
specs.push(makePinCase({
  id: 'V-A2-NaN-vs-3',
  group: 'V-A2',
  desc: 'ammoAtk = NaN, ammoDef = 3, obaj dystansowi, maxRounds = 5',
  atk: ARCHER,
  def: ARCHER,
  ammoAtkOverride: NaN,
  ammoDefOverride: 3,
}));

// V-A3: ammoAtk = +Inf, maxRounds = 5: 5 strzalow i log limitu.
specs.push(makePinCase({
  id: 'V-A3-Inf-max5',
  group: 'V-A3',
  desc: 'ammoAtk = +Infinity, obronca bez dystansu, maxRounds = 5 (oczekiwany log limitu)',
  atk: ARCHER,
  def: SPEAR,
  ammoAtkOverride: Infinity,
  ammoDefOverride: undefined,
}));

// V-K2: cztery jednostki z missileAttack > 0 i amunicja '—' (dane z units.json pinu).
const K2_NAMES = [
  ['Drużynnik', 7],
  ['Thorakites', 6],
  ['Evocati', 6],
  ['Gwardzista z champi', 5],
];
for (const [name, ma] of K2_NAMES) {
  const u = unitFromData(name);
  if (u.missileAttack !== ma) throw new Error(`${name}: missileAttack ${u.missileAttack} != oczekiwane ${ma}`);
  specs.push(makePinCase({
    id: `V-K2-${name}-vs-Wlocznik`,
    group: 'V-K2',
    desc: `${name}: missileAttack=${ma}, ammo '—' (-> 0); obronca bez dystansu`,
    atk: u,
    def: SPEAR,
  }));
  specs.push(makePinCase({
    id: `V-K2-${name}-vs-self`,
    group: 'V-K2',
    desc: `${name} vs ${name}: oba dystansowe z ammo '—' (-> 0)`,
    atk: u,
    def: unitFromData(name),
  }));
}

// ---------- Wykonanie, sprawdzenia pinu i proxy ----------
const cases = [];
const failures = [];
const note = (msg) => failures.push(msg);

for (const s of specs) {
  const { c, draws, group, id } = s;
  const orig = runPin(c, draws);

  // Sprawdzenia wzgledem recon §5 (pin wykonany, nie czytany).
  if (group === 'V-A1') {
    const tag = id.replace('V-A1-', '');
    const exp = A1_EXPECT[tag];
    if (orig.shots.filter((x) => x.side === 'attacker').length !== exp) {
      note(`${id}: strzaly atakujacego ${sideShots(orig, 'attacker')} != ${exp}`);
    }
    if (sideShots(orig, 'defender') !== 0) note(`${id}: obronca bez dystansu strzela`);
  }
  if (group === 'V-A2') {
    if (sideShots(orig, 'attacker') !== 0) note(`${id}: NaN nie blokuje strzalow atakujacego`);
    if (sideShots(orig, 'defender') !== 3) note(`${id}: obronca ma ${sideShots(orig, 'defender')} strzalow, oczekiwano 3`);
    if (!Number.isNaN(orig.ammoAtk)) note(`${id}: amunicja atakujacego po walce nie jest NaN (override bez walidacji)`);
  }
  if (group === 'V-A3') {
    if (sideShots(orig, 'attacker') !== 5) note(`${id}: liczba strzalow ${sideShots(orig, 'attacker')} != 5`);
    if (orig.rounds !== 6) note(`${id}: rundy ${orig.rounds} != 6 (m+1 po trafieniu w limit)`);
    if (!orig.hasLimit) note(`${id}: brak logu limitu rund`);
    if (orig.ammoAtk !== Infinity) note(`${id}: +Inf - 5 nie pozostaje +Inf`);
  }
  if (group === 'V-K2') {
    if (!c.atkIsRanged) note(`${id}: isRangedUnit(atakujacy) = false, oczekiwano true (missileAttack > 0)`);
    if (c.ammoAtk !== 0) note(`${id}: amunicja '—' != 0 (resolveAmmo = ${c.ammoAtk})`);
    if (orig.shots.length !== 0) note(`${id}: ${orig.shots.length} strzalow, oczekiwano 0`);
    if (!orig.hasHeader) note(`${id}: brak naglowka '${HEADER_LOG}'`);
    if (orig.rounds !== 0) note(`${id}: rundy ${orig.rounds} != 0`);
  }

  // Wartosc dla Rust: calkowita (lub proxy). Ulamki -> brak (NIE_ZMIERZONO).
  const proxyFor = (v) => {
    if (v === undefined) return undefined;
    if (Number.isInteger(v) && !Object.is(v, -0)) return { value: v, proxied: false };
    if (Object.is(v, -0)) return { value: 0, proxied: true, why: '-0 -> 0 (ammo: i64, znak zera bez znaczenia dla ammo > 0)' };
    const tag = tagOf(v);
    if (tag in PROXY) return { value: PROXY[tag], proxied: true, why: `${tag} -> ${PROXY[tag]}` };
    return null; // ulamek: brak proxy
  };
  const rA = proxyFor(s.ammoAtkOverride !== undefined ? s.ammoAtkOverride : c.ammoAtk);
  const rD = proxyFor(s.ammoDefOverride !== undefined ? s.ammoDefOverride : c.ammoDef);

  // Pin z ammo ustawionym na wartosc widziana przez Rust i sprawdzenie rownowaznosci zdarzen.
  let rust = null;
  let skip = null;
  if (rA === null || rD === null) {
    skip = 'ammo ulamkowe (0.5 / 2.5): i64 nie przenosi ulamka, a zaokraglenie to niewdrozona decyzja (recon §4); pin-only';
  } else {
    const rustCase = { ...c, ammoAtk: rA.value, ammoDef: rD.value };
    const rr = runPin(rustCase, draws);
    if (!sameEvents(orig, rr)) note(`${id}: proxy (${rA.value}/${rD.value}) zmienia zdarzenia, HP lub rundy wzgledem pinu`);
    // Amunicja po walce: proxy minus strzaly tej strony (Inf - n = Inf jest sprawdzane w pinie oryginalnym).
    if (rr.ammoAtk !== rA.value - sideShots(rr, 'attacker')) note(`${id}: amunicja atakujacego proxy po walce ${rr.ammoAtk} != ${rA.value} - ${sideShots(rr, 'attacker')}`);
    if (rr.ammoDef !== rD.value - sideShots(rr, 'defender')) note(`${id}: amunicja obroncy proxy po walce ${rr.ammoDef} != ${rD.value} - ${sideShots(rr, 'defender')}`);
    if (Math.abs(orig.ammoAtk) === Infinity && orig.ammoAtk !== c.ammoAtk) note(`${id}: nieskonczona amunicja zmieniona przez walke (${orig.ammoAtk})`);
    rust = {
      applicable: true,
      proxy: [rA.proxied ? rA.why : null, rD.proxied ? rD.why : null].filter(Boolean).join('; ') || null,
      ammoAtk: rA.value,
      ammoDef: rD.value,
      expected: encRun(rr),
    };
  }

  cases.push({
    id,
    group,
    desc: s.desc,
    draws: draws.map(enc),
    pin: {
      input: {
        attacker: { unitName: c.attacker.unitName, counterTyp: c.attacker.counterTyp, typNazwa: c.attacker.typNazwa, unbreakable: c.attacker.unbreakable, missileAttack: c.attacker.missileAttack },
        defender: { unitName: c.defender.unitName, counterTyp: c.defender.counterTyp, typNazwa: c.defender.typNazwa, unbreakable: c.defender.unbreakable, missileAttack: c.defender.missileAttack },
        atkIsRanged: c.atkIsRanged,
        defIsRanged: c.defIsRanged,
        ammoAtk: enc(c.ammoAtk),
        ammoDef: enc(c.ammoDef),
        ammoAtkOverride: s.ammoAtkOverride === undefined ? null : enc(s.ammoAtkOverride),
        ammoDefOverride: s.ammoDefOverride === undefined ? null : enc(s.ammoDefOverride),
        hpAtk: enc(c.hpAtk),
        hpDef: enc(c.hpDef),
        totalRounds: c.totalRounds,
        maxRounds: c.maxRounds,
        atkMelee0: enc(c.atkMelee0),
        atkMissile0: enc(c.atkMissile0),
        atkObrona0: enc(c.atkObrona0),
        atkPanc0: enc(c.atkPanc0),
        defMelee0: enc(c.defMelee0),
        defMissile0: enc(c.defMissile0),
        defPanc0: enc(c.defPanc0),
        defFinalObrona: enc(c.defFinalObrona),
        terrRiverMult: enc(c.terrRiverMult),
        ctrAtkVsDef: enc(c.ctrAtkVsDef),
        ctrDefVsAtk: enc(c.ctrDefVsAtk),
        routAtk: enc(c.routAtk),
        routDef: enc(c.routDef),
      },
      expected: encRun(orig),
    },
    rust: rust ?? { applicable: false, skip },
  });
}

if (failures.length) {
  console.error('BLEDY SPRAWDZEN PINU:');
  for (const f of failures) console.error(`  - ${f}`);
  throw new Error(`${failures.length} sprawdzen pinu nie przeszlo`);
}

const applicable = cases.filter((c) => c.rust.applicable).length;
const counts = {
  cases: cases.length,
  rustApplicable: applicable,
  rustNotMeasured: cases.length - applicable,
  byGroup: Object.fromEntries(['V-A1', 'V-A2', 'V-A3', 'V-K2'].map((g) => [g, cases.filter((c) => c.group === g).length])),
  shotsPin: cases.reduce((n, c) => n + c.pin.expected.shots.length, 0),
};
const out = {
  source: { pin: PIN, files: [COMBAT, UNIT_POWER, UNITS], fragmentSha256: fragmentSha, auxSha256: auxSha, paramsFile: PARAMS, paramsSha256: paramsSha },
  ranged_damage_mult: RDM,
  tw_v3: TW,
  counts,
  cases,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
console.error(`zapisano ${outPath}: ${JSON.stringify(counts)}`);
