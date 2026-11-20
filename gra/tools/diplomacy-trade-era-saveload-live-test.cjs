'use strict';
/**
 * R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r3 — zapis/wczytanie epoki handlu i starych ofert (REALNY zapis gry).
 *
 * Realny headless Chromium + bundle Vite zbudowany POZA repo; zapis = persistSaveToSlot
 * (buildSaveGameSnapshot + saveToLocal, IndexedDB), odczyt = loadGameFromSlot w NOWEJ sesji przeglądarki
 * (trwały profil, jak diplo-truce-saveload-live-test.cjs). Fazy = osobne procesy:
 *   save — ustawia epokę gracza Żelazo (3), AI Kamień (1) => epoka umowy 3 (blok 100); wstawia do stołu i
 *          skrzynki oferty o ilościach SPRZED bloków (250 i 25); zapis do slotu.
 *   load — NOWA sesja: epoka handlu celowo rozjechana (1), wczytanie slotu => epoka handlu = 3 (z zapisu),
 *          epoka umowy = 3, oferta na stole 250 -> 200 (floor do bloku), oferta w skrzynce 25 -> 100 (min. 1 blok),
 *          oferty NIE zniknęły.
 * Mutacje (bundle z usuniętym obcinaniem / usuniętą synchronizacją epoki przy wczytaniu) => faza load CZERWONA.
 *
 * Usage (z gra/): node tools/diplomacy-trade-era-saveload-live-test.cjs <scratchAbs>
 *   <scratchAbs>/b = bundle (budowany, gdy brak), PHASES=save,load zawęża zestaw, BUNDLE_DIR nadpisuje bundle.
 */
const path = require('path');
const { resolveChromePath } = require('./_chrome-path.cjs');
const fs = require('fs');
const os = require('os');
const assert = require('node:assert/strict');
const { execSync, spawnSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-era-saveload');
const BUNDLE = process.env.BUNDLE_DIR || path.join(SCRATCH, 'b');
const PROFILE = path.join(SCRATCH, 'profile');
const STATE_FILE = path.join(SCRATCH, 'state.json');
const OUT_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const PLAYER = 0;
let AI = 1; // wyznaczany w fazie save (AI w pokoju z graczem)
const SLOT = 'trade-era-roundtrip';
const QTY_NEG = 250;   // stara oferta na stole (nie wielokrotność 100) -> 200
const QTY_INBOX = 25;  // stara oferta w skrzynce (< 1 bloku) -> 100 (min. 1 blok)
const PHASE_LIMIT_MS = Number(process.env.PHASE_LIMIT_MS) || 300000;

const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); console.log('  OK  ' + name); }
  catch (e) { results.push({ name, ok: false }); console.log('  FAIL ' + name + ' -- ' + e.message.split('\n')[0]); }
}

function buildIfNeeded() {
  if (fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(BUNDLE)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 400000 });
}

async function launchContext(chromium) {
  const opts = {
    headless: true, viewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  };
  // R-WEB-TEST-DEBT-Q12 (pozycja 8): najpierw wspolny wybor binarki (CHROME_PATH -> /usr/bin/google-chrome -> ...),
  // potem domyslna z Playwright, na koncu FALLBACK_CHROME.
  const chosen = resolveChromePath();
  if (chosen) return await chromium.launchPersistentContext(PROFILE, { ...opts, executablePath: chosen });
  try { return await chromium.launchPersistentContext(PROFILE, opts); }
  catch (e) { return await chromium.launchPersistentContext(PROFILE, { ...opts, executablePath: FALLBACK_CHROME }); }
}

async function openGame(ctx, errors) {
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(
    () => !!window.__tradeEraSaveLoadTestDebug && !!window.__eraTestDebug && !!window.__truceTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0,
    undefined, { timeout: 200000 },
  );
  await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
  return page;
}

const H = (page, fn, arg) => page.evaluate(fn, arg);

async function phaseSave(page) {
  AI = await H(page, () => window.__tradeEraSaveLoadTestDebug.pickPeacefulAiOwner());
  console.log('[save] AI w pokoju z graczem: owner', AI);
  check('save: znaleziono AI w pokoju z graczem', () => assert.ok(AI != null && AI > 0));
  const set1 = await H(page, ([p, e]) => window.__tradeEraSaveLoadTestDebug.setEraForTest(p, e), [PLAYER, 3]);
  const set2 = await H(page, ([a, e]) => window.__tradeEraSaveLoadTestDebug.setEraForTest(a, e), [AI, 1]);
  console.log('[save] epoki:', JSON.stringify(set1), JSON.stringify(set2));
  const st = await H(page, (a) => window.__tradeEraSaveLoadTestDebug.state(a), AI);
  console.log('[save] stan:', JSON.stringify(st));
  check('save: gracz Żelazo, AI Kamień, epoka umowy = 3 (wyższa z dwóch stron)', () => {
    assert.equal(st.playerEra, 3); assert.equal(st.aiEra, 1); assert.equal(st.dealEra, 3); assert.equal(st.tradeEra, 3);
  });
  await H(page, ([a, n, i]) => window.__tradeEraSaveLoadTestDebug.injectLegacyTradeOffers(a, n, i), [AI, QTY_NEG, QTY_INBOX]);
  const before = await H(page, () => window.__tradeEraSaveLoadTestDebug.dumpTradeOffers());
  console.log('[save] oferty przed zapisem:', JSON.stringify(before));
  check('save: stare oferty wstawione (250 na stole, 25 w skrzynce)', () => {
    assert.equal(before.negotiation.length, 1); assert.equal(before.negotiation[0].give[0][1], QTY_NEG);
    assert.equal(before.inbox.length, 1); assert.equal(before.inbox[0].pakiety, QTY_INBOX);
  });
  const ok = await H(page, (s) => window.__tradeEraSaveLoadTestDebug.quickSave(s), SLOT);
  check('save: realny zapis do slotu', () => assert.equal(ok, true));
  fs.writeFileSync(STATE_FILE, JSON.stringify({ st, ai: AI }));
}

