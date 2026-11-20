'use strict';
// Wspolny szkielet testow verify-live-*: Chromium (Playwright) otwiera harness pomiarowy zbudowany z
// PRAWDZIWYCH modulow gry (gra/src/game/*) i odczytuje wyniki przez window.__vl. Harness NIE zmienia
// kodu gry i NIE dodaje hakow do main.ts (bundle budowany poza repo, do katalogu VERIFY_LIVE_WORK).
// Oczekiwane wartosci liczone sa w Node z plikow gra/data (te same pliki, ktore importuje bundle).
// Mutacja: jeden plik JSON w bundlu jest zmieniany (kopia poza repo) i test MUSI czerwienic.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');

const GRA = path.resolve(__dirname, '..');
const WORK = process.env.VERIFY_LIVE_WORK
  || '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/verify-live';
const CFG = path.join(WORK, 'vite.harness.config.mjs');
const readData = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json' };

function buildBundle(mut) {
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


// ---- Punkt (2): „Wzrost surowców z epoką” WŁ./WYŁ. (plon ulepszeń i produkcja surowców) ----
// Zrodlo prawdy: gra/data/econ-era-rebalance-params.json + gra/src/game/econ-era-rebalance.ts,
// gra/src/game/terrain-improvements.ts (improvementYieldForEra, resourceProductionAmountForEra).
// Oczekiwanie: WYŁ. (domyślnie) = plon stały jak w Kamieniu (2,2,2); WŁ. = wzrost base+(epoka-1) i produkcja rosnąca.
const ERA_P = readData('econ-era-rebalance-params.json');
const RES_KEY = 'kopalnia_miedzi';

const collect = async (page) => page.evaluate((resKey) => {
  const { ERA, IMP } = window.__vl;
  ERA.setEraRebalanceEnabledForTest(null); // flaga rebalansu z danych (nie wymuszana)
  const rows = { enabled: ERA.isEraRebalanceEnabled() };
  for (const [name, wz] of [['WYL', false], ['WL', true]]) {
    ERA.setWzrostSurowcowZEpoka(wz); // przelacznik ustawienia nowej gry (ten sam setter co w applyMenuParams)
    rows[name] = {
      flat: ERA.isEraRebalanceImprovementFlat(),
      yieldPlon: [1, 2, 3].map(e => IMP.improvementYieldForEra('farma', 'zywnosc', 2, e)),
      yieldPraca: [1, 2, 3].map(e => IMP.improvementYieldForEra('farma', 'praca', 2, e)),
      produkcja: [1, 2, 3].map(e => IMP.resourceProductionAmountForEra(resKey, 20, e)),
    };
  }
  ERA.setWzrostSurowcowZEpoka(undefined);
  rows.defaultWzrost = ERA.getWzrostSurowcowZEpoka();
  return rows;
}, RES_KEY);

function verifyGrowth(out) {
  assert.equal(out.enabled, ERA_P.eraRebalansAktywny === true, 'flaga rebalansu zgodna z danymi');
  assert.equal(out.defaultWzrost, false, 'domyslnie Wzrost z epoka = WYL');
  const expectFlat = ERA_P.eraRebalansAktywny === true && ERA_P.przychodyUlepszenStałeEpoka1 === true;
  assert.equal(out.WYL.flat, expectFlat, 'WYL: plony ulepszen stale (flaga z danych)');
  assert.equal(out.WL.flat, false, 'WL: plony ulepszen rosna z epoka');
  assert.deepEqual(out.WYL.yieldPlon, [2, 2, 2], 'WYL: plon zywnosci stały 2/2/2 (Kamien=Braz=Zelazo)');
  assert.deepEqual(out.WYL.yieldPraca, [2, 2, 2], 'WYL: plon pracy stały 2/2/2');
  assert.deepEqual(out.WL.yieldPlon, [2, 3, 4], 'WL: plon zywnosci base+(epoka-1)');
  assert.deepEqual(out.WL.yieldPraca, [2, 3, 4], 'WL: plon pracy base+(epoka-1)');
  assert.deepEqual(out.WYL.produkcja, [20, 20, 20], 'WYL: produkcja surowca stała 20/20/20');
  assert.ok(out.WL.produkcja[1] > out.WL.produkcja[0], 'WL: produkcja surowca w Brazie wieksza niz w Kamieniu');
  assert.ok(out.WL.produkcja[2] > out.WL.produkcja[1], 'WL: produkcja surowca w Zelazie wieksza niz w Brazie');
}

main({
  collect,
  verify: verifyGrowth,
  mutants: [{
    tag: 'growth-flat',
    base: 'econ-era-rebalance-params.json',
    mutate: (o) => { o.przychodyUlepszenStałeEpoka1 = false; return o; },
  }],
}).catch(e => { console.error('FAIL', e.message); process.exit(1); });
