STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1
GOAL: utrata ostatniego miasta gracza (także na rzecz barbarzyńców) kończy grę przegraną: ekran `przegrana`, `gameOver=true`, brak dalszych tur; bez regresji startu przed stolicą, hot-seata i scenariuszy testowych.

ODPOWIEDŹ NA ZARZUTY (r4)

1. Brak testu poprawki H2 w main.ts: PRZYJMUJĘ.
   - `sprawdzPrzegranaPoUtracieMiasta` wyniesiona z bloku końca tury do zakresu `launchIncomingMapFieldBattle`; nowe wspólne `onBarbarianCityBattleResolved` jest `onResolved` produkcyjnego call site fazy barbarzyńców ORAZ haka testowego.
   - Hak `__defeatTestDebug.launchBarbarianBattleOnCity` woła REALNE `launchIncomingMapFieldBattle` (14 klonów barbarzyńców vs obrońcy gracza, `allowCityCapture=true`). Test klika realne Auto, potem realne „Kontynuuj" w podsumowaniu.
   - S4 (jedno miasto, BEZ endTurn): przed Kontynuuj brak ekranu przegranej; po Kontynuuj `.vsc-overlay.lose`, miasta=0, `gameOver=true`, tura nadal 1, kolejny endTurn nie rusza gry. Zrzut: `evidence/defeat-S4-bitwa-barbarzyncow-bez-endturn.png`.
   - S3 (kontrola, dwa miasta, ta sama ścieżka bitwy): miasto tracone, brak przegranej, `gameOver=false`, endTurn przesuwa turę.
   - Ograniczenie (NIE_ZMIERZONO): sama pętla decyzyjna barbarzyńców (`decideBarbarianMoves` -> komenda `attack`) nie jest uruchamiana w Chromium; test wchodzi od `launchIncomingMapFieldBattle`. Wywołanie `onResolved` w call site pilnuje istniejący test tekstowy `barbarzyncy-podwojny-atak-prebattle-test` (A2).

2. Brak mutacji main.ts: PRZYJMUJĘ.
   - M1: puste ciało `onBarbarianCityBattleResolved` (usunięte wywołanie po bitwie) -> S4 pada (timeout na ekranie przegranej), `gate-mutacja-main-M1-*.txt`, EXIT=1.
   - M2: usunięty `if (defeat === null) return;` -> S3 pada (4/3: gameOver=true przy 2 miastach, TypeError), `gate-mutacja-main-M2-*.txt`, EXIT=1.
   - Obie mutacje cofnięte; `main.ts` po cofnięciu = wersja z commita, tsc EXIT=0, S1-S4 28/0.
   - Poza zakresem: mutacja guardu `gameOver ||` (nieobserwowalna, drugi check jest idempotentny) - NIE_ZMIERZONO.

3. Bramki bazowe: PRZYJMUJĘ częściowo, resztę ODRZUCAM z dowodem.
   - war-era-counter-test: ODRZUCAM rozbieżność. 37 to międzywynik sekcji; plik kończy się `war-era-counter-test: 82 pass / 0 fail` (`gate-przed-` i `gate-po-war-era-counter-test.txt`, EXIT=0).
   - diplomacy 148: `gra/tools/diplomacy-test.cjs` = 148/0, EXIT=0 (`gate-po-diplomacy-test.txt`).
   - diplo-truce-live: 23/0, EXIT=0. war-era-counter-live: 16/0, EXIT=0.
   - Hot-seat Chromium: `hotseat-drugi-fotel-tura-test` nadal EXIT=2 identycznie PRZED i PO (timeout `.civ-newgame .start` w kreatorze, to dryf selektorów UI kreatora, niezależny od tej zmiany, logi gate-przed/gate-po). Dowód zastępczy w Chromium: `hotseat-etap6d-podetap-a-live-test` 6/0, EXIT=0, plus statyczne hotseat-etap7 59/0 i human-owners 29/0 (r3).
   - NOWE w r4, zmierzone na bazie `4d1916f2c` i na HEAD: koniec-tury-f1-f4-runda3, barb-city-capture-cluster, end-turn-modal-sequencing, hud-moc-warstwa, pre-battle-retreat-exhausted są czerwone IDENTYCZNIE na bazie (`gate-przed-*-BAZA-4d1916f2c.txt`) = znane czerwone, nie regresja.
   - REGRESJA WYŁAPANA I NAPRAWIONA: mój hak miał pierwszy w pliku literał `'Atak barbarzyńców',` i łamał test tekstowy `barbarzyncy-podwojny-atak-prebattle-test` [A2] (czerwony na HEAD r3-hak, zielony na bazie). Etykieta w hacku przeniesiona do zmiennej; test 18/0, EXIT=0.

4. Higiena `git diff --check`: PRZYJMUJĘ, usunięte spacje końcowe w `01-operator-r3.md`.

ZMIANY/COMMIT: baza r3 `3f66f88ab`; commit r4 podany w odpowiedzi końcowej (SHA). Pliki: `gra/src/main.ts` (wyniesienie funkcji + `onBarbarianCityBattleResolved` + hak `launchBarbarianBattleOnCity`), `gra/tools/defeat-last-city-live-test.cjs` (S3 = bitwa, S4, filtr `DEFEAT_ONLY` do mutacji), pliki w `runs/<ID>`. Push NIE.
TESTY: tsc EXIT=0; defeat-last-city-test 14/0; victory-test 12/0; barbarians-test 213/0; podwójny-atak-prebattle 18/0; diplomacy 148/0; Chromium defeat-last-city-live 28/0 (S1 osadnik, S2 bez osadnika, S3 kontrola bitwą, S4 bitwa bez endTurn, zero pageerror); diplo-truce-live 23/0; war-era-counter-live 16/0; hotseat podetap-a-live 6/0.
BLOKADY: `hotseat-drugi-fotel-tura-test` EXIT=2 przed i po (infra/dryf UI kreatora). Czas pełnego testu Chromium ok. 5 min (4 sceny po ok. 80 s ładowania świata), ponad 120 s z dispatchu: ZAŁOŻENIE, nie da się zredukować bez utraty niezależnych scen.
RUNDY: 4/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
