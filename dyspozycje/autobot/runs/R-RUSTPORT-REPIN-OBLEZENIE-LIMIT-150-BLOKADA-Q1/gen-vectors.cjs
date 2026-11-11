// R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1 r2: generator wektorow z URUCHOMIONEGO kodu weba (Node 22).
// Uzycie: node gen-vectors.cjs <WEB_ROOT> <OUT_RS>
//   WEB_ROOT = katalog z `git archive origin/main gra/src gra/data` (poza repo, w scratchpad).
//   OUT_RS   = plik Rust z wygenerowanymi tablicami (rust-port/engine/tests/p6_repin_oblezenie_limit_vectors/vectors.rs).
// Kod webowy NIE jest przepisywany recznie. Wycinane doslownie z plikow weba:
//  (a) prawa strona przypisania SIEGE_NO_BREACH_MAX_ROUNDS (battleScene.ts, cap) -- eval z parametrem P zamiast combatParamsData,
//  (b) cialo metody _roundCapVerdict (battleScene.ts) -- wykonywane z self zamiast this,
//  (c) funkcje stackGroupIdOf / besiegeArmyGroups / besiegeLockTargets (gra/src/game/armyMerge.ts) oraz hexDistance
//      (gra/src/units/setup.ts) -- uruchamiane w Node 22 przez --experimental-strip-types (typy usuwane przez Node).
// Nie ma tu recznych oczekiwan: oczekiwany wynik to to, co zwroci kod weba.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const [webRoot, outRs] = process.argv.slice(2);
if (!webRoot || !outRs) { console.error('usage: node gen-vectors.cjs <WEB_ROOT> <OUT_RS>'); process.exit(2); }

const readWeb = (rel) => fs.readFileSync(path.join(webRoot, rel), 'utf8');
const src = readWeb('gra/src/battle/battleScene.ts').split('\n');
const webParams = JSON.parse(readWeb('gra/data/combat-params.json'));
const WEB_BEZ_WYLOMU = webParams['oblężenie'].bez_wylomu_max_tur;

// (0) FF_MAX_ROUNDS doslownie z pliku
const ffLine = src.find((l) => /^const FF_MAX_ROUNDS = \d+;/.test(l));
const FF_MAX_ROUNDS = Number(/= (\d+);/.exec(ffLine)[1]);

// (a) cap: prawa strona przypisania SIEGE_NO_BREACH_MAX_ROUNDS
const capLine = src.find((l) => /^const SIEGE_NO_BREACH_MAX_ROUNDS\b/.test(l));
if (!capLine) throw new Error('nie znaleziono linii capu');
const capRhs = /=\s*(.*);\s*$/.exec(capLine)[1].replace(/combatParamsData\['oblężenie'\]/g, 'P');
const capFn = new Function('P', 'FF_MAX_ROUNDS', `return ${capRhs};`);

// (b) cialo _roundCapVerdict
const startIdx = src.findIndex((l) => l.includes('private _roundCapVerdict('));
if (startIdx < 0) throw new Error('nie znaleziono _roundCapVerdict');
let endIdx = startIdx + 1;
while (src[endIdx] !== '  }') endIdx++;
const body = src.slice(startIdx + 1, endIdx).join('\n').replace(/\bthis\./g, 'self.');
const verdictFn = new Function('self', 'FF_MAX_ROUNDS', body);

const winnerToRs = { remis: 'Draw', obronca: 'Defender', atakujacy: 'Attacker' };
const fmtF = (x) => {
  if (Number.isNaN(x)) return 'f64::NAN';
  if (Number.isInteger(x)) return x.toFixed(1);
  return String(x);
};

// --- tablica 1: cap
const capInputs = [undefined, 0, NaN, 1, 2.5, 149.4, 149.5, 150, 399.5, 400, 400.4, 900, -7, 0.4, 1e9];
const capRows = capInputs.map((x) => {
  const v = capFn({ bez_wylomu_max_tur: x }, FF_MAX_ROUNDS);
  const arg = x === undefined ? 'None' : `Some(${fmtF(x)})`;
  return `    (${arg}, ${v}),`;
});

// --- tablica 2: werdykt sufitu
const roundNos = [0, 149, 150, 151, 399, 400, 401];
const caps = [1, 150, 400, 900];
const morale = [[0.3, 0.5], [0.5, 0.5], [0.8, 0.5]];
const verdictRows = [];
for (const wallCol of [-1, 3]) for (const breached of [false, true]) for (const cap of caps)
  for (const r of roundNos) for (const [a, d] of morale) {
    const self = {
      siegeWallCol: wallCol, wallEverBreached: breached, roundNo: r, siegeNoBreachMaxRounds: cap,
      _armyMoraleRatio: (s) => (s === 'atk' ? a : d),
    };
    const res = verdictFn(self, FF_MAX_ROUNDS);
    const exp = res === null ? 'None' : `Some(RoundCapVerdict::${winnerToRs[res.winner]})`;
    verdictRows.push(`    (${r}, ${wallCol >= 0}, ${breached}, ${cap}, ${fmtF(a)}, ${fmtF(d)}, ${exp}),`);
  }

