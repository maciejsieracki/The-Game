'use strict';
/**
 * entity-card-cross-links-button-style-real-render-test.cjs
 *
 * TEMAT: P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1.
 *
 * Zgloszenie wlasciciela: "wszystkie te skroty, ktore sa porobione tekstowe, powinny byc
 * zamienione na przyciski. Przyciski wygladaja bardziej profesjonalnie niz linki."
 *
 * Co pilnuje (w PRAWDZIWYM Chromium, nie w jsdom — jsdom nie ma arkusza UA dla <button>,
 * nie kaskaduje i nie liczy layoutu, wiec `getComputedStyle` jest tam bezuzyteczne;
 * precedens: civpedia-cross-link-style-real-render-test.cjs):
 *
 *  (A) Wszystkie CZTERY klasy linkow krzyzowych renderera
 *      (`.entity-card-row-value`, `.entity-card-row-action-text`, `.entity-card-pill-text`
 *      w kontenerze `.entity-card-pill`, `.entity-card-civpedia-link`) renderuja sie jako
 *      PRZYCISK: widoczna obwodka + niepuste tlo, ZERO `text-decoration: underline`.
 *
 *  (B) HIERARCHIA: przycisk nawigacyjny musi zostac WYRAZNIE lzejszy wizualnie niz
 *      `.entity-card-action-primary` (prawdziwa akcja zmieniajaca stan gry) — inaczej
 *      gracz nie odrozni "zmieniam stan gry" od "ide popatrzec na cos innego".
 *
 *  (C) Trzy niezalezne kopie `.dc-v-btn` w `cityPanel.ts` dostaly ten sam jezyk.
 *
 *  (D) ZERO REGRESU: `.entity-card-action-primary`/`-secondary` oraz odznaki
 *      `.entity-card-row-badge`/`.entity-card-badge` (informacyjne, nieklikalne)
 *      wygladaja dokladnie jak przed tematem.
 *
 *  (E) NAWIGACJA: realny klik mysza w przekonwertowany element nadal otwiera docelowa
 *      karte (zero regresu funkcjonalnego — reskin jest czysto CSS-owy).
 *
 *  (F) `.okolica-info-link` (cityPanel.ts) SWIADOMIE POZA ZAKRESEM — to nie nawigacja do
 *      innej karty encji, tylko przelacznik hover-detail (`attachInteractiveDetail`)
 *      rozwijajacy panel w miejscu. Test przybija dzisiejszy stan (kropkowane
 *      podkreslenie, brak obwodki), zeby przyszla zmiana byla swiadoma, nie przypadkowa.
 *
 *  (G) MUTACJA: po usunieciu nosnej deklaracji obwodki ze wstrzyknietych arkuszy
 *      asercje (A)/(C) MUSZA sczerwieniec — inaczej test niczego nie sprawdza
 *      (precedens P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1).
 *
 * Zrzuty dowodowe: ustaw CIV_SHOTS_DIR=<katalog>, a test zapisze tam PNG-i z zywej strony.
 *
 * Usage (z gra/): node tools/entity-card-cross-links-button-style-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-card-cross-links-button-style] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.entity-card-xlink-button-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-card-xlink-button-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CITY_PANEL = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
const RENDERER = path.resolve(GRA, 'src', 'ui', 'entityCards', 'renderer.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
const SHOTS_DIR = process.env.CIV_SHOTS_DIR ? path.resolve(process.env.CIV_SHOTS_DIR) : null;

// Nosne deklaracje obwodki dopisane przez ten temat — sa jednoczesnie kotwica mutacji (G).
const BORDER_RENDERER = 'border:1px solid rgba(232,216,138,.42)';
const BORDER_CITY = 'border:1px solid rgba(224,178,74,0.45)';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function shot(page, name, opts) {
  if (!SHOTS_DIR) return Promise.resolve();
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  return page.screenshot(Object.assign({ path: path.join(SHOTS_DIR, name) }, opts || {}));
}

function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

/** Vite-owe konstrukcje nie istnieja w golym esbuildzie — inline'ujemy PRAWDZIWE ikony,
 * zeby render byl 1:1 z produkcja (kopia z civpedia-cross-link-style-real-render-test). */
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

