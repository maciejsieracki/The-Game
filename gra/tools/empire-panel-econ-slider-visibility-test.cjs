'use strict';
/**
 * empire-panel-econ-slider-visibility-test.cjs — P-EMPIRE-PANEL-SUWAKI-DUPLIKOWANE-NA-WSZYSTKICH-ZAKLADKACH
 *
 * Chroni `econSliderVisibilityForOnlyEconId` (gra/src/ui/empirePanelSectionMap.ts): w panelu
 * imperium (empireDetailPanel.ts, sekcja „ZASOBY IMPERIUM") suwaki globalne „Domyślny podział
 * podatek" (renderDefaultHandelSplitSection) i „Domyślny podział pracy"
 * (renderDefaultPodzialPracySection) muszą pokazywać się WYŁĄCZNIE na tematycznie powiązanej
 * zakładce, nigdy oba naraz na filtrowanej zakładce (Maciej, 3 zrzuty ekranu, 2026-08-12):
 *   - Skarbiec  (onlyEconId='skarbiec') -> TYLKO podatek
 *   - Praca     (onlyEconId='praca')    -> TYLKO podział pracy
 *   - Nauka     (onlyEconId='nauka')    -> TYLKO podatek (nauka finansowana % podatku "Nauka"
 *                                          z TEGO SAMEGO suwaka co Skarb/Zamożność, NIE przez
 *                                          podział Pracy)
 *   - Miasta/Rekruci/Religia (filtrowane, tematycznie niepowiązane) -> ŻADEN
 *   - Pełny przegląd / brak filtra (onlyEconId=null) -> OBA (jedyne miejsce gdzie to ma sens)
 *
 * Testuje też, przez pełny łańcuch `empireSectionFromHudAct` -> `slice(5)` (dokładnie tak jak
 * liczy `onlyEconId` w empireDetailPanel.ts), że KAŻDY chip HUD prowadzący do bloku "ekonomia"
 * (R-PANEL-SPLIT, empire-panel-split-test.cjs) dostaje właściwy zestaw suwaków — nie tylko 3
 * zgłoszone przez właściciela, ale systematycznie wszystkie (Skarbiec, Praca, Nauka, Miasta,
 * Rekruci, Religia).
 *
 * Wzorzec testu: esbuild-bundle realnego źródła (empirePanelSectionMap.ts — plik bez importów
 * UI/DOM, patrz jego nagłówek), analogicznie do empire-panel-split-test.cjs.
 *
 * EN: Guards `econSliderVisibilityForOnlyEconId` — each resource tab must show ONLY its
 * thematically-linked slider, never both on a filtered tab; the full/no-filter overview still
 * shows both (the only place that makes thematic sense). Also walks every HUD chip act through
 * the real `empireSectionFromHudAct` mapping to confirm systematic coverage, not just the 3
 * tabs the owner explicitly reported.
 *
 * Run from gra/: node tools/empire-panel-econ-slider-visibility-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[empire-panel-econ-slider-visibility-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.empire-panel-econ-slider-visibility-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.empire-panel-econ-slider-visibility-bundle.cjs');

const ENTRY_TS = `
import {
  econSliderVisibilityForOnlyEconId,
  empirePanelBlockForSection,
  empireSectionFromHudAct,
} from '../src/ui/empirePanelSectionMap';

export { econSliderVisibilityForOnlyEconId, empirePanelBlockForSection, empireSectionFromHudAct };
`;

let pass = 0;
let fail = 0;

function assert(label, cond) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}`);
  }
}

function main() {
  fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });

  const {
    econSliderVisibilityForOnlyEconId,
    empirePanelBlockForSection,
    empireSectionFromHudAct,
  } = require(BUNDLE_FILE);

  console.log('empire-panel-econ-slider-visibility-test — P-EMPIRE-PANEL-SUWAKI-DUPLIKOWANE-NA-WSZYSTKICH-ZAKLADKACH');

  // ---------------------------------------------------------------------------
  // Wymóg 1: bezpośrednie wywołania funkcji dla każdego onlyEconId, dokładnie reguła z ABC.
  // ---------------------------------------------------------------------------
  const cases = [
    { onlyEconId: null, label: 'pełny przegląd (brak filtra)', wantTax: true, wantLabor: true },
    { onlyEconId: 'skarbiec', label: 'Skarbiec', wantTax: true, wantLabor: false },
    { onlyEconId: 'praca', label: 'Praca', wantTax: false, wantLabor: true },
    { onlyEconId: 'nauka', label: 'Nauka', wantTax: true, wantLabor: false },
    { onlyEconId: 'miasta', label: 'Miasta', wantTax: false, wantLabor: false },
    { onlyEconId: 'rekruci', label: 'Rekruci', wantTax: false, wantLabor: false },
    { onlyEconId: 'religia', label: 'Religia', wantTax: false, wantLabor: false },
    { onlyEconId: 'kultura', label: 'Kultura (id wiersza, nie chip)', wantTax: false, wantLabor: false },
  ];

  for (const c of cases) {
    const vis = econSliderVisibilityForOnlyEconId(c.onlyEconId);
    assert(`${c.label}: podatek ${c.wantTax ? 'WIDOCZNY' : 'UKRYTY'}`, vis.showTaxSplit === c.wantTax);
    assert(`${c.label}: praca ${c.wantLabor ? 'WIDOCZNA' : 'UKRYTA'}`, vis.showLaborSplit === c.wantLabor);
    if (c.onlyEconId !== null) {
      assert(`${c.label}: NIGDY oba naraz na filtrowanej zakładce`, !(vis.showTaxSplit && vis.showLaborSplit));
    }
  }

  // ---------------------------------------------------------------------------
  // Wymóg 2: pełny łańcuch od chipu HUD (data-act) do widoczności suwaka — dokładnie tak jak
  // liczy to empireDetailPanel.ts (`onlyEconId = activeSection.startsWith('econ-') ?
  // activeSection.slice(5) : null`). Sprawdza SYSTEMATYCZNIE każdy chip prowadzący do bloku
  // "ekonomia", nie tylko 3 zgłoszone (Skarbiec/Praca/Nauka) — też Miasta/Ludność/Rekruci/Religia.
  // ---------------------------------------------------------------------------
  function onlyEconIdFromAct(act) {
    const section = empireSectionFromHudAct(act);
    if (!section) return undefined;
    return section.startsWith('econ-') ? section.slice(5) : null;
  }

  const hudCases = [
    { act: 'skarbiec', wantTax: true, wantLabor: false },
    { act: 'praca', wantTax: false, wantLabor: true },
    { act: 'nauka', wantTax: true, wantLabor: false },
    { act: 'miasta', wantTax: false, wantLabor: false },
    { act: 'ludnosc', wantTax: false, wantLabor: false },
    { act: 'rekruci', wantTax: false, wantLabor: false },
    { act: 'religia', wantTax: false, wantLabor: false },
    { act: 'empire', wantTax: true, wantLabor: true }, // sekcja 'ekonomia' wprost -> pełny przegląd
  ];

  for (const c of hudCases) {
    const section = empireSectionFromHudAct(c.act);
    assert(`chip "${c.act}" -> blok ekonomia (R-PANEL-SPLIT nienaruszone)`,
      empirePanelBlockForSection(section) === 'ekonomia');
    const onlyEconId = onlyEconIdFromAct(c.act);
    const vis = econSliderVisibilityForOnlyEconId(onlyEconId);
    assert(`chip "${c.act}" (onlyEconId=${JSON.stringify(onlyEconId)}): podatek ${c.wantTax ? 'WIDOCZNY' : 'UKRYTY'}`,
      vis.showTaxSplit === c.wantTax);
    assert(`chip "${c.act}" (onlyEconId=${JSON.stringify(onlyEconId)}): praca ${c.wantLabor ? 'WIDOCZNA' : 'UKRYTA'}`,
      vis.showLaborSplit === c.wantLabor);
  }

  // ---------------------------------------------------------------------------
  // Wymóg 3 (regres z 3 zrzutów ekranu Macieja): Skarbiec/Praca/Nauka NIE renderują tego
  // samego zestawu — każdy dostaje inny suwak (albo brak), nie identyczną parę.
  // ---------------------------------------------------------------------------
  const skarbiecVis = econSliderVisibilityForOnlyEconId('skarbiec');
  const pracaVis = econSliderVisibilityForOnlyEconId('praca');
  const naukaVis = econSliderVisibilityForOnlyEconId('nauka');
  assert('Skarbiec i Praca NIE pokazują identycznego zestawu (regres zgłoszenia)',
    JSON.stringify(skarbiecVis) !== JSON.stringify(pracaVis));
  assert('Nauka pokazuje ten sam zestaw co Skarbiec (oba -> podatek, wspólny suwak)',
    JSON.stringify(skarbiecVis) === JSON.stringify(naukaVis));
  assert('Nauka NIE pokazuje zestawu Pracy (nauka nie jest finansowana przez podział Pracy)',
    JSON.stringify(naukaVis) !== JSON.stringify(pracaVis));

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
