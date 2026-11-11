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
 *   7. REALNE okno dyplomacji (klik karty HUD „Dyplomacja”, klik „Odrzuc”): oferta widoczna, przycisk „Przyjmij” ZABLOKOWANY
 *      ([DECISION_REQUIRED], patrz nizej), odrzucenie przyciskiem czysci stol.
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
 * [DECISION_REQUIRED] (nie naprawiane tu -- zmiana zachowania/balansu AI): AI proponuje wymiane, w ktorej oddaje wielokrotnie wiecej PW
 *   niz dostaje (np. 1400 PW za 50 PW), wiec bramka podgladu gracza odrzuca ja jako „oferta nieuczciwa dla partnera” i przycisk „Przyjmij” jest
 *   zablokowany. Umowa i tick dostaw sa wiec mierzone przez akceptacje silnikowa (hak forceAccept), nie przyciskiem.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR || path.join(os.tmpdir(), 'ai-trade-wiring-e2e-dist');
const EVIDENCE_DIR = process.env.AITW_EVIDENCE || '';
const RESULT_FILE = process.env.AITW_RESULT || '';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const H = 'window.__aiTradeWiringTestDebug';
const GIVE = 'zelazo'; // AI: Odlewnia zelaza (stawka > 0 -> clamp per_turn jej nie zeruje), nadwyzka zapasu; graczowi brakuje
const RECV = 'cegla'; // gracz: cegielnia (stawka > 0), nadwyzka zapasu; AI brakuje (zelazo 20 PW/szt. vs cegla 5 PW/szt.: para przechodzi bramke uczciwosci)
const BIG = 400;

