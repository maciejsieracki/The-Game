'use strict';
/**
 * recruit-resource-strip-test.cjs — R-REKRUTACJA-PODGLAD-SUROWCOW-Q1 (Operator Sonnet 5,
 * 2026-09-01, worktree izolowany).
 *
 * DOWÓD W ŻYWEJ PRZEGLĄDARCE (Playwright/Chromium, realny DOM) że
 * `appendRecruitMilitaryResourceStrip` (src/ui/cityPanel.ts) renderuje DYNAMICZNIE zbiór
 * surowców faktycznie uczestniczących w koszcie/utrzymaniu WSZYSTKICH jednostek zwróconych
 * przez `purchasableUnits(...)` dla danego miasta/epoki — w KAŻDEJ z trzech epok — zamiast
 * poprzedniej zahardkodowanej listy Brąz(epoka2)/Żelazo(epoka3), która milcząco pomijała
 * epokę Kamień.
 *
 * METODA (wzorzec: tools/recruit-card-stock-chip-real-render-test.cjs — „real render"
 * przez esbuild + realny DOM w Chromium, bez bootstrapu całej gry): esbuild bunduje
 * PRAWDZIWE, NIEZMODYFIKOWANE `purchasableUnits` (game/production.ts) i PRAWDZIWĄ,
 * pod-testem `appendRecruitMilitaryResourceStrip` + `configureCityPanel` (ui/cityPanel.ts,
 * jedyny eksport dodany w tym temacie — sama funkcja, żeby dało się ją realnie wywołać z
 * testu; zero zmian w jej ciele poza eksportem). Jedyne stuby to zasoby graficzne SVG
 * (icons/brandAssets, icons/scienceOwlIcon — esbuild w Node nie ładuje `.svg?raw`; treść
 * SVG jest POZA zakresem tego tematu, sprawdza ją appendCityResourceStockStrip,
 * nietknięty). `data/units.json` wczytywany PRAWDZIWY, bez modyfikacji — 75 jednostek gry.
 * `configureCityPanel({ getEpoch, getCities })` wstrzykuje deterministyczny stan
 * miasta/epoki (ten sam zewnętrzny hak silnika co main.ts w realnej rozgrywce), po czym
 * test woła DOKŁADNIE tę samą sekwencję co `renderPurchasableUnits`: `purchasableUnits(...)`
 * -> `appendRecruitMilitaryResourceStrip(mount, city, data, units)` -> odczyt REALNEGO DOM.
 *
 * Trzy scenariusze (miasto z Koszarami wybudowanymi, magazyn państwa z zapasem wszystkich
 * surowców epoki, żeby żadna jednostka nie odpadła bramką DOSTEP-SUROWCE-Q1 z
 * `availableProduction` — CZYTANEJ, nie zmienianej):
 *   Kamień (epoch=1): oczekiwane Drewno (9/10 jednostek Kamienia; Zwiadowca bez kosztu) —
 *     DZIŚ (przed tą zmianą) pasek nie renderował SIĘ W OGÓLE.
 *   Brąz (epoch=2): oczekiwane Brąz ORAZ Drewno (Procarz i łucznicy kulturowi nadal
 *     kosztują Drewno w Brązie, patrz RECON w 00-dispatch.md) — DZIŚ tylko Brąz.
 *   Żelazo (epoch=3): oczekiwane Żelazo — zero regresu względem poprzedniego zachowania.
 * Kryterium 4 (wyłącznie surowce UŻYWANE) sprawdzone wprost: brak Gliny/Cegły/Kamienia w
 * żadnym z trzech pasków (żadna purchasable jednostka ich nie kosztuje).
 *
 * Bramka (z katalogu gra/): node tools/recruit-resource-strip-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[recruit-resource-strip-test] playwright missing');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'recruit-strip-brandAssets-stub.ts');
const OWL_STUB = path.resolve(__dirname, '.stubs', 'recruit-strip-scienceOwlIcon-stub.ts');
const LEADER_STUB = path.resolve(__dirname, '.stubs', 'recruit-strip-leaderPortraits-stub.ts');
const MUZYKA_STUB = path.resolve(__dirname, '.stubs', 'recruit-strip-muzyka-stub.ts');
const ENTRY = path.resolve(__dirname, '.recruit-strip-entry.ts');
const OUTFILE = path.resolve(__dirname, '.recruit-strip-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const stubPlugin = {
  name: 'recruit-strip-stubs',
  setup(build) {
    build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_STUB }));
    build.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
    build.onResolve({ filter: /(^|\/)leaderPortraits$/ }, () => ({ path: LEADER_STUB }));
    build.onResolve({ filter: /(^|\/)muzyka-antyczna$/ }, () => ({ path: MUZYKA_STUB }));
  },
};

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel, appendRecruitMilitaryResourceStrip } from '../src/ui/cityPanel';",
    "import { purchasableUnits } from '../src/game/production';",
    "(window).__api = { configureCityPanel, appendRecruitMilitaryResourceStrip, purchasableUnits };",
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' }, plugins: [stubPlugin], logLevel: 'silent',
  });

  const unitsJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
  const buildingsJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
  const techJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
  const allTechIds = (techJson.technologie || []).map(t => t.Technologia).filter(Boolean);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });

  await page.setContent('<div id="root" style="background:#1a1f2b;padding:16px;display:inline-block;"></div>');
  await page.addStyleTag({ content: 'body{background:#1a1f2b;} .civ-cs-mil-strip{display:flex;align-items:center;flex-wrap:wrap;} .civ-cs-res-chip{display:inline-flex;align-items:center;gap:4px;color:#e8d88a;font:14px sans-serif;background:#2a2f3b;border-radius:6px;padding:4px 8px;margin-right:6px;} .civ-cs-mil-era{color:#fff;font:14px sans-serif;margin-right:10px;} .civ-cs-res-chip-ic svg{width:20px;height:20px;display:block;background:#e8d88a44;border-radius:4px;}' });
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
  // --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalog roboczy unikalny per przebieg ---
  // Stala nazwa pliku/katalogu pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly
  // przebieg (takze z innego worktree): dwa biegi nadpisuja sobie ten sam artefakt, co
  // daje raz falszywy CZERWONY, raz falszywy ZIELONY. mkdtempSync rozlacza je z definicji.
  // Zrzuty ZOSTAJA na dysku — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6);
  // unikalnosc chroni je przed nadpisaniem przez rownolegly bieg. Katalog powstaje
  // LENIWIE: przy jawnym RECRUIT_STRIP_SHOT_DIR nie tworzymy pustego smiecia.
  const SHOT_DIR = process.env.RECRUIT_STRIP_SHOT_DIR
    || fs.mkdtempSync(path.join(require('os').tmpdir(), 'civ-recruit-resource-strip-shots-'));
  console.log('[zrzuty] katalog zrzutow tego przebiegu: ' + SHOT_DIR);

  // Odczyt REALNEGO DOM wyprodukowanego przez appendRecruitMilitaryResourceStrip —
  // dokładnie ten sam selektor co appendCityResourceStockStrip (panel budowy),
  // dowód spójności wizualnej (GOAL).
  const shot = async name => {
    try { await page.locator('#root').screenshot({ path: path.join(SHOT_DIR, name) }); }
    catch (e) { console.log('[shot] pominięty:', String(e).slice(0, 120)); }
  };

  const runEpoch = (epoch, stock) => page.evaluate(({ epoch, stock, unitsJson, buildingsJson, allTechIds }) => {
    const A = window.__api;
    const city = { id: 'c1', ownerId: 0, surowce: { ...stock } };
    A.configureCityPanel({
      getEpoch: () => epoch,
      getCities: () => [city],
    });
    const data = { units: unitsJson, buildings: buildingsJson, civs: [], tech: [] };
    const ctx = {
      epoch,
      builtBuildingIds: ['koszary'],
      empireResourceStock: { ...stock },
      cityHasCoastOrRiver: true,
    };
    const units = A.purchasableUnits(city, data, allTechIds, ctx);
    const root = document.getElementById('root');
    root.innerHTML = '';
    A.appendRecruitMilitaryResourceStrip(root, city, data, units);
    const strip = root.querySelector('.civ-cs-mil-strip');
    const chips = strip
      ? Array.from(strip.querySelectorAll('.civ-cs-res-chip')).map(c => ({
          title: c.getAttribute('title'),
          val: c.querySelector('b') ? c.querySelector('b').textContent : null,
        }))
      : [];
    return {
      unitCount: units.length,
      unitIds: units.map(u => u.id),
      stripPresent: !!strip,
      eraTag: strip ? (strip.querySelector('.civ-cs-mil-era')
        ? strip.querySelector('.civ-cs-mil-era').textContent : null) : null,
      chips,
      html: root.innerHTML.slice(0, 900),
    };
  }, { epoch, stock, unitsJson, buildingsJson, allTechIds });

  const hasRes = (chips, needle) => chips.some(c => (c.title || '').toLowerCase().includes(needle));

  // Zapas dużej ilości WSZYSTKICH surowców militarnych na wypadek gdyby jakaś jednostka
  // (poza wiodącym Drewnem/Brązem/Żelazem) też coś kosztowała — czysto liberalny magazyn,
  // sam skład paska i tak jest wyznaczany WYŁĄCZNIE przez purchasableUnits+unitStockCost/
  // unitResourceUpkeep (funkcje CZYTANE, nie modyfikowane w tym temacie).
  const abundantStock = { drewno: 999, kamien: 999, glina: 999, ruda: 999, braz: 999, zelazo: 999, kon: 999 };

  console.log('\n-- EPOKA KAMIEŃ (epoch=1) --');
  const kamien = await runEpoch(1, abundantStock);
  await shot('recruit-strip-epoka-kamien.png');
  console.log(JSON.stringify(kamien, null, 1));
  check('Kamień: co najmniej Wojownik/Oszczepnik purchasable (jednostki kosztujące Drewno obecne)',
    kamien.unitCount > 1, kamien.unitIds);
  check('KRYTERIUM 1: pasek OBECNY w epoce Kamień (przed zmianą: return null, nic)', kamien.stripPresent);
  check('KRYTERIUM 1: pasek epoki Kamień zawiera chip Drewna', hasRes(kamien.chips, 'drewno'));
  check('KRYTERIUM 4: pasek epoki Kamień NIE zawiera surowców nieużywanych (Glina/Cegła/Kamień)',
    !hasRes(kamien.chips, 'glina') && !hasRes(kamien.chips, 'cegł') && !hasRes(kamien.chips, 'kamie'),
    kamien.chips);
  check('KRYTERIUM 4: pasek epoki Kamień NIE zawiera Brązu/Żelaza (jeszcze nieużywane)',
    !hasRes(kamien.chips, 'braz') && !hasRes(kamien.chips, 'brąz') && !hasRes(kamien.chips, 'żelazo'),
    kamien.chips);
  check('eraTag pokazuje "Epoka Kamień"', /Kamień/.test(kamien.eraTag || ''), kamien.eraTag);

  console.log('\n-- EPOKA BRĄZ (epoch=2) --');
  const braz = await runEpoch(2, abundantStock);
  await shot('recruit-strip-epoka-braz.png');
  console.log(JSON.stringify(braz, null, 1));
  check('Brąz: Procarz (Drewno) jest wśród jednostek purchasable', braz.unitIds.includes('Procarz'), braz.unitIds);
  check('pasek obecny w epoce Brąz', braz.stripPresent);
  check('KRYTERIUM 3 (regres): pasek epoki Brąz zawiera chip Brązu', hasRes(braz.chips, 'braz') || hasRes(braz.chips, 'brąz'));
  check('KRYTERIUM 2: pasek epoki Brąz zawiera TAKŻE Drewno (Procarz i inni kosztujący Drewno)',
    hasRes(braz.chips, 'drewno'));
  check('eraTag pokazuje "Epoka Brąz"', /Brąz/.test(braz.eraTag || ''), braz.eraTag);

  console.log('\n-- EPOKA ŻELAZO (epoch=3) --');
  const zelazo = await runEpoch(3, abundantStock);
  await shot('recruit-strip-epoka-zelazo.png');
  console.log(JSON.stringify(zelazo, null, 1));
  check('Żelazo: co najmniej jedna jednostka purchasable', zelazo.unitCount > 0, zelazo.unitIds);
  check('pasek obecny w epoce Żelazo', zelazo.stripPresent);
  check('KRYTERIUM 3: pasek epoki Żelazo zawiera chip Żelaza (zero regresu)',
    hasRes(zelazo.chips, 'żelazo') || hasRes(zelazo.chips, 'zelazo'));
  check('eraTag pokazuje "Epoka Żelazo"', /Żelazo/.test(zelazo.eraTag || ''), zelazo.eraTag);

  console.log('\n-- KONTROLA: pusta pula -> tylko Zwiadowca purchasable -> pasek PUSTY (kein Zwiadowca-koszt) --');
  const pustaPula = await runEpoch(1, {});
  console.log(JSON.stringify(pustaPula, null, 1));
  check('Bez zapasu: purchasable WYŁĄCZNIE jednostki bez kosztu surowcowego (np. Zwiadowca)',
    pustaPula.unitIds.every(id => id === 'Zwiadowca'), pustaPula.unitIds);
  check('KRYTERIUM 4/5: pasek NIE renderuje się gdy żadna purchasable jednostka nie kosztuje surowca (zero fałszywych chipów)',
    !pustaPula.stripPresent, pustaPula);

  check('Zero błędów strony w Chromium (pageerror/console.error)', pageErrors.length === 0, pageErrors);

  await browser.close();
  console.log(`\nrecruit-resource-strip-test: ${pass} passed, ${fail} failed`);
  try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(OUTFILE); } catch (e) { /* ignore */ }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
