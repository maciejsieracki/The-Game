'use strict';
/**
 * diplomacy-basket-duplicate-ui-test.cjs — P-DYPLOMACJA-DUPLIKAT-PROPOZYCJI-W-OFERCIE,
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
 * Usage (z gra/): node tools/diplomacy-basket-duplicate-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[diplomacy-basket-duplicate-ui-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// Własne nazwy stubów (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY) — nie współdziel z innym testem.
const LEADER_STUB = path.resolve(STUB_DIR, 'basket-dup-ui-leader-stub.ts');
const BRAND_STUB = path.resolve(STUB_DIR, 'basket-dup-ui-brand-stub.ts');
const ENTRY = path.resolve(__dirname, '.diplomacy-basket-duplicate-ui-entry.ts');
const BUNDLE = path.resolve(__dirname, '.diplomacy-basket-duplicate-ui-bundle.cjs');

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
  giveQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 300 }],
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
function addFood(cityId, qty) {
  click(chip('cdb-chip-typ', 'zywnosc'));
  click(chip('cdb-chip-city', cityId));
  qa('.cdb-food-qty').find(i => i.getAttribute('data-side') === 'give').value = String(qty);
  click(addButton());
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
  console.log('diplomacy-basket-duplicate-ui-test');

  showTradeBasketModal('trade', ACTION, CTX, () => {}, () => {});

  // 1) DOKŁADNY przypadek ze zgłoszenia: 4× "Obróbka drewna" przez prawdziwy przycisk.
  for (let i = 0; i < 4; i++) addTech('Obróbka drewna');
  ok(giveRows().length === 1,
    `4x "+ Dodaj propozycję" dla tej samej technologii → 1 wiersz w koszyku (got ${giveRows().length})`);

  // 2) Naprawa nie może sklejać RÓŻNYCH technologii.
  addTech('Garncarstwo');
  ok(giveRows().length === 2, `inna technologia → osobny wiersz (got ${giveRows().length})`);

  // 3) Złoto: drugie dodanie SUMUJE w istniejącym wierszu, nie tworzy drugiego.
  addGold(50);
  addGold(30);
  ok(giveRows().length === 3, `złoto 2x → nadal 3 wiersze, bez duplikatu (got ${giveRows().length})`);
  ok(rowQtyValues().includes('80'),
    `złoto: wiersz pokazuje zsumowane 50+30=80 ¤ (widoczne ilości: ${rowQtyValues().join(',') || 'brak'})`);

  // 4) Suma przycięta tym samym limitem co ręczna edycja ilości (skarbiec gracza = 500 ¤).
  addGold(900);
  ok(rowQtyValues().includes('500'),
    `złoto: suma 80+900 przycięta do skarbca 500 ¤ (widoczne ilości: ${rowQtyValues().join(',')})`);
  ok(giveRows().length === 3, `po przycięciu nadal 3 wiersze (got ${giveRows().length})`);

  // 5) Żywność: tożsamość zawiera miasto — dwa różne miasta to dwie osobne oferty.
  addFood('c1', 20);
  addFood('c2', 15);
  ok(giveRows().length === 5, `żywność z 2 różnych miast → 2 osobne wiersze (got ${giveRows().length} łącznie)`);
  addFood('c1', 10);
  ok(giveRows().length === 5, `żywność z TEGO SAMEGO miasta → bez nowego wiersza (got ${giveRows().length})`);
  // Wiersze: 0,1 = tech (bez ilości), 2 = złoto, 3 = żywność Roma, 4 = żywność Ostia.
  ok(giveRowQty(3) === '30',
    `żywność Roma (wiersz 3): 20+10=30 pkt żywności w jednym wierszu (got ${giveRowQty(3)})`);
  ok(giveRowQty(4) === '15',
    `żywność Ostia (wiersz 4): nietknięte 15 pkt żywności, nie zlane z Romą (got ${giveRowQty(4)})`);

  for (const f of [ENTRY, BUNDLE, LEADER_STUB, BRAND_STUB]) {
    try { fs.unlinkSync(f); } catch (e) { /* ok */ }
  }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
