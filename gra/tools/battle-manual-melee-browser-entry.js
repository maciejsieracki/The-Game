import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const armies = buildTestArmies(units, 'bitwa_duza_pole');
// The large preset's Hastati throw pila and are therefore rangedBase, so they
// cannot represent plain melee infantry in this specific regression. Replace
// their ten front-line slots on each side with the real Stone Age Warrior row;
// BattleScene derives every runtime role from those production stats normally.
const plainWarrior = units.find(row => row['Jednostka'] === 'Wojownik');
if (!plainWarrior) throw new Error('Production units data has no plain Wojownik row');
const warriorHp = Math.max(1, Math.round(Number(plainWarrior.health ?? plainWarrior.Health ?? 10)));
for (const side of [armies.attacker, armies.defender]) {
  for (let i = 0; i < Math.min(10, side.length); i++) {
    side[i] = { ...side[i], nazwa: plainWarrior['Nazwa EN'] ?? plainWarrior['Jednostka'],
      kategoria: 'domyslny', stats: plainWarrior, hp: warriorHp, maxHp: warriorHp };
  }
}
const scene = new BattleScene({
  attacker: armies.attacker,
  defender: armies.defender,
  teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym',
  defenderCivLabel: 'Grecja',
});
scene.renderer.setPixelRatio(0.1);
scene.play(() => {});
window.__meleeBrowserBattle = { scene, rosterLabel: armies.label, ready: true };
