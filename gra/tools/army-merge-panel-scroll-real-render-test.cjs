'use strict';
/**
 * army-merge-panel-scroll-real-render-test.cjs
 *
 * TEMAT: R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1
 *
 * Regresja UI dla panelu „Połączenie armii". Test nie używa jsdom do geometrii:
 * kompiluje prawdziwy `armyMergePanel.ts`, otwiera go w Chromium i mierzy
 * getBoundingClientRect(), scrollHeight/clientHeight, realny scroll oraz kliknięcia
 * myszy. Test używa Chromium headless, więc działa również w środowisku bez X11.
 *
 * Scenariusze:
 *  - 1141x1451, 16 jednostek: panel ma co najmniej 16 px odstępu od viewportu.
 *  - 900x620, 16+ jednostek: tylko body scrolluje, a nagłówek, wynik i CTA są
 *    stale w kadrze.
 *  - 900x620, 59 jednostek (60 wierszy ze stosem przybywającym): cały stos
 *    jest osiągalny bez poziomego overflow.
 *  - 600x413 CSS px przy DPR 1.5 (równowartość ekranu 900x620 przy skali 150%),
 *    59 jednostek:
 *    ostatni wiersz jest przewijalny, a CTA pozostaje widoczny i klikalny.
 *  - oba CTA są klikane prawdziwą myszą i wywołują właściwy callback.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI: z aktualnego źródła budowana jest również mutacja
 * PRZED tematem, usuwająca max-height/flex/scroll contract. Jej scenariusz musi
 * być czerwony; zielony wynik wyłącznie nowego CSS nie wystarcza.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { PNG } = require(path.resolve(__dirname, '..', 'node_modules', 'pngjs'));

let chromium;
try {
  ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright')));
} catch (_e) {
  console.error('[army-merge-panel-scroll] playwright missing — npm ci');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const UI_DIR = path.resolve(GRA, 'src', 'ui');
const PANEL_TS = path.resolve(UI_DIR, 'armyMergePanel.ts');
const TMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'army-merge-panel-scroll-'));
const ENTRY = path.join(TMPDIR, 'entry.ts');
const FIXED_BUNDLE = path.join(TMPDIR, 'fixed.cjs');
const PRE_BUNDLE = path.join(TMPDIR, 'pre.cjs');
const BODY_MOUNT_BUNDLE = path.join(TMPDIR, 'body-mount.cjs');
const BRAND_STUB = path.join(TMPDIR, 'brandAssets-stub.ts');
const FIXED_MODULE_PATH = path.resolve(UI_DIR, '__army_merge_panel_scroll_fixed__.ts');
const PRE_MODULE_PATH = path.resolve(UI_DIR, '__army_merge_panel_scroll_pre__.ts');
const FALLBACK_CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium';

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log('PASS: ' + name);
  } else {
    fail++;
    console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : ''));
  }
}

function cssRule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(escaped + '\\s*\\{[\\s\\S]*?\\}'));
  return match ? match[0] : '';
}

function sourceContract(source) {
  const overlay = cssRule(source, '.civ-amp-overlay');
  const box = cssRule(source, '.civ-amp');
  const shell = cssRule(source, '.civ-amp-roster-shell');
  const body = cssRule(source, '.civ-amp-body');
  const slotRules = ['.civ-amp-hdr', '.civ-amp-result', '.civ-amp-foot']
    .map((selector) => cssRule(source, selector));
  return {
    overlay,
    box,
    shell,
    body,
    overlayViewport: /padding:24px;box-sizing:border-box;overflow:hidden/.test(overlay),
    boxViewport: /box-sizing:border-box/.test(box)
      && /max-height:calc\(100vh - 48px\)/.test(box)
      && /max-height:calc\(100dvh - 48px\)/.test(box),
    boxFlex: /display:flex/.test(box) && /flex-direction:column/.test(box),
    bodyFlexScroll: /display:flex/.test(shell)
      && /flex:1 1 auto/.test(shell)
      && /min-height:0/.test(shell)
      && /flex:1 1 auto/.test(body)
      && /overflow-y:auto/.test(body)
      && /overflow-x:hidden/.test(body),
    visibleScrollbar: /\.civ-amp-scrollbar\{[^}]*position:absolute/.test(source)
      && /\.civ-amp-scrollbar::-webkit-slider-runnable-track/.test(source)
      && /\.civ-amp-scrollbar::-webkit-slider-thumb/.test(source)
      && /\.civ-amp-scrollbar::-moz-range-track/.test(source)
      && /\.civ-amp-scrollbar::-moz-range-thumb/.test(source),
    fixedSlots: slotRules.every((rule) => /flex:0 0 auto/.test(rule)),
  };
}

/** Mutacja w pamięci dokładnie usuwa kontrakt dostarczony w tej bramce. */
function mutateToPre(source) {
  return source
    .replace('  padding:24px;box-sizing:border-box;overflow:hidden;\n', '')
    .replace(/  box-sizing:border-box;width:min\([^\n]+\n  max-height:calc\(100vh - 48px\);max-height:calc\(100dvh - 48px\);\n  min-height:0;display:flex;flex-direction:column;\n/,
      '  min-width:min(440px,calc(100vw - 28px));max-width:520px;\n')
    .replace(/flex:0 0 auto;/g, '')
    .replace(/flex:1 1 auto;min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;/, '')
    .replace(cssRule(source, '.civ-amp-roster-shell'), '')
    .replace(cssRule(source, '.civ-amp-body'), '');
}

function mutateToBodyMount(source) {
  return source.replace('document.documentElement.appendChild(root);', 'document.body.appendChild(root);');
}

function stubPlugin() {
  return {
    name: 'army-merge-panel-scroll-brand-stub',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
    },
  };
}