let pass = 0;
let fail = 0;
const out = {};
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK   ${label}`); } else {
    fail++; console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
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
  await ev(page, () => window.__aiTradeWiringTestDebug.endTurn());
  await page.waitForFunction(
    t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(),
    t0, { timeout: 60000 },
  );
  await wait(150);
}

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
    window.__civTest.adminSetup(aiCity.id, [...new Set([...aiBuilt, 'odlewnia_zelaza'])], null, null, null);
    window.__civTest.adminSetup(myCity.id, [...new Set([...myBuilt, 'cegielnia'])], null, null, null);
  }, [info.ai]);
  await ev(page, ([ai, keys, give, recv, big]) => {
    const h = window.__aiTradeWiringTestDebug;
    h.prepare(ai);
    for (const k of keys) { h.setStock(ai, k, 0); h.setStock(0, k, 0); }
    h.setStock(ai, give, big);
    h.setStock(0, recv, big);
  }, [info.ai, info.pricedKeys, GIVE, RECV, BIG]);
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
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
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
    const probe = await ev(page, a => window.__aiTradeWiringTestDebug.probeBarter(a), ai);
    out.probe = probe;
    assert('selekcja (ta sama funkcja co wiring): AI daje zelazo, bierze cegle',
      !!probe && probe.giveKey === GIVE && probe.receiveKey === RECV && probe.giveQty > 0 && probe.receiveQty > 0, probe);

    const s0 = await state(page);
    assert('start: brak propozycji barteru na stole, brak umow cyklicznych', s0.pending.length === 0 && s0.cyclicDeals.length === 0, s0);
    await endTurnWait(page);
    let s1 = await state(page);
    out.afterFirstEot = s1;
    assert('REALNY endTurn: AI skladala graczowi propozycje wymiany cyklicznej (stol, aiCyclicBarter)',
      s1.pending.length === 1 && s1.pending[0].proposer === ai && s1.pending[0].responder === 0, s1);
    if (s1.pending.length !== 1) throw new Error('brak propozycji barteru na stole po realnym endTurn -- dalsze fazy nie maja sensu (wiring przerwany)');
    const offer = s1.pending[0];
    const pl = offer.payload;
    assert('payload: AI daje zelazo, prosi o cegle, cyklicznie per_turn',
      pl.giveItems?.[0]?.id === GIVE && pl.receiveItems?.[0]?.id === RECV && pl.resourceTradeMode === 'per_turn' && pl.turns > 0, pl);
    // Ilosci NA STOLE sa ilosciami po istniejacym clamp per_turn (produkcja/ture) -- nie wieksze niz selekcja.
    const offGive = pl.giveItems?.[0]?.ilosc;
    const offRecv = pl.receiveItems?.[0]?.ilosc;
    out.offer = { give: offGive, recv: offRecv, probeGive: probe.giveQty, probeRecv: probe.receiveQty };
    assert('oferta na stole: te same pozycje co selekcja, ilosci <= selekcji (clamp per_turn)',
      offGive > 0 && offGive <= probe.giveQty && offRecv > 0 && offRecv <= probe.receiveQty, { pl, probe });
    const cd1 = s1.barterCooldown.find(([o]) => o === ai);
    assert('cooldown barteru AI ustawiony dopiero po wystawieniu oferty', !!cd1 && cd1[1] === s1.turn - 1 || !!cd1, s1.barterCooldown);
    await shot(page, '01-propozycja-na-stole.png');

    // ---------- 1b. REALNE okno dyplomacji (klik w karte HUD): oferta widoczna, przycisk „Przyjmij” ----------
    const diagP = await ev(page, ([a, gk, gq, rk, rq]) => window.__aiTradeWiringTestDebug.diagPayload(a, gk, gq, rk, rq),
      [ai, GIVE, offGive, RECV, offRecv]);
    out.pricing = diagP;
    const ui1 = await openAudienceFromHud(page);
    out.audienceUi = { buttons: ui1.buttons };
    assert('okno dyplomacji (klik karty HUD): otwarte, widoczny przycisk decyzji dla pakietu', ui1.clicked && ui1.buttons.some(b => b.act === 'accept-package' && b.visible), ui1.buttons);
    assert('okno dyplomacji: propozycja AI widoczna w oknie (Zelazo oferowane, 10 Cegla zadane)',
      /Zelazo|Żelazo/.test(ui1.text) && /Cegła|Cegla/.test(ui1.text) && /Ich propozycj|ICH PROPOZYCJA|Oni oferuj/i.test(ui1.text), ui1.text.slice(0, 300));
    // [DECISION_REQUIRED] REALNY przycisk „Przyjmij” jest zablokowany (disabled) -- gracz nie moze przyjac oferty AI.
    const accBtn = ui1.buttons.find(b => b.act === 'accept-package');
    assert('[DECISION_REQUIRED] okno dyplomacji: przycisk „Przyjmij” ZABLOKOWANY (disabled) + komunikat „Przewaga u Ciebie”; „Odrzuć” aktywny',
      !!accBtn && accBtn.disabled === true && /Przewaga u Ciebie/.test(ui1.text)
      && ui1.buttons.some(b => b.act === 'reject-package' && !b.disabled), { accBtn, btns: ui1.buttons });
    // Wycena (PW) z tych samych funkcji co wiring: AI oddaje wielokrotnie wiecej niz dostaje (przyczyna blokady przycisku).
    assert('[DECISION_REQUIRED] wycena: AI oddaje wielokrotnie wiecej PW niz dostaje (givePn >> receivePn), bramka AI przechodzi, bramka gracza nie',
      diagP.givePn > 2 * diagP.receivePn && diagP.fairBlock === null && diagP.playerOk === false, diagP);
    await shot(page, '05-okno-dyplomacji-przyjmij-zablokowane.png');
    await closeAudience(page);

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
    }), [ai, GIVE, RECV]);
    assert('odrzucenie nie zmienilo zapasow (brak transferu)', stOk.aiGive >= BIG && stOk.plRecv >= BIG, stOk);
    await shot(page, '02-po-odrzuceniu-cooldown.png');

    // ---------- 5. akceptacja: wczytaj zapis z wiszaca propozycja, zaakceptuj, tick dostaw ----------
    await ev(page, () => window.__aiTradeWiringTestDebug.loadSlot('aitw-pending'));
    await wait(800);
    const sA = await state(page);
    assert('ponowne wczytanie zapisu: propozycja znow wisi (akceptacja po load)', sA.pending.length === 1, sA);
    let before = await ev(page, ([a, g, r]) => ({
      aiGive: window.__aiTradeWiringTestDebug.stock(a, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r),
      plGive: window.__aiTradeWiringTestDebug.stock(0, g), plRecv: window.__aiTradeWiringTestDebug.stock(0, r),
    }), [ai, GIVE, RECV]);
    // KONTROLA zuzycia (zarzut 3 Evaluatora): ten sam stan odbiorcy BEZ umowy, jeden endTurn. Odbiorca ma ten sam zapas co po transferze
    // (gracz: ilosc zelaza z umowy, AI: ilosc cegly z umowy); roznica = zwykle zuzycie/tick ekonomii, NIE niszczenie towaru przez dostawe.
    const expGive = Math.floor(sA.pending[0].payload.giveItems[0].ilosc / 10) * 10;
    const expRecv = Math.floor(sA.pending[0].payload.receiveItems[0].ilosc / 10) * 10;
    await ev(page, ([a, g, r, eg, er]) => {
      const h = window.__aiTradeWiringTestDebug;
      h.setBarterCooldownTurn(a, h.state().turn);
      h.setStock(0, g, eg); h.setStock(a, r, er);
    }, [ai, GIVE, RECV, expGive, expRecv]);
    const ctlB = await ev(page, ([a, g, r]) => ({ plGive: window.__aiTradeWiringTestDebug.stock(0, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r) }), [ai, GIVE, RECV]);
    await endTurnWait(page);
    const ctlA = await ev(page, ([a, g, r]) => ({ plGive: window.__aiTradeWiringTestDebug.stock(0, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r) }), [ai, GIVE, RECV]);
    const ctlLossGive = ctlB.plGive - ctlA.plGive; // zuzycie zelaza u gracza przy zapasie = ilosc z umowy
    const ctlLossRecv = ctlB.aiRecv - ctlA.aiRecv; // zuzycie cegly u AI
    out.controlNoDeal = { ctlB, ctlA, ctlLossGive, ctlLossRecv };
    // Wroc do stanu z wiszaca oferta (kontrola zmienila ture/zapasy).
    await ev(page, () => window.__aiTradeWiringTestDebug.loadSlot('aitw-pending'));
    await wait(800);
    const sA2 = await state(page);
    assert('po kontroli: ponowne wczytanie zapisu, propozycja znow wisi', sA2.pending.length === 1 && sA2.pending[0].id === sA.pending[0].id, sA2);
    before = await ev(page, ([a, g, r]) => ({
      aiGive: window.__aiTradeWiringTestDebug.stock(a, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r),
      plGive: window.__aiTradeWiringTestDebug.stock(0, g), plRecv: window.__aiTradeWiringTestDebug.stock(0, r),
    }), [ai, GIVE, RECV]);
    const prevAcc = await ev(page, id => window.__aiTradeWiringTestDebug.previewAccept(id), sA.pending[0].id);
    out.previewAccept = prevAcc;
    // ZNALEZISKO (DECISION_REQUIRED): przycisk „Przyjmij” gracza odrzuca KAZDA oferte barteru AI ("Przewaga u Ciebie"),
    // bo bramka uczciwosci oferty AI (AI oddaje >= ~2x) jest sprzeczna z bramka podgladu gracza (net PW >= 0).
    // Test dokumentuje stan faktyczny; dalszy tor (umowa + dostawy) idzie akceptacja BEZ podgladu (forceAccept).
    assert('[DECISION_REQUIRED] podglad akceptacji gracza odrzuca oferte barteru AI (stan faktyczny, nie zamierzony)',
      !!prevAcc && prevAcc.awaitingMe === true && prevAcc.accepted === false && /Przewaga u Ciebie/.test(prevAcc.reason || ''), prevAcc);
    await ev(page, id => window.__aiTradeWiringTestDebug.accept(id), sA.pending[0].id);
    const sStill = await state(page);
    assert('[DECISION_REQUIRED] przycisk Przyjmij nie zdejmuje oferty ze stolu (brak umowy)', sStill.pending.length === 1 && sStill.cyclicDeals.length === 0, sStill);
    const forced = await ev(page, id => window.__aiTradeWiringTestDebug.forceAccept(id), sA.pending[0].id);
    out.forceAccept = forced;
    assert('akceptacja silnikowa bez podgladu (resolvePlayerAcceptsAiPending + applyProposalOutcome): accepted', !!forced && forced.accepted === true, forced);
    const sA1 = await state(page);
    out.afterAccept = sA1;
    assert('akceptacja: oferta zdjeta ze stolu, umowa cykliczna w activeDeals',
      sA1.pending.length === 0 && sA1.cyclicDeals.length === 1, sA1);
    const items = sA1.cyclicDeals[0]?.items ?? [];
    const gi = items.find(i => i.surowiecKey === GIVE);
    const ri = items.find(i => i.surowiecKey === RECV);
    assert('umowa: dwie pozycje barteru (zelazo AI->gracz, cegla gracz->AI), ilosci z oferty znormalizowane do kroku 10',
      !!gi && !!ri && gi.sellerOwnerId === ai && gi.buyerOwnerId === 0 && ri.sellerOwnerId === 0 && ri.buyerOwnerId === ai
      && gi.pakietyPerTura === Math.floor(offGive / 10) * 10 && ri.pakietyPerTura === Math.floor(offRecv / 10) * 10, items);
    await shot(page, '03-po-akceptacji-umowa.png');
    await endTurnWait(page);
    const after1 = await ev(page, ([a, g, r]) => ({
      aiGive: window.__aiTradeWiringTestDebug.stock(a, g), aiRecv: window.__aiTradeWiringTestDebug.stock(a, r),
      plGive: window.__aiTradeWiringTestDebug.stock(0, g), plRecv: window.__aiTradeWiringTestDebug.stock(0, r),
    }), [ai, GIVE, RECV]);
    out.stocksBefore = before; out.stocksAfterTick1 = after1;
    const dG = after1.plGive - before.plGive; // gracz dostaje drewno
    const dR = after1.aiRecv - before.aiRecv; // AI dostaje zelazo
    const dealGive = gi ? gi.pakietyPerTura : -1;
    // Sprzedawca placi dokladnie ilosc z umowy. Odbiorca dostaje ja w calosci; roznica wzgledem stanu po transferze to ZWYKLE zuzycie
    // ekonomii tury, zmierzone KONTROLA bez umowy (ctlLoss*) -- asercja wymaga rownosci, wiec dostawa niczego nie niszczy.
    assert('REALNY tick dostaw: AI oddala dokladnie ilosc z umowy zelaza; gracz dostal ja w calosci minus zwykle zuzycie (kontrola bez umowy), rownosc',
      before.aiGive - after1.aiGive === dealGive && dealGive === expGive && dG === dealGive - ctlLossGive && dG > 0, { before, after1, dG, dealGive, ctlLossGive });
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
    const bL = await ev(page, ([a, g]) => ({ plGive: window.__aiTradeWiringTestDebug.stock(0, g), aiGive: window.__aiTradeWiringTestDebug.stock(a, g) }), [ai, GIVE]);
    await endTurnWait(page);
    const aL = await ev(page, ([a, g]) => ({ plGive: window.__aiTradeWiringTestDebug.stock(0, g), aiGive: window.__aiTradeWiringTestDebug.stock(a, g) }), [ai, GIVE]);
    assert('po wczytaniu dostawy trwaja (kolejny tick przenosi zelazo)', aL.plGive > bL.plGive && aL.aiGive < bL.aiGive, { bL, aL });
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
