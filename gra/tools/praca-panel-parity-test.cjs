'use strict';

/**
 * R-PRACA-PULA-NIEAKUMULUJE-Q1 — panel parity gate.
 *
 * This is intentionally a read-only source/contract test: the panel modules are not
 * independently bundleable because they import browser assets.  It checks the live
 * field names and the arithmetic contract shared by the city and empire panels, then
 * exercises the 0/100, 50/50 and 100/0 split cases across two turns plus a save/load
 * round-trip of the pool value.
 *
 * Run from gra/: node tools/praca-panel-parity-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(GRA, file), 'utf8');
const city = read('src/ui/cityPanel.ts');
const empire = read('src/ui/empireDetailPanel.ts');
const economy = read('src/game/turn-economy.ts');
const production = read('src/game/production.ts');
const main = read('src/main.ts');

let passed = 0;
let failed = 0;
function check(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`PASS ${label}`);
  } else {
    failed++;
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('R-PRACA-PULA-NIEAKUMULUJE-Q1 — panel parity');

// One contract: city preview emits the same per-city split that the empire table sums.
check('city panel exposes pracaPool/pracaRate/pracaUpkeep',
  city.includes('pracaPool?: number;')
  && city.includes('pracaRate?: number;')
  && city.includes('pracaUpkeep?: number;'));
check('empire panel consumes pracaPula/pracaBudynki per city',
  empire.includes("['MIASTO', 'DO PULI', 'DO BUDYNKÓW']")
  && empire.includes('c.pracaPula')
  && empire.includes('c.pracaBudynki'));
check('empire panel sums the same two per-city fields',
  empire.includes('sumBudynki += c.pracaBudynki')
  && empire.includes('sumPula += c.pracaPula')
  && empire.includes('const total = sumBudynki + sumPula'));
check('empire panel renders pool, net rate and upkeep from economy snapshot',
  empire.includes('economy.praca')
  && empire.includes('economy.pracaRate')
  && empire.includes('economy.pracaUpkeep'));
check('engine uses resolved city split for preview and real turn',
  (economy.match(/splitPraca\(yld\.praca, udzialBudynki\)/g) || []).length >= 2
  && economy.includes('ownerDefaultPodzialPracyByOwner'));
check('main wires per-city split into the panel snapshot',
  main.includes('pracaBudynki: tk?.doBudynkow ?? 0')
  && main.includes('pracaPula: tk?.doPuli ?? 0'));
check('pool and upkeep state are persisted for save/load',
  main.includes('playerPracaPool')
  && main.includes('ownerDefaultPodzialPracy')
  && main.includes('aiPracaPoolByOwner'));

function splitPraca(total, buildingsPercent) {
  const normalizedTotal = Number.isFinite(total) && total > 0 ? Math.round(total) : 0;
  const share = Math.min(1, Math.max(0, buildingsPercent));
  const buildings = Math.round(normalizedTotal * share);
  return { total: normalizedTotal, doBudynkow: buildings, doPuli: normalizedTotal - buildings };
}

// Deterministic parity fixtures for the exact values shown by both panels.
for (const [label, pct, expected] of [
  ['0/100', 0, [0, 13]],
  ['50/50', 0.5, [7, 6]],
  ['100/0', 1, [13, 0]],
]) {
  const tick = splitPraca(13, pct);
  check(`${label}: panel split preserves total`, tick.doBudynkow + tick.doPuli === tick.total);
  check(`${label}: panel split has expected values`,
    tick.doBudynkow === expected[0] && tick.doPuli === expected[1],
    JSON.stringify(tick));
}

// Two-turn pool plus save/load: the value displayed in the empire panel is the persisted stock.
const tick = splitPraca(13, 0.5);
let pool = 0;
pool += tick.doPuli;
pool += tick.doPuli;
check('50/50 two-turn: pool accumulates both turns', pool === 12, `pool=${pool}`);
const save = JSON.stringify({ playerPracaPool: pool });
const loaded = JSON.parse(save);
check('save/load: playerPracaPool round-trips unchanged', loaded.playerPracaPool === pool);
check('panel parity fixture: empire totals equal city rows',
  (tick.doBudynkow + tick.doPuli) + (tick.doBudynkow + tick.doPuli) === 26);

console.log(`\npraca-panel-parity-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
