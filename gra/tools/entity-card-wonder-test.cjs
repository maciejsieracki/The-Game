'use strict';
/**
 * entity-card-wonder-test.cjs
 *
 * TEMAT: R-KARTY-HISTORIA-INFRA-CUDA-Q1 (16/17 — cuda świata jako piąta i ostatnia
 * kategoria migrowana na wspólny system kart encji, patrz 00-dispatch.md).
 *
 * Weryfikuje w PRAWDZIWEJ przeglądarce (Chromium/Playwright, nie jsdom — wymóg
 * dispatchu "REGULA PRZECIW SAMOOSZUKIWANIU"), na REALNYCH danych gry
 * (`data/wonders.json` jak dziś w repo, ZERO mutacji plików danych):
 *
 * [1] `openEntityCard('wonder', <id>, {mode:'dialog'})` (a niżej `buildEntityCardData`
 *     + `renderEntityCard` bezpośrednio) renderuje realną kartę encji (>0 sekcji/wierszy)
 *     dla dowolnego z 19 aktywnych cudów (kryterium końca 1).
 * [2] Panel budowy (`buildModeHud.ts`): klik ikonki info (ⓘ) na wierszu cudu (w tym
 *     LOCKED) otwiera tę kartę; klik POZA ikonką (reszta wiersza) nadal wywołuje
 *     `onSelectWonder` z DOKŁADNIE tym samym argumentem co przed zmianą — zero
 *     regresu — zweryfikowane DWOMA OSOBNYMI, realnymi kliknięciami myszy w
 *     Chromium (nie przez czytanie kodu) (kryterium końca 2).
 * [3] Karta NIE renderuje wiersza „Uwagi" (dev-tekst z `wonder.uwagi`) w żadnej
 *     sekcji, mimo że dane realnie mają niepuste `uwagi` dla części cudów
 *     (kryterium końca 3).
 * [4] Sekcja „Rys historyczny" (`.entity-card-historia`) jest NIEOBECNA dla
 *     WSZYSTKICH 19 aktywnych cudów na dzisiejszych danych (pole `historia`
 *     jeszcze nigdzie niewypełnione) — I scenariusz mutacyjny: wstrzyknięcie
 *     `historia` WYŁĄCZNIE w pamięci testu (zero mutacji `gra/data/**`) do
 *     jednego cudu pokazuje, że sekcja SIĘ POJAWIA z dokładnie tym tekstem —
 *     dowód nietautologiczności, wzorem `entity-card-historia-section-test.cjs`
 *     (kryterium końca 4).
 *
 * Usage (z gra/): node tools/entity-card-wonder-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-card-wonder-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-wonder-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-wonder-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.entity-card-wonder-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-card-wonder-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const stubPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[entity-card-wonder-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  // Kontrola przytomności fixture'ów NA REALNYCH DANYCH (przed uruchomieniem przeglądarki):
  // lista aktywnych cudów (`cuda`, POZA `parkowane_epoka4plus`) + potwierdzenie, że co
  // najmniej jeden ma niepuste `uwagi` (żeby kryterium 3 faktycznie coś ćwiczyło).
  const wondersRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'wonders.json'), 'utf8'));
  const activeWonderIds = wondersRaw.cuda.map((w) => w.id);
  check('fixture: wonders.json.cuda ma dokładnie 19 aktywnych cudów', activeWonderIds.length === 19, activeWonderIds.length);
  const wonderWithUwagi = wondersRaw.cuda.find((w) => typeof w.uwagi === 'string' && w.uwagi.trim().length > 0);
  check('fixture: co najmniej jeden aktywny cud ma niepuste "uwagi" (dev-tekst do sprawdzenia wycieku)',
    !!wonderWithUwagi, wonderWithUwagi && wonderWithUwagi.id);
  // Fixture-świadome (nie zakłada z góry "wszystkie puste" — po integracji treści
  // historia dla części cudów to realny, oczekiwany stan, nie regres): jeśli pole
  // "historia" istnieje, MUSI być stringiem — asercja niezmienna niezależnie od
  // tego, ile cudów ma już wypełnioną treść.
  const historiaFilled = wondersRaw.cuda.filter((w) => typeof w.historia === 'string' && w.historia.trim() !== '');
  check(`fixture: pole "historia" (jeśli istnieje) jest zawsze stringiem — dziś wypełnione dla ${historiaFilled.length}/19 cudów`,
    wondersRaw.cuda.every((w) => w.historia === undefined || typeof w.historia === 'string'));

  fs.writeFileSync(
    ENTRY,
    [
      "import { renderEntityCard, buildEntityCardData, openEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
      "import { resolveWonderRow } from '../src/ui/entityCards/registry.ts';",
      "import { wonderAdapter } from '../src/ui/entityCards/wonderAdapter.ts';",
      "import { createBuildModeHud } from '../src/ui/buildModeHud.ts';",
      'window.__renderEntityCard = renderEntityCard;',
      'window.__buildEntityCardData = buildEntityCardData;',
      'window.__openEntityCard = openEntityCard;',
      'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
      'window.__resolveWonderRow = resolveWonderRow;',
      'window.__wonderAdapter = wonderAdapter;',
      'window.__createBuildModeHud = createBuildModeHud;',
      '',
    ].join('\n'),
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [stubPlugin],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  await page.setContent('<!DOCTYPE html><html><head><title>entity-card-wonder-test</title></head><body><div id="root"></div></body></html>');
  await page.addScriptTag({ content: bundleJs });
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = window.__ENTITY_CARD_CSS;
    document.head.appendChild(style);
  });

  // ---------------------------------------------------------------------
  // [1] Karta encji dla wszystkich 19 cudów + [3]/[4] kontrole na TYCH SAMYCH kartach.
  // ---------------------------------------------------------------------
  // Realny stan pola "historia" per cud (z danych na dysku) — przekazywany do
  // przeglądarki, żeby asercja [4] porównywała się z FAKTYCZNYM stanem tego
  // konkretnego cudu, nie z zafiksowanym z góry "zawsze puste".
  const historiaExpectedById = {};
  for (const w of wondersRaw.cuda) {
    historiaExpectedById[w.id] = typeof w.historia === 'string' && w.historia.trim() !== '';
  }

  const allCards = await page.evaluate(({ ids, historiaExpectedById }) => {
    return ids.map((id) => {
      const data = window.__buildEntityCardData('wonder', id, {});
      if (!data) return { id, found: false };
      const card = window.__renderEntityCard(data);
      document.getElementById('root').appendChild(card);
      const rowTexts = Array.from(card.querySelectorAll('.entity-card-row,.entity-card-row-action,.entity-card-pill'))
        .map((r) => r.textContent.trim());
      const sectionCount = card.querySelectorAll('.entity-card-section').length;
      const result = {
        id,
        found: true,
        kind: data.kind,
        title: data.title,
        rowCount: rowTexts.length,
        sectionCount,
        uwagiRowExists: rowTexts.some((t) => t.startsWith('Uwagi')),
        historiaExists: card.querySelector('.entity-card-historia') !== null,
        historiaExpected: !!historiaExpectedById[id],
      };
      card.remove();
      return result;
    });
  }, { ids: activeWonderIds, historiaExpectedById });

  for (const r of allCards) {
    check(`[1] openEntityCard/buildEntityCardData('wonder','${r.id}') znajduje encję`, r.found, r);
    if (!r.found) continue;
    check(`[1] karta cudu '${r.id}': kind==='wonder'`, r.kind === 'wonder', r.kind);
    check(`[1] karta cudu '${r.id}': ma tytuł niepusty`, typeof r.title === 'string' && r.title.length > 0, r.title);
    check(`[1] karta cudu '${r.id}': ma >0 sekcji i >0 wierszy (nie jest pustką)`, r.sectionCount > 0 && r.rowCount > 0, r);
    check(`[3] karta cudu '${r.id}': wiersz "Uwagi" NIE ISTNIEJE`, r.uwagiRowExists === false, r);
    check(`[4] karta cudu '${r.id}': sekcja "Rys historyczny" zgodna z realnym stanem pola "historia" w danych (${r.historiaExpected ? 'wypełnione' : 'puste'})`,
      r.historiaExists === r.historiaExpected, r);
  }
  check('[1] dokładnie 19 cudów przetestowanych (pokrycie pełne, nie próbka)', allCards.length === 19, allCards.length);

  // ---------------------------------------------------------------------
  // [4] Scenariusz mutacyjny — wstrzyknięcie `historia` WYŁĄCZNIE w pamięci testu
  //     (surowy wiersz kopiowany + rozszerzony PRZED wywołaniem adaptera, adapter
  //     jest czystą funkcją `(row, ctx) => EntityCardData` — zero mutacji wonders.json).
  // ---------------------------------------------------------------------
  const mutation = await page.evaluate(() => {
    const fixtureText = 'To jest testowy rys historyczny cudu — WYŁĄCZNIE fixture testu, nie dane gry.';
    const realRow = window.__resolveWonderRow('piramidy');
    if (!realRow) return { realRowFound: false };
    // "Przed" NIE polega na realnym stanie pola "historia" w danych (może być już
    // wypełnione dla tego cudu po integracji treści) — jawnie czyścimy kopię, żeby
    // kontrast "puste -> niepuste" był kontrolowany przez test, nie przez dane.
    const clearedRow = { ...realRow, historia: '' };
    const mutatedRow = { ...realRow, historia: fixtureText };
    const dataBefore = window.__wonderAdapter(clearedRow, {});
    const dataAfter = window.__wonderAdapter(mutatedRow, {});
    const cardBefore = window.__renderEntityCard(dataBefore);
    const cardAfter = window.__renderEntityCard(dataAfter);
    document.getElementById('root').appendChild(cardBefore);
    document.getElementById('root').appendChild(cardAfter);
    const sepBefore = cardBefore.querySelector('.entity-card-historia');
    const sepAfter = cardAfter.querySelector('.entity-card-historia');
    const textAfterEl = cardAfter.querySelector('.entity-card-historia-text');
    const result = {
      realRowFound: true,
      beforeHasSection: sepBefore !== null,
      afterHasSection: sepAfter !== null,
      afterText: textAfterEl ? textAfterEl.textContent : null,
      afterItalic: textAfterEl ? getComputedStyle(textAfterEl).fontStyle === 'italic' : false,
      fixtureText,
    };
    cardBefore.remove();
    cardAfter.remove();
    return result;
  });
  check('[4] mutacja: wiersz "piramidy" znaleziony w registry', mutation.realRowFound, mutation);
  if (mutation.realRowFound) {
    check('[4] mutacja: PRZED wstrzyknięciem "historia" (pole jawnie wyczyszczone na kopii) — sekcja nieobecna (dowód, że mechanizm nie renderuje na pusto)',
      mutation.beforeHasSection === false, mutation);
    check('[4] mutacja: PO wstrzyknięciu "historia" (WYŁĄCZNIE w pamięci testu) — sekcja SIĘ POJAWIA',
      mutation.afterHasSection === true, mutation);
    check('[4] mutacja: tekst sekcji === dokładnie wstrzyknięty fixture (bez okrojenia)',
      mutation.afterText === mutation.fixtureText, mutation.afterText);
    check('[4] mutacja: tekst renderuje się kursywą (stylistycznie odróżniona od sekcji mechanicznych)',
      mutation.afterItalic, mutation);
  }

  // ---------------------------------------------------------------------
  // [2] buildModeHud.ts — realne Chromium, dwa OSOBNE kliknięcia myszy:
  //     ikonka info (niezależny listener, stopPropagation) vs reszta wiersza
  //     (onSelectWonder bez zmian). Wzorem call-site [1]
  //     `improvement-card-callsites-test.cjs` (elementFromPoint/realne kliki).
  // ---------------------------------------------------------------------
  await page.evaluate(() => { document.getElementById('root').innerHTML = ''; });
  await page.evaluate(() => {
    const selected = [];
    window.__wonderSelected = selected;
    const config = {
      listTypes: () => [],
      getActiveKey: () => null,
      onSelectType: () => {},
      onExit: () => {},
      isOpen: () => true,
      getPracaPool: () => Infinity,
      // Dwa cudy REALNE (`piramidy`/`wielka_stela`) — jeden odblokowany, jeden
      // "locked" (w budowie) — kryterium 2 wymaga sprawdzenia obu stanów.
      listWonders: () => [
        { id: 'piramidy', label: 'Piramidy', kosztPraca: 160, epokaWejscia: 1, dostep: 'E' },
        { id: 'wielka_stela', label: 'Wielka stela', kosztPraca: 220, epokaWejscia: 2, dostep: 'E', building: true, lockHint: 'Już w budowie na mapie' },
      ],
      onSelectWonder: (id) => { selected.push(id); },
      getActiveWonderId: () => null,
    };
    const hud = window.__createBuildModeHud(config);
    document.getElementById('root').appendChild(hud.el);
    window.__wonderHud = hud;
  });

  const rowGeom = await page.evaluate(() => {
    const item = document.querySelector('.civ-build-item.wonder[data-wonder-id="piramidy"]');
    const infoIc = item ? item.querySelector('.civ-build-info-ic') : null;
    if (!item || !infoIc) return null;
    const itemR = item.getBoundingClientRect();
    const icR = infoIc.getBoundingClientRect();
    return {
      // Punkt na wierszu, ale WYRAŹNIE poza prostokątem ikonki info (etykieta po lewej).
      rowOutsideIcon: { x: itemR.left + 8, y: itemR.top + itemR.height / 2 },
      infoIcon: { x: icR.left + icR.width / 2, y: icR.top + icR.height / 2 },
    };
  });
  check('[2] wiersz "piramidy" + ikonka info renderują się w DOM (buildModeHud)', !!rowGeom, rowGeom);

  if (rowGeom) {
    // --- Klik #1: ikonka info — MUSI otworzyć kartę, NIE MOŻE wywołać onSelectWonder. ---
    const hitInfo = await page.evaluate((p) => {
      const el = document.elementFromPoint(p.x, p.y);
      return el ? { tag: el.tagName, className: el.className } : null;
    }, rowGeom.infoIcon);
    check('[2] elementFromPoint na środku ikonki info trafia w SAMĄ IKONKĘ (.civ-build-info-ic), nie w tło wiersza',
      !!hitInfo && String(hitInfo.className).includes('civ-build-info-ic'), hitInfo);

    await page.mouse.click(rowGeom.infoIcon.x, rowGeom.infoIcon.y);
    const afterInfoClick = await page.evaluate(() => ({
      selected: window.__wonderSelected.slice(),
      openedCard: (() => {
        const c = document.querySelector('.entity-card-wonder[data-entity-id="piramidy"]');
        return c ? { id: c.getAttribute('data-entity-id'), kind: c.getAttribute('data-entity-kind') } : null;
      })(),
    }));
    check('[2] klik ikonki info NIE wywołuje onSelectWonder (stopPropagation, strefa niezależna)',
      afterInfoClick.selected.length === 0, afterInfoClick.selected);
    check('[2] klik ikonki info otwiera kartę encji wonder z data-entity-id="piramidy"',
      !!afterInfoClick.openedCard && afterInfoClick.openedCard.kind === 'wonder', afterInfoClick.openedCard);

    // Zamknij dialog (backdrop) przed kolejnym scenariuszem.
    await page.evaluate(() => {
      document.querySelectorAll('.entity-card-backdrop').forEach((b) => b.remove());
      window.__wonderSelected.length = 0;
    });

    // --- Klik #2: reszta wiersza (POZA ikonką) — MUSI wywołać onSelectWonder('piramidy'),
    //     NIE MOŻE otworzyć karty (zero regresu — dokładnie ten sam argument co dziś). ---
    const hitRow = await page.evaluate((p) => {
      const el = document.elementFromPoint(p.x, p.y);
      return el ? { tag: el.tagName, className: el.className } : null;
    }, rowGeom.rowOutsideIcon);
    check('[2] elementFromPoint poza ikonką trafia w wiersz (NIE w .civ-build-info-ic)',
      !!hitRow && !String(hitRow.className).includes('civ-build-info-ic'), hitRow);

    await page.mouse.click(rowGeom.rowOutsideIcon.x, rowGeom.rowOutsideIcon.y);
    const afterRowClick = await page.evaluate(() => ({
      selected: window.__wonderSelected.slice(),
      openedCard: document.querySelector('.entity-card-wonder[data-entity-id="piramidy"]') !== null,
    }));
    check('[2] klik reszty wiersza wywołuje onSelectWonder DOKŁADNIE raz z argumentem "piramidy" (zero regresu)',
      afterRowClick.selected.length === 1 && afterRowClick.selected[0] === 'piramidy', afterRowClick.selected);
    check('[2] klik reszty wiersza NIE otwiera karty encji',
      afterRowClick.openedCard === false, afterRowClick.openedCard);

    // --- Ikonka info działa TAKŻE na cudzie LOCKED ("wielka_stela", building:true) ---
    await page.evaluate(() => { window.__wonderSelected.length = 0; });
    const lockedGeom = await page.evaluate(() => {
      const item = document.querySelector('.civ-build-item.wonder.locked[data-wonder-id="wielka_stela"]');
      const infoIc = item ? item.querySelector('.civ-build-info-ic') : null;
      if (!item || !infoIc) return null;
      const r = infoIc.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    check('[2] wiersz LOCKED "wielka_stela" + ikonka info obecne w DOM', !!lockedGeom, lockedGeom);
    if (lockedGeom) {
      await page.mouse.click(lockedGeom.x, lockedGeom.y);
      const afterLockedClick = await page.evaluate(() => ({
        selected: window.__wonderSelected.slice(),
        openedCard: document.querySelector('.entity-card-wonder[data-entity-id="wielka_stela"]') !== null,
      }));
      check('[2] klik ikonki info na cudzie LOCKED NIE wywołuje onSelectWonder',
        afterLockedClick.selected.length === 0, afterLockedClick.selected);
      check('[2] klik ikonki info na cudzie LOCKED MIMO TO otwiera kartę encji (podgląd ≠ akcja budowy)',
        afterLockedClick.openedCard === true, afterLockedClick.openedCard);
    }
  }

  check('brak błędów konsoli/pageerror podczas całego scenariusza', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[entity-card-wonder-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
