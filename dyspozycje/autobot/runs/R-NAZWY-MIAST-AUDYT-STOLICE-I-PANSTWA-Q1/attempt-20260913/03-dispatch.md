# 03-dispatch — R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Final Control

STATUS: READY
ROLE: Final Control
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
PARENT_TASK: t_5934752f
RUN: attempt-20260913
TRIGGER: terminalny event `completed` Evaluatora; `PASS`, objections=[], brak potrzeby Defense
PROFILE: the-game-bugs
BOARD: the-game-bugs
TENANT: the-game-bugs
PROJECT: the-game
PROCESS_PHASE: final-control
ROUND: 2
ATTEMPT: 1
IDEMPOTENCY_KEY: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1:final-control:bugs:20260913
BASE_HEAD: 2b94ca8242b614b599bf3bf6624bafedca6190a2
BRANCH: hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
WORKTREE_KIND: worktree
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs
MODEL: gpt-5.6-luna
PROVIDER: openai-codex
EFFORT: max

## GOAL
Wykonać niezależną końcową kontrolę gotowości wsadu nazw: sprawdzić rzeczywisty diff, allowlistę, raporty Operatora i Evaluatora, hashe, liczniki, testy, granice procesu oraz czy materiał może przejść do Orkiestratora jako `INTEGRATION_REQUIRED`; nie integrować i nie publikować.

## MATERIAŁ DO ODCZYTU
- Operator report/evidence: `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/01-operator.md` oraz `01-operator-evidence.md`
- Evaluator report/evidence: `02-evaluator.md` oraz `02-evaluator-evidence.md`
- progress, journals i transition receipty obu faz w tym samym katalogu
- historyczne pliki w katalogu głównym wyłącznie jako kontekst, nie jako bieżący dowód
- rzeczywisty diff/status worktree `/home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs`

## BINARNE KRYTERIA
- [ ] Bezpośrednio sprawdzono, że Operator i Evaluator mają terminalne eventy oraz zgodne runy/artefakty/hashe.
- [ ] Bezpośrednio sprawdzono zakres zmian: `gra/data/civs.json`, `gra/src/game/civ-names.ts`, `gra/tools/civ-names-test.cjs` oraz artefakty bieżącej próby; brak zmian poza allowlistą.
- [ ] Bezpośrednio potwierdzono 15 pul, liczniki 100/0/0 i 10/0/0, lokalne kolizje 0, lustra i globalne agregaty.
- [ ] Bezpośrednio potwierdzono poprawkę fallbacku Grecji (`Ateny` zamiast `Sykion`) oraz zachowanie MP jako źródła rywali.
- [ ] Bezpośrednio sprawdzono testy, TypeScript, `git diff --check`, brak sekretów i brak nieuzasadnionych usunięć.
- [ ] Sprawdzono zgodność z zakazem push/PR/merge/deploy i z tym, że `product_approval` nie jest mylone z integracją.
- [ ] Wydano werdykt końcowy: `PASS`, `FAIL` albo `DECISION_REQUIRED`; przy `PASS` wskazano `INTEGRATION_REQUIRED` dla Orkiestratora.

## ALLOWLISTA ZAPISU
Wyłącznie artefakty Final Control:
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/03-final-control.md`
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/03-final-control-evidence.md`
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/final-control-progress.json`
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/final-control-journal.md`
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/final-control-transition-receipt.json`

## ZAKAZY
Nie zmieniać plików produktu, testów Operatora ani artefaktów wcześniejszych faz; nie wykonywać napraw, cherry-pick, reset/clean/stash/rebase/force-push; nie wykonywać push/PR/merge/deploy. Final Control nie integruje i nie wystawia samodzielnie zgody na publikację.

## WERDYKT
- Lista zarzutów Evaluatora jest pusta, ale Final Control musi sprawdzić materiał bez zaufania do samego PASS.
- `PASS` oznacza wyłącznie gotowość materiału do `INTEGRATION_REQUIRED`, nie akceptację wdrożenia.
- `FAIL` oznacza powrót do Operatora w tej samej rundzie; `DECISION_REQUIRED` oznacza trwały zapis pytania właścicielskiego.

PUSH/MERGE/DEPLOY: NIE WYKONANO
