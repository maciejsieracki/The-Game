'use strict';

/**
 * Independent regression for R-MANPOWER-UZUPELNIENIE-HP-NIEZAPISUJE-Q1.
 * It models the live-unit handoff used by main.ts, then verifies that the
 * healed HP survives the same JSON snapshot boundary used by save/load.
 * Run from gra/: node tools/r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const entryName = '.r-manpower-uzupelnienie-hp-entry.ts';
const bundleName = '.r-manpower-uzupelnienie-hp-bundle.cjs';
const entry = path.join(__dirname, entryName);
const bundle = path.join(__dirname, bundleName);
fs.writeFileSync(entry, `
import { tickManpowerUnitReplenishment, syncLiveUnitHp } from '../src/game/manpower';
module.exports = { tickManpowerUnitReplenishment, syncLiveUnitHp };
`, 'utf8');
esbuild.buildSync({ entryPoints: [`./${entryName}`], absWorkingDir: __dirname, bundle: true, platform: 'node', format: 'cjs', outfile: bundleName, logLevel: 'silent' });
const { tickManpowerUnitReplenishment, syncLiveUnitHp } = require(bundle);

let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) { pass += 1; console.log(`OK ${message}`); }
  else { fail += 1; console.error(`FAIL ${message}`); }
}

const city = { id: 'c1', ownerId: 0, population: 10, manpower: 5000, q: 0, r: 0, oblegane: false };
const liveUnit = {
  id: 'u1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik',
  q: 3, r: 3, ruch: 2, ruchLeft: 2, hp: 10,
};

// This is intentionally the live array, exactly as passed from main.ts.
const result = tickManpowerUnitReplenishment(
  [city], [liveUnit], 'normal', () => 1, () => [], () => 100,
);
ok(result.healedCount === 1, 'runtime tick heals one unit');
ok(liveUnit.hp === 40, 'live RuntimeUnit receives +30 HP');
ok(city.manpower === 4700, 'Manpower is debited by 300');

// Save boundary: the live unit is what buildSaveGameSnapshot() serializes.
const loaded = JSON.parse(JSON.stringify({ units: [liveUnit], cities: [city] }));
ok(loaded.units[0].hp === 40, 'healed HP survives save JSON snapshot');
ok(loaded.cities[0].manpower === 4700, 'Manpower survives save JSON snapshot');
const callbackLiveUnit = { id: 'callback-live', hp: 10, hpMax: 100 };
syncLiveUnitHp([callbackLiveUnit], callbackLiveUnit.id, 40, 100);
ok(callbackLiveUnit.hp === 40 && callbackLiveUnit.hpMax === 100, 'callback zapisuje HP i hpMax do żywego RuntimeUnit');

const multiCity = { id: 'c2', ownerId: 0, population: 10, manpower: 100, q: 0, r: 0, oblegane: false };
const multiGarrison = { id: 'u2', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 0, r: 0, inGarnizon: true };
const multiField = { id: 'u3', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 8, r: 8 };
const multiResult = tickManpowerUnitReplenishment(
  [multiCity], [multiGarrison, multiField], 'normal', () => 1, () => [], () => 100,
);
ok(multiResult.healedCount === 2, 'proporcjonalny tick obejmuje wszystkie jednostki');
ok(multiGarrison.hp === 15 && multiField.hp === 15, 'ograniczony Manpower dzieli leczenie po równo');
ok(multiCity.manpower === 0, 'proporcjonalny tick wydaje całą dostępną pulę');

// Proporcja ma dotyczyć brakującego HP, nie kolejności tablicy: przy dwóch
// różnych maxHP każda jednostka dostaje połowę ograniczonej puli MP, więc
// większa jednostka odzyskuje proporcjonalnie więcej HP. Uruchamiamy identyczny
// stan w obu kolejnościach i porównujemy cały wynik domenowy.
const weightedTemplate = [
  { id: 'u4', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 9, r: 9 },
  { id: 'u5', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 20, hpMax: 200, q: 10, r: 10 },
];
function runWeighted(order, ownerId = 0) {
  const weightedCity = { id: 'c3', ownerId, population: 10, manpower: 300, q: 0, r: 0, oblegane: false };
  const weightedUnits = order.map(unit => ({ ...unit, ownerId }));
  const ownerEraCalls = [];
  const ownerBonusCalls = [];
  const weightedResult = tickManpowerUnitReplenishment(
    [weightedCity], weightedUnits, 'normal',
    (resolvedOwnerId) => { ownerEraCalls.push(resolvedOwnerId); return 1; },
    (resolvedOwnerId) => { ownerBonusCalls.push(resolvedOwnerId); return []; },
    (_typeId, unit) => unit?.hpMax ?? 100,
  );
  const byId = [...weightedUnits].sort((a, b) => a.id.localeCompare(b.id));
  return {
    hp: Object.fromEntries(byId.map(unit => [unit.id, unit.hp])),
    hpMax: Object.fromEntries(byId.map(unit => [unit.id, unit.hpMax])),
    manpower: weightedCity.manpower,
    healedCount: weightedResult.healedCount,
    totalMpSpent: weightedResult.totalMpSpent,
    ownerEraCalls,
    ownerBonusCalls,
  };
}
const weightedForward = runWeighted(weightedTemplate);
const weightedReverse = runWeighted([...weightedTemplate].reverse());
const weightedMajorAiForward = runWeighted(weightedTemplate, 1);
const weightedMajorAiReverse = runWeighted([...weightedTemplate].reverse(), 1);
const weightedDomain = ({ ownerEraCalls: _ownerEraCalls, ownerBonusCalls: _ownerBonusCalls, ...domain }) => domain;
ok(weightedForward.healedCount === 2, 'proporcjonalny tick leczy obie jednostki o różnym maxHP');
ok(weightedForward.hp.u4 === 25 && weightedForward.hp.u5 === 50, 'proporcjonalny tick dzieli MP wg niedoboru HP');
ok(weightedForward.manpower === 0 && weightedForward.totalMpSpent === 300,
  'proporcjonalny tick nie przekracza dostępnej puli MP');
ok(JSON.stringify(weightedForward) === JSON.stringify(weightedReverse),
  'proporcjonalny tick jest niezależny od kolejności jednostek');
console.log(`[owner-parity] ownerId=0 human ${JSON.stringify(weightedDomain(weightedForward))} vs ownerId=1 major-AI ${JSON.stringify(weightedDomain(weightedMajorAiForward))}`);
ok(weightedForward.ownerEraCalls.length === 1 && weightedForward.ownerEraCalls[0] === 0
  && weightedForward.ownerBonusCalls.length === 1 && weightedForward.ownerBonusCalls[0] === 0,
  'weighted path calls both owner resolvers for ownerId=0');
ok(weightedMajorAiForward.ownerEraCalls.length === 1 && weightedMajorAiForward.ownerEraCalls[0] === 1
  && weightedMajorAiForward.ownerBonusCalls.length === 1 && weightedMajorAiForward.ownerBonusCalls[0] === 1,
  'weighted path calls both owner resolvers for major-AI ownerId=1');
ok(JSON.stringify(weightedDomain(weightedForward)) === JSON.stringify(weightedDomain(weightedMajorAiForward)),
  'weighted result is identical for ownerId=0 and major-AI ownerId=1');
ok(JSON.stringify(weightedDomain(weightedReverse)) === JSON.stringify(weightedDomain(weightedMajorAiReverse)),
  'weighted reverse-order result remains identical for ownerId=0 and major-AI ownerId=1');

try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
console.log(`[r-manpower-uzupelnienie-hp-niezapisuje-q1-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
