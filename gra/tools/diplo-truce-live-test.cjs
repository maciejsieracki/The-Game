'use strict';
const { closeCivWelcome } = require('./_live-ready.cjs');
/**
 * diplo-truce-live-test.cjs — R-WEB-TRUCE-Q1 (runda 5, N5): żywy cykl rozejmu w Chromium.
 *
 * Realny headless Chromium na prawdziwym bundle Vite (?playtest=mapa), zbudowanym do katalogu
 * tymczasowego poza repo (`SKIP_BUILD=1` pomija budowanie, gdy bundle już jest).
 *
 *  U1. UI: audiencja AI -> przycisk „Zaproponuj pokój" (data-aid="10") -> modal; przełącznik
 *      „Rozejm" i chip „5 tur" zmieniają ukryte pola (`.cdb-treaty-peacekind`, `.cdb-treaty-truceturns`).
 *      Zrzut modala do katalogu runu. Wysłanie: wpis stołu ma akcję 'rozejm' i turns=5.
 *  L1. Akceptacja rozejmu (REALNA ścieżka applyProposalOutcome): status pary 'pokoj',
 *      truceUntilTurn = tura + 5, peaceUntilTurn = null (rozejm nie zakłada blokady DOW).
 *  L2. Okno rozejmu: w turach przed wygaśnięciem status nadal 'pokoj'; w turze wygaśnięcia
 *      (R-WEB-TEST-DEBT-BASE-RED-FALA741-Q1, decyzja #169): w scenariuszu L2b inicjatorem rozejmu jest AI
 *      (acceptTruceForTest(AI,…)), więc adresatem pokoju stałego jest GRACZ. Mechanizm (diplomacy-peace-lock.ts
 *      truceEndTickPair, gałąź `ports.isHuman(target)`): po wygaśnięciu powstaje OFERTA W SKRZYNCE GRACZA
 *      (`truceEndOffer`, bez natychmiastowej decyzji AI); status zostaje 'pokoj', truceUntilTurn czyszczony,
 *      peaceUntilTurn pozostaje null (pokój stały NIE zawarty), BEZ flagi agresora i BEZ kary
 *      (brak 'zlamanie_paktu_nap' w zdarzeniach Wiarygodności gracza). Asercja L2b sprawdza status 'pokoj',
 *      brak peaceUntilTurn (wariant „AI akceptuje od razu” zawarłby pokój stały i ustawił peaceUntilTurn)
 *      oraz brak wojny. Obecności wpisu w skrzynce nie widać z poziomu testu (brak haka odczytu skrzynki
 *      w main.ts, poza allowlistą) — rozróżnienie opiera się na peaceUntilTurn.
 *  L2f–L2h. Brak odpowiedzi gracza na ofertę pokoju stałego (timeout) = wojna bez kary (ten sam wariant
 *      oferty w skrzynce, inicjator AI; kolejna tura bez odpowiedzi = truceEndToWarCore).
 *
 * POKRYCIE (stan na tę rundę):
 *  - POKRYTE: rozejm 5 tur z UI i z akceptacji AI (L1, U1); okno rozejmu (L2a); wygaśnięcie rozejmu z ofertą
 *    pokoju stałego w skrzynce gracza, bez wojny i bez kary (L2b, L2g); brak odpowiedzi gracza = wojna bez kary
 *    (L2h); złamanie rozejmu w oknie = kara + flaga (L3).
 *  - L4 (R-WEB-TEST-HOOK-AI-TRUCE-REFUSAL-Q1, HOOKAI): odmowa AI wobec propozycji rozejmu GRACZA — hak civTest
 *    `forceAiTruceDecisionForTest('reject')` + `playerProposeTruceForTest(ai, 5)` w `__truceTestDebug` (widoczny tylko
 *    przy ?civTest=1). Asercje: wojna trwa, brak rozejmu/pokoju stałego, brak kary zlamanie_paktu_nap i flagi agresora.
 *  - NIE POKRYTE (2): wariant „AI akceptuje od razu po wygaśnięciu” (inicjator = GRACZ, adresat = AI) — ta
 *    gałąź truceEndTickPair (`truceEndAiAccepts`) nie ma scenariusza, bo acceptTruceForTest zawsze ustawia AI
 *    jako proponującego. Zamknięcie wymaga haka z inicjatorem-graczem (propozycja proposal-level), NIE
 *    implementowane tutaj.
 *  - NIE POKRYTE (3): jawna akceptacja lub odrzucenie oferty pokoju przez GRACZA w UI (tylko timeout).
 *  L3. Złamanie: rozejm 5 tur, wypowiedzenie wojny w oknie (REALNE ownerDeclareWarOn) →
 *      kara 'zlamanie_paktu_nap' w Wiarygodności gracza + flaga agresora dla pary,
 *      truceUntilTurn czyszczony.
 *  C.  Zero pageerror / console.error w całym scenariuszu.
 *
 * Usage (z gra/): node tools/diplo-truce-live-test.cjs [scratchDirAbs] [evidenceDirAbs]
 *   Najpierw bundle: node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir
 *   potem: SKIP_BUILD=1 node tools/diplo-truce-live-test.cjs <scratch>
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-truce-live-' + process.pid);
// R-TEST-DEBT-BASE-RED-MAIN-Q2 (obrona r1, zarzut 3): domyślny katalog bundle (os.tmpdir) jest sprzątany po teście;
// podany ręcznie przez argv[2] zostaje (użytkownik może go ponownie użyć z SKIP_BUILD=1).
if (!process.argv[2]) process.on('exit', () => { try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (_) { /* best-effort */ } });
// R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1: domyślny katalog zrzutów poza repo (zrzut do śledzonego pliku brudził git).
// Podanie katalogu jako argv[3] nadal działa.
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const EVIDENCE = process.argv[3]
  || path.join(os.tmpdir(), 'civ-truce-evidence-' + TMPDIR_RUN_ID);
