'use strict';
/** node gra/tools/army-stack-ruch-test.cjs */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.army-stack-ruch-entry.ts');
const BUNDLE = path.join(__dirname, '.army-stack-ruch-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { stackRuchLeft, syncStackRuchLeft, deductStackRuchLeft, unitWithStackRuch } from '../src/game/armyMerge';
export { stackRuchLeft, syncStackRuchLeft, deductStackRuchLeft, unitWithStackRuch };`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  stackRuchLeft,
  syncStackRuchLeft,
  deductStackRuchLeft,
  unitWithStackRuch,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

const a = { id: 'a', ownerId: 0, q: 1, r: 1, ruchLeft: 0, ruch: 2, typeId: 'x' };
const b = { id: 'b', ownerId: 0, q: 1, r: 1, ruchLeft: 2, ruch: 2, typeId: 'y' };
const stack = [a, b];

assert(stackRuchLeft(stack) === 0, 'min ruch = 0 when one unit exhausted');

syncStackRuchLeft(stack);
assert(a.ruchLeft === 0 && b.ruchLeft === 0, 'sync sets all to min');

b.ruchLeft = 2;
deductStackRuchLeft(stack, 1);
assert(a.ruchLeft === 0 && b.ruchLeft === 0, 'deduct from pooled 0 stays 0');

b.ruchLeft = 2;
a.ruchLeft = 2;
deductStackRuchLeft(stack, 2);
assert(a.ruchLeft === 0 && b.ruchLeft === 0, 'deduct 2 from pooled 2 -> 0');

a.ruchLeft = 1;
b.ruchLeft = 2;
const mover = unitWithStackRuch(b, stack);
assert(mover.ruchLeft === 1, 'unitWithStackRuch uses min');

console.log('army-stack-ruch-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
