STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-MOVE-FULL-RANGE-Q1
GOAL: AI w marszu zuzywa pelny zapas ruchu bez zmiany balansu i kosztow terenu.
ZMIANY/COMMIT: kod bez zmian wzgledem 3805d1987 (warAllInCapital.ts, ai-move-full-range-test.cjs); raport Operatora ae309da9c; ten dokument obrony.
TESTY: bez nowych uruchomien; wszystkie zarzuty to uwagi bez wymagan poprawki kodu, a dowody Evaluatora (20/20, tsc, 94/4 przed i po, 6 testow barbarzynskich identycznych) zostaja w mocy.

ODPOWIEDZI NA ZARZUTY
1. Poza allowlista (warAllInCapital.ts): PRZYJMUJE. Odstepstwo uzasadnione (przyczyna wylacznie w st.claimed w emit i extendWalk); Final Control ma je odnotowac. Bez poprawki.
2. Skutek uboczny dla barbarzyncow (barbarians.ts:1853 wola planWarAllInCapital): PRZYJMUJE. Niedopatrzenie Operatora. Dowod: 6 testow barbarzynskich identycznych przed i po (wynik Evaluatora). Wplyw na balans w symulacji: NIE_ZMIERZONO. Do oceny Final Control i ewentualnego osobnego tematu.
3. Pomiar D nie like-for-like (rozne trajektorie, plains niezalezne od ziarna): PRZYJMUJE. D jest orientacyjny, 3 ziarna plains to jeden pomiar. Mocne dowody to A (15->18) i C (10->24) na ustalonych formacjach; GOAL nie opiera sie na D.
4. GOAL czesciowo (ok. 4,5-4,9% ruchow z niewykorzystanym zapasem): PRZYJMUJE jako opis stanu, nie blad. Przyczyny: wylacznosc heksu koncowego i oczekiwanie na grupe (zaprojektowane, niezmienione); ich zmiana to inny zakres.
5. Pomiar na silniku symulacyjnym, brak pelnej gry i osobnych testow mgly/granic: PRZYJMUJE. NIE_ZMIERZONO pozostaje jawne; poza B5/B6 brak osobnych testow mgly i granic obcych.
6. Raport ponad ok. 600 slow: PRZYJMUJE. Uchybienie formalne; ten dokument jest zwiezly.

BLOKADY: brak
RUNDY: 2/5 (obrona, bez zmian kodu)
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
