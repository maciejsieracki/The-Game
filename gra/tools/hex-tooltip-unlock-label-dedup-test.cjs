'use strict';
/**
 * hex-tooltip-unlock-label-dedup-test.cjs -- R-WEB-HEX-TOOLTIP-UNLOCK-LABEL-DEDUP-Q1
 *
 * Wada: w tooltipie hexu surowiec ulepszenia byl wymieniony dwa razy -- w wierszu produkcji
 * ("+113 Drewno/t") i w etykiecie odblokowania ("... · Drewno" / "odblok. Kamień").
 * ZAŁOŻENIE: etykieta odblokowania zostaje tylko gdy niesie dodatkową informację (inny surowiec
 * niż w produkcji albo brak wiersza produkcji, np. hodowla bydła).
 *
 * Prawdziwy kod: buildHexContextTooltipHtml() (bundlowany esbuildem, stub: icons/brandAssets),
 * render w Chromium z prawdziwym CSS tooltipu; liczymy wystąpienia nazwy surowca w DOM.
 *
 * Run: cd gra && node tools/hex-tooltip-unlock-label-dedup-test.cjs
 * Env: HEX_TOOLTIP_SRC=<plik .ts> (np. stara wersja do dowodu RED).
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
const TMP = fs.mkdtempSync('/dev/shm/hex-tooltip-unlock-dedup-');

let passed = 0;
let failed = 0;
function ok(cond, msg, detail) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg, detail !== undefined ? JSON.stringify(detail) : ''); }
}

async function bundleTooltip() {
  const entry = path.join(TMP, 'entry.ts');
  const out = path.join(TMP, 'bundle.js');
  fs.writeFileSync(entry,
    `export { buildHexContextTooltipHtml } from '${TOOLTIP_SRC.replace(/\\/g, '/').replace(/\.ts$/, '')}';\n`
    + `export { labelsForImprovementUnlock } from '${GRA.replace(/\\/g, '/')}/src/game/resource-access';\n`);
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: out, absWorkingDir: GRA, logLevel: 'silent',
    plugins: [{ name: 'stub-brand', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); } }],
  });
  return require(out);
}

function ctxCss() {
  const src = fs.readFileSync(SIDE_PANEL_SRC, 'utf8');
  return src.split('\n').filter(l => l.includes('.civ-side-ctx-dock .cp-')).join('\n');
}

const RIVER = { obecna: false, krawedzie: [] };
// key -> hex; `label` = nazwa surowca w wierszu produkcji (== etykieta odblokowania).
const CASES = [
  { key: 'tartak', label: 'Drewno', hex: { terenBazowy: 'rownina', nakladka: 'las', ulepszenia: ['tartak'] } },
  { key: 'kopalnia_cyny', label: 'Ruda cyny', hex: { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kopalnia_cyny'], zloze: 'cyna' } },
  { key: 'stadnina', label: 'Koń', hex: { terenBazowy: 'rownina', nakladka: 'brak', ulepszenia: ['stadnina'], zloze: 'kon' } },
  { key: 'kamieniolom', label: 'Kamień', hex: { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kamieniolom'] } },
  { key: 'kopalnia_miedzi', label: 'Ruda', hex: { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kopalnia_miedzi'], zloze: 'miedz' } },
  { key: 'kopalnia_zelaza', label: 'Ruda żelaza', hex: { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kopalnia_zelaza'], zloze: 'zelazo' } },
];

function render(M, hex) {
  const full = { coords: { q: 1, r: 1 }, ulepszenie: 'brak', rzeka: RIVER, ...hex };
  return M.buildHexContextTooltipHtml({ q: 1, r: 1, hex: full, esc: s => s, hexWorkedForMagazyn: true, currentEra: 3 });
}

async function main() {
  const M = await bundleTooltip();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
  try {
    const page = await browser.newPage({ viewport: { width: 380, height: 900 } });
    const domText = async (html, selector) => {
      await page.setContent(`<!doctype html><meta charset="utf-8"><style>.civ-side-ctx-dock{width:340px}${ctxCss()}</style><div class="civ-side-ctx-dock" id="dock">${html}</div>`);
      return page.evaluate(sel => {
        const subs = [...document.querySelectorAll('#dock .cp-sub')];
        const b = subs.find(e => e.textContent.includes(sel));
        if (b) return b.textContent;
        // Lista "Możliwe ulepszenia" nie jest .cp-sub -- bierzemy tekst docka od markera.
        const all = document.getElementById('dock').textContent;
        const i = all.indexOf(sel);
        return i >= 0 ? all.slice(i) : null;
      }, selector);
    };
    const count = (text, label) => text.split(label).length - 1;

    console.log('\n[1] ulepszenie postawione: surowiec raz (produkcja), bez dublu w etykiecie odblokowania');
    for (const c of CASES) {
      ok(M.labelsForImprovementUnlock(c.key).includes(c.label), `${c.key}: etykieta odblokowania "${c.label}" istnieje w danych (warunek testu)`);
      const built = await domText(render(M, c.hex), 'Ulepszenia postawione');
      ok(built !== null, `${c.key}: blok "Ulepszenia postawione" w DOM`);
      if (built === null) continue;
      const mProd = new RegExp(`\\+\\d+ ${c.label}/t`);
      ok(mProd.test(built), `${c.key}: jest wiersz produkcji "+N ${c.label}/t"`, built);
      // Nazwa surowca moze wystapic tylko w wierszu produkcji: 1 wystapienie (dla "Ruda" liczymy slowo).
      const re = new RegExp(`(?<![\\p{L}])${c.label}(?![\\p{L}])`, 'gu');
      const occ = (built.match(re) || []).length;
      ok(occ === 1, `${c.key}: "${c.label}" wystepuje 1x (jest ${occ})`, built);
    }

    console.log('\n[2] lista "Możliwe ulepszenia": Kamieniołom bez "odblok. Kamień" przy produkcji Kamień');
    const possible = await domText(render(M, { terenBazowy: 'wzgorza', nakladka: 'brak', ulepszenia: ['kopalnia_cyny'], zloze: 'cyna' }), 'Możliwe ulepszenia');
    ok(possible !== null && /Kamieniołom/.test(possible), 'Kamieniołom na liście możliwych', possible);
    if (possible) {
      ok(!/odblok\./.test(possible.split('Fort')[0]), 'Kamieniołom: brak "odblok." (surowiec jest w produkcji)', possible);
      ok(/\+\d+ Kamień\/t/.test(possible), 'Kamieniołom: produkcja "+N Kamień/t" zostaje');
    }

    console.log('\n[3] etykieta niosąca dodatkową informację ZOSTAJE (brak wiersza produkcji)');
    for (const [key, hex] of [
      ['bydlo', { terenBazowy: 'rownina', nakladka: 'brak', ulepszenia: ['bydlo'] }],
    ]) {
      const labels = M.labelsForImprovementUnlock(key);
      const built = await domText(render(M, hex), 'Ulepszenia postawione');
      ok(labels.length > 0 && built !== null && labels.every(l => built.includes(l)),
        `${key}: etykieta odblokowania ${JSON.stringify(labels)} zachowana`, built);
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
