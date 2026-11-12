'use strict';
/**
 * diplomacy-relation-deal-text-consistent-live-test.cjs — R-WEB-UI-DIPLO-RELATION-DEAL-TEXT-CONSISTENT-Q1.
 *
 * DOWOD W ZYWEJ GRZE (headless Chromium, zbudowany bundle vite, `?playtest=mapa&civTest=1`):
 *   1. AI sklada graczowi propozycje wymiany przez REALNY endTurn (jak w ai-trade-wiring-e2e-live-test.cjs),
 *   2. REALNE okno dyplomacji (klik karty HUD „Dyplomacja”): przycisk „Przyjmij” AKTYWNY,
 *   3. wiersz „Wpływ Relacji na deal” NIE zawiera „musisz dać więcej” (werdykt „Możesz przyjąć” jest prawdziwy),
 *   4. zrzut ekranu okna zapisany do AITW_EVIDENCE (jesli ustawione) do obejrzenia.
 * Kierunek gracz→AI w zywej grze NIE jest tu sprawdzany (brak hooka do wystawienia oferty gracza);
 * jego zachowanie pokrywa test wyswietlania diplomacy-relation-deal-text-consistent-test.cjs (wariant 'own').
 *
 * Srodowisko: bundle budowany `vite build --outDir <poza repo>` (ZAKAZ `npm run dev`/`build` w gra/).
 * Usage (z gra/):  BUNDLE_DIR=<abs> node tools/diplomacy-relation-deal-text-consistent-live-test.cjs
 *   SKIP_BUILD=1 pomija budowe (wymaga istniejacego BUNDLE_DIR/index.html); DRTC_EVIDENCE=<abs dir> zrzuty.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR || path.join(os.tmpdir(), 'drtc-live-dist');
const EVIDENCE_DIR = process.env.DRTC_EVIDENCE || '';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const GIVE = 'cegla';
const RECV = 'zelazo';
const BIG = 400;
const REL_TEXT_BAD = 'musisz dać więcej';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK   ${label}`); } else {
    fail++; console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const ev = (page, fn, arg) => page.evaluate(fn, arg);
const state = page => ev(page, () => window.__aiTradeWiringTestDebug.state());

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  console.log(`[drtc] build vite -> ${BUNDLE}`);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(BUNDLE)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

async function shot(page, name) {
  if (!EVIDENCE_DIR) return;
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name) });
  console.log(`  [shot] ${path.join(EVIDENCE_DIR, name)}`);
}

async function endTurnWait(page) {
  const t0 = (await state(page)).turn;
  await ev(page, () => window.__aiTradeWiringTestDebug.endTurn());
  await page.waitForFunction(
    t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(),
    t0, { timeout: 60000 },
  );
  await wait(150);
}

/** Klik karty HUD „Dyplomacja” (jak gracz) i odczyt okna. */
async function openAudienceFromHud(page) {
  const clicked = await ev(page, () => {
    const e = Array.from(document.querySelectorAll('.sp-event[data-id]')).find(x => /Dyplomacja/.test(x.textContent || ''));
    if (!e) return false;
    e.click();
    return true;
  });
  if (!clicked) return { clicked: false, buttons: [], text: '', relRows: [] };
  await page.waitForSelector('button[data-negot-act="accept-package"]', { timeout: 15000 }).catch(() => {});
  await wait(500);
  return ev(page, () => ({
    clicked: true,
    buttons: Array.from(document.querySelectorAll('button[data-negot-act]')).map(b => ({
      act: b.getAttribute('data-negot-act'), text: (b.textContent || '').trim(), disabled: b.disabled, visible: !!(b.offsetWidth || b.offsetHeight),
    })),
    text: (document.body.innerText || ''),
    relRows: Array.from(document.querySelectorAll('.da-pn-rel-mod')).map(e => ({ cls: e.className, text: (e.textContent || '').trim() })),
  }));
}

async function closeAudience(page) {
  await ev(page, () => {
    const b = Array.from(document.querySelectorAll('button')).find(x => /^Wr[oó][cć]$/i.test((x.textContent || '').trim()));
    if (b) b.click();
  });
  await wait(300);
}

