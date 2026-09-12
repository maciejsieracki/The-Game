'use strict';
/**
 * wydarzenia-eliminacja-podboj-karta-test.cjs
 *
 * TEMAT: P-WYDARZENIA-ELIMINACJA-PODBOJ-KARTA-Q1.
 *
 * ZGŁOSZENIE (DECISION_REQUIRED #1, R-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1, ECHO właściciela
 * 2026-09-12 WARIANT A): eliminacja cywilizacji PRZEZ PODBÓJ (zdobycie ostatniego miasta przez
 * INNĄ CYWILIZACJĘ, `newOwner !== 0`) ma emitować DOKŁADNIE TAKI SAM mechanizm karty co
 * eliminacja przez wchłonięcie dyplomatyczne: trwałą kartę panelu WYDARZENIA (nie ginący
 * toast) ze skrótem „Szczegóły →" otwierającym `showCivElimNotice()`.
 *
 * DLACZEGO ŻYWA, ZBUDOWANA GRA (REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu): pytanie właściciela
 * dotyczy REALNEGO efektu w rozgrywce, nie samej obecności wywołania w źródle. Ten test:
 *   1. buduje realny `vite build` artefakt (`?playtest=mapa`, ten sam wzorzec co
 *      `sidepanel-event-przekierowania-real-render-test.cjs`);
 *   2. używa WYŁĄCZNIE preistniejącego haka `__rebelProtectionTestDebug.captureViaBattle`
 *      (main.ts, NIE dodawany/zmieniany przez ten temat — poza allowlistą) do wywołania
 *      REALNEGO `captureCityWithoutBattle` -> `applyCityCaptureToMap` ->
 *      `runCapitalCapturePlunder` — DOKŁADNIE tej samej ścieżki silnika, którą przechodzi
 *      naturalne zdobycie miasta w bitwie;
 *   3. `a` = jedyny realny AI owner sandboxa `?playtest=mapa` (ma dokładnie jedno miasto —
 *      OSTATNIE), `b` = odrębny, syntetyczny ownerId (`pickTwoAiOwners()`, `b !== 0`) —
 *      zdobywcą jest WIĘC INNA CYWILIZACJA, nie gracz: dokładnie przypadek `newOwner !== 0`
 *      z DECISION_REQUIRED, „widz zdarzenia u przeciwnika", nie eliminacja gracza;
 *   4. czyta stan panelu WYŁĄCZNIE z żywego DOM-u (karta, jej `data-id`, klasa `.sp-goto-cta`)
 *      i klika PRAWDZIWĄ myszą (wzorzec `clickCard` z testu przekierowań), po czym czyta
 *      otwarty modal WŁASNYM predykatem gry (`civElimModal`, `__sidePanelLinkTestDebug`) —
 *      nie zgaduje po klasach CSS.
 *
 * NIETAUTOLOGICZNOŚĆ: (0) sekcja kotwic źródłowych dowodzi, że `recordCivElimEvent` jest
 * wołane Z TEGO KONKRETNEGO branchu (`newOwner !== 0`) i że STARY toast
 * „ELIMINACJA! Ostatnie miasto" zniknął z main.ts (usunięty, nie dołożony obok — decyzja
 * operatora uzasadniona w raporcie rundy). (A) dowodzi, że PRZED wywołaniem `captureViaBattle`
 * karta `elim-cs-<turn>-<a>` NIE istnieje w DOM (resolver zwraca `null`) — więc (B) „karta się
 * pojawiła" nie jest fałszywym zielonym z jakiejś WCZEŚNIEJSZEJ karty. Treść modalu jest
 * odczytywana z REALNYCH, dynamicznych danych silnika (etykieta ofiary, raport łupu), nie z
 * literału wpisanego w ten test.
 *
 * ŚCIEŻKA DYPLOMATYCZNA (`annexerId===0`, main.ts ok. 28106-28125) i GAŁĄŹ GRACZ-ZDOBYWCA
 * (`newOwner===0`) SĄ POZA ZAKRESEM tego testu — dowodzi tego wyłącznie sekcja (0), źródłowo,
 * bez ich wykonywania.
 *
 * Usage (z gra/): node tools/wydarzenia-eliminacja-podboj-karta-test.cjs
 *   --shots <katalog>   zrzuty do <katalog>/eliminacja-podboj-karta-i-modal-{karta,modal}.png
 *   --dist <katalog>    użyj gotowego katalogu vite build zamiast budować go w teście
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS_PATH = path.resolve(GRA_DIR, 'src', 'main.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
// C-001 §Bariery pkt „Katalog tymczasowy bramki musi być unikalny per przebieg" —
// mkdtempSync POZA drzewem repo (dispatch: --outDir <katalog SPOZA repo>).
const OUT_DIR = DIST_ARG !== null
  ? path.resolve(DIST_ARG)
  : fs.mkdtempSync(path.join(os.tmpdir(), 'wydarzenia-elim-podboj-karta-'));
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function buildBundle() {
  if (DIST_ARG !== null) { console.log('[elim-podboj-karta-test] uzywam gotowego dist: ' + OUT_DIR); return; }
  console.log('[elim-podboj-karta-test] vite build do ' + OUT_DIR + ' (C-001: produkt budowania, zero dev servera)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Build nie wyprodukowal index.html w ' + OUT_DIR);
  console.log('[elim-podboj-karta-test] build OK.');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[elim-podboj-karta-test] domyslny Chromium niedostepny, fallback na ' + FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
  for (let i = 0; i < 120; i++) {
    if (await page.locator('text=Tworzenie świata').count() === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => window.__rebelProtectionTestDebug !== undefined && window.__sidePanelLinkTestDebug !== undefined,
    { timeout: 60000 },
  );
  await wait(1500);
}

/** Ten sam wzorzec co `clickCard` w sidepanel-event-przekierowania-real-render-test.cjs. */
async function clickCard(page, id) {
  const sel = '.civ-side-panel .sp-event[data-id="' + id + '"]';
  const loc = page.locator(sel);
  if (await loc.count() === 0) return { hit: false, why: 'brak karty w DOM' };
  await loc.scrollIntoViewIfNeeded();
  await wait(150);
  const box = await loc.boundingBox();
  if (box === null) return { hit: false, why: 'brak boundingBox' };
  const cx = box.x + 26;
  const cy = box.y + box.height / 2;
  const at = await page.evaluate(({ cx, cy, id }) => {
    const el = document.elementFromPoint(cx, cy);
    const card = el === null ? null : el.closest('.sp-event[data-id]');
    return { tag: el === null ? null : el.tagName, cardId: card === null ? null : card.getAttribute('data-id'), want: id };
  }, { cx, cy, id });
  if (at.cardId !== id) return { hit: false, why: 'punkt kliku nie nalezy do karty', at };
  await page.mouse.click(cx, cy);
  await wait(700);
  return { hit: true };
}

