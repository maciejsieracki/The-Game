'use strict';
/**
 * live-verify-robocza-fort-live-test.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-Q1, punkt 4 (R-WEB-AUTO-FORT-CLAIM-Q1 na ŻYWEJ grze).
 * Bundle gra-robocza/Gra-ROBOCZA.html (hooki testowe w bundlu), zero buildu. REALNA nowa gra (hak startNewGame: Maly, N rywali),
 * REALNE zakładanie miast gracza (hak foundPlayerCity = tryFoundPlayerCityAt) aż do wyczerpania limitu (baza 10),
 * polityka K2 "Zrównoważone/auto" przez REALNY restoreGameFromSave, REALNY endTurn; co SNAP_EVERY tur migawka
 * (buildSaveGameSnapshot -> fortNodes + warstwy ulepszeń całej mapy). Usage (z gra/):
 *   node tools/live-verify-robocza-fort-live-test.cjs <outJsonAbs> [turns=40] [rivals=3] [snapEvery=4]
 */
const path = require('path');
const fs = require('fs');
const OUT = process.argv[2];
const TURNS = Number(process.argv[3] || 40);
const RIVALS = Number(process.argv[4] || 3);
const SNAP_EVERY = Number(process.argv[5] || 4);
const BUNDLE = path.resolve(__dirname, '..', '..', 'gra-robocza', 'Gra-ROBOCZA.html');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function pollUntil(page, label, fn, timeoutMs) {
  const end = Date.now() + timeoutMs; let last = null;
  while (Date.now() < end) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error('pollUntil(' + label + '): timeout ' + JSON.stringify(last));
}

async function main() {
  const C = require('./live-verify-robocza-common.cjs');
  const browser = await C.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  let doneCount = 0;
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { const t = m.text(); if (/DONE tura/.test(t)) doneCount++; if (m.type() === 'error') errors.push('console.error: ' + t.slice(0, 300)); });
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
    && !!window.__eraTestDebug && !!window.__buildRequestTestDebug && !!window.__cityForestTestDebug, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
  await page.evaluate((n) => window.__cityStateStartUnitsTestDebug.startNewGame('normal', n, 'normal'), RIVALS);
  await pollUntil(page, 'world', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 300000);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await pollUntil(page, 'capital', () => ({ ready: window.__cityStateStartUnitsTestDebug.dumpState().cities.some((c) => c.ownerId === 0) }), 120000);
  await wait(500);

  // polityka K2 przez REALNY restoreGameFromSave
  const policy = { focus: 'zrownowazone', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 33, wolnoWycinacLas: false };
  await page.evaluate((p) => { window.__buildRequestTestDebug.unlockAllTech(); window.__pracaPoolSaveLoadTestDebug.roundTripMeta({ ulepszeniaEmpireByOwner: [[0, p]] }); }, policy);
  await wait(500);
  // zakładanie kolejnych miast gracza (REALNE tryFoundPlayerCityAt) do wyczerpania limitu
  const founded = [];
  const MAXC = Number(process.env.FORT_MAXCITIES || 14);
  for (let i = 0; i < MAXC; i++) {
    const res = await page.evaluate(() => {
      const cand = window.__cityForestTestDebug.foundCandidates(1)[0];
      if (!cand) return { none: true };
      const ok = window.__cityForestTestDebug.foundPlayerCity(cand.q, cand.r);
      return { q: cand.q, r: cand.r, ok };
    });
    if (res.none || !res.ok) { founded.push(res); break; }
    founded.push(res);
    await wait(150);
  }
  const playerCities = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().cities.filter((c) => c.ownerId === 0).length);
  console.log('miasta gracza po zakladaniu:', playerCities, 'proby:', JSON.stringify(founded).slice(0, 300));
  await page.evaluate(() => { window.__buildRequestTestDebug.unlockAllTech(); window.__buildRequestTestDebug.setPlayerPracaPool(4000); });

  const snaps = [];
  const takeSnap = async (turnLabel) => {
    const first = snaps.length === 0;
    const s = await page.evaluate((first) => {
      window.__pracaPoolSaveLoadTestDebug.roundTrip();
      const s = window.__capSnap; if (!s) return null;
      const m = s.mapSnapshot;
      return {
        turn: window.__cityStateStartUnitsTestDebug.dumpState().turn, fortNodes: (s.meta && s.meta.fortNodes) || s.fortNodes || null, cities: (s.cities || []).map((c) => ({ ownerId: c.ownerId, q: c.q, r: c.r })),
        ulepszenia: m.ulepszenia, improvementKey: m.improvementKey, dict: m.dict,
        ...(first ? { q: m.q, r: m.r, terenIdx: m.terenIdx, nakladkaIdx: m.nakladkaIdx } : {}),
        pool: window.__pracaPoolSaveLoadTestDebug.getPool(),
      };
    }, first);
    snaps.push({ label: turnLabel, ...s });
    return s;
  };
  await takeSnap('start');
  const turnLog = [];
  for (let t = 0; t < TURNS; t++) {
    for (let k = 0; k < 4; k++) {
      const closed = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.offsetParent !== null && /^(Wróć|Zamknij|OK)$/.test((b.textContent || '').trim()));
        if (btn) { btn.click(); return true; } return false;
      });
      await page.keyboard.press('Escape'); await wait(200);
      if (!closed) break;
    }
    const before = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn);
    const doneBefore = doneCount;
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    const end = Date.now() + 90000; let after = before;
    while (Date.now() < end) {
      await wait(300);
      await page.evaluate(() => { const btn = Array.from(document.querySelectorAll('button')).find((b) => b.offsetParent !== null && /^(Wróć|Zamknij|OK|Wyjście)$/.test((b.textContent || '').trim())); if (btn) btn.click(); });
      after = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn);
      if (after > before && doneCount > doneBefore) break;
    }
    const pool = await page.evaluate(() => window.__pracaPoolSaveLoadTestDebug.getPool());
    turnLog.push({ from: before, to: after, pool: Math.round(pool) });
    if (after <= before) {
      const vis = await page.evaluate(() => Array.from(document.querySelectorAll('button, [role=dialog], .civ-modal, .modal')).filter((el) => el.offsetParent !== null).map((el) => (el.id || el.className || el.tagName) + ':' + (el.textContent || '').trim().slice(0, 40)).slice(0, 25));
      errors.push('tura nie ruszyla przy t=' + t + ' widoczne: ' + JSON.stringify(vis));
      try { await page.screenshot({ path: OUT.replace(/\.json$/, '-stall.png') }); } catch (e) { /* ignore */ }
      break;
    }
    if ((t + 1) % SNAP_EVERY === 0) await takeSnap('t' + after);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ policy, playerCities, founded, turnLog, snaps, errors, partial: true }));
  }
  await takeSnap('final');
  fs.writeFileSync(OUT, JSON.stringify({ policy, playerCities, founded, turnLog, snaps, errors, partial: false }));
  console.log('turns', turnLog.length, 'snaps', snaps.length, 'errors', errors.length);
  for (const s of snaps) console.log(s.label, 'turn', s.turn, 'forty', s.fortNodes ? s.fortNodes.length : 'brak-pola', 'pula', Math.round(s.pool));
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
