/**
 * hud-moc-warstwa-test.cjs
 *
 * R-MOC-HUD-GLOWNY-Q1=C (Maciej 2026-08-08): cała warstwa UI pokazująca Moc
 * gracza przechodzi na Moc EFEKTYWNĄ jednym ruchem (nie punktowo):
 *   1. Główny licznik Mocy w HUD (buildHudState -> hud.ts s.power / p-val-num).
 *   2. Ekran dyplomacji: openDiplomacyAudience (playerPower/otherPower w
 *      formatPowerRelationLine) + buildPlayerDiploSummary (militaryPower,
 *      powerRank -- "Moc: X" / "Ranking mocy: Y. z Z" na liście dyplomacji).
 *   3. Pozycja w rankingu na ekranie dyplomacji: buildAbsolutePowerRank ->
 *      buildAbsolutePowerRankEffective (już istniejąca, z d1f7b91). Evaluator
 *      PASS-WITH-NOTES pkt B: buildAbsolutePowerRank (bez Effective) w efekcie
 *      straciła ostatniego callera i została USUNIĘTA jako martwy kod -- ranking
 *      nominalny dla AI nadal żyje, ale przez inline callback w computeAbsolutePowerRank
 *      (~linia 21912), nie przez tę nazwaną funkcję.
 *   4. Odkryte przy przeglądzie (Operator, ta sesja) — respekt widoczny dla
 *      gracza jest DERYWATĄ Power i musiał pójść razem, inaczej powstawałby
 *      DOKŁADNIE ten sam rozjazd, który cała ta decyzja ma zlikwidować:
 *        a. buildPlayerDiploRelations: respekt/theirRespekt (karty per-cywilizacja
 *           na liście dyplomacji) -> objectiveRespektPctTowardEffective (nowa).
 *        b. Ekran audiencji, payload getState(): pole `relacjaTotal` (liczba
 *           "relacja / 200" wyświetlana OBOK paska "Respekt X/100") musiało
 *           przejść na audienceRelTotalEffective (nowa) -- inaczej pasek
 *           Respekt (już efektywny przez respektNorm) i liczba relacjaTotal
 *           (gdyby została nominalna) pokazywałyby dwie różne wartości
 *           respektu dla tej samej pary na TYM SAMYM ekranie.
 *
 * CO ZOSTAJE NOMINALNE (bajtowo nietknięte) -- bramkuje AI i mechaniki gry,
 * nie samą wyświetlaną liczbę:
 *   - sumArmyMForOwner, objectivePowerForOwner, buildObjectivePowerForOwner,
 *     objectivePowerByOwner, ranking nominalny AI przez inline callback w
 *     computeAbsolutePowerRank (buildAbsolutePowerRank jako nazwana funkcja
 *     usunięta -- martwy kod, zero callerów po tej decyzji).
 *   - militaryRatioFromArmyM i jego 4 call-site'y (sumArmyMForOwner bezpośrednio).
 *   - buildAudienceActions/lockCtxBase (relTotal = audienceRelTotal nominalna)
 *     -- progi odblokowania akcji dyplomatycznych, mechanika nie wyświetlacz.
 *   - getNegotiationContext.relacjaTotal (audienceRelTotal nominalna) -- karmi
 *     diplomacyFairGivePn i próg handlu/daru w diplomacyTradeBasket.ts.
 *   - checkVictory/potegaGracza -- warunek zwycięstwa, poza zakresem decyzji C.
 *
 * Konwencja jak tools/moc-ranking-rozjazd-test.cjs (ten sam dzień):
 *   1. esbuild bundluje src/game/veteran.ts i src/game/unit-power.ts do CJS,
 *      dla przeliczonego przykładu Konnica ★★★ (49 -> 58,0), grunt pod
 *      "dlaczego to się w ogóle liczy inaczej".
 *   2. Reszta -- asercje źródłowe (regex/substring na main.ts) na KAŻDYM z
 *      nowych miejsc podłączenia, żeby ciche cofnięcie/przesunięcie było
 *      łapane przez bramkę, nie tylko przez przegląd ręczny.
 *
 * Usage (z gra/): node tools/hud-moc-warstwa-test.cjs
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
const TMPDIR_RUN_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-hud-moc-warstwa-'));
// Unikalnosc bez sprzatania zamienilaby kolizje w staly wyciek dysku — kasujemy
// WYLACZNIE wlasny katalog tego przebiegu.
process.on('exit', () => { try { fs.rmSync(TMPDIR_RUN_DIR, { recursive: true, force: true }); } catch { /* best-effort */ } });
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}
function bundle(entry, outName) {
  const outfile = path.join(TMPDIR_RUN_DIR, outName);
  execSync(
    '"' + ESBUILD_BIN + '" "' + entry + '" --bundle --platform=node --format=cjs --outfile="' + outfile + '"',
    { stdio: 'inherit' },
  );
  return require(outfile);
}

