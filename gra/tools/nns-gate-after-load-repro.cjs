'use strict';
/**
 * nns-gate-after-load-repro.cjs — R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1 (pomiar w Chromium, bez zmian w gra/src).
 *
 * Bramka „Zakończ turę” (NNS) czyta cache `_nnsHumanForecast` (src/main.ts, refreshLiveEmpireRates dirty-gated).
 * Narzędzie mierzy trzy przypadki i zwraca JSON. Odczyt bramki = `nnsDiag()` wykonany DWA razy (pierwszy odczyt
 * czyta cache sprzed własnego przeliczenia), wynik = drugi odczyt.
 *
 * Tryby (argv[3]):
 *  A       — tura 1, mapa. Strona P1: świeża gra -> odczyt (E0) -> quickSave -> loadSlot TEJ SAMEJ strony -> odczyt (E1)
 *            -> endTurn. Strona P2 w TYM SAMYM kontekście (ten sam magazyn zapisów): świeża gra -> odczyt (E2a)
 *            -> loadSlot -> odczyt (E2b, walidacja: forecast != null = wczytany zapis) -> endTurn.
 *            Strona P3: świeża gra -> endTurn (tura 2) -> odczyt (E3, kontrola bez wczytania).
 *  Bplay   — gra mapa do tury >= 20 w trwałym profilu. Gdy bramka blokuje: setSpichlerzPanstwa(ME, 400) (interwencja
 *            harnessu, zapisana w logu). Przed zapisem 'nns-B-t20' odczyt bez wczytania.
 *  Bmeasure— ten sam profil: nowa strona, świeża gra -> odczyt -> loadSlot('nns-B-t20') -> odczyt -> endTurn.
 *
 * Usage (z gra/): node tools/nns-gate-after-load-repro.cjs <buildDirAbs> <A|Bplay|Bmeasure> <profileDirAbs> <evidenceJsonAbs>
 * Wymaga: bundle zbudowany poza repo (vite build --outDir), playwright, CHROME_PATH (opcjonalnie).
 * Kod wyjścia: 0 gdy walidacje przypadków przechodzą (wczytanie działa, bramka odczytana), 1 inaczej.
 */
const path = require('path');
const fs = require('fs');

const [, , BUILD, MODE, PROFILE, EVIDENCE] = process.argv;
if (!BUILD || !MODE || !PROFILE) {
  console.error('Usage: node tools/nns-gate-after-load-repro.cjs <buildDirAbs> <A|Bplay|Bmeasure> <profileDirAbs> [evidenceJsonAbs]');
  process.exit(2);
}
const URL_GRY = 'file://' + path.join(BUILD, 'index.html') + '?playtest=mapa&civTest=1';
const SLOT_A = 'nns-A-t1';
const SLOT_B = 'nns-B-t20';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const wynik = { mode: MODE, kroki: {}, bledy: [], walidacja: {} };

const konsolaNns = [];
async function gotoGra(page) {
  page.on('console', (m) => { if (/NNS|nnsGate|refreshLiveEmpire/.test(m.text())) konsolaNns.push(m.text().slice(0, 200)); });
  await page.goto(URL_GRY, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__aiTradeWiringTestDebug && !!window.__defeatTestDebug && !!window.__truceSaveLoadTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await page.evaluate(() => window.__defeatTestDebug.setPlayerEraForTest(1));
  await wait(300);
}

// Dwa kolejne odczyty; zwraca drugi (patrz nagłówek).
async function stan(page) {
  const read = () => page.evaluate(() => {
    const d = window.__aiTradeWiringTestDebug.nnsDiag();
    const info = window.__aiTradeWiringTestDebug.info();
    return {
      tura: window.__eraTestDebug.getWorldState().turn,
      miastaGracza: info.myCities,
      bramkaBlokuje: d.gate,
      komunikat: (d.komunikat || '').slice(0, 160),
      skarbiec: d.treasury,
      spichlerzZywy: d.spichlerz,
      prognozaCache: d.forecast ? {
        tura: d.forecast.turn,
        spichlerzObecny: Math.round(d.forecast.spichlerzObecny),
        spichlerzPo: Math.round(d.forecast.spichlerzPo),
        skarbiecPo: Math.round(d.forecast.skarbiecPo),
      } : null,
      ja: info.me,
    };
  });
  await read();
  return read();
}

async function loadAndWait(page, slot, turn) {
  await page.evaluate((s) => window.__truceSaveLoadTestDebug.loadSlot(s), slot);
  for (let i = 0; i < 240; i++) {
    if ((await page.evaluate(() => window.__eraTestDebug.getWorldState().turn)) === turn) break;
    await wait(500);
  }
  await wait(2500);
}

async function endTurnPokaz(page) {
  const przed = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  // Tura może trwać dłużej niż 5 s (ruch AI): czekamy na zmianę tury, nie ponawiamy endTurn (endTurnInProgress).
  let po = przed;
  for (let i = 0; i < 120 && po === przed; i++) {
    await wait(1000);
    po = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  }
  return { przed, po, przeszedl: po > przed };
}

function zapisz() {
  const out = JSON.stringify(wynik, null, 2);
  if (EVIDENCE) { fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true }); fs.writeFileSync(EVIDENCE, out); }
  console.log(out);
}

