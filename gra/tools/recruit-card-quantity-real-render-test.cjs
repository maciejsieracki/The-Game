'use strict';
/**
 * recruit-card-quantity-real-render-test.cjs — R-REKRUTACJA-WIELE-JEDNOSTEK-UI-Q1
 *
 * Czerwony/regresyjny test prawdziwego komponentu karty rekrutacji w Chromium.
 * Sprawdza kontrolki minus/liczba/plus, min/max, klawiaturę, stan disabled i reset
 * po legalnym potwierdzeniu. Zmiana liczby jest draftem UI: przed potwierdzeniem
 * callback nie może zmienić żadnego zasobu. Po potwierdzeniu callback dostaje całą
 * liczbę q dokładnie raz; fixture emuluje atomowy zakup i dodaje q pojedynczych pozycji.
 *
 * Test uruchamia prawdziwy build `src/ui/unitRecruitCard.ts` przez esbuild oraz
 * prawdziwy Chromium/Playwright — nie jest testem tekstu pliku źródłowego.
 * Kontrola negatywna: `RECRUIT_CARD_QUANTITY_MUTANT=1` uszkadza routing
 * przycisku minus; test musi wtedy zakończyć się FAIL.
 *
 * Usage (z gra/): node tools/recruit-card-quantity-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[recruit-card-quantity-real-render-test] playwright missing');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'recruit-card-stock-chip-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.recruit-card-quantity-entry.ts');
const OUTFILE = path.resolve(__dirname, '.recruit-card-quantity-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const WOJOWNIK = units.find(u => u && u.Jednostka === 'Wojownik');
if (!WOJOWNIK) { console.error('units.json: brak Wojownika'); process.exit(1); }

const stubPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
  },
};

const plugins = [stubPlugin];
if (process.env.RECRUIT_CARD_QUANTITY_MUTANT === '1') {
  plugins.push({
    name: 'mutate-quantity-control-routing',
    setup(build) {
      build.onLoad({ filter: /unitRecruitCard\.ts$/ }, args => {
        const source = fs.readFileSync(args.path, 'utf8');
        const mutated = source.replace(
          "minus.dataset.recruitQuantityAction = 'decrease';",
          "minus.dataset.recruitQuantityAction = 'decrease-mutant';",
        );
        if (mutated === source) throw new Error('mutation target not found');
        return { contents: mutated, loader: 'ts' };
      });
    },
  });
}

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log('PASS: ' + name);
  } else {
    fail++;
    console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : ''));
  }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { buildUnitRecruitCard, UNIT_RECRUIT_CARD_CSS } from '../src/ui/unitRecruitCard.ts';",
    'window.__api = { buildUnitRecruitCard, UNIT_RECRUIT_CARD_CSS };',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins,
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 960, height: 320 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });

  try {
    await page.setContent('<div class="civ-cs" id="root"></div>');
    await page.addStyleTag({ content: `
      .civ-cs { width: 900px; padding: 12px; font: 16px Arial, sans-serif; color: #e8e0c8; background: #101620; }
      .civ-cs .bld-compact-row { display: flex; align-items: center; gap: .45em; min-height: 42px; }
      .civ-cs .bld-compact-ic { width: 28px; height: 28px; flex: none; }
      .civ-cs .bld-compact-actions { display: flex; align-items: center; gap: .28em; margin-left: auto; }
      .civ-cs button, .civ-cs input { font: inherit; }
    ` });
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const cardCss = await page.evaluate(() => window.__api.UNIT_RECRUIT_CARD_CSS);
    await page.addStyleTag({ content: cardCss });

    await page.evaluate(({ unit }) => {
      const root = document.getElementById('root');
      const state = { gold: 100, manpower: 100, stock: 100 };
      const fixture = { state, confirmed: 0, quantities: [], queued: [] };
      window.__quantityFixture = fixture;
      const card = window.__api.buildUnitRecruitCard({
        udef: unit,
        item: { kind: 'jednostka', id: unit.Jednostka, nazwa: unit.Jednostka, koszt: 10 },
        data: { units: [unit], buildings: [], civs: [], tech: [] },
        skarb: state.gold,
        canPurchase: true,
        maxQuantity: 4,
        treasuryIconHtml: '',
        mpCost: 10,
        mpCostLabel: '10',
        onRecruit: quantity => {
          fixture.confirmed++;
          fixture.quantities.push(quantity);
          state.gold -= 10 * quantity;
          state.manpower -= 10 * quantity;
          state.stock -= quantity;
          for (let i = 0; i < quantity; i++) fixture.queued.push(unit.Jednostka);
          return true;
        },
      });
      root.appendChild(card);
    }, { unit: WOJOWNIK });

    const inspect = () => page.evaluate(() => {
      const row = document.querySelector('.unit-recruit-compact-row');
      const input = row?.querySelector('.unit-recruit-quantity-input');
      const minus = row?.querySelector('[data-recruit-quantity-action="decrease"]');
      const plus = row?.querySelector('[data-recruit-quantity-action="increase"]');
      const submit = row?.querySelector('.unit-recruit-submit');
      const rect = element => {
        const r = element?.getBoundingClientRect();
        return r ? { width: r.width, height: r.height } : null;
      };
      const fixture = window.__quantityFixture;
      return {
        hasRow: !!row,
        quantity: input ? Number(input.value) : null,
        min: input?.min ?? null,
        max: input?.max ?? null,
        rowQuantity: row?.dataset.recruitQuantity ?? null,
        rowMaxQuantity: row?.dataset.recruitQuantityMax ?? null,
        minusDisabled: minus ? !!minus.disabled : null,
        plusDisabled: plus ? !!plus.disabled : null,
        inputDisabled: input ? !!input.disabled : null,
        submitDisabled: submit ? !!submit.disabled : null,
        minusLabel: minus?.getAttribute('aria-label') ?? null,
        plusLabel: plus?.getAttribute('aria-label') ?? null,
        inputLabel: input?.getAttribute('aria-label') ?? null,
        rects: { minus: rect(minus), input: rect(input), plus: rect(plus) },
        confirmed: fixture?.confirmed ?? null,
        quantities: fixture?.quantities ?? null,
        queued: fixture?.queued?.length ?? null,
        state: fixture ? { ...fixture.state } : null,
      };
    });

    console.log('\n-- KARTA AKTYWNA: min=1, max=4, wybór bez poboru zasobów --');
    const initial = await inspect();
    check('kontrolki minus/liczba/plus są wyrenderowane',
      initial.hasRow && initial.rects.minus && initial.rects.input && initial.rects.plus,
      initial);
    check('wartość początkowa = 1', initial.quantity === 1 && initial.rowQuantity === '1', initial);
    check('min=1 i max=4 są jawne', initial.min === '1' && initial.max === '4' && initial.rowMaxQuantity === '4', initial);
    check('minus jest disabled na minimum, plus jest aktywny',
      initial.minusDisabled === true && initial.plusDisabled === false, initial);
    check('kontrolki mają etykiety dostępności',
      initial.minusLabel && initial.plusLabel && initial.inputLabel, initial);
    check('kontrolki mają realny rozmiar w Chromium',
      Object.values(initial.rects).every(r => r && r.width > 0 && r.height > 0), initial.rects);
    check('stan zasobów początkowy jest znany',
      initial.confirmed === 0 && initial.state?.gold === 100 && initial.state?.manpower === 100 && initial.state?.stock === 100,
      initial);

    const plus = page.locator('[data-recruit-quantity-action="increase"]');
    const minus = page.locator('[data-recruit-quantity-action="decrease"]');
    const quantity = page.locator('.unit-recruit-quantity-input');
    const submit = page.locator('.unit-recruit-submit');

    if (await plus.count() === 1 && await minus.count() === 1 && await quantity.count() === 1) {
      await plus.click();
      const afterPlus = await inspect();
      check('plus zwiększa liczbę z 1 do 2', afterPlus.quantity === 2 && afterPlus.rowQuantity === '2', afterPlus);
      check('plus nie mutuje zasobów przed potwierdzeniem',
        afterPlus.confirmed === 0 && afterPlus.state?.gold === 100 && afterPlus.state?.manpower === 100 && afterPlus.state?.stock === 100,
        afterPlus);

      await plus.click();
      await plus.click();
      const atMax = await inspect();
      check('plus zatrzymuje się na max=4 i sam staje się disabled',
        atMax.quantity === 4 && atMax.plusDisabled === true, atMax);

      await quantity.focus();
      await quantity.press('ArrowDown');
      const afterKeyboard = await inspect();
      check('klawiatura ArrowDown zmniejsza liczbę', afterKeyboard.quantity === 3, afterKeyboard);
      check('klawiatura także nie mutuje zasobów',
        afterKeyboard.confirmed === 0 && afterKeyboard.state?.gold === 100 && afterKeyboard.state?.manpower === 100 && afterKeyboard.state?.stock === 100,
        afterKeyboard);

      await quantity.fill('999');
      const afterClamp = await inspect();
      check('ręczne wpisanie ponad max jest ograniczone do max',
        afterClamp.quantity === 4 && afterClamp.rowQuantity === '4', afterClamp);

      await minus.click();
      await minus.click();
      await minus.click();
      const atMin = await inspect();
      check('minus zatrzymuje się na min=1 i staje się disabled',
        atMin.quantity === 1 && atMin.minusDisabled === true, atMin);

      await plus.click();
      await plus.click();
      const beforeBatch = await inspect();
      check('wybór liczby >1 odblokowuje batchowe potwierdzenie',
        beforeBatch.quantity === 3 && beforeBatch.submitDisabled === false, beforeBatch);
      await page.evaluate(() => document.querySelector('.unit-recruit-submit')?.click());
      const afterBatchAttempt = await inspect();
      check('batch wywołuje callback dokładnie raz z q=3 i dodaje 3 pozycje',
        afterBatchAttempt.confirmed === 1 && afterBatchAttempt.quantities?.join(',') === '3'
          && afterBatchAttempt.queued === 3,
        afterBatchAttempt);
      check('batch pobiera q-krotność kosztu dopiero po kliknięciu',
        afterBatchAttempt.state?.gold === 70 && afterBatchAttempt.state?.manpower === 70
          && afterBatchAttempt.state?.stock === 97,
        afterBatchAttempt);
      check('po potwierdzeniu batchu licznik resetuje się do 1',
        afterBatchAttempt.quantity === 1 && afterBatchAttempt.rowQuantity === '1', afterBatchAttempt);
      await submit.click();
      const afterConfirm = await inspect();
      check('legalne potwierdzenie 1 jednostki wywołuje callback dokładnie raz',
        afterConfirm.confirmed === 2 && afterConfirm.quantities?.join(',') === '3,1'
          && afterConfirm.queued === 4,
        afterConfirm);
      check('po potwierdzeniu q=1 pobierany jest koszt pojedynczy',
        afterConfirm.state?.gold === 60 && afterConfirm.state?.manpower === 60
          && afterConfirm.state?.stock === 96,
        afterConfirm);
    } else {
      check('interakcje quantity są dostępne dla Playwright', false, 'brak kontrolek');
    }

    console.log('\n-- KARTA ZABLOKOWANA: wszystkie kontrolki disabled --');
    await page.evaluate(({ unit }) => {
      const root = document.getElementById('root');
      const fixture = { confirmed: 0, state: { gold: 5, manpower: 5, stock: 5 } };
      window.__disabledFixture = fixture;
      const card = window.__api.buildUnitRecruitCard({
        udef: unit,
        item: { kind: 'jednostka', id: unit.Jednostka, nazwa: unit.Jednostka, koszt: 10 },
        data: { units: [unit], buildings: [], civs: [], tech: [] },
        skarb: 5,
        canPurchase: false,
        maxQuantity: 4,
        treasuryIconHtml: '',
        mpCost: 10,
        mpCostLabel: '10',
        stockMissingLabel: 'Brakuje zasobów testowych',
        onRecruit: () => { fixture.confirmed++; },
      });
      root.innerHTML = '';
      root.appendChild(card);
    }, { unit: WOJOWNIK });
    const disabled = await page.evaluate(() => {
      const row = document.querySelector('.unit-recruit-compact-row');
      const input = row?.querySelector('.unit-recruit-quantity-input');
      const minus = row?.querySelector('[data-recruit-quantity-action="decrease"]');
      const plus = row?.querySelector('[data-recruit-quantity-action="increase"]');
      const submitButton = row?.querySelector('.unit-recruit-submit');
      return {
        minus: minus ? !!minus.disabled : null,
        input: input ? !!input.disabled : null,
        plus: plus ? !!plus.disabled : null,
        submit: submitButton ? !!submitButton.disabled : null,
        title: submitButton?.getAttribute('title') ?? null,
        rects: [minus, input, plus].map(el => {
          const r = el?.getBoundingClientRect();
          return r ? [r.width, r.height] : null;
        }),
      };
    });
    check('minus/liczba/plus są disabled przy zablokowanej karcie',
      disabled.minus === true && disabled.input === true && disabled.plus === true && disabled.submit === true,
      disabled);
    check('zablokowana karta nadal pokazuje kontrolki w Chromium',
      disabled.rects.every(r => r && r[0] > 0 && r[1] > 0), disabled);
    check('zablokowana karta zachowuje przyczynę w title',
      disabled.title === 'Brakuje zasobów testowych', disabled);
    await page.evaluate(() => document.querySelector('.unit-recruit-submit')?.click());
    const disabledAfterClick = await page.evaluate(() => window.__disabledFixture);
    check('klik disabled nie wywołuje zakupu', disabledAfterClick.confirmed === 0, disabledAfterClick);

    check('brak pageerror/console.error w realnym Chromium', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
    try { fs.unlinkSync(OUTFILE); } catch (e) { /* ignore */ }
  }

  console.log(`\nrecruit-card-quantity-real-render-test: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('[recruit-card-quantity-real-render-test] ERROR', e);
  try { fs.unlinkSync(ENTRY); } catch (err) { /* ignore */ }
  try { fs.unlinkSync(OUTFILE); } catch (err) { /* ignore */ }
  process.exit(1);
});
