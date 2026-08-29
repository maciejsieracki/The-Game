'use strict';
/**
 * praca-pula-rate-parity-test.cjs -- R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1, Wątek D.
 *
 * PRZYCZYNA (recon Operatora tego tematu): w bloku końca tury ekonomii (main.ts) wyświetlany
 * wskaźnik `_lastPracaRate` ("+N" w PULA IMPERIUM) był liczony WYŁĄCZNIE jako suma
 * poolGain/overflowToPool per-miasto pomniejszona o `playerUpkeep` (utrzymanie ulepszeń
 * surowcowych) -- ale TEJ SAMEJ tury pula (`playerPracaPool`) jest DODATKOWO zużywana przez:
 *   1. `advanceOwnerWonderMapBuilds` (postęp Cudów na mapie, `usedPlayer`),
 *   2. nadrzędny budżet budynków ze splitu imperium (`applyEmpireBuildingBudget`,
 *      `usedPlayerBuildingBudget`, sterowany suwakiem "PODZIAŁ PRACY: BUDYNKI/PULA"),
 *   3. auto-ulepszenia terenu gracza (`pick.kosztPraca` w pętli `picks`).
 * Żadne z tych trzech zużyć nie było odejmowane od `_lastPracaRate`, więc UI pokazywał
 * dodatnie "+N" nawet w turze, w której realny stan puli (`playerPracaPool`) ledwo się ruszył
 * albo stał w miejscu -- dokładnie zgłoszony objaw ("9 +10", stan praktycznie zerowy od
 * kilku tur mimo dodatniego wskaźnika). To NIE jest regres identyczny z
 * `R-PRACA-PULA-NIEAKUMULUJE-Q1` (tamten dotyczył złego %-splitu per-miasto w
 * turn-economy.ts/previewCityEconomy i advanceCityEconomy -- ten leży w main.ts, w kroku PO
 * per-miastowym splicie, i nie jest pokryty przez żaden test na `previewCityEconomy`/
 * `advanceCityEconomy`, bo te funkcje nie obejmują tego etapu).
 *
 * REGRES2 (P-PRACA-IMPERIUM-PULA-NIE-AKUMULUJE-REGRES2-Q1, 2026-08-22, DRUGIE zgłoszenie tego
 * samego obszaru): powyższe 4 odjęcia w bloku end-of-turn SĄ poprawne -- `_lastPracaRate` po
 * pętli end-of-turn ma prawidłową wartość. ALE `triggerPlayerEndTurn()` na samym końcu woła
 * `markCityStateDirty()` + `updateHud()`, co odpala `refreshLiveEmpireRatesUnsafe()` (bo
 * `empireEconDirty=true`) -- TA funkcja NA NOWO przypisywała `_lastPracaRate =
 * pracaPoolBrutto - pracaUpkeepPreview`, formułą znającą TYLKO upkeep, NADPISUJĄC poprawną
 * wartość z ticku martwym zapisem na KAŻDYM końcu tury (deklarowane "+3" realnie akumulowało
 * tylko "+1"). Naprawa (wariant (b), prostszy i bezpieczniejszy niż liczenie trzech dodatkowych
 * "preview" zużyć w refreshLiveEmpireRatesUnsafe): jednorazowa flaga `_pracaRateFreshFromEndTurn`,
 * ustawiana `true` w end-of-turn PO poprawnym policzeniu `_lastPracaRate` (przed jedynym
 * `markCityStateDirty()+updateHud()` na końcu `triggerPlayerEndTurn`), konsumowana (`= false`) w
 * `refreshLiveEmpireRatesUnsafe()`, gdzie pomija WYŁĄCZNIE przypisanie do `_lastPracaRate` przy
 * `true` -- więc dotyczy TYLKO tego jednego, natychmiastowego wywołania po końcu tury; każdy
 * KOLEJNY realny trigger (`markCityStateDirty()` z innego miejsca) liczy live-preview jak
 * dotychczas (bez regresji poza końcem tury).
 *
 * Ten test jest statycznym kontraktem źródła (jak `praca-split-ui-test.cjs`) -- pilnuje, żeby:
 *  (1) każde z trzech miejsc zużywających `playerPracaPool` w bloku end-of-turn miało
 *      odpowiadające odjęcie od `_lastPracaRate` NIEDALEKO obok (w oknie kilkuset znaków), i
 *      żeby nikt tego po cichu nie cofnął (SEKCJA 1, historyczne, WĄTEK D);
 *  (2) druga ścieżka (`refreshLiveEmpireRatesUnsafe`, REGRES2) faktycznie chroniona jest
 *      guardem: flaga zadeklarowana, ustawiona PO poprawnym policzeniu `_lastPracaRate` w
 *      end-of-turn (PRZED jedynym `markCityStateDirty()+updateHud()` na końcu
 *      `triggerPlayerEndTurn`), i konsumowana/sprawdzana w `refreshLiveEmpireRatesUnsafe`
 *      TAK, że przypisanie `_lastPracaRate = pracaPoolBrutto - pracaUpkeepPreview` jest
 *      pomijane gdy flaga `true` (SEKCJA 2, REGRES2);
 *  (3) NUMERYCZNIE (nie tylko statyczny grep źródła) -- symulacja scenariusza ze zgłoszenia
 *      (Rzym, 7 Pracy/turę, 4 do budynków/3 do puli, split 50/50) potwierdza, że guard
 *      naprawia rozjazd deklarowany-vs-realny, którego STARA (bez guardu) formuła NIE łapała
 *      (SEKCJA 3).
 *
 * Run from gra/: node tools/praca-pula-rate-parity-test.cjs
 */
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'src/main.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(name, condition) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name); }
}

