'use strict';
// Behavioral receipt: matrix adapter -> resolveCombat -> defender HP/result.
// Run from gra/: node tools/pr141-combat-defense-behavior-test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-combat-defense-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
 export { resolveCombat } from ${JSON.stringify(path.join(root, 'src/game/combat'))};
 export { civMatrixBonusyForCivKey, } from ${JSON.stringify(path.join(root, 'src/game/civ-bonuses'))};
`);
let G;
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
  G = require(bundle);
} finally { fs.rmSync(entry, { force: true }); }

const attacker = { typNazwa: 'Wojownik', counterTyp: 'Piechota', rola: 'Wrecz', meleeAttack: 30, meleeDefence: 4, weaponDamage: 20, armor: 0, piercing: 0, chargeBonus: 0, health: 100, 'Prog dezercji (% health)': 0 };
const infantry = { ...attacker, meleeAttack: 4, meleeDefence: 20, weaponDamage: 4 };
const naval = { ...infantry, typNazwa: 'Galera', rola: 'Morska', counterTyp: 'Naval' };
const cases = [
  { id: 'walka_obrona_morska', civ: 'grecy', foreignCiv: 'rzymianie', unit: naval, wrongUnit: infantry, ctx: {}, badCtx: { shallowSea: true } },
  { id: 'walka_obrona_piechota_teren_las', civ: 'slowianie', foreignCiv: 'grecy', unit: infantry, wrongUnit: naval, ctx: { defenderTerrain: 'las' }, badCtx: { defenderTerrain: 'rownina' } },
  { id: 'walka_obrona_piechota_terytorium_wlasne', civ: 'harappa', foreignCiv: 'grecy', unit: infantry, wrongUnit: naval, ctx: { defenderOwnTerritory: true }, badCtx: { defenderOwnTerritory: false } },
  { id: 'walka_obrona_piechota_w_murze', civ: 'hetyci', foreignCiv: 'grecy', unit: infantry, wrongUnit: naval, ctx: { defenderOnWallWalkway: true }, badCtx: { defenderOnWallWalkway: false } },
  { id: 'walka_obrona_piechota_teren_plytkie_morze', civ: 'grecy', foreignCiv: 'rzymianie', unit: infantry, wrongUnit: naval, ctx: { shallowSea: true, defenderTerrain: 'plytkie_morze' }, badCtx: { shallowSea: false, defenderTerrain: 'rownina' } },
];
const baseOpts = { rng: () => 0.48, maxRounds: 1, attackerMoved: false };
const run = (def, bonusy, extra = {}) => G.resolveCombat(attacker, def, { ...baseOpts, defenderCivBonusy: bonusy, ...extra });
const runWrongSide = (def, bonusy, extra = {}) => G.resolveCombat(attacker, def, { ...baseOpts, attackerCivBonusy: bonusy, ...extra });
let checks = 0;
for (const c of cases) {
  const adapted = G.civMatrixBonusyForCivKey(c.civ).filter(b => b.matrixParamId === c.id);
  assert.equal(adapted.length, 1, `${c.id}: exact adapter row exists for selected civilization`); checks++;
  const val = adapted[0].wartosc;
  assert.ok(val > 0, `${c.id}: selected current matrix value is positive`); checks++;
  const foreignAdapter = G.civMatrixBonusyForCivKey(c.foreignCiv).filter(b => b.matrixParamId === c.id);
  assert.equal(foreignAdapter.length, 0, `${c.id}: foreign owner ${c.foreignCiv} has no active value for this field`); checks++;
  const baseline = run(c.unit, [], c.ctx);
  const positive = run(c.unit, adapted, c.ctx);
  assert.ok(positive.defenderHpLeft > baseline.defenderHpLeft, `${c.id}: real combat leaves defender with more HP under correct defense context`); checks++;
  const foreignOwner = run(c.unit, foreignAdapter, c.ctx);
  assert.equal(foreignOwner.defenderHpLeft, baseline.defenderHpLeft, `${c.id}: foreign owner row leaves defender outcome at baseline`);
  assert.equal(foreignOwner.attackerHpLeft, baseline.attackerHpLeft, `${c.id}: foreign owner row leaves attacker outcome at baseline`); checks += 2;
  if (c.id !== 'walka_obrona_morska') {
    const badContext = run(c.unit, adapted, c.badCtx);
    assert.equal(badContext.defenderHpLeft, baseline.defenderHpLeft, `${c.id}: wrong context suppresses defender protection`);
    assert.equal(badContext.attackerHpLeft, baseline.attackerHpLeft, `${c.id}: wrong context leaves attacker outcome at baseline`); checks += 2;
  } else { checks++; console.log(`${c.id}: no terrain gate in contract; wrong-context probe omitted, wrong unit and side controls retained`); }
  const wrongUnit = run(c.wrongUnit, adapted, c.ctx);
  const wrongUnitBaseline = run(c.wrongUnit, [], c.ctx);
  assert.equal(wrongUnit.defenderHpLeft, wrongUnitBaseline.defenderHpLeft, `${c.id}: wrong unit category suppresses defender protection`);
  assert.equal(wrongUnit.attackerHpLeft, wrongUnitBaseline.attackerHpLeft, `${c.id}: wrong unit category leaves attacker outcome at baseline`); checks += 2;
  const wrongSide = runWrongSide(c.unit, adapted, c.ctx);
  assert.equal(wrongSide.defenderHpLeft, baseline.defenderHpLeft, `${c.id}: defender bonus is not applied from attacker-side adapter input`);
  assert.equal(wrongSide.attackerHpLeft, baseline.attackerHpLeft, `${c.id}: attacker-side input does not alter the tested defender bonus result`); checks += 2;
  console.log(`${c.id}: owner=${c.civ}/${val}; foreign=${c.foreignCiv}/0; baseline HP=${baseline.attackerHpLeft}/${baseline.defenderHpLeft}; positive HP=${positive.attackerHpLeft}/${positive.defenderHpLeft}; controls checked`);
}
console.log(`PASS: ${checks} behavioral assertions; fixed RNG=0.48; resolveCombat adapter-to-mitigation`);