function modulePlugin(source, virtualPath) {
  return {
    name: 'army-merge-panel-scroll-virtual-module',
    setup(build) {
      build.onResolve({ filter: /^army-merge-panel-under-test$/ }, () => ({
        path: virtualPath,
        namespace: 'army-merge-panel-test',
      }));
      build.onLoad({ filter: /.*/, namespace: 'army-merge-panel-test' }, () => ({
        contents: source,
        loader: 'ts',
        resolveDir: UI_DIR,
      }));
    },
  };
}

async function buildBundle(source, outfile, virtualPath) {
  fs.writeFileSync(ENTRY, [
    "import { showArmyMergePanel, hideArmyMergePanel, isArmyMergePanelOpen } from 'army-merge-panel-under-test';",
    'window.__showArmyMergePanelUnderTest = showArmyMergePanel;',
    'window.__hideArmyMergePanelUnderTest = hideArmyMergePanel;',
    'window.__isArmyMergePanelOpenUnderTest = isArmyMergePanelOpen;',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    plugins: [modulePlugin(source, virtualPath), stubPlugin()],
    logLevel: 'silent',
  });
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (_e) {
    console.log('[army-merge-panel-scroll] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox'],
    });
  }
}

function fixture(count) {
  return Array.from({ length: count }, (_v, i) => ({
    id: 'existing-' + String(i + 1).padStart(2, '0'),
    name: 'Jednostka ' + String(i + 1).padStart(2, '0'),
    ruchLeft: i === 0 ? 0.3333333333333304 : i % 4,
    ruchMax: i === 0 ? 12 : 4,
  }));
}

async function resetPanel(page, prefix) {
  await page.evaluate((name) => {
    window[name]?.();
    document.getElementById('civ-army-merge-css-v1')?.remove();
    document.querySelectorAll('.civ-amp-overlay').forEach((node) => node.remove());
  }, prefix === 'bodyMount' ? '__hideBodyMount' : prefix === 'fixed' ? '__hideFixed' : '__hidePre');
}

async function showFixture(page, prefix, count) {
  await page.evaluate(({ name, units }) => {
    window.__mergeCalls = { merge: 0, separate: 0 };
    window[name]({
      hexLabel: '(69,41)',
      existing: units,
      arriving: { id: 'arriving-01', name: 'Przybywająca', ruchLeft: 3, ruchMax: 4 },
      arrivingCount: 1,
      onMerge: () => { window.__mergeCalls.merge++; },
      onSeparate: () => { window.__mergeCalls.separate++; },
    });
  }, {
    name: prefix === 'bodyMount' ? '__showBodyMount' : prefix === 'fixed' ? '__showFixed' : '__showPre',
    units: fixture(count),
  });
}

function inViewport(rect, width, height) {
  return rect != null
    && rect.width > 0 && rect.height > 0
    && rect.left >= -0.5 && rect.right <= width + 0.5
    && rect.top >= -0.5 && rect.bottom <= height + 0.5;
}

