'use strict';
/**
 * diplo-live-verify-s2c-s3c.cjs — uzupełnienie R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1 (runda 3, zarzut FC 7).
 *
 * Pomiary w URUCHOMIONEJ grze (Chromium, bundle Vite zbudowany POZA repo) wyłącznie przez istniejące haki:
 *   - S2.c  kara za sąsiedztwo: `__borderEraPenaltyRuntimeTestDebug` (?civTest=1): fixtura granicy AI↔AI,
 *           siatka epok, `pairEvidence` (stawka = karaWspolnaGranicaDelta) i `applyProductionTick` (realny tyk).
 *   - S2.c  karencja: `__truceTestDebug` + `__peaceRulesTestDebug` na parze gracz↔AI: stawka przed/po
 *           rozejmie i po pokoju (stawka = wartość, którą tyk bierze pod uwagę po spełnieniu warunku granicy).
 *   - S3.c  hamulec zerowego Zaufania: `setCrisisCounter` ustawia licznik na N−2, dwie realne tury
 *           (`__eraTestDebug.endTurn`), odczyt licznika, statusu i Zaufania z DOM po każdej turze.
 *
 * Zero zmian kodu gry. Każdy scenariusz = jedna świeża strona; JSON trafia do evidence/.
 *   node tools/diplo-live-verify-s2c-s3c.cjs --scenario=2c
 *   node tools/diplo-live-verify-s2c-s3c.cjs --scenario=3c
 * Build (poza repo): CIV_LIVE_BUILD_DIR=<katalog> node ./node_modules/vite/bin/vite.js build --outDir <katalog> --emptyOutDir
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const BUILD_DIR = process.env.CIV_LIVE_BUILD_DIR || '/tmp/civ-live-verify';
const EVIDENCE = process.env.CIV_LIVE_EVIDENCE
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1', 'evidence');
const GAME_URL = 'file://' + path.join(BUILD_DIR, 'index.html') + '?playtest=mapa&civTest=1';
const PLAYER = 0;
const AI_PREF = 2;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[s2c-s3c]', ...a);
const arg = (name) => { const h = process.argv.find((a) => a.startsWith('--' + name + '=')); return h ? h.split('=')[1] : null; };

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  try {
    return await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium', args });
  } catch (e) {
    log('launch z /usr/bin/chromium nie wyszedl, probuje domyslnego:', e.message.slice(0, 120));
    return chromium.launch({ headless: true, args });
  }
}

async function openPage(browser, errors) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200)); });
  await page.goto(GAME_URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__borderEraPenaltyRuntimeTestDebug && !!window.__truceTestDebug && !!window.__peaceRulesTestDebug
      && !!window.__eraTestDebug && !!window.__audienceRelTestDebug && !!window.__dyploMapaOdkrycieTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 900000 },
  );
  await wait(300);
  return page;
}

/** Diagnostyka tury: czy tura trwa, widoczne okna/modale i komunikaty (tylko odczyt). */
async function diagEndTurn(page) {
  return page.evaluate(() => {
    const ws = window.__eraTestDebug.getWorldState();
    const vis = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const modals = Array.from(document.querySelectorAll('.modal, [role="dialog"], .civ-modal, .dlg, dialog'))
      .filter(vis).map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160));
    let toast = null;
    try { toast = window.__eraTestDebug.getToast ? window.__eraTestDebug.getToast() : null; } catch (e) { toast = 'err'; }
    return { turn: ws.turn, endTurnInProgress: window.__eraTestDebug.isEndTurnInProgress(), modals: modals.slice(0, 5), toast };
  });
}

/** Mała realna gra z 2 AI (ta sama ścieżka co diplomacy-border-era-penalty-live-test.cjs). Playtest mapa ma 1 AI bez miast. */
async function startTwoAiGame(page) {
  await page.waitForFunction(() => window.__aiBuildingsTestDebug, null, { timeout: 30000 });
  await page.evaluate(() => window.__aiBuildingsTestDebug.startNewGame({ rivals: '2', cityStates: 0, civTypes: 4, seed: 778899 }));
  await page.waitForFunction(() => window.__cityStateStartUnitsTestDebug
    && window.__cityStateStartUnitsTestDebug.dumpState().awaitingFirstPlayerCity === true
    && window.__cityStateStartUnitsTestDebug.dumpState().playerStartHex !== null
    && !document.querySelector('.civ-map-load-overlay'), null, { timeout: 180000 });
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await page.waitForFunction(() => {
    const st = window.__cityStateStartUnitsTestDebug?.dumpState();
    return st?.awaitingFirstPlayerCity === false && st.cities.some(c => c.ownerId === 0);
  }, null, { timeout: 120000 });
  await page.waitForFunction(() => window.__eraTestDebug.getWorldState().citiesLen > 0
    && window.__borderEraPenaltyRuntimeTestDebug.ownerIds().length >= 2, null, { timeout: 180000 });
  return page.evaluate(() => window.__borderEraPenaltyRuntimeTestDebug.ownerIds());
}

