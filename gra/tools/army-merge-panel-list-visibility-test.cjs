'use strict';
/**
 * army-merge-panel-list-visibility-test.cjs
 *
 * TEMAT: R-WEB-ARMY-MERGE-PANEL-LIST-VISIBILITY-Q1
 *
 * Panel „Połączenie armii" musi zawsze pokazywać, ile jednostek jest łącznie i ile jest jeszcze
 * pod spodem listy. Test kompiluje PRAWDZIWE źródło `armyMergePanel.ts`, otwiera je w Chromium
 * i mierzy realną geometrię (getBoundingClientRect, scrollTop, klawiatura, myszka).
 *
 * RED/GREEN: wersja PRZED budowana jest z prawdziwego źródła bazowego (`git show f568e1ed3:...`),
 * wersja PO z bieżącego pliku. Te same asercje muszą być CZERWONE dla PRZED i ZIELONE dla PO.
 * Gdy git/SHA jest niedostępny (np. płytki klon), część PRZED jest pomijana jawnie (NIE_ZMIERZONO).
 *
 * Scenariusze: 20 jednostek (18 na polu + „Skład (2)") i 45 jednostek, viewporty 1280x720,
 * 1920x1080 i 360x640. Zrzuty PRZED/PO tylko gdy ustawiono AMLV_SHOT_DIR (test nie brudzi repo).
 *
 * Usage (z gra/): PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium node tools/army-merge-panel-list-visibility-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try {
  ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright')));
} catch (_e) {
  console.error('[army-merge-list-visibility] playwright missing — npm ci');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const UI_DIR = path.resolve(GRA, 'src', 'ui');
const PANEL_TS = path.resolve(UI_DIR, 'armyMergePanel.ts');
const BASE_SHA = 'f568e1ed3';
const TMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'army-merge-list-visibility-'));
const ENTRY = path.join(TMPDIR, 'entry.ts');
const BRAND_STUB = path.join(TMPDIR, 'brandAssets-stub.ts');
const FALLBACK_CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium';
const SHOT_DIR = process.env.AMLV_SHOT_DIR || '';

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}
/** RED-PRE: oczekujemy, że asercja jest SPEŁNIONA dla PO i NIESPEŁNIONA dla PRZED. */
function checkRed(name, preOk, detail) {
  check('RED-PRE ' + name + ' (PRZED nie spełnia)', preOk === false, detail);
}

function stubPlugin() {
  return {
    name: 'amlv-brand-stub',
    setup(build) { build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); },
  };
}
function modulePlugin(source, virtualPath) {
  return {
    name: 'amlv-virtual-module',
    setup(build) {
      build.onResolve({ filter: /^army-merge-panel-under-test$/ }, () => ({ path: virtualPath, namespace: 'amlv' }));
      build.onLoad({ filter: /.*/, namespace: 'amlv' }, () => ({ contents: source, loader: 'ts', resolveDir: UI_DIR }));
    },
  };
}
async function buildBundle(source, outfile) {
  fs.writeFileSync(ENTRY, [
    "import { showArmyMergePanel, hideArmyMergePanel } from 'army-merge-panel-under-test';",
    'window.__show = showArmyMergePanel;',
    'window.__hide = hideArmyMergePanel;',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile, absWorkingDir: GRA,
    plugins: [modulePlugin(source, path.resolve(UI_DIR, '__amlv_under_test__.ts')), stubPlugin()],
    logLevel: 'silent',
  });
}
async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (_e) {
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--headless=new'] });
  }
}

function fixture(count) {
  const names = ['Wojownik', 'Rydwan (woły)', 'Łucznik'];
  return Array.from({ length: count }, (_v, i) => ({
    id: 'existing-' + (i + 1),
    name: names[i % 3] + ' ' + (i + 1),
    ruchLeft: 12, ruchMax: 12,
  }));
}

async function open(page, bundle, existingCount, arrivingCount) {
  await page.evaluate(() => { window.__hide && window.__hide(); document.querySelectorAll('.civ-amp-overlay').forEach((n) => n.remove()); });
  await page.addScriptTag({ content: bundle });
  await page.evaluate(({ units, arrN }) => {
    window.__calls = { merge: 0, separate: 0 };
    window.__show({
      hexLabel: '(119,100)',
      existing: units,
      arriving: { id: 'arr', name: arrN > 1 ? 'Skład (' + arrN + ')' : 'Przybywająca', ruchLeft: 0, ruchMax: 12 },
      arrivingCount: arrN,
      onMerge: () => { window.__calls.merge++; },
      onSeparate: () => { window.__calls.separate++; },
    });
  }, { units: fixture(existingCount), arrN: arrivingCount });
  await page.waitForTimeout(320); // animacja wejścia
}

