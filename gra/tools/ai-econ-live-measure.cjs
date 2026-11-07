'use strict';
/**
 * ai-econ-live-measure.cjs -- R-WEB-AI-VS-PLAYER-ECONOMY-AUDIT-Q1 (r3): POMIAR PELNEJ GRY (realny bundle, headless Chromium,
 * realne "Zakoncz ture", realny decideAITurn). Gracz konczy tury pasywnie (zalozone miasto startowe, bez rekrutacji/budowy).
 * Co turę zapisuje stan ekonomii i wojska KAZDEGO wlasciciela (AI + gracz 0 + miasta-panstwa) z window.__econDump.dump()
 * (patrz ai-econ-live-hook.cjs): skarbiec, dochod/utrzymanie z silnika, liczba jednostek bojowych, miast, budynkow,
 * suwaki, rozklad rozmiaru stosow (plakietka garnizonu "x N" = stack.length jednostek na heksie).
 *
 * Przygotowanie KOPII gra/ (POZA repo):  node tools/ai-city-live-measure.cjs --prepare <kopia>
 *                                        node tools/ai-army-all-civs-live-hook.cjs <kopia>
 *                                        node tools/ai-econ-live-hook.cjs <kopia>
 *                                        (w kopii) node ./node_modules/vite/bin/vite.js build --outDir <poza repo>/dist --emptyOutDir
 * Uruchomienie:  node tools/ai-econ-live-measure.cjs --pw <katalog z node_modules/playwright> --dist <dist> --out <katalog>
 *                   --label r3 --seed 4242 --turns 100 [--size Maly|Standardowy] [--typ kontynenty|pangea] [--budget-ms 570000]
 * --budget-ms: po przekroczeniu przerywa petle czysto i zapisuje to, co zmierzono (done=false, lastTurn) -- pomiar w jednym
 * wywolaniu pierwszoplanowym (bez procesow w tle).
 */
const fs = require('fs');
const path = require('path');
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def; }
const PW = arg('pw'); const DIST = arg('dist'); const OUTD = arg('out');
const LABEL = arg('label', 'run'); const TYP = arg('typ', 'kontynenty');
const SEED = Number(arg('seed', '4242')); const TURNS = Number(arg('turns', '100')); const SIZE = arg('size', 'Standardowy');
const BUDGET = Number(arg('budget-ms', '570000'));
const CS = Number(arg('cs', '2')); const CIVT = Number(arg('civs', '4'));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), LABEL, TYP, SEED, ...a);
const OUT = path.join(OUTD, `${LABEL}-${TYP}-${SEED}.json`);
async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}
async function main() {
  fs.mkdirSync(OUTD, { recursive: true });
  const t00 = Date.now();
  const { chromium } = require(path.join(path.resolve(PW), 'node_modules', 'playwright'));
  const res = { label: LABEL, typ: TYP, seed: SEED, size: SIZE, turns: TURNS, startedAt: new Date().toISOString(), perTurn: [], turnMs: [], done: false };
  const save = () => fs.writeFileSync(OUT, JSON.stringify(res));
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 200)));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ SEED) | 0);
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html'), { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__econDump, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed: SEED, mapSize: SIZE, typSwiata: TYP, cityStates: CS, civTypes: CIVT });
    await pollUntil(page, () => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      const st = dbg.dumpState();
      return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
    }, 1500000, 'awaitingFirstPlayerCity');
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity() = false');
    await pollUntil(page, () => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
    }, 60000, 'playerCity');
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await wait(500);
    res.genMs = Date.now() - t00; log('worldgen+start ms', res.genMs);
    res.t0 = await page.evaluate(() => window.__econDump.dump());
    let turn = res.t0.turn;
    while (turn < TURNS) {
      if (Date.now() - t00 > BUDGET) { log('budzet czasu wyczerpany na turze', turn); break; }
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
      turn = r.turn1; res.turnMs.push(Math.round(r.ms));
      const d = await page.evaluate(() => window.__econDump.dump());
      res.perTurn.push({ turn, ms: Math.round(r.ms), owners: d.owners });
      res.lastTurn = turn;
      if (turn % 5 === 0) { res.errors = errors.slice(0, 5); save(); log(`T${turn} ${Math.round(r.ms)}ms elapsed=${Math.round((Date.now() - t00) / 1000)}s`); }
    }
    res.errors = errors.slice(0, 5); res.done = turn >= TURNS; res.finishedAt = new Date().toISOString(); save();
    log(res.done ? 'DONE' : 'PARTIAL lastTurn=' + turn);
  } catch (e) {
    res.error = String((e && e.stack) || e).slice(0, 800); save(); log('ERROR', res.error.slice(0, 300));
  } finally { await browser.close().catch(() => {}); }
}
main().then(() => process.exit(0));
