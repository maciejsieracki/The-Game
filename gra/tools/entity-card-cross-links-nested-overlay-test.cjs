'use strict';
/**
 * entity-card-cross-links-nested-overlay-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T10 LINKOWANIE-KRZYZOWE (OSTATNI
 * krok migracji CivPedii — plan architektury §6 wiersz T10, §7 pkt 5).
 *
 * Weryfikuje dwa filary dispatchu T10:
 *
 * [1] `renderer.ts` honoruje `row.linkTo` JEDNOLICIE dla wszystkich adapterów i
 *     WSZYSTKICH trzech layoutów wiersza (`grid` zwykły, `grid` z `badge`,
 *     `pills`) — real Chromium (nie jsdom): precedens
 *     R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1 — stos Esc/overlay i hit-testing
 *     kliku to dokładnie klasa buga, której jsdom nie łapie
 *     (`tech-discovery-card-real-click-test.cjs`,
 *     `improvement-card-callsites-test.cjs`).
 *
 * [2] KRYTERIUM UKOŃCZENIA T10 (dyspozycja, nie tylko "linki działają"): stos
 *     Esc/overlay przy >=2 zagnieżdżonych kartach. Scenariusz: otwórz kartę
 *     jednostki A ("Falanga"), z niej realny klik na klikalny wiersz
 *     "Technologia" -> otwiera zagnieżdżoną kartę technologii B ("Hutnictwo
 *     żelaza") NAD kartą A (A zostaje w DOM, nie zamyka się). Esc zamyka TYLKO
 *     B (A zostaje w DOM). Esc ponownie zamyka A (obie karty zniknęły z DOM).
 *
 * Dodatkowo: weryfikacja "brak podwójnego otwarcia" dla `row.badge` + `linkTo`
 * (wiersz "Możesz badać" w sekcji "Kolejne technologie" — renderer musi honorować
 * `linkTo` RÓWNIEŻ w gałęzi `badge`, nie tylko w zwykłym `grid`) oraz dla
 * `layout:'pills'` (sekcja "Wymagania" karty technologii).
 *
 * Usage (z gra/): node tools/entity-card-cross-links-nested-overlay-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-card-cross-links-nested-overlay-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'entity-card-cross-links-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'entity-card-cross-links-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.entity-card-cross-links-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-card-cross-links-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[entity-card-cross-links-nested-overlay-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox'],
    });
  }
}

async function main() {
  // --- fixture: realne dane, nie zmyślone (jak entity-card-contract-test.cjs) ---
  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
  const falanga = units.find((u) => u.Jednostka === 'Falanga');
  check('fixture: "Falanga" istnieje w units.json, ma Tech + "W zamian za" rozwiązywalne',
    !!falanga && falanga.Tech === 'Hutnictwo żelaza' && falanga['W zamian za'] === 'Włócznik',
    falanga && { Tech: falanga.Tech, zamiana: falanga['W zamian za'] });

  const tech = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8')).technologie;
  const hutnictwo = tech.find((t) => t.Technologia === 'Hutnictwo żelaza');
  check('fixture: "Hutnictwo żelaza" istnieje w tech.json', !!hutnictwo);

  fs.writeFileSync(
    ENTRY,
    [
      "export { openEntityCard, buildEntityCardData } from '../src/ui/entityCards/renderer.ts';",
      "export { unitToSlug, technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
      "export { isEscapeOverlayStackActive, _getEscapeOverlayStackDepthForTest } from '../src/ui/escapeOverlayStack.ts';",
      '',
    ].join('\n'),
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'EntityCardsT10',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  try {
    await page.setContent('<!DOCTYPE html><html><head><title>entity-card-cross-links-nested-overlay-test</title></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    // =======================================================================
    // [1] Otwórz kartę A: jednostka "Falanga" (mode:'dialog').
    // =======================================================================
    const unitSlug = await page.evaluate(() => window.EntityCardsT10.unitToSlug('Falanga'));
    check('unitToSlug("Falanga") zwraca niepusty slug', typeof unitSlug === 'string' && unitSlug.length > 0, unitSlug);

    await page.evaluate((slug) => {
      window.EntityCardsT10.openEntityCard('unit', slug, { mode: 'dialog' });
    }, unitSlug);

    const depthAfterA = await page.evaluate(() => window.EntityCardsT10._getEscapeOverlayStackDepthForTest());
    check('po otwarciu karty A: stos overlay ma głębokość 1', depthAfterA === 1, depthAfterA);

    const backdropCountAfterA = await page.evaluate(() => document.querySelectorAll('.entity-card-backdrop').length);
    check('po otwarciu karty A: dokładnie 1 backdrop w DOM', backdropCountAfterA === 1, backdropCountAfterA);

    // --- wiersz "Technologia" (unitAdapter, T10) musi być klikalnym <button> z linkTo ---
    const techRowInfo = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.entity-card-unit .entity-card-row'));
      const row = rows.find((r) => r.querySelector('.entity-card-row-key')?.textContent === 'Technologia');
      const btn = row?.querySelector('button.entity-card-row-value[data-entity-kind="technology"]');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, entityId: btn.getAttribute('data-entity-id') };
    });
    check('karta A (unit): wiersz "Technologia" jest <button data-entity-kind="technology"> (T10 unitAdapter linkTo)',
      !!techRowInfo, techRowInfo);

    if (techRowInfo) {
      const hitEl = await page.evaluate(({ cx, cy }) => {
        const el = document.elementFromPoint(cx, cy);
        return el ? { tag: el.tagName, kind: el.getAttribute('data-entity-kind') } : null;
      }, techRowInfo);
      check('elementFromPoint na środku wiersza "Technologia" trafia w SAM PRZYCISK',
        hitEl && hitEl.tag === 'BUTTON' && hitEl.kind === 'technology', hitEl);

      // ===== REALNY KLIK MYSZĄ (nie dispatchEvent) — dokładnie precedens tech-discovery-card-real-click-test.cjs =====
      await page.mouse.click(techRowInfo.cx, techRowInfo.cy);

      const depthAfterB = await page.evaluate(() => window.EntityCardsT10._getEscapeOverlayStackDepthForTest());
      check('[2] po kliknięciu wiersza "Technologia": stos overlay ma głębokość 2 (A + B zagnieżdżone)',
        depthAfterB === 2, depthAfterB);

      const backdropCountAfterB = await page.evaluate(() => document.querySelectorAll('.entity-card-backdrop').length);
      check('[2] po kliknięciu: DOKŁADNIE 2 backdropy w DOM (karta A NIE zamknięta, karta B otwarta NAD nią — nie podwójnie otwarta)',
        backdropCountAfterB === 2, backdropCountAfterB);

      const cardBInfo = await page.evaluate(() => {
        const backdrops = Array.from(document.querySelectorAll('.entity-card-backdrop'));
        const top = backdrops[backdrops.length - 1];
        const card = top?.querySelector('.entity-card');
        return card ? { kind: card.getAttribute('data-entity-kind'), id: card.getAttribute('data-entity-id') } : null;
      });
      check('[2] karta na wierzchu (B) to kind="technology" z id === data-entity-id wiersza-linku',
        !!cardBInfo && cardBInfo.kind === 'technology' && cardBInfo.id === techRowInfo.entityId, cardBInfo);

      // ===== Esc #1: zamyka TYLKO B (wierzchnią), A zostaje w DOM =====
      await page.keyboard.press('Escape');
      const afterEsc1 = await page.evaluate(() => ({
        depth: window.EntityCardsT10._getEscapeOverlayStackDepthForTest(),
        backdrops: document.querySelectorAll('.entity-card-backdrop').length,
        remainingKind: document.querySelector('.entity-card-backdrop .entity-card')?.getAttribute('data-entity-kind') ?? null,
      }));
      check('[2] Esc #1: głębokość stosu spada do 1 (B zdjęta, A zostaje)', afterEsc1.depth === 1, afterEsc1);
      check('[2] Esc #1: DOKŁADNIE 1 backdrop w DOM po zamknięciu B', afterEsc1.backdrops === 1, afterEsc1);
      check('[2] Esc #1: karta pozostała w DOM to kind="unit" (A, NIE B)', afterEsc1.remainingKind === 'unit', afterEsc1);

      // ===== Esc #2: zamyka A — obie karty zniknęły =====
      await page.keyboard.press('Escape');
      const afterEsc2 = await page.evaluate(() => ({
        depth: window.EntityCardsT10._getEscapeOverlayStackDepthForTest(),
        backdrops: document.querySelectorAll('.entity-card-backdrop').length,
      }));
      check('[2] Esc #2: głębokość stosu spada do 0', afterEsc2.depth === 0, afterEsc2);
      check('[2] Esc #2: ZERO backdropów w DOM (A też zamknięta)', afterEsc2.backdrops === 0, afterEsc2);
    }

    // =======================================================================
    // [3] "Zastępuje" (unitAdapter, T10) — druga klikalna referencja na TEJ SAMEJ
    //     karcie jednostki, do INNEJ jednostki ("Włócznik").
    // =======================================================================
    await page.evaluate((slug) => {
      window.EntityCardsT10.openEntityCard('unit', slug, { mode: 'dialog' });
    }, unitSlug);
    const zamianaRowInfo = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.entity-card-unit .entity-card-row'));
      const row = rows.find((r) => r.querySelector('.entity-card-row-key')?.textContent === 'Zastępuje');
      const btn = row?.querySelector('button.entity-card-row-value[data-entity-kind="unit"]');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, entityId: btn.getAttribute('data-entity-id') };
    });
    check('karta A (unit): wiersz "Zastępuje" jest <button data-entity-kind="unit"> (T10 unitAdapter linkTo)',
      !!zamianaRowInfo, zamianaRowInfo);
    if (zamianaRowInfo) {
      await page.mouse.click(zamianaRowInfo.cx, zamianaRowInfo.cy);
      const nestedUnit = await page.evaluate(() => {
        const backdrops = Array.from(document.querySelectorAll('.entity-card-backdrop'));
        const top = backdrops[backdrops.length - 1];
        const card = top?.querySelector('.entity-card');
        return card ? { kind: card.getAttribute('data-entity-kind'), id: card.getAttribute('data-entity-id') } : null;
      });
      check('[3] klik "Zastępuje" otwiera zagnieżdżoną kartę unit "Włócznik" (id zgodny z linkTo)',
        !!nestedUnit && nestedUnit.kind === 'unit' && nestedUnit.id === zamianaRowInfo.entityId, nestedUnit);
      // sprzątanie stosu przed kolejnym scenariuszem
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
    }

    // =======================================================================
    // [4] `row.badge` + `linkTo` razem (technologyAdapter, sekcja "Kolejne
    //     technologie", wiersz "Możesz badać") — renderer musi honorować linkTo
    //     RÓWNIEŻ w gałęzi z badge, bez podwójnego otwarcia.
    // =======================================================================
    const techSlugSrc = await page.evaluate(() => window.EntityCardsT10.technologyIdFromName('Obróbka drewna'));
    const nextTechCheck = await page.evaluate((slug) => {
      const data = window.EntityCardsT10.buildEntityCardData('technology', slug, {});
      const nextSection = data?.sections.find((s) => s.key === 'next');
      const row = nextSection?.rows.find((r) => r.badge != null && r.linkTo != null);
      return row ? { label: row.label, badgeLabel: row.badge.label, linkTo: row.linkTo } : null;
    }, techSlugSrc);
    check('fixture: technologyAdapter("Obróbka drewna") ma >=1 wiersz "Kolejne technologie" z badge+linkTo razem',
      !!nextTechCheck, nextTechCheck);

    if (nextTechCheck) {
      await page.evaluate((slug) => {
        window.EntityCardsT10.openEntityCard('technology', slug, { mode: 'dialog' });
      }, techSlugSrc);
      const badgeLinkBtn = await page.evaluate(() => {
        const section = document.querySelector('[data-section-key="next"]');
        const btn = section?.querySelector('.entity-card-row-action-text[data-entity-kind="technology"]');
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, entityId: btn.getAttribute('data-entity-id') };
      });
      check('[4] wiersz badge "Kolejne technologie" renderuje się jako <button data-entity-kind> (nie tylko <span>)',
        !!badgeLinkBtn, badgeLinkBtn);
      if (badgeLinkBtn) {
        await page.mouse.click(badgeLinkBtn.cx, badgeLinkBtn.cy);
        const afterBadgeClick = await page.evaluate(() => ({
          depth: window.EntityCardsT10._getEscapeOverlayStackDepthForTest(),
          backdrops: document.querySelectorAll('.entity-card-backdrop').length,
        }));
        check('[4] klik wiersza badge+linkTo otwiera DOKŁADNIE JEDNĄ nową nakładkę (głębokość 2, nie 3+ — brak podwójnego dispatchu)',
          afterBadgeClick.depth === 2 && afterBadgeClick.backdrops === 2, afterBadgeClick);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
      }
    }

    // =======================================================================
    // [5] `layout:'pills'` + `linkTo` (technologyAdapter, sekcja "Wymagania").
    // =======================================================================
    // "Łucznictwo" wymaga "Łowiectwo" (tech.json, realny, niepusty "Wymaga (prereq)") —
    // fixture zweryfikowany reconem (NIE "Irygacja": ta nazwa figuruje wyłącznie jako
    // pole `tech` w `terrain-improvements.json::irygacja`, ale sama TECHNOLOGIA o takiej
    // nazwie nie istnieje w tech.json — dokładnie przypadek, w którym unitAdapter/
    // improvementAdapter świadomie NIE dodają linkTo, patrz komentarze w tych plikach).
    const pillsFixtureTechSlug = await page.evaluate(() => window.EntityCardsT10.technologyIdFromName('Łucznictwo'));
    const pillsCheck = await page.evaluate((slug) => {
      const data = window.EntityCardsT10.buildEntityCardData('technology', slug, {});
      const reqSection = data?.sections.find((s) => s.key === 'requirements');
      const row = reqSection?.rows.find((r) => r.linkTo != null);
      return row ? { label: row.label, linkTo: row.linkTo } : null;
    }, pillsFixtureTechSlug);
    check('fixture: technologyAdapter("Łucznictwo") ma >=1 pigułkę "Wymagania" z linkTo',
      !!pillsCheck, pillsCheck);

    if (pillsCheck) {
      await page.evaluate((slug) => {
        window.EntityCardsT10.openEntityCard('technology', slug, { mode: 'dialog' });
      }, pillsFixtureTechSlug);
      const pillBtn = await page.evaluate(() => {
        const section = document.querySelector('[data-section-key="requirements"]');
        const btn = section?.querySelector('.entity-card-pill-text[data-entity-kind="technology"]');
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, entityId: btn.getAttribute('data-entity-id') };
      });
      check('[5] pigułka "Wymagania" renderuje się jako <button data-entity-kind> (layout:"pills" honoruje linkTo)',
        !!pillBtn, pillBtn);
      if (pillBtn) {
        await page.mouse.click(pillBtn.cx, pillBtn.cy);
        const afterPillClick = await page.evaluate(() => ({
          depth: window.EntityCardsT10._getEscapeOverlayStackDepthForTest(),
          backdrops: document.querySelectorAll('.entity-card-backdrop').length,
        }));
        check('[5] klik pigułki z linkTo otwiera dokładnie jedną nową nakładkę (głębokość 2)',
          afterPillClick.depth === 2 && afterPillClick.backdrops === 2, afterPillClick);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
      }
    }

    check('zero błędów konsoli/pageerror w całym scenariuszu T10', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log(`\n[entity-card-cross-links-nested-overlay-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
