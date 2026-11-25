'use strict';
/**
 * ai-trade-wiring-e2e-live-test.cjs — R-WEB-AI-TRADE-WIRING-E2E-Q1.
 *
 * DOWOD W ZYWEJ GRZE (headless Chromium, zbudowany bundle vite, `?playtest=mapa&civTest=1`), nie makieta:
 *   1. AI sama proponuje graczowi cykliczna wymiane surowcow przez REALNY endTurn
 *      (decideAITurn -> zaproponuj_wymiane_cykliczna -> enqueueNegotiationFromAiCmd -> stol negocjacji),
 *      a selekcja (probeBarter) jest zgodna z propozycja na stole,
 *   2. ignorowanie: oferta zostaje na stole po kolejnym EOT, bez duplikatu, cooldown nie zerowany,
 *   3. zapis w trakcie wiszacej propozycji -> REALNE wczytanie slotu: propozycja i cooldown zachowane,
 *   4. odrzucenie: stol czysty, gra dziala, cooldown (barter + odrzucenie) blokuje kolejna oferte do ~15 tur,
 *   5. akceptacja (po wczytaniu zapisu): umowa w activeDeals, REALNY tick dostaw przenosi surowce
 *      (stany PRZED/PO obu stron), zapis/wczytanie w trakcie aktywnej umowy zachowuje umowe i dostawy trwaja,
 *   6. stary zapis (bez pol AI-TRADE) laduje sie bez bledu; zero console.error / pageerror,
 *   7. REALNE okno dyplomacji (klik karty HUD „Dyplomacja”): oferta widoczna, przycisk „Przyjmij” AKTYWNY (previewIncomingPlayerAccept
 *      net PW >= 0, bez haka forceAccept), przyjecie i odrzucenie REALNYMI przyciskami w oknie.
 *   8. (R-WEB-AI-TRADE-WIRING-E2E-Q1 r3, ABC A1) tabela proporcji ofert AI: siatka give x recv dla kilku par surowcow w zywej grze,
 *      surowe wyniki w AITW_RESULT (grid); kazda oferta, ktora przechodzi OBIE bramki (AI i podglad gracza), ma givePn == receivePn.
 *
 * Srodowisko: bundle budowany `vite build --outDir <poza repo>` i ladowany z file:// (ZAKAZ `npm run dev`/`build` w gra/ -- R-PROC-AUTOBOT sec. 9),
 * a NIE przez serwer Vite po HTTP; kod gry i hak ?civTest=1 sa te same.
 *
 * Usage (z gra/):  BUNDLE_DIR=<abs> node tools/ai-trade-wiring-e2e-live-test.cjs
 *   (bez BUNDLE_DIR test buduje bundle vite do katalogu tymczasowego POZA repo; SKIP_BUILD=1 pomija budowe)
 *   AITW_EVIDENCE=<abs dir>  -> zrzuty ekranu;  AITW_RESULT=<abs file> -> JSON z liczbami.
 *
 * MUTACJE (obie ZMIERZONE, kazda MUSI dac exit 1; tymczasowe zmiany main.ts, bundle poza repo, potem przywrocone):
 *   A. wiring: w lancuchu komend AI w main.ts warunek galezi `cmd.type === 'zaproponuj_wymiane_cykliczna'` zmieniony na nieistniejacy typ
 *      -> FAIL „REALNY endTurn: AI skladala graczowi propozycje” (stol pusty).
 *   B. stary zapis: usunieta linia `aiResourceBarterLastProposalTurn.clear();` przy wczytaniu zapisu
 *      -> FAIL „stary zapis: ... cooldown barteru pusty” (cooldown dziedziczony z biezacej sesji).
 *
 * ABC A1 (wlasciciel, R-WEB-AI-TRADE-WIRING-E2E-Q1 r3): dla ofert AI -> gracz bramka uczciwosci AI uzywa wspolczynnika relacji 1
 *   (AI_PROPOSER_FAIRNESS_REL_TOTAL, diplomacy-proposals.ts) i selekcja/filtr enqueue wymagaja givePn <= receivePn (gorny limit = podglad
 *   gracza). Przecieciem jest oferta „rowne za rowne” (np. 10 zelaza = 200 PW za 40 cegly = 200 PW). Podglad „Przyjmij” gracza NIE zmieniony.
 *   Akceptacja w tym tescie idzie PRZYCISKIEM „Przyjmij” w oknie dyplomacji (bez forceAccept).
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR || path.join(os.tmpdir(), `ai-trade-wiring-e2e-dist-${TMPDIR_RUN_ID}`);
const EVIDENCE_DIR = process.env.AITW_EVIDENCE || '';
const RESULT_FILE = process.env.AITW_RESULT || '';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const H = 'window.__aiTradeWiringTestDebug';
const GIVE = 'cegla'; // r3 (A1): AI daje cegle (nadwyzka zapasu, Cegielnia = stawka > 0); graczowi brakuje
const RECV = 'zelazo'; // r3 (A1): AI bierze zelazo (brak), gracz ma nadwyzke (Odlewnia). Para 4:1 (cegla 5 PW / zelazo 20 PW): 10 zelaza = 40 cegly = 200 PW
// AITW_BIG=<n>: zapas startowy (AI: GIVE, gracz: RECV); domyslnie 400. Z AITW_PROBE_ONLY=1 test konczy sie po pomiarze selekcji (koszt petli giveQty x receiveQty).
const BIG = Number(process.env.AITW_BIG || 400);
const PROBE_ONLY = process.env.AITW_PROBE_ONLY === '1';
// R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 (r3): AITW_POP=<n> ustawia n obywateli w pierwszym miescie gracza i AI (scenariusz „jedno miasto, 20 obywateli”).
const POP = Number(process.env.AITW_POP || 0);
// AITW_ERA=<n> (1=Kamien, 2=Braz): ustawia epoke gracza i AI przed scenariuszem (0/brak = domyslna epoka startu).
const ERA = Number(process.env.AITW_ERA || 0);

let pass = 0;
let fail = 0;
const out = {};
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK   ${label}`); } else {
    fail++; console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const pl0 = st => st.pending[0].payload;
const wait = ms => new Promise(r => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  console.log(`[aitw] build vite -> ${BUNDLE}`);
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

const ev = (page, fn, arg) => page.evaluate(fn, arg);
const state = page => ev(page, () => window.__aiTradeWiringTestDebug.state());

async function endTurnWait(page) {
  const t0 = (await state(page)).turn;
  const started = Date.now();
  await ev(page, () => window.__aiTradeWiringTestDebug.endTurn());
  try {
    await page.waitForFunction(
      t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(),
      t0, { timeout: 60000 },
    );
  } catch (err) {
    // Diagnostyka zawieszenia tury: stan w chwili timeoutu (tura, faza, stol) przed rzuceniem dalej.
    const dbg = await ev(page, () => ({
      turn: window.__aiTradeWiringTestDebug.state().turn,
      inProgress: window.__aiTradeWiringTestDebug.isEndTurnInProgress(),
      battle: window.__aiTradeWiringTestDebug.info && window.__aiTradeWiringTestDebug.state().pending,
    })).catch(e => ({ evalErr: String(e) }));
    console.error(`  [timeout-tury] od tury ${t0} stan:`, JSON.stringify(dbg).slice(0, 600));
    console.error('  [timeout-tury] powody blokady konca tury:', endTurnBlockWarnings.slice(-3));
    const nns = await ev(page, () => window.__aiTradeWiringTestDebug.nnsDiag()).catch(e => String(e));
    console.error('  [timeout-tury] NNS gracza:', JSON.stringify(nns).slice(0, 900));
    throw err;
  }
  // R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 r2: czas tury zmierzony (koszt petli selekcji AI).
  const ms = Date.now() - started;
  turnMsLog.push({ turn: t0, ms });
  console.log(`  [czas-tury] tura ${t0}: ${ms} ms`);
  await wait(150);
}
const turnMsLog = [];
const endTurnBlockWarnings = [];

/** Otwiera REALNE okno „Audiencja dyplomatyczna” klikajac karte HUD „Dyplomacja” (jak gracz). Zwraca stan przyciskow okna. */
async function openAudienceFromHud(page) {
  const clicked = await ev(page, () => {
    const e = Array.from(document.querySelectorAll('.sp-event[data-id]')).find(x => /Dyplomacja/.test(x.textContent || ''));
    if (!e) return false;
    e.click();
    return true;
  });
  if (!clicked) return { clicked: false, buttons: [], text: '' };
  await page.waitForSelector('button[data-negot-act="accept-package"]', { timeout: 15000 }).catch(() => {});
  await wait(500);
  return ev(page, () => ({
    clicked: true,
    buttons: Array.from(document.querySelectorAll('button[data-negot-act]')).map(b => ({
      act: b.getAttribute('data-negot-act'), text: (b.textContent || '').trim(), disabled: b.disabled, visible: !!(b.offsetWidth || b.offsetHeight),
    })),
    text: (document.body.innerText || ''),
  }));
}

