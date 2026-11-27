'use strict';
/**
 * ai-rebel-verify-news-live.cjs -- R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (AIREBELVER), runda 3: pozycje 3, 4, 5 na MAKSIMUM.
 * Fazy (kazda faza = osobne wywolanie Node, bo jedno wywolanie Bash ma limit 590 s):
 *  --phase first  : nowa gra na maksimum (__settingsLive.startNewGame); AI z DOKLADNIE 2 miastami (wybor zalezny od ziarna)
 *                   dostaje kontakt (__dyploMapaOdkrycieTestDebug.prepareContact -> widoczny dla gracza), jedno jego miasto
 *                   dostaje wymuszony bunt (__rebelNotifyTestDebug.forceRevoltEligible; miasto NIE jest ostatnim, wiec bez ochrony).
 *                   Potem --turns N prawdziwych endTurn. Na koniec: odczyt listy "Wydarzenia na swiecie" z DOM okna dyplomacji,
 *                   zrzut ekranu, ZAPIS gry (__truceTestDebug.saveForTest) do slotu.
 *  --phase resume : WCZYTANIE gry z slotu (__truceTestDebug.loadForTest); lista z DOM przed zapisem i po wczytaniu musi byc identyczna
 *                   (round-trip, poz. 3); potem kolejne --turns N endTurn; zapis do slotu.
 * Wyniki dopisywane do JSON (--out): tury, liczba buntow miast AI (przyrost wlasciciela -99 = frakcja buntu), liczba wpisow
 * "Bunt miasta" (klasa .dl-wn-rebelia) na liscie, liczba wpisow widocznych graczowi (wszystkie wpisy na liscie DOM).
 * Uzycie: node tools/ai-rebel-verify-news-live.cjs --dist <abs> --seed N --phase first|resume --turns K --slot S --out <abs.json> [--shot <abs.png>]
 */
const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist', '');
const SEED = parseInt(arg('seed', '4242'), 10);
const PHASE = arg('phase', 'first');
const TURNS = parseInt(arg('turns', '6'), 10);
const SLOT = arg('slot', 'airebel-news-s' + SEED);
const OUT = arg('out', '');
const SHOT = arg('shot', '');
const CEL = arg('cel', 'miasto'); // miasto (pierwsze miasto AI) | stolica (stolica AI, poz. 2)
if (!['miasto', 'stolica'].includes(CEL)) throw new Error('--cel: miasto|stolica');
const TRYB = arg('tryb', 'wymuszony'); // wymuszony (1 miasto AI z buntem wymuszonym) | naturalny (bez wymuszenia, kontakt z wszystkimi AI)
if (!['wymuszony', 'naturalny'].includes(TRYB)) throw new Error('--tryb: wymuszony|naturalny');
if (!['first', 'resume'].includes(PHASE)) throw new Error('--phase: first|resume');
if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('--dist: brak index.html');
if (!OUT) throw new Error('--out wymagane');
const URL_GAME = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PROG = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data', 'society-params.json'), 'utf8')).porzadek.porzadek_prog_bunt_skrajny_pct.hard;
const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Maksimum ustawien (jak w ai-rebel-verify-max-live.cjs).
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brazu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Standardowy', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty',
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
    cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};

async function endTurnSettle(page, timeoutMs = 240000) {
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    const now = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (!inProg && now > before) return true;
    await wait(150);
  }
  return false;
}

// Odczyt listy "Wydarzenia na swiecie" z DOM (okno dyplomacji otwarte hakiem __aggressorTestDebug.openPanel).
// Lista cywilizacji (diploListHud, filtr „all”) otwierana przyciskiem paska: .tb[data-act="diplo"] (klik przelacza,
// wiec klikamy dopoki nie pojawi sie wskazowka „Kliknij cywilizację” z listy „all”).
async function readWorldNews(page) {
  for (let i = 0; i < 3; i += 1) {
    const open = await page.evaluate(() => Array.from(document.querySelectorAll('.dl-hint')).some(h => (h.textContent || '').includes('Kliknij cywilizację')));
    if (open) break;
    await page.evaluate(() => { const b = document.querySelector('.tb[data-act="diplo"]'); if (b) b.click(); });
    await wait(500);
  }
  return page.evaluate(() => {
    const sec = document.querySelector('.dl-world-news');
    if (!sec) return { sekcja: false, wpisy: [], rebelia: 0 };
    const rows = Array.from(sec.querySelectorAll('.dl-world-news-row'));
    return {
      sekcja: true,
      wpisy: rows.map((r) => (r.querySelector('.dl-wn-title') || {}).textContent + ' | ' + (r.querySelector('.dl-wn-sub') || {}).textContent),
      rebelia: rows.filter((r) => r.classList.contains('dl-wn-rebelia')).length,
    };
  });
}

