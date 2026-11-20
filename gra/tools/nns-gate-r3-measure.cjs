'use strict';
/**
 * nns-gate-r3-measure.cjs — R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1, runda 3 (obrona r2 po zarzutach Evaluatora r2).
 * Bez zmian w gra/src. Używa istniejących haków civTest:
 *   __nnsMeasureDebug.startGame, __aiTradeWiringTestDebug (foundFirstCity, nnsDiag, grantPlayerGold/Food, quickSave, loadSlot),
 *   __cityCessionTestDebug.foundExtraCityForTest (zakłada kolejne miasto gracza realnym wzorcem foundCityAt+finalizeCityFounding).
 *
 * Tryby (argv[3]):
 *  play  — NOWA gra (seed), foundFirstCity, potem EXTRA × foundExtraCityForTest(ME). Pętla do tury --turns: odczyt bramki;
 *          gdy bramka blokuje: dosypka złota 200 + żywności 200 (interwencja harnessu, jak w r2, zapisana w `log`) -> endTurn.
 *          Na końcu: odczyt BEZ wczytania (ta sama sesja) + quickSave(slot).
 *  load  — NOWA strona w tym samym profilu: startGame (ten sam seed) -> loadSlot(slot) -> odczyt -> endTurn.
 *  chain — playtest=mapa (1 miasto preset): odczyt (t1) -> foundExtraCityForTest(ME) -> odczyt -> endTurn.
 *
 * Odczyt bramki = nnsDiag() dwa razy; UŻYWANA jest WARTOŚĆ Z DRUGIEGO wywołania (pierwsze przelicza cache dirty-gated,
 * a pole `forecast` w literale nnsDiag jest czytane przed nnsGateForPlayer()). Wartości z pierwszego wywołania są odrzucane.
 *
 * Usage (z gra/): node tools/nns-gate-r3-measure.cjs <buildDirAbs> <play|load|chain> <profileDirAbs> <seed> <turns> <extra> [evidenceJsonAbs]
 * Kod wyjścia: 0 gdy pomiar zakończony (blokada jest wynikiem), 1 przy błędzie technicznym.
 */
const path = require('path');
const fs = require('fs');

const [, , BUILD, MODE, PROFILE, SEED_ARG, TURNS_ARG, EXTRA_ARG, EVIDENCE] = process.argv;
if (!BUILD || !MODE || !PROFILE || !SEED_ARG || !TURNS_ARG || EXTRA_ARG === undefined) {
  console.error('Usage: node tools/nns-gate-r3-measure.cjs <buildDirAbs> <play|load|chain> <profileDirAbs> <seed> <turns> <extra> [evidenceJsonAbs]');
  process.exit(2);
}
const SEED = parseInt(SEED_ARG, 10);
const TURNS = parseInt(TURNS_ARG, 10);
const EXTRA = parseInt(EXTRA_ARG, 10);
const SLOT = 'nns-r3-s' + SEED + '-t' + TURNS + '-x' + EXTRA;
const QUERY = MODE === 'chain' ? '?playtest=mapa&civTest=1' : '?civTest=1&civSeed=' + SEED;
const URL_GRY = 'file://' + path.join(BUILD, 'index.html') + QUERY;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const wynik = { mode: MODE, seed: SEED, turns: TURNS, extra: EXTRA, slot: SLOT, kroki: {}, log: [], bledy: [] };
const konsolaNns = [];

async function gotoGra(page) {
  page.on('pageerror', (e) => wynik.bledy.push(e.message.slice(0, 200)));
  page.on('console', (m) => { if (/NNS|EndTurn|refreshLiveEmpire/.test(m.text())) konsolaNns.push(m.text().slice(0, 220)); });
  await page.goto(URL_GRY, { waitUntil: 'load', timeout: 120000 });
  if (MODE === 'chain') {
    await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
    for (let i = 0; i < 900; i++) {
      if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
      await wait(1000);
    }
  } else {
    await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__nnsMeasureDebug && !!window.__eraTestDebug, undefined, { timeout: 180000 });
  }
}

async function startNowaGra(page) {
  await page.evaluate((seed) => window.__nnsMeasureDebug.startGame({ seed }), SEED);
  await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, undefined, { timeout: 180000 });
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, undefined, { timeout: 600000, polling: 500 });
}

// Odczyt bramki: DWA wywołania nnsDiag; zwracana jest wartość z DRUGIEGO (po przeliczeniu cache).
async function odczyt(page) {
  const czytaj = () => page.evaluate(() => {
    const d = window.__aiTradeWiringTestDebug.nnsDiag();
    const info = window.__aiTradeWiringTestDebug.info();
    return {
      tura: window.__eraTestDebug.getWorldState().turn,
      miastaGracza: info.myCities,
      bramkaBlokuje: d.gate,
      komunikat: (d.komunikat || '').slice(0, 160),
      skarbiec: d.treasury,
      spichlerzZywy: d.spichlerz,
      prognoza: d.forecast ? {
        tura: d.forecast.turn,
        skarbiecPo: Math.round(d.forecast.skarbiecPo),
        spichlerzObecny: Math.round(d.forecast.spichlerzObecny),
        spichlerzPo: Math.round(d.forecast.spichlerzPo),
      } : null,
    };
  });
  await czytaj();
  return czytaj();
}

