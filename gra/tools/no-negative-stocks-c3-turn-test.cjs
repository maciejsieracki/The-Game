'use strict';
/**
 * no-negative-stocks-c3-turn-test.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (C3, test turowy na REALNYM wywołaniu).
 *
 * Realna gra (bundle vite, headless Chromium, ?civTest=1, realne „Zakończ turę” -> nnsAiPreTickBalance z main.ts).
 * Scenariusz (AI równoważy od tury 1): AI dostaje 40 dodatkowych jednostek (utrzymanie >> dochód) i skarbiec 0 — bez równoważenia
 * skarbiec po turze < 0 (i licznik kar deficytu rośnie); z równoważeniem skarbiec po turze >= 0 i kary deficytu
 * NIE wchodzą. Mutacja: ta sama sytuacja z flagą równoważenia WYŁĄCZONĄ -> test musi to wykryć (minus + licznik kary).
 *
 * Użycie (z gra/; bundle budowany osobno poza repo):
 *   node tools/no-negative-stocks-c3-turn-test.cjs --dist <dist>
 * Czas: ok. 2-4 min (generacja świata Maly, 15 typów cywilizacji).
 */
const path = require('path');
const fs = require('fs');

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def; }
const DIST = arg('dist');
const SEED = parseInt(arg('seed', '11'), 10);
const wait = ms => new Promise(r => setTimeout(r, ms));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let passed = 0, failed = 0;
function ok(c, label) { if (c) passed++; else { failed++; console.error('FAIL:', label); } }

async function endTurn(page) {
  return page.evaluate(() => new Promise(resolve => {
    const h = window.__nnsMeasureDebug; const t0 = performance.now(); const turn0 = h.snapshot().turn;
    h.endTurn(); let saw = h.isEndTurnInProgress();
    const tick = () => {
      const ip = h.isEndTurnInProgress(); if (ip) saw = true;
      const turn1 = h.snapshot().turn;
      if (!ip && (saw || performance.now() - t0 > 2000)) { resolve({ turn0, turn1 }); return; }
      if (performance.now() - t0 > 300000) { resolve({ turn0, turn1, timeout: true }); return; }
      setTimeout(tick, 5);
    };
    setTimeout(tick, 0);
  }));
}

