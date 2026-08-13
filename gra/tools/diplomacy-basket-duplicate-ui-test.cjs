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
function addFood(cityId, qty) {
  click(chip('cdb-chip-typ', 'zywnosc'));
  click(chip('cdb-chip-city', cityId));
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

  // 6) P-DYPLOMACJA-DUPLIKAT-PROPOZYCJI-EDYCJA — ŚCIEŻKA EDYCJI (nie dodawania). Diagnoza
  // Evaluatora: handler „Zapisz zmiany" po edycji istniejącego wiersza podmieniał pozycję na
  // miejscu BEZ sprawdzenia kolizji z INNYM, już istniejącym wierszem koszyka. Dokładna
  // reprodukcja ze zgłoszenia: koszyk [Obróbka drewna, Garncarstwo] → Edytuj wiersz "Garncarstwo"
  // → zmień technologię na "Obróbka drewna" (już w wierszu 0) → Zapisz → PRZED naprawą: dwa
  // identyczne wiersze "Obróbka drewna". Wariant wybrany dla typów BEZ ilości (jak tech) to
  // BLOKADA-JAKO-NO-OP (spójna z blokadą duplikatu w addOrMergeBasketItem — lista zostaje BEZ
  // ZMIAN, nic nie znika, nic się nie duplikuje): PO naprawie koszyk wraca do stanu SPRZED
  // edycji, edytowany wiersz "Garncarstwo" zostaje nietknięty na swoim miejscu.
  {
    const startLen = giveRows().length; // 5 (2 tech + złoto + 2 żywność) sprzed tego bloku
    ok(giveRowText(0) === 'Obróbka drewna' && giveRowText(1) === 'Garncarstwo',
      `stan wyjściowy do testu edycji: wiersz 0="Obróbka drewna", wiersz 1="Garncarstwo" (got ${giveRowText(0)}, ${giveRowText(1)})`);

    click(editButton(1)); // otwórz edycję wiersza "Garncarstwo" (idx=1)
    click(chip('cdb-chip-tech', 'Obróbka drewna')); // zmień technologię na tę z wiersza 0 → kolizja
    click(saveEditButton()); // „Zapisz zmiany"

    const techRows = giveRows().filter(r => {
      const t = r.querySelector('.da-deal-item')?.textContent ?? '';
      return t.includes('Obróbka drewna') || t.includes('Garncarstwo');
    });
    ok(techRows.length === 2 && techRows.some(r => r.querySelector('.da-deal-item')?.textContent === 'Obróbka drewna')
        && techRows.some(r => r.querySelector('.da-deal-item')?.textContent === 'Garncarstwo'),
      `edycja "Garncarstwo"→"Obróbka drewna" (koliduje z wierszem 0, typ BEZ ilości → blokada-no-op): `
      + `nadal DWA RÓŻNE wiersze tech ("Obróbka drewna" + "Garncarstwo"), NIE dwa identyczne duplikaty `
      + `(got ${techRows.length}: ${techRows.map(r => r.querySelector('.da-deal-item')?.textContent).join(', ')})`);
    ok(giveRows().length === startLen,
      `blokada-no-op: liczba wierszy koszyka niezmieniona względem sprzed edycji (${startLen}→${giveRows().length})`);
    ok(giveRowText(0) === 'Obróbka drewna' && giveRowText(1) === 'Garncarstwo',
      `blokada-no-op: wiersz 0="Obróbka drewna", wiersz 1="Garncarstwo" — edytowany wiersz wrócił do stanu sprzed edycji (got ${giveRowText(0)}, ${giveRowText(1)})`);
  }

  // 6b) Wariant SCALANIA dla typów Z ilością — użyj JUŻ ISTNIEJĄCYCH wierszy żywności z kroku 5
  // (Roma=30 pkt, Ostia=15 pkt — patrz asercje kroku 5). Edytuj wiersz Ostii → zmień miasto na
  // Roma (już obecne, inna tożsamość: zywnosc::c1 vs zywnosc::c2) → po naprawie: JEDEN wiersz
  // żywności Roma z zsumowaną ilością 30+15=45, wiersz Ostii znika jako osobna pozycja (merge,
  // analogicznie do addOrMergeBasketItem — patrz test 7 w diplomacy-basket-duplicate-test.cjs).
  {
    const beforeMerge = giveRows().length;
    const ostiaIdx = giveRows().findIndex(r => r.querySelector('.cdb-row-qty-inp')?.value === '15');
    ok(ostiaIdx >= 0, `wiersz żywności Ostia (15, z kroku 5) obecny przed testem scalania (idx=${ostiaIdx})`);

    click(editButton(ostiaIdx));
    click(chip('cdb-chip-city', 'c1')); // zmień miasto Ostia → Roma, gdzie już jest 30
    click(saveEditButton());

    ok(giveRows().length === beforeMerge - 1,
      `scalanie (typ z ilością): edytowany wiersz zniknął jako osobna pozycja (${beforeMerge}→${beforeMerge - 1}, got ${giveRows().length})`);
    ok(rowQtyValues().includes('45'),
      `scalanie: żywność Roma pokazuje zsumowane 30+15=45 (widoczne ilości: ${rowQtyValues().join(',')})`);
  }

  // 7) Edycja BEZ kolizji musi dalej działać jak dotychczas — bez regresji z naprawy kolizji
  // (6/6b). Edytuj wiersz złota zmieniając TYLKO ilość: tożsamość (zloto::zloto) się nie
  // zmienia i jest jedynym wierszem złota w koszyku, więc `applyBasketItemEdit` nie znajduje
  // kolizji z ŻADNYM innym wierszem i idzie zwykłą ścieżką podmiany na miejscu.
  {
    const beforeLen = giveRows().length;
    const goldIdx = giveRows().findIndex(r => /¤/.test(r.querySelector('.da-deal-item')?.textContent ?? ''));
    ok(goldIdx >= 0, `wiersz złota nadal obecny do testu edycji bez kolizji (idx=${goldIdx})`);
    click(editButton(goldIdx));
    const goldQtyInp = qa('.cdb-qty').find(i => i.getAttribute('data-side') === 'give');
    if (goldQtyInp) goldQtyInp.value = '77';
    click(saveEditButton());
    ok(giveRows().length === beforeLen,
      `edycja bez kolizji (zmiana ilości złota): liczba wierszy niezmieniona (${beforeLen}→${giveRows().length})`);
    ok(rowQtyValues().includes('77'),
      `edycja bez kolizji: nowa ilość złota 77 widoczna w koszyku (widoczne ilości: ${rowQtyValues().join(',')})`);
  }

  // 8) R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): koszyk „+ Dodaj propozycję" dla surowiec_ilosc
  // — krok 5 wymuszony w PRAWDZIWYM DOM (nie tylko na czystej funkcji), z realnymi kliknięciami
  // chipów jak scenariusze 1-7 wyżej.
  {
    // 8a) Wybór surowca dotkniętego ×5 (drewno) — pole ilości domyślnie startuje na 5 (kroku),
    // nie na 1, i ma atrybuty min/step=5 (natywny spinner nie schodzi poniżej bloku).
    selectResourceChip('drewno');
    const inp = resQtyInput();
    ok(inp.value === '5', `surowiec_ilosc (drewno): domyślna ilość = krok (5), nie 1 (got ${inp.value})`);
    ok(inp.min === '5' && inp.step === '5',
      `surowiec_ilosc (drewno): input min=5 step=5 (got min=${inp.min}, step=${inp.step})`);

    // 8b) Wpisanie ilości NIEBĘDĄCEJ wielokrotnością kroku (23) i kliknięcie "Dodaj" —
    // silnik floruje w dół do 20 (nie odrzuca cicho 23, nie zaokrągla w górę do 25).
    const beforeLen = giveRows().length;
    addResource('drewno', 23);
    ok(giveRows().length === beforeLen + 1, `surowiec_ilosc: "Dodaj" z ilością 23 tworzy 1 nowy wiersz (got ${giveRows().length - beforeLen})`);
    ok(giveRowQty(beforeLen) === '20',
      `surowiec_ilosc: 23 szt. drewna floruje do 20 szt. w koszyku (got ${giveRowQty(beforeLen)})`);

    // 8c) Dodanie tego samego surowca ponownie SUMUJE (merge, jak złoto/żywność wyżej) i floruje
    // sumę: 20 + 23(→floor 20) = 40, wielokrotność 5 — bez zmiany liczby wierszy.
    addResource('drewno', 23);
    ok(giveRows().length === beforeLen + 1, `surowiec_ilosc: drugie dodanie tego samego surowca SCALA, nie tworzy wiersza (got ${giveRows().length - beforeLen})`);
    ok(giveRowQty(beforeLen) === '40',
      `surowiec_ilosc: scalenie 20+20=40 (got ${giveRowQty(beforeLen)})`);

    // 8d) Węgiel (krok=1, wyłączony z ×5) — chip switch NIE resetuje wartości do minimum
    // (spójne z dotychczasowym zachowaniem chipów ilości — patrz `max` clamp bez resetu
    // wyżej), tylko przestawia min/step na 1 (bez wymogu wielokrotności 5).
    selectResourceChip('wegiel');
    const inpW = resQtyInput();
    ok(inpW.min === '1', `surowiec_ilosc (wegiel): input min=1, bez wymogu wielokrotności 5 (got ${inpW.min})`);
    addResource('wegiel', 7);
    ok(giveRowQty(beforeLen + 1) === '7',
      `surowiec_ilosc (wegiel): 7 szt. NIE floruje (krok 1) — wiersz pokazuje dokładnie 7 (got ${giveRowQty(beforeLen + 1)})`);
  }

  for (const f of [ENTRY, BUNDLE, LEADER_STUB, BRAND_STUB]) {
    try { fs.unlinkSync(f); } catch (e) { /* ok */ }
  }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
