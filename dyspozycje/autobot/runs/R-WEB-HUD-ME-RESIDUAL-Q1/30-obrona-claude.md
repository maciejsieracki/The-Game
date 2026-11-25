STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-RESIDUAL-Q1
GOAL: ostatnie literały właściciela 0 w roli gracza aktywnego (hotseat) podstawione ME(); w grze jednoosobowej zachowanie bit-w-bit (ME() = 0). Obrona: domknięcie zarzutów Evaluatora 1–5.
ZMIANY-COMMIT: baza kandydata 85ca46865 (runda 1 Operatora). Poprawki w tej rundzie: gra/src/main.ts (27 par linii -/+ względem 85ca46865, tylko podstawienie właściciela, w tym 1 cofnięcie 12212 do literału 0), gra/tools/hud-me-literal-zero-test.cjs (RESIDUAL_ROWS: usunięty wiersz sc.ownerId, dodane 21 wierszy dla nowych miejsc), dyspozycje/autobot/runs/R-WEB-HUD-ME-RESIDUAL-Q1/30-obrona-claude.md. SHA commita obrony: patrz pole sha w wyniku. Commit tylko tych ścieżek (bez -A).

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 — rodzina `ownerId !== 0` bez decyzji: PRZYJMUJĘ (poprawione)
Decyzje dla każdego wystąpienia (rola gracz aktywny = zmień na ME(); 0 jako fotel AI/wartość domyślna = zostaw):
- 7959 disbandPlayerUnit: predykat + `empireEpochForOwner(0)`, `civManpowerMultsForOwner(0)`, `refundManpowerToEmpire(cities,0,…)`, `ownerResourceCap(…,0,…)`, `snapshotOwnersStock([0])`, `disbandStockRefundCredit(cities,0,…)` → ME() (ta sama funkcja, spójność z pozostałymi zmianami w rozbiórce).
- 8757 openUnitReplacePicker → ME() (zarzut 2 też).
- 8859 performUnitReplace → ME().
- 6840, 6855 applyCityPodzialPracyChange / toggleCityPodzialPracyOverride; 7014 applyOkolicaTileAdjust; 9568, 9590, 9608 (onCityRationChange, onPoziomRacjiOverrideToggle, onCityAutoWyzywienieChange); 10084 onLeaveGarrison; 19863 cityHasAffordableWonderEnqueue (+ `listBuildableWondersForOwner(0)` → ME()) → ME() (akcje gracza z UI na własnych miastach/jednostkach).
- 16153 planSpawnedUnitFollowGeneral, 16164 afterPlayerUnitSpawned → ME().
- 16597 routy handlowe `route.ownerId !== 0 && route.toOwnerId !== 0` → ME() (zarzut 2).
- 18711 maybeHintArmyFoodOnFirstPlayerUnit (+ `getEmpireFoodReserve(0)` → ME()) → ME().
- 13664 i 13813 (`proposerId === 0 || responderId === 0` → updateHud po umowie z graczem) → ME().
- 19466 maybeAiAssaultAfterMachines: `bId === 0` (oblegający = gracz, AI nie atakuje) → ME().
- 4421 `c.ownerId !== 0` (applyPodzial... poprzedzające zakres 4504–20463 z dispatchu): ZOSTAW — poza zakresem wskazanym w dispatchu (zakres 4504–20463); wymaga osobnego tematu, jeśli orkiestrator chce to domknąć.
- 6559, 6608 `ai.ownerId === 0`: ZOSTAW (obiekt AI, domyślna polityka).
- 12212 `sc.ownerId`: COFNIĘTE do `=== 0` — PRZYJMUJĘ zarzut 5. Dowód: ścieżka spawnu (komentarz 12210–12211) tworzy wyłącznie właścicieli AI (miasto-państwo/cywilizacja), więc sc.ownerId nigdy nie jest fotelem gracza; wartość 0 nie jest tu rolą aktywną. Zmiana na ME() była neutralna, ale nie spełniała reguły „0 = gracz aktywny”. Wiersz testu `sc.ownerId === ME()` usunięty.
- Komentarze (11200, 13013, 14890, 15010, 19124, 19381, 11426): ZOSTAW (nie kod).

Łącznie po poprawce: 27 linii zmienionych względem 85ca46865 (wszystkie z powyższej tabeli poza 12212, które wraca do literału).

