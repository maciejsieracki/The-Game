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


// ---- Punkt (4): zamiana nadwyżki Żywności na Podatek (kurs 0,2) ----
// Zrodlo prawdy: gra/src/game/empire-food.ts (convertFoodReserveToTax), kurs 0,2 wg decyzji wlasciciela (FALA 876/883).
// NIE ZMIERZONO: przebieg w grze przez UI (kurs 0,2 podawany przez wywolujacego; nie ma eksportowanego odczytu
// kursu z gra/data w tym module). Test mierzy realna funkcje zamiany, nie przebieg tury.
// Mutacja: NIE ZMIERZONO (brak pliku danych dla kursu w bundlu).
const RATE = 0.2;

const collect = async (page, rate) => page.evaluate((r) => {
  const { FOOD } = window.__vl;
  const c = (reserve, requested, enabled) => FOOD.convertFoodReserveToTax(reserve, requested, r, enabled);
  return {
    r100_100: c(100, 100, true),
    r100_30: c(100, 30, true),
    r100_33: c(100, 33, true),
    r100_100_off: c(100, 100, false),
    r0_50: c(0, 50, true),
  };
}, rate);

function verifyFood(out) {
  assert.deepEqual(out.r100_100, { foodRemaining: 0, foodSpent: 100, taxGained: 20 }, 'rezerwa 100, zadanie 100 -> podatek 20');
  assert.deepEqual(out.r100_30, { foodRemaining: 70, foodSpent: 30, taxGained: 6 }, 'rezerwa 100, zadanie 30 -> podatek 6');
  assert.deepEqual(out.r100_33, { foodRemaining: 67, foodSpent: 33, taxGained: 6 }, 'zadanie 33 -> podatek floor(6,6)=6');
  assert.deepEqual(out.r100_100_off, { foodRemaining: 100, foodSpent: 0, taxGained: 0 }, 'wylaczone = bez zmian');
  assert.deepEqual(out.r0_50, { foodRemaining: 0, foodSpent: 0, taxGained: 0 }, 'pusta rezerwa = 0');
}

main({
  collect: (page) => collect(page, RATE),
  verify: verifyFood,
  mutants: [],
}).catch(e => { console.error('FAIL', e.message); process.exit(1); });
