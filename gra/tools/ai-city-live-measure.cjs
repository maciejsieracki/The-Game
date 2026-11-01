'use strict';
/**
 * ai-city-live-measure.cjs — R-WEB-AI-CITY-YIELD-LIVE-Q1: POMIAR PELNEJ GRY (realny bundle, headless Chromium,
 * realne doStartGame + realne "Zakoncz ture"), PRE vs POST poprawki oceny miejsc pod miasta AI. Zero zmian w repo:
 * wszystko dzieje sie w KOPII `gra/` poza repo (patrz --prepare), bundle budowany `vite build --outDir <poza repo>`.
 *
 *  1) node tools/ai-city-live-measure.cjs --prepare <kopia-gra> [--weight 0.25]
 *     Patch KOPII src/main.ts: __aiBuildingsTestDebug.startNewGame przyjmuje { mapSize, typSwiata } + hak
 *     window.__aiCityCountDebug.dump() (miasta: wlasciciel, q, r, teren, polarny-w-promieniu-1).
 *     --weight nadpisuje w KOPII data/ai-params.json `ekspansja_waga_plonu_heksu` (np. 0.25 / 0.2).
 *  2) (w kopii) node ./node_modules/vite/bin/vite.js build --outDir <poza repo>/dist --emptyOutDir
 *  3) node tools/ai-city-live-measure.cjs --run --pw <katalog z node_modules/playwright> --dist <dist> --out <katalog>
 *        --label pre|post|w025 --typ kontynenty|pangea --seed 4242 [--turns 100] [--size Standardowy]
 *     Odczepiony proces: stan co 10 tur -> <out>/<label>-<typ>-<seed>.json, na koncu wpis "done":true + plik .DONE.
 *     Migawki w turach 1/25/50/75/100: miasta kazdej cywilizacji AI, miasta-panstwa, miasta gracza, miasta zalozone po
 *     starcie wg jakosci terenu (high = laka/rownina), miasta na heksie polarnym lub z sasiadem polarnym (r<=1), czasy tur.
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

function prepare(dir, weight) {
  const root = path.resolve(dir);
  const file = path.join(root, 'src', 'main.ts');
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('__aiCityCountDebug')) { console.log('main.ts juz zapatchowany'); }
  else {
    const rep = (from, to) => {
      const n = s.split(from).length - 1;
      if (n !== 1) throw new Error(`patch: oczekiwano 1 wystapienia, jest ${n}: ${from.slice(0, 60)}`);
      s = s.replace(from, () => to);
    };
    const hookStart = '(window as any).__aiBuildingsTestDebug = {';
    const hookIdx = s.indexOf(hookStart);
    if (hookIdx < 0) throw new Error('brak __aiBuildingsTestDebug');
    const sigFrom = 'startNewGame: (opts: { rivals?: string; cityStates?: number; civTypes?: number; seed?: number }): void => {';
    const sigIdx = s.indexOf(sigFrom, hookIdx);
    const endIdx = s.indexOf('} as NewGameParams);', sigIdx);
    if (sigIdx < 0 || endIdx < 0) throw new Error('brak startNewGame w __aiBuildingsTestDebug');
    let body = s.slice(sigIdx, endIdx);
    const brep = (from, to) => {
      if (body.split(from).length - 1 !== 1) throw new Error('patch body: ' + from);
      body = body.replace(from, () => to);
    };
    brep(sigFrom, 'startNewGame: (opts: { rivals?: string; cityStates?: number; civTypes?: number; seed?: number; mapSize?: string; typSwiata?: string }): void => {\n'
      + "        const _ts = opts.typSwiata ?? 'kontynenty';\n"
      + "        const _lf = _ts === 'pangea' ? 60 : _ts === 'wyspy' ? 50 : 30;\n"
      + "        const _lbl = _ts === 'pangea' ? 'Pangea' : _ts === 'wyspy' ? 'Wyspy' : 'Kontynenty';\n"
      + '        const _ms = opts.mapSize;');
    brep('landFractionPercent: 30,', 'landFractionPercent: _lf,');
    brep("mapSize: 'Maly',", "mapSize: _ms ?? 'Maly',");
    brep("rivals: opts.rivals ?? '6',", "rivals: opts.rivals ?? (_ms ? String(defaultMiastaPanstwaFromMapLabel(_ms)) : '6'),");
    brep("worldType: 'Kontynenty',", 'worldType: _lbl,');
    brep("typSwiata: 'kontynenty',", 'typSwiata: _ts as any,');
    brep('civTypesCount: opts.civTypes ?? 4,', "civTypesCount: opts.civTypes ?? (_ms ? defaultCivTypesFromMapLabel(_ms, 'braz') : 4),");
    brep('cityStatesCount: clampMiastaPanstwaCount(opts.cityStates ?? 2),',
      'cityStatesCount: clampMiastaPanstwaCount(opts.cityStates ?? (_ms ? defaultMiastaPanstwaFromMapLabel(_ms) : 2)),');
    s = s.slice(0, sigIdx) + body + s.slice(endIdx);
    rep(hookStart,
      '(window as any).__aiCityCountDebug = { dump: () => ({ turn, cities: cities.map((c: any) => {\n'
      + "      const hx = (map as any).hexes; let polarNb = false;\n"
      + '      for (let dq = -1; dq <= 1; dq++) for (let dr = -1; dr <= 1; dr++) { const nb = hx[(c.q + dq) + \',\' + (c.r + dr)]; if (nb && (nb.terenBazowy as string) === \'polarny\') polarNb = true; }\n'
      + '      return { id: c.id, ownerId: c.ownerId, q: c.q, r: c.r, me: isMe(c.ownerId), cs: isCityStateOwner(c.ownerId), barb: isBarbarian(c.ownerId),\n'
      + "        terrain: hx[c.q + ',' + c.r]?.terenBazowy ?? null, polarNb };\n"
      + '    }) }) };\n    ' + hookStart);
    fs.writeFileSync(file, s);
    console.log('zapatchowano', file);
  }
  if (weight !== undefined) {
    const pf = path.join(root, 'data', 'ai-params.json');
    const j = JSON.parse(fs.readFileSync(pf, 'utf8'));
    if (!j.ekspansja_waga_plonu_heksu) throw new Error('brak klucza ekspansja_waga_plonu_heksu (to jest PRE?)');
    j.ekspansja_waga_plonu_heksu.wartosc = Number(weight);
    fs.writeFileSync(pf, JSON.stringify(j, null, 2));
    console.log('waga ekspansja_waga_plonu_heksu =', weight);
  }
}

if (process.argv.includes('--prepare')) { prepare(arg('prepare'), arg('weight')); process.exit(0); }
if (!process.argv.includes('--run')) { console.error('usage: see header'); process.exit(2); }

const PW = arg('pw');
const DIST = arg('dist');
const OUTD = arg('out');
const LABEL = arg('label', 'run');
const TYP = arg('typ', 'kontynenty');
const SEED = Number(arg('seed', '4242'));
const TURNS = Number(arg('turns', '100'));
const SIZE = arg('size', 'Standardowy');
const SNAP_AT = new Set([1, 25, 50, 75, 100, TURNS]);
const HIGH = new Set(['laka', 'rownina']);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), LABEL, TYP, ...a);
const OUT = path.join(OUTD, `${LABEL}-${TYP}-${SEED}.json`);

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(fn);
    if (last && last.ready) return last;
    await wait(500);
  }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

function summarize(dump, startIds) {
  const ai = dump.cities.filter((c) => !c.me && !c.barb);
  const major = ai.filter((c) => !c.cs);
  const cs = ai.filter((c) => c.cs);
  const per = {};
  for (const c of major) per[c.ownerId] = (per[c.ownerId] || 0) + 1;
  const counts = Object.values(per).sort((a, b) => a - b);
  const founded = major.filter((c) => !startIds.has(c.id));
  const high = founded.filter((c) => HIGH.has(c.terrain)).length;
  const polar = major.filter((c) => c.terrain === 'polarny' || c.polarNb);
  return {
    turn: dump.turn,
    majorCities: major.length, majorOwners: counts.length, perMajor: per,
    perMajorMin: counts[0] ?? 0, perMajorMax: counts[counts.length - 1] ?? 0,
    perMajorMedian: counts.length ? counts[counts.length >> 1] : 0,
    csCities: cs.length, meCities: dump.cities.filter((c) => c.me).length,
    founded: founded.length, foundedHigh: high, foundedLow: founded.length - high,
    foundedByTerrain: founded.reduce((a, c) => { a[c.terrain] = (a[c.terrain] || 0) + 1; return a; }, {}),
    polarOnOrAdjacent: polar.length, polarOnHex: major.filter((c) => c.terrain === 'polarny').length,
  };
}

const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

async function main() {
  fs.mkdirSync(OUTD, { recursive: true });
  const { chromium } = require(path.join(path.resolve(PW), 'node_modules', 'playwright'));
  const res = { label: LABEL, typ: TYP, seed: SEED, size: SIZE, turns: TURNS, startedAt: new Date().toISOString(), snaps: {}, turnMs: [], done: false };
  const save = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 200)));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    page.on('crash', () => log('PAGE CRASH'));
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
    const tGen = Date.now();
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed: SEED, mapSize: SIZE, typSwiata: TYP });
    await pollUntil(page, () => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      const overlay = Array.from(document.querySelectorAll('*')).some(
        (el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      const st = dbg.dumpState();
      return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
    }, 1500000, 'awaitingFirstPlayerCity');
    res.genMs = Date.now() - tGen;
    log('worldgen ms', res.genMs);
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity() = false');
    await pollUntil(page, () => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
    }, 60000, 'playerCity');
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await wait(500);
    const dump1 = await page.evaluate(() => window.__aiCityCountDebug.dump());
    const startIds = new Set(dump1.cities.map((c) => c.id));
    res.snaps.t1 = summarize(dump1, startIds);
    save();
    let turn = dump1.turn;
    while (turn < TURNS) {
      let r = null; let retries = 0;
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
      res.turnMs.push(Math.round(r.ms));
      if (SNAP_AT.has(turn)) {
        const d = await page.evaluate(() => window.__aiCityCountDebug.dump());
        res.snaps['t' + turn] = summarize(d, startIds);
      }
      if (turn % 10 === 0 || SNAP_AT.has(turn)) {
        res.lastTurn = turn;
        res.errors = errors.slice(0, 5);
        save();
        const sn = res.snaps['t' + turn];
        log(`T${turn} aiMajor=${sn ? sn.majorCities : '-'} lastTurnMs=${r.ms.toFixed(0)}`);
      }
    }
    res.turnStats = { n: res.turnMs.length, median: pct(res.turnMs, 0.5), p95: pct(res.turnMs, 0.95), max: Math.max(...res.turnMs), total: res.turnMs.reduce((a, b) => a + b, 0) };
    res.errors = errors.slice(0, 5);
    res.done = true;
    res.finishedAt = new Date().toISOString();
    save();
    fs.writeFileSync(OUT.replace(/\.json$/, '.DONE'), 'ok\n');
    log('DONE');
  } catch (e) {
    res.error = String(e && e.stack || e).slice(0, 800);
    save();
    fs.writeFileSync(OUT.replace(/\.json$/, '.DONE'), 'ERROR ' + res.error.slice(0, 200) + '\n');
    log('ERROR', res.error.slice(0, 300));
  } finally {
    await browser.close().catch(() => {});
  }
}
main().then(() => process.exit(0));