async function measure(page, endOffset = 0) {
  return page.evaluate((scrollEndOffset) => {
    const inViewport = (rect, width, height) => rect != null
      && rect.width > 0 && rect.height > 0
      && rect.left >= -0.5 && rect.right <= width + 0.5
      && rect.top >= -0.5 && rect.bottom <= height + 0.5;
    const overlay = document.querySelector('.civ-amp-overlay');
    const box = document.querySelector('.civ-amp');
    const body = document.querySelector('.civ-amp-body');
    const scrollbar = document.querySelector('.civ-amp-scrollbar');
    const header = document.querySelector('.civ-amp-hdr');
    const result = document.querySelector('.civ-amp-result');
    const foot = document.querySelector('.civ-amp-foot');
    const merge = document.querySelector('[data-act="merge"]');
    const separate = document.querySelector('[data-act="sep"]');
    const existingCol = body?.querySelector('.civ-amp-col');
    const unitsGrid = existingCol?.querySelector('.civ-amp-units');
    const rows = existingCol ? [...existingCol.querySelectorAll('.civ-amp-row')] : [];
    const lastExisting = rows[rows.length - 1] || null;
    const allRows = body ? [...body.querySelectorAll('.civ-amp-row')] : [];
    const lastUnit = allRows[allRows.length - 1] || null;
    const rect = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const bodyRect = rect(body);
    if (body && scrollEndOffset !== null) {
      body.scrollTop = Math.max(0, body.scrollHeight - body.clientHeight - scrollEndOffset);
    }
    const scrollCandidates = [...document.querySelectorAll('.civ-amp-overlay, .civ-amp, .civ-amp-body')]
      .filter((node) => {
        const style = getComputedStyle(node);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll')
          && node.scrollHeight - node.clientHeight > 1;
      })
      .map((node) => node.className);
    const bodyStyle = body ? getComputedStyle(body) : null;
    const scrollbarStyle = scrollbar ? getComputedStyle(scrollbar) : null;
    const scrollbarTrackStyle = scrollbar ? getComputedStyle(scrollbar, '::-webkit-slider-runnable-track') : null;
    const boxStyle = box ? getComputedStyle(box) : null;
    const rootStyle = overlay ? getComputedStyle(overlay) : null;
    const lastRect = rect(lastExisting);
    const visible = (node) => inViewport(rect(node), viewport.width, viewport.height);
    const bodyVisible = lastRect != null && bodyRect != null
      && lastRect.top >= bodyRect.top - 0.5 && lastRect.bottom <= bodyRect.bottom + 0.5
      && visible(lastExisting);
    return {
      viewport,
      overlay: rect(overlay),
      box: rect(box),
      header: rect(header),
      result: rect(result),
      foot: rect(foot),
      merge: rect(merge),
      separate: rect(separate),
      body: body ? {
        rect: bodyRect,
        scrollTop: body.scrollTop,
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
        scrollWidth: body.scrollWidth,
        clientWidth: body.clientWidth,
        overflowY: bodyStyle?.overflowY || null,
        overflowX: bodyStyle?.overflowX || null,
        scrollbarWidth: bodyStyle?.scrollbarWidth || null,
        scrollbarControlRect: rect(scrollbar),
        scrollbarControlWidth: scrollbarStyle?.width || null,
        scrollbarTrackColor: scrollbarTrackStyle?.backgroundColor || null,
        scrollbarDisabled: scrollbar?.disabled ?? true,
      } : null,
      boxOverflowY: boxStyle?.overflowY || null,
      overlayOverflowY: rootStyle?.overflowY || null,
      rowCount: body ? body.querySelectorAll('.civ-amp-row').length : 0,
      unitGridColumns: unitsGrid ? getComputedStyle(unitsGrid).gridTemplateColumns.split(' ').length : 0,
      lastExisting: lastRect,
      lastExistingVisibleInsideBody: bodyVisible,
      lastUnit: rect(lastUnit),
      lastUnitVisibleInsideBody: lastUnit != null && bodyRect != null
        && rect(lastUnit).top >= bodyRect.top - 0.5
        && rect(lastUnit).bottom <= bodyRect.bottom + 0.5
        && visible(lastUnit),
      scrollCandidates,
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      visible: {
        header: visible(header),
        result: visible(result),
        foot: visible(foot),
        merge: visible(merge),
        separate: visible(separate),
        scrollbar: visible(scrollbar),
      },
    };
  }, endOffset);
}

