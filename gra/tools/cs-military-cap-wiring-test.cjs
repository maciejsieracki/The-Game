'use strict';
/**
 * cs-military-cap-wiring-test.cjs — R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04=B
 * (naprawa regresji Evaluatora na commit a6076db7, 2026-08-10; runda 3, Evaluator FAIL na
 * commit 7e753db2, 2026-08-10).
 *
 * Kontekst: a6076db7 rozdzielił trudność Państw-Miast (PM) na dwie osie -- (AI) jak łatwo
 * INNE cywilizacje AI podbijają PM, i (GRACZ) jak agresywne PM są wobec GRACZA -- i przepiął
 * pod nową zmienną `_menuCityStateDifficultyVsPlayer` większość konsumentów (main.ts:
 * applyCityStateDifficultyTrust, cityStateOffensiveSupport, resolveClusterCityStateWarOnPlayer,
 * _menuCitySupport). Evaluator znalazł, że `cityStateMilitaryProductionCap(opts.menuDifficulty)`
 * (ai.ts, wołane w chooseCityProduction) zostało pominięte -- nadal czytało STARĄ oś gry
 * (_menuDifficulty), więc na Trudnym (gra) cap('hard')=0 blokowało PM przed rekrutacją
 * NAWET pierwszego garnizonu, mimo że ten sam commit włączył cityStateOffensiveSupport=true
 * na Trudnym (PM planuje agresję, buduje Koszary, w których nic nigdy nie rekrutuje).
 *
 * RUNDA 2 → RUNDA 3: cap('hard') podniesiony do 3 (= CS_WAVE_ATTACK_MIN_STACK) naprawiał
 * "PM nie rekrutuje w ogóle", ale Evaluator rundy 2 (commit 7e753db2) wykazał, że PM wciąż
 * nigdy nie WYRUSZA z domu -- bramka wyjścia w ai.ts (planCityStateOffensiveMove, wołana
 * z decideAITurn ok. linii 2820) blokuje ofensywę dopóki `totalMilitary < minFieldArmyBeforeSend
 * + minGuardToSend`; na Trudnym `minFieldArmyBeforeSend = CS_WAVE_ATTACK_MIN_STACK = 3` i
 * `minGuardToSend = RESUP_TIERS['strong'].minGuard = 1`, więc realny próg to `< 4`. Cap=3
 * nigdy nie osiągał tego progu -- PM rekrutowało do 3 i tam utykało w mieście na zawsze.
 * cap('hard') podniesiony do 4 = SUMA obu stałych (nie sam CS_WAVE_ATTACK_MIN_STACK).
 *
 * `ai-mp-military-cap-test.cjs` (T1-T8) testuje FUNKCJĘ CZYSTĄ (cityStateMilitaryProductionCap)
 * i chooseCityProduction w izolacji, z ręcznie zbudowanym `opts` -- NIE łapie, gdyby main.ts
 * po cichu wrócił do przekazywania starej osi (_menuDifficulty) zamiast nowej
 * (_menuCityStateDifficultyVsPlayer) w prawdziwym wywołaniu silnika. Ten test zamyka dokładnie
 * tę lukę WIRINGU -- asercje tekstowe (regex) na źródle main.ts + ai.ts, wzorem
 * scout-explore-deselect-cycle-test.cjs / spichlerz-cap-citypanel-wiring-test.cjs, WZMOCNIONE
 * w rundzie 3 o:
 *   (a) stripLineComments przed regexem -- Evaluator wykazał, że zakomentowanie linii
 *       `cityStateDifficultyVsPlayer: _menuCityStateDifficultyVsPlayer,` w main.ts przeżywało
 *       bramkę, bo regex czytał surowe źródło z komentarzem wciąż zawierającym dopasowany tekst;
 *   (b) sekcję 4 -- test faktycznie WYKONUJĄCY chooseCityProduction (przez esbuild, wzorem
 *       ai-mp-military-cap-test.cjs) z opts.cityStateDifficultyVsPlayer=undefined, żeby złapać
 *       SKUTEK RUNTIME wiring-mutanta (PM traci cały limit wojska), nie tylko brak stringa
 *       w źródle;
 *   (c) sekcję 3 -- zamiana dwóch niezależnych testów-na-literał (cap('hard')===3 ORAZ
 *       CS_WAVE_ATTACK_MIN_STACK===3, każdy osobno) na faktyczną RELACJĘ
 *       cap('hard') === CS_WAVE_ATTACK_MIN_STACK + RESUP_TIERS['strong'].minGuard, z obiema
 *       stałymi odczytanymi z ich prawdziwego źródła (ai.ts), nie przepisanymi na sztywno.
 *
 * TODO (świadomie NIE zrobione w rundzie 3): bramka wyjścia z domu sama w sobie
 * (planCityStateOffensiveMove w ai.ts) NIE jest tu wykonywana bezpośrednio -- to funkcja
 * prywatna (nieeksportowana), a jedyna droga do niej to decideAITurn(), które wymaga pełnego
 * stanu gry (cywilizacje, dyplomacja, mapa odkryta, kolejka produkcji...) -- zbyt dużo
 * stubowania na bramkę tekstową. Sekcja 4 niżej łapie runtime-skutek na warstwie
 * chooseCityProduction (cap wojska), która JEST łatwo importowalna w izolacji i pokrywa
 * ten sam wiring-mutant (brak opts.cityStateDifficultyVsPlayer) -- to wystarcza do złapania
 * "PM traci cały limit wojska", ale NIE dowodzi osobno, że sama bramka wyjścia z domu
 * (próg totalMilitary < minFieldArmyBeforeSend + minGuardToSend) działa poprawnie w runtime;
 * to pokrywają dziś tylko testy tekstowe/liczbowe w tym pliku (sekcja 3) i wartości stałych
 * w ai.ts.
 *
 * Run from gra/: node tools/cs-military-cap-wiring-test.cjs
 */
