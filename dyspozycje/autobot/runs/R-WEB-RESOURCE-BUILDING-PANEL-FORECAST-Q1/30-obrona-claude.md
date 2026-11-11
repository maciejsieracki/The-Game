STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RESOURCE-BUILDING-PANEL-FORECAST-Q1
GOAL: agregat 7 budynkow produkcyjnych + prognoza nastepnej tury w panelu imperium (ten sam kod co realny tick), bez zmiany mechaniki produkcji.
ZMIANY/COMMIT: start 552772ebf; poprawki w jednym commicie obrony (SHA w polu sha odpowiedzi). Pliki:
  gra/src/game/mennica-zloto-grace.ts (nowa czysta funkcja predictMennicaZlotoAccessForNextTick),
  gra/src/main.ts (producersForecastArgs uzywa jej + import),
  gra/tools/resource-building-toggle-test.cjs (sekcja H), gra/tools/resource-building-toggle-ui-live.cjs (zaostrzone asercje),
  ten raport.
TESTY (surowe wyjscie): tsc --noEmit: 0 bledow; resource-building-toggle-test 210 passed/0 failed (bylo 184);
  resource-building-toggle-ui-live (Chromium) 26 passed/0 failed (bylo 24); hud-konwerter-dopasowanie 20/0; logic 213/213;
  tech-tree 20/0; research 33/33; unit-replace-full-cost 40/0; combat sanity OK;
  building-upkeep-resources 47 passed/1 failed (D10) = dlug bazowy.
BLOKADY: brak. Wymog "48 zielonych" nieosiagalny z powodu D10 (dlug bazowy, zarzut 5).

ODPOWIEDZI NA ZARZUTY
1. Wydajnosc -- PRZYJMUJE (pomiar, bez zmiany kodu). Dodano pomiar w tescie (sekcja H2): 120 miast (60 gracza + 60 AI), 6 budynkow
   na miasto: 4,6 ms / przebieg; panel (do 3 przebiegow) ~14 ms; asercja progowa < 600 ms. Ograniczenie: dane syntetyczne, mapa
   1-hexowa, Node (nie przegladarka); NIE_ZMIERZONO na realnej mapie z 26+ miastami w Chromium. Zawezenie klonu do miast gracza
   odrzucone: computeWorkedMagazynYieldsByCity zalezy od miast WSZYSTKICH wlascicieli (spor o terytorium), wiec zawezenie
   zmieniloby wynik (rozjazd z realnym tickiem).
2. Parytet main.ts -- CZESCIOWO PRZYJMUJE, CZESCIOWO ODRZUCAM.
   PRZYJMUJE (luka realna): realny tick uzywa prepareMennicaZlotoGraceForTick (utrata dostepu do zlota w tej turze po turze z dostepem
   ustawia lask 1 tury -> Mennica dziala), a prognoza uzywala resolvera sprzed przygotowania lask -> w turze utraty dostepu prognoza
   zanizalaby Mennice. Poprawka: predictMennicaZlotoAccessForNextTick (bez mutacji stanu; wynik == prepare+resolver).
   Dowod: test H1, 12 kombinacji (dostep teraz x hadAccessLastTurn x grace): predict == realny resolver ticku, stan nietkniety.
   ODRZUCAM (mapy orderMult/wonder/growth/ownerCiv tylko dla ME): turn-economy.ts, advanceCityEconomy: tickEmpireResourcePipeline
   wolane ok. l. 2685; przy productionForecastOnly funkcja wraca w l. 2704 (`if (options?.productionForecastOnly === true) return result;`),
   PRZED jakimkolwiek uzyciem ownerCivByOwnerId (pierwsze uzycie l. 2746), orderMult, wonder i growth. Te mapy nie wchodza do fazy
   produkcji surowcow, a czytamy tylko wlasciciela ME(). Parytet silnika testuje sekcja G (prognoza == realna tura, 4+ surowce,
   wlaczone/wylaczone, niedobor wejsc). Test samego main.ts: tylko tsc -- NIE_ZMIERZONO w grze.
3. Drewno z wycinki lasu -- ODRZUCAM. Wycinka (tickHexClearing) to jednorazowe zdarzenie zalezne od dzialan w trakcie tury, nie
   produkcja budynkow/mapy; prognoza z definicji ("jesli nic sie nie zmieni", dokumentacja forecastNextTurnProduction) nie widzi
   zdarzen, jak handel i zakupy. Zmiana zakresu = zmiana mechaniki, poza GOAL ("bez zmiany mechaniki produkcji"). Do rejestru jako
   znane ograniczenie, nie blokada.
4. Test Chromium -- PRZYJMUJE (zaostrzone asercje). Przyczyna 225 -> 423 (nie 450): miedzy pomiarem 450 a koncowym przebiegla realna
   tura (z wylaczona Cegielnia), ktora zuzyla zapasy wejsc -> prognoza na nowym stanie jest nizsza; to nie blad. Dodano:
   (a) wylacz -> wlacz BEZ tury: prognoza wraca DOKLADNIE (450 -> 225 -> 450) -- PASS; (b) koncowa wartosc panelu == prognoza silnika
   na biezacym stanie (423 = 423) -- PASS. Test pozostaje renderem realnego panelu z silnikiem w Chromium, nie pelna gra.
5. Dlug bazowy D10 -- ODRZUCAM jako zarzut wobec kandydata (potwierdzam). D10 sprawdza zrodlo karty (stockResourceLabel/'pieniadz'/
   plUpkeepForm w adapterze); moje zmiany nie dotykaja tych plikow (git diff a8b063989..HEAD: 9 plikow z listy tematu + 5 plikow obrony
   z listy wyzej). Wynik 47/1 identyczny jak na a8b063989 (Evaluator). Do rejestru dlugu testowego.
6. Brak 00-dispatch.md na main -- ODRZUCAM (nie dotyczy kodu). Kryteria wziete z DODATKU + zadania orkiestratora; uwaga procesowa.

NASTEPNY KROK: Final Control kandydata z commitem obrony; orkiestrator: wpis dlugu D10 + ograniczen (wycinka drewna, brak pomiaru na realnej mapie).
RUNDY: obrona rundy 1/5
DEPLOY/PUSH: NIE WYKONANO
