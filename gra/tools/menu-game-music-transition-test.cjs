'use strict';
/** Regression guard for intro/gameplay music ownership at game entry. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const player = fs.readFileSync(path.join(root, 'src/audio/filePlayer.ts'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'src/audio/muzyka-antyczna.ts'), 'utf8');
let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`PASS: ${label}`); }
  else { failed++; console.error(`FAIL: ${label}`); }
}

const gameStart = main.match(/function startGameMusic\(mood:[\s\S]*?\n    \}/)?.[0] || '';
const menuResume = main.match(/function resumeIntroMusic\(\): void \{[\s\S]*?\n    \}/)?.[0] || '';
const menuOpen = main.match(/function openStartupMainMenu\(\): void \{[\s\S]*?\n    \}/)?.[0] || '';
const stopImpl = player.match(/function stop\(onStopped\?: \(\) => void\): void \{[\s\S]*?\n  \}/)?.[0] || '';

check('both new-game and save-load paths start through startGameMusic',
  (main.match(/startGameMusic\('mapa'\)/g) || []).length >= 2);
check('game music starts only from intro stop completion callback',
  /stopIntroMusic\(\(\) => \{[\s\S]*?startMusic\(mood\)/.test(gameStart));
check('transition generation suppresses stale/duplicate gameplay starts',
  /const startGeneration = \+\+gameMusicStartGeneration/.test(gameStart) &&
  /startGeneration !== gameMusicStartGeneration/.test(gameStart));
check('pending delayed menu start is canceled at game entry',
  /clearTimeout\(introStartTimer\)/.test(gameStart) &&
  /introStartTimer = window\.setTimeout/.test(menuResume));
check('intro audio elements are released before transition callback runs',
  /releaseEl\(0\);[\s\S]*releaseEl\(1\);[\s\S]*onStopped\?\.\(\)/.test(stopImpl));
check('stopIntroMusic forwards its completion callback to the intro playlist',
  /introPlaylist\.stop\(onStopped\)/.test(engine));
check('returning to menu still stops game music and resumes intro immediately',
  /stopMusic\(\);[\s\S]*resumeIntroMusic\(\)/.test(menuOpen) &&
  /\} else \{\s*startIntroMusic\(\)/.test(menuResume));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