async function readCard(page, id) {
  return page.evaluate((id) => {
    const card = document.querySelector('.civ-side-panel .sp-event[data-id="' + id + '"]');
    if (card === null) return { missing: true };
    const cta = card.querySelector('.sp-goto-cta');
    return {
      title: (card.querySelector('.sp-title')?.textContent || '').trim(),
      subtitle: (card.querySelector('.sp-sub')?.textContent || '').trim(),
      cta: cta === null ? null : (cta.textContent || '').replace(/\s+/g, ' ').trim(),
      ctaVisible: cta === null ? false : cta.getBoundingClientRect().width > 0,
      noLinkCls: card.classList.contains('sp-no-link'),
      cursor: getComputedStyle(card).cursor,
      role: card.getAttribute('role'),
    };
  }, id);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[elim-podboj-karta-test] playwright missing — npm i -D playwright'); process.exit(1); }

  buildBundle();

  // --- (0) kotwice w zrodle: nowa sciezka istnieje, stary toast zniknal, ---
  //         sciezka dyplomatyczna i galaz gracz-zdobywca NIETKNIETE -----------------------
  console.log('\n-- (0) kotwice w zrodle --');
  const mainSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');
  assert('(0a) branch newOwner!==0 && oldOwner!==0 (ofiara-AI) wola recordCivElimEvent(oldOwner, ..., \'podboj\')',
    /\} else if \(newOwner !== 0 && oldOwner !== 0\) \{[\s\S]{0,2000}recordCivElimEvent\(oldOwner, eliminatedCivLabel, eliminatedDetails, 'podboj'\);\s*\}/.test(mainSrc));
  assert('(0b) stary toast "ELIMINACJA! Ostatnie miasto" ZASTAPIONY, nie zdublowany obok karty',
    !mainSrc.includes('ELIMINACJA! Ostatnie miasto (${city.name}) przejęte przez'));
  assert('(0f) OBRONA RUNDA 2 zarzut 1: gdy ofiara=gracz (oldOwner===0), recordCivElimEvent NIE jest wolane z tego brancha (unika duplikatu karty z recordCityCaptureEvent)',
    !/\} else if \(newOwner !== 0\) \{[\s\S]{0,900}recordCivElimEvent\(oldOwner/.test(mainSrc));
  assert('(0c) sciezka dyplomatyczna (annexerId===0 -> recordCivElimEvent) NIETKNIETA',
    /if \(annexerId === 0\) \{\s*recordCivElimEvent\(\s*csOwnerId,\s*csLabel,/.test(mainSrc));
  assert('(0d) galaz gracz-zdobywca (newOwner===0 && !isTriumph -> zwrot do wolajacego) NIETKNIETA',
    /return \(newOwner === 0 && !isTriumph\) \? \{ eliminatedCivLabel, eliminatedDetails \} : null;/.test(mainSrc));
  const built = fs.readFileSync(path.join(OUT_DIR, 'index.html'), 'utf8');
  assert('(0e) artefakt vite build niesie regule CSS skrotu karty (.sp-goto-cta)',
    built.includes('sp-goto-cta'));

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));

    await gotoPlaytestMapa(page);

    // --- (0.5) RUNDA 3, ZERO REGRESU: sciezka dyplomatyczna (annexerId===0) nadal pokazuje ---
    //         DOKLADNIE ten sam kicker/subtitle co przed ta runda (domyslny cause). ------------
    //         Inscenizacja przez preistniejacy hak testowy __sidePanelLinkTestDebug (seedEvents +
    //         setCivElimDetails, BEZ parametru cause -- dokladnie tak, jak wolal go kod PRZED
    //         runda 3), NIE przez realna dyplomacje (poza zakresem tego tematu, patrz naglowek).
    //         UMYSLNIE PRZED (1)-(6): (1)-(6) eliminuja JEDYNEGO realnego AI tego sandboxa, co
    //         konczy gre zwyciestwem i przykrywa panel boczny ekranem zwyciestwa (vsc-overlay) --
    //         niezwiazany efekt uboczny scenariusza podboju, nie regresja tego bloku. -----------
    console.log('\n-- (0.5) RUNDA 3: zero regresu na sciezce dyplomatycznej --');
    const diploEventId = 'elim-cs-diplo-regres-r3';
    const diploCount = await page.evaluate((id) => {
      // Kolejnosc wazna: setCivElimDetails MUSI poprzedzac seedEvents (seedEvents od razu
      // wywoluje refreshD1bHud/render, ktory czyta civElimEventDetails w tym samym takcie --
      // odwrotna kolejnosc renderuje karte jako sp-no-link, bo resolver jeszcze nie widzi wpisu).
      window.__sidePanelLinkTestDebug.setCivElimDetails(id, 'Miasto-Panstwo Testowe', 'Wszystkie miasta (1) wchłonięte dyplomatycznie.');
      window.__sidePanelLinkTestDebug.seedEvents([{
        id,
        icon: '\u{1F3F4}',
        title: 'ELIMINACJA: Miasto-Panstwo Testowe',
        subtitle: 'Wchłonięta dyplomatycznie — kliknij po szczegóły',
        kind: 'diplo',
        negative: true,
      }]);
      return document.querySelectorAll('.civ-side-panel .sp-event').length;
    }, diploEventId);
    assert('(0.5a) karta dyplomatyczna zaseedowana w panelu', diploCount > 0, diploCount);
    const diploClicked = await clickCard(page, diploEventId);
    assert('(0.5b) klik trafil w zaseedowana karte dyplomatyczna', diploClicked.hit, diploClicked);
    const diploKick = await page.evaluate(() => {
      const el = document.querySelector('#civ-elim-notice-host .cen-kick');
      return el === null ? null : (el.textContent || '').trim();
    });
    assert('(0.5c) ZERO REGRESU: kicker modalu = "Dyplomacja" (dokladnie jak przed runda 3) dla domyslnego cause',
      diploKick === 'Dyplomacja', diploKick);
    if (SHOTS !== null) {
      const modalEl = await page.$('#civ-elim-notice-host');
      if (modalEl) await modalEl.screenshot({ path: path.join(SHOTS, 'eliminacja-podboj-karta-i-modal-modal-dyplomacja-regres.png') });
    }
    await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());

    // --- (1) inscenizacja: AI captor (b, syntetyczny, !==0) zdobywa OSTATNIE miasto -----
    //         realnego AI (a) -- REALNY silnik: captureCityWithoutBattle ->
    //         applyCityCaptureToMap -> runCapitalCapturePlunder ------------------------------
    console.log('\n-- (1) przygotowanie: AI captor zdobywa OSTATNIE miasto innej AI --');
    const two = await page.evaluate(() => window.__rebelProtectionTestDebug.pickTwoAiOwners());
    assert('(1a) sandbox ma realnego AI ownera (ofiara) + syntetycznego captora', two !== null, two);
    if (two === null) throw new Error('brak dwoch AI ownerow do inscenizacji');
    const { a: victimOwner, b: captorOwner } = two;
    assert('(1b) captor jest INNA CYWILIZACJA niz gracz (newOwner !== 0) -- dokladnie przypadek DECISION_REQUIRED',
      captorOwner !== 0 && victimOwner !== 0, two);

    const victimCityId = await page.evaluate((o) => window.__rebelProtectionTestDebug.getCityIdForOwner(o), victimOwner);
    assert('(1c) ofiara ma dokladnie jedno (OSTATNIE) miasto w tym sandboxie', typeof victimCityId === 'string', victimCityId);

    const turnBefore = await page.evaluate(() => window.__rebelProtectionTestDebug.getTurn());
    const eventId = `elim-cs-${turnBefore}-${victimOwner}`;

    // --- (2) PRZED: karta eliminacji jeszcze nie istnieje (dowod, ze (3) nie jest falszywym
    //         zielonym z jakiejs wczesniejszej karty) --------------------------------------
    console.log('\n-- (2) przed zdobyciem: brak karty eliminacji --');
    const beforeCard = await readCard(page, eventId);
    assert('(2a) karta ' + eventId + ' NIE istnieje w DOM przed zdobyciem', beforeCard.missing === true, beforeCard);
    const beforeLink = await page.evaluate((id) => window.__sidePanelLinkTestDebug.linkFor(id), eventId);
    assert('(2b) resolver zwraca null dla ' + eventId + ' przed zdobyciem', beforeLink === null, beforeLink);

    // --- (3) REALNE zdobycie: captureViaBattle -> applyCityCaptureToMap ->
    //         runCapitalCapturePlunder (kod tego tematu) ------------------------------------
    await page.evaluate(
      ({ cityId, atk }) => window.__rebelProtectionTestDebug.captureViaBattle(cityId, atk),
      { cityId: victimCityId, atk: captorOwner },
    );
    await wait(500);
    // Zdobycie miasta między dwoma AI moze po drodze otworzyc audiencje dyplomatyczna
    // (zmiana relacji ofiara<->captor) - to NIEZALEZNY, preistniejacy mechanizm silnika,
    // poza zakresem tego tematu; zamykamy ja, zeby dostac sie do panelu bocznego pod spodem.
    await page.evaluate(() => { if (window.__audienceRelTestDebug) window.__audienceRelTestDebug.closeAudience(); });
    await wait(300);

    // --- (4) PO: trwala karta w panelu, mechanizm identyczny ze sciezka dyplomatyczna -----
    console.log('\n-- (4) po zdobyciu: trwala karta panelu WYDARZENIA --');
    const afterCard = await readCard(page, eventId);
    assert('(4a) karta ' + eventId + ' ISTNIEJE w DOM po zdobyciu (trwala, nie toast)', afterCard.missing !== true, afterCard);
    assert('(4b) tytul karty niesie „ELIMINACJA:" + etykiete cywilizacji ofiary',
      !afterCard.missing && /^ELIMINACJA:/.test(afterCard.title) && afterCard.title.length > 'ELIMINACJA:'.length, afterCard);
    assert('(4c) karta ma widoczny skrot „Szczegóły →" (ten sam mechanizm co karta dyplomatyczna)',
      !afterCard.missing && afterCard.cta === 'Szczegóły →' && afterCard.ctaVisible === true, afterCard);
    assert('(4d) karta klikalna (cursor:pointer, role=button, bez klasy sp-no-link)',
      !afterCard.missing && afterCard.cursor === 'pointer' && afterCard.role === 'button' && afterCard.noLinkCls === false, afterCard);
    const afterLink = await page.evaluate((id) => window.__sidePanelLinkTestDebug.linkFor(id), eventId);
    assert('(4e) resolver zwraca kind civ-elim, label Szczegóły dla ' + eventId,
      afterLink !== null && afterLink.kind === 'civ-elim' && afterLink.label === 'Szczegóły', afterLink);

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      const panel = await page.$('.civ-side-panel');
      if (panel) await panel.screenshot({ path: path.join(SHOTS, 'eliminacja-podboj-karta-i-modal-karta.png') });
    }

    // --- (5) klik "Szczegoly ->" otwiera showCivElimNotice() z poprawna trescia -----------
    console.log('\n-- (5) klik -> modal showCivElimNotice() --');
    await page.evaluate(() => { if (window.__audienceRelTestDebug) window.__audienceRelTestDebug.closeAudience(); });
    await wait(200);
    const clicked = await clickCard(page, eventId);
    assert('(5a) klik trafil w karte ' + eventId, clicked.hit, clicked);
    const views = await page.evaluate(() => window.__sidePanelLinkTestDebug.openViews());
    assert('(5b) klik otworzyl modal ELIMINACJA (civElimModal)', clicked.hit && views.civElimModal === true, views);

    const modalContent = await page.evaluate(() => {
      const host = document.getElementById('civ-elim-notice-host');
      if (!host) return null;
      return { text: (host.textContent || '').replace(/\s+/g, ' ').trim() };
    });
    assert('(5c) modal ma niepusta trescia (etykieta cywilizacji + szczegoly)',
      modalContent !== null && modalContent.text.length > 10, modalContent);
    assert('(5d) modal wspomina "ELIMINACJA" (ten sam naglowek co sciezka dyplomatyczna)',
      modalContent !== null && /ELIMINACJA/i.test(modalContent.text), modalContent);

    // --- (5e) RUNDA 3: kicker modalu dla eliminacji PRZEZ PODBOJ musi brzmiec "Podboj", ------
    //         NIE "Dyplomacja" (Final Control rundy 2, Zarzut 2, DECISION_REQUIRED) -------------
    console.log('\n-- (5e) RUNDA 3: kicker modalu = Podboj dla sciezki podboju --');
    const kickText = await page.evaluate(() => {
      const el = document.querySelector('#civ-elim-notice-host .cen-kick');
      return el === null ? null : (el.textContent || '').trim();
    });
    assert('(5e) kicker modalu = "Podboj" dla eliminacji przez podboj (nie "Dyplomacja")',
      kickText === 'Podbój', kickText);

    if (SHOTS !== null) {
      const modalEl = await page.$('#civ-elim-notice-host');
      if (modalEl) await modalEl.screenshot({ path: path.join(SHOTS, 'eliminacja-podboj-karta-i-modal-modal.png') });
    }

    // --- (6) karta PRZEZYWA endTurnInProgress (kryterium 1 dispatchu) --------------------
    // Odczyt PO endTurn() jest CELOWO strukturalny (warEventLog, ten sam hak co
    // `__eraTestDebug.getWarEventLogHead()`), NIE z DOM: panel boczny renderuje się na
    // żądanie (kolejny `refreshD1bHud()`, wywoływany m.in. przy interakcji gracza), więc
    // brak natychmiastowego rerenderu tuż po `endTurn()` jest cechą UI WSPÓLNĄ z kartą
    // dyplomatyczną (ten sam warEventLog, ten sam brak dedykowanego rerenderu w
    // `triggerPlayerEndTurn`), NIE regresem tego tematu — kryterium 1 dotyczy TRWAŁOŚCI
    // wpisu (nie ginie jak toast na timerze), nie odświeżania DOM co klatkę.
    console.log('\n-- (6) karta przezywa koniec tury (dowod strukturalny) --');
    await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    for (let i = 0; i < 60; i++) {
      if (!(await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress()))) break;
      await wait(500);
    }
    await wait(500);
    const logAfterEot = await page.evaluate(() => window.__rebelNotifyTestDebug.getWarEventLog());
    const entryAfterEot = logAfterEot.find((e) => e.id === eventId);
    assert('(6a) wpis ' + eventId + ' NADAL jest w warEventLog po zakonczeniu tury (nie usuniety/nie zamieniony w eot-hint)',
      entryAfterEot !== undefined, logAfterEot.map((e) => e.id));
    assert('(6b) tytul wpisu niezmieniony po turze ("ELIMINACJA: <cywilizacja>", nie generyczny "Koniec tury")',
      entryAfterEot !== undefined && /^ELIMINACJA:/.test(entryAfterEot.title), entryAfterEot);
    const linkAfterEot = await page.evaluate((id) => window.__sidePanelLinkTestDebug.linkFor(id), eventId);
    assert('(6c) resolver nadal zwraca civ-elim/Szczegóły po turze (skrot przezyl)',
      linkAfterEot !== null && linkAfterEot.kind === 'civ-elim', linkAfterEot);

    assert('(9) zero bledow konsoli/JS przez caly przebieg', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log('\nwydarzenia-eliminacja-podboj-karta-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
