'use strict';
/**
 * diplo-treaty-pay-room-tail-live-verify-2-test.cjs -- R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1 (KROK 2, d).
 * Żywy pomiar ogona płatności POKOJU gracz → AI w ŻYWEJ grze (Chromium, bundle Vite, ?playtest=mapa).
 *
 * Hak: __cityCessionTestDebug.peaceRoomTailForTest(aiId, duePn, noGold) -- TYLKO wejściowe D (duePn) jest
 * podawane przez test (cena pokoju > 0); plan = peacePlanWithTail z tymi samymi cenami/zapasami/miastami co
 * wiring tailPlan; przelew = transferBasketItems (realny). Nie zmienia obliczeń gry.
 *
 * Asercje (STAN PO, nie sam zwrot):
 *  T1 płatnik zmalał o dokładnie ilość każdej pozycji ogona; odbiorca zyskał to samo; nic < 0.
 *  T2 drabina: szczebel k tylko po wyczerpaniu szczebla k-1 (zapas sprzed transakcji).
 *  T3 brak pozycji 'miasto' gdy gracz ma jedno miasto (ostatnie miasto nigdy nie płaci).
 *  T4 wariant rozejmu bez złota: brak pozycji 'zloto' (noGold=true).
 *  T5 wariant „Oddajesz: miasta": gracz z 2 miastami -> pozycja miasta pierwsza, po płatności >= 1 miasto.
 *  T6 duePn = 0 -> pusta płatność, stan bez zmian.
 *  T7 zero pageerror / console.error.
 *
 * Usage (z gra/): node ./node_modules/vite/bin/vite.js build --outDir <scratchAbs> --emptyOutDir
 *                 SKIP_BUILD=1 node tools/diplo-treaty-pay-room-tail-live-verify-2-test.cjs <scratchAbs>
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-room-tail-' + process.pid);
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ORDER = ['zloto', 'braz', 'zelazo', 'ruda'];
const PLAYER = 0;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else {
    fail++;
    console.log(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail).slice(0, 600) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) return;
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe' });
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__cityCessionTestDebug
      && window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 900000 },
  );
  await wait(300);
}

/** Drabina: szczebel k użyty => szczebel k-1 (jeśli ma zapas) w całości wyczerpany. */
function ladderOk(items, holdingsBefore) {
  const used = items.filter(i => ORDER.includes(i.id));
  const idx = used.map(i => ORDER.indexOf(i.id));
  const ordered = idx.every((v, k) => k === 0 || idx[k - 1] < v);
  let lowerExhausted = true;
  const detail = [];
  for (const it of used) {
    const k = ORDER.indexOf(it.id);
    for (let j = 0; j < k; j++) {
      const key = ORDER[j];
      const have = holdingsBefore[key] ?? 0;
      if (have <= 0) continue;
      const taken = (used.find(i => i.id === key) || { amount: 0 }).amount;
      if (taken !== have) { lowerExhausted = false; detail.push({ wyzszy: key, zapas: have, wziete: taken, nizszy: it.id }); }
    }
  }
  return { ok: ordered && lowerExhausted, ordered, detail };
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { console.error('playwright nie znaleziony'); process.exit(1); }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  const holdingsOf = (ownerId) => page.evaluate((o) => window.__cityCessionTestDebug.treatyPayHoldingsForTest(o).holdings, ownerId);
  const cityCountOf = (ownerId) => page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o).length, ownerId);

  /** Jeden przypadek: ustaw zapasy, wykonaj hak, sprawdź stan przed/po. */
  async function runCase(name, { hold, due, noGold, extraCity = false }) {
    console.log(`\n[${name}] duePn=${due} noGold=${noGold}`);
    await page.evaluate(([h]) => {
      window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(0, h, []);
    }, [hold]);
    if (extraCity) {
      const id = await page.evaluate(() => window.__cityCessionTestDebug.foundExtraCityForTest(0));
      console.log('  dodatkowe miasto gracza:', id);
    }
    const aiId = (await page.evaluate(() => window.__peaceRulesTestDebug.listAiOwnerIds()))[0];
    const before = { p: await holdingsOf(PLAYER), a: await holdingsOf(aiId), c: await cityCountOf(PLAYER) };
    const res = await page.evaluate(([ai, d, ng]) => window.__cityCessionTestDebug.peaceRoomTailForTest(ai, d, ng), [aiId, due, noGold]);
    const after = { p: await holdingsOf(PLAYER), a: await holdingsOf(aiId), c: await cityCountOf(PLAYER) };
    console.log('  ZMIERZONO:', res.items.map(i => `${i.kind}:${i.id}×${i.amount}`).join(', ') || '(brak)',
      `coveredPn=${res.coveredPn} shortfallPn=${res.shortfallPn} miast gracza po=${res.ownCitiesAfter}`);
    return { res, before, after, aiId };
  }

  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());

    // T1/T2 — drabina gdy gracz ma złoto + zapasy niższych szczebli (jedno miasto: ostatnie nie płaci).
    {
      const hold = { zloto: 100, braz: 20000, zelazo: 20000, ruda: 20000 };
      const { res, before, after } = await runCase('D1 złoto 100 + brąz/żelazo/rudy', { hold, due: 3000, noGold: false });
      let t1 = true;
      for (const it of res.items) {
        const dp = (before.p[it.id] ?? 0) - (after.p[it.id] ?? 0);
        const dr = (after.a[it.id] ?? 0) - (before.a[it.id] ?? 0);
        if (dp !== it.amount || dr !== it.amount) t1 = false;
      }
      for (const k of ORDER) if ((after.p[k] ?? 0) < 0) t1 = false;
      assert('D1 T1: płatnik −ilość, AI +ilość, nic < 0', t1, res.items);
      const lad = ladderOk(res.items, before.p);
      assert('D1 T2: drabina złoto→brąz→żelazo→ruda', lad.ok, { lad, items: res.items });
      assert('D1 T2b: pokryto cenę (coveredPn ≥ due lub shortfall jawny)', res.coveredPn + res.shortfallPn >= 3000, res);
      assert('D1 T3: ostatnie miasto nie płaci (brak pozycji miasto)', !res.items.some(i => i.kind === 'miasto'), res.items);
      assert('D1 T3b: gracz nadal ma miasto', res.ownCitiesAfter >= 1, res);
    }
    // T1/T2 — bez złota: żelazo, potem rudy.
    {
      const hold = { zloto: 0, braz: 0, zelazo: 2000, ruda: 20000 };
      const { res, before, after } = await runCase('D2 bez złota: żelazo 2000 → ruda', { hold, due: 3000, noGold: false });
      const lad = ladderOk(res.items, before.p);
      assert('D2 T2: żelazo wyczerpane przed rudą', lad.ok, { lad, items: res.items });
      assert('D2 T1: płatnik −ilość, AI +ilość', res.items.every(i => (before.p[i.id] - after.p[i.id]) === i.amount
        && (after.a[i.id] - before.a[i.id]) === i.amount), res.items);
      assert('D2 T3: brak złota w płatności (zapas 0)', !res.items.some(i => i.id === 'zloto'), res.items);
    }
    // T4 — rozejm bez złota: złoto 5000 + brąz; wariant noGold=true nie może użyć złota.
    {
      const hold = { zloto: 5000, braz: 20000, zelazo: 0, ruda: 0 };
      const { res, before, after } = await runCase('D3 rozejm bez złota (złoto 5000 w zapasie)', { hold, due: 3000, noGold: true });
      assert('D3 T4: brak pozycji złoto', !res.items.some(i => i.id === 'zloto'), res.items);
      assert('D3 T4b: złoto gracza nietknięte', (after.p.zloto ?? 0) === (before.p.zloto ?? 0), { b: before.p.zloto, a: after.p.zloto });
    }
    // T6 — cena 0.
    {
      const hold = { zloto: 100, braz: 100, zelazo: 100, ruda: 100 };
      const { res, before, after } = await runCase('D4 cena 0', { hold, due: 0, noGold: false });
      assert('D4 T6: pusta płatność, zapasy bez zmian', res.items.length === 0
        && ORDER.every(k => (before.p[k] ?? 0) === (after.p[k] ?? 0)), res);
    }
    // T5 — wariant „Oddajesz: miasta": 2 miasta gracza, duża cena -> miasto pierwsze, zostaje >= 1.
    {
      const hold = { zloto: 0, braz: 0, zelazo: 0, ruda: 0 };
      const { res } = await runCase('D5 Oddajesz: miasta (2 miasta gracza)', { hold, due: 40000, noGold: false, extraCity: true });
      const firstCity = res.items.findIndex(i => i.kind === 'miasto');
      assert('D5 T5a: pozycja miasta obecna', firstCity >= 0, res.items);
      assert('D5 T5b: miasto przed ogonem', firstCity === 0 || firstCity < 0 || res.items.slice(0, firstCity).every(i => i.kind === 'miasto'), res.items);
      assert('D5 T5c: po płatności gracz ma co najmniej 1 miasto', res.ownCitiesAfter >= 1, res);
      assert('D5 T5d: liczba oddanych miast ≤ liczba miast minus 1', res.items.filter(i => i.kind === 'miasto').length <= 1, res.items);
    }
  } finally {
    await browser.close();
  }
  assert('T7: zero pageerror / console.error', errors.length === 0, errors.slice(0, 5));
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('wyjątek:', e && e.stack || e); process.exit(1); });
