'use strict';
/**
 * empire-autofeed-btn-label-real-render-test.cjs
 *
 * TEMAT: P-SPICHLERZ-AUTO-ZYWIENIE-PRZYCISK-TEKST-Q1.
 *
 * ZGŁOSZENIE WŁAŚCICIELA: przycisk zbiorczego Auto-Żywienia w panelu Spichlerza centralnego
 * (sekcja „DOMYŚLNE WYŻYWIENIE", `renderDefaultPoziomRacjiSection` w
 * `gra/src/ui/empireDetailPanel.ts`) wyświetlał CAŁE zdanie wprost na przycisku:
 * „Włącz Auto-Żywienie we wszystkich miastach bez indywidualnego ustawienia".
 * „Tutaj powinna być tylko na przycisku nazwa auto-żywienie, a wszystkie pozostałe
 * informacje w tooltipie."
 *
 * CO PILNUJE TEN TEST:
 *   (A) WIDOCZNA etykieta przycisku to sama nazwa funkcji — „Włącz Auto-Żywienie".
 *       Czasownik zostaje: bez niego („Auto-Żywienie") gracz nie wie, czy przycisk włącza
 *       czy wyłącza, a to jednorazowa akcja „ustaw teraz", nie przełącznik stanu.
 *   (B) Pełne wyjaśnienie (zakres „we wszystkich miastach", wyjątek miast z ustawieniem
 *       indywidualnym, jednorazowość akcji) jest w atrybucie `title` — natywny tooltip,
 *       ten sam wzorzec co sąsiednie przyciski sekcji (`civ-emp-praca-split-end` MIN/MAX).
 *   (C) Funkcjonalność bez zmian: klik nadal woła `onOwnerSetAutoWyzywienieForAll(0)`.
 *   (D) Layout: po skróceniu etykieta mieści się w JEDNYM wierszu na realnej szerokości
 *       panelu (404px) i nie przepełnia przycisku w poziomie; przycisk zachowuje wysokość
 *       porównywalną z wariantem sprzed zmiany (min-height), więc rytm sekcji nie skacze.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, NIE GREP ŹRÓDŁA / jsdom:
 *   - `title` vs treść przycisku da się zgrepować, ale „czy etykieta mieści się w jednym
 *     wierszu na 404px" i „czy przycisk nie skurczył się po skróceniu tekstu" to pomiar
 *     `getBoundingClientRect()` / `scrollWidth` po realnym kaskadowaniu CSS — jsdom nie
 *     ma layoutu, zwróciłby zera i przed, i po.
 *   - `renderDefaultPoziomRacjiSection` podpina handler dopiero w `queueMicrotask`
 *     (`wireDefaultPoziomRacjiInputs`), po wstawieniu HTML do DOM — asercja (C) musi więc
 *     iść przez faktyczny `element.click()` w żywym dokumencie, nie przez czytanie stringa.
 *
 * MUTACJA (E): ten sam bundle budowany z PRZYWRÓCONYM starym przyciskiem (długi napis,
 * brak `title`) MUSI zapalić asercje (A) i (B) na czerwono. Bez tego test byłby
 * tautologiczny (precedens `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`).
 * Ten sam przebieg dostarcza zrzut PRZED.
 *
 * Usage (z gra/): node tools/empire-autofeed-btn-label-real-render-test.cjs
 * Opcjonalnie: --shot-before <plik.png> --shot-after <plik.png>
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[empire-autofeed-btn-label-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.empire-autofeed-btn-entry.ts');
const OUT_AFTER = path.resolve(__dirname, '.empire-autofeed-btn-bundle.cjs');
const OUT_BEFORE = path.resolve(__dirname, '.empire-autofeed-btn-bundle-legacy.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PANEL_TS = path.resolve(GRA, 'src', 'ui', 'empireDetailPanel.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

const argShot = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOT_BEFORE = argShot('--shot-before');
const SHOT_AFTER = argShot('--shot-after');

/** Nowa, krótka etykieta widoczna na przycisku. */
const LABEL = 'Włącz Auto-Żywienie';
/** Fragmenty, które PO zmianie mają być WYŁĄCZNIE w tooltipie, nigdy na przycisku. */
const TIP_FRAGMENTS = [
  'we wszystkich miastach',
  'bez indywidualnego',
  'jednorazowa',
];

/** Kotwica mutacji: cały blok emitujący przycisk (const z tooltipem + `h +=`). */
const NEW_BLOCK_RE = /const autofeedTip = [\s\S]*?\+ `Włącz Auto-Żywienie<\/button>`;/;
const LEGACY_BLOCK = 'h += `<button type="button" class="civ-emp-autofeed-btn" data-autofeed-all-btn>`\n'
  + '      + `Włącz Auto-Żywienie we wszystkich miastach bez indywidualnego ustawienia</button>`;';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