const fs = require('fs');
const path = require('path');

const AI_TS = path.join(__dirname, '..', 'src', 'game', 'ai.ts');
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const CS_DIFF_TS = path.join(__dirname, '..', 'src', 'game', 'city-state-difficulty.ts');

const aiSrcRaw = fs.readFileSync(AI_TS, 'utf8');
const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');
const csDiffSrcRaw = fs.readFileSync(CS_DIFF_TS, 'utf8');

/** Usuwa komentarze `// ...` (do końca linii) -- bez tego regex "widzi" kod zakomentowany
 *  jako żywy i mutant (np. zakomentowana linia wiringu w main.ts) przeżywa bramkę bez
 *  czerwieni. Wzorowane na elimination-toast-merge-test.cjs (ta sama technika, ten sam
 *  kompromis: naiwne cięcie po pierwszym "//" w linii -- bezpieczne tu, bo ani ai.ts, ani
 *  main.ts, ani city-state-difficulty.ts nie mają "//" w realnym kodzie (URLe itp. --
 *  zweryfikowane grepem "://": main.ts ma jedno wystąpienie i to już WEWNĄTRZ komentarza
 *  blokowego (JSDoc), ai.ts i city-state-difficulty.ts zero). / EN: same naive line-comment
 *  strip as elimination-toast-merge-test.cjs -- safe here, verified no "://" inside real code
 *  in any of the three source files. */
function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

const aiSrc = stripLineComments(aiSrcRaw);
const mainSrc = stripLineComments(mainSrcRaw);
const csDiffSrc = stripLineComments(csDiffSrcRaw);

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) {
    pass++;
    console.log('  PASS: ' + label);
  } else {
    fail++;
    console.error('  FAIL: ' + label + (detail ? ' -- ' + detail : ''));
  }
}

console.log('========================================================================');
console.log('cs-military-cap-wiring-test -- bramka tekstowa ai.ts + main.ts (+ runtime sekcja 4)');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. ai.ts: cityStateMilitaryProductionCap wołane z opts.cityStateDifficultyVsPlayer,
//    NIE z opts.menuDifficulty (stara oś gry).
// ---------------------------------------------------------------------------
console.log('1. ai.ts: chooseCityProduction woła cap z NOWEJ osi (cityStateDifficultyVsPlayer)');

