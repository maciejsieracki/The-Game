'use strict';
/**
 * civ-welcome-screen-brand-live-test.cjs -- R-WEB-UI-WELCOME-SCREEN-BRAND-BOOK-RESTYLE-Q1 (runda 1, Operator).
 *
 * Żywa gra w headless Chromium (bundle Vite, ?civTest=1&civSeed=4242): ekran „Odkryłeś nową cywilizację”
 * otwiera się sam przy pierwszym kontakcie. Test robi zrzuty ekranu w trzech szerokościach
 * (1324x1300, 1024x640, 480x800; DSF 1) i sprawdza asercje DOM na computed style:
 *   (i)   font-family karty nie jest monospace, a tytuł zawiera Georgia;
 *   (ii)  tło karty ciemne (luminancja względna < 0.2);
 *   (iii) kolor tytułu = złoty token (rgb(232, 216, 138));
 *   (iv)  brak prefers-color-scheme w CSS ekranu;
 *   (v)   oba przyciski mają obramowanie 2px w złocie;
 *   (vi)  zero pageerror w przebiegu.
 *
 * Usage (z gra/): node tools/civ-welcome-screen-brand-live-test.cjs <buildDir> <evidenceDir> <przed|po>
 * Wynik: exit 0 = wszystkie asercje PASS; exit 1 = FAIL asercji; exit 2 = brak ekranu / wyjątek (NIE ZMIERZONO).
 * Mutacja: build z wersją PRZED (db29c24d) ma dać FAIL na (i),(ii),(iii),(iv),(v).
 */
const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
const BUILD = path.resolve(process.argv[2] || '');
const EVIDENCE = path.resolve(process.argv[3] || path.join(BUILD, 'evidence'));
const LABEL = process.argv[4] || 'po';
const SEED = 4242;
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const SIZES = [[1324, 1300], [1024, 640], [480, 800]];
const GOLD = 'rgb(232, 216, 138)';
const ROOT_SEL = '#civ-welcome-screen-root';

const checks = [];
let fails = 0;
function check(ok, what, detail) {
  checks.push({ ok: !!ok, what, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${what}${detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''}`);
  if (!ok) fails++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Luminancja względna sRGB z 'rgb(r, g, b)' / 'rgba(...)'. */
function luminance(rgb) {
  const m = String(rgb).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (!m) return NaN;
  const c = [1, 2, 3].map((i) => {
    const v = Number(m[i]) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function main() {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const { chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  const browser = await launchBrowser(chromium);
  const [w0, h0] = SIZES[0];
  const page = await browser.newPage({ viewport: { width: w0, height: h0 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e && e.message).slice(0, 200)));

  await page.goto('file://' + path.join(BUILD, 'index.html') + '?civTest=1&civSeed=' + SEED,
    { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => !!window.__nnsMeasureDebug && !!window.__aiTradeWiringTestDebug && !!window.__eraTestDebug,
    undefined, { timeout: 180000 },
  );
  await page.evaluate((sd) => window.__nnsMeasureDebug.startGame({ seed: sd }), SEED);
  await page.waitForFunction(() => {
    try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; }
  }, undefined, { timeout: 180000 });
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(
      (el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, undefined, { timeout: 600000, polling: 500 });
  await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());

  // Ekran powitalny otwiera się sam przy pierwszym kontakcie (nie zamykamy go w tym teście).
  const card = page.locator(ROOT_SEL + ' .cww-card');
  try {
    await card.waitFor({ state: 'visible', timeout: 120000 });
  } catch (e) {
    console.error('NIE ZMIERZONO: ekran powitalny nie pojawił się w 120 s (brak pierwszego kontaktu w tym przebiegu)');
    await browser.close();
    process.exit(2);
  }
  await wait(600);

  for (const [w, h] of SIZES) {
    const tag = `${w}x${h}`;
    await page.setViewportSize({ width: w, height: h });
    await wait(500);
    const shot = path.join(EVIDENCE, `zrzut-${LABEL}-${tag}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    const bytes = fs.statSync(shot).size;
    check(bytes <= 1024 * 1024, `[${tag}] zrzut ≤ 1 MB`, { bytes });

    const info = await page.evaluate((rootSel) => {
      const root = document.querySelector(rootSel);
      if (!root) return null;
      const cs = (el) => getComputedStyle(el);
      const cardEl = root.querySelector('.cww-card');
      const nameEl = root.querySelector('.cww-name');
      const btns = Array.from(root.querySelectorAll('.cww-btn'));
      const styleTxt = Array.from(document.querySelectorAll('style'))
        .filter((s) => s.textContent && s.textContent.includes('civ-welcome-screen-root'))
        .map((s) => s.textContent).join('\n');
      return {
        cardFont: cs(cardEl).fontFamily,
        cardBg: cs(cardEl).backgroundColor,
        nameFont: cs(nameEl).fontFamily,
        nameColor: cs(nameEl).color,
        btns: btns.map((b) => ({
          text: b.textContent.trim(),
          bw: cs(b).borderTopWidth,
          bc: cs(b).borderTopColor,
        })),
        prefersScheme: /prefers-color-scheme/.test(styleTxt),
        cardH: Math.round(cardEl.getBoundingClientRect().height),
        cardW: Math.round(cardEl.getBoundingClientRect().width),
        docW: document.documentElement.scrollWidth,
        viewW: window.innerWidth,
      };
    }, ROOT_SEL);
    if (!info) {
      check(false, `[${tag}] ekran powitalny obecny w DOM`);
      continue;
    }
    check(!/mono|courier|consolas/i.test(info.cardFont) && /Georgia/.test(info.nameFont),
      `[${tag}] (i) karta nie monospace, tytuł Georgia`, { cardFont: info.cardFont, nameFont: info.nameFont });
    const lum = luminance(info.cardBg);
    check(lum < 0.2, `[${tag}] (ii) tło karty ciemne (lum < 0.2)`, { cardBg: info.cardBg, lum: Number(lum.toFixed(4)) });
    check(info.nameColor === GOLD, `[${tag}] (iii) kolor tytułu = złoto`, { nameColor: info.nameColor });
    check(!info.prefersScheme, `[${tag}] (iv) brak prefers-color-scheme w CSS ekranu`, { prefersScheme: info.prefersScheme });
    const outlineOk = info.btns.length === 2 && info.btns.every((b) => b.bw === '2px' && b.bc === GOLD);
    check(outlineOk, `[${tag}] (v) przyciski: obramowanie 2px złote`, info.btns);
    check(info.docW <= info.viewW, `[${tag}] brak poziomego przewijania strony`, { docW: info.docW, viewW: info.viewW });
    console.log(`  [${tag}] karta ${info.cardW}x${info.cardH}px`);
  }

  check(errors.length === 0, '(vi) zero pageerror w przebiegu', errors.slice(0, 5));
  await browser.close();
  const out = { label: LABEL, fails, checks };
  fs.writeFileSync(path.join(EVIDENCE, `wyniki-${LABEL}.json`), JSON.stringify(out, null, 2));
  console.log(fails === 0 ? 'EXIT 0 (wszystkie asercje PASS)' : `EXIT 1 (asercje FAIL: ${fails})`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : e);
  process.exit(2);
});
