STATUS: BLOCK (runda 2/5, Operator HAIKU 5.5 — bez zmian kodu; przyczyna zerowych miast AI leży w starcie gry poza allowlistą, wymaga decyzji orkiestratora)
DOMAIN: GAME (narzędzia pomiarowe + hak civTest)
TEMAT: R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1
GOAL: (1) metryki AI per owner/tura w haku civTest; (2) runner wznawialny 100+ tur; (3) obejście bramki NNS gracza z licznikiem; (4) dowód 100 tur x2 + test wznowienia; (5) instrukcja #415. Runda 2: naprawić zarzuty FC r1 (AI=0 miast, galaz obejscia NNS, metryki %głodu/utrzymania jednostek, README #415).
BAZA: kandydat r1 3ba13a5ce + `git merge origin/main` (7ac79dafb, FALA 747) → commit 0b321dfdf (merge bez konfliktów; `git merge-base --is-ancestor 7ac79dafb HEAD` = OK). Kod operatora r2: brak nowego commita z kodem (patrz ZMIANY-COMMIT).
ZMIANY-COMMIT: tylko ten raport (dyspozycje/autobot/runs/R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1/10-operator-claude.md) + merge 0b321dfdf (lokalny, nie wypchnięty). Zero zmian w gra/src ani gra/tools w tej rundzie. node_modules w gra/ zainstalowane przez `npm ci` (71 pakietów), do usunięcia po raporcie.
TESTY (ZMIERZONE przeze mnie, surowe wyniki):
- `npx tsc --noEmit` w gra/: EXIT 0.
- `npx vite build --outDir /tmp/ai-economy-dist --emptyOutDir`: EXIT 0 (built in 33.88s).
- `node tools/ai-economy-measure-hook-test.cjs`: EXIT 1; wynik: ZIELONE ksztalt metryk (7 wlascicieli); ZIELONE niezmierzone wymienia przychod/utrate; ZIELONE kontrola negatywna (bez ?civTest=1 brak haka); CZERWONE wartosc: AI ma >=1 miasto po zalozeniu miasta gracza — `miasta AI=0; diag={"pendingForeignSpawnCities":0,"pendingSameTypeRivalHexes":0,"aiStartHexes":6,"citiesAll":1,"ownersOfCities":[0]}`. PODSUMOWANIE 3/4 zielone.
- Sonda startu (scratchpad, bez zmian w repo): `__nnsMeasureDebug.startGame` z {seed:4242, mapSize:"Maly", civTypes:4, cityStates:2} ORAZ {seed:4242, mapSize:"Standardowy", civTypes:4, cityStates:6} → w obu przypadkach po foundFirstCity: `AI miasta 0`, diag identyczny: pendingForeignSpawnCities 0, aiStartHexes 6, citiesAll 1, ownersOfCities [0].
- NIE ZMIERZONO w tej rundzie: 5 bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test), resource-ledger-hook-gate-test, `git diff --check`, test wznowienia --resume-test, przebieg 100 tur x2, mutacja wznowienia, test galezi obejscia NNS (bypassApplied), metryki % kary glodu i utrzymania jednostek wojskowych.

