'use strict';
/**
 * resource-ledger-shots-live.cjs -- R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 (GOAL 1):
 * zrzuty Chromium karty "Skad zapasy" dla SOLI i CERAMIKI z PRAWDZIWEJ gry (realny bundle vite, realny doStartGame,
 * realne "Zakoncz ture"; zadna makieta DOM). Linie ksiegi pochodza z realnego ticku ekonomii:
 *   "+N Warzelnia (<miasto>)" (Warzelnia soli na heksie), "+N Garncarnia (<miasto>)" (konwersja), "-N Obywatele",
 *   "+N Umowa wymiany z <civ>" (realny transferBasketItems przez hak `__ledgerTestDebug.trade`).
 * Dwa rozmiary okna (1280x800, 1920x1080); panel imperium otwiera REALNY `openEmpireDetailFromHud` przez hak
 * `__ledgerTestDebug.openEmpirePanel` (jedyny hak dodany w tym temacie, tylko ?civTest=1).
 * Kontrola negatywna: ta sama strona BEZ `?civTest=1` nie ma `__ledgerTestDebug`.
 *
 * Uzycie (z gra/), bundle budowany POZA repo:
 *   node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-shot-dist --emptyOutDir
 *   node tools/resource-ledger-shots-live.cjs --dist /tmp/civ-shot-dist --out <katalog> [--seed 4242] [--turns 3]
 * Wynik: <out>/{sol,ceramika}-card-{1280,1920}.png, <out>/panel-{1280,1920}.png, <out>/shots.json (tekst wierszy, kolory, wymiary).
 */
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg('dist', '.'));
const OUT = path.resolve(arg('out', 'shots-out'));
const SEED = Number(arg('seed', '4242'));
const TURNS = Number(arg('turns', '3'));
// blok handlu zalezy od epoki umowy (FALA 742: 10/50/100) -- 100 jest wielokrotnoscia kazdego bloku (30 dawalo transfer 0)
const TRADE_QTY = Number(arg('trade-qty', '100'));
const PW = path.resolve(__dirname, '..', 'node_modules', 'playwright');
const CHROME = fs.existsSync((require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')) ? (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')
  : (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require(PW);
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const res = { seed: SEED, turns: TURNS, dist: path.basename(DIST), at: new Date().toISOString() };
  try {
    // --- kontrola negatywna: bez ?civTest=1 haki nie istnieja ---
    {
      const p0 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await p0.goto('file://' + path.join(DIST, 'index.html'), { waitUntil: 'load', timeout: 180000 });
      await p0.waitForSelector('.civ-menu', { timeout: 180000 });
      res.negativeControl = await p0.evaluate(() => ({ ledgerTestDebug: typeof window.__ledgerTestDebug, nnsMeasureDebug: typeof window.__nnsMeasureDebug }));
      await p0.close();
      if (res.negativeControl.ledgerTestDebug !== 'undefined') throw new Error('negative control failed: __ledgerTestDebug istnieje bez ?civTest=1');
    }
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => { (res.pageerrors = res.pageerrors || []).push(String(e).slice(0, 200)); });
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const blocked = []; page.on('console', (m) => { const t = m.text(); if (t.includes('[EndTurn] blocked')) blocked.push(t.slice(0, 200)); });
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ SEED) | 0);
    await page.goto('file://' + path.join(DIST, 'index.html') + `?civTest=1&civSeed=${SEED}`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__ledgerTestDebug && !!window.__aiTradeWiringTestDebug && !!window.__aiBuildingsTestDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    res.hookPresentWithFlag = await page.evaluate(() => typeof window.__ledgerTestDebug.openEmpirePanel);
    await page.evaluate((s) => window.__aiBuildingsTestDebug.startNewGame({ seed: s }), SEED);
    const t0 = Date.now();
    for (;;) {
      const ok = await page.evaluate(() => { try { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return d.awaitingFirstPlayerCity === true && d.playerStartHex !== null; } catch (e) { return false; } });
      if (ok) break;
      if (Date.now() - t0 > 900000) throw new Error('timeout awaitingFirstPlayerCity');
      await wait(500);
    }
    const overlayGone = async (what) => {
      const t1 = Date.now();
      for (;;) {
        const ov = await page.evaluate(() => Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null && el.children.length === 0));
        if (!ov) return;
        if (Date.now() - t1 > 600000) throw new Error('nakladka "Tworzenie swiata" nie znika (' + what + ')');
        await wait(500);
      }
    };
    await overlayGone('przed zalozeniem miasta');
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity false');
    await overlayGone('po zalozeniu miasta');
    await wait(500);
    try { await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest()); } catch (e) { /* opcjonalne */ }
    try { await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true)); } catch (e) { /* opcjonalne */ }
    await wait(300);
    // Scena: Warzelnia soli + Garncarnia + zapasy w miescie gracza; AI dostaje miasto (druga strona umowy wymiany).
    const info = await page.evaluate(() => window.__aiTradeWiringTestDebug.info());
    res.info = info;
    res.scenarioMe = await page.evaluate(() => window.__ledgerTestDebug.scenarioSeed(0));
    const aiOwner = info.ai;
    if (aiOwner != null) {
      res.spawnedAiCity = await page.evaluate((x) => window.__ledgerTestDebug.spawnOwnerCity(x), aiOwner);
      if (res.spawnedAiCity) res.scenarioAi = await page.evaluate((x) => window.__ledgerTestDebug.scenarioSeed(x), aiOwner);
    }
    res.turnsLog = [];
    for (let i = 0; i < TURNS; i++) {
      // umowa wymiany w trakcie tury: sol i ceramika od AI do gracza (realny transferBasketItems -> okno "pending" ksiegi)
      if (aiOwner != null) {
        const tr = await page.evaluate(([a, QTY]) => {
          const out = {};
          out.sol = window.__ledgerTestDebug.trade(a, 0, 'sol', QTY);
          out.ceramika = window.__ledgerTestDebug.trade(a, 0, 'ceramika', QTY);
          out.pendingKeys = Object.keys(window.__ledgerTestDebug.pendingPeek());
          return out;
        }, [aiOwner, TRADE_QTY]);
        (res.trades = res.trades || []).push({ turn: i + 1, ...tr });
      }
      for (let k = 0; k < 20; k++) {
        const gb = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
        if (!gb) break;
        await page.evaluate(() => { window.__aiTradeWiringTestDebug.grantPlayerGold(2000); window.__aiTradeWiringTestDebug.grantPlayerFood(2000); });
        await wait(150);
      }
      // Wyscig harnessu: tura juz sie zmienila, ale endTurnInProgress gasnie chwile pozniej -> wczesniejszy endTurn byl odrzucany
      // ("[EndTurn] blocked: endTurnInProgress"). Czekamy, az flaga zgasnie (max 120 s), zanim wywolamy kolejny endTurn.
      for (let k = 0; k < 480; k++) { if (!(await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress()))) break; await wait(250); }
      const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
      // Jak w longrun-harnessie: gdy endTurn nie przesuwa tury (okno/blokada), zamknij okna (Escape, OK/Zamknij) i ponow, max 6 prob.
      let after = before; let attempts = 0;
      while (after <= before && attempts < 6) {
        attempts++;
        if (await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked())) await page.evaluate(() => { window.__aiTradeWiringTestDebug.grantPlayerGold(2000); window.__aiTradeWiringTestDebug.grantPlayerFood(2000); });
        await page.evaluate(() => window.__eraTestDebug.endTurn());
        for (let k = 0; k < 480 && after <= before; k++) {
          await wait(250); after = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
          if (after <= before && k > 8 && !(await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress()))) break; // odrzucone, nie w toku
        }
        if (after <= before) {
          await page.keyboard.press('Escape').catch(() => {});
          await page.evaluate(() => {
            const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
            for (const b of [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click();
          });
          await wait(400);
        }
      }
      res.turnsLog.push({ before, after, attempts, consoleBlocked: blocked.splice(0).slice(-4) });
      if (after <= before) throw new Error('tura nie przeszla: ' + before);
      await wait(400);
    }
    res.snapshot = await page.evaluate(() => { const s = window.__ledgerTestDebug.snapshot(); return { turn: s.turn, stockMe: s.stock['0'] && { sol: s.stock['0'].sol, ceramika: s.stock['0'].ceramika }, tickMeSol: s.tick['0'] && s.tick['0'].byResource && s.tick['0'].byResource.sol, tickMeCer: s.tick['0'] && s.tick['0'].byResource && s.tick['0'].byResource.ceramika }; });
    // tryb przyspieszony (skipRender) wylaczony przed zrzutami, zeby mapa za panelem byla narysowana (bez tego po zmianie rozmiaru okna plotno jest czarne)
    try { res.fastModeOff = await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(false)); } catch (e) { res.fastModeOff = 'brak hooka'; }
    await wait(1500);
    res.sizes = {};
    for (const vp of [{ w: 1280, h: 800 }, { w: 1920, h: 1080 }]) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await wait(2500);
      await overlayGone('przed zrzutem');
      // zamknij okna otwarte przez gre w trakcie tur (np. "Audiencja dyplomatyczna" po spotkaniu panstwa-miasta), zeby nie przyciemnialy zrzutu
      for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape').catch(() => {}); await wait(250); }
      await page.evaluate(() => window.__ledgerTestDebug.openEmpirePanel('surowce'));
      await wait(1000);
      const r = { viewport: vp, cards: {} };
      for (const key of ['sol', 'ceramika']) {
        const card = page.locator(`.civ-emp-res-card[data-section="econ-surowiec-${key}"]`).first();
        if (!(await card.count())) { r.cards[key] = { found: false }; continue; }
        // otworz "Skad zapasy", jesli zwiniete (sol i ceramika maja domyslnie open; zostawiamy realny stan)
        const dump = await card.evaluate((el) => {
          const d = el.querySelector('details.civ-emp-res-skad');
          const rows = d ? [...d.querySelectorAll('.civ-emp-res-skad-row')].map((row) => {
            const v = row.querySelector('.v'); const cs = v ? getComputedStyle(v) : null;
            return { cls: row.className, text: row.innerText.replace(/\s+/g, ' ').trim(), valueColor: cs ? cs.color : null };
          }) : [];
          const r0 = el.getBoundingClientRect();
          return { open: d ? d.open : null, rows, cardWidth: Math.round(r0.width), cardHeight: Math.round(r0.height), cardLeft: Math.round(r0.left), cardTop: Math.round(r0.top), nameText: (el.querySelector('.nm') || {}).innerText || null };
        });
        r.cards[key] = { found: true, ...dump };
        await card.screenshot({ path: path.join(OUT, `${key}-card-${vp.w}.png`) });
      }
      const panelBox = await page.evaluate(() => { const e = document.querySelector('.civ-emp-body'); const b = e ? e.getBoundingClientRect() : null; return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null; });
      r.panelBody = panelBox;
      await page.screenshot({ path: path.join(OUT, `panel-${vp.w}.png`) });
      res.sizes[vp.w] = r;
    }
    fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(res, null, 2));
    console.log('DONE', JSON.stringify({ sol1280: res.sizes[1280].cards.sol.rows, cer1280: res.sizes[1280].cards.ceramika.rows }));
  } catch (e) {
    res.error = String((e && e.stack) || e).slice(0, 800);
    fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(res, null, 2));
    console.log('ERROR', String(e).slice(0, 400)); process.exitCode = 1;
  } finally { await browser.close().catch(() => {}); }
}
main().then(() => process.exit(process.exitCode || 0));
