#!/usr/bin/env node
/**
 * mutate-hud-empire.mjs — kontrola czułości harnessu P5.7 r1 (`run-hud-empire.mjs`): wstrzykuje po jednej mutacji do modułu
 * v2, uruchamia harness dla tego modułu (`--only <moduł> --stop-on-diff`) i oczekuje EXIT=1; przywraca plik bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate-hud-empire.mjs --pin-dir <PIN_DIR> [--only E1,E2]   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinDir = args[args.indexOf('--pin-dir') + 1];
if (!pinDir || args.indexOf('--pin-dir') < 0) {
  console.error('Użycie: node tools/dom-harness/mutate-hud-empire.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const onlyIds = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

/** [nazwa, plik, przed, po, moduł harnessu] — „przed” musi wystąpić w pliku dokładnie raz. */
const E = 'empireDetailPanel.ts';
const EP = 'src/ui/empireDetailPanel.ts';
const MUTS = [
  // empireDetailPanel.ts — każdy odczyt nowego pola DTO, zapytania, stałe katalogu, kopie formaterów, GRANICZNY, markup.
  ['E1 imperium: baza dochodu szlaków z DTO → suma z premią', EP, `const tradeBase = t.tradeBaseIncome;`, `const tradeBase = t.totalIncome;`, E],
  ['E2 imperium: suma zużycia z DTO bez obywateli', EP, `const total = u.total;`, `const total = u.buildings + u.units;`, E],
  ['E3 imperium: zużycie obywateli imperium z DTO +1', EP, `const zuzyciePerTyp = p.zuzycieObywateliPerTyp;`, `const zuzyciePerTyp = p.zuzycieObywateliPerTyp + 1;`, E],
  ['E4 imperium: zużycie obywateli miasta = liczba obywateli', EP, `const z = c.zuzycieObywateliPerTurn;`, `const z = c.ludki + 1;`, E],
  ['E5 imperium: wzrost efektywny z DTO → nominalny', EP, `const wzrostEff = row.wzrostProcentEff;`, `const wzrostEff = row.wzrostProcent;`, E],
  ['E6 imperium: wiersz SUMA tabeli Miasta zniekształcony', EP, `miasta: cityMiastaMiniDetail(ce, cp, snap.food, e, snap.miastaSummary),`, `miasta: cityMiastaMiniDetail(ce, cp, snap.food, e, { ...snap.miastaSummary, obywTotal: 0 }),`, E],
  ['E7 imperium: nazwy surowców magazynu bez katalogu', EP, `staticCatalog().labels.stockResourceLabels[key] ?? key;`, `key;`, E],
  ['E8 imperium: dopełniacz daniny bez katalogu', EP, `=> staticCatalog().labels.daninaGenitive;`, `=> 'podatek';`, E],
  ['E9 imperium: redystrybucja suwaka handlu bez zapytania', EP, `): CityPodzialHandlu => empireQueries().adjustHandelSplit(current, changed, newVal);`, `): CityPodzialHandlu => ({ ...current, [changed]: newVal });`, E],
  ['E10 imperium: normalizacja podziału handlu bez zapytania', EP, `=> empireQueries().normalizePodzialHandlu(split);`, `=> ({ ...split });`, E],
  ['E11 imperium: % puli Pracy bez zapytania', EP, `  empireQueries().procentPuliImperiumZBudynkow(procentBudynki);`, `  50;`, E],
  ['E12 imperium: podział Pracy z % puli bez zapytania', EP, `  empireQueries().podzialPracyZProcentuPuli(procentPuli);`, `  ({ procentBudynki: 100 });`, E],
  ['E13 imperium: krok suwaka handlu z katalogu ignorowany', EP, `const HANDEL_PCT_STEP = staticCatalog().constants.handelPctStep;`, `const HANDEL_PCT_STEP = 5;`, E],
  ['E14 imperium: limit Nauki z katalogu ignorowany', EP, `const MAX_PROCENT_NAUKA = staticCatalog().constants.maxProcentNauka;`, `const MAX_PROCENT_NAUKA = 100;`, E],
  ['E15 imperium: maks. % puli imperium z katalogu ignorowany', EP, `const MAX_PROCENT_PULI_IMPERIUM = staticCatalog().constants.maxProcentPuliImperium;`, `const MAX_PROCENT_PULI_IMPERIUM = 40;`, E],
  ['E16 imperium: krok Wyżywienia z katalogu ignorowany', EP, `const WYZYWIENIE_STEP = staticCatalog().constants.wyzywienieStep;`, `const WYZYWIENIE_STEP = 1;`, E],
  ['E17 imperium: stawka utrzymania obywatela (stopka) z katalogu ignorowana', EP, `const CITIZEN_UPKEEP_RATE_PER_CITIZEN = staticCatalog().constants.citizenUpkeepRatePerCitizen;`, `const CITIZEN_UPKEEP_RATE_PER_CITIZEN = 2;`, E],
  ['E18 imperium: etykieta puli Pracy z katalogu ignorowana', EP, `const PODZIAL_PRACY_PULA_LBL = staticCatalog().labels.podzialPracyPulaLbl;`, `const PODZIAL_PRACY_PULA_LBL = 'Ulepszenia';`, E],
  ['E19 kopia F: formatManpower — sufiks tysięcy', EP, `return (t >= 100 ? Math.round(t) : Math.round(t * 10) / 10) + ' tys.';`, `return (t >= 100 ? Math.round(t) : Math.round(t * 10) / 10) + ' tys';`, E],
  ['E20 kopia F: formatObywateleLabel — forma mnoga', EP, `  return \`\${n} obywateli\`;\n}`, `  return \`\${n} obyw.\`;\n}`, E],
  ['E21 kopia F: formatWyzwienieLabel — przecinek dziesiętny', EP, `return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');`, `return Number.isInteger(v) ? String(v) : v.toFixed(1);`, E],
  ['E22 imperium GRANICZNY: koszty skarbca bez wojska', EP, `  const koszty = utrzB + utrzJ;\n  const netto = Math.round(economy.bogactwoRate ?? 0);\n  const stan`, `  const koszty = utrzB;\n  const netto = Math.round(economy.bogactwoRate ?? 0);\n  const stan`, E],
  ['E23 kopia: imperium — nagłówek tabeli wpływów', EP, `h += subHdr('Wpływy do skarbca');`, `h += subHdr('Wpływy');`, E],
  // empireDetailTypes.ts
  ['T1 kopia: uchwała Solanka — nazwa', 'src/ui/empireDetailTypes.ts', `nazwa: 'Solanka zapasowa',`, `nazwa: 'Solanka',`, 'empireDetailTypes.ts'],
  // hud.ts — most i markup.
  ['H1 hud: most ukrycia rosteru niezarejestrowany', 'src/ui/hud.ts', `registerArmyStackHudSuppression(setArmyStackHudSuppressed);`, `registerArmyStackHudSuppression(null);`, 'hud.ts'],
  ['H2 kopia: hud — etykieta tury', 'src/ui/hud.ts', `'<div class="right"><span class="turn">Tura <b>'`, `'<div class="right"><span class="turn">Runda <b>'`, 'hud.ts'],
  // sceneTimingReport.ts
  ['S1 raport: etykiety faz z katalogu — zły klucz', 'src/ui/sceneTimingReport.ts', `staticCatalog().constants.mapGenPhaseLabels[key] ?? ''`, `staticCatalog().constants.mapGenPhaseLabels.prep ?? ''`, 'sceneTimingReport.ts'],
  ['S2 raport: przełącznik rzek z powłoki ignorowany', 'src/ui/sceneTimingReport.ts', `const getRiverGenEnabled = (): boolean => perfDiagnostics().riverGenEnabled;`, `const getRiverGenEnabled = (): boolean => true;`, 'sceneTimingReport.ts'],
  ['S3 kopia: raport — nagłówek', 'src/ui/sceneTimingReport.ts', `margin-bottom:4px;">Czasy ładowania</div>`, `margin-bottom:4px;">Czasy</div>`, 'sceneTimingReport.ts'],
];

