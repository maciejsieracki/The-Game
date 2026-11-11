'use strict';
/** Focused affordability preview + shared basket UI contract for the empire recruitment panel. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.empire-recruit-affordability-entry.ts');
const OUT = path.resolve(__dirname, '.empire-recruit-affordability-bundle.js');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium';
const MUTANT = process.env.EMPIRE_RECRUIT_AFFORDABILITY_MUTANT;
let pass = 0, fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail))); }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { toggleEmpireRecruitPanel, getEmpireRecruitDraft, resetEmpireRecruitPanelSession } from '../src/ui/empireRecruitPanel.ts';",
    "import { maxAffordableEmpireRecruits, executeEmpireRecruitment, summarizeEmpireRecruitBasket } from '../src/game/empire-recruit-plan.ts';",
    'window.__api = { toggleEmpireRecruitPanel, getEmpireRecruitDraft, resetEmpireRecruitPanelSession, maxAffordableEmpireRecruits, executeEmpireRecruitment, summarizeEmpireRecruitBasket };',
  ].join('\n'), 'utf8');
  const plugins = MUTANT === 'allow-queued-only' ? [{
    name: 'allow-queued-only-mutant',
    setup(build) {
      build.onLoad({ filter: /empireRecruitPanel\.ts$/ }, args => {
        const source = fs.readFileSync(args.path, 'utf8');
        const needle = 'const orderable = r.capableCities > 0;';
        if (!source.includes(needle)) throw new Error('queued-only mutant anchor not found');
        return { contents: source.replace(needle, 'const orderable = true;'), loader: 'ts' };
      });
    },
  }] : [];
  await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020', outfile: OUT, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, plugins, logLevel: 'silent' });
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setContent('<body style="margin:0;background:#101722"></body>');
    await page.addScriptTag({ content: fs.readFileSync(OUT, 'utf8') });
    await page.evaluate(() => {
      const state = {
        budget: { gold: 100, manpower: 12, stockPool: { drewno: 3, zelazo: 1 } },
        queued: { alpha: 2, beta: 1, queuedOnly: 1 },
        types: [
          { id: 'alpha', label: 'Wojownik', koszt: 10, manpowerCost: 3, stockCost: { drewno: 2 } },
          { id: 'beta', label: 'Taran', koszt: 40, manpowerCost: 0, stockCost: { drewno: 2, zelazo: 1 } },
          { id: 'queuedOnly', label: 'Stara jednostka', koszt: 0, manpowerCost: 50, stockCost: { drewno: 50 } },
        ],
        calls: [],
      };
      window.__state = state;
      const rows = () => state.types.map(t => ({ ...t, capableCities: t.id === 'queuedOnly' ? 0 : 1, totalCities: 1, queued: state.queued[t.id] || 0,
        blockedReason: t.id === 'queuedOnly' ? 'jednostka niedostępna w tym mieście' : undefined }));
      const order = (id, qty) => {
        const t = state.types.find(x => x.id === id);
        state.calls.push([id, qty]);
        const budget = state.budget;
        const afford = window.__api.maxAffordableEmpireRecruits({
          gold: budget.gold, unitGold: t.koszt, manpower: budget.manpower, unitManpower: t.manpowerCost,
          stockPool: budget.stockPool, unitStock: t.stockCost,
        });
        const out = window.__api.executeEmpireRecruitment({ typLabel: t.label, ilosc: qty, afford,
          miasta: [{ cityId: 'c1', canRecruit: true, queuedOfType: state.queued[id] || 0, queueLength: 0 }],
          purchase: (_cityId, n) => {
            state.budget.gold -= t.koszt * n;
            state.budget.manpower -= t.manpowerCost * n;
            for (const [k, v] of Object.entries(t.stockCost)) state.budget.stockPool[k] -= v * n;
            state.queued[id] = (state.queued[id] || 0) + n;
            return true;
          },
        });
        return { message: out.message, changed: out.changed, accepted: out.accepted };
      };
      window.__api.toggleEmpireRecruitPanel({ getRows: rows, getBudget: () => ({ ...state.budget, stockPool: { ...state.budget.stockPool } }), onOrder: order });
    });
    const row = id => page.locator(`#civ-empire-recruit-panel [data-unit="${id}"]`);
    const qty = async id => Number(await row(id).locator('[data-erp="qty"]').inputValue());
    const summary = () => page.locator('[data-erp-summary]').innerText();

    check('queued counts visible per type', (await row('alpha').locator('[data-erp-queued]').innerText()) === '2'
      && (await row('beta').locator('[data-erp-queued]').innerText()) === '1');
    check('aggregate queued count includes queued-only type, separate from selected basket', /Już w kolejkach: 4/.test(await summary()) && /Wybrane w koszyku: 0/.test(await summary()), await summary());
    const queuedOnly = row('queuedOnly');
    check('queued-only row stays visible but quantity, plus, minus and Recruit are disabled',
      await queuedOnly.locator('[data-erp="qty"]').isDisabled()
      && await queuedOnly.locator('[data-erp="inc"]').isDisabled()
      && await queuedOnly.locator('[data-erp="dec"]').isDisabled()
      && await queuedOnly.locator('[data-erp="go"]').isDisabled());
    await page.evaluate(() => {
      const input = document.querySelector('#civ-empire-recruit-panel [data-unit="queuedOnly"] [data-erp="qty"]');
      input.value = '7';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    check('queued-only manual input attempt is discarded and excluded from basket',
      await qty('queuedOnly') === 0 && await page.evaluate(() => window.__api.getEmpireRecruitDraft('queuedOnly')) === 0
      && /Wybrane w koszyku: 0/.test(await summary()) && !/brakuje/.test(await summary()), await summary());

    const alphaInput = row('alpha').locator('[data-erp="qty"]');
    await alphaInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.type('1');
    const betaInput = row('beta').locator('[data-erp="qty"]');
    await betaInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.type('1');
    check('manual typing refreshes basket total without losing input', await qty('alpha') === 1 && await qty('beta') === 1
      && /Wybrane w koszyku: 2/.test(await summary())
      && (await row('alpha').locator('[data-erp-selected]').innerText()) === '1'
      && (await row('beta').locator('[data-erp-selected]').innerText()) === '1');
    check('shared stock is not reused across types: combined basket shows one missing wood',
      /brakuje 1 Drewno/.test(await summary()) && await page.locator('[data-erp="go-all"]').evaluate(b => b.classList.contains('is-shortfall')),
      await summary());
    check('each type remains individually affordable while bulk basket is red',
      !(await row('alpha').locator('[data-erp="go"]').evaluate(b => b.classList.contains('is-shortfall')))
      && !(await row('beta').locator('[data-erp="go"]').evaluate(b => b.classList.contains('is-shortfall'))));

    await row('alpha').locator('[data-erp="inc"]').click();
    check('plus updates row-level exact shortfall', /brakuje 1 Drewno/.test(await row('alpha').locator('[data-erp-row-shortfall]').innerText()));
    await alphaInput.fill('0'); await alphaInput.dispatchEvent('input'); await alphaInput.dispatchEvent('change');
    await betaInput.fill('2'); await betaInput.dispatchEvent('input'); await betaInput.dispatchEvent('change');
    await page.evaluate(() => { window.__state.budget.stockPool.drewno = 2; }); // resources change after preview
    await page.locator('[data-erp="go-all"]').click();
    const after = await page.evaluate(() => ({ calls: window.__state.calls, budget: window.__state.budget, queued: window.__state.queued }));
    check('bulk order records partial backend acceptance and keeps remainder',
      JSON.stringify(after.calls) === JSON.stringify([['beta', 2]]) && !after.calls.some(([id]) => id === 'queuedOnly')
      && after.queued.beta === 2 && after.budget.stockPool.drewno === 0 && await qty('beta') === 1, after);
    check('stale affordability preview is rechecked against live resources at click', /brakuje 2 Drewno/.test(await summary()));
    check('queued and selected totals remain distinct after backend refresh',
      /Już w kolejkach: 5/.test(await summary()) && /Wybrane w koszyku: 1/.test(await summary()), await summary());

    await alphaInput.fill('1000'); await alphaInput.dispatchEvent('input'); await alphaInput.dispatchEvent('change');
    check('manual entry clamps to panel max 999', await qty('alpha') === 999);
    const boundary = await page.evaluate(() => {
      const s = window.__api.summarizeEmpireRecruitBasket;
      const exact = s([{ quantity: 2, unitGold: 10, unitManpower: 3, unitStock: { drewno: 2 } }],
        { gold: 20, manpower: 6, stockPool: { drewno: 4 } });
      const over = s([{ quantity: 2, unitGold: 10, unitManpower: 3, unitStock: { drewno: 2 } }],
        { gold: 19, manpower: 6, stockPool: { drewno: 4 } });
      const zeroCost = s([{ quantity: 3, unitGold: 0, unitManpower: 0, unitStock: {} }],
        { gold: 0, manpower: 0, stockPool: {} });
      const zeroPool = s([{ quantity: 1, unitGold: 5, unitManpower: 0, unitStock: { zelazo: 0 } }],
        { gold: 5, manpower: 0, stockPool: { zelazo: 0 } });
      return { exact, over, zeroCost, zeroPool };
    });
    check('basket exactly equal to balance is affordable (no shortfall)',
      boundary.exact.affordable && boundary.exact.goldShortfall === 0 && boundary.exact.manpowerShortfall === 0
      && Object.keys(boundary.exact.stockShortfall).length === 0, boundary.exact);
    check('basket one unit over gold balance is short by exactly 1',
      !boundary.over.affordable && boundary.over.goldShortfall === 1 && Object.keys(boundary.over.stockShortfall).length === 0, boundary.over);
    check('zero-cost line adds no gold, manpower or stock need and is affordable with empty pools',
      boundary.zeroCost.affordable && boundary.zeroCost.quantity === 3 && boundary.zeroCost.goldNeeded === 0
      && boundary.zeroCost.manpowerNeeded === 0 && Object.keys(boundary.zeroCost.stockNeeded).length === 0, boundary.zeroCost);
    check('zero-stock line with zero resource pool is affordable (no phantom stock shortfall)',
      boundary.zeroPool.affordable && Object.keys(boundary.zeroPool.stockNeeded).length === 0, boundary.zeroPool);
    check('zero page errors', errors.length === 0, errors);
    await page.evaluate(() => window.__api.resetEmpireRecruitPanelSession());
  } finally {
    await browser.close();
    for (const file of [ENTRY, OUT]) { try { fs.unlinkSync(file); } catch (_) {} }
  }
  console.log(`\nempire-recruit-affordability-test: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
