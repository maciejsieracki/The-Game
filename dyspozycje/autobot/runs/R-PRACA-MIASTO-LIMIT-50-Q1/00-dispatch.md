# 00-dispatch — R-PRACA-MIASTO-LIMIT-50-Q1

STATUS: DISPATCHED
TEMAT: R-PRACA-MIASTO-LIMIT-50-Q1
GOAL: Lokalny podział Pracy w mieście ma respektować ten sam kontrakt co nadrzędny podział cywilizacji: ulepszenia terenu maksymalnie 50%, reszta do budynków; brak sprzeczności między UI, logiką gracza/AI i zapisem.
KRYTERIA KOŃCA: recon implementacji; allowlista; test limitu 0/50/100; typecheck; Evaluator; Final Control; integracja; READY_FOR_DEPLOY.
ALLOWLISTA: gra/src/ui/cityPanel.ts; gra/src/ui/empireDetailPanel.ts; gra/src/ui/buildModeHud.ts; gra/src/game/cities.ts; gra/src/game/turn-economy.ts; gra/src/game/empire-city-defaults.ts; gra/src/game/ai.ts; ewentualnie celowane testy w gra/tools/; artefakty tego runu. Korekta allowlisty po reconie Operatora: lokalny suwak znajduje się w cityPanel.ts, a buildModeHud.ts zawiera odrębny historyczny automat poza tym zakresem.

## MANUAL RESUME — CYKL 2 PO LIMIT-5 (2026-08-20)

DECYZJA WŁAŚCICIELA: jawnie uruchomić nowy cykl tego samego ID jako eksperyment porównawczy modelu; nie jest to automatyczna runda 6 i nie zeruje historii 5/5.
HISTORIA: cykl 1 zakończony `LIMIT-5-EXCEEDED`; zużyte 5 rund pozostaje zapisane.
NOWY CYKL: 2, Operator startowy; następnie Evaluator i Final Control z tym samym ID.
MODEL OPERATORA: `gpt-5.6-luna`, `reasoning_effort=high`.
CEL PORÓWNANIA: mierzyć liczbę błędów merytorycznych, blokad infrastruktury, braków testów, naruszeń allowlisty i poprawek wymaganych przed PASS; nie porównywać surowej liczby tokenów bez kontroli zakresu.
IZOLACJA: Civ-clean-main-2026-08-20, baza HEAD 47cdca15; nie używać starego katalogu Civ.
PLAN TESTÓW: recon clampa i wiring; test limitu UI/logiki; tsc; testy sąsiednie; save/load, jeśli zmieniane są pola trwałego stanu.
ABC: brak nowego ABC na etapie reconu; przy niejednoznaczności przygotować ABC zamiast zgadywać.
DEPLOY/PUSH: NIE WYKONANO
