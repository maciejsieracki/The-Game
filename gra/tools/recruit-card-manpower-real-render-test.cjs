'use strict';
/**
 * recruit-card-manpower-real-render-test.cjs — R-REKRUTACJA-KARTY-BRAK-REKRUTOW-Q1
 *
 * Real Chromium/Playwright proof for the recruitment-card manpower contract. It
 * mounts the actual cityPanel.appendUnitRecruitCompactRow and the actual
 * buildUnitRecruitCard, then measures the rendered DOM (not source text):
 * available recruits, required recruits, shortfall, button state, tooltip,
 * resource chip, and the purchase callback.
 *
 * Scenarios: no recruits + no wood, partial recruit pool, and full pool. The
 * --mutate mode replaces the production card's manpower-status render call with
 * a no-op; the same live assertions must then fail.
 *
 * Run from gra/: node tools/recruit-card-manpower-real-render-test.cjs
 * Negative control: node tools/recruit-card-manpower-real-render-test.cjs --mutate
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const UNIT_CARD_TS = path.join(GRA, 'src', 'ui', 'unitRecruitCard.ts');
const BRAND_STUB = path.join(__dirname, '.stubs', 'recruit-strip-brandAssets-stub.ts');
const OWL_STUB = path.join(__dirname, '.stubs', 'recruit-strip-scienceOwlIcon-stub.ts');
const LEADER_STUB = path.join(__dirname, '.stubs', 'recruit-strip-leaderPortraits-stub.ts');
const MUZYKA_STUB = path.join(__dirname, '.stubs', 'recruit-strip-muzyka-stub.ts');
const ENTRY = path.join(__dirname, '.recruit-card-manpower-entry.ts');
const OUTFILE = path.join(__dirname, '.recruit-card-manpower-bundle.js');
const MUTANT_OUTFILE = path.join(__dirname, '.recruit-card-manpower-mutant-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MUTATE = process.argv.includes('--mutate');

let esbuild;
let chromium;
try {
  esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
  ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright')));
} catch (e) {
  console.error('[recruit-card-manpower-real-render-test] esbuild/playwright missing; run npm install from gra/');
  process.exit(1);
}

const BASE_CSS = `
  :root{--muted:#c8b898;--fg:#eee;--border:#596170;}
  body{margin:0;background:#101722;color:#eee;font:16px monospace;}
  .civ-cs{width:440px;padding:12px;background:#151c27;}
  .bld-compact-row{display:flex;align-items:center;gap:.45em;padding:.2em .38em;margin-bottom:.16em;background:#202936;border:1px solid #596170;border-radius:6px;cursor:help;}
  .bld-compact-ic{width:1.65em;height:1.65em;flex:none;display:flex;align-items:center;justify-content:center;}
  .bld-compact-actions{flex:0 0 auto;display:flex;gap:.28em;margin-left:auto;}
  .btn{font:inherit;color:#fff;border:1px solid #c8b070;background:#5a4520;border-radius:5px;padding:.25em .55em;}
  .btn:disabled{opacity:.5;}
  .bld-infocard-chip{display:inline-flex;align-items:center;gap:.2em;padding:.05em .28em;color:#c8b898;border:1px solid rgba(232,216,138,.25);border-radius:20px;}
  .bld-infocard-chip.stock-missing{color:#e88a7a;border-color:rgba(232,110,90,.45);}
`;

const stubPlugin = {
  name: 'recruit-card-manpower-stubs',
  setup(build) {
    build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_STUB }));
    build.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
    build.onResolve({ filter: /(^|\/)leaderPortraits$/ }, () => ({ path: LEADER_STUB }));
    build.onResolve({ filter: /(^|\/)muzyka-antyczna$/ }, () => ({ path: MUZYKA_STUB }));
  },
};

function mutatedUnitCardPlugin() {
  const real = fs.readFileSync(UNIT_CARD_TS, 'utf8');
  const needle = `  const manpowerStatus = buildManpowerStatus({\n    available: manpowerAvailable,\n    required: manpowerRequired,\n  });`;
  const occurrences = real.split(needle).length - 1;
  if (occurrences !== 1) {
    throw new Error(`mutation anchor expected once, found ${occurrences}`);
  }
  const mutated = real.replace(needle, '  const manpowerStatus = null; // MUTATED-OUT');
  return {
    name: 'recruit-card-manpower-mutant',
    setup(build) {
      build.onResolve({ filter: /(^|\/)unitRecruitCard$/ }, () => ({
        path: UNIT_CARD_TS,
        namespace: 'recruit-card-manpower-mutant',
      }));
      build.onLoad({ filter: /.*/, namespace: 'recruit-card-manpower-mutant' }, () => ({
        contents: mutated,
        loader: 'ts',
        resolveDir: path.dirname(UNIT_CARD_TS),
      }));
    },
  };
}

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log('PASS: ' + name);
  } else {
    fail++;
    console.log('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail)));
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (first) {
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function buildBundle(outfile) {
  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel, appendUnitRecruitCompactRow } from '../src/ui/cityPanel';",
    "import { UNIT_RECRUIT_CARD_CSS } from '../src/ui/unitRecruitCard';",
    "import { unitManpowerCostForType, formatManpower } from '../src/game/manpower';",
    'window.__api = { configureCityPanel, appendUnitRecruitCompactRow, UNIT_RECRUIT_CARD_CSS, unitManpowerCostForType, formatManpower };',
    '',
  ].join('\n'), 'utf8');
  const plugins = [stubPlugin];
  if (MUTATE) plugins.push(mutatedUnitCardPlugin());
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins,
    logLevel: 'silent',
  });
}

