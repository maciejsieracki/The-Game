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
    // R-DESIGN-11-ZAKLADEK faza 1+2 (Maciej 2026-08-13/1x): Skarbiec (faza 1) oraz Praca/Nauka/
    // Religia (faza 2) dostały WŁASNE bloki top-level (nie 'ekonomia') — zmiana zamierzona, patrz
    // empirePanelSectionMap.ts. Miasta/Ludność/pełny przegląd zostają na dawnym torze 'ekonomia'
    // do kolejnej fazy, więc oczekiwanie tu jest wciąż nienaruszone.
    // P-ZASOBY-IMPERIUM-REKRUCI-STARY-WIDOK (Maciej 2026-08-14, naprawione commitem f536b792):
    // Rekruci NIE zostaje na torze 'ekonomia' jak Miasta/Ludność — Armia ma już własny top-level
    // blok, więc chip HUD „Rekruci" trafia w blok Armii. Ten sam duplikat asercji już
    // zaktualizowano w empire-panel-split-test.cjs (commit f536b792); ta osobna asercja w tym
    // pliku przeoczono przy tamtej naprawie — poprawiona teraz na to samo, poprawne zachowanie.
    // EN: Treasury (phase 1) and Labor/Science/Religion (phase 2) got their OWN top-level blocks
    // (not 'ekonomia') — intended change, see empirePanelSectionMap.ts. Cities/Population/
    // full overview stay on the old 'ekonomia' track for the next phase, so the expectation there
    // is still intact. Recruits does NOT stay on that track — Army already has its own top-level
    // block, so the HUD "Recruits" chip lands on the Army block (fixed in f536b792; this was a
    // duplicate assertion in a separate test file that got missed by that fix, now corrected).
    // R-DESIGN-11-ZAKLADEK faza 3 (§3 pkt 2 handoffu designera): wspólna zakładka `econ-miasta`
    // rozeszła się na DWA własne bloki top-level — chip „miasta" -> blok `miasto` (kąt
    // produkcyjny), chip „ludnosc" -> blok `obywatele` (kąt społeczny). Oczekiwania suwaków dla
    // obu POZOSTAJĄ `false/false` i nie były ruszane: nowe id sekcji zachowują przedrostek
    // `econ-` (`econ-miasto`/`econ-obywatele`), więc `onlyEconIdFromAct` nadal zwraca string, a
    // `econSliderVisibilityForOnlyEconId` nadal odpowiada „żaden suwak" — zmienia się wyłącznie
    // docelowy BLOK, nie widoczność suwaków.
    // EN: the shared `econ-miasta` tab split into two own top-level blocks. Slider expectations
    // for both stay false/false untouched — the new section ids keep the `econ-` prefix, so the
    // slider rule still answers "neither"; only the target BLOCK changes.
    const OWN_BLOCK_BY_ACT = {
      skarbiec: 'skarbiec', praca: 'praca', nauka: 'nauka', religia: 'religia', rekruci: 'armia',
      miasta: 'miasto', ludnosc: 'obywatele',
    };
    const expectedBlock = OWN_BLOCK_BY_ACT[c.act] ?? 'ekonomia';
    assert(`chip "${c.act}" -> blok ${expectedBlock} (R-PANEL-SPLIT nienaruszone / R-DESIGN-11-ZAKLADEK faza 1)`,
      empirePanelBlockForSection(section) === expectedBlock);
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

  // ---------------------------------------------------------------------------
  // Wymóg 4 (Evaluator FAIL 469f3152, szczelina 5): dotąd test badał WYŁĄCZNIE czystą funkcję
  // econSliderVisibilityForOnlyEconId w izolacji — nic nie wymuszało, żeby empireDetailPanel.ts
  // w ogóle konsumował jej werdykt. Mutacja usuwająca oba `if` w empireDetailPanel.ts (dosłowne
  // przywrócenie zgłoszonego błędu) przechodziła WSZYSTKIE bramki zielono. Ten blok czyta
  // źródło empireDetailPanel.ts wprost i dowodzi wykonaniem (mutacja + subprocess), że regres
  // jest łapany czerwono.
  //
  // EN: until now this test only exercised the pure decision function in isolation — nothing
  // forced empireDetailPanel.ts to actually consume its verdict. A mutation removing both `if`
  // guards (the literal originally-reported bug) passed every gate green. This block reads
  // empireDetailPanel.ts source directly and proves via mutation+subprocess execution that the
  // regression is caught red.
  // ---------------------------------------------------------------------------
  console.log('\n-- Wymóg 4: empireDetailPanel.ts faktycznie konsumuje econSliderVisibilityForOnlyEconId --');
  const PANEL_TS = path.join(__dirname, '..', 'src', 'ui', 'empireDetailPanel.ts');
  const panelSrc = fs.readFileSync(PANEL_TS, 'utf8');

  const sectionMarker = 'ZASOBY IMPERIUM (STAN + PRZYROST)';
  const markerIdx = panelSrc.indexOf(sectionMarker);
  assert('znaleziono nagłówek sekcji "ZASOBY IMPERIUM" w empireDetailPanel.ts', markerIdx >= 0);
  const footMarker = 'Duża liczba = stan · zielone = netto.';
  const footIdx = markerIdx >= 0 ? panelSrc.indexOf(footMarker, markerIdx) : -1;
  assert('znaleziono stopkę sekcji ZASOBY IMPERIUM (civ-emp-foot)', footIdx > markerIdx);
  const sectionBody = markerIdx >= 0 && footIdx > markerIdx ? panelSrc.slice(markerIdx, footIdx) : '';

  assert('econSliderVisibilityForOnlyEconId(onlyEconId) jest faktycznie wywołane w sekcji ZASOBY IMPERIUM',
    /const sliderVis = econSliderVisibilityForOnlyEconId\(onlyEconId\);/.test(sectionBody));

  const taxCallCount = (sectionBody.match(/renderDefaultHandelSplitSection\(\);/g) || []).length;
  const taxGuardedCount = (sectionBody.match(/if\s*\(sliderVis\.showTaxSplit\)\s*zasoby \+= renderDefaultHandelSplitSection\(\);/g) || []).length;
  assert('renderDefaultHandelSplitSection() występuje w sekcji dokładnie raz', taxCallCount === 1);
  assert('...i WYŁĄCZNIE pod warunkiem if(sliderVis.showTaxSplit) (nie bezwarunkowo)', taxGuardedCount === 1 && taxCallCount === taxGuardedCount);

  const laborCallCount = (sectionBody.match(/renderDefaultPodzialPracySection\(\);/g) || []).length;
  const laborGuardedCount = (sectionBody.match(/if\s*\(sliderVis\.showLaborSplit\)\s*zasoby \+= renderDefaultPodzialPracySection\(\);/g) || []).length;
  assert('renderDefaultPodzialPracySection() występuje w sekcji dokładnie raz', laborCallCount === 1);
  assert('...i WYŁĄCZNIE pod warunkiem if(sliderVis.showLaborSplit) (nie bezwarunkowo)', laborGuardedCount === 1 && laborCallCount === laborGuardedCount);

  // Mutacja: przywrócenie dosłownego zgłoszonego błędu (MUT3 z raportu Evaluatora) — oba wywołania
  // bez guardu. Test MUSI złapać to czerwono. Pomijana w trybie --self-check-skip-mutation, żeby
  // uniknąć nieskończonej rekurencji (ten tryb uruchamia TEN SAM plik na zmutowanym źródle i
  // oczekuje, że powyższe asercje złapią to czerwono).
  if (!process.argv.includes('--self-check-skip-mutation')) {
    console.log('\n-- Wymóg 4 / mutacja MUT3: przywrócenie bezwarunkowych wywołań suwaków --');
    const backup = panelSrc;
    const mutated = panelSrc.replace(
      'if (sliderVis.showTaxSplit) zasoby += renderDefaultHandelSplitSection();\n  if (sliderVis.showLaborSplit) zasoby += renderDefaultPodzialPracySection();',
      'zasoby += renderDefaultHandelSplitSection();\n  zasoby += renderDefaultPodzialPracySection();',
    );
    assert('mutacja MUT3 faktycznie zmieniła źródło (kotwica zamiany istnieje)', mutated !== backup);

    fs.writeFileSync(PANEL_TS, mutated, 'utf8');
    const { execSync } = require('child_process');
    let mutantFailed = false;
    try {
      execSync(`node ${__filename} --self-check-skip-mutation`, { cwd: __dirname, stdio: 'pipe' });
    } catch (e) {
      mutantFailed = true;
    } finally {
      fs.writeFileSync(PANEL_TS, backup, 'utf8');
    }
    assert('mutacja MUT3 (bezwarunkowe wywołania, dosłowny zgłoszony błąd) łapana czerwono przez Wymóg 4', mutantFailed);
    assert('empireDetailPanel.ts przywrócony do stanu oryginalnego po mutacji', fs.readFileSync(PANEL_TS, 'utf8') === backup);
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
