STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-COST-CERAMICS-ANALYSIS-Q1
GOAL: Wskazać budynki, które (poza obecnymi) powinny kosztować CERAMIKĘ, z ilościami i uzasadnieniem; zasada właściciela: nie wcześniej niż ceramika jest dostępna, ilości 1:1 zastępujące istniejący składnik albo dodane z uzasadnieniem. Tylko analiza, bez zmian kodu i danych.
ZMIANY/COMMIT: tylko dyspozycje/autobot/runs/R-WEB-BUILDING-COST-CERAMICS-ANALYSIS-Q1/ (01-operator-r1.md, 02-tabela-budynkow.csv). SHA: patrz końcówka raportu / `git log` gałęzi worktree (commit zawierający ten plik). Brak zmian w gra/, WERSJE.md, gra-robocza/.
TESTY: nie dotyczy (analiza read-only). Odczytano: gra/data/buildings.json, tech.json, econ-params.json, citizen-resource-upkeep.json, resources.json; gra/src/game/{converters,building-resource-gate,building-stock-cost,ai}.ts. Tabela CSV wygenerowana skryptem z danych (łańcuch tech liczony tranzytywnie z `Wymaga (prereq)`). NIE_ZMIERZONO: żadnej symulacji tur ani realnej podaży/popytu ceramiki w grze — liczby poniżej to rachunek z parametrów.
BLOKADY: brak. Wymagana decyzja właściciela (ABC niżej). Zakładam, że STONE-BRICK-IMPL (kamień→cegła w 10 budynkach Brązu) zostanie wdrożone przed tym tematem (w HEAD tego worktree jeszcze nie jest, kolumna „koszt_po_STONE-BRICK-IMPL” w CSV jest wyliczona z wartości w jego dispatchu).
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator zadaje właścicielowi pytania ABC (pkt 6); po decyzji dispatch implementacji (osobny temat, po STONE-BRICK-IMPL — ten sam plik buildings.json).
DEPLOY/PUSH: NIE WYKONANO

## 1. Stan faktyczny: produkcja i zużycie ceramiki

Produkcja
- Jedyny producent: Garncarnia (`garncarnia`, epoka 1, tech Garncarstwo). Receptura 1 glina + 1 drewno → 1 ceramika (converters.ts, wiersz `garncarnia`). Bramka budowy: Glina w magazynie państwa (building-resource-gate.ts, DEPOSIT_LINKED_BUILDING_LABELS).
- Przepustowość: `budynek_garncarnia_przepustowosc` = 50/turę (easy/normal/hard), +10% bazy addytywnie za każdą epokę właściciela (CONVERTER_ERA_SCALING_PCT): epoka 1 = 50, epoka 2 = 55, epoka 3 = 60 na budynek.
- Garncarnia NIE zużywa ceramiki (U-14) — warunek „Garncarnia nie może kosztować ceramiki” spełniony z definicji i taki ma zostać.
- Ceramika to stock państwa (klucz `ceramika`), pula civ-wide; pojemność jak inne surowce przetworzone (+20% bazy za Magazyn).
- Tech Garncarstwo (epoka Kamienia, bez prereq) odblokowuje: Spichlerz, Garncarnię, Cegielnię; surowce glina, cegła, sól.

Zużycie dziś (żaden budynek nie ma ceramiki w `koszt_surowce`)
1. Spichlerz I i II: drain 25 ceramiki/turę na miasto ze spichlerzem (econ-params: budynek_spichlerz_zuzywa_ceramika / _ii_; jedna wypłata na miasto). Brak ceramiki → brak bonusu ludności. Spichlerz II ma dodatkowo bramkę budowy `['Ceramika','Sól']`.
2. Obywatele: lista surowców zużywanych przez obywateli (citizen-resource-upkeep.json) zawiera ceramikę od epoki 2 (Brąz), stawka 1,0 × m(epoka) na obywatela na turę: Brąz 1,5, Żelazo 2,0; brak pokrycia = −2 Szczęścia i −1% Rozwoju (binarnie per surowiec).
3. Nadwyżka po drainie Spichlerza daje +Zdrowie (zdrowie_ceramika) i binarne +1 Zadowolenia w mieście z Garncarnią.
4. Handel: ceramika ma cenę w dyplomacji (cena_ceramika) — surowiec wymienialny.
5. Karty (R-WEB-CARDS-RESOURCE-PURPOSE-Q1): ceramika opisana jako surowiec Spichlerza/zdrowia.

Wniosek: ceramika jest dziś surowcem „utrzymaniowym” (spichlerz, obywatele), a nie budowlanym. Jakikolwiek koszt budowlany to NOWY popyt konkurujący z drainem, którego niedobór jest karany (−2 Szczęścia, utrata bonusu ludności).

## 2. Skala kosztów (do przeliczeń)
Efektywny koszt surowcowy = JSON × 2 (R_STAWKI_FALA2_MULT) × mnożnik epoki wejścia budynku (1 / 2 / 4 dla epok 1 / 2 / 3+; buildingEraCostMultiplier). Budynki epoki 2: ×4; epoki 3: ×8. Przykład: 30 w JSON w epoce 2 = 120 w grze, ok. 2,2 tury pracy jednej Garncarni (55/t).

