'use strict';
/**
 * diplo-treaty-pay-ladder-live-verify-test.cjs -- R-WEB-LIVE-VERIFY-TREATY-PAYMENT-AND-PEACE-TAIL-WINDOWS-Q1 (r1, Operator HAIKU).
 * r2 (KROK 1): stosunek sił ustawiany z poprawnym nachyleniem (2) i ASERCJONOWANY (R1, ±0,05).
 * Ścieżka (c): drabina płatności traktatu brąz / żelazo / rudy w ŻYWEJ grze (Chromium, bundle Vite, ?playtest=mapa).
 *
 * Płatnik = gracz (propozycja AI → gracz, przemarsz). Próba ustawienia siły AI na ~1,3× gracza (cel) NIE daje
 * tego stosunku w żywej grze: zmierzony stosunek (Power AI / Power gracza) jest LOGOWANY w każdym przypadku i NIE
 * jest asercjonowany (rozjazd mocy = BLOKADY raportu, ZNANA niezmierzona przyczyna). Zapasy gracza są
 * ustawiane tak, by złoto NIE wystarczało i drabina schodziła na niższe szczeble. Kolejność nośnika z danych
 * (PEACE_TAIL_ORDER): złoto → brąz → żelazo → rudy; szczebel niżej tylko gdy wyższy wyczerpany (composePeaceTail).
 *
 * Asercje (STAN PO akceptacji, nie samo okno):
 *  L1 zapasy płatnika zmalały dokładnie o pozycje nośnika; odbiorca zyskał to samo; nic < 0.
 *  L2 drabina: szczebel k pojawia się tylko gdy szczebel k-1 wyczerpany (qty == zapas sprzed transakcji).
 *  L3 kolejność pozycji nośnika = kolejność drabiny; brak pozycji spoza drabiny.
 *  L4 wiersz okna (windowCarrier) == nośnik akceptacji.
 *  L5 zero pageerror / console.error.
 *
 * Usage (z gra/): node ./node_modules/vite/bin/vite.js build --outDir <scratchAbs> --emptyOutDir
 *                 SKIP_BUILD=1 node tools/diplo-treaty-pay-ladder-live-verify-test.cjs <scratchAbs>
 * Zrzuty: brak (ścieżka (c) mierzona STANEM zapasów przed/po, nie renderem okna — okno = ścieżka (a), NIE ZMIERZONO).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-ladder-live-' + process.pid);
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ORDER = ['zloto', 'braz', 'zelazo', 'ruda', 'ruda_cyny', 'ruda_zelaza'];
const ACTION = 'granice';
const R_TARGET = 1.3; // cel stosunku sił AI/gracz (r2: mierzony i asercjonowany, R1)
const PAYLOAD = { borderMilitary: true };

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

/** Drabina: szczebel k użyty ⇒ szczebel k-1 (jeśli ma zapas) w całości wyczerpany. */
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
      const taken = (used.find(i => i.id === key) || { ilosc: 0 }).ilosc;
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

  const cases = [
    { name: 'L-A złoto 100 + brąz 20000 (drabina do brązu)', hold: { zloto: 100, braz: 20000, zelazo: 20000, ruda: 20000 } },
    { name: 'L-B bez złota, żelazo 2000 → ruda 20000', hold: { zloto: 0, braz: 0, zelazo: 2000, ruda: 20000 } },
    { name: 'L-C tylko ruda 30000', hold: { zloto: 0, braz: 0, zelazo: 0, ruda: 30000 } },
  ];

  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    const ais = await page.evaluate(() => window.__peaceRulesTestDebug.listAiOwnerIds());
    const AI = ais[0];
    console.log('AI owner:', AI);

    for (const c of cases) {
      console.log(`\n[${c.name}] AI→gracz, przemarsz (płatnik: gracz)`);
      // Siła: próba celu AI ≈1,3× gracza (bramka Respektu AI ≥55% zachowana); stosunek ZMIERZONY poniżej (log, bez asercji).
      // Zapasy: gracz wg przypadku, AI bez zapasów.
      // r2 (R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1, KROK 1): składnik „zdobycze" ma współczynnik 2
      // (power-objective.ts, P-MOC-BALANS-WAGI), więc ai = base + 2·bonus; bonus = (r·gracz − base)/2.
      await page.evaluate(([aiId, r]) => {
        const d = window.__peaceRulesTestDebug;
        d.setAiPowerBonusForTest(aiId, 0);
        d.setAiPowerBonusForTest(0, 0);
        const pw0 = d.getPowers(aiId);
        d.setAiPowerBonusForTest(aiId, Math.max(0, Math.round((r * pw0.player - pw0.ai) / 2)));
        d.setRelationForBrake(aiId, 200, 200);
      }, [AI, R_TARGET]);
      const pw = await page.evaluate(([aiId]) => window.__peaceRulesTestDebug.getPowers(aiId), [AI]);
      const rMeas = pw.ai / Math.max(1, pw.player);
      console.log(`  MOC ZMIERZONA: AI/gracz = ${rMeas.toFixed(3)} (ai=${pw.ai}, player=${pw.player}; cel ${R_TARGET})`);
      assert(`${c.name} R1: zmierzony stosunek sił ≈ cel ${R_TARGET} (±0,05)`, Math.abs(rMeas - R_TARGET) <= 0.05, { rMeas, ai: pw.ai, player: pw.player });
      await page.evaluate(([aiId, h]) => {
        window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(0, h, []);
        window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(aiId, { zloto: 5000000, braz: 50000, zelazo: 50000, ruda: 50000 }, []);
      }, [AI, c.hold]);
      const before = await page.evaluate(([aiId]) => ({
        p: window.__cityCessionTestDebug.treatyPayHoldingsForTest(0),
        a: window.__cityCessionTestDebug.treatyPayHoldingsForTest(aiId),
      }), [AI]);
      const res = await page.evaluate(([aiId, act, pl]) => window.__cityCessionTestDebug.treatyPayAcceptAiPendingForTest(aiId, act, pl), [AI, ACTION, PAYLOAD]);
      const after = await page.evaluate(([aiId]) => ({
        p: window.__cityCessionTestDebug.treatyPayHoldingsForTest(0),
        a: window.__cityCessionTestDebug.treatyPayHoldingsForTest(aiId),
      }), [AI]);
      console.log('  wynik:', JSON.stringify({ acc: res.accepted, reason: res.reason, carrier: res.carrier }));

      const items = (res.carrier && res.carrier.items) || [];
      assert(`${c.name}: zaakceptowano i niesie nośnik`, res.accepted === true && items.length > 0, res);
      if (items.length === 0) continue;
      // L1 — stan po
      let l1 = true;
      for (const it of items) {
        const dp = (before.p.holdings[it.id] ?? 0) - (after.p.holdings[it.id] ?? 0);
        const dr = (after.a.holdings[it.id] ?? 0) - (before.a.holdings[it.id] ?? 0);
        if (dp !== it.ilosc || dr !== it.ilosc) { l1 = false; console.log('    rozjazd', it.id, { dp, dr, ilosc: it.ilosc }); }
        if ((after.p.holdings[it.id] ?? 0) < 0) l1 = false;
      }
      assert(`${c.name} L1: płatnik −ilość, odbiorca +ilość, nic < 0`, l1, items);
      // L2 — drabina
      const lad = ladderOk(items, before.p.holdings);
      assert(`${c.name} L2: szczebel niżej tylko po wyczerpaniu wyższego`, lad.ok, lad.detail);
      // L3 — kolejność i zakres
      const outside = items.filter(i => !ORDER.includes(i.id) && i.typ !== 'tech');
      assert(`${c.name} L3: kolejność drabiny, brak pozycji spoza drabiny`, lad.ordered && outside.length === 0, { items, outside });
      // L4 — okno
      const same = JSON.stringify(res.windowCarrier && res.windowCarrier.items) === JSON.stringify(res.carrier && res.carrier.items);
      assert(`${c.name} L4: wiersz okna = nośnik akceptacji`, same, { w: res.windowCarrier, c: res.carrier });
      console.log('  ZMIERZONO:', items.map(i => `${i.id}×${i.ilosc}`).join(', '));
    }
  } finally {
    await browser.close();
  }
  assert('L5: zero pageerror / console.error', errors.length === 0, errors.slice(0, 5));
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('wyjątek:', e && e.stack || e); process.exit(1); });
