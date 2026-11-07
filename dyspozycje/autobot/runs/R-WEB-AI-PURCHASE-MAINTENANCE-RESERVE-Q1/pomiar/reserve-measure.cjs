'use strict';
/**
 * reserve-measure.cjs -- R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1: pomiar zywej gry (headless Chromium, realny bundle,
 * realne doStartGame + "Zakoncz ture"). Metryki per tura per AI: jednostki wojskowe, miasta, skarbiec, utrzymanie, wojny.
 * node reserve-measure.cjs --pw <katalog-z-node_modules/playwright> --dist <dist> --out <plik.json> --seed 4242 --turns 40
 */
const fs = require('fs');
const path = require('path');
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def; }
const PW = arg('pw'); const DIST = arg('dist'); const OUT = arg('out');
const SEED = Number(arg('seed', '4242')); const TURNS = Number(arg('turns', '40')); const SIZE = arg('size', 'Maly'); const CIV = Number(arg('civ', '4'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), path.basename(OUT), ...a);

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

async function main() {
  const { chromium } = require(path.join(path.resolve(PW), 'node_modules', 'playwright'));
  const res = { seed: SEED, size: SIZE, civ: CIV, turns: TURNS, perTurn: [], done: false };
  const save = () => fs.writeFileSync(OUT, JSON.stringify(res));
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 200)));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }, (0x9e3779b9 ^ SEED) | 0);
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html'), { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug && !!window.__aiBuildingsTestDebug && !!window.__resDump, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed: SEED, mapSize: SIZE, typSwiata: 'kontynenty', civTypes: CIV });
    await pollUntil(page, () => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      const st = dbg.dumpState();
      return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
    }, 1500000, 'awaitingFirstPlayerCity');
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity false');
    await pollUntil(page, () => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
    }, 60000, 'playerCity');
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await wait(500);
    let turn = (await page.evaluate(() => window.__resDump.dump())).turn;
    while (turn < TURNS) {
      let r = null; let retries = 0;
      for (;;) {
        r = await page.evaluate(() => new Promise((resolve) => {
          const dbg = window.__eraTestDebug; const turn0 = dbg.getWorldState().turn; const t0 = performance.now();
          dbg.endTurn(); let saw = dbg.isEndTurnInProgress();
          const tick = () => {
            const ip = dbg.isEndTurnInProgress(); if (ip) saw = true;
            if (!ip && (saw || performance.now() - t0 > 2000)) { resolve({ ms: performance.now() - t0, turn0, turn1: dbg.getWorldState().turn }); return; }
            if (performance.now() - t0 > 400000) { resolve({ ms: -1, turn0, turn1: dbg.getWorldState().turn }); return; }
            setTimeout(tick, 4);
          };
          setTimeout(tick, 0);
        }));
        if (r.turn1 > r.turn0) break;
        if (++retries > 6) throw new Error('tura nie przechodzi: ' + JSON.stringify(r));
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate(() => {
          const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
          for (const b of [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click();
        });
        await wait(300);
      }
      turn = r.turn1;
      const d = await page.evaluate(() => window.__resDump.dump());
      const owners = [...new Set(d.cities.map((c) => c.o))].filter((o) => o > 0);
      const rows = owners.map((o) => ({
        o, mil: d.units.filter((u) => u.o === o && !u.civ).length, cities: d.cities.filter((c) => c.o === o).length,
        treas: Math.round(d.treas[o] ?? 0), upkeep: Math.round((d.upkeep[o] ?? 0) * 10) / 10, war: d.wars.includes(o),
      }));
      res.perTurn.push({ turn, rows });
      if (turn % 10 === 0) { res.errors = errors.slice(0, 5); save(); log(`T${turn} ` + rows.map((x) => `${x.o}:m${x.mil}/c${x.cities}/$${x.treas}`).join(' ')); }
    }
    res.errors = errors.slice(0, 5); res.done = true; save(); fs.writeFileSync(OUT.replace(/\.json$/, '.DONE'), 'ok\n'); log('DONE');
  } catch (e) {
    res.error = String((e && e.stack) || e).slice(0, 800); save(); fs.writeFileSync(OUT.replace(/\.json$/, '.DONE'), 'ERROR\n'); log('ERROR', res.error.slice(0, 300));
  } finally { await browser.close().catch(() => {}); }
}
main().then(() => process.exit(0));