## 3. Reguła „nie wcześniej niż ceramika dostępna”
Kryterium: łańcuch prereq techu odblokowującego budynek zawiera Garncarstwo (liczone tranzytywnie z tech.json). Garncarnię można wtedy postawić w tej samej turze, a ceramika pojawia się od następnej tury. Spełniają je (kolumna CSV „lancuch_tech_zawiera_Garncarstwo”): kuznia, odlewnie brązu i żelaza, targowisko, spichlerz(e), swiatynia, biblioteka, akwedukt, mennica, mury, koszary, emporion, magazyn, dwór zarządcy, trybunał, wszystkie budynki epoki 3 i 4 oprócz Portu wielkiego (jego poprzednik Port wymaga tylko Żeglugi).
NIE spełniają (wykluczone z kandydatów): Stolarnia, Warsztat kamieniarski, Port (Żegluga ← Obróbka drewna), Kamienne kręgi, Studnia (Gospodarka wodna ← Rolnictwo), Stela, Palisada, Pałace, Dom starszyzny, Garnizon.
Uwaga: techn. gwarancja ≠ gwarancja budynku Garncarni (gracz może mieć tech bez Garncarni lub bez gliny). Zabezpiecza to sam koszt w stocku (budynek czeka na ceramikę), ale AI trzeba nauczyć budować Garncarnię (pkt 5).

## 4. Tabela budynków
Pełna: `02-tabela-budynkow.csv` (43 budynki: tech, łańcuch Garncarstwa, koszt dziś, koszt po STONE-BRICK-IMPL, mnożnik, ocena motywu A–D/X, uzasadnienie, kandydat, ilości wariantów A i B JSON oraz efektywne). Skrót kandydatów (motyw: A silny, B dobry, C słaby/odrzucony):

| Budynek | Epoka / tech | Motyw | Uzasadnienie | Wg wariantu |
|---|---|---|---|---|
| Magazyn | 2 / Handel | A | amfory i dzbany magazynowe; istota budynku to przechowywanie | A, B |
| Spichlerz Królewski | 2 / Pismo | A | pithoi na zboże; Spichlerz I/II już jedzą ceramikę (drain) i mają bramkę Ceramika | A, B |
| Akwedukt | 2 / Budownictwo | A | rury i kanały z wypalanej gliny (terakota) | A, B |
| Emporion | 2 / Handel | B | amfory handlowe; wymaga Targowiska | B |
| Łaźnia publiczna | 3 / Medycyna | B | rury, kafle; wymaga Studni | B |
| Świątynia, Targowisko, Odlewnia brązu, Port wielki | – | C | motyw słaby lub ryzyko startowe (Targowisko to epoka Kamienia, dziś samo drewno) | żaden |
| Kuźnia, Teatr, Sad | – | D | brak sensownego motywu | żaden |
| Garncarnia, Cegielnia | – | X | pętla zależności / konkurencja o glinę | zabronione |
Spichlerz I (epoka 1) pominięty: ma już drain i bramkę „po Garncarni” bez kosztu; dodanie kosztu zablokowałoby start epoki 1 (patrz ryzyko pkt 5).

## 5. Wpływ, ryzyka, konflikty
Ekonomia (rachunek z parametrów, NIE_ZMIERZONO w grze):
- Jedna Garncarnia = 55/t w epoce 2. Samo zapotrzebowanie obywateli w Brązie to 1,5 × populacja imperium na turę (np. populacja 40 = 60/t, więcej niż produkuje jedna Garncarnia), do tego 25/t na każde miasto ze Spichlerzem. Ceramika jest już dziś potencjalnie wąskim gardłem — dlatego rekomenduję małe ilości i zastępowanie cegły (składnika, który po STONE-BRICK-IMPL jest drogi, a cegła ma ×2 produkcji i +50%/epokę), nie dokładanie.
- Wydanie ceramiki na budowę zmniejsza stock przed drainem Spichlerza/obywateli: ryzyko jednorazowego deficytu (−2 Szczęścia na turę wg binarnej kary) tuż po kosztownej budowie. Łagodzi to małe zapotrzebowanie i brak ceramiki w budynkach epoki 1.
- Glina: Garncarnia i Cegielnia jedzą tę samą glinę (obie 1 glina na jednostkę ceramiki; cegła ma recepturę 2 glina + 1 drewno → 2 cegły). Zastąpienie połowy cegły ceramiką 1:1 zwiększa zużycie drewna (ceramika 1 drewno/szt. vs cegła 0,5 drewna/szt.) i nie zmienia gliny na sztukę.
AI:
- Budynki są wybierane po `koszt_surowce` w buildingStockCost, ale `CONVERTER_FOR_RESOURCE` w ai.ts (ok. wiersza 2330) NIE zawiera pary `['ceramika','garncarnia']` (jest cegla, braz, zelazo, stal). Bez niej AI bez Garncarni będzie ustawiać w kolejce Magazyn/Akwedukt/Spichlerz II, na które nie stać go z braku ceramiki — ryzyko zastoju kolejki. `UPSTREAM`/deficyt już mapuje `ceramika: ['garncarnia']` (ai.ts ok. 2722). Wymagana zmiana implementacyjna: dopisać parę do CONVERTER_FOR_RESOURCE + test; sprawdzić ai-resource-needs.ts i building-resource-gate.ts (bramka `['Ceramika']` jak przy spichlerz_ii dla pozostałych) — poza zakresem tej analizy.
- Pętle zależności: tylko Garncarnia produkuje ceramikę; wśród kandydatów nie ma Garncarni ani budynku, od którego zależy jej budowa (wymaga tylko gliny). Brak pętli.
STONE-BRICK-IMPL:
- Ten sam plik `gra/data/buildings.json` i te same budynki (magazyn, spichlerz_ii, akwedukt, emporion zmieniają kamień→cegłę). Kolejność: najpierw STONE-BRICK-IMPL, potem CERAMICS (wartości cegły w wariantach są liczone od stanu po IMPL, np. magazyn cegła 30, akwedukt 60, spichlerz_ii 50, emporion 60). Łaźnia nie jest w IMPL (cegła 60 dziś).
Rust (dług): REPIN `building_costs.rs` + parytet kosztów w testach.

