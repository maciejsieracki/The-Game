'use strict';
/**
 * diplomacy-city-cession-live-test.cjs — R-WEB-PEACE-CITY-CESSION-Q1 r4 (zarzut 2 i 3 Evaluatora).
 *
 * Realny headless Chromium na prawdziwym bundle Vite (?playtest=mapa), zbudowanym do katalogu
 * tymczasowego poza repo (bez `npm run build`). Sprawdza przeniesienie WŁASNOŚCI miasta przez REALNĄ
 * ścieżkę gry: aiCommandToPendingProposal → resolvePlayerAcceptsAiPending → applyProposalOutcome →
 * executePnDealTransfer → transferBasketItems → transferCityByTreaty → finalizePeaceTreatyBetween.
 * Hak `window.__cityCessionTestDebug.acceptAiCommandForTest` podaje WYŁĄCZNIE komendę AI i odczytuje
 * stan; nie liczy wartości ani kierunku przekazania.
 *
 *  T1. AI oddaje swoje niestołeczne miasto w pokoju (oferuj_miasto_za_pokoj):
 *      miasto → gracz (owner 0), status pary → 'pokoj', miasto w liście gracza.
 *  T2. AI żąda miasta gracza (zada_miasto_za_pokoj, kontroferta):
 *      miasto gracza → AI (owner 2), status → 'pokoj'. Kierunek: receiveItems = miasto gracza.
 *  T3. Nieudana cesja (AI próbuje oddać STOLICĘ — zakaz): pokój NIE zawarty, właściciel bez zmian,
 *      status nadal 'wojna', komunikat „Pokój nie zawarty — …" (zarzut 3: brak cichego pokoju).
 *  C.  Zero pageerror / console.error w całym scenariuszu.
 *
 * Zrzuty: <evidenceDir>/cession-T*.png
 * Usage (z gra/): node tools/diplomacy-city-cession-live-test.cjs [scratchDirAbs] [evidenceDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-city-cession-live-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-PEACE-CITY-CESSION-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const PLAYER = 0;
// AI 1 = jedyny realny AI z miastem w `?playtest=mapa` (AI 2 nie ma miast — patrz tabela świata).
const AI = 1;

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
  console.log('[city-cession-live] vite build do katalogu tymczasowego:', SCRATCH);
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
    () => !!window.__peaceRulesTestDebug && !!window.__cityCessionTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

/** Wybiera miasto właściciela `owner` niebędące stolicą (zwraca { id, pn } albo null). */
async function pickNonCapitalCity(page, owner) {
  return page.evaluate((o) => {
    const h = window.__cityCessionTestDebug;
    const cap = h.capitalOf(o);
    const ids = h.ownerCityIds(o).filter(id => id !== cap);
    if (ids.length === 0) return null;
    return { id: ids[0], pn: h.cityPnOf(ids[0]), owners: h.ownerCityIds(o).length };
  }, owner);
}

/**
 * SETUP (nie temat testu): zakłada `extra` dodatkowych miast właściciela realnym wzorcem
 * zakładania miasta. Stolicę ustawia jawnie na pierwsze (oryginalne) miasto właściciela.
 */
async function setupCities(page, owner, extra) {
  const first = await page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o)[0] ?? null, owner);
  if (!first) throw new Error('setupCities: właściciel ' + owner + ' nie ma miasta');
  await page.evaluate(([o, cid]) => window.__cityCessionTestDebug.setCapitalForTest(o, cid), [owner, first]);
  for (let i = 0; i < extra; i++) {
    const id = await page.evaluate((o) => window.__cityCessionTestDebug.foundExtraCityForTest(o), owner);
    if (!id) throw new Error('setupCities: nie udało się założyć miasta dla ' + owner);
  }
  console.log('      setup właściciel ' + owner + ':', JSON.stringify(await ownershipTable(page)));
}

