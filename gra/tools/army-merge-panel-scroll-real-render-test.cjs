'use strict';
/**
 * army-merge-panel-scroll-real-render-test.cjs
 *
 * TEMAT: R-ARMIA-MERGE-PANEL-SCROLL-Q1
 *
 * Regresja UI dla panelu „Połączenie armii". Test nie używa jsdom do geometrii:
 * kompiluje prawdziwy `armyMergePanel.ts`, otwiera go w Chromium i mierzy
 * getBoundingClientRect(), scrollHeight/clientHeight, realny scroll oraz kliknięcia
 * myszy. Test uruchamiany jest przez `xvfb-run -a`, żeby nie ukrywać scrollbarów.
 *
 * Scenariusze:
 *  - 1141x1451, 16 jednostek: panel ma co najmniej 16 px odstępu od viewportu.
 *  - 900x620, 16+ jednostek: tylko body scrolluje, a nagłówek, wynik i CTA są
 *    stale w kadrze.
 *  - 900x620, 40 jednostek: cały stos jest osiągalny bez poziomego overflow.
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
const BRAND_STUB = path.join(TMPDIR, 'brandAssets-stub.ts');
const FIXED_MODULE_PATH = path.resolve(UI_DIR, '__army_merge_panel_scroll_fixed__.ts');
const PRE_MODULE_PATH = path.resolve(UI_DIR, '__army_merge_panel_scroll_pre__.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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
  const body = cssRule(source, '.civ-amp-body');
  const slotRules = ['.civ-amp-hdr', '.civ-amp-result', '.civ-amp-foot']
    .map((selector) => cssRule(source, selector));
  return {
    overlay,
    box,
    body,
    overlayViewport: /padding:16px;box-sizing:border-box;overflow:hidden/.test(overlay),
    boxViewport: /box-sizing:border-box/.test(box)
      && /max-height:calc\(100vh - 32px\)/.test(box),
    boxFlex: /display:flex/.test(box) && /flex-direction:column/.test(box),
    bodyFlexScroll: /flex:1 1 auto/.test(body)
      && /min-height:0/.test(body)
      && /overflow-y:auto/.test(body)
      && /overflow-x:hidden/.test(body),
    fixedSlots: slotRules.every((rule) => /flex:0 0 auto/.test(rule)),
  };
}

/** Mutacja w pamięci dokładnie usuwa kontrakt dostarczony w tej bramce. */
function mutateToPre(source) {
  return source
    .replace('  padding:16px;box-sizing:border-box;overflow:hidden;\n', '')
    .replace('  box-sizing:border-box;width:min(520px,100%);min-width:min(440px,100%);max-width:520px;\n  max-height:calc(100vh - 32px);display:flex;flex-direction:column;\n',
      '  min-width:min(440px,calc(100vw - 28px));max-width:520px;\n')
    .replace(/flex:0 0 auto;/g, '')
    .replace(/flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;/, '');
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
    return await chromium.launch({ headless: false });
  } catch (_e) {
    console.log('[army-merge-panel-scroll] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: false,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox'],
    });
  }
}

function fixture(count) {
  return Array.from({ length: count }, (_v, i) => ({
    id: 'existing-' + String(i + 1).padStart(2, '0'),
    name: 'Jednostka ' + String(i + 1).padStart(2, '0'),
    ruchLeft: i % 4,
    ruchMax: 4,
  }));
}

async function resetPanel(page, prefix) {
  await page.evaluate((name) => {
    window[name]?.();
    document.getElementById('civ-army-merge-css-v1')?.remove();
    document.querySelectorAll('.civ-amp-overlay').forEach((node) => node.remove());
  }, prefix === 'fixed' ? '__hideFixed' : '__hidePre');
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
    name: prefix === 'fixed' ? '__showFixed' : '__showPre',
    units: fixture(count),
  });
}

function inViewport(rect, width, height) {
  return rect != null
    && rect.width > 0 && rect.height > 0
    && rect.left >= -0.5 && rect.right <= width + 0.5
    && rect.top >= -0.5 && rect.bottom <= height + 0.5;
}

async function measure(page) {
  return page.evaluate(() => {
    const inViewport = (rect, width, height) => rect != null
      && rect.width > 0 && rect.height > 0
      && rect.left >= -0.5 && rect.right <= width + 0.5
      && rect.top >= -0.5 && rect.bottom <= height + 0.5;
    const overlay = document.querySelector('.civ-amp-overlay');
    const box = document.querySelector('.civ-amp');
    const body = document.querySelector('.civ-amp-body');
    const header = document.querySelector('.civ-amp-hdr');
    const result = document.querySelector('.civ-amp-result');
    const foot = document.querySelector('.civ-amp-foot');
    const merge = document.querySelector('[data-act="merge"]');
    const separate = document.querySelector('[data-act="sep"]');
    const existingCol = body?.querySelector('.civ-amp-col');
    const rows = existingCol ? [...existingCol.querySelectorAll('.civ-amp-row')] : [];
    const lastExisting = rows[rows.length - 1] || null;
    const rect = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const bodyRect = rect(body);
    if (body) body.scrollTop = body.scrollHeight;
    const scrollCandidates = [...document.querySelectorAll('.civ-amp-overlay, .civ-amp, .civ-amp-body')]
      .filter((node) => {
        const style = getComputedStyle(node);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll')
          && node.scrollHeight - node.clientHeight > 1;
      })
      .map((node) => node.className);
    const bodyStyle = body ? getComputedStyle(body) : null;
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
      } : null,
      boxOverflowY: boxStyle?.overflowY || null,
      overlayOverflowY: rootStyle?.overflowY || null,
      rowCount: body ? body.querySelectorAll('.civ-amp-row').length : 0,
      lastExisting: lastRect,
      lastExistingVisibleInsideBody: bodyVisible,
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
      },
    };
  });
}

