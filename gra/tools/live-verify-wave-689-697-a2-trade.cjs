'use strict';
/**
 * R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1 (punkt 2 podziału W80A / FALA 692).
 *
 * Pomiar na ŻYWEJ grze (headless Chromium, zbudowany bundle vite, `?playtest=mapa&civTest=1`):
 * okno „Umowa wymiany surowców” (koszyk, akcja '14') z AI.
 *
 *  P1  okno otwiera się z audiencji AI (klik przycisku akcji '14')
 *  P2  znaczniki na węzłach (box okna, .cdb-body-scroll, .cdb-col strony B) PRZEŻYWAJĄ:
 *      (a) dodanie pozycji po stronie „oferujemy” (give) — identyczność węzła `===`,
 *      (b) dodanie pozycji po stronie „oferują” (recv) — identyczność węzła `===`
 *  P3  obie strony niepuste → „Zaproponuj” aktywny; jeden klik = JEDNA propozycja (diff stołu = 1)
 *  P4  neutralna podpowiedź przy pustej stronie: tekst odczytany i zapisany (bez ostrzeżenia)
 *  P5  zrzuty przed/po (deviceScaleFactor 1) zapisane w runs/.../shots-<TAG>/
 *
 * Dowód mutacyjny: `--dist` wskazuje bundle zbudowany z KOPII gra/ z cofniętą poprawką
 * (morphBasketMarkup -> box.innerHTML = inner); wtedy P2 MUSI być FAIL.
 *
 * Usage (z gra/):
 *   node tools/live-verify-wave-689-697-a2-trade.cjs --dist <dir-bundle> --tag pre
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const RUN_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg('dist', ''));
const TAG = arg('tag', 'pre');
const OUT = path.join(RUN_DIR, `trade-live-${TAG}.json`);
const SHOTS = path.join(RUN_DIR, `shots-${TAG}`);
const CHROME_CANDIDATES = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'];
const wait = ms => new Promise(r => setTimeout(r, ms));

const res = { tag: TAG, dist: path.basename(DIST), points: {}, checks: [], pageErrors: [], notes: [] };
function check(id, label, cond, detail) {
  res.checks.push({ id, label, status: cond ? 'PASS' : 'FAIL', detail: detail === undefined ? null : detail });
  console.log(`  ${cond ? 'OK  ' : 'FAIL'} [${id}] ${label}` + (cond || detail === undefined ? '' : ' -- ' + JSON.stringify(detail)));
}
function flush() { fs.mkdirSync(RUN_DIR, { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(res, null, 1)); }

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    const exe = CHROME_CANDIDATES.find(p => fs.existsSync(p));
    if (!exe) throw new Error('brak przeglądarki Chromium (sprawdzono ' + CHROME_CANDIDATES.join(', ') + ')');
    return await chromium.launch({ headless: true, executablePath: exe, args });
  }
}

async function main() {
  if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('--dist: brak index.html w ' + DIST);
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { throw new Error('playwright niedostępny (npm ci w gra/): ' + e.message); }
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => res.pageErrors.push(String(e.message || e).slice(0, 300)));
    const ev = (fn, arg) => page.evaluate(fn, arg);
    const shot = async name => { await page.screenshot({ path: path.join(SHOTS, name) }); res.notes.push('shot ' + name); };

    // ---------- SETUP: gra zaladowana, miasto gracza, kontakt + Wymiana + pokoj z AI ----------
    await page.goto('file://' + path.join(DIST, 'index.html') + '?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__civTest && !!window.__eraTestDebug
      && !!window.__audienceRelTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0, undefined, { timeout: 180000 });
    await ev(() => window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest());
    const foundOk = await ev(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    const info = await ev(() => window.__aiTradeWiringTestDebug.info());
    const ai = info.ai;
    res.info = { ai, aiCities: info.aiCities, myCities: info.myCities, foundFirstCity: foundOk, pricedKeys: info.pricedKeys.length };
    const prep = await ev(a => window.__aiTradeWiringTestDebug.prepare(a), ai);
    res.prep = prep;
    // Zasoby obu stron (wszystkie klucze z katalogu cen), zeby chipy surowcow byly dostepne po obu stronach.
    await ev(([a, keys]) => {
      const h = window.__aiTradeWiringTestDebug;
      for (const k of keys) { h.setStock(0, k, 400); h.setStock(a, k, 400); }
    }, [ai, info.pricedKeys]);

    // ---------- P1: otwarcie okna przez audiencje AI i przycisk akcji '14' ----------
    await ev(a => window.__audienceRelTestDebug.openAudience(a), ai);
    await page.waitForSelector('.civ-diplo-aud', { timeout: 15000 }).catch(() => {});
    const btn14 = page.locator('.civ-diplo-aud button[data-aid="14"]').first();
    const hasBtn = (await btn14.count()) > 0;
    const btnState = hasBtn ? { disabled: await btn14.evaluate(el => el.disabled), text: (await btn14.textContent() || '').trim() } : null;
    const audButtons = await ev(() => Array.from(document.querySelectorAll('.civ-diplo-aud button[data-aid]')).map(b => ({ aid: b.getAttribute('data-aid'), text: (b.textContent || '').trim().slice(0, 40), disabled: b.disabled })));
    res.audienceButtons = audButtons;
    if (!hasBtn || btnState.disabled) {
      res.points.P1 = { status: 'NIE_ZMIERZONO', reason: hasBtn ? 'przycisk akcji 14 wyłączony' : 'brak przycisku akcji 14 w oknie audiencji', btnState };
      check('P1', 'okno „Umowa wymiany surowców” otwiera się z audiencji AI', false, { hasBtn, btnState });
      flush();
      return;
    }
    await btn14.click();
    await page.waitForSelector('.civ-diplo-basket-overlay > div .cdb-body-scroll', { timeout: 15000 }).catch(() => {});
    const opened = await page.locator('.civ-diplo-basket-overlay > div').count();
    check('P1', 'okno „Umowa wymiany surowców” otwarte (overlay koszyka)', opened > 0, { opened });
    res.points.P1 = { status: opened > 0 ? 'PASS' : 'FAIL' };
    if (!opened) { flush(); return; }

    // Znaczniki na trzech wezlach: box okna, przewijany kontener, kolumna strony B (kontrpropozycja).
    await ev(() => {
      const box = document.querySelector('.civ-diplo-basket-overlay > div');
      const scroll = box.querySelector('.cdb-body-scroll');
      const colB = document.querySelector('.cdb-add[data-side="recv"]').closest('.cdb-col');
      window.__W2A2 = { box, scroll, colB };
      box.dataset.w2a2 = 'box'; scroll.dataset.w2a2 = 'scroll'; colB.dataset.w2a2 = 'colB';
      box.__w2a2 = 1; scroll.__w2a2 = 1; colB.__w2a2 = 1;
    });
    await shot('01-okno-otwarte-puste.png');
    res.notes.push('zrzut 01: okno otwarte, obie strony puste (przed dodaniem pozycji)');

    const sameNodes = () => ev(() => {
      const R = window.__W2A2;
      const box = document.querySelector('.civ-diplo-basket-overlay > div');
      const scroll = box && box.querySelector('.cdb-body-scroll');
      const colAddB = document.querySelector('.cdb-add[data-side="recv"]');
      const colB = colAddB && colAddB.closest('.cdb-col');
      return {
        box: !!box && box === R.box, scroll: !!scroll && scroll === R.scroll, colB: !!colB && colB === R.colB,
        expando: !!box && box.__w2a2 === 1 && !!scroll && scroll.__w2a2 === 1 && !!colB && colB.__w2a2 === 1,
      };
    });
    const rowCount = side => page.locator(`.cdb-deal-row[data-side="${side}"]`).count();

    // Wybor surowca + ilosc + „Dodaj” po jednej stronie (chipy surowcow: typ surowiec_ilosc).
    // excludeId: surowiec, ktorego NIE wybierac (po stronie „oferują” inny niz oferowany, zeby P3c
    // rozrozniał obie strony).
    async function addResource(side, excludeId) {
      const typChip = page.locator(`.cdb-chip-typ[data-side="${side}"][data-value="surowiec_ilosc"]`).first();
      if ((await typChip.count()) === 0) {
        const avail = await ev(s => Array.from(document.querySelectorAll(`.cdb-chip-typ[data-side="${s}"]`)).map(c => c.getAttribute('data-value')), side);
        throw new Error(`brak chipa typu surowiec_ilosc po stronie ${side}; dostępne: ${JSON.stringify(avail)}`);
      }
      await typChip.click();
      const pickId = await ev(([s, ex]) => {
        const ids = Array.from(document.querySelectorAll(`.cdb-chip-resqty[data-side="${s}"]`)).map(c => c.getAttribute('data-value'));
        return ids.find(v => v !== ex) || null;
      }, [side, excludeId || null]);
      if (!pickId) throw new Error(`brak innego surowca niż ${excludeId} po stronie ${side}`);
      const rc = page.locator(`.cdb-chip-resqty[data-side="${side}"][data-value="${pickId}"]`).first();
      const resId = await rc.getAttribute('data-value');
      const resLabel = ((await rc.textContent()) || '').replace(/\s+/g, ' ').replace(/\s*\d[\d\s]*$/, '').trim();
      await rc.click();
      await page.locator(`.cdb-res-qty-num[data-side="${side}"]`).first().fill('20');
      await page.locator(`.cdb-add-btn[data-side="${side}"]:not([data-edit-idx])`).first().click();
      await wait(300);
      return { resId, resLabel };
    }

    // Stan „obie strony puste”: kod pokazuje podpowiedz tylko gdy DOKLADNIE jedna strona jest pusta
    // (oneSideEmpty = XOR), wiec tu oczekiwane jest null. Zapis dla jawnosci (bez PASS/FAIL).
    const bothEmptyHint = await ev(() => { const h = document.querySelector('.cdb-neutral-hint'); return h ? (h.textContent || '').trim() : null; });
    res.bothEmptyHint = bothEmptyHint;

    // ---------- P2a: dodanie po stronie „oferujemy” (give) ----------
    const beforeGive = await sameNodes();
    const giveRes = await addResource('give', null);
    const afterGive = await sameNodes();
    const giveRows = await rowCount('give');
    await shot('02-po-dodaniu-oferujemy.png');
    res.notes.push('zrzut 02: po dodaniu pozycji po stronie „oferujemy”');
    const hintAfterGive = await ev(() => { const h = document.querySelector('.cdb-neutral-hint'); return h ? (h.textContent || '').trim() : null; });
    const summaryAfterGive = await ev(() => (document.querySelector('.civ-diplo-basket-overlay > div') || {}).textContent || '');
    res.hintAfterGive = hintAfterGive;
    res.giveLabel = giveRes.resLabel;
    check('P2a', 'po dodaniu po stronie „oferujemy” węzły box/.cdb-body-scroll/.cdb-col(B) to TE SAME węzły (===)',
      afterGive.box && afterGive.scroll && afterGive.colB && afterGive.expando,
      { before: beforeGive, after: afterGive, giveRows, giveResId: giveRes });
    check('P2a-rows', 'po stronie „oferujemy” jest 1 wiersz pozycji', giveRows === 1, { giveRows });

    // ---------- P4: podpowiedz neutralna przy pustej stronie „oferują” ----------
    const neutralOk = !!hintAfterGive && /Dodaj, co chcesz dostać w zamian/.test(hintAfterGive) && !/ryzyko odrzucenia/.test(summaryAfterGive);
    check('P4', 'przy pustej stronie „oferują” widoczna neutralna podpowiedź (tekst odczytany, bez ostrzeżenia)', neutralOk, { hint: hintAfterGive });
    const submitBeforeRecv = await page.locator('.cdb-submit').first().isDisabled().catch(() => null);
    res.submitDisabledWhenOnlyGive = submitBeforeRecv;

    // ---------- P2b: dodanie po stronie „oferują” (recv) ----------
    const beforeRecv = await sameNodes();
    const recvRes = await addResource('recv', giveRes.resId);
    const afterRecv = await sameNodes();
    const recvRows = await rowCount('receive');
    const giveRowsAfterRecv = await rowCount('give');
    await shot('03-po-dodaniu-oferuja-przed-zaproponuj.png');
    res.notes.push('zrzut 03: po dodaniu pozycji po stronie „oferują”, przed „Zaproponuj”');
    check('P2b', 'po dodaniu po stronie „oferują” węzły box/.cdb-body-scroll/.cdb-col(B) to TE SAME węzły (===)',
      afterRecv.box && afterRecv.scroll && afterRecv.colB && afterRecv.expando,
      { before: beforeRecv, after: afterRecv, recvRows, recvResId: recvRes });
    check('P2b-rows', 'obie strony zachowały swoje pozycje po dodaniu drugiej (give=1, receive=1)', recvRows === 1 && giveRowsAfterRecv === 1, { recvRows, giveRowsAfterRecv });

    // ---------- P3: obie strony niepuste -> aktywny przycisk, jeden klik = jedna propozycja ----------
    // Miara: dlugosc stolu negocjacji (state().tableLen, pole hooka) + licznik wlasnych wpisow w oknie audiencji.
    const submit = page.locator('.cdb-submit').first();
    const submitDisabled = await submit.isDisabled().catch(() => null);
    const tableBefore = await ev(() => window.__aiTradeWiringTestDebug.state().tableLen);
    res.tableBefore = tableBefore;
    if (submitDisabled === false) {
      await submit.click();
      await wait(800);
    }
    const tableAfter = await ev(() => window.__aiTradeWiringTestDebug.state().tableLen);
    const toast = await ev(() => { try { return window.__eraTestDebug.getToast(); } catch (e) { return null; } });
    const overlayAfter = await page.locator('.civ-diplo-basket-overlay').count();
    await ev(a => window.__audienceRelTestDebug.openAudience(a), ai);
    await page.waitForSelector('.civ-diplo-aud', { timeout: 15000 }).catch(() => {});
    await wait(300);
    const ownRemove = await page.locator('.civ-diplo-aud [data-negot-act="remove"]').count();
    const ownRowText = await ev(() => Array.from(document.querySelectorAll('.civ-diplo-aud [data-negot-act="remove"]')).map(b => { const row = b.closest('[class*="row"], li, tr, div') || b.parentElement; return (row ? row.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 220); }));
    await shot('04-po-zaproponuj.png');
    res.notes.push('zrzut 04: po kliknięciu „Zaproponuj” (okno audiencji z wpisami)');
    res.submitDisabled = submitDisabled; res.tableAfter = tableAfter; res.toast = toast; res.ownRemove = ownRemove; res.ownRowText = ownRowText;
    check('P3a', 'obie strony niepuste -> przycisk „Zaproponuj” aktywny', submitDisabled === false, { submitDisabled });
    check('P3b', 'jeden klik „Zaproponuj” = JEDNA propozycja na stole (tableLen +1; 2 wiersze własne = po jednym na stronę)', tableAfter - tableBefore === 1 && ownRemove === 2, { tableBefore, tableAfter, ownRemove, overlayAfter, toast });
    const audText = await ev(() => { const a = document.querySelector('.civ-diplo-aud'); return a ? a.textContent.replace(/\s+/g, ' ') : ''; });
    const labelsInAud = [giveRes.resLabel, recvRes.resLabel].map(l => !!l && audText.includes(l));
    res.audLabels = { give: giveRes.resLabel, recv: recvRes.resLabel, found: labelsInAud };
    check('P3c', 'wpis propozycji w oknie audiencji zawiera obie strony (etykiety oferowanego i żądanego surowca)', labelsInAud[0] && labelsInAud[1], { give: giveRes.resLabel, recv: recvRes.resLabel, found: labelsInAud });

    // ---------- P4 symetrycznie: strona „oferujemy” PUSTA, „oferują” wypełniona ----------
    // Ponowne otwarcie okna (po Zaproponuj) i dodanie TYLKO po stronie „oferują”.
    await btn14.click().catch(() => {});
    await page.waitForSelector('.civ-diplo-basket-overlay > div .cdb-body-scroll', { timeout: 15000 }).catch(() => {});
    const reopenedRows = { give: await rowCount('give'), receive: await rowCount('receive') };
    res.reopenedRows = reopenedRows;
    let hintGiveEmpty = null;
    if (await page.locator('.cdb-add[data-side="recv"]').count()) {
      await addResource('recv', null);
      hintGiveEmpty = await ev(() => { const h = document.querySelector('.cdb-neutral-hint'); return h ? (h.textContent || '').trim() : null; });
    }
    res.hintGiveEmpty = hintGiveEmpty;
    const symNeutral = !!hintGiveEmpty && /Dodaj, co oddasz w zamian/.test(hintGiveEmpty)
      && reopenedRows.give === 0;
    check('P4-give-empty', 'przy pustej stronie „oferujemy” (oferują wypełnione) neutralna podpowiedź „Dodaj, co oddasz w zamian…”', symNeutral, { hint: hintGiveEmpty, reopenedRows });

    res.points.P2 = { status: res.checks.filter(c => c.id.startsWith('P2')).every(c => c.status === 'PASS') ? 'PASS' : 'FAIL' };
    res.points.P3 = { status: res.checks.filter(c => c.id.startsWith('P3')).every(c => c.status === 'PASS') ? 'PASS' : 'FAIL' };
    res.points.P4 = { status: ['P4', 'P4-give-empty'].every(id => (res.checks.find(c => c.id === id) || {}).status === 'PASS') ? 'PASS' : 'FAIL' };
    const shotFiles = ['01-okno-otwarte-puste.png', '02-po-dodaniu-oferujemy.png', '03-po-dodaniu-oferuja-przed-zaproponuj.png', '04-po-zaproponuj.png'];
    const shotSizes = shotFiles.map(f => { try { return fs.statSync(path.join(SHOTS, f)).size; } catch (_) { return 0; } });
    const shotsOk = shotSizes.every(s => s > 0);
    res.points.P5 = { status: shotsOk ? 'PASS' : 'FAIL', detail: { dir: path.relative(GRA, SHOTS), files: shotFiles, bytes: shotSizes } };
    check('P5', 'zrzuty 01–04 zapisane w katalogu shots-<TAG> (niepuste pliki; sam fakt zapisu, oglądanie w raporcie)', shotsOk, { shotSizes });
    flush();
  } finally {
    await browser.close();
  }
}

main().then(() => {
  const fails = res.checks.filter(c => c.status === 'FAIL').length;
  console.log(`\nRESULT tag=${TAG}: checks=${res.checks.length} FAIL=${fails} pageErrors=${res.pageErrors.length}`);
  console.log(JSON.stringify(res.points));
  flush();
  process.exitCode = fails ? 1 : 0;
}).catch(e => {
  res.fatal = String(e && e.message || e).slice(0, 600);
  console.error('FATAL', res.fatal);
  flush();
  process.exitCode = 1;
});
