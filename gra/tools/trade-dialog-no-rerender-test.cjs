'use strict';
/**
 * trade-dialog-no-rerender-test.cjs — R-WEB-UI-TRADE-DIALOG-NO-RERENDER-BOTH-SIDES-Q1.
 *
 * Okno „Umowa wymiany surowców” (handel dwustronny): dodanie pozycji po jednej stronie
 * NIE może przebudowywać całego okna. Test klika PRAWDZIWE przyciski wyrenderowanego
 * `showTradeBasketModal` (jsdom) i sprawdza:
 *  (a) węzeł panelu drugiej strony (kontrpropozycja) i kontener przewijania zostają TYMI
 *      SAMYMI elementami DOM, a wybrane kafle/wartości tego panelu są zachowane;
 *  (b) obie strony można uzupełnić w dowolnej kolejności i wysłać jedną propozycją;
 *  (c) gdy jedna strona jest pusta, zamiast ostrzeżenia o odrzuceniu pokazuje podpowiedź.
 *
 * Usage (z gra/): node tools/trade-dialog-no-rerender-test.cjs
 */
'use strict';
/**
 * trade-dialog-no-rerender-test.cjs — P-DYPLOMACJA-DUPLIKAT-PROPOZYCJI-W-OFERCIE,
 * warstwa INTEGRACYJNA (dopisane przez Evaluatora przy recenzji commita fc17538f).
 *
 * PO CO OSOBNY PLIK OBOK `diplomacy-basket-duplicate-test.cjs`:
 * tamten test sprawdza WYŁĄCZNIE wyeksportowaną funkcję `addOrMergeBasketItem`. To za mało,
 * żeby przypiąć zgłoszony bug — zweryfikowane mutacją: przywrócenie w handlerze
 * `.cdb-add-btn` starego `giveItems = [...giveItems, item]` (helper NIETKNIĘTY) sprawia, że
 * 4× "Dodaj propozycję" znów daje 4 wiersze w UI, a tamten test dalej świeci 17/17 na
 * zielono. Regresja w SAMYM PODŁĄCZENIU naprawy jest więc dla niego niewidoczna.
 *
 * Ten test klika PRAWDZIWE przyciski wyrenderowanego `showTradeBasketModal` (jsdom) i liczy
 * wiersze koszyka w DOM — dokładnie to, co widzi gracz na zrzucie ze zgłoszenia (4×
 * "Obróbka drewna" jako osobne wiersze).
 *
 * UWAGA dla przyszłych zmian: `refresh()` przebudowuje całą zawartość modala, więc formularz
 * "Co dodajesz" RESETUJE się do typu domyślnego po każdym dodaniu. Wierny scenariusz
 * użytkownika musi wybrać typ i pozycję PRZED każdym kliknięciem "Dodaj" (patrz addTech()).
 *
 * Usage (z gra/): node tools/trade-dialog-no-rerender-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[trade-dialog-no-rerender-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// Własne nazwy stubów (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY) — nie współdziel z innym testem.
const LEADER_STUB = path.resolve(STUB_DIR, 'trade-norerender-leader-stub.ts');
const BRAND_STUB = path.resolve(STUB_DIR, 'trade-norerender-brand-stub.ts');
const ENTRY = path.resolve(__dirname, '.trade-dialog-no-rerender-entry.ts');
const BUNDLE = path.resolve(__dirname, '.trade-dialog-no-rerender-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(LEADER_STUB, [
  'export function leaderPortraitUrl() { return null; }',
  'export function leaderName() { return null; }',
  'export function leaderNameFromPool() { return null; }',
  'export function civDisplayNameFromKey() { return null; }',
  'export function civCardDisplayName(l) { return l; }',
  'export function civIconIdFromCivLabel() { return null; }',
].join('\n'), 'utf8');
fs.writeFileSync(BRAND_STUB, [
  'brandIconSvg', 'improvementIconSvg', 'mapResourceIconSvg', 'terrainIconSvg',
  'buildingIconSvg', 'unitIconSvg', 'civIconSvg', 'epochIconSvg', 'settingIconSvg',
  'brandMenuComponentsCss', 'menuIconSvg', 'brandMenuEmblemSvg', 'newGameIntroEmblemSvg',
  'brandMotionCss', 'brandMenuBackgroundCss', 'svgThumbHtml',
].map(f => `export function ${f}() { return ''; }`).join('\n'), 'utf8');
fs.writeFileSync(ENTRY, `export { showTradeBasketModal } from '../src/ui/diplomacyTradeBasket.ts';\n`, 'utf8');

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
try { Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true }); }
catch (e) { /* Node >=21 ma getter-only navigator — ignorujemy, moduł go nie potrzebuje */ }
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

