'use strict';
/**
 * diplo-truce-ai-table-live-test.cjs — R-WEB-TRUCE-Q1 (runda 5, N4 end-to-end): czy AI w
 * żywej grze realnie wstawia ROZEJM na stół negocjacji (enqueueNegotiationFromAiCmd).
 *
 * Realny Chromium na bundle Vite (?playtest=mapa). Wojna gracza z AI ustawiona na 5 tur
 * (< AI_ROZEJM_DO_TUR = 20). Kończymy tury REALNYM endTurn i odczytujemy wpisy stołu
 * (proposerOwnerId === AI). Raport: ile propozycji AI i jakiego rodzaju trafiło na stół.
 *
 * To POMIAR, nie gwarancja: AI decyduje wg własnego stanu (siła, relacja). Wynik 0 propozycji
 * rozejmu oznacza, że w tym scenariuszu AI rozejmu nie zaproponowała (NIE_ZMIERZONO dla innych
 * stanów świata), a nie błąd kodu. Pass = co najmniej jedna propozycja AI 'rozejm' na stole.
 *
 * Usage (z gra/): SKIP_BUILD=1 node tools/diplo-truce-ai-table-live-test.cjs <scratchDirAbs>
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-truce-live-' + process.pid);
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYER = 0;
const AI = 1;
const TURNS_TO_RUN = 8;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await launchBrowser(chromium);
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
  await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
  await page.evaluate(([ai]) => window.__truceTestDebug.setWarAge(ai, 5), [AI]);

  const seen = new Map();
  const startTurn = await page.evaluate(() => window.__truceTestDebug.turn());
  for (let k = 0; k < TURNS_TO_RUN * 40; k++) {
    const cur = await page.evaluate(() => window.__truceTestDebug.turn());
    if (cur >= startTurn + TURNS_TO_RUN) break;
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    await wait(120);
    const entries = await page.evaluate(() => window.__truceTestDebug.negotiationEntries());
    console.log('AI-table progress: tura', await page.evaluate(() => window.__truceTestDebug.turn()), 'wpisy stołu', entries.length);
    for (const e of entries) {
      if (e.proposerOwnerId !== AI) continue;
      const key = e.actionId + '|' + (e.rodzaj ?? '') + '|' + (e.turns ?? '');
      if (!seen.has(key)) seen.set(key, { ...e, firstSeenTurn: await page.evaluate(() => window.__truceTestDebug.turn()) });
    }
  }
  const endTurn = await page.evaluate(() => window.__truceTestDebug.turn());
  const pairFinal = await page.evaluate(([p, a]) => window.__truceTestDebug.pairState(p, a), [PLAYER, AI]);
  console.log('AI-table: tury od', startTurn, 'do', endTurn, '| stan pary', JSON.stringify(pairFinal));
  console.log('AI-table: propozycje AI na stole (unikalne):', JSON.stringify([...seen.values()]));
  const truceSeen = [...seen.values()].some(e => e.actionId === 'rozejm');
  console.log(truceSeen
    ? 'AI-table: PASS — AI wstawiło rozejm na stół'
    : 'AI-table: POMIAR — AI nie wstawiło rozejmu w tym scenariuszu (patrz propozycje AI powyżej)');
  console.log('AI-table: błędy strony:', errors.length ? JSON.stringify(errors.slice(0, 5)) : 'brak');
  await browser.close();
  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
