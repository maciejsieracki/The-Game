'use strict';
/**
 * diplomacy-harder-measure-hook-test.cjs -- R-WEB-DIPLO-HARDER-MEASURE-RUNNER-Q1: test haka `__diploHarderMeasure`.
 *
 * Asercje (zielone = zgodne z kontraktem haka):
 *  A) (zawsze, bez przegladarki) kontrola ksztaltu: poprawny obiekt metryk przechodzi walidator; czerwone mutacje
 *     (brak pairs, NaN w zaufaniu, flaga nie-bool, nieznany status, brak turn, brak karaBazowa) MUSZA byc odrzucone.
 *  B) (przegladarka; tylko gdy --dist ma index.html albo --build 1) :
 *     B1 hak istnieje przy ?civTest=1, a BEZ niego `__diploHarderMeasure === undefined` (kontrola negatywna);
 *     B2 setEnabled(true) -> isEnabled()===true; setEnabled(null) -> wraca do stalej (false); setEnabled(false) -> false;
 *     B3 metrics() po starcie gry przechodzi walidator (ksztalt, pary, statusy);
 *     B4 metrics() jest tylko do odczytu: dwa kolejne wywolania w tej samej turze daja identyczny JSON i tura sie nie zmienia.
 *
 * Brak DIST (i bez --build 1) = czytelne SKIP z kodem 0 (zapisane w wyjsciu jako SKIP, bez falszywej zieleni asercji B).
 *
 * Uzycie (z gra/): node tools/diplomacy-harder-measure-hook-test.cjs [--dist <abs>] [--build 1]
 * Bundle budowany POZA repo: --dist domyslnie <os.tmpdir()>/diplo-harder-test-dist.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const GRA_DIR = path.resolve(__dirname, '..');
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), 'diplo-harder-test-dist')));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
/** Przegladarka: CHROME_PATH; bez niego pierwsza istniejaca (poprawka obrony: brak /usr/bin/chromium nie wywala testu). */
const CHROME = process.env.CHROME_PATH || [(require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].find(p => fs.existsSync(p)) || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const SEED = 4242;
const STATUSY = ['wojna', 'pokoj', 'sojusz', 'neutralni'];
const POLA_PARY = ['a', 'b', 'aiAi', 'status', 'zaufanie', 'respekt', 'pokoj', 'sasiad', 'sasiedztwoBezPokoju', 'karaBazowa'];

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'ZIELONE ' : 'CZERWONE ') + name + (detail ? ' :: ' + detail : ''));
}

/** Walidator ksztaltu metryk haka (czysta funkcja; zwraca liste problemow, pusta = zgodne). */
function shapeProblems(m) {
  const p = [];
  if (!m || typeof m !== 'object') return ['brak obiektu'];
  if (typeof m.turn !== 'number' || !Number.isFinite(m.turn)) p.push('turn nie jest liczba');
  if (typeof m.flag !== 'boolean') p.push('flag nie jest boolem');
  if (typeof m.gracz !== 'number' || !Number.isFinite(m.gracz)) p.push('brak gracz (ME)');
  if (!Array.isArray(m.owners)) p.push('owners nie jest tablica');
  if (!Array.isArray(m.pairs)) { p.push('brak pairs'); return p; }
  for (const x of m.pairs) {
    for (const k of POLA_PARY) if (!(k in x)) p.push('para bez pola ' + k);
    if (!STATUSY.includes(x.status)) p.push('nieznany status ' + x.status);
    if (x.zaufanie !== null && !(typeof x.zaufanie === 'number' && Number.isFinite(x.zaufanie))) p.push('zaufanie nie jest liczba (NaN?)');
    if (x.respekt !== null && !(typeof x.respekt === 'number' && Number.isFinite(x.respekt))) p.push('respekt nie jest liczba (NaN?)');
    if (typeof x.karaBazowa !== 'number' || !Number.isFinite(x.karaBazowa)) p.push('karaBazowa nie jest liczba');
    if (typeof x.sasiad !== 'boolean') p.push('sasiad nie jest boolem');
  }
  return p;
}

