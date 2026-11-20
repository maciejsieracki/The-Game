'use strict';
/**
 * city-founding-limit-greyed-live-test.cjs
 *
 * R-WEB-UI-CITY-FOUNDING-LIMIT-GREYED-OUT-Q1 — dowód w PRAWDZIWYM Chromium (nie jsdom):
 * panel budowy (`createBuildModeHud` z src/ui/buildModeHud.ts) zamontowany w przeglądarce ze
 * stanem limitu sterowanym z testu. Konfiguracja HUD odtwarza kontrakt z main.ts:
 *   - getFoundCityLimitState  -> cityFoundingLimitState (stan limitu gracza)
 *   - getFoundCityLockHint    -> limit ma pierwszeństwo nad brakiem zasobów
 *
 * Sprawdza (realny DOM, realne style, realne kliknięcia):
 *   A  limit osiągnięty: przycisk „Załóż miasto” ma klasę limit, aria-disabled, meta „limit X/Y”,
 *      mały napis „osiągnięto limit”, wyszarzenie (opacity < 0.5); klik NIE wchodzi w tryb
 *      (onSelectFoundCity = 0) i flash-banner niesie komunikat o limicie
 *   B  limit osiągnięty + brak zasobów: komunikat o limicie wygrywa (nie „brak Pracy”)
 *   C  limit NIE osiągnięty: brak klasy limit i napisu; brak zasobów -> stary stan „locked” bez zmian;
 *      klik przy braku zasobów nie wchodzi w tryb; przy zasobach klik wchodzi w tryb
 *   D  podniesienie limitu (awans epoki / utrata miasta) + update() -> przycisk znów aktywny
 *
 * Usage (z gra/): node tools/city-founding-limit-greyed-live-test.cjs [--shot out.png]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[city-founding-limit-greyed-live-test] playwright missing');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'build-mode-lock-tip-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'build-mode-lock-tip-scienceOwlIcon-stub.ts');
const FALLBACK_CHROME = (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');

const shotArgIdx = process.argv.indexOf('--shot');
const SHOT_PATH = shotArgIdx !== -1 ? process.argv[shotArgIdx + 1] : null;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  } catch (e) {
    console.log('[city-founding-limit-greyed-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'city-limit-live-'));
  const entry = path.join(temp, 'entry.ts');
  const outfile = path.join(temp, 'bundle.js');
  fs.writeFileSync(entry, [
    `import { createBuildModeHud } from ${JSON.stringify(SRC + '/ui/buildModeHud.ts')};`,
    'window.__createBuildModeHud = createBuildModeHud;',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' }, logLevel: 'silent',
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
  });
  const bundleJs = fs.readFileSync(outfile, 'utf8');

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.setContent(
    '<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:100%;height:100%;background:#0a1020;}</style>',
  );
  await page.addScriptTag({ content: bundleJs });

  // Konfiguracja HUD: stan limitu i zasobów sterowane z testu; kontrakt priorytetu jak w main.ts.
  await page.evaluate(() => {
    window.__st = { count: 10, limit: 10, affordanceFail: false, calls: 0 };
    const limitOf = () => {
      const s = window.__st;
      return { count: s.count, limit: s.limit, exhausted: s.count >= s.limit };
    };
    window.__hud = window.__createBuildModeHud({
      listTypes: () => [],
      getActiveKey: () => null,
      onSelectType: () => {},
      onExit: () => {},
      isOpen: () => true,
      isFoundCityOnly: () => false,
      getPracaPool: () => 999,
      canFoundCity: () => true,
      isFoundCityActive: () => false,
      onSelectFoundCity: () => { window.__st.calls += 1; },
      getFoundCityCostLabel: () => '20 P · 1 👤',
      getFoundCityLimitState: () => limitOf(),
      getFoundCityLockHint: () => {
        const lim = limitOf();
        if (lim.exhausted) return `Osiągnięto limit miast (${lim.count}/${lim.limit} w tej epoce)`;
        return window.__st.affordanceFail ? 'Za mało Pracy: brakuje 20 P' : null;
      },
    });
    document.body.appendChild(window.__hud.el);
    document.body.appendChild(window.__hud.bannerEl);
    window.__hud.el.classList.add('open');
    window.__hud.update();
  });

  const item = () => page.$('[data-found-city]');
  const readItem = () => page.evaluate(() => {
    const it = document.querySelector('[data-found-city]');
    if (!it) return null;
    const note = document.querySelector('[data-found-city-limit-note]');
    return {
      cls: it.className,
      ariaDisabled: it.getAttribute('aria-disabled'),
      lockHint: it.getAttribute('data-lock-hint'),
      meta: (it.querySelector('.meta') || {}).textContent || '',
      opacity: parseFloat(getComputedStyle(it).opacity),
      note: note ? note.textContent : null,
      banner: (document.querySelector('#civ-build-banner-text') || {}).textContent || '',
    };
  });
  const clickItem = async () => {
    const el = await item();
    await el.click();
    await page.waitForTimeout(60);
  };
  const rerender = () => page.evaluate(() => window.__hud.update());

  // A — limit osiągnięty (10/10), zasoby OK.
  let s = await readItem();
  check('A: przycisk „Załóż miasto” istnieje w panelu', !!s);
  check('A: limit osiągnięty -> klasa limit na pozycji', s && / limit/.test(' ' + s.cls + ' '), s && s.cls);
  check('A: aria-disabled="true" przy limicie', s && s.ariaDisabled === 'true', s && s.ariaDisabled);
  check('A: meta pokazuje „limit 10/10”', s && s.meta === 'limit 10/10', s && s.meta);
  check('A: mały napis „osiągnięto limit” przy nagłówku Miasto', s && s.note === 'osiągnięto limit', s && s.note);
  check('A: wizualnie wyszarzony (opacity < 0.5)', s && s.opacity < 0.5, s && s.opacity);
  await clickItem();
  let calls = await page.evaluate(() => window.__st.calls);
  check('A: klik przy limicie NIE wchodzi w tryb zakładania (onSelectFoundCity = 0)', calls === 0, { calls });
  s = await readItem();
  check('A: banner niesie komunikat o limicie „Osiągnięto limit miast (10/10 w tej epoce)”',
    s && s.banner.includes('Osiągnięto limit miast (10/10 w tej epoce)'), s && s.banner);

  // B — limit + brak zasobów: pierwszeństwo ma limit.
  await page.evaluate(() => { window.__st.affordanceFail = true; });
  await rerender();
  s = await readItem();
  check('B: limit + brak zasobów -> podpowiedź to komunikat o limicie',
    s && s.lockHint === 'Osiągnięto limit miast (10/10 w tej epoce)', s && s.lockHint);
  check('B: limit + brak zasobów -> nadal wyszarzony', s && /limit/.test(' ' + s.cls + ' '), s && s.cls);

  // C — limit NIE osiągnięty (9/10), brak zasobów -> stary stan „locked” bez napisu limitu.
  await page.evaluate(() => { window.__st.count = 9; });
  await rerender();
  s = await readItem();
  check('C: poniżej limitu brak klasy limit', s && !/ limit/.test(' ' + s.cls + ' '), s && s.cls);
  check('C: poniżej limitu brak napisu „osiągnięto limit”', s && s.note === null, s && s.note);
  check('C: poniżej limitu brak aria-disabled', s && s.ariaDisabled === null, s && s.ariaDisabled);
  check('C: poniżej limitu brak zasobów -> stan locked (stary) z podpowiedzią o Pracy',
    s && /locked/.test(s.cls) && s.lockHint === 'Za mało Pracy: brakuje 20 P', s && [s.cls, s.lockHint]);
  check('C: poniżej limitu meta pokazuje koszt (nie „limit”)', s && s.meta === '20 P · 1 👤', s && s.meta);
  await clickItem();
  calls = await page.evaluate(() => window.__st.calls);
  check('C: klik przy braku zasobów nie wchodzi w tryb', calls === 0, { calls });

  // C2 — poniżej limitu, zasoby OK -> klik wchodzi w tryb.
  await page.evaluate(() => { window.__st.affordanceFail = false; });
  await rerender();
  s = await readItem();
  check('C2: poniżej limitu, zasoby OK -> brak locked', s && !/locked/.test(s.cls), s && s.cls);
  await clickItem();
  calls = await page.evaluate(() => window.__st.calls);
  check('C2: klik przy dostępnym założeniu wchodzi w tryb (onSelectFoundCity = 1)', calls === 1, { calls });

  // D — podniesienie limitu (awans epoki) + update -> znów aktywny, ale bez wyjścia z karty limitu.
  await page.evaluate(() => { window.__st.count = 10; window.__st.limit = 15; });
  await rerender();
  s = await readItem();
  check('D: po podniesieniu limitu (10/15) brak klasy limit', s && !/ limit/.test(' ' + s.cls + ' '), s && s.cls);
  check('D: po podniesieniu limitu brak napisu limitu', s && s.note === null, s && s.note);

  // E — kolejny realny przypadek: limit 15/15 po awansie zostaje wyszarzony.
  await page.evaluate(() => { window.__st.count = 15; });
  await rerender();
  s = await readItem();
  check('E: 15/15 -> znów wyszarzony z meta „limit 15/15”', s && s.meta === 'limit 15/15' && / limit/.test(' ' + s.cls + ' '), s && [s.cls, s.meta]);

  check('brak błędów JS na stronie', pageErrors.length === 0, pageErrors);

  if (SHOT_PATH) {
    await page.evaluate(() => { window.__st.count = 10; window.__st.limit = 10; });
    await rerender();
    await page.screenshot({ path: SHOT_PATH, clip: { x: 0, y: 0, width: 420, height: 360 } });
    console.log('zrzut: ' + SHOT_PATH);
  }

  await browser.close();
  console.log(`\nWynik live: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