DIAGNOZA ZAREZERWOWANA (AI=0 miast, zarzut 1 FC r1) — ustalenia z kodu i sondy:
1. `aiStartHexes` w ścieżce haku wynosi 6 już po starcie, a `pendingForeignSpawnCities` = 0 — czyli miasta AI NIE trafiły do kolejki spawnu ani nie zostały założone; wartość 6 pochodzi z początkowego `computeStartPlacements` (main.ts:2319/3156), a nie z `applyClusterStartPlan` (main.ts:11466 resetuje `aiStartHexes = []`).
2. Spawn miast obcych ownerów odbywa się WYŁĄCZNIE w `spawnPendingForeignClusters()` (main.ts:11871), wywoływanym z `tryFoundPlayerCityAt` (main.ts:17295) po założeniu stolicy gracza. Gdyby `plan.spawnCities` było niepuste, `pendingForeignSpawnCities` nie byłoby 0 po założeniu stolicy — a jest 0 w obu konfiguracjach startu.
3. Wniosek: w ścieżce `doStartGame` z haku (i z runnera, który używa tego samego startu) `applyClusterStartPlan` nie produkuje żadnych spawnów obcych miast. Zmiana parametrów (civTypes 4/15, cityStates 2/6, mapSize Maly/Standardowy) tego NIE zmienia. Przyczyna leży w `buildClusterStartPlan` / `applyClusterStartPlan` albo w warunkach wejścia do tej gałęzi startu — to jest kod gry POZA allowlistą tego tematu (`gra/src/game/cluster-start.ts`, main.ts `applyClusterStartPlan`). Nie naprawiałem tego (zakaz: logika startu w trybie normalnym poza allowlistą). Hipoteza do potwierdzenia przez orkiestratora: `doStartGame` w trybie civTest nie wywołuje `applyClusterStartPlan` z pełnym planem, albo plan zwraca pusty `spawnCities` — wymaga osobnego tematu (kandydat: R-WEB-CLUSTER-START-NO-AI-CITIES-IN-HARNESS-Q1, do zarejestrowania przez orkiestratora; NIE zakładam go sam).
4. Pokrewne (zgodnie z UWAGI FC r1): ten sam defekt może tłumaczyć tematy #415/#418 (zależne od pomiaru AI). Hipoteza, NIE potwierdzona.

BLOKADY:
- Zarzut 1 (AI=0): BLOCK — przyczyna w grze poza allowlistą; decyzja orkiestratora (osobny temat gry albo zmiana kryterium).
- Zarzut 2 (kryterium c, wznowienie): NIE RUSZANE tu — przyczyna `ensureCityPodzialDefaults`/SAVE-LOAD (#424, R-WEB-SAVE-LOAD-CITY-WORK-SPLIT-ROUNDTRIP-Q1); nie naprawiam zgodnie z dispatchem.
- Zarzut 3 (galaz obejscia NNS bez testu i mutacji): NIE ZROBIONE w tej rundzie (brak czasu/limitu tury Operatora po diagnozie zarzutu 1; do zrobienia w r3 po decyzji o starcie AI).
- Zarzut 5 (mutacja wznowienia): NIE ZROBIONE — dispatch: dopiero gdy baza zielona; baza NIE jest zielona (hook-test 3/4).
- Zarzut 6 (% kary glodu, utrzymanie JEDNOSTEK wojskowych Pieniądz+surowce, przychod/utrata): NIE ZROBIONE. Hak już zwraca glodWojska/glodWojskaAtrycja (flagi) i utrzymanieBudynkow*/utrzymanieGarnizonu*; brak % kary i utrzymania jednostek — do dopisania w r3 (wymaga zweryfikowania źródła funkcji w grze, nie zgaduję).
- Zarzut 8 (instrukcja #415 w README): NIE ZROBIONE w tej rundzie.
- Cel 4 (100 tur x2 + wznowienie): NIE ZMIERZONE (nie uruchamiano — baza nie przechodzi testu wartości AI, a przebieg 100 tur bez AI nie daje wiarygodnych metryk).

RUNDY: runda 2/5 (Operator HAIKU 5.5). Pierwsza runda Haiku dla tego tematu zakończyła się FC FAIL (r1, `refs/keep/R-WEB-AI-ECON-HARNESS-r1-fc`). Ta runda: diagnoza zarzutu 1 + pomiary bramek; bez zmian w kodzie.
NASTĘPNY KROK: orkiestrator decyduje: (a) osobny temat GAME na start AI w trybie civTest (kandydat jw.) i dopiero potem runda 3 tego tematu; albo (b) zmiana kryterium (a) na pomiar bez AI — wtedy runda 3 domyka zarzuty 3, 5, 6, 8.
UWAGI-DLA-ORKIESTRATORA:
- Sonda startu (dwie konfiguracje) jest w scratchpad: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/probe.cjs (plik pomocniczy, nie w repo).
- Nie tworzyłem żadnych sesji, zadań ani harmonogramów (zakaz z dispatchu).
- Bundle vite zbudowany w /tmp/ai-economy-dist (wymagany przez hook-test); do usunięcia po sprzątaniu.
DEPLOY-PUSH: NIE WYKONANO
