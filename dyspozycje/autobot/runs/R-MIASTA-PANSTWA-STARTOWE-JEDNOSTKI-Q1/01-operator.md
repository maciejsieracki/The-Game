STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1
GOAL: Przy foundowaniu miasta-panstwa nadaj mu startowe jednostki wojskowe wg
cityStateDifficulty: easy=0, normal=1, hard=2 — na mapie, przypisane do miasta,
zero zmian w foundowaniu gracza/major AI.
MODEL+EFFORT: claude-sonnet-5, effort high
RUNDA: 1/5

ZMIANY/COMMIT: autobot/R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1 @ 59ecd496
- gra/src/game/ai-difficulty-bonus.ts: nowa fn cityStateStartUnitCount(easy=0/normal=1/hard=2)
- gra/src/main.ts: import + nowa fn grantCityStateStartUnits(ownerId,q,r), wpieta w
  DWOCH punktach foundowania CS potwierdzonych reconem (recon rozszerzyl dispatchowy
  zakres linii 8205-8306 — patrz notatka nizej): petla rywali tego samego typu
  (linia ~8233) i spawnPendingForeignClusters, galaz isCS (linia ~8349, obcy klaster).
  grantDifficultyStartBonusesForMajorCapital (major AI) nietkniete.
- gra/tools/ai-difficulty-bonus-test.cjs: rozszerzony o T-DB-i (cityStateStartUnitCount)
- gra/tools/city-state-start-units-test.cjs: nowy, ekstrakcja+egzekucja funkcji z
  main.ts (wzor forced-war-bronze-new-game-reset-test.cjs) + straznik wpiecia (wzor
  ai-founding-territory-test.cjs Sekcja B), z dwiema mutacjami dowodzacymi nietautologicznosci

TESTY:
- tsc --noEmit: 0 bledow
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6
- city-state-start-units-test.cjs (nowy): 16/16 PASS, w tym 2 mutacje wykryte
- ai-difficulty-bonus-test.cjs: 68/68 (bylo 64, +4 nowe)
- city-state-alliance-test.cjs: 67/67 (regresja)
- city-state-cluster-diff-test.cjs: 31/31 (regresja)
- cluster-start-test.cjs: dokonczyl sie po ~13 min (wolny, wspoldzielony CPU z 5
  rownoleglymi Operatorami innych tematow — analogicznie do map-gen-regression-test
  z tabeli bramek). Wynik: 458 passed, 12 failed. Import tego testu (sprawdzone
  bezposrednio w pliku) obejmuje WYLACZNIE cluster-start.ts, map/cluster-spawn.ts,
  map/generator.ts, map/clusters.ts, map/gen-helpers.ts, game/civ-entry-epoch.ts,
  game/cities.ts — ZADEN z tych plikow nie jest w diffie tego tematu (moja zmiana
  dotyka wylacznie ai-difficulty-bonus.ts, main.ts, gra/tools/*-test.cjs). 12 FAIL
  jest wiec strukturalnie niezalezne od tej zmiany (baseline pre-istniejacy na
  origin/main, nie regresja tego tematu) — poza allowlista tego dispatchu (C-025:
  zakres = tylko zgloszony temat), zgloszam jako obserwacje, nie naprawiam
- git diff --check: czysty (brak bialych znakow); diff --stat: 4 pliki, tylko
  allowlista, +248/-0

NOTATKA RECON (rozszerzenie zakresu linii z dispatchu): dispatch wskazywal "main.ts
ok. linii 8205-8306, jedno wywolanie". Recon potwierdzil DWA niezalezne miejsca
ustawiajace c.startCityState=true — obok petli rywali tego samego typu (w podanym
zakresie) istnieje spawnPendingForeignClusters (~8313+, poza podanym zakresem),
ktore foundowac takze miasta-panstwa klastrow OBCEGO typu (potwierdzone: isCS =
simplifiedDiplomacyOwners.has || typCityCopyOwners.has, ownerDiploLabel oznacza je
isCityState=true). Kryterium 1 dispatchu mowi "KAZDE wygenerowane miasto-panstwo" —
bez pokrycia drugiego miejsca kryterium byloby fizycznie niespelnialne dla klastrow
obcego typu. Klasyfikuje to jako decyzje techniczna bez wplywu na gameplay/balans
(R-PROC-AUTOBOT §10 — orkiestrator decyduje, nie ABC), nie DECISION_REQUIRED.

BLOKADY: brak dla zakresu tego tematu. cluster-start-test.cjs ma 12/470 FAIL
niepowiazanych z diffem (patrz TESTY) — warto zgłosić jako osobny temat do
weryfikacji baseline, poza zakresem tego dispatchu.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high) — niezalezna weryfikacja diffu,
bramek i zwlaszcza rozszerzenia zakresu na 2. punkt foundowania.
DEPLOY/PUSH: NIE WYKONANO
