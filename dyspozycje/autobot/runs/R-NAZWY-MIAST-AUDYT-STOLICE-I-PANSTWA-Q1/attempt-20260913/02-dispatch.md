# 02-dispatch — R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Evaluator

STATUS: READY
ROLE: Evaluator
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
PARENT_TASK: t_ba1a3b03
RUN: attempt-20260913
TRIGGER: terminalny event `completed` Operatora; raport PASS potwierdza pełny audyt 15 pul i poprawkę fallbacku bez puli
PROFILE: the-game-bugs
BOARD: the-game-bugs
TENANT: the-game-bugs
PROJECT: the-game
PROCESS_PHASE: evaluator
ROUND: 2
ATTEMPT: 1
IDEMPOTENCY_KEY: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1:evaluator:bugs:20260913
BASE_HEAD: 0b95694b73c429d01d8b65942235f2863947f986
WORKTREE_HEAD_BEFORE_DISPATCH: 0b95694b73c429d01d8b65942235f2863947f986
BRANCH: hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
WORKTREE_KIND: worktree
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs
MODEL: gpt-5.6-luna
PROVIDER: openai-codex
EFFORT: xhigh

## GOAL
Niezależnie zweryfikować końcowy audyt baz nazw Grecji i pozostałych cywilizacji, poprawkę fallbacku stolicy, lustra danych, dokładne liczniki, testy, allowlistę i spójność artefaktów Operatora; nie naprawiać wytworu po cichu.

## MATERIAŁ DO ODCZYTU
- Operator report: `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/01-operator.md`
- Operator evidence: `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/01-operator-evidence.md`
- `progress.json`, `journal.md`, `transition-receipt.json` w tym samym katalogu próby
- rzeczywisty diff i status worktree `/home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs`
- historyczny raport/dispatch tylko jako kontekst; nie traktować go jako dowodu bieżącej próby

## BINARNE KRYTERIA
- [ ] Niezależnie odtworzono programowe liczniki wszystkich 15 pul: regularne 100/0/0, państw-miast 10/0/0, lustra `nazwyMiast`, kolizje lokalne i globalne agregaty.
- [ ] Niezależnie zweryfikowano dla Grecji: `Cywilizacja=Grecy`, MC[0]=`Ateny`, MP[0]=`Sykion`, fallback stolicy=`Ateny`, oraz rozdzielność ścieżek.
- [ ] Niezależnie odtworzono błąd no-pool przed poprawką i sprawdzono minimalną zmianę `civ-names.ts`; potwierdzono brak nieuzasadnionych zmian w danych.
- [ ] Niezależnie uruchomiono wszystkie bramki wskazane przez Operatora i sprawdzono rzeczywiste wyniki, nie tylko raport.
- [ ] Allowlista jest czysta; nie ma zmian poza `gra/data/civs.json`, `gra/src/game/civ-names.ts`, `gra/tools/civ-names-test.cjs` i artefaktami próby.
- [ ] Zweryfikowano hashe raportu/evidence/progress/journal/receipt według jawnych konwencji, w tym placeholdera raportu.
- [ ] Każdy problem jest osobnym ponumerowanym zarzutem z miejscem i reprodukcją; brak zarzutów jest uzasadniony pełnym zakresem kontroli.
- [ ] Nie wykonywano poprawek, pushu, PR, merge ani deployu.

## ALLOWLISTA ODCZYTU
Cały odczyt repozytorium jest dozwolony; zmiany produktu są zabronione. Artefakty Evaluatora wyłącznie:
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/02-evaluator.md`
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/02-evaluator-evidence.md`
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/evaluator-progress.json`
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/evaluator-journal.md`
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/attempt-20260913/evaluator-transition-receipt.json`

## ZAKAZY
Nie zmieniać `gra/data/civs.json`, `gra/data/city-names-pools.json`, `gra/src/game/civ-names.ts`, testów Operatora ani innych plików produktu; nie usuwać/nadpisywać artefaktów Operatora; nie używać reset/clean/stash/rebase/force-push; nie wykonywać push/PR/merge/deploy. Przy wykryciu problemu zapisać zarzut i zakończyć etap Evaluatora.

## PROCEDURA PRZY ZARZUTACH
Każdy zarzut: numer, dokładny plik/linia/artefakt, niezgodność z GOAL/allowlistą, reprodukcja, wpływ. Nie tworzyć Defense bez niepustej listy zarzutów. Pusta lista zarzutów odblokowuje Final Control, nie integrację.

PUSH/MERGE/DEPLOY: NIE WYKONANO
