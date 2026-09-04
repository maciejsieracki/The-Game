'use strict';
/**
 * sidepanel-diplo-dismiss-real-render-test.cjs — P-DYPLO-KARTA-DECYZJI-DISMISS-Q1 (Operator
 * Sonnet 5, effort high, runda 1, worktree izolowany).
 *
 * ZGŁOSZENIE (właściciel, dwa zrzuty panelu bocznego "Wydarzenia"): "Na propozycjach
 * dyplomatycznych powinna być też możliwość wyłączenia tej propozycji... żeby można było ją
 * wyłączyć, ewentualnie do niej wrócić, jeżeli się da." + "Propozycje handlowe też powinny się
 * usuwać jak wszystkie inne."
 *
 * RECON (patrz 00-dispatch.md): backend (`handleSidePanelEventDismiss`, main.ts, gałąź domyślna)
 * JUŻ obsługuje poprawnie karty `kind:'diplo'` — robi `dismissedSidePanelEventIds.add(id)`,
 * czyszczone co turę (identyczny mechanizm jak dla buntu). Brakowało WYŁĄCZNIE przycisku w
 * `sidePanelHud.ts`. GOAL 3 zabraniał zmian w main.ts, chyba że recon "w locie" wykaże realną
 * potrzebę — TA BRAMKA jest właśnie tym reconem: żywy dowód, nie czytanie źródła z pamięci.
 *
 * DLACZEGO ŻYWA, ZBUDOWANA GRA (C-001, REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu): kryterium 2/3
 * dispatchu wprost zakazuje uznania za spełnione bez żywego testu OBU źródeł karty diplo
 * (`pendingDiplomacyInbox`, prefiks id `diplo-pend-`, i `negotiationTable`, prefiks `negot-`) —
 * mają różny kształt id i inny gałąź main.ts MOGŁABY je potraktować różnie (nie potraktowała —
 * to właśnie ten test dowodzi na żywo, nie z czytania kodu).
 *
 * METODA (bez ŻADNEJ zmiany main.ts — allowlista tematu to zakazuje poza wąskim wyjątkiem
 * GOAL 3, którego recon nie potwierdził jako potrzebnego): karty seedowane są istniejącym hakiem
 * `window.__sidePanelLinkTestDebug.seedEvents()` (main.ts, już obecny dla innego tematu,
 * P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1) z identycznymi PREFIKSAMI ID jak produkcyjne wpisy z obu
 * źródeł — `handleSidePanelEventDismiss` routuje WYŁĄCZNIE po prefiksie stringa `id`, więc karta
 * o id `diplo-pend-...`/`negot-...` w warEventLog (test) trafia w DOKŁADNIE tę samą gałąź co
 * karta o tym samym id w `pendingDiplomacyInbox`/`negotiationTable` (produkcja) — zero
 * rozgałęzienia po źródłowej tablicy w main.ts (statycznie potwierdzone w kroku 0 niżej).
 * Klik idzie normalnym `data-sp-ignore` → `config.onEventDismiss` → REALNY `handleSidePanelEventDismiss`
 * (main.ts, nietknięty), NIE reimplementowany. `endTurn()` woła REALNY `triggerPlayerEndTurn()`
 * (ta sama funkcja co przycisk "Zakończ turę").
 *
 * CO POZOSTAJE STATYCZNYM DOWODEM ŹRÓDŁOWYM (nie da się bez zmiany main.ts zainscenizować żywej
 * karty w audiencji z tego haka): że `getNegotiationsForPair()` (main.ts, renderer "Stołu
 * negocjacji" w panelu audiencji) i akceptacja/odrzucenie z `pendingDiplomacyInbox` NIE
 * filtrują po `dismissedSidePanelEventIds` w ogóle — czyli odłożona karta panelu bocznego nie
 * dotyka SAMEJ propozycji. Krok 0 cytuje dokładne linie źródła jako dowód, nie z pamięci.
 *
 * Pokrycie:
 *  0. Kotwice statyczne w źródle (routing po prefiksie id, brak filtra w audiencji).
 *  A. Karta `diplo-pend-*` (kształt `pendingDiplomacyInbox`): przycisk "Odłóż na później"
 *     widoczny obok "Otwórz →", klik chowa kartę w TEJ turze, po `endTurn()` (dismiss czyszczony
 *     co turę) karta WRACA.
 *  B. Karta `negot-*` (kształt `negotiationTable`): identyczna sekwencja, osobno.
 *  C. Kontrola regresji: karta buntu (`revolt-*`) ma WYŁĄCZNIE "Zignoruj — bunt potrwa dalej",
 *     BEZ "Odłóż na później".
 *  D. Kontrola regresji: karta `prod-empty-*` (`kind:'city'`) nie dostaje ŻADNEGO z dwóch
 *     dodatkowych przycisków — tylko "Otwórz →".
 *  E. Zero błędów konsoli/JS przez cały przebieg.
 *
 * AKTUALIZACJA KONTRAKTU — P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1 (2026-09-04, runda 1):
 * właściciel zgłosił, że stopka akcji karty blokującej bywa UCIĘTA („nie da się jej włączyć...
 * lepszy byłby krzyżyk w górnym rogu"). Tekstowy link „Odłóż na później" (dodany tym tematem)
 * został zastąpiony przyciskiem „✕" (`.sp-close`, `data-dismiss`) w NAGŁÓWKU karty — ten sam
 * element, ta sama klasa i ten sam handler co „✕" kart informacyjnych, więc wołany jest
 * DOKŁADNIE ten sam `config.onEventDismiss` → `handleSidePanelEventDismiss` (main.ts,
 * nietknięty) co wcześniej. Semantyka („miękki, jednoturowy dismiss, karta wraca w następnej
 * turze, propozycja w audiencji nietknięta") jest niezmieniona i ten test nadal jej pilnuje —
 * zmienił się WYŁĄCZNIE element, w który klika gracz. Geometrii (brak ucięcia) pilnuje osobna
 * bramka tools/sidepanel-blocking-card-cutoff-real-render-test.cjs.
 *
 * Bramka (z katalogu gra/): node tools/sidepanel-diplo-dismiss-real-render-test.cjs
 *   --shots <katalog>   zrzuty ekranu kart przed/po dismiss
 *   --dist <katalog>    użyj gotowego katalogu vite build zamiast budować go w teście
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const OUT_DIR = DIST_ARG !== null ? path.resolve(DIST_ARG) : path.join(GRA_DIR, 'dist-sp-diplo-dismiss-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  if (DIST_ARG !== null) { console.log('[diplo-dismiss-test] uzywam gotowego dist: ' + OUT_DIR); return; }
  console.log('[diplo-dismiss-test] vite build (C-001: produkt budowania, zero dev servera)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Build nie wyprodukowal index.html w ' + OUT_DIR);
  console.log('[diplo-dismiss-test] build OK.');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[diplo-dismiss-test] domyslny Chromium niedostepny, fallback na ' + FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
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
    () => !!window.__sidePanelLinkTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 180000 },
  );
  await wait(500);
}

async function endTurnAndSettle(page, timeoutMs = 90000) {
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  let settled = false;
  while (Date.now() - t0 < timeoutMs) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    if (sawInProgress && !inProg) { settled = true; break; }
    await wait(150);
  }
  await wait(400);
  return { sawInProgress, settled };
}

/** Odczyt karty blokującej z żywego DOM-u: obecność, badge, oba możliwe przyciski dismiss. */
async function readBlockingCard(page, id) {
  return page.evaluate((id) => {
    const card = document.querySelector('.civ-side-panel .sp-event[data-id="' + id + '"]');
    if (card === null) return { missing: true };
    const ignoreBtns = Array.from(card.querySelectorAll('.sp-action-ignore'))
      .map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim());
    const closeEl = card.querySelector('.sp-close');
    return {
      missing: false,
      expanded: card.classList.contains('sp-expanded'),
      badge: (card.querySelector('.sp-badge-decision')?.textContent || '').trim(),
      hasCloseBtn: closeEl !== null && (closeEl.textContent || '').trim() === '✕'
        && closeEl.getAttribute('data-dismiss') === id,
      closeInHeader: closeEl !== null && closeEl.closest('.sp-blk-body') !== null,
      closeTitle: closeEl?.getAttribute('title') ?? null,
      closeAria: closeEl?.getAttribute('aria-label') ?? null,
      openBtnText: (card.querySelector('[data-sp-open]')?.textContent || '').trim(),
      ignoreBtns,
      hasDeferBtn: ignoreBtns.some((t) => t === 'Odłóż na później'),
      hasRevoltIgnoreBtn: ignoreBtns.some((t) => t === 'Zignoruj — bunt potrwa dalej'),
    };
  }, id);
}

