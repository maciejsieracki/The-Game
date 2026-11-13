'use strict';
/**
 * fort-vision-live.cjs — R-WEB-FORT-VISION-FOG-Q1 (runda 2, obrona): pomiar W ZYWEJ GRZE (Chromium, ?playtest=mapa),
 * przed/po poprawce. Wolany na gotowym bundlu (vite build do katalogu POZA repo, bez npm run build).
 * Haki (juz w main.ts): __fortTerritoryTestDebug (placeFort/ownerAt/placeUnitAt/sweepCaptures/setWar/landHexAtDistance),
 * __hotSeatTestDebug.snapshotVisibleState().exploredKeysForActive (odczyt zbioru odkrytych, bez efektow ubocznych).
 *   S1 — fort r=5 gracza poza odkrytym obszarem: ile pol kola odkrytych po przeliczeniu mgly (realny ruch jednostki -> refreshFog)
 *   S2 — fort OBCEGO wlasciciela w koncu poza odkrytym obszarem: ma zostac 0 odkrytych (nie odslania mapy)
 *   S3 — ZDOBYCIE fortu obcego przez gracza (sweepCaptures = realna sciezka main.ts: sweepFortCaptures -> refreshFog)
 *   S4 — UTRATA fortu S1 (wrogi oddzial wchodzi na fort): odkryte pola zostaja
 * Usage (z gra/): ROBOCZA_HTML=<bundle index.html> NODE_PATH=... node tools/fort-vision-live.cjs <etykieta> [json-out]
 */
const path = require('path');
const fs = require('fs');
const BUNDLE = process.env.ROBOCZA_HTML;
if (!BUNDLE) throw new Error('Ustaw ROBOCZA_HTML=<sciezka do index.html bundla>');
const label = process.argv[2] || 'run';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const out = { label, steps: {} };
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    await page.goto('file://' + BUNDLE + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__fortTerritoryTestDebug && window.__fortTerritoryTestDebug.state().citiesLen > 0 && window.__fortTerritoryTestDebug.state().turn === 1, undefined, { timeout: 180000 });
    await wait(800);
    const st = await page.evaluate(() => window.__fortTerritoryTestDebug.state());
    out.state = st;
    const T = (fn, ...args) => page.evaluate(([f, a]) => window.__fortTerritoryTestDebug[f](...a), [fn, args]);
    const explored = async () => new Set(await page.evaluate(() => window.__hotSeatTestDebug.snapshotVisibleState().exploredKeysForActive));
    const unexploredIn = async (hexes) => { const e = await explored(); return hexes.filter((h) => !e.has(h.q + ',' + h.r)).length; };
    const me = st.myOwnerId, foreign = st.foreignOwnerId;

    // realny ruch jednostki gracza o 1 heks w poblizu miasta -> startAnimatedMove -> refreshFog (przeliczenie mgly)
    const nudge = async () => {
      const id = await T('placeUnitAt', me, st.myCity.q, st.myCity.r, false);
      const nb = await T('landNeighbor', st.myCity.q, st.myCity.r);
      if (!id || !nb) return false;
      await T('moveStep', id, nb.q, nb.r);
      for (let i = 0; i < 100 && (await T('isAnimating')); i++) await wait(100);
      await wait(300);
      await T('removeUnit', id);
      return true;
    };

    // S1: fort gracza daleko od miasta
    const fortA = await T('landHexAtDistance', st.myCity.q, st.myCity.r, 20);
    const circleA = await T('hexesWithin', fortA.q, fortA.r, 5);
    const a0 = await unexploredIn(circleA);
    await T('placeFort', 'fort', fortA.q, fortA.r, me);
    const a1 = await unexploredIn(circleA); // hak placeFort nie przelicza mgly
    out.steps.S1 = { fort: fortA, kolo: circleA.length, nieodkryte_przed_budowa: a0, nieodkryte_po_placeFort_bez_przeliczenia: a1, nudgeOk: await nudge() };
    out.steps.S1.nieodkryte_po_przeliczeniu_mgly = await unexploredIn(circleA);
    out.steps.S1.exploredN = (await explored()).size;

    // S2: fort obcego, daleko od wszystkiego
    const fortB = await T('landHexAtDistance', st.myCity.q, st.myCity.r, 20, 1) || await T('landHexAtDistance', st.myCity.q, st.myCity.r, 21);
    const circleB = await T('hexesWithin', fortB.q, fortB.r, 5);
    const b0 = await unexploredIn(circleB);
    const aiVis0 = await page.evaluate((o) => window.__dyploMapaOdkrycieTestDebug.getOwnerVisibleKeysSize(o), foreign);
    await T('placeFort', 'fort', fortB.q, fortB.r, foreign);
    const aiVis1 = await page.evaluate((o) => window.__dyploMapaOdkrycieTestDebug.getOwnerVisibleKeysSize(o), foreign);
    await nudge();
    out.steps.S2 = { aiWidocznoscPrzed: aiVis0, aiWidocznoscPoForcie: aiVis1, fort: fortB, owner: foreign, kolo: circleB.length, nieodkryte_przed: b0, nieodkryte_po_przeliczeniu_mgly: await unexploredIn(circleB) };

    // S3: zdobycie fortu obcego (wojna + moja jednostka stoi na forcie -> sweepFortCaptures -> refreshFog w main.ts)
    await T('setWar', me, foreign);
    const capId = await T('placeUnitAt', me, fortB.q, fortB.r, false);
    const swept = await T('sweepCaptures');
    await wait(300);
    out.steps.S3 = { unitPlaced: !!capId, zdobyte: swept, wlascicielFortuPo: await T('fortOwner', fortB.q, fortB.r), nieodkryte_po_zdobyciu_bez_ruchu_jednostki: await unexploredIn(circleB) };

    // S4: utrata fortu A: wrogi oddzial wchodzi na fort A
    const e0 = await unexploredIn(circleA);
    await T('setWar', me, foreign);
    const enId = await T('placeUnitAt', foreign, fortA.q, fortA.r, false);
    const swept2 = await T('sweepCaptures');
    await nudge();
    out.steps.S4 = { unitPlaced: !!enId, przejete: swept2, wlascicielFortuA: await T('fortOwner', fortA.q, fortA.r), nieodkryte_A_przed_utrata: e0, nieodkryte_A_po_utracie: await unexploredIn(circleA) };
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = errors.slice(0, 10);
  if (process.argv[3]) fs.writeFileSync(path.resolve(process.argv[3]), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(2); });
