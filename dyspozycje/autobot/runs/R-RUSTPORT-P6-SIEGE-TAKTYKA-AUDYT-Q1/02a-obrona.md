STATUS: INTEGRATION_PENDING
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1
GOAL: obrona operatora na zarzuty Evaluatora r3 (02-evaluator.md, commit 78612dc4b, FAIL na 888f8d7eb)
ZMIANY/COMMIT: baza 888f8d7eb (r3); zmiana wyłącznie dokumentacyjna: dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md (+ sekcja 1a, 36 wierszy 35.1–35.36, korekta numerów main.ts, aktualizacja D-ST-4 i klasyfikacji 33.12/33.14/33.23/33.33/33.35). Commit: SHA w sekcji „Podaj SHA” niżej. Kod Rust, testy, gra/, Cargo, WERSJE.md — bez zmian.
TESTY: git diff --check OK (bez uwag). git diff --stat: 1 plik .md. Brak .rs, brak cargo (brak zmian kodu). Weryfikacja nazwa po nazwie: 138 deklaracji metod wzorca na pinie 07d2fbd72 (git show) → każda ma wiersz w P6-SIEGE-TAKTYKA.md (0 braków; poprzednio 36).
BLOKADY: brak w zakresie obrony. Jawne NIE_ZMIERZONO pozostają: deklaracje battleScene.ts spoza wzorca nazw (deploy, kamera, pasek minimapy; D-ST-3) oraz treść 33.10, 33.13, 33.14 (`_isWallCrownShooter`), 33.35 (`_performSiegeManualOrder`) i wierszy 35.x klasyfikowanych wg nazwy (D-ST-4).
RUNDY: 4/5 (ten sam ID; r3 FAIL na zarzut 1; obrona r4)
NASTEPNY KROK: Evaluator (r4) na commit z sekcji „Podaj SHA”, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (blokujący): PRZYJMUJĘ
- Dowód zarzutu sprawdzony na pinie 07d2fbd72 (git show, pliki w scratchpad): grep deklaracji wzorca daje 138 metod. Rzeczywiście 36 z nich nie miało wiersza (m.in. `_playerWonFromBattleWinner` 12401, `_haltAutoBattleTurn` 17333, `_toggleManualMode` 17348, `_debugRecordSiegeColumns` 4753, `_syncSiegeHudLayout` 13851, `_endDeployPhase` 17292, `_hideEndScreen` 10472, `_showEndDetails` 10425, `_setBattleChromeForEndScreen` 10631, `_syncManualRailHighlight` 3675, `_applyStartingMoralePowerPenalty` 5597 — wszystkie z listy Evaluatora oraz 25 kolejnych).
- Wybrana poprawka: DODANIE wierszy (nie zawężanie wzorca). Sekcja 1a: 35.1–35.36, każdy z liniami pinu i statusem (BRAK / PARTIAL; PORTED 0), klasyfikacja O/M/G. Sekcja „Zakres” przepisana: zamiast twierdzenia o 100% opisuje dokładną enumerację, liczbę 138 i sprawdzenie nazwa po nazwie (0 braków).
- Przy tym wprost wskazane: 35.13 `_playerWonFromBattleWinner` = PARTIAL (część logiczna to wiersz 13 `battle_winner`, PORTED; mapowanie strona→gracz BRAK).
- Uwaga: wzorzec obejmuje też deklaracje „deploy” (np. `_renderDeployTacticsPopup`); są w 1a jako BRAK (G, deploy UI) — nie jako pokryte.
- Dowód: `grep` nazw wszystkich 138 deklaracji w dokumencie przed zmianą: 36 braków; po zmianie: 0 braków.

### Zarzut 2 (drobny): PRZYJMUJĘ
- Sprawdzone na pinie: `main.ts:18051` = `siegeAiKey(...)`, `18052` = odczyt `persisted`, `18053` = `decideAISiegeStance(siegeArmy, siegeCity, persisted)`. Druga wywołanie: `main.ts:18135` (`decideAISiegeStance(` z `collectSiegeAtkRoster` i `runtimeUnitToSiegeUnit`, bez `siegeAiStateByKey`).
- Poprawione w dokumencie: §6 (zdanie o wpięciu), wiersz 34.1 (`main.ts:18053` oraz `main.ts:18135`), wiersz K7 w planie (`main.ts:18053` i `main.ts:18135`).
- Nie zmieniono: status handoffu — dokument nadal mówi, że jego „CZEKA wpięcie” jest nieaktualne na pinie.

### Zarzut 3 (drobny, nieblokujący): PRZYJMUJĘ CZĘŚCIOWO
- Przeczytano treść (ciała metod) i zaktualizowano klasyfikację:
  - 33.12 `_attackGate` (`:7310-7338`): O potwierdzone (`gateOpen`, `siegeGateCol`, `_siegeStructureDamage`, `gateHp`, `_breachGate`).
  - 33.14 `_wallBonusProcFor` (`:7459-7466`): O potwierdzone (wywołuje `fortificationDefenseBonusForUnit`). `_isWallCrownShooter` (`:7467-7489`) NIE czytano w r4 — nadal wg nazwy.
  - 33.23 `_ffEnterAuto` (`:3709-3712`): G potwierdzone (`_toggleManualMode` + `_kickoffBattleTurn`).
  - 33.33 `_pickRangedTargetByPriority` (`:17571-`): G potwierdzone (wybór wg `_priorityScore` i dystansu).
  - 33.35 `_destAllowedByBlockade` (`:17809-`): reklasyfikacja O → G (blokada linii `blockadeCol`, nie mur). `_performSiegeManualOrder` (`:18435-`) NIE czytano w r4.
- Nieczytane nadal: 33.10 (rodzina AUTO batch), 33.13 (`_animateRam`/`_sfxRamImpact`/`_isRam`), `_isWallCrownShooter`, `_performSiegeManualOrder`, oraz 35.x wg nazwy/słów kluczowych. Zapisane jawnie w D-ST-4.

## Podaj SHA
- Commit obrony: patrz wynik `git rev-parse --short HEAD` w tej sesji (zapisany w odpowiedzi operatora); bez push.

## Uwaga procesowa
- Evaluator r3 (02-evaluator.md, 78612dc4b) jest w historii gałęzi roboczej; nie jest częścią commita 888f8d7eb. Scalenie przy integracji (jak wskazuje FC r2).
- Numeracja: ta obrona to runda r4 (r3 = 888f8d7eb, FAIL). Pliku 01-operator-r4.md nie tworzono: zakres zmian opisany w tym pliku.
