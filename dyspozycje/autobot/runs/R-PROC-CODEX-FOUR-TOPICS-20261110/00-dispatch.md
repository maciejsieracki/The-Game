# R-PROC-CODEX-FOUR-TOPICS-20261110 — dispatch (2026-11-10)

STATUS: OPERATOR
DOMAIN: PROCESS
TEMAT: R-PROC-CODEX-FOUR-TOPICS-20261110
GOAL: Process rules and Codex entry/routing docs enforce a maximum of four active topics; per topic, Operator → Evaluator → conditional Defense → independent Final Control run sequentially; Codex Operator/Evaluator/Final Control use gpt-6-luna high, while Defense follows existing per-environment routing; after Final Control the authorized loop completes main integration → Robocza deployment → push/readback → cleanup → next eligible topic, recording stage 11/11; current queue statuses are evidence-backed; heartbeat is recorded at each completion/status with no background wake claim when no callable scheduler exists.

WYZWALACZ: explicit owner authorization relayed by orchestrator on 2026-11-10 for process change and autonomous four-topic loop.
ZADANIE: same as GOAL.
KRYTERIUM: PRAWDA only if canonical process and Codex entry/routing docs agree on the limit, role order, model for the specified Codex roles, completion pipeline, queue status semantics, and scheduler/heartbeat rule; all active queue entries match one timestamped local readback; game code unchanged.
ALLOWLISTA: README.md; docs/decyzje/R-PROC-AUTOBOT.md; docs/procesy/INDEX-PROCESU.md; .cursor/rules/autobot-evaluator-operator.mdc; .claude/skills/civ-autobot/SKILL.md; dyspozycje/REJESTR-PROSB-I-ZADAN.md; dyspozycje/autobot/runs/README.md; dyspozycje/autobot/KOLEJKA-CODEX-FOUR-TOPICS-20261110.md; this run directory.
BAZA: main at d0ccc260e (2026-11-10). Handover evidence: origin/handover-20261110 at b385ce433; current deployment readback main d0ccc260e includes FALA 606. Do not duplicate FALAs 589–606.
RUNDY: 3/5
MODEL: Operator gpt-6-luna / high; Evaluator gpt-6-luna / high; Final Control gpt-6-luna / high. Conditional Defense and integration use existing/current environment routing. This Codex routing does not change Claude routing.
IZOLACJA: shared workspace /workspace/main-integration-20261029. Process documents only; no edits to gra/, gra-robocza/, or gameplay code.
TESTY: process-docs-audit.cjs; diff-check; focused searches for stale or contradictory Codex routing/loop wording.
DEPLOY/PUSH: authorized by the owner delegation for the four-topic loop after Final Control; process-only Robocza deploy is N/A with reason; push still requires remote readback.
NASTĘPNY KROK: independent Evaluator after this Operator report; no evaluation performed by Operator.

## Rejestr korekty po Evaluatorze — runda 2 (2026-11-10)

Raport `20-evaluator.md` dla rundy 1 zwrócił BLOCK z trzema zastrzeżeniami. Bieżąca runda odnotowuje: świeży timestampowany readback `HEAD`/`origin/main`/`ls-remote` i aktywne role; jawny lokalny ranking bez przypisywania rankingu źródłom, które go nie zawierają; oraz brak narzuconego modelu/effortu integratorowi. Claude oraz routing Obrony pozostają według istniejących reguł środowiskowych. Szczegóły i kontrole są w `21-operator-response.md`.

## Rejestr korekty administracyjnej po Final Control — runda 3 (2026-11-10)

`50-final-control.md` rundy 2 pozostaje **FAIL** i nie jest nadpisany. Runda 3 ograniczona jest do dodania `dyspozycje/autobot/runs/README.md` do allowlisty, oznaczenia starego statusu w rejestrze jako historycznego, dopisania aktualnej korekty oraz nowego timestampowanego readbacku przed jakimkolwiek kolejnym dispatchiem. Szczegóły i świeży odczyt są w `22-operator-response-r3.md`; po tej korekcie wymagane są niezależny Evaluator i Final Control.
