'use strict';
/**
 * civpedia-karty-spojnosc-q1-c-test.cjs
 *
 * TEMAT: R-CIVPEDIA-KARTY-SPOJNOSC-Q1-C.
 *
 * Weryfikuje żywym Chromium (Playwright) wszystkie 5 binarnych kryteriów końca dispatchu:
 *  (1) karta technologii ma TĘ SAMĄ wysokość ze wszystkimi sekcjami accordion rozwiniętymi
 *      i zwiniętymi, przyciski akcji osiągalne scrollem w OBU stanach;
 *  (2) karta-satelita (budynek otwarty z linku wewnątrz karty technologii — DOKŁADNIE
 *      scenariusz zgłoszenia: „Obróbka drewna" → „Stolarnia") ma tę samą szerokość I
 *      wysokość co karta technologii, zmierzone w JEDNYM kadrze;
 *  (3) próg wąskiego okna na 3 szerokościach (1200, 1400±20, 1920): powyżej — obie karty
 *      obok siebie bez nakładania; poniżej — układ pionowy, obie w pełni dostępne;
 *  (4) 2 wysokości viewportu (700, 900) w obu układach: brak przycięcia bez scrolla —
 *      ostatni element osiągalny po przewinięciu do końca.
 *
 * Nie zakłada wartości CSS ze źródła — mierzy `getBoundingClientRect()` na realnym
 * layoutcie Chromium, zgodnie z REGUŁĄ PRZECIW SAMOOSZUKIWANIU dispatchu.
 *
 * Usage (z gra/): node tools/civpedia-karty-spojnosc-q1-c-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-karty-spojnosc-q1-c-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'tech-discovery-click-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'tech-discovery-click-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.civpedia-karty-spojnosc-q1-c-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-karty-spojnosc-q1-c-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const TECH = 'Obróbka drewna'; // dokładnie scenariusz zgłoszenia właściciela (zrzut „Stolarnia" obok)

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const stubIconsPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[civpedia-karty-spojnosc-q1-c-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Otwiera kartę technologii, rozwija/zwija wszystkie sekcje accordion na komendę,
 * i klika DOKŁADNIE pierwszy link krzyżowy budynku ("Stolarnia") w sekcji "Odblokowuje
 * budynek" — to samo, co scenariusz zgłoszenia właściciela — żeby otworzyć satelitę. */
async function openTechAndMaybeSide(page, techName, { expandAll, openSide }) {
  await page.evaluate((techName) => {
    window.__hide();
    window.__show({ techName, eraIndex: 1, kind: 'preview', onStartResearch: () => {}, onOpenTree: () => {} });
  }, techName);
  await page.waitForTimeout(50);
  if (expandAll) {
    await page.evaluate(() => {
      const host = document.getElementById('civ-tech-discovery-notice-host');
      host.querySelectorAll('.entity-card-section-toggle, .entity-card-row[data-row-entity-kind], button[aria-expanded]')
        .forEach(() => {});
      // Selektor przycisków sekcji renderera — nieznany na 100% z zewnątrz, więc
      // klikamy KAŻDY element z aria-expanded="false" wewnątrz karty (ogólny wzorzec
      // accordion), niezależnie od dokładnej nazwy klasy w renderer.ts.
      host.querySelectorAll('[aria-expanded="false"]').forEach((el) => el.click());
    });
    await page.waitForTimeout(50);
  }
  if (openSide) {
    const clicked = await page.evaluate(() => {
      const host = document.getElementById('civ-tech-discovery-notice-host');
      const card = host.querySelector('.tdn-entity-card-v2');
      const btn = card.querySelector('button[data-entity-kind="building"][data-entity-id]')
        || card.querySelector('.entity-card-row[data-row-entity-kind="building"]');
      if (!btn) return false;
      btn.click();
      return true;
    });
    // 180ms animacja wjazdu satelity (civ-tdn-in) — czekamy dłużej niż jej czas trwania,
    // żeby nie mierzyć KART W TRAKCIE przejścia (fałszywa różnica top/left z transformu).
    await page.waitForTimeout(280);
    return clicked;
  }
  return true;
}

async function measure(page) {
  return page.evaluate(() => {
    const host = document.getElementById('civ-tech-discovery-notice-host');
    if (!host) return { error: 'no-host' };
    const main = host.querySelector('.tdn-entity-card-v2');
    const side = host.querySelector('.tdn-side-card');
    const r = (el) => el ? el.getBoundingClientRect() : null;
    const mainR = r(main);
    const sideR = r(side);
    const actions = main ? main.querySelector('.entity-card-actions') : null;
    const actionsR = r(actions);
    return {
      mainR: mainR && { w: mainR.width, h: mainR.height, top: mainR.top, bottom: mainR.bottom, left: mainR.left, right: mainR.right },
      sideR: sideR && { w: sideR.width, h: sideR.height, top: sideR.top, bottom: sideR.bottom, left: sideR.left, right: sideR.right },
      actionsR: actionsR && { top: actionsR.top, bottom: actionsR.bottom },
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      hostHasSide: host.classList.contains('tdn-has-side'),
    };
  });
}

