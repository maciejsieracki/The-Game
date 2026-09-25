# 00-dispatch — Meta parameter removal Final Control

STATUS: DISPATCH READY
ROLE: Final Control (independent — third reviewer, no access to Operator/Evaluator reasoning)
TOPIC: R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922
ROUND: 1/5
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-meta-remove-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922
MODEL: claude-sonnet-5
PROVIDER: anthropic

## CONTEXT

Operator round 1: PASS. Evaluator round 1: PASS (bez zarzutu blokującego,
1 uwaga nieblokująca — dwa niezmienione wygenerowane bundle pliki spoza
allowlisty, `gra/tools/.dip-audit-bundle.cjs` i `.scc-bundle.cjs`, zawierają
stare odwołania sprzed tego tematu). Obrona pominięta (brak zarzutu
blokującego). Przeczytaj:
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922/OWNER-DECISION-20260922.md`
- `01-operator.md`, `01-evidence.json`
- `02-evaluator.md`

## ZADANIE

Trzecia, niezależna weryfikacja przed dopuszczeniem do integracji. Nie
powtarzaj mechanicznie tego, co zrobili Operator/Evaluator — skup się na
pytaniach WYŻSZEGO POZIOMU, które oni mogli pominąć skupieni na szczegółach:

1. Czy usunięcie tych 4 parametrów jest FAKTYCZNIE zgodne z decyzją
   właściciela (przeczytaj OWNER-DECISION w całości) — nie tylko
   mechanicznie, ale w duchu polecenia?
2. Czy usunięcie `REFERENCE_ONLY` z typu `CivMatrixConsumerStatus` w
   `civ-matrix-semantic.ts` nie zostawia gdzieś w kodzie (poza dwoma
   plikami testowymi już sprawdzonymi) martwego odwołania do tej wartości
   typu, które nie zostało złapane przez `tsc` (np. w stringu, JSX,
   dynamicznym dostępie) — zrób własny, szeroki grep po całym `gra/src`.
3. Czy pozostałe 109 parametrów (w tym `meta_mnoznik_waluta`, jedyny
   pozostały parametr meta) są nadal w pełni nienaruszone — porównaj
   WARTOŚCI (nie tylko klucze) każdego z pozostałych parametrów przed/po
   dla przynajmniej 3 losowo wybranych cywilizacji, żeby wykluczyć
   przypadkowe przesunięcie/nadpisanie sąsiednich kluczy w JSON.
4. Czy diff jest gotowy do bezpiecznej integracji do `main` (czy potrzebna
   jest jeszcze jakakolwiek akcja przed integration gate) — np. czy branch
   jest aktualny względem `origin/main` (sprawdź czy ktoś inny wypchnął coś
   nowego w międzyczasie, co mogłoby kolidować).
5. Zdecyduj: czy commitować teraz roboczy diff w tym worktree (Operator go
   zostawił niezacommitowany celowo, bo ACCEPTANCE zabraniał mu
   commit/push/merge/deploy — ale integration gate będzie potrzebować
   commitu, żeby cokolwiek zintegrować). Jeśli uznasz PASS: wykonaj
   `git add` TYLKO 4 plików z allowlisty (`gra/data/civ-matrix.json`,
   `gra/src/game/civ-matrix-semantic.ts`,
   `gra/tools/civ-matrix-meta-roster-wiring-test.cjs`,
   `gra/tools/civ-matrix-semantic-labels-test.cjs`) + katalog
   `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-META-REMOVE-Q1-20260922/`
   i zrób JEDEN commit z jasnym komunikatem. NIE pushuj, NIE mergujesz do
   main, NIE deployujesz.

## WERDYKT

STATUS: PASS | PASS-WITH-NOTES | FAIL. Zapisz `03-final-control.md` +
`03-evidence.json`. Jeśli PASS: karta kończy się gotowa do workerless
integration gate (osobna bramka blokowana, czeka na jawną zgodę właściciela
w czacie — Ty jej NIE tworzysz, robi to orkiestrator).

DEPLOY/PUSH: musi pozostać NIE WYKONANO niezależnie od werdyktu.