async function endTurnReal(page) {
  const t0 = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await page.waitForFunction(
    (t) => window.__eraTestDebug.getWorldState().turn === t + 1 && !window.__eraTestDebug.isEndTurnInProgress(),
    t0, { timeout: 180000 },
  ).catch(() => null);
  await wait(400);
  return page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
}

/** Zaufanie z DOM panelu dyplomacji (ten sam odczyt co diplo-live-verify-steps-1-4.cjs). */
async function readTrust(page, ai) {
  await page.evaluate((id) => window.__audienceRelTestDebug.openAudience(id), ai);
  await wait(450);
  const raw = await page.evaluate(() => {
    const el = document.querySelector('.da-rel-row.trust .v');
    return el ? (el.textContent || '').trim() : null;
  });
  await page.evaluate(() => window.__audienceRelTestDebug.closeAudience());
  await wait(200);
  if (raw == null) return null;
  const m = raw.replace('−', '-').match(/-?\d+/);
  return m ? Number(m[0]) : null;
}

function evidenceWrite(name, obj) {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const file = path.join(EVIDENCE, name);
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  log('zapisano', file);
}

// ---- S2.c: kara za sąsiedztwo (siatka epok, realny tyk) + karencja (rozejm / pokój) ----
async function s2c(browser) {
  const errors = [];
  const out = { scenario: '2c', started: new Date().toISOString(), epoki: [], karencja: {}, errors };
  const page = await openPage(browser, errors);
  let ids = await page.evaluate(() => window.__borderEraPenaltyRuntimeTestDebug.ownerIds());
  out.ownerIdsPrzedStartem = ids;
  if (ids.length < 2) ids = await startTwoAiGame(page);
  out.ownerIds = ids;
  // Parametry z JSON (oczekiwanie wg kodu): sharedBorderPenaltyForEpochs: max epoka >=3 → Żelazo, >=2 → Brąz, inaczej Kamień.
  const params = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data', 'diplomacy.json'), 'utf8'));
  const p = params.params || params;
  out.oczekiwanie = {
    kamien: p.ekspansjaGranica_zaufanie_perTura, braz: p.ekspansjaGranicaBraz_zaufanie_perTura,
    zelazo: p.ekspansjaGranicaZelazo_zaufanie_perTura,
    regula: 'max(epokaA,epokaB) >=3 → zelazo; >=2 → braz; inaczej kamien (diplomacy.ts:602-611)',
  };
  let pair = null;
  let setupError = '';
  for (let i = 0; i < ids.length && !pair; i++) for (let j = i + 1; j < ids.length && !pair; j++) {
    try {
      const s = await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.setupFixture(a, b), [ids[i], ids[j]]);
      if (s.sharedLandBorder && s.fixtureCityCountA > 2 && s.fixtureCityCountB > 2) pair = { a: ids[i], b: ids[j], setup: s };
    } catch (e) { setupError = e.message; }
  }
  out.fixtura = pair;
  if (!pair) {
    out.blokada = 'nie udalo sie zbudowac fixtury granicy: ' + setupError;
  } else {
    const { a, b } = pair;
    const grid = [[1, 1], [2, 2], [3, 3], [2, 3], [1, 3], [4, 4]];
    for (const [ea, eb] of grid) {
      const row = await page.evaluate(([a, b, ea, eb]) => {
        const h = window.__borderEraPenaltyRuntimeTestDebug;
        h.setOwnerEraForTest(a, ea); h.setOwnerEraForTest(b, eb);
        const ev = h.pairEvidence(a, b);
        const tick = h.applyProductionTick(a, b);
        return { setEra: [ea, eb], eraA: ev.eraA, eraB: ev.eraB, sharedLandBorder: ev.sharedLandBorder,
          stawka: ev.rate, previewDelta: ev.previewDelta, breakdownValue: ev.breakdownValue,
          tickDelta: tick.delta, zaufanieAfterTick: tick.afterTrust };
      }, [a, b, ea, eb]);
      out.epoki.push(row);
      log('epoki', JSON.stringify(row));
    }
  }
  // Karencja na parze gracz↔AI (stawka liczona przez buildDiplomacyTickCtxForPair; warunek granicy
  // nie jest spełniony dla gracza w tej fixturze, więc miarą jest wartość stawki, nie wpływ na tyk).
  const AI = ids.includes(AI_PREF) ? AI_PREF : (ids[0] ?? AI_PREF);
  out.karencja.ai = AI;
  const ev = (label) => page.evaluate(([p, ai, label]) => {
    const h = window.__borderEraPenaltyRuntimeTestDebug;
    const e = h.pairEvidence(p, ai);
    const st = window.__truceTestDebug.pairState(p, ai);
    return { label, stawka: e.rate, eraA: e.eraA, eraB: e.eraB, status: st.status, truceUntilTurn: st.truceUntilTurn,
      peaceUntilTurn: st.peaceUntilTurn, turn: st.turn };
  }, [PLAYER, AI, label]);
  out.karencja.start = await ev('start (stan po wczytaniu playtestu)');
  await page.evaluate((ai) => window.__peaceRulesTestDebug.setPlayerWarWithAi(ai, 6), AI);
  out.karencja.wojna = await ev('wojna (wymuszona, 6 tur)');
  out.karencja.akceptacjaRozejmu = await page.evaluate((ai) => window.__truceTestDebug.acceptTruceForTest(ai, 5), AI);
  out.karencja.rozejm = await ev('rozejm');
  await page.evaluate(([p, ai]) => window.__peaceRulesTestDebug.endWarByPeaceForTest(p, ai), [PLAYER, AI]);
  out.karencja.pokoj = await ev('pokoj');
  out.zakonczone = new Date().toISOString();
  out.errors = errors;
  log('karencja', JSON.stringify(out.karencja));
  evidenceWrite('S2c.json', out);
  await page.close();
}

