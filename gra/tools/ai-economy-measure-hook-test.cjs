'use strict';
/**
 * ai-economy-measure-hook-test.cjs -- R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1 (kryterium a): test haka metryk.
 *
 * 1) ksztalt: z ?civTest=1 `window.__aiEconomyMeasure.metrics()` zwraca {turn, owners[], niezmierzone[]},
 *    a kazdy wlasciciel ma komplet pol (LICZBY/BOOLE/null zgodnie z opisem w gra/src/main.ts).
 * 2) kontrola negatywna: BEZ ?civTest=1 hak nie istnieje (`__aiEconomyMeasure === undefined`).
 * 3) mutacja: sprawdzenie wymagajacego nieistniejacego pola MUSI oblac (czerwone); bez tego test bylby slepy.
 *
 * Uzycie (z gra/, bundle zbudowany): node tools/ai-economy-measure-hook-test.cjs --dist <abs-dist>
 * Wyjscie: 0 = wszystkie asercje zielone (w tym czerwona mutacja); 1 = blad.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const GRA_DIR = path.resolve(__dirname, '..');
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), 'ai-economy-dist')));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const OWNER_KEYS = ['owner', 'skarbiec', 'spichlerz', 'jednostkiWojskowe', 'jednostkiCywilne', 'rekruci', 'sumaLudkow',
  'glodWojska', 'glodWojskaAtrycja', 'deficytZlota', 'miasta', 'obywatele', 'utrzymanieBudynkowPieniadz',
  'utrzymanieBudynkowSurowce', 'utrzymanieGarnizonuPieniadz'];

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || '' }); console.log((ok ? 'ZIELONE ' : 'CZERWONE ') + name + (detail ? ' :: ' + detail : '')); }

function shapeProblems(metrics, requiredKeys) {
  const problems = [];
  if (!metrics || typeof metrics.turn !== 'number') problems.push('brak turn');
  if (!metrics || !Array.isArray(metrics.owners) || metrics.owners.length === 0) problems.push('brak owners');
  for (const o of (metrics && metrics.owners) || []) {
    for (const k of requiredKeys) if (!(k in o)) problems.push('owner ' + o.owner + ' bez ' + k);
    for (const k of ['jednostkiWojskowe', 'jednostkiCywilne', 'miasta', 'obywatele']) {
      if (typeof o[k] !== 'number' || !(o[k] >= 0)) problems.push('owner ' + o.owner + ' ' + k + ' nie jest liczba >=0');
    }
    for (const k of ['glodWojska', 'glodWojskaAtrycja', 'deficytZlota']) {
      if (typeof o[k] !== 'boolean') problems.push('owner ' + o.owner + ' ' + k + ' nie jest boolem');
    }
  }
  return problems;
}

async function main() {
  const { chromium } = require(path.join(PW_DIR, 'node_modules', 'playwright'));
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args });
  try {
    // 1) hak z ?civTest=1: start nowej gry (prawdziwa sciezka), ksztalt metryk.
    const page = await browser.newPage();
    await page.goto('file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=4242', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__nnsMeasureDebug && !!window.__aiTradeWiringTestDebug, null, { timeout: 180000 });
    await page.evaluate(() => window.__nnsMeasureDebug.startGame({ seed: 4242 }));
    await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
    const metrics = await page.evaluate(() => window.__aiEconomyMeasure.metrics());
    const probs = shapeProblems(metrics, OWNER_KEYS);
    check('ksztalt metryk: kazdy wlasciciel ma komplet pol i typy', probs.length === 0, probs.slice(0, 5).join('; ') || (metrics.owners.length + ' wlascicieli'));
    check('niezmierzone wymienia przychod/utrate (nie udajemy pomiaru)', Array.isArray(metrics.niezmierzone) && metrics.niezmierzone.includes('przychodNaTure'));

    // 2) kontrola negatywna: bez ?civTest=1 hak nie istnieje.
    const plain = await browser.newPage();
    await plain.goto('file://' + path.join(DIST, 'index.html') + '?civSeed=4242', { waitUntil: 'load', timeout: 180000 });
    await plain.waitForTimeout(3000);
    const hasHook = await plain.evaluate(() => typeof window.__aiEconomyMeasure !== 'undefined');
    check('kontrola negatywna: bez ?civTest=1 brak haka __aiEconomyMeasure', hasHook === false);

    // 3) mutacja: wymaganie nieistniejacego pola musi oblac (test nie jest slepy).
    const mutantProbs = shapeProblems(metrics, OWNER_KEYS.concat(['poleNieistniejace']));
    check('mutacja (wymagane pole nieistniejace) jest CZERWONA', mutantProbs.length > 0, mutantProbs.length + ' problemow');
  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.ok && !r.name.includes('mutacja'));
  const mutantBlind = results.some(r => r.name.includes('mutacja') && !r.ok); // mutacja MUSI dac czerwone
  console.log('PODSUMOWANIE ' + results.filter(r => r.ok).length + '/' + results.length + ' zielone');
  process.exit(failed.length === 0 && !mutantBlind ? 0 : 1);
}

main().catch(e => { console.error('BLAD ' + (e && e.stack || e)); process.exit(1); });
