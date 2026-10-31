STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-OUTPOST-FORT-TERRITORY-Q1
GOAL: FC R3 — Q-A zdobycie fortu wejsciem wojska, Q-B wczesniejszy fort wygrywa, Q-C bez zmian, Q-D brak starych 10/5 w opisach gracza.
ZMIANY/COMMIT: oceniany 05c18483a (na c7613ba36, 19e569ff8, baza 18bbf0cf6). FC dodaje tylko ten raport (06-..., bo 03-final-control.md to raport R2).
TESTY (FC, wlasnorecznie na 05c18483a, tymczasowy npm ci, usuniety): tsc 0; fort-outpost-hard-territory 80/0; fort-nodes-save-load 18/0; fort-strazniaca 85/0; territory-border 9/0; dense 15/0; improvement-territory-gate 6/0; diplomacy 148/0; war-era-counter 82/0; defeat-last-city 14/0; city-clears-forest 18/0; auto-improvements 46/0; ai-improvements 53/0; autoimprove-stages-q1 184/0; ring 15/0; ai-founding-territory 29/0. Chromium 33/0 i mut5 31/2 — tylko z logow gate-r3d-* (nie uruchamiane przez FC).
ROZSTRZYGNIECIE ZARZUTOW: 1 stare liczby w docs — ODDAL (git grep po docs/gra/data/gra/src: pozostale trafienia to miasto 10, fort +5, zwiadowca, generator map, dokumenty planistyczne/historyczne CURSOR-*, decyzje/B-zasieg). 2 wikiBundle — ODDAL (brak 10 heksow/o ok. **10**; Posterunek 3, Fort 5). 3 falszywe twierdzenie Q-D — ODDAL (grep poszerzony). 4 brak testu ruchu — ODDAL (moveStep -> startAnimatedMove, Chromium 33/0, mut5 wywala 2 asercje; sweep po fazie AI dodany bezwarunkowo w main.ts). 5 zrzuty fog — ODDAL jako uwaga. 6 wiek zdobytego fortu — Q-F do orkiestratora. 7 allowlista docs/wikiBundle — ODDAL (Q-D).
Allowlista: diff vs 18bbf0cf6 = gra/src (main.ts, fort-territory.ts, territory.ts, wikiBundle.json), gra/tools (2 testy), docs (4 pliki), run. Brak auto-improvements.ts, WERSJE.md, rust-port, src-tauri, gra-robocza, terrain-improvements.json. git diff --check czysty.
BLOKADY: brak
NIE_ZMIERZONO: ai-test, civ-matrix; zdobycie przez prawdziwy ruch AI-cywilizacji w Chromium (tylko straznik tekstowy + sweep po fazie AI); wizualna zmiana koloru granicy (fog; dowod liczbowy ownerAt); rerun Chromium przez FC.
UWAGI: Q-E i Q-F (wiek zdobytego fortu, rekomendacja A) do pytania ABC przez orkiestratora. Drobne: porownanie order w territoryOwnerAt przy mieszanych wezlach z/bez order nie jest przechodnie (po backfillu stare zapisy maja order wszedzie — ryzyko znikome).
RUNDY: 3/5 (FC R3)
NASTEPNY KROK: integracja orkiestratora na origin/main z SHA 05c18483a (+ commit tego raportu). Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (parity-v2 dotyka rust-port, src-tauri, dyspozycje, .github; zero wspolnych plikow z gra/ i docs/) — dowolna kolejnosc, zalecane najpierw main.
DEPLOY/PUSH: NIE WYKONANO
