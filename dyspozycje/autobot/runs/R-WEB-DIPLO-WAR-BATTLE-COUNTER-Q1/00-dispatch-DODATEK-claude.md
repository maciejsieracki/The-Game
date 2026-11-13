# R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1 — DODATEK orkiestratora (runda 1)

## Kontekst
Krok 2 (kandydat 42bf2d9df, FC PASS) dodał czystą funkcję siły militarnej, ale nikt nie dostarcza jej wejść „punkty wygranych bitew z tej wojny” i „bonus trybutu aktywny”. Ten temat dodaje stan i zapis, bez zmiany zachowania gry.

## Wymagane
1. Stan pary (DiploPairMeta w gra/src/game/diplomacy-pn-engine.ts, linia ok. 69; wszystkie pola OPCJONALNE): wojnaBitwyPkt: punkty wygranych bitew liczone od startu wojny osobno dla strony o niższym i wyższym id (np. { niski: number, wysoki: number }), oraz trybutBonus: { dla: ownerId, doTury: number } (bonus wygasa po doTury).
2. Zapis wygranych bitew: miejsce zapisu punktów bitew do Power (gra/src/main.ts ok. 35059, odczyt 2792/2847, czyszczenie 35975) oraz miejsce końca bitwy wołające applyMilitaryWinRespectEvent (main.ts ok. 12478). Dopisz zapis do pary (zwycięzca, przegrany) dla WSZYSTKICH właścicieli, nie tylko gracza, TYLKO gdy para jest w wojnie. Użyj tych samych punktów, co składnik „wygrane bitwy” w Power (żeby nie wprowadzać drugiego modelu). Nie zmieniaj istniejącego zapisu do Power.
3. Reset: przy starcie wojny pary (diploEnsureWarStart, main.ts ok. 11632–11641) licznik zerowany; przy pokoju/rozejmie nieczytelny (może zostać, ale funkcja odczytu zwraca 0 poza wojną).
4. Trybut: znajdź miejsce przyjęcia trybutu (Respekt +10 dla pobierającego, parametr w data/diplomacy.json) i ustaw trybutBonus = { dla: pobierający, doTury: bieżąca tura + trybutBonusTur z gra/data/diplomacy-military-strength-params.json }. Pomocnik: czy bonus jest aktywny dla danego właściciela w turze T.
5. Czyste pomocniki w diplomacy-military-strength.ts: odczyt punktów bitew strony z meta pary (0 poza wojną), odczyt aktywności bonusu trybutu. Bez importu silnika.
6. Zapis gry: nowe pola opcjonalne serializowane razem z meta pary (main.ts ok. 37956 i 47166–47169); stary zapis bez pól wczytuje się jako 0 bitew i brak bonusu. Test wczytania starego zapisu.
7. Test gra/tools/diplo-war-battle-counter-test.cjs: (a) bitwa wygrana przez AI w wojnie AI↔AI zapisuje punkty zwycięzcy; (b) bitwa poza wojną nic nie zapisuje; (c) reset przy nowej wojnie; (d) odczyt poza wojną = 0; (e) trybut ustawia bonus na 10 tur i wygasa; (f) stary zapis; (g) mutacja (zapis tylko dla gracza) czerwieni test.

## Kryteria końca (binarne)
- tsc --noEmit exit 0; nowy test zielony; diplo-military-strength-test, diplomacy-test, diplo-respect-military-events-test bez regresji; pięć bramek: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6.
- Zachowanie gry bez zmian (żadna decyzja AI/pokój/UI nie czyta nowych pól): dowód grep.
- git diff --name-only (względem 42bf2d9df) tylko z allowlisty.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
