'use strict';
/**
 * live-verify-wave-703-710-Q1.cjs — R-WEB-LIVE-VERIFY-WAVE-703-710-Q1, runda 1 (Operator).
 * Dowód w PRAWDZIWEJ grze (Chromium, bundle z vite build poza repo), punkty z dispatchu:
 *  (e) FALA 710 — AI od tury 1: 10 realnych tur z AI (naturalna gra, zero grantów), odczyt skarbca i spichlerza
 *      każdego właściciela AI z __nnsMeasureDebug.snapshot() po każdej turze; brak ujemnych wartości; pageErrors puste.
 *  (g) FALA 706 — bramka „Zakończ turę”: przy realnym deficycie (jednostki utrzymania gracza, prognoza
 *      przeliczona przez disbandPlayerUnits) odczyt title/tekstu przycisku i komunikatów bramki; brak „kolejki produkcji”.
 * Zrzut ekranu bramki zapisywany do EVID_DIR (oglądany przez Operatora narzędziem Read).
 * Usage: DIST=<katalog z index.html z vite build> EVID_DIR=<katalog> node tools/live-verify-wave-703-710-Q1.cjs [seed=11] [map=Maly]
 */
const fs = require('fs');
const path = require('path');

const DIST = process.env.DIST;
const EVID = process.env.EVID_DIR;
if (!DIST || !EVID) throw new Error('Ustaw DIST=<katalog bundle> i EVID_DIR=<katalog dowodow>');
const SEED = parseInt(process.argv[2] || '11', 10);
const MAP = process.argv[3] || 'Maly';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(EVID, { recursive: true });

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  try { return await chromium.launch({ headless: true, args }); } catch (e) {
    return chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args });
  }
}

