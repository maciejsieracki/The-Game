/**
 * moc-ranking-rozjazd-test.cjs
 *
 * R-MOC-RANKING-ROZJAZD-Q1=B (Maciej 2026-08-07): panel Mocy imperium (widoczny
 * dla gracza) ma liczyc Moc EFEKTYWNA, nie NOMINALNA (unitDefFor surowy, ktory
 * nie zna battlesSurvived) -- to jest RDZEN tej decyzji i zostaje NIEZMIENIONY.
 * Progi decyzji dyplomatycznych AI (militaryRatioFromArmyM, progi wojny)
 * ZOSTAJA NOMINALNE -- to NIE jest czesc tej decyzji.
 *
 * CO TO ZNACZY "EFEKTYWNA" skorygowane przez R-MOC-TABLICZKA-VS-CIVPOWER-Q1
 * (Maciej 2026-08-09): do 2026-08-09 "efektywna" = weteran + fortyfikacja
 * polowa/garnizonowa + mnoznik trudnosci AI (combatPowerScaledDefFor, spojnie
 * z tabliczka jednostki). OD 2026-08-09 tabliczka i civ-power sa DWIEMA
 * ROZNYMI liczbami (Moc cywilizacji NIE ma juz zalezec od tego, gdzie akurat
 * stoi jednostka ani od trudnosci gry AI) -- civ-power "efektywna" = WYLACZNIE
 * weteran (veteranScaledDefFor), BEZ fortyfikacji/terenu/muru/trudnosci AI.
 * Numerycznie WYNIK TEGO TESTU SIE NIE ZMIENIA (patrz komentarz przy fixture
 * nizej): dla gracza (ownerId=0, brak bonusu trudnosci AI) i jednostki
 * nieufortyfikowanej, stary combatPowerScaledDefFor(u) i nowy
 * veteranScaledDefFor(u) dawaly IDENTYCZNA liczbe -- zmienia sie WYLACZNIE
 * literalne zrodlo w main.ts (sekcja 3 nizej), nie zachowanie funkcjonalne
 * tego konkretnego scenariusza.
 *
 * Konwencja jak tools/weterani-test.cjs:
 *   1. esbuild bundluje src/game/veteran.ts i src/game/unit-power.ts do CJS.
 *   2. Reimplementuje 1:1 sumArmyMForOwner (nominalna) i sumArmyMForOwnerEffective
 *      (main.ts) z armyFieldPower() na surowym def (nominalna) vs. def
 *      przeskalowanym przez applyVeteranFracToCombatUnit (efektywna -- dokladnie
 *      main.ts::veteranScaledDefFor, ktorego sumArmyMForOwnerEffective dzis wola
 *      wprost).
 *   3. Ten sam fixture (Konnica, units.json) i ten sam wynik (49 -> 58.0) co
 *      weterani-test.cjs sekcje 9-10 i commit 304eff9 -- bezposrednio
 *      porownywalny "ta sama armia, dwie liczby Mocy" przyklad.
 *   4. Asercje zrodlowe na main.ts (regex/substring), zeby cofniecie wpiecia
 *      bylo lapane przez bramke, nie tylko przez ten test funkcjonalny.
 *
 * Usage (z gra/): node tools/moc-ranking-rozjazd-test.cjs
 */

'use strict';

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const VETERAN_TS = path.join(GRA_DIR, 'src/game/veteran.ts');
const UNIT_POWER_TS = path.join(GRA_DIR, 'src/game/unit-power.ts');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');

// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalog roboczy unikalny per przebieg ---
// Stala nazwa pliku/katalogu pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly
// przebieg (takze z innego worktree): dwa biegi nadpisuja sobie ten sam artefakt, co
// daje raz falszywy CZERWONY, raz falszywy ZIELONY. mkdtempSync rozlacza je z definicji.
const TMPDIR_RUN_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-moc-ranking-rozjazd-'));
// Unikalnosc bez sprzatania zamienilaby kolizje w staly wyciek dysku — kasujemy
// WYLACZNIE wlasny katalog tego przebiegu.
process.on('exit', () => { try { fs.rmSync(TMPDIR_RUN_DIR, { recursive: true, force: true }); } catch { /* best-effort */ } });
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();
function bundle(entry, outName) {
  const outfile = path.join(TMPDIR_RUN_DIR, outName);
  execSync(
    '"' + ESBUILD_BIN + '" "' + entry + '" --bundle --platform=node --format=cjs --outfile="' + outfile + '"',
    { stdio: 'inherit' },
  );
  return require(outfile);
}

console.log('Bundling veteran.ts, unit-power.ts with esbuild...');
const veteranMod = bundle(VETERAN_TS, 'veteran-bundle-moc-rozjazd.cjs');
const unitPowerMod = bundle(UNIT_POWER_TS, 'unit-power-bundle-moc-rozjazd.cjs');
console.log('Bundle OK.\n');

const { veteranCombatBonusFrac, applyVeteranFracToCombatUnit } = veteranMod;
const { armyFieldPower } = unitPowerMod;

let passCount = 0;
let failCount = 0;

function check(label, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS: ' + label);
  } else {
    failCount++;
    console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : ''));
  }
}

function approxEq(a, b, eps) {
  eps = eps === undefined ? 1e-9 : eps;
  return Math.abs(a - b) < eps;
}

const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const konnicaRaw = unitsRaw.find((u) => u['Jednostka'] === 'Konnica');
if (!konnicaRaw) { console.error('Fixture unit "Konnica" not found in units.json'); process.exit(1); }

/** Reimplementuje main.ts veteranScaledDefFor() 1:1 (patrz weterani-test.cjs). */
function veteranScaledUnitRow(raw, battlesSurvived) {
  const frac = veteranCombatBonusFrac({ battlesSurvived });
  if (!frac) return raw;
  const scaled = applyVeteranFracToCombatUnit(raw, frac);
  const { fieldPower, ...rest } = scaled;
  return rest;
}

console.log('========================================================================');
console.log('R-MOC-RANKING-ROZJAZD-Q1=B -- panel Mocy EFEKTYWNA, progi AI NOMINALNE');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. Reimplementacja 1:1 main.ts::sumArmyMForOwner (NOMINALNA) i
//    main.ts::sumArmyMForOwnerEffective (EFEKTYWNA) dla jednej jednostki
//    (Konnica, battlesSurvived=3 -> ★★★). Roster o dlugosci 1, wiec suma ==
//    pojedyncza armyFieldPower.
// ---------------------------------------------------------------------------
console.log('1. Ta sama armia (Konnica ★★★), dwa warianty sumArmyMForOwner');

const armySumNominalRekrut = armyFieldPower(konnicaRaw); // unitDefFor(u) -- surowy wiersz
const armySumNominalWeteran = armyFieldPower(konnicaRaw); // NOMINALNA nie czyta battlesSurvived w ogole
check(
  'sumArmyMForOwner (NOMINALNA) == 49 dla rekruta (unitDefFor, bez skalowania)',
  approxEq(armySumNominalRekrut, 49, 0.05),
  armySumNominalRekrut,
);
check(
  'sumArmyMForOwner (NOMINALNA) IDENTYCZNA dla rekruta i weterana ★★★ (49 == 49) -- '
    + 'unitDefFor() nie zna battlesSurvived, to jest ZRODLO rozjazdu z tabliczka',
  approxEq(armySumNominalRekrut, armySumNominalWeteran, 1e-9),
  armySumNominalRekrut + ' vs ' + armySumNominalWeteran,
);

