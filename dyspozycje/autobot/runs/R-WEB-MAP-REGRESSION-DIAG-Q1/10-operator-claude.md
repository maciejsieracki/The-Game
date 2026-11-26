STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza; zero zmian gra/src, gra/data, gra/tools)
TEMAT: R-WEB-MAP-REGRESSION-DIAG-Q1
GOAL: ustalić, które naruszenia map-gen-regression-test na kandydacie MAPFIX (f781bbd0a) są NOWE, a które ISTNIEJĄCE na bazie 690947a2a.
ZMIANY/COMMIT: allowlista: dyspozycje/analizy/map-regression-diag/** (run-sections.cjs, summarize.cjs, base-results.tsv, cand-results.tsv, cand-repeat.tsv, trace-nopurge.tsv), dyspozycje/analizy/MAPREGDIAG-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-MAP-REGRESSION-DIAG-Q1/10-operator-claude.md. Commit: patrz SHA w odpowiedzi (tylko te ścieżki, bez git add -A).
TESTY (surowe liczby z wyjścia runnera):
- Baza 690947a2a: A = 40 przypadków, 1 zła trasa (777/wyspy/high, idx 185); B = 40 przypadków, 0 osieroconych heksów, 0 naruszeń dopływów; C = 4/5 pangea poza progiem (bboxFill 0,883 / 0,881 / 0,876 / 0,874); D = 70/70; E = hash 7db77e46 == 7db77e46. Twarde naruszenia: 1 + 4 = 5.
- Kandydat f781bbd0a: A identycznie (1 zła trasa); B = 6 przypadków z osieroconymi heksami: 777/medium/wyspy 6, 7/medium/wyspy 24, 2026/medium/wyspy 1, 123/high/wyspy 4, 777/high/wyspy 10, 7/high/wyspy 18 (razem 63 heksy); C i D i E identycznie jak baza. Twarde naruszenia: 1 + 6 + 4 = 11 (zgodne z raportem FC).
- Powtórzenie 6 przypadków B: liczby identyczne (brak NIEDETERMINISTYCZNYCH).
- Ablacja (kopia kandydata, wyłączone jedno wywołanie purgeOpenOceanLandSpecks w przebiegu 3e-final, generator.ts linia ~743; plik przywrócony przez git checkout): 777/medium/wyspy osierocone 6 → 0. Kopia kandydata usunięta wraz z worktree.
- Klasyfikacja: 6 naruszeń B = NOWE (regresja MAPFIX); 1 naruszenie A i 4 naruszenia C = ISTNIEJĄCE.
- Pełny wniosek i propozycja poprawki: dyspozycje/analizy/MAPREGDIAG-2026-11-26.md.
BLOKADY:
- Kandydat f781bbd0a bazuje na 1bb77a7a0, nie na 690947a2a; różnice poza gra/src/map (building-demolish, main.ts, cityPanel) nie dotyczą generatora; porównanie map jest czyste (3 pliki MAPFIX).
- Nie zweryfikowano, czy wdrożony main 01790e553 (FALA 925) zawiera to samo wywołanie purge; zalecane sprawdzenie przez orkiestratora.
- Poprawka nie zaimplementowana (kod poza allowlistą); nie zmierzono wpływu proponowanej poprawki na efekt MAPFIX „0 samotnych lądów”.
- Mechanizm (heksy rzeki zamienione w morze przez purge) wnioskowany z kodu i ablacji; nie śledzono pojedynczego heksu.
RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana: nie)
NASTĘPNY KROK: orkiestrator decyduje o MAPFIX (wstrzymany do wyniku, #179 w kolejce); rekomendacja: NIE wdrażać f781bbd0a bez poprawki purge (osobny temat Operatora, allowlista gra/src/map/generator.ts lub gen-helpers.ts) i ponownego pomiaru sekcji B i C.
UWAGI-DLA-ORKIESTRATORA: sekcja C (pangea bboxFill) jest błędem istniejącym w bazie, nie regresją; dispatch FC przypisywał wszystkie 11 naruszeń MAPFIX — tylko 6 jest jego winą.
DEPLOY/PUSH: NIE WYKONANO
