STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-VERIFY-LIVE-B2-CIVTEST-HOOK-AND-WIZARD-Q1
GOAL: odpowiedź na 9 zarzutów Evaluatora (runda 1, FAIL); poprawiony hak __settingsLive; 5 testów verify-live rozszerzonych o żywą grę (start realnym doStartGame); sekcja 6 dokumentu z surowymi liczbami i kolumną TAK/NIE.
ZMIANY-COMMIT: gra/src/main.ts (hak __settingsLive w bloku ?civTest=1); gra/tools/verify-live-{unit-cost-pace,growth-toggle,diplo-war-level,improvement-cost-era,food-to-tax}-test.cjs; dyspozycje/analizy/WERYFIKACJA-NA-ZYWO-USTAWIENIA-2026-11-20.md (sekcja 6); ten raport. Baza: d42ec85605bc26a8cba70adfc1696504acab6f48. Kandydat wejściowy: 03e0ebbe1.

ODPOWIEDZI NA ZARZUTY
1. PRZYJĘTE. Każdy z 5 testów ma sekcję „ŻYWA GRA” (build gry z ?civTest=1, start przez REALNY doStartGame). Pokryte: koszty jednostek 3 tempa × 3 jednostki (rekrutacja, żywność, utrzymanie Pieniądz, surowiec); Dyplomacja 3 poziomy; Wzrost start WYŁ./WŁ.; koszt pracy ulepszeń (właściciel Brąz); zamiana Żywność→Podatek (bramka zamknięta). NIE ZMIERZONO: zamiana 100→20 w grze (wymaga Targowiska), plon Wzrostu, efektywne kary w turze.
2. PRZYJĘTE. Sekcja 6 dokumentu ma tabele 6a–6f z surowymi liczbami z gry i kolumnę TAK/NIE.
3. PRZYJĘTE jako pomiar. Procedura: start → saveRoundTrip → page.reload() → saveRoundTrip. Wynik: saved=true, brak pageerror, brak zdarzenia crash, kod wyjścia 0. SIGSEGV NIE ODTWORZONO (1 próba, headless). Ograniczenie: nie testowano wczytania aktywnej gry sprzed przeładowania.
4. PRZYJĘTE. unitCosts zwraca pieniadzUpkeep (unitUpkeep z tabelą economy-upkeep) i resourceUpkeep (totalUnitResourceUpkeep). Test live sprawdza oba.
5. PRZYJĘTE. improvementWorkCost(improvementId, ownerId) czyta gra/data/terrain-improvements.json i stosuje baseKosztPracaUlepszenia + scaleTerrainImprovementWorkCostForOwner. Oczekiwanie liczone w teście z danych i stałych (R_STAWKI_FALA2 = 2; mnożnik Brązu = 1), nie z bundla.
6. PRZYJĘTE. Tempo dla każdego właściciela = kosztJednostekPaceUtrzymania() (ta sama funkcja, której silnik używa: main.ts ok. l.4149 i l.9474). Zaszyte 'niski' usunięte. NIE ZMIERZONO: tura AI.
7. CZĘŚCIOWO ODRZUCONE Z DOWODEM. Dispatch (ZADANIE 1) wprost wymaga saveRoundTrip() jako „serializacja i ponowne wczytanie”, więc zapis do slotu wynika ze specyfikacji (cytat dispatchu). PRZYJĘTE: odstępstwo jest opisane w komentarzu haka i w sekcji 6f, a round-trip jest teraz testowany live (before == after).
8. PRZYJĘTE CZĘŚCIOWO. Kontrola negatywna: bez ?civTest=1 typeof window.__settingsLive === 'undefined' (asercja w verify-live-unit-cost-pace i verify-live-diplo-war-level). Nie dodano osobnego testu pinującego listę haków. Uruchomione testy main-guard i pinów haków (wszystkie zielone): road-hook-mainguard-test 19/0; diplo-war-peace-main-guard-test 35/0; army-merge-separate-return-mainguard-test 73/0; resource-ledger-hook-gate-test 6/0; diplomacy-sensible-deals-main-guard-test 22/0; ai-economy-measure-hook-test 25/25; forced-war-bronze-main-guard-test exit 0.
9. PRZYJĘTE. Raport R1 (BLOCK) zastąpiony tą rundą. Bramki zielone (poniżej), pozycje NIE ZMIERZONO wypisane w sekcji 6.

TESTY (surowe wyjście, kandydat po poprawkach = czubek tej pracy):
- node ./node_modules/typescript/bin/tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- combat-test: COMBAT TEST 6/6
- unit-replace-full-cost-test: 40 passed, 0 failed; ai-unit-replace-same-rules-test: 45 passed, 0 failed
- verify-live-unit-cost-pace: exit 0; harness BAZA ZIELONA; mutacja units-brazcost CZERWONA; ŻYWA GRA ZIELONA (3 tempa × 3 jednostki, negatywna kontrola)
- verify-live-growth-toggle: exit 0; mutacja growth-flat CZERWONA; ŻYWA GRA ZIELONA (start WYŁ./WŁ., round-trip before==after)
- verify-live-diplo-war-level: exit 0; mutacja diplo-zdrada CZERWONA; ŻYWA GRA ZIELONA (kara 10/20/30, bonus 12/6/4)
- verify-live-improvement-cost-era: exit 0; mutacja impcost-owner CZERWONA; ŻYWA GRA ZIELONA (farma 40, kopalnia_miedzi 88, kopalnia_zelaza 88)
- verify-live-food-to-tax: exit 0; mutacja food-rate-normal CZERWONA; ŻYWA GRA ZIELONA (kurs 0,2; enabled=false bez Targowiska)

BLOKADY (NIE ZMIERZONO na żywej grze):
(a) efektywne kary dyplomacji w turze (hak wystawia tylko skalowanie);
(b) plon ulepszeń WŁ./WYŁ. (hak nie wystawia plonu);
(c) zamiana Żywność→Podatek 100→20 w grze (wymaga Targowiska);
(d) koszty jednostek dla właściciela AI w turze;
(e) mutacje dowodowe na żywej grze (mutacje tylko na harnessie);
(f) sekcja „DECYZJE WŁAŚCICIELA” w dyspozycje/autobot/KOLEJKA-WEB.md nie występuje w tym worktree (grep 0 trafień): porównanie z decyzjami idzie do wartości z dispatchu i z KOSZTY-JEDNOSTEK-STAN-2026-11-20.md.

RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL, runda 1).

UWAGI-DLA-ORKIESTRATORA:
- Do potwierdzenia z właścicielem: utrzymanie Pieniądz jednostek jest mnożone epoką (economy-upkeep.ts scaleCostByEpoch): Procarz (Brąz) 8/t przy Niski, nie 4/t. Zgodne z kodem, ale nie wynika wprost z dispatchu ani z decyzji tempa.
- W tym worktree jest dowiązanie gra/node_modules (ignorowane przez .gitignore), tylko lokalne.
- Nie otwierałem nowych sesji, zadań ani harmonogramów.

NASTĘPNY KROK: Final Control, runda 2 (ten sam ID): weryfikacja zmian w gra/src/main.ts (hak), 5 testów verify-live (ŻYWA GRA) i sekcji 6 dokumentu.
DEPLOY/PUSH: NIE WYKONANO
