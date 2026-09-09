STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6F-PART2-DATA-Q1
GOAL: Warstwa DANYCH + GENERATORA (bez UI kreatora) dla drugiego heksu startowego
i drugiej cywilizacji człowieka — pierwszy z dwóch pod-tematów części (ii) Etapu 6f.

ZMIANY/COMMIT (worktree /home/user/wt-6f-part2-data, gałąź
autobot/R-HOTSEAT-ETAP6F-PART2-DATA-Q1, baza 2c1049b7 — commit lokalny w tym
worktree, NIE zintegrowany do main):
- `gra/src/ui/newGameFlow.ts`: `NewGameParams.civId2?`/`civName2?` (opcjonalne),
  moduł-var `selCiv2: string | null = null` (reset przy `showNewGameFlow`),
  `buildParams()` emituje `civId2/civName2` z `selCiv2` (dziś zawsze `undefined`
  — zero UI ustawia `selCiv2`). WYŁĄCZNIE te trzy elementy, zero DOM/ekranów.
- `gra/src/map/cluster-spawn.ts`: nowy `HumanDistanceMode` + `pickSecondHumanStartHex()`
  — mechanizm ABC-Q4 (blisko/daleko/losowo), seedowany `mulberry32`, reużywa
  istniejący filtr terenu (`landHexesFromMap`), respektuje próg dystansu
  przekazany przez wołającego (nie duplikuje `MIN_CITY_DISTANCE*`).
- `gra/src/game/cluster-start.ts`: `ClusterStartPlan.secondPlayerStartHex/
  secondPlayerOwnerId` (zawsze `null` bez `secondHumanCivId` — no-op dowiedziony);
  `BuildClusterStartInput.secondHumanCivId/humanDistanceMode/secondHumanOwnerId`;
  walidacja ABC-Q3 (rzuca gdy `secondHumanCivId === playerCivId`); `secondPlayerOwnerId`
  wyliczany jako pierwszy wolny numer PO wszystkich ownerId AI tego planu (zero
  kolizji z rosterem), chyba że wołający poda własny.
- `gra/src/main.ts`: `_menuCivIdByOwner`/`playerStartHexByOwner`/`playerCivTypeByHuman`/
  `playerCivBonusyByHuman` (per-owner, wzorem `playerStateByHuman`/`exploredByHuman`
  Etapu 1), zawsze zsynchronizowane z dotychczasowymi zmiennymi singularnymi dla
  `HUMAN_OWNER_PRIMARY`. `applyClusterStartPlan` przyjmuje `opts.secondHumanCivId/
  humanDistanceMode`, po planie rejestruje drugi fotel (humanSeats/playerStateByHuman/
  exploredByHuman/pracaPoolByHuman) WYŁĄCZNIE gdy plan zwrócił drugi heks. Naprawiony
  strażnik `ME() === HUMAN_OWNER_PRIMARY && playerStartHex !== null` w `currentVisible()`
  (fallback fog/widoczność startu) → `playerStartHexFor(ME())` — per-owner, nie tylko
  fotel podstawowy (dokładnie miejsce wskazane w dispatchu, main.ts komentarz
  9774-9779 historycznie). Dwa nowe haki testowe w `__hotSeatTestDebug`:
  `generateSecondHumanSeatForTest` (realne `applyClusterStartPlan` z drugą cywilizacją)
  i `buildClusterStartPlanForTest` (bezpośrednie wywołanie generatora, do testu
  wykluczenia duplikatu bez mutacji żywego stanu).
- NOWY: `gra/tools/hotseat-etap6f-part2-data-test.cjs` — headless, esbuild bundluje
  REALNE `buildClusterStartPlan`/`generateMap` z `src/` (nie reimplementacja, wzorzec
  `cluster-start-test.cjs`).

TESTY:
- `node tools/hotseat-etap6f-part2-data-test.cjs` → 21/21 PASS. Kluczowe dowody:
  no-op bit-w-bit bez `secondHumanCivId` (dwa wywołania identyczne, pola drugiego
  heksu/ownera zawsze `null`); z `secondHumanCivId` drugi heks REALNIE powstaje,
  różni się od heksu gracza 1, jest lądem, respektuje próg dystansu, ownerId bez
  kolizji z AI; ABC-Q3 rzuca na duplikat cywilizacji; ABC-Q4 — trzy tryby dają
  MIERZALNIE różne średnie dystanse na 8 seedach (blisko≈5.0, losowo≈15.8,
  daleko≈34.5, sekwencje różne, nie tylko średnia); determinizm seed+tryb.
- `node ./node_modules/typescript/bin/tsc --noEmit` → 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test
  33/33, unit-replace-test 13/13, combat-test 6/6 — zielone.
- Regresja: `hotseat-etap6f-start-migracja-test` 11/11, `hotseat-human-owners-test`
  29/29, `hotseat-etap5-no-leak-test` PASS (A+B, żywy Chromium) — wszystkie zielone,
  zero regresji Etapu 1/5/6f część (i).
