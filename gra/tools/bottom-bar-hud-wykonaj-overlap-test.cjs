'use strict';
/**
 * bottom-bar-hud-wykonaj-overlap-test.cjs — R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1
 *
 * Zgłoszenie właściciela (2026-08-21, dwa zrzuty ekranu): pasek „N karta wymaga decyzji"
 * (`.et-hint`) i przycisk „Wykonaj" (`.wykonaj`) w bottomBarHud.ts nachodzą się wizualnie.
 * Po wykonaniu blokującej decyzji pasek znika, ale w jego miejscu widać PUSTY, wyszarzony
 * prostokąt „WYKONAJ" — bo `.et-hint` był pozycjonowany `position:absolute;
 * bottom:calc(100% + gap)` WZGLĘDEM `.et-wrap` (kontener owijający TYLKO przycisk
 * „Zakończ turę"), a nie względem całego stosu `.civ-bottom-bar`. Skoro wysokość paska
 * ostrzeżenia (padding 9x10 + tekst) jest dużo większa niż sam gap (10px), pasek nachodził
 * na przycisk „Wykonaj" (renderowany zawsze, tuż nad `.et-wrap`, disabled gdy blocking=0)
 * i go zasłaniał — po zniknięciu paska odsłaniał się disabled „Wykonaj" pod spodem.
 *
 * NAPRAWA (wyłącznie warstwa wizualna/layout, BEZ zmiany logiki wykrywania blokady —
 * `getBlockingCount`/`wykOn`/`showBlockSignal`/klikalność „Zakończ turę" nietknięte):
 * `.et-hint` i `.et-tooltip` są teraz bezpośrednimi dziećmi `.civ-bottom-bar` (position:fixed,
 * więc już jest kontekstem pozycjonowania) — `bottom:calc(100% + gap)` liczy się od górnej
 * krawędzi CAŁEGO paska (ponad „Wykonaj" + „Zakończ turę" + etykietę tury), nie tylko ponad
 * `.et-wrap`, więc nigdy nie nachodzi na żaden przycisk w stosie, niezależnie od własnej
 * wysokości. `.et-wrap` teraz owija WYŁĄCZNIE przycisk „Zakończ turę".
 *
 * Bundluje NAPRAWDĘ src/ui/bottomBarHud.ts (esbuild + jsdom, wzorzec side-panel-unit-cycle-
 * arrows-test.cjs) — stub tylko dla icons/brandAssets i brandTokenVars (Vite `?raw` /
 * import.meta.glob, esbuild/node tego nie obsłuży); reszta drzewa importów (hudLayout) to
 * zwykłe moduły TS.
 *
 * Test pokrywa oba stany (blocking>0 i blocking=0) ORAZ przejście między nimi (drugie
 * wywołanie `update()` na TYM SAMYM elemencie, symulujące wykonanie blokującej decyzji —
 * jsdom nie liczy realnej geometrii CSS, więc dowód jest STRUKTURALNY na DOM: przynależność
 * rodzic/dziecko decyduje o kontekście pozycjonowania `position:absolute`, patrz mechanizm
 * wyżej) plus pin tekstowy na CSS i na markup w bottomBarHud.ts.
 *
 * Usage (z gra/): node tools/bottom-bar-hud-wykonaj-overlap-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[bottom-bar-hud-wykonaj-overlap-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const SRC_FILE = path.join(GRA, 'src/ui/bottomBarHud.ts');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const STUB_BRAND_ASSETS = path.resolve(STUB_DIR, 'bottom-bar-hud-overlap-brandAssets-stub.ts');
const STUB_BRAND_TOKENS = path.resolve(STUB_DIR, 'bottom-bar-hud-overlap-brandTokenVars-stub.ts');
const ENTRY_FILE = path.resolve(__dirname, '.bottom-bar-hud-overlap-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.bottom-bar-hud-overlap-bundle.cjs');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  PASS: ' + label); }
  else { fail++; console.error('  FAIL: ' + label); }
}

console.log('========================================================================');
console.log('R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1 -- .et-hint/.wykonaj nie moga sie nakladac');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// A) PIN TEKSTOWY na src/ui/bottomBarHud.ts -- dowodzi, ze naprawa STOI w kodzie.
// ---------------------------------------------------------------------------
{
  const src = fs.readFileSync(SRC_FILE, 'utf8');

  // A1) hintHtml/tooltipHtml sa konkatenowane PRZED przyciskiem .wykonaj (bezposrednie
  //     dzieci el, a nie el.wewnatrz .et-wrap).
  const innerHtmlIdx = src.indexOf('el.innerHTML = hintHtml');
  ok(innerHtmlIdx >= 0,
    '[A1] el.innerHTML zaczyna sie od hintHtml (bezposrednie dziecko .civ-bottom-bar, PRZED .wykonaj)');

  const wykonajIdx = src.indexOf("'<button type=\"button\" class=\"wykonaj'", innerHtmlIdx >= 0 ? innerHtmlIdx : 0);
  ok(innerHtmlIdx >= 0 && wykonajIdx > innerHtmlIdx,
    '[A2] przycisk .wykonaj jest konkatenowany PO hintHtml/tooltipHtml (kolejnosc w markupie)');

  // A3) .et-wrap w markupie zawiera TYLKO przycisk .end-turn -- hintHtml/tooltipHtml
  //     NIE sa juz wewnatrz niego (byla to przyczyna nachodzenia -- .et-wrap owijal
  //     tylko koniec tury, wiec bottom:calc(100%+gap) liczyl sie za blisko .wykonaj).
  const etWrapIdx = src.indexOf("'<div class=\"et-wrap\">'");
  ok(etWrapIdx >= 0, '[A3-setup] znaleziono otwarcie <div class="et-wrap">');
  const etWrapCloseIdx = src.indexOf("'</div>'", etWrapIdx);
  const etWrapBlock = (etWrapIdx >= 0 && etWrapCloseIdx > etWrapIdx) ? src.slice(etWrapIdx, etWrapCloseIdx) : '';
  ok(!/hintHtml/.test(etWrapBlock) && !/tooltipHtml/.test(etWrapBlock),
    '[A3] blok .et-wrap w markupie NIE zawiera juz hintHtml/tooltipHtml -- owija wylacznie przycisk end-turn');
  ok(/class="end-turn/.test(etWrapBlock),
    '[A3-kontrola] blok .et-wrap nadal zawiera przycisk end-turn (nie zniknal przez pomylke)');

  // A4) CSS .et-hint/.et-tooltip nadal uzywaja bottom:calc(100% + gap) -- formula
  //     niezmieniona, tylko KONTEKST pozycjonowania (rodzic w DOM) sie zmienil.
  ok(/\.civ-bottom-bar \.et-hint\{position:absolute;left:0;right:0;bottom:calc\(100% \+ \$\{HUD_GAP_PX\}px\);/.test(src),
    '[A4] .et-hint zachowuje bottom:calc(100% + HUD_GAP_PX) -- ta sama formula, teraz liczona wzgledem calego .civ-bottom-bar (bo jest jego bezposrednim dzieckiem)');
  ok(/\.civ-bottom-bar \.et-tooltip\{position:absolute;left:0;right:0;bottom:calc\(100% \+ \$\{HUD_GAP_PX\}px\);/.test(src),
    '[A4b] .et-tooltip -- ta sama formula co .et-hint');

  // A5) logika wykrywania blokady NIETKNIETA -- ograniczenie z dyspozycji (getBlockingCount/
  //     wykOn/showBlockSignal/klikalnosc "Zakoncz ture" musza zostac identyczne).
  ok(/const wykOn = blocking > 0;/.test(src), '[A5] wykOn = blocking > 0 -- niezmienione');
  ok(/const showBlockSignal = !hideEnd && !endVisuallyDisabled && wykOn;/.test(src),
    '[A5b] showBlockSignal -- formula niezmieniona');
  ok(/if \(config\.hideEndTurn\?\.\(\)\) return;\s*\n\s*config\.onEndTurn\?\.\(\);/.test(src),
    '[A5c] klik "Zakoncz ture" nadal NIE sprawdza blocking/showBlockSignal -- tylko hideEndTurn (TWARDY ZAKAZ tej rundy, R-TRZY-KARTY-WDROZENIE-Q1)');
}

// ---------------------------------------------------------------------------
// B) + C) REALNA regresja -- bundluje NAPRAWDE bottomBarHud.ts (esbuild + jsdom) i sprawdza
//    strukture DOM w obu stanach oraz na przejsciu miedzy nimi.
// ---------------------------------------------------------------------------
async function runUiPart() {
  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(STUB_BRAND_ASSETS, [
    "export function brandIconSvg(_key, _size) { return ''; }",
    '',
  ].join('\n'), 'utf8');
  fs.writeFileSync(STUB_BRAND_TOKENS, [
    'export function ensureBrandRootTokens() {}',
    "export const CIV_BRAND_SCOPE_VARS = '';",
    '',
  ].join('\n'), 'utf8');

  fs.writeFileSync(
    ENTRY_FILE,
    "export { createBottomBarHud } from '../src/ui/bottomBarHud.ts';\n",
    'utf8',
  );

  const stubPlugin = {
    name: 'stub-bottom-bar-hud-overlap',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_BRAND_ASSETS }));
      build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: STUB_BRAND_TOKENS }));
    },
  };

  try {
    await esbuild.build({
      entryPoints: [ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE_FILE,
      absWorkingDir: GRA,
      plugins: [stubPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[bottom-bar-hud-wykonaj-overlap-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const { createBottomBarHud } = require(BUNDLE_FILE);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLButtonElement = dom.window.HTMLButtonElement;

  let blockingCount = 1;
  const blockingTitles = ['Miasto bez budynku'];

  const api = createBottomBarHud({
    getTurn: () => 3,
    getYearLabel: () => '3900 P.N.E',
    onExecutePending: () => {},
    onEndTurn: () => {},
    canEndTurn: () => true,
    getBlockingCount: () => blockingCount,
    getBlockingTitles: () => blockingTitles,
  });

  const el = api.el;

  // ---------------------------------------------------------------------
  // STAN 1: blocking = 1 (karta wymaga decyzji) -- .et-hint obecny.
  // ---------------------------------------------------------------------
  {
    const hint = el.querySelector('[data-et-hint]');
    ok(hint !== null, '[B1] blocking=1: .et-hint (data-et-hint) jest w DOM');
    ok(hint && hint.parentElement === el,
      '[B2] blocking=1: .et-hint jest BEZPOSREDNIM dzieckiem .civ-bottom-bar (nie zagniezdzony w .et-wrap) -- to jest fix: kontekst pozycjonowania to caly stos, nie tylko .et-wrap');

    const tooltip = el.querySelector('[data-et-tooltip]');
    ok(tooltip !== null, '[B3] blocking=1: .et-tooltip jest w DOM');
    ok(tooltip && tooltip.parentElement === el,
      '[B4] blocking=1: .et-tooltip rowniez bezposrednim dzieckiem .civ-bottom-bar');

    const etWrap = el.querySelector('.et-wrap');
    ok(etWrap !== null, '[B5-setup] .et-wrap istnieje');
    ok(etWrap && etWrap.querySelector('[data-et-hint]') === null,
      '[B5] .et-wrap NIE zawiera .et-hint jako potomka -- rozdzielone od przycisku "Zakoncz ture"');
    ok(etWrap && etWrap.querySelector('[data-et-tooltip]') === null,
      '[B6] .et-wrap NIE zawiera .et-tooltip jako potomka');
    ok(etWrap && etWrap.children.length === 1 && etWrap.children[0].matches('[data-end]'),
      '[B7] .et-wrap ma DOKLADNIE jedno dziecko -- przycisk "Zakoncz ture" (data-end)');

    const wykonaj = el.querySelector('[data-wykonaj]');
    ok(wykonaj !== null && wykonaj.classList.contains('on') && !wykonaj.disabled,
      '[B8] blocking=1: przycisk "Wykonaj" aktywny (.on, nie disabled) z odznaka liczby');
    ok(wykonaj && wykonaj.querySelector('.wyk-badge') && wykonaj.querySelector('.wyk-badge').textContent === '1',
      '[B9] blocking=1: odznaka "Wykonaj" pokazuje 1');

    const endBtn = el.querySelector('[data-end]');
    ok(endBtn && endBtn.classList.contains('et-signal'),
      '[B10] blocking=1: "Zakoncz ture" ma klase et-signal (sygnalizacja wizualna, klikalnosc bez zmian)');
  }

  // ---------------------------------------------------------------------
  // PRZEJSCIE: gracz wykonuje blokujaca decyzje -> blocking 1 -> 0, ten sam element,
  // drugie wywolanie update() (dokladnie jak main.ts po wykonaniu karty).
  // ---------------------------------------------------------------------
  blockingCount = 0;
  api.update();

  // ---------------------------------------------------------------------
  // STAN 2: blocking = 0 -- .et-hint zniknal, "Wykonaj" disabled, ZADNEGO nachodzenia.
  // ---------------------------------------------------------------------
  {
    ok(el.querySelector('[data-et-hint]') === null,
      '[C1] blocking=0 (po przejsciu): .et-hint usuniety z DOM');
    ok(el.querySelector('[data-et-tooltip]') === null,
      '[C2] blocking=0 (po przejsciu): .et-tooltip usuniety z DOM');

    const wykonaj = el.querySelector('[data-wykonaj]');
    ok(wykonaj !== null, '[C3] blocking=0: przycisk "Wykonaj" nadal istnieje w DOM (miejsce zarezerwowane w layoucie -- zamierzone, patrz 00-dispatch.md)');
    ok(wykonaj && wykonaj.disabled && !wykonaj.classList.contains('on'),
      '[C4] blocking=0: "Wykonaj" jest disabled, bez klasy .on');
    ok(wykonaj && wykonaj.querySelector('.wyk-badge') === null,
      '[C5] blocking=0: "Wykonaj" bez odznaki liczby');

    const endBtn = el.querySelector('[data-end]');
    ok(endBtn && !endBtn.classList.contains('et-signal') && !endBtn.classList.contains('is-disabled'),
      '[C6] blocking=0: "Zakoncz ture" wraca do normalnego stanu (bez et-signal, bez is-disabled) -- kliknalny, canEndTurn=true');

    // Kluczowy dowod naprawy: skoro .et-hint zniknal z DOM, a WCZESNIEJ (stan 1) byl
    // bezposrednim dzieckiem .civ-bottom-bar (nie .et-wrap) -- jego zniknieciu nie
    // towarzyszy zaden "skok" layoutu .et-wrap/.wykonaj, bo nigdy nie byl ich potomkiem
    // ani nie wplywal na ich flow (position:absolute + rodzic poza .et-wrap).
    const etWrap = el.querySelector('.et-wrap');
    ok(etWrap && etWrap.children.length === 1 && etWrap.children[0].matches('[data-end]'),
      '[C7] blocking=0: .et-wrap nadal ma dokladnie jedno dziecko (end-turn) -- struktura stabilna, zniknięcie .et-hint jej nie ruszylo');
    ok(wykonaj && wykonaj.parentElement === el && wykonaj.previousElementSibling === null,
      '[C8] blocking=0: "Wykonaj" jest PIERWSZYM dzieckiem .civ-bottom-bar (hint/tooltip usuniete z DOM, nie zostawiaja "duchow" przed nim) -- dokladnie zgloszony objaw (pusty wyszarzony prostokat w miejscu paska) juz nie moze wystapic, bo pasek nigdy nie zajmowal jego miejsca w drzewie/warstwie');
  }

  // ---------------------------------------------------------------------
  // KONTROLA: przejscie w druga strone (0 -> 1) -- .et-hint wraca jako bezposrednie
  // dziecko, znowu PRZED .wykonaj, bez potrzeby przebudowy .et-wrap.
  // ---------------------------------------------------------------------
  blockingCount = 2;
  api.update();
  {
    const hint = el.querySelector('[data-et-hint]');
    ok(hint !== null && hint.parentElement === el,
      '[D1] kontrola 0->2: .et-hint wraca jako bezposrednie dziecko .civ-bottom-bar');
    ok(el.children[0] === hint,
      '[D2] kontrola 0->2: .et-hint jest znowu PIERWSZYM dzieckiem (przed .wykonaj) -- kolejnosc stabilna w obie strony');
    const wykonaj = el.querySelector('[data-wykonaj]');
    ok(wykonaj && wykonaj.classList.contains('on') && wykonaj.querySelector('.wyk-badge').textContent === '2',
      '[D3] kontrola 0->2: "Wykonaj" znowu aktywny z odznaka 2');
  }

  api.destroy();
  ok(document.body.contains(el) === false, '[E1] destroy() usuwa cala strukture z DOM (bez pozostalosci)');

  try { fs.unlinkSync(ENTRY_FILE); } catch { /* ignore */ }
  try { fs.unlinkSync(BUNDLE_FILE); } catch { /* ignore */ }
  try { fs.unlinkSync(STUB_BRAND_ASSETS); } catch { /* ignore */ }
  try { fs.unlinkSync(STUB_BRAND_TOKENS); } catch { /* ignore */ }
}

async function main() {
  await runUiPart();
  console.log(`\nbottom-bar-hud-wykonaj-overlap-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
