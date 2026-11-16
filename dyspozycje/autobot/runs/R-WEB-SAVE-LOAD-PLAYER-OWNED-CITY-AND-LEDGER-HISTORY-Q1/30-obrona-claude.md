# R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY-AND-LEDGER-HISTORY-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY-AND-LEDGER-HISTORY-Q1
GOAL: (A) #433 — dowód dynamiczny, że po wczytaniu gracz z 0 miastami nie blokuje „Zakończ turę”; (B) #432 — pomiar live i rozstrzygnięcie (defekt vs artefakt).
BAZA: c284fe02d (origin/main). KANDYDAT Operatora r1: 7f08bfcbd. Ta obrona: commit ponad 7f08bfcbd (SHA w polu sha raportu StructuredOutput).

## Odpowiedzi na zarzuty Evaluatora (a24f1dc04)

| Nr | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | #433: brak testu dynamicznego ani haka civTest | PRZYJMUJĘ | Nowy `gra/tools/save-load-player-owned-city-live.cjs --mode 433` (Chromium, realny bundle, ?civTest=1, istniejące haki: `__nnsMeasureDebug` quickSave/loadSlot/debugKillPlayer/playerCities, `__cityStateStartUnitsTestDebug.dumpState().awaitingFirstPlayerCity`, `__eraTestDebug.endTurn`). Wyniki w 30-live-433-*.json (sekcja niżej). |
| 2 | #433: dowód mutacyjny zapętlony | PRZYJMUJĘ | Mutacja nie sprawdza już regexu na tym samym tekście. Mutanty kopii (bez odczytu, bez zapisu) przechodzą przez `staticFailures()`; test wymaga wyniku >0 (wykryto: obie mutacje, po 1 niespełnionym warunku). Warunki na `main.ts` sprawdzane osobno. Uwaga: to nadal test statyczny; dowód zachowania = punkt 1. |
| 3 | #432: brak pomiaru live; „artefakt” wynika z lektury kodu | PRZYJMUJĘ zarzut, ODRZUCAM wniosek „artefakt” | Pomiar live wykonany (sekcja #432). Wynik obala hipotezę artefaktu migawki: po wczytaniu w NOWEJ stronie (po worldReady + 800 ms, przed tickiem) dziennik w pamięci ma 0 wpisów, a przed zapisem było 3. Ta sama sesja: `saveRoundTrip` 3 → 3. Strata występuje więc w ścieżce zapis-w-IDB → nowa strona → wczytanie, nie w samej migawce. Przyczyna NIEZNANA (NIE ZMIERZONO, który etap). Brak zmiany gry w księdze (nie zlokalizowano defektu do minimalnej poprawki). |
| 4 | Nieaktualny komentarz przy debugKillPlayer(forgetOwnership) | PRZYJMUJĘ | Komentarz w `gra/src/main.ts` (blok `debugKillPlayer`) przepisany: zbiór trafia do zapisu gdy niepusty; `forgetOwnership=true` zeruje go w pamięci. Diff: 2 linie komentarza, bez zmiany logiki. |
| 5 | Proces: kandydat bez gałęzi; 00-dispatch.md nie ma w origin/main | PRZYJMUJĘ jako notatkę dla orkiestratora | Nie pushuję i nie tworzę gałęzi (zakaz). Patrz UWAGI-DLA-ORKIESTRATORA. |

## Zmiany (ten commit)

- `gra/src/main.ts`: tylko komentarz przy `debugKillPlayer` (zarzut 4). Logika zapisu/odczytu z 7f08bfcbd bez zmian.
- `gra/tools/save-load-player-owned-city-test.cjs`: mutacje na kopiach przeniesione na `staticFailures()` (zarzut 2).
- `gra/tools/save-load-player-owned-city-live.cjs` (nowy): dynamiczny test #433 (`--mode 433`) i pomiar #432 (`--mode 432`).
- `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY-AND-LEDGER-HISTORY-Q1/30-obrona-claude.md` (ten plik) oraz trzy pliki JSON z wynikami live.

## Dowody dynamiczne #433 (liczby z surowego JSON, seed 4242)

Budowy: `vite build` z kopii gra/ w scratchpadzie (poza repo). Build „poprawka” = main.ts z 7f08bfcbd; build „baza” = main.ts z c284fe02d (kontrola).

- Poprawka (30-live-433-poprawka.json): sesja1 po założeniu miasta playerCities=1; po debugKillPlayer(false) playerCities=0; quickSave ok=true; sesja2 po wczytaniu playerCities=0, **awaitingFirstPlayerCity=false**; endTurn po wczytaniu ok=true, turnAfter=2. **PASS.**
- Baza (30-live-433-baza-kontrola.json): ta sama ścieżka, sesja2 **awaitingFirstPlayerCity=true**; endTurn **timeout at turn 1**. Defekt #433 odtworzony live i naprawiony przez 7f08bfcbd.

