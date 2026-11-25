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
// R-WEB-TEST-DEBT-Q14 (HARNESS): kolory stron wyniesione do battleHudTheme.ts (BATTLE_PLAYER / BATTLE_ENEMY,
// cfa7447d6); sideColor zwraca teraz SIDE_COLOR_PLAYER/ENEMY z tych stałych. Sprawdzamy oba: wiązanie w
// battleScene.ts oraz wartości hex w motywie (gracz niebieski #3a6ad0, przeciwnik czerwony #c84040).
has(battle, /return side === playerSide \? SIDE_COLOR_PLAYER : SIDE_COLOR_ENEMY;/, 'gracz niebieski, przeciwnik czerwony (wiązanie z motywem)');
const battleHudTheme = read('src/battle/battleHudTheme.ts');
has(battleHudTheme, /export const BATTLE_PLAYER = '#3a6ad0';/, 'motyw: BATTLE_PLAYER = niebieski #3a6ad0');
has(battleHudTheme, /export const BATTLE_ENEMY = '#c84040';/, 'motyw: BATTLE_ENEMY = czerwony #c84040');
has(battle, /const playerSide = this\._playerControlSide\(\);/, 'panel zna stronę gracza');
has(battle, /mkCommanderCard\(playerSide\);/, 'lewa karta to gracz');
has(battle, /const enemySide = playerSide === 'atk' \? 'def' : 'atk';/, 'panel wyznacza przeciwnika');
has(battle, /mkCommanderCard\(enemySide\);/, 'prawa karta to przeciwnik');
// R-WEB-TEST-DEBT-Q14 (HARNESS): po refaktorze kart dowódców kolor wybiera zmienna isPlayer
// (= this._isPlayerSide(side)) -- ta sama reguła strony gracza, inny zapis.
has(battle, /const isPlayer = this\._isPlayerSide\(side\);[\s\S]{0,200}?const sideColor = isPlayer \? BATTLE_PLAYER : BATTLE_ENEMY;/, 'kolor strony wybiera właściciel (_isPlayerSide)');
has(battle, /this\._armyMoraleRatio\(playerSide\)/, 'pasek przewagi używa strony gracza');
has(battle, /sideColor\(side, this\._playerControlSide\(\)\)/, 'obwódki jednostek używają strony gracza');
// R-WEB-TEST-DEBT-Q14 (HARNESS): SIDE_COLOR_PLAYER/ENEMY to stałe stron (gracz/przeciwnik), nie tabela
// rolowa -- zakaz zawęża się do nazw rolowych (atak/obrona), żeby nie zabraniać wiązania stron.
lacks(battle, /FACTION_ATK|FACTION_DEF|SIDE_COLOR_ATK|SIDE_COLOR_DEF/, 'brak rolowej tabeli kolorów');

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
