STATUS: BLOCK
DOMAIN: GAME (tylko testy i narzędzia w gra/tools; kod gry nietknięty)
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: odpowiedź Obrony na zarzuty Evaluatora (runda 1, baza a55333602); poprawki klasy A z mutacją, tabela przed/po, klasyfikacja B/C.
BAZA: a553336024de5cdd8f7b6891c65b26dee39595dc (detach), npm ci w gra/ wykonany wcześniej (57 wpisów w node_modules).

## 1. Odpowiedź na zarzuty Evaluatora

| nr | zarzut | decyzja | dowód |
|---|---|---|---|
| 1 | cele 3 i 4 niespełnione, brak poprawek klasy A, brak tabeli przed/po | PRZYJMUJĘ częściowo | Wykonane poprawki klasy A: `budynek-civ-bonus-u17-test.cjs`, `defense-breakdown-test.cjs` (TypeError). NIE wykonane w tej rundzie: harness 7× `ReferenceError` (pr141), dryf ledgerów (2 testy), okolica-load-reconcile, diplo weaker-seeks/main-guard/gate/truce, map-snapshot. Tabela przed/po w sekcji 2. |
| 2 | ok. 10 pozycji bez klasyfikacji lub „nie zbadano” | PRZYJMUJĘ | Nie uzupełniam w tej rundzie: pr141-dip-activation, matrix-only-economy, matrix-only-owner-ui, matrix-only-ai, ai-strategy, okolica-load-reconcile, defense-breakdown (pozostałe 10 asercji), ledgery. Pozostają jako „NIE ZBADANO w rundzie 2”. |
| 3 | u17: przyczyna błędnie opisana (nie ma zaszytego 50; to fixture; B lub zły fixture) | PRZYJMUJĘ | Probe na silniku (ten sam bundle co test): `computeTerritoryResourceYieldByCity` kamien = 50; `advanceCityEconomy` bez Warsztatu kamien = 55 (identycznie dla population 0 i 3). Różnica 5 nie jest premią bez Warsztatu z danych. Źródło różnicy nie wyizolowane (założenie: plon pracy miasta liczony w advanceCityEconomy poza `computeTerritoryResourceYieldByCity`). Poprawka: baza = wynik SILNIKA bez Warsztatu, mnożnik testowany względem niej. Asercja „2 Warsztaty w jednym mieście” przechodziła przypadkiem (floor(50*1.2)=60 = floor(55*1.1)); silnik liczy Warsztat raz na miasto (`includes`), więc test przepisany na 2 miasta tego samego właściciela (suma 132). |
| 4 | defense-breakdown: `grecy.bonusy` nie istnieje; faktyczny błąd to TypeError; nieskorygowany | PRZYJMUJĘ | Rekord Grecy w civs.json nie ma pola `bonusy` (klucze: Cywilizacja…nazwyMiast). Bonusy przeniesiono do civ-matrix (`civMatrixBonusyForCivKey`, civ-bonuses.ts). Test czyta teraz `civMatrixBonusyForCivKey('grecy')`. Asercje o `jednostka_specjalna` i `bonus_zloto` w `bonusy[]` zastąpione wpisami syntetycznymi dla filtru `isDefenseOnlyCivBonus` (wpis `jednostka_specjalna` w civs.json jest w polu 'Jednostka specjalna'). Pozostałe 10 FAIL: patrz sekcja 3. |
| 5 | grupa 7× pr141 ReferenceError (harness wycina z main.ts) nieanalizowana | PRZYJMUJĘ | Nie naprawione w tej rundzie. Ustalone tylko: `diploBrakeBonusFlags` jest zagnieżdżoną funkcją w `src/main.ts:12309` (nie eksportowaną), więc wycinanie po nazwie z pliku nie działa bez zmiany wzorca. Nie zbadano pozostałych 6 symboli. |
| 6 | dispatch mówi o „4 testach pr141-*”, Operator objął 17 | PRZYJMUJĘ | Dispatch nie wymienia nazw czterech testów; w rundzie 1 objęto wszystkie czerwone pr141 (17 z 33 plików pr141). Zakres do potwierdzenia przez FC. |
| 7 | commit a55333602 nadpisał wcześniejszy 10-operator-claude.md (inna runda, baza 37bcf8ebb) | PRZYJMUJĘ (potwierdzone) | `git log -- …/10-operator-claude.md`: 5bed9d7cc (R1 na bazie 37bcf8ebb, „naprawy harnessu i okna testów”) i a55333602 (triage na 459354a12). Poprzednia wersja jest w 5bed9d7cc. Nie przywracam jej w tym temacie. Ten raport (30-obrona) jest zapisany osobno. |
| 8 | brak dowodu mutacyjnego | PRZYJMUJĘ częściowo | Wykonane (sekcja 4): u17 (2 mutacje na kopii silnika), defense-breakdown (1 mutacja na kopii defenseBreakdown.ts). NIE wykonane dla pozostałych testów (nie zmieniano ich). |
| 9 | brak potwierdzenia sprzątania | PRZYJMUJĘ | Usunięte: kopie mutantów i pliki probe w scratchpad (sekcja 5). Worktree i gra/node_modules zostają do sprzątania przez orkiestratora. |