Uwaga harnessu: pierwsza próba `--mode 432` z pętlą endTurn wykazała bramkę NNS gracza (endTurn timeout przed dosypką). W trybie 432 dodano dosypkę złota/żywności przed endTurn jak w ai-economy-measure-run.cjs (ta sama bramka, `nnsGateBlocked`/`grantPlayerGold`/`grantPlayerFood`). Tryb 433 bez dosypki (nie była potrzebna).

## Pomiar #432 (live, seed 4242, 3 tury, 30-live-432-skad-zapasy.json)

| Krok | Wpisy w pamięci (wszyscy właściciele) | Pole zapisu (ludzie) |
|---|---|---|
| sesja1 po tk. 2 / 3 / 4 | 1 / 2 / 3 | 1 / 2 / 3 |
| sesja1 PRZED zapisem | 3 | 3 |
| sesja1 saveRoundTrip (ta sama sesja) | — | zapis 3 → po wczytaniu 3 |
| sesja2 PO wczytaniu, PRZED tickiem | **0** | 0 |
| sesja2 PO pierwszym ticku (tura 5) | 1 | 1 |

Wniosek: w nowej stronie wczytanie nie odtwarza dziennika w pamięci (0 przed tickiem), a w tej samej sesji round-trip działa (3 → 3). Strata jest więc w ścieżce trwałości (zapis do IndexedDB / odczyt slotu / reset po wczytaniu w nowej stronie), NIE w samym `restoreLedgerHistoryFromSave` ani w samej migawce. To rozstrzyga „artefakt migawki” na NIE. Nie rozstrzyga, który etap: NIE ZMIERZONO (nie czytałem zawartości slotu IDB; nie sprawdzałem `saveToLocal`/`loadFromLocal` w `gra/src/game/save.ts`).

Korekta własnego błędu: pierwsza wersja pomiaru czytała `historyN()`, które jest stałym limitem tur z ustawień (10), a nie liczbą wpisów. Zastąpione `historyForSave()` / `savedHistory()` (liczba wpisów i bajty). Wyniki z 30-live-432 pochodzą z poprawionej wersji.

## Bramki (liczby z surowego wyjścia)

- `npx tsc --noEmit`: exit 0.
- `node tools/save-load-player-owned-city-test.cjs`: RESULT: PASS (exit 0); mutanty: "bez odczytu" 1 niespełniony, "bez zapisu" 1 niespełniony, oba wykryte.
- `node tools/save-load-roundtrip-state-drift-test.cjs --static-only 1`: "SAVE-LOAD ROUNDTRIP OK", exit 0.
- `node tools/load-game-regression-test.cjs`: "34 PASS / 0 FAIL".
- `node tools/resource-ledger-save-history-test.cjs`: "15 passed, 0 failed".
- Referencyjne: logic-test "LOGIC OK (213/213)"; tech-tree-test "20 pass, 0 fail"; research-test "PASSED: 33 / FAILED: 0"; unit-replace-test "WSZYSTKIE TESTY ZIELONE (21/21)"; combat-test "COMBAT TEST: 6/6 pass".
- `git diff --check`: exit 0.
- Test dynamiczny #433 (poprawka) i pomiar #432: patrz sekcje wyżej.

## Ograniczenia i NIE ZMIERZONO

- #432: przyczyna straty w ścieżce trwałości nieznana. Nie zmieniałem księgi ani zapisu. Kolejna runda powinna sprawdzić zawartość slotu (IDB) po zapisie i to, czy `loadFromLocal` / `saveToLocal` (gra/src/game/save.ts) przepuszcza `resourceLedgerHistory`, oraz czy coś po `restoreGameFromSave` w nowej stronie nie wywołuje resetu dziennika.
- Dynamiczny test #433 nie jest bramką w `package.json` (wymaga zbudowanego dist i przeglądarki); uruchamiany ręcznie.
- Przeglądarka: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (przez flagę --chrome); nic nie pobierano.

## NASTĘPNY KROK

Evaluator: przeliczyć zarzuty 1–2 (test dynamiczny i mutacje) oraz zdecydować o #432 (defekt wymaga kolejnej rundy na trwałość; nie zamykać jako artefakt).

DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA

1. Kandydat 7f08bfcbd nie ma gałęzi (zob. zarzut 5). Przed sprzątaniem worktree zapisz `refs/keep/R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY-AND-LEDGER-HISTORY-Q1-obrona`. Nie tworzyłem gałęzi.
2. `00-dispatch.md` nie istnieje w origin/main (`fatal: path ... does not exist`); jest tylko w `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (DODATEK). Do uzupełnienia przez orkiestratora.
3. Nie uruchamiałem żadnych sesji, zadań ani harmonogramów.
4. Po commicie usunięto `gra/node_modules` (worktree) i kopie buildów w scratchpadzie.
