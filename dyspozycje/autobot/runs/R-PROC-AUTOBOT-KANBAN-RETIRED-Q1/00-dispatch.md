# Dispatch — R-PROC-AUTOBOT-KANBAN-RETIRED-Q1

**GOAL:** Usuń z aktywnych zasad AutoBot wymóg rejestracji Kanban, utrzymując file-based run, Operator → Evaluator → warunkowa Obrona → Final Control, etapy 1–11 i raportowanie prawdziwych blokad.

**Decyzja właściciela:** „Kanban był w OpenClass, tutaj nie użyjemy, nie używamy kanbanu. Wykreśl sobie zasady AutoBot Kanban.”

**Kryteria końca:** (1) bieżący kanon, Cursor rule, skill, README runów i C-063 w playbooku nie wymagają Kanbanu; (2) `playbook.json` wygenerowany z Markdown, generator dry-run bez różnic; (3) niezależny evaluator i Final Control PASS; (4) zmiana zintegrowana na main, push/readback potwierdzony. Stare runy/karty pozostają historyczne i nie są usuwane.

**Zakres:** tylko `docs/decyzje/R-PROC-AUTOBOT.md`, `.cursor/rules/autobot-evaluator-operator.mdc`, `.claude/skills/civ-autobot/SKILL.md`, `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`, `dyspozycje/autobot/runs/README.md`, `dyspozycje/autobot/playbook.json`, root `playbook.md`, `README.md`, rejestr celu oraz ten run.

**Stan:** run zarejestrowany; Operator ma wdrożyć spójne zastąpienie zasad; nie dotykać kodu gry ani historycznych artefaktów.
