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
}).then(() => liveMain()).catch(e => { console.error('FAIL', e.message); process.exit(1); });

// ---- ŻYWA GRA (R-WEB-VERIFY-LIVE-B2): prawdziwy build gry z ?civTest=1 (esbuild, poza repo), start przez
// REALNY doStartGame (hak window.__settingsLive.startNewGame, ta sama funkcja co „Start” kreatora).
// Odczyt: __settingsLive.unitCosts = realne production.ts / unit-cost-tempo.ts / economy-upkeep.ts w grze.
// Oczekiwanie: te same wzory co w harnessie, liczone w Node z gra/data (nie z bundla gry).
// NIE ZMIERZONO w tej rundzie: mutacje na żywej grze (bundle gry nie ma wstrzyknięcia mutanta).
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
    // Kontrola negatywna: bez ?civTest=1 haka __settingsLive nie ma.
    const neg = await browser.newContext();
    const negPage = await neg.newPage();
    await negPage.goto('file://' + html, { waitUntil: 'load', timeout: 120000 });
    await negPage.waitForTimeout(4000);
    assert.equal(await negPage.evaluate(() => typeof window.__settingsLive), 'undefined', 'bez ?civTest=1 brak haka __settingsLive');
    await neg.close();
    const liveOut = {};
    for (const pace of PACES) {
      const s = await liveStart(browser, html, { kosztJednostekPace: pace });
      const got = await s.page.evaluate((names) => {
        const r = {};
        r.settings = window.__settingsLive.getSettings();
        for (const n of names) r[n] = window.__settingsLive.unitCosts(n, 0);
        return r;
      }, SELECTED.map(([, u]) => u.Jednostka));
      assert.deepEqual(s.errors, [], `brak pageerror (${pace})`);
      liveOut[pace] = got;
      await s.context.close();
    }
    for (const pace of PACES) {
      const got = liveOut[pace];
      assert.equal(got.settings.kosztJednostekPace, pace, `start z tempem ${pace} = ustawienie gry`);
      for (const [label, u] of SELECTED) {
        const row = got[u.Jednostka];
        assert.ok(row, `live unitCosts ${u.Jednostka}`);
        const cost = u['Pieniądz (koszt)'];
        const base = Math.round(cost * EPOCH_MULT[u.Epoka] * EXTRA_MULT[u.Epoka]);
        assert.equal(row.recruitBase, base, `live baza rekrutacji ${label} = harness/dane`);
        assert.equal(row.recruitPaced, Math.max(1, Math.round(base * PACE_MULT[pace])), `live rekrutacja ${label} ${pace}`);
        near(row.foodPerTurn, u['żywność/turę'] * R_STAWKI_FALA1_FALA2_MULT * Math.pow(4, ERA_ORD[u.Epoka] - 1) * PACE_MULT[pace], `live zywnosc ${label} ${pace}`);
        // Utrzymanie Pieniądz: tabela z units.json x epoka (scaleCostByEpoch) x R_STAWKI (4) x tempo.
        const upk = u['Utrzymanie (Pieniądz/turę)'];
        assert.equal(row.pieniadzUpkeep, Math.round(upk * EPOCH_MULT[u.Epoka] * R_STAWKI_FALA1_FALA2_MULT * PACE_MULT[pace]), `live utrzymanie Pieniądz ${label} ${pace}`);
        // Utrzymanie surowca: ilość z units.json x epoka x tempo (proporcja względem Niski).
        // Surowiec: sprawdzany w porownaniu z przebiegiem Niski (ponizej), bo wzor surowca nie jest tu powtarzany.
        const resName = u['Utrzymanie surowiec'];
        if (typeof resName === 'string' && resName.length > 0) {
          const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
          const resKey = Object.keys(row.resourceUpkeep || {}).find(k => norm(k) === norm(resName));
          assert.ok(resKey, `live utrzymanie surowca ${resName} (${label}, ${pace}) klucze=${JSON.stringify(row.resourceUpkeep)}`);
          const baseRes = liveOut.niski[u.Jednostka].resourceUpkeep[resKey];
          assert.ok(baseRes > 0, `surowiec ${resName} niski > 0 (${label})`);
          assert.ok(Math.abs(row.resourceUpkeep[resKey] - baseRes * PACE_MULT[pace]) <= 1, `surowiec ${resName} ${label} ${pace} = niski x ${PACE_MULT[pace]}`);
        }
      }
    }
    console.log('ZYWA GRA ZIELONA (kosztJednostek x3 x3 jednostki, negatywna kontrola)');
    console.log(JSON.stringify(liveOut));
  } finally {
    await browser.close();
  }
}
