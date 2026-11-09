STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-COST-CERAMICS-ANALYSIS-Q1
GOAL: Wskazać budynki, które (poza obecnymi) powinny kosztować CERAMIKĘ, z ilościami i uzasadnieniem; zasada właściciela: nie wcześniej niż ceramika jest dostępna, ilości 1:1 zastępujące istniejący składnik albo dodane z uzasadnieniem. Tylko analiza, bez zmian kodu i danych.
ZMIANY/COMMIT: tylko dyspozycje/autobot/runs/R-WEB-BUILDING-COST-CERAMICS-ANALYSIS-Q1/. Runda 1: SHA 9a870595d (01-operator-r1.md, 02-tabela-budynkow.csv — r1 zostaje bez zmian jako historia). Runda 2 (ta poprawka): 01-operator-r2.md i przepisane 02-tabela-budynkow.csv; SHA rundy 2 = commit na gałęzi worktree-wf_f3f27499-8ce-3 (podany w odpowiedzi orkiestratorowi; commit nie może zawierać własnego SHA). Brak zmian w gra/, WERSJE.md, gra-robocza/.
TESTY: nie dotyczy (analiza read-only). Sprawdzenia tej rundy: (a) `node` odczyt gra/data/buildings.json z HEAD 1be32fb0a i z 59367a77f — koszty budynków 43/43 odczytane; (b) zgodność HEAD vs ERA-RESOURCES: 42/43 identyczne, jedna różnica: targowisko HEAD 30/0/0, ERA 30/30/0 (kamień dodany); (c) ancestry: 59367a77f jest przodkiem HEAD 1be32fb0a i origin/main; (d) przepustowość Garncarni odczytana z gra/data/econ-params.json (budynek_garncarnia_przepustowosc 50/t, easy/normal/hard). NIE_ZMIERZONO: symulacja tur, realna podaż/popyt ceramiki i kamienia w grze; liczby poniżej to rachunek z parametrów.
BLOKADY: brak. Wymagana decyzja właściciela (pytania ABC, pkt 6).
RUNDY: 2/5 (ostatni werdykt: PASS-WITH-NOTES, zarzuty 5; r2 przyjmuje wszystkie 5, z jednym częściowym zastrzeżeniem w pkt 3 odpowiedzi)
NASTĘPNY KROK: orkiestrator zadaje właścicielowi pytania ABC (pkt 6). Po decyzji — osobny dispatch implementacji. Baza implementacji: HEAD 1be32fb0a (schemat ERA-RESOURCES), NIE STONE-BRICK-IMPL (zastąpiony).
DEPLOY/PUSH: NIE WYKONANO

## 0. Odpowiedzi na zarzuty Evaluatora (runda 1 → 2)

Zarzut 1 — fałszywa przesłanka kolejności (STONE-BRICK-IMPL przed tematem): PRZYJMUJĘ.
Dowód: `git merge-base --is-ancestor 59367a77f HEAD` oraz `... origin/main` — oba TAK. Commit 62e33cf22 („dispatch: BUILDING-COSTS-ERA-RESOURCES-IMPL, zastępuje STONE-BRICK-IMPL i GARNCARSTWO-L1”) potwierdza zastąpienie. Schemat kosztów z 59367a77f (zasada 2026-11-09: Brąz i Żelazo jednolite trójki drewno=kamień=cegła) jest w HEAD dla wszystkich budynków kandydatów. Usunięto zależność „najpierw IMPL, potem CERAMICS”, usunięto też sformułowanie o konflikcie plikowym, który w praktyce jest już rozstrzygnięty przez ERA-RESOURCES.

Zarzut 2 — kolumna „koszt_po_STONE-BRICK-IMPL” zmyślona: PRZYJMUJĘ.
Kolumna usunięta. Nowa tabela porównuje dwa realne źródła: `koszt_HEAD_1be32fb0a` i `koszt_ERA-RESOURCES_59367a77f` (kolumna `zgodnosc_HEAD_z_ERA`). Wartości magazyn 30/30/30, akwedukt 60/60/60, spichlerz_ii 50/50/50, emporion 60/60/60, łaźnia 60/60/60 — zweryfikowane odczytem plików JSON. Jedyna rozbieżność (targowisko, kamień 0 vs 30) nie dotyczy kandydatów.