- `cluster-start-test.cjs` (istniejąca bramka generatora klastrów, ~415 asercji,
  NIE jest na liście bramek referencyjnych R-PROC-AUTOBOT §6 ani na liście
  regresji tego dispatchu, ale konsumuje ten sam `buildClusterStartPlan`) —
  uruchomiona dwukrotnie do pełnego zakończenia: raz na bazowym commicie
  `2c1049b7` w osobnym, izolowanym `git worktree` (`/tmp/civ-base-check`, poza
  worktree z edycjami), raz na tym worktree z moimi zmianami. Wynik IDENTYCZNY:
  **396 passed / 19 failed w obu przebiegach, `diff` listy treści asercji FAIL
  między bazą a moimi zmianami PUSTY** (dosłownie te same 19 linii, w tej samej
  kolejności) — potwierdzone zero regresji. 19 czerwonych asercji (m.in.
  „zarezerwowany slot wzrostu w klastrze", „stolica gracza = Ateny", kilka
  wariantów progu „5 hex" przy hub-chain, „Duża: minDystansObcyOdGracza=16
  (got 18)") to pre-istniejąca, niezwiązana z tym tematem niestabilność tej
  bramki na commicie bazowym — nie mój problem do naprawy w tym temacie
  (allowlista i tak zakazuje zmian w `clusters.ts`, gdzie prawdopodobnie leży
  przyczyna).
- Dowód no-op Chromium (kilka pełnych tur single-player, PRZED/PO) — NIE
  wykonany osobno w tej rundzie: `hotseat-etap5-no-leak-test` (żywy Chromium,
  realny `startNewGame`+`foundPlayerStartCity`+kilka `endTurn()` w zakresie
  Etapu 5) już przechodzi bez regresji na tym samym kodzie main.ts, co jest
  praktycznym dowodem braku zmiany zachowania dla dzisiejszej ścieżki
  single-player (żadna z nowych gałęzi w `applyClusterStartPlan`/`currentVisible`
  nie aktywuje się bez `secondHumanCivId`). Dedykowana, nowa bramka Chromium
  wyłącznie pod ten temat nie została napisana — ograniczenie zakresu tej rundy,
  patrz BLOKADY.

BLOKADY (jawne, nie ukrywane):
1. Konsumenci `playerStartHex` z recon §1c poza jednym strażnikiem fog/widoczności
   (main.ts, `currentVisible()`) NIE zostały przepisane na per-owner w tej rundzie:
   kamera (`beginOnboardingFoundCity`), serializacja zapisu (`dumpState`/save),
   zakładanie pierwszego miasta (`tryFoundPlayerCityAt`/`foundPlayerStartCity`)
   nadal czytają wyłącznie singularny `playerStartHex` (=`HUMAN_OWNER_PRIMARY`).
   Świadoma decyzja zakresu tej rundy: żadna z tych ścieżek nie jest dziś
   osiągalna dla drugiego fotela (brak UI ustawiającego `civId2`/`selCiv2` — ten
   pod-temat go celowo nie dodaje), więc nie ma dziś przypadku, w którym dałyby
   błędny wynik; pełne domknięcie per-owner tych trzech miejsc wymaga decyzji,
   jak realny drugi fotel zakłada swoje PIERWSZE miasto (klik czy auto-found?),
   co jest pytaniem UI-warstwy — zgłaszam do rozstrzygnięcia razem z dispatchem
   `R-HOTSEAT-ETAP6F-PART2-UI-Q1`, nie zgaduję tutaj. `playerStartHexFor(ownerId)`
   (nowy helper) jest już gotowy do użycia przez tamten pod-temat bez dalszych
   zmian struktury danych.
2. `buildClusterSpawnPlan`/`computeClusters` (dispatch pkt 6, głębsza część)
   NIE zostały rozszerzone o listę cywilizacji-ludzi zamiast pojedynczego
   `playerCivId` — te funkcje (poza `cluster-spawn.ts` w zakresie "reguł
   dystansu/wykluczenia") pozostają jednoosobowe w środku; drugi heks jest
   dobudowany jako WARSTWA NAD generatorem AI (post-processing na
   `spawnPlan.playerStartHex`), nie wpięty w sam algorytm alokacji klastrów AI.
   Świadomy wybór: allowlista zakazuje dotykania reguł AI-vs-AI/AI-vs-gracz
   niezwiązanych z parą ludzi, a głębsza integracja wymagałaby zmian w
   `clusters.ts` (poza allowlistą). Jeśli Evaluator uzna to za niewystarczające
   wobec litery dispatchu pkt 6, zgłaszam jako możliwy Zarzut do obrony:
   funkcjonalnie kryterium sukcesu (realny drugi heks, wykluczenie duplikatu,
   trzy tryby dystansu, zero kolizji ownerId) jest spełnione, ale NIE przez
   rozszerzenie sygnatury `buildClusterSpawnPlan` per dispatch pkt 6 dosłownie.
(BLOKADA 3 z wcześniejszej wersji tego raportu — `cluster-start-test.cjs`
niedokończone porównanie z `main` — ZAMKNIĘTA w tej samej rundzie: pełny
przebieg na obu commitach zakończony, `diff` treści FAIL pusty, zero regresji.
Patrz TESTY wyżej.)

RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator (Sonnet 5, effort high) — weryfikacja
zakresu BLOKAD 1-2 (czy wymagają Zarzutu/naprawy w tej rundzie czy akceptacji
jako udokumentowane ograniczenie zakresu), świeżość linii, kompletność 7
struktur + 3 walidacji. Final Control → integracja orkiestratora. Po integracji:
dispatch `R-HOTSEAT-ETAP6F-PART2-UI-Q1`.
DEPLOY/PUSH: NIE WYKONANO
