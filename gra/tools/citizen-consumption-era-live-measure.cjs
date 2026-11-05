'use strict';
/**
 * citizen-consumption-era-live-measure.cjs -- POMIAR NA ZYWEJ GRZE (nie bramka),
 * R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1. Wzor: clearing-deficit-live-measure.cjs.
 *
 * Zero zmian w repo: kopiuje zrodla (z biezacego drzewa `gra/` albo z `origin/main` przez `git archive`)
 * do katalogu SCRATCH poza repo, wstawia do KOPII `main.ts` hak ODCZYTU `window.__ccMeas`
 * (przechwyt ticka ekonomii i werdyktu drenazu obywateli + fixture stanu), buduje vite do scratch
 * i steruje REALNA gra w headless Chromium (REALNY endTurn).
 *
 *   node tools/citizen-consumption-era-live-measure.cjs build <scratchDir> <work|main>
 *   node tools/citizen-consumption-era-live-measure.cjs eras  <scratchDir> <evidenceDir> <seed>
 *       -> epoka 1/2/3 (gracz + wszystkie AI), ta sama populacja i poziom Wyzywienia gracza:
 *          koszt racji/ture i drenaz kazdego surowca z REALNEGO endTurn
 *   node tools/citizen-consumption-era-live-measure.cjs sim   <scratchDir> <evidenceDir> <seed> <turns>
 *       -> pasywny gracz + AI, <turns> tur: miasta AI w deficycie zywnosci, populacja AI, brakujace surowce AI
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MARKER = '(window as any).__cityForestTestDebug = {';
const TICK_ANCHOR = 'refreshPlayerCityEcon(econ.perCity, humanOwnerId);';
const POP_ANCHOR = 'const econ = advanceCityEconomy(';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function startGameSource() {
  const t = fs.readFileSync(path.join(__dirname, 'clearing-deficit-live-measure.cjs'), 'utf8');
  const a = t.indexOf('        startGame: (seed');
  const b = t.indexOf('        world: () => ({');
  if (a < 0 || b < 0) throw new Error('nie znaleziono startGame w clearing-deficit-live-measure.cjs');
  return t.slice(a, b);
}

function hookSource() {
  return String.raw`
    (window as any).__ccMeas = (() => {
      const mine = () => cities.filter(c => c.ownerId === 0);
      return {
` + startGameSource() + String.raw`
        world: () => ({ turn, awaiting: isAwaitingFirstPlayerCity(), startHex: playerStartHex ? { q: playerStartHex.q, r: playerStartHex.r } : null }),
        found: (q: number, r: number): boolean => tryFoundPlayerCityAt(q, r),
        busy: () => endTurnInProgress,
        /** Ustawia epoke gracza i WSZYSTKICH AI/panstw-miast (ta sama funkcja liczy dla wszystkich). */
        setEraAll: (era: number) => {
          (window as any).__ccForceEra = era;
          player.era = era;
          const ps: any = playerStateByHuman.get(0); if (ps) ps.era = era;
          for (const k of Array.from(ownerEraByOwner.keys())) ownerEraByOwner.set(k, era);
          return { me: empireEpochForOwner(0), ai: Array.from(ownerEraByOwner.entries()) };
        },
        /** Fixture gracza: ta sama populacja, ten sam poziom Wyzywienia, duzy magazyn (brak niedoboru). */
        fixture: (pop: number, level: number, stockEach: number) => {
          for (const c of mine()) { c.population = pop; (c as any).poziomRacji = level; (c as any).autoWyzywienie = false; }
          const keys = ['drewno', 'glina', 'kamien', 'ceramika', 'cegla'];
          const out: Record<string, number> = {};
          for (const k of keys) out[k] = creditOwnerResourceStock(cities, 0, k, stockEach, 1_000_000);
          const st = empireFoodStates.get(0) ?? freshEmpireFoodState(); st.zapasyPanstwa = 1_000_000; empireFoodStates.set(0, st); _maxSafeRationCache.clear();
          markCityStateDirty();
          return { cities: mine().length, stock: ownerResourceStockAll(cities, 0) };
        },
        stock: (owner: number) => ({ ...ownerResourceStockAll(cities, owner) }),
        /** Wynik OSTATNIEGO realnego endTurn: tiki ekonomii (przed korekta pop), werdykt drenazu per owner. */
        last: () => {
          const upkeep: Record<string, any> = {};
          for (const [ownerId, v] of citizenUpkeepByOwner.entries()) {
            upkeep[String(ownerId)] = { rate: v.ratePerCitizen, required: [...v.required], deductions: { ...v.deductions }, missing: [...v.missing] };
          }
          return {
            turn, econTurn: (window as any).__ccEconTurn,
            econ: (window as any).__ccEcon, popBefore: (window as any).__ccPopBefore,
            upkeep,
            eras: Array.from(ownerEraByOwner.entries()), meEra: empireEpochForOwner(0),
            cityOwners: cities.map(c => ({ id: c.id, ownerId: c.ownerId, pop: c.population })),
          };
        },
      };
    })();
