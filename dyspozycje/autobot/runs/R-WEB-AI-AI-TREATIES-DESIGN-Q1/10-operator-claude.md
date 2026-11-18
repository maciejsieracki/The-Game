STATUS: PASS
DOMAIN: GAME (analiza/projekt)
TEMAT: R-WEB-AI-AI-TREATIES-DESIGN-Q1
GOAL: dokument dyspozycje/analizy/AI-AI-TREATIES-DESIGN.md — mapa kodu z liniami, punkt wpięcia toru AI↔AI, parytet i dopłata D, wpływ na wojny, plan testów, pytania ABC (P-1…P-7), etapy E0–E6. Bez zmian w gra/.
ZMIANY-COMMIT: dyspozycje/analizy/AI-AI-TREATIES-DESIGN.md + dyspozycje/autobot/runs/R-WEB-AI-AI-TREATIES-DESIGN-Q1/10-operator-claude.md (baza c8b0e498b). Commit: patrz SHA w StructuredOutput.
TESTY: NIE ZMIERZONO — brak zmian w gra/, nie uruchamiano npm ci (brak node_modules w worktree), tsc i testy logiki nie były wykonywane. Symulacji ≥3×150 tur nie uruchamiano.
BLOKADY: brak. Rozjazdy do decyzji właściciela: próg sojuszu 0,54 (diplomacy.ts:241, ocena propozycji) vs 0,6 (ai-params.json:337, inicjatywa AI); NAP prog_relacja 50 (diplomacy-acceptance-points.json) vs progNapRelacja 110 (diplomacy.ts:218).
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Sonnet) przeglądu dokumentu; decyzje P-1…P-7 przez ABC właściciela przed E1.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Poprawka do dispatchu: runAiAiPeaceTick jest w gra/src/game/diplomacy-ai-forced-peace.ts:364, nie w war-weariness.ts.
- Potwierdzono statycznie: zaproponuj_sojusz / zaproponuj_pakt generowane dla AI-partnera są cicho odrzucane (main.ts:45756 gałąź tylko dla targetId===0). Warto to ująć w E0.
- Wasalizacji AI brak w kodzie (ai.ts:6257 TODO); typ Wasalizacja istnieje w types/diplomacy.ts:26.
- Kilka odniesień liniowych oznaczono „~” (przybliżone); reszta zweryfikowana grepem/odczytem.
