'use strict';
/**
 * triumph-city-state-notice-test.cjs — modal „TRIUMF!" po zjednoczeniu
 * miast-państw (P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK).
 *
 * Bundluje NAPRAWDĘ src/ui/triumphCityStateNotice.ts (wzorem
 * side-panel-unit-cycle-arrows-test.cjs / army-merge-dismiss-bounce-test.cjs) —
 * moduł jest czystą prezentacją bez zależności Vite-specific, więc bundling nie
 * wymaga żadnych stubów.
 *
 * Usage (z gra/): node tools/triumph-city-state-notice-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[triumph-city-state-notice-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const NOTICE_SRC = path.resolve(GRA, 'src', 'ui', 'triumphCityStateNotice.ts');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');
const ENTRY_FILE = path.resolve(__dirname, '.triumph-city-state-notice-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.triumph-city-state-notice-bundle.cjs');

fs.writeFileSync(
  ENTRY_FILE,
  "export { showTriumphCityStateNotice, hideTriumphCityStateNotice, buildTriumphCityStateNoticeMarkup } from '../src/ui/triumphCityStateNotice.ts';\n",
  'utf8',
);

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE_FILE,
      absWorkingDir: GRA,
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[triumph-city-state-notice-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const {
    showTriumphCityStateNotice,
    hideTriumphCityStateNotice,
    buildTriumphCityStateNoticeMarkup,
  } = require(BUNDLE_FILE);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.MouseEvent = dom.window.MouseEvent;

  let pass = 0;
  let fail = 0;
  function ok(cond, msg) {
    if (cond) { pass++; console.log('  PASS:', msg); }
    else { fail++; console.error('  FAIL:', msg); }
  }

  console.log('triumph-city-state-notice-test (P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK)\n');

  // -------------------------------------------------------------------------
  // SCENARIUSZ 1: renderuje civLabel + cityName, host w DOM, jeden przycisk.
  // -------------------------------------------------------------------------
  let closed = false;
  showTriumphCityStateNotice({
    civLabel: 'Grecy',
    cityName: 'Testopolis',
    onClose: () => { closed = true; },
  });

  const host = document.getElementById('civ-triumph-cs-notice-host');
  ok(host !== null, '1) host #civ-triumph-cs-notice-host obecny w DOM po show');

  const text = host ? host.textContent : '';
  ok(text.includes('TRIUMF'), '2) treść karty zawiera "TRIUMF"');
  ok(text.includes('Grecy'), '3) treść karty zawiera civLabel ("Grecy")');
  // Warunek 2 (Evaluator PASS-WITH-NOTES): 'Testopolis' to unikalna wartość
  // cityName, niewystępująca w żadnym stałym fragmencie karty (w
  // przeciwieństwie do generycznego słowa "miasto", które jest częścią
  // niezmiennego opisu "Ostatnie miasto-państwo..." niezależnie od tego, co
  // faktycznie przekazano jako cityName — patrz asercja 10 niżej, gdzie
  // 'miasto' jest zawsze prawdziwe nawet dla PUSTEGO cityName).
  ok(text.includes('Testopolis'), '4) treść karty zawiera konkretną wartość cityName ("Testopolis")');
  ok(host?.querySelector('[role="dialog"]') !== null, '5) karta ma semantykę dialogu');
  ok(host?.querySelector('[aria-modal="true"]') !== null, '6) karta jest modalna dla czytnika ekranu');
  ok(host?.querySelector('.tn-body')?.textContent.includes('Zjednoczyłeś całą kulturę Grecy.'), '7) karta ma kanoniczny komunikat kultury');

  const buttons = host ? host.querySelectorAll('button') : [];
  ok(buttons.length === 1, '8) dokładnie jeden przycisk w karcie (wymóg potwierdzenia)');
  ok(buttons.length === 1 && buttons[0].textContent.trim() === 'Rozumiem', '9) przycisk podpisany "Rozumiem"');

  // -------------------------------------------------------------------------
  // SCENARIUSZ 2: klik przycisku zamyka modal i woła onClose.
  // -------------------------------------------------------------------------
  if (buttons.length === 1) {
    buttons[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  ok(document.getElementById('civ-triumph-cs-notice-host') === null, '10) klik "Rozumiem" usuwa host z DOM');
  ok(closed === true, '11) klik "Rozumiem" woła onClose');

  // -------------------------------------------------------------------------
  // SCENARIUSZ 3: fallbacki na puste civLabel/cityName (spójne z
  // buildTriumphCityStateUnificationMessage w game/triumph-city-state.ts).
  // -------------------------------------------------------------------------
  showTriumphCityStateNotice({ civLabel: '', cityName: '' });
  const host2 = document.getElementById('civ-triumph-cs-notice-host');
  const text2 = host2 ? host2.textContent : '';
  ok(text2.includes('Twoja cywilizacja'), '12) civLabel pusty -> fallback "Twoja cywilizacja"');
  ok(text2.includes('miasto'), '13) cityName pusty -> fallback "miasto"');

  hideTriumphCityStateNotice();
  showTriumphCityStateNotice({ civLabel: 'Sparta', cityName: 'Korzynt' });
  const backdrop = document.querySelector('#civ-triumph-cs-notice-host .tn-backdrop');
  backdrop?.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  ok(document.getElementById('civ-triumph-cs-notice-host') === null, '14) kliknięcie tła zamyka kartę');

  // -------------------------------------------------------------------------
  // SCENARIUSZ 4: hideTriumphCityStateNotice() usuwa host bez kliknięcia.
  // -------------------------------------------------------------------------
  hideTriumphCityStateNotice();
  ok(document.getElementById('civ-triumph-cs-notice-host') === null, '15) hideTriumphCityStateNotice() usuwa host');

  // -------------------------------------------------------------------------
  // SCENARIUSZ 5: ponowne wywołanie tego samego zdarzenia nie duplikuje
  // ani nie podmienia oczekującego na potwierdzenie modala.
  // -------------------------------------------------------------------------
  showTriumphCityStateNotice({ civLabel: 'Rzymianie', cityName: 'Kartagina' });
  showTriumphCityStateNotice({ civLabel: 'Egipcjanie', cityName: 'Teby' });
  ok(document.querySelectorAll('#civ-triumph-cs-notice-host').length === 1, '16) drugi show nie duplikuje hosta');
  ok(
    (document.getElementById('civ-triumph-cs-notice-host').textContent || '').includes('Rzymianie'),
    '17) drugie wywołanie nie zmienia treści oczekującego modala',
  );

  const escaped = buildTriumphCityStateNoticeMarkup('<Grecy>', 'A&B');
  ok(!escaped.includes('<Grecy>'), '18) nazwa kultury nie może wstrzyknąć HTML');
  ok(escaped.includes('&lt;Grecy&gt;') && escaped.includes('A&amp;B'), '19) nazwy są escapowane w kontrakcie karty');

  // -------------------------------------------------------------------------
  // SCENARIUSZ 6 (Warunek 1 Evaluatora — M1): modal MUSI wymagać kliknięcia,
  // NIE wolno mu znikać samoczynnie. Test jest w pełni synchroniczny (jsdom
  // bez fake timers), więc `setTimeout(hideTriumphCityStateNotice, N)` w
  // triumphCityStateNotice.ts przeszedłby powyższe asercje niezauważony —
  // dlatego strażnik czyta ŹRÓDŁO pliku wprost i odrzuca każdy setTimeout.
  // -------------------------------------------------------------------------
  const noticeSrc = fs.readFileSync(NOTICE_SRC, 'utf8');
  ok(!/setTimeout/.test(noticeSrc),
    '20) [ŹRÓDŁO] triumphCityStateNotice.ts NIE zawiera setTimeout (modal nie znika sam, wymaga kliknięcia)');

  // -------------------------------------------------------------------------
  // SCENARIUSZ 7 (Warunek 3 Evaluatora — M3): wiring w main.ts nie może zostać
  // po cichu odcięty. Wzorzec jak w tools/border-march-wygasanie-test.cjs —
  // main.ts czytany jako zwykły tekst, sprawdzana obecność wywołania
  // showTriumphCityStateNotice(...) w gałęzi if po
  // shouldShowPlayerTriumphCityStateUnification(...).
  // -------------------------------------------------------------------------
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
  const guardIdx = mainSrc.indexOf('shouldShowPlayerTriumphCityStateUnification(');
  ok(guardIdx >= 0, '21) [ŹRÓDŁO main.ts] znaleziono wywołanie shouldShowPlayerTriumphCityStateUnification(');
  // Ciało if-a jest krótkie (kilkanaście linii) — okno 800 znaków po guardzie
  // z zapasem obejmuje całą gałąź do zamykającego `}`.
  const guardWindow = guardIdx >= 0 ? mainSrc.slice(guardIdx, guardIdx + 800) : '';
  ok(/showTriumphCityStateNotice\(/.test(guardWindow),
    '22) [ŹRÓDŁO main.ts] gałąź po shouldShowPlayerTriumphCityStateUnification(...) woła showTriumphCityStateNotice(...) (wiring nieodcięty)');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
