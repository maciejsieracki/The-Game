// R-WEB-UI-BATTLE-3D-SIDE-COLORS-BLUE-RED-Q1 — wejscie przegladarkowe testu na zywo kolorow stron 3D.
// Buduje PRAWDZIWA BattleScene (preset bitwa_duza_pole) z rola gracza z query ?role=atk|def
// (deployPlayerSide), tak jak robi to mapFieldBattle.ts / main.ts. Test czyta graf THREE i zrzuty.
import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const params = new URLSearchParams(window.location.search);
const role: 'atk' | 'def' = params.get('role') === 'def' ? 'def' : 'atk';
// legacy=1: odtwarza stare wywolanie mapFieldBattle.ts (bez deployPlayerSide) — kontrola negatywna zarzutu 1
const legacy = params.get('legacy') === '1';
const armies = buildTestArmies(units, 'bitwa_duza_pole');
const scene = new BattleScene({
  attacker: armies.attacker,
  defender: armies.defender,
  teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym',
  defenderCivLabel: 'Grecja',
  deploy: true,
  ...(legacy ? {} : { deployPlayerSide: role }),
} as any);
scene.play(() => {});
(window as any).__sc = { scene, role, ready: true };
