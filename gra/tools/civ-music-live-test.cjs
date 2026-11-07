'use strict';
/**
 * civ-music-live-test.cjs — R-WEB-DIPLO-CIV-MUSIC-Q1
 *
 * Realny headless Chromium na prawdziwym bundle Vite (?playtest=mapa). Obserwuje
 * REALNE efekty uboczne <audio> (instrumentacja window.Audio przez addInitScript,
 * jak muzyka-era-live-e2e-test.cjs) — utwory rozpoznawane po czasie trwania
 * (znane z ffprobe), bo bundle wystawia je jako blob: URL.
 *
 *  L1. Grecy: otwarcie dyplomacji -> gra PRZYWITANIE (43,5 s), muzyka tla zatrzymana;
 *      po koncu przywitania -> NEGOCJACJE (140,8 s); koniec negocjacji -> petla (znow
 *      negocjacje, NIE przywitanie).
 *  L2. Zamkniecie dyplomacji -> zaden utwor cywilizacji nie gra, wraca muzyka tla.
 *  L3. Ponowne otwarcie -> znow od przywitania (rewind).
 *  L4. Inkowie: dwa utwory negocjacji, brak przywitania; po koncu pierwszego gra drugi.
 *  L5. Sumerowie (sumer): przywitanie, potem dotychczasowy utwor dyplomacji (29,3 s).
 *  L6. Cywilizacja bez utworow (celtowie): gra tylko dotychczasowy utwor (29,3 s) — bez zmian.
 *  L7. Wyciszona muzyka gry (stopMusic) -> dyplomacja nic nie gra.
 *  L8. Zero pageerror / console.error.
 *  L9. (drugi przebieg, polityka autoplay "wymaga gestu") play() odrzucony -> zero bledow.
 *
 * Usage (z gra/): node tools/civ-music-live-test.cjs [scratchDirAbs]
 *   Bundle: node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir
 *   potem:  SKIP_BUILD=1 node tools/civ-music-live-test.cjs <scratch>
 *   Tryb szybki: CIVMUSIC_SKIP_AUTOPLAY=1 pomija L9 (drugie ladowanie gry).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-music-live-' + process.pid);
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const AI = 1;

// czasy trwania (s) z ffprobe po przekodowaniu
const DUR = {
  grecyHello: 43.55, grecyNeg: 140.83,
  inkNeg1: 149.13, inkNeg2: 145.08,
  sumerHello: 38.56,
  fallback: 29.31,
};
const near = (a, b) => Math.abs(a - b) < 0.6;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) {
    console.log('[civ-music-live] SKIP_BUILD=1 — uzywam istniejacego bundle:', SCRATCH);
    return;
  }
  console.log('[civ-music-live] vite build do katalogu tymczasowego:', SCRATCH);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
}

async function launch(chromium, extraArgs) {
  const args = extraArgs || [];
  try { return await chromium.launch({ headless: true, args }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: [...args, '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

const INIT = () => {
  const Orig = window.Audio;
  const all = [];
  function A(...a) { const e = new Orig(...a); all.push(e); return e; }
  A.prototype = Orig.prototype;
  window.Audio = A;
  window.__audioProbe = () => all
    .filter((e) => !e.paused && e.hasAttribute('src'))
    .map((e) => ({ dur: e.duration, t: e.currentTime, vol: e.volume }));
  window.__audioAll = () => all.map((e) => ({
    paused: e.paused, src: e.hasAttribute('src'), dur: e.duration, t: e.currentTime, vol: e.volume,
    rs: e.readyState, ns: e.networkState, err: e.error ? e.error.code : null, ended: e.ended,
  }));
  window.__audioSeekNearEnd = (durApprox) => {
    for (const e of all) {
      if (!e.paused && e.hasAttribute('src') && Math.abs(e.duration - durApprox) < 0.6) {
        e.currentTime = Math.max(0, e.duration - 2.2);
        return true;
      }
    }
    return false;
  };
};

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__musicEraTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

const probe = (page) => page.evaluate(() => window.__audioProbe());
const durs = (arr) => arr.map((p) => +p.dur.toFixed(2));
const only = (arr, d) => arr.length === 1 && near(arr[0].dur, d);

async function waitFor(page, pred, ms) {
  const t0 = Date.now();
  let last = [];
  while (Date.now() - t0 < ms) {
    last = await probe(page);
    if (pred(last)) return last;
    await wait(250);
  }
  return last;
}

async function openCiv(page, civ) {
  await page.evaluate(([c, ai]) => {
    window.__musicEraTestDebug.setOwnerCivForTest(ai, c);
    window.__truceTestDebug.openAudience(ai);
  }, [civ, AI]);
}
async function closeAud(page) {
  await page.evaluate(() => window.__truceTestDebug.closeAudience());
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[civ-music-live] playwright nie znaleziony'); process.exit(1); }
  buildBundle();

  const errors = [];
  let browser = await launch(chromium, ['--autoplay-policy=no-user-gesture-required']);
  let page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.addInitScript(INIT);

  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(() => window.__musicEraTestDebug.startMusic('mapa'));
    const bg = await waitFor(page, (a) => a.length >= 1, 14000);
    assert('S0 muzyka tla gra przed dyplomacja', bg.length >= 1 && await page.evaluate(() => window.__musicEraTestDebug.isMusicPlaying()), durs(bg));
    const hasHook = await page.evaluate(() => typeof window.__musicEraTestDebug.setOwnerCivForTest === 'function');
    assert('S1 haki testowe obecne', hasHook);
    if (!hasHook) throw new Error('brak hakow testowych');

    // --- L1/L2/L3: Grecy ---
    console.log('L1 Grecy: przywitanie -> negocjacje -> petla');
    const civKey = await page.evaluate((ai) => { window.__musicEraTestDebug.setOwnerCivForTest(ai, 'grecy'); return window.__musicEraTestDebug.civKeyOfOwner(ai); }, AI);
    assert('L1a civId rozmowcy = grecy', civKey === 'grecy', civKey);
    await openCiv(page, 'grecy');
    let p = await waitFor(page, (a) => only(a, DUR.grecyHello), 14000);
    assert('L1b gra WYLACZNIE przywitanie Grekow (muzyka tla zatrzymana)', only(p, DUR.grecyHello), durs(p));
    assert('L1b2 glosnosc > 0 (respektuje ustawienia gracza)', p.length === 1 && p[0].vol > 0, p);
    await page.evaluate((d) => window.__audioSeekNearEnd(d), DUR.grecyHello);
    p = await waitFor(page, (a) => only(a, DUR.grecyNeg), 14000);
    assert('L1c po przywitaniu gra NEGOCJACJE (bez nakladania)', only(p, DUR.grecyNeg), durs(p));
    await page.evaluate((d) => window.__audioSeekNearEnd(d), DUR.grecyNeg);
    // petla: po crossfade jeden utwor negocjacji, zrestartowany i REALNIE grajacy (0,2 < t < 8 s)
    p = await waitFor(page, (a) => only(a, DUR.grecyNeg) && a[0].t > 0.2 && a[0].t < 8, 20000);
    assert('L1d koniec negocjacji -> petla: jeden utwor negocjacji, zrestartowany (nie przywitanie)',
      only(p, DUR.grecyNeg) && p[0].t > 0.2 && p[0].t < 8, p);
    await wait(1000);
    p = await probe(page);
    assert('L1e nadal jeden utwor negocjacji (bez nakladania)', only(p, DUR.grecyNeg), p);

    console.log('L2 zamkniecie dyplomacji');
    await closeAud(page);
    p = await waitFor(page, (a) => a.length >= 1 && !a.some((x) => near(x.dur, DUR.grecyNeg) || near(x.dur, DUR.grecyHello)), 14000);
    assert('L2a zaden utwor cywilizacji nie gra, wraca muzyka tla', p.length >= 1 && !p.some((x) => near(x.dur, DUR.grecyNeg) || near(x.dur, DUR.grecyHello)), durs(p));
    await wait(1500);
    p = await probe(page);
    assert('L2b po 1,5 s nadal tylko muzyka tla (brak dzwieku cywilizacji)', p.length >= 1 && !p.some((x) => near(x.dur, DUR.grecyNeg) || near(x.dur, DUR.grecyHello)), durs(p));

    console.log('L3 ponowne otwarcie -> od przywitania');
    await openCiv(page, 'grecy');
    p = await waitFor(page, (a) => only(a, DUR.grecyHello), 14000);
    assert('L3a znow przywitanie', only(p, DUR.grecyHello), durs(p));
    await closeAud(page);
    await wait(1500);

    // --- L4: Inkowie ---
    console.log('L4 Inkowie: dwa utwory negocjacji');
    await openCiv(page, 'inkowie');
    p = await waitFor(page, (a) => a.length === 1 && (near(a[0].dur, DUR.inkNeg1) || near(a[0].dur, DUR.inkNeg2)), 14000);
    const first = p.length === 1 ? p[0].dur : -1;
    assert('L4a gra jeden z dwoch utworow Inkow (bez przywitania)', first > 0, durs(p));
    await page.evaluate((d) => window.__audioSeekNearEnd(d), first);
    const otherDur = near(first, DUR.inkNeg1) ? DUR.inkNeg2 : DUR.inkNeg1;
    p = await waitFor(page, (a) => only(a, otherDur), 14000);
    assert('L4b po pierwszym gra DRUGI utwor Inkow', only(p, otherDur), durs(p));
    await closeAud(page);
    await wait(1500);

    // --- L5: Sumerowie ---
    console.log('L5 Sumerowie: tylko przywitanie');
    await openCiv(page, 'sumer');
    p = await waitFor(page, (a) => only(a, DUR.sumerHello), 14000);
    assert('L5a gra przywitanie Sumerow', only(p, DUR.sumerHello), durs(p));
    await page.evaluate((d) => window.__audioSeekNearEnd(d), DUR.sumerHello);
    p = await waitFor(page, (a) => only(a, DUR.fallback), 14000);
    if (!only(p, DUR.fallback)) { await wait(6000); console.log('      diag L5b +6s:', JSON.stringify(await probe(page))); }
    assert('L5b po przywitaniu gra dotychczasowy utwor dyplomacji', only(p, DUR.fallback), durs(p));
    await closeAud(page);
    await wait(1500);

    // --- L6: cywilizacja bez utworow ---
    console.log('L6 cywilizacja bez utworow (celtowie)');
    await openCiv(page, 'celtowie');
    p = await waitFor(page, (a) => only(a, DUR.fallback), 14000);
    assert('L6a gra wylacznie dotychczasowy utwor dyplomacji (bez zmian)', only(p, DUR.fallback), durs(p));
    await closeAud(page);
    await wait(1500);

    // --- L7: wyciszona muzyka ---
    console.log('L7 muzyka gry wylaczona');
    await page.evaluate(() => window.__musicEraTestDebug.stopMusic());
    await wait(1200);
    await openCiv(page, 'grecy');
    await wait(2500);
    p = await probe(page);
    assert('L7a przy wylaczonej muzyce dyplomacja nic nie gra', p.length === 0, durs(p));
    await closeAud(page);
    await wait(1000);
    p = await probe(page);
    assert('L7b po zamknieciu nadal cisza', p.length === 0, durs(p));
  } catch (e) {
    fail++;
    console.error(' FAIL wyjatek scenariusza -- ' + (e && e.stack || e));
  }

  assert('L8 zero pageerror / console.error (autoplay dozwolony)', errors.length === 0, errors.slice(0, 5));
  await browser.close();

  // --- L9: autoplay zablokowany ---
  if (process.env.CIVMUSIC_SKIP_AUTOPLAY !== '1') {
    console.log('L9 polityka autoplay "wymaga gestu"');
    const errs2 = [];
    browser = await launch(chromium, ['--autoplay-policy=document-user-activation-required']);
    page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => errs2.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs2.push('console.error: ' + m.text()); });
    await page.addInitScript(INIT);
    try {
      await gotoPlaytestMapa(page);
      await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
      await page.evaluate(() => window.__musicEraTestDebug.startMusic('mapa'));
      await wait(1000);
      await openCiv(page, 'grecy');
      await wait(2500);
      await closeAud(page);
      await wait(800);
      await openCiv(page, 'celtowie');
      await wait(1500);
      await closeAud(page);
      await wait(800);
      assert('L9a odrzucone play() nie rzuca wyjatku ani bledu konsoli', errs2.length === 0, errs2.slice(0, 5));
    } catch (e) {
      fail++;
      console.error(' FAIL L9 wyjatek -- ' + (e && e.stack || e));
    }
    await browser.close();
  }

  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