async function main() {
  let browser;
  let page;
  const shotDir = process.env.RECRUIT_MANPOWER_SHOT_DIR
    || fs.mkdtempSync(path.join(os.tmpdir(), 'civ-recruit-card-manpower-shots-'));
  fs.mkdirSync(shotDir, { recursive: true });
  console.log('[zrzuty] katalog zrzutow tego przebiegu: ' + shotDir);

  try {
    await buildBundle(OUTFILE);
    browser = await launchBrowser();
    page = await browser.newPage({ viewport: { width: 520, height: 360 } });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    page.on('console', message => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });
    await page.setContent('<div id="root" class="civ-cs"></div>');
    await page.addStyleTag({ content: BASE_CSS });
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
    await page.addStyleTag({ content: await page.evaluate(() => window.__api.UNIT_RECRUIT_CARD_CSS) });

    const unitsJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
    const wojownik = unitsJson.find(u => u && u.Jednostka === 'Wojownik');
    if (!wojownik) throw new Error('units.json: brak Wojownika');
    const expectedWoodCost = wojownik['Surowiec (ilość)'];

    const run = (available, stock) => page.evaluate(({ udef, available, stock }) => {
      const A = window.__api;
      const root = document.getElementById('root');
      root.innerHTML = '';
      let purchases = 0;
      // Deliberately keep the local city pool at zero: the card must read the
      // owner-wide hook, exactly like the purchase guard, not City.manpower.
      const city = { id: 'm1', ownerId: 0, population: 10, manpower: 0, surowce: { ...stock } };
      const data = { units: [udef], buildings: [], civs: [], tech: [] };
      A.configureCityPanel({
        data,
        getCities: () => [city],
        getEpoch: () => 1,
        getCivBonusy: () => [],
        getEmpireRekruciTotal: () => available,
        getTreasury: () => 100,
        onPurchaseUnit: () => { purchases++; },
      });
      const required = A.unitManpowerCostForType(udef.Jednostka, 1, 1);
      const item = { id: udef.Jednostka, nazwa: udef.Jednostka, koszt: 10, kind: 'jednostka' };
      A.appendUnitRecruitCompactRow(root, city, item, data, 100);
      const status = root.querySelector('.unit-recruit-manpower');
      const summary = status ? status.querySelector('.unit-recruit-manpower-summary') : null;
      const shortfall = root.querySelector('.unit-recruit-manpower-missing');
      const button = root.querySelector('button');
      const woodChip = root.querySelector('.bld-infocard-chip.stock-missing');
      const beforeClick = purchases;
      if (button) button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return {
        available,
        cityManpower: city.manpower,
        required,
        expectedMissing: Math.max(0, required - available),
        statusText: summary ? summary.textContent : null,
        statusTitle: status ? status.title : null,
        statusAvailable: status ? status.dataset.available : null,
        statusRequired: status ? status.dataset.required : null,
        statusMissing: status ? status.dataset.missing : null,
        statusVisible: !!status && (() => { const r = status.getBoundingClientRect(); return r.width > 0 && r.height > 0; })(),
        shortfallText: shortfall ? shortfall.textContent : null,
        buttonDisabled: button ? button.disabled : null,
        buttonTitle: button ? button.title : null,
        woodChipClass: woodChip ? woodChip.className : null,
        text: root.textContent,
        beforeClick,
        purchases,
      };
    }, { udef: wojownik, available, stock });

    const requiredProbe = await run(0, { drewno: 50 });
    const required = requiredProbe.required;
    const format = value => page.evaluate(value => window.__api.formatManpower(value), value);
    const requiredLabel = await format(required);

    console.log('\n-- BRAK REKRUTÓW + BRAK DREWNA --');
    const none = await run(0, {});
    await page.screenshot({ path: path.join(shotDir, 'recruit-card-manpower-none-plus-no-wood.png'), fullPage: true });
    const requiredMissing = requiredLabel;
    check('B1: karta ma widoczny tekstowy status rekrutów', none.statusVisible, none);
    check('B2: status opisuje dostępne i potrzebne wartości',
      none.statusText === `Rekruci: dostępne 0 / potrzebne ${requiredLabel}`, none.statusText);
    check('B3: status pokazuje brakującą pulę',
      none.shortfallText === `Brakuje: ${requiredMissing}`, none.shortfallText);
    check('B4: data attributes przechowują available/required/missing',
      none.statusAvailable === '0'
        && none.statusRequired === String(required)
        && none.statusMissing === String(required),
      none);
    check('B5: czerwony koszt Drewna pozostaje widoczny przy braku Drewna',
      /stock-missing/.test(none.woodChipClass || '')
        && none.text.includes(`${expectedWoodCost} Drewno`),
      { className: none.woodChipClass, expectedWoodCost, text: none.text });
    check('B6: brak rekrutów i brak Drewna są osobno w tooltipie',
      /Brakuje rekrutów/.test(none.buttonTitle || '') && /Brakuje w magazynie/.test(none.buttonTitle || ''),
      none.buttonTitle);
    check('B7: Rekrutuj jest disabled i klik nie kupuje',
      none.buttonDisabled === true && none.purchases === none.beforeClick,
      none);

    console.log('\n-- CZĘŚCIOWA PULA REKRUTÓW --');
    const partialAvailable = Math.floor(required / 2);
    const partial = await run(partialAvailable, { drewno: 50 });
    await page.screenshot({ path: path.join(shotDir, 'recruit-card-manpower-partial.png'), fullPage: true });
    const partialAvailableLabel = await format(partialAvailable);
    const partialMissingLabel = await format(required - partialAvailable);
    check('B8: częściowa pula pokazuje dostępne / potrzebne',
      partial.statusText === `Rekruci: dostępne ${partialAvailableLabel} / potrzebne ${requiredLabel}`,
      partial.statusText);
    check('B9: częściowa pula pokazuje dokładny shortfall',
      partial.shortfallText === `Brakuje: ${partialMissingLabel}`
        && partial.statusMissing === String(required - partialAvailable),
      partial);
    check('B10: brak rekrutów blokuje przy częściowym stanie i wskazuje przyczynę',
      partial.buttonDisabled === true && /Brakuje rekrutów/.test(partial.buttonTitle || ''),
      partial);
    check('B11: wystarczające Drewno nie jest oznaczone jako brakujące',
      !/stock-missing/.test(partial.woodChipClass || ''), partial.woodChipClass);

    console.log('\n-- PEŁNA PULA REKRUTÓW --');
    const full = await run(required, { drewno: 50 });
    check('B12: pełna pula pokazuje dostępne / potrzebne',
      full.statusText === `Rekruci: dostępne ${requiredLabel} / potrzebne ${requiredLabel}`,
      full.statusText);
    check('B13: pełna pula nie pokazuje fałszywego shortfallu',
      full.shortfallText === null && full.statusMissing === '0', full);
    check('B14: pełna pula odblokowuje Rekrutuj',
      full.buttonDisabled === false && !/Brakuje/.test(full.buttonTitle || ''), full);
    check('B15: karta czyta pulę imperium, nie lokalny City.manpower',
      full.cityManpower === 0 && full.buttonDisabled === false, full);
    check('B16: istniejąca rekrutacja nadal wywołuje callback',
      full.purchases === full.beforeClick + 1, full);

    await page.screenshot({ path: path.join(shotDir, MUTATE ? 'recruit-card-manpower-mutated.png' : 'recruit-card-manpower-full.png'), fullPage: true });
    check('B17: brak błędów pageerror/console.error', pageErrors.length === 0, pageErrors);

    console.log(`\nrecruit-card-manpower-real-render-test${MUTATE ? ' [MUTACJA]' : ''}: ${pass} passed, ${fail} failed`);
    process.exitCode = fail > 0 ? 1 : 0;
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    for (const file of [ENTRY, OUTFILE, MUTANT_OUTFILE]) {
      try { fs.unlinkSync(file); } catch (e) { /* ignore */ }
    }
  }
}

main().catch(error => {
  console.error('[recruit-card-manpower-real-render-test] ERROR', error);
  process.exitCode = 1;
});