async function main() {
  if (!DIST) { console.error('wymagane: --dist <bundle>'); process.exit(1); }
  const { chromium } = require('playwright');
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  let browser;
  try { browser = await chromium.launch({ headless: true, args }); } catch (_) { browser = await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args }); }
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    let mapLogged = false;
    page.on('console', m => { if (/\[NewGame\] Mapa/.test(m.text())) mapLogged = true; });
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: 'Maly', civTypes: 15, cityStates: 2 });
    let ready = false;
    for (let i = 0; i < 600 && !ready; i++) {
      await wait(1000); if (!mapLogged) continue;
      const st = await page.evaluate(() => {
        const h = window.__nnsMeasureDebug;
        const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
        return { ov, w: h.worldReady(), aw: h.awaitingFirstCity() };
      });
      ready = !st.ov && st.w && st.aw;
    }
    ok(ready, 'świat wygenerowany');
    await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    await page.waitForFunction(() => window.__nnsMeasureDebug.playerCities() > 0 && !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 60000 });
    await wait(2000);
    await page.evaluate(() => { const h = window.__nnsMeasureDebug; h.setFast(true); try { window.__rebelProtectionTestDebug.disableVictoryCheckForTest(); } catch (_) {} });
    // dojdź do tury 12 (równoważenie AI jest aktywne od tury 1; test startuje dopiero od tury 12)
    for (let guard = 0; guard < 30; guard++) {
      const t = await page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn);
      if (t >= 12) break;
      await page.evaluate(() => window.__nnsMeasureDebug.grantPlayerGold(5000));
      await endTurn(page);
    }
    const snap0 = await page.evaluate(() => window.__nnsMeasureDebug.snapshot());
    ok(snap0.turn >= 12, 'tura >= 12 (równoważenie aktywne), jest: ' + snap0.turn);
    ok(snap0.owners.filter(o => !o.cityState).length >= 5, 'co najmniej 5 pełnych cywilizacji AI, jest: ' + snap0.owners.filter(o => !o.cityState).length);
    const civTypes = new Set(snap0.owners.map(o => o.civ));
    console.log('[test] typów cywilizacji AI w świecie:', civTypes.size, '; właścicieli AI:', snap0.owners.length);

    async function scenario(oid, balanceOn) {
      await page.evaluate(([b]) => window.__nnsMeasureDebug.setBalance(b), [balanceOn]);
      await page.evaluate(() => window.__nnsMeasureDebug.drain());
      const sp = await page.evaluate(o => window.__nnsMeasureDebug.spawnAiUnits(o, 40), oid);
      await page.evaluate(([o]) => window.__nnsMeasureDebug.forceTreasury(o, 0), [oid]);
      const before = await page.evaluate(o => ({ units: window.__nnsMeasureDebug.unitCount(o), def: window.__nnsMeasureDebug.goldDeficitTurns(o) }), oid);
      await page.evaluate(() => window.__nnsMeasureDebug.grantPlayerGold(5000));
      const r = await endTurn(page);
      const d = await page.evaluate(() => window.__nnsMeasureDebug.drain());
      const after = await page.evaluate(o => {
        const h = window.__nnsMeasureDebug; const s = h.snapshot().owners.find(x => x.oid === o);
        return { treasury: s ? s.treasury : null, units: h.unitCount(o), def: h.goldDeficitTurns(o) };
      }, oid);
      const bank = d.bank.find(b => b.oid === oid && b.turn === r.turn1);
      const log = d.log.find(l => l.oid === oid && l.turn === r.turn1);
      return { sp, before, after, bank, log, turn: r.turn1 };
    }

    // wybór właściciela: pełna cywilizacja AI z >= 2 jednostkami bojowymi
    const pickOwner = async (exclude) => page.evaluate(ex => {
      const s = window.__nnsMeasureDebug.snapshot();
      const c = s.owners.filter(o => !o.cityState && o.cities >= 1 && o.units >= 2 && !ex.includes(o.oid));
      return c.length ? c[0].oid : null;
    }, exclude);
    const oidA = await pickOwner([]);
    ok(oidA !== null, 'jest właściciel AI do scenariusza (flaga ON)');
    const on = await scenario(oidA, true);
    console.log('[test] ON :', JSON.stringify({ oid: oidA, spawn: on.sp, before: on.before, after: on.after, bank: on.bank, akcje: on.log && on.log.akcje.length, pokryte: on.log && on.log.pokryte, wyjatek: on.log && on.log.wyjatek }));
    ok(on.sp.added === 40, 'ON: dołożono 40 jednostek');
    ok(on.log && on.log.hold === true, 'ON: równoważenie uruchomione (wpis w dzienniku, wstrzymanie zakupów)');
    ok(on.log && on.log.akcje.some(a => a.startsWith('rozwiaz:')), 'ON: rozwiązano jednostki (realne wywołanie disbandAiSupportUnit)');
    ok(on.after.units < on.before.units, 'ON: liczba jednostek ownera zmalała po turze (' + on.before.units + ' -> ' + on.after.units + ')');
    ok(on.bank && on.bank.skarb >= 0, 'ON: skarbiec po bankowaniu ticku >= 0 (jest ' + (on.bank && Math.round(on.bank.skarb)) + ')');
    ok(on.after.treasury !== null && on.after.treasury >= 0, 'ON: skarbiec po całej turze >= 0 (jest ' + (on.after.treasury !== null ? Math.round(on.after.treasury) : null) + ')');
    ok(on.after.def === 0, 'ON: kary deficytu złota nie weszły (licznik tur deficytu = ' + on.after.def + ')');
    ok(on.after.units >= 1, 'ON: cywilizacja nie wyeliminowana przez równoważenie (zostały jednostki: ' + on.after.units + ')');

    const oidB = await pickOwner([oidA]);
    ok(oidB !== null, 'jest drugi właściciel AI do scenariusza (flaga OFF — mutacja)');
    const off = await scenario(oidB, false);
    console.log('[test] OFF:', JSON.stringify({ oid: oidB, spawn: off.sp, before: off.before, after: off.after, bank: off.bank }));
    ok(off.bank && off.bank.skarb < 0, 'MUTACJA (flaga OFF): skarbiec po ticku < 0 — test wykrywa brak równoważenia (jest ' + (off.bank && Math.round(off.bank.skarb)) + ')');
    ok(off.after.def >= 1, 'MUTACJA (flaga OFF): licznik kar deficytu rośnie (kara deficytu wchodzi = siatka bezpieczeństwa działa), jest ' + off.after.def);
    ok(off.log === undefined || off.log.hold === false, 'MUTACJA (flaga OFF): brak wstrzymań i akcji równoważenia');
    await page.evaluate(() => window.__nnsMeasureDebug.setBalance(true));
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(`no-negative-stocks-c3-turn-test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
main().catch(e => { console.error('[c3-turn-test] FATAL', e); process.exit(1); });
