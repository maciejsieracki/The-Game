'use strict';
/**
 * entity-cards-yield-icons-real-render-test.cjs
 *
 * TEMAT: R-WEB-UI-RESOURCE-ICONS-YIELDS-WONDERS-Q1 (plony i bonusy cudów jako chipy ikona+liczba).
 *
 * Realny render (Chromium, prawdziwy `renderEntityCard` + prawdziwe adaptery i dane) kart
 * budynku, ulepszenia terenu, jednostki i technologii:
 *  1. Wiersze kosztu/utrzymania/surowców niosą chipy `.bld-res-chip` z ikoną SVG, a widoczny
 *     tekst komórki wartości NIE zawiera nazwy żadnego surowca (nazwa tylko w title/aria-label).
 *  2. Układ: komórka z chipami nie wychodzi poza kartę (brak poziomego przepełnienia).
 *  3. Bezpieczeństwo: kwota `<img src=x onerror=…>` z danych NIE tworzy elementu <img> ani
 *     nie wykonuje skryptu (renderer escapuje `amount`, `value` idzie przez text node).
 *  4. Zrzuty (ENTITYCARD_YIELD_ICONS_SHOTS_DIR), jeśli ustawiono zmienną.
 *
 * Uruchomienie (z gra/): node tools/entity-cards-yield-icons-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-cards-yield-icons-real-render] playwright missing — npm ci, then install Chromium');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.entity-cards-yield-icons-rr-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-cards-yield-icons-rr-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS_DIR = process.env.ENTITYCARD_YIELD_ICONS_SHOTS_DIR
  ? path.resolve(process.env.ENTITYCARD_YIELD_ICONS_SHOTS_DIR) : null;

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


    const wonders = (readJson('wonders.json').cuda || []);
    const wonderTeren = wonders.find((w) => (w.bonusy && w.bonusy.teren || []).some((t) => Object.keys(t).filter((k) => typeof t[k] === 'number').length >= 2));
    const wonderMiasto = wonders.find((w) => w.bonusy && w.bonusy.miasto && Object.values(w.bonusy.miasto).some((v) => typeof v === 'number' && v !== 0));
    const bldYield = readJson('buildings.json').find((b) => b.baza && b.baza.zywnosc > 0 && b.utrzymanie > 0) || readJson('buildings.json').find((b) => b.baza && b.baza.praca > 0);
    check('fixture: cud z bonusem terenowym (>=2 plony), cud z bonusem miasta, budynek z plonem',
      !!wonderTeren && !!wonderMiasto && !!bldYield, { t: wonderTeren && wonderTeren.id, m: wonderMiasto && wonderMiasto.id, b: bldYield && bldYield.id });

    const YIELD_NAMES = ['Żywność', 'Praca', 'Pracy', 'Kultura', 'Nauka', 'Wiara', 'Podatek', 'Pieniądz', 'Pieniądze', 'Pieniądza', 'Drewno', 'Kamień'];
    const result = await page.evaluate(({ cases, yieldNames }) => {
      const C = window.__C;
      const out = [];
      for (const [kind, id] of cases) {
        const data = C.buildEntityCardData(kind, id, {});
        if (!data) { out.push({ kind, id, missing: true }); continue; }
        if (data.medallion && data.medallion.kind === 'unit3d') data.medallion = { kind: 'icon', svg: '<svg width="34" height="34"></svg>' };
        const host = document.createElement('div');
        host.className = 'host';
        host.setAttribute('data-case', kind + ':' + id);
        const card = C.renderEntityCard(data);
        host.appendChild(card);
        document.body.appendChild(host);
        const rows = [...card.querySelectorAll('.entity-card-row')].filter((r) => r.querySelector('.bld-res-chip')).map((r) => {
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
            bareName: yieldNames.filter((n) => new RegExp('(^|[^\\p{L}])' + n.toLocaleLowerCase('pl') + '($|[^\\p{L}])', 'u').test(visible.toLocaleLowerCase('pl'))),
            overflow: rect.right > cardRect.right + 0.5,
            hOverflow: val.scrollWidth > val.clientWidth + 1,
          };
        });
        out.push({ kind, id, rows, cardOverflowX: card.scrollWidth > card.clientWidth + 1 });
      }
      return out;
    }, {
      yieldNames: YIELD_NAMES,
      cases: [
        ['wonder', wonderTeren.id], ['wonder', wonderMiasto.id], ['building', bldYield.id],
        ['improvement', 'farma'], ['improvement', 'tartak'], ['improvement', 'droga'],
        ['unit', 'wojownik'],
      ],
    });

    for (const c of result) {
      check(`${c.kind}:${c.id} — karta zbudowana z prawdziwych danych`, !c.missing, c);
      if (c.missing) continue;
      if (c.kind !== 'unit') check(`${c.kind}:${c.id} — co najmniej jeden wiersz z chipami (ikona + liczba)`, c.rows.length > 0, c.rows.length);
      for (const r of c.rows) {
        check(`${c.kind}:${c.id} „${r.label}" — chipy mają ikonę SVG (nie tekstowy fallback)`,
          r.chips > 0 && r.svgs === r.chips && r.textIcons === 0, r);
        check(`${c.kind}:${c.id} „${r.label}" — widoczny tekst wartości bez nazwy plonu/surowca (nazwa tylko w title/aria-label)`,
          r.bareName.length === 0 && r.titles.every(Boolean) && r.titles.join() === r.aria.join(), r);
        check(`${c.kind}:${c.id} „${r.label}" — komórka nie wychodzi poza kartę`, !r.overflow && !r.hOverflow, r);
      }
      check(`${c.kind}:${c.id} — brak poziomego przepełnienia karty`, !c.cardOverflowX, c.cardOverflowX);
    }
    const wt = result.find((c) => c.kind === 'wonder' && c.id === wonderTeren.id);
    check('cud (teren): wiersz „Teren (…)" ma >= 2 chipów z kwotami',
      !!wt && wt.rows.some((r) => /^Teren/.test(r.label) && r.chips >= 2), wt && wt.rows);
    const titlesAll = new Set(result.flatMap((c) => (c.rows || []).flatMap((r) => r.titles)));
    check('ikony plonów: w kartach występują tytuły Praca i Drewno (lub Żywność/Podatek) z ikoną marki',
      ['Praca', 'Żywność', 'Podatek', 'Kultura', 'Nauka'].some((t) => titlesAll.has(t)), [...titlesAll]);

    // --- Runda 2: Top 5 (tytuły) i „Co możesz teraz zrobić" (zdania) jako chipy — PRAWDZIWE karty ---------------
    const top5Cases = [['building', 'stolarnia'], ['building', 'kuznia'], ['building', 'targowisko'], ['building', 'biblioteka'],
      ['technology', 'rolnictwo'], ['technology', 'waluta'], ['technology', 'obrobka-drewna'], ['technology', 'gospodarka-wodna']];
    const top5Res = await page.evaluate(({ cases, names }) => {
      const C = window.__C;
      const out = [];
      for (const [kind, rawId] of cases) {
        const id = kind === 'technology' ? (C.technologyIdFromName(rawId.replace(/-/g, ' ')) || rawId) : rawId;
        const data = C.buildEntityCardData(kind, id, {});
        if (!data) { out.push({ kind, id: rawId, missing: true }); continue; }
        const host = document.createElement('div');
        host.className = 'host';
        host.setAttribute('data-case', 'top5:' + kind + ':' + rawId);
        const card = C.renderEntityCard(data);
        host.appendChild(card);
        document.body.appendChild(host);
        const bare = (el) => {
          const clone = el.cloneNode(true);
          clone.querySelectorAll('.bld-res-chip-ic').forEach((n) => n.remove());
          const low = clone.textContent.toLocaleLowerCase('pl');
          return names.filter((n) => new RegExp('(^|[^\\p{L}])' + n.toLocaleLowerCase('pl') + '($|[^\\p{L}])', 'u').test(low));
        };
        const info = (el) => ({
          chips: el.querySelectorAll('.bld-res-chip').length,
          svgs: el.querySelectorAll('.bld-res-chip-ic svg').length,
          textIcons: el.querySelectorAll('.bld-res-chip-ic--text').length,
          titles: [...el.querySelectorAll('.bld-res-chip-ic')].map((n) => n.getAttribute('title')),
          aria: [...el.querySelectorAll('.bld-res-chip-ic')].map((n) => n.getAttribute('aria-label')),
          bare: bare(el),
          overflow: el.getBoundingClientRect().right > card.getBoundingClientRect().right + 0.5,
        });
        out.push({
          kind, id: rawId,
          titles: [...card.querySelectorAll('[data-section-key="top5"] .entity-card-top3-title')].map(info),
          actions: [...card.querySelectorAll('[data-section-key="actions"] .entity-card-prose')].map(info),
          cardOverflowX: card.scrollWidth > card.clientWidth + 1,
        });
      }
      return out;
    }, { cases: top5Cases, names: YIELD_NAMES.concat(['Żywności', 'Kultury', 'Nauki', 'Wiary', 'Podatku', 'Drewna', 'Kamienia']) });
    for (const c of top5Res) {
      check(`Top5/actions ${c.kind}:${c.id} — karta zbudowana z prawdziwych danych`, !c.missing, c);
      if (c.missing) continue;
      const withChips = c.titles.filter((t) => t.chips > 0);
      check(`Top5 ${c.kind}:${c.id} — co najmniej jeden TYTUŁ z chipem (ikona SVG, nie tekst)`,
        withChips.length > 0 && withChips.every((t) => t.svgs === t.chips && t.textIcons === 0), c.titles);
      check(`Top5 ${c.kind}:${c.id} — w tytułach brak gołych nazw plonów/surowców (nazwa tylko w title/aria-label)`,
        c.titles.every((t) => t.bare.length === 0 && t.titles.every(Boolean) && t.titles.join() === t.aria.join()), c.titles);
      check(`actions ${c.kind}:${c.id} — zdania „Co możesz teraz zrobić": chipy z ikoną SVG, brak gołych nazw`,
        c.actions.length > 0 && c.actions.every((t) => t.bare.length === 0 && t.svgs === t.chips && t.textIcons === 0), c.actions);
      check(`Top5/actions ${c.kind}:${c.id} — brak przepełnienia poziomego`,
        !c.cardOverflowX && c.titles.every((t) => !t.overflow) && c.actions.every((t) => !t.overflow), c);
    }
    check('actions: zdania z chipami występują w prawdziwych kartach (>= 8 zdań w badanych kartach)',
      top5Res.flatMap((c) => c.actions || []).filter((t) => t.chips > 0).length >= 8,
      top5Res.map((c) => (c.actions || []).filter((t) => t.chips > 0).length));
    if (SHOTS_DIR) {
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      for (const c of top5Res.filter((x) => !x.missing)) {
        const el = await page.$(`[data-case="top5:${c.kind}:${c.id}"]`);
        if (el) await el.screenshot({ path: path.join(SHOTS_DIR, `karta-top5-${c.kind}-${c.id}.png`) });
      }
    }
    // XSS w tytule Top 5 (labelParts) i w prozie „actions" (valueParts) — kwota/tekst jako zwykły tekst.
    const xss2 = await page.evaluate(() => {
      window.__xss2 = 0;
      const data = {
        kind: 'building', id: 'xss-top5', title: 'XSS2', medallion: { kind: 'icon', svg: '<svg width="10" height="10"></svg>' },
        sections: [{
          key: 'top5', title: 'Top 5', layout: 'top3',
          rows: [{ label: 'x', value: '<img src=x onerror="window.__xss2=1">zdanie',
            labelParts: ['<img src=x onerror="window.__xss2=2">', { id: 'praca', amount: '<b onmouseover="window.__xss2=3">+5</b>' }, ' <u>w mieście</u>'] }],
        }, {
          key: 'actions', title: 'Co możesz teraz zrobić', layout: 'prose',
          rows: [{ label: '', value: 'x', valueParts: ['<img src=x onerror="window.__xss2=4">', { id: 'drewno', amount: '<i onclick="window.__xss2=5">10%</i>' }] }],
        }],
      };
      const host = document.createElement('div');
      host.className = 'host';
      const card = window.__C.renderEntityCard(data);
      host.appendChild(card);
      document.body.appendChild(host);
      return new Promise((resolve) => setTimeout(() => resolve({
        imgs: card.querySelectorAll('img').length,
        injected: card.querySelectorAll('.entity-card-top3-title b, .entity-card-top3-title u, .entity-card-prose i, .entity-card-prose u').length,
        xss: window.__xss2,
        title: card.querySelector('.entity-card-top3-title').textContent,
        prose: card.querySelector('.entity-card-prose').textContent,
        titleChips: card.querySelectorAll('.entity-card-top3-title .bld-res-chip').length,
        proseChips: card.querySelectorAll('.entity-card-prose .bld-res-chip').length,
      }), 150));
    });
    check('XSS Top 5/actions: żaden <img>/<b>/<i>/<u> nie powstaje, skrypt się nie wykonał',
      xss2.imgs === 0 && xss2.injected === 0 && xss2.xss === 0, xss2);
    check('XSS Top 5/actions: dane z HTML-em widoczne jako zwykły tekst, chipy nadal są',
      xss2.title.includes('<img') && xss2.title.includes('<b onmouseover') && xss2.title.includes('<u>w mieście</u>')
        && xss2.prose.includes('<img') && xss2.prose.includes('<i onclick') && xss2.titleChips === 1 && xss2.proseChips === 1, xss2);

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
          }, {
            label: 'Proza', value: 'x',
            valueParts: ['<img src=x onerror="window.__xss=4">', { id: 'praca', amount: '<i onclick="window.__xss=5">1</i>' }, '<u>koniec</u>'],
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
        bolds: card.querySelectorAll('.entity-card-row b, .entity-card-row i, .entity-card-row u').length,
        proseText: [...card.querySelectorAll('.entity-card-row-value')][1]?.textContent || '',
        xss: window.__xss,
        text: card.querySelector('.entity-card-row-value').textContent,
      }), 150));
    });
    check('XSS: żaden <img>/<b> nie powstaje z value/amount/resourcesSuffix', xss.imgs === 0 && xss.bolds === 0, xss);
    check('XSS: skrypt z atrybutu nie wykonał się', xss.xss === 0, xss);
    check('XSS valueParts: tekst części i kwota jako zwykły tekst (brak <img>/<i>/<u>)',
      xss.proseText.includes('<img') && xss.proseText.includes('<u>koniec</u>') && xss.proseText.includes('<i onclick'), xss.proseText);
    check('XSS: dane z HTML-em są widoczne jako zwykły tekst', xss.text.includes('<img') && xss.text.includes('<b onmouseover'), xss.text);

    if (SHOTS_DIR) {
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS_DIR, 'entitycards-yield-icons.png'), fullPage: true });
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
  console.log(`\n[entity-cards-yield-icons-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[entity-cards-yield-icons-real-render-test] błąd:', err);
  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(OUTFILE, { force: true });
  process.exit(1);
});
