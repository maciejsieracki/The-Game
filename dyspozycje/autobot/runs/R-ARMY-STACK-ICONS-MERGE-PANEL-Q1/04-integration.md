# Integration — R-ARMY-STACK-ICONS-MERGE-PANEL-Q1

STATUS: **READY TO FAST-FORWARD TO MAIN; RELEASE BUILD PREP REMAINS**
DOMAIN: GAME
TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1

## Integracja lokalna

Zintegrowano wyłącznie wcześniej zaakceptowany panel armii i poprawkę short-viewport:

- produktowy panel + ikony: `29c98643` (`fix army merge panel scrolling and action icons`)
- poprawka marginesu, diagnostyczny pomiar oraz raporty AutoBot r2/r3: `8d7446db` (`fix army merge panel short viewport margin`)
- baza: `origin/main` `32d27454be213e0e9342435b81c0271999e99513`
- branch: `integration/robocza-all-topics-20261027`

Kandydat jest fast-forward od bazy `origin/main`. Inne zmiany dirty worktree, w tym AI, rekrutacja wodza i bitwa, nie są w commitach tych dwóch zmian produktu.

## Niezależne bramki

- Panel Chromium: **26/26 w trzech niezależnych uruchomieniach** przy DPR 1.5 i CSS viewport 600×413; wszystkie zaobserwowane marginesy górne/dolne ≥27.88 px.
- Ikony rozdzielania/łączenia: **7/7 PASS**.
- TypeScript: **PASS**.
- Vite build: **PASS**, 916 modułów.
- `git diff --check`: **PASS**.
- Operator, Evaluator i Final Control: **PASS** po rundzie 3. Runda 2 odrzucona z uwagi na dolny margines 23.45 px; poprawka i powtarzalne pomiary są zachowane w raporcie.

## Publikacja

Właściciel polecił scalić gotowy zakres do `main` i przygotować go do Roboczej. Fast-forward push do `main` nastąpi po sprawdzeniu, że zdalny `main` nadal wskazuje bazę `32d27454`. Deploy do Roboczej pozostaje osobnym krokiem; ten raport nie twierdzi, że deploy już wykonano.
