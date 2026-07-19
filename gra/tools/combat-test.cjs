/**
 * combat-test.cjs
 * Test harness for the §5l combat module.
 *
 * Usage (from gra/):
 *   node tools/combat-test.cjs
 *
 * Strategy:
 *   1. Use esbuild to bundle src/game/combat.ts -> os.tmpdir()/combat-bundle.cjs
 *   2. require() the bundle
 *   3. Load units.json, counters.json, terrain-combat.json
 *   4. Adapt field names (JSON uses Polish diacritics; CombatUnit uses ASCII)
 *   5. Run 6 matchups with a deterministic seeded LCG
 *   6. Print results + first 6 log lines; assert sanity; print final summary
 */

'use strict';

const path = require('path');
const { execSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const GRA_DIR        = path.resolve(__dirname, '..');
const COMBAT_TS      = path.join(GRA_DIR, 'src/game/combat.ts');
const UNITS_JSON     = path.join(GRA_DIR, 'data/units.json');
const COUNTERS_JSON  = path.join(GRA_DIR, 'data/counters.json');
const TERRAIN_JSON   = path.join(GRA_DIR, 'data/terrain-combat.json');
const ESBUILD_BIN    = path.join(GRA_DIR, 'node_modules/.bin/esbuild');
const BUNDLE_PATH    = path.join(os.tmpdir(), 'combat-bundle.cjs');

// ---------------------------------------------------------------------------
// Step 1: Bundle combat.ts -> CJS
// ---------------------------------------------------------------------------
console.log('Bundling combat.ts with esbuild...');
try {
  execSync(
    '"' + ESBUILD_BIN + '" "' + COMBAT_TS + '" --bundle --platform=node --format=cjs --outfile="' + BUNDLE_PATH + '"',
    { stdio: 'inherit' }
  );
} catch (e) {
  console.error('esbuild failed:', e.message);
  process.exit(1);
}
const combat = require(BUNDLE_PATH);
const { resolveCombat, hitChanceTw, damageTw, rangeDamageTw } = combat;
if (typeof resolveCombat !== 'function') {
  console.error('resolveCombat not exported from bundle!');
  process.exit(1);
}
console.log('Bundle OK.\n');

// TW v3 formula sanity (Hastati vs Falanga — docs/WALKA-TW-v3.md)
var hitHF = hitChanceTw(8, 10);
if (hitHF !== 38) {
  console.error('hitChanceTw(8,10) expected 38, got ' + hitHF);
  process.exit(1);
}
var dmgHF = damageTw(8, 8, 4, 0, false);
if (dmgHF !== 4) {
  console.error('damageTw(8,8,4,0,false) expected 4, got ' + dmgHF);
  process.exit(1);
}
var pilumDmg = rangeDamageTw(15, 8);
if (pilumDmg !== 7) {
  console.error('rangeDamageTw(15,8) expected 7, got ' + pilumDmg);
  process.exit(1);
}
console.log('TW v3 formulas OK (hit HF=38%, dmg=4, pilum=7).\n');

// ---------------------------------------------------------------------------
// Step 2: Load data
// ---------------------------------------------------------------------------
const unitsRaw    = JSON.parse(fs.readFileSync(UNITS_JSON,    'utf8'));
const countersRaw = JSON.parse(fs.readFileSync(COUNTERS_JSON, 'utf8'));
const terrainRaw  = JSON.parse(fs.readFileSync(TERRAIN_JSON,  'utf8'));

// ---------------------------------------------------------------------------
// Step 3: Adapters for field-name mismatches
// ---------------------------------------------------------------------------

function adaptUnit(raw) {
  var pociski = raw['Ilość pocisków'];
  if (pociski === '—' || pociski === '---' || pociski === '' || pociski == null) pociski = '—';
  var zasieg = raw['Zasięg ataku (hex)'];
  if (zasieg === '—' || zasieg === '---' || zasieg === '' || zasieg == null) zasieg = '—';
  var num = function(v, fb) {
    if (v === null || v === undefined || v === '' || v === '—') return fb;
    var n = Number(v);
    return Number.isFinite(n) ? n : fb;
  };
  return {
    typNazwa : raw['Jednostka'],
    // counterTyp drives counterMultiplier() matching against counters.json's
    // "Typ atakujący"/"Cel (typ)" (Swordsman/Spearman/Mount/Distance/Slinger/
    // Falangite...). Mirrors combatUnitFromDef() in src/game/combat.ts:
    //   counterTyp: String(def['Typ'] ?? opts.typNazwa ?? def['Jednostka'] ?? '')
    // The harness has no separate opts.typNazwa, so the fallback chain
    // collapses to raw['Typ'] ?? raw['Jednostka'] ?? ''.
    counterTyp : String(raw['Typ'] ?? raw['Jednostka'] ?? ''),
    rola     : raw['Rola (linia)'],
    meleeAttack  : num(raw.meleeAttack, num(raw['Atak'], 0)),
    meleeDefence : num(raw.meleeDefence, num(raw['Obrona'], 0)),
    weaponDamage : num(raw.weaponDamage, num(raw['Uderzenie'], num(raw['Atak'], 0))),
    armor        : num(raw.armor, num(raw['Pancerz'], 0)),
    piercing     : num(raw.piercing, num(raw['Przebicie'], 0)),
    chargeBonus  : num(raw.chargeBonus, num(raw['Uderzenie'], 0)),
    health       : num(raw.health, num(raw['Health'], 30)),
    'Prog dezercji (% health)' : raw['Próg dezercji (% health)'],
    missileAttack              : num(raw.missileAttack, num(raw['Atak dystansowy'], 0)),
    'Zasieg ataku (hex)'       : zasieg,
    'Ilosc pociskow'           : pociski,
    'Ruch w bitwie (heksy)'    : raw['Ruch w bitwie (heksy)'] || '—',
    'Kara obrony z flanki (%)' : raw['Kara obrony z flanki (%)'] || '—',
    'Kara obrony z tyłu (%)'   : raw['Kara obrony z tyłu (%)']  || '—',
    'Super-jednostka'          : raw['Super-jednostka'],
  };
}

function adaptCounters(raw) {
  return raw.map(function(c) {
    return {
      'Typ atakujacy'        : c['Typ atakujący'],
      'Cel (typ)'            : c['Cel (typ)'],
      'Bonus'                : c['Bonus'],
      'Rodzaj (Atak/Obrona)' : c['Rodzaj (Atak/Obrona)'],
      'Status'               : c['Status'],
    };
  });
}

function adaptTerrain(raw) {
  return raw.map(function(t) {
    return {
      'Teren'                     : t['Teren'],
      'Bonus Obrona'              : t['Bonus Obrona'],
      'Delta Zasieg (dystansowi)' : t['Δ Zasięg (dystansowi)'],
      'Efekt specjalny'           : t['Efekt specjalny'],
    };
  });
}

const counters    = adaptCounters(countersRaw);
const terrainData = adaptTerrain(terrainRaw);

const unitsByName = {};
for (var i = 0; i < unitsRaw.length; i++) {
  var u = unitsRaw[i];
  unitsByName[u['Jednostka']] = adaptUnit(u);
}

function getUnit(name) {
  var u = unitsByName[name];
  if (!u) throw new Error('Unit not found: "' + name + '"');
  return u;
}

// ---------------------------------------------------------------------------
// Step 4: Seeded LCG (always seed=42 per battle -> repeatable)
// ---------------------------------------------------------------------------
function makeLCG(seed) {
  var s = seed >>> 0;
  return function lcg() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ---------------------------------------------------------------------------
// Step 5: Test runner
// ---------------------------------------------------------------------------
var passCount = 0;
var failCount = 0;

function runBattle(label, attackerName, defenderName, terrain, extraOpts) {
  extraOpts = extraOpts || {};
  var attacker = getUnit(attackerName);
  var defender = getUnit(defenderName);
  var rng = makeLCG(42);

  var opts = {
    defenderTerrain  : terrain,
    terrainData      : terrainData,
    counters         : counters,
    rng              : rng,
    attackerMoved    : true,
    attackerPosition : 'front',
  };
  for (var k in extraOpts) opts[k] = extraOpts[k];

  var result = resolveCombat(attacker, defender, opts);

  // Sanity assertions
  var errors = [];
  if (result.winner !== 'attacker' && result.winner !== 'defender' && result.winner !== 'draw') {
    errors.push('winner="' + result.winner + '" is invalid');
  }
  if (result.attackerHpLeft < 0 || result.attackerHpLeft > attacker.health) {
    errors.push('attackerHpLeft=' + result.attackerHpLeft + ' out of [0, ' + attacker.health + ']');
  }
  if (result.defenderHpLeft < 0 || result.defenderHpLeft > defender.health) {
    errors.push('defenderHpLeft=' + result.defenderHpLeft + ' out of [0, ' + defender.health + ']');
  }
  if (!Number.isInteger(result.rounds) || result.rounds <= 0) {
    errors.push('rounds=' + result.rounds + ' must be positive integer');
  }
  if (!Array.isArray(result.routed)) {
    errors.push('routed is not an array');
  }
  if (!Array.isArray(result.log) || result.log.length === 0) {
    errors.push('log is empty');
  }

  var passed = errors.length === 0;
  if (passed) passCount++; else failCount++;

  var winnerLabel =
    result.winner === 'attacker' ? 'ATTACKER (' + attackerName + ')'
    : result.winner === 'defender' ? 'DEFENDER (' + defenderName + ')'
    : 'DRAW';

  var routedStr = result.routed.length
    ? result.routed.map(function(r) { return r === 'attacker' ? attackerName : defenderName; }).join(', ') + ' routed'
    : 'no rout (destroyed or max rounds)';

  console.log('------------------------------------------------------------------------');
  console.log('TEST: ' + label);
  console.log('  Attacker : ' + attackerName + ' (HP ' + attacker.health + ')');
  console.log('  Defender : ' + defenderName + ' (HP ' + defender.health + ')');
  console.log('  Terrain  : ' + (terrain || 'none'));
  if (extraOpts.attackerPosition && extraOpts.attackerPosition !== 'front') {
    console.log('  Position : ' + extraOpts.attackerPosition);
  }
  console.log('  WINNER   : ' + winnerLabel);
  console.log('  ATK HP left : ' + result.attackerHpLeft + ' / ' + attacker.health);
  console.log('  DEF HP left : ' + result.defenderHpLeft + ' / ' + defender.health);
  console.log('  Rounds   : ' + result.rounds);
  console.log('  Routed   : ' + routedStr);
  console.log('  Log (first 6 lines):');
  var logSlice = result.log.slice(0, 6);
  for (var j = 0; j < logSlice.length; j++) console.log('    ' + logSlice[j]);
  if (result.log.length > 6) console.log('    ... (' + (result.log.length - 6) + ' more lines)');

  if (errors.length) {
    console.log('  ASSERTIONS FAILED:');
    for (var e = 0; e < errors.length; e++) console.log('    FAIL: ' + errors[e]);
  }
  console.log('  ' + (passed ? 'PASS' : 'FAIL'));
  console.log('');

  return result;
}

// ---------------------------------------------------------------------------
// Step 6: The matchups
// ---------------------------------------------------------------------------
console.log('========================================================================');
console.log('COMBAT TEST HARNESS — TW v3 Rome 2 auto-resolve');
console.log('========================================================================');
console.log('');

// 1. Hastati vs Falanga, Równina — pilum + melee; Falanga has high Obrona
runBattle(
  '1. Hastati (ATK) vs Falanga (DEF) — Równina',
  'Hastati',
  'Falanga',
  'Płaskie'
);

// 2. Wojownik z mieczem i tarczą vs Włócznik, Las — forest terrain
//    Charge of Włócznik (spear/phalanx) negates attacker charge
runBattle(
  '2. Wojownik z mieczem i tarczą (ATK) vs Włócznik (DEF) — Las',
  'Wojownik z mieczem i tarczą',
  'Włócznik',
  'Las'
);

// 3. Gwardia Królewska Sumeru (super) vs Hastati — Równina — super dominates
runBattle(
  '3. Gwardia Królewska Sumeru [SUPER] (ATK) vs Hastati (DEF) — Równina',
  'Gwardia Królewska Sumeru',
  'Hastati',
  'Płaskie'
);

// 4. Łucznik vs Wojownik z mieczem i tarczą — ranged phase, ammo mechanic; Łucznik fragile in melee
runBattle(
  '4. Łucznik (ATK) vs Wojownik z mieczem i tarczą (DEF) — Równina (ranged + melee)',
  'Łucznik',
  'Wojownik z mieczem i tarczą',
  'Płaskie'
);

// 5. Hastati (ATK) vs Falanga (DEF) on Wzgórza — terrain +50% Obrona for Falanga
runBattle(
  '5. Hastati (ATK) vs Falanga (DEF) — Wzgórza (terrain defence bonus)',
  'Hastati',
  'Falanga',
  'Wzgórza'
);

// 6. Medżaj (Gwardia Faraona) [super+ranged] vs Hastati — Równina
runBattle(
  '6. Medżaj (Gwardia Faraona) [SUPER+ranged] (ATK) vs Hastati (DEF) — Równina',
  'Medżaj (Gwardia Faraona)',
  'Hastati',
  'Płaskie'
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
var total = passCount + failCount;
console.log('========================================================================');
console.log('COMBAT TEST: ' + passCount + '/' + total + ' pass');
if (failCount > 0) {
  console.log('FAILURES: ' + failCount);
  process.exit(1);
} else {
  console.log('All sanity checks passed.');
}
