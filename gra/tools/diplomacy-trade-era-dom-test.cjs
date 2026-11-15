'use strict';
/**
 * R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r3 — test REALNEGO DOM okna „Umowa wymiany surowców” w Chromium.
 *
 * Bundluje PRAWDZIWY moduł src/ui/diplomacyTradeBasket.ts (esbuild, iife, poza repo), ładuje go w
 * prawdziwym Chromium (playwright, chromium.launch()) i klika prawdziwe przyciski okna:
 *  A. Kamień/Brąz/Żelazo: krok ilości (input step + przyciski +N/+10N/+100N) = 10 / 50 / 100.
 *  B. Mieszane epoki: gracz Kamień (globalna epoka 1), ctx.tradeEra = 2 (partner Brąz) => okno liczy w Brązie
 *     (krok 50), a po zamknięciu okna globalna epoka wraca do 1.
 *  C. Podgląd PN pozycji i „Fair min" w oknie = bramka (diplomacyFairGivePn z PN policzonego w epoce umowy),
 *     w epokach 2 i 3 (brak rozjazdu „podgląd OK / bramka odrzuca").
 *  D. Przyciski ± wiersza koszyka zmieniają ilość o blok epoki.
 *  E. Zatwierdzenie: payload ma ilość będącą wielokrotnością bloku epoki, a onSubmit działa W EPOCE UMOWY
 *     (nie w epoce gracza przywróconej przez closeModal).
 *
 * Mutacja (TRADE_ERA_DOM_MUTATE=blok10): blok 10 w Brazie/Zelazie => CZERWONY.
 * Mutacja (TRADE_ERA_DOM_MUTATE=submit-global): onSubmit bez opakowania w epokę umowy => test CZERWONY.
 * Uruchomienie (z gra/): node tools/diplomacy-trade-era-dom-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-era-dom-'));
const LEADER_STUB = path.join(TMP, 'leader-stub.ts');
const BRAND_STUB = path.join(TMP, 'brand-stub.ts');
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.js');
const MUTATE = process.env.TRADE_ERA_DOM_MUTATE || '';

fs.writeFileSync(LEADER_STUB, [
  'export function leaderPortraitUrl() { return null; }',
  'export function leaderName() { return null; }',
  'export function leaderNameFromPool() { return null; }',
  'export function civDisplayNameFromKey() { return null; }',
  'export function civCardDisplayName(l: any) { return l; }',
  'export function civIconIdFromCivLabel() { return null; }',
].join('\n'), 'utf8');
fs.writeFileSync(BRAND_STUB, [
  'brandIconSvg', 'improvementIconSvg', 'mapResourceIconSvg', 'terrainIconSvg',
  'buildingIconSvg', 'unitIconSvg', 'civIconSvg', 'epochIconSvg', 'settingIconSvg',
  'brandMenuComponentsCss', 'menuIconSvg', 'brandMenuEmblemSvg', 'newGameIntroEmblemSvg',
  'brandMotionCss', 'brandMenuBackgroundCss', 'svgThumbHtml',
].map(f => `export function ${f}() { return ''; }`).join('\n'), 'utf8');
fs.writeFileSync(ENTRY, `
import { showTradeBasketModal } from ${JSON.stringify(path.join(GRA, 'src/ui/diplomacyTradeBasket.ts'))};
import {
  setDiplomacyTradeEra, diplomacyTradeEra, diplomacyDealTradeEra, diplomacyPnSurowiecIlosc,
  diplomacyFairGivePn, diplomacyHandelSurowiecKrok,
} from ${JSON.stringify(path.join(GRA, 'src/game/diplomacy-value-catalog.ts'))};
(window as any).__T = {
  showTradeBasketModal, setDiplomacyTradeEra, diplomacyTradeEra, diplomacyDealTradeEra,
  diplomacyPnSurowiecIlosc, diplomacyFairGivePn, diplomacyHandelSurowiecKrok,
};
`, 'utf8');

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK  ' + m); } else { fail++; console.error(' FAIL ' + m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

async function main() {
  const src = fs.readFileSync(path.join(GRA, 'src/ui/diplomacyTradeBasket.ts'), 'utf8');
  const plugins = [{
    name: 'stub-vite-assets',
    setup(build) {
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_STUB }));
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      if (MUTATE === 'submit-global') {
        // Mutacja: onSubmit bez withDiplomacyTradeEra (powrót do globalnej epoki gracza po closeModal).
        build.onLoad({ filter: /ui[\\/]diplomacyTradeBasket\.ts$/ }, () => {
          const needle = 'withDiplomacyTradeEra(ctx.tradeEra, () => onSubmit(payload));';
          if (!src.includes(needle)) throw new Error('mutacja: brak wzorca w źródle');
          return { contents: src.replace(needle, 'onSubmit(payload);'), loader: 'ts', resolveDir: path.join(GRA, 'src/ui') };
        });
      }
      if (MUTATE === 'blok10') {
        // Mutacja: blok 10 we wszystkich epokach (regresja do starego kroku) => testy Brązu/Żelaza CZERWONE.
        const catSrc = fs.readFileSync(path.join(GRA, 'src/game/diplomacy-value-catalog.ts'), 'utf8');
        const needle = 'return readHandelSurowceParam(KROK_BLOK_ROW_BY_ERA[e], KROK_BLOK_FALLBACK_BY_ERA[e]);';
        if (!catSrc.includes(needle)) throw new Error('mutacja blok10: brak wzorca');
        build.onLoad({ filter: /game[\\/]diplomacy-value-catalog\.ts$/ }, () => ({
          contents: catSrc.replace(needle, 'return 10;'), loader: 'ts', resolveDir: path.join(GRA, 'src/game'),
        }));
      }
    },
  }];
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', outfile: BUNDLE,
    absWorkingDir: GRA, logLevel: 'silent', plugins,
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text', '.mp3': 'empty', '.png': 'empty' },
  });

  const { chromium } = require('playwright');
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); }
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({ path: BUNDLE });

    const BLOKI = { 1: 10, 2: 50, 3: 100 };
    const ERA_NAME = { 1: 'Kamień', 2: 'Brąz', 3: 'Żelazo' };

    // Otwiera okno w epoce umowy `dealEra` przy globalnej epoce gracza `playerEra`; zwraca stan DOM.
    async function openAndRead(playerEra, dealEra, resId) {
      return page.evaluate(({ playerEra, dealEra, resId }) => {
        const T = window.__T;
        // Realny przepływ: poprzednie okno zamknięte (Anuluj) ZANIM zmieni się epoka gracza.
        const prevCancel = document.querySelector('.cdb-cancel');
        if (prevCancel) prevCancel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        document.body.innerHTML = '';
        T.setDiplomacyTradeEra(playerEra);
        window.__submitted = null;
        const ctx = {
          civName: 'Rzym', relacjaTotal: 100, playerSkarbiec: 5000, progHandelRelacja: 0, progDarRelacja: 0,
          giveTechOptions: [], receiveTechOptions: [], cityOptions: [],
          giveQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 5000 }, { id: 'zloto', label: 'Złoto', maxQty: 5000 }],
          receiveQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 5000 }, { id: 'kamien', label: 'Kamień', maxQty: 5000 }],
          tradeEra: dealEra,
        };
        T.showTradeBasketModal('trade', { id: '14', label: 'Umowa wymiany surowców' }, ctx,
          payload => { window.__submitted = { payload, eraInsideSubmit: T.diplomacyTradeEra() }; }, () => {});
        const q = s => Array.from(document.querySelectorAll(s));
        const chip = q('.cdb-chip-typ').find(c => c.getAttribute('data-side') === 'give' && c.getAttribute('data-value') === 'surowiec_ilosc');
        chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const rc = q('.cdb-chip-resqty').find(c => c.getAttribute('data-side') === 'give' && c.getAttribute('data-value') === resId);
        rc.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const inp = q('.cdb-res-qty-num').find(i => i.getAttribute('data-side') === 'give');
        return {
          step: inp.step, min: inp.min, value: inp.value,
          deltas: Array.from(inp.closest('.cdb-qty-stepper').querySelectorAll('.cdb-qty-step')).map(b => b.getAttribute('data-delta')),
          deltaLabels: Array.from(inp.closest('.cdb-qty-stepper').querySelectorAll('.cdb-qty-step')).map(b => b.textContent),
          globalEraWhileOpen: T.diplomacyTradeEra(),
        };
      }, { playerEra, dealEra, resId });
    }

    // A. Krok per epoka (gracz i umowa w tej samej epoce).
    for (const era of [1, 2, 3]) {
      const r = await openAndRead(era, era, 'drewno');
      console.log(`[A] ${ERA_NAME[era]}: ${JSON.stringify(r)}`);
      eq(r.step, String(BLOKI[era]), `A ${ERA_NAME[era]}: input.step = ${BLOKI[era]}`);
      eq(r.min, String(BLOKI[era]), `A ${ERA_NAME[era]}: input.min = ${BLOKI[era]}`);
      eq(r.value, String(BLOKI[era]), `A ${ERA_NAME[era]}: wartość domyślna = 1 blok (${BLOKI[era]})`);
      eq(JSON.stringify(r.deltas), JSON.stringify([BLOKI[era], BLOKI[era] * 10, BLOKI[era] * 100].map(String)),
        `A ${ERA_NAME[era]}: przyciski +N/+10N/+100N`);
    }

    // B. Mieszane epoki: gracz Kamień (global 1), umowa Brąz (2) => krok 50; po zamknięciu global wraca do 1.
    {
      const r = await openAndRead(1, 2, 'drewno');
      console.log('[B] gracz Kamień + partner Brąz:', JSON.stringify(r));
      eq(r.step, '50', 'B mieszane (Kamień+Brąz): krok okna = 50 (epoka umowy, nie gracza)');
      eq(r.globalEraWhileOpen, 2, 'B okno otwarte: epoka handlu = epoka umowy 2');
      const r2 = await openAndRead(1, 3, 'drewno');
      eq(r2.step, '100', 'B mieszane (Kamień+Żelazo): krok okna = 100');
      const r3 = await openAndRead(2, 1, 'drewno');
      eq(r3.step, '10', 'B kontrola: ctx.tradeEra=1 (umowa Kamień) przy epoce gracza 2 => 10 (okno słucha ctx, nie globalnej)');
    }

    // Dodaje pozycję (z domyślną ilością) i czyta podgląd PN / Fair min / przyciski wiersza.
    async function addItemAndReadPn(playerEra, dealEra, qtyBlocks) {
      return page.evaluate(({ playerEra, dealEra, qtyBlocks }) => {
        const T = window.__T;
        // Realny przepływ: poprzednie okno zamknięte (Anuluj) ZANIM zmieni się epoka gracza.
        const prevCancel = document.querySelector('.cdb-cancel');
        if (prevCancel) prevCancel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        document.body.innerHTML = '';
        T.setDiplomacyTradeEra(playerEra);
        window.__submitted = null;
        const ctx = {
          civName: 'Rzym', relacjaTotal: 100, playerSkarbiec: 5000, progHandelRelacja: 0, progDarRelacja: 0,
          giveTechOptions: [], receiveTechOptions: [], cityOptions: [],
          giveQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 5000 }, { id: 'ruda_zelaza', label: 'Ruda żelaza', maxQty: 5000 }],
          receiveQuantityResourceOptions: [{ id: 'kamien', label: 'Kamień', maxQty: 5000 }],
          tradeEra: dealEra,
        };
        T.showTradeBasketModal('trade', { id: '14', label: 'Umowa wymiany surowców' }, ctx,
          payload => { window.__submitted = { payload, eraInsideSubmit: T.diplomacyTradeEra() }; }, () => {});
        const q = s => Array.from(document.querySelectorAll(s));
        const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const add = side => {
          const pre = side === 'give' ? 'give' : 'recv';
          click(q('.cdb-chip-typ').find(c => c.getAttribute('data-side') === pre && c.getAttribute('data-value') === 'surowiec_ilosc'));
          click(q('.cdb-chip-resqty').find(c => c.getAttribute('data-side') === pre
            && c.getAttribute('data-value') === (side === 'give' ? 'drewno' : 'kamien')));
          const inp = q('.cdb-res-qty-num').find(i => i.getAttribute('data-side') === pre);
          const krok = parseInt(inp.step, 10);
          inp.value = String(krok * qtyBlocks);
          click(q('.cdb-add-btn').find(b => b.getAttribute('data-side') === pre && b.getAttribute('data-edit-idx') == null));
        };
        add('give');
        add('receive');
        const txt = document.querySelector('.civ-diplo-basket-overlay > div').textContent;
        const sum = /SUMA oddaję:\s*([\d.,]+) PW\s*·\s*SUMA dostaję:\s*([\d.,]+) PW/.exec(txt);
        const fair = /Fair min \(Rel (\d+)\):\s*([\d.,]+) PW/.exec(txt);
        const rowInputs = q('.cdb-row-qty-inp').map(i => ({ v: i.value, step: i.step, min: i.min }));
        const rowSteps = q('.cdb-row-qty-step').map(b => b.getAttribute('data-delta'));
        return {
          givePnUi: sum ? Number(sum[1]) : null, receivePnUi: sum ? Number(sum[2]) : null,
          fairMinUi: fair ? Number(fair[2]) : null, rel: fair ? Number(fair[1]) : null,
          rowInputs, rowSteps,
          // PN i Fair min liczone „bramką" (ta sama funkcja katalogu, w epoce umowy, jawnie).
          givePnGate: T.diplomacyPnSurowiecIlosc('drewno', T.diplomacyHandelSurowiecKrok('drewno', dealEra) * qtyBlocks, dealEra),
          receivePnGate: T.diplomacyPnSurowiecIlosc('kamien', T.diplomacyHandelSurowiecKrok('kamien', dealEra) * qtyBlocks, dealEra),
        };
      }, { playerEra, dealEra, qtyBlocks });
    }

    // C. Podgląd PN = bramka w epokach 2 i 3 (oraz 1 jako kontrola); 3 bloki każdej pozycji.
    for (const era of [1, 2, 3]) {
      const r = await addItemAndReadPn(era, era, 3);
      console.log(`[C] ${ERA_NAME[era]}:`, JSON.stringify(r));
      eq(r.givePnUi, r.givePnGate, `C ${ERA_NAME[era]}: SUMA oddaję (UI) = PN z katalogu w epoce umowy`);
      eq(r.receivePnUi, r.receivePnGate, `C ${ERA_NAME[era]}: SUMA dostaję (UI) = PN z katalogu w epoce umowy`);
      ok(r.givePnUi === 3 * 1, `C ${ERA_NAME[era]}: 3 bloki drewna = 3 PN (cena za blok bez zmian: 1 PN)`);
      ok(r.receivePnUi === 3 * 3, `C ${ERA_NAME[era]}: 3 bloki kamienia = 9 PN (cena za blok bez zmian: 3 PN)`);
      const fairGate = await page.evaluate(({ pn, rel }) => window.__T.diplomacyFairGivePn(pn, rel), { pn: r.receivePnUi, rel: r.rel });
      eq(r.fairMinUi, fairGate, `C ${ERA_NAME[era]}: Fair min w oknie = diplomacyFairGivePn(receivePn, Rel) (bramka)`);
      // D. Przyciski ± wiersza koszyka: krok = blok epoki.
      ok(r.rowSteps.length > 0 && r.rowSteps.every(d => d === String(BLOKI[era]) || d === '-' + BLOKI[era]),
        `D ${ERA_NAME[era]}: przyciski ± wiersza koszyka zmieniają o ${BLOKI[era]} (got ${JSON.stringify(r.rowSteps)})`);
      ok(r.rowInputs.every(i => i.step === String(BLOKI[era]) && i.min === String(BLOKI[era])
        && Number(i.v) % BLOKI[era] === 0 && Number(i.v) === 3 * BLOKI[era]),
        `D ${ERA_NAME[era]}: ilości w wierszach = 3 bloki = ${3 * BLOKI[era]} (got ${JSON.stringify(r.rowInputs)})`);
    }

    // C/mieszane: Kamień (gracz) + Brąz (umowa): podgląd = bramka w epoce umowy (Brąz).
    {
      const r = await addItemAndReadPn(1, 2, 3);
      eq(r.givePnUi, r.givePnGate, 'C mieszane (Kamień+Brąz): SUMA oddaję (UI) = PN w epoce umowy');
      ok(r.rowInputs.every(i => Number(i.v) === 150 && i.step === '50'), 'C mieszane: 3 bloki Brązu = 150 szt. w wierszach (krok 50)');
    }

    // D. Realny klik „+" na wierszu koszyka zmienia ilość o blok epoki (Brąz: 150 -> 200, Żelazo: 300 -> 400).
    for (const era of [2, 3]) {
      const r = await addItemAndReadPn(1, era, 3);
      void r;
      const clicked = await page.evaluate(() => {
        const plus = Array.from(document.querySelectorAll('.cdb-row-qty-step')).find(b => Number(b.getAttribute('data-delta')) > 0);
        const before = plus.parentElement.querySelector('.cdb-row-qty-inp').value;
        plus.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const inp = Array.from(document.querySelectorAll('.cdb-row-qty-inp'))[0];
        return { before, after: inp.value };
      });
      eq(Number(clicked.after) - Number(clicked.before), BLOKI[era], `D klik „+" w wierszu (umowa ${ERA_NAME[era]}): +${BLOKI[era]} (got ${JSON.stringify(clicked)})`);
    }

    // E. Zatwierdzenie: payload w blokach epoki; onSubmit w epoce umowy (nie w epoce gracza).
    for (const [playerEra, dealEra] of [[2, 2], [3, 3], [1, 2], [1, 3]]) {
      await addItemAndReadPn(playerEra, dealEra, 2);
      const res = await page.evaluate(() => {
        const btn = document.querySelector('.cdb-submit');
        if (!btn || btn.disabled) return { disabled: true };
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return { submitted: window.__submitted, eraAfter: window.__T.diplomacyTradeEra() };
      });
      console.log(`[E] gracz ${ERA_NAME[playerEra]} / umowa ${ERA_NAME[dealEra]}:`, JSON.stringify(res));
      ok(!res.disabled && !!res.submitted, `E ${playerEra}/${dealEra}: zatwierdzenie przeszło walidację okna (przycisk aktywny)`);
      if (res.submitted) {
        const items = [...(res.submitted.payload.giveItems || []), ...(res.submitted.payload.receiveItems || [])]
          .filter(i => i.typ === 'surowiec_ilosc');
        ok(items.length === 2 && items.every(i => i.ilosc === 2 * BLOKI[dealEra]),
          `E ${playerEra}/${dealEra}: payload ma 2 bloki epoki umowy = ${2 * BLOKI[dealEra]} szt. (got ${JSON.stringify(items.map(i => i.ilosc))})`);
        eq(res.submitted.eraInsideSubmit, dealEra, `E ${playerEra}/${dealEra}: onSubmit liczy w epoce UMOWY (nie epoki gracza)`);
        eq(res.eraAfter, playerEra, `E ${playerEra}/${dealEra}: po zatwierdzeniu epoka handlu wraca do epoki gracza`);
      }
    }

    ok(errors.length === 0, 'brak pageerror (got ' + JSON.stringify(errors) + ')');
  } finally {
    await browser.close();
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`\ndiplomacy-trade-era-dom-test${MUTATE ? ' [MUTACJA ' + MUTATE + ']' : ''}: ${pass} pass / ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {} process.exit(2); });
