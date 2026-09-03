'use strict';
/**
 * et-turn-lbl-kontrast-real-render-test.cjs — P-UI-TURA-ETYKIETA-KONTRAST-Q1
 *
 * ZGŁOSZENIE (właściciel, zrzut ekranu paska dolnego): etykieta "Tura X · Rok"
 * (`.et-turn-lbl` w bottomBarHud.ts) zlewa się z żółtym/piaskowym terenem pod
 * przezroczystym paskiem dolnym (potwierdzone też na zielonym i niebieskim/wodzie —
 * gorzej niż na żółtym, patrz sekcja C niżej).
 *
 * NAPRAWA: `.et-turn-lbl` dostaje jaśniejszy kolor tekstu (#fff8e6 zamiast #8a8070)
 * ORAZ ciemny `text-shadow` (poświata blur + 4-kierunkowy 1px kontur) — kontur jest
 * mechanizmem odpornym na kolor terenu pod spodem (recon 00-dispatch.md), bo daje
 * lokalny kontrast na krawędzi glifu niezależnie od globalnej jasności tła. Reszta
 * reguły (`text-align`, `font-size`, `letter-spacing`, `text-transform`, `margin-top`)
 * i CAŁA reszta arkusza CSS tego pliku — bez zmian (dowód w sekcji F).
 *
 * Bundluje NAPRAWDĘ src/ui/bottomBarHud.ts (esbuild, platform:'browser', wzorzec
 * sidepanel-event-header-wydarzenie-real-render-test.cjs) i renderuje go w ŻYWYM
 * Chromium (Playwright) nad trzema tłami symulującymi teren gry — kolory wyciągnięte
 * wprost ze źródła (src/render/mapRenderStyle.ts, src/render/units.ts):
 *   żółty/piaskowy = #e8d4a0 (COAST_SAND_ROBLOX)
 *   zielony        = #6ea043 (grassA, styl domyślny)
 *   niebieski/woda = #487892 (deepOcean, styl domyślny)
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (sekcja D): drugi bundel buduje się z tego samego,
 * NIEZMIENIONEGO pliku źródłowego, ale z regułą `.et-turn-lbl` odwróconą W LOCIE
 * (string-replace w pluginie esbuild, bez dotykania plików w repo) z powrotem na stan
 * SPRZED naprawy. Te same asercje uruchomione na tym mutancie muszą zaświecić się na
 * czerwono — jeśli świecą na zielono, test niczego nie mierzy (precedens
 * P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1). Mutant jest jednocześnie
 * materiałem PRZED do zrzutów.
 *
 * Usage (z gra/): node tools/et-turn-lbl-kontrast-real-render-test.cjs [--shots <dir>]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[et-turn-lbl-kontrast-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const SRC_FILE = path.join(GRA, 'src/ui/bottomBarHud.ts');
const ENTRY = path.resolve(__dirname, '.et-turn-lbl-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.et-turn-lbl-bundle-po.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.et-turn-lbl-bundle-przed.js');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const STUB_BRAND_ASSETS = path.resolve(STUB_DIR, 'et-turn-lbl-brandAssets-stub.ts');
const STUB_BRAND_TOKENS = path.resolve(STUB_DIR, 'et-turn-lbl-brandTokenVars-stub.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots') || path.resolve(__dirname, '.shots-et-turn-lbl');
fs.mkdirSync(SHOTS, { recursive: true });

const TERRAINS = [
  { key: 'zolty-piaskowy', label: 'żółty/piaskowy (COAST_SAND_ROBLOX)', bg: '#e8d4a0' },
  { key: 'zielony', label: 'zielony (grassA domyślny)', bg: '#6ea043' },
  { key: 'niebieski-woda', label: 'niebieski/woda (deepOcean domyślny)', bg: '#487892' },
];

const OLD_RULE = ".civ-bottom-bar .et-turn-lbl{text-align:center;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#8a8070;margin-top:2px;}";
const NEW_RULE_RE = /\.civ-bottom-bar \.et-turn-lbl\{text-align:center;font-size:10px;letter-spacing:\.16em;text-transform:uppercase;color:#fff8e6;text-shadow:[^}]+;margin-top:2px;\}/;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[et-turn-lbl-kontrast-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  // -------------------------------------------------------------------------
  // A) PIN TEKSTOWY na źródło — dowodzi, że naprawa STOI w kodzie, w dokładnie
  //    zakresie dozwolonym przez allowlistę (WYŁĄCZNIE ta jedna reguła CSS).
  // -------------------------------------------------------------------------
  const src = fs.readFileSync(SRC_FILE, 'utf8');
  check('[A1] .et-turn-lbl ma nowy kolor #fff8e6 + text-shadow (dokładny wzorzec)', NEW_RULE_RE.test(src));
  check('[A2] stara reguła (#8a8070, bez text-shadow) już NIE występuje w źródle', !src.includes(OLD_RULE));
  const otherRulesUnchanged = [
    '.civ-bottom-bar .wykonaj{height:', '.civ-bottom-bar .end-turn{min-width:0;width:100%;',
    '.civ-bottom-bar .et-hint{position:absolute;', '.civ-bottom-bar .et-tooltip{position:absolute;',
    '.civ-bottom-bar .et-action{display:flex;',
  ].every((frag) => src.includes(frag));
  check('[A3] sąsiednie reguły CSS (.wykonaj/.end-turn/.et-hint/.et-tooltip/.et-action) obecne bez zmian', otherRulesUnchanged);

  // -------------------------------------------------------------------------
  // B) Bundling: PO = niezmieniony bieżący plik. PRZED = ten sam plik, z regułą
  //    .et-turn-lbl odwróconą w locie (mutacja tylko w pamięci, nie w repo).
  // -------------------------------------------------------------------------
  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(STUB_BRAND_ASSETS, "export function brandIconSvg(_key, _size) { return ''; }\n", 'utf8');
  fs.writeFileSync(
    STUB_BRAND_TOKENS,
    "export function ensureBrandRootTokens() {}\nexport const CIV_BRAND_SCOPE_VARS = '';\n",
    'utf8',
  );
  fs.writeFileSync(
    ENTRY,
    "import { createBottomBarHud } from '../src/ui/bottomBarHud.ts';\n" +
    "(window).__createBottomBarHud = createBottomBarHud;\n",
    'utf8',
  );

  const mutation = { applied: 0 };
  function makePlugins(revert) {
    return [{
      name: revert ? 'revert-et-turn-lbl' : 'stub-et-turn-lbl',
      setup(build) {
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_BRAND_ASSETS }));
        build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: STUB_BRAND_TOKENS }));
        if (revert) {
          build.onLoad({ filter: /bottomBarHud\.ts$/ }, (args) => {
            if (path.resolve(args.path) !== SRC_FILE) return null;
            const s = fs.readFileSync(args.path, 'utf8');
            const out = s.replace(NEW_RULE_RE, OLD_RULE);
            if (out !== s) mutation.applied++;
            return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
          });
        }
      },
    }];
  }

  async function build(outfile, revert) {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
      outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: makePlugins(revert), logLevel: 'silent',
    });
  }

  await build(BUNDLE_PO, false);
  await build(BUNDLE_PRZED, true);
  check('[B1] mutacja PRZED faktycznie podmieniła regułę w bundlu (nie porównujemy dwóch identycznych buildów)', mutation.applied === 1, mutation);

  // Dowód F: reszta wygenerowanego CSS (poza tą jedną regułą) jest BIT-FOR-BIT identyczna
  // między PO i PRZED — silniejszy dowód niż git diff --stat, bo porównuje to, co faktycznie
  // trafia do przeglądarki gracza.
  const cssPo = fs.readFileSync(BUNDLE_PO, 'utf8');
  const cssPrzed = fs.readFileSync(BUNDLE_PRZED, 'utf8');
  const poWithoutRule = cssPo.replace(NEW_RULE_RE, '<<RULE>>');
  const przedWithoutRule = cssPrzed.replace(OLD_RULE, '<<RULE>>');
  check('[F1] bundle PO i PRZED identyczne poza jedną regułą .et-turn-lbl (reszta paska bit-for-bit)', poWithoutRule === przedWithoutRule);

  // -------------------------------------------------------------------------
  // C) + D) Realny render Chromium: PO (na wszystkich 3 terenach) i PRZED (mutant) —
  //    computed style + zrzuty PNG jako materiał porównawczy.
  // -------------------------------------------------------------------------
  const browser = await launchBrowser();

  async function renderAndShoot(bundleFile, label) {
    const page = await browser.newPage({ viewport: { width: 400, height: 200 } });
    const js = fs.readFileSync(bundleFile, 'utf8');
    const results = {};
    for (const t of TERRAINS) {
      const html = '<!DOCTYPE html><html><head><style>html,body{margin:0;width:400px;height:200px;}' +
        '#terrain{position:fixed;inset:0;background:' + t.bg + ';}</style></head><body>' +
        '<div id="terrain"></div><script>' + js + '<\/script></body></html>';
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => {
        (window).__createBottomBarHud({
          getTurn: () => 47, getYearLabel: () => '1850 N.E.', onExecutePending: () => {},
          onEndTurn: () => {}, canEndTurn: () => true, getBlockingCount: () => 0, getBlockingTitles: () => [],
        });
      });
      const computed = await page.evaluate(() => {
        const el = document.querySelector('.et-turn-lbl');
        const cs = getComputedStyle(el);
        return { color: cs.color, textShadow: cs.textShadow, text: (el.textContent || '').trim() };
      });
      const el = await page.$('.et-turn-lbl');
      const box = await el.boundingBox();
      const shotPath = path.join(SHOTS, label + '-' + t.key + '.png');
      await page.screenshot({ path: shotPath, clip: { x: box.x - 10, y: box.y - 6, width: box.width + 20, height: box.height + 12 } });
      results[t.key] = computed;
      console.log('  [' + label + '/' + t.key + '] ' + shotPath + ' — color=' + computed.color + ' text-shadow=' + (computed.textShadow === 'none' ? 'none' : '(obecny, ' + computed.textShadow.split(',').length + ' warstwy)'));
    }
    await page.close();
    return results;
  }

  const po = await renderAndShoot(BUNDLE_PO, 'po');
  const przed = await renderAndShoot(BUNDLE_PRZED, 'przed');
  await browser.close();

  for (const t of TERRAINS) {
    check('[C-' + t.key + '] PO: computed color = rgb(255, 248, 230) (#fff8e6)', po[t.key].color === 'rgb(255, 248, 230)', po[t.key]);
    check('[C-' + t.key + '] PO: text-shadow obecny (nie "none")', po[t.key].textShadow !== 'none', po[t.key]);
    check('[D-' + t.key + '] PRZED (mutant): computed color = rgb(138, 128, 112) (#8a8070) — dowód, że mutacja realnie cofnęła wygląd', przed[t.key].color === 'rgb(138, 128, 112)', przed[t.key]);
    check('[D-' + t.key + '] PRZED (mutant): text-shadow = "none" — te same asercje C świecą tu na czerwono, test nie jest tautologią', przed[t.key].textShadow === 'none', przed[t.key]);
  }

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(BUNDLE_PO); } catch { /* ignore */ }
  try { fs.unlinkSync(BUNDLE_PRZED); } catch { /* ignore */ }
  try { fs.unlinkSync(STUB_BRAND_ASSETS); } catch { /* ignore */ }
  try { fs.unlinkSync(STUB_BRAND_TOKENS); } catch { /* ignore */ }

  console.log('\net-turn-lbl-kontrast-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  console.log('Zrzuty PRZED/PO (3 tereny) w: ' + SHOTS);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