Zarzut 3 — warianty liczone z cegły 30/60/50/60 i łamanie jednolitości trójek: PRZYJMUJĘ.
Wartości cegły w wariantach zgadzają się z HEAD i ERA (nie są przypadkowe), ale zastąpienie POŁOWY cegły ceramiką łamie zasadę jednolitej trójki. Przebudowano warianty na zastępowanie CAŁEGO składnika 1:1:
- wariant A: kamień → ceramika (trójka drewno = ceramika = cegła zachowana),
- wariant B: cegła → ceramika (trójka drewno = kamień = ceramika zachowana).
Wariant „połowa składnika” odrzucony i opisany w pytaniu 3 jako nierekomendowany.
Częściowe zastrzeżenie: ERA-RESOURCES zostawia kamień w budynkach Brązu (np. magazyn 30/30/30 ma kamień). Wariant A więc świadomie usuwa kamień z trzech budynków — to decyzja właściciela, nie założenie analizy.

Zarzut 4 — asymetria przepustowości (Cegielnia vs Garncarnia): PRZYJMUJĘ.
Dane: Garncarnia 50 szt/turę na budynek (econ-params, zweryfikowane). Cegielnia wg receptury z r1 daje 2 cegły na cykl, 50 cykli/turę = 100 cegieł/turę (stawka bazowa). Ceramika zastępująca cegłę 1:1 podwaja więc liczbę tur produkcji potrzebnych do zaspokojenia tego samego popytu. Wpływ mnożnika epoki (+10% lub +50% za epokę, zależnie od budynku) NIE_ZWERYFIKOWANO w tej rundzie — nie odczytano converters.ts w pełni. Zarzut wpływa na ocenę wariantu C (cegła → ceramika) i na rekomendację poniżej.
Dla wariantu A (kamień → ceramika) asymetria produkcyjna nie występuje wprost, bo kamień nie jest zastępowany cegłą; podaż kamienia nie jest w tej analizie zmierzona (NIE_ZMIERZONO).

Zarzut 5 — brak SHA rundy 1 w ZMIANY/COMMIT: PRZYJMUJĘ.
SHA rundy 1: 9a870595d (wpisany w tym pliku). SHA rundy 2 podaje orkiestrator z `git log` gałęzi.

## 1. Stan faktyczny: produkcja i zużycie ceramiki (bez zmian względem r1, potwierdzone)

Produkcja
- Jedyny producent: Garncarnia (`garncarnia`, epoka 1, tech Garncarstwo). Receptura 1 glina + 1 drewno → 1 ceramika (converters.ts). Bramka budowy: glina w magazynie państwa.
- Przepustowość: `budynek_garncarnia_przepustowosc` = 50/turę (easy/normal/hard).
- Garncarnia NIE zużywa ceramiki — brak pętli.
- Garncarstwo (epoka Kamienia, bez prereq) odblokowuje Spichlerz, Garncarnię, Cegielnię.

Zużycie dziś (żaden budynek nie ma ceramiki w `koszt_surowce`)
1. Spichlerz I i II: drain 25 ceramiki/turę na miasto ze spichlerzem (econ-params: budynek_spichlerz_zuzywa_ceramika / budynek_spichlerz_ii_zuzywa_ceramika). Brak ceramiki → brak bonusu ludności. Spichlerz II ma bramkę budowy ['Ceramika','Sól'].
2. Obywatele: citizen-resource-upkeep.json — ceramika od epoki 2 (Brąz), 1,0 × m(epoka) na obywatela na turę: Brąz 1,5, Żelazo 2,0. Brak pokrycia = −2 Szczęścia i −1% Rozwoju (binarnie per surowiec).
3. Handel: cena_ceramika w dyplomacji.

Wniosek: ceramika jest dziś surowcem utrzymaniowym, nie budowlanym. Każdy koszt budowlany to NOWY popyt konkurujący z drainem i z utrzymaniem obywateli.