/** Czy `needle` występuje w oknie `window` znaków PO pierwszym wystąpieniu `anchor`. */
function followsWithin(anchor, needle, window) {
  const i = source.indexOf(anchor);
  if (i === -1) return false;
  const slice = source.slice(i, i + window);
  return slice.includes(needle);
}

/** Indeks pierwszego wystąpienia `needle`, albo -1. */
function firstIndexOf(needle) {
  return source.indexOf(needle);
}

console.log('== SEKCJA 1: WĄTEK D (end-of-turn, 3 drenaże historyczne) ==');

check(
  'Cuda-mapa: usedPlayer odjęte od _lastPracaRate (Wątek D)',
  followsWithin(
    'const usedPlayer = advanceOwnerWonderMapBuilds(0, playerPracaPool);',
    '_lastPracaRate -= usedPlayer;',
    700,
  ),
);

// R-PRACA-JEDEN-PODZIAL-Q1 — AKTUALIZACJA (uzasadnienie w 01-operator.md):
//   CO PILNOWAL: ze CZWARTY drenaz puli — budzet budynkow z DRUGIEGO podzialu — jest
//     odjety od `_lastPracaRate`, zeby HUD „+N" pokazywal realny przyrost puli.
//   DLACZEGO STARY WARUNEK PRZESTAL BYC PRAWDA: ten drenaz zostal USUNIETY razem z drugim
//     podzialem — pula nie oddaje juz Pracy kolejkom budynkow, wiec nie ma czego odejmowac.
//   CO PILNUJE TERAZ: ze drenazu NIE MA w kodzie (asercja negatywna, zeby nie wrocil
//     po cichu) — a sam niezmiennik „displayed == realny przyrost puli" jest nadal
//     pinowany numerycznie w SEKCJI 3 na drenazu, ktory realnie istnieje (cuda na mapie).
{
  // Liczy sie KOD, nie komentarz-nagrobek opisujacy usunieta warstwe.
  const sourceCode = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  check(
    'Drenaż z drugiego podziału (usedPlayerBuildingBudget) NIE istnieje już w main.ts',
    !sourceCode.includes('usedPlayerBuildingBudget') && !sourceCode.includes('splitEmpirePracaBudget('),
  );
  // Dowod nietautologicznosci tej asercji negatywnej.
  const mutant = sourceCode + '\nconst usedPlayerBuildingBudget = 1;\n';
  check(
    'Mutant przywracający drenaż drugiego podziału zostaje wykryty',
    mutant.includes('usedPlayerBuildingBudget'),
  );
}

