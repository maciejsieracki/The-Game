'use strict';
/**
 * building-card-overlap-real-render-test.cjs
 *
 * TEMAT: R-BUDYNKI-KARTY-GRAFIKA-TEKST-OVERLAP-Q1.
 *
 * Real-browser regression gate for the building-card overlap reported in INFRA-004.
 * It bundles the production renderer and the production cityPanel builder, then measures
 * the actual DOM with getBoundingClientRect() in Chromium. jsdom is intentionally not used:
 * the defect is caused by CSS layout at the narrow city-panel width.
 *
 * Coverage:
 *  - Palisada drewniana plus the longest and shortest real building names in buildings.json;
 *  - direct renderEntityCard() cards and the city-panel build-tab path;
 *  - 400px (viewport 432px) and 660px card layouts;
 *  - mutation that removes only this topic's building-layout CSS and must restore overlap;
 *  - optional screenshots via BUILDING_CARD_SHOTS_DIR.
 *
 * Usage (from gra/): node tools/building-card-overlap-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[building-card-overlap] playwright missing — npm ci, then install Chromium');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.building-card-overlap-entry.ts');
const OUTFILE = path.resolve(__dirname, '.building-card-overlap-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS_DIR = process.env.BUILDING_CARD_SHOTS_DIR
  ? path.resolve(process.env.BUILDING_CARD_SHOTS_DIR)
  : null;

// The production fix is scoped to entity-card-building and these markers are also the
// mutation oracle. Keep both markers inside ENTITY_CARD_CSS so the cityPanel path consumes
// precisely the same CSS as the direct renderer path.
const FIX_START = '/* R-BUDYNKI-KARTY-GRAFIKA-TEKST-OVERLAP-Q1 — BUILDING FLOW START */';
const FIX_END = '/* R-BUDYNKI-KARTY-GRAFIKA-TEKST-OVERLAP-Q1 — BUILDING FLOW END */';

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else {
    fail++;
    console.log('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail)));
  }
}

function listSvgs(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) listSvgs(file, prefix + entry.name + '/', out);
    else if (entry.name.endsWith('.svg')) out[prefix + entry.name] = fs.readFileSync(file, 'utf8');
  }
  return out;
}

// Vite-only imports used by the production UI need small bundling adapters. The source
// modules and SVG contents remain the real repository files.
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
      const brandAssets = path.resolve(args.path);
      const expected = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
      if (brandAssets !== expected) return null;
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