// ---- S3.c: zaufanie 0 — licznik kryzysu N−2 → dwie realne tury (N−1 nie, N tak) ----
async function s3c(browser) {
  const errors = [];
  const out = { scenario: '3c', started: new Date().toISOString(), tury: [], errors };
  const page = await openPage(browser, errors);
  // Mapa playtest kończy grę zwycięstwem w pierwszym EOT; hak wyłącza tylko ten warunek (jak w steps-1-4).
  await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
  // Playtest mapa: AI bez miast nie wchodzi do licznika kryzysu (diploAiOwnersEligible: cityCount > 0) — start gry z 2 AI.
  const ids3 = await startTwoAiGame(page);
  await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
  out.ownerIds = ids3;
  const ai = ids3.includes(AI_PREF) ? AI_PREF : ids3[0];
  out.cityCountAi = await page.evaluate((id) => window.__peaceRulesTestDebug.getCityCountForOwner(id), ai);
  out.ai = ai;
  await page.evaluate((id) => window.__dyploMapaOdkrycieTestDebug.prepareContact(id, 0), ai);
  await page.evaluate((id) => window.__peaceRulesTestDebug.setRelationForBrake(id, 0, 0), ai);
  const brake = await page.evaluate((id) => window.__peaceRulesTestDebug.getBrakeParams(id), ai);
  out.brake = brake;
  const N = brake.n;
  const start = Math.max(0, N - 2);
  await page.evaluate(([id, c]) => window.__peaceRulesTestDebug.setCrisisCounter(id, c), [ai, start]);
  out.start = { counter: await page.evaluate((id) => window.__peaceRulesTestDebug.getCrisisCounter(id), ai),
    status: await page.evaluate((id) => window.__peaceRulesTestDebug.getStatus(id), ai),
    zaufanie: await readTrust(page, ai) };
  log('start', JSON.stringify(out.start), 'N=', N);
  for (let k = 1; k <= 2; k++) {
    // Zaufanie 0 ustawiane PRZED każdą turą (tick w tej turze musi widzieć 0; po poprzedniej turze drift dał +1).
    await page.evaluate((id) => window.__peaceRulesTestDebug.setRelationForBrake(id, 0, 0), ai);
    const zaufanieUstawione = await readTrust(page, ai);
    const diagPrzed = await diagEndTurn(page);
    const turn = await endTurnReal(page);
    const row = {
      krok: k, tura: turn, zaufanieUstawione, diagPrzed, diagPo: await diagEndTurn(page),
      licznik: await page.evaluate((id) => window.__peaceRulesTestDebug.getCrisisCounter(id), ai),
      status: await page.evaluate((id) => window.__peaceRulesTestDebug.getStatus(id), ai),
      zaufanie: await readTrust(page, ai),
      ostrzezenie: await page.evaluate(() => window.__peaceRulesTestDebug.warEventLogHas('Ryzyko wojny z')),
    };
    out.tury.push(row);
    log('tura', JSON.stringify(row));
  }
  out.N = N;
  out.oczekiwanie = { licznikPoTurze1: N - 1, licznikPoTurze2: N, wojnaNajwczesniejPoTurze2: true };
  out.zakonczone = new Date().toISOString();
  out.errors = errors;
  evidenceWrite('S3c.json', out);
  await page.close();
}

(async () => {
  const scen = arg('scenario');
  const browser = await launchBrowser(chromium);
  try {
    if (scen === '2c') await s2c(browser);
    else if (scen === '3c') await s3c(browser);
    else throw new Error('nieznany --scenario (2c | 3c)');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