`;
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d); else fs.copyFileSync(s, d);
  }
}

function build(scratch, mode) {
  const g = path.join(scratch, 'gra');
  fs.rmSync(scratch, { recursive: true, force: true });
  fs.mkdirSync(g, { recursive: true });
  if (mode === 'main') {
    execSync(`git archive origin/main gra/src gra/data gra/index.html gra/tsconfig.json gra/vite.config.ts gra/package.json | tar -x -C ${JSON.stringify(scratch)}`, { cwd: path.resolve(GRA_DIR, '..'), stdio: 'pipe', shell: '/bin/bash' });
  } else {
    copyTree(path.join(GRA_DIR, 'src'), path.join(g, 'src'));
    copyTree(path.join(GRA_DIR, 'data'), path.join(g, 'data'));
    for (const f of ['index.html', 'tsconfig.json', 'vite.config.ts', 'package.json']) fs.copyFileSync(path.join(GRA_DIR, f), path.join(g, f));
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(g, 'node_modules'), 'dir');
  const mainPath = path.join(g, 'src', 'main.ts');
  let txt = fs.readFileSync(mainPath, 'utf8');
  const ERA_ANCHOR = '      player.era = next;';
  for (const a of [MARKER, TICK_ANCHOR, POP_ANCHOR, ERA_ANCHOR]) if (txt.split(a).length !== 2) throw new Error('kotwica nie jest unikalna: ' + a);
  // przechwyt populacji PRZED tickiem ekonomii i wynikow ticka (tylko odczyt)
  txt = txt.replace(POP_ANCHOR, '(window as any).__ccPopBefore = Object.fromEntries(cities.map(c => [c.id, c.population]));\n          ' + POP_ANCHOR);
  txt = txt.replace(TICK_ANCHOR, '(window as any).__ccEcon = econ.perCity.map(t => ({ cityId: t.cityId, ownerId: t.ownerId, ownerEra: t.ownerEra, kosztRacji: t.kosztRacji, poziomRacji: t.poziomRacji, zywnoscBrutto: t.zywnoscBrutto, bilansLokalny: t.bilansLokalny })); (window as any).__ccEconTurn = turn;\n          ' + TICK_ANCHOR);
  // epoka gracza jest przeliczana z badan co ture (reconcilePlayerEraFromResearch) -- pomiar trzyma epoke wymuszona
  txt = txt.replace(ERA_ANCHOR, '      player.era = (window as any).__ccForceEra ?? next;');
  const idx = txt.indexOf(MARKER);
  const lineStart = txt.lastIndexOf('\n', idx) + 1;
  txt = txt.slice(0, lineStart) + hookSource() + txt.slice(lineStart);
  fs.writeFileSync(mainPath, txt, 'utf8');
  const out = path.join(scratch, 'dist');
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(out)} --emptyOutDir`, { cwd: g, stdio: 'pipe', maxBuffer: 1 << 28 });
  console.log('BUILD_OK ' + path.join(out, 'index.html'));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(chromium) {
  try { return await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] }); }
  catch (e) { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); }
}

async function openGame(scratch, seed) {
  const { chromium } = require('playwright');
  const browser = await launch(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.join(scratch, 'dist', 'index.html'), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__ccMeas && !!window.__eraTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await page.evaluate((s) => window.__ccMeas.startGame(s, 'kontynenty', 3, 4), seed);
  const t0 = Date.now();
  while (Date.now() - t0 < 300000) {
    const w = await page.evaluate(() => window.__ccMeas.world());
    const overlay = await page.evaluate(() => Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null));
    if (!overlay && w.awaiting && w.startHex) break;
    await wait(500);
  }
  const ok = await page.evaluate(() => window.__ccMeas.found(window.__ccMeas.world().startHex.q, window.__ccMeas.world().startHex.r));
  if (!ok) throw new Error('found false');
  await wait(800);
  return { browser, page, errors };
}