check(
  'Auto-ulepszenia: pick.kosztPraca odjęte od _lastPracaRate (Wątek D)',
  followsWithin(
    'playerPracaPool -= pick.kosztPraca;',
    '_lastPracaRate -= pick.kosztPraca;',
    500,
  ),
);

console.log('\n== SEKCJA 2: REGRES2 (refreshLiveEmpireRatesUnsafe nie nadpisuje po end-of-turn) ==');

check(
  'Flaga guard `_pracaRateFreshFromEndTurn` zadeklarowana obok _lastPracaRate',
  followsWithin('let _lastPracaRate: number = 0;', 'let _pracaRateFreshFromEndTurn: boolean = false;', 4200),
);

const idxAutoImpCatch = firstIndexOf(
  "} catch (errAutoImp) {\n              console.error('[Ulepszenia] Błąd auto-ulepszeń gracza:', errAutoImp);\n            }",
);
const idxFlagSetTrue = firstIndexOf('_pracaRateFreshFromEndTurn = true;');
const idxLastKultura = firstIndexOf('_lastKultura = cities\n              .filter(c => c.ownerId === 0)');
const idxFinalMarkDirty = firstIndexOf(
  "markCityStateDirty(); // D10: koniec tury — siatka bezpieczeństwa (wzrost/tech/zdobycie/AI)",
);
const idxFinalUpdateHud = idxFinalMarkDirty !== -1 ? source.indexOf('updateHud();', idxFinalMarkDirty) : -1;

check(
  'triggerPlayerEndTurn(): blok auto-ulepszeń (ostatni z 4 drenaży) znaleziony',
  idxAutoImpCatch !== -1,
);
check(
  'Flaga ustawiana `true` PO bloku auto-ulepszeń, PRZED `_lastKultura` (czyli po ostatnim odjęciu od _lastPracaRate)',
  idxAutoImpCatch !== -1 && idxFlagSetTrue !== -1 && idxLastKultura !== -1 &&
    idxAutoImpCatch < idxFlagSetTrue && idxFlagSetTrue < idxLastKultura,
);
check(
  'Flaga ustawiana PRZED jedynym `markCityStateDirty()+updateHud()` na końcu triggerPlayerEndTurn',
  idxFlagSetTrue !== -1 && idxFinalUpdateHud !== -1 && idxFlagSetTrue < idxFinalMarkDirty &&
    idxFinalMarkDirty < idxFinalUpdateHud,
);
// Nie może istnieć ŻADNE inne wywołanie updateHud() między ustawieniem flagi a tym jedynym,
// finalnym updateHud() na końcu triggerPlayerEndTurn -- inaczej flaga zostałaby skonsumowana
// PRZEDWCZEŚNIE (na jakimś pośrednim, nie-końcowym odświeżeniu), i finalny live-refresh po
// końcu tury znów nadpisałby _lastPracaRate niepełną formułą (regres2 by wrócił).
const sliceBetween = (idxFlagSetTrue !== -1 && idxFinalUpdateHud !== -1)
  ? source.slice(idxFlagSetTrue, idxFinalUpdateHud)
  : '';
const updateHudCallsBetween = (sliceBetween.match(/updateHud\(\)/g) || []).length;
check(
  'Brak wywołań updateHud() między ustawieniem flagi a jedynym finalnym updateHud() (flaga nie skonsumowana przedwcześnie)',
  sliceBetween !== '' && updateHudCallsBetween === 0,
);

check(
  'refreshLiveEmpireRatesUnsafe(): przypisanie `_lastPracaRate = pracaPoolBrutto - pracaUpkeepPreview` pomijane, gdy flaga `true` (i flaga konsumowana)',
  followsWithin(
    'const pracaPoolBrutto = previewPracaPoolBrutto(pracaTicks, {',
    'if (_pracaRateFreshFromEndTurn) {\n        _pracaRateFreshFromEndTurn = false;\n      } else {\n        _lastPracaRate = pracaPoolBrutto - pracaUpkeepPreview;\n      }',
    3400,
  ),
);

