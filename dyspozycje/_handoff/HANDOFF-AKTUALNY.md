# HANDOFF-AKTUALNY — R-PROC-AUTOBOT-PAKIETY-1-3-Q1

**Data:** 2026-08-20
**Worktree:** `codex/process-packets-complete`
**Zakres:** dokumentacja procesu AutoBot; `gra/` poza zakresem.

## STATUS

Paczki dokumentacyjne 1–3 są zintegrowane lokalnie w izolowanym worktree i mają
pełny ślad `runs/R-PROC-AUTOBOT-PAKIETY-1-3-Q1/00–04`.

| Pakiet | Zakres | Status | Dowód |
|---|---|---|---|
| 1 | indeks źródeł prawdy i routing artefaktów | `ZINTEGROWANE` | `docs/procesy/INDEX-PROCESU.md` |
| 2 | skrócenie aktywnych CLAUDE/reguły/skill/R-PROC | `ZINTEGROWANE` | aktywne pliki + `docs/archiwum-procesu/` |
| 3 | rejestr/statusy/ABC/handoff/runs | `ZINTEGROWANE` | rejestr, `PYTANIA-OTWARTE.md`, ten handoff, run 00–04 |

Brama procesu: `READY_FOR_DEPLOY = TAK` dla paczki docs-only po Final Control i lokalnej
integracji. Deploy i push: `NIE WYKONANO`.

## ŹRÓDŁA BIEŻĄCE

- mapa: [`../../docs/procesy/INDEX-PROCESU.md`](../../docs/procesy/INDEX-PROCESU.md);
- norma: [`../../docs/decyzje/R-PROC-AUTOBOT.md`](../../docs/decyzje/R-PROC-AUTOBOT.md);
- aktywna reguła: [`../../.cursor/rules/autobot-evaluator-operator.mdc`](../../.cursor/rules/autobot-evaluator-operator.mdc);
- skill: [`../../.claude/skills/autobots/SKILL.md`](../../.claude/skills/autobots/SKILL.md);
- pełny run: [`../autobot/runs/R-PROC-AUTOBOT-PAKIETY-1-3-Q1/`](../autobot/runs/R-PROC-AUTOBOT-PAKIETY-1-3-Q1/).

## OBIEG

`Operator → Evaluator → Final Control → integracja → READY_FOR_DEPLOY`; `FAIL`,
techniczny `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS` i niegotowość wracają do Operatora
z tym samym ID. ABC pauzuje wyłącznie temat wymagający decyzji właściciela.

## BLOKADY I RYZYKA

- Brak blokady merytorycznej.
- Historyczne etykiety w append-only rejestrach/logach pozostają historią i nie są
  nowym routingiem.
- Brak niezależnego deploy/push; oba działania wymagają osobnej autoryzacji.

## NASTĘPNY KROK

Przed jakąkolwiek publikacją ponownie sprawdzić `git status`, diff, allowlistę i raporty
runu; deploy/push wykonać tylko po wyraźnym poleceniu właściciela.

## DEPLOY / PUSH

Nie wykonywać w ramach tego zadania.
