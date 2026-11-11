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
  await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020', outfile: OUT, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent' });
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
        queued: { alpha: 2, beta: 1 },
        types: [
          { id: 'alpha', label: 'Wojownik', koszt: 10, manpowerCost: 3, stockCost: { drewno: 2 } },
          { id: 'beta', label: 'Taran', koszt: 40, manpowerCost: 0, stockCost: { drewno: 2, zelazo: 1 } },
        ],
        calls: [],
      };
      window.__state = state;
      const rows = () => state.types.map(t => ({ ...t, capableCities: 1, totalCities: 1, queued: state.queued[t.id] || 0 }));
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
    check('aggregate queued count separated from selected basket', /Już w kolejkach: 3/.test(await summary()) && /Wybrane w koszyku: 0/.test(await summary()), await summary());

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
      JSON.stringify(after.calls) === JSON.stringify([['beta', 2]]) && after.queued.beta === 2 && after.budget.stockPool.drewno === 0 && await qty('beta') === 1, after);
    check('stale affordability preview is rechecked against live resources at click', /brakuje 2 Drewno/.test(await summary()));
    check('queued and selected totals remain distinct after backend refresh',
      /Już w kolejkach: 4/.test(await summary()) && /Wybrane w koszyku: 1/.test(await summary()), await summary());

    await alphaInput.fill('1000'); await alphaInput.dispatchEvent('input'); await alphaInput.dispatchEvent('change');
    check('manual entry clamps to panel max 999', await qty('alpha') === 999);
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
