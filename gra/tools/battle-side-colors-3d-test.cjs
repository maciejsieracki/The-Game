'use strict';
/**
 * R-WEB-UI-BATTLE-3D-SIDE-COLORS-BLUE-RED-Q1 — test kolorów STRON w widoku 3D bitwy.
 *
 * Bramka: node tools/battle-side-colors-3d-test.cjs
 *
 * Co sprawdza (statycznie, na źródle battleScene.ts + battleHudTheme.ts):
 *  (A) tokeny stron: sideColor() w battleScene.ts wyprowadza kolor z BATTLE_PLAYER / BATTLE_ENEMY
 *      (battleHudTheme.ts), a dla obu ról (playerSide = atk i = def) gracz = niebieski, przeciwnik = czerwony.
 *  (B) żaden model jednostki ani zastępczy awatar w 3D NIE jest tintowany przez bu.ownerColor
 *      (dawniej 0xffd54a złoto atakującego / 0xc84040 obrońcy) — każde wywołanie buildUnitModel
 *      i makeFallbackAvatar używa sideColor(...) wg strony gracza.
 *  (C) kontrakt identyfikacji strony nietknięty: 0xc84040 nadal rozpoznaje obrońcę w
 *      _movementPointsFor / _attackRangeFor (bu.ownerColor pozostaje tokenem roli w danych).
 *
 * Mutacja (dowód nietautologiczności): przywrócenie bu.ownerColor w którymkolwiek miejscu z (B)
 * albo sideColor zwracającego 0xffd54a → test pada.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const scene = read('src/battle/battleScene.ts');
const theme = read('src/battle/battleHudTheme.ts');

// (A) tokeny i funkcja sideColor z kodu źródłowego
const tokenOf = name => {
  const m = theme.match(new RegExp("export const " + name + " = '#([0-9a-fA-F]{6})'"));
  assert.ok(m, 'brak tokenu ' + name + ' w battleHudTheme.ts');
  return parseInt(m[1], 16);
};
const PLAYER = tokenOf('BATTLE_PLAYER');
const ENEMY = tokenOf('BATTLE_ENEMY');
assert.equal(PLAYER, 0x3a6ad0, 'BATTLE_PLAYER musi być niebieski #3a6ad0');
assert.equal(ENEMY, 0xc84040, 'BATTLE_ENEMY musi być czerwony #c84040');

const fnMatch = scene.match(/function sideColor\(side: 'atk' \| 'def', playerSide: 'atk' \| 'def'\): number \{[\s\S]*?\n\}/);
assert.ok(fnMatch, 'brak funkcji sideColor w battleScene.ts');
assert.match(scene, /const SIDE_COLOR_PLAYER = parseInt\(BATTLE_PLAYER\.slice\(1\), 16\);/, 'SIDE_COLOR_PLAYER musi wynikać z tokenu BATTLE_PLAYER');
assert.match(scene, /const SIDE_COLOR_ENEMY\s+= parseInt\(BATTLE_ENEMY\.slice\(1\), 16\);/, 'SIDE_COLOR_ENEMY musi wynikać z tokenu BATTLE_ENEMY');

// Wykonanie sideColor z kodu źródłowego (bez TS-typów) dla obu ról.
const jsFn = fnMatch[0].replace("side: 'atk' | 'def', playerSide: 'atk' | 'def'", 'side, playerSide').replace(': number', '');
const consts = "const BATTLE_PLAYER = '#3a6ad0'; const BATTLE_ENEMY = '#c84040';\n"
  + "const SIDE_COLOR_PLAYER = parseInt(BATTLE_PLAYER.slice(1), 16);\n"
  + "const SIDE_COLOR_ENEMY = parseInt(BATTLE_ENEMY.slice(1), 16);\n";
const sideColor = new Function(consts + jsFn + '\nreturn sideColor;')();

const BLUE = 0x3a6ad0;
const RED = 0xc84040;
// gracz jako atakujący
assert.equal(sideColor('atk', 'atk'), BLUE, 'gracz atakujący musi być niebieski');
assert.equal(sideColor('def', 'atk'), RED, 'przeciwnik obrońca musi być czerwony');
// gracz jako obrońca
assert.equal(sideColor('def', 'def'), BLUE, 'gracz obrońca musi być niebieski');
assert.equal(sideColor('atk', 'def'), RED, 'przeciwnik atakujący musi być czerwony');

// (B) żadnego tintu przez bu.ownerColor w tworzeniu modeli 3D bitwy
const forbidden = [
  /buildUnitModel\(bu\.kategoria,\s*bu\.ownerColor/g,
  /makeFallbackAvatar\(bu\.ownerColor\)/g,
];
for (const re of forbidden) {
  assert.equal((scene.match(re) || []).length, 0, 'bu.ownerColor nadal tintuje model 3D: ' + re);
}
const modelCalls = scene.match(/buildUnitModel\(bu\.kategoria, sideColor\(/g) || [];
assert.equal(modelCalls.length, 4, 'oczekiwano 4 wywołań buildUnitModel z sideColor, jest ' + modelCalls.length);
const fallbackCalls = scene.match(/makeFallbackAvatar\(sideColor\(/g) || [];
assert.equal(fallbackCalls.length, 4, 'oczekiwano 4 awatarów zastępczych z sideColor, jest ' + fallbackCalls.length);

// (C) identyfikacja strony obrońcy po ownerColor w mechanice pozostaje bez zmian
assert.equal((scene.match(/bu\.ownerColor === 0xc84040/g) || []).length, 2, 'kontrakt roli obrońcy (0xc84040) w danych musi pozostać');

console.log('battle-side-colors-3d-test: OK (A: tokeny i sideColor dla atk/def, B: 4 modele + 4 awatary z kolorem strony, C: kontrakt roli)');
