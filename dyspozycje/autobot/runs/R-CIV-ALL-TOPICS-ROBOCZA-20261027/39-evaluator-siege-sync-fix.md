# AutoBot Evaluator — niezależna ocena optymalizacji syncu po szturmie

**WERDYKT: PASS-WITH-NOTES**
**Zakres:** niezależna inspekcja `31-operator-siege-sync-fix.md`, bazowego pomiaru i uwag z raportów 13 i 21, aktualnego `gra/src/main.ts` oraz harnessu `gra/tools/perf-large-empire-stress-live-test.cjs`. Bez zmian produktu i bez długiego stresu.

## Tożsamość i sprawdzenia

- `gra/src/main.ts` SHA-256: `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d`.
- `gra/tools/perf-large-empire-stress-live-test.cjs` SHA-256: `75bfa86a42c70ff284c0de99c13731bbb4e0406f5e26f4475a2400698d1bc739`.
- `node --check tools/perf-large-empire-stress-live-test.cjs`: PASS.
- `STRESS_BUILD_ONLY=1 node tools/perf-large-empire-stress-live-test.cjs 1`: PASS; Vite przekształcił 911 modułów, bez uruchomienia workloadu przeglądarkowego.
- Odczytano istniejący wynik `/tmp/large-empire-direct-siege-56018-3v9cb7.json`; nie uruchamiano kolejnego live runu.

## Guard i wywołujący

`applyMapBattleOutcome()` rozpoczyna z `siegeCaptureSucceeded = false`. Flaga staje się prawdziwa tylko wewnątrz warunku legalnego przejęcia miasta po `applyCityCaptureToMap`, gdy poprzedni owner jest znany, a `cityOnHex.ownerId` po operacji odpowiada atakującemu (`siegeContext === true`). Samo zwycięstwo, sam kontekst oblężenia ani nieudane/niezastosowane przejęcie nie wystarczają. Sync jednostek jest pomijany jedynie, gdy równocześnie ustawiono `deferUnitRenderSyncAfterSiegeCapture`.

Flaga defer jest domyślnie wyłączona. `finishSiegeStormBattle()` przekazuje ją do `applyMapBattleOutcome` wyłącznie z jawnej opcji, z dodatkowym warunkiem `atkOwner !== 0`. W inspekcji call site opcję ustawia tylko `executeSilentSiegeStorm()` dla cichego szturmu AI. Ręczny szturm gracza i auto-resolve z panelu nie ustawiają opcji. Pozostałe walki nie przekazują flagi; ścieżki porażki/remisu i zwycięstwa bez udanego capture zachowują wcześniejszy `syncUnitsRender()`.

Po pominiętym syncu `applyMapBattleOutcome()` nadal synchronicznie wykonuje `validateActiveSieges()` i wraca do `finishSiegeStormBattle()`. W sukcesie przejęcia `afterSiegeUi()` wywołuje `refreshMapAfterCityCapture()` przed powrotem ze stosu JS. Ta funkcja wykonuje końcowy `syncUnitsRender`, synchronizację miast, mgłę i HUD. Dla obrony i remisu caller wciąż wykonuje własne odświeżenia jednostek oraz mapy. Brak `await` lub oddania sterowania między apply wyniku a odświeżeniem caller-a potwierdza założenie o braku pośredniej klatki.

## Fixture i zakres dowodu

Harness ma bezpośredni tryb `STRESS_DIRECT_SIEGE_SCAN=1`, który buduje fixture ośmiu celów (cztery puste, cztery z obrońcą), deklaruje wojnę, uruchamia dokładnie skan oblężeń i zbiera zmiany ownera, callbacki capture oraz fazowe pomiary synców. Istniejący JSON potwierdza osiem zmian ownera i osiem callbacków; cztery bitwy z obrońcą odnotowały `applyMapBattleOutcome.syncUnitsRenderSkipped`, a każde z czterech przejęć miało dokładnie jeden zarejestrowany `refreshMapAfterCityCapture.syncUnitsRender`, `cityRenderer.sync` i `refreshFog`. Cztery puste przejęcia ominęły guard i użyły osobnej ścieżki capture. `errors` było puste.

To pokrywa bezpośrednio udany capture bronionego miasta i rozróżnia go od pustego capture. Fixture nie zawiera porażki, remisu, nieudanego capture ani obrony miasta. Zachowanie tych gałęzi wynika z inspekcji warunku i niezmienionych call sites, a nie z osobnego dynamicznego przypadku. Harness rejestruje wywołania rendererów oraz stan modelu, nie piksele ani widoczną geometrię klatki.

Raport 13 i raport 21 prawidłowo ograniczają wniosek wydajnościowy: wcześniejsza fixture wskazała około 0,41 s kosztu pierwszego syncu na bronione zdobycie. Obecny bezpośredni run potwierdza pominięcie i końcowe odświeżenie, ale nie dowodzi zysku w naturalnym EOT ani reprezentatywnego wzrostu FPS.

## Werdykt

**PASS-WITH-NOTES:** guard ma właściwy wąski zakres, jest uzależniony od faktycznej zmiany ownera, a caller wykonuje wymagane pełne odświeżenie przed oddaniem sterowania. Direct fixture potwierdza cztery pominięcia pierwszego syncu wyłącznie przy udanych przejęciach bronionych oraz cztery kompletne końcowe odświeżenia; ścieżki negatywne zachowują sync na podstawie statycznej inspekcji. Ograniczenia: brak dynamicznych przypadków porażki/remisu/nieudanego capture oraz brak dowodu pikselowego.
