'use strict';
/**
 * dyplo-karta-decyzji-bilans-skrot-real-render-test.cjs
 *
 * TEMAT: P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (dispatch): zakaz uznania zmiany kompaktowej karty (GOAL 1)
 * za zamkniętą bez żywego zrzutu Chromium PRZED i PO pokazującego usunięcie segmentu
 * „(łącznie X przez Y tur)" — nie tylko czytanie kodu formatującego.
 *
 * METODA: `formatNegotiationDealPlayerSummary` (diplomacy-display.ts, realnie eksportowana,
 * używana przez main.ts::negotiationSummary) zbundlowana dla PRAWDZIWEGO silnika przeglądarki
 * (esbuild, platform:'browser'), wykonana w headless Chromium (Playwright) na TYM SAMYM
 * payloadzie ze zrzutu właściciela (20 Kamień/turę × 10 tur, zapłata 12 ¤/turę):
 *   PRZED — wywołanie DOKŁADNIE jak main.ts:13720 SPRZED tego tematu:
 *           `formatNegotiationDealPlayerSummary(payload, true)` (bez 3. argumentu — kod
 *           główny NIE MIAŁ jeszcze parametru omitTotal, więc to jest bit-identyczne
 *           odtworzenie starego wywołania, nie mutacja pliku).
 *   PO    — wywołanie main.ts:13720 PO fixie: `formatNegotiationDealPlayerSummary(payload,
 *           true, { omitTotal: true })`.
 * Renderowane do DOM (`.side-event-subtitle`) jak realny subtitle karty „WYMAGA DECYZJI".
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI: PRZED musi zawierać „łącznie" (kontrola negatywna — inaczej
 * test nie łapałby regresji cofnięcia fixu).
 *
 * Zrzuty: dyspozycje/autobot/runs/P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1/dowody/
 *   01-przed-kompakt-z-lacznie.png
 *   02-po-kompakt-bez-lacznie.png
 *   03-po-stol-negocjacji-z-lacznie-bez-zmian.png (GOAL 3, regresja — bez omitTotal)
 *
 * Usage (z gra/): node tools/dyplo-karta-decyzji-bilans-skrot-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[dyplo-karta-decyzji-bilans-skrot-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dks-render-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dks-render-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOT_DIR = path.resolve(
  __dirname, '..', '..', 'dyspozycje', 'autobot', 'runs',
  'P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1', 'dowody',
);

async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p });
  console.log('[dyplo-karta-decyzji-bilans-skrot-real-render-test] zrzut: ' + p);
}

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[dyplo-karta-decyzji-bilans-skrot-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

const PAGE_HTML = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
  + 'body{background:#1b1712;font-family:system-ui,sans-serif;padding:24px;}'
  + '.side-event{background:#2a241c;border:1px solid #4a3f2e;border-radius:8px;padding:14px 16px;max-width:420px;}'
  + '.side-event-title{color:#e8dcc0;font-weight:600;margin-bottom:6px;}'
  + '.side-event-subtitle{color:#b9ab8c;font-size:13px;line-height:1.4;}'
  + '</style></head><body>'
  + '<div class="side-event"><div class="side-event-title">Dyplomacja: Kalibangan (miasto-państwo)</div>'
  + '<div class="side-event-subtitle" id="subtitle"></div></div>'
  + '</body></html>';

async function renderSubtitle(page, bundleFile, mode) {
  await page.setContent(PAGE_HTML);
  await page.addScriptTag({ path: bundleFile });
  return page.evaluate((m) => {
    const payload = {
      giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 12 }],
      receiveItems: [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 20 }],
      resourceTradeMode: 'per_turn',
      turns: 10,
    };
    let text;
    if (m === 'przed') {
      // main.ts:13720 SPRZED tematu — bez 3. argumentu (omitTotal jeszcze nie istniał).
      text = window.DKS.formatNegotiationDealPlayerSummary(payload, true) + ' (runda 1/3)';
    } else if (m === 'po-kompakt') {
      // main.ts:13720 PO tym temacie — negotiationSummary(n, true) -> omitTotal:true.
      text = window.DKS.formatNegotiationDealPlayerSummary(payload, true, { omitTotal: true }) + ' (runda 1/3)';
    } else {
      // main.ts:15485 — bez zmian, wywołanie bez omitTotal (GOAL 3).
      text = window.DKS.formatNegotiationDealPlayerSummary(payload, true);
    }
    document.getElementById('subtitle').textContent = text;
    return text;
  }, mode);
}

async function main() {
  console.log('dyplo-karta-decyzji-bilans-skrot-real-render-test — start');
  fs.writeFileSync(ENTRY, `
import { formatNegotiationDealPlayerSummary } from './game/diplomacy-display';
(window as any).DKS = { formatNegotiationDealPlayerSummary };
`, 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'DKS_IIFE',
    target: 'es2020',
    outfile: BUNDLE,
    absWorkingDir: SRC,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();

    const przed = await renderSubtitle(page, BUNDLE, 'przed');
    await shot(page, '01-przed-kompakt-z-lacznie.png');
    check('DOWÓD NIETAUTOLOGICZNOŚCI: PRZED (stare wywołanie bez omitTotal) zawiera "łącznie"',
      przed.includes('łącznie'), przed);

    const po = await renderSubtitle(page, BUNDLE, 'po-kompakt');
    await shot(page, '02-po-kompakt-bez-lacznie.png');
    check('KRYTERIUM 1: PO (kompakt, omitTotal:true) NIE zawiera "łącznie"',
      !po.includes('łącznie'), po);
    check('KRYTERIUM 1: PO nadal pokazuje ilość/turę i liczbę tur (nie pusty tekst)',
      po.includes('20 Kamień na turę') && po.includes('12 ¤ na turę') && po.includes('runda 1/3'),
      po);

    const stol = await renderSubtitle(page, BUNDLE, 'stol');
    await shot(page, '03-po-stol-negocjacji-z-lacznie-bez-zmian.png');
    check('KRYTERIUM 2 (GOAL 3, regresja): stół negocjacji (bez omitTotal) NADAL zawiera "łącznie" — bit-identyczne z PRZED bez sufiksu rundy',
      stol.includes('łącznie 120 ¤ przez 10 tur') && stol.includes('łącznie 200 Kamień przez 10 tur'),
      stol);

    await page.close();
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
    try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }
  }

  console.log('\n' + pass + '/' + (pass + fail) + ' PASS');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  process.exit(1);
});