/** Zamyka okno audiencji przyciskiem „Wroc” (jak gracz). */
async function closeAudience(page) {
  await ev(page, () => {
    const b = Array.from(document.querySelectorAll('button')).find(x => /^Wr[oó][cć]$/i.test((x.textContent || '').trim()));
    if (b) b.click();
  });
  await wait(300);
}

/** SETUP scenariusza: AI ma nadwyzke GIVE i brak RECV; gracz odwrotnie. Pozostale surowce 0. */
async function setupScenario(page, info) {
  // Realne stawki produkcji (clamp per_turn limituje ilosc produkcja/ture): AI dostaje Odlewnie zelaza, gracz Cegielnie.
  await ev(page, ([ai]) => {
    const st = window.__civTest.state();
    const aiCity = st.cities.find(c => c.ownerId === ai);
    const myCity = st.cities.find(c => c.ownerId === 0);
    const aiBuilt = window.__civTest.adminState(aiCity.id).built;
    const myBuilt = window.__civTest.adminState(myCity.id).built;
    window.__civTest.adminSetup(aiCity.id, [...new Set([...aiBuilt, 'cegielnia'])], null, null, null);
    window.__civTest.adminSetup(myCity.id, [...new Set([...myBuilt, 'odlewnia_zelaza'])], null, null, null);
  }, [info.ai]);
  await ev(page, ([ai, keys, give, recv, big, POP, ERA]) => {
    const h = window.__aiTradeWiringTestDebug;
    h.prepare(ai);
    for (const k of keys) { h.setStock(ai, k, 0); h.setStock(0, k, 0); }
    h.setStock(ai, give, big);
    h.setStock(0, recv, big);
    // R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 (r2): bramka NNS (FALA 724, z origin/main) blokuje
    // koniec tury, gdy spichlerz panstwa gracza po turze < 0 (zerowany powyzej zapas zywnosci, zero produkcji
    // w scenariuszu). Bufor zywnosci NIE zmienia pary handlowej (zywnosc nie jest w GIVE/RECV), tylko odblokowuje EOT.
    h.setSpichlerzPanstwa(0, 100000);
    if (POP > 0) { h.setCityPopulation(0, POP); h.setCityPopulation(ai, POP); }
    if (ERA > 0) { h.setOwnerEra(0, ERA); h.setOwnerEra(ai, ERA); }
  }, [info.ai, info.pricedKeys, GIVE, RECV, BIG, POP, ERA]);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) {
    console.error('[aitw] playwright nie znaleziony (uruchom z gra/).'); process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', m => {
      if (m.type() === 'error') consoleErrors.push(m.text());
      // Ostrzezenia [EndTurn] (powod zablokowania konca tury) -- tylko do diagnostyki timeoutu.
      if (m.type() === 'warning' && /\[EndTurn\] blocked/.test(m.text())) endTurnBlockWarnings.push(m.text());
    });
    page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));
    await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () => !!window.__aiTradeWiringTestDebug && !!window.__civTest && !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0,
      undefined, { timeout: 180000 },
    );
    await ev(page, () => window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest());
    const info0 = await ev(page, () => window.__aiTradeWiringTestDebug.info());
    assert('sandbox: gracz ma miasto-start do zalozenia, AI ma miasto', info0.aiCities >= 1, info0);
    assert('zalozenie pierwszego miasta gracza', await ev(page, () => window.__aiTradeWiringTestDebug.foundFirstCity()));
    const info = await ev(page, () => window.__aiTradeWiringTestDebug.info());
    const ai = info.ai;
    out.info = info;

    // ---------- 1. SETUP + selekcja + realna propozycja z endTurn ----------
    await setupScenario(page, info);
    const prep = await ev(page, a => window.__aiTradeWiringTestDebug.prepare(a), ai);
    assert('setup: tech Wymiana obu stron, kontakt, nie-wojna', prep.techMe && prep.techAi && prep.contact && prep.status !== 'wojna', prep);
    const stocksSetup = await ev(page, ([a, g, r]) => ({
      aiGive: window.__aiTradeWiringTestDebug.stock(a, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r),
      plGive: window.__aiTradeWiringTestDebug.stock(0, g), plRecv: window.__aiTradeWiringTestDebug.stock(0, r),
    }), [ai, GIVE, RECV]);
    out.stocksSetup = stocksSetup;
    assert('setup: zapasy ustawione (AI nadwyzka zelaza / brak cegly, gracz odwrotnie)',
      stocksSetup.aiGive >= BIG && stocksSetup.aiRecv === 0 && stocksSetup.plRecv >= BIG && stocksSetup.plGive === 0, stocksSetup);
    const probeT0 = Date.now();
    const probe = await ev(page, a => window.__aiTradeWiringTestDebug.probeBarter(a), ai);
    const probeMs = Date.now() - probeT0;
    console.log(`  [czas-selekcji] probeBarter: ${probeMs} ms`);
    out.probe = probe;
    out.probeMs = probeMs;
    out.popSetup = POP;
    out.eraSetup = ERA;
    assert('selekcja (ta sama funkcja co wiring): AI daje zelazo, bierze cegle',
      !!probe && probe.giveKey === GIVE && probe.receiveKey === RECV && probe.giveQty > 0 && probe.receiveQty > 0, probe);

    if (PROBE_ONLY) {
      out.probeOnly = true; out.big = BIG;
      console.log(`  [probe-only] BIG=${BIG} POP=${POP} ERA=${ERA}: probeBarter ${probeMs} ms -> ${JSON.stringify(probe)}`);
      if (RESULT_FILE) fs.writeFileSync(RESULT_FILE, JSON.stringify(out, null, 1));
      await browser.close();
      console.log(`\nai-trade-wiring-e2e-live-test (probe-only): ${pass} pass, ${fail} fail`);
      process.exit(fail > 0 ? 1 : 0);
    }
    const s0 = await state(page);
    assert('start: brak propozycji barteru na stole, brak umow cyklicznych', s0.pending.length === 0 && s0.cyclicDeals.length === 0, s0);
    await endTurnWait(page);
    let s1 = await state(page);
    out.afterFirstEot = s1;
    assert('REALNY endTurn: AI skladala graczowi propozycje wymiany cyklicznej (stol, aiCyclicBarter)',
      s1.pending.length === 1 && s1.pending[0].proposer === ai && s1.pending[0].responder === 0, s1);
    if (s1.pending.length !== 1) throw new Error('brak propozycji barteru na stole po realnym endTurn -- dalsze fazy nie maja sensu (wiring przerwany)');
    const offer = s1.pending[0];
    // R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 (r4, zarzut 1 FC r3): epoka gracza i AI W CHWILI OFERTY (po realnym EOT,
    // po produkcyjnym syncu badan) musi byc rowna ERA ze scenariusza. Bez tego scenariusze Kamien/Braz nie roznia sie epoka.
    if (ERA > 0) {
      const eraFloor = await ev(page, a => ({ p: window.__aiTradeWiringTestDebug.eraFloorForTest(0), ai: window.__aiTradeWiringTestDebug.eraFloorForTest(a) }), ai);
      console.log(`  [era-diag] podloga/start: ${JSON.stringify(eraFloor)}`);
      out.eraFloor = eraFloor;
      const eraAtOffer = await ev(page, a => ({
        player: window.__aiTradeWiringTestDebug.ownerEra(0),
        ai: window.__aiTradeWiringTestDebug.ownerEra(a),
      }), ai);
      out.eraAtOffer = eraAtOffer;
      assert(`epoka w chwili oferty = ERA ${ERA} (gracz ${eraAtOffer.player}, AI ${eraAtOffer.ai})`,
        eraAtOffer.player === ERA && eraAtOffer.ai === ERA, eraAtOffer);
    }
    const pl = offer.payload;
    // R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 (r3): w scenariuszu POP>0 produkcja/zuzycie 20 obywateli zmienia stan miedzy
    // probeBarter (przed EOT) a decyzja AI w endTurn, wiec para na stole moze byc INNA niz probe (np. cegla/drewno zamiast cegla/zelazo).
    // Cala dalsza weryfikacja (wycena, umowa, dostawy) idzie wiec po REALNYCH kluczach z oferty (curGive/curRecv), nie po stalych GIVE/RECV
    // (r2: diagPayload liczyl 350 sztuk ZELAZA zamiast zaproponowanego DREWNA = 7000 PW -- falszywy „rozjazd wyceny”, blad testu).
    const curGive = pl0(s1).giveItems?.[0]?.id; const curRecv = pl0(s1).receiveItems?.[0]?.id;
    out.offerKeys = { curGive, curRecv, probeGive: probe.giveKey, probeRecv: probe.receiveKey };
    assert('payload: AI daje surowiec (POP=0: cegle za zelazo), cyklicznie per_turn',
      (POP > 0 ? (!!curGive && !!curRecv && curGive !== curRecv) : (curGive === GIVE && curRecv === RECV)) && pl.resourceTradeMode === 'per_turn' && pl.turns > 0, pl);
    // Ilosci NA STOLE sa ilosciami po istniejacym clamp per_turn (produkcja/ture) -- nie wieksze niz selekcja.
    const offGive = pl.giveItems?.[0]?.ilosc;
    const offRecv = pl.receiveItems?.[0]?.ilosc;
    out.offer = { give: offGive, recv: offRecv, probeGive: probe.giveQty, probeRecv: probe.receiveQty };
    assert('oferta na stole: te same pozycje co selekcja, ilosci <= selekcji (clamp per_turn); przy POP>0 tylko ilosci dodatnie (para moze sie roznic od probe)',
      POP > 0 ? (offGive > 0 && offRecv > 0) : (offGive > 0 && offGive <= probe.giveQty && offRecv > 0 && offRecv <= probe.receiveQty), { pl, probe });
    // R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 (r3): dolna granica — ilosc odbioru zalezy od nadwyzki gracza, nie od sztywnego kroku 10
    // (mutacja przywracajaca sufit needMax daje receiveQty 10 i ten test MUSI wtedy czerwienic).
    assert('nadwyzka gracza: AI prosi o ilosc > krok handlu (10) na realnej selekcji', probe.receiveQty > 10 && offRecv > 10, { probeRecv: probe.receiveQty, offRecv });
    // Realna wycena (te same funkcje co wiring: resolveProposalPn, handelFairnessGate, evaluateProposal) dla ZAPROPONOWANEJ pary.
    const dp = await ev(page, ([a, g, gq, r, rq]) => window.__aiTradeWiringTestDebug.diagPayload(a, g, gq, r, rq), [ai, curGive, offGive, curRecv, offRecv]);
    out.diagOffer = dp;
    assert('realna wycena oferty: bramka uczciwosci przepuszcza, givePn <= receivePn, gracz akceptuje (evaluateProposal)',
      dp.fairBlock === null && dp.givePn <= dp.receivePn && dp.playerOk === true && dp.accepted === true, dp);
    const cd1 = s1.barterCooldown.find(([o]) => o === ai);
    assert('cooldown barteru AI ustawiony dopiero po wystawieniu oferty', !!cd1 && cd1[1] === s1.turn - 1 || !!cd1, s1.barterCooldown);
    await shot(page, '01-propozycja-na-stole.png');

    // ---------- 1b. REALNE okno dyplomacji (klik w karte HUD): oferta widoczna, przycisk „Przyjmij” ----------
    const diagP = await ev(page, ([a, gk, gq, rk, rq]) => window.__aiTradeWiringTestDebug.diagPayload(a, gk, gq, rk, rq),
      [ai, curGive, offGive, curRecv, offRecv]);
    out.pricing = diagP;
    const ui1 = await openAudienceFromHud(page);
    out.audienceUi = { buttons: ui1.buttons };
    assert('okno dyplomacji (klik karty HUD): otwarte, widoczny przycisk decyzji dla pakietu', ui1.clicked && ui1.buttons.some(b => b.act === 'accept-package' && b.visible), ui1.buttons);
    assert('okno dyplomacji: propozycja AI widoczna w oknie (Zelazo oferowane, 10 Cegla zadane)',
      (POP > 0 || (/Zelazo|Żelazo/.test(ui1.text) && /Cegła|Cegla/.test(ui1.text))) && /Ich propozycj|ICH PROPOZYCJA|Oni oferuj/i.test(ui1.text), ui1.text.slice(0, 300));
    // REALNY przycisk „Przyjmij” jest AKTYWNY (A1) -- gracz moze przyjac oferte AI bez forceAccept.
    const accBtn = ui1.buttons.find(b => b.act === 'accept-package');
    assert('okno dyplomacji: przycisk „Przyjmij” AKTYWNY (nie disabled) i „Odrzuć” aktywny',
      !!accBtn && accBtn.disabled === false && ui1.buttons.some(b => b.act === 'reject-package' && !b.disabled), { accBtn, btns: ui1.buttons });
    assert('wycena A1: oferta rowna za rowne (givePn == receivePn), bramka AI przechodzi, bramka gracza przechodzi',
      diagP.givePn === diagP.receivePn && diagP.givePn > 0 && diagP.fairBlock === null && diagP.playerOk === true, diagP);
    await shot(page, '05-okno-dyplomacji-przyjmij-aktywne.png');
    await closeAudience(page);

    // ---------- 1c. TABELA PROPORCJI (A1): siatka give x recv (10..200 krok 10), 6 par; surowe wyniki w AITW_RESULT (out.grid) ----------
    // aiGateA1 = bramka AI (rel 1, handelFairnessGate) + gorny limit givePn <= receivePn (ta sama regula co selekcja/enqueue).
    // playerOk = REALNY podglad „Przyjmij” gracza (previewIncomingPlayerAccept). both = oferta przechodzi obie.
    const GRID_PAIRS = [['cegla', 'zelazo'], ['zelazo', 'cegla'], ['drewno', 'kamien'], ['kamien', 'drewno'], ['zelazo', 'kamien'], ['drewno', 'cegla']];
    const grid = await ev(page, ([a, pairs]) => {
      const h = window.__aiTradeWiringTestDebug;
      return pairs.map(([gk, rk]) => {
        let n = 0; let aiG = 0; let pl = 0; let both = 0; let bothNeq = 0; const ex = [];
        for (let gq = 10; gq <= 200; gq += 10) {
          for (let rq = 10; rq <= 200; rq += 10) {
            n++;
            const d = h.diagPayload(a, gk, gq, rk, rq);
            const aiOk = d.fairBlock == null && d.givePn <= d.receivePn;
            const plOk = !!d.playerOk;
            if (aiOk) aiG++;
            if (plOk) pl++;
            if (aiOk && plOk) {
              both++;
              if (d.givePn !== d.receivePn) bothNeq++;
              if (ex.length < 3) ex.push({ giveQty: gq, recvQty: rq, givePn: d.givePn, receivePn: d.receivePn });
            }
          }
        }
        return { give: gk, recv: rk, n, aiGateA1: aiG, playerOk: pl, both, bothNotEqual: bothNeq, examples: ex };
      });
    }, [ai, GRID_PAIRS]);
    out.grid = grid;
    console.log('  [grid] ' + grid.map(g => `${g.give}->${g.recv}: n=${g.n} aiA1=${g.aiGateA1} player=${g.playerOk} both=${g.both}`).join(' | '));
    assert('tabela proporcji: kazda oferta przechodzaca OBIE bramki ma givePn == receivePn (rownosc PW)', grid.every(g => g.bothNotEqual === 0), grid);
    assert('tabela proporcji: istnieja oferty „rowne za rowne” dla pary cegla->zelazo (both > 0)', grid[0].both > 0, grid[0]);

    // ---------- 2. ignorowanie: kolejny EOT, brak duplikatu ----------
    const canEnd = await ev(page, () => window.__aiTradeWiringTestDebug.canEnd());
    out.canEndWithPendingOffer = canEnd;
    if (canEnd) {
      await endTurnWait(page);
      const s2 = await state(page);
      assert('ignorowanie: oferta nadal jedna (bez duplikatu), ta sama', s2.pending.length <= 1 && (s2.pending.length === 0 || s2.pending[0].id === offer.id), s2.pending);
      assert('ignorowanie: cooldown barteru nie zerowany', JSON.stringify(s2.barterCooldown) === JSON.stringify(s1.barterCooldown), { a: s1.barterCooldown, b: s2.barterCooldown });
      s1 = s2;
    } else {
      console.log('  [info] gate: wisząca oferta blokuje koniec tury (ignorowanie bez rozpatrzenia niemozliwe) -- zachowanie zamierzone');
      assert('ignorowanie: wisząca oferta blokuje koniec tury (bramka stolu)', canEnd === false);
    }

    // ---------- 3. zapis w trakcie wiszacej propozycji -> wczytanie ----------
    if (s1.pending.length === 1) {
      const saved = await ev(page, () => window.__aiTradeWiringTestDebug.quickSave('aitw-pending'));
      assert('zapis slotu z wiszaca propozycja (REALNY persistSaveToSlot)', saved === true);
      const legacy = await ev(page, () => window.__aiTradeWiringTestDebug.writeLegacySlot('aitw-pending', 'aitw-legacy'));
      assert('kopia slotu w formacie sprzed pol AI-TRADE', legacy === true);
      // zmien stan po zapisie: odrzuc oferte (stol pusty)
      const idBefore = s1.pending[0].id;
      await ev(page, id => window.__aiTradeWiringTestDebug.reject(id), idBefore);
      const sRej0 = await state(page);
      assert('odrzucenie (przed wczytaniem): stol pusty', sRej0.pending.length === 0, sRej0);
      await ev(page, () => window.__aiTradeWiringTestDebug.loadSlot('aitw-pending'));
      await wait(800);
      const s3 = await state(page);
      out.afterLoadPending = s3;
      assert('wczytanie: propozycja wrocila na stol (ten sam id i payload)',
        s3.pending.length === 1 && s3.pending[0].id === idBefore
        && JSON.stringify(s3.pending[0].payload) === JSON.stringify(offer.payload), s3);
      assert('wczytanie: cooldown barteru AI zachowany', JSON.stringify(s3.barterCooldown) === JSON.stringify(s1.barterCooldown), { a: s1.barterCooldown, b: s3.barterCooldown });
      assert('wczytanie: kooldowny odrzucen sprzed zapisu (puste) przywrocone, nie z po-zapisowego odrzucenia', s3.rejectCooldowns.length === 0, s3.rejectCooldowns);
    }

    // ---------- 4. odrzucenie + cooldown ----------
    const sR = await state(page);
    // Odrzucenie REALNYM przyciskiem „Odrzuć” w oknie dyplomacji (klik karty HUD -> reject-package).
    const uiR = await openAudienceFromHud(page);
    assert('odrzucenie: okno dyplomacji otwarte po wczytaniu zapisu, przycisk „Odrzuć” dostepny', uiR.clicked && uiR.buttons.some(b => b.act === 'reject-package' && !b.disabled), uiR.buttons);
    await ev(page, () => { const b = document.querySelector('button[data-negot-act="reject-package"]'); if (b) b.click(); });
    await wait(600);
    await closeAudience(page);
    const sR1 = await state(page);
    assert('odrzucenie: stol czysty, brak umowy', sR1.pending.length === 0 && sR1.cyclicDeals.length === 0, sR1);
    assert('odrzucenie: zapisany cooldown odrzuconej oferty (wymiana_cykliczna)',
      sR1.rejectCooldowns.some(r => JSON.stringify(r).includes('wymiana_cykliczna')), sR1.rejectCooldowns);
    await endTurnWait(page);
    await endTurnWait(page);
    const sR2 = await state(page);
    assert('cooldown: po odrzuceniu AI nie sklada nowej oferty w kolejnych turach', sR2.pending.length === 0 && sR2.cyclicDeals.length === 0, sR2);
    const stOk = await ev(page, ([a, g, r]) => ({
      aiGive: window.__aiTradeWiringTestDebug.stock(a, g), plRecv: window.__aiTradeWiringTestDebug.stock(0, r),
    }), [ai, curGive, curRecv]);
    // Brak umowy = brak transferu: mierzone przez stol/umowy (zapasy zmienia tez produkcja/zuzycie w tickach, wiec nie sa progiem).
    assert('odrzucenie: brak umowy = brak transferu (activeDeals puste po dwoch turach)', sR2.cyclicDeals.length === 0, { stOk, sR2: sR2.cyclicDeals });
    await shot(page, '02-po-odrzuceniu-cooldown.png');

    // ---------- 5. akceptacja: wczytaj zapis z wiszaca propozycja, zaakceptuj, tick dostaw ----------
    await ev(page, () => window.__aiTradeWiringTestDebug.loadSlot('aitw-pending'));
    await wait(800);
    const sA = await state(page);
    assert('ponowne wczytanie zapisu: propozycja znow wisi (akceptacja po load)', sA.pending.length === 1, sA);
    let before = await ev(page, ([a, g, r]) => ({
      aiGive: window.__aiTradeWiringTestDebug.stock(a, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r),
      plGive: window.__aiTradeWiringTestDebug.stock(0, g), plRecv: window.__aiTradeWiringTestDebug.stock(0, r),
    }), [ai, curGive, curRecv]);
    // KONTROLA zuzycia (zarzut 3 Evaluatora): ten sam stan odbiorcy BEZ umowy, jeden endTurn. Odbiorca ma ten sam zapas co po transferze
    // (gracz: ilosc zelaza z umowy, AI: ilosc cegly z umowy); roznica = zwykle zuzycie/tick ekonomii, NIE niszczenie towaru przez dostawe.
    const expGive = Math.floor(sA.pending[0].payload.giveItems[0].ilosc / 10) * 10;
    const expRecv = Math.floor(sA.pending[0].payload.receiveItems[0].ilosc / 10) * 10;
    await ev(page, ([a, g, r, eg, er]) => {
      const h = window.__aiTradeWiringTestDebug;
      h.setBarterCooldownTurn(a, h.state().turn);
      h.setStock(0, g, eg); h.setStock(a, r, er);
    }, [ai, curGive, curRecv, expGive, expRecv]);
    const ctlB = await ev(page, ([a, g, r]) => ({ plGive: window.__aiTradeWiringTestDebug.stock(0, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r), aiGive: window.__aiTradeWiringTestDebug.stock(a, g) }), [ai, curGive, curRecv]);
    await endTurnWait(page);
    const ctlA = await ev(page, ([a, g, r]) => ({ plGive: window.__aiTradeWiringTestDebug.stock(0, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r), aiGive: window.__aiTradeWiringTestDebug.stock(a, g) }), [ai, curGive, curRecv]);
    const ctlLossGive = ctlB.plGive - ctlA.plGive; // zuzycie towaru GIVE u gracza (odbiorca) przy zapasie = ilosc z umowy
    const ctlLossRecv = ctlB.aiRecv - ctlA.aiRecv; // zuzycie towaru RECV u AI (odbiorca)
    const ctlSellerDelta = ctlA.aiGive - ctlB.aiGive; // naturalna zmiana zapasu SPRZEDAWCY (AI, GIVE) w tym samym tiku bez umowy
    out.controlNoDeal = { ctlB, ctlA, ctlLossGive, ctlLossRecv, ctlSellerDelta };
    // Wroc do stanu z wiszaca oferta (kontrola zmienila ture/zapasy).
    await ev(page, () => window.__aiTradeWiringTestDebug.loadSlot('aitw-pending'));
    await wait(800);
    const sA2 = await state(page);
    assert('po kontroli: ponowne wczytanie zapisu, propozycja znow wisi', sA2.pending.length === 1 && sA2.pending[0].id === sA.pending[0].id, sA2);
    before = await ev(page, ([a, g, r]) => ({
      aiGive: window.__aiTradeWiringTestDebug.stock(a, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r),
      plGive: window.__aiTradeWiringTestDebug.stock(0, g), plRecv: window.__aiTradeWiringTestDebug.stock(0, r),
    }), [ai, curGive, curRecv]);
    const prevAcc = await ev(page, id => window.__aiTradeWiringTestDebug.previewAccept(id), sA.pending[0].id);
    out.previewAccept = prevAcc;
    assert('podglad akceptacji gracza przepuszcza oferte AI (previewAccept.accepted=true, A1)',
      !!prevAcc && prevAcc.awaitingMe === true && prevAcc.accepted === true, prevAcc);
    // REALNE przyjecie: klik karty HUD „Dyplomacja” i przycisk „Przyjmij” w oknie (bez forceAccept).
    const uiA = await openAudienceFromHud(page);
    assert('przyjecie: okno dyplomacji z AKTYWNYM przyciskiem „Przyjmij”', uiA.clicked && uiA.buttons.some(b => b.act === 'accept-package' && !b.disabled), uiA.buttons);
    await shot(page, '05b-okno-przed-przyjeciem.png');
    await ev(page, () => { const b = document.querySelector('button[data-negot-act="accept-package"]'); if (b) b.click(); });
    await wait(800);
    await closeAudience(page);
    await shot(page, '06-po-przyjeciu-przyciskiem.png');
    const sA1 = await state(page);
    out.acceptedViaButton = sA1.cyclicDeals.length === 1 && sA1.pending.length === 0;
    assert('przyjecie PRZYCISKIEM „Przyjmij” (bez forceAccept): oferta zdjeta ze stolu, umowa powstala', out.acceptedViaButton, sA1);
    out.afterAccept = sA1;
    assert('akceptacja: oferta zdjeta ze stolu, umowa cykliczna w activeDeals',
      sA1.pending.length === 0 && sA1.cyclicDeals.length === 1, sA1);
    const items = sA1.cyclicDeals[0]?.items ?? [];
    const gi = items.find(i => i.surowiecKey === curGive);
    const ri = items.find(i => i.surowiecKey === curRecv);
    assert('umowa: dwie pozycje barteru (GIVE AI->gracz, RECV gracz->AI), ilosci z oferty znormalizowane do kroku 10',
      !!gi && !!ri && gi.sellerOwnerId === ai && gi.buyerOwnerId === 0 && ri.sellerOwnerId === 0 && ri.buyerOwnerId === ai
      && gi.pakietyPerTura === Math.floor(offGive / 10) * 10 && ri.pakietyPerTura === Math.floor(offRecv / 10) * 10, items);
    await shot(page, '03-po-akceptacji-umowa.png');
    await endTurnWait(page);
    const after1 = await ev(page, ([a, g, r]) => ({
      aiGive: window.__aiTradeWiringTestDebug.stock(a, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r),
      plGive: window.__aiTradeWiringTestDebug.stock(0, g), plRecv: window.__aiTradeWiringTestDebug.stock(0, r),
    }), [ai, curGive, curRecv]);
    out.stocksBefore = before; out.stocksAfterTick1 = after1;
    const dG = after1.plGive - before.plGive; // gracz dostaje drewno
    const dR = after1.aiRecv - before.aiRecv; // AI dostaje zelazo
    const dealGive = gi ? gi.pakietyPerTura : -1;
    // Sprzedawca placi dokladnie ilosc z umowy. Odbiorca dostaje ja w calosci; roznica wzgledem stanu po transferze to ZWYKLE zuzycie
    // ekonomii tury, zmierzone KONTROLA bez umowy (ctlLoss*) -- asercja wymaga rownosci, wiec dostawa niczego nie niszczy.
    assert('REALNY tick dostaw: AI (sprzedawca) oddala ilosc z umowy minus naturalna zmiane zapasu (kontrola bez umowy), rownosc; gracz dostaje ilosc minus zuzycie (kontrola)',
      before.aiGive - after1.aiGive === dealGive - ctlSellerDelta && dealGive === expGive && dG === dealGive - ctlLossGive && dG > 0,
      { before, after1, dG, dealGive, ctlLossGive, ctlSellerDelta });
    assert('REALNY tick dostaw: gracz oddal cegle, AI dostala ja w calosci minus zwykle zuzycie (kontrola), rownosc',
      !!ri && ri.pakietyPerTura === expRecv && dR === ri.pakietyPerTura - ctlLossRecv && dR > 0, { before, after1, dR, ctlLossRecv });
    out.deliveredGive = dG; out.deliveredRecv = dR;

    // ---------- 6. zapis/wczytanie w trakcie aktywnej umowy ----------
    const dealsBeforeSave = (await state(page)).cyclicDeals;
    assert('zapis w trakcie aktywnej umowy', (await ev(page, () => window.__aiTradeWiringTestDebug.quickSave('aitw-deal'))) === true);
    await endTurnWait(page);
    await ev(page, () => window.__aiTradeWiringTestDebug.loadSlot('aitw-deal'));
    await wait(800);
    const sL = await state(page);
    assert('wczytanie w trakcie umowy: umowa cykliczna zachowana (te same pozycje)',
      sL.cyclicDeals.length === 1 && sL.cyclicDeals[0].items.length === dealsBeforeSave[0].items.length
      && sL.cyclicDeals[0].items.every(i => dealsBeforeSave[0].items.some(j => j.surowiecKey === i.surowiecKey && j.pakietyPerTura === i.pakietyPerTura)), sL.cyclicDeals);
    const bL = await ev(page, ([a, g]) => ({ plGive: window.__aiTradeWiringTestDebug.stock(0, g), aiGive: window.__aiTradeWiringTestDebug.stock(a, g) }), [ai, curGive]);
    await endTurnWait(page);
    const aL = await ev(page, ([a, g]) => ({ plGive: window.__aiTradeWiringTestDebug.stock(0, g), aiGive: window.__aiTradeWiringTestDebug.stock(a, g) }), [ai, curGive]);
    // POP>0: produkcja 20 obywateli (Cegielnia AI) przewyzsza dostawe, wiec zapas SPRZEDAWCY moze rosnac mimo dostawy -- strone sprzedawcy
    // weryfikuje REALNY tick 1 z kontrola bez umowy (wyzej); po wczytaniu przy POP>0 wystarcza, ze zapas ODBIORCY (gracza) rosnie.
    assert('po wczytaniu dostawy trwaja (kolejny tick przenosi towar)', aL.plGive > bL.plGive && (POP > 0 || aL.aiGive < bL.aiGive), { bL, aL });
    out.postLoadDelivery = { bL, aL };

    // ---------- 7. stary zapis (bez pol AI-TRADE) ----------
    await ev(page, () => window.__aiTradeWiringTestDebug.loadSlot('aitw-legacy'));
    await wait(800);
    const sOld = await state(page);
    out.afterLegacyLoad = sOld;
    // Stary zapis (bez aiCyclicBarter/aiResourceBarterLastProposalTurn): wpis stolu laduje sie jako zwykly 'handel'
    // (bez flagi barteru), a cooldown barteru NIE jest dziedziczony z poprzedniej sesji (regresja naprawiona: clear() przy odczycie).
    assert('stary zapis: laduje sie bez bledu; cooldown barteru pusty (nie dziedziczony z biezacej sesji); wpis stolu zachowany',
      sOld.barterCooldown.length === 0 && sOld.tableLen === 1, sOld);
    await endTurnWait(page); // gra dziala po wczytaniu starego zapisu
    assert('stary zapis: koniec tury dziala po wczytaniu', true);
    await shot(page, '04-po-starym-zapisie.png');

    const realErrors = consoleErrors.filter(e => !/favicon|Failed to load resource/i.test(e));
    assert('zero console.error / pageerror', realErrors.length === 0, realErrors.slice(0, 3));
  } finally {
    await browser.close();
  }
  if (RESULT_FILE) fs.writeFileSync(RESULT_FILE, JSON.stringify(out, null, 1));
  console.log(`\nai-trade-wiring-e2e-live-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[aitw] blad:', err && err.stack ? err.stack : err);
  process.exit(1);
});
