---
name: civ-autobot
description: >
  Aktywny proces AutoBot dla Civ: pełne ID, GOAL, izolacja, ABC/ECHO, dowody,
  pętla Operator–Evaluator–Final Control–integracja oraz osobna bramka deploy/push.
---

# Civ — skill AutoBot

Najpierw przeczytaj [`docs/procesy/INDEX-PROCESU.md`](../../../docs/procesy/INDEX-PROCESU.md),
następnie aktywną regułę [`.cursor/rules/autobot-evaluator-operator.mdc`](../../../.cursor/rules/autobot-evaluator-operator.mdc)
i pełny opis [`R-PROC-AUTOBOT.md`](../../../docs/decyzje/R-PROC-AUTOBOT.md).

## Obieg

```text
Operator GPT-5.6 Luna High
→ Evaluator GPT-5.6 Luna High
→ Final Control GPT-5.6 Luna High
→ integracja orkiestratora GPT-5.6 Luna Medium
→ READY_FOR_DEPLOY
→ osobna bramka deploy/push
```

Przed dispatchiem zapisz pełne ID, `GOAL`, kryteria końca, allowlistę, izolację i plan
testów. Raport Operatora uruchamia Evaluatora, a `PASS` prowadzi do Final Control.
`FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS` i niegotowość Final Control
wracają do początku obiegu z tym samym ID. ABC pauzuje tylko temat wymagający decyzji.

## Artefakty

Nowe runy zapisuj w `dyspozycje/autobot/runs/<ID>/`:
`00-dispatch.md`, `01-operator.md`, `02-evaluator.md`, `03-final-control.md`,
`04-integration.md`. Rejestruj temat w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`,
otwarte ABC w `dyspozycje/PYTANIA-OTWARTE.md`, ECHO i decyzję w
`docs/decyzje/<ID>.md`, bieżący stan w `dyspozycje/_handoff/HANDOFF-AKTUALNY.md`,
a przekazania w `KANAL-PRACA.md`. `WERSJE.md` aktualizuj dopiero po faktycznym
deployu.

Raport etapu zawiera `STATUS`, `TEMAT`, `GOAL`, `ZMIANY/COMMIT`, `TESTY`, `BLOKADY`,
`NASTĘPNY KROK` i `DEPLOY/PUSH`. Operator, Evaluator i Final Control nie integrują,
nie deployują i nie pushują. Historyczne routingi są wyłącznie w
[`docs/archiwum-procesu/`](../../../docs/archiwum-procesu/).