async function main() {
  const { chromium } = require('playwright');
  // Staly profil przegladarki (localStorage/IndexedDB): zapis z fazy first jest widoczny w fazie resume (osobny proces).
  const PROFILE = path.join(path.dirname(OUT), 'profil-' + path.basename(OUT, '.json'));
  if (PHASE === 'first') fs.rmSync(PROFILE, { recursive: true, force: true });
  const browser = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const errors = [];
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { seed: SEED, faza: [] };
  const faza = { faza: PHASE, turnsRequested: TURNS, slot: SLOT, rows: [] };
  try {
    const page = browser.pages()[0] || await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.setViewportSize({ width: 1600, height: 1000 });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto(URL_GAME, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__settingsLive && !!window.__rebelNotifyTestDebug && !!window.__eraTestDebug && !!window.__rebelProtectionTestDebug && !!window.__truceTestDebug && !!window.__aggressorTestDebug && !!window.__dyploMapaOdkrycieTestDebug, null, { timeout: 180000 });

    let ownerId;
    let cityId;
    if (PHASE === 'first') {
      await page.evaluate((p) => window.__settingsLive.startNewGame(p), Object.assign({ seed: SEED }, MAX_PARAMS));
      await page.waitForFunction(() => { try { return window.__eraTestDebug.getWorldState().turn >= 1; } catch (_) { return false; } }, null, { timeout: 240000 });
      await page.waitForFunction(() => {
        const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
        return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
      }, null, { timeout: 600000, polling: 500 });
      const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
      if (!founded) throw new Error('foundFirstCity=false');
      await page.waitForFunction(() => { try { return window.__rebelProtectionTestDebug.pickTwoAiOwners() !== null; } catch (_) { return false; } }, null, { timeout: 240000, polling: 500 });
      await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
      await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
      faza.settings = await page.evaluate(() => window.__settingsLive.getSettings());
      const t1 = await page.evaluate((p) => window.__aiEconomyMeasure.cityStateTurn(p).map((x) => [x.owner, x.miasta]), PROG);
      const dwa = t1.filter(([o, m]) => o > 0 && o !== -99 && m === 2).map(([o]) => o);
      if (dwa.length === 0) throw new Error('brak AI z 2 miastami w t1 (seed ' + SEED + ')');
      ownerId = dwa[SEED % dwa.length];
      faza.kandydaciDwaMiasta = dwa;
      // Kontakt: wpis o buncie powstaje tylko dla wlasciciela znanego graczowi (getDiplomaticContacts).
      await page.evaluate((o) => window.__dyploMapaOdkrycieTestDebug.prepareContact(o), ownerId);
      if (TRYB === 'wymuszony') {
        // CEL=stolica: bunt wymuszony na STOLICY wlasciciela (odczyt przez __cityCessionTestDebug.capitalOf, poz. 2).
        cityId = CEL === 'stolica'
          ? await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), ownerId)
          : await page.evaluate((o) => window.__rebelProtectionTestDebug.getCityIdForOwner(o), ownerId);
        if (!cityId) throw new Error('brak miasta celu dla owner ' + ownerId);
        const forced = await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), cityId);
        faza.wymuszenie = { ownerId, cityId, forced, cel: CEL, stolicaPrzed: await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), ownerId), miastaWlascicielaPrzed: await page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o).length, ownerId) };
      } else {
        // Bieg naturalny: bez wymuszenia; kontakt z KAZDYM wlascicielem AI (wpisy widoczne dla gracza, zob. getDiplomaticContacts).
        for (const o of t1.filter(([oo, m]) => oo > 0 && m >= 1).map(([oo]) => oo)) {
          await page.evaluate((oo) => window.__dyploMapaOdkrycieTestDebug.prepareContact(oo), o);
        }
        faza.wymuszenie = { ownerId: null, cityId: null, tryb: 'naturalny' };
      }
      faza.rebelCountStart = await page.evaluate((p) => { const r = window.__aiEconomyMeasure.cityStateTurn(p).find(x => x.owner === -99); return r ? r.miasta : 0; }, PROG);
    } else {
      // Wczytanie (round-trip) i odczyt listy PO wczytaniu; lista PRZED zapisem jest w poprzedniej fazie.
      const prev = out.faza[out.faza.length - 1];
      ownerId = prev.wymuszenie.ownerId;
      cityId = prev.wymuszenie.cityId;
      const turnPrzed = prev.turnEnd;
      await page.evaluate((s) => window.__truceTestDebug.loadForTest(s), SLOT).catch((e) => errors.push('loadForTest: ' + e.message));
      let turnNow = null;
      for (let k = 0; k < 480; k += 1) {
        turnNow = await page.evaluate(() => { try { return window.__eraTestDebug.getWorldState().turn; } catch (_) { return null; } });
        if (turnNow === turnPrzed) break;
        await wait(500);
      }
      if (turnNow !== turnPrzed) throw new Error('po wczytaniu tura=' + turnNow + ' (oczekiwano ' + turnPrzed + ') errors=' + JSON.stringify(errors.slice(0, 3)));
      for (let k = 0; k < 20; k += 1) {
        try { await closeCivWelcome(page, 8); break; } catch (_) { /* kolejny ekran: ponow */ }
      }
      faza.turnLoaded = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
      faza.listaPoWczytaniu = await readWorldNews(page);
      faza.listaPrzedZapisem = prev.listaPrzedZapisem;
      faza.roundTripListaIdentyczna = JSON.stringify(faza.listaPrzedZapisem.wpisy) === JSON.stringify(faza.listaPoWczytaniu.wpisy);
    }

    const cityRows = [];
    for (let t = 1; t <= TURNS; t++) {
      // Kontakt z wieloma cywilizacjami otwiera kolejne ekrany powitalne (jeden po drugim): zamykamy, az ich nie bedzie.
      for (let k = 0; k < 20; k += 1) {
        try { await closeCivWelcome(page, 8); break; } catch (_) { /* kolejny ekran: ponow */ }
      }
      await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
      await prepareEndTurnGate(page).catch(() => null);
      const settled = await endTurnSettle(page);
      if (!settled) {
        // Diagnostyka: co blokuje zakonczenie tury (widoczne nakladki / modale, stan endTurn).
        const diag = await page.evaluate(() => {
          const vis = Array.from(document.querySelectorAll('[class*="modal"],[class*="overlay"],[id*="welcome"],[id*="modal"]'))
            .filter(el => el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
            .slice(0, 12).map(el => (el.id || '') + '.' + (el.className && el.className.baseVal === undefined ? el.className : ''));
          let inProg = null; let turn = null;
          try { inProg = window.__eraTestDebug.isEndTurnInProgress(); turn = window.__eraTestDebug.getWorldState().turn; } catch (_) {}
          return { nakladki: vis, inProg, turn };
        });
        faza.rows.push({ tura: t, nieSettled: true, diag });
        break;
      }
      const turn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
      const rebelCities = await page.evaluate((p) => { const r = window.__aiEconomyMeasure.cityStateTurn(p).find(x => x.owner === -99); return r ? r.miasta : 0; }, PROG);
      if (cityId) {
        const st = await page.evaluate((c) => window.__rebelNotifyTestDebug.getCityState(c), cityId);
        const stolica = await page.evaluate((o) => ({ stolica: window.__cityCessionTestDebug.capitalOf(o), miasta: window.__cityCessionTestDebug.ownerCityIds(o).length }), ownerId);
        faza.rows.push({ tura: turn, ownerId: st.ownerId, rebelState: st.rebelState, miastaFrakcjiBuntu: rebelCities, wlasciciel: stolica });
      } else {
        faza.rows.push({ tura: turn, miastaFrakcjiBuntu: rebelCities });
      }
      cityRows.push(turn);
    }
    faza.turnEnd = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    faza.listaPrzedZapisem = await readWorldNews(page);
    if (SHOT) await page.screenshot({ path: SHOT, fullPage: false });
    faza.zapisOk = await page.evaluate((s) => window.__truceTestDebug.saveForTest(s), SLOT);
    faza.errors = errors.slice(0, 5);
    out.faza.push(faza);
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
    console.log('PREFIX=AIREBELVER-NEWS ' + JSON.stringify({ seed: SEED, faza: PHASE, turnEnd: faza.turnEnd, zapisOk: faza.zapisOk, listaPrzedZapisem: faza.listaPrzedZapisem, roundTrip: faza.roundTripListaIdentyczna, listaPoWczytaniu: faza.listaPoWczytaniu, rows: faza.rows, errors: faza.errors }));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