function layoutFailures(m, expectedExisting, endTolerance = 1) {
  if (!m || !m.box || !m.body) return ['missing panel/body'];
  const failures = [];
  const gapTop = m.box.top;
  const gapBottom = m.viewport.height - m.box.bottom;
  if (gapTop < 24 - 0.5 || gapBottom < 24 - 0.5) failures.push('viewport-gap');
  if (!m.visible.header || !m.visible.result || !m.visible.foot
      || !m.visible.merge || !m.visible.separate) failures.push('fixed-slots-visible');
  if (m.body.overflowY !== 'auto' || m.body.overflowX !== 'hidden') failures.push('body-overflow-contract');
  if (!m.visible.scrollbar || m.body.scrollbarControlWidth !== '12px'
      || m.body.scrollbarTrackColor === 'rgba(0, 0, 0, 0)' || m.body.scrollbarDisabled) failures.push('visible-scrollbar-contract');
  if (m.boxOverflowY !== 'hidden' || m.overlayOverflowY !== 'hidden') failures.push('outer-overflow-contract');
  if (m.body.scrollHeight <= m.body.clientHeight + 1) failures.push('body-not-scrollable');
  if (m.body.scrollTop < m.body.scrollHeight - m.body.clientHeight - endTolerance) failures.push('scroll-not-at-end');
  if (m.body.scrollWidth > m.body.clientWidth + 1) failures.push('body-horizontal-overflow');
  if (m.box.right > m.viewport.width + 0.5 || m.box.left < -0.5) failures.push('box-horizontal-overflow');
  if (m.document.scrollWidth > m.viewport.width + 1) failures.push('page-horizontal-overflow');
  if (m.rowCount !== expectedExisting + 1) failures.push('unit-count');
  if (m.scrollCandidates.length !== 1 || m.scrollCandidates[0] !== 'civ-amp-body') failures.push('wrong-scroll-container');
  return failures;
}

async function clickAction(page, prefix, action, count = 16) {
  await resetPanel(page, prefix);
  await showFixture(page, prefix, count);
  const point = await page.evaluate((selector) => {
    const button = document.querySelector(selector);
    if (!button) return null;
    const r = button.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, action === 'merge' ? '[data-act="merge"]' : '[data-act="sep"]');
  if (!point) return null;
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(20);
  return page.evaluate(() => ({
    calls: window.__mergeCalls,
    open: window.__isArmyMergePanelOpenUnderTest(),
  }));
}

async function dragScrollbarToEnd(page) {
  await page.evaluate(() => { document.querySelector('.civ-amp-body')?.scrollTo(0, 0); });
  const geometry = await page.evaluate(() => {
    const body = document.querySelector('.civ-amp-body');
    const scrollbar = document.querySelector('.civ-amp-scrollbar');
    if (!body || !scrollbar) return null;
    const r = scrollbar.getBoundingClientRect();
    const maxScroll = body.scrollHeight - body.clientHeight;
    const thumbHeight = parseFloat(getComputedStyle(scrollbar).getPropertyValue('--amp-thumb-size'));
    const thumbRange = Math.max(0, r.height - thumbHeight);
    return {
      start: { x: r.left + r.width / 2, y: r.top + thumbHeight / 2 },
      end: { x: r.left + r.width / 2, y: r.top + thumbRange + thumbHeight / 2 },
      rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height },
      clientHeight: body.clientHeight,
      scrollHeight: body.scrollHeight,
      thumbHeight,
      maxScroll,
    };
  });
  if (!geometry || geometry.maxScroll <= 0) return null;
  await page.mouse.move(geometry.start.x, geometry.start.y);
  await page.mouse.down();
  await page.mouse.move(geometry.end.x, geometry.end.y, { steps: 12 });
  await page.mouse.up();
  const result = await page.evaluate(() => {
    const body = document.querySelector('.civ-amp-body');
      const scrollbar = document.querySelector('.civ-amp-scrollbar');
      return body && scrollbar ? { scrollTop: body.scrollTop, maxScroll: body.scrollHeight - body.clientHeight,
        controlValue: scrollbar.value } : null;
  });
  return { ...geometry, ...result };
}

async function visibleGoldThumbPixels(page) {
  const shot = await page.screenshot({ scale: 'device' });
  const png = PNG.sync.read(shot);
  const bounds = await page.locator('.civ-amp-scrollbar').boundingBox();
  if (!bounds) return { count: 0, centroid: null };
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const scaleX = png.width / viewport.width;
  const scaleY = png.height / viewport.height;
  let goldPixels = 0;
  let goldPixelY = 0;
  const left = Math.max(0, Math.floor(bounds.x * scaleX));
  const right = Math.min(png.width, Math.ceil((bounds.x + bounds.width) * scaleX));
  const top = Math.max(0, Math.floor(bounds.y * scaleY));
  const bottom = Math.min(png.height, Math.ceil((bounds.y + bounds.height) * scaleY));
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      const i = (y * png.width + x) * 4;
      if (png.data[i] > 170 && png.data[i] < 225
          && png.data[i + 1] > 105 && png.data[i + 1] < 190
          && png.data[i + 2] > 35 && png.data[i + 2] < 125) {
        goldPixels++;
        goldPixelY += y;
      }
    }
  }
  return { count: goldPixels, centroid: goldPixels ? goldPixelY / goldPixels : null };
}

