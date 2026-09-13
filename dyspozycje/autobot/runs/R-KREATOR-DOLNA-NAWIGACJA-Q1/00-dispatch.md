# 00-dispatch — R-KREATOR-DOLNA-NAWIGACJA-Q1

STATUS: READY
ROLE: Operator
TEMAT: R-KREATOR-DOLNA-NAWIGACJA-Q1
TRIGGER: jawne zlecenie właściciela z 2026-09-13; temat wcześniej sprawdzony, lecz bez patcha i bez formalnej karty
PROFILE: the-game-bugs
BOARD: the-game-bugs
TENANT: the-game-bugs
PROJECT: the-game
PROCESS_PHASE: operator
ROUND: 1
ATTEMPT: 1
IDEMPOTENCY_KEY: R-KREATOR-DOLNA-NAWIGACJA-Q1:operator:bugs:20260913
BASE_HEAD: ff9ce26a663c53c9f711e50536eb10f59dc4b70b
BRANCH: hermes/R-KREATOR-DOLNA-NAWIGACJA-Q1
WORKTREE_KIND: worktree
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-KREATOR-DOLNA-NAWIGACJA-Q1-bugs
MODEL: gpt-5.6-luna
PROVIDER: openai-codex
EFFORT: high

## GOAL
Odtworzyć problem dolnej nawigacji Kreatora nowej gry na wymaganych rozmiarach widoku, a jeśli problem jest rzeczywisty, wprowadzić minimalną poprawkę tak, aby nawigacja była widoczna i używalna bez naruszenia przepływu kreatora.

## BINARNE KRYTERIA
- [ ] Operator wskazuje dokładny element DOM/CSS/obszar kodu odpowiedzialny za dolną nawigację.
- [ ] Problem jest odtworzony albo negatywnie zweryfikowany w scenariuszach 2K i 4K przy skali 100%, z dowodem wymiarów/overflow/położenia elementów.
- [ ] Jeśli problem istnieje, patch jest minimalny i nie zmienia semantyki kroków ani parametrów gry; jeśli nie istnieje, kod pozostaje bez zmian z dowodem.
- [ ] Dodany lub zaktualizowany test regresji sprawdza widoczność i aktywność przycisków Wstecz/Dalej/Start na właściwych krokach.
- [ ] Typecheck/build oraz test obszaru przechodzą, albo raport dokładnie rozdziela blokadę środowiskową od błędu produktu.
- [ ] Worktree po pracy nie ma zmian poza allowlistą; push, PR, merge i deploy nie są wykonane.

## ALLOWLISTA
- `gra/src/ui/newGameFlow.ts`
- jeden ukierunkowany test regresji w `gra/tools/` (jeśli potrzebny)
- `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/**`

## ZAKAZY
Nie zmieniać logiki generowania mapy, parametrów gry, baz nazw, balansu, `main` poza koniecznym kontraktem callbacku, `WERSJE.md`, `KANAL-PRACA.md`, `HANDOFF-AKTUALNY.md`, `gra-robocza/**`; nie używać `git reset`, `clean`, `stash`, `rebase`, force-push; nie wykonywać push/PR/merge/deploy.

## DOWODY I ARTEFAKTY
Wymagane: `01-operator.md`, `01-operator-evidence.md`, `progress.json`, journal oraz transition receipt w tym katalogu. Raport ma zawierać rozdzielnie wynik reprodukcji 2K/4K, pełny HEAD, branch, worktree, rzeczywiste komendy i hashe artefaktów oraz następny etap Evaluator.

## PROCEDURA NAPRAWCZA
Najpierw odtworzyć i zmierzyć problem; nie poprawiać „na oko”. Jeśli przyczyna zależy od nieustalonej decyzji produktowej, zapisać `DECISION_REQUIRED`. Po patchu uruchomić test regresji i pełny dostępny typecheck/build.

PUSH/MERGE/DEPLOY: NIE WYKONANO
