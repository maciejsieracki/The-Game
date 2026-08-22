'use strict';
/**
 * entity-card-action-buttons-real-render-test.cjs
 *
 * TEMAT: P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1.
 *
 * Co pilnuje (i dlaczego akurat w PRAWDZIWEJ przeglądarce, nie w jsdom):
 *
 *  (A) `ENTITY_CARD_CSS` (`entityCards/renderer.ts`) MA reguły dla SAMYCH przycisków
 *      akcji karty — `.entity-card-action` / `-primary` / `-secondary`, budowanych
 *      z `data.actions` w `renderEntityCard`. Do tego tematu ostylowany był wyłącznie
 *      kontener liczby mnogiej `.entity-card-actions`, więc przyciski dostawały
 *      natywny wygląd przeglądarki: `background rgb(239,239,239)`, `color rgb(0,0,0)`,
 *      `border-top-width 2px`, `cursor default` — dokładnie ten sam brzydki, jasny
 *      prostokąt, który właściciel opisał jako „dziwne napisy na białym tle" przy
 *      linkach krzyżowych (`P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1`),
 *      tylko INNA ścieżka kodu (`data.actions`, nie `row.linkTo`).
 *
 *      jsdom NIE potrafi tego wykryć: nie ma tam arkusza UA dla `<button>` ani realnego
 *      kaskadowania, więc `getComputedStyle(btn).backgroundColor` jest zawsze puste —
 *      i przed, i po naprawie. Stąd REALNE `getComputedStyle` w Chromium.
 *
 *  (B) DLACZEGO TEN TEST W OGÓLE POWSTAŁ: istniejące testy tego systemu
 *      (`tech-discovery-card-click-test.cjs`, `tech-discovery-card-real-click-test.cjs`,
 *      `entity-card-contract-test.cjs`, `civpedia-cross-link-style-real-render-test.cjs`)
 *      albo renderują kartę BEZ `data.actions`, albo sprawdzają wyłącznie zachowanie
 *      kliku (`onClick`, hit-test), NIGDY wygląd tych przycisków — dlatego usterka
 *      przeżyła cały temat linków (19/19 zielonych) i została znaleziona dopiero przez
 *      Final Control sondą ad-hoc. Ten plik zamyka tę lukę na stałe.
 *
 *  (C) HIERARCHIA `primary` vs `secondary` jest realnie rozróżnialna. To nie kosmetyka:
 *      `techDiscoveryNotice.ts` nadaje „Rozpocznij badanie" = `primary`, a „Otwórz
 *      drzewo" = `secondary` TYLKO gdy primary już jest (inaczej samo awansuje na
 *      `primary`). Gdyby oba warianty wyglądały tak samo, ta logika byłaby martwa.
 *
 *  (D) ŻYWA ŚCIEŻKA PRODUKCYJNA: te same asercje na karcie otwartej przez PRAWDZIWE
 *      `showTechDiscoveryNotice({kind:'preview', onStartResearch, onOpenTree})` —
 *      dokładnie wywołanie z `scienceHubHud.ts`/`techTreeView.ts`/`main.ts`. Bez tego
 *      test dowodziłby tylko, że CSS istnieje w stringu, a nie że dociera do
 *      przycisków w faktycznym hoście (`#civ-tech-discovery-notice-host`, własny
 *      arkusz nadpisań `ensureEntityCardOverrideStyles`).
 *
 *  (E) MUTACJA: po wycięciu dopisanego bloku CSS ze wstrzykniętych arkuszy asercje
 *      MUSZĄ wrócić na czerwono — inaczej test niczego nie sprawdza (precedens
 *      `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`).
 *
 * Usage (z gra/): node tools/entity-card-action-buttons-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-card-action-buttons-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.entity-card-action-buttons-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-card-action-buttons-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const RENDERER = path.resolve(GRA, 'src', 'ui', 'entityCards', 'renderer.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

// Kotwice bloku CSS dopisanego przez ten temat — używane też przez mutację (E).
// Kotwica końcowa jest jawnym komentarzem-sentinelem w `ENTITY_CARD_CSS` (a nie selektorem
// następnej reguły), żeby dopisanie kolejnych reguł na końcu arkusza nie zmieniło zakresu
// mutacji — patrz komentarz przy tej linii w `renderer.ts`.
const MARKER_START = '/* P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1: brakujace';
const MARKER_END = '/* koniec bloku P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1';

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

/** Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`, `*.css?raw`) nie istnieją w gołym
 * esbuildzie. Zamiast stubować ikony pustym stringiem inline'ujemy PRAWDZIWE pliki (ten sam
 * wzorzec co `civpedia-cross-link-style-real-render-test.cjs`) — dzięki temu nie powstaje
 * żaden współdzielony plik stuba (patrz `P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY`), a render
 * w Chromium jest 1:1 z produkcją, łącznie z `tokens.css` wciąganym przez `brandTokenVars.ts`
 * (bez niego `var(--tg-btn-primary)` liczyłby się z fallbacku, nie z realnego tokenu). */
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

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[entity-card-action-buttons-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Zbiera realne `getComputedStyle` obu wariantów przycisku, w obu scenariuszach:
 * karta zbudowana wprost przez `renderEntityCard` (A/C) oraz karta z ŻYWEJ ścieżki
 * `showTechDiscoveryNotice` (D). */
async function measure(page) {
  return page.evaluate(() => {
    const btnStyle = (root, sel) => {
      const el = root ? root.querySelector(sel) : null;
      if (!el) return { missing: true };
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        text: (el.textContent || '').trim(),
        bg: cs.backgroundColor,
        bgImage: cs.backgroundImage,
        color: cs.color,
        borderTopWidth: cs.borderTopWidth,
        borderRadius: cs.borderTopLeftRadius,
        cursor: cs.cursor,
        fontWeight: cs.fontWeight,
        textTransform: cs.textTransform,
        paddingLeft: cs.paddingLeft,
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    };
    const card = document.getElementById('civ-test-card');
    const host = document.getElementById('civ-tech-discovery-notice-host');
    return {
      primary: btnStyle(card, 'button.entity-card-action-primary'),
      secondary: btnStyle(card, 'button.entity-card-action-secondary'),
      livePrimary: btnStyle(host, '.entity-card-actions button.entity-card-action-primary'),
      liveSecondary: btnStyle(host, '.entity-card-actions button.entity-card-action-secondary'),
      liveLabels: host
        ? Array.from(host.querySelectorAll('.entity-card-actions button')).map((b) => [b.textContent, b.className])
        : null,
    };
  });
}

// Natywny przycisk Chromium (bez żadnego CSS autora): szare wypełnienie `buttonface`,
// czarny tekst, `cursor:default`, zerowy promień, brak uppercase.
const NATIVE_BG = 'rgb(239, 239, 239)';
function isNativeButtonLook(s) {
  return !s.missing && s.bg === NATIVE_BG && s.cursor !== 'pointer';
}
/** Wspólny język wypełnionego przycisku karty (niezależny od wariantu koloru). */
function isCardButtonLook(s) {
  return !s.missing
    && s.bg !== NATIVE_BG
    && s.cursor === 'pointer'
    && s.borderRadius === '8px'
    && s.textTransform === 'uppercase'
    && s.paddingLeft === '18px'
    && s.bgImage.startsWith('linear-gradient');
}

async function main() {
  // --- (0) Statyczne kotwice w źródle — czytelny sygnał, gdy reguła zniknie ---------------
  const rendererSrc = fs.readFileSync(RENDERER, 'utf8');
  check('(0) ENTITY_CARD_CSS zawiera regułę .entity-card-action', /\n\.entity-card-action\{/.test(rendererSrc));
  check('(0) ENTITY_CARD_CSS zawiera regułę .entity-card-action-primary',
    /\n\.entity-card-action-primary\{/.test(rendererSrc));
  check('(0) ENTITY_CARD_CSS zawiera regułę .entity-card-action-secondary',
    /\n\.entity-card-action-secondary\{/.test(rendererSrc));
  check('(0) ENTITY_CARD_CSS resetuje natywny wygląd <button> dla przycisków akcji',
    /\.entity-card-action\{[\s\S]{0,300}appearance:none/.test(rendererSrc));
  check('(0) blok ma kotwicę początkową i końcową dla mutacji (E)',
    rendererSrc.includes(MARKER_START) && rendererSrc.includes(MARKER_END));

  fs.writeFileSync(ENTRY, [
    "import { renderEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { showTechDiscoveryNotice, hideTechDiscoveryNotice } from '../src/ui/techDiscoveryNotice.ts';",
    "import { ensureBrandRootTokens } from '../src/ui/brandTokenVars.ts';",
    'window.__renderEntityCard = renderEntityCard;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__showTechDiscoveryNotice = showTechDiscoveryNotice;',
    'window.__hideTechDiscoveryNotice = hideTechDiscoveryNotice;',
    'window.__ensureBrandRootTokens = ensureBrandRootTokens;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    // Globalny reset 1:1 z `gra/index.html` — bez niego natywny `<button>` miałby własny
    // padding UA i pomiar „przed/po" liczyłby się w innym otoczeniu niż produkcyjne.
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const techData = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
    const techName = techData.technologie[0].Technologia;
    check('fixture: tech.json ma co najmniej 1 technologię do testu',
      typeof techName === 'string' && techName.length > 0, techName);

    await page.evaluate((techName) => {
      // Tokeny marki dokładnie tak jak w produkcji (`cityPanel.ts`/`mainMenu.ts` itd.) —
      // żeby `var(--tg-btn-primary)`/`var(--tg-radius-btn)` liczyły się z realnego
      // `tokens.css`, a nie z fallbacków wpisanych w regułę.
      window.__ensureBrandRootTokens();

      // (A/C) Karta zbudowana wprost przez renderer, z OBOMA wariantami akcji.
      const style = document.createElement('style');
      style.id = 'entity-card-css-under-test';
      style.textContent = window.__ENTITY_CARD_CSS;
      document.head.appendChild(style);
      window.__actionCalls = { p: 0, s: 0 };
      const card = window.__renderEntityCard({
        kind: 'technology', id: 'x', title: 'Test',
        medallion: { kind: 'icon', svg: '<svg></svg>' },
        sections: [{ key: 'g', title: 'Grid', rows: [{ label: 'Epoka', value: 'Kamień' }] }],
        actions: [
          { id: 'research', label: 'Rozpocznij badanie', kind: 'primary', onClick: () => { window.__actionCalls.p++; } },
          { id: 'tree', label: 'Otwórz drzewo', kind: 'secondary', onClick: () => { window.__actionCalls.s++; } },
        ],
      });
      card.id = 'civ-test-card';
      document.body.appendChild(card);

      // (D) ŻYWA ścieżka produkcyjna — dokładnie wywołanie ze `scienceHubHud.ts`.
      window.__showTechDiscoveryNotice({
        techName, eraIndex: 1, kind: 'preview',
        onStartResearch: () => {}, onOpenTree: () => {},
      });

      // Przełącznik mutacji (E): wycięcie dopisanego bloku CSS ze WSZYSTKICH arkuszy
      // (arkusz testowy wyżej ORAZ arkusz nadpisań wstrzyknięty przez techDiscoveryNotice).
      window.__origCss = new Map();
      window.__setFix = (on, mStart, mEnd) => {
        document.querySelectorAll('style').forEach((s) => {
          if (!window.__origCss.has(s)) window.__origCss.set(s, s.textContent);
          const orig = window.__origCss.get(s);
          if (on) { s.textContent = orig; return; }
          const a = orig.indexOf(mStart);
          if (a < 0) { s.textContent = orig; return; }
          const b = orig.indexOf(mEnd, a);
          s.textContent = b > -1 ? orig.slice(0, a) + orig.slice(b) : orig.slice(0, a);
        });
      };
    }, techName);

    const m = await measure(page);

    // --- (A) przyciski karty NIE mają już natywnego wyglądu przeglądarki -------------------
    check('(A) przycisk primary istnieje i jest <button>', m.primary.tag === 'BUTTON', m.primary);
    check('(A) przycisk secondary istnieje i jest <button>', m.secondary.tag === 'BUTTON', m.secondary);
    check('(A) primary NIE ma natywnego wyglądu przeglądarki (szare tło + cursor:default)',
      !isNativeButtonLook(m.primary), m.primary);
    check('(A) secondary NIE ma natywnego wyglądu przeglądarki (szare tło + cursor:default)',
      !isNativeButtonLook(m.secondary), m.secondary);
    check('(A) primary ma język wypełnionego przycisku karty (gradient, radius 8px, uppercase, pointer, padding 18px)',
      isCardButtonLook(m.primary), m.primary);
    check('(A) secondary ma język wypełnionego przycisku karty (gradient, radius 8px, uppercase, pointer, padding 18px)',
      isCardButtonLook(m.secondary), m.secondary);
    check('(A) primary ma realny rozmiar klikalny (nie zapadnięty do zera)',
      m.primary.width > 80 && m.primary.height >= 20, m.primary);

    // --- (C) hierarchia primary vs secondary jest realnie rozróżnialna --------------------
    check('(C) primary = wypełnienie złotym gradientem z tokenu --tg-btn-primary',
      m.primary.bgImage.includes('rgb(240, 220, 136)') && m.primary.bgImage.includes('rgb(185, 154, 40)'),
      m.primary.bgImage);
    check('(C) primary = ciemny atrament na złocie (--tg-btn-primary-ink)',
      m.primary.color === 'rgb(46, 39, 8)', m.primary.color);
    check('(C) secondary = stonowane ciemne tło (nie złoty gradient)',
      m.secondary.bgImage.includes('rgb(22, 28, 40)') && !m.secondary.bgImage.includes('rgb(240, 220, 136)'),
      m.secondary.bgImage);
    check('(C) secondary = złoty tekst (--tg-gold-primary), odwrotnie niż primary',
      m.secondary.color === 'rgb(232, 216, 138)', m.secondary.color);
    check('(C) primary i secondary są WIZUALNIE ROZRÓŻNIALNE (inne tło ORAZ inny kolor tekstu)',
      m.primary.bgImage !== m.secondary.bgImage && m.primary.color !== m.secondary.color,
      { p: [m.primary.bgImage, m.primary.color], s: [m.secondary.bgImage, m.secondary.color] });
    check('(C) primary jest cięższy typograficznie niż secondary (700 vs 600)',
      m.primary.fontWeight === '700' && m.secondary.fontWeight === '600',
      [m.primary.fontWeight, m.secondary.fontWeight]);

    // --- (D) ta sama poprawka działa na ŻYWEJ ścieżce techDiscoveryNotice ------------------
    check('(D) żywy popup odkrycia renderuje 2 przyciski akcji z klasami primary/secondary',
      Array.isArray(m.liveLabels) && m.liveLabels.length === 2
      && m.liveLabels[0][1].includes('entity-card-action-primary')
      && m.liveLabels[1][1].includes('entity-card-action-secondary'), m.liveLabels);
    check('(D) "Rozpocznij badanie" w żywym popupie NIE jest natywnym przyciskiem przeglądarki',
      !isNativeButtonLook(m.livePrimary), m.livePrimary);
    check('(D) "Rozpocznij badanie" w żywym popupie ma pełny język przycisku karty',
      isCardButtonLook(m.livePrimary), m.livePrimary);
    check('(D) "Otwórz drzewo" w żywym popupie ma pełny język przycisku karty',
      isCardButtonLook(m.liveSecondary), m.liveSecondary);

    // Klik nadal działa (nowy `padding`/`box-shadow`/`inline-flex` nie zjadł interakcji ani
    // nie przywrócił regresu `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1`). Hit-test celowo na
    // ŻYWYM popupie, nie na `#civ-test-card` — ta karta leży pod nakładką popupu w tym
    // teście, więc `elementFromPoint` zwracałby tło popupu niezależnie od stylu przycisku.
    // Sam `onClick` sprawdzamy na `#civ-test-card` (`.click()` nie zależy od hit-testu),
    // żeby nie zamknąć popupu przed pomiarem mutacji (E) na jego przyciskach.
    const clicked = await page.evaluate(() => {
      const local = document.querySelector('#civ-test-card button.entity-card-action-primary');
      local.click();
      const host = document.getElementById('civ-tech-discovery-notice-host');
      const live = host.querySelector('.entity-card-actions button.entity-card-action-primary');
      const r = live.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        calls: window.__actionCalls.p,
        hitTag: hit ? hit.tagName : null,
        hitClass: hit ? String(hit.className) : null,
      };
    });
    check('(A) klik na przycisk akcji nadal wywołuje onClick (styl nie zjadł interakcji)',
      clicked.calls === 1, clicked);
    check('(D) elementFromPoint na środku przycisku w żywym popupie trafia w SAM PRZYCISK',
      clicked.hitTag === 'BUTTON' && clicked.hitClass.includes('entity-card-action-primary'), clicked);

    // --- (E) MUTACJA: bez dopisanego bloku CSS te same asercje MUSZĄ oblać ----------------
    console.log('\n-- Mutacja: wycięcie bloku .entity-card-action* z arkuszy --');
    await page.evaluate(({ a, b }) => window.__setFix(false, a, b), { a: MARKER_START, b: MARKER_END });
    const mut = await measure(page);
    check('(E) mutacja: primary WRACA do natywnego wyglądu przeglądarki (test realnie testuje)',
      isNativeButtonLook(mut.primary), mut.primary);
    check('(E) mutacja: secondary WRACA do natywnego wyglądu przeglądarki',
      isNativeButtonLook(mut.secondary), mut.secondary);
    check('(E) mutacja: primary i secondary stają się NIEROZRÓŻNIALNE (znika hierarchia)',
      mut.primary.bgImage === mut.secondary.bgImage && mut.primary.color === mut.secondary.color,
      { p: mut.primary, s: mut.secondary });
    check('(E) mutacja: żywy popup odkrycia też wraca do natywnych przycisków',
      isNativeButtonLook(mut.livePrimary) && isNativeButtonLook(mut.liveSecondary),
      { p: mut.livePrimary, s: mut.liveSecondary });
    await page.evaluate(({ a, b }) => window.__setFix(true, a, b), { a: MARKER_START, b: MARKER_END });
    const restored = await measure(page);
    check('(E) po przywróceniu arkuszy styl wraca (mutacja nie zostawiła strony w złym stanie)',
      isCardButtonLook(restored.primary), restored.primary);

    await page.evaluate(() => window.__hideTechDiscoveryNotice());
    check('brak błędów konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[entity-card-action-buttons-real-render-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
