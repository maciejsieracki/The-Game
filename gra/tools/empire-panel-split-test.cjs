'use strict';
/**
 * empire-panel-split-test.cjs — R-PANEL-SPLIT
 *
 * Klik żetonu HUD (Skarbiec/Praca/Surowce/Nauka/…) otwiera panel imperium
 * z TYLKO odpowiadającym blokiem — nie całą przewijaną listą.
 *
 * Run from gra/: node tools/empire-panel-split-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[empire-panel-split-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.empire-panel-split-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.empire-panel-split-bundle.cjs');

const ENTRY_TS = `
import {
  empirePanelBlockForSection,
  empireSectionFromHudAct,
} from '../src/ui/empirePanelSectionMap';

export { empirePanelBlockForSection, empireSectionFromHudAct };
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

  const { empirePanelBlockForSection, empireSectionFromHudAct } = require(BUNDLE_FILE);

  console.log('empire-panel-split-test — R-PANEL-SPLIT');

  assert('null section → all (pełny panel)', empirePanelBlockForSection(null) === 'all');
  assert('ekonomia → ekonomia (nie all)', empirePanelBlockForSection('ekonomia') === 'ekonomia');
  assert('surowce → surowce', empirePanelBlockForSection('surowce') === 'surowce');
  // R-DESIGN-11-ZAKLADEK faza 2 (Maciej 2026-08-1x): Nauka dostała WŁASNY blok top-level
  // ('nauka'), tak jak Skarbiec w fazie 1 — zmiana zamierzona (patrz assercje niżej + Praca/
  // Religia). Dawne oczekiwanie „ekonomia + filtr wiersza" jest tym, co ta faza naprawia.
  assert('econ-nauka → nauka (R-DESIGN-11-ZAKLADEK faza 2, własny blok)', empirePanelBlockForSection('econ-nauka') === 'nauka');
  assert('econ-praca → praca (R-DESIGN-11-ZAKLADEK faza 2, własny blok)', empirePanelBlockForSection('econ-praca') === 'praca');
  assert('econ-religia → religia (R-DESIGN-11-ZAKLADEK faza 2, własny blok)', empirePanelBlockForSection('econ-religia') === 'religia');
  // R-DESIGN-11-ZAKLADEK faza 1 (Maciej 2026-08-13): Skarbiec dostał WŁASNY blok top-level
  // ('skarbiec'), analogicznie do spichlerz/armia/handel niżej — zmiana zamierzona.
  // EN: Treasury got its OWN top-level block ('skarbiec'), like spichlerz/armia/handel below —
  // intended change.
  assert('econ-skarbiec → skarbiec (R-DESIGN-11-ZAKLADEK faza 1)', empirePanelBlockForSection('econ-skarbiec') === 'skarbiec');
  // Miasta zostają na dawnym torze `ekonomia` — poza zakresem fazy 2.
  assert('econ-miasta → ekonomia + filtr wiersza (poza zakresem fazy 2)', empirePanelBlockForSection('econ-miasta') === 'ekonomia');
  // P-ZASOBY-IMPERIUM-REKRUCI-STARY-WIDOK (Maciej 2026-08-14): Rekruci NIE zostaje na torze
  // `ekonomia` jak Miasta wyżej — Armia ma już własny top-level blok (patrz empireDetailPanel.ts,
  // sekcja ARMIA), więc chip HUD „Rekruci" musi trafiać w blok Armii, nie w stary fallback
  // „ZASOBY IMPERIUM". Poprzednia asercja tu (`econ-rekruci → ekonomia`) testowała dokładnie ten
  // bug routingu — zaktualizowana zamiast pozostawiona, bo dosłownie asercjonowała naprawiany bug.
  // EN: Recruits does NOT stay on the `ekonomia` track like Cities above — Army already has its
  // own top-level block, so the HUD "Recruits" chip must land on the Army block, not the old
  // "EMPIRE RESOURCES" fallback. The previous assertion here tested exactly this routing bug —
  // updated rather than left in place, since it literally asserted the bug being fixed.
  assert('econ-rekruci → armia (P-ZASOBY-IMPERIUM-REKRUCI-STARY-WIDOK, Armia ma już własny blok)', empirePanelBlockForSection('econ-rekruci') === 'armia');
  assert('spichlerz → spichlerz', empirePanelBlockForSection('spichlerz') === 'spichlerz');
  assert('armia → armia', empirePanelBlockForSection('armia') === 'armia');
  assert('handel → handel', empirePanelBlockForSection('handel') === 'handel');
  assert('kultura → kultura', empirePanelBlockForSection('kultura') === 'kultura');
  assert('moc → moc', empirePanelBlockForSection('moc') === 'moc');

  assert('HUD surowce → section surowce', empireSectionFromHudAct('surowce') === 'surowce');
  assert('HUD nauka → econ-nauka', empireSectionFromHudAct('nauka') === 'econ-nauka');
  assert('HUD skarbiec → econ-skarbiec', empireSectionFromHudAct('skarbiec') === 'econ-skarbiec');
  assert('HUD spichlerz → spichlerz', empireSectionFromHudAct('spichlerz') === 'spichlerz');
  assert('HUD armia → armia', empireSectionFromHudAct('armia') === 'armia');
  assert('HUD rekruci → econ-rekruci', empireSectionFromHudAct('rekruci') === 'econ-rekruci');

  const surowceBlock = empirePanelBlockForSection(empireSectionFromHudAct('surowce'));
  const naukaBlock = empirePanelBlockForSection(empireSectionFromHudAct('nauka'));
  assert('chip Surowce ≠ blok Nauka', surowceBlock !== naukaBlock);
  assert('chip Surowce = surowce', surowceBlock === 'surowce');
  assert('chip Nauka = nauka (R-DESIGN-11-ZAKLADEK faza 2, własny blok)', naukaBlock === 'nauka');

  // P-ZASOBY-IMPERIUM-REKRUCI-STARY-WIDOK (Maciej 2026-08-14): chip HUD „Rekruci" musi trafiać w
  // TEN SAM blok co chip „Armia" (Rekruci to sekcja wewnątrz bloku Armii, nie osobny blok).
  // EN: HUD "Recruits" chip must land on the SAME block as the "Army" chip (Recruits is a section
  // inside the Army block, not its own block).
  const rekruciBlock = empirePanelBlockForSection(empireSectionFromHudAct('rekruci'));
  const armiaBlock = empirePanelBlockForSection(empireSectionFromHudAct('armia'));
  assert('chip Rekruci = blok Armii (routing fix)', rekruciBlock === 'armia');
  assert('chip Rekruci = chip Armia (ten sam top-level blok)', rekruciBlock === armiaBlock);

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
