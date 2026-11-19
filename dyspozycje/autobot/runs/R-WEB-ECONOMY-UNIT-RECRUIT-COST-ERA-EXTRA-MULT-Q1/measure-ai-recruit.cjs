'use strict';
/**
 * measure-ai-recruit.cjs -- R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1, pomiar dymny AI (pkt 5 dispatchu).
 *
 * Realny bundle gry (kopia poza repo, zapatchowana przez tools/ai-city-count-sim.cjs --prepare + hak `units`),
 * headless Chromium (/usr/bin/google-chrome), ziarno seed, realne doStartGame i realne "Zakoncz ture".
 * Zlicza jednostki wg wlasciciela (owner 0 = gracz) w turach 1, 30, 60 oraz wykrywa NaN w dumpie
 * (jednostki/miasta) i bledy strony.
 *
 *   node measure-ai-recruit.cjs --dist <kopia>/dist --out <plik.json> [--seed 4242] [--turns 60] [--size Maly] [--typ kontynenty]
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
const OUT = arg('out');
const SEED = Number(arg('seed', '4242'));
const TURNS = Number(arg('turns', '60'));
const SIZE = arg('size', 'Maly');
const TYP = arg('typ', 'kontynenty');
const LABEL = arg('label', 'run');
const GRA = path.resolve(__dirname, '..', '..', '..', '..', 'gra');
const FALLBACK_CHROME = '/usr/bin/google-chrome';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), LABEL, ...a);

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(fn);
    if (last && last.ready) return last;
    await wait(500);
  }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last).slice(0, 300));
}

function countUnits(dump) {
  const byOwner = {};
  const byType = {};
  for (const u of dump.units) {
    byOwner[u.o] = (byOwner[u.o] || 0) + 1;
    if (u.o !== 0) byType[u.t] = (byType[u.t] || 0) + 1;
  }
  const aiTotal = Object.keys(byOwner).filter((o) => o !== '0').reduce((a, o) => a + byOwner[o], 0);
  return { aiTotal, playerTotal: byOwner[0] || 0, byOwner, aiByType: byType };
}

(async () => {
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu'],
  });
  const res = { label: LABEL, seed: SEED, turns: TURNS, size: SIZE, typ: TYP, snaps: {}, errors: [], nanHits: 0 };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => res.errors.push('[pageerror] ' + String(e).slice(0, 200)));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ SEED) | 0);
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html'), { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__rebelProtectionTestDebug && !!window.__aiCityCountDebug,
    undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed: SEED, mapSize: SIZE, typSwiata: TYP });
    await pollUntil(page, () => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      const overlay = Array.from(document.querySelectorAll('*')).some(
        (el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      const st = dbg.dumpState();
      return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
    }, 900000, 'awaitingFirstPlayerCity');
    const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
    if (!founded) throw new Error('foundPlayerStartCity() = false');
    await pollUntil(page, () => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
    }, 60000, 'playerCity');
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await wait(3000);

    const snap = async (label) => {
      const d = await page.evaluate(() => window.__aiCityCountDebug.dump());
      const txt = JSON.stringify(d);
      res.nanHits += (txt.match(/NaN/g) || []).length;
      res.snaps[label] = { turn: d.turn, cities: d.cities.length, ...countUnits(d) };
      log(label, JSON.stringify({ turn: d.turn, aiTotal: res.snaps[label].aiTotal, playerTotal: res.snaps[label].playerTotal }));
    };
    await snap('t1');
    let turn = (await page.evaluate(() => window.__eraTestDebug.getWorldState().turn));
    while (turn < TURNS) {
      let r = null;
      let retries = 0;
      for (;;) {
        r = await page.evaluate(() => new Promise((resolve) => {
          const dbg = window.__eraTestDebug;
          const turn0 = dbg.getWorldState().turn;
          const t0 = performance.now();
          dbg.endTurn();
          let saw = dbg.isEndTurnInProgress();
          const tick = () => {
            const ip = dbg.isEndTurnInProgress();
            if (ip) saw = true;
            if (!ip && (saw || performance.now() - t0 > 2000)) {
              resolve({ turn0, turn1: dbg.getWorldState().turn });
              return;
            }
            if (performance.now() - t0 > 400000) { resolve({ turn0, turn1: dbg.getWorldState().turn }); return; }
            setTimeout(tick, 4);
          };
          setTimeout(tick, 0);
        }));
        if (r.turn1 > r.turn0) break;
        if (++retries > 6) {
          const txt = await page.evaluate(() => document.body.innerText.slice(0, 2500).replace(/\s+/g, ' '));
          throw new Error('tura nie przechodzi: ' + JSON.stringify(r) + ' | ekran: ' + txt);
        }
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate(() => {
          const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę|Zamknij wszystkie informacyjne|WYKONAJ.*|OTWÓRZ)$/i;
          for (const b of [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click();
        });
        await wait(300);
      }
      turn = r.turn1;
      if (turn === 30 || turn === 60 || turn === TURNS) await snap('t' + turn);
      if (turn % 10 === 0) log('T' + turn);
    }
    res.nanHitsNote = 'NaN liczony w JSON dumpu (jednostki i miasta); zasobow skarbca nie ma w dumpie -- NIE ZMIERZONO';
  } catch (e) {
    res.errors.push('[run] ' + String(e).slice(0, 3000));
  } finally {
    await browser.close().catch(() => {});
  }
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log(JSON.stringify({ t1: res.snaps.t1 && res.snaps.t1.aiTotal, t30: res.snaps.t30 && res.snaps.t30.aiTotal, t60: res.snaps.t60 && res.snaps.t60.aiTotal, nanHits: res.nanHits, errors: res.errors.length }));
})();
