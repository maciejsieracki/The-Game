'use strict';
// Wspolny szkielet testow verify-live-*: Chromium (Playwright) otwiera harness pomiarowy zbudowany z
// PRAWDZIWYCH modulow gry (gra/src/game/*) i odczytuje wyniki przez window.__vl. Harness NIE zmienia
// kodu gry i NIE dodaje hakow do main.ts (bundle budowany poza repo, do katalogu VERIFY_LIVE_WORK).
// Oczekiwane wartosci liczone sa w Node z plikow gra/data (te same pliki, ktore importuje bundle).
// Mutacja: jeden plik JSON w bundlu jest zmieniany (kopia poza repo) i test MUSI czerwienic.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');

const GRA = path.resolve(__dirname, '..');
// Katalog roboczy POZA repo. Harness (index.html, entry.ts, konfiguracja vite) jest GENEROWANY z tego pliku
// przy kazdym biegu, wiec wynik zalezy wylacznie od commita (bez plikow ze scratchpadu lub innego worktree).
const WORK = process.env.VERIFY_LIVE_WORK || fs.mkdtempSync(path.join(os.tmpdir(), 'verify-live-'));
const HARNESS = path.join(WORK, 'harness');
const CFG = path.join(WORK, 'vite.harness.config.mjs');
const readData = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json' };

// Zrodla harnessu: PRAWDZIWE moduly gry (gra/src) i dane (gra/data), sciezki wzgledem GRA (ten plik), nie worktree.
const SRC = (rel) => path.join(GRA, rel).split(path.sep).join('/');
const INDEX_HTML = '<!doctype html>\n<html lang="pl"><head><meta charset="utf-8"><title>verify-live harness</title></head>\n<body><script type="module" src="./entry.ts"></script></body></html>\n';
const ENTRY_TS = [
  `import * as WAR from '${SRC('src/game/diplomacy-war-level')}';`,
  `import * as ERA from '${SRC('src/game/econ-era-rebalance')}';`,
  `import * as IMP from '${SRC('src/game/terrain-improvements')}';`,
  `import * as PACE from '${SRC('src/game/unit-cost-tempo')}';`,
  `import * as FOOD from '${SRC('src/game/empire-food')}';`,
  `import * as PROD from '${SRC('src/game/production')}';`,
  `import * as UPK from '${SRC('src/game/economy-upkeep')}';`,
  `import DIPLO from '${SRC('data/diplomacy.json')}';`,
  `import UNITS from '${SRC('data/units.json')}';`,
  `import TERRAIN_IMP from '${SRC('data/terrain-improvements.json')}';`,
  `import ECON from '${SRC('data/econ-params.json')}';`,
  `(window as any).__vl = { WAR, ERA, IMP, PACE, FOOD, PROD, UPK, ECON, DATA: { diplomacy: DIPLO, units: UNITS, terrainImp: TERRAIN_IMP }, ready: true };`,
  '',
].join('\n');
const CONFIG_MJS = [
  'const mutBase = process.env.VL_MUT_BASENAME;',
  'const mutFile = process.env.VL_MUT_FILE;',
  'export default {',
  `  root: ${JSON.stringify(HARNESS)},`,
  "  logLevel: 'warn',",
  "  plugins: [{ name: 'vl-mutate-json', enforce: 'pre', resolveId(source) {",
  "    if (mutBase && mutFile && source.endsWith('/' + mutBase)) return mutFile;",
  '    return null; } }],',
  `  build: { outDir: ${JSON.stringify(path.join(WORK, 'dist'))}, emptyOutDir: true, minify: false, sourcemap: false },`,
  '};',
  '',
].join('\n');

function writeHarness() {
  fs.mkdirSync(HARNESS, { recursive: true });
  fs.writeFileSync(path.join(HARNESS, 'index.html'), INDEX_HTML);
  fs.writeFileSync(path.join(HARNESS, 'entry.ts'), ENTRY_TS);
  fs.writeFileSync(CFG, CONFIG_MJS);
}

