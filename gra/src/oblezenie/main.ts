/**
 * oblezenie/main.ts — podglad bitwy oblezniczej.
 * Wczytuje preset 'oblezenie' z testBattle.ts i uruchamia BattleScene
 * w trybie siege (mur + brama cywilizacji 'rzym').
 */
import { BattleScene } from '../battle/battleScene';
import { buildTestArmies } from '../battle/testBattle';
import { loadGameData } from '../data/loader';

function boot(): void {
  // Wczytaj dane gry (statyczny import — dostepne synchronicznie)
  const data = loadGameData();

  // Zbuduj armie z presetu 'oblezenie'
  const { attacker, defender, teren } = buildTestArmies(data.units as any[], 'oblezenie');

  // Uruchom BattleScene w trybie oblezniczym (siege=true, civ='rzym')
  const scene = new BattleScene({
    attacker,
    defender,
    teren,
    data,
    siege: { civ: 'rzym' },
    deploy: true,
  });

  scene.play((_res) => {
    // Bitwa zakonczona — HTML zostaje, nie robimy nic
    scene.dispose();
  });
}

// Uruchom po zaladowaniu DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