check(
  "opts.cityStateDifficultyVsPlayer !== undefined jest strażnikiem WEJŚCIA do bloku capu "
    + "(zastępuje stary opts.menuDifficulty !== undefined)",
  /if \(opts\.defensiveCopy && opts\.cityStateDifficultyVsPlayer !== undefined\) \{/.test(aiSrc),
);

check(
  "cityStateMilitaryProductionCap(...) wołane z opts.cityStateDifficultyVsPlayer",
  /const milCap = cityStateMilitaryProductionCap\(opts\.cityStateDifficultyVsPlayer\);/.test(aiSrc),
);

check(
  "opts.menuDifficulty NIE jest już czytane w bloku capu wojska MP "
    + "(gdyby ktoś po cichu cofnął przepięcie na starą oś, ten regex by to złapał)",
  !/cityStateMilitaryProductionCap\(opts\.menuDifficulty\)/.test(aiSrc),
);

check(
  "AITurnOpts deklaruje pole cityStateDifficultyVsPlayer?: DifficultyLevel",
  /cityStateDifficultyVsPlayer\?: DifficultyLevel;/.test(aiSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// 2. main.ts: opts literal dla AI (w tym PM/defensiveCopy) zasila cityStateDifficultyVsPlayer
//    z `_menuCityStateDifficultyVsPlayer` (NOWA oś), nie z `_menuDifficulty` (STARA oś).
//    Regex woła na źródle BEZ komentarzy (stripLineComments) -- mutant "zakomentuj tę linię"
//    dziś czerwieni tę bramkę zamiast po cichu przechodzić.
// ---------------------------------------------------------------------------
console.log('2. main.ts: opts literal AI ustawia cityStateDifficultyVsPlayer z NOWEJ zmiennej');

check(
  "main.ts zawiera 'cityStateDifficultyVsPlayer: _menuCityStateDifficultyVsPlayer,' "
    + "w literale opts przekazywanym do chooseCityProduction (przez decideAITurn), "
    + "jako ŻYWY kod (nie w komentarzu)",
  /cityStateDifficultyVsPlayer: _menuCityStateDifficultyVsPlayer,/.test(mainSrc),
);

check(
  "main.ts NIE ustawia cityStateDifficultyVsPlayer ze starej zmiennej _menuDifficulty "
    + "(regres byłby: przepięcie pola bez przepięcia źródła)",
  !/cityStateDifficultyVsPlayer:\s*_menuDifficulty,/.test(mainSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// 3. Spójność: cap('hard') w city-state-difficulty.ts to FAKTYCZNA RELACJA
//    CS_WAVE_ATTACK_MIN_STACK + RESUP_TIERS['strong'].minGuard (obie stałe odczytane
//    z ai.ts, nie przepisane na sztywno) -- to próg, który realnie testuje bramka
//    wyjścia z domu (planCityStateOffensiveMove), NIE sam CS_WAVE_ATTACK_MIN_STACK.
// ---------------------------------------------------------------------------
console.log("3. city-state-difficulty.ts: cap('hard') === CS_WAVE_ATTACK_MIN_STACK + RESUP_TIERS['strong'].minGuard");

const capFnMatch = csDiffSrc.match(
  /export function cityStateMilitaryProductionCap\([\s\S]*?\n\}/,
);
check(
  "funkcja cityStateMilitaryProductionCap znaleziona w city-state-difficulty.ts",
  capFnMatch !== null,
);
const capFnBody = capFnMatch ? capFnMatch[0] : '';

const capHardMatch = capFnBody.match(/case 'hard':\s*\n\s*return (\d+);/);
check(
  "case 'hard' zwraca liczbę (nie null/undefined)",
  capHardMatch !== null,
);
const capHardValue = capHardMatch ? Number(capHardMatch[1]) : null;

const waveStackMatch = aiSrc.match(/export const CS_WAVE_ATTACK_MIN_STACK = (\d+);/);
check(
  "CS_WAVE_ATTACK_MIN_STACK znaleziony w ai.ts (minimalny stos ataku fali PM-hard, R-MP-HARD-WAVE Q2)",
  waveStackMatch !== null,
);
const waveStackValue = waveStackMatch ? Number(waveStackMatch[1]) : null;

// RESUP_TIERS['strong'].minGuard: odczyt bezpośrednio z definicji obiektu w ai.ts,
// nie z osobnej zmiennej -- struktura to `strong: { threatRadius: N, minGuard: N, maxPerTurn: N },`.
const strongTierMatch = aiSrc.match(
  /strong:\s*\{\s*threatRadius:\s*\d+,\s*minGuard:\s*(\d+),\s*maxPerTurn:\s*\d+\s*\}/,
);
check(
  "RESUP_TIERS.strong.minGuard znaleziony w ai.ts (próg posiłku, tier 'strong')",
  strongTierMatch !== null,
);
const strongMinGuardValue = strongTierMatch ? Number(strongTierMatch[1]) : null;

const expectedCapHard = waveStackValue !== null && strongMinGuardValue !== null
  ? waveStackValue + strongMinGuardValue
  : null;

// R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1 (2026-09-03): relacja rozluźniona z równości NA
// "co najmniej" -- właściciel podniósł cap('hard') 4→7, żeby zmieścić RÓWNOCZEŚNIE docelowy
// garnizon wczesnej fazy (CS_EARLY_GARRISON_TARGET['hard']=3, ai.ts) i próg bramki wyjścia
// z domu (4). Realny wymóg zawsze był ">= suma" (patrz komentarz w city-state-difficulty.ts:
// "cap musi pozwolić PM zgromadzić PRZYNAJMNIEJ tę sumę") -- sztywna równość była tylko
// najciaśniejszą wartością spełniającą go w rundzie 3, nie samym wymogiem. Mutant, przed
// którym ta bramka chroni (cap poniżej progu wyjścia z domu -> fala nigdy nie wyruszy),
// jest wciąż łapany: capHardValue < expectedCapHard nadal czerwieni tę bramkę.
check(
  "cap('hard') >= CS_WAVE_ATTACK_MIN_STACK + RESUP_TIERS['strong'].minGuard -- to FAKTYCZNY "
    + "próg bramki wyjścia z domu (totalMilitary < minFieldArmyBeforeSend + minGuardToSend, "
    + "ai.ts ok. linii 2820/2563), nie sam rozmiar stosu do wave-attacku; cap musi pozwolić PM "
    + "zgromadzić PRZYNAJMNIEJ tę sumę, inaczej mechanizm ofensywy zbierze stos, ale bramka "
    + "wyjścia i tak go zatrzyma w mieście (dokładnie regresja rundy 2, Evaluator 7e753db2)",
  capHardValue !== null && expectedCapHard !== null && capHardValue >= expectedCapHard,
  `cap('hard')=${capHardValue}, CS_WAVE_ATTACK_MIN_STACK=${waveStackValue}, `
    + `RESUP_TIERS.strong.minGuard=${strongMinGuardValue}, próg minimalny=${expectedCapHard}`,
);

console.log('');

// ---------------------------------------------------------------------------
// 4. RUNTIME: chooseCityProduction faktycznie wykonane (przez esbuild, wzorem
//    ai-mp-military-cap-test.cjs) z opts.cityStateDifficultyVsPlayer=undefined --
//    łapie SKUTEK wiring-mutanta (main.ts przestaje ustawiać pole), nie tylko brak
//    stringa w źródle. Regresja: gdy pole jest undefined, blok capu w ai.ts
//    (`if (opts.defensiveCopy && opts.cityStateDifficultyVsPlayer !== undefined)`)
//    jest CAŁKOWICIE pomijany -- PM traci cały limit wojska (rekrutuje bez ograniczeń),
//    nie tylko "cap wraca do starej wartości".
// ---------------------------------------------------------------------------
console.log('4. RUNTIME: chooseCityProduction -- opts.cityStateDifficultyVsPlayer=undefined traci cap');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.cs-military-cap-wiring-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.cs-military-cap-wiring-bundle.cjs');

const ENTRY_TS = `
export { chooseCityProduction, loadDifficultyParams } from ${JSON.stringify(AI_SRC + '/game/ai')};
`;
fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY_FILE],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE_FILE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

const { chooseCityProduction, loadDifficultyParams } = require(BUNDLE_FILE);

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        q, r, terenBazowy: 'Równina', nakladka: 0,
        rzeka: { obecna: false }, droga: { obecna: false },
      };
    }
  }
  return { width: w, height: h, hexes };
}
function makeCity(id, ownerId, q, r) {
  return { id, ownerId, q, r, name: id, population: 3 };
}
function makeUnit(id, ownerId, q, r, typeId) {
  return {
    id, ownerId, q, r, typeId,
    category: typeId === 'Zwiadowca' ? 'zwiadowca' : 'miecznik',
    hp: 10, ruchLeft: 2, ruchMax: 2,
  };
}
function makeGameData() {
  return {
    buildings: [
      { id: 'mury', nazwa: 'Mury' },
      { id: 'spichlerz', nazwa: 'Spichlerz' },
      { id: 'studnia', nazwa: 'Studnia' },
      { id: 'koszary', nazwa: 'Koszary' },
    ],
    units: [],
    terrainYields: { terrain_types: [{ Teren: 'Równina', Zywnosc: 2, Praca: 1 }] },
    aiParams: {},
  };
}

