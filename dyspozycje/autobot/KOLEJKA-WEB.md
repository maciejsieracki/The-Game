# KOLEJKA WEB — tematy gotowe do uruchomienia (czytana przez heartbeat :17 i :47)

Zasada (właściciel 2026-11-12): zawsze 4 aktywne tematy. Gdy heartbeat zastaje mniej niż 4 aktywne workflowy web,
MUSI w tej samej turze uruchomić kolejny temat z poniższej listy (Workflow z podanym scriptPath i args), a nie tylko raportować.
Aktywny = agent-*.jsonl zmodyfikowany w ciągu ostatnich 10 minut i brak wyniku FC w journal.jsonl.

Kolejność (od góry):
1. R-WEB-BATTLE-BARB-UNIT-OVERPOWER-AUDIT-Q1 — audyt read-only (przewaga wojownika barbarzyńców, hipoteza zwiadowcy).
   scriptPath: scratchpad/WEB-BATTLE-BARB-UNIT-OVERPOWER-AUDIT-Q1.js
   args: {"id":"R-WEB-BATTLE-BARB-UNIT-OVERPOWER-AUDIT-Q1","tag":"BARBAUD","mode":"full","branch":"","cand":"<origin/main>","opModel":"claude-haiku-5-5","round":1}
2. R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1 — teksty administratora ulepszeń (wyjaśnienie w tooltipie, nie w treści). DO NAPISANIA: dispatch (00-dispatch + DODATEK) → skrypt mkwf → Workflow.
   Źródła: gra/src/ui/buildModeHud.ts (~191–196, 683, 743, 751), gra/src/game/auto-build-gate.ts (AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT).
3. Wznowienie W35 (R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1, wf_e6f8a7c9-0d8) — tylko resumeFromRunId, nie nowy temat.

Tematy zajęte (nie uruchamiać ponownie): R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1, R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1, R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1, R-WEB-BATTLE-HIT-MODE-SETTING-Q1.
Tematy w kolejce, ale z zakazem startu bez zgody: R-WEB-BATTLE-DETERMINISTIC-EXPECTED-OUTCOME-Q1 (zastąpiony przez HIT-MODE — NIE uruchamiać).
Jeśli lista się wyczerpie: wybierz pierwszy `pending` z TaskList (web), napisz dispatch (00-dispatch + DODATEK) na docs-branchu, uruchom Workflow.
