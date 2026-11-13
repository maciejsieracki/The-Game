STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — ekonomia miast-państw i AI
TEMAT: R-WEB-CITYSTATE-UPKEEP-DIFFICULTY-Q1
GOAL: utrzymanie (budynki + jednostki) w upkeepByOwner liczy się wg poziomu trudności WŁAŚCICIELA: miasto-państwo -> cityStateDifficulty, AI cywilizacji i gracz -> trudność menu. Zmienia się tylko wybór poziomu, liczby balansu bez zmian.
BAZA: origin/main 9733ea8b0 (detached)

ZMIANY-COMMIT: 43c524b55 (kod + test; push NIE wykonany)
- gra/src/game/turn-economy.ts: advanceCityEconomy dostaje opcjonalny ostatni parametr `resolveOwnerUpkeepDifficulty?: (ownerId) => Difficulty`. Pętla upkeepByOwner używa parametrów utrzymania per owner (cache po poziomie). Brak resolvera = globalny `difficulty` (dawne zachowanie).
- gra/src/main.ts (tylko miejsce wywołania advanceCityEconomy, ~l.36701): podaje `(oid) => effectiveGameDifficultyForOwner(oid)`, czyli istniejący helper (miasto-państwo -> _menuCityStateDifficulty, reszta -> _menuDifficulty).
- gra/tools/upkeep-difficulty-per-owner-test.cjs (NOWY).
- Brak zmian w gra/data/*.json, rust-port, gra-robocza, WERSJE.md. Brak nowych pól w zapisie (zgodność wsteczna bez migracji).
- Nie zmieniano: AI civ nie ma osobnego suwaka trudności w kodzie (aiDiffLevelForOwner i effectiveGameDifficultyForOwner dają dla AI civ trudność menu), więc dla cywilizacji AI zachowanie jest bez zmian. Gracz bez zmian.

PRZEGLĄD MIEJSC (git grep _menuDifficulty, ekonomia ownera):
- turn-economy.ts advanceCityEconomy upkeepByOwner (globalny difficulty) — NAPRAWIONE powyżej.
- main.ts ~8220/8248/20588/20731/20969 (buildingUpkeepForCityId, garrisonUpkeepForCity, HUD gracza, ownerId 0) — bez zmian, tylko gracz.
- main.ts ~33239 i ~39092 (previewOwnerUpkeep dla AI) — już per owner (effectiveGameDifficultyForOwner), bez zmian.
- turn-economy.ts computePracaUpkeepByOwner(map, ..., difficulty) — utrzymanie PRACY (ulepszenia surowcowe), liczone globalnym poziomem dla wszystkich ownerów. POZA ZAKRESEM tego tematu (nie wojsko/budynki); NIE ruszane. Do decyzji (patrz BLOKADY).

TESTY:
- Nowy gra/tools/upkeep-difficulty-per-owner-test.cjs: 19 passed / 0 failed.
  A: wybór poziomu per owner (gracz, AI civ, miasto-państwo, brak wpisu, pusty zbiór) — 6/6.
  B: previewOwnerUpkeep na easy/normal/hard: monotonicznosc, hard > easy dla jednostek spoza tabeli, dwa AI na roznych poziomach = rozny upkeep, CS hard > CS easy; B5 realne jednostki z wlasnym utrzymaniem nie zmieniaja sie z poziomem (zgodnosc).
  C: advanceCityEconomy z resolverem: upkeepByOwner CS (hard) > AI (normal); AI bez zmian wzgledem bazy; CS rozni sie od bazy bez resolvera — 4/4 + wyjatek nieobecny.
  D: econ-params nietkniete (jednostka easy 1 / normal 1 / hard 2) — 3/3.
- Regresje (baza 9733ea8b0 vs po zmianie): logic-test 213/213 -> 213/213; ai-test 289/0 -> 289/0; tsc --noEmit exit 0 -> 0; hud-skarbiec-test OK; empire-skarbiec-bilans-test OK; ai-player-parity-fixes-test OK.
- NIE_ZMIERZONO: pomiar w przegladarce / 100-turowy run (nie wymagany dispatchem; brak builda vite zgodnie z zakazem).

BLOKADY / NALEZY ZGLOSIC WLASCICIELOWI (kluczowe):
1. EFEKT LICZBOWY W DANYCH JEST ZEROWY. Sprawdzone na gra/data: wszystkie 75 jednostek w units.json ma WLASNE utrzymanie (kolumna "Utrzymanie (Pieniądz/turę)" wypełniona dla 75/75). Parametr poziomowy utrzymanie_jednostka_standard (1/1/2) jest używany tylko dla typów BEZ wpisu (unitUpkeep: typ -> kategoria -> standard). Budynki: wg dispatchu wszystkie 39 mają własne utrzymanie, więc utrzymanie_budynek (1/1/2) też nie działa. Wniosek: poprawka jest poprawna przepięciowo, ale dziś NIE zmienia ani jednej liczby PM dla miast-państw. Efekt pojawi się dopiero, gdy ktoś świadomie przypisze poziomowe wartości jednostkom/budynkom albo zdecyduje o mnożniku — to jest DECYZJA BALANSU właściciela (ABC), nie wykonawcy.
2. Utrzymanie PRACY (computePracaUpkeepByOwner) nadal globalne — osobny temat, jeśli właściciel chce.
3. Brak per-AI suwaka trudności w kodzie: "dwa AI na różnych poziomach" testowane na poziomie funkcji wyboru i previewOwnerUpkeep z podanym poziomem; w grze obecnie wszystkie AI civ dostają poziom menu.

NASTĘPNY KROK: integracja orkiestratora (Final Control Sonnet 5.5 po Evaluatorze). Decyzja właściciela o liczbach utrzymania miast-państw (punkt 1) przed uznaniem tematu za funkcjonalnie zamknięty.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