async function runA(ctx) {
  const p1 = await ctx.newPage();
  p1.on('pageerror', (e) => wynik.bledy.push('P1 ' + e.message.slice(0, 200)));
  await gotoGra(p1);
  wynik.kroki.E0_P1_swieza_gra_t1 = await stan(p1);
  wynik.kroki.E0q_quickSave_t1 = await p1.evaluate((s) => window.__truceSaveLoadTestDebug.quickSave(s), SLOT_A);
  await loadAndWait(p1, SLOT_A, 1);
  wynik.kroki.E1_P1_po_loadSlot_ta_sama_strona_t1 = await stan(p1);
  wynik.kroki.E1_endTurn = await endTurnPokaz(p1);
  await p1.close();

  // P2 w TYM SAMYM kontekście: ten sam magazyn zapisów co P1 (walidacja: wczytanie musi zmienić stan).
  const p2 = await ctx.newPage();
  p2.on('pageerror', (e) => wynik.bledy.push('P2 ' + e.message.slice(0, 200)));
  await gotoGra(p2);
  wynik.kroki.E2a_P2_swieza_strona_przed_load = await stan(p2);
  await loadAndWait(p2, SLOT_A, 1);
  wynik.kroki.E2b_P2_po_loadSlot_nowa_strona_t1 = await stan(p2);
  wynik.kroki.E2b_endTurn = await endTurnPokaz(p2);
  await p2.close();

  // P3: świeża gra, endTurn do tury 2 bez wczytania (kontrola: bramka po realnej prognozie tury 2).
  const p3 = await ctx.newPage();
  p3.on('pageerror', (e) => wynik.bledy.push('P3 ' + e.message.slice(0, 200)));
  await gotoGra(p3);
  wynik.kroki.E3a_P3_swieza_t1 = await stan(p3);
  wynik.kroki.E3_endTurn_t1_do_t2 = await endTurnPokaz(p3);
  wynik.kroki.E3b_P3_t2_bez_wczytania = await stan(p3);
  await p3.close();

  const e2b = wynik.kroki.E2b_P2_po_loadSlot_nowa_strona_t1;
  wynik.walidacja = {
    wczytanieDziala_P2: e2b.tura === 1 && e2b.prognozaCache !== null,
    E2a_bramkaWolna: wynik.kroki.E2a_P2_swieza_strona_przed_load.bramkaBlokuje === false,
    uwaga: 'walidacja = po wczytaniu w nowej stronie cache prognozy != null (kontrola cross-context bez wczytania daje null)',
  };
}

async function runBplay(ctx) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => wynik.bledy.push('Bplay ' + e.message.slice(0, 200)));
  await gotoGra(p);
  // Wznowienie między segmentami (trwały profil): 'nns-B-cur' zapisywany po każdej turze.
  if (process.argv[6] === 'resume') {
    await p.evaluate((sl) => window.__truceSaveLoadTestDebug.loadSlot(sl), 'nns-B-cur');
    await wait(10000);
    wynik.kroki.resume_od_tury = await p.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  }
  const start = Date.now();
  wynik.kroki.log = [];
  let s = await stan(p);
  while (s.tura < 20 && Date.now() - start < 400000) {
    let interwencja = null;
    if (s.bramkaBlokuje) {
      interwencja = await p.evaluate((ja) => window.__aiTradeWiringTestDebug.setSpichlerzPanstwa(ja, 400), s.ja);
    }
    const r = await endTurnPokaz(p);
    s = await stan(p);
    wynik.kroki.log.push({ przed: r.przed, po: r.po, przeszedl: r.przeszedl, blokadaPrzed: interwencja === null ? 'nie' : 'tak', spichlerzUstawiony: interwencja, miastaGracza: s.miastaGracza });
    await p.evaluate((sl) => window.__truceSaveLoadTestDebug.quickSave(sl), 'nns-B-cur');
    zapisz();
  }
  wynik.kroki.przed_zapisem_tura = s.tura;
  wynik.kroki.przed_zapisem_stan = s;
  if (s.tura >= 20) {
    wynik.kroki.quickSave_B = await p.evaluate((sl) => window.__truceSaveLoadTestDebug.quickSave(sl), SLOT_B);
  }
  await p.close();
}

async function runBmeasure(ctx) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => wynik.bledy.push('Bmeasure ' + e.message.slice(0, 200)));
  await gotoGra(p);
  wynik.kroki.B_swieza_gra_bez_wczytania = await stan(p);
  await loadAndWait(p, SLOT_B, 20);
  wynik.kroki.B_po_loadSlot = await stan(p);
  wynik.kroki.B_endTurn_po_wczytaniu = await endTurnPokaz(p);
  wynik.kroki.B_po_endTurn = await stan(p);
  await p.close();
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('playwright nie znaleziony'); process.exit(1); }
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    viewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    if (MODE === 'A') await runA(ctx);
    else if (MODE === 'Bplay') await runBplay(ctx);
    else if (MODE === 'Bmeasure') await runBmeasure(ctx);
    else throw new Error('nieznany tryb ' + MODE);
  } finally {
    await ctx.close();
  }
  wynik.konsolaNns = konsolaNns.slice(0, 50);
  zapisz();
  if (MODE === 'A' && !(wynik.walidacja.wczytanieDziala_P2 && wynik.walidacja.E2a_bramkaWolna)) process.exit(1);
  if (wynik.bledy.length > 0) process.exit(1);
}

main().catch((e) => { console.error('FAIL:', (e && e.stack) || e); process.exit(1); });
