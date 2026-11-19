STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza + pomiar; zero zmian logiki gry)
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1
GOAL: niezalezny werdykt Final Control r5 dla kandydata a33174100d291d3328d130765cf43cdc763b8f02 (baza eae4eff5792e54ecacbbee5375603de83d79af07).
ZMIANY/COMMIT: kandydat a33174100; `git merge-base --is-ancestor eae4eff57 a33174100` = OK (ANCESTOR_OK). `git diff --stat` baza..kandydat: 14 plikow, +7804/-70; wszystkie w allowliscie (dyspozycje/analizy/AI-TERRITORY-RACE-DESIGN.md, runs/<ID>/**). Zero plikow w gra/ (`git diff --stat -- gra` puste). `git diff --check` czysty.
TESTY: tsc i 5 bramek referencyjnych NIE uruchamiane — diff nie dotyka gra/src ani gra/tools, wiec wynik byl by identyczny z baza (powod pominiecia). Weryfikacja reczna z surowych plikow i kodu:
- summary: seed4242 aiOffersRejected=7, forcedPeaceAccepted=4; seed7 aiOffersRejected=7, forcedPeaceAccepted=1 (dowody/final-2x150/seed*.summary.json) — zgodne z doc (sekcja 6b, ograniczenie 7).
- seed*-analiza.md: 13 AI z fortem/posterunkiem w t150 w obu ziarnach; 13 cywilizacji AI (pozostale wlasciciele = placeholdery/miasta-panstwa, doc to opisuje); 0 NaN.
- kod: terrain-improvements.ts:608-610 (RESOURCE_UPKEEP_IMPROVEMENT_KEYS = wszystkie klucze typu != 'wycinka'), mnoznik epoki 1/2/4 (l.128-134), fort epoka 3 / posterunek epoka 2 (terrain-improvements.json:276,404), computePracaUpkeepByOwner turn-economy.ts:~991, econ-params.json:299-303 opis zwalnia fort/posterunek — sprzecznosc kod vs opis potwierdzona.
OCENA ZARZUTOW EVALUATORA (bez etykiet rol):
1. Naglowek 1.5 — usuniety/zmieniony: teraz "hipotezy z kodu, przed pomiarem", teza obalona pomiarem 6b (13/13). ROZWIAZANE.
2. Upkeep fortu/posterunku — wniosek wyciagniety z kodu (fort 4, posterunek 2 Praca/tura wg kodu), jawnie "nie zmierzono w grze", sprzecznosc z econ-params zgloszona. ROZWIAZANE.
3. UI/administrator gracza — inwentarz kodu uzupelniony; uklad menu NIE ZWERYFIKOWANO wizualnie (jawnie oznaczone, wymaga przegladarki; poza zakresem analizy). ODDAL jako uwaga, nie FAIL.
4. 6b: aiOffersRejected=7 w obu ziarnach, forcedPeaceAccepted 4/1 — poprawione, ograniczenie 7 dodane. ROZWIAZANE.
BLOKADY: brak. Zadne zarzuty NAPRAW nie pozostaly.
RUNDY: 5/5 (FC r5).
UWAGI (nie blokujace):
- Sekcja 6 (r2/r3, np. l.152 "wniosek NIE potwierdzony") zachowana jako historyczna; naglowek dokumentu l.6 mowi, ze przy rozbieznosci obowiazuje 6b — akceptowalne.
- n=2 ziarna, ziarno 1234 NIE ZMIERZONO; udzial wolnej ziemi i "zajete pierwszy raz" NIE ZMIERZONO; uklad menu UI NIE ZWERYFIKOWANO wizualnie.
- Sprzecznosc econ-params.json (fort/posterunek zwolnione) vs kod (placa upkeep) — decyzja wlasciciela.
UWAGI-DLA-ORKIESTRATORA: (a) zarejestrowac sprzecznosc upkeep econ-params vs kod jako osobny temat/ABC; (b) pytania ABC P1-P5 w sekcji 7 gotowe do przekazania wlascicielowi; (c) przeszukanie sciezek AI bylo grepem, nie analiza dynamiczna.
NASTEPNY KROK: integracja orkiestratora (merge kandydata do main, tylko dokumentacja; bez deployu gry).
DEPLOY/PUSH: NIE WYKONANO