/** Diagnostyka: liczba miast i stolica każdego właściciela w świecie playtest. */
async function ownershipTable(page) {
  return page.evaluate(() => {
    const h = window.__cityCessionTestDebug;
    const out = {};
    for (const o of [0, 1, 2, 3, 4, 5, 6, 7, 8]) out[o] = { cities: h.ownerCityIds(o), cap: h.capitalOf(o) };
    return out;
  });
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[city-cession-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  const consoleWarns = [];
  async function openFresh() {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push('console.error: ' + m.text());
      if (m.type() === 'warning' || m.type() === 'log') consoleWarns.push(m.text());
    });
    await gotoPlaytestMapa(page);
    console.log('      świat (właściciel → miasta, stolica):', JSON.stringify(await ownershipTable(page)));
    return page;
  }

  try {
    // ---- T1: AI oddaje miasto → gracz ----
    {
      const page = await openFresh();
      await page.evaluate((ai) => window.__peaceRulesTestDebug.setPlayerWarWithAi(ai, 10), AI);
      // SETUP: AI ma 3 miasta (stolica = oryginalne), żeby cesja niestołecznego nie była ostatnią.
      await setupCities(page, AI, 2);
      const city = await pickNonCapitalCity(page, AI);
      assert('T1: świat ma niestołeczne miasto AI', !!city, city);
      if (city) {
        const aiCountBefore = await page.evaluate((ai) => window.__cityCessionTestDebug.ownerCityIds(ai).length, AI);
        const res = await page.evaluate(([ai, cityId, pn]) => window.__cityCessionTestDebug.acceptAiCommandForTest(ai, {
          type: 'oferuj_miasto_za_pokoj', targetId: '0', powod: 'test T1', cityId, cityPn: pn, cityWeight: 1.5,
        }), [AI, city.id, city.pn]);
        await wait(300);
        const after = await page.evaluate(([cityId, ai]) => ({
          owner: window.__cityCessionTestDebug.cityOwner(cityId),
          status: window.__peaceRulesTestDebug.getStatus(ai),
          playerCities: window.__cityCessionTestDebug.ownerCityIds(0),
          aiCount: window.__cityCessionTestDebug.ownerCityIds(ai).length,
        }), [city.id, AI]);
        console.log('      T1 wynik:', JSON.stringify({ res, after, aiCountBefore, pn: city.pn }));
        assert('T1: komenda AI skonwertowana i zaakceptowana', res.converted && res.accepted, res);
        assert('T1: własność miasta przeszła AI → gracz', after.owner === PLAYER, after);
        assert('T1: miasto na liście miast gracza', after.playerCities.includes(city.id), after);
        assert('T1: AI straciło dokładnie jedno miasto', after.aiCount === aiCountBefore - 1, { before: aiCountBefore, after: after.aiCount });
        assert('T1: status pary po pokoju = pokoj', after.status === 'pokoj', after.status);
        await page.screenshot({ path: path.join(EVIDENCE, 'cession-T1-ai-oddaje-miasto.png') });
      }
      await page.close();
    }

    // ---- T2: AI żąda miasta gracza (kontroferta) ----
    {
      const page = await openFresh();
      await page.evaluate((ai) => window.__peaceRulesTestDebug.setPlayerWarWithAi(ai, 25), AI);
      // SETUP: gracz ma 2 miasta (stolica = city0) — drugie jest niestołeczne i można je zażądać.
      await setupCities(page, PLAYER, 1);
      const city = await pickNonCapitalCity(page, PLAYER);
      assert('T2: gracz ma niestołeczne miasto', !!city, city);
      if (city) {
        const res = await page.evaluate(([ai, cityId, pn]) => window.__cityCessionTestDebug.acceptAiCommandForTest(ai, {
          type: 'zada_miasto_za_pokoj', targetId: '0', powod: 'test T2', cityId, cityPn: pn,
        }), [AI, city.id, city.pn]);
        await wait(300);
        const after = await page.evaluate(([cityId, ai]) => ({
          owner: window.__cityCessionTestDebug.cityOwner(cityId),
          status: window.__peaceRulesTestDebug.getStatus(ai),
        }), [city.id, AI]);
        console.log('      T2 wynik:', JSON.stringify({ res, after, pn: city.pn }));
        assert('T2: komenda AI skonwertowana i zaakceptowana', res.converted && res.accepted, res);
        assert('T2: własność miasta gracza przeszła do AI (kierunek receiveItems)', after.owner === AI, after);
        assert('T2: status pary po pokoju = pokoj', after.status === 'pokoj', after.status);
        await page.screenshot({ path: path.join(EVIDENCE, 'cession-T2-ai-zada-miasta.png') });
      }
      await page.close();
    }

    // ---- T3: nieudana cesja (stolica AI) → brak pokoju, brak przelewu ----
    {
      const page = await openFresh();
      await page.evaluate((ai) => window.__peaceRulesTestDebug.setPlayerWarWithAi(ai, 10), AI);
      await setupCities(page, AI, 1);
      const cap = await page.evaluate((ai) => window.__cityCessionTestDebug.capitalOf(ai), AI);
      assert('T3: AI ma stolicę', !!cap, cap);
      if (cap) {
        const before = await page.evaluate(([ai, cityId]) => ({
          owner: window.__cityCessionTestDebug.cityOwner(cityId),
          count: window.__cityCessionTestDebug.ownerCityIds(ai).length,
        }), [AI, cap]);
        consoleWarns.length = 0;
        const pn = await page.evaluate((cityId) => window.__cityCessionTestDebug.cityPnOf(cityId), cap);
        const res = await page.evaluate(([ai, cityId, p]) => window.__cityCessionTestDebug.acceptAiCommandForTest(ai, {
          type: 'oferuj_miasto_za_pokoj', targetId: '0', powod: 'test T3 (stolica)', cityId, cityPn: p, cityWeight: 1.5,
        }), [AI, cap, pn]);
        await wait(300);
        const hint = await page.evaluate(() => {
          const t = document.getElementById('civ-hint-toast');
          return t ? (t.textContent || '') : '';
        });
        const after = await page.evaluate(([ai, cityId]) => ({
          owner: window.__cityCessionTestDebug.cityOwner(cityId),
          count: window.__cityCessionTestDebug.ownerCityIds(ai).length,
          status: window.__peaceRulesTestDebug.getStatus(ai),
        }), [AI, cap]);
        const warnedBlock = consoleWarns.some(w => w.includes('pokój odrzucony') && w.includes('Stolicy'));
        console.log('      T3 wynik:', JSON.stringify({ res, before, after, hint, warnedBlock }));
        assert('T3: komenda AI skonwertowana, akceptacja gracza przeszła do obsługi', res.converted, res);
        assert('T3: stolica nie zmieniła właściciela', after.owner === AI && before.owner === AI, { before, after });
        assert('T3: AI nie straciło miast', after.count === before.count, { before, after });
        assert('T3: pokój NIE zawarty (status nadal wojna)', after.status !== 'pokoj', after.status);
        assert('T3: komunikat „Pokój nie zawarty” w toaście lub logu', hint.includes('Pokój nie zawarty') || warnedBlock, { hint, warnedBlock });
        await page.screenshot({ path: path.join(EVIDENCE, 'cession-T3-odmowa-stolica.png') });
      }
      await page.close();
    }

    assert('C: zero pageerror / console.error w scenariuszu', errors.length === 0, errors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log(`city-cession-live-test: ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('[city-cession-live] błąd:', e);
  process.exit(1);
});