(async () => {
  const { chromium } = require('playwright');
  const browser = await launch(chromium);
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e).slice(0, 300)));
  const blockLog = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
    if (/EndTurn\] blocked/.test(m.text())) blockLog.push(m.text().slice(0, 240));
  });
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  const res = { seed: SEED, map: MAP, turns: [], negatives: [], gate: null, checks: [] };
  const check = (ok, name, extra) => { res.checks.push({ ok: !!ok, name, extra: extra === undefined ? null : extra }); console.log((ok ? 'PASS: ' : 'FAIL: ') + name + (extra !== undefined ? ' — ' + JSON.stringify(extra).slice(0, 400) : '')); };

  const snap = () => page.evaluate(() => window.__nnsMeasureDebug.snapshot());
  const endTurnOnce = async () => {
    await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
    await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
    await wait(150);
  };

  try {
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((o) => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: MAP, civTypes: 15, cityStates: 2 });
    await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    });
    if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
      res.refound = await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
    }
    res.playerCities = await page.evaluate(() => window.__nnsMeasureDebug.playerCities());
    await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));

    // (e) 10 realnych tur, naturalna gra
    const s0 = await snap();
    res.startSnapshot = { turn: s0.turn, owners: s0.owners.map((o) => ({ id: o.oid, civ: o.civ, cityState: !!o.cityState, treasury: o.treasury, granary: o.granary })) };
    for (let t = 1; t <= 10; t++) {
      const before = await snap();
      await endTurnOnce();
      const after = await snap();
      const owners = (after.owners || []).map((o) => ({ id: o.oid, civ: o.civ, cityState: !!o.cityState, treasury: o.treasury, granary: o.granary, cities: o.cities, units: o.units }));
      res.turns.push({ from: before.turn, to: after.turn, owners });
      for (const o of owners) {
        if ((o.treasury ?? 0) < 0 || (o.granary ?? 0) < 0) res.negatives.push({ turn: after.turn, id: o.id, civ: o.civ, cityState: o.cityState, treasury: o.treasury, granary: o.granary });
      }
      console.log(`turn ${before.turn}->${after.turn} owners=${owners.length} aiNegatives=${res.negatives.length}`);
    }
    if (res.turns.length) {
      const last = res.turns[res.turns.length - 1];
      res.aiOwnersCount = last.owners.length;
      res.aiMajorCount = last.owners.filter((o) => !o.cityState).length;
    }
    check(res.turns.length === 10 && res.turns[9].to >= 11, 'e: 10 realnych tur zakończonych (tura >= 11)', { turns: res.turns.length, lastTo: res.turns.length ? res.turns[res.turns.length - 1].to : null });
    check(res.aiOwnersCount > 0, 'e: w snapshotach są właściciele AI (liczba)', res.aiOwnersCount);
    res.negativesMajor = res.negatives.filter((n) => !n.cityState);
    check(res.negatives.length === 0, 'e: brak ujemnych skarbca/spichlerza AI w T1–10 (wszystkie właściciele AI)', res.negatives);
    check(res.negativesMajor.length === 0, 'e: brak ujemnych skarbca/spichlerza u major AI w T1–10', res.negativesMajor);

    // (g) bramka „Zakończ turę” przy realnym deficycie gracza
    res.baselineCanEnd = await page.evaluate(() => window.__nnsMeasureDebug.canEnd());
    res.baselineModal = await page.evaluate(() => document.body.innerText.includes('Audiencja dyplomatyczna'));
    let blocked = false; let steps = 0;
    for (; steps < 120 && !blocked; steps++) {
      await page.evaluate(() => window.__nnsMeasureDebug.spawnAiUnits(0, 1));
      await page.evaluate(() => window.__nnsMeasureDebug.disbandPlayerUnits(0));
      await wait(60);
      blocked = !(await page.evaluate(() => window.__nnsMeasureDebug.canEnd()));
    }
    res.gateSteps = steps;
    res.blockLog = blockLog.slice(-6);
    res.modalAfterSpawn = await page.evaluate(() => document.body.innerText.includes('Audiencja dyplomatyczna'));
    check(blocked, 'g: bramka „Zakończ turę” zablokowana realnym deficytem (kroki jednostek)', { steps });
    if (blocked) {
      await wait(400);
      res.gate = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => /zakończ\s+turę/i.test(x.textContent || ''));
        const msgs = [...document.querySelectorAll('[role="alert"], [role="status"], .civ-gate-msg, [data-gate-msg], [title]')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => (el.getAttribute('title') || el.textContent || '').replace(/\s+/g, ' ').trim())
          .filter((t) => /kolejk|zakończ|bramk|skarbc|spichlerz|tura/i.test(t));
        return {
          buttonTitle: b ? (b.getAttribute('title') || '') : null,
          buttonText: b ? (b.textContent || '').replace(/\s+/g, ' ').trim() : null,
          buttonDisabled: b ? !!b.disabled : null,
          messages: [...new Set(msgs)].slice(0, 12),
        };
      });
      const all = JSON.stringify(res.gate);
      check(res.gate.buttonTitle !== null, 'g: przycisk „Zakończ turę” znaleziony w DOM', res.gate.buttonText);
      check(!/kolejki produkcji/i.test(all), 'g: tooltip/komunikat bramki NIE zawiera „kolejki produkcji”', res.gate);
      await page.screenshot({ path: path.join(EVID, 'gate-zakoncz-ture-deficyt.png') });
      // zamknij ewentualną audiencję (modal dyplomacji otwarty przed pomiarem) i kliknij bramkę — NIE kończy tury (canEnd=false)
      await page.keyboard.press('Escape'); await wait(300);
      await page.evaluate(() => { const bt = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Wróć|Zamknij)$/.test((x.textContent || '').trim())); if (bt) bt.click(); });
      await wait(300);
      res.modalAfterClose = await page.evaluate(() => document.body.innerText.includes('Audiencja dyplomatyczna'));
      const turnBefore = (await snap()).turn;
      await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /zakończ\s+turę/i.test(x.textContent || '')); if (b) b.click(); });
      await wait(800);
      res.turnAfterClick = (await snap()).turn;
      res.toastsAfterClick = await page.evaluate(() => [...new Set([...document.querySelectorAll('body *')].filter((el) => el.children.length === 0 && el.offsetParent !== null).map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim()))]
        .filter((t) => t.length > 8 && t.length < 300 && /(nie można|zakończ|bramk|prognoz|kolejk|deficyt|blokad|tury)/i.test(t)).slice(0, 12));
      check(res.turnAfterClick === turnBefore, 'g: klik „Zakończ turę” przy blokadzie NIE kończy tury', { turnBefore, turnAfterClick: res.turnAfterClick });
      // tooltip bramki po najechaniu myszą (DOM title / widoczny dymek)
      const gateBtn = page.locator('button', { hasText: /Zakończ\s+turę/i }).first();
      await gateBtn.hover({ timeout: 5000 }).catch(() => {});
      await wait(700);
      res.hoverTooltip = await page.evaluate(() => [...document.querySelectorAll('[role="tooltip"], .civ-tooltip, .tooltip, [data-tooltip], [class*="tooltip"]')].filter((el) => el.offsetParent !== null).map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0).slice(0, 6));
      check(!res.toastsAfterClick.some((t) => /kolejki produkcji/i.test(t)) && !(res.hoverTooltip || []).some((t) => /kolejki produkcji/i.test(t)), 'g: komunikaty i tooltip po kliknięciu/najechaniu bez „kolejki produkcji”', { toasts: res.toastsAfterClick, hover: res.hoverTooltip });
      res.gateMessageDom = await page.evaluate(() => { const t = document.body.innerText || ''; const m = t.match(/Nie można zakończyć tury[^\n]{0,400}/g) || []; return m.map((x) => x.slice(0, 400)); });
      res.diploCounterDom = await page.evaluate(() => { const t = document.body.innerText || ''; return (t.match(/(Dyplomacja|Ważne|Inne)\s*\d+/g) || []).slice(0, 6); });
      check(res.gateMessageDom.length > 0 && !res.gateMessageDom.some((x) => /kolejki produkcji/i.test(x)), 'g: komunikat DOM „Nie można zakończyć tury” obecny i bez „kolejki produkcji”', res.gateMessageDom);
      await page.screenshot({ path: path.join(EVID, 'gate-po-kliknieciu.png') });
      // (f) licznik zakładki „Dyplomacja” vs lista (tylko odczyt DOM; bez zmiany zakładki)
      res.diploTabs = await page.evaluate(() => [...document.querySelectorAll('button, [role="tab"]')].filter((el) => el.offsetParent !== null && /Dyplomacj/i.test(el.textContent || '')).map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim()).slice(0, 6));
    }
    check(pageErrors.length === 0, 'brak pageerror w trakcie run', pageErrors);
    const benign = consoleErrors.filter((e) => !/favicon|ERR_FILE_NOT_FOUND|ResizeObserver loop/.test(e));
    check(benign.length === 0, 'brak błędów konsoli (poza tłem znanym)', benign.slice(0, 5));
  } catch (e) {
    check(false, 'EXC: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e)));
  } finally {
    await browser.close();
    res.pageErrors = pageErrors;
    res.consoleErrorsCount = consoleErrors.length;
    res.consoleErrorsSample = consoleErrors.slice(0, 8);
    res.pass = res.checks.length > 0 && res.checks.every((c) => c.ok);
    fs.writeFileSync(path.join(EVID, `result-seed${SEED}.json`), JSON.stringify(res, null, 2));
    console.log('RESULT', res.pass ? 'PASS' : 'FAIL', path.join(EVID, `result-seed${SEED}.json`));
  }
  process.exit(res.pass ? 0 : 1);
})();