/** `import.meta.glob`, `*.svg?raw`, `*.css?raw` nie istnieją w gołym esbuildzie — inline'ujemy
 * PRAWDZIWE pliki (ten sam wzorzec co `praca-panel-emoji-brand-icons-real-render-test.cjs`). */
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
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== BRAND_ASSETS_TS) return null;
      const src = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(BRAND_DIR, './brand/', {})),
      );
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
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

/**
 * `renderDefaultPoziomRacjiSection` i `ensureStyles` są wewnętrzne — dokładamy eksporty przez
 * onLoad, BEZ dotykania pliku w repo (kod produkcyjny leci do bundla 1:1).
 * `legacy=true` dodatkowo przywraca stan sprzed poprawki (mutacja E + zrzut PRZED).
 */
function exposePanelPlugin(legacy) {
  return {
    name: 'expose-empire-panel',
    setup(build) {
      build.onLoad({ filter: /empireDetailPanel\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== PANEL_TS) return null;
        let src = fs.readFileSync(args.path, 'utf8');
        if (legacy) {
          if (!NEW_BLOCK_RE.test(src)) {
            throw new Error('mutacja (E): nie znaleziono nowego bloku przycisku — kotwica NEW_BLOCK_RE nieaktualna');
          }
          src = src.replace(NEW_BLOCK_RE, LEGACY_BLOCK)
            .replace('color:#78c95a;font-size:12.5px;font-weight:700;\n  line-height:1.2;min-height:34px;cursor:pointer',
              'color:#78c95a;font-size:11.5px;font-weight:700;\n  cursor:pointer');
        }
        return {
          contents: src
            + '\nexport { renderDefaultPoziomRacjiSection as __renderRacjeSection,'
            + ' ensureStyles as __ensureEmpireStyles };\n',
          loader: 'ts', resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}

async function buildBundle(outfile, legacy) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, exposePanelPlugin(legacy)], logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[empire-autofeed-btn-label-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Renderuje sekcję „DOMYŚLNE WYŻYWIENIE" na realnej szerokości panelu i mierzy przycisk. */
async function renderAndMeasure(browser, bundleFile, shotPath) {
  const page = await browser.newPage({ viewport: { width: 520, height: 420 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  // Reset 1:1 z `gra/index.html`; `.civ-emp-panel` odpięty od `position:fixed`, żeby zrzut
  // obejmował samą sekcję, ale zachował szerokość 404px i typografię panelu.
  await page.setContent('<!DOCTYPE html><html><head><style>'
    + '*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{background:#0b0f16;color:#eee;padding:12px;}'
    + '#stage.civ-emp-panel{position:static;transform:none;width:404px;height:auto;'
    + 'box-shadow:none;border-left:none;border:1px solid #2b3543;border-radius:8px;}'
    + '</style></head><body><div id="stage" class="civ-emp-panel"></div></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(bundleFile, 'utf8') });

  const measured = await page.evaluate(() => {
    window.__clicks = [];
    window.__ensureEmpireStyles();
    window.__configureEmpireGlobalDefaults({
      getOwnerDefaultPoziomRacji: () => 4,
      onOwnerDefaultPoziomRacjiChange: () => {},
      onOwnerSetAutoWyzywienieForAll: (ownerId) => { window.__clicks.push(ownerId); },
    });
    const stage = document.getElementById('stage');
    stage.innerHTML = window.__renderRacjeSection();
    const btn = document.querySelector('button[data-autofeed-all-btn]');
    if (!btn) return { missing: true };
    const r = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    return {
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      title: btn.getAttribute('title') || '',
      width: Math.round(r.width),
      height: Math.round(r.height),
      scrollWidth: btn.scrollWidth,
      clientWidth: btn.clientWidth,
      scrollHeight: btn.scrollHeight,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
    };
  });

  // Klik dopiero po mikrozadaniu `wireDefaultPoziomRacjiInputs` — realna ścieżka produkcyjna.
  const clicks = await page.evaluate(async () => {
    const btn = document.querySelector('button[data-autofeed-all-btn]');
    if (!btn) return null;
    btn.click();
    return window.__clicks.slice();
  });

  if (shotPath) {
    fs.mkdirSync(path.dirname(path.resolve(shotPath)), { recursive: true });
    await page.locator('#stage').screenshot({ path: shotPath });
  }
  await page.close();
  return { ...measured, clicks, pageErrors };
}

async function main() {
  const panelSrc = fs.readFileSync(PANEL_TS, 'utf8');

  // --- (0) Statyczne kotwice w źródle — czytelny sygnał, gdy poprawka zniknie -------------
  check('(0) etykieta przycisku w źródle to sama nazwa funkcji („Włącz Auto-Żywienie</button>")',
    panelSrc.includes('`Włącz Auto-Żywienie</button>`'));
  check('(0) długiego zdania nie ma już w treści przycisku',
    !/Auto-Żywienie we wszystkich miastach bez indywidualnego ustawienia<\/button>/.test(panelSrc));
  check('(0) przycisk ma atrybut title budowany z esc() i &quot;',
    /data-autofeed-all-btn `\s*\+ `title="\$\{esc\(autofeedTip\)\.replace\(\/"\/g, '&quot;'\)\}">/.test(panelSrc));
  check('(0) CSS .civ-emp-autofeed-btn dostosowany do krótkiej etykiety (12.5px + min-height)',
    /\.civ-emp-autofeed-btn\{[^}]*font-size:12\.5px[^}]*min-height:34px/s.test(panelSrc));

  fs.writeFileSync(ENTRY, [
    "import { configureEmpireGlobalDefaults } from '../src/ui/empireDetailPanel.ts';",
    "import { __renderRacjeSection, __ensureEmpireStyles } from '../src/ui/empireDetailPanel.ts';",
    'window.__configureEmpireGlobalDefaults = configureEmpireGlobalDefaults;',
    'window.__renderRacjeSection = __renderRacjeSection;',
    'window.__ensureEmpireStyles = __ensureEmpireStyles;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(OUT_AFTER, false);
  await buildBundle(OUT_BEFORE, true);

  const browser = await launchBrowser();
  let after;
  let before;
  try {
    after = await renderAndMeasure(browser, OUT_AFTER, SHOT_AFTER);
    before = await renderAndMeasure(browser, OUT_BEFORE, SHOT_BEFORE);
  } finally {
    await browser.close();
  }

  check('(A) przycisk istnieje w wyrenderowanej sekcji', !after.missing, after);
  check('(A) widoczny tekst przycisku to dokładnie „' + LABEL + '"',
    after.text === LABEL, after.text);
  for (const frag of TIP_FRAGMENTS) {
    check('(A) na przycisku NIE ma już fragmentu „' + frag + '"',
      !after.text.includes(frag), after.text);
  }

  check('(B) przycisk ma niepusty atrybut title', after.title.length > 0, after.title);
  for (const frag of TIP_FRAGMENTS) {
    check('(B) tooltip zawiera „' + frag + '"', after.title.includes(frag), after.title);
  }
  check('(B) tooltip mówi wprost o Auto-Żywieniu (samodzielny bez etykiety)',
    /Auto-Żywienie/.test(after.title), after.title);

  check('(C) klik nadal woła onOwnerSetAutoWyzywienieForAll dla ownera 0',
    Array.isArray(after.clicks) && after.clicks.length === 1 && after.clicks[0] === 0, after.clicks);
  check('(C) render sekcji bez błędów strony', after.pageErrors.length === 0, after.pageErrors);

  check('(D) etykieta mieści się w jednym wierszu (brak przepełnienia w poziomie)',
    after.scrollWidth <= after.clientWidth, { scrollWidth: after.scrollWidth, clientWidth: after.clientWidth });
  check('(D) etykieta nie zawija się w pionie (scrollHeight ≈ wysokość przycisku)',
    after.scrollHeight <= after.height + 1, { scrollHeight: after.scrollHeight, height: after.height });
  check('(D) przycisk nie skurczył się po skróceniu tekstu (wysokość ≥ 34px)',
    after.height >= 34, after.height);
  check('(D) przycisk trzyma pełną szerokość panelu (jak przed zmianą)',
    Math.abs(after.width - before.width) <= 1, { after: after.width, before: before.width });

  // --- (E) MUTACJA: ten sam bundle ze starym przyciskiem musi te asercje zapalić ----------
  check('(E) mutacja odtwarza stary, długi napis na przycisku',
    before.text === 'Włącz Auto-Żywienie we wszystkich miastach bez indywidualnego ustawienia', before.text);
  check('(E) mutacja: asercja (A) faktycznie rozróżnia — stary tekst ≠ nowa etykieta',
    before.text !== after.text);
  check('(E) mutacja: stary przycisk NIE miał tooltipa (asercja (B) nie jest tautologią)',
    before.title === '', before.title);
  check('(E) mutacja: stary napis realnie zawijał się do wielu wierszy',
    before.scrollHeight > after.scrollHeight, { before: before.scrollHeight, after: after.scrollHeight });
  check('(E) mutacja: funkcjonalność kliku była i jest ta sama (regres wykluczony)',
    Array.isArray(before.clicks) && before.clicks.length === 1 && before.clicks[0] === 0, before.clicks);

  for (const f of [ENTRY, OUT_AFTER, OUT_BEFORE]) fs.rmSync(f, { force: true });

  console.log('\n' + (fail === 0 ? 'OK' : 'FAILED') + ` — pass ${pass}, fail ${fail}`);
  if (SHOT_AFTER) console.log('zrzut PO:    ' + path.resolve(SHOT_AFTER));
  if (SHOT_BEFORE) console.log('zrzut PRZED: ' + path.resolve(SHOT_BEFORE));
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