// --- czesc B (SIEGE-NEARBY): funkcje webowe wycinane doslownie
function extractFn(file, startRe) {
  const lines = readWeb(file).split('\n');
  const i = lines.findIndex((l) => startRe.test(l));
  if (i < 0) throw new Error('brak funkcji: ' + startRe + ' w ' + file);
  let j = i;
  while (!/^\}\s*$/.test(lines[j])) j++;
  if (!lines.slice(i, j + 1).some((l) => /\{\s*$/.test(l))) throw new Error('brak otwarcia: ' + lines[i]);
  return lines.slice(i, j + 1).join('\n');
}
const lockHarness = [
  'interface RuntimeUnit { ownerId: number; q: number; r: number; inGarnizon?: boolean; oblegaCityId?: string; stackGroupId?: string; }',
  extractFn('gra/src/game/armyMerge.ts', /^export function stackGroupIdOf\(/),
  extractFn('gra/src/game/armyMerge.ts', /^export function besiegeArmyGroups\(/),
  extractFn('gra/src/game/armyMerge.ts', /^export function besiegeLockTargets\(/),
  extractFn('gra/src/units/setup.ts', /^export function hexDistance\(/),
  `let seed = 12345;
   const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
   const pick = (a) => a[Math.floor(rnd() * a.length)];
   const scen = [];
   for (let k = 0; k < 400; k++) {
     const n = 1 + Math.floor(rnd() * 6);
     const units = [];
     for (let i = 0; i < n; i++) {
       const u = { ownerId: pick([0, 1]), q: Math.floor(rnd() * 5) - 2, r: Math.floor(rnd() * 5) - 2,
         inGarnizon: rnd() < 0.3, oblegaCityId: pick([undefined, 'A', 'B']), stackGroupId: pick([undefined, '', 'G7']) };
       if (u.oblegaCityId === undefined) delete u.oblegaCityId;
       if (u.stackGroupId === undefined) delete u.stackGroupId;
       units.push(u);
     }
     const owner = pick([0, 1]);
     const hint = pick([undefined, '0|1,0', '1|0,0']);
     const groups = besiegeArmyGroups(units, 'A', owner, hint);
     const targets = besiegeLockTargets(units, { q: 0, r: 0 }, owner, groups);
     scen.push({
       units: units.map((u) => [u.ownerId, u.q, u.r, u.inGarnizon === true, u.oblegaCityId ?? null, u.stackGroupId ?? null]),
       owner, hint: hint ?? null,
       groups: groups === undefined ? null : [...groups].sort(),
       targets: targets.map((t) => units.indexOf(t)),
     });
   }
   console.log(JSON.stringify(scen));`,
].join('\n');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lockharness-'));
const tmpFile = path.join(tmpDir, 'harness.ts');
fs.writeFileSync(tmpFile, lockHarness);
const scen = JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--no-warnings', tmpFile],
  { encoding: 'utf8', maxBuffer: 1 << 26 }));
fs.rmSync(tmpDir, { recursive: true, force: true });
const rsStr = (x) => (x === null || x === undefined ? 'None' : `Some("${x}")`);
const lockRows = scen.map((sc) => {
  const units = sc.units.map((u) => `(${u[0]}, ${u[1]}, ${u[2]}, ${u[3]}, ${rsStr(u[4])}, ${rsStr(u[5])})`).join(', ');
  const groups = sc.groups === null ? 'None' : `Some(&[${sc.groups.map((g) => `"${g}"`).join(', ')}])`;
  return `    LockVector { units: &[${units}], owner: ${sc.owner}, hint: ${rsStr(sc.hint)}, expect_groups: ${groups}, expect_targets: &[${sc.targets.join(', ')}] },`;
});

const out = `//! GENEROWANE przez dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1/gen-vectors.cjs
//! z URUCHOMIONEGO kodu weba (Node ${process.version}, web origin/main 638e90bea):
//!   cap i _roundCapVerdict = battleScene.ts (cap ~1128, _roundCapVerdict ~9445);
//!   SIEGE-NEARBY = armyMerge.ts (stackGroupIdOf, besiegeArmyGroups, besiegeLockTargets) + setup.ts hexDistance.
//! Nie edytowac recznie. FF_MAX_ROUNDS z weba = ${FF_MAX_ROUNDS}; bez_wylomu_max_tur w gra/data = ${WEB_BEZ_WYLOMU}.

#![allow(dead_code, clippy::type_complexity)]

use civ_engine::domain::siege_no_breach::RoundCapVerdict;

/// (konfiguracja (None = brak pola), cap po web: Math.max(1, Math.round(Number(x) || FF)) i min(FF))
#[rustfmt::skip]
pub const WEB_CAP_VECTORS: &[(Option<f64>, i64)] = &[
${capRows.join('\n')}
];

/// (round_no, wall_present, wall_ever_breached, siegeNoBreachMaxRounds, atk_ratio, def_ratio, oczekiwany werdykt web)
#[rustfmt::skip]
pub const WEB_VERDICT_VECTORS: &[(i64, bool, bool, i64, f64, f64, Option<RoundCapVerdict>)] = &[
${verdictRows.join('\n')}
];

/// Scenariusz SIEGE-NEARBY: jednostki (owner, q, r, in_garnizon, oblega_city_id, explicit_stack_group_id),
/// wlasciciel armii, hint (siegeArmyGroupId), oczekiwane grupy (None = web undefined) i indeksy celow blokady.
/// Miasto: id "A", pozycja (0,0).
pub struct LockVector {
    pub units: &'static [(i64, i64, i64, bool, Option<&'static str>, Option<&'static str>)],
    pub owner: i64,
    pub hint: Option<&'static str>,
    pub expect_groups: Option<&'static [&'static str]>,
    pub expect_targets: &'static [usize],
}

#[rustfmt::skip]
pub const WEB_LOCK_VECTORS: &[LockVector] = &[
${lockRows.join('\n')}
];
`;
fs.mkdirSync(path.dirname(outRs), { recursive: true });
fs.writeFileSync(outRs, out);
console.log(`cap=${capRows.length} verdict=${verdictRows.length} lock=${scen.length} ff=${FF_MAX_ROUNDS} webBez=${WEB_BEZ_WYLOMU} -> ${outRs}`);
