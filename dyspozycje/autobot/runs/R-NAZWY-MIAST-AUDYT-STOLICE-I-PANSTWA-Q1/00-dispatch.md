# 00-dispatch — R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1

STATUS: READY
ROLE: Operator
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
TRIGGER: jawne zlecenie właściciela z 2026-09-13; istniejący temat z rejestru, wcześniej zarejestrowany, lecz niedispatchowany
PROFILE: the-game-bugs
BOARD: the-game-bugs
TENANT: the-game-bugs
PROJECT: the-game
PROCESS_PHASE: operator
ROUND: 1
ATTEMPT: 1
IDEMPOTENCY_KEY: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1:operator:r1
BASE_HEAD: ff9ce26a663c53c9f711e50536eb10f59dc4b70b
BRANCH: hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
WORKTREE_KIND: dir
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs
MODEL: gpt-5.6-luna
PROVIDER: openai-codex
EFFORT: high

## GOAL
Ustalić na aktualnym HEAD dokładne, rozdzielne źródła i liczniki nazw Grecji (nazwa cywilizacji, miasta cywilizacji, miasta państw-miast, fallbacki/generatory), a następnie wprowadzić wyłącznie niezbędną poprawkę kodu, jeśli audyt potwierdzi błąd.

## BINARNE KRYTERIA
- [ ] Raport zawiera policzone wartości: liczba elementów, duplikaty, puste wpisy i zakres każdej puli dotyczącej Grecji.
- [ ] Raport rozdziela nazwę cywilizacji, pule miast cywilizacji, pule miast państw-miast oraz fallbacki/generatory i wskazuje przepływ użycia w kodzie.
- [ ] Każdy licznik jest odtworzony skryptem/testem, nie oszacowany ręcznie.
- [ ] Jeśli istnieje błąd produktu, poprawka jest minimalna i mieści się w allowliście; jeśli nie istnieje, kod pozostaje bez zmian, a raport zawiera dowód.
- [ ] Dodany lub zaktualizowany test audytowy obejmuje ustalony kontrakt i przechodzi.
- [ ] Typecheck/testy obszaru przechodzą, albo raport dokładnie rozdziela blokadę środowiskową od błędu produktu.
- [ ] Worktree po pracy nie ma zmian poza allowlistą; push, PR, merge i deploy nie są wykonane.

## ALLOWLISTA
- `gra/data/civs.json`
- `gra/data/city-names-pools.json`
- `gra/src/game/city-names-pool.ts`
- `gra/src/game/civ-names.ts`
- `gra/src/game/display-names.ts`
- jeden ukierunkowany test audytowy w `gra/tools/` (jeśli potrzebny)
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/**`

## ZAKAZY
Nie zmieniać balansu, generatora mapy poza koniecznym przepływem nazw, UI niezwiązanego z nazwami, `main`, `WERSJE.md`, `KANAL-PRACA.md`, `HANDOFF-AKTUALNY.md`, `gra-robocza/**`; nie używać `git reset`, `clean`, `stash`, `rebase`, force-push; nie wykonywać push/PR/merge/deploy.

## DOWODY I ARTEFAKTY
Wymagane: `01-operator.md`, `01-operator-evidence.md`, `progress.json`, journal oraz transition receipt w tym katalogu. Raport ma podać pełny HEAD, branch, worktree, rzeczywiste komendy i wyniki, hashe artefaktów oraz następny etap Evaluator.

## PROCEDURA NAPRAWCZA
Przy błędzie danych lub kodu: zatrzymać zakres na allowliście, odtworzyć błąd testem, wprowadzić najmniejszą poprawkę, uruchomić test regresji i pełny dostępny typecheck/build. Przy decyzji produktowej nie zgadywać — zapisać `DECISION_REQUIRED`.

PUSH/MERGE/DEPLOY: NIE WYKONANO
