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

**Masz dostępny i autoryzowany Workflow?** Jeśli narzędzie orkiestracji
wieloagentowej Workflow jest dostępne w tej sesji ORAZ właściciel dał jawną,
opt-in zgodę na multi-agent orchestration w tej sesji — patrz
[`civ-autobot-workflow/SKILL.md`](../civ-autobot-workflow/SKILL.md) zamiast tego
pliku dla dispatchu Operator/Evaluator/Final Control z jawnym `effort` per rolę.
Bez obu warunków (co jest normą — Cursor/GPT nie mają koncepcji Workflow z
`effort` per agent) zostań w tym pliku: role różnicujesz wyłącznie treścią
promptu, bez parametru effort. Pełne uzasadnienie: playbook C-061.

**Jesteś Cursor Automation** (agent uruchomiony zdarzeniem/harmonogramem, bez
właściciela w czacie)? Użyj zamiast tego
[`civ-autobot-cursor-automations/SKILL.md`](../civ-autobot-cursor-automations/SKILL.md)
— Ścieżka C, zakres wyłącznie recon+Operator zakończony PR, nigdy merge/deploy
(playbook C-062).

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

Raport etapu zawiera `STATUS`, `DOMAIN` (`GAME`/`PROCESS`/`INFRA`/`INFORMATIONAL` —
błąd provenance/worktree/ledgeru NIE jest automatycznie błędem gry), `TEMAT`, `GOAL`,
`ZMIANY/COMMIT`, `TESTY`, `BLOKADY`, `NASTĘPNY KROK` i `DEPLOY/PUSH`. Operator, Evaluator
i Final Control nie integrują, nie deployują i nie pushują. Historyczne routingi są
wyłącznie w [`docs/archiwum-procesu/`](../../../docs/archiwum-procesu/).

## Konflikt kontraktu i integracja allowlist-only

Gdy dispatch/kod/testy wymagają sprzecznego zachowania dla tego samego ID — Operator STOP,
nie koduje dalej, nie liczy to jako rundy, zapisuje `dyspozycje/autobot/runs/<ID>/decision-abc.md`
(opis konfliktu, bez proponowanego rozwiązania) i ustawia razem `DECISION_REQUIRED` (ledger)
oraz `ABC-OCZEKUJE` (rejestr tematu). Konflikt czysto inżynierski bez wpływu na gameplay/UX
idzie lekką ścieżką (jedna propozycja); konflikt z wpływem na gameplay/balans/UX wymaga
pełnego turnieju C-018 — `decision-abc.md` jest tylko wyzwalaczem, nigdy substytutem.

Integracja z drzewa współdzielonego z inną, niepowiązaną pracą jest **allowlist-only, per
plik i per hunk** — zakaz `git add -A`/`git add .`. Współdzielony plik niemożliwy do
bezpiecznego rozdzielenia dostaje status `INTEGRATION_PENDING` (nie `BLOCK`); orkiestrator
adresuje go przy najbliższym wolnym slocie, nie zostawia biernie czekającego. Weryfikację
„czy funkcja już jest wdrożona" rób wyłącznie przez `git merge-base --is-ancestor
<commit_funkcji> <commit_release>`, nigdy z pamięci. Pełny opis: playbook C-054–C-060.

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
