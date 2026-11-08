'use strict';
/**
 * ai-war-weariness-live-audit-measure.cjs -- R-WEB-AI-WAR-WEARINESS-LIVE-AUDIT-Q1: pomiar PELNEJ GRY (realny bundle,
 * headless Chromium, realne "Zakoncz ture", realny tick zmeczenia wojna). Bundle z KOPII gra/ poza repo:
 * `ai-city-live-measure.cjs --prepare <kopia>` + `ai-war-weariness-live-audit-hook.cjs <kopia>` + vite build --outDir poza repo.
 *
 *   node tools/ai-war-weariness-live-audit-measure.cjs --pw <katalog z node_modules/playwright> --dist <dist> --out <katalog>
 *        --label pre|post --seed 4242 --turns 150 [--size Standardowy] [--typ kontynenty|pangea]
 * Wynik (JSONL, jedna linia = jedna tura): <out>/<label>-<typ>-<seed>.jsonl  {turn, ms, owners, cities, wars, rel, logs}
 * + <label>-<typ>-<seed>.status.json (postep) i `.DONE`. `logs` = linie konsoli "[Dyplomacja]" z tej tury.
 * Analiza: ai-war-weariness-live-audit-summarize.cjs.
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const PW = arg('pw'); const DIST = arg('dist'); const OUTD = arg('out');
const LABEL = arg('label', 'run'); const TYP = arg('typ', 'kontynenty');
const SEED = Number(arg('seed', '4242')); const TURNS = Number(arg('turns', '150')); const SIZE = arg('size', 'Standardowy');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), LABEL, TYP, SEED, ...a);
const BASE = path.join(OUTD, `${LABEL}-${TYP}-${SEED}`);

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

async function main() {
  fs.mkdirSync(OUTD, { recursive: true });
  const { chromium } = require(path.join(path.resolve(PW), 'node_modules', 'playwright'));
  fs.writeFileSync(BASE + '.jsonl', '');
  const status = { label: LABEL, typ: TYP, seed: SEED, size: SIZE, turns: TURNS, startedAt: new Date().toISOString(), lastTurn: 0, errors: [] };
  const saveStatus = () => fs.writeFileSync(BASE + '.status.json', JSON.stringify(status));
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    let pendingLogs = [];
    page.on('pageerror', (e) => status.errors.push('[pageerror] ' + String(e).slice(0, 200)));
    page.on('console', (m) => { const t = m.text(); if (t.startsWith('[Dyplomacja]') || /elimin|zniszczon|upad/i.test(t)) pendingLogs.push(t.slice(0, 320)); });
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ SEED) | 0);
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__wwDump, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed: SEED, mapSize: SIZE, typSwiata: TYP });
    await pollUntil(page, () => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      const st = dbg.dumpState();
      return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
    }, 1500000, 'awaitingFirstPlayerCity');
    status.worldReadyAt = new Date().toISOString(); saveStatus();
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity() = false');
    await pollUntil(page, () => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
    }, 60000, 'playerCity');
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await wait(500);
    let turn = (await page.evaluate(() => window.__wwDump.dump())).turn;
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
      const d = await page.evaluate(() => window.__wwDump.dump());
      fs.appendFileSync(BASE + '.jsonl', JSON.stringify({ ...d, ms: Math.round(r.ms), logs: pendingLogs }) + '\n');
      pendingLogs = [];
      status.lastTurn = turn; status.lastMs = Math.round(r.ms); status.updatedAt = new Date().toISOString(); saveStatus();
      if (turn % 10 === 0) log(`T${turn} lastTurnMs=${r.ms.toFixed(0)} wojen=${d.wars.length}`);
    }
    status.done = true; status.finishedAt = new Date().toISOString(); saveStatus();
    fs.writeFileSync(BASE + '.DONE', 'ok\n'); log('DONE');
  } catch (e) {
    status.error = String((e && e.stack) || e).slice(0, 800); saveStatus();
    fs.writeFileSync(BASE + '.DONE', 'ERROR ' + status.error.slice(0, 200) + '\n'); log('ERROR', status.error.slice(0, 300));
  } finally { await browser.close().catch(() => {}); }
}
main().then(() => process.exit(0));
