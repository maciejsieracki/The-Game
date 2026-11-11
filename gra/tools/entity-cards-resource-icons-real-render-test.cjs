'use strict';
/**
 * entity-cards-resource-icons-real-render-test.cjs
 *
 * TEMAT: R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1.
 *
 * Realny render (Chromium, prawdziwy `renderEntityCard` + prawdziwe adaptery i dane) kart
 * budynku, ulepszenia terenu, jednostki i technologii:
 *  1. Wiersze kosztu/utrzymania/surowców niosą chipy `.bld-res-chip` z ikoną SVG, a widoczny
 *     tekst komórki wartości NIE zawiera nazwy żadnego surowca (nazwa tylko w title/aria-label).
 *  2. Układ: komórka z chipami nie wychodzi poza kartę (brak poziomego przepełnienia).
 *  3. Bezpieczeństwo: kwota `<img src=x onerror=…>` z danych NIE tworzy elementu <img> ani
 *     nie wykonuje skryptu (renderer escapuje `amount`, `value` idzie przez text node).
 *  4. Zrzuty (ENTITYCARD_RESOURCE_ICONS_SHOTS_DIR), jeśli ustawiono zmienną.
 *
 * Uruchomienie (z gra/): node tools/entity-cards-resource-icons-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-cards-resource-icons-real-render] playwright missing — npm ci, then install Chromium');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.entity-cards-resource-icons-rr-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-cards-resource-icons-rr-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS_DIR = process.env.ENTITYCARD_RESOURCE_ICONS_SHOTS_DIR
  ? path.resolve(process.env.ENTITYCARD_RESOURCE_ICONS_SHOTS_DIR) : null;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function listSvgs(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) listSvgs(file, prefix + entry.name + '/', out);
    else if (entry.name.endsWith('.svg')) out[prefix + entry.name] = fs.readFileSync(file, 'utf8');
  }
  return out;
}

const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'),
      loader: 'text',
    }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      const expected = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
      if (path.resolve(args.path) !== expected) return null;
      const source = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(path.resolve(GRA, 'src', 'ui', 'icons', 'brand'), './brand/', {})),
      );
      return { contents: source, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const source = fs.readFileSync(args.path, 'utf8');
      if (!source.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + source.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (error) {
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { renderEntityCard, buildEntityCardData, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { ensureBrandRootTokens } from '../src/ui/brandTokenVars.ts';",
    "import { STOCK_RESOURCE_LABEL } from '../src/game/building-stock-cost.ts';",
    "import { technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
    'window.__C = { renderEntityCard, buildEntityCardData, ENTITY_CARD_CSS, ensureBrandRootTokens, STOCK_RESOURCE_LABEL, technologyIdFromName };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: [viteCompatPlugin], logLevel: 'silent',
  });

  const units = readJson('units.json');
  const unitRows = Array.isArray(units) ? units : (units.jednostki || []);
  const wojownik = unitRows.find((u) => u['Jednostka'] === 'Wojownik' || u['Nazwa'] === 'Wojownik');
  check('fixture: units.json ma Wojownika z Surowiec', !!wojownik && !!wojownik['Surowiec'], wojownik && wojownik['Surowiec']);

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:sans-serif;padding:12px;}'
      + '.host{width:680px;margin-bottom:16px;}</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
    await page.evaluate(() => {
      window.__C.ensureBrandRootTokens();
      const st = document.createElement('style');
      st.textContent = window.__C.ENTITY_CARD_CSS;
      document.head.appendChild(st);
    });

    // Rodzaje i id: budynek ze stock-kosztem i utrzymaniem surowców, ulepszenie, jednostka, technologia.
    const stockBuilding = readJson('buildings.json').find((b) => b.koszt_surowce && Object.keys(b.koszt_surowce).length > 0);
    const techWithAccess = (readJson('tech.json').technologie || []).find((t) => t['Dostęp do surowca.'] && /drewn|kamien|glin|braz|zelaz/i.test(String(t['Dostęp do surowca.']).normalize('NFD').replace(/[̀-ͯ]/g, '')));
    check('fixture: istnieje budynek z koszt_surowce i technologia z „Dostęp do surowca."', !!stockBuilding && !!techWithAccess,
      { b: stockBuilding && stockBuilding.id, t: techWithAccess && techWithAccess.Technologia });

    const result = await page.evaluate(({ buildingId, techName, unitName }) => {
      const C = window.__C;
      const names = [...new Set(Object.values(C.STOCK_RESOURCE_LABEL).map((s) => s.replace(/\s*\(surowiec\)/, '')))];
      const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const out = [];
      const cases = [
        ['building', buildingId], ['improvement', 'tartak'], ['improvement', 'kopalnia_zelaza'],
        ['unit', slug(unitName)], ['technology', C.technologyIdFromName(techName)],
      ];
      for (const [kind, id] of cases) {
        const data = C.buildEntityCardData(kind, id, {});
        if (!data) { out.push({ kind, id, missing: true }); continue; }
        // Medalion 3D jednostki wymaga WebGL — w teście zastępujemy go ikoną (reszta karty = prawdziwy render).
        if (data.medallion && data.medallion.kind === 'unit3d') data.medallion = { kind: 'icon', svg: '<svg width="34" height="34"></svg>' };
        const host = document.createElement('div');
        host.className = 'host';
        host.setAttribute('data-case', kind + ':' + id);
        const card = C.renderEntityCard(data);
        host.appendChild(card);
        document.body.appendChild(host);
        const chipRows = [...card.querySelectorAll('.entity-card-row')].filter((r) => r.querySelector('.bld-res-chip'));
        const rows = chipRows.map((r) => {
          const val = r.querySelector('.entity-card-row-value');
          const clone = val.cloneNode(true);
          clone.querySelectorAll('.bld-res-chip-ic').forEach((n) => n.remove());
          const visible = clone.textContent;
          const rect = val.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          return {
            label: (r.querySelector('.entity-card-row-key') || {}).textContent,
            visibleText: visible,
            chips: val.querySelectorAll('.bld-res-chip').length,
            svgs: val.querySelectorAll('.bld-res-chip-ic svg').length,
            textIcons: val.querySelectorAll('.bld-res-chip-ic--text').length,
            titles: [...val.querySelectorAll('.bld-res-chip-ic')].map((n) => n.getAttribute('title')),
            aria: [...val.querySelectorAll('.bld-res-chip-ic')].map((n) => n.getAttribute('aria-label')),
            bareName: names.filter((n) => new RegExp('(^|[^\\p{L}])' + n.toLocaleLowerCase('pl') + '($|[^\\p{L}])', 'u').test(visible.toLocaleLowerCase('pl'))),
            overflow: rect.right > cardRect.right + 0.5,
            hOverflow: val.scrollWidth > val.clientWidth + 1,
          };
        });
        out.push({ kind, id, rows, cardOverflowX: card.scrollWidth > card.clientWidth + 1 });
      }
      return out;
    }, { buildingId: stockBuilding.id, techName: techWithAccess.Technologia, unitName: 'Wojownik' });

    for (const c of result) {
      check(`${c.kind}:${c.id} — karta zbudowana z prawdziwych danych`, !c.missing, c);
      if (c.missing) continue;
      check(`${c.kind}:${c.id} — co najmniej jeden wiersz z chipami surowców (ikona + liczba)`, c.rows.length > 0, c.rows.length);
      for (const r of c.rows) {
        check(`${c.kind}:${c.id} „${r.label}" — chipy mają ikonę SVG (nie tekstowy fallback)`,
          r.chips > 0 && r.svgs === r.chips && r.textIcons === 0, r);
        check(`${c.kind}:${c.id} „${r.label}" — widoczny tekst bez nazwy surowca (nazwa tylko w title/aria-label)`,
          r.bareName.length === 0 && r.titles.every(Boolean) && r.titles.join() === r.aria.join(), r);
        check(`${c.kind}:${c.id} „${r.label}" — komórka nie wychodzi poza kartę`, !r.overflow && !r.hOverflow, r);
      }
      check(`${c.kind}:${c.id} — brak poziomego przepełnienia karty`, !c.cardOverflowX, c.cardOverflowX);
    }

    // --- Bezpieczeństwo: kwota z HTML-em oraz value z HTML-em ------------------------------------
    const xss = await page.evaluate(() => {
      window.__xss = 0;
      const data = {
        kind: 'building', id: 'xss-test', title: 'XSS', medallion: { kind: 'icon', svg: '<svg width="10" height="10"></svg>' },
        sections: [{
          key: 'cost-build', title: 'Koszt',
          rows: [{
            label: 'Surowce', value: '<img src=x onerror="window.__xss=1">tekst',
            resources: [{ id: 'drewno', amount: '<img src=x onerror="window.__xss=2">5' }],
            resourcesSuffix: '<b onmouseover="window.__xss=3">sufiks</b>',
          }],
        }],
      };
      const host = document.createElement('div');
      host.className = 'host';
      const card = window.__C.renderEntityCard(data);
      host.appendChild(card);
      document.body.appendChild(host);
      return new Promise((resolve) => setTimeout(() => resolve({
        imgs: card.querySelectorAll('.entity-card-row img').length,
        bolds: card.querySelectorAll('.entity-card-row b').length,
        xss: window.__xss,
        text: card.querySelector('.entity-card-row-value').textContent,
      }), 150));
    });
    check('XSS: żaden <img>/<b> nie powstaje z value/amount/resourcesSuffix', xss.imgs === 0 && xss.bolds === 0, xss);
    check('XSS: skrypt z atrybutu nie wykonał się', xss.xss === 0, xss);
    check('XSS: dane z HTML-em są widoczne jako zwykły tekst', xss.text.includes('<img') && xss.text.includes('<b onmouseover'), xss.text);

    if (SHOTS_DIR) {
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS_DIR, 'entitycards-resource-icons.png'), fullPage: true });
      for (const c of result.filter((x) => !x.missing)) {
        const el = await page.$(`[data-case="${c.kind}:${c.id}"]`);
        if (el) await el.screenshot({ path: path.join(SHOTS_DIR, `karta-${c.kind}-${c.id}.png`) });
      }
    }
    check('brak błędów strony/konsoli', errors.length === 0, errors.slice(0, 5));
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }
  console.log(`\n[entity-cards-resource-icons-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[entity-cards-resource-icons-real-render-test] błąd:', err);
  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(OUTFILE, { force: true });
  process.exit(1);
});
