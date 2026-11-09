STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-COSTS-ERA-RESOURCES-IMPL-Q1
GOAL: Koszty budowy Kamień/Brąz/Żelazo wg decyzji 2026-11-09, Garncarstwo na poziom 1, diagnoza utrzymania surowcowego.

SHA DO INTEGRACJI: 729e28ed6 (kod Operatora r2; potomek 59367a77f i bazy 8718bbd26, merge-base --is-ancestor OK)

ZMIANY/COMMIT: 14 plików: gra/data/{buildings,tech}.json, gra/src/data/wikiBundle.json (wygenerowany, 1 linia), docs/encyklopedia/technologie/garncarstwo.md, SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md (aneks), 8 testów gra/tools/*, runs/<ID>/01-operator-r1.md. Brak zmian gra/src/**.ts, WERSJE.md, gra-robocza; brak push/deploy. `git diff --check` czysto.

WERDYKTY PER ZARZUT:
1. Wiki/Civpedia Garncarstwo poziom 2: ODDAL (naprawione w r2, bundle przebudowany; civpedia-technologie-rys-historyczny 324/0).
2. Kamień przed Murarstwem (targowisko, studnia, kamienne_kregi): DO DECYZJI CZŁOWIEKA (prereq Murarstwo albo akceptacja luki). Test blok 7 pilnuje listy wyjątków (58/0).
3. AI/deadlock bez gliny/kamieniołomu: ODDAL jako NIE_ZMIERZONO. Zdanie "AI nie utknie na twardo" z 01-operator-r1.md jest niezweryfikowane.
4. Niepełna lista czerwonych testów: ODDAL. Odtworzone przeze mnie na bazie 8718bbd26 i na HEAD: budynki-koszt-pracy-50 138/40 (identycznie), ekonomia-5x-inwariant 50 FAIL na obu (HEAD 229 pass, baza 199 pass: różnica to nowe asercje). Czerwone bazowe wg Evaluatora/Obrony: resource-usage-breakdown 98/2, surow-civ-storage 64/4, trade-ilosc 35/5, zloto-test, administracja-stolica, budynek-garnizon (brak playwright, NIE_ZMIERZONO).
5. Założenia właściciela (Kuźnia/Odlewnia brązu, Port handlowy, Koszary, Pałac II, Cegielnia bez cegły; Emporion 60/60/60; cegła = dzisiejszy kamień; obniżka drewna w 4 budynkach): DO DECYZJI CZŁOWIEKA (ABC).
6. Utrzymanie surowcowe: mechanizm istnieje (buildingResourceUpkeep, stałe 5/typ); wzrost do max +150/turę: DO DECYZJI CZŁOWIEKA; wpływ NIE_ZMIERZONO. Brak zmiany kodu jest poprawny.
7. Przesunięte numery linii w polach "dowod" kart; dług REPIN Rust: ODDAL (osobny temat; REPIN: koszt_surowce 32 budynków + Poziom Garncarstwa).
Zero otwartych NAPRAW -> PASS-WITH-NOTES.

TESTY (własne, na 729e28ed6, po npm ci --ignore-scripts): building-cost-resource-availability 58/0, koszty-surowcowe 160/0, unit-epoch-cost 57/0, emporion-building 47/0, emporion-build-list-real-render 13/0, granary2-tech-data-guard 14/0, tech-tree 19/0, research ALL GREEN, upkeep 73/0, civpedia-technologie-rys-historyczny 324/0. Nie powtarzałem (przyjęte z Evaluatora r1 na 59367a77f; r2 dotknął tylko wiki i test dostępności): tech-cards-top5, building-cards-top5, deposit-building-gate, prereq-budynkow, tsc. Brak osłabionych testów (aktualizacja oczekiwanych kosztów + nowa bramka). NIE_ZMIERZONO: balans ekonomii i AI na żywo.

BLOKADY: brak twardych. Przed deployem ABC do właściciela: (a) Murarstwo jako prereq dla 3 budynków albo akceptacja luki, (b) założenia kosztów z pkt 5, (c) wzrost utrzymania z pkt 6.

KOLEJNOŚĆ WZGLĘDEM origin/rust-port/parity-v2 (43f4064b0): integrować NAJPIERW do main (web). parity-v2 ma rozbieżne drzewo danych (buildings.json/tech.json zmienione niezależnie), więc nie merge'ować tam; wymaga osobnego REPIN po wdrożeniu weba (koszt_surowce 32 budynków, Garncarstwo poziom 1).

RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora 729e28ed6 do main (po ABC a/b/c), build poza repo, deploy ROBOCZA, potem BUILDING-UPKEEP-RESOURCES-IMPL i REPIN Rust.
DEPLOY/PUSH: NIE WYKONANO