// ---- A) kontrola ksztaltu bez przegladarki (zawsze) ----
const dobry = {
  turn: 5, flag: false, gracz: 0, owners: [1, 2, 3],
  pairs: [
    { a: 1, b: 2, aiAi: true, status: 'pokoj', zaufanie: 40, respekt: 10, pokoj: 'nap', sasiad: true, sasiedztwoBezPokoju: false, karaBazowa: -3 },
    { a: 0, b: 1, aiAi: false, status: 'wojna', zaufanie: null, respekt: null, pokoj: undefined, sasiad: false, sasiedztwoBezPokoju: false, karaBazowa: 0 },
  ],
};
check('A1 poprawny obiekt przechodzi walidator', shapeProblems(dobry).length === 0, shapeProblems(dobry).join('; ') || 'brak problemow');
const mutacje = {
  'A2 mutacja: brak pairs': Object.assign({}, dobry, { pairs: undefined }),
  'A3 mutacja: NaN w zaufaniu': { ...dobry, pairs: [Object.assign({}, dobry.pairs[0], { zaufanie: NaN })] },
  'A4 mutacja: flaga nie-bool': Object.assign({}, dobry, { flag: 1 }),
  'A5 mutacja: nieznany status': { ...dobry, pairs: [Object.assign({}, dobry.pairs[0], { status: 'przymierze' })] },
  'A6 mutacja: brak turn': Object.assign({}, dobry, { turn: undefined }),
  'A7 mutacja: para bez karaBazowa': { ...dobry, pairs: [(({ karaBazowa, ...r }) => r)(dobry.pairs[0])] },
  'A8 mutacja: brak gracz': (({ gracz, ...r }) => r)(dobry),
};
for (const [nazwa, m] of Object.entries(mutacje)) {
  check(nazwa + ' jest odrzucona', shapeProblems(m).length > 0, shapeProblems(m)[0] || 'NIE ODRZUCONO');
}

