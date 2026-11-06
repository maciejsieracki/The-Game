STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1
GOAL: cegla x2 + Cegielnia +50% bazy za epoke wlasciciela (1 / 1,5 / 2 / 2,5 / 3), tylko Cegielnia, gracz i AI tak samo.

OBRONA R1 -- odpowiedzi na zarzuty (baza: 0ccf72917)

1. Bonus epoki martwy przy braku drewna -- PRZYJMUJE. Wlasciciel: "do cegielni mozesz stosowac mnozniki te, co wczesniej przy surowcach"
   (krzywa m(e) = 1 + 0,5(e-1), jak citizenConsumptionEraMultiplier). Wdrozona opcja C: mnoznik epoki na WYJSCIU, cykle Cegielni
   plaskie (50). converters.ts: converterOutputMultiplierForEra, CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE, converterThroughputsForEra,
   runConverter(..., outputMultiplier), klucz '<id>#outMult' w mapie przepustowosci dla runConverters (gracz i AI ta sama funkcja).
   Dowod: test silnika (drewno-limit, ta sama sytuacja era1 vs era3): wyjscie era3 = 2x era1; runConverter 5 drewna -> 10/15/30 cegiel
   (era1/2/5). Zuzycie gliny/drewna NIE rosnie z epoka.
2. Brak pomiaru w zywej grze -- ODRZUCAM jako zarzut do kodu, NIE_ZMIERZONO pozostaje (load maszyny ~25-28, limity czasu).
   Zastapione dowodem silnikowym wyzej (advanceCityEconomy w rezimie drewna i w rezimie przepustowosci: gracz era2 = 150, AI era3 = 200).
3. 1,33x vs 1,5x -- ODRZUCAM zmiane, ZGLASZAM: liniowo 1/1,5/2 (zasada b) zostaje; era3/era2 = 1,33x. Laczny efekt era2 = 150 wobec
   dzisiejszych 55 (~2,7x) wynika z x2 i +50%/epoke i jest nieuniknionym skutkiem decyzji; do potwierdzenia przez orkiestratora.
   Zmiana liniowo->wzgledne jest jednym parametrem (CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE).
4. Niespojny opis regresji -- PRZYJMUJE. Odtworzone listy FAIL na 80919e2ae vs kod po zmianie (diff calego wyjscia): eko-tech-paczka1 (5/6)
   IDENTYCZNE, szczescie-przebudowa-skali (515/4) IDENTYCZNE, ai-major-economy (blad uruchomienia) ten sam stos, rozni sie tylko sciezka.
   ekonomia-5x-inwariant 197/50, citizen-resource-upkeep 107/2, resource-usage-breakdown 98/2, mennica-magazyn 34/7 -- te same liczby co baza.
   ai-test 274/20 (jak origin/main); war-allin-capital-quick hash 655a1e48121dea93 (bez zmiany). tsc --noEmit EXIT=0.
   cyna-surowiec-test: NIE_ZMIERZONO (przekroczenie limitu czasu przy load ~25; odpalony w tle poza kontraktem nie zdazyl, wynik nie raportowany).
5. Przestarzale komentarze -- PRZYJMUJE. Poprawione: turn-economy.ts (dwa komentarze) i main.ts (komentarz HUD). Uzasadnienie wyjscia poza allowliste
   pierwotnego dispatchu: zmiana opcji C wymaga dotkniecia turn-economy.ts (budowa mapy przepustowosci) i main.ts (HUD brutto) --
   inaczej HUD rozjedzie sie z silnikiem. Wplyw na budzet AI w erze 1 (100 cegiel/ture zamiast 50): NIE_ZMIERZONO w grze; ai-test bez zmian.
6. Allowlista/testy -- brak zarzutu; potwierdzam, ze w obronie dodatkowo zmienione: turn-economy.ts, main.ts, citypanel-konwerter-produkcja-test.cjs
   (kotwica regex M3 + mutacja zaktualizowane do nowego wyrazenia), hud-konwerter-dopasowanie-test.cjs (nowa zaleznosc eval), converter-era-scaling-test.cjs,
   brick-production-x2-test.cjs (69/0, w tym mutacje i silnik drewno-limit).

TESTY (po obronie): brick-production-x2 69/0, converter-era-scaling 117/0, converters 49/0, hud-konwerter-dopasowanie 20/0,
citypanel-konwerter-produkcja 83/0, wire-ekonomia 37/0, building-stock-visibility 7/0, citizen-consumption-era-mult PASS, tsc EXIT=0.
BLOKADY: 3 (zywy pomiar NIE_ZMIERZONO; potwierdzenie liniowego 1/1,5/2 i ~2,7x w erze 2; cyna-surowiec NIE_ZMIERZONO).
RUNDY: obrona 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
