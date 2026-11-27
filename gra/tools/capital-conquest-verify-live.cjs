'use strict';
// capital-conquest-verify-live.cjs -- R-WEB-CAPITAL-CONQUEST-VERIFY-Q1 (CAPCONQ): zywy pomiar po FALI 931.
// Maksymalne ustawienia nowej gry (Trudny, Wysoki x4, kultura trudny, dyplomacja trudna, wzrost ON), seed z --seed.
// P1  plunder: skarbiec zdobywanej faktycznej stolicy ustawiony na znana wartosc PRZED przejeciem (setTreasury);
//     oczekiwane (wzor capital-capture.ts Zdarzenie 1): zwyciezca +skarbiec, ofiara = 0.
// S2  zbuntowana stolica wraca do pierwotnego wlasciciela (siegeSurrender(cap, owner)) -> efektywna stolica i wpis.
// S5  round-trip zapisu (__detHarness.snapshotJson/restoreJson) po buncie i po przejeciu: wpis stolicy i skarbce.
// P4  eliminacja: ostatnie miasto bedace faktyczna stolica zdobyte -> wpisy, skarbce, zwyciezca, bledy konsoli.
// Uzycie (z gra/, build poza repo): node tools/capital-conquest-verify-live.cjs --dist <abs katalog z index.html> --seed 4242
const path = require('path');
const fs = require('fs');
const GRA = path.resolve(__dirname, '..');
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; }
const DIST = arg('dist', '');
const SEED = parseInt(arg('seed', '4242'), 10);
const URL_GAME = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PROG = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'society-params.json'), 'utf8')).porzadek.porzadek_prog_bunt_skrajny_pct.hard;
const { closeCivWelcome } = require(path.join(GRA, 'tools', '_live-ready.cjs'));
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
const TREASURY_SET = 777;   // znana dodatnia wartosc skarbca zdobywanej stolicy (P1)
const TREASURY_ELIM = 333;  // znana dodatnia wartosc skarbca ofiary eliminacji (P4)
// Asercje (CAPCONQ-R2): kazda niezgodnosc trafia do FAILS -> proces konczy sie kodem 2 (nie 0).
const FAILS = [];
function check(cond, msg) { if (!cond) FAILS.push(msg); }

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const out = { seed: SEED, measures: {}, errors };
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200)); });
    await page.goto(URL_GAME, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__settingsLive && !!window.__rebelNotifyTestDebug && !!window.__eraTestDebug && !!window.__rebelProtectionTestDebug && !!window.__capRebelReadTestDebug && !!window.__cityCessionTestDebug && !!window.__ledgerRealPathDebug && !!window.__detHarness, null, { timeout: 240000, polling: 500 });
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
    void closeCivWelcome;

    const t1 = await page.evaluate((p) => window.__aiEconomyMeasure.cityStateTurn(p).map((x) => x.owner), PROG);
    const owners = [...new Set(t1)].filter((o) => o > 0).slice(0, 2);
    if (owners.length < 2) throw new Error('za malo AI owners: ' + owners.length);
    for (const o of owners) {
      let n = await page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o).length, o);
      let guard = 0;
      while (n < 4 && guard++ < 6) {
        await page.evaluate((o) => window.__cityCessionTestDebug.foundExtraCityForTest(o), o);
        n = await page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o).length, o);
      }
    }
    const state = (o) => page.evaluate((o) => {
      const cc = window.__cityCessionTestDebug; const cap = window.__capRebelReadTestDebug;
      return { cap: cc.capitalOf(o), explicit: cap.explicitCapitalOf(o), tOwner: cap.treasuryOf(o), tPlayer: cap.treasuryOf(0), cities: cc.ownerCityIds(o).length, playerCities: cc.ownerCityIds(0).length };
    }, o);

    // ---- P1 + S2: owners[0]. Skarbiec faktycznej stolicy = TREASURY_SET; bunt; S2 (powrot do pierwotnego); przejecie.
    {
      const o = owners[0];
      const cap1 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate(({ o, c }) => window.__cityCessionTestDebug.setCapitalForTest(o, c), { o, c: cap1 });
      await page.evaluate(({ o, v }) => window.__ledgerRealPathDebug.setTreasury(o, v), { o, v: TREASURY_SET });
      const pre = await state(o);
      await page.evaluate((c) => window.__ledgerRealPathDebug.rebel(c), cap1);
      const afterRebel = await state(o);
      // S2: zbuntowane miasto (cap1) wraca do pierwotnego wlasciciela
      const s2Ok = await page.evaluate(({ c, o }) => window.__ledgerRealPathDebug.siegeSurrender(c, o), { c: cap1, o }).catch((e) => 'ERR ' + e.message);
      const afterS2 = await state(o);
      const cityOwnerAfterS2 = await page.evaluate((c) => window.__cityCessionTestDebug.cityOwner(c), cap1);
      // przejecie faktycznej stolicy: nowa stolica po S2 (wpis lub fallback) -> bunt -> zdobycie przez gracza
      const cap2 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate((c) => window.__ledgerRealPathDebug.rebel(c), cap2);
      const cap3 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate(({ o, v }) => window.__ledgerRealPathDebug.setTreasury(o, v), { o, v: TREASURY_SET });
      const tOwnerBefore = await page.evaluate((o) => window.__capRebelReadTestDebug.treasuryOf(o), o);
      const tPlayerBefore = await page.evaluate(() => window.__capRebelReadTestDebug.treasuryOf(0));
      const okSiege = await page.evaluate(({ c }) => window.__ledgerRealPathDebug.siegeSurrender(c, 0), { c: cap3 });
      const tOwnerAfter = await page.evaluate((o) => window.__capRebelReadTestDebug.treasuryOf(o), o);
      const tPlayerAfter = await page.evaluate(() => window.__capRebelReadTestDebug.treasuryOf(0));
      out.measures.P1 = { owner: o, cap1, cap2, cap3, pre, afterRebel,
        treasuryOwnerBefore: tOwnerBefore, treasuryPlayerBefore: tPlayerBefore, treasuryOwnerAfter: tOwnerAfter, treasuryPlayerAfter: tPlayerAfter,
        oczekiwanyPrzychod: tOwnerBefore, zmierzonyPrzychod: tPlayerAfter - tPlayerBefore, okSiege, ustawionaWartosc: TREASURY_SET };
      out.measures.S2 = { owner: o, cap1, s2Ok, cityOwnerAfterS2, capitalOfAfterS2: afterS2.cap, explicitAfterS2: afterS2.explicit, expectedCapital: cap1 };
      // Asercje P1 (oczekiwanie = skarbiec ustawiony znana wartoscia, wzor Zdarzenia 1: caly skarbiec -> zwyciezca, ofiara 0)
      check(tOwnerBefore === TREASURY_SET, 'P1: skarbiec ofiary przed przejeciem != ' + TREASURY_SET + ' (ustawienie nieudane)');
      check(out.measures.P1.zmierzonyPrzychod === TREASURY_SET, 'P1: przychod zdobywcy ' + out.measures.P1.zmierzonyPrzychod + ' != oczekiwany ' + TREASURY_SET);
      check(tOwnerAfter === 0, 'P1: skarbiec ofiary po przejeciu != 0');
      check(okSiege === true, 'P1: przejecie nie zwrocilo true');
      // Asercje S2 (odzyskanie przez pierwotnego wlasciciela po buncie)
      check(s2Ok === true, 'S2: siegeSurrender do pierwotnego wlasciciela nie zwrocil true');
      check(cityOwnerAfterS2 === o, 'S2: miasto po odzyskaniu nalezy do ' + cityOwnerAfterS2 + ', oczekiwano ' + o);
      check(afterS2.explicit === cap1 && afterS2.cap === cap1, 'S2: wpis/efektywna stolica != miasto sprzed buntu');
      // 2b: przejete przez gracza (cap3) -> pierwotny wlasciciel odbija; pomiar (bez asercji wzoru; zamierzenie do potwierdzenia)
      const s2bOk = await page.evaluate(({ c, o }) => window.__ledgerRealPathDebug.siegeSurrender(c, o), { c: cap3, o }).catch((e) => 'ERR ' + e.message);
      const s2bOwner = await page.evaluate((c) => window.__cityCessionTestDebug.cityOwner(c), cap3);
      out.measures.S2b = { owner: o, cap3, s2bOk, cityOwnerAfter2b: s2bOwner, stateAfter2b: await state(o) };
      check(s2bOk === true && s2bOwner === o, 'S2b: odbicie miasta zdobytego przez gracza: wlasciciel ' + s2bOwner + ', oczekiwano ' + o);
    }

    // ---- S5: round-trip zapisu po buncie i po przejeciu (owners[1])
    {
      const o = owners[1];
      const cap1 = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate(({ o, c }) => window.__cityCessionTestDebug.setCapitalForTest(o, c), { o, c: cap1 });
      await page.evaluate(({ o, v }) => window.__ledgerRealPathDebug.setTreasury(o, v), { o, v: 555 });
      await page.evaluate((c) => window.__ledgerRealPathDebug.rebel(c), cap1);
      const capB = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      const beforeA = await state(o);
      const snapA = await page.evaluate(() => window.__detHarness.snapshotJson());
      await page.evaluate((s) => window.__detHarness.restoreJson(s), snapA);
      const afterA = await state(o);
      const keyA = (s) => JSON.stringify([s.explicit, s.cap, s.tOwner, s.tPlayer]);
      await page.evaluate((c) => window.__ledgerRealPathDebug.siegeSurrender(c, 0), capB);
      const beforeB = await state(o);
      const snapB = await page.evaluate(() => window.__detHarness.snapshotJson());
      await page.evaluate((s) => window.__detHarness.restoreJson(s), snapB);
      const afterB = await state(o);
      out.measures.S5 = { owner: o, capB, poBuncie: { przed: keyA(beforeA), po: keyA(afterA), rowne: keyA(beforeA) === keyA(afterA) },
        poPrzejeciu: { przed: keyA(beforeB), po: keyA(afterB), rowne: keyA(beforeB) === keyA(afterB) } };
      check(out.measures.S5.poBuncie.rowne, 'S5: round-trip po buncie rozni sie: ' + JSON.stringify(out.measures.S5.poBuncie));
      check(out.measures.S5.poPrzejeciu.rowne, 'S5: round-trip po przejeciu rozni sie: ' + JSON.stringify(out.measures.S5.poPrzejeciu));
    }

    // ---- P4: eliminacja. owners[0] traci miasta (bunt) az do 1; ostatnie = faktyczna stolica -> zdobycie.
    {
      const o = owners[0];
      let guard = 0;
      while ((await page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o).length, o)) > 1 && guard++ < 8) {
        const c = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
        await page.evaluate((c) => window.__ledgerRealPathDebug.rebel(c), c);
      }
      const last = await page.evaluate((o) => window.__cityCessionTestDebug.ownerCityIds(o), o);
      const capL = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), o);
      await page.evaluate(({ o, v }) => window.__ledgerRealPathDebug.setTreasury(o, v), { o, v: TREASURY_ELIM });
      const tOwnerBefore = await page.evaluate((o) => window.__capRebelReadTestDebug.treasuryOf(o), o);
      const tPlayerBefore = await page.evaluate(() => window.__capRebelReadTestDebug.treasuryOf(0));
      // Surowce (stock) przed/po: POMIAR BEZ ASERCJI wzoru Zdarzenia 2 (zob. raport: NIE ZMIERZONO wzor)
      const stockOwnerBefore = await page.evaluate((o) => window.__ledgerRealPathDebug.stock(o), o);
      const stockPlayerBefore = await page.evaluate(() => window.__ledgerRealPathDebug.stock(0));
      const okSiege = await page.evaluate(({ c }) => window.__ledgerRealPathDebug.siegeSurrender(c, 0), { c: capL });
      const after = await state(o);
      const tPlayerAfter = await page.evaluate(() => window.__capRebelReadTestDebug.treasuryOf(0));
      const stockOwnerAfter = await page.evaluate((o) => window.__ledgerRealPathDebug.stock(o), o);
      const stockPlayerAfter = await page.evaluate(() => window.__ledgerRealPathDebug.stock(0));
      const cityOwnerAfter = await page.evaluate((c) => window.__cityCessionTestDebug.cityOwner(c), capL);
      out.measures.P4 = { owner: o, lastCityIds: last, capL, okSiege, treasuryOwnerBefore: tOwnerBefore,
        zmierzonyPrzychod: tPlayerAfter - tPlayerBefore, after, cityOwnerAfter,
        stock: { ownerBefore: stockOwnerBefore, ownerAfter: stockOwnerAfter, playerBefore: stockPlayerBefore, playerAfter: stockPlayerAfter } };
      check(tOwnerBefore === TREASURY_ELIM, 'P4: skarbiec ofiary przed eliminacja != ' + TREASURY_ELIM);
      check(okSiege === true, 'P4: eliminacja nie zwrocila true');
      check(after.cap === null && after.explicit === null, 'P4: wpis stolicy eliminowanego nie zerowany (cap=' + after.cap + ', explicit=' + after.explicit + ')');
      check(after.cities === 0, 'P4: eliminowany nadal ma miasta: ' + after.cities);
      check(after.tOwner === 0, 'P4: skarbiec eliminowanego po != 0');
      check(out.measures.P4.zmierzonyPrzychod === TREASURY_ELIM, 'P4: przychod zwyciezcy ' + out.measures.P4.zmierzonyPrzychod + ' != ' + TREASURY_ELIM);
      check(cityOwnerAfter === 0, 'P4: ostatnie miasto nie przeszlo na gracza (wlasciciel ' + cityOwnerAfter + ')');
    }
    check(errors.length === 0, 'konsola: ' + errors.length + ' bledow (pageerror/console.error)');
    console.log('CAPCONQ ' + JSON.stringify(out));
    if (FAILS.length) { console.log('CAPCONQ-FAIL ' + JSON.stringify(FAILS)); process.exitCode = 2; }
    else console.log('CAPCONQ-PASS seed=' + SEED);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