async function clickDeferButton(page, id) {
  // P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1: dismiss karty blokujacej idzie teraz przez „✕"
  // (.sp-close/data-dismiss) w naglowku, nie przez tekstowy link data-sp-ignore w stopce.
  const sel = '.civ-side-panel .sp-event[data-id="' + id + '"] .sp-close[data-dismiss="' + id + '"]';
  const loc = page.locator(sel);
  if (await loc.count() === 0) return { hit: false, why: 'brak przycisku w DOM' };
  await loc.click();
  await wait(400);
  return { hit: true };
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[diplo-dismiss-test] playwright missing — npm i -D playwright'); process.exit(1); }

  buildBundle();

  console.log('\n-- (0) kotwice statyczne w zrodle --');
  const mainSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'main.ts'), 'utf8');
  const hudSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'ui', 'sidePanelHud.ts'), 'utf8');
  assert('(0a) sidePanelHud.ts ma predykat isDeferrableDiploEvent dopasowujacy po kind, nie po prefiksie id',
    /function isDeferrableDiploEvent\(ev: SidePanelEvent\): boolean \{\s*\n\s*return ev\.blocking === true && ev\.kind === 'diplo';/.test(hudSrc));
  assert('(0b) renderer karty blokujacej renderuje "✕" (.sp-close z data-dismiss) w naglowku .sp-blk-body, przed .sp-action-bar',
    /sp-blk-body[\s\S]{0,2500}class="sp-close" data-dismiss=[\s\S]{0,400}sp-action-bar/.test(hudSrc));
  assert('(0b2) zdublowany tekstowy link "Odloz na pozniej" znikl z renderu (zastapiony przez "✕")',
    !/data-sp-ignore="[^"]*">Odłóż na później</.test(hudSrc));
  // Ciało WYŁĄCZNIE handleSidePanelEventDismiss (od deklaracji do jej zamykającej klamry) —
  // startsWith('diplo-pend-')/('negot-') ISTNIEJĄ gdzie indziej w main.ts (routing kliknięcia
  // karty do właściwego modala — inna funkcja, poza allowlistą tego tematu), więc kotwica musi
  // patrzeć WYŁĄCZNIE na to jedno ciało funkcji, nie na cały plik.
  const dismissFnMatch = mainSrc.match(/function handleSidePanelEventDismiss\(id: string\): void \{[\s\S]*?\n    \}\n/);
  assert('(0c-pre) funkcja handleSidePanelEventDismiss znaleziona w zrodle', dismissFnMatch !== null);
  const dismissFnBody = dismissFnMatch ? dismissFnMatch[0] : '';
  assert('(0c) handleSidePanelEventDismiss NIE ma osobnej galezi dla "diplo-pend-"/"negot-" — oba spadaja do wspolnej galezi domyslnej (dismissedSidePanelEventIds.add)',
    !/id\.startsWith\('diplo-pend-'\)/.test(dismissFnBody) && !/id\.startsWith\('negot-'\)/.test(dismissFnBody));
  assert('(0d) galaz domyslna handleSidePanelEventDismiss faktycznie robi dismissedSidePanelEventIds.add(id) (miekki dismiss, czyszczony co ture)',
    /Propozycja pokoju \/ negocjacje \/ inne dyplo[\s\S]{0,120}dismissedSidePanelEventIds\.add\(id\);/.test(dismissFnBody));
  assert('(0e) getNegotiationsForPair (renderer "Stolu negocjacji" w audiencji) NIE filtruje po dismissedSidePanelEventIds — odlozenie karty nie dotyka samej propozycji',
    /function getNegotiationsForPair[\s\S]{0,300}\}/.test(mainSrc)
    && !/function getNegotiationsForPair[\s\S]{0,300}dismissedSidePanelEventIds/.test(mainSrc));

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];

  /**
   * Jeden scenariusz = WŁASNA, świeża strona/świat (nie jeden ciąg dwóch kolejnych
   * endTurn() w tej samej sesji — pierwsza wersja tej bramki łączyła A i B w jednej
   * sesji i druga tura (B) w ogóle nie ruszała, bo sandbox po pierwszym endTurn zostawiał
   * modal/stan blokujący drugi realny endTurn w tej samej stronie; osobna strona per
   * scenariusz eliminuje to skrzyżowanie, nie jest obejściem wady dismiss).
   *
   * KONTROLA RÓŻNICOWA dla kryterium "wraca po turze": seedowana jest PARA kart o tym
   * samym id-shape (`id` — ta, którą klikamy "Odłóż na później"; `controlId` — bliźniacza,
   * NIGDY nie klikana) w JEDNYM wywołaniu `seedEvents`, więc obie trafiają do `warEventLog`
   * w tej samej chwili i na sąsiednich pozycjach. `warEventLog` jest przycinany do 8
   * najnowszych wpisów (main.ts, kilka miejsc `if (warEventLog.length > 8)`) — jeśli po
   * realnym `endTurn()` AI dorzuci ≥8 własnych wpisów, OBIE karty (klikana i kontrolna)
   * wypadają z logu RÓWNOCZEŚNIE, co jest artefaktem TEJ metody seedowania (produkcyjne
   * `pendingDiplomacyInbox`/`negotiationTable` nie przechodzą przez ten przycinany log w
   * ogóle — main.ts, `collectTurnEvents`, dwie osobne pętle `for (const p of
   * pendingDiplomacyInbox)`/`for (const n of negotiationTable)` dopisują je do `events`
   * NA ŻYWO przy każdym renderze, bez limitu 8), nie dowodem błędu dismiss. Jeśli
   * kontrolna karta PRZETRWAŁA, a klikana NIE — jedyną różnicą między nimi jest kliknięcie,
   * więc to JEST dowód błędu w `dismissedSidePanelEventIds`/`handleSidePanelEventDismiss`.
   */
  async function runDismissScenario(label, id, controlId, subtitle) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(label + ': ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(label + ': [pageerror] ' + e.message));
    try {
      await gotoPlaytestMapa(page);
      await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());

      await page.evaluate(({ id, controlId, subtitle }) => {
        window.__sidePanelLinkTestDebug.seedEvents([
          { id, icon: '🤝', title: 'Dyplomacja: Egipt', subtitle, kind: 'diplo', blocking: true },
          { id: controlId, icon: '🤝', title: 'Dyplomacja: Rzym', subtitle: subtitle + ' (kontrola)', kind: 'diplo', blocking: true },
        ]);
      }, { id, controlId, subtitle });
      await wait(500);
      if (SHOTS !== null) {
        fs.mkdirSync(SHOTS, { recursive: true });
        const target = await page.$('.civ-side-panel');
        if (target) await target.screenshot({ path: path.join(SHOTS, label + '-przed.png') });
      }

      const before = await readBlockingCard(page, id);
      assert('(' + label + '1) karta wyrenderowana i rozwinieta', before.missing === false && before.expanded === true, before);
      assert('(' + label + '2) badge "Wymaga decyzji" + "Otworz ->" nietkniete', before.badge === 'Wymaga decyzji' && before.openBtnText === 'Otwórz →', before);
      assert('(' + label + '3) "✕" widoczny w NAGLOWKU karty, z tym samym title/aria-label co karty informacyjne, BEZ przycisku buntu',
        before.hasCloseBtn === true && before.closeInHeader === true
        && before.closeTitle === 'Zamknij' && before.closeAria === 'Zamknij powiadomienie'
        && before.hasRevoltIgnoreBtn === false, before);
      assert('(' + label + '3b) zdublowany tekstowy link "Odloz na pozniej" znikl ze stopki (zero .sp-action-ignore na karcie diplo)',
        before.hasDeferBtn === false && before.ignoreBtns.length === 0, before);
      const beforeControl = await readBlockingCard(page, controlId);
      assert('(' + label + '3k) karta kontrolna (druga, niekliknieta) tez wyrenderowana', beforeControl.missing === false, beforeControl);

      const click = await clickDeferButton(page, id);
      assert('(' + label + '4) klik w "✕" trafil w przycisk', click.hit, click);
      const afterClick = await readBlockingCard(page, id);
      assert('(' + label + '5) karta zniknela z panelu bocznego W TEJ TURZE (przed endTurn)', afterClick.missing === true, afterClick);
      const afterClickControl = await readBlockingCard(page, controlId);
      assert('(' + label + '5k) karta kontrolna NIETKNIETA klikiem w inna karte', afterClickControl.missing === false, afterClickControl);
      if (SHOTS !== null) {
        const target = await page.$('.civ-side-panel');
        if (target) await target.screenshot({ path: path.join(SHOTS, label + '-po-klik.png') });
      }

      const settle = await endTurnAndSettle(page);
      assert('(' + label + '6) endTurn faktycznie sie wykonal (endTurnInProgress true->false)', settle.settled, settle);
      const afterTurn = await readBlockingCard(page, id);
      const afterTurnControl = await readBlockingCard(page, controlId);
      if (afterTurnControl.missing === true) {
        // Kontrola RÓWNIEŻ wypadła z warEventLog (przycięty do 8 najnowszych wpisów przez
        // realny AI-turn) — artefakt TEJ metody seedowania (patrz komentarz nad funkcją),
        // nie test kryterium. Zgłoś jako informacyjne, nie liczone do pass/fail.
        console.log('  INFO (' + label + '7) obie karty (klikana+kontrolna) wypadly z warEventLog po endTurn -- artefakt przyciecia logu do 8 wpisow, NIE test kryterium; produkcyjne pendingDiplomacyInbox/negotiationTable nie przechodza przez ten log (patrz main.ts collectTurnEvents)', { afterTurn, afterTurnControl });
      } else {
        assert('(' + label + '7) karta WROCILA po koncu tury, DOKLADNIE jak kontrola ktora przetrwala (dismiss czyszczony co ture)', afterTurn.missing === false, { afterTurn, afterTurnControl });
      }
    } finally {
      await page.close();
    }
  }

  try {
    // --- (A) diplo-pend-* : kształt pendingDiplomacyInbox -------------------------------
    console.log('\n-- (A) karta diplo-pend-* (ksztalt pendingDiplomacyInbox) --');
    await runDismissScenario('A', 'diplo-pend-3-zaproponuj_pokoj-12-0', 'diplo-pend-4-zaproponuj_pokoj-12-0', 'Propozycja pokoju');

    // --- (B) negot-* : kształt negotiationTable ------------------------------------------
    console.log('\n-- (B) karta negot-* (ksztalt negotiationTable) --');
    await runDismissScenario('B', 'negot-pokoj-0-3-t12-1', 'negot-pokoj-0-4-t12-1', 'Kontroferta na stole');

    // --- (C)/(D) kontrole regresji: bunt i prod-empty, wlasna swieza strona ------------
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('C/D: ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('C/D: [pageerror] ' + e.message));
    try {
      await gotoPlaytestMapa(page);

      console.log('\n-- (C) kontrola regresji: karta buntu --');
      const ID_REVOLT = 'revolt-testcity';
      await page.evaluate((id) => {
        window.__sidePanelLinkTestDebug.seedEvents([{
          id, icon: '🔥', title: 'Bunt: Ateny', subtitle: 'Migracja mieszkańców', kind: 'city', blocking: true,
        }]);
      }, ID_REVOLT);
      await wait(500);
      const revolt = await readBlockingCard(page, ID_REVOLT);
      assert('(C1) karta buntu wyrenderowana i rozwinieta', revolt.missing === false && revolt.expanded === true, revolt);
      assert('(C2) MA "Zignoruj — bunt potrwa dalej"', revolt.hasRevoltIgnoreBtn === true, revolt);
      assert('(C3) NIE dubluje sie z "Odloz na pozniej" (kind!=="diplo")', revolt.hasDeferBtn === false, revolt);
      assert('(C4) dokladnie JEDEN przycisk .sp-action-ignore na karcie', revolt.ignoreBtns.length === 1, revolt);
      assert('(C5) karta buntu ma DODATKOWO "✕" w naglowku (przysluguje wszystkim kartom blokujacym)',
        revolt.hasCloseBtn === true && revolt.closeInHeader === true, revolt);

      console.log('\n-- (D) kontrola regresji: karta prod-empty --');
      const ID_PROD = 'prod-empty-testcity';
      await page.evaluate((id) => {
        window.__sidePanelLinkTestDebug.seedEvents([{
          id, icon: '⚙️', title: 'Produkcja: Ateny', subtitle: 'Kolejka pusta', kind: 'city', blocking: true,
        }]);
      }, ID_PROD);
      await wait(500);
      const prod = await readBlockingCard(page, ID_PROD);
      assert('(D1) karta prod-empty wyrenderowana i rozwinieta', prod.missing === false && prod.expanded === true, prod);
      assert('(D2) zero przyciskow .sp-action-ignore (ani "Zignoruj", ani "Odloz")', prod.ignoreBtns.length === 0, prod);
      assert('(D3) "Otworz ->" nietkniety', prod.openBtnText === 'Otwórz →', prod);
      assert('(D4) karta prod-empty ma "✕" w naglowku (przysluguje wszystkim kartom blokujacym)',
        prod.hasCloseBtn === true && prod.closeInHeader === true, prod);
    } finally {
      await page.close();
    }

    assert('(E) zero bledow konsoli/JS przez caly przebieg', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log('\nsidepanel-diplo-dismiss-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
