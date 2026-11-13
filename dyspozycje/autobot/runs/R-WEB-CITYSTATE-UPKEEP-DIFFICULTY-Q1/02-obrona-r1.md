STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — ekonomia miast-państw i AI
TEMAT: R-WEB-CITYSTATE-UPKEEP-DIFFICULTY-Q1
GOAL: bez zmian (patrz 01-operator-r1.md).
ZMIANY/COMMIT: brak zmian kodu w obronie. Dodany tylko ten plik. Kod: 43c524b55, raport Operatora: 332635bd0. Push NIE wykonany.
RUNDA: 1/5 (obrona Operatora, Haiku 5.5)

ODPOWIEDZI NA ZARZUTY

Z1 (allowlista: turn-economy.ts) — PRZYJMUJĘ jako odstępstwo jawne.
Plik zawiera advanceCityEconomy. Wzorzec economy*.ts go nie obejmuje. Zmiana w nim to +1 opcjonalny parametr i 22 linie, bez zmiany sygnatury wywołań. Proszę orkiestratora o jawną akceptację odstępstwa przy integracji.

Z2 (efekt liczbowy zerowy) — PRZYJMUJĘ jako fakt, bez zmiany kodu.
Zweryfikowane na gra/data: units.json 75 wierszy, każdy z własnym wpisem "Utrzymanie (Pieniądz/turę)"; 74 z wartością >0, jeden bez dodatniej wartości (NIE_ZBADANO, dlaczego). buildings.json 43 wiersze, 42 z utrzymaniem >0, "stela" = 0. unitUpkeep (economy-upkeep.ts:965) bierze wartość z tabeli per typ przed stawką standardową. buildingUpkeep bierze własną wartość przed flatOverride. Stawka utrzymanie_budynek (1/1/2) działa tylko przy braku wpisu. Efekt w PM dla miast-państw dziś = 0. Nie zmieniam liczb (zakaz dispatchu). Decyzja balansu: ABC do właściciela.

Z3 (AI civ bez osobnego suwaka, test tylko na poziomie funkcji) — ODRZUCAM.
Dispatch (CEL 2) każe użyć ISTNIEJĄCYCH mechanizmów. Istniejący aiDiffLevelForOwner (main.ts:8998) i effectiveGameDifficultyForOwner (main.ts:9038) mapują każdego ownera spoza typCityCopyOwners na _menuDifficulty. Brak suwaka per AI civ w kodzie. Resolver z commita 43c524b55 zwraca dla AI civ ten sam wynik co effectiveGameDifficultyForOwner, więc zachowanie jest zgodne z istniejącym mechanizmem. Test A2 (AI civ -> menu) i C-sekcja (CS vs AI na różnych poziomach) pokrywają to na poziomie funkcji i advanceCityEconomy. Dowód: gra/tools/upkeep-difficulty-per-owner-test.cjs, 19 passed, 0 failed (odtworzone na 332635bd0).

Z4 (main.ts: pominięte miejsca) — podział:
- 8220 (buildingUpkeepForCityId) i 8248 (garrisonUpkeepForCity): ODRZUCAM potrzebę zmiany. Jedyny wywołujący to refreshPlayerCityEcon (main.ts:8183), wołany tylko z ME() (main.ts:21079) i humanOwnerId (main.ts:37065). ownerId to zawsze gracz, czyli poziom menu zgodnie z dispatchem.
- 20588, 20731 (podgląd HUD): ODRZUCAM. Pętle filtrują ownerId===0, czyli gracz.
- 36721 (tick: upkeepParams + efParams): PRZYJMUJĘ jako realną lukę, NIE NAPRAWIAM w tym temacie. advanceEmpireFood (empire-food.ts:195) przyjmuje jeden UpkeepParams dla wszystkich ownerów. Naprawa wymaga zmiany sygnatury w empire-food.ts (poza allowlistą) i równoległej zmiany projekcji autoRation w pętli per owner (bez tego projekcja i tick się rozjadą). Zakres to ŻYWNOŚĆ wojska, nie utrzymanie PM. Efekt NIE jest zerowy: zywnosc_jednostka_oboz/zywnosc_jednostka_ruch = easy 0.38, normal 0.5, hard 0.31 (0.62/2), więc jednostki w obozie miast-państw liczą się wg poziomu menu. Proponuję nowy temat R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1 (dług). Wymaga decyzji ABC, czy żywność wchodzi w zakres.

Z5 (praca: computePracaUpkeepByOwner globalny) — ODRZUCAM w tym temacie.
CEL dispatchu to utrzymanie wojska i budynków. Praca nie jest utrzymaniem. Odnotowane jako dług, bez zmian.

Z6 (NIE_ZMIERZONO: brak pomiaru w przeglądarce i 100 tur) — ODRZUCAM jako wymóg.
Dispatch nie wymagał pomiaru w przeglądarce ani runu 100 tur. Zakaz builda vite w gra/ obowiązuje. Pozostaje NIE_ZMIERZONO.

WYNIKI BRAMEK (odtworzone na 332635bd0)
- upkeep-difficulty-per-owner-test.cjs: 19 passed, 0 failed (exit 0).
- tsc --noEmit: exit 0.
- logic-test 213/213 i ai-test 289/0: NIE uruchamiane ponownie w obronie (brak zmian kodu od 43c524b55; wyniki Operatora i Evaluatora zgodne).

DECYZJE DLA ORKIESTRATORA (do integracji, nie do Operatora)
1. Akceptacja odstępstwa allowlisty (turn-economy.ts).
2. ABC do właściciela: wartości utrzymania per poziom (efekt PM dziś zerowy).
3. ABC do właściciela: czy żywność armii miast-państw (36721, obóz) wchodzi w zakres; nowy temat R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1.
4. Dług: praca per owner (computePracaUpkeepByOwner).

BLOKADY: 36721 (żywność) nienaprawione w tym temacie; efekt PM zerowy z przyczyn danych.
RUNDY: 1/5 obrona. NASTĘPNY KROK: Evaluator r2 (przegląd tej obrony) albo przejście do Final Control z PASS-WITH-NOTES.
DEPLOY/PUSH: NIE WYKONANO