/** Pomiar niezależny od wersji panelu (selektory wspólne dla PRZED i PO + opcjonalne nowe). */
async function measure(page) {
  return page.evaluate(() => {
    const R = (n) => {
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const vw = innerWidth, vh = innerHeight;
    const inVp = (r) => !!r && r.width > 0 && r.height > 0 && r.left >= -0.5 && r.right <= vw + 0.5 && r.top >= -0.5 && r.bottom <= vh + 0.5;
    const box = document.querySelector('.civ-amp');
    const merge = document.querySelector('[data-act="merge"]');
    const sep = document.querySelector('[data-act="sep"]');
    const grid = document.querySelector('[data-sec="field"] .civ-amp-units');
    const arrGrid = document.querySelector('[data-sec="arrive"] .civ-amp-units');
    const sum = document.querySelector('.civ-amp-sum');
    const more = document.querySelector('.civ-amp-more');
    const resultMain = document.querySelector('.civ-amp-result-main') || document.querySelector('.civ-amp-result');
    const body = document.querySelector('.civ-amp-body');
    const allRows = [...document.querySelectorAll('.civ-amp-row')];
    const fieldRows = grid ? [...grid.querySelectorAll('.civ-amp-row')] : [];
    const gridR = grid ? grid.getBoundingClientRect() : null;
    const fullyVisible = gridR ? fieldRows.filter((r) => { const b = r.getBoundingClientRect(); return b.top >= gridR.top - 0.5 && b.bottom <= gridR.bottom + 0.5; }).length : 0;
    const below = gridR ? fieldRows.filter((r) => r.getBoundingClientRect().bottom > gridR.bottom - 1).length : 0;
    const moreStyle = more ? getComputedStyle(more) : null;
    const arrRow = document.querySelector('[data-sec="arrive"] .civ-amp-row') || document.querySelector('.civ-amp-row.new');
    // pierwszy kafelek w PRZED (bez data-sec): szukamy wiersza w kolumnie „Przybywa"
    const preScroll = [...document.querySelectorAll('.civ-amp-overlay, .civ-amp, .civ-amp-body, .civ-amp-units')]
      .filter((n) => { const s = getComputedStyle(n); return (s.overflowY === 'auto' || s.overflowY === 'scroll') && n.scrollHeight - n.clientHeight > 1; })
      .map((n) => n.className);
    const sumTxt = sum ? sum.textContent.replace(/\s+/g, ' ').trim() : null;
    return {
      viewport: { w: vw, h: vh },
      box: R(box),
      boxHeight: box ? box.getBoundingClientRect().height : null,
      merge: R(merge), sep: R(sep),
      buttonsVisible: inVp(R(merge)) && inVp(R(sep)),
      grid: grid ? { scrollTop: grid.scrollTop, scrollHeight: grid.scrollHeight, clientHeight: grid.clientHeight,
        cols: getComputedStyle(grid).gridTemplateColumns.split(' ').length } : null,
      body: body ? { scrollTop: body.scrollTop, scrollHeight: body.scrollHeight, clientHeight: body.clientHeight,
        scrollWidth: body.scrollWidth, clientWidth: body.clientWidth } : null,
      rowsTotal: allRows.length,
      fieldRowsCount: fieldRows.length,
      fullyVisible, below,
      arrivingInViewport: inVp(R(arrRow)),
      arrivingInBox: !!R(arrRow) && !!R(box) && R(arrRow).bottom <= R(box).bottom + 0.5 && R(arrRow).top >= R(box).top - 0.5,
      hasSummary: !!sum,
      sumTxt,
      sumData: sum ? { total: +sum.dataset.total, field: +sum.dataset.field, arrive: +sum.dataset.arrive } : null,
      resultTxt: resultMain ? resultMain.textContent.replace(/\s+/g, ' ').trim() : null,
      hasMore: !!more,
      moreVisible: !!moreStyle && moreStyle.visibility === 'visible' && R(more).height > 0,
      moreTxt: more ? more.textContent.trim() : null,
      moreInBox: more && R(box) ? R(more).bottom <= R(box).bottom + 0.5 : false,
      scrollContainers: preScroll,
      docScrollW: document.documentElement.scrollWidth,
      boxInViewport: inVp(R(box)),
      a11y: {
        dialog: box ? box.getAttribute('role') === 'dialog' && box.getAttribute('aria-modal') === 'true' : false,
        listLabel: grid ? (grid.getAttribute('role') === 'list' && /\d/.test(grid.getAttribute('aria-label') || '') && grid.tabIndex === 0) : false,
        status: !!document.querySelector('.civ-amp-result[role="status"]'),
      },
    };
  });
}

/** Zdarzenie scroll jest dostarczane w cyklu renderowania — czekamy 2 klatki, nie stały timeout. */
async function settle(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40)))));
}

