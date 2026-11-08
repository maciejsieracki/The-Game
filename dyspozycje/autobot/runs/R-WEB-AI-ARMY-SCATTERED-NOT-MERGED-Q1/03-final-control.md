STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1
GOAL: Ustalic, dlaczego AI prowadzi wojsko jako rozproszone pojedyncze armie (zrzuty 37/38), i naprawic to minimalnie.
ZMIANY/COMMIT: kod do integracji 5065852a2 (na 5b04cc26d, baza c4a541a27). Diff c4a541a27..5065852a2 w allowliscie: ai.ts, army-concentration.ts, narzedzia gra/tools, katalog runu. main.ts, armyMerge.ts, warAllInCapital.ts, WERSJE.md, gra-robocza, rust-port, src-tauri nietkniete. git diff --check czysty.
TESTY (odtworzone przez FC na 5065852a2, EXIT=0): ai-army-scattered-merge 33/0; army-concentration 56/0; army-consolidation mutacje KILLED; army-consolidation-e2e 6/0; ai-army-replacement-concentration 35/0 (atrybucja 0.132 / 0.024 / 0.021); ai-move-full-range 20/0; planned-march 18/0; ai-move-range 46/0 (jedno uruchomienie rownolegle z innym testem dalo 45/1, trzy kolejne 46/0 - flake obciazeniowy); war-allin-capital-quick noLandPath hash 11c252a67bca53c4 (zgodny); tsc --noEmit czysty.
WERDYKT ZARZUTOW:
1. Brak pomiaru live: DO DECYZJI ORKIESTRATORA (wykonac pomiar poza limitem 590 s albo jawnie pominac). Nie jest wada kodu; mechanizm (c)/(d) potwierdzony testem na prawdziwym decideAITurn. ODDAL.
2. Zlagodzone testy (E6, replacement-concentration, D2 tolerancja 0,5 pp): ODDAL - uzasadnione w komentarzach, koszt = min. 1 tura opoznienia, ograniczony limitem zastoju 6 tur.
3. Stan stackGatherState niezerowany: NAPRAWIONE w obronie (dropStaleOwnerGatherState, test czerwony bez mechanizmu). Reszta ograniczenia (zapis o turze >= ostatnio widzianej) - skutek najwyzej do 6 tur licznika. ODDAL.
4. Czas tury AI: wzrost tylko w przejsciowej fazie zbierania (28 vs 12,6 ms chmura 40; stos 40 ustalony 118 vs 129 ms). ODDAL, akceptowalne.
5. Atrybucja mutacji: NAPRAWIONE (trzy warianty). ODDAL.
6. army-recruitment-concentration 3 awarie: odziedziczone z c4a541a27 (te same asercje). ODDAL; osobny temat.
BLOKADY: pomiar live NIE_ZMIERZONO (decyzja orkiestratora). ai-move-range-collision-test nie uruchamiany.
RUNDY: FC po 2/5 (brak NAPRAW)
NASTEPNY KROK: integracja orkiestratora: merge/cherry-pick 5065852a2 (z 5b04cc26d) na biezacy main. Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (zmiany tylko w gra/src/game i gra/tools); najpierw integracja web do main, parity-v2 pozniej wg REPIN (rust-port wstrzymany do konca weba).
DEPLOY/PUSH: NIE WYKONANO
