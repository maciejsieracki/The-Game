'use strict';
/**
 * hex-tooltip-resources-line-dedup-test.cjs -- R-WEB-TOOLTIP-RESOURCES-LINE-DEDUP-Q1
 *
 * Wada: linia "Surowce / zasoby" tooltipu heksu (collectResourceLabels) dublowala surowiec,
 * np. zloze konia ze Stadnina -> "Kon · Koń" (etykieta zlozia "Kon" z fallbacku capitalize +
 * etykieta odblokowania "Koń"). Dedup po lowercase nie lapal roznicy diakrytyki.
 * Prawdziwy kod: buildHexContextTooltipHtml() (esbuild, stub icons/brandAssets), render w Chromium.
 *
 * Run: cd gra && node tools/hex-tooltip-resources-line-dedup-test.cjs
 * Env: RESOURCE_ACCESS_SRC=<plik .ts> (stara wersja do dowodu RED), PRINT_ONLY=1 (tylko pomiar).
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));

const TOOLTIP_SRC = path.join(GRA, 'src', 'ui', 'hexContextTooltip.ts');
const BRAND_STUB = path.join(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
const TMP = fs.mkdtempSync('/dev/shm/hex-tooltip-reslinededup-');
const PRINT_ONLY = !!process.env.PRINT_ONLY;

let passed = 0;
let failed = 0;
function ok(cond, msg, detail) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg, detail !== undefined ? JSON.stringify(detail) : ''); }
}

async function bundle() {
  const entry = path.join(TMP, 'entry.ts');
  const out = path.join(TMP, 'bundle.js');
  fs.writeFileSync(entry, `export { buildHexContextTooltipHtml } from '${TOOLTIP_SRC.replace(/\.ts$/, '')}';\n`);
  const plugins = [{ name: 'stub-brand', setup(b) {
    b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
    if (process.env.RESOURCE_ACCESS_SRC) {
      b.onResolve({ filter: /game\/resource-access$/ }, () => ({ path: path.resolve(process.env.RESOURCE_ACCESS_SRC) }));
    }
  } }];
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: out, absWorkingDir: GRA, logLevel: 'silent', plugins,
  });
  return require(out);
}

const RIVER = { obecna: false, krawedzie: [] };
const CASES = [
  { key: 'zloze konia + Stadnina', hex: { terenBazowy: 'rownina', nakladka: 'zloze_konia', ulepszenia: ['stadnina'], zloze: 'kon' }, expect: ['Koń'] },
  { key: 'nakladka konia + Stadnina', hex: { terenBazowy: 'rownina', nakladka: 'zloze_konia', ulepszenia: ['stadnina'] }, expect: ['Koń'] },
  { key: 'zloze konia bez ulepszenia', hex: { terenBazowy: 'rownina', nakladka: 'zloze_konia', ulepszenia: [], zloze: 'kon' }, expect: ['Koń'] },
  { key: 'kopalnia miedzi', hex: { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kopalnia_miedzi'], zloze: 'miedz' }, expect: null },
  { key: 'kopalnia zelaza', hex: { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kopalnia_zelaza'], zloze: 'zelazo' }, expect: null },
  { key: 'kopalnia cyny', hex: { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kopalnia_cyny'], zloze: 'cyna' }, expect: null },
  { key: 'kamieniolom', hex: { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kamieniolom'] }, expect: ['Kamień'] },
  { key: 'tartak', hex: { terenBazowy: 'rownina', nakladka: 'las', ulepszenia: ['tartak'] }, expect: null },
];

async function main() {
  const M = await bundle();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
  try {
    const page = await browser.newPage();
    for (const c of CASES) {
      const full = { coords: { q: 1, r: 1 }, ulepszenie: 'brak', rzeka: RIVER, ...c.hex };
      const html = M.buildHexContextTooltipHtml({ q: 1, r: 1, hex: full, esc: s => s, hexWorkedForMagazyn: true, currentEra: 3 });
      await page.setContent(`<!doctype html><meta charset="utf-8"><div id="dock">${html}</div>`);
      const line = await page.evaluate(() => {
        const s = [...document.querySelectorAll('#dock .cp-sub')].find(e => e.textContent.includes('Surowce / zasoby'));
        return s ? s.textContent : null;
      });
      console.log(`LINIA [${c.key}]: ${JSON.stringify(line)}`);
      if (PRINT_ONLY) continue;
      ok(line !== null, `${c.key}: linia Surowce / zasoby w DOM`);
      if (line === null) continue;
      const items = line.replace(/^Surowce \/ zasoby:?\s*/, '').split('·').map(s => s.trim()).filter(Boolean);
      const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').toLowerCase();
      // Dubel = ta sama etykieta (bez diakrytyk), etykieta ogolna + doprecyzowana ("Ruda"/"Ruda miedzi"),
      // albo "Las (drewno)" obok "Drewno".
      const dup = items.filter((x, i) => items.some((y, j) => j !== i && (
        norm(y) === norm(x) ? j < i
          : norm(y).startsWith(norm(x) + ' ') || (norm(x) === 'las (drewno)' && norm(y) === 'drewno'))));
      ok(dup.length === 0, `${c.key}: brak dubli w linii (${JSON.stringify(items)})`, dup);
      if (c.expect) for (const e of c.expect) ok(items.includes(e), `${c.key}: zawiera "${e}"`, items);
      ok(!items.includes('Kon'), `${c.key}: brak niepolskiej etykiety "Kon"`, items);
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error('ERROR', e); failed++; }).finally(() => {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
});
