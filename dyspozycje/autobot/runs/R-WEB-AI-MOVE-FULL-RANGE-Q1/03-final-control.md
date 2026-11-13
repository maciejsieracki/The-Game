STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-MOVE-FULL-RANGE-Q1
GOAL: AI w marszu zuzywa pelny zapas ruchu bez zmiany balansu i kosztow terenu.
ZMIANY/COMMIT: kod `3805d1987` (gra/src/game/warAllInCapital.ts +46/-2; gra/tools/ai-move-full-range-test.cjs). Obrona 15d32abe4 (tylko dokumenty). Ten dokument: commit FC na branchu wf-fc-r-web-ai-move-full-range-q1 (baza 15d32abe4).

WERDYKT ZARZUTOW
1. warAllInCapital.ts poza allowlista: ODDAL. Przyczyna wylacznie w st.claimed (emit, extendWalk); logika zbiorki/omijania terytorium nietknieta. Odstepstwo odnotowane.
2. Skutek uboczny dla barbarzyncow (barbarians.ts:1853 wola planWarAllInCapital): ODDAL, z notatka. Testy barbarzynskie identyczne przed/po (pomiar Evaluatora); wplyw na balans w symulacji NIE_ZMIERZONO. Sugestia: osobny temat pomiarowy, jesli wlasciciel chce.
3. Pomiar D nie like-for-like: ODDAL. Dowodem sa A i C na ustalonych formacjach (15->18, 10->24).
4. GOAL czesciowo (ok. 4,5% niewykorzystania): ODDAL. Zaprojektowane (wylacznosc heksu koncowego, oczekiwanie grupy); inny zakres.
5. Brak pomiaru pelnej gry w przegladarce: ODDAL (NIE_ZMIERZONO jawne).
6. Raport >600 slow: ODDAL (formalne).
Zero NAPRAW, zero DO DECYZJI CZLOWIEKA.

WERYFIKACJA WLASNA (na 15d32abe4)
- ai-move-full-range-test.cjs --seeds=2 --turns=100: 20 passed, 0 failed, EXIT=0 (D1 94,6% vs 92,0%; D2 4,5% vs 8,4%; D3 2,35 vs 2,39 ms/ruch).
- tsc --noEmit: EXIT=0.
- Allowlista: diff a4eda2b7e..3805d1987 = warAllInCapital.ts, nowy test, dyspozycje/.../R-WEB-AI-MOVE-FULL-RANGE-Q1/**; 3805d1987..15d32abe4 tylko dokumenty runa. Zero gra-robocza, WERSJE.md, rust-port, ai.ts, main.ts.
- Regresje: polegam na dowodach Operatora/Evaluatora (zbior porazek identyczny przed/po, war-allin 94/4 w obu). Pelnego zestawu nie powtarzalem.
- node_modules usuniety.

BLOKADY: brak
RUNDY: 2/5 (FC)
NASTEPNY KROK: integracja orkiestratora: merge brancha FC (zawiera 3805d1987 + dokumenty) do origin/main. Kolejnosc wzgledem origin/rust-port/parity-v2 (b520768b0): temat dotyka tylko gra/ (web), parity-v2 nie koliduje plikowo; najpierw main, parity-v2 pobiera zmiane pozniej bez blokowania.
SHA do integracji: 3805d1987 (kod); koncowy SHA = commit FC tego brancha.
DEPLOY/PUSH: NIE WYKONANO