/** Przewija kartę (i host) do samego końca, potem sprawdza czy element `sel` jest
 * w pełni widoczny w viewporcie (dowód: ostatni element osiągalny scrollem). */
async function scrollToEndAndCheckVisible(page, cardSel, targetSel) {
  return page.evaluate(({ cardSel, targetSel }) => {
    const host = document.getElementById('civ-tech-discovery-notice-host');
    const card = host.querySelector(cardSel);
    if (!card) return { error: 'no-card' };
    card.scrollTop = card.scrollHeight;
    host.scrollTop = host.scrollHeight;
    const target = card.querySelector(targetSel);
    if (!target) return { error: 'no-target' };
    const tr = target.getBoundingClientRect();
    const fullyVisible = tr.top >= 0 && tr.bottom <= window.innerHeight && tr.left >= 0 && tr.right <= window.innerWidth;
    return { fullyVisible, rect: { top: tr.top, bottom: tr.bottom }, innerHeight: window.innerHeight };
  }, { cardSel, targetSel });
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { showTechDiscoveryNotice, hideTechDiscoveryNotice } from '../src/ui/techDiscoveryNotice.ts';",
    'window.__show = showTechDiscoveryNotice;',
    'window.__hide = hideTechDiscoveryNotice;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: [stubIconsPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const consoleErrors = [];

  try {
    // ============================================================================
    // (1) STAŁA WYSOKOŚĆ: karta technologii, sekcje ZWINIĘTE vs ROZWINIĘTE.
    // ============================================================================
    {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', (e) => consoleErrors.push(String(e)));
      await page.setContent('<!DOCTYPE html><html><head></head><body></body></html>');
      await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

      await openTechAndMaybeSide(page, TECH, { expandAll: false, openSide: false });
      const collapsed = await measure(page);
      await openTechAndMaybeSide(page, TECH, { expandAll: true, openSide: false });
      const expanded = await measure(page);

      console.log('\n-- (1) Wysokość karty: sekcje zwinięte vs rozwinięte --');
      check('(1) karta technologii istnieje w obu stanach', !!collapsed.mainR && !!expanded.mainR, { collapsed, expanded });
      check('(1) wysokość karty IDENTYCZNA (±1px) zwinięte vs rozwinięte',
        Math.abs(collapsed.mainR.h - expanded.mainR.h) <= 1,
        { collapsedH: collapsed.mainR.h, expandedH: expanded.mainR.h });
      check('(1) wysokość ~80% viewportu (720px przy 900px, tolerancja 5px)',
        Math.abs(expanded.mainR.h - 720) <= 5, expanded.mainR.h);

      const endCollapsed = await scrollToEndAndCheckVisible(page, '.tdn-entity-card-v2', '.entity-card-actions');
      await openTechAndMaybeSide(page, TECH, { expandAll: false, openSide: false });
      const endCollapsed2 = await scrollToEndAndCheckVisible(page, '.tdn-entity-card-v2', '.entity-card-actions');
      await openTechAndMaybeSide(page, TECH, { expandAll: true, openSide: false });
      const endExpanded = await scrollToEndAndCheckVisible(page, '.tdn-entity-card-v2', '.entity-card-actions');

      check('(1) przyciski akcji osiągalne scrollem — stan ROZWINIĘTY (po przewinięciu do końca)',
        endExpanded.fullyVisible === true, endExpanded);
      check('(1) przyciski akcji osiągalne scrollem — stan ZWINIĘTY (po przewinięciu do końca)',
        endCollapsed2.fullyVisible === true, endCollapsed2);

      await page.close();
    }

    // ============================================================================
    // (2) SATELITA: ta sama szerokość I wysokość co karta technologii, w JEDNYM kadrze.
    // ============================================================================
    {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', (e) => consoleErrors.push(String(e)));
      await page.setContent('<!DOCTYPE html><html><head></head><body></body></html>');
      await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

      const opened = await openTechAndMaybeSide(page, TECH, { expandAll: false, openSide: true });
      check('(2) fixture: link budynku ("Stolarnia") znaleziony i kliknięty', opened === true);
      const m = await measure(page);
      console.log('\n-- (2) Satelita vs karta technologii, w jednym kadrze --');
      check('(2) obie karty obecne jednocześnie', !!m.mainR && !!m.sideR, m);
      if (m.mainR && m.sideR) {
        check('(2) SZEROKOŚĆ identyczna (±2px)', Math.abs(m.mainR.w - m.sideR.w) <= 2,
          { mainW: m.mainR.w, sideW: m.sideR.w });
        check('(2) WYSOKOŚĆ identyczna (±2px)', Math.abs(m.mainR.h - m.sideR.h) <= 2,
          { mainH: m.mainR.h, sideH: m.sideR.h });
      }
      await page.close();
    }

    // ============================================================================
    // (3) PRÓG WĄSKIEGO OKNA na 3 szerokościach: 1200 (poniżej), 1380/1420 (tuż przy
    //     nowym progu 1400), 1920 (powyżej) — layout obok siebie / pionowy.
    // ============================================================================
    console.log('\n-- (3) Próg wąskiego okna: 1200 / 1380 / 1420 / 1920 --');
    for (const width of [1200, 1380, 1420, 1920]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', (e) => consoleErrors.push(String(e)));
      await page.setContent('<!DOCTYPE html><html><head></head><body></body></html>');
      await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
      await openTechAndMaybeSide(page, TECH, { expandAll: false, openSide: true });
      const m = await measure(page);
      const belowThreshold = width <= 1400;
      if (belowThreshold) {
        check(`(3) [${width}px, poniżej/na progu 1400] układ PIONOWY (satelita POD kartą technologii, nie obok)`,
          m.sideR.top >= m.mainR.bottom - 1, { width, mainR: m.mainR, sideR: m.sideR });
        check(`(3) [${width}px] obie karty w pełni w viewporcie w poziomie (brak przycięcia szerokości)`,
          m.mainR.left >= 0 && m.mainR.right <= width && m.sideR.left >= 0 && m.sideR.right <= width,
          { width, mainR: m.mainR, sideR: m.sideR });
      } else {
        check(`(3) [${width}px, powyżej progu 1400] układ OBOK SIEBIE (ten sam rząd, brak nakładania)`,
          Math.abs(m.mainR.top - m.sideR.top) <= 2 && (m.mainR.right <= m.sideR.left + 1 || m.sideR.right <= m.mainR.left + 1),
          { width, mainR: m.mainR, sideR: m.sideR });
        check(`(3) [${width}px] zero nakładania prostokątów obu kart`,
          m.mainR.right <= m.sideR.left + 0.5 || m.sideR.right <= m.mainR.left + 0.5,
          { width, mainR: m.mainR, sideR: m.sideR });
      }
      await page.close();
    }

    // ============================================================================
    // (4) 2 wysokości (700, 900) w OBU układach (pojedyncza karta / dwie karty) —
    //     brak przycięcia treści bez dostępnego scrolla.
    // ============================================================================
    console.log('\n-- (4) Wysokości viewportu 700px i 900px, oba układy --');
    for (const height of [700, 900]) {
      // (4a) pojedyncza karta
      {
        const page = await browser.newPage({ viewport: { width: 1600, height } });
        page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
        page.on('pageerror', (e) => consoleErrors.push(String(e)));
        await page.setContent('<!DOCTYPE html><html><head></head><body></body></html>');
        await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
        await openTechAndMaybeSide(page, TECH, { expandAll: true, openSide: false });
        const end = await scrollToEndAndCheckVisible(page, '.tdn-entity-card-v2', '.entity-card-actions');
        check(`(4) [${height}px, pojedyncza karta] przyciski akcji osiągalne po scrollu do końca`,
          end.fullyVisible === true, end);
        await page.close();
      }
      // (4b) dwie karty (satelita)
      {
        const page = await browser.newPage({ viewport: { width: 1600, height } });
        page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
        page.on('pageerror', (e) => consoleErrors.push(String(e)));
        await page.setContent('<!DOCTYPE html><html><head></head><body></body></html>');
        await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
        await openTechAndMaybeSide(page, TECH, { expandAll: false, openSide: true });
        const endMain = await scrollToEndAndCheckVisible(page, '.tdn-entity-card-v2', '.entity-card-actions');
        const endSide = await page.evaluate(() => {
          const host = document.getElementById('civ-tech-discovery-notice-host');
          const side = host.querySelector('.tdn-side-card');
          side.scrollTop = side.scrollHeight;
          host.scrollTop = host.scrollHeight;
          const last = side.querySelector('.entity-card-section:last-child, .entity-card-actions, .entity-card-body > *:last-child');
          if (!last) return { fullyVisible: null };
          const tr = last.getBoundingClientRect();
          return { fullyVisible: tr.bottom <= window.innerHeight + 1 && tr.top >= -1 };
        });
        check(`(4) [${height}px, dwie karty (satelita)] karta technologii: ostatni element osiągalny po scrollu`,
          endMain.fullyVisible === true, endMain);
        check(`(4) [${height}px, dwie karty (satelita)] karta-satelita: ostatni element osiągalny po scrollu`,
          endSide.fullyVisible !== false, endSide);
        await page.close();
      }
    }

    check('(5) zero błędów konsoli/pageerror w całym przebiegu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } }
  }

  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[civpedia-karty-spojnosc-q1-c-test] błąd:', err);
  process.exit(1);
});
