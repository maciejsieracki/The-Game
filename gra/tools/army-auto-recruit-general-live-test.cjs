'use strict';
/**
 * army-auto-recruit-general-live-test.cjs — R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1 (runda 2, zarzuty 1-3).
 * REALNA gra (vite build -> Chromium, ?playtest=mapa&civTest=1): zamówienie z panelu z wybranym generałem,
 * zrodzenie w turze (realny endTurn), marsz do WYBRANEGO (nie najbliższego) generała, śmierć generała
 * (powiadomienie na granicy tury przy zamkniętym panelu), zapis/wczytanie, zrzut REALNEGO panelu z listą generałów.
 * Run z gra/: node tools/army-auto-recruit-general-live-test.cjs [--shot]
 */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const GRA = path.resolve(__dirname, '..');
const SHOT_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1');
let pass = 0, fail = 0;
const ok = (c, n, d) => { if (c) { pass++; console.log('PASS: ' + n); } else { fail++; console.log('FAIL: ' + n + (d !== undefined ? ' — ' + (typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 500) : '')); } };

(async () => {
  const outDir = '/dev/shm/arglive-' + process.pid;
  try { execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 520000 }); }
  catch (e) { ok(false, 'L0 build bundla', String(e.message).slice(0, 300)); process.exit(1); }
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + outDir + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__empireRecruitTestDebug, null, { timeout: 180000 });
    await page.waitForTimeout(2000);
    const D = (fn, ...a) => page.evaluate(([f, a]) => window.__empireRecruitTestDebug[f](...a), [fn, a]);
    const turn = () => page.evaluate(() => window.__eraTestDebug.endTurn());
    const queues = async (ids) => Promise.all(ids.map(c => D('queue', c)));

    const ids = await D('playerCityIds');
    ok(ids.length >= 1, 'L1 gracz ma miasto', ids);
    await D('setResources', 1000000, 1000000);
    await D('clearQueues');

    // Dwóch generałów; wybrany = DALSZY od miasta (nie najbliższy), żeby odróżnić wybór od reguły "najbliższy".
    await D('ensureAndSelectGeneral', 0);
    await D('ensureAndSelectGeneral', 1);
    const cityPos = await D('cityPos', ids[0]);
    const gens = (await D('generalInfo')).map(g => ({ ...g, d: Math.abs(g.q - cityPos.q) + Math.abs(g.r - cityPos.r) })).sort((a, b) => a.d - b.d);
    ok(gens.length >= 2, 'L2 gracz ma co najmniej 2 generałów', gens);
    const nearest = gens[0], chosen = gens[gens.length - 1];
    ok(nearest.id !== chosen.id, 'L3 wybrany generał to NIE najbliższy', { nearest, chosen });

    // Bez wyboru: zamówienie odrzucone.
    await D('selectGeneral', null);
    const rows = await D('rows');
    const U = rows.find(r => r.id === 'Wojownik') || rows.find(r => r.capableCities >= 1);
    const noSel = await D('order', U.id, 1);
    ok(noSel.changed === false && /generała/.test(noSel.message) && (await queues(ids)).flat().length === 0, 'L4 bez wybranego generała panel nie rekrutuje', noSel);

    // Z wyborem: zamówienie niesie id.
    await D('selectGeneral', chosen.id);
    const res = await D('order', U.id, 2);
    ok(res.changed === true && res.accepted >= 1, 'L5 z wybranym generałem zamówienie przyjęte', res);
    const intents = (await Promise.all(ids.map(c => D('queueIntents', c)))).flat();
    ok(intents.length >= 1 && intents.every(i => i.rallyGeneralId === chosen.id && i.followGeneral === true), 'L6 wpisy kolejki niosą id wybranego generała', intents);

    // Zrodzenie w realnej turze.
    let spawned = [];
    for (let t = 0; t < 8 && spawned.length === 0; t++) { await turn(); await page.waitForTimeout(400); spawned = await D('rallyUnits'); }
    ok(spawned.length >= 1, 'L7 jednostka z zamówienia zrodziła się w realnej turze', spawned);
    ok(spawned.every(u => u.rally === chosen.id), 'L8 zrodzona jednostka niesie rallyGeneralId wybranego generała', spawned);
    // Planowanie marszu jest odroczone do końca animacji tury (deferredPlayerUnitRevealIds) — czekamy.
    for (let i = 0; i < 40 && !spawned.some(u => u.march); i++) { await page.waitForTimeout(500); spawned = await D('rallyUnits'); }
    const withMarch = spawned.filter(u => u.march);
    ok(withMarch.length >= 1 && withMarch.every(u => u.march.generalTargetId === chosen.id), 'L9 marsz zaplanowany do WYBRANEGO generała, nie najbliższego', { spawned, gens, cityPos });

    // Zrzut REALNEGO panelu z listą generałów.
    await D('setResources', 1000000, 1000000);
    // Mapa playtestowa bez przeciwników: ekran zwycięstwa (dominacja) zasłania HUD — zamykamy go (tylko test).
    await page.evaluate(() => { const v = document.getElementById('__victory_screen__'); if (v) v.remove(); });
    await page.locator('[data-act="empire-recruit"]').click();
    await page.waitForSelector('#civ-empire-recruit-panel [data-unit]', { timeout: 10000 });
    const panelTxt = await page.locator('#civ-empire-recruit-panel').innerText();
    ok(/rekrutuje/i.test(panelTxt), 'L10 realny panel oznacza wybranego generała znacznikiem "rekrutuje"', panelTxt.slice(0, 300));
    if (process.argv.includes('--shot')) await page.screenshot({ path: path.join(SHOT_DIR, 'panel-rekrutacja-live-z-generalem.png') });
    await page.locator('[data-erp="close"]').click();

    // Zapis / wczytanie w realnej grze.
    const saved = await page.evaluate(() => window.__empireRecruitTestDebug.quickSave('arg-live-slot'));
    ok(saved === true, 'L11 zapis gry udany');
    await D('selectGeneral', null);
    await page.evaluate(() => window.__empireRecruitTestDebug.loadSlot('arg-live-slot'));
    await page.waitForTimeout(1500);
    ok((await D('selectedGeneral')) === chosen.id, 'L12 po wczytaniu zapisu wybrany generał przywrócony', await D('selectedGeneral'));

    // Śmierć generała przy ZAMKNIĘTYM panelu: powiadomienie na granicy tury, wybór wyczyszczony.
    ok(await page.locator('#civ-empire-recruit-panel').count() === 0, 'L13 panel zamknięty');
    await D('killGeneral', chosen.id);
    await turn();
    for (let i = 0; i < 40 && (await D('selectedGeneral')) !== null; i++) await page.waitForTimeout(500);
    ok((await D('selectedGeneral')) === null, 'L14 po śmierci generała (panel zamknięty) wybór wyczyszczony na granicy tury', await D('selectedGeneral'));
    // Podpowiedź z końca tury jest odroczona do końca animacji (deferredEotHints) — czekamy na nią.
    let toast = null;
    for (let i = 0; i < 40; i++) { toast = await page.evaluate(() => window.__eraTestDebug.getToast()); if (JSON.stringify(toast || '').includes('zginął')) break; await page.waitForTimeout(500); }
    ok(JSON.stringify(toast || '').includes('zginął'), 'L15 powiadomienie o śmierci generała rekrutującego', toast);
    const afterDeath = await D('order', U.id, 1);
    ok(afterDeath.changed === false && /generała/.test(afterDeath.message), 'L16 po śmierci generała panel znów nie rekrutuje', afterDeath);
    ok(errs.length === 0, 'L17 zero pageerror', errs.join('|'));
  } finally { await browser.close(); fs.rmSync(outDir, { recursive: true, force: true }); }
  console.log(`\narmy-auto-recruit-general-live-test: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