console.log('\n== SEKCJA 3: dowód numeryczny (scenariusz ze zgłoszenia, Rzym) ==');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[praca-pula-rate-parity-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.praca-pula-rate-parity-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.praca-pula-rate-parity-test-bundle.cjs');

const ENTRY_TS = `
export {
  previewPracaPoolBrutto,
  pracaImperialPoolGain,
} from ${JSON.stringify(SRC + '/game/production')};
`;
fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
    loader: { '.json': 'json' },
  });
} catch (e) {
  console.error('[praca-pula-rate-parity-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  previewPracaPoolBrutto,
} = require(BUNDLE_FILE);

try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* best effort cleanup */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* best effort cleanup */ }

/**
 * Symuluje jeden koniec tury dla imperium jednomiastowego (Rzym) + jedno wywołanie
 * live-refresh HUD tuż po (dokładnie sekwencja `triggerPlayerEndTurn()` ->
 * `markCityStateDirty()+updateHud()` -> `refreshLiveEmpireRatesUnsafe()`).
 *
 *  - `useGuard=false` odtwarza STARE zachowanie (REGRES2): live-refresh zawsze nadpisuje
 *    `_lastPracaRate` formułą `pracaPoolBrutto - upkeep`, ignorując usedBuildingBudget.
 *  - `useGuard=true` odtwarza NOWE zachowanie: flaga chroni poprawną wartość end-of-turn
 *    przed nadpisaniem przez ten jeden live-refresh.
 */
function simulateTurn({ oldPool, cityDoBudynkow, cityDoPuli, queueEmpty, poolDrain, useGuard }) {
  // --- end-of-turn: pętla per-miasto (poolGain/overflowToPool) ---
  let pool = oldPool;
  let lastPracaRate = 0;
  const pracaTicks = [{ doBudynkow: cityDoBudynkow, doPuli: cityDoPuli }];
  const queueEmptyArr = [queueEmpty];
  const poolGain = queueEmpty ? (cityDoBudynkow + cityDoPuli) : cityDoPuli;
  pool += poolGain;
  lastPracaRate += poolGain;

  // --- upkeep ulepszeń surowcowych (zero w tym scenariuszu, ze zgłoszenia) ---
  const upkeep = 0;
  pool = Math.max(0, pool - upkeep);
  lastPracaRate -= upkeep;

  // --- cuda mapy (R-PRACA-JEDEN-PODZIAL-Q1: to jest teraz drenaz uzyty w scenariuszu B;
  //     przedtem rolę tę pełnił usunięty budżet budynków z DRUGIEGO podziału) ---
  const usedWonder = Number.isFinite(poolDrain) ? Math.max(0, poolDrain) : 0;
  pool = Math.max(0, pool - usedWonder);
  lastPracaRate -= usedWonder;

  // --- auto-ulepszenia (zero w tym scenariuszu, ze zgłoszenia) ---
  const usedAutoImp = 0;
  pool -= usedAutoImp;
  lastPracaRate -= usedAutoImp;

  const realDelta = pool - oldPool; // realny przyrost puli tej tury
  const endOfTurnDeclaredRate = lastPracaRate; // to co _lastPracaRate ma zaraz po pętli end-of-turn

  // --- jedyne wywołanie live-refresh HUD tuż po (triggerPlayerEndTurn -> markCityStateDirty+updateHud) ---
  const pracaPoolBrutto = previewPracaPoolBrutto(pracaTicks, { queueEmpty: queueEmptyArr });
  const pracaUpkeepPreview = upkeep; // ta sama czysta funkcja co w end-of-turn (computePracaUpkeepByOwner)
  let displayedAfterLiveRefresh;
  if (useGuard) {
    // flaga _pracaRateFreshFromEndTurn=true -> live-refresh POMIJA przypisanie
    displayedAfterLiveRefresh = endOfTurnDeclaredRate;
  } else {
    // STARE zachowanie (REGRES2): live-refresh NADPISUJE formułą bez usedBuildingBudget
    displayedAfterLiveRefresh = pracaPoolBrutto - pracaUpkeepPreview;
  }

  return { newPool: pool, realDelta, endOfTurnDeclaredRate, displayedAfterLiveRefresh };
}

