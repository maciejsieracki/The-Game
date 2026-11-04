'use strict';
/**
 * ai-army-live-measure.cjs -- R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1: POMIAR PELNEJ GRY (realny bundle, headless
 * Chromium, realne `doStartGame` + realne "Zakoncz ture", realny `decideAITurn` + realny executor ruchu AI z main.ts).
 * Zero zmian w repo: bundle budowany z KOPII `gra/` poza repo (patrz tools/ai-army-live-measure.README w raporcie):
 * kopia ma patch `ai-city-live-measure.cjs --prepare` + hak `window.__armyDump.dump()` (jednostki AI bez cywili/garnizonow,
 * wojny, miasta, log komend `move` AI: heks startowy, cel, allowFriendlyStack).
 *
 *   node tools/ai-army-live-measure.cjs --pw <katalog z node_modules/playwright> --dist <dist> --out <katalog>
 *        --label pre|post --seed 4242 --turns 100 [--size Standardowy] [--typ kontynenty|pangea]
 * Wynik: <out>/<label>-<typ>-<seed>.json (per tura per AI: armie/stosy, samotne poza miastem, rozbicia stosu w marszu,
 * miejsce urodzenia jednostek) + podsumowanie `summary` (histogram przyczyn).
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
const dist = (a, b) => { const dq = a[0] - b[0], dr = a[1] - b[1]; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

/** Analiza jednej tury jednej AI. prev/cur = dump.units tej AI; cmds = log move tej tury. */
function analyze(owner, prevUnits, curUnits, cmds, cities, wars) {
  const myCities = cities.filter((c) => c.o === owner);
  const cityHex = new Set(myCities.map((c) => key(c.q, c.r)));
  const field = curUnits.filter((u) => !u.civ && !u.g && !u.emb && u.cat !== 'galera');
  const byHex = new Map();
  for (const u of field) { const k = key(u.q, u.r); if (!byHex.has(k)) byHex.set(k, []); byHex.get(k).push(u); }
  const stackSizes = [...byHex.values()].map((a) => a.length);
  const outsideSingles = [...byHex.entries()].filter(([k, a]) => a.length === 1 && !cityHex.has(k)).length;
  const outsideUnits = [...byHex.entries()].filter(([k]) => !cityHex.has(k)).reduce((s, [, a]) => s + a.length, 0);
  const atWar = wars.some(([a]) => a === owner) || wars.some(([, b]) => b === owner);
  // rozbicia stosow: jednostki startujace TEJ tury z jednego heksu, konczace na roznych heksach.
  const endPos = new Map(curUnits.map((u) => [u.id, [u.q, u.r]]));
  const startGroups = new Map();
  for (const c of cmds) if (c.f) { const k = key(c.f[0], c.f[1]); if (!startGroups.has(k)) startGroups.set(k, new Set()); startGroups.get(k).add(c.u); }
  // pelne stosy startowe (z prevUnits), nie tylko te z komenda
  const prevByHex = new Map();
  for (const u of prevUnits.filter((x) => !x.civ && !x.g && !x.emb && x.cat !== 'galera')) { const k = key(u.q, u.r); if (!prevByHex.has(k)) prevByHex.set(k, []); prevByHex.get(k).push(u); }
  let splitStacks = 0, splitUnits = 0, keptStacks = 0, stacksTotal = 0; const splitDetail = [];
  for (const [k, arr] of prevByHex) {
    if (arr.length < 2 || cityHex.has(k)) continue;
    stacksTotal++;
    const ends = new Set(arr.filter((u) => endPos.has(u.id)).map((u) => key(...endPos.get(u.id))));
    if (ends.size > 1) { splitStacks++; splitUnits += arr.length; if (splitDetail.length < 5) splitDetail.push({ at: k, n: arr.length, ends: ends.size, afsCmds: cmds.filter((c) => c.f && key(c.f[0], c.f[1]) === k).map((c) => c.afs) }); }
    else keptStacks++;
  }
  const prevIds = new Set(prevUnits.map((u) => u.id));
  const born = curUnits.filter((u) => !prevIds.has(u.id) && !u.civ);
  const bornByHex = new Map(); for (const u of born) { const k = key(u.q, u.r); bornByHex.set(k, (bornByHex.get(k) || 0) + 1); }
  const bornAtCity = born.filter((u) => cityHex.has(key(u.q, u.r))).length;
  // marsz pojedynczej jednostki: jednostka ktora NIE byla w stosie >=2 na starcie i dostala `move` poza miastem
  let lone = 0, loneToTarget = 0, loneRally = 0;
  for (const c of cmds) {
    if (!c.f) continue; const k = key(c.f[0], c.f[1]);
    const n = (prevByHex.get(k) || []).length;
    if (n === 1 && !cityHex.has(k)) { lone++; if (c.tc) loneToTarget++; else loneRally++; }
  }
  const sorted = [...stackSizes].sort((a, b) => b - a);
  return {
    owner, atWar, units: field.length, hexes: byHex.size, stacks: stackSizes.filter((s) => s >= 2).length,
    maxStack: sorted[0] || 0, hist: sorted.slice(0, 12), outsideSingles, outsideUnits, citiesN: myCities.length,
    cmds: cmds.length, afsCmds: cmds.filter((c) => c.afs).length,
    stacksTotal, splitStacks, splitUnits, keptStacks, splitDetail,
    born: born.length, bornAtCity, bornHexes: bornByHex.size, bornMaxPerHex: Math.max(0, ...bornByHex.values()),
    lone, loneToTarget, loneRally,
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
    let prevUnits = d0.units; let turn = d0.turn;
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
      const owners = [...new Set(d.units.map((u) => u.o))];
      const rows = [];
      for (const o of owners) {
        rows.push(analyze(o, prevUnits.filter((u) => u.o === o), d.units.filter((u) => u.o === o), d.cmdLog.filter((c) => c.o === o), d.cities, d.wars));
      }
      res.perTurn.push({ turn, ms: Math.round(r.ms), rows });
      if (turn === TURNS || turn % 25 === 0) { res.cityNames = d.cities.filter((c) => c.o > 0).map((c) => c.o + ':' + c.name).slice(0, 80); }
      prevUnits = d.units;
      if (turn % 10 === 0) { res.lastTurn = turn; res.errors = errors.slice(0, 5); save(); log(`T${turn} lastTurnMs=${r.ms.toFixed(0)}`); }
    }
    res.errors = errors.slice(0, 5); res.done = true; res.finishedAt = new Date().toISOString(); save();
    fs.writeFileSync(OUT.replace(/\.json$/, '.DONE'), 'ok\n'); log('DONE');
  } catch (e) {
    res.error = String((e && e.stack) || e).slice(0, 800); save();
    fs.writeFileSync(OUT.replace(/\.json$/, '.DONE'), 'ERROR ' + res.error.slice(0, 200) + '\n'); log('ERROR', res.error.slice(0, 300));
  } finally { await browser.close().catch(() => {}); }
}
main().then(() => process.exit(0));