// R-TEST-DEBT-BASE-RED-MAIN-Q2 (klasa A, dowód z przebiegu: log „[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)”
// i tekst gry „Nie można zakończyć tury. Spichlerz państwa (żywność): po zakończeniu tury zabraknie 46”): bramka NNS
// (R-WEB-ECON-NO-NEGATIVE-STOCKS, decyzje #365/#368) blokuje endTurn od tury 2, bo scenariusz nie ma bufora żywności.
// Hak bufora (__nnsMeasureDebug.setPlayerGranary) jest tylko przy ?civTest=1, więc URL dopina civTest=1 (bez zmiany logiki gry).
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';

const PLAYER = 0;
const AI = 1;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) {
    console.log('[truce-live] SKIP_BUILD=1 — używam istniejącego bundle:', SCRATCH);
    return;
  }
  console.log('[truce-live] vite build do katalogu tymczasowego:', SCRATCH);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  await closeCivWelcome(page);
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

/** Kończy tury (nie miejsca): endTurn przesuwa miejsce, pełna tura wymaga kilku wywołań. */
async function endUntilTurn(page, target) {
  for (let i = 0; i < 40; i++) {
    const cur = await page.evaluate(() => window.__truceTestDebug.turn());
    if (cur >= target) return cur;
    if (process.env.TRUCE_DEBUG === '1') {
      const dbg = await page.evaluate(() => ({ ws: window.__eraTestDebug.getWorldState(), modal: !!document.querySelector('.civ-diplo-basket-overlay, .civ-diplo-audience, [role=dialog]') }));
      console.log('      dbg', i, JSON.stringify(dbg).slice(0, 300));
    }
    await endOneTurn(page);
  }
  // Diagnostyka stanu przy przerwaniu (klasyfikacja: tura nie rusza = blokada endTurn, a nie limit czasu).
  const st = await page.evaluate(() => ({
    turn: window.__truceTestDebug.turn(),
    inProgress: window.__eraTestDebug.isEndTurnInProgress(),
    overlays: document.querySelectorAll('.civ-diplo-basket-overlay, .civ-diplo-audience, [role=dialog]').length,
    gateText: (document.body.innerText.match(/Zakończ turę[^\n]{0,120}/) || [''])[0],
    overlayHtml: Array.from(document.querySelectorAll('.civ-diplo-basket-overlay, .civ-diplo-audience, [role=dialog]')).map(n => n.className + ' :: ' + (n.innerText || '').slice(0, 160)),
    nnsText: (document.body.innerText.match(/[^\n]{0,80}(skarb|spichlerz|Spichlerz|Skarb)[^\n]{0,120}/g) || []).slice(0, 4),
  })).catch((e) => ({ err: String(e) }));
  throw new Error('endUntilTurn: nie osiągnięto tury ' + target + ' stan=' + JSON.stringify(st));
}

