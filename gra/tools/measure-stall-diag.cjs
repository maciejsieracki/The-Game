'use strict';
/**
 * measure-stall-diag.cjs -- R-WEB-MEASURE-SEED1234-T18-STALL-Q1: diagnoza zatrzymania biegu pomiarowego (cannot-end).
 * Narzedzie POMIARU, nie zmiana gry. Odtwarza start gry jak diplomacy-harder-measure-run.cjs (ten sam seed, te same
 * blokady modalne i obejscie bramki NNS), gra tury az canEnd()=false, po czym zrzuca stan do --out:
 *   stall-<seed>.png        -- zrzut ekranu w momencie zatrzymania
 *   stall-<seed>.json       -- state(), canEnd(), battleState(), nnsGateBlocked(), isEndTurnInProgress(),
 *                              widoczne nakladki (tekst + klasy), wykryty ekran konca gry, bledy strony/konsoli
 *   stall-<seed>.html       -- outerHTML widocznych nakladek (overlay/modal/dialog/fixed)
 * Uzycie (z gra/, bundle poza repo):
 *   node tools/measure-stall-diag.cjs --dist <abs-dist> --out <abs-katalog> --profile <abs> --seed 1234 --maxturns 25
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');

const base = require('./ai-economy-measure-run.cjs');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const GRA_DIR = path.resolve(__dirname, '..');
const SEED = parseInt(arg('seed', '1234'), 10);
const MAXTURNS = parseInt(arg('maxturns', '25'), 10);
const GOLD = 200;
const FOOD = 200;
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), `diplo-harder-dist-${TMPDIR_RUN_ID}`)));
const PROFILE = path.resolve(arg('profile', path.join(os.tmpdir(), `stall-diag-profile-${TMPDIR_RUN_ID}`)));
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), `stall-diag-out-${TMPDIR_RUN_ID}`)));
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const wait = ms => new Promise(r => setTimeout(r, ms));
const COUNTERS = base.newCtx ? base.newCtx() : {};

async function clearBattles(page) {
  let clean = 0;
  for (let k = 0; k < 400; k++) {
    await base.closeEndTurnModals(page, COUNTERS);
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) { if (++clean >= 2) break; await wait(150); continue; }
    clean = 0;
    const act = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return 'auto'; }
      if (h.closeBattleSummary()) return 'summary';
      if (h.flushBattles()) return 'flush';
      return 'wait';
    });
    await wait(act === 'wait' ? 300 : 150);
  }
}

async function dumpOverlays(page) {
  return page.evaluate(() => {
    const vis = el => el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
    const cand = Array.from(document.querySelectorAll('body *')).filter(el => {
      const cls = String(el.className || '');
      const role = el.getAttribute('role') || '';
      return (/overlay|modal|dialog|popup|summary|gameover|victory|defeat|end-?screen/i.test(cls) || role === 'dialog') && vis(el);
    });
    const top = cand.filter(el => !cand.some(o => o !== el && o.contains(el)));
    return top.map(el => ({ tag: el.tagName, cls: String(el.className || '').slice(0, 160), id: el.id,
      text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 400) }));
  });
}

async function findEndScreen(page) {
  return page.evaluate(() => {
    const keys = ['Zwycięstwo', 'Zwyciestwo', 'Porażka', 'Porazka', 'Koniec gry', 'Game over', 'Victory', 'Defeat'];
    const hits = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      if (el.offsetParent === null) continue;
      if (el.children.length) continue;
      const t = (el.textContent || '').trim();
      if (t && t.length < 120 && keys.some(k => t.includes(k))) hits.push(t);
    }
    return hits.slice(0, 10);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  const { chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
    viewport: { width: 1280, height: 800 }, executablePath: CHROME });
  const errors = [];
  let page = null;
  let stallTurn = null;
  try {
    page = ctx.pages()[0] || await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + (e && e.message || e)));
    page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /EndTurn/.test(m.text()))) errors.push(m.type() + ': ' + m.text().slice(0, 300)); });
    const url = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__aiEconomyMeasure && !!window.__detHarness && !!window.__diploHarderMeasure, null, { timeout: 180000 });
    await page.evaluate(([seed]) => window.__nnsMeasureDebug.startGame({ seed }), [SEED]);
    await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, null, { timeout: 600000, polling: 500 });
    if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity()))) throw new Error('foundFirstCity=false');
    await page.evaluate(() => { const t = window.__truceTestDebug; if (t && t.suppressVictoryForTest) t.suppressVictoryForTest(); });
    await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
    await page.evaluate(on => window.__diploHarderMeasure.setEnabled(on), false);

    for (let i = 0; i < MAXTURNS; i++) {
      const before = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
      if (await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked())) {
        await page.evaluate(([g]) => window.__aiTradeWiringTestDebug.grantPlayerGold(g), [GOLD]);
        await page.evaluate(([f]) => window.__aiTradeWiringTestDebug.grantPlayerFood(f), [FOOD]);
      }
      await base.closeEndTurnModals(page, COUNTERS);
      await clearBattles(page);
      if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) { stallTurn = before; break; }
      await base.closeEndTurnModals(page, COUNTERS);
      await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
      const deadline = Date.now() + 300000;
      let adv = false;
      while (!adv && Date.now() < deadline) {
        adv = await page.evaluate(t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), before);
        if (!adv) { await base.closeEndTurnModals(page, COUNTERS); await wait(250); }
      }
      if (!adv) { stallTurn = 'endturn-timeout@' + before; break; }
    }

    await wait(500);
    const snap = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const safe = f => { try { return f(); } catch (e) { return 'THROW: ' + (e && e.message || e); } };
      return {
        state: safe(() => h.state()),
        canEnd: safe(() => h.canEnd()),
        battleState: safe(() => h.battleState()),
        nnsGateBlocked: safe(() => h.nnsGateBlocked()),
        isEndTurnInProgress: safe(() => h.isEndTurnInProgress()),
        urlHash: location.hash,
      };
    });
    const overlays = await dumpOverlays(page);
    const endScreen = await findEndScreen(page);
    const html = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => el.offsetParent !== null
      && /overlay|modal|dialog|popup|summary/i.test(String(el.className || ''))).map(el => el.outerHTML.slice(0, 4000)).join('\n\n'));
    await page.screenshot({ path: path.join(OUT, 'stall-' + SEED + '.png') });
    fs.writeFileSync(path.join(OUT, 'stall-' + SEED + '.html'), html);
    const out = { seed: SEED, stallTurn, snap, overlays, endScreen, errors: errors.slice(-30), counters: COUNTERS };
    fs.writeFileSync(path.join(OUT, 'stall-' + SEED + '.json'), JSON.stringify(out, null, 2));
    console.log('[stall] stallTurn=' + stallTurn + ' canEnd=' + snap.canEnd + ' overlays=' + overlays.length + ' endScreen=' + JSON.stringify(endScreen));
    console.log('[stall] battleState=' + JSON.stringify(snap.battleState) + ' nns=' + snap.nnsGateBlocked + ' inProgress=' + snap.isEndTurnInProgress);
    console.log('[stall] state=' + JSON.stringify(snap.state).slice(0, 800));
  } finally {
    await ctx.close();
  }
}

main().catch(e => { console.error('[stall] BLAD: ' + (e && e.stack || e)); process.exit(1); });
