# 00-dispatch — bieżąca próba 2026-09-13

STATUS: READY
ROLE: Operator
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
RUN: attempt-20260913
TRIGGER: właściciel polecił ponownie uruchomić zaległy temat; historyczny dispatch i analiza istnieją, lecz brak końcowego raportu z licznikami oraz zweryfikowanej poprawki w aktualnym wsadzie
PROFILE: the-game-bugs
BOARD: the-game-bugs
TENANT: the-game-bugs
PROJECT: the-game
PROCESS_PHASE: operator
ROUND: 2
ATTEMPT: 1
IDEMPOTENCY_KEY: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1:operator:bugs:20260913
BASE_HEAD: ff9ce26a663c53c9f711e50536eb10f59dc4b70b
BRANCH: hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
WORKTREE_KIND: dir
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs
MODEL: gpt-5.6-luna
PROVIDER: openai-codex
EFFORT: high

## GOAL
Dokończyć audyt baz nazw Grecji na aktualnym HEAD: policzyć programowo wszystkie właściwe pule, sporządzić końcowy raport i wprowadzić tylko potwierdzoną poprawkę kodu/danych, bez zgadywania i bez zmiany zakresu.

## BINARNE KRYTERIA
- [ ] Raport rozdziela nazwę cywilizacji, miasta cywilizacji, miasta państw-miast, fallbacki/generatory.
- [ ] Raport podaje dla każdej właściwej puli dokładną liczbę elementów, pustych wpisów, duplikatów i kolizji, policzoną skryptem.
- [ ] Raport wskazuje pełny przepływ od danych do funkcji wyboru nazwy dla Grecji.
- [ ] Potwierdzona wada jest odtworzona testem i naprawiona minimalnie; brak potwierdzonej wady oznacza brak zmiany produktu z dowodem.
- [ ] Test audytowy/regresyjny i dostępny typecheck/build przechodzą albo blokada jest rozdzielona na INFRA vs produkt.
- [ ] Zmiany pozostają w allowliście; push, PR, merge i deploy nie są wykonane.

## ALLOWLISTA
- `gra/data/civs.json`
- `gra/data/city-names-pools.json`
- `gra/src/game/city-names-pool.ts`
- `gra/src/game/civ-names.ts`
- `gra/src/game/display-names.ts`
- jeden ukierunkowany test w `gra/tools/` (jeśli potrzebny)
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/**`

## ZAKAZY
Nie nadpisywać historycznych artefaktów w `runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/`; nie zmieniać balansu, mapy poza przepływem nazw, niezwiązanej UI, `main`, `WERSJE.md`, `KANAL-PRACA.md`, `HANDOFF-AKTUALNY.md`, `gra-robocza/**`; nie używać reset/clean/stash/rebase/force-push; nie wykonywać push/PR/merge/deploy.

## DOWODY
Bieżące artefakty: `01-operator.md`, `01-operator-evidence.md`, `progress.json`, journal, transition receipt pod katalogiem próby. W raporcie podać pełny HEAD, branch, worktree, komendy, realne wyniki, hashe artefaktów i następny etap Evaluator.

## ANTY-SAMOOSZUKIWANIE
Nie przenosić liczników z historycznego raportu bez ponownego uruchomienia skryptu na bieżącym HEAD. Nie traktować nazwy podobnej językowo ani deklaracji operatora jako dowodu historyczności/toponimii. Nie usuwać kolizji bez potwierdzenia kontraktu produktu.

## PROCEDURA NAPRAWCZA
Przy niezgodności: najpierw test reprodukujący, potem minimalna poprawka w allowliście, ponowne liczenie i testy. Przy decyzji produktowej zapisać `DECISION_REQUIRED` zamiast zgadywać.

PUSH/MERGE/DEPLOY: NIE WYKONANO