console.log('Bundling veteran.ts, unit-power.ts with esbuild...');
const veteranMod = bundle(VETERAN_TS, 'veteran-bundle-hud-moc-warstwa.cjs');
const unitPowerMod = bundle(UNIT_POWER_TS, 'unit-power-bundle-hud-moc-warstwa.cjs');
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
console.log('R-MOC-HUD-GLOWNY-Q1=C -- HUD + ekran dyplomacji + ranking -> Moc EFEKTYWNA');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. Grunt: ta sama armia (Konnica ★★★), dwa warianty sumArmyMForOwner --
//    dowód że "efektywna" i "nominalna" naprawdę dają RÓŻNE liczby (49 vs 58,0),
//    ten sam fixture co moc-ranking-rozjazd-test.cjs/weterani-test.cjs.
// ---------------------------------------------------------------------------
console.log('1. Grunt liczbowy: Konnica ★★★, sumArmyMForOwner NOMINALNA vs EFEKTYWNA');

const armySumNominal = armyFieldPower(konnicaRaw); // unitDefFor(u) -- nie zna battlesSurvived
const armySumEffectiveWeteran = armyFieldPower(veteranScaledUnitRow(konnicaRaw, 3));
const konnicaArmor = konnicaRaw.armor;
const expectedEffectiveWeteran = Math.round((armySumNominal * 1.20 - konnicaArmor * 0.20) * 10) / 10;
check(
  'sumArmyMForOwner (NOMINALNA) == 49 dla Konnicy (bez skalowania weterana)',
  approxEq(armySumNominal, 49, 0.05),
  armySumNominal,
);
check(
  'sumArmyMForOwnerEffective (EFEKTYWNA) == 58.0 dla Konnicy ★★★ (veteranScaledDefFor, R-MOC-TABLICZKA-VS-CIVPOWER-Q1)',
  approxEq(armySumEffectiveWeteran, expectedEffectiveWeteran, 0.05) && approxEq(armySumEffectiveWeteran, 58.0, 0.05),
  armySumEffectiveWeteran,
);
check(
  'Różnica NOMINALNA vs EFEKTYWNA jest realna (49 != 58.0) -- to ta różnica, którą HUD/dyplomacja/ranking musiały przejąć',
  !approxEq(armySumNominal, armySumEffectiveWeteran, 0.5),
);
console.log('');

// ---------------------------------------------------------------------------
// 2. Asercje źródłowe: KAŻDE nowe miejsce podłączenia (regex na main.ts).
// ---------------------------------------------------------------------------
console.log('2. main.ts: nowe podłączenia -- HUD, ekran dyplomacji, ranking, respekt UI');
const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

