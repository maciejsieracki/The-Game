/**
 * oblezenie/main.ts — standalone POLE-BITWY bundle (testBattle presets + BattleScene).
 * Build: npx vite build --config vite.oblezenie-bitwa.config.ts → Gra-podglad-POLE-BITWY.html
 *
 * Query: ?preset=maciej_playtest&siege=0&deploy=1  (pole — bez muru)
 *        ?siege=1&deploy=1                         (oblężenie — domyślnie preset oblezenie)
 *
 * DANE: units.json z bundla Vite (loadGameData). Po każdej zmianie statów w gra/data/
 *       przebuduj: cd gra && npx vite build --config vite.oblezenie-bitwa.config.ts
 *       (publish-robocza-snapshot.ps1 robi to automatycznie od 2026-07-05)
 */
import { loadGameData } from '../data/loader';
import { BattleScene } from '../battle/battleScene';
import { buildTestArmies, DEFAULT_PRESET, ensureSiegeMachines, type PresetName } from '../battle/testBattle';

const PRESET_NAMES = new Set<PresetName>([
  'maly', 'duzy', 'rzym_grecja', 'konnica', 'oblezenie', 'maciej_playtest',
]);

function parsePreset(raw: string | null, siegeOn: boolean): PresetName {
  if (raw && PRESET_NAMES.has(raw as PresetName)) return raw as PresetName;
  if (siegeOn) return 'oblezenie';
  return DEFAULT_PRESET;
}

function boot(): void {
  const params = new URLSearchParams(location.search);
  const siegeOn = params.get('siege') !== '0';
  const preset = parsePreset(params.get('preset'), siegeOn);
  const deployOn = params.get('deploy') !== '0';

  const data = loadGameData();
  let armies = buildTestArmies(data.units, preset);
  if (siegeOn) armies = ensureSiegeMachines(armies, data.units);

  if (typeof console !== 'undefined' && console.info) {
    const sample = data.units.find((u: { Jednostka?: string }) => u.Jednostka === 'Hastati') as Record<string, unknown> | undefined;
    const hp = sample?.health ?? sample?.Health ?? '?';
    const ap = sample?.meleeAttack ?? sample?.Atak ?? '?';
    console.info(
      `[POLE-BITWY] units.json z bundla (Hastati HP=${hp}, AP=${ap}). `
      + 'Po zmianie statów: npx vite build --config vite.oblezenie-bitwa.config.ts',
    );
  }

  const scene = new BattleScene({
    attacker: armies.attacker,
    defender: armies.defender,
    teren: armies.teren,
    data,
    deploy: deployOn,
    siege: siegeOn ? { civ: 'rzym', defCiv: 'grecja' } : undefined,
    attackerCivLabel: armies.attackerCivLabel,
    defenderCivLabel: armies.defenderCivLabel,
    attackerCivIconId: armies.attackerCivIconId,
    defenderCivIconId: armies.defenderCivIconId,
  });

  scene.play(() => scene.dispose());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
