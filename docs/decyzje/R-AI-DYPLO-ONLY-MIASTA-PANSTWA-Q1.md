# R-AI-DYPLO-ONLY-MIASTA-PANSTWA-Q1 — dyplomatyczne przejęcia tylko własnych państw-miast

**Data ECHO właściciela:** 2026-09-15 (Europe/Warsaw)
**Status:** `FINAL CONTROL PASS — INTEGRATION_REQUIRED` — recovery/operator, evaluator and Final Control zakończone; zatwierdzony diff pozostaje lokalnym worktree, bez integracji, pushu i deployu
**Domena:** `GAME`
**Powiązane:** `P-AI-MAJOR-ABSORB`, `P-AI-ABSORB-F2`, `R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA-Q1`
**Supersedes:** wcześniejsze `P-AI-ABSORB-F2-Q1=B` (`any-civ hard`)

## Historyczne ECHO A — superseded przez aktualny kontrakt poniżej

> **A — tylko własne państwa-miasta; całkowicie wyłączyć dyplomatyczne major→major, zachować limit dwóch miast dla wojny.**

## Ustalenie

Dyplomatyczne wchłonięcie przez AI może dotyczyć wyłącznie państwa-miasta należącego do własnego klastra/typu cywilizacji agresora. Duża cywilizacja AI nie może przez dyplomację natychmiast przejąć innej dużej cywilizacji AI — ani na `hard`, ani na `normal`, ani na `easy`.

Limit wojenny pozostaje bez zmian: zwykła wojna AI↔AI kończy się pokojem po zdobyciu dwóch miast zgodnie z `R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA-Q1`. Ten limit nie może zostać zastąpiony ani osłabiony przez ścieżkę dyplomatyczną.

## Powód decyzji

W aktualnym `origin/main` ścieżka `P-AI-MAJOR-ABSORB Faza 2` pozwala na `hard_any_civ_ratio`: od tury 10, przy stosunku Mocy agresor/ofiara co najmniej 1,25, major AI może wykonać `instant_annex` wobec dowolnego innego majora AI. Wspólna funkcja annexu zmienia właścicieli wszystkich miast ofiary i eliminuje jej jednostki, więc przejęcie nie wymaga ruchu wojska. To tłumaczy przypadek, w którym armia Egiptu nadal stoi w stolicy, a pozostałe cywilizacje znikają.

## Kryteria implementacji

1. Brak produkcyjnej ścieżki `major AI → major AI` przez dyplomatyczny `instant_annex` na każdym poziomie trudności.
2. Ścieżka `major AI → własne państwo-miasto` pozostaje dostępna zgodnie z istniejącymi parametrami poziomu trudności.
3. Zwykłe przejęcie wojenne nadal wywołuje limit dwóch miast i wymuszony pokój.
4. Test `ai-major-absorb-test.cjs` nie może akceptować `different civ + hard` jako `instant_annex`.
5. Testy obejmują negację gracz/MP/barbarzyńca, poziomy `easy/normal/hard`, przejęcie własnego państwa-miasta oraz brak przejęcia majora AI.
6. Operator nie zmienia przy okazji innych parametrów AI, ekonomii, wojny, danych mapy ani UI.

## Granica procesu

Ten dokument jest zapisem decyzji właściciela, nie dowodem implementacji. Implementacja wymaga pełnego obiegu:

```text
Operator → Evaluator → Defense tylko przy numerowanych zarzutach → Final Control → integracja
```

`PUSH/DEPLOY: NIE WYKONANO`.

## Superseding ECHO — 2026-09-15, korekta reguły absorpcji

Właściciel skorygował wcześniejsze ECHO A. Nowa reguła obowiązująca dla następnej rundy tego samego tematu:

> **A — chodzi o major→major: duża cywilizacja może wchłonąć inną dużą cywilizację dopiero od 25. tury i tylko przy mocy agresora ≥10× mocy ofiary.**

Kontrakt:

1. Własne państwa-miasta zachowują dotychczasową ścieżkę absorpcji od początku gry, zgodnie z istniejącymi parametrami i filtrem własnego klastra.
2. Major AI → inny major AI pozostaje dozwolone wyłącznie na dotychczasowym poziomie trudności tej funkcji (`hard`), od tury **25** włącznie i przy `aggressorPower / victimPower >= 10`.
3. Porównanie Mocy dotyczy dwóch dużych cywilizacji AI, nie państwa-miasta.
4. Limit dwóch miast i pokój dla zwykłej wojny pozostają bez zmian.
5. Ta korekta supersedes wcześniejsze „całkowicie wyłączyć major→major". Nie zmienia żywego runu `303`; następna próba musi użyć tego samego tematu i jawnie zaktualizowanego dispatchu.

`PUSH/DEPLOY: NIE WYKONANO`.
