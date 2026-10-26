'use strict';

/**
 * R-WEB-WAR-EPOCH-PLAYER-FIRST-Q1 — tekstowa bramka wiązania (main.ts, newGameFlow.ts,
 * ui-params.json, forced-war-common.ts, war-rules-multiwar.ts). Czysty moduł testuje
 * war-epoch-player-first-test.cjs; ta bramka pinuje wiązanie asercjami źródłowymi i
 * MUTACJAMI: każda mutacja kluczowego wiązania musi dać FAIL, inaczej bramka jest tautologiczna.
 *
 * Uruchamianie z gra/: node tools/war-epoch-player-first-main-guard-test.cjs
 */

const fs = require('fs');
const path = require('path');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const SRC = {
  main: read('src/main.ts'),
  newgame: read('src/ui/newGameFlow.ts'),
  uiParams: read('data/ui-params.json'),
  common: read('src/game/forced-war-common.ts'),
  multiwar: read('src/game/war-rules-multiwar.ts'),
};

const GUARDS = {
  importFlag: [
    'main.ts: import isWarEpochPlayerFirstEnabled',
    s => s.main.includes("  isWarEpochPlayerFirstEnabled,\n"),
  ],
  playerFirstWiring: [
    'main.ts: playerFirst przekazany do assignForcedWarPairings (flaga ON)',
    s => /const forcedWarPlayerFirstOpt = isWarEpochPlayerFirstEnabled\(\) \? \{\s*playerFirst: \{\s*playerOwnerId: 0,/.test(s.main) && /\.\.\.forcedWarPlayerFirstOpt,/.test(s.main),
  ],
  aiGateForPlayerPair: [
    'main.ts: bramka R1/R2 po stronie AI dla pary gracza (targetIsPlayer: true)',
    s => /isPlayerPairGateOpen: \(aiOwnerId: number\): boolean =>\s*evaluateInterCivWarGate\(\{[\s\S]*?targetIsPlayer: true,[\s\S]*?\}, WAR_RULES_PARAMS\) === 'ok'/.test(s.main),
  ],
  playerInPoolOnlyWhenOption: [
    'main.ts: gracz wypada z puli gdy opcja K2 OFF (flaga ON)',
    s => /if \(isWarEpochPlayerFirstEnabled\(\) && !playerEpochWarEnabled\) \{\s*for \(let ti[\s\S]*?ownerId === 0\) triggeredSubjects\.splice/.test(s.main),
  ],
  fogBypassK1: [
    'main.ts: K1 wpis relacji AI->gracz poza mgłą (para z graczem, bez odkrycia)',
    s => /isWarEpochPlayerFirstEnabled\(\)\s*&&\s*!diplomaticallyDiscoveredOwnersSet\(\)\.has\(ownerId\)\s*&&\s*forcedWarAssignmentByOwner\.get\(ownerId\)\?\.targetId === 0/.test(s.main),
  ],
  waveZ5Gate: [
    'main.ts: Z5 fala na epokę w bramce deklaracji (pending > 0)',
    s => /isWarEpochPlayerFirstEnabled\(\) && forcedEraPendingCount\(gateForcedTag\) > 0\)\) \{/.test(s.main),
  ],
  saveMetaFlagged: [
    'main.ts: zapis meta.playerEpochWarEnabled tylko przy fladze ON',
    s => /\.\.\.\(isWarEpochPlayerFirstEnabled\(\) \? \{ playerEpochWarEnabled \} : \{\}\),/.test(s.main),
  ],
  startDefaultOn: [
    'main.ts: doStartGame ustawia opcję z params (domyślnie ON)',
    s => /playerEpochWarEnabled = params\.playerEpochWarEnabled \?\? true;/.test(s.main),
  ],
  loadOldSaveOff: [
    'main.ts: odczyt — stary zapis (brak pola) = WYŁĄCZONA',
    s => /playerEpochWarEnabled = \(saved\.meta\?\.playerEpochWarEnabled as boolean \| undefined\) === true;/.test(s.main),
  ],
  newGameParam: [
    'newGameFlow.ts: parametr playerEpochWarEnabled z ustawienia player_epoch_war',
    s => /playerEpochWarEnabled: settingValue\('player_epoch_war'\) !== 'Wyłączona',/.test(s.newgame),
  ],
  newGameRow: [
    'newGameFlow.ts: wiersz player_epoch_war w ekranie nowej gry',
    s => /'deals_end_turn_gate', 'player_epoch_war',/.test(s.newgame),
  ],
  uiParamsOption: [
    'ui-params.json: opcja player_epoch_war, domyślnie Włączona (domyslny 0)',
    s => /"key": "player_epoch_war"[\s\S]*?"domyslny": 0/.test(s.uiParams) && /"Włączona",\s*"Wyłączona"/.test(s.uiParams),
  ],
  playerFirstInCommon: [
    'forced-war-common.ts: gracz pierwszy (playerFirstPartnerId) z wpisem assignments',
    s => /if \(playerFirst && playerFirstPartnerId !== null\)/.test(s.common),
  ],
  multiwarFlagAndWave: [
    'war-rules-multiwar.ts: flaga WAR_EPOCH_PLAYER_FIRST_ENABLED i fala (eraWaveInProgress)',
    s => /export const WAR_EPOCH_PLAYER_FIRST_ENABLED = true;/.test(s.multiwar) && /if \(eraWaveInProgress\) return true;/.test(s.multiwar),
  ],
};

let passed = 0;
let failed = 0;

for (const [key, [name, fn]] of Object.entries(GUARDS)) {
  if (fn(SRC)) passed++;
  else { failed++; console.error(`FAIL [baza]: ${name}`); }
}

// Mutacje: każda podmiana kluczowego fragmentu MUSI wywalić wskazaną bramkę.
const MUTATIONS = [
  ['playerFirst wyłączony', 'main', 'playerOwnerId: 0,\n                isPlayerPairGateOpen', 'playerOwnerId: -1,\n                isPlayerPairGateOpen', 'playerFirstWiring'],
  ['bramka R1/R2 gracza zdjęta', 'main', 'targetIsPlayer: true,', 'targetIsPlayer: false,', 'aiGateForPlayerPair'],
  ['opcja K2 zignorowana w puli', 'main', 'if (isWarEpochPlayerFirstEnabled() && !playerEpochWarEnabled) {', 'if (false) {', 'playerInPoolOnlyWhenOption'],
  ['bypass mgły K1 usunięty', 'main', "&& !diplomaticallyDiscoveredOwnersSet().has(ownerId)\n                && forcedWarAssignmentByOwner", "&& forcedWarAssignmentByOwner", 'fogBypassK1'],
  ['fala Z5 wyłączona w bramce', 'main', 'isWarEpochPlayerFirstEnabled() && forcedEraPendingCount(gateForcedTag) > 0)) {', 'false) {', 'waveZ5Gate'],
  ['zapis opcji bez flagi', 'main', '...(isWarEpochPlayerFirstEnabled() ? { playerEpochWarEnabled } : {}),', '...{ playerEpochWarEnabled },', 'saveMetaFlagged'],
  ['nowa gra domyślnie OFF', 'main', 'playerEpochWarEnabled = params.playerEpochWarEnabled ?? true;', 'playerEpochWarEnabled = params.playerEpochWarEnabled ?? false;', 'startDefaultOn'],
  ['stary zapis = ON', 'main', 'playerEpochWarEnabled = (saved.meta?.playerEpochWarEnabled as boolean | undefined) === true;', 'playerEpochWarEnabled = (saved.meta?.playerEpochWarEnabled as boolean | undefined) !== false;', 'loadOldSaveOff'],
  ['parametr nowej gry usunięty', 'newgame', "playerEpochWarEnabled: settingValue('player_epoch_war') !== 'Wyłączona',", '', 'newGameParam'],
  ['wiersz ekranu usunięty', 'newgame', "'deals_end_turn_gate', 'player_epoch_war',", "'deals_end_turn_gate',", 'newGameRow'],
  ['gracz nie-pierwszy w common', 'common', 'if (playerFirst && playerFirstPartnerId !== null)', 'if (false)', 'playerFirstInCommon'],
  ['fala usunięta w multiwar', 'multiwar', 'if (eraWaveInProgress) return true;', '', 'multiwarFlagAndWave'],
];

for (const [label, part, from, to, guardKey] of MUTATIONS) {
  if (!GUARDS[guardKey]) { failed++; console.error(`FAIL [brak bramki]: ${label}`); continue; }
  if (!SRC[part].includes(from)) { failed++; console.error(`FAIL [mutacja nieaplikowana]: ${label}`); continue; }
  const mutSrc = { ...SRC, [part]: SRC[part].replace(from, to) };
  const [name, fn] = GUARDS[guardKey];
  if (fn(mutSrc)) { failed++; console.error(`FAIL [mutacja przeszła bramkę]: ${label} -> ${name}`); }
  else passed++;
}

console.log(`war-epoch-player-first-main-guard-test: ${passed} pass / ${failed} fail`);
if (failed > 0) process.exit(1);
