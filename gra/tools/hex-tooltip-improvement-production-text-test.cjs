'use strict';
/**
 * hex-tooltip-improvement-production-text-test.cjs -- R-WEB-HEX-TOOLTIP-IMPROVEMENT-PRODUCTION-TEXT-Q1
 *
 * Zgloszenie wlasciciela (2026-11-03): w tooltipie hexu ulepszenie surowcowe ma NAJPIERW podac,
 * ile surowca PRODUKUJE ("+50 Kamień/t"); teksty "magazyn państwa" / "DO MAGAZYNU PAŃSTWA" /
 * "automatycznie" / "bez 👤" sa zbedne.
 *
 * Prawdziwy kod: buildHexContextTooltipHtml() z src/ui/hexContextTooltip.ts (bundlowany esbuildem,
 * jedyny stub: icons/brandAssets -- import vite `?raw`/import.meta.glob), wyrenderowany w Chromium
 * z prawdziwym CSS tooltipu (linie `.civ-side-ctx-dock .cp-*` z src/ui/sidePanelHud.ts).
 *
 * Run: cd gra && node tools/hex-tooltip-improvement-production-text-test.cjs
 * Env: HEX_TOOLTIP_SRC=<plik .ts w src/ui/> (np. stara wersja do dowodu RED),
 *      SHOT_PREFIX=<prefiks> (zapisz zrzuty <prefiks>-desktop.png / -mobile.png).
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));

const TOOLTIP_SRC = process.env.HEX_TOOLTIP_SRC
  ? path.resolve(process.env.HEX_TOOLTIP_SRC)
  : path.join(GRA, 'src', 'ui', 'hexContextTooltip.ts');
const BRAND_STUB = path.join(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
const SIDE_PANEL_SRC = path.join(GRA, 'src', 'ui', 'sidePanelHud.ts');
const TMP = fs.mkdtempSync('/dev/shm/hex-tooltip-prod-text-');

let passed = 0;
let failed = 0;
function ok(cond, msg, detail) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg, detail !== undefined ? JSON.stringify(detail) : ''); }
}

async function bundleTooltip() {
  const entry = path.join(TMP, 'entry.ts');
  const out = path.join(TMP, 'bundle.js');
  fs.writeFileSync(entry, `export { buildHexContextTooltipHtml } from '${TOOLTIP_SRC.replace(/\\/g, '/').replace(/\.ts$/, '')}';\n`);
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: out, absWorkingDir: GRA, logLevel: 'silent',
    plugins: [{ name: 'stub-brand', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); } }],
  });
  return require(out);
}

function ctxCss() {
  const src = fs.readFileSync(SIDE_PANEL_SRC, 'utf8');
  return src.split('\n').filter(l => l.includes('.civ-side-ctx-dock .cp-') || l.includes('.civ-side-ctx-dock .cp-msg')).join('\n');
}

const HEX = {
  coords: { q: 132, r: 82 }, terenBazowy: 'wzgorza', nakladka: 'las', ulepszenie: 'brak',
  ulepszenia: ['kopalnia_cyny', 'tartak', 'oboz_lowiecki', 'kamieniolom'], zloze: 'cyna',
  rzeka: { obecna: false, krawedzie: [] },
};

async function main() {
  const { buildHexContextTooltipHtml } = await bundleTooltip();
  const html = buildHexContextTooltipHtml({ q: 132, r: 82, hex: HEX, esc: s => s, hexWorkedForMagazyn: true, currentEra: 3 });
  const plain = html.replace(/<[^>]+>/g, '');

  console.log('\n[1] teksty (string)');
  ok(!/magazyn państwa/i.test(plain), 'brak "magazyn państwa"');
  ok(!/do magazynu/i.test(plain), 'brak "DO MAGAZYNU"');
  ok(!/automatycznie/.test(plain), 'brak "automatycznie"');
  ok(!/bez 👤/.test(plain), 'brak "bez 👤"');
  ok(/\+50 Kamień\/t/.test(plain), 'jest "+50 Kamień/t"');
  ok(/\+50 Drewno\/t/.test(plain), 'jest "+50 Drewno/t"');
  ok(/\+20 Ruda cyny\/t/.test(plain), 'jest "+20 Ruda cyny/t"');
  ok(/Kamieniołom<\/b> \(postawione\)<br><span[^>]*><span class="cp-yield-ic">/.test(html),
    'Kamieniołom: bezposrednio pod nazwa linia produkcji z ikona surowca');
  ok(/\+20 Drewno\/t · przy 👤/.test(plain), 'plony terenu (drewno przy 👤) nietkniete');

  console.log('\n[2] prawdziwy render w Chromium + kolejnosc w DOM');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
  try {
    for (const [name, width] of [['desktop', 340], ['mobile', 320]]) {
      const page = await browser.newPage({ viewport: { width: width + 40, height: 900 } });
      await page.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#1a1610;color:#e8e0c8;font:13px system-ui}
.civ-side-ctx-dock{width:${width}px;padding:8px;box-sizing:border-box}${ctxCss()}</style>
<div class="civ-side-ctx-dock" id="dock">${html}</div>`);
      const r = await page.evaluate(() => {
        const dock = document.getElementById('dock');
        const subs = [...dock.querySelectorAll('.cp-sub')];
        const built = subs.find(e => e.textContent.includes('Ulepszenia postawione'));
        const text = built.textContent;
        const prod = [...built.querySelectorAll('.cp-prod-line')].map(e => ({
          t: e.textContent.trim(), hasIcon: !!e.querySelector('.cp-yield-ic'),
          // pozycja w tekscie bloku: produkcja PRZED najblizszym "plony miasta"
          before: (() => { const i = text.indexOf(e.textContent); const j = text.indexOf('plony miasta', i); return i >= 0 && j > i; })(),
        }));
        const order = ['Kopalnia cyny', 'Tartak', 'Kamieniołom'].map(n => {
          const i = text.indexOf(n); const p = text.indexOf('/t', i); const y = text.indexOf('plony miasta', i);
          return { n, prodBeforeYields: i >= 0 && p > i && p < y };
        });
        return { prod, order, scrollW: dock.scrollWidth, clientW: dock.clientWidth, bodySW: document.documentElement.scrollWidth, bodyCW: document.documentElement.clientWidth, fullText: dock.textContent };
      });
      ok(r.prod.length === 3 && r.prod.every(p => p.hasIcon), `[${name}] 3 linie produkcji z ikona`, r.prod);
      ok(r.prod.every(p => p.before), `[${name}] kazda produkcja PRZED "plony miasta" w DOM`, r.prod);
      ok(r.order.every(o => o.prodBeforeYields), `[${name}] kolejnosc nazwa -> produkcja -> plony`, r.order);
      ok(r.scrollW <= r.clientW && r.bodySW <= r.bodyCW, `[${name}] brak poziomego przewijania (${r.scrollW}/${r.clientW})`);
      ok(!/magazyn/i.test(r.fullText.replace(/Surowce z terenu/g, '')), `[${name}] renderowany tekst bez "magazyn"`);
      if (process.env.SHOT_PREFIX) {
        const f = `${process.env.SHOT_PREFIX}-${name}.png`;
        await page.locator('#dock').screenshot({ path: f });
        ok(fs.statSync(f).size <= 1024 * 1024, `[${name}] zrzut ${f} <= 1 MB`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error('ERROR', e); failed++; }).finally(() => {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
});
