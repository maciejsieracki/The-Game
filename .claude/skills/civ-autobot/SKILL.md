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

W dispatchach Codex (`multi_agent_v1`) Operator i Evaluator MUSZĄ jawnie używać
`model=gpt-5.6-luna` oraz `reasoning_effort=high`; nie wolno polegać na modelu
odziedziczonym po orkiestratorze. Final Control używa tego samego modelu i effortu,
a integracja orkiestratora `gpt-5.6-luna` z `reasoning_effort=medium`.

Przed dispatchiem zapisz pełne ID, `GOAL`, kryteria końca, allowlistę, izolację i plan
testów. Raport Operatora uruchamia Evaluatora, a `PASS` prowadzi do Final Control.
Jedna runda oznacza jeden faktyczny dispatch Operatora wraz z jego Evaluatorem; runda
początkowa i każda korekta liczą się jawnie, a licznik rośnie przed dispatchiem.
`FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS` i niegotowość Final Control
wracają do początku obiegu z tym samym ID wyłącznie po guardzie licznika i dla rund 1–5. `ABC-OCZEKUJE`
przed dispatchiem nie zużywa rundy. Po piątej nieudanej/niezamkniętej rundzie
zatrzymaj kolejny dispatch i zgłoś `LIMIT-5-EXCEEDED`
z liczbą rund, ostatnim faktycznym werdyktem, blokadą i decyzją wymaganą od
orkiestratora/właściciela. Limit jest dodatkową bramką, nie zamiennikiem BLOCK,
TIMEOUT, INFRA lub ZWIS. Wznowienie albo nowy cykl wymaga jawnej decyzji i pozostaje
przy tym samym ID; nie wolno samoczynnie zmieniać ID ani resetować licznika.

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

## Ledger i watchdog dispatchu

Każdy dispatch zapisuje jeden i tylko jeden rekord z allowlistą pól:
`agent_id`, `temat`, `rola`, `runda`, `start`, `oczekiwany_artefakt`, `ostatni_status`,
`timestamp_zakonczenia`, `routing_nastepnego_kroku`. Watchdog sprawdza rekordy co minutę
i wymaga terminalnego raportu albo jawnej klasyfikacji: `completed`, `interrupted`,
`timeout`, `not_found`, `BLOCK` lub `CLOSED`; brak notyfikacji nie jest stanem oczekiwania.
`not_found` bez artefaktu daje `BLOCK`, cisza daje `ZWIS`, a timeout daje `TIMEOUT`.
`FAIL`/`BLOCK` wraca do tego samego ID i Operatora po guardzie rundy. Nieznany status
blokuje duplikat i kolejny dispatch do czasu rozstrzygnięcia. Monitoring kończy się po
`READY_FOR_DEPLOY`, jawnym `BLOCK` albo `ABC-OCZEKUJE`; Operator nie deployuje i nie pushuje.
