'use strict';
/**
 * escape-fullscreen-priority-test.cjs — P-MENU-ESCAPE-NIEPELNOEKRANOWE (Maciej 2026-08-14).
 *
 * Dowodzi PRIORYTETU z release: Escape z otwartym overlayem zamyka TYLKO ten overlay i NIE
 * dotyka pelnego ekranu; dopiero Escape z pustym stosem moze wyjsc z pelnego ekranu.
 *
 * escapeOverlayStack.ts sam nie wywoluje exitFullscreen() — o to dba natywny mechanizm
 * przegladarki (Escape w trybie pelnoekranowym zawsze wychodzi z fullscreen, JS nie moze tego
 * zablokowac zwyklym preventDefault/stopPropagation). Jedynym sposobem na przechwycenie Escape
 * PRZED tym natywnym zachowaniem jest Keyboard Lock API (`navigator.keyboard.lock(['Escape'])`)
 * — dokladnie to, co ten modul robi, gdy stos overlayow jest niepusty (patrz
 * `lockEscapeWhileStacked` w escapeOverlayStack.ts). Test wiec nie mierzy fullscreen wprost
 * (brak prawdziwej przegladarki w Node), tylko mierzy STAN BLOKADY Keyboard Lock — bo to
 * WLASNIE ten stan przesadza, czy nastepny Escape trafi do przegladarki (i wyjdzie z pelnego
 * ekranu), czy zostanie przechwycony przez appke.
 *
 * / EN: proves the RELEASE PRIORITY: Escape with an overlay open closes ONLY that overlay and
 * does NOT touch fullscreen; only Escape with an empty stack may exit fullscreen.
 *
 * escapeOverlayStack.ts never calls exitFullscreen() itself — that's the browser's native
 * behaviour (Escape while in fullscreen always exits it; JS cannot block this with an ordinary
 * preventDefault/stopPropagation). The only way to intercept Escape BEFORE that native
 * behaviour fires is the Keyboard Lock API (`navigator.keyboard.lock(['Escape'])`) — exactly
 * what this module does whenever the overlay stack is non-empty (see `lockEscapeWhileStacked`
 * in escapeOverlayStack.ts). So this test doesn't measure fullscreen directly (no real browser
 * in Node) — it measures the Keyboard Lock STATE, because that state is exactly what decides
 * whether the next Escape reaches the browser (and exits fullscreen) or gets captured by the app.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.escape-fullscreen-priority-test-entry.ts');
const BUNDLE = path.join(__dirname, '.escape-fullscreen-priority-test-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  pushOverlay,
  popOverlay,
  _resetEscapeOverlayStackForTest,
  _getEscapeOverlayStackDepthForTest,
  _dispatchEscapeForTest,
  isEscapeOverlayStackActive,
} from '../src/ui/escapeOverlayStack';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

// Mock Keyboard Lock API PRZED require() modulu — funkcje escapeOverlayStack.ts czytaja
// `navigator.keyboard` leniwie (dopiero przy wywolaniu push/popOverlay), wiec kolejnosc
// require -> ustawienie mocka -> wywolania jest bezpieczna. / EN: mocked BEFORE requiring the
// module — escapeOverlayStack.ts reads `navigator.keyboard` lazily (only when push/popOverlay
// run), so require -> set mock -> call is a safe order.
const lockCalls = [];
const unlockCalls = [];
// Node 22 ma wbudowany globalny `navigator` (bez .keyboard) — dokladamy .keyboard, nie
// podmieniamy calego obiektu. / EN: Node 22 has a built-in global `navigator` (without
// .keyboard) — we add .keyboard, we don't replace the whole object.
globalThis.navigator.keyboard = {
  lock(keys) { lockCalls.push(keys); return Promise.resolve(); },
  unlock() { unlockCalls.push(true); },
};

const {
  pushOverlay,
  popOverlay,
  _resetEscapeOverlayStackForTest,
  _getEscapeOverlayStackDepthForTest,
  _dispatchEscapeForTest,
  isEscapeOverlayStackActive,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', msg);
}

/** Blokada aktywna = wiecej wywolan lock() niz unlock() (net stan modulu). */
function keyboardLockHeld() {
  return lockCalls.length > unlockCalls.length;
}

/**
 * Symuluje realny kontrakt przegladarki: Escape w trybie pelnoekranowym z aktywna blokada
 * Keyboard Lock trafia do strony (appka go obsluguje, fullscreen NIE jest ruszany); bez
 * blokady przegladarka wykonuje wlasny natywny handler i wychodzi z pelnego ekranu — tego
 * JS nie da sie zatrzymac zadnym listenerem/preventDefault (to jest dokladnie mechanizm
 * odpowiedzialny za zgloszony bug, gdy overlay NIE byl wpiety w stos).
 * / EN: simulates the real browser contract: Escape in fullscreen with an active Keyboard
 * Lock reaches the page (the app handles it, fullscreen is NOT touched); without the lock the
 * browser runs its own native handler and exits fullscreen — no JS listener/preventDefault can
 * stop that (this is exactly the mechanism behind the reported bug when an overlay was not
 * wired into the stack).
 */
function simulateEscapeInFullscreen() {
  if (keyboardLockHeld()) {
    _dispatchEscapeForTest();
    return { fullscreenExited: false };
  }
  return { fullscreenExited: true };
}

_resetEscapeOverlayStackForTest();
lockCalls.length = 0;
unlockCalls.length = 0;

// --- Scenariusz z opisu zgloszenia ---------------------------------------------------------

assert(!keyboardLockHeld(), 'start: brak overlayow -> brak blokady Escape');

let overlayClosed = false;
pushOverlay('empire-detail-panel', () => {
  overlayClosed = true;
  popOverlay('empire-detail-panel');
});
assert(_getEscapeOverlayStackDepthForTest() === 1, 'overlay na stosie po push');
assert(isEscapeOverlayStackActive(), 'isEscapeOverlayStackActive()=true gdy overlay otwarty');
assert(keyboardLockHeld(), 'push overlay -> Keyboard Lock aktywny (blokuje natywny Escape przegladarki)');

// PIERWSZY Escape: overlay otwarty.
const first = simulateEscapeInFullscreen();
assert(overlayClosed, '1. Escape zamyka overlay');
assert(_getEscapeOverlayStackDepthForTest() === 0, '1. Escape oprozna stos');
assert(first.fullscreenExited === false, '1. Escape NIE rusza pelnego ekranu (priorytet: overlay > fullscreen)');
assert(!keyboardLockHeld(), 'po zamknieciu ostatniego overlayu -> Keyboard Lock zwolniony');
assert(!isEscapeOverlayStackActive(), 'isEscapeOverlayStackActive()=false po zamknieciu overlayu');

// DRUGI Escape: stos juz pusty -> nic w appce go nie przechwytuje -> przegladarka wychodzi
// z pelnego ekranu (dopiero teraz).
const second = simulateEscapeInFullscreen();
assert(second.fullscreenExited === true, '2. Escape (bez overlayu) wychodzi z pelnego ekranu');

_resetEscapeOverlayStackForTest();

console.log(`escape-fullscreen-priority-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
