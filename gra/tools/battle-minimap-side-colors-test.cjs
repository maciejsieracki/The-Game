'use strict';
/**
 * R-WEB-UI-BATTLE-MINIMAP-SIDE-COLORS-BLUE-RED-Q1 — znaczniki stron na minimapie bitwy.
 *
 * Bramka: node tools/battle-minimap-side-colors-test.cjs
 *
 * Co sprawdza:
 *  (A) minimapUnitColor (battleMinimap.ts, esbuild): playerSide=atk -> atk niebieski, def czerwony;
 *      playerSide=def -> def niebieski, atk czerwony. Kolory = tokeny BATTLE_PLAYER / BATTLE_ENEMY
 *      z battleHudTheme.ts (bundle, bez DOM).
 *  (B) drawBattleMinimap na atrapie ctx: rysowane znaczniki maja fillStyle wg strony gracza
 *      (niebieski = gracz, czerwony = przeciwnik) dla obu ustawien playerSide.
 *  (C) battleScene.ts (zrodlo): _collectMinimapData koloruje znaczniki przez minimapUnitColor
 *      z _playerControlSide() (nie przez atk/def ani kolor cywilizacji).
 *
 * Mutacja (dowod nietautologiczności): zamiana minimapUnitColor na `side === 'atk' ? PLAYER : ENEMY`
 * lub na porownanie z 'atk' zamiast playerSide -> sekcja A/B pada dla playerSide=def.
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

assert.equal(PLAYER, '#3a6ad0', 'token BATTLE_PLAYER (niebieski gracza)');
assert.equal(ENEMY, '#c84040', 'token BATTLE_ENEMY (czerwony przeciwnik)');

// (A) — czysta funkcja kolorow wg strony gracza
assert.equal(MM.minimapUnitColor('atk', 'atk', PLAYER, ENEMY), PLAYER, 'A1: playerSide=atk, atk = gracz (niebieski)');
assert.equal(MM.minimapUnitColor('def', 'atk', PLAYER, ENEMY), ENEMY, 'A2: playerSide=atk, def = przeciwnik (czerwony)');
assert.equal(MM.minimapUnitColor('def', 'def', PLAYER, ENEMY), PLAYER, 'A3: playerSide=def, def = gracz (niebieski)');
assert.equal(MM.minimapUnitColor('atk', 'def', PLAYER, ENEMY), ENEMY, 'A4: playerSide=def, atk = przeciwnik (czerwony)');

// (B) — rysowanie przez drawBattleMinimap: fillStyle znacznika wg strony gracza
function unitFillStyles(playerSide) {
  const units = [
    { q: 1, r: 1, color: MM.minimapUnitColor('atk', playerSide, PLAYER, ENEMY) },
    { q: 5, r: 2, color: MM.minimapUnitColor('def', playerSide, PLAYER, ENEMY) },
  ];
  const seen = [];
  let fill = null;
  const ctx = {
    clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, stroke() {},
    set fillStyle(v) { fill = v; },
    get fillStyle() { return fill; },
    set strokeStyle(_v) {}, set lineWidth(_v) {},
    arc() { seen.push(fill); },
    fill() {},
  };
  const data = {
    cols: 8, rows: 8,
    terrain: new Array(64).fill(0),
    units,
    viewport: { colMin: 0, rowMin: 0, colMax: 7, rowMax: 7 },
  };
  MM.drawBattleMinimap(ctx, data);
  assert.equal(seen.length, 2, 'B: dwa znaczniki narysowane');
  return { atk: seen[0], def: seen[1] };
}
let fs1 = unitFillStyles('atk');
assert.equal(fs1.atk, PLAYER, 'B1: playerSide=atk -> znacznik atk niebieski');
assert.equal(fs1.def, ENEMY, 'B2: playerSide=atk -> znacznik def czerwony');
let fs2 = unitFillStyles('def');
assert.equal(fs2.def, PLAYER, 'B3: playerSide=def -> znacznik def niebieski');
assert.equal(fs2.atk, ENEMY, 'B4: playerSide=def -> znacznik atk czerwony');

// (C) — wiazanie sceny: kolor znacznika liczony z _playerControlSide(), nie z atk/def
const scene = read('src/battle/battleScene.ts');
const collectStart = scene.indexOf('private _collectMinimapData(): BattleMinimapData {');
assert.ok(collectStart > 0, 'C0: _collectMinimapData istnieje');
const collectEnd = scene.indexOf('private _computeMinimapViewport', collectStart);
const collectBody = scene.slice(collectStart, collectEnd);
assert.match(
  collectBody,
  /color:\s*minimapUnitColor\(ru\.side,\s*this\._playerControlSide\(\),\s*BATTLE_PLAYER,\s*BATTLE_ENEMY\)/,
  'C1: znacznik minimapy = minimapUnitColor(ru.side, _playerControlSide(), BATTLE_PLAYER, BATTLE_ENEMY)',
);
assert.doesNotMatch(collectBody, /ru\.side\s*===\s*'(atk|def)'/, 'C2: brak kolorowania po stronie atk/def w minimapie');
assert.match(scene, /minimapUnitColor,\s*\n/, 'C3: minimapUnitColor zaimportowany w battleScene.ts');

console.log('OK: battle-minimap-side-colors (A: 4 przypadki, B: 4 znaczniki na pikselach fillStyle, C: wiązanie sceny)');