// (1) Główny licznik Mocy w HUD.
check(
  'buildHudState: pole "power" czyta objectivePowerForOwnerEffective(0) (NIE objectivePowerForOwner)',
  /function buildHudState\(\): HudState \{[\s\S]{0,2500}?const power = objectivePowerForOwnerEffective\(0\);/.test(mainTsSrc),
);

// (2) Ekran dyplomacji -- openDiplomacyAudience: playerPower/otherPower.
check(
  'openDiplomacyAudience: playerPower czyta objectivePowerForOwnerEffective(0)',
  /const playerPower = objectivePowerForOwnerEffective\(0\);/.test(mainTsSrc),
);
check(
  'openDiplomacyAudience: otherPower czyta objectivePowerForOwnerEffective(ownerId) (OBIE strony efektywne)',
  /const otherPower = objectivePowerForOwnerEffective\(ownerId\);/.test(mainTsSrc),
);
check(
  'openDiplomacyAudience: formatPowerRelationLine nadal woła z (playerPower, otherPower) -- oba już efektywne w scope',
  /const powerLine = formatPowerRelationLine\(playerPower, otherPower\);/.test(mainTsSrc),
);

// (2b) buildPlayerDiploSummary -- "Moc: X" / "Ranking mocy: Y. z Z" na liście dyplomacji.
check(
  'buildPlayerDiploSummary: militaryPower czyta objectivePowerForOwnerEffective(0)',
  /function buildPlayerDiploSummary\(\): DiploPlayerSummary \{[\s\S]{0,400}?militaryPower: objectivePowerForOwnerEffective\(0\),/.test(mainTsSrc),
);

// (3) Pozycja w rankingu na ekranie dyplomacji -> buildAbsolutePowerRankEffective.
check(
  'buildPlayerDiploSummary: powerRank czyta buildAbsolutePowerRankEffective() (NIE buildAbsolutePowerRank nominalną)',
  /function buildPlayerDiploSummary\(\): DiploPlayerSummary \{[\s\S]{0,500}?powerRank: buildAbsolutePowerRankEffective\(\),/.test(mainTsSrc),
);
// R-MOC-HUD-GLOWNY-Q1=C Evaluator PASS-WITH-NOTES pkt B: buildAbsolutePowerRank
// (bez Effective) nie miała już ŻADNEGO callera po przejściu buildPlayerDiploSummary
// na wariant Effective -- sprzątnięta jako martwy kod. Substring "buildAbsolutePowerRank("
// (nazwa + otwierający nawias -- łapie i definicję, i wywołanie) NIE MOŻE dziś wystąpić
// nigdzie w pliku. "buildAbsolutePowerRankEffective(...)" nie pasuje do tego substringa
// (po nazwie idzie "Effective", nie "("), więc to zero trafień jest jednoznaczne.
const absPowerRankNominalMatches = (mainTsSrc.match(/buildAbsolutePowerRank\(/g) || []).length;
check(
  'buildAbsolutePowerRank (bez Effective) ma ZERO trafień substringa w pliku '
    + '-- funkcja martwa usunięta całkowicie (jedyny konsument, buildPlayerDiploSummary, '
    + 'już na buildAbsolutePowerRankEffective; ranking nominalny dla AI żyje przez inline '
    + 'callback w computeAbsolutePowerRank, nie przez tę nazwaną funkcję)',
  absPowerRankNominalMatches === 0,
  'match count: ' + absPowerRankNominalMatches + ', oczekiwano 0',
);

// (4a) Odkrycie Operatora: lista dyplomacji -- respekt/theirRespekt per-cywilizacja.
check(
  'objectiveRespektPctTowardEffective() istnieje i liczy obie strony przez objectivePowerForOwnerEffective',
  /function objectiveRespektPctTowardEffective\(theirOwnerId: number\): number \{[\s\S]{0,200}?objectivePowerForOwnerEffective\(0\),[\s\S]{0,100}?objectivePowerForOwnerEffective\(theirOwnerId\),/.test(mainTsSrc),
);
check(
  'buildPlayerDiploRelations: respekt czyta objectiveRespektPctTowardEffective(otherId)',
  /respekt: objectiveRespektPctTowardEffective\(otherId\),/.test(mainTsSrc),
);
check(
  'buildPlayerDiploRelations: theirRespekt czyta computeRespekt z OBOMA argumentami Effective',
  /theirRespekt: computeRespekt\(\s*objectivePowerForOwnerEffective\(otherId\),\s*objectivePowerForOwnerEffective\(0\),\s*\),/.test(mainTsSrc),
);

// (4b) Odkrycie Operatora: ekran audiencji -- pole relacjaTotal w payloadzie getState()
// musi być spójne z paskiem Respekt (respektNorm, już efektywny).
check(
  'audienceRelTotalEffective() istnieje i liczy przez objectiveRespektPctTowardEffective',
  /function audienceRelTotalEffective\(ownerId: number, rel: Relation\): number \{[\s\S]{0,200}?objectiveRespektPctTowardEffective\(ownerId\)/.test(mainTsSrc),
);
check(
  'getState() payload ekranu audiencji: relacjaTotal czyta audienceRelTotalEffective (spójność z `respekt: respektNorm` na tym samym ekranie)',
  /respekt: respektNorm,\s*\n[\s\S]{0,300}?relacjaTotal: audienceRelTotalEffective\(ownerId, rel\),/.test(mainTsSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// 3. NOMINALNE -- muszą zostać bajtowo nietknięte (progi AI, gating gry,
//    warunek zwycięstwa). Substring, nie regex -- zero tolerancji na
//    "Effective" wkradające się w te linie.
// ---------------------------------------------------------------------------
console.log('3. Ścieżki NOMINALNE bajtowo nietknięte (AI, gating, warunek zwycięstwa)');

const protectedNominalSnippets = [
  // AI: militaryRatioFromArmyM, 4 call-site'y sumArmyMForOwner bezpośrednio.
  '            const milRatioAB = militaryRatioFromArmyM(sumArmyMForOwner(a), sumArmyMForOwner(b));',
  '        sumArmyMForOwner(proposerId),\n        sumArmyMForOwner(responderId),',
  '                  sumArmyMForOwner(ownerId),\n                  sumArmyMForOwner(0),',
  '                      sumArmyMForOwner(ownerId),\n                      sumArmyMForOwner(csId),',
  // AI: sojusz -- militaryRatioAllyVsTarget nominalna.
  'const allyPower = objectivePowerForOwner(allyId);\n      const enemyPower = objectivePowerForOwner(targetId);',
  // AI: refreshObjectivePowerCache -> cache nominalny dla AI.
  'objectivePowerByOwner.set(oid, buildObjectivePowerForOwner(oid));',
  // Gating: buildAudienceActions/lockCtxBase -- progi odblokowania akcji, NIE wyświetlacz.
  'const relTotal = audienceRelTotal(ownerId, rel);',
  // Gating: getNegotiationContext -- karmi diplomacyFairGivePn i próg handlu/daru.
  'relacjaTotal: audienceRelTotal(ownerId, rel),',
  // Warunek zwycięstwa -- poza zakresem R-MOC-HUD-GLOWNY-Q1=C (potwierdzone 3x).
  'potegaGracza: objectivePowerForOwner(0),',
  'potegiWszystkich.push(objectivePowerForOwner(oid));',
  'powerShare(objectivePowerForOwner(0), potegiWszystkich)',
];
for (const [i, snippet] of protectedNominalSnippets.entries()) {
  check(
    '(nominalna) #' + (i + 1) + ' bajtowo nietknięta',
    mainTsSrc.includes(snippet),
    'wzorzec nie znaleziony -- ktoś zmienił/przesunął ten call-site: ' + JSON.stringify(snippet.slice(0, 60)),
  );
}

// audienceRelTotal (nominalna, bez Effective) musi WCIĄŻ istnieć jako funkcja
// (nie usunięta, nie przemianowana) -- karmi gating powyżej.
check(
  'audienceRelTotal (NOMINALNA, bez Effective) nadal istnieje jako funkcja niezależna',
  /function audienceRelTotal\(ownerId: number, rel: Relation\): number \{[\s\S]{0,150}?objectiveRespektPctToward\(ownerId\)/.test(mainTsSrc),
);
// objectiveRespektPctToward (nominalna) musi wciąż istnieć i karmić audienceRelTotal + lock/negocjacje.
check(
  'objectiveRespektPctToward (NOMINALNA, bez Effective) nadal istnieje i liczy obie strony przez objectivePowerForOwner nominalną',
  /function objectiveRespektPctToward\(theirOwnerId: number\): number \{[\s\S]{0,150}?objectivePowerForOwner\(0\), objectivePowerForOwner\(theirOwnerId\)/.test(mainTsSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('========================================================================');
console.log('WYNIK: ' + passCount + ' PASS, ' + failCount + ' FAIL');
console.log('========================================================================');
if (failCount > 0) process.exit(1);
