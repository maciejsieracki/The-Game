import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const siege = new URLSearchParams(location.search).has('siege');
const preset = siege ? 'oblezenie_duze' : 'bitwa_duza_pole';
const armies = buildTestArmies(units, preset);
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
