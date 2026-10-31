'use strict';

/**
 * R-WEB-NEWGAME-MENU-REORDER-Q1 — geometria układu kroku 4 (ustawienia nowej gry) w realnym Chromium.
 *
 * Sprawdza przy zoomie 100% i 150% oraz 3 rozmiarach okna (1280×800, 1600×1000, 1920×1080):
 *  - 12 kart głównej siatki (`.sett-grid .srow`) w dwóch kolumnach, wiersze wyrównane,
 *  - każda karta da się przewinąć w obszarze `.content` i jest w nim w całości widoczna,
 *  - karty nie nachodzą na siebie ani na panel „Twój start" (`.start-preview`),
 *  - przycisk „Dalej" (`.nav .next`) osiągalny i nieprzykryty,
 *  - etykiety kart nie są ucinane w poziomie,
 *  - zrzuty ekranu do katalogu evidence runu (ustawienia oraz okno „Zaawansowane opcje").
 *
 * Zoom 150% jest emulowany jako viewport w px CSS = okno / 1.5 przy deviceScaleFactor 1.5
 * (ten sam layout CSS co zoom przeglądarki).
 *
 * Run from gra/:  node tools/newgame-menu-reorder-layout-test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const RUN_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-NEWGAME-MENU-REORDER-Q1');
const EVIDENCE = path.join(RUN_DIR, 'evidence');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'newgame-menu-reorder-'));

const VIEWPORTS = [
  { w: 1280, h: 800, zoom: 1 },
  { w: 1600, h: 1000, zoom: 1 },
  { w: 1920, h: 1080, zoom: 1 },
  { w: 1280, h: 800, zoom: 1.5 },
  { w: 1600, h: 1000, zoom: 1.5 },
  { w: 1920, h: 1080, zoom: 1.5 },
];

async function buildBundle(bundle) {
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, `
import { showNewGameFlow } from ${JSON.stringify(path.join(GRA, 'src/ui/newGameFlow.ts'))};
import { DEFAULT_PLAYER_CIV_ID, DEFAULT_START_EPOCH_ID } from ${JSON.stringify(path.join(GRA, 'src/map/newGameMapDefaults.ts'))};
const civ = { id: DEFAULT_PLAYER_CIV_ID, name: 'Grecy', epokiStartowe: [DEFAULT_START_EPOCH_ID], epokaWejscia: DEFAULT_START_EPOCH_ID };
const config = { getCivs: () => [civ], onStart: p => { window.__params = p; } };
window.__openWizard = () => showNewGameFlow(config);
window.__openWizard();
`);
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: bundle, absWorkingDir: GRA, logLevel: 'silent',
    plugins: [{ name: 'browser-asset-stubs', setup(build) {
      build.onResolve({ filter: /data\/loader$/ }, () => ({ path: 'loader', namespace: 'stub' }));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, args => {
        if (args.path === 'loader') return { contents: 'export const loadGameData=()=>null;', loader: 'js' };
        return null;
      });
      // Ikony SVG (icons/brandAssets) idą z realnego modułu — zrzuty pokazują prawdziwy wygląd kart
      // (ustalenie Evaluatora: stuby ikon w evidence). Tokeny marki i tooltip idą z realnych modułów.
      // icons/brandAssets.ts używa import.meta.glob('./brand/**/*.svg', { query: '?raw', eager: true }) —
      // esbuild tego nie zna, więc wstawiamy ten sam słownik ścieżka→treść SVG odczytany z dysku.
      build.onLoad({ filter: /icons[\\/]brandAssets\.ts$/ }, args => {
        const dir = path.dirname(args.path);
        const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
          const p = path.join(d, e.name);
          return e.isDirectory() ? walk(p) : (e.name.endsWith('.svg') ? [p] : []);
        });
        const entries = walk(path.join(dir, 'brand')).map(f => {
          const key = './' + path.relative(dir, f).split(path.sep).join('/');
          return JSON.stringify(key) + ': ' + JSON.stringify(fs.readFileSync(f, 'utf8'));
        });
        let src = fs.readFileSync(args.path, 'utf8');
        const before = src;
        src = src.replace(/import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg'[\s\S]*?\}\)/, '({' + entries.join(',') + '})');
        if (src === before) throw new Error('brandAssets: import.meta.glob pattern not found');
        return { contents: src, loader: 'ts', resolveDir: dir };
      });
      // Importy `*.svg?raw` (ikony marki): zwykły tekst pliku, jak w bundlerze Vite.
      build.onResolve({ filter: /\?raw$/ }, args => ({
        path: path.resolve(path.dirname(args.importer), args.path.replace(/\?raw$/, '')), namespace: 'raw-file',
      }));
      build.onLoad({ filter: /.*/, namespace: 'raw-file' }, args => ({
        contents: 'export default ' + JSON.stringify(fs.readFileSync(args.path, 'utf8')) + ';', loader: 'js',
      }));
      build.onResolve({ filter: /hero-intro\.png\?url$/ }, () => ({ path: 'hero', namespace: 'asset-stub' }));
      build.onLoad({ filter: /.*/, namespace: 'asset-stub' }, () => ({ contents: 'export default "";', loader: 'js' }));
    } }],
  });
}

/** Prostokąt elementu w układzie viewportu (po aktualnym przewinięciu). */
const RECT_FN = `(e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; }`;

