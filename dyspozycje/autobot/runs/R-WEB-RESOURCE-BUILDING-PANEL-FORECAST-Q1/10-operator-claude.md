STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RESOURCE-BUILDING-PANEL-FORECAST-Q1
GOAL: (1) agregat per surowiec w panelu imperium obejmuje wszystkie 7 budynkow z przelacznikiem (dodana Stolarnia = Drewno, Warsztat kamieniarski = Kamien); (2) obok historii ostatniej tury i maksimum pokazac PROGNOZE nastepnej tury liczona tym samym kodem co realny tick.

ZMIANY/COMMIT: baza origin/main a8b063989. Allowlista (wyliczona przed edycja):
- gra/src/game/turn-economy.ts: `advanceCityEconomy` dostaje opcjonalny ostatni parametr `options.productionForecastOnly` (konczy po fazie produkcji, PRZED zapisem stanu Spichlerza `_spichlerz*`); `tickEmpireResourcePipeline` dostaje `inflowOut` (faktyczny dopyw drewna/kamienia po bonusie i po przycieciu do limitu) i `stopAfterProduction`; `EconomyTickResult.rawInflowByOwner`; nowa funkcja `forecastNextTurnProduction` (ten sam kod co tick, uruchomiony na `structuredClone` miast; zero zmiany stanu gry). Mechanika produkcji bez zmian (dodane tylko odczyty zwracanej wartosci `creditOwnerResourceStock` i wczesny powrot w trybie prognozy).
- gra/src/game/building-toggle.ts: etykiety Drewno/Kamien, `RAW_INFLOW_RESOURCE_BUILDING`, pole `forecastNextTurn` w wierszu agregatu, argumenty `forecastNext` i `rawInflowPotential` w `buildEmpireProducersSnap`.
- gra/src/main.ts: `producersForecastArgs()` (prognoza + maksimum dopywu drewna/kamienia przy wlaczonych i przy wszystkich zainstalowanych), dopiecie do migawki panelu; historia ostatniej tury zawiera teraz tez dopyw drewna/kamienia (`econ.rawInflowByOwner`).
- gra/src/ui/empireDetailPanel.ts: tabela agregatu 5 kolumn: SUROWIEC / OSTATNIA TURA (ZREALIZOWANO) / PROGNOZA NASTEPNEJ TURY / MAKSIMUM (WLACZONE) / MAKSIMUM (WSZYSTKIE) + nowa stopka po polsku.
- gra/tools/resource-building-toggle-test.cjs (sekcja G + poprawione asercje E), gra/tools/resource-building-toggle-ui-live.cjs (Chromium: prognoza, klik zmienia prognoze).
- dyspozycje/autobot/runs/R-WEB-RESOURCE-BUILDING-PANEL-FORECAST-Q1/10-operator-claude.md + evidence/*.png.
SHA: patrz pole sha zwrotu (czubek pracy).

TESTY (liczby z surowego wyjscia, worktree z node_modules `npm ci --ignore-scripts`):
- `npx tsc --noEmit`: exit 0, 0 bledow.
- resource-building-toggle-test: 184 passed, 0 failed (bylo 130; dispatch wymagal 130 zielonych). Sekcja G: 4 scenariusze (wszystko wlaczone / wylaczona Cegielnia i Wielka odlewnia / wylaczona Stolarnia i Warsztat kamieniarski / niedobor wspolnych wejsc), w kazdym prognoza == realnie wyprodukowane po `advanceCityEconomy` dla kazdego surowca; w scenariuszu bazowym >= 4 surowce z dodatnia produkcja (cegla, ceramika, braz, zelazo, stal, drewno); prognoza nie zmienia stanu miast (JSON przed == po); magazyn cegly po realnej turze == prognoza.
- resource-building-toggle-ui-live (prawdziwy Chromium /opt/pw-browsers/chromium-1194): 24 passed, 0 failed (bylo 16 sprawdzen + 8 nowych). Klik wylacz Cegielnie: prognoza cegly 450 -> 225; klik wylacz Stolarnie: prognoza drewna 82 -> 75; prognoza == realna tura po kazdym stanie (cegla 450/450, drewno 82/82; po wylaczeniu 225/225, 75/75). Zrzuty: evidence/06-prognoza-wszystko-wlaczone.png, evidence/07-prognoza-wylaczone.png.
- hud-konwerter-dopasowanie-test: 20 passed, 0 failed.
- logic-test 213/213; tech-tree-test 20/0 (nominalnie 19/19 w dokumentacji, aktualny main ma 20 testow); research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- building-upkeep-resources-test: 47 passed, 1 failed (D10 `ad.includes('stockResourceLabel(k)')` w buildingAdapter.ts). PRE-ISTNIEJACE, niezwiazane: plik buildingAdapter.ts nie byl zmieniany w tym temacie, a asercja jest nieaktualna po R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1 (commity 86ebbba98/5ec479d27). NIE naprawiane (poza allowlista) -> zgloszenie dlugu testowego dla orkiestratora.
- NIE_ZMIERZONO: pelny gra z `main.ts` w przegladarce (migawka `producersForecastArgs` w prawdziwej grze); `vite build`/`npm run build` zabronione. `main.ts` jest pokryty tylko przez tsc; test Chromium uzywa tego samego silnika (`forecastNextTurnProduction`, `buildEmpireProducersSnap`, `renderProducersSection`) wpietego tak jak w main.ts.

ZALOZENIA (luki w dispatchu rozstrzygniete):
1. Stolarnia i Warsztat kamieniarski NIE sa konwerterami: w kodzie dodaja +10% (parametr econ-params) do dopywu Drewna/Kamienia z mapy, sumowane civ-wide; w danych `buildings.json` ich karta mowi o bonusie Pracy, a `uwagi` Stolarni: "bez konwertera desek". Brak "desek" i "cegly kamiennej" w silniku. Wiersze agregatu to wiec "Drewno" i "Kamien" = CALY dopyw z mapy po bonusie (nie tylko czesc od budynku); stopka to wyjasnia. Wiersz pojawia sie tylko gdy w panstwie stoi dany budynek.
2. Dla Drewna/Kamienia "maksimum (wlaczone/wszystkie)" = dopyw liczony tym samym kodem na klonie bez zapasow (bez przyciecia do limitu magazynu), przy biezacych wylaczeniach i przy wszystkich budynkach wlaczonych. "Ostatnia tura" tych wierszy = faktyczny dopyw po przycieciu do limitu.
3. Prognoza = "jesli nic sie nie zmieni do konca tury": nie widzi handlu/zdarzen/zakupow zachodzacych przed tickiem ani utrzymania surowcowego odliczanego po produkcji.
4. Kuznie nadal poza zakresem (nie produkuja surowca), bez zmian wzgledem ENABLE-TOGGLE.
5. Prognoza liczy sie przy kazdym zbudowaniu migawki panelu (3 przebiegi fazy produkcji na klonie miast tylko gdy stoi Stolarnia/Warsztat, inaczej 1). Wydajnosci przy bardzo duzej cywilizacji NIE_ZMIERZONO.

BLOKADY: brak (ani zakaz `npm run build`/`dev` ani push/deploy nie naruszone).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (sprawdzic: parytet prognozy z tickiem na wiekszej liczbie miast/ownerow, stan globalny w trybie prognozy, czytelnosc 5 kolumn przy waskim panelu) -> Final Control. Dlug testowy do zarejestrowania: building-upkeep-resources-test D10.
DEPLOY/PUSH: NIE WYKONANO
