'use strict';
/**
 * live-verify-wave-689-697-a1-title-tax.cjs — R-WEB-LIVE-VERIFY-WAVE-689-697-A1-GATE-TITLE-TAX-LEVER-Q1, runda 1.
 * (1) TITLE przycisku „Zakończ turę” w blokadzie: odczyt PRZED i PO realnej akcji UI (suwak podatku w panelu Skarbiec).
 * (2) DŹWIGNIA PODATKU: suwak UI (Playwright fill na input[data-handel-key]) zmienia canEnd false->true, klik kończy turę.
 * ZERO grantPlayerGold. Deficyt = realne jednostki utrzymania (hak spawnAiUnits(ME)); akcje po blokadzie = wyłącznie UI.
 * Użycie (z gra/): node tools/live-verify-wave-689-697-a1-title-tax.cjs --dist <d> --out <o> [--seed 11]
 */
const fs = require('fs');
const path = require('path');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; }
const DIST = arg('dist'); const OUT = arg('out'); const SEED = parseInt(arg('seed', '11'), 10);
const MAP = arg('map', 'Maly'); const MAXU = parseInt(arg('maxsteps', '400'), 10);
const wait = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist --out'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  let browser;
  try { browser = await chromium.launch({ headless: true, args }); } catch (_) { browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args }); }
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })).newPage();
  const res = { seed: SEED, log: [], errors: [], grantCalls: 0 };
  const log = (k, v) => { res.log.push({ k, v }); };
  page.on('pageerror', e => res.errors.push(String(e && e.message || e).slice(0, 200)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  const S = {
    turn: () => page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn),
    canEnd: () => page.evaluate(() => window.__nnsMeasureDebug.canEnd()),
    btn: () => page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || ''));
      if (!b) return null;
      return { title: b.getAttribute('title') || '', cls: b.className, disabled: !!b.disabled, text: (b.textContent || '').replace(/\s+/g, ' ').trim() };
    }),
    split: () => page.evaluate(() => {
      const o = {}; document.querySelectorAll('input[data-handel-key]').forEach(i => { o[i.dataset.handelKey] = i.value; }); return o;
    }),
    hudSk: () => page.evaluate(() => { const t = (document.body.innerText || '').replace(/\s+/g, ' '); const m = t.match(/Skarbiec [^M]{0,30}/); return m ? m[0] : null; }),
    endOnce: async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
      await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
      await wait(150);
    },
    clickEnd: () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || '')); if (b) b.click(); return !!b; }),
  };
  const outFile = path.join(OUT, `result-a1-gold-seed${SEED}.json`);
  try {
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: MAP, civTypes: 15, cityStates: 2 });
    await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => { await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()); });
    if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) log('refound', await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere()));
    await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));
    while ((await S.turn()) < 11) await S.endOnce();
    await page.evaluate(() => window.__nnsMeasureDebug.setFast(false));
    await wait(2500);
    log('turn', await S.turn());
    // Panel Skarbiec otwarty realnym klikiem (chip), potem WSZYSTKIE zmiany podatku wyłącznie suwakami UI.
    await page.evaluate(() => { const el = document.querySelector('[data-act="skarbiec"]'); if (el) el.click(); });
    await page.waitForSelector('input[data-handel-key="procentNauka"]', { timeout: 15000 });
    await wait(800);
    const slide = async (key, v) => { await page.locator('input[data-handel-key="' + key + '"]').fill(String(v)); await wait(700); };
    log('split_start', await S.split());
    log('title_noBlock', await S.btn());
    // Deficyt: 2 jednostki utrzymania (hak) + podatek zbity do minimum Skarbu suwakami UI (blokada złoto + żywność).
    // Żywność zdejmujemy realnym suwakiem „Wyżywienie” (panel imperium, sekcja Spichlerz) — zostaje blokada TYLKO złota,
    // którą może zdjąć wyłącznie dźwignia podatku.
    let found = null; const tried = [];
    const openSection = async (act, sel) => {
      await page.evaluate(a2 => { const el = document.querySelector('[data-act="' + a2 + '"]'); if (el) el.click(); }, act);
      await page.waitForSelector(sel, { timeout: 15000 }); await wait(700);
    };
    for (let k = 0; k < 2; k++) {
      const sp = await page.evaluate(() => window.__nnsMeasureDebug.spawnAiUnits(0, 1));
      if (!sp || sp.added !== 1) { log('spawnStop', sp); break; }
    }
    await page.evaluate(() => window.__nnsMeasureDebug.disbandPlayerUnits(0));
    await slide('procentNauka', 60); await slide('procentLuksus', 40);
    tried.push({ step: 'goldDeficitViaSlider', split: await S.split(), canEnd: await S.canEnd(), btn: await S.btn() });
    // suwak Wyżywienie
    let racjeSec = null;
    for (const act of ['spichlerz', 'zywnosc']) {
      try { await openSection(act, 'input[data-racje-key="poziom"]'); racjeSec = act; break; } catch (_) { /* następna sekcja */ }
    }
    log('racjeSection', racjeSec);
    if (racjeSec) {
      const rinfo = await page.evaluate(() => { const i = document.querySelector('input[data-racje-key="poziom"]'); return { min: i.min, max: i.max, value: i.value }; });
      log('racje_before', rinfo);
      await page.locator('input[data-racje-key="poziom"]').fill(rinfo.min); await wait(900);
      log('racje_after', await page.evaluate(() => document.querySelector('input[data-racje-key="poziom"]').value));
    }
    const b1 = await S.btn(); const ce1 = await S.canEnd();
    tried.push({ step: 'afterRacjeMin', canEnd: ce1, title: b1 && b1.title });
    if (!ce1 && b1 && /Skarbiec[^;.]*zabraknie/.test(b1.title) && !/Spichlerz[^;.]*zabraknie/.test(b1.title)) found = 2;
    log('tried', tried);
    log('goldOnlyBlock', found);
    if (found === null) throw new Error('nie uzyskano blokady tylko-złoto');
    await openSection('skarbiec', 'input[data-handel-key="procentNauka"]');
    log('split_afterBackToSkarbiec', await S.split());
    log('turnAtBlock', await S.turn());
    log('title_goldBlock_afterUiSlider', await S.btn());
    await page.screenshot({ path: path.join(OUT, `a1-seed${SEED}-g1-goldblock-tooltip.png`) });
    const t0 = await S.turn();
    await S.clickEnd(); await wait(800);
    log('blockedClick_turn', { before: t0, after: await S.turn() });
    // Dźwignia podatku suwakiem UI: Luksus -> 0, Nauka -> 0 (całość do Skarbu).
    const splitBefore = await S.split();
    await slide('procentLuksus', 20); await slide('procentNauka', 0);
    const splitAfter = await S.split();
    log('lever_split', { before: splitBefore, after: splitAfter });
    log('lever_canEndAfter', await S.canEnd());
    log('lever_button', await S.btn());
    log('lever_hudSk', await S.hudSk());
    await page.screenshot({ path: path.join(OUT, `a1-seed${SEED}-g2-lever.png`) });
    const t1 = await S.turn();
    await S.clickEnd();
    await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
    await wait(500);
    log('lever_click_turn', { before: t1, after: await S.turn() });
  } catch (e) {
    res.fatal = String(e && e.stack || e).slice(0, 800);
  } finally {
    fs.writeFileSync(outFile, JSON.stringify(res, null, 2));
    await browser.close();
    console.log(JSON.stringify(res.log, null, 1));
    console.log('errors', JSON.stringify(res.errors), 'fatal', res.fatal || '-');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