function layoutFailures(m, expectedExisting) {
  if (!m || !m.box || !m.body) return ['missing panel/body'];
  const failures = [];
  const gapTop = m.box.top;
  const gapBottom = m.viewport.height - m.box.bottom;
  if (gapTop < 16 - 0.5 || gapBottom < 16 - 0.5) failures.push('viewport-gap');
  if (!m.visible.header || !m.visible.result || !m.visible.foot
      || !m.visible.merge || !m.visible.separate) failures.push('fixed-slots-visible');
  if (m.body.overflowY !== 'auto' || m.body.overflowX !== 'hidden') failures.push('body-overflow-contract');
  if (m.boxOverflowY !== 'hidden' || m.overlayOverflowY !== 'hidden') failures.push('outer-overflow-contract');
  if (m.body.scrollHeight <= m.body.clientHeight + 1) failures.push('body-not-scrollable');
  if (m.body.scrollTop < m.body.scrollHeight - m.body.clientHeight - 1) failures.push('scroll-not-at-end');
  if (!m.lastExistingVisibleInsideBody) failures.push('last-unit-not-reachable');
  if (m.body.scrollWidth > m.body.clientWidth + 1) failures.push('body-horizontal-overflow');
  if (m.box.right > m.viewport.width + 0.5 || m.box.left < -0.5) failures.push('box-horizontal-overflow');
  if (m.document.scrollWidth > m.viewport.width + 1) failures.push('page-horizontal-overflow');
  if (m.rowCount !== expectedExisting + 1) failures.push('unit-count');
  if (m.scrollCandidates.length !== 1 || m.scrollCandidates[0] !== 'civ-amp-body') failures.push('wrong-scroll-container');
  return failures;
}

async function clickAction(page, prefix, action) {
  await resetPanel(page, prefix);
  await showFixture(page, prefix, 16);
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

async function main() {
  const fixedSource = fs.readFileSync(PANEL_TS, 'utf8');
  const preSource = mutateToPre(fixedSource);
  const fixedContract = sourceContract(fixedSource);
  const preContract = sourceContract(preSource);

  console.log('army-merge-panel-scroll-real-render-test (R-ARMIA-MERGE-PANEL-SCROLL-Q1)\n');
  check('source: overlay ma padding 16 px, box-sizing i overflow hidden', fixedContract.overlayViewport);
  check('source: box ma box-sizing border-box i max-height calc(100vh - 32px)', fixedContract.boxViewport);
  check('source: box jest flex columnem', fixedContract.boxFlex);
  check('source: body jest flex itemem z pionowym scrollem i ukrytym overflow poziomym', fixedContract.bodyFlexScroll);
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
    const tall16 = await measure(page);
    check('1141x1451 / 16 jednostek: panel ma stały odstęp ≥16 px od góry i dołu',
      tall16.box.top >= 16 - 0.5
        && tall16.viewport.height - tall16.box.bottom >= 16 - 0.5,
      { topGap: tall16.box.top, bottomGap: tall16.viewport.height - tall16.box.bottom, box: tall16.box });
    check('1141x1451 / 16 jednostek: panel nie wychodzi poziomo poza viewport',
      tall16.box.left >= -0.5 && tall16.box.right <= tall16.viewport.width + 0.5,
      tall16.box);

    await resetPanel(page, 'fixed');
    await page.setViewportSize({ width: 900, height: 620 });
    await showFixture(page, 'fixed', 16);
    const short16 = await measure(page);
    const short16Failures = layoutFailures(short16, 16);
    check('900x620 / 16+ jednostek: panel ma odstęp ≥16 px i mieści się w viewport',
      short16.box.top >= 16 - 0.5
        && short16.viewport.height - short16.box.bottom >= 16 - 0.5
        && short16.box.left >= -0.5
        && short16.box.right <= short16.viewport.width + 0.5,
      { topGap: short16.box.top, bottomGap: short16.viewport.height - short16.box.bottom, box: short16.box });
    check('900x620 / 16+ jednostek: scrolluje wyłącznie civ-amp-body, a ostatnia jednostka jest osiągalna',
      short16Failures.filter((failure) => ['viewport-gap', 'last-unit-not-reachable', 'body-not-scrollable', 'wrong-scroll-container'].includes(failure)).length === 0,
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

    await resetPanel(page, 'fixed');
    await showFixture(page, 'fixed', 40);
    const short40 = await measure(page);
    const short40Failures = layoutFailures(short40, 40);
    check('900x620 / 40 jednostek: wszystkie 41 wierszy są wyrenderowane i ostatni jest osiągalny',
      short40.rowCount === 41 && short40.lastExistingVisibleInsideBody
        && short40.body.scrollTop >= short40.body.scrollHeight - short40.body.clientHeight - 1,
      { rowCount: short40.rowCount, lastExistingVisibleInsideBody: short40.lastExistingVisibleInsideBody, body: short40.body });
    check('900x620 / 40 jednostek: dokładnie jeden zamierzony scroll container i zero horizontal overflow',
      short40.scrollCandidates.length === 1
        && short40.scrollCandidates[0] === 'civ-amp-body'
        && short40.body.scrollWidth <= short40.body.clientWidth + 1
        && short40.document.scrollWidth <= short40.viewport.width + 1,
      { scrollCandidates: short40.scrollCandidates, body: short40.body, document: short40.document });
    check('900x620 / 40 jednostek: pełny layout spełnia kontrakt bez błędów',
      short40Failures.length === 0,
      short40Failures);

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
        || pre16.box.top < 16 - 0.5
        || pre16.viewport.height - pre16.box.bottom < 16 - 0.5
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
