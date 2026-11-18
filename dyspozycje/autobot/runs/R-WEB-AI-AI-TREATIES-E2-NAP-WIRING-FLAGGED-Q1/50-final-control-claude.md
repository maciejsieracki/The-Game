STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tor AI↔AI, torAktywny=false domyślnie)
TEMAT: R-WEB-AI-AI-TREATIES-E2-NAP-WIRING-FLAGGED-Q1
GOAL: NAP AI↔AI w turze AI za przełącznikiem torAktywny=false, dopłata D złotem, kara za zerwanie, wygaśnięcie 15 tur.
ZMIANY/COMMIT: kandydat adf36c3387a95a702e54913990da5898b19da6d7 (potomek bazy fb5b2045a: git merge-base --is-ancestor = tak; origin/main od bazy zmienił tylko dokumentację). integration_sha = adf36c338. Diff vs baza: ai-ai-treaty-params.json (+torAktywny), ai-ai-treaty-tick.ts (nowy), main.ts (+97: import, wywołanie w turze, tickAiAiTreatyRequests, gałąź kary w breakTreatiesOnWar, hak testowy), ai-ai-treaty-nap-wiring-test.cjs (nowy), raporty. Allowlista zachowana; linia importu newGameMapDefaults nietknięta (zarzut 6 naprawiony). Ten raport: osobny commit (tylko 50-final-control-claude.md).
TESTY (surowe wyjście, ta runda, kandydat): tsc --noEmit exit 0; logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; ai-ai-treaty-nap-wiring ZIELONE (mutanty M4-M6 wykryte); ai-ai-treaty-evaluate 21/0; treaty-payment-wiring 468/0; treaties-power-parity 50/0; treaties-ai-parity 80/0; peace-tail-integration 42/0; war-peace-sim 25/0; alliance-gate 21/0; ai-test 297/0. Wartości równe wymaganym w dispatchu (moduły diplo nietknięte), brak regresji.
ZARZUTY:
1 (clamp kary Relacji przy Respekcie <30): ODDAL. Skala Respektu jest ograniczona 0..100 w całej grze; kara nie zejdzie poniżej dna. Tor wyłączony domyślnie. Założenie: zostaje clamp; ewentualna zmiana (reszta do Zaufania) to uwaga do E6.
2 (brak testu dynamicznego gałęzi kary): ODDAL jako NIE ZMIERZONO. Dispatch wprost dopuszcza NIE ZMIERZONO przy wiringu main.ts bez testu; funkcja czysta i bramka pokryte testem; -20 Zaufania z istniejącego zdarzenia, odczytane w kodzie.
3 (tick bez testu uruchomieniowego): ODDAL jako NIE ZMIERZONO, jw.; planer testowany czysto z mutantami.
4 (brak hash przed/po): ODDAL jako NIE ZMIERZONO (harness live: endTurn timeout, znany bloker #417/#418). Dowód zastępczy sprawdzony samodzielnie w kodzie: przy false tickAiAiTreatyRequests wraca w pierwszej linii, a gałąź kary jest krótko-spięta przez isAiAiTreatyTickEnabled() przed odczytem stanu; zero zmiany stanu, zero RNG/Date.
5 (brak tabeli PRZED): ODDAL; moduły diplo nietknięte, wyniki PO równe wymaganym.
6: NAPRAW wykonane przez obronę, zweryfikowane w diffie.
7: ODDAL (console.log dopuszczony; decyzja przed E6).
BLOKADY: brak dla integracji. Tor wyłączony, ryzyko dla gry minimalne.
RUNDY: FC 1/5.
NASTĘPNY KROK: integracja orkiestratora; wdrożenie ROBOCZEJ niewymagane (zachowanie gry bez zmian). Osobny temat LIVE-DOWÓD (test dynamiczny tick+kara, hash 3 ziarna x 30 tur) po naprawie harnessu; przed E6.
UWAGI-DLA-ORKIESTRATORA: /tmp/x (pozostałość testu NAP) do usunięcia; decyzje Z1 i Z7 do E6.
DEPLOY/PUSH: NIE WYKONANO