async function setupScenario(page, info) {
  await ev(page, ([ai]) => {
    const st = window.__civTest.state();
    const aiCity = st.cities.find(c => c.ownerId === ai);
    const myCity = st.cities.find(c => c.ownerId === 0);
    const aiBuilt = window.__civTest.adminState(aiCity.id).built;
    const myBuilt = window.__civTest.adminState(myCity.id).built;
    window.__civTest.adminSetup(aiCity.id, [...new Set([...aiBuilt, 'cegielnia'])], null, null, null);
    window.__civTest.adminSetup(myCity.id, [...new Set([...myBuilt, 'odlewnia_zelaza'])], null, null, null);
  }, [info.ai]);
  await ev(page, ([ai, keys, give, recv, big]) => {
    const h = window.__aiTradeWiringTestDebug;
    h.prepare(ai);
    for (const k of keys) { h.setStock(ai, k, 0); h.setStock(0, k, 0); }
    h.setStock(ai, give, big);
    h.setStock(0, recv, big);
  }, [info.ai, info.pricedKeys, GIVE, RECV, BIG]);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) {
    console.error('[drtc] playwright nie znaleziony (uruchom z gra/).'); process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));
    await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () => !!window.__aiTradeWiringTestDebug && !!window.__civTest && !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0,
      undefined, { timeout: 180000 },
    );
    await ev(page, () => window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest());
    const info = await ev(page, () => window.__aiTradeWiringTestDebug.info());
    assert('zalozenie pierwszego miasta gracza', await ev(page, () => window.__aiTradeWiringTestDebug.foundFirstCity()));
    const info2 = await ev(page, () => window.__aiTradeWiringTestDebug.info());
    const ai = info2.ai;
    await setupScenario(page, info2);
    const prep = await ev(page, a => window.__aiTradeWiringTestDebug.prepare(a), ai);
    assert('setup: kontakt, nie-wojna', !!prep.contact && prep.status !== 'wojna', prep);

    const s0 = await state(page);
    assert('start: brak propozycji na stole', s0.pending.length === 0, s0);
    await endTurnWait(page);
    const s1 = await state(page);
    assert('REALNY endTurn: AI zlozyla propozycje graczowi (stol)',
      s1.pending.length === 1 && s1.pending[0].proposer === ai && s1.pending[0].responder === 0, s1);
    if (s1.pending.length !== 1) throw new Error('brak propozycji AI po endTurn');

    const ui = await openAudienceFromHud(page);
    assert('okno dyplomacji (klik karty HUD): otwarte', ui.clicked && ui.buttons.some(b => b.act === 'accept-package'), ui.buttons);
    const accBtn = ui.buttons.find(b => b.act === 'accept-package');
    assert('przycisk „Przyjmij” AKTYWNY', !!accBtn && accBtn.disabled === false, ui.buttons);
    assert('werdykt „Możesz przyjąć” widoczny w oknie', /Możesz przyjąć/.test(ui.text), ui.text.slice(0, 400));
    assert('wiersz Relacji w oknie istnieje', ui.relRows.length >= 1, ui.relRows);
    const rowsBad = ui.relRows.filter(r => r.text.includes(REL_TEXT_BAD));
    assert('wiersz „Wpływ Relacji na deal” NIE mowi „musisz dać więcej” przy aktywnym „Przyjmij”', rowsBad.length === 0, ui.relRows);
    console.log('  [info] wiersze Relacji:', JSON.stringify(ui.relRows));
    await shot(page, 'drtc-01-okno-przyjmij-aktywne.png');
    await closeAudience(page);

    const realErrors = consoleErrors.filter(e => !/favicon|Failed to load resource/i.test(e));
    assert('zero console.error / pageerror', realErrors.length === 0, realErrors.slice(0, 3));
  } finally {
    await browser.close();
  }
  console.log(`\ndiplomacy-relation-deal-text-consistent-live-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[drtc] blad:', err && err.stack ? err.stack : err);
  process.exit(1);
});
