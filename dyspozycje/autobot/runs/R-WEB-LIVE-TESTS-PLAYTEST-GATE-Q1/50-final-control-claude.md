STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1
GOAL: >=3 realne testy live zmieniaja wynik PRZED->PO na bramce "Zakoncz ture" w ?playtest=mapa; mutacja czerwono-zielona; hak (jesli jest) nie zmienia gry; inwentaryzacja >=20 wierszy; bramki zielone.
ZMIANY/COMMIT: kandydat 07d791453f9cb920b813e9e29ad4315eeaae903e; baza 5c187d3bf jest przodkiem (git merge-base --is-ancestor: tak). git diff --stat: 20 plikow, wszystkie w allowliscie (gra/tools: era-change-toast-live-test, sidepanel-diplo-dismiss-real-render-test, nowy live-playtest-gate-max-measure; dyspozycje/analizy/TESTY-LIVE-BRAMKA-PLAYTEST-2026-11-27.md; runs/**). gra/src BEZ ZMIAN, wiec hak nie zmienia gry bez flagi (ai-test 297/0 potwierdzone).
TESTY (wlasny przebieg FC, surowe wyniki):
- tsc --noEmit rc=0; logic 213/213; tech-tree 20/0; research 33/33; combat 6/6; unit-replace 21/21; ai-test 297 passed, 0 failed.
- sidepanel-diplo-dismiss-real-render-test (wlasny pomiar, ~155 s, rc=0): 35 pass, 0 fail. Logi operatora: PRZED 33/4, PO 35/0, MUTANT (bez przepiecia) 33/4 -> mutacja czerwono-zielona potwierdzona.
- forced-war-player-target-live-test: PRZED rc=1 "endTurn #1 nie ustabilizowal sie"; PO 12 pass/0 fail (log POST2; Evaluator odtworzyl 12/0). Czas 364-457 s > 280 s limitu: wyjatek zgloszony, nie skrocono.
- era-change-toast-live-test: PRZED C/D/E FAIL (bramka spichlerza), PO C/D/E OK; dalej pada sekcja F (pusta karta technologii, sections:0, jak w PRZED) i Escape/Timeout na [data-act=tree].
- diplo-truce-live-test: bez zmiany wyniku (27/1 przed i po; po prepareEndTurnGate canEnd=false w turze 9) - NIE liczy sie do trojki.
Trzy testy ze zmiana wyniku: forced-war, sidepanel-diplo-dismiss, era-change-toast. Kryterium binarne (>=3) spelnione.
OCENA ZARZUTOW EVALUATORA:
1 (poziom maksymalny): zasadnie wskazany __settingsLive. Obrona uruchomila runner na maksimum (Super Huge, hard, diplomacyWarLevel trudna, kultura trudny, koszty jednostek wysoki; echo ustawien potwierdzone), ale bramki nie da sie zmierzyc, bo tura 1 blokuje awaitingFirstPlayerCity (brak zalozonego miasta). Testy tematu nadal mierzone przy ustawieniach tych testow - NIE ZMIERZONO na maksimum. Luka jawna, nie blokuje kryterium binarnego, ale regula wlasciciela z 26.11 nie jest w pelni spelniona -> NOTA.
2 (forced-war 364 s): przyjete, wyjatek zgloszony jawnie - NOTA.
3 (sprzeczne sekcje dokumentu): dokument oznaczony STATUS/korektami w r3 - OK.
4 (era-change-toast F/Escape): przyczyna NIEZBADANA; F pada tak samo w PRZED, wiec to nie regresja tematu; Escape w PRZED byl OK tylko dlatego, ze test padal wczesniej - NOTA.
5 (bramki w raporcie): odtworzone przeze mnie, zielone.
BLOKADY: brak blokad dla werdyktu. Otwarte: pomiar na maksimum wymaga zalozonego pierwszego miasta; era-change-toast F/Escape; forced-war >280 s.
RUNDY: FC runda 3/5.
NASTEPNY KROK: integracja orkiestratora (FF kandydata do main; gra/src bez zmian - bez deployu).
UWAGI-DLA-ORKIESTRATORA: (a) temat nastepny: pomiar 3 testow na maksimum z __settingsLive + zalozeniem miasta; (b) zbadac F/Escape w era-change-toast; (c) skrocic forced-war ponizej 280 s albo zatwierdzic wyjatek.
DEPLOY/PUSH: NIE WYKONANO
