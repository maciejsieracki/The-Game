STATUS: BLOCK
DOMAIN: GAME (tylko triage testow i harnessu; kod gry nietkniety)
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: triage czerwonych testow bazowych (runda 2/5, baza 12f6435e8 = kandydat r1 + Obrona R2, potomek origin/main 459354a12): pomiar, klasyfikacja A/B/C, poprawki klasy A z mutacja na kopii, tabela przed/po, lista kandydatow B
ZMIANY-COMMIT: BRAK COMMITA tej rundy. Zmiany w worktree NIE sa zacommitowane (Bash zablokowany przez klasyfikator w trakcie rundy). Zmienione pliki (allowlista OK, tylko gra/tools):
  - gra/tools/pr141-combat-defense-owner-route-test.cjs: w owijce harnessu dopisano stan domkniecia main.ts (HUMAN_OWNER_PRIMARY=0, _menuCivIdByOwner, playerCivTypeByHuman) - naprawia ReferenceError; test trafia teraz w realna asercje (patrz nizej)
  - gra/tools/pr141-hotseat-production-owner-routing-test.cjs: vm-harness dostaje prawdziwe deklaracje isCityUnderSiege (game/city-siege-state.ts) i hexHasRoomFor (game/army-stack-limit.ts) - naprawia czesc ReferenceError; PO TEJ ZMIANIE NIEZMIERZONE (ostatni run zablokowany)
  Nic nie zmieniono w gra/src, gra/data, WERSJE.md, manifest. Brak mutacji (zadnej poprawki asercji klasy A w tej rundzie).
BAZA: 12f6435e8fb887503a4af84d09d4083d8552f999 (detach, potomek 459354a12). npm ci w gra/ wykonany (71 pakietow, 13 s).

## 1. Pomiar 17 testow pr141-* (lista wybrana przez Operatora; zmierzone surowe exit code, pierwsza linia bledu)

ZMIERZONO (przed zmianami harnessu, baza 12f6435e8):
| test | exit | wynik / pierwsza linia bledu |
|---|---|---|
| pr141-ai-production-behavior | 0 | PASS |
| pr141-ai-strategy-behavior | 1 | RESULT: 17 passed, 2 failed; "FAIL: high conquest profile declares war in same relation; got []"; "FAIL: risk 8 crosses war threshold at unchanged relation; got []" |
| pr141-combat-defense-behavior | 0 | PASS |
| pr141-combat-defense-owner-route | 1 | ReferenceError: _menuCivIdByOwner is not defined (harness) |
| pr141-combat-offense-behavior | 0 | PASS |
| pr141-dip-activation | 1 | AssertionError: "missing/non-major row preserves caller fallback" |
| pr141-hotseat-diplomacy-owner | 1 | TOTAL 5/10; "diploBrakeBonusFlags is not defined" (harness: zagniezdzona funkcja main.ts:12309 nieobecna w vm) |
| pr141-hotseat-production-owner-routing | 1 | ReferenceError: isCityUnderSiege is not defined (harness) |
| pr141-matrix-only-ai | 1 | "38 passed, 2 failed"; "FAIL: recognized Greek matrix row remains active when explicitly supplied"; "FAIL: recognized Roman partner remains available when explicitly supplied" |
| pr141-matrix-only-combat | 0 | PASS |
| pr141-matrix-only-data-wiki | 0 | PASS |
| pr141-matrix-only-economy | 1 | AssertionError "grecy: gross trade uses only matrix, not poison civ multiplier" (diff 'simple') |
| pr141-matrix-only-owner-ui | 1 | AssertionError "expected owner civKey in availability contexts, found 4" |
| pr141-matrix-only-production | 0 | PASS |
| pr141-population-behavior | 0 | PASS |
| pr141-population-main-happiness-hookup | 0 | PASS |
| pr141-runtime-ordinary-scope | 1 | "FAIL 8/19"; ENOENT lstat dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019 (katalog runu nieobecny w worktree = zaleznosc srodowiskowa, klasa C) |

Uwaga: to nie jest pelny zbior "17 pr141-*" z dispatchu FC (zbior FC nie zostal wymieniony nazwami). Pozostale pr141-* (f04-*, g1-*, ledgery v1/v3/v4, evidence-ledger-behavior, dip-activation-zaleznosci) NIE ZMIERZONO w tej rundzie.

PO ZMIANACH HARNESSU (zmierzone tylko dla owner-route):
- pr141-combat-defense-owner-route: exit 1, pierwsza asercja realna: "walka_obrona_morska: real owner-id battle setup yields defender HP 80 vs foreign 80". Matrix: grecy walka_obrona_morska=0.5, rzymianie=0. Oczekiwano HP obrońcy (grecki owner) > HP przy obcym ownerze; rzeczywiście równo. Klasa: NIEROZSTRZYGNIĘTE (A czy B). Nie ustalono, czy resolveCombat/launchFieldBattleFromMap nie stosuje bonus_obrona/morska do jednostki o rola Morska przy counterTyp Naval (civ-bonuses.ts:241 mapuje na kategorie 'morska'; test podaje Typ Galera/Naval) — hipoteza B do potwierdzenia, bez cytatu kodu w tej rundzie.
- pr141-hotseat-production-owner-routing: po dopisaniu isCityUnderSiege nastepna brakujaca zaleznosc: "ReferenceError: hexHasRoomFor is not defined". Dopisanie hexHasRoomFor (army-stack-limit.ts:70) wykonane w pliku testu, ale NIEZMIERZONE (klasyfikator zablokowal kolejne Bash). Pozostaje do sprawdzenia, czy kolejne zaleznosci (nie ma gwarancji) sie nie kaskaduja.
- pr141-hotseat-diplomacy-owner: NIE RUSZONE w tej rundzie (wymaga wstrzykniecia diploBrakeBonusFlags + getDiploPairMeta/isDiploTickWarBrakeEnabled z main.ts; NIE ZMIERZONO po zmianie).