function buildBundle(mut) {
  writeHarness();
  const tag = mut ? mut.tag : 'base';
  const outDir = path.join(WORK, `dist-${tag}`);
  const env = { ...process.env, VL_MUT_BASENAME: mut ? mut.base : '', VL_MUT_FILE: mut ? mut.file : '' };
  execFileSync('node', ['./node_modules/vite/bin/vite.js', 'build', '--config', CFG, '--outDir', outDir, '--emptyOutDir'],
    { cwd: GRA, env, stdio: 'pipe', timeout: 500000 });
  return outDir;
}

function mutantFile(base, mutateFn, tag) {
  const obj = readData(base);
  const mutated = mutateFn(JSON.parse(JSON.stringify(obj)));
  const dir = path.join(WORK, 'mut');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${tag}-${base}`);
  fs.writeFileSync(file, JSON.stringify(mutated, null, 2));
  return file;
}

async function openHarness(browser, dist) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('http://verify.local/**', route => {
    const u = new URL(route.request().url());
    let rel = decodeURIComponent(u.pathname);
    if (rel === '/') rel = '/index.html';
    const file = path.join(dist, rel);
    if (!file.startsWith(dist) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    return route.fulfill({ path: file, contentType: MIME[path.extname(file)] || 'application/octet-stream' });
  });
  await page.goto('http://verify.local/index.html', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__vl && window.__vl.ready === true, null, { timeout: 60000 });
  return { context, page, errors };
}

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`);

// main(scenario, verify, mutants): bazowy bieg + kazda mutacja musi czerwienic.
async function main({ collect, verify, mutants }) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: resolveChromePath() || '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  });
  try {
    const dist = buildBundle(null);
    const { context, page, errors } = await openHarness(browser, dist);
    const out = await collect(page);
    assert.deepEqual(errors, [], 'brak bledow strony (pageerror)');
    verify(out);
    console.log('BAZA ZIELONA');
    console.log(JSON.stringify(out));
    await context.close();
    for (const m of mutants) {
      const mdist = buildBundle({ tag: m.tag, base: m.base, file: mutantFile(m.base, m.mutate, m.tag) });
      const r = await openHarness(browser, mdist);
      const mout = await collect(r.page);
      let red = false;
      try { verify(mout); } catch (e) { red = true; console.log(`MUTACJA ${m.tag} CZERWONA: ${e.message.split('\n')[0]}`); }
      await r.context.close();
      assert.equal(red, true, `mutacja ${m.tag} MUSI czerwienic test`);
    }
    console.log('WSZYSTKIE ASERCJE ZIELONE');
  } finally {
    await browser.close();
  }
}


// ---- Punkt (4): zamiana nadwyżki Żywności na Podatek (kurs 0,2) ----
// Zrodlo prawdy: gra/src/game/empire-food.ts (convertFoodReserveToTax), kurs 0,2 wg decyzji wlasciciela (FALA 876/883).
// Kurs NIE jest stala w tescie: oczekiwanie liczone z gra/data/econ-params.json (budynki.targowisko_zywnosc_na_podatek_kurs).
// Bundle importuje TEN SAM plik (ECON w harnessie) i wola realna FOOD.resolveFoodTaxRate(ECON.budynki, poziom).
// Mutacja: kopia econ-params.json w bundlu z kursem normal=0.5 -> kurs z bundla != kurs z danych -> test MUSI czerwienic.
// NIE ZMIERZONO: przebieg tury w grze (zamiana z UI/AI); mierzona jest realna funkcja zamiany i realny odczyt kursu.
const RATES_DATA = readData('econ-params.json').budynki.targowisko_zywnosc_na_podatek_kurs;
const LEVELS = ['easy', 'normal', 'hard'];

