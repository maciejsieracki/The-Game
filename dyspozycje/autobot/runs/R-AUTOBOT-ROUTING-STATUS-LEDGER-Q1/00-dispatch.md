# 00-dispatch — R-AUTOBOT-ROUTING-STATUS-LEDGER-Q1

STATUS: DISPATCHED
TEMAT: R-AUTOBOT-ROUTING-STATUS-LEDGER-Q1
GOAL: Uszczelnić routing stanów subagentów tak, aby każde zakończenie, przerwanie, timeout i zamknięcie było odnotowane, a pusty przebieg był jawnie klasyfikowany.
KRYTERIA KOŃCA: ledger per dispatch; statusy pending/running/completed/interrupted/timeout/closed; obowiązkowy raport lub jawny raport braku; watchdog bez nieskończonego czekania; zakaz duplikowania Operatora bez rozstrzygnięcia poprzedniego statusu; routing FAIL/BLOCK do tego samego ID; zamykanie zakończonych agentów; test procesu.
ALLOWLISTA: `dyspozycje/autobot/**`, `CLAUDE.md`, `.claude/skills/civ-autobot/SKILL.md`, `.cursor/rules/autobot-evaluator-operator.mdc`, `playbook.md` i wygenerowany `playbook.json` przez generator; bez `gra/**`.
IZOLACJA: Civ-clean-main-2026-08-20, baza HEAD 47cdca15, Fala 300.
PLAN TESTÓW: audyt dokumentów, test generatora, test przejść statusów i test braku notyfikacji; potwierdzić zachowanie po `completed`, `interrupted`, `not_found`, `timeout` i `close`.
ABC: brak — to jednoznaczny problem procesu.
DEPLOY/PUSH: NIE WYKONANO
