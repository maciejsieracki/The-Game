# CLAUDE.md — Civ „The Game"

**Status:** aktywny punkt wejścia. Mapa procesu i routing artefaktów są w
[`docs/procesy/INDEX-PROCESU.md`](docs/procesy/INDEX-PROCESU.md), a bieżący stan w
[`dyspozycje/_handoff/HANDOFF-AKTUALNY.md`](dyspozycje/_handoff/HANDOFF-AKTUALNY.md).

## Start

1. Czytaj `INDEX-PROCESU.md`, `STAN-PRACY-HANDOFF.md` i wskazany przez niego
   `HANDOFF-AKTUALNY.md`.
2. Dla pracy AutoBotem czytaj
   [`R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md),
   [skill](.claude/skills/civ-autobot/SKILL.md) oraz aktywne reguły
   [`.cursor/rules/`](.cursor/rules/).
3. Stan tematu potwierdzaj w rejestrze, ABC/ECHO, runie i faktycznym Git; czat,
   UI, nazwa brancha ani sam status nie są dowodem.

## Bariery krytyczne

- Każdy temat ma pełne ID, `GOAL`, kryteria końca, allowlistę i izolowany worktree.
- Obowiązuje obieg:
  `Operator GPT-5.6 Luna High → Evaluator GPT-5.6 Luna High → Final Control GPT-5.6 Luna High → integracja orkiestratora GPT-5.6 Luna Medium → READY_FOR_DEPLOY`.
- `FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA` i `ZWIS` wracają do Operatora,
  następnie do Evaluatora i Final Control, zawsze z tym samym ID. ABC pauzuje
  tylko temat wymagający decyzji właściciela.
- Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora (C-043).
  Subagenci są kanałami technicznymi.
- Operator, Evaluator i Final Control nie integrują, nie deployują i nie pushują.
  Deploy/push wymaga osobnej autoryzacji po `READY_FOR_DEPLOY`.
- Nie zmieniaj `gra/` ani `gra/`-zależnych artefaktów przy paczce dokumentacyjnej.
  Przed zapisem sprawdź allowlistę, `git status`, diff i `git diff --check`.

## Minimalny kontrakt raportu

Każdy etap zapisuje w `dyspozycje/autobot/runs/<ID>/`:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładne wyniki albo powód pominięcia>
BLOKADY: <jawna lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

`READY_FOR_DEPLOY` może wystawić wyłącznie orkiestrator po Final Control i faktycznej
integracji. Historyczne routingi i snapshoty są tylko w
[`docs/archiwum-procesu/`](docs/archiwum-procesu/).