## 2. Skala kosztów
Efektywny koszt surowcowy = JSON × 2 × mnożnik epoki wejścia (1 / 2 / 4 dla epok 1 / 2 / 3+, kolumna `mnoznik_efektywny` w CSV: 2 / 4 / 8). Przykład: 30 w JSON w epoce 2 = 120 w grze.

## 3. Reguła „nie wcześniej niż ceramika dostępna”
Kryterium: łańcuch prereq techu odblokowującego budynek zawiera Garncarstwo (liczone tranzytywnie z tech.json; kolumna `lancuch_tech_zawiera_Garncarstwo`). Nie spełniają: Stolarnia, Warsztat kamieniarski, Port, Kamienne kręgi, Studnia, Stela, Palisada, Pałace, Dom starszyzny, Garnizon.
Uwaga: gwarancja techu ≠ gwarancja Garncarni (gracz może mieć tech bez Garncarni lub bez gliny). Koszt w stocku blokuje budowę do czasu ceramiki; AI trzeba nauczyć budować Garncarnię (pkt 5).

## 4. Kandydaci i tabela
Pełna tabela: `02-tabela-budynkow.csv` (43 budynki; kolumny HEAD/ERA, zgodność, mnożnik, ocena motywu, warianty A i B z efektywnym kosztem).

| Budynek | Epoka / tech | Motyw | Wariant A (kamień→ceramika), JSON / efektywnie | Wariant B (cegła→ceramika), JSON / efektywnie |
|---|---|---|---|---|
| Magazyn | 2 / Handel | A | 30/0/30 + ceramika 30 / 120 | 30/30/0 + ceramika 30 / 120 |
| Akwedukt | 2 / Budownictwo | A | 60/0/60 + ceramika 60 / 240 | 60/60/0 + ceramika 60 / 240 |
| Spichlerz Królewski | 2 / Pismo | A | 50/0/50 + ceramika 50 / 200 | 50/50/0 + ceramika 50 / 200 |
| Emporion | 2 / Handel | B | 60/0/60 + ceramika 60 / 240 | 60/60/0 + ceramika 60 / 240 |
| Łaźnia publiczna | 3 / Medycyna | B | 60/0/60 + ceramika 60 / 480 | 60/60/0 + ceramika 60 / 480 |

Motyw słaby lub brak (C/D/X, odrzucone): Świątynia, Targowisko, Odlewnia brązu, Port wielki, Kuźnia, Teatr, Sąd, Garncarnia, Cegielnia (konkurują o glinę, nie mogą kosztować ceramiki bez pętli).
Spichlerz I (epoka 1) pominięty: ma już drain i nie może mieć kosztu ceramiki bez blokady startu epoki 1.

## 5. Wpływ, ryzyka, konflikty
Ekonomia (rachunek z parametrów, NIE_ZMIERZONO w grze):
- Wariant A (3 budynki): łącznie 560 efektywnej ceramiki = ok. 11 tur pracy jednej Garncarni (50/t, bez mnożnika epoki). Wariant B (+ Emporion + Łaźnia): łącznie 1280 = ok. 25 tur.
- Samo zapotrzebowanie obywateli w Brązie to 1,5 × populacja na turę. Ceramika jest już potencjalnie wąskim gardłem; dlatego rekomendacja to zastąpienie składnika, a nie dokładanie.
- Wydanie ceramiki na budowę zmniejsza stock przed drainem Spichlerza i obywateli: ryzyko jednorazowego deficytu (−2 Szczęścia) tuż po budowie.
- Glina: ceramika i cegła zużywają 1 glinę na sztukę (wg receptur z r1). Ceramika zużywa 1 drewno na sztukę, cegła 0,5 (wg r1). Wariant B (cegła → ceramika) podwaja więc zapotrzebowanie na drewno na sztukę i — wg zarzutu 4 — połowę przepustowości produkcyjnej (Garncarnia 50/t wobec Cegielni 100/t, stawki bazowe).
AI:
- `CONVERTER_FOR_RESOURCE` w ai.ts (ok. wiersza 2330) NIE zawiera pary `['ceramika','garncarnia']`. Bez niej AI bez Garncarni może utknąć w kolejce budynków, na które go nie stać. Mapa deficytów `ceramika: ['garncarnia']` (ok. wiersza 2722) już istnieje — zweryfikowane w r1 i potwierdzone przez Evaluatora.
- Pętle zależności: tylko Garncarnia produkuje ceramikę; wśród kandydatów nie ma Garncarni. Brak pętli.
Konflikt z ERA-RESOURCES: wszystkie kandydaty mają już schemat z 59367a77f, więc implementacja nie koliduje z kamieniem→cegłą (temat zastąpiony).
Rust (dług): REPIN `building_costs.rs` + parytet kosztów w testach — przy implementacji.

