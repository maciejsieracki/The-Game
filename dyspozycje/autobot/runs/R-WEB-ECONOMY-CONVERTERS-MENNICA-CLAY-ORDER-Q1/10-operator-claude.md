STATUS: PASS-WITH-NOTES (kryterium pomiaru produkcji Cegły i Ceramiki NIE SPEŁNIONE, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1
GOAL: Runda 2: (1) Mennica ze złotem daje przyrost (podział Handlu metodą największych reszt); (2) HUD netto gliny = silnik przy konkurencji Cegielnia/Garncarnia; (3) pomiar dymny 45 tur seed 4242.
ZMIANY-COMMIT: baza c2342a78e. Pliki: gra/src/game/cities.ts (+splitHandelLargestRemainder), gra/src/game/economy.ts (podział Handlu przez LRM, usunięte nieużywane pct), gra/src/game/converters.ts (+converterAllocatedConsumedRatesForCities: pula ownera miasto po mieście jak silnik; allocated...ForBuildings deleguje), gra/src/main.ts (empireConverterInputRatesForOwner -> converterAllocatedConsumedRatesForCities), testy: gra/tools/mennica-magazyn-test.cjs (etykieta), gra/tools/converters-shared-input-test.cjs (+sekcja F), gra/tools/resource-gross-net-converter-inputs-test.cjs (asercje źródłowe pod nowe wywołanie). SHA: pole sha odpowiedzi.
TESTY (surowe wyniki):
- tsc --noEmit: exit 0
- logic-test LOGIC OK 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; ai-unit-replace 45/0; combat: All sanity checks passed
- ekonomia-5x 280/0; grupa-b-lane 49/0; hex-plony 14/0; zloto 45/0; tarasy 18/0 (zero zmienionych pinów)
- mennica-magazyn 45/0 (przed: 44/1; ze złotem delta 0 -> 1; bez złota 0; Mennica+Waluta 4 > 2)
- converters-shared-input 24/0 (glina 40: HUD 39 = silnik 39; bez konkurencji HUD = nominał 130; wiele miast HUD = pętla silnika 40)
- resource-gross-net-converter-inputs 18/0
- Pomiar: bieg dymny 45 tur, seed 4242, bundle poza repo, Chromium: endTurn 45, NaN 0, Infinity 0. Glina brutto 14->28, zużycie 1->4 (bez konwerterów), HUD netto 13->24.
BLOKADY:
- Produkcja Cegły i Ceramiki w pomiarze = 0 przez całe 45 tur: gracz (owner 0) nie ma Cegielni ani Garncarni w tym ziarnie; runner nie buduje budynków. Kryterium "produkcja > 0" NIE ZMIERZONO.
- HUD miasta nie uwzględnia kolejności między miastami ownera poza listą miast (silnik też jedzie miasto po mieście); HUD używa sumy City.surowce jako puli startowej, a nie stanu po dopływach tury.
- HUD nie modeluje capacityOf (pojemność magazynu wyjścia = Infinity), silnik używa realnej pojemności.
RUNDY: 2/5
NASTĘPNY KROK: FC: zweryfikować rundę 2; osobny pomiar produkcji Cegły/Ceramiki wymaga ziarna/buildu z Cegielnią i Garncarnią gracza (runner nie buduje).
UWAGI-DLA-ORKIESTRATORA (poza allowlistą, nie ruszane): gra/src/ui/cityPanel.ts ok. l.1144-1157 szacuje "Skarb +X" przez floor(netto x %), więc podgląd może różnić się od LRM o 1 jednostkę przy małej puli. Konkurencja gliny MIĘDZY miastami tego samego ownera nadal rozstrzyga kolejność miast (silnik i HUD zgodnie), a nie proporcja; to osobny temat, jeśli właściciel go chce.
DEPLOY/PUSH: NIE WYKONANO