## 6. Propozycje i pytania ABC (do właściciela, po polsku)
Zasada wspólna wariantów: ceramika zastępuje 1:1 POŁOWĘ składnika cegły (reszta cegły i drewno bez zmian), żadnych nowych składników; Garncarnia i Cegielnia bez zmian. Wartości w JSON (cegła/ceramika), w nawiasie koszt efektywny ceramiki w grze (JSON × 2 × epoka):

Pytanie 1: Ile budynków ma kosztować ceramikę?
- A (REKOMENDACJA): 3 budynki — Magazyn 15/15 (60), Akwedukt 30/30 (120), Spichlerz Królewski 25/25 (100).
  Zalety: najmocniejszy motyw (przechowywanie, woda, zboże); mały popyt (łącznie ~280 efektywnych na pełny zestaw); mała szansa kolizji z drainem; jeden zespół budynków epoki 2.
  Wady: ceramika dalej mało „budowlana”; Spichlerz Królewski już zużywa ceramikę, więc dociska ten sam surowiec podwójnie.
- B: wariant A + Emporion 30/30 (120) + Łaźnię publiczną 30/30 (240, epoka 3).
  Zalety: więcej zastosowań, motyw dla handlu i higieny; ceramika bardziej „widoczna” w grze.
  Wady: wyższy popyt (łącznie ok. 640 efektywnych), w epoce 3 łaźnia ×8; większe ryzyko deficytu obywateli i drainu; więcej budynków do testów i kart.
- C: bez zmian (ceramika zostaje surowcem utrzymaniowym).
  Zalety: zero ryzyka, zero zmian AI i Rust. Wady: ceramika nigdy nie zasila budowy, rozdźwięk z tematyką.
- D: pełne zastąpienie CAŁEJ cegły ceramiką w tych samych budynkach (nie rekomendowane).
  Zalety: prosta reguła. Wady: ~2× popyt wariantu A, mocny nacisk na stock ceramiki.

Pytanie 2 (jeśli A lub B): zabezpieczenie AI i deficytu.
- A (REKOMENDACJA): dopisać `['ceramika','garncarnia']` do CONVERTER_FOR_RESOURCE w ai.ts oraz bramkę etykiety „Ceramika” w building-resource-gate dla trzech budynków (spichlerz_ii już ma). Zalety: zero zastoju AI; spójne z cegłą/brązem. Wady: dotyka ai.ts (osobne ryzyko, wymaga testów).
- B: tylko dane, bez zmian AI. Zalety: najmniejszy diff. Wady: ryzyko zastoju AI w cywilizacjach bez gliny.

Pytanie 3 (jeśli A lub B): proporcja ceramika:cegła.
- A (REKOMENDACJA): połowa cegły → ceramika (jak w wariantach powyżej). Zalety: umiarkowany popyt. Wady: rozbija dopiero co ujednolicony koszt cegły.
- B: ceramika w stosunku 1/3 (np. magazyn 20/10, akwedukt 40/20, spichlerz_ii 35/15). Zalety: jeszcze mniejszy popyt. Wady: symboliczne ilości.
- C: ceramika dokładana ponad cegłę (nowy składnik, bez zmniejszania cegły). Zalety: nie ruszamy cegły. Wady: koszt budynku rośnie, łamie zasadę 1:1.

Założenia przyjęte przy lukach: (1) stan docelowy cegły to wartości z dispatchu STONE-BRICK-IMPL; (2) kryterium „dostępna” = łańcuch tech zawiera Garncarstwo; (3) liczby podaży/popytu nie mierzono w grze.
