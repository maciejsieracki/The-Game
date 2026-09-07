'use strict';
/**
 * boot-error-catcher-console-error-test.cjs — R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1,
 * znalezisko 2 (INFRA).
 *
 * Dowodzi że BOOT ERROR CATCHER w gra/index.html:
 *   - NIE nadpisuje już `console.error` globalnie (usunięty override, więc zwykłe
 *     `console.error(...)` nigdzie w grze już NIE pokazuje czerwonego banera),
 *   - `window.onerror` i `window.addEventListener('unhandledrejection', ...)` zostają
 *     NIETKNIĘTE i nadal realnie łapią wyjątki (test przez jsdom: wymuszony throw
 *     nadal pokazuje baner, zwykły console.error już NIE).
 *
 * Uruchamianie z gra/: node tools/boot-error-catcher-console-error-test.cjs
 */

const fs = require('fs');
const path = require('path');
let JSDOM;
try {
  ({ JSDOM } = require(path.resolve(__dirname, '..', 'node_modules', 'jsdom')));
} catch (e) {
  console.error('no jsdom');
  process.exit(3);
}

const GRA_ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(GRA_ROOT, 'index.html'), 'utf8');

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}`);
  }
}

console.log('R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 — BOOT ERROR CATCHER console.error');

// (A) Guard tekstowy na źródle index.html: override console.error usunięty,
// window.onerror/unhandledrejection nietknięte.
const scriptMatch = html.match(/<script>([\s\S]*?BOOT ERROR CATCHER[\s\S]*?)<\/script>/);
const catcherSrc = scriptMatch ? scriptMatch[1] : '';
check('blok BOOT ERROR CATCHER znaleziony w index.html', catcherSrc.length > 0);
check(
  'override console.error USUNIĘTY (brak `console.error=function`)',
  !/console\.error\s*=\s*function/.test(catcherSrc),
);
check(
  'brak też zmiennej pomocniczej `_ce` (dawny zapis oryginalnego console.error)',
  !/var _ce\s*=\s*console\.error/.test(catcherSrc),
);
check(
  'window.onerror NIETKNIĘTY',
  /window\.onerror\s*=\s*function/.test(catcherSrc),
);
check(
  "window.addEventListener('unhandledrejection', ...) NIETKNIĘTY",
  /window\.addEventListener\(\s*'unhandledrejection'/.test(catcherSrc),
);
check(
  'showBootErr wciąż istnieje (konsument window.onerror/unhandledrejection)',
  /function showBootErr\(msg\)/.test(catcherSrc),
);

// (B) Behawioralny dowód przez jsdom: wykonaj skrypt catchera w realnym oknie,
// potem (1) zwykły console.error nie tworzy banera, (2) wymuszony throw w
// window.onerror wciąż tworzy baner.
try {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    runScripts: 'outside-only',
  });
  const { window } = dom;
  window.eval(catcherSrc);

  window.console.error('to jest oczekiwany, obsłużony przypadek brzegowy, NIE błąd bootu');
  const bannerAfterConsoleError = window.document.getElementById('__boot_err__');
  check(
    'zwykły console.error(...) NIE tworzy banera __boot_err__ (po naprawie)',
    bannerAfterConsoleError === null,
  );

  // Symuluj realny błąd tak jak przeglądarka woła window.onerror.
  window.onerror('Boom', 'bundle.js', 1, 1, new window.Error('Boom'));
  const bannerAfterOnerror = window.document.getElementById('__boot_err__');
  check(
    'window.onerror nadal tworzy baner __boot_err__ (realne błędy dalej łapane)',
    bannerAfterOnerror !== null && /Boom/.test(bannerAfterOnerror.textContent),
  );

  window.close();
} catch (e) {
  failed++;
  console.log('FAIL: behawioralny test jsdom rzucił wyjątkiem:', e && e.message);
}

console.log('');
console.log(`PASSED: ${passed}, FAILED: ${failed}`);
if (failed > 0) process.exit(1);
