STATUS: PASS-WITH-NOTES (kod i testy zielone; audyt NAP → DECISION_REQUIRED)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-AI-ALLIANCE-INITIATIVE-THRESHOLD-054-ALIGN-Q1
GOAL: inicjatywa AI do sojuszu 0,6 → 0,54 (jedna wartość dla obu torów); audyt NAP prog_relacja 50 vs 110.
BAZA: a86a847d7 (origin/main).
ZMIANY-COMMIT: SHA = HEAD z tym raportem. Pliki: gra/data/ai-params.json (0,6→0,54); gra/src/game/ai.ts (PROG_SOJUSZ = DIPLOMACY_PARAMS.progSojuszWillingnessMin, +import); gra/tools/diplo-alliance-gate-test.cjs (+1 asercja zgodności); ten raport. Istniejących asercji nie zmieniano (ai-test T2S-a czyta PROG_SOJUSZ importem).

ODCZYTY (plik:linia):
- gra/data/ai-params.json:338 — wartość runtime inicjatywy AI (0,54)
- gra/src/game/ai.ts:6357 — PROG_SOJUSZ (fallback, z DIPLOMACY_PARAMS)
- ai.ts:6826 — p.progSojusz z staticAiParam
- ai.ts:7536 — minSojuszAlly (bramka inicjatywy AI)
- gra/src/game/diplomacy.ts:241 — DIPLOMACY_PARAMS.progSojuszWillingnessMin = 0,54 (literał TS)
- diplomacy.ts:790-791 — skalowanie per trudność (klastry siostrzane), bez zmian
- diplomacy.ts:822 — warunek sojuszu siostrzanego
- diplomacy-proposals.ts:1709 — tor gracz→AI
- ai-ai-treaty-evaluate.ts:194 — tor AI↔AI (E1)
- gra/data/diplomacy.json:61 — kopia danych 0,54, bez zmian
Dług: 0,54 jako literał TS (diplomacy.ts:241) i w diplomacy.json:61; REPIN Rust: ai_diplomacja_prog_sojusz.

AUDYT NAP — DOWÓD ŻYWEJ ŚCIEŻKI: prog_relacja=50 NIE jest martwa. Probe (esbuild, computePlayerAcceptanceSides('nap')): rel 61 → accepted=true, relRequired=50 (strona wychodząca i przychodząca); rel 109 → accepted=true; progNapRelacja (diplomacy.json:51, bramka AI/evaluatora) = 110. Ścieżka: diplomacy-acceptance-points.ts:374 → relOk → accepted (`accepted = basketOk && relOk`, ok. l.321); UI pokazuje „wym. 50” (diplomacyTradeBasket.ts:1153). ai-ai-treaty-evaluate.ts:203 dla NAP używa progNapRelacja (110), nie prog_relacja. Nie zmieniono wartości 50. → DO DECYZJI WŁAŚCICIELA: ustawić nap.prog_relacja na 110 (zalecenie: jedna wartość z progNapRelacja) czy zostawić 50.

TESTY (surowe wyniki):
- tsc --noEmit: exit 0 (przed i po)
- logic-test: 213 linii PASS, exit 0 (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/33
- unit-replace-test: exit 0 (wyjście bez licznika)
- combat-test: exit 0 ("All sanity checks passed.")
- ai-test: 297 passed, 0 failed (po zmianie)
- diplo-alliance-gate-test: 20 PASS, 0 FAIL (po)
- diplo-treaties-ai-parity-test 80/0; diplo-treaties-power-parity-test 50/0; diplo-peace-tail-integration-test 42/0; diplo-war-peace-sim-test 25/0
- diplomacy-acceptance-points-test: 304/0 (przed i po); diplomacy-test 149/0; ai-ai-treaty-evaluate-test 21/0 (mutanty niewykryte 0); city-state-alliance-test 74/0; diplo-nap-border-threshold-test 14 OK/0
Mutacja kontrolna: ai-params przywrócone do 0,6 (kopia edycją pliku, nie git checkout) → diplo-alliance-gate-test 19 PASS / 1 FAIL (czerwony); przywrócono z kopii, ponownie 20/0.

ZMIERZONO / NIE ZMIERZONO:
- Pomiar skutku (sojusze AI, 3 ziarna × 100 tur): NIE ZMIERZONO — brak gotowego harnessu; diplomacy-alliance-sim.cjs to statyczna tabela stance, nie symulacja tur.
- Wiki/Civpedia: NIE ZMIERZONO — w src nie znaleziono wzmianki 0,6 dla inicjatywy; przeglądu wiki nie wykonano.

BLOKADY: brak (poza decyzją NAP powyżej).
RUNDY: 1/5
NASTĘPNY KROK: ABC właściciela (NAP prog_relacja 50 vs 110); potem Evaluator na SHA z sekcji ZMIANY-COMMIT.
DEPLOY/PUSH: NIE WYKONANO
