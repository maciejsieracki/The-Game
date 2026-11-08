'use strict';
/**
 * war-rules-multiwar-live-test.cjs — R-WEB-WAR-RULES-MULTIWAR-Q1 r5, zadanie (3).
 *
 * POMIAR W PRAWDZIWEJ GRZE (headless Chromium, Playwright, realny `vite build`), wzorem
 * `forced-war-player-target-live-test.cjs`: realne `endTurn()` (ta sama funkcja co przycisk
 * „Zakończ turę"), realne silnik AI, zero reimplementacji bramek.
 *
 * ZAKRES TEGO PLIKU (uczciwie): sandbox `?playtest=mapa` ma z definicji 2 cywilizacje
 * (gracz + 1 AI, main.ts PLAYTEST_MAPA_AI_OWNER) -- NIE 4–6 AI i NIE wojny AI<->AI.
 * Dlatego ten pomiar daje: (a) liczbę wojen gracz<->AI przed turą 40 (R1, musi być 0),
 * (b) czas tury ON vs OFF (limit x1,15), (c) liczbę wojen na parę w czasie. Pełny pomiar
 * wymagany dispatchem (4–6 AI, >=2 seedy, >=60 tur) NIE jest tu wykonany -- patrz raport r5
 * (NIE_ZMIERZONO) -- brak w repo haka headless do startu nowej gry z N AI i kontrolą seeda.
 *
 * FLAGA: `WAR_RULES_MULTIWAR_ENABLED` w `src/game/war-rules-multiwar.ts` jest stałą.
 * Tryb OFF buduje się przez tymczasową podmianę tej jednej linii (przywracana w `finally`,
 * sprawdzana bit-w-bit). Bundle idą do katalogu tymczasowego poza repo (os.tmpdir()).
 *
 * Użycie (z katalogu gra/): node tools/war-rules-multiwar-live-test.cjs [tury=46]
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const TURNS = parseInt(process.argv[2] || '46', 10);
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP_ROOT = path.join(os.tmpdir(), `war-rules-live-${RUN_ID}`);
const FLAG_FILE = path.join(GRA_DIR, 'src', 'game', 'war-rules-multiwar.ts');
const FLAG_ON_LINE = 'export const WAR_RULES_MULTIWAR_ENABLED = true;';
const FLAG_OFF_LINE = 'export const WAR_RULES_MULTIWAR_ENABLED = false;';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MAX_OWNER_ID = 7;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Buduje bundle z aktualnym `WAR_RULES_MULTIWAR_ENABLED` do katalogu tymczasowego. */
function buildBundle(flagOn) {
  const original = fs.readFileSync(FLAG_FILE, 'utf8');
  const onLineCount = original.split(FLAG_ON_LINE).length - 1;
  if (onLineCount !== 1) throw new Error('flaga: oczekiwano 1 linii ON, jest ' + onLineCount);
  const outDir = path.join(TMP_ROOT, flagOn ? 'on' : 'off');
  try {
    if (!flagOn) fs.writeFileSync(FLAG_FILE, original.replace(FLAG_ON_LINE, FLAG_OFF_LINE));
    execSync(
      `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
      { cwd: GRA_DIR, stdio: 'pipe' },
    );
  } finally {
    fs.writeFileSync(FLAG_FILE, original);
  }
  if (fs.readFileSync(FLAG_FILE, 'utf8') !== original) throw new Error('przywracanie flagi nie powiodło się');
  if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error('build bez index.html: ' + outDir);
  return outDir;
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

/** Realny endTurn z odsunięciem jednostek gracza (jak w forced-war-player-target-live-test.cjs). */
async function advanceTurnSettled(page) {
  await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    const [turnNow, inProg] = await page.evaluate(() => [
      window.__eraTestDebug.getWorldState().turn,
      window.__eraTestDebug.isEndTurnInProgress(),
    ]);
    if (turnNow > before && !inProg) return { settled: true, ms: Date.now() - t0 };
    await page.evaluate(() => {
      const btn = document.querySelector('.pb-overlay [data-act="auto"]');
      if (btn) btn.click();
    });
    await wait(200);
  }
  return { settled: false, ms: Date.now() - t0 };
}

/** Liczba par wojny (status 'wojna') między właścicielami 0..MAX_OWNER_ID oraz maks. wojen na właściciela. */
async function warSnapshot(page) {
  return page.evaluate((maxId) => {
    const pairs = [];
    const perOwner = {};
    for (let a = 0; a <= maxId; a++) {
      for (let b = a + 1; b <= maxId; b++) {
        if (window.__eraTestDebug.getRelationStatus(a, b) === 'wojna') {
          pairs.push([a, b]);
          perOwner[a] = (perOwner[a] || 0) + 1;
          perOwner[b] = (perOwner[b] || 0) + 1;
        }
      }
    }
    return { wars: pairs.length, maxWarsPerOwner: Math.max(0, ...Object.values(perOwner)), pairs };
  }, MAX_OWNER_ID);
}

async function runMode(chromium, label, outDir) {
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  const perTurn = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));
    await page.goto('file://' + path.join(outDir, 'index.html') + '?playtest=mapa', { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
    await page.waitForFunction(
      () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0,
      undefined,
      { timeout: 120000 },
    );
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    // Stan STARTOWY (przed pierwszym endTurn): wojny obecne już w starcie sandboksa są liczone osobno.
    const startSnap = await warSnapshot(page);
    for (let i = 0; i < TURNS; i++) {
      const turnBefore = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
      const r = await advanceTurnSettled(page);
      const snap = await warSnapshot(page);
      perTurn.push({ turnBefore, settled: r.settled, ms: r.ms, wars: snap.wars, maxWarsPerOwner: snap.maxWarsPerOwner, pairs: snap.pairs });
      if (!r.settled) break;
    }
    const finalTurn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    await page.close();
    const summary = {
      mode: label,
      warsAtStart: startSnap.wars,
      startPairs: startSnap.pairs,
      turnsRequested: TURNS,
      turnsSettled: perTurn.filter(t => t.settled).length,
      finalTurn,
      // Wojny NOWE (nieobecne w stanie startowym sandboksa) przed turą 40 -- wymóg R1.
      newWarsBeforeTurn40Max: Math.max(0, ...perTurn.filter(t => t.turnBefore < 40).map(t => t.pairs.filter(p => !startSnap.pairs.some(sp => sp[0] === p[0] && sp[1] === p[1])).length)),
      warsBeforeTurn40Max: Math.max(0, ...perTurn.filter(t => t.turnBefore < 40).map(t => t.wars)),
      warsAtEnd: perTurn.length ? perTurn[perTurn.length - 1].wars : null,
      maxWarsPerOwnerOverRun: Math.max(0, ...perTurn.map(t => t.maxWarsPerOwner)),
      avgTurnMs: perTurn.length ? Math.round(perTurn.reduce((s, t) => s + t.ms, 0) / perTurn.length) : null,
      // console.error emitowane przez silnik (np. "[Wojna wymuszona] DECISION_REQUIRED ...") są
      // RAPOWANE, nie blokują: to istniejący log wyboru pary, nie wyjątek JS.
      consoleErrors: consoleErrors.filter(t => !t.startsWith('[pageerror]')).length,
      pageErrors: consoleErrors.filter(t => t.startsWith('[pageerror]')).length,
      consoleErrorSample: [...new Set(consoleErrors)].slice(0, 5).map(t => String(t).slice(0, 200)),
    };
    return { summary, perTurn, startSnap };
  } finally {
    await browser.close();
  }
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('playwright nie znaleziony (uruchom z gra/).');
    process.exit(1);
  }
  fs.mkdirSync(TMP_ROOT, { recursive: true });
  const results = {};
  try {
    console.log('-- budowa ON i OFF (tymczasowa podmiana jednej linii flagi, przywracana) --');
    const onDir = buildBundle(true);
    const offDir = buildBundle(false);
    console.log('-- przebieg ON --');
    results.on = await runMode(chromium, 'ON', onDir);
    console.log('-- przebieg OFF --');
    results.off = await runMode(chromium, 'OFF', offDir);
  } finally {
    try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }
  }
  const outFile = process.env.WAR_LIVE_OUT;
  if (outFile) fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  for (const k of ['on', 'off']) {
    const s = results[k].summary;
    console.log(JSON.stringify(s));
    assert(`${s.mode}: tury rozegrane (${s.turnsSettled}/${s.turnsRequested}, finalTurn=${s.finalTurn})`, s.turnsSettled === s.turnsRequested, s);
    assert(`${s.mode}: zero pageerror (wyjątek JS nieprzechwycony)`, s.pageErrors === 0, s);
    console.log(`  INFO ${s.mode}: console.error (log silnika, raportowany) = ${s.consoleErrors}`);
  }
  const onT = results.on.summary.avgTurnMs;
  const offT = results.off.summary.avgTurnMs;
  assert(`czas tury ON <= 1,15 x OFF (ON=${onT} ms, OFF=${offT} ms)`, onT !== null && offT !== null && onT <= offT * 1.15, { onT, offT });
  assert('R1 na żywo: przed turą 40 brak NOWYCH wojen w wariancie ON (stan startowy sandboksa pomijany)', results.on.summary.newWarsBeforeTurn40Max === 0, results.on.summary);
  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[war-rules-multiwar-live-test] błąd:', e);
  try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