async function main() {
  const fixedSource = fs.readFileSync(PANEL_TS, 'utf8');
  const preSource = mutateToPre(fixedSource);
  const bodyMountSource = mutateToBodyMount(fixedSource);
  const fixedContract = sourceContract(fixedSource);
  const preContract = sourceContract(preSource);

  console.log('army-merge-panel-scroll-real-render-test (R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1)\n');
  check('source: overlay ma margines viewport 24 px, box-sizing i overflow hidden', fixedContract.overlayViewport);
  check('source: panel jest montowany poza transformowanym body', /document\.documentElement\.appendChild\(root\)/.test(fixedSource));
  check('source: box ma max-height dla viewportu vh/dvh z marginesem 24 px', fixedContract.boxViewport);
  check('source: box jest flex columnem', fixedContract.boxFlex);
  check('source: body jest flex itemem z pionowym scrollem i ukrytym overflow poziomym', fixedContract.bodyFlexScroll);
  check('source: roster scrollbar ma kontrastowy kolor i widoczny 12px Chromium thumb', fixedContract.visibleScrollbar);
  check('source: header/result/footer są flex slotami niezależnymi od scrolla', fixedContract.fixedSlots);
  check('mutant PRZED faktycznie usuwa viewport/flex/scroll contract',
    preSource !== fixedSource
      && !preContract.overlayViewport
      && !preContract.boxViewport
      && !preContract.boxFlex
      && !preContract.bodyFlexScroll,
    preContract);

  fs.writeFileSync(BRAND_STUB, 'export function unitIconSvg() { return ""; }\n', 'utf8');
  await buildBundle(fixedSource, FIXED_BUNDLE, FIXED_MODULE_PATH);
  await buildBundle(preSource, PRE_BUNDLE, PRE_MODULE_PATH);
  await buildBundle(bodyMountSource, BODY_MOUNT_BUNDLE, PRE_MODULE_PATH);

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1141, height: 1451 } });
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  try {
    await page.setContent('<!doctype html><html><head><style>'
      + '*{box-sizing:border-box;}'
      + 'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0b0f16;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(FIXED_BUNDLE, 'utf8') });
    await page.evaluate(() => {
      window.__showFixed = window.__showArmyMergePanelUnderTest;
      window.__hideFixed = window.__hideArmyMergePanelUnderTest;
      window.__isFixedOpen = window.__isArmyMergePanelOpenUnderTest;
    });

    console.log('-- PO: prawdziwy render Chromium --');
    await showFixture(page, 'fixed', 16);
    const movementLabel = await page.locator('.civ-amp-row-mv').first().textContent();
    check('ułamkowy ruch jest wyświetlany zwięźle i po polsku', movementLabel === '0,33/12 ruch', movementLabel);
    const tall16 = await measure(page);
    check('1141x1451 / 16 jednostek: panel ma stały odstęp ≥24 px od góry i dołu',
      tall16.box.top >= 24 - 0.5
        && tall16.viewport.height - tall16.box.bottom >= 24 - 0.5,
      { topGap: tall16.box.top, bottomGap: tall16.viewport.height - tall16.box.bottom, box: tall16.box });
    check('1141x1451 / 16 jednostek: panel nie wychodzi poziomo poza viewport',
      tall16.box.left >= -0.5 && tall16.box.right <= tall16.viewport.width + 0.5,
      tall16.box);

    await resetPanel(page, 'fixed');
    await page.setViewportSize({ width: 900, height: 620 });
    await showFixture(page, 'fixed', 16);
    const short16 = await measure(page);
    const short16Failures = layoutFailures(short16, 16);
    check('900x620 / 16+ jednostek: panel ma odstęp ≥24 px i mieści się w viewport',
      short16.box.top >= 24 - 0.5
        && short16.viewport.height - short16.box.bottom >= 24 - 0.5
        && short16.box.left >= -0.5
        && short16.box.right <= short16.viewport.width + 0.5,
      { topGap: short16.box.top, bottomGap: short16.viewport.height - short16.box.bottom, box: short16.box });
    check('900x620 / 16 jednostek: lista mieści się lub przewija w body, ostatnia jednostka jest osiągalna',
      short16Failures.filter((failure) => ['viewport-gap', 'last-unit-not-reachable'].includes(failure)).length === 0
        && short16.scrollCandidates.every((name) => name === 'civ-amp-body'),
      { failures: short16Failures, body: short16.body, lastExisting: short16.lastExisting });
    check('900x620 / 16+ jednostek: nagłówek, wynik i oba CTA są widoczne po scrollu do końca',
      short16.visible.header && short16.visible.result && short16.visible.foot
        && short16.visible.merge && short16.visible.separate,
      short16.visible);
    check('900x620 / 16+ jednostek: brak poziomego overflow strony, panelu i body',
      short16.body.scrollWidth <= short16.body.clientWidth + 1
        && short16.box.right <= short16.viewport.width + 0.5
        && short16.document.scrollWidth <= short16.viewport.width + 1,
      { body: short16.body, box: short16.box, document: short16.document });
    check('900x620 / panel: jednostki są układane w trzech kolumnach',
      short16.unitGridColumns === 3,
      { unitGridColumns: short16.unitGridColumns, box: short16.box });

    await resetPanel(page, 'fixed');
    await showFixture(page, 'fixed', 59);
    const short59 = await measure(page);
    const short59Failures = layoutFailures(short59, 59);
    check('900x620 / 59 jednostek: wszystkie 60 wierszy są wyrenderowane i ostatni jest osiągalny',
      short59.rowCount === 60 && short59.lastExistingVisibleInsideBody
        && short59.body.scrollTop >= short59.body.scrollHeight - short59.body.clientHeight - 1,
      { rowCount: short59.rowCount, lastExistingVisibleInsideBody: short59.lastExistingVisibleInsideBody, body: short59.body });
    check('900x620 / 59 jednostek: dokładnie jeden zamierzony scroll container i zero horizontal overflow',
      short59.scrollCandidates.length === 1
        && short59.scrollCandidates[0] === 'civ-amp-body'
        && short59.body.scrollWidth <= short59.body.clientWidth + 1
        && short59.document.scrollWidth <= short59.viewport.width + 1,
      { scrollCandidates: short59.scrollCandidates, body: short59.body, document: short59.document });
    check('900x620 / 59 jednostek: pełny layout spełnia kontrakt bez błędów',
      short59Failures.length === 0,
      short59Failures);

    // Desktop browser zoom reduces the effective CSS viewport. Chromium's
    // headless viewport plus deviceScaleFactor reproduces that geometry while
    // keeping a verifiable 150% scale: 600x413 CSS px == 900x620 device px.
    const page150 = await browser.newPage({
      viewport: { width: 600, height: 413 },
      deviceScaleFactor: 1.5,
    });
    page150.on('pageerror', (error) => consoleErrors.push(String(error)));
    page150.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page150.setContent('<!doctype html><html><head><style>'
      + '*{box-sizing:border-box;}'
      + 'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0b0f16;}'
      + '</style></head><body></body></html>');
    // Mirror hud.ts applyUiZoom() exactly: transform/scale is applied to body,
    // whose layout dimensions shrink inversely so the scaled game fits viewport.
    await page150.evaluate(() => {
      document.documentElement.classList.add('civ-ui-zoom-active');
      document.documentElement.style.setProperty('--civ-ui-zoom', '1.5');
      document.body.style.width = `${100 / 1.5}vw`;
      document.body.style.height = `${100 / 1.5}vh`;
      document.body.style.transform = 'scale(1.5)';
      document.body.style.transformOrigin = 'top left';
      document.body.style.overflow = 'hidden';
    });
    await page150.addScriptTag({ content: fs.readFileSync(FIXED_BUNDLE, 'utf8') });
    await page150.evaluate(() => {
      window.__showFixed = window.__showArmyMergePanelUnderTest;
      window.__hideFixed = window.__hideArmyMergePanelUnderTest;
      window.__isFixedOpen = window.__isArmyMergePanelOpenUnderTest;
    });
    await showFixture(page150, 'fixed', 59);
    // Measure the final panel geometry rather than its entrance transform.
    await page150.waitForTimeout(300);
    // Scroll exactly to the end: at the narrow 150% CSS viewport the responsive
    // layout stacks the incoming column after the existing-unit grid.
    const zoom150 = await measure(page150, 0);
    await page150.screenshot({ path: '/tmp/army-merge-custom-scrollbar.png', scale: 'device' });
    const zoom150Failures = layoutFailures(zoom150, 59, 11);
    const zoom150Scale = await page150.evaluate(() => ({
      dpr: window.devicePixelRatio,
      cssWidth: window.innerWidth,
      cssHeight: window.innerHeight,
      physicalWidth: Math.round(window.innerWidth * window.devicePixelRatio),
      physicalHeight: Math.round(window.innerHeight * window.devicePixelRatio),
    }));
    console.log('RAW 150% geometry:', JSON.stringify({
      box: zoom150.box,
      innerWidth: zoom150Scale.cssWidth,
      innerHeight: zoom150Scale.cssHeight,
      dpr: zoom150Scale.dpr,
      topGap: zoom150.box.top,
      bottomGap: zoom150Scale.cssHeight - zoom150.box.bottom,
    }));
    check('150% skali Chromium: DPR 1.5 i viewport 600x413 CSS px (900x620 px ekranu)',
      zoom150Scale.dpr === 1.5 && zoom150Scale.cssWidth === 600 && zoom150Scale.cssHeight === 413
        && zoom150Scale.physicalWidth === 900 && zoom150Scale.physicalHeight === 620,
      zoom150Scale);
    const zoomBody = await page150.evaluate(() => ({
      transform: getComputedStyle(document.body).transform,
      width: document.body.getBoundingClientRect().width,
      viewportWidth: innerWidth,
      overlayParent: document.querySelector('.civ-amp-overlay')?.parentElement?.tagName,
      pageScrollWidth: document.documentElement.scrollWidth,
      pageScrollHeight: document.documentElement.scrollHeight,
    }));
    check('150% rzeczywistego zoomu gry: body jest skalowane, modal jest portalem do html i nie tworzy overflow strony',
      zoomBody.transform === 'matrix(1.5, 0, 0, 1.5, 0, 0)'
        && zoomBody.overlayParent === 'HTML'
        && zoomBody.pageScrollWidth <= zoom150Scale.cssWidth
        && zoomBody.pageScrollHeight <= zoom150Scale.cssHeight,
      zoomBody);
    check('150% skali / 59 jednostek: lista przewija się do końca, oba CTA pozostają widoczne',
      zoom150Failures.length === 0 && zoom150.visible.merge && zoom150.visible.separate
        && zoom150.lastUnitVisibleInsideBody,
      { failures: zoom150Failures, visible: zoom150.visible, body: zoom150.body,
        lastExisting: zoom150.lastExisting, lastUnit: zoom150.lastUnit, box: zoom150.box });
    check('150% skali / 59 jednostek: CTA mieszczą się w stopce poniżej rosteru',
      zoom150.foot.bottom <= zoom150.body.rect.top + 0.5
        && zoom150.foot.top >= zoom150.box.top - 0.5
        && zoom150.merge.top >= zoom150.foot.top && zoom150.merge.bottom <= zoom150.foot.bottom
        && zoom150.separate.top >= zoom150.foot.top && zoom150.separate.bottom <= zoom150.foot.bottom,
      { foot: zoom150.foot, body: zoom150.body.rect, merge: zoom150.merge,
        separate: zoom150.separate, box: zoom150.box });
    check('150% skali / 59 jednostek: scrollbar ma widoczny, nie-systemowy thumb i track',
      zoom150.visible.scrollbar && zoom150.body.scrollbarControlWidth === '12px'
        && zoom150.body.scrollbarTrackColor !== 'rgba(0, 0, 0, 0)' && !zoom150.body.scrollbarDisabled,
      { scrollbar: zoom150.body.scrollbarControlRect, width: zoom150.body.scrollbarControlWidth,
        track: zoom150.body.scrollbarTrackColor,
        disabled: zoom150.body.scrollbarDisabled });
    const thumbPixelsAtEnd = await visibleGoldThumbPixels(page150);
    if (process.env.ARMY_MERGE_SCROLL_EVIDENCE_PATH) {
      fs.writeFileSync(process.env.ARMY_MERGE_SCROLL_EVIDENCE_PATH,
        await page150.screenshot({ scale: 'device' }));
    }
    await page150.evaluate(() => { document.querySelector('.civ-amp-body')?.scrollTo(0, 0); });
    await page150.waitForTimeout(30);
    const thumbValueAtTop = await page150.locator('.civ-amp-scrollbar').inputValue();
    const thumbPixelsAtTop = await visibleGoldThumbPixels(page150);
    await page150.evaluate(() => {
      const body = document.querySelector('.civ-amp-body');
      if (body) body.scrollTop = body.scrollHeight;
    });
    await page150.waitForTimeout(30);
    const thumbValueAtEnd = await page150.locator('.civ-amp-scrollbar').inputValue();
    const thumbPixelsAtEndAfterScroll = await visibleGoldThumbPixels(page150);
    check('150% skali: widoczny złoty thumb przesuwa się od góry ku dołowi wraz z rosterem',
      thumbPixelsAtEnd.count >= 20 && Number(thumbValueAtTop) < Number(thumbValueAtEnd)
        && thumbPixelsAtEndAfterScroll.centroid > thumbPixelsAtTop.centroid
        && Number(thumbValueAtEnd) >= 990,
      { thumbPixelsAtEnd, thumbPixelsAtTop, thumbPixelsAtEndAfterScroll,
        thumbValueAtTop, thumbValueAtEnd });
    const thumbDrag = await dragScrollbarToEnd(page150);
    check('150% skali / 59 jednostek: przeciągnięcie widocznego thumbu osiąga ostatni wiersz',
      !!thumbDrag && thumbDrag.scrollTop >= thumbDrag.maxScroll - 2,
      thumbDrag);
    await page150.evaluate(() => {
      const rows = [...document.querySelectorAll('.civ-amp-body .civ-amp-row')];
      rows[rows.length - 2]?.scrollIntoView({ block: 'end' });
    });
    const zoom150ExistingEnd = await measure(page150, null);
    check('150% skali / 59 jednostek: końcowy wiersz listy istniejących jednostek jest osiągalny w scrollu',
      zoom150ExistingEnd.lastExistingVisibleInsideBody,
      { body: zoom150ExistingEnd.body, lastExisting: zoom150ExistingEnd.lastExisting });
    const zoom150Click = await clickAction(page150, 'fixed', 'merge', 59);
    check('150% skali: widoczny przycisk „Połącz armie” jest klikalny i wykonuje callback',
      !!zoom150Click && zoom150Click.calls.merge === 1
        && zoom150Click.calls.separate === 0 && zoom150Click.open === false,
      zoom150Click);
    // Negative control: keep the corrected CSS and long roster, but mount the
    // overlay as a fixed descendant of the transformed body as the shipped
    // implementation did. The panel must then violate the viewport margins;
    // this proves the application zoom/mount regression is covered.
    await page150.addScriptTag({ content: fs.readFileSync(BODY_MOUNT_BUNDLE, 'utf8') });
    await page150.evaluate(() => {
      window.__showBodyMount = window.__showArmyMergePanelUnderTest;
      window.__hideBodyMount = window.__hideArmyMergePanelUnderTest;
    });
    await resetPanel(page150, 'bodyMount');
    await showFixture(page150, 'bodyMount', 88);
    const bodyMountedPanel = await page150.evaluate(() => {
      const box = document.querySelector('.civ-amp')?.getBoundingClientRect();
      return box ? { top: box.top, bottom: box.bottom, height: box.height,
        viewportHeight: innerHeight,
        parent: document.querySelector('.civ-amp-overlay')?.parentElement?.tagName } : null;
    });
    check('negatywna kontrola: mount pod transformowanym body przy 150% traci wymagane marginesy viewportu',
      !!bodyMountedPanel && bodyMountedPanel.parent === 'BODY'
        && (bodyMountedPanel.top < 24 || bodyMountedPanel.viewportHeight - bodyMountedPanel.bottom < 24),
      bodyMountedPanel);
    await page150.evaluate(() => window.__hideBodyMount?.());
    await page150.close();

    const mergeResult = await clickAction(page, 'fixed', 'merge');
    check('klik myszą „Połącz armie" wywołuje onMerge i zamyka panel',
      !!mergeResult && mergeResult.calls.merge === 1
        && mergeResult.calls.separate === 0 && mergeResult.open === false,
      mergeResult);
    const separateResult = await clickAction(page, 'fixed', 'separate');
    check('klik myszą „Zostaw osobno" wywołuje onSeparate i zamyka panel',
      !!separateResult && separateResult.calls.merge === 0
        && separateResult.calls.separate === 1 && separateResult.open === false,
      separateResult);

    console.log('-- PRZED: mutant bez viewport/flex/scroll contract --');
    await page.addScriptTag({ content: fs.readFileSync(PRE_BUNDLE, 'utf8') });
    await page.evaluate(() => {
      window.__showPre = window.__showArmyMergePanelUnderTest;
      window.__hidePre = window.__hideArmyMergePanelUnderTest;
      window.__isPreOpen = window.__isArmyMergePanelOpenUnderTest;
    });
    await resetPanel(page, 'pre');
    await showFixture(page, 'pre', 16);
    const pre16 = await measure(page);
    const preFailures = layoutFailures(pre16, 16);
    check('MUTANT: usunięcie viewport/flex/scroll contract daje czerwony wynik dla 900x620 / 16+',
      preFailures.length > 0,
      { failures: preFailures, box: pre16.box, body: pre16.body, visible: pre16.visible });
    check('MUTANT: stary layout nie ma scrolla body i/lub wypada poza viewport (negative control)',
      pre16.body.scrollHeight <= pre16.body.clientHeight + 1
        || pre16.box.top < 24 - 0.5
        || pre16.viewport.height - pre16.box.bottom < 24 - 0.5
        || !pre16.visible.merge || !pre16.visible.separate,
      { box: pre16.box, body: pre16.body, visible: pre16.visible });

    check('brak pageerror/console.error w realnym Chromium', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(TMPDIR, { recursive: true, force: true });
  }

  console.log('');
  console.log(`[army-merge-panel-scroll] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
