STATUS: BLOCK
DOMAIN: GAME (tylko triage testów; kod gry nietknięty)
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: triage czerwonych testów bazowych na origin/main 459354a12 (krok 1: pomiar; krok 2: klasyfikacja A/B/C; krok 3: poprawki testów klasy A z mutacją na kopii; krok 4: tabela przed/po)
ZMIANY-COMMIT: brak zmian w gra/tools ani gra/src; commit tylko tego raportu. Poprawki testów (krok 3) NIE wykonane w tej rundzie.
BAZA: 459354a12e00eb04cc8365c5ac03a03c2ffec999 (detach). npm ci w gra/ wykonany (71 pakietów).

## 1. Pomiar na main (surowe wyniki z node tools/<test>.cjs)

Wskazane w dispatchu jako czerwone:

| test | wynik na main | przyczyna (z logu) | klasa wstępna |
|---|---|---|---|
| okolica-load-reconcile-test | FAIL 21/23 | (1) asercja umieszczenia wywołania reconcile między końcem pętli cities.push a linią playerEverOwnedCity; (2) "punkt mutacji zlokalizowany dokladnie" - wzorzec występuje 3x w main.ts (linie 6599, 17281, 49239), test oczekuje 1x | B-kandydat lub A; wiring w restore nieweryfikowany do końca w tej rundzie; 21 asercji behawioralnych PASS |
| defense-breakdown-test | TypeError: grecy.bonusy undefined (linia 172) | test czyta pole bonusy z wpisu Grecy; struktura data/civs.json NIE sprawdzona w tej rundzie | A-kandydat, do potwierdzenia |
| budynek-civ-bonus-u17-test | 3 pass / 3 FAIL | "bez Warsztatu: kamien = baza z mapy (got 55, want 50)"; "1 Warsztat: kamien x1.10 floor (got 60, want 55)"; "Warsztat kamieniarski: kamien x1.10 (got 60, want 55)" | A: test ma zaszyte baseKamien=50, a baza z mapy to 55; floor(55*1.1)=60 zgodne z regułą. Poprawka: wyprowadzić oczekiwanie z bazy z mapy. Wymaga mutacji |

Pozostałe pozycje pr141-*:

| test | wynik na main | przyczyna (z logu) | klasa wstępna |
|---|---|---|---|
| pr141-ai-strategy-behavior-test | 17 pass / 2 FAIL | "high conquest profile declares war in same relation; got []"; "risk 8 crosses war threshold at unchanged relation; got []" | B-kandydat (zachowanie AI) |
| pr141-combat-defense-owner-route-test | ReferenceError _menuCivIdByOwner | symbol istnieje w src (1 plik), test nie widzi go w swoim kontekście | A-kandydat (harness) |
| pr141-current-evidence-ledger-test | Error "raw value differs from matrix meta_mnoznik_waluta/asyria" | dryf ledgera vs matrix | A-kandydat |
| pr141-current-evidence-ledger-v3-test | Error "current per-cell status differs ... prod_szybkosc_jednostki_proc/grecy" | dryf ledgera | A-kandydat |
| pr141-current-evidence-ledger-v4-test | ENOENT dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-DECISION-CLOSEOUT-20261018/evidence/matrix-93x15-current-evidence-ledger-v4.json | brak artefaktu w repo | C (środowiskowy) |
| pr141-evidence-ledger-behavior-test | ENOENT /workspace/pr141-review/current-consumers.json | ścieżka poza repo | C |
| pr141-runtime-ordinary-scope-test | FAIL 8/19; ENOENT dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019 | brak katalogu w worktree | C |
| pr141-dip-activation-test | AssertionError "missing/non-major row preserves caller fallback" | nie zbadano | B/A do potwierdzenia |
| pr141-f04-building-speed-activation-test | ReferenceError prod is not defined | harness | A-kandydat |
| pr141-f04-unit-speed-activation-test | ReferenceError recStackFree is not defined | harness (symbol w src, 1 plik) | A-kandydat |
| pr141-hotseat-diplomacy-owner-test | 4x FAIL "diploBrakeBonusFlags is not defined" | harness (symbol w src, 1 plik) | A-kandydat |
| pr141-hotseat-production-owner-routing-test | ReferenceError isCityUnderSiege is not defined | harness | A-kandydat |
| pr141-matrix-only-ai-test | 38 pass / 2 FAIL | "recognized Greek matrix row remains active when explicitly supplied"; "recognized Roman partner remains available when explicitly supplied" | B lub A (dane matrix), do potwierdzenia |
| pr141-matrix-only-economy-test | AssertionError "grecy: gross trade uses only matrix, not poison civ multiplier" | nie zbadano | B/A do potwierdzenia |
| pr141-matrix-only-owner-ui-test | AssertionError "expected owner civKey in availability contexts, found 4" | nie zbadano | B/A do potwierdzenia |
| pr141-saveload-mp-f05-g11-behavior-test | ReferenceError showHintMessage is not defined | harness | A-kandydat |
| pr141-semantic-consumer-consistency-test | ReferenceError battleUnitCivBonusy is not defined | harness (symbol w src, 2 pliki) | A-kandydat |

