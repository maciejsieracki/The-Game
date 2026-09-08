# R-HOTSEAT-ETAP6C-ECONOMY-Q1 — Operator runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6C-ECONOMY-Q1
GOAL: migracja 32 miejsc kategorii "ekonomia" na `isHuman(ownerId)`, blok bankowania
`runWorldEndTurn()`, decyzje `isPlayerOwner`/rebelia — patrz `00-dispatch.md`.

## ZMIANY

- `gra/src/game/turn-economy.ts`: `sumEconomyForPlayerCities` przyjmuje `ownerId=0`
  (domyślne, no-op) zamiast zaszytego literału.
- `gra/src/game/empire-food.ts`: `isCityAutoWyzywienieEnabled` i
  `maxSafePoziomRacjiForCity` przyjmują `humanOwnerIds`/opcję (domyślnie `[0]`).
- `gra/src/game/society-inputs.ts`: `isPlayerCapitalCity` przyjmuje `humanOwnerIds`
  (domyślnie `[0]`), filtr najstarszego miasta porównuje do właściciela `city`, nie do `0`.
- `gra/src/game/difficulty-cost.ts`: `isPlayerOwner` + 4 funkcje pochodne przyjmują
  `humanOwnerIds` (domyślnie `[0]`) — DECYZJA: pełne przełączenie WSZYSTKICH wołających
  (production.ts/cityPanel.ts, koszty budynków/jednostek/badań, próg wzrostu populacji)
  ODŁOŻONE — zbyt duży promień rażenia (balans gry) na jedną rundę bez osobnej
  weryfikacji. Literał `0` usunięty, no-op zachowany przez domyślny parametr.
- `gra/src/main.ts`: 22 core main.ts (Klastry A-F, w tym 5 duplikatów technologii
  scalonych do `ownerResearchedTechs`) + Klaster G (5 write-site'ów cache `_last*`,
  `popBeforeTick`/`playerCityCount`/`_lastWealth*`/`_lastKultura`x2, przełączone na
  `humanOwnerId`) + rebelia (`isHuman`, granica "tylko człowiek" zachowana, AI nadal bez
  mechaniki buntu) + `capitalCityIdForOwner(city.ownerId)` (naprawiona realna luka przy
  okazji `isPlayerCapitalCity`) + Klaster A (bank Skarbiec/Nauka/utrzymanie): PRZEPISANY
  na pętlę `for (const hOid of humanSeats.humanOwnerIds)`, zapis WPROST do
  `playerStateByHuman.get(hOid)` (bez podłogowania do 0, symetria z AI/R-DEFICYT-ZLOTA-
  KARA-Q1), cache HUD `_last*` aktualizowany wyłącznie dla `humanOwnerId`. Auto-research
  (`researchGateForOwner`) przełączony na `humanOwnerId`, ALE `researchStep`/toasty awansu
  epoki NADAL operują na singularnym `player` — jawnie DEFERRED (wymaga osobnej rundy
  UI per-fotel, poza zakresem literału).
- Nowy plik: `gra/tools/hotseat-etap6c-economy-noop-test.cjs` (68 asercji, importy realne
  + PRZED/PO), PASS.

## TESTY
- `tsc --noEmit`: 0 błędów (symlink `node_modules` z `/home/user/The-Game/gra` per C-029).
- `hotseat-etap6c-economy-noop-test.cjs`: 68 PASS, 0 FAIL.
- Referencyjne: `difficulty-cost-test` 22/22, `wealth-test` 36/36, `ai-major-economy-test`
  33/33, `ai-praca-podzial-tura1-seed-test` 9/9, `hotseat-etap3-akcesory-test` 64/64 —
  ZIELONE. `ai-praca-split-parity-test`: 1 FAIL (`procentPuliImperiumForOwner(0)` brak w
  main.ts) — POTWIERDZONE PRZED-ISTNIEJĄCE na bazowym commicie `302b6a96`
  (`git show HEAD:gra/src/main.ts` — funkcja bez call-site'u), NIE spowodowane tą rundą.
  `hotseat-etap4-noop-test`/`6a`/`6b`: uruchomione (realny `vite build` + headless Chromium,
  30 tur) — NIE ZAKOŃCZYŁY SIĘ w oknie czasowym tej rundy (>6 min, wciąż w toku w momencie
  zamknięcia raportu). Nie blokuję na nich zgłoszenia — testują niezmienioną ścieżkę
  single-human end-to-end (poza zakresem tej rundy poza HUD cache'ami już pokrytymi
  Klastrem G), ale WYNIK NIE POTWIERDZONY. Evaluator/Final Control: proszę ponowić lub
  poczekać na zakończenie przed PASS końcowym.

## BLOKADY / DECYZJE WYMAGAJĄCE POTWIERDZENIA EVALUATORA
1. `isPlayerOwner` (Klaster "difficulty-cost"): migracja SYGNATURY (parametr z
   domyślną wartością), BEZ przełączenia call-site'ów w production.ts/cityPanel.ts na
   realny `humanSeats.humanOwnerIds` — uzasadnienie: koszty budynków/jednostek/badań +
   próg wzrostu populacji, zbyt duży promień rażenia.
2. Auto-research/toasty awansu epoki (`player.era`, `setEra`, `showTechTreeView`) — dalej
   jednoosobowe, tylko literał `researchGateForOwner(0)→(humanOwnerId)` zmigrowany.
3. Rebelia main.ts:~30244: zmigrowana na `isHuman`, granica "tylko fotel człowieka"
   (nie AI) świadomie zachowana — potwierdzone brakiem `markCityRebellionStarted` dla AI.
4. Odkryta i naprawiona PRZY OKAZJI dodatkowa luka: ration-clamp (main.ts, „Q3=A") był
   zahardkodowany na `ownerId===0` — przełączony na pętlę po `humanSeats.humanOwnerIds`.
5. `1 (===1?) FAIL` w `ai-praca-split-parity-test.cjs` pre-istniejący na bazie — do
   potwierdzenia przez Evaluatora, że nie jest to regres tej rundy (dowód: grep na
   `HEAD:gra/src/main.ts`).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
