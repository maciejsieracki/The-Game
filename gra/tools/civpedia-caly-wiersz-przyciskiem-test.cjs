'use strict';
/**
 * civpedia-caly-wiersz-przyciskiem-test.cjs
 *
 * TEMAT: P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1.
 *
 * Weryfikuje ŻYWO (real Chromium, `page.mouse.click` na WIERSZU — nigdy na
 * wewnętrznym `<button>`) 7 kryteriów końca dyspozycji:
 *
 * [1] Karta technologii "Garncarstwo", sekcja "Kolejne technologie" — klik
 *     GDZIEKOLWIEK w wierszu ("Wymiana", "Brązownictwo", "Pismo", "Religia")
 *     otwiera kartę docelowej technologii. Fixture: wszystkie cztery są REALNYMI
 *     "kolejnymi technologiami" Garncarstwa w tech.json (potwierdzone poniżej),
 *     dokładnie odtwarzając zgłoszenie właściciela ("Wymaga też rolnictwo
 *     oswojenie zwierząt [...] jest kolejna technologia wymiana [...] to samo z
 *     brązownictwem, pismem, religią").
 * [2] Sekcja "Budynki" (Spichlerz/Garncarnia/Cegielnia — realne budynki
 *     odblokowywane przez Garncarstwo) — regresja: już działało (RUNDA 2), musi
 *     nadal działać.
 * [3] Sekcja "Jednostki" (tech "Łucznictwo" — Garncarstwo nie odblokowuje
 *     jednostek) i "Ulepszenia terenu" (Garncarstwo — Glinianka/Warzelnia soli).
 * [4] Sekcja "Zmiany ekonomiczne" — klik w ETYKIETĘ (nie w przycisk `value` z
 *     tekstem efektu) wiersza budynku otwiera kartę tego budynku.
 * [5] "Wymaga też: X, Y" nie jest już jedynym klikalnym elementem: `value` wiersza
 *     "Kolejne technologie" jest puste (button:empty, bez treści), tekst trafia do
 *     `trailing` jako zwykły, NIEinteraktywny `<span>` (brak `data-entity-kind` na
 *     nim, nie jest przodkiem żadnego `<button>`).
 * [6] Regresja na pozostałych kind (unit/wonder/improvement) — klik w POZYCJĘ
 *     ETYKIETY (nie środek przycisku) nadal nawiguje poprawnie.
 * [7] tsc/bramki referencyjne — poza zakresem tego pliku (uruchamiane osobno).
 *
 * Usage (z gra/): node tools/civpedia-caly-wiersz-przyciskiem-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-caly-wiersz-przyciskiem-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'entity-card-cross-links-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'entity-card-cross-links-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.civpedia-caly-wiersz-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-caly-wiersz-bundle.cjs');
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
    console.log('[civpedia-caly-wiersz-przyciskiem-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox'],
    });
  }
}

async function main() {
  // --- fixture (Node, realne dane) ---------------------------------------------------------
  const tech = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8')).technologie;
  const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
  const improvements = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'));
  const wonders = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'wonders.json'), 'utf8')).cuda;

  const garncarstwo = tech.find((t) => t.Technologia === 'Garncarstwo');
  check('fixture: "Garncarstwo" istnieje w tech.json', !!garncarstwo);

  const NEXT_TECH_NAMES = ['Wymiana', 'Brązownictwo', 'Pismo', 'Religia'];
  const nextTechFixtures = NEXT_TECH_NAMES.map((name) => {
    const t = tech.find((x) => x.Technologia === name);
    const reqs = t ? String(t['Wymaga (prereq)']).split('+').map((s) => s.trim()) : [];
    return { name, includesGarncarstwo: reqs.includes('Garncarstwo'), otherPrereqs: reqs.filter((r) => r !== 'Garncarstwo') };
  });
  check('fixture: Wymiana/Brązownictwo/Pismo/Religia są WSZYSTKIE "kolejnymi technologiami" Garncarstwa (wymagają go) i mają >=1 inny prereq (dokładnie zgłoszenie właściciela)',
    nextTechFixtures.every((f) => f.includesGarncarstwo && f.otherPrereqs.length > 0), nextTechFixtures);

  const garnBuildings = buildings.filter((b) => b.techUnlock === 'Garncarstwo').map((b) => b.nazwa ?? b.id);
  check('fixture: Garncarstwo odblokowuje Spichlerz/Garncarnia/Cegielnia (dosłowny przykład właściciela)',
    ['Spichlerz', 'Garncarnia', 'Cegielnia'].every((n) => garnBuildings.includes(n)), garnBuildings);

  const luknictwoUnits = units.filter((u) => u.Tech === 'Łucznictwo').map((u) => u.Jednostka);
  check('fixture: "Łucznictwo" odblokowuje >=1 jednostkę', luknictwoUnits.length > 0, luknictwoUnits);

  const falanga = units.find((u) => u.Jednostka === 'Falanga');
  check('fixture: "Falanga" (Tech=Hutnictwo żelaza) istnieje — regresja kind=unit', !!falanga && falanga.Tech === 'Hutnictwo żelaza');

  const drogaBrukowana = improvements['droga_brukowana'];
  check('fixture: "droga_brukowana" ma tech + upgradeFrom oba rozwiązywalne — regresja kind=improvement (2 linki na 1 karcie)',
    !!drogaBrukowana && drogaBrukowana.tech === 'Drogi brukowane' && drogaBrukowana.upgradeFrom === 'droga'
      && improvements['droga'] != null && tech.some((t) => t.Technologia === 'Drogi brukowane'));

  const piramidy = wonders.find((w) => w.id === 'piramidy');
  check('fixture: cud "piramidy" ma techUnlock zawierające "Murarstwo" rozwiązywalne — regresja kind=wonder',
    !!piramidy && Array.isArray(piramidy.techUnlock) && piramidy.techUnlock.includes('Murarstwo')
      && tech.some((t) => t.Technologia === 'Murarstwo'));

  if (fail > 0) {
    console.log('\n[civpedia-caly-wiersz-przyciskiem-test] fixture nieprawidlowe — przerywam przed budowaniem bundla.');
    process.exitCode = 1;
    return;
  }

  // --- bundel realnego kodu (renderer.ts + adaptery, przez esbuild, jak precedens T10) -------
  fs.writeFileSync(
    ENTRY,
    [
      "export { openEntityCard, buildEntityCardData } from '../src/ui/entityCards/renderer.ts';",
      "export { unitToSlug, technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
      "export { _getEscapeOverlayStackDepthForTest } from '../src/ui/escapeOverlayStack.ts';",
      '',
    ].join('\n'),
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'CivpediaWiersz',
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
    await page.setContent('<!DOCTYPE html><html><head><title>civpedia-caly-wiersz-przyciskiem-test</title></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const techIdOf = async (name) => page.evaluate((n) => window.CivpediaWiersz.technologyIdFromName(n), name);
    const unitIdOf = async (name) => page.evaluate((n) => window.CivpediaWiersz.unitToSlug(n), name);
    const depth = async () => page.evaluate(() => window.CivpediaWiersz._getEscapeOverlayStackDepthForTest());
    const backdrops = async () => page.evaluate(() => document.querySelectorAll('.entity-card-backdrop').length);
    const closeAll = async () => {
      let d = await depth();
      while (d > 0) { await page.keyboard.press('Escape'); d = await depth(); }
    };

    /** Otwiera kartę, znajduje wiersz po tekście etykiety w danej sekcji, klika w
     * PUNKT ETYKIETY (`.entity-card-row-key`/`.entity-card-row-action-text`) —
     * celowo NIE środek `<button>` — i zwraca info o stanie po kliku, plus dowód,
     * że `elementFromPoint` w punkcie kliku NIE trafia bezpośrednio w `<button
     * data-entity-kind>` (czyli test faktycznie sprawdza fallback wiersza, nie
     * przypadkiem klika w sam przycisk, zgodnie z regułą anty-halucynacyjną). */
    async function clickRowLabelAndInspect(kind, id, sectionKey, labelText) {
      await page.evaluate(({ kind, id }) => {
        window.CivpediaWiersz.openEntityCard(kind, id, { mode: 'dialog' });
      }, { kind, id });
      const rowInfo = await page.evaluate(({ sectionKey, labelText }) => {
        const section = document.querySelector(`[data-section-key="${sectionKey}"]`);
        if (!section) return { error: 'no-section' };
        // Sekcje "Ulepszenia terenu"/"Zmiany ekonomiczne" są `collapsible` z
        // `openDefault:false` — bez rozwinięcia wiersze siedzą w `hidden` body
        // (0x0 rect), więc realny klik w nie musi najpierw otworzyć akordeon,
        // dokładnie jak zrobiłby to gracz.
        if (section.getAttribute('data-open') === '0') {
          const headBtn = section.querySelector('.entity-card-section-head');
          headBtn?.click();
        }
        const rows = Array.from(section.querySelectorAll('.entity-card-row'));
        const row = rows.find((r) => {
          const key = r.querySelector('.entity-card-row-key, .entity-card-row-action-text');
          return key && key.textContent === labelText;
        });
        if (!row) return { error: 'no-row', rowLabels: rows.map((r) => r.querySelector('.entity-card-row-key, .entity-card-row-action-text')?.textContent) };
        const keyEl = row.querySelector('.entity-card-row-key, .entity-card-row-action-text');
        // Karta jest w przewijalnym `.entity-card-dialog` (overflow:auto) — wiersze dalej w
        // długiej sekcji (np. "Pismo"/"Religia" w "Kolejne technologie" Garncarstwa) mogą być
        // poza aktualnie widocznym viewportem. `page.mouse.click` klika ŚLEPO w piksel, więc
        // BEZ przewinięcia w widok dałby fałszywy PASS/FAIL (klik w nic albo w zupełnie inny
        // element). Przewijamy w widok PRZED odczytem współrzędnych — realny warunek
        // brzegowy, nie omijanie go.
        keyEl.scrollIntoView({ block: 'center' });
        const r = keyEl.getBoundingClientRect();
        const btn = row.querySelector('button[data-entity-kind]');
        const rowLinked = row.classList.contains('entity-card-row--linked') || row.hasAttribute('data-row-entity-kind');
        return {
          cx: r.left + r.width / 2, cy: r.top + r.height / 2,
          rowKind: row.getAttribute('data-row-entity-kind'), rowId: row.getAttribute('data-row-entity-id'),
          btnEmpty: btn ? btn.textContent === '' : null,
          btnEntityId: btn ? btn.getAttribute('data-entity-id') : null,
          rowLinked,
        };
      }, { sectionKey, labelText });
      if (rowInfo.error) return { rowInfo, hitEl: null, afterClick: null };

      const hitEl = await page.evaluate(({ cx, cy }) => {
        const el = document.elementFromPoint(cx, cy);
        return el ? { tag: el.tagName, isButton: el.closest('button[data-entity-kind]') != null } : null;
      }, rowInfo);

      const depthBefore = await depth();
      await page.mouse.click(rowInfo.cx, rowInfo.cy);
      const depthAfter = await depth();
      const cardTop = await page.evaluate(() => {
        const bs = Array.from(document.querySelectorAll('.entity-card-backdrop'));
        const top = bs[bs.length - 1];
        const card = top?.querySelector('.entity-card');
        return card ? { kind: card.getAttribute('data-entity-kind'), id: card.getAttribute('data-entity-id') } : null;
      });
      return { rowInfo, hitEl, afterClick: { depthBefore, depthAfter, cardTop } };
    }

    // =======================================================================
    // [1] "Kolejne technologie" na karcie "Garncarstwo" — Wymiana/Brązownictwo/
    //     Pismo/Religia. Klik w ETYKIETĘ (nie przycisk), sprawdzenie targetu.
    // =======================================================================
    const garnId = await techIdOf('Garncarstwo');
    for (const name of NEXT_TECH_NAMES) {
      await closeAll();
      const expectedId = await techIdOf(name);
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('technology', garnId, 'next', name);
      check(`[1] "Kolejne technologie": wiersz "${name}" istnieje w sekcji next`, !rowInfo.error, rowInfo);
      if (rowInfo.error) continue;
      check(`[1] "${name}": klik trafia w elementFromPoint który NIE jest wewnątrz <button data-entity-kind> (dowód klikania w wiersz, nie w przycisk)`,
        hitEl && hitEl.isButton === false, hitEl);
      check(`[1] "${name}": klik w etykietę otwiera zagnieżdżoną kartę technology/${expectedId} (głębokość 1→2)`,
        afterClick.depthBefore === 1 && afterClick.depthAfter === 2
          && afterClick.cardTop && afterClick.cardTop.kind === 'technology' && afterClick.cardTop.id === expectedId,
        { expectedId, afterClick });
      // [5] "Wymaga też: X, Y" nie jest jedynym klikalnym elementem: value pusty (button:empty),
      // trailing to zwykły span bez data-entity-kind, poza zasięgiem <button>.
      check(`[1]+[5] "${name}": przycisk value jest PUSTY (row.value='' — cel linku to CAŁY wiersz, nie osobny tekst "Wymaga też")`,
        rowInfo.btnEmpty === true && rowInfo.btnEntityId === expectedId, rowInfo);
      const trailingInfo = await page.evaluate((labelText) => {
        const section = document.querySelector('[data-section-key="next"]');
        const rows = Array.from(section.querySelectorAll('.entity-card-row'));
        const row = rows.find((r) => r.querySelector('.entity-card-row-key')?.textContent === labelText);
        const trailing = row?.querySelector('.entity-card-row-trailing');
        return trailing ? {
          text: trailing.textContent,
          tag: trailing.tagName,
          isInteractive: trailing.tagName === 'BUTTON' || trailing.hasAttribute('data-entity-kind') || trailing.closest('button') != null,
        } : null;
      }, name);
      check(`[5] "${name}": tekst "Wymaga też:" jest w NIEinteraktywnym <span> (trailing), nie w <button>`,
        !!trailingInfo && trailingInfo.tag === 'SPAN' && trailingInfo.isInteractive === false && trailingInfo.text.startsWith('Wymaga też:'),
        trailingInfo);
    }
    await closeAll();

    // =======================================================================
    // [2] Regresja: sekcja "Budynki" (Spichlerz/Garncarnia/Cegielnia).
    // =======================================================================
    for (const name of ['Spichlerz', 'Garncarnia', 'Cegielnia']) {
      await closeAll();
      const b = buildings.find((x) => x.nazwa === name);
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('technology', garnId, 'buildings', name);
      check(`[2] Budynki: wiersz "${name}" istnieje`, !rowInfo.error, rowInfo);
      if (rowInfo.error) continue;
      check(`[2] Budynki "${name}": elementFromPoint w etykiecie NIE jest <button>`, hitEl && hitEl.isButton === false, hitEl);
      check(`[2] Budynki "${name}": klik otwiera kartę building/${b.id} (regresja RUNDA 2 — nadal działa)`,
        afterClick.depthAfter === 2 && afterClick.cardTop && afterClick.cardTop.kind === 'building' && afterClick.cardTop.id === b.id,
        { expectedId: b.id, afterClick });
    }
    await closeAll();

    // =======================================================================
    // [3a] Sekcja "Ulepszenia terenu" (Garncarstwo: Glinianka, Warzelnia soli).
    // =======================================================================
    for (const name of ['Glinianka', 'Warzelnia soli']) {
      await closeAll();
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('technology', garnId, 'improvements', name);
      check(`[3a] Ulepszenia terenu: wiersz "${name}" istnieje`, !rowInfo.error, rowInfo);
      if (rowInfo.error) continue;
      check(`[3a] Ulepszenia terenu "${name}": elementFromPoint w etykiecie NIE jest <button>`, hitEl && hitEl.isButton === false, hitEl);
      check(`[3a] Ulepszenia terenu "${name}": klik otwiera kartę improvement (kind poprawny, głębokość 1→2)`,
        afterClick.depthAfter === 2 && afterClick.cardTop && afterClick.cardTop.kind === 'improvement', afterClick);
    }
    await closeAll();

    // =======================================================================
    // [3b] Sekcja "Jednostki" — tech "Łucznictwo" (Garncarstwo nie ma jednostek).
    // =======================================================================
    const luknictwoId = await techIdOf('Łucznictwo');
    {
      const unitName = luknictwoUnits[0];
      const expectedUnitId = await unitIdOf(unitName);
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('technology', luknictwoId, 'units', unitName);
      check(`[3b] Jednostki: wiersz "${unitName}" istnieje na karcie "Łucznictwo"`, !rowInfo.error, rowInfo);
      if (!rowInfo.error) {
        check(`[3b] Jednostki "${unitName}": elementFromPoint w etykiecie NIE jest <button>`, hitEl && hitEl.isButton === false, hitEl);
        check(`[3b] Jednostki "${unitName}": klik otwiera kartę unit/${expectedUnitId}`,
          afterClick.depthAfter === 2 && afterClick.cardTop && afterClick.cardTop.kind === 'unit' && afterClick.cardTop.id === expectedUnitId,
          { expectedUnitId, afterClick });
      }
    }
    await closeAll();

    // =======================================================================
    // [4] "Zmiany ekonomiczne" — klik w ETYKIETĘ (nie w przycisk `value` z
    //     tekstem efektu) wiersza budynku otwiera kartę tego budynku.
    // =======================================================================
    {
      const b = buildings.find((x) => x.nazwa === 'Spichlerz');
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('technology', garnId, 'econ', 'Spichlerz');
      check('[4] Zmiany ekonomiczne: wiersz "Spichlerz" istnieje', !rowInfo.error, rowInfo);
      if (!rowInfo.error) {
        check('[4] Zmiany ekonomiczne "Spichlerz": klik w etykietę (obok przycisku z tekstem efektu) NIE trafia w <button>',
          hitEl && hitEl.isButton === false, hitEl);
        check('[4] Zmiany ekonomiczne "Spichlerz": klik w etykietę otwiera kartę building/spichlerz (rozszerzony fallback obejmuje NIEpuste value)',
          afterClick.depthAfter === 2 && afterClick.cardTop && afterClick.cardTop.kind === 'building' && afterClick.cardTop.id === b.id,
          { expectedId: b.id, afterClick });
      }
    }
    await closeAll();

    // =======================================================================
    // [6] Regresja innych kind: unit ("Falanga"→"Technologia"), wonder
    //     ("Piramidy"→"Technologia"), improvement ("droga_brukowana"→oba linki).
    // =======================================================================
    const falangaSlug = await unitIdOf('Falanga');
    {
      const expectedTechId = await techIdOf('Hutnictwo żelaza');
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('unit', falangaSlug, 'requirements', 'Technologia');
      check('[6] kind=unit ("Falanga"): wiersz "Technologia" istnieje', !rowInfo.error, rowInfo);
      if (!rowInfo.error) {
        check('[6] kind=unit: elementFromPoint w etykiecie NIE jest <button> (regresja — full-row fallback teraz też tutaj)',
          hitEl && hitEl.isButton === false, hitEl);
        check('[6] kind=unit: klik w etykietę "Technologia" nadal otwiera technology/Hutnictwo żelaza',
          afterClick.depthAfter === 2 && afterClick.cardTop && afterClick.cardTop.kind === 'technology' && afterClick.cardTop.id === expectedTechId,
          { expectedTechId, afterClick });
      }
    }
    await closeAll();

    {
      const expectedTechId = await techIdOf('Murarstwo');
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('wonder', 'piramidy', 'technology', 'Technologia');
      check('[6] kind=wonder ("Piramidy"): wiersz "Technologia" istnieje', !rowInfo.error, rowInfo);
      if (!rowInfo.error) {
        check('[6] kind=wonder: elementFromPoint w etykiecie NIE jest <button>', hitEl && hitEl.isButton === false, hitEl);
        check('[6] kind=wonder: klik w etykietę "Technologia" otwiera technology/Murarstwo',
          afterClick.depthAfter === 2 && afterClick.cardTop && afterClick.cardTop.kind === 'technology' && afterClick.cardTop.id === expectedTechId,
          { expectedTechId, afterClick });
      }
    }
    await closeAll();

    {
      const expectedTechId = await techIdOf('Drogi brukowane');
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('improvement', 'droga_brukowana', 'requirements', 'Technologia');
      check('[6] kind=improvement ("droga_brukowana"): wiersz "Technologia" istnieje', !rowInfo.error, rowInfo);
      if (!rowInfo.error) {
        check('[6] kind=improvement: elementFromPoint w etykiecie NIE jest <button>', hitEl && hitEl.isButton === false, hitEl);
        check('[6] kind=improvement: klik w etykietę "Technologia" otwiera technology/Drogi brukowane',
          afterClick.depthAfter === 2 && afterClick.cardTop && afterClick.cardTop.kind === 'technology' && afterClick.cardTop.id === expectedTechId,
          { expectedTechId, afterClick });
      }
    }
    await closeAll();
    {
      const { rowInfo, hitEl, afterClick } = await clickRowLabelAndInspect('improvement', 'droga_brukowana', 'requirements', 'Ulepszenie bazowe');
      check('[6] kind=improvement ("droga_brukowana"): wiersz "Ulepszenie bazowe" istnieje', !rowInfo.error, rowInfo);
      if (!rowInfo.error) {
        check('[6] kind=improvement: elementFromPoint w etykiecie "Ulepszenie bazowe" NIE jest <button>', hitEl && hitEl.isButton === false, hitEl);
        check('[6] kind=improvement: klik w etykietę "Ulepszenie bazowe" otwiera improvement/droga',
          afterClick.depthAfter === 2 && afterClick.cardTop && afterClick.cardTop.kind === 'improvement' && afterClick.cardTop.id === 'droga',
          afterClick);
      }
    }
    await closeAll();

    // =======================================================================
    // [6b] Zero fałszywej klikalności bez linkTo (GOAL pkt 6): "Dostęp do surowca"
    //      w "Zmianach ekonomicznych" Garncarstwa nie ma linkTo — wiersz NIE
    //      dostaje klasy --linked ani atrybutów fallbacku.
    // =======================================================================
    {
      await page.evaluate((id) => { window.CivpediaWiersz.openEntityCard('technology', id, { mode: 'dialog' }); }, garnId);
      const noLinkRow = await page.evaluate(() => {
        const section = document.querySelector('[data-section-key="econ"]');
        const rows = Array.from(section?.querySelectorAll('.entity-card-row') ?? []);
        const row = rows.find((r) => r.querySelector('.entity-card-row-key')?.textContent === 'Dostęp do surowca');
        if (!row) return null;
        return { hasLinkedClass: row.classList.contains('entity-card-row--linked'), hasFallbackAttr: row.hasAttribute('data-row-entity-kind') };
      });
      check('[6b] wiersz "Dostęp do surowca" (bez linkTo) istnieje w sekcji econ', !!noLinkRow, noLinkRow);
      if (noLinkRow) {
        check('[6b] wiersz bez linkTo NIE dostaje entity-card-row--linked ani data-row-entity-kind (GOAL pkt 6)',
          noLinkRow.hasLinkedClass === false && noLinkRow.hasFallbackAttr === false, noLinkRow);
      }
    }
    await closeAll();

    check('brak błędów konsoli/JS w całym scenariuszu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); } catch (e) { /* noop */ }
    try { fs.unlinkSync(OUTFILE); } catch (e) { /* noop */ }
  }

  console.log(`\n${'='.repeat(72)}\nCIVPEDIA CALY WIERSZ PRZYCISKIEM TEST: ${pass}/${pass + fail} pass`);
  if (fail > 0) {
    console.log(`FAIL: ${fail}`);
    process.exitCode = 1;
  } else {
    console.log('All checks passed.');
  }
}

main().catch((err) => {
  console.error('[civpedia-caly-wiersz-przyciskiem-test] fatal:', err);
  process.exitCode = 1;
});