## 6. Pytania ABC do właściciela (po polsku)

Pytanie 1: który składnik i które budynki ma zastąpić ceramika?
- A (REKOMENDACJA z zastrzeżeniem): kamień → ceramika 1:1 w Magazynie (30), Akwedukcie (60), Spichlerzu Królewskim (50). Trójka drewno = ceramika = cegła zachowana, nie dokładamy składnika. Łącznie 560 efektywnej ceramiki.
  Zalety: zgodne z jednolitością trójek; najmocniejszy motyw (przechowywanie, woda, zboże); bez nowego składnika; cegła (drogi składnik) zostaje.
  Wady: kamień znika z trzech budynków (zmiana popytu na kamień — brak danych o podaży, NIE_ZMIERZONO); Spichlerz II już drenuje ceramikę, więc dociska ten sam surowiec.
- B: wariant A + Emporion (60 → 240) + Łaźnia publiczna (60 → 480, epoka 3). Łącznie 1280.
  Zalety: więcej zastosowań. Wady: duży popyt; łaźnia w epoce 3 ×8; większe ryzyko deficytu obywateli i drainu.
- C: cegła → ceramika 1:1 w tych samych trzech budynkach (drewno = kamień = ceramika). Łącznie 560.
  Zalety: kamień bez zmian. Wady: podwaja zapotrzebowanie na drewno na sztukę i — wg zarzutu 4 — zmniejsza o połowę przepustowość produkcji względem cegły; mniej rekomendowane niż A.
- D: ceramika DOKŁADANA ponad schemat (czwarty składnik, bez zastępowania). Zalety: nie rusza jednolitych trójek. Wady: łamie zasadę 1:1 i zwiększa koszt budynku o pełny składnik.
- E: bez zmian (ceramika zostaje surowcem utrzymaniowym).

Pytanie 2 (jeśli A, B lub C): zabezpieczenie AI.
- A (REKOMENDACJA): dopisać `['ceramika','garncarnia']` do CONVERTER_FOR_RESOURCE w ai.ts oraz bramkę etykiety „Ceramika” w building-resource-gate dla budynków z wariantu. Zalety: brak zastoju AI; spójne z cegłą i brązem. Wady: dotyka ai.ts — osobne ryzyko, wymaga testów.
- B: tylko dane, bez zmian AI. Zalety: najmniejszy diff. Wady: ryzyko zastoju AI bez Garncarni.

Pytanie 3 (jeśli A, B lub C): ilość ceramiki.
- A (REKOMENDACJA): pełny zastępowany składnik 1:1 (jak w pytaniu 1).
- B: połowa zastępowanego składnika. Zalety: mniejszy popyt. Wady: łamie jednolitość trójek — nierekomendowane.
- C: ceramika dokładana ponad schemat (= wariant D z pytania 1) — jeśli właściciel woli nie ruszać składników.

Założenia przyjęte przy lukach:
(1) baza = HEAD 1be32fb0a, schemat zgodny z ERA-RESOURCES 59367a77f (dla kandydatów identyczny);
(2) kryterium „dostępna” = łańcuch tech zawiera Garncarstwo;
(3) mnożnik epoki przepustowości Cegielni NIE_ZWERYFIKOWANO — przyjęto stawkę bazową 100/t wg receptury z r1;
(4) liczby podaży/popytu nie mierzono w grze (NIE_ZMIERZONO).
