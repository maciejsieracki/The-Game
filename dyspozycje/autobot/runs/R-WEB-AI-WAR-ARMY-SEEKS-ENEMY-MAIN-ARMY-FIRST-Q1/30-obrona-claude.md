STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1
GOAL: w wojnie najwieksza armia AI idzie w pierwszej kolejnosci na najwieksza widoczna armie przeciwnika (bitwa w polu przed zdobywaniem miast); obrona domu i odbicie utraconego miasta maja pierwszenstwo.
ZMIANY/COMMIT: baza kandydata 35e1cf8a1ef33e1c3b8fe7e77522c83ab339e108 (baza 37bcf8ebb). Pliki (allowlista): gra/src/game/ai.ts, gra/src/game/ai-war-army-seeks-army.ts, gra/data/ai-params.json, gra/tools/ai-war-army-seeks-army-test.cjs, ten raport. SHA koncowy: w polu sha zwrotki (commit zawierajacy ten raport).
TESTY (surowe wyjscie, runda 2):
- tsc --noEmit: exit 0
- ai-war-army-seeks-army-test: 20 PASS, 0 FAIL (bylo 17)
- war-allin-capital-test: 96 passed / 2 failed (kandydat r1: 95/3, baza: 96/2); 1k PASS; pozostale FAIL = 6b aiVsAi i 6b noLandPath, dlug bazowy identyczny jak na bazie
- ai-test 296/0; ai-war-gate-test 24/0; ai-war-nearest-city-peace-2t-test 41/41; ai-army-all-civs-general-muster-test 26/0
- ai-war-defend-home-test 29/1 (FAIL "stan po 8 turach identyczny OFF vs ON") -- NIE zalezy od nakladki: ten sam wynik 29/1 przy ai_wojna_armia_szuka_armii_wlaczone=0 (sciezka kodu = baza); NIE_ZMIERZONO na czystej bazie 37bcf8ebb (brak osobnego worktree), wniosek z wylaczenia nakladki
- ai-army-scattered-merge-test: 4 uruchomienia z nakladka 33/0, 32/1, 33/0, 33/0; 6 uruchomien z nakladka WYLACZONA 33/0, 32/1, 33/0, 33/0, 33/0, 33/0 -> test czasowy chwiejny niezaleznie od nakladki
BLOKADY: brak
RUNDY: 2/5

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJE (poprawka + dowod). Przyczyna regresji 1k ustalona pomiarem (nie hipoteza bitew): harness.moveBlockedByUnit = 46 z nakladka vs 0 bez. Debug na kandydacie: nakladka zlecala kolumnie marszu krok na heks zajety przez wlasna jednostke, ktora jeszcze nie ruszyla (komendy w kolejnosci id, nie od frontu; firstStep liczone na pozycjach sprzed tury), a ruchy nakladki trafialy na koniec listy PO komendach rdzenia, ktore celowaly w heksy zwalniane dopiero przez ruch nakladki. Poprawka w ai.ts (applyArmySeeksEnemyArmy): (a) marsz od frontu (najblizsi celu pierwsi), (b) trasy liczone na kopii pozycji aktualizowanej po kazdym zleconym ruchu, krok na heks zajety w kopii odrzucany (kolejny kandydat), kopia uwzglednia cele ruchow rdzenia, (c) orderMovesToUnblock: pozniejszy ruch zajmujacego heks przestawiany PRZED ruch blokowany (budzet 2n przestawien, tylko gdy nakladka cos zmienila). Pomiar (scena aiVsAi 20 tur, nakladka ON): ruchy 157 -> 199, bitwy 31 -> 35, blk 46 -> 4 (OFF: 213/36/0); 1k: 199+35=234 >= 224 PASS. Zostaje 4 zablokowane ruchy w 20 turach (NIE_ZMIERZONO czy artefakt harnessu: harness liczy tylko trase dla wlasnych jednostek jako blokady, gra przepuszcza przez wlasne).
2. PRZYJMUJE. Dodano T6b (wrog 2 heksy od wlasnego miasta + sasiadujace armie: komendy PRZED == PO; kontrola czulosci: bez zagrozenia nakladka zmienia komendy) i T6c (utracone miasto b2 foundedBy=1 + sasiadujace armie: komendy PRZED == PO). Mutacje: M4 (if(false && isHomeDefenseThreatForCity...)) -> 19/1 FAIL (zabity, T6b); mutant galezi "utracone miasto" (if(false && cities.some(isCityLostOf...))) -> 19/1 FAIL (zabity, T6c). Kod przywrocony po kazdej mutacji (kopia ai.ts przed mutacja).
3. PRZYJMUJE. Do ai-params.json: ai_wojna_armia_szuka_armii_promien_skupiska=3, ..._zapas_zasiegu=1, ..._ruch_domyslny=2; usunieto stala ARMY_SEEKS_ARMY_CLUSTER_LINK z modulu; SeekParams ma clusterLink/reachSlack; testy zaktualizowane. Wartosci domyslne bez zmian (zero zmiany zachowania).
4. ODRZUCAM jako wade, zostaje zalozenie (e) (zgloszone w raporcie 10): nakladka jest swiadomym rozszerzeniem obrony domu (dispatch pkt 2: obrona domu ma pierwszenstwo; planHomeWar dostarcza definicje zagrozenia). Wylaczenie obrony domu wylacza reguly zalezne od niej -- zachowanie udokumentowane w komentarzu funkcji. Wplyw NIE_ZMIERZONO (brak sciezki produkcyjnej wylaczajacej obrone domu; flaga to tylko override testowy). Decyzja o rozlaczeniu -> orkiestrator, jesli wymaga.
5. NIE DOTYCZY OPERATORA (decyzja produktowa): prog sil 0,8 i zasieg N=3 zostaja jako wartosci proponowane w ai-params.json; ABC do rozstrzygniecia przez orkiestratora/wlasciciela. Nie zmieniono.
6. CZESCIOWO. Chwiejnosc ai-army-scattered-merge-test: ODRZUCAM zwiazek z nakladka -- test czasowy pada tez z nakladka wylaczona (1/6) i z wlaczona (1/4), dowod wyzej. Koszt czasu tury AI i dluzsze partie: NIE_ZMIERZONO ponad scena 20 tur (ruch 20 tur aiVsAi mieszcza sie w istniejacych bramkach czasowych war-allin-capital-test 6x: PASS).

NASTEPNY KROK: Evaluator rundy 2 -> Final Control; ABC o progach (zarzut 5); dlug bazowy 6b aiVsAi/noLandPath i ai-war-defend-home-test (poza zakresem). REPIN Rust (LEDGER) bez zmian wzgledem r1, dochodza 3 nowe parametry ai-params.
DEPLOY/PUSH: NIE WYKONANO
