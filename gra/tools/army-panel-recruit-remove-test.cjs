'use strict';
/**
 * army-panel-recruit-remove-test.cjs -- R-WEB-ARMY-PANEL-RECRUIT-REMOVE-Q1 (2026-11-03).
 * Prawdziwy Chromium (Playwright) + PRAWDZIWY cityPanel.ts (mountCityRecruitmentCardsForArmy)
 * + PRAWDZIWE funkcje kolejki z game/production.ts (enqueue/dequeue/move/reorder).
 * Stan gry (kolejki miast, skarbiec) trzymany w testowym "silniku"; onCancelRecruitment zwraca
 * koszt do skarbca tak jak main.ts:cancelRecruitmentPurchase (domknięcie w main.ts nie jest
 * importowalne -- weryfikujemy kontrakt: callback wywołany z (cityId, itemId, koszt) raz na ✕).
 * Weryfikuje: panel armii pod KAŻDYM miastem z kolejką pokazuje „Kolejka rekrutacji:" (uchwyt,
 * ikona, nazwa, koszt, „nast. tura", ↑ ↓ ✕); ✕/↑/↓/przeciągnięcie zmieniają REALNĄ kolejkę
 * miasta (stan), nie tylko widok; miasto bez kolejki -- brak sekcji; inne miasto nietknięte;
 * aria-label; brak poziomego przewijania na 360 px.
 *
 * Usage (z gra/): node tools/army-panel-recruit-remove-test.cjs [--shots <katalog>]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch (e) { console.error('playwright missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }

const BRAND_STUB = path.join(__dirname, '.stubs', 'recruit-list-visibility-ui-brandAssets-stub.ts');
const ENTRY = path.join(__dirname, '.army-panel-recruit-remove-entry.ts');
const OUTDIR = fs.mkdtempSync(path.join('/dev/shm', 'army-recruit-remove-'));
const OUTFILE = path.join(OUTDIR, 'bundle.js');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium';
const shotsIdx = process.argv.indexOf('--shots');
const SHOTS = shotsIdx > 0 ? process.argv[shotsIdx + 1] : null;

const stubPlugin = { name: 'stub-brand', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); } };
const globPlugin = {
  name: 'glob-empty',
  setup(b) {
    b.onLoad({ filter: /\/src\/.*\.ts$/ }, async a => {
      const c = await fs.promises.readFile(a.path, 'utf8');
      if (!c.includes('import.meta.glob')) return undefined;
      return { contents: c.replace(/import\.meta\.glob\(/g, '((..._g) => ({}))('), loader: 'ts' };
    });
  },
};
const rawPlugin = {
  name: 'raw',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, a => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, a => ({ contents: 'export default ' + JSON.stringify(fs.readFileSync(a.path, 'utf8')) + ';', loader: 'js' }));
  },
};

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel, mountCityRecruitmentCardsForArmy } from '../src/ui/cityPanel.ts';",
    "import { enqueueRecruitment } from '../src/game/production.ts';",
    "import { UNIT_RECRUIT_CARD_CSS } from '../src/ui/unitRecruitCard.ts';",
    "import unitsJson from '../data/units.json';",
    "import buildingsJson from '../data/buildings.json';",
    'window.__api = { configureCityPanel, mountCityRecruitmentCardsForArmy, enqueueRecruitment, UNIT_RECRUIT_CARD_CSS, units: unitsJson, buildings: buildingsJson };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [stubPlugin, globPlugin, rawPlugin], logLevel: 'silent',
  });

  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  // CSS hosta z prawdziwego empireDetailPanel.ts (reguly .civ-emp-mass-city-recruit-list ...).
  const empSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'empireDetailPanel.ts'), 'utf8').split('\n');
  const i0 = empSrc.findIndex(l => l.startsWith('.civ-emp-mass-city-recruit-list.civ-cs{'));
  const i1 = empSrc.findIndex(l => l.startsWith('.civ-emp-mass-rally{'));
  const empCss = empSrc.slice(i0, i1).join('\n') + '\n' + empSrc.filter(l => /^\.civ-emp-mass-(city|empty)/.test(l)).join('\n');
  if (i0 < 0 || i1 <= i0) throw new Error('nie znaleziono CSS hosta w empireDetailPanel.ts');
  await page.setContent('<!doctype html><html><body style="margin:0;padding:0 16px;background:#1b1712;font:13px system-ui;color:#e8ebf0"><div id="host"></div></body></html>');
  await page.addStyleTag({ content: empCss });
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
  if (await page.evaluate(() => !window.__api)) throw new Error('bundle bez __api: ' + pageErrors.slice(0, 2).join(' | '));

  // Silnik testowy w stronie: stan miast + skarbiec; mount jak w empireDetailPanel (host na miasto).
  await page.evaluate(() => {
    const A = window.__api;
    const mk = (id, name) => ({ id, name, q: 0, r: 0, ownerId: 0, population: 3, surowce: { drewno: 50 } });
    const st = {
      treasury: 100,
      cities: [mk('A', 'Aleksandria'), mk('B', 'Babilon'), mk('C', 'Cuzco')],
      prod: { A: { kolejka: [], postep: 0 }, B: { kolejka: [], postep: 0 }, C: { kolejka: [], postep: 0 } },
      cancelCalls: [],
      changes: 0,
    };
    const item = (id, nazwa, koszt) => ({ kind: 'jednostka', id, nazwa, koszt });
    const W = item('Wojownik', 'Wojownik', 10), O = item('Oszczepnik', 'Oszczepnik', 15), Z = item('Zwiadowca', 'Zwiadowca', 20);
    st.prod.A = A.enqueueRecruitment(A.enqueueRecruitment(A.enqueueRecruitment(st.prod.A, W), O), Z);
    st.prod.B = A.enqueueRecruitment(st.prod.B, O);
    // C: bez kolejki.
    const data = { units: A.units, buildings: A.buildings, civs: [], tech: [] };
    const css = document.createElement('style'); css.textContent = A.UNIT_RECRUIT_CARD_CSS; document.head.appendChild(css);
    const host = document.getElementById('host');
    function mountAll() {
      host.innerHTML = '';
      for (const c of st.cities) {
        const box = document.createElement('div'); box.dataset.mountFor = c.id;
        host.appendChild(box);
        A.mountCityRecruitmentCardsForArmy(c.id, box);
      }
    }
    A.configureCityPanel({
      data,
      getTreasury: () => st.treasury,
      getCities: () => st.cities,
      getEpoch: () => 1,
      getUnlockedTechs: () => [],
      getEmpireRekruciTotal: () => 4000,
      getBuiltBuildingIds: () => [],
      getEmpireBuiltIds: () => [],
      getProduction: id => st.prod[id],
      setProduction: (id, p) => { st.prod[id] = p; },
      // Jak w main.ts: updateHud() odświeża zamontowany panel armii po każdej zmianie kolejki.
      onChange: () => { st.changes++; if (window.__remount) mountAll(); },
      onPurchaseUnit: () => true,
      onCancelRecruitment: (cityId, itemId, koszt) => { st.cancelCalls.push([cityId, itemId, koszt]); st.treasury += koszt; },
    });
    window.__st = st; window.__mountAll = mountAll; window.__remount = true;
    mountAll();
  });

  const q = (sel) => page.locator(sel);
  const names = (city) => page.evaluate(c => (window.__st.prod[c].rekrutacja || []).map(i => i.id), city);
  const rowCount = (city) => page.locator(`[data-mount-for="${city}"] .civ-army-recruit-queue .qitem`).count();
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, 'army-panel-recruit-queue-01-initial.png') }); }

  console.log('\n-- WIDOK: kolejka pod kazdym miastem --');
  check('V1: miasto A (3 poz.) ma sekcje kolejki z 3 wierszami', (await rowCount('A')) === 3, await rowCount('A'));
  check('V2: miasto B (1 poz.) ma 1 wiersz', (await rowCount('B')) === 1);
  check('V3: miasto C bez kolejki -- brak sekcji', (await q('[data-mount-for="C"] .civ-army-recruit-queue').count()) === 0);
  const hdr = await q('[data-mount-for="A"] .civ-army-recruit-queue .gold').first().textContent();
  check('V4: naglowek "Kolejka rekrutacji:" jak w panelu miasta', hdr === 'Kolejka rekrutacji:', hdr);
  const row0 = q('[data-mount-for="A"] .qitem').first();
  check('V5: wiersz ma uchwyt, ikone, koszt, ETA "nast. tura", 3 przyciski',
    (await row0.locator('.qitem-grip').count()) === 1 && (await row0.locator('.qitem-ic').count()) === 1
    && (await row0.locator('.qitem-cost').count()) === 1 && (await row0.locator('.qitem-eta').first().textContent()) === 'nast. tura'
    && (await row0.locator('button').count()) === 3,
    await row0.innerText());
  const labels = await q('[data-mount-for="A"] .qitem button').evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')));
  check('V6: kazdy przycisk ma aria-label', labels.length === 9 && labels.every(l => l && l.length > 5), labels);
  check('V7: ↑ pierwszego i ↓ ostatniego wylaczone',
    await page.evaluate(() => {
      const r = document.querySelectorAll('[data-mount-for="A"] .qitem');
      return r[0].querySelectorAll('button')[0].disabled && r[2].querySelectorAll('button')[1].disabled;
    }));
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  check('V8: brak poziomego przewijania na 360 px', overflow.sw <= overflow.cw, overflow);

  console.log('\n-- USUWANIE (✕) zmienia realny stan --');
  const t0 = await page.evaluate(() => window.__st.treasury);
  await q('[data-mount-for="A"] .qitem').nth(1).locator('button').nth(2).click(); // Oszczepnik (15)
  check('X1: stan A = [Wojownik, Zwiadowca]', JSON.stringify(await names('A')) === '["Wojownik","Zwiadowca"]', await names('A'));
  check('X2: zwrot kosztu do skarbca (+15)', (await page.evaluate(() => window.__st.treasury)) === t0 + 15);
  check('X3: callback anulowania wywolany raz z (A, Oszczepnik, 15)',
    JSON.stringify(await page.evaluate(() => window.__st.cancelCalls)) === '[["A","Oszczepnik",15]]');
  check('X4: widok odswiezony (2 wiersze), B nietkniete (1)', (await rowCount('A')) === 2 && (await rowCount('B')) === 1);
  await q('[data-mount-for="B"] .qitem').first().locator('button').nth(2).click();
  check('X5: usuniecie jedynej pozycji B -- stan pusty, sekcja znika, A bez zmian',
    (await names('B')).length === 0 && (await q('[data-mount-for="B"] .civ-army-recruit-queue').count()) === 0
    && JSON.stringify(await names('A')) === '["Wojownik","Zwiadowca"]');
  check('X6: skarbiec po obu zwrotach = start + 15 + 15', (await page.evaluate(() => window.__st.treasury)) === t0 + 30);

  console.log('\n-- ZMIANA KOLEJNOSCI ↑ ↓ --');
  await q('[data-mount-for="A"] .qitem').nth(0).locator('button').nth(1).click(); // ↓ pierwszego
  check('R1: ↓ zamienia miejscami w stanie [Zwiadowca, Wojownik]', JSON.stringify(await names('A')) === '["Zwiadowca","Wojownik"]', await names('A'));
  await q('[data-mount-for="A"] .qitem').nth(1).locator('button').nth(0).click(); // ↑ drugiego
  check('R2: ↑ przywraca [Wojownik, Zwiadowca]', JSON.stringify(await names('A')) === '["Wojownik","Zwiadowca"]', await names('A'));
  check('R3: zmiana kolejnosci nie dotyka skarbca', (await page.evaluate(() => window.__st.treasury)) === t0 + 30);

  console.log('\n-- PRZECIAGANIE --');
  await page.evaluate(() => {
    const A = window.__api, st = window.__st;
    st.prod.A = A.enqueueRecruitment(st.prod.A, { kind: 'jednostka', id: 'Oszczepnik', nazwa: 'Oszczepnik', koszt: 15 });
    window.__mountAll();
  });
  await page.evaluate(() => {
    const rows = document.querySelectorAll('[data-mount-for="A"] .qitem');
    const dt = new DataTransfer();
    rows[2].dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    rows[0].dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    rows[0].dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  check('D1: przeciagniecie wiersza 3 na 1 zmienia stan', JSON.stringify(await names('A')) === '["Oszczepnik","Wojownik","Zwiadowca"]', await names('A'));
  check('D2: widok zgodny ze stanem', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('[data-mount-for="A"] .qitem')].map(r => r.textContent.slice(0, 20)))).includes('Oszczepnik'));

  console.log('\n-- FALLBACK bez onChange (host nadal w DOM) --');
  await page.evaluate(() => { window.__remount = false; });
  await q('[data-mount-for="A"] .qitem').nth(0).locator('button').nth(2).click();
  check('F1: widok kolejki odswiezony lokalnie (2 wiersze) gdy panel nie jest przebudowany', (await rowCount('A')) === 2 && (await names('A')).length === 2);

  if (SHOTS) {
    await page.evaluate(() => { window.__remount = true; window.__mountAll(); });
    await page.screenshot({ path: path.join(SHOTS, 'army-panel-recruit-queue-02-after-ops.png') });
  }
  console.log('\nBledy strony: ' + pageErrors.length);
  pageErrors.slice(0, 5).forEach(e => console.log('  ' + e.slice(0, 200)));
  check('E0: brak bledow strony', pageErrors.length === 0, pageErrors.slice(0, 2));
  await browser.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error('[army-panel-recruit-remove-test] ERROR', e); process.exitCode = 1; })
  .finally(() => {
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
    try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch (_) { /* ignore */ }
    process.exit(process.exitCode || 0);
  });
