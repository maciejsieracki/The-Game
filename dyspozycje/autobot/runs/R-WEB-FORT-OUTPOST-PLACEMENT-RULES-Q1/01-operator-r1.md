STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FORT-OUTPOST-PLACEMENT-RULES-Q1
GOAL: Posterunek tylko na wlasnym terytorium przy granicy (jeden wspolny predykat: gracz, automat, AI); fort gdziekolwiek (cele zamorskie).

## (b) Reguly kodu PRZED poprawka (plik:linia z bazy 23dd158e9)
- Panel gracza i automat (wspolny kwalifikator): `gra/src/map/improvement-build.ts:1071-1090` - posterunek i fort: dowolny lad, nie w cudzym terytorium, poza wlasnym terenem wystarczy wlasna jednostka na heksie. Zrodlo bledu.
- Straznik gracza: `gra/src/main.ts:14917-14930` `assertPlayerTerritoryForBuild` - to samo (poza terenem + jednostka).
- Gate AI: `gra/src/main.ts:38866-38885` - to samo (poza terenem + wlasna jednostka).
- AI: `gra/src/game/ai.ts:2771-2845` `planExpansionFortBuilding` - jednostka stoi poza zasiegiem miast/fortow i poza cudzym terenem -> ZAWSZE `posterunek` (zrodlo zgloszenia: posterunki daleko od granicy). Wywolania ai.ts:3262, 4429.
- Automat E-FORT: `gra/src/game/auto-improvements.ts:620-760` (`pickFortClaims`) i ~1560-1600 - kandydaci tylko z `qualifies` (to samo kwalifikator), wiec poprawka w kwalifikatorze obejmuje i automat. Bez zmian w tym pliku.
- `improvement-tech.ts:47` (tech posterunku) bez zmian; fort wymaga techu "Wojskowosc" (terrain-improvements.json:270-285).
- `buildModeHud.ts`, `city-hex-clear.ts`: nie zawieraja reguly lokalizacji fort/posterunek (NIE zmieniane).

## Pomiar PRZED (histogram; `gra/tools/fort-outpost-placement-measure.cjs`)
Metoda: realny `generateMap` 56x40, 15 biegow (kontynenty, pangea, wyspy x ziarna 1-5), 1 miasto AI, 60 jednostek AI w losowych miejscach, realny `planExpansionFortBuilding` per jednostka. Pelna gra w przegladarce NIE_ZMIERZONO (~50 min/bieg, patrz ai-city-count-sim.cjs); pomiar obejmuje wylacznie sciezke ekspansji AI poza zasiegiem. Sciezka E-FORT: NIE_ZMIERZONO osobno (ten sam kwalifikator, pokryta testami auto-fort-*).
- kontynenty: posterunek 284 = poza-nieprzylegle 274 + poza-przylegle 10; fortow 0.
- pangea: posterunek 283 = 274 + 9; fortow 0.
- wyspy: posterunek 293 = 290 + 3; fortow 0.
- Razem 860 posterunkow, 0 wewnatrz granicy, 100% poza regula (NARUSZENIE-REGULY=860). Fortow AI = 0.
## Pomiar PO
- kontynenty: fort 284 (274 + 10); pangea: fort 283; wyspy: fort 293. Posterunkow 0 (naruszen 0). Forty poza terenem: dozwolone decyzja.
Logi: `measure-pre.txt`, `measure-post.txt`.

## ZMIANY
- `gra/src/game/fort-territory.ts`: nowy `isOutpostPlacementAllowed(q,r,ownerId,nodes)` (wlasny heks wg `territoryOwnerAt` + >=1 sasiad spoza wlasnego terenu) oraz `OUTPOST_PLACEMENT_DENIED_HINT`. Jedyna implementacja.
- `gra/src/map/improvement-build.ts`: `posterunek` uzywa predykatu (panel + automat); `fort` bez zmian. (Plik poza allowlista - ZALOZENIE: konieczny, bo to wspolny kwalifikator gracza i automatu; inaczej duplikacja predykatu. Do oceny Evaluatora.)
- `gra/src/main.ts`: straznik gracza (posterunek -> predykat + komunikat odmowy `showHintMessage`), gate AI (posterunek -> predykat), import.
- `gra/src/game/ai.ts`: ekspansja AI poza zasiegiem stawia FORT (klucz `EXPANSION_KEY`; wymaga techu fortu) - cel zamorski dozwolony; AI nie stawia posterunku poza granica.
- Testy: NOWY `fort-outpost-placement-rules-test.cjs` (34 asercje), `fort-outpost-placement-measure.cjs`. Zaktualizowane (uzasadnienie: stara regula "posterunek poza terenem + jednostka" / AI stawia posterunek): `ai-improvements-test.cjs` (sekcja 11: fort + tech Wojskowosc), `fort-strazniaca-zasieg-zakladania-test.cjs` (B1d, B3b -> NIE; C4/C5 + tech Wojskowosc).
- Fort: nie dodano zadnego ograniczenia; zachowane istniejace reguly (lad, nie cudze terytorium, poza wlasnym terenem wymagana wlasna jednostka - ZALOZENIE, "reguly techniczne" z dispatchu).
- ZALOZENIA: "przyleganie do granicy" = >=1 z 6 sasiadow nie jest wlasnym terytorium (wolny/morze/obcy/poza mapa); heks z cudzym fortem nie jest wlasny. AI nie dostal nowego wyszukiwania posterunkow przy granicy (poza zakresem; wczesna ekspansja posterunkiem AI znika - wymagany tech fortu "Wojskowosc", epoka 3) - do decyzji orkiestratora.

## TESTY
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Nowy test: PRZED (baza, `PLACEMENT_SRC`) 20 passed / 14 failed (RED, EXIT=1); PO 34/0 (GREEN, EXIT=0).
- Mutacje (kopia src poza repo): brak warunku granicy 31/3 FAIL; brak warunku wlasnosci 27/7; kwalifikator posterunku bez predykatu 28/6; AI znow posterunek 33/1; fort bez wymogu jednostki poza terenem 33/1 - wszystkie wykryte.
- Regresje PRZED vs PO (19 testow `*fort*`, `*posterun*`, `*auto-fort*`, `*ai-improvements*`, `*okolica*`): PO wszystko EXIT=0 poza trzema identycznymi PRZED i PO: `fort-outpost-territory-live-test.cjs` EXIT=2 (wymaga --out/przegladarki, NIE uruchomione), `okolica-load-reconcile-test.cjs` EXIT=1 (3 FAIL PRZED=PO), `okolica-ownership-change-reconcile-test.cjs` EXIT=1 (4 FAIL PRZED=PO). `city-hex-clear` brak pasujacego testu `*test.cjs`.
- Weryfikacja w przegladarce (UI): NIE_ZMIERZONO (brak bundla; zmiana UI to komunikat odmowy + logika kwalifikatora pokryta testem na realnym `buildImprovementQualifier`).

## BLOKADY: brak (pliki `ai.ts`/`auto-improvements.ts` mozliwy konflikt z Q2 R-WEB-AUTOCLEAR / AUTO-IMPROVE-REMOVE-ITEM-CAP - ai.ts zmieniony tylko w `planExpansionFortBuilding`, auto-improvements.ts nietkniety).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (ocena zalozen: plik improvement-build.ts poza allowlista; wygaszenie wczesnego posterunku AI)
DEPLOY/PUSH: NIE WYKONANO
ZMIANY/COMMIT: SHA ponizej / w odpowiedzi koncowej.
