'use strict';
/**
 * empire-recruit-all-test.cjs — R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-Q1
 *
 * Prawdziwy Chromium + prawdziwe moduły (esbuild): panel zbiorczy (ui/empireRecruitPanel.ts) z realnym
 * planerem (game/empire-recruit-plan.ts) na fixture 3 miast gracza i skarbcu.
 * Sprawdza: domyślnie 0 (przyciski nieaktywne), dwa przyciski „Rekrutuj wszystkie” (góra/dół),
 * rekrutacja tylko pozycji > 0 przez tę samą ścieżkę onOrder, liczniki → 0 po sukcesie, brak złota
 * (typ odrzucony, licznik zostaje, komunikat PL bez surowego id), częściowy sukces (licznik = reszta).
 * Usage (z gra/): PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node tools/empire-recruit-all-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) { console.error('playwright missing'); process.exit(1); }

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.empire-recruit-all-entry.ts');
const OUTFILE = path.resolve(__dirname, '.empire-recruit-all-bundle.js');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium';

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { toggleEmpireRecruitPanel, refreshEmpireRecruitPanel, getEmpireRecruitDraft, resetEmpireRecruitPanelSession } from '../src/ui/empireRecruitPanel.ts';",
    "import { executeEmpireRecruitment, maxAffordableEmpireRecruits } from '../src/game/empire-recruit-plan.ts';",
    'window.__api = { resetEmpireRecruitPanelSession, toggleEmpireRecruitPanel, refreshEmpireRecruitPanel, getEmpireRecruitDraft, executeEmpireRecruitment, maxAffordableEmpireRecruits };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
  });
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.setContent('<body style="background:#223;margin:0"></body>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    await page.evaluate(() => {
      const st = {
        gold: 1000,
        cities: [{ id: 'c1', q: [] }, { id: 'c2', q: [] }, { id: 'c3', q: [] }],
        types: [
          { id: 'Wojownik', label: 'Wojownik', koszt: 10, only: null },
          { id: 'Taran', label: 'Taran', koszt: 40, only: null },
          { id: 'Wieza_oblezn', label: 'Wieża oblężnicza', koszt: 60, only: ['c2'] },
          { id: 'Procarz', label: 'Procarz', koszt: 12, only: null },
        ],
        purchases: [],
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
          st.purchases.push([id, qty]);
          const afford = window.__api.maxAffordableEmpireRecruits({ gold: st.gold, unitGold: t.koszt, manpower: 1e6, unitManpower: 0 });
          const out = window.__api.executeEmpireRecruitment({
            typLabel: t.label, ilosc: qty, miasta: inputs(id), afford,
            purchase: (cityId, n) => {
              st.gold -= t.koszt * n;
              const c = st.cities.find(x => x.id === cityId);
              for (let i = 0; i < n; i++) c.q.push(id);
              return true;
            },
          });
          return { message: out.message, changed: out.changed, accepted: out.accepted };
        },
      });
    });

    const row = id => page.locator(`#civ-empire-recruit-panel [data-unit="${id}"]`);
    const qty = async id => Number(await row(id).locator('[data-erp="qty"]').inputValue());
    const setQty = async (id, n) => { await row(id).locator('[data-erp="qty"]').fill(String(n)); await row(id).locator('[data-erp="qty"]').dispatchEvent('change'); };
    const allBtns = page.locator('#civ-empire-recruit-panel [data-erp="go-all"]');
    const msg = () => page.locator('#civ-empire-recruit-panel [data-erp-msg]').innerText();
    const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__st)));
    const total = (st, id) => st.cities.reduce((s, c) => s + c.q.filter(x => x === id).length, 0);

    // ---- domyślnie 0 ----
    check('domyślnie licznik 0 dla każdego typu', await qty('Wojownik') === 0 && await qty('Taran') === 0 && await qty('Procarz') === 0);
    check('„Rekrutuj wszystkie” jest na górze i na dole (2 przyciski)', await allBtns.count() === 2);
    check('przy sumie 0 oba „Rekrutuj wszystkie” są nieaktywne', await allBtns.evaluateAll(els => els.every(b => b.disabled)));
    check('pojedyncze „Rekrutuj” nieaktywne przy liczniku 0', await row('Wojownik').locator('[data-erp="go"]').isDisabled());
    check('„−” nieaktywne przy liczniku 0', await row('Wojownik').locator('[data-erp="dec"]').isDisabled());
    check('pole liczby ma min=0 (zgodne z domyślnym 0)', await row('Wojownik').locator('[data-erp="qty"]').getAttribute('min') === '0');
    check('opis panelu opisuje „Rekrutuj wszystkie” (nie stare „nie zerują się”)',
      await page.locator('#civ-empire-recruit-panel .erp-sub').innerText().then(t => /Rekrutuj wszystkie/.test(t) && !/nie zerują/.test(t)));

    // ---- prawdziwa klawiatura + mysz: wpis liczby i pierwszy klik bez dispatchEvent('change') ----
    const wojIn = row('Wojownik').locator('[data-erp="qty"]');
    await wojIn.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('3');
    check('po wpisaniu 3 z klawiatury „Rekrutuj wszystkie” od razu aktywne (bez blur)',
      await allBtns.evaluateAll(els => els.every(b => !b.disabled)));
    check('po wpisaniu 3 z klawiatury „Rekrutuj” tej pozycji aktywne',
      await row('Wojownik').locator('[data-erp="go"]').isEnabled());
    await allBtns.first().click(); // prawdziwy klik myszą: blur pola odpala change, a klik MUSI przejść
    let stReal = await state();
    check('PIERWSZY klik „Rekrutuj wszystkie” po wpisaniu liczby zamawia (onOrder 1 raz, Wojownik 3)',
      JSON.stringify(stReal.purchases) === JSON.stringify([['Wojownik', 3]]), stReal.purchases);
    check('pierwszy klik: Wojownik w kolejce 3', total(stReal, 'Wojownik') === 3, stReal.cities);
    await row('Taran').locator('[data-erp="qty"]').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('2');
    await row('Taran').locator('[data-erp="go"]').click(); // pojedyncze „Rekrutuj” prawdziwą myszą
    stReal = await state();
    check('pojedyncze „Rekrutuj” po wpisaniu 2 zamawia Tarana 2 (ta sama ścieżka)',
      JSON.stringify(stReal.purchases) === JSON.stringify([['Wojownik', 3], ['Taran', 2]]), stReal.purchases);
    check('pojedyncze „Rekrutuj” nie zeruje licznika Tarana', await qty('Taran') === 2, await qty('Taran'));
    // przywrócenie czystego stanu dla dalszych scenariuszy
    await page.evaluate(() => {
      window.__st.purchases.length = 0;
      window.__st.cities.forEach(c => { c.q.length = 0; });
      window.__st.gold = 1000;
    });
    await setQty('Taran', 0);
    await setQty('Wojownik', 0);

    // ---- rekrutacja tylko pozycji > 0 ----
    await setQty('Wojownik', 2);
    await row('Taran').locator('[data-erp="inc"]').click();
    await setQty('Procarz', 3);
    await setQty('Wieza_oblezn', 0);
    check('„Rekrutuj wszystkie” aktywne przy sumie > 0 (góra i dół)', await allBtns.evaluateAll(els => els.every(b => !b.disabled)));
    await allBtns.first().click();
    let st = await state();
    check('zamówione tylko pozycje > 0 (Wojownik 2, Taran 1, Procarz 3)',
      JSON.stringify(st.purchases) === JSON.stringify([['Wojownik', 2], ['Taran', 1], ['Procarz', 3]]), st.purchases);
    check('Wieża (licznik 0) nie została zamówiona', total(st, 'Wieza_oblezn') === 0);
    check('w kolejkach: Wojownik 2, Taran 1, Procarz 3',
      total(st, 'Wojownik') === 2 && total(st, 'Taran') === 1 && total(st, 'Procarz') === 3, st.cities);
    check('koszt pobrany: 2×10 + 1×40 + 3×12 = 96 → złoto 904', st.gold === 904, st.gold);
    check('po sukcesie liczniki wracają do 0', await qty('Wojownik') === 0 && await qty('Taran') === 0 && await qty('Procarz') === 0);
    check('po sukcesie „Rekrutuj wszystkie” znów nieaktywne (suma 0)', await allBtns.evaluateAll(els => els.every(b => b.disabled)));
    const msg1 = await msg();
    check('komunikat potwierdza rekrutację wszystkich (3 z 3)', /Rekrutacja wszystkich: przyjęto 3 z 3/.test(msg1), msg1);

    // ---- brak złota: typ odrzucony zostaje z licznikiem; sukces nie cofnięty ----
    await page.evaluate(() => { window.__st.gold = 25; });
    await setQty('Wojownik', 2);   // 20 złota — mieści się
    await setQty('Taran', 1);      // 40 — nie stać
    await allBtns.last().click();   // dolny przycisk
    st = await state();
    check('Wojownik przyjęty mimo odrzucenia Tarana (4 łącznie)', total(st, 'Wojownik') === 4, st.cities);
    check('Taran odrzucony: w kolejce nadal 1 (nic nie dodano)', total(st, 'Taran') === 1, st.cities);
    check('Taran odrzucony: licznik zostaje 1', await qty('Taran') === 1, await qty('Taran'));
    check('Wojownik po sukcesie licznik 0', await qty('Wojownik') === 0);
    const msg2 = await msg();
    check('komunikat: „Nie przeszło”, pozycja po nazwie, powód PL, bez surowego id',
      /Nie przeszło/.test(msg2) && /Taran/.test(msg2) && /za mało złota/.test(msg2) && !/Wieza_oblezn|_oblezn/.test(msg2), msg2);

    // ---- częściowy sukces: złoto na 2 z 3 sztuk ----
    await page.evaluate(() => { window.__st.gold = 25; });
    await setQty('Taran', 0);
    await setQty('Procarz', 3);    // 36 — stać na 2 (24), nie na 3
    await allBtns.first().click();
    st = await state();
    check('częściowy: Procarz przyjęty 2 z 3 (łącznie 5)', total(st, 'Procarz') === 5, st.cities);
    check('częściowy: licznik Procarza = pozostała 1', await qty('Procarz') === 1, await qty('Procarz'));
    const msg3 = await msg();
    check('częściowy: komunikat „Nie przeszło” wymienia Procarza', /Nie przeszło/.test(msg3) && /Procarz/.test(msg3), msg3);

    // ---- reset sesji ----
    await page.evaluate(() => window.__api.resetEmpireRecruitPanelSession());
    check('reset sesji: liczniki znów 0', await page.evaluate(() => window.__api.getEmpireRecruitDraft('Procarz') === 0));

    check('brak błędów konsoli/strony', errors.length === 0, errors);
  } finally {
    await browser.close();
  }
  console.log(`\nempire-recruit-all-test: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
