'use strict';
/**
 * R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1 -- statyczny dowod haka __civTest.addUnit(owner,q,r,civilian,typeId).
 * Sprawdza zrodlo gra/src/main.ts (blok addUnit) i przekazanie typeId przez gra/src/game/civ-test-hooks.ts.
 * Usage: node tools/civtest-addunit-typeid-test.cjs [sciezka-main.ts] [sciezka-civ-test-hooks.ts]
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const mainPath = process.argv[2] || path.join(root, 'src/main.ts');
const hooksPath = process.argv[3] || path.join(root, 'src/game/civ-test-hooks.ts');
const main = fs.readFileSync(mainPath, 'utf8');
const hooks = fs.readFileSync(hooksPath, 'utf8');
let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name); }
}

const start = main.indexOf('addUnit: (ownerId, q, r, civilian, typeId) => {');
const end = main.indexOf('setWar: (a, b) => { getDiploRelation', start);
const block = start >= 0 && end > start ? main.slice(start, end) : '';
check('main.ts: addUnit przyjmuje piaty argument typeId', start >= 0);
check('main.ts: typeId nieobecny -> stara sciezka szablonu (isCivilianUnit)',
  /if \(typeId !== undefined\)[\s\S]*?\}\s*const tpl = units\.find\(u => u\.ownerId === ownerId && isCivilianUnit\(u\) === civilian\)/.test(block));
check('main.ts: nieznany typ -> null (brak wpisu w units.json)',
  /const typeDef = [^;]*Jednostka'\] === typeId\);\s*if \(!typeDef\) return null;/.test(block));
check('main.ts: typ z units.json ustawia typeId i ruch (applyRuchSwiataPace)',
  /typeId, isGeneral: false[\s\S]*ruch: ruchT, ruchLeft: ruchT/.test(block) && block.includes("applyRuchSwiataPace(normFieldVal(typeDef['Ruch'], 2)"));
check('main.ts: hak installCivTestHooks wywolywany tylko przy ?civTest (isCivTestEnabled gate w civ-test-hooks)',
  /export function installCivTestHooks[\s\S]*?isCivTestEnabled\(/.test(hooks));
check('civ-test-hooks.ts: forwarder deps.addUnit przekazuje typeId',
  hooks.includes('addUnit: (ownerId, q, r, civilian = false, typeId) => deps.addUnit(ownerId, q, r, civilian, typeId),'));
check('civ-test-hooks.ts: typ deps.addUnit zawiera typeId opcjonalny',
  /addUnit: \(ownerId: number, q: number, r: number, civilian: boolean, typeId\?: string\)/.test(hooks));
console.log(`\nADDUNIT-TYPEID STATIC: ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
