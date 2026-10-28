# AutoBot Operator — walidacja pominięcia sync po udanym szturmie AI

**WERDYKT: PASS-WITH-NOTES**
**Zakres:** walidacja już zaimplementowanej optymalizacji w `gra/src/main.ts` i testowego instrumentowania w `gra/tools/perf-large-empire-stress-live-test.cjs`. Bez dalszych zmian produktu; bez push/deploy.

## Tożsamość badanych źródeł

- Repo HEAD przed walidacją: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
- Aktualny `src/main.ts` SHA-256: `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d`.
- Aktualny harness SHA-256: `75bfa86a42c70ff284c0de99c13731bbb4e0406f5e26f4475a2400698d1bc739`.
- Pełny niezatwierdzony diff `src/main.ts` względem HEAD SHA-256: `1c1279421076a9f23e01848a3c52ec40705c503cbe0e7fdf623559d257e76ad0` (plik zawiera też inne prace z tego runu; powyższy hash identyfikuje cały badany stan diffu).
- Live bundle SHA-256: `f2163b5821ee05afdbb4d2e25c4ed52701c74f3fa32e9b4c338111d7bf16741b`.
- Wynik maszynowy: `/tmp/large-empire-direct-siege-56018-3v9cb7.json`.

Wąski guard jest w `src/main.ts:29870`: `syncUnitsRender()` pomija się tylko gdy jawna opcja `deferUnitRenderSyncAfterSiegeCapture` oraz lokalne `siegeCaptureSucceeded` są prawdziwe. To drugie ustawiane jest wyłącznie po potwierdzeniu, że owner miasta po `applyCityCaptureToMap` jest właścicielem atakującego (`:29820–29825`). Opcja jest przekazywana przez `finishSiegeStormBattle` wyłącznie w wywołaniu cichego szturmu AI (`:31476–31477`, `:31553`), z dodatkowym warunkiem `atkOwner !== 0`. Wspólny domyślny zachowanie dla innych bitew pozostaje syncować jednostki.

Po pominięciu następuje synchronicznie `afterSiegeUi()`; dla przejętego miasta wywołuje ono `refreshMapAfterCityCapture()` (`:31424–31428`). Ta funkcja synchronizuje jednostki, miasta, mgłę, HUD i markery (`:31233–31248`). W tej ścieżce nie ma `await` między apply wyniku a odświeżeniem. Dla obrony gałąź `afterSiegeUi` zachowuje `syncUnitsRender()` (`:31440–31442`).

## Wykonanie i wyniki

`STRESS_BUILD_ONLY=1 node tools/perf-large-empire-stress-live-test.cjs 1` zakończył się PASS: Vite przekształcił 911 modułów, build trwał 19,41 s, a harness potwierdził poprawne zastosowanie instrumentacji. Artefakt build-only: `/tmp/large-empire-stress-55784-0nhm52/index.html`, 69 919,30 kB.

Wykonano dokładnie jeden live run: `STRESS_DIRECT_SIEGE_SCAN=1 STRESS_COMPACT=1 node tools/perf-large-empire-stress-live-test.cjs 1`. Nie uruchomiono EOT ani drugiego podejścia. Seeded fixture miała 137 miast, 180 ulepszeń, 57 jednostek przed skanem; osiem celów AI kontra miasta gracza (cztery puste i cztery z jednym obrońcą). Czas samego scanu wyniósł 15 445,1 ms: osiem cichych szturmów zajęło 15 441,3 ms. Cały skan trwał 19 674 ms według wall clock w JSON.

Wszystkie osiem miast (`city14`–`city21`) zmieniło ownera z 0 na 1; zarejestrowano osiem capture callbacków i osiem capture events. Cztery miasta z obrońcą wygrały bitwę atakującym. Dla każdego z nich harness odnotował `applyMapBattleOutcome.syncUnitsRenderSkipped` oraz potem dokładnie jeden `refreshMapAfterCityCapture.syncUnitsRender`, jeden `cityRenderer.sync` i jeden `refreshFog`. Końcowy `afterSiegeUi` trwał 1 620,9–1 706,7 ms; końcowe sync jednostek 353,2–374,7 ms. To potwierdza, że zwycięskie przejęcie nie utraciło końcowego odświeżenia renderu. Liczba jednostek spadła 57→53 po stratach; relacja pozostała `wojna`, `peaceLocked=false`; błędów strony/przeglądarki brak.

Cztery puste miasta użyły osobnej ścieżki `captureCityWithoutBattle` (1 881,1–2 162,5 ms na przejęcie). Nie są one przypadkami użycia tego guardu; zachowują własne pełne odświeżenie. Test harness rejestrował ich `syncUnitsRender`, `cityRenderer.sync` i `refreshFog`.

## Zakres dowodu i werdykt

Statyczny przepływ potwierdza, że gdy opcja jest wyłączona albo capture się nie powiedzie, warunek jest fałszywy i wspólny `syncUnitsRender()` nadal się wykona. Pozostałe calle `finishSiegeStormBattle` nie włączają flagi; optymalizacja została ograniczona do cichego szturmu AI. Sam live fixture nie wywołał porażki/remisu ani nieudanej obronionej capture, więc te przypadki potwierdzone są inspekcją guardu, nie oddzielnym dynamicznym testem.

**PASS-WITH-NOTES:** build i pojedynczy bezpośredni live scan potwierdzają zmianę ownera, pominięcie pierwszego syncu tylko przy udanym szturmie z obrońcą oraz końcowe `refreshMapAfterCityCapture` wraz z syncami jednostek/miast/mgły. Test potwierdza wywołania rendererów i stan modelu, ale nie porównuje pikseli ani geometrii widocznej sceny; brak też dynamicznej porażki/obrony w tej fixture. Wyniki dotyczą syntetycznego jednego skanu, nie naturalnego EOT ani typowego czasu rozgrywki.
