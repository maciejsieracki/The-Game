import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const siege = new URLSearchParams(location.search).has('siege');
const preset = siege ? 'oblezenie_duze' : 'bitwa_duza_pole';
const armies = buildTestArmies(units, preset);
const plainWarrior = units.find(row => row['Jednostka'] === 'Wojownik');
if (!plainWarrior) throw new Error('Production unit data has no plain Wojownik row');
for (const side of [armies.attacker, armies.defender]) {
  for (let i = 0; i < Math.min(10, side.length); i++) {
    side[i] = { ...side[i], nazwa: plainWarrior['Nazwa EN'] ?? plainWarrior['Jednostka'],
      kategoria: 'domyslny', stats: plainWarrior,
      hp: Math.max(1, Math.round(Number(plainWarrior.health ?? plainWarrior.Health ?? 10))),
      maxHp: Math.max(1, Math.round(Number(plainWarrior.health ?? plainWarrior.Health ?? 10))) };
  }
}
if (siege) {
  const catapult = units.find(row => row['Jednostka'] === 'Katapulta');
  if (!catapult) throw new Error('Production unit data has no Katapulta row');
  armies.defender.push({
    id: 'audit-defender-catapult', nazwa: 'Katapulta', kategoria: 'obleznicza',
    ownerColor: 0x884444, stats: catapult, hp: 1, maxHp: 1,
  });
}
const opts = {
  attacker: armies.attacker,
  defender: armies.defender,
  teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym',
  defenderCivLabel: 'Grecja',
  ...(siege ? { siege: { defCiv: 'grecy' as const, builtBuildingIds: ['mury'] } } : {}),
};
const scene = new BattleScene(opts);
scene.renderer.setPixelRatio(0.1);
scene.play(() => {});
window.__deadUnitBrowser = { scene, ready: true, siege };