async function shot(page, name) {
  if (!SHOT_DIR) return;
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const box = await page.evaluate(() => {
    const r = document.querySelector('.civ-amp')?.getBoundingClientRect();
    return r ? { x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6), width: Math.min(innerWidth, r.width + 12), height: Math.min(innerHeight, r.height + 12) } : null;
  });
  await page.screenshot({ path: path.join(SHOT_DIR, name), clip: box || undefined });
}

function baseSource() {
  try {
    return execFileSync('git', ['show', BASE_SHA + ':gra/src/ui/armyMergePanel.ts'], { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (_e) { return null; }
}

const VIEWPORTS = [
  { name: '1280x720', w: 1280, h: 720 },
  { name: '1920x1080', w: 1920, h: 1080 },
  { name: '360x640', w: 360, h: 640 },
];

async function main() {
  console.log('army-merge-panel-list-visibility-test (R-WEB-ARMY-MERGE-PANEL-LIST-VISIBILITY-Q1)\n');
  fs.writeFileSync(BRAND_STUB, 'export function unitIconSvg() { return \'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>\'; }\n', 'utf8');
  const postSrc = fs.readFileSync(PANEL_TS, 'utf8');
  const preSrc = baseSource();
  const postBundle = path.join(TMPDIR, 'post.js');
  await buildBundle(postSrc, postBundle);
  const post = fs.readFileSync(postBundle, 'utf8');
  let pre = null;
  if (preSrc) {
    const preBundle = path.join(TMPDIR, 'pre.js');
    await buildBundle(preSrc, preBundle);
    pre = fs.readFileSync(preBundle, 'utf8');
  } else {
    console.log('NIE_ZMIERZONO: źródło bazowe ' + BASE_SHA + ' niedostępne w git — pomijam część PRZED (RED).');
  }

  const browser = await launchBrowser();
  const errors = [];
  const metrics = {};
  try {
    for (const vp of VIEWPORTS) {
      for (const total of [20, 45]) {
        const field = total === 20 ? 18 : 44;
        const arrN = total === 20 ? 2 : 1;
        const tag = vp.name + ' / ' + total + ' jedn.';
        const key = vp.name + '/' + total;
        const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        await page.setContent('<!doctype html><html><head><style>*{box-sizing:border-box;}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0b0f16;}</style></head><body></body></html>');

        // ---------- PRZED ----------
        let m0 = null;
        if (pre) {
          await open(page, pre, field, arrN);
          m0 = await measure(page);
          metrics[key + '/PRZED'] = { boxHeight: Math.round(m0.boxHeight), body: m0.body, buttonsVisible: m0.buttonsVisible,
            hasSummary: m0.hasSummary, hasMore: m0.hasMore, scrollContainers: m0.scrollContainers };
          if (total === 20 && (vp.name === '1280x720' || vp.name === '360x640')) await shot(page, 'przed-' + vp.name + '.png');
          checkRed(tag + ': stały licznik „Na polu · Dołącza · Razem"', m0.hasSummary, { hasSummary: m0.hasSummary });
          checkRed(tag + ': wskaźnik „jeszcze N poniżej"', m0.hasMore, { hasMore: m0.hasMore });
          await page.evaluate(() => { window.__hide(); document.getElementById('civ-army-merge-css-v1')?.remove(); });
        }

        // ---------- PO ----------
        await open(page, post, field, arrN);
        const m = await measure(page);
        metrics[key + '/PO'] = { boxHeight: Math.round(m.boxHeight), grid: m.grid, fullyVisible: m.fullyVisible, below: m.below,
          buttonsVisible: m.buttonsVisible, moreTxt: m.moreTxt, sumTxt: m.sumTxt, scrollContainers: m.scrollContainers };
        if (total === 20 && (vp.name === '1280x720' || vp.name === '360x640')) await shot(page, 'po-' + vp.name + '.png');

        check(tag + ': przyciski akcji w całości w viewporcie bez przewijania', m.buttonsVisible, { merge: m.merge, sep: m.sep, vp: m.viewport });
        check(tag + ': panel mieści się w oknie (wysokość ≤ viewport − 48 px, bez poziomego overflow)',
          m.boxInViewport && m.boxHeight <= vp.h - 48 + 0.5 && m.docScrollW <= vp.w + 1,
          { boxHeight: m.boxHeight, vp });
        check(tag + ': licznik „Razem" = Na polu + Dołącza = suma kolumn (data + tekst)',
          !!m.sumData && m.sumData.field === field && m.sumData.arrive === arrN && m.sumData.total === total
            && m.sumData.field + m.sumData.arrive === m.sumData.total
            && m.fieldRowsCount === field
            && new RegExp('Na polu: ' + field + ' · Dołącza: ' + arrN + ' · Razem: ' + total).test(m.sumTxt || ''),
          { sumData: m.sumData, sumTxt: m.sumTxt, fieldRowsCount: m.fieldRowsCount });
        check(tag + ': licznik spójny z paskiem „Armia — N jednostek" (jedno źródło liczby)',
          new RegExp('^Armia — ' + total + ' jednost').test(m.resultTxt || ''), m.resultTxt);
        check(tag + ': lista „Na polu" przewija się (nie cały panel); siatka kolumnowa',
          !!m.grid && m.grid.scrollHeight > m.grid.clientHeight + 1 && m.scrollContainers.includes('civ-amp-units')
            && !m.scrollContainers.includes('civ-amp') && !m.scrollContainers.includes('civ-amp-overlay'),
          { grid: m.grid, sc: m.scrollContainers });
        check(tag + ': wskaźnik „jeszcze N poniżej" widoczny na górze listy i N = liczba niewidocznych kafelków',
          m.moreVisible && m.moreInBox && m.below > 0 && new RegExp('jeszcze ' + m.below + ' jednost').test(m.moreTxt || ''),
          { moreTxt: m.moreTxt, below: m.below, moreVisible: m.moreVisible });
        check(tag + ': sekcja „Przybywa" widoczna bez przewijania (w viewporcie i w panelu)',
          m.arrivingInViewport && m.arrivingInBox, { arrivingInViewport: m.arrivingInViewport, arrivingInBox: m.arrivingInBox });
        check(tag + ': a11y — dialog/aria-modal, lista z aria-label i tabindex=0, status', m.a11y.dialog && m.a11y.listLabel && m.a11y.status, m.a11y);
        if (vp.w >= 560) check(tag + ': siatka 3 kolumny', m.grid && m.grid.cols === 3, m.grid);
        if (vp.w < 560) check(tag + ': mobile bez poziomego przewijania (body/dokument)',
          m.body.scrollWidth <= m.body.clientWidth + 1 && m.docScrollW <= vp.w + 1, { body: m.body, doc: m.docScrollW });
        if (vp.h >= 720 && vp.w >= 560) {
          check(tag + ': 5 rzędów × 3 kolumny (15 kafelków) widocznych w całości bez przewijania',
            m.fullyVisible >= 15, { fullyVisible: m.fullyVisible });
        }
        if (pre && m0) {
          // RED-PRE na wspólnej asercji „przyciski + panel w oknie + lista przewijana wewnętrznie + licznik"
          const preAll = m0.buttonsVisible && m0.hasSummary && m0.hasMore;
          checkRed(tag + ': komplet (przyciski + licznik + wskaźnik)', preAll, { buttonsVisible: m0.buttonsVisible, hasSummary: m0.hasSummary, hasMore: m0.hasMore });
        }

        // ---------- przewijanie: wskaźnik znika na końcu i wraca ----------
        await page.evaluate(() => { const g = document.querySelector('[data-sec="field"] .civ-amp-units'); g.scrollTop = g.scrollHeight; });
        await settle(page);
        const mEnd = await measure(page);
        check(tag + ': po dojściu do końca wskaźnik znika, ostatnia jednostka widoczna',
          !mEnd.moreVisible && mEnd.below === 0 && mEnd.grid.scrollTop >= mEnd.grid.scrollHeight - mEnd.grid.clientHeight - 1,
          { moreVisible: mEnd.moreVisible, below: mEnd.below, grid: mEnd.grid });
        check(tag + ': przyciski nadal w kadrze po przewinięciu listy', mEnd.buttonsVisible);
        await page.evaluate(() => { const g = document.querySelector('[data-sec="field"] .civ-amp-units'); g.scrollTop = 0; });
        await settle(page);
        const mTop = await measure(page);
        check(tag + ': po powrocie na górę wskaźnik wraca z tą samą liczbą', mTop.moreVisible && mTop.moreTxt === m.moreTxt, { a: mTop.moreTxt, b: m.moreTxt });
        if (total === 20 && vp.name === '1280x720') {
          // pośrednie położenie: N maleje
          await page.evaluate(() => { const g = document.querySelector('[data-sec="field"] .civ-amp-units'); g.scrollTop = 52; });
          await settle(page);
          const mMid = await measure(page);
          check(tag + ': w połowie przewijania N maleje i zgadza się z geometrią',
            mMid.moreVisible ? new RegExp('jeszcze ' + mMid.below + ' jednost').test(mMid.moreTxt) && mMid.below < m.below : true,
            { mid: mMid.moreTxt, mMidBelow: mMid.below, top: m.moreTxt });
        }

        // ---------- zachowanie ----------
        if (total === 20 && vp.name === '1280x720') {
          // klik „Pokaż więcej" przewija do końca
          await page.evaluate(() => { const g = document.querySelector('[data-sec="field"] .civ-amp-units'); g.scrollTop = 0; });
          await settle(page);
          await page.locator('.civ-amp-more').click();
          await settle(page);
          const mClick = await measure(page);
          check(tag + ': klik we wskaźnik przewija listę do końca', mClick.below === 0 && !mClick.moreVisible, { below: mClick.below });
          // klawiatura: fokus na liście + PageDown przewija
          await page.evaluate(() => { const g = document.querySelector('[data-sec="field"] .civ-amp-units'); g.scrollTop = 0; g.focus(); });
          await page.keyboard.press('PageDown');
          await page.waitForTimeout(250);
          const kb = await page.evaluate(() => document.querySelector('[data-sec="field"] .civ-amp-units').scrollTop);
          check(tag + ': klawiatura — PageDown na sfokusowanej liście przewija ją', kb > 0, { scrollTop: kb });
          // Tab dociera do przycisków
          const focusOrder = await page.evaluate(() => document.activeElement && document.activeElement.className);
          check(tag + ': fokus na liście jest widoczny/aktywny (element z tabindex)', /civ-amp-units/.test(focusOrder || ''), focusOrder);
          // Enter na „Zostaw osobno" => onSeparate (nie onMerge)
          await page.focus('[data-act="sep"]');
          await page.keyboard.press('Enter');
          await settle(page);
          const c1 = await page.evaluate(() => ({ calls: window.__calls, open: !!document.querySelector('.civ-amp-overlay') }));
          check(tag + ': Enter na „Zostaw osobno" wywołuje onSeparate (nie onMerge)', c1.calls.separate === 1 && c1.calls.merge === 0 && !c1.open, c1);
          // domyślne: Enter bez fokusu na przycisku => merge; mysz: merge
          await open(page, post, field, arrN);
          await page.locator('[data-act="merge"]').click();
          const c2 = await page.evaluate(() => ({ calls: window.__calls, open: !!document.querySelector('.civ-amp-overlay') }));
          check(tag + ': klik „Połącz armie" wywołuje onMerge i zamyka panel', c2.calls.merge === 1 && c2.calls.separate === 0 && !c2.open, c2);
        }
        await page.close();
      }
    }
    check('brak pageerror/console.error w Chromium', errors.length === 0, errors);
  } finally {
    await browser.close();
    fs.rmSync(TMPDIR, { recursive: true, force: true });
  }
  console.log('\nMETRYKI: ' + JSON.stringify(metrics));
  console.log('\n[army-merge-list-visibility] ' + pass + ' pass, ' + fail + ' fail');
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