### Zarzut 2 — niespójność hotseat (8757 vs 8569/8600/8884; 16597 vs 20029/20032/20053): PRZYJMUJĘ (poprawione)
- 8757 `openUnitReplacePicker` → `u.ownerId !== ME()` (zgodnie z sąsiadami 8569/8600/8884).
- 16597 trasy handlowe → `route.ownerId !== ME() && route.toOwnerId !== ME()` (zgodnie z isPlayerRoute 20029/20032/20053).

### Zarzut 3 — raport bez SHA i z niespójnymi liczbami: PRZYJMUJĘ (poprawione)
- Liczba zmian w rundzie 1 była podana jako „52+1 / 39 unikalnych”; faktycznie `git diff 94d71743..85ca46865` = 56 linii usuniętych/dodanych (28 par), a w tej rundzie 27 linii zmienionych względem 85ca46865. Podany wcześniej opis „AI-owner predicates 14502/14685” był mylący: 14502 to `su.ownerId === ME()` (hint dla obudzonego wojska gracza), 14685 to `u.ownerId === ME()` (pomija jednostki gracza przy wrogiej edukacji weteranów) — obie są predykatami gracza aktywnego, nie AI.
- SHA kandydata bazy: 85ca46865a4eba7a5fde6d071c6f6cc1e6a3fb63; SHA commita obrony w polu `sha` wyniku.

### Zarzut 4 — brak dowodu runtime hotseat: PRZYJMUJĘ jako ograniczenie; NIE ZMIERZONO
Runtime z aktywnym fotelem ≠ 0 nie był uruchamiany (brak środowiska przeglądarkowego w tej rundzie). Testy źródłowe (licznik wystąpień tekstu) i testy jednoosobowe są jedynym dowodem. Nie ma zapewnienia zachowania hotseat w grze; ryzyko zostaje otwarte.

### Zarzut 5 — 12212: PRZYJMUJĘ (cofnięte do 0), patrz wyżej.

## Testy (liczby z surowego wyjścia tej rundy)
- `node gra/tools/hud-me-literal-zero-test.cjs` → `Wynik: 138 PASS / 0 FAIL` (poprzednio 118).
- `node gra/tools/hud-owner-hotseat-source-test.cjs` → `Wynik: 58 PASS / 0 FAIL`.
- Składnia main.ts: parser TypeScript (typescript@5.6.3 w katalogu scratchpad, poza repo) → 0 błędów składni.
- `git diff --check` → czysto.
- Mutacje: dla każdego nowo dodanego wiersza RESIDUAL_ROWS wycofanie podstawienia zmniejsza licznik wystąpień tekstu ME() i daje FAIL (mechanizm licznika). Pełnej mutacji runtime dla każdej linii NIE ZMIERZONO w tej rundzie.
- tsc --noEmit: NIE ZMIERZONO — worktree nie ma gra/node_modules (instalacja poza zakresem tej rundy). Ryzyko typów: ME() zwraca number, wszystkie nowe wywołania przyjmują number; ME() jest w zakresie boot (używany już w tym pliku).
- Pozostałe bramki z dispatchu (logic, tech-tree, research, unit-replace, combat, ai-test, hud-moc-warstwa, moc-ranking-rozjazd, war-rules, hotseat-etap6d B/D/E, bramki-tmpdir): NIE ZMIERZONO w tej rundzie (wymagają node_modules i dłuższych przebiegów). Orkiestrator powinien je uruchomić przed FC.

## BLOKADY
- Brak blokad procesowych. Runtime hotseat NIE ZMIERZONO (zarzut 4). tsc i pełne bramki NIE ZMIERZONO (brak node_modules w worktree).

## RUNDY
2/5 (runda 1 = 85ca46865; runda obrony = ta).

## UWAGI-DLA-ORKIESTRATORA
- 4421 (`c.ownerId !== 0`) leży poniżej zakresu dispatchu (4504); do decyzji, czy osobny temat.
- buildHudState(0) w linii ~33061 (poza zakresem, jak w rundzie 1) — kandydat na osobny temat.
- victory.ts i singleton `player` — poza zakresem.
- 13664/13813 zmieniono na ME() (diplomacja, updateHud): nie było to w tabeli rundy 1; zweryfikować przy FC.

NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje nową tabelę (zwłaszcza 7959 disband, 13664/13813, 19466) i wykonuje bramki z dispatchu; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