// ---- C) wiazanie runnera (zawsze, bez przegladarki; R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1) ----
/** Runner ma podpiete: autopilot gracza (--player-ai), pokoj wymuszony i zamykanie blokad. Mutacja kopii MUSI byc wykryta. */
function runnerWired(src) {
  // Strazniki sprawdzane strukturalnie (nie sam tekst): domyslnosc i zgodnosc flagi, wywolanie autopilota
  // wewnatrz if (PLAYER_AI), wywolanie pokoju wymuszonego jako osobna instrukcja w petli tury.
  return /const PLAYER_AI = arg\('player-ai', '1'\) !== '0';/.test(src)
    && /if \(PLAYER_AI\) \{\s*await page\.evaluate\(\(\) => window\.__aiEconomyMeasure\.setPlayerAiAutopilotForTest\(true\)\);/.test(src)
    && /^\s*await acceptForcedPeace\(page, COUNTERS, wait\);\s*$/m.test(src)
    && src.includes("require('./measure-forced-peace.cjs')")
    && src.includes('forcedPeaceAccepted: COUNTERS.forcedPeaceAccepted');
}
{
  const runnerSrc = fs.readFileSync(path.join(__dirname, 'diplomacy-harder-measure-run.cjs'), 'utf8');
  check('C1 runner podpiety: autopilot w if (PLAYER_AI), pokoj wymuszony, licznik w wierszu, domyslne --player-ai 1', runnerWired(runnerSrc));
  check('C2 mutacja kopii (bez acceptForcedPeace) jest wykryta', !runnerWired(runnerSrc.replace('await acceptForcedPeace(page, COUNTERS, wait);', '0;')));
  check('C3 mutacja kopii (bez autopilota) jest wykryta', !runnerWired(runnerSrc.replace('setPlayerAiAutopilotForTest(true)', 'setPlayerAiAutopilotForTest(false)')));
  check('C4 mutacja kopii (odwrocona semantyka --player-ai, === 0) jest wykryta', !runnerWired(runnerSrc.replace("arg('player-ai', '1') !== '0'", "arg('player-ai', '1') === '0'")));
  check('C5 mutacja kopii (if (PLAYER_AI) zastapione if (false)) jest wykryta', !runnerWired(runnerSrc.replace('if (PLAYER_AI) {', 'if (false) {')));
  check('C6 mutacja kopii (pokoj wymuszony zakomentowany) jest wykryta', !runnerWired(runnerSrc.replace('await acceptForcedPeace(page, COUNTERS, wait);', '// await acceptForcedPeace(page, COUNTERS, wait);')));
}

// ---- B) przegladarka ----
async function browserChecks(distDir) {
  const { chromium } = require(path.join(PW_DIR, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  try {
    // B1: kontrola negatywna bez ?civTest=1
    const plain = await browser.newPage();
    await plain.goto('file://' + path.join(distDir, 'index.html') + '?civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    const brakHaka = await plain.evaluate(() => window.__diploHarderMeasure === undefined);
    check('B1a bez ?civTest=1 hak nie istnieje', brakHaka);
    await plain.close();

    const page = await browser.newPage();
    await page.goto('file://' + path.join(distDir, 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__diploHarderMeasure && !!window.__nnsMeasureDebug && !!window.__aiTradeWiringTestDebug, null, { timeout: 180000 });
    check('B1b przy ?civTest=1 hak istnieje', true);

    // B2: flaga
    const on = await page.evaluate(() => window.__diploHarderMeasure.setEnabled(true));
    check('B2a setEnabled(true) ustawia flage', on === true);
    const reset = await page.evaluate(() => window.__diploHarderMeasure.setEnabled(null));
    check('B2b setEnabled(null) wraca do stalej (OFF)', reset === false);
    const off = await page.evaluate(() => window.__diploHarderMeasure.setEnabled(false));
    check('B2c setEnabled(false) ustawia OFF', off === false && (await page.evaluate(() => window.__diploHarderMeasure.isEnabled())) === false);

    // start gry jak runner
    await page.evaluate(([s]) => window.__nnsMeasureDebug.startGame({ seed: s }), [SEED]);
    await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, null, { timeout: 600000, polling: 500 });
    await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());

    // B3: ksztalt metryk
    const m = await page.evaluate(() => window.__diploHarderMeasure.metrics());
    const probl = shapeProblems(m);
    const graczWOwners = m.owners.includes(m.gracz);
    check('B3 metryki po starcie gry maja poprawny ksztalt (gracz nalezy do owners)', probl.length === 0 && graczWOwners, probl.slice(0, 3).join('; ') || ('pary=' + m.pairs.length + ', wlasciciele=' + m.owners.length + ', gracz=' + m.gracz));

    // B4: tylko odczyt
    const t1 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    const j1 = await page.evaluate(() => JSON.stringify(window.__diploHarderMeasure.metrics()));
    const j2 = await page.evaluate(() => JSON.stringify(window.__diploHarderMeasure.metrics()));
    const t2 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    check('B4 metrics() tylko do odczytu (dwa wywolania = ten sam JSON, tura bez zmian)', j1 === j2 && t1 === t2, 'tura=' + t1);
    await page.close();
  } finally {
    await browser.close();
  }
}

async function main() {
  const haveDist = fs.existsSync(path.join(DIST, 'index.html'));
  if (!haveDist && arg('build', '0') === '1') {
    console.log('[test] build vite -> ' + DIST + ' (poza repo)');
    execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(DIST)} --emptyOutDir`,
      { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
  }
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.log('SKIP: brak bundle (' + DIST + '/index.html); czesc B pominieta (zadanie kodem 0). Uruchom z --build 1 albo --dist.');
  } else {
    await browserChecks(DIST);
  }
  const bad = results.filter(r => !r.ok).length;
  console.log('WYNIK: ' + (results.length - bad) + ' zielonych, ' + bad + ' czerwonych');
  process.exit(bad ? 1 : 0);
}

module.exports = { shapeProblems };

if (require.main === module) {
  main().catch(e => { console.error('[test] BLAD: ' + (e && e.stack || e)); process.exit(1); });
}
