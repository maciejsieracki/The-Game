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


// ---- Punkt (5): koszt ulepszenia wg epoki WŁAŚCICIELA (Kamień ×0,5 / Brąz ×1 / Żelazo ×2) ----
// Zrodlo prawdy: gra/data/improvement-cost-params.json (kosztUlepszenWgEpokiWlasciciela),
// gra/data/terrain-improvements.json (koszt_praca, koszt_praca_przed_x2 dla kopalni rudy ×2),
// gra/src/game/terrain-improvements.ts (scaleTerrainImprovementWorkCostForOwner, baseKosztPracaUlepszenia).
// Oczekiwanie: flaga WŁ.: koszt rosnie ×2 z kazda epoka wlasciciela (0,5/1/2); flaga WYŁ.: niezalezny od epoki wlasciciela.
const IMP_P = readData('improvement-cost-params.json');
const TI = readData('terrain-improvements.json');
const TI_ROWS = Array.isArray(TI) ? TI : Object.entries(TI).map(([k, v]) => ({ key: k, ...v }));
const ORE_ROW = TI_ROWS.find(r => r.koszt_praca_przed_x2 !== undefined) || null;

const collect = async (page) => page.evaluate((oreRow) => {
  const { IMP } = window.__vl;
  IMP.setImprovementCostOwnerEraForTest(null); // flaga z danych (nie wymuszana)
  const enabledDefault = IMP.isImprovementCostOwnerEraEnabled();
  const on = [1, 2, 3].map(o => { IMP.setImprovementCostOwnerEraForTest(true); return IMP.scaleTerrainImprovementWorkCostForOwner(10, 1, o); });
  const off = [1, 2, 3].map(o => { IMP.setImprovementCostOwnerEraForTest(false); return IMP.scaleTerrainImprovementWorkCostForOwner(10, 1, o); });
  let ore = null;
  if (oreRow) {
    IMP.setImprovementCostOwnerEraForTest(true);
    const oreOn = IMP.baseKosztPracaUlepszenia(oreRow);
    IMP.setImprovementCostOwnerEraForTest(false);
    const oreOff = IMP.baseKosztPracaUlepszenia(oreRow);
    ore = { oreOn, oreOff };
  }
  IMP.setImprovementCostOwnerEraForTest(null);
  return { enabledDefault, on, off, ore };
}, ORE_ROW);

function verifyImprove(out) {
  const expectEnabled = IMP_P.kosztUlepszenWgEpokiWlasciciela !== false;
  assert.equal(out.enabledDefault, expectEnabled, 'flaga kosztu wg epoki wlasciciela zgodna z danymi');
  const scaled = out.enabledDefault ? out.on : out.off;
  if (expectEnabled) {
    near(out.on[1] / out.on[0], 2, 'WL: Brąz = 2x Kamien (0,5 -> 1)');
    near(out.on[2] / out.on[1], 2, 'WL: Zelazo = 2x Braz (1 -> 2)');
  }
  near(out.off[0], out.off[1], 'WYL: koszt niezalezny od epoki wlasciciela (1 vs 2)');
  near(out.off[1], out.off[2], 'WYL: koszt niezalezny od epoki wlasciciela (2 vs 3)');
  assert.ok(scaled.length === 3, 'trzy wartosci');
  if (ORE_ROW) {
    assert.equal(out.ore.oreOn, ORE_ROW.koszt_praca, `kopalnia (${ORE_ROW.key}) WL: koszt_praca z danych`);
    assert.equal(out.ore.oreOff, ORE_ROW.koszt_praca_przed_x2, `kopalnia (${ORE_ROW.key}) WYL: koszt_praca_przed_x2`);
    assert.equal(ORE_ROW.koszt_praca, ORE_ROW.koszt_praca_przed_x2 * 2, 'kopalnia rudy: koszt x2 w danych');
  } else {
    throw new Error('brak wiersza z koszt_praca_przed_x2 w terrain-improvements.json');
  }
}

main({
  collect,
  verify: verifyImprove,
  mutants: [{
    tag: 'impcost-owner',
    base: 'improvement-cost-params.json',
    mutate: (o) => { o.kosztUlepszenWgEpokiWlasciciela = false; return o; },
  }],
}).catch(e => { console.error('FAIL', e.message); process.exit(1); });
