'use strict';

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const armySource = fs.readFileSync(path.join(GRA, 'src', 'ui', 'armyListHud.ts'), 'utf8');
const mainSource = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) {
    pass++;
    console.log('  PASS:', message);
  } else {
    fail++;
    console.error('  FAIL:', message);
  }
}

const ordinaryClick = armySource.match(
  /const go = \(\) => config\.onSelectArmy\(a\.id\);[\s\S]{0,180}row\.addEventListener\('click', go\);/,
);
ok(!!ordinaryClick, 'zwykły klik wpisu wykonuje tylko zaznaczenie armii');
ok(!ordinaryClick?.[0].includes('onOpenUnitCard'),
  'zwykły klik nie otwiera karty');
ok(armySource.includes("ev.stopPropagation();\n            config.onOpenUnitCard?.(a.id, a.unitTypeId!)"),
  'przycisk karty zatrzymuje propagację i otwiera osobną interakcję');
ok(armySource.includes('className = \'sl-unit-card-btn\''),
  'karta ma jednoznaczny osobny obszar/przycisk');
ok(mainSource.includes('onOpenUnitCard: (unitId, unitTypeId)'),
  'wiring przekazuje identyfikator reprezentanta runtime');
ok(mainSource.includes('u.id === unitId && u.ownerId === 0'),
  'status runtime jest pobierany z właściwej jednostki');
const callbackStart = mainSource.indexOf('onOpenUnitCard: (unitId, unitTypeId) => {');
const callbackEnd = mainSource.indexOf('onClose: () => refreshD1bHud()', callbackStart);
const callback = callbackStart >= 0 && callbackEnd > callbackStart
  ? mainSource.slice(callbackStart, callbackEnd)
  : '';
ok(!callback.includes('hideArmyListHud()'),
  'otwarcie karty nie niszczy/domyka listy Armie');

console.log(`\nunit-info-card-army-interaction-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);