const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const map4 = makeMap(10, 10);
const data4 = makeGameData();
const diff4 = loadDifficultyParams(data4, 2);

// Scenariusz T6-podobny (ai-mp-military-cap-test.cjs): PM pod zagrożeniem, infra w pełni
// zbudowana (scoring naturalnie preferuje wojsko pod threat), własne wojsko DOKŁADNIE na
// dzisiejszym capie('hard')=7 (R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1, 2026-09-03 -- dawniej
// 4) -- 7 własnych jednostek bojowych.
const city4 = makeCity('cs_wire', 4, 5, 5);
const enemy4 = makeUnit('en', 0, 6, 5, 'Wojownik');
const own4 = [
  makeUnit('w1', 4, 5, 5, 'Wojownik'),
  makeUnit('w2', 4, 4, 5, 'Łucznik'),
  makeUnit('w3', 4, 5, 4, 'Wojownik'),
  makeUnit('w4', 4, 4, 4, 'Łucznik'),
  makeUnit('w5', 4, 5, 6, 'Wojownik'),
  makeUnit('w6', 4, 6, 4, 'Łucznik'),
  makeUnit('w7', 4, 4, 6, 'Wojownik'),
];
const built4 = ['mury', 'koszary', 'spichlerz', 'studnia', 'garncarnia', 'stolarnia', 'targowisko'];
const units4 = [enemy4, ...own4];

