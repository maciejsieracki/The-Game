'use strict';
/**
 * empire-recruit-in-army-panel-test.cjs — R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1
 *
 * Dowód w REALNEJ grze (vite build -> Chromium, ?playtest=mapa&civTest=1):
 *  - przycisk „Rekrutacja” w górnym pasku HUD jest USUNIĘTY (brak data-act="empire-recruit" i napisu w .hud-right);
 *  - sekcja „Rekrutacja — cała cywilizacja” siedzi w panelu armii (Rekrutacja), PO sekcji wodza i „Idź do wodza”
 *    (R-WEB-UI-RECRUIT-LEADER-FIRST-ABOVE-MASS-Q1);
 *  - liczniki −/+ i pole działają w nowym miejscu; zamknięcie panelu armii zeruje liczniki;
 *  - szeroki i wąski (1024×640) układ: bez poziomego przewijania dokumentu, zewnętrzny panel przewijalny.
 * Zrzuty: dyspozycje/autobot/runs/R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1/.
 * Run z gra/: node tools/empire-recruit-in-army-panel-test.cjs [--no-build]
 *   (--no-build: używa katalogu z poprzedniego buildu, wskazanego zmienną EMPIRE_ARMY_RECRUIT_DIST)
 */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const SHOT_DIR = path.resolve(REPO, 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1');
const SCRATCH = process.env.EMPIRE_ARMY_RECRUIT_SCRATCH || path.join(process.env.TMPDIR || '/tmp', 'civ-army-recruit-' + process.pid);
let pass = 0, fail = 0;
const ok = (c, n, d) => { if (c) { pass++; console.log('PASS: ' + n); } else { fail++; console.log('FAIL: ' + n + (d !== undefined ? ' — ' + (typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 400) : '')); } };

(async () => {
  const outDir = process.env.EMPIRE_ARMY_RECRUIT_DIST || path.join(SCRATCH, 'dist');
  if (!process.argv.includes('--no-build')) {
    try { execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 520000 }); }
    catch (e) { ok(false, 'L0 build bundla', String(e.message).slice(0, 300)); process.exit(1); }
  }
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + outDir + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__empireRecruitTestDebug, null, { timeout: 180000 });
    await page.waitForTimeout(1500);

    // L1: górny pasek bez przycisku REKRUTACJA
    const hudRecruit = await page.evaluate(() => ({
      dataAct: document.querySelectorAll('[data-act="empire-recruit"]').length,
      rightText: Array.from(document.querySelectorAll('.hud-right button, .hud-right-cluster button')).map(b => (b.textContent || '').trim()),
    }));
    ok(hudRecruit.dataAct === 0 && !hudRecruit.rightText.some(t => /rekrutacj/i.test(t)), 'L1 przycisk REKRUTACJA usunięty z górnego paska', hudRecruit);

    // L2: sekcja w panelu armii, na górze części Rekrutacja, przed wodzem
    await page.evaluate(() => window.__empireRecruitTestDebug.openArmyRecruitSection());
    await page.waitForSelector('#civ-empire-recruit-panel [data-unit]', { timeout: 15000 });
    const order = await page.evaluate(() => {
      const sec = document.getElementById('civ-empire-recruit-panel');
      const leader = document.querySelector('.civ-emp-mass-leader');
      const mass = document.querySelector('[data-mass-recruitment]');
      const follow = document.querySelector('[data-recruit-follow-general]');
      const followLabel = follow ? follow.closest('label') : null;
      return {
        inArmy: !!(sec && mass && mass.contains(sec)),
        // R-WEB-UI-RECRUIT-LEADER-FIRST-ABOVE-MASS-Q1: wódz → „Idź do wodza” → erp
        leaderFirst: !!(sec && leader && mass && leader.previousElementSibling && leader.previousElementSibling.classList.contains('civ-emp-mass-hd')),
        followAfterLeader: !!(leader && followLabel && (leader.compareDocumentPosition(followLabel) & Node.DOCUMENT_POSITION_FOLLOWING)),
        erpAfterFollow: !!(sec && followLabel && (followLabel.compareDocumentPosition(sec) & Node.DOCUMENT_POSITION_FOLLOWING)),
        erpRightAfterFollow: !!(sec && followLabel && sec.previousElementSibling === followLabel),
        rows: document.querySelectorAll('#civ-empire-recruit-panel [data-unit]').length,
      };
    });
    ok(order.inArmy, 'L2 sekcja rekrutacji całej cywilizacji jest w części Rekrutacja panelu armii', order);
    ok(order.leaderFirst, 'L3 wódz/generał zaraz pod nagłówkiem Rekrutacja (samą górę)', order);
    ok(order.followAfterLeader, 'L4 „Idź do wodza” stoi PO sekcji wodza', order);
    ok(order.erpAfterFollow && order.erpRightAfterFollow, 'L4b rekrutacja całej cywilizacji stoi DOPIERO po „Idź do wodza”', order);
    ok(order.rows > 0, 'L5 lista typów jednostek niepusta', order);

    // L6: liczniki w nowym miejscu
    const firstOrderable = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('#civ-empire-recruit-panel [data-unit]')).find(r => !r.classList.contains('is-blocked'));
      return row ? row.getAttribute('data-unit') : null;
    });
    ok(!!firstOrderable, 'L6 jest typ jednostki, który można zamawiać', firstOrderable);
    if (firstOrderable) {
      const sel = `#civ-empire-recruit-panel [data-unit="${firstOrderable}"]`;
      await page.locator(`${sel} [data-erp="inc"]`).click();
      await page.locator(`${sel} [data-erp="inc"]`).click();
      const q = await page.locator(`${sel} [data-erp="qty"]`).inputValue();
      ok(q === '2', 'L7 przycisk „+” zwiększa licznik w nowym miejscu (2)', q);
      await page.locator(`${sel} [data-erp="dec"]`).click();
      ok(await page.locator(`${sel} [data-erp="qty"]`).inputValue() === '1', 'L8 przycisk „−” zmniejsza licznik (1)');
      ok(await page.locator('#civ-empire-recruit-panel [data-erp="go-all"]').count() === 1, 'L9 „Rekrutuj wszystkie” jest w sekcji');
    }
    await page.locator('#civ-empire-recruit-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOT_DIR, 'armia-rekrutacja-na-gorze.png') });
    await page.screenshot({ path: path.join(SHOT_DIR, 'gorny-pasek-bez-rekrutacji.png'), clip: { x: 0, y: 0, width: 1280, height: 140 } });

    // L10: zamknięcie panelu armii zeruje liczniki (zasada R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1)
    await page.evaluate(() => window.__empireRecruitTestDebug.closeArmyRecruitSection());
    await page.evaluate(() => window.__empireRecruitTestDebug.openArmyRecruitSection());
    await page.waitForSelector('#civ-empire-recruit-panel [data-unit]', { timeout: 15000 });
    const afterReopen = await page.evaluate(() => Array.from(document.querySelectorAll('#civ-empire-recruit-panel [data-erp="qty"]')).map(i => Number(i.value)).reduce((a, b) => a + b, 0));
    ok(afterReopen === 0, 'L10 po zamknięciu i ponownym otwarciu liczniki = 0', afterReopen);

    // L11: wąski ekran 1024×640 — bez poziomego przewijania dokumentu, zewnętrzny panel przewijalny
    await page.setViewportSize({ width: 1024, height: 640 });
    await page.waitForTimeout(400);
    const narrow = await page.evaluate(() => {
      const body = document.querySelector('.civ-emp-body');
      return {
        docScrollW: document.documentElement.scrollWidth, winW: window.innerWidth,
        bodyOverflowY: body ? getComputedStyle(body).overflowY : null,
        sectionOverflowY: getComputedStyle(document.getElementById('civ-empire-recruit-panel')).overflowY,
      };
    });
    ok(narrow.docScrollW <= narrow.winW + 1, 'L11 1024×640: brak poziomego przewijania dokumentu', narrow);
    ok(narrow.sectionOverflowY === 'visible', 'L12 sekcja nie ma własnego przewijania (zewnętrzny panel armii)', narrow);
    await page.locator('#civ-empire-recruit-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOT_DIR, 'armia-rekrutacja-wasko-1024x640.png') });

    ok(errs.length === 0, 'L13 zero pageerror', errs.join('|'));
  } finally {
    await browser.close();
  }
  console.log(`\nempire-recruit-in-army-panel-test: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