const armySumEffectiveRekrut = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 0));
const armySumEffectiveWeteran = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 3));
const konnicaArmor = konnicaRaw.armor;
const expectedEffectiveWeteran = Math.round((armySumEffectiveRekrut * 1.20 - konnicaArmor * 0.20) * 10) / 10;
check(
  'sumArmyMForOwnerEffective (EFEKTYWNA) == 58.0 dla weterana ★★★ (veteranScaledDefFor, R-MOC-TABLICZKA-VS-CIVPOWER-Q1)',
  approxEq(armySumEffectiveWeteran, expectedEffectiveWeteran, 0.05),
  armySumEffectiveWeteran + ' vs oczekiwane ' + expectedEffectiveWeteran,
);
check(
  'sumArmyMForOwnerEffective ROSNIE z weteranstwem (49 -> 58.0), w odroznieniu od NOMINALNEJ',
  armySumEffectiveWeteran > armySumEffectiveRekrut,
  armySumEffectiveRekrut + ' -> ' + armySumEffectiveWeteran,
);
console.log('');

// ---------------------------------------------------------------------------
// 2. Przeliczony przyklad "ta sama armia, panel Mocy PRZED/PO":
//    PRZED tym zleceniem panel Mocy (buildPowerRankingByOwner) czytal
//    objectivePowerForOwner -> sumArmyMForOwner (NOMINALNA), wiec skladnik
//    "armia" Mocy imperium = 49 pkt niezaleznie od gwiazdek. PO: panel Mocy
//    czyta objectivePowerForOwnerEffective -> sumArmyMForOwnerEffective, wiec
//    skladnik "armia" = 58.0 pkt dla tej samej armii weteranow -- zgodnie z
//    tabliczka jednostki (304eff9: Konnica ★★★ 49 -> 58.0 na tokenie).
//    militaryRatioFromArmyM (AI) w OBU wariantach nadal czyta 49 -- progi
//    wojny/dyplomacji AI sie NIE przesuwaja.
// ---------------------------------------------------------------------------
console.log('2. Przeliczony przyklad: panel Mocy PRZED/PO, militaryRatioFromArmyM niezmieniony');
check(
  'Panel Mocy PRZED (nominalna, ta decyzja jeszcze nie wdrozona): skladnik "armia" = 49 pkt',
  approxEq(armySumNominalWeteran, 49, 0.05),
);
check(
  'Panel Mocy PO (R-MOC-RANKING-ROZJAZD-Q1=B): skladnik "armia" = 58.0 pkt (+18,37%)',
  approxEq(armySumEffectiveWeteran, 58.0, 0.05),
);
check(
  'militaryRatioFromArmyM (AI, sumArmyMForOwner) NIEZMIENIONY: nadal czyta 49, nie 58.0',
  approxEq(armySumNominalWeteran, 49, 0.05) && !approxEq(armySumNominalWeteran, 58.0, 0.5),
);
console.log('');

// ---------------------------------------------------------------------------
// 3. Asercje zrodlowe na main.ts -- lapia ciche cofniecie/przesuniecie wpiecia.
// ---------------------------------------------------------------------------
console.log('3. main.ts: wpiecie efektywnej WYLACZNIE do panelu Mocy, AI nietkniete');
const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

