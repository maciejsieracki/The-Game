STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-VERIFY-LIVE-MAX-Q1 (tag VLIVE)
GOAL: zamknąć pozycje NIE ZMIERZONO z #38/#79 na poziomie maksymalnym ustawień w żywej grze; wynik w dokumencie dyspozycje/analizy/VERIFY-LIVE-MAX-2026-11-27.md
ZMIANY-COMMIT: brak zmian w gra/src ani gra/tools (użyto istniejących runnerów). Dodane: dyspozycje/analizy/VERIFY-LIVE-MAX-2026-11-27.md oraz ten raport. Baza: origin/main 6319eaf66 (merge-base sprawdzony w sekcji SHA poniżej).
TESTY:
- Pomiar 1 (limit wojen z graczem), seed 4242, tury 2–99, Dyplomacja=Trudna, flagi ON: 0 naruszeń (98 wierszy). Gracz w wojnie od tury 40 (72 pary-tury).
- Pomiar 2 (limit 2 sojuszy AI↔AI), seed 4242, tury 2–99, Trudna, flagi ON: 0 sojuszy w 98/98 turach, 0 naruszeń.
- Pomiar 3 (Żywność→Podatek, kurs 0,2): verify-live-food-to-tax-test PASS (kurs 0,2 na easy/normal/hard; 100→20). Żywa tura z Targowiskiem: NIE ZMIERZONO.
- Pomiar 4 (cesja miast): diplomacy-city-cession-live-test 17 PASS / 0 FAIL (1 miasto, żywo); peace-city-cession-negotiated-test 19 PASS / 0 FAIL (>1 miasto, logika). Cesja >1 miasta żywo: NIE ZMIERZONO.
- Pomiar 5a (FLEEMANUAL): flee-manual-measure 28 PASS / 0 FAIL, sha256 eda3b50dc7f6cfc52a3b3bdfa7ef4299b03b3035177998c4ee89e2bb58c6094e. Animacja NIE ZMIERZONO.
- Pomiar 5b (FORTRING, round-trip): NIE ZMIERZONO (czas i niestabilny Chromium przy obciążeniu maszyny).
- Bramki ogólne (tsc, logic, tech-tree, research, unit-replace, combat, ai-test): NIE ZMIERZONO w tym temacie — nie zmieniono kodu gry, więc bramki nie były wymagane dla zmian; nie uruchamiano.
- Bundle live: vite build do /tmp/vlive-q1-dist (poza repo), ok.
BLOKADY:
- Chromium SIGSEGV/„Target page … has been closed” przy wznowieniach ze slotu (t71, t81, t88, t97; część prób padła po 3 ponowieniach). Znany problem harnessu (#90).
- Obciążenie maszyny: load average 9–25 na 4 rdzeniach; tempo spadło z ~2 s/turę do 40–90 s/turę. Uniemożliwiło dojście do tury 120/150 i biegi seed 7.
- Nie zmierzono: tury 100–150 (seed 4242), seed 7 (wszystkie pozycje), żywa tura z Targowiskiem, żywa cesja >1 miasta, FORTRING, animacja odwrotu.
RUNDY: 1/5 (wyczerpanie zasobów czasowych w rundzie 1; brak powtórnej próby w tej rundzie)
NASTĘPNY KROK: (1) dokończyć bieg seed 4242 do tury 150 na czystej maszynie (wznowienie ze slotu dipl-measure-seed4242-all1-lvl-trudna); (2) seed 7; (3) FORTRING i żywa cesja >1 miasta jako osobny temat na czystym środowisku; (4) orkiestrator decyduje, czy brak sojuszy AI↔AI przy Trudna (0 w 98 turach) jest zamierzony — UWAGI-DLA-ORKIESTRATORA.
UWAGI-DLA-ORKIESTRATORA:
- Sojusze AI↔AI nie powstały ani razu przy Dyplomacji „Trudna” (seed 4242, t2–99). Obserwacja pomiarowa. Nie zgłaszam jako błędu gry bez porównania z łatwym/normalnym w tym samym ziarnie. Wymaga decyzji, czy zamierzone (bonusy za sojusze ÷3 wg hintu ustawienia).
- Dane surowe (poza repo): /tmp/claude-0/vlive-q1/diplo-trudna-s4242/ (seed4242-all1-lvl-trudna.jsonl, state.json, summary.json); analiza: /tmp/claude-0/vlive-q1/an/limits.py.
DEPLOY/PUSH: NIE WYKONANO
