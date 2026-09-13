# 02-dispatch — R-KREATOR-DOLNA-NAWIGACJA-Q1 — Evaluator

STATUS: READY
ROLE: Evaluator
TEMAT: R-KREATOR-DOLNA-NAWIGACJA-Q1
PARENT_TASK: t_05185782
TRIGGER: terminalny event `completed` Operatora; Operator zwrócił PASS-WITH-NOTES i wskazał brak zmian produkcyjnych
PROFILE: the-game-bugs
BOARD: the-game-bugs
TENANT: the-game-bugs
PROJECT: the-game
PROCESS_PHASE: evaluator
ROUND: 1
ATTEMPT: 1
IDEMPOTENCY_KEY: R-KREATOR-DOLNA-NAWIGACJA-Q1:evaluator:bugs:20260913
BASE_HEAD: 6af03c01939834b0876507a4e001275453528a06
BRANCH: hermes/R-KREATOR-DOLNA-NAWIGACJA-Q1
WORKTREE_KIND: worktree
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-KREATOR-DOLNA-NAWIGACJA-Q1-bugs
MODEL: gpt-5.6-luna
PROVIDER: openai-codex
EFFORT: xhigh

## GOAL
Niezależnie zweryfikować raport Operatora, dowody runtime 2K/4K, allowlistę, brak zmian produkcyjnych, test regresji i spójność runów/receiptów dla tematu dolnej nawigacji; nie naprawiać wytworu po cichu.

## MATERIAŁ DO ODCZYTU
- Operator report: `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/01-operator.md`
- Operator evidence: `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/01-operator-evidence.md`
- progress/journal/transition receipt oraz runtime/build logs w tym samym katalogu
- rzeczywisty diff i status worktree `/home/ubuntu/projects/The-Game-worktrees/R-KREATOR-DOLNA-NAWIGACJA-Q1-bugs`

## BINARNE KRYTERIA
- [ ] Niezależnie sprawdzono dokładny DOM/CSS i wynik 2K DCI oraz 4K UHD przy deviceScaleFactor=1.
- [ ] Niezależnie uruchomiono test regresji i potwierdzono jego czułość na mutację.
- [ ] Niezależnie potwierdzono typecheck, build oraz testy referencyjne; czerwone testy bazowe rozdzielono od tematu.
- [ ] Allowlista jest czysta, a `newGameFlow.ts` nie zmienił się względem BASE_HEAD; test i artefakty są jedynymi zmianami.
- [ ] Zweryfikowano spójność runów: run 2 review, run 3 completed, event completed i transition receipt wskazują tę samą terminalną próbę albo rozbieżność jest osobnym, ponumerowanym zarzutem.
- [ ] Raport Evaluatora zawiera ponumerowane zarzuty z miejscem i reprodukcją; przy braku zarzutów wskazuje pełny zakres niezależnej kontroli.
- [ ] Nie wykonywano poprawek, pushu, PR, merge ani deployu.

## ALLOWLISTA ODCZYTU
Cały odczyt repozytorium jest dozwolony; zmiany produktu są zabronione. Artefakty Evaluatora wyłącznie w:
- `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/02-evaluator.md`
- `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/02-evaluator-evidence.md`
- `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/evaluator-progress.json`
- `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/evaluator-journal.md`
- `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/evaluator-transition-receipt.json`

## ZAKAZY
Nie zmieniać `gra/src/ui/newGameFlow.ts`, testu Operatora ani żadnego pliku produktu; nie usuwać ani nie nadpisywać artefaktów Operatora; nie używać reset/clean/stash/rebase/force-push; nie wykonywać push/PR/merge/deploy. Jeśli znajdzie problem, zapisać ponumerowany zarzut i zatrzymać się na werdykcie Evaluatora.

## PROCEDURA PRZY ZARZUTACH
Każdy zarzut musi zawierać: numer, plik/linia lub artefakt, konkretne rozminięcie z GOAL/allowlistą, reprodukcję i wpływ. Nie tworzyć Defense bez niepustej listy zarzutów. Pusta lista zarzutów odblokowuje Final Control, nie integrację.

PUSH/MERGE/DEPLOY: NIE WYKONANO
