STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-RESOURCE-CARD-REMOVE-PLUS-X-BADGE-Q1
GOAL: usunąć plakietkę „+X" z kart surowców; wiersz „Brutto · netto" bez zmian.
ZMIANY/COMMIT: kandydat f99397d6f (potomek origin/main b97287c88; merge-base = b97287c88). Kod: gra/src/ui/empireDetailPanel.ts (usunięte resRateHtml + CSS civ-emp-res-rate*, wywołanie w resCardHtml), docs/PORADNIK-GRACZA/08-ekonomia-imperium.md i gra/src/data/wikiBundle.json (1 wiersz, ten sam tekst), test gra/tools/resource-cards-plusx-badge-test.cjs, raporty runs/. git diff --check czysto.
TESTY (surowe wyjście, kandydat f99397d6f): tsc --noEmit exit 0; resource-cards-plusx-badge-test 31 pass/0 fail (w tym mutanty M1/M2 wykrywane, sekcja E = DOM Chromium); resource-cards-gross-net-test 22/0; logic-test 213/213; tech-tree 20/20; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0; surowce-katalog-kolejnosc 62/0. Brak czerwonych, więc porównanie z bazą niepotrzebne.
ZARZUTY: 1 ODDAL (test E renderuje resCardHtml w prawdziwym DOM Chromium; zrzut z żywej gry/Vite niewykonany, bo dispatch zabrania build/dev w gra/ — NIE_ZMIERZONO). 2 ODDAL (docs/wikiBundle wynikają z kryterium „wikiBundle/docs jeśli wspominają plakietkę"; zmiana minimalna). 3 ODDAL (rozbicie w tooltipie zostaje). 4 ODDAL (znacznik „—" był częścią usuniętej plakietki; ewentualnie osobne ABC). 5 ODDAL (ryzyko niskie; E używa prefiksu klasy, mutanty wykrywane). Żadnego NAPRAW.
BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA: (a) wskazana w zadaniu baza e67d6c288 to commit gałęzi dispatchów, NIE main; faktyczna baza kodu = origin/main b97287c88, kandydat jest jej potomkiem. (b) Allowlista nie wymienia docs/PORADNIK-GRACZA/08 ani wikiBundle.json — uznane za uzasadnione. (c) Brak zrzutu Chromium z żywej gry (kryterium c) — dokumentuje test E; decyzja o dodatkowym zrzucie po stronie orkiestratora. (d) Karta bez produkcji/zużycia traci „—" — udokumentowane.
RUNDY: FC r1 (łącznie 2/5).
NASTĘPNY KROK: integracja orkiestratora f99397d6f (+ ten raport), potem deploy po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
