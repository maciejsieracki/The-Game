/* Regression harness for R-BITWA-KOLORY-GRACZ-PRZECIWNIK-Q1. */
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'battle', 'battleScene.ts'), 'utf8');
const summary = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'postBattleSummary.ts'), 'utf8');
const ok = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log('PASS:', message);
};

ok(/SIDE_COLOR_BY_IDENTITY\s*=\s*\{[\s\S]*player:\s*0x1e88e5[\s\S]*enemy:\s*0xe53935/.test(src), 'identity palette is blue player / red enemy');
ok(/side === playerSide \? SIDE_COLOR_BY_IDENTITY\.player : SIDE_COLOR_BY_IDENTITY\.enemy/.test(src), 'role resolves through player side');
ok(/mkCommanderCard\(playerSideForHud, true\)[\s\S]*mkCommanderCard\(playerSideForHud === 'atk' \? 'def' : 'atk', false\)/.test(src), 'player commander is left in both battle directions');
ok(/playerSide: this\._playerControlSide\(\)/.test(src), 'battle result/roster overlay receives player side');
ok(/function buildRosterColumn\(side: BattleSummarySide, role: 'atk' \| 'def', playerSide/.test(summary), 'summary roster colours accept player side');
ok(/const isAtk = role === playerSide;/.test(summary), 'summary roster colour identity is independent from attack role');

console.log('battle-colors-player-identity-test: OK');