async function zamknijModale(page) {
  return page.evaluate(() => {
    const zamkniete = [];
    const klik = (sel, nazwa) => {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) { el.click(); zamkniete.push(nazwa); }
    };
    klik('.civ-diplo-aud .civ-diplo-aud-back', 'audiencja');
    klik('#civ-amp-title ~ * .civ-amp-btn-sep, .civ-amp-btn-sep', 'armia-polaczenie');
    klik('#civ-tech-discovery-notice-host [data-act=close]', 'technologia');
    return zamkniete;
  });
}

async function endTurnPokaz(page, maxSek = 240) {
  const przed = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  const modalePrzed = await zamknijModale(page);
  const canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  let po = przed;
  const modale = [];
  for (let i = 0; i < maxSek; i++) {
    await wait(1000);
    const z = await zamknijModale(page);
    if (z.length) modale.push(...z);
    po = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    const busy = await page.evaluate(() => window.__aiTradeWiringTestDebug.isEndTurnInProgress());
    if (po > przed && !busy) break;
  }
  return { przed, po, przeszedl: po > przed, canEndPrzed: canEnd, modaleZamkniete: modalePrzed.concat(modale) };
}

function zapisz() {
  wynik.konsolaNns = konsolaNns.slice(0, 60);
  const out = JSON.stringify(wynik, null, 2);
  if (EVIDENCE) { fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true }); fs.writeFileSync(EVIDENCE, out); }
  console.log(out);
}

async function dodajMiasta(page, n) {
  const ids = [];
  for (let i = 0; i < n; i++) {
    const id = await page.evaluate(() => window.__cityCessionTestDebug.foundExtraCityForTest(0));
    ids.push(id);
  }
  return ids;
}

async function runPlay(page) {
  await gotoGra(page);
  await startNowaGra(page);
  const found = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
  if (!found) throw new Error('foundFirstCity=false');
  wynik.kroki.extra_miasta_ids = await dodajMiasta(page, EXTRA);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
  let s = await odczyt(page);
  wynik.kroki.t1_start = s;
  const start = Date.now();
  while (s.tura < TURNS && Date.now() - start < parseInt(process.env.LOOP_MS || "330000", 10)) {
    let interwencja = null;
    if (s.bramkaBlokuje) {
      await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerGold(200));
      await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerFood(200));
      interwencja = 'dosypka zlota 200 + zywnosci 200';
    }
    const r = await endTurnPokaz(page);
    s = await odczyt(page);
    wynik.log.push({ przed: r.przed, po: r.po, przeszedl: r.przeszedl, blokadaPrzed: !!interwencja, interwencja, miastaGracza: s.miastaGracza, prognozaSpichlerzPo: s.prognoza ? s.prognoza.spichlerzPo : null });
    zapisz();
    if (!r.przeszedl) break;
  }
  wynik.kroki.bez_wczytania_koniec = await odczyt(page);
  await page.evaluate((sl) => window.__aiTradeWiringTestDebug.quickSave(sl), SLOT);
  wynik.kroki.quickSave_slot = SLOT;
}

async function runLoad(page) {
  await gotoGra(page);
  await startNowaGra(page);
  wynik.kroki.przed_wczytaniem = await odczyt(page);
  await page.evaluate((sl) => window.__aiTradeWiringTestDebug.loadSlot(sl), SLOT);
  for (let i = 0; i < 240; i++) {
    if ((await page.evaluate(() => window.__eraTestDebug.getWorldState().turn)) === TURNS) break;
    await wait(500);
  }
  await wait(2500);
  wynik.kroki.po_wczytaniu = await odczyt(page);
  wynik.kroki.po_wczytaniu_endTurn = await endTurnPokaz(page);
  wynik.kroki.po_endTurn = await odczyt(page);
}

// Łańcuch przyczynowy (playtest=mapa): preset ma 1 miasto gracza; sprawdzamy, czy zdarzenie założenia miasta
// (markCityStateDirty przez finalizeCityFounding) odtwarza prognozę, której przed nim brakuje.
async function runChain(page) {
  await gotoGra(page);
  wynik.kroki.t1_przed_zdarzeniem = await odczyt(page);
  wynik.kroki.extra_miasta_ids = await dodajMiasta(page, EXTRA);
  wynik.kroki.t1_po_zalozeniu_miasta = await odczyt(page);
  wynik.kroki.t1_przed_endTurn = await odczyt(page);
  zapisz();
  const r = await endTurnPokaz(page, 20);
  wynik.kroki.endTurn_po = r;
  wynik.kroki.t2_po_endTurn = await odczyt(page);
}

async function main() {
  const { chromium } = require('playwright');
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true,
    executablePath: process.env.CHROME_PATH || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'),
    viewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await ctx.newPage();
    if (MODE === 'play') await runPlay(page);
    else if (MODE === 'load') await runLoad(page);
    else if (MODE === 'chain') await runChain(page);
    else throw new Error('nieznany tryb ' + MODE);
  } catch (e) {
    wynik.bledy.push('FAIL ' + ((e && e.message) || String(e)).slice(0, 300));
    process.exitCode = 1;
  } finally {
    await ctx.close();
  }
  zapisz();
}

main().catch((e) => { console.error('FAIL:', (e && e.stack) || e); process.exit(1); });
