'use strict';
/**
 * diplomacy-relation-value-mismatch-live-test.cjs — R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1 (pomiar, bez zmian reguł).
 *
 * POMIAR W ZYWEJ GRZE (headless Chromium, zbudowany bundle vite, `?playtest=mapa&civTest=1`):
 *   1. AI sklada graczowi propozycje wymiany przez REALNY endTurn (jak w diplomacy-relation-deal-text-consistent-live-test.cjs),
 *   2. REALNE okno dyplomacji (klik karty HUD „Dyplomacja”),
 *   3. odczyt surowych tekstow: wiersz „Wpływ Relacji na deal” (.da-pn-rel-mod), linia „Relacja X / 200” (audiencja),
 *      linie Zaufanie / Respekt / status wojny widoczne w oknie,
 *   4. zrzut okna do DRVM_EVIDENCE (jesli ustawione) i JSON z liczbami do DRVM_RESULT (jesli ustawione).
 *
 * Test NIE asertuje rozstrzygniecia produktowego (ktora liczba jest „prawdziwa”) — tylko to, ze obie wartosci
 * sa widoczne w tym samym oknie dla tej samej pary i ze zapisane zostaly surowe teksty. Pass = pomiar wykonany.
 *
 * Srodowisko: bundle budowany `vite build --outDir <poza repo>` (ZAKAZ `npm run dev`/`build` w gra/).
 * Usage (z gra/):  BUNDLE_DIR=<abs> node tools/diplomacy-relation-value-mismatch-live-test.cjs
 *   SKIP_BUILD=1 pomija budowe; DRVM_EVIDENCE=<abs dir> zrzuty; DRVM_RESULT=<abs file> JSON.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR || path.join(os.tmpdir(), 'drvm-live-dist');
const EVIDENCE_DIR = process.env.DRVM_EVIDENCE || '';
const RESULT_FILE = process.env.DRVM_RESULT || '';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/usr/bin/chromium';
const GIVE = 'cegla';
const RECV = 'zelazo';
const BIG = 400;

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
  console.log(`[drvm] build vite -> ${BUNDLE}`);
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
  if (!clicked) return null;
  await page.waitForSelector('button[data-negot-act="accept-package"]', { timeout: 15000 }).catch(() => {});
  await wait(500);
  return ev(page, () => {
    const body = document.body.innerText || '';
    const lines = body.split('\n').map(s => s.trim()).filter(Boolean);
    const pick = re => lines.filter(l => re.test(l)).slice(0, 12);
    return {
      buttons: Array.from(document.querySelectorAll('button[data-negot-act]')).map(b => ({
        act: b.getAttribute('data-negot-act'), text: (b.textContent || '').trim(), disabled: b.disabled,
      })),
      relRowsRaw: Array.from(document.querySelectorAll('.da-pn-rel-mod')).map(e => (e.textContent || '').trim()),
      linieRelacja: pick(/Relacj/i),
      linieZaufanie: pick(/Zaufani/i),
      linieRespekt: pick(/Respekt/i),
      linieWojna: pick(/wojn|pokój|pokoj|rozejm|sojusz|NAP|pakt/i),
      linieMoc: pick(/Moc/i),
    };
  });
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
    console.error('[drvm] playwright nie znaleziony (uruchom z gra/).'); process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  const result = { measured: false };
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
    assert('zalozenie pierwszego miasta gracza', await ev(page, () => window.__aiTradeWiringTestDebug.foundFirstCity()));
    const info2 = await ev(page, () => window.__aiTradeWiringTestDebug.info());
    const ai = info2.ai;
    result.aiOwnerId = ai;
    await setupScenario(page, info2);
    const prep = await ev(page, a => window.__aiTradeWiringTestDebug.prepare(a), ai);
    result.statusPrzedEndTurn = prep.status;
    assert('setup: kontakt, nie-wojna', !!prep.contact && prep.status !== 'wojna', prep);

    await endTurnWait(page);
    const s1 = await state(page);
    assert('REALNY endTurn: AI zlozyla propozycje graczowi (stol)',
      s1.pending.length === 1 && s1.pending[0].proposer === ai && s1.pending[0].responder === 0, s1);
    if (s1.pending.length !== 1) throw new Error('brak propozycji AI po endTurn');

    const ui = await openAudienceFromHud(page);
    assert('okno dyplomacji (klik karty HUD): otwarte', !!ui && ui.buttons.some(b => b.act === 'accept-package'), ui && ui.buttons);
    if (!ui) throw new Error('brak okna dyplomacji');
    result.okno = ui;
    console.log('  [raw] wiersze .da-pn-rel-mod:', JSON.stringify(ui.relRowsRaw));
    console.log('  [raw] linie Relacja:', JSON.stringify(ui.linieRelacja));
    console.log('  [raw] linie Zaufanie:', JSON.stringify(ui.linieZaufanie));
    console.log('  [raw] linie Respekt:', JSON.stringify(ui.linieRespekt));
    console.log('  [raw] linie wojna/pokoj:', JSON.stringify(ui.linieWojna));
    const has116 = ui.relRowsRaw.some(t => /11,6/.test(t));
    const has90 = ui.linieRelacja.some(t => /90\s*\/\s*200/.test(t));
    assert('wiersz „Wpływ Relacji na deal” pokazuje wartosc z przecinkiem (zapisana)', ui.relRowsRaw.length >= 1, ui.relRowsRaw);
    assert('okno pokazuje tez „Relacja X / 200” (audiencja)', ui.linieRelacja.some(t => /\/\s*200/.test(t)), ui.linieRelacja);
    result.pokazuje11_6 = has116;
    result.pokazuje90_200 = has90;
    result.measured = true;
    await shot(page, 'drvm-01-okno-relacja.png');
    await closeAudience(page);

    const realErrors = consoleErrors.filter(e => !/favicon|Failed to load resource/i.test(e));
    assert('zero console.error / pageerror', realErrors.length === 0, realErrors.slice(0, 3));
    result.consoleErrors = realErrors.slice(0, 5);
  } finally {
    await browser.close();
    if (RESULT_FILE) {
      fs.mkdirSync(path.dirname(RESULT_FILE), { recursive: true });
      fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
    }
  }
  console.log(`\ndiplomacy-relation-value-mismatch-live-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[drvm] blad:', err && err.stack ? err.stack : err);
  process.exit(1);
});
