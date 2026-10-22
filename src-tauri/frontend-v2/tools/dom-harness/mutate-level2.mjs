#!/usr/bin/env node
/**
 * mutate-level2.mjs — kontrola czułości harnessu P5.5 (`run-level2.mjs`): wstrzykuje po jednej mutacji do modułu
 * v2, uruchamia harness dla tego modułu (`--only`) i oczekuje EXIT=1; przywraca plik bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate-level2.mjs --pin-dir <PIN_DIR>   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const pinDir = args[args.indexOf('--pin-dir') + 1];
if (!pinDir || args.indexOf('--pin-dir') < 0) {
  console.error('Użycie: node tools/dom-harness/mutate-level2.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

/** [nazwa, plik, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  // Zmiany P5.5 (każdy odczyt nowego pola DTO / katalogu).
  ['L1 diplomacyPanel: placeholder miasta-państwa bez dopisku', 'src/ui/diplomacyPanel.ts',
    `{ civ: 'Sparta · miasto-państwo', isCityState: true,`, `{ civ: 'Sparta', isCityState: true,`],
  ['L2 diploListHud: linie karty z DTO bez perspektywy', 'src/ui/diploListHud.ts',
    `const lines = rel.lines;`, `const lines = { ...rel.lines, perspectiveLine: '' };`],
  ['L3 unitPanelHud: odznaki z DTO ignorowane (ścieżka B)', 'src/ui/unitPanelHud.ts',
    `badges: u.badges,`, `badges: { ...u.badges, softPath: 0 },`],
  ['L4 armyStackHud: odznaki z DTO ignorowane (pancerz)', 'src/ui/armyStackHud.ts',
    `badges: st.badges,`, `badges: { ...st.badges, armorPath: 0 },`],
  ['L5 buildModeHud: „stać na ulepszenie” z DTO ignorowane', 'src/ui/buildModeHud.ts',
    `const insufficientPraca = !techLocked && !t.affordable;`, `const insufficientPraca = false;`],
  ['L6 buildModeHud: zakres automatu ulepszeń z katalogu −1', 'src/ui/buildModeHud.ts',
    `staticCatalog().constants.maxUlepszeniaPracaAutoPercent;`, `staticCatalog().constants.maxUlepszeniaPracaAutoPercent - 1;`],
  ['L7 buildModeHud: cap puli imperium z katalogu +1', 'src/ui/buildModeHud.ts',
    `staticCatalog().constants.maxProcentPuliImperium;`, `staticCatalog().constants.maxProcentPuliImperium + 1;`],
  ['L8 techTreeView: lista technologii z katalogu bez pierwszej', 'src/ui/techTreeView.ts',
    `const rawList = (staticCatalog().tech as unknown as { technologie: RawTech[] }).technologie;`,
    `const rawList = (staticCatalog().tech as unknown as { technologie: RawTech[] }).technologie.slice(1);`],
  ['L9 techTreeView: etykiety ulepszeń z katalogu ignorowane', 'src/ui/techTreeView.ts',
    `const terenFromCode = [...(staticCatalog().techTerrainUnlockLabels[r['Technologia']] ?? [])];`, `const terenFromCode: string[] = [];`],
  ['L10 techTreeView: mnożnik tempa z katalogu ignorowany', 'src/ui/techTreeView.ts',
    `const TEMPO_GRY: Readonly<Record<string, number>> = staticCatalog().constants.tempoGry;`, `const TEMPO_GRY: Readonly<Record<string, number>> = {};`],
  ['L11 techTreeView: koszt efektywny z DTO ignorowany', 'src/ui/techTreeView.ts',
    `return row !== undefined ? row.effectiveCost : node.koszt;`, `return node.koszt;`],
  ['L12 techTreeView: tempo gry z DTO ignorowane', 'src/ui/techTreeView.ts',
    `tempo: view?.tempo ?? 'standardowa',`, `tempo: 'standardowa',`],
  ['L13 unitInfoCard: kategoria „tylko nazwa” zamiast wiersza (ścieżka zapasowa)', 'src/ui/unitInfoCard.ts',
    `const category = unitCategoryFromCatalog(unit.Jednostka, true);`, `const category = unitCategoryFromCatalog(unit.Jednostka, false);`],
  ['L14 wikiHubHud: encyklopedia z katalogu bez pierwszego hasła', 'src/ui/wikiHubHud.ts',
    `const ENCY = wikiBundle.encyklopedia as EncyEntry[];`, `const ENCY = (wikiBundle.encyklopedia as EncyEntry[]).slice(1);`],
  ['L15 wikiHubHud: poradnik z katalogu bez pierwszego rozdziału', 'src/ui/wikiHubHud.ts',
    `const PORADNIK = wikiBundle.poradnik as PoradnikChapter[];`, `const PORADNIK = (wikiBundle.poradnik as PoradnikChapter[]).slice(1);`],
  ['L16 unitReplacePicker: „stać na dopłatę” z DTO ignorowane', 'src/ui/unitReplacePicker.ts',
    `const affordable = o.affordable;`, `const affordable = true;`],
  // Reguły GRANICZNE pozostawione w UI (czy harness je mierzy).
  ['L17 diplomacyPanel: suma relacji — inny cap', 'src/ui/diplomacyPanel.ts', `Math.min(200, zaufanie + respekt)`, `Math.min(199, zaufanie + respekt)`],
  ['L18 armySplitPanel: „co najmniej jedna zostaje” wyłączone', 'src/ui/armySplitPanel.ts', `if (ids.length === 0 || stay < 1) return;`, `if (ids.length === 0) return;`],
  ['L19 interHumanDiplomacyHud: domyślna liczba tur paktu', 'src/ui/interHumanDiplomacyHud.ts', `const turns = fields.turns ?? 15;`, `const turns = fields.turns ?? 14;`],
  // Kopie bajtowe (tekst / markup / kolejność).
  ['L20 kopia: leaderBannersHud — klasa banera', 'src/ui/leaderBannersHud.ts', '`<div class="civ-leader-banner ${cls}">', '`<div class="civ-leader-banner x-${cls}">'],
  ['L21 kopia: cityCaptureNotice — nagłówek bilansu', 'src/ui/cityCaptureNotice.ts', `esc(title ?? 'Bilans zdobycia')`, `esc(title ?? 'Bilans')`],
  ['L22 kopia: cityForeignPick — etykieta akcji', 'src/ui/cityForeignPick.ts', `<span class="civ-cfp-act-lbl">Informacja</span>`, `<span class="civ-cfp-act-lbl">Info</span>`],
  ['L23 kopia: cityUnitPick — warunek stosu', 'src/ui/cityUnitPick.ts', `opts.stackCount && opts.stackCount > 1`, `opts.stackCount && opts.stackCount > 2`],
  ['L24 kopia: gamePauseMenu — przycisk powrotu', 'src/ui/gamePauseMenu.ts', `</span> Wróć do gry</button>`, `</span> Wróć</button>`],
  ['L25 kopia: hotSeatHandoff — przycisk', 'src/ui/hotSeatHandoff.ts', `<button type="button" class="hsh-btn">Kliknij aby kontynuować</button>`, `<button type="button" class="hsh-btn">Kontynuuj</button>`],
  ['L26 kopia: mainMenu — ekran pożegnalny', 'src/ui/mainMenu.ts', `'Dziękujemy za grę. Postęp jest zapisany.</div>'`, `'Dziękujemy za grę.</div>'`],
  ['L27 kopia: unitForeignPick — etykieta akcji', 'src/ui/unitForeignPick.ts', `<span class="civ-ufp-act-lbl">Informacja</span>`, `<span class="civ-ufp-act-lbl">Info</span>`],
  ['L28 kopia: contextPanelHud — kontener komunikatu', 'src/ui/contextPanelHud.ts', 'el.innerHTML = `<div class="cp-msg">${raw}</div>`;', 'el.innerHTML = `<div class="cp-msg x">${raw}</div>`;'],
  ['L29 kopia: diplomacyProposalBanner — nagłówek', 'src/ui/diplomacyProposalBanner.ts', `const head = accepted ? 'Przyjęto' : 'Odrzucono';`, `const head = accepted ? 'Przyjęte' : 'Odrzucono';`],
  ['L30 kopia: hudChip6c — separator', 'src/ui/hudChip6c.ts', `'<span class="civ-hud-chip-sep" aria-hidden="true"></span>'`, `'<span class="civ-hud-chip-sep"></span>'`],
  ['L31 kopia: mapToolbarHud — tytuł przycisku miast', 'src/ui/mapToolbarHud.ts', `title="Miasto — lista i produkcja"`, `title="Miasta"`],
  ['L32 kopia: armyMergePickPanel — przycisk', 'src/ui/armyMergePickPanel.ts', `data-go>Po\\u0142\\u0105cz</button>'`, `data-go>Scal</button>'`],
  ['L33 kopia: diplomacyPendingHud — przycisk', 'src/ui/diplomacyPendingHud.ts', `civ-dip-acc">Akceptuj</button>'`, `civ-dip-acc">Przyjmij</button>'`],
  ['L34 kopia: unitActionBarHtml — kolejność akcji', 'src/ui/unitActionBarHtml.ts', `['fortify', 'unfortify-all', 'sentry',`, `['unfortify-all', 'fortify', 'sentry',`],
];

let missed = 0;
for (const [name, rel, a, b] of MUTS) {
  const p = resolve(ROOT, rel);
  const orig = readFileSync(p, 'utf8');
  const count = orig.split(a).length - 1;
  if (count !== 1) {
    console.log(`${name}: BŁĄD wzorzec występuje ${count}×`);
    missed++;
    continue;
  }
  try {
    writeFileSync(p, orig.replace(a, b));
    const r = spawnSync('node', ['tools/dom-harness/run-level2.mjs', '--pin-dir', pinDir, '--only', basename(rel)], { cwd: ROOT, encoding: 'utf8' });
    const summary = r.stdout.split('\n').find((l) => l.startsWith('dom-harness-level2:')) ?? r.stderr.slice(-300);
    const mods = r.stdout.split('\n').filter((l) => /różnice=[1-9]|asercje_v2=(\d+)\/(?!\1\b)\d+/.test(l)).map((l) => l.trim().split(/\s+/)[0]);
    const detected = r.status === 1;
    if (!detected) missed++;
    console.log(`${name}: EXIT=${r.status} ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} [${mods.join(', ')}] ${summary}`);
  } finally {
    writeFileSync(p, orig);
  }
  if (readFileSync(p, 'utf8') !== orig) throw new Error(`nie przywrócono ${rel}`);
}
console.log(`mutate-level2: mutacji=${MUTS.length} niewykrytych=${missed} (pliki przywrócone bajtowo)`);
process.exit(missed === 0 ? 0 : 1);