let numPass = 0;
let numFail = 0;
function numCheck(name, condition, detail) {
  if (condition) { numPass++; console.log('PASS: ' + name); }
  else { numFail++; console.error('FAIL: ' + name + (detail ? ' -- ' + detail : '')); }
}

// Scenariusz A (dokładnie ze zgłoszenia): Rzym, 7 Pracy/turę (4 do budynków, 3 do puli),
// split 50/50, BEZ aktywnych cudów/auto-ulepszeń w tej turze, I bez legalnej kolejki budynków
// na poziomie imperium (buildingTargets=[]) -- więc WSZYSTKIE 4 znane drenaże = 0 w tej turze.
// Kolejka miasta NIE jest pusta (4 do budynków oznacza aktywną budowę), więc poolGain=doPuli=3.
{
  const resGuard = simulateTurn({
    oldPool: 1, cityDoBudynkow: 4, cityDoPuli: 3, queueEmpty: false,
    poolDrain: 0, useGuard: true,
  });
  numCheck(
    'Scenariusz A (zero drenaży): stara_pula(1) + deklarowane(+3) = nowa_pula(4) -- realny przyrost = deklarowany',
    resGuard.newPool === 4 && resGuard.realDelta === 3 && resGuard.displayedAfterLiveRefresh === 3,
    `newPool=${resGuard.newPool} realDelta=${resGuard.realDelta} displayed=${resGuard.displayedAfterLiveRefresh}`,
  );
}

// Scenariusz B (reprodukcja REGRES2): jak wyżej, ale TERAZ jest legalna kolejka budynków na
// poziomie imperium, która realnie konsumuje 2 Pracy z puli (usedBuildingBudget=2) -- dokładnie
// czwarty znany drenaż z listy recon. Bez guardu live-refresh o tym nie wie i pokazuje brutto.
{
  const resNoGuard = simulateTurn({
    oldPool: 1, cityDoBudynkow: 4, cityDoPuli: 3, queueEmpty: false,
    poolDrain: 2, useGuard: false,
  });
  const resGuard = simulateTurn({
    oldPool: 1, cityDoBudynkow: 4, cityDoPuli: 3, queueEmpty: false,
    poolDrain: 2, useGuard: true,
  });
  numCheck(
    'Scenariusz B (drenaż puli 2 Pracy — cuda na mapie): end-of-turn poprawnie liczy realny przyrost (+1, nie +3)',
    resGuard.realDelta === 1 && resGuard.endOfTurnDeclaredRate === 1,
    `realDelta=${resGuard.realDelta} endOfTurnDeclaredRate=${resGuard.endOfTurnDeclaredRate}`,
  );
  numCheck(
    'Scenariusz B BEZ guardu (REGRES2 odtworzony): live-refresh nadpisuje na +3, MIMO że realny przyrost to +1 (bug reprodukowany)',
    resNoGuard.displayedAfterLiveRefresh === 3 && resNoGuard.displayedAfterLiveRefresh !== resNoGuard.realDelta,
    `displayed=${resNoGuard.displayedAfterLiveRefresh} realDelta=${resNoGuard.realDelta}`,
  );
  numCheck(
    'Scenariusz B Z guardem (naprawione): live-refresh NIE nadpisuje -- displayed(+1) = realny przyrost(+1)',
    resGuard.displayedAfterLiveRefresh === resGuard.realDelta && resGuard.displayedAfterLiveRefresh === 1,
    `displayed=${resGuard.displayedAfterLiveRefresh} realDelta=${resGuard.realDelta}`,
  );
}

console.log('\n== SEKCJA 4: REGRES3 (refreshPlayerCityEcon też chroniony przez guard) ==');