async function pairState(page) {
  return page.evaluate(([a, b]) => window.__truceTestDebug.pairState(a, b), [PLAYER, AI]);
}

// R-TEST-DEBT-BASE-RED-MAIN-Q2 (klasa D, niestabilność czasowa): endTurn jest asynchroniczny (przetwarzanie tury AI).
// Wywołanie w trakcie przetwarzania jest ignorowane, a stałe 150 ms + limit 400 prób nie nadążały. Czekamy więc na
// stan gry (isEndTurnInProgress) zamiast na czas. Hak __eraTestDebug.isEndTurnInProgress już istnieje (main.ts).
async function waitEndTurnIdle(page) {
  await page.waitForFunction(() => !window.__eraTestDebug.isEndTurnInProgress(), undefined, { timeout: 180000 });
}
async function endOneTurn(page) {
  await waitEndTurnIdle(page);
  // R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1 (STARY-PIN): bufor spichlerza z setupu (999) nie wystarcza na kilka tur po
  // R-WEB-UPKEEPMULT (żywność jednostek ×4/×16/×64). Bramka NNS (no-negative-stocks) słusznie blokuje koniec tury
  // przy prognozie < 0, bo gracz ma ruch naprawczy. Test dosypuje dodatnie zasoby, gdy bramka blokuje — jak
  // runner pomiaru i inne testy live. Asercje rozejmu bez zmian.
  await page.evaluate(() => {
    const d = window.__aiTradeWiringTestDebug;
    if (d && d.nnsGateBlocked()) { d.grantPlayerGold(300); d.grantPlayerFood(300); }
  });
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await waitEndTurnIdle(page);
  await wait(100);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[truce-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
    if (process.env.TRUCE_DEBUG === '1' && /EndTurn|blocked/.test(m.text())) console.log('      warn', m.text().slice(0, 200));
  });

  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(([ai]) => window.__truceTestDebug.setWarAge(ai, 30), [AI]);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    // SETUP (nie tematu testu): bufor spichlerza gracza, by bramka NNS nie blokowała endTurn w pętli tur (patrz OUT_HTML).
    // setPlayerGranary zwraca void; skuteczność potwierdza przejście pętli tur w L2 (endUntilTurn bez wyjątku).
    await page.evaluate(() => window.__nnsMeasureDebug.setPlayerGranary(999));

    // --- U1: UI modal rozejmu ---
    console.log('U1 UI: modal pokoj/rozejm');
    await page.evaluate(([ai]) => window.__truceTestDebug.openAudience(ai), [AI]);
    await page.waitForSelector('button[data-aid="10"]', { timeout: 20000 });
    await page.locator('button[data-aid="10"]').first().click({ timeout: 10000 });
    await page.waitForSelector('.cdb-chip-peacekind', { timeout: 20000 });
    const defaultKind = await page.evaluate(() => (document.querySelector('.cdb-treaty-peacekind'))?.value ?? null);
    assert('U1a domyślnie rodzaj = pokoj', defaultKind === 'pokoj', defaultKind);
    assert('U1b w trybie pokoju brak chipów rozejmu', (await page.locator('.cdb-chip-truceturns').count()) === 0);
    await page.locator('.cdb-chip-peacekind[data-kind="rozejm"]').click({ timeout: 10000 });
    await wait(200);
    const kindAfter = await page.evaluate(() => (document.querySelector('.cdb-treaty-peacekind'))?.value ?? null);
    assert('U1c przełącznik na rozejm zmienia pole', kindAfter === 'rozejm', kindAfter);
    assert('U1d rozejm pokazuje 3 chipy 5/10/15', (await page.locator('.cdb-chip-truceturns').count()) === 3);
    await page.locator('.cdb-chip-truceturns[data-turns="5"]').click({ timeout: 10000 });
    await wait(200);
    const turnsAfter = await page.evaluate(() => (document.querySelector('.cdb-treaty-truceturns'))?.value ?? null);
    assert('U1e chip 5 tur zapisuje długość', turnsAfter === '5', turnsAfter);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}' });
    await page.screenshot({ path: path.join(EVIDENCE, 'truce-01-modal-rozejm-5.png') });
    const submitDisabled = await page.locator('.cdb-submit').first().isDisabled().catch(() => true);
    assert('U1f przycisk wyślij aktywny', !submitDisabled);
    if (!submitDisabled) {
      // R-TEST-DEBT-BASE-RED-MAIN-Q2 (klasa D): Playwright click czekał 10 s na stabilność przycisku, który po re-renderze
      // modala bywa odtwarzany (sonda: przycisk widoczny, włączony, nieprzykryty). Klik DOM po potwierdzeniu stanu
      // (U1f: aktywny) wywołuje tę samą obsługę zdarzenia.
      await page.waitForFunction(() => { const b = document.querySelector('.cdb-submit'); return !!b && !b.disabled; }, undefined, { timeout: 10000 });
      await page.evaluate(() => document.querySelector('.cdb-submit').click());
      await wait(300);
      const entries = await page.evaluate(() => window.__truceTestDebug.negotiationEntries());
      const truceEntry = entries.find(e => e.actionId === 'rozejm' && e.turns === 5);
      assert('U1g wysłanie z UI trafia na stół jako rozejm 5 tur', !!truceEntry, entries);
    }

    // Zamknij modal i audiencję: otwarty modal blokuje zakończenie tury (bramka endTurn).
    await page.evaluate(() => window.__truceTestDebug.closeAudience());
    await wait(300);
    const modalsLeft = await page.evaluate(() => document.querySelectorAll('.civ-diplo-basket-overlay').length);
    assert('U1h modal koszyka zamknięty po wysłaniu', modalsLeft === 0, modalsLeft);

    // --- L1: akceptacja rozejmu ---
    console.log('L1 akceptacja rozejmu');
    const t0 = (await pairState(page)).turn;
    const acc = await page.evaluate(([ai]) => window.__truceTestDebug.acceptTruceForTest(ai, 5), [AI]);
    assert('L1a akceptacja przechodzi (accepted)', acc.accepted === true, acc);
    const s1 = await pairState(page);
    assert('L1b status pary = pokoj po rozejmie', s1.status === 'pokoj', s1);
    assert('L1c truceUntilTurn = tura + 5', s1.truceUntilTurn === t0 + 5, { t0, s1 });
    assert('L1d rozejm nie zakłada peaceUntilTurn', s1.peaceUntilTurn === null, s1);

    // --- L2: okno i wygaśnięcie bez kary ---
    console.log('L2 okno rozejmu i wygaśnięcie');
    const credBefore = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).length, [PLAYER]);
    // R-TEST-DEBT-BASE-RED-MAIN-Q2 (klasa D, harness): po L1 zostaje otwarte okno audiencji/koszyka (overlay), a otwarty
    // modal blokuje endTurn (bramka z U1h). Sonda: tura 2 zamiast 5, bez przetwarzania, 1 overlay. Zamykamy audiencję
    // przed pętlą tur i czekamy na brak overlay (stan, nie czas).
    await page.evaluate(() => window.__truceTestDebug.closeAudience());
    // Bez połykania błędu: jeśli okno koszyka/audiencji zostaje, test pada z jawnym powodem (nie maskuje przyczyny).
    const overlayClosed = await page.waitForFunction(() => document.querySelectorAll('.civ-diplo-basket-overlay, .civ-diplo-audience').length === 0, undefined, { timeout: 15000 }).then(() => true, () => false);
    assert('L2-pre okno koszyka/audiencji zamknięte przed pętlą tur', overlayClosed);
    await endUntilTurn(page, t0 + 4);
    const sWin = await pairState(page);
    assert('L2a w oknie (tura < until) status nadal pokoj', sWin.turn < t0 + 5 && sWin.status === 'pokoj' && sWin.truceUntilTurn === t0 + 5, sWin);
    await endUntilTurn(page, t0 + 5);
    const sExp = await pairState(page);
    // L2b (R-WEB-TEST-DEBT-BASE-RED-FALA741-Q1, klasa A; mechanizm: diplomacy-peace-lock.ts truceEndTickPair, decyzja #169):
    // inicjatorem rozejmu jest AI, więc adresatem propozycji pokoju stałego po wygaśnięciu jest GRACZ. Wygaśnięcie
    // tworzy OFERTĘ W SKRZYNCE GRACZA (truceEndOffer), a nie natychmiastową decyzję AI. Dlatego asercja L2b wymaga:
    // status 'pokoj' (brak wojny), truceUntilTurn wyczyszczony (L2c), ORAZ peaceUntilTurn === null — pokój stały nie
    // został zawarty w tej turze. Wariant „AI akceptuje od razu” zawarłby pokój stały przez finalizePeace (ustawia
    // peaceUntilTurn), więc ten warunek go odróżnia. Wariant „AI odrzuca od razu” daje status 'wojna' (też czerwone).
    // Brak wpisu w skrzynce nie jest widoczny z testu (brak haka odczytu), stąd rozróżnienie po peaceUntilTurn.
    assert('L2b w turze wygaśnięcia rozejmu: status pokoj, bez wojny (oferta pokoju stałego dla gracza, nie decyzja AI)', sExp.turn === t0 + 5 && sExp.status === 'pokoj', sExp);
    assert('L2b2 oferta czeka na gracza: pokój stały NIE zawarty w turze wygaśnięcia (peaceUntilTurn null)', sExp.peaceUntilTurn === null, sExp);
    assert('L2c truceUntilTurn wyczyszczony', sExp.truceUntilTurn === null, sExp);
    const flags = await page.evaluate(() => window.__truceTestDebug.aggressorFlags());
    assert('L2d brak flagi agresora po wygaśnięciu', Object.keys(flags).length === 0, flags);
    const credAfter = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).length, [PLAYER]);
    const credTyp = await page.evaluate(([p]) => JSON.stringify(window.__truceTestDebug.credibilityEvents(p)), [PLAYER]);
    // Kara za złamanie rozejmu to WYŁĄCZNIE 'zlamanie_paktu_nap'. Inne zdarzenia (np. przemarsz
    // jednostek na terytorium AI, nalicza się też przy pokoju) nie są karą za rozejm.
    assert('L2e brak kary zlamanie_paktu_nap po wygaśnięciu', !credTyp.includes('zlamanie_paktu_nap'), { credBefore, credAfter, credTyp: credTyp.slice(0, 400) });
    // Odmowa AI wobec propozycji GRACZA (L2b-odmowa) — pokryta blokiem L4 niżej (hak civTest HOOKAI, po wojnie).

    // --- L3: złamanie w oknie ---
    console.log('L3 złamanie rozejmu');
    const t1 = (await pairState(page)).turn;
    const acc2 = await page.evaluate(([ai]) => window.__truceTestDebug.acceptTruceForTest(ai, 5), [AI]);
    assert('L3a ponowna akceptacja rozejmu', acc2.accepted === true, acc2);
    const credBreach0 = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).length, [PLAYER]);
    // Casus belli gracza wobec AI: bez złamania wypowiedzenie miałoby przyczynę casus belli (bez flagi).
    // Złamanie rozejmu ma wymusić przyczynę 'bez_powodu' (flaga agresora) MIMO casus belli.
    await page.evaluate(([p, ai]) => window.__aggressorTestDebug.refusalCasusBelli(p, ai), [PLAYER, AI]);
    await page.evaluate(([p, ai]) => window.__truceTestDebug.declareWar(p, ai), [PLAYER, AI]);
    const sBr = await pairState(page);
    assert('L3b wypowiedzenie w oknie zrywa rozejm, wojna', sBr.status === 'wojna' && sBr.truceUntilTurn === null, { t1, sBr });
    const credBreach1 = await page.evaluate(([p]) => JSON.stringify(window.__truceTestDebug.credibilityEvents(p)), [PLAYER]);
    assert('L3c kara zlamanie_paktu_nap za złamanie rozejmu', credBreach1.includes('zlamanie_paktu_nap'), credBreach1.slice(0, 300));
    const flagsBr = await page.evaluate(() => window.__truceTestDebug.aggressorFlags());
    assert('L3d flaga agresora dla złamania rozejmu (mimo casus belli)', Object.keys(flagsBr).length > 0, flagsBr);
    const credCount = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).length, [PLAYER]);
    assert('L3e zdarzenia Wiarygodności przybyły po złamaniu', credCount > credBreach0, { credBreach0, credCount });

    // --- L2f–L2h: BRAK ODPOWIEDZI GRACZA (timeout oferty; R-WEB-TEST-DEBT-BASE-RED-FALA741-Q1 / DIPLO-TRUCE-IMPL, truceEndTickPair) ---
    // Inicjatorem rozejmu jest AI (acceptTruceForTest(AI,…)), więc adresatem pokoju stałego po wygaśnięciu jest GRACZ:
    // w turze wygaśnięcia powstaje oferta w skrzynce (status nadal 'pokoj'); brak odpowiedzi do kolejnej tury = timeout
    // = wojna BEZ kary (truceEndToWarCore). Ta gałąź jest odrębna od L2b (zgoda AI, rozstrzygana natychmiast).
    // Pokrycie: WYŁĄCZNIE brak odpowiedzi gracza (timeout oferty przez zwykłe tury, bez UI odpowiedzi), NIE jawna
    // odmowa gracza. Odmowa AI wobec propozycji gracza (hak w main.ts poza allowlistą) pozostaje JAWNIE NIE_ZMIERZONO.
    console.log('L2f–L2h brak odpowiedzi gracza na ofertę pokoju stałego (timeout): wojna bez kary');
    const tD0 = (await pairState(page)).turn;
    const accD = await page.evaluate(([ai]) => window.__truceTestDebug.acceptTruceForTest(ai, 5), [AI]);
    assert('L2f0 ponowne zawarcie rozejmu z AI (startowy stan odmowy)', accD.accepted === true, accD);
    const sD0 = await pairState(page);
    assert('L2f0b po rozejmie status pokoj, truceUntilTurn = tura + 5', sD0.status === 'pokoj' && sD0.truceUntilTurn === tD0 + 5, { tD0, sD0 });
    const credDenialBefore = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).filter(e => JSON.stringify(e).includes('zlamanie_paktu_nap')).length, [PLAYER]);
    const flagsDenialBefore = JSON.stringify(await page.evaluate(() => window.__truceTestDebug.aggressorFlags()));
    await endUntilTurn(page, tD0 + 5);
    const sOffer = await pairState(page);
    assert('L2g w turze wygaśnięcia oferta dla gracza: status nadal pokoj, bez natychmiastowej wojny', sOffer.turn === tD0 + 5 && sOffer.status === 'pokoj' && sOffer.truceUntilTurn === null, sOffer);
    assert('L2g2 oferta dla gracza: pokój stały NIE zawarty w turze wygaśnięcia (peaceUntilTurn null)', sOffer.peaceUntilTurn === null, sOffer);
    await endUntilTurn(page, tD0 + 6);
    const sRefuse = await pairState(page);
    assert('L2h brak odpowiedzi na ofertę do kolejnej tury = wojna po wygaśnięciu oferty', sRefuse.turn === tD0 + 6 && sRefuse.status === 'wojna' && sRefuse.truceUntilTurn === null, sRefuse);
    const credDenialAfter = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).filter(e => JSON.stringify(e).includes('zlamanie_paktu_nap')).length, [PLAYER]);
    assert('L2h bez nowej kary zlamanie_paktu_nap za odmowę/timeout', credDenialAfter === credDenialBefore, { credDenialBefore, credDenialAfter });
    const flagsDenialAfter = JSON.stringify(await page.evaluate(() => window.__truceTestDebug.aggressorFlags()));
    assert('L2h bez nowej flagi agresora za odmowę/timeout', flagsDenialAfter === flagsDenialBefore, { flagsDenialBefore, flagsDenialAfter });

    // --- L4 (R-WEB-TEST-HOOK-AI-TRUCE-REFUSAL-Q1, HOOKAI): ODMOWA AI wobec propozycji rozejmu GRACZA ---
    // Hak civTest: forceAiTruceDecisionForTest('reject') wymusza decyzję AI na wpis stołu, którego autorem jest gracz
    // (ścieżka resolveNegotiationEntryAt). Bez haka AI decyduje normalnie (evaluateProposal). Odmowa: wojna trwa,
    // brak rozejmu/pokoju stałego, wpis zdjęty ze stołu, BEZ nowej kary zlamanie_paktu_nap i BEZ flagi agresora.
    console.log('L4 odmowa AI wobec propozycji rozejmu gracza (hak civTest)');
    // Wiek wojny 25 (≥ PEACE_PROPOSAL_MIN_WAR_TURNS = 10): propozycja gracza jest dopuszczona. Rozstrzygnięcie idzie
    // bez kończenia tury (resolveAiAwaitingForTest), więc AI nie składa własnej propozycji pokoju w tej samej turze.
    // Naturalna decyzja AI przy tym wieku to ODMOWA (zmierzone w mutacji hak-ignorowany: L4b–L4e zielone, L4f2 czerwony).
    // Dlatego L4b–L4e potwierdzają zachowanie odmowy, a skuteczność haka dowodzi wyłącznie kontrola L4f2 (wymuszona akceptacja).
    await page.evaluate(([ai]) => window.__truceTestDebug.setWarAge(ai, 25), [AI]);
    const sWar4 = await pairState(page);
    assert('L4-pre para w wojnie przed propozycją gracza', sWar4.status === 'wojna', sWar4);
    const credRef0 = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).filter(e => JSON.stringify(e).includes('zlamanie_paktu_nap')).length, [PLAYER]);
    const flagsRef0 = JSON.stringify(await page.evaluate(() => window.__truceTestDebug.aggressorFlags()));
    await page.evaluate(() => window.__truceTestDebug.forceAiTruceDecisionForTest('reject'));
    const prop4 = await page.evaluate(([ai]) => window.__truceTestDebug.playerProposeTruceForTest(ai, 5), [AI]);
    assert('L4a propozycja rozejmu gracza trafia na stół', prop4.queued === true, prop4);
    // Rozstrzygnięcie wpisu czekającego na AI bez kończenia tury (ta sama siatka co w turze AI): inaczej w EOT
    // AI składa WŁASNĄ propozycję pokoju i pokój zawiera się niezależnie od odmowy (zmierzone: ten sam wynik bez propozycji gracza).
    await page.evaluate(([ai]) => window.__truceTestDebug.resolveAiAwaitingForTest(ai), [AI]);
    const sRef4 = await pairState(page);
    assert('L4b odmowa AI: wojna trwa, bez rozejmu i pokoju stałego', sRef4.status === 'wojna' && sRef4.truceUntilTurn === null && sRef4.peaceUntilTurn === null, sRef4);
    const entries4 = await page.evaluate(() => window.__truceTestDebug.negotiationEntries());
    assert('L4c wpis propozycji gracza zdjęty ze stołu po odmowie AI', !entries4.some(e => e.actionId === 'rozejm' && e.proposerOwnerId === PLAYER), entries4);
    const credRef1 = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).filter(e => JSON.stringify(e).includes('zlamanie_paktu_nap')).length, [PLAYER]);
    assert('L4d bez kary zlamanie_paktu_nap za odmowę AI', credRef1 === credRef0, { credRef0, credRef1 });
    const flagsRef1 = JSON.stringify(await page.evaluate(() => window.__truceTestDebug.aggressorFlags()));
    assert('L4e bez flagi agresora za odmowę AI', flagsRef1 === flagsRef0, { flagsRef0, flagsRef1 });
    // L4f: dowód skuteczności haka (mutacja „hak ignorowany” musi zaczerwienić ten punkt): ta sama propozycja z wymuszoną
    // AKCEPTACJĄ zawiera rozejm. Naturalna decyzja AI w tym stanie to odmowa (zmierzone), więc bez haka wynik byłby czerwony.
    await page.evaluate(() => window.__truceTestDebug.forceAiTruceDecisionForTest('accept'));
    const prop5 = await page.evaluate(([ai]) => window.__truceTestDebug.playerProposeTruceForTest(ai, 5), [AI]);
    assert('L4f1 druga propozycja rozejmu gracza trafia na stół', prop5.queued === true, prop5);
    await page.evaluate(([ai]) => window.__truceTestDebug.resolveAiAwaitingForTest(ai), [AI]);
    const sAcc4 = await pairState(page);
    assert('L4f2 wymuszona akceptacja AI: rozejm zawarty (pokoj, truceUntilTurn = tura + 5)', sAcc4.status === 'pokoj' && sAcc4.truceUntilTurn === sAcc4.turn + 5, sAcc4);
  } catch (e) {
    fail++;
    console.error(' FAIL wyjątek:', e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e);
  }

  assert('C zero pageerror/console.error', errors.length === 0, errors.slice(0, 5));
  await browser.close();
  console.log(`\n${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
