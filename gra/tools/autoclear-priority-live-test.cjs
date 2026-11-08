'use strict';
/**
 * autoclear-priority-live-test.cjs — R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1 (POMIAR NA ZYWEJ GRZE, Chromium).
 *
 * Zero buildu: ładuje gotowy bundle `gra-robocza/Gra-ROBOCZA.html` (hooki testowe już w bundlu).
 * REALNA nowa gra -> REALNE założenie stolicy -> polityka auto-ulepszeń wstrzyknięta przez REALNE
 * `restoreGameFromSave` (hak `__pracaPoolSaveLoadTestDebug.roundTripMeta`, patch `meta.ulepszeniaEmpireByOwner`)
 * -> REALNY `endTurn` (`__eraTestDebug.endTurn`) -> odczyt warstw (`__buildRequestTestDebug.getPlacedLayers`).
 * Mapa (rzeki, teren, las) z REALNEGO snapshotu `buildSaveGameSnapshot` (przechwyt JSON.stringify — tylko odczyt).
 *
 * Usage (z gra/):
 *   node tools/autoclear-priority-live-test.cjs <outJsonAbs> [focus=zrownowazone|zywnosc] [wolno=on|off] [turns=30] [pool0=300] [tryb=auto] [bundleAbs]
 * Wynik: JSON { city, policy, snapshotMap (mapSnapshot), log:[{turn,pool,added:[{hex,key}]}], errors }.
 */
