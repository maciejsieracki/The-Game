'use strict';
/**
 * empire-diplo-resource-flow-test.cjs — przepływy surowców z umów cyklicznych (panel imperium).
 * Run: node tools/empire-diplo-resource-flow-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.empire-diplo-flow-entry.ts');
const BUNDLE = path.resolve(__dirname, '.empire-diplo-flow-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { empireDiploResourceFlowPerTurn } from '../src/game/empire-diplo-resource-flow.ts';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const { empireDiploResourceFlowPerTurn } = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

const dealOut = {
  id: 'd1',
  rodzaj: 'umowa_handlowa',
  strony: [0, 1],
  wygasaTura: 100,
  handelSurowiecCykliczny: [{
    surowiecKey: 'drewno',
    pakietyPerTura: 2,
    sellerOwnerId: 0,
    buyerOwnerId: 1,
    zaplataTyp: 'zloto',
    zaplataPerTura: 5,
  }],
};

const dealIn = {
  id: 'd2',
  rodzaj: 'umowa_handlowa',
  strony: [0, 2],
  wygasaTura: 100,
  handelSurowiecCykliczny: [{
    surowiecKey: 'kamien',
    pakietyPerTura: 1,
    sellerOwnerId: 2,
    buyerOwnerId: 0,
  }],
};

const flows0 = empireDiploResourceFlowPerTurn([dealOut, dealIn], 0, 10);
ok(flows0.drewno?.outPerTurn === 20, 'gracz oddaje 2 pakiety × 10 = 20 drewna');
ok((flows0.drewno?.inPerTurn ?? 0) === 0, 'brak przychodu drewna');
ok(flows0.kamien?.inPerTurn === 10, 'gracz dostaje 1 pakiet × 10 = 10 kamienia');
ok((flows0.kamien?.outPerTurn ?? 0) === 0, 'brak wychodzącego kamienia');

const flows1 = empireDiploResourceFlowPerTurn([dealOut], 1, 10);
ok(flows1.drewno?.inPerTurn === 20, 'AI 1 dostaje drewno od gracza');
ok((flows1.drewno?.outPerTurn ?? 0) === 0, 'AI 1 nie oddaje drewna');

const empty = empireDiploResourceFlowPerTurn([], 0, 10);
ok(Object.keys(empty).length === 0, 'brak dealów → pusty obiekt');

console.log(`\nempire-diplo-resource-flow: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
