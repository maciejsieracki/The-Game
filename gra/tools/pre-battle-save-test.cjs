'use strict';
/**
 * pre-battle-save-test.cjs — ZAPISZ na ekranie pre-bitwy pokazuje toast na overlay.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[pre-battle-save-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const ENTRY = path.join(__dirname, '.pre-battle-save-entry.ts');
const OUT = path.join(__dirname, '.pre-battle-save-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  "export { showPreBattle, hidePreBattle, isPreBattleOpen } from '../src/ui/preBattle.ts';\n",
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const { showPreBattle, hidePreBattle, isPreBattleOpen } = require(OUT);

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;

let saveCalled = false;
showPreBattle(
  {
    atakujacy: { nazwa: 'Atak', units: [{ nazwa: 'Wojownik', kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }] },
    obronca: { nazwa: 'Obrona', units: [{ nazwa: 'Oszczepnik', kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 4 }] },
    teren: 'Rownina',
    szanseAtkPct: 41,
    miejsce: 'Milet',
    tura: 7,
  },
  {
    onAuto: () => {},
    onBattlefield: () => {},
    onCancel: () => {},
    onSave: () => { saveCalled = true; return true; },
  },
);

if (!isPreBattleOpen()) throw new Error('preBattle overlay not open');

const buttons = [...document.querySelectorAll('button')];
const saveBtn = buttons.find(b => b.textContent && b.textContent.includes('Zapisz'));
if (!saveBtn) throw new Error('ZAPISZ button missing on preBattle overlay');

saveBtn.click();

if (!saveCalled) throw new Error('onSave callback not invoked');

const toast = document.body.querySelector('div');
const overlay = document.body.lastElementChild;
const toastText = overlay ? overlay.textContent : '';
if (!toastText.includes('Zapisano')) {
  throw new Error('save toast not shown on overlay, got: ' + toastText.slice(0, 120));
}

hidePreBattle();
if (isPreBattleOpen()) throw new Error('preBattle overlay still open after hide');

console.log('pre-battle-save-test: OK');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(OUT); } catch (_) {}
