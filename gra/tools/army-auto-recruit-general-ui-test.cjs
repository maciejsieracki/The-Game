'use strict';
/**
 * army-auto-recruit-general-ui-test.cjs — R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1
 * Prawdziwy Chromium + prawdziwy moduł ui/empireRecruitPanel.ts: wybór generała rekrutującego w panelu Rekrutacja.
 * Bez generała: przyciski „Rekrutuj” nieaktywne + ostrzeżenie; z generałem: znacznik „rekrutuje”, zamówienie przechodzi;
 * ponowny klik w wybranego odznacza. Zrzuty: dyspozycje/autobot/runs/R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1/.
 * Usage (z gra/): PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node tools/army-auto-recruit-general-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.army-auto-recruit-general-entry.ts');
const OUTFILE = path.resolve(__dirname, '.army-auto-recruit-general-bundle.js');
const SHOT_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { toggleEmpireRecruitPanel, resetEmpireRecruitPanelSession } from '../src/ui/empireRecruitPanel.ts';",
    'window.__api = { toggleEmpireRecruitPanel, resetEmpireRecruitPanelSession };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent' });
  const bundle = fs.readFileSync(OUTFILE, 'utf8');
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.setContent('<!doctype html><html><body style="margin:0;background:#222"></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => {
      window.__orders = [];
      window.__sel = null;
      window.__gens = [
        { id: 'g1', label: 'Wódz 1 — Wojownik (3,4)' },
        { id: 'g2', label: 'Wódz 2 — Łucznik (9,1)' },
      ];
      window.__api.toggleEmpireRecruitPanel({
        getRows: () => [{ id: 'Wojownik', label: 'Wojownik', koszt: 20, capableCities: 2, totalCities: 2, queued: 0 }],
        onOrder: (id, q) => { window.__orders.push([id, q, window.__sel]); return { message: 'Zamówiono ' + q, changed: true, accepted: q }; },
        getGenerals: () => window.__gens,
        getSelectedGeneralId: () => window.__sel,
        onSelectGeneral: id => { window.__sel = id; },
      });
    });
    const q = s => page.evaluate(sel => { const e = document.querySelector(sel); return e ? { disabled: e.disabled === true, text: e.textContent } : null; }, s);
    const setQty = async n => { await page.fill('[data-erp="qty"]', String(n)); await page.dispatchEvent('[data-erp="qty"]', 'change'); };

    await setQty(3);
    check('P1 bez wybranego generała: „Rekrutuj” nieaktywne', (await q('[data-erp="go"]')).disabled === true);
    check('P2 bez wybranego generała: „Rekrutuj wszystkie” nieaktywne', (await q('[data-erp="go-all"]')).disabled === true);
    check('P3 ostrzeżenie o braku generała', ((await q('[data-erp-gen-warn]')) || {}).text?.includes('Wybierz generała') === true);
    check('P4 lista pokazuje 2 generałów z ★', await page.evaluate(() => document.querySelectorAll('[data-erp="gen"]').length === 2 && document.querySelector('[data-erp="gen"]').textContent.includes('★')));
    await page.screenshot({ path: path.join(SHOT_DIR, 'panel-rekrutacja-bez-generala.png') });

    await page.click('[data-gen="g2"]');
    check('P5 wybór generała zapisany w stanie', await page.evaluate(() => window.__sel === 'g2'));
    check('P6 wybrany generał ma znacznik „rekrutuje”', await page.evaluate(() => /rekrutuje/.test(document.querySelector('[data-gen="g2"]').textContent) && !/rekrutuje/.test(document.querySelector('[data-gen="g1"]').textContent)));
    check('P7 po wyborze „Rekrutuj” aktywne (licznik 3 zachowany)', (await q('[data-erp="go"]')).disabled === false);
    await page.screenshot({ path: path.join(SHOT_DIR, 'panel-rekrutacja-z-generalem.png') });
    await page.click('[data-erp="go"]');
    check('P8 zamówienie przeszło z wybranym generałem', await page.evaluate(() => JSON.stringify(window.__orders) === JSON.stringify([['Wojownik', 3, 'g2']])), await page.evaluate(() => window.__orders));
    await page.click('[data-gen="g1"]');
    check('P9 zmiana generała przełącza wybór', await page.evaluate(() => window.__sel === 'g1'));
    await page.click('[data-gen="g1"]');
    check('P10 ponowny klik odznacza -> rekrutacja znów wyłączona', await page.evaluate(() => window.__sel === null) && (await q('[data-erp="go"]')).disabled === true);
    check('P11 brak błędów strony', errs.length === 0, errs);
  } finally {
    await browser.close();
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } }
  }
  console.log(`\narmy-auto-recruit-general-ui-test: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
