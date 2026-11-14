# Final Control r4 — zapis orkiestratora z komunikatu FC (FC nie mógł zapisać pliku w sandboxie)
STATUS: PASS-WITH-NOTES
TEMAT: R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1 (W5)
SHA DO INTEGRACJI: 8bccc4034 (obrona r4; potomek 52d419e57 i 654b778b7). Diff 52d419e57..8bccc4034 = tylko gen-w5-march-vectors.mjs (N 220→500) i P6-WIRE-WAR-MARCH-PLAN.md (Z5). Kod Rust i testy nietknięte od r3.
ZARZUTY: 1 (skład rdzenia vs web: brak activeFlankingUnitIds, bramki historii/fal) ODDAL — jawne odchylenie + dług W8 w doc Z5; 2 (przepis generatora N=220 vs 500) ODDAL — N=500; 3 (czułość na mutanty, brak wektorów kampanii/all-in) ODDAL jako nota — mutant excluded.extend(used) zmierzony (padają test rdzenia i wektorowy); czułość kampanii/all-in NIE_ZMIERZONO.
TESTY (Evaluator r3 na 52d419e57): fmt OK, clippy -D warnings OK, lib 28, march_core 12, march_adapter 5, march_vectors 1, wire_war_state 14, state_snapshot 8, view 6, forced_step 24, declare 15, declare_peace 7 — 0 failed, 0 ignored. LOC: core 578, adapter 301, vectors 274, ai_war_march_plan 308 (≤600). FC nie odtwarzał wektorów z weba samodzielnie (NIE_ZMIERZONO przez FC).
DŁUGI (W8): odchylenie Z5 od weba (flankowanie, bramka historii/fal), Z3/Z4 (histereza, kontakt, isRelevantSiege), wektory kampanii i all-in, czułość mutantowa kampanii/all-in.
DEPLOY/PUSH: NIE WYKONANO (integracja orkiestratora po tym raporcie)
