'use strict';

/**
 * R-WEB-WAR-EPOCH-PLAYER-FIRST-Q1 — tekstowa bramka wiązania (main.ts, newGameFlow.ts,
 * ui-params.json, forced-war-common.ts, war-rules-multiwar.ts). Czysty moduł testuje
 * war-epoch-player-first-test.cjs; ta bramka pinuje wiązanie asercjami źródłowymi i
 * MUTACJAMI: każda mutacja kluczowego wiązania musi dać FAIL, inaczej bramka jest tautologiczna.
 * Runda 2 (D1-D4): partner z WSZYSTKICH major AI (candidates), kolejność AI z partnerem gracza
 * na czele (D2), bypass R3 ze snapshotu przydziałów, wiersz K2 zawsze widoczny (D3).
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
    s => s.main.includes('  isWarEpochPlayerFirstEnabled,\n'),
  ],
  playerFirstWiring: [
    'main.ts: playerFirst przekazany do assignForcedWarPairings (flaga ON)',
    s => /const forcedWarPlayerFirstOpt = isWarEpochPlayerFirstEnabled\(\) \? \{\s*playerFirst: \{\s*playerOwnerId: 0,/.test(s.main) && /\.\.\.forcedWarPlayerFirstOpt,/.test(s.main),
  ],
  aiGateForPlayerPair: [
    'main.ts: bramka R1/R2 po stronie AI dla pary gracza (targetIsPlayer: true)',
    s => /isPlayerPairGateOpen: \(aiOwnerId: number\): boolean =>\s*evaluateInterCivWarGate\(\{[\s\S]*?targetIsPlayer: true,[\s\S]*?\}, WAR_RULES_PARAMS\) === 'ok'/.test(s.main),
  ],
  candidatesAllMajors: [
    'main.ts: kandydaci na partnera gracza = WSZYSCY major AI (nie tylko pula)',
    s => /candidates: aiOwnerList\.flatMap\(\(oid\): ForcedWarPairingSubject\[\] => \{/.test(s.main),
  ],
  candidatesInCommon: [
    'forced-war-common.ts: partner wybierany z candidates (fallback pula)',
    s => /const pool = \(playerFirst\.candidates \?\? warlessAll\)/.test(s.common),
  ],
  leadFirstInLoop: [
    'main.ts: petla AI zaczyna od partnera gracza (D2), wznowienie = zapisana lista',
    s => /const ownerLoopList: number\[\] = aiOwnerListResumed \?\? \(\(\) => \{\s*const lead = forcedWarPairingResult\.playerFirstPartnerId;[\s\S]*?return \[lead, \.\.\.aiOwnerList\.filter\(oid => oid !== lead\)\];/.test(s.main)
      && /ownerLoop: for \(let oi = startOi; oi < ownerLoopList\.length; oi\+\+\) \{\s*const ownerId = ownerLoopList\[oi\]!;/.test(s.main)
      && /ownerList: ownerLoopList,/.test(s.main),
  ],
  playerInPoolOnlyWhenOption: [
    'main.ts: gracz wypada z puli gdy opcja K2 OFF (flaga ON)',
    s => /if \(isWarEpochPlayerFirstEnabled\(\) && !playerEpochWarEnabled\) \{\s*for \(let ti[\s\S]*?ownerId === 0\) triggeredSubjects\.splice/.test(s.main),
  ],
  fogBypassK1: [
    'main.ts: K1 wpis relacji AI->gracz poza mgla (para z graczem, bez odkrycia)',
    s => /isWarEpochPlayerFirstEnabled\(\)\s*&&\s*!diplomaticallyDiscoveredOwnersSet\(\)\.has\(ownerId\)\s*&&\s*forcedWarAssignmentByOwner\.get\(ownerId\)\?\.targetId === 0/.test(s.main),
  ],
  waveSnapshotR3: [
    'main.ts: Z5/D2 bypass R3 ze SNAPSHOTU przydzialow (bez zywego pending)',
    s => /const waveActorBypassR3 = gateForcedTag !== null\s*&& isWarEpochPlayerFirstEnabled\(\)\s*&& forcedWarAssignmentByOwner\.get\(ownerId\)\?\.era === gateForcedTag;/.test(s.main),
  ],
  saveMetaFlagged: [
    'main.ts: zapis meta.playerEpochWarEnabled tylko przy fladze ON',
    s => /\.\.\.\(isWarEpochPlayerFirstEnabled\(\) \? \{ playerEpochWarEnabled \} : \{\}\),/.test(s.main),
  ],
  startDefaultOn: [
    'main.ts: doStartGame ustawia opcje z params (domyslnie ON)',
    s => /playerEpochWarEnabled = params\.playerEpochWarEnabled \?\? true;/.test(s.main),
  ],
  loadOldSaveOff: [
    'main.ts: odczyt — stary zapis (brak pola) = WYLACZONA',
    s => /playerEpochWarEnabled = \(saved\.meta\?\.playerEpochWarEnabled as boolean \| undefined\) === true;/.test(s.main),
  ],
  newGameParam: [
    'newGameFlow.ts: parametr playerEpochWarEnabled z ustawienia player_epoch_war',
    s => /playerEpochWarEnabled: settingValue\('player_epoch_war'\) !== 'Wyłączona',/.test(s.newgame),
  ],
  newGameRow: [
    'newGameFlow.ts: wiersz player_epoch_war ZAWSZE w ekranie nowej gry (D3)',
    s => /'deals_end_turn_gate',[\s\S]*?\n\s*'player_epoch_war',\n\s*\]\);/.test(s.newgame)
      && !/isWarEpochPlayerFirstEnabled\(\) \? \['player_epoch_war'\]/.test(s.newgame),
  ],
  uiParamsOption: [
    'ui-params.json: opcja player_epoch_war, domyslnie Włączona (domyslny 0)',
    s => /"key": "player_epoch_war"[\s\S]*?"domyslny": 0/.test(s.uiParams) && /"Włączona",\s*"Wyłączona"/.test(s.uiParams),
  ],
  playerFirstInCommon: [
    'forced-war-common.ts: gracz pierwszy (partner z wpisem assignments) + playerFirstPartnerId w wyniku',
    s => /if \(playerFirst && playerFirstPartnerId !== null && playerFirstPartner !== null\)/.test(s.common)
      && /return \{ assignments, unresolvedOwnerIds, playerFirstPartnerId \};/.test(s.common),
  ],
  multiwarFlagAndWave: [
    'war-rules-multiwar.ts: flaga WAR_EPOCH_PLAYER_FIRST_ENABLED, brak martwego parametru eraWaveInProgress',
    s => /export const WAR_EPOCH_PLAYER_FIRST_ENABLED = true;/.test(s.multiwar) && !/eraWaveInProgress/.test(s.multiwar),
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
  ['kandydaci ograniczeni do pustej listy (partner nie z wszystkich AI)', 'main', 'candidates: aiOwnerList.flatMap((oid): ForcedWarPairingSubject[] => {', 'candidates: aiOwnerList.filter(() => false).flatMap((oid): ForcedWarPairingSubject[] => {', 'candidatesAllMajors'],
  ['partner ograniczony do puli warless (mutacja w common)', 'common', 'const pool = (playerFirst.candidates ?? warlessAll)', 'const pool = (warlessAll)', 'candidatesInCommon'],
  ['kolejnosc: AI przed graczem (mutacja D2)', 'main', 'return [lead, ...aiOwnerList.filter(oid => oid !== lead)];', 'return aiOwnerList;', 'leadFirstInLoop'],
  ['opcja K2 zignorowana w puli', 'main', 'if (isWarEpochPlayerFirstEnabled() && !playerEpochWarEnabled) {', 'if (false) {', 'playerInPoolOnlyWhenOption'],
  ['bypass mgly K1 usuniety', 'main', '&& !diplomaticallyDiscoveredOwnersSet().has(ownerId)\n                && forcedWarAssignmentByOwner', '&& forcedWarAssignmentByOwner', 'fogBypassK1'],
  ['bypass R3 z zywego licznika pending (mutacja D2)', 'main', '&& forcedWarAssignmentByOwner.get(ownerId)?.era === gateForcedTag;', '&& forcedWarAssignmentByOwner.get(ownerId)?.era === gateForcedTag && stoneForceWarPendingOwners.size > 0;', 'waveSnapshotR3'],
  ['zapis opcji bez flagi', 'main', '...(isWarEpochPlayerFirstEnabled() ? { playerEpochWarEnabled } : {}),', '...{ playerEpochWarEnabled },', 'saveMetaFlagged'],
  ['nowa gra domyslnie OFF', 'main', 'playerEpochWarEnabled = params.playerEpochWarEnabled ?? true;', 'playerEpochWarEnabled = params.playerEpochWarEnabled ?? false;', 'startDefaultOn'],
  ['stary zapis = ON', 'main', 'playerEpochWarEnabled = (saved.meta?.playerEpochWarEnabled as boolean | undefined) === true;', 'playerEpochWarEnabled = (saved.meta?.playerEpochWarEnabled as boolean | undefined) !== false;', 'loadOldSaveOff'],
  ['parametr nowej gry usuniety', 'newgame', "playerEpochWarEnabled: settingValue('player_epoch_war') !== 'Wyłączona',", '', 'newGameParam'],
  ['wiersz ekranu usuniety', 'newgame', "    'player_epoch_war',\n", '', 'newGameRow'],
  ['wiersz ekranu znow warunkowy (mutacja D3)', 'newgame', "    'player_epoch_war',\n", "    ...(isWarEpochPlayerFirstEnabled() ? ['player_epoch_war'] : []),\n", 'newGameRow'],
  ['gracz nie-pierwszy w common', 'common', 'if (playerFirst && playerFirstPartnerId !== null && playerFirstPartner !== null)', 'if (false)', 'playerFirstInCommon'],
];

for (const [label, part, from, to, guardKey] of MUTATIONS) {
  if (!GUARDS[guardKey]) { failed++; console.error(`FAIL [brak bramki]: ${label}`); continue; }
  if (!SRC[part].includes(from)) { failed++; console.error(`FAIL [mutacja nieaplikowana]: ${label}`); continue; }
  const mutSrc = { ...SRC, [part]: SRC[part].replace(from, to) };
  const [name, fn] = GUARDS[guardKey];
  if (fn(mutSrc)) { failed++; console.error(`FAIL [mutacja przeszla bramke]: ${label} -> ${name}`); }
  else passed++;
}

console.log(`war-epoch-player-first-main-guard-test: ${passed} pass / ${failed} fail`);
if (failed > 0) process.exit(1);
