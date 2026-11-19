STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; zero zmian gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-Q11
GOAL: testy zaktualizowane do decyzji właściciela 2026-11-19 (baza surowców = dane; Mennica wymaga złota; lama tylko Inkowie) + re-baseline rekrutacji.
ZMIANY/COMMIT: gra/tools/{ekonomia-5x-inwariant,grupa-b-lane,hex-plony-magazyn,mennica-magazyn,zloto-test,tarasy-cywilizacje,rekrutacja-koszty-polowa-all}-test.cjs; nowy gra/tools/fixtures/units-nonkoszt-2026-11-19.json (250408 B, 75 rekordów; pola niekosztowe zamrożone z AKTUALNEGO units.json). SHA: w polu sha odpowiedzi.
TESTY (przed -> po, liczby z surowych logów):
- ekonomia-5x-inwariant: 230 pass / 50 fail -> 280 / 0. Reguła ×5 dla JEDNOSTEK zniesiona (pkt 1 ABC); warstwa A dla buildings.json zostaje, dla units.json: całkowita >=1. Piny terenu: Równina Drewno 5, Kamień 2, Rzeka Glina 5, wyrab praca 50; piny jednostek Wojownik 13/3, Hieros 38/8 (stan danych; źródło zmiany NIE ustalone).
- grupa-b-lane: 43 / 6 -> 49 / 0. Oczekiwane wartości czytane z terrain-yields/terrain-improvements. Empire food: suwak usunięty (PYTANIE-85) -> 100% do państwa; rezerwa = spichlerz - koszt armii. Las na Równinie: handel 3 (Podatek 1+2), drewno 20 (5+15). Wyrab: koszt_praca 2.5 (dane), praca_per_tura 50.
- hex-plony-magazyn: 10 / 4 -> 14 / 0. "Rzeka +10 got 7": wyjaśnienie = Łąka glina 2 (baza z danych) + rzeka 5 (modyfikator Rzeka) = 7. Asercje czytają wartości z danych.
- mennica-magazyn: 34 / 7 -> 40 / 1. econ-params: easy 1.62 / normal 1.5 / hard 1.38 (globalne fallbacki; minimum 1.38). Mennica bez Waluty i bez złota: delta 0 (pkt 2). Równina 6 pól: drewno 30, kamień 12 (dane). Garncarnia: CZERWONA (patrz niżej). Asercja odlewni rozbita na "NIE blokuje Cegielni" (zielona).
- zloto-test: 38 / 7 -> 45 / 0. Mennica wymaga złota w empireResourceStock.zloto (nie w activeResourceLabels; DOSTEP-SUROWCE-Q1). Stadnina 25 Koń/t (dane). Test etykiety Złoto: kopalnia przeniesiona z 5,5 (poza zasięgiem miasta) na 0,0 (heks miasta) -- bez tego etykieta active nie powstaje.
- tarasy-cywilizacje: 14 / 3 -> 18 / 0. Lama: isImprovementAllowedForCiv('lama','rzymianie') = false, Inkowie = true. AI: budżet 100% puli bez limitu % (właściciel 2026-10-31), 2 tarasy po 25 Pracy = zachowanie zgodne z budżetem -> asercja ">=1 w budżecie, wszystkie tarasy".
- rekrutacja-koszty-polowa-all: exit 1 -> PASS (214 pól docelowych zmienionych, 150 kontroli pól chronionych). Re-baseline: pola niekosztowe vs zamrożony snapshot (fixture); koszty nadal ceil(baza/2) z 329db81ff. Runtime: koszt i utrzymanie porównywane przez scaleCostByEpoch (mnożnik epoki Brąz x2 / Żelazo+ x4, zatwierdzony) -- bez tego czerwieniał Procarz (50 != 25).
BLOKADY / CZERWONE:
- mennica-magazyn: "Garncarnia: ceramika > 0 przy glina+drewno" (got undefined). Przyczyna: w simulateConverterTick Cegielnia (wcześniej w DEFAULT_CONVERTER_RECIPES) zjada całą glinę 40 w jednym ticku (wynik: cegla 40, glina 0). To ZNALEZISKO GRY (kolejność/przepustowość konwerterów), nie błąd testu -- wymaga decyzji właściciela / tematu gry.
MUTACJE (kopia danych, przywrócone, cmp OK): (1) units.json Wojownik Surowiec 13->14 -> ekonomia-5x FAIL, rekrutacja-koszty FAIL; (2) terrain-improvements lama cywilizacje += rzymianie -> tarasy-cywilizacje FAIL. Razem 3 poprawione testy zaczerwienione.
GATE: tsc --noEmit exit 0 (bez zmian w src); logic-test 213/213; tech-tree 20 pass / 0; research 33 / 0; combat exit 0; unit-replace 21 [OK].
UWAGI-DLA-ORKIESTRATORA:
1. rekrutacja-koszty: BASE_COMMIT 329db81ff czytany przez git show (w tej kopii dostępny lokalnie; wg dispatchu nie w historii main). Przy czystym klonie test może nie działać -- rozważyć zamrożenie kosztów bazowych w fixturze.
2. Garncarnia (wyżej): Cegielnia wygrywa z Garncarnią o glinę przy magazynie 40 -- temat gry/balansu, nie test.
3. Stadnina: asercja zmieniona na 25 (dane, zgodnie z pkt 1). Jeśli właściciel chce 5, to osobna decyzja.
4. Zakaz lasu dla stadnin (R-WEB-IMPROVEMENT-STADNINA-DEPOSIT-ONLY-NO-FOREST-Q1) nie był ruszany.
NASTĘPNY KROK: orkiestrator: integracja po Final Control; decyzja właściciela o kolejności konwerterów (Garncarnia).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
