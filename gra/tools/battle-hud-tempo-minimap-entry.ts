// R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1 r2 — wejscie przegladarkowe testu na zywo.
// Buduje PRAWDZIWA BattleScene na presecie bitwa_duza_pole (bez stubow UI). Test steruje nia
// przez realne klikniecia myszy w przyciski Tempo i w minimapa.
import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const armies = buildTestArmies(units, 'bitwa_duza_pole');
const scene = new BattleScene({
  attacker: armies.attacker,
  defender: armies.defender,
  teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym',
  defenderCivLabel: 'Grecja',
} as any);
scene.play(() => {});
(window as any).__tempo = { scene, ready: true };
