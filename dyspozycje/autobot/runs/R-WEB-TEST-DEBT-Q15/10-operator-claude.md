STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/GAME (dług testowy; zero zmian gra/src)
TEMAT: R-WEB-TEST-DEBT-Q15
GOAL: ustalić przyczyny dwóch znanych czerwonych testów na bazie 22f69d901; naprawić stary pin (zrobione); zrobić tabelę skanu testów po FALACH 931–935; zapisać analizę.
ZMIANY/COMMIT: gra/tools/unit-upkeep-cost-pace-test.cjs (skaner tempa: owner-aware wrapper paceUtrzymaniaWlasciciela, identyfikator pace, komentarze /* i /**); dyspozycje/analizy/DLUG-TESTOWY-Q15-2026-11-27.md; ten raport. Commit: patrz SHA w odpowiedzi operatora (git log -1 w worktree).
TESTY:
- tsc --noEmit: exit 0 (po npm ci --ignore-scripts)
- unit-upkeep-cost-pace-test: przed 80 ok / 1 FAIL; po 81 ok / 0 FAIL; mutacja (main.ts:34617 paceUtrzymaniaWlasciciela -> undefined) -> 80 ok / 1 FAIL; main.ts przywrócony
- wydarzenia-eliminacja-podboj-karta-test: 24 pass / 4 fail (dispatch podawał 1 FAIL): (0.5c) kicker null, (6a) (6b) (6c) wpis zamieniony na eot-hint-2-0; nie zmieniano asercji
- skan 18 testów FAL 931–935 (timeout 30 s): 15 OK wg wyniku, 1 środowisko (save-load-roundtrip-state-drift-test wymaga --dist), 2 bez linii podsumowania przy rc=0 (capital-capture-test, save-load-sort-test)
- logic 213 i ai-test 297/0: NIE ZMIERZONO w tej rundzie
BLOKADY: decyzja (jednozdaniowo): czy karta eliminacji ma przetrwać koniec tury pod swoim id (6a–6c), czy zamiana w eot-hint-* jest zamierzona; (0.5c) wymaga odtworzenia w przeglądarce — NIE ROZSTRZYGNIĘTE.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o (a) temacie odtworzenia (0.5c) i (b) decyzji o karcie eliminacji po końcu tury (6a–6c).
UWAGI-DLA-ORKIESTRATORA: dispatch podawał 1 FAIL dla testu eliminacji; faktycznie 4 (0.5c, 6a, 6b, 6c). Skan objął 26 testów, nie wszystkie ~200 pasujących. Test save-load-roundtrip-state-drift wymaga argumentu --dist (zbudowany dist) — warto ujednolicić w harnessie.
DEPLOY/PUSH: NIE WYKONANO
