'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, 'src/ui/recruitHudLabel.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const compiledModule = { exports: {} };
vm.runInNewContext(js, { module: compiledModule, exports: compiledModule.exports, Number });
const { recruitHudLabel } = compiledModule.exports;

assert.equal(recruitHudLabel('1 234', 12), '1 234 (12 pełnych jedn.)');
assert.equal(recruitHudLabel('99', 0), '99 (0 pełnych jedn.)');
assert.equal(recruitHudLabel('99', undefined), '99 (0 pełnych jedn.)');
assert.equal(recruitHudLabel('99', 1.5), '99 (0 pełnych jedn.)');
console.log('Recruit HUD label checks passed.');
