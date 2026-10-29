'use strict';
/**
 * pre-battle-defender-retreat-test.cjs — defenderCanRetreat pokazuje Wycofaj na ekranie pre-bitwy.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[pre-battle-defender-retreat-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const ENTRY = path.join(__dirname, '.pre-battle-defender-retreat-entry.ts');
const OUT = path.join(__dirname, '.pre-battle-defender-retreat-bundle.cjs');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const STUB_FILE = path.resolve(STUB_DIR, 'pre-battle-brandAssets-stub.ts');

fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(
  STUB_FILE,
  [
    "export function terrainIconSvg() { return ''; }",
    "export function civIconSvg() { return ''; }",
    "export function brandIconSvg() { return ''; }",
  ].join('\n'),
  'utf8',
);

fs.writeFileSync(
  ENTRY,
  "export { showPreBattle, hidePreBattle, isPreBattleOpen } from '../src/ui/preBattle.ts';\n",
  'utf8',
);

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets-prebattle',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
    build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: STUB_FILE }));
    build.onResolve({ filter: /leaderPortraits$/ }, () => ({
      path: path.join(STUB_DIR, 'leaderPortraits-stub.ts'),
    }));
    build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
      path: path.join(STUB_DIR, 'audio-stub.ts'),
    }));
    build.onResolve({ filter: /hud$/ }, () => ({
      path: path.join(STUB_DIR, 'hud-stub.ts'),
    }));
  },
};

fs.writeFileSync(path.join(STUB_DIR, 'leaderPortraits-stub.ts'), [
  "export function leaderPortraitUrl() { return null; }",
  "export function leaderName() { return ''; }",
].join('\n'), 'utf8');
fs.writeFileSync(path.join(STUB_DIR, 'audio-stub.ts'), [
  "export function startPreBattleMusic() {}",
  "export function stopPreBattleMusic() {}",
].join('\n'), 'utf8');
fs.writeFileSync(path.join(STUB_DIR, 'hud-stub.ts'), [
  "export function setArmyStackHudSuppressed() {}",
].join('\n'), 'utf8');

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: OUT,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    plugins: [stubBrandAssetsPlugin],
  });

  const { showPreBattle, hidePreBattle, isPreBattleOpen } = require(OUT);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;

  const baseInfo = {
    atakujacy: {
      nazwa: 'Wróg',
      ownerId: 2,
      units: [{ nazwa: 'Wojownik', kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }],
    },
    obronca: {
      nazwa: 'Zwiadowca',
      ownerId: 0,
      units: [{ nazwa: 'Zwiadowca', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }],
    },
    teren: 'Rownina',
    szanseAtkPct: 72,
    miejsce: 'Pole',
    tura: 3,
    canRetreat: false,
    defenderCanRetreat: true,
  };

  let cancelCalled = false;
  showPreBattle(
    baseInfo,
    {
      onAuto: () => {},
      onBattlefield: () => {},
      onCancel: () => { cancelCalled = true; },
    },
  );

  if (!isPreBattleOpen()) throw new Error('preBattle overlay not open');

  const overlay = document.body.lastElementChild;
  const text = overlay ? overlay.textContent : '';
  if (!text.includes('WRÓG ATAKUJE')) throw new Error('defender UI kicker missing');
  if (!text.includes('Broni się:')) throw new Error('defender title missing');

  const buttons = [...document.querySelectorAll('button')];
  const retreatBtn = buttons.find(b => b.textContent && b.textContent.includes('Wycofaj'));
  if (!retreatBtn) throw new Error('Wycofaj button missing when defenderCanRetreat=true');

  const noRetreat = overlay.querySelector('.pb-noretreat');
  if (noRetreat) throw new Error('noRetreat bar should not show when defenderCanRetreat=true');

  retreatBtn.click();
  if (!cancelCalled) throw new Error('onCancel not invoked on Wycofaj click');

  hidePreBattle();

  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false },
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
  );
  const buttons2 = [...document.querySelectorAll('button')];
  if (buttons2.some(b => b.textContent && b.textContent.includes('Wycofaj'))) {
    throw new Error('Wycofaj should be hidden when defenderCanRetreat=false');
  }
  const noRetreat2 = document.body.lastElementChild?.querySelector('.pb-noretreat');
  if (!noRetreat2) throw new Error('noRetreat bar expected when retreat disabled');
  hidePreBattle();

  let autoCalled = false;
  let manualCalled = false;
  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false },
    { onAuto: () => { autoCalled = true; }, onBattlefield: () => { manualCalled = true; }, onCancel: () => {} },
    { manualControlAllowed: false },
  );
  const gatedButtons = [...document.querySelectorAll('button')];
  const deployButton = gatedButtons.find(b => b.dataset.act === 'deploy');
  const autoButton = gatedButtons.find(b => b.dataset.act === 'auto');
  if (!deployButton || deployButton.disabled) throw new Error('manual battle choice must remain available without a commander');
  if (!autoButton || autoButton.disabled) throw new Error('Auto must remain enabled without a commander');
  const commanderNote = document.body.lastElementChild?.querySelector('.pb-note')?.textContent ?? '';
  if (!commanderNote.includes('walka rozegra się automatycznie')) {
    throw new Error('without a commander, the note must explain that the selected battlefield fight resolves automatically');
  }
  deployButton.click();
  if (!manualCalled) throw new Error('manual battlefield choice must enter the field even without a commander');
  if (isPreBattleOpen()) throw new Error('manual battlefield choice must dismiss pre-battle prompt');
  hidePreBattle();

  autoCalled = false;
  manualCalled = false;
  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false },
    { onAuto: () => { autoCalled = true; }, onBattlefield: () => { manualCalled = true; }, onCancel: () => {} },
    { defaultAction: 'manual', manualControlAllowed: false },
  );
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  if (!manualCalled || autoCalled) throw new Error('Enter should preserve the manual-vs-auto choice and default to battlefield even without a commander');
  hidePreBattle();

  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false },
    { onAuto: () => { autoCalled = true; }, onBattlefield: () => { manualCalled = true; }, onCancel: () => {} },
    { defaultAction: 'auto', manualControlAllowed: false },
  );
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  if (!autoCalled) throw new Error('explicit defaultAction=auto must still choose Auto without a commander');
  hidePreBattle();

  autoCalled = false;
  manualCalled = false;
  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false },
    { onAuto: () => { autoCalled = true; }, onBattlefield: () => { manualCalled = true; }, onCancel: () => {} },
    { manualControlAllowed: true },
  );
  const commanderButtons = [...document.querySelectorAll('button')];
  const commanderDeploy = commanderButtons.find(b => b.dataset.act === 'deploy');
  if (!commanderDeploy || commanderDeploy.disabled) throw new Error('manual battle choice remains enabled with a commander');
  commanderDeploy.click();
  if (!manualCalled) throw new Error('manual battlefield choice remains functional with a commander');
  hidePreBattle();

  autoCalled = false;
  manualCalled = false;
  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false },
    { onAuto: () => { autoCalled = true; }, onBattlefield: () => { manualCalled = true; }, onCancel: () => {} },
    { manualControlAllowed: false },
  );
  const autoButton2 = [...document.querySelectorAll('button')].find(b => b.dataset.act === 'auto');
  if (!autoButton2 || autoButton2.disabled) throw new Error('Auto must remain enabled without a commander');
  autoButton2.click();
  if (!autoCalled) throw new Error('Auto action must still resolve without a commander');
  hidePreBattle();

  autoCalled = false;
  manualCalled = false;
  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false },
    { onAuto: () => { autoCalled = true; }, onBattlefield: () => { manualCalled = true; }, onCancel: () => {} },
    { automaticOnly: true, manualControlAllowed: true },
  );
  if (!autoCalled || manualCalled) throw new Error('automatic-only setting must resolve Auto without offering manual deployment');
  if (isPreBattleOpen()) throw new Error('automatic-only setting must not open the pre-battle choice overlay');

  console.log('pre-battle-defender-retreat-test: OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
