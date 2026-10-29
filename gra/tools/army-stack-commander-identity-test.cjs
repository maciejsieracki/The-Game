'use strict';
/** Real Chromium renderer/pointer regression for commander identity in a large map roster. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'army-stack-commander-identity-'));
const ENTRY = path.join(TMP, 'entry.ts');
const OUT = path.join(TMP, 'bundle.js');
const BRAND_STUB = path.join(TMP, 'brandAssets-stub.ts');
const MAIN = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');

async function main() {
  const stateBuilder = MAIN.match(/function buildArmyStackHudStateInner\(\): ArmyStackHudState \| null \{[\s\S]*?\n    function /);
  if (!stateBuilder || !/armyStackCardIdentity\([\s\S]*?u,[\s\S]*?u\.isGeneral === true\s*\?\s*armyLeaderTitle\(empireBuiltIdsForOwner\(u\.ownerId\)\)/.test(stateBuilder[0])) {
    throw new Error('map Army panel state builder no longer maps RuntimeUnit.isGeneral through the tested identity helper');
  }
  const SAVE = fs.readFileSync(path.join(GRA, 'src/game/save.ts'), 'utf8');
  const snapshot = MAIN.match(/function buildSaveGameSnapshot\(label\?: string\): SaveGame \{[\s\S]*?\n    function /);
  if (!snapshot || !/units:\s*units\.slice\(\)\s*,/.test(snapshot[0]))
    throw new Error('production save snapshot no longer persists the runtime unit array');
  if (!/units:\s*Array\.isArray\(obj\.units\)\s*\?\s*\(obj\.units as RuntimeUnit\[\]\)\s*:\s*\[\]/.test(SAVE))
    throw new Error('production save loader no longer restores the runtime unit array');

  fs.writeFileSync(BRAND_STUB, `
export const brandIconSvg = (_id: string, _size?: number) => '';
export const unitIconSvg = (_def?: unknown, _id?: string) => '';
export const CIV_BRAND_SCOPE_VARS = '';
export const ensureBrandRootTokens = () => {};
`);
  fs.writeFileSync(ENTRY, `
import { createArmyStackHud } from ${JSON.stringify(path.join(GRA, 'src/ui/armyStackHud.ts'))};
import { armyStackCardIdentity } from ${JSON.stringify(path.join(GRA, 'src/ui/armyStackHud.ts'))};
import { deserializeGame, serializeGame } from ${JSON.stringify(path.join(GRA, 'src/game/save.ts'))};
const combat = { atakBase: 4, atakEffective: 4, obronaBase: 4, obronaEffective: 4,
  hpMaxBase: 26, hpMaxEffective: 26, pancerzBase: 2, pancerzEffective: 2 };
const ordinary = (i: number) => ({ id: 'warrior-' + i, typeId: 'Wojownik', isGeneral: false });
const create = (title: 'Wódz' | 'Generał') => {
  const units = Array.from({ length: 89 }, (_v, i) => ordinary(i));
  units[43] = { ...ordinary(43), id: 'commander-unique-id', isGeneral: true };
  const cards = units.map(unit => ({ id: unit.id,
    ...armyStackCardIdentity(unit, unit.typeId, unit.isGeneral ? title : undefined),
    icon: '', hp: 26, hpMax: 26, ruchLeft: 12, ruchMax: 12, active: false }));
  let selected = '';
  const api = createArmyStackHud({ getStack: () => ({ hexLabel: '(1,2)', unitCount: 89, cards,
    combat, mov: 12, rng: 0, hp: 26, actions: [] }), onSelectUnit: id => { selected = id; },
    onAction: () => {}, onClose: () => {} });
  return { api, selected: () => selected };
};
window.__saveRoundTrip = () => {
  const units = [
    { id: 'saved-leader', ownerId: 0, typeId: 'Wojownik', isGeneral: true,
      category: 'piechota', q: 1, r: 1, ruch: 12, ruchLeft: 12 },
    { id: 'saved-ordinary', ownerId: 0, typeId: 'Wojownik', isGeneral: false,
      category: 'piechota', q: 2, r: 1, ruch: 12, ruchLeft: 12 },
  ];
  const payload = { wersja: 3, tura: 1, units, cities: [], exploredByHuman: [],
    gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0 };
  return deserializeGame(serializeGame(payload)).units;
};
(window as any).__create = create;
(window as any).__identity = armyStackCardIdentity;
`);
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUT, absWorkingDir: GRA,
    plugins: [{ name: 'brand-asset-stub', setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
    } }],
    logLevel: 'silent',
  });

  let browser;
  try { browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] }); }
  catch (_error) {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium', args: ['--no-sandbox'] });
  }
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent('<!doctype html><html><head></head><body></body></html>');
    await page.addScriptTag({ path: OUT });
    const savedUnits = await page.evaluate(() => window.__saveRoundTrip());
    const savedLeader = savedUnits.find(unit => unit.id === 'saved-leader');
    const savedOrdinary = savedUnits.find(unit => unit.id === 'saved-ordinary');
    if (savedLeader?.isGeneral !== true || savedOrdinary?.isGeneral !== false)
      throw new Error('production serializeGame/deserializeGame did not preserve leader vs ordinary RuntimeUnit roles');
    const persistedLeaderIdentity = await page.evaluate(() => window.__identity(
      { isGeneral: true }, 'Wojownik', 'Wódz'));
    const persistedOrdinaryIdentity = await page.evaluate(() => window.__identity(
      { isGeneral: false }, 'Wojownik', 'Wódz'));
    if (persistedLeaderIdentity.name !== 'Wojownik' || persistedLeaderIdentity.commanderTitle !== 'Wódz')
      throw new Error('production army-stack identity helper did not label the saved leader');
    if (persistedOrdinaryIdentity.name !== 'Wojownik' || persistedOrdinaryIdentity.commanderTitle !== undefined)
      throw new Error('ordinary same-type RuntimeUnit was marked as commander');
    for (const title of ['Wódz', 'Generał']) {
      await page.evaluate((role) => {
        const h = window.__create(role);
        window.__roster = h;
      }, title);
      const card = page.locator('[data-commander="true"]');
      if (await page.locator('.ash-card').count() !== 89) throw new Error('large roster did not render all 89 cards');
      if (await card.count() !== 1) throw new Error(`${title}: expected one uniquely marked commander card`);
      if (await card.getAttribute('data-unit') !== 'commander-unique-id') throw new Error(`${title}: commander id changed`);
      if ((await card.innerText()).includes(title) === false || (await card.innerText()).includes('Wojownik') === false) {
        throw new Error(`${title}: title and preserved combat type are not both visible`);
      }
      if (await card.getAttribute('aria-label') !== `${title} — Wojownik`) throw new Error(`${title}: accessible label missing type/title`);
      if (await card.locator('.ash-card-commander-mark').count() !== 1) throw new Error(`${title}: visible commander marker missing`);
      if (await card.locator('.ash-card-mv').innerText() !== '12/12 ruch') throw new Error(`${title}: movement display changed`);
      if (await page.locator('.ash-card-name').count() !== 88) throw new Error('ordinary labels changed or commander duplicated as ordinary label');
      await card.click(); // Playwright sends a real browser pointer click.
      const selected = await page.evaluate(() => window.__roster.selected());
      if (selected !== 'commander-unique-id') throw new Error(`${title}: pointer selected ${selected}, expected commander id`);
      const stats = await page.locator('.ash-body').innerText();
      if (!stats.includes('4') || !stats.includes('26')) throw new Error('commander selection changed the rendered combat stats/HP');
      console.log(`PASS: 89-card Chromium roster uniquely labels/selects ${title}; unit remains Wojownik with original HP/combat display`);
      await page.evaluate(() => document.querySelector('.civ-army-stack')?.remove());
      await page.evaluate(() => document.getElementById('civ-army-stack-hud-css-v2-1e')?.remove());
    }
    console.log('PASS: production serializeGame/deserializeGame preserves isGeneral for equal-type units');
    console.log('PASS: production identity helper marks only the isGeneral unit and preserves unit type');
    console.log('5/5 PASS');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});
