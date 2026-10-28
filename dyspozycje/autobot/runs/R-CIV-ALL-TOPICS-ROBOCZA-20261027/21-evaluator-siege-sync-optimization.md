# AutoBot Evaluator — optymalizacja podwójnego syncu po zdobyciu miasta w szturmie

**WERDYKT: PASS-WITH-NOTES**
**Zakres:** niezależna ocena raportu 13 i `/tmp/large-empire-direct-siege-41093-y2iraf.json`; bez zmian produktu i bez uruchamiania przeglądarki.
**Repozytorium:** `/workspace/all-topics-candidate`; badany kod `gra/src/main.ts`.

## Ocena danych pomiarowych

Raport 13 opisuje kontrolowany, pojedynczy bezpośredni skan, bez EOT: 137 miast, 180 ulepszeń, cztery puste i cztery bronione miasta gracza, po czterech atakujących AI przy każdym celu. Relacja testowa była ustawiona na `wojna`, bez blokady pokoju. Surowy JSON potwierdza osiem przejęć (`city14`–`city21`), zmianę właściciela 0→1, spadek liczby jednostek 57→53, brak zmiany relacji oraz pustą listę błędów.

Skan trwał 18 269,6 ms, z czego `executeSilentSiegeStorm` 18 265,4 ms/8 wywołań. Cztery puste przejęcia zajęły 2 061–2 257 ms każde. Cztery szturmy z obrońcą zajęły 2 322–2 442 ms. Dla tych czterech szturmów surowe pomiary dają średnio: `applyMapBattleOutcome` 587,7 ms, jego `syncUnitsRender` 408,9 ms, `applyCityCaptureToMap` 178,1 ms i `applyPostBattleMap` 0,3 ms; `afterSiegeUi` trwał średnio 1 805,95 ms. Raport trafnie identyfikuje zatem powtórzony render jednostek jako mierzalny, ale lokalny koszt, około 0,41 s na bronione zdobycie w tej fixture. Cztery puste przejęcia nie przechodzą przez `finishSiegeStormBattle` i nie skorzystają z proponowanej zmiany.

To syntetyczny profil, nie naturalny EOT t39→40. Nie potwierdza samodzielnie, ile czasu z historycznych 30,734 s rzeczywiście przypadało na tę gałąź, ani jak duży będzie zysk w typowej rozgrywce.

## Weryfikacja przepływu sterowania

- `scanAutoSiegesAfterAiTurn()` synchronicznie wywołuje `executeSilentSiegeStorm()` dla postawy `assault`.
- `executeSilentSiegeStorm()` synchronicznie kończy obliczenia i wywołuje `finishSiegeStormBattle()`. Przy zdobyciu z obrońcami ta ścieżka nie przekazuje `summary`, a atakującym jest AI, więc `showSummary` jest fałszywe.
- W tej gałęzi `finishSiegeStormBattle()` wywołuje `applyMapBattleOutcome(...)`, a zaraz po jego powrocie — bez `await`, timera ani oddania sterowania przeglądarce — `afterSiegeUi()`.
- `applyMapBattleOutcome()` stosuje wynik bitwy, warunkowo przejmuje miasto i zapisuje callback sukcesu przejęcia; następnie czyści `forceVisibleUnitId`, wywołuje `syncUnitsRender()`, waliduje oblężenia i wraca.
- Dla faktycznego zwycięskiego przejęcia przez szturm `afterSiegeUi()` natychmiast wywołuje `refreshMapAfterCityCapture()`. Ta funkcja ponownie synchronizuje jednostki, synchronizuje miasta, odświeża mgłę i HUD-y, a na końcu planuje dodatkowe `syncUnitsRender()` przez `requestAnimationFrame`.

Wynika z tego, że można pominąć pierwszy render jednostek **wyłącznie po potwierdzonym przejęciu w szturmie AI**, pozostawiając mutacje modelu, callback przejęcia, loot, `validateActiveSieges()` i pełne odświeżenie w `afterSiegeUi()` bez zmian. Renderer nie otrzymuje pośredniego syncu, ale przeglądarka nie może wyrenderować klatki w środku nieprzerwanego synchronicznego stosu JS; końcowy sync następuje przed oddaniem sterowania. `refreshMapAfterCityCapture()` nadal ustawia stan wyboru i widoczności lead unit oraz wykonuje własny RAF sync.

Warunek musi być oparty na rzeczywistym sukcesie przejęcia, nie tylko na `siegeContext`, zwycięstwie atakującego albo samym wywołaniu szturmu. Bez zdobycia miasta, przy porażce/remisie, zablokowanym capture lub innym typie bitwy dotychczasowe `syncUnitsRender()` powinno pozostać. Nie należy zmieniać wspólnego domyślnego zachowania `applyMapBattleOutcome()`.

## Call sites i ograniczenia

W kodzie istnieją trzy wywołania `finishSiegeStormBattle()`:

1. `executeSilentSiegeStorm()` — cicha ścieżka szturmu AI, bez podsumowania; właściwy zakres pierwszej, wąskiej optymalizacji.
2. `doSiegeAutoResolve()` — automatyczny szturm uruchomiony z panelu gracza, z `summary` i callbackiem po podsumowaniu; nie obejmować pierwszą zmianą.
3. `bs.play(...)` — ręczna scena bitwy gracza, z `summary`; nie obejmować.

`applyMapBattleOutcome()` jest także wspólnym punktem dla bitew polowych. Nie wolno globalnie usuwać jego syncu ani wiązać optymalizacji z każdym `siegeContext`; parametryczne, domyślnie wyłączone zawężenie przekazane tylko przez cichy szturm AI jest bezpieczniejszą granicą.

## Wymagany test przed wdrożeniem

Test integracyjny powinien dla wygranej szturmu AI sprawdzić kolejność: mutacja ownera i stan jednostek → brak pierwszego `syncUnitsRender` → dokładnie jedno pełne `refreshMapAfterCityCapture` przed powrotem z `finishSiegeStormBattle`; oraz końcowy render zawierający aktualne jednostki/miasto. Dodać przypadki kontrolne: brak przejęcia, porażka/remis, walka polowa i szturm gracza nadal wykonują dotychczasowy sync. Zweryfikować też flagi oblężenia, relację/peace-lock, callback i zapis eventu capture.

Test bez przeglądarki może egzekwować wywołania rendererów, synchroniczny porządek oraz brak `await`/zaplanowanego yield między stanem a końcowym refresh. Nie może sam dowieść zachowania widocznej klatki w rzeczywistej przeglądarce. Ponieważ w tym zadaniu nie uruchamiano browsera, brak niezależnego dowodu frame-by-frame; należy to sprawdzić w zwykłym zestawie browser/render testów przed wydaniem, jeśli wymagana jest gwarancja wizualna.

## Konkluzja

Kod i pomiar wspierają wąskie pominięcie zduplikowanego syncu po **udanym przejęciu w cichym szturmie AI**. Jest to uzasadniony kandydat do implementacji, ale nie gotowa poprawka: wymaga ograniczenia do tej jednej ścieżki, testów przypadków negatywnych i potwierdzenia końcowego renderu. Oczekiwany zysk z samego pominięcia syncu to około 0,4 s na bronione zdobycie w testowej fixture; to nie rozwiązuje całego kosztu szturmu ani nie dowodzi naprawy wydajności przy przejściu tury 39→40.