async function endTurn(page) {
  const t0 = await page.evaluate(() => window.__ccMeas.world().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const s = Date.now();
  while (Date.now() - s < 120000) {
    const busy = await page.evaluate(() => window.__ccMeas.busy());
    const t = await page.evaluate(() => window.__ccMeas.world().turn);
    if (!busy && t > t0) return t;
    await wait(100);
  }
  throw new Error('endTurn timeout from turn ' + t0);
}

async function modeEras(scratch, evidence, seed) {
  fs.mkdirSync(evidence, { recursive: true });
  const { browser, page, errors } = await openGame(scratch, seed);
  const rows = [];
  const POP = 5, LEVEL = 4;
  try {
    for (const era of [1, 2, 3]) {
      const setE = await page.evaluate((e) => window.__ccMeas.setEraAll(e), era);
      const fx = await page.evaluate(([p, l]) => window.__ccMeas.fixture(p, l, 5000), [POP, LEVEL]);
      const stockBefore = await page.evaluate(() => window.__ccMeas.stock(0));
      await endTurn(page);
      const last = await page.evaluate(() => window.__ccMeas.last());
      const stockAfter = await page.evaluate(() => window.__ccMeas.stock(0));
      const myCityIds = last.cityOwners.filter(c => c.ownerId === 0).map(c => c.id);
      const player = last.econ.filter(t => t.ownerId === 0).map(t => {
        const pop = last.popBefore[t.cityId];
        return { cityId: t.cityId, ownerEra: t.ownerEra, pop, poziomTick: t.poziomRacji, kosztRacji: t.kosztRacji,
          perPopLevel: pop && t.poziomRacji ? t.kosztRacji / (pop * t.poziomRacji * 2) : null };
      });
      const ai = last.econ.filter(t => t.ownerId !== 0 && t.ownerId < 90).map(t => {
        const pop = last.popBefore[t.cityId];
        return { ownerId: t.ownerId, cityId: t.cityId, ownerEra: t.ownerEra, pop, poziom: t.poziomRacji, kosztRacji: t.kosztRacji,
          mult: pop && t.poziomRacji ? t.kosztRacji / (pop * t.poziomRacji * 2) : null };
      });
      const up0 = last.upkeep['0'];
      const popPlayer = player.reduce((s, p) => s + p.pop, 0);
      rows.push({ era, setE, fixture: fx.cities, popPlayerEmpire: popPlayer, levelRequested: LEVEL, player,
        upkeepPlayer: up0, drainObserved: Object.fromEntries(Object.keys(stockBefore).map(k => [k, (stockBefore[k] || 0) - (stockAfter[k] || 0)]).filter(([, v]) => v !== 0)),
        aiSample: ai.slice(0, 12), aiMultSet: Array.from(new Set(ai.map(a => a.mult == null ? null : Math.round(a.mult * 1000) / 1000))), aiUpkeepRates: Object.fromEntries(Object.entries(last.upkeep).filter(([k]) => k !== '0').map(([k, v]) => [k, v.rate])), myCityIds });
    }
  } finally { await browser.close(); }
  const file = path.join(evidence, `eras-seed${seed}.json`);
  fs.writeFileSync(file, JSON.stringify({ seed, rows, errors }, null, 1));
  console.log('RESULT_FILE=' + file);
}

async function modeSim(scratch, evidence, seed, turns) {
  fs.mkdirSync(evidence, { recursive: true });
  const { browser, page, errors } = await openGame(scratch, seed);
  const per = [];
  try {
    for (let i = 0; i < turns; i++) {
      await endTurn(page);
      const last = await page.evaluate(() => window.__ccMeas.last());
      const ai = last.econ.filter(t => t.ownerId !== 0 && t.ownerId < 90);
      const aiCities = last.cityOwners.filter(c => c.ownerId !== 0 && c.ownerId < 90);
      const missing = Object.entries(last.upkeep).filter(([k]) => k !== '0').reduce((s, [, v]) => s + v.missing.length, 0);
      per.push({ turn: last.turn, aiTicks: ai.length, aiCities: aiCities.length, aiPop: aiCities.reduce((s, c) => s + c.pop, 0),
        aiFoodDeficit: ai.filter(t => (t.bilansLokalny ?? 0) < 0).length, aiMissingResources: missing,
        aiErasMax: Math.max(...last.eras.map(e => e[1])), meEra: last.meEra });
    }
  } finally { await browser.close(); }
  const sum = (f) => per.reduce((s, r) => s + f(r), 0);
  const result = { seed, turns, summary: {
    aiCityTurnsInFoodDeficit: sum(r => r.aiFoodDeficit), aiCityTurns: sum(r => r.aiTicks),
    aiMissingResourceTurns: sum(r => r.aiMissingResources), aiPopFinal: per[per.length - 1].aiPop, aiCitiesFinal: per[per.length - 1].aiCities,
    aiPopMax: Math.max(...per.map(r => r.aiPop)), aiErasMaxFinal: per[per.length - 1].aiErasMax,
  }, per, errors: errors.slice(0, 5) };
  const file = path.join(evidence, `sim-seed${seed}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 1));
  console.log('RESULT_FILE=' + file);
  console.log(JSON.stringify(result.summary));
}

(async () => {
  const [cmd, scratch, a3, a4, a5] = process.argv.slice(2);
  if (cmd === 'build') build(scratch, a3 || 'work');
  else if (cmd === 'eras') await modeEras(scratch, a3, Number(a4 || 7));
  else if (cmd === 'sim') await modeSim(scratch, a3, Number(a4 || 7), Number(a5 || 100));
  else { console.error('uzycie: build|eras|sim'); process.exit(2); }
})().catch((e) => { console.error(e); process.exit(1); });