const path = require('path');
const fs = require('fs');
const OUT = process.argv[2];
const FOCUS = process.argv[3] || 'zrownowazone';
const WOLNO = (process.argv[4] || 'off') === 'on';
const TURNS = Number(process.argv[5] || 30);
const POOL0 = Number(process.argv[6] || 300);
const TRYB = process.argv[7] || 'auto';
const BUNDLE = process.argv[8] || path.resolve(__dirname, '..', '..', 'gra-robocza', 'Gra-ROBOCZA.html');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(chromium) {
  try { return await chromium.launch({ headless: true }); } catch (e) {
    return chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}
async function pollUntil(page, label, fn, timeoutMs) {
  const end = Date.now() + timeoutMs; let last = null;
  while (Date.now() < end) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error('pollUntil(' + label + '): timeout ' + JSON.stringify(last));
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await launch(chromium);
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const logs = [];
  let doneCount = 0;
  page.on('console', (m) => { if (/EndTurn/i.test(m.text())) { logs.push(m.text().slice(0, 200)); if (/DONE tura/.test(m.text())) doneCount++; } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => {
    const orig = JSON.stringify;
    window.__capSnap = null;
    JSON.stringify = function (v, ...a) {
      try { if (v && typeof v === 'object' && v.meta && typeof v.meta === 'object' && v.mapSnapshot) window.__capSnap = v; } catch (e) { /* ignore */ }
      return orig.call(this, v, ...a);
    };
  });
  await page.goto('file://' + BUNDLE, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__pracaPoolSaveLoadTestDebug
    && !!window.__eraTestDebug && !!window.__buildRequestTestDebug, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 0, 'normal'));
  await pollUntil(page, 'world', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    const overlay = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 300000);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await pollUntil(page, 'capital', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.cities.some(c => c.ownerId === 0) };
  }, 120000);
  await wait(500);

  // Polityka przez REALNY restoreGameFromSave (meta.ulepszeniaEmpireByOwner) + odblokowanie technologii + pula Pracy.
  const policy = { focus: FOCUS, tryb: TRYB, onlyWorked: true, pracaAutoPercent: 33, wolnoWycinacLas: WOLNO };
  await page.evaluate((p) => {
    window.__buildRequestTestDebug.unlockAllTech();
    window.__pracaPoolSaveLoadTestDebug.roundTripMeta({ ulepszeniaEmpireByOwner: [[0, p]] });
  }, policy);
  await wait(500);
  await page.evaluate((n) => { window.__buildRequestTestDebug.unlockAllTech(); window.__buildRequestTestDebug.setPlayerPracaPool(n); }, POOL0);
  const snap = await page.evaluate(() => {
    window.__pracaPoolSaveLoadTestDebug.roundTrip();
    const s = window.__capSnap;
    return s ? { mapSnapshot: s.mapSnapshot, policy: s.meta.ulepszeniaEmpireByOwner, cities: s.cities.filter(c => c.ownerId === 0).map(c => ({ id: c.id, q: c.q, r: c.r, population: c.population })) } : null;
  });
  if (!snap) throw new Error('brak snapshotu');
  const city = snap.cities[0];
  console.log('city', JSON.stringify(city), 'policy', JSON.stringify(snap.policy));

  const log = [];
  const R = 5;
  const scan = (c) => page.evaluate(({ cq, cr, R }) => {
    const out = {};
    for (let dq = -R; dq <= R; dq++) for (let dr = -R; dr <= R; dr++) {
      if (Math.abs(dq + dr) > R) continue;
      const q = cq + dq, r = cr + dr;
      const l = window.__buildRequestTestDebug.getPlacedLayers(q, r);
      const nak = window.__cityForestTestDebug ? window.__cityForestTestDebug.hexNakladka(q, r) : null;
      const clr = window.__buildRequestTestDebug ? window.__buildRequestTestDebug.isClearing(q, r) : false;
      if ((l && l.length) || clr) out[q + ',' + r] = { l, nak, clr };
    }
    return { layers: out, pool: window.__pracaPoolSaveLoadTestDebug.getPool(), pop: window.__cityStateStartUnitsTestDebug.dumpState().turn };
  }, { cq: c.q, cr: c.r, R });
  let prev = (await scan(city)).layers;
  for (let t = 0; t < TURNS; t++) {
    const before = await scan(city);
    for (let k = 0; k < 4; k++) {
      // zamknij ewentualne okna blokujace (audiencja dyplomatyczna) — jak klik gracza: Wroc / Escape
      const closed = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.offsetParent !== null && /^(Wróć|Zamknij|OK)$/.test((b.textContent || '').trim()));
        if (btn) { btn.click(); return true; }
        return false;
      });
      await page.keyboard.press('Escape');
      await wait(200);
      if (!closed) break;
    }
    const doneBefore = doneCount;
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    // czekaj na nową turę (turn++), do 60 s
    const turnBefore = before.pop;
    const end = Date.now() + 60000;
    let after = null;
    while (Date.now() < end) {
      await wait(250);
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.offsetParent !== null && /^(Wróć|Zamknij|OK|Wyjście)$/.test((b.textContent || '').trim()));
        if (btn) btn.click();
      });
      after = await scan(city);
      if (after.pop > turnBefore && doneCount > doneBefore) break;
    }
    const added = [];
    for (const [hk, v] of Object.entries(after.layers)) {
      const old = prev[hk]?.l || [];
      for (const k of v.l) if (!old.includes(k)) added.push({ hex: hk, key: k });
      if (v.clr && !(prev[hk]?.clr)) added.push({ hex: hk, key: 'wyrab(start)' });
    }
    log.push({ turnFrom: turnBefore, turnTo: after.pop, poolBefore: before.pool, poolAfter: after.pool, added });
    prev = after.layers;
    if (after.pop <= turnBefore) {
      const vis = await page.evaluate(() => Array.from(document.querySelectorAll('button, [role=dialog], .civ-modal, .modal'))
        .filter(el => el.offsetParent !== null).map(el => (el.id || el.className || el.tagName) + ':' + (el.textContent || '').trim().slice(0, 40)).slice(0, 25));
      errors.push('logi: ' + JSON.stringify(logs.slice(-8)));
      errors.push('tura nie ruszyla przy t=' + t + ' widoczne: ' + JSON.stringify(vis));
      try { await page.screenshot({ path: OUT.replace(/\.json$/, '-stall.png') }); } catch (e) { /* ignore */ }
      break;
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ city, policy: snap.policy, mapSnapshot: snap.mapSnapshot, log, errors }));
  console.log('turns', log.length, 'adds', log.reduce((n, x) => n + x.added.length, 0), 'errors', errors.length);
  for (const e of log) if (e.added.length) console.log(`t${e.turnFrom} pool ${Math.round(e.poolBefore)}->${Math.round(e.poolAfter)} ${e.added.map(a => a.key + '@' + a.hex).join(' ')}`);
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