const collect = async (page) => page.evaluate((levels) => {
  const { FOOD, ECON } = window.__vl;
  const rates = {};
  for (const l of levels) rates[l] = FOOD.resolveFoodTaxRate(ECON.budynki, l);
  const rate = rates.normal;
  const c = (reserve, requested, enabled) => FOOD.convertFoodReserveToTax(reserve, requested, rate, enabled);
  return {
    rates,
    r100_100: c(100, 100, true),
    r100_30: c(100, 30, true),
    r100_33: c(100, 33, true),
    r100_100_off: c(100, 100, false),
    r0_50: c(0, 50, true),
  };
}, LEVELS);

function verifyFood(out) {
  for (const l of LEVELS) {
    assert.equal(out.rates[l], RATES_DATA[l], `kurs ${l} z bundla (resolveFoodTaxRate) = econ-params.json`);
  }
  const rate = RATES_DATA.normal;
  const tax = (spent) => Math.floor(spent * rate + 1e-9);
  assert.deepEqual(out.r100_100, { foodRemaining: 0, foodSpent: 100, taxGained: tax(100) }, 'rezerwa 100, zadanie 100 -> podatek = 100*kurs');
  assert.deepEqual(out.r100_30, { foodRemaining: 70, foodSpent: 30, taxGained: tax(30) }, 'rezerwa 100, zadanie 30 -> podatek = 30*kurs');
  assert.deepEqual(out.r100_33, { foodRemaining: 67, foodSpent: 33, taxGained: tax(33) }, 'zadanie 33 -> podatek floor(33*kurs)');
  assert.deepEqual(out.r100_100_off, { foodRemaining: 100, foodSpent: 0, taxGained: 0 }, 'wylaczone = bez zmian');
  assert.deepEqual(out.r0_50, { foodRemaining: 0, foodSpent: 0, taxGained: 0 }, 'pusta rezerwa = 0');
}

main({
  collect,
  verify: verifyFood,
  mutants: [{
    tag: 'food-rate-normal',
    base: 'econ-params.json',
    mutate: (o) => { o.budynki.targowisko_zywnosc_na_podatek_kurs.normal = 0.5; return o; },
  }],
}).then(() => liveMain()).catch(e => { console.error('FAIL', e.message); process.exit(1); });

// ---- ŻYWA GRA (R-WEB-VERIFY-LIVE-B2): start REALNYM doStartGame (hak __settingsLive). Odczyt: convertFoodToTax =
// realne resolveFoodTaxRate (kurs z gra/data/econ-params.json, poziom trudności gry) + realne convertFoodReserveToTax
// + realna bramka ownerCanConvertWorkToTax (gra/src/game/work-tax.ts: wymaga miasta właściciela z „targowisko").
// W świeżej grze nie ma Targowiska, więc bramka jest ZAMKNIĘTA: oczekiwane enabled=false, zero zamiany.
// NIE ZMIERZONO na żywej grze: zamiana 100 -> 20 (wymagałaby zbudowanego Targowiska; hak nie buduje budynków).
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LIVE_OUT = path.join(WORK, 'live');
const LIVE_PARAMS = () => ({
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Normalny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: 778899,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: 'niski', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
    landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
  },
  villageRewardsEnabled: true,
});
async function liveMain() {
  fs.mkdirSync(LIVE_OUT, { recursive: true });
  execFileSync('node', [LIVE_TOOL, LIVE_OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const html = path.join(LIVE_OUT, 'Gra-LIVE.html');
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), LIVE_PARAMS());
    await page.waitForTimeout(8000);
    const r = await page.evaluate(() => window.__settingsLive.convertFoodToTax(0, 100, 100));
    assert.deepEqual(errors, [], 'brak pageerror');
    assert.equal(r.rate, RATES_DATA.normal, 'kurs zamiany z gra/data (poziom Normalny)');
    assert.equal(r.enabled, false, 'bramka zamiany zamknieta bez Targowiska (work-tax.ts)');
    assert.equal(r.foodSpent, 0, 'bez Targowiska zero zamiany');
    assert.equal(r.taxGained, 0, 'bez Targowiska zero podatku');
    console.log('ZYWA GRA ZIELONA (kurs z danych, bramka zamknieta bez Targowiska)');
    console.log(JSON.stringify(r));
  } finally {
    await browser.close();
  }
}
