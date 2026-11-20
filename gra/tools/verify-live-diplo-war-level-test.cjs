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


// ---- Punkt (1): ustawienie nowej gry „Dyplomacja i wojna” (Łatwa / Normalna / Trudna) ----
// Zrodlo prawdy: gra/data/diplomacy.json (params) + klasyfikacja kluczy w gra/src/game/diplomacy-war-level.ts.
// Oczekiwanie: kary ×1/×2/×3, bonusy ÷1/÷2/÷3; wybor przezywa serializacje zapisu (round-trip).
const LEVELS = [['latwa', 1], ['normalna', 2], ['trudna', 3]];
const BASE_PARAMS = readData('diplomacy.json').params;

const collect = async (page) => page.evaluate((levels) => {
  const { WAR, DATA } = window.__vl;
  const perLevel = {};
  for (const [lvl] of levels) {
    WAR.setDiplomacyWarLevel(lvl); // wybor poziomu drogą kodu ustawienia (ten sam setter, ktory woła main.ts)
    perLevel[lvl] = {
      active: WAR.getDiplomacyWarLevel(),
      penaltyMult: WAR.diplomacyPenaltyMult(),
      bonusDiv: WAR.diplomacyBonusDivisor(),
      params: WAR.scaleDiplomacyParamsForWarLevel(DATA.diplomacy.params),
    };
  }
  // round-trip zapisu: stan poziomu -> obiekt zapisu (JSON) -> normalizacja po wczytaniu
  WAR.setDiplomacyWarLevel('trudna');
  const saved = JSON.parse(JSON.stringify({ meta: { newGameParams: { advanced: { diplomacyWarLevel: WAR.getDiplomacyWarLevel() } } } }));
  WAR.setDiplomacyWarLevel('latwa');
  WAR.setDiplomacyWarLevel(WAR.normalizeDiplomacyWarLevel(saved.meta.newGameParams.advanced.diplomacyWarLevel));
  return {
    perLevel,
    roundTrip: WAR.getDiplomacyWarLevel(),
    staleSaveFallback: WAR.normalizeDiplomacyWarLevel(undefined),
    badValueFallback: WAR.normalizeDiplomacyWarLevel('zla-wartosc'),
    penaltyKeys: WAR.DIPLO_WAR_PENALTY_KEYS,
    bonusKeys: WAR.DIPLO_WAR_BONUS_KEYS,
  };
}, LEVELS);

// Oczekiwanie liczone z gra/data (BASE_PARAMS z pliku w repo, nie z bundla).
function verifyDiplo(out) {
  const penaltyKeys = BASE_PARAMS && out.penaltyKeys.filter(k => typeof BASE_PARAMS[k] === 'number');
  const bonusKeys = out.bonusKeys.filter(k => typeof BASE_PARAMS[k] === 'number');
  assert.ok(penaltyKeys.length >= 10, `co najmniej 10 kar liczbowych w danych (jest ${penaltyKeys.length})`);
  assert.ok(bonusKeys.length >= 10, `co najmniej 10 bonusow liczbowych w danych (jest ${bonusKeys.length})`);
  for (const [lvl, k] of LEVELS) {
    const row = out.perLevel[lvl];
    assert.equal(row.active, lvl, `poziom ${lvl} ustawiony`);
    assert.equal(row.penaltyMult, k, `mnoznik kar ${lvl}`);
    assert.equal(row.bonusDiv, k, `dzielnik bonusow ${lvl}`);
    for (const key of penaltyKeys) near(row.params[key], BASE_PARAMS[key] * k, `kara ${key} ${lvl}`);
    for (const key of bonusKeys) near(row.params[key], BASE_PARAMS[key] / k, `bonus ${key} ${lvl}`);
  }
  // poziomy daja ROZNE realne parametry (nie tylko etykiete)
  const differs = penaltyKeys.filter(key => out.perLevel.latwa.params[key] !== out.perLevel.trudna.params[key]);
  assert.equal(differs.length, penaltyKeys.length, 'kazda kara rozni sie Latwa vs Trudna');
  assert.equal(out.roundTrip, 'trudna', 'wybor Trudna przezywa round-trip zapisu');
  assert.equal(out.staleSaveFallback, 'latwa', 'brak pola w starym zapisie = Latwa');
  assert.equal(out.badValueFallback, 'latwa', 'zla wartosc = Latwa');
}

const firstPenaltyKey = 'zdrada_zaufanie';
main({
  collect,
  verify: verifyDiplo,
  mutants: [{
    tag: 'diplo-zdrada',
    base: 'diplomacy.json',
    mutate: (o) => { o.params[firstPenaltyKey] = o.params[firstPenaltyKey] + 10; return o; },
  }],
}).then(() => liveMain()).catch(e => { console.error('FAIL', e.message); process.exit(1); });

// ---- ŻYWA GRA (R-WEB-VERIFY-LIVE-B2): prawdziwy build gry z ?civTest=1 (esbuild, poza repo); start REALNYM
// doStartGame przez hak window.__settingsLive.startNewGame. Odczyt: diplomacyWarScale = realne scalePenaltyForWarLevel /
// scaleBonusForWarLevel dla AKTYWNEGO poziomu gry (ten sam kod co silnik). Kara ×k, bonus ÷k (k = 1 / 2 / 3).
// NIE ZMIERZONO na żywej grze: efektywne wartości konkretnych kar w turze (hak nie wystawia silnika dyplomacji).
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LIVE_OUT = path.join(WORK, 'live');
const LIVE_PARAMS = (advanced) => ({
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Normalny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: 778899,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
    cityStateDifficultyOverride: 'normal', cityLimitBase: 10, ...advanced,
  },
  villageRewardsEnabled: true,
});
function buildLiveGame() {
  fs.mkdirSync(LIVE_OUT, { recursive: true });
  execFileSync('node', [LIVE_TOOL, LIVE_OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  return path.join(LIVE_OUT, 'Gra-LIVE.html');
}
async function liveStart(browser, html, advanced) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
  await page.evaluate((p) => window.__settingsLive.startNewGame(p), LIVE_PARAMS(advanced));
  await page.waitForTimeout(8000);
  return { context, page, errors };
}
async function liveMain() {
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const html = buildLiveGame();
    const neg = await browser.newContext();
    const negPage = await neg.newPage();
    await negPage.goto('file://' + html, { waitUntil: 'load', timeout: 120000 });
    await negPage.waitForTimeout(4000);
    assert.equal(await negPage.evaluate(() => typeof window.__settingsLive), 'undefined', 'bez ?civTest=1 brak haka __settingsLive');
    await neg.close();
    const out = {};
    for (const [lvl, k] of LEVELS) {
      const s = await liveStart(browser, html, { diplomacyWarLevel: lvl });
      const r = await s.page.evaluate(() => ({
        st: window.__settingsLive.getSettings(),
        kara: window.__settingsLive.diplomacyWarScale(10, 'kara'),
        bonus: window.__settingsLive.diplomacyWarScale(12, 'bonus'),
      }));
      assert.deepEqual(s.errors, [], `brak pageerror (${lvl})`);
      assert.equal(r.st.diplomacyWarLevel, lvl, `start: Dyplomacja i wojna = ${lvl}`);
      near(r.kara, 10 * k, `live kara ×${k} (${lvl})`);
      near(r.bonus, 12 / k, `live bonus ÷${k} (${lvl})`);
      out[lvl] = r;
      await s.context.close();
    }
    console.log('ZYWA GRA ZIELONA (Dyplomacja i wojna x3 przez start, kara/bonus z realnych funkcji)');
    console.log(JSON.stringify(out));
  } finally {
    await browser.close();
  }
}
