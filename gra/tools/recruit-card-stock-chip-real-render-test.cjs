'use strict';
/**
 * recruit-card-stock-chip-real-render-test.cjs — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1 (2026-08-26)
 *
 * DOWÓD W ŻYWEJ PRZEGLĄDARCE (Playwright/Chromium) dla p.2 dispatchu: chip surowca i
 * komunikat odmowy na karcie rekrutacji pokazują WYŁĄCZNIE brak jednorazowego kosztu
 * zakupu. Scenariusz ze zrzutu właściciela: Wojownik (50 Drewna, utrzymanie 10 Drewna/t),
 * pula państwa 57 Drewna -> chip NIE czerwony, przycisk „Rekrutuj" aktywny, brak
 * komunikatu „Brakuje w magazynie". Kontrola odwrotna: pula 49 Drewna -> chip czerwony,
 * przycisk zablokowany, komunikat obecny.
 *
 * Mierzone jest REALNE `getComputedStyle().color` renderowanego chipa, nie obecność klasy
 * w markupie (jsdom nie liczy CSS). Komponent karty (`src/ui/unitRecruitCard.ts`), predykat
 * chipa (`isUnitRecruitStockChipMissing`), bramka (`canAffordUnitRecruitStock`) i reguły CSS
 * `.bld-infocard-chip{...}` / `.bld-infocard-chip.stock-missing{...}` są PRAWDZIWE —
 * te ostatnie czytane dosłownie z `src/ui/cityPanel.ts`.
 *
 * OGRANICZENIE (jawnie): `cityPanel.appendUnitRecruitCompactRow` nie jest eksportowane,
 * więc test odtwarza jego 4-liniowe okablowanie (klasa chipa, canPurchase, stockMissingLabel)
 * wołając te same prawdziwe funkcje. Nietautologiczność samego predykatu jest udowodniona
 * osobno mutacją M2 w raporcie 01-operator-2026-08-26.md.
 *
 * Usage (z gra/): node tools/recruit-card-stock-chip-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[recruit-card-stock-chip-real-render-test] playwright missing');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'recruit-card-stock-chip-brandAssets-stub.ts');
const ENTRY   = path.resolve(__dirname, '.recruit-card-stock-chip-entry.ts');
const OUTFILE = path.resolve(__dirname, '.recruit-card-stock-chip-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const WOJOWNIK = units.find(u => u && u.Jednostka === 'Wojownik');
if (!WOJOWNIK) { console.error('units.json: brak Wojownika'); process.exit(1); }

// Reguły CSS chipa czytane DOSŁOWNIE z prawdziwego źródła panelu miasta.
const cityPanelSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
const chipCssLines = cityPanelSrc.split('\n').filter(l => l.startsWith('.civ-cs .bld-infocard-chip'));
if (chipCssLines.length < 2) {
  console.error('[recruit-card-stock-chip-real-render-test] nie znaleziono reguł CSS chipa w cityPanel.ts');
  process.exit(1);
}

const stubPlugin = {
  name: 'stub-brand-assets',
  setup(build) { build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); },
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
    "import { buildUnitRecruitCard, UNIT_RECRUIT_CARD_CSS } from '../src/ui/unitRecruitCard.ts';",
    "import { unitStockCost, missingStockFor, ownerResourceStockAll } from '../src/game/building-stock-cost.ts';",
    "import { canAffordUnitRecruitStock, isUnitRecruitStockChipMissing, unitResourceUpkeep } from '../src/game/economy-upkeep.ts';",
    'window.__api = { buildUnitRecruitCard, UNIT_RECRUIT_CARD_CSS, unitStockCost, missingStockFor, ownerResourceStockAll, canAffordUnitRecruitStock, isUnitRecruitStockChipMissing, unitResourceUpkeep };',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' }, plugins: [stubPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });

  await page.setContent('<div class="civ-cs" id="root"></div>');
  await page.addStyleTag({ content: chipCssLines.join('\n') });
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

  const cardCss = await page.evaluate(() => window.__api.UNIT_RECRUIT_CARD_CSS);

  const run = drewno => page.evaluate(({ udef, drewno, css }) => {
    const A = window.__api;
    if (!document.getElementById('urc-css')) {
      const s = document.createElement('style'); s.id = 'urc-css'; s.textContent = css;
      document.head.appendChild(s);
    }
    const root = document.getElementById('root');
    root.innerHTML = '';
    // Pula PAŃSTWA ownera, liczona prawdziwą funkcją silnika.
    const cities = [{ id: 'm1', ownerId: 0, surowce: { drewno } }];
    const pool = A.ownerResourceStockAll(cities, 0);
    const cost = A.unitStockCost(udef);
    // Okablowanie 1:1 z cityPanel.appendUnitRecruitCompactRow / unitStockCostChipsHtml.
    const chipsHtml = Object.keys(cost).map(k => {
      const missing = A.isUnitRecruitStockChipMissing(pool, udef, k);
      const cls = missing ? 'bld-infocard-chip stock-missing' : 'bld-infocard-chip';
      return '<span class="' + cls + '" data-res="' + k + '">' + cost[k] + ' Drewno</span>';
    }).join('');
    const upkeep = A.unitResourceUpkeep(udef);
    const upkeepHtml = Object.keys(upkeep)
      .map(k => '<span class="bld-infocard-chip" data-upkeep="' + k + '">−' + upkeep[k] + ' Drewno/t</span>').join('');
    const stockMissing = A.missingStockFor(pool, cost);
    const recruitOk = Object.keys(stockMissing).length === 0;
    const card = A.buildUnitRecruitCard({
      udef,
      item: { id: udef.Jednostka, koszt: 10, typ: 'jednostka' },
      data: { units: [udef], buildings: [], civs: [], tech: [] },
      skarb: 100000,
      canPurchase: recruitOk,
      treasuryIconHtml: '',
      mpCost: 0,
      mpCostLabel: '0',
      stockChipsHtml: chipsHtml,
      resourceUpkeepChipsHtml: upkeepHtml,
      stockMissingLabel: !recruitOk
        ? 'Brakuje w magazynie: ' + Object.entries(stockMissing).map(([k, v]) => v + ' Drewno').join(', ')
        : undefined,
      onRecruit: () => {},
    });
    root.appendChild(card);
    const chip = root.querySelector('[data-res="drewno"]');
    const upkeepChip = root.querySelector('[data-upkeep="drewno"]');
    const btn = root.querySelector('button');
    const cs = getComputedStyle(chip);
    const rect = chip.getBoundingClientRect();
    return {
      gate: A.canAffordUnitRecruitStock(pool, udef),
      chipClass: chip.className,
      chipColor: cs.color,
      chipVisible: rect.width > 0 && rect.height > 0,
      upkeepChipColor: upkeepChip ? getComputedStyle(upkeepChip).color : null,
      upkeepChipText: upkeepChip ? upkeepChip.textContent : null,
      btnDisabled: btn ? !!btn.disabled : null,
      btnTitle: btn ? (btn.title || '') : null,
      text: root.textContent,
    };
  }, { udef: WOJOWNIK, drewno, css: cardCss });

  // Zrzut z ŻYWEGO Chromium (§9 pkt 6). Katalog: RECRUIT_CARD_SHOT_DIR albo os.tmpdir().
  // --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalog roboczy unikalny per przebieg ---
  // Stala nazwa pliku/katalogu pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly
  // przebieg (takze z innego worktree): dwa biegi nadpisuja sobie ten sam artefakt, co
  // daje raz falszywy CZERWONY, raz falszywy ZIELONY. mkdtempSync rozlacza je z definicji.
  const TMPDIR_RUN_DIR = fs.mkdtempSync(path.join(require('os').tmpdir(), 'civ-recruit-card-stock-chip-shots-'));
  // Zrzuty ZOSTAJA na dysku — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6);
  // unikalnosc chroni je przed nadpisaniem przez rownolegly bieg. Sciezke drukujemy.
  console.log('[zrzuty] katalog tego przebiegu: ' + TMPDIR_RUN_DIR);
  const SHOT_DIR = process.env.RECRUIT_CARD_SHOT_DIR || TMPDIR_RUN_DIR;
  const shot = async name => {
    try { await page.locator('#root').screenshot({ path: path.join(SHOT_DIR, name) }); }
    catch (e) { console.log('[shot] pominięty:', String(e).slice(0, 120)); }
  };

  const NORMAL_COLOR = 'rgb(200, 184, 152)'; // #c8b898 — .bld-infocard-chip
  const MISSING_COLOR = 'rgb(232, 138, 122)'; // #e88a7a — .stock-missing

  console.log('\n-- SCENARIUSZ WŁAŚCICIELA: pula 57 Drewna, Wojownik 50 + utrzymanie 10/t --');
  const r57 = await run(57);
  await shot('recruit-card-57-drewno-PRZECHODZI.png');
  check('B1: chip Drewna widoczny w prawdziwym renderze', r57.chipVisible, r57);
  check('B2: bramka rekrutacji przepuszcza przy 57 Drewna', r57.gate === true, r57.gate);
  check('B3: chip NIE ma klasy stock-missing', !/stock-missing/.test(r57.chipClass), r57.chipClass);
  check('B4: REALNY kolor chipa = normalny (nie czerwony)', r57.chipColor === NORMAL_COLOR, r57.chipColor);
  check('B5: przycisk „Rekrutuj" AKTYWNY', r57.btnDisabled === false, r57.btnDisabled);
  check('B6: brak komunikatu odmowy — tooltip to zwykłe „Rekrutuj za ...", nie „Brakuje w magazynie"',
    !/Brakuje w magazynie/.test(r57.text) && !/Brakuje w magazynie/.test(r57.btnTitle || ''),
    { text: r57.text, title: r57.btnTitle });
  check('B7: chip utrzymania nadal pokazany (informacyjnie, nie jako blokada)',
    /−10/.test(r57.upkeepChipText || ''), r57.upkeepChipText);
  check('B8: chip utrzymania NIE jest czerwony', r57.upkeepChipColor === NORMAL_COLOR, r57.upkeepChipColor);

  console.log('\n-- KONTROLA ODWROTNA: pula 49 Drewna, koszt 50 --');
  const r49 = await run(49);
  await shot('recruit-card-49-drewno-BLOKADA.png');
  check('B9: bramka rekrutacji BLOKUJE przy 49 Drewna', r49.gate === false, r49.gate);
  check('B10: chip ma klasę stock-missing', /stock-missing/.test(r49.chipClass), r49.chipClass);
  check('B11: REALNY kolor chipa = czerwony', r49.chipColor === MISSING_COLOR, r49.chipColor);
  check('B12: przycisk „Rekrutuj" ZABLOKOWANY', r49.btnDisabled === true, r49.btnDisabled);
  check('B13: komunikat odmowy (tooltip „Rekrutuj") = „Brakuje w magazynie: 1 Drewno"',
    /^Brakuje w magazynie: 1 Drewno$/.test(r49.btnTitle || ''), r49.btnTitle);
  check('B14: komunikat odmowy NIE wspomina utrzymania', !/utrzyman/i.test(r49.btnTitle || ''), r49.btnTitle);

  check('B15: brak błędów strony w Chromium', pageErrors.length === 0, pageErrors);

  await browser.close();
  console.log(`\nrecruit-card-stock-chip-real-render-test: ${pass} passed, ${fail} failed`);
  try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(OUTFILE); } catch (e) { /* ignore */ }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('[recruit-card-stock-chip-real-render-test] ERROR', e); process.exit(1); });
