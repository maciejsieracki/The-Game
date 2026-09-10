'use strict';
/**
 * improvement-card-uklad-sekcji-test.cjs
 *
 * TEMAT: P-KARTA-PRZEBUDOWA-UKLAD-TECH-ULEPSZENIE-Q1 (część „ulepszenie terenu" —
 * patrz `dyspozycje/autobot/runs/P-KARTA-PRZEBUDOWA-UKLAD-TECH-ULEPSZENIE-Q1/00-dispatch.md`).
 * NIE dotyka `technologyAdapter.ts` (osobny, równoległy Operator w innym worktree) — bramka
 * scoped WYŁĄCZNIE do `improvementAdapter.ts`, żeby zero nakładania się plików z tamtym tematem.
 *
 * Żywy render Chromium/Playwright (renderer.ts::renderEntityCard, nie sama tablica
 * `data.sections` w pamięci) dowodzi:
 *
 * [1] Karta ulepszenia terenu „Tartak" (realne dane `terrain-improvements.json`, pole
 *     `historia` JUŻ wypełnione w danych — użyte 1:1, zero fixture'u/mutacji) renderuje
 *     sekcje w DOM w kolejności: Wymagania → Charakterystyka (lub przemianowane Bonusy
 *     pełniące tę rolę) → Rys historyczny → Surowce i terytorium → Dodatkowe informacje.
 * [2] Ta sama encja z pola `historia` USUNIĘTEGO (kopia wiersza WYŁĄCZNIE w pamięci testu,
 *     zero mutacji `gra/data/**`) NIE renderuje sekcji `.entity-card-historia` (zero
 *     pustego/białego bloku) — kolejność pozostałych 4 sekcji bez zmian.
 * [3] Sekcja pełniąca rolę „Charakterystyki" (`sections[1]`) niesie realną treść (wiersz
 *     „Typ" i/lub bonusy pola) — dowód nietautologiczności (nie jest to pusta, pominięta
 *     sekcja przypadkiem lądująca na właściwym indeksie).
 *
 * Usage (z gra/): node tools/improvement-card-uklad-sekcji-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[improvement-card-uklad-sekcji-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, `.improvement-card-uklad-sekcji-entry-${process.pid}.ts`);
const OUTFILE = path.resolve(__dirname, `.improvement-card-uklad-sekcji-bundle-${process.pid}.cjs`);
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
    console.log('[improvement-card-uklad-sekcji-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { renderEntityCard } from '../src/ui/entityCards/renderer.ts';",
      "import { resolveImprovementRow } from '../src/ui/entityCards/registry.ts';",
      "import { improvementAdapter } from '../src/ui/entityCards/improvementAdapter.ts';",
      'window.__renderEntityCard = renderEntityCard;',
      'window.__resolveImprovementRow = resolveImprovementRow;',
      'window.__improvementAdapter = improvementAdapter;',
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
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundleJs });

  // ---------------------------------------------------------------------
  // Kontrola przytomności: „tartak" realnie ma niepuste `historia`, `typ`, `bonus`,
  // `odblokowuje`, `surowiecOdblokowany` w dzisiejszych danych — dowód nietautologiczności
  // wszystkich 5 asercji poniżej (inaczej test przechodziłby nawet gdyby coś się w ogóle
  // nie renderowało).
  // ---------------------------------------------------------------------
  const tartakRaw = JSON.parse(
    fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'),
  ).tartak;
  check('kontrola przytomności: "tartak" ma niepuste "historia"',
    typeof tartakRaw.historia === 'string' && tartakRaw.historia.trim().length > 0);
  check('kontrola przytomności: "tartak" ma niepuste "typ"',
    typeof tartakRaw.typ === 'string' && tartakRaw.typ.trim().length > 0);
  check('kontrola przytomności: "tartak" ma niepuste "bonus" (co najmniej jedno pole)',
    !!tartakRaw.bonus && Object.values(tartakRaw.bonus).some((v) => typeof v === 'number' && v !== 0));
  check('kontrola przytomności: "tartak" ma niepuste "odblokowuje"',
    typeof tartakRaw.odblokowuje === 'string' && tartakRaw.odblokowuje.trim().length > 0);
  check('kontrola przytomności: "tartak" ma niepuste "surowiecOdblokowany"',
    typeof tartakRaw.surowiecOdblokowany === 'string' && tartakRaw.surowiecOdblokowany.trim().length > 0);

  // ---------------------------------------------------------------------
  // [1] „Tartak" z wypełnioną historią (realne dane, zero mutacji) — kolejność DOM.
  // ---------------------------------------------------------------------
  const withHistoria = await page.evaluate(() => {
    const row = window.__resolveImprovementRow('tartak');
    const data = window.__improvementAdapter(row, {});
    const card = window.__renderEntityCard(data);
    document.getElementById('root').appendChild(card);
    const body = card.querySelector('.entity-card-body');
    const orderedKeys = Array.from(body.children).map((child) =>
      child.classList.contains('entity-card-historia') ? '__historia__' : child.getAttribute('data-section-key'));
    const charSection = card.querySelector('[data-section-key="characteristics"]');
    const charRowTexts = charSection
      ? Array.from(charSection.querySelectorAll('.entity-card-row')).map((r) => r.textContent.trim())
      : [];
    const historiaLabel = Array.from(card.querySelectorAll('.entity-card-historia *'))
      .some((n) => n.textContent.trim() === 'Rys historyczny');
    card.remove();
    return { orderedKeys, charRowTexts, historiaLabel, dataSectionsCount: data.sections.length };
  });
  {
    const keys = withHistoria.orderedKeys;
    const reqIdx = keys.indexOf('requirements');
    const charIdx = keys.indexOf('characteristics');
    const histIdx = keys.indexOf('__historia__');
    const resIdx = keys.indexOf('resources');
    const unlockIdx = keys.indexOf('unlocks');
    check('[1] "tartak": wszystkie 5 węzłów obecne w DOM (Wymagania, Charakterystyka, Rys historyczny, Surowce, Dodatkowe)',
      reqIdx !== -1 && charIdx !== -1 && histIdx !== -1 && resIdx !== -1 && unlockIdx !== -1, keys);
    check(`[1] "tartak": kolejność DOM Wymagania(${reqIdx})→Charakterystyka(${charIdx})→Rys historyczny(${histIdx})→Surowce i terytorium(${resIdx})→Dodatkowe informacje(${unlockIdx}) === ${JSON.stringify(keys)}`,
      reqIdx === 0 && charIdx === 1 && histIdx === 2 && resIdx === 3 && unlockIdx === 4, keys);
  }
  check('[1] "tartak": sekcja "Rys historyczny" niesie dosłowną etykietę w DOM',
    withHistoria.historiaLabel);
  check('[3] "tartak": sekcja "characteristics" (Charakterystyka/Bonusy) ma realną, niepustą treść (dowód nietautologiczności)',
    withHistoria.charRowTexts.length > 0, withHistoria.charRowTexts);

  // ---------------------------------------------------------------------
  // [2] „Tartak" BEZ historii (fixture WYŁĄCZNIE w pamięci testu — pole usunięte z kopii
  //     wiersza, zero mutacji gra/data/**) — zero pustej sekcji, reszta kolejności bez zmian.
  // ---------------------------------------------------------------------
  await page.evaluate(() => { document.getElementById('root').innerHTML = ''; });
  const withoutHistoria = await page.evaluate(() => {
    const row = window.__resolveImprovementRow('tartak');
    const { historia: _drop, ...rowNoHistoria } = row;
    const data = window.__improvementAdapter(rowNoHistoria, {});
    const card = window.__renderEntityCard(data);
    document.getElementById('root').appendChild(card);
    const body = card.querySelector('.entity-card-body');
    const orderedKeys = Array.from(body.children).map((child) =>
      child.classList.contains('entity-card-historia') ? '__historia__' : child.getAttribute('data-section-key'));
    const historiaExists = card.querySelector('.entity-card-historia') !== null;
    card.remove();
    return { orderedKeys, historiaExists };
  });
  check('[2] "tartak" bez "historia" (fixture w pamięci): sekcja ".entity-card-historia" NIEOBECNA',
    withoutHistoria.historiaExists === false, withoutHistoria);
  {
    const keys = withoutHistoria.orderedKeys;
    const reqIdx = keys.indexOf('requirements');
    const charIdx = keys.indexOf('characteristics');
    const resIdx = keys.indexOf('resources');
    const unlockIdx = keys.indexOf('unlocks');
    check(`[2] "tartak" bez historii: kolejność DOM Wymagania(${reqIdx})→Charakterystyka(${charIdx})→Surowce(${resIdx})→Dodatkowe(${unlockIdx}), zero regresji, === ${JSON.stringify(keys)}`,
      reqIdx === 0 && charIdx === 1 && resIdx === 2 && unlockIdx === 3, keys);
  }

  check('brak błędów konsoli/pageerror podczas całego scenariusza', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[improvement-card-uklad-sekcji-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
