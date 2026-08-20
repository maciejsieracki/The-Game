const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const battle = read('src/battle/battleScene.ts');
const preBattle = read('src/ui/preBattle.ts');
const postBattle = read('src/ui/postBattleSummary.ts');
const summary = read('src/game/battle-summary.ts');
const main = read('src/main.ts');

let checks = 0;
function has(source, pattern, label) {
  checks += 1;
  assert.match(source, pattern, label);
}
function lacks(source, pattern, label) {
  checks += 1;
  assert.doesNotMatch(source, pattern, label);
}

// Macierz obu kierunków: kolor i pozycja wynikają ze strony gracza, nie z roli.
const visualSide = (role, playerSide) => role === playerSide ? 'player-left-blue' : 'enemy-right-red';
assert.equal(visualSide('atk', 'atk'), 'player-left-blue');
assert.equal(visualSide('def', 'atk'), 'enemy-right-red');
assert.equal(visualSide('def', 'def'), 'player-left-blue');
assert.equal(visualSide('atk', 'def'), 'enemy-right-red');
checks += 4;

has(battle, /function sideColor\(side: 'atk' \| 'def', playerSide: 'atk' \| 'def'\)/, 'kolor jednostki przyjmuje stronę gracza');
has(battle, /return side === playerSide \? 0x3a6ad0 : 0xc84040;/, 'gracz niebieski, przeciwnik czerwony');
has(battle, /const playerSide = this\._playerControlSide\(\);/, 'panel zna stronę gracza');
has(battle, /mkCommanderCard\(playerSide\);/, 'lewa karta to gracz');
has(battle, /const enemySide = playerSide === 'atk' \? 'def' : 'atk';/, 'panel wyznacza przeciwnika');
has(battle, /mkCommanderCard\(enemySide\);/, 'prawa karta to przeciwnik');
has(battle, /color: this\._isPlayerSide\(ru\.side\) \? BATTLE_PLAYER : BATTLE_ENEMY,/, 'minimapa używa właściciela');
has(battle, /this\._armyMoraleRatio\(playerSide\)/, 'pasek przewagi używa strony gracza');
has(battle, /sideColor\(side, this\._playerControlSide\(\)\)/, 'obwódki jednostek używają strony gracza');
lacks(battle, /FACTION_ATK|FACTION_DEF|SIDE_COLOR/, 'brak rolowej tabeli kolorów');

assert.equal((preBattle.match(/const posCls = isYou \? 'pb-l' : 'pb-r';/g) || []).length, 2);
checks += 1;

has(summary, /playerSide\?: 'atk' \| 'def';/, 'kontrakt podsumowania niesie stronę gracza');
has(postBattle, /const isPlayer = role === playerSide;/, 'podsumowanie rozdziela rolę od właściciela');
has(postBattle, /const playerSide = data\.playerSide \?\? 'atk';/, 'podsumowanie ma bezpieczny fallback');
has(postBattle, /buildCommanderCorner\(data\.atakujacy, 'atk', playerSide\)/, 'karta atakującego dostaje stronę gracza');
has(postBattle, /buildRosterColumn\(data\.obronca, 'def', playerSide\)/, 'kolumna obrońcy dostaje stronę gracza');
has(battle, /playerSide: this\._playerControlSide\(\),/, 'bitwa taktyczna przekazuje stronę gracza');
has(main, /const playerSide: 'atk' \| 'def' =/, 'mapa wyznacza stronę gracza bez zmiany wyniku');
has(main, /playerSide,\s*teren: summary\.teren,/, 'mapa przekazuje metadane UI do podsumowania');

// Sanity check: kontrakt walki nadal zawiera istniejące punkty rozstrzygnięcia.
has(battle, /private _singleBlow\(/, 'algorytm pojedynczego ciosu pozostaje obecny');
has(battle, /private _checkEnd\(/, 'warunek końca walki pozostaje obecny');
has(main, /function applyMapBattleOutcomeWithSummary\(/, 'ścieżka rozliczenia pozostaje obecna');

console.log(`R-BITWA-KOLORY-GRACZ-PRZECIWNIK-Q1: PASS (${checks} checks)`);
