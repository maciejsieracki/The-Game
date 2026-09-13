'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const hudSource = fs.readFileSync(path.join(ROOT, 'src/ui/armyStackHud.ts'), 'utf8');
const mainSource = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');

let pass = 0;
let fail = 0;
function assert(condition, message) {
  if (condition) {
    pass++;
    console.log('  PASS:', message);
  } else {
    fail++;
    console.error('  FAIL:', message);
  }
}

const splitIcon = hudSource.match(/\n  split:\n([\s\S]*?)(?=\n  ['"]?merge['"]?:|\n  replace:)/)?.[1] ?? '';
const mergeIcon = hudSource.match(/\n  ['"]?merge['"]?:\n([\s\S]*?)(?=\n  \/\/ Zastąp|\n  replace:)/)?.[1] ?? '';
assert(splitIcon.includes('M12 12H4') && splitIcon.includes('M12 12H20'),
  'Rozdziel ma dwa ramiona wychodzące od środka');
assert(splitIcon.includes('M8 8 4 12l4 4') && splitIcon.includes('M16 8 20 12l-4 4'),
  'Rozdziel ma oba groty skierowane na zewnątrz');
assert(mergeIcon.includes('M4 12H12') && mergeIcon.includes('M20 12H12'),
  'Połącz ma dwa ramiona skierowane do środka');
assert(mergeIcon.includes('M8 8 12 12l-4 4') && mergeIcon.includes('M16 8 12 12l4 4'),
  'Połącz ma oba groty skierowane do środka');

const splitStart = mainSource.indexOf('onSplit: (ids, destQ, destR) => {');
const splitEnd = mainSource.indexOf('const campDestroyed = checkBarbCampDestroyedAt', splitStart);
const splitBlock = splitStart >= 0 && splitEnd > splitStart ? mainSource.slice(splitStart, splitEnd) : '';
assert(splitBlock.includes('splitMoveCost('),
  'zwykły split oblicza rzeczywisty koszt docelowego pola');
assert(!splitBlock.includes('for (const u of splitArrivals) u.ruchLeft = 0'),
  'zwykły split nie zeruje bezwarunkowo ruchu odchodzących jednostek');
assert(splitBlock.includes('deductStackRuchLeft(splitArrivals'),
  'koszt splitu jest odejmowany wspólnie od odłączanego stosu');

console.log(`\narmy-split-ruch-icons-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