/** `cityPanel.ts` nie eksportuje wewnetrznych builderow — dokladamy eksporty przez onLoad,
 * BEZ modyfikowania pliku w repo (kod produkcyjny leci do bundla 1:1). */
const exposeCityPanelPlugin = {
  name: 'expose-city-panel',
  setup(build) {
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== CITY_PANEL) return null;
      return {
        contents: fs.readFileSync(args.path, 'utf8')
          + '\nexport { buildBuildingBuildTabDetailCard as __buildBuildingBuildTabDetailCard,'
          + ' ensureStyles as __ensureCityPanelStyles };\n',
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[entity-card-cross-links-button-style] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Zbiera pomiary wszystkich badanych elementow z zywej strony. */
async function measure(page) {
  return page.evaluate(() => {
    const box = (sel, root) => {
      const el = (root || document).querySelector(sel);
      if (!el) return { missing: true };
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        bg: cs.backgroundColor,
        bgImage: cs.backgroundImage,
        borderTopWidth: cs.borderTopWidth,
        borderTopColor: cs.borderTopColor,
        radius: cs.borderTopLeftRadius,
        color: cs.color,
        decoration: cs.textDecorationLine,
        cursor: cs.cursor,
        fontWeight: cs.fontWeight,
        textTransform: cs.textTransform,
        padLeft: parseFloat(cs.paddingLeft),
        padTop: parseFloat(cs.paddingTop),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    };
    return {
      rowValue: box('#civ-xl-card button.entity-card-row-value'),
      actionText: box('#civ-xl-card button.entity-card-row-action-text'),
      pill: box('#civ-xl-card .entity-card-pill'),
      pillText: box('#civ-xl-card button.entity-card-pill-text'),
      civpediaLink: box('#civ-xl-card button.entity-card-civpedia-link'),
      actionPrimary: box('#civ-xl-card .entity-card-action-primary'),
      actionSecondary: box('#civ-xl-card .entity-card-action-secondary'),
      rowBadge: box('#civ-xl-card .entity-card-row-badge'),
      cardBadge: box('#civ-xl-card .entity-card-badge'),
      // (C) trzy kopie .dc-v-btn
      bldDetailBtn: box('#civ-xl-dock .entity-card.bld-detail-card .dc-v-btn'),
      detailScopeBtn: box('#civ-xl-scope-probe .dc-v-btn'),
      csScopeBtn: box('#civ-xl-cs-probe .dc-v-btn'),
      // (F) poza zakresem
      okolicaLink: box('#civ-xl-cs-probe button.okolica-info-link'),
    };
  });
}

/** Wyglad przycisku: widoczna obwodka + niepuste tlo (kolor LUB gradient) + brak podkreslenia. */
function isButtonLook(s) {
  return !s.missing
    && parseFloat(s.borderTopWidth) >= 1
    && (s.bg !== 'rgba(0, 0, 0, 0)' || (s.bgImage && s.bgImage !== 'none'))
    && !s.decoration.includes('underline')
    && s.cursor === 'pointer';
}

async function main() {
  // --- (0) Statyczne kotwice w zrodle: czytelny sygnal przy regresie ---
  const rendererSrc = fs.readFileSync(RENDERER, 'utf8');
  const citySrc = fs.readFileSync(CITY_PANEL, 'utf8');
  check('(0) ENTITY_CARD_CSS nie stosuje juz text-decoration:underline dla linkow krzyzowych',
    !/button\.entity-card-row-value[\s\S]{0,600}text-decoration:underline/.test(rendererSrc));
  check('(0) ENTITY_CARD_CSS zawiera nosna deklaracje obwodki przycisku nawigacyjnego',
    rendererSrc.includes(BORDER_RENDERER));
  check('(0) cityPanel.ts: DOKLADNIE 3 reguly .dc-v-btn (dwie z reconu + trzecia, .civ-cs .detail-card)',
    (citySrc.match(/\.dc-v-btn\{/g) || []).length === 3,
    (citySrc.match(/\.dc-v-btn\{/g) || []).length);
  check('(0) cityPanel.ts: ZADNA regula .dc-v-btn nie nosi juz text-decoration:underline',
    !/\.dc-v-btn\{[\s\S]{0,600}?text-decoration:underline/.test(citySrc));
  check('(0) .okolica-info-link ZOSTAJE poza zakresem (nadal underline dotted — decyzja w 01-operator.md)',
    /\.okolica-info-link\{[^}]*text-decoration:underline dotted/.test(citySrc));

  fs.writeFileSync(ENTRY, [
    "import { renderEntityCard, openEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
    "import { __buildBuildingBuildTabDetailCard, __ensureCityPanelStyles } from '../src/ui/cityPanel.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    'window.__renderEntityCard = renderEntityCard;',
    'window.__openEntityCard = openEntityCard;',
    'window.__technologyIdFromName = technologyIdFromName;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__buildBuildingBuildTabDetailCard = __buildBuildingBuildTabDetailCard;',
    'window.__ensureCityPanelStyles = __ensureCityPanelStyles;',
    'window.__loadGameData = loadGameData;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, exposeCityPanelPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    // Reset 1:1 z gra/index.html — bez niego pomiar tla/ramki bylby liczony w innym otoczeniu.
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:"Segoe UI",Tahoma,sans-serif;padding:18px;}'
      + '#civ-xl-stage{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;}'
      + '.civ-xl-cap{font:12px monospace;color:#8b97a8;margin-bottom:6px;letter-spacing:.06em;}'
      + '</style></head><body><div id="civ-xl-stage"></div></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = 'entity-card-css-under-test';
      style.textContent = window.__ENTITY_CARD_CSS;
      document.head.appendChild(style);
      const stage = document.getElementById('civ-xl-stage');
      const colOf = (caption) => {
        const col = document.createElement('div');
        const cap = document.createElement('div');
        cap.className = 'civ-xl-cap';
        cap.textContent = caption;
        col.appendChild(cap);
        stage.appendChild(col);
        return col;
      };

      // --- (A)+(B)+(D): karta z WSZYSTKIMI czterema wariantami linku, odznakami ORAZ
      //     prawdziwymi akcjami primary/secondary w tym SAMYM zrzucie (kontrast wagi). ---
      const card = window.__renderEntityCard({
        kind: 'technology', id: 'x', title: 'Gospodarka wodna',
        medallion: { kind: 'icon', svg: '<svg width="34" height="34"></svg>' },
        subtitle: 'Epoka: Starozytnosc',
        badges: undefined,
        sections: [
          { key: 'ulepszenia', title: 'Ulepszenia terenu', rows: [
            { label: 'Nawodnienie', value: 'Szczegoly →', linkTo: { kind: 'improvement', id: 'nawodnienie' } },
            { label: 'Kopalnia', value: 'Szczegoly →', linkTo: { kind: 'improvement', id: 'kopalnia' } },
          ] },
          { key: 'kolejne', title: 'Kolejne technologie', rows: [
            { label: 'Mozesz badac', value: 'Gospodarka wodna', badge: { kind: 'ok', label: 'Mozesz badac' }, linkTo: { kind: 'technology', id: 'gw' } },
            { label: 'Wymaga', value: 'Cegielnictwo', badge: { kind: 'warn', label: 'Wymaga' } },
          ] },
          { key: 'wymagania', title: 'Wymagania', layout: 'pills', rows: [
            { label: 'Rolnictwo', value: '', linkTo: { kind: 'technology', id: 'rolnictwo' } },
            { label: 'Ceramika', value: '' },
          ] },
          { key: 'statusy', title: 'Statusy', rows: [], badges: ['Odblokowana', 'W trakcie'] },
        ],
        civpediaLink: { folder: 'technologie', slug: 'gospodarka-wodna' },
        actions: [
          { id: 'start', kind: 'primary', label: 'Rozpocznij badanie', onClick: () => {} },
          { id: 'tree', kind: 'secondary', label: 'Otworz drzewo', onClick: () => {} },
        ],
      });
      card.id = 'civ-xl-card';
      card.style.width = '380px';
      colOf('A/B/D — linki krzyzowe vs. PRAWDZIWE akcje (primary/secondary)').appendChild(card);

      // --- (C) karta podgladu budynku z panelu budowy (PRAWDZIWY builder cityPanel.ts) ---
      window.__ensureCityPanelStyles();
      const data = window.__loadGameData();
      const def = data.buildings.find((b) => /Palisada drewniana/i.test(b.nazwa)) || data.buildings[0];
      const wrap = document.createElement('div');
      wrap.className = 'civ-cs';
      wrap.style.cssText = 'position:static;display:block;pointer-events:auto;width:432px;padding:0;';
      const scope = document.createElement('div');
      scope.className = 'civ-detail-scope civ-hover-detail-scope';
      const dock = document.createElement('div');
      dock.className = 'civ-hover-detail-content';
      dock.id = 'civ-xl-dock';
      dock.style.cssText = 'width:400px;';
      scope.appendChild(dock); wrap.appendChild(scope);
      colOf('C — panel budowy: "Zobacz pelna karte technologii"').appendChild(wrap);
      dock.appendChild(window.__buildBuildingBuildTabDetailCard(def, data, undefined, {}));

      // --- (C) pozostale DWIE kopie .dc-v-btn + (F) .okolica-info-link, w prawdziwych scope'ach ---
      const col3 = colOf('C/F — .dc-v-btn x2 (inne scope) + .okolica-info-link poza zakresem');
      const probeScope = document.createElement('div');
      probeScope.className = 'civ-detail-scope';
      probeScope.id = 'civ-xl-scope-probe';
      probeScope.innerHTML = '<div class="detail-card"><div class="dc-h">Ulepszenia w zasiegu</div>'
        + '<div class="dc-grid"><span class="dc-l">Nawodnienie</span>'
        + '<button type="button" class="dc-v dc-v-btn">3× — szczegoly →</button></div></div>';
      col3.appendChild(probeScope);
      const csProbe = document.createElement('div');
      csProbe.className = 'civ-cs';
      csProbe.id = 'civ-xl-cs-probe';
      csProbe.style.cssText = 'position:static;display:block;pointer-events:auto;width:400px;margin-top:14px;';
      csProbe.innerHTML = '<div class="detail-card"><div class="dc-h">Ulepszenia w zasiegu</div>'
        + '<div class="dc-grid"><span class="dc-l">Kopalnia</span>'
        + '<button type="button" class="dc-v dc-v-btn">2× — szczegoly →</button></div></div>'
        + '<div class="ptitle" style="display:flex;justify-content:space-between;align-items:baseline;gap:0.35em;margin-top:14px;">'
        + '<span>Zarzadzanie polami</span>'
        + '<button type="button" class="okolica-info-link gold">ℹ szczegoly</button></div>';
      col3.appendChild(csProbe);

      // Przelacznik mutacji (G): usuniecie nosnej deklaracji obwodki ze WSZYSTKICH arkuszy.
      window.__origCss = new Map();
      window.__setFix = (on, bR, bC) => {
        document.querySelectorAll('style').forEach((s) => {
          if (!window.__origCss.has(s)) window.__origCss.set(s, s.textContent);
          const orig = window.__origCss.get(s);
          s.textContent = on ? orig : orig.split(bR).join('border:0').split(bC).join('border:0');
        });
      };
    });

    const m = await measure(page);
    await shot(page, 'shot-01-karty-i-panel.png', { fullPage: true });

    // ---------------- (A) cztery klasy linkow krzyzowych = przycisk ----------------
    check('(A) wiersz grid ".entity-card-row-value" wyglada jak PRZYCISK (obwodka + tlo, bez underline)',
      isButtonLook(m.rowValue), m.rowValue);
    check('(A) wiersz z odznaka ".entity-card-row-action-text" wyglada jak PRZYCISK',
      isButtonLook(m.actionText), m.actionText);
    // RUNDA 1 OBRONA, zarzut 1: pudelko przycisku przeniesione z NIEKLIKALNEGO kontenera
    // `.entity-card-pill` na KLIKALNY `button.entity-card-pill-text`. Asercje odwrocone.
    check('(A) pigulka ".entity-card-pill-text" (sam <button>) wyglada jak PRZYCISK',
      isButtonLook(m.pillText), m.pillText);
    check('(A) kontener ".entity-card-pill" linku NIE maluje juz pudelka ani cursor:pointer'
      + ' (byl nieklikalny — martwa strefa)',
      !m.pill.missing && parseFloat(m.pill.borderTopWidth) === 0
      && m.pill.bg === 'rgba(0, 0, 0, 0)' && m.pill.bgImage === 'none'
      && m.pill.cursor !== 'pointer', m.pill);
    check('(A) stopka ".entity-card-civpedia-link" wyglada jak PRZYCISK',
      isButtonLook(m.civpediaLink), m.civpediaLink);
    check('(A) ZERO text-decoration:underline na wszystkich czterech klasach',
      [m.rowValue, m.actionText, m.pillText, m.civpediaLink].every((s) => !s.missing && !s.decoration.includes('underline')),
      [m.rowValue.decoration, m.actionText.decoration, m.pillText.decoration, m.civpediaLink.decoration]);
    check('(A) wiersz z odznaka NIE rozciaga sie na cala szerokosc karty (flex:1 zneutralizowane)',
      m.actionText.width > 0 && m.actionText.width < 300, m.actionText.width);

    // ---------------- (B) hierarchia wobec prawdziwej akcji primary ----------------
    check('(B) primary jest wyraznie ciezszy: grubszy font niz przycisk nawigacyjny',
      parseInt(m.actionPrimary.fontWeight, 10) > parseInt(m.rowValue.fontWeight, 10),
      { primary: m.actionPrimary.fontWeight, nav: m.rowValue.fontWeight });
    check('(B) primary jest UPPERCASE, przycisk nawigacyjny NIE jest',
      m.actionPrimary.textTransform === 'uppercase' && m.rowValue.textTransform !== 'uppercase',
      { primary: m.actionPrimary.textTransform, nav: m.rowValue.textTransform });
    check('(B) primary ma wyrazniejszy padding poziomy niz przycisk nawigacyjny',
      m.actionPrimary.padLeft > m.rowValue.padLeft, { primary: m.actionPrimary.padLeft, nav: m.rowValue.padLeft });
    check('(B) primary ma INNE (jasne, zlote) wypelnienie niz ciemne tlo przycisku nawigacyjnego',
      m.actionPrimary.bgImage !== m.rowValue.bgImage && /240, 220, 136|f0dc88/i.test(m.actionPrimary.bgImage),
      { primary: m.actionPrimary.bgImage, nav: m.rowValue.bgImage });
    check('(B) secondary ma grubsza (2px) obwodke niz przycisk nawigacyjny (1px) — trzy szczeble skali',
      parseFloat(m.actionSecondary.borderTopWidth) > parseFloat(m.rowValue.borderTopWidth),
      { secondary: m.actionSecondary.borderTopWidth, nav: m.rowValue.borderTopWidth });

    // ---------------- (C) trzy kopie .dc-v-btn ----------------
    check('(C) cityPanel: ".entity-card.bld-detail-card .dc-v-btn" wyglada jak PRZYCISK',
      isButtonLook(m.bldDetailBtn), m.bldDetailBtn);
    check('(C) cityPanel: ".civ-detail-scope .detail-card .dc-v-btn" wyglada jak PRZYCISK',
      isButtonLook(m.detailScopeBtn), m.detailScopeBtn);
    check('(C) cityPanel: ".civ-cs .detail-card .dc-v-btn" (kopia pominieta w reconie) wyglada jak PRZYCISK',
      isButtonLook(m.csScopeBtn), m.csScopeBtn);

    // ---------------- (D) zero regresu poza zakresem ----------------
    check('(D) ".entity-card-action-primary" NIEZMIENIONY (700, uppercase, padding 7px 18px)',
      m.actionPrimary.fontWeight === '700' && m.actionPrimary.textTransform === 'uppercase'
      && m.actionPrimary.padLeft === 18 && m.actionPrimary.padTop === 7, m.actionPrimary);
    check('(D) ".entity-card-action-secondary" NIEZMIENIONY (600, uppercase, 2px obwodka)',
      m.actionSecondary.fontWeight === '600' && m.actionSecondary.textTransform === 'uppercase'
      && m.actionSecondary.borderTopWidth === '2px', m.actionSecondary);
    check('(D) odznaka ".entity-card-row-badge" (informacyjna) BEZ obwodki i z pigulkowym radiusem',
      !m.rowBadge.missing && parseFloat(m.rowBadge.borderTopWidth) === 0
      && parseFloat(m.rowBadge.radius) > 100, m.rowBadge);
    check('(D) odznaka ".entity-card-badge" (informacyjna) BEZ obwodki i z pigulkowym radiusem',
      !m.cardBadge.missing && parseFloat(m.cardBadge.borderTopWidth) === 0
      && parseFloat(m.cardBadge.radius) > 100, m.cardBadge);

    // ---------------- (F) .okolica-info-link poza zakresem ----------------
    check('(F) ".okolica-info-link" ZOSTAJE linkiem (kropkowane podkreslenie, brak obwodki) — swiadoma decyzja',
      !m.okolicaLink.missing && m.okolicaLink.decoration.includes('underline')
      && parseFloat(m.okolicaLink.borderTopWidth) === 0, m.okolicaLink);

    // ---------------- (E) realny klik mysza nadal nawiguje ----------------
    await page.evaluate(() => {
      document.getElementById('civ-xl-stage').style.display = 'none';
      const slug = window.__technologyIdFromName('Hutnictwo zelaza') || window.__technologyIdFromName('Hutnictwo żelaza');
      window.__openEntityCard('technology', slug, { mode: 'dialog' });
    });
    const linkHit = await page.evaluate(() => {
      // Celowo z NIEPUSTYM tekstem: wiersze Budynki/Jednostki karty technologii maja puste
      // row.value (ECHO R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1) i sa klikalne
      // przez fallback calego wiersza — ich przycisk zostaje niewidzialny z zalozenia.
      const btn = Array.from(document.querySelectorAll('.entity-card-backdrop button[data-entity-kind]'))
        .find((b) => b.textContent.trim().length > 0);
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      const cs = getComputedStyle(btn);
      return {
        cx: r.left + r.width / 2, cy: r.top + r.height / 2,
        kind: btn.getAttribute('data-entity-kind'), id: btn.getAttribute('data-entity-id'),
        border: cs.borderTopWidth, decoration: cs.textDecorationLine,
        hit: (() => { const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e ? e.tagName : null; })(),
      };
    });
    check('(E) prawdziwa karta z danych gry ma klikalny przycisk krzyzowy w stylu przycisku',
      !!linkHit && parseFloat(linkHit.border) >= 1 && !linkHit.decoration.includes('underline'), linkHit);
    if (linkHit) {
      check('(E) elementFromPoint na srodku przycisku trafia w SAM PRZYCISK (padding nie przesloniety)',
        linkHit.hit === 'BUTTON', linkHit);
      await shot(page, 'shot-02-nawigacja-przed-klikiem.png');
      await page.mouse.click(linkHit.cx, linkHit.cy);
      const nav = await page.evaluate(() => {
        const bds = Array.from(document.querySelectorAll('.entity-card-backdrop'));
        const top = bds[bds.length - 1]?.querySelector('.entity-card');
        return { backdrops: bds.length, kind: top?.getAttribute('data-entity-kind') ?? null, id: top?.getAttribute('data-entity-id') ?? null };
      });
      check('(E) klik otwiera ZAGNIEZDZONA karte docelowa — zero regresu nawigacji',
        nav.backdrops === 2 && nav.kind === linkHit.kind && nav.id === linkHit.id, nav);
      await shot(page, 'shot-03-nawigacja-po-kliku.png');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
    }
    await page.evaluate(() => { document.getElementById('civ-xl-stage').style.display = ''; });

    // ---------------- (H) ZERO MARTWEJ STREFY (RUNDA 1 OBRONA, zarzut 1) ----------------
    // Kazdy element, ktory MALUJE pudelko przycisku (obwodka + wypelnienie + cursor:pointer),
    // musi byc w calej swojej powierzchni klikalny — czyli `document.elementFromPoint` w
    // czterech naroznikach (wciecie 2px, wewnatrz obwodki) i w srodku musi trafiac w element,
    // ktorego `closest('button[data-entity-kind]')` NIE jest nullem. To dokladnie ta sama
    // delegacja, ktora obsluguje nawigacje (`renderEntityCard`). Zarzut mierzyl 88,1x22,2 px
    // pomalowanej pigulki wobec 52,0x16,2 px klikalnego tekstu — ta asercja to lapie.
    const deadZones = await page.evaluate(() => {
      const out = [];
      const roots = document.querySelectorAll('#civ-xl-card, .entity-card-backdrop, #civ-xl-dock, #civ-xl-cs-probe, #civ-xl-scope-probe');
      for (const root of roots) {
        for (const el of root.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          const painted = parseFloat(cs.borderTopWidth) >= 1
            && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none')
            && cs.cursor === 'pointer';
          if (!painted) continue;
          // interesuja nas WYLACZNIE przyciski nawigacji krzyzowej i ich kontenery
          const isNav = el.matches('button[data-entity-kind]')
            || el.querySelector(':scope > button[data-entity-kind]') != null;
          if (!isNav) continue;
          // przewijamy w pole widzenia — elementFromPoint zwraca null poza viewportem,
          // co udawaloby martwa strefe tam, gdzie jej nie ma
          el.scrollIntoView({ block: 'center', inline: 'center' });
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          if (r.top < 0 || r.left < 0 || r.bottom > innerHeight || r.right > innerWidth) continue;
          // SRODKI KRAWEDZI (2px do wewnatrz) + srodek. Celowo NIE naroza: przy
          // border-radius:8px punkt 2px od rogu lezy POZA zaokraglonym ksztaltem, wiec
          // trafialby w rodzica i falszywie raportowal martwa strefe. Srodki krawedzi
          // leza zawsze wewnatrz i lapia dokladnie ten defekt, ktorego dotyczyl zarzut:
          // poziomy/pionowy padding pomalowanego pudelka nieodbierajacy klikniecia.
          const pts = [
            [r.left + 2, r.top + r.height / 2], [r.right - 2, r.top + r.height / 2],
            [r.left + r.width / 2, r.top + 2], [r.left + r.width / 2, r.bottom - 2],
            [r.left + r.width / 2, r.top + r.height / 2],
          ];
          const misses = pts.filter(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return hit == null || hit.closest('button[data-entity-kind]') == null;
          }).length;
          out.push({
            cls: el.className, tag: el.tagName,
            w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, misses,
          });
        }
      }
      return out;
    });
    check('(H) kazdy pomalowany przycisk nawigacyjny jest klikalny w CALEJ powierzchni'
      + ' (4 srodki krawedzi + srodek, zero martwej strefy)',
      deadZones.length > 0 && deadZones.every((z) => z.misses === 0), deadZones);
    check('(H) probka objela realne przyciski nawigacyjne (asercja nie jest pusta)',
      deadZones.length >= 3, deadZones.length);

    // ---------------- (G) MUTACJA ----------------
    console.log('\n-- Mutacja: usuniecie nosnej deklaracji obwodki z arkuszy --');
    await page.evaluate(({ bR, bC }) => window.__setFix(false, bR, bC), { bR: BORDER_RENDERER, bC: BORDER_CITY });
    const mut = await measure(page);
    await shot(page, 'shot-04-mutacja.png', { fullPage: true });
    check('(G) mutacja: ".entity-card-row-value" PRZESTAJE wygladac jak przycisk (test realnie testuje)',
      !isButtonLook(mut.rowValue), mut.rowValue);
    check('(G) mutacja: ".entity-card-pill-text" PRZESTAJE wygladac jak przycisk',
      !isButtonLook(mut.pillText), mut.pillText);
    check('(G) mutacja: ".civ-cs .detail-card .dc-v-btn" PRZESTAJE wygladac jak przycisk',
      !isButtonLook(mut.csScopeBtn), mut.csScopeBtn);
    await page.evaluate(({ bR, bC }) => window.__setFix(true, bR, bC), { bR: BORDER_RENDERER, bC: BORDER_CITY });

    check('brak bledow konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[entity-card-cross-links-button-style] ${pass} pass, ${fail} fail`);
  if (SHOTS_DIR) console.log('[entity-card-cross-links-button-style] zrzuty: ' + SHOTS_DIR);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
