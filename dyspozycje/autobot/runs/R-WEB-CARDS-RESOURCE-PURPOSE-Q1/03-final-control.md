STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-CARDS-RESOURCE-PURPOSE-Q1
GOAL: Karty TOP 5 wyjaśniają zastosowanie surowca, pokazują podatek zamiast pieniądza/złota tam, gdzie produkcja zasila podatek, bez fałszywych _martweFrazy.
ZMIANY/COMMIT: Weryfikowano d4dd3982f (obrona r2) nad 324c1051a (operator r1) nad bazą 1493bb5c9 (ancestry OK). Gałąź FC: autobot/R-WEB-CARDS-RESOURCE-PURPOSE-Q1-fc-r2 (d4dd3982f + ten raport). Diff 1493bb5c9..d4dd3982f: 20 plików, allowlista + odstępstwo generatorów; brak zmian liczb, silnika, WERSJE.md, gra-robocza, cityPanel.ts.
TESTY (własne, Node 22): tsc --noEmit 0 błędów; logic-test 213/213; card-resource-purpose-test 90/0; tech-cards-top5-test 594/0; building-cards-top5-test 1179/0; terminology-trade-vs-tax-test 779/0; trybunal-card-happiness-display-test 128/0; gen-tech-cards-top5 --check OK; gen-building-cards-top5 --check OK; building-detail-card-entitycard-migration-test 54/1 (diff cityPanel.ts base..d4dd3982f pusty, więc nie regresja tematu). Przegląd wizualny/Chromium: NIE_ZMIERZONO.

ORZECZENIE ZARZUTÓW:
1. wikiBundle/CIVPEDIA "złoto" przy produkcji budynków i ulepszeń: NAPRAW. Obrona poprawiła tylko 5 pojedynczych stron. Katalogi zbiorcze zostały: gra/src/data/wikiBundle.json nadal ma "Daje: **+1 żywność, +1 złoto**" (Obóz łowiecki) i "Daje: **+1 złoto, +1 żywność**" (Warzelnia soli); źródło docs/PORADNIK-GRACZA/28-katalog-ulepszen.md linie 18, 27, 82, 90, 234, 244. docs/PORADNIK-GRACZA/45-katalog-budynkow.md linie 34, 41, 51, 99, 113, 121, 128, 225, 232, 278, 290, 321, 360, 368, 413 (Port handlowy "+5 złoto", Magazyn "+1 złoto", Sąd "+2 złoto" itd.) to produkcja budynków klasy A. Razem ok. 30 trafień "+N złot*" w docs/PORADNIK-GRACZA i docs/encyklopedia, w wikiBundle ok. 33. Karty mówią "podatek", CIVPEDIA nadal "złoto".
2. Brak "do czego służy" w CIVPEDIA (Warzelnia): ODDAL (naprawione w warzelnia_soli.md, test wiki dodany).
3. Audyt ulepszeń terenu: ODDAL dla 8 ulepszeń surowcowych (pole zastosowanie_surowca, wiersz "Do czego", test). Reszta ulepszeń nie jest surowcowa; przegląd językowy NIE_ZMIERZONO, nie blokuje.
4. Test cegły/epoka: ODDAL (wyjątek usunięty; test wymaga dokładnie wielka_kuznia i wielka_odlewnia w epoce 4).
5. Luźny PURPOSE_RE: ODDAL (regex zawężony; pokrycie danymi dla brązu, żelaza, rudy, koni, złota).
6. Warsztat oblężniczy vs Katapulta: ODDAL (nadpisanie usunięte; cmz "otworzyć dostęp do Katapulty" potwierdzone w building-cards-top5.json).
7. Odstępstwo od allowlisty (gen-*.cjs, card-text-corrections.cjs, *.korekty.json): ODDAL, akceptuję (zmiany wyłącznie tekstowe, --check zielone).
8. Klasa C (cuda bonus pieniadz, premia morska Portu): DO DECYZJI CZŁOWIEKA. Obrona zweryfikowała w wonders-data.ts:250-262, że to dochód z tras do skarbca. Pytanie ABC do zadania przez orkiestratora (A rekomendacja: zostaje "Pieniądz"; B: "Podatek" wymaga zmiany silnika, poza tematem; C: "Dochód z tras"). Cuda w katalogach docs (91-katalog-cudow-antyk.md, 15-kultura-religia-cuda.md:182) czekają na tę decyzję.
9. Pretorium "dochód": ODDAL ("Najwięcej podatku w łańcuchu").
10. Niezmierzone wizualnie i porażka entitycard-migration: ODDAL (niezależne od tematu). HUD/tooltipy w main.ts i cityPanel.ts poza allowlistą: osobny temat.

WERDYKT: jeden NAPRAW (pkt 1) => FAIL; runda wraca do Operatora z tym samym ID.

CO POPRAWIĆ W RUNDZIE 3 (pkt 1):
- W docs/PORADNIK-GRACZA/28-katalog-ulepszen.md i 45-katalog-budynkow.md (źródła wikiBundle) zamienić "+N złoto/złota" przy produkcji budynków i ulepszeń (klasa A: baza.pieniadz/bonus.pieniadz) na "podatek" w poprawnej odmianie. Klasę B (koszty, utrzymanie ¤/t, rush za złoto, Mennica) zostawić.
- Cudów nie ruszać bez decyzji ABC klasy C; odnotować w raporcie.
- Zregenerować wikiBundle.json generatorem; dodać strażnika w teście: brak "+N złot*" w wierszach "Daje:" i tabelach katalogów budynków/ulepszeń (poza jawnie wymienioną klasą B/C).
- Allowlista: dopuścić docs/PORADNIK-GRACZA/{28,45}-*.md jako źródło wikiBundle (odnotować).
BAZA rundy 3: autobot/R-WEB-CARDS-RESOURCE-PURPOSE-Q1-fc-r2 (nie 324c1051a).

KOLEJNOŚĆ INTEGRACJI: brak integracji (FAIL). Po PASS rundy 3: integracja na main; origin/rust-port/parity-v2 to osobna linia, pliki tematu poza rust-port, kolejność dowolna. Czy Rust ma kopie tych tekstów kart: NIE_ZMIERZONO.
BLOKADY: pkt 1 (NAPRAW); pytanie ABC klasy C.
RUNDY: 2/5 (po FC); następna 3/5.
NASTĘPNY KROK: Operator r3 (to samo ID), Evaluator, Final Control.
DEPLOY/PUSH: NIE WYKONANO
