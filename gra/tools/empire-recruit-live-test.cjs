'use strict';
/**
 * empire-recruit-live-test.cjs — R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1 (runda 2, zarzut 1)
 * Dowód w REALNEJ grze (vite build -> Chromium, ?playtest=mapa&civTest=1): wiring main.ts
 * (empireRecruitCityInputs/Rows, orderEmpireRecruitment) na realnym purchaseRecruitmentUnit, 3 miasta gracza,
 * zamówienie 5 + 4, wpisy cityProd.rekrutacja, pobór złota jak przy ręcznej rekrutacji, przycisk HUD, panel DOM.
 * Run z gra/: node tools/empire-recruit-live-test.cjs [--shot]
 */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const GRA = path.resolve(__dirname, '..');
const SHOT_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1');
let pass = 0, fail = 0;
const ok = (c, n, d) => { if (c) { pass++; console.log('PASS: ' + n); } else { fail++; console.log('FAIL: ' + n + (d !== undefined ? ' — ' + (typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 400) : '')); } };

(async () => {
  const outDir = '/dev/shm/erlive-' + process.pid;
  try { execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 520000 }); }
  catch (e) { ok(false, 'L0 build bundla', String(e.message).slice(0, 300)); process.exit(1); }
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + outDir + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__empireRecruitTestDebug, null, { timeout: 180000 });
    await page.waitForTimeout(2000);
    const D = (fn, ...a) => page.evaluate(([f, a]) => window.__empireRecruitTestDebug[f](...a), [fn, a]);
    const queues = async (ids) => Promise.all(ids.map(c => D('queue', c)));

    let ids = await D('playerCityIds');
    ok(ids.length >= 1, 'L1 gracz ma miasto', ids);
    if (ids.length < 3) await D('cloneCityForTest', ids[0], 3 - ids.length);
    ids = await D('playerCityIds');
    ok(ids.length === 3, 'L2 3 miasta gracza (klon realnego miasta dla rozkładu)', ids);
    await D('clearQueues');
    await D('setResources', 1000000, 1000000);

    const rows = await D('rows');
    ok(rows.length > 0, 'L3 panel ma wiersze jednostek wojskowych', rows.map(r => r.id));
    ok(!rows.some(r => r.id === 'Zwiadowca' || r.id === 'Osadnik' || r.id === 'Robotnik'), 'L4 brak jednostek cywilnych (Zwiadowca/Osadnik/Robotnik)', rows.map(r => r.id));
    const full = rows.filter(r => r.capableCities === 3);
    ok(full.length >= 2, 'L5 co najmniej 2 typy dostępne we wszystkich 3 miastach', rows.map(r => [r.id, r.capableCities]));
    const A = full.find(r => r.id === 'Wojownik') || full[0];
    const B = full.find(r => r.id !== A.id && r.id === 'Taran') || full.find(r => r.id !== A.id);

    // --- realne zamówienie 5 x A ---
    const g0 = await D('gold');
    const resA = await D('order', A.id, 5);
    const g1 = await D('gold');
    const qsA = await queues(ids);
    const cntA = qsA.map(q => q.filter(x => x === A.id).length).sort();
    ok(resA.changed === true && cntA.join() === '1,2,2', `L6 5 x ${A.id} na 3 miasta = 2/2/1 w cityProd.rekrutacja`, { resA, qsA });
    ok(g0 - g1 === 5 * A.koszt, `L7 złoto pobrane jak przy ręcznej rekrutacji (5 x ${A.koszt})`, { g0, g1 });

    // --- 4 x B ---
    const resB = await D('order', B.id, 4);
    const g2 = await D('gold');
    const qsB = await queues(ids);
    const cntB = qsB.map(q => q.filter(x => x === B.id).length).sort();
    ok(resB.changed === true && cntB.join() === '1,1,2', `L8 4 x ${B.id} = 2/1/1, wpisy A nietknięte`, { resB, qsB });
    ok(g1 - g2 === 4 * B.koszt, `L9 złoto 4 x ${B.koszt}`, { g1, g2 });
    ok(qsB.every((q, i) => q.filter(x => x === A.id).length === qsA[i].filter(x => x === A.id).length), 'L10 zamówienie B nie zmieniło wpisów A');

    const tryP = await page.evaluate((c) => window.__siegeBlockTestDebug && window.__siegeBlockTestDebug.tryPurchase(c), ids[0]);
    ok(!tryP || tryP.ok === true, 'L11 ręczna rekrutacja (purchaseRecruitmentUnit) nadal działa po zamówieniu zbiorczym', tryP);

    const rows2 = await D('rows');
    const ra = rows2.find(r => r.id === A.id);
    const total = (await queues(ids)).flat().filter(x => x === A.id).length;
    ok(ra.queued === total && total >= 5, 'L12 wiersz: "w kolejkach" = suma wpisów typu w miastach', { ra, total });

    // --- blokada oblężenia: miasto pominięte ---
    await D('clearQueues');
    await D('setResources', 1000000, 1000000);
    await page.evaluate((c) => window.__frozenTestDebug && window.__frozenTestDebug.setCityBesieged(c, true), ids[1]);
    const resS = await D('order', A.id, 4);
    const qsS = await queues(ids);
    ok(resS.changed && qsS[1].length === 0 && qsS[0].length + qsS[2].length === 4, 'L13 oblężone miasto pomijane, 4 sztuki w pozostałych', { resS, qsS });
    await page.evaluate((c) => window.__frozenTestDebug && window.__frozenTestDebug.setCityBesieged(c, false), ids[1]);

    // --- brak środków ---
    await D('clearQueues');
    await D('setResources', 0, 1000000);
    const resP = await D('order', A.id, 3);
    ok(resP.changed === false && /złota/.test(resP.message), 'L14 brak złota -> komunikat, brak zmian', resP);
    await D('setResources', 1000000, 1000000);
    await D('clearQueues');

    // --- UI w realnej grze ---
    const btn = page.locator('[data-act="empire-recruit"]');
    ok(await btn.count() === 1 && await btn.isVisible(), 'L15 przycisk "Rekrutacja" w górnym pasku HUD widoczny');
    await btn.click();
    await page.waitForSelector('#civ-empire-recruit-panel [data-unit]', { timeout: 10000 });
    const rowA = page.locator(`#civ-empire-recruit-panel [data-unit="${A.id}"]`), rowB = page.locator(`#civ-empire-recruit-panel [data-unit="${B.id}"]`);
    for (let i = 0; i < 4; i++) await rowA.locator('[data-erp="inc"]').click();
    for (let i = 0; i < 3; i++) await rowB.locator('[data-erp="inc"]').click();
    await rowA.locator('[data-erp="go"]').click();
    const qv = async (r) => Number(await r.locator('[data-erp="qty"]').inputValue());
    ok(await qv(rowA) === 5 && await qv(rowB) === 4, 'L16 klik "Rekrutuj" przy A nie zeruje liczników (A=5, B=4)');
    const totA = (await queues(ids)).flat().filter(x => x === A.id).length;
    ok(totA === 5, 'L17 klik w realnym panelu wpisał 5 sztuk do kolejek', totA);
    ok(Number(await rowA.locator('[data-erp-queued]').innerText()) === 5, 'L18 panel pokazuje "w kolejkach: 5" po zamówieniu');
    await page.evaluate((c) => window.__siegeBlockTestDebug.tryPurchase(c), ids[0]);
    await page.waitForTimeout(300);
    const shownA = Number(await rowA.locator('[data-erp-queued]').innerText());
    const shownB = Number(await rowB.locator('[data-erp-queued]').innerText());
    const all = (await queues(ids)).flat();
    const realA = all.filter(x => x === A.id).length, realB = all.filter(x => x === B.id).length;
    ok(shownA === realA && shownB === realB, 'L19 panel odświeżył się po zmianie spoza panelu (ręczna rekrutacja)', { shownA, realA, shownB, realB });
    if (process.argv.includes('--shot')) await page.screenshot({ path: path.join(SHOT_DIR, 'panel-zbiorczy-live.png') });
    await page.setViewportSize({ width: 640, height: 700 });
    await page.waitForTimeout(500);
    const geo = await page.evaluate(() => {
      const b = document.querySelector('[data-act="empire-recruit"]'), p = document.getElementById('civ-empire-recruit-panel');
      const br = b && b.getBoundingClientRect(), pr = p && p.getBoundingClientRect();
      return { btn: br && [Math.round(br.left), Math.round(br.right), Math.round(br.width)], panel: pr && [Math.round(pr.left), Math.round(pr.right)], vw: innerWidth };
    });
    ok(geo.btn && geo.btn[0] >= 0 && geo.btn[1] <= geo.vw && geo.btn[2] > 0, 'L20 640 px: przycisk "Rekrutacja" mieści się w oknie', geo);
    ok(geo.panel && geo.panel[0] >= 0 && geo.panel[1] <= geo.vw, 'L21 640 px: panel zbiorczy mieści się w oknie', geo);
    await page.locator('[data-erp="close"]').click();
    ok(await page.locator('#civ-empire-recruit-panel').count() === 0, 'L22 panel zamyka się');
    ok(errs.length === 0, 'L23 zero pageerror', errs.join('|'));
  } finally { await browser.close(); fs.rmSync(outDir, { recursive: true, force: true }); }
  console.log(`\nempire-recruit-live-test: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
