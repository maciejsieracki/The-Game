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

// Tekst HTML tooltipa/karty (hexContextTooltip.ts): wymaga Vite SSR, bo modul
// używa importów ?raw i import.meta.glob, których nie obsługuje esbuild.
async function checkTooltipText() {
  const { createServer } = require(path.resolve(GRA, 'node_modules', 'vite'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const server = await createServer({ root: GRA, configFile: false, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' });
  try {
    const stats = await server.ssrLoadModule('/src/game/unit-card-stats.ts');
    const tip = await server.ssrLoadModule('/src/ui/hexContextTooltip.ts');
    const expectations = [
      { name: 'Procarz', mult: 3, power: 16 },
      { name: 'Łucznik asyryjski', mult: 2, power: 19 },
    ];
    for (const { name, mult, power } of expectations) {
      const unit = unitByName.get(name);
      const combat = stats.unitCardCombatDisplay({
        atak: Number(unit.meleeAttack) || 0, obrona: Number(unit.meleeDefence) || 0,
        hpMax: Number(unit.health) || 0, pancerz: Number(unit.armor) || 0,
        weaponDamage: Number(unit.weaponDamage) || 0, piercing: Number(unit.piercing) || 0,
        chargeBonus: Number(unit.chargeBonus) || 0, missileAttack: Number(unit.missileAttack) || 0,
        Typ: unit.Typ, Jednostka: unit.Jednostka,
      }, null);
      const base = {
        displayName: unit.Jednostka, q: 0, r: 0, ruchLeft: 3, ruchMax: 4, combat, hp: combat.hpMaxEffective,
        category: unit.Typ, inGarnizon: false, readOnly: true, ownerLabel: 'Test', relationLabel: '',
        zasieg: unit.range ?? 1, ownerEmblemHtml: '', esc,
      };
      const compact = tip.buildUnitContextTooltipHtml({ ...base, expanded: false });
      const expanded = tip.buildUnitContextTooltipHtml({ ...base, expanded: true });
      const powerMatch = compact.match(/Moc pola<\/span><span class="sp-unit-forces-v">([^<]*)<\/span>/);
      assert(powerMatch && powerMatch[1].endsWith(`Razem ${power}`), `${name} tooltip "Moc pola" shows Razem ${power}`);
      assert(expanded.includes(`×${mult} obrażeń pocisku`), `${name} expanded card renders "×${mult} obrażeń pocisku"`);
    }
    const oszczepnik = unitByName.get('Oszczepnik');
    const plainCombat = stats.unitCardCombatDisplay({
      atak: Number(oszczepnik.meleeAttack) || 0, obrona: Number(oszczepnik.meleeDefence) || 0,
      hpMax: Number(oszczepnik.health) || 0, pancerz: Number(oszczepnik.armor) || 0,
      weaponDamage: Number(oszczepnik.weaponDamage) || 0, piercing: Number(oszczepnik.piercing) || 0,
      chargeBonus: Number(oszczepnik.chargeBonus) || 0, missileAttack: Number(oszczepnik.missileAttack) || 0,
      Typ: oszczepnik.Typ, Jednostka: oszczepnik.Jednostka,
    }, null);
    const plainHtml = tip.buildUnitContextTooltipHtml({
      displayName: oszczepnik.Jednostka, q: 0, r: 0, ruchLeft: 3, ruchMax: 4, combat: plainCombat, hp: plainCombat.hpMaxEffective,
      category: oszczepnik.Typ, inGarnizon: false, readOnly: true, ownerLabel: 'Test', relationLabel: '',
      zasieg: oszczepnik.range ?? 1, ownerEmblemHtml: '', esc, expanded: true,
    });
    assert(!plainHtml.includes('obrażeń pocisku'), 'Oszczepnik expanded card has no "obrażeń pocisku" suffix');
  } finally {
    await server.close();
  }
}

main()
  .then(checkTooltipText)
  .catch(error => { console.error(error); process.exit(1); });
