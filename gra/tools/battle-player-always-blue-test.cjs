'use strict';
/**
 * R-WEB-UI-BATTLE-PLAYER-ALWAYS-BLUE-ALL-PATHS-Q1 — kolor strony w bitwie zależy od
 * gracz vs przeciwnik, NIE od roli atakujący/obrońca.
 *
 * Bramka: node tools/battle-player-always-blue-test.cjs
 *
 * Co sprawdza:
 *  (A) minimapUnitColor (battleMinimap.ts, esbuild): gracz = BATTLE_PLAYER (niebieski) przy obu rolach,
 *      przeciwnik = BATTLE_ENEMY (czerwony) przy obu rolach.
 *  (B) endDetails1E.ts (zrodlo): buildSideColumn dostaje isPlayer i to ono wybiera kolory
 *      (obwodka, medalion, gradient naglowka, nazwa); rola (isAtk) zostaje tylko dla ukladu kolumn.
 *  (C) siegeHud1E.ts (zrodlo): kolor muru/garnizonu/„Obrona muru” = defenderIsPlayer;
 *      battleScene.ts przekazuje defenderIsPlayer: _playerControlSide() === 'def'.
 *  (D) main.ts / mapFieldBattle.ts: sciezki tworzace bitwe gracza przekazuja deployPlayerSide.
 *  (E) battleScene.ts: sideColor(side, playerSide) zwraca niebieski dla side===playerSide (obie role).
 *
 * Mutacja (dowod nietautologicznosci): przywrocenie `isAtk ? BATTLE_PLAYER : BATTLE_ENEMY` w
 * endDetails1E.ts albo stalego koloru przeciwnika w siegeHud1E.ts -> sekcje B/C padaja.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function bundleModule(rel) {
  const out = esbuild.buildSync({
    entryPoints: [path.join(ROOT, rel)],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    loader: { '.svg': 'text', '.css': 'text' },
    logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', 'document', out.outputFiles[0].text)(mod, mod.exports, require, undefined);
  return mod.exports;
}

const THEME = bundleModule('src/battle/battleHudTheme.ts');
const MM = bundleModule('src/battle/battleMinimap.ts');
const PLAYER = THEME.BATTLE_PLAYER;
const ENEMY = THEME.BATTLE_ENEMY;
assert.equal(PLAYER, '#3a6ad0', 'BATTLE_PLAYER = niebieski');
assert.equal(ENEMY, '#c84040', 'BATTLE_ENEMY = czerwony');

// (A) minimapa: kolor wg gracz/przeciwnik przy obu rolach
for (const playerSide of ['atk', 'def']) {
  for (const side of ['atk', 'def']) {
    const want = side === playerSide ? PLAYER : ENEMY;
    assert.equal(MM.minimapUnitColor(side, playerSide, PLAYER, ENEMY), want,
      `A: side=${side} playerSide=${playerSide} -> ${want}`);
  }
}

// (B) end-details: kolor z isPlayer, nie z isAtk
const ed = read('src/battle/endDetails1E.ts');
const edFn = ed.match(/function buildSideColumn\([\s\S]*?\n\}\n/);
assert.ok(edFn, 'B: brak buildSideColumn w endDetails1E.ts');
const edBody = edFn[0];
assert.match(edBody, /isPlayer: boolean\)/, 'B1: buildSideColumn przyjmuje isPlayer');
assert.match(edBody, /const sideColor = isPlayer \? BATTLE_PLAYER : BATTLE_ENEMY;/, 'B2: obwodka wg isPlayer');
assert.match(edBody, /const sideTextColor = isPlayer \? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT;/, 'B3: tekst wg isPlayer');
assert.doesNotMatch(edBody, /isAtk \? (BATTLE_PLAYER|'linear-gradient\(90deg,rgba\(58)/, 'B4: brak koloru wg roli isAtk');
assert.match(ed, /buildSideColumn\('atk', p\.atk, [^\n]*, playerSide === 'atk'\)/, 'B5: kolumna atk dostaje isPlayer z playerSide');
assert.match(ed, /buildSideColumn\('def', p\.def, [^\n]*, playerSide === 'def'\)/, 'B6: kolumna def dostaje isPlayer z playerSide');

// (C) siege HUD: kolor obroncy wg gracza
const sh = read('src/battle/siegeHud1E.ts');
assert.match(sh, /const defColor = st\.defenderIsPlayer \? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT;/, 'C1: defColor wg defenderIsPlayer');
assert.match(sh, /font-size:36px;color:\$\{defColor\}/, 'C2: procent muru = defColor');
assert.doesNotMatch(sh, /color:\$\{BATTLE_ENEMY_TEXT\}/, 'C3: brak twardego koloru przeciwnika w HUD oblezenia');
const bs = read('src/battle/battleScene.ts');
assert.match(bs, /defenderIsPlayer: this\._playerControlSide\(\) === 'def',/, 'C4: battleScene przekazuje defenderIsPlayer');

// (D) sciezki bitwy gracza maja jawna role gracza
const main = read('src/main.ts');
assert.match(main, /deployPlayerSide: 'atk',/, 'D1: main.ts przekazuje deployPlayerSide atk');
assert.match(main, /deployPlayerSide: 'def',/, 'D2: main.ts przekazuje deployPlayerSide def (obrona gracza)');
const mfb = read('src/battle/mapFieldBattle.ts');
assert.match(mfb, /deployPlayerSide: defLead\.ownerId === 0 && atkLead\.ownerId !== 0 \? 'def' : 'atk'/, 'D3: mapFieldBattle przekazuje role gracza');

// (E) sideColor w 3D: playerSide decyduje o kolorze, obie role
const sideFn = bs.match(/function sideColor\(side: 'atk' \| 'def', playerSide: 'atk' \| 'def'\): number \{\n\s*return ([^;]+);/);
assert.ok(sideFn, 'E0: brak sideColor');
assert.match(sideFn[1], /side === playerSide \? SIDE_COLOR_PLAYER : SIDE_COLOR_ENEMY/, 'E1: sideColor po playerSide');

console.log('battle-player-always-blue-test: OK (A minimap 4/4, B end-details, C siege HUD, D deployPlayerSide, E sideColor)');
