# Zapis/wczytanie zegarów absorpcji miast-państw AI — przegląd poprawki dfae6298c (AICSFIX, runda 1)

## Stan wiążący

- Błąd gry potwierdzony i naprawiony w kodzie: zegary `aiCsTrybutSince`, `aiCsWasalSince` oraz licznik `aiCsFailCount` (decyzje `decideAiCsClusterAction`: wasal_timer -> annex) były pomijane w zapisie i wczytaniu. Poprawka dfae6298c (gra/src/main.ts) zapisuje je w `meta`, czyści przy resecie świata i przy wczytaniu, odtwarza z zapisu. Stary zapis bez pól wczytuje się z pustymi mapami (jak dotąd).
- Przegląd ścieżek: zapis, reset i wczytanie są symetryczne dla wszystkich trzech map; format klucza `ai:cs` i wartości liczbowe zgodne z użyciem. Jedyny producent zapisu i jedyny konsument wczytania (patrz sekcja 2).
- Żywy dowód (bunt, seed 7, zapis t7, maksimum ustawień): przy zapisie 106 par trybut i 106 par wasal, po wczytaniu 106 i 106 (wcześniej 0). Przebieg po wczytaniu jest identyczny z ciągłym w 6 z 6 tur (tury 8–13, B==A, 0 różnic, 0 błędów strony, `aics-bunt7-r2-A.txt` / `aics-bunt7-r2-B.txt`, wynik VERDICT PASS; dist zbudowany z gra/src identycznego z 6d623cea0, przed zmianą wyłącznie narzędzia testu statycznego; gra/src w tej rundzie nietknięte). Pierwsza próba (`aics-bunt7-A.txt`) przerwana po t11 limitem wywołania; powtórzona w jednym wywołaniu A (około 9 min, poniżej limitu 590 s), a B w osobnym wywołaniu.
- Kontrole braku regresji (maksimum, zapis t3, 6/6 tur każda): max/4242, bunt/7, aionly/4242 — wszystkie B==A, 0 błędów strony. Uwaga: w kontrolach t3 pary trybut/wasal przy zapisie wynoszą 0 (kontrola formatu zapisu, nie ścieżki absorpcji).
- Test statyczny gra/tools/save-load-ai-cs-absorption-state-test.cjs: 27/0 (9 sprawdzeń zapisu/odtworzenia/czyszczenia dla 3 map + 18 mutacji czerwonych, tabela w sekcji 4). Wartość 12/0 z dispatchu odpowiada stanowi przed rozszerzeniem testu (3 mutacje); po rozszerzeniu w r1 było 21/0, po wzmocnieniu kotwic T1/T2 w tej rundzie 27/0.
- Bramki: tsc 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0; early-grace-15 33/0; society-breakdown 56/0; ai-city-order-need-wiring 267/0.
- NIE ZMIERZONO w tej rundzie: A==A' (ciągłość bez wczytania), klik UI przy wczytaniu, render sceny 3D, pozostałe komórki macierzy SAVEMAT (aionly/bunt t10).

## 1. Przegląd poprawki (dfae6298c)

Zapis (producent jedyny: `buildSaveGameSnapshot`, `meta` w gra/src/main.ts:42761):
- `aiCsFailCount`, `aiCsTrybutSince`, `aiCsWasalSince` zapisywane przez `Array.from(<mapa>.entries())` (linie 42826–42828).
- Konsumenci zapisu: `persistSaveToSlot` (43078, używany przez quicksave/zapis do slotu), `doRotatingAutosave` (43266). Wszystkie korzystają z tego samego `buildSaveGameSnapshot`, więc pola trafiają także do autosave i quicksave.

Reset świata (`doStartGame`, zaczyna się w linii 51108):
- `aiCsFailCount.clear()`, `aiCsTrybutSince.clear()`, `aiCsWasalSince.clear()` (linie 51265–51267), obok istniejących czyszczeń `aiAudienceLastRequestTurn`, `aiResourceBarterLastProposalTurn` itd.

Wczytanie (`restoreGameFromSave`, linia 52466; jedyny wywołujący w ścieżce gry: `loadGameFromSlot`, linia 52353):
- Czyszczenie na początku bloku (linie 53486–53488), następnie odtworzenie z `saved.meta?.<pole>` (linie 53489–53494). Brak pola (stary zapis) lub brak `meta` daje puste mapy (`?.length` jest strażnikiem).

Klucz i wartości:
- `aiCsPairKey(aiId, csId) = "${aiId}:${csId}"` (linie 40498–40500). Używany przy odczycie decyzji (47526–47544), zapisie (47566, 47572, 47591, 47597) i czyszczeniu (`clearAiCsPairState`, 40504–40509, wywołania 27407 i 47601). Kolejność (AI, miasto-państwo) jest spójna we wszystkich miejscach.
- Wartości: liczby (tury i liczniki). Zapisane i odtworzone jako `number`.

