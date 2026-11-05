'use strict';
/**
 * R-WEB-UI-ARMY-PANEL-GENERAL-LABEL-MULTISELECT-Q1 — regresja panelu armii:
 *  (1) generał/wódz odróżnialny i zawsze PIERWSZY na liście stosu (karta stosu + panel podziału),
 *  (2) wielokrotne zaznaczanie kart (pole wyboru, „Zaznacz wszystko” bez generała, „Odznacz”),
 *  (3) akcja „Rozwiąż” działa na zaznaczony zbiór (statyczne strażniki main.ts + potwierdzenie).
 * Chromium: realny DOM z buildUnitContextTooltipHtml / createSidePanelHud / showArmySplitPanel.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'army-panel-general-label-multiselect-'));
const ENTRY = path.join(TMP, 'entry.ts');
const OUT = path.join(TMP, 'bundle.js');
const BRAND_STUB = path.join(TMP, 'brandAssets-stub.ts');
const BRAND_TOKENS_STUB = path.join(TMP, 'brandTokenVars-stub.ts');
const SHOT = process.env.ARMY_PANEL_SHOT || '';
const MAIN = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');

let passed = 0;
function pass(msg) { passed += 1; console.log('PASS: ' + msg); }

function staticGuards() {
  const builder = MAIN.match(/function buildArmyStackHudStateInner\(\): ArmyStackHudState \| null \{[\s\S]*?\n    function /);
  if (!builder || !/sortArmyStackGeneralsFirst\(stack\.map\(/.test(builder[0]))
    throw new Error('stack builder no longer sorts generals first');
  if (!/picked: pickedIds\.has\(u\.id\)/.test(builder[0]))
    throw new Error('stack cards no longer carry the multi-select pick flag');
  if (!/pickedCount > 0 \? 'ROZWI\\u0104\\u017b ZAZNACZONE \('/.test(builder[0]))
    throw new Error('disband label no longer reflects the picked set');
  if (!/actionId === 'disband'\) \{\s*disbandSelectedOrPickedUnits\(u\);/.test(MAIN))
    throw new Error('disband action no longer routes through the picked-set handler');
  if (!/actionId\.startsWith\('pick:'\)/.test(MAIN) || !/'pick-all'/.test(MAIN) || !/'pick-none'/.test(MAIN))
    throw new Error('pick actions missing from handleSelectedUnitHudAction');
  if (!/window\.confirm\(msg\)/.test(MAIN) || !/'Rozwiązać ' \+ formatJednostkiCount/.test(MAIN))
    throw new Error('multi-disband lost its confirmation prompt');
  if (!/\.\.\.\(u\.isGeneral === true \? \{ commanderTitle: armyLeaderTitle/.test(MAIN))
    throw new Error('split-panel rows no longer carry the commander title');
  pass('static guards: main.ts stack builder, pick actions, multi-disband confirm, split rows');
}

const CHROMIUM_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
].filter(p => p && fs.existsSync(p));

async function main() {
  staticGuards();

  fs.writeFileSync(BRAND_STUB, `
export const brandIconSvg = (_id: string, _size?: number) => '';
export const mapResourceIconSvg = (_id: string, _size?: number) => '';
export const terrainIconSvg = (_id: string, _size?: number) => '';
export const unitIconSvg = (_def?: unknown, _id?: string) => '';
export const CIV_BRAND_SCOPE_VARS = '';
export const ensureBrandRootTokens = () => {};
`);
  fs.writeFileSync(BRAND_TOKENS_STUB, `
export const ensureBrandRootTokens = () => {};
export const CIV_BRAND_SCOPE_VARS = '';
`);
  fs.writeFileSync(ENTRY, `
import { armyStackCardLabel, sortArmyStackGeneralsFirst } from ${JSON.stringify(path.join(GRA, 'src/ui/armyStackLabel.ts'))};
import { buildUnitContextTooltipHtml, UNIT_CONTEXT_PANEL_CSS } from ${JSON.stringify(path.join(GRA, 'src/ui/hexContextTooltip.ts'))};
import { createSidePanelHud } from ${JSON.stringify(path.join(GRA, 'src/ui/sidePanelHud.ts'))};
import { showArmySplitPanel, hideArmySplitPanel } from ${JSON.stringify(path.join(GRA, 'src/ui/armySplitPanel.ts'))};
import { showArmyMergePanel } from ${JSON.stringify(path.join(GRA, 'src/ui/armyMergePanel.ts'))};
import { showArmyMergePickPanel } from ${JSON.stringify(path.join(GRA, 'src/ui/armyMergePickPanel.ts'))};
const combat = { atakBase: 4, atakEffective: 4, obronaBase: 4, obronaEffective: 4,
  hpMaxBase: 26, hpMaxEffective: 26, pancerzBase: 2, pancerzEffective: 2 };
const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// 12 jednostek: generał stoi w ŚRODKU stosu (indeks 7) — ma trafić na pierwsze miejsce.
const stackUnits = (title: 'Wódz' | 'Generał') => Array.from({ length: 12 }, (_v, i) => ({
  id: i === 7 ? 'general-id' : 'warrior-' + i,
  name: 'Wojownik',
  commanderTitle: i === 7 ? title : undefined,
  icon: '', hp: 26, hpMax: 26, ruchLeft: 12, ruchMax: 12, active: i === 0,
}));
const renderStackPanel = (title: 'Wódz' | 'Generał', picked: string[]) => buildUnitContextTooltipHtml({
  displayName: 'Armia · (1,2)', q: 1, r: 2, ruchLeft: 12, ruchMax: 12,
  combat, expanded: false, esc,
  stackCards: stackUnits(title).map(c => ({ ...c, picked: picked.includes(c.id) })),
  actions: [{ id: 'disband', label: picked.length ? 'ROZWIĄŻ ZAZNACZONE (' + picked.length + ')' : 'ROZWIĄŻ', danger: true }],
});
window.__renderStackPanel = renderStackPanel;
window.__sortIds = (units: Array<{ id: string; commanderTitle?: 'Wódz' | 'Generał' }>) =>
  sortArmyStackGeneralsFirst(units).map(u => u.id);
window.__label = (card: { name: string; commanderTitle?: 'Wódz' | 'Generał' }) => armyStackCardLabel(card);
window.__mountStack = (picked: string[]) => {
  const log: string[] = [];
  let selected = '';
  const api = createSidePanelHud({
    getEvents: () => [],
    getContextPanel: () => ({ kind: 'unit', ownUnit: true, expandable: true, expandInHtml: true,
      html: renderStackPanel('Generał', picked) }),
    onContextSelectUnit: (id: string) => { selected = id; },
    onContextAction: (id: string) => { log.push(id); },
  });
  document.body.append(api.el, api.ctxEl);
  return { api, log, selected: () => selected };
};
const mergeRows = () => Array.from({ length: 12 }, (_v, i) => ({
  id: i === 7 ? 'general-id' : 'warrior-' + i,
  name: 'Wojownik', icon: '', ruchLeft: 12, ruchMax: 12,
  commanderTitle: i === 7 ? 'Generał' : undefined,
}));
window.__mergePanel = () => showArmyMergePanel({
  hexLabel: '(1,2)',
  existing: mergeRows(),
  arriving: { id: 'arr', name: 'Wojownik', icon: '', ruchLeft: 12, ruchMax: 12 },
  onMerge: () => {}, onSeparate: () => {},
});
window.__mergePickPanel = () => showArmyMergePickPanel({
  hexLabel: '(1,2)',
  sourceUnits: mergeRows(),
  targets: [{ q: 2, r: 2, label: '(2,2)', units: mergeRows().slice(0, 2) }],
  onMerge: () => {}, onCancel: () => {},
});
window.__splitPanel = (onSplit: (ids: string[]) => void) => {
  showArmySplitPanel({
    hexLabel: '(1,2)',
    units: [
      { id: 'w1', name: 'Wojownik', icon: '', ruchLeft: 12, ruchMax: 12 },
      { id: 'w2', name: 'Wojownik', icon: '', ruchLeft: 12, ruchMax: 12 },
      { id: 'g1', name: 'Wojownik', icon: '', ruchLeft: 12, ruchMax: 12, commanderTitle: 'Generał' },
    ],
    destHexes: [{ q: 2, r: 2, label: '(2,2)' }],
    onSplit: (ids) => onSplit(ids),
    onCancel: () => {},
  });
};
window.__hideSplit = () => hideArmySplitPanel();
window.__css = UNIT_CONTEXT_PANEL_CSS;
`);
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUT, absWorkingDir: GRA,
    plugins: [{ name: 'brand-asset-stub', setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: BRAND_TOKENS_STUB }));
    } }],
    logLevel: 'silent',
  });

  // Chromium: domyślna przeglądarka Playwright, potem PLAYWRIGHT_CHROMIUM_EXECUTABLE, potem znane ścieżki w sandboxie.
  // Brak działającej przeglądarki = błąd (exit 1), nigdy ciche PASS.
  let browser;
  try { browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] }); }
  catch (firstError) {
    let launched = null;
    for (const executablePath of CHROMIUM_CANDIDATES) {
      try { launched = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] }); break; }
      catch (_e) { /* następna ścieżka */ }
    }
    if (!launched) throw new Error('Chromium niedostępny (próbowano: ' + CHROMIUM_CANDIDATES.join(', ') + '): ' + firstError.message);
    browser = launched;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent('<!doctype html><html><head></head><body></body></html>');
    await page.addScriptTag({ path: OUT });
    await page.addStyleTag({ content: await page.evaluate(() => window.__css) });

    // (1a) Sortowanie: generał ze środka stosu trafia na pierwsze miejsce, reszta w kolejności.
    const ids = await page.evaluate(() => window.__sortIds([
      { id: 'a' }, { id: 'b' }, { id: 'g', commanderTitle: 'Generał' }, { id: 'c' },
    ]));
    if (JSON.stringify(ids) !== JSON.stringify(['g', 'a', 'b', 'c'])) throw new Error('sort: general not first or order not stable: ' + ids);
    pass('sortArmyStackGeneralsFirst puts the general first and keeps the rest in order');

    // (1b) Etykieta: rola + typ dla generała, sama nazwa dla zwykłej jednostki.
    const labels = await page.evaluate(() => [
      window.__label({ name: 'Wojownik', commanderTitle: 'Wódz' }),
      window.__label({ name: 'Wojownik', commanderTitle: 'Generał' }),
      window.__label({ name: 'Wojownik' }),
    ]);
    if (labels[0] !== 'Wódz — Wojownik' || labels[1] !== 'Generał — Wojownik' || labels[2] !== 'Wojownik')
      throw new Error('label helper output mismatch: ' + JSON.stringify(labels));
    pass('armyStackCardLabel: "Generał — Wojownik" / "Wódz — Wojownik" / plain "Wojownik"');

    // (1c) Karta stosu: generał pierwszy w DOM, z rolą widoczną i aria-label.
    await page.evaluate(() => { document.body.innerHTML = window.__renderStackPanel('Generał', []); });
    const firstCard = page.locator('.sp-unit-stack-card').first();
    if (await firstCard.getAttribute('data-unit') !== 'general-id') throw new Error('stack panel: general card is not first');
    if (await firstCard.getAttribute('data-commander') !== 'true') throw new Error('stack panel: first card not marked commander');
    if (!(await firstCard.innerText()).includes('★ Generał')) throw new Error('stack panel: role label missing on general card');
    pass('stack panel renders the general first with visible "★ Generał" role and type "Wojownik"');

    // (2a) Pasek zaznaczania: licznik + pola wyboru na każdej karcie.
    if (await page.locator('.sp-unit-pick').count() !== 12) throw new Error('stack panel: expected one pick checkbox per card');
    if (!(await page.locator('[data-pick-count]').innerText()).includes('Zaznacz do rozwiązania (12)'))
      throw new Error('stack panel: idle pick counter text wrong');

    // (2b) Zaznaczenie 3 kart przez prawdziwe kliknięcia; kliknięcie w pole NIE zmienia wybranej jednostki.
    const mounted = await page.evaluate(() => { document.body.innerHTML = ''; window.__stack = window.__mountStack([]); return true; });
    if (!mounted) throw new Error('side panel did not mount');
    for (const id of ['warrior-1', 'warrior-2', 'warrior-3']) {
      await page.locator(`.sp-unit-pick[data-pick="${id}"]`).click();
    }
    const log = await page.evaluate(() => window.__stack.log.slice());
    if (JSON.stringify(log) !== JSON.stringify(['pick:warrior-1', 'pick:warrior-2', 'pick:warrior-3']))
      throw new Error('pick clicks did not route to pick actions: ' + JSON.stringify(log));
    const selectedAfterPick = await page.evaluate(() => window.__stack.selected());
    if (selectedAfterPick !== '') throw new Error('clicking a pick checkbox changed the unit selection: ' + selectedAfterPick);
    pass('clicking 3 pick checkboxes routes pick:<id> x3 and leaves unit selection untouched');

    // (2c) Ze zaznaczeniem: licznik, „Odznacz” aktywne, etykieta akcji mówi o zbiorze.
    await page.evaluate(() => { document.body.innerHTML = ''; window.__stack.api.destroy(); });
    await page.evaluate(() => { document.body.innerHTML = window.__renderStackPanel('Generał', ['warrior-1', 'warrior-2', 'warrior-3']); });
    const counter = await page.locator('[data-pick-count]').innerText();
    if (counter !== 'Zaznaczono 3 z 12') throw new Error('picked counter mismatch: ' + counter);
    if (await page.locator('.sp-unit-stack-card.picked').count() !== 3) throw new Error('picked cards not highlighted');
    if (await page.locator('[data-act="pick-none"]').isDisabled()) throw new Error('"Odznacz" disabled while picks exist');
    if (await page.locator('.uc-act-disband').innerText() !== 'ROZWIĄŻ ZAZNACZONE (3)')
      throw new Error('disband label does not reflect the 3 picked units');
    pass('picked state renders "Zaznaczono 3 z 12", 3 highlighted cards, and "ROZWIĄŻ ZAZNACZONE (3)"');

    // (2d) „Zaznacz wszystko” przez prawdziwy klik: generał pozostaje niezaznaczony.
    await page.evaluate(() => { document.body.innerHTML = ''; window.__stack = window.__mountStack([]); });
    await page.locator('[data-act="pick-all"]').click();
    if (JSON.stringify(await page.evaluate(() => window.__stack.log)) !== '["pick-all"]')
      throw new Error('pick-all button did not route');
    pass('"Zaznacz wszystko" routes pick-all (general exclusion enforced in main.ts pickAllNonGeneralsOnStack)');

    // Zrzut PO: panel stosu z zaznaczonymi jednostkami + panel podziału z generałem.
    await page.evaluate(() => { document.body.innerHTML = window.__renderStackPanel('Generał', ['warrior-1', 'warrior-2', 'warrior-3']); });
    if (SHOT) {
      await page.setViewportSize({ width: 560, height: 720 });
      await page.screenshot({ path: path.join(SHOT, 'po-panel-stosu-zaznaczanie.png'), fullPage: true });
    }

    // (1d) Panel podziału: generał pierwszy z etykietą roli; zaznacz 2 → status liczy 2 z 3.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => { document.body.innerHTML = ''; window.__splitResult = null; window.__splitPanel((ids) => { window.__splitResult = ids; }); });
    const firstRow = page.locator('.civ-asp-u').first();
    if (!(await firstRow.getAttribute('class') || '').includes('cmd')) throw new Error('split panel: general row not first/marked');
    if (!(await firstRow.innerText()).includes('Generał — Wojownik')) throw new Error('split panel: general row label missing role');
    pass('split panel lists "Generał — Wojownik" first');
    // Domyślnie zaznaczona jest ostatnia jednostka wejściowa (generał): zdejmij ją, zaznacz dwie pozostałe.
    await page.locator('.civ-asp-u').nth(0).locator('input').uncheck({ force: true });
    await page.locator('.civ-asp-u').nth(1).locator('input').check({ force: true });
    await page.locator('.civ-asp-u').nth(2).locator('input').check({ force: true });
    const splitStatus = await page.locator('[data-status]').innerText();
    if (!splitStatus.includes('Zaznaczono 2 z 3')) throw new Error('split panel multi-select status mismatch: ' + splitStatus);
    pass('split panel multi-select counts "Zaznaczono 2 z 3"');
    await page.evaluate(() => window.__hideSplit());
    await page.evaluate(() => { document.body.innerHTML = ''; });
    // (1d) Panele scalania na czystym DOM (po panelu podziału): generał pierwszy z etykietą roli.
    await page.evaluate(() => { document.body.innerHTML = ''; window.__mergePanel(); });
    const mergeNames = await page.locator('.civ-amp-row-name').allInnerTexts();
    if (mergeNames[0] !== 'Generał — Wojownik') throw new Error('merge panel: general row not first or unlabelled: ' + mergeNames[0]);
    if (mergeNames.slice(1).some(n => n !== 'Wojownik')) throw new Error('merge panel: non-general rows mislabelled');
    pass('merge panel (scalanie): first row "Generał — Wojownik", the rest "Wojownik"');
    await page.evaluate(() => { document.body.innerHTML = ''; window.__mergePickPanel(); });
    const pickNames = await page.locator('.civ-ampk-u-name').allInnerTexts();
    if (pickNames[0] !== 'Generał — Wojownik') throw new Error('merge pick panel: general row not first or unlabelled: ' + pickNames[0]);
    pass('merge pick panel (wybór jednostek do scalenia): general first with role label');


    console.log(`${passed}/${passed} PASS`);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});