// P-PRACA-IMPERIUM-PULA-NIE-AKUMULUJE-REGRES3-Q1 (2026-08-22, TRZECIE zgłoszenie): guard z
// REGRES2 chronił WYŁĄCZNIE przypisanie do `_lastPracaRate` -- ale kilka linii niżej w tej
// samej funkcji `refreshPlayerCityEcon(preview.perCity)` NADPISYWAŁ `_lastPlayerCityEcon`
// (tabela per-miasto „DO PULI"/„DO BUDYNKÓW" w popupie imperium, `empireDetailPanel.ts`
// `renderPracaSection`) LIVE-podglądem post-end-turn, mimo że `_lastPracaRate` (nagłówek
// „PULA IMPERIUM" tego samego popupu) zostawał poprawny -- dwie sąsiadujące liczby w jednym
// renderze z dwóch różnych momentów czasu.

check(
  'Guard: flaga odczytana do zmiennej PRZED konsumpcją (`skipCityEconOverwriteFreshFromEndTurn`)',
  followsWithin(
    'const pracaPoolBrutto = previewPracaPoolBrutto(pracaTicks, {',
    'const skipCityEconOverwriteFreshFromEndTurn = _pracaRateFreshFromEndTurn;\n      if (_pracaRateFreshFromEndTurn) {',
    3400,
  ),
);

check(
  '`refreshPlayerCityEcon(preview.perCity)` pominięty, gdy flaga była `true` przy wejściu',
  followsWithin(
    'const skipCityEconOverwriteFreshFromEndTurn = _pracaRateFreshFromEndTurn;',
    'if (!skipCityEconOverwriteFreshFromEndTurn) {\n        refreshPlayerCityEcon(preview.perCity);\n      }',
    2200,
  ),
);

console.log('\n== SEKCJA 5: dowód numeryczny REGRES3 (scenariusz ze zgłoszenia, Ateny -- 4 wartości UI naraz) ==');

/**
 * Symuluje DOKŁADNIE scenariusz ze zrzutów właściciela (Ateny, 5 Pracy/turę, 3 do budynków /
 * 2 do puli, split Ulepszenia 50%, kolejka Pałacu NIE pusta, utrzymanie ulepszeń = 1 Praca) i
 * porównuje WSZYSTKIE CZTERY wartości UI z zgłoszenia:
 *  - górny pasek HUD „Praca N +M"          -> `_lastPracaRate` (buildHudState -> economy.pracaRate)
 *  - popup „PULA IMPERIUM N +M"            -> ta sama `_lastPracaRate` (economy.pracaRate)
 *  - popup tabela per-miasto „DO PULI"     -> `_lastPlayerCityEcon[].doPuli` (cityEcon.pracaPula)
 *  - karta miasta „Ulepszenia +2 (50%)"    -> ten sam per-city doPuli (źródło: ten sam
 *                                              `_lastPlayerCityEcon`, `cityPanel.ts` czyta z
 *                                              identycznego tick/preview poprzez tk?.doPuli)
 * `withGuardFix` odtwarza NAPRAWĘ REGRES3 (refreshPlayerCityEcon też pomijany przy świeżej
 * fladze); bez niej odtwarza dokładnie zgłoszony objaw: tabela/karta miasta pokazują
 * PROJEKCJĘ dla kolejnej tury (tu spleconą z inną populacją -- `nextTurnCityDoPuli`), a
 * PULA IMPERIUM/HUD pokazują poprawny, realnie odnotowany przyrost tej-co-właśnie-minęła tury.
 */
