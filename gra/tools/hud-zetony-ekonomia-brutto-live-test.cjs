'use strict';
/**
 * hud-zetony-ekonomia-brutto-live-test.cjs — R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1
 * (Maciej 2026-09-07, ECHO właściciela odwraca poprzednią decyzję na to samo pytanie).
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU z dispatchu: zakaz uznania zmiany za gotową bez ŻYWEGO
 * zrzutu pokazującego KONKRETNE liczby brutto na wszystkich trzech żetonach (Praca,
 * Skarbiec, Nauka) JEDNOCZEŚNIE. Ta bramka esbuild-uje PRAWDZIWY, niezmodyfikowany
 * `renderBarD1B()` (jedyna zmiana w hud.ts umożliwiająca import: dodane słowo `export`
 * przed deklaracją, zero zmiany zachowania) z realnym `HudState` odtwarzającym DOKŁADNIE
 * scenariusz z dispatchu:
 *   Praca:    netto +22, utrzymanie -3, auto-ulepszenia -76, Cuda na mapie -12
 *             (brutto = 22+3+76+12 = 113)
 *   Skarbiec: wpływy brutto +40, netto +9 (po utrzymaniu)
 *   Nauka:    +15 (brak dziś drenaży -- brutto = netto, patrz komentarz przy
 *             naukaChipTitle() w hud.ts)
 * i renderuje wynik w PRAWDZIWYM headless Chromium (nie jsdom-atrapa), robiąc zrzut
 * ekranu trzech żetonów HUD naraz -- dowód wizualny, nie tylko assert na stringu.
 *
 * Run from gra/:  node tools/hud-zetony-ekonomia-brutto-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require('esbuild');

const GRA_DIR = path.resolve(__dirname, '..');
const HUD_TS = path.join(GRA_DIR, 'src/ui/hud.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-hud-brutto-live-'));
process.on('exit', () => { try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch { /* best-effort */ } });

const BUNDLE_JS = path.join(TMP_DIR, 'bundle.js');
const HTML_FILE = path.join(TMP_DIR, 'index.html');
const SHOT_FILE = path.join(TMP_DIR, 'hud-brutto-zetony.png');
// Zrzut jest DOWODEM (patrz konwencja innych bramek: "zrzuty sa DOWODEM") -- kopiowany
// też do katalogu runu, żeby przetrwał sprzątanie TMP_DIR na `process.exit`.
const RUN_DIR = path.resolve(GRA_DIR, '..', 'dyspozycje/autobot/runs/R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1');
const SHOT_KEEP = path.join(RUN_DIR, 'zrzut-runda1-trzy-zetony-brutto.png');

let passCount = 0;
let failCount = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS: ' + label); passCount++; }
  else { console.log('FAIL: ' + label + (extra ? ' -- ' + JSON.stringify(extra) : '')); failCount++; }
}

// Scenariusz dokładnie z dispatchu (00-dispatch.md, BINARNE KRYTERIUM SUKCESU):
// Praca: netto (+22) + utrzymanie (3) + auto-ulepszenia (76) + cuda-na-mapie (nowe pole).
const MOCK_STATE = {
  zloto: 240, zlotoRate: 0,
  praca: 88, pracaRate: 22,
  pracaUpkeep: 3,
  pracaAutoUlepszeniaKoszt: 76,
  pracaCudaKoszt: 12,
  zywnoscLabel: '48',
  nauka: 310, naukaRate: 15,
  kultura: 12, kulturaRate: 1,
  bogactwo: 500,
  bogactwoRate: 9,
  bogactwoWplywyBrutto: 40,
  bogactwoHandel: 6,
  bogactwoUtrzymanieBudynkow: 20,
  bogactwoUtrzymanieJednostek: 11,
  ludnosc: 12,
  power: 100,
  osiedla: 3, osiedlaMax: 6,
  tura: 42, epoka: 'Brąz',
};
// Praca brutto oczekiwane = 22 + 3 + 76 + 12 = 113 (dokładnie wzorzec z dispatchu, tu
// dociągnięty o czwarty składnik "Cuda na mapie", zlecony tym tematem).
const EXPECT_PRACA_BRUTTO = 113;
const EXPECT_SKARBIEC_BRUTTO = 40;
const EXPECT_NAUKA_BRUTTO = 15;

