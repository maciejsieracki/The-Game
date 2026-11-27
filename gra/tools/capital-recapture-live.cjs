'use strict';
// capital-recapture-live.cjs -- R-WEB-CAPITAL-RECAPTURE-Q1 r2: zywy pomiar S1/S3/S4 (PRZED/PO poprawki).
// Maksymalne ustawienia nowej gry (Trudny, koszt jednostek wysoki, kultura trudny, dyplomacja trudna, wzrost ON).
// Scenariusz: stolica AI ustawiona jawnie (setCapitalForTest) -> bunt (ledgerRealPathDebug.rebel) -> [cesja w pokoju] -> zdobycie
// FAKTYCZNEJ stolicy przez siegeSurrender (prawdziwa sciezka runCapitalCapturePlunder). Odczyt: explicit (surowy wpis) po zdobyciu.
// Uzycie (z gra/, build poza repo): node tools/capital-recapture-live.cjs --dist <abs katalog z index.html> --seed 4242 --label PRE|PO
const path = require('path');
const fs = require('fs');
const GRA = path.resolve(__dirname, '..');
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; }
const DIST = arg('dist', '');
const SEED = parseInt(arg('seed', '4242'), 10);
const LABEL = arg('label', 'X');
const URL_GAME = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PROG = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'society-params.json'), 'utf8')).porzadek.porzadek_prog_bunt_skrajny_pct.hard;
const { closeCivWelcome } = require(path.join(GRA, 'tools', '_live-ready.cjs'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brazu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Standardowy', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty',
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    wzrostSurowcowZEpoka: true,
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
    cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const rows = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto(URL_GAME, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__settingsLive && !!window.__rebelNotifyTestDebug && !!window.__eraTestDebug && !!window.__rebelProtectionTestDebug && !!window.__capRebelReadTestDebug && !!window.__cityCessionTestDebug && !!window.__ledgerRealPathDebug, null, { timeout: 240000, polling: 500 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), Object.assign({ seed: SEED }, MAX_PARAMS));
    await page.waitForFunction(() => { try { return window.__eraTestDebug.getWorldState().turn >= 1; } catch (_) { return false; } }, null, { timeout: 240000 });
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, null, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    if (!founded) throw new Error('foundFirstCity=false');
    await page.waitForFunction(() => { try { return window.__rebelProtectionTestDebug.pickTwoAiOwners() !== null; } catch (_) { return false; } }, null, { timeout: 240000, polling: 500 });
    await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());

    // Trzy wlasciciele AI (kazdy dostaje do 4 miast = setup testu, tym samym wzorcem co foundExtraCityForTest).
    const t1 = await page.evaluate((p) => window.__aiEconomyMeasure.cityStateTurn(p).map((x) => x.owner), PROG);
    const owners = [...new Set(t1)].filter((o) => o > 0).slice(0, 3);
    if (owners.length < 3) throw new Error('za malo AI owners: ' + owners.length);
    const setup = {};
    for (const o of owners) {
      let n = await page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o).length, o);
      let guard = 0;
      while (n < 4 && guard++ < 6) {
        await page.evaluate((o) => window.__cityCessionTestDebug.foundExtraCityForTest(o), o);
        n = await page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o).length, o);
      }
      setup[o] = n;
    }
    const REBEL = await page.evaluate(() => window.__rebelProtectionTestDebug.REBEL_FACTION_OWNER_ID);
    const snap = (o) => page.evaluate(({ o }) => {
      const cc = window.__cityCessionTestDebug; const cap = window.__capRebelReadTestDebug;
      return { cap: cc.capitalOf(o), explicit: cap.explicitCapitalOf(o), tOwner: cap.treasuryOf(o), tPlayer: cap.treasuryOf(0), cities: cc.ownerCityIds(o).length };
    }, { o });
    const rec = async (scen, o, extra) => rows.push({ scen, owner: o, ...extra, ...(await snap(o)) });

    // ---- S1: stolica AI o zbuntowana -> zdobycie faktycznej stolicy przez gracza (siegeSurrender = prawdziwa sciezka)
    {
      const o = owners[0];
      const cap1 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate(({ o, c }) => window.__cityCessionTestDebug.setCapitalForTest(o, c), { o, c: cap1 });
      const pre = await snap(o);
      await page.evaluate((c) => window.__ledgerRealPathDebug.rebel(c), cap1);
      const afterRebel = await snap(o);
      const cap2 = afterRebel.cap;
      const okSiege = await page.evaluate((c) => window.__ledgerRealPathDebug.siegeSurrender(c, 0), cap2);
      const post = await snap(o);
      const owner2 = await page.evaluate((c) => window.__cityCessionTestDebug.cityOwner(c), cap2);
      rows.push({ scen: 'S1-AI', owner: o, setupMiast: setup[o], cap1, cap2, pre, afterRebel, post, ownerOfCap2AfterCapture: owner2, okSiege, ztrataEksplicit: post.explicit === cap1 });
    }
    // ---- S3: stolica AI zbuntowana, miasto oddane graczowi w pokoju -> zdobycie faktycznej stolicy AI
    {
      const o = owners[1];
      const cap1 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate(({ o, c }) => window.__cityCessionTestDebug.setCapitalForTest(o, c), { o, c: cap1 });
      const pre = await snap(o);
      await page.evaluate((c) => window.__ledgerRealPathDebug.rebel(c), cap1);
      const cession = await page.evaluate(({ c, r }) => window.__ledgerRealPathDebug.cession(c, r, 0), { c: cap1, r: REBEL }).catch((e) => 'ERR ' + e.message);
      const afterCession = await snap(o);
      const cap2 = afterCession.cap;
      const okSiege = await page.evaluate((c) => window.__ledgerRealPathDebug.siegeSurrender(c, 0), cap2);
      const post = await snap(o);
      rows.push({ scen: 'S3-cesja', owner: o, setupMiast: setup[o], cap1, cap2, cession, pre, afterCession, post, okSiege, ztrataEksplicit: post.explicit === cap1 });
    }
    // ---- S4: druga stolica zbuntowana, potem faktyczna stolica (cap3) zdobyta
    {
      const o = owners[2];
      const cap1 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate(({ o, c }) => window.__cityCessionTestDebug.setCapitalForTest(o, c), { o, c: cap1 });
      const pre = await snap(o);
      await page.evaluate((c) => window.__ledgerRealPathDebug.rebel(c), cap1);
      const cap2 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate((c) => window.__ledgerRealPathDebug.rebel(c), cap2);
      const cap3 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      const mid = await snap(o);
      const okSiege = await page.evaluate((c) => window.__ledgerRealPathDebug.siegeSurrender(c, 0), cap3);
      const post = await snap(o);
      rows.push({ scen: 'S4-dwa-bunty', owner: o, setupMiast: setup[o], cap1, cap2, cap3, pre, mid, post, okSiege, ztrataEksplicit: post.explicit === cap1 || post.explicit === cap2 });
    }
    void closeCivWelcome;
    console.log('CAPRECAP ' + JSON.stringify({ label: LABEL, seed: SEED, rows, errors: errors.slice(0, 6) }));
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