// cityPanel.ts keeps these helpers private. This plugin exposes only the production helper
// needed by the test without changing the tracked source file.
const exposeCityPanelPlugin = {
  name: 'expose-city-panel',
  setup(build) {
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      const expected = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
      if (path.resolve(args.path) !== expected) return null;
      return {
        contents: fs.readFileSync(args.path, 'utf8')
          + '\nexport { buildBuildingBuildTabDetailCard as __buildBuildingBuildTabDetailCard };\n',
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (error) {
    console.log('[building-card-overlap] default Chromium unavailable, trying', FALLBACK_CHROME);
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

function overlap(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return { width, height, area: width * height };
}

async function screenshot(page, name) {
  if (!SHOTS_DIR) return;
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS_DIR, name), fullPage: true });
}

async function main() {
  const rendererSource = fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'entityCards', 'renderer.ts'), 'utf8');
  const citySource = fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
  check('renderer has the building-flow fix start/end markers',
    rendererSource.includes(FIX_START) && rendererSource.includes(FIX_END));
  check('cityPanel still routes the build-tab card through buildBuildingDetailCard',
    citySource.includes('const card = buildBuildingDetailCard(def, data, city);'));

  fs.writeFileSync(ENTRY, [
    "import { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { __buildBuildingBuildTabDetailCard } from '../src/ui/cityPanel.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    'window.__C = { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS, buildBuildingBuildTabDetailCard: __buildBuildingBuildTabDetailCard, loadGameData };',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, exposeCityPanelPlugin],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 432, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  try {
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:"Segoe UI",Tahoma,sans-serif;padding:16px;}'
      + '#stage{display:flex;flex-direction:column;gap:16px;align-items:flex-start;}'
      + '</style></head><body><main id="stage"></main></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const fixtures = await page.evaluate(() => {
      const data = window.__C.loadGameData();
      const byId = new Map(data.buildings.map((building) => [building.id, building]));
      const palisada = byId.get('palisada');
      const longest = data.buildings.reduce((best, item) => item.nazwa.length > best.nazwa.length ? item : best);
      const shortest = data.buildings.reduce((best, item) => item.nazwa.length < best.nazwa.length ? item : best);
      if (!palisada || !longest || !shortest) throw new Error('building fixtures missing');

      // The city-panel builder is mounted first because it injects the production CSS used
      // by all subsequent direct cards, exactly as it is injected in the live panel.
      const cityCard = window.__C.buildBuildingBuildTabDetailCard(palisada, data, undefined, {});
      cityCard.id = 'city-palisada';
      document.getElementById('stage').appendChild(cityCard);

      for (const item of [palisada, longest, shortest]) {
        const built = window.__C.buildEntityCardData('building', item.id, {});
        if (!built) throw new Error(`no adapter data for ${item.id}`);
        const card = window.__C.renderEntityCard(built);
        card.id = `direct-${item.id}`;
        document.getElementById('stage').appendChild(card);
      }
      const syntheticLong = window.__C.buildEntityCardData('building', longest.id, {});
      syntheticLong.title = `${syntheticLong.title} — nazwa testowa o bardzo długim rozwinięciu responsywnym`;
      const syntheticCard = window.__C.renderEntityCard(syntheticLong);
      syntheticCard.id = 'direct-synthetic-long';
      document.getElementById('stage').appendChild(syntheticCard);

      // A wonder card is the other icon-based non-compact consumer of this shared diorama;
      // keep it on the page as a negative control for the building-only CSS scope.
      const wonder = data.wonders?.cuda?.[0];
      if (wonder?.id) {
        const wonderData = window.__C.buildEntityCardData('wonder', wonder.id, {});
        if (wonderData) {
          const wonderCard = window.__C.renderEntityCard(wonderData);
          wonderCard.id = 'negative-wonder';
          document.getElementById('stage').appendChild(wonderCard);
        }
      }

      window.__origCss = new Map();
      window.__setBuildingFix = (enabled, start, end) => {
        document.querySelectorAll('style').forEach((style) => {
          if (!window.__origCss.has(style)) window.__origCss.set(style, style.textContent);
          const original = window.__origCss.get(style);
          if (enabled) {
            style.textContent = original;
            return;
          }
          const from = original.indexOf(start);
          const to = original.indexOf(end, from + start.length);
          style.textContent = from >= 0 && to >= 0
            ? original.slice(0, from) + original.slice(to + end.length)
            : original;
        });
      };
      return {
        palisada: palisada.nazwa,
        longest: { id: longest.id, name: longest.nazwa, length: longest.nazwa.length },
        shortest: { id: shortest.id, name: shortest.nazwa, length: shortest.nazwa.length },
      };
    });
    console.log('[fixtures]', JSON.stringify(fixtures));
    check('fixture includes Palisada drewniana', fixtures.palisada === 'Palisada drewniana', fixtures);
    check('fixture has distinct longest and shortest real building names',
      fixtures.longest.length > fixtures.shortest.length && fixtures.longest.id !== fixtures.shortest.id,
      fixtures);

    const measure = (id) => page.evaluate((cardId) => {
      const card = document.getElementById(cardId);
      if (!card) return { missing: true, id: cardId };
      const header = card.querySelector('.entity-card-header');
      const stage = card.querySelector('.entity-card-diorama-stage');
      const med = card.querySelector('.entity-card-medallion');
      const titleWrap = card.querySelector('.entity-card-title-wrap');
      const title = card.querySelector('h2');
      const chips = card.querySelector('.entity-card-header-chips');
      const subtitle = card.querySelector('.entity-card-subtitle');
      if (!header || !stage || !med || !titleWrap || !title) return { missing: true, id: cardId };
      const rect = (element) => {
        const r = element.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      };
      const hr = rect(header);
      const sr = rect(stage);
      const mr = rect(med);
      const tr = rect(title);
      const twr = rect(titleWrap);
      const titleMed = (() => {
        const x = Math.max(0, Math.min(tr.right, mr.right) - Math.max(tr.left, mr.left));
        const y = Math.max(0, Math.min(tr.bottom, mr.bottom) - Math.max(tr.top, mr.top));
        return { width: x, height: y, area: x * y };
      })();
      const wrapMed = (() => {
        const x = Math.max(0, Math.min(twr.right, mr.right) - Math.max(twr.left, mr.left));
        const y = Math.max(0, Math.min(twr.bottom, mr.bottom) - Math.max(twr.top, mr.top));
        return { width: x, height: y, area: x * y };
      })();
      const content = [title, chips, subtitle].filter(Boolean);
      return {
        id: cardId,
        cardWidth: Math.round(card.getBoundingClientRect().width),
        headerHeight: Math.round(hr.height),
        stage: { top: Math.round(sr.top - hr.top), bottom: Math.round(sr.bottom - hr.top), height: Math.round(sr.height) },
        med: { left: Math.round(mr.left - hr.left), top: Math.round(mr.top - hr.top), right: Math.round(mr.right - hr.left), bottom: Math.round(mr.bottom - hr.top), width: Math.round(mr.width), height: Math.round(mr.height) },
        title: { left: Math.round(tr.left - hr.left), top: Math.round(tr.top - hr.top), right: Math.round(tr.right - hr.left), bottom: Math.round(tr.bottom - hr.top), width: Math.round(tr.width), height: Math.round(tr.height), text: title.textContent.trim() },
        titleWrap: { left: Math.round(twr.left - hr.left), top: Math.round(twr.top - hr.top), right: Math.round(twr.right - hr.left), bottom: Math.round(twr.bottom - hr.top), height: Math.round(twr.height) },
        titleMed,
        wrapMed,
        titleInsideHeader: tr.top >= hr.top - 1 && tr.bottom <= hr.bottom + 1,
        contentVisible: content.every((element) => {
          const r = element.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.top >= hr.top - 1 && r.bottom <= hr.bottom + 1;
        }),
        headerOverflowY: header.scrollHeight - header.clientHeight,
      };
    }, id);

    const narrowIds = ['city-palisada', `direct-palisada`, `direct-${fixtures.longest.id}`, `direct-${fixtures.shortest.id}`, 'direct-synthetic-long'];
    console.log('-- narrow 432px viewport / 400px cards --');
    const narrow = {};
    for (const id of narrowIds) {
      narrow[id] = await measure(id);
      console.log(`[measure:${id}]`, JSON.stringify(narrow[id]));
      check(`${id}: tytuł i pełny title-wrap nie przecinają medalionu`,
        !narrow[id].missing && narrow[id].titleMed.area === 0 && narrow[id].wrapMed.area === 0,
        narrow[id]);
      check(`${id}: tytuł/header content visible and inside header`,
        !narrow[id].missing && narrow[id].titleInsideHeader
        && narrow[id].contentVisible && narrow[id].headerOverflowY <= 0,
        narrow[id]);
    }
    await screenshot(page, '01-building-cards-narrow-432.png');

    await page.setViewportSize({ width: 1280, height: 950 });
    await page.waitForTimeout(50);
    console.log('-- wide 1280px viewport / 660px cards --');
    const wideCity = await measure('city-palisada');
    const wideDirect = await measure('direct-palisada');
    console.log('[measure:city-palisada@1280]', JSON.stringify(wideCity));
    console.log('[measure:direct-palisada@1280]', JSON.stringify(wideDirect));
    check('city-panel Palisada remains visible and non-overlapping at 1280px',
      !wideCity.missing && wideCity.titleMed.area === 0 && wideCity.wrapMed.area === 0
      && wideCity.contentVisible && wideCity.headerOverflowY <= 0,
      wideCity);
    check('direct Palisada remains visible and non-overlapping at 1280px',
      !wideDirect.missing && wideDirect.titleMed.area === 0 && wideDirect.wrapMed.area === 0
      && wideDirect.contentVisible && wideDirect.headerOverflowY <= 0,
      wideDirect);
    const wonder = await measure('negative-wonder');
    check('non-building wonder path still renders its shared diorama',
      !wonder.missing && wonder.med.width >= 90 && wonder.headerHeight >= 160 && wonder.contentVisible,
      wonder);
    await screenshot(page, '02-building-cards-wide-1280.png');

    await page.setViewportSize({ width: 432, height: 900 });
    await page.waitForTimeout(50);
    await page.evaluate(({ start, end }) => window.__setBuildingFix(false, start, end), {
      start: FIX_START, end: FIX_END,
    });
    const mutatedCity = await measure('city-palisada');
    const mutatedDirect = await measure('direct-palisada');
    console.log('[mutated:city-palisada]', JSON.stringify(mutatedCity));
    console.log('[mutated:direct-palisada]', JSON.stringify(mutatedDirect));
    check('mutation removes the fix and restores city-panel overlap',
      mutatedCity.titleMed.area > 0 || mutatedCity.wrapMed.area > 0,
      mutatedCity);
    check('mutation removes the fix and restores direct-render overlap',
      mutatedDirect.titleMed.area > 0 || mutatedDirect.wrapMed.area > 0,
      mutatedDirect);

    await page.evaluate(({ start, end }) => window.__setBuildingFix(true, start, end), {
      start: FIX_START, end: FIX_END,
    });
    const restored = await measure('city-palisada');
    check('restoring the CSS removes the overlap again',
      restored.titleMed.area === 0 && restored.wrapMed.area === 0 && restored.contentVisible,
      restored);

    check('no console/page errors during building-card runtime coverage', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[building-card-overlap-real-render-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(OUTFILE, { force: true });
  process.exit(1);
});
