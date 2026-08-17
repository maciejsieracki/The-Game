'use strict';
/** node tools/wonder-early-return-highlight-test.cjs — cud nie zostawia starego podświetlenia */

const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.ts');
const source = fs.readFileSync(mainPath, 'utf8');
const start = source.indexOf('onSelectWonder: (wonderId) => {');
const end = source.indexOf('listPlayerCities: () =>', start);
const handler = start >= 0 && end > start ? source.slice(start, end) : '';

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('PASS:', message);
  } else {
    failed++;
    console.error('FAIL:', message);
  }
}

console.log('wonder-early-return-highlight-test\n');

assert(start >= 0 && end > start, 'wyodrębniono handler onSelectWonder');
assert(
  handler.includes('activeImprovementKey = null;'),
  'wybór cudu zeruje aktywne ulepszenie terenu',
);

const earlyReturnCases = [
  {
    name: 'cud zablokowany przez bramkę',
    marker: 'if (!wonderGateOk(0, wonderId)) {',
  },
  {
    name: 'cud zablokowany przez istniejącą budowę',
    marker: 'if (ownerHasWonderBuildInProgress(wonderBuildSites, 0)) {',
  },
  {
    name: 'cud zablokowany przez brak kwalifikującego heksa',
    marker: 'if (qualifyingWonderHexesForPlayer().length === 0) {',
  },
];

for (const { name, marker } of earlyReturnCases) {
  const branchStart = handler.indexOf(marker);
  const branchEnd = branchStart >= 0 ? handler.indexOf('\n              }', branchStart) : -1;
  const branch = branchStart >= 0 && branchEnd > branchStart
    ? handler.slice(branchStart, branchEnd)
    : '';
  assert(branch.includes('refreshBuildHighlight();'), `${name}: odświeża podświetlenie przed return`);
  assert(
    branch.includes('refreshBuildHighlight();') && branch.indexOf('refreshBuildHighlight();') < branch.indexOf('return;'),
    `${name}: czyszczenie podświetlenia poprzedza wczesny return`,
  );
}

console.log(`\n${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
