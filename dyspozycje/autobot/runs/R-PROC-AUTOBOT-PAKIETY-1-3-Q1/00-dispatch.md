# 00 — DISPATCH

STATUS: PASS
TEMAT: `R-PROC-AUTOBOT-PAKIETY-1-3-Q1`
GOAL: Dokończyć pakiety dokumentacyjne 1–3 i domknąć routing AutoBot bez zmian w `gra/`.

## Zakres i allowlista

- `CLAUDE.md`
- `AUTOBOT.md`
- `AUTOBOT-UNIVERSAL.md`
- `.cursor/rules/autobot-evaluator-operator.mdc`
- `.claude/skills/civ-autobot/SKILL.md`
- `docs/procesy/INDEX-PROCESU.md`
- `docs/decyzje/R-PROC-AUTOBOT.md`
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
- `dyspozycje/PYTANIA-OTWARTE.md`
- `STAN-PRACY-HANDOFF.md`
- `dyspozycje/_handoff/HANDOFF-AKTUALNY.md`
- `dyspozycje/_handoff/KANAL-PRACA.md`
- `dyspozycje/WERSJE.md`
- `dyspozycje/autobot/README.md`
- `dyspozycje/autobot/runs/`
- `dyspozycje/autobot/tools/process-docs-audit.cjs`
- `docs/archiwum-procesu/`
- `docs/archiwum-procesu/README.md`

Poza zakresem: `gra/`, deploy, push oraz promocja jakiejkolwiek bundli.

## Kryteria końca

1. `HANDOFF-AKTUALNY.md` jest jedynym bieżącym handoffem wskazanym w punkcie wejścia.
2. Każdy artefakt procesu ma jednoznaczne miejsce zapisu.
3. Aktywne dokumenty nie zawierają starych, konkurencyjnych routingów.
4. Rejestr, ABC/ECHO, handoff i run używają jednego ID/statusu i jednej pętli.
5. `git diff --check`, `process-docs-audit.cjs` i kontrola `gra/` przechodzą.

## Raport terminalny

ZMIANY/COMMIT: docs-only allowlista; commit integracji zostanie podany po kontroli.
TESTY: kryteria powyżej.
BLOKADY: brak.
NASTĘPNY KROK: Operator.
DEPLOY/PUSH: NIE WYKONANO.
