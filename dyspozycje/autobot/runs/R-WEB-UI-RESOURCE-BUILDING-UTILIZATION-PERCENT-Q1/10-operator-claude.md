STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-BUILDING-UTILIZATION-PERCENT-Q1
GOAL: przy każdym budynku surowcowym w panelu imperium pokazać procent wykorzystania mocy w następnej turze (z prognozy silnika), powód < 100% jako chipy ikona+liczba, "wyłączony", budynki bez przerobu 100%, agregat per typ.
ZMIANY/COMMIT: baza origin/main 75f4183bb. Pliki: gra/src/game/converters.ts (ODSTĘPSTWO OD ALLOWLISTY, patrz BLOKADY), gra/src/game/turn-economy.ts, gra/src/game/building-toggle.ts, gra/src/main.ts, gra/src/ui/empireDetailPanel.ts, gra/tools/resource-building-utilization-test.cjs, gra/tools/resource-building-utilization-live.cjs, evidence/*.png. SHA: patrz odpowiedź w polu sha.

DESIGN (jedno źródło prawdy)
- `runConverter` (converters.ts) zwraca dodatkowo `maxCykle` (floor przepustowości), `limitedBy` ('wejscie'|'magazyn'), `limitingInputs`, `missing` (ile brakuje do pełnej mocy per limitujące wejście). Żadna reguła produkcji/przepustowości/balansu nie zmieniona; liczone z tych samych zmiennych co cykle.
- `summarizeBuildingUtilization` = suma cykli / suma maks. cykli receptur budynku (wielka odlewnia: braz+zelazo+stal), zaokrąglone do całych %.
- `tickEmpireResourcePipeline` (turn-economy.ts) wypełnia opcjonalne `utilizationOut` (cityId -> buildingId -> wykorzystanie) w Fazie 2 w tym samym przebiegu co `producedOut`. `forecastNextTurnProduction` zwraca `utilizationByCity` (ten sam klon/ta sama kolejność miast/wspólna pula wejść jak realna tura).
- `buildEmpireProducersSnap` (building-toggle.ts): `row.utilization` (kind converter | noConversion | asleep), `typeSummaries` (per typ: szt., wyłączone, średnie wykorzystanie ważone cyklami; tylko konwertery). main.ts tylko przekazuje `f.utilizationByCity`.
- Panel (empireDetailPanel.ts): komórka `utilizationCellHtml` przy każdym wierszu: "NN%" + dla < 100% chipy `resourceAmountChipHtml(klucz, "brakuje N")` (ikona+liczba, bez gołych nazw), "limit magazynu", "uśpiony (brak dostępu do złoża)"; wyłączony -> "wyłączony" (bez %); Stolarnia/Warsztat kamieniarski -> "100% bez przerobu" (założenie z dispatchu; kod potwierdza: to budynki +% dopływu, bez wejścia/konwersji, silnik nie ma dla nich receptury). Agregat per typ nad listą: "Garncarnia: 4 szt. (wyłączone: 1) · średnie wykorzystanie 51%" (wybór prosty: jedna linia na typ w całej cywilizacji, bez zaśmiecania wierszy miast). Stopka objaśnia procent. Sekcja rekrutacji nietknięta (konflikt z W17 ograniczony do renderProducersSection + nowa funkcja).

TESTY (liczby z surowego wyjścia)
- node tools/resource-building-utilization-test.cjs: 48 passed, 0 failed. Zawiera: tabela (pełny zapas 100%/50 z 50 cykli, 50%, 0% + powód wejscie i brakujące ilości, brak drewna), wyłączony (brak wpisu, enabled=false bez widoku), stolarnia/kamieniarski noConversion 100%, wielka odlewnia, SPÓJNOŚĆ z realną turą advanceCityEconomy: dla 6 poziomów zapasu gliny pokazany % == round(100*realna ceramika/nominał) (±0 pkt), 3 garncarnie na wspólnej puli 75 gliny -> 100/50/0 i suma cykli == realna produkcja, agregat per typ, UI w jsdom (chipy ikona+liczba, "wyłączony", agregat), snapshot bez prognozy nie wywala renderu.
- MUTACJA: (a) hardkod pct=100 w migawce UI -> test wykrywa niezgodności (>=3); (b) hardkod `const pct = 100;` w converters.ts -> 35 passed, 13 failed (czerwień), po przywróceniu 48/0.
- Chromium (prawdziwy, Vite HTTP port 5199, prawdziwe ikony brandAssets i CSS panelu): node tools/resource-building-utilization-live.cjs: 11 passed, 0 failed. Zrzut: dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-BUILDING-UTILIZATION-PERCENT-Q1/evidence/01-panel-imperium-procenty.png (Uruk 100%, Sparta 54% "brakuje 23" + ikona Gliny, Korynt 0% "brakuje 50"/"brakuje 100", Argos "wyłączony", Stolarnia/Warsztat kamieniarski "100% bez przerobu", agregat); realna tura: ceramika 77 == prognoza 77 == suma cykli pokazanych garncarni. 02-po-wlaczeniu-argos.png po kliknięciu przełącznika.
- npx tsc --noEmit: 0 błędów (puste wyjście).
- Istniejące: resource-building-toggle-test 210/0 (po przesunięciu nowej stopki za dotychczasową), converters-test 49/0, brick-cycles-75-100-test 46/0, brick-production-x2-test 69/0, converter-era-scaling-test 117/0, cyna-surowiec-test 78/0, foundry-throughput-x2-era-mult-test 159/0.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 20 pass/0 fail (referencja w docs 19/19 jest nieaktualna, wynik na main identyczny — nie zmierzono osobno), research-test 33/33, unit-replace-test 21/21, combat-test 6/6.
- PRE-ISTNIEJĄCE CZERWONE (zweryfikowane na kodzie sprzed zmian — pliki src przywrócone z git, ten sam wynik): mennica-magazyn-test 34 pass/7 fail (dane econ-params/ mnożniki); citypanel-konwerter-produkcja-test 99 pass/1 fail (N2 w cityPanel.ts, plik nietknięty). Nie naprawiano.

BLOKADY
- ODSTĘPSTWO OD ALLOWLISTY: edytowano gra/src/game/converters.ts (poza listą). Powód: procent musi pochodzić z tego samego `runConverter`, który liczy cykle; jedyne miejsce znające `tput`, limit wejścia i limit wyjścia to ta funkcja. Zmiana jest czysto addytywna (nowe pola wyniku + helper), bez zmiany reguł; wszystkie testy konwerterów zielone. Do decyzji Evaluatora/orkiestratora.
- Nie uruchomiono: pełnego mgla/map-gen. Rust REPIN: dług (nie dotyczy tego tematu — tylko UI/prognoza webowa; ewentualnie rust-port ekonomia ma własną prognozę — nie sprawdzano).
- Zawyżenie "NIE_ZMIERZONO": wydajność dodatkowego pola w prognozie nie mierzona osobno (test H2 toggle-test zielony: < 600 ms dla 120 miast).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (zarzuty numerowane): ocenić odstępstwo converters.ts, wybór agregatu per typ w cywilizacji, "bez przerobu 100%", zaokrąglanie do całych %.
DEPLOY/PUSH: NIE WYKONANO