NIE ZMIERZONO w tej rundzie (jawnie):
- okolica-load-reconcile-test 21/23 (zadanie 4 DODATKU) — brak pomiaru tej rundy; wynik r1 bez zmian.
- defense-breakdown-test 10 FAIL (zadanie 5) — brak pomiaru tej rundy; wynik r1 (23 pass / 10 fail) bez zmian.
- Pozostale pozycje dispatchu (diplo weaker-seeks/main-guard/gate G/truce-r1/r4, map-snapshot-load timeout) — nie uruchamiane w tej rundzie.
- Mutacje na kopii: brak (brak poprawek klasy A w tej rundzie).
- Bramki: tsc --noEmit, 5 referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test), git diff --check — NIE ZMIERZONO w tej rundzie po zmianach harnessu.

## 2. Klasyfikacja pozycji pr141 (wstepna, z surowego wyjscia; bez poprawek)
- C (srodowisko): pr141-runtime-ordinary-scope (brak katalogu runu R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019 w worktree).
- Harness (test-infra, ReferenceError z braku domkniecia main.ts): pr141-combat-defense-owner-route (naprawione, przeszlo do asercji), pr141-hotseat-production-owner-routing (w toku), pr141-hotseat-diplomacy-owner (do naprawy).
- A/B/NIEROZSTRZYGNIETE (wymaga zbadania asercji, bez cytatu w tej rundzie): pr141-ai-strategy-behavior (2 asercje "got []"), pr141-dip-activation, pr141-matrix-only-ai (2 asercje "recognized ... row remains active/available when explicitly supplied"), pr141-matrix-only-economy ("gross trade uses only matrix"), pr141-matrix-only-owner-ui ("found 4" zamiast oczekiwanego), pr141-combat-defense-owner-route (HP 80 vs 80).

## 3. Tabela przed/po (czerwone -> czerwone)
| zakres | przed (baza 12f6435e8) | po (ta runda) |
|---|---|---|
| 17 pr141 z listy Operatora | 9 czerwonych / 8 zielonych | NIE ZMIERZONO ponownie dla wszystkich; owner-route nadal czerwony (z ReferenceError na asercje) |
| defense-breakdown-test | 10 FAIL | NIE ZMIERZONO |
| okolica-load-reconcile-test | 21/23 | NIE ZMIERZONO |

## 4. Kandydaci B (bez potwierdzenia w kodzie)
- Kandydat B: walka obrony morskiej — grecy walka_obrona_morska=0.5 nie zmienia HP obroncy w resolveCombat/launchFieldBattleFromMap (pr141-combat-defense-owner-route, HP 80 = 80). Do potwierdzenia przez Evaluator/FC.
- Kandydat B z r1 (nadal bez potwierdzenia): roznica plonu kamienia 50 vs 55; linie 0% w defenderCivBonusBreakdown dla zerowych wpisow civ-matrix.

## 5. Dlaczego BLOCK
Runda nie domknela zadania: brak commita z praca, brak mutacji, brak pomiaru 2 z 3 wskazanych grup (okolica, defense-breakdown) i brak bramek po zmianach. Zgodnie z kontraktem raport bez commita = BLOCK. Zmiany harnessu pozostaja w worktree do zacommitowania przez nastepna runde lub orkiestratora.

RUNDY: 2/5 (Operator HAIKU, runda 2 — pierwsza nieudana runda Haiku tego tematu jest r1; Sonnet na Operatorze wymaga dwoch nieudanych rund, wiec nie uzasadniony w tej rundzie).
NASTEPNY KROK: (1) zacommitowac dwie zmiany harnessu (git add <dwie sciezki>, nie -A); (2) zmierzyc pr141-hotseat-production-owner-routing i pr141-combat-defense-owner-route ponownie; (3) pomierzyc okolica-load-reconcile i defense-breakdown (zadania 4 i 5 DODATKU); (4) klasyfikacja A/B z cytatami asercji; (5) mutacje na kopii dla kazdej poprawki A; (6) bramki tsc 0 + 5 referencyjnych + git diff --check.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Klasyfikator bezpieczenstwa Bash zwracal brak werdyktu (blad przejsciowy) w trakcie rundy; stad brak commita. Prosze o ponowne uruchomienie tej rundy po stabilizacji.
- Nie utworzono zadnych sesji, zadan ani harmonogramow.