let missed = 0;
let run = 0;
for (const [name, rel, a, b, mod] of MUTS) {
  if (onlyIds && !onlyIds.includes(name.split(' ')[0])) continue;
  run++;
  const p = resolve(ROOT, rel);
  const orig = readFileSync(p, 'utf8');
  const count = orig.split(a).length - 1;
  if (count !== 1) {
    console.log(`${name}: BŁĄD wzorzec występuje ${count}× EXIT=n/d NIEWYKRYTA`);
    missed++;
    continue;
  }
  try {
    writeFileSync(p, orig.replace(a, b));
    const r = spawnSync('node', ['tools/dom-harness/run-hud-empire.mjs', '--pin-dir', pinDir, '--only', mod, '--stop-on-diff'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    // EXIT=2 = błąd harnessu (nie wykrycie) — liczony jako NIEWYKRYTA; do logu trafia pierwsza linia błędu.
    const summary = r.stdout.split('\n').find((l) => l.startsWith('dom-harness-hud-empire:'))
      ?? (r.stderr.split('\n').find((l) => /BŁĄD|Error/.test(l)) ?? r.stderr.slice(-300));
    const detected = r.status === 1;
    if (!detected) missed++;
    console.log(`${name}: EXIT=${r.status} ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} [${mod}] ${summary}`);
  } finally {
    writeFileSync(p, orig);
  }
  if (readFileSync(p, 'utf8') !== orig) throw new Error(`nie przywrócono ${rel}`);
}
console.log(`mutate-hud-empire: mutacji=${run} niewykrytych=${missed} (pliki przywrócone bajtowo)`);
process.exit(missed === 0 ? 0 : 1);
