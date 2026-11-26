STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-MAP-RIVER-MOUTH-GAP-FIX-Q1
GOAL: wymusić ujście głównej rzeki, gdy odstęp wzdłuż wybrzeża > limit (Standard 7, Mała 5); kontynenty 42 i pangea 7 do worstGap <= 7.
ZMIANY/COMMIT: tylko ten raport i dowody w repro/ (diff eksperymentu 2b-lite, surowe wyjścia). Kod gry gra/src/map/gen-helpers.ts w tym commicie NIE zmieniony (eksperyment 2b-lite wycofany, patrz niżej). Baza kodu: e80d07efb (gen-helpers.ts identyczny z deceeeaf3 i z obroną).
TESTY (surowe wyjścia w repro/raw-*.txt):
- Baza, kontynenty seed 42, 168x120, Standard (surowe: repro/raw-baseline-kontynenty42-seed42.txt): worstGapAll=18, 8 z 20 mas łamie limit: 265:15, 145:11, 12:12, 12:9, 10:10, 590:10, 1011:8, 19:18. mapGen total=118124 ms (riversMain 76388, riversFill 36535). Czas rzeczywisty 1m59s.
- Eksperyment 2b-lite (diff: repro/option-2b-lite-experiment.diff; surowe: repro/raw-2b-lite-kontynenty42-seed42.txt): w luce ponad limit (4 najdalsze heksy), jeśli w promieniu 2 od heksa są 1–3 rzeki NIE-główne, usuń je i ponów ujście. Wynik: worstGapAll=18, ta sama lista złych mas (265:15, 145:11, 12:12, 12:9, 10:10, 590:10, 1011:8, 19:18). Czas total=122925 ms (+4%, w szumie). Wniosek: w tej postaci wariant 2b NIE domyka luk. Wycofany.
- Wariant sep 2->1 (diagnoza r2, eksperyment B): worstGapAll 18->16, masa 19: 18->9, ale ZŁAMUJE regułę sąsiedztwa rzek (zakaz z dispatchu). Nie wdrażany.
- Testy: NIE ZMIERZONO w tej rundzie: test river-mouth-gap-enforce-test.cjs (nie zmieniany w tej rundzie, czerwony wg r1), mutacja, pangea 7, 3 dodatkowe mapy, mała mapa, Ziemia, bramki (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, climate-band, river-sea-buffer, rodzina rzek), piny generatora, wydajność po naprawie. Powód: brak naprawy, której te pomiary dotyczą. (tsc na bazie: uruchomiony, bez błędów; jego wynik nie jest dowodem dla zmiany.)

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. PRZYJMUJĘ. Naprawa kodu nie powstała. Zmierzone: brak działającej naprawy w granicach reguł.
2. PRZYJMUJĘ. Rozbicie kandydatów ujścia per masa NIE ZROBIONE w tej rundzie (liczniki globalne z r2 nie są per masa). Liczby 75879/60215/62731/17750 są globalne i zachowane jako dane z r2.
3. ODRZUCAM z dowodem: częściowa naprawa wymagałaby albo zmiany reguły sąsiedztwa (sep 2->1, daje masę 19: 18->9, łamie zakaz dispatchu), albo wariantu, który w pomiarze nie zmienił worstGap (2b-lite: 18->18). Brak dopuszczalnej częściowej naprawy = BLOCK zgodny z dispatchem ("BLOCK tylko przy realnej przeszkodzie technicznej z dowodem"). Opcja C (wyjątek dla małych mas 10–12) NIE przetestowana i nie usunie luk mas 19 i 265: przyjmuję brak testu.
4. PRZYJMUJĘ i naprawiam: surowe wyjścia dołączone (repro/raw-baseline-kontynenty42-seed42.txt, repro/raw-2b-lite-kontynenty42-seed42.txt). Skrypt odtwarzający: repro/r3-river-mouth-gap.cjs (wymaga bundle.cjs i gra/node_modules).
5. PRZYJMUJĘ: pangea 7, 3 dodatkowe mapy, mała i Ziemia NIE ZMIERZONO. Powód: brak naprawy do pomiaru.
6. PRZYJMUJĘ: raport r1 i r2 są rozdzielone w pliku 10-operator-claude.md (oba w historii). Tutaj podaję tylko liczby zmierzone w tej rundzie. Numer linii: zweryfikowany grepem: topUpMainRiverCoastMouthGaps = gen-helpers.ts:9787 (w bazie).
7. PRZYJMUJĘ i testuję częściowo: wariant 2b (usunięcie rzek nie-głównych blokujących pierwszy krok) przetestowany w postaci 2b-lite (promień 2, do 3 rzek, 4 heksy w luce). Nie domyka luk. Pełny wariant 2b (przesunięcie rzek, nie tylko usunięcie; większy promień) NIE przetestowany.

DIAGNOZA (z r2 i pomiaru bazy tej rundy):
- Ścieżka: topUpMainRiverCoastMouthGaps (gen-helpers.ts:9787) -> topUpMainRiverCoastMouthGapsOnce (:9708) -> tryPlaceMainRiverAtMouth (:9931) -> traceRiverFromCoast (:6453) -> growRiverFromCoastInland (:6401) -> collectCoastInlandGrowCandidates (:6318).
- Dominujący bloker (r2, liczniki globalne): pierwszy krok w głąb lądu odrzucony przez riverGrowStepPassesSep (sep 2 od rzek głównych) i canRiverFlowThrough (sąsiad ma już rzekę). Usunięcie nie-głównych rzek w promieniu 2 nie zmieniło wyniku (2b-lite), bo blokuje też bliskość rzek głównych, których nie wolno usuwać.
- Per masa: NIE ZMIERZONO w tej rundzie.

RUNDY: 2/5 (runda 2 obrony; kolejna runda wymaga decyzji o wyborze: A przebudowa kolejności rzek / C zmiana reguły; po decyzji Operator Sonnet z uzasadnieniem).
NASTĘPNY KROK: orkiestrator: pytanie ABC do właściciela (wariant A: przebudowa rzek przed top-up vs wariant B: zmiana reguły 7/5 lub progu mas). Bez tej decyzji kolejna runda nie ma dopuszczalnej naprawy.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Eksperyment 2b-lite pokazał spadek liczby rzek nie-głównych bez poprawy: może to pogorszyć gęstość rzek w grze, więc nie został wdrożony.
- gra/node_modules usunięte po bramkach (zgodnie z dispatchem). Pliki generowane bundlera (.bundle-r3.cjs, .entry-r3.ts) usunięte, nie są w commicie.
