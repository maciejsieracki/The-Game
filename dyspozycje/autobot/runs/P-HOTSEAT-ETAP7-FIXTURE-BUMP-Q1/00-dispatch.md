STATUS: DISPATCH
DOMAIN: INFRA
TEMAT: P-HOTSEAT-ETAP7-FIXTURE-BUMP-Q1
GOAL: Napraw 2 bramki testowe (`gra/tools/barb-camp-blacklist-test.cjs`,
`gra/tools/fsa-autosave-test.cjs`), które po integracji `R-HOTSEAT-ETAP7-SAVELOAD-Q1`
(format zapisu v3, zintegrowany, commit `67f20587`) mają fixture'y zapisów w starym
formacie (`wersja:1`/`wersja:2`) — potwierdzone przez Operator/Evaluator/Final Control
Etapu 7 jako czysty problem fixture'u, nie regres logiki zapisu.

KONTEKST:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP7-SAVELOAD-Q1/01-operator-runda1.md`/
  `02-evaluator-runda1.md`/`03-final-control-runda1.md` — opis obu FAIL: `barb-camp-
  blacklist-test.cjs` CRASHUJE na fixturze `wersja:1` (nie tylko FAIL asercji — prawdopodobnie
  `IncompatibleSaveFormatError` rzucany tam gdzie test tego nie oczekuje); `fsa-autosave-
  test.cjs` ma 2 z ok. 55 asercji FAIL na fixturze `wersja:2`.
- Zgodnie z ABC-4 (`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`) NIE ma funkcji migrującej
  v2→v3 — więc naprawa NIE polega na wywołaniu migracji, tylko na zaktualizowaniu SAMYCH
  fixture'ów testowych do formatu v3 (`gracze[]`/`exploredByHuman`/`humanOwnerIds`/
  `activeHumanOwnerId`, `wersja:3`) tak, żeby testy nadal sprawdzały to co miały sprawdzać
  (logikę blacklisty obozów barbarzyńskich / logikę autosave), tylko na aktualnych danych.

ZADANIE:
1. Uruchom oba testy na dzisiejszym `main`, zdiagnozuj dokładną przyczynę FAIL/crash.
2. Zaktualizuj fixture(y) w obu plikach testowych do formatu v3 (`wersja:3`,
   `gracze`/`exploredByHuman`/`humanOwnerIds`/`activeHumanOwnerId` zamiast
   `gracz`/`explored`) — zachowaj SEMANTYKĘ danych testowych (te same miasta/jednostki/
   stan, tylko w nowym kształcie pól), nie zmieniaj logiki testowanej funkcji.
3. Potwierdź że oba testy przechodzą w 100% (wszystkie asercje, nie tylko te wcześniej
   failujące) i że nadal wykrywają regresję — zweryfikuj przez tymczasowe zepsucie
   testowanej logiki i pokazanie że test wtedy faktycznie czerwienieje.
4. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone (nie powinny być dotknięte).

BINARNE KRYTERIUM SUKCESU: `barb-camp-blacklist-test.cjs` i `fsa-autosave-test.cjs` w
100% PASS na dzisiejszym main, oba nadal wykrywają regresję (dowód: świadome zepsucie →
FAIL), zero zmian w `gra/src/**`.

ALLOWLISTA:
- `gra/tools/barb-camp-blacklist-test.cjs`
- `gra/tools/fsa-autosave-test.cjs`
- `dyspozycje/autobot/runs/P-HOTSEAT-ETAP7-FIXTURE-BUMP-Q1/*`
Zakaz `git add -A`. Zakaz zmian w `gra/src/**` (to jest naprawa fixture'ów testowych,
nie logiki gry).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji naprawy bez pokazania że test nadal
wykrywa regresję (nie tylko że przechodzi na dzisiejszym poprawnym kodzie).

IZOLACJA: worktree `/home/user/wt-hotseat-etap7-fixture-bump`, gałąź
`autobot/P-HOTSEAT-ETAP7-FIXTURE-BUMP-Q1`, baza `origin/main` @ `e9837db6`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — DOMAIN: INFRA, ale wciąż kod (test), więc Final Control wymagany.
DEPLOY/PUSH: NIE WYKONANO