Wniosek przeglądu: brak luk w ścieżkach zapisu, resetu i wczytania dla trzech map. Nie stwierdzono potrzeby poprawki kodu gry poza dfae6298c. Nit (nie w zakresie): linie 53467 i 53479 zawierają dwa identyczne `aiAudienceLastRequestTurn.clear()` (wcześniejszy, zbędny, nieszkodliwy).

## 2. Audyt — kandydaci kolejnych błędów zapisu (BEZ naprawy)

Kryterium: zmienna modułowa `Map`/`Set` używana w decyzjach AI/dyplomacji, której nie ma w obszarze `buildSaveGameSnapshot` (gra/src/main.ts:42678–43048) i nie ma jawnej odbudowy w `restoreGameFromSave`. Każda pozycja wymaga weryfikacji (może być odtwarzana przez ponowne przeliczenie świata lub przy wczytaniu z innej ścieżki). Poziom pewności podano w nawiasie.

- `difficultyBonusGrantedOwners` (deklaracja 10404; zbiór 12187–12189; czyszczenie 11847). Brak w zapisie. Jeśli po wczytaniu zbiór jest pusty, a bonus startowy jest ponownie przyznawany w tej samej sesji, możliwe podwójne przyznanie. (Niska pewność: zależy od tego, czy wczytanie regeneruje świat i wywołuje przyznanie przed odtworzeniem.)
- `lastDiplomaticContactsSnapshot` (deklaracja 10890; reset 24560 i 24590; użycie 24686–24688). Brak w zapisie. Po wczytaniu porównanie z „poprzednim” zbiorem kontaktów może zgłosić ponownie lub pominąć ekran powitalny (kontakt w mgle). (Niska pewność; kandydat do sprawdzenia w grze.)
- `diplomacyDobraWolaActiveTura` (deklaracja 10783; czyszczenie i wypełnianie 26923–26932; odczyt 47292). Brak w zapisie. Flaga „aktywna w tej turze” może być przeliczana co turę (wtedy nieszkodliwe). (Do weryfikacji.)
- `aiNnsHoldOwners` (11187) i `aiNnsUncoveredOwners` (11189). Brak w zapisie. Zbiory blokady NNS AI. (Do weryfikacji; zależą od przeliczenia co turę.)
- `aiImprovementBudgetByOwner` (11222), `aiSurplusReportByOwner` (11228), `aiGoldIncomeByOwner` (11194). Brak w zapisie. Budżet ulepszeń AI i raport nadwyżki mogą wpływać na decyzje tury; raport bywa telemetrią. (Do weryfikacji.)
- `aiWonderPracaTickByCity` (6026) i `aiWonderStuckTurnsByOwner` (6033). Brak w zapisie. Liczniki cudów AI (tick i utknięcia). Jeśli są używane w decyzjach, po wczytaniu zerują się. (Do weryfikacji.)
- `pendingAdministratorChanges` (11008). Brak w zapisie; odczyt tylko w dwóch miejscach. (Do weryfikacji.)

Pozycje z obecnością w zapisie (nie są kandydatami): m.in. `aiTradeAgreementLastProposalTurn`, `aiAiTradeAgreementLastTurn`, `aiMarchPassageRequestTurn`, `aiResourceTradeLastProposalTurn`, `aiResourceBarterLastProposalTurn`, `aiAudienceLastRequestTurn`, `aiOneShotGiftLastTurn`, `aiSliderStateByOwner`, `aiPracaPoolByOwner`, `aiNaukaPoolByOwner`, `aiGeneralWarCampaignByOwner`, `aiAiPeaceRequestByPairKey`, `forcedWarWavesByPairKey`, `*ForceWarActiveByPairKey` (bronze/stone/iron), `forcedEraPeaceUntilNextEraByPairKey`, `eraWarCountByCivKey`, `regularWarCapturedByPairKey`, `diplomacyRelations`, `diplomacyFactorLog`, `wiarygodnosc*`, `nnsAiOverrides`, `eliminatedOwners`, `ownerEraByOwner`, `bronzeEraEnterTurnByOwner`, `ironEraEnterTurnByOwner`, `empireFoodStates`. Weryfikacja obecności: tylko przeszukanie tekstu obszaru zapisu, nie test żywy.

## 3. Test żywy — tabela (gra/tools/save-load-continuity-live.cjs; dist zbudowany poza repo w scratchpad z gra/src = 6d623cea0; komórki t3 z rundy 1)

