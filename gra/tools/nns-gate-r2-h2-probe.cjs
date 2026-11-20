'use strict';
/**
 * nns-gate-r2-h2-probe.cjs — R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1, runda 2 (test H2; bez zmian w gra/src).
 *
 * H2: w świeżej grze `?playtest=mapa` cache prognozy NNS (`_nnsHumanForecast`) zostaje null, bo flaga `empireEconDirty`
 * została wyzerowana przed założeniem miasta gracza (scenariusz playtest dokłada miasto przez `cities.push` bez
 * `markCityStateDirty()`). Test: odczyt -> wymuszenie przeliczenia przez istniejący hak
 * `__nnsMeasureDebug.forceGateRecompute()` (= markCityStateDirty + updateHud, bez nowego haka w src) -> odczyt.
 * Jeśli po wymuszeniu cache = prognoza (np. spichlerzPo -48), H2 potwierdzona: to nie wczytanie, tylko brak przeliczenia.
 * Kontrola: ta sama strona, świeża gra `newgame` (startGame + foundFirstCity) — odczyt bez wymuszenia.
 *
 * Usage (z gra/): node tools/nns-gate-r2-h2-probe.cjs <buildDirAbs> <profileDirAbs> [evidenceJsonAbs]
 */
const path = require('path');
const fs = require('fs');

const [, , BUILD, PROFILE, EVIDENCE] = process.argv;
if (!BUILD || !PROFILE) {
  console.error('Usage: node tools/nns-gate-r2-h2-probe.cjs <buildDirAbs> <profileDirAbs> [evidenceJsonAbs]');
  process.exit(2);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const wynik = { kroki: {}, bledy: [], konsola: [] };

// Odczyt bramki: DWA osobne wywołania nnsDiag (pierwsze przelicza cache dirty-gated).
async function odczyt(page) {
  const czytaj = () => page.evaluate(() => {
    const d = window.__aiTradeWiringTestDebug.nnsDiag();
    return {
      bramkaBlokuje: d.gate,
      komunikat: (d.komunikat || '').slice(0, 120),
      skarbiec: d.treasury,
      spichlerzZywy: d.spichlerz,
      prognoza: d.forecast ? { tura: d.forecast.turn, spichlerzPo: Math.round(d.forecast.spichlerzPo), skarbiecPo: Math.round(d.forecast.skarbiecPo) } : null,
    };
  });
  await czytaj();
  return czytaj();
}

async function gotoPlaytest(page, url) {
  page.on('pageerror', (e) => wynik.bledy.push(e.message.slice(0, 200)));
  page.on('console', (m) => { if (/NNS|EndTurn/.test(m.text())) wynik.konsola.push(m.text().slice(0, 160)); });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__aiTradeWiringTestDebug && !!window.__nnsMeasureDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
}

async function main() {
  const { chromium } = require('playwright');
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true,
    executablePath: process.env.CHROME_PATH || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'),
    viewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const p = await ctx.newPage();
    await gotoPlaytest(p, 'file://' + path.join(BUILD, 'index.html') + '?playtest=mapa&civTest=1');
    wynik.kroki.H2_E0_playtest_t1_przed = await odczyt(p);
    const forceOk = await p.evaluate(() => typeof window.__nnsMeasureDebug.forceGateRecompute === 'function');
    wynik.kroki.H2_hak_forceGateRecompute_dostepny = forceOk;
    await p.evaluate(() => window.__nnsMeasureDebug.forceGateRecompute());
    await wait(500);
    wynik.kroki.H2_E1_playtest_t1_po_forceGateRecompute = await odczyt(p);
    const endTurnPo = await p.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    wynik.kroki.H2_tura_przed_endTurn = endTurnPo;
    await p.close();

    // Kontrola: świeża gra newgame (startGame + foundFirstCity) bez żadnego wymuszenia.
    const k = await ctx.newPage();
    k.on('pageerror', (e) => wynik.bledy.push('K ' + e.message.slice(0, 200)));
    await k.goto('file://' + path.join(BUILD, 'index.html') + '?civTest=1&civSeed=4242', { waitUntil: 'load', timeout: 120000 });
    await k.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await k.evaluate(() => window.__nnsMeasureDebug.startGame({ seed: 4242 }));
    await k.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, undefined, { timeout: 180000 });
    await k.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, undefined, { timeout: 600000, polling: 500 });
    const found = await k.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    wynik.kroki.KONTROLA_newgame_po_foundFirstCity = { found, ...(await odczyt(k)) };
    await k.close();
  } catch (e) {
    wynik.bledy.push('FAIL ' + ((e && e.message) || String(e)).slice(0, 300));
    process.exitCode = 1;
  } finally {
    await ctx.close();
  }
  const out = JSON.stringify(wynik, null, 2);
  if (EVIDENCE) { fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true }); fs.writeFileSync(EVIDENCE, out); }
  console.log(out);
}

main().catch((e) => { console.error('FAIL:', (e && e.stack) || e); process.exit(1); });
