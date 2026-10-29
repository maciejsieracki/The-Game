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
  if (!stateBuilder || !/u\.isGeneral === true[\s\S]*?commanderTitle: armyLeaderTitle\(empireBuiltIdsForOwner\(u\.ownerId\)\)/.test(stateBuilder[0])) {
    throw new Error('map Army panel state builder no longer maps RuntimeUnit.isGeneral through armyLeaderTitle');
  }
  const adapterContract = (source) => {
    const builder = source.match(/function buildArmyStackHudStateInner\(\): ArmyStackHudState \| null \{[\s\S]*?\n    function /);
    return !!builder && /u\.isGeneral === true[\s\S]*?commanderTitle: armyLeaderTitle\(empireBuiltIdsForOwner\(u\.ownerId\)\)/.test(builder[0]);
  };
  const mutatedBuilder = stateBuilder[0].replace('u.isGeneral === true', 'u.isGeneral === false');
  if (adapterContract(MAIN.replace(stateBuilder[0], mutatedBuilder)))
    throw new Error('adapter regression guard missed a mutation that disables commander identification');

  fs.writeFileSync(BRAND_STUB, `
export const brandIconSvg = (_id: string, _size?: number) => '';
export const unitIconSvg = (_def?: unknown, _id?: string) => '';
export const CIV_BRAND_SCOPE_VARS = '';
export const ensureBrandRootTokens = () => {};
`);
  fs.writeFileSync(ENTRY, `
import { createArmyStackHud } from ${JSON.stringify(path.join(GRA, 'src/ui/armyStackHud.ts'))};
const combat = { atakBase: 4, atakEffective: 4, obronaBase: 4, obronaEffective: 4,
  hpMaxBase: 26, hpMaxEffective: 26, pancerzBase: 2, pancerzEffective: 2 };
const ordinary = (i: number) => ({ id: 'warrior-' + i, name: 'Wojownik', icon: '', hp: 26,
  hpMax: 26, ruchLeft: 12, ruchMax: 12, active: false });
const create = (title: 'Wódz' | 'Generał') => {
  const cards = Array.from({ length: 89 }, (_v, i) => ordinary(i));
  cards[43] = { ...ordinary(43), id: 'commander-unique-id', commanderTitle: title };
  let selected = '';
  const api = createArmyStackHud({ getStack: () => ({ hexLabel: '(1,2)', unitCount: 89, cards,
    combat, mov: 12, rng: 0, hp: 26, actions: [] }), onSelectUnit: id => { selected = id; },
    onAction: () => {}, onClose: () => {} });
  return { api, selected: () => selected };
};
(window as any).__create = create;
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
    console.log('PASS: adapter source mutation disabling isGeneral -> commanderTitle mapping is rejected');
    console.log('3/3 PASS');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});
