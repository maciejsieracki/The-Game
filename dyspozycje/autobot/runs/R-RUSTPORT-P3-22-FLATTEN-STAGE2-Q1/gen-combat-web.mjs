// Generator grup WALKA/OBLEZENIE i AI (P3-22 etap 2, runda 4): URUCHAMIA kod TS weba (pin edb8fb56)
// tam, gdzie modul sie laduje w Node (siege, veteran, embarkation, siegeAi, ai-major-absorb,
// city-defense, combat). Wartosci z plikow JSON czyta przez loader (.json -> modul).
// game/ai.ts NIE laduje sie (brak pakietu 'three' w archiwum git) -> wiersze AI sa oznaczone
// jako ODCZYT_LITERALU (regex w weryfikatorze), NIE jako URUCHOMIONE.
// Uzycie (z katalogu runu, po git archive edb8fb56 gra/src gra/data do KORZENIA poza repo):
//   node --experimental-transform-types --import ./gen-loader-register.mjs ./gen-combat-web.mjs <KORZEN> <wyjscie.json>
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-combat-web.mjs <KORZEN> <wyjscie.json>');
  process.exit(2);
}
const url = (p) => pathToFileURL(`${root}/${p}`).href;

const siege = await import(url('gra/src/game/siege.ts'));
const veteran = await import(url('gra/src/game/veteran.ts'));
const embark = await import(url('gra/src/game/embarkation.ts'));
const siegeAi = await import(url('gra/src/game/siegeAi.ts'));
const absorb = await import(url('gra/src/game/ai-major-absorb.ts'));
const cityDef = await import(url('gra/src/game/city-defense.ts'));
const combatParams = (await import(url('gra/data/combat-params.json'))).default;
const miastoParams = (await import(url('gra/data/miasto-params.json'))).default;

const cityParams = {
  mur: miastoParams.bonus_obrona_mur_proc.wartosc,
  cytadela: miastoParams.bonus_obrona_cytadela_proc.wartosc,
  baszta: miastoParams.bonus_obrona_baszta_proc.wartosc,
  palisada: miastoParams.bonus_obrona_palisada_proc.wartosc,
};

const result = {
  zrodlo: 'uruchomiony kod TS weba (gen-combat-web.mjs) + odczyt JSON; game/ai.ts: NIE_URUCHOMIONE (brak pakietu three)',
  siege: {
    HILL_DEFENSE_MULT: siege.HILL_DEFENSE_MULT,
    MOUNTAIN_DEFENSE_MULT: siege.MOUNTAIN_DEFENSE_MULT,
    FORTIFY_OBRONA_BONUS: siege.FORTIFY_OBRONA_BONUS,
  },
  combat_params: {
    counter_multiplier: combatParams.counter_multiplier,
    fortify_obrona_proc: combatParams.oblężenie.fortify_obrona_proc,
    fortify_obrona_bonus: combatParams.oblężenie.fortify_obrona_bonus,
    siege_ai: { ...combatParams.siege_ai },
    brod: { ...combatParams.brod },
  },
  miasto_params: cityParams,
  veteran_bonus_frac: { ...veteran.VETERAN_BONUS_FRAC },
  embark_defense_mult: embark.EMBARK_DEFENSE_MULT,
  siege_ai: {
    SIEGE_AI_T1_ASSAULT_RATIO: siegeAi.SIEGE_AI_T1_ASSAULT_RATIO,
    SIEGE_AI_T2_BUILD_MIN_RATIO: siegeAi.SIEGE_AI_T2_BUILD_MIN_RATIO,
    SIEGE_AI_T3_STARVE_MIN_RATIO: siegeAi.SIEGE_AI_T3_STARVE_MIN_RATIO,
  },
  ai_major_absorb_power_ratio_min: absorb.AI_MAJOR_ABSORB_POWER_RATIO_MIN,
  // Probki struktury miejskiej: zestawy budynkow -> procent (web cityWallDefenseBonusPercent).
  city_wall_probe: [
    ['mury'],
    ['mury', 'fort'],
    ['mury', 'fort', 'baszta'],
    ['palisada'],
    ['baszta'],
    [],
  ].map((ids) => ({
    ids,
    procent: cityDef.cityWallDefenseBonusPercent(ids, cityParams),
  })),
};

writeFileSync(out, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(`ZAPISANO ${out}: city_probe=${result.city_wall_probe.length}, veteran=${Object.keys(result.veteran_bonus_frac).length}`);