## 2. Tabela przed / po (surowe wyniki z uruchomień)

| test | przed (a553336) | po (ta runda) | zmiana |
|---|---|---|---|
| budynek-civ-bonus-u17-test | `3 passed, 3 failed` (got 55 want 50; got 60 want 55; got 60 want 55) | `6 passed, 0 failed` | ZIELONY (klasa A) |
| defense-breakdown-test | exit przez wyjątek: `TypeError … reading 'find'` (grecy.bonusy) | `=== defense-breakdown-test: 23 pass, 10 fail ===` | nie ma już TypeError; 10 FAIL to dane/decyzje (sekcja 3) |
| pozostałe 18 plików czerwonych | NIE ZMIERZONO w tej rundzie | NIE ZMIERZONO w tej rundzie | bez zmian w kodzie testów |

Liczba czerwonych plików z listy dispatchu (20 = 3 + 17 pr141): przed 20, po 19 (u17 zielony, defense nadal czerwony).

## 3. Klasyfikacja pozostałych FAIL defense-breakdown (NIE naprawiane)

Eksperyment na kopii (nie w commicie): odfiltrowanie wpisów `wartosc === 0` z `civMatrixBonusyForCivKey('grecy')` → `35 pass, 5 fail`. Czyli 5 z 10 FAIL wynika z zerowych wpisów matrix (`walka_hp_piechota`, `walka_hp_rydwany` itd.), które `defenderCivBonusBreakdown` zamienia w linie (`civBonusOpisPl` daje etykietę PL, nie surowe ID).

| FAIL | klasa | uzasadnienie |
|---|---|---|
| Roster kawalerii/rydwanów: lista PUSTA (oczekiwano) | B-KANDYDAT | zerowy wpis `walka_hp_rydwany` produkuje linię; do potwierdzenia, czy linie 0% są zamierzone |
| Roster mieszany: 1 linia (Falanga) | B-KANDYDAT | jak wyżej (zerowe wpisy piechoty) |
| Roster cała piechota: 4 z 4 | B-KANDYDAT | jak wyżej |
| cityDefenseBreakdownLines: 4 linie, otrzymano 5 | B-KANDYDAT | jak wyżej |
| cityDefenseBreakdownLines bez trudności: 3 linie | B-KANDYDAT | jak wyżej |
| bonusChipTexts(Grecy): 1 chip | A (dane) po decyzji o zerach | liczba chipów zależy od wpisów matrix |
| Bonus leśny na Las: DOKŁADNIE 1 linia | DECYZJA DANYCH | `walka_obrona_piechota_teren_las` dla Grecy = 0 w civ-matrix; test zakłada bonus leśny Grecji. Wymaga decyzji właściciela (0 zamierzone czy zgubione) |
| Bonus leśny bez terrain | DECYZJA DANYCH | jak wyżej |
| Falanga: tekst zaczyna się od opisu z civs.json | A (dane) | pole `opis` wpisu z civs.json zniknęło; tekst pochodzi z etykiety matrix |
| REGRESJA Falanga bez warunku terenowego: 3 z 3 | B-KANDYDAT | przy zerach liczba wpisów nie zgadza się z oczekiwaniem |
| cityDefenseBreakdownLines(terrain=Las): „undefined” | B-KANDYDAT | do potwierdzenia w kodzie `defenseBreakdown.ts` (wartość 'undefined' w tekście) |

