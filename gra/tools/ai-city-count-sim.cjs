'use strict';
/**
 * ai-city-count-sim.cjs — R-WEB-AI-CITY-YIELD-FIX-Q1, pomiar PELNEJ GRY (realny bundle w headless Chromium,
 * realne doStartGame + realne "Zakoncz ture"): liczba miast AI w turach 50 i 100 + czas tur, PRZED vs PO.
 *
 * ZAKAZ buildu w gra/ => bundle powstaje w KOPII poza repo (scratch). Dwa tryby:
 *
 *  1) node tools/ai-city-count-sim.cjs --prepare <katalog-kopii-gra>
 *     Dopisuje do <kopia>/src/main.ts (TYLKO kopia, NIE repo) dwa elementy pomiarowe:
 *       - __aiBuildingsTestDebug.startNewGame przyjmuje dodatkowo { mapSize, typSwiata } (domyslne udzialy ladu
 *         per typ swiata: kontynenty 30 / pangea 60 / wyspy 50 — jak defaultLandFractionForTyp; domyslne
 *         liczby rywali/typow/miast-panstw z *FromMapLabel dla danego rozmiaru),
 *       - window.__aiCityCountDebug.dump() — surowy odczyt miast (owner, q, r, teren).
 *     Potem: (w kopii) node node_modules/vite/bin/vite.js build  -> dist/index.html
 *
 *  2) node tools/ai-city-count-sim.cjs --dist <kopia>/dist --out <plik.json> [--seeds 1,2,3,4,5]
 *        [--types kontynenty,pangea,wyspy] [--turns 100] [--size Standardowy] [--label pre]
 *     Dla kazdego (typ, ziarno): nowa przegladarka, ziarnowany Math.random, start gry, zalozenie miasta gracza,
 *     N tur "Zakoncz ture". Zapis JSON: per bieg miasta AI (major, miasta-panstwa) w t1/t50/t100, miasta
 *     zalozone po starcie wg jakosci terenu (high = Laka/Rownina), czasy tur (ms).
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

// ---------------------------------------------------------------------------
// Tryb --prepare
// ---------------------------------------------------------------------------
function prepare(dir) {
  const file = path.join(path.resolve(dir), 'src', 'main.ts');
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('__aiCityCountDebug')) { console.log('main.ts juz zapatchowany'); return; }
  const rep = (from, to) => {
    const n = s.split(from).length - 1;
    if (n !== 1) throw new Error(`patch: oczekiwano 1 wystapienia, jest ${n}: ${from.slice(0, 60)}`);
    s = s.replace(from, () => to);
  };
  const hookStart = "(window as any).__aiBuildingsTestDebug = {";
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
    "(window as any).__aiCityCountDebug = { dump: () => ({ turn, cities: cities.map((c: any) => ({ id: c.id, ownerId: c.ownerId, q: c.q, r: c.r, "
    + 'me: isMe(c.ownerId), cs: isCityStateOwner(c.ownerId), barb: isBarbarian(c.ownerId), '
    + "terrain: (map as any).hexes[c.q + ',' + c.r]?.terenBazowy ?? null })) }) };\n    " + hookStart);
  fs.writeFileSync(file, s);
  console.log('zapatchowano', file);
}

if (process.argv.includes('--prepare')) { prepare(arg('prepare')); process.exit(0); }

// ---------------------------------------------------------------------------
// Tryb --engine: SYMULACJA SILNIKOWA (bez przegladarki) — realny generator mapy 168x120, realny plan startu
// klastrow, realne planCityFounding (jedyny konsument hexCityScore) + canFoundCity w petli tur 1..N, z PROSTA
// atrapa ekonomii (Praca/populacja). Powod: pelna gra w przegladarce = ~200 s generacji + ~30 s/ture (42 wlascicieli,
// swiftshader) => ~50 min na bieg, 30 biegow > 24 h (NIE_ZMIERZONO w pelnej grze; patrz raport).
// node tools/ai-city-count-sim.cjs --engine --root <kopia-gra z node_modules> --out <plik.json> --label pre|post
//      [--seeds 1,2,3,4,5] [--types kontynenty,pangea,wyspy] [--turns 100] [--w 168 --h 120]
//      [--scale <wartosc>]  (parametr ekspansja_waga_plonu_heksu — ustawiany w danych w pamieci, jesli klucz istnieje)
// ---------------------------------------------------------------------------
async function engineMode() {
  const os = require('os');
  const ROOT = path.resolve(arg('root', path.resolve(__dirname, '..')));
  const OUTF = arg('out');
  const LBL = arg('label', 'run');
  const SEEDS_E = arg('seeds', '1,2,3,4,5').split(',').map(Number);
  const TYPES_E = arg('types', 'kontynenty,pangea,wyspy').split(',');
  const TURNS_E = Number(arg('turns', '100'));
  const W = Number(arg('w', '168'));
  const H = Number(arg('h', '120'));
  const SCALE = arg('scale', null);
  const PRACA_RATE = Number(arg('praca-rate', '2')); // Praca/miasto/ture (atrapa)
  const GROW_EVERY = Number(arg('grow-every', '3')); // +1 pop co N tur (atrapa), limit 6
  const NOBOOST = process.argv.includes('--noboost'); // bez powerRank/clusterCenter (tylko hexCityScore + minScore)
  const esbuild = require(path.join(ROOT, 'node_modules', 'esbuild'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-city-count-'));
  const entry = path.join(tmp, 'entry.ts');
  const bundle = path.join(tmp, 'bundle.cjs');
  const src = (f) => JSON.stringify(path.join(ROOT, 'src', f));
  fs.writeFileSync(entry, `
export { planCityFounding } from ${src('game/ai.ts')};
export { canFoundCity, MIN_CITY_DISTANCE } from ${src('game/cities.ts')};
export { buildClusterStartPlan } from ${src('game/cluster-start.ts')};
export { isInTerritory } from ${src('map/territory.ts')};
export { loadGameData } from ${src('data/loader.ts')};
export { generateMap } from ${src('map/generator.ts')};
export { setRiverGenPhaseOverride, setRiverGenEnabledOverride } from ${src('map/riverGenSwitch.ts')};
export { foundCityWorkCost, foundCityPopulationCost } from ${src('game/city-founding.ts')};
export { clusterCityStateRadius } from ${src('map/clusters.ts')};
export { defaultCivTypesFromMapLabel, defaultMiastaPanstwaFromMapLabel } from ${src('map/newGameMapDefaults.ts')};
`, 'utf8');
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: ROOT, logLevel: 'silent' });
  const M = require(bundle);
  M.setRiverGenPhaseOverride('main');
  const data = M.loadGameData();
  if (SCALE !== null) {
    data.aiParams = data.aiParams || {};
    const cur = data.aiParams.ekspansja_waga_plonu_heksu || {};
    data.aiParams.ekspansja_waga_plonu_heksu = { ...cur, wartosc: Number(SCALE) };
  }
  const workCost = M.foundCityWorkCost();
  const popCost = M.foundCityPopulationCost();
  const HIGH_E = new Set(['laka', 'rownina']);
  const results = [];
  const mulberry = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (const typ of TYPES_E) for (const seed of SEEDS_E) {
    const t0 = Date.now();
    const realRandom = Math.random;
    Math.random = mulberry(seed * 7919 + 13); // ten sam strumien losowosci PRE/POST (losowania remisow zrodla miasta)
    // Cache map (generator = ~110 s/mapa, identyczny PRE/POST): --mapcache <katalog>
    const MC = arg('mapcache', null);
    const mcFile = MC ? path.join(MC, `map-${typ}-${seed}-${W}x${H}.json`) : null;
    let map;
    if (mcFile && fs.existsSync(mcFile)) map = JSON.parse(fs.readFileSync(mcFile, 'utf8'));
    else {
      map = M.generateMap(W, H, seed, typ);
      if (mcFile) { fs.mkdirSync(MC, { recursive: true }); fs.writeFileSync(mcFile, JSON.stringify(map)); }
    }
    const plan = M.buildClusterStartPlan({ map, civs: data.civs, seed, playerCivId: 'grecy',
      rywaleNaKlaster: M.defaultMiastaPanstwaFromMapLabel('Standardowy'),
      aktywneTypy: M.defaultCivTypesFromMapLabel('Standardowy', 'braz'), startEpochId: 'braz', cityNamesPools: data.cityNamesPools });
    let idx = 0;
    const cities = [];
    const mk = (q, r, ownerId, pop) => ({ id: 'c' + (idx++), ownerId, q, r, population: pop, startCity: true });
    cities.push(mk(plan.playerStartHex.q, plan.playerStartHex.r, 0, 3));
    for (const sc of plan.spawnCities) cities.push(mk(sc.q, sc.r, sc.ownerId, 3));
    const copyOwners = plan.typCityCopyOwners;
    const majors = [...new Set(plan.aiStartHexes.map((h) => h.ownerId))].filter((o) => o !== 0 && !copyOwners.has(o));
    const praca = new Map(majors.map((o) => [o, 0]));
    const prof = (o) => [1, 2, 2, 3, 4][o % 5];
    if (process.env.SIM_VERBOSE) {
      console.log('plan.placement?', !!plan.placement, 'klastry typ:', plan.placement && plan.placement.klastry.map((k) => k.typ).join(','),
        '| aiOwnerCivMap:', majors.map((o) => o + '=' + plan.aiOwnerCivMap.get(o)).join(','));
    }
    const snaps = {};
    let planMs = 0, planCalls = 0;
    const foundedLog = [];
    for (let turn = 1; turn <= TURNS_E; turn++) {
      const era = 1 + Math.floor(turn / 40); // 1..3
      for (const c of cities) if (c.ownerId !== 0 && turn % GROW_EVERY === 0 && c.population < 6) c.population += 1; // wzrost
      for (const o of majors) {
        const mine = cities.filter((c) => c.ownerId === o);
        if (mine.length === 0) continue;
        praca.set(o, praca.get(o) + PRACA_RATE * mine.length);
        const opts = { currentTurn: turn, civEra: era, civAiProfile: { ekspansywnosc: prof(o), sklonnoscDoPodboju: 2 },
          pracaAvailable: praca.get(o), poziomTrudnosci: 2 };
        if (!NOBOOST) {
          // Odtworzenie z main.ts (~36957, ~37195): powerRank (ranga wg liczby miast) + clusterCenter/Radius klastra typu.
          opts.powerRank = 1 + majors.filter((x) => cities.filter((c) => c.ownerId === x).length > mine.length).length;
          const tc = plan.placement && plan.placement.klastry.find((k) => k.typ === plan.aiOwnerCivMap.get(o));
          if (tc) { opts.clusterCenter = tc.centrum; opts.clusterRadius = M.clusterCityStateRadius(); }
        }
        const tp = Date.now();
        const cmd = M.planCityFounding(o, cities, map, data, opts, M.MIN_CITY_DISTANCE, [], [], []);
        planMs += Date.now() - tp; planCalls++;
        if (cmd === null || cmd.type !== 'foundCityAt') continue;
        const nodes = mine.map((c) => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
        const res = M.canFoundCity(cmd.q, cmd.r, cities, map, {
          withinTerritory: (fq, fr) => M.isInTerritory(fq, fr, nodes), ownerId: o, ownerEra: era, gameConfig: { cityLimitBase: 10 } });
        if (!res.ok) continue;
        const src0 = mine.filter((c) => c.population >= Math.max(popCost + 1, 3)).sort((a, b) => b.population - a.population)[0];
        if (!src0 || praca.get(o) < workCost) continue;
        src0.population -= popCost;
        praca.set(o, praca.get(o) - workCost);
        const hx = map.hexes[cmd.q + ',' + cmd.r];
        cities.push({ id: 'c' + (idx++), ownerId: o, q: cmd.q, r: cmd.r, population: 1 });
        foundedLog.push({ turn, o, terrain: hx.terenBazowy, river: !!(hx.rzeka && hx.rzeka.obecna) });
      }
      if (turn === 50 || turn === 100 || turn === TURNS_E) {
        const per = {};
        for (const o of majors) per[o] = cities.filter((c) => c.ownerId === o).length;
        const vals = Object.values(per).sort((a, b) => a - b);
        const f = foundedLog.filter((x) => x.turn <= turn);
        const hi = f.filter((x) => HIGH_E.has(x.terrain)).length;
        const byT = {};
        for (const x of f) byT[x.terrain] = (byT[x.terrain] || 0) + 1;
        snaps['t' + turn] = { majorCities: vals.reduce((a, b) => a + b, 0), medianPerCiv: vals[vals.length >> 1], perMajor: per,
          founded: f.length, foundedHigh: hi, foundedLow: f.length - hi, foundedByTerrain: byT };
      }
    }
    Math.random = realRandom;
    const r = { typ, seed, majors: majors.length, start: cities.filter((c) => c.startCity && majors.includes(c.ownerId)).length, snaps,
      planMs, planCalls, wallMs: Date.now() - t0 };
    results.push(r);
    console.log(`[${LBL}] ${typ} ${seed} majors=${r.majors} t50=${snaps.t50 && snaps.t50.majorCities} t100=${snaps.t100 && snaps.t100.majorCities} `
      + `foundedHigh/Low@100=${snaps.t100 && snaps.t100.foundedHigh}/${snaps.t100 && snaps.t100.foundedLow} planMs=${planMs} wall=${r.wallMs}ms`);
    if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(results, null, 1));
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}
if (process.argv.includes('--engine')) { engineMode().catch((e) => { console.error(e); process.exit(1); }); return; }

// ---------------------------------------------------------------------------
// Tryb pomiaru
// ---------------------------------------------------------------------------
const DIST = arg('dist');
const OUT = arg('out');
if (!DIST || !OUT) { console.error('Uzycie: --dist <katalog> --out <plik.json> | --prepare <kopia-gra>'); process.exit(2); }
const SEEDS = arg('seeds', '1,2,3,4,5').split(',').map(Number);
const TYPES = arg('types', 'kontynenty,pangea,wyspy').split(',');
const TURNS = Number(arg('turns', '100'));
const SIZE = arg('size', 'Standardowy');
const LABEL = arg('label', 'run');
const HIGH = new Set(['laka', 'rownina']); // hexCityScore >= 3 przy poprawnym dopasowaniu (Laka 4, Rownina 3)
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
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
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

function summarize(dump, startIds) {
  const ai = dump.cities.filter((c) => !c.me && !c.barb);
  const major = ai.filter((c) => !c.cs);
  const cs = ai.filter((c) => c.cs);
  const per = {};
  for (const c of major) per[c.ownerId] = (per[c.ownerId] || 0) + 1;
  const founded = major.filter((c) => !startIds.has(c.id));
  const high = founded.filter((c) => HIGH.has(c.terrain)).length;
  return {
    turn: dump.turn, majorCities: major.length, csCities: cs.length, perMajor: per,
    majorOwners: Object.keys(per).length,
    founded: founded.length, foundedHigh: high, foundedLow: founded.length - high,
    foundedByTerrain: founded.reduce((a, c) => { a[c.terrain] = (a[c.terrain] || 0) + 1; return a; }, {}),
  };
}

async function runOne(typ, seed) {
  const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 200)));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    page.on('crash', () => log('PAGE CRASH'));
    page.on('close', () => log('PAGE CLOSE'));
    if (process.env.SIM_VERBOSE) page.on('console', (m) => log('console', m.type(), m.text().slice(0, 200)));
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ seed) | 0);
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html'), { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__rebelProtectionTestDebug && !!window.__aiCityCountDebug,
    undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    const tGen = Date.now();
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed, mapSize: SIZE, typSwiata: typ });
    await pollUntil(page, () => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      const overlay = Array.from(document.querySelectorAll('*')).some(
        (el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      const st = dbg.dumpState();
      return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
    }, 900000, 'awaitingFirstPlayerCity');
    const genMs = Date.now() - tGen;
    log('worldgen ms', genMs);
    const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
    if (!founded) throw new Error('foundPlayerStartCity() = false');
    await pollUntil(page, () => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
    }, 60000, 'playerCity');
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await wait(500);
    const dump1 = await page.evaluate(() => window.__aiCityCountDebug.dump());
    const startIds = new Set(dump1.cities.map((c) => c.id));
    const snaps = { t1: summarize(dump1, startIds) };
    const turnMs = [];
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
            if (!ip && (saw || performance.now() - t0 > 2000)) {
              resolve({ ms: performance.now() - t0, turn0, turn1: dbg.getWorldState().turn });
              return;
            }
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
      turnMs.push(r.ms);
      if (turn === 50 || turn === 100 || turn === TURNS) {
        const d = await page.evaluate(() => window.__aiCityCountDebug.dump());
        snaps['t' + turn] = summarize(d, startIds);
      }
      if (turn % 10 === 0) log(`${typ} ${seed} T${turn} aiMajor=${(snaps['t' + turn] || {}).majorCities ?? '-'} lastTurnMs=${r.ms.toFixed(0)}`);
    }
    const sorted = [...turnMs].sort((a, b) => a - b);
    return {
      typ, seed, genMs, snaps, errors: errors.slice(0, 5),
      turnMs: { n: turnMs.length, total: turnMs.reduce((a, b) => a + b, 0), median: sorted[sorted.length >> 1], max: sorted[sorted.length - 1] },
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

(async () => {
  const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  for (const typ of TYPES) {
    for (const seed of SEEDS) {
      if (results.some((x) => x.typ === typ && x.seed === seed)) { log('pomijam (juz jest)', typ, seed); continue; }
      const t0 = Date.now();
      try {
        const res = await runOne(typ, seed);
        results.push(res);
        log(`DONE ${typ} ${seed} t50=${res.snaps.t50 && res.snaps.t50.majorCities} t100=${res.snaps.t100 && res.snaps.t100.majorCities} wall=${Math.round((Date.now() - t0) / 1000)}s`);
      } catch (e) {
        results.push({ typ, seed, error: String(e).slice(0, 400) });
        log('ERROR', typ, seed, String(e).slice(0, 300));
      }
      fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
    }
  }
})();
