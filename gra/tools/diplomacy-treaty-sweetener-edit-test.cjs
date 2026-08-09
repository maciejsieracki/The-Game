'use strict';
/**
 * diplomacy-treaty-sweetener-edit-test.cjs — P-DYPLO-SWEETENER-KOSZYK-W-TRAKTACIE (2026-08-09).
 *
 * Kontekst: R-DYP-STOL-A-KOREKTA rozdzieliła traktaty (nap/sojusz/granice/wasal/pokój/…) od
 * koszyka wymiany dóbr — traktat GRACZA to czysty formularz (0 pól koszyka, patrz
 * diplomacy-proposal-test.cjs test #21). Evaluator znalazł asymetrię: gdy AI konstruuje
 * KONTROFERTĘ do takiego traktatu, silnik (SWEETENER_COUNTER_ELIGIBLE/withExtraSweetenerGold
 * w diplomacy-proposals.ts) sam wstrzykuje złoto-słodzik do koszyka tej kontroferty —
 * „Edytuj propozycję na stole" otwierało formularz z pozycjami koszyka JUŻ W ŚRODKU, ale bez
 * ŻADNEGO UI do podglądu/edycji/usunięcia (renderBasket → gałąź isTreatyOnly renderowała
 * WYŁĄCZNIE treatySummaryHtml jako tekst, bez kolumn give/receive).
 *
 * Decyzja Macieja (ECHO A): sweetener AI ZOSTAJE, ale gracz musi dostać UI podglądu/edycji/
 * usunięcia pozycji koszyka w formularzu edycji kontroferty AI — symetria INFORMACYJNA,
 * NIE funkcjonalna (gracz nie dostaje przycisku "dodaj" przy WŁASNYCH ofertach).
 *
 * Ten test pokrywa (jak w zleceniu):
 *  (a) kontroferta AI ze sweetenerem pokazuje UI koszyka z poprawną ilością złota,
 *  (b) usunięcie/zmiana w UI wpływa na finalny payload (nie tylko kosmetyczny widok),
 *  (c) traktat inicjowany przez GRACZA (initial=undefined) nadal NIE pokazuje koszyka —
 *      bez regresji R-DYP-STOL-A-KOREKTA.
 *
 * Wzorzec harnessu (esbuild bundle + jsdom) — identyczny jak test #21 w
 * diplomacy-proposal-test.cjs i cały diplomacy-basket-edit-test.cjs.
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

let JSDOM;
try { ({ JSDOM } = require(path.resolve(__dirname, '..', 'node_modules', 'jsdom'))); }
catch (e) {
  console.error('jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const STUB_DIR = path.resolve(__dirname, '.stubs');
const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'leaderPortraits-sweetener-edit-stub.ts');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'brandAssets-sweetener-edit-stub.ts');
fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(
  LEADER_PORTRAITS_STUB,
  [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return null; }",
    "export function leaderNameFromPool() { return null; }",
    "export function civDisplayNameFromKey() { return null; }",
    "export function civCardDisplayName(label) { return label; }",
    "export function civIconIdFromCivLabel() { return null; }",
  ].join('\n'),
  'utf8',
);
fs.writeFileSync(
  BRAND_ASSETS_STUB,
  [
    "export function brandIconSvg() { return ''; }",
    "export function improvementIconSvg() { return ''; }",
    "export function mapResourceIconSvg() { return ''; }",
    "export function terrainIconSvg() { return ''; }",
    "export function buildingIconSvg() { return ''; }",
    "export function unitIconSvg() { return ''; }",
    "export function civIconSvg() { return ''; }",
    "export function epochIconSvg() { return ''; }",
    "export function settingIconSvg() { return ''; }",
    "export function brandMenuComponentsCss() { return ''; }",
    "export function menuIconSvg() { return ''; }",
    "export function brandMenuEmblemSvg() { return ''; }",
    "export function newGameIntroEmblemSvg() { return ''; }",
    "export function brandMotionCss() { return ''; }",
    "export function brandMenuBackgroundCss() { return ''; }",
    "export function svgThumbHtml() { return ''; }",
  ].join('\n'),
  'utf8',
);

const BUNDLE = path.resolve(__dirname, '.dip-sweetener-edit-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-sweetener-edit-entry.ts');
fs.writeFileSync(entryFile, `
export {
  showTradeBasketModal, hideTradeBasketModal, getTradeBasketMode, isTreatyOnlyFormAction,
} from '../src/ui/diplomacyTradeBasket.ts';
`);

const stubViteAssetsPlugin = {
  name: 'stub-vite-assets',
  setup(build) {
    build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB }));
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
  },
};

async function main() {
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
    plugins: [stubViteAssetsPlugin],
  });

  const {
    showTradeBasketModal, hideTradeBasketModal, getTradeBasketMode, isTreatyOnlyFormAction,
  } = require(BUNDLE);

  let pass = 0;
  let fail = 0;
  function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

  console.log('diplomacy-treaty-sweetener-edit-test (P-DYPLO-SWEETENER-KOSZYK-W-TRAKTACIE)');

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.HTMLInputElement = dom.window.HTMLInputElement;
  global.HTMLSelectElement = dom.window.HTMLSelectElement;
  global.Event = dom.window.Event;

  function baseTreatyCtx(over) {
    return Object.assign({
      civName: 'Testonia',
      relacjaTotal: 200,
      progHandelRelacja: 0,
      progDarRelacja: 0,
      wchloniecieGoldRequired: 200,
      borderFeeCivil: 20,
      borderFeeMilitary: 40,
      playerSkarbiec: 1000,
    }, over || {});
  }

  function fireChange(el) {
    el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  }
  function fireClick(el) {
    el.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  }

  // --- Mapowanie UI-id -> lista traktatów "tylko formularz" objętych R-DYP-STOL-A-KOREKTA
  // (SWEETENER_COUNTER_ELIGIBLE w diplomacy-proposals.ts: nap/sojusz_defensywny/sojusz_pelny/
  // granice/wasal/pokoj -> UI id 2/3/4/12/10). Testujemy przedstawiciela ('2' = NAP) + kontrolę
  // na innej akcji z tej samej grupy ('10' = pokój) — nie każdą z siedmiu (pokryte już przez
  // test #21 w diplomacy-proposal-test.cjs dla samej flagi isTreatyOnlyFormAction).
  const REPRESENTATIVE_ACTION_ID = '2'; // NAP

  // ---------------------------------------------------------------------------------------
  // (a) Kontroferta AI ze sweetenerem (40 ¤ w receiveItems — odpowiednik counterInitial
  // w main.ts::buildPendingNegotiationRows, gdzie giveItems AI po SWAP trafiają do
  // counterInitial.receiveItems, patrz withExtraSweetenerGold w diplomacy-proposals.ts)
  // pokazuje UI koszyka z poprawną ilością złota.
  // ---------------------------------------------------------------------------------------
  {
    const action = { id: REPRESENTATIVE_ACTION_ID, label: 'Pakt o nieagresji', enabled: true };
    const mode = getTradeBasketMode(REPRESENTATIVE_ACTION_ID);
    ok(mode === 'treaty', 'NAP: getTradeBasketMode -> treaty');
    ok(isTreatyOnlyFormAction(REPRESENTATIVE_ACTION_ID), 'NAP: isTreatyOnlyFormAction -> true (grupa objęta naprawą)');

    let submitted = null;
    showTradeBasketModal(
      mode, action, baseTreatyCtx(), (p) => { submitted = p; }, () => {},
      { receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 40 }], turns: 15 },
    );
    const box = document.querySelector('.civ-diplo-basket');
    ok(box != null, 'NAP kontroferta+sweetener: modal renderuje box');
    ok(box.className.includes('cdb-treaty-only-mode'), 'NAP kontroferta+sweetener: nadal cdb-treaty-only-mode (bez formularza dodawania)');

    const qtyInp = box.querySelector('.cdb-row-qty-inp[data-idx]') || box.querySelector('.cdb-row-qty .cdb-row-qty-inp');
    ok(qtyInp != null, 'NAP kontroferta+sweetener: pole ilości złota WIDOCZNE w formularzu (koszyk PW)');
    ok(qtyInp != null && qtyInp.value === '40', `NAP kontroferta+sweetener: ilość złota w polu = 40 (got ${qtyInp && qtyInp.value})`);

    const rmBtn = box.querySelector('.cdb-rm[data-side="receive"][data-idx="0"]');
    ok(rmBtn != null, 'NAP kontroferta+sweetener: przycisk Usuń (×) obecny dla pozycji słodzika');

    ok(!box.innerHTML.includes('cdb-add'), 'NAP kontroferta+sweetener: nadal BRAK formularza "dodaj pozycję" (gracz nie dokłada własnych pozycji)');

    hideTradeBasketModal();
  }

  // ---------------------------------------------------------------------------------------
  // (b) Zmiana ilości w UI wpływa na finalny payload wysyłany przy kontrpropozycji.
  // ---------------------------------------------------------------------------------------
  {
    const action = { id: REPRESENTATIVE_ACTION_ID, label: 'Pakt o nieagresji', enabled: true };
    const mode = getTradeBasketMode(REPRESENTATIVE_ACTION_ID);
    let submitted = null;
    showTradeBasketModal(
      mode, action, baseTreatyCtx(), (p) => { submitted = p; }, () => {},
      { receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 40 }], turns: 15 },
    );
    const box = document.querySelector('.civ-diplo-basket');
    const qtyInp = box.querySelector('.cdb-row-qty[data-side="receive"][data-idx="0"] .cdb-row-qty-inp');
    ok(qtyInp != null, 'edycja ilości: pole znalezione');
    qtyInp.value = '25';
    fireChange(qtyInp);

    const submitBtn = document.querySelector('.civ-diplo-basket .cdb-submit');
    ok(submitBtn != null && !submitBtn.hasAttribute('disabled'), 'edycja ilości: przycisk Zaproponuj aktywny po zmianie');
    fireClick(submitBtn);

    ok(submitted != null, 'edycja ilości: onSubmit wywołany (payload trafił dalej)');
    ok(
      Array.isArray(submitted?.receiveItems) && submitted.receiveItems.length === 1
        && submitted.receiveItems[0].typ === 'zloto' && submitted.receiveItems[0].ilosc === 25,
      `edycja ilości: finalny payload.receiveItems ma zmienioną ilość 25 (got ${JSON.stringify(submitted?.receiveItems)})`,
    );
    hideTradeBasketModal();
  }

  // ---------------------------------------------------------------------------------------
  // (b, ciąg dalszy) Usunięcie pozycji (×) — payload końcowy NIE zawiera receiveItems
  // (buildTreatyPayload ustawia payload.receiveItems TYLKO gdy tablica niepusta).
  // ---------------------------------------------------------------------------------------
  {
    const action = { id: REPRESENTATIVE_ACTION_ID, label: 'Pakt o nieagresji', enabled: true };
    const mode = getTradeBasketMode(REPRESENTATIVE_ACTION_ID);
    let submitted = null;
    showTradeBasketModal(
      mode, action, baseTreatyCtx(), (p) => { submitted = p; }, () => {},
      { receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 40 }], turns: 15 },
    );
    let box = document.querySelector('.civ-diplo-basket');
    const rmBtn = box.querySelector('.cdb-rm[data-side="receive"][data-idx="0"]');
    ok(rmBtn != null, 'usunięcie: przycisk Usuń znaleziony');
    fireClick(rmBtn);

    box = document.querySelector('.civ-diplo-basket');
    ok(
      box.querySelector('.cdb-rm[data-side="receive"][data-idx="0"]') == null,
      'usunięcie: po kliknięciu × pozycja znika z DOM (refresh przerysował formularz)',
    );

    const submitBtn = document.querySelector('.civ-diplo-basket .cdb-submit');
    fireClick(submitBtn);
    ok(submitted != null, 'usunięcie: onSubmit wywołany mimo pustego koszyka (traktat sam w sobie ważny)');
    ok(
      submitted?.receiveItems === undefined,
      `usunięcie: finalny payload BEZ receiveItems po usunięciu jedynej pozycji (got ${JSON.stringify(submitted?.receiveItems)})`,
    );
    hideTradeBasketModal();
  }

  // ---------------------------------------------------------------------------------------
  // (c) Traktat inicjowany przez GRACZA (initial=undefined) — BEZ REGRESJI R-DYP-STOL-A-KOREKTA:
  // nadal 0 pól koszyka w markupie ORAZ finalny payload bez giveItems/receiveItems.
  // ---------------------------------------------------------------------------------------
  {
    for (const actionId of [REPRESENTATIVE_ACTION_ID, '10']) {
      const action = { id: actionId, label: 'Test akcji ' + actionId, enabled: true };
      const mode = getTradeBasketMode(actionId);
      let submitted = null;
      showTradeBasketModal(mode, action, baseTreatyCtx(), (p) => { submitted = p; }, () => {});
      const box = document.querySelector('.civ-diplo-basket');
      ok(
        box.querySelector('.cdb-row-qty') == null && box.querySelector('.cdb-rm') == null,
        `akcja ${actionId} (traktat gracza, bez initial): 0 pól koszyka w markupie (bez regresji R-DYP-STOL-A-KOREKTA)`,
      );
      const submitBtn = box.querySelector('.cdb-submit');
      fireClick(submitBtn);
      ok(
        submitted != null && submitted.giveItems === undefined && submitted.receiveItems === undefined,
        `akcja ${actionId} (traktat gracza): finalny payload BEZ giveItems/receiveItems (got give=${JSON.stringify(submitted?.giveItems)} receive=${JSON.stringify(submitted?.receiveItems)})`,
      );
      hideTradeBasketModal();
    }
  }

  try { fs.unlinkSync(entryFile); } catch (_) { /* ok */ }
  try { fs.unlinkSync(LEADER_PORTRAITS_STUB); } catch (_) { /* ok */ }
  try { fs.unlinkSync(BRAND_ASSETS_STUB); } catch (_) { /* ok */ }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