Nie potwierdzono w kodzie gry, że linie 0% są błędem. Klasyfikacja B jest hipotezą do potwierdzenia przez FC.

## 4. Mutacje (na kopiach, nie w repo)

| test | mutacja | wynik |
|---|---|---|
| u17 | M1: `kamienMult = 1 + k * Math.min(1, count)` (bez mnożenia per miasto) | `FAIL: 2 Warsztaty w 2 miastach … (got 120, want 132)`; `5 passed, 1 failed` — test wykrywa |
| u17 | M2: `kamienMult = 1 + 0 * count` (Warsztat bez efektu) | `FAIL: 1 Warsztat … (got 55, want 60)`; `FAIL … 2 Warsztaty (got 110, want 132)`; `3 passed, 3 failed` — test wykrywa |
| defense-breakdown | filtr `isDefenseOnlyCivBonus` bez gałęzi `realizuje === 'walka'` | nowy `FAIL: isDefenseOnlyCivBonus odrzuca bonus ekonomiczny`; `22 pass, 11 fail` (przed mutacją 23/10) — test wykrywa |

## 5. Sprzątanie

Usunięto: `gra/tools/.probe-u17.cjs` (plik roboczy, nie w commicie), kopie mutantów `mut1`/`mut2` w scratchpad (kopie `src`, `data`, `tools`), pliki probe w scratchpad. Usuwanie `gra/node_modules` i worktree zostawiam orkiestratorowi (po Final Control).

## 6. Pliki zmienione w commicie

- `gra/tools/budynek-civ-bonus-u17-test.cjs` (mnożnik względem bazy silnika, test 2 miast, bez asercji zaszytego 50)
- `gra/tools/defense-breakdown-test.cjs` (źródło bonusów: civ-matrix; bundle civ-bonuses.ts; syntetyczne wpisy dla filtrów; unlink bundla)
- `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BASELINE-Q3/30-obrona-claude.md` (ten raport)

## 7. Kandydaty do osobnych tematów (UWAGI-DLA-ORKIESTRATORA)

- R-WEB-DEFENSE-BREAKDOWN-ZERO-MATRIX-LINES-Q1 (B-kandydat, do potwierdzenia): linie breakdown dla wpisów matrix o wartości 0.
- Decyzja danych: Grecy `walka_obrona_piechota_teren_las` = 0 wobec testu zakładającego bonus leśny (do ABC).
- Źródło 5 jednostek różnicy plonu kamienia (50 vs 55) między `computeTerritoryResourceYieldByCity` a `advanceCityEconomy` — do zbadania (potencjalny dryf podglądu).
- Nie wykonano: 7× pr141 harness, ledgery, okolica-load-reconcile, diplo, map-snapshot.

NASTĘPNY KROK: runda 2 Operatora — pr141 harness (7 testów), ledgery, okolica-load-reconcile, diplo weaker-seeks/main-guard/gate/truce, map-snapshot; następnie Evaluator i FC.
BLOKADY: czas i zakres rundy; pozostałe klasy A nie wykonane; decyzja danych (Grecy las) wymaga właściciela.
RUNDY: 2/5 (Operator R1 = a553336, Obrona = ta runda)
ZMIANY-COMMIT: gra/tools (2 pliki testów) + raport 30-obrona-claude.md; bez zmian w gra/src i gra/data.
TESTY: u17 6/0 (zielony); defense 23 pass / 10 fail; tsc i pięć referencyjnych bramek NIE uruchomione w tej rundzie (zmiany tylko w tools/*.cjs, nie w src); git diff --check OK.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: nie utworzono żadnych sesji, zadań ani harmonogramów. Commit 5bed9d7cc (poprzednia runda, inna baza) — patrz zarzut 7. Ten plik nadpisał poprzedni raport Obrony z rundy na bazie 37bcf8ebb (wersja w git: `git show a553336024de5cdd8f7b6891c65b26dee39595dc:dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BASELINE-Q3/30-obrona-claude.md`); zgodnie z dispatchem ścieżka raportu tej rundy jest ta sama.
