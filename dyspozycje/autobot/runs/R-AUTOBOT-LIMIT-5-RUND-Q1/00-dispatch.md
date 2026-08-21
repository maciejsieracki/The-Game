# 00-dispatch — R-AUTOBOT-LIMIT-5-RUND-Q1

STATUS: DISPATCHED
TEMAT: R-AUTOBOT-LIMIT-5-RUND-Q1
GOAL: Ustanowić i spójnie wdrożyć maksymalnie 5 rund Operator→Evaluator dla jednego ID; po 5. nieudanej/niezamkniętej próbie zgłosić jawne przekroczenie limitu i zatrzymać automatyczne ponawianie do decyzji orkiestratora/właściciela.
KRYTERIA KOŃCA: zgodność kanonu, skillu, alwaysApply rule, playbook.md, wygenerowanego playbook.json i guardrails/raportów; definicja licznika rund; status LIMIT-5-EXCEEDED; testy/scaffold smoke; niezależny Evaluator; brak rozjazdu z BLOCK/TIMEOUT/ABC.
ALLOWLISTA: docs/decyzje/R-PROC-AUTOBOT.md; .claude/skills/civ-autobot/SKILL.md; .cursor/rules/autobot-evaluator-operator.mdc; playbook.md; dyspozycje/autobot/playbook.json wyłącznie przez generator; właściwe pliki guardrails/raportów, jeśli recon wykaże konieczność; artefakty tego runu.
IZOLACJA: Civ-clean-main-2026-08-20, baza HEAD 47cdca15; nie pracować w starym katalogu Civ.
PLAN TESTÓW: grep porównawczy wszystkich warstw; generator playbook.md→json bez rozjazdu; autobot-smoke; test granic 4/5/6 rund; raportowanie przekroczenia i zatrzymania pętli.
ABC: brak — właściciel podał limit i oczekiwane zachowanie literalnie.
DEPLOY/PUSH: NIE WYKONANO

## DECYZJA WŁAŚCICIELA — MANUAL RESUME PO LIMIT-5 (2026-08-20)

Jeżeli dowolny temat zakończy pięć negatywnych rund i otrzyma kanoniczny status
`LIMIT-5-EXCEEDED`, właściciel zezwala na ręczny nowy cykl tego samego pełnego ID
z Operatorem `gpt-5.6-luna`, `reasoning_effort=high`. Nie jest to automatyczna runda 6,
historia poprzednich rund pozostaje zachowana, a Evaluator i Final Control również
działają na Luna High. Nowy cykl wymaga jawnego raportu porównawczego błędów i blokad.

Nie stosować tej decyzji do blokady wynikającej wyłącznie z izolacji, pojemności,
uwierzytelnienia lub innych przyczyn, jeżeli temat nie osiągnął faktycznie pięciu
negatywnych rund.
