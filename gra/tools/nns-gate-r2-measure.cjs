'use strict';
/**
 * nns-gate-r2-measure.cjs — R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1, runda 2 (pomiar wierszy B i C; bez zmian w gra/src).
 *
 * Tryby (argv[3]):
 *  play  — NOWA gra (__nnsMeasureDebug.startGame, start 'newgame' jak ai-economy-measure-run.cjs), zakładane miasto
 *          gracza (foundFirstCity), tryb przyspieszony. Pętla do tury --turns: odczyt bramki (nnsDiag) -> gdy bramka
 *          blokuje: dosypka złota 200 + żywności 200 (interwencja harnessu, zapisana w `log`) -> endTurn.
 *          Potem BEZ wczytania (ta sama sesja): odczyt bramki + endTurn; na końcu quickSave(slot).
 *  load  — NOWA strona w tym samym profilu: startGame (ten sam seed) -> loadSlot(slot) -> odczyt bramki -> endTurn.
 *
 * Usage (z gra/): node tools/nns-gate-r2-measure.cjs <buildDirAbs> <play|load> <profileDirAbs> <seed> <turns> [evidenceJsonAbs]
 * Odczyt bramki = nnsDiag() dwa razy w osobnych wywołaniach (pierwsze wywołanie przelicza cache dirty-gated).
 * Kod wyjścia: 0 gdy pomiar zakończony (blokada jest wynikiem, nie błędem), 1 przy błędzie technicznym.
 */
const path = require('path');
const fs = require('fs');

const [, , BUILD, MODE, PROFILE, SEED_ARG, TURNS_ARG, EVIDENCE] = process.argv;
if (!BUILD || !MODE || !PROFILE || !SEED_ARG || !TURNS_ARG) {
  console.error('Usage: node tools/nns-gate-r2-measure.cjs <buildDirAbs> <play|load> <profileDirAbs> <seed> <turns> [evidenceJsonAbs]');
  process.exit(2);
}
const SEED = parseInt(SEED_ARG, 10);
const TURNS = parseInt(TURNS_ARG, 10);
const SLOT = 'nns-r2-s' + SEED + '-t' + TURNS;
const URL_GRY = 'file://' + path.join(BUILD, 'index.html') + '?civTest=1&civSeed=' + SEED;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const wynik = { mode: MODE, seed: SEED, turns: TURNS, slot: SLOT, kroki: {}, log: [], bledy: [] };
const konsolaNns = [];

async function gotoGra(page) {
  page.on('pageerror', (e) => wynik.bledy.push(e.message.slice(0, 200)));
  page.on('console', (m) => { if (/NNS|EndTurn|refreshLiveEmpire/.test(m.text())) konsolaNns.push(m.text().slice(0, 220)); });
  await page.goto(URL_GRY, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__nnsMeasureDebug && !!window.__eraTestDebug, undefined, { timeout: 180000 });
}

async function startNowaGra(page) {
  await page.evaluate((seed) => window.__nnsMeasureDebug.startGame({ seed }), SEED);
  await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, undefined, { timeout: 180000 });
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, undefined, { timeout: 600000, polling: 500 });
}

// Odczyt bramki: DWA osobne wywołania nnsDiag (pierwsze przelicza cache dirty-gated, drugie czyta wynik).
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

// Blokady modalne końca tury (jak ai-economy-measure-run.cjs): audiencja dyplomatyczna, panel łączenia armii,
// karta odkrycia technologii. Zamykane przyciskiem, tak jak gracz; zwraca listę zamkniętych.
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

// Koniec tury jest zakończony dopiero, gdy tura wzrosła ORAZ przetwarzanie tury (endTurnInProgress) się skończyło;
// wcześniejsze endTurn w trakcie przetwarzania jest odrzucane przez grę ([EndTurn] blocked: endTurnInProgress).
async function endTurnPokaz(page) {
  const przed = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  const modalePrzed = await zamknijModale(page);
  const canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  let po = przed;
  const modale = [];
  for (let i = 0; i < 240; i++) {
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

async function runPlay(page) {
  await gotoGra(page);
  await startNowaGra(page);
  const found = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
  if (!found) throw new Error('foundFirstCity=false');
  await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
  let s = await odczyt(page);
  wynik.kroki.t1_start = s;
  const start = Date.now();
  while (s.tura < TURNS && Date.now() - start < 480000) {
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