async function phaseLoad(page) {
  const B = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  AI = B.ai;
  // Nowa sesja: epoka handlu celowo rozjechana (stara wartość 1) — wczytanie MUSI ją ustawić z zapisu.
  await H(page, () => window.__tradeEraSaveLoadTestDebug.resetTradeEraTo(1));
  const pre = await H(page, (a) => window.__tradeEraSaveLoadTestDebug.state(a), AI);
  console.log('[load] przed wczytaniem:', JSON.stringify(pre));
  console.log('[load] slot:', JSON.stringify(await H(page, (s) => window.__tradeEraSaveLoadTestDebug.peekSlot(s), SLOT)));
  await H(page, (s) => window.__tradeEraSaveLoadTestDebug.loadSlot(s), SLOT);
  console.log('[load] kontakty po wczytaniu:', JSON.stringify(await H(page, (s) => window.__tradeEraSaveLoadTestDebug.peekSlot(s), SLOT)));
  await page.waitForFunction(() => !window.__eraTestDebug.isEndTurnInProgress(), undefined, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  const st = await H(page, (a) => window.__tradeEraSaveLoadTestDebug.state(a), AI);
  const after = await H(page, () => window.__tradeEraSaveLoadTestDebug.dumpTradeOffers());
  console.log('[load] po wczytaniu:', JSON.stringify(st), JSON.stringify(after));
  check('load: epoka gracza z zapisu = 3', () => assert.equal(st.playerEra, B.st.playerEra));
  check('load: epoka handlu ustawiona z zapisu (3), a nie 1 sprzed wczytania', () => assert.equal(st.tradeEra, 3));
  check('load: epoka umowy (gracz Żelazo + AI Kamień) = 3', () => assert.equal(st.dealEra, 3));
  check('load: oferta na stole NIE zniknęła', () => assert.equal(after.negotiation.length, 1));
  check('load: oferta na stole 250 -> 200 (floor do bloku 100), obie strony', () => {
    assert.deepEqual(after.negotiation[0].give, [['drewno', 200]]);
    assert.deepEqual(after.negotiation[0].receive, [['kamien', 200]]);
  });
  check('load: oferta w skrzynce NIE zniknęła', () => assert.equal(after.inbox.length, 1));
  check('load: oferta w skrzynce 25 -> 100 (min. 1 blok)', () => assert.equal(after.inbox[0].pakiety, 100));
}

const PHASES = { save: phaseSave, load: phaseLoad };

async function runPhase(name) {
  buildIfNeeded();
  const { chromium } = require('playwright');
  const errors = [];
  let ctx = null;
  let exitCode = 1;
  const guard = setTimeout(() => { console.log(`[${name}] PRZEKROCZONY LIMIT`); process.exit(2); }, PHASE_LIMIT_MS);
  try {
    ctx = await launchContext(chromium);
    const page = await openGame(ctx, errors);
    await PHASES[name](page);
    check(`${name}: zero pageerror`, () => assert.equal(errors.length, 0, errors.slice(0, 3).join(' | ')));
    const failed = results.filter(r => !r.ok);
    console.log(`[${name}] wynik: ${results.length - failed.length} pass / ${failed.length} fail`);
    exitCode = failed.length === 0 ? 0 : 1;
  } catch (e) {
    console.log(`[${name}] WYJATEK: ` + (e && e.message ? e.message.split('\n')[0] : e));
  } finally {
    clearTimeout(guard);
    if (ctx) await ctx.close().catch(() => {});
  }
  process.exit(exitCode);
}

function runAll() {
  const list = (process.env.PHASES || 'save,load').split(',');
  fs.mkdirSync(SCRATCH, { recursive: true });
  if (list[0] === 'save') { fs.rmSync(PROFILE, { recursive: true, force: true }); fs.rmSync(STATE_FILE, { force: true }); }
  buildIfNeeded();
  let bad = 0;
  for (const ph of list) {
    const r = spawnSync(process.execPath, [__filename, SCRATCH],
      { env: { ...process.env, PHASE: ph }, stdio: 'inherit', timeout: PHASE_LIMIT_MS + 15000 });
    console.log(`[saveload] FAZA ${ph}: exit=${r.status}`);
    if (r.status !== 0) { bad++; break; }
  }
  console.log(`[saveload] ${bad === 0 ? 'PASS' : 'FAIL'} (fazy: ${list.join(',')})`);
  process.exit(bad === 0 ? 0 : 1);
}

const PHASE = process.env.PHASE || 'all';
if (PHASE === 'all') runAll();
else if (PHASES[PHASE]) runPhase(PHASE).catch((e) => { console.error(e); process.exit(1); });
else { console.error('Nieznana faza: ' + PHASE); process.exit(1); }
