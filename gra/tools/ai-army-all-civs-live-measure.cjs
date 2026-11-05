'use strict';
/**
 * ai-army-all-civs-live-measure.cjs -- R-WEB-AI-ARMY-ALL-CIVS-GATHER-UNDER-GENERAL-Q1: pomiar PELNEJ GRY
 * (realny bundle, headless Chromium, realne "Zakoncz ture", realny decideAITurn + executor z main.ts).
 * Bundle z KOPII gra/ poza repo: `ai-city-live-measure.cjs --prepare <kopia>` + hak `window.__armyDump.dump()`
 * (jednostki AI z isGeneral/hp, wlasciciele: cywilizacja, epoka, stolica, wodz w kolejce, etap kampanii, wojna).
 *
 *   node tools/ai-army-all-civs-live-measure.cjs --pw <katalog z node_modules/playwright> --dist <dist> --out <katalog>
 *        --label pre|post --seed 4242 --turns 100 [--size Standardowy] [--typ kontynenty|pangea]
 * Wynik: <out>/<label>-<typ>-<seed>.json (per tura per cywilizacja: wodzowie vs limit epoki, jednostki bojowe,
 * przy wodzu (promien <=2), w miescie, rozproszone poza miastem i poza wodzem + histogram odleglosci do najblizszego
 * wodza, nowo wytworzone i czas dotarcia do wodza) + `<label>-<typ>-<seed>.DONE`.
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const PW = arg('pw'); const DIST = arg('dist'); const OUTD = arg('out');
const LABEL = arg('label', 'run'); const TYP = arg('typ', 'kontynenty');
const SEED = Number(arg('seed', '4242')); const TURNS = Number(arg('turns', '100')); const SIZE = arg('size', 'Standardowy');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), LABEL, TYP, SEED, ...a);
const OUT = path.join(OUTD, `${LABEL}-${TYP}-${SEED}.json`);
const key = (q, r) => q + ',' + r;
const dist = (a, b) => { const dq = a.q - b.q, dr = a.r - b.r; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };
const NEAR = 2;

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

/** Analiza jednej cywilizacji w jednej turze. birthTurn: Map id -> {turn, reachedTurn}. */
function analyze(ow, units, cities, turn, born) {
  const mine = units.filter((u) => u.o === ow.o);
  const myCities = cities.filter((c) => c.o === ow.o);
  const cityHex = new Set(myCities.map((c) => key(c.q, c.r)));
  const gens = mine.filter((u) => u.ge && !u.civ && u.hp > 0);
  const combat = mine.filter((u) => !u.civ && !u.g && !u.emb && !u.ge && u.cat !== 'galera');
  let near = 0, inCity = 0, far = 0; const hist = { '0-2': 0, '3-5': 0, '6-10': 0, '11+': 0, 'brak': 0 };
  const farIds = [];
  for (const u of combat) {
    let d = Infinity; for (const g of gens) d = Math.min(d, dist(u, g));
    if (d <= NEAR) { near++; }
    else if (cityHex.has(key(u.q, u.r))) { inCity++; }
    else { far++; farIds.push(u.id); }
    const b = d === Infinity ? 'brak' : d <= 2 ? '0-2' : d <= 5 ? '3-5' : d <= 10 ? '6-10' : '11+';
    hist[b]++;
    const bi = born.get(u.id);
    if (bi && bi.reached === undefined && d <= NEAR) bi.reached = turn;
  }
  // singletony poza miastem (bez wodzia w promieniu): ile jednostek stoi samotnie
  const byHex = new Map(); for (const u of combat) { const k = key(u.q, u.r); byHex.set(k, (byHex.get(k) || 0) + 1); }
  const singlesOutside = [...byHex.entries()].filter(([k, n]) => n === 1 && !cityHex.has(k)).length;
  return {
    o: ow.o, civ: ow.civ, era: ow.era, limit: ow.era, gens: gens.length, queuedGen: ow.queuedGen, gold: ow.gold, koszary: ow.koszary, offer: ow.offer, camp: ow.camp, war: ow.war,
    combat: combat.length, near, inCity, far, hist, singlesOutside, cities: myCities.length,
  };
}

async function main() {
  fs.mkdirSync(OUTD, { recursive: true });
  const { chromium } = require(path.join(path.resolve(PW), 'node_modules', 'playwright'));
  const res = { label: LABEL, typ: TYP, seed: SEED, size: SIZE, turns: TURNS, startedAt: new Date().toISOString(), perTurn: [], turnMs: [], done: false };
  const save = () => fs.writeFileSync(OUT, JSON.stringify(res));
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
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
      && !!window.__aiBuildingsTestDebug && !!window.__armyDump, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed: SEED, mapSize: SIZE, typSwiata: TYP });
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
    let d0 = await page.evaluate(() => window.__armyDump.dump());
    let turn = d0.turn; const seen = new Set(d0.units.map((u) => u.id)); const born = new Map();
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
      turn = r.turn1; res.turnMs.push(Math.round(r.ms));
      const d = await page.evaluate(() => window.__armyDump.dump());
      for (const u of d.units) if (!seen.has(u.id)) { seen.add(u.id); if (!u.civ && !u.ge) born.set(u.id, { o: u.o, turn }); }
      const rows = d.owners.map((ow) => analyze(ow, d.units, d.cities, turn, born));
      res.perTurn.push({ turn, ms: Math.round(r.ms), rows });
      if (turn % 10 === 0) { res.lastTurn = turn; res.errors = errors.slice(0, 5); res.born = [...born.entries()].map(([id, b]) => [id, b.o, b.turn, b.reached ?? null]); save(); log(`T${turn} lastTurnMs=${r.ms.toFixed(0)}`); }
    }
    res.born = [...born.entries()].map(([id, b]) => [id, b.o, b.turn, b.reached ?? null]);
    res.errors = errors.slice(0, 5); res.done = true; res.finishedAt = new Date().toISOString(); save();
    fs.writeFileSync(OUT.replace(/\.json$/, '.DONE'), 'ok\n'); log('DONE');
  } catch (e) {
    res.error = String((e && e.stack) || e).slice(0, 800); save();
    fs.writeFileSync(OUT.replace(/\.json$/, '.DONE'), 'ERROR ' + res.error.slice(0, 200) + '\n'); log('ERROR', res.error.slice(0, 300));
  } finally { await browser.close().catch(() => {}); }
}
main().then(() => process.exit(0));