check(
  'sumArmyMForOwnerEffective() istnieje i uzywa veteranScaledDefFor(u) (R-MOC-TABLICZKA-VS-CIVPOWER-Q1, '
    + 'BEZ fortyfikacji/terenu/muru/trudnosci AI -- korekta zakresu wzgledem R-MOC-RANKING-ROZJAZD-Q1=B)',
  /function sumArmyMForOwnerEffective\(ownerId: number\): number \{[\s\S]{0,3000}?armyFieldPower\(veteranScaledDefFor\(u\)\)/.test(mainTsSrc),
);
check(
  'sumArmyMForOwner() (NOMINALNA) nietknieta -- nadal armyFieldPower(unitDefFor(u))',
  /function sumArmyMForOwner\(ownerId: number\): number \{[\s\S]{0,400}?armyFieldPower\(unitDefFor\(u\)\)/.test(mainTsSrc),
);
check(
  'buildPowerRankingByOwner: pole "power" czyta objectivePowerForOwnerEffective(oid)',
  /power: objectivePowerForOwnerEffective\(oid\)/.test(mainTsSrc),
);
check(
  'buildPowerOverlayData: "obj" czyta buildObjectivePowerForOwnerEffective(0), nie cache nominalny',
  /function buildPowerOverlayData\(\): PowerOverlayData \{[\s\S]{0,200}?const obj = buildObjectivePowerForOwnerEffective\(0\);/.test(mainTsSrc),
);
check(
  'buildPowerOverlayData: diagMajorAi liczy mocForOwner: objectivePowerForOwnerEffective',
  /mocForOwner: objectivePowerForOwnerEffective,/.test(mainTsSrc),
);
check(
  'buildPowerOverlayData: absoluteRank liczy buildAbsolutePowerRankEffective()',
  /const absoluteRank = buildAbsolutePowerRankEffective\(\);/.test(mainTsSrc),
);
// N1 (nota Evaluatora, 2026-08-07): CZWARTY konsument, ktory Operator sam
// wykryl i naprawil (buildEmpireDetailSnap -- powOverlay.ranking/absoluteRank
// z buildPowerOverlayData juz EFEKTYWNE, a `obj`/powerComponents na TYM SAMYM
// ekranie liczyly nominalnie, gdyby zostaly nietkniete -- ekran pokazywalby
// dwie rozne liczby Mocy naraz), nie mial WLASNEJ asercji zrodlowej -- dowod
// mutacyjny Evaluatora: cofniecie main.ts:11299 na buildObjectivePowerForOwner(0)
// (nominalna) zostawialo cala bramke 18/18 zielona. Domykajaca asercja:
check(
  'buildEmpireDetailSnap: obj liczy buildObjectivePowerForOwnerEffective(0) (NIE nominalna) -- spojnosc wewnatrz jednego ekranu z powOverlay.ranking',
  /function buildEmpireDetailSnap\(\): EmpireDetailSnap \{[\s\S]{0,1200}?const obj = buildObjectivePowerForOwnerEffective\(0\);/.test(mainTsSrc),
);

// (b) AI -- 4 wywolania bezposrednie sumArmyMForOwner (militaryRatioFromArmyM)
// musza zostac BAJTOWO nietkniete (literalny substring, nie regex -- zero
// tolerancji na "Effective" wkradajace sie w te linie).
const protectedAiCallsites = [
  '            const milRatioAB = militaryRatioFromArmyM(sumArmyMForOwner(a), sumArmyMForOwner(b));',
  '        sumArmyMForOwner(proposerId),\n        sumArmyMForOwner(responderId),',
  '                  sumArmyMForOwner(ownerId),\n                  sumArmyMForOwner(0),',
  '                      sumArmyMForOwner(ownerId),\n                      sumArmyMForOwner(csId),',
];
for (const [i, snippet] of protectedAiCallsites.entries()) {
  check(
    '(b) AI callsite #' + (i + 1) + ' bajtowo nietkniety (sumArmyMForOwner NOMINALNA, nie Effective)',
    mainTsSrc.includes(snippet),
    'wzorzec nie znaleziony -- ktos zmienil/przesunal ten call-site',
  );
}

// Nominalny cache objectivePowerByOwner/buildObjectivePowerForOwner nadal
// istnieje i karmi AI (respekt/dyplomacja) -- nie zostal usuniety ani
// przemianowany, wywolanie w refreshObjectivePowerCache nietkniete.
check(
  'refreshObjectivePowerCache nadal woła buildObjectivePowerForOwner (NOMINALNA) dla cache AI',
  /objectivePowerByOwner\.set\(oid, buildObjectivePowerForOwner\(oid\)\);/.test(mainTsSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('========================================================================');
console.log('WYNIK: ' + passCount + ' PASS, ' + failCount + ' FAIL');
console.log('========================================================================');
if (failCount > 0) process.exit(1);
