#!/usr/bin/env node
/**
 * mutate-newgame.mjs — test mutacyjny harnessu `run-newgame.mjs` (P5.7 r2, `newGameFlow.ts`).
 * Każda mutacja zmienia JEDNO miejsce w `src/ui/newGameFlow.ts` frontend-v2 (odczyt stałej katalogu, zapytanie
 * kreatora, pole DTO, kopia 1:1 jakości mapy, markup kopii), uruchamia harness (`--stop-on-diff`) i oczekuje EXIT=1;
 * przywraca plik bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate-newgame.mjs --pin-dir <PIN_DIR> [--only N1,N2]   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const pinDir = args[args.indexOf('--pin-dir') + 1];
if (!args.includes('--pin-dir') || !pinDir) {
  console.error('Użycie: node tools/dom-harness/mutate-newgame.mjs --pin-dir <PIN_DIR> [--only N1,N2]');
  process.exit(2);
}
const onlyIds = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const F = 'src/ui/newGameFlow.ts';

/** [nazwa, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  // Stałe katalogu (P5-0 §6.10 defaults).
  ['N1 stała: domyślna cywilizacja gracza z katalogu ignorowana', `const DEFAULT_PLAYER_CIV_ID = staticCatalog().constants.newGameDefaultPlayerCivId;`, `const DEFAULT_PLAYER_CIV_ID = 'grecy';`],
  ['N2 stała: domyślna epoka startu z katalogu ignorowana', `const DEFAULT_START_EPOCH_ID = staticCatalog().constants.newGameDefaultStartEpochId;`, `const DEFAULT_START_EPOCH_ID = 'braz';`],
  ['N3 stała: domyślna jakość mapy z katalogu ignorowana', `const DEFAULT_RENDER_QUALITY: QualityTier = staticCatalog().constants.newGameDefaultRenderQuality;`, `const DEFAULT_RENDER_QUALITY: QualityTier = 'low';`],
  ['N4 stała: limit typów cywilizacji z katalogu ignorowany', `const MAX_TYPY_CYWILIZACJI_MENU = staticCatalog().constants.maxTypyCywilizacjiMenu;`, `const MAX_TYPY_CYWILIZACJI_MENU = 2;`],
  ['N5 stała: opcje udziału lądu z katalogu odwrócone', `const LAND_FRACTION_PERCENT_OPTS = staticCatalog().constants.landFractionPercentOpts;`, `const LAND_FRACTION_PERCENT_OPTS = [...staticCatalog().constants.landFractionPercentOpts].reverse();`],
  // Zapytania kreatora (reguły → silnik).
  ['N6 zapytanie: menu miast-państw dla innej mapy', `newGameQueries().miastaPanstwaMenuForMapLabel(mapLabel);`, `newGameQueries().miastaPanstwaMenuForMapLabel('Mały');`],
  ['N7 zapytanie: menu typów cywilizacji bez epoki', `newGameQueries().civTypesMenuForMapLabel(mapLabel, epochId, roster);`, `newGameQueries().civTypesMenuForMapLabel(mapLabel, 'zelazo', roster);`],
  ['N8 zapytanie: domyślne miasta-państwa stałe', `newGameQueries().defaultMiastaPanstwaFromMapLabel(mapLabel);`, `1;`],
  ['N9 zapytanie: domyślne typy cywilizacji stałe', `newGameQueries().defaultCivTypesFromMapLabel(mapLabel, epochId, roster);`, `1;`],
  ['N10 zapytanie: limit typów epoki zawyżony', `newGameQueries().maxCivTypesForStartEpoch(epochId, roster);`, `99;`],
  ['N11 zapytanie: klamra miast-państw pominięta', `newGameQueries().clampMiastaPanstwaCount(raw);`, `raw + 1;`],
  ['N12 zapytanie: typ świata stały', `newGameQueries().typSwiataFromMenuLabel(label);`, `('pangea' as TypSwiataDto);`],
  ['N13 zapytanie: domyślny udział lądu stały', `newGameQueries().defaultLandFractionPercentForTyp(typ);`, `50;`],
  ['N14 zapytanie: gęstość świata — zamiana pól', `  newGameQueries().worldGenerationPresetFromLabels(labels);`, `  newGameQueries().worldGenerationPresetFromLabels({ ...labels, desert: labels.forest });`],
  ['N15 zapytanie: podgląd startu bez liczby miast-państw', `newGameQueries().buildStartPreview(input);`, `newGameQueries().buildStartPreview({ ...input, cityStatesCount: undefined });`],
  ['N16 zapytanie: profil macierzy innej cywilizacji', `newGameQueries().civMatrixProfile(civKey);`, `newGameQueries().civMatrixProfile('grecy');`],
  ['N17 zapytanie: dostępność cywilizacji w epoce zawsze', `return newGameQueries().civAvailableAtEpoch(c.epokiStartowe, selectedEpochId);`, `return true;`],
  // Pola DTO.
  ['N18 DTO: wiersze podsumowania startu odwrócone', `for (const [k, v] of p.startPreview.summaryRows) {`, `for (const [k, v] of [...p.startPreview.summaryRows].reverse()) {`],
  ['N19 DTO: etykieta parametru macierzy = identyfikator', `head.appendChild(el('div', 'civ-matrix-cell-name', cell.paramLabel));`, `head.appendChild(el('div', 'civ-matrix-cell-name', cell.parameterId));`],
  ['N20 DTO: wartość macierzy = mediana', 'meta.appendChild(el(\'span\', \'\', `Wartość: ${cell.formatted}`));', 'meta.appendChild(el(\'span\', \'\', `Wartość: ${cell.baselineFormatted}`));'],
  ['N21 DTO: mediana macierzy = wartość', 'meta.appendChild(el(\'span\', \'\', `Mediana Normal: ${cell.baselineFormatted}`));', 'meta.appendChild(el(\'span\', \'\', `Mediana Normal: ${cell.formatted}`));'],
  ['N22 DTO: siła macierzy bez znaku', 'meta.appendChild(el(\'span\', \'\', `Siła: ${cell.intensityLabel} / 10`));', 'meta.appendChild(el(\'span\', \'\', `Siła: ${cell.intensity} / 10`));'],
  ['N23 DTO: widoczność domyślna komórki odwrócona', `      cell.visibleByDefault ? activeList : inactiveList,`, `      cell.visibleByDefault ? inactiveList : activeList,`],
  ['N24 DTO: filtr „Nieaktywne” bez pola widoczności', `if (filter === 'inactive') return !cell.visibleByDefault;`, `if (filter === 'inactive') return cell.consumerStatus === 'UNWIRED';`],
  ['N25 DTO: licznik widocznych nieaktywnych', `if (!entry.cell.visibleByDefault) visibleInactive++;`, `if (entry.cell.visibleByDefault) visibleInactive++;`],
  // Dane z katalogu.
  ['N26 dane: brak danych → pusty katalog', `function loadGameData(): GameData {\n  return staticCatalog();`, `function loadGameData(): GameData {\n  return { civs: { cywilizacje: [] } };`],
  ['N27 dane: predykat cywilizacji bez nazwy pominięty', `.filter((c): c is CivEntryEpochRow & { Cywilizacja: string } => !!c.Cywilizacja)`, `.filter((c): c is CivEntryEpochRow & { Cywilizacja: string } => c !== null)`],
  // Kopia 1:1 jakości mapy (Z9).
  ['N28 kopia: etykieta jakości „Wysoka”', `  if (tier === 'high') return 'Wysoka';\n  return 'Średnia';`, `  if (tier === 'high') return 'Wysokie';\n  return 'Średnia';`],
  // N29: usunięcie `.replace(/ł/g, 'l')` jest mutacją RÓWNOWAŻNĄ (żadna etykieta jakości z `ui-params.json` ani
  // `qualityTierToLabel` nie zawiera „ł”, a z „ł” nie da się uzyskać `niska|low|wysoka|high`) — zastąpiona mutacją
  // wielkości liter, która zmienia wynik dla etykiet „Niska”/„Wysoka”.
  ['N29 kopia: normalizacja etykiety jakości bez zmiany wielkości liter', `  return label.toLowerCase()\n    .replace(/ł/g, 'l')`, `  return label\n    .replace(/ł/g, 'l')`],
  ['N30 kopia: pakiet jakości — szczegóły = render niski', `return { renderQuality: tier, mapDetailQuality: tier };`, `return { renderQuality: tier, mapDetailQuality: 'low' };`],
  ['N31 kopia: domyślny tier jakości', `  if (n === 'wysoka' || n === 'high') return 'high';\n  return 'medium';`, `  if (n === 'wysoka' || n === 'high') return 'high';\n  return 'low';`],
  // Markup kopii.
  ['N32 kopia: kreator — nagłówek intro', `intro.appendChild(el('div', 'big', 'NOWA GRA'));`, `intro.appendChild(el('div', 'big', 'NOWA'));`],
  ['N33 kopia: kreator — klasa przycisku zaawansowanych', `const advBtn = el('button', 'btn-adv', '&#9881;&nbsp; Zaawansowane opcje');`, `const advBtn = el('button', 'btn-adv2', '&#9881;&nbsp; Zaawansowane opcje');`],
];

let missed = 0;
let run = 0;
const p = resolve(ROOT, F);
for (const [name, a, b] of MUTS) {
  if (onlyIds && !onlyIds.includes(name.split(' ')[0])) continue;
  run++;
  const orig = readFileSync(p, 'utf8');
  const count = orig.split(a).length - 1;
  if (count !== 1) {
    console.log(`${name}: BŁĄD wzorzec występuje ${count}× EXIT=n/d NIEWYKRYTA`);
    missed++;
    continue;
  }
  try {
    writeFileSync(p, orig.replace(a, b));
    const r = spawnSync('node', ['tools/dom-harness/run-newgame.mjs', '--pin-dir', pinDir, '--stop-on-diff'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    // EXIT=2 = błąd harnessu (nie wykrycie) — liczony jako NIEWYKRYTA; do logu trafia pierwsza linia błędu.
    const summary = r.stdout.split('\n').find((l) => l.startsWith('dom-harness-newgame:'))
      ?? (r.stderr.split('\n').find((l) => /BŁĄD|Error/.test(l)) ?? r.stderr.slice(-300));
    const detected = r.status === 1;
    if (!detected) missed++;
    console.log(`${name}: EXIT=${r.status} ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} ${summary}`);
  } finally {
    writeFileSync(p, orig);
  }
  if (readFileSync(p, 'utf8') !== orig) throw new Error(`nie przywrócono ${F}`);
}
console.log(`mutate-newgame: mutacji=${run} niewykrytych=${missed} (plik przywrócony bajtowo)`);
process.exit(missed === 0 ? 0 : 1);
