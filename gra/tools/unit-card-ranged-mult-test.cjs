'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const OUT = path.join(os.tmpdir(), `unit-card-ranged-mult-${process.pid}.cjs`);
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
const unitByName = new Map(units.map(unit => [unit.Jednostka, unit]));

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK ${message}`);
}

async function main() {
  await esbuild.build({
    stdin: {
      contents: `export { fieldPower, armyFieldPower, rangedDamageMultFor } from ${JSON.stringify(path.join(GRA, 'src/game/unit-power.ts'))};\nexport { unitCardCombatDisplay } from ${JSON.stringify(path.join(GRA, 'src/game/unit-card-stats.ts'))};`,
      resolveDir: GRA,
      sourcefile: 'unit-card-ranged-mult-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: OUT,
    logLevel: 'silent',
  });

  try {
    const { fieldPower, armyFieldPower, rangedDamageMultFor, unitCardCombatDisplay } = require(OUT);
    const rangedUnits = units.filter(unit => rangedDamageMultFor(unit) > 1);
    assert(rangedUnits.length === 8, 'exactly two Slinger and six foot Archer rows are classified for ranged multipliers');
    for (const unit of rangedUnits) {
      const card = unitCardCombatDisplay({
        atak: Number(unit.meleeAttack) || 0,
        obrona: Number(unit.meleeDefence) || 0,
        hpMax: Number(unit.health) || 0,
        pancerz: Number(unit.armor) || 0,
        weaponDamage: Number(unit.weaponDamage) || 0,
        piercing: Number(unit.piercing) || 0,
        chargeBonus: Number(unit.chargeBonus) || 0,
        missileAttack: Number(unit.missileAttack) || 0,
        Typ: unit.Typ,
        Jednostka: unit.Jednostka,
      }, null);
      const cardPower = fieldPower({
        meleeAttack: card.atakEffective,
        meleeDefence: card.obronaEffective,
        health: card.hpMaxEffective,
        armor: card.pancerzEffective,
        weaponDamage: card.weaponDamageEffective,
        piercing: card.piercingEffective,
        chargeBonus: card.chargeBonusEffective,
        missileAttack: card.missileAttackEffective,
        Typ: card.Typ,
        Jednostka: card.Jednostka,
      }).total;
      assert(card.rangedDamageMult === rangedDamageMultFor(unit), `${unit.Jednostka} card exposes ×${card.rangedDamageMult} projectile damage`);
      assert(cardPower === armyFieldPower(unit), `${unit.Jednostka} card field power ${cardPower} matches armyFieldPower`);
      assert(unit.fieldPower === cardPower, `${unit.Jednostka} units.json fieldPower ${unit.fieldPower} matches runtime`);
    }

    for (const name of ['Oszczepnik']) {
      const unit = unitByName.get(name);
      assert(rangedDamageMultFor(unit) === 1, `${name} keeps multiplier ×1`);
      assert(armyFieldPower(unit) === unit.fieldPower, `${name} keeps cached field power`);
    }
  } finally {
    fs.rmSync(OUT, { force: true });
  }
}

main().catch(error => { console.error(error); process.exit(1); });