| Komórka | Zapis | Tury B==A | Pary trybut/wasal przy zapisie -> po wczytaniu | Błędy strony | Wynik |
|---|---|---|---|---|---|
| bunt / seed 7 | t7 | 6/6 (8–13) | 106/106 -> 106/106 (wcześniej 0 po wczytaniu) | 0 | PASS (runda 2, pliki `aics-bunt7-r2-*`) |
| max / 4242 | t3 | 6/6 (4–9) | 0/0 -> 0/0 | 0 | PASS (kontrola) |
| bunt / 7 | t3 | 6/6 (4–9) | 0/0 -> 0/0 | 0 | PASS (kontrola) |
| aionly / 4242 | t3 | 6/6 (4–9) | 0/0 -> 0/0 | 0 | PASS (kontrola) |

Konfiguracja użyta (cfgUsed z JSON): barbariansLevel trudny, difficulty Trudny, rivals 9, civTypesCount 14. Maksimum zdefiniowane w narzędziu (MAX_RIVALS = 9, MAX_CIV_TYPES_BRAZ = 14, barbarzyńcy Trudny). Wszystkie przebiegi na maksimum; dla komórki bunt/7/t7 próg był spełniony w 4 turach.

Ograniczenie (runda 1, bez zmiany kodu): sesja A przy zapisie t7 i K=6 została przerwana limitem wywołania po turze 11 (`aics-bunt7-A.txt`). W rundzie 2 ten sam bieg (`--mode A --cfg bunt --seed 7 --saves 7 --k 6`) zmieścił się w jednym wywołaniu (tury 1–7 po 42–49 s, 6 tur po zapisie po 17–23 s; łącznie około 9 min), a wczytanie i porównanie (`--mode B`) w osobnym wywołaniu (około 1 min). Zrzuty: `aics-bunt7-r2-A.json/.txt`, `aics-bunt7-r2-B.json/.txt`.

Pliki wynikowe: dyspozycje/autobot/runs/R-WEB-SAVE-AICS-ABSORPTION-FIX-Q1/ (JSON i logi *.txt dla każdej komórki).

## 4. Test statyczny — tabela mutacji (gra/tools/save-load-ai-cs-absorption-state-test.cjs)

Baza: 9/9 sprawdzeń PASS. Runda 2 wzmocniła T1 (wpis zapisu musi być dokładnie `<mapa>: Array.from(<mapa>.entries()),` — kotwica na przecinku, bez `.slice`/`.filter`) i T2 (kolejność: drugie `.clear()` → odczyt `saved.meta?.<pole>` → `.set(` w odległości <400 znaków). Test wykrywa teraz mutację semantyczną z recenzji r1 (zapis obcięty do pustej tablicy), która wcześniej przechodziła przez regex prefiksowy.

| Mutacja (w kopii w pamięci, gra/src/main.ts nietknięty) | aiCsFailCount | aiCsTrybutSince | aiCsWasalSince |
|---|---|---|---|
| wycięty zapis | czerwony (T1) | czerwony (T1) | czerwony (T1) |
| zapis obcięty `.slice(0,0)` | czerwony (T1) | czerwony (T1) | czerwony (T1) |
| wycięte odtworzenie | czerwony (T2) | czerwony (T2) | czerwony (T2) |
| wycięte czyszczenie przy resecie świata | czerwony (T2, T3) | czerwony (T2, T3) | czerwony (T2, T3) |
| wycięte czyszczenie przy wczytaniu | czerwony (T2, T3) | czerwony (T2, T3) | czerwony (T2, T3) |
| czyszczenie przeniesione po odtworzeniu | czerwony (T2) | czerwony (T2) | czerwony (T2) |

WYNIK: 27 PASS / 0 FAIL (9 baz + 18 mutacji = 6 × 3 mapy, wszystkie mutacje czerwienią test). T3 nadal liczy wystąpienia `.clear()`; rozróżnienie resetu od wczytania realizuje T2 (indeks drugiego clear).

## 5. Pozostałe testy zapisu (headless)

- save-load-sort-test 4/4; save-load-ledger-history-test 4/4; save-load-podzial-pracy-representation-test 5/0; save-load-player-owned-city-test PASS; save-load-budowa-priorytet-on-load-test 6/0; fort-nodes-save-load-test 18/0; forced-war-iron-era-enter-turn-save-load-test 20/0; determinism-save-load-resume-test WYNIK PASS.
- NIE ZMIERZONO (wymaga --dist, czyli zbudowanej gry, i uruchomienia dynamicznego): save-load-roundtrip-state-drift-test (warstwa dynamiczna) oraz save-load-deserialize-fields-audit (tryb live lub --raw-a/--raw-b). Warstwa statyczna pierwszego testu PASS; dynamiczna nie uruchomiona w tej rundzie.
