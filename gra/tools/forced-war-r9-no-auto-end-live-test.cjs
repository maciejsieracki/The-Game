'use strict';
/**
 * forced-war-r9-no-auto-end-live-test.cjs -- R-WEB-PEACE-RULES-R8R9-Q1 R9 (kryteria 2 i 4).
 *
 * Realny headless Chromium na prawdziwym bundle Vite (?playtest=mapa), zbudowanym do katalogu
 * tymczasowego poza repo. Dla KAŻDEJ epoki wymuszonej (Brąz, Kamień, Żelazo) osobna świeża strona:
 *  1. Stan wejściowy (hak `__peaceRulesTestDebug.startForcedWarForTest`): wpis w REALNYM rejestrze
 *     epoki, startTurn cofnięty o 30 tur (> dawny limit 25 tur), relacja 'wojna'.
 *  2. REALNY endTurn (`__eraTestDebug.endTurn`): wojna wymuszona NADAL trwa (dawniej: auto-koniec
 *     po czasie).
 *  3. Zdobycie 2 miast przez REALNE applyCityCaptureToMap: wojna NADAL trwa, relacja 'wojna'
 *     (dawniej: auto-pokój po 2 miastach).
 *  4. Pokój przez REALNE finalizePeaceTreatyBetween: wpis rejestru znika, relacja != 'wojna',
 *     odpoczynek napastnika uzbrojony (cleanup po pokoju działa).
 *  5. Zdobyte miasta wracają do właściciela (przywrócenie stanu między epokami).
 * Zero pageerror / console.error w całym scenariuszu.
 *
 * Usage (z gra/): node tools/forced-war-r9-no-auto-end-live-test.cjs [outDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-r9-live-' + process.pid);
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OLD_LIMIT_TURNS = 25; // dawny próg czasu wojny wymuszonej (R-WOJNA-WYMUSZONA-REGULY-Q1)
const ERAS = ['bronze', 'stone', 'iron'];

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  console.log('[r9-live] vite build do katalogu tymczasowego:', SCRATCH);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
}

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

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__peaceRulesTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

async function runEra(browser, era, errors) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push(`[${era}] pageerror: ` + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${era}] console.error: ` + m.text()); });
  await gotoPlaytestMapa(page);
  const dOn = (fn, ...args) => page.evaluate(([name, a]) => window.__peaceRulesTestDebug[name](...a), [fn, args]);
  console.log(`[r9-live] epoka ${era}`);

  // Para (napastnik, obrońca): obrońca dostaje drugie miasto przez REALNE foundCityAt
  // (`ensureSecondCityForOwner`, hak z __aiWojnyZwykleCapTestDebug); napastnik to inny AI.
  const pair = await page.evaluate(() => {
    const d = window.__peaceRulesTestDebug;
    const ais = d.listAiOwnerIds();
    const b = ais.find(x => d.listOwnerCityIdsForTest(x).length >= 1);
    if (b === undefined) return null;
    // 3 miasta obrońcy: po zdobyciu 2 wciąż zostaje 1 (utrata wszystkich miast = eliminacja,
    // która czyści relacje poza testowanym mechanizmem).
    for (let i = 0; i < 4 && d.listOwnerCityIdsForTest(b).length < 3; i++) {
      window.__aiWojnyZwykleCapTestDebug.ensureSecondCityForOwner(b);
    }
    const ids = d.listOwnerCityIdsForTest(b);
    const a = ais.find(x => x !== b);
    if (ids.length < 3 || a === undefined) return null;
    return { a, b, cityIds: ids.slice(0, 2) };
  });
  assert(`[${era}] para (napastnik, obrońca z ≥2 miastami) istnieje w realnej mapie`, pair !== null, pair);
  if (!pair) { await page.close(); return; }
  const { a, b, cityIds } = pair;

  // 1. stan wejściowy: wojna trwa już ponad dawny limit czasu
  const turn0 = await dOn('getForcedWarForTest', era, a, b).then(s => s.turn);
  await page.evaluate(([e, x, y, st]) => window.__peaceRulesTestDebug.startForcedWarForTest(e, x, y, st),
    [era, a, b, turn0 - (OLD_LIMIT_TURNS + 5)]);
  const s1 = await dOn('getForcedWarForTest', era, a, b);
  assert(`[${era}] wojna wymuszona aktywna, relacja 'wojna' (stan wejściowy)`,
    s1.active && s1.status === 'wojna', s1);

  // 2. realny endTurn: wojna trwa mimo limitu czasu
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await page.waitForFunction(
    (t) => window.__eraTestDebug.getWorldState().turn === t + 1 && !window.__eraTestDebug.isEndTurnInProgress(),
    turn0,
    { timeout: 180000 },
  ).catch(() => null);
  await wait(500);
  const s2 = await dOn('getForcedWarForTest', era, a, b);
  assert(`[${era}] po realnym endTurn (startTurn cofnięty o ${OLD_LIMIT_TURNS + 5} tur) wojna NADAL trwa`,
    s2.active && s2.status === 'wojna' && s2.turn === turn0 + 1, s2);

  // 3. zdobycie 2 miast obrońcy przez realną ścieżkę przejęcia
  const cap1 = await dOn('captureCityForTest', cityIds[0], a);
  const cap2 = await dOn('captureCityForTest', cityIds[1], a);
  const s3 = await dOn('getForcedWarForTest', era, a, b);
  const cntB = await dOn('getCityCountForOwner', b);
  assert(`[${era}] 2 miasta przejęte realnym applyCityCaptureToMap (obrońca nie zeliminowany: miasta > 0)`,
    cap1 && cap2 && cntB >= 1, { cap1, cap2, cntB });
  assert(`[${era}] po zdobyciu 2 miast wojna wymuszona NADAL trwa (bez auto-pokoju)`,
    s3.active && s3.status === 'wojna', s3);

  // 4. koniec wyłącznie pokojem: realny finalizePeaceTreatyBetween
  await dOn('endWarByPeaceForTest', a, b);
  const s4 = await dOn('getForcedWarForTest', era, a, b);
  assert(`[${era}] pokój kończy wojnę wymuszoną (wpis rejestru usunięty, relacja != 'wojna')`,
    !s4.active && s4.status !== 'wojna', s4);
  assert(`[${era}] cleanup po pokoju: odpoczynek napastnika uzbrojony (restUntil > tura)`,
    s4.restUntil !== null && s4.restUntil > s4.turn, s4);

  // 5. przywrócenie właścicieli miast (stan między epokami)
  await dOn('captureCityForTest', cityIds[0], b);
  await dOn('captureCityForTest', cityIds[1], b);

  await page.close();
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[r9-live] playwright nie znaleziony'); process.exit(1); }

  buildBundle();
  const browser = await launchBrowser(chromium);
  const errors = [];
  try {
    for (const era of ERAS) {
      await runEra(browser, era, errors);
    }
    assert('zero pageerror / console.error w całym scenariuszu', errors.length === 0, errors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log(`forced-war-r9-no-auto-end-live-test: ${pass} pass / ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('forced-war-r9-no-auto-end-live-test: CRASH', e);
  process.exit(1);
});