Zielone na main (bez zmian): pr141-ai-production-behavior 23/0; pr141-combat-offense-behavior 75/0; pr141-f04-cost-activation-defense 64/0; pr141-f04-cost-activation 20/0; pr141-f04-rush-activation 72/0; pr141-f04-society-activation 34/0; pr141-f04-society-remaining-activation 192/0; pr141-matrix-only-combat 36/0; pr141-matrix-only-data-wiki OK; pr141-matrix-only-production 96/0; pr141-population-behavior 24/0; pr141-population-main-happiness-hookup 7/0; pr141-combat-defense-behavior, pr141-f04-work-activation, pr141-f04-yields-activation, pr141-g1-combat-activation (exit 0, bez podsumowania liczbowego).

Zielone na main w tym pomiarze (pozycje z dispatchu, które NIE są już czerwone):
- diplo-peace-weaker-seeks-city-only-test: 35 pass / 0 fail
- diplo-truce-r1-test: 31 pass / 0 fail
- diplo-truce-r4-ai-test: 24 pass / 0 fail
- diplo-war-peace-main-guard-test: 35 pass / 0 fail
- diplo-war-peace-gate-test: 24 pass / 0 fail
- diplomacy-sensible-deals-main-guard-test: 22 pass / 0 fail
- map-snapshot-load-test: 58 pass / 0 fail / 1 known-fail (nie liczy się do exit code), 89 s, exit 0

Uwaga o rozbieżności: dispatch mówi o "4 testach pr141-*"; na main czerwonych jest 17 plików pr141-*. Dispatch nie wskazał, które 4, więc przyjęto pełny zbiór pr141-*-test.cjs.

## 2. Przed / po
- Przed (pomiar 459354a12): czerwone pliki = 3 (okolica-load-reconcile, defense-breakdown, budynek-civ-bonus-u17) + 17 pr141-* = 20.
- Po: NIE WYKONANO (poprawki testów nie zrobione w tej rundzie).

## 3. Kandydaci (B) do R-WEB-*
- pr141-ai-strategy-behavior-test: AI nie deklaruje wojny przy profilu conquest / progu risk 8 (got []). Do potwierdzenia: regresja zachowania AI czy zmiana reguł.
- pr141-matrix-only-ai-test: rozpoznany wiersz grecki/rzymski nie pozostaje aktywny przy jawnym podaniu. Do potwierdzenia.
- okolica-load-reconcile: jeśli wiring reconcile w ścieżce restore zniknął, to realny defekt (wczytanie zapisu nie porządkuje obsadzenia kafli). Do zweryfikowania.

## 4. Kolejne kroki (runda 2)
1. Dla grupy ReferenceError (A-kandydat) sprawdzić, czy symbol jest wyciągany regexem z src, i zaktualizować wzorzec w teście.
2. Dla budynek-civ-bonus-u17: oczekiwanie wyprowadzić z realnej bazy z mapy, mutacja na kopii.
3. Dla ENOENT (C): zapisać brak artefaktów jako środowiskowe, bez osłabiania asercji.
4. Zamknąć klasyfikację B/A dla pozycji "nie zbadano".

NASTĘPNY KROK: runda 2 Operatora (poprawki klasy A, mutacje na kopii, tabela przed/po).
BLOKADY: brak czasu na pełną klasyfikację B/A i na mutacje w tej rundzie; gra/tools i gra/src nietknięte.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: nie utworzono żadnych sesji, zadań ani harmonogramów.
