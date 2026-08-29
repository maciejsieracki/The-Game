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

ok(armySource.includes('unitTypeId'), 'wpis armii przechowuje typ reprezentanta stosu');
ok(armySource.includes('onOpenUnitCard'), 'panel armii deklaruje callback otwarcia karty');
ok(armySource.includes('config.onOpenUnitCard?.(a.id, a.unitTypeId!)'),
  'osobny przycisk wpisu armii wywołuje callback karty');
ok(mainSource.includes('showUnitInfoCardDialog'), 'main podłącza dialog karty');
ok(mainSource.includes('data.units.find(u => u.Jednostka === resolvedTypeId)'),
  'wiring wyszukuje prawdziwą definicję jednostki');
ok(mainSource.includes('u.id === unitId && u.ownerId === 0'),
  'wiring rozpoznaje właściwą jednostkę runtime');

console.log(`\nunit-info-card-wiring-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