// Kontekst koszyka: 2 technologie do oddania, 2 miasta, skarbiec 500 ¤.
const CTX = {
  civName: 'Rzym',
  relacjaTotal: 180,
  playerSkarbiec: 500,
  progHandelRelacja: 0,
  progDarRelacja: 0,
  giveTechOptions: [
    { id: 'Obróbka drewna', label: 'Obróbka drewna', suggestedPrice: 50 },
    { id: 'Garncarstwo', label: 'Garncarstwo', suggestedPrice: 40 },
  ],
  receiveTechOptions: [],
  cityOptions: [{ id: 'c1', label: 'Roma', spichlerz: 200 }, { id: 'c2', label: 'Ostia', spichlerz: 150 }],
  giveQuantityResourceOptions: [
    { id: 'drewno', label: 'Drewno', maxQty: 300 },
    { id: 'wegiel', label: 'Węgiel', maxQty: 300 },
  ],
};
const ACTION = { id: '14', label: 'Umowa wymiany surowców' };

function boxEl() { return document.querySelector('.civ-diplo-basket-overlay > div'); }
function qa(sel) { return Array.from(boxEl().querySelectorAll(sel)); }
function click(el) { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }
function giveRows() { return qa('.cdb-deal-row').filter(r => r.getAttribute('data-side') === 'give'); }
function rowQtyValues() { return qa('.cdb-row-qty-inp').map(i => i.value); }
/** Ilość odczytana z KONKRETNEGO wiersza (nie z całej listy) — żeby asercja nie mogła
 *  przejść przypadkiem, trafiając na tę samą liczbę w innym wierszu. */