async function main() {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const bundle = path.join(TMP, 'bundle.js');
  await buildBundle(bundle);

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const launchArgs = { headless: true, args: ['--no-sandbox'] };
  const fallback = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  let browser;
  try { browser = await chromium.launch(launchArgs); }
  catch (_error) { browser = await chromium.launch({ ...launchArgs, executablePath: fallback }); }

  try {
    for (const vp of VIEWPORTS) {
      const tag = `${vp.w}x${vp.h}-z${Math.round(vp.zoom * 100)}`;
      const ctx = await browser.newContext({
        viewport: { width: Math.round(vp.w / vp.zoom), height: Math.round(vp.h / vp.zoom) },
        deviceScaleFactor: vp.zoom,
      });
      const page = await ctx.newPage();
      await page.goto(origin, { waitUntil: 'load' });
      await page.addScriptTag({ path: bundle });
      await page.locator('.civ-newgame .cta-hero').click();
      await page.locator('.civ-newgame .nav .next').click();
      await page.locator('.civ-newgame .nav .next').click();
      await page.waitForSelector('.civ-newgame .sett-grid .srow');

      const cardsLoc = page.locator('.civ-newgame .sett-grid .srow');
      assert.strictEqual(await cardsLoc.count(), 12, `${tag}: 12 cards in main grid`);

      // Stan początkowy: układ kolumn, rozłączność kart, panel „Twój start", etykiety.
      const base = await page.evaluate((rectSrc) => {
        const rect = eval(rectSrc);
        const cardEls = Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow'));
        const preview = document.querySelector('.civ-newgame .start-preview');
        return {
          cards: cardEls.map(rect),
          labels: cardEls.map(e => { const sl = e.querySelector('.sl'); return { text: (sl.textContent || '').trim(), clipped: sl.scrollWidth > sl.clientWidth + 1 }; }),
          preview: preview ? rect(preview) : null,
        };
      }, RECT_FN);

      for (let r = 0; r < 6; r++) {
        const L = base.cards[2 * r], R = base.cards[2 * r + 1];
        assert(Math.abs(L.y - R.y) < 1, `${tag}: row ${r + 1} aligned`);
        assert(L.x < R.x, `${tag}: row ${r + 1} left before right`);
      }
      const overlap = (a, b) => a.x < b.r - 0.5 && b.x < a.r - 0.5 && a.y < b.b - 0.5 && b.y < a.b - 0.5;
      base.cards.forEach((c, i) => {
        for (let j = i + 1; j < base.cards.length; j++) assert(!overlap(c, base.cards[j]), `${tag}: cards ${i} and ${j} do not overlap`);
        if (base.preview) assert(!overlap(c, base.preview), `${tag}: card ${i} does not cover start preview`);
      });
      base.labels.forEach((l, i) => assert(!l.clipped, `${tag}: label ${i} "${l.text}" not clipped`));

      // Każda karta przewijana w obszarze `.content` jest w nim w całości widoczna i nie wchodzi na nawigację.
      for (let i = 0; i < 12; i++) {
        await cardsLoc.nth(i).scrollIntoViewIfNeeded();
        const g = await page.evaluate(({ rectSrc, idx }) => {
          const rect = eval(rectSrc);
          const content = document.querySelector('.civ-newgame .content');
          const nav = document.querySelector('.civ-newgame .nav');
          const card = document.querySelectorAll('.civ-newgame .sett-grid .srow')[idx];
          return { content: rect(content), nav: rect(nav), card: rect(card), next: rect(document.querySelector('.civ-newgame .nav .next')) };
        }, { rectSrc: RECT_FN, idx: i });
        assert(g.card.y >= g.content.y - 0.5 && g.card.b <= g.content.b + 0.5, `${tag}: card ${i} fully visible inside scroll area`);
        assert(g.content.b <= g.nav.y + 0.5, `${tag}: scroll area does not run under nav`);
      }

      // „Dalej" osiągalne i nieprzykryte.
      const nextBtn = page.locator('.civ-newgame .nav .next');
      await nextBtn.scrollIntoViewIfNeeded();
      const reachable = await page.evaluate(() => {
        const nx = document.querySelector('.civ-newgame .nav .next');
        const r = nx.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { ok: !!top && (top === nx || nx.contains(top)), inside: r.bottom <= window.innerHeight + 0.5 && r.right <= window.innerWidth + 0.5 };
      });
      assert(reachable.ok, `${tag}: "Dalej" not covered`);
      assert(reachable.inside, `${tag}: "Dalej" inside viewport`);

      // Zrzut: pierwsze ujęcie (góra obszaru przewijania) i ujęcie końcowe (dół).
      await page.evaluate(() => { document.querySelector('.civ-newgame .content').scrollTop = 0; });
      await page.screenshot({ path: path.join(EVIDENCE, `ustawienia-${tag}-gora.png`) });
      await page.evaluate(() => { const c = document.querySelector('.civ-newgame .content'); c.scrollTop = c.scrollHeight; });
      await page.screenshot({ path: path.join(EVIDENCE, `ustawienia-${tag}-dol.png`) });
      console.log(`  OK  ${tag}: 12 cards, 2 columns, all visible in scroll area, no overlap, Dalej reachable`);

      if (vp.zoom === 1 && vp.w === 1600) {
        await page.locator('.civ-newgame .btn-adv').click();
        await page.waitForSelector('.civ-newgame .adv-overlay.open');
        await page.screenshot({ path: path.join(EVIDENCE, `zaawansowane-${tag}.png`) });
        const advCount = await page.locator('.civ-newgame .adv-modal .adv-row').count();
        assert.strictEqual(advCount, 13, `${tag}: advanced window has 13 rows`);
        console.log(`  OK  ${tag}: advanced window 13 rows, screenshot saved`);
      }
      await ctx.close();
    }
    console.log(`newgame-menu-reorder-layout-test: PASS — ${VIEWPORTS.length} viewport/zoom configurations; screenshots in ${EVIDENCE}`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(TMP, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