// Vite-owe konstrukcje (`?raw`, `import.meta.glob`) nie istnieją w gołym esbuildzie --
// ten sam wzorzec co `tools/autowyzywienie-stan-przycisku-test.cjs`/`praca-jeden-podzial-
// real-render-test.cjs` (inline'ujemy PRAWDZIWE pliki, nie atrapy tekstu).
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'), loader: 'text',
    }));
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const src = fs.readFileSync(args.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function buildBundle() {
  const entry = path.join(TMP_DIR, 'entry.ts');
  fs.writeFileSync(entry, `
    import { renderBarD1B } from ${JSON.stringify(HUD_TS)};
    (window).__renderBarD1B = renderBarD1B;
    (window).__mockState = ${JSON.stringify(MOCK_STATE)};
    (window).__runRender = function () {
      const html = (window).__renderBarD1B((window).__mockState);
      document.getElementById('root').innerHTML =
        '<div class="civ-hud" style="display:flex;gap:2px;background:#11161f;padding:8px">' + html + '</div>';
    };
  `);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    outfile: BUNDLE_JS,
    platform: 'browser',
    format: 'iife',
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' },
    plugins: [viteCompatPlugin],
  });
  fs.writeFileSync(
    HTML_FILE,
    '<!doctype html><html><head><meta charset="utf-8"><style>'
    + '*{color:#e8ebf0;font:600 20px/1.4 sans-serif;position:static!important}'
    + 'svg,.civ-hud-chip-ring{display:none!important}'
    + '</style></head>'
    + '<body style="margin:0;background:#11161f;padding:16px"><div id="root"></div>'
    + '<script src="bundle.js"></script></body></html>',
  );
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[hud-brutto-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function main() {
  await buildBundle();
  const { chromium } = require('playwright');
  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 500 } });
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push('console.error: ' + msg.text()); });
    await page.goto('file://' + HTML_FILE);
    await page.evaluate(() => { (window).__runRender(); });
    await page.waitForTimeout(150);

    const chipText = await page.evaluate(() => document.getElementById('root').innerText);
    console.log('--- Wyrenderowany tekst żetonów HUD (realny renderBarD1B, realny Chromium) ---');
    console.log(chipText);
    console.log('---');

    check(
      'żeton PRACA pokazuje brutto +113 (22 netto + 3 utrzymanie + 76 auto-ulepszenia + 12 cuda-na-mapie), NIE netto +22',
      chipText.includes('+113') && !/\+22\b/.test(chipText),
      { chipText },
    );
    check(
      'żeton SKARBIEC pokazuje brutto +40 (wpływy przed utrzymaniem), NIE netto +9',
      chipText.includes('+40') && !/\+9\b/.test(chipText),
      { chipText },
    );
    check(
      'żeton NAUKA pokazuje +15 (brutto = netto, brak dziś drenaży Nauki -- patrz komentarz naukaChipTitle)',
      chipText.includes('+15'),
      { chipText },
    );
    check(
      'WSZYSTKIE TRZY liczby brutto (113, 40, 15) obecne JEDNOCZEŚNIE w jednym renderze (nie osobno)',
      chipText.includes('+113') && chipText.includes('+40') && chipText.includes('+15'),
      { chipText },
    );
    check('zero błędów konsoli/JS podczas renderu', consoleErrors.length === 0, { consoleErrors });

    await page.screenshot({ path: SHOT_FILE });
    fs.mkdirSync(RUN_DIR, { recursive: true });
    fs.copyFileSync(SHOT_FILE, SHOT_KEEP);
    console.log('[hud-brutto-live-test] zrzut zapisany: ' + SHOT_KEEP);
  } finally {
    await browser.close();
  }
}

main().then(() => {
  console.log('');
  console.log('========================================================================');
  console.log(`[hud-zetony-ekonomia-brutto-live-test] ${passCount} pass, ${failCount} fail`);
  console.log('========================================================================');
  process.exit(failCount > 0 ? 1 : 0);
}).catch((e) => {
  console.error('[hud-zetony-ekonomia-brutto-live-test] błąd:', e);
  process.exit(1);
});
