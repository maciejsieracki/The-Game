'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const preBattle = fs.readFileSync(path.join(root, 'src/ui/preBattle.ts'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const scene = fs.readFileSync(path.join(root, 'src/battle/battleScene.ts'), 'utf8');

assert.doesNotMatch(preBattle, /deployDisabled|if \(!manualControlAllowed\) return/,
  'pre-battle manual-vs-auto choice is not gated on commander presence');
const enterActionSource = /const defaultManual = \(opts\?\.defaultAction \?\? 'manual'\) === 'manual';/g;
assert.equal((preBattle.match(enterActionSource) ?? []).length, 2,
  'keyboard action and visible Enter hint derive from the same defaultAction, independent of commander presence');
assert.match(preBattle, /const enterLabel = defaultManual \? deployLabel : 'Auto';[\s\S]*?'<b>Enter<\/b> = ' \+ esc\(enterLabel\)/,
  'visible Enter hint reports the action that the keyboard handler runs');
assert.ok(preBattle.includes('Bez Wodza lub Generała możesz wejść na pole bitwy, ale walka rozegra się automatycznie bez indywidualnego sterowania.'),
  'commander note explains the automatic field resolution');

assert.equal((main.match(/deploy: (?:atk|def)RosterRef\.some\(u => u\.isGeneral === true\)/g) ?? []).length, 3,
  'all three player-controlled map-battle entry paths skip manual deployment controls without a commander');

assert.match(scene, /this\._manualMode = !this\._manualCommanderGate \|\| \(this\._manualCommanderGate && hasCommander\)/,
  'manual battlefield controls start enabled only when an assigned commander is present');
assert.match(scene, /if \(this\._manualCommanderGate && !this\._manualMode[\s\S]*?return;/,
  'without a commander, switching from automatic to individual manual control is blocked');
assert.match(scene, /if \(!this\._manualMode\) this\._kickoffBattleTurn\(\)/,
  'after entering the field without a commander, automatic battle resolution proceeds');

console.log('battle-manual-choice-contract-test: 9 passed, 0 failed');
