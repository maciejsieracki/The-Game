'use strict';
/**
 * nns-stale-forecast-after-load-repro.cjs — R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1 (minimalne repro, bez zmian w gra/src).
 *
 * Hipoteza H1: po wczytaniu zapisu w TEJ SAMEJ stronie bramka „Zakończ turę” (NNS) używa cache
 * `_nnsHumanForecast` z poprzedniej gry tej strony. Cache jest przeliczany tylko gdy `empireEconDirty`
 * (refreshLiveEmpireRates, src/main.ts ~23069); restoreGameFromSave (~49576) nie ustawia go ponownie.
 *
 * Kroki (jedna przeglądarka, jeden kontekst, ten sam magazyn zapisów):
 *  1. Świeża gra (?playtest=mapa&civTest=1), tura 1: quickSave zapisu tury 1. Diagnoza: bramka wolna, prognoza null.
 *  2. Realny endTurn -> tura 2: prognoza po turze spichlerzPo = -48 (spichlerz 0), bramka blokuje.
 *  3. loadSlot(zapis tury 1) w TEJ SAMEJ stronie -> tura 1. Oczekiwane (gdyby cache był zgodny z wczytaniem):
 *     bramka wolna i endTurn przesuwa turę do 2. Obserwowane: patrz komunikat poniżej.
 *  4. Kontrola: ta sama tura 1 w ŚWIEŻEJ stronie (bez wcześniejszej gry) -> bramka wolna, endTurn przechodzi.
 *
 * Uwaga pomiarowa: nnsDiag() czyta `forecast` (cache) PRZED wywołaniem nnsGateForPlayer() (które może
 * przeliczyć cache), więc pole forecast w jednym odczycie odpowiada stanowi sprzed tego odczytu.
 * Dlatego wykonywane są dwa kolejne odczyty.
 *
 * Usage (z gra/): node tools/nns-stale-forecast-after-load-repro.cjs <scratchBuildDirAbs> [evidenceJsonAbs]
 * Wymaga: bundle zbudowany do <scratchBuildDirAbs> (vite build --outDir), playwright, CHROME_PATH (opcjonalnie).
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2];
const EVIDENCE = process.argv[3];
if (!SCRATCH) {
  console.error('Usage: node tools/nns-stale-forecast-after-load-repro.cjs <scratchBuildDirAbs> [evidenceJsonAbs]');
  process.exit(2);
}
const URL_GRY = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa&civTest=1';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SLOT = 'nns-stale-repro-t1';

function buildBundle() {
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
}

async function gotoGra(page) {
  await page.goto(URL_GRY, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__aiTradeWiringTestDebug && !!window.__defeatTestDebug && !!window.__truceSaveLoadTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await page.evaluate(() => window.__defeatTestDebug.setPlayerEraForTest(1));
  await wait(300);
}

// Dwa kolejne odczyty (patrz uwaga pomiarowa w nagłówku); zwraca drugi.
async function stan(page) {
  const read = () => page.evaluate(() => {
    const d = window.__aiTradeWiringTestDebug.nnsDiag();
    return {
      tura: window.__eraTestDebug.getWorldState().turn,
      bramkaBlokuje: d.gate,
      komunikat: (d.komunikat || '').slice(0, 120),
      spichlerzZywy: d.spichlerz,
      prognozaCache: d.forecast ? { spichlerzObecny: Math.round(d.forecast.spichlerzObecny), spichlerzPo: Math.round(d.forecast.spichlerzPo), turaPrognozy: d.forecast.turn } : null,
    };
  });
  await read();
  return read();
}

async function endTurnPokaz(page) {
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await wait(5000);
  const after = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  return { przed: before, po: after, przeszedl: after > before };
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('playwright nie znaleziony'); process.exit(1); }
  buildBundle();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const wynik = { kroki: {}, bledyStrony: [] };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => wynik.bledyStrony.push('pageerror: ' + e.message.slice(0, 200)));
    await gotoGra(p);
    wynik.kroki['1_swieza_gra_tura1_przed_zapisem'] = await stan(p);
    wynik.kroki['1_quickSave_tura1'] = await p.evaluate((s) => window.__truceSaveLoadTestDebug.quickSave(s), SLOT);
    wynik.kroki['2_endTurn_do_tury2'] = await endTurnPokaz(p);
    wynik.kroki['2_stan_tura2_po_endTurn'] = await stan(p);
    await p.evaluate((s) => window.__truceSaveLoadTestDebug.loadSlot(s), SLOT);
    for (let i = 0; i < 240; i++) {
      if ((await p.evaluate(() => window.__eraTestDebug.getWorldState().turn)) === 1) break;
      await wait(500);
    }
    await wait(2500);
    wynik.kroki['3_po_wczytaniu_zapisu_tura1_TA_SAMA_STRONA'] = await stan(p);
    wynik.kroki['3_endTurn_po_wczytaniu_TA_SAMA_STRONA'] = await endTurnPokaz(p);
    await ctx.close();

    // Kontrola: świeża strona, zapis tury 1 wczytany od razu (bez wcześniejszej gry w tej stronie).
    const ctx2 = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', (e) => wynik.bledyStrony.push('kontrola pageerror: ' + e.message.slice(0, 200)));
    await gotoGra(p2);
    await p2.evaluate((s) => window.__truceSaveLoadTestDebug.loadSlot(s), SLOT);
    for (let i = 0; i < 240; i++) {
      if ((await p2.evaluate(() => window.__eraTestDebug.getWorldState().turn)) === 1) break;
      await wait(500);
    }
    await wait(2500);
    wynik.kroki['4_kontrola_swieza_strona_po_wczytaniu_tura1'] = await stan(p2);
    wynik.kroki['4_kontrola_endTurn'] = await endTurnPokaz(p2);
    await ctx2.close();
  } finally {
    await browser.close();
  }
  const out = JSON.stringify(wynik, null, 2);
  if (EVIDENCE) { fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true }); fs.writeFileSync(EVIDENCE, out); }
  console.log(out);
}

main().catch((e) => { console.error('FAIL:', e && e.stack || e); process.exit(1); });