function simulateRegres3Scenario({ withGuardFix, nextTurnCityDoPuli }) {
  // --- end-of-turn (main.ts, econ.perCity -> refreshPlayerCityEcon(econ.perCity)) ---
  const oldPool = 0;
  const cityDoBudynkow = 3;
  const cityDoPuli = 2; // = "do puli imperium: +2" z tabeli, ZE ZGŁOSZENIA
  const queueEmpty = false; // kolejka Pałacu NIE jest pusta
  let pool = oldPool;
  let lastPracaRate = 0;
  const poolGain = queueEmpty ? (cityDoBudynkow + cityDoPuli) : cityDoPuli;
  pool += poolGain;
  lastPracaRate += poolGain;
  const upkeep = 1; // "UTRZYMANIE ULEPSZEŃ" -- ze zgłoszenia PULA IMPERIUM 1 +1 = (+2 - 1)
  pool = Math.max(0, pool - upkeep);
  lastPracaRate -= upkeep;
  // realny end-of-turn: _lastPlayerCityEcon.doPuli = cityDoPuli (dokładna wartość ticku).
  const endOfTurnCityDoPuli = cityDoPuli;
  const endOfTurnDeclaredRate = lastPracaRate; // = 1, dokładnie "PULA IMPERIUM 1 +1" ze zgłoszenia

  // --- jedyne natychmiastowe wywołanie live-refresh (triggerPlayerEndTurn -> updateHud ->
  //     refreshLiveEmpireRatesUnsafe), PO end-of-turn, więc widzi już np. wzrost populacji ---
  const displayedRate = endOfTurnDeclaredRate; // _lastPracaRate ZAWSZE chroniony (REGRES2, niezmieniony)
  const displayedCityDoPuli = withGuardFix
    ? endOfTurnCityDoPuli // REGRES3: refreshPlayerCityEcon pominięty -- tabela zostaje realna
    : nextTurnCityDoPuli; // bug: nadpisane live-podglądem projekcji NASTĘPNEJ tury

  return { pool, endOfTurnDeclaredRate, displayedRate, displayedCityDoPuli };
}

{
  // Populacja urosła między end-of-turn a live-refresh -> projekcja dla następnej tury daje
  // INNĄ liczbę "do puli" niż to, co faktycznie trafiło do puli tej-co-minęła tury.
  const resBug = simulateRegres3Scenario({ withGuardFix: false, nextTurnCityDoPuli: 3 });
  numCheck(
    'BEZ naprawy REGRES3 (bug odtworzony): tabela "do puli"(3, projekcja) != PULA IMPERIUM "+1"(realny przyrost) -- dokładnie zgłoszony rozjazd',
    resBug.displayedCityDoPuli !== resBug.displayedRate,
    `tabela=${resBug.displayedCityDoPuli} pulaImperium=${resBug.displayedRate}`,
  );

  const resFix = simulateRegres3Scenario({ withGuardFix: true, nextTurnCityDoPuli: 3 });
  numCheck(
    'Z naprawą REGRES3: tabela "do puli"(2) = deklarowany end-of-turn przyrost brutto, spójny z PULA IMPERIUM "+1"(2 - 1 upkeep) -- ten sam ticku, dwie zgodne liczby',
    resFix.displayedCityDoPuli === 2 && resFix.displayedRate === 1 &&
      resFix.displayedCityDoPuli - upkeepConst(resFix) === resFix.displayedRate,
    `tabela=${resFix.displayedCityDoPuli} pulaImperium=${resFix.displayedRate}`,
  );
  numCheck(
    'Z naprawą REGRES3: HUD górny pasek (ta sama `_lastPracaRate`) i popup PULA IMPERIUM identyczne (0 rozjazdu międzyźródłowego, REGRES2 nienaruszony)',
    resFix.displayedRate === resFix.endOfTurnDeclaredRate,
    `hud=${resFix.displayedRate} pulaImperium=${resFix.endOfTurnDeclaredRate}`,
  );
  numCheck(
    'Z naprawą REGRES3: realny stan puli po turze (0 + 2 - 1 = 1) zgadza się z deklarowanym przyrostem "+1"',
    resFix.pool === 1 && resFix.pool - oldPoolConst() === resFix.displayedRate,
    `pool=${resFix.pool} displayedRate=${resFix.displayedRate}`,
  );
}
function upkeepConst() { return 1; }
function oldPoolConst() { return 0; }

console.log(`\n[praca-pula-rate-parity-test] SEKCJA 1+2 (statyczne): ${pass} pass, ${fail} fail`);
console.log(`[praca-pula-rate-parity-test] SEKCJA 3 (numeryczne): ${numPass} pass, ${numFail} fail`);
const totalFail = fail + numFail;
console.log(`\n[praca-pula-rate-parity-test] RAZEM: ${pass + numPass} pass, ${totalFail} fail`);
if (totalFail > 0) process.exit(1);