const pickCapped = chooseCityProduction(
  'cs_wire', [city4], units4, 4, data4, ZERO,
  { defensiveCopy: true, cityStateDifficultyVsPlayer: 'hard', cityBuildings: { cs_wire: built4 } },
  map4, diff4,
);
const pickUnwired = chooseCityProduction(
  'cs_wire', [city4], units4, 4, data4, ZERO,
  // Symulacja mutanta 2a w runtime: pole POMINIĘTE (undefined), jak gdyby main.ts przestało
  // je ustawiać -- defensiveCopy nadal true (PM), ale bez osi trudności.
  { defensiveCopy: true, cityBuildings: { cs_wire: built4 } },
  map4, diff4,
);
const isMilitaryPick = (p) => p === 'Wojownik' || p === 'Łucznik';

check(
  "z opts.cityStateDifficultyVsPlayer='hard' (7 własnych jednostek === cap 7) cap BLOKUJE "
    + "produkcję wojska (bramka działa)",
  !isMilitaryPick(pickCapped),
  `pickCapped=${JSON.stringify(pickCapped)}`,
);
check(
  "z opts.cityStateDifficultyVsPlayer=undefined (symulacja mutanta 2a) cap znika CAŁKOWICIE -- "
    + "ta sama sytuacja (7/7 jednostek) znów pozwala na wojsko, bo blok capu w ai.ts jest "
    + "pomijany przy undefined (dowód runtime-skutku wiring-mutanta, nie tylko braku stringa)",
  isMilitaryPick(pickUnwired),
  `pickUnwired=${JSON.stringify(pickUnwired)}`,
);

try { fs.unlinkSync(ENTRY_FILE); } catch { /* best effort cleanup */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch { /* best effort cleanup */ }

console.log('');

console.log('========================================================================');
console.log('WYNIK: ' + pass + ' PASS, ' + fail + ' FAIL');
console.log('========================================================================');
if (fail > 0) process.exit(1);