function giveRowQty(idx) {
  const row = giveRows()[idx];
  const inp = row && row.querySelector('.cdb-row-qty-inp');
  return inp ? inp.value : null;
}
function chip(cls, value) {
  const c = qa('.' + cls).find(x => x.getAttribute('data-side') === 'give' && x.getAttribute('data-value') === value);
  if (!c) throw new Error(`brak chipa ${cls}="${value}"`);
  return c;
}
function addButton() {
  const b = qa('.cdb-add-btn').find(x => x.getAttribute('data-side') === 'give' && x.getAttribute('data-edit-idx') == null);
  if (!b) throw new Error('brak przycisku "+ Dodaj propozycję"');
  return b;
}
function addTech(id) { click(chip('cdb-chip-typ', 'tech')); click(chip('cdb-chip-tech', id)); click(addButton()); }
function addGold(qty) {
  click(chip('cdb-chip-typ', 'zloto'));
  qa('.cdb-qty').find(i => i.getAttribute('data-side') === 'give').value = String(qty);
  click(addButton());
}
// P-DYPLO-HANDEL-ZYWNOSC-WYBOR-MIASTA-ZBEDNY (Maciej 2026-08-14): bez wyboru miasta — selektor
// "Miasto (spichlerz)"/chip .cdb-city-chips usunięty z formularza, patrz diplomacyTradeBasket.ts.
function addFood(qty) {
  click(chip('cdb-chip-typ', 'zywnosc'));
  qa('.cdb-food-qty').find(i => i.getAttribute('data-side') === 'give').value = String(qty);
  click(addButton());
}
function resQtyInput() { return qa('.cdb-res-qty-num').find(i => i.getAttribute('data-side') === 'give'); }
/** Bez wpisywania ilości — sprawdza WARTOŚĆ DOMYŚLNĄ ustawioną przez renderer po wyborze surowca. */
function selectResourceChip(resId) {
  click(chip('cdb-chip-typ', 'surowiec_ilosc'));
  click(chip('cdb-chip-resqty', resId));
}
function addResource(resId, qty) {
  selectResourceChip(resId);
  resQtyInput().value = String(qty);
  click(addButton());
}
/** Klika „✎ Edytuj" na wierszu `idx` po stronie „daję" — otwiera formularz edycji (editingItem). */
function editButton(idx) {
  const b = qa('.cdb-edit-item').find(x => x.getAttribute('data-side') === 'give' && x.getAttribute('data-idx') === String(idx));
  if (!b) throw new Error('brak przycisku "✎ Edytuj" dla idx=' + idx);
  return b;
}
/** Przycisk „Zapisz zmiany" widoczny WYŁĄCZNIE gdy formularz jest w trybie edycji (ma data-edit-idx). */
function saveEditButton() {
  const b = qa('.cdb-add-btn').find(x => x.getAttribute('data-side') === 'give' && x.getAttribute('data-edit-idx') != null);
  if (!b) throw new Error('brak przycisku "Zapisz zmiany" (formularz nie jest w trybie edycji?)');
  return b;
}
function giveRowText(idx) {
  const row = giveRows()[idx];
  return row ? (row.querySelector('.da-deal-item')?.textContent ?? null) : null;
}

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text', '.mp3': 'empty', '.png': 'empty' },
    plugins: [{
      name: 'stub-vite-assets',
      setup(build) {
        build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_STUB }));
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      },
    }],
  });

  const { showTradeBasketModal } = require(BUNDLE);
  console.log('trade-dialog-no-rerender-test');

  // Pomocnicze wyszukiwanie po stronie „recv" (kontrpropozycja).
  const rchip = (cls, value) => {
    const c = qa('.' + cls).find(x => x.getAttribute('data-side') === 'recv' && x.getAttribute('data-value') === value);
    if (!c) throw new Error(`brak chipa recv ${cls}="${value}"`);
    return c;
  };
  const recvAddButton = () => {
    const b = qa('.cdb-add-btn').find(x => x.getAttribute('data-side') === 'recv' && x.getAttribute('data-edit-idx') == null);
    if (!b) throw new Error('brak przycisku "Dodaj" po stronie kontrpropozycji');
    return b;
  };
  const recvAddForm = () => qa('.cdb-add').find(x => x.getAttribute('data-side') === 'recv');
  const recvCol = () => recvAddForm().closest('.cdb-col');
  const recvDealRows = () => qa('.cdb-deal-row').filter(r => r.getAttribute('data-side') === 'receive');
  const submit = () => qa('.cdb-submit')[0];
  const cancel = () => click(qa('.cdb-cancel')[0]);

  const CTX2 = { ...CTX, receiveTechOptions: [{ id: 'Garncarstwo', label: 'Garncarstwo', suggestedPrice: 40 }] };

  // ---- (a) panel B zachowany, kafle/wartości B nietknięte po dodaniu pozycji po stronie A ----
  showTradeBasketModal('trade', ACTION, CTX2, () => {}, () => {});
  const scrollBefore = boxEl().querySelector('.cdb-body-scroll');
  click(rchip('cdb-chip-typ', 'tech'));
  click(rchip('cdb-chip-tech', 'Garncarstwo'));
  const recvColBefore = recvCol();
  ok(recvColBefore && recvAddForm() && recvAddForm().querySelector('.cdb-tech[data-side="recv"]')?.value === 'Garncarstwo',
    'panel kontrpropozycji: wybrany kafel „Garncarstwo" ustawiony przed dodaniem po stronie A');

  addTech('Obróbka drewna'); // dodanie po stronie A (oferujemy)
  ok(giveRows().length === 1, `dodanie po stronie A → 1 wiersz „oferujemy" (got ${giveRows().length})`);
  ok(boxEl().querySelector('.cdb-body-scroll') === scrollBefore,
    'kontener przewijania (.cdb-body-scroll) to TEN SAM węzeł po dodaniu pozycji');
  ok(recvCol() === recvColBefore,
    'panel kontrpropozycji (.cdb-col strony B) to TEN SAM węzeł DOM po dodaniu pozycji po stronie A');
  ok(recvAddForm().querySelector('.cdb-tech[data-side="recv"]')?.value === 'Garncarstwo',
    'wybrany kafel/technologia panelu B zachowana po odświeżeniu');
  ok(rchip('cdb-chip-tech', 'Garncarstwo').classList.contains('selected'),
    'zaznaczenie kafla „Garncarstwo" po stronie B przeżywa odświeżenie');

  // ---- (c) strona B pusta → neutralna podpowiedź, nie ostrzeżenie o odrzuceniu ----
  const summaryText = boxEl().textContent;
  ok(boxEl().querySelector('.cdb-neutral-hint') !== null,
    'gdy strona B pusta → widoczna neutralna podpowiedź (.cdb-neutral-hint)');
  ok(/Dodaj, co chcesz dostać w zamian/.test(summaryText),
    'podpowiedź zawiera „Dodaj, co chcesz dostać w zamian"');
  ok(!/ryzyko odrzucenia/.test(summaryText),
    'przy pustej stronie B nie ma ostrzeżenia „ryzyko odrzucenia"');
  cancel();

  // ---- (b) obie strony w dowolnej kolejności → jedna propozycja dwustronna ----
  let payloads = [];
  showTradeBasketModal('trade', ACTION, CTX2, (p) => payloads.push(p), () => {});
  // najpierw strona B (kontrpropozycja), przy PUSTEJ stronie A
  click(rchip('cdb-chip-typ', 'tech'));
  click(rchip('cdb-chip-tech', 'Garncarstwo'));
  click(recvAddButton());
  ok(recvDealRows().length === 1,
    `dodanie po stronie B przy pustej stronie A → 1 wiersz „oferują" (got ${recvDealRows().length})`);
  ok(giveRows().length === 0, 'strona A nadal pusta po dodaniu do B');
  // potem strona A (oferujemy) — bez zatwierdzania strony B
  addTech('Obróbka drewna');
  ok(giveRows().length === 1 && recvDealRows().length === 1,
    `obie strony uzupełnione bez zatwierdzania jednej (give=${giveRows().length}, recv=${recvDealRows().length})`);
  ok(!submit().disabled, 'przycisk „Zaproponuj" aktywny przy dwóch stronach');
  click(submit());
  ok(payloads.length === 1, `jedno kliknięcie „Zaproponuj" → jedna propozycja (got ${payloads.length})`);
  const json = JSON.stringify(payloads[0] ?? {});
  ok(json.includes('Garncarstwo') && json.includes('Obróbka drewna'),
    'propozycja zawiera OBIE strony (Garncarstwo po stronie B i Obróbka drewna po stronie A)');
  if (!payloads[0]) cancel();

  for (const f of [ENTRY, BUNDLE, LEADER_STUB, BRAND_STUB]) {
    try { fs.unlinkSync(f); } catch (e) { /* ok */ }
  }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
