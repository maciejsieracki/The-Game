# AutoBot Operator — profile scanu automatycznych oblężeń

**STATUS: DIAGNOSTYKA NIEUKOŃCZONA — bez zmian produktu**
**BAZA:** `integration/robocza-all-topics-20261027`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`
**ZAKRES:** lokalizacja 30,734 s przypisanych do `scanAutoSiegesAfterAiTurn()` w stres-teście t39→40 oraz zapis właścicieli miast/dyplomacji. Nie zmieniano autosave, dyplomacji ani produktu.

## Zmiany wyłącznie w harnessie

W `gra/tools/perf-large-empire-stress-live-test.cjs` dodano pomiary oddzielające `validateActiveSieges`, detekcję, wybór postawy, `executeSilentSiegeStorm` i `startMapSiege`, wraz z liczbą wykonań oraz stance. Dodano też migawki `cityId → ownerId`, różnice przed/po EOT oraz snapshoty relacji i peace-lock. Rejestrowany jest dokładny kanał callbacku `applyCityCaptureToMap.onOwnerChanged` i zmiana w `resolveSiegeSurrender.ownerId`, z relacją w chwili callbacku.

Weryfikacja transformu: `node --check`, `git diff --check` i `STRESS_BUILD_ONLY=1 node tools/perf-large-empire-stress-live-test.cjs 1` przeszły. Vite przekształcił 911 modułów. Zbudowany artefakt: `/tmp/large-empire-stress-39522-5eo8ue/index.html`, 69 914.93 kB, SHA-256 `d6bb01482990a1a7d6e2967bc2a69e81d51ab47824d8a02f3c46908d8a723486`.

## Jedyny replay

Uruchomiono dokładnie jeden replay `STRESS_COMPACT=1 node tools/perf-large-empire-stress-live-test.cjs 40`; nie uruchomiono ponowienia ani stresu 100-turowego. Po około 4 min 24 s generowanie świata zakończyło się, a fixture potwierdził 137 miast (40 gracza, sześciu głównych AI po 15, siedem miast-państw), 180 usprawnień, 21 jednostek i 5 typów budynków w każdym mieście. Heap przed turą: 459 121 637 bajtów.

Pierwszy EOT (turn 1→2) nie dał checkpointu. Po około 7 min 53 s całkowitego czasu procesu, wciąż bez przejścia do tury 2, proces przerwano, aby nie mnożyć prób. W tym harnessie ścieżka oczekiwania może wykonać do ośmiu 60-sekundowych oczekiwań/retry, więc nie osiągnęła jeszcze końcowego timeoutu. Playwright korzystał z `remote-debug-pipe`; harness nie zapisał zrzutu ani stanu modala przed przerwaniem. Brak zalogowanych błędów nie dowodzi, że EOT działał poprawnie.

Wynik: brak danych fazowych skanu oblężeń, brak migawki przejścia właściciela i brak callbacku przejęcia. Nie można wskazać gałęzi odpowiedzialnej za 30,734 s ani ocenić pokojowej legalności zmiany właściciela z t3→4. Dotychczasowe hipotezy (`executeSilentSiegeStorm` lub `startMapSiege`) pozostają niepotwierdzone. Nie wprowadzono optymalizacji ani regresji równoważności zachowania, ponieważ bez lokalizacji hotspotu taka zmiana byłaby spekulatywna.

## Następny krok

Przygotować pojedynczy, bezpiecznie odtwarzalny test profilu oblężeń, który nie wymaga pełnego generowania świata i 40 EOT, albo umożliwić harnessowi zatrzymanie po pierwszym 60-sekundowym timeoutie z migawką stanu. Dopiero po uzyskaniu pomiaru branch-level napisać ograniczoną optymalizację i test równoważności semantyki. Niezależny Evaluator powinien ocenić ten raport oraz ryzyko braku danych przed jakąkolwiek zmianą produktu.

**Commit / merge / deploy / push:** nie wykonano.

## Follow-up: pojedynczy bezpośredni scan bez EOT

Po ocenie Evaluatora przygotowano jeden targeted live run, który używa tej samej seeded fixture 137 miast/180 usprawnień, ale nie uruchamia EOT. Test-only Vite transform udostępnił wywołanie realnego `scanAutoSiegesAfterAiTurn()` i skonfigurował osiem miast gracza jako ufortyfikowane cele, każde z czterema syntetycznymi jednostkami AI na sąsiednim heksie. Istniejący `__aiWojnyZwykleCapTestDebug.declareRegularWarBetween(0, 1)` ustanowił relację `wojna`; odczyt peace-lock wyniósł `false`. Wykonano dokładnie jedno wywołanie skanu.

Artefakt browser-run: `/tmp/large-empire-stress-40484-kytjd2/index.html`, 69 915.90 kB, SHA-256 `f879a8d56cf200e07f7c98d24fdb45648d974ad6f785f2d3c6d8d7e679f71564`. Transform przeszedł wcześniej `node --check`, `git diff --check` oraz build-only (911 modułów).

Pomiar jednego skanu: 16 670.3 ms łącznie; `validateActiveSieges` 0.1 ms, detekcja 0.4 ms, decyzje 1.2 ms, `executeSilentSiegeStorm` 16 666.3 ms przez 8 wywołań, 0 wywołań `startMapSiege`. Każdy szturm zakończył się przejęciem jednego miasta gracza. Wszystkie osiem zmian miało callback `applyCityCaptureToMap.onOwnerChanged`, identyfikatory `city0` oraz `city14`–`city20`, i zapis capture event. Każdy callback odczytał `relation.status='wojna'`, `peaceLocked=false`; nie wystąpiła zmiana relacji ani page/console error. Po szturmach liczba jednostek spadła z 53 do 51.

Wniosek: koszt skanu w tej kontrolowanej fixture pochodzi praktycznie w całości ze skutków ośmiu automatycznych szturmów, a nie z walidacji, detekcji ani wyboru postawy. To **materialnie potwierdza** `executeSilentSiegeStorm` jako wiarygodne źródło dużej części historycznych 30.734 s. Nie dowodzi dokładnego udziału tej gałęzi w naturalnym t39→40: fixture syntetycznie wymusiła osiem assault/capture pod wojną i nie odtwarza naturalnego składu ani liczby szturmów. Nie zmieniono produktu ani nie wykonano drugiego skanu.

Pozostała praca: independent Evaluator powinien zrecenzować tę diagnozę oraz dobrać bezpieczną optymalizację dla kosztownych skutków szturmów. Nie wyciągać wniosku o legalności poprzedniej zmiany właściciela w t3→4 z tej osobnej fixture; jej osiem callbacków dowodzi jedynie, że bramka capture widziała w tym uruchomieniu aktywną wojnę i brak peace-lock.

## Follow-up: podział kosztu jednego szturmu

Na kolejną autoryzowaną próbę użyto **jednego** bezpośredniego skanu i mieszanej fixture: cztery puste miasta + cztery miasta z jednym syntetycznym obrońcą, każde z czterema sąsiednimi AI attacker units; 137 miast/180 ulepszeń, relacja 0↔1 `wojna`, peace-lock=false. Nie było EOT ani powtórzenia. Wynik maszynowy zachowano w `/tmp/large-empire-direct-siege-41093-y2iraf.json`.

Bundle: `/tmp/large-empire-stress-41093-y2iraf/index.html`, 69 918.88 kB, SHA-256 `0fd7af4067cead27c87a1a54c45e67d4acb74003585afc86110d02e52ac37f86`. Build-only (911 modułów), `node --check` i `git diff --check` przeszły.

Osiem szturmów trwało 18 265.4 ms łącznie (18 269.6 ms cały skan). Atakujący roster zajmował ≤0.1 ms; test obecności obrońców ≤0.3 ms; roster obrońców ≤0.0 ms; obliczenie siły/rozstrzygnięcie ≤0.6 ms. Cztery puste przejęcia przez `captureCityWithoutBattle` trwały średnio 2 171.5 ms każde. W ich `refreshMapAfterCityCapture` pojedynczo kosztowały średnio: `syncUnitsRender` 427.8 ms, `cityRenderer.sync` 436.8 ms, `refreshFog` 743.6 ms; reszta tej ścieżki ok. 563 ms.

Cztery pełne szturmy z obrońcą trwały średnio 2 393 ms każdy w `finishSiegeStormBattle`: `applyMapBattleOutcome` średnio 587.7 ms, a jego `applyPostBattleMap` jedynie 0.3 ms. W `applyMapBattleOutcome` przejęcie miasta średnio 178.1 ms, a pierwsze `syncUnitsRender` średnio 408.9 ms. Natychmiast potem `afterSiegeUi` ponownie uruchamia `refreshMapAfterCityCapture`, gdzie średnio kosztują: drugie `syncUnitsRender` 391.2 ms, `cityRenderer.sync` 384.9 ms i `refreshFog` 706.5 ms. Cały `afterSiegeUi` zajmował średnio 1 805.9 ms. Wszystkie osiem zmian ownera miało capture callback oraz zapis eventu; dla każdej callback odczytał `wojna` i brak peace-lock. Brak błędów konsoli/pageerror.

### Kandydat optymalizacji do oceny (niezaimplementowany)

Po udanym przejęciu przez szturm `applyMapBattleOutcome` wywołuje `syncUnitsRender()`, a synchroniczny caller `finishSiegeStormBattle` od razu po powrocie wykonuje `afterSiegeUi()` → `refreshMapAfterCityCapture()` → drugi `syncUnitsRender()`. Między nimi nie ma `await` ani oddania klatki. Warto rozważyć pominięcie pierwszego renderowego sync **tylko** gdy `siegeContext` i przejęcie miasta rzeczywiście się powiodło, pozostawiając wszystkie modyfikacje jednostek, capture/dyplomację, `validateActiveSieges()` i końcowy `refreshMapAfterCityCapture` bez zmian. W fixture drugi sync kosztował około 0.39 s/szturm, więc jest to mierzalna, ograniczona możliwość. Przed wdrożeniem wymaga implementacji z testem równoważności, który sprawdzi po bitwie właścicieli/jednostki, relację/peace-lock, flagi oblężenia oraz końcowy render. Nie zmieniałem produktu, nie dodawałem takiego testu i nie uruchamiałem kolejnego profilu.
