# R-WEB-AI-AI-TREATIES-E1-EVALUATE-PURE-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora)

STATUS: PASS (obrona; ocenia Evaluator i Final Control)
DOMAIN: GAME (nowy moduł czysty + testy; niewpięty w grę)
TEMAT: R-WEB-AI-AI-TREATIES-E1-EVALUATE-PURE-Q1
GOAL: odpowiedzieć na 4 zarzuty Evaluatora (kandydat 70f5e231b) i zamknąć je dowodem albo poprawką.
ZMIANY-COMMIT: baza 70f5e231b. Commit kodu 083ed8b69: rename `relationDelta`→`breachRelationDelta`, `trustDelta`→`breachTrustDelta` w gra/src/game/ai-ai-treaty-evaluate.ts i gra/tools/ai-ai-treaty-evaluate-test.cjs (9+/9-). Ten raport jest w commicie następnym (SHA w polu sha odpowiedzi).

ODPOWIEDZI NA ZARZUTY:
1. D bez rabatu relacji: ODRZUCAM. Rabat `effectiveTreatyPnRequired` jest tylko dla GRACZA-płatnika. Partner AI płaci na bazie: diplomacy-pn-engine.ts:201 („Partner (AI) zawsze na bazie”), partnerTreatyPnRequired (diplomacy-pn-engine.ts:213), diplomacy-proposals.ts:874. W AI↔AI oba płatnicy są AI, więc `D = split.D` jest zgodne z konwencją. Testy A4a/A4b.
2. PW vs PN 1:1: PRZYJMUJĘ jako założenie (kod bez zmian). Ścieżka gracza porównuje PN bezpośrednio z D w PW: diplomacy-proposals.ts:956 (`givePn >= requiredD`), :969 (`duePn = requiredD - givePn`). Przyjęte: 1 PW = 1 PN dla dopłaty złotem.
3. Progi NAP i gotowość: ODRZUCAM jako defekt E1. NAP czyta progNapRelacja=110 i progNapZaufanie=30 z diplomacy.json:51–52, tak jak żywa ścieżka gracza (diplomacy-proposals.ts:1648) i AI (ai.ts:7442–7444). Wartość `prog_relacja: 50` w diplomacy-acceptance-points.json:8 nie jest czytana przez ścieżkę NAP (tylko przez gałąź przemarszu). Gotowość 0,54 z diplomacy.json:61 (testy A2, A15). Realny rozjazd: ai.ts:6353 `PROG_SOJUSZ = 0.6` (inicjatywa AI w ścieżce live). E1 go nie wpina; ujednolicenie na 0,54 należy do E2 (P-2).
4. relationDelta/trustDelta: PRZYJMUJĘ. Pola przemianowane na breach* (interfejs, acceptedExtras, komentarz, testy A12/A13, mutant M6). Przy zawarciu nadal zwracają −30/−20 (kara za zerwanie, P-4).

BRAMKI PO POPRAWCE (liczby z surowego wyjścia, komenda w katalogu gra/):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: 6/6 pass
- ai-ai-treaty-evaluate-test: 21 pass / 0 fail; mutanty KILLED 6/6 (mutanty niewykryte: 0)
- git diff --stat 70f5e231b..083ed8b69: 2 pliki, 9+/9-. Moduł importuje tylko się sam (grep w gra/src i gra/tools): brak wpięcia w grę.

ZAŁOŻENIA / LUKI (uzupełnione):
- Sąsiedztwo dostarcza wołający (`sharesBorder`); E1 nie liczy mapy (E2).
- Przy wpięciu E2 zastąpić stałą `PROG_SOJUSZ = 0.6` (ai.ts:6353) wartością z danych 0,54.

NIE ZMIERZONO: testy diplo-* po tej poprawce (moduł nie jest importowany przez grę, więc nie mogły się zmienić; nie uruchamiano ponownie).

UWAGI-DLA-ORKIESTRATORA:
- Do sprzątania: gra/node_modules (w worktree, z npm ci --ignore-scripts); logi /home/user/The-Game/.claude/worktrees/wf_npm.log, wf_tsc.log, wf_logic-test.out i pozostałe wf_*.out (poza katalogiem worktree, bo Operator nie może usuwać plików).
- Przed E2: wyrównać lub usunąć `prog_relacja: 50` dla nap w diplomacy-acceptance-points.json (martwa wartość dla NAP).

NASTĘPNY KROK: Evaluator (ponowna weryfikacja 083ed8b69 i tego raportu), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
