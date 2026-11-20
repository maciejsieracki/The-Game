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


// ---- Punkt (3): „Koszty jednostek” Niski ×1 / Normalny ×2 (domyślny) / Wysoki ×4 ----
// Zrodlo prawdy: gra/data/units.json (Pieniądz (koszt), żywność/turę, Epoka),
// gra/data/unit-recruit-cost-era-params.json (dodatkowy mnoznik rekrutacji wg epoki: Kamien 1 / Braz 2 / Zelazo 4),
// gra/src/game/production.ts (unitRecruitBaseMoneyCost), unit-cost-tempo.ts (applyUnitCostPace),
// economy-upkeep.ts (unitFoodCardValue: zywnosc x4 R_STAWKI x 4^(epoka-1) x tempo).
// Oczekiwanie (Kamien/Braz/Zelazo): rekrutacja baza x1/x4/x16 przed tempem; zywnosc 4/16/64 (x tempo).
// NIE ZMIERZONO: utrzymanie w Pieniadzu (economy-upkeep.ts, funkcja nie jest eksportowana).
const UNITS = readData('units.json');
const RECRUIT_P = readData('unit-recruit-cost-era-params.json');
const pick = (name) => UNITS.find(u => u.Jednostka === name);
const pickEpoch = (epoka) => UNITS.find(u => u.Epoka === epoka && (u['Pieniądz (koszt)'] || 0) > 0 && (u['żywność/turę'] || 0) > 0);
const SELECTED = [
  ['Kamien', pick('Wojownik')],
  ['Braz', pickEpoch('Brąz')],
  ['Zelazo', pickEpoch('Żelazo')],
];
const PACES = ['niski', 'normalny', 'wysoki'];
const PACE_MULT = { niski: 1, normalny: 2, wysoki: 4 };
const EPOCH_MULT = { 'Kamień': 1, 'Brąz': 2, 'Żelazo': 4 };
const EXTRA_MULT = { 'Kamień': RECRUIT_P.kosztRekrutacjiDodatkowyMnoznikEpoki.kamien, 'Brąz': RECRUIT_P.kosztRekrutacjiDodatkowyMnoznikEpoki.braz, 'Żelazo': RECRUIT_P.kosztRekrutacjiDodatkowyMnoznikEpoki.zelazo };
const R_STAWKI_FALA1_FALA2_MULT = 4; // gra/src/game/r-stawki-strojenie.ts (4 = 4/16/64 wg dispatchu)
const ERA_ORD = { 'Kamień': 1, 'Brąz': 2, 'Żelazo': 3 };

// Wybor jednostek po stronie strony z DANYCH BUNDLA (window.__vl.DATA.units = gra/data/units.json w bundlu).
const collect = async (page) => page.evaluate(() => {
  const { PROD, PACE, UPK, DATA } = window.__vl;
  const units = DATA.units;
  const sel = {
    Kamien: units.find(u => u.Jednostka === 'Wojownik'),
    Braz: units.find(u => u.Epoka === 'Brąz' && (u['Pieniądz (koszt)'] || 0) > 0 && (u['żywność/turę'] || 0) > 0),
    Zelazo: units.find(u => u.Epoka === 'Żelazo' && (u['Pieniądz (koszt)'] || 0) > 0 && (u['żywność/turę'] || 0) > 0),
  };
  const out = {};
  for (const label of Object.keys(sel)) {
    const u = sel[label];
    const base = PROD.unitRecruitBaseMoneyCost(u);
    out[label] = { name: u.Jednostka, epoka: u.Epoka, rekrutacjaBaza: base, rekrutacja: {}, zywnosc: {} };
    for (const pace of ['niski', 'normalny', 'wysoki']) {
      out[label].rekrutacja[pace] = PACE.applyUnitCostPace(base, pace);
      out[label].zywnosc[pace] = UPK.unitFoodCardValue(u, pace);
    }
  }
  return out;
});

function verifyUnits(out) {
  for (const [label, u] of SELECTED) {
    const row = out[label];
    assert.ok(u, `jednostka ${label} istnieje w units.json`);
    assert.equal(row.epoka, u.Epoka, `epoka ${label}`);
    const cost = u['Pieniądz (koszt)'];
    const base = Math.round(cost * EPOCH_MULT[u.Epoka] * EXTRA_MULT[u.Epoka]);
    assert.equal(row.rekrutacjaBaza, base, `baza rekrutacji ${label} = koszt ${cost} x epoka x dodatek`);
    for (const pace of PACES) {
      assert.equal(row.rekrutacja[pace], Math.max(1, Math.round(base * PACE_MULT[pace])), `rekrutacja ${label} ${pace}`);
      const food = u['żywność/turę'] * R_STAWKI_FALA1_FALA2_MULT * Math.pow(4, ERA_ORD[u.Epoka] - 1) * PACE_MULT[pace];
      near(row.zywnosc[pace], food, `zywnosc ${label} ${pace}`);
    }
  }
  assert.equal(out.Kamien.zywnosc.niski, 4, 'zywnosc Kamien Niski = 4');
  assert.equal(out.Braz.zywnosc.niski, 16, 'zywnosc Braz Niski = 16');
  assert.equal(out.Zelazo.zywnosc.niski, 64, 'zywnosc Zelazo Niski = 64');
}

main({
  collect,
  verify: verifyUnits,
  mutants: [{
    tag: 'units-brazcost',
    base: 'units.json',
    mutate: (arr) => {
      const t = arr.find(u => u.Jednostka === SELECTED[1][1].Jednostka);
      t['Pieniądz (koszt)'] = t['Pieniądz (koszt)'] + 7;
      return arr;
    },
  }],
}).catch(e => { console.error('FAIL', e.message); process.exit(1); });
