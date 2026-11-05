'use strict';
/**
 * empire-recruit-panel-real-render-test.cjs — R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1
 *
 * Prawdziwy Chromium + prawdziwe moduły (esbuild): panel zbiorczy (ui/empireRecruitPanel.ts) z realnym
 * planerem (game/empire-recruit-plan.ts) na fixture 3 miast gracza oraz prawdziwa karta rekrutacji
 * (ui/unitRecruitCard.ts) w scenariuszu części A (niezależne liczniki, brak resetu po „Rekrutuj”,
 * zapamiętanie po przebudowie wierszy). Zrzut: dyspozycje/autobot/runs/R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1/.
 * Mutanty: EMPIRE_RECRUIT_UI_MUTANT=reset-panel|reset-card -> licznik zerowany po „Rekrutuj” -> test musi FAIL.
 * Usage (z gra/): PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium node tools/empire-recruit-panel-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) { console.error('playwright missing'); process.exit(1); }

const GRA = path.resolve(__dirname, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'recruit-card-stock-chip-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.empire-recruit-panel-entry.ts');
const OUTFILE = path.resolve(__dirname, '.empire-recruit-panel-bundle.js');
const SHOT_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium';
const MUT = process.env.EMPIRE_RECRUIT_UI_MUTANT || '';

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const WOJOWNIK = units.find(u => u && u.Jednostka === 'Wojownik');

const plugins = [{
  name: 'stub-brand-assets',
  setup(build) { build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); },
}, {
  name: 'mutants',
  setup(build) {
    build.onLoad({ filter: /(empireRecruitPanel|unitRecruitCard)\.ts$/ }, args => {
      let source = fs.readFileSync(args.path, 'utf8');
      if (MUT === 'reset-panel' && /empireRecruitPanel/.test(args.path)) {
        const m = source.replace('lastMessage = res.message;', 'lastMessage = res.message; drafts.clear();');
        if (m === source) throw new Error('mutant not applied');
        source = m;
      }
      if (MUT === 'reset-card' && /unitRecruitCard/.test(args.path)) {
        const m = source.replace('onRecruit(quantity); // licznik zostaje', 'onRecruit(quantity); setQuantity(1); // licznik zostaje');
        if (m === source) throw new Error('mutant not applied');
        source = m;
      }
      return { contents: source, loader: 'ts' };
    });
  },
}];

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { toggleEmpireRecruitPanel, refreshEmpireRecruitPanel, getEmpireRecruitDraft } from '../src/ui/empireRecruitPanel.ts';",
    "import { buildUnitRecruitCard, UNIT_RECRUIT_CARD_CSS } from '../src/ui/unitRecruitCard.ts';",
    "import { executeEmpireRecruitment, maxAffordableEmpireRecruits } from '../src/game/empire-recruit-plan.ts';",
    'window.__api = { toggleEmpireRecruitPanel, refreshEmpireRecruitPanel, getEmpireRecruitDraft, buildUnitRecruitCard, UNIT_RECRUIT_CARD_CSS, executeEmpireRecruitment, maxAffordableEmpireRecruits };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, plugins, logLevel: 'silent',
  });
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.setContent('<body style="background:#223;margin:0"></body>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    // ---- CZĘŚĆ B: panel zbiorczy, 3 miasta gracza ----
    await page.evaluate(() => {
      const st = {
        gold: 1000,
        cities: [
          { id: 'c1', q: [] }, { id: 'c2', q: [] }, { id: 'c3', q: [] },
        ],
        types: [
          { id: 'Wojownik', label: 'Wojownik', koszt: 10, only: null },
          { id: 'Taran', label: 'Taran', koszt: 40, only: null },
          { id: 'Wieża oblężnicza', label: 'Wieża oblężnicza', koszt: 60, only: ['c2'] },
          { id: 'Procarz', label: 'Procarz', koszt: 12, only: null },
        ],
      };
      window.__st = st;
      const inputs = (id) => {
        const t = st.types.find(x => x.id === id);
        return st.cities.map(c => ({
          cityId: c.id, canRecruit: !t.only || t.only.includes(c.id), blockedReason: 'jednostka niedostępna w tym mieście',
          queuedOfType: c.q.filter(x => x === id).length, queueLength: c.q.length,
        }));
      };
      window.__api.toggleEmpireRecruitPanel({
        getRows: () => st.types.map(t => {
          const inp = inputs(t.id);
          return { id: t.id, label: t.label, koszt: t.koszt, capableCities: inp.filter(i => i.canRecruit).length,
            totalCities: 3, queued: inp.reduce((s, i) => s + i.queuedOfType, 0) };
        }),
        onOrder: (id, qty) => {
          const t = st.types.find(x => x.id === id);
          const afford = window.__api.maxAffordableEmpireRecruits({ gold: st.gold, unitGold: t.koszt, manpower: 1e6, unitManpower: 0 });
          const out = window.__api.executeEmpireRecruitment({
            typLabel: t.label, ilosc: qty, miasta: inputs(id), afford,
            purchase: (cityId, n) => {
              st.gold -= t.koszt * n; // jak ręczna rekrutacja: koszt pobierany przy dodaniu do kolejki
              const c = st.cities.find(x => x.id === cityId);
              for (let i = 0; i < n; i++) c.q.push(id);
              return true;
            },
          });
          return { message: out.message, changed: out.changed };
        },
      });
    });

    const row = id => page.locator(`#civ-empire-recruit-panel [data-unit="${id}"]`);
    const qty = async id => Number(await row(id).locator('[data-erp="qty"]').inputValue());
    const setQty = async (id, n) => { await row(id).locator('[data-erp="qty"]').fill(String(n)); await row(id).locator('[data-erp="qty"]').dispatchEvent('change'); };

    check('panel zbiorczy widoczny z 4 typami', await page.locator('#civ-empire-recruit-panel [data-unit]').count() === 4);
    await setQty('Wojownik', 5);
    for (let i = 0; i < 3; i++) await row('Taran').locator('[data-erp="inc"]').click();
    check('niezależne liczniki: Wojownik 5, Taran 4', await qty('Wojownik') === 5 && await qty('Taran') === 4);
    await row('Wojownik').locator('[data-erp="dec"]').click();
    check('zmniejszenie Wojownika nie rusza Tarana', await qty('Wojownik') === 4 && await qty('Taran') === 4);
    await row('Wojownik').locator('[data-erp="inc"]').click();

    await row('Wojownik').locator('[data-erp="go"]').click();
    let st = await page.evaluate(() => JSON.parse(JSON.stringify(window.__st)));
    const cnt = (cid, id) => st.cities.find(c => c.id === cid).q.filter(x => x === id).length;
    check('5 wojowników na 3 miasta = 2/2/1', cnt('c1', 'Wojownik') === 2 && cnt('c2', 'Wojownik') === 2 && cnt('c3', 'Wojownik') === 1, st.cities);
    check('koszt pobrany jak w ręcznej (5 × 10)', st.gold === 950, st.gold);
    check('po „Rekrutuj” licznik Wojownika NIE zeruje się (5)', await qty('Wojownik') === 5);
    check('po „Rekrutuj” licznik Tarana nietknięty (4)', await qty('Taran') === 4);
    check('stan zamówienia przy typie = 5', (await row('Wojownik').locator('[data-erp-queued]').innerText()) === '5');

    await row('Taran').locator('[data-erp="go"]').click();
    st = await page.evaluate(() => JSON.parse(JSON.stringify(window.__st)));
    check('4 tarany: wyrównanie względem długości kolejki (c3 pierwsze)', cnt('c3', 'Taran') === 2 && cnt('c1', 'Taran') + cnt('c2', 'Taran') === 2, st.cities);
    check('licznik Tarana po zamówieniu zostaje 4, Wojownika 5', await qty('Taran') === 4 && await qty('Wojownik') === 5);

    await setQty('Wieża oblężnicza', 3);
    await row('Wieża oblężnicza').locator('[data-erp="go"]').click();
    st = await page.evaluate(() => JSON.parse(JSON.stringify(window.__st)));
    check('jedno zdolne miasto: 3 wieże w c2', cnt('c2', 'Wieża oblężnicza') === 3 && cnt('c1', 'Wieża oblężnicza') === 0 && cnt('c3', 'Wieża oblężnicza') === 0, st.cities);
    const msg = await page.locator('[data-erp-msg]').innerText();
    check('komunikat potwierdza zamówienie', /Zamówiono 3/.test(msg), msg);

    await page.screenshot({ path: path.join(SHOT_DIR, 'panel-zbiorczy.png') });

    // zamknięcie i ponowne otwarcie: liczniki zapamiętane (sesja UI)
    await page.locator('[data-erp="close"]').click();
    check('panel zamyka się', await page.locator('#civ-empire-recruit-panel').count() === 0);
    check('liczniki przeżywają zamknięcie panelu', await page.evaluate(() => window.__api.getEmpireRecruitDraft('Wojownik') === 5 && window.__api.getEmpireRecruitDraft('Taran') === 4));

    // ---- CZĘŚĆ A: karta rekrutacji w mieście (przebudowa wierszy po „Rekrutuj”) ----
    await page.evaluate(({ unit }) => {
      document.body.innerHTML = '<div class="civ-cs" id="root" style="width:900px;padding:12px;font:16px Arial;color:#e8e0c8;background:#101620"></div>';
      const style = document.createElement('style'); style.textContent = window.__api.UNIT_RECRUIT_CARD_CSS; document.head.appendChild(style);
      const drafts = new Map();
      const recruited = [];
      const mk = (id) => window.__api.buildUnitRecruitCard({
        udef: unit, item: { kind: 'jednostka', id, nazwa: id, koszt: 10 }, data: { units: [unit], buildings: [], civs: [], tech: [] },
        skarb: 1000, canPurchase: true, maxQuantity: 9, treasuryIconHtml: '', mpCost: 1, mpCostLabel: '1',
        initialQuantity: drafts.get(id), onQuantityChange: q => drafts.set(id, q),
        // „rerender” miasta: po zakupie wszystkie wiersze są budowane od nowa
        onRecruit: q => { recruited.push([id, q]); build(); return true; },
      });
      function build() {
        const root = document.getElementById('root'); root.innerHTML = '';
        for (const id of ['Wojownik', 'Taran']) { const c = mk(id); c.dataset.testId = id; root.appendChild(c); }
      }
      window.__recruited = recruited; window.__rebuild = build; build();
    }, { unit: WOJOWNIK });
    const card = id => page.locator(`[data-test-id="${id}"]`);
    const cq = async id => Number(await card(id).locator('.unit-recruit-quantity-input').inputValue());
    for (let i = 0; i < 4; i++) await card('Taran').locator('[data-recruit-quantity-action="increase"]').click();
    for (let i = 0; i < 2; i++) await card('Wojownik').locator('[data-recruit-quantity-action="increase"]').click();
    check('A: niezależne liczniki w mieście (Wojownik 3, Taran 5)', await cq('Wojownik') === 3 && await cq('Taran') === 5);
    await card('Wojownik').locator('.unit-recruit-submit').click();
    check('A: „Rekrutuj” przy Wojowniku zamówiło 3', JSON.stringify(await page.evaluate(() => window.__recruited)) === '[["Wojownik",3]]');
    check('A: po przebudowie panelu licznik Wojownika zostaje 3', await cq('Wojownik') === 3);
    check('A: licznik Tarana NIE wraca do 1 (5)', await cq('Taran') === 5);
    await page.evaluate(() => window.__rebuild()); // kolejna przebudowa panelu (np. updateHud) — stan nadal zapamiętany
    check('A: po kolejnej przebudowie Wojownik 3, Taran 5', await cq('Wojownik') === 3 && await cq('Taran') === 5);

    check('brak błędów konsoli/strony', errors.length === 0, errors);
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
    try { fs.unlinkSync(OUTFILE); } catch (e) { /* ignore */ }
  }
  console.log(`\nempire-recruit-panel-real-render-test: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
