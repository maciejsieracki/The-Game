# 00-dispatch — R-AUTOBOT-MODEL-LUNA-HIGH-OPERATOR-EVALUATOR-Q1

STATUS: DISPATCHED (PROCESS CHANGE)
TEMAT: R-AUTOBOT-MODEL-LUNA-HIGH-OPERATOR-EVALUATOR-Q1
GOAL: Wymusić Luna High dla Operatora i Evaluatora w każdym dispatchu Codex.
KRYTERIA KOŃCA: aktywne źródła procesu i skill zawierają identyczny kontrakt; dispatch używa jawnie `model=gpt-5.6-luna` oraz `reasoning_effort=high`; brak dziedziczenia modelu; raporty zapisują model/effort; generator playbook.json i audyt dokumentacji przechodzą.
ALLOWLISTA: `.claude/skills/civ-autobot/SKILL.md`, `.cursor/rules/autobot-evaluator-operator.mdc`, `docs/decyzje/R-PROC-AUTOBOT.md`, `dyspozycje/autobot/README.md`, `playbook.md`, wygenerowane `dyspozycje/autobot/playbook.json`, rejestr i artefakty tego runu; bez `gra/**`.
IZOLACJA: Civ-clean-main-2026-08-20, HEAD 47cdca15, Fala 300.
PLAN TESTÓW: audyt zgodności wszystkich kopii routingu; generator Markdown→JSON; process-docs-audit; kontrola następnego dispatchu Operatora i Evaluatora po zmianie.
ABC: brak — jednoznaczna zmiana techniczna procesu.
DEPLOY/PUSH: NIE WYKONANO
